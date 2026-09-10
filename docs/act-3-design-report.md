# Act 3 — narrative + investigation design report

Date: 2026-09-09. Design only: no code, no narrative files, no art, no engine changes. Inputs: production traces of M5, M6, Giant/Roadhouse paths, environments and the dialogue corpus (scratch traces), the vault's *Bible*, *Grammatica dell'indagine* and *Architettura Causale*, and the M5-M6 v1.1.1 LOCK intent. Artifacts: `artifacts/act-3-design/topology.md`, `evidence-map.md`, `traincar-environment-brief.md`.

**One-paragraph answer.** Act 3 is *the night, reconstructed*: the player reads the primary scene without a witness, forms a theory that Truman can refute in the merit, follows a trace (not a signpost) to the one living witness, chooses how to make him talk, and then loses him under guard. The act's job is to turn "the crime was out there" into "the crime was prepared, local, and someone can still reach a guarded bed" — and to have the supernatural address Cooper only after the material method has both succeeded and failed. M5 and M6 stay in one act as two movements. The traincar becomes interactive by making three things true: every deduction has a visible premise, one observation is positional, and everything Jacques later claims about the car has been *seen* by the player first. No new engine primitive is needed.

**Doctrine audit (2026-09-09, frozen).** Audited against `docs/narrative-craft-bible-v0.1.md` (Portable Briefing). Verdict: *structurally valid with repairs*. Three design repairs are frozen into this report — **R1** preliminary theory at the door, mandatory ring↔dust as the last observation, revision after it (replaces the earlier "interpretation after the comparison"); **R2** Truman contests in the merit and never refutes, the world corrects a kept "impeto"; **R3** S1 custody read back as procedure at the Act 4 bridge, the ring's meaning left open. Eleven mechanical corrections (gating, single writer, hospital walk, Lucy variant) are listed in `artifacts/act-3-design/doctrine-audit.md` §2 and folded into §12/§15 below. Ledgers and scene contracts: `fact-knowledge-ledger.md`, `setup-payoff-ledger.md`, `scene-contracts.md`.

---

## 1. Production topology audit

Full map in `artifacts/act-3-design/topology.md`. What is live after `atto3`:

- **M5 (mission, 13 nodes)** owns six targets on `traincar` (bridge sign, entrance, mound, ring, centre, OEJ sign) plus two notebook theory choices, two comparisons (both optional), Truman's on-site report with the custody choice, and the `east_route_confirmed` writer.
- **Classic `hawk_vagone`** NPC inside the car, ungated, live: "Il treno era il suo tempio". A second Hawk with a different register.
- **Door traincar→oej is not gated.** Classic `jacques_a3` (six pages, ends with an arrest "per concorso in omicidio") is reachable before M5's report and before M6 owns Jacques. Once M6 is active the classic Jacques and Audrey scenes are dead.
- **M6 (mission, 12 nodes)** owns Jacques and Audrey on `oej`, Truman and Lucy on `sheriff`, the hospital register. Tactic write-once; P5 played; arrest; night report; Lucy's call; then the objective sends the player to Room 315.
- **`gigante1_dlg` is classic** (mirror interact, Room 315) and is the *only* writer of `gigante1`, which M6's Act-4 bridge requires. Live and required.
- **`truman_wait4`** (classic) is the only line resolving Audrey ("tornata a casa sana e salva"), and fires whether or not the player met her.
- **No M7.** M6 hands to M8 on `atto4`. The Bible's "M7 — gli enigmi del Gigante" is the three-things speech inside `gigante1_dlg`.
- **Second Giant** exists twice on the Roadhouse map (classic stage tile, M8 phone); M8 territory, flagged in §10.
- Hidden UI: the milestone silently refuses the third observation until the first theory is answered (`milestone_pending`, no line).
- Written, never told: `m5_theory_revised`, `jacques_statement_terms_known`, `m6_resource_lost`, `night_log_no_visitor`, `audrey_vista_oej`, `audrey_salvata`.

## 2. Current Act 3 beat map (as built)

| # | Beat | Where | Layer | M/O | Purpose | Player question | New info | State | Character | Next gate | Hook |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | East door | town 55,14 | classic | M | leave town | — | — | — | — | `atto3` | "La strada a est" |
| 2 | Bridge sign | traincar 5,6 | M5 | M | name the place | is this Ronette's road? | Hawk: old tracks go east, none return | note | Hawk joins | none | tracks |
| 3 | Car entrance | 11,6 | M5 | M | reveal the car | what is this? | seat torn, sheet bent, earth by the door | `vagone_scoperto` | Hawk stays out | 2 | "prima terra, lamiera e distanze" |
| 4–6 | Mound / ring / centre (any order) | 10,4 · 13,5 · 11,5 | M5 | M | collect | what do I see? | ticket text+position; ring centre+dust; edges vs centre | E7A E7B E8A E8B E_SCENE | Cooper narrates | 3 | — |
| 7 | First theory | notebook | M5 | M (milestone after 2 groups) | interpret | degeneration or staging? | none | `m5_initial_theory` | — | blocks 3rd group | "prima del rapporto, l'ultimo riscontro" |
| 8 | Revision | notebook | M5 | M (after 3) | re-interpret | does "the new fact" change it? | none named | `m5_final_theory` | — | blocks report | — |
| 9 | Ring comparison | notebook | M5 | **O** | deduce | can the ring have fallen? | no: placed | P3A | — | — | never presented |
| 10 | Ticket↔verse | notebook | M5 | O | echo Gerard | same words? | recurrence, not identity | note | — | — | — |
| 11 | Truman on site | 9,4 (injected) | M5 | M | report | — | Truman hears one theory line | — | Truman arrives | 8 | ring custody |
| 12 | Custody S1 | dialogue | M5 | M | stance | safe or pocket? | Truman objects to pocket | `s1` | Truman | — | (Loggia, not yet written) |
| 13 | Report close | dialogue | M5 | M | send north | — | Hawk: path ends at OEJ; Truman: Renault holds the bank | `east_route_confirmed` | Hawk, Truman | — | OEJ |
| 14 | OEJ sign | 20,2 | M5 | O | flavour | — | arrow north | — | — | 13 | — |
| 15 | Hawk in the car | 12,4 | classic | O | mystic colour | — | "tempio", "fuoco" | — | Hawk (other voice) | none | — |
| 16 | Ferry / table | oej | M6 | M | arrive | — | Jacques checks the gangway | — | Hawk waits | `east_route_confirmed` | the empty seat |
| 17 | Audrey | oej 13,7 | M6 | O | cameo | — | she is undercover | `audrey_vista_oej` | Audrey | classic `audrey_indaga` | "dal lato giusto del fiume" (never paid) |
| 18 | Tactic | oej | M6 | M | choose method | proof, pressure or false ease? | — | `m6_tactic` | Jacques | 16 | branch |
| 19 | Interrogation | oej | M6 | M | earn admission | was he there? | presence + one branch-specific fact (midnight freight / four names, the matches man / the third man watching the stove) | `jacques_admitted_presence` + 1 atom | Jacques | 18 | P5 |
| 20 | P5 | notebook | M6 | M | state what you can support | present, killed, or nothing about a third? | only presence holds | P5 | — | 19 | arrest |
| 21 | Arrest | oej→dock | M6 | M | first success | — | escape attempt, broken leg | `jacques_preso` | Hawk | 20 | hospital |
| 22 | Night report | sheriff | M6 | M | breathe | — | night falls; Lucy's phone | — | Truman | 21 | the phone |
| 23 | Lucy's call | sheriff | M6 | M | loss | who passes a guard? | Jacques smothered | `jacques_dead`, P9 | Lucy; Cooper's tactic-specific regret | 22 | Room 315 |
| 24 | Mirror | room_315 | classic | M | the Giant | why me? | three things; "accadrà ancora" | `gigante1` | Giant | objective 500 | — |
| 25 | Bridge to Act 4 | sheriff | M6 | M | file what can be filed | — | Truman: a giant has no drawer; a guard was passed | `atto4` | Truman | 24 | M8 "passa dal diner" |
| 26 | Hospital register | hospital 13,8 | M6 | O | corroborate | who signed in? | nobody | `jacques_death_suspicious` | nurse | 23 | never read |

## 3. Major problems

1. **Exposition instead of investigation in M5.** Every observation page does the seeing *for* the player ("Pieghe pulite sotto terra; un lembo resta fuori"). The player's only choices are two unanchored theory prompts with identical feedback and a revision that refers to "il nuovo fatto" without naming one. The one earned inference (the ring cannot have fallen) is optional and never presented to anyone.
2. **Nothing contradicts the player's model.** The car confirms what Act 2 promised. The Grammatica's designed contradiction (a crime of passion that fails because the ring is *placed*) was lost in the LOCK reduction: "staging" is offered as a menu item before its premises exist.
3. **The scene is not spatial.** The bridge is a sign on grass with no water; "veniva da est" is never something you stand on; the OEJ path is an arrow. `scene_center` exists as a landmark but its page could be read from anywhere.
4. **M6 claims what M5 never showed.** All three Jacques branches place cards and a bank at the car; the false-ease branch has the third man "watching the stove". No cards, no stove. The tactic choice is a blind guess; a player cannot prefer false ease because they have seen the dealer's cut.
5. **M5 and M6 do not talk.** `m5_final_theory` changes one Cooper line and nothing about Jacques; a player who still believes "impeto" meets a Jacques written for "disposizione".
6. **Two Hawks, two Jacqueses.** Classic `hawk_vagone` (mystic) inside the car; classic `jacques_a3` (panicked, convicted of murder) reachable through an ungated door. Both contradict the mission characters.
7. **Truman teleports** to the car after a notebook click. The page covers it; the world does not.
8. **Audrey is a flag with no reader.** One line, one promise ("ci vediamo dal lato giusto del fiume"), resolved by a Truman aside that fires anyway.
9. **The Giant arrives by objective text.** "Torna alla stanza 315" is a fetch; the Bible's cause (trauma + mirror + failure of the material method) is right but the game gives the player no reason to go to the mirror except the HUD.
10. **Silent refusals and silent flags** (§1). The milestone gate should speak in Cooper's voice or not exist.
11. **Second Giant duplicated** (M8), Palmer classic NPCs dark for all of M8: fine, but the stage-tile Giant must go.

What is already good and must be kept: the three-tactic interrogation (real branches, real voice, real cost), P5 as a played claim with retryable overreach, the arrest that is a *success*, Lucy's call with tactic-specific regret, the S1 custody stance with Truman's on-the-record objection, the Bible's causal chain (loss of the witness → the Giant).

## 4. Act 3 dramatic purpose

**What Act 3 is for.** Act 1 built the victim, Act 2 gave the name a body it cannot have (no face in town matches). Act 3 must give the *crime* a shape: not a stranger's outburst but a prepared, local, repeatable act — and prove it is still active by taking the witness away under the county's own guard. It is the act where Cooper's method wins for the first time and is answered by something that does not use methods.

- **ACT 3 WANT (Cooper):** reconstruct the night materially, then put one living man in a room with a pen. "Prima terra, lamiera e distanze." He wants the scene to speak before anyone does.
- **CORE QUESTION (player):** what happened in that car, and who was the third? (Bible: "cosa accadde quella notte?")
- **ESCALATION:** the place is not passing-through but chosen (rails end there); the scene was arranged to be *read*; the road continues to a house outside the law; the one man who was there is killed inside the hospital where Ronette lies, past a guard; then the mirror.
- **HUMAN REVELATION:** Laura came here more than once and not by force (the stove, the cards, the worn planks): the hidden life had an address. Jacques is a coward who dealt cards to a girl he did not save, not a killer. Cooper, for the first time, keeps or surrenders an object he cannot yet read (S1).
- **MYSTERY REVELATION:** the ring was placed at the exact centre: someone wanted the scene found and read; "fire" is a procedure, not a metaphor (ticket, stove, the matches man); the threat can pass a guard, so it is local and active (P9).
- **END HOOK:** "È successo di nuovo. E accadrà ancora." The Giant's three things arrive *because* the method failed the witness; Truman files the guard, not the giant. Player question leaving: why does he warn *me*, and about whom? (Act 4.)

Not this: "search the traincar and unlock One Eyed Jacks."

## 5. Investigation gameplay design (the traincar)

Verbs used, all existing: **examine** (world node on a target), **position** (landmark target whose page only fires from its tile, already how `scene_center` is wired), **compare** (two-item notebook pair), **choose an interpretation** (notebook choice node), **present** (Truman `pages_by_value` + fail-forward objective text, Act 2 pattern), **revisit** (`repeat` / conditions on `node_done`, `pages_by_value`). No new verbs.

**Loop.** ARRIVE at the bridge → OBSERVE the outside with Hawk (two facts he gives, one he refuses to interpret) → ENTER and see the whole interior from the door → CHOOSE the order of five inspections (three mandatory, two optional) → STAND at the centre to get the one observation that cannot be had elsewhere → COMPARE ring↔dust (mandatory now) → INTERPRET (impeto / disposizione / aperta) → PRESENT to Truman, who answers in the merit → DECIDE custody → FOLLOW Hawk to where the tracks go.

**The five principle elements, concretely:**

- **A. FACT** — the ring lies flat at the exact centre of the crossbeam; the dust around it is continuous (E8A, E8B). Objectively there; a page with no adjective.
- **B. CONTRADICTION** — the mound is *inside*, on the tile you step over to enter, and a flap of the ticket is left above the earth. "Buried in a hurry" fails: nobody hides a thing where every foot lands, and nobody in a hurry leaves a corner showing. (E7B rewritten to say exactly this and nothing more.) Second contradiction, spatial: violence at the corners, an untouched centre, no drag marks between. The "impeto" reading the game invites at the door does not survive the centre.
- **C. HUMAN TRACE** — the cold stove with ash raked into a ring and a burnt matchbook edge (E_STUFA); damp cards under the torn seat with the dealer's cut still squared (E_CARTE). People *sat* here, more than one night. Laura had a place; someone dealt; someone watched the fire instead of the game. These two are optional to finish M5 and decisive for M6.
- **D. SPATIAL INFERENCE** — (i) the bridge is on the town side, the car at the end of the rails: Ronette ran *from* here *toward* town; James's "veniva da est" is now ground under the player's feet. (ii) The tracks Hawk read at the bridge continue *north past the car*: the player must walk to the north cut to see it, and Hawk says it only there ("Non te lo dico da qui. Vieni."). The OEJ sign stands beside a trace, not instead of one.
- **E. INTERPRETATION (frozen per doctrine R1/R2)** — *preliminary theory at the door*: after the first look from the doorway the notebook asks "Prima lettura?" with two options only, "Un incontro degenerato." (impeto) or "Non scrivo ancora." (withhold). The **mandatory last observation** is the ring↔dust comparison (after mound and centre); its feedback is an action ("Cooper non lo tocca. Fotografa il bordo della polvere."), never a verdict. Then the **revision** prompt: "La polvere è intatta. Regge ancora?" — keep / rivedo (→ disposizione) / aperta (a withholder gets all three). Truman answers the chosen reading in the merit: under impeto he quotes Cooper's own note and asks the link ("La polvere, Cooper. L'hai scritta tu: intatta fino al bordo. Cosa la tiene al centro?"), files the facts, leaves the reading Cooper's — *contested*, not refuted, no loop; the world corrects it later (Jacques's admission, the pillow, one line at Lucy's call). Under disposizione: accepted-as-yours ("La lettura la verbalizziamo come tua"). Under aperta: both carried.

**Player knowledge vs Cooper vs state** (critical deductions):

| Deduction | Player has seen | Cooper infers | State | Design rule |
|---|---|---|---|---|
| The ring was placed | ring page, dust page | yes | E8A∧E8B → P3A | comparison mandatory before the theory |
| The scene was arranged to be read | ring placed + flap left out + no path centre↔edges | yes | P3A + E7B + E_SCENE | "disposizione" only offered after all three exist |
| Ronette fled toward town | bridge on the town side, county stake, Hawk's line | yes | E_PONTE_DIREZIONE | player stands on the bridge; nothing is told from the car |
| Someone left north past the car | tracks in the north cut, Hawk there | yes | E_TRACCE_EST → `east_route_confirmed` | the OEJ objective fires *after* walking there, not after a dialogue at the door |
| Cards were dealt here (Jacques) | cards under the seat | yes | E_CARTE | optional; changes the tactic page and P5 strong |
| The third man watched the fire | stove | not yet (Jacques says it) | E_STUFA | optional; makes the false-ease branch land |
| Someone can pass a guard | Lucy's lines; register | yes | P9 | keep; give the register one reader |

No deduction in the act depends on a hidden flag alone. The milestone gate is replaced by a Cooper line when refusing early interpretation ("Non ancora. Prima il centro.") or dropped: with the comparison mandatory, the order of the three groups no longer needs policing.

## 6. Evidence model

Full table in `artifacts/act-3-design/evidence-map.md`. Summary of verdicts:

- **KEEP:** E7A, E8A, E8B, E_SCENE (as positional), P3A, `s1`, `east_route_confirmed`, `m6_tactic`, all three JACQUES_* atoms, P5, P9, `gigante1`, `atto4`, the ticket↔verse comparison (optional).
- **REWRITE:** E7B (the flap = meant to be found), the two theory prompts (anchored, fired by the comparison), `m5_report_intro` merit answers (three cases + fail-forward for "impeto").
- **MERGE:** `m5_theory_revision` into the ring comparison commit; `jacques_testimony_lost` + `m6_resource_lost` into one (only `m6_tactic` is read later); `night_log_no_visitor` + `jacques_death_suspicious` into one with one reader.
- **CUT:** `m5_theory_revised`, `jacques_statement_terms_known`, `audrey_salvata`, classic `hawk_vagone`, classic `jacques_a3`/`audrey_oej` (shadow anyway), the silent milestone refusal.
- **DEFER:** S1 Loggia echo (finale pass), verification hooks for JACQUES_MIDNIGHT_CLAIM / LIST (M9 per LOCK).
- **ADD (content-level, four atoms, no new architecture):** E_PONTE_DIREZIONE (bridge), E_TRACCE_EST (north cut), E_STUFA (stove), E_CARTE (cards). All four are plain observations written by terminal world nodes; two feed M6 through `pages_by_value` / one optional pair.

Proven pattern kept: terminal node completion + two-item comparisons + explicit objectives. The one comparison that matters (ring↔dust) becomes required, like Ronette in Act 2.

## 7. Hawk role

**Decision: Hawk stays outside, and moves.** He reads the outside; Cooper reads the inside; the meeting point is the report. Three placements, one sprite, condition-placed (existing injection pattern): the bridge before discovery; the car door after; the north cut after the report. He never enters the car (his own line: "Io tengo fuori gli altri"). The classic mystic Hawk inside the car is removed; his one good idea ("qui il fuoco ha camminato davvero") becomes an object (the stove), not a speech.

What he does that is not exposition:
- **Preserves the scene** ("Da qui in poi le impronte sono mie e tue").
- **Notices what Cooper does not**: the planks are worn on the town side (people came *back*); the old tracks go past the car, not to it.
- **Refuses to interpret**: asked what the mound means, "La terra la leggo. Perché l'hanno messa lì lo leggi tu."
- **Establishes what is undisturbed**: the county's stake on the bank, the dust on the beam ("Nessuno ci è entrato dopo la pioggia. La polvere è d'accordo con me").
- **Contrast with the landscape**: he is at ease where Cooper measures; his one line about the place is about the trees, not the girl.

He reappears at the ferry (existing line) and pushes/loses Jacques on the dock (existing). He does not accompany Cooper into the car, into OEJ, or to the mirror.

## 8. Footbridge / traincar environment brief

Full brief in `artifacts/act-3-design/traincar-environment-brief.md`. Essentials: replace the 24×14 map with a **24×12 native outdoor scene**, one screen tall, three zones west→east (bridge over a creek on the town side · clearing with the car at the end of the rails · north cut where old tracks enter the trees beside the OEJ sign). Interior of the car drawn roof-cut so door, mound, corners, beam and stove are visible from the centre tile. Nine targets (six mandatory interactions). Hawk in three states. Late afternoon, overcast, single authored state; the report is the last daylight of the act. After the report, one overlay: tape on the door, a stake at the bridge.

Existing exterior rules suffice (camera south of player, north canopy face, exterior hook pattern, contact bands). Four additions proposed to the World Visual Bible, all art direction: one weather state per outdoor investigative scene; ground in three values with tracks the only straight lines; roof-cut interiors outdoors keep the 48 px north face; scene-state overlays painted on a flag, never a second map.

Audrey (§9) and the Giant (§10) need no new environment: OEJ and Room 315 exist. OEJ's interior can stay legacy for this milestone; it becomes a native candidate only after the traincar.

## 9. M5 / M6 segmentation recommendation

**Keep M5 and M6 in one act, as two movements of one night.** Reasons: M5 produces the theory and the trace; M6 tests the theory on the only witness and answers M5's open question (who prepared it? someone local enough to reach a guarded bed). The Bible's act boundary (`atto3` → `atto4`, "una notte alle Giacche") is right. What is wrong is not the grouping but the missing thread between the two, and the order of arrival.

Concretely:
- **What sends Cooper to OEJ:** not Hawk's dialogue line but the tracks in the north cut (walked) plus Truman's "Renault tiene il banco laggiù" (kept). The oej door is gated on `east_route_confirmed`; before that, the door tile answers in Cooper's voice ("Prima il rapporto. Poi il fiume.").
- **Is Jacques earned?** Yes once E_CARTE exists: "il banco era mio" lands on something seen. Without cards, Jacques is a name Truman supplies.
- **Audrey:** keep her cameo, make it pay once. She sees Cooper *choose a tactic* (her seat faces the table). Her promise "dal lato giusto del fiume" is paid by one line at the night report: Truman (variant on `audrey_vista_oej`) "La ragazza del guardaroba è tornata a casa con la barca delle otto. L'ho accompagnata io" — and nothing more. Her Great Northern arc stays Act 2's. The classic `truman_wait4` is retired in favour of that variant.
- **Does the casino compete with the car?** Only if it arrives before the report. Gated, it deepens it: the table is the car's mirror (a dealer, a bank, a third man who does not play).
- **Too much too fast?** The current M6 chain runs arrest → night report → Lucy's call in one sitting with no player action between; the loss lands before the win is felt. Insert one *walk*: after the arrest the objective sends Cooper to the hospital to see Jacques guarded (the `night_register` target already exists; nurse: "Piantonato. Firma domattina"); the night report and Lucy's call fire *after* that visit. The player has seen the guard the killer will pass.
- **Not two unrelated quests once:** the theory is heard at the table (`pages_by_value` on `m5_final_theory` in Cooper's Lucy-call reply), the cards are heard in P5, the stove is heard in the false-ease branch.

## 10. Giant / Roadhouse analysis

| Beat | Layer | Reveals | Reached | Verdict |
|---|---|---|---|---|
| `gigante1_dlg` — mirror, Room 315 | classic | three things; "accadrà ancora"; the object "quando sarà vero" | yes, required by M6 | **KEEP as owner**, but give the player a *reason* to be in 315 besides the HUD: M6's night report ends with Truman sending Cooper home; the objective reads "Stanza 315. Domattina l'ospedale." — the mirror is on the way to bed, not a destination. Add nothing to the Giant's text. |
| `truman_atto4` | classic | Giant + Jacques to Truman | dead | CUT |
| `m6_atto4_bridge` | M6 | Truman files the guard, not the giant | yes | KEEP (+ one variant if the register was read) |
| `truman_wait4` | classic | Audrey safe | live, unconditional | **MOVE** its Audrey line into the M6 night report as a conditional variant; CUT the node |
| `palco_gigante` / `gigante2_dlg` — Roadhouse stage tile | classic | "Sta accadendo di nuovo", vanish, "Casa Palmer. SUBITO." | live, ungated, twice | **CUT** (M8's phone owns the second appearance with consequence) |
| `m8_roadhouse` — phone | M8 | second appearance + 3-way warning | yes, gated | KEEP (M8's) |
| `loglady_a4` | classic | "stanotte, al roadhouse" | live | KEEP (only wayfinding) |

Both Giant appearances are necessary: the first is the act's end hook, the second is Act 4's turn. The duplication is only the classic stage tile. No design change to the Giant's words.

## 11. Character voice contracts (Act 3 speakers with new or rewritten material)

- **HAWK** — Rhythm: two sentences, then the ground. Notices: wear, direction, age of a mark, what the rain did. Avoids: motives, adjectives about the dead, the word "why". To Cooper now: partner on the same line of prints, not a guide; uses "tu". Pattern: **he answers a question about meaning with a fact about distance** ("Perché l'hanno messa lì?" — "A tre passi dalla porta. Il resto lo leggi tu.").
- **COOPER (at the scene)** — Rhythm: measurement first, verb second; one Diane line per movement at most. Notices: positions, intervals, what is missing between two marks. Avoids: naming the theory before Truman. Pattern: **separates the object from its story in the same sentence** ("Prima di chiedere di chi fosse, annotiamo come stava qui" — keep).
- **TRUMAN (on site and at night)** — Rhythm: plain, complete, stops early. Notices: people and procedure (the guard, the form, the hour). Avoids: the dream and the giant as evidence; mocking either. To Cooper now: partner who signs what he disagrees with. Pattern: **answers a theory with a fact that has a place** ("L'impeto non posa un anello al centro.").
- **JACQUES (mission voice only; the classic panic is retired)** — Rhythm: one long sentence that changes the subject, one short one that bargains. Notices: the table, hands, who is standing. Avoids: names (gives one only under pressure, and hides it in a list), the word "Laura". To Cooper: another player at his table. Pattern: **turns every question into a game he is dealing** ("Le facce, chiedetele alle carte."). The only crack: the third man ("guardava la stufa come si guarda una persona").
- **AUDREY (OEJ cameo)** — Rhythm: one line, low, without turning. Notices: who is watching her, exits, timing. Avoids: fear said aloud (Act 2 rule keeps: no "I'm bored", no "I'm scared" on the page). To Cooper: an equal running her own operation; last word hers. Pattern: **speaks in a cover identity and lets Cooper decode it**.
- **LUCY (the call)** — as written: three sentences, the third a question the case has to answer. Keep.
- **GIANT** — as written; nothing added. Fragments, no connectives, never answers. The only new rule: **he is never referred to by the HUD**; objectives say "Stanza 315", not "the Giant".
- **NURSE (guard visit)** — Act 2 contract holds: procedure first, feeling withheld; "Piantonato. Firma domattina." Do not give her the register scene's conclusion; Cooper draws it.

## 12. Proposed final beat map

M = mandatory, O = optional. Movement A = the scene (M5), Movement B = the man at the table (M6). Existing pages are reused wherever they already say the right thing.

| # | Beat | M/O | PURPOSE | PLAYER ACTION | PLAYER QUESTION | NEW INFORMATION | STATE / EVIDENCE | CHARACTER FUNCTION | FORWARD HOOK |
|---|---|---|---|---|---|---|---|---|---|
| A1 | East road | M | leave the town's grid | walk the east door | where does James's road go? | the houses end; rails begin | — | — | the bridge |
| A2 | The bridge | M | make Ronette's road physical | stand on the planks, examine the rail | which way did she run? | county stake on the town bank; planks worn toward town; Hawk: old prints go east, none return | E_PONTE_DIREZIONE; note | Hawk joins, preserves, reads outside | rails east |
| A3 | The car | M | reveal the primary scene; **preliminary theory** | reach the door; notebook "Prima lettura?" → impeto / non scrivo ancora | what is this place? | rails end under the car; door south; the whole interior visible: mound inside the door, torn corners, beam at the centre, a stove | `vagone_scoperto`, `m5_initial_theory` | Hawk stays out ("Tu fai il primo passaggio") | order is the player's |
| A4 | Mound | M | fact + contradiction | examine | why bury it where you step? | ticket "FUOCO CAMMINA CON ME"; folded clean, one flap left out | E7A, E7B | Cooper records position and text separately | notebook |
| A5 | Ring | M | fact | examine | fell, or placed? | flat, exact centre; dust continuous, no roll path | E8A, E8B | Cooper: "annotiamo come stava qui" | the comparison |
| A6 | Centre | M | positional observation | stand on the centre tile, examine | what is between the edges and here? | nothing: no drag marks; from here door→mound→beam are one line | E_SCENE | Cooper: "Io fotografo il vuoto" | theory |
| A7 | Stove | O | human trace, fire motif | examine | who watched this? | cold; ash raked in a ring; a burnt matchbook | E_STUFA | Cooper: "Qualcuno l'ha guardato spegnersi" | M6 false-ease lands |
| A8 | Cards | O | human trace, Jacques's referent | examine | who sat here, how often? | damp deck under the seat; dealer's cut still squared; more than one night's wax on the floor | E_CARTE | Cooper: "Qui qualcuno teneva il banco" | M6 tactic page; P5 strong |
| A9 | Ring ↔ dust | **M** (the mandatory last observation) | the earned deduction | notebook pair | can the ring have fallen? | no: placed (P3A); feedback is an action page; retries "nessuno entra da anni" / "è di Laura" answered in the merit | P3A | — | revision |
| A10 | Revision | M | put the preliminary theory under pressure | notebook choice; conditions `node_done mound ∧ scene ∧ cmp_ring` | "La polvere è intatta. Regge ancora?" keep / rivedo / aperta | each option restates its premise | `m5_final_theory` (`m5_theory_revised` cut) | — | Truman |
| A11 | Ticket ↔ verse | O | Gerard's echo | notebook pair | same words? | recurrence, not identity | note | — | Act 4 (fire) |
| A12 | Truman on site | M | present | talk (he has walked in along the rails, Hawk at the door); gated on `node_done m5_cmp_ring` | does my reading hold? | Truman answers in the merit: impeto → asks the link with memory, files the facts, reading contested; disposizione → accepted-as-yours; aperta → both carried | P3A presented (+ accepted-as-yours \| contested) | Truman: facts ours, reading yours | custody |
| A13 | Custody S1 | M | stance | choose safe / documented pocket | what do I owe the object? | Truman objects on the record | `s1` | Truman signs what he disputes | Loggia (deferred) |
| A14 | The north cut | M | the trace, not the sign | walk to Hawk at the tracks (rung 350: "Hawk è ai binari, oltre il vagone.") | where did they go? | only the car-specific fact: the old prints pass the car and enter the cut; the OEJ sign beside them | E_TRACCE_EST, `east_route_confirmed` (**sole writer**, moved from the report close) | Hawk: "Dal cartello in poi il sentiero non serve altre proprietà" (moved here) | OEJ; oej door opens |
| B1 | Ferry, table | M | cross the line | enter OEJ | who holds the bank? | Jacques checks the gangway before the deck | — | Hawk waits at the dock | the empty seat |
| B2 | Audrey | O | the other operation | notice her | what is she doing here? | cover identity; she watches the table | `audrey_vista_oej` | Audrey: last word hers | night report variant |
| B3 | Tactic | M | choose the method | choice; page before it recalls the cards if seen | proof, pressure, or ease? | — | `m6_tactic` (write-once) | Jacques deals | branch |
| B4 | Interrogation | M | earn the admission | dialogue (two exclusive questions) | was he there, and who else? | presence + branch fact (midnight freight / the matches man in a list / the third man and the stove) | `jacques_admitted_presence` + atom | Jacques bargains, cracks once | P5 |
| B5 | P5 | M | claim only what holds | notebook choice; optional pair cards↔admission | present, killed, or "knows nothing"? | only presence; strong with the cards | P5 | — | arrest |
| B6 | Arrest, dock | M | the method wins | dialogue | — | escape, the leg between the planks | `jacques_preso` | Hawk on the dock | hospital |
| B7 | Hospital, guarded | **M (new node `m6_hospital_guard`; `m6_return_night` requires it)** | see the guard | walk to the ward, examine the register | is he safe here? | Jacques's door guarded; register open; nurse: "Firma domattina" | note only (no register flags) | Nurse: procedure | night |
| B8 | Night report | M | breathe, file | talk to Truman | — | window turns black; Audrey variant if seen; Lucy's phone rings | — | Truman sends Cooper home | the phone |
| B9 | Lucy's call | M | the loss | listen | who passes a guard? | smothered, no witness; Cooper's regret in the register of his tactic (`pages_by_value` on tactic) + one `pages_after_branch` page only if `m5_final_theory = degeneration` ("Avevo scritto impeto, Harry. Un cuscino non è un impeto.") | `jacques_dead`, P9 | Lucy's question | Room 315 |
| B10 | Register (return) | O | corroborate | examine the register again | who signed in? | nobody between midnight and the shift | one flag, one reader | Cooper draws it | Truman variant |
| B11 | Mirror, 315 | M | the address | go to bed; the mirror on the way | why me? | three things; "accadrà ancora" | `gigante1` | Giant | the guard, not the giant |
| B12 | Bridge to Act 4 | M | file what can be filed | talk to Truman | — | "Qualcuno ha superato un piantone" + register variant + **S1 echo by procedure** ("L'anello è in cassaforte. Lo cito." / "L'anello ce l'hai tu. Non lo cito."); the ring's meaning never stated | `atto4` | Truman | M8: "Passa dal diner, questo pomeriggio." |

Escalation check: A2 (a road) → A6 (a scene arranged) → A14 (a trace that continues) → B4 (a man who was there) → B6 (caught) → B9 (taken from under a guard) → B11 (addressed). Player deductions: A3 (preliminary), A9, A10, A12, B3, B5 (six). Positional: A6, A14. Optional discoveries: A7, A8, A11, B2, B10 (five).

## 13. Pacing estimate

Method: tile walking at the measured 213 ms/tile and reading at 12–15 chars/s + 0.6 s/page, as in the Act 2 probe; page counts from the trace plus the proposed additions; no arbitrary target.

| Bucket | Content | Estimate |
|---|---|---|
| Travel | town east door (from the station ≈ 45 tiles) → bridge → car (≈ 20) → north cut (≈ 12) → OEJ → back to town → hospital → station → hotel → station | ≈ 3.5–4 min walking, split in six legs none longer than ~45 s |
| Investigation | 6 mandatory examines (~4 pages each), 2 optional, 1 mandatory pair, 1 interpretation, 1 optional pair | ≈ 4–5 min at 12 cps |
| Dialogue | report + custody (≈ 12 pages), ferry/tactic/interrogation (≈ 14), arrest (7), hospital (4), night (5), call (4), mirror (5), bridge (4) | ≈ 6–7 min at 12 cps |
| Exploration | choosing the order in the car; the walk to the north cut; the ward at night | ≈ 1.5 min |
| Optional | stove, cards, ticket↔verse, Audrey, register, OEJ sign | ≈ 2.5 min |
| **Required path** | | **≈ 15–17 min** (Act 2 required path measured 5.1–5.9 min; Act 3 is the long act by design) |

Assessment: time before first meaningful action ≈ 90 s (A2 on the bridge); longest passive block = the interrogation branch (≈ 14 pages, but two are player questions and one is a choice) then the night report + call (≈ 9 pages back to back; the new hospital walk B7 splits them); longest uninterrupted walk = town station → east door (≈ 45 tiles ≈ 10 s of holding a key, acceptable); mandatory clue interactions = 6; real deductions = 5; optional discoveries = 5.

**Likeliest boredom point:** the return leg after the arrest (OEJ → town → hospital → station) — three map changes with nothing to read. Mitigation already in the map: B7 gives the leg a purpose (see the guard), and the night falls during it (the station window). If it still drags in play, cut the hospital walk to a single page at the station ("Hawk l'ha lasciato piantonato") rather than adding content.

## 14. Engine-pressure classification

| Feature | Class | Note |
|---|---|---|
| Positional observation (page only from the centre tile) | **A** | landmark target + approach tile, as `scene_center` is wired |
| Mandatory ring comparison before the theory | **A** | node conditions on `node_done` (Act 2 closure pattern) |
| Theory fired by the comparison commit | **A** | `next` / milestone `resolved_when` already exist |
| Truman's merit answers + fail-forward rung | **A** | `pages_by_value` + objective partition (Act 2 P2 pattern) |
| Hawk in three placements | **A** | `NARRATIVE_ENTITIES` with `when` (Truman at the car already does this) |
| Four new observation atoms (bridge, tracks, stove, cards) | **B** | evidence catalog + four world nodes + map targets |
| oej door gated on `east_route_confirmed`, in-fiction blocked line | **B** | `needsFlag` + `blockedMsg`, as the east door |
| Suppress classic `hawk_vagone`, `jacques_a3`, `audrey_oej`, `truman_wait4`, `palco_gigante` | **B** | remove NPC/interact records; tests re-pinned |
| M6 pages reading M5 (`E_CARTE` recall page, `m5_final_theory` variant in the call, Audrey variant, register variant) | **A** | `pages_by_value` / conditions |
| Optional cards↔admission pair in M6 | **A** | two-item comparison |
| New hospital walk B7 (register target already exists) | **B** | one world node, objective rung |
| Scene overlay after the report (tape, stake) | **C** | scene module paints on a flag; same hook family as the hospital's drawChar wrap; no engine change |
| Truman arriving along the rails (sprite placed on the rails outside) | **A** | injection coordinates |
| Roof-cut car interior, creek, north cut | **B** (art) | native scene module + map rows, like the ward |
| Freight passing on the live line (ambient) | **D — deferred, not needed** | only candidate for a new primitive; the design does not depend on it |
| "Refuse early interpretation" line instead of silent milestone | **A** | objective text / `repeat` page; or remove the milestone |

No D is required. Everything the investigation needs is A or B; the one C is cosmetic.

## 15. Implementation plan (frozen)

Each task is tagged **FABLE** (narrative/gameplay judgement, voice, final review) or **CHEAP** (safe for a sonnet/haiku subagent with a bounded brief). Order: A and B first; D runs in parallel from the brief; C after B; E last.

### A. Topology cleanup — all CHEAP
| # | Task | Tag |
|---|---|---|
| A1 | Gate `traincar`→`oej` door on `east_route_confirmed`; `blockedMsg` text supplied by Fable (one line) | CHEAP (line: FABLE) |
| A2 | Remove classic `hawk_vagone` NPC + dialogue; remove `jacques_a3` / `audrey_oej` cascades and dialogues; retire `truman_wait4`; remove roadhouse `palco_gigante` interact + `gigante2_dlg` | CHEAP |
| A3 | Re-pin tests: `interior-zoning-reachability`, `level-autopsy*`, `interaction-voice`, `narrative-repair-contract` (gigante2 action-line assertion), `smoke`/`walkthrough` classic simulators (route the Act 3 span through the mission layer or a stub); keep acquisition counts | CHEAP |
| A4 | Confirm the mirror gate (`specchio315` cascade on `jacques_morto`) with a test line | CHEAP |

### B. M5 data / investigation — FABLE for text and node design, CHEAP for mechanics
| # | Task | Tag |
|---|---|---|
| B1 | Rewrite node graph per §12 A1–A14: `m5_theory_initial` → door prompt (impeto / withhold) fired at the end of `m5_discovery`; `m5_cmp_ring` mandatory with action feedback; `m5_theory_revision` conditions `node_done m5_mound ∧ m5_scene ∧ m5_cmp_ring`, options keep/rivedo/aperta (all three if withheld); drop milestone group-blocking; cut `m5_theory_revised` | FABLE (design) → CHEAP (JSON edit) |
| B2 | `m5_report_intro`: add `node_done m5_cmp_ring`; three merit cases (impeto = link with memory; staging = as written; open = as written); P3A marked presented + accepted/contested | FABLE (text) → CHEAP (JSON) |
| B3 | New nodes: `m5_bridge_rail` (E_PONTE_DIREZIONE; stake, worn planks), `m5_tracks_north` (E_TRACCE_EST, sole writer of `east_route_confirmed`, Hawk's line moved here), `m5_stove` (E_STUFA), `m5_cards` (E_CARTE); E7B page rewritten; E_SCENE positional; optional Cooper "more than once" line gated on stove ∧ cards | FABLE (all pages) → CHEAP (JSON, evidence catalog, adapter `WORLD_TARGETS`) |
| B4 | Hawk three placements via `NARRATIVE_ENTITIES.when`; Truman arrival on the rails; pre-report north-cut blocked line | CHEAP (line: FABLE) |
| B5 | Objective ladder as strict partition: 100 / 200 / 250 (comparison) / 275 (revision) / 300 (Truman) / 350 (north cut) / 400; texts by Fable | FABLE (texts) → CHEAP |
| B6 | Notebook entries rewritten as bare facts + question; cut `m5.note.cooper_reading`; one Cooper aphorism per scene | FABLE |
| B7 | Tests: `narrative-validate-m5` re-pin; new `act-3-flow.js` (all 6 observation orders; withhold vs impeto; stove/cards taken/skipped; impeto contested then corrected; single writer of `east_route_confirmed`; A10 unreachable early; no rendered result ids) | CHEAP |

### C. M6 stitch — FABLE for variants, CHEAP for wiring
| # | Task | Tag |
|---|---|---|
| C1 | Recall page before `m6_tactic` on E_CARTE; optional pair E_CARTE↔JACQUES_* in `m6_p5` (P5 strong) | FABLE (two lines) → CHEAP |
| C2 | New node `m6_hospital_guard` (`jacques_preso ∧ ¬jacques_dead`, target `night_register`, note only); `m6_return_night` requires it; rung 350; nurse line + guard sprite placement | FABLE (nurse line) → CHEAP |
| C3 | `m6_return_night` Audrey variant on `audrey_vista_oej`; `m6_news` `pages_after_branch` on `m5_final_theory = degeneration`; `m6_atto4_bridge` variants on `jacques_death_suspicious` and on `s1` | FABLE (four lines) → CHEAP |
| C4 | Merge `jacques_testimony_lost` + `m6_resource_lost`; cut `jacques_statement_terms_known`, `audrey_salvata`; `narrative-validate-m6` anti-shadow re-run (two nodes on `night_register` with exclusive conditions) | CHEAP |

### D. Traincar environment — FABLE for direction and review, CHEAP for pipeline work
| # | Task | Tag |
|---|---|---|
| D1 | Intent + concept prompt from `traincar-environment-brief.md`; Golden Concept selection | FABLE |
| D2 | Native translation brief (tile plan 24×12, definitions, palette roles, value gates, Hawk states, post-report overlay) | FABLE |
| D3 | Map rows, `js/traincar-art.js` / `-scene.js` / `-production.js`, contract test, captures, same-world sheet | CHEAP (opus-class for art rounds, as the hospital) |
| D4 | Parity review at 1×/5×/in-game; Native Golden verdict | FABLE |
| D5 | Environmental inspect coverage for the new map; re-key old coordinates (adapter, tests, harnesses) | CHEAP |

### E. Playthrough / freeze
| # | Task | Tag |
|---|---|---|
| E1 | Browser path A1→B12 twice (impeto kept then corrected; withhold → disposizione), tactics falsa (cards seen) and prova (cards skipped), save/reload at the north cut and after the arrest | CHEAP (driver) + FABLE (reading the transcript against the ledgers: emitted speaker vs tag, variant emitted only for its state) |
| E2 | Pacing probe pointed at M5+M6; full node sweep; vault sync | CHEAP |
| E3 | Act 3 closure report; human-test protocol (five questions, blind attribution on Hawk/Truman cluster, choice–cost–echo recall on S1 and tactic) | FABLE |

Out of this plan by decision: OEJ native art, Roadhouse, World Engine / Character Life / Ambient Life work, the Loggia S1 echo, the freight ambient, Act 4.

The next implementation prompt is **A + B** together ("Act 3 — topology cleanup + M5 investigation data"), with **D1–D2** started in parallel from the environment brief.
