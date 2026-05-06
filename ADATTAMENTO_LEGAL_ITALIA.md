# Adattamento di Mike al mercato Legal italiano

**Documento di analisi e roadmap tecnica**
**Progetto:** Mike (https://github.com/willchen96/mike)
**Obiettivo:** Trasformare la piattaforma — oggi cucita su common law UK/US — in un prodotto realmente utile per studi legali, uffici legali aziendali e professionisti italiani.

---

## Sintesi esecutiva

L'app è oggi cucita su common law UK/US: LMA-style credit agreements, SOFR/EURIBOR ratchets, SPA, drag/tag-along, SHA, NDA, LP Agreement. Per il mercato italiano serve un intervento su **5 piani**:

1. **Linguaggio AI** — system prompt, prompt di progetto, descrizioni tool
2. **Contenuti workflow** — la libreria builtin va riscritta
3. **Formati file** — supporto P7M, FatturaPA XML, OCR italiano
4. **Terminologia e modello dati** — CF, P.IVA, PEC, numero ruolo, foro, materia
5. **UI/UX e localizzazione** — i18n completo, format italiani, branding

Sotto: esattamente cosa toccare, file per file, con riferimenti a righe di codice puntuali.

---

## 1. Prompt e comportamento dell'AI (priorità massima)

Questi sono il cuore "legale" del prodotto e oggi sono tutti in inglese, con bias common law.

### 1.1 System prompt principale

**File:** `backend/src/lib/chatTools.ts` riga **78** (`export const SYSTEM_PROMPT`).

Cosa cambiare:

- **Lingua di default** → italiano. Aggiungere all'inizio: *"Rispondi sempre in italiano, salvo richiesta esplicita di altra lingua."*
- **Riferimento normativo** → introdurre un blocco `ITALIAN LAW CONTEXT`:
  - Codice Civile, Codice di Procedura Civile, Codice Penale, Codice del Lavoro
  - D.Lgs. 231/2001 (responsabilità amministrativa enti)
  - D.Lgs. 196/2003 (Privacy) + GDPR/Reg. UE 2016/679
  - Codice del Consumo (D.Lgs. 206/2005)
  - TUF (D.Lgs. 58/1998), TUB (D.Lgs. 385/1993)
  - Codice della Crisi d'Impresa (D.Lgs. 14/2019)
  - Codice Antimafia (D.Lgs. 159/2011)
  - Istruzione a citare con la convenzione italiana: *"art. 1322, secondo comma, c.c."*, *"art. 2697 c.c."*, *"D.Lgs. 231/2001, art. 6"*.
- **Citazione giurisprudenziale** italiana:
  - *"Cass. civ., sez. III, 12 marzo 2024, n. 6789"*
  - *"Cass. SS.UU., …"*
  - *"Cons. Stato, sez. V, …"*
  - *"TAR Lazio, sez. I, …"*
- **Convenzioni di drafting italiano**:
  - Clausole vessatorie ex artt. 1341/1342 c.c. con doppia sottoscrizione
  - "Premesso che" / "Considerato che" / "Tutto ciò premesso, le Parti convengono e stipulano quanto segue:"
  - Articoli numerati come "Art. 1 – (Oggetto)" anziché "Section 1"
- **Disclaimer** italiano e GDPR-aware:
  *"Le risposte non costituiscono parere legale ex art. 2230 c.c. e non sostituiscono la consulenza di un avvocato iscritto all'albo."*
- **Privacy by design**: istruzione a non riprodurre nel chat-output dati personali identificativi non strettamente necessari, e a segnalare quando un documento contiene categorie particolari ex art. 9 GDPR.

### 1.2 PROJECT_SYSTEM_PROMPT_EXTRA

**File:** `backend/src/routes/projectChat.ts` riga **17**.

Tradurre e rendere "matter-aware" sul contesto italiano: *"il progetto contiene un fascicolo legato a una pratica/operazione: contratti, atti, perizie, visure, corrispondenza PEC."*

### 1.3 Prompt nei workflow builtin (backend)

**File:** `backend/src/lib/builtinWorkflows.ts` (3 workflow). Tutti in inglese e UK-style. Sostituirli o affiancarli con equivalenti italiani — vedi sezione 2.

### 1.4 Prompt nei workflow builtin (frontend)

**File:** `frontend/src/app/components/workflows/builtinWorkflows.ts` (oggi 14 workflow):

- Generate CP Checklist
- Change of Control Review
- Credit Agreement Summary / Review
- Commercial Agreement Review
- E-Discovery Review
- Supply Agreement Review
- SPA Review
- NDA Review
- Commercial Lease Review
- Limited Partnership Agreement Review
- Shareholder Agreement Summary / Review
- Employment Agreement Review

Tutti UK/US. Da rimpiazzare con la libreria italiana (sezione 2).

### 1.5 Tool descriptions

Le `description` dei tool in `chatTools.ts` (`generate_docx`, `edit_document`, `read_document`, `find_in_document`, `replicate_document`, `generate_tabular_cell_value`, `list_documents`, `fetch_documents`) sono in inglese.

**Non vanno tradotte** (sono semantica per il modello), ma vanno arricchite con istruzioni italiane: es. in `generate_docx` aggiungere

> *"Se l'utente non specifica diversamente, struttura i contratti in formato italiano: 'Tra le Parti', 'Premesso che', 'Tutto ciò premesso si conviene quanto segue:', articoli numerati, clausola finale con doppia sottoscrizione ex artt. 1341/1342 c.c. quando applicabile."*

---

## 2. Workflow builtin: la libreria italiana

Sostituire (o affiancare) i 14 workflow esistenti con questi, mantenendo la stessa struttura (`id`, `title`, `practice`, `prompt_md`, `columns_config` per i tabular).

### 2.1 Practice areas italiane

Cambiare l'enum `practice` in entrambi i file `builtinWorkflows.ts`:

| Attuale (EN) | Sostituire con (IT) |
|---|---|
| Corporate | Diritto Societario |
| Finance | Diritto Bancario e Finanziario |
| Litigation | Contenzioso e Arbitrato |
| Real Estate | Diritto Immobiliare |
| Private Equity | M&A e Private Equity |
| Employment | Diritto del Lavoro |
| General Transactions | Contrattualistica Commerciale |
| — | Diritto Amministrativo (nuovo) |
| — | Diritto Tributario (nuovo) |
| — | Diritto della Crisi d'Impresa (nuovo) |
| — | Privacy e Data Protection (nuovo) |
| — | Compliance 231 (nuovo) |

### 2.2 Workflow tipici italiani da aggiungere

**Tabular reviews** (per due diligence di portafoglio):

- **Due Diligence Contrattuale** — clausole rilevanti, change of control, decadenze, esclusive
- **Riepilogo Contratti di Locazione Commerciale** — canone, durata, rinnovo, indicizzazione ISTAT, cedolare, registrazione
- **Riepilogo Contratti di Lavoro** — CCNL applicato, mansione, livello, RAL, patto di non concorrenza, periodo prova
- **Visure camerali** — sede legale, P.IVA, codice fiscale, capitale sociale, organo amministrativo, soci, procure
- **Verbali assembleari** — data, quorum costitutivo/deliberativo, deliberazioni
- **Polizze e garanzie** — massimali, franchigie, esclusioni
- **Decreti ingiuntivi / atti di citazione** — parti, petitum, causa petendi, foro, valore della causa

**Assistant workflows** (one-shot):

- **Sintesi Sentenza** (Cass./Cons. Stato/TAR) → struttura: parti, fatto, motivi della decisione, principio di diritto, dispositivo
- **Riassunto Atto Giudiziario** (citazione, comparsa di costituzione, ricorso) con valore della causa, foro, eccezioni preliminari
- **Generazione Atto** — lettera di diffida, costituzione in mora, recesso, contestazione disciplinare ex art. 7 St. Lav.
- **Verifica Clausole Vessatorie** — artt. 33-38 Cod. Cons. + 1341/1342 c.c. (particolarmente utile B2C)
- **Modello 231 check** — matrice rischio-reato, flussi informativi all'OdV
- **DPIA / Registro Trattamenti** generator — artt. 30 e 35 GDPR
- **Privacy Policy / Cookie Policy** generator — Provv. Garante 10/06/2021 cookie
- **Riassunto Bilancio** + analisi indicatori della crisi ex CCII

### 2.3 Trasformare i workflow esistenti

| Workflow EN | Versione italiana |
|---|---|
| CP Checklist | Checklist Condizioni Sospensive (closing M&A italiano: visura aggiornata, delibera CdA/assemblea, comfort letter notarile, antitrust AGCM, golden power se applicabile) |
| Credit Agreement Summary | Sintesi Contratto di Finanziamento (richiama TUB, art. 117 trasparenza, ius variandi, usura ex L. 108/96, EURIBOR, parametro sostitutivo) |
| SHA Summary | Sintesi Patti Parasociali (durata max 5 anni ex art. 2341-bis c.c., diritti di prelazione, gradimento, drag/tag, exit, deadlock) |
| SPA Review | Review Contratto di Compravendita Partecipazioni (representations & warranties → "dichiarazioni e garanzie", indennizzi, escrow, MAC clause, claims period) |
| NDA Review | Review Accordo di Riservatezza (durata segretezza, perimetro, clausola penale ex art. 1382 c.c.) |
| Commercial Lease | Review Contratto di Locazione (L. 392/78, durata 6+6 commerciale o 4+4 abitativo, registrazione, cedolare secca per uso abitativo, ISTAT, recesso conduttore) |
| Employment Agreement | Review Contratto di Lavoro (CCNL, livello/qualifica, periodo di prova ex art. 2096 c.c., patto di prova, patto di non concorrenza ex art. 2125 c.c., clausole di stabilità) |
| LPA Review | Review Regolamento di Gestione SGR / Patti di Investimento (richiamo TUF) |
| E-Discovery | Disclosure documentale art. 210 c.p.c. + ordine di esibizione |

---

## 3. Localizzazione UI (i18n)

Oggi le stringhe UI sono **hard-coded in inglese** sparse in tutti i componenti. Esempi visti:

- `frontend/src/app/components/assistant/InitialView.tsx`:74 → `"Hi, {username}"`
- `frontend/src/app/components/assistant/InitialView.tsx`:87 → `"AI can make mistakes. Answers are not legal advice."`
- Tutti i bottoni, label, placeholder, modal in `components/`

### 3.1 Introdurre i18n

Stack consigliato per Next.js 16 App Router: **`next-intl`** (più allineato a App Router rispetto a `next-i18next`).

```bash
npm i next-intl --prefix frontend
```

1. Creare `frontend/messages/it.json` e `frontend/messages/en.json`
2. Wrap del root layout con `NextIntlClientProvider`
3. Sostituire ogni stringa con `t("namespace.key")`

File da toccare in modo sistematico (ricerca/sostituzione):

- `frontend/src/app/components/**/*.tsx` (tutti)
- `frontend/src/app/(pages)/**/page.tsx`
- `frontend/src/app/login/page.tsx`, `frontend/src/app/signup/page.tsx`
- Messaggi di errore in `frontend/src/app/lib/mikeApi.ts`

### 3.2 Date, numeri, valuta

- **Date**: `Intl.DateTimeFormat("it-IT")` → `gg/mm/aaaa`
- **Numeri**: separatore decimale virgola, migliaia punto (`Intl.NumberFormat("it-IT")`)
- **Valuta**: default EUR (`{ style: "currency", currency: "EUR" }`)

Centralizzare in un nuovo `frontend/src/lib/format.ts`.

### 3.3 Tipografia

Il root layout (`frontend/src/app/layout.tsx`) carica **EB Garamond** + **Inter**: ottime per testi italiani, lasciare. Verificare però che i testi italiani (mediamente ~20% più lunghi) non rompano i layout fissi nei componenti — controllare in particolare `AppSidebar.tsx`, modals, bottoni.

---

## 4. Formati file e processing documenti

### 4.1 Estendere `ALLOWED_TYPES`

**File:** `backend/src/routes/documents.ts` riga **28** e `backend/src/routes/projects.ts` riga **15**.

Oggi: `["pdf", "docx", "doc"]`. Aggiungere:

- **`p7m`** — firma digitale CAdES (PEC, atti notarili telematici, depositi PCT)
- **`pdf` con firma PAdES** — già supportato come PDF, ma serve estrazione/validazione firma
- **`xml`** — fatture elettroniche (FatturaPA), atti SDI
- **`eml` / `.msg`** — corrispondenza PEC archiviata
- Opzionale: `rtf`, `odt`, `xlsx` (visure in Excel da CCIAA)

### 4.2 Nuovo modulo: gestione P7M

Creare `backend/src/lib/p7m.ts`:

- Estrarre il payload firmato (PKCS#7) usando `node-forge` o `@peculiar/asn1-cms`
- Validare il certificato contro le **TSL italiane** (AgID/EU Trusted List)
- Estrarre metadati firmatario (CF, ragione sociale)
- Restituire il documento "scoperto" da passare a `convert.ts` per anteprima PDF

### 4.3 Visure camerali e XML SDI

Creare `backend/src/lib/italianDocs.ts`:

- Parser XML FatturaPA → estrazione automatica di `cessionario`, `prestatore`, `imponibile`, `IVA`, riferimenti
- Parser visura PDF → regex su sezioni standard ("DENOMINAZIONE", "CODICE FISCALE", "CAPITALE SOCIALE", "AMMINISTRATORI")
- Esporre come tool LLM (`extract_visura`, `extract_fattura_xml`) registrato in `chatTools.ts`

### 4.4 OCR

Molti atti italiani arrivano scansionati (notifiche cartacee, vecchi contratti). Oggi il viewer mostra il PDF ma il testo non è indicizzato se è immagine. Aggiungere:

- **Tesseract.js** (lato backend) o **Google Document AI** / **Azure Document Intelligence** in italiano
- Trigger: in `documents.ts` quando `page_count > 0` ma il testo estratto è vuoto/sotto soglia
- Salvare l'OCR in `documents.structure_tree` o nuova colonna `ocr_text`

---

## 5. Schema dati e modello dominio

**File:** `backend/migrations/000_one_shot_schema.sql`. Aggiungere colonne italiane via nuova migration `001_italian_fields.sql`.

### 5.1 `user_profiles` — nuovi campi

```sql
ALTER TABLE user_profiles
  ADD COLUMN codice_fiscale TEXT,
  ADD COLUMN partita_iva TEXT,
  ADD COLUMN albo_avvocati TEXT,        -- es. "Roma n. 12345"
  ADD COLUMN pec_email TEXT,
  ADD COLUMN studio_legale TEXT,
  ADD COLUMN locale TEXT DEFAULT 'it-IT';
```

### 5.2 `projects` — adattare al fascicolo italiano

```sql
ALTER TABLE projects
  ADD COLUMN cliente_nome TEXT,
  ADD COLUMN cliente_cf_piva TEXT,
  ADD COLUMN controparte TEXT,
  ADD COLUMN materia TEXT,              -- enum practice italiana
  ADD COLUMN numero_ruolo TEXT,         -- per cause: R.G. n. ... / anno
  ADD COLUMN tribunale TEXT,
  ADD COLUMN valore_causa NUMERIC;
```

Il campo `cm_number` (matter number) può essere mantenuto come "numero pratica interno".

### 5.3 Nuova tabella `clients` (anagrafica clienti)

Utile per studi: clienti riutilizzabili tra progetti, con CF, P.IVA, sede, PEC, referente.

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  ragione_sociale TEXT NOT NULL,
  codice_fiscale TEXT,
  partita_iva TEXT,
  sede_legale TEXT,
  pec TEXT,
  email TEXT,
  telefono TEXT,
  referente TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.4 Tipi TS frontend

**File:** `frontend/src/app/components/shared/types.ts`. Aggiornare `MikeProject` con i nuovi campi e creare `MikeClient`.

---

## 6. Validatori e widget italiani

Creare `frontend/src/lib/italianValidators.ts`:

- `isValidCodiceFiscale(cf)` — algoritmo CF a 16 caratteri (controllo lettere/numeri + carattere di controllo)
- `isValidPartitaIVA(piva)` — algoritmo Luhn modificato a 11 cifre
- `isValidPEC(email)` — RFC + warn se dominio non in elenco PEC notori (`pec.it`, `legalmail.it`, `arubapec.it`, ecc.)
- `isValidIBAN(iban)` italiano (IT + 25 caratteri)
- `formatNumeroRuolo(rg, anno)` → "R.G. 1234/2025"

Componenti: `CodiceFiscaleInput.tsx`, `PartitaIvaInput.tsx`, `PecInput.tsx` in `frontend/src/app/components/ui/` con auto-formatting e validation in tempo reale.

---

## 7. Modelli LLM e API

**File:** `backend/src/lib/llm/models.ts`.

- Tutti i modelli (Claude/Gemini) supportano l'italiano nativamente, **non serve cambiarli**.
- Per testi giuridici lunghi, **Opus 4.7 con extended thinking** è la scelta migliore (già attivo in `claude.ts`).
- Considerare un endpoint config che forzi `temperature` più bassa (0.2-0.3) per task legali italiani — meno creatività, più aderenza al testo. Aggiungere parametro in `streamChatWithTools`.
- **Output token limit**: contratti italiani sono prolissi, valutare `max_tokens` più alto per `generate_docx`.

---

## 8. Generazione DOCX in stile italiano

**File:** `backend/src/lib/chatTools.ts` (tool `generate_docx`) → la libreria `docx` viene usata per costruire il file.

Cosa adattare:

- **Margini**: 2,5 cm (standard italiano forense), non 1 inch
- **Font default**: Times New Roman 12 (atti giudiziari) o Garamond 11 (contrattualistica)
- **Interlinea**: 1,15 o 1,5
- **Numerazione articoli**: "Art. 1 – (Oggetto)" con tab e parentesi tonde, non "Section 1"
- **Recital**: "Premesso che" / "Considerato che" / "Tutto ciò premesso, le Parti convengono e stipulano quanto segue:"
- **Footer firma**: due sottoscrizioni distinte per clausole vessatorie ex artt. 1341/1342 c.c. — aggiungere nel system prompt e nella pipeline di `generate_docx` un parametro `vexedClauses: string[]` che genera il blocco doppia firma
- **Marca da bollo / repertorio**: campi opzionali per atti notarili e contratti soggetti a registrazione
- **Note**: gli atti giudiziari italiani usano la numerazione punto-elenco "1)", "1.1)" — non "1.", "1.1"

Aggiungere preset `documentStyle: "italianContract" | "italianPleading" | "italianNotice"` nel tool `generate_docx`.

---

## 9. Tracked changes / "modifiche con revisione"

**File:** `backend/src/lib/docxTrackedChanges.ts`. Word italiano usa naming `<w:ins w:author="…">` identico, non servono modifiche al parser.

Adattare però:

- Il tool `edit_document` nel system prompt deve produrre messaggi di motivazione (`reason` field) **in italiano**.
- L'UI di accept/reject (`DocPanel.tsx`) deve mostrare etichette "Accetta modifica" / "Rifiuta modifica" / "Modificato da Mike".

---

## 10. Privacy, GDPR e residenza dati

Per uno studio legale italiano la residenza dei dati è critica.

### 10.1 Hosting

- **Supabase**: usare regione **`eu-west-3` (Parigi)** o **`eu-central-1` (Francoforte)** — verificare in dashboard Supabase del cliente.
- **Cloudflare R2**: location hint `EU` (configurato lato bucket creation).
- **Vercel/Cloudflare Pages**: deploy con region pinning `fra1` / `cdg1`.

### 10.2 Provider LLM

- **Claude (Anthropic)**: ha endpoint AWS Bedrock EU (Ireland/Frankfurt) — considerare migrazione da diretta API ad AWS Bedrock per mantenere dati in UE. Modificare `backend/src/lib/llm/claude.ts` per usare `@aws-sdk/client-bedrock-runtime` come opzione.
- **Gemini (Google)**: Vertex AI ha regioni EU (`europe-west1`, `europe-west4`). Modificare `backend/src/lib/llm/gemini.ts` con SDK Vertex.
- **DPA**: pubblicare DPA con sub-processor list (Anthropic, Google, Cloudflare, Supabase) accessibile dall'app.

### 10.3 Trattamento dati documenti

- Aggiungere middleware `backend/src/middleware/audit.ts` che logga ogni `read_document`, `download` con userId, ip, timestamp → tabella `audit_log` (richiesto per molte clientele bancarie/PA).
- Aggiungere flag `retention_days` su `documents` con job di cancellazione automatica.
- **Diritto all'oblio**: completare l'endpoint `DELETE /user/account` perché cancelli davvero tutti i record relazionati (oggi cancella solo `auth.users` via Supabase — verificare cascade su `projects`, `documents`, `chats`).
- **Export dati (art. 20 GDPR portabilità)**: nuovo endpoint `GET /user/export` che produce ZIP con tutto (chat, doc metadati, signed URLs).

### 10.4 Conservazione obbligatoria

Atti giudiziari e fascicoli professionali: l'avvocato deve conservare 10 anni (art. 2946 c.c., e CNF). Aggiungere flag `legal_hold` su progetti che disabilita la cancellazione.

---

## 11. Integrazioni italiane (roadmap)

Servizi/connettori che renderebbero il prodotto realmente competitivo in Italia:

| Integrazione | Cosa fa | Dove agganciarla |
|---|---|---|
| **InfoCamere / Telemaco** | Recupero visure, bilanci CCIAA via API | nuovo `backend/src/lib/integrations/infocamere.ts` + tool LLM `fetch_visura(piva)` |
| **PCT (Processo Civile Telematico)** | Deposito atti, consultazione fascicolo | `backend/src/lib/integrations/pct.ts` (richiede smart card / token CNS) |
| **PEC** (Aruba/Namirial/InfoCert) | Invio diffide, notifiche | `backend/src/lib/integrations/pec.ts`, sostituire/affiancare Resend |
| **Marca temporale** | Time-stamping documenti generati | `backend/src/lib/integrations/timestamp.ts` (RFC 3161) |
| **Agenzia Entrate** | Verifica P.IVA, registrazione contratti | `lib/integrations/agenziaEntrate.ts` |
| **Italgiure / DeJure / OneLEGALE** | Banche dati giurisprudenza | tool LLM `search_jurisprudence(query)` |
| **Normattiva** | Testi normativi ufficiali, vigenza | tool LLM `fetch_norma(citation)` con scraping JSON dell'API XML |
| **AGID SPID/CIE** | Login forte alternativo a email/password | nuovo provider in `frontend/src/contexts/AuthContext.tsx` + Supabase custom auth |

**Normattiva** in particolare è fondamentale: dare al modello accesso al testo aggiornato delle norme (con vigenza alla data) elimina molte allucinazioni. È la prima integrazione da fare.

---

## 12. Branding e copy

**File:** `frontend/src/app/components/chat/mike-icon.tsx`, `frontend/src/components/site-logo.tsx`, `README.md`.

- Il nome **"Mike"** è ok in Italia (suona internazionale, non blocca).
- Tagline: da *"AI legal assistant"* → *"L'assistente AI per lo studio legale italiano"* o equivalente.
- Disclaimer obbligatorio in ogni pagina con AI: *"Mike è uno strumento di supporto. Le risposte non costituiscono parere legale ai sensi dell'art. 2230 c.c."*
- README → versione italiana parallela `README.it.md`.
- Email transazionali (Resend) → template italiani.

---

## 13. Roadmap di implementazione consigliata

Fasi in ordine di ROI:

### Fase 1 — Localizzazione minima (1-2 settimane)

1. SYSTEM_PROMPT in italiano + ITALIAN LAW CONTEXT (`chatTools.ts`)
2. PROJECT_SYSTEM_PROMPT_EXTRA tradotto (`projectChat.ts`)
3. UI i18n con `next-intl` (tutti i componenti `.tsx`)
4. Format date/numeri/valuta italiani
5. Disclaimer e copy aggiornati

### Fase 2 — Workflow italiani (2-3 settimane)

6. Riscrittura/aggiunta workflow builtin (`builtinWorkflows.ts` × 2)
7. Practice areas italiane
8. Stile DOCX italiano in `generate_docx`

### Fase 3 — Schema e validatori (1 settimana)

9. Migration `001_italian_fields.sql`
10. Nuovi tipi TS e validatori CF/P.IVA/PEC/IBAN
11. Form aggiornati (NewProjectModal, account settings)

### Fase 4 — Formati e GDPR (2-3 settimane)

12. Supporto P7M, XML SDI, OCR italiano
13. Audit log, retention policy, export GDPR
14. Hosting EU + Bedrock/Vertex EU

### Fase 5 — Integrazioni (a seguire, modulari)

15. **Normattiva** come tool LLM (priorità #1 fra le integrazioni)
16. PEC, marca temporale, InfoCamere, PCT
17. SPID/CIE login

---

## 14. Checklist sintetica file da modificare

| Area | File |
|---|---|
| Prompt AI | `backend/src/lib/chatTools.ts` (riga 78), `backend/src/routes/projectChat.ts` (riga 17) |
| Workflow | `backend/src/lib/builtinWorkflows.ts`, `frontend/src/app/components/workflows/builtinWorkflows.ts` |
| File types | `backend/src/routes/documents.ts` (riga 28), `backend/src/routes/projects.ts` (riga 15) |
| DB schema | `backend/migrations/` (nuova migration 001) |
| Tipi TS | `frontend/src/app/components/shared/types.ts` |
| i18n | tutti i `.tsx` in `frontend/src/app/components/**` e `frontend/src/app/(pages)/**` + nuovo `frontend/messages/it.json` |
| Format | nuovo `frontend/src/lib/format.ts` |
| Validatori | nuovo `frontend/src/lib/italianValidators.ts` |
| DOCX gen | `backend/src/lib/chatTools.ts` (logica `generate_docx`) |
| LLM regioni | `backend/src/lib/llm/claude.ts`, `backend/src/lib/llm/gemini.ts` |
| Integrazioni nuove | nuova cartella `backend/src/lib/integrations/` (infocamere, pec, normattiva, ...) |
| README | `README.md` + nuovo `README.it.md` |

---

## 15. Punti di partenza consigliati

Il SYSTEM_PROMPT italianizzato + i workflow builtin riscritti danno il salto qualitativo più visibile in poco tempo. In ordine pratico:

1. **Primo commit** — riscrittura `SYSTEM_PROMPT` in `backend/src/lib/chatTools.ts` con blocco "ITALIAN LAW CONTEXT" e disclaimer art. 2230 c.c.
2. **Secondo commit** — sostituzione 3 workflow builtin nel backend (`builtinWorkflows.ts`) con CP Italia, Sintesi Finanziamento Italia, Sintesi Patti Parasociali Italia.
3. **Terzo commit** — sostituzione 14 workflow nel frontend con la libreria italiana + practice areas tradotte.
4. **Quarto commit** — setup `next-intl` + traduzione `InitialView.tsx` come pilota.

A quel punto il prodotto è già usabile in italiano in modo credibile, e i passi successivi (formati file, integrazioni Normattiva/PEC) diventano feature aggiuntive che si possono prioritizzare in base al cliente target.
