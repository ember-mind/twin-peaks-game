# Test debt triage

Branch `qwen/night-test-debt-triage` from `3be8f56`, worktree `.worktrees/debt`. No game file changed; `js/retro-authored.js` untouched.

**Result.** Of the 28 failures on main, 23 are closed and 5 stay red with owners (sprite-gates, town-dusk, probe-act2-pacing, probe-act4-pacing, canonical-sync's Vault divergence). Nine of the 28 were not tests: 5 browser page scripts and 4 CLI tools sitting in `test/*.js`, now moved out. Thirteen were harnesses left behind by documented migrations (mostly Cast Presence b529711, plus M5 doors, M8 objects and one engine hash), now green with their pre-change numbers reproduced exactly. One probe was deleted. canonical-sync got its documented scope pin but stays red on Vault divergence. The sweep also shows 2 env-only failures you did not see on the main checkout. **No real game bug (verdict A) was found**, so no game file changed.

**Sweep scope.** Every `test/*.js` except Chrome drivers (`act-3/4/5-playthrough`, `capture-chrome`, `capture-roadhouse-cohesion`, `native-shot`, `performance-gate`, `run-browser-harness`, `step6-driver`, `visual-audit-capture`, `world-builder-browser`), `verify-shot` (needs a PNG argument) and generators (`gen-narrative-data`, `gen-world-data`, `genmaps`). Both runs use a fresh checkout without gitignored files: "before" is a detached worktree at 3be8f56, "after" is this branch. That is why two env failures (`authored-cast-contract`, `portrait-evidence-parity`) show up here but not in the list you ran on the main checkout.

## Verdicts

| test | verdict | first failing assertion / reason | action | cite |
|---|---|---|---|---|
| act-2-flow | B | `test/act-2-flow.js:161` "hotel_gn espone Ben Horne e Audrey": `GAME.Maps[*].npcs` is empty | classic path loads the Cast Presence resolver, baseline `bodiesFor(map, null)`; 48/48 as before | b529711, docs/cast-presence-v0.1-implementation-report.md §6 |
| dialogue-presentation | B | `:79` "interaction must open classic dialogue state": no Truman body at sheriff 10,4 | load resolver, baseline sheriff bodies | b529711 |
| environmental-interactions | B | `:365` "NPC precede fallback ambientale": same missing Truman | load resolver, baseline bodies; 98 checks as before | b529711 |
| interaction-voice | B | `:184` "not ok - truman_atto3:first doveva conservare il richiamo motivato a Diane" (×6): 0 NPC targets | targets = every authored Cast Presence placement (baseline + windows); 74/74, 77/77, 24/24, Diane 6/6 as before | b529711 |
| narrative-slice-01 | B | `:58` "FAIL - bobby (town) e shelly (diner) trovati in GAME.Maps", then TypeError | load resolver, baseline bodies; 26/26 | b529711 |
| sheriffs-station-location | B | `:131` "Truman, Andy, Hawk and Lucy staff the canonical station": actual `[]` | adapter sync as in smoke.js; same 4 bodies on the same tiles, compared as a set | b529711; docs/cast-continuity-contract-v0.1.md:48 (registry is a set) |
| sheriffs-station-native | B (1) | `:132` "narrative cast stays owned by glue.js": expected `[truman, andy, hawk, lucy, leland]` | adapter sync; baseline set `andy,hawk,lucy,truman`; **added** a check that Leland joins under `atto5` (window ACT5_LELAND_STATION) | b529711 |
| sheriffs-station-native | B (2) | `:294` "player foreground interval ends at the prototype NPC foot depth" (hidden, no bodies means no depth split) | fixed by the same sync | b529711 |
| station-population | B (1) | `:192` deepStrictEqual staff, actual `[]` | adapter sync, compared as a set | b529711 |
| station-population | B (2) | `:201` Leland at `[[8,5]]` (hidden): resolver places him only in act 5 | same pin, now checked after `syncCast({atto5:true})`, then back to baseline | b529711, narrative/cast/windows.json |
| station-population | B (3) | `:290` `state.npcs` order (hidden) | compared as a set | contract v0.1:48 |
| probe-act3-pacing | B | `:178` `Error: npc "truman" non trovato su sheriff` | adapter sync; output byte-identical to committed `artifacts/act-3-closure/pacing.md` | b529711 |
| diner-layout | B (1) | `:27` `Object.keys(map.doors)` expected `['6,9','7,9']`, got `[]` | load the connection registry chain | M5 f927658, reports/qwen-world-builder-m5-legacy-doors.md |
| diner-layout | B (2) | `:45` TypeError reading `x` of James (hidden) | bodies from `CastPresence.bodiesFor('diner', …)` with the reachable fixture seed `ACT2_DAY2` (test/fixtures/cast-pins-acts-1-4.json); James still pinned at x=9 | b529711; docs/cast-presence-authoring.md step 6 |
| traincar-native | B (1) | `:141` "the west door lands on the town road": `doors['0,7']` undefined | load registry chain (`town-traincar-east` keeps 0,7 → town 54,14) | M5 f927658 |
| traincar-native | B (2) | `:237` "the adapter registers truman" (hidden): regex on adapter source, now empty | same tile check against `narrative/cast/windows.json`, exactly one placement per actor | b529711 |
| graphic-pass-contract | B (1) | `:198` "town-great-northern must contain one complete town building and its roof" (6 captures) | view height read from `engine.js` `VH` (192 px = 12 tiles) instead of the hardcoded 9-tile 160×144 model; north pan already read from engine (bf6c2c2: 40 → 24 px). **Note:** the vertical window grows to the engine's real 12 tiles, so this is a correction to the renderer's truth, not a tolerance knob; the horizontal bounds are unchanged. Review if you disagree. | bf6c2c2 (pan), b5de5d2 (VH=192 in the same commit that added the test) |
| graphic-pass-contract | B (2) | `:225` TypeError `maps.town.objects.find` (hidden) | copy registry scene objects onto raw maps, as glue.js does; 14/14 | M8 9332786 |
| character-life | B | `:299` "js/world-engine.js remains unchanged" (pin `2437a8ba…`) | re-pinned `artifacts/character-life-v01/validation/before-hashes.json` to `059c8a03…`; nothing else behind it | dbd23e1 ("World.connections() returns a frozen slice") |
| canonical-sync | B (1) | `:18` `report.checked` 96, now 102 (hidden behind reason 2) | pin 102, with the per-file delta in the comment: +world-connections-production/.gen −4 location-data −traincar-location-production (f927658), +cast-presence (b75ed10), +scene-objects.gen (9332786), +roadhouse ×3 (59dbb7a), +redroom ×3 (3bc873b), +diorama (bf6c2c2) | commits listed; CANONICAL-SYNC.md 2026-09-14/15 entries |
| canonical-sync | D (2) → **open** | `:17` `report.errors` not empty: `js/diorama.js` canonical_missing; `js/engine.js`, `js/retro-authored.js`, `js/sheriffs-station-art.js`, `js/town-dusk.js` unaudited_divergence | depends on the local Vault at `/Users/ebuccelli/Vault/1. Projects/Twin Peaks Game`; the Vault mirror is behind DQ3 bf6c2c2 and 539db70, and retro-authored.js is dirty in another session. Not synced here (Vault write, other session's file). | CANONICAL-SYNC.md reconciliation steps |
| portrait-evidence-parity | D | `:15` "run from the canonical or deploy Twin Peaks root" | depends on an absolute repo path and on Vault byte parity; passes only from the main checkout. **After merge** it will report `byte_drift` on `test/canonical-sync.js` until the Vault mirror is updated | test source |
| authored-cast-contract | D | ENOENT `.gauntlet/character-sprite-fidelity-r101/evidence/reference/pokecrystal-metrics.json` | depends on gitignored `.gauntlet/`; passes on the main checkout (`AUTHORED-CAST-PASS`); fails in any fresh clone or CI | .gitignore |
| character-life-preview, sheriffs-station-preview, station-population-preview, double-r-exterior-prototype, double-r-location | D | `ReferenceError: window is not defined` | browser page scripts, not node entry points; moved to `test/pages/`; HTML pages and `double-r-*-native.js` (the node wrappers, green) updated | reports already classed them browser-only: docs/act-2-closure-report.md:103, artifacts/act-3-closure/node-sweep.md |
| bosco-gates, edifici-gates, greyscale, pixel-gates | D | exit 2 `uso: … <frame.png>` | CLI frame measurement tools that need a PNG argument; moved with `bosco-lib.js` to `tools/frame-gates/`; `test/native-shot.js` updated; verified with a real frame (exit 0) | docs/act-2-closure-report.md:103 "four CLI tools that need arguments" |
| probe-acts12-pacing | C | `:200` "Truman iniziale: nessun dialogo attivo da avanzare" | deleted. With resolver bodies loaded it gets past Truman and stops at "Ronette: nessun dialogo attivo", because the classic acts 1–2 route it walks is gone (Ronette is M4). Output `artifacts/narrative-vertical-slice-01/original-pacing.md` kept as the historical baseline. No HTML page used it. | act 2 closure (Ronette via node_done); docs/narrative-vertical-slice-01-report.md:114 |
| probe-act2-pacing | B → **open** | `:178` `npc "truman" non trovato su sheriff` | sync alone moves the failure to `npc "james" non trovato su diner` (needs per-approach sync on `m4State`), then `npc "hawk" non trovato su sheriff`: the optional-beats section runs after `atto3`, where ACT3_HAWK_BRIDGE moves Hawk to the traincar. The probe models a lingering glue body. Needs a rewrite, over 30 lines. | b529711 |
| probe-act4-pacing | B → **open** | `:143` `npc "truman" non trovato su sheriff`; after sync `:148` `NARRATIVE_ENTITIES: "maddy" non registrato su diner` | `A._debugNarrativeEntities` is `[]` since b529711; re-pointing onto `GAME.CastPresence` touches 3+ call sites plus state-aware syncs, over 30 lines | docs/cast-presence-v0.1-implementation-report.md:102 names it as known debt |
| sprite-gates | **open** | `test/sprite-gates.js:597` "side bbox outside Crystal 12–14px bar" (widest side sprite 15 px); also failing: `:599` front/side IoU 0.653 < 0.718, `:600` "OBJ must use exactly three opaque tones", `:602` dark mass 33.5 < 50, `:603` neck 33.3 < 71, `:606` "walk transform grammar diverges from Crystal" | left red. b5de5d2 overwrote the R102E version (d089490, bar 12–15, diagnostics) with an older stricter file, and it has been red since. It also measures the 16 px authored fallback (`productionFallback: 'authored-matrices-error-only'`), not the HG-24 atlas that production draws. Restoring d089490 would pass but drops hard gates, which counts as weakening, so that is the lead's call. | recovery-audit gap-classification G9; docs/narrative-vertical-slice-01-report.md:10 |
| town-dusk | **open** | `test/town-dusk.js:112` "#e8d08f: asfalto freddo (blu > rosso)"; 5 of 17 checks red (road no longer cool, ground/lawn/highlight/pavement bands, `applyGrade` bands) | left red. bf6c2c2 retuned the grade on purpose (MID_GAIN 0.375→0.94, HI 1.45→1.08, A_MID 0.24→0.78, ground keep 0.44→0.88), but nothing on main records the new targets (`artifacts/gauntlet-dq3/` has only PNGs), and "asphalt cooler than concrete" is a readability rule the retune breaks. Not re-pinned: no documented target to pin to. | bf6c2c2 |

## Open defects

1. **town-dusk.** First failing line: `test/town-dusk.js:112`. Owning file: `js/town-dusk.js`, FAMILY/gain constants around lines 46–58. Two ways to close it: (a) the lead records the DQ3 dusk targets and the bands get re-pinned to them, or (b) the road curve goes back to cool. This is an art call.
2. **sprite-gates.** First failing line: `test/sprite-gates.js:597`. Owning files: `js/retro-cast-matrices-a.js` and `js/retro-cast-matrices-b.js` (16 px fallback), or the test itself. The lead needs to pick one: restore the R102E gate from d089490 (inventory 24→25), retire the gate because production draws the HG-24 atlas, or redraw the matrices (over 30 lines).
3. **canonical-sync, reason 2.** First failing line: `test/canonical-sync.js:17`. Owner: Vault mirror. Mirror `js/diorama.js`, `js/engine.js`, `js/sheriffs-station-art.js`, `js/town-dusk.js`, then `js/retro-authored.js` once the other session commits. After this branch merges, also mirror the changed `test/` files, so `portrait-evidence-parity` does not drift.
4. **probe-act2-pacing.** First failing line: `test/probe-act2-pacing.js:178`. Owner: the probe. Measure the optional beats against a pre-`atto3` state with per-approach Cast Presence sync. Writes `artifacts/act-2-nvs02/pacing.md`.
5. **probe-act4-pacing.** First failing lines: `test/probe-act4-pacing.js:143` and `:148`. Owner: the probe. Migrate `approachEntityTile` from `A._debugNarrativeEntities` to `GAME.CastPresence`. Writes `artifacts/act-4-design/pacing-current.md`.

Env-only failures, not defects: `authored-cast-contract` (needs `.gauntlet/`) and `portrait-evidence-parity` (needs the absolute deploy root). Both pass on the main checkout.

Side effects found while sweeping, none fixed: `narrative-validate` rewrites `artifacts/C5B/C6B/C8B-validation-log.json`, and the probes rewrite their pacing artifacts. The Chrome playthroughs rewrite PNGs and transcripts under `artifacts/act-*`. Restore them after any full sweep.

## Gates (after)

- smoke: `415 controlli superati ✔`
- walkthrough: `85 acquisizioni, finale raggiunto ✔`
- act-3-flow: 280/280
- act-4-flow: 1611/1611
- act-5-flow: 90675/90675
- cast-continuity-validate: V1–V8 PASS
- world-door-equality: PASS, 59 descriptors
- scene-objects-equality: PASS, 21 entries
- Chrome act-4-playthrough: `act-4-playthrough: 530/530 assertions passed` (1 console error: favicon 404, pre-existing harness noise)

## CI delta (`.github/workflows/test.yml`)

**Added 64 steps**, all green in a fresh checkout (no gitignored files, no Chrome, no Vault dependency in source):

- **Acts and flows:** act-2-flow, act-2-ronette-required, act-3-flow, act-3-mirror-gate, act-4-flow, act-4-mirror-gate. act-3-flow and act-4-flow were named gates but missing from CI.
- **Narrative:** narrative-finale, narrative-m9-runtime, narrative-repair-contract, narrative-slice-01, narrative-validate-m5/-m6/-m8, story-truth-lint, letter-chain-provenance, ronette-bob-provenance, tracks-provenance, objective-resolver, notebook-objective, objective-notebook-visibility, choice-prompts, choice-prompt-dedup, dialogue-craft-regression, dialogue-presentation, interaction-voice, classic-object-grounding.
- **World and life:** environmental-interactions, environment-entry, environment-life, ambient-life, character-activity, character-quality, character-runtime-contract.
- **Rendering and input:** cast-sprite-sheet, cooper-sprite-sheet, gold-tone-gates, portrait-gates, r69-reference-gates, graphic-pass-contract, retro-font, retro-production, mobile-production, touch-runtime, movement-feel, walk-phase-contract.
- **Maps and locations:** initial-spawn, location-traversal, traincar-location-traversal, town-map-coherence, town-structure-semantics, interior-prop-semantics, interior-zoning-reachability, world-catalog-coverage.
- **Native scenes:** diner-layout, hospital-native, room-315-location, room-315-native, sheriffs-station-location, sheriffs-station-native, sheriffs-station-door, sheriffs-station-ambient, station-population, traincar-native, redroom-scene.

**Left out, and why:**

- **Red:** sprite-gates, town-dusk, probe-act2-pacing, probe-act4-pacing.
- **Needs local state:** canonical-sync and portrait-evidence-parity (Vault and absolute root), authored-cast-contract (gitignored `.gauntlet/`), heartgold-visual-contract (spawns ImageMagick `magick`, not guaranteed on ubuntu-latest).
- **Rewrites tracked files:** probe-act3-pacing (pacing artifact), narrative-validate (C*B logs), gen-m6-check (regenerates `narrative-data.gen.js`), cast-presence-pre-migration (a proof of the pre-migration world, writes a report).
- **Change detector, not behaviour:** character-life pins sha256 of unrelated files (`world-engine.js`, atlas), so it would break CI on every legitimate engine commit.
- **Diagnostics or dev pages, no production guard:** level-autopsy, level-autopsy2, level-autopsy3 (print-only level design autopsies), town-route-captures (capture evidence), hd2d-cabin-prototype (browser prototype, no-op in node), ambient-preview-controls, double-r-exterior-native, double-r-location-native (preview-page controllers for prototype maps).
- **Browser/CLI and generators:** Chrome drivers and generators are out of the sweep, as before.

CI was not run on GitHub (not pushed). Linux-only differences such as filename case are unverified.

## Sweep output

<details><summary>Before (3be8f56, clean checkout): pass=91 fail=30</summary>

```
FAIL act-2-flow (rc=1)
ok   act-2-ronette-required
ok   act-3-flow
ok   act-3-mirror-gate
SKIP act-3-playthrough
ok   act-4-flow
ok   act-4-mirror-gate
SKIP act-4-playthrough
ok   act-5-flow
ok   act-5-mirror-gate
SKIP act-5-playthrough
ok   ambient-life
ok   ambient-preview-controls
ok   apply-changeset
FAIL authored-cast-contract (rc=1)
FAIL bosco-gates (rc=2)
ok   bosco-lib
FAIL canonical-sync (rc=1)
SKIP capture-chrome
SKIP capture-roadhouse-cohesion
ok   cast-continuity-validate
ok   cast-presence-pre-migration
ok   cast-presence-sync
ok   cast-sprite-sheet
ok   catalog-write
ok   character-activity
FAIL character-life-preview (rc=1)
FAIL character-life (rc=1)
ok   character-quality
ok   character-runtime-contract
ok   choice-prompt-dedup
ok   choice-prompts
ok   classic-object-grounding
ok   cooper-sprite-sheet
ok   dialogue-craft-regression
FAIL dialogue-presentation (rc=1)
FAIL diner-layout (rc=1)
ok   double-r-exterior-native
FAIL double-r-exterior-prototype (rc=1)
ok   double-r-location-native
FAIL double-r-location (rc=1)
FAIL edifici-gates (rc=2)
ok   editor-apply-preflight
ok   editor-runtime-isolation
ok   environment-entry
ok   environment-life
FAIL environmental-interactions (rc=1)
ok   gen-m6-check
SKIP gen-narrative-data
SKIP gen-world-data
SKIP genmaps
ok   gold-tone-gates
FAIL graphic-pass-contract (rc=1)
FAIL greyscale (rc=2)
ok   hd2d-cabin-prototype
ok   heartgold-visual-contract
ok   hospital-native
ok   initial-spawn
FAIL interaction-voice (rc=1)
ok   interior-prop-semantics
ok   interior-zoning-reachability
ok   legacy-door-inventory
ok   letter-chain-provenance
ok   level-autopsy
ok   level-autopsy2
ok   level-autopsy3
ok   location-connections
ok   location-traversal
ok   migrated-door-traversal
ok   mobile-production
ok   movement-feel
ok   narrative-finale
ok   narrative-lint
ok   narrative-m9-runtime
ok   narrative-repair-contract
FAIL narrative-slice-01 (rc=1)
ok   narrative-validate-m10
ok   narrative-validate-m5
ok   narrative-validate-m6
ok   narrative-validate-m8
ok   narrative-validate-m9
ok   narrative-validate
SKIP native-shot
ok   notebook-objective
ok   objective-notebook-visibility
ok   objective-resolver
SKIP performance-gate
FAIL pixel-gates (rc=2)
FAIL portrait-evidence-parity (rc=1)
ok   portrait-gates
FAIL probe-act2-pacing (rc=1)
FAIL probe-act3-pacing (rc=1)
FAIL probe-act4-pacing (rc=1)
FAIL probe-acts12-pacing (rc=1)
ok   r69-reference-gates
ok   redroom-scene
ok   retro-font
ok   retro-production
ok   ronette-bob-provenance
ok   room-315-location
ok   room-315-native
SKIP run-browser-harness
ok   scene-objects-equality
ok   scene-objects-inventory
ok   sheriffs-station-ambient
ok   sheriffs-station-door
FAIL sheriffs-station-location (rc=1)
FAIL sheriffs-station-native (rc=1)
FAIL sheriffs-station-preview (rc=1)
ok   smoke
FAIL sprite-gates (rc=1)
FAIL station-population-preview (rc=1)
FAIL station-population (rc=1)
SKIP step6-driver
ok   story-truth-lint
ok   test-world-registry
ok   touch-runtime
FAIL town-dusk (rc=1)
ok   town-map-coherence
ok   town-route-captures
ok   town-structure-semantics
ok   tracks-provenance
ok   traincar-location-traversal
FAIL traincar-native (rc=1)
SKIP verify-shot
SKIP visual-audit-capture
ok   walk-phase-contract
ok   walkthrough
ok   world-apply-cast
ok   world-apply-objects
ok   world-apply
SKIP world-builder-browser
ok   world-builder
ok   world-catalog-coverage
ok   world-door-equality
ok   world-engine-v0.1-catalog
TOTAL pass=91 fail=30
```
</details>

<details><summary>After (this branch): pass=103 fail=7</summary>

```
ok   act-2-flow
ok   act-2-ronette-required
ok   act-3-flow
ok   act-3-mirror-gate
SKIP act-3-playthrough
ok   act-4-flow
ok   act-4-mirror-gate
SKIP act-4-playthrough
ok   act-5-flow
ok   act-5-mirror-gate
SKIP act-5-playthrough
ok   ambient-life
ok   ambient-preview-controls
ok   apply-changeset
FAIL authored-cast-contract (rc=1)
FAIL canonical-sync (rc=1)
SKIP capture-chrome
SKIP capture-roadhouse-cohesion
ok   cast-continuity-validate
ok   cast-presence-pre-migration
ok   cast-presence-sync
ok   cast-sprite-sheet
ok   catalog-write
ok   character-activity
ok   character-life
ok   character-quality
ok   character-runtime-contract
ok   choice-prompt-dedup
ok   choice-prompts
ok   classic-object-grounding
ok   cooper-sprite-sheet
ok   dialogue-craft-regression
ok   dialogue-presentation
ok   diner-layout
ok   double-r-exterior-native
ok   double-r-location-native
ok   editor-apply-preflight
ok   editor-runtime-isolation
ok   environment-entry
ok   environment-life
ok   environmental-interactions
ok   gen-m6-check
SKIP gen-narrative-data
SKIP gen-world-data
SKIP genmaps
ok   gold-tone-gates
ok   graphic-pass-contract
ok   hd2d-cabin-prototype
ok   heartgold-visual-contract
ok   hospital-native
ok   initial-spawn
ok   interaction-voice
ok   interior-prop-semantics
ok   interior-zoning-reachability
ok   legacy-door-inventory
ok   letter-chain-provenance
ok   level-autopsy
ok   level-autopsy2
ok   level-autopsy3
ok   location-connections
ok   location-traversal
ok   migrated-door-traversal
ok   mobile-production
ok   movement-feel
ok   narrative-finale
ok   narrative-lint
ok   narrative-m9-runtime
ok   narrative-repair-contract
ok   narrative-slice-01
ok   narrative-validate-m10
ok   narrative-validate-m5
ok   narrative-validate-m6
ok   narrative-validate-m8
ok   narrative-validate-m9
ok   narrative-validate
SKIP native-shot
ok   notebook-objective
ok   objective-notebook-visibility
ok   objective-resolver
SKIP performance-gate
FAIL portrait-evidence-parity (rc=1)
ok   portrait-gates
FAIL probe-act2-pacing (rc=1)
ok   probe-act3-pacing
FAIL probe-act4-pacing (rc=1)
ok   r69-reference-gates
ok   redroom-scene
ok   retro-font
ok   retro-production
ok   ronette-bob-provenance
ok   room-315-location
ok   room-315-native
SKIP run-browser-harness
ok   scene-objects-equality
ok   scene-objects-inventory
ok   sheriffs-station-ambient
ok   sheriffs-station-door
ok   sheriffs-station-location
ok   sheriffs-station-native
ok   smoke
FAIL sprite-gates (rc=1)
ok   station-population
SKIP step6-driver
ok   story-truth-lint
ok   test-world-registry
ok   touch-runtime
FAIL town-dusk (rc=1)
ok   town-map-coherence
ok   town-route-captures
ok   town-structure-semantics
ok   tracks-provenance
ok   traincar-location-traversal
ok   traincar-native
SKIP verify-shot
SKIP visual-audit-capture
ok   walk-phase-contract
ok   walkthrough
ok   world-apply-cast
ok   world-apply-objects
ok   world-apply
SKIP world-builder-browser
ok   world-builder
ok   world-catalog-coverage
ok   world-door-equality
ok   world-engine-v0.1-catalog
TOTAL pass=103 fail=7
```
</details>

The after total has 11 fewer entries: 9 files moved out of `test/`, `probe-acts12-pacing` deleted, and `bosco-lib` moved.

## Commits

- `dde8340` B: stale harnesses and pins
- `10bc08e` C: delete probe-acts12-pacing
- `238f664` D: move page scripts and CLI tools out of `test/*.js`
- CI steps and this report (next commit)

