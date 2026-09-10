# Implementation report — `docs/<milestone>-implementation-pass-<n>-report.md`

PURPOSE: record what was built against the frozen design, what the runtime forced, and what the validators proved; the reader must be able to continue without the chat.
WHEN REQUIRED: every implementation pass.

FIELDS: 1. cleanup / topology summary (table task | done as) with corrections to the plan's premises · 2. final runtime topology (node graph, mechanics used, runtime facts that shaped the data) · 3. evidence / state changes (atoms, domains, flags cut, single writers, documented state mappings) · 4. objective ladder (rung | condition | text) · 5. interaction flow as played · 6–8. behaviour of each frozen repair (theory, merit response, gating) · 9. validation table (suite | result), full-sweep delta vs pre-existing failures · 10. genuine blockers and decisions (each: what the runtime lacks, what was done instead, why it is not a new primitive) · 11+. parallel deliverables (art concept, briefs) · closing: artifacts, cache tag, next prompt.

PASS: every design beat maps to a node or a stated omission; every "blocker" names the missing primitive and the chosen data-level substitute; validation lists commands and counts; nothing claimed as done without a test or a capture.
FAIL: "all tests pass" without naming the pre-existing failures; a repair silently simplified; wording changed by a cheap agent.

WHAT NOT TO PUT HERE: design rationale (act design), doctrine argument (audit), story truth.
