# Acts 1–3 Character Window Inventory

Sources: `docs/story/timeline.md`, `docs/story/characters/*.md`, `docs/story/truth.md` (design authority); `narrative/missions/M4–M6.json` (window boundaries, `actor_id`/`map_id`/`conditions`); `js/narrative-engine-adapter.js` NARRATIVE_ENTITIES and `js/glue.js` NPCS (engine today, reported separately).

Windows and their exact boundary flags/values (file:line):
- **W1 ACT1 town**: start → `sogno_fatto` set at `js/data.js:591` (node `laura_sogno`)
- **W2 ACT2 hospital/GN**: `sogno_fatto` → `atto3` set at `js/data.js:614` (`truman_atto3`); no `atto2` flag exists
- **W3 ACT3 bridge+traincar discovery**: `atto3` → `m5_report_intro` (cond `value_set:m5_final_theory` + `P3A.formulation.status=formulated`)
- **W4 ACT3 traincar report**: `m5_report_intro` → `east_route_confirmed` (set by `m5_tracks_north`, cond `value_set:s1`)
- **W5 ACT3 OEJ**: `audrey_indaga` / `audrey_vista_oej` (set M6.json:349) / `jacques_preso` (set M6.json:1217)
- **W6 ACT3 guarded hospital**: `jacques_preso` → `jacques_dead` (set M6.json:1492)
- **W7 ACT3 night station/news/Room 315**: `jacques_dead` → `gigante1` (set `js/data.js:689`, node `specchio315`, cond `jacques_morto`) → `atto4` (set M6.json:1617, `m6_atto4_bridge`)

---

## W1 — ACT1 town (design)

| char | location (design) | cause | citation |
|---|---|---|---|
| truman | sheriff station | operational ally from Cooper's arrival | timeline.md:34 T20 |
| hawk | UNSPECIFIED | — | no source places him before W3 |
| lucy | UNSPECIFIED | — | no source |
| andy | UNSPECIFIED | — | no source |
| sarah | Palmer house | early witness, tells Cooper | characters/sarah.md "Act 1: tells Cooper (classic)" |
| leland | Palmer house/town | composed public mourning | timeline.md:56 T40 |
| maddy | OFFSCREEN | not arrived yet | maddy.md (arrives Act 4) |
| norma | UNSPECIFIED | — | no source |
| shelly | UNSPECIFIED | — | no source |
| loglady | UNSPECIFIED | — | no source |
| bobby | UNSPECIFIED | — | no source |
| donna | OFFSCREEN by design | design places her only Act 2 | donna.md "Act 2 (with James)" |
| jacoby | UNSPECIFIED | — | no source |
| audrey | OFFSCREEN by design | design starts her at "the counter" Act 2 | audrey.md |
| benhorne | UNSPECIFIED | — | no source |
| gerard | UNSPECIFIED (pre-formula) | — | gerard.md "Act 2: the formula (optional)" |
| ronette | hospital ward | pre-game injured, found on footbridge | ronette.md "Pre-game T7-T10" |
| infermiera | UNSPECIFIED | — | no source |
| james | OFFSCREEN by design | design gates him behind `sogno_fatto` | james.md "Act 2: gives E6" |
| jacques | UNSPECIFIED (pre-game only) | — | jacques.md "Pre-game: T3, T7" |
| giant | OFFSCREEN | not yet caused | giant.md "Act 3 end" |
| laura | Red Room (dream, T22) | Cooper's dream | timeline.md:36 T22 |
| mfap | UNSPECIFIED | no story doc covers this classic NPC | — |
| bob | OFFSCREEN | force only, no scene presence acts 1–3 | bob.md |

### Engine today (W1)
| char | maps/cond |
|---|---|
| truman | sheriff, unconditioned (`js/glue.js:30`) |
| hawk | sheriff, unconditioned (`:39`) |
| lucy | sheriff, unconditioned (`:41`) |
| andy | sheriff, unconditioned (`:38`) |
| sarah | palmer, `!flag:gigante2` (`:48`) |
| leland | sheriff ONLY, `flag:atto5 && !flag:leland_morto` — **absent in W1 despite design placing him at Palmer/town** (`:43`) |
| norma | diner, unconditioned (`:63`) |
| shelly | diner, unconditioned (`:66`) |
| loglady | diner, unconditioned (`:68`) |
| bobby | town, `!flag:gigante2` (`:15`) |
| donna | town, `!flag:gigante2` — **present in W1 though design starts her Act 2** (`:22`) |
| jacoby | town, unconditioned (`:25`) |
| audrey | hotel_gn, unconditioned — **present in W1 though design starts her Act 2** (`:54`) |
| benhorne | hotel_gn, unconditioned (`:53`) |
| gerard | hospital, unconditioned (dialogue gated separately) (`:59`) |
| ronette | hospital, `when:null` (adapter:158) |
| infermiera | hospital, `when:null` (adapter:159) |
| james | diner, `flag:sogno_fatto` — absent W1, matches design (`:70`) |
| jacques | oej, `not jacques_preso` — present (adapter:183) |
| laura | redroom (dream map), unconditioned besides dialogue cascade (`:76`) |
| mfap | redroom, unconditioned (`:74`) |
| bob | redroom, `flag:leland_morto` — absent (`:82`) |

---

## W2 — ACT2 hospital/Great Northern (design)

| char | location | cause | citation |
|---|---|---|---|
| truman | sheriff | files what's filed | truth.md §1 |
| ronette | hospital ward | scream "BOB" | timeline.md:37 T23 |
| infermiera | hospital ward | lateral reading of Ronette | timeline.md:37 T23 |
| gerard | hospital ward | recites fire formula (optional) | timeline.md:37 T23; gerard.md |
| james | diner | gives heart, testimony (E6) | timeline.md:38 T24 |
| donna | with James | shares mourning | donna.md |
| audrey | Great Northern counter (optional) | counts shifts | audrey.md |
| benhorne | UNSPECIFIED | — | no source |
| hawk | UNSPECIFIED | — | no source |
| lucy | UNSPECIFIED | — | no source |
| andy | UNSPECIFIED | — | no source |
| sarah | Palmer house | — | truth.md |
| leland | Palmer house/town | still composed | timeline.md:56 T40 |
| norma/shelly/loglady/bobby/jacoby/maddy/benhorne | UNSPECIFIED/OFFSCREEN | — | no source |
| jacques | UNSPECIFIED (pre-game only referenced) | — | jacques.md |
| giant/laura/mfap/bob | OFFSCREEN | not yet caused | see W1 |

### Engine today (W2)
Identical map/cond set as W1 (no gating changes between `sogno_fatto` and `atto3` except James now dialogue-active and Truman's cascade offering `truman_a2`/`truman_atto3` lines). Ronette/infermiera/gerard unchanged; James now `flag:sogno_fatto` true → visible.

---

## W3 — ACT3 bridge + traincar discovery (design)

| char | location | cause | citation |
|---|---|---|---|
| hawk | footbridge → traincar exterior | partner on the prints | timeline.md:40-41 T26-27; adapter:210-224 (`hawk_bridge`/`hawk_door`/`hawk_cut`, node-gated) |
| truman | absent until report | not yet on site | M5.json `m5_report_intro` cond |
| leland | third man, historically at car (never staged) | scene truth, not a runtime presence | truth.md §1 "third man is Leland" |
| others | UNSPECIFIED/OFFSCREEN, town continues per W2 baseline | — | no source moves them |

### Engine today (W3)
`traincar` map narrative entities only — `hawk_bridge` (cond `node_done:m5_bridge && !vagone_scoperto`), `hawk_door` (cond `vagone_scoperto && !value_set:s1`), `truman` (cond `value_set:m5_final_theory && !east_route_confirmed`, adapter:196-198, appears only once theory is ready — i.e. bridges into W4). No other named character placed on `traincar`.

---

## W4 — ACT3 traincar report (Truman on site)

Entry `value_set:m5_final_theory` + `P3A.formulation.status=formulated` (`m5_report_intro`); exit `east_route_confirmed` (set by `m5_tracks_north`, M5.json).

| char | location | cause | citation |
|---|---|---|---|
| truman | traincar | reads theory, contests/accepts, signs S1 custody | timeline.md:42 T28; M5.json `m5_report_intro` |
| hawk | traincar exterior (door, then north cut) | escorts, then leads to cut | M5.json `m5_hawk_door`/`m5_hawk_cut`; adapter:216-224 |

### Engine today (W4)
`traincar` adapter entities `truman` (`:196`), `hawk_door`/`hawk_cut` (`:216`, `:220`) as above.

---

## W5 — ACT3 One Eyed Jacks (Audrey window)

Entry `audrey_indaga` (set at `js/data.js:442/449`); scene bound `audrey_vista_oej` (M6.json:349); window closes at `jacques_preso` (M6.json:1217).

| char | location | cause | citation |
|---|---|---|---|
| jacques | oej (banco) | dealer, interrogated, arrested | M6.json `m6_ferry`…`m6_arrest`, `actor_id:jacques` |
| audrey | oej (tavolo) | investigates alone, brought back by Truman on 8pm boat | timeline.md:44 T30, T42; M6.json `m6_audrey`, cond `audrey_indaga && !audrey_vista_oej` |
| truman | with Audrey on return (M6.json m6.b7b.night.audrey), else sheriff | accompanies her back | timeline.md:44 T42 |

### Engine today (W5)
`oej` adapter entities — `jacques` (`when: not jacques_preso`, adapter:183), `audrey` (`when: audrey_indaga && !audrey_vista_oej && !jacques_preso`, adapter:188). Classic `NPCS.oej` is empty (`js/glue.js:86`) — OEJ presences are entirely narrative-engine-driven, none classic.

---

## W6 — ACT3 guarded hospital (jacques_preso → jacques_dead)

| char | location | cause | citation |
|---|---|---|---|
| jacques | hospital ward, guarded room | recovering from broken leg, piantonato | timeline.md:45 T31; M6.json `m6_hospital_guard` |
| ronette | hospital ward (unchanged) | still present | adapter:158 |
| infermiera | hospital ward (unchanged) | still present | adapter:159 |
| leland/BOB | hospital, offscreen (T33) | smothers Jacques; **never staged as an NPC presence — authorial fact only, never rendered** | timeline.md:47 T33 "Offscreen (see C)"; leland.md; truth.md §1 |
| truman/lucy | sheriff station (night report) | Cooper sent home | timeline.md:46 T32 |

### Engine today (W6)
`hospital` adapter adds `piantone` (guard, generic sprite `andy`, `when: jacques_preso && !jacques_dead`, adapter:165-169) — not a named character, scenography per the code comment ("il piantone della contea è SCENOGRAFIA, non un attore").

---

## W7 — ACT3 night station / news / Room 315 giant (jacques_dead → gigante1 → atto4)

| char | location | cause | citation |
|---|---|---|---|
| lucy | sheriff | takes the call, delivers the news | timeline.md:48 T34; M6.json `m6_news`, `actor_id:lucy` |
| truman | sheriff | receives P9, later the atto4 bridge | M6.json `m6_atto4_bridge`, cond `jacques_dead && gigante1 && !atto4` |
| giant | Room 315 mirror | appears, trauma+mirror+method failure, delivers 3 statements | timeline.md:49 T35; giant.md |
| infermiera/ronette | hospital (surveillance shifts to Ronette: `piantone_ronette`, `when: jacques_dead`, adapter:172-176) | — | truth.md §1 |

### Engine today (W7)
`hospital` adapter swaps `piantone`→`piantone_ronette` on `jacques_dead` (adapter:172-176). Room 315 giant presence is a static map object (`specchio315` interact, `js/glue.js:98-102`), not an NPC entity — dialogue cascade gated by `jacques_morto` then `gigante1`.

---

## (a) Conflicts between design sources
1. **Leland's Acts 1–2 location**: `timeline.md:56` (T40) places him at "Palmer house, town," composed and visible; classic `NPCS.sheriff.leland` (`js/glue.js:43`) is gated to `flag:atto5 && !leland_morto`, so the engine renders him nowhere in Acts 1–3. Design says he is visible; engine has no body for him until Act 5.
2. **Donna's start window**: `donna.md` places her only "Act 2 (with James)"; engine's `NPCS.town.donna` (`js/glue.js:22`) is unconditioned except `!gigante2`, so she is walkable in town from game start (W1), earlier than design specifies.
3. **Audrey's start window**: `audrey.md` timeline begins "Act 2: the counter (optional)"; engine's `NPCS.hotel_gn.audrey` (`js/glue.js:54`) is likewise unconditioned from W1.
4. **Gerard's formula gate**: `gerard.md` places the formula in Act 2 (optional); the classic sprite (`js/glue.js:59`) is visible unconditioned from W1, though the dialogue payload (`gerard_a2`) is separately gated by mission M4's `sogno_raccontato` condition — the body precedes the content gate.

## (b) Characters the design never places in Acts 1–3
**hawk** (before the bridge, W3), **lucy**, **andy**, **norma**, **shelly**, **loglady**, **bobby**, **jacoby**, **benhorne**, **infermiera** (before W2), **mfap** — no `docs/story/` source states a location for these in Acts 1–3 beyond incidental mentions; several have no `characters/*.md` file at all (andy, lucy, norma, shelly, loglady, bobby, jacoby, benhorne, infermiera, mfap).

## (c) Exact boundary flags/values with setter file:line
- `sogno_fatto` — `js/data.js:591` (node `laura_sogno`)
- `atto3` — `js/data.js:614` (node `truman_atto3`)
- `m5_final_theory` (value) — set inside `m5_theory_revision`/`m5_theory_first` in `narrative/missions/M5.json` (value write, not a flag)
- `s1` (value) — set at `m5_s1` node, `narrative/missions/M5.json`
- `east_route_confirmed` — `narrative/missions/M5.json` node `m5_tracks_north`
- `audrey_indaga` — `js/data.js:442` and `js/data.js:449`
- `audrey_vista_oej` — `narrative/missions/M6.json:349`
- `jacques_preso` — `narrative/missions/M6.json:1217`
- `jacques_dead` — `narrative/missions/M6.json:1492`
- `gigante1` — `js/data.js:689` (node `specchio315`, cond `jacques_morto`)
- `atto4` — `narrative/missions/M6.json:1617` (node `m6_atto4_bridge`)
