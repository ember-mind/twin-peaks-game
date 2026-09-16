# Scene contract — `loglady_ceppo` (M4, optional, Double R)

Template: `docs/narrative/templates/scene-contract.md` (FULL — a second speaker with a
want makes it full). Milestone: Act 2 / M4. Node: `loglady_ceppo`. Owner: M4.
Status: frozen before prose; the wording below is the frozen wording.

CAST CONTINUITY section omitted on purpose: nobody moves in this beat. The Log Lady is
already at her diner baseline (4,5) and stays there. The node's `actor_id` is her registry
id `loglady` (no alias), and the adapter owns her only while M4 is *entered* — M4's
`entry_condition` is scoped to M4's own live window (`sogno_fatto ∧ ¬atto3`), so once Act 3
starts the mission is no longer entered and the interaction falls through to the classic
cascade. `narrative/cast/windows.json` is unchanged: no window is needed (and a same-position
window would not attach `actor_ids` anyway — `CastPresence.syncMaps` only re-materializes a
body when its placement changes position, `js/cast-presence.js:199`). No authored entry/exit
page is owed (Cast Continuity contract §5/§6).

## Ten answers

1. **After.** Nothing engine-trackable changes for anyone else. Cooper has heard the log's
   account of the night Laura died (a turn toward a closed door) and its one demand; the
   Log Lady has delivered the demand and left. The player keeps an interpretation: the log
   is a second non-ordinary channel that refuses to name anything. Only state write:
   `loglady_ceppo_ascoltato` — INTENTIONAL-UNRESOLVED (system §3); its single reader is this
   node's own `repeat_when`.
2. **Wants now.** *Log Lady*: to hand over what the log wants and go; not to be examined
   like a witness, not to translate the log. *Cooper*: a usable account of the night, and
   — having just carried a name back from the dream — someone who will not file it as a
   dream.
3. **Knows / suspects / falsely believes / withholds.** *Log Lady*: knows what the log
   "saw" (she treats it as fact) and will not translate it; withholds the content itself.
   She neither knows nor names BOB, Leland, the traincar, the ring or the formula. *Cooper*:
   knows the diary's two registers, the half heart, the letter R, the dream face and the
   lost name (Act 1 / M3); suspects none of the above is evidence. He does **not** yet know
   BOB (Ronette), the formula (Gerard) or the east road (James) — this beat uses none of them.
4. **Authority / capability.** She has the log and the exit; Cooper has no warrant and no
   leverage over her. She may end the conversation whenever she wants; he can only ask.
5. **What changes the moves.** The Double R at daytime: a table, the log on it, a door that
   opens on the street. She keeps the log with her at all times ("non lo porto in centrale");
   the object cannot be taken from her, only listened to on her terms.
6. **Difference (mechanism, not lexicon).** *Log Lady*: pronouncement about the log, then
   domestic literalness; notices what the log did; never explains; addresses the case, not
   the agent; ends by acting, not by arguing. *Cooper*: separates what he suspects from what
   can be walked on before asking (his Act 2 mechanism: "separo ciò che sospetto da ciò su
   cui possiamo camminare").
7. **Pressure now.** The log has just done it again; she is on her way out. This is the
   only moment she offers it, and she will not repeat herself (the `repeat` page is Cooper,
   not her).
8. **Proof of the turn (an action, not a line).** She states the log's demand and, without
   waiting for an answer, stands, takes the log and walks out. The table is left empty; the
   demand cannot be followed by another question. Deleting this action ends the scene on a
   statement — the log's "stop" is no longer performed.
9. **Unsaid, inferable.** That the log is another channel like the dream — it keeps a name
   Cooper lost and waits for it; that she would not bring it to the station even if asked;
   that the "something" of that night is not a person and will not be named by her.
10. **Channel / limits.** Interactive DIALOGUE, `channel: "world"`, `map_id: "diner"`,
    `actor_id: "loglady"`, `interaction_slot: "primary"`, optional, Act 2 only
    (`conditions: flag sogno_fatto AND NOT flag atto3`; ownership scoped by M4's own
    `entry_condition` = the same gate). 5 pages + 1 repeat page. Cooper
    speaks once. One aphorism maximum (none used). No design ids in text. Frozen pages:

    | # | mode | speaker | text |
    |---|---|---|---|
    | p01 | dialogue | LOG LADY | «Il mio ceppo ha visto qualcosa, quella notte. Si è voltato verso la porta. La porta era chiusa.» |
    | p02 | dialogue | LOG LADY | «A casa mia non ci sono correnti. Da allora si volta ancora: due volte, poi si ferma.» |
    | p03 | dialogue | COOPER | «Margaret, il ceppo lo lascio a lei. Mi dica cosa vuole da me.» |
    | p04 | dialogue | LOG LADY | «Vuole il nome che le è stato detto stanotte. Quello che non ha più.» |
    | p05 | action | — | «(La signora si alza e prende il ceppo. Va verso la porta senza salutare. Il tavolo resta vuoto.)» |
    | repeat | dialogue | COOPER | «Il ceppo aspetta un nome che non ho più. Non c'è altro da chiedere, qui.» |

## Per central speaker

**Log Lady** — `self_image`: the one who listens to the log and is not asked to explain it.
`declared_content`: "the log saw something and now wants something; take it or leave it".
`leak`: she treats a log's behaviour as testimony and a lost dream name as a debt — she is
not a witness in the procedural sense and does not want to be one. `protected_truth`: what
the log actually saw (never translated). `exit_cost`: none; she is free to leave and does.

**Cooper** — `self_image`: the agent who measures and separates object from story.
`declared_content`: "I will not treat the log as evidence; tell me what it wants".
`leak`: he has brought something back from the dream he cannot name, and he is looking for
someone who will not file it as a dream. `protected_truth`: the dream (not told here).
`exit_cost`: he leaves without an answer he can use — the demand is not actionable.
