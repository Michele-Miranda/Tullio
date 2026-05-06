# Tullio — Integrazione con fonti normative italiane

**Data:** 2026-05-06
**Preparato per:** Tullio (fork di Mike per studi legali italiani)
**Repo:** https://github.com/Michele-Miranda/Tullio
**Stack assunto:** Next.js 16 + Express/TypeScript + Supabase (Postgres + pgvector + Auth) + Cloudflare R2 + Anthropic Claude / Google Gemini
**Scope:** mappare le fonti normative e giurisprudenziali italiane riusabili, valutarne l'accesso programmatico, e proporre un'architettura concreta che permetta a Tullio di citare la legge corretta, verificare la vigenza e fare RAG su norme e giurisprudenza senza allucinare.

**Key finding (TL;DR):** A partire dal **1° gennaio 2026** Normattiva espone i suoi dati in **Akoma Ntoso 3.0 XML** sotto licenza **CC-BY 4.0** con API REST documentate (`/api/v1/atto/dettaglio-atto-urn`) e bulk download. Questo cambia radicalmente il problema: Tullio può costruire un RAG su corpus normativo ufficiale, in produzione, **senza** dipendere da banche dati commerciali (DeJure, OneLegale) per la legislazione di base. La giurisprudenza di Cassazione resta più scomoda — l'archivio gratuito SentenzeWeb copre solo gli ultimi 5 anni e non ha API. Per coprire bene le sentenze serve fallback commerciale (OneLegale, DeJure) o uso del dataset MIT sui provvedimenti GU 1991-2023 di mii-llm su Hugging Face.

---

## Indice

1. Tabella riepilogativa fonti
2. Analisi dettagliata delle 4 fonti core
   - 2.1 Normattiva 2.0 (OpenData)
   - 2.2 Gazzetta Ufficiale + ELI italiano
   - 2.3 EUR-Lex / CELLAR (per diritto UE rilevante)
   - 2.4 Cassazione (SentenzeWeb, ECLI, Italgiure)
3. Standard tecnici (URN-LEX, Akoma Ntoso, ELI, ECLI) e librerie
4. Aspetti legali del riuso
5. Architettura raccomandata per Tullio
6. Roadmap MVP (Sprint 1-4)
7. Stima effort
8. Rischi e mitigazioni
9. Bibliografia

---

## 1. Tabella riepilogativa fonti

| Fonte | Cosa offre | Accesso tecnico | Licenza | Costo | Priorità per Tullio |
|---|---|---|---|---|---|
| **Normattiva** ([dati.normattiva.it](https://dati.normattiva.it/)) | Legislazione statale consolidata (1861-oggi), versioni vigente/storiche/originali, Akoma Ntoso XML | REST API (`api.normattiva.it`) + bulk download + URN-LEX resolver | **CC-BY 4.0** dal 1/1/2026 | Gratis | **P0 — core** |
| **Gazzetta Ufficiale** ([gazzettaufficiale.it](https://www.gazzettaufficiale.it/)) | GU storica, 7 serie, RSS feed per ultime pubblicazioni, ELI URI dal 2015 | RSS + ELI URI risolvibile, scraping HTML, niente API JSON | Pubblico dominio (art. 5 LDA) | Gratis | **P0 — per "ultime pubblicazioni"** |
| **EUR-Lex / CELLAR** ([eur-lex.europa.eu](https://eur-lex.europa.eu/)) | Diritto UE: regolamenti, direttive, decisioni, sentenze CGUE | SPARQL endpoint + REST + ELI URI multilingue (incl. ITA) | Riuso libero (anche commerciale) con attribuzione | Gratis (timeout 60s, max ~5 conn) | **P1 — per direttive UE rilevanti** |
| **Cassazione SentenzeWeb** ([italgiure.giustizia.it/sncass/](https://www.italgiure.giustizia.it/sncass/)) | Sentenze civili e penali di Cassazione **ultimi 5 anni**, anonimizzate dal 1/1/2016 | Web search, no API ufficiale, scraping fragile | Pubblico dominio (massime/sentenze come atti) | Gratis (utenti pro per testo integrale) | **P1 — gratis per casistica recente** |
| **ItalgiureWeb completo** ([italgiure.giustizia.it](https://www.italgiure.giustizia.it/)) | Archivi storici completi CED Cassazione | Solo abbonamento (avvocati / studi) | Riservato sottoscrittori | A pagamento | P2 |
| **Corte Costituzionale OpenData** ([dati.cortecostituzionale.it](https://dati.cortecostituzionale.it/)) | ~18.000 sentenze 1956-oggi in XML/JSON/CSV, ECLI, dati biografici giudici | Download dataset, ECLI resolver | **CC BY-SA 3.0** | Gratis | **P1** |
| **Senato OpenData** ([dati.senato.it](https://dati.senato.it/)) | Disegni di legge, votazioni, dossier in Akoma Ntoso XML, SPARQL endpoint (34M triple) | SPARQL `/sparql`, GitHub Akoma Ntoso bulk | **CC BY 3.0** | Gratis | P2 |
| **Camera OpenData** ([dati.camera.it](https://dati.camera.it/)) | DDL, votazioni, anagrafica deputati | Linked Open Data | **CC BY 3.0** | Gratis | P2 |
| **Garante Privacy** ([garanteprivacy.it/gpdp-rss](https://www.garanteprivacy.it/gpdp-rss)) | Provvedimenti, linee guida, sanzioni | **RSS feed** + scraping | Pubblico dominio | Gratis | **P1** (privacy/GDPR è caso d'uso forte per studi) |
| **Agenzia Entrate** ([agenziaentrate.gov.it](https://www.agenziaentrate.gov.it/portale/rss)) | Circolari, risoluzioni, risposte interpello | **RSS feed** + scraping | Pubblico dominio | Gratis | **P1** (fiscale) |
| **Consob, Banca d'Italia, AGCM** | Regolamenti, provvedimenti sanzionatori | Scraping HTML, qualche RSS, niente API native | Pubblico dominio | Gratis | P2 |
| **InfoCamere / Telemaco** ([registroimprese.it](https://www.registroimprese.it/)) | Visure camerali, bilanci | API B2B XML | Commerciale, prepagato | ~€500+IVA per ricarica | P3 (out of scope MVP) |
| **HF dataset `mii-llm/gazzetta-ufficiale`** ([HuggingFace](https://huggingface.co/datasets/mii-llm/gazzetta-ufficiale)) | 1.43M righe GU 1991-2023, Parquet | Datasets/Dask/Croissant | **MIT** | Gratis | **P0 per bootstrap RAG** |
| **HF dataset `swap-uniba/normattiva-dump`** | 773MB JSON Normattiva | HF datasets | **CC BY-NC-SA 4.0** | Gratis | Avoid (NC = no uso commerciale) |
| **OneLegale + Libra** (Wolters Kluwer) | Tutto consolidato + giurisprudenza + dottrina + AI workspace | Add-in Word/Outlook proprietari, no API B2B pubblicizzata | Commerciale | Su preventivo | P3 (concorrente, non integrazione) |
| **DeJure** (Lefebvre Giuffrè) | 4M+ documenti, codici commentati | Web app, no API B2B pubblicizzata | Commerciale | Su preventivo | P3 |

---

## 2. Analisi dettagliata delle 4 fonti core

### 2.1 Normattiva 2.0 (OpenData)

**Stato (maggio 2026):** Il 1° gennaio 2026 Normattiva ha rilasciato i dati come "open data" sotto licenza **Creative Commons CC BY 4.0** ([forum.italia.it](https://forum.italia.it/t/normattiva-open-data/536)). Questo risolve la storica ambiguità che faceva di Normattiva una banca dati di fatto pubblica ma con barriere tecniche al riuso massivo (CAPTCHA, sessioni stateful, niente bulk).

**Cosa contiene:** legislazione statale italiana consolidata dal **1861 a oggi** — Costituzione, codici (civile, penale, di procedura civile e penale, navigazione, ecc.), leggi, decreti-legge, decreti legislativi, regi decreti tuttora vigenti, decreti del Presidente della Repubblica. Per ogni atto si possono ottenere quattro varianti: testo originale, testo vigente alla data corrente, testo vigente a una data specifica, multivigente ([normattiva.it/staticPage/utilita](https://www.normattiva.it/staticPage/utilita)).

**Modalità di accesso:**

1. **URN-LEX resolver** (sempre stato disponibile): `https://www.normattiva.it/uri-res/N2Ls?<URN>`. Esempi:
   - Codice civile, art. 1382: `https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:regio.decreto:1942-03-16;262:2~art1382!vig=`
   - L. 392/1978 (locazione), art. 27: `https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1978-07-27;392~art27`
   - Costituzione: `https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:costituzione:1947-12-27`
   - **Attenzione:** per i codici codificati come Regi Decreti (civ., pen., proc.civ., proc.pen.) serve l'**indice di allegato** (`:2~art1382` dove `2` è l'allegato), altrimenti il link punta al primo articolo del Regio Decreto invece che all'articolo del codice. Questo è il bug ricorrente segnalato da Filippo Strozzi nella skill Claude documentata su [avvocati-e-mac.it](https://avvocati-e-mac.it/blog/2026/4/13/skill-link-norme-italiane-perplexity-claude).

2. **REST API OpenData** documentata in `MDL-ITSMS-00-GEN REV00 Normattiva Specifiche API Open Data` ([PDF](https://dati.normattiva.it/assets/come_fare_per/API_Normattiva_OpenData.pdf), [HTML/Apidog](https://dati.normattiva.it/assets/come_fare_per/Normattiva%20OpenData.html)). Endpoint principali:

   | Path | Metodo | Funzione |
   |---|---|---|
   | `/bff-opendata/v1/api/v1/atto/dettaglio-atto-urn` | POST | Ottiene il dettaglio di un atto data una URN, con possibilità di navigare per articolo (verbatim AKN) |
   | `/bff-opendata/v1/api/v1/ricerca-asincrona/nuova-ricerca` | POST | Ricerca asincrona full-text/per metadati |
   | `/bff-opendata/v1/api/v1/tipologiche/estensioni` | GET | Tipologie atti |
   | `/bff-opendata/v1/api/v1/collections/collection-predefinite` | GET | Collezioni predefinite |
   | `/bff-opendata/v1/api/v1/ricerca/predefinita` | GET/POST | Ricerca predefinita |

   Base URL produzione: `https://api.normattiva.it/t/normattiva.api/`
   Base URL pre-produzione: `https://pre.api.normattiva.it/t/normattiva.api/`

   Esempio di payload `/atto/dettaglio-atto-urn`:
   ```json
   {"urn":"urn:nir:stato:legge:2001-12-28;448~art2"}
   ```
   Aggiornamenti documentati: 20/02/2026 (param `dataVigenza`), 10/03/2026 (vista dettaglio per URN). La spec è in evoluzione.

3. **Bulk download** dal portale `dati.normattiva.it/Come-scaricare-i-dati`. Storicamente i dati dal sito non erano pienamente "open" per assenza di bulk; questo è stato sanato con il rilascio 2026 ([forum.italia.it](https://forum.italia.it/t/normattiva-open-data/536/20)). I file sono in **Akoma Ntoso 3.0 XML**.

4. **URL pseudo-legacy XML diretto:** `https://www.normattiva.it/do/atto/caricaAKN?dataGU=<date>&codiceRedaz=<code>&dataVigenza=<date>` restituisce direttamente l'XML AKN. Utile come fallback ma non dichiarato come API stabile.

**Limiti / disclaimer:** Normattiva storicamente disclaimava che "I testi presenti nella banca dati… non hanno carattere di ufficialità", restando il testo ufficiale quello pubblicato in GU. **Implicazione operativa per Tullio:** in produzione una citazione deve riportare URN, link a Normattiva, data di consultazione, e (idealmente) link alla GU originaria via ELI.

**Rate limit:** Non documentato pubblicamente al maggio 2026. Approccio prudente: 1-5 req/s con backoff esponenziale, monitorare 429/503. Non ho trovato terms of service che vietino il caching aggressivo, e il rilascio CC-BY 4.0 implicitamente lo autorizza.

**Pratica raccomandata:** non interrogare Normattiva ad ogni query utente. Costruire un mirror locale (vedi §5) e interrogare l'API solo per (a) atti molto recenti non ancora nel mirror, (b) controllo vigenza on-demand con `dataVigenza`.

### 2.2 Gazzetta Ufficiale + ELI italiano

**Stato:** L'Istituto Poligrafico e Zecca dello Stato pubblica la GU online dal 2009 ed è stato uno dei primi enti europei ad **implementare ELI** (European Legislation Identifier) ([eur-lex.europa.eu/eli-register/news_item_5.html](https://eur-lex.europa.eu/eli-register/news_item_5.html)). Due pattern URI ELI sono attivi su `gazzettaufficiale.it`:
- Atto: `https://www.gazzettaufficiale.it/eli/id/AAAA/MM/GG/<id>/sg`
- Singola GU: `https://www.gazzettaufficiale.it/eli/gu/AAAA/M/GG/<num>/sg/html`

Esempio: `https://www.gazzettaufficiale.it/eli/id/2015/04/16/15G00055/sg`.

**Modalità di accesso:**
- **RSS feed** per ogni serie (Serie Generale, Concorsi, ecc.) — utile come trigger per cron di aggiornamento. Si trovano nella homepage GU in "Ultime Gazzette pubblicate" ([gazzettaufficiale.it FAQ](https://www.gazzettaufficiale.it/caricaHtml?nomeTiles=faq)).
- **Niente API REST/JSON** ufficiale al maggio 2026.
- I documenti sono pubblicati come **HTML solo**, non XML strutturato (a differenza di Normattiva).
- Ricerca per parola chiave / data via portale web.

**Implicazione per Tullio:** GU è la fonte di verità per pubblicazione (data di pubblicazione = inizio vacatio legis), ma il contenuto strutturato consultabile da macchina è già in Normattiva. Per Tullio il valore di GU è soprattutto:
1. **RSS come trigger di aggiornamento** del mirror Normattiva.
2. **Link al PDF / HTML originale** della GU per garanzia di originalità in citazioni.

**Dataset alternativo:** `mii-llm/gazzetta-ufficiale` su Hugging Face ([link](https://huggingface.co/datasets/mii-llm/gazzetta-ufficiale)) contiene **1,43M righe** in **Parquet**, **3,2 GB**, copertura **1991-2023**, licenza **MIT**, suddiviso in 6 tipologie documentali (Serie Generale, Corte Costituzionale, Regioni, Concorsi, Contratti pubblici, Parte Seconda). Pubblicato da Federici, Ferraretto, Landro (2024). Ottimo come bootstrap per RAG storico, ma non aggiornato in tempo reale.

### 2.3 EUR-Lex / CELLAR

**Quando rileva per Tullio:** ogni volta che una norma italiana attua una direttiva UE (privacy = GDPR, data act, AI Act, antiriciclaggio, ecc.). Avere l'accesso al diritto UE in italiano (e in lingua originale per resistenza alla traduzione) è importante.

**Endpoint chiave:**
- **SPARQL endpoint:** `https://publications.europa.eu/webapi/rdf/sparql` ([data.europa.eu](https://data.europa.eu/data/datasets/sparql-cellar-of-the-publications-office?locale=en)). GET o POST, niente auth, timeout query 60s, throttling per IP, mantenere <5 connessioni concorrenti, backoff esponenziale su 429/503 ([polzia.com guide](https://polzia.com/blog/eur-lex-cellar-api-developers-guide)).
- **REST CELLAR:** `GET https://publications.europa.eu/resource/cellar/<uuid>` con content negotiation via `Accept` header (`application/xhtml+xml`, `application/pdf`, `application/sparql-results+json`, ecc.).
- **ELI URI multilingue:** `http://data.europa.eu/eli/{tipo}/{anno}/{numero}/oj/ita` (italiano), es. `http://data.europa.eu/eli/reg/2024/1689/oj/ita` per l'AI Act in italiano.

**Licenza:** riuso libero (anche commerciale) con attribuzione richiesta ([eur-lex.europa.eu/content/help/data-reuse](https://eur-lex.europa.eu/content/help/data-reuse/reuse-contents-eurlex-details.html)).

**SDK pronti:**
- R: pacchetto **`eurlex`** ([CRAN](https://cran.r-project.org/web/packages/eurlex/readme/README.html)) — costruisce query SPARQL, recupera contenuti.
- Python: **`tulit`** ([readthedocs](https://tulit-docs.readthedocs.io/en/latest/)) — parser Akoma Ntoso/Formex/HTML per CELLAR + Legifrance.
- Wrapper commerciale: [LexAPI](https://lex-api.com/).

### 2.4 Cassazione: SentenzeWeb, ECLI, Italgiure

**SentenzeWeb** ([italgiure.giustizia.it/sncass/](https://www.italgiure.giustizia.it/sncass/)) è **gratuito e pubblico**. Permette ricerca per parola chiave, riferimento normativo, data. Copertura: anno corrente + **5 anni precedenti** (es. nel 2026 si vede 2021-2026). I provvedimenti civili dal 1/1/2016 sono **anonimizzati** rispetto ai dati personali. Niente API ufficiale: bisogna fare scraping HTML (fragile + termini di servizio da verificare).

**ItalgiureWeb completo** ([italgiure.giustizia.it](https://www.italgiure.giustizia.it/)) richiede abbonamento (avvocati iscritti agli Albi, magistrati, studi paganti). Niente API B2B documentata.

**ECLI:** la Corte di Cassazione, attraverso il CED, ha implementato gli identificativi **ECLI:IT:CASS:<anno>:<id>** in ogni sentenza degli archivi SNCIV/SNPEN ([italgiure.giustizia.it/eclinews](https://www.italgiure.giustizia.it/informativaIWEB/eclinews.htm)). Risolutore europeo: `https://e-justice.europa.eu/ecli/ECLI:IT:CASS:2018:32622CIV` ([e-justice.europa.eu](https://e-justice.europa.eu/topics/legislation-and-case-law/european-case-law-identifier-ecli_en)).

**Corte Costituzionale OpenData** ([dati.cortecostituzionale.it](https://dati.cortecostituzionale.it/)) è invece **completamente aperta**: ~18.000 sentenze dal 1956 in XML/JSON/CSV, **CC BY-SA 3.0**. Per studi che fanno costituzionale è una manna.

**Dataset rilevanti su HF:**
- `dlicari/Italian-Legal-BERT` — BERT preallenato su 3,7 GB di archivio giurisprudenziale nazionale ([HF](https://huggingface.co/dlicari/Italian-Legal-BERT)). Usabile come embedding model domain-specific.
- `itacasehold/itacasehold` — 1101 coppie sentenza/massima della Giustizia Amministrativa 2019-2022.
- LAWSUIT — 14k sentenze Corte Costituzionale con massime espertali.

**Caveat fondamentale per Tullio:** la giurisprudenza è il punto debole dell'open data italiano. Se gli utenti di Tullio chiedono "trova le sentenze di Cassazione su X" e Tullio risponde solo con SentenzeWeb scraping degli ultimi 5 anni o con dataset HF, non è competitivo con DeJure/OneLegale che hanno tutto. Strategie alternative:
1. **Dichiarare il limite** ("Tullio attualmente copre solo Cassazione 2021-2026 e Corte Cost. completa") e rendere esplicito.
2. Costruire scraper conforme ai TOS di SentenzeWeb (verificare).
3. Integrazione opzionale a pagamento con OneLegale/DeJure quando lo studio cliente già ha un abbonamento (delegation login / passthrough).

---

## 3. Standard tecnici e librerie

### 3.1 URN-LEX / URN:NIR

**Standard:** URN:LEX è uno standard IETF (draft "lex" namespace) per identificare in modo univoco e persistente fonti del diritto. La declinazione italiana è **URN:NIR** (Norme In Rete), pubblicata in GU n. 262 del 10/11/2001 (Circolare AIPA CR/35) ([padocs.it](https://www.padocs.it/identificare-i-documenti-tramite-urn), [agendadigitale.eu](https://www.agendadigitale.eu/documenti/identificare-univocamente-i-documenti-pubblici-perche-urnlex-e-la-chiave/)).

**Sintassi:** `urn:nir:<autorità>:<tipologia>:<data emanazione AAAA-MM-GG>;<numero>[:allegato][~art<N>][!vig=][@originale]`

Componenti:
- `<autorità>`: `stato`, `regione.lombardia`, `comune.milano`…
- `<tipologia>`: `legge`, `decreto.legge`, `decreto.legislativo`, `regio.decreto`, `costituzione`, `codice.civile`…
- `<data emanazione>`: data di **emanazione** (firma), non di pubblicazione GU. Il delta può essere settimane.
- `<numero>`: numero progressivo dell'atto.
- `:allegato`: per i codici come Regi Decreti, il numero d'allegato (`:2` per Codice Civile RD 16/3/1942 n. 262).
- `~art<N>`: deep link all'articolo (es. `~art1382`, `~art27bis`).
- `!vig=`: variante "in vigore alla data odierna".
- `@originale`: testo originale immutato.

**Risoluzione:** Normattiva ha l'unico resolver pubblico operativo per il diritto italiano statale: `https://www.normattiva.it/uri-res/N2Ls?<URN>`.

### 3.2 Akoma Ntoso 3.0

**Cos'è:** standard OASIS internazionale per markup XML di atti legislativi e giudiziari, basato sul modello bibliografico **FRBR** (Work / Expression / Manifestation / Item) ([context7 oasis-open/legaldocml-akomantoso](https://github.com/oasis-open/legaldocml-akomantoso)). Adottato in Italia da Normattiva, Senato (sperimentale, [GitHub SenatoDellaRepubblica/AkomaNtosoBulkData](https://github.com/SenatoDellaRepubblica/AkomaNtosoBulkData)) e Cassazione.

**Struttura tipica di una legge italiana in AKN 3.0:**
```xml
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0">
  <act name="main" contains="originalVersion">
    <meta>
      <identification source="#editor">
        <FRBRWork>
          <FRBRthis value="/akn/it/act/2013/ddl-2013/!main"/>
          <FRBRuri value="/akn/it/act/2013/ddl-2013"/>
          <FRBRdate date="2013-03-15" name="Generation"/>
          <FRBRcountry value="it"/>
          <FRBRsubtype value="ddl"/>
        </FRBRWork>
        <FRBRExpression>...</FRBRExpression>
        <FRBRManifestation>...</FRBRManifestation>
      </identification>
      <publication date="2013-03-20" name="Gazzetta Ufficiale" showAs="G.U." number="67"/>
      <lifecycle>...</lifecycle>
      <temporalData>...</temporalData>
    </meta>
    <body eId="body">
      <article eId="art_1382">
        <num>1382</num>
        <heading>Effetti della clausola penale</heading>
        <paragraph eId="art_1382__para_1">
          <content><p>La clausola, con cui...</p></content>
        </paragraph>
      </article>
    </body>
  </act>
</akomaNtoso>
```

Ogni elemento ha un `eId` univoco (es. `art_1382__para_1`) che è la chiave naturale per lo chunking RAG.

### 3.3 ELI (European Legislation Identifier)

URI persistente HTTP-risolvibile per atti normativi a livello UE e degli Stati membri ([eur-lex.europa.eu/eli-register](https://eur-lex.europa.eu/eli-register/about.html)). Per l'Italia il publisher è la GU; il pattern `https://www.gazzettaufficiale.it/eli/id/<AAAA>/<MM>/<GG>/<id>/sg` è risolvibile via HTTP. Embedding RDFa/JSON-LD permette di fare query semantiche.

### 3.4 Librerie pronte

| Libreria | Lingua | Pacchetto | Stato | Licenza | Adatta per Normattiva? |
|---|---|---|---|---|---|
| **bluebell** ([GitHub](https://github.com/laws-africa/bluebell)) | Python | `pip install bluebell-akn` | **Attiva** (v3.1.1, feb 2025) | GPL-3.0 / LGPL-3.0 | Parser AKN 3.0 generico — sì |
| **cobalt** ([GitHub](https://github.com/laws-africa/cobalt)) | Python | `pip install cobalt` | Inattiva (v9.0.1, dic 2024) | LGPL-3.0 | Manipolazione AKN + FRBR URI — sì ma occhio al manutenzione |
| **tulit** ([readthedocs](https://tulit-docs.readthedocs.io/)) | Python | PyPI | In sviluppo | n/d | Buona per CELLAR/Legifrance, da testare su Normattiva |
| **normattiva2md** ([GitHub](https://github.com/ondata/normattiva_2_md)) | Python | CLI | Attiva | MIT | **Sì, specifico per Normattiva**, converte AKN → markdown con riduzione token fino al 60% — adatto a RAG |
| **kclquantlaw/tuir** ([GitHub](https://github.com/kclquantlaw/tuir)) | Jupyter Notebook | - | Specifico TUIR | MIT | Esempio parsing AKN per TUIR |
| **bungenix/akomantoso-lib** ([GitHub](https://github.com/bungenix/akomantoso-lib)) | Java | - | In manutenzione | n/d | Java-only, salta |
| **r-eurlex** ([CRAN](https://cran.r-project.org/web/packages/eurlex/)) | R | `install.packages("eurlex")` | Attiva | n/d | Per CELLAR/EUR-Lex |

**Lacuna importante:** **non esiste un parser AKN nativo Node.js** ben mantenuto. Le opzioni per Tullio (stack Express/TS) sono:
1. Microservizio Python con FastAPI che espone parsing AKN via HTTP, chiamato dal backend Node.
2. Parser XML custom in TypeScript con `fast-xml-parser` o `@xmldom/xmldom`, sufficiente per estrarre articoli di Normattiva (non serve la complessità di AKN completo).
3. WebAssembly build di bluebell (esoterico, non consigliato).

**Raccomandazione:** opzione 2 per il primo MVP (la struttura Normattiva è uniforme). Opzione 1 quando serviranno features avanzate (annotation, cross-reference resolution).

---

## 4. Aspetti legali del riuso

### 4.1 I testi normativi sono pubblico dominio

**Articolo 5, L. 22 aprile 1941, n. 633** ("legge sul diritto d'autore", LDA): "Le disposizioni di questa legge non si applicano ai testi degli atti ufficiali dello Stato e delle Amministrazioni pubbliche, sia italiane che straniere" ([brocardi.it/legge-diritto-autore](https://www.brocardi.it/legge-diritto-autore/titolo-i/capo-i/art5.html)). Si tratta di un caso di **pubblico dominio strutturale per legge** ([aib.it FAQ](https://www.aib.it/notizie/pubblico-dominio-istruzioni-per-luso-frequently-asked-questions/)).

**Cosa rientra:** atti normativi (leggi, decreti, regolamenti), decisioni giudiziarie e amministrative, documenti di fonte pubblica, sentenze, ordinanze, testi di atti ufficiali della PA.

**Cosa NON rientra:** brochure informative/promozionali, sezioni news/aggiornamenti dei siti pubblici, immagini, video, **database** strutturati (la struttura del DB può avere protezione sui generis ex art. 102-bis LDA), software, contenuti diversi dal testo dell'atto. Interpretazione restrittiva.

**Implicazione operativa per Tullio:**
- ✅ Riuso commerciale dei testi di leggi, decreti, sentenze: **permesso senza autorizzazione**.
- ⚠️ Riuso massivo del **database** Normattiva: è regolato dalla licenza CC BY 4.0 (attribuzione obbligatoria). Citare Normattiva come fonte e linkare all'URN.
- ⚠️ Riuso massivo del **database** GU: la struttura/scelte editoriali potrebbero essere coperte da diritto sui generis del costitutore (IPZS). I testi degli atti no.
- ✅ Massime di Cassazione e sentenze integrali: testi pubblico dominio per art. 5 LDA. Anche le **massime ufficiali** del CED Cassazione, in quanto elaborate dal Massimario (organo della Corte), rientrano nella categoria atti ufficiali.

### 4.2 Disclaimer Normattiva

Storicamente Normattiva avvertiva: "I testi presenti nella banca dati… non hanno carattere di ufficialità, restando il testo ufficiale quello pubblicato in Gazzetta Ufficiale".

**Implicazione operativa per Tullio:** è una **best practice deontologica** (e ora legale ex L. 132/2025 sull'AI in professioni intellettuali, [diritto.it](https://www.diritto.it/legge-italiana-intelligenza-artificiale-professione/)) presentare ogni citazione con:
- Testo verbatim
- URN
- Link a Normattiva
- Link al GU originario via ELI quando disponibile
- Data ultima vigenza verificata
- Nota: "La fonte ufficiale resta la Gazzetta Ufficiale".

### 4.3 Obblighi sotto la L. 132/2025 (AI nelle professioni)

L. 132/2025, art. 13, impone all'avvocato l'**obbligo di informare il cliente** dell'uso di sistemi AI nell'esecuzione dell'incarico. Inquadrato nel dovere di lealtà e correttezza professionale.

**Implicazione per Tullio:** Tullio dovrebbe (a) generare automaticamente una clausola/disclosure per inserimento nel mandato professionale o nelle comunicazioni al cliente; (b) loggare quale modello/versione ha prodotto ciascun output ai fini di tracciabilità ex EU AI Act.

### 4.4 Allucinazioni: il rischio quantificato

Studio Stanford 2025 (Magesh, Surani, Dahl, Suzgun, Manning, Ho — "Hallucination-Free? Assessing the Reliability of Leading AI Legal Research Tools", Journal of Empirical Legal Studies 22, 2025, [PDF](https://dho.stanford.edu/wp-content/uploads/Legal_RAG_Hallucinations.pdf)):

| Tool | Tasso di allucinazione |
|---|---|
| LLM general-purpose (no RAG) | 58-82% delle query legali |
| LexisNexis Lexis+ AI | >17% |
| Thomson Reuters Westlaw AI-Assisted Research | >34% |
| Ask Practical Law AI | >17% |

Q1 2026, sanzioni a avvocati USA per AI hallucinations: ~$145.000 cumulati, sanzione singola di $109.700 a un avvocato dell'Oregon ([sqmagazine.co.uk](https://sqmagazine.co.uk/llm-hallucination-statistics/)).

**Implicazione per Tullio:** un RAG ben costruito (con citazioni verificabili, escape su mancata copertura, fallback "non ho fonti per questa risposta") resta **sostanzialmente più sicuro** di un LLM puro, ma non è hallucination-free. Serve:
1. Citation enforcement: ogni asserzione normativa nel prompt → richiesta esplicita di fonte tra quelle in contesto.
2. Verification pass: secondo round di chiamata che verifica le citazioni contro l'indice (gli URN citati esistono davvero? l'articolo citato corrisponde davvero al testo?).
3. UI che evidenzia citazioni e permette ispezione.

---

## 5. Architettura raccomandata per Tullio

### 5.1 Decisione architetturale: hybrid RAG + on-demand verification

**NON usare API live a ogni query** (latenza, fragilità, rate limit incerto, esperienza utente scadente).
**NON fare RAG puro su dump statico** (la legge cambia: serve refresh).

**Approccio raccomandato — RAG hybrid:**
- **Mirror locale** della base normativa core, refreshato in batch (cron giornaliero/settimanale).
- **Indice vettoriale** su Supabase pgvector con embedding per articolo.
- **Verification layer** che chiama l'API Normattiva live solo per (a) controllo vigenza on-demand quando l'utente fa una domanda time-sensitive, (b) atti recentissimi non ancora nel mirror.

### 5.2 Schema dati Postgres (Supabase)

```sql
-- Estensione
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabella atti
CREATE TABLE legal_act (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  urn             text UNIQUE NOT NULL,         -- urn:nir:stato:legge:1978-07-27;392
  eli             text,                          -- https://www.gazzettaufficiale.it/eli/id/...
  type            text NOT NULL,                 -- 'legge', 'decreto.legislativo', 'codice.civile'...
  date_emanation  date NOT NULL,
  date_publication date,
  number          text,
  title           text,
  publisher       text DEFAULT 'stato',
  in_force        boolean,
  date_in_force   date,
  date_repealed   date,
  source_url      text NOT NULL,                 -- link Normattiva resolver
  raw_xml         text,                          -- AKN XML completo, in R2 per atti grandi
  fetched_at      timestamptz NOT NULL,
  consolidated_at date,                          -- data della versione consolidata caricata
  source_etag     text                           -- per delta refresh
);

CREATE INDEX ON legal_act (urn);
CREATE INDEX ON legal_act (type, date_emanation DESC);
CREATE INDEX ON legal_act USING gin (to_tsvector('italian', title));

-- Tabella articoli/chunk
CREATE TABLE legal_article (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  act_id          uuid NOT NULL REFERENCES legal_act(id) ON DELETE CASCADE,
  e_id            text NOT NULL,                 -- AKN eId, es. art_1382
  article_number  text,                          -- '1382', '27-bis'
  heading         text,                          -- 'Effetti della clausola penale'
  text            text NOT NULL,                 -- testo verbatim plain
  text_md         text,                          -- markdown formattato per LLM
  url_anchor      text NOT NULL,                 -- URN con ~art<N>
  position        integer,                       -- ordine nell'atto
  in_force        boolean,
  date_in_force   date,
  -- vector
  embedding       vector(1536)                   -- 1536 = text-embedding-3-small / Voyage / Cohere
);

CREATE INDEX ON legal_article (act_id, position);
CREATE INDEX ON legal_article USING hnsw (embedding vector_cosine_ops);

-- Tabella modifiche/lifecycle (per "questo articolo è stato modificato dalla L. X")
CREATE TABLE legal_amendment (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_act_id uuid NOT NULL REFERENCES legal_act(id),
  target_article_eid text,
  amending_act_id uuid REFERENCES legal_act(id),
  type          text,                            -- 'modifica', 'abrogazione', 'sostituzione'
  effective_date date,
  raw_text      text
);

-- Citazioni utenti per audit/log
CREATE TABLE citation_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id),
  query       text,
  cited_urns  text[],
  model       text,
  created_at  timestamptz DEFAULT now()
);
```

### 5.3 Strategia di chunking

Le ricerche sui RAG legali (LegalBench-RAG arXiv:2408.10343, Poly-Vector Retrieval arXiv:2504.10508, "Towards Reliable Retrieval in RAG Systems for Large Legal Datasets" arXiv:2510.06999) convergono su:

1. **Chunk = articolo** quando possibile (l'articolo è l'unità semantica naturale del diritto italiano, l'analogo della "section" USA). Questo è l'approccio raccomandato.
2. **Chunk = paragrafo** (`<paragraph>` AKN) per articoli molto lunghi (>1000 token).
3. **Multi-vector retrieval:** embedding separato per (a) titolo+rubrica, (b) testo, (c) cross-reference normalizzati. Migliora il recall sui codici dove articoli diversi hanno testi simili.
4. **Reference-aware retrieval:** quando un articolo cita altri articoli ("ai sensi dell'articolo 1382"), espandere il contesto recuperando anche gli articoli citati. Ridurre il *Document-Level Retrieval Mismatch* segnalato in arXiv:2510.06999.

**Embedding model:**
- **`dlicari/Italian-Legal-BERT`** ([HF](https://huggingface.co/dlicari/Italian-Legal-BERT)) — domain-specific, 768-d. Vantaggio: preallenato su giurisprudenza italiana. Svantaggio: 768-d è meno espressivo di OpenAI 3-small (1536-d) e Voyage (varie). Ottimo per riranking.
- **`voyage-law-2`** o **`text-embedding-3-large`** OpenAI per embedding di prima fase.
- **Hybrid retrieval:** combinare BM25 (full-text Postgres `tsvector`) + vector cosine + reranker.

### 5.4 Pipeline di aggiornamento

```
┌──────────────────────────────────────────────────────────────┐
│  CRON (giornaliero, 03:00 CET)                                │
└──────────────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 1 — Polling RSS GU                                       │
│   GET https://www.gazzettaufficiale.it/.../rss               │
│   → lista nuovi atti pubblicati nelle ultime 24h             │
└──────────────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 2 — Per ogni atto nuovo: fetch da Normattiva API        │
│   POST /bff-opendata/v1/api/v1/atto/dettaglio-atto-urn       │
│   → AKN XML completo                                          │
└──────────────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 3 — Parsing AKN                                          │
│   - microservizio Python con bluebell o                      │
│   - parser TS custom con fast-xml-parser                     │
│   → estrai articoli, eId, lifecycle, riferimenti             │
└──────────────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 4 — Persist su Postgres                                 │
│   - INSERT/UPDATE legal_act + legal_article                  │
│   - registra modifiche su legal_amendment                    │
│   - storage XML grezzo su R2 (se >1MB)                       │
└──────────────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 5 — Embedding                                            │
│   - per ogni articolo nuovo o modificato:                    │
│     calcola embedding (Voyage / OpenAI) → pgvector            │
│   - reranker opzionale fine-tuned su Italian-Legal-BERT       │
└──────────────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 6 — Refresh vigenza                                      │
│   - WEEKLY: ricalcola in_force per atti potenzialmente       │
│     interessati da abrogazioni o modifiche                    │
└──────────────────────────────────────────────────────────────┘
```

**Paralleli secondari:**
- Cron settimanale Garante Privacy → RSS → scrape provvedimento → tabella separata `provvedimenti_authority`.
- Cron settimanale Agenzia Entrate circolari/risoluzioni → RSS → scrape.
- Cron mensile Corte Costituzionale OpenData → bulk download dataset XML.

### 5.5 Modello di citazione (output AI)

Quando Claude/Gemini risponde all'utente, deve produrre citazioni con questa struttura:

```json
{
  "answer": "L'art. 1382 del codice civile prevede che la clausola penale...",
  "citations": [
    {
      "urn": "urn:nir:stato:regio.decreto:1942-03-16;262:2~art1382",
      "label": "art. 1382 c.c.",
      "act_title": "Codice civile, Approvazione del testo del Codice civile",
      "url": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:regio.decreto:1942-03-16;262:2~art1382!vig=",
      "in_force": true,
      "as_of_date": "2026-05-06",
      "verbatim": "La clausola, con cui si conviene che, in caso di inadempimento o di ritardo nell'adempimento, uno dei contraenti è tenuto a una determinata prestazione..."
    }
  ],
  "warning_disclaimer": "Verifica sempre il testo aggiornato in Gazzetta Ufficiale. Risposta generata con AI ai sensi della L. 132/2025."
}
```

**Frontend (Next.js 16):** rendere ogni citazione come pillola cliccabile; click apre side panel con verbatim, URN, link Normattiva. Permette all'avvocato di verificare in un secondo.

### 5.6 Tool definitions per Claude/Gemini (function calling)

Esporre al modello tre tool:

```typescript
// 1. Cerca articolo per URN o nome canonico
{
  name: "lookup_article",
  description: "Lookup an Italian legal article by URN, code+article number, or natural language query. Returns verbatim text, vigency status and source URL.",
  input_schema: {
    type: "object",
    properties: {
      urn: { type: "string", description: "URN-NIR identifier" },
      query: { type: "string", description: "natural language, e.g. 'art. 2103 codice civile'" },
      as_of_date: { type: "string", format: "date", description: "vigency date, default today" }
    }
  }
}

// 2. Vector search su corpus
{
  name: "search_legal_corpus",
  description: "Semantic search across Italian legal corpus (laws, codes, decrees, Constitutional Court rulings).",
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string" },
      top_k: { type: "integer", default: 8 },
      filter: {
        type: "object",
        properties: {
          act_type: { type: "string" },
          date_from: { type: "string", format: "date" },
          in_force: { type: "boolean" }
        }
      }
    }
  }
}

// 3. Verifica vigenza live (chiama API Normattiva)
{
  name: "verify_vigency_live",
  description: "Calls Normattiva API to verify the current in-force status of an article, including any recent amendments.",
  input_schema: {
    type: "object",
    properties: {
      urn: { type: "string" }
    }
  }
}
```

Questo pattern (chiamato a volte "agentic RAG" o "tool-augmented retrieval") è quello adottato dal plugin Legal di Anthropic ([claude.com/blog/how-anthropic-uses-claude-legal](https://claude.com/blog/how-anthropic-uses-claude-legal)) ed è compatibile con MCP (Model Context Protocol).

### 5.7 Confronto con OneLegale + Libra

Wolters Kluwer ha lanciato **Libra** in Italia a febbraio 2026 ([altalex.com](https://www.altalex.com/documents/news/2026/02/18/arriva-libra-by-wolters-kluwer-disponibile-in-italia-il-nuovo-ai-workspace-per-i-professionisti-legali-italiani), [datamanager.it](https://www.datamanager.it/2026/02/wolters-kluwer-lancia-in-italia-il-legal-ai-workspace-libra-e-prosegue-lespansione-pan-europea/)). È un competitor diretto di Tullio: AI workspace integrato con OneLegale (banca dati commerciale completa). **Posizionamento per Tullio:**
- ✅ Tullio ha vantaggi su: open-source, on-premise/self-hosted opzionale (privacy), prezzo, controllo del modello, customizzazione per studio.
- ❌ Tullio ha svantaggi su: copertura giurisprudenza/dottrina (Libra ha tutto OneLegale), enterprise sales channel.
- 🎯 Strategia: Tullio target = studi medio-piccoli, indipendenti, attenti a privacy/costi. Niente competizione frontale con grandi studi che vogliono il "tutto-incluso" di Libra.

---

## 6. Roadmap MVP (Sprint 1-4, 2 settimane ciascuno)

### Sprint 1 — "Solo Normattiva, solo lookup"
**Obiettivo:** l'utente chiede "cita l'art. 2103 c.c." e Tullio risponde con testo verbatim + URN + link.

- [ ] Setup tabelle Postgres (legal_act, legal_article)
- [ ] Backend Express endpoint `POST /api/legal/lookup` che:
  1. Risolve query → URN (regex per "art. X codice civile/penale/proc.civ./proc.pen./costituzione")
  2. Chiama Normattiva API `/atto/dettaglio-atto-urn`
  3. Parsing AKN → articolo
  4. Cache su Postgres con TTL 30 giorni
  5. Risposta con testo + URN + link
- [ ] Tool definition `lookup_article` per Claude
- [ ] System prompt aggiornato: "quando citi una legge italiana, USA SEMPRE il tool lookup_article. Mai citare a memoria."
- [ ] Frontend: render delle citazioni come componenti React cliccabili
- [ ] Bootstrap del DB: caricare le **5 norme più citate** in studio legale (Codice civile, penale, proc. civ., proc. pen., Costituzione) — ~50.000 articoli totali stimati

**Effort:** ~10 giorni-uomo (backend + parser + frontend + bootstrap).
**Deliverable:** demo cliccabile dove l'utente fa "art. 1382 c.c." e ottiene testo verbatim.

### Sprint 2 — "RAG semantico"
**Obiettivo:** l'utente chiede "qual è la disciplina della clausola penale eccessiva?" senza citare l'articolo, e Tullio recupera 1382 da solo.

- [ ] Embedding pipeline: Voyage o OpenAI text-embedding-3-large per ogni articolo del bootstrap
- [ ] pgvector HNSW index
- [ ] Tool `search_legal_corpus` con hybrid retrieval (BM25 + vector + reranker)
- [ ] Reranker opzionale: Italian-Legal-BERT cross-encoder fine-tunato
- [ ] Frontend: vista "Fonti recuperate" con score
- [ ] Caricamento esteso: tutti i codici + Costituzione + leggi più citate (TUIR, L. 392/78, D.lgs. 81/08, ecc.) — ~200k articoli

**Effort:** ~12 giorni-uomo.
**Deliverable:** Tullio recupera articoli senza che l'utente debba sapere dove cercare.

### Sprint 3 — "Aggiornamento e vigenza"
**Obiettivo:** Tullio sa che la L. 392/78 art. 27 è ancora in vigore al 2026-05-06 e ha (o non ha) subìto modifiche recenti.

- [ ] Cron giornaliero RSS GU + delta refresh Normattiva
- [ ] Tabella `legal_amendment` popolata
- [ ] Tool `verify_vigency_live` con cache 24h
- [ ] Visualizzazione "vigente al" + "ultima modifica" nel rendering citazioni
- [ ] Test: scenario regression "norma abrogata 2 mesi fa, l'AI risponde correttamente"
- [ ] Caricamento Corte Costituzionale OpenData (XML/JSON bulk)

**Effort:** ~10 giorni-uomo.
**Deliverable:** Tullio non cita mai norme abrogate senza segnalarlo.

### Sprint 4 — "Espansione fonti secondarie"
**Obiettivo:** prassi (Agenzia Entrate, Garante Privacy) e Cassazione recente.

- [ ] Cron RSS Agenzia Entrate → scrape circolari/risoluzioni → embed
- [ ] Cron RSS Garante Privacy → scrape provvedimenti → embed
- [ ] Scraper SentenzeWeb Cassazione (verificare TOS prima!)
- [ ] Tabella separata `secondary_source` (provvedimenti_authority, prassi, sentenze)
- [ ] EUR-Lex integration: ELI URI risolution + CELLAR REST per direttive UE in italiano
- [ ] Senato/Camera AKN bulk per lavori preparatori

**Effort:** ~12 giorni-uomo.
**Deliverable:** Tullio risponde a "qual è la posizione del Garante su pixel di tracciamento 2026?" con citazione di provvedimenti reali.

### (Out-of-MVP, post v1.0)

- Integrazione opzionale **OneLegale/DeJure** via passthrough credenziali utente (richiede partnership commerciale o reverse-engineering del web app — entrambi complessi).
- **Telemaco/Registro Imprese** per visure (€500+IVA per ricarica, pay-per-call).
- **Italgiure completo** con archivio storico Cassazione (subscription).
- **Document inline annotation** (Akoma Ntoso → markup nei DOCX caricati dall'utente).

---

## 7. Stima effort complessiva

| Componente | Giorni-uomo (singolo dev senior) |
|---|---|
| Sprint 1 (lookup base) | 10 |
| Sprint 2 (RAG) | 12 |
| Sprint 3 (vigenza/cron) | 10 |
| Sprint 4 (fonti secondarie) | 12 |
| Buffer integrazioni / bug | 6 |
| **Totale MVP** | **~50 giorni-uomo** (~10 settimane di un dev full-time, o 5-6 settimane in coppia) |

**Costi runtime stimati (mensili, 100 utenti attivi, 50 query/utente/giorno):**
- Embeddings (Voyage law-2 o OpenAI): ~$50-100/mese (riembedding solo su delta)
- Storage Postgres + pgvector (Supabase Pro): $25-99
- Storage R2 per AKN raw: ~$5 (corpus iniziale ~5GB)
- Anthropic Claude API: dipende dal volume, prevedere $200-500
- Compute Vercel/Express: $50-100
- **Totale infra:** ~$300-800/mese al lancio

---

## 8. Rischi e mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
|---|---|---|---|
| Normattiva API cambia / breaking change | Media (la spec è in revisione 2026) | Alto | Pinning della versione `/v1/`, monitoring HTTP 4xx/5xx, fallback al resolver URN-LEX (più stabile da 20 anni) |
| Rate limiting non documentato → ban IP | Media | Medio | Backoff esponenziale, mirror locale aggressivo, IP rotation se necessario |
| Allucinazioni nonostante RAG | Alta | Alto | Citation enforcement nel prompt, verification pass, UI che evidenzia "questo testo è tratto verbatim dalla fonte X" vs "questa è interpretazione AI" |
| TOS SentenzeWeb bloccano scraping | Media | Medio | Verificare TOS prima dello sviluppo; dichiarare apertamente "Tullio copre giurisprudenza solo via Corte Cost. + dataset HF" |
| Avvocato cliente non disclosa AI al suo cliente, sanzione | Media | Critico (responsabilità legale di Tullio?) | Generare automaticamente disclaimer nei documenti, log di disclosure consigliato, nelle Condizioni di servizio Tullio chiarire responsabilità |
| Concorrenza Libra Wolters Kluwer | Alta | Medio | Posizionamento differenziato (open-source, self-host, prezzo, customization) |
| Drift di un dataset HF | Media | Basso | Mirror dei dataset HF su R2, versioning |
| Database del costitutore (sui generis) → IPZS contesta riuso GU | Bassa | Medio | Usare **Normattiva** (CC BY 4.0) come fonte primaria, GU solo come link al PDF originale, non massive scraping |
| Garante Privacy contesta uso di sentenze pseudonimizzate | Bassa | Medio | Restare su provvedimenti già anonimizzati ufficialmente, non re-identificare, log di accesso |
| Modello Claude/Gemini ritirato o policy change | Media | Alto | Astrazione modello (provider abstraction layer), supporto multi-modello (Claude + Gemini + Llama) |

---

## 9. Bibliografia ragionata

### Fonti istituzionali

- **Normattiva OpenData portal** — https://dati.normattiva.it/
- **Normattiva API specs (PDF)** — https://dati.normattiva.it/assets/come_fare_per/API_Normattiva_OpenData.pdf
- **Normattiva API HTML/Apidog** — https://dati.normattiva.it/assets/come_fare_per/Normattiva%20OpenData.html
- **Normattiva utility** — https://www.normattiva.it/staticPage/utilita
- **Normattiva guida all'uso** — https://www.normattiva.it/staticPage/guidaAllUso_Normattiva
- **Normattiva 2.0 Akoma Ntoso (PDF)** — https://dati.normattiva.it/assets/come_fare_per/Portale_Normattiva_2.0-Strutturazione_degli_atti_in_Akoma_Ntoso_26-07-2021.pdf
- **ELI implementation in Italy (PDF)** — https://dati.normattiva.it/assets/come_fare_per/ELI_implementation_in_Italy.pdf
- **Forum Italia thread Normattiva open data** — https://forum.italia.it/t/normattiva-open-data/536
- **Gazzetta Ufficiale FAQ** — https://www.gazzettaufficiale.it/caricaHtml?nomeTiles=faq
- **EUR-Lex ELI register** — https://eur-lex.europa.eu/eli-register/about.html
- **EUR-Lex Italy** — https://eur-lex.europa.eu/eli-register/italy.html
- **EUR-Lex technical info** — https://eur-lex.europa.eu/eli-register/technical_information.html
- **EUR-Lex reuse policy** — https://eur-lex.europa.eu/content/help/data-reuse/reuse-contents-eurlex-details.html
- **CELLAR SPARQL endpoint** — https://publications.europa.eu/webapi/rdf/sparql
- **CELLAR dataset description** — https://data.europa.eu/data/datasets/sparql-cellar-of-the-publications-office?locale=en
- **Italian Government Gazette implements ELI** — https://eur-lex.europa.eu/eli-register/news_item_5.html
- **Cassazione SentenzeWeb** — https://www.italgiure.giustizia.it/sncass/
- **Cassazione servizi online** — https://www.cortedicassazione.it/it/altri_servizi.page
- **ItalgiureWeb informativa** — https://www.italgiure.giustizia.it/informativaIWEB/
- **ECLI news Cassazione** — https://www.italgiure.giustizia.it/informativaIWEB/eclinews.htm
- **Corte Costituzionale OpenData** — https://dati.cortecostituzionale.it/
- **Corte Costituzionale ECLI** — https://dati.cortecostituzionale.it/ECLI/ECLI
- **e-Justice ECLI resolver** — https://e-justice.europa.eu/topics/legislation-and-case-law/european-case-law-identifier-ecli_en
- **Senato OpenData** — https://dati.senato.it/
- **Senato Open Data download** — https://dati.senato.it/sito/scarica_i_dati
- **Senato AkomaNtosoBulkData GitHub** — https://github.com/SenatoDellaRepubblica/AkomaNtosoBulkData
- **Camera dati** — https://dati.camera.it/
- **Garante Privacy RSS** — https://www.garanteprivacy.it/gpdp-rss
- **Agenzia Entrate RSS** — https://www.agenziaentrate.gov.it/portale/rss
- **InfoCamere/Telemaco** — https://www.registroimprese.it/

### Standard

- **OASIS LegalDocML / Akoma Ntoso 3.0** — https://github.com/oasis-open/legaldocml-akomantoso
- **Akoma Ntoso Wikipedia** — https://en.wikipedia.org/wiki/Akoma_Ntoso
- **URN-LEX su PA Docs** — https://www.padocs.it/identificare-i-documenti-tramite-urn
- **URN-LEX su Agenda Digitale** — https://www.agendadigitale.eu/documenti/identificare-univocamente-i-documenti-pubblici-perche-urnlex-e-la-chiave/
- **ECLI EUR-Lex (italiano)** — https://eur-lex.europa.eu/content/help/eurlex-content/ecli.html?locale=it

### Librerie / SDK

- **bluebell (AKN parser Python)** — https://github.com/laws-africa/bluebell
- **cobalt (AKN manipulation Python)** — https://github.com/laws-africa/cobalt
- **slaw (AKN generator)** — https://github.com/laws-africa/slaw
- **tulit (legal docs Python)** — https://tulit-docs.readthedocs.io/en/latest/
- **normattiva2md (AKN → MD per AI)** — https://github.com/ondata/normattiva_2_md, https://ondata.github.io/normattiva_2_md/
- **kclquantlaw/tuir (TUIR parser)** — https://github.com/kclquantlaw/tuir
- **eurlex (R)** — https://michalovadek.github.io/eurlex/
- **EUR-Lex CELLAR developer guide** — https://polzia.com/blog/eur-lex-cellar-api-developers-guide
- **Open Legal Data** — https://github.com/openlegaldata/awesome-legal-data, http://openlegaldata.io/

### Skills/Plugin AI per legali italiani

- **Filippo Strozzi, "Una skill per linkare le norme italiane con Normattiva.it"** (Avvocati e Mac, 2026-04-13) — https://avvocati-e-mac.it/blog/2026/4/13/skill-link-norme-italiane-perplexity-claude
- **GitHub avvocati-e-mac/skill-legali** — https://github.com/avvocati-e-mac/skill-legali (citato nell'articolo)
- **Anthropic Legal Plugin announcement** — https://claude.com/plugins/legal
- **Anthropic blog: how Anthropic uses Claude in Legal** — https://claude.com/blog/how-anthropic-uses-claude-legal
- **Wolters Kluwer Libra (concorrente)** — https://www.wolterskluwer.com/it-it/solutions/one/onelegale-libra
- **Altalex su Libra (feb 2026)** — https://www.altalex.com/documents/news/2026/02/18/arriva-libra-by-wolters-kluwer-disponibile-in-italia-il-nuovo-ai-workspace-per-i-professionisti-legali-italiani

### Dataset

- **mii-llm/gazzetta-ufficiale (HF, MIT, 1991-2023)** — https://huggingface.co/datasets/mii-llm/gazzetta-ufficiale
- **swap-uniba/normattiva-dump (HF, CC-BY-NC-SA, da evitare per uso commerciale)** — https://huggingface.co/datasets/swap-uniba/normattiva-dump
- **dlicari/Italian-Legal-BERT** — https://huggingface.co/dlicari/Italian-Legal-BERT
- **itacasehold/itacasehold (sentenze + massime amministrative)** — https://huggingface.co/datasets/itacasehold/itacasehold

### Ricerca scientifica su RAG legale

- Magesh, Surani, Dahl, Suzgun, Manning, Ho. **"Hallucination-Free? Assessing the Reliability of Leading AI Legal Research Tools"**, Journal of Empirical Legal Studies 22 (2025) — https://dho.stanford.edu/wp-content/uploads/Legal_RAG_Hallucinations.pdf
- **Stanford HAI: AI on Trial** — https://hai.stanford.edu/news/ai-trial-legal-models-hallucinate-1-out-6-or-more-benchmarking-queries
- **LegalBench-RAG benchmark** — https://arxiv.org/html/2408.10343
- **Multi-Layered Embedding-Based Retrieval (legal)** — https://arxiv.org/html/2411.07739v1
- **Poly-Vector Retrieval for Legal Documents** — https://arxiv.org/html/2504.10508
- **Towards Reliable Retrieval in RAG Systems for Large Legal Datasets** — https://arxiv.org/html/2510.06999v1

### Quadro normativo italiano sull'AI nelle professioni

- **L. 132/2025 — Legge italiana sull'AI** (sintesi su Diritto.it) — https://www.diritto.it/legge-italiana-intelligenza-artificiale-professione/
- **Form & Lex su L. 132/2025** — https://formandlex.it/ai-act-e-avvocati-guida-alla-legge-n-132-2025-e-alle-nuove-responsabilita-legali-nelluso-della-genai/
- **Agenda Digitale: AI e avvocati, obbligo trasparenza** — https://www.agendadigitale.eu/documenti/giustizia-digitale/intelligenza-artificiale-e-avvocati-come-cambia-lobbligo-di-trasparenza/
- **CCBE Guida sull'uso di GenAI da parte degli avvocati** — https://www.consiglionazionaleforense.it/documents/20182/3593400/Guida+del+CCBE+sull%E2%80%99uso+dell%E2%80%99intelligenza+artificiale+generativa+da+parte+degli+avvocati.pdf

### Pubblico dominio testi normativi

- **Art. 5 LDA su Brocardi** — https://www.brocardi.it/legge-diritto-autore/titolo-i/capo-i/art5.html
- **AIB FAQ Pubblico Dominio** — https://www.aib.it/notizie/pubblico-dominio-istruzioni-per-luso-frequently-asked-questions/
- **OnData Aspetti legali Open Data** — https://ondata.github.io/aspetti-legali-opendata/

---

## Recommended Next Steps (priorità ordinate)

**Immediate (prossima settimana):**
1. **Ottenere accesso API Normattiva di pre-produzione** (`pre.api.normattiva.it`) per testing. Verificare email di contatto su `dati.normattiva.it` per richiesta credenziali se richieste, o se è completamente aperto. Misurare latenza, rate limit reali, errori.
2. **Validare 5 URN canonici** per i codici principali (civile, penale, proc.civ., proc.pen., Costituzione) — ogni codice ha quirks (allegato, indici). Costruire un dizionario `NORM_CANONICI` come prima skill ridicolmente leggera ma fondamentale.
3. **Forkare e adattare `normattiva2md`** ([github.com/ondata/normattiva_2_md](https://github.com/ondata/normattiva_2_md)) — già fa AKN → markdown ottimizzato per AI. Usarlo come microservizio Python invece di scrivere da zero.

**Short-term (prossime 2-4 settimane):**
4. **Implementare Sprint 1** del MVP (lookup deterministico per URN). Demo cliccabile.
5. **Decidere policy citazione**: tutti gli output di Tullio devono passare attraverso un guardrail che verifica che ogni `urn:nir:*` citato nel testo appaia anche nell'oggetto `citations[]` strutturato. Se manca, blocco.
6. **Scrivere e pubblicare le condizioni di servizio** che chiariscano: (a) Tullio è strumento di supporto, non sostituto del giudizio dell'avvocato; (b) responsabilità della verifica resta in capo all'avvocato; (c) disclosure ex L. 132/2025 al cliente è onere dell'avvocato; Tullio fornisce template.

**Medium-term (1-3 mesi):**
7. **Costruire benchmark interno**: 200 query reali di studi legali italiani, misurare hallucination rate di Tullio vs ChatGPT/Gemini puro vs Libra (prova trial). Pubblicare come marketing material.
8. **Partnership Hugging Face / mii-llm** per dataset GU 1991-2023 e potenzialmente collaborare su Italian-Legal-BERT v2.
9. **Testare scraper SentenzeWeb conforme ai TOS** — se possibile, con throttling pesante.
10. **Mappare le 50 norme più citate dagli studi target** (TUIR, D.lgs. 81/08 sicurezza, L. 392/78 locazioni, Codice della crisi, GDPR italiano, ecc.) e bootstrap-care prioritariamente quelle nel mirror.

**Long-term (3-6 mesi):**
11. **Open-source la skill `normattiva-tool` per Claude / MCP server** — bene per community + brand awareness, e visto che Filippo Strozzi ha già pubblicato una skill simile, c'è terreno fertile. Differenziarsi con qualità del parsing degli allegati codici e gestione vigenza.
12. **Espandere a fonti regionali** se cluster di clienti lo chiede (es. Lombardia per sanità, Emilia-Romagna per agricoltura).
13. **Considerare partnership commerciale con OneLegale o DeJure** per coprire la giurisprudenza che gli open data non danno (modello revenue-share o licenza enterprise).

---

*Documento prodotto da analisi di fonti pubbliche al 6 maggio 2026. La spec API Normattiva è in evoluzione (ultimo aggiornamento documentato: 10/03/2026 per `/atto/dettaglio-atto-urn`). Verificare sempre la versione corrente prima del deploy.*
