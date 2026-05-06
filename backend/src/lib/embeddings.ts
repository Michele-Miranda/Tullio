/**
 * RAG embeddings module — chunking, embedding e similarity search.
 *
 * Provider: Google Gemini `text-embedding-004` (768d) tramite il SDK
 * `@google/genai` già usato per i modelli generativi. Tenere allineato il
 * dimensionality column del DB (`document_chunks.embedding vector(768)`)
 * se in futuro si cambia modello di embedding.
 *
 * Strategia di chunking:
 *   - Split per paragrafo, accumulando paragrafi in chunk di ~CHUNK_TARGET_CHARS
 *     caratteri ciascuno con un overlap di OVERLAP_CHARS.
 *   - Ogni chunk preserva la metainformazione di pagina (Page N) se presente
 *     nel testo originale, in modo che la citation pipeline a valle sia
 *     coerente con il formato già usato dal modello.
 *
 * Workflow lazy:
 *   1. Modello chiama il tool `semantic_search`.
 *   2. Se il documento non ha chunks per la versione attiva, il backend
 *      ne fa estrazione testo → chunking → embedding → insert.
 *   3. La query del modello viene embeddata (taskType: RETRIEVAL_QUERY) e
 *      cercata via cosine similarity su pgvector.
 */

import { GoogleGenAI } from "@google/genai";
import { createServerSupabase } from "./supabase";

const EMBED_MODEL = "text-embedding-004";
const EMBED_DIM = 768;
const CHUNK_TARGET_CHARS = 1200;
const OVERLAP_CHARS = 200;
/** Massimo numero di testi inviati in un singolo embedContent batch.
 *  L'API accetta fino a 100; teniamoci stretti per latenza/quote. */
const EMBED_BATCH_SIZE = 32;

function geminiClient(override?: string | null): GoogleGenAI {
    const apiKey = override?.trim() || process.env.GEMINI_API_KEY || "";
    return new GoogleGenAI({ apiKey });
}

export type DocumentChunk = {
    id: string;
    document_id: string;
    version_id: string | null;
    chunk_index: number;
    page: number | null;
    text: string;
    score?: number;
};

/**
 * Splitta `text` in chunk approssimativamente di CHUNK_TARGET_CHARS
 * caratteri, rispettando i confini di paragrafo e mantenendo un overlap
 * tra chunk consecutivi. Riconosce anche i marker `[Page N]` aggiunti
 * dall'extractor PDF per propagare la pagina al chunk.
 */
export function chunkText(text: string): { text: string; page: number | null }[] {
    const out: { text: string; page: number | null }[] = [];
    if (!text || !text.trim()) return out;

    /* Split prima per pagina (marker [Page N]) per preservare la metadata,
       poi all'interno della pagina per paragrafo / blank line. */
    const PAGE_RE = /\[Page (\d+)\]/g;
    type PageBlock = { page: number | null; body: string };
    const blocks: PageBlock[] = [];

    let lastIdx = 0;
    let lastPage: number | null = null;
    let m: RegExpExecArray | null;
    while ((m = PAGE_RE.exec(text)) !== null) {
        const before = text.slice(lastIdx, m.index);
        if (before.trim()) blocks.push({ page: lastPage, body: before });
        lastPage = parseInt(m[1], 10);
        lastIdx = m.index + m[0].length;
    }
    const tail = text.slice(lastIdx);
    if (tail.trim()) blocks.push({ page: lastPage, body: tail });
    if (!blocks.length) blocks.push({ page: null, body: text });

    for (const block of blocks) {
        const paragraphs = block.body
            .split(/\n\s*\n/)
            .map((p) => p.trim())
            .filter(Boolean);

        let buf = "";
        for (const p of paragraphs) {
            if (buf.length + p.length + 2 <= CHUNK_TARGET_CHARS) {
                buf = buf ? buf + "\n\n" + p : p;
            } else {
                if (buf) out.push({ text: buf, page: block.page });
                if (p.length <= CHUNK_TARGET_CHARS) {
                    buf = p;
                } else {
                    /* Paragrafo singolo enorme: spezza con overlap. */
                    let i = 0;
                    while (i < p.length) {
                        const slice = p.slice(i, i + CHUNK_TARGET_CHARS);
                        out.push({ text: slice, page: block.page });
                        i += CHUNK_TARGET_CHARS - OVERLAP_CHARS;
                    }
                    buf = "";
                }
            }
        }
        if (buf) out.push({ text: buf, page: block.page });
    }

    /* Aggiunge un overlap di OVERLAP_CHARS tra chunk consecutivi della
       stessa pagina, per ridurre il rischio che una sentence chiave cada
       proprio sul confine. */
    for (let i = 1; i < out.length; i++) {
        if (out[i].page === out[i - 1].page) {
            const prev = out[i - 1].text;
            const overlap = prev.slice(Math.max(0, prev.length - OVERLAP_CHARS));
            out[i] = { ...out[i], text: overlap + "\n\n" + out[i].text };
        }
    }

    return out;
}

/**
 * Embedda una lista di testi. Usa `RETRIEVAL_DOCUMENT` per chunks da
 * indicizzare e `RETRIEVAL_QUERY` per query a runtime.
 */
export async function embedTexts(
    texts: string[],
    taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY",
    apiKeyOverride?: string | null,
): Promise<number[][]> {
    if (!texts.length) return [];
    const ai = geminiClient(apiKeyOverride);
    const results: number[][] = [];
    for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
        const batch = texts.slice(i, i + EMBED_BATCH_SIZE);
        const resp = await ai.models.embedContent({
            model: EMBED_MODEL,
            contents: batch.map((t) => ({ role: "user", parts: [{ text: t }] })) as never,
            config: {
                taskType,
                outputDimensionality: EMBED_DIM,
            },
        });
        const embs = (resp as unknown as { embeddings?: { values?: number[] }[] }).embeddings;
        if (!embs) throw new Error("Gemini embedContent: response missing embeddings array");
        for (const e of embs) {
            if (!e?.values) {
                throw new Error("Gemini embedContent: embedding missing values");
            }
            results.push(e.values);
        }
    }
    return results;
}

/**
 * Costruisce e persiste i chunks per la versione attiva di un documento.
 * Idempotente: se i chunks già esistono per quella version_id, non fa nulla.
 *
 * Chiamare con il testo già estratto (PDF/DOCX) — il modulo non si occupa
 * di leggere il file da R2 perché quella logica è in chatTools/upload.
 */
export async function ensureDocumentChunks(opts: {
    db: ReturnType<typeof createServerSupabase>;
    documentId: string;
    versionId: string | null;
    fullText: string;
    apiKeyOverride?: string | null;
}): Promise<{ created: number; skipped: boolean }> {
    const { db, documentId, versionId, fullText, apiKeyOverride } = opts;

    /* Skip se già indicizzato per questa versione. */
    const { count } = await db
        .from("document_chunks")
        .select("id", { count: "exact", head: true })
        .eq("document_id", documentId)
        .eq("version_id", versionId);
    if ((count ?? 0) > 0) return { created: 0, skipped: true };

    const chunks = chunkText(fullText);
    if (!chunks.length) return { created: 0, skipped: true };

    const embs = await embedTexts(
        chunks.map((c) => c.text),
        "RETRIEVAL_DOCUMENT",
        apiKeyOverride,
    );
    if (embs.length !== chunks.length) {
        console.error(
            `[embeddings] ensureDocumentChunks dimension mismatch: chunks=${chunks.length} embeddings=${embs.length} for doc=${documentId}`,
        );
        return { created: 0, skipped: true };
    }

    const rows = chunks.map((c, i) => ({
        document_id: documentId,
        version_id: versionId,
        chunk_index: i,
        page: c.page,
        text: c.text,
        embedding: embs[i],
    }));

    const { error } = await db.from("document_chunks").insert(rows);
    if (error) {
        console.error("[embeddings] insert chunks failed:", error);
        return { created: 0, skipped: false };
    }
    return { created: rows.length, skipped: false };
}

/**
 * Cerca i top-k chunks più simili a `query` tra i documenti specificati.
 * Usa pgvector cosine distance. Restituisce i chunks insieme allo score
 * (1 - distance, quindi 1.0 = match perfetto).
 *
 * Nota: la query viene embedded con `RETRIEVAL_QUERY` task type per
 * massimizzare la cross-attention con i chunks indicizzati come
 * `RETRIEVAL_DOCUMENT`.
 */
export async function searchChunks(opts: {
    db: ReturnType<typeof createServerSupabase>;
    documentIds: string[];
    query: string;
    topK?: number;
    apiKeyOverride?: string | null;
}): Promise<DocumentChunk[]> {
    const { db, documentIds, query, topK = 8, apiKeyOverride } = opts;
    if (!documentIds.length || !query.trim()) return [];

    const [queryEmb] = await embedTexts(
        [query],
        "RETRIEVAL_QUERY",
        apiKeyOverride,
    );
    if (!queryEmb) return [];

    /* pgvector chiede la distance via operatore <=> (cosine).
       Lo passiamo via RPC su una funzione SQL dedicata creata nella
       migration; fallback su raw query se la funzione non esiste. */
    const { data, error } = await db.rpc("tullio_search_chunks", {
        p_query: queryEmb,
        p_document_ids: documentIds,
        p_top_k: topK,
    });
    if (error) {
        console.error("[embeddings] searchChunks RPC failed:", error);
        return [];
    }
    const rows = (data ?? []) as unknown as {
        id: string;
        document_id: string;
        version_id: string | null;
        chunk_index: number;
        page: number | null;
        text: string;
        distance: number;
    }[];
    return rows.map((r) => ({
        id: r.id,
        document_id: r.document_id,
        version_id: r.version_id,
        chunk_index: r.chunk_index,
        page: r.page,
        text: r.text,
        score: 1 - (r.distance ?? 1),
    }));
}
