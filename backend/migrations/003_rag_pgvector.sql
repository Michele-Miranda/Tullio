-- ---------------------------------------------------------------------------
-- 003_rag_pgvector.sql
--
-- Foundation di Retrieval-Augmented Generation (RAG) per documenti lunghi.
--
-- Architettura:
--   * `document_chunks` — chunk testuali derivati da ciascun documento
--     con il relativo embedding (Gemini text-embedding-004, 768d).
--   * Chunking lazy: il backend chunk-a + embedda solo on-demand quando il
--     modello chiama `semantic_search` su un doc che non ha ancora chunks.
--     Evita di pagare gli embedding all'upload se l'utente non ne ha
--     bisogno.
--   * Indice IVFFlat per similarity search efficiente. Il numero di liste
--     è scelto come ~sqrt(N): per ora 100 va bene fino a ~10k chunks; va
--     riallineato (REINDEX o nuovo index) quando il corpus cresce.
-- ---------------------------------------------------------------------------

create extension if not exists vector;

create table if not exists public.document_chunks (
    id uuid primary key default gen_random_uuid(),
    document_id uuid not null references public.documents(id) on delete cascade,
    version_id uuid references public.document_versions(id) on delete cascade,
    chunk_index integer not null,
    page integer,
    text text not null,
    /* Gemini text-embedding-004 returns 768-dim vectors by default. */
    embedding vector(768),
    created_at timestamptz not null default now(),
    constraint document_chunks_unique_per_version
        unique (document_id, version_id, chunk_index)
);

create index if not exists idx_document_chunks_document_id
    on public.document_chunks(document_id, chunk_index);

create index if not exists idx_document_chunks_version_id
    on public.document_chunks(version_id, chunk_index);

/* IVFFlat per cosine distance — adatto a corpus medi (~migliaia di chunks).
   Per corpus molto grandi (>1M chunks) valutare un HNSW index al suo posto. */
create index if not exists idx_document_chunks_embedding
    on public.document_chunks
    using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);

-- ---------------------------------------------------------------------------
-- Similarity search RPC.
--
-- Restituisce i top-K chunks più simili al query embedding, filtrando per
-- una lista di document_id. Usata da `lib/embeddings.ts:searchChunks`.
-- ---------------------------------------------------------------------------

create or replace function public.tullio_search_chunks(
    p_query vector,
    p_document_ids uuid[],
    p_top_k integer default 8
)
returns table (
    id uuid,
    document_id uuid,
    version_id uuid,
    chunk_index integer,
    page integer,
    text text,
    distance double precision
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select
        dc.id,
        dc.document_id,
        dc.version_id,
        dc.chunk_index,
        dc.page,
        dc.text,
        (dc.embedding <=> p_query)::double precision as distance
    from public.document_chunks dc
    where dc.document_id = any(p_document_ids)
      and dc.embedding is not null
    order by dc.embedding <=> p_query asc
    limit greatest(p_top_k, 1);
$$;

revoke all on function public.tullio_search_chunks(vector, uuid[], integer) from public;
revoke all on function public.tullio_search_chunks(vector, uuid[], integer) from anon, authenticated;
