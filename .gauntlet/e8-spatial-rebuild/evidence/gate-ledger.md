# Selected-build regression ledger

Selected runtime at `8fe054b` (Round 3 light retained). Commands run from
worktree root after Round 4 was reverted. This is a concise record of live
terminal results, not a substitute for the tests themselves.

| Command | Result |
|---|---|
| `node test/hotel-gn-scene.js` | PASS: geometry, registry lifecycle, actor routes, hooks, 60-second ambient |
| `node test/smoke.js` | 415/415 |
| `node test/walkthrough.js` | 85 acquisitions, finale reached |
| `node test/retro-production.js` | 54/54 |
| `node test/mobile-production.js` | 20/20 |
| `node test/cast-continuity-validate.js` | PASS |
| `node test/world-door-equality.js` | 59/59, only approved E8 lobby move |
| `node test/room-315-location.js` | PASS |
| `node test/narrative-finale.js` | 27/27 |
| `node test/act-4-flow.js` | 1611/1611 |
| `node test/ambient-life.js` | PASS |
| `node test/migrated-door-traversal.js` | 45 checks |
| `node test/interior-zoning-reachability.js` | 42/42 |

| `node test/act-3-playthrough.js` | 189/189 assertions; one console error reported by harness |
| `node test/act-4-playthrough.js --path=all` | 530/530 assertions; one test-server `favicon.ico` 404, no failed path assertions |

All runtime gates passed. Gauntlet release still fails visual light floor.
