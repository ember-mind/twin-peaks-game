# Doctrine audit — `artifacts/<milestone>/doctrine-audit.md`

PURPOSE: certify an act design as structurally valid against the Bible before implementation, and fix it with exactly three repairs plus a mechanical O-list.
WHEN REQUIRED: every act design before its implementation prompt. Optional for a scene fix (run the sections that apply).

FIELDS (sections, in this order):
1. Dramatic engine check (table: element | where | verdict | note).
2. Partial-order / precondition audit: O-list `O# | beat | defect on which routes | fix | runtime risk`.
3. Fact & knowledge results (hard-gate rows F#).
4. Setup–payoff results.
5. Investigation fairness table (clues precede conclusions · premises visible · UI does not anticipate · propositions multi-state · feedback answers the link · suboptimal choices fail forward).
6. Preliminary-theory verdict (KEEP / MODIFY) where a theory beat exists.
7. Scene contracts summary (count, stubs, none STRUCTURALLY NOT READY).
8. Voice audit (speaker-swap result per cluster).
9. Agency audit: `choice | options | reaction | state | echo | visible gain | visible cost | honest?`.
10. Channel-selection audit: `fact | channel | why`.
11. Destructive probes (system §14): one row per probe with evidence.
12. NPC function budget.
13. Player / audience state — HYPOTHESES (explicitly labelled).
14. Exactly three repairs, impact-ordered: PROBLEM · MECHANISM · MINIMAL CHANGE · INTENDED PLAYER EFFECT · NEW RISK; one repair must preserve an ambiguity. "Deliberately not repaired" list.
15. Claim boundary: what is certified (structural) and what remains hypothesis; maximum defect; mechanism worth preserving; new tests.

PASS: every O-row names the routes; every repair is minimal and reuses existing primitives; §13 contains no evidence claims; §15 present.
FAIL: more than three repairs; a repair that adds a runtime primitive without an engine-pressure argument; "moving"/"natural" used as a verdict; a heuristic violation "fixed" without argument.

WHAT NOT TO PUT HERE: new design from scratch, prose, test code.
