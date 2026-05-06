Perfetto. Ho tutte le informazioni necessarie. Produrrò un report tecnico dettagliato in italiano.

---

# REPORT TECNICO DETTAGLIATO - PROGETTO MIKE

## 1. PANORAMICA GENERALE DEL PROGETTO

**Mike** è una piattaforma SaaS open-source di assistenza legale alimentata da IA. L'applicazione è progettata per avvocati e professionisti legali per analizzare documenti legali, rispondere a domande complesse, redigere documenti e condurre revisioni tabulari strutturate di contratti e accordi.

**Dominio**: Analisi legale documentale e automazione contrattuale  
**Scopo principale**: Fornire uno strumento di assistenza IA che consenta ai professionisti legali di:
- Caricare e gestire raccolte di documenti legali (PDF, DOCX, DOC)
- Dialogare con un assistente IA che analizza i documenti e fornisce risposte con citazioni
- Creare e applicare flussi di lavoro standardizzati (CP Checklist, Credit Agreement Summary, Shareholder Agreement Analysis)
- Condurre revisioni tabulari (estrazione di dati strutturati su righe/colonne da documenti)
- Generare e modificare documenti Word tramite IA

---

## 2. STACK TECNOLOGICO

### Backend
- **Runtime**: Node.js con TypeScript
- **Framework**: Express.js (v4.21.2)
- **Database**: Supabase (PostgreSQL gestito) + autenticazione Supabase Auth
- **Storage**: Cloudflare R2 (S3-compatible) tramite `@aws-sdk/client-s3`
- **LLM Providers**:
  - Anthropic Claude (SDK `@anthropic-ai/sdk` v0.90.0) per main/mid/low tier
  - Google Gemini (SDK `@google/genai` v1.50.1) per main/mid/low tier
- **Elaborazione documenti**:
  - LibreOffice (`libreoffice-convert` v1.6.0) per conversione DOC/DOCX → PDF
  - Mammoth (v1.9.0) per parsing DOCX
  - `pdfjs-dist` (v4.10.38) per manipolazione PDF
  - `jszip` (v3.10.1) per decompressione/elaborazione ZIP (DOCX)
  - `fast-xml-parser` (v5.7.1) per parsing XML
  - `docx` (v9.5.0) per generazione DOCX
- **Utility**:
  - `multer` (v1.4.5) per upload file
  - `cors` (v2.8.5) per CORS
  - `dotenv` (v17.4.1) per configurazione ambiente
  - `resend` (v4.5.1) per email transazionali
  - `fast-diff` (v1.3.0) per diff testo

### Frontend
- **Framework**: Next.js (v16.0.3) con React (v19.2.0)
- **Linguaggio**: TypeScript (v5)
- **Styling**: Tailwind CSS (v4), Class Variance Authority (CVA)
- **Componenti UI**:
  - Radix UI (dropdown menu, slot)
  - lucide-react (icone)
- **Editor di testo**:
  - TipTap (v3.22.3) con starter kit e markdown support
  - UIW React MD Editor (v4.1.0)
  - `marked` (v17.0.1) per parsing markdown
- **Rendering documenti**:
  - `pdfjs-dist` (4.10.38) per visualizzazione PDF
  - `mammoth` (v1.11.0) e `docx-preview` (v0.3.7) per anteprima DOCX
  - `exceljs` (v4.4.0) per elaborazione file Excel
- **Chat e rendering**:
  - `react-markdown` (v10.1.0) con remark/rehype plugins
  - `remark-gfm` (v4.0.1) per GitHub Flavored Markdown
  - `remark-math`, `rehype-katex` (v7.0.1) per formule LaTeX
  - `recharts` (v3.7.0) per grafici
- **Client Supabase**:
  - `@supabase/supabase-js` (v2.81.1)
  - `@supabase/auth-helpers-nextjs` (v0.10.0)
  - `@supabase/auth-js` (v2.101.1)
- **Deployment/Build**:
  - OpenNextJS Cloudflare (v1.13.1) per deploy su Cloudflare Pages
  - Wrangler (v4.51.0) CLI Cloudflare
- **Altro**:
  - `nextjs-toploader` (v3.9.17) per progress bar
  - `tailwind-merge` (v3.4.0) per merge classi Tailwind
  - OpenRouter SDK (v0.3.11) per model aggregator

### Build & Dev Tools
- **Backend**: `tsx` (v4.19.3) per esecuzione TypeScript live, `prettier` (v3.8.1)
- **Frontend**: ESLint (v9), Babel React Compiler (v1.0.0)

---

## 3. ARCHITETTURA

### Comunicazione Frontend-Backend
- **Protocollo**: REST API con Supabase JWT Bearer tokens
- **Base URL backend**: Configurabile via `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:3001`)
- **Autenticazione**: Supabase Auth (JWT) — token estratto da Authorization header nel formato `Bearer <token>`
- **Tipo richieste**: JSON con upload file multipart via `multer`

### Pattern Architetturale

#### Backend (Express)
- **Layering**: Route → Middleware → Service Libraries
- **Middleware**: `requireAuth` valida JWT e popola `res.locals` (userId, userEmail, token)
- **Database**: Supabase client-js con Row Level Security (RLS) per documenti/chat/workflow
- **LLM Integration**: Provider adapter pattern (Claude vs Gemini) con interfaccia OpenAI-like per tool calling

#### Frontend (Next.js)
- **Structure**: App Router (Next.js 13+) con layout annidati, page segments
- **State Management**: React Context (`AuthContext`, `ChatHistoryContext`, `SidebarContext`) per stato globale
- **Custom Hooks**: `useAssistantChat`, `useGenerateChatTitle`, `useFetchDocxBytes`, ecc.
- **Componenti**: Compartimentalizzati per feature (assistant, projects, tabular, workflows)
- **API Layer**: `mikeApi.ts` centralizza fetch al backend con autenticazione

### Servizi Esterni
1. **Supabase** (Auth + Postgres): Identità utente, metadati progetti, documenti, chat, tabular reviews
2. **Cloudflare R2**: Storage S3-compatible per file documento e PDF convertiti
3. **Anthropic Claude API**: Modelli per chat/analisi principali (Opus 4.7, Sonnet 4.6)
4. **Google Gemini API**: Modelli alternativi/fallback + modelli leggeri per titoli/tabulari
5. **OpenRouter** (opzionale): Aggregator di modelli LLM multipli
6. **Resend**: Servizio email transazionale (per notifiche futuri)
7. **LibreOffice** (on-premise): Conversione DOC/DOCX → PDF via server

---

## 4. STRUTTURA COMPLETE DELLE DIRECTORY

```
Mike/
├── backend/
│   ├── src/
│   │   ├── index.ts                    # Entry point Express app
│   │   ├── middleware/
│   │   │   └── auth.ts                 # Middleware JWT authentication
│   │   ├── routes/
│   │   │   ├── chat.ts                 # POST/GET chats globali
│   │   │   ├── projectChat.ts          # POST chats in progetto
│   │   │   ├── documents.ts            # CRUD documenti singoli
│   │   │   ├── projects.ts             # CRUD progetti
│   │   │   ├── tabular.ts              # POST/GET tabular reviews e celle
│   │   │   ├── workflows.ts            # GET/POST/PUT workflows (builtin + custom)
│   │   │   ├── user.ts                 # POST profile, DELETE account
│   │   │   └── downloads.ts            # GET streaming download file
│   │   └── lib/
│   │       ├── supabase.ts             # Client Supabase (service role)
│   │       ├── storage.ts              # Upload/download/delete R2
│   │       ├── convert.ts              # DOCX→PDF tramite LibreOffice
│   │       ├── access.ts               # Permessi progetto/documento
│   │       ├── userSettings.ts         # Fetch API keys + model prefs
│   │       ├── downloadTokens.ts       # Firma HMAC-SHA256 link permanenti
│   │       ├── documentVersions.ts     # Caricamento versioni documento
│   │       ├── docxTrackedChanges.ts   # Parsing/applica edits tracciati DOCX
│   │       ├── upload.ts               # Middleware upload file
│   │       ├── builtinWorkflows.ts     # Definizioni workflow preconfezionati
│   │       ├── chatTools.ts            # Tool definitions (generate_docx, edit_document, ecc.)
│   │       └── llm/
│   │           ├── index.ts            # Dispatcher provider (Claude vs Gemini)
│   │           ├── types.ts            # Tipi OpenAI-like (LlmMessage, StreamChatParams)
│   │           ├── models.ts           # Costanti modelli (CLAUDE_MAIN_MODELS, DEFAULT_MAIN_MODEL)
│   │           ├── tools.ts            # Converter tool schema (OpenAI → Claude/Gemini)
│   │           ├── claude.ts           # Streaming client Anthropic
│   │           └── gemini.ts           # Streaming client Google Gemini
│   ├── migrations/
│   │   └── 000_one_shot_schema.sql    # Schema PostgreSQL one-shot
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx              # Root layout (fonts, Providers)
│   │   │   ├── page.tsx                # Redirect a /assistant
│   │   │   ├── error.tsx, global-error.tsx, not-found.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx            # Login form
│   │   │   ├── signup/
│   │   │   │   └── page.tsx            # Signup form
│   │   │   ├── (pages)/                # Layout group per pagine autenticate
│   │   │   │   ├── layout.tsx          # Layout con sidebar
│   │   │   │   ├── assistant/
│   │   │   │   │   ├── page.tsx        # Chat global iniziale
│   │   │   │   │   └── chat/[id]/
│   │   │   │   │       └── page.tsx    # Chat detail (streaming)
│   │   │   │   ├── projects/
│   │   │   │   │   ├── page.tsx        # Progetti overview
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx    # Project detail (docs + folder tree)
│   │   │   │   │       ├── assistant/
│   │   │   │   │       │   └── chat/[chatId]/
│   │   │   │   │       │       └── page.tsx  # Project chat
│   │   │   │   │       └── tabular-reviews/
│   │   │   │   │           └── [reviewId]/
│   │   │   │   │               └── page.tsx  # Tabular review in progetto
│   │   │   │   ├── account/
│   │   │   │   │   ├── page.tsx        # Account settings
│   │   │   │   │   ├── models/page.tsx # Model selection (title + tabular)
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── tabular-reviews/
│   │   │   │   │   ├── page.tsx        # Tabular reviews overview
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx    # Tabular review detail
│   │   │   │   └── workflows/
│   │   │   │       ├── page.tsx        # Workflows list
│   │   │   │       └── [id]/
│   │   │   │           └── page.tsx    # Workflow detail
│   │   │   ├── components/
│   │   │   │   ├── shared/
│   │   │   │   │   ├── types.ts        # Tipi applicativi (MikeProject, MikeDocument, ecc.)
│   │   │   │   │   ├── AppSidebar.tsx  # Sidebar principale
│   │   │   │   │   ├── DocPanel.tsx    # Panel laterale visualizzazione doc
│   │   │   │   │   ├── DocView.tsx     # Viewer PDF/DOCX inline
│   │   │   │   │   ├── DocumentCard.tsx # Card documento
│   │   │   │   │   ├── FileDirectory.tsx # Albero cartelle progetto
│   │   │   │   │   ├── RowActions.tsx  # Azioni riga (rename, delete, share)
│   │   │   │   │   ├── VersionChip.tsx # Versioni documento
│   │   │   │   │   ├── AddDocumentsModal.tsx, AddProjectDocsModal.tsx
│   │   │   │   │   ├── PeopleModal.tsx # Condivisione progetto
│   │   │   │   │   ├── ProjectPicker.tsx
│   │   │   │   │   ├── HeaderSearchBtn.tsx
│   │   │   │   │   └── ...altri componenti
│   │   │   │   ├── assistant/
│   │   │   │   │   ├── ChatView.tsx    # Vista chat streaming
│   │   │   │   │   ├── ChatInput.tsx   # Input messaggio (file attachment)
│   │   │   │   │   ├── InitialView.tsx # Vista iniziale (welcome)
│   │   │   │   │   ├── AssistantMessage.tsx # Render messaggio AI
│   │   │   │   │   ├── UserMessage.tsx # Render messaggio utente
│   │   │   │   │   ├── AddDocButton.tsx
│   │   │   │   │   ├── AssistantSidePanel.tsx
│   │   │   │   │   ├── AssistantWorkflowModal.tsx
│   │   │   │   │   ├── SelectAssistantProjectModal.tsx
│   │   │   │   │   └── ModelToggle.tsx
│   │   │   │   ├── projects/
│   │   │   │   │   ├── ProjectsOverview.tsx
│   │   │   │   │   ├── ProjectPage.tsx
│   │   │   │   │   ├── ProjectExplorer.tsx
│   │   │   │   │   └── NewProjectModal.tsx
│   │   │   │   ├── tabular/
│   │   │   │   │   ├── TabularReviewView.tsx # Tabella interattiva
│   │   │   │   │   ├── TabularCell.tsx     # Cella (editing + AI generation)
│   │   │   │   │   ├── TRTable.tsx         # Rendering griglia
│   │   │   │   │   ├── TRSidePanel.tsx     # Panel info cella
│   │   │   │   │   ├── TRChatPanel.tsx     # Chat per cella
│   │   │   │   │   ├── TREditColumnMenu.tsx
│   │   │   │   │   ├── AddColumnModal.tsx
│   │   │   │   │   ├── AddNewTRModal.tsx
│   │   │   │   │   ├── columnPresets.ts    # Template colonne
│   │   │   │   │   ├── columnFormat.ts     # Validazione/formattazione
│   │   │   │   │   ├── exportToExcel.ts
│   │   │   │   │   └── ...utility
│   │   │   │   ├── workflows/
│   │   │   │   │   ├── WorkflowList.tsx
│   │   │   │   │   ├── DisplayWorkflowModal.tsx
│   │   │   │   │   ├── NewWorkflowModal.tsx
│   │   │   │   │   ├── WorkflowPromptEditor.tsx
│   │   │   │   │   ├── builtinWorkflows.ts
│   │   │   │   │   └── ...
│   │   │   │   ├── modals/
│   │   │   │   │   ├── delete-chats-modal.tsx
│   │   │   │   │   ├── credits-exhausted-modal.tsx
│   │   │   │   │   └── simple-link-dialog.tsx
│   │   │   │   └── ui/
│   │   │   │       ├── badge.tsx, button.tsx, input.tsx
│   │   │   │       ├── cite-button.tsx, dropdown-menu.tsx
│   │   │   │       └── text-search-widget.tsx
│   │   │   ├── contexts/
│   │   │   │   ├── ChatHistoryContext.tsx
│   │   │   │   ├── SidebarContext.tsx
│   │   │   │   └── AuthContext.tsx (top-level)
│   │   │   ├── hooks/
│   │   │   │   ├── useAssistantChat.ts
│   │   │   │   ├── useFetchDocxBytes.ts
│   │   │   │   ├── useFetchSingleDoc.ts
│   │   │   │   ├── useDocumentVersions.ts
│   │   │   │   ├── useGenerateChatTitle.ts
│   │   │   │   └── useSelectedModel.ts
│   │   │   └── lib/
│   │   │       ├── mikeApi.ts          # API client (listProjects, createChat, ecc.)
│   │   │       ├── modelAvailability.ts
│   │   │       └── ...
│   │   ├── lib/
│   │   │   ├── auth.ts
│   │   │   ├── supabase.ts             # Client Supabase (anon key)
│   │   │   ├── supabase-server.ts
│   │   │   ├── types.ts                # Tipi legale-specifici (SectionDetail, ecc.)
│   │   │   ├── storage.ts
│   │   │   ├── utils.ts
│   │   │   ├── slug.ts, label.ts
│   │   │   └── fileConverter.ts
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   └── UserProfileContext.tsx
│   │   ├── components/
│   │   │   ├── providers.tsx            # Context providers (Auth, Supabase, ecc.)
│   │   │   ├── site-logo.tsx
│   │   │   └── chat/
│   │   │       └── mike-icon.tsx
│   │   └── global.d.ts
│   ├── next.config.ts
│   ├── open-next.config.ts             # Config deploy Cloudflare
│   ├── tailwind.config.js
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.local.example
│
├── README.md
├── LICENSE                            # AGPL-3.0-only
└── .gitignore
```

---

## 5. MAPPA FILE-PER-FILE (FILE RILEVANTI)

### Backend

#### `backend/src/index.ts`
- **Scopo**: Entry point Express app
- **Cosa fa**: Inizializza app Express, monta CORS, configura rotte, listen su PORT
- **Espone**: None (eseguibile)
- **Dipendenze**: `express`, `cors`, tutti i route modules, `dotenv`
- **Rotte registrate**:
  - `/chat` → chatRouter
  - `/projects` → projectsRouter
  - `/projects/:projectId/chat` → projectChatRouter
  - `/single-documents` → documentsRouter
  - `/tabular-review` → tabularRouter
  - `/workflows` → workflowsRouter
  - `/user`, `/users` → userRouter
  - `/download` → downloadsRouter
  - `/health` → GET endpoint di controllo

#### `backend/src/middleware/auth.ts`
- **Scopo**: Middleware JWT authentication
- **Cosa fa**: Estrae token Bearer header, valida con Supabase admin client, popola `res.locals` (userId, userEmail)
- **Funzioni**:
  - `requireAuth(req, res, next)`: Middleware — valida JWT o restituisce 401
- **Dipendenze**: `express`, `@supabase/supabase-js`

#### `backend/src/lib/supabase.ts`
- **Scopo**: Client Supabase lato server
- **Funzioni**:
  - `createServerSupabase()`: Crea client con service role key (bypassa RLS)
  - `getUserIdFromRequest(req)`: Estrae + verifica JWT da Authorization header, ritorna userId
- **Dipendenze**: `@supabase/supabase-js`

#### `backend/src/routes/chat.ts`
- **Scopo**: Chat globali (non-progetto)
- **Endpoint**:
  - `GET /chat` — Lista chat visibili (propri + progetti posseduti)
  - `POST /chat/create` — Crea chat
  - `GET /chat/:chatId` — Dettagli chat + messaggi
  - `POST /chat/:chatId` — Streaming messaggio (chiama LLM)
- **Dipendenze**: chatTools (buildDocContext, runLLMStream), userSettings, access

#### `backend/src/routes/projectChat.ts`
- **Scopo**: Chat dentro progetto
- **Endpoint**:
  - `POST /projects/:projectId/chat` — Streaming chat (come /chat/:chatId ma per progetto)
- **Extra**: PROJECT_SYSTEM_PROMPT_EXTRA + PROJECT_EXTRA_TOOLS (list_documents, fetch_documents, replicate_document)

#### `backend/src/routes/documents.ts`
- **Scopo**: CRUD documenti singoli (non in progetto)
- **Endpoint**:
  - `GET /single-documents` — Lista doc utente
  - `POST /single-documents` — Upload nuovo doc
  - `DELETE /single-documents/:documentId`
  - `GET /single-documents/:documentId/display` — Viewer HTML/PDF/DOCX
  - `POST /single-documents/:documentId/new-version` — Upload nuova versione
  - `GET /single-documents/:documentId/versions` — Lista versioni
  - `PUT /single-documents/:documentId/resolve-edit` — Accept/reject edit tracciato
- **Dipendenze**: storage, convert, documentVersions, downloadTokens

#### `backend/src/routes/projects.ts`
- **Scopo**: CRUD progetti
- **Endpoint**:
  - `GET /projects` — Lista progetti (propri + condivisi)
  - `POST /projects` — Crea progetto
  - `GET /projects/:projectId` — Dettagli progetto + documenti + cartelle
  - `PUT /projects/:projectId` — Aggiorna nome/cm_number/shared_with
  - `DELETE /projects/:projectId` — Elimina progetto
  - `POST /projects/:projectId/documents` — Upload documento in progetto
  - `GET /projects/:projectId/documents` — Lista documenti progetto
  - `POST /projects/:projectId/folders` — Crea sottocartella
  - `PATCH /projects/:projectId/documents/:docId/folder` — Sposta documento in cartella
- **Dipendenze**: storage, documentVersions, checkProjectAccess

#### `backend/src/routes/tabular.ts`
- **Scopo**: Tabular reviews (griglie estrazione dati strutturata)
- **Endpoint**:
  - `GET /tabular-review` — Lista reviews (globali + progetto-specifiche)
  - `POST /tabular-review` — Crea review
  - `GET /tabular-review/:reviewId` — Dettagli + celle
  - `PUT /tabular-review/:reviewId` — Aggiorna nome/config
  - `DELETE /tabular-review/:reviewId`
  - `POST /tabular-review/:reviewId/chat` — Streaming chat per cella
  - `PUT /tabular-review/:reviewId/cells/:cellId` — Update contenuto cella (manuale o AI)
  - `POST /tabular-review/:reviewId/cells/:cellId/generate` — Genera contenuto AI cella
  - `POST /tabular-review/:reviewId/export` — Export Excel
- **Dipendenze**: runLLMStream, TABULAR_TOOLS, tabularRouter access (ensureReviewAccess, listAccessibleProjectIds)

#### `backend/src/routes/workflows.ts`
- **Scopo**: CRUD workflow (builtin + custom)
- **Endpoint**:
  - `GET /workflows` — Lista workflow visibili
  - `GET /workflows/:workflowId` — Dettagli workflow
  - `POST /workflows` — Crea workflow custom
  - `PUT /workflows/:workflowId` — Aggiorna workflow
  - `DELETE /workflows/:workflowId`
  - `POST /workflows/:workflowId/share` — Condividi workflow con email
  - `GET /workflows/:workflowId/shares` — Lista condivisioni
  - `DELETE /workflows/:workflowId/unshare` — Revoca condivisione
  - `POST /workflows/:workflowId/hide` — Nascondi workflow builtin
- **Dipendenze**: resolveWorkflowAccess, builtinWorkflows

#### `backend/src/routes/user.ts`
- **Scopo**: Profilo utente
- **Endpoint**:
  - `POST /user/profile` — Crea/upsert profilo utente (API keys, settings)
  - `DELETE /user/account` — Elimina account utente

#### `backend/src/routes/downloads.ts`
- **Scopo**: Download file con link permanente (token firmato)
- **Endpoint**:
  - `GET /download/:token` — Stream file se token valido
- **Dipendenze**: downloadTokens (verifyDownload), storage, access

#### `backend/src/lib/chatTools.ts` (>3000 righe)
- **Scopo**: Definizioni tool, builder di contesto documenti, runner LLM
- **Funzioni principali**:
  - `buildDocContext(...)`: Carica documenti, parsifica testo + metadata
  - `buildMessages(...)`: Costruisce chat history dal DB
  - `enrichWithPriorEvents(...)`: Arricchisce messaggi con reasoning/thinking events
  - `buildWorkflowStore(...)`: Carica workflow nel contesto
  - `runLLMStream(...)`: Runner loop LLM (chiama LLM, esegue tool calls, salva DB)
  - `extractAnnotations(...)`: Estrae citazioni JSON da risposta
- **Tool definitions** (OpenAI-style):
  - `generate_docx`: Genera Word document
  - `edit_document`: Applica edits tracciati a DOCX
  - `read_document`: Legge documento caricato
  - `find_in_document`: Ricerca testo in documento
  - `find_similar`: Ricerca semantica
  - `generate_tabular_cell_value`: Estrae valore cella per tabular review
  - Plus project-specific tools (list_documents, fetch_documents, replicate_document, fetch_project_chats)
- **Dipendenze**: llm (streamChatWithTools), storage, convert, documentVersions, docxTrackedChanges, downloadTokens

#### `backend/src/lib/llm/index.ts`
- **Scopo**: Provider dispatcher
- **Funzioni**:
  - `streamChatWithTools(params)`: Delega a streamClaude o streamGemini
  - `completeText(params)`: One-shot text completion
- **Dipendenze**: `./claude`, `./gemini`, `./models`

#### `backend/src/lib/llm/types.ts`
- **Scopo**: Type definitions LLM
- **Tipi**:
  - `Provider`: "claude" | "gemini"
  - `OpenAIToolSchema`: Tool definition OpenAI-style
  - `LlmMessage`: `{ role, content }`
  - `StreamChatParams`: Input a streamChatWithTools
  - `StreamCallbacks`: Callback per reasoning/content/tools
  - `UserApiKeys`: `{ claude?, gemini? }`

#### `backend/src/lib/llm/models.ts`
- **Scopo**: Costanti modelli disponibili
- **Costanti**:
  - `CLAUDE_MAIN_MODELS` = ["claude-opus-4-7", "claude-sonnet-4-6"]
  - `GEMINI_MAIN_MODELS` = ["gemini-3.1-pro-preview", "gemini-3-flash-preview"]
  - `CLAUDE_MID_MODELS` = ["claude-sonnet-4-6"]
  - `CLAUDE_LOW_MODELS` = ["claude-haiku-4-5"]
  - `DEFAULT_MAIN_MODEL` = "gemini-3-flash-preview"
  - `DEFAULT_TITLE_MODEL` = "gemini-3.1-flash-lite-preview"
  - `DEFAULT_TABULAR_MODEL` = "gemini-3-flash-preview"
- **Funzioni**:
  - `providerForModel(model)`: Estrae provider da nome modello
  - `resolveModel(id, fallback)`: Valida modello o fallback

#### `backend/src/lib/llm/claude.ts`
- **Scopo**: Streaming client Anthropic Claude
- **Funzioni**:
  - `streamClaude(params)`: Loop streaming con tool calling
  - `completeClaudeText(params)`: One-shot completion
- **Features**: Extended thinking (adaptive) con `output_config.effort: "high"`
- **Dipendenze**: `@anthropic-ai/sdk`

#### `backend/src/lib/llm/gemini.ts`
- **Scopo**: Streaming client Google Gemini
- **Funzioni**:
  - `streamGemini(params)`: Loop streaming con function calling
  - `completeGeminiText(params)`
- **Features**: Thinking config (includeThoughts) con thoughtSignature replay
- **Dipendenze**: `@google/genai`

#### `backend/src/lib/storage.ts`
- **Scopo**: S3-compatible (Cloudflare R2) upload/download/delete
- **Funzioni**:
  - `uploadFile(key, content, contentType)`: PUT to R2
  - `downloadFile(key)`: GET from R2 (ritorna ArrayBuffer o null)
  - `deleteFile(key)`: DELETE from R2
  - `getSignedUrl(key, expirySeconds)`: URL pre-firmato
  - `storageKey(userId, documentId, filename)`: Genera chiave storage
  - `versionStorageKey(...)`: Chiave per versione
  - `generatedDocKey(...)`: Chiave per doc generato
- **Dipendenze**: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`

#### `backend/src/lib/convert.ts`
- **Scopo**: Conversione DOCX/DOC → PDF
- **Funzioni**:
  - `docxToPdf(buffer)`: Converte buffer DOCX a PDF via LibreOffice
  - `normalizeDocxZipPaths(buffer)`: Normalizza separatori path interni ZIP (\ → /)
  - `convertedPdfKey(userId, docId)`: Chiave storage PDF convertito
- **Dipendenze**: `libreoffice-convert`, `jszip`

#### `backend/src/lib/access.ts`
- **Scopo**: Autorizzazione progetti/documenti
- **Funzioni**:
  - `checkProjectAccess(projectId, userId, userEmail, db)`: Controlla accesso (owner o in shared_with email)
  - `ensureDocAccess(doc, userId, userEmail, db)`: Controlla accesso documento
  - `ensureReviewAccess(reviewId, userId, userEmail, db)`: Controlla accesso tabular review
  - `listAccessibleProjectIds(userId, userEmail, db)`: Lista progetti accessibili
- **Ritorna**: `{ ok, isOwner, project }`

#### `backend/src/lib/documentVersions.ts`
- **Scopo**: Gestione versioni documento
- **Funzioni**:
  - `attachLatestVersionNumbers(db, docs)`: Aggiunge latest_version_number ai doc
  - `attachActiveVersionPaths(db, docs)`: Aggiunge storage_path + pdf_storage_path
  - `loadActiveVersion(db, docId)`: Carica versione corrente documento
- **Dipendenze**: Supabase

#### `backend/src/lib/docxTrackedChanges.ts`
- **Scopo**: Parsing/applica edit tracciati DOCX (revisioni Word)
- **Funzioni**:
  - `extractDocxBodyText(buffer)`: Estrae testo body da DOCX
  - `applyTrackedEdits(buffer, edits)`: Applica array di edit a DOCX
  - `extractTrackedChangeIds(buffer)`: Estrae IDs revisioni da DOCX
  - `resolveTrackedChange(...)`: Accept/reject singolo edit
- **Dipendenze**: `mammoth`, `jszip`, `fast-diff`

#### `backend/src/lib/downloadTokens.ts`
- **Scopo**: Token HMAC-SHA256 per link download permanenti
- **Funzioni**:
  - `signDownload(path, filename)`: Genera token firmato (base64url encoded)
  - `verifyDownload(token)`: Valida token e ritorna `{ path, filename }`
  - `buildDownloadUrl(path, filename)`: Ritorna URL relativo `/download/:token`
- **Note**: Non ha scadenza, firmato con `DOWNLOAD_SIGNING_SECRET` o fallback `SUPABASE_SECRET_KEY`

#### `backend/src/lib/userSettings.ts`
- **Scopo**: Fetch API keys + model preferences da user_profiles
- **Funzioni**:
  - `getUserModelSettings(userId)`: Ritorna `{ title_model, tabular_model, api_keys }`
  - `getUserApiKeys(userId)`: Ritorna `{ claude?, gemini? }`
  - `resolveTitleModel(apiKeys)`: Scegli modello titolo (Gemini Lite > Claude Haiku > default)
- **Dipendenze**: Supabase

#### `backend/src/lib/upload.ts`
- **Scopo**: Middleware multer file upload
- **Funzioni**:
  - `singleFileUpload(fieldName)`: Middleware multer per singolo file
- **Dipendenze**: `multer`

#### `backend/src/lib/builtinWorkflows.ts`
- **Scopo**: Definizioni workflow preconfezionati
- **Constant** `BUILTIN_WORKFLOWS`: Array con 3 workflow:
  1. `builtin-cp-checklist`: Genera CP checklist (tabelle Word)
  2. `builtin-credit-summary`: Analisi credit agreement (prose)
  3. `builtin-sha-summary`: Analisi shareholder agreement (docx)
- **Campi**: id, title, prompt_md (istruzioni dettagliate per LLM)

#### `backend/migrations/000_one_shot_schema.sql`
- **Scopo**: Schema PostgreSQL completo one-shot
- **Tabelle principali**:
  - `user_profiles`: Profilo utente (API keys, tier, credits, model preferences)
  - `projects`: Progetti legali (user_id, name, cm_number, shared_with JSONB)
  - `project_subfolders`: Cartelle dentro progetto
  - `documents`: Documenti (file_type, page_count, status, structure_tree JSONB)
  - `document_versions`: Versioni (storage_path, pdf_storage_path, source, version_number)
  - `document_edits`: Edit tracciati (change_id, del/ins text, status: pending/accepted/rejected)
  - `workflows`: Workflow (user_id, title, type, prompt_md, columns_config JSONB, is_system)
  - `workflow_shares`: Condivisioni workflow (shared_with_email, allow_edit)
  - `chats`: Chat globali (user_id, project_id, title)
  - `chat_messages`: Messaggi (content JSONB, files JSONB, annotations JSONB)
  - `tabular_reviews`: Tabular reviews (columns_config JSONB, workflow_id, shared_with JSONB)
  - `tabular_cells`: Celle tabular (content, citations JSONB, status)
  - `tabular_review_chats`: Chat per tabular review
  - `tabular_review_chat_messages`: Messaggi chat tabular
- **Indexes**: Numerosi su user_id, project_id, created_at, etc.
- **RLS**: Abilitato su tabelle con politiche per accesso utente

---

### Frontend

#### `frontend/src/app/layout.tsx`
- **Scopo**: Root layout (fonts, providers globali)
- **Cosa fa**: Carica font Inter + EB Garamond, wrappa children in Providers context
- **Dipendenze**: `@next/font/google`, `./globals.css`, Providers

#### `frontend/src/app/page.tsx`
- **Scopo**: Home page
- **Cosa fa**: Redirect immediato a `/assistant`

#### `frontend/src/app/login/page.tsx`
- **Scopo**: Login form
- **Funzioni**: handleLogin (email + password via supabase.auth.signInWithPassword)
- **Dipendenze**: supabase, AuthContext, Input/Button components

#### `frontend/src/app/(pages)/layout.tsx`
- **Scopo**: Layout autenticato (sidebar + main)
- **Cosa fa**: Wrappa app in AppSidebar + render children
- **Dipendenze**: AppSidebar, ChatHistoryContext, AuthProtected

#### `frontend/src/app/(pages)/assistant/page.tsx`
- **Scopo**: Chat globale iniziale
- **Cosa fa**: Mostra InitialView se no chat, altrimenti ChatView con messaggio
- **Dipendenze**: useAssistantChat hook

#### `frontend/src/app/(pages)/assistant/chat/[id]/page.tsx`
- **Scopo**: Dettagli chat (streaming)
- **Cosa fa**: Carica chat detail via API, passa a ChatView + useAssistantChat
- **Dipendenze**: mikeApi.fetchChatDetail, useAssistantChat

#### `frontend/src/app/(pages)/projects/page.tsx`
- **Scopo**: Progetti overview
- **Cosa fa**: Mostra ProjectsOverview component
- **Dipendenze**: ProjectsOverview

#### `frontend/src/app/(pages)/projects/[id]/page.tsx`
- **Scopo**: Dettagli progetto (documenti + cartelle)
- **Cosa fa**: Carica progetto via API, mostra ProjectPage (albero doc, toolbar)
- **Dipendenze**: mikeApi, ProjectPage

#### `frontend/src/app/(pages)/tabular-reviews/page.tsx`
- **Scopo**: Tabular reviews overview (lista, filter, search)
- **Cosa fa**: Fetch reviews/progetti, rendering griglia con azioni (rename, delete, share)
- **Dipendenze**: mikeApi.listTabularReviews, AddNewTRModal, RowActions

#### `frontend/src/app/(pages)/tabular-reviews/[id]/page.tsx`
- **Scopo**: Dettagli tabular review
- **Cosa fa**: Carica review, mostra TabularReviewView (griglia editabile + chat)
- **Dipendenze**: mikeApi, TabularReviewView

#### `frontend/src/app/(pages)/workflows/page.tsx`
- **Scopo**: Workflows list
- **Cosa fa**: Mostra WorkflowList (builtin + custom)
- **Dipendenze**: WorkflowList

#### `frontend/src/lib/mikeApi.ts` (API client)
- **Scopo**: Centralizza tutte le fetch al backend
- **Funzioni principali**:
  - `listProjects()`: GET /projects
  - `fetchProject(projectId)`: GET /projects/:projectId
  - `createProject(name, cm_number, shared_with)`: POST /projects
  - `listDocuments()`: GET /single-documents
  - `uploadDocument(file, projectId?)`: POST /single-documents o /projects/:projectId/documents
  - `fetchChatDetail(chatId)`: GET /chat/:chatId
  - `streamChat(...)`: POST /chat/:chatId (EventSource streaming)
  - `streamProjectChat(...)`: POST /projects/:projectId/chat (streaming)
  - `listTabularReviews(...)`: GET /tabular-review
  - `createTabularReview(...)`: POST /tabular-review
  - `generateTabularCell(...)`: POST /tabular-review/:reviewId/cells/:cellId/generate
  - `listWorkflows(...)`: GET /workflows
  - `createWorkflow(...)`: POST /workflows
- **Auth**: Attacca bearer token via `getAuthHeader()`
- **Dipendenze**: supabase, types

#### `frontend/src/lib/supabase.ts`
- **Scopo**: Client Supabase lato browser
- **Cosa fa**: Crea client con URL + publishable anon key
- **Dipendenze**: `@supabase/supabase-js`

#### `frontend/src/app/lib/mikeApi.ts` (API client app)
- Identico a quello sopra, ma in posizione `app/lib/`

#### `frontend/src/contexts/AuthContext.tsx`
- **Scopo**: Global auth context
- **Funzioni**: checkUser, onAuthStateChange listener, signOut
- **Espone**: `{ user, isAuthenticated, authLoading, signOut }`
- **Side-effect**: POST /user/profile su login
- **Dipendenze**: supabase

#### `frontend/src/app/contexts/ChatHistoryContext.tsx`
- **Scopo**: Gestisce storico chat (per sidebar quick access)
- **Stato**: chatList, currentChatId, newChatMessages
- **Funzioni**: loadChats, saveChat, setCurrentChatId, replaceChatId
- **Dipendenze**: mikeApi

#### `frontend/src/app/components/shared/types.ts`
- **Scopo**: Type definitions app
- **Tipi principali**:
  - `MikeProject`: id, user_id, name, cm_number, shared_with, folders, documents
  - `MikeDocument`: id, filename, file_type, project_id, status, latest_version_number
  - `MikeChat`: id, project_id, user_id, title, created_at
  - `MikeFolder`: Cartella di progetto
  - `MikeWorkflow`: id, user_id, title, type (assistant|tabular), prompt_md, columns_config, is_system
  - `TabularReview`: id, title, columns_config JSONB, workflow_id, shared_with
  - `AssistantEvent`: Union type (reasoning, tool_call_start, thinking, doc_read, doc_find, content, etc.)
  - `MikeMessage`: { role, content, events?, files?, workflow?, annotations? }
  - `MikeCitationAnnotation`: { ref, doc_id, page, quote }

#### `frontend/src/app/hooks/useAssistantChat.ts`
- **Scopo**: Hook per streaming chat con AI
- **Funzioni**:
  - `handleChat(message)`: Invia messaggio, stream risposta, salva DB
  - `handleNewChat(message)`: Crea chat, invia primo messaggio
  - `cancel()`: Abort fetch streaming
- **Stato**: messages, isResponseLoading, chatId
- **Drip animation**: Mostra testo lentamente lettera per lettera
- **Dipendenze**: streamChat/streamProjectChat, useChatHistoryContext, useGenerateChatTitle

#### `frontend/src/app/components/assistant/ChatView.tsx`
- **Scopo**: Vista chat streaming
- **Rendering**: Lista messaggi, AssistantMessage/UserMessage, ChatInput
- **Funzioni**: Scroll to bottom, load more messages
- **Dipendenze**: useAssistantChat, AssistantMessage, ChatInput

#### `frontend/src/app/components/assistant/ChatInput.tsx`
- **Scopo**: Input messaggi (text + file attachment)
- **Funzioni**: Attach documenti, submit message, cancel
- **Dipendenze**: AddDocButton, textarea autogrow

#### `frontend/src/app/components/projects/ProjectsOverview.tsx`
- **Scopo**: Grid progetti con azioni
- **Funzioni**: CRUD progetto (create, rename, delete, share), navigate to project
- **Dipendenze**: mikeApi, NewProjectModal, RowActions

#### `frontend/src/app/components/projects/ProjectPage.tsx`
- **Scopo**: Pagina progetto (albero doc + toolbar)
- **Rendering**: FileDirectory (albero), AddProjectDocsModal, toolbar tabs
- **Dipendenze**: FileDirectory, AddProjectDocsModal

#### `frontend/src/app/components/tabular/TabularReviewView.tsx`
- **Scopo**: Griglia tabular interattiva
- **Rendering**: TRTable (griglia), TRSidePanel (dettagli cella), TRChatPanel (chat cella)
- **Funzioni**: Cell editing, column CRUD, AI generation per cella
- **Dipendenze**: TRTable, TRSidePanel, TRChatPanel, columnFormat

#### `frontend/src/app/components/tabular/TabularCell.tsx`
- **Scopo**: Cella singola (editing + AI)
- **Rendering**: Testo, pulsante edit, loading state
- **Funzioni**: Click per edit, submit, cancel
- **Dipendenze**: mikeApi.generateTabularCell

#### `frontend/src/app/components/workflows/WorkflowList.tsx`
- **Scopo**: Lista workflow (builtin + custom)
- **Funzioni**: Create, edit, delete, share, hide builtin
- **Dipendenze**: mikeApi, DisplayWorkflowModal, NewWorkflowModal

#### `frontend/src/app/components/shared/AppSidebar.tsx`
- **Scopo**: Sidebar principale
- **Rendering**: Logo, nav tabs (Assistant/Projects/Reviews/Workflows/Account), recent chats
- **Dipendenze**: useSidebarContext, router

#### `frontend/src/app/components/shared/DocPanel.tsx`
- **Scopo**: Panel laterale visualizzazione documento
- **Rendering**: DocView (PDF/DOCX), breadcrumb, toolbar (download, versioni)
- **Dipendenze**: DocView, VersionChip, downloadTokens

#### `frontend/src/app/components/shared/DocView.tsx`
- **Scopo**: Viewer PDF/DOCX inline
- **Rendering**: PDF.js per PDF, custom DOCX parser per DOCX
- **Funzioni**: Page navigation, zoom, search
- **Dipendenze**: `pdfjs-dist`, mammoth

#### `frontend/src/app/components/shared/FileDirectory.tsx`
- **Scopo**: Albero gerarchico cartelle/documenti progetto
- **Rendering**: Nodi espandibili, icone, azioni
- **Dipendenze**: useDirectoryData hook

#### `frontend/next.config.ts`
- **Scopo**: Configurazione Next.js
- **Settings**:
  - `reactCompiler: true` — Abilita React Compiler
  - Rewrites per sitemap
  - `skipTrailingSlashRedirect: true`

#### `frontend/open-next.config.ts`
- **Scopo**: Configurazione deploy OpenNextJS (Cloudflare Pages)
- **Settings**: Cloudflare-specific options, Node.js polyfills

---

## 6. FUNZIONALITÀ E FEATURE DELL'APPLICAZIONE

### Feature Utente Visibili

| Numero | Feature | Descrizione | File Backend | File Frontend |
|--------|---------|-------------|-------------|-------------|
| 1 | **Autenticazione** | Signup/login via Supabase Auth (email+password) | middleware/auth.ts, routes/user.ts | login/page.tsx, signup/page.tsx, AuthContext.tsx |
| 2 | **Chat globale** | Conversazione AI con documenti, citazioni | routes/chat.ts, lib/chatTools.ts, lib/llm/* | (pages)/assistant/page.tsx, ChatView.tsx, useAssistantChat.ts |
| 3 | **Caricare documenti** | Upload PDF/DOCX/DOC (singoli o in progetto) | routes/documents.ts, routes/projects.ts, lib/upload.ts | AddDocumentsModal.tsx, AddProjectDocsModal.tsx |
| 4 | **Gestione versioni doc** | Upload nuova versione, view storia | routes/documents.ts, lib/documentVersions.ts | VersionChip.tsx, UploadNewVersionModal.tsx |
| 5 | **Conversione PDF** | DOCX/DOC → PDF automatico (LibreOffice) | lib/convert.ts | (interno, non visible) |
| 6 | **Viewer documenti** | Visualizza PDF/DOCX inline | routes/documents.ts, lib/storage.ts | DocView.tsx, DocxView.tsx |
| 7 | **Progetti** | Creare, rinominare, eliminare progetti | routes/projects.ts | ProjectsOverview.tsx, NewProjectModal.tsx |
| 8 | **Condivisione progetto** | Condividi progetto con email (owner-only) | routes/projects.ts, lib/access.ts | PeopleModal.tsx, RowActions.tsx |
| 9 | **Cartelle in progetto** | Organizza doc in sottocartelle | routes/projects.ts | FileDirectory.tsx |
| 10 | **Chat in progetto** | Chat scoped a singolo progetto | routes/projectChat.ts | (pages)/projects/[id]/assistant/chat/[chatId]/page.tsx |
| 11 | **Generazione documento** | LLM genera DOCX (generate_docx tool) | lib/chatTools.ts, lib/llm/claude.ts, lib/llm/gemini.ts | ChatView.tsx (download card) |
| 12 | **Modifica documento** | LLM propone edit tracciati, user accept/reject | lib/chatTools.ts, lib/docxTrackedChanges.ts, routes/documents.ts | DocPanel.tsx, tracked changes UI |
| 13 | **Download file** | Download permanente documento (token HMAC) | routes/downloads.ts, lib/downloadTokens.ts | DocPanel.tsx download button |
| 14 | **Tabular Review** | Griglia estrazione dati, colonne configurabili | routes/tabular.ts, lib/chatTools.ts (TABULAR_TOOLS) | TabularReviewView.tsx, TRTable.tsx, TabularCell.tsx |
| 15 | **Generazione celle** | AI genera contenuto cella | routes/tabular.ts, lib/chatTools.ts (generate_tabular_cell_value) | TabularCell.tsx, TRChatPanel.tsx |
| 16 | **Chat per cella** | Conversazione IA scoped a singola cella | routes/tabular.ts | TRChatPanel.tsx |
| 17 | **Export Excel** | Tabular review → Excel | routes/tabular.ts | TabularReviewView.tsx export button |
| 18 | **Workflow predefiniti** | CP Checklist, Credit Summary, SHA Summary | lib/builtinWorkflows.ts | components/workflows/builtinWorkflows.ts |
| 19 | **Workflow custom** | Crea workflow personalizzati | routes/workflows.ts | NewWorkflowModal.tsx, WorkflowPromptEditor.tsx |
| 20 | **Condivisione workflow** | Condividi workflow con email (allow_edit flag) | routes/workflows.ts | ShareWorkflowModal.tsx |
| 21 | **Impostazioni account** | Scegli modelli per titoli/tabulari, API keys personali | routes/user.ts | (pages)/account/models/page.tsx |
| 22 | **Citazioni** | Risposta AI con [1] markers + <CITATIONS> JSON block | lib/chatTools.ts (SYSTEM_PROMPT) | AssistantMessage.tsx (cite-button.tsx) |
| 23 | **Thinking/Reasoning** | Mostra thinking stream per Claude 4.x | lib/chatTools.ts, lib/llm/claude.ts, lib/llm/gemini.ts | AssistantMessage.tsx (reasoning events) |
| 24 | **Modelli multipli** | Scegli Claude vs Gemini per chat | routes/chat.ts, routes/projectChat.ts | ChatInput.tsx, ModelToggle.tsx |

---

## 7. ENDPOINT/API BACKEND - LISTA COMPLETA

### Chat Globali
```
GET    /chat
       → Lista chat (user's own + projects owned)
       ← [ { id, project_id, user_id, title, created_at }, ... ]

POST   /chat/create
       Body: { project_id?: string }
       → Crea chat
       ← { id }

GET    /chat/:chatId
       → Chat detail + messaggi
       ← { messages: [ { id, chat_id, role, content, files?, annotations?, created_at }, ... ] }

POST   /chat/:chatId
       Body: { messages: ChatMessage[], model?: string, displayed_doc?, attached_documents? }
       → Streaming LLM response
       ← EventSource streaming (text/event-stream)
```

### Chat in Progetto
```
POST   /projects/:projectId/chat
       Body: { messages: ChatMessage[], chat_id?, model?, displayed_doc?, attached_documents? }
       → Streaming LLM response (project-scoped context)
       ← EventSource streaming
```

### Documenti (Singoli)
```
GET    /single-documents
       → Lista documenti utente (non in progetto)
       ← [ MikeDocument[], ... ]

POST   /single-documents
       Body: FormData (file)
       → Upload nuovo documento
       ← { id, filename, status }

DELETE /single-documents/:documentId
       → Elimina documento
       ← 204 No Content

GET    /single-documents/:documentId/display
       Query: ?version_id=uuid (opzionale)
       → Viewer HTML: PDF rendering + DOCX HTML + metadata
       ← HTML con PDF.js viewer / DOCX renderer

POST   /single-documents/:documentId/new-version
       Body: FormData (file)
       → Carica nuova versione
       ← { id: versionId, version_number }

GET    /single-documents/:documentId/versions
       → Lista versioni documento
       ← [ { id, version_number, created_at, source }, ... ]

PUT    /single-documents/:documentId/resolve-edit
       Body: { edit_id, status: 'accepted' | 'rejected' }
       → Accept/reject edit tracciato
       ← { ok: true }
```

### Progetti
```
GET    /projects
       → Lista progetti (propri + condivisi)
       ← [ { id, user_id, name, cm_number, shared_with, is_owner, document_count, chat_count, review_count }, ... ]

POST   /projects
       Body: { name, cm_number?, shared_with?: email[] }
       → Crea progetto
       ← { id, name, ... }

GET    /projects/:projectId
       → Dettagli progetto + documenti + cartelle
       ← { project: Project, documents: Document[], folders: Folder[] }

PUT    /projects/:projectId
       Body: { name?, cm_number?, shared_with?: email[] }
       → Aggiorna progetto
       ← { id, ... }

DELETE /projects/:projectId
       → Elimina progetto (owner-only)
       ← 204 No Content

POST   /projects/:projectId/documents
       Body: FormData (file)
       → Upload doc in progetto
       ← { id, filename, ... }

GET    /projects/:projectId/documents
       → Lista documenti progetto
       ← [ Document[], ... ]

POST   /projects/:projectId/folders
       Body: { name, parent_folder_id?: uuid }
       → Crea cartella
       ← { id, name, parent_folder_id, ... }

PATCH  /projects/:projectId/documents/:docId/folder
       Body: { folder_id: uuid | null }
       → Sposta documento in cartella
       ← { ok: true }
```

### Tabular Reviews
```
GET    /tabular-review?project_id=uuid&type=all|in-project|standalone
       → Lista reviews (filtro opzionale per progetto)
       ← [ TabularReview[], ... ]

POST   /tabular-review
       Body: { title, project_id?, columns_config?: ColumnConfig[], workflow_id? }
       → Crea review
       ← { id, title, ... }

GET    /tabular-review/:reviewId
       → Dettagli review + celle
       ← { review: TabularReview, cells: { [colIndex:docId]: { summary, reasoning, flag } }, documents: Document[] }

PUT    /tabular-review/:reviewId
       Body: { title?, columns_config?, workflow_id?, shared_with? }
       → Aggiorna review
       ← { id, ... }

DELETE /tabular-review/:reviewId
       → Elimina review
       ← 204 No Content

POST   /tabular-review/:reviewId/chat
       Body: { messages: ChatMessage[], cell_location?: { col, doc } }
       → Streaming chat per cella
       ← EventSource streaming

PUT    /tabular-review/:reviewId/cells/:cellId
       Body: { content, flag? }
       → Update cella (manuale)
       ← { id, content, ... }

POST   /tabular-review/:reviewId/cells/:cellId/generate
       Body: { column_index, document_id, model? }
       → Genera contenuto cella via AI
       ← { content, citations, ... }

POST   /tabular-review/:reviewId/export
       → Export Excel
       ← File stream (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
```

### Workflows
```
GET    /workflows?type=assistant|tabular
       → Lista workflow visibili (builtin + custom + shared)
       ← [ Workflow[], ... ]

GET    /workflows/:workflowId
       → Dettagli workflow
       ← { id, title, type, prompt_md, columns_config, allow_edit, is_owner, shared_by_name }

POST   /workflows
       Body: { title, type, prompt_md, columns_config?, practice? }
       → Crea workflow custom
       ← { id, title, ... }

PUT    /workflows/:workflowId
       Body: { title?, prompt_md?, columns_config?, practice? }
       → Aggiorna workflow (owner-only)
       ← { id, ... }

DELETE /workflows/:workflowId
       → Elimina workflow (owner-only)
       ← 204 No Content

POST   /workflows/:workflowId/share
       Body: { shared_with_email, allow_edit: boolean }
       → Condividi workflow con email
       ← { id, shared_with_email, ... }

GET    /workflows/:workflowId/shares
       → Lista condivisioni workflow
       ← [ { shared_with_email, allow_edit, shared_by_user_id }, ... ]

DELETE /workflows/:workflowId/unshare?email=...
       → Revoca condivisione
       ← 204 No Content

POST   /workflows/:workflowId/hide
       → Nascondi workflow builtin (salva in hidden_workflows)
       ← { ok: true }
```

### Utente
```
POST   /user/profile
       Body: {} (vuoto)
       → Crea/upsert profilo utente
       ← { ok: true }

DELETE /user/account
       → Elimina account utente (Supabase Auth)
       ← 204 No Content

PUT    /users/:userId
       Body: { tabular_model?, claude_api_key?, gemini_api_key? }
       → Aggiorna impostazioni profilo
       ← { id, ... }
```

### Download
```
GET    /download/:token
       → Stream file con token HMAC-firmato
       ← File stream (pdf, docx, xlsx, etc.) + Content-Disposition header
```

### Health
```
GET    /health
       → Health check
       ← { ok: true }
```

---

## 8. MODELLI DI DATI / SCHEMA DB

### Entità Principali (Postgres)

#### **user_profiles**
```sql
id UUID PK
user_id UUID UNIQUE FK auth.users(id)
display_name TEXT
organisation TEXT
tier TEXT DEFAULT 'Free'
message_credits_used INTEGER DEFAULT 0
credits_reset_date TIMESTAMPTZ DEFAULT now() + 30 days
tabular_model TEXT DEFAULT 'gemini-3-flash-preview'
claude_api_key TEXT
gemini_api_key TEXT
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```
**Relazioni**: 1 user → 1 profilo  
**RLS**: Utente vede solo il suo profilo

#### **projects**
```sql
id UUID PK
user_id TEXT NOT NULL (FK implicitamente alla colonna user in auth.users)
name TEXT NOT NULL
cm_number TEXT
visibility TEXT DEFAULT 'private'
shared_with JSONB DEFAULT '[]' (array email)
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```
**Indici**: idx_projects_user, projects_shared_with_idx (GIN)  
**Relazioni**: 1 utente → N progetti  
**Sharing**: JSONB array di email per sharing

#### **project_subfolders**
```sql
id UUID PK
project_id UUID NOT NULL FK projects(id) ON DELETE CASCADE
user_id TEXT NOT NULL
name TEXT NOT NULL
parent_folder_id UUID FK project_subfolders(id) ON DELETE CASCADE
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```
**Gerarchia**: Albero cartelle (parent_folder_id → ricorsivo)

#### **documents**
```sql
id UUID PK
project_id UUID FK projects(id) ON DELETE CASCADE (NULL per doc singoli)
user_id TEXT NOT NULL
filename TEXT NOT NULL
file_type TEXT (pdf, docx, doc)
size_bytes INTEGER DEFAULT 0
page_count INTEGER
structure_tree JSONB (indice heading, level, page_number)
status TEXT DEFAULT 'pending' (pending, processing, ready, error)
folder_id UUID FK project_subfolders(id) ON DELETE SET NULL
current_version_id UUID FK document_versions(id) ON DELETE SET NULL
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```
**Indici**: idx_documents_user_project, idx_documents_project_folder  
**Relazioni**: 1 progetto → N documenti; 1 documento → N versioni

#### **document_versions**
```sql
id UUID PK
document_id UUID NOT NULL FK documents(id) ON DELETE CASCADE
storage_path TEXT NOT NULL (chiave R2)
pdf_storage_path TEXT (per PDF convertito da DOCX)
source TEXT DEFAULT 'upload' (upload, user_upload, assistant_edit, user_accept, user_reject, generated)
version_number INTEGER
display_name TEXT
created_at TIMESTAMPTZ DEFAULT now()
```
**Indici**: document_versions_document_id_idx, document_versions_doc_vnum_idx

#### **document_edits**
```sql
id UUID PK
document_id UUID NOT NULL FK documents(id) ON DELETE CASCADE
chat_message_id UUID FK chat_messages(id) ON DELETE SET NULL
version_id UUID NOT NULL FK document_versions(id) ON DELETE CASCADE
change_id TEXT NOT NULL (ID univoco edit)
del_w_id TEXT, ins_w_id TEXT (Word internal IDs)
deleted_text TEXT DEFAULT ''
inserted_text TEXT DEFAULT ''
context_before TEXT, context_after TEXT
status TEXT DEFAULT 'pending' (pending, accepted, rejected)
created_at TIMESTAMPTZ DEFAULT now()
resolved_at TIMESTAMPTZ
```
**Gerarchia**: Trackback a chat_message (quale messaggio ha suggerito l'edit)

#### **workflows**
```sql
id UUID PK
user_id TEXT (NULL per builtin/system)
title TEXT NOT NULL
type TEXT NOT NULL (assistant, tabular)
prompt_md TEXT (istruzioni LLM)
columns_config JSONB (per type=tabular)
practice TEXT (Corporate, General Transactions, ecc.)
is_system BOOLEAN DEFAULT false
created_at TIMESTAMPTZ DEFAULT now()
```
**Indice**: idx_workflows_user  
**Sharing**: tramite workflow_shares

#### **workflow_shares**
```sql
id UUID PK
workflow_id UUID NOT NULL FK workflows(id) ON DELETE CASCADE
shared_by_user_id TEXT NOT NULL
shared_with_email TEXT NOT NULL
allow_edit BOOLEAN DEFAULT false
created_at TIMESTAMPTZ DEFAULT now()
UNIQUE(workflow_id, shared_with_email)
```

#### **chats**
```sql
id UUID PK
project_id UUID FK projects(id) ON DELETE CASCADE (NULL per global)
user_id TEXT NOT NULL
title TEXT
created_at TIMESTAMPTZ DEFAULT now()
```
**Indici**: idx_chats_user, idx_chats_project

#### **chat_messages**
```sql
id UUID PK
chat_id UUID NOT NULL FK chats(id) ON DELETE CASCADE
role TEXT NOT NULL (user, assistant)
content JSONB (STRING per user, ARRAY<AssistantEvent> per assistant)
files JSONB ([ { filename, document_id? }, ... ])
annotations JSONB ([ MikeCitationAnnotation, ... ])
created_at TIMESTAMPTZ DEFAULT now()
```
**Indice**: idx_chat_messages_chat

#### **tabular_reviews**
```sql
id UUID PK
project_id UUID FK projects(id) ON DELETE CASCADE (NULL per standalone)
user_id TEXT NOT NULL
title TEXT
columns_config JSONB ([ { index, name, format, prompt, tags? }, ... ])
workflow_id UUID FK workflows(id) ON DELETE SET NULL
practice TEXT
shared_with JSONB DEFAULT '[]' (email array)
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

#### **tabular_cells**
```sql
id UUID PK
review_id UUID NOT NULL FK tabular_reviews(id) ON DELETE CASCADE
document_id UUID NOT NULL FK documents(id) ON DELETE CASCADE
column_index INTEGER NOT NULL
content TEXT (summary)
citations JSONB (citation array)
status TEXT DEFAULT 'pending' (pending, accepted, rejected)
created_at TIMESTAMPTZ DEFAULT now()
UNIQUE(review_id, document_id, column_index)
```

#### **tabular_review_chats**
```sql
id UUID PK
review_id UUID NOT NULL FK tabular_reviews(id) ON DELETE CASCADE
user_id TEXT NOT NULL
title TEXT
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

#### **tabular_review_chat_messages**
```sql
id UUID PK
chat_id UUID NOT NULL FK tabular_review_chats(id) ON DELETE CASCADE
role TEXT NOT NULL (user, assistant)
content JSONB
annotations JSONB
created_at TIMESTAMPTZ DEFAULT now()
```

#### **hidden_workflows**
```sql
id UUID PK
user_id TEXT NOT NULL
workflow_id TEXT NOT NULL
created_at TIMESTAMPTZ DEFAULT now()
UNIQUE(user_id, workflow_id)
```

---

## 9. ROUTING FRONTEND

### Pagine & Route

| Path | File | Scopo | Auth Richiesto |
|------|------|-------|----------------|
| `/` | page.tsx | Home redirect → /assistant | No |
| `/login` | login/page.tsx | Form login | No |
| `/signup` | signup/page.tsx | Form signup | No |
| `/assistant` | (pages)/assistant/page.tsx | Chat globale (initial view o list) | Yes |
| `/assistant/chat/:id` | (pages)/assistant/chat/[id]/page.tsx | Chat detail + streaming | Yes |
| `/projects` | (pages)/projects/page.tsx | Projects overview | Yes |
| `/projects/:id` | (pages)/projects/[id]/page.tsx | Project detail (albero doc) | Yes |
| `/projects/:id/assistant/chat/:chatId` | (pages)/projects/[id]/assistant/chat/[chatId]/page.tsx | Chat in progetto | Yes |
| `/projects/:id/tabular-reviews/:reviewId` | (pages)/projects/[id]/tabular-reviews/[reviewId]/page.tsx | Tabular review in progetto | Yes |
| `/tabular-reviews` | (pages)/tabular-reviews/page.tsx | Tabular reviews overview | Yes |
| `/tabular-reviews/:id` | (pages)/tabular-reviews/[id]/page.tsx | Tabular review detail | Yes |
| `/workflows` | (pages)/workflows/page.tsx | Workflows list | Yes |
| `/workflows/:id` | (pages)/workflows/[id]/page.tsx | Workflow detail | Yes |
| `/account` | (pages)/account/page.tsx | Account settings | Yes |
| `/account/models` | (pages)/account/models/page.tsx | Model selection | Yes |

### Navigazione
- **Protected**: Layout `(pages)` wrappa tutte le rotte autenticate
- **Redirect**: Se non autenticato, AuthContext protegge via redirect a login
- **Sidebar**: AppSidebar fornisce nav principale (tabs + recent chats)

---

## 10. CONFIGURAZIONE E AMBIENTE

### Variabili d'Ambiente Richieste

#### Backend (`.env`)
```
PORT=3001
FRONTEND_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-service-role-key

# Cloudflare R2
R2_ENDPOINT_URL=https://account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=mike (optional, default)

# LLM API Keys
GEMINI_API_KEY=your-gemini-key (optional)
ANTHROPIC_API_KEY=your-anthropic-key (optional)
OPENROUTER_API_KEY=your-openrouter-key (optional)

# Email (Resend)
RESEND_API_KEY=your-resend-key (optional)

# Download tokens signing (optional, fallback to SUPABASE_SECRET_KEY)
DOWNLOAD_SIGNING_SECRET=your-secret

# Next.js environment (se frontend è su stessa build)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
```

#### Frontend (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001 (dev) o https://api.example.com (prod)

# Per dev interno
SUPABASE_SECRET_KEY=your-service-role-key (se usato in server components)
```

### Setup Iniziale

1. **Clone repo**:
   ```bash
   git clone https://github.com/willchen96/mike
   cd mike
   ```

2. **Install dipendenze**:
   ```bash
   npm install --prefix backend
   npm install --prefix frontend
   ```

3. **Configura `.env`**:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.local.example frontend/.env.local
   # Edit files con vostre credenziali
   ```

4. **Setup Supabase**:
   - Crea progetto Supabase
   - Esegui SQL schema: `backend/migrations/000_one_shot_schema.sql`
   - Copia URL + keys nel `.env`

5. **Setup R2 (Cloudflare)**:
   - Crea bucket R2
   - Genera API token
   - Copia endpoint + keys nel `.env`

6. **Setup LLM**:
   - Crea account Anthropic, Google Cloud (Gemini)
   - Copia API keys nel `.env`

7. **Avvia dev**:
   ```bash
   npm run dev --prefix backend  # Terminal 1, port 3001
   npm run dev --prefix frontend # Terminal 2, port 3000
   ```

8. **Apri browser**:
   ```
   http://localhost:3000
   ```

---

## 11. PUNTI DI ESTENSIONE - AGGIUNGERE FEATURE

### Scenario 1: Aggiungere una Nuova Entità (es. "Legal Notes")

#### Ordine passi:

1. **Database** (`backend/migrations/`):
   - Creare migration SQL che aggiunga tabella `legal_notes` con colonne opportune
   - Aggiungere indici, RLS policies
   - Esempio:
     ```sql
     CREATE TABLE legal_notes (
       id UUID PK,
       document_id UUID FK documents(id),
       user_id TEXT,
       content TEXT,
       tags JSONB,
       created_at TIMESTAMPTZ
     );
     ```

2. **Backend API** (`backend/src/routes/`):
   - Creare nuovo file `legalNotes.ts` con router
   - Endpoint: `GET /legal-notes`, `POST /legal-notes`, `PUT /legal-notes/:id`, `DELETE /legal-notes/:id`
   - Implementare access checks via `lib/access.ts`
   - Registrare router in `index.ts`: `app.use("/legal-notes", legalNotesRouter);`

3. **Backend Lib** (`backend/src/lib/`):
   - Se serve logica complessa, estrarre in `legalNotes.ts` lib
   - Aggiungere alle `chatTools.ts` se serve interazione IA (tool definitions)

4. **Frontend Types** (`frontend/src/app/components/shared/types.ts`):
   - Aggiungere interfaccia TypeScript: `interface MikeLegalNote { id, documentId, content, tags, createdAt }`

5. **Frontend API** (`frontend/src/app/lib/mikeApi.ts`):
   - Aggiungere funzioni:
     ```typescript
     export async function listLegalNotes(docId: string) { ... }
     export async function createLegalNote(docId, content, tags) { ... }
     export async function updateLegalNote(id, content, tags) { ... }
     export async function deleteLegalNote(id) { ... }
     ```

6. **Frontend Components** (`frontend/src/app/components/shared/` o nuova cartella `legalNotes/`):
   - Creare `LegalNotesList.tsx` (render lista)
   - Creare `LegalNoteModal.tsx` (create/edit form)
   - Integrare in `DocPanel.tsx` o creare nuovo tab in `ToolbarTabs.tsx`

7. **Frontend Page/Hook**:
   - Se serve dedicata: aggiungere rotta in `(pages)/legal-notes/page.tsx`
   - Creare custom hook `useLegalNotes.ts` se serve reactive state

---

### Scenario 2: Aggiungere Workflow Personalizzato (Tabular)

#### Ordine passi:

1. **Frontend** (`frontend/src/app/components/workflows/builtinWorkflows.ts`):
   - Aggiungere oggetto workflow:
     ```typescript
     {
       id: "builtin-my-workflow",
       user_id: null,
       is_system: true,
       created_at: "",
       title: "My Custom Review",
       type: "tabular",
       practice: "My Practice",
       prompt_md: "## Detailed instructions for LLM...",
       columns_config: [
         { index: 0, name: "Column1", format: "text", prompt: "..." },
         { index: 1, name: "Column2", format: "tag", prompt: "...", tags: ["tag1", "tag2"] }
       ]
     }
     ```

2. **Backend** (`backend/src/lib/builtinWorkflows.ts`):
   - Aggiungere stessa definizione (per sincronizzazione)

3. **Frontend Components**:
   - Il workflow appare automaticamente in `/workflows` (caricato via API)
   - Se serve customizzazione UI, editare `NewWorkflowModal.tsx` o `WorkflowPromptEditor.tsx`

---

### Scenario 3: Aggiungere LLM Provider (es. OpenAI)

#### Ordine passi:

1. **Backend Types** (`backend/src/lib/llm/types.ts`):
   - Aggiungere `"openai"` a union type `Provider`
   - Aggiungere `openai?: string | null` a `UserApiKeys`

2. **Backend Models** (`backend/src/lib/llm/models.ts`):
   - Aggiungere costanti:
     ```typescript
     export const OPENAI_MAIN_MODELS = ["gpt-4-turbo", "gpt-4"] as const;
     ```

3. **Backend LLM Module** (`backend/src/lib/llm/`):
   - Creare `openai.ts` con:
     - `streamOpenAI(params)`: Loop streaming con tool calling
     - `completeOpenAIText(params)`: One-shot
   - Aggiornare `tools.ts` con `toOpenAITools()` (probabilmente passthrough)

4. **Backend Index** (`backend/src/lib/llm/index.ts`):
   - Aggiornare dispatcher:
     ```typescript
     export async function streamChatWithTools(params) {
       const provider = providerForModel(params.model);
       if (provider === "claude") return streamClaude(params);
       if (provider === "openai") return streamOpenAI(params);
       return streamGemini(params);
     }
     ```

5. **Frontend** (`frontend/src/app/lib/modelAvailability.ts`):
   - Aggiungere costante modelli OpenAI se necessario

6. **User Settings** (`backend/src/lib/userSettings.ts`):
   - Aggiornare store API keys per includere OpenAI

---

### Scenario 4: Aggiungere Tool LLM (es. "search_legal_database")

#### Ordine passi:

1. **Backend chatTools** (`backend/src/lib/chatTools.ts`):
   - Aggiungere tool definition OpenAI-style:
     ```typescript
     {
       type: "function",
       function: {
         name: "search_legal_database",
         description: "Search external legal database",
         parameters: {
           type: "object",
           properties: {
             query: { type: "string", description: "Search query" }
           },
           required: ["query"]
         }
       }
     }
     ```
   - Aggiungere handler nella `runTools` callback:
     ```typescript
     if (toolName === "search_legal_database") {
       const results = await externalLegalSearch(args.query);
       return JSON.stringify(results);
     }
     ```

2. **Backend Lib** (opzionale, `backend/src/lib/externalSearch.ts`):
   - Implementare `externalLegalSearch(query)` se serve logica complessa

3. **System Prompt** (`backend/src/lib/chatTools.ts`):
   - Aggiungere istruzioni nel `SYSTEM_PROMPT` su quando/come usare il tool

4. **Frontend** (opzionale):
   - Se serve mostrare evento tool call, aggiungere event handler in `useAssistantChat.ts` e rendering in `AssistantMessage.tsx`

---

### Scenario 5: Aggiungere Pagina nuova (es. "Settings Avanzate")

#### Ordine passi:

1. **Route** (`frontend/src/app/(pages)/advanced-settings/`):
   - Creare cartella + `page.tsx`
   - Implementare componente con useState + form

2. **Components** (`frontend/src/app/components/shared/` o nuova cartella):
   - Creare `AdvancedSettingsForm.tsx`

3. **API** (`frontend/src/app/lib/mikeApi.ts`):
   - Se serve backend: aggiungere fetch functions

4. **Sidebar** (`frontend/src/app/components/shared/AppSidebar.tsx`):
   - Aggiungere link a `/advanced-settings`

---

### Scenario 6: Supportare Nuovo Formato File (es. `.xlsx`)

#### Ordine passi:

1. **Backend Upload** (`backend/src/routes/documents.ts`):
   - Aggiungere `.xlsx` a `ALLOWED_TYPES`

2. **Backend Conversion** (`backend/src/lib/convert.ts`):
   - Se serve conversione a PDF:
     ```typescript
     export async function xlsxToPdf(buffer: Buffer): Promise<Buffer> {
       // Implement using LibreOffice or libreoffice-convert
     }
     ```

3. **Backend Document Viewer** (`backend/src/routes/documents.ts` endpoint GET `/display`):
   - Aggiungere case per type="xlsx"
   - Ritornare HTML renderer (usare `exceljs` per parse)

4. **Frontend DocView** (`frontend/src/app/components/shared/DocView.tsx`):
   - Aggiungere rendering per Excel (usare `exceljs` + custom table)

5. **Frontend FileIcon** (`frontend/src/app/components/shared/DocumentCard.tsx`):
   - Aggiungere icona per `.xlsx`

---

## CONCLUSIONE

Mike è un'architettura full-stack ben strutturata con:
- **Backend Express** layered con LLM provider adapters + tool calling
- **Frontend Next.js App Router** con React hooks + Tailwind styling
- **Database Supabase/Postgres** con RLS + sharing policies
- **Storage R2** S3-compatible per file bulk
- **Multiple LLM providers** (Claude, Gemini) con fallback

Per aggiungere features:
1. Partire **sempre dal DB** (new tables/schema)
2. Implementare **API routes** con access checks
3. Aggiungere **frontend API wrapper** (mikeApi.ts)
4. Creare **componenti React** e integrare in pagine
5. Aggiornare **sidebar/routing** se necessario

Il progetto è AGPL-3.0-only — qualsiasi modifica deve preservare la licenza.