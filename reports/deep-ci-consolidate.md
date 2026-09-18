# Deep — CI consolidation: 12 workflow files → 2

Branch: `deep/ci-consolidate`, created from local `main` (`e581124`).

- Step 0 commit `fc25492` — `test/ci-workflow-inventory.js` + `reports/ci-inventory-before.txt`.
- Step 1 commit `d9c922b` — `tests.yml`, `browser.yml`, 12 deletions, runner/test/doc updates, `reports/ci-inventory-after.txt`.

## What now exists

`.github/workflows/` holds exactly two files.

| file | triggers | jobs |
| --- | --- | --- |
| `tests.yml` | `push`→`main`, `pull_request`→`main`, `workflow_dispatch` | `node-tests` (116 steps), `release-baseline` (`workflow_dispatch` only) |
| `browser.yml` | `push`→`main`, `pull_request`→`main`, `workflow_dispatch` | `unseeded-campaign` (2 journeys), `earned-campaign-recovery`, `production-touch`, `playable-build` |

`node-tests` = every `node test/*.js` command from `test.yml` plus the 15 Node-only
extras from the eleven workflows (deduplicated; `node test/gen-world-data.js` +
`git diff --exit-code` kept as its own two steps). `release-baseline` keeps the
`node tools/run-release-tests.js --out=…` reproduction and its 7-day JSON artifact,
but runs only on manual dispatch so routine push/PR runs do not execute the suite
twice. `browser.yml` keeps each Chrome job separate, keeping the campaign's two
clean journeys and all 7-day artifact uploads (`campaign`, `earned-recovery`,
`production-touch`, `playable-foundation`, `playable-source`).

`tools/run-release-tests.js` now reads `.github/workflows/tests.yml`. Its strict
parser was extended with the smallest allowlist needed for the two commands that
are not single-file tests (`git diff …`, its own invocation); everything else still
fails loudly. `test/release-runner.js` was pointed at the new filename and locks the
allowlist.

## Proof — before → after

`reports/ci-inventory-before.txt` (12 files) and `reports/ci-inventory-after.txt`
(2 files), both emitted by `node test/ci-workflow-inventory.js --inventory`:

```
before  204 lines / 134 distinct commands
after   144 lines / 134 distinct commands
missing before commands: 0

after jobs:
  browser.yml unseeded-campaign         7
  browser.yml earned-campaign-recovery  5
  browser.yml production-touch          4
  browser.yml playable-build           11
  tests.yml   node-tests              116
  tests.yml   release-baseline          1

commands after on more than one line (all cross-job shell identity, by design):
  set -euo pipefail x2, echo CHROME_BIN… x3, google-chrome --version x3,
  node --version x3, git rev-parse HEAD x4
```

No test, journey or browser-driver command runs twice; the only repeats are the
per-job Chrome identity lines and the campaign's two intentional journeys.

## Gate

`test/ci-workflow-inventory.js` is the standing gate (default mode): it exits
non-zero if any workflow besides the two exists **or** any command in
`reports/ci-inventory-before.txt` is missing from the live workflows. `--inventory`
re-emits the snapshot.

```
$ node test/ci-workflow-inventory.js
workflows: browser.yml, tests.yml
commands: before 134 distinct, after 134 distinct
CI workflow consolidation gate PASS
```

## Gates run locally

```
smoke                 415 controlli superati ✔            (exit 0)
walkthrough           OK: cammino completo simulato, 85 acquisizioni, finale raggiunto ✔   (exit 0)
release-runner        parser, failure, timeout, evidence, missing-file and path-isolation contracts passed
ci-workflow-inventory CI workflow consolidation gate PASS  (exit 0)
```

Hosted CI was not run (cannot). Trigger it by pushing `deep/ci-consolidate` and
opening a pull request **whose base is `main`** — the `pull_request` event fires
both workflows. A push to the feature branch alone triggers nothing (only `push` to
`main` does); `workflow_dispatch` on the branch also works, and is the only trigger
that runs `release-baseline`. Never pushed; branch is local.
