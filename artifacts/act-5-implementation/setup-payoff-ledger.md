# Setup–Payoff Ledger — Act 5 (M9 → M10), pass 01

Template: `docs/narrative/templates/setup-payoff-ledger.md`. Filled from built data; ablation results are structural (what state/page disappears), not quality verdicts.

| # | SETUP (page id, quoted) | PAYOFF (page id or "none") | STATUS | WHAT THE PLAYER MUST HAVE EXPERIENCED | ABLATION RESULT | note |
|---|---|---|---|---|---|---|
| S1 | `m8.b0.leland_taxi` «Ho chiamato la Twin Peaks Taxi: passa da casa alle sette.» | `m9.b1.verifica.p03` → `m9.b2.p6.accept.*` → `m10.b3.probatorio.p03` / `m10.b6.*` «Mai chiamato» | PAID | M8 diner beat (mandatory, `m8_leland_taxi`) | delete setup → M9 entry false (entry_condition needs T_LELAND_TAXI): the act cannot start | the lie pays twice with added content (verification, then first-person admission) |
| S2 | `m10.b1.soglia.p02` hypothesis on the personal recorder «chi ha disposto quella scena voleva essere letto» | none in M10 | INTENTIONAL-UNRESOLVED → Loggia | soglia (mandatory) | delete → the tape opening stays neutral either way; the hypothesis has no reader in M10 by design (Lock §4: never on the record) | pays in the Loggia pass |
| S3 | M10-B1 method choice | `m10.b3.<method>.*`, `m10.b6.<method>.*`; Loggia `nf.lodge.method.*` (finale) | PAID | soglia widget | neutralise (always probatorio) → B3-B4/B6 texts identical across playthroughs; Loggia method lines lose their reader | tactical choice: write-once, per-branch operation, per-branch cost (Truman's exit only intuitive) |
| S4 | `m10.b7.s3.p02` «Vuole che continui?» | `m10.b7.s3.on/off.*`; B7b metadata `recorded_if`; finale `nf.lodge.s3.*`, `nf.epilogue.s3.*` | PAID | S3 widget (gated on six admissions) | neutralise → B7b identical (by design), Loggia/epilogue lines lose their reader; admissions unaffected | the choice changes the record, never the facts (flow: S3-off preserves all six) |
| S5 | `truman_testimony_state` (written by S3) | none | INTENTIONAL-UNRESOLVED → Loggia/epilogue | S3 | ablation: no page changes today | lint allowlist entry with owner |
| S6 | `m10.b3.intuitivo.p09` Truman leaves «Torno quando ce l'ha.» | `m10.b6.intuitivo.p07` «(Truman rientra. Il blocco è aperto.)» + `m10.b6.intuitivo.p08` | PAID | intuitive method | delete exit → the re-entry page and ACT5_TRUMAN_OUT_INTUITIVE lose their cause (V6b fails) | cost of the intuitive method is written and physical (Cast Presence) |
| S7 | `m10.b7b.segmento.p06` «Mia figlia... Laura. Potrà mai—» | none (unanswered) + `m10.b8.vittime.p01` «Il perdono non è materia nostra.» | INTENTIONAL-UNRESOLVED (never, by design) | B7b (all paths) | answering would contradict Lock §0 (BOB never absolving; photo never face-down) | validator: no absolution blacklist hit, photo kept before Cooper |
| S8 | `m10.b5.affioramento.osservazione` «Non so ancora come nominare il rapporto fra i due.» | Loggia (finale) | INTENTIONAL-UNRESOLVED → Loggia | B5 | ablation: `dream_face_recognized_in_leland_scene` has no reader today | lint allowlist entry with owner |
| S9 | `m10.b10.morte.p13` «Un posto. Non è in nessun fascicolo.» | `obj_m10_2` «Torna alla Loggia (Glastonbury Grove).» → finale `await_lodge` | PAID | B10 | delete → finale still arms on leland_morto; the objective loses its spoken motive | changed affordance: redroom exit door rewired by the finale poll |
| S10 | M8 warning_target / focus_destination (the note) | `m10.b3.personale.biglietto_*` / `.corriera` | PAID (personale only) | M8 routes | neutralise → personale always uses the fallback; other methods unaffected | echo is method-scoped by the lock |
| S11 | M6 tactic atoms (JACQUES_*) | `m10.b3.probatorio.midnight`, `m10.b5.affioramento.list` / `.stove` | PAID for 2 of 3 on every method; midnight only probatorio; list not intuitive (SG-3) | M6 tactic | ablation: echo lines vanish, gates unchanged | JACQUES_* removed from the lint dangling allowlist (they now have readers) |

## Frozen resolution

No UNPAID rows. S2/S5/S8 are owned by the Loggia pass (recommended after the Act 5 human test).
