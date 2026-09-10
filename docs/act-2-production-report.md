# Act 2 — Narrative Vertical Slice 02 — production report

Span: Room 315 wake-up → east road open (`atto3`). Date: 2026-09-09. Builds on NVS01 (Act 1) and Room 315. Working tree only: not committed, not deployed. Design source: `artifacts/act-2-nvs02/design.md`.

**Result: complete, pass with notes.** Act 2 (mission M4 plus its classic edges) now opens on an aligned want, refuses early visits in fiction, names the notebook step on screen, ties the dream man to Sarah's sighting, gives the lobby a catchable lie, lets Room 315 react to BOB, and ends by putting Ronette on James's bridge with Hawk already there. Verified in a real Chrome playthrough (wake → Truman → hospital → diner → notebook → Truman → save/reload → M5 footbridge) with no game-side console errors, and in `test/act-2-flow.js`. Nurse sprite added; Gerard staged at a bed; narrative widget text no longer hides under the portrait tag and mission dialogues now show the detailed portraits.

## 0. Structural finding

The browser build plays two narrative layers at once. Mission **M4 "I frammenti"** (`narrative/missions/M4.json`, runtime `js/narrative-runtime.js`, adapter `js/narrative-engine-adapter.js`) owns Truman, Ronette, the nurse, Gerard and James for the whole span; the classic layer (`js/data.js`, `js/glue.js`) owns Room 315, the lobby (Ben, Audrey), the station staff, the diner staff and the town. The classic `truman_a2`, `ronette_letto`, `gerard_a2`, `james_a2` in `js/data.js` are dead text in production, still exercised by `test/smoke.js` and `test/walkthrough.js`, which never load the mission stack. Act 2 design therefore had to be done on M4 plus the classic edges, not on the classic act 2.

## 1. Original Act 2 beat map (as found)

| # | Beat | Purpose | Player question | New information | Character function | Forward hook |
|---|---|---|---|---|---|---|
| 0 | Room 315 wake, 4-page Cooper monologue (once) | orientation | what was the name | name lost; Ronette breathes | Cooper alone | HUD: "Riferisci il sogno a Truman." (monologue says Ronette) |
| 0b | 315 inspects: bed, desk, mirror (static) | texture | — | slept dressed; blank page; late reflection | Cooper | none |
| 1 | Lobby (legacy map), optional: Ben Horne (4 Ben pages + aphorism), Audrey (exposition, `audrey_indaga`) | colour | — | perfume counter; casino across the border | clue dispensers, unlinked | M6 (Audrey) |
| 2 | Station, Truman (M4 B1, mandatory) | report | who is the man | grey-haired man matches nobody; Ronette woke; James at the diner | procedure | hospital + diner |
| 3 | Hospital: nurse frame, Ronette two-question visit, BOB | uncanny centre | is it the name | BOB | nurse protects | — |
| 3b | Nurse ctx, Gerard poem (optional) | second layer | who comes from behind | the word comes when a man enters silently; the poem | — | P4B (rejected later) |
| 4 | Diner, James (mandatory) | the human Laura | where | whole heart; "east, after the bridge" | points at a place | notebook |
| 5 | Notebook (T): comparison → P2 | formulate | what does the pendant prove | P2 | — | Truman |
| 6 | Station: present P2 → accepted | act end | — | "Dopo il ponte non ci sono case. Cominciamo dai binari." | procedure | east road, `atto3` |

Weak spots as found: wake want vs HUD mismatch; adapter stub «Non c'è altro da chiedere qui, per ora.» for Ronette/nurse/Gerard/James before Truman and after their beats; HUD says "visit Ronette and James" after both are done until the player finds the T key; Ben is single-serving; nobody but Truman answers the dream; the dream man is never tied to Sarah's man; Room 315 never reacts; the hook is cool; the nurse wears Norma's sprite; Gerard stands in the middle of the ward floor.

## 2. Major problems found

1. **Want/HUD contradiction at the wake** sends first-time players to the hospital, where every actor answers with the adapter stub.
2. **Silent HUD after both visits**: the mandatory notebook comparison (T key) has no on-screen prompt; objective 200 keeps saying "visit Ronette and James".
3. **Post-beat stubs** in the two rooms the act is about (James, Gerard, nurse; Ronette between visits).
4. **Lobby without drama**: Ben Horne dispenses respectability and an aphorism; Audrey dispenses a fact; the two never touch.
5. **No character contrast on the dream** (Truman only).
6. **Mystery not recontextualized**: dream man (long grey hair, smile) vs Sarah's Act 1 sighting (long hair, the smile remained) never joined in fiction.
7. **Cool hook**: place + procedure, nothing that makes the bridge necessary now.
8. **Room 315 static** after Ronette's BOB.
9. **Staging defects**: nurse = Norma sprite; Gerard not at a bed.

## 3. Final Act 2 beat map

| # | Beat | Purpose | Player question | New information | Character function | Forward hook |
|---|---|---|---|---|---|---|
| 0 | Room 315 wake (7 short screens; new close "Harry per primo. Poi lei.") | want aligned with HUD | what was the name | name lost; Ronette breathes; Harry first | Cooper | station |
| 0b | 315 inspects; desk changes after BOB | reactive room | is BOB the name | "non so se è il nome del sogno o solo il primo che ho sentito da sveglio" | Cooper | — |
| 1 | Lobby, optional, any order: Ben (deflects, volunteers "la sera" and the casino), Audrey (perfume counter, shifts signed by her father; variant if Ben was heard first: "Le ha detto che non sa nulla?") | first lie of the act, caught by exploration | what does the hotel know | Ben knows Laura's day job and denies her nights | Ben vs Audrey | `audrey_indaga` → M6 |
| 2 | Station, Truman B1 (tightened; "Sarah ha detto capelli lunghi. E il sorriso.") | report; recontextualize Act 1 | is the dream man Sarah's man | Ronette awake; James at the diner | Truman: facts he has, kindness | hospital + diner |
| 2b | Station, Hawk variant after the dream | contrast | is a dream evidence | "L'ha lasciato dall'altra parte della porta. Da lì le cose tornano da sole." | Hawk: the dream is a place | 315 |
| 3 | Hospital: guard before Truman (nurse refuses in fiction); nurse frame "svegliata alle due"; Ronette two-question visit; BOB | uncanny centre | is BOB the name | a living witness names what no face matches; same night | nurse protects, Ronette cannot address | notebook; HUD rung |
| 3b | Nurse ctx, Gerard at the bed (optional; repeat lines instead of stubs) | second layer | who comes from behind | — | procedure vs trance | P4B |
| 4 | Diner: James (guard before Truman; repeat after); Norma echo (three full cups; "ha chiesto se lei era già passato") | the human Laura | where | whole heart; east after the bridge | James points at a place; Norma protects | HUD rung → T |
| 5 | Notebook (T): comparison → P2; HUD: "Taccuino (T): accosta le due metà del cuore alla strada di James." | formulate | what does the pendant prove | P2 | — | Truman |
| 6 | Station: present P2 → accepted; **"il ponticello di legno dove hanno raccolto Ronette, la notte di Laura." / "Veniva da est." / "Hawk è già al ponte."** | act end | why now | James's route and Ronette's road meet at one bridge | Truman gives the fact; Cooper says only "da est" | east road open; M5 opens on site |

Dramatic engine: want = the name / where Laura went; obstacle = the name is gone, the witness has ten minutes; opposition acting unwitnessed = Ronette woke at two the same night and repeats the word when a man enters behind her; escalation = dream → living voice → place; hidden truth planted = long hair + smile (Sarah, Act 1) ↔ dream man (B1) ↔ BOB (Ronette); value conflict deferred to the confession (M10).

## 4. Character voice contracts

- **Cooper** — one question at a time; notices what people volunteer unasked; avoids saying he fears the name; no new aphorism in the act.
- **Truman** — plain complete sentences, stops early; notices people; never mocks the dream, never uses it as evidence; gives the facts he has (Sarah, Ronette, the bridge) and nothing more.
- **Hawk** — two sentences, then silence; notices shoes and ground; the dream is a place with a door; never explains.
- **Ben Horne** — hospitality as control; answers questions not asked; avoids Laura in the present tense; redirects across the border.
- **Audrey** — exact about her father's paperwork (shifts, cards, the secretary); avoids saying she is bored; tests whether Cooper treats her as an adult; last word hers.
- **Infermiera** — procedure and minutes; says what she sees, never the word; protects by ending visits.
- **Ronette** — three words in the game; the monitor speaks first.
- **Gerard** — negotiates with sleep; the poem is not learned, it comes; asks for small physical help.
- **James** — holds the full cup; points at places, refuses people; asks not to be told.
- **Norma** — counts cups; protects by redirecting; last word hers.

## 5. Dialogue / scene changes

All prose lead-authored (`artifacts/act-2-nvs02/design.md`); implementation mechanical. Classic text in `js/data.js`/`js/glue.js`; mission text in `narrative/missions/M4.json` (regenerated into `js/narrative-data.gen.js`).

| Entry | Layer | Change | Why |
|---|---|---|---|
| `hotel_risveglio` | classic | 4 → 7 pages: the old page 4 split into three screens; new close "Harry per primo. Poi lei." | want aligned with the HUD; no orphan screen |
| `benhorne_a2` | classic | rewritten 5 → 4 pages; Ben volunteers "la sera" and the casino, Cooper catches it ("La sera l'ha portata lei."), Ben redirects last | a leak the player can catch; no aphorism |
| `audrey_a2` / `audrey_a2_ben` (new) | classic | rewritten 4 pages; variant after Ben: "Le ha detto che non sa nulla? … Il cartellino lo firmava lui." / "Lo stesso che firma il cartellino…"; both set `audrey_indaga` | Ben's lie exposed by exploration order |
| `hawk_a2` (new) | classic, cascade on `sogno_fatto` | "Ha dormito con le scarpe." / "L'ha lasciato dall'altra parte della porta. Da lì le cose tornano da sole, non a comando." | second reading of the dream vs Truman's |
| `norma_a2` (new) | classic, cascade on `sogno_fatto ∧ done_norma` | three full cups; "Ha chiesto se lei era già passato. Non ho detto di no." | Truman's quote heard from its source; Norma protects |
| `scrivania_315_bob` (new, + again) | classic, cascade on `evidence:T1_RONETTE_BOB` | Cooper writes BOB on the blank page: "non so se sono il nome del sogno o solo il primo che ho sentito da sveglio" | the room reacts to the act's centre |
| `truman_a2` | M4 B1 | 7 pages tightened; new page 5 "Sarah ha detto capelli lunghi. E il sorriso. Se fosse di qui, avrei già un nome." | dream man ↔ Sarah's Act 1 sighting |
| `ronette_q` frame | M4 B2 | nurse: "Si è svegliata alle due. È sveglia, non è tornata." | same-night synchronicity |
| `ronette_attesa`, `gerard_attesa`, `infermiera_attesa`, `james_attesa` (new) | M4 guard nodes (`sogno_fatto ∧ ¬sogno_raccontato`) with repeat pages | in-fiction refusals before the report to Truman | replaces the adapter stub |
| `james_a2`, `gerard_a2`, `infermiera_ctx` | M4 | repeat pages (Cooper) | replaces the stub/silence after the beat |
| M4 objectives | M4 | 200 narrowed; new 225 "Ronette, all'ospedale: ha dieci minuti. Poi il taccuino (T)." and 250 "Taccuino (T): accosta le due metà del cuore alla strada di James." | the mandatory notebook step is now on screen |
| `present_truman_m4` P2 accepted | M4 B9 | 4 → 6 pages: "…il ponticello di legno dove hanno raccolto Ronette, la notte di Laura." / "Veniva da est." / "Da est. Hawk è già al ponte. Non toccate niente, nessuno dei due." | the hook becomes necessary; M5's on-site line becomes confirmation |
| Narrative widget portraits | `js/retro-ui.js`, `js/engine.js`, `js/portraits.js`, `index.html` | mission pages now drive the same hires PNG portrait overlay and DOM name label as classic dialogues (`data-speaker-source="narrative"` CSS modifier at the narrative card rect); previously every M4–M9 line showed the 16 px procedural face and a cramped pixel name tag | Act 2's mandatory path runs almost entirely on the widget; user-reported |
| `env_hospital_bed_after_ronette` | `js/environmental-inspect.js` | gated on `evidence:T1_RONETTE_BOB` instead of the never-set classic flag | the bed variant is reachable in production |

Unchanged on purpose: Ronette's three words, the nurse ctx, Gerard's poem scene, James's scene body, Truman's rejection lines, the notebook comparison texts, all of Act 1.

## 6. Environment requirements and what was built

| Environment | Class | Done |
|---|---|---|
| Room 315, Sheriff's Station, Double R, Town | A — exists, usable | nothing |
| Great Northern lobby (`hotel_gn`, legacy glyph) | B — content adaptation | Ben/Audrey rewrite only |
| Hospital (`hospital`, legacy glyph) | B — content adaptation | nurse cast sprite `infermiera` (24 px authored frames + 16 px matrices, cap + pinafore + slate dress, one free atlas slot used, 25-actor atlas); Gerard moved from the ward floor (7,6) to the second bed (7,3) facing it; bed inspect variant fixed |
| Great Northern core, native hospital | D — deferred | not needed for the act to work; the act's strangeness lives in text and choice, not in the ward's paint |

No new location, no World catalog change, no LocationConnection added.

## 7. Player agency changes

Already present and kept: hospital/diner in any order; Ronette's two-question budget with a forced terminal question; the notebook comparison with two retryable wrong answers. Added: Ben→Audrey order changes what Audrey says; Hawk answers the dream only after it; Norma's second read exists only for the player who met her in Act 1; the 315 desk changes after BOB; the pre-Truman visits are refused in fiction and the refusal itself repeats; the HUD tells the player when the notebook is the next move.

## 8. Acting / animation changes

Stillness. No Character Life or Environment Reactions additions. Staging only: Gerard at the bed, the nurse in her own body. Ronette still stands on her bed tile (no lying pose exists; recorded in §12).

## 9. Pacing observations

Measured headless by `test/probe-act2-pacing.js` (`artifacts/act-2-nvs02/pacing.md`): real walk speed 213 ms/tile, reading at 12 chars/s (+0.6 s per page), 15 chars/s as fast reader.

| Metric | Value |
|---|---|
| Mandatory path (wake → east road open) | ~5.9 min (5.1 fast) |
| Mandatory + all optional beats | ~9.4 min (8.0 fast) |
| Walk before the first meaningful interaction after the wake | 95 tiles, ~20 s |
| Longest uninterrupted dialogue | James, 10 pages, ~63 s |
| Mandatory interactions | 6 (wake, Truman, Ronette, James, notebook, Truman) |
| Optional interactions | 9 (Ben, Audrey, Hawk, Gerard, nurse, Norma, bed, mirror, desk) |
| Walking, mandatory / with optional | 425 / 497 tiles |

Lenses. Narrative editor: every mandatory beat changes state or knowledge; the one long scene (James) is the act's best and was left whole. First-time player: the wake says Harry first, the HUD agrees, the hospital refuses politely if visited early, the notebook is named when it is the next move. Bored player: the two long walks (station ↔ hospital ↔ diner) have no beat on the way, and the notebook UI shows one menu item at a time; both noted in §12.

## 10. Validation

| Check | Result |
|---|---|
| `test/act-2-flow.js` (new, Node, no browser) | 47/47: guard roots before the report and their repeat pages; handoff to the real nodes after; objective ladder 100→200→225→250→300→400; repeat pages on James/Gerard/nurse; P2 accepted renders the 6 new pages and sets `atto3`; classic cascades (Audrey both branches set `audrey_indaga`, Hawk, Norma, desk on `evidence:T1_RONETTE_BOB`); Gerard's tile walkable and bedside; wake = 7 COOPER pages |
| `test/smoke.js` / `test/walkthrough.js` | 460 checks ✔ / 96 acquisitions, finale reached (no drop vs 94) |
| `test/narrative-validate.js` (+ m5/m6/m8/m9) | pass (4454 / 1583 / 3589 / 4237 / 3815): objective partition invariant holds in every sampled state, unique page ids, `atto3` still completion-only |
| `test/interaction-voice.js` | pass: classic 92/92, narrative 56/56, repeat 14/14 (world roots 41, variants 56, repeats 14); two lines rewritten to satisfy uniqueness/generic gates rather than relaxing the test |
| craft gates `dialogue-craft-regression` (193), `narrative-repair-contract` (36), `environmental-interactions` (96), `choice-prompts`, `choice-prompt-dedup`, `ronette-bob-provenance` (91), `letter-chain-provenance`, `tracks-provenance` | pass |
| world/location `narrative-slice-01`, `room-315-location`, `interior-zoning-reachability`, `location-traversal`, `world-engine-v0.1-catalog`, `retro-production` (54), `mobile-production` (20), `dialogue-presentation`, `retro-font` | pass |
| cast `character-runtime-contract`, `authored-cast-contract`, `cast-sprite-sheet` (36), `heartgold-visual-contract`, `character-life`, `station-population`, `tools/build-cast-authored.js --check` | pass (25 actors; atlas hash pins re-recorded, R129) |
| Full Node sweep (79 files) | 71 pass; `sprite-gates.js` pre-existing (same 7 gate lines before/after, nurse row clean); 5 browser-preview scripts (`*-preview.js`, `double-r-exterior-prototype.js`, `double-r-location.js`) are not Node entry points (`window is not defined` at line 3, pre-existing) |
| Real Chrome playthrough (`index.html`, new game, Act 1 state injected, Red Room exit) | wake fires in 315; hospital/diner guards refuse before Truman and repeat; Ben then Audrey variant; Truman B1; Hawk variant; Ronette visit (photo → BOB); nurse ctx; Gerard; James + repeat; HUD rung 250; notebook comparison → P2; presentation → the six hook pages; `atto3` on both layers; east door open; 315 desk echo; save/reload lands in the same state; M5 footbridge opens. One console exception, caused by the test harness passing an undefined tile to `interact`, not by the game |
| Pacing probe `test/probe-act2-pacing.js` | see §9 |
| Coldstage | **not run** (user hold) |
| Vault canonical sync | repo → vault, `check-canonical-sync` 90/90 equal, `test/canonical-sync.js` pass, `portrait-evidence-parity` pass; `CANONICAL-SYNC.md` log line appended |

## 11. Five-question verdict

1. **Do I understand what Cooper is trying to do now?** Yes. The wake ends on "Harry per primo. Poi lei."; the HUD says the same; every pre-Truman visit refuses in Truman's name; after James the HUD names the notebook.
2. **Did I learn something that changed the mystery?** Yes. The dream man is Sarah's man (long hair, the smile), a living witness names him BOB the same night, and the place James names is the bridge Ronette came down from the east. Three channels converge on one figure and one road.
3. **Do at least two characters feel specifically memorable?** Lead's hypothesis, yes: the nurse ("È sveglia, non è tornata"; the word comes when a man enters behind her), James (the full cup, "non me lo racconti mai"), and Ben caught volunteering "la sera". Human validation pending per the vault's Human Test Protocol.
4. **Did exploration / interaction matter?** Yes: Ben→Audrey order, Hawk after the dream, Norma's second read, the desk after BOB, the Ronette question budget, and the notebook comparison are all things a sprinting player will not see or will get wrong.
5. **At the end, do I want to continue immediately?** Yes: Truman puts Ronette on James's bridge and Hawk is already there. The next screen (M5's footbridge) confirms it on site.

Verdict: **complete, pass with notes** (§12).

## 12. Known weaknesses

- Ronette is skippable: M4 completion needs only P2. The HUD nudges (rung 225) but does not force the hospital; a sprinter can reach the east road without hearing BOB.
- The two long town crossings (station ↔ hospital ↔ diner, ~30 s each) have no beat on the way; the town's east side is scenery.
- Ronette stands on her bed tile (no lying pose in the cast); the ward and the lobby remain legacy glyph rooms.
- The notebook and choice widgets show one menu item at a time in a mostly empty box (pre-existing UI); the bitmap font drops accents and renders «» as spaces.
- Classic `truman_a2`, `ronette_letto`, `gerard_a2`, `james_a2` remain dead text in `js/data.js`, locked by `smoke.js`/`walkthrough.js`; the classic clue menu freezes at four evidence items while the notebook fills (pre-existing, documented in `artifacts/act-2-nvs02/` traces).
- The 16 px legacy sprite archive is frozen at 24 actors; `tools/build-heartgold-cast.js --verify-only` still expects 24 (documented in `assets/sprites/CAST.md`).
- Truman's end-of-act line "dove hanno raccolto Ronette" moves a fact that M5 revealed on site to the end of M4; M5's action page now reads as confirmation. Deliberate (clue before inference), recorded here in case the M5 lock is revisited.
- No fresh-context craft critic and no human test were run on the new prose (lead review + mechanical gates only).
- Coldstage not run (user hold); no runtime scenario covers the guard nodes or the new objective rungs beyond `test/act-2-flow.js`.

## 13. Recommended next milestone

**Act 3 pass on M5 + M6 with the same method** (the traincar and One Eyed Jacks): beat map, voice contracts for Hawk/Jacques/Audrey, cut the closer formula in the classic bridges (`truman_wait3`, `truman_atto3` are dead; M5/M6 text is live), and resolve the Giant split (classic `gigante1_dlg` gates `m6_atto4_bridge`; the Roadhouse beat exists twice). Before that, one human test of Acts 1–2 with the five fixed questions. Not implemented here.

## How to play the finished Act 2

1. Serve the repo root over HTTP (no-cache server preferred), open `index.html`, press **N**.
2. Play Act 1 as in `docs/narrative-vertical-slice-01-report.md` (Truman → Double R → Palmer house → woods → Red Room → Laura), exit the Red Room between the curtains: you wake in **Room 315**.
3. Inspect the bed, the desk and the mirror if you like; leave by the south door into the lobby: **Ben Horne** at the front desk, **Audrey** wandering (talk to Ben first for her sharper variant). Out to town.
4. Sheriff's Station: **Truman** (report the dream); **Hawk** at the south desk has a new line.
5. Hospital (town door 23,6): **the nurse**, **Ronette** (choose one question, then the man), the nurse again, **Gerard** at the second bed.
6. Double R: **James** at the booth; **Norma** at the counter.
7. Press **T** (or the TACCUINO button on mobile): *Confronta* → select "le due metà combaciano" and "James: oltre il ponte, verso i binari" → answer "Conferma che James parlava da un rapporto privato…".
8. Back to **Truman**: present the link. The east road (town 55,14) opens; Act 2 ends on "Da est. Hawk è già al ponte."
9. Optional after step 5: return to Room 315 and read the desk.

Headless: `node test/act-2-flow.js` (flow), `node test/probe-act2-pacing.js` (pacing). Evidence: `artifacts/act-2-nvs02/hook-ingame.jpg`, `widget-inset-after.png`, `nurse-frames-8x.png`, `cast-preview-4x.png`, `pacing.md`, `design.md`.
