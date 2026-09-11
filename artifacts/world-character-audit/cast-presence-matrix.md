# Cast presence matrix — Acts 1–4

Read-only forensic audit. Source is reality: `js/glue.js` `NPCS` (classic), `js/narrative-engine-adapter.js` `NARRATIVE_ENTITIES` (narrative registry), `js/narrative-production.js` (`syncClassicToNarrative`/`syncNarrativeToClassic`), `js/engine.js` `npcActive`/`checkCond` (live cond evaluation), `docs/story/timeline.md`, `artifacts/act-4-design/offscreen-timeline.md`. No fixes, no opinions.

## Roster (25 sprite ids, `js/chars.js` `S.CHARS`)

cooper (player, excluded below), truman, lucy, andy, hawk, sarah, leland, norma, shelly, loglady, bobby, donna, jacoby, audrey, mfap, laura, gerard, benhorne, giant, maddy, bob, james, jacques, ronette, infermiera.

## Windows and defining flags (confirmed against mission JSON / `docs/story/timeline.md`)

There is **no `atto2` flag** — it does not exist anywhere in `js/*.js`, `narrative/missions/*.json`, or `docs/story`. Act 2 has no dedicated boundary flag of its own; it lives inside the `sogno_fatto → atto3` span.

| Window | Bounds | Set by |
|---|---|---|
| W1 | start → `sogno_fatto` | M3 dream node (Red Room) |
| W2 | `sogno_fatto` → `atto3` | (no distinct flag from W3; same span) |
| W3 | `sogno_fatto` → `atto3` (hospital/Room 315/Ronette) | M4 `m4.b9.present_p2` sets `atto3` |
| W4 | `atto3` → `east_route_confirmed` | M5 `m5_tracks_north` sets `east_route_confirmed` (narrative-production.js:157 mirrors it to classic) |
| W5 | `east_route_confirmed` → `gigante1` (OEJ→hospital guard→Room 315) | `jacques_preso` (M6.json:1217), `jacques_dead` (M6.json:1492), `gigante1` (M6/M7 mirror flag) |
| W6 | `atto4` set, `promise_stance` unset | M6.json:1617 sets `atto4`; M8 `m8_diner` promise choices set `promise_stance` |
| W7 | `promise_stance` set, `presagio_status` unset | `m8_leland_waiting` node active |
| W8 | `presagio_status=active`, `warning_target` unset (Roadhouse) | `m8_roadhouse_truman` sets `presagio_status=active` **and** is the sole writer that syncs `gigante2` to classic (`narrative-production.js:166`) |
| W9 | `warning_target` set, `maddy_trovata` unset | `m8_roadhouse_phone` branches (`warning_palmer`/`warning_centrale`) set `warning_target` |
| W10 | `maddy_trovata` set, before `node_done:m8_station` | `m8_discovery` sets `maddy_trovata` |
| W11 | after `node_done:m8_station` / `atto5` | M9.json:447 sets `atto5` |

`gigante2` (classic-only flag) turns true exactly at the W7→W8 boundary and **never turns back off** — it is written once (`narrative-production.js:166`, `if (state.nodes_done.m8_roadhouse_truman) classicFlags.gigante2 = true;`) and nothing in the codebase clears it. This is a **permanent suppression** trigger for every classic NPC gated `!flag:gigante2`.

---

## Truman

- Classic (`sheriff`, `js/glue.js:29`): `x10,y4`, unconditional (no `cond`), dialogue cascade `leland_morto→leland_fine / atto3→wait3 / clues6→atto3 / sogno_fatto→a2 / else truman`. **Present in every window W1–W11.**
- Narrative `traincar` (`js/narrative-engine-adapter.js:195-199`, id `truman`): present when `value_set:'m5_final_theory' && !flag:'east_route_confirmed'`. Reachable only inside W4 (theory formed, before north cut confirmed).
- Narrative `roadhouse` (adapter:253-257, id `truman`): present when `flag:'atto4' && !value_set:'warning_target'`. Spans **W6, W7, W8** (not gated on `promise_stance`/`presagio_status`, only on `atto4` and `warning_target`).
- EXPECTED (story): `docs/story/timeline.md` T28 "Truman on site" at the traincar during W4/W5; T36 "Act 4 bridge" at the station; M8 roadhouse scene `m8.b.truman.*` puts him at the Roadhouse table in W8 specifically (per invariant text, "l'enunciato è solo per Cooper"). Story is silent on whether he is also physically at the Roadhouse during W6/W7 (before the giant speaks) — **unspecified**.
- **DUPLICATE**: During W4 (`m5_final_theory` set, `east_route_confirmed` unset) Truman has a live body in `traincar` (narrative) **and** simultaneously in `sheriff` (classic, unconditional) — both maps are player-reachable in that window. `js/narrative-engine-adapter.js:195-199` vs `js/glue.js:29-36`.
- **DUPLICATE**: During W6 and W7 (`atto4` true, `warning_target` unset, but `presagio_status` not yet active — i.e. before the Roadhouse scene "should" start per the offscreen-timeline draft) Truman already has a body at `roadhouse` **and** at `sheriff` simultaneously, because the `roadhouse` entity's `when` only checks `atto4 && !warning_target`, not `presagio_status`. `js/narrative-engine-adapter.js:253-257`.
- SAVE/LOAD: safe — depends only on `flags.atto4`, `value_set` checks (`m5_final_theory`, `east_route_confirmed`, `warning_target`), all serialized narrative state.

## Hawk

- Classic (`sheriff`, `js/glue.js:33`): `x12,y8`, unconditional, dialogue `sogno_fatto→a2`. **Present W1–W11.**
- Narrative `traincar` — three mutually-exclusive collocations by design (same id family, adapter comments explain this is deliberate, not a bug): `hawk_bridge` (5,6) when `node_done:'m5_bridge' && !flag:'vagone_scoperto'`; `hawk_door` (14,8) when `flag:'vagone_scoperto' && !value_set:'s1'`; `hawk_cut` (22,3) when `value_set:'s1'`. All three fall inside W4/W5.
- Narrative `town` — `hawk_shore_first` (16,27) when `value_is:{body_found_by:'hawk'} && !flag:'maddy_trovata'` (W10 boundary, before discovery lands); `hawk_shore_after` (16,27) when `flag:'maddy_trovata' && !node_done:'m8_station'` (W10).
- **DUPLICATE**: Every one of the traincar Hawk entities coexists with the unconditional classic `sheriff` Hawk body during W4/W5 — Hawk is simultaneously "at his post" and "at the traincar" for the whole of Act 3. Same class of issue as Truman above.
- **DUPLICATE**: `hawk_shore_first`/`hawk_shore_after` (town, W10) also coexist with the classic `sheriff` Hawk body — no `cond` on the classic entry ever removes him from the station while he's supposedly at the lake.
- `offscreen-timeline.md` explicitly notes Hawk's absence from the Roadhouse (W8) and the station (until T7) is "staging proposed... none yet" — i.e. the design intends an absence that is **not implemented**: no entity or cond currently removes classic Hawk from `sheriff` during W8/W9, and Hawk has no Roadhouse-crowd narrative entity either (he's simply not in the `roadhouse` `NARRATIVE_ENTITIES` list at all). Confirmed MISSING/absent-by-design-but-silent — the classic sheriff body is the only body during W8/W9, which coincidentally matches "on patrol" but is not distinguishable from every other window.
- SAVE/LOAD: safe — all conditions are flags/`value_set`/`node_done`.

## Lucy / Andy (sheriff, unconditional classic only)

- Lucy (`js/glue.js:35`): `x2,y6`, dialogue `jacques_preso→a3`. No narrative-registry entity anywhere. Present W1–W11 with no removal/relocation ever. `docs/story/timeline.md` T34 has her at the station taking the call in W5, T7′/`m8.f.station.sarah_truman` scenes reference her via dialogue only in W10 — consistent with a static desk body; story never places her elsewhere. SAVE/LOAD: n/a (unconditional).
- Andy (`js/glue.js:32`): `x10,y7`, dialogue static (`'andy'`, no cascade). No narrative-registry entity. Offscreen-timeline T4′/T7′ has Andy dispatched to Palmer house and later staying with Sarah (W9/W10) — **story says Andy leaves the station in W9/W10, engine never moves or hides him.** MISSING (expected absence from `sheriff`, and expected presence at `palmer`, neither implemented) / STALE (classic body sits at the desk through the whole game regardless of the Palmer-house dispatch the dialogue describes).

## Norma / Shelly / James / Log Lady (diner classic + Roadhouse crowd)

- Norma (`js/glue.js:63`): `diner x5,y2`, unconditional, dialogue `sogno_fatto&&done_norma→a2`. Present W1–W11.
- Shelly (`js/glue.js:65`): `diner x9,y7`, unconditional, dialogue `done_bobby→shelly_bobby`. Present W1–W11.
- James (`js/glue.js:69`): `diner x9,y6`, `cond: 'flag:sogno_fatto'` — **absent in W1**, present W2–W11 once `sogno_fatto` is set (never gated off again).
- Log Lady (`js/glue.js:67`): `diner x4,y5`, unconditional, dialogue `atto4→a4`. Present W1–W11.
- Narrative `roadhouse` entities for all four (`bobby` excluded here, see below): Norma (5,6), Shelly (3,6), James (2,4), Log Lady (2,6) — all `when: flag:'atto4' && !value_set:'warning_target'` (adapter:267-291). Reachable **W6, W7, W8**.
- **CONFIRMED DUPLICATE (all four)**: none of these four classic diner NPCs carry a `gigante2`-style suppression cond (unlike bobby/donna/jacoby/sarah). During W6/W7/W8 they each have a live body simultaneously at `diner` (classic, unconditional) and at `roadhouse` (narrative). This is broader than the town characters' duplicate window because there is no suppression flag at all for the diner four — the Roadhouse crowd entities never remove the diner originals, in any window including **W8 itself** (crowd should logically replace the diner regulars once they're "at the Roadhouse", but the diner bodies never disappear).
- STALE AFTER WINDOW: once `warning_target` is set (W9+) the Roadhouse crowd vanishes (`sync` removes them), but nothing sends them back to `diner`/elsewhere — they simply cease to exist as bodies anywhere narrative-owned, while the classic diner bodies (which never moved) are still there. Not stale exactly, but the Roadhouse "crowd" concept has no return journey.
- SAVE/LOAD: safe (flags/`value_set`).

## Bobby / Donna / Jacoby (town classic with `!flag:gigante2` + Roadhouse crowd)

- Bobby (`js/glue.js:12`): `town x31,y16`, `cond:['!flag:gigante2']`, wander:true. Andy-style permanent suppression once `gigante2` fires (start of W8) — **present W1–W7, absent W8–W11 forever** (no un-set of `gigante2` exists).
- Donna (`js/glue.js:19`): `town x44,y10`, same cond, same window (W1–W7 present, W8–W11 absent).
- Jacoby (`js/glue.js:22`): `town x16,y25`, same cond — **but Jacoby has no narrative-registry counterpart anywhere** (not in the Roadhouse crowd list, not referenced in `NARRATIVE_ENTITIES` at all). He simply vanishes at W8 and is **never seen again for the rest of the game** (W8–W11: MISSING, no body anywhere). `docs/story/characters/` has no `jacoby.md`; story is silent on where he goes — unspecified, but the permanent disappearance itself is a confirmed engine fact.
- Narrative `roadhouse`: Bobby (3,4), Donna (5,4) — `when: atto4 && !warning_target` (adapter:258-266, :267-271). Reachable W6, W7, W8.
- **CONFIRMED DUPLICATE (Bobby, Donna)**: during **W6 and W7** — `atto4` true, `gigante2` still false (only flips at `m8_roadhouse_truman` completion, i.e. the W7→W8 boundary) — Bobby and Donna have a live body at `town` (classic, cond still passes) **and** at `roadhouse` (narrative, cond already passes) simultaneously. The suppression that is supposed to prevent the duplicate (`!flag:gigante2`) only takes effect one node later than the Roadhouse entity's own gate.
- Once `gigante2` flips (W8) the town duplicate resolves itself (classic body disappears), so W8 itself is clean for Bobby/Donna, unlike the diner four above.
- SAVE/LOAD: safe for Bobby/Donna (flags only). Jacoby is trivially safe (single unconditional-minus-one-flag cond) but is a dead end from W8 on.

## Sarah (palmer classic + narrative)

- Classic (`js/glue.js:47`): `palmer x9,y7`, `cond:['!flag:gigante2']`, dialogue `atto4→sarah_visione`. Present W1–W7, permanently absent W8–W11 (same `gigante2` mechanism as Bobby/Donna/Jacoby).
- No narrative-registry entity for Sarah anywhere — she is never staged at the Roadhouse, the lake, or the station for W8–W11, despite `docs/story/timeline.md` T51 (Maddy home, Leland/BOB already inside, "Sarah senses") and offscreen-timeline T2/T7′ (Sarah with Andy/Truman at the house, "does not find the body") being explicit story beats that happen during exactly this span.
- **CONFIRMED MISSING**: Sarah has no body anywhere in the game from W8 onward, for the rest of Acts 4–5 as covered by this audit (through W11/`atto5`). The story beats involving her (`sarah_visione_ascoltata` flag exists per `narrative-production.js:141` sync list, suggesting a dialogue node references her) are handled entirely through text (Truman/Lucy dialogue), never through a placed sprite.
- SAVE/LOAD: safe (single flag).

## Leland / Maddy (diner narrative; Palmer classic non-existent for either)

- Leland (`js/glue.js:38`, `sheriff`): `x8,y5`, `cond:['flag:atto5','!flag:leland_morto']`. Present **only W11** (post-`atto5`, i.e. after M9), absent W1–W10, and disappears again once `leland_morto` fires (end-of-Act-5 death, outside this audit's window range but worth flagging: within W11 he is present until that flag, which this audit does not further subdivide).
- Narrative `diner`, id `leland` (adapter:239-243): `x11,y1`, `when: flag:'atto4' && !evidence:'T_LELAND_TAXI'`. Present **W6 and W7** (evidence `T_LELAND_TAXI` is the taxi-lie testimony recorded in `m8_leland_taxi`/`m8_leland_waiting`, which per `offscreen-timeline.md` happens at T0.5, inside W6). Once that evidence is logged he is removed for W8–W10 with **no replacement body anywhere** — Leland (as BOB) is "already inside the house" per T2/T51 for W7 end through W10, entirely offscreen by story design (`must stay HIDDEN` column explicitly says so), so the absence of a sprite W8–W10 is **intentional per story**, not a bug.
- Maddy: **no classic entry exists at all** — `js/glue.js` has no `maddy` NPC in any map. Narrative `diner`, id `maddy` (adapter:229-233): `x10,y1`, `when: flag:'atto4' && !value_set:'promise_stance'`. Present **only W6**. Absent every other window, W1–W5 and W7–W11, matching the story (she doesn't exist as a character until Act 4, and is killed by W10 with no body ever placed at the lake or anywhere else — her death/discovery is handled entirely via dialogue, per `m8_discovery`/`m8_station`).
- Leland and Maddy occupy adjacent diner tiles (`11,1` and `10,1`) during their one shared window (W6) — not a duplicate (different characters), noted only because both narrative entities are diner-owned and both keyed off `atto4`.
- SAVE/LOAD: safe for both (flags/`evidence`/`value_set`).

## Audrey (hotel/OEJ)

- Classic (`hotel_gn`, `js/glue.js:41`): `x12,y9`, unconditional, wander:true, dialogue `done_benhorne_a2→a2_ben`. Present W1–W11, no cond ever suppresses her.
- Narrative `oej`, id `audrey` (adapter:187-191): `x13,y7`, `when: flag:'audrey_indaga' && !flag:'audrey_vista_oej' && !flag:'jacques_preso'`. Reachable inside **W4/W5**, specifically before `jacques_preso` fires (so this window closes mid-W5, at the M6 arrest).
- **CONFIRMED DUPLICATE**: whenever the OEJ condition holds, Audrey has a live body at `hotel_gn` (classic, unconditional) **and** `oej` (narrative) simultaneously — same class of bug as Truman/Hawk. `docs/story/timeline.md` T42 even narrates her "returning on the eight o'clock boat" afterward, i.e. story explicitly treats her as *away* from the hotel during the OEJ visit; the classic hotel body never reflects that.
- SAVE/LOAD: safe (flags).

## Gerard (hospital)

- Classic (`hospital`, `js/glue.js:44`): `x11,y4`, unconditional, dialogue static `gerard_a2`, `dir:'left'`. Present W1–W11 with no window-based variation at all — same body throughout the whole audited span, including W5 (when the hospital gets a second guard NPC, `piantone`) and W9-W11 (long after his one scene is narratively "done").
- No narrative-registry entity. `docs/story/timeline.md` T23 places him only in the early hospital scene (W2/W3); nothing in `docs/story` describes him beyond that. STALE AFTER WINDOW: his body and dialogue never change or retire once his one scene (`m4.b3.gerard_a2`) is exhausted — replaying the room after Act 3/4 still finds the same static `gerard_a2` cascade with no acknowledgment of the guard now standing a few tiles away or of anything that happened since.
- SAVE/LOAD: n/a (unconditional).

## Ronette (hospital)

- Narrative-only, `when: null` (adapter:158): `x3,y5`, `dialogue: null`, unconditional presence once the entity registry is active (i.e. from game boot). No classic entry exists for Ronette in `js/glue.js` at all — she is 100% narrative-registry.
- Present in every window this audit covers (W1–W11) since `when: null` never removes her, and the `hospital` map itself is reachable throughout.
- `docs/story/characters/ronette.md` and T59 ("Ronette, awake, one line") describe her waking at the epilogue — outside the mission-node coverage of M4–M9 as far as this registry goes; there's no `when` transition modeling her waking up, coma-vs-awake state, or eventual discharge. Her sprite/position never change regardless of `jacques_preso`/`jacques_dead`/`gigante1`/`atto4` etc.
- SAVE/LOAD: n/a (always present; not flag-dependent).

## Jacques (OEJ/hospital)

- Narrative `oej`, id `jacques` (adapter:182-186): `x7,y5`, `when: !flag:'jacques_preso'`. Present W1–W5 (up to the arrest inside W5), absent W6–W11 (permanently, since `jacques_preso` never unsets).
- No classic OEJ entry for Jacques anywhere in `js/glue.js` (`oej: []`) — he is 100% narrative.
- After arrest he is implicitly "at the hospital" per `docs/story/timeline.md` T30/T31/T33/T34 (broken leg, guarded room, then killed offscreen) but **no sprite is ever placed for him at `hospital`** — the `piantone`/`piantone_ronette` guard entities represent the guard, not Jacques himself. This matches the story's intent (he's meant to be unseen/offscreen per T33/T41, "must stay HIDDEN"), so the absence of a body W5(post-arrest)–W11 is **story-correct**, not a bug — flagging only because a naive reading of "Jacques is at the hospital" would expect a body and there isn't one.
- SAVE/LOAD: safe (single flag).

## Giant (room_315 classic dialogue-only + Roadhouse)

- No classic NPC entry for `giant`/`gigante` anywhere in `js/glue.js` `NPCS`. His only classic-layer manifestation is the `specchio315` interact object in `hospital`... no — in `room_315` mirror interact (`INTERACT_DLG.specchio315`, `js/glue.js:100-104`), which is a static object dialogue (`gigante1_dlg` when `jacques_morto`), never an NPC body. So there is **no Giant sprite in Room 315 at all** — the mirror scene is dialogue-only.
- Narrative `roadhouse`, id `gigante` (adapter:295-299): `x8,y1`, `when: value_is:{presagio_status:'active'} && !value_set:'warning_target'`. Present **W8 only** — the one and only window the Giant has a physical sprite body anywhere in the game.
- No duplicate risk (no other body exists to collide with).
- SAVE/LOAD: safe (`value_is`/`value_set`).

## Nurse / Infermiera (hospital)

- Narrative-only, `when: null` (adapter:159): `x11,y8`, unconditional, same as Ronette. Present W1–W11 continuously, no window-based variation, no classic counterpart.
- SAVE/LOAD: n/a.

## Piantone / Piantone Ronette (hospital guard, `andy` sprite reused — scenography per adapter comment)

- Not in the requested roster by name (uses the `andy` sprite, `dialogue: null`), but flagging since the brief asked for all named sprite ids and these are narrative entities with real presence logic: `piantone` (7,3) when `jacques_preso && !jacques_dead` (inside W5, pre-death); `piantone_ronette` (3,6) when `jacques_dead` (from W5's second half onward, **permanently**, since `jacques_dead` never unsets — present through W6–W11 too, i.e. a guard remains outside Ronette's bed for the rest of the game with no narrative acknowledgment after Act 3).
- Because both reuse the Andy sprite while the real Andy classic body sits, unmoved, at `sheriff` the entire game, a player who has met "Agente" at the hospital and Andy at the station in close succession sees the identical sprite in two places at once with two different names — not a duplicate in the id sense (different `npc.id`s, no engine conflict) but a visual/identity collision worth noting since it uses the same sprite key.

## Mfap / Laura / Bob (Red Room, classic-only, `redroom` map)

- Not covered by the W1–W11 story-flag windows in the same way — the Red Room is the dream sequence (M3, inside W1→W2 transition) and the finale sequence (`leland_morto`, beyond W11/`atto5` as covered by mission M9's `atto5` flag; M10/finale content is out of scope for M4–M9 registry as audited here).
- `mfap` (`js/glue.js:79`): unconditional presence in `redroom`, dialogue `leland_morto→finale`. `laura` (`js/glue.js:81`): unconditional, dialogue cascade `leland_morto→finale2 / met_mfap→sogno / else hint`. `bob` (`js/glue.js:87`): `cond:['flag:leland_morto']` — absent until the very end of the story, i.e. absent for the entirety of W1–W11.
- SAVE/LOAD: safe.

## Ben Horne (hotel_gn, classic-only, not in the requested list but present in `CHARS`)

- `js/glue.js:40`: `x5,y7`, unconditional, dialogue static `benhorne_a2`. Present W1–W11 continuously with no acknowledgment of anything that happens in the rest of the story after his one scene — same staleness pattern as Gerard.

---

## CONFIRMED DUPLICATES

- **Truman**: `js/narrative-engine-adapter.js:195-199` (traincar, W4) simultaneous with `js/glue.js:29-36` (sheriff, unconditional).
- **Truman**: `js/narrative-engine-adapter.js:253-257` (roadhouse, W6/W7 — before `presagio_status` even activates) simultaneous with `js/glue.js:29-36` (sheriff).
- **Hawk**: `js/narrative-engine-adapter.js:210-224` (traincar, all three W4/W5 collocations) simultaneous with `js/glue.js:33` (sheriff, unconditional).
- **Hawk**: `js/narrative-engine-adapter.js:307-316` (town, W10) simultaneous with `js/glue.js:33` (sheriff, unconditional).
- **Audrey**: `js/narrative-engine-adapter.js:187-191` (oej, W4/W5) simultaneous with `js/glue.js:41` (hotel_gn, unconditional).
- **Bobby, Donna**: `js/narrative-engine-adapter.js:258-271` (roadhouse) simultaneous with `js/glue.js:12,19` (town) during **W6 and W7 specifically** — the `!flag:gigante2` suppression on the town side only takes effect one story-beat later (W7→W8 boundary) than the `atto4 && !warning_target` gate on the roadhouse side.
- **Norma, Shelly, James, Log Lady**: `js/narrative-engine-adapter.js:267-291` (roadhouse, W6/W7/W8) simultaneous with `js/glue.js:63,65,69,67` (diner) for **all three windows including W8** — these four have no suppression cond at all on their classic diner entries, so the duplicate never resolves itself the way Bobby/Donna's does.

## CONFIRMED STALE

- **Gerard** (`js/glue.js:44`) and **Ben Horne** (`js/glue.js:40`): unconditional, single static dialogue, body and dialogue never change or retire after their one scripted scene — present unchanged through every later window including W9–W11.
- **Piantone_ronette** (`js/narrative-engine-adapter.js:172-176`): once `jacques_dead` fires the guard is posted permanently (no window narrows or removes it), remaining outside Ronette's bed through W6–W11 with no dialogue or narrative acknowledging the long elapsed time.
- **Andy** (`js/glue.js:32`): classic body remains fixed at `sheriff` through W9/W10 even though `offscreen-timeline.md` T4′/T7′ narrates him being dispatched to and staying at the Palmer house during exactly that span — no relocation or hiding implemented.
- **Roadhouse crowd (Norma/Shelly/James/Log Lady/Bobby/Donna/Truman)**: once `warning_target` is set (W9) the sync removes them from `roadhouse` correctly, but they have no narrative-owned return trip anywhere — combined with the diner-four duplicate above, the "stale" side of this is that the diner/town classic bodies were never the ones moving in the first place, so nothing needed to return.

## PERMANENT SUPPRESSION

- **`!flag:gigante2`** (`js/glue.js:12,19,22,47` — bobby, donna, jacoby, sarah): `gigante2` is set once, from `state.nodes_done.m8_roadhouse_truman`, by `js/narrative-production.js:166`, and nothing in the codebase ever unsets it. All four characters vanish permanently at the W7→W8 boundary and never return for the remainder of the audited windows (W8–W11). **Jacoby and Sarah have no narrative-registry replacement body anywhere**, so they simply cease to exist as placed sprites for the rest of the game.
- **`flag:jacques_preso`** (`js/narrative-engine-adapter.js:184` — jacques at oej): never unset; Jacques' OEJ body disappears permanently once arrested (W6 onward) with no replacement body (story-intentional per "must stay HIDDEN," but confirmed as permanent regardless of intent).
- **`flag:leland_morto`** gating `bob` (`js/glue.js:87`): the inverse case — Bob is permanently *absent* until `leland_morto`, i.e. suppressed for the entirety of W1–W11 as covered by this audit.
