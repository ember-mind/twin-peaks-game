---
type: project
project: Twin Peaks Game
created: 2026-07-22
status: draft
---

# Architettura causale della trama, design delle missioni, suspense e intrecci

## REVISIONE VINCOLANTE post-esame (voto 24/30, tutor 2026-07-22)

Prevale sul corpo del documento (conservato per archivio). Correzioni:

1. **Decisione sul sogno (umana, aperta)**: il documento sostiene insieme whodunit ("chi ha ucciso Laura?") E ironia drammatica (il player vede il volto) — incompatibili se il volto è riconoscibile. Versione A: volto NON identificabile (voce, profilo, gesto — il "chi" resta vivo). Versione B: Leland riconoscibile → il gioco va ridefinito come indagine su prova/responsabilità e Jacques smette di essere falso colpevole PER IL PLAYER (resta capro per il paese). Da decidere prima del prossimo esercizio.
2. **Causalità circolare del Gigante (R3 sbagliata)**: una predizione non ancora pronunciata non può essersi "verificata". Fix semplice: il Gigante appare per causa già stabilita (trauma/specchio/fallimento del solo metodo materiale) e offre 3 enunciati — uno GIÀ verificabile (stabilisce credibilità), uno di suspense, uno pagato nella Loggia.
3. **"BOB agisce dove il player non guarda" = regola d'autore, TAGLIATA**: l'opposizione agisce per obiettivi/informazioni/opportunità propri (accesso alle vittime, necessità di eliminare Jacques, perdita di controllo). "Mai due azioni per atto" resta SOLO come principio di ritmo, non come spiegazione. E il motivo della confessione richiede un ponte causale (la cattura chiude la forma di esistenza → contaminare il verbale/provocare/preparare un passaggio) — la battuta di Cooper "è ciò che vuole" va riformulata come IPOTESI, mai certezza.
4. **M8: impotenza, non "colpa condivisa" — TAGLIATA la colpa**: il player non poteva rifiutare il Roadhouse né salvare Maddy → nessuna responsabilità. La scena produce legittimamente impotenza/shock/lutto. Giocabilità: morte fissa, CONSEGUENZE aperte (chi avvertire, quale luogo controllare dopo la visione, chi trova Maddy, quali prove si preservano, Sarah sola o no, quale promessa resta inevasa). Mai un obiettivo "salva Maddy".
5. **Presentazione indizi: grafo di proposizioni, non coppie di oggetti** (anti quiz combinatorio): il player sceglie PRIMA la conclusione da sostenere, POI le prove; il gioco valuta il nesso e risponde nel merito (quale legame manca), mai solo giusto/sbagliato. **Fallback clues6 ELIMINATO** (svuoterebbe la deduzione): fail-forward a domande sempre più precise, mai la soluzione.
6. **Mandato non sostenibile**: una visione non è base procedurale. Separare sospetto investigativo (sogni, comportamento) da base procedurale (contraddizione verificabile = Missoula, accesso, opportunità). Linguaggio: convocazione come persona informata / interrogatorio volontario, NON "mandato".
7. **Onestà sui verbi**: M1/M3/M4/M7 restano in gran parte "premi Z" — non chiamarlo strategia. "Pressare Jacques" diventa verbo solo quando il player sceglie COME (tre tattiche con risposte diverse).
8. **S1 anello riformulata**: tenerlo in tasca di nascosto viola l'identità di Cooper (contaminazione della prova). Versioni coerenti: custodia istituzionale vs custodia investigativa personale DOCUMENTATA (fotografata, firmata, contestabile da Truman, con costo relazionale/probatorio).
9. **S3 registratore: collocazione precisa**: la scelta arriva DOPO che i fatti materiali essenziali sono a nastro (vagone, accesso, lettere, atti) — si sceglie se documentare il materiale metafisico/emotivo, MAI "verità di Laura vs pietà per Leland". E la frase di Cooper "non tutto ciò che ha fatto era suo" è una sentenza metafisica: sostituita con «So ciò che ha fatto. Non so più dire dove finisse la sua volontà. Una cosa non cancella l'altra.» (interpretazione, non verdetto).
10. **R7 mancante — aggiunta**: "Responsabilità fratturata" è LA rivelazione tematica principale e va formalizzata nel ladder (modello precedente: colpevole unitario → nuovo: atti suoi, discontinuità non quantificabile; azione del player: metodo + registratore; resta ignoto: la ripartizione).
11. **Laura e Maddy senza scheda**: serve la scheda della *presenza postuma* di Laura (desideri ricostruibili, versioni diverse di sé per persona, cosa il gioco rifiuta di ridurre a strumento della crescita altrui) e una Maddy con obiettivo proprio (non "Laura di nuovo che muore"). Ronette da soggetto, non solo corpo-indizio.
12. **Tassonomia dei fili**: sottotrama (solo Audrey) / arco relazionale (Cooper–Truman) / filo di mistero (Log Lady-gufi) / catena testimoniale (Ronette) / presenza postuma (Laura) / arco di lutto (James/Donna) — non promettere payoff da sottotrama a ciò che non lo è.
13. **Worldbuilding funzionale carente fuori dalla stazione**: gli altri luoghi sono etichette tematiche — servono proprietà/manutenzione/routine/economia per ciascuno. E il conteggio mappe è 11, non 10 (errore fattuale).
14. **Finale: checklist ≠ sequenza giocabile**: la Loggia va progettata in 6-10 beat concreti; MAI un quiz del menu indizi ("il Nano parla a chi ha fatto l'aritmetica" bocciato come vago/quiz).
15. **Scope sottostimato**: non "un solo widget" — servono: scelta A/B/C, presentazione indizi in dialogo, valutazione rilevanza, fail-forward, sezione presagi, branching M10/Loggia/epilogo, aggiornamento walkthrough+smoke; e 200-300 righe è stima bassa. Versioni minima/raccomandata/da-tagliare per ogni pezzo. Durata: dichiarare 90-110' primo run.

---

Documento progettuale (nessuna implementazione). Fonte: ispezione reale del repository (`js/data.js`, `js/glue.js`, `js/maps.js`, `js/engine.js`, `test/walkthrough.js`) + audit precedenti registrati in MEMORY. Marcatura di provenienza: **[C]** canone serie · **[P]** canone già stabilito dal progetto · **[A]** adattamento · **[N]** nuova proposta · **[?]** incerta.

==================================================
## 0. Provenienza e mappa del progetto
==================================================

### Atti (tutti [P], gating a flag — `data.js` D.objectives 645-660)
| Atto | Gate d'ingresso | Gate d'uscita | Provenienza |
|---|---|---|---|
| 1 — Il paese dei ciliegi | nessuno (spawn town 28,31) | `sogno_fatto` (laura_sogno:311) | [A] arrivo+diario+sogno |
| 2 — Il rapporto dell'autopsia | `sogno_fatto` (porte hotel/hospital) | 6 indizi (`clues6`) → `atto3` (truman_atto3:334) | [A] |
| 3 — Una notte alle Giacche | `atto3` (porta est) | `jacques_morto` (lucy_a3:418) → `gigante1` | [A] |
| 4 — Il gigante e la cugina | `atto4` (truman_atto4:447, porta roadhouse) | `maddy_trovata` (lago_maddy:548) | [A] |
| 5 — Attraverso l'oscurità | `atto5` (truman_atto5:564) | `leland_morto` (leland_morte:597) → finale `laura_finale2` end:true (635) | [A] |

### Nodi, indizi, flag, obiettivi, personaggi, luoghi
- **40 nodi dialogo** [P] (data.js 45-636), 15 acquisizioni obbligatorie sul critical path (walkthrough PREREQ), il resto facoltativo (landmark, NPC secondari, arco Audrey).
- **9 indizi** [P] nel menu X (D.clues 26-36): diario, cuore, lettera_r, nome_sussurrato, poesia_fuoco, cuore_intero, biglietto_fuoco, anello, lettera_o.
- **16 flag** [P]: catena completa in tabella d'audit (glue/maps/engine come lettori). **Orfano attivo: `mfap_finale_visto`** (scritto in mfap_finale:618, mai letto). `audrey_salvata` e l'anello: riparati in audit precedente (letti da truman_wait4/5 — MEMORY 2026-07-21).
- **Obiettivi**: scala a 9 gradini first-match-wins (data.js 645-660), mostrata in cima al menu X, validata da walkthrough a ogni acquisizione [P].
- **18 NPC** su 10 mappe (glue.js 13-90) [P]; due istanze di Leland (sheriff/palmer), due di Audrey (hotel/oej), due di Hawk (sheriff/traincar).
- **10 mappe** [P] (maps.js): town 56×36, sheriff, palmer, hotel_gn, hospital, diner, woods (transenna needsClues:3), redroom (trappola one-way → risveglio hotel), traincar, oej, roadhouse.
- **Sistemi narrativi** [P]: menu X (obiettivo+indizi), rifiuti diegetici `blockedMsg` (hotel_locked, est_bloccato, roadhouse_chiuso, woods_blocked), onEnter hook (town_arrivo once; redroom), salvataggio su porta, cascate condizionali di dialogo (Truman 9 stati), visibilità NPC condizionale, sparkle prima-volta.

### Conflitti fra canone, progetto e proposta
1. **[C]vs[P] — la scoperta del colpevole**: nella serie l'identificazione passa per la visione di Cooper (metodo onirico); nel progetto è gated su indizi accumulati + bugia di Missoula [P]. Il progetto ha già deciso: intuizione ORIENTA, prova SBLOCCA. Questo documento conserva la decisione [P].
2. **[C]vs[P] — Maddy**: nella serie la sua morte è mostrata; nel progetto avviene offscreen durante il Roadhouse e si scopre al lago [P]. Conservato: coerente con "l'opposizione agisce senza aspettare".
3. **[?] — nome_sussurrato**: indizio "fantasma" (il player VEDE il sogno, Cooper lo dimentica — split di conoscenza da Role Contract). Provenienza ibrida [A]; da mantenere ma va dichiarato che il menu X mostra la versione DIMENTICATA (vedi §7, ironia drammatica).
4. **[N] dichiarate in questo documento**: 4 scelte di stance (§10), 3 metodi d'interrogatorio (§14), timeline offscreen di BOB (§3), riparazioni di transizione (§2). Nessuna riscrittura silenziosa del canone: ogni [N] è marcata.

==================================================
## 1. Promessa del gioco e ruolo del giocatore
==================================================

- **Fantasia**: essere l'investigatore che prende sul serio sia le impronte sia i sogni — competenza + apertura al non spiegabile.
- **Ruolo**: Cooper come *authored protagonist* (Role Contract [P]): il player STERZA, non riscrive. Fissi: motivazione (il caso Laura), voce (monologhi a Diane), valori (metodo+intuizione+empatia), sequenza a 5 atti e finale. Espressivi: ordine d'esplorazione, lore opzionale, ritmo, riletture — e (da questo documento [N]) metodo d'interrogatorio, gestione delle prove, stance nelle 4 scelte.
- **Verbi principali**: muoversi (griglia), parlare (Z), esaminare oggetti/landmark, consultare il taccuino (X), presentare indizi [N-esteso].
- **Competenze**: investigative (collegare lettere→ROBERT→BOB, notare la bugia su Missoula); sociali (chi parla dopo cosa: James solo dopo il sogno); intuitive/oniriche (il sogno, gli enigmi del Gigante, i gufi — orientano, non risolvono).
- **Domanda drammatica centrale**: *chi ha ucciso Laura Palmer — e la categoria "chi" basta?*
- **Tema**: il male abita il quotidiano; conoscere non equivale a proteggere.
- **Conflitto di valori**: giustizia contro pietà (pagato in Atto 5, §14).
- **Esperienza promessa / durata**: indagine gated lineare-onesta, ~90 min, gradi reali di libertà locali (ordine, opzionale, stance) dentro macro fissa.
- **Split di conoscenza**: il player scopre (il volto nel sogno, la scena del lago); Cooper sa già (procedura, il paese); entrambi imparano (ROBERT→BOB, la bugia); il sistema registra (flag+indizi = ledger condiviso); resta interpretazione (cosa È BOB, cosa vuole — mai un flag "posseduto").
- **Frase**: «Il giocatore non osserva Cooper risolvere il caso; il giocatore *sceglie quali porte aprire prima, quali indizi mettere sul tavolo e in quale ordine, quale metodo usare con un padre sospettato e se il nastro deve girare mentre la verità esce — e porta nella Loggia la versione della verità che le sue mani hanno costruito.*»

==================================================
## 2. Audit della trama attuale
==================================================

### Atto 1 — Il paese dei ciliegi
| Campo | Stato |
|---|---|
| Ingresso | Cooper arriva; monologo (town_arrivo, once) |
| Causa ereditata | l'omicidio (antefatto) — nessuna, è l'innesco |
| Obiettivo | "Parla con lo sceriffo Truman" → diario → camera di Laura |
| Ragione personale | il metodo di Cooper: prima le persone, poi la scena |
| Opposizione | inerzia del paese (nessuno vuole guardare); nessuna attiva |
| Domanda di suspense | cosa nasconde la camera di una ragazza che tutti dicevano felice? |
| Azioni player | esplorare il paese, 3 indizi (diario, cuore, lettera_r), varcare la transenna del bosco |
| Svolta | il SOGNO: la Stanza Rossa, Laura sussurra il nome |
| Conseguenza | Cooper si sveglia al Great Northern e HA DIMENTICATO (split) |
| Cambio mondo/relazioni | hotel e ospedale si aprono; Truman diventa alleato operativo |
| Gancio | "riferisci il sogno a Truman" |

### Atto 2 — Il rapporto dell'autopsia
Ingresso: `sogno_fatto`. Causa ereditata: il sogno da decifrare. Azioni: Ronette in coma ("BOB!" → ronette_bob), la poesia del fuoco (Gerard), il cuore ricomposto (James — SOLO dopo il sogno: gate sociale corretto), Audrey che indaga (arco laterale). Svolta: sei frammenti che non compongono ancora un nome. Conseguenza: Truman apre la strada a est. Gancio: il vagone.

### Atto 3 — Una notte alle Giacche
Ingresso: `atto3`. Azioni: vagone (mucchio_terra→biglietto_fuoco, anello), One Eyed Jacks (Jacques; Audrey se `audrey_indaga`), arresto. Svolta: Jacques muore in ospedale MENTRE il player è altrove (lucy_a3) — l'opposizione elimina un testimone. Conseguenza: lo specchio della 315 → il Gigante (gigante1). Gancio: gli enigmi.

### Atto 4 — Il gigante e la cugina
Ingresso: `atto4`. Azioni: Maddy che appare/svanisce, la visione di Sarah, Leland che si sfalda (leland_a4/dove/dopo), i gufi (loglady_a4), Gerard in trance, il Roadhouse ("Sta accadendo di nuovo"). Svolta: il lago — Maddy, la lettera O. Conseguenza: le lettere compongono; il sospetto ha una casa. Gancio: "interroga Leland".

### Atto 5 — Attraverso l'oscurità
Ingresso: `atto5`. Azioni: interrogatorio (gated sugli indizi presentati), confessione, morte in cella, ritorno alla Loggia. Uscita: laura_finale2, end:true.

### Classificazione delle transizioni
| Transizione | Classe | Riparazione minima |
|---|---|---|
| Arrivo → sogno (3 indizi → transenna) | **CAUSALE MA DEBOLE** — i 3 indizi APRONO il bosco ma non MOTIVANO l'andarci | [N-R1] una riga nel dialogo del diario: il diario cita il bosco/Glastonbury come luogo che Laura temeva — l'apertura diventa inseguimento di una pista, non un contatore |
| Sogno → Atto 2 | CAUSALE (il sogno È la nuova pista; lo split genera la caccia al nome) | — |
| 6 indizi → atto3 | **PURAMENTE INFORMATIVO** — `clues6` è un contatore: nessuna inferenza, solo completezza | [N-R2] truman_atto3 diventa presentazione attiva: Truman chiede "cosa abbiamo?" e il player PRESENTA dal menu X i 2 indizi che puntano a est (poesia_fuoco + cuore_intero: James dice dove si vedevano). Sbaglia presentazione → Truman risponde nel merito e riformula la domanda (fail-forward informativo, nessun softlock). Il contatore resta come fallback di robustezza |
| jacques_morto → gigante1 (specchio) | **DIPENDENTE DA COINCIDENZA** (perché il Gigante appare ORA?) | [N-R3] gli enigmi del Gigante diventano 3 PREDIZIONI verificabili (vedi §7); la prima ("un uomo sorride in un sacco") è già vera: Jacques. Il Gigante appare perché una predizione si è compiuta — regola stabilita, non capriccio |
| Roadhouse → lago | CAUSALE ("sta accadendo di nuovo" + visione di Sarah → correre da Maddy → il lago) | tenere l'ordine: gigante2 PRIMA di lago_maddy (già così: cond gigante2 su lago_maddy) |
| maddy_trovata → sospetto su Leland | **CAUSALE MA DEBOLE** — le lettere R+O e la bugia su Missoula ci sono [P], ma il salto "quindi Leland" avviene nel dialogo di Truman, non nelle mani del player | [N-R4] truman_atto5 chiede al player di presentare DUE prove che reggano un mandato: accetta solo coppie coerenti (lettera_o + diario-ponte ROBERT; o bugia-Missoula + sarah_visione). L'inferenza la fa il player, il dialogo la conferma |
| leland_morto → Loggia | CAUSALE (il verbale è chiuso, il non-verbalizzabile resta: unico luogo dove andare) | — |

Nessuna transizione è difesa "perché nella serie va così": le due più deboli (contatore e coincidenza) sono proprio quelle senza logica interna.

==================================================
## 3. Motore drammatico
==================================================

- **Cooper vuole**: chiudere il caso proteggendo i vivi (Ronette, Audrey, Maddy — il gioco già registra i fallimenti: Maddy muore).
- **Cooper teme**: che l'intuizione sia rumore — o peggio, che sia vera e quindi il male non sia processabile.
- **Convinzione messa alla prova**: "conoscere = poter proteggere" (cade in Atto 4 con Maddy, definitivamente in Atto 5).
- **BOB vuole** [tutte marcate]: NECESSARIO ALLA TRAMA: continuare a nutrirsi/abitare senza essere fermato (le morti di Jacques e Maddy lo esibiscono). IPOTESI [?]: essere visto e non creduto (da dimostrare in §14 con la forma della confessione); ferire chi indaga; farsi ricordare. Il gioco non sceglie tra le ipotesi: le lascia interpretazione.
- **Umani**: Truman vuole che il paese resti il suo paese (teme di dover arrestare un amico); Sarah vuole essere creduta; Audrey vuole contare (indaga per esistere agli occhi del padre); James/Donna vogliono un lutto pulito (e nascondono il cuore); Jacques vuole farla franca; Leland — vedi §11.
- **Istituzioni che ostacolano**: la procedura stessa (ciò che Cooper "sa" per sogno non è presentabile); il decoro del paese (nessuno dice ad alta voce ciò che tutti intuiscono di casa Palmer).
- **Senza il player**: la timeline offscreen avanza comunque (sotto). Processi indipendenti: il diner apre, la segheria fuma, il Roadhouse programma la serata, Lucy risponde al centralino.

### Timeline offscreen dell'opposizione [N — design, non implementazione]
| Beat | Info di BOB/Leland | Obiettivo | Azione | Traccia visibile al player | Conseguenza | Limite di conoscenza |
|---|---|---|---|---|---|---|
| Atto 1-2 | sa che l'indagine riparte | osservare | Leland "collabora" al lutto pubblico | leland (palmer) troppo composto; sarah esausta | falso alibi emotivo | NON sa del sogno di Cooper |
| Atto 3 | sa che Jacques può collocarlo al vagone | eliminare il testimone | morte in ospedale | lucy_a3 (fuori scena, riferita) | il caso perde l'unico teste oculare | non sa che l'anello è stato trovato |
| Atto 4 | sente Maddy come "di nuovo Laura" | ripetere | uccide Maddy MENTRE il player è al Roadhouse | "sta accadendo di nuovo" (gigante2), poi il lago | la protezione fallisce dove il player non è | non può essere ovunque: agisce solo dove il player non guarda (regola: mai onnisciente, mai due azioni nello stesso atto) |
| Atto 5 | sa che le prove convergono | governare la forma della resa | confessione "inutilizzabile" [?] | la forma stessa del verbale (§14) | il caso si chiude e si sfonda | non controlla la Loggia: lì il registro non vale |

- **Perché regge tutto il gioco**: l'opposizione non è un boss ma un *pattern che si ripete* ("di nuovo"): ogni atto ne mostra un'iterazione più vicina a casa.
- **Valore deciso nel finale**: che cosa conta come "aver chiuso" — il verbale o la custodia di ciò che il verbale non contiene.

==================================================
## 4. Spina causale degli atti
==================================================

| Atto | Domanda iniziale | Obiettivo | Strategia dominante | Rivelazione | Fallimento/successo incompleto | Conseguenza irreversibile | Cambio strategia | Domanda finale | ≥3 dimensioni cambiate |
|---|---|---|---|---|---|---|---|---|---|
| 1 | chi era Laura davvero? | ricostruire la vittima | ascolto del paese | il diario doppio + il sogno | il nome si perde al risveglio | il sogno esiste, non si può disfare | dal paese ai luoghi chiusi (hotel/ospedale) | cosa dice il corpo? | obiettivo, metodo, accesso |
| 2 | cosa vide Ronette? chi è "BOB"? | dare un corpo al nome | prove materiali + testimoni rotti | 6 frammenti che non chiudono | nessun volto per il nome | Ronette resta rotta; il paese sa che si indaga | dal paese al CONFINE (est) | dove è successo davvero? | sospetto, accesso, interpretazione |
| 3 | cosa successe quella notte? | la scena primaria | ricostruzione + pressione (arresto) | il vagone, l'anello, Jacques | Jacques muore: il teste è perso | morte di Jacques | dalla prova al presagio (enigmi) | perché il Gigante avverte ME? | alleanza (Gigante), rischio, responsabilità |
| 4 | "sta accadendo di nuovo" — a chi? | proteggere la prossima | correre dietro ai presagi | il lago; la lettera O; ROBERT | la protezione arriva DOPO | morte di Maddy | dall'inseguire il mostro al guardare la casa | quanto vicino a casa Palmer? | sospetto, responsabilità, condizione di un luogo (il lago, casa Palmer) |
| 5 | può il metodo contenere ciò che ha trovato? | la verità a verbale | interrogatorio (metodo a scelta §14) | responsabilità fratturata | la confessione c'è, la salvezza no | morte di Leland | dal verbale alla Loggia | cosa resta aperto quando il caso è chiuso? | metodo, interpretazione, relazione (Truman), accesso (Loggia) |

Escalation = cambio di strategia per atto (ascolto → prove → pressione → presagio → confronto), mai solo "indizi più grossi".

==================================================
## 5. Architettura delle missioni (10 schede, dai contenuti esistenti)
==================================================

Formato compresso: ogni campo richiesto, una riga. [P]=esiste, [R]=riparazione, [N]=nuova proposta minima.

**M1 — "Il paese dei ciliegi" (Atto 1) [P]**
Causa: l'arrivo. Obiettivo mostrato: "Parla con lo sceriffo Truman (a ovest)". Motivazione: prima le persone. Opposizione: reticenza sociale. Posta: la fiducia di Truman. Verbi: muoversi/parlare; secondario: esaminare landmark. Luogo: town. Problema spaziale: orientarsi in 56×36 (piazza come hub). Informativo: distinguere chi parla da chi dice. Sociale: l'agente federale tra gente in lutto. Indizi: diario. Inferenza: il diario ha due registri (pubblico/segreto). Stance: quanto lore opzionale attivare. Svolta: Truman consegna il diario. Conseguenza: casa Palmer accessibile con scopo. Trattenuta: cosa temeva Laura (nel diario, cifrato). Nuova domanda: la sua stanza. Perché giocarla: il paese va CAMMINATO per diventare il metro di tutto ciò che dopo si rompe (stesso principio della stazione in Direzione Artistica).

**M2 — "La camera di Laura" (Atto 1) [P]**
Causa: il diario. Obiettivo: "La camera di Laura, casa Palmer". Opposizione: Sarah (dolore che respinge), Leland (compostezza che devia). Posta: la prima prova materiale. Verbi: esaminare; parlare. Luogo: palmer. Spaziale: la stanza (6,1) oltre i genitori. Informativo: cuore SPEZZATO + lettera R — oggetti che pongono domande. Sociale: frugare nel lutto altrui. Inferenza: metà cuore = qualcuno ha l'altra metà. Svolta: la R non è dell'alfabeto di Laura. Conseguenza: 3 indizi → transenna del bosco [R1: il diario nomina il bosco — la transenna si apre su una PISTA, non su un contatore]. Trattenuta: chi è R? (falso indizio: si legge come iniziale). Perché giocarla: le mani del player toccano gli oggetti che l'Atto 5 spenderà.

**M3 — "Il sogno" (Atto 1→2) [P]**
Causa: la pista del bosco. Obiettivo: "Il bosco, oltre la transenna". Opposizione: il sogno stesso (dà e toglie). Posta: il nome. Verbi: muoversi (redroom one-way [P]); ascoltare. Spaziale: la trappola onirica (uscita = risveglio 315). Informativo: il player VEDE, Cooper DIMENTICA (nome_sussurrato = indizio-fantasma nel menu: mostra "un nome dimenticato"). Inferenza: nessuna richiesta — semina per dopo. Svolta: risveglio. Conseguenza: sogno_fatto; hotel/ospedale si aprono; James parlerà. Perché giocarla: fonda l'ironia drammatica che regge 3 atti (§7).

**M4 — "Il rapporto e i frammenti" (Atto 2) [P+R2]**
Causa: il sogno riferito. Obiettivo: "Ospedale, diner e hotel. Poi Truman". Opposizione: testimoni rotti (Ronette) o reticenti (James). Posta: abbastanza verità da aprire l'est. Verbi: parlare; presentare [R2]. Luoghi: hospital/diner/hotel_gn. Spaziale: tre edifici, ordine libero (espressività reale). Informativo: poesia del fuoco (Gerard), "BOB!" (Ronette), cuore_intero (James). Sociale: James parla solo a chi ha sognato (gate [P] — il paese sente chi è "dentro"). Inferenza [R2]: al ritorno, Truman chiede COSA punta a est: il player presenta poesia_fuoco + cuore_intero. Svolta: la strada a est si apre per deduzione presentata, non per contatore. Trattenuta: chi ha scritto la poesia. Perché giocarla: è la palestra della presentazione-indizi che l'Atto 5 userà sotto pressione.

**M5 — "Il vagone" (Atto 3) [P]**
Causa: la deduzione dell'est. Obiettivo: "La strada a est: il vagone del treno". Opposizione: la scena contaminata dal tempo. Posta: la scena primaria. Verbi: esaminare (sparkle mucchio_terra, anello); leggere lo spazio. Luogo: traincar. Spaziale: il vagone in fondo alla mappa — arrivare È attraversare dove Laura fu portata. Informativo: "FUOCO CAMMINA CON ME", biglietto, l'anello. Inferenza: l'anello al dito mancante di Ronette? (il gioco lascia aperto [P]). Stance [N-S1, §10]: l'anello — a verbale o in tasca. Svolta: la scena parla. Conseguenza: Jacques diventa raggiungibile. Perché giocarla: unico luogo dove il crimine è leggibile SENZA mediazione di dialogo (evidenza ambientale pura).

**M6 — "One Eyed Jacks" (Atto 3) [P]**
Causa: il vagone indica Jacques. Obiettivo: "Oltre il confine: One Eyed Jacks". Opposizione: Jacques (menzogna), il luogo (fuori giurisdizione). Posta: un teste vivo — e Audrey, se `audrey_indaga`. Verbi: parlare (pressione); scegliere chi prima [P]. Spaziale: l'edificio del vizio oltre il fiume. Sociale: Cooper fuori giurisdizione. Inferenza: incastrare Jacques con biglietto+vagone. Svolta: arresto (jacques_preso). Conseguenza: Jacques muore in ospedale (lucy_a3) MENTRE il player fa altro — l'opposizione agisce offscreen [P]. Trattenuta: CHI l'ha ucciso (mai mostrato). Perché giocarla: il primo successo del metodo che l'opposizione annulla — il player deve SENTIRE il pavimento cedere.

**M7 — "Gli enigmi del Gigante" (Atto 3→4) [P+R3]**
Causa: la predizione compiuta (Jacques nel "sacco") [R3]. Obiettivo: "Lo specchio della 315". Opposizione: il presagio criptico. Posta: credere o no al canale intuitivo. Verbi: ascoltare; ANNOTARE (i 3 enigmi entrano nel taccuino come "presagi", sezione separata dagli indizi [N: parità intuizione/prova nel ledger]). Inferenza: nessuna immediata — semina verificabile. Svolta: gigante1. Conseguenza: atto4; roadhouse. Perché giocarla: stabilisce la REGOLA delle visioni (orientano, si verificano dopo) prima che serva per il finale.

**M8 — "Sta accadendo di nuovo" (Atto 4) [P]**
Causa: il secondo enigma. Obiettivo: "Stasera: il Roadhouse". Opposizione: il tempo (BOB agisce ORA, altrove). Posta: Maddy. Verbi: assistere (gigante2), poi CORRERE (casa Palmer → lago: la mappa town attraversata in urgenza — stesso spazio, nuovo significato). Informativo: la visione di Sarah [P] già vista da chi ha esplorato. Svolta: il lago, la lettera O. Conseguenza: maddy_trovata; il fallimento della protezione diventa esperienza del player (era al Roadhouse — DOVEVA esserci: il gioco lo ha mandato lì; la colpa condivisa è progettata [P]). Perché giocarla: l'unica missione in cui perdere è il contenuto.

**M9 — "Il mandato" (Atto 4→5) [P+R4]**
Causa: R+O e la casa che continua a tornare. Obiettivo: "Porta a Truman due prove che reggano". Verbi: presentare (coppia coerente: lettera_o+ponte-ROBERT o Missoula+visione). Opposizione: Truman stesso (vuole sbagliarsi — attrito dell'amico, non porta chiusa). Svolta: atto5. Trattenuta: Truman non dice cosa farà DOPO l'arresto (non lo sa). Perché giocarla: l'inferenza finale deve uscire dalle mani del player, o l'Atto 5 spende monete non guadagnate.

**M10 — "L'interrogatorio" (Atto 5)** → scheda completa in §14.

*(M11 facoltativa [P]: arco Audrey — audrey_a2→audrey_oej→esito; resta laterale, vedi §9.)*

Nessuna missione è "raggiungi NPC → leggi → ricevi indizio → torna": M1-2 leggono oggetti, M3 è spazio puro, M4/M9 presentano, M5-6 ricostruiscono e pressano, M7 semina regole, M8 corre e perde, M10 sceglie metodo.

==================================================
## 6. Gerarchia degli obiettivi
==================================================

Livelli: (1) gioco: *chiudere il caso Laura Palmer senza perdere ciò che il caso non copre*; (2) atto: colonna "obiettivo" in §4; (3) missione: schede §5; (4) minuto-per-minuto: la riga del menu X.

Revisione della scala [R — verbi concreti, testo attuale → proposto]:
| Gradino | Attuale | Proposto |
|---|---|---|
| default | "Parla con lo sceriffo Truman (a ovest)" | ok (verbo+luogo) |
| clues3 | — (implicito) | [N] "Il diario nomina il bosco: oltre la transenna" |
| sogno_fatto | "Ospedale, diner e hotel. Poi Truman" | ok — tiene il diner esplicito (guardia anti-spin [P]) |
| clues6 | "Riferisci a Truman" | [R2] "Mostra a Truman cosa punta a est (menu X)" |
| atto3 | "La strada a est: il vagone del treno" | ok |
| gigante1 | "Riferisci a Truman alla centrale" | [R] "Annota gli enigmi. Poi Truman" |
| atto4 | "Stasera: il Roadhouse" | ok |
| gigante2 | "Casa Palmer. Poi il lago" | ok (già concreto) |
| maddy_trovata | "Riferisci a Truman alla centrale" | [R4] "Porta a Truman due prove che reggano un mandato" |
| atto5 | "Interroga Leland Palmer alla centrale" | ok |
| leland_morto | "Torna alla Loggia (Glastonbury Grove)" | ok — la formulazione poetica accompagna: "Il caso è chiuso. Ciò che è aperto non è un caso." (seconda riga, non sostituto) |

Per ogni gradino: ciò che il player CREDE di ottenere vs ottiene davvero — es. clues6: crede "completare la lista", ottiene "la prima deduzione presentata"; maddy_trovata: crede "vendetta imminente", ottiene "il peso di firmare il sospetto su un padre".

==================================================
## 7. Architettura della suspense
==================================================

Matrice delle domande (compressa: nascita → credenze → indizi/falsi → complicazione → risposta → nuova domanda):

**Q1 — Chi ha ucciso Laura?** Nasce: al titolo [C]. Player crede: "un estraneo" (il paese lo spera ad alta voce). Cooper: nessuna ipotesi (metodo). Sistema sa: tutto (grafo fisso). Indizi: diario→R→poesia→biglietto→O→Missoula. Falsi: la "R" come iniziale di un nome nuovo (Robert? Richard?); Jacques come colpevole comodo (Atto 3 = falsa soluzione strutturale). Prima teoria ragionevole: Jacques. Complicazione: Jacques muore da INNOCENTE del delitto principale. Risposta: Atto 5. Nuova domanda: → Q4.
**Q2 — Cosa significa il sogno?** Nasce: M3. IRONIA DRAMMATICA PORTANTE: il player ha VISTO, Cooper no — per 3 atti il player valuta ogni NPC contro un volto che il suo personaggio non ricorda. Risposta: la confessione la chiude — la scena in cui i due saperi si saldano è l'affioramento (§14). 
**Q3 — Gli avvertimenti vanno creduti?** Nasce: M7. Regola [R3]: ogni enigma si verifica. Enigma 1→Jacques (già accaduto: curiosità), enigma 2→"di nuovo" (suspense pura: POTREBBE accadere), enigma 3→si paga nella Loggia (sospeso oltre il finale). Distinzione operante: suspense (enigma 2), curiosità (vagone: cosa È accaduto), sorpresa (morte di Jacques: modello rotto), ironia (Q2).
**Q4 — Cosa è BOB?** Nasce: "BOB!" di Ronette. Mai risolta a sistema [P]: il gioco rifiuta il flag. La confessione la TRASFORMA (da "chi è" a "come si convive con una spiegazione impossibile") senza chiuderla.
**Q5 — Il paese sopravvive alla verità?** Nasce: T4 della stazione (Direzione Artistica). Risposta: l'epilogo la lascia al player (mondo ordinario dopo la Loggia, §15).

Ogni rivelazione maggiore CAMBIA l'obiettivo corrente (la scala §6 riscrive la riga del menu), mai solo la posta.

==================================================
## 8. Catena degli indizi e delle rivelazioni (6 maggiori)
==================================================

| # | Spiegazione precedente | Fatto nuovo | Indizi già in mano | Indizio nuovo | Azione del player che collega | Inferenza | Reinterpretato | Resta ignoto | Nuovo obiettivo | Rischio arbitrarietà |
|---|---|---|---|---|---|---|---|---|---|---|
| R1 | "ragazza felice" | Laura aveva una vita doppia | — | diario | leggere il diario DOPO aver sentito il paese | i due registri non coincidono | ogni dialogo dell'Atto 1 | cosa temeva | la camera | basso |
| R2 | vittima passiva | Laura sapeva e temeva | diario | cuore+lettera_r | esaminare la stanza | metà cuore = un confidente esiste | James/Donna | chi è R | il bosco [R1] | basso |
| R3 | indagine ordinaria | esiste un canale non ordinario | 3 indizi | il sogno (fantasma) | attraversare la Stanza Rossa | il caso ha un piano che il verbale non copre | tutto | il nome dimenticato | decifrare da svegli | medio (protetto: il sogno ORIENTA, ogni pista va riverificata [P]) |
| R4 | il male è fuori (un estraneo) | il male era al vagone, rituale, firmato | poesia, BOB!, cuore_intero | biglietto_fuoco+anello | ricostruire la scena del vagone | il crimine è locale e premeditato | la poesia (non metafora: procedura) | chi tiene l'anello | Jacques | basso |
| R5 | Jacques = colpevole | Jacques = testimone eliminato | tutto il fascicolo | la sua morte (offscreen) | NESSUNA: il player la SUBISCE | qualcuno può agire dove il metodo non guarda | l'arresto (vittoria → esca) | chi l'ha ucciso | credere agli enigmi | zero: la subisce, non la deduce |
| R6 | il mostro va cercato | il mostro era in casa | R, O, visione, Missoula | lettera_o al lago | presentare la coppia di prove [R4] | ROBERT→(diario)→BOB→casa Palmer | leland_a4/dove/dopo, sarah_visione, la compostezza | la ripartizione della colpa | il mandato | medio → basso con R4 (l'inferenza è presentata dal player) |

Nessuna rivelazione dipende SOLO da confessione/visione/NPC-spiegone/oggetto-last-minute: R6 arriva prima della confessione (che la paga, non la fonda); le visioni orientano (R3, enigmi) e ogni loro contenuto ha una verifica investigativa [P: scala gufi già differenziata].

==================================================
## 9. Intreccio delle sottotrame
==================================================

| Sottotrama | Centro | Obiettivo proprio | Senza Cooper | Contatti con la principale | Pressione/risorsa/costo | Payoff | Se eliminata |
|---|---|---|---|---|---|---|---|
| **Audrey indaga** [P] | Audrey | contare per il padre | va a OEJ comunque (e ci resta) | (1) hotel: consegna la pista OEJ; (2) OEJ: va salvata | risorsa: accesso sociale a OEJ; costo: un civile nel raggio del pericolo | audrey_salvata letta da Truman [P, riparazione precedente] | il confine OEJ diventa puro dungeon |
| **James/Donna e il cuore** [P] | James | lutto privato pulito | il cuore resta nascosto | (1) diner post-sogno: cuore_intero; (2) [N-R5] al mandato: la loro reazione al sospetto su Leland (una pagina: il lutto pulito si sporca) | risorsa: 6° indizio; costo: il loro segreto esposto a verbale | il cerchio degli amici si chiude | il gate sociale del sogno perde il suo pagatore |
| **Log Lady e i gufi** [P] | Log Lady | essere creduta prima che serva | dice comunque le stesse cose | (1) diner Atto 1 (enigma); (2) loglady_a4 (sorveglianza → presagio compreso [P]) | risorsa: la scala di lettura dei gufi; costo: tempo/credulità | il 3° gradino paga nella Loggia | il canale intuitivo resta solo di Cooper (perde coralità) |
| **Ronette** [P+R6] | Ronette | sopravvivere al ricordo | resta in coma | (1) ronette_letto ("BOB!"); (2) [N-R6] Atto 5: il verbale della confessione cita ciò che Ronette non ha potuto dire — ronette_bob viene LETTA (ripara l'attuale lettura-solo-test) | risorsa: l'unico grido diretto; costo: il prezzo umano di guardarla | il "BOB!" smette di essere orfano | l'ospedale è scenografia |

Fusioni/tagli: **hawk_vagone** ridondante con la lettura ambientale di M5 → fondere (Hawk presente ma una sola pagina, rimanda agli oggetti). **biglietto_fuoco+anello**: due interazioni sparkle separate → un'unica ricostruzione a due passi (stessa missione, un beat). **mfap_finale_visto**: leggerla in laura_finale2 (una riga cambia se il player ha ascoltato il Nano) o tagliare il flag.

==================================================
## 10. Agency nel canone fisso (4 scelte)
==================================================

Nessun punteggio morale, nessuna buona/cattiva, fatti canonici intoccati. Formato: intenzione → azione → risposta → flag → eco → payoff → riconvergenza → significato residuo.

**S1 — La prova (l'anello, M5)**: tenere l'anello in tasca (intuizione: "appartiene già alla Loggia" [P]) o consegnarlo a verbale. A verbale: Truman lo cita al mandato (R4 più solida), ma nella Loggia Cooper arriva a mani vuote. In tasca: il mandato si regge sull'altra coppia di prove; nella Loggia l'anello è la moneta che il Nano riconosce (una pagina diversa, stesso esito di trama [P: payoff anello già stabilito]). Flag: anello_verbale/anello_tasca. Riconvergenza: la Loggia si attraversa comunque; resta CHI ha pagato cosa.
**S2 — La fiducia (il sogno, M4)**: raccontare a Truman TUTTO il sogno o solo i fatti verificabili. Tutto: Truman da lì legge le visioni come piste (dialoghi-ponte cambiano registro); ma al mandato la difesa di Leland "il federale sogna" è nell'aria (una riga in truman_atto5). Solo fatti: metodo intatto, e Truman arriva alla soglia dell'Atto 5 senza sapere DAVVERO con che cosa Cooper sta combattendo (la sua penna posata pesa diversamente). Eco: quale Truman entra nella stanza (§14).
**S3 — Giustizia/pietà (il registratore, M10)**: continuare a registrare la confessione o fermare il nastro — sviluppata in §14. È LA scelta che spende il conflitto di valori dichiarato.
**S4 — Interpretativa (il terzo enigma, Loggia)**: nel finale il Nano ripropone il terzo enigma; il player sceglie la lettura (è una promessa? una minaccia? "ti rivedrò fra 25 anni" [C]). Nessun flag di verità: la scelta determina l'ultima riga del monologo a Diane — l'interpretazione con cui SI ESCE, leggibile, mai "giusta".

==================================================
## 11. Personaggi e relazioni
==================================================

Compresso: desiderio / paura / convinzione falsa / agenda / sa–gli è negato / tattica / svolta / stato finale.

- **Cooper**: chiudere proteggendo / che l'intuizione sia vera / "conoscere=proteggere" / il metodo doppio / sa il sogno che non ricorda (negato: il nome) / gentilezza metodica / la morte di Maddy / custode di ciò che il verbale non tiene.
- **Truman**: che il paese resti suo / dover arrestare un amico / "qui ci conosciamo tutti" (la convinzione che il gioco demolisce) / proteggere le persone PRIMA del caso / sa il paese, gli è negato il soprannaturale (o gli è negato finché S2 non lo apre) / lealtà concreta / la penna posata / sceriffo che non appende più la giacca (T4). **Agente, non accompagnatore**: in M9 OPPONE attrito al mandato; in M10 decide cosa verbalizzare; con S3-OFF decide se testimoniare.
- **Leland — separazione obbligatoria**: *azioni compiute*: gli omicidi, la bugia su Missoula (fatti, mai relativizzati). *Memoria*: lacunosa (il gioco non certifica quanto). *Responsabilità*: FRATTURATA non cancellata — perpetratore, strumento e vittima insieme [dalla correzione d'esame]. *Influenza di BOB*: reale nel canone del progetto, MAI quantificata a sistema. *Cooper interpreta*: pietà senza assoluzione. *Il player interpreta*: libero (il gioco offre i tre registri della scena, §14). *Il gioco rifiuta di risolvere*: dove finisce l'uomo e comincia l'ospite.
- **Sarah**: essere creduta / la propria casa / "l'ho solo sognato" / vede e non può dire / la visione [P] / il lutto due volte.
- **Audrey**: contare / essere invisibile / "posso farcela da sola" / indaga in proprio / OEJ / salvata (o no: l'arco resta laterale ma il suo esito è letto [P]).
- **James/Donna**: lutto pulito / il segreto del cuore / "proteggiamo la memoria di Laura" / trattengono la prova / R5 li sporca.
- **Jacques**: farla franca / la giurisdizione / "sono solo un contrabbandiere" / nega / arrestato, eliminato.
- **BOB**: §3 — necessario vs ipotesi, mai onnisciente.

**Rete dei conflitti** (tensione NON riducibile al caso, per coppia): Cooper–Truman: metodo federale vs protezione locale (S2 la modula). Truman–Leland: vent'anni di amicizia vs il mandato. Cooper–Sarah: il testimone attendibile che nessun verbale accetta. Audrey–Ben: contare per il padre. James–Donna: il lutto conteso. Log Lady–paese: la credibilità dell'inascoltata. Cooper–Leland: l'empatia estesa al carnefice (il conflitto più caro al tema).

==================================================
## 12. Worldbuilding funzionale e luoghi
==================================================

Per luogo: funzione/proprietà/uso reale → rotte → conflitto contenuto → cosa cambia fra atti → oggetto risemantizzato → perché esiste senza la trama. (Identità visiva/sonora: si estende la grammatica di [[Direzione Artistica - Interrogatorio Leland]] CON le correzioni: gerarchie non dogmi, max 2 segnali, accessibilità sopra la purezza.)

- **Town**: il connettivo civico (piazza, bacheca implicita nei cartelli [P]) — rotta pubblica: le strade; privata: il varco del bosco. Contiene: il decoro che non guarda. Cambia: da vetrina (A1) a percorso d'urgenza (M8: la STESSA mappa corsa col cuore in gola) a paese post-verità (epilogo). Risemantizzato: il lago — da landmark a ferita. Esiste perché: ci si vive.
- **Sheriff**: la casa della legge (direzione già stabilita, con revisione). Risemantizzato: il radiatore. 
- **Palmer**: la casa come teatro del decoro — rotta pubblica: il salotto; privata: la scala/la camera (6,1). Cambia: A1 lutto composto → A4 sfaldamento (leland_a4/dove/dopo [P]) → A5 vuota (entrambi i Leland cond:!atto5 [P] — la casa senza di lui È il cambiamento). Risemantizzato: la camera di Laura, due volte (prova → reliquia).
- **Hotel GN**: commercio che ospita il caso (315, specchio). Il potere economico (Ben) fa da sfondo, non da motore [P]. Risemantizzato: lo specchio (toeletta → soglia del Gigante).
- **Hospital**: dove si ripara professionalmente (§5 grammatica) e dove il caso perde i suoi testimoni (Ronette muta, Jacques morto). Contiene: la fragilità dei vivi come problema investigativo.
- **Diner**: il sociale non istituzionale — dove parlano quelli che in centrale non parlerebbero (James, Log Lady). Processo continuo: il ciclo delle ciambelle verso la centrale (economia reale [Direzione Artistica §4]).
- **Woods/transenna**: il confine dentro/fuori — needsClues:3 con blockedMsg diegetico [P] + R1 (pista, non contatore).
- **Redroom**: il fuori-griglia (unica mappa TUTTA infrazione — grammatica §5); trappola one-way [P] = il sogno non si rivisita.
- **Traincar**: l'unico luogo dove il crimine parla senza dialoghi (evidenza ambientale). Semi-esterno, oltre la città: la geografia dice "portata via".
- **OEJ**: il vizio oltre il fiume; esclusione sociale attiva (ci si entra per pressione, non per invito).
- **Roadhouse**: il palco del paese — l'annuncio pubblico ("sta accadendo di nuovo") in un luogo di svago: il presagio consegnato dove il paese si diverte.

Ogni luogo: ≥1 personaggio, ≥1 processo economico/sociale (segheria/ciambelle/contrabbando/turismo), ≥1 conseguenza narrativa.

==================================================
## 13. Ritmo
==================================================

| Fase | Durata ~ | Missione | Verbo | Pressione | Domanda che tiene | Rischio |
|---|---|---|---|---|---|---|
| Introduzione | 10' | M1 | camminare/parlare | bassa | chi era Laura? | noia se il paese non offre texture (mitigato: lore opzionale denso [P]) |
| Investigazione I | 10' | M2 | esaminare | media | cosa temeva? | — |
| Scoperta onirica | 5' | M3 | attraversare | alta→zero | cosa ho appena visto? | sovraccarico (mitigato: il risveglio azzera) |
| Investigazione II + relazione | 15' | M4 | parlare/presentare | media | chi è BOB? | spin fra tre edifici (mitigato: obiettivo col diner esplicito [P]) |
| Scoperta materiale | 10' | M5 | ricostruire | media-alta | cosa accadde qui? | — |
| Falsa soluzione | 10' | M6 | pressare | alta | è lui? | — |
| **Sollievo→sorpresa** | 3' | lucy_a3 | subire | picco secco | chi arriva ai testimoni? | — |
| Mistero/presagio | 7' | M7 | annotare | media (respiro DOPO la sorpresa — non si sale sempre) | credo agli enigmi? | — |
| Pressione/lutto | 12' | M8 | correre/trovare | massima→lutto | a chi tocca? | il lutto va lasciato respirare: dopo il lago, il gioco NON incalza (l'obiettivo cambia solo dopo lago_dopo) |
| Preparazione | 5' | M9 | presentare | alta e fredda | reggerà? | — |
| Climax | 10' | M10 | scegliere metodo/registrare | massima interna | può la stanza contenerlo? | — |
| Aftermath | 8' | Loggia+epilogo | attraversare/interpretare | discesa | cosa porto fuori? | — |

Totale ~105'. Ogni rivelazione maggiore ha coda di comprensione (risveglio dopo M3, enigmi dopo la morte di Jacques, lago_dopo dopo il lago, epilogo dopo la Loggia).

==================================================
## 14. Revisione dell'Atto 5 — scheda missione M10 "L'interrogatorio"
==================================================

Mantiene: casa della legge, domesticità, registratore, radiatore, confessione, morte, accesso Loggia. Applica TUTTE le correzioni d'esame.

- **ID/atto**: M10, Atto 5, mappa sheriff (zona nord). Causa ereditata: il mandato presentato dal player (M9).
- **Obiettivo mostrato**: "Interroga Leland Palmer alla centrale". Motivazione di Cooper: la verità senza distruggere l'uomo. Obiettivo opposto: [ipotesi dichiarata] una confessione che il verbale non possa usare — DIMOSTRATA nella forma: la confessione alterna dettagli verificabili (il vagone, il biglietto) e affermazioni impossibili, E Cooper la anticipa («Diane, ciò che sta per entrare nel nastro non reggerà in nessuna aula. È esattamente ciò che lui vuole» — l'ipotesi diventa comportamento + conseguenza anticipata).
- **Posta immediata**: quale versione della verità esisterà — e per chi.
- **Verbi**: scegliere il metodo; presentare; decidere il nastro. Problema spaziale: il gradiente di densità fino alla stanza. Informativo: far parlare chi risponde "da avvocato". Sociale: Truman nella stanza, amico di entrambi i lati del tavolo.
- **I tre metodi** (scelta all'ingresso, dal dialogo di Cooper con Truman — convergenti sulla confessione, [N]):
  1. *Probatorio*: si parte da Missoula e dalle lettere. Leland regge a lungo da avvocato; Truman verbalizza fitto; la confessione arriva TARDI, ricca di dati verificabili; l'uomo emerge solo alla fine. 
  2. *Personale*: si parte da Laura e da Sarah. Leland emerge SUBITO; BOB trasforma i ricordi più aggressivamente; Truman teme che Cooper stia oltrepassando; confessione emotivamente leggibile, proceduralmente fragile.
  3. *Intuitivo*: si parte dal sogno e da ROBERT. BOB affiora QUASI INVITATO; Truman capisce meno di tutti; la verità è più ampia e meno registrabile.
  Il metodo determina: quale Leland si vede per primo, cosa entra nel verbale, quale registro di confessione si porta nella Loggia (3 varianti della stessa scena, stessi fatti).
- **Affioramento di BOB — DUE segnali esatti**: bob dello sprite accelerato da seduto + registro linguistico (terza persona, sintassi corta). Niente sguardo in camera, niente effetti audio non fisici.
- **La scelta S3 (giustizia/pietà)**: al momento in cui la confessione scivola oltre l'usabile, il gioco offre UNA azione: lasciar girare il nastro o fermarlo.
  - *Nastro acceso*: la testimonianza esiste; Leland è esposto nel suo momento più nudo; se l'ipotesi-BOB è vera, il documento "inutilizzabile" esiste davvero; Truman non deve scegliere.
  - *Nastro spento*: Cooper protegge l'uomo; il verbale è monco; TRUMAN DECIDE (agente): la sua pagina cambia — sceglie se la sua memoria diventerà testimonianza; la relazione Cooper-Truman ne esce alterata fino all'epilogo.
  - Riconvergenza: confessione avvenuta, morte in cella, Loggia — i FATTI non cambiano; cambiano prova, responsabilità, ruolo di Truman, monologo finale, e che cosa il player chiama vittoria.
- **Laura resta il centro morale**: la foto spostata dalla linea visiva, mai a faccia in giù; la domanda del perdono resta senza risposta E il beat successivo appartiene a Laura (il monologo cita LEI, non il dolore di lui).
- **Responsabilità fratturata**: la chiusura di Cooper (variante per metodo) non pronuncia mai assoluzione: «Ha fatto ciò che ha fatto. Non tutto ciò che ha fatto era suo. Nessuna delle due frasi cancella l'altra.»
- **Interfaccia**: pagine sempre skippabili (tempo minimo breve); pausa possibile; "Diane" col rituale visibile (prende, guarda, non accende, si interrompe).
- **Svolta**: la confessione. **Conseguenza**: leland_morto; la musica non torna; radiatore solo. **Trattenuta**: se il nastro (o Truman) verrà creduto. **Nuova domanda**: cosa si chiude nella Loggia che qui non si è chiuso.
- **Perché giocata e non riassunta**: il metodo è del player, il nastro è del player, il costo è del player.

==================================================
## 15. Convergenza del finale
==================================================

La Loggia spende, uno per uno: *competenza investigativa* (le lettere/il ponte ROBERT tornano come prova d'ingresso: il Nano parla solo a chi "ha fatto l'aritmetica" — riuso del verbo presentare); *relazione* (l'ultima pagina di Truman prima del bosco varia con S2/S3); *scelta precedente* (S1: l'anello in tasca o no cambia la moneta della Loggia); *catena di indizi* (il fascicolo riletto dal Nano "al contrario"); *conoscenza vs intuizione* (il nome dimenticato: il player lo sapeva dall'Atto 1 — la Loggia salda l'ironia drammatica Q2); *luogo risemantizzato* (la Stanza Rossa, ora a due direzioni: si entra da svegli dove si era entrati sognando); *giustizia/pietà* (l'eco di S3 nell'ultima frase di BOB); *responsabilità fratturata* (Leland nella Loggia: né dannato né assolto — presente); *identità sensoriale* (il rosso, contingentato per tutto il gioco, qui è il luogo).
Verbi: solo quelli appresi (muoversi, parlare, presentare, interpretare — S4). Niente meccaniche nuove, niente oggetto risolutivo, niente spiegazione totale di BOB, nessuna confessione definitiva.
**Fisso**: l'attraversamento, "ti rivedrò fra 25 anni", il ritorno. **Dal player**: la moneta (S1), il registro del congedo (metodo M10), l'interpretazione (S4). **Ambiguo per statuto**: cosa è BOB; quanto Leland ricordava. **Risolto**: il caso, l'aritmetica delle lettere, il destino dei testimoni. **Si porta fuori**: la versione della verità costruita + l'interpretazione scelta. **Il mondo dopo**: town in epilogo — stessa mappa, dialoghi accorciati di un grado, il lago con una riga nuova; il paese continua, e ora continuare si legge in due modi (coraggio/rimozione — T4 esteso al paese).

==================================================
## 16. Produzione e scope
==================================================

| Elemento | Classe | Note |
|---|---|---|
| R1 (riga diario→bosco), R3 (enigmi come predizioni), R6 (verbale cita Ronette), obiettivi riformulati | **semplice contenuto** | solo data.js: testi+cond esistenti |
| R2/R4 (presentazione indizi a Truman) | **modifica moderata** | serve UI "presenta indizio" nel dialogo (menu X già esiste; nuova interazione dialogo↔clues). Riusata 3 volte (M4, M9, Loggia): costo ammortizzato |
| S1 anello, S2 sogno (flag+varianti di pagina) | **semplice contenuto** | flag nuovi + rami di pagina; nessun sistema |
| S3 registratore + Truman variante | **modifica moderata** | un prompt di scelta in dialogo (il motore ha solo avanzamento: serve il widget scelta A/B — UNA nuova funzionalità piccola, riusata da S4) |
| Tre metodi M10 | **semplice contenuto** (3 cascate di pagine sugli stessi flag) | nessun sistema nuovo se esiste il widget scelta |
| S4 interpretazione finale | **semplice contenuto** | riusa il widget |
| Fusione biglietto+anello, taglio hawk_vagone, lettura mfap_finale_visto | **semplice contenuto** | riduzioni |
| Epilogo town (dialoghi accorciati, riga lago) | **semplice contenuto** | cascate cond:leland_morto |
| Timeline offscreen BOB | **già supportato** | è design: si esprime nei testi esistenti |
| FUORI SCOPE dichiarato | — | nuove mappe (stanza interrogatorio separata: si usa la zona nord di sheriff), nuovi sprite oltre 1-2 frame varianti, qualunque sistema di reputazione/punteggio |

Rischio principale: il **widget di scelta** è l'unica funzionalità nuova (engine.js) — tutto il resto è data.js. Stima onesta: ~200-300 righe di dialogo nuove totali, 8-10 flag nuovi, 1 widget, 0 mappe, 0 sistemi di simulazione. Guardia: smoke hardcoda le pressioni-tasto per nodo (MEMORY: pattern noto) — ogni pagina nuova su nodi del percorso smoke va gestita (fix candidato già annotato: playthrough length-agnostic).

==================================================
## 17. Self-audit (20 risposte)
==================================================

1. **Atto rimovibile senza rompere la trama**: il 3 quasi — Jacques è una falsa pista; ma rimuoverlo toglierebbe R5 (l'opposizione che agisce) e la scena primaria: la trama regge, il MOTORE no. Il più sottile è il 4 in versione attuale se non si gioca l'arco presagi: per questo R3 lo aggancia.
2. **Missione che ripete la strategia di un'altra**: M9 rischia di ripetere M4 (presentare a Truman) — differenziata dal costo (firmare il sospetto su un padre) e dall'attrito di Truman; da vigilare in scrittura.
3. **Cooper sa ciò che il player non ha guadagnato**: nell'attuale truman_atto5 la deduzione Leland è nel dialogo — riparato da R4.
4. **Il player ha un indizio che Cooper ignora**: il volto del sogno (deliberato, Q2) — l'unico caso, protetto.
5. **Transizione da coincidenza**: specchio→Gigante — riparata da R3.
6. **Visione che risolve invece di orientare**: nessuna dopo le riparazioni precedenti [P: scala gufi]; vigilare che l'enigma 2 non NOMINI il Roadhouse più di quanto già faccia.
7. **Sottotrama fan-service**: hawk_vagone (cameo) — tagliata/fusa.
8. **Personaggio solo distributore**: Lucy (consegna jacques_morto) — mitigazione a costo zero: la battuta arriva col SUO carattere (già parzialmente vero), non serve un arco.
9. **Luogo solo scenografia**: OEJ fuori dall'arco Audrey — accettato: è il luogo di UNA missione, la sua funzione sociale (esclusione) è dichiarata.
10. **Scelta cosmetica**: il rischio è S2 se le varianti restano una riga — la guardia è l'eco in M10 (quale Truman entra nella stanza). Se in scrittura l'eco non regge, S2 si taglia, non si finge.
11. **Indizio presente ma incomprensibile**: nome_sussurrato (il menu mostra un "?" di fatto) — accettato COME design (fantasma), ma la voce di menu deve dire esplicitamente "un nome dimenticato al risveglio", non un generico vuoto.
12. **Rivelazione che cambia solo la posta**: la morte di Jacques nella versione attuale alza la posta E cambia strategia (→ presagi) solo con R3 agganciato: senza, sarebbe solo shock.
13. **BOB come scusa anti-responsabilità**: il punto più sorvegliato — risposta strutturale: responsabilità fratturata (§14), fatti mai relativizzati, nessun flag "posseduto".
14. **Laura come oggetto della crescita altrui**: rischio reale nell'Atto 5 (già corretto: la foto, il beat del monologo) e nella Loggia — regola: l'ultima immagine del gioco appartiene a Laura ("ti rivedrò"), non al lutto di Cooper.
15. **Scena troppo fedele alla serie per funzionare come gioco**: il Roadhouse (gigante2) è quasi cutscene — mitigata dal CORRERE che segue (il beat giocato è la corsa, l'annuncio è il detonatore).
16. **La direzione artistica compensa una debolezza di trama**: T3/T4 della stazione coprivano la passività del player nell'interrogatorio — ora M10 dà il metodo e S3: la direzione torna a fare il suo mestiere.
17. **Climax eseguibile senza il player**: l'attuale leland_interr sì (dialogo lineare) — con metodo+S3 no: due decisioni del player DENTRO il climax.
18. **Contenuto oltre lo scope**: la timeline offscreen se diventasse simulazione — resta testo; il widget scelta è il limite massimo di engine accettato.
19. **Mistero che DEVE restare irrisolto**: cosa è BOB; quanto Leland sapeva. (E il terzo enigma: pagato, non spiegato.)
20. **Perché il finale appartiene a questo GIOCO**: perché spende cose che solo il giocare ha creato — l'ironia del nome visto-e-dimenticato (vissuta, non raccontabile), l'anello in tasca per scelta, il verbale che ha la forma del TUO metodo. La serie può mostrarlo; solo il gioco può fartelo aver fatto.

==================================================
## 18. Output finale
==================================================

**Cinque problemi strutturali più gravi (attuali)**
1. Gate a contatore (clues6) senza inferenza — il player completa, non deduce.
2. Deduzione-Leland consegnata dal dialogo, non costruita dal player (truman_atto5).
3. Climax eseguibile da spettatore: nessuna decisione dentro l'interrogatorio.
4. Apparizione del Gigante dipendente da coincidenza (nessuna regola dichiarata per il canale intuitivo).
5. Conflitto di valori dichiarato (giustizia/pietà) e mai giocato da nessuna azione.

**Cinque riparazioni prioritarie**
1. R2/R4 — presentazione attiva degli indizi ai due snodi (M4, M9), fail-forward senza softlock.
2. §14 — metodo d'interrogatorio a scelta + S3 registratore (con Truman agente).
3. R3 — enigmi come predizioni verificabili (regola del canale intuitivo).
4. R1 — il diario motiva il bosco (pista, non contatore).
5. R5/R6 + orfani — James/Donna al mandato, il verbale cita Ronette, mfap_finale_visto letto o tagliato.

**Tre missioni da tagliare/fondere/ridurre**
1. hawk_vagone → fuso in M5 (una pagina che rimanda agli oggetti).
2. biglietto_fuoco + anello → un'unica ricostruzione a due passi in M5.
3. Arco Audrey → RIDOTTO e dichiarato laterale (due contatti, esito letto): non si espande, non si taglia.

**Tre domande che richiedono decisione umana**
1. S2 (raccontare il sogno) regge un'eco sufficiente in M10 o va tagliata? (Costo scrittura vs profondità.)
2. Il widget di scelta A/B in engine.js è accettato come UNICA funzionalità nuova? (Senza, cadono S3/S4 e i metodi si riducono a ordine di pagine.)
3. L'epilogo in town dopo la Loggia (mondo ordinario rivisitato) vale ~30-40 righe di varianti, o il gioco chiude sulla Loggia come ora?

**Una frase — la promessa giocabile**
«Twin Peaks Game promette questo: camminerai in un paese disegnato per essere gentile, farai davvero il lavoro dell'investigatore — leggere, collegare, presentare, scegliere il metodo e il costo — e quando il caso si chiuderà scoprirai che cosa il tuo modo di chiuderlo ha lasciato aperto: la verità avrà la forma delle tue mani, e non ti assolverà.»
