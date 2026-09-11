# Freeze report — `docs/<act>-closure-report.md`

PURPOSE: declare an act or slice frozen: what is live, what was verified by playing it, what debt remains, and the claim boundary.
WHEN REQUIRED: every freeze (act closure, vertical slice).

FIELDS: 1. progression / dependency changes since the design (final dependency graph) and the act's frozen Cast Continuity window table (`WINDOW ID | ENTRY | EXIT | CAST CHANGES | EXPECTED PRESENCE`, named characters only — the migration truth the implementation pass pins with V5; `docs/cast-continuity-contract-v0.1.md`) · 2. environment(s) built and parity decisions (concept → native) · 3. narrative changes (page-level list) · 4. engine changes (must be "none" or class C with a reason) · 5. validation: node suites, browser playthrough transcript summary (both/all orders, save/reload points, emitted speaker vs tag, variants only for their state), pacing probe (spine minutes at reading rate) · 6. five-question verdict (model-run: labelled DIAGNOSTIC, not evidence) · 7. known weaknesses / remaining debt (each with the milestone that pays it) · 8. recommended next milestone · 9. how to play the finished act (map, keys, save points) · artifacts list · vault sync line.

PASS: playthrough done in the real UI (not only unit tests) on every order the design allows; vault guard equal; claim boundary stated; every debt row has an owner milestone.
FAIL: freeze on green tests without a played transcript (Act 2 Ronette gate lesson); a "known weakness" with no plan; quality adjectives presented as findings.

WHAT NOT TO PUT HERE: design rationale, human-test results (their own file), art prompts.
