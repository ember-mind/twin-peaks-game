# Narrative Vertical Slice 01 — implementation spec (lead-approved text)

All dialogue text below is FINAL. Implement verbatim (Italian, keep typographic apostrophes as in the existing file: escape `'` inside JS strings as the file does). No other dialogue changes. No engine architecture changes.

## 1. `js/data.js`

### 1.1 `D.intro[0]` → replace with
`Diane, sono le 16:50 del 24 febbraio. Entro a Twin Peaks, stato di Washington, col sole già dietro gli alberi. Non ne ho mai visti così tanti in vita mia.`
(intro[1], intro[2] unchanged)

### 1.2 `truman` → replace whole entry
pages:
1. TRUMAN — `Agente Cooper. Harry Truman. Il diario di Laura: l'ho letto io, stanotte. Non avrei dovuto. Conosco ogni nome che c'è dentro.`
2. TRUMAN — `Nelle pagine cifrate c'è un «lui». E un nome che qui non è di nessuno: ROBERT.`
3. COOPER — `Lo leggo stasera. Harry, chi devo vedere prima che il paese vada a dormire?`
4. TRUMAN — `Sarah Palmer. Ha chiamato due volte: c'era qualcuno in casa, dice. Con me non riesce a finire la frase.`
5. TRUMAN — `E il Double R. Laura portava i pasti a domicilio per Norma. Se vuole la Laura di giorno, cominci da lì.`
6. COOPER — `Con uno sconosciuto, forse, la frase la finisce. Prima il Double R, finché c'è luce.`
give: ['diario']
again.pages:
1. TRUMAN — `Hawk è rientrato all'alba. Chieda a lui cosa ha sentito nel bosco: io ho smesso di capirlo a dodici anni.`

### 1.3 `lucy` → replace pages
1. LUCY — `Agente Cooper! Tutte le chiamate passano dal mio centralino. TUTTE. Anche quelle strane.`
2. LUCY — `Stamattina ha squillato tre volte. Nessuno parlava. Si sentiva solo... un respiro.`
3. COOPER — `Mi scriva gli orari, Lucy.`
4. LUCY — `Già fatto. Ho scritto anche il respiro, ma non so come si scrive un respiro. Ho messo tre puntini.`

### 1.4 `hawk` → replace pages
1. HAWK — `Nel bosco distingui un animale da qualcuno che vuole essere sentito.`
2. HAWK — `Stanotte non ho sentito animali. Solo passi. Si fermavano quando mi fermavo io.`
3. COOPER — `Fammi vedere dove ti sei fermato.`
4. HAWK — `Non stasera. Il sentiero al buio non lo dà a nessuno. Quando saprà cosa cercare, venga: da lì camminerà davanti.`

### 1.5 `donna` → delete page 4 (the COOPER closer). Pages 1–3 unchanged.

### 1.6 `norma` → replace whole entry
pages:
1. NORMA — `Benvenuto al Double R. Si sieda, le porto un caffè.`
2. (name '') — `Norma posa la tazza, poi una fetta di torta di ciliegie che nessuno ha ordinato.`
3. COOPER — `Norma, questo è un caffè DANNATAMENTE BUONO. E la torta...`
4. NORMA — `Laura portava i pasti a domicilio per me. Il giovedì. Tutti le volevano bene. O quasi.`
5. COOPER — `Quasi?`
6. NORMA — `Chieda a Shelly. Io servo caffè.`
setFlag: 'double_r_visitato'
again.pages:
1. COOPER — `Nel diario Laura scrive che lei le teneva la fetta con più ciliegie.`
2. NORMA — `Le davo quella che avanzava. La mangiava come fosse la più bella.`

### 1.7 `shelly` → replace pages
1. SHELLY — `Bobby veniva da me quando diceva di essere con Laura. E da Laura quando diceva di essere con me.`
2. SHELLY — `Se gli chiedevo di lei, prima controllava la porta. Poi diceva che non c'era niente da sapere.`
3. COOPER — `Dov'era Bobby, quella notte?`
4. SHELLY — `Prima mi dica se lo proteggete. Se torna qui dopo che ho parlato, la porta la controllo io.`

### 1.8 NEW `shelly_bobby`
pages:
1. COOPER — `Bobby dice che quella notte era con lei. Lo ha ripetuto due volte.`
2. SHELLY — `Con me. Non tutta la notte.`
3. SHELLY — `Se l'orario glielo dà lui, è un orario. Se glielo do io, è una denuncia. Vede la differenza?`
4. COOPER — `La vedo. Per ora scrivo soltanto: non tutta la notte.`
setFlag: 'shelly_bobby'

### 1.9 NEW `bobby_shelly`
pages:
1. COOPER — `Shelly dice: non tutta la notte.`
2. BOBBY — `Shelly dice un sacco di cose quando ha paura.`
3. BOBBY — `Ha paura, agente. Lo scriva, quello. Non il resto.`

### 1.10 NEW `laura_room_andy` (same give as laura_room, same again)
pages:
1. COOPER — same as laura_room page 1
2. COOPER — same as laura_room page 2
3. (name '') — `La radio di Cooper gracchia. È Andy, dalla centrale.`
4. ANDY — `Agente, ho finito il rapporto. Poi ha chiamato il medico legale: carta sotto un'unghia di Laura. Un frammento della lettera R.`
give: ['cuore', 'lettera_r']; again: identical to laura_room.again

### 1.11 NEW `hotel_risveglio`
pages:
1. COOPER — `Diane, sono le 6:20. Stanza 315, Great Northern. Ho dormito vestito.`
2. COOPER — `Nel sogno Laura mi ha detto chi è stato. Lo avevo. L'ho tenuto fino alla porta della stanza rossa; poi la porta si è chiusa.`
3. COOPER — `Il nome è andato. Il resto no: nel fascicolo di Harry c'è un secondo nome, Ronette Pulaski. Respira ancora.`

### 1.12 NEW `lago_laura`
pages:
1. (name '') — `Nastro giallo tra i giunchi. La riva è calpestata da molti stivali, tutti di stamattina.`
2. COOPER — `Qui l'hanno trovata. Non qui l'hanno uccisa: i giunchi sono intatti, nessuno ha lottato su questa sabbia.`
3. COOPER — `Da qui non si vede nessuna casa. Chi l'ha lasciata sapeva di non essere visto.`

### 1.13 NEW `bacheca_centrale`
pages:
1. (name '') — `AVVISO: la riva del lago resta chiusa fino a nuovo ordine. Firmato: H. S. Truman, sceriffo.`
2. COOPER — `La firma è ferma. La data è stata corretta due volte.`

### 1.14 `sign_woods` page 2 and `woods_blocked` page 1 (COOPER) → replace text with
`Non entro nel bosco al buio senza sapere cosa cercare. (Indizi: §/3)`

### 1.15 `D.objectives` — replace the two bottom-most conditional entries so the ladder reads (top part unchanged):
```
{ cond: 'clues3', text: 'Segui il sentiero nel bosco.' },
{ cond: 'flag:double_r_visitato', text: 'Casa Palmer: la camera di Laura.' },
{ cond: 'clues1', text: 'Il Double R, poi casa Palmer.' },
{ cond: null, text: 'Parla con lo sceriffo Truman (a ovest).' }
```

## 2. `js/glue.js`
- `NPCS.town` bobby: `dialogue: [{ cond: 'flag:done_shelly', then: 'bobby_shelly' }, { cond: 'flag:done_shelly_bobby', then: 'bobby_shelly' }, 'bobby']`
- `NPCS.diner` shelly: `dialogue: [{ cond: 'flag:done_bobby', then: 'shelly_bobby' }, 'shelly']`
- `INTERACT_DLG.cameraLaura`: `[{ cond: 'flag:done_andy', then: 'laura_room_andy' }, 'laura_room']`
- `INTERACT_DLG.lago_riva`: `[ {maddy_trovata→lago_dopo}, {gigante2→lago_maddy}, { cond: 'flag:sogno_fatto', then: 'lago_sguardo' }, 'lago_laura' ]`
- `INTERACT_DLG.bacheca: 'bacheca_centrale'`
FIRST verify in `js/engine.js` how `done_<id>` flags are set (which id: dialogue id vs npc id; set at start or end of dialogue; also on `again` reads). Adjust cond keys accordingly and report what you found.

## 3. `js/maps.js`
- `hotel_gn`: add `onEnter: { dialogue: 'hotel_risveglio', once: 'intro_hotel' }` (same shape as town).
- Notice board interact on the Sheriff's Station exterior: the exterior map shell is registered by `js/sheriffs-station-exterior-scene.js` (not maps.js). Find the notice-board tile in `js/sheriffs-station-exterior-art.js`, and check how the engine resolves interactions for scene-registered maps (`objects` array on `GAME.Maps[id]`, see glue.js normalisation of `interact` → `objects` and engine `interact` lookup). If an `objects` entry `{ x, y, dialogue: 'bacheca_centrale' }` (or the exact shape glue produces) on the exterior map record works WITHOUT engine changes, add it in the scene file's map shell (or in `js/sheriffs-station-production.js` after install) and make sure the player can face it from a walkable tile. If it needs an engine change, DO NOT do it; report.

## 4. Tests
- `node test/smoke.js`, `node test/walkthrough.js` (acquisition count must be ≥ 86; report new number), `node test/genmaps.js`, `node test/station-population.js`, `node test/sheriffs-station-location.js`, `node test/probe-acts12-pacing.js` (should still complete; report new totals).
- If smoke's scripted playthrough asserts page counts or exact objective strings for changed entries, update those assertions minimally and list them.
- NEW `test/narrative-slice-01.js` (Node, same require chain as walkthrough.js): assert (a) shelly variant after bobby and bobby variant after shelly resolve through `resolveDialogue`; (b) `laura_room_andy` resolves when `done_andy` set and gives both clues (clue set identical to laura_room); (c) norma sets `double_r_visitato` and `D.objectiveFor` moves from 'Il Double R, poi casa Palmer.' to 'Casa Palmer: la camera di Laura.'; (d) `lago_riva` cascade: default → lago_laura, sogno_fatto → lago_sguardo; (e) hotel_gn onEnter shape + `intro_hotel` once flag; (f) every new dialogue id referenced in glue resolves in `D.dialogues`; (g) `bacheca` interact resolves if implemented.
Report: files changed, engine findings on `done_` flags, test counts, anything not implemented and why.
