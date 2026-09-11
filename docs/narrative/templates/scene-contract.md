# Scene contract — `artifacts/<milestone>/scene-contracts.md`

PURPOSE: freeze what a scene must do before any prose exists, so prose is judged against a contract, not against taste.
WHEN REQUIRED: FULL for every scene with a turn or a choice (a second speaker with a want makes it full). LIGHTWEIGHT for environmental examines, one-exchange witnessing beats, blocked-tile lines.

FULL FIELDS (ten answers, numbered, one or two lines each):
1. After: what is true after the scene that was not before.
2. Wants now: each participant.
3. Knows / suspects / falsely believes / withholds: per participant.
4. Authority / capability: who can do what to whom.
5. What changes the moves: the world or material constraint (object, hour, place, rule).
6. Difference: how each speaks differently (mechanism, not lexicon).
7. Pressure now: why the scene cannot wait.
8. Proof of the turn: an action or a changed affordance, not a line.
9. Unsaid, inferable: what the player can infer that nobody says.
10. Channel / limits: pages max, interruption rules, what is PROPOSED vs reused (page ids).
Per central speaker: `self_image · declared_content · leak · protected_truth · exit_cost`.

CAST CONTINUITY (only when this beat changes where a named character physically is; omit otherwise — `docs/cast-continuity-contract-v0.1.md` §5–§6):
- CAST BEFORE: the characters this beat touches and where they are (window id if inside one).
- CAST MOVES / REMOVALS: `name → scene | OFFSCREEN (label) | TERMINAL_REMOVED`.
- CAST AFTER.
- CAUSE: the event in this beat that moves them.
- RETURN / NEXT STATE: the later story event (flag/value/node) that ends the move — the window's EXIT.
Verdict: READY / READY WITH STUB (name the stub) / STRUCTURALLY NOT READY.

LIGHTWEIGHT FIELDS: what changes · what the player must be able to infer · the one page that carries it · channel · what must not be said yet.

PASS: answer 8 is performable (deleting it changes the scene); answer 3 shows at least one protected truth with two leak channels or a reason for silence; every PROPOSED line is a specification, not final prose; no answer contradicts the fact ledger.
FAIL: a CAST CONTINUITY move without a CAUSE or without a RETURN; a want that is "to explain"; a proof of the turn that is a sentence; a scene whose deletion test leaves the next scene identical; a contract written after the prose to justify it.

WHAT NOT TO PUT HERE: final dialogue, voice mechanics (voice contract), truth (docs/story).
