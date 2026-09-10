# Act 3 — production topology (as built, 2026-09-09)

Source traces: M5.json (13 runtime nodes), M6.json (12), classic `js/data.js` / `js/glue.js`, adapter `WORLD_TARGETS` / `NARRATIVE_ENTITIES`, `js/narrative-production.js` flag sync. No `M7.json` exists: M6 hands straight to M8 on `atto4`.

## 1. Live path (what a player actually meets)

```
atto3 (Act 2 completion)
  │  town door 55,14/15 → traincar (needsFlag atto3)              [classic map gate]
  ▼
TRAINCAR  ── M5 owns 6 targets (adapter WORLD_TARGETS)
  sign_ponte 5,6    m5_bridge      Hawk joins, tracks east                 mandatory
  entrance   11,6   m5_discovery   sets vagone_scoperto                    mandatory
  mound      10,4   m5_mound       E7A text · E7B position                 mandatory (group ticket)
  ring       13,5   m5_ring        E8A position · E8B dust                 mandatory (group ring)
  center     11,5   m5_scene       E_SCENE                                 mandatory (group scene)
  [notebook] m5_theory_initial     after 2 groups: degeneration | staging  milestone (blocks 3rd group)
  [notebook] m5_theory_revision    after 3 groups: keep | switch | open    milestone (blocks report)
  [notebook] m5_cmp_ring           E8A↔E8B → P3A (ring_a) / 2 retries      OPTIONAL
  [notebook] m5_cmp_ticket_e5      E7A↔E5 (Gerard) → note                  OPTIONAL
  truman     9,4    m5_report_intro  Truman INJECTED here after theory     mandatory
             │      → m5_s1 (custody: institutional | documented)         mandatory, no "right" answer
             │      → m5_report_close  sets east_route_confirmed          (Hawk: path ends at OEJ)
  sign_oej   20,2   m5_sign_oej                                           optional
  hawk_vagone 12,4  CLASSIC NPC, 4 mystic lines, ungated, LIVE            duplicate of Hawk
  │  traincar door 21,0 → oej (NO flag gate)                               [leak, see §3]
  ▼
OEJ  ── M6 owns actors jacques / audrey (no coordinate targets)
  jacques 7,5   m6_ferry → m6_tactic (prova | pressione | falsa_sicurezza, write-once)
                → m6_interrogation_<tactic>  sets jacques_admitted_presence + 1 evidence atom
  [notebook]    m6_p5  "Che cosa puoi sostenere?" present | killed(retry) | no_third_man(retry)
  jacques       m6_arrest  escape attempt on the county dock, leg broken → jacques_preso
  audrey 13,7   m6_audrey  optional, needs classic audrey_indaga, sets audrey_vista_oej (never read)
  │
SHERIFF
  truman        m6_return_night  report, night falls, Lucy's phone rings
  lucy          m6_news          Jacques smothered → jacques_dead, P9 formulated
  │  objective 500: "Torna alla stanza 315"
ROOM 315
  specchio315   gigante1_dlg  CLASSIC, LIVE, required: sets gigante1 (three things + "it will happen again")
  │  objective 600
SHERIFF
  truman        m6_atto4_bridge  sets atto4  → M8 entry ("Passa dal diner, questo pomeriggio.")
HOSPITAL (optional)
  night_register 13,8  m6_hospital  register shows no entry → jacques_death_suspicious
```

## 2. Ownership table

| Beat | Layer | Live? | Note |
|---|---|---|---|
| Town east door | classic map | yes | gate `atto3` only; M5 entry also wants P2 accepted (always true when atto3 is set) |
| M5 nodes (all) | mission | yes | |
| `hawk_vagone` NPC | classic | **yes, duplicate** | different actor id from mission Hawk (who exists only inside pages); "Il treno era il suo tempio" mystic register |
| Truman at the car | mission injected | yes | appears at 9,4 only between theory revision and report close |
| traincar→oej door | classic map | yes, **ungated** | reachable before `east_route_confirmed` |
| `jacques_a3` | classic | **live before M6 entry** | convicts Jacques of murder ("concorso in omicidio") — contradicts M6 invariant |
| `audrey_oej` | classic | live before M6 entry | sets `audrey_salvata`, never read |
| M6 nodes (all) | mission | yes | |
| `lucy_a3` | classic | shadowed once M6 entered | same three Lucy lines as `m6_news` |
| `gigante1_dlg` (mirror 315) | classic | **yes, required by M6** | only source of `gigante1` |
| `truman_atto4` | classic | dead | superseded by `m6_atto4_bridge` |
| `truman_wait4` | classic | live after atto4 | "Audrey è tornata sana e salva" — no mission counterpart, fires regardless of `m6_audrey` |
| `loglady_a4` | classic | live | only wayfinding to the Roadhouse |
| `palco_gigante` (roadhouse 8,1) | classic | live, **duplicate of M8 `m8_roadhouse`** | ungated 2-line Giant; both set `gigante2` |
| Palmer Leland/Maddy classic | classic | dark during M8 (`narrative_m8_owned`) | |

## 3. Contradictions and dead content

1. **Jacques convicted before he is met.** Ungated door + classic `jacques_a3` → a player who walks north from the car before the report arrests Jacques for murder; M6 then re-plays him alive at the table.
2. **Two Hawks.** Mission Hawk (page-only, no sprite) and classic `hawk_vagone` sprite at 12,4 inside the car saying the car was "her temple", contradicting his mission line "Io tengo fuori gli altri. Tu fai il primo passaggio" (he stays out).
3. **Truman teleports.** Injected at 9,4 after a notebook choice; page 1 covers it ("arriva col passo di chi non vuole arrivare"), but nothing summoned him.
4. **Theory choices are unanchored.** `m5_theory_initial` fires after any 2 of 3 groups; both answers get the same feedback; `m5_theory_revision` "Il nuovo fatto cambia la tua lettura?" refers to no specific fact; `m5_theory_revised` flag never read; `m5_final_theory` only changes one Cooper line at the report and nothing in M6.
5. **The only deduction is optional.** `m5_cmp_ring` (the ring cannot have fallen) is the single earned inference of M5 and is not required; P3A is never presented to anyone.
6. **Second Giant duplicated** (M8 territory, flagged for cleanup): `palco_gigante` vs `m8_roadhouse`.
7. **Audrey orphaned**: `audrey_vista_oej`, `audrey_salvata` never read; her resolution is a classic Truman aside.
8. **Silent flags**: `m5_theory_revised`, `jacques_statement_terms_known`, `m6_resource_lost`, `night_log_no_visitor` — written, never surfaced.
9. **Hidden UI rule**: the milestone blocks the third observation until the theory is answered; the refusal is silent (`milestone_pending`), no in-fiction line.
10. **Bridge is a sign.** "Il ponticello di legno: qui hanno trovato Ronette" is a page on a signpost at 5,6; no water, no bridge geometry, nothing to look at.
11. **The stove nobody can see.** M6 falsa branch: the third man "guardava la stufa"; M5's car has no stove object.
12. **Cards nobody can see.** All three M6 branches have Jacques say "giocavamo / il banco era mio" at the car; M5 shows no cards.

## 4. Flags and gates that matter downstream

| Flag / value | Writer | Readers |
|---|---|---|
| `atto3` | M4 presentation | town door, M5 entry, classic hints |
| `vagone_scoperto` | m5_discovery | M5 objectives |
| `m5_initial_theory`, `m5_final_theory` | M5 notebook choices | m5_report_intro pages_by_value only |
| `s1` | m5_s1 | Loggia echo (per LOCK doc; not in any JSON yet) |
| `east_route_confirmed` | m5_report_close | M5 completion, M6 entry, m5_sign_oej, Truman injection removal |
| `m6_tactic` | m6_tactic | interrogation branch, m6_p5 feedback, m6_news Cooper line; M9/M10 echoes per LOCK |
| `jacques_admitted_presence` | interrogation | m6_p5, objectives |
| `jacques_preso` / `jacques_dead` | m6_arrest / m6_news | classic mirrors `jacques_preso`/`jacques_morto`; oej NPC cond `!jacques_morto` |
| `gigante1` | classic mirror 315 | M6 bridge, classic cascade |
| `atto4` | m6_atto4_bridge | M8 entry, roadhouse door, `narrative_m8_owned` |
