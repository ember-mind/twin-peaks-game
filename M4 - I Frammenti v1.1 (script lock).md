---
type: project
project: Twin Peaks Game
created: 2026-07-22
status: draft
---

# M4 "I frammenti" — v1.1.1 SCRIPT LOCK

Applica le correzioni del verbale v1.0 (24/30) + il micro-patch v1.1.1 del verbale v1.1 (26/30: P2/B8 logica corretta, B9 corretto, B8 incorporata nello script finale §7 come UNICA sorgente testuale, manifesti nodi/reason-code riconciliati, 2 percorsi di test Ronette aggiunti). Nessun personaggio, indizio o sistema nuovo; scope non espanso. **Stato: SCRIPT LOCK — campione operativo per le missioni successive.**

==================================================
## 1. Decisione canonica sulla geografia [registrata]
==================================================

**VERSIONE A — il vagone NON è ancora noto in M4.** Motivo: coerente con la struttura del gioco (il vagone è la scoperta di M5, gated da atto3) e con il criterio di minima riscrittura. Conseguenze applicate:
- "vagone" e "a est" RIMOSSI da ogni battuta precedente a P2 (la domanda a Ronette diventa: «Ricorda il posto dove l'hanno trovata?»).
- La geografia entra nel gioco SOLO dalla voce di James (T_JAMES_EST): è lui che nomina l'est, il ponte, i binari.
- P2 non "scopre il vagone": produce una **rotta investigativa credibile**. M5 scopre il vagone seguendola.
- Testo dell'obiettivo post-P2 (sostituisce il gradino [P] "La strada a est: il vagone del treno"): **"Verifica la rotta di James: oltre il ponte, verso i binari."** (Il gradino "vagone" diventa il testo di M5, DOPO la scoperta.)

==================================================
## 2. P2 corretta
==================================================

**Formulazione canonica (v1.1.1)**: «Il pendaglio conferma che James aveva con Laura un rapporto privato. James colloca alcuni dei loro incontri oltre il ponte, verso i binari: una rotta investigativa da verificare.»
**Versione breve da taccuino**: «James colloca alcuni incontri oltre il ponte, verso i binari. Il pendaglio conferma il rapporto da cui parla.»
**Distribuzione logica**: E6A = conferma che James aveva ACCESSO diretto a una parte privata della vita di Laura (fonte pertinente e informata, NON infallibile); T_JAMES_EST = fornisce la geografia (testimonianza da verificare); P2 = una rotta di lavoro accettabile, mai un fatto. Contratto dati: `social_status{accepted_by:[truman], acceptance_type: investigatory_route}`, `factual_status: unconfirmed`.

==================================================
## 3. B8 riscritto — la domanda, non la spiegazione
==================================================

*(Nota progettuale — il testo canonico di B8 vive SOLO nello script §7. Qui il razionale.)* Il taccuino mostra i due fatti nudi e PONE una domanda. Le tre letture insegnano tre distinzioni autentiche: **accesso alla conoscenza** (A, corretta) / **generalizzazione eccessiva** (B — sbagliata non perché la geografia manchi, ma perché James descrive ALCUNI incontri con LUI, non l'intera vita privata di Laura) / **eccesso simbolico** (C). Stati: `b8_attempt_result: SOURCE_CORROBORATION | GEOGRAPHIC_OVERREACH | SYMBOLIC_OVERREACH`, `b8_attempt_history[]`, `assistance_level`.

==================================================
## 4. Doppia prova eliminata (versione A consigliata)
==================================================

Presentando P2, il sistema mostra AUTOMATICAMENTE la provenienza con cui è stata formulata («Formulata da: il pendaglio ricomposto + la testimonianza di James»). Nessun allegato manuale in M4: la selezione probatoria completa è riservata a M9, dove allegare la prova sbagliata ha un significato reale.

==================================================
## 5. Obbligatorio/facoltativo riconciliati
==================================================

- **Gerard: FACOLTATIVO fortemente guidato** (il letto accanto a Ronette: la geografia della stanza lo offre, l'obiettivo non lo impone). E5 alimenta il filo BOB/fuoco (P4b), non l'accesso all'est. Il completamento non lo richiede.
- **La 315: facoltativa**, mai in obiettivo.
- **Scala obiettivi riscritta**: "Riferisci il sogno a Truman." → **"Parla con Ronette all'ospedale e con James al Double R."** + riga separata: *"Facoltativo: la stanza 315; il vicino di stanza che recita versi."* → (P2 formulata) "Mostra a Truman il nesso che regge." → (accettata) **"Verifica la rotta di James: oltre il ponte, verso i binari."**
- Test aggiornati: Gerard ignorato → M4 completabile; hotel ignorato → nessun obiettivo lo richiede.

==================================================
## 6. Ronette — regola unica
==================================================

**La domanda sull'uomo è TERMINALE.** Scelta per prima: T1 subito, la visita finisce — nessun contesto (costo leggibile). Scelta per seconda: chiude naturalmente la visita. Le domande luogo/Laura aprono quella sull'uomo. **Riapertura: il giro medico** (precondizione: aver completato un altro beat; l'infermiera: «Ha riposato. Dieci minuti, come prima.») — Gerard non è la cura narrativa di niente. Una visita successiva offre le domande residue (facoltative). L'infermiera descrive comportamento, mai interpreta. La regola "due domande in ogni caso" è ABROGATA.

==================================================
## 7. Script v1.1 — versione finale pulita
==================================================

### B1 — `truman_a2` (sheriff) — 8 pagine
> COOPER: Harry. Stanotte ho sognato una stanza rossa.
> COOPER: Laura era lì. Mi ha detto un nome all'orecchio. Al risveglio non c'era più.
> TRUMAN: Se torna, lo mettiamo a verbale. Per ora abbiamo persone sveglie.
> COOPER: Nel sogno c'era anche un uomo. Capelli lunghi, grigi. Sorrideva mentre nessun altro lo faceva.
> TRUMAN: Se fosse di qui, avrei già un nome.
> TRUMAN: Ronette si è svegliata stanotte. Non parla — ma è sveglia.
> TRUMAN: E il ragazzo, James, è al Double R da stamattina. Norma dice che non tocca il caffè.
> → *taccuino: L'uomo del sogno: capelli lunghi, grigi. Nessun volto del paese corrisponde.*
> → *obiettivo: Parla con Ronette all'ospedale e con James al Double R.* *(facoltativo: la 315; il vicino che recita versi)*

### B2 — `ronette_q` (hospital) — hub + 3 rami — 12 pagine
> (Il monitor tiene il suo tempo. Ronette guarda la porta, non la finestra.)
> INFERMIERA: Dieci minuti, agente. È sveglia, non è tornata.
> **[SCELTA]** · *Del posto dove l'hanno trovata* · *Dell'uomo che era con lei* · *Di Laura*

**`ronette_luogo`**
> COOPER: Signorina Pulaski. Ricorda il posto dove l'hanno trovata?
> (Alla parola "posto", Ronette guarda verso la porta.)
> COOPER: (piano) Va bene.
> → *osservazione: alla parola "posto" guarda verso la porta.*
> (Restano: *l'uomo* · *Laura*.)

**`ronette_laura`**
> COOPER: Laura era con lei, quella notte.
> (Ronette alza due dita. Le guarda a lungo.)
> COOPER: Due?
> → *osservazione: due dita. Non è chiaro chi stia contando.*
> (Resta: *l'uomo*.)

**`ronette_uomo` — TERMINALE**
> COOPER: E l'uomo? C'era un uomo, quella notte.
> (Il tracciato si impenna prima che la frase finisca.)
> RONETTE: BOB. BOB. BOB.
> (Le mani stringono il lenzuolo. Poi, piano, lo lasciano.)
> COOPER: Grazie. Per oggi basta.
> → *evidenza T1: Ronette grida "BOB" alla domanda sull'uomo. Un nome — pronunciato da lei.*
> (La visita termina. L'infermiera accompagna Cooper fuori.)

**Chiusura visita (se terminata dal ramo uomo o dopo la seconda domanda)**
> INFERMIERA: Quando si stanca, ricomincia dal soffitto. Per oggi basta.

**Riapertura (dopo un altro beat completato)**
> INFERMIERA: Ha riposato. Dieci minuti, come prima.

### `infermiera_ctx` (corridoio, facoltativo) — 4 pagine
> INFERMIERA: Non chiedo cosa le ha chiesto. Le dico cosa vedo io.
> INFERMIERA: Quando un uomo entra senza farsi sentire, lei ripete la stessa parola. Sempre alle sue spalle.
> COOPER: Non le chiedo di ripetermela.
> INFERMIERA: Il resto, se può, deve dirglielo lei.
> → *osservazione: la routine dell'infermiera: la parola arriva quando qualcuno entra alle sue spalle.*

### B3 — `gerard_a2` (hospital, facoltativo guidato) — 9 pagine
> (Gerard è girato verso la finestra. Il braccio sinistro manca dalla manica.)
> GERARD: Quella sedia la usano tutti quelli che vogliono sapere.
> COOPER: Mi hanno detto che di notte recita. Sempre gli stessi versi.
> GERARD: *Attraverso il buio del futuro passato... il mago desidera vedere.*
> GERARD: *Uno canta fra due mondi... FUOCO CAMMINA CON ME.*
> (Si interrompe. Guarda il cuscino, storto sotto la spalla.)
> GERARD: Le spiacerebbe? Con un braccio solo, il sonno è una trattativa.
> (Cooper sistema il cuscino. Gerard chiude gli occhi prima di dire grazie.)
> COOPER: Chi gliel'ha insegnata, la poesia?
> GERARD: Non l'ho imparata. Mi viene.
> → *evidenza E5: la formula recitata da Gerard: "FUOCO CAMMINA CON ME". Recitata — nessun foglio, nessuna grafia.*

### B4 — `james_a2` (diner) — 11 pagine
> (James tiene la tazza con due mani. Piena.)
> COOPER: Sono venuto a restituirle una metà. (posa il mezzo cuore sul tavolo)
> (James non lo tocca. Tira fuori una catenina dal collo: l'altra metà.)
> JAMES: Gliel'avevo data a febbraio. Al lago. Aveva riso — ha detto che i cuori interi portano sfortuna.
> JAMES: (le unisce; le due metà combaciano) Non l'ho più vista ridere così, dopo.
> (Per un momento nessuno dei due parla. La tazza resta piena.)
> COOPER: Non devo sapere cosa vi siete detti. Devo sapere dove ve lo dicevate.
> JAMES: Non in paese. Qui una macchina parcheggiata diventa una storia prima di sera.
> JAMES: Oltre la strada a est. Dopo il ponte — dove finiscono le case e cominciano i binari.
> → *evidenza E6A: le due metà formano lo stesso pendaglio. Laura e James — un legame che il paese non vedeva.*
> → *evidenza T_JAMES_EST: James: "oltre il ponte, verso i binari."*
> JAMES: (richiude la mano sulla catenina) Se là fuori c'è qualcosa, agente... io gliel'ho indicato. Non me lo racconti mai.

### B5 — `norma` / `loglady` (facoltativi, invariati [P])

### B6 — `specchio315` (hotel, facoltativo) — 2 pagine
> (La 315 di giorno: un letto rifatto, uno specchio qualunque.)
> (Cooper guarda il riflesso. Il nome non torna.)

### B7 — `cmp_t1_e5` (taccuino, facoltativo)
> *(Confronta: T1 "BOB" ↔ E5 la formula del fuoco)*
> → *nota: un nome gridato in un letto. Una formula recitata in quello accanto. Stesso filo — o due livelli del caso.*
> → *P4b (ipotesi): "Il nome e il fuoco potrebbero riguardare lo stesso uomo." Nessun ponte lo prova, oggi.*

### B8 — `cmp_e6a_tjames` (taccuino, obbligatorio) — TESTO CANONICO
> *(Confronta: E6A — le due metà combaciano ↔ T_JAMES_EST — "oltre il ponte, verso i binari")*
> *(Prima volta: "Un confronto accosta due voci. Sta a te dire che cosa una aggiunge all'altra.")*
> **Che cosa aggiunge il pendaglio alla testimonianza di James?**
> · **A. Conferma che James parlava da un rapporto privato realmente esistito.** → ✔ «Il pendaglio conferma il rapporto. La geografia resta una testimonianza da verificare.» → **P2 formulata**
> · B. Dimostra che tutti gli incontri segreti di Laura avvenivano presso i binari. → «James descrive alcuni incontri con lui. Non l'intera vita privata di Laura.» (riprova)
> · C. Collega James all'uomo del sogno. → «Niente nelle due fonti riguarda l'uomo del sogno.» (riprova)

### B9 — `present_truman_m4` (sheriff) — 8 pagine
> TRUMAN: Dimmi quale nesso regge, Cooper.
> **[PRESENTA]** · *P2 — la rotta di James* · *(P4b, se formulata)* · *(annulla)*
> *(Presentando P2, il taccuino mostra: "Formulata da: il pendaglio ricomposto + la testimonianza di James.")*
> COOPER: Il pendaglio conferma che quel rapporto esisteva. Il paese non lo vedeva, e James non l'ha mai messo in piazza.
> COOPER: I posti li ha detti lui: oltre il ponte, verso i binari.
> TRUMAN: Il pendaglio conferma che James parlava da dentro quella relazione. La strada resta da controllare.
> TRUMAN: Dopo il ponte non ci sono case. Cominciamo dai binari.
> → *P2: presentata → accettata (Truman). Fatti: da confermare sul posto.*
> → *obiettivo: Verifica la rotta di James: oltre il ponte, verso i binari.* → **flag atto3**

**Se P4b presentata** (PREMATURE_SYMBOLIC_LINK): TRUMAN: «Un nome in un letto e dei versi in quello accanto. Lo tengo a mente — ma non ci cammino sopra.» → P4b: presentata, non accettata.
**Se B9 tentata senza P2 formulata**: TRUMAN: «Non ho ancora un nesso da giudicare. Cosa collega le tue visite?» → *domanda investigativa: "Che cosa aggiunge una visita alle altre?"*
**Repeat post-completamento**: TRUMAN: «I binari. Prendi Hawk, e non toccare niente finché non arrivo.»

==================================================
## 8. Diff v1.0 → v1.1 (righe cambiate) e righe eliminate
==================================================

| v1.0 | v1.1 | Motivo |
|---|---|---|
| «…e il risveglio se l'è preso.» | «Al risveglio non c'era più.» | consapevolezza autoriale |
| «I nomi tornano… quando smetti di inseguirli.» | «Se torna, lo mettiamo a verbale…» | Truman oracolare |
| «Un viso che non sta fermo.» | «Sorrideva mentre nessun altro lo faceva.» | visualizzabile |
| «Nel paese lo conosco anch'io, un viso così: non esiste.» | «Se fosse di qui, avrei già un nome.» | aforisma |
| «Il vagone, oltre la strada a est…» | «Ricorda il posto dove l'hanno trovata?» | anticipava P2/M5 (geografia, §1) |
| «Non il posto, allora. Forse qualcuno più del posto.» | (tagliata — resta «(piano) Va bene.») | spiegava la performance; ORA APPLICATA DAVVERO nel testo §7 |
| nota «Ipotesi: teme qualcuno che può entrare.» | «osservazione: alla parola "posto" guarda verso la porta.» | conclusiva da un solo sguardo |
| «Ha già fatto più di chiunque altro.» | «Grazie. Per oggi basta.» | paternalistico |
| «Due. Laura e lei… o Laura e qualcun altro?» | «Due?» (+ taccuino) | Cooper verbalizzava ogni lettura |
| «Ricomincia a contare i tubi quando si stanca.» | «Quando si stanca, ricomincia dal soffitto. Per oggi basta.» | linea progettata |
| «Per questo gliel'ho detta a metà.» | «Il resto, se può, deve dirglielo lei.» | meta |
| «Si è seduto anche lei dove si siedono…» | «Quella sedia la usano tutti quelli che vogliono sapere.» | macchinosa |
| «Nessuno insegna una cosa così…» | «Non l'ho imparata. Mi viene.» | secondo aforisma |
| «Lei è quello del sogno di tutto il paese.» | (eliminata; si apre col cuore) | James coro greco |
| «Il paese ha le orecchie basse.» | «Qui una macchina parcheggiata diventa una storia prima di sera.» | metafora opaca |
| «Lo specchio non restituisce niente che non gli si porti.» | «(Cooper guarda il riflesso. Il nome non torna.)» | aforisma in beat facoltativo |
| «Tre porte, tre visite.» | «Dimmi quale nesso regge.» | falso con 315 facoltativa |
| «Il cuore dice con chi.» | «Il pendaglio conferma che quel rapporto esisteva.» | attribuiva troppo all'oggetto |
| «Dopo il ponte è di nessuno.» | «Dopo il ponte non ci sono case. Cominciamo dai binari.» | giurisdizione artificiale |
| «Io firmo la trasferta, tu firma la prudenza.» | «I binari. Prendi Hawk, e non toccare niente finché non arrivo.» | parallelismo costruito (+ niente "vagone": §1) |
| B8 «l'oggetto dice CON CHI, la voce dice DOVE» | la DOMANDA a tre letture (§3) | il taccuino spiegava l'operazione |
| B9 riallegare le prove | provenienza mostrata automaticamente (§4) | doppia soluzione |
| P2 «Laura incontrava qualcuno in luoghi a est» | «James può collocare gli incontri… il pendaglio conferma…» | riceveva quasi tutto da T_JAMES_EST |
| obiettivo «Ospedale, diner e hotel. Poi Truman.» | «Parla con Ronette e con James…» + facoltativi separati | hotel obbligatorio solo a parole |
| regola «due domande in ogni caso» | domanda-uomo terminale (§6) | contraddizione con il ramo uomo |
| riapertura «il vicino la calma, quando recita» | «Ha riposato. Dieci minuti, come prima.» (giro medico) | gate travestito da poesia |

**Righe eliminate del tutto (5)**: «Non il posto, allora…» · «Lei è quello del sogno di tutto il paese.» · «Ha già fatto più di chiunque altro.» · la 3ª pagina della 315 (v1.0 l'aveva già tagliata: confermato) · la pagina-riassunto di Truman in B9 (confermata eliminata).

==================================================
## 9. Contratto dati aggiornato
==================================================

P2: `formulation{status, created_from:[E6A, T_JAMES_EST], assistance_level: 0|1|2}` (0 = risposta A al primo colpo; 1-2 = dopo feedback B/C) · `presentations[{target: truman, mission: M4, evidence_shown_auto: true, result, reason_code}]` · `factual_status: unconfirmed` · `social_status{accepted_by:[truman]}` · `unlocks:[east_route]`.
**Due sistemi distinti** (v1.1.1): `presentation_reason_code` (a Truman): `NOT_YET_FORMULATED`, `PREMATURE_SYMBOLIC_LINK` — due, non quattro. `b8_attempt_result` (feedback tutoriale del confronto, NON reason code di presentazione): `SOURCE_CORROBORATION`, `GEOGRAPHIC_OVERREACH`, `SYMBOLIC_OVERREACH`, con `b8_attempt_history[]` per il playtest (distingue errore geografico da simbolico). Vocabolario riservato a M9 (allegato manuale): `NO_GEOGRAPHIC_SUPPORT`, `NO_CORROBORATION`, `ALREADY_REJECTED`.
Ronette: `ronette_visit{questions_asked[], terminal_reached, reopened}`.

==================================================
## 10. Conteggi (separati, dal testo §7)
==================================================

- Pagine di DIALOGO (battute): B1 7 · B2 hub 2 + luogo 3 + laura 3 + uomo 5 + chiusure 2 · infermiera 4 · B3 9 · B4 10 · B9 8 + P4b 1 + anticipata 1 + repeat 1 = **56**
- Pagine d'AZIONE (sole didascalie): B4 1 · B6 2 = **3**
- Voci taccuino: 4 evidenze + 4 osservazioni + 1 nota + 2 ipotesi/P4b + 3 stati P2 + 1 domanda investigativa = **15**
- Label di scelta: 3 (Ronette) + 3 (B8) + 3 (B9) = **9**
- Testi obiettivo: **5** (incl. riga facoltativi) · Repeat: **4** · Risposte: 2 presentation reason-code + 3 b8_attempt · Nodi: **8 nuovi** (ronette_q, ronette_luogo, ronette_laura, ronette_uomo, infermiera_ctx, cmp_t1_e5, cmp_e6a_tjames, present_truman_m4 — le risposte di rifiuto sono INCORPORATE in present_truman_m4, il nodo present_fail è abolito) + 3 modificati · Sottorami: Ronette 3 + B8 3 + B9 3.
- **Budget: contratto di contenuto rispettato; budget della Bible SUPERATO (~59 pagine vs 28 stimate, +110%) e stima invalidata** — la Bible v1.0 dovrà correggere il budget-per-missione usando M4 come taratura.

==================================================
## 11. Casi di test aggiornati (aggiunte al set v1.0)
==================================================

14. Domanda-uomo per PRIMA → T1, visita terminata, zero osservazioni di contesto. 15. Domanda-uomo per SECONDA → contesto della prima + T1, chiusura naturale. 16. Riapertura per giro medico SENZA aver visto Gerard → funziona. 17. Gerard ignorato → M4 completabile; P4b impossibile (coerente). 18. Hotel ignorato → nessun obiettivo lo richiede. 19. La domanda a Ronette non nomina informazioni non guadagnate (nessuna occorrenza di "vagone"/"est" prima di B4). 20. P2 con assistance_level 0/1/2 registrato. 21-22. Lettore non informato risponde: "che cosa prova il pendaglio?" (la relazione/la credibilità di James — NON l'est) e "che cosa dice James?" (i luoghi) — soglia: >75% distinguono. 23. Nessun playtester crede che il pendaglio indichi l'est o che James abbia indicato il vagone. 24. Ogni reason code produce testo coerente con la causa. 25. I conteggi di §10 rigenerabili dal testo (script di conta pagine sul pacchetto, non a mano). 26. Percorso luogo → Laura → chiusura visita → altro beat → riapertura (giro medico) → uomo: entrambe le osservazioni + T1 da Ronette, nessun softlock. 27. Percorso uomo (terminale) → chiusura → riapertura facoltativa → luogo/Laura: T1 obbligatoria ottenuta, contesto residuo facoltativo.
**Domande aperte (ordine)**: «Perché Truman considera James una fonte utile per la rotta a est?» → «Che cosa prova il pendaglio? Che cosa non prova?» → poi le orientate.

==================================================
## 12. Test centrale (dichiarazione)
==================================================

Un lettore non informato, dopo lo script v1.1: il pendaglio *prova che James conosceva davvero la vita privata di Laura*; James *dice dove si vedevano*; insieme *rendono la rotta credibile abbastanza da camminarci*; NON è ancora provato *che cosa ci sia oltre il ponte, né chi sia BOB*. Se una di queste risposte fallisce nel playtest, il beat corrispondente si riscrive.
