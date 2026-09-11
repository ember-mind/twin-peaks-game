# Location population matrix

Read-only forensic audit, companion to `presence-sources.md`. No fixes proposed.

Legend for **WHO OWNS THOSE TRANSITIONS**: classic flags are set inline via
`setFlag: 'X'` on dialogue-choice effects in `js/data.js` (e.g. `sogno_fatto`
at `js/data.js:591`, `leland_morto` at `js/data.js:755`). Adapter-gated
values (`value_set`, `node_done`, mission-owned flags like `jacques_preso`,
`warning_target`, `promise_stance`) are written as mission-node effects
(`"set": "X"`) inside generated data `js/narrative-data.gen.js` (verified
locations cited per row below where checked).

---

## town

- **STATIC POPULATION**: none (all three classic town NPCs carry a `cond`).
- **CONDITIONAL POPULATION** (classic, `js/glue.js:15-27`):
  - `bobby` — `cond: ['!flag:gigante2']`
  - `donna` — `cond: ['!flag:gigante2']`
  - `jacoby` — `cond: ['!flag:gigante2']`
- **MISSION-OWNED POPULATION** (adapter, `js/narrative-engine-adapter.js:283-297`):
  - `hawk_shore_first` — sprite `hawk` — `when: { all: [{ value_is: { name: 'body_found_by', equals: 'hawk' } }, { not: { flag: 'maddy_trovata' } }] }`
  - `hawk_shore_after` — sprite `hawk` — `when: { all: [{ flag: 'maddy_trovata' } , { not: { node_done: 'm8_station' } }] }`
- **CHARACTERS WHO MAY ARRIVE**: `hawk_shore_first`/`hawk_shore_after` only
  after the M8 body-discovery beat sets `body_found_by`/`maddy_trovata`.
- **WHO MAY LEAVE**: `bobby`/`donna`/`jacoby` leave town once `gigante2` is
  set (Act-2 dream-vision beat). `hawk_shore_first` leaves once
  `maddy_trovata` is set; `hawk_shore_after` leaves once `m8_station` node is
  done.
- **WHO OWNS THOSE TRANSITIONS**: `gigante2` — classic flag, `setFlag` site
  not individually re-verified in this pass but pattern matches `js/data.js`
  dialogue effects; `maddy_trovata`/`body_found_by`/`m8_station` — M8 mission
  node effects in `js/narrative-data.gen.js` (not individually located; M8
  is a generated act-4 mission per project memory).
- **RESIDUE?**: none identified — town's classic cast (`bobby`/`donna`/`jacoby`)
  is read by their own dialogue cascades through at least the `gigante2`
  transition; no dead cond found pointing at an act already fully passed.

## sheriff

- **STATIC POPULATION** (classic, `js/glue.js:30-38`): `truman`, `andy`,
  `hawk`, `lucy` (all unconditional presence — their `cond`-free NPC entries;
  only their *dialogue* cascades vary by flag).
- **CONDITIONAL POPULATION**:
  - `leland` — `cond: ['flag:atto5', '!flag:leland_morto']`
    (`js/glue.js:44-46`)
- **MISSION-OWNED POPULATION**: none found for `sheriff` in `NARRATIVE_ENTITIES`.
- **CHARACTERS WHO MAY ARRIVE**: `leland` arrives once `atto5` is set (and
  only while alive).
- **WHO MAY LEAVE**: `leland` leaves once `leland_morto` is set (his death,
  Act 5 climax) — `setFlag: 'leland_morto'` at `js/data.js:755`.
- **WHO OWNS THOSE TRANSITIONS**: `atto5` — classic flag (act transition,
  writer not individually located this pass); `leland_morto` — `js/data.js:755`.
- **RESIDUE?**: `truman`/`andy`/`hawk`/`lucy` dialogue cascades read
  `flag:leland_morto` / `flag:atto3` / `flag:sogno_fatto` /
  `flag:jacques_preso` (`js/glue.js:31-42`) — these are live through Act 5,
  not residue. No residue identified for this map.

## room_315

- No classic NPC entry for `room_315` exists in `NPCS` (`js/glue.js`) — the
  only inhabitant-shaped content on this map is the `specchio315` /
  `letto_315` / `scrivania_315` interact-object cascades
  (`js/glue.js:98-113`), which are object interactions, not characters.
- **STATIC / CONDITIONAL / MISSION-OWNED POPULATION**: none. Room 315 has no
  character presence mechanism registered anywhere in this audit.
- **RESIDUE?**: n/a — permanently uninhabited by design (per project memory,
  "Room 315 state," this room is a scene/investigation space, not a
  populated one).

## hotel_gn (Great Northern lobby)

- **STATIC POPULATION** (classic, `js/glue.js:53-56`): `benhorne`, `audrey`
  (both unconditional NPC presence; only `audrey`'s dialogue cascade varies).
- **CONDITIONAL POPULATION**: none beyond the dialogue cascade
  (`audrey`'s cascade reads `flag:done_benhorne_a2`).
- **MISSION-OWNED POPULATION**: none found for `hotel_gn` in
  `NARRATIVE_ENTITIES`.
- **CHARACTERS WHO MAY ARRIVE / LEAVE**: none — both NPCs are permanently
  present once the map is reachable.
- **WHO OWNS THOSE TRANSITIONS**: n/a.
- **RESIDUE?**: `benhorne`'s dialogue is hardcoded to the single string
  `'benhorne_a2'` (`js/glue.js:53`) with no cascade at all — if later acts
  add content for Ben Horne elsewhere, this entry would never update; flagged
  as a **possible latent residue point** (not confirmed residue, since no
  later-act override was found to be missing — just structurally static).

## hospital

- **STATIC POPULATION** (classic, `js/glue.js:59-60`): `gerard` — single
  fixed dialogue `'gerard_a2'`, no cond.
- **MISSION-OWNED POPULATION** (adapter, `js/narrative-engine-adapter.js:157-176`):
  - `ronette` — `when: null` (always present)
  - `infermiera` — `when: null` (always present)
  - `piantone` — `when: { all: [{ flag: 'jacques_preso' }, { not: { flag: 'jacques_dead' } }] }`
  - `piantone_ronette` — `when: { flag: 'jacques_dead' }`
- **CHARACTERS WHO MAY ARRIVE**: `piantone` arrives once Jacques is arrested
  (`jacques_preso` set — mission node effect,
  `js/narrative-data.gen.js:4004` region, `"set": "jacques_preso"`).
  `piantone_ronette` arrives once Jacques dies (`jacques_dead`).
- **WHO MAY LEAVE**: `piantone` leaves the instant `jacques_dead` is set
  (mutually exclusive with `piantone_ronette` by design — "il piantone
  raddoppiato" comment, `js/narrative-engine-adapter.js:~170-176`).
- **WHO OWNS THOSE TRANSITIONS**: `jacques_preso`/`jacques_dead` — M6
  mission node effects in `js/narrative-data.gen.js`.
- **NOTE — off-books draw**: Ronette's npc record is present per above, but
  her sprite is drawn as bed furniture, not as a standing character (see
  `presence-sources.md` Mechanism 4, `js/hospital-scene.js:114-120`,
  `js/hospital-art.js` `drawRonetteBed`). She is interactable at her roster
  position but visually diverted.
- **RESIDUE?**: `gerard`'s single unconditional `'gerard_a2'` dialogue is
  identical in shape to Ben Horne's — a fixed Act-2-labeled line with no later
  override found; flagged as a **possible latent residue point**, last act
  confirmed to read it: Act 2 (per the `_a2` suffix convention used
  throughout `glue.js`).

## diner

- **STATIC POPULATION**: none as pure unconditional — `norma` and `shelly`
  are present unconditionally as NPC entries (`js/glue.js:63-67`) but both
  carry conditional *dialogue* cascades, not presence conds.
- **CONDITIONAL POPULATION** (classic, `js/glue.js:70`):
  - `james` — `cond: 'flag:sogno_fatto'`
  - `loglady` present unconditionally (`js/glue.js:69`, dialogue cascade
    reads `flag:atto4`, no presence cond).
- **MISSION-OWNED POPULATION** (adapter, `js/narrative-engine-adapter.js:222-233`):
  - `maddy` — `when: { all: [{ flag: 'atto4' }, { not: { value_set: 'promise_stance' } }] }`
  - `leland` — `when: { all: [{ flag: 'atto4' }, { not: { evidence: 'T_LELAND_TAXI' } }] }`
    — **note**: this is a *second* `leland` entity id, distinct from the
    `sheriff` map's classic `leland`; both share the id `leland` but on
    different maps, so `indexOfNpc`'s id-only dedupe (per `presence-sources.md`
    Mechanism 2) does not collide across maps — only within the same map's
    roster. Confirmed by the adapter's own comment
    (`js/narrative-engine-adapter.js:~218-221`): "m8_leland_waiting
    (¬promise_stance) e m8_leland_taxi (promise_stance) si dividono la
    finestra sullo stesso attore, mai due root vive insieme."
- **CHARACTERS WHO MAY ARRIVE**: `maddy` and diner-`leland` both arrive at
  `atto4`.
- **WHO MAY LEAVE**: `maddy` leaves once `promise_stance` is set (comment,
  `js/narrative-engine-adapter.js:~218-221`: "Dopo la promessa torna a casa
  Palmer... il mondo non la mostra più al diner"). diner-`leland` leaves once
  `T_LELAND_TAXI` evidence is obtained.
- **WHO OWNS THOSE TRANSITIONS**: `atto4` — classic flag; `promise_stance` —
  M8 mission node effect, `js/narrative-data.gen.js:4598`/`4664`/`4689`
  (`"value_set": "promise_stance"`); `T_LELAND_TAXI` — evidence-acquisition
  effect (not individually located this pass).
- **RESIDUE?**: `james`'s presence cond is `flag:sogno_fatto` (Act 2 dream
  beat) with no upper bound — he stays present through every later act once
  that flag is set, and his dialogue is a single fixed `'james_a2'` string
  (`js/glue.js:70`) with no cascade for acts 3-5. Flagged as **confirmed
  residue**: last act his dialogue cascade actually branches for is Act 2;
  he remains physically present and interactable with stale Act-2 dialogue
  through the rest of the game.

## woods

- `NPCS.woods: []` (`js/glue.js:72`) — no classic NPCs.
- No `NARRATIVE_ENTITIES` rows target `map_id: 'woods'`.
- **RESIDUE?**: n/a — permanently uninhabited.

## redroom

- **STATIC / CONDITIONAL POPULATION** (classic, `js/glue.js:74-84`, all
  finale-only dream-sequence actors):
  - `mfap` — unconditional presence, dialogue cascade on `flag:leland_morto`
  - `laura` (named `'Ombra'` in-scene) — unconditional presence, 3-step
    dialogue cascade (`leland_morto` → `met_mfap` → fallback hint)
  - `bob` — `cond: ['flag:leland_morto']`
- **MISSION-OWNED POPULATION**: none found.
- **RESIDUE?**: n/a — this map is the finale dream sequence by design; its
  entire cast is act-terminal, not residue in the "stale cascade" sense
  since there is no later act to have passed it by.

## traincar

- `NPCS.traincar: []` (`js/glue.js:85`) — classic cast retired in favor of
  the adapter (documented at `js/narrative-engine-adapter.js:~30-33`, "il
  pass 01 ha ritirato i NPC classici... Le presenze ora sono narrative").
- **MISSION-OWNED POPULATION** (adapter, `js/narrative-engine-adapter.js:195-216`):
  - `truman` — `when: { all: [{ value_set: 'm5_final_theory' }, { not: { flag: 'east_route_confirmed' } }] }`
  - `hawk_bridge` — `when: { all: [{ node_done: 'm5_bridge' }, { not: { flag: 'vagone_scoperto' } }] }`
  - `hawk_door` — `when: { all: [{ flag: 'vagone_scoperto' }, { not: { value_set: 's1' } }] }`
  - `hawk_cut` — `when: { value_set: 's1' }`
- **CHARACTERS WHO MAY ARRIVE**: Truman only once Cooper reaches a final
  theory (`m5_final_theory`); Hawk cycles through three distinct
  placements/ids as the M5 mission progresses (never two live at once — same
  discipline as the diner Leland split).
- **WHO MAY LEAVE**: Truman leaves once `east_route_confirmed` (goes back to
  the station — "nessun doppione fisico fra mappe" per adapter comment).
  Each `hawk_*` id retires as the next `when` window opens.
- **WHO OWNS THOSE TRANSITIONS**: `m5_final_theory`/`m5_bridge`/
  `vagone_scoperto`/`s1`/`east_route_confirmed` — M5 mission node effects
  (act-3 mission, per project memory "Act 3 pass 01 state").
- **RESIDUE?**: none — this is a fully mission-choreographed map with no
  classic cast to go stale.

## oej (One Eyed Jacks)

- `NPCS.oej: []` (`js/glue.js:86`) — classic cast retired, same pattern as
  traincar.
- **MISSION-OWNED POPULATION** (adapter, `js/narrative-engine-adapter.js:180-193`):
  - `jacques` — `when: { not: { flag: 'jacques_preso' } }`
  - `audrey` — `when: { all: [{ flag: 'audrey_indaga' }, { not: { flag: 'audrey_vista_oej' } }, { not: { flag: 'jacques_preso' } }] }`
- **CHARACTERS WHO MAY ARRIVE**: `audrey` only while she's investigating and
  hasn't yet been seen by Cooper here.
- **WHO MAY LEAVE**: `jacques` leaves the instant he's arrested
  (`jacques_preso`). `audrey` leaves on any of: Cooper sees her here
  (`audrey_vista_oej`, "m6_audrey è l'unico writer" per adapter comment),
  Jacques is arrested, or she stops investigating.
- **WHO OWNS THOSE TRANSITIONS**: `jacques_preso`/`audrey_vista_oej`/
  `audrey_indaga` — M6 mission node effects.
- **RESIDUE?**: none — fully mission-choreographed, empty classic cast.

## roadhouse

- No classic `NPCS` entry exists for `roadhouse` at all (absent from the
  `NPCS` object in `js/glue.js` entirely — not even an empty array; the map
  gets `npcs: NPCS[id] || []` from `js/glue.js:156`, which safely defaults to
  `[]`).
- **MISSION-OWNED POPULATION** (adapter, all gated on Act 4 M8 beats,
  `js/narrative-engine-adapter.js:237-282`):
  - `truman` — `when: { all: [{ flag: 'atto4' }, { not: { value_set: 'warning_target' } }] }`
  - `bobby`, `donna`, `james`, `shelly`, `norma`, `loglady` — same `when` as
    Truman (the roadhouse "crowd" of already-known town NPCs, re-placed here
    with distinct roadhouse coordinates; comment calls this deliberate
    scenography, `dialogue: null` for the crowd except Truman who has a
    mission node)
  - `gigante` — `when: { all: [{ value_is: { name: 'presagio_status', equals: 'active' } }, { not: { value_set: 'warning_target' } }] }`
- **CHARACTERS WHO MAY ARRIVE**: entire cast arrives together at `atto4`
  (before `warning_target`); the Giant arrives specifically when
  `presagio_status` becomes `active`.
- **WHO MAY LEAVE**: the whole cast (Truman + crowd + Giant) leaves once
  `warning_target` is set (the vision/warning has been delivered — mission
  moves on).
- **WHO OWNS THOSE TRANSITIONS**: `warning_target` — M8 mission node effect,
  `js/narrative-data.gen.js:4630`/`4650`/`4960` (`"value_set": "warning_target"`);
  `presagio_status` — M8 mission state value (not individually located to a
  set-site this pass).
- **NOTE**: this is a case of the **same actor id reused across maps**
  simultaneously possible in principle — `bobby`/`donna`/`james`/`shelly`/
  `norma`/`loglady` also have classic entries on `town`/`sheriff`/`diner`.
  Since `syncNarrativeEntities`'s dedupe is per-map (`classicIdsFor(ent.map_id, map)`),
  there is no cross-map duplicate-presence risk — but it does mean, e.g.,
  Bobby can be "in town" (classic, gated `!gigante2`) and "at the roadhouse"
  (adapter, gated `atto4 ∧ ¬warning_target`) at overlapping flag states if
  `gigante2` and `atto4` are ever both true at once with `warning_target`
  unset. Not independently verified whether the mission graph makes those
  flag states mutually exclusive in practice — flagged as **worth checking**,
  not confirmed as a bug.
- **RESIDUE?**: none — fully mission-choreographed.

## sheriffs_station_exterior (runtime-registered, world-catalog)

- Registered directly by `js/sheriffs-station-exterior-scene.js:14-19` with
  a hardcoded `npcs: []`; this map is **not** in `js/maps.js` and is **not**
  a key in the classic `NPCS` object (it bypasses `js/glue.js` entirely —
  registered straight into `G.Maps[MAP]`).
- No `NARRATIVE_ENTITIES` row targets `map_id: 'sheriffs_station_exterior'`.
- **RESIDUE?**: n/a — permanently and unconditionally uninhabited by every
  mechanism found in this audit. If a future mission wants an exterior actor
  here (e.g. a stakeout), no gating pattern currently exists to add one
  except by editing this scene file's hardcoded `npcs: []` or adding a
  `NARRATIVE_ENTITIES` row with this `map_id`.

## double_r_exterior_prototype (runtime-registered, world-catalog)

- Registered directly by `js/double-r-exterior-scene.js:8-13` with a
  hardcoded `npcs: []`; same bypass-of-glue.js pattern as the sheriff
  exterior.
- No `NARRATIVE_ENTITIES` row targets `map_id: 'double_r_exterior_prototype'`.
- **RESIDUE?**: n/a — permanently and unconditionally uninhabited.

## lake / shore

- **Not a separate map.** The lake/shore beats (`lago_riva` interact cascade,
  `js/glue.js:103-107`; the M8 body-discovery Hawk placements) are all
  authored as tile coordinates inside the **`town`** map (see `town` row
  above — `hawk_shore_first`/`hawk_shore_after` place Hawk at `town`
  `(16,27)`). There is no `lake`/`shore` map id in `js/maps.js` or
  `world-catalog.js`.

## cabin / intro / finale scenes

- `arrival` exists as a map id in `js/maps.js:35` but was not covered by
  either the classic `NPCS` table (no `arrival` key found — defaults to
  `[]`) or any `NARRATIVE_ENTITIES` row (no `map_id: 'arrival'` row found).
  **RESIDUE?**: n/a — appears permanently uninhabited by every mechanism in
  this audit; not independently confirmed whether the intro sequence draws
  characters through some other special-cased path (`js/main.js` intro logic
  was not traced in this pass — flagged as an open item).
- No dedicated "cabin" map id exists in `js/maps.js`'s id list (`arrival`,
  `town`, `sheriff`, `palmer`, `room_315`, `hotel_gn`, `hospital`, `diner`,
  `woods`, `redroom`, `traincar`, `oej`, `roadhouse` — 13 ids total, plus the
  2 runtime-registered exteriors above = 15 total reachable map/scene ids).
  The finale sequence is handled by `js/narrative-finale-production.js`
  operating on already-existing maps (e.g. `hospital`/`traincar` per its
  `actorId` references) rather than a separate finale map.

---

## Summary for team lead

**Mechanisms found**: 4 total that touch presence/drawing —
(1) classic `NPCS` table (`js/glue.js`), (2) adapter `NARRATIVE_ENTITIES` +
`syncNarrativeEntities` merge (`js/narrative-engine-adapter.js`),
(3) adapter `WORLD_TARGETS` (objects only, never a body, ruled out), and
(4) an off-books furniture-draw special case for Ronette
(`js/hospital-scene.js`/`js/hospital-art.js`) that diverts her sprite draw
away from the normal character path while keeping her interactable.
`character-activity.js`, `ambient-life.js`, and every `*-production.js`/
`*-scene.js`/`*-art.js` environment module were checked and confirmed to
**not** spawn characters — they only animate or render what mechanisms 1-2
already placed in the single authoritative roster `S.npcs`, which
`render3d.js` also reads directly (no parallel 3D-only roster).

**Can duplicate?**: Mechanism 2 dedupes against Mechanism 1 **by id only**,
scoped per-map (`classicIdsFor(map_id)`), computed once and cached. It does
**not** check tile position or sprite. Two classic-and-adapter entries with
*different* ids can in principle occupy the same tile undetected — outcome
is array-order dependent in `npcAt()` (classic wins unless its own `cond` is
false). No such live collision was found in the current data, but no
structural guard prevents one being introduced. Same-id reuse across
*different* maps (e.g. `leland` on both `sheriff` and `diner`, or the whole
roadhouse "crowd" reusing town-NPC ids) is safe by design since dedupe is
per-map — flagged one specific case worth checking (Bobby/Donna/etc.
theoretically eligible on both `town` and `roadhouse` simultaneously if
`gigante2` and `atto4∧¬warning_target` ever overlap; not confirmed as
reachable).

**Save persistence**: Confirmed — nothing about NPC presence is ever saved.
`classicSnapshot()` (`js/narrative-production.js:17-27`) persists only
`mapId`, player `tx/ty/dir`, `clues`, `flags`. The entire NPC roster (both
classic and adapter-owned) is re-derived from current flags/state on every
map load and on every narrative commit via `syncNarrativeEntities`.

**5 most residue-laden maps** (classic NPC whose dialogue cascade serves an
act already passed, while presence itself has no upper bound):
1. **diner** — `james` (`js/glue.js:70`): presence cond `flag:sogno_fatto`
   (Act 2) has no closing cond; single fixed `'james_a2'` dialogue string,
   no branch for Acts 3-5. **Confirmed residue.**
2. **hospital** — `gerard` (`js/glue.js:59-60`): unconditional presence,
   single fixed `'gerard_a2'` dialogue, no later-act branch found.
   **Likely residue**, last act read: Act 2.
3. **hotel_gn** — `benhorne` (`js/glue.js:53`): unconditional presence,
   single fixed `'benhorne_a2'` dialogue, no cascade at all.
   **Likely residue**, last act read: Act 2.
4. **sheriff** — none confirmed stale; `truman`/`andy`/`hawk`/`lucy` all read
   flags through Act 3-5 in their cascades. Listed here only because it is
   the map with the most *live* cascade depth to re-check as new acts land,
   not because residue was found.
5. **town** — `bobby`/`donna`/`jacoby` cascades were not deeply
   individually re-checked for post-`gigante2` dialogue content beyond their
   presence cond; flagged as the map most worth a follow-up dialogue-cascade
   pass since it's the highest-traffic hub map.

(Only items 1-3 are confirmed/likely residue by direct inspection; items 4-5
are flagged as follow-up priorities, not confirmed findings — stated
explicitly to avoid overclaiming.)
