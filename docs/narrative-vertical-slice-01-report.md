# Narrative Vertical Slice 01 — report

Acts 1–2 opening, from playable world to playable story. Date: 2026-09-09. Builds on Production Vertical Slice 01 (frozen; see §10 for the freeze hygiene). Working tree only: not committed, not deployed.

## 0. Production hygiene (Phase 0, frozen PVS01)

- Canonical sync repo → vault: 18 files copied (14 divergent, 4 missing); `node tools/check-canonical-sync.js` now 86/86 equal; `test/canonical-sync.js` count updated 69 → 86.
- 12 legacy browser harness pages migrated to the 16×12 station geometry (spawn 7,10 up; exit 7,11; Truman approach 10,5). `js/render3d.js` untouched (legacy lane).
- Coldstage: five scoped review records (`pass-with-notes`, reviewer lead) written under `.coldstage/reviews/2026-09-09T09-21-30-825Z-…/`; baselines replaced for `visual`, `sheriffsStation`, `diner` (0 px delta on the interior), `dinerAmbient`, `dinerEnvironment` (deltas limited to timed neon/lamp/glass/clock effects); first baselines created for `dinerExterior`, `dinerLocation`, `characterLife`, `stationP`. Replacing an `unchanged` scenario's baseline mid-batch broke the manifest chain for its siblings; repaired in §10a. Lesson recorded: approve unchanged scenarios last.
- Native-suite triage: `sprite-gates.js` is a stale R68 gate written for the 16 px cast and fails on the current 24 px cast on side-bbox/neck/tone metrics — pre-existing since the cast change, not fixed; `portrait-evidence-parity.js` pre-existing hash drift; `double-r-location.js` browser-only. All other `test/*.js` with a Node entry point pass.

## 1. Original beat map (as found)

Facts from `js/data.js`, `js/glue.js`, `js/maps.js`, `test/walkthrough.js`; pacing from `artifacts/narrative-vertical-slice-01/original-pacing.md` (mandatory acts 1–2 ≈ 6.1 min at 12 chars/s; Town → Station → Town → Double R alone ≈ 1.5 min).

| # | Beat | Purpose | Player question | New information | Character function | Forward hook |
|---|---|---|---|---|---|---|
| 0 | Title → intro (3 pages, "11:30") → spawn south varco → `town_arrivo` | premise + first objective | who is the sheriff, where | Laura found at the lake in plastic; pie and coffee wish | Cooper's voice (Diane) | "la centrale, a ovest" |
| 1 | Town, optional: Bobby, Donna, Jacoby, sign, waterfall, cemetery, grave, lake, locked hotel/hospital/roadhouse, woods sign "(Indizi §/3)" | texture | who knew Laura | Bobby's alibi "con Shelly"; Donna's video; Jacoby "Laura mentiva bene" | witnesses | none: no beat reacts to another |
| 2 | Station: Truman (mandatory) gives `diario` | the file handover | what is in the diary | repeats intro (lake, plastic); "ROBERT", "lui"; again: "Hawk sta perlustrando" | file dispenser | HUD only: "Casa Palmer" (never said in fiction) |
| 2b | Lucy / Andy / Hawk (optional) | station life | who are these people | three breathing calls; Andy crying; footsteps that stop; Hawk promises to take Cooper to the spot now | colour | Hawk's promise contradicts the woods gate and Truman's "Hawk is out" |
| 3 | Palmer house: Sarah, Leland, `laura_room` (mandatory, gives `cuore` + `lettera_r` via Andy's radio) | second and third clue | who was in the house | man at the end of the hallway; Leland dances; half heart; letter R | family | woods opens (clues 3) |
| 4 | Double R (optional, unrouted in act 1): Norma, Shelly, Log Lady | texture | — | meals on wheels, "o quasi" (unanswered); Bobby lied (unconnected to Bobby); log saw, "fuoco cammina con me" | witnesses | none |
| 5 | Woods (gate clues 3): oil, grove sign → Red Room: Nano, Laura whispers a name → wake in 315 (act 2) | act 1 climax | what name | name lost on waking | dream | objective "Ronette e James" (no in-fiction wake beat) |

Act 2 (outside the slice): Truman a2 → Great Northern (Ben, Audrey) → hospital (Ronette, Gerard → `poesia_fuoco`) → James at the diner (`cuore_intero`) → Truman → act 3.

## 2. Major narrative problems found

1. **Exposition repeated**: Truman page 2 restates intro page 2 verbatim (lake, plastic). Zero new information in the mandatory scene's second page.
2. **Truman is a file dispenser**: no want, no cost, no leak; the scene changes only inventory. The HUD then orders "Casa Palmer" that nobody in the fiction motivated.
3. **The Cooper closer formula**: every dialogue ends on a Cooper aphorism ("È una distinzione utile", "Un guasto non sceglie quando respirare"). Pattern fatigue and a tell of authorship.
4. **Contradictions in the station**: Truman says Hawk is patrolling while Hawk stands ten tiles away; Hawk offers to lead Cooper to the spot now while the woods refuse entry until three clues.
5. **The Double R is orphaned**: nothing routes there, Norma's "O quasi" is never picked up, Shelly's contradiction of Bobby has no listener. Exploration produces no connection: the fourth of the five questions fails.
6. **World-state mismatch**: intro says 11:30 while the whole slice is authored at early dusk.
7. **No wake beat**: the act 1 climax (name whispered, then lost) ends on a HUD line; the strongest hook in the game is delivered by a menu.
8. **Quest language at the woods**: "Servono altri indizi prima di inoltrarmi" is a meta-gate with a diegetic coat.
9. **The lake in act 1 is decorative**: `lago_sguardo` is act-4 text (sawmill smoke) used on the scene of the discovery on the day of the discovery.
10. Kept deliberately: Lucy's breathing calls stay an unresolved ambient setup (Lucy's character payoff is the act 3 hospital call); Sarah's hallway man is preserved for her own scene, only foreshadowed by Truman's incomplete sentence.

## 3. Final beat map (the 15–20 minute slice)

Route: Town → Sheriff's Station (lot, interior) → Town (lake) → Double R (lot, diner) → Town → Palmer house → Town → woods → Red Room → wake in 315. The four-stop sequence in the brief is the first movement; the pacing probe showed it cannot carry fifteen minutes alone, so the slice runs the whole existing act 1 spine to its own climax (evidence-based variation, decision recorded).

| # | Beat | Purpose | Player question | New information | Character function | Forward hook |
|---|---|---|---|---|---|---|
| 0 | Intro at 16:50, dusk; arrival monologue | premise, want | reach the sheriff | Laura at the lake; pie and coffee wish (setup) | Cooper alone | west |
| 1 | Station exterior: notice board (lake shore closed, date corrected twice) | mundane surplus, Truman's morning | what kind of sheriff | the day derailed | environment | door |
| 2 | Truman (mandatory): read the diary himself, shouldn't have; ROBERT; Sarah cannot finish a sentence with him; Laura did meals on wheels for Norma | want + leak + routing | who is "lui"; why can't Sarah speak | hidden Laura vs daytime Laura | Truman needs a stranger | "Prima il Double R, finché c'è luce" |
| 2b | Lucy (calls, three dots), Andy (report), Hawk (footsteps; "not tonight, when you know what to look for") — any order | contrast on one death | what's in the woods | breathing; steps that stop when he stops | three reactions to one death | Hawk's refusal explains the woods gate in fiction; Truman's again-line points at Hawk |
| 3 | Town: lake shore (yellow tape; found here, not killed here; no house in sight), Bobby, Donna, Jacoby, grave, sign | environmental evidence | who lies | "uccisa altrove" moved from Truman's mouth to the reeds; Bobby's alibi | witnesses | Bobby → Shelly |
| 4 | Double R: Norma serves the unordered pie (payoff of intro) → meals on wheels → "O quasi?" → "Chieda a Shelly"; Shelly (variant if Bobby heard: "non tutta la notte"); Log Lady; Norma again: the diary's cherries vs "quella che avanzava" | daytime Laura, first lie | which Laura is true | Laura embellished the ordinary; Bobby's alibi cracks; fire that walks | Norma protects, Shelly fears, Log Lady sees | objective → "Casa Palmer: la camera di Laura" |
| 5 | Palmer house: Sarah (unchanged), Leland (unchanged), Laura's room (variant: Andy has finished the report) → half heart, letter R | the two Lauras meet in one room | who was in the hallway | R: "lascerà il suo nome un pezzo alla volta" starts | family | woods open (3 clues) |
| 6 | Woods (gate line now Cooper's own refusal) → grove → Red Room: Nano, Laura whispers | climax | the name | the name | dream | — |
| 7 | Wake in 315 (new once-only monologue): had the name to the door, lost it; Ronette breathes | end hook | what was the name; who is Ronette | slice ends | Cooper | "Ronette in ospedale e James al diner" |

Dramatic shape check: arrival (0), promise (1–2b), investigative question (2: who is "lui"/which Laura), escalation/strange detail (2b Lucy, Hawk; 4 Log Lady; 4 the first lie), character contrast (Truman/Hawk on the woods; Norma/Shelly on Laura), reward (lake evidence, Shelly↔Bobby, Norma's again, Andy's radio), end hook (7).

## 4. Character voice contracts

- **Cooper** — rhythm: short declaratives to Diane, one question at a time to people. Notices: what's been corrected, what's missing, timing. Avoids: saying he is frightened; naming a suspect. Relationship: the outsider whose strangeness lets people finish sentences. Trait: he treats pie and evidence with equal seriousness; no more than one aphorism per scene.
- **Truman** — rhythm: plain, complete sentences, stops early. Notices: people, not objects. Avoids: saying he is ashamed (he read the diary); saying "I don't understand the woods" plainly (he says he stopped at twelve). Relationship: wants Cooper to ask what a friend cannot. Trait: admits limits without apology.
- **Lucy** — rhythm: fast, literal, capitals for emphasis. Notices: procedure and its gaps ("come si scrive un respiro"). Avoids: saying she was scared. Relationship: eager to be useful to the FBI. Trait: documents the undocumentable.
- **Andy** — rhythm: broken, apologetic. Notices: the number seventeen. Avoids: the word "morta". Relationship: wants permission to grieve. Trait: finishes the job first; the radio call pays it.
- **Hawk** — rhythm: two sentences, then silence. Notices: sound and its absence. Avoids: promising what the woods don't allow. Relationship: measures Cooper before trusting him ("camminerà davanti"). Trait: the woods are a person to him.
- **Norma** — rhythm: hospitality first, information as a side dish. Notices: who ate what. Avoids: naming who didn't love Laura; her own grief (corrects the diary with a joke). Relationship: feeds Cooper before he asks. Trait: protects by redirecting ("Chieda a Shelly").
- **Shelly** — rhythm: conditionals; every sentence has a door in it. Notices: who is watching. Avoids: giving an hour (an hour is a denuncia). Relationship: tests whether the law will protect her. Trait: she counts what Bobby checks.
- **Bobby** — rhythm: denial first, redirection second. Notices: who can be blamed. Avoids: an hour. Relationship: hostile, then protective of Shelly by accident. Trait: "Lo scriva, quello. Non il resto."
- **Log Lady** — rhythm: pronouncement, then domestic literalness. Notices: what the log saw. Avoids: explaining. Relationship: none; she addresses the case, not the agent. Trait: unchanged from the existing text (already distinct).
- **Sarah / Leland** — unchanged texts; contracts implicit (Sarah: cannot choose between two images; Leland: closes the curtains before dancing).

## 5. Dialogue and scene changes

All prose is lead-authored; implementation was mechanical (`artifacts/narrative-vertical-slice-01/implementation-spec.md`). Unchanged: Sarah, Leland, Jacoby, Bobby (first read), Log Lady, Nano, Laura's dream, all act 2+ text.

| Entry | Change | Why |
|---|---|---|
| `D.intro[0]` | 11:30 → 16:50, "col sole già dietro gli alberi" | world state is early dusk |
| `truman` | rewritten 4 → 6 pages: Truman read the diary himself and shouldn't have; ROBERT; Sarah cannot finish a sentence with him; meals on wheels for Norma; Cooper: Double R while there's light. `again`: Hawk is back, "io ho smesso di capirlo a dodici anni"; Cooper leaves the woods to those who still listen | remove repeated exposition; give Truman a want and a leak; motivate the Double R and the Palmer house in fiction |
| `lucy` | Cooper's aphorism cut; new close: "Ho messo tre puntini" | Lucy documents the undocumentable; the laugh is hers |
| `hawk` | "Non stasera… quando saprà cosa cercare, venga: da lì camminerà davanti" | resolves the contradiction with the woods gate; Hawk tests Cooper |
| `donna` | closer reduced to "Prima il film. Poi le domande." | cut the aphorism, keep Cooper's move |
| `norma` | rewritten: unordered pie (payoff of the intro), Thursday meals, "O quasi" → "il quasi ha un nome?" → "Chieda a Shelly"; sets `double_r_visitato`; `again`: the diary's cherries vs "quella che avanzava" | the diner becomes the daytime Laura and routes to Shelly; second read rewards the diary reader |
| `shelly` | Cooper asks where Bobby was | plain question, answered by a condition |
| `shelly_bobby` (new, after Bobby) | "Con me. Non tutta la notte." / hour vs denuncia | the first lie, only for the player who heard Bobby |
| `bobby_shelly` (new, after Shelly) | "Shelly dice un sacco di cose quando ha paura… Lo scriva, quello." | reverse echo |
| `laura_room_andy` (new, after Andy) | Andy opens the radio call with "ho finito il rapporto"; room text differs ("l'unico disordine") | Andy's station line pays off |
| `hotel_risveglio` (new, once on `hotel_gn`) | 6:20, slept dressed, had the name to the door, Ronette breathes | the act 1 hook is now a scene, not a HUD line |
| `lago_laura` (new, default lake text before the dream) | yellow tape; found here, not killed here; no house in sight | "uccisa altrove" moved from Truman's mouth to the reeds |
| `bacheca_centrale` (new, station exterior 9,6) | lake shore closed; signature steady, date corrected twice | mundane surplus about Truman's morning |
| `sign_woods` / `woods_blocked` | "Non entro nel bosco al buio senza sapere cosa cercare." | Cooper's refusal instead of quest language |
| `D.objectives` | clues1 → "Il Double R, poi casa Palmer."; `double_r_visitato` → "Casa Palmer: la camera di Laura." | the ladder follows the fiction |

## 6. Environmental storytelling changes

- Lake shore in town (existing interact 15,28): act-1 text with tape, boots and intact reeds carries the "killed elsewhere" fact and Cooper's inference; no new object.
- Station notice board (existing art, new `objects` entry on the exterior scene map): Truman's corrected date.
- Character Life already pairs each station line with its idle: Lucy's telephone with the three calls, Andy's note with the report, Truman's file with the diary he read overnight. No frame added.
- Norma's pie is a narration line inside the dialogue (no gesture added); the diner counter now lets the player talk across it (§8), so the first instinct at the stool reaches Norma instead of the wood.
- Town frontages and the dusk grade from PVS01 now match the fiction (16:50, "finché c'è luce").

## 7. Player agency changes

- Order is free in the station (four NPCs, one mandatory), in town (lake, Bobby, Donna, Jacoby, sign, grave, cemetery) and in the diner (three NPCs, none mandatory in the graph; the objective ladder guides).
- State echoes without a branching engine (all via existing `cond` cascades on `done_*` flags): Shelly reacts to Bobby, Bobby reacts to Shelly, Laura's room reacts to Andy, Norma's second read reacts to the diary the player always has; Truman's second read points at Hawk.
- The Double R is a soft objective (text), not a gate: the walkthrough graph is unchanged in structure (92 acquisitions, +6 from the new entries).

## 8. Acting and animation changes

None added. Character Life v0.1 frozen. Considered and rejected: a crying pose for Andy (his line does the work; stillness reads as composure), a Truman "hands the file" pose (the handover is one screen long). Two engine-level touches, not systems: the unread sparkle now resolves cascades (Laura's dresser kept its glow after `cameraLaura` became a cascade), and `interact()` reaches one NPC across a solid counter tile when the tile has no authored object (Norma from the stools, Lucy from the reception). `js/engine.js` only, 10 lines, covered by `environmental-interactions`, `sheriffs-station-location`, `smoke`.

## 9. Final playtime and pacing observations

Measured on the production build (`node test/probe-acts12-pacing.js` for the mandatory spine; `node -e` count of the slice's dialogue characters; real speed 4.69 tiles/s; screens are 2 lines of ~24 characters).

| Metric | Value |
|---|---|
| Mandatory text (intro, arrival, Truman, room, Nano, dream, wake) | 2 567 chars, ≈ 58 screens |
| Optional text on the route (station 4, town 8, diner 4, Palmer 2, woods 3) | 4 740 chars, ≈ 106 screens |
| Mandatory reading at 12 chars/s (+0.6 s per screen) | ≈ 4.2 min |
| Everything at 12 chars/s | ≈ 11.8 min |
| Everything at 8 chars/s (first-time reader) | ≈ 16.9 min |
| Walking, mandatory route only | ≈ 190 tiles, ≈ 40 s; with exploration 2–3 min |
| Estimated slice, sprint / normal / thorough | ≈ 5 / 14 / 20 min |
| Time before first meaningful interaction | ≈ 45 s (intro + walk to the station) |
| Longest uninterrupted dialogue | Truman, 568 chars, ≈ 13 screens |
| Mandatory interactions | 5 (Truman, room, Nano, Laura, plus the wake monologue) |
| Optional interactions on the route | 21 |

Observations from the browser run (`http://127.0.0.1:8817`, new game, keyboard): the station is the densest room and the best; the town between the station and the diner is where a bored player could drift, so the lake text was placed on the way; the diner reads as a scene because Norma routes to Shelly; the Palmer house is short and heavy in the right way; the woods and the Red Room are unchanged and still the strongest ten screens in the game. Two-line screens split names ("Great / Northern"): a UI limitation, not fixed here.

Three review perspectives:
- Narrative editor: every mandatory beat changes state or knowledge; Truman is the only scene over ten screens and earns it (diary, leak, two routings). Cut candidates left in: Jacoby (optional, good).
- First-time player: knows what Cooper wants at every step (objective ladder + Truman's own words); the diner's "chieda a Shelly" and Hawk's "when you know what to look for" are the two moments where the game explains itself in character.
- Bored player: the likeliest quit point is the walk from the diner to the Palmer house (no beat on the way). Smallest fix applied: the objective text names the room, and Sarah's incomplete sentence has been planted by Truman so the house is a question, not a chore.

## 10. Validation

- `node test/smoke.js` 437 (from 428); `node test/walkthrough.js` 92 acquisitions (from 86), finale reached; `node test/genmaps.js` green; new `test/narrative-slice-01.js` 24 checks; `station-population`, `sheriffs-station-location`, `environmental-interactions` (96), `character-life`, `town-dusk` green.
- Craft gates kept and satisfied: `interaction-voice` (every first read has a Cooper move, no duplicated pages, no generic Cooper line), `dialogue-craft-regression` and `narrative-repair-contract` re-frozen on the approved text (see §10a below, filled after the run).
- Real playthrough in Chrome on the production `index.html`: arrival → notice board → Lucy/Andy/Hawk/Truman → lake → Bobby → diner (Norma, Norma again, Shelly variant, Log Lady) → Sarah/Leland/room (Andy variant) → woods gate → Nano → Laura → wake monologue. Every variant fired from the intended flag; the `once` flag `intro_hotel` persisted through the door save.
- Pre-existing failures unchanged: `sprite-gates.js` (R68 16 px gate vs 24 px cast), `portrait-evidence-parity.js` (hash drift), `double-r-location.js` (browser-only).
- Coldstage: see §10a.

### 10a. Coldstage final run

Last completed run on the final code (`artifacts/narrative-vertical-slice-01/coldstage-final.json`, run 2026-09-09T09-50-39Z): 19/19 scenarios runtime **pass**, 0 severe console errors (desktop 14/14, gameplay 9/9, mobile 14/14, mobileGameplay 15/15, landscape 13/13, cooper ×4, visual 3/3, diner 4/4, dinerAmbient/Environment/Gestures 3/3, dinerExterior 8/8, dinerLocation 11/11, sheriffsStation 9/9, characterLife 16/16, stationP 21/21). Pixel gate: `dinerAmbient`, `dinerEnvironment`, `dinerGestures`, `dinerExterior` unchanged; `visual`, `diner`, `sheriffsStation` reported `error` because the baseline manifest chain was invalidated when the diner baseline was replaced mid-batch (tool state, not rendering); `characterLife`, `stationP`, `dinerLocation` review-required — lead inspected the three diff sheets: differences limited to Character Life idle frames (Lucy telephone, blinks), the north wall panel state, Hawk's seated occluded pose (identical to the approved PVS01 canonical capture `artifacts/production-vertical-slice-01/interior-cast-native.png`; the agent-created baseline had captured the odd state) and a 0.008 % gesture frame in the diner. A repair pass (manifest re-approval + scoped records) was started and then stopped on the user's instruction to stop using Coldstage; the baseline manifest is therefore left in the mismatched state and the three review-required baselines are not advanced. Open item for the user: re-issue the baseline approvals with scoped review records when Coldstage is back in use.

## 11. Five-question verdict

1. **Do I know what Cooper wants?** Yes. The file, then the two Lauras, then the name; said by Cooper and Truman, mirrored by the ladder.
2. **Do I care about at least two people?** Yes, on the evidence of the lines that now carry a private cost: Truman (read the diary, shouldn't have), Lucy (three dots for a breath), Norma (the slice that was left over). Human validation pending per the vault's Human Test Protocol; this is the lead's hypothesis, not a measurement.
3. **Is there something I genuinely want to understand?** Yes: who "lui" is, why Sarah cannot finish the sentence, why Bobby's night has a hole in it, and, at the end, the name Cooper lost.
4. **Did playing matter, rather than only reading?** Yes, modestly: the lake, the notice board and Norma's second read exist only for the player who looks; Shelly, Bobby and the room answer differently depending on who was met first.
5. **At the end, do I want to continue?** Yes. The wake monologue turns the lost name into a task and names a living witness.

Verdict: **complete, pass with notes** (notes in §12).

## 12. Known narrative weaknesses

- The mandatory spine is still short (≈ 4 min of text); the slice reaches fifteen minutes through optional texture, which a sprinting player will skip. The design accepts this (honest linearity, expressive order).
- The wake happens in the Great Northern hall map (legacy art), not in a room: "Stanza 315" is a line, not a place.
- The diner→Palmer walk has no beat on the way; the Bookhouse/pharmacy strip is scenery.
- Lucy's breathing calls remain an unresolved ambient setup by choice.
- The bitmap font drops accents (è → e) on every screen; two-line screens split proper names. Pre-existing UI limits.
- Fresh-context craft critics were not run on the new prose in this milestone (lead review + mechanical gates only); a human test has not been run.
- Act 2 (Truman a2, Ben, Audrey, Gerard, Ronette, James) keeps its previous prose and the Cooper-closer formula.

## 13. Recommended next milestone

**Narrative Vertical Slice 02 — Act 2 (the hotel, the hospital, James)**: apply the same method (beat map, voice contracts, cut the closer formula, state echoes via `done_*` cascades) to the 6-beat act 2, give room 315 a real wake space or a wake beat inside the existing hall, and run one human test of slice 01 with the five fixed questions before touching act 3. Not implemented here.

## How to play the finished slice

1. Serve the repo root over HTTP (any static server; a no-cache one avoids stale scripts), open `index.html`, press **N** for a new game.
2. Read the three intro pages and the arrival line. Walk west along the civic strip to the **SHERIFF** frontage (town 12,20), enter the lot, read the notice board right of the doors, enter.
3. Inside: Lucy (reception, left), Andy (north desk), Hawk (south desk), Truman (sheriff desk, mandatory). Talk to Truman twice.
4. Back in town: the lake shore south (15,28), Bobby near the square, then east to the **DOUBLE R** (42,20): Norma at the counter (talk twice), Shelly in the booths, the Log Lady.
5. North to the **Palmer house** (42,6): Sarah, Leland, then Laura's room (dresser, top-left).
6. With three clues, the woods open at the north-east gate (50,0): follow the path to Glastonbury Grove and into the Red Room; talk to the little man, then to Laura.
7. Wake in the Great Northern: the slice ends on Cooper's morning monologue.
