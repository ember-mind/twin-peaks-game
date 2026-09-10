# Act 3 — evidence map (M5 + M6): as built, verdict, proposed

Legend: **vis** = the player sees a page that states it; **ind** = meaningful on its own; combos = notebook pairs / conditions that consume it.

## 1. As built

| Atom / value | Source (writer) | Mandatory | vis | ind | Combines with | Produces | Verdict |
|---|---|---|---|---|---|---|---|
| `m5.note.bridge` (note) | m5_bridge | yes | yes | yes (route = Ronette's road) | — | nothing | KEEP, becomes a spatial fact (see §3 B1) |
| `vagone_scoperto` (flag) | m5_discovery | yes | yes | — | objectives | rung 200 | KEEP |
| E7A_BIGLIETTO_TESTO "FUOCO CAMMINA CON ME" | m5_mound | yes | yes | yes | E5_POESIA (opt. cmp) | note "ricorrenza, non identità" | KEEP |
| E7B_BIGLIETTO_POSIZIONE (folded ×4, clean inner folds, one flap out) | m5_mound | yes | yes | weak (why does it matter is never said) | P3A strong support only | nothing playable | REWRITE: the flap left visible = *meant to be found* — make it the contradiction atom |
| E8A_ANELLO_POSIZIONE (flat, exact centre) | m5_ring | yes | yes | yes | E8B | P3A via cmp | KEEP |
| E8B_ANELLO_SUPERFICIE (dust intact, no roll path) | m5_ring | yes | yes | yes | E8A | P3A via cmp | KEEP |
| E_SCENE (violence at edges, no passage to centre) | m5_scene | yes | yes | yes | nothing | nothing | REWRITE: make it the *positional* observation (only readable from `scene_center`) and the third leg of the theory |
| `m5_initial_theory` degeneration/staging | m5_theory_initial | yes (milestone) | yes | no (same feedback both ways) | report page only | one Cooper line | REWRITE (see §3 E) |
| `m5_final_theory` keep/switch/open | m5_theory_revision | yes | yes | no ("il nuovo fatto" unnamed) | report page | one Cooper line | MERGE into the ring comparison (the comparison IS the new fact) |
| `m5_theory_revised` (flag) | revision | — | no | no | none | none | CUT |
| P3A "collocazione deliberata" | m5_cmp_ring / ring_a | **no** | yes | yes | — | never presented | KEEP, make **mandatory** before the report; Truman hears it |
| `m5.obs.ticket_e5` | m5_cmp_ticket_e5 | no | yes | yes | — | note | KEEP optional (rewards Gerard) |
| `s1` institutional/documented | m5_s1 | yes | yes | yes | Loggia (not yet in JSON) | Truman's one line | KEEP; DEFER the Loggia echo to the finale pass |
| `east_route_confirmed` | m5_report_close | yes | yes (Hawk's line) | — | M6 entry | OEJ objective | KEEP; also gate the oej door on it |
| `m6_tactic` | m6_tactic | yes | yes | yes | interrogation, p5 feedback, news | branch | KEEP; make it *informed* by M5 (cards, stove) |
| JACQUES_MIDNIGHT_CLAIM | prova | branch | yes | yes ("verificabile ai binari") | nothing | nothing | KEEP; DEFER verification hook (M9 per LOCK) |
| JACQUES_LIST_GIVEN | pressione | branch | yes | yes | nothing | nothing | KEEP; DEFER (M9) |
| JACQUES_THIRD_MAN_DETAIL ("guardava la stufa") | falsa | branch | yes | yes | nothing | nothing | KEEP; give it a referent (the stove in M5) |
| `jacques_admitted_presence` | interrogation | yes | yes | — | m6_p5 | P5 | KEEP |
| P5 "presente, non autore" | m6_p5 | yes | yes | yes | — | arrest | KEEP; add optional support pair with M5 cards (P5 strong) |
| `jacques_statement_terms_known` | prova | — | no | — | none | none | CUT (or DEFER to M9 if it will be read) |
| `audrey_vista_oej`, `audrey_salvata` | m6_audrey / classic | — | — | — | none | none | CUT `audrey_salvata`; `audrey_vista_oej` read by one Truman line (see report §8) |
| `jacques_dead`, `jacques_testimony_lost`, `m6_resource_lost` | m6_news | yes | yes/yes/no | — | P9, classic mirror | atto4 chain | KEEP `jacques_dead`; MERGE `testimony_lost`+`resource_lost` into one (only `m6_tactic` is read later) |
| P9 "qualcuno protegge il segreto" | m6_news | yes | yes | yes | — | — | KEEP |
| `night_log_no_visitor`, `jacques_death_suspicious` | m6_hospital | no | partly | yes | none | none | KEEP as one flag; give it one reader (Truman bridge line variant) |
| `gigante1` | classic mirror 315 | yes | yes | yes | M6 bridge | atto4 | KEEP (classic stays owner; see report §10) |
| `atto4` | m6_atto4_bridge | yes | yes | — | M8 | — | KEEP |

## 2. Player knowledge vs Cooper vs state (critical deductions)

| Deduction | Player has seen | Cooper may infer | State knows | Gap today |
|---|---|---|---|---|
| The ring was placed, not dropped | ring page + dust page | yes | E8A, E8B | comparison optional → a player can finish M5 never having made it |
| The scene was prepared to be read | ring pages, mound pages, edges page | yes | E_SCENE + P3A | the "staging" theory is offered before any of its premises are gathered (after 2 groups of 3) |
| Ronette fled from the car toward town | "qui hanno trovato Ronette" + James "veniva da est" (Act 2) | yes | nothing | the bridge is west of the car on the map but no page or landmark makes the direction a *seen* fact |
| Somebody left east past the car, toward OEJ | Hawk "portano a est, nessuna torna indietro" (page at the bridge) | yes | nothing | player never *walks* the tracks; sign_oej is a signpost, not a trace |
| People played cards in the car (Jacques's later claim) | nothing | no | nothing | Jacques's three admissions have no material referent in M5 |
| The third man "guardava la stufa" | nothing | no | JACQUES_THIRD_MAN_DETAIL | no stove |
| Jacques is present-not-author | his admission (any tactic) | yes | P5 | fine; strengthen with the cards pair |
| Jacques was killed by someone who can pass a guard | Lucy's three lines; optional register | yes | P9 | fine; the optional hospital coda has no reader |
| "It will happen again" concerns the Palmer house | Giant's three things | no (by design) | gigante1 | fine for Act 3; Act 4's job |

## 3. Proposed M5 atoms (content-level; no new evidence architecture)

| Atom | Target (map) | Kind | Page that states it | Supports | Combines |
|---|---|---|---|---|---|
| **B1** `E_PONTE_DIREZIONE` — the bridge is between town and the car; Ronette was found *on the town side* of it | `sign_ponte` → becomes `bridge_rail` landmark on the bridge itself | observation | Hawk: where she was found, which way the planks are worn | P2 confirmation, P3 | with E_TRACCE (opt.) → "due direzioni, una notte" |
| **B2** `E_TRACCE_EST` — old tracks pass the car and continue north past the sign; none return | new landmark `tracks_north` at the OEJ path (near 20,2) | observation | Hawk, only if Cooper walks there ("Non te lo dico da qui. Vieni.") | P3, M6 motive | — |
| E7A, E7B | mound | as built | rewrite E7B page: the flap left out | P3A | E5 (opt.) |
| E8A, E8B | ring | as built | as built | P3A | each other (mandatory cmp) |
| E_SCENE | `scene_center` | as built, **positional**: the page only fires from the centre tile and describes what is visible from there (door → mound → beam; edges torn; no drag marks) | P3A | theory |
| **B3** `E_STUFA` — cold stove, ash raked into a ring, a burnt matchbook edge | new object `stove` (car interior, north wall) | object | Cooper: "Fuoco. Qualcuno l'ha guardato spegnersi." | P3 (fire motif), M6 falsa referent | with E7A (opt.) → "la formula e il fuoco: stessa notte" |
| **B4** `E_CARTE` — a spread of damp playing cards under the torn seat, the dealer's cut still squared | new object `cards` (car interior, torn seat) | object | Cooper: "Qui qualcuno teneva il banco." | P5 strong (M6), tactic information | in M6: pair with any JACQUES_* atom → "Il banco era suo anche qui" |

Groups (keep the 3-group milestone shape): **scena** = {E_SCENE, E_PONTE_DIREZIONE}, **oggetti** = {E8A, E8B, E_STUFA}, **biglietto** = {E7A, E7B, E_CARTE}? No: keep groups tied to *what the theory needs*: `ticket` {E7A,E7B}, `ring` {E8A,E8B}, `scene` {E_SCENE}. New atoms B1–B4 sit outside the groups (they never gate the theory, they inform it and M6).

Theory (rewritten, two real readings, each with a visible premise):
- **impeto** — "Un incontro degenerato: la violenza ai bordi, l'anello perso." Premise the player has seen: torn seat, bent sheet.
- **disposizione** — "Qualcuno ha disposto il centro perché fosse letto." Premise: ring at the centre, flap out of the mound.
Revision fires **on the ring comparison commit**, not on group count: "La polvere è intatta. Regge ancora l'impeto?" keep | switch. `open` stays as the honest third.

Presentation to Truman (existing pages_by_value): if `impeto` survives, Truman answers in the merit ("L'impeto non posa un anello al centro, Cooper.") and the objective does not stall: fail-forward exactly as Act 2's P2 (rung text names the missing comparison).

## 4. M6 consumption of M5 (content-level)

| M6 point | Reads | Effect |
|---|---|---|
| `m6_tactic` prompt page | `E_CARTE` | one extra action page before the choice: "(Le carte del vagone erano tagliate così.)" — the falsa-sicurezza tactic becomes an informed choice |
| `m6_interrogation_falsa` p06 | `E_STUFA` | unchanged text; the player now knows the stove |
| `m6_p5` | new optional pair E_CARTE ↔ JACQUES_* | P5 `support_strong`; feedback "Il banco era suo anche al vagone. Colloca, non attribuisce." |
| `m6_news` Cooper line | `m5_final_theory` (optional 4th case) | if `impeto` still held: "Avevo scritto impeto, Harry. Un cuscino non è un impeto." |
| `m6_atto4_bridge` | `jacques_death_suspicious` | one variant line for Truman if the register was read |
