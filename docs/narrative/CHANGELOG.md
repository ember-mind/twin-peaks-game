# Narrative doctrine changelog

Every change to `docs/narrative-craft-bible-v0.1.md` or to a hard gate in `docs/narrative-system-v0.1.md` is recorded here as OLD RULE · NEW RULE · PRODUCTION EVIDENCE · WHY. The Bible's version moves with any rule change; the system's version moves with any gate or pipeline change.

## v0.1 — 2026-09-10
- System extracted from Act 1 (NVS01), Act 2 (production + closure), Act 3 (design, doctrine audit, implementation pass 01). No Bible rule changed. Two runtime facts recorded as authoring constraints (comparison done = proposition state; choice-only node done = its value) — evidence: `docs/act-3-implementation-pass-01-report.md` §2.

## 2026-09-10 — Story Truth Layer v0.1 populated
- `docs/story/` populated from frozen Acts 1–3 material (truth, timeline, 36 facts, 15 characters, 11 relationships, 8 revelations, setup/payoff overview). No narrative content, ledger or runtime changed. Validator: `node test/story-truth-lint.js`. Record of truth changes: `docs/story/CHANGELOG.md`. Report: `docs/story-truth-v0.1-population-report.md`.

## 2026-09-10 — Story Truth v0.1 maintenance
- OLD: truth.md §6 carried two provisional source conflicts (Bible T2 "Missoula" vs the taxi lie; Maddy's pie vs the coach schedule) and a legacy classic ring clue asserted ownership. NEW: both conflicts resolved by the Bible's own prevailing PATCH CHANGELOG (2026-07-23) and recorded in `docs/story/CHANGELOG.md`; superseded Bible body passages listed in truth.md §7; classic ring clue wording retired. EVIDENCE: `docs/story-truth-v0.1-maintenance-report.md`. WHY: no equal-looking authorities may survive into Act 4 design. No Bible rule, no narrative gate, no mission JSON changed.
