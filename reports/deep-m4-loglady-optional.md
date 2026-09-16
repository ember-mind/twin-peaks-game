# Deep — M4 optional Log Lady beat (calibration)

Branch: `deep/m4-loglady-optional`. Status: implemented, all listed gates green.
Claim boundary: **structural validity only** — no human test was run (Bible §15 / system §15).
Implementation commit: `4a8aa54115df2c5878b05a4f0a247f4b651ed3b3` (this report is the child commit).

## Deliverable

One optional M4 node, `loglady_ceppo` (Cooper ↔ Log Lady at the Double R), her primary
interaction only while **M4 is live** (Act 2), handing back to the classic `loglady`
dialogue outside it.

- `channel: "world"`, `map_id: "diner"`, `actor_id: "loglady"`, `interaction_slot: "primary"`, `optional: true`.
- 5 pages + 1 repeat page; Cooper speaks once; one action page proves the turn.
- Sets exactly one flag, `loglady_ceppo_ascoltato` — **INTENTIONAL-UNRESOLVED** (system §3):
  its only reader is the node's own `repeat_when`; it gates nothing else, by design.
- Scene contract (frozen before prose, wording matches the JSON):
  `narrative/contracts/m4-loglady-optional.md`.

## The gate flags, and the M4 lines that justify them

`flag:atto2` does not exist; the exact flags M4 uses are:

- `sogno_fatto` — M4's entry flag (the dream, classic `laura_sogno`).
- `atto3` — M4's own completion flag (`"completion": { "sets": ["atto3"] }`).

So "true only during M4, false once Act 3 starts" is `sogno_fatto ∧ ¬atto3`. The node carries
it in `conditions` (M4.json:311–), and **M4's `entry_condition` carries the same gate**
(M4.json:9–20). No flag was invented.

## Wiring decision (with the proof line)

**windows.json is unchanged. No Cast Presence window is needed.** The node addresses the
registry body by its own id (`actor_id: "loglady"`), and `js/narrative-engine-adapter.js:441`
is what makes her *primary*:

```
if (!m.nodes.some(function (n) { return n.channel === 'world' && n.map_id === mapId && n.actor_id === actorId; })) continue;
```

The adapter's owner scan iterates **entered missions** (`enteredMissions()`, line 120–124),
so scoping the mission's own live window scopes the target ownership. Once `atto3` is set,
`evalCond(state, M4.entry_condition)` is false, M4 is no longer entered, no mission has a
world node on `loglady`, `tryInteractAs` returns `false`, and the engine runs the classic
cascade (`js/engine.js:747–748`).

### Why this is the right place for the gate (a blocker found by walking it)

Node-level `conditions` alone are **not** enough, and a scoped `actor_ids` window is **not**
available for a character who does not move:

- `conditions` gate only `worldRoots`; they do not gate the owner scan at line 441. With
  `actor_id: "loglady"` and M4 unconditionally entered, `tryInteractAs` still matches M4
  after Act 3, `worldRoots` is empty, and the adapter **consumes** the interaction:
  `showNoRootsFeedback` / `completed_mission_repeat` (adapter lines 447–457). Classic never
  returns. Proven in Chrome: with the unscoped entry, Act 3 logged
  `page_id = adapter.no_roots.actor` ("Non c'è altro da chiedere qui, per ora.") instead of
  `loglady`.
- The scoped-`actor_ids` window (the Hawk pattern, `narrative/cast/windows.json` windows
  `ACT3_HAWK_*`) does not work at a fixed position: `CastPresence.syncMaps` re-materializes a
  registry body only when its placement **changes x/y** (`js/cast-presence.js:199`), and the
  Log Lady's diner baseline (4,5) is pinned (`cast-continuity-validate` V5: `ACT2_DAY2` expects
  `loglady diner@4,5`). A same-position Act 2 window never attaches `actor_ids`; the node then
  never fires at all (proven in Chrome: Act 2 ran the classic `loglady`, `asc` stayed false).

Scoping M4's `entry_condition` is therefore the minimal in-fence change that makes "M4 live"
and "Act 2" the same span. It is also more correct: an entered mission that is already
complete is not a live owner.

## Gates — output verbatim

```
narrative-lint: PASS (7 checks, 1 warnings)
WARN  [read-before-write] KNOWN-OPEN: proposition_path "P7.formulation.status" is read but never
written by any mission effect ... [owner: M9 pass]        <- the 1 known-open, pre-existing
story-lint: PASS (1043 checks, 0 warnings)
story-truth-lint: PASS
smoke:                415 controlli superati ✔
walkthrough:          OK: cammino completo simulato, 85 acquisizioni, finale raggiunto ✔
act-2-flow:           ACT-2-FLOW-PASS 48/48
act-2-ronette-required: 40 controlli superati ✔ / ACT-2-RONETTE-REQUIRED-PASS 40/40
cast-continuity-validate: V1 exactly-one PASS · V2 zero-overlaps PASS · V3 no-implicit-absence PASS ·
  V4 order-independence PASS · RC8 order independence (Act 3 chain) PASS · V5 world-window-pins PASS ·
  V5b scene-required-presence PASS · V6 causal-transitions PASS · V6b no-silent-vanish-entry PASS ·
  V7 single-body-owner PASS · V8 save-determinism PASS · terminal lint PASS
act-3-playthrough:    189/189 assertions passed   (console errors: 1 — harness favicon 404)
```

Extra, not in the required list but run to prove no regression:

```
act-4-playthrough:    530/530 assertions passed   (classic loglady_a4 at the diner still runs)
narrative-validate-m5/m6/m8/m9/m10: all green
dialogue-craft-regression: PASS (167 checks; 12 scene, 6 ponti)
cast-presence-sync: 264/264
```

### Two checks that fail, and why I did not touch them (outside the fence)

1. `test/narrative-validate.js` — `✗ M4.nodes[2]: boolean non ammesso loglady_ceppo_ascoltato`.
   The catalog `narrative/state-enums.json → booleans_allowed` must list the new flag. One
   line, **outside the task fence**.
2. `test/interaction-voice.js` — three snapshot counts each +1 (`world roots 54→55`,
   `entry/reopen 77→78`, `repeat 24→25`). Same cause: the new node. **Outside the fence.**

Neither is in the required gate list; both are one-line updates I stopped short of applying
per "anything else: stop and say why". They should be applied in the same change as the flag
registration, before any freeze.

## Chrome walkthrough (act-2 harness, real keys)

Harness + driver (inside the fence): `artifacts/m4-loglady/loglady-harness.html`,
`artifacts/m4-loglady/run-walk.js`. M4-only adapter (the act-2 harness opt-in), `sogno_fatto`
as the only seed, player spawned at diner (4,6) facing the Log Lady (4,5); interactions go
through the real engine key path and the adapter.

Transcript (`artifacts/m4-loglady/walkthrough.json`):

| shot | page id | dialogue id | state |
|---|---|---|---|
| page-01.png | `m4.attesa.loglady_ceppo.p01` | — | Act 2 |
| page-02.png | `m4.attesa.loglady_ceppo.p02` | — | Act 2 |
| page-03.png | `m4.attesa.loglady_ceppo.p03` | — | Act 2 |
| page-04.png | `m4.attesa.loglady_ceppo.p04` | — | Act 2 |
| page-05.png | `m4.attesa.loglady_ceppo.p05` | — | Act 2 |
| — (confirm) | commit | — | `loglady_ceppo_ascoltato = true` |
| page-06-repeat.png | `m4.repeat.loglady_ceppo` | — | Act 2, second interaction |
| act3-classic-01.png | — | `loglady` | Act 3, classic voice back |
| act3-classic-02.png | — | `loglady` | Act 3, classic voice back |

PNG list: `page-01.png`, `page-02.png`, `page-03.png`, `page-04.png`, `page-05.png`,
`page-06-repeat.png`, `act3-classic-01.png`, `act3-classic-02.png`.
The Act 3 flip is a state change on both layers in the harness (`atto3`), which is exactly the
production handback condition; the real, all-missions Act 3 proof is `act-3-playthrough`
189/189 on `index.html`.

## Bible: what I followed and what I broke

I followed the aphorism budget (Cooper gets no closing formula, one page at most and here
none), enter-late/leave-early (the scene opens on the log's behaviour and ends on the action,
no greetings, no recap), and the voice contract's mechanism for the Log Lady — pronouncement
about the log, then domestic literalness, never explanation, addressed to the case rather than
the agent (`docs/narrative-vertical-slice-01-report.md:69`), with Cooper separating object from
story (Bible §6). I kept the knowledge gate: the beat names no BOB, no Leland, no traincar, no
ring, no formula, and no fact Cooper has not acquired by Act 2 — the only thing beyond the
night is the dream's lost name, which Cooper already carries from Act 1/M3. The one thing I
broke is the heuristic that a scene's state write changes something later: this one writes a
flag no one else reads. I did it deliberately under the quiet-scene carve-out (§3), named the
effect before drafting, and tagged the write INTENTIONAL-UNRESOLVED rather than inventing a
reader to satisfy the linter. What is intentionally left open: what the log actually saw, and
whether the demand is real — the scene must not certify it.
