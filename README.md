# Tullio

Tullio è un assistente AI per studi legali italiani: analisi documentale, risposte basate su documenti caricati, generazione e revisione di contratti, revisioni tabellari di portafogli contrattuali. Il prodotto è un **fork di [Mike](https://github.com/willchen96/mike)** (AGPL-3.0), riadattato linguisticamente e giuridicamente al contesto italiano (Codice Civile, c.p.c., TUF/TUB, GDPR/D.Lgs. 196/2003, ecc.).

> Tullio è uno strumento di supporto. Le risposte non costituiscono parere legale ai sensi dell'art. 2230 c.c. e non sostituiscono la consulenza di un avvocato iscritto all'albo.

## Origine e attribuzioni

Questo progetto deriva da **Mike** di [@willchen96](https://github.com/willchen96/mike), distribuito sotto licenza AGPL-3.0. Le scelte architetturali (Next.js + Express + Supabase + Cloudflare R2 + Anthropic/Gemini), il sistema di citazioni inline, gli edit tracciati DOCX e il framework dei workflow sono di Mike. La fork Tullio aggiunge: localizzazione italiana, system prompt giuridico italiano, workflow nativi del diritto italiano (TUB, L. 392/78, patti parasociali ex art. 2341-bis c.c., CCNL, ecc.), audit trail per compliance GDPR, hardening contro prompt injection, citation validation, foundation di RAG con pgvector. Vedi `ADATTAMENTO_LEGAL_ITALIA.md` per il piano di adattamento, `REPORT.md` per la mappa tecnica del progetto upstream, `AUDIT_AI_GOVERNANCE.md` per l'audit di sicurezza, `FONTI_NORMATIVE_INTEGRAZIONE.md` per il piano di integrazione con Normattiva.

## Contenuti

### Codice
- `frontend/` — applicazione Next.js (App Router, React 19, Tailwind 4, next-intl)
- `backend/` — API Express, accesso Supabase, document processing
- `backend/src/lib/promptSafety.ts` — sanitize + XML wrap del contenuto utente (anti prompt injection)
- `backend/src/lib/audit.ts` — logging delle chiamate AI e delle citation failures
- `backend/src/lib/embeddings.ts` — chunking + embedding (Gemini text-embedding-004) + similarity search (pgvector)
- `backend/src/middleware/rateLimit.ts` — rate limiting Express
- `backend/src/routes/admin.ts` — endpoint amministrativo (retention GDPR)
- `frontend/messages/{it,en}.json` — traduzioni interfaccia

### Migrations Supabase (eseguire in ordine)
- `backend/migrations/000_one_shot_schema.sql` — schema base (chats, documents, workflows, ecc.)
- `backend/migrations/001_audit_governance.sql` — `model_invocations`, `documents.uploaded_by`, `citation_validation_failures`
- `backend/migrations/002_gdpr_retention.sql` — funzione `tullio_run_retention(chat_days, audit_days)`
- `backend/migrations/003_rag_pgvector.sql` — extension `vector`, tabella `document_chunks`, RPC `tullio_search_chunks`

### Documentazione
- `OPERAZIONI_TULLIO.md` — **guida deploy completa** (account da creare, API key, env, hosting). Inizia da qui per il setup operativo.
- `REPORT.md` — analisi tecnica del progetto upstream Mike
- `ADATTAMENTO_LEGAL_ITALIA.md` — roadmap di adattamento legale italiano
- `AUDIT_AI_GOVERNANCE.md` — audit governance: audit trail, source grounding, anti-allucinazione, anti-injection
- `FONTI_NORMATIVE_INTEGRAZIONE.md` — integrazione Normattiva / EUR-Lex / Cassazione

## Setup rapido

```bash
npm install --prefix backend
npm install --prefix frontend

cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Eseguire 000 → 001 → 002 → 003 nell'editor SQL di Supabase
# Vedi OPERAZIONI_TULLIO.md per i dettagli

npm run dev --prefix backend
npm run dev --prefix frontend
```

Apri `http://localhost:3000`. Per la guida operativa completa con tutti i passaggi, le API key da generare e i settaggi di deploy, vedi **`OPERAZIONI_TULLIO.md`**.

## Servizi richiesti

- **Supabase** — Auth + Postgres (regione UE consigliata: `eu-central-1` Francoforte o `eu-west-3` Parigi). Estensione `pgvector` (per RAG).
- **Cloudflare R2** — object storage S3-compatibile con location hint EU.
- **Anthropic Claude** — provider LLM principale.
- **Google Gemini** — provider LLM alternativo + embeddings (text-embedding-004).
- **Resend** — invio email transazionali (inviti, notifiche).
- **LibreOffice** — installato sul server backend per conversione DOC/DOCX → PDF.

## Stato di sicurezza / governance

Tullio implementa:

- ✅ **Audit trail completo** — ogni chiamata AI loggata in `model_invocations` con token, latenza, costo, user_id, surface (chat / project_chat / tabular / tabular_cell).
- ✅ **Citation validation** — il backend verifica via substring-match che ogni `quote` citata esista letteralmente nel documento sorgente; le invalide finiscono in `citation_validation_failures`.
- ✅ **Anti prompt injection** — sanitize di pattern noti + wrap dei documenti utente in `<untrusted-document>`; system prompt istruisce il modello a trattarli come dati.
- ✅ **Anti-allucinazione baseline** — temperature 0.3, refusal guidance esplicita nel system prompt, disclaimer art. 2230 c.c.
- ✅ **Magic-byte upload validation** — i file caricati sono verificati a livello di magic bytes (`file-type`).
- ✅ **Rate limiting** — globale (300/min), AI chat (30/min), tabular (20/min) per utente o IP.
- ✅ **GDPR retention** — funzione SQL `tullio_run_retention` per cancellazione automatica oltre soglia.
- ✅ **RAG foundation** — pgvector + chunking + embedding lazy + tool `semantic_search`.

Per il dettaglio completo dello stato di hardening vedi `AUDIT_AI_GOVERNANCE.md`.

## Comandi di controllo

```bash
npm run build --prefix backend
npm run build --prefix frontend
npm run lint --prefix frontend
```

## Licenza

AGPL-3.0-only — eredità della licenza di Mike. Vedi `LICENSE`.
