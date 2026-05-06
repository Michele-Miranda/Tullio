# Tullio

Tullio è un assistente AI per studi legali italiani: analisi documentale, risposte basate su documenti caricati, generazione e revisione di contratti, revisioni tabellari di portafogli contrattuali. Il prodotto è un **fork di [Mike](https://github.com/willchen96/mike)** (AGPL-3.0), riadattato linguisticamente e giuridicamente al contesto italiano (Codice Civile, c.p.c., TUF/TUB, GDPR/D.Lgs. 196/2003, ecc.).

> Tullio è uno strumento di supporto. Le risposte non costituiscono parere legale ai sensi dell'art. 2230 c.c. e non sostituiscono la consulenza di un avvocato iscritto all'albo.

## Origine e attribuzioni

Questo progetto deriva da **Mike** di [@willchen96](https://github.com/willchen96/mike), distribuito sotto licenza AGPL-3.0. Le scelte architetturali (Next.js + Express + Supabase + Cloudflare R2 + Anthropic/Gemini), il sistema di citazioni inline, gli edit tracciati DOCX e il framework dei workflow sono di Mike. La fork Tullio aggiunge: localizzazione italiana, system prompt giuridico italiano, formati e validatori italiani, integrazioni roadmap (Normattiva, PEC, PCT), workflow specifici per il diritto italiano. Vedi `ADATTAMENTO_LEGAL_ITALIA.md` per il piano di adattamento completo e `REPORT.md` per la mappa tecnica del progetto upstream.

## Contenuti

- `frontend/` — applicazione Next.js (App Router, React 19, Tailwind 4, next-intl)
- `backend/` — API Express, accesso Supabase, document processing, migrations
- `backend/migrations/000_one_shot_schema.sql` — schema Supabase one-shot per database vuoti
- `frontend/messages/{it,en}.json` — traduzioni interfaccia
- `REPORT.md` — analisi tecnica completa del progetto upstream (Mike)
- `ADATTAMENTO_LEGAL_ITALIA.md` — roadmap di adattamento al mercato Legal italiano

## Setup

Installa le dipendenze:

```bash
npm install --prefix backend
npm install --prefix frontend
```

Crea i file `.env` locali a partire dagli esempi:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Esegui `backend/migrations/000_one_shot_schema.sql` nell'editor SQL di Supabase per un database pulito.

Avvia il backend:

```bash
npm run dev --prefix backend
```

Avvia il frontend:

```bash
npm run dev --prefix frontend
```

Apri `http://localhost:3000`.

## Servizi richiesti

- Supabase Auth e Postgres (regione UE consigliata: `eu-central-1` Francoforte o `eu-west-3` Parigi)
- Object storage S3-compatibile, tipicamente Cloudflare R2 con location hint EU
- Almeno una API key di un provider LLM supportato (Anthropic Claude, Google Gemini)
- LibreOffice per conversione DOC/DOCX → PDF

## Comandi di controllo

```bash
npm run build --prefix backend
npm run build --prefix frontend
npm run lint --prefix frontend
```

## Licenza

AGPL-3.0-only — eredità della licenza di Mike. Vedi `LICENSE`.
