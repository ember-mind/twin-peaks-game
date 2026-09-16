# Playable Build 01 — acceptance and reproduction

## What the candidate must prove

A fresh New Game reaches the final epilogue and displayed ending through normal
controls, with production persistence enabled. The browser route must not inject
story state, grant evidence, teleport, or call interaction/commit APIs. Read-only
state and geometry queries are allowed for technical assertions and navigation;
they do not demonstrate that a human can discover the route.

There are three separate results. Never collapse them into one green badge:

| Evidence | Meaning |
| --- | --- |
| Release Node suite | Existing structural/runtime contracts pass. |
| Unseeded browser campaign | One declared route works through the real production page. |
| Uncoached human sessions | Actual players can understand and complete the experience. |

Keep the fast, seeded act/branch tests. They are not substitutes for the unseeded
journey. A driver that stops at `await_lodge` has not completed the ending.

## Reproduce the Node baseline

Use a clean disposable checkout/worktree, Node 24, and a unique output directory:

```sh
node tools/run-release-tests.js --list
node tools/run-release-tests.js --out=/tmp/tp-release-UNIQUE
```

The runner consumes exactly the single-file Node commands in
`.github/workflows/test.yml`; it refuses unsupported command syntax and duplicate
entries rather than silently skipping a gate. The report records commit, dirty
state, Node version, individual exit codes, timeouts and logs. It continues after
a failed test to expose the complete baseline and exits nonzero if any fail.
Browser execution and human testing always remain `NOT_RUN` in this report.

Some historical scripts need reference images, local Vault parity, CLI arguments
or browser pages. Do not run every `test/*.js` as though it were a Node release
suite. Some existing tests rewrite evidence; use an isolated checkout and review
those diffs instead of restoring files over another person's work.

## Browser candidate

The browser-foundation and campaign PRs supply their own commands/workflows.
Run the same candidate twice in fresh profiles. Record the source SHA and branch,
browser version, explicit choices, checkpoints, input transcript, screenshots,
errors, and recovery results for each run. Preserve failure evidence even when
the next run succeeds. Do not label an opening-only milestone a campaign pass.

Recovery coverage must use progress earned by normal play. Check committed state
against the last durable save, not against an unfinished page or wandering NPC's
current pixel position. Required checks: reload at act boundaries; cancel/resume
an incomplete interaction; repeat completed interactions; reload after M10 and
before the Lodge; focus loss; representative real touch input. Fault-injection
storage tests belong in separate isolated sessions and must be labelled as such.

## Small human playtest

Start with three people unfamiliar with development, including one unfamiliar
with the story. Use the same frozen candidate SHA. Give only the premise and
controls, not the route. Do not coach. If intervention is necessary, record the
exact intervention and classify that section as assisted, not uncoached success.

Use `docs/narrative/templates/human-test.md` for the five fixed questions and raw
answers. Record anonymous tester IDs, prior familiarity, date, device/browser,
where they paused, which objective they saw, and where a break/reload occurred.
Do not replace human answers with an AI prediction or paraphrase. Keep analysis
and suggested repairs separate from raw observations.

Useful outcomes are whether the player can begin, identify the next action,
explain what an important clue establishes, and resume after a break. This is a
small formative study, not a statistical claim about all players.

## Candidate decision

Record these fields, with links to actual evidence:

```text
Candidate commit:
Release Node suite: PASS / FAIL / NOT_RUN
Unseeded campaign: PASS / FAIL / BLOCKED / NOT_RUN
Recovery coverage: PASS / FAIL / PARTIAL / NOT_RUN
Human playtest: PASS / FAIL / NOT_RUN
Authoring decisions: CLOSED / OPEN (enumerate)
Release candidate approved: YES / NO
```

A known script ambiguity is a decision, not permission for the test author to
invent a line. Close or explicitly accept the M10 script gaps; decide whether
older post-M9 saves are migrated or deliberately unsupported. Never erase an
incompatible save silently to turn a failed Continue into a passing New Game.

## Git, Vault and deployment

PR order follows declared dependencies: merge a prerequisite first, then retarget
its dependent PR and rerun CI. Do not automatically merge or deploy. The repository
still documents a canonical Vault mirror; remote CI cannot verify or synchronize
that local directory. Reconcile reviewed commits intentionally after acceptance,
without overwriting concurrent dirty files. Verify current hosting/webhook setup
before any release; older documents disagree about automatic deployment.
