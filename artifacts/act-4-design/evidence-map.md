# Act 4 — evidence map

Template: `docs/narrative/templates/evidence-map.md`. Act 4 is an investigation only at its end (the shore, the notebook); before it the "evidence" is ordinary (a timetable, a bill, an hour). Atoms and values from `artifacts/act-4-design/m8-extraction.md` §D.

## 1. As built

| atom / value | source (writer node) | mandatory? | visible (a page states it) | independent | combines with | produces | verdict |
|---|---|---|---|---|---|---|---|
| `promise_stance` | `m8_diner` choices | M | yes (feedback page per stance) | yes (a stance) | Leland's taxi timing (accompagno page), the lake monologue, M9 `m9_verifica_taxi` (accompagno echo) | expressive agency + 2 echoes | KEEP |
| `T_LELAND_TAXI` | `m8_leland_taxi` | M | yes (`m8.b0.leland_taxi.p01`, notebook p02) | yes | M9 `D_TAXI` → P6 | the only checkable claim; END HOOK | KEEP (+ read aloud at S8, PROPOSED) |
| `presagio_status` active | `m8_roadhouse` (→ PROPOSED `m8_roadhouse_truman`) | M | yes (`p04` + note `m8.note.presagio`) | yes | `m8_discovery` transition → verified | objectives 100/200; Giant entity window (PROPOSED) | KEEP (writer moves with the split) |
| `warning_target` | `m8_roadhouse` choices (→ `m8_roadhouse_phone`) | M | yes (three feedback pages) | yes | `focus_destination` (valise visibility), M9 `m9_present_truman` | route/station valise line | KEEP |
| `maddy_action_after_warning` | same | M | yes only if palmer (valise page) | no (derived from warning) | epilogue (unbuilt; allowlisted dangling) | — | KEEP as INTENTIONAL-UNRESOLVED (epilogue reader) |
| `sarah_support_state` | same | M | yes (Lucy's page; station pages_by_value) | yes | `m8_station`, M9 | who is with Sarah | KEEP |
| `focus_destination` | `m8_focus_choice` | M | labels; the walk | yes | routes; station valise condition | `body_found_by` | KEEP (target moved to the threshold) |
| `body_found_by` | routes | M | yes (route pages; discovery version) | yes | `letter_o_observation_source` (derivation) | discovery version; M9 line | KEEP |
| `E9A_LETTERA_O` | `m8_discovery` | M | yes (`m8.d.discovery.cooper.p03` / `hawk.p02`, note) | yes | E3 (R) → `m8_cmp_letters`; E1 → `m8_cmp_diary` | P8 | KEEP |
| `E9B_STESSO_METODO` | `m8_discovery` | M | yes (note `m8.note.letter_o`: "stessa posizione e stesso tipo di incisione") | no (an observation about E9A vs E3) | P8 support | corroboration | KEEP |
| `letter_o_observation_source` / `letter_o_chain` | `m8_discovery` (derived) | M | source: yes (who arrived first is on screen); chain: no page | chain: no | M9 custody line | one M9 line | KEEP; `letter_o_chain` stays allowlisted dangling (epilogue) |
| `maddy_trovata` | `m8_discovery` | M | yes | yes | objectives; classic sync; M9 | act turn | KEEP |
| `m8.obs.letters` (observation) | `m8_cmp_letters` | M | yes | yes | `m8_cmp_diary` gate | order R→O | KEEP |
| P8 formulated | `m8_cmp_diary` diary_a | M | yes (feedback a) | yes | `m8_station`; M9 `m9_present_truman` | the reading forward | KEEP (ceiling corroborated; nobody counts letters — R3) |
| `sarah_visione_ascoltata` (classic flag) | classic `sarah_visione` | O | yes (classic pages) | yes | M9 carryover `T_SARAH_VISIONE` (attachable only) | orients P7 | KEEP; page 3 REWRITE (name guard) |
| `gigante2` (classic, derived, one-way) | sync from `nodes_done.m8_roadhouse` → `m8_roadhouse_truman` after the split | M | no page | no | today: dead readers only | — | REWRITE readers: Sarah NPC window, town wanderers (classic conds); never read inside a narrative `when` (it never enters narrative state) |
| P7 | none | — | — | — | M9 reads a dead branch | — | DEFER to M9 pass (premises guaranteed by Act 4: Sarah's vision reachable; "guest of the house" rendered at S1/S2) |
| classic `lettera_o` item + `lago_maddy` | classic (shadowed) | — | never in production | — | — | — | CUT |
| classic `gerard_a4` "casa di legno / vent'anni" | classic (shadowed) | — | never | — | — | — | CUT (NPC vending; duration contradicts facts/bob-guest-since-childhood) |

## 2. Player vs Cooper vs state (critical deductions)

| deduction | player has seen | Cooper may infer | state knows | gap |
|---|---|---|---|---|
| "Di nuovo" refers to a death (again) | gigante1 statement 1 (Act 3), Jacques's death, the Roadhouse line | yes, as grammar (è successo → sta accadendo) | `presagio_status` | none; the referent (Jacques or Laura, or the pattern) stays open by design (truth.md §4) |
| The danger is near the house | the Act 1 house visit (mandatory: diary, R, the heart are found there), the diary's "lui", Leland's "passa da casa alle sette" (every route); Act 1 and Act 4 Sarah both optional; the guest status (S1/S2) | yes, as attention, not as a fact | none (P7 unwritten) | accepted (O1): the label is the lock's text; the house "returns" as attention; Sarah strengthens it where played |
| Everyone is at the Roadhouse except the house | PROPOSED crowd entities + p01 "Il paese c'è tutto" | yes | none | staging needed (environment channel); today the page asserts a crowd the map does not show |
| The ring/R was one piece of a series | E3 (Act 1), E1 rule (M2), E9A, `m8.obs.letters`, feedback a | yes (P8) | P8 formulated | none |
| Leland's taxi is a lie | T_LELAND_TAXI only | NOT yet (M9 verifies) | none until D_TAXI | correct: nobody may say it in Act 4 (guard) |
| Maddy died in the house | nothing (the shore only) | no | never in M8 | correct (truth.md §2, M10) |
| Cooper could have saved her | nothing | the monologue carries perceived guilt only | no flag exists (`maddy_salvabile` never) | correct; no text evaluates the night (M8 §14) |

## 3. Proposed atoms (content-level) — none new

No new evidence atom, value or proposition writer is added by this design. Additions are staging (entities), one node split, two optional texture nodes, target relocation, and two hook pages that read an existing atom (`T_LELAND_TAXI`) aloud. Rationale: the act's investigation already has exactly the atoms its two comparisons need; adding atoms would turn "attention" into "collection" (the Act 3 rhythm this act must not repeat).

## 4. Cross-mission consumption

| later point | reads | effect |
|---|---|---|
| M9 `m9_verifica_taxi` | `T_LELAND_TAXI`, `promise_stance` (accompagno) | verification with Lucy → `D_TAXI` |
| M9 `m9_cmp_taxi` | `T_LELAND_TAXI`, `D_TAXI` | P6 formulated |
| M9 `m9_present_truman` | P8, P7 (dead branch), `warning_target`, `letter_o_observation_source`, `sarah_support_state`, `T_SARAH_VISIONE` (carryover) | accepted → `atto5`; one valise line; one custody line; one Sarah line |
| epilogue (unbuilt) | `maddy_action_after_warning`, `letter_o_chain` | allowlisted dangling (forward references) |
| classic sync | `maddy_trovata`, `gigante2`, `narrative_m8_owned` | classic flags; PROPOSED live readers for `gigante2` |
