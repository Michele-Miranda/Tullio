-- ---------------------------------------------------------------------------
-- 002_gdpr_retention.sql
--
-- GDPR-compliant retention policy.
--
-- L'art. 5(1)(e) del Reg. UE 2016/679 (GDPR) prescrive che i dati personali
-- siano conservati "in una forma che consenta l'identificazione degli
-- interessati per un arco di tempo non superiore al conseguimento delle
-- finalità per le quali sono trattati". Le tabelle di chat, log AI e
-- validation failures contengono potenzialmente dati personali (nomi,
-- contenuti di documenti, identificativi utente).
--
-- La funzione `tullio_run_retention` cancella in cascata tutto ciò che
-- supera due soglie configurabili:
--
--   * `p_chat_days`  — retention per cronologia chat e per i contenuti
--                      conversazionali con l'AI (default 365 giorni).
--   * `p_audit_days` — retention per log d'audit e validazione citazioni
--                      (default 90 giorni — bilanciamento tra forensics
--                      e privacy).
--
-- La funzione restituisce una tabella con il conteggio di righe eliminate
-- per ciascuna entità, utile per logging e per esporre il dato in admin UI.
--
-- Va invocata periodicamente (es. cron giornaliero) tramite uno dei
-- meccanismi documentati in OPERAZIONI_TULLIO.md (pg_cron, GitHub Actions
-- cron, endpoint /admin/retention/run).
-- ---------------------------------------------------------------------------

create or replace function public.tullio_run_retention(
    p_chat_days integer default 365,
    p_audit_days integer default 90
)
returns table (
    deleted_chat_messages bigint,
    deleted_tabular_chat_messages bigint,
    deleted_model_invocations bigint,
    deleted_citation_failures bigint,
    deleted_document_edits bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_chat_threshold timestamptz := now() - (p_chat_days || ' days')::interval;
    v_audit_threshold timestamptz := now() - (p_audit_days || ' days')::interval;
    v_deleted_chat_messages bigint := 0;
    v_deleted_tabular bigint := 0;
    v_deleted_invocations bigint := 0;
    v_deleted_failures bigint := 0;
    v_deleted_doc_edits bigint := 0;
begin
    -- 1. Chat messages più vecchi della soglia chat ----------------------
    with deleted as (
        delete from public.chat_messages
        where created_at < v_chat_threshold
        returning 1
    )
    select count(*) into v_deleted_chat_messages from deleted;

    -- 2. Messaggi di chat sulle Tabular Reviews --------------------------
    with deleted as (
        delete from public.tabular_review_chat_messages
        where created_at < v_chat_threshold
        returning 1
    )
    select count(*) into v_deleted_tabular from deleted;

    -- 3. Log delle invocazioni AI ----------------------------------------
    with deleted as (
        delete from public.model_invocations
        where created_at < v_audit_threshold
        returning 1
    )
    select count(*) into v_deleted_invocations from deleted;

    -- 4. Citation validation failures ------------------------------------
    with deleted as (
        delete from public.citation_validation_failures
        where created_at < v_audit_threshold
        returning 1
    )
    select count(*) into v_deleted_failures from deleted;

    -- 5. Document edits risolti più vecchi della soglia chat -------------
    -- Manteniamo gli edit pending per non rompere il flusso UX; cancelliamo
    -- solo quelli accepted/rejected oltre la soglia.
    with deleted as (
        delete from public.document_edits
        where status in ('accepted', 'rejected')
          and resolved_at is not null
          and resolved_at < v_chat_threshold
        returning 1
    )
    select count(*) into v_deleted_doc_edits from deleted;

    return query select
        v_deleted_chat_messages,
        v_deleted_tabular,
        v_deleted_invocations,
        v_deleted_failures,
        v_deleted_doc_edits;
end;
$$;

comment on function public.tullio_run_retention(integer, integer) is
'Esegue la GDPR retention policy: elimina chat_messages, tabular_review_chat_messages, model_invocations, citation_validation_failures e document_edits risolti più vecchi delle soglie passate. Restituisce i conteggi.';

-- Permessi: invocabile solo dal service-role di Supabase (default).
revoke all on function public.tullio_run_retention(integer, integer) from public;
revoke all on function public.tullio_run_retention(integer, integer) from anon, authenticated;
