---
type: project
project: Twin Peaks Game
created: 2026-07-22
status: draft
---

# Grammatica dell'indagine e drammaturgia giocabile

## REVISIONE VINCOLANTE post-esame (voto 25/30, "esercizio superato", tutor 2026-07-22)

Prevale sul corpo. Correzioni (tutte da integrare nella Bible):

1. **Sogno coerente**: player E Cooper ricordano entrambi il volto sconosciuto; solo il nome è perduto (via la seconda asimmetria della matrice §5 — Cooper può interrogare Ronette sull'uomo visto; il volto resta proceduralmente inutilizzabile).
2. **P2**: il cuore prova la RELAZIONE, la testimonianza di James prova la GEOGRAFIA — "un oggetto identifica una relazione; una testimonianza identifica un luogo. Non fondere le due funzioni perché la conclusione serve alla missione."
3. **P3**: distinguere ripetizione testuale / grafia / materialità (la poesia è PRONUNCIATA da Gerard: nessun campione grafico); "anello posato" richiede segnali osservabili (centrato, niente segni di rotolamento, polvere interrotta) — mai certificare un'intenzione su una posa che il player non può leggere.
4. **P4**: BOB e il fuoco restano separati finché non c'è un ponte reale; il confronto Ronette–Gerard genera un'IPOTESI (`possible_bob_fire_link`), non un fatto accettato.
5. **P5** riformulata: "la presenza di Jacques non basta ad attribuirgli l'atto" — mai certificare l'innocenza; la lezione è la differenza tra "posso collocarlo" e "posso attribuirgli".
6. **P7**: ipotesi investigativa, mai base procedurale — la convocazione si regge su P6+accesso/opportunità da sola.
7. **P8 (correzione logica più importante)**: R+O non compongono niente senza una REGOLA SERIALE ESPLICITA nel diario ("lascerà il suo nome un pezzo alla volta") — allora R, O, l'ordine degli omicidi e il nome ROBERT formulano una TEORIA di firma seriale, non una verità; resta ignoto se la firma sia dell'assassino, di BOB o una messinscena.
8. **P9**: stati distinti — morte / testimone perduto / morte sospetta / omicidio confermato (l'ultimo può restare falso o irrisolto); "è stato eliminato" è lettura di Cooper/player, mai del sistema.
9. **Stati di proposizione multipli**: formulata / presentata / accettata-da-personaggio / confermata / contestata / smentita — l'accettazione di Truman non è verità del mondo. E la UI NON deve proporre le proposizioni appena il supporto è in mano: progressione domanda-aperta → confronto VOLONTARIO → nota emergente → formulabile → presentata (il player COSTRUISCE l'inferenza, non la riconosce in un elenco).
10. **Ronette (equità)**: nessuna domanda sub-ottimale può rendere il filo BOB permanentemente irraggiungibile — il percorso cambia costo/comprensione/ordine, mai la raggiungibilità; ogni domanda produce un filo che porta alle altre (+ l'infermiera come via laterale).
11. **M8**: l'avvertimento deve cambiare UN'AZIONE di Maddy (cosa lascia, dice, tenta — es. prova a partire e torna per Sarah), non solo il testo del monologo; la variante Sarah-trova-il-corpo TAGLIATA (sofferenza senza funzione, Sarah come amplificatore). M8 testa "dove Cooper concentra attenzione incompleta", non "quale versione più dolorosa selezioni".
12. **Volto→ospite: il ponte va realizzato, non promesso** (max 2 segnali): o ritratto di dialogo che diventa il volto BOB per una battuta + registro linguistico; o singolo frame intrusivo + registro; o (senza pipeline ritratti) animazione + riconoscimento TESTUALE di Cooper — e allora si dichiara interpretativo, non "si salda visivamente". Promessa sensoriale e realizzazione devono coincidere.
13. **M10 metodi**: per tenerne 3 servono, ciascuno: 2 domande esclusive, 1 dettaglio verificabile diverso, tattica di Leland distinta, reazione di Truman distinta, costo persistente, forma diversa del verbale — altrimenti Personale+Intuitivo si fondono. S3 resta ESATTAMENTE dov'è.
14. **Loggia partecipata** (senza nuove meccaniche): + ordine degli incontri scelto dal player (Nano/BOB/Laura — cambia cosa ciascuno può citare) + risposta a BOB (parlare/silenzio/ripetere una riga del verbale) + gesto materiale sull'anello (deporlo/mostrarlo/tenerlo — interpretativo, non puzzle). S4 non può essere l'unica partecipazione.
15. **Schede: mai parlare al posto loro** — l'interiorità di Laura è RICOSTRUZIONE marcata; il grido di Ronette "atto comunicativo significativo" senza certificarne la coscienza; Sarah ha percepito e sospettato, non "sapeva"; Maddy riceve UN momento ordinario autonomo (scelta pratica, gusto proprio, qualcosa di non collegato a Laura) che non esiste per preparare la morte.
16. **Sincronie**: la macchina da scrivere di Lucy che si ferma = PERFORMANCE umana (sente, si ferma, guarda, riprende o no), non motivo sonoro; le 3 destinazioni di M8 NON equidistanti — si usa la geografia reale e l'asimmetria è parte della decisione.
17. **Scope del sistema proposizioni**: è una funzionalità MAGGIORE (modello dati, stati multipli, confronti, generazione formulabili, risposta al nesso, memoria dei respinti, salvataggio, taccuino, obiettivi, validazione, test raggiungibilità+anti-brute-force); 44 flag → dati strutturati; budget per COMBINAZIONE DI STATO, non per missione; 570-760 righe ancora basse.
18. **Playtest**: domande aperte PRIMA delle orientate ("Cosa pensavi di poter cambiare?" prima di "Potevi salvarla?"); test dedicati per: equità Ronette, leggibilità volto→ospite, formulata≠confermata, sequenza R-O, falsa pista≠innocenza, Maddy-persona, presenza morale di Laura in M10.

---

Documento progettuale sul gioco reale (nessuna implementazione). Integra le 10 correzioni obbligatorie del round precedente. Scope target: versione raccomandata (decisione umana 2026-07-22), con versioni minima/taglio dichiarate in §15. Provenienza come nei documenti precedenti: [P] esistente, [R] riparazione, [N] proposta.

==================================================
## 2. Decisione sul sogno (anticipata: governa tutto il resto)
==================================================

**Criterio dato dall'autore umano**: fedeltà alla serie dove la storia ripercorre la serie.

**Fatto di canone [C]**: nella serie il pubblico NON sente il nome sussurrato nel sogno e NON sa che l'ospite è Leland fino al reveal; però VEDE il volto di BOB — uno sconosciuto ferale — fin dalle prime visioni (Sarah). Il motore del giallo televisivo è quindi: *l'aggressore ha un volto noto che non corrisponde a nessun abitante conosciuto — chi di loro lo ospita?*

**Fatto del progetto [P]**: `laura_sogno` già oggi non mostra il nome ("(Laura si avvicina e sussurra un nome all'orecchio di Cooper...)"), e `sarah_visione` esiste.

### Le due versioni a confronto
| | A — volto non identificabile come Leland (fedele) | B — Leland riconoscibile |
|---|---|---|
| Domanda del gioco | chi ha ucciso Laura — e chi ospita il volto? | come si prova ciò che so — e di chi è la colpa? |
| Player sa | il volto di BOB (sconosciuto), non l'ospite | tutto tranne la prova |
| Cooper sa | meno del player (ha dimenticato il nome) | come A |
| Jacques | falsa pista CREDIBILE anche per il player | capro solo per il paese, il player aspetta |
| Suspense | whodunit + "di chi è il corpo che lo porta?" | tensione da attesa della prova |
| Atto 4 | la visione di Sarah RIVEDE lo stesso volto: ricorrenza, non identità | conferma di cosa già noto |
| Interrogatorio | l'affioramento salda volto→ospite (climax conoscitivo) | solo climax morale |
| Rischio | il volto deve pagare (se non torna mai, truffa) | 3 atti di attesa |

**SCELTA: Versione A**, nella forma fedele alla serie: il nome resta non udibile [P, già così]; il volto di BOB entra come *sconosciuto* — appare nella visione di Sarah [P, da precisare nel testo] e nel sogno come presenza ai margini della Stanza Rossa [N: una pagina in `laura_sogno`, sprite `bob` già esistente in redroom]. Nessun NPC del paese ha quel volto: la domanda "chi lo ospita?" è il whodunit. Jacques resta falsa pista piena (non ha quel volto, ma era LÌ — presenza ≠ colpa, proposizione P5). L'affioramento in M10 è il momento in cui il volto trova il suo ospite: paga tre atti di attesa.

==================================================
## 1. Contratto dei verbi
==================================================

Classificazione onesta: **[V] verbo realmente controllato · [D] scelta di dialogo · [A] risposta automatica · [Z] avanzamento pagina · [I] interpretazione interna**.

| Verbo | Classe | Input | Opera su | Info richiesta | Risultato immediato | Stato scritto | Feedback | Fallimento | Retry | Missioni | Costo prod. |
|---|---|---|---|---|---|---|---|---|---|---|---|
| muoversi | [V] | frecce/WASD | griglia | mappa vista | spostamento/bump | posizione (save su porta) | movimento+bump msg | muro/porta gated | sempre | tutte | 0 (esiste) |
| osservare | [I] | nessuno | scena | attenzione | lettura del quadro | nessuno | la scena stessa | non notare | sempre | tutte | 0 |
| esaminare | [V] | Z su oggetto | oggetti/landmark | prossimità | pagine descrittive | done_*, give clue | dialogo+sparkle spento | nessuno | rilettura 'again' | M2, M5 | 0 (esiste) |
| consultare taccuino | [V] | X | indizi/obiettivo/presagi [N] | — | lista+obiettivo | nessuno | menu | nessuno | sempre | tutte | sezione presagi [N: piccola] |
| interrogare | [D→V] | Z + scelta tattica [N] | NPC | conoscere le tattiche | ramo di risposta DIVERSO | flag tattica | risposta nel registro dell'NPC | tattica sbagliata = info parziale | limitato (vedi M6) | M6, M10 | widget scelta |
| confrontare | [V-nuovo] | dal taccuino: accosta 2 voci [N] | testimonianze/indizi | averle entrambe | nota di confronto ("non coincidono su...") | nota nel taccuino | testo di confronto | accostamento muto ("nessun legame visibile") | sempre | M4, M9 | parte del sistema presentazione |
| presentare | [V-nuovo] | in dialogo: scegli CONCLUSIONE poi prove [N] | proposizioni (§3) | grafo + prove in mano | valutazione del NESSO | proposizione sostenuta/aperta | risposta nel merito (§4) | nesso insufficiente → fail-forward | sì, con escalation di precisione | M4, M9, (eco in M10) | sistema principale |
| registrare | [V] | UNA azione in M10 (widget) | il nastro | il momento (§10) | nastro on/off | flag S3 | spia + click | nessuno (è una scelta, non un test) | no (irreversibile, dichiarato) | M10 | widget |
| scegliere stance | [D] | widget A/B(/C) | S1-S4 | contesto della scena | ramo | flag stance | conseguenza differita leggibile | nessuno | no | S1-S4 | widget |
| interpretare | [I→D] | S4: scelta finale | il terzo enigma | averlo annotato | l'ultima riga a Diane | flag interpretazione | il monologo | nessuno | no | Loggia | contenuto |

**Onestà**: "pressione" NON è un verbo finché non è la tattica scelta in M6/M10 (widget) con risposte diverse; "ricostruzione" al vagone = esaminare×3 + UN confronto + UNA presentazione (azioni concrete, §7); "intuizione" = annotazione automatica in presagi + verifica successiva (mai un verbo attivo del player). M1/M3/M7 restano prevalentemente [Z]+[V-muoversi]: dichiarato accettabile per un gioco di ~90-110', NON chiamato strategia.

==================================================
## 3. Grafo delle proposizioni
==================================================

### I 9 indizi (schede)
Formato: osservazione letterale / origine / affidabilità / chi lo sa / supporta / contraddice / contesto necessario / letture alternative / uso procedurale / uso intuitivo / rischio incomprensione.

1. **diario** — "pagine pubbliche serene, pagine cifrate spaventate" / Truman / alta (documento) / Cooper+Truman / P1, contesto per P8 / — / leggerlo DOPO il paese / "adolescente drammatica" / sì (documento) / il "lui" senza nome / basso.
2. **cuore** (metà) — "metà di un pendaglio spezzato" / camera di Laura / alta / Cooper / P1, P2 / — / — / rottura d'amicizia, non pegno / sì / — / medio (serve James per capirlo).
3. **lettera_r** — "una R minuscola sotto l'unghia" [P: firma dell'aggressore] / camera†(scena) / alta / Cooper+Truman / P8 / P5 (non è la grafia di Jacques) / la seconda lettera per capire la serie / "iniziale di un nome nuovo" (falsa lettura DESIDERATA, vedi P8) / sì / sì / alto se il ponte testuale manca → il diario lo dà (R1 [P: già riparato]).
4. **nome_sussurrato** — "(un nome, perduto al risveglio)" / sogno / NULLA proceduralmente / il player sa che ESISTE, non cosa dice / P4 (esiste un nome) / — / — / — / no / sì (orienta: il nome è UNO, pronunciabile) / voce di menu esplicita: "un nome dimenticato al risveglio" [R].
5. **poesia_fuoco** — "FUOCO CAMMINA CON ME, versi di Gerard" / ospedale / media (testimone alterato) / Cooper / P3, P4 / — / il vagone per capirla / delirio / debole / sì / medio.
6. **cuore_intero** — "l'altra metà: James la ricompone e parla dei luoghi" / diner, post-sogno / alta (testimonianza+oggetto) / Cooper / P2 / — / la metà dalla camera / — / sì / — / basso.
7. **biglietto_fuoco** — "biglietto semi-sepolto nel mucchio, stessa mano della scritta" / vagone / alta / Cooper / P3 / — / la poesia per il rimando / — / sì / — / basso.
8. **anello** — "posato in vista, non perso" / vagone / alta come oggetto, AMBIGUA come significato / Cooper(+Truman se S1-istituzionale) / P3 (scena preparata), P5 (Jacques non l'avrebbe lasciato) / P-teoria "delitto d'impeto" / — / pegno d'amore di Jacques (lettura errata ragionevole, §7) / sì / sì (il suo significato "non esaurito" = S1) / medio, voluto.
9. **lettera_o** — "una O, stessa mano della R" / lago (Maddy) / alta / Cooper+Truman / P7, P8 / — / la R / — / sì / — / basso.

Testimonianze non-indizio nel grafo: **ronette_bob** ("BOB!") → P4; **testimonianza James** (i luoghi a est) → P2; **bugia Missoula** (Leland colloca sé altrove, smentibile [P]) → P6; **sarah_visione** (il volto sconosciuto in casa) → P7 SOLO intuitiva; **enigmi** → presagi (mai prove).

### Le proposizioni (10)
Formato: supporto minimo / forte / confutazioni / dove formulabile / azione che la rende giocabile / cosa permette.

- **P1 — Laura conduceva una vita doppia.** Min: diario. Forte: diario+cuore. Conf: —. Da: M2. Azione: esaminare camera + leggere diario. Permette: dare senso al bosco (R1) e a James.
- **P2 — Laura incontrava qualcuno fuori dal centro, a est.** Min: cuore_intero. Forte: +testimonianza James+poesia. Conf: —. Da: M4. Azione: PRESENTARE a Truman (prima presentazione). Permette: apertura est (atto3).
- **P3 — Il vagone è la scena del delitto, ed era PREPARATA.** Min: biglietto. Forte: biglietto+anello+mucchio. Conf: la teoria dell'impeto. Da: M5. Azione: esaminare×3 + confronto biglietto↔poesia. Permette: incastrare Jacques sulla PRESENZA.
- **P4 — L'aggressore ha un nome: "BOB".** Min: ronette_bob. Forte: +poesia+nome_sussurrato(esistenza). Conf: "delirio di Ronette". Da: M4. Azione: confrontare Ronette↔Gerard. Permette: la domanda giusta a Jacques ("chi altro c'era?").
- **P5 — Jacques era presente ma non è (necessariamente) l'assassino.** Min: sua ammissione (tattica giusta in M6). Forte: +anello ("non l'avrebbe lasciato")+lettera_r (grafia). Conf: la sua fuga. Da: M6. Azione: interrogatorio a tattiche. Permette: NON chiudere il caso su Jacques — e sentire il colpo quando muore da testimone.
- **P6 — Leland ha mentito su Missoula.** Min: la dichiarazione + il registro che la smentisce [P]. Forte: +comportamento (leland_dove). Conf: "confusione da lutto" (obiezione di Truman, VIVA fino a M9). Da: M8-dopo/M9. Azione: confrontare dichiarazione↔registro nel taccuino. Permette: la convocazione (M9).
- **P7 — La casa Palmer è dentro la ripetizione.** Min: lettera_o trovata su Maddy (ospite di casa Palmer). Forte: +sarah_visione (SOLO come sospetto)+leland_dopo. Conf: "il dolore spiega tutto". Da: M8. Azione: presentazione in M9 (parte investigativa). Permette: orientare la convocazione.
- **P8 — Le lettere compongono un nome che il diario conosce.** Min: R+O. Forte: +ponte del diario (il "lui" chiamato ROBERT [P: riparazione R1 2026-07-21], diminutivo BOB). Conf: "iniziali di vittime" (falsa lettura). Da: M8-dopo. Azione: confronto lettere↔pagina del diario. Permette: saldare P4 a P7. *Nessuna somiglianza di lettere senza ponte testuale: il ponte È la pagina del diario* [R, correzione precedente mantenuta].
- **P9 — Jacques è stato eliminato: qualcuno protegge il segreto.** Min: la morte in custodia. Forte: +accesso all'ospedale (chiunque del paese: NON restringe a Leland — onestà). Conf: —. Da: M6-dopo. Azione: subita, poi formulata al taccuino. Permette: capire che la minaccia è locale e attiva.
- **P10 — Le prove materiali non spiegano BOB.** Min: la confessione (forma). Forte: +tutta la serie di visioni verificate. Conf: "Leland simula". Da: M10. Azione: il metodo scelto + il registratore. Permette: la Loggia come necessità, non come premio. (= R7 in forma di proposizione.)

==================================================
## 4. Presentazione delle inferenze
==================================================

Meccanica [N, sistema principale]: nel dialogo di presentazione il player (1) sceglie la **conclusione** da un elenco di proposizioni *formulabili* (quelle il cui supporto minimo è in mano), (2) allega 1-3 **prove**, (3) riceve risposta **nel merito del nesso**.

- **M4 (a Truman, per l'est)** — conclusioni disponibili: P1 (già acquisita: Truman annuisce, "questo lo sappiamo"), P2 (corretta per procedere), P4 (sostenibile: apre una nota, non la porta). Prove rilevanti per P2: cuore_intero, testimonianza James, poesia. Insufficienti: lettera_r ("una firma non è una geografia"), nome_sussurrato ("un nome che non abbiamo"). Contraddittorie: nessuna in M4. Risposte di Truman: SPECIFICHE per nesso mancante — es. P2 con solo poesia: "Il fuoco cammina, va bene. Ma CHI la portava fuori dal paese? Serve una persona, non un verso." → il taccuino aggiorna la *domanda investigativa*: "Chi conosceva i luoghi di Laura fuori dal centro?" (punta a James senza nominarlo).
- **M9 (a Truman, per la convocazione)** — conclusioni: P6 (procedurale, NECESSARIA), P7 (investigativa, rafforza), P8 (investigativa). Prove per P6: la dichiarazione + il registro. Truman OBIETTA anche al nesso giusto ("il lutto confonde le date") e cede solo su P6+P7 insieme: la contraddizione verificabile PIÙ la ricorrenza sulla casa. Una visione allegata come prova: "Cooper. Questo non entra in un fascicolo. E tu lo sai." (risposta specifica, il sospetto resta annotato).
- **Fail-forward senza contatore** [R: clues6 ELIMINATO come sblocco]: 1ª presentazione incoerente → risposta nel merito + domanda al taccuino; 2ª → Truman restringe ("Torniamo a chi VEDEVA Laura fuori"); 3ª+ → domanda ancora più precisa, MAI la soluzione, MAI apertura d'ufficio. Anti-brute-force: le prove si allegano a UNA conclusione dichiarata (niente coppie cieche), le risposte insegnano il criterio (rilevanza), e ripresentare la stessa coppia respinta dà una risposta di memoria ("Me l'hai già mostrato. Non è cambiato."). Progresso = il nesso giusto, non un numero.
- Stato scritto: proposizione → `sostenuta` (con quali prove) — riletta da M10 e dalla Loggia.

==================================================
## 5. Conoscenza e responsabilità
==================================================

Matrice per atto (S=sa, ~=sospetta/crede, X=non può sapere, !=interpreta male). Fatti chiave per riga:

| Fatto | Player | Cooper | Truman | Leland | Sarah | BOB (forza) | Sistema |
|---|---|---|---|---|---|---|---|
| A1: Laura aveva una vita doppia | S (M2) | S | ~ (non vuole) | S | ~! ("fase") | S | S |
| A1: il volto dello sconosciuto | S (sogno §2) | X (dimentica) | X | S | S (visione) | S | S |
| A2: "BOB" è un nome | S | S | ~ ("delirio?") | S | ~ | S | S |
| A3: il vagone era preparato | S/~ (P3) | S | ~ | S | X | S | S |
| A3: Jacques non è l'assassino | ~ (P5) | ~ | ! (vorrebbe chiudere) | S | X | S | S |
| A3: chi ha ucciso Jacques | X | X | X | S | X | S | S |
| A4: Maddy è in pericolo | ~ (enigma 2: qualcuno, non chi) | ~ | X | S | ~ (sente la casa) | S | S |
| A4: la casa è il centro | ~ (P7) | ~ | ! ("il dolore") | S | S (non creduta) | S | S |
| A5: gli atti sono di mano di Leland | S (confessione) | S | S | S/~ (memoria rotta) | X (a questo punto) | S | S |
| A5: dove finisce Leland e inizia BOB | X | X (interpreta) | X | X | X | X | **X — mai scritto** |

Responsabilità (distinzioni obbligatorie): *causale*: BOB/Leland per gli omicidi; NESSUNA del player per Maddy [R: colpa tagliata]. *Professionale*: Cooper per la protezione dei testimoni (Jacques in custodia: fallimento professionale VERO, del personaggio — non del player, che non aveva l'azione "proteggi"). *Complicità*: il decoro del paese (nessun singolo). *Impotenza*: player e Cooper in M8 — progettata, dichiarata. *Colpa percepita*: Cooper la esprime nel monologo; il gioco NON la certifica. *Colpa effettiva*: solo dove c'era alternativa informata — cioè, per il player, nelle stance S1-S4 (costi, non colpe morali).

==================================================
## 6. Missione M4 — I frammenti (8 beat giocabili)
==================================================

Ogni beat: luogo / obiettivo minuto / azione / risposta / info / stato / domanda dopo / variante d'ordine. (Ordine ospedale-diner-hotel libero [P]: le varianti sono reali.)

1. **Sheriff — il racconto del sogno.** Obiettivo: "Riferisci il sogno". Azione: dialogo truman_a2 [P] + **S2** (stance: tutto il sogno / solo i fatti). Risposta: Truman prende nota O si irrigidisce. Stato: flag S2. Domanda: "Ronette è sveglia?". Variante: nessuna (è l'apertura).
2. **Ospedale — la domanda a Ronette [interrogare, prima forma].** Obiettivo: "Chiedi a Ronette del vagone". Azione: il player SCEGLIE la domanda (widget, 3 opzioni: del luogo / dell'uomo / di Laura). Risposta: Ronette non parla — reagisce col corpo: alla domanda sull'uomo, il tracciato si impenna e lei grida "BOB!" [P]; alle altre, si volta verso la finestra / stringe il lenzuolo (info parziale, ripetibile UNA volta con costo: l'infermiera chiude la visita). Info: P4-min (solo con la domanda giusta al primo o secondo colpo). Stato: ronette_bob + nota "reagisce all'UOMO, non al luogo". Domanda: "chi è BOB?". Variante: se il player arriva qui DOPO Gerard, la scelta è informata dalla poesia (il gioco non lo dice: emerge).
3. **Ospedale — Gerard.** Obiettivo: "Il vicino di stanza". Azione: dialogo [P]; la poesia entra nel taccuino. Momento umano: Gerard chiede a Cooper di sistemare il cuscino — nessun indizio, una pagina [R: richiesto]. Info: poesia_fuoco. Domanda: "il fuoco cammina DOVE?".
4. **Diner — James e il cuore [confrontare].** Obiettivo: "Il ragazzo del diner" (solo post-sogno [P]). Azione: dialogo; il cuore si ricompone; NUOVO: il taccuino propone il confronto cuore↔cuore_intero → nota "i luoghi a est". Momento umano: James non consegna un indizio — restituisce una promessa non mantenuta (il testo tratta il suo lutto come lutto, la prova è un sottoprodotto). Info: cuore_intero, testimonianza-James. Domanda: "quanto a est?".
5. **Diner — Norma/Log Lady (facoltativi [P]).** Il fondo del paese continua; la Log Lady lascia il primo enigma di gufi (filo, non sottotrama — §13).
6. **Hotel — la 315.** Obiettivo: "La stanza del risveglio". Azione: esaminare lo specchio [P: specchio315]. Info: nessuna nuova — RILETTURA (il luogo del risveglio visto da svegli). Domanda: "perché ho sognato QUI?". Variante: chi viene qui prima del diner trova la stanza "muta" (paga l'ordine, senza punizione).
7. **Sheriff — confronto Ronette↔Gerard [confrontare].** Obiettivo: "Metti in fila i frammenti". Azione: accostare nel taccuino ronette_bob↔poesia → nota "il nome e il fuoco stanno nella stessa stanza". Stato: P4 formulabile.
8. **Sheriff — la presentazione [presentare].** Obiettivo: "Mostra a Truman cosa punta a est". Azione: conclusione+prove (§4). Risposta: nel merito; fail-forward. Svolta: atto3. Stato: P2 sostenuta. Domanda (uscita): "cosa c'è nel vagone?".

Quattro gesti DIVERSI: scegliere la domanda (B2) ≠ ascoltare (B3) ≠ confrontare (B4/B7) ≠ presentare (B8). Nessuno è solo "premi Z" tranne B3/B5-6, dichiarati testura.

==================================================
## 7. Missioni M5-M6 — La scena e la falsa soluzione
==================================================

### M5 — Il vagone (leggere la scena)
**Tre osservazioni** (esaminare): (1) il mucchio di terra con il biglietto semi-sepolto — *sepolto in fretta o messo in scena?*; (2) la scritta "FUOCO CAMMINA CON ME" — stessa mano della poesia (confronto proposto dal taccuino); (3) l'anello — POSATO in vista, non caduto. **Due collegamenti**: biglietto↔poesia (stessa mano → P3-min); anello↔scena ("un oggetto di valore che nessuno ha preso": il delitto non è rapina). **Interpretazione errata ma ragionevole** (il gioco la OFFRE come conclusione presentabile): *"delitto d'impeto di Jacques: il pegno d'amore lasciato nel panico"* — regge finché non si nota che l'anello è posato, non perso. **Inferenza necessaria**: la scena è PREPARATA (P3) → chi l'ha preparata voleva che si trovasse QUALCOSA. **Azione materiale del player**: 3 esami + 1 confronto + 1 presentazione (a Truman via radio/al ritorno: P3 o la teoria dell'impeto — presentare la teoria errata è PERMESSO e produce M6 con una convinzione sbagliata da smontare: fail-forward drammatico, non punitivo). **S1** qui: la custodia dell'anello [R riformulata]: (a) *istituzionale* — registrato e depositato da Truman; (b) *investigativa documentata* — Cooper lo fotografa, firma il trasferimento e lo tiene come "oggetto non classificabile"; Truman contesta a verbale (costo relazionale immediato, una pagina). Mai in tasca di nascosto.

### M6 — Jacques (tre tattiche [interrogare, forma piena])
| Tattica | Intenzione | Risposta di Jacques | Info ottenuta | Rischio | Giurisdizione |
|---|---|---|---|---|---|
| **Prova** (biglietto sul tavolo) | incastrarlo sulla presenza | ammette il vagone, nega il resto, chiede un avvocato | P5-min + P3 confermata | si chiude presto: NIENTE sul terzo uomo | pulita |
| **Pressione** (l'arresto prima, le domande dopo) | spaventarlo | sbraita, offre nomi a caso, UNO vero | il canale del contrabbando (colore) + P5 debole | info inquinata (quale nome è vero?) | al limite (Truman lo dice) |
| **Falsa sicurezza** (da giocatore a giocatore, il tavolo da carte) | farlo parlare da solo | si vanta, si contraddice, nomina "il tizio che pagava in fiammiferi" | P5-forte + l'aggancio a P4 (il fuoco) | Cooper deve reggere la parte: se il player cambia tattica a metà, Jacques si chiude | grigia |
**Cosa cambia dopo la sua morte** [R: distrugge una risorsa COSTRUITA]: muore *il canale che la tua tattica aveva aperto* — chi aveva ottenuto falsa-sicurezza perde un filo vivo (il "tizio dei fiammiferi" resta per sempre mezzo nome); chi aveva la prova perde il teste formale; chi aveva pressato scopre che il nome vero era vero (e ora è invendicabile). Il taccuino conserva la differenza: P9 si formula con il RIMPIANTO specifico della tua tattica.

==================================================
## 8. Missione M8 — Tragedia fissa, conseguenze aperte
==================================================

**Fisso**: la morte di Maddy, il luogo del ritrovamento (il lago [P]), l'autore. **Mai un obiettivo "salva Maddy"** [R]. Obiettivo mostrato: "Il secondo enigma parla di stanotte. Decidi dove stare."

**Ciò che il player influenza (4 leve)**:
1. **Chi avvertire prima del Roadhouse** (widget): Sarah (un vice va a casa Palmer: Sarah non è sola quando accade — il suo Atto 5 cambia registro), Maddy stessa (la trova al diner: la promessa "domattina ti accompagno alla corriera" — è QUESTA la promessa che resterà inevasa), o nessuno (nessun costo aggiuntivo, nessuna presenza).
2. **Dove correre dopo gigante2** (widget: casa Palmer / il lago / il diner): determina CHI trova Maddy (Cooper stesso al lago; il vice se il player va a casa; Sarah — il peggio — se nessuno è stato mandato e il player sceglie il diner) e quali tracce si preservano (arrivare per primi al lago conserva la lettera_o *in situ*: P7 si presenta più forte in M9; arrivare tardi = la lettera consegnata da altri, catena di custodia più debole — una obiezione in più di Truman).
3. **Sarah**: sola o accompagnata quando la notizia arriva (deriva dalla leva 1).
4. **La promessa spezzata**: quale ultima parola il player ha scambiato con Maddy (dal dialogo maddy_a4 esteso di UNA pagina con scelta) — torna, identica, nel monologo del lago.

**Prevedibile**: "di nuovo" = un'altra ragazza vicina a Laura (il gioco lo rende inferibile: enigma 2 + la visione di Sarah). **Non prevedibile**: quando e dove. **Il player causa**: la distribuzione dei costi. **Subisce**: il fatto. **Responsabilità**: nessuna sul fatto; professionale-condivisa (di Cooper, narrata) sulla protezione; del player SOLO la distribuzione (chi c'era, cosa si è preservato). **Emozione ipotizzata**: impotenza e lutto — MAI colpa indotta dal testo: il monologo dice "non potevo essere in due posti", non "avrei dovuto".

==================================================
## 9. Missione M9 — Sospetto e procedura
==================================================

**Sospetto investigativo** (basta a Cooper): sarah_visione, i gufi, il comportamento (leland_dove), P8. **Base procedurale** (serve a Truman): P6 — la dichiarazione su Missoula contro il registro (contraddizione verificabile [P]) + accesso/opportunità (casa Palmer, la notte del lago). **Ciò che sosterrebbe una perquisizione**: P6+P7 con la lettera_o in catena pulita (leva 2 di M8 paga qui). **Non utilizzabile formalmente**: visioni, sogni, il volto §2 (il player può PROVARE ad allegarli: risposta specifica di Truman, §4).

**Sequenza esatta**: proposizione presentata (P6) → obiezione di Truman ("il lutto confonde le date" — VUOLE sbagliarsi) → risposta del player (allegare il registro + P7) → risultato: **convocazione come persona informata sui fatti** [R: la parola "mandato" eliminata dal gioco] → perché Leland viene: è il notabile collaborativo — rifiutare romperebbe il decoro che lo protegge; viene da avvocato, con il nodo della cravatta perfetto. Obiettivo mostrato: "Porta a Truman una contraddizione che regga" → poi "Leland è alla centrale. Decidete come parlargli."

==================================================
## 10. Missione M10 — L'interrogatorio (12 beat)
==================================================

Beat 1-3 (comuni): ingresso e caffè [dalla Direzione Artistica, con revisioni] / soglia / nastro avviato — **prima riga di Cooper al nastro: l'IPOTESI** [R]: «Diane, ipotesi da verificare: chi ha preparato quella scena voleva essere trovato. Non so ancora se questo valga anche per le parole che seguiranno.» (ipotesi, non certezza).

**Beat 4 — la scelta del metodo** (widget A/B/C — con Truman, PRIMA di entrare): differenze REALI:
| | Probatorio | Personale | Intuitivo |
|---|---|---|---|
| Domande disponibili | date, registro, lettere | Laura, Sarah, la casa | il sogno, ROBERT, il vagone "come lo ricorda" |
| Ordine prove | Missoula→lettere→vagone | foto→diario→lettere | poesia→anello→nome |
| Tattiche di Leland | l'avvocato: preciso, inutile | il padre: cede presto, ricorda male | lo specchio: risponde a domande non fatte |
| Verificabile a nastro | massimo | medio | minimo |
| Truman | verbalizza fitto | teme che Cooper stia oltrepassando | capisce meno di tutti (posa la penna PRIMA) |
| Affioramento | tardi (beat 9) | medio (beat 8) | presto (beat 7), "quasi invitato" |
| Costo | l'uomo emerge solo alla fine (la pietà arriva tardi) | il verbale è fragile (eco in epilogo: la contea storce) | Truman esce dalla stanza una volta (costo relazionale) |
(Se in scrittura Personale e Intuitivo convergono in sinonimi, si FONDONO — criterio dichiarato [R].)

Beat 5-6: le domande del metodo (2 scelte di domanda dentro il ramo — [interrogare]). Beat 7-9: l'affioramento (al momento del SUO metodo): DUE segnali [R: bob accelerato da seduto + registro linguistico]; il volto di §2 trova l'ospite — il taccuino salda: "lo sconosciuto del sogno" → la voce che parla ora. Beat 9: **i fatti materiali entrano a nastro PRIMA della scelta** [R]: vagone, accesso, lettere, gli atti — elenco verificabile completo.
**Beat 10 — S3, il registratore** [R: collocazione esatta]: la confessione VIRA (BOB, la memoria a pezzi, la domanda di perdono — materiale non necessario a provare gli atti). SOLO ORA il widget: *lasciar girare / fermare*. Prima della scelta il gioco mostra (una riga di stato, diegetica: Truman rilegge il verbale) che i fatti sono già dentro. Dopo: acceso → il materiale metafisico è documentato (la contea lo leggerà come delirio — conseguenza in epilogo; se l'ipotesi del beat 3 è vera, è ciò che BOB voleva: MAI confermato); spento → Truman DECIDE se la sua memoria diventerà testimonianza (la sua pagina cambia; la relazione ne porta il segno fino alla Loggia).
Beat 11 — la cella: la domanda del perdono resta senza risposta; il beat successivo appartiene a Laura (il monologo la nomina, non il dolore di lui) [R]. Beat 12 — la morte, il radiatore, "Diane" col rituale visibile [R]; chiusura di Cooper (per metodo, sempre INTERPRETAZIONE): «So ciò che ha fatto. Non so più dire dove finisse la sua volontà. Una cosa non cancella l'altra.» [R: formula corretta].

==================================================
## 11. Rivelazione R7 — Responsabilità fratturata
==================================================

Modello precedente: "esiste un colpevole unitario che il fascicolo può contenere". Nuovo modello: gli atti sono di Leland; la confessione manifesta una discontinuità che il gioco non sa (e rifiuta di) quantificare. Indizi retroattivi: il volto-sconosciuto (§2), "sono io eppure non sono io" (laura_sogno [P]), il doppio registro del diario, leland_a4/dove/dopo. Nuova evidenza: la STRUTTURA della confessione (alternanza verificabile/impossibile) + il cambiamento linguistico. Azione del player: il metodo + S3. Reinterpretato: tutte le scene Palmer, la compostezza, il lutto. Resta irrisolto: la ripartizione; la natura di BOB. Nuovo obiettivo: la Loggia — non per un altro colpevole, ma per ciò che il verbale non classifica. **Rischio di assoluzione automatica** — guardie: i fatti restano elencati a nastro PRIMA di ogni pietà (beat 9); la frase di Cooper è interpretazione; Laura e Maddy restano presenti (la foto mai rimossa, la promessa inevasa citata nel monologo del lago, l'ultima immagine del gioco è di Laura).

==================================================
## 12. Finale giocabile — la Loggia (8 beat)
==================================================

Verbi: solo muoversi, parlare, interpretare. Nessun quiz del taccuino [R].

1. **Glastonbury Grove** (woods): obiettivo "Torna dove il caso non si chiude"; movimento: il varco [P]; lo stato speso: la mappa già percorsa — stavolta nessuna transenna (le porte del mondo ordinario hanno finito il loro lavoro).
2. **La soglia**: le tende; interazione: entrare È la scelta (nessun prompt).
3. **Il corridoio**: la geografia del sogno percorsa DA SVEGLI (rilettura spaziale, nessun testo).
4. **Il Nano**: parla nel registro del TUO metodo (probatorio: ti elenca ciò che il nastro non ha potuto dire; personale: ti mostra la sedia vuota di famiglia; intuitivo: quasi diretto, "tu ascolti già così") — lo stato di M10 speso come REGISTRO, non come esame.
5. **L'anello**: se custodia istituzionale: il Nano apre la mano vuota — "l'avete messo dove le cose si dimenticano con cura" (la scelta pesa, nessuna punizione); se custodia documentata: l'anello è sul tavolino — "l'hai trattato come ciò che non era ancora finito" (e Cooper lo lascia lì: il trasferimento firmato si chiude qui). Cambio d'interpretazione, non di esito.
6. **BOB**: se S3-acceso: recita frammenti del TUO verbale a ritroso (il documento esiste anche qui — che sia trofeo o gabbia resta ambiguo); se S3-spento: "manca la mia voce, agente. L'hai tenuta tu?" (il non-registrato come peso personale). La domanda di BOB non riceve risposta del gioco.
7. **Laura**: "Ti rivedrò fra venticinque anni" [C]. L'ultima immagine è SUA [R]: il gioco inquadra lei, non la reazione di Cooper. Qui **S4**: il terzo enigma torna e il player sceglie la lettura (promessa / minaccia / appuntamento) → determina SOLO l'ultima riga a Diane.
8. **Il ritorno**: town all'alba — epilogo (§ scope): dialoghi accorciati, il lago con una riga nuova, la stazione di T4. Cosa è fisso: attraversamento, incontri, la frase di Laura. Cosa cambia: registro del Nano (metodo), beat 5 (S1), beat 6 (S3), ultima riga (S4), il vestito dell'epilogo (S2/M8 leve). Cosa resta ambiguo: BOB, la ripartizione, l'enigma 3.

==================================================
## 13. Personaggi assenti e fili narrativi
==================================================

**Laura — presenza postuma** (scheda): desiderio ricostruibile: essere due persone e sopravvivere a entrambe; azione pre-gioco: ha NASCOSTO il diario vero e spezzato il cuore — due atti deliberati di custodia (agency prima del gioco); versioni per persona: la figlia (Sarah), la santa del paese (Norma), la ragazza del cuore (James), quella che aveva paura (diario); interpretazioni che la riducono: "l'angelo del paese" (il necrologio), "la vittima perfetta" (la procedura); tracce nei luoghi: camera, diner (la tazza che Norma non riassegna), il vagone; rapporto con Cooper: lo raggiunge solo nel sogno — l'unico teste che parla per enigmi; con Leland/BOB: il gioco NON la racconta come segreto svelabile — le pagine cifrate del diario restano cifrate anche alla fine [N: guardia contro "parlare per Laura"]; payoff non riducibile alla morte: i suoi DUE atti di custodia sono ciò che rende il caso risolvibile — l'indagine riesce perché lei ha agito, non perché ha sofferto. Classe: **presenza postuma**.
**Maddy** (scheda): obiettivo proprio: NON restare (è venuta per il funerale, vuole ripartire — la corriera di M8-leva-1); rapporto specifico: per Sarah è un'àncora, per Leland uno specchio insopportabile; decisione offscreen: resta UN giorno in più per Sarah (detta in maddy_a4 esteso) — la sua scelta, non una funzione; contatto con Cooper: la pagina della promessa (M8); segno non-Laura: odia essere scambiata per lei (una battuta [P: "somiglio a mia cugina" già nel canone]) — il gioco le dà UN desiderio che Laura non aveva: andarsene. Classe: **arco breve con agency**.
**Ronette** (scheda): soggetto, non corpo: la sua unica parola è una SCELTA (grida il nome per avvertire, non per delirio — la lettura la offre l'infermiera: "urla solo quando qualcuno le entra in stanza alle spalle"); il verbale di M10 la cita [R precedente]; payoff: nell'epilogo è sveglia — UNA riga, nessuna intervista: sopravvivere basta. Classe: **catena testimoniale con dignità di soggetto**.
**Sarah** (scheda): desiderio: essere creduta; azione indipendente: chiama la centrale PRIMA che il player scelga (M8: la sua telefonata esiste in ogni ramo — il vice risponde o no a seconda della leva 1); interpretata male da tutti ("il dolore"); payoff: in T4/epilogo è l'unica che NON chiede a Cooper "chi è stato" — sapeva. Classe: **testimone tragica** (filo, non sottotrama).

Riclassificazione completa: Audrey = **sottotrama** (unica); Cooper–Truman = **arco relazionale**; Log Lady/gufi = **filo di mistero**; James/Donna = **arco di lutto**; Ronette = catena testimoniale; Laura = presenza postuma; Maddy = arco breve. Nessun filo viene gonfiato [R].

==================================================
## 14. Integrazione con i luoghi (M4, M5, M8, M9, M10)
==================================================

Max per luogo/atto: 1 oggetto risemantizzato, 1 suono dominante, 1 cambio di attività [R].

- **M4 — ospedale**: funzione: riparare i vivi; attività indipendente: il giro delle flebo (l'infermiera passa a orari, con o senza Cooper); la disposizione rende possibile: la domanda a Ronette dalla SOGLIA (il letto in fondo: avvicinarsi è una scelta visibile); sensoriale dominante: il monitor (ritmo); ambiente dice: chi è piantonato e chi no; dialogo dice: la poesia; conseguenza visibile dopo: il piantone raddoppiato (dopo M6!); dettaglio stabile che cambia: la porta di Jacques — vuota in M4, sigillata dopo.
- **M5 — vagone**: funzione ordinaria: NESSUNA (è un relitto: l'unico luogo senza routine — e questo È il suo significato); attività: i binari vivono (un merci passa, non si ferma); disposizione: i tre reperti a triangolo — l'ordine di lettura lo sceglie il player; suono: il metallo che si assesta; ambiente: TUTTA l'informazione (il dialogo qui solo conferma); conseguenza: il vagone resta sigillato con il nastro della centrale (visibile da fuori nei ritorni); risemantizzato: il mucchio di terra (da "terra" a "fretta di qualcuno").
- **M8 — town di notte**: funzione: le strade di sempre; attività: il Roadhouse suona COMUNQUE (la banda non sa); disposizione: le tre destinazioni della leva 2 equidistanti dalla piazza — la scelta è spaziale, si FA correndo; suono: la musica che sfuma dietro; ambiente: le finestre accese di casa Palmer viste passando (informazione muta, qualunque leva); conseguenza: il lago recintato; risemantizzato: il lago (da landmark a ferita — già in §12 doc precedente).
- **M9 — sheriff**: attività indipendente: il centralino (il paese continua a perdere cani); disposizione: la bacheca DIETRO la spalla di Truman durante la presentazione (il volantino delle scomparse guarda lui); suono: la macchina da scrivere di Lucy che si ferma quando si nomina Leland (UNA volta); conseguenza: la zona nord liberata (T3 corretto); risemantizzato: la panca d'attesa (dove siederà Leland).
- **M10 — sheriff, stanza nord**: come da Direzione Artistica REVISIONATA (gradiente, lampada, spia; percolatore a processo continuo reale); conseguenza visibile: la sedia non rimessa a posto (T4, unico simbolo superstite).

==================================================
## 15. Scope reale (per missione/sistema, con 3 versioni)
==================================================

| Pezzo | Pagine dlg | Scelte | Flag | Rami | UI | Test | Rischio | Versione minima | Raccomandata | Taglio se sfora |
|---|---|---|---|---|---|---|---|---|---|---|
| Widget scelta A/B/C | — | — | — | — | **nuova** (1) | smoke: input scripted | medio (input layer) | 2 opzioni fisse | 2-3 opzioni, riuso ovunque | — (fondamento: senza, cade tutto) |
| Presentazione (concl.+prove) | ~25 | 2 snodi | ~6 | risposta per nesso (~10 varianti) | **nuova** (lista da taccuino) | walkthrough: nuovi PREREQ | alto (sistema più grosso) | 1 conclusione, 2 prove, 3 risposte | conclusioni multiple + fail-forward a 3 livelli | le risposte di memoria anti-brute-force |
| Grafo proposizioni | (dati) | — | 10 prop-flag | — | riuso taccuino | validatore nuovo (node) | basso (è data) | 6 proposizioni | 10 | P9-P10 come testo semplice |
| Presagi nel taccuino | ~4 | — | 3 | — | **sezione testuale** nel menu X esistente [R: non UI autonoma] | smoke count | basso | solo testo negli indizi | sezione dedicata | fondere negli indizi |
| M4 riprogettata | ~20 | 2 (domanda Ronette, S2) | ~5 | ordine libero (già [P]) | riuso | smoke: nodi nuovi fuori percorso o fix length-agnostic | medio (pattern smoke noto) | senza S2 | come §6 | B6 (hotel muto) |
| M5-M6 | ~22 | 2 (teoria, S1) + 3 tattiche | ~7 | 3 rami Jacques | riuso widget | walkthrough varianti | medio | 2 tattiche | 3 | la teoria errata presentabile |
| M8 leve | ~15 | 2 widget + 1 pagina promessa | ~6 | 3×3 combinazioni (testo, non logica) | riuso | walkthrough: tutte le leve | medio | 2 leve (avviso, corsa) | 4 | la variante "Sarah trova Maddy" |
| M9 | ~10 | 1 snodo | ~3 | obiezioni (~4) | riuso presentazione | walkthrough | basso | — | come §9 | — |
| M10 metodi+S3 | ~45 (3 rami) | 2 widget + 2 domande/ramo | ~8 | 3 metodi × 2 nastro | riuso | walkthrough: 6 percorsi | **alto** (il più grosso) | 2 metodi | 3 (fondere se sinonimi) | intuitivo (fuso nel personale) |
| Loggia beat | ~18 | 1 (S4) | ~4 | 2(S1)×2(S3)×3(metodo) solo-testo | riuso | walkthrough end | medio | senza beat 4 variante | come §12 | varianti del Nano ridotte a 2 |
| Epilogo | ~12 | — | ~2 | letture di M8/S2/S3 | riuso | smoke | basso | 4 righe | come T4 | interviste extra |
| **Totale stimato** | **~190 pagine** (~570-760 righe: il doppio della stima precedente, [R] onestà) | 12 | ~44 | — | 2 UI nuove + 1 sezione | 3 suite da aggiornare + 1 validatore | — | | | |

Guardia nota [P]: smoke hardcoda le pressioni per nodo → o nodi nuovi fuori dal suo percorso, o fix length-agnostic PRIMA di scrivere contenuti. Durata dichiarata: **90-110 min primo playthrough, 70-85 replay** [R].

==================================================
## 16. Test di comprensione
==================================================

| Missione | Domanda aperta | Comportamento osservato | Comprensione prevista | Alternativa accettabile | Errore = problema di design | Soglia di revisione |
|---|---|---|---|---|---|---|
| M4 | "Cosa punta a est, secondo te, e perché?" | quale conclusione presenta per prima; quanti fail-forward | P2 con James | P4 prima, P2 poi | presenta a caso finché passa | >30% brute-force → risposte di memoria insufficienti |
| M8 | "Potevi salvare Maddy? Di cosa ti senti responsabile?" | quali leve usa; se riprova il run | "no; di chi c'era e cosa si è salvato" | "no; di niente" | "sì, ho sbagliato posto" → il testo induce colpa | >20% risponde "colpa mia" → riscrivere obiettivo/monologo |
| M10 | "Chi ha ucciso Laura?" (aperta, DOPO) | metodo scelto; momento dello stop al nastro | risposta fratturata ("Leland, e...") | "Leland" secco | "BOB, quindi Leland è innocente" → assoluzione indotta | >25% assoluzione → rinforzare beat 9/guardie R7 |
| Finale | "Cosa hai portato fuori dalla Loggia?" | S4 scelta; rilettura epilogo | una interpretazione posseduta | "non lo so" (accettabile: ambiguità) | "dovevo scegliere l'oggetto giusto" → quiz percepito | qualunque frequenza → il beat incriminato si riscrive |
Separare sempre: indizio presentato / notato / proposizione compresa / conseguenza attribuita / emozione dichiarata / responsabilità percepita. Mai solo "ti è piaciuta?".

==================================================
## 17. Self-audit
==================================================

1. **Ancora dialogo passivo**: M7 (specchio/enigmi) — accettato come beat di ascolto, dichiarato, breve.
2. **Risolvibile per combinazioni**: la presentazione se le risposte di memoria saltassero in scope-minima — per questo sono nel raccomandato, non nel taglio.
3. **Indizio che sostiene ciò che non implica**: la poesia → P2 da sola NON regge (per questo Truman la respinge nel merito); vigilare in scrittura che nessuna risposta la accetti.
4. **Player sa troppo presto**: col volto-sconosciuto (§2A) no; il rischio migra su sarah_visione — la visione deve mostrare IL VOLTO, mai contesto che identifichi la casa come colpevole prima di M8.
5. **Cooper sa troppo presto**: truman_atto5 attuale [P] — riparato da M9 (la deduzione è presentata dal player).
6. **Visione trattata come prova**: da nessuna parte dopo M9 (§4 la respinge esplicitamente in scena).
7. **Colpa senza responsabilità**: M8 riscritta; il monologo del lago è la guardia — test §16.
8. **Scelta che viola Cooper**: S1 riformulata (custodia documentata); vigilare S3-spento: fermare il nastro DOPO i fatti materiali è pietà, prima sarebbe occultamento — la collocazione È la guardia.
9. **Metodo solo variante testuale**: rischio sull'Intuitivo — criterio di fusione dichiarato in §10 e in scope (taglio).
10. **Conseguenza invisibile**: S2 (raccontare il sogno) resta la più debole — DECISIONE: retrocessa a "colore di relazione" (nessuna promessa di payoff) o tagliata in scrittura se nemmeno il colore regge.
11. **Personaggio femminile che esiste per soffrire**: il rischio era Maddy — la scheda §13 (vuole ANDARSENE, resta per scelta sua) è la risposta; Ronette: la sua parola è un atto, non un sintomo.
12. **Il gioco parla per Laura**: le pagine cifrate RESTANO cifrate (§13) — il gioco rifiuta l'ultima parola su di lei.
13. **Interpretazione presentata come verità**: la battuta del beat 3 e la chiusura del beat 12 sono marcate "ipotesi/interpretazione" nel testo stesso.
14. **Quiz mascherato nella Loggia**: eliminato (nessuna selezione di oggetti; gli stati si SPENDONO come registro/presenza).
15. **Sistema sottostimato**: la presentazione resta il candidato — per questo ha la stima più alta e la versione minima definita.
16. **Da tagliare prima di implementare**: S2 (se non regge), il metodo Intuitivo (se sinonimo), la variante "Sarah trova Maddy" (la più costosa emotivamente da scrivere bene: meglio assente che mediocre).
17. **Cosa fa il player che lo spettatore non può fare**: sceglie la domanda a una testimone muta; costruisce e PRESENTA un nesso (e ne riceve l'obiezione); sceglie con quale metodo si parla a un padre sospettato; decide se un nastro deve continuare a girare; porta (o non porta) un anello nella Stanza Rossa. La serie li mostra; qui si FANNO, e i costi restano scritti.

==================================================
## 18. Output finale
==================================================

**Cinque azioni che definiscono il lavoro di Cooper (giocate)**
1. Esaminare una scena e scegliere l'ordine di lettura (M2, M5).
2. Scegliere LA domanda per un testimone che può dare una sola risposta (M4-B2).
3. Presentare una conclusione con le prove che la reggono — e incassare l'obiezione nel merito (M4, M9).
4. Scegliere il metodo con cui si parla a un sospettato che è anche una persona (M6, M10).
5. Decidere che cosa la registrazione deve contenere — e portarne il peso (S3).

**Cinque deduzioni che devono appartenere al player**
1. P2 — gli incontri erano a est (da cuore+James, non da Truman).
2. La teoria dell'impeto è SBAGLIATA: la scena era preparata (P3, dall'anello posato).
3. P5 — presenza ≠ colpa: Jacques era lì e non basta.
4. P6+P7 — la contraddizione di Missoula E la ricorrenza sulla casa (la coppia che convoca).
5. P8 — le lettere trovano il nome SOLO passando dal diario (il ponte, mai la somiglianza).

**Tre eventi fissi le cui conseguenze restano aperte**
1. La morte di Maddy (chi c'era, cosa si preserva, quale promessa resta inevasa).
2. La morte di Jacques (quale risorsa costruita distrugge — dipende dalla tattica giocata).
3. La confessione e la morte di Leland (cosa contiene il nastro, chi testimonia, quale congedo nella Loggia).

**Tre contenuti da eliminare**
1. Il fallback numerico clues6 (già deciso: la deduzione non ha scorciatoie).
2. "BOB agisce dove il player non guarda" e ogni sua traccia nei testi (l'opposizione ha il suo registro).
3. Il quiz di qualunque forma nella Loggia (gli stati si spendono, non si interrogano).

**Una frase — la grammatica investigativa del gioco**
«In questo gioco indagare significa: guardare nell'ordine che scegli, chiedere sapendo che ogni domanda ne brucia altre, sostenere una conclusione davanti a un amico che vorrebbe sbagliarsi, e scoprire che il metodo con cui ottieni la verità decide che cosa la verità ti lascia in mano.»
