-- ---------------------------------------------------------------------------
-- 001_audit_governance.sql
--
-- Hardening dell'audit trail in vista del deployment in studi legali:
--
--   1. `documents.uploaded_by` — traccia chi ha effettivamente caricato il
--      documento (può differire dal proprietario `user_id` in scenari di
--      condivisione tra collaboratori).
--   2. `model_invocations` — registro delle chiamate ai modelli AI con
--      conteggio token, latenza e stato. Necessario per audit GDPR (diritto
--      di accesso ex art. 15 Reg. UE 2016/679), forensics su allucinazioni
--      e cost management.
-- ---------------------------------------------------------------------------

-- 1. uploaded_by sui documenti -------------------------------------------------
alter table public.documents
    add column if not exists uploaded_by text;

create index if not exists idx_documents_uploaded_by
    on public.documents(uploaded_by);

-- 2. registro chiamate AI ------------------------------------------------------
create table if not exists public.model_invocations (
    id uuid primary key default gen_random_uuid(),
    user_id text,
    chat_id uuid,
    project_id uuid,
    workflow_id text,
    surface text not null,
    -- 'chat' | 'project_chat' | 'tabular' | 'tabular_cell' | 'completion' | 'other'
    model text not null,
    provider text not null,
    -- 'claude' | 'gemini'
    iterations integer not null default 1,
    input_tokens integer not null default 0,
    output_tokens integer not null default 0,
    latency_ms integer not null default 0,
    status text not null default 'ok',
    -- 'ok' | 'error'
    error_message text,
    created_at timestamptz not null default now(),
    constraint model_invocations_status_check
        check (status = any (array['ok'::text, 'error'::text]))
);

create index if not exists model_invocations_user_id_idx
    on public.model_invocations(user_id, created_at desc);

create index if not exists model_invocations_chat_id_idx
    on public.model_invocations(chat_id, created_at desc);

create index if not exists model_invocations_project_id_idx
    on public.model_invocations(project_id, created_at desc);

create index if not exists model_invocations_created_at_idx
    on public.model_invocations(created_at desc);

-- Citation validation failures (per forensics su allucinazioni) ----------------
-- Ogni volta che il backend rileva una citazione del modello con quote_not_found
-- o doc_not_found, la registra qui per analisi successive.
create table if not exists public.citation_validation_failures (
    id uuid primary key default gen_random_uuid(),
    user_id text,
    chat_id uuid,
    invocation_id uuid references public.model_invocations(id) on delete set null,
    doc_id text,
    document_id uuid,
    ref integer,
    page text,
    quote text,
    status text not null,
    -- 'quote_not_found' | 'doc_not_found' | 'skipped'
    created_at timestamptz not null default now(),
    constraint citation_validation_status_check
        check (status = any (array[
            'quote_not_found'::text,
            'doc_not_found'::text,
            'skipped'::text
        ]))
);

create index if not exists citation_validation_failures_user_idx
    on public.citation_validation_failures(user_id, created_at desc);

create index if not exists citation_validation_failures_chat_idx
    on public.citation_validation_failures(chat_id, created_at desc);
