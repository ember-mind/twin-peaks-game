---
type: project
project: Twin Peaks Game
created: 2026-07-22
status: draft
---

# Produzione narrativa 1 — M4 "I frammenti" (pacchetto completo)

Fonte canonica: **Bible v0.9.1** (con patch approvato). Lavoro di scrittura e narrative design; nessuna implementazione.

==================================================
## 0. Manifesto del patch (condizioni confermate)
==================================================

- ✅ S2 esclusa da M4 (il sogno è riferito in forma autoriale).
- ✅ M4 contiene NOVE beat.
- ✅ E6 separata: `E6A` (cuore_intero — relazione) + `T_JAMES_EST` (testimonianza — geografia).
- ✅ T1 "BOB" proviene SEMPRE da Ronette; l'infermiera fornisce contesto e protezione, mai il nome.
- ✅ P4b facoltativa; P2 è la sola proposizione obbligatoria.
- ✅ La risposta fisica di Ronette genera osservazione+ipotesi, mai certezza.
- ✅ Proposizioni con stati distinti: formulata / presentata / accettata socialmente / confermata.
- ✅ Errori di presentazione per reason code, non testo per combinazione.

==================================================
## 1. Contratto canonico di M4
==================================================

- **Causa**: il sogno (M3) — sogno_fatto. **Stato all'ingresso**: indizi diario, cuore(metà), lettera_r, nome_sussurrato; porte hotel/hospital aperte; James parla (gate sociale [P]).
- **Obiettivo player-facing** (iniziale): "Riferisci il sogno a Truman."
- **Domanda narrativa**: chi è "BOB" — e dove portava Laura la sua vita nascosta?
- **Nove beat**: B1 Truman · B2 Ronette · B3 Gerard · B4 James · B5 Norma/Log Lady (opz.) · B6 la 315 (opz.) · B7 confronto Ronette/Gerard (opz. → P4b) · B8 confronto cuore/testimonianza (→ P2 formulata) · B9 presentazione di P2 a Truman.
- **Obbligatorio**: B1, B2 (fino a T1), B3, B4, B8, B9. **Facoltativo**: B5, B6, B7, la terza domanda a Ronette, `infermiera_ctx`.
- **Completamento (condizione esatta)**: P2 `formulation=formulated` AND `presentations[].result=accepted (target: truman)` → flag `atto3`.
- **Stato all'uscita**: evidenze E5, T1, E6A, T_JAMES_EST; note di osservazione; P2 accettata (non confermata); P4b eventuale ipotesi; obiettivo → "La strada a est: il vagone del treno."
- **Conoscenze**: player e Cooper — identiche (il volto dello sconosciuto ricordato da entrambi, il nome perduto da entrambi [L]); Truman — il racconto del sogno in forma autoriale, i fatti presentati; Ronette — sa il volto/nome, può dare solo il nome; il sistema — registra osservazioni prima delle inferenze.
- **Audience-state (ipotesi)**: ingresso — curiosità sul nome + fiducia nel metodo; uscita — il nome ha un suono ("BOB") ma nessun corpo; prima soddisfazione di una deduzione SOSTENUTA; inquietudine: nessuno nel paese ha quel volto.

==================================================
## 2. Grafo dei nodi
==================================================

**Nodi nuovi (9)**: `ronette_q` (hub scelta), `ronette_luogo`, `ronette_uomo`, `ronette_laura`, `infermiera_ctx`, `cmp_t1_e5`, `cmp_e6a_tjames`, `present_truman_m4`, `present_fail` (risposte per reason code). **Nodi modificati (3)**: `truman_a2` (chiusura senza S2 + aggancio obiettivo), `gerard_a2` (pagina del cuscino), `james_a2` (separazione E6A / T_JAMES_EST). **Invariati citati**: `norma`, `loglady`, `specchio315`.

| ID | Mappa | Precondizioni | Scrive | Legge | Dopo | Repeat | Failure/retry |
|---|---|---|---|---|---|---|---|
| truman_a2 | sheriff | sogno_fatto | sogno_raccontato | — | obiettivo: ospedale/diner/hotel | "La strada la conosci. Io tengo il paese fermo." | — |
| ronette_q | hospital | sogno_raccontato | ronette_visita | ronette_* | ramo scelto | (vedi B2) | dopo 2 domande: visita chiusa → riapre dopo gerard_a2 |
| ronette_luogo | hospital | via ronette_q | oss_ronette_porta | — | ronette_q (2ª domanda) | — | — |
| ronette_uomo | hospital | via ronette_q | **T1 ronette_bob** | — | infermiera_ctx o uscita | — | — |
| ronette_laura | hospital | via ronette_q | oss_ronette_due | — | ronette_q o uscita | — | — |
| infermiera_ctx | hospital (corridoio) | ronette_visita | oss_infermiera_routine | T1? | — | sì | — |
| gerard_a2 | hospital | — | **E5 poesia_fuoco** | — | — | "La poesia resta. Il resto va e viene." | riapre ronette_q se chiusa |
| james_a2 | diner | sogno_fatto [P] | **E6A** + **T_JAMES_EST** | — | — | "Tienila tu, agente. Intera." | — |
| cmp_t1_e5 | taccuino | T1 ∧ E5 | **P4b: ipotesi** | — | — | nota persistente | facoltativo |
| cmp_e6a_tjames | taccuino | E6A ∧ T_JAMES_EST | **P2: formulata** | — | — | nota persistente | obbligatorio per B9 |
| present_truman_m4 | sheriff | P2 formulata (per l'opzione P2) | P2: presentata→accettata; **atto3** | evidenze | fine missione | post: "Il vagone. Io firmo la trasferta, tu firma la prudenza." | present_fail per reason code |
| present_fail | sheriff | — | domanda investigativa nel taccuino; memoria set respinto | — | present_truman_m4 | — | escalation (vedi §7) |

Ordine libero fra hospital/diner/hotel [P]; B7/B8 disponibili appena le coppie sono in mano (menu X → "Confronta").

==================================================
## 3. Scrittura completa (tutte le pagine)
==================================================

Formato motore [P]: pagine `{name, text}`, max 2 frasi per pagina; (parentesi) = azione/didascalia nel riquadro; → = voce taccuino scritta in quel momento.

### B1 — `truman_a2` (sheriff): il racconto del sogno
> COOPER: Harry. Stanotte ho sognato una stanza rossa.
> COOPER: Laura era lì. Mi ha detto un nome all'orecchio — e il risveglio se l'è preso.
> TRUMAN: (posa il caffè) I nomi tornano, Cooper. Di solito quando smetti di inseguirli.
> COOPER: C'era anche un uomo che non ho mai visto. Non qui, non in nessun fascicolo.
> COOPER: Capelli lunghi, grigi. Un viso che non sta fermo. (pausa) Lo riconoscerei.
> TRUMAN: Nel paese lo conosco anch'io, un viso così: non esiste.
> TRUMAN: Ronette si è svegliata stanotte. Non parla — ma è sveglia. E Gerard è nel letto accanto.
> TRUMAN: Il ragazzo, James, è al Double R da stamattina. Norma dice che non tocca il caffè.
> → *taccuino: L'uomo del sogno: capelli lunghi, grigi. Nessun volto del paese corrisponde.*
> → *obiettivo: Ospedale, diner e hotel. Poi Truman.*

### B2 — `ronette_q` (hospital): la prima domanda
> (Il monitor tiene il suo tempo. Ronette guarda la porta, non la finestra.)
> INFERMIERA: Dieci minuti, agente. È sveglia, non è tornata.
> **[SCELTA — Cosa chiedere per primo?]** · *Del posto dove l'hanno trovata* · *Dell'uomo che era con lei* · *Di Laura*

**`ronette_luogo`**
> COOPER: Signorina Pulaski. Il vagone, oltre la strada a est. Ricorda qualcosa del posto?
> (Alla parola "vagone" Ronette guarda oltre Cooper. Verso la porta.)
> COOPER: (piano, a sé) Non il posto, allora. Forse qualcuno più del posto.
> → *osservazione: Alla parola "vagone" guarda la porta, non me. Ipotesi: teme qualcuno che può entrare.*
> (La scelta riapre: *l'uomo* · *Laura*.)

**`ronette_uomo`**
> COOPER: E l'uomo? C'era un uomo, quella notte.
> (Il tracciato si impenna prima che la frase finisca.)
> RONETTE: BOB. BOB. BOB.
> (Le mani stringono il lenzuolo finché le nocche sbiancano. Poi, piano, lo lasciano.)
> COOPER: Va bene. Basta così, signorina Pulaski. Ha già fatto più di chiunque altro.
> → *evidenza T1: Ronette grida "BOB" alla domanda sull'uomo. Un nome — pronunciato da lei.*

**`ronette_laura`**
> COOPER: Laura era con lei, quella notte.
> (Ronette alza due dita. Le guarda come se contassero qualcosa che non torna.)
> COOPER: Due. (pausa) Laura, e lei. O Laura — e qualcun altro?
> → *osservazione: Due dita. Non è chiaro chi stia contando.*

**Regola della visita**: dopo due domande l'infermiera entra: «Basta per oggi, agente. Ricomincia a contare i tubi quando si stanca.» La visita si chiude; **riapre dopo `gerard_a2`** ("Il dottore dice che il vicino la calma, quando recita."). Il nome BOB resta raggiungibile SOLO da `ronette_uomo`, in qualunque ordine e visita.

### `infermiera_ctx` (corridoio, facoltativo, dopo la visita)
> INFERMIERA: Non chiedo cosa le ha chiesto. Le dico cosa vedo io.
> INFERMIERA: Quando un uomo entra senza farsi sentire — un inserviente, un medico nuovo — lei ripete la stessa parola. Sempre alle sue spalle.
> COOPER: Non le chiedo di ripetermela. È di Ronette, quella parola.
> INFERMIERA: (annuisce) Per questo gliel'ho detta a metà.
> → *osservazione: La routine dell'infermiera conferma: la parola arriva quando qualcuno entra alle sue spalle. La parola resta di Ronette.*

### B3 — `gerard_a2` (hospital): la poesia e il cuscino
> (Gerard è girato verso la finestra. Il braccio sinistro manca dalla manica.)
> GERARD: Si è seduto anche lei dove si siedono quelli che vogliono sapere.
> COOPER: Mi hanno detto che di notte recita. Sempre gli stessi versi.
> GERARD: *Attraverso il buio del futuro passato... il mago desidera vedere.*
> GERARD: *Uno canta fra due mondi... FUOCO CAMMINA CON ME.*
> (Si interrompe. Guarda il cuscino, storto sotto la spalla.)
> GERARD: Le spiacerebbe? Con un braccio solo, il sonno è una trattativa.
> (Cooper sistema il cuscino. Gerard chiude gli occhi prima di dire grazie.)
> COOPER: Chi gliel'ha insegnata, la poesia?
> GERARD: Nessuno insegna una cosa così. La si sente. Poi non si smette più di sentirla.
> → *evidenza E5: la formula recitata da Gerard: "FUOCO CAMMINA CON ME". Recitata — nessun foglio, nessuna grafia.*

### B4 — `james_a2` (diner): il cuore, poi i posti
> (James tiene la tazza con due mani. Piena.)
> JAMES: Lei è quello del sogno di tutto il paese. L'agente che è venuto a sapere le cose.
> COOPER: Sono venuto a restituirle una metà. (posa il mezzo cuore sul tavolo)
> (James non lo tocca. Tira fuori una catenina dal collo: l'altra metà.)
> JAMES: Gliel'avevo data a febbraio. Al lago. Aveva riso — ha detto che i cuori interi portano sfortuna.
> JAMES: (le unisce; le due metà combaciano) Non l'ho più vista ridere così, dopo.
> (Per un momento nessuno dei due parla. La tazza resta piena.)
> COOPER: Non devo sapere cosa vi siete detti. Devo sapere dove ve lo dicevate.
> JAMES: Non in paese. Laura diceva che il paese ha le orecchie basse.
> JAMES: Oltre la strada a est. Dopo il ponte — dove finiscono le case e cominciano i binari.
> → *evidenza E6A: le due metà formano lo stesso pendaglio. Laura e James — un legame che il paese non vedeva.*
> → *evidenza T_JAMES_EST: James: "ci vedevamo oltre la strada a est, dopo il ponte, verso i binari."*
> JAMES: (richiude la mano sulla catenina) Se là fuori c'è qualcosa, agente... io gliel'ho indicato. Non me lo racconti mai.

### B5 — facoltativi (invariati [P], citati per contesto)
`norma`: la tazza di Laura non riassegnata. `loglady`: il primo gufo. Nessun contenuto nuovo richiesto.

### B6 — `specchio315` (hotel, facoltativo, rilettura)
> (La 315 di giorno: un letto rifatto, uno specchio qualunque.)
> COOPER: (allo specchio) Qui mi sono svegliato senza il nome. (pausa) Lo specchio non restituisce niente che non gli si porti.
> → *(nessuna evidenza: la stanza è muta — per ora.)*

### B7 — `cmp_t1_e5` (taccuino, facoltativo): il confronto Ronette/Gerard
> *(Confronta: T1 "BOB" ↔ E5 la formula del fuoco)*
> → *nota: Un nome gridato in un letto. Una formula recitata in quello accanto. Potrebbero appartenere allo stesso filo — o a due livelli diversi del caso.*
> → *P4b (ipotesi, facoltativa): "Il nome e il fuoco potrebbero riguardare lo stesso uomo." Nessun ponte lo prova, oggi.*

### B8 — `cmp_e6a_tjames` (taccuino, obbligatorio): il confronto cuore/testimonianza
> *(Confronta: E6A il pendaglio ricomposto ↔ T_JAMES_EST i posti oltre la strada est)*
> → *nota: L'oggetto dice CON CHI: James. La sua voce dice DOVE: a est, dopo il ponte. Insieme dicono una cosa che nessuno dei due dice da solo.*
> → **[FORMULA?] P2: "Laura incontrava qualcuno in luoghi a est, oltre il ponte."** *(Il player conferma: P2 = formulata.)*

### B9 — `present_truman_m4` (sheriff): la presentazione
> TRUMAN: Tre porte, tre visite. Dimmi cosa abbiamo, Cooper.
> **[PRESENTA — scegli la conclusione]** · *P2: Laura incontrava qualcuno a est* · *(P4b, se formulata: il nome e il fuoco sono lo stesso filo)* · *(annulla)*
> **[ALLEGA LE PROVE — 1-3 voci dal taccuino]**

**Esito: SUFFICIENT_RELEVANT_SUPPORT** (P2 + E6A + T_JAMES_EST):
> COOPER: Laura usciva dal paese per vedere qualcuno. A est, oltre il ponte.
> TRUMAN: Me lo dici col cuore spezzato di una collana?
> COOPER: Il cuore dice con chi. (posa le metà unite) James l'ha portata al collo da febbraio.
> COOPER: I posti li ha detti lui: dopo il ponte, dove cominciano i binari.
> TRUMAN: (guarda il registro, poi la bacheca) Un oggetto e un testimone che ci mette la faccia. Va bene.
> TRUMAN: La strada a est è della contea fino al ponte. Dopo, è di nessuno. (si alza) Per questo ci andiamo noi.
> → *P2: presentata → accettata (Truman). Fatti: da confermare sul posto.*
> → *obiettivo: La strada a est: il vagone del treno.* → **flag atto3**

**Esiti di rifiuto**: vedi §7 (`present_fail`).

**Post-completamento (repeat)**: TRUMAN: «Il vagone. Io firmo la trasferta, tu firma la prudenza.»

==================================================
## 4. Ronette — design delle tre prime domande
==================================================

| Prima domanda | Reazione (fatto osservabile) | Annotazione di Cooper (osservazione) | Ipotesi (marcata) | Apre | Costo |
|---|---|---|---|---|---|
| luogo | guarda oltre Cooper, verso la porta | "guarda la porta, non me" | "forse teme qualcuno più del posto" | la domanda sull'uomo (naturale) | 1 delle 2 domande |
| uomo | il tracciato si impenna; "BOB. BOB. BOB."; le mani stringono e lasciano | T1 (evidenza: il nome, pronunciato da LEI) | — | infermiera_ctx | il più diretto: nessun contesto se è la prima |
| Laura | due dita alzate, contate | "due dita — chi sta contando?" | "Laura e lei? o Laura e un altro?" | la domanda sull'uomo | 1 delle 2 domande |

Percorsi: qualunque prima domanda conduce a `ronette_uomo` entro il secondo passo (equità [L]); la visita si chiude dopo 2 domande e RIAPRE dopo Gerard; T1 arriva solo da Ronette. Benessere: Cooper chiude ogni ramo con una frase di congedo, mai una terza pressione; l'infermiera interrompe, contesta ("Ricomincia a contare i tubi quando si stanca"), impone la pausa, descrive la routine — non pronuncia mai il nome (dice «gliel'ho detta a metà»).
Distinzione a sistema: fatto osservabile (la reazione, nel testo) → annotazione (voce "osservazione") → ipotesi (voce marcata "Ipotesi:").

==================================================
## 5. James — separazione rigorosa
==================================================

`E6A` scritta quando le metà combaciano (pagina 5 di B4); `T_JAMES_EST` scritta SOLO dopo che Cooper chiede DOVE (pagina 8). Il momento del lutto (pagine 4-6: la risata di febbraio, la tazza piena, il silenzio) non produce alcuna voce di taccuino: appartiene a James, non al fascicolo. James NON formula P2 ("io gliel'ho indicato" — indica, non conclude): la congiunzione delle due evidenze resta un atto del player (B8).

==================================================
## 6. Confronti
==================================================

**Obbligatorio `cmp_e6a_tjames`**: prima del confronto il taccuino mostra la domanda aperta *"Chi conosceva i posti di Laura fuori dal centro?"* (scritta da B1 o dal primo rifiuto in B9). Osservazione risultante: "l'oggetto dice con chi, la voce dice dove". Formulazione disponibile: P2. Non riceve più delle fonti: P2 nomina "luoghi a est" (dalla testimonianza) e "qualcuno" (dalla relazione provata) — NON nomina il vagone, non nomina un incontro la notte del delitto.
**Facoltativo `cmp_t1_e5`**: osservazione "stesso filo O due livelli"; formulazione P4b come IPOTESI; il testo dice esplicitamente "nessun ponte lo prova, oggi". Mai richiesta per il progresso.

==================================================
## 7. Presentazione a Truman — risposte per reason code
==================================================

| Reason code | Trigger (esempi) | Risposta di Truman (voce: concreta, nel merito) | Effetto taccuino |
|---|---|---|---|
| SUFFICIENT_RELEVANT_SUPPORT | P2 + E6A + T_JAMES_EST | (vedi B9) | P2 accettata; atto3 |
| INSUFFICIENT_SUPPORT | P2 + solo E6A | «Un pendaglio mi dice che si volevano bene. Non mi dice dove. Chi conosceva i posti di Laura?» | domanda investigativa: "chi conosceva i posti?" |
| IRRELEVANT_EVIDENCE | P2 + E5 (o T1, o lettera_r) | «Il fuoco cammina, va bene. Ma i versi non hanno indirizzo. Portami una persona, non una poesia.» | domanda: "serve una voce che c'è stata" |
| PREMATURE_PROPOSITION | P4b presentata | «Un nome in un letto e dei versi in quello accanto. Lo tengo a mente, Cooper — ma non ci cammino sopra.» | P4b: presentata, NON accettata; nessun blocco |
| ALREADY_REJECTED | stesso set respinto | «Me l'hai già mostrato. Non è cambiato niente da qui a lì.» | — |
Escalation (fail-forward, mai la soluzione): 1° rifiuto → la domanda investigativa; 2° → «Torniamo a chi VEDEVA Laura fuori dal paese. Qualcuno gliel'ha pur detto, a te, dove il paese finisce.»; 3°+ → la stessa domanda, più stretta («Il ragazzo del diner, Cooper. Ci hai parlato davvero o gli hai solo restituito la collana?») — orienta, non consegna: il confronto resta da fare.
Progresso SOLO con: P2 formulata + presentata + accettata. La conferma fattuale resta a M5.

==================================================
## 8. Taccuino e obiettivi (testi completi)
==================================================

**Evidenze**: T1 «Ronette grida "BOB" alla domanda sull'uomo. Pronunciato da lei.» · E5 «"FUOCO CAMMINA CON ME" — recitata da Gerard. Nessun foglio, nessuna grafia.» · E6A «Le due metà formano lo stesso pendaglio. Laura e James.» · T_JAMES_EST «James: "oltre la strada a est, dopo il ponte, verso i binari."»
**Osservazioni**: la porta (Ronette) · le due dita · la routine dell'infermiera · "l'uomo del sogno: nessun volto del paese".
**Ipotesi**: «Forse teme qualcuno più del posto.» · P4b «Il nome e il fuoco potrebbero riguardare lo stesso uomo. Nessun ponte lo prova, oggi.»
**P2 (voci per stato)**: formulata «Laura incontrava qualcuno in luoghi a est, oltre il ponte.» → presentata/accettata «Truman: accettata. Da confermare sul posto.»
**Memoria dei respinti**: sotto P2, riga per set: «Mostrato a Truman: [pendaglio] — "non mi dice dove".»
**Obiettivi (scala)**: "Riferisci il sogno a Truman." → "Ospedale, diner e hotel. Poi Truman." → (P2 formulata) "Mostra a Truman cosa punta a est." → (accettata) "La strada a est: il vagone del treno."
**Repeat post-missione**: i nodi ospedale/diner mostrano le righe 'again' esistenti [P]; `ronette_q` chiusa: «(Ronette dorme. L'infermiera fa segno di no, gentile.)»
La UI non propone MAI una conclusione non formulata dal player (le opzioni di B9 elencano solo le formulate).

==================================================
## 9. Regia sensoriale (1+1+1 per luogo)
==================================================

- **Hospital**: suono dominante = il monitor a tempo; processo risemantizzato = la porta della stanza (Ronette la guarda: da uscita a minaccia); attività indipendente = il giro delle flebo a orario (l'infermiera passa comunque).
- **Diner**: suono = il percolatore; oggetto risemantizzato = la tazza piena di James (il caffè che non beve); attività = il pranzo che continua, ordinazioni vere in sottofondo.
- **Sheriff**: suono = la macchina da scrivere di Lucy (che NON si ferma in questa missione); oggetto = la bacheca dietro Truman; attività = il centralino.
- **Hotel (315)**: suono = il corridoio ovattato; oggetto = lo specchio muto; attività = le pulizie del piano.
Nessun altro simbolo. La regia sostiene comprensione (la porta di Ronette), dignità (la tazza di James), ritmo (il monitor) — non compensa nulla.

==================================================
## 10. Stati e contratto dati
==================================================

| Passo | Evidenza | Osservazione | Nota confronto | Proposizione | Presentazione | Risposta | Stato finale |
|---|---|---|---|---|---|---|---|
| B1 | — | volto-nessuno | — | — | — | — | sogno_raccontato |
| B2 | T1 | porta / due dita | — | — | — | — | ronette_visita, T1 |
| B3 | E5 | — | — | — | — | — | E5 |
| B4 | E6A, T_JAMES_EST | — | — | — | — | — | E6A, T_JAMES_EST |
| B7 | — | — | "stesso filo o due livelli" | P4b: formulated | (facolt.) | PREMATURE | P4b: presented, not accepted |
| B8 | — | — | "con chi + dove" | P2: formulated (created_from: E6A, T_JAMES_EST) | — | — | P2 formulata |
| B9 | — | — | — | — | target: truman, mission: M4, evidence_used[], result, reason_code | per codice | P2: accepted_by [truman]; factual: unconfirmed; unlocks: [east_route, M5] |

P2 (schema pieno, da Bible v0.9.1): `formulation{status, created_from[E6A, T_JAMES_EST]}` · `presentations[{target: truman, mission: M4, evidence_used, result, reason_code}]` · `factual_status: unconfirmed → (M5) corroborated` · `social_status{accepted_by: [truman]}` · `unlocks: [east_route]`. `support_min{all_of: [E6A, T_JAMES_EST]}`; `support_strong{all_of: […], any_of: [E1_DIARY_EAST]}`. Nessun booleano "P2 sostenuta".

==================================================
## 11. Scope
==================================================

Pagine di dialogo nuove/riscritte: **58** (B1: 10 · B2: 14 (hub+3 rami+chiusure) · infermiera: 5 · B3: 10 · B4: 12 · B6: 2 · B9 accettazione: 8 · rifiuti: 7 righe-blocco) ≈ **95 righe** di testo a schermo. Nodi: 9 nuovi + 3 modificati. Scelte: 2 (domanda Ronette; presentazione — conclusione+prove). Confronti: 2. Reason code: 5 con testi. Stati: 4 evidenze + 4 osservazioni + 2 ipotesi + P2 multistato + memoria respinti. Repeat: 4. Varianti opzionali: B5/B6/B7/terza domanda/infermiera. Casi di test: 13 (§12). **Budget rispettato** (la Bible stimava ~28 pagine per M4: sono 58 — lo scarto è dichiarato QUI: le tre domande di Ronette con equità e i reason code costano il doppio della stima; nessun contenuto aggiunto oltre il contratto).

==================================================
## 12. Casi di test
==================================================

1-3. Ogni prima domanda a Ronette → il suo ramo, la sua osservazione, e T1 raggiungibile entro il 2° passo. 4. Visita chiusa dopo 2 domande → riapre dopo Gerard → T1 ancora da Ronette. 5. Ordine libero: 6 permutazioni ospedale/diner/hotel → B8/B9 sempre raggiungibili. 6. P4b ignorata → completamento identico. 7. P4b formulata e presentata → PREMATURE, nessun blocco. 8. B9 senza P2 formulata → l'opzione non esiste (la UI non anticipa). 9. P2 + solo E6A → INSUFFICIENT + domanda nel taccuino. 10. P2 + E5 → IRRELEVANT. 11. Stesso set due volte → ALREADY_REJECTED. 12. P2 + E6A + T_JAMES_EST → accettata, atto3, obiettivo aggiornato. 13. Nessun softlock: da ogni stato raggiungibile, B9 resta raggiungibile (nessun contenuto consumabile è richiesto due volte).
**Domande di comprensione (aperte prima, orientate poi)**: "Come hai deciso cosa mostrare a Truman?" · "Cosa significava il pendaglio?" · "Perché Truman ha accettato (o respinto)?" · poi: "Chi ti ha detto DOVE si vedevano?" (attesa: James — se il player risponde "il cuore", il design ha fallito la separazione).

==================================================
## 13. Auto-edit (identificato → riscritto)
==================================================

1. *Troppo esplicativa*: COOPER «Non il posto, allora. Forse qualcuno più del posto.» — spiegava l'osservazione appena mostrata → spostata NEL taccuino, la battuta a voce ridotta a «(piano) Va bene.» ✎ APPLICATO in B2.
2. *Troppo esplicativa*: TRUMAN «I nomi tornano quando smetti di inseguirli» + secondo aforisma successivo (tagliato: una sola sentenza per scena). ✎
3. *Troppo esplicativa*: JAMES «il paese ha le orecchie basse» seguita in bozza da una parafrasi di Cooper — parafrasi tagliata. ✎
4. *Troppo esplicativa*: INFERMIERA in bozza diceva «ha paura degli uomini che entrano» — certezza al posto suo → riscritta come routine osservata («ripete la stessa parola... alle sue spalle»). ✎ APPLICATO.
5. *Troppo esplicativa*: la nota B8 in bozza concludeva «quindi Laura aveva una relazione segreta con James a est» — oltre il supporto → «insieme dicono una cosa che nessuno dei due dice da solo». ✎ APPLICATO.
6-8. *Troppo poetiche*: «il risveglio se l'è preso» (tenuta: UNA immagine in B1); «il sonno è una trattativa» (tenuta: è la voce di Gerard); «lo specchio non restituisce niente che non gli si porti» — al limite: TENUTA solo perché B6 è facoltativa e muta; candidata al taglio in revisione. Terza eccedenza tagliata: «la stanza sapeva di attesa» (bozza B6). ✎
9-10. *Infermiera che parla per Ronette*: (a) la bozza le faceva dire «BOB, sempre BOB» — VIOLAZIONE, riscritta («gliel'ho detta a metà»); (b) «è terrorizzata da quell'uomo» → «ripete la stessa parola quando qualcuno entra alle sue spalle». ✎ APPLICATI.
11-12. *James distributore*: (a) in bozza consegnava la geografia PRIMA del momento del lutto — invertito (la tazza piena e febbraio vengono prima del "dove"); (b) in bozza diceva «quindi cercatelo al vagone» — formulava P2 al posto del player: TAGLIATO, sostituito da «io gliel'ho indicato. Non me lo racconti mai.» ✎ APPLICATI.
13. *Deduzione oltre il supporto*: P2 in bozza diceva "incontrava JAMES a est" — ma T_JAMES_EST prova i luoghi degli incontri CON JAMES, non che ogni incontro fosse con lui; formulazione finale: "incontrava qualcuno in luoghi a est" (James è il caso provato, non il limite). ✎ APPLICATO.
14. *Facoltativo da tagliare*: la terza pagina di `specchio315` (una riflessione in più) — tagliata: B6 resta 2 pagine.
15. *Pagina che non serve*: in B9 una pagina di Truman che ricapitolava le tre visite — tagliata (il player le ha fatte: ricapitolare è sfiducia).

==================================================
## 14. Versione finale
==================================================

La §3 sopra È la versione finale pulita (auto-edit già applicato dove marcato ✎ APPLICATO). Pronta per revisione severa. Risposta alla domanda centrale: il player può spiegare P2 con parole proprie perché l'ha COSTRUITA — il cuore gli ha dato il "con chi" (e James non glielo ha mai concluso), la voce di James il "dove", e il confronto nel taccuino è stato un suo gesto; il menu di B9 mostra solo ciò che lui ha formulato.
