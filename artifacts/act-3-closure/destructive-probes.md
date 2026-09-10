# Act 3 destructive probes — evidence

Procedure: `docs/narrative-system-v0.1.md` §14. Mechanical probes run against
`js/narrative-runtime.js` (NR) on raw `narrative/missions/M5.json` /
`M6.json`, using the load pattern of `test/act-3-flow.js` (window=undefined,
domains from `narrative/state-enums.json`), in a throwaway script (deleted
after this run, not committed). Baseline path: M4 tail (P2 accepted by
Truman) → M5 (bridge/mound/ring/scene, degeneration theory, ring comparison,
revision kept, report, s1 institutional, tracks north) → M6 (ferry, tactic
`prova`, arrest, hospital guard, return, news, Act 4 bridge). Baseline
completes: `east_route_confirmed=true`, `atto4=true`.

## 1. Move deletion

**(a) Truman's merit exchange** — deleted `m5.b9.report.contest.p01/02/03`
(the "polvere... cosa la tiene al centro?" exchange) from
`m5_report_intro.pages_by_value.cases.degeneration`, leaving only
`theory_degeneration`. Re-ran the full path.

- Downstream state identical to baseline: `east_route_confirmed=true`,
  `s1=institutional`, `m5_final_theory=degeneration`, `P3A` formulated.
- **Why**: `m5_report_intro.effects` is `[]` — the node writes nothing
  itself; all pages (any branch) are pure display. No later condition reads
  a page id. The exchange is not a "move" in the causal sense; it is the R2
  doctrine payload (Truman contests, doesn't confute) delivered entirely
  through un-gated text.
- **Finding**: the probe cannot detect decorativeness here because nothing
  in this node is mechanically load-bearing by design — voice/doctrine
  content, not state. That is consistent with the Bible (dialogue carries
  tone, not gates), but it also means no automated check protects this
  specific exchange from silent drift or accidental deletion; only a human
  read (or a text-presence lint) would catch it.

**(b) Whole Jacques branch** (`m6_tactic` + `m6_interrogation_prova` /
`_pressione` / `_falsa`) — deleted all four nodes from a clone of M6.

- `m6_ferry → tactic_prova` fails (`node_not_found_for_choice: m6_tactic`).
  `jacques_admitted_presence` never becomes true. `m6_p5`'s own
  `prepareNode` fails (`conditions_not_met`, gate = `flag
  jacques_admitted_presence`).
- **Finding (real defect)**: calling `NR.prepareChoice` / `commitChoice`
  directly on `m6_p5` with choice `p5_present` still **succeeds** and still
  formulates `P5`, even though `m6_p5` was never opened and its gate flag
  is false. `P5.formulation.status='formulated'` then satisfies
  `m6_arrest`'s condition, and the whole rest of the act (`jacques_preso`,
  `m6_hospital_guard`, `m6_return_night`, `m6_news`→`jacques_dead`,
  `m6_atto4_bridge`→`atto4`) completes normally.
  `NR.prepareChoice` reads `node.choices` directly and never re-checks
  `node.conditions`; the gate exists only at the `prepareNode` boundary. In
  the shipped UI this is unreachable (the engine cannot render `m6_p5`'s
  choices without a successful `prepareNode` first), so it is not a live
  player-facing bug — but it means the Jacques branch's causal necessity is
  enforced by the UI call order, not by the data/runtime contract. A replay
  bug, a malformed save, or a future direct-choice API caller could
  formulate P5 and complete the act with **zero** interrogation content and
  no admission ever recorded. This is the probe's headline finding: **what
  did not break, that the design implies should have.**

## 2. World substitution

Two variants against a clone of M5.

- **Variant 1 — inert evidence, mechanism kept**: stripped only the
  evidence effects (`E_PONTE_DIREZIONE`, `E_SCENE`, `E_TRACCE_EST`) from
  `m5_bridge` / `m5_scene` / `m5_tracks_north`, keeping the nodes and their
  flag/notebook effects. Act still completes: `east_route_confirmed=true`.
  Confirms the traincar's positional evidence is legibility/texture on top
  of a mechanism that does not need it to function — expected, and matches
  the doctrine's own distinction between world-as-cause and world-as-dress.
- **Variant 2 — tile-anchored nodes deleted**: removed `m5_bridge`,
  `m5_scene`, `m5_tracks_north` entirely. `m5_mound`/`m5_ring`/`m5_cmp_ring`
  become unreachable (`node_done: m5_discovery`/`m5_scene` gates never
  satisfied — `m5_discovery` itself needs `node_done: m5_bridge`).
  `east_route_confirmed` ends `false`. Static scan of the mutilated M5 and
  of M6 for any other writer of `east_route_confirmed`: **none**. The flag
  becomes permanently unwritable — the OEJ door (`js/maps.js:375`,
  `needsFlag: east_route_confirmed`) never opens, M6's own
  `entry_condition` (`flag: east_route_confirmed`) never passes.
- **Conclusion**: the traincar is not inert dressing. The specific
  tile-anchored beats (not their flavor evidence) are the sole causal path
  out of town for the rest of Act 3; Move deletion (b) and World
  substitution (variant 2) both converge on the same single point of
  failure family (`m5_bridge`→`m5_discovery`→everything else, and
  `m5_tracks_north` as sole writer of `east_route_confirmed`).

## 3. Payoff ablation

**(a) Remove `m6_hospital_guard`** (mandatory B7, sole content node for the
guard/register scene) from a clone of M6.

- `m6_return_night`'s gate is `node_done: m6_hospital_guard` — permanently
  false. `m6_return_night_early`'s gate is `not node_done:
  m6_hospital_guard` — permanently **true**, so the deferral variant stays
  selectable forever and the player is stuck re-reading "Prima l'ospedale,
  Cooper" with no ospedale node to resolve it.
- Cascade confirmed by runtime: `m6_news` (`node_done: m6_return_night`)
  never fires → `jacques_dead` never set → `m6_atto4_bridge` (`flag:
  jacques_dead`) never fires → `atto4` never set. **The act does not
  complete.**
- Lines that lose their antecedent (quoted): `m6.b9.atto4.p02` — "Un
  gigante non so dove metterlo. Jacques sì: **qualcuno ha superato un
  piantone**." (unreachable anyway, since the whole node is unreachable,
  but the specific referent is `m6.b7c.guard.p03`, "Piantonato. Firma
  domattina.", which no longer exists). `m6.b8.news.cooper_prova` — "Aveva
  una dichiarazione da firmare... La firma non arriverà mai." loses the
  register/guard frame it answers. `m6.b9.atto4.register` (conditioned on
  `jacques_death_suspicious`, written by the optional `m6_hospital` ward
  node) — "Il registro dice nessuno" — is orphaned twice over, since its
  own gate node is also unreachable in this cut.

**(b) Remove the S1 echo pages** (`m6.b9.atto4.s1_safe`,
`m6.b9.atto4.s1_pocket`) from `m6_atto4_bridge`.

- Grep of every mission JSON for `value_is`/read of `s1`: **these two pages
  are the only in-Act-3 readers** of the `s1` value's specific content
  (M5's own references are `value_set: s1`, i.e. presence checks, not
  content reads). Removing them does not make `s1` globally write-only —
  `js/narrative-finale.js` (lines 134, 326, 376, 438, 440, 745) reads
  `carryValue('s1') === 'documented_custody'` at the Room 315 finale, well
  outside Act 3.
- **Finding**: within Act 3 itself, the S1 custody stance (A13, a "stance"
  choice per the Bible's taxonomy, which requires "later legible echo
  proportional to the claim") would lose its **only** in-act echo — the
  choice would go answered but silently, violating the meaningful-choice
  contract locally even though the value survives to pay off much later in
  the finale. The act-local echo and the game-long payoff are two different
  claims on the same value, and this probe shows they are not
  interchangeable: ablating the near payoff still breaks the near claim.

## 4. Route causality

Three transitions, exact writer→reader chain, confirmed against the actual
runtime/data (M6's classic-engine cross-layer flag `gigante1` is bridged in
`js/glue.js`/`js/narrative-production.js` and is outside `NR`'s mission
schema — confirmed statically, protected in production by the
`act-3-mirror-gate` test per doctrine §16 rather than re-simulated here):

- **North cut → OEJ door**: writer `m5_tracks_north` (`set:
  east_route_confirmed`, sole writer, confirmed above). Readers: the map
  transition gate `js/maps.js:375` (`needsFlag: east_route_confirmed`,
  mirrored in `js/traincar-location-data.js:14`), `m5_sign_oej`'s
  condition, and `M6.entry_condition` (`flag: east_route_confirmed`,
  `M6.json:10-11`). Skipping the writer (Move deletion b / World
  substitution v2 above) confirmed by runtime: door never opens, M6 never
  entered — no alternate writer exists anywhere in the mission set.
- **OEJ → Giant (Room 315 mirror)**: writer chain is
  `m6_news` (`set: jacques_dead`) → `js/narrative-production.js:155`
  (`if (state.flags.jacques_dead) classicFlags.jacques_morto = true`,
  cross-layer sync) → classic node `gigante1_dlg`
  (`js/data.js:696-706`, `cond: flag:jacques_morto`, `setFlag: gigante1`) →
  reader `js/glue.js:106` (`cond: 'flag:gigante1', then: 'specchio_dopo'`).
  Skipping `m6_news` (Payoff ablation a, above) confirmed: `jacques_dead`
  never set, so `jacques_morto` never syncs, so `gigante1_dlg` never fires,
  so `gigante1` never sets — the Giant scene is unreachable, not merely
  unrendered.
- **Giant → Act 4 bridge**: writer of `gigante1` is the classic
  `gigante1_dlg` node above; reader is `m6_atto4_bridge`'s condition
  (`flag: gigante1`, alongside `flag: jacques_dead`). No alternate writer
  of `gigante1` exists outside that one classic node
  (grep confirms `js/data.js` is the only `setFlag: 'gigante1'` site).
  Skipping the writer (by construction, since it depends on `jacques_dead`
  from the previous link) blocks `m6_atto4_bridge`, confirmed by the
  Payoff-ablation-a run above (`atto4` stayed `false`).

All three links are single-writer, single-path: no route redundancy exists
anywhere in this chain from the north cut to Act 4. Every ablation above
that touches a link in this chain (m6_hospital_guard, m6_tracks_north/
m5_bridge/m5_scene, m6_tactic+interrogations via the P5-bypass gap) breaks
the act at that exact point, with the one caveat noted in §1(b): the P5
bypass means the Jacques-branch link is enforced by call order, not by an
independent data gate.

## 5. Speaker swap (judgement — table only, no verdict)

Voice contract (`docs/act-3-design-report.md` §11): **Hawk** = ages,
duration, direction, what the rain did; avoids motive/adjectives-about-the-
dead/"why"; answers meaning with a fact about distance. **Truman** =
procedure, the record ("verbale"), the clock/hour; avoids the dream/giant as
evidence; answers a theory with a fact that has a place. No contract is
given in the report for Cooper *interrogating* (only "Cooper at the scene",
a different register) or for Jacques outside "turns every question into a
game he is dealing" — flagged where that gap weakens the call.

### M5 — every Hawk line vs every Truman line

| Speaker | Line | Text | Mechanism invoked | Swap detectable? | Why |
|---|---|---|---|---|---|
| Hawk | m5.b1.bridge.p04 | "Truman mi manda a farti da ombra. Da qui in poi le impronte sono mie e tue." | role handoff, no ground data | **borderline** | no age/direction marker; reads as procedural assignment, closer to Truman's register than Hawk's own |
| Hawk | m5.b1.bridge.p05 | "Le altre sono più vecchie della pioggia. Portano a est, nessuna torna indietro." | age ("più vecchie della pioggia") + direction ("a est") | **yes** | textbook age+direction fact, exactly the contract's example mechanism |
| Hawk | m5.b1.bridge.p06 | "Il paletto l'ha messo la contea, tre giorni fa. La terra la leggo io. Il resto lo leggi tu." | duration ("tre giorni fa") + explicit ground-reading claim | **yes** | duration marker plus "la terra la leggo io" names the mechanism Truman never claims |
| Hawk | m5.b3.discovery.p02 | "Io tengo fuori gli altri. Tu fai il primo passaggio." | role/procedure only | **no** | no age/direction/rain content; a procedural gatekeeping line, plausible in Truman's mouth |
| Hawk | m5.hawk.hawk_bridge.p01 | "Le impronte sono di là, sulla massicciata. Non le calpesto io, non le calpesti tu." | direction ("di là") + preservation instinct | **yes** | direction + track-preservation is Hawk's functional signature |
| Hawk | m5.hawk.hawk_door.p01 | "La soglia la tengo io. Dentro ci sei tu." | role split only | **borderline** | duty division reads procedural; only "soglia" (threshold, spatial) leans Hawk |
| Hawk | m5.b9.report.p06 | "Le impronte non si fermano al vagone. Non te lo dico da qui. Vieni." | tracking continuation | **yes** | "impronte" + refusal to report secondhand is the trust-the-ground-not-the-telling pattern |
| Hawk | m5.a14.tracks.p02 | "Dal cartello in poi il sentiero non serve altre proprietà. Un'ora di cammino. Finisce a One Eyed Jacks." | duration ("un'ora di cammino") + route fact | **yes** | duration + destination, the contract's exact register |
| Hawk | m5.hawk.hawk_cut.p01 | "Guarda per terra, non il cartello. Le impronte passano il vagone e salgono." | ground vs. sign instruction | **yes** | explicit "guarda per terra" (read the ground, not the marker) |
| Truman | m5.b9.report.p02 | "Non avete toccato niente. Bene: adesso tocca a me guardare." | procedure (chain of custody, whose turn) | **yes** | "tocca a me" names a procedural handoff, not a ground fact |
| Truman | m5.b9.report.contest.p01 | "La polvere, Cooper. L'hai scritta tu: intatta fino al bordo. Cosa la tiene al centro?" | reasons **from the written record**, not from his own ground-reading | **yes** | he cites Cooper's note, never claims to have read the dust himself — the record-citation move is Truman's, Hawk would just re-read the ground |
| Truman | m5.b9.report.contest.p03 | "Allora a verbale vanno i fatti. La lettura resta tua." | "verbale" explicit | **yes** | the word itself is the contract's marker |
| Truman | m5.b9.report.accept.p01 | "La lettura la verbalizziamo come tua. I fatti come nostri." | "verbalizziamo" explicit | **yes** | same marker |
| Truman | m5.b9.report.open.p01 | "Due letture, tutte e due a nome tuo. I fatti, uno solo: il nostro." | record/attribution, no explicit "verbale" | **borderline** | procedural in function but lexically softer; detectable by pattern (answers a theory with an ownership fact) more than by vocabulary |
| Truman | m5.b9.report.p04 | "Questo va nella cassaforte delle prove. Stasera." | custody procedure + clock ("stasera") | **yes** | evidence-custody noun + same-day deadline |
| Truman | m5.b9.s1.institutional.p02 | "Quando saprai che cos'è, sarà dove deve essere." | none — gnomic | **no** | no procedure/clock/record marker; could sit in either mouth on lexicon alone |
| Truman | m5.b9.s1.documented.p02 | "Metto a verbale che non sono d'accordo. E che ti conosco abbastanza da firmare lo stesso." | "verbale" + signing | **yes** | explicit record marker, strongest in the set |
| Truman | m5.b9.report.p07 | "Prima che faccia buio. Se il sentiero va dove penso, laggiù il banco lo tiene Renault. Io resto con l'anello e con il verbale." | clock ("prima che faccia buio") + custody + "verbale" | **yes** | clock + record, double marker |

Count: 9 Hawk lines (6 detectable, 3 borderline/no), 9 Truman lines (7
detectable, 1 borderline, 1 not). The 3 flattest lines
(`m5.b3.discovery.p02`, `m5.hawk.hawk_door.p01`,
`m5.b9.s1.institutional.p02`) carry role/plot function but no lexical or
mechanism marker tying them to one contract over the other.

### M6 — every Jacques line vs every Cooper line, interrogation nodes only

Cooper has no dedicated interrogation-voice contract in §11 (only "Cooper at
the scene," a different register: measurement-first, one Diane line per
move). Cooper's detectability below is judged against the general
questioning function (direct, two exclusive questions, no editorializing)
rather than a named mechanism — flagged per row.

| Node | Speaker | Line | Text | Mechanism | Swap detectable? | Why |
|---|---|---|---|---|---|---|
| prova | Cooper | m6.b5.prova.q1 | "Questo passava di mano, al vagone. La tua?" | direct evidence confrontation | **yes** | flat, declarative, no bargaining — opposite of Jacques's deflection pattern |
| prova | Jacques | m6.b5.prova.p02 | "Io porto le carte, non i messaggi." | deflect via his own trade (cards) | **yes** | names his function (cards) to dodge — textbook "turns the question into his game" |
| prova | Cooper | m6.b5.prova.p03 | "Non ho chiesto dei messaggi. Ho chiesto del vagone." | re-assert the question | **yes** | corrective, procedural, no metaphor |
| prova | Jacques | m6.b5.prova.p04 | "C'ero. Giocavamo. Questo è tutto quello che dico." | minimal admission + a stated limit | **borderline** | short declaratives could pass as Cooper's economy; only "questo è tutto quello che dico" (a dealt limit) signals Jacques |
| prova | Jacques | m6.b5.prova.p05 | "Se volete una firma, portatemi un avvocato e riportatemi il foglio." | bargains (the short bargaining sentence) | **yes** | explicit bargain-for-paper, matches "one short sentence that bargains" |
| prova | Cooper | m6.b5.prova.p08 | "E chi restava, quando il merci è passato?" | follow-up question | **yes** | still asking, not dealing |
| prova | Jacques | m6.b5.prova.p09 | "L'avvocato, agente. Poi il foglio. Poi vediamo chi restava." | dealing metaphor via sequencing ("poi... poi...") | **yes** | the "poi/poi" cadence rations information like a deal, not an answer |
| pressione | Cooper | m6.b5.pressione.p01 | "Stanotte dormi dal lato giusto del fiume... dipende dai prossimi due minuti." | pressure/leverage, procedural threat | **yes** | states custody consequence directly, no game framing |
| pressione | Jacques | m6.b5.pressione.p02 | "Piano, agente. Piano. ...c'era mezzo mondo." | one long sentence that changes the subject | **yes** | classic long-sentence deflection (widens the frame to "mezzo mondo") |
| pressione | Jacques | m6.b5.pressione.p09 | "Quella notte... (si riprende) ...guardavo le carte. Le facce, chiedetele alle carte." | the crack, then reverts to the cards metaphor | **yes** | the hesitation ("si riprende") + closing on "le carte" is the named crack-then-recover pattern |
| falsa | Jacques | m6.b5.falsa.p04 | "Io. Io tengo sempre il banco... anche al vagone si giocava, quella notte, e il banco era mio." | boast, ownership claim | **yes** | the vanity/overclaim (falsa sicurezza tactic) is Jacques-specific bravado, not a Cooper register |
| falsa | Jacques | m6.b5.falsa.p06 | "Non beveva. Guardava la stufa come si guarda una persona... Io i tipi così li lascio guardare." | the one crack (the third man / stove image) | **yes** | this line is the design report's named exception ("guardava la stufa come si guarda una persona") — deliberately singular, unmistakable |
| falsa | Cooper | m6.b5.falsa.p07 | "Che cosa guardava, secondo te?" | plain follow-up | **borderline** | short and direct, but generic enough it could sit as a flat Jacques deflection-question if reworded; detectable mainly by absence of any dealing metaphor |

Jacques is reliably distinct wherever the cards/dealing metaphor or a bargain
appears (7 of 8 quoted lines); Cooper is reliably distinct wherever the line
is a flat, unmetaphored question or correction (4 of 5). The two borderline
Cooper lines and the one borderline Jacques line are exactly the short,
purely functional turns — which is also where the report gives Cooper no
explicit interrogation contract to check against.
