export const BUILTIN_WORKFLOWS: { id: string; title: string; prompt_md: string }[] = [
    {
        id: "builtin-cp-checklist",
        title: "Genera Checklist Condizioni Sospensive",
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
            "Tipiche categorie da considerare per l'ordinamento italiano: " +
            "(a) Societarie (delibere assembleari/consiliari, visure camerali aggiornate, certificati di vigenza); " +
            "(b) Garanzie (perfezionamento del pegno su quote/azioni con annotazione nel libro soci e nel Registro delle Imprese, ipoteche con iscrizione, fideiussioni autonome a prima richiesta, privilegi speciali ex art. 46 TUB); " +
            "(c) Legal opinions (capacity, no-conflict, enforceability ex artt. 1325 ss. c.c.); " +
            "(d) Compliance regolamentare (autorizzazioni Banca d'Italia, Consob, IVASS, antitrust AGCM, golden power); " +
            "(e) Documenti finanziari (certificazioni di bilancio, business plan, prove di assenza di MAC).\n\n" +
            "Usa il campo table dell'oggetto sezione (non content) per le righe di ciascuna categoria.\n\n" +
            "Prima di finalizzare, verifica che ogni tabella sia formattata correttamente: ogni tabella deve avere esattamente le quattro colonne sopra nello stesso ordine, le intestazioni devono corrispondere esattamente (Indice, Riferimento, Condizione, Stato), ogni riga deve avere lo stesso numero di celle delle intestazioni, la colonna Indice deve essere progressiva a partire da 1 in ciascuna categoria, e nessuna cella deve contenere markdown spurio, a capo o testo segnaposto (usa stringa vuota per Stato).",
    },
    {
        id: "builtin-credit-summary",
        title: "Sintesi Contratto di Finanziamento",
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
    },
    {
        id: "builtin-sha-summary",
        title: "Sintesi Patti Parasociali",
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
    },
];
