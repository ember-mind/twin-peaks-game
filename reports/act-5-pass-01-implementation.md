# Act 5 pass 01 — implementation report (M9 refresh + M10 «L'interrogatorio»)

Template: `docs/narrative/templates/implementation-report.md`. Branch `qwen/night-act-5-pass-01` from main `485feab` (later than the brief's `d0c95dc`; `git log d0c95dc..485feab` = the E3 cohesion merge + its CANONICAL-SYNC log, no narrative files). Worktree `.worktrees/act5`. No push.

Single source: CONFESSION LOCK v1.1.1 (`M9-M10 v1.1 (confession lock).md`, byte-identical to the vault copy at start). Every M10 page is a lock §5 line, checked verbatim against the file by `test/narrative-validate-m10.js`.

## Phase status

| phase | status | commit |
|---|---|---|
| 1 — M9 refresh | DONE | `9c3f549` |
| 2 — M10.json, catalogs, schema deltas, cast windows | DONE | `9d25b58` |
| 3 — runtime wiring | DONE | `03a748f` |
| 4 — proof | DONE | `99158be`, `84bfd81`, `ca32f3d` |

## 1. Cleanup / topology summary

| task | done as |
|---|---|
| M9 validator on glue NPCs | `test/narrative-validate-m9.js` resolves Lucy/Truman/Leland with `GAME.CastPresence.resolveCharacterPresence` on fixture seed `ACT4_STATION_BEFORE_DAWN` (M9 entry, evaluated with the real `NR.evalCond`) and on the accepted-presentation state (Leland via `ACT5_LELAND_STATION`). 9 → 0 failures (3972 checks). |
| M9.json vs §3 | 10 drifting pages found; 2 fixed in JSON, 8 kept and listed (§10 "M9 drift"). |
| **Premise correction** | M10 was **not** unimplemented: `js/narrative-finale.js` already ran M10 as a hand-coded state machine with **paraphrased** text (e.g. «Laura... mi perdona?» in the cell, a burst pipe death), armed at `m9_arrivo`. Wiring M10.json on top would have put two owners on Leland@sheriff (hard gate). Phase 3 therefore retires the retro M10 stages instead of adding a second path. |
| Evidence atoms §1 into evidence.json | Already present since M8/M9 (`T_LELAND_TAXI`, `D_TAXI`; C_TAXI = `m9_cmp_taxi`). `diff-evidence-M10.json` records "no additions". |

## 2. Final runtime topology

```
M9 (unchanged graph) ── m9_arrivo ──► M10 entry {atto5, node_done m9_arrivo}
  m10_soglia        (choice, ROOT on leland)  B1  → m10_method
  m10_apertura      (exposed:false)           B2  consent → tape → neutral opening
  m10_domande       (exposed:false, pages_by_value m10_method)  B3-B4
  m10_affioramento  (exposed:false)           B5  → dream_face_recognized_in_leland_scene
  m10_confessione   (exposed:false, pages_by_value)  B6 → 6 × material_admissions.*, P6 confirmed_as_lie, P8 corroborated
  m10_s3            (choice, exposed:false, gated on 6 value_set)  B7 → s3, truman_testimony_state
  m10_post_s3       (exposed:false)           B7b (identical on both branches)
  m10_vittime       (exposed:false)           B8
  m10_fermo         (exposed:false)           B9  → Leland to the cell (Cast window)
  m10_morte         (ROOT on truman)          B10 → leland_morto
                                   └─► narrative-production arms NarrativeFinale.startAtLodge (await_lodge)
```

Runtime facts that shaped the data: one `pages_by_value` per node; `next` continuation resumes the first unresolved link from the root; `exposed:false` keeps chain nodes out of `worldRoots`; `choice-prompt-dedup` forbids a prompt that repeats the last three pages (prompts are the lock headers «Il metodo.» / «Il nastro.»); after `m10_fermo` Leland has no body, so every Leland node carries `not node_done m10_fermo` and B10 is a root on Truman (caught by cast V5b as a softlock before any browser run).

## 3. Evidence / state changes

- `state-enums.json` values_allowed: `m10_method`, `s3`, `truman_testimony_state`, `material_admissions.{taxi_lie, traincar_presence, laura_homicide, maddy_homicide, maddy_body_transport, letters}` → domain `speaker_register` (already in the package). Per-fact records: `recorded` = value_set, `speaker_register` = value. No boolean. Diff: `narrative/schema-deltas/diff-state-enums-M10.json`.
- Single writers: `m10_method` (m10_soglia), six admissions + P6/P8 factual (m10_confessione), `s3`/`truman_testimony_state` (m10_s3), `dream_face_recognized_in_leland_scene` (m10_affioramento), mission `leland_morto` (m10_morte).
- Lint allowlist: `JACQUES_MIDNIGHT_CLAIM/LIST_GIVEN/THIRD_MAN_DETAIL` removed (M10 reads them); `dream_face_recognized_in_leland_scene`, `truman_testimony_state` added as INTENTIONAL-UNRESOLVED with owner "Loggia pass".
- Cast (`narrative/cast/windows.json`): `ACT5_LELAND_STATION` (owner M10) now `atto5 ∧ ¬m10_fermo ∧ ¬leland_morto`, `exit_authored_by m10.b9.fermo.p03`; new `ACT5_LELAND_CELL` (OFFSCREEN cell); new `ACT5_TRUMAN_OUT_INTUITIVE` (OFFSCREEN corridor, entry `m10.b3.intuitivo.p09`, exit `m10.b6.intuitivo.p07`). Fixtures: +4 seeds/pins (`ACT5_THRESHOLD`, `ACT5_TRUMAN_OUT_INTUITIVE`, `ACT5_LELAND_CELL`, `ACT5_LELAND_DEAD`, verified against the return columns of the audit table §5), +C16–C20 transitions; audit md updated with rows and change record.

## 4. Objective ladder (M10)

| rung | condition | text |
|---|---|---|
| obj_m10_1 (100) | `node_done m9_arrivo ∧ ¬leland_morto` | Leland Palmer è alla centrale. Decidete come parlargli. |
| obj_m10_2 (200) | `leland_morto` | Torna alla Loggia (Glastonbury Grove). |

After leland_morto the adapter is disabled and the finale owns the HUD («Nella Loggia: scegli chi affrontare per primo.»).

## 5. Interaction flow as played (real build, `artifacts/act-5-implementation/transcripts/P1–P6.md`)

Station, saved Act 4 completion → Lucy (D_TAXI) → notebook comparison (P6) → Truman: presentation + attachment menus (P1 plays P8, incomplete P6, repeated P6, then complete) → Leland arrival (M9-B3) → A on Leland: threshold pages, method widget → one uninterrupted session through consent, tape, questions, surfacing, confession → tape widget → B7b, victims, custody, death → HUD Loggia. Interruptions: P2 Escape at B5 + reload → A on Leland resumes B5; P5 Escape at B5 in the intuitive method → Truman's body is absent from the station until B6; P6 Escape at B10 after the custody + reload → Leland's body is gone, A on Truman resumes B10. P4 reload after the death restores the finale paused on the Loggia; M10 is not replayed.

## 6–8. Lock rules as built

- Method before tape; tape opening neutral; hypothesis only on the personal recorder (page metadata `recorded_on`).
- Six admissions on screen before S3 on every method, Leland first person; S3 gated per fact; S3-off preserves them.
- Three operations differ on the text (validator asserts distinct wording families); Truman leaves/re-enters only on the intuitive method, physically (Cast Presence).
- BOB: two signal kinds only (`bob_surface: portrait_shown | register_shift`), VOCE pages carry the dream portrait; BOB never named on screen; absolution blacklist; Laura's photo kept before Cooper.
- Death human then composed (Truman opens, counts, calls; composition after).

## 9. Validation

Pre-existing at branch start: `narrative-validate-m9` 9 failures (fixed in phase 1); `interaction-voice` 6 failures («richiamo motivato a Diane» on classic dialogues truman_atto3, leland_morte, leland_interr, bob_finale, laura_finale2, laura_sogno) — unchanged, not in CI, not touched. All other suites below were green at start.

| suite | result |
|---|---|
| `node test/smoke.js` | 415 ✔ (unchanged) |
| `node test/walkthrough.js` | 85 acquisitions, finale reached (unchanged, no drop) |
| `node test/act-3-flow.js` | 280/280 |
| `node test/act-4-flow.js` | 1611/1611 |
| `node test/act-4-playthrough.js` (Chrome) | 530/530 on the final branch. The run rewrites `artifacts/act-4-implementation/*` and two `artifacts/cast-presence-v0.1/*` reports; the committed copies date from 2026-09-12 (before the Cast Presence integration), so the regenerated diff (cast snapshots, NPC order, ports) is not from this pass and was not committed |
| `node test/cast-continuity-validate.js` | V1–V8 + terminal lint PASS (728 seed checks, 33 V5b) |
| `node test/cast-presence-sync.js` | 264/264 (was 232: +4 pins) |
| `node test/world-door-equality.js` / `scene-objects-equality.js` | PASS / PASS |
| `node test/narrative-lint.js` | PASS (7 checks, 1 warning: pre-existing KNOWN-OPEN P7) |
| `node test/story-truth-lint.js` | PASS (1043) |
| `node test/narrative-validate-m9.js` | 3972 ✔ |
| `node test/narrative-validate-m10.js` (new) | 1773 ✔ |
| `node test/act-5-flow.js` (new) | 486 paths, 90675/90675 |
| `node test/act-5-mirror-gate.js` (new) | 41/41 |
| `node test/act-5-playthrough.js` (new, Chrome) | 6 paths, 203/203 |
| `node test/run-browser-harness.js . m10-engine-harness.html` (new) | 167/167 (6 paths + abort/resume) |
| `… m10-screentruth-harness.html` (new) | 60/60 (431 rendered records) |
| `… m10-physical-harness.html` (new) | 30/30 (single lease, zero gameplay frames, no leftover locks, double input commits once; 7 consecutive clean runs) |
| full CI list (`.github/workflows/test.yml`) + narrative suites | 51/51 green after phase 4a |

CI: added M9 validator, M10 validator, act-5-flow, act-5-mirror-gate, narrative-lint.

## 10. Genuine blockers, decisions, script gaps

**Runtime extensions (argued, generic):**
1. `{proposition, factual_status}` effect — the lock requires P6 confirmed_as_lie / P8 corroborated; the retro finale mutated props by hand. Validated in prepare (domain, formulated, only from unconfirmed). Class B.
2. **Defect found and fixed**: presenting P8 (or P7) to Truman in M9 returned `attachment_partition_no_match` because the manual attachment mode assumed `by_support` on every branch → no Truman line, silent refusal in production. A branch without `by_support` now keeps its own verdict. Found by `act-5-flow`, confirmed in the real UI by P1.
3. `NarrativeFinale.startAtLodge` + `RETIRED_M10_STAGES`; `FP.arm` refuses before leland_morto; restore refuses a checkpoint inside the retro M10 (fail loud → save recovery UI). **Consequence:** a pre-existing player save taken after M9 under the old build lands in the save-recovery screen (envelope mission M9 vs state now in M10, or a finale checkpoint inside a retired stage). Accepted because no human test has been run; lead to confirm.

**Scene:** no new art, map, door or object. The interrogation room and the cell are rendered by lock pages on the existing `sheriff` map (Leland at 8,5; cell = OFFSCREEN). Direzione Artistica rules honoured by omission: the only "performative object" is the recorder in text; the BOB portrait is the one infraction of the portrait system; no second signal. Not built: radiator/percolator sound design, sprite bob acceleration (Direzione §2A/§8) — out of scope for a data pass.

**Script gaps (not written, listed for the lead):**
- SG-1 Objective during the interrogation: the lock has none; `obj_m10_1` reuses M9-B2's text until leland_morto.
- SG-2 Lock B10 repeat «(La stanza nord è chiusa. La sedia di Leland non è stata rimessa a posto.)» is not wired: after leland_morto the finale owns all interactions; no target exists without a new object.
- SG-3 B5 «(piano, a Truman) Accendeva e spegneva…» is addressed to Truman, who is out of the room on the intuitive method. Page excluded on that branch (intuitive + pressione loses the echo). Needs wording or a ruling.
- SG-4 Personale second answer: «[se biglietto] L'ho visto. / [fallback] Conoscevo l'orario. Ho pensato: anche lei. Da quella casa vogliono andarsene tutte.» — read literally (the last two sentences belong to the fallback only). The retro finale gave them to both.
- SG-5 Intuitive laura_homicide is «E Laura?» → «Io.» and probatorio's is «Laura Palmer?» → «Io. Al vagone.»: §7 asks for an explicit homicide, never pronoun-led. Maddy's is explicit on all methods.
- SG-6 B6 probatorio «Perché ce l'ho messa io.» follows the *biglietto* (masculine): «messo»? Shipped verbatim.
- SG-7 Five vs six admissions: §6 and §5 have six; §7 test and the closing statement say «cinque». Built with six.
- SG-8 «(seconda domanda)» and «(nessuna risposta: la ricorrenza resta un appunto)» are plain parentheticals in §5 and ship on screen; they read as structure notes. Italic design notes (`*(ponte killer-only…)*`, `*(mai diagnosi)*`) were stripped.
- SG-9 Lock §4/§5 page budget 108; built 113 pages (every direction line is its own page; composites `m10.b3.personale.visto/orario` join the shared direction with the variant).
- SG-10 `interaction-voice` (not in CI, already red) would need M10 in its mission list and Cooper-voiced repeats the lock does not provide.

**M9 drift (§3 vs M9.json):**
Fixed: `m9.b2.present.eco_o.cooper` (removed the invented «Non me l'ha descritta nessuno.»); `m9.b2.p6.accept.sarah.none` (Truman's stage direction as written, not a caption).
Kept, listed: `m9.b1.cmp_taxi.p01` (lock line names evidence ids; lint forbids ids on screen); `m9.notebook.cmp_taxi.recorded` (UI recall, not script); `m9.b2.present.eco_o.cooper/hawk` prefix «La O di Maddy:» (§6 quotes a fragment); `m9.b2.p6.accept.valigia.truman` (§1 mandates the echo, gives no words); `m9.b2.none_formulated.p01` (unreachable: node requires P6 formulated); `m9.repeat.present`, `m9.repeat.arrivo`, `m9.b3.arrivo.p07` (Cooper-voiced repeats/entry lines required by `interaction-voice`; lock repeat for B3 is a caption). Notebook note texts (`m9.note.taxi`, `m9.note.convocazione`) paraphrase the lock's evidence annotations.

**Stale probes:** `test/production-finale-probe.html`, `production-finale-reload-probe.html`, `production-persistence-fault-probe.html` (not in any runner) still expect the finale armed after M9 at `m10_threshold`; superseded by `act-5-playthrough` and `act-5-mirror-gate`. `test/narrative-finale.js` still unit-tests the retired retro stages (27/27) — retire together with the Loggia pass.

## 11. Parallel deliverables

- Ledgers: `artifacts/act-5-implementation/fact-knowledge-ledger.md`, `setup-payoff-ledger.md`.
- Harnesses `test/m10-engine-harness.html`, `test/m10-physical-harness.html`, `test/m10-screentruth-harness.html` (M8 pattern) + runner `test/run-browser-harness.js` (the M8 harnesses had none). They found no product defect. One harness flake fixed: Cooper's turn-in-place needs up to 3 real presses after Escape, as in `m8-physical`.

## Closing

Artifacts: `narrative/missions/M10.json`, `narrative/schema-deltas/M10*.md` + three diffs, `artifacts/act-5-implementation/` (transcripts P1–P6, screenshots, ledgers). Cache tags: runtime `v=3act5`, data `v=21act5`, finale `gold54p6act5`, finale-production `15act5`, production `23act5`.

Next prompt (recommended order): (1) lead reads SG-3/SG-5/SG-6/SG-7 and rules on wording; (2) human test of Acts 4–5 (`docs/narrative/templates/human-test.md`); (3) Loggia/epilogue pass: migrate `js/narrative-finale.js` Loggia to mission data, give `dream_face_recognized_in_leland_scene` and `truman_testimony_state` their readers, retire the retro M10 code and `test/narrative-finale.js`.
