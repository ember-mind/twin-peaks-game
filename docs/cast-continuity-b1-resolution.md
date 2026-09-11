# Cast Continuity v0.1 — B1 resolution (Double R → Roadhouse transition)

Date: 2026-09-11. Lead decision: **option B**. No new flag, value, evidence or proposition. Player map position is never Cast Continuity state. No silent disappearance. No runtime changed in this pass (§9).

## 1. Causal decision

The end of `m8_leland_taxi` is the authored transition from ACT4 AFTERNOON AT THE DOUBLE R to ACT4 EVENING GATHERING AT THE ROADHOUSE. The scene visibly establishes that the Double R closes early for the evening and that its people are leaving for the Roadhouse. That beat authorizes the cast movement.

Causal sequence, all inside one node and one committed transaction:

1. Maddy leaves (`m8.b0.leland_taxi.p00`, existing).
2. Leland pays and states the taxi at seven (`p01`, branch `p01`/`p02`, existing).
3. The Double R closes early for the Roadhouse evening (**new closing beat**, §2).
4. `evidence T_LELAND_TAXI` commits (existing effect).
5. Norma, Shelly, the Log Lady and James resolve to `ACT4_EVENING_GATHERING` (roadhouse).

Lucy's later line ("Norma chiude alle sei per andarci", `m8.lucy.p01`) already states this as world truth; the beat shows it. No new story fact.

## 2. Approved prose (final)

Page id: **`m8.b0.leland_taxi.chiusura.p01`**
Node: `m8_leland_taxi` (map `diner`, actor `leland`)
Mode: `action` · condition: none (all three `promise_stance` branches)
Position: after the last dialogue page (`m8.b0.leland_taxi.accompagno.p02` when it plays, else the branch `p01`), immediately before the notebook page `m8.b0.leland_taxi.p02`.

> (Norma gira il cartello sulla porta e spegne l'insegna. Sedie sui tavoli, cappotti dagli attaccapanni: il Double R chiude alle sei, stasera si va al Roadhouse.)

Checked against the wording requirements: environmental action, no character list (one name, the owner closing her room), no explanation of Cast Continuity, no foreshadowing, no choice, no clue, no new fact, no comment on Maddy. "Alle sei" repeats Lucy's hour. Reads as an ordinary business closing.

## 3. Affected cast

| character | before | after | unchanged |
|---|---|---|---|
| Norma | `diner` 5,2 (baseline) | `roadhouse` 5,6 | |
| Shelly | `diner` 9,7 (baseline) | `roadhouse` 3,6 | |
| Log Lady | `diner` 4,5 (baseline) | `roadhouse` 2,6 | |
| James | `diner` 9,6 (baseline) | `roadhouse` 2,4 | |
| Truman, Bobby, Donna | — | — | entry `T_LELAND_TAXI` as before: Cooper is not in their origin rooms |
| Maddy, Leland | — | — | exits at `T_LELAND_TAXI` authored by `p00` as before; the closing beat follows their exits |

## 4. State before

`promise_stance ∧ ¬evidence T_LELAND_TAXI` (pin `ACT4_PROMISE_MADE`): Norma, Shelly, Log Lady, James at their diner baselines; Maddy `diner` 10,1; Leland `diner` 11,1; Cooper at the counter.

## 5. State after

`evidence T_LELAND_TAXI ∧ ¬value_set focus_destination` (pins `ACT4_EVENING_GATHERING`, `ACT4_ROADHOUSE_PRE_PHONE`, `ACT4_POST_PHONE_INSIDE`): the four at the Roadhouse placements above; Maddy `OFFSCREEN` (home); Leland `OFFSCREEN` (HIDDEN). The diner is empty of named cast until `focus_destination` returns Norma to baseline (`m8_route_diner`).

Transition table entry (all truth files):

| from | via | to | cast | cause |
|---|---|---|---|---|
| DINER AFTERNOON | `m8_leland_taxi` closing beat | EVENING GATHERING | Norma / Shelly / Log Lady / James: Double R → Roadhouse | the Double R closes for the Roadhouse evening |

## 6. V6b regression condition (RC7, updated)

Window `ACT4_EVENING_GATHERING` carries `entry_authored_by: m8.b0.leland_taxi.chiusura.p01` for norma, shelly, loglady, james.

- Seed `promise_stance ∧ ¬T_LELAND_TAXI` → the four resolve to `diner`.
- Seed `T_LELAND_TAXI ∧ ¬presagio_status` → the four resolve to `roadhouse`.
- V6b: the entry displaces the four from map `diner`; the setting node `m8_leland_taxi` has `map_id = diner`; therefore the window must name an authoring page, that page must exist in `narrative/missions/M8.json` inside `m8_leland_taxi`, and its node must be on `diner`. FAIL if the page id is absent from M8, if `entry_authored_by` is absent from the window, or if the beat is authored in a node on another map.
- Consequence: the validator FAILS on today's world (the page is not yet in M8) and PASSES once the implementation pass adds it. This is the intended order (contract §12: validators must fail on today's world before migration).

V6b in the contract now covers window entries as well as exits (`entry_authored_by` / `exit_authored_by`).

## 7. Files and tables updated

- `docs/cast-continuity-lead-decisions-v0.1.md` — D7 CAUSE; §8b bullet; new §8c.
- `artifacts/world-character-audit/cast-windows-acts-1-4.md` — status line; §1 boundary row for `T_LELAND_TAXI`; §3 `ACT4_EVENING_GATHERING` row; §4 pin `ACT4_EVENING_GATHERING` (four RH placements); §5 C10b; §7 adapter row; §8 B1 → CLOSED.
- `docs/cast-continuity-final-consistency-report.md` — §4 B1 row; §6 transition row; §8 RC7; §10 verdict.
- `docs/cast-continuity-contract-v0.1.md` — V6b extended to entries.
- `artifacts/world-character-audit/validation-plan.md` — RC7 rewritten with the three seeded failures.
- `docs/act-4-design-report.md` — amendment pointer to this spec (frozen wording for M8).
- This file. `CANONICAL-SYNC.md` line.

## 8. Logical re-audit after B1

- No remaining lead blocker. Residuals R1 (Audrey at arrest) and R2 (Giant at the phone) stay accepted.
- No silent vanish: every placement change fired while Cooper is on the character's map names its page — Maddy `p00`, Leland `p00`, the four `chiusura.p01`, the Giant `m8.b.giant.p05`; the Roadhouse crowd and Truman leave at `focus_destination` (Cooper outside); all other Act 3/4 changes fire with Cooper elsewhere.
- V5 truth complete for all Acts 1–4 pins (no `B1` cell remains).
- All transitions mechanically decidable: each is a predicate in the mission `when` grammar over existing state, plus a page id that exists or must exist in a named node.

## 9. Implementation boundary

Runtime untouched: `narrative/missions/M8.json`, adapter, classic data, tests unchanged. The page is specified here and consumed by the Cast Presence implementation pass, which adds it to `m8_leland_taxi` together with its direct text test and the V6b fixture. Not started: resolver, registry, NPC migration, environment production, M9.

## 10. Verdict

**READY FOR CAST PRESENCE IMPLEMENTATION.**
