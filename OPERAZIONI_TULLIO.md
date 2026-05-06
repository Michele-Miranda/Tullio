# OPERAZIONI_TULLIO — Guida operativa per la messa in funzione

Questo documento descrive in modo prescrittivo tutti i passaggi per mettere in funzione **Tullio** in ambiente di sviluppo o produzione: account da creare, API key da generare, variabili ambiente, migrations, hosting. Va letto sequenzialmente — l'ordine è significativo (per esempio, devi creare il bucket R2 prima di inserire le sue chiavi nelle ENV del backend).

---

## 0. Prerequisiti locali

Sulla macchina dello sviluppatore o sul server di build:

| Strumento | Versione minima | Note |
|---|---|---|
| Node.js | 20.x LTS | Richiesto da Next 16 e dal backend |
| npm | 10+ | Incluso con Node |
| Git | 2.40+ | Per clonare e versionare |
| LibreOffice | 7.x+ | Solo lato backend, per conversione DOCX→PDF |
| OpenSSL | qualsiasi | Per generare token random (`openssl rand -base64 48`) |

Verifica con:

```bash
node --version
npm --version
git --version
soffice --version    # LibreOffice — su macOS: /Applications/LibreOffice.app/Contents/MacOS/soffice
```

---

## 1. Account e servizi da creare

Tullio dipende da 5 servizi cloud + 2 LLM provider. Tutti hanno un piano gratuito sufficiente per sviluppo e per primi utenti.

### 1.1 Supabase — database + autenticazione

1. Vai su [supabase.com](https://supabase.com) → **Sign up**.
2. Crea una nuova organizzazione (es. *Studio Legale Tullio*).
3. **Crea un nuovo progetto**:
   - **Region**: `Frankfurt (eu-central-1)` o `Paris (eu-west-3)` per residenza dati UE (importante per GDPR).
   - **Database Password**: usa un generatore (es. `openssl rand -base64 32`) e salvala nel password manager. Non ti servirà per Tullio (Tullio usa la service role key) ma serve per accesso diretto a Postgres.
   - **Pricing Plan**: Free è sufficiente per iniziare (500 MB DB, 1 GB storage, 50 MAU). Per produzione passa a Pro (~$25/mese: 8 GB DB, daily backups, point-in-time recovery).
4. **Abilita l'estensione `vector`** (necessaria per RAG):
   - Database → Extensions → cerca `vector` → Enable.
5. **Recupera le chiavi**:
   - Project Settings → API:
     - **Project URL** → andrà in `SUPABASE_URL` (backend) e `NEXT_PUBLIC_SUPABASE_URL` (frontend).
     - **anon / public key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (frontend, esposto al browser).
     - **service_role / secret key** → `SUPABASE_SECRET_KEY` (backend SOLO; mai esporla al frontend).

### 1.2 Cloudflare R2 — object storage

1. Vai su [dash.cloudflare.com](https://dash.cloudflare.com) → **Sign up** (o login se hai già un account).
2. Sidebar → **R2 Object Storage** → **Get started** (richiede una carta di pagamento ma il piano free è 10 GB/mese).
3. **Crea bucket**:
   - Nome: `tullio` (deve coincidere con `R2_BUCKET_NAME` nelle env, default `tullio`).
   - **Location hint**: `EEUR` (Europe) per residenza dati UE.
4. **Crea API token**:
   - R2 → Manage R2 API Tokens → **Create API Token**.
   - **Permissions**: `Object Read & Write` su `Specify bucket(s)` → seleziona `tullio`.
   - **TTL**: nessuna scadenza per dev, scadenza annuale per prod.
   - Copia subito (non saranno più mostrate):
     - **Access Key ID** → `R2_ACCESS_KEY_ID`
     - **Secret Access Key** → `R2_SECRET_ACCESS_KEY`
     - **Endpoint** → `R2_ENDPOINT_URL` (forma: `https://<account-id>.r2.cloudflarestorage.com`)

### 1.3 Anthropic Claude — provider LLM principale

1. Vai su [console.anthropic.com](https://console.anthropic.com) → **Sign up**.
2. Aggiungi un metodo di pagamento (richiesto anche per il free credit iniziale ~$5).
3. **API Keys** → Create Key → nome `tullio-prod` (o `tullio-dev`) → copia il valore.
4. La chiave inizia con `sk-ant-...` → va in `ANTHROPIC_API_KEY`.
5. **Limiti consigliati**:
   - Workspace → Limits → imposta un budget mensile (es. €50/mese per dev, €500/mese per prod) per evitare runaway.
6. **Modelli disponibili**: Tullio usa `claude-opus-4-7` per chat, `claude-haiku-4-5-20251001` per task batch. Verifica nei tuoi model settings di Tullio.

### 1.4 Google AI Studio — Gemini + embeddings

1. Vai su [aistudio.google.com](https://aistudio.google.com) → login con account Google.
2. **Get API key** → **Create API key in new project** → copia.
3. La chiave va in `GEMINI_API_KEY`.
4. **Quote**: il free tier è generoso (1500 req/giorno su `gemini-2.5-flash`, 50 req/min sulle embeddings). Per produzione, abilita la billing e passa al Paid Tier.
5. Tullio usa Gemini per:
   - Generative chat (`gemini-2.5-flash` / `gemini-2.5-pro`)
   - **Embeddings RAG** (`text-embedding-004`, 768d) — usato dal modulo `lib/embeddings.ts` per indicizzare i chunk dei documenti.

### 1.5 Resend — email transazionali

1. Vai su [resend.com](https://resend.com) → **Sign up**.
2. **Add Domain**: aggiungi il tuo dominio (es. `tullio.studiolegalexyz.it`) e configura i record DNS (SPF, DKIM, DMARC) come da istruzioni Resend.
   - Senza dominio verificato puoi solo inviare a indirizzi @resend.dev (utile solo per testing).
3. **API Keys** → Create → permessi `Sending access` su `<dominio>` → copia.
4. La chiave va in `RESEND_API_KEY`.
5. **Free tier**: 3.000 email/mese, 100/giorno. Il piano Pro è ~$20/mese per 50.000 email.

### 1.6 OpenRouter — fallback LLM provider (opzionale)

Tullio supporta anche OpenRouter come gateway multi-provider (utile per testare modelli alternativi). Non è obbligatorio.

1. [openrouter.ai](https://openrouter.ai) → Sign up → API Keys → Create.
2. Va in `OPENROUTER_API_KEY`.

### 1.7 Hosting (in produzione)

Scegli una combinazione:

| Frontend | Backend | Note |
|---|---|---|
| **Cloudflare Pages** + `@opennextjs/cloudflare` | **Cloudflare Workers** o **Fly.io** o **Railway** | Ottimo per latenza Italia (POP Milano) |
| **Vercel** | **Render** o **Fly.io** | Più semplice, leggermente più caro |
| **Self-hosted** (VPS Hetzner Falkenstein) | Stesso VPS (Docker) | Controllo totale, costo basso (~€10/mese) |

Tullio è già configurato per il deploy su Cloudflare via `@opennextjs/cloudflare` (`frontend/package.json` ha gli script `preview`, `deploy`, `upload`). Per backend puoi usare **Fly.io** o **Render** — entrambi supportano Docker e LibreOffice (richiesto per la conversione DOCX→PDF).

---

## 2. Variabili ambiente

### 2.1 Backend (`backend/.env`)

```bash
PORT=3001
FRONTEND_URL=https://tullio.tuodominio.it    # in dev: http://localhost:3000

# Supabase
SUPABASE_URL=https://abcdefghi.supabase.co
SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...    # service_role, MAI nel frontend

# Cloudflare R2
R2_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=tullio

# LLM
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
OPENROUTER_API_KEY=sk-or-...    # opzionale

# Email
RESEND_API_KEY=re_...

# Admin (per /admin/retention/run)
# Genera con: openssl rand -base64 48
ADMIN_API_TOKEN=k3m2K...lunghissimo
```

### 2.2 Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghi.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJhbGciOi...    # anon/publishable, OK esporlo
SUPABASE_SECRET_KEY=eyJhbGciOi...    # alcuni server-side actions del frontend usano la service_role
NEXT_PUBLIC_API_BASE_URL=https://api.tullio.tuodominio.it    # in dev: http://localhost:3001
```

> **NOTA SICUREZZA**: ogni variabile prefissata `NEXT_PUBLIC_` è inclusa nel bundle JavaScript del browser e quindi pubblica. Tutte le altre sono solo server-side. **Mai mettere `SUPABASE_SECRET_KEY` con prefisso `NEXT_PUBLIC_`**.

---

## 3. Migrations Supabase

Esegui questi file SQL in ordine, dall'editor SQL della dashboard Supabase (Settings → SQL Editor → New query → incolla → Run):

| Ordine | File | Cosa fa |
|---|---|---|
| 1 | `backend/migrations/000_one_shot_schema.sql` | Schema base: chats, projects, documents, document_versions, document_edits, workflows, tabular_reviews, ecc. |
| 2 | `backend/migrations/001_audit_governance.sql` | Tabella `model_invocations`, colonna `documents.uploaded_by`, tabella `citation_validation_failures`. |
| 3 | `backend/migrations/002_gdpr_retention.sql` | Funzione `tullio_run_retention(chat_days, audit_days)` per retention GDPR. |
| 4 | `backend/migrations/003_rag_pgvector.sql` | Estensione `vector`, tabella `document_chunks` (768d), RPC `tullio_search_chunks`. **Richiede che l'estensione `vector` sia abilitata in Supabase** (Database → Extensions). |

Dopo l'esecuzione, verifica con:

```sql
select count(*) from public.documents;             -- > 0 dopo il primo upload
select count(*) from public.model_invocations;     -- = 0 inizialmente
select extname from pg_extension where extname='vector';  -- 1 riga
```

---

## 4. Setup locale (sviluppo)

```bash
# 1. Clona il repo
git clone https://github.com/Michele-Miranda/Tullio.git
cd Tullio

# 2. Installa le dipendenze
npm install --prefix backend
npm install --prefix frontend --legacy-peer-deps

# 3. Configura le env
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
# poi edita entrambi e inserisci le chiavi reali

# 4. Esegui le 4 migrations su Supabase (vedi §3)

# 5. Avvia
# Terminal 1
npm run dev --prefix backend
# Terminal 2
npm run dev --prefix frontend
```

Apri `http://localhost:3000`. Crea un account (Supabase Auth invia email di conferma se hai abilitato la verifica via Resend). Carica un PDF e prova una chat.

---

## 5. Deploy in produzione

### 5.1 Frontend su Cloudflare Pages

```bash
cd frontend
npm run deploy    # esegue opennextjs-cloudflare build + deploy
```

Configura le env nella dashboard Cloudflare → Pages → Project → Settings → Environment variables (Production & Preview):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `SUPABASE_SECRET_KEY` (Production only, NON Preview)
- `NEXT_PUBLIC_API_BASE_URL` → URL del backend prod

### 5.2 Backend su Fly.io (consigliato per LibreOffice)

```bash
# Installa flyctl: curl -L https://fly.io/install.sh | sh
flyctl auth login

# Crea l'app (dalla cartella backend)
cd backend
flyctl launch --name tullio-api --region cdg    # cdg = Paris, eu

# Configura secrets
flyctl secrets set SUPABASE_URL="..." \
                   SUPABASE_SECRET_KEY="..." \
                   R2_ENDPOINT_URL="..." \
                   R2_ACCESS_KEY_ID="..." \
                   R2_SECRET_ACCESS_KEY="..." \
                   R2_BUCKET_NAME="tullio" \
                   ANTHROPIC_API_KEY="..." \
                   GEMINI_API_KEY="..." \
                   RESEND_API_KEY="..." \
                   ADMIN_API_TOKEN="..." \
                   FRONTEND_URL="https://tullio.tuodominio.it"

flyctl deploy
```

> **Importante**: il `Dockerfile` del backend deve installare LibreOffice. Esempio:
> ```dockerfile
> FROM node:20-bookworm-slim
> RUN apt-get update && apt-get install -y libreoffice --no-install-recommends \
>     && rm -rf /var/lib/apt/lists/*
> WORKDIR /app
> COPY package*.json ./
> RUN npm ci --omit=dev
> COPY . .
> RUN npm run build
> CMD ["node", "dist/index.js"]
> ```

### 5.3 Configurazione DNS

Nel pannello DNS del dominio (Cloudflare consigliato):

| Type | Name | Target | Proxy |
|---|---|---|---|
| CNAME | `tullio` (o `app`) | Cloudflare Pages URL | ✅ Proxied |
| CNAME | `api.tullio` | `tullio-api.fly.dev` | ✅ Proxied |

---

## 6. Schedulazione retention GDPR

La funzione `tullio_run_retention` cancella chat_messages oltre 365gg, model_invocations oltre 90gg, ecc. Va invocata periodicamente. Tre opzioni:

### Opzione A — `pg_cron` (Supabase Pro)

Da SQL editor:

```sql
-- Una volta sola
create extension if not exists pg_cron;

-- Schedula esecuzione giornaliera alle 03:00 UTC
select cron.schedule(
  'tullio-retention-daily',
  '0 3 * * *',
  $$ select public.tullio_run_retention(365, 90); $$
);
```

### Opzione B — GitHub Actions (gratis)

`.github/workflows/retention.yml`:

```yaml
name: GDPR retention
on:
  schedule:
    - cron: '0 3 * * *'    # ogni giorno alle 03:00 UTC
  workflow_dispatch:
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -fsS -X POST https://api.tullio.tuodominio.it/admin/retention/run \
            -H "X-Admin-Token: ${{ secrets.ADMIN_API_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{"chat_days": 365, "audit_days": 90}'
```

E aggiungi `ADMIN_API_TOKEN` nei GitHub Secrets del repo.

### Opzione C — Cron Linux

Se hai un VPS:

```bash
# crontab -e
0 3 * * * curl -fsS -X POST https://api.tullio.tuodominio.it/admin/retention/run -H "X-Admin-Token: $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{}'
```

---

## 7. Operazioni di sicurezza

### 7.1 Rotazione delle chiavi

| Chiave | Frequenza | Procedura |
|---|---|---|
| `SUPABASE_SECRET_KEY` | annuale | Dashboard Supabase → API → Generate new service_role key. Aggiornare le env. |
| `R2_*` | annuale | Crea nuovo token R2, aggiorna env, revoca il vecchio token. |
| `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` | semestrale | Crea nuova chiave, aggiorna env, revoca vecchia. |
| `ADMIN_API_TOKEN` | trimestrale | `openssl rand -base64 48`, aggiorna env del backend e dei consumer (cron). |

### 7.2 Monitoring

Dashboard SQL utili (nell'editor Supabase):

```sql
-- Utenti attivi ultimi 7gg
select count(distinct user_id) from public.model_invocations
where created_at > now() - interval '7 days';

-- Costi token approssimativi (ultimi 30gg, EUR — tassi indicativi)
select
  model,
  sum(input_tokens) as in_tok,
  sum(output_tokens) as out_tok,
  count(*) as calls
from public.model_invocations
where created_at > now() - interval '30 days'
group by model
order by in_tok desc;

-- Allucinazioni rilevate (citation failures)
select
  date_trunc('day', created_at) as day,
  status,
  count(*)
from public.citation_validation_failures
where created_at > now() - interval '30 days'
group by 1, 2 order by 1 desc;
```

Per dashboard più ricco considera **Supabase Studio** (incluso) o **Metabase** (self-hostato gratis).

### 7.3 Backup

- Supabase Pro fa backup giornalieri automatici (7gg di history) + point-in-time recovery.
- Per il piano Free, configura un backup esterno settimanale via `pg_dump` (script CI).
- R2 fa replicazione automatica fra POP; non serve backup manuale per i documenti.

---

## 8. Troubleshooting

| Sintomo | Causa probabile | Soluzione |
|---|---|---|
| `pg_extension vector not found` quando lanci 003_rag_pgvector.sql | Estensione vector non abilitata | Database → Extensions → abilita `vector` |
| `401 Unauthorized` sul frontend dopo login | `NEXT_PUBLIC_SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` errati | Ricontrolla in Dashboard Supabase → API |
| `415 File content does not match its extension` | Magic-byte check ha rilevato file fasullo | Comportamento atteso. Verifica che il file sia un PDF/DOCX valido |
| `429 Too many requests` su /chat | Rate limiter ha colpito | Aspetta 60s o aumenta `aiChatLimiter` in `middleware/rateLimit.ts` |
| Chiamata embedContent fallisce con 400 | Quote Gemini esaurite o API key non abilitata per embeddings | Verifica su [aistudio.google.com](https://aistudio.google.com) — abilita billing |
| `Document could not be read.` per DOCX | LibreOffice non installato sul backend o permessi mancanti | Installa LibreOffice nel container (vedi §5.2) |
| `tullio_run_retention does not exist` | Migration 002 non eseguita | Esegui `backend/migrations/002_gdpr_retention.sql` |

---

## 9. Checklist pre-produzione

Prima di esporre Tullio a clienti reali, verifica:

- [ ] Tutte e 4 le migrations applicate
- [ ] Estensione `vector` abilitata
- [ ] Region Supabase = UE
- [ ] R2 bucket location hint = EU
- [ ] `ADMIN_API_TOKEN` impostato e ruotato dal default
- [ ] Schedulazione retention attiva (§6)
- [ ] Domain Resend verificato (SPF/DKIM/DMARC)
- [ ] Limiti budget settati su Anthropic e Google
- [ ] Backup Supabase Pro o pg_dump esterno configurato
- [ ] HTTPS forzato sui domini front e api (Cloudflare proxy + Always Use HTTPS)
- [ ] DPA firmato con tutti i fornitori che processano dati personali (Supabase, Cloudflare, Anthropic, Google, Resend)
- [ ] Informativa privacy aggiornata sul sito (mention di AI processing ex art. 13 GDPR + L. 132/2025 art. 13 obbligo informativa client)
- [ ] Disclaimer "non è parere legale" visibile prima del primo uso
- [ ] Account demo non disponibile in produzione

---

## 10. Costi indicativi (mese)

Per uno studio piccolo con ~10 utenti attivi e ~1000 documenti/mese:

| Voce | Provider | Costo stimato |
|---|---|---|
| Database + Auth | Supabase Pro | €25 |
| Object storage (10–50 GB) | Cloudflare R2 | €1.50 (10 GB free, poi €0.015/GB) |
| LLM Anthropic Claude | API usage | €100–€300 (dipende da token) |
| LLM Google Gemini + embeddings | API usage | €30–€80 |
| Email | Resend Pro | €20 |
| Frontend hosting | Cloudflare Pages | €0 (free tier ampio) |
| Backend hosting | Fly.io shared CPU | €5–€15 |
| Dominio | qualsiasi registrar | €1 |
| **Totale** | | **~€180–€440/mese** |

Per studi più grandi (>50 utenti) considera Anthropic Enterprise (volume discount) e Supabase Team plan.

---

## Riferimenti rapidi

- Audit di sicurezza pre-rollout: `AUDIT_AI_GOVERNANCE.md`
- Roadmap integrazione fonti normative: `FONTI_NORMATIVE_INTEGRAZIONE.md`
- Roadmap localizzazione legale: `ADATTAMENTO_LEGAL_ITALIA.md`
- Mappa tecnica Mike upstream: `REPORT.md`

Per problemi non coperti qui, apri una issue su [github.com/Michele-Miranda/Tullio/issues](https://github.com/Michele-Miranda/Tullio/issues).
