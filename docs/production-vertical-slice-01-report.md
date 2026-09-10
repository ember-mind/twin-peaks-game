# Production Vertical Slice 01 — report

Town + Double R + Sheriff's Station as one world. Date: 2026-09-09. Working tree only (not committed, not deployed, not synced to the vault — see §9 and §10).

## 1. Executive result

**Pass with notes.** The player traverses Town → Sheriff's Station lot → interior (four-deputy cast with Character Life) → back → Town → Double R lot → diner → back, on real movement, collision, connections, saves and reactions. All five environments share one authored dusk state, one pixel language and one player scale, and both exterior/interior pairs read as the same building. Notes: the Town remains the calmest tier (it is an overworld with re-authored frontages and graded ground, not a rebuilt map); the Sheriff exterior carries a lead pass-with-notes over three independent critic rounds that stayed at FAIL (§9); visual baselines are not advanced.

## 2. Playable path

- Production: open `index.html`, press **N** (new game) or **Continua**. The campaign opens in Town with "Prima tappa: la centrale"; walk to the Sheriff's Station door at town tile 12,20 (west end of the civic strip) → lot → interior; leave through the south doors → lot → walk down to the street → Town; walk east to the Double R door at 42,20 → lot → diner → back the same way.
- Headless truth of any point on the route: `node test/native-shot.js --map=<town|sheriffs_station_exterior|sheriff|double_r_exterior_prototype|diner> --x=.. --y=.. --dir=.. --out=..` (the harness `test/retro-scene.html` now loads the production scene chain).
- Automated traversal of the whole route: `node test/sheriffs-station-location.js` (Town ↔ Sheriff lot ↔ interior, cast presence, held-input no-bounce, save rollback) and `node test/double-r-location-native.js`.

## 3. World topology

```text
World catalog twin-peaks (js/world-catalog.js)
│
├─ Location: town ── Environment: town (map 'town')
│      ├─ Connection town-sheriffs-station-lot   town[12,20] ⇄ sheriffs_station_exterior[row 11, x2..13]
│      ├─ Connection town-double-r-lot           town[42,20] ⇄ double_r_exterior_prototype[row 11, x2..13]
│      └─ Connection town-traincar-east (pre-existing)
│
├─ Location: sheriffs-station
│      ├─ Environment: exterior  → map 'sheriffs_station_exterior' (16×12, art js/sheriffs-station-exterior-art.js)
│      ├─ Environment: interior  → map 'sheriff' (16×12 native interior, narrative-keyed id)
│      └─ Connection sheriffs-station-front-entrance  exterior[7,6],[8,6] ⇄ interior[7,11],[8,11]
│             └─ Environment Reaction 'front-door' on committed arrival at interior 7,10
│
├─ Location: double-r
│      ├─ Environment: exterior  → map 'double_r_exterior_prototype'
│      ├─ Environment: interior  → map 'diner'
│      └─ Connection double-r-front-entrance (pre-existing, departure reaction front-door)
│
├─ traincar-crossing, one-eyed-jacks (pre-existing, unchanged)
```

Spawns are always one tile outside the trigger cells, facing away; held input cannot re-trigger (tested).

## 4. Visual results

Canonical captures in `artifacts/production-vertical-slice-01/`; composite `same-world-sheet.png`.

| Scene | Native capture | Reference status |
|---|---|---|
| Town slice at the station / at the diner / street | `town-sheriff-native.png`, `town-diner-native.png`, `town-street-native.png` | Town cohesion pass v01 (`artifacts/town-cohesion-v01/`) — lead pass with notes |
| Sheriff's Station exterior | `sheriff-exterior-native.png` | **Golden Reference** `artifacts/sheriffs-station-exterior-v01/native-golden.png` (concept `final.png`) |
| Sheriff's Station interior with cast | `interior-cast-native.png` | Native Golden v0.2.1 unchanged (`artifacts/sheriffs-station-main-interior-v021/native-after.png`) |
| Double R exterior | `dr-exterior-native.png` | Native Reference v0.2 unchanged |
| Double R interior | `dr-interior-native.png` | Golden unchanged |

Same-world review (§Same-world questions): compatible pixel density — yes; architecture scale vs player — yes (lots 12 tiles wide, 44 px roofs, 32 px doors; town frontages are the agreed compact abstraction); one lighting state — yes (early dusk, decision D1); one material language — yes (shared slate/concrete/oak/cream/vegetation families, location accents forest+oak vs burgundy+gold); credible transitions — yes (sign family, door, wall material and lit-window colour agree for both pairs); intentional density — yes, with the Town the calmest; nothing reads AI-generated; the weakest tier is the Town's remaining un-authored neighbours (pharmacy, hardware, roadhouse roof), which are graded but outside the slice.

## 5. Character results

| Where | Who | Character Life v0.1 |
|---|---|---|
| Sheriff's Station interior (`sheriff`) | Truman 10,4 | generic blink 12–38 s; contextual file reading 32–65 s; reactive facing, returns to desk focus |
| | Lucy 2,6 (behind reception, reads seated) | blink 16–34 s; contextual telephone 26–44 s; reactive |
| | Andy 10,7 (at the deputies' north desk) | blink 23–47 s; contextual note check 48–78 s; reactive |
| | Hawk 12,8 (at the south desk) | none (stillness); reactive facing only. Kept because his dialogue is a counted narrative acquisition |
| | Leland 8,5 | act 5 only, narrative |
| Double R interior (`diner`) | Norma, Shelly, Log Lady, James | pre-existing gestures (Norma wipe, patron sip) unchanged |
| Town | Bobby, Donna, Jacoby | unchanged |

Independent seeded timers per actor; stillness dominant (Truman measured 94% still in the v0.1 pass). **Character Life v0.1 is frozen** (`artifacts/station-population-v01/README.md`).

## 6. Engine changes

No new engine abstraction. World Engine v0.1 unchanged. Genuine runtime changes:

- `js/town-dusk.js` (new, content-level): an authored palette grade + emissive table for map `town`, attached to the existing pre-OBJ palette hook and the existing foreground-band hook. It is authored data with a grade function, not a lighting system; it has no time value and knows only `town`.
- `js/sheriffs-station-scene.js`: installs onto the glue-built `GAME.Maps.sheriff` record instead of replacing it, and throws if its footprint rows diverge from `js/maps.js` (single source of truth for collision).
- New authored content files: `js/sheriffs-station-exterior-scene.js`, `js/sheriffs-station-exterior-art.js`, `js/sheriffs-station-location-data.js`; `js/double-r-location-data.js` gains the town-lot connection.

Everything else is authored data (maps, NPC records, profiles, catalog, reactions) or test/harness code.

## 7. Authoring pipeline findings

- Concept → native works when the concept is generated against two strict references (the interior concept for identity, the neighbouring native lot for scale, camera and evening). The one-shot concept needed no second iteration.
- Native translation needs a frame plan in pixels (zone table) before any drawing; the builder then iterates on real captures. Four polish rounds were needed, and the recurring gap was always the same: lit openings must be the brightest band and window contents must be legible shapes — both are lighting-role failures, not detail failures.
- Fresh-context critics diagnose symptoms reliably and causes unreliably: three rounds kept a 5/10 while their observations shifted; house-style elements shared with the approved reference (blocky conifers, rectangular repairs, the sprite) were repeatedly flagged. The lead must validate each claim on the capture before passing it to the builder, and must own the stop decision.
- World integration is cheaper than art: the Sheriff's Station needed zero new primitives — the migration cost was in narrative keys and test coordinates, not in engine code.
- A map cannot be half dusk: bringing an overworld into a slice's lighting state is a map-wide grade plus bounded frontage rewrites, not a region rebuild.

## 8. System pressure

| Issue | Class | Resolution |
|---|---|---|
| Native interior unreachable; narrative keyed on map id `sheriff` | CONTENT-SPECIFIC | re-keyed the native scene to `sheriff`, NPC records stay in glue with new tiles |
| Double R lot had no exit to Town | EXISTING SYSTEM SOLVED | `town-double-r-lot` paired connection with a multi-trigger bottom row |
| Two Character Life files registering the same scene | CONTENT-SPECIFIC | single registration file |
| Town day palette vs dusk lots | CONTENT-SPECIFIC | authored grade on the existing hook + frontage rewrites |
| Foreground tree bands drawn after the palette hook | EXISTING SYSTEM SOLVED | wrap the existing foreground hook for `town` |
| Road vs path day colours differ by <10/channel | CONTENT-SPECIFIC | glyph mask from the map rows inside the grade |
| Production file depends on `EnvironmentReactions` that harnesses did not load | DOCUMENTATION / CONTRACT | harness load lists fixed; production order was already correct |
| Per-pass hash-freeze tests ossify shared files | DEFERRED | freezes re-scoped to art/atlas files; a milestone-level receipt would be better |
| Narrative/Three.js lane keeps legacy 10×9 station geometry (`js/render3d.js`) | DEFERRED | legacy lane, not loaded by `index.html` |
| Legacy browser harness pages with old station coordinates (13 files) | DEFERRED | mechanical mapping recorded in the migration report |
| GENUINE ENGINE PRESSURE | none | — |

## 9. Validation

See `artifacts/production-vertical-slice-01/validation-final.md` for the full tables.

- Native suite: smoke 428 checks (baseline 368), walkthrough 86 acquisitions (baseline 86, finale reached). New focused tests: `sheriffs-station-location.js`, `sheriffs-station-door.js`, `town-dusk.js`, rewritten `station-population.js`. Pre-existing failures unchanged: `canonical-sync.js` (vault mirror drift), `portrait-evidence-parity.js`, `sprite-gates.js`, `double-r-location.js` standalone.
- Coldstage: all runtime scenarios pass with zero severe console errors, including `sheriffsStation` 9/9, `characterLife` 16/16, `stationP` 21/21 (Character Life state restoration and independent timers). Pixel gate: the `visual`, `diner`, `dinerAmbient`, `dinerEnvironment` and `sheriffsStation` diff sheets flag `aiReviewNeeded` because the Town is now graded and the harness chain changed; **no baseline was approved or replaced** — advancing them needs a scoped review record.
- Visual review: lead review at native, 5×, in-game with player, and on the same-world sheet. Independent critic rounds on the Sheriff exterior: 3 × FAIL at 5/10 (validated points applied; house-style and factually wrong points rejected; verdict and rationale in `artifacts/sheriffs-station-exterior-v01/README.md`).

## 10. Known debt

- Working tree is uncommitted and not deployed; the vault mirror is behind the deploy copy (18 divergences on the exact-equality scope, 4 of them pre-existing, 4 files missing in the vault). Sync repo → vault for the milestone files before deploy.
- Coldstage visual baselines for `visual`, `diner`, `dinerAmbient`, `dinerEnvironment`, `sheriffsStation` await a scoped review record; `dinerExterior`/`dinerLocation`/`characterLife`/`stationP` have no baseline yet.
- Town neighbours outside the slice (pharmacy, hardware, roadhouse) are graded but not re-authored; the roadhouse roof beside the Double R is a flat dark plane; the RR roof sign reads slightly like a billboard; the Double R approach column in Town stays dirt (path glyph).
- `js/render3d.js` and 13 legacy browser harness pages still assume the 10×9 station.
- Town dusk foreground wrap costs one `getImageData` per on-screen actor over the tree band; fine at current NPC counts, unmeasured with many.

## 11. Recommended next production milestone

**Narrative Integration Pass 01 on the completed slice**: run the act 1–2 beats that already live in the station and the diner (Truman cascade, Lucy, Hawk, Log Lady, Norma) through the new spaces with the real dialogue UI, portraits and save lifecycle, fix the 13 legacy harness pages against the new station geometry, and advance the visual baselines with scoped review records. It converts the world slice into a playable story slice without touching engine architecture. Not implemented here.
