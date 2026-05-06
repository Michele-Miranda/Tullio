import type { MikeWorkflow } from "../shared/types";

export const BUILT_IN_WORKFLOWS: MikeWorkflow[] = [
    {
        id: "builtin-cp-checklist",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Genera Checklist Condizioni Sospensive",
        type: "assistant",
        practice: "Diritto Bancario e Finanziario",
        prompt_md:
            "## Genera Checklist Condizioni Sospensive (Conditions Precedent)\n\n" +
            "Analizza il contratto di finanziamento o di compravendita partecipazioni caricato e genera una checklist " +
            "completa delle condizioni sospensive (CP) all'erogazione/closing.\n\n" +
            "DEVI usare lo strumento generate_docx per produrre la checklist come documento Word scaricabile. " +
            "DEVI passare landscape: true a generate_docx — il documento deve essere in orientamento orizzontale. " +
            "Non visualizzare la checklist inline — genera il file .docx e fornisci il link di download.\n\n" +
            "Struttura il documento come segue:\n" +
            "- Per ciascuna categoria di condizioni (es. Societarie, Finanziarie, Legali/Compliance, Garanzie, Autorizzazioni regolamentari) inserisci una sezione con un titolo\n" +
            "- Sotto ciascuna categoria, includi una tabella con esattamente queste quattro colonne in quest'ordine:\n" +
            "  1. Indice — numero progressivo all'interno della categoria (1, 2, 3…)\n" +
            "  2. Riferimento — articolo, allegato o schedula del contratto (es. Art. 5.2, All. B)\n" +
            "  3. Condizione — descrizione concisa della condizione sospensiva (es. \"Consegna dei verbali assembleari aggiornati\", \"Iscrizione del pegno sulle quote nel Registro delle Imprese\", \"Rilascio del nulla osta Banca d'Italia ex art. 19 TUB\")\n" +
            "  4. Stato — lascia vuoto (stringa vuota) per la compilazione da parte dell'utente\n\n" +
            "Usa il campo table dell'oggetto sezione (non content) per le righe di ciascuna categoria.",
        columns_config: null,
    },
    {
        id: "builtin-coc-dd",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Due Diligence Cambio di Controllo",
        type: "tabular",
        practice: "Diritto Societario",
        prompt_md:
            "## Due Diligence sul Cambio di Controllo\n\n" +
            "Questo workflow esegue una due diligence sulle clausole di cambio di controllo (change of control) sui documenti selezionati, anche al fine di verificare il consenso necessario per operazioni straordinarie e il rischio di terminazione anticipata dei rapporti contrattuali.",
        columns_config: [
            {
                index: 0,
                name: "Parti",
                format: "bulleted_list",
                prompt: "Identifica tutte le parti del contratto. Per ciascuna parte indica la denominazione sociale completa e il ruolo (es. controparte, licenziante, finanziatore, fornitore, conduttore).",
            },
            {
                index: 1,
                name: "Data",
                format: "date",
                prompt: "Qual è la data del contratto? Se la data di efficacia è diversa dalla data di sottoscrizione, indica entrambe.",
            },
            {
                index: 2,
                name: "Durata",
                format: "text",
                prompt: "Qual è la durata del contratto? Indica le date di inizio e fine o la durata complessiva, e segnala eventuali rinnovi taciti (artt. 1597, 1598 c.c.).",
            },
            {
                index: 3,
                name: "Clausola di Cambio di Controllo",
                prompt: "Identifica e riassumi la/le clausola/e di cambio di controllo nel documento. Cita esattamente la formulazione che fa scattare la clausola e specifica cosa costituisce 'cambio di controllo' (rinvio all'art. 2359 c.c., controllo di diritto/fatto/contrattuale, soglie partecipative).",
            },
            {
                index: 4,
                name: "Consenso Richiesto",
                prompt: "Il cambio di controllo richiede il consenso preventivo di una qualche parte? Identifica chi deve prestare il consenso, il termine di preavviso e le eventuali condizioni (es. comunicazione formale, PEC).",
            },
            {
                index: 5,
                name: "Diritti di Recesso/Risoluzione",
                prompt: "Quali diritti di recesso o risoluzione sorgono in caso di cambio di controllo? Chi può recedere/risolvere e quali sono i requisiti di forma e preavviso? Distingui tra recesso ordinario (art. 1373 c.c.) e clausola risolutiva espressa (art. 1456 c.c.).",
            },
            {
                index: 6,
                name: "Opzioni Put/Call",
                prompt: "Sono previste opzioni put o call attivate dal cambio di controllo? Riassumi termini, meccanismo di prezzo (valore nominale, fair market value, formula contrattuale) e periodo di esercizio.",
            },
            {
                index: 7,
                name: "Implicazioni Economiche",
                prompt: "Quali sono le implicazioni economiche del cambio di controllo? Includi eventuali commissioni, pagamenti, accelerazione di obbligazioni (es. rimborso anticipato in contratti di finanziamento), aggiustamenti di prezzo o penali (art. 1382 c.c.).",
            },
        ],
    },
    {
        id: "builtin-credit-summary",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Sintesi Contratto di Finanziamento",
        type: "assistant",
        practice: "Diritto Bancario e Finanziario",
        prompt_md:
            "## Sintesi Contratto di Finanziamento\n\n" +
            "Analizza il contratto di finanziamento caricato e produci una sintesi legale completa che copra i seguenti punti. " +
            "Per ciascuna sezione individua le clausole chiave, cita gli articoli/allegati di riferimento e segnala eventuali clausole insolite, onerose o non in linea con la prassi di mercato (anche con riferimento alle Norme Bancarie Uniformi ABI e alla disciplina del TUB — D.Lgs. 385/1993).\n\n" +
            "1. **Finanziatori (Lenders)** — Tutti i finanziatori o membri del pool, denominazione sociale completa e ruolo (es. mandated lead arranger, banca finanziatrice, banca agente ex art. 1387 c.c., banca depositaria)\n" +
            "2. **Prenditori (Borrowers)** — Tutti i prenditori, con denominazione sociale completa, sede legale e P.IVA/codice fiscale\n" +
            "3. **Garanti** — Tutti i garanti, con denominazione sociale e ambito dell'obbligazione di garanzia (fideiussione, fideiussione omnibus, garanzia autonoma a prima richiesta)\n" +
            "4. **Altre parti** — Eventuali altre parti rilevanti (banca agente, security agent/agente delle garanzie, controparti hedge, banca emittente di garanzie autonome) e relativo ruolo\n" +
            "5. **Data del contratto** — Data di sottoscrizione e, se diversa, data di efficacia\n" +
            "6. **Linee di credito (Facilities)** — Ciascuna linea disponibile (es. Linea Revolving, Term Loan A/B/C, Linea Bullet, Linea Amortising), tipologia, denominazione e caratteristiche strutturali\n" +
            "7. **Importo** — Importo totale impegnato, valuta (di norma EUR) e ripartizione per tranche\n" +
            "8. **Scopo (Purpose)** — Scopo del finanziamento e vincoli di destinazione (es. acquisition financing, capex, working capital, refinancing). Verifica coerenza con l'oggetto sociale dei prenditori\n" +
            "9. **Interessi** — Tasso di riferimento (EURIBOR, €STR), spread/margine, eventuale margin ratchet, durata dei periodi di interesse, presenza di tasso fisso/variabile, conformità al tasso soglia anti-usura ex L. 108/1996 (TEG/TEGM trimestrale)\n" +
            "10. **Commissioni** — Commitment fee, utilization fee, agency fee, arrangement fee — tasso, base di calcolo (impegno non utilizzato, utilizzo medio) e rispetto della normativa sulla trasparenza ex artt. 116-117 TUB\n" +
            "11. **Piano di rimborso** — Profilo di rimborso per ciascuna linea (rate amortizing, bullet, semi-bullet), date e importi delle rate\n" +
            "12. **Scadenza** — Data di scadenza finale per ciascuna linea\n" +
            "13. **Garanzie reali (Security Package)** — Ciascuna categoria di garanzia (pegno su quote/azioni con annotazione nel libro soci, ipoteca, privilegio speciale ex art. 46 TUB, pegno su crediti, pegno su conti correnti, cessione del credito in garanzia ex art. 1260 c.c.) e relativi beni o entità, con menzione della disciplina applicabile (artt. 2784 ss. c.c. per il pegno; artt. 2808 ss. c.c. per l'ipoteca)\n" +
            "14. **Garanzie personali** — Fideiussioni, fideiussioni omnibus, garanzie autonome a prima richiesta — soggetti garanti, ambito ed eventuali limitazioni (limiti di importo, upstream guarantee limitations alla luce dei vincoli ex art. 2358 c.c.)\n" +
            "15. **Covenants finanziari** — Ciascun parametro finanziario (Leverage Ratio, DSCR, Interest Cover, Cashflow Cover), test applicabile, frequenza di verifica e diritto di equity cure\n" +
            "16. **Eventi di Default** — Ciascun evento di inadempimento (mancato pagamento, breach of covenant, cross-default, insolvenza ex art. 5 L.F./CCII, Material Adverse Change), con eventuali grace period e soglie di materialità\n" +
            "17. **Cessione (Assignment)** — Restrizioni o consensi richiesti per cessione/trasferimento (whitelist/blacklist, consenso del prenditore, divieti di subpartecipazione)\n" +
            "18. **Cambio di Controllo** — Definizione di cambio di controllo (rilevante anche ai fini ex art. 2359 c.c.), obblighi conseguenti (rimborso anticipato obbligatorio, cancellazione delle linee, consenso dei finanziatori) e periodo di cura\n" +
            "19. **Commissioni di rimborso anticipato** — Prepayment fee, make-whole, soft-call protection — importo, periodo di applicazione ed eccezioni\n" +
            "20. **Trasparenza e jus variandi** — Verifica del rispetto degli artt. 117-118 TUB sulla forma scritta e sulle modifiche unilaterali; clausole vessatorie ex artt. 1341/1342 c.c. e relativa specifica approvazione per iscritto\n" +
            "21. **Legge applicabile** — Legge regolatrice del contratto\n" +
            "22. **Foro competente / Arbitrato** — Devoluzione delle controversie (foro esclusivo, arbitrato CAM/ICC), eventuale clausola compromissoria ex art. 808 c.p.c.\n\n" +
            "Restituisci la sintesi inline nella chat — NON chiamare generate_docx. Produci un documento Word scaricabile solo se l'utente lo richiede esplicitamente.",
        columns_config: null,
    },

    // ─── Contratto Commerciale ────────────────────────────────────────────────────
    {
        id: "builtin-commercial-agreement",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Review Contratto Commerciale",
        type: "tabular",
        practice: "Contrattualistica Commerciale",
        prompt_md: null,
        columns_config: [
            {
                index: 0,
                name: "Parti",
                format: "bulleted_list",
                prompt: "Identifica tutte le parti del contratto. Per ciascuna parte indica la denominazione sociale completa, sede legale, codice fiscale/P.IVA (se presente) e il ruolo (es. fornitore, cliente, licenziante, mandatario, agente).",
            },
            {
                index: 1,
                name: "Oggetto del Contratto",
                format: "text",
                prompt: "Riassumi l'oggetto del contratto e le prestazioni dovute. Quali sono le principali deliverable, obbligazioni o servizi (artt. 1325, 1346 c.c.)? Identifica eventuali limitazioni o esclusioni dell'oggetto.",
            },
            {
                index: 2,
                name: "Modifica Contratto Precedente",
                format: "yes_no",
                prompt: "Il contratto modifica, integra, sostituisce o nova un contratto preesistente (art. 1230 c.c. — novazione)? Se sì, identifica il contratto originario per data e oggetto.",
            },
            {
                index: 3,
                name: "Data di Efficacia",
                format: "date",
                prompt: "Qual è la data di efficacia o di decorrenza del contratto? Se non è espressamente indicata, segnala da quando si considera operativo.",
            },
            {
                index: 4,
                name: "Durata",
                format: "text",
                prompt: "Qual è la durata del contratto? Indica la durata iniziale e le condizioni che ne influenzano la durata (durata determinata/indeterminata).",
            },
            {
                index: 5,
                name: "Rinnovo",
                format: "text",
                prompt: "Quali sono le clausole di rinnovo? Specifica se il rinnovo è tacito o richiede comunicazione, il periodo di rinnovo, i termini di disdetta e i requisiti di forma (raccomandata A/R, PEC). Verifica eventuali profili di clausole vessatorie ex art. 1341 c.c.",
            },
            {
                index: 6,
                name: "Corrispettivo",
                format: "text",
                prompt: "Qual è il corrispettivo previsto dal contratto? Identifica tutte le voci (canoni, fee, royalties, parcelle), le modalità di pagamento, la valuta (di norma EUR), il calendario di fatturazione e il termine di pagamento.",
            },
            {
                index: 7,
                name: "Aggiornamenti del Prezzo",
                format: "text",
                prompt: "Sono previsti meccanismi di adeguamento del prezzo? Identifica eventuali indicizzazioni (ISTAT FOI, IPCA), benchmark, aggiustamenti basati sui volumi o altri meccanismi. Specifica frequenza e modalità di calcolo.",
            },
            {
                index: 8,
                name: "Penali e Interessi di Mora",
                format: "text",
                prompt: "Quali penali si applicano in caso di ritardato pagamento? Includi tassi di interesse di mora (verifica conformità con D.Lgs. 231/2002 — interessi di mora nelle transazioni commerciali, attualmente tasso BCE + 8 punti percentuali), diritti di sospensione e altre tutele.",
            },
            {
                index: 9,
                name: "Valore Stimato del Contratto",
                format: "monetary_amount",
                prompt: "Qual è il valore totale stimato o dichiarato del contratto? Se non è indicato un valore unico, calcola/stima sulla base dei prezzi e della durata. Indica la valuta e le ipotesi assunte.",
            },
            {
                index: 10,
                name: "Limitazioni di Responsabilità",
                format: "text",
                prompt: "Quali limitazioni di responsabilità sono previste? Identifica i massimali (e come sono calcolati), le esclusioni di danno indiretto/consequenziale e i carve-out (dolo, colpa grave, danni alla persona — verifica validità ex artt. 1229, 1341/1342 c.c.).",
            },
            {
                index: 11,
                name: "Proprietà Intellettuale",
                format: "text",
                prompt: "Come sono regolati la titolarità e la licenza dei diritti di proprietà intellettuale? Identifica chi detiene la PI preesistente, chi acquista la PI generata e quali licenze sono concesse alle parti. Distingui tra background IP e foreground IP, e verifica clausole su know-how ex art. 98 CPI.",
            },
            {
                index: 12,
                name: "Cambio di Controllo",
                format: "text",
                prompt: "È prevista una clausola di cambio di controllo? In caso affermativo, descrivi cosa costituisce cambio di controllo (rinvio all'art. 2359 c.c.), se è richiesto consenso e quali diritti sono attivati (recesso, cessione del contratto ex art. 1406 c.c.).",
            },
            {
                index: 13,
                name: "Forza Maggiore",
                format: "text",
                prompt: "Riassumi la clausola di forza maggiore. Quali eventi qualificano come forza maggiore (causa non imputabile ex art. 1218 c.c.), quali obbligazioni sono sospese, per quanto tempo deve durare l'evento prima della risoluzione e quali oneri di comunicazione sono previsti?",
            },
            {
                index: 14,
                name: "Diritti di Recesso e Risoluzione",
                format: "text",
                prompt: "Quali sono i diritti di recesso e risoluzione delle parti? Distingui tra recesso ad nutum (art. 1373 c.c.), clausola risolutiva espressa (art. 1456 c.c.), risoluzione per inadempimento (art. 1453 c.c.) e risoluzione di diritto (diffida ad adempiere ex art. 1454 c.c., termine essenziale ex art. 1457 c.c.). Indica preavvisi e periodi di cura.",
            },
            {
                index: 15,
                name: "Penali Contrattuali",
                format: "text",
                prompt: "Sono previste penali contrattuali (art. 1382 c.c.)? Identifica gli eventi che le attivano, l'importo o la formula, eventuali limitazioni cumulative e se costituiscono rimedio esclusivo. Considera il potere giudiziale di riduzione equitativa (art. 1384 c.c.).",
            },
            {
                index: 16,
                name: "Legge Applicabile",
                format: "text",
                prompt: "Quale legge regola il contratto? Indica la legge applicabile e i riferimenti specifici (es. Reg. Roma I se internazionale).",
            },
            {
                index: 17,
                name: "Foro Competente / Arbitrato",
                format: "text",
                prompt: "Come si risolvono le controversie? Identifica se le controversie vanno in giudizio ordinario (foro convenzionale o esclusivo ex art. 28 c.p.c.) o in arbitrato (CAM, ICC), eventuali clausole compromissorie (art. 808 c.p.c.), tentativi obbligatori di mediazione ex D.Lgs. 28/2010 e lingua del procedimento.",
            },
        ],
    },

    // ─── Contratto di Finanziamento ────────────────────────────────────────────────
    {
        id: "builtin-credit-agreement",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Review Contratto di Finanziamento",
        type: "tabular",
        practice: "Diritto Bancario e Finanziario",
        prompt_md: null,
        columns_config: [
            {
                index: 0,
                name: "Finanziatori",
                format: "bulleted_list",
                prompt: "Identifica tutti i finanziatori (o il pool/sindacato) indicati nel contratto. Per ciascuno indica la denominazione sociale completa e il ruolo (es. mandated lead arranger, banca finanziatrice, banca agente, security agent).",
            },
            {
                index: 1,
                name: "Prenditori",
                format: "bulleted_list",
                prompt: "Identifica tutti i prenditori indicati nel contratto, con denominazione sociale, sede legale, P.IVA/codice fiscale e numero REA.",
            },
            {
                index: 2,
                name: "Garanti",
                format: "bulleted_list",
                prompt: "Identifica tutti i garanti del contratto, con denominazione sociale completa e ambito dell'obbligazione di garanzia (fideiussione ex art. 1936 c.c., fideiussione omnibus, garanzia autonoma a prima richiesta).",
            },
            {
                index: 3,
                name: "Altre Parti",
                format: "bulleted_list",
                prompt: "Identifica eventuali altre parti rilevanti del contratto (banca agente, security agent/agente delle garanzie, controparti hedge, banca emittente di garanzie autonome). Indica nome e ruolo.",
            },
            {
                index: 4,
                name: "Data del Contratto",
                format: "date",
                prompt: "Qual è la data del contratto di finanziamento?",
            },
            {
                index: 5,
                name: "Linee di Credito",
                format: "bulleted_list",
                prompt: "Elenca ciascuna linea di credito disponibile (es. Linea Revolving, Term Loan A/B/C, Linea Bullet, Linea Amortising). Per ciascuna indica tipologia, denominazione della tranche e principali caratteristiche strutturali.",
            },
            {
                index: 6,
                name: "Importo",
                format: "monetary_amount",
                prompt: "Qual è l'importo totale impegnato nel contratto, sommando tutte le linee? Indica importo, valuta (di norma EUR) e ripartizione per tranche.",
            },
            {
                index: 7,
                name: "Scopo",
                format: "text",
                prompt: "Qual è lo scopo dichiarato per cui possono essere utilizzati i fondi? Identifica eventuali vincoli di destinazione (es. acquisition financing, capex, working capital, refinancing) e verifica coerenza con l'oggetto sociale dei prenditori.",
            },
            {
                index: 8,
                name: "Interessi",
                format: "text",
                prompt: "Quale tasso di interesse si applica? Identifica il tasso di riferimento (EURIBOR, €STR, tasso BCE), lo spread/margine, eventuale margin ratchet, durata dei periodi di interesse e segnala eventuali profili di superamento del tasso soglia anti-usura ex L. 108/1996.",
            },
            {
                index: 9,
                name: "Commissioni",
                format: "text",
                prompt: "Sono previste commissioni (commitment fee, utilization fee, agency fee, arrangement fee)? Indica tasso, base di calcolo (impegno non utilizzato, utilizzo medio) e verifica conformità agli obblighi di trasparenza ex artt. 116-117 TUB.",
            },
            {
                index: 10,
                name: "Piano di Rimborso",
                format: "text",
                prompt: "Riassumi il piano di rimborso per ciascuna linea. Identifica se il rimborso è amortizing, bullet o semi-bullet, e indica date e importi delle rate.",
            },
            {
                index: 11,
                name: "Scadenza Finale",
                format: "date",
                prompt: "Qual è la data di scadenza finale (final maturity) delle linee? Se le linee hanno scadenze diverse, indica ciascuna.",
            },
            {
                index: 12,
                name: "Garanzie Reali",
                format: "bulleted_list",
                prompt: "Quali garanzie reali sono prestate o devono essere prestate? Elenca ciascuna categoria (pegno su quote/azioni con annotazione nel libro soci, ipoteca, privilegio speciale ex art. 46 TUB, pegno su crediti, pegno su conti correnti, cessione del credito in garanzia ex art. 1260 c.c.) e i beni/entità su cui sono costituite.",
            },
            {
                index: 13,
                name: "Garanzie Personali",
                format: "bulleted_list",
                prompt: "Quali garanzie personali sono prestate? Identifica i garanti, l'ambito (fideiussione ex art. 1936 c.c., fideiussione omnibus, garanzia autonoma a prima richiesta) e le eventuali limitazioni (limiti di importo, upstream guarantee limitations alla luce dell'art. 2358 c.c.).",
            },
            {
                index: 14,
                name: "Covenants Finanziari",
                format: "bulleted_list",
                prompt: "Quali covenants finanziari sono previsti? Per ciascuno identifica il parametro (es. Leverage Ratio, DSCR, Interest Cover, Cashflow Cover), il test applicabile, la frequenza di verifica e l'eventuale diritto di equity cure.",
            },
            {
                index: 15,
                name: "Eventi di Default",
                format: "bulleted_list",
                prompt: "Elenca gli eventi di default. Per ciascuno indica eventuali grace period, soglie di materialità, e clausole di cross-default. Considera in particolare insolvenza ex art. 5 L.F. / Codice della Crisi (D.Lgs. 14/2019), Material Adverse Change e violazione di covenant.",
            },
            {
                index: 16,
                name: "Cessione",
                format: "text",
                prompt: "Quali restrizioni o consensi si applicano alla cessione/trasferimento dei diritti contrattuali? Identifica restrizioni alle cessioni dei finanziatori (whitelist/blacklist, consenso del prenditore) e alla cessione del prenditore.",
            },
            {
                index: 17,
                name: "Cambio di Controllo",
                format: "text",
                prompt: "È presente una clausola di cambio di controllo? In caso affermativo, indica cosa costituisce cambio di controllo (rinvio all'art. 2359 c.c.), quali obblighi attiva (rimborso anticipato obbligatorio, cancellazione, consenso dei finanziatori) ed eventuale periodo di cura.",
            },
            {
                index: 18,
                name: "Commissioni di Rimborso Anticipato",
                format: "text",
                prompt: "Sono previste commissioni di rimborso anticipato, make-whole o soft-call protection? Indica importo, periodo di applicazione ed eccezioni (rimborso da indennizzi assicurativi, da disposizioni di asset).",
            },
            {
                index: 19,
                name: "Legge Applicabile",
                format: "text",
                prompt: "Quale legge regola il contratto? Indica la giurisdizione e gli eventuali riferimenti normativi specifici.",
            },
            {
                index: 20,
                name: "Foro Competente / Arbitrato",
                format: "text",
                prompt: "Come si risolvono le controversie? Identifica se vanno in giudizio ordinario (foro esclusivo ex art. 28 c.p.c.) o in arbitrato (CAM, ICC, LCIA), eventuali sedi arbitrali e clausole di sottomissione alla giurisdizione.",
            },
        ],
    },

    // ─── E-Discovery ─────────────────────────────────────────────────────────────
    {
        id: "builtin-ediscovery",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Review Documenti per Contenzioso (e-Discovery)",
        type: "tabular",
        practice: "Contenzioso e Arbitrato",
        prompt_md: null,
        columns_config: [
            {
                index: 0,
                name: "Data",
                format: "date",
                prompt: "Qual è la data del documento? Per email o corrispondenza, usa la data di invio. Per altri documenti, usa la data di creazione, sottoscrizione o la data più rilevante. Per atti giudiziari indica la data di deposito o di notifica.",
            },
            {
                index: 1,
                name: "Tipologia di Documento",
                format: "text",
                prompt: "Di che tipo di documento si tratta? (es. email, memorandum, lettera raccomandata, PEC, contratto, perizia, verbale di riunione, SMS/messaggio, fattura, presentazione, atto di citazione, comparsa di costituzione e risposta, sentenza). Sii specifico.",
            },
            {
                index: 2,
                name: "Mittente",
                format: "text",
                prompt: "Chi è il mittente o autore del documento? Indica nome completo, qualifica e organizzazione laddove identificabili.",
            },
            {
                index: 3,
                name: "Destinatari",
                format: "bulleted_list",
                prompt: "Chi sono i destinatari del documento? Elenca tutti i destinatari A:, CC:, CCN: ove identificabili. Per ciascuno indica nome completo, qualifica e organizzazione, specificando se è in A, CC o CCN.",
            },
            {
                index: 4,
                name: "Sintesi",
                format: "text",
                prompt: "Fornisci una sintesi fattuale concisa del contenuto del documento in 2-4 frasi. Concentrati sulla materia, decisioni assunte, azioni richieste o informazioni veicolate. Non includere conclusioni giuridiche.",
            },
            {
                index: 5,
                name: "Persone Citate",
                format: "bulleted_list",
                prompt: "Elenca tutte le persone citate nel documento (oltre a mittente e destinatari già identificati). Per ciascuna indica il nome e, se identificabili, il ruolo o l'organizzazione.",
            },
            {
                index: 6,
                name: "Coperto da Segreto Professionale?",
                format: "yes_no",
                prompt: "Il documento sembra coperto da segreto professionale forense (artt. 200 c.p.p. e 622 c.p.) o costituisce corrispondenza tra avvocato e cliente tutelata (art. 622 c.p.; D.Lgs. 96/2001 per gli avvocati stabiliti)? Rispondi Sì se appare comunicazione tra avvocato e cliente finalizzata a fornire o ottenere consulenza legale, oppure se redatto in vista di un contenzioso. Rispondi No altrimenti. Se incerto, motiva l'incertezza.",
            },
        ],
    },

    // ─── Contratto di Fornitura ──────────────────────────────────────────────────
    {
        id: "builtin-supply-agreement",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Review Contratto di Fornitura",
        type: "tabular",
        practice: "Contrattualistica Commerciale",
        prompt_md: null,
        columns_config: [
            {
                index: 0,
                name: "Parti",
                format: "bulleted_list",
                prompt: "Identifica tutte le parti del contratto di fornitura. Per ciascuna indica denominazione sociale completa, sede legale, P.IVA/codice fiscale e ruolo (es. fornitore, acquirente, distributore).",
            },
            {
                index: 1,
                name: "Data di Efficacia",
                format: "date",
                prompt: "Qual è la data di efficacia o di decorrenza del contratto? Se non è indicata, segnala da quando si considera operativo.",
            },
            {
                index: 2,
                name: "Beni Forniti",
                format: "bulleted_list",
                prompt: "Quali beni o servizi devono essere forniti in base al contratto? Elenca ciascun prodotto o categoria, includendo specifiche tecniche, codici prodotto e standard di riferimento (norme UNI, EN, ISO).",
            },
            {
                index: 3,
                name: "Durata",
                format: "text",
                prompt: "Qual è la durata iniziale del contratto? Indica la data di inizio (o riferimento all'inizio dell'efficacia) e la data di fine o la durata complessiva.",
            },
            {
                index: 4,
                name: "Rinnovo",
                format: "text",
                prompt: "Quali clausole di rinnovo si applicano? Il rinnovo è tacito o per accordo? Indica il periodo di rinnovo, i termini di disdetta e le eventuali condizioni. Verifica eventuali profili di vessatorietà ex art. 1341 c.c. e, in caso di rinnovo automatico, l'art. 1597 c.c.",
            },
            {
                index: 5,
                name: "Consegna",
                format: "text",
                prompt: "Quali sono le modalità di consegna? Identifica gli Incoterms applicabili (es. EXW, FCA, DDP), i tempi di consegna, i luoghi, il passaggio del rischio (artt. 1510, 1465 c.c.) e le conseguenze di ritardo o mancata consegna.",
            },
            {
                index: 6,
                name: "Qualità e Conformità",
                format: "text",
                prompt: "Quali standard qualitativi o specifiche tecniche si applicano? Identifica eventuali norme applicabili (UNI, ISO, marcatura CE, RoHS, regolamenti settoriali), diritti di ispezione, procedure di accettazione e conseguenze della non conformità (denuncia dei vizi ex artt. 1495, 1511 c.c.).",
            },
            {
                index: 7,
                name: "Garanzie",
                format: "text",
                prompt: "Quali garanzie il fornitore presta sui beni? Indica il periodo di garanzia, l'ambito (esenzione da vizi, conformità alle specifiche), il rimedio in caso di violazione (riparazione, sostituzione, riduzione del prezzo, risoluzione — artt. 1492, 1497 c.c.) ed eventuali esclusioni. In caso di vendita B2C, considera la garanzia legale di conformità ex artt. 128 ss. Codice del Consumo.",
            },
            {
                index: 8,
                name: "Penali",
                format: "text",
                prompt: "Sono previste penali contrattuali (art. 1382 c.c.)? Identifica gli eventi che le attivano (es. ritardo nella consegna, mancato rispetto degli standard qualitativi), il tasso o la formula applicabile, eventuali tetti aggregati e se costituiscono rimedio esclusivo. Considera la possibilità di riduzione giudiziale (art. 1384 c.c.).",
            },
            {
                index: 9,
                name: "Limitazioni di Responsabilità",
                format: "text",
                prompt: "Quali limitazioni di responsabilità si applicano? Identifica massimali di responsabilità (e modalità di calcolo: valore del contratto, fatturato annuo), esclusioni di danni indiretti/consequenziali e carve-out (dolo, colpa grave, danni alla persona — verifica validità ex art. 1229 c.c. e clausole vessatorie ex artt. 1341/1342 c.c.).",
            },
            {
                index: 10,
                name: "Forza Maggiore",
                format: "text",
                prompt: "Riassumi la clausola di forza maggiore. Quali eventi qualificano (causa non imputabile ex art. 1218 c.c., factum principis), quali obbligazioni sono sospese, quale preavviso deve essere dato, dopo quanto tempo le parti possono risolvere il contratto e quali sono le conseguenze della risoluzione per forza maggiore?",
            },
            {
                index: 11,
                name: "Diritti di Recesso/Risoluzione",
                format: "text",
                prompt: "Quali diritti di recesso e risoluzione hanno le parti? Distingui tra recesso ad nutum (art. 1373 c.c.), risoluzione per inadempimento (art. 1453 c.c.), clausola risolutiva espressa (art. 1456 c.c.), diffida ad adempiere (art. 1454 c.c.). Indica preavvisi, periodi di cura e conseguenze (es. ordini d'acquisto pendenti, obblighi di pagamento sopravvissuti).",
            },
            {
                index: 12,
                name: "Legge Applicabile",
                format: "text",
                prompt: "Quale legge regola il contratto? Indica la legge applicabile e segnala eventuale applicazione della Convenzione di Vienna sui contratti di vendita internazionale (CISG) e della sua eventuale esclusione.",
            },
            {
                index: 13,
                name: "Foro Competente / Arbitrato",
                format: "text",
                prompt: "Come si risolvono le controversie? Identifica se vanno in giudizio ordinario (foro esclusivo ex art. 28 c.p.c.) o in arbitrato (CAM, ICC), eventuale clausola compromissoria (art. 808 c.p.c.), tentativi obbligatori di mediazione (D.Lgs. 28/2010) e lingua del procedimento.",
            },
        ],
    },

    // ─── Compravendita Partecipazioni (SPA) ─────────────────────────────────────
    {
        id: "builtin-spa",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Review Compravendita Partecipazioni (SPA)",
        type: "tabular",
        practice: "Diritto Societario",
        prompt_md: null,
        columns_config: [
            {
                index: 0,
                name: "Parti",
                format: "bulleted_list",
                prompt: "Identifica tutte le parti del contratto di compravendita partecipazioni. Per ciascuna indica denominazione sociale completa, sede legale, P.IVA/codice fiscale e ruolo (es. venditore, acquirente, società target, garante, fideiussore).",
            },
            {
                index: 1,
                name: "Data",
                format: "date",
                prompt: "Qual è la data di sottoscrizione (signing) del contratto?",
            },
            {
                index: 2,
                name: "Operazione",
                format: "text",
                prompt: "Riassumi l'operazione. Quali quote/azioni sono oggetto di compravendita, in quale società target, e qual è la natura dell'operazione (es. acquisizione del 100%, partecipazione di maggioranza, di minoranza, joint venture, MBO/LBO)? Indica se è un asset deal o uno share deal.",
            },
            {
                index: 3,
                name: "Corrispettivo",
                format: "monetary_amount",
                prompt: "Qual è il corrispettivo pattuito? Indica il prezzo headline, la valuta, la struttura (cassa, azioni, vendor loan, prezzo differito, earn-out) e l'eventuale meccanismo di aggiustamento (locked box con interest rate, completion accounts/closing accounts, leakage). Per share deal segnala l'eventuale tassazione plusvalenza.",
            },
            {
                index: 4,
                name: "Condizioni Sospensive (CP)",
                format: "bulleted_list",
                prompt: "Elenca le principali condizioni sospensive (Conditions Precedent) al closing. Per ciascuna indica cosa deve essere soddisfatto/rinunciato e da chi. Identifica long-stop date e considera autorizzazioni regolamentari (Antitrust AGCM/Commissione UE, Banca d'Italia ex art. 19 TUB, golden power D.L. 21/2012, IVASS, Consob).",
            },
            {
                index: 5,
                name: "Data di Closing",
                format: "text",
                prompt: "Quando si tiene il closing? Indica quanti giorni lavorativi dopo l'avveramento/rinuncia delle CP deve avvenire il closing e/o l'eventuale long-stop date. Indica se c'è obbligo di closing entro data certa successiva al signing.",
            },
            {
                index: 6,
                name: "Dichiarazioni e Garanzie (R&W)",
                format: "text",
                prompt: "Riassumi il pacchetto di dichiarazioni e garanzie. Chi le rilascia (venditore, management, tutti i venditori in solido)? Distingui tra business warranties (sulla società target) e title warranties (sulla titolarità delle partecipazioni). Identifica l'ambito della disclosure (disclosure letter) e le limitazioni (termini di prescrizione contrattuale, soglie minime, massimale aggregato, condotta del giudizio). Considera l'art. 1490 c.c. (vizi) e l'art. 1497 c.c. (qualità promesse).",
            },
            {
                index: 7,
                name: "Indennizzi (Indemnity)",
                format: "text",
                prompt: "Sono previsti indennizzi specifici? In caso affermativo, elenca i principali (indemnity fiscale, ambientale, contenzioso pendente, lavoro, normativa antimafia). Indica i soggetti obbligati e le passività potenziali coperte. Segnala termini e massimali specifici per gli indemnity.",
            },
            {
                index: 8,
                name: "Limitazioni di Responsabilità",
                format: "text",
                prompt: "Quali limitazioni di responsabilità si applicano alle pretese da R&W e indemnity? Identifica il massimale aggregato (e modalità di calcolo, es. percentuale del prezzo), eventuali massimali separati per fundamental warranties o indemnity (es. fiscale), de minimis (importo singolo) e basket/franchigia (importo aggregato), e i termini di prescrizione contrattuale (typically 18-24 mesi per business warranties, 5-7 anni per fiscali, illimitato per fundamental).",
            },
            {
                index: 9,
                name: "Patti Restrittivi",
                format: "text",
                prompt: "Quali patti restrittivi (covenants) sono assunti dal venditore o dal management? Includi non concorrenza, non sollecitazione di clienti e dipendenti, non disturbo. Indica ambito (attività e geografia) e durata. Verifica conformità con la giurisprudenza italiana sulla ragionevolezza (durata, ambito, corrispettivo) e con l'art. 2596 c.c.",
            },
            {
                index: 10,
                name: "Esclusiva",
                format: "text",
                prompt: "È prevista una clausola di esclusiva o no-shop? In caso affermativo indica il periodo di esclusiva, le attività vietate (es. sollecitazione di offerte concorrenti, contatti con terzi) ed eventuali carve-out o break fee (penale per recesso ex art. 1382 c.c.).",
            },
            {
                index: 11,
                name: "Legge Applicabile e Giurisdizione",
                format: "text",
                prompt: "Quale legge regola il contratto e quali tribunali o collegi arbitrali hanno giurisdizione? Indica la legge scelta, il foro per le controversie e se la giurisdizione è esclusiva o non esclusiva.",
            },
            {
                index: 12,
                name: "Foro Competente / Arbitrato",
                format: "text",
                prompt: "Come si risolvono le controversie? Identifica se vanno in giudizio ordinario o in arbitrato, la sede arbitrale (CAM, ICC, LCIA), il regolamento applicabile (per arbitrato) ed eventuali tappe pre-contenziose obbligatorie (mediazione D.Lgs. 28/2010, negoziazione assistita).",
            },
        ],
    },

    // ─── NDA ─────────────────────────────────────────────────────────────────────
    {
        id: "builtin-nda",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Review Accordo di Riservatezza (NDA)",
        type: "tabular",
        practice: "Contrattualistica Commerciale",
        prompt_md: null,
        columns_config: [
            {
                index: 0,
                name: "Tipologia",
                format: "tag",
                tags: ["Reciproco", "Unilaterale"],
                prompt: "L'NDA è reciproco (entrambe le parti assumono obblighi di riservatezza) o unilaterale (solo una parte assume obblighi di riservatezza)? Identifica la tipologia e nomina la parte divulgatrice e la parte ricevente.",
            },
            {
                index: 1,
                name: "Definizione di Informazioni Riservate",
                format: "text",
                prompt: "Come sono definite le 'Informazioni Riservate'? La definizione è ampia o restrittiva? Richiede che le informazioni siano marcate come riservate o tutto ciò che è scambiato è automaticamente coperto? Identifica eventuali inclusioni o esclusioni esplicite. Verifica coordinamento con la disciplina del segreto commerciale ex artt. 98-99 CPI (D.Lgs. 30/2005).",
            },
            {
                index: 2,
                name: "Obblighi della Parte Ricevente",
                format: "bulleted_list",
                prompt: "Quali sono gli obblighi principali della parte ricevente in relazione alle informazioni riservate? Elenca ciascun obbligo (es. mantenere riservate, non divulgare a terzi, usare solo per lo Scopo Permesso, applicare uno standard specifico di diligenza ex art. 1176 c.c., limitare l'accesso ai soli need-to-know).",
            },
            {
                index: 3,
                name: "Esclusioni Standard",
                format: "yes_no",
                prompt: "L'NDA include le esclusioni standard agli obblighi di riservatezza? Rispondi Sì se l'accordo esclude informazioni che: (a) sono o diventano pubbliche senza violazione; (b) erano già note alla parte ricevente; (c) sono sviluppate indipendentemente; (d) sono ricevute da terzi senza vincoli. Segnala esclusioni mancanti o formulate in modo difforme dallo standard.",
            },
            {
                index: 4,
                name: "Divulgazioni Permesse",
                format: "bulleted_list",
                prompt: "A chi può la parte ricevente divulgare le informazioni riservate? Elenca ciascuna categoria di destinatari permessi (es. dipendenti, consulenti professionali tenuti al segreto professionale, controllate, finanziatori, autorità di vigilanza per obblighi di legge). Indica se la divulgazione successiva richiede che il destinatario sia vincolato da obblighi equivalenti (back-to-back).",
            },
            {
                index: 5,
                name: "Durata",
                format: "text",
                prompt: "Qual è la durata dell'NDA e per quanto tempo durano gli obblighi di riservatezza? Indica la durata iniziale dell'accordo e la durata degli obblighi di riservatezza (specificando se sopravvivono alla cessazione e per quanto). Tipicamente 3-5 anni per informazioni commerciali; tutela illimitata per segreti industriali ex art. 98 CPI.",
            },
            {
                index: 6,
                name: "Restituzione e Distruzione",
                format: "text",
                prompt: "Quali obblighi si applicano alla scadenza o cessazione in merito a restituzione o distruzione delle informazioni? È prevista una scelta tra restituzione e distruzione? La distruzione deve essere certificata? Sono previste eccezioni (es. obblighi di conservazione per finalità regolamentari, sistemi di backup IT, conservazione ex art. 2220 c.c. per le scritture contabili)?",
            },
            {
                index: 7,
                name: "Rimedi",
                format: "text",
                prompt: "Quali rimedi sono previsti per la violazione degli obblighi di riservatezza? L'accordo prevede penali (clausola penale ex art. 1382 c.c.) o indennizzi? È riconosciuto che il danno può essere irreparabile e che è disponibile una tutela cautelare/inibitoria (artt. 700, 669-bis ss. c.p.c.; art. 131 CPI)?",
            },
            {
                index: 8,
                name: "Legge Applicabile e Foro",
                format: "text",
                prompt: "Quale legge regola l'accordo e quali tribunali hanno giurisdizione? Indica la legge scelta, il foro (esclusivo o non esclusivo ex art. 28 c.p.c.) e l'eventuale clausola compromissoria.",
            },
        ],
    },

    // ─── Locazione Commerciale ────────────────────────────────────────────────────
    {
        id: "builtin-commercial-lease",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Review Locazione Commerciale (L. 392/78)",
        type: "tabular",
        practice: "Diritto Immobiliare",
        prompt_md: null,
        columns_config: [
            {
                index: 0,
                name: "Locatore",
                format: "text",
                prompt: "Chi è il locatore del contratto? Indica denominazione/nome completo, sede legale o residenza, codice fiscale/P.IVA e gli estremi catastali del bene (foglio, particella, subalterno) ove indicati.",
            },
            {
                index: 1,
                name: "Conduttore",
                format: "text",
                prompt: "Chi è il conduttore? Indica denominazione/nome completo, sede legale o residenza, codice fiscale/P.IVA e l'attività che sarà svolta nei locali (con riferimento al codice ATECO).",
            },
            {
                index: 2,
                name: "Garante / Fideiussore",
                format: "text",
                prompt: "È previsto un garante/fideiussore? In caso affermativo, indica il nome completo e l'ambito della garanzia (fideiussione integrale ex art. 1936 c.c., fideiussione bancaria a prima richiesta, limitata a obbligazioni specifiche). Se non c'è garante, indicalo esplicitamente.",
            },
            {
                index: 3,
                name: "Immobile Locato",
                format: "text",
                prompt: "Descrivi l'immobile oggetto della locazione. Includi indirizzo, piano, identificativo unità (mappali catastali), superficie netta (mq), eventuali pertinenze incluse (cantine, posti auto, magazzini) o aree escluse, e destinazione d'uso urbanistica e catastale.",
            },
            {
                index: 4,
                name: "Data del Contratto",
                format: "date",
                prompt: "Qual è la data del contratto? Se la data di decorrenza è diversa da quella di sottoscrizione, indica entrambe. Considera l'obbligo di registrazione entro 30 giorni dalla stipula presso l'Agenzia delle Entrate.",
            },
            {
                index: 5,
                name: "Durata",
                format: "text",
                prompt: "Qual è la durata contrattuale? Indica la durata iniziale e le date di inizio e scadenza. Per locazioni commerciali la L. 392/1978 prevede durata minima di 6 anni + 6 di rinnovo automatico (art. 27 L. 392/78), salvo diniego del locatore solo per i motivi tassativi dell'art. 29 L. 392/78. Per locazioni transitorie ad uso non abitativo verifica i requisiti specifici.",
            },
            {
                index: 6,
                name: "Canone",
                format: "monetary_amount",
                prompt: "Qual è il canone iniziale annuo? Indica importo, valuta (EUR), frequenza di pagamento (es. mensile/trimestrale anticipato), date di pagamento. Segnala eventuale periodo di rent-free o canone agevolato iniziale (step-up rent).",
            },
            {
                index: 7,
                name: "Aggiornamento Canone",
                format: "text",
                prompt: "Sono previste clausole di aggiornamento del canone? Indica modalità di aggiornamento. Per locazioni soggette a L. 392/78 (uso diverso dall'abitativo) l'art. 32 prevede aggiornamento annuale ISTAT FOI nel limite del 75%, salvo deroga in melius per locazioni con canone superiore a determinati limiti. Verifica clausole di indicizzazione integrale e segnala potenziali profili di nullità per locazioni a regime vincolato.",
            },
            {
                index: 8,
                name: "Spese Accessorie / Oneri Condominiali",
                format: "text",
                prompt: "Il conduttore è responsabile di spese accessorie? Descrivi quali spese sono incluse (oneri condominiali ordinari, riscaldamento, ascensore, portierato, acqua, energia elettrica delle parti comuni), la ripartizione (millesimi, percentuale, intero) e la modalità di rendicontazione. Verifica conformità con art. 9 L. 392/78 (oneri accessori).",
            },
            {
                index: 9,
                name: "Assicurazione",
                format: "text",
                prompt: "Quali sono gli obblighi assicurativi? Indica chi assicura (locatore o conduttore), quali rischi devono essere coperti (incendio, scoppio, RCT, danni a terzi), chi sostiene il premio e gli obblighi del conduttore rispetto alla polizza del locatore.",
            },
            {
                index: 10,
                name: "Destinazione d'Uso",
                format: "text",
                prompt: "Qual è la destinazione d'uso prevista? Indica la categoria d'uso (es. ufficio direzionale, attività commerciale al dettaglio, attività di artigianato, attività industriale, attività ricettiva). Verifica coerenza con la destinazione urbanistica e catastale. Per attività con contatto diretto col pubblico (art. 27 L. 392/78) si applica il diritto all'indennità per perdita di avviamento. Indica se è richiesto il consenso del locatore per cambio di destinazione.",
            },
            {
                index: 11,
                name: "Manutenzione",
                format: "text",
                prompt: "Chi è responsabile della manutenzione? Descrivi l'estensione degli obblighi del conduttore. Per le locazioni in generale: manutenzione straordinaria a carico del locatore (art. 1576 c.c.), ordinaria al conduttore (art. 1576 c.c. e art. 1609 c.c. per le riparazioni di piccola manutenzione). Verifica deroghe contrattuali e eventuali clausole 'as is' / inversione degli oneri.",
            },
            {
                index: 12,
                name: "Lavori e Modifiche",
                format: "text",
                prompt: "Quali modifiche può apportare il conduttore? Distingui tra opere strutturali e non strutturali. È richiesto il consenso del locatore? Su quali basi può essere negato? Il conduttore deve ripristinare lo stato originario al termine? Verifica disciplina delle migliorie e delle addizioni ex artt. 1592, 1593 c.c.",
            },
            {
                index: 13,
                name: "Sublocazione e Cessione",
                format: "text",
                prompt: "Quali diritti ha il conduttore di sublocare o cedere il contratto? Per locazioni commerciali soggette a L. 392/78 (art. 36) il conduttore può cedere il contratto o sublocare l'immobile insieme alla cessione/affitto d'azienda anche senza consenso del locatore, purché ne dia comunicazione. Verifica clausole di limitazione e adempimenti formali. Distingui tra cessione del contratto (art. 1406 c.c.) e cessione d'azienda (art. 2558 c.c.).",
            },
            {
                index: 14,
                name: "Recesso",
                format: "text",
                prompt: "Sono previsti diritti di recesso? Per il conduttore commerciale: recesso per gravi motivi con preavviso di 6 mesi (art. 27, ultimo comma, L. 392/78); recesso convenzionale ad nutum se previsto. Per il locatore: diniego di rinnovo solo per i motivi tassativi dell'art. 29 L. 392/78 (uso proprio, ricostruzione, etc.). Indica preavvisi e forme richieste (raccomandata A/R, PEC).",
            },
            {
                index: 15,
                name: "Indennità per Perdita di Avviamento",
                format: "yes_no",
                prompt: "Si applica l'indennità per perdita di avviamento commerciale (artt. 34-35 L. 392/78)? Rispondi Sì se l'attività comporta contatto diretto con il pubblico degli utenti e dei consumatori; in tal caso è dovuta un'indennità pari a 18 mensilità di canone (21 per attività alberghiere) in caso di mancato rinnovo non imputabile al conduttore. Rispondi No se l'attività non rientra (es. ufficio direzionale, deposito) o se vi è espressa rinuncia (verifica validità della rinuncia: secondo Cass. SS.UU. la rinuncia preventiva è nulla).",
            },
            {
                index: 16,
                name: "Riconsegna e Stato dei Locali",
                format: "text",
                prompt: "Quali obblighi di riconsegna si applicano? Descrivi gli obblighi di yield-up (art. 1590 c.c.: restituzione nello stato in cui è stata ricevuta, salvo deterioramento per uso conforme; ripristino delle modifiche). È previsto un verbale di consegna iniziale? Esistono eventuali franchigie sulla restituzione (es. tinteggiatura) o tetti sull'eventuale richiesta di danni?",
            },
            {
                index: 17,
                name: "Deposito Cauzionale",
                format: "monetary_amount",
                prompt: "È richiesto un deposito cauzionale? In caso affermativo, indica importo (di regola fino a 3 mensilità ex art. 11 L. 392/78), modalità di versamento, periodo di custodia, condizioni in cui il locatore può escutere la cauzione e modalità di restituzione (con interessi legali al tasso applicabile).",
            },
            {
                index: 18,
                name: "Risoluzione e Sfratto",
                format: "text",
                prompt: "Quali sono le cause di risoluzione e i diritti di sfratto del locatore? Identifica gli eventi che attivano la risoluzione (morosità — art. 5 L. 392/78 prevede la risoluzione per ritardato pagamento del canone superiore a 20 giorni o degli oneri accessori superiori a 2 mensilità; gravi inadempimenti agli obblighi contrattuali; insolvenza). Considera la procedura di sfratto per morosità ex artt. 658 ss. c.p.c. e il termine di grazia ex art. 55 L. 392/78.",
            },
            {
                index: 19,
                name: "Legge Applicabile e Foro",
                format: "text",
                prompt: "Quale legge regola il contratto e quale foro è competente? Indica il foro convenzionale (art. 28 c.p.c., generalmente foro dell'immobile per locazioni — art. 21 c.p.c.). Considera l'obbligatorietà della mediazione ex D.Lgs. 28/2010 per le controversie locatizie.",
            },
        ],
    },

    // ─── Limited Partnership Agreement (Fondo) ───────────────────────────────────
    {
        id: "builtin-lpa",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Review Regolamento di Fondo / LPA",
        type: "tabular",
        practice: "Private Equity",
        prompt_md: null,
        columns_config: [
            {
                index: 0,
                name: "Gestore (GP / SGR)",
                format: "text",
                prompt: "Identifica il General Partner o la SGR (Società di Gestione del Risparmio) gestrice del fondo. Indica denominazione sociale completa, sede, eventuale autorizzazione Banca d'Italia ex art. 34 TUF (D.Lgs. 58/1998) e l'eventuale soggetto di gestione delegata (advisor).",
            },
            {
                index: 1,
                name: "Denominazione e Giurisdizione del Fondo",
                format: "text",
                prompt: "Qual è la denominazione completa del fondo e in quale giurisdizione è istituito? Indica forma giuridica (FIA italiano riservato/aperto/chiuso ex TUF; SCS, SCA o equivalenti se estero come Lussemburgo SCSp, Cayman Exempted LP). Per FIA italiani indicare se si tratta di FIA mobiliare/immobiliare/credit fund ex Reg. Banca d'Italia.",
            },
            {
                index: 2,
                name: "Patrimonio Sottoscritto Totale",
                format: "monetary_amount",
                prompt: "Qual è il patrimonio sottoscritto/committed capital totale del fondo? Indica target size, eventuale hard cap, valuta (EUR per FIA italiani) e date di closing (first/final closing).",
            },
            {
                index: 3,
                name: "Richiami e Versamenti (Capital Calls)",
                format: "text",
                prompt: "Come avvengono i richiami di capitale dagli investitori? Indica preavviso per i richiami (drawdown notice), meccanismo della comunicazione, eventuali limiti di frequenza o entità dei richiami, e se gli importi rimborsati possono essere richiamati nuovamente (recallable distributions).",
            },
            {
                index: 4,
                name: "Conseguenze Inadempimento (Default Investitore)",
                format: "text",
                prompt: "Quali sono le conseguenze in caso di mancato versamento da parte di un investitore? Descrivi penali (interessi sull'importo arretrato, diluizione della quota, vendita forzosa con sconto, perdita di diritti di voto o di distribuzione, esclusione da future operazioni). Eventuali periodi di cura prima dell'attivazione delle penali.",
            },
            {
                index: 5,
                name: "Strategia di Investimento e Limiti",
                format: "text",
                prompt: "Qual è la strategia di investimento dichiarata e quali sono i limiti? Includi settori, geografie, fasi di investimento, tipologie di strumenti e limiti di concentrazione (es. % massima del committed capital per singolo investimento). Verifica conformità con i limiti regolamentari per i FIA italiani (Reg. Banca d'Italia/Ministeriale 30/2015).",
            },
            {
                index: 6,
                name: "Durata del Fondo",
                format: "text",
                prompt: "Qual è la durata del fondo? Indica la durata iniziale (es. 10 anni dal final closing), eventuali estensioni consentite (es. 2 × 1 anno), chi può approvarle (GP da solo o con consenso LPAC/investitori) e meccanismi di terminazione anticipata.",
            },
            {
                index: 7,
                name: "Commissione di Gestione",
                format: "text",
                prompt: "Qual è la commissione di gestione (management fee) corrisposta al gestore? Indica il tasso, la base di calcolo (committed capital durante il periodo di investimento, NAV o capitale investito successivamente), eventuali step-down e la frequenza di pagamento.",
            },
            {
                index: 8,
                name: "Carried Interest",
                format: "text",
                prompt: "Qual è il carried interest spettante al GP? Indica la percentuale (tipicamente 20%), la struttura (waterfall a livello di fondo/europeo vs. deal-by-deal/americano) e identifica ogni step della distribution waterfall (rimborso del capitale, hurdle/preferred return, GP catch-up, profit split). Considera il regime fiscale italiano del carried interest (art. 60 D.L. 50/2017) e i requisiti per la qualificazione come reddito di capitale.",
            },
            {
                index: 9,
                name: "Hurdle Rate (Preferred Return)",
                format: "percentage",
                prompt: "È previsto un preferred return o hurdle rate che gli investitori devono ricevere prima che il GP percepisca il carried interest? Indica il tasso (tipicamente 6-8%), se è composto e su quale base (capital invested, contributed capital). Se non è previsto un preferred return, indicalo esplicitamente.",
            },
            {
                index: 10,
                name: "GP Catch-Up",
                format: "text",
                prompt: "È previsto un meccanismo di GP catch-up dopo il raggiungimento dell'hurdle? In caso affermativo descrivi: quale percentuale delle distribuzioni va al GP durante la fase di catch-up (tipicamente 100%), e quale risultato economico è progettato per ottenere (es. il GP riceve il 20% di tutti i profitti distribuiti fino a quel punto).",
            },
            {
                index: 11,
                name: "Clawback",
                format: "text",
                prompt: "È prevista un'obbligazione di clawback a carico del GP nel caso percepisca carried in eccesso? Indica se il calcolo è a livello di fondo o di singolo partner, quando si attiva (durante la vita del fondo, alla liquidazione), eventuali tetti all'obbligazione di clawback, e l'esistenza di meccanismi di garanzia (escrow, guarantee del gestore o del personale chiave).",
            },
            {
                index: 12,
                name: "Spese e Costi (oltre Management Fee)",
                format: "bulleted_list",
                prompt: "Quali spese e costi sono addebitati al fondo o agli investitori, oltre la commissione di gestione? Elenca ciascuna categoria (transaction fees, monitoring fees, broken deal costs, formation expenses, legali, fund administration, organisational expenses, costi di compliance/regolamentari). Per ciascuna indica chi sopporta il costo e se è oggetto di offset rispetto alla management fee.",
            },
            {
                index: 13,
                name: "Distribuzioni",
                format: "text",
                prompt: "Come e quando avvengono le distribuzioni agli investitori? Descrivi tempistica (al realizzo degli investimenti o a discrezione del GP), eventuale possibilità di reinvestire i proventi durante il periodo di investimento e se le distribuzioni possono avvenire in-kind (titoli anziché contanti).",
            },
            {
                index: 14,
                name: "Clausola Key Person",
                format: "text",
                prompt: "È prevista una clausola key person? Identifica le persone chiave designate. Quali eventi attivano la key person event (uscita, incapacità, dedizione di tempo inferiore a soglia)? Quali conseguenze (sospensione del periodo di investimento)? Gli investitori hanno diritto di terminare o votare la continuazione dopo l'evento?",
            },
            {
                index: 15,
                name: "Rimozione del GP",
                format: "text",
                prompt: "In quali circostanze può essere rimosso il GP? Distingui tra rimozione for cause (frode, colpa grave, dolo — indica la maggioranza degli investitori richiesta) e senza causa (no-fault removal — indica la maggioranza richiesta e le conseguenze, es. trattamento del carried al momento della rimozione, indennizzi del GP).",
            },
            {
                index: 16,
                name: "Comitato Consultivo (LPAC)",
                format: "text",
                prompt: "È previsto un Limited Partner Advisory Committee (LPAC) o organo equivalente? Descrivi composizione, modalità di selezione dei membri, poteri principali (approvazione di conflitti d'interesse, valutazioni, estensioni, operazioni con parti correlate) e se le decisioni sono vincolanti o solo consultive.",
            },
            {
                index: 17,
                name: "Limitazioni al Trasferimento",
                format: "text",
                prompt: "Quali restrizioni si applicano al trasferimento o cessione della quota di un investitore? È richiesto il consenso del GP? Sono previste eccezioni (trasferimenti ad affiliate)? Sono permesse vendite sul mercato secondario e a quali condizioni o diritti di prelazione?",
            },
            {
                index: 18,
                name: "Conflitti di Interesse",
                format: "text",
                prompt: "Come sono regolati i conflitti di interesse? Descrivi la deal allocation policy tra fondi del gestore, eventuali co-investment rights concessi agli investitori, restrizioni sulle operazioni con parti correlate e ruolo dell'LPAC nella revisione/approvazione dei conflitti. Verifica conformità con la disciplina del TUF e Reg. Intermediari Consob.",
            },
            {
                index: 19,
                name: "Legge Applicabile e Foro",
                format: "text",
                prompt: "Quale legge regola il regolamento del fondo / LPA e quali tribunali o collegi arbitrali hanno giurisdizione sulle controversie? Per FIA italiani il regolamento è approvato da Banca d'Italia.",
            },
        ],
    },

    // ─── Sintesi Patti Parasociali (Assistant) ──────────────────────────────────
    {
        id: "builtin-sha-summary",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Sintesi Patti Parasociali",
        type: "assistant",
        practice: "Diritto Societario",
        prompt_md:
            "## Sintesi Patti Parasociali\n\n" +
            "Analizza i patti parasociali caricati e produci una sintesi legale completa che copra i seguenti punti. " +
            "Per ciascuna sezione individua le clausole chiave, cita gli articoli del patto e segnala eventuali clausole insolite o non conformi alla disciplina degli artt. 2341-bis e 2341-ter c.c. (durata massima quinquennale per le S.p.A. non quotate; durata massima triennale e obblighi di pubblicità per le società quotate).\n\n" +
            "1. **Parti e partecipazioni** — Denominazione sociale completa, ruolo, classi di azioni/quote detenute, percentuali di partecipazione (anche su base fully diluted)\n" +
            "2. **Categorie di azioni e diritti** — Per ciascuna categoria: diritti di voto (anche voto plurimo o maggiorato ex artt. 2351 c.c. e 127-quinquies TUF), dividendi, privilegi in liquidazione, diritti di conversione/riscatto\n" +
            "3. **Composizione e governance del CdA** — Numero dei consiglieri, diritti di nomina (e soglie di partecipazione necessarie a mantenerli), diritti di nomina del Presidente, voto determinante, voto di lista ex art. 147-ter TUF (se applicabile)\n" +
            "4. **Materie riservate (reserved matters)** — Decisioni che richiedono maggioranze qualificate, unanimità o consenso specifico di un socio, sia in CdA sia in assemblea (artt. 2364, 2365, 2479 c.c.)\n" +
            "5. **Diritto di prelazione su nuove emissioni** — Titolari del diritto di opzione ex art. 2441 c.c. (S.p.A.) o art. 2481-bis c.c. (S.r.l.), procedura, tempistiche e carve-out (es. piani di stock option, aumenti riservati)\n" +
            "6. **Limiti al trasferimento** — Lock-up, divieti di trasferimento, trasferimenti consentiti (a controllate, ad affiliate); annotazione nel libro soci ex art. 2355-bis c.c. (prelazione/gradimento)\n" +
            "7. **Prelazione e gradimento** — Trigger, procedura, meccanismi di valorizzazione e deroghe; verifica della clausola di mero gradimento ex art. 2355-bis c.c. (necessità di obbligo di acquisto o diritto di recesso)\n" +
            "8. **Drag-along** — Titolari, soglia di attivazione, condizioni (prezzo minimo, valutazione indipendente), tutele delle minoranze\n" +
            "9. **Tag-along** — Titolari, soglia di trigger, procedura di esercizio, condizioni di prezzo\n" +
            "10. **Tutele anti-diluizione** — Tipologia (full ratchet, weighted average broad/narrow-based), eventi di trigger, meccanica di calcolo ed eccezioni\n" +
            "11. **Politica dei dividendi** — Obblighi o target di distribuzione, dividendi privilegiati, vincoli (utili distribuibili ex art. 2433 c.c., riserva legale ex art. 2430 c.c.)\n" +
            "12. **Exit e liquidità** — Modalità di uscita (trade sale, IPO, drag sale), tempistiche, preferenze in liquidazione (liquidation preference)\n" +
            "13. **Stallo decisionale (deadlock)** — Definizione, escalation (mediazione, conciliazione), meccanismi di risoluzione (Russian roulette, Texas shoot-out, opzioni put/call), conseguenze in caso di mancata composizione (eventuale scioglimento ex art. 2484 c.c.)\n" +
            "14. **Obblighi di non concorrenza e non sollecitazione** — Soggetti vincolati, ambito di attività e geografico, durata, carve-out — verifica conformità con i principi giurisprudenziali sulla non concorrenza post-contrattuale (ragionevolezza, art. 2596 c.c.)\n" +
            "15. **Durata e pubblicità del patto** — Durata (massimo 5 anni rinnovabili per S.p.A. non quotate ex art. 2341-bis c.c.; per società quotate art. 122 TUF — comunicazione Consob, deposito presso Registro Imprese, pubblicazione su quotidiano)\n" +
            "16. **Legge applicabile e risoluzione delle controversie** — Legge regolatrice, foro/sede arbitrale, eventuale clausola arbitrale ex art. 34 D.Lgs. 5/2003 per arbitrato societario, escalation obbligatoria (mediazione)\n\n" +
            "Genera la sintesi come documento Word scaricabile.",
        columns_config: null,
    },

    // ─── Patti Parasociali (Tabular) ─────────────────────────────────────────────
    {
        id: "builtin-shareholder-agreement",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Review Patti Parasociali",
        type: "tabular",
        practice: "Diritto Societario",
        prompt_md: null,
        columns_config: [
            {
                index: 0,
                name: "Parti",
                format: "bulleted_list",
                prompt: "Identifica tutte le parti dei patti parasociali. Per ciascuna indica denominazione sociale completa, sede legale, P.IVA/codice fiscale e ruolo (es. società, socio di maggioranza, socio di minoranza, investitore finanziario, founder, management).",
            },
            {
                index: 1,
                name: "Data",
                format: "date",
                prompt: "Qual è la data dei patti parasociali? Per società quotate verifica la pubblicazione sul sito web della società e l'estratto pubblicato in Gazzetta Ufficiale entro 5 giorni (art. 122 TUF).",
            },
            {
                index: 2,
                name: "Capitale Sociale e Categorie di Azioni",
                format: "bulleted_list",
                prompt: "Quali categorie di azioni/quote sono in circolazione o previste? Per ciascuna categoria descrivi i principali diritti (voto incluso voto plurimo/maggiorato ex art. 2351 c.c. e art. 127-quinquies TUF, dividendi, privilegi in liquidazione, conversione, riscatto). Per S.r.l. considera la disciplina ex art. 2468 c.c.",
            },
            {
                index: 3,
                name: "Partecipazioni",
                format: "bulleted_list",
                prompt: "Quali sono le partecipazioni di ciascuna parte come previste o contemplate dai patti? Per ciascun socio indica numero di azioni/quote, categoria, e percentuale del capitale sociale (anche su base fully diluted). Verifica coerenza con il libro soci ex art. 2421 c.c.",
            },
            {
                index: 4,
                name: "Composizione del CdA",
                format: "text",
                prompt: "Come è composto il Consiglio di Amministrazione? Indica il numero totale di consiglieri, il diritto di nomina di ciascun socio o classe (e la soglia di partecipazione necessaria a mantenerlo), eventuali disposizioni sul Presidente o voto determinante. Per società quotate considera il voto di lista ex art. 147-ter TUF e i requisiti di quote di genere (L. 120/2011).",
            },
            {
                index: 5,
                name: "Materie Riservate",
                format: "bulleted_list",
                prompt: "Quali sono le materie riservate o veto rights? Elenca ogni materia che richiede approvazione qualificata oltre la maggioranza ordinaria (maggioranza qualificata, unanimità, consenso specifico di un socio), sia in CdA sia in assemblea. Identifica la soglia o il consenso richiesto per ciascuna. Considera il coordinamento con artt. 2364, 2365, 2479 c.c.",
            },
            {
                index: 6,
                name: "Diritto di Opzione su Nuove Emissioni",
                format: "text",
                prompt: "Quali diritti di opzione si applicano sull'emissione di nuove azioni/quote? Descrivi i titolari del diritto, la procedura, le tempistiche di accettazione e gli eventuali carve-out (es. azioni emesse in piani di stock option, aumenti riservati, conferimenti in natura). Verifica coordinamento con art. 2441 c.c. (S.p.A.) o art. 2481-bis c.c. (S.r.l.).",
            },
            {
                index: 7,
                name: "Limiti al Trasferimento",
                format: "text",
                prompt: "Quali restrizioni si applicano al trasferimento delle azioni/quote? Identifica eventuali lock-up (con relativa durata), trasferimenti vietati e trasferimenti permessi senza consenso (es. ad affiliate, family trusts). Considera i meccanismi di prelazione/gradimento statutari ex art. 2355-bis c.c. e art. 2469 c.c. Verifica la trascrizione nel libro soci.",
            },
            {
                index: 8,
                name: "Diritto di Prelazione",
                format: "text",
                prompt: "È previsto un diritto di prelazione sul trasferimento delle partecipazioni? In caso affermativo descrivi titolari, procedura di trigger ed esercizio (preavvisi, meccanismi di valorizzazione, perizia di terzo arbitratore ex art. 1349 c.c.) ed eventuali eccezioni.",
            },
            {
                index: 9,
                name: "Drag-Along",
                format: "text",
                prompt: "Sono previsti diritti di drag-along? In caso affermativo identifica titolari (es. soci di maggioranza sopra una soglia specifica), soglia di attivazione, obblighi imposti ai soci trascinati, condizioni del drag (prezzo minimo, valutazione indipendente, fairness opinion) e tutele dei soci di minoranza (tag pari prezzo, MAC out).",
            },
            {
                index: 10,
                name: "Tag-Along",
                format: "text",
                prompt: "Sono previsti diritti di tag-along? In caso affermativo identifica titolari, soglia che attiva il tag, procedura di esercizio (preavviso), prezzo e condizioni alle quali il socio aderente può vendere ed eventuali eccezioni (es. trasferimenti infragruppo).",
            },
            {
                index: 11,
                name: "Tutele Anti-Diluizione",
                format: "text",
                prompt: "Sono previste tutele anti-diluizione per qualche categoria di soci? In caso affermativo descrivi tipologia (full ratchet, weighted average broad-based o narrow-based), eventi di trigger, modalità di calcolo del prezzo o entitlement aggiustato ed eccezioni (es. emissioni permesse escluse dal calcolo).",
            },
            {
                index: 12,
                name: "Politica dei Dividendi",
                format: "text",
                prompt: "Quali clausole sui dividendi sono previste? Descrivi obblighi o policy di distribuzione (es. percentuale minima degli utili distribuibili), eventuali dividendi privilegiati e vincoli (subordinazione a utili effettivamente distribuibili ex art. 2433 c.c., approvazione del CdA o assemblea, consenso dei finanziatori). Considera la disciplina della riserva legale (art. 2430 c.c.) e l'eventuale dividendo preferenziale ex art. 2350 c.c.",
            },
            {
                index: 13,
                name: "Exit e Liquidità",
                format: "text",
                prompt: "Quali meccanismi di exit o liquidità sono previsti? Descrivi i canali di uscita concordati (trade sale, IPO, drag-along), eventuali milestone temporali, diritti di iniziare un processo di exit dopo un periodo specificato e preferenze in liquidazione (liquidation preference, partecipanti vs. non partecipanti).",
            },
            {
                index: 14,
                name: "Stallo Decisionale (Deadlock)",
                format: "text",
                prompt: "Come è regolato lo stallo decisionale? Descrivi i meccanismi di risoluzione (escalation al senior management, mediazione/conciliazione, Russian roulette/Texas shoot-out, opzioni put/call). Per ciascun meccanismo indica condizioni di trigger, procedura e conseguenze in caso di mancata risoluzione (eventuale scioglimento per impossibilità di funzionamento ex art. 2484 c.c.).",
            },
            {
                index: 15,
                name: "Non Concorrenza e Non Sollecitazione",
                format: "text",
                prompt: "Sono previsti obblighi di non concorrenza o non sollecitazione? In caso affermativo identifica i soci vincolati, l'ambito (attività e geografia), la durata (durante la vigenza del patto e/o per un periodo successivo all'uscita). Verifica conformità ex art. 2596 c.c. (limiti di oggetto, tempo e luogo) e con la giurisprudenza sulla ragionevolezza.",
            },
            {
                index: 16,
                name: "Riservatezza",
                format: "text",
                prompt: "Quali obblighi di riservatezza sono imposti? Indica l'ambito delle informazioni riservate, le divulgazioni permesse (consulenti professionali, affiliate, finanziatori) e la durata dell'obbligo. Verifica se l'obbligo sopravvive alla cessazione del patto. Considera coordinamento con art. 2622 c.c. (false comunicazioni sociali) e disciplina del market abuse ex TUF per società quotate.",
            },
            {
                index: 17,
                name: "Dichiarazioni e Garanzie",
                format: "text",
                prompt: "Quali dichiarazioni e garanzie sono prestate dai soci? Identifica chi le rilascia, l'oggetto (titolarità delle partecipazioni, capacità, assenza di vincoli, assenza di conflitti, idoneità antiriciclaggio), eventuali limitazioni alle pretese (termini di prescrizione contrattuale, massimali, qualifiche di knowledge) e indennizzi prestati.",
            },
            {
                index: 18,
                name: "Durata e Pubblicità",
                format: "text",
                prompt: "Qual è la durata del patto? Verifica conformità con art. 2341-bis c.c.: per S.p.A. non quotate durata massima 5 anni rinnovabile, per S.p.A. quotate durata massima 3 anni (art. 123 TUF). Per società quotate verifica obblighi di pubblicità ex art. 122 TUF: comunicazione a Consob entro 5 giorni dalla stipula, deposito al Registro Imprese, pubblicazione su quotidiano e sito web.",
            },
            {
                index: 19,
                name: "Legge Applicabile",
                format: "text",
                prompt: "Quale legge regola il patto? Indica la giurisdizione e gli eventuali riferimenti normativi specifici.",
            },
            {
                index: 20,
                name: "Foro Competente / Arbitrato",
                format: "text",
                prompt: "Come si risolvono le controversie? Identifica se vanno in giudizio ordinario o in arbitrato (CAM, ICC), eventuale clausola arbitrale ex art. 34 D.Lgs. 5/2003 (arbitrato societario), eventuali tappe pre-contenziose obbligatorie (mediazione D.Lgs. 28/2010) e se la giurisdizione è esclusiva.",
            },
        ],
    },

    // ─── Contratto di Lavoro ─────────────────────────────────────────────────────
    {
        id: "builtin-employment-agreement",
        user_id: null,
        is_system: true,
        created_at: "",
        title: "Review Contratto di Lavoro",
        type: "tabular",
        practice: "Diritto del Lavoro",
        prompt_md: null,
        columns_config: [
            {
                index: 0,
                name: "Datore di Lavoro",
                format: "text",
                prompt: "Chi è il datore di lavoro nel contratto? Indica denominazione sociale completa, sede legale, P.IVA, codice fiscale, posizione INPS e INAIL, eventuale unità produttiva di assegnazione.",
            },
            {
                index: 1,
                name: "Lavoratore",
                format: "text",
                prompt: "Chi è il lavoratore nel contratto? Indica nome completo, codice fiscale, residenza/domicilio e luogo di nascita.",
            },
            {
                index: 2,
                name: "Data del Contratto",
                format: "date",
                prompt: "Qual è la data del contratto di lavoro? Se la data di assunzione/decorrenza è diversa dalla data di sottoscrizione, indica entrambe. Verifica il rispetto degli obblighi di comunicazione UNILAV preventiva al Centro per l'Impiego (D.Lgs. 152/1997).",
            },
            {
                index: 3,
                name: "Mansioni e Inquadramento",
                format: "text",
                prompt: "Quali sono le mansioni e l'inquadramento contrattuale del lavoratore? Indica la qualifica, il livello CCNL, la categoria (operaio, impiegato, quadro, dirigente) e la posizione organizzativa. Verifica coerenza con l'art. 2103 c.c. (mansioni ed equivalenza) e disposizioni del CCNL applicabile.",
            },
            {
                index: 4,
                name: "CCNL Applicato",
                format: "text",
                prompt: "Quale CCNL è applicato al rapporto di lavoro? Indica il contratto collettivo nazionale (es. CCNL Commercio, Metalmeccanico, Industria, Studi Professionali), la sigla sindacale firmataria e l'eventuale contrattazione di secondo livello (territoriale o aziendale).",
            },
            {
                index: 5,
                name: "Retribuzione",
                format: "text",
                prompt: "Qual è la retribuzione lorda annua del lavoratore? Indica retribuzione base, scatti di anzianità, indennità (di contingenza, EDR, di funzione, di trasferta), tredicesima e quattordicesima mensilità (se previste dal CCNL), eventuali superminimi assorbibili o non assorbibili. Indica la frequenza di pagamento (di norma mensile) e segnala eventuali bonus/MBO ex art. 2099 c.c.",
            },
            {
                index: 6,
                name: "Tipologia (Tempo Pieno / Tempo Parziale)",
                format: "tag",
                tags: ["Tempo Pieno", "Tempo Parziale"],
                prompt: "Si tratta di un rapporto a tempo pieno o a tempo parziale? Se part-time indica numero di ore/giorni a settimana e tipologia (orizzontale, verticale, misto). Considera D.Lgs. 81/2015 sulle clausole elastiche e flessibili.",
            },
            {
                index: 7,
                name: "Lavoro Subordinato o Autonomo?",
                format: "yes_no",
                prompt: "Il contratto è qualificato come lavoro subordinato (art. 2094 c.c.) o come collaborazione/lavoro autonomo? Rispondi Sì se autonomo (collaborazione coordinata e continuativa, libero professionista, partita IVA, prestazione d'opera ex art. 2222 c.c.). Considera i criteri di qualificazione e i rischi di riqualificazione ex art. 2 D.Lgs. 81/2015 (etero-organizzazione).",
            },
            {
                index: 8,
                name: "Benefit",
                format: "bulleted_list",
                prompt: "Quali benefit sono riconosciuti al lavoratore? Elenca ciascuno (es. assicurazione sanitaria integrativa, polizza vita/infortuni, previdenza complementare ex D.Lgs. 252/2005, auto aziendale ad uso promiscuo, buoni pasto, smartworking, cellulare/PC aziendale, formazione, stock option/RSU). Indica condizioni di eleggibilità e limiti.",
            },
            {
                index: 9,
                name: "Periodo di Prova",
                format: "text",
                prompt: "È previsto un periodo di prova ex art. 2096 c.c.? Indica la durata (massimo previsto dal CCNL applicabile, in genere fino a 6 mesi per dirigenti, 3 mesi per quadri/impiegati). Verifica forma scritta a pena di nullità e validità della clausola.",
            },
            {
                index: 10,
                name: "Preavviso (Datore al Lavoratore)",
                format: "text",
                prompt: "Quale preavviso deve dare il datore di lavoro per recedere dal rapporto (al di fuori del licenziamento per giusta causa)? Indica il preavviso previsto dal CCNL in funzione di anzianità e qualifica e l'eventuale possibilità di indennità sostitutiva del preavviso. Considera i limiti del licenziamento (giusta causa ex art. 2119 c.c., giustificato motivo ex L. 604/1966 e art. 18 St. Lav.).",
            },
            {
                index: 11,
                name: "Preavviso (Lavoratore al Datore)",
                format: "text",
                prompt: "Quale preavviso deve dare il lavoratore per dimettersi? Indica il preavviso previsto dal CCNL in funzione di anzianità e qualifica e l'eventuale obbligo di indennità sostitutiva. Verifica gli obblighi di forma delle dimissioni (procedura telematica obbligatoria ex L. 92/2012, salvo eccezioni — es. dimissioni della lavoratrice in periodo di tutela ex D.Lgs. 151/2001).",
            },
            {
                index: 12,
                name: "Lavoro Straordinario",
                format: "text",
                prompt: "Quali clausole si applicano al lavoro straordinario? Il lavoratore è eleggibile per maggiorazioni straordinarie (ex CCNL: in genere 15-50% per ore eccedenti l'orario normale)? Oppure il contratto prevede che la retribuzione sia comprensiva di eventuali ore straordinarie (clausola di onnicomprensività, valida solo per dirigenti o ruoli direttivi ex art. 17 D.Lgs. 66/2003)?",
            },
            {
                index: 13,
                name: "Orario di Lavoro",
                format: "text",
                prompt: "Qual è l'orario di lavoro? Indica le ore settimanali normali (di norma 40 ex D.Lgs. 66/2003), eventuale articolazione (5 o 6 giorni), flessibilità (banca ore, orario flessibile, smart working ex L. 81/2017). Verifica i limiti massimi (48 ore settimanali medie ex D.Lgs. 66/2003) e il diritto al riposo giornaliero (11 ore consecutive) e settimanale (24 ore).",
            },
            {
                index: 14,
                name: "Modifica delle Condizioni",
                format: "text",
                prompt: "Quali clausole governano la modifica delle condizioni contrattuali? Il datore di lavoro può modificare unilateralmente alcune clausole? Verifica conformità con art. 2103 c.c. (variazione delle mansioni — possibile assegnazione a mansioni equivalenti, declassamento solo per causali specifiche) e art. 2113 c.c. (rinunce e transazioni). Indica clausole specifiche su mobilità (territoriale, ius variandi).",
            },
            {
                index: 15,
                name: "Cessione/Assegnazione di Diritti di PI",
                format: "text",
                prompt: "Quali clausole disciplinano la titolarità dei diritti di proprietà intellettuale? Per le invenzioni del lavoratore considera l'art. 64 CPI (D.Lgs. 30/2005): invenzione di servizio (risultato dovuto, datore titolare senza compenso ulteriore), invenzione aziendale (titolare il datore, ma equo premio al lavoratore), invenzione occasionale (titolare il lavoratore, diritto di opzione del datore). Per il software l'art. 12-bis L. 633/1941 attribuisce al datore i diritti economici. Verifica eventuali clausole su know-how e segreti commerciali (art. 98 CPI).",
            },
            {
                index: 16,
                name: "Cause di Licenziamento",
                format: "bulleted_list",
                prompt: "Quali cause di licenziamento per giusta causa o giustificato motivo soggettivo sono previste? Elenca ciascuna causa (es. furto, frode, violazione del codice etico, gravi insubordinazioni, abbandono del posto di lavoro). Verifica conformità con il CCNL (codice disciplinare ex art. 7 St. Lav.), L. 604/1966, art. 2119 c.c. (giusta causa) e art. 18 St. Lav./art. 3 D.Lgs. 23/2015 (tutele crescenti).",
            },
            {
                index: 17,
                name: "Ferie",
                format: "text",
                prompt: "Quali sono le ferie spettanti al lavoratore? Indica i giorni annui (minimo legale 4 settimane ex art. 10 D.Lgs. 66/2003 e art. 36 Cost.; spesso CCNL prevede 26-30 giorni lavorativi). Verifica disposizioni del CCNL su accrual, godimento (almeno 2 settimane consecutive nell'anno di maturazione, residuo entro 18 mesi) e pagamento delle ferie non godute alla cessazione (irrinunciabilità del minimo legale).",
            },
            {
                index: 18,
                name: "Patto di Non Concorrenza",
                format: "text",
                prompt: "È previsto un patto di non concorrenza post-contrattuale ex art. 2125 c.c.? In caso affermativo verifica i requisiti di validità (forma scritta a pena di nullità, corrispettivo specifico — la giurisprudenza richiede congruità in genere 30-50% della retribuzione, durata massima 5 anni per dirigenti e 3 anni per altri lavoratori, limiti di oggetto e luogo). Identifica eventuali penali per violazione (art. 1382 c.c.).",
            },
            {
                index: 19,
                name: "Trattamento Dati Personali",
                format: "text",
                prompt: "Come è disciplinato il trattamento dei dati personali del lavoratore? Verifica conformità con il GDPR (Reg. UE 2016/679) e D.Lgs. 196/2003 (Codice Privacy), art. 4 St. Lav. (controlli a distanza), provvedimenti del Garante Privacy in materia di lavoro. È fornita informativa? Sono regolate le basi giuridiche e l'utilizzo di strumenti di controllo (videosorveglianza, geolocalizzazione, posta elettronica)?",
            },
        ],
    },
];

export const BUILT_IN_IDS = new Set(BUILT_IN_WORKFLOWS.map((wf) => wf.id));
