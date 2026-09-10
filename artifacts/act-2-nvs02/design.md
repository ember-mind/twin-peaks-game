# Act 2 — Narrative Vertical Slice 02 — design (lead-authored)

Span: Room 315 wake-up (`intro_hotel`) → `atto3` (M4 completion). Production lane = mission M4 for Truman/Ronette/nurse/Gerard/James; classic lane for Room 315, lobby (Ben, Audrey), station staff, diner staff, town.

## 0. Diagnosis (Phase 1, condensed)

1. **Want and HUD disagree at the wake-up.** Cooper's monologue names Ronette as the living witness; the HUD says "Riferisci il sogno a Truman." A player who follows Cooper's words walks to the hospital first and gets the adapter stub «Non c'è altro da chiedere qui, per ora.» from Ronette, the nurse, Gerard, and at the diner from James.
2. **Both visits done, HUD still says "visit them".** Objective 200 stays until P2 is formulated in the notebook (T key), which nothing on screen asks for. Bored-player trap in the mandatory path.
3. **Post-beat stubs.** James, Gerard, the nurse (and Ronette between visits) answer with the stub after their node is done: four characters in the two rooms the act is about.
4. **The lobby is single-serving.** Ben Horne: four consecutive Ben pages, no want, no leak the player can catch, aphorism closer; Audrey: exposition + "so essere invisibile". No link between them (Ben denies knowing Laura's life; Audrey knows Laura worked for him).
5. **No character contrast on the dream.** Only Truman answers it ("persone sveglie"). Hawk, whose Act 1 contract was the woods/the door, says nothing new.
6. **Mystery deepening is not tied back.** The grey-haired smiling man of the dream is never connected to Sarah's man at the end of the hallway (capelli lunghi, il sorriso è rimasto); the player is not sent back to earlier evidence.
7. **The hook is cool.** "Dopo il ponte non ci sono case. Cominciamo dai binari." is procedure. Nothing makes the next step feel necessary.
8. **Room 315 does not react.** After Ronette says BOB, the blank notebook page in 315 is still blank in the same words.
9. **The nurse wears Norma's sprite** (placeholder in the adapter registry). A mandatory scene shows a diner owner in the ward.
10. **Gerard stands in the middle of the ward floor** while his text says he is turned to the window in the bed next to Ronette.

Not fixed (out of scope, recorded): classic `truman_a2`/`ronette_letto`/`gerard_a2`/`james_a2` are dead text still locked by classic tests; clue menu vs HUD objective disagreement; hospital and lobby remain legacy glyph art.

## 1. Final beat map

| # | Beat | Purpose | Player question | New information | Character function | Forward hook |
|---|---|---|---|---|---|---|
| 0 | Room 315 wake (once) | orientation, want | what was the name | name lost; Ronette breathes; **Harry first** | Cooper alone | station |
| 0b | Room 315 inspects (bed, desk, mirror) | texture | — | slept dressed; blank page; late reflection | Cooper | desk changes after BOB |
| 1 | Lobby, optional: Ben, Audrey (either order) | first lie of the act | what does the hotel know | Laura worked the perfume counter, Ben signed the shifts; Ben volunteers "la sera" and the casino | Ben deflects, Audrey exposes him | `audrey_indaga` → M6 |
| 2 | Station, Truman (M4 B1, mandatory) | report; recontextualize | who is the man | dream man = Sarah's man (long hair, the smile); Ronette awake; James at the diner | Truman: procedure, kindness | hospital + diner |
| 2b | Station, Hawk (optional, new variant) | contrast on the dream | is a dream evidence | "the name is on the other side of the door; things come back on their own" | Hawk: the dream is a place | 315 return |
| 3 | Hospital: nurse frame, Ronette two-question visit, BOB | the act's uncanny centre | is BOB the name I lost | a living witness says a name that matches no face in town; awake since two | nurse protects, Ronette cannot address | notebook |
| 3b | Hospital: nurse ctx, Gerard (optional) | second layer | who comes from behind | the word comes when a man enters silently; the poem | nurse vs Gerard: procedure vs trance | P4B (rejected) |
| 4 | Diner: James (mandatory); Norma echo | the human Laura | where did they meet | whole heart; "east, after the bridge"; three full cups | James points at a place, not a person; Norma protects | notebook |
| 5 | Notebook (T): comparison → P2 | player formulates | what does the pendant prove | P2 | — | Truman |
| 6 | Station: present P2 (mandatory) | act end | why now | **the bridge James named is where Ronette was picked up** | Truman gives the fact, Cooper only "da est" | east road open, Hawk waiting |

Dramatic engine check: Want = recover the name / find where Laura went. Obstacle = the name is gone; the witness has ten minutes a day. Opposition acting without waiting = Ronette woke at two, the same night, and repeats the word when a man enters behind her (BOB is present in the town, not waiting). Escalation = from a dream to a living voice to a place. Hidden truth planted = long hair + smile (Sarah, Act 1) ↔ dream man (B1). Value conflict deferred to M10.

## 2. Voice contracts (Act 2 speakers)

- **Cooper** — one question at a time; notices what people volunteer unasked; avoids saying he is afraid of the name; max one aphorism per act (none added).
- **Truman** — complete plain sentences, stops early; notices people; avoids the word "sogno" as evidence but never mocks it; gives facts he has (Sarah, Ronette, the bridge) and nothing he does not.
- **Hawk** — two sentences, then silence; notices shoes and ground; the dream is a place with a door; never explains.
- **Ben Horne** — hospitality as control; volunteers answers to questions not asked; avoids Laura's name in the present tense; redirects across the border.
- **Audrey** — exact facts about her father's paperwork (shifts, cards, the secretary); avoids saying she is bored; tests whether Cooper will treat her as an adult; has the last word.
- **Infermiera** — procedure and minutes; says what she sees, never the word; protects by ending visits.
- **Ronette** — three words in the game; the monitor speaks before she does.
- **Gerard** — negotiates with sleep; the poem is not learned, it comes; asks for small physical help.
- **James** — holds the full cup; points at places, refuses people; asks not to be told.
- **Norma** — counts cups; protects by redirecting; last word hers.

## 3. Dialogue (final text)

### 3.1 Classic (`js/data.js`)

`hotel_risveglio` — add page 5 (keep 1–4 exactly):
- COOPER: `Harry per primo. Poi lei.`

`benhorne_a2` — replace (4 pages, BEN|BEN|COOPER|BEN):
- BEN HORNE: `Agente Cooper. La 315 la scelgo io, per chi conta. Ha dormito?`
- BEN HORNE: `Laura Palmer era una ragazza perbene. Di quello che faceva la sera non so nulla. Nulla.`
- COOPER: `Non le ho ancora chiesto niente, signor Horne. La sera l'ha portata lei.`
- BEN HORNE: `Se cerca svago, oltre confine c'è un posto. Non l'ha saputo da me.`

`audrey_a2` — replace (4 pages, AUDREY|AUDREY|COOPER|AUDREY, `setFlag: 'audrey_indaga'`):
- AUDREY: `Laura lavorava al banco profumi. Qui, nella hall. Il turno lo firmava mio padre.`
- AUDREY: `C'è dell'altro. Per trovarlo devo essere nessuno, e in questo sono brava.`
- COOPER: `Un nome, un luogo, poi la hall. Se salta l'ultimo passo, chiamo suo padre.`
- AUDREY: `Al telefono di mio padre risponde la segretaria. Le lascio un messaggio?`

`audrey_a2_ben` — new (same as above, pages 1 and 3 replaced; `setFlag: 'audrey_indaga'`); NPC cascade `[{cond:'flag:done_benhorne_a2', then:'audrey_a2_ben'}, 'audrey_a2']`:
- AUDREY: `Le ha detto che non sa nulla? Laura timbrava al banco profumi, qui nella hall. Il cartellino lo firmava lui.`
- COOPER (page 3): `Lo stesso che firma il cartellino. Un nome, un luogo, poi la hall: se salta l'ultimo passo, chiamo lui.`

`hawk_a2` — new; cascade on `hawk`: `[{cond:'flag:sogno_fatto', then:'hawk_a2'}, 'hawk']`:
- HAWK: `Ha dormito con le scarpe. Si vede da come poggia i piedi.`
- COOPER: `Ho perso un nome, Hawk. L'avevo fino alla porta.`
- HAWK: `L'ha lasciato dall'altra parte della porta. Da lì le cose tornano da sole, non a comando.`

`norma_a2` — new; cascade on `norma`: `[{cond:['flag:sogno_fatto','flag:done_norma'], then:'norma_a2'}, 'norma']` (no setFlag, no again needed):
- NORMA: `Terza tazza. Le cambio quando si raffreddano. Lui non se ne accorge.`
- COOPER: `Da quanto è seduto a quel tavolo?`
- NORMA: `Da quando ho alzato la serranda. Ha chiesto se lei era già passato. Non ho detto di no.`

`scrivania_315_bob` — new; interact cascade `scrivania_315: [{cond:'evidence:T1_RONETTE_BOB', then:'scrivania_315_bob'}, 'scrivania_315']`:
- (no name): `La pagina bianca. La penna è dove l'ho lasciata.`
- COOPER: `Scrivo BOB. Tre lettere in stampatello, come le ha dette lei.`
- COOPER: `Le guardo e non so se sono il nome del sogno o solo il primo che ho sentito da sveglio.`
- again: COOPER: `BOB, in stampatello. La pagina non conferma e non smentisce.`

### 3.2 Mission M4 (`narrative/missions/M4.json` → regenerate `js/narrative-data.gen.js`)

`truman_a2` pages (7, replace text only; effects unchanged):
1. COOPER: `Harry. Stanotte ho sognato una stanza rossa. Laura era lì.`
2. COOPER: `Mi ha detto un nome all'orecchio. L'ho portato fino alla porta. Poi niente.`
3. TRUMAN: `Se torna, lo mettiamo a verbale. Per ora abbiamo persone sveglie.`
4. COOPER: `C'era anche un uomo. Capelli lunghi, grigi. Sorrideva mentre nessun altro lo faceva.`
5. TRUMAN: `Sarah ha detto capelli lunghi. E il sorriso. Se fosse di qui, avrei già un nome.`
6. TRUMAN: `Ronette si è svegliata stanotte. Non parla — ma è sveglia.`
7. TRUMAN: `E James è al Double R da stamattina. Norma dice che non tocca il caffè.`

`ronette_q` frame page 2 (nurse): `Dieci minuti, agente. Si è svegliata alle due. È sveglia, non è tornata.`

New guard nodes (before `sogno_raccontato`), each with a `repeat` page so they never stub:
- `ronette_attesa` (hospital/ronette, cond not sogno_raccontato): INFERMIERA `Non ancora, agente. Lo sceriffo ha chiesto di sapere prima di chiunque.` / COOPER `Allora prima lo sceriffo.` — repeat INFERMIERA `Prima lo sceriffo, agente.`
- `gerard_attesa` (hospital/gerard, cond not sogno_raccontato): action `(Gerard dorme girato verso la finestra. La manica sinistra è vuota.)` — repeat same action page.
- `infermiera_attesa` (hospital/infermiera, cond not sogno_raccontato): INFERMIERA `Il reparto apre alle visite quando lo dice lo sceriffo. Oggi non l'ha ancora detto.` — repeat same.
- `james_attesa` (diner/james, cond not sogno_raccontato): action `(James guarda la tazza. Non alza gli occhi.)` / JAMES `Non ancora. Non so ancora cosa dirle.` — repeat JAMES `Non ancora.`

Repeat pages on done nodes:
- `james_a2` repeat: JAMES `Se ci va, agente... ci vada di giorno.`
- `gerard_a2` repeat: action `(Gerard dorme. Le labbra continuano da sole.)`
- `infermiera_ctx` repeat: INFERMIERA `Quello che vedo io gliel'ho detto.`
- `ronette_q` after the terminal visit and before the reopen: INFERMIERA `Dorme. I dieci minuti sono finiti.` (mechanism per runtime; if the visit-state rules already yield a line, keep theirs).

Objectives (partition must stay exact; 100/300/400 unchanged):
- 200: `sogno_raccontato ∧ ¬P2 formulated ∧ ¬node_done james_a2` — text unchanged, optional_line unchanged.
- 225 (new `obj_m4_2b`): `sogno_raccontato ∧ ¬P2 ∧ node_done james_a2 ∧ ¬flag ronette_visita` — `Ronette, all'ospedale: ha dieci minuti. Poi il taccuino (T).`
- 250 (new `obj_m4_2c`): `sogno_raccontato ∧ ¬P2 ∧ node_done james_a2 ∧ flag ronette_visita` — `Taccuino (T): accosta le due metà del cuore alla strada di James.`

`present_truman_m4` P2 accepted pages (replace the 4 with 6):
1. COOPER: `Il pendaglio conferma che quel rapporto esisteva. Il paese non lo vedeva, e James non l'ha mai messo in piazza.`
2. COOPER: `I posti li ha detti lui: oltre il ponte, verso i binari.`
3. TRUMAN: `Il pendaglio dice che James parlava da dentro. La strada resta da controllare.`
4. TRUMAN: `Dopo il ponte non ci sono case. C'è il ponticello di legno dove hanno raccolto Ronette, la notte di Laura.`
5. COOPER: `Veniva da est.`
6. TRUMAN: `Da est. Hawk è già al ponte. Non toccate niente, nessuno dei due.`

Canon check: M4 lock forbids "est/vagone" before P2 — these lines are after acceptance. M5's on-site line "qui hanno trovato Ronette" becomes confirmation; Cooper's M5 synthesis ("stessa strada") stays M5's.

## 4. Environment requirements

| Env | Class | Action |
|---|---|---|
| room_315, sheriff, diner, town | A | none |
| hotel_gn (lobby) | B | text only (Ben/Audrey); legacy art stays |
| hospital | B | nurse sprite (replace Norma placeholder); Gerard moved beside the second bed (5–6,3) → stand at (7,3) facing left or (6,4) facing up, whichever keeps reachability; remove dead classic interact `ronette_letto` at 2,1 only if no test needs it (else leave) |
| Great Northern core, hospital native | D | deferred; not dramatically required |

## 5. Agency

Existing: hospital/diner order free; Ronette two-question budget; notebook comparison with two wrong answers. Added: Ben→Audrey echo; Hawk dream variant; Norma cup echo; desk in 315 after BOB; guard nodes turn stubs into in-fiction refusals; HUD rung for the notebook.

## 6. Acting

Stillness. No Character Life additions. Gerard's placement is the only staging change.
