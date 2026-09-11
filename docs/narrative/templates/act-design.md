# Act design — `docs/act-<n>-design-report.md`

PURPOSE: the one document that turns an act from "what is live" into "what we will build", with its own implementation plan. Absorbs the beat map, the pacing estimate, the engine-pressure table and the plan (no separate files).
WHEN REQUIRED: every act. A scene-level design uses only §1, §5, §6 and §12.

FIELDS (numbered sections, in this order):
1. Answer in one paragraph: what the act does to the player (experience promise) + freeze banner once frozen.
2. Dramatic engine: value conflict · protagonist want now · threat · why now · the act's END HOOK (a scene, not a HUD line).
3. Production topology audit: per map/actor which layer owns it (classic / mission), gates, flags, objectives as live. Cheap-agent output, cited by file:line.
4. Current beat map (as built): table `# | beat | M/O | owner | state written | reader | defect?`.
5. Critical diagnosis: numbered problems, each naming the mechanism (Bible §10) and the line/node; then "what is good and must be kept".
6. Proposed beat map: table `# | beat | M/O | PURPOSE | PLAYER ACTION | PLAYER QUESTION | NEW INFORMATION | STATE/EVIDENCE | CHARACTER FUNCTION | FORWARD HOOK`; escalation check; count of player deductions, positional beats, optional discoveries.
7. Evidence model summary (KEEP / REWRITE / MERGE / CUT / DEFER / ADD) — full table in the evidence map.
8. Companion / secondary character roles (what they do that is not exposition).
9. Environment brief pointer(s) (spatial relationships that carry meaning; targets; states) **and the act's Cast Continuity windows**: table `WINDOW ID | ENTRY | EXIT / transition | CAST CHANGES | EXPECTED RESULTING PRESENCE` for every window the act opens or closes (named characters only; `docs/cast-continuity-contract-v0.1.md` §4). Each environment brief states BASELINE CAST · TEMPORARY STORY WINDOWS · EXPECTED ABSENCES · INGRESS / EGRESS CAUSE · RETURN / NEXT WORLD STATE (§7).
10. Segmentation (missions / movements) and Giant-class beats (who owns what; no duplicates).
11. Voice contracts (pointer or inline, only speakers with new material).
12. Pacing estimate: mandatory spine in pages and minutes at ~12 chars/s; optional texture.
13. Engine-pressure classification: table `element | class A (data only) / B (existing pattern) / C (cosmetic code) / D (new primitive) | mechanism`. Any D is a blocker to be argued.
14. Implementation plan (frozen): steps A–E with FABLE / CHEAP tags, per-task rows, "out of this plan by decision", the next prompt.

PASS: every mandatory beat in §6 has a state writer with a reader (or INTENTIONAL-UNRESOLVED), a channel, and a character function; every §6 beat that moves a named character has a §9 window and a scene-contract CAST CONTINUITY record, and the windows naming one character are mutually exclusive; no class-D pressure unargued; §5 cites lines; §14 tags every task.
FAIL: a beat map restated in prose elsewhere; a §6 row whose NEW INFORMATION is empty; "the player learns X" with no page that renders X; a plan without model tags.

WHAT NOT TO PUT HERE: dialogue prose (goes in mission JSON after scene contracts), objective truth (docs/story), art prompts (artifact folders), test code.
