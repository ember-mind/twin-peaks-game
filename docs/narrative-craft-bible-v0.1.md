---
type: briefing
domain: Game Narrative
created: 2026-09-09
purpose: Self-contained transfer document — paste into another AI or hand to a collaborator.
source: distilled from the Game Narrative wiki (30 Concept pages, Phases 1–5)
---

# Portable Briefing — Interactive Narrative & Dialogue Craft

Operational doctrine for writing story and dialogue in games. Every rule carries a *check*
(what reveals a violation). No rule here is a style; they are falsifiable structural tests.
Claims about how something *feels* to a player are marked HYPOTHESIS — only human testing
converts them to evidence.

Authoring hierarchy (top down, validate each level before expanding into the next):
**experience promise → premise → dramatic engine → story bible → arc → acts → quests → scenes → dialogue.**

---

## 1. The load-bearing skeleton (validate before writing anything)

A dramatic engine needs all four, plus two story-level closers:

1. **Want** — a concrete statable target ("find out who killed Laura Palmer"), never a mood.
2. **Obstacle** — something concrete in the way.
3. **Opposition that acts without waiting** — the antagonist runs an independent, largely
   unwitnessed strategy whether or not the player engages. A villain who only reacts is
   invisible the moment the player looks away.
4. **Escalation that demands new strategies, not bigger battles** — each turn forces a
   *changed approach*, not more of the same. Development, never repetition.
5. **A hidden truth that recontextualizes the conflict** (story level).
6. **An ending that forces a value conflict** — the climax is not won by force; the
   protagonist chooses between two things they want, or want vs. should.

**Check:** one line per element. If any is blank or restates another, do not expand downward.

**Protagonism is presumed, not earned.** Mechanics threaten the character continuously;
permanent consequence is withheld until the designed denouement; the antagonist is
thematically bound to *this* protagonist's arc (swappable antagonist = not bound). At the
climax the protagonist must be **changed, confirmed, broken, or revealed** — one of the four,
or they were not the protagonist of that climax.

---

## 2. Structure under player freedom

When the player picks the order, you are not designing a *sequence* (total order) but a
**partial order** — a graph. The invariant that survives non-linearity is *intelligible,
consequential change*. **Chronological presentation is optional; consequence is not.**

Every scene / storylet / revelation is a node with four fields:

- **Preconditions** — what must already be true/known/wanted for this to make sense.
- **Effects** — what changes in world, character, *player knowledge*, available actions.
- **Dependencies** — what later material becomes possible or gains force because of this.
- **Revaluation** — which *earlier* facts change meaning after this node.

A node with none of effects/dependencies/revaluation is decoration — fine as optional content,
never load-bearing.

How classic models hold up under non-linearity:
- **Three acts — holds well**, if acts are defined by **state thresholds**, not playtime %:
  Act I ends when the player accepts/causes an irreversible objective; Act II ends when the
  original understanding becomes untenable; Act III begins when a *new class of actions*
  becomes possible. Breaks only if Act II content is optional but the finale assumes its
  emotional/causal consequences.
- **Kishōtenketsu — holds best.** Built on interpretive revaluation, order-independent. The
  natural form of the exploratory mystery.
- **Save the Cat — most fragile.** Pure chronology. Use as a checklist of *effects on the
  player*, never as a timeline.
- **Freytag — partial.** Free order on the rise, guaranteed preconditions at the climax.

**Check:** for every beat that assumes something, list its preconditions and verify they are
guaranteed on *every valid path*, not just the intended one. Otherwise: make it mandatory,
make the beat robust to its absence (fail-forward), or degrade gracefully.

### Storylets over branching trees
A storylet = **content + prerequisite + required world-state effect**. Firing it *must* write
state later content can read — that is what makes echoes structural instead of a matter of
authorial discipline. Full branching ("time caves") does not scale; storylets are atomic,
robust, recombinable.

When several are eligible: **filter** (prerequisite holds) → **score** (specificity, e.g.
condition count) → **tie-break by recency** → random among ties.

**Gist point**: the moment inside a beat where its meaning has landed; after it, the beat can
be interrupted or skipped without narrative loss. Design for interruption around gist points.

---

## 3. The scene test

Every scene must change **at least one of eight domains**:

World-facing: world state · character state · relationship state · knowledge state.
Player-psychological: player expectation · player emotion · thematic meaning · available action.

**The precise intended effect must be named *before* drafting.** A scene reverse-justified
after the fact gets no protection.

**Quiet-scene carve-out:** a scene may change only interpretation, attachment, mood or
thematic understanding — zero engine-trackable flags — *provided* its effect was named ahead
of time. The carve-out protects scenes that know what they're doing, never scenes that did
nothing and got called "quiet." Summarization test: if a one-line summary loses everything
that matters, the texture *is* the content.

Also: **enter late, leave early** (start where change is imminent, cut the instant it lands);
**dialogue is action, never decoration**; **no "as you know" exposition**.

*(Correction on record: an early doctrine said "interactive story lives or dies on state." Too
strong. State makes a story **function**; craft, expression and presentation make the player
**care**. State is necessary, not sufficient.)*

---

## 4. Choice, agency, consequence

A meaningful choice expresses at least one of **strategy, values, loyalty, risk, sacrifice,
trust, identity** — never meaningful merely because the UI shows two buttons. It needs all
three of:

1. **Immediate reaction**, 2. **recorded state change**, 3. **at least one later echo.**

Reaction only = *cosmetic-but-claimed-meaningful*, the single most common way choice-driven
narrative disappoints. Once players catch one, they stop investing in the genuine ones.

**Refinement:** the echo must be **legible** — surfacing where the player actually reads
story: a changed space, a changed NPC behavior, a changed mechanic/resource, a gained or lost
opportunity. A flag read internally but never perceived is not a consequence.

### Agency taxonomy
- **Local agency** — immediate, context-specific, meaningful system reaction. The day-to-day
  unit of felt agency.
- **Global agency** — the arc/ending is determined by player action. Rare, routinely
  overclaimed.
- **Expressive agency** — the choice reveals who the player is *being*, regardless of plot effect.

**Input freedom ≠ agency.** A free-text box where most inputs map to one response creates
none; three fixed options with genuinely different intents and landing consequences create
real agency. Bandwidth is not the measure — consequence is.

**Honest linearity.** The player *steers* a defined protagonist; they do not author them. A
locked macro-sequence with strong local reactivity does **not** read as railroading —
railroading is felt only when local agency is *also* weak. Gated-linear is a legitimate
declared stance, not a fallback; declare it and deliver honestly.

**Agency ladder** (four rungs, not a spectrum): causal influence → intentional causal agency →
**legible** causal agency (player perceives and attributes) → experienced agency (felt as
mattering). Legibility has three independent failure points: did they see the event, did they
understand its cause, did they connect it to their own action.

Other hard-won rules:
- **The visible-gesture rule** — the world may react only to what characters and institutions
  can *observe*, never to private intent, and the player must know those observers exist.
- **Dramatic credit debt** — a scene borrowing weight from a consequence never delivered
  teaches the player not to invest in the next dilemma.
- **The "correct emotional choice" hazard** — if one stance earns cost-free gratitude, players
  optimize for approval instead of expressing a stance. Price every stance with one clause of
  visible cost.
- Never mix incomparable value types in one exclusive choice set (relationship vs.
  interpretation vs. game-useful information) unless sacrificing attention *is* the point.
- A solicited promise is relationship state, not flavor. Soliciting a vow and never reading it
  back is the worst version of the agency lie.

---

## 5. Mystery, evidence, knowledge

1. **Fix the true solution before writing a single clue.** Clues derive from the solution,
   never the reverse.
2. Build a **complete evidence chain** from solution back to what the player can observe.
3. **Clues always precede the reveal.** A clue introduced at the moment it explains something
   is not a clue, it is an assertion.
4. **Red herrings need real motives** (means/motive/opportunity that actually holds up).
5. **Revelations recontextualize** — they change the meaning of a scene already played, not
   just add a fact.
6. **No evidence introduced at the climax.**

**Revelation ladder** (fill per major reveal): revealed fact · prior apparent explanation ·
evidence planted (where/when, before) · consequences · new question.

**Fact & Knowledge Ledger** (deterministic bookkeeping, checkable by script — never left to
model judgment): per load-bearing fact track *objective truth · who knows · who suspects · who
falsely believes · when discoverable · supporting evidence · rendered acquisition · commit
phase*. The classic tell of an unplanned story is a character referencing what they had no way
to learn — because the author knows the ending and leaks it backwards.

**Schema metadata is not acquisition.** A route ID, a `gain` field, a state key or a designer
note never licenses wording. Knowledge exists only after a *rendered* beat names, shows or
transfers it.

**Setup–Payoff Ledger**: every mandatory payoff has a setup; every important setup has a payoff
or an explicit `intentional-unresolved` flag; no solution is introduced at the moment it is
needed. Track `Setup → Payoff → status(paid / intentional-unresolved / unpaid)`.

High-value payoffs need the causal chain:
`ordinary value shown in gesture → concrete expected future → threat → costly choice → changed return`
and two **destructive ablations**: (1) delete the opening value/expectation beat, (2) replace
the return with a neutral element. If the choice and the ending keep the same function, the
payoff is cosmetic — however elegant the callback. A return arriving after the decision is
already closed is a callback, not a payoff.

### Evidence rigor (investigative games)
- **An object identifies a relationship; a testimony identifies a place/time.** Never fuse them
  because the plot needs the conclusion.
- **Presence ≠ authorship.** Placing a suspect at the scene certifies neither guilt nor innocence.
- Letter/symbol arithmetic needs an explicit **serial rule** stated by a source; then it is a
  strong *theory*, not truth.
- A convenient death proves loss, not murder — keep the states separate (dead / testimony lost /
  death suspicious / murder confirmed).
- **The UI must not anticipate deductions.** If a conclusion becomes selectable the moment its
  evidence is held, the player *recognizes* answers instead of building them. Progression:
  open question → voluntary comparison of two elements → emergent note → proposition becomes
  formulable → presentation.
- **Propositions are multi-state**: formulated / presented / accepted-by-a-character /
  confirmed / contested / refuted. Acceptance is a social fact, not world truth — and the two
  must be able to diverge in both directions.
- **Feedback answers the link**, not the answer: say which nexus is missing; re-presenting a
  rejected pair gets a memory response ("you showed me this; it hasn't changed"). That memory
  is the anti-brute-force and is load-bearing.
- **Witness fairness**: a sub-optimal question may change cost, order and understanding — never
  permanently seal a central thread.
- **Atomic evidence**: one unit = one fact. Bundling an object with a testimony smuggles the
  testimony's information into the object.
- **Design metadata must never render.** An evidence's `function` field ("source
  corroboration") is a designer note; showing it hands the player the operation the puzzle
  asks them to perform. Internal IDs are not prose.
- **Put the player's theory under pressure**: preliminary theory on partial evidence →
  mandatory last observation → keep/revise/both-possible, recorded. A false lead offered as a
  menu option and corrected later is recognition; a false lead that was *your* theory and met
  resistance is investigation.

### Environmental evidence
Six categories — classify every placed detail on purpose: **clue · corroboration · affordance ·
guidance · texture · payoff.** A world where everything is evidence feels like it waited years
for the player. **Indexical**: a scorch mark should help the player *traverse, understand or
act*, not only explain backstory. **Mundane surplus** (unrelated repairs, ordinary laundry)
proves the world was not built waiting for the player — but avoid stock emotional shorthand
(the child's shoe), which reads as authored-for-effect. **Cap any NPC at 2–3 narrative
functions**; a caretaker-witness-guide-confessor is an answer-bundle wearing a person.
**Systems, not switches**: prefer limited allocation with visible tradeoffs over one control
that resolves five outcomes at once; every closed route needs a causal explanation, not
designer fiat.

---

## 6. Dialogue

### Scene contract, frozen before prose (ten answers)
1. What becomes true, impossible or costly after this scene?
2. What does each participant want *now*?
3. What does each know, suspect, falsely believe, and withhold?
4. What authority and practical capability do they have?
5. Which relationship, institution, object, procedure, place or taboo changes the available moves?
6. How do their attention, syntax, rhythm, disclosure and values differ?
7. What pressure forces speech *now*?
8. Which reply or action will *prove* the turn?
9. What stays unsaid but inferable?
10. What channel, length, interruption and repetition limits apply?

Missing answer → write a functional stub. **Never polish prose over uncertain structure.**

Per central speaker also record: `self_image` (the private verdict they must protect) ·
`declared_content` (what they think they're communicating) · `leak` (what the audience infers
from selection, omission, correction, timing) · `protected_truth` · `exit_cost`.

### The unit of dialogue is not a line, it is a causal pair
`want → social move → leverage → wording → pressure on listener → counter-move`

Move vocabulary: persuade, conceal, threaten, test, negotiate, deflect, accuse, reassure,
refuse, confess. **The topic is surface; the move explains why they speak now.** Exposition may
emerge as a by-product of a threat, a proof, an evasion or a price — if a line exists only to
deliver information to the player, find a move or change the channel.

> **Reaction is not compliance. Reaction is a counter-move.**

The NPC keeps protecting their own want via: price, blackmail, concealment, counter-evidence,
conditional concession, threat, operational withdrawal, or changing interlocutor/channel.

**A turn exists only when the following reply or action demonstrates a change** in tactic,
power, knowledge, relationship, or options. A line that reveals leverage but leaves the
response unchanged *prepares* the turn; it does not perform it. End on the first proof, before
the explanation.

**Power is a vector, not a single grade**: argument · definition · proof · time · space ·
witness · exit · face/social status. A scene turns when at least one dimension changes and the
next beat proves it.

### Voice without caricature
Voice comes from decisions under pressure, not catchphrases. Differentiate each speaker on at
least four axes: what they notice first / refuse to notice; what they protect (person, status,
procedure, secret, result, self-image); how they push (demand proof, invoke authority,
negotiate, test, console, redefine, attack); what they speak through (materials, abstractions,
examples, memories, professional practice); syntax and rhythm (fragments, long periods,
questions, self-corrections, silences); disclosure strategy (direct, circling, lying, joking,
repairing, changing channel); how politeness moves under pressure; the word or admission they
avoid.

**Speaker-swap test:** strip names, proper nouns and catchphrases, then swap line clusters. If
attribution survives only thanks to tics, written accent or professional jargon, the voice is
not ready. *Professional lexicon identifies a role, not yet a person.*

### Subtext that can be verified
Subtext is not vagueness — it is a **recoverable inference** produced by a character pursuing
one goal while protecting another. Surface topic ≠ real stake. Before a major reveal: at least
**two independent leak channels** and a credible reason to withhold. Ambiguity gets rails: the
observable action is fixed, the cause or meaning may stay open; every admitted reading needs
at least two anchors.

Per pause: `trigger → the safe response became unavailable → new tactic/action`. If the chain
breaks, cut the pause.

### The world must cause the scene, not dress it
**Material verb rule**: a named object must at minimum *authorize, prove, cost, block,
transport or change state*. A proper noun is not world specificity.

**World-strip test**: replace names, places, objects and institutions with generic
equivalents. If tactics, authority and outcome stay identical, the world is decoration.
(Second, harder substitution: swap in material or procedure from a neighbouring domain. You may
not invent a new sensor/permission/machine to rescue the substitution.)

The world enters when it changes: what counts as proof · who may order and who must obey ·
which cost is credible · which metaphors come spontaneously · what is taboo · which procedures
block or unblock action · which material keeps a trace · which everyday consequence produces
conflict.

### The uncanny without randomness
1. Establish an ordinary ritual worth protecting. 2. Violate exactly one relation: time,
sequence, ownership, count, response, identity, source or intention. 3. Offer a credible
rational cover. 4. Introduce a correlated recurrence. 5. **Change behavior before explaining
the cause.** Never call a thing "unsettling" — show the deviation. A random image is noise; a
fully decoded symbol is instruction. Comedy comes from the character's practical logic and
preserves dignity.

### Rhythm and anti-polish
Plain effective word over prestigious word. Read aloud. Vary turn length and shape. Allow
hesitation, repair, unfinished sentences, ordinary tasks. Repetition only when meaning,
pressure or owner changes. Cut greetings, recaps, filters and explanations of the implicit.
After a pact, order or refusal is already complete, cut the elevated paraphrase that turns it
into a maxim without changing permission, cost or response.

**Count mannerism by semantic family, not grammar.** "It isn't pity" / "you call it duty" /
"its real name is fear" are *one* correction-definition family. Four different imperatives are
one directive family. No family should exceed **~20%** of a speaker's lines in a long scene
(operating alarm, not universal law); three consecutive definitions/corrections is a hard
alarm — replace at least one with an action, concession, proof, refusal or silence.

**Brevity is not an absolute value.** Cut words that change neither comprehension, emotion nor
rhythm — economy removes mediation, not personality. A digression that shows tactic can earn
its space with no new fact.

### Interactive dialogue: choices
Each option must: answer the previous beat · clearly promise intention and intensity ·
protect a *different* value · stay in the protagonist's voice · provoke a specific counter-move ·
write 3–5 persistent keys (never a vague "attitude") · produce a playable echo.

**At least two options must be Pareto-incomparable** — each gains and pays something. A
dominant option turns dialogue into a puzzle with a right answer. The NPC must never hand over
the same information with different wording across branches. **Choice labels must be social
moves, not topics, and may use only already-acquired knowledge** — hidden route topology never
licenses future wording.

**Foldback is honest** when it preserves a difference in access, knowledge, relationship,
resource, procedure, space or future behavior. A verbal callback alone is a weak echo.

### Runtime: semantic transaction order
`uncommitted → player_move_pending/progress → counter_pending/progress → effects_committed/foldback → echo_consumed`

1. Selection locks the route and saves **intent only**.
2. The runtime renders and acknowledges **every page of the player's move**.
3. Only then the NPC counter-move is rendered and acknowledged.
4. Only then branch effects are applied **atomically**.
5. Recovery resumes at the first unresolved *semantic* page (separate cursors and acks).

A `player_move.pages` array present in the data but never emitted is a failure even at 100%
state coverage. Metadata never creates narrative access: every future door, witness, tool,
place or permission requires a rendered antecedent that names, grants, exposes or physically
reaches it. Echoes are one-shot when repetition would falsify the consequence.

### Delivery / small screens
Retro or mobile presentation (e.g. 160×144): one move or image per page; starting budget
~24 characters × 4 lines including name and punctuation — a signal, not proof; inspect real
wrap. Put the response on the next page when timing matters. Cut recaps already visible in the
UI/notebook. Move visible facts into action, sprite, sound or object. Don't compress every
voice into tutorial fragments. Test fastest tap, interruption, reload, revisit.

---

## 7. Channel selection (the presentation matrix)

Same beat, six possible channels — choose by intended effect, not by habit or cost:

- **Player ACTION** — responsibility, discovery, moral decision, competence-as-meaning. If the
  player should *own* it, they must cause it.
- **Interactive DIALOGUE** — relationship change, negotiation, declared or masked intent,
  choosing what to reveal about oneself.
- **ENVIRONMENT** — when the player should *infer*. The mechanism is subtext: understanding
  requires making the connection yourself. Discovery pleasure, optional depth.
- **ANIMATION / SOUND** — body contradicting words; atmosphere carrying information; a motif
  accumulating silently.
- **Brief CUTSCENE** — only when exact timing matters, or the intended experience is
  witnessing rather than deciding.
- **OPTIONAL TEXT** — only when genuinely optional, revisitable, and its *voice* is part of the
  pleasure.

**Never list:** a mandatory plot fact only in optional content · a cutscene for a decision the
player should make · dialogue describing what is on screen · long text during urgent action ·
the same exposition on two channels unless the repetition serves recall, contrast or irony.

Bare mechanical constraints (a timer, a cap) are structure without meaning unless expressed
**diegetically**; the same gate stated as a UI rule reads as restriction, in-fiction it reads
as story.

---

## 8. Audience state (all HYPOTHESIS until humans test it)

Track before/after for any major scene: **want · belief · suspicion · expectation · fear ·
curiosity · attachment/distrust · memory anchor · emotional pressure · cognitive load ·
certainty · control.**

Then name, *before drafting*: the intended effect (which field, which direction), the question
created or answered, and the **exit impulse** (what the player should want to do the instant
the scene ends).

Separations people collapse and shouldn't: **certainty ≠ control** (a player can be totally
disoriented about the plot yet perfectly clear on what to do next, and vice versa);
**cognitive load ≠ emotional pressure** (a scene can land emotionally in the writer's head
while the player is still tracking three unresolved facts); **audience-state change ≠ agency**
(a scene can shift belief without the player causing anything). **Anticipation is not agency** —
dread before an outcome is audience state; agency arrives when the player later sees their
stance reflected back.

Hypothesize **per cohort**, not per player: players who chose differently earlier exit the
identical scene in different states.

---

## 9. Attachment (the Floyd model)

1. **Concentrate the whole NPC budget on ONE companion.** Depth beats breadth of characters.
2. Populate **four behavior channels** on that one: direct interaction routines ·
   conversational responses · autonomous per-turn actions · story-triggered behaviors.
3. Rapport comes from **breadth of small consistent touches, plus humor and vulnerability** —
   never one grand gesture.
4. **One gated, fixed loss beat converts rapport to grief** — gated so it fires only after
   enough rapport exists to cash in.

Anti-patterns: tragic biography instead of experienced relationship · other characters praising
how likable they are · constant agreeableness (no friction) · death soon after introduction.

Field lessons: **object-mediated echoes beat verbal callbacks** (an unannounced physical trace
of the player's earlier gesture) · **absence is an echo** (a line they no longer say) ·
**skip-path rule** — skipping optional relationship content reads as a quieter register of the
same relationship, never as a penalty · **affection must never be scored**, or it becomes a
resource to optimize.

---

## 10. Diagnosis and audit

### Six critic lenses, with an anti-vagueness contract
**Engagement · Character · Scene · Prose · Dialogue · Presentation.** Every finding must name
the exact passage/node, the *mechanism* that failed, and one concrete revision. "Make it more
compelling", "add emotion", "improve pacing" are forbidden outputs. Run the lenses separately —
averaged together they produce "this needs work."

### Scene diagnosis, six parts
1. **Player role** — investigator, performer, steerer, partial author, audience? Find every
   point where the interface promises control the character won't permit, and classify:
   **player-vs-character** (productive resistance; the refusal reveals character) vs.
   **player-vs-game** (a broken promise; a bug in the contract).
2. **Agency audit** per interaction — verdict each: meaningful / merely reactive / formally
   present but dead / falsely advertised. Never call a non-branching choice cosmetic before
   checking what it lets the player *express* or *experience*.
3. **Channel audit** — change a channel only for a named gain; a swap with no stated benefit is
   churn.
4. **Audience-state hypotheses** at entry, turn, exit — intended state, likely achieved state,
   what would need a human test to close the gap.
5. **Craft layer** — dramatized vs. stated tension, subtext, POV discipline, image
   accumulation, exposition faults, does the scene earn its length.
6. **Exactly three repairs**, impact-ordered: one problem, the minimal change, the intended
   player effect, the new risk it introduces. Never pack two problems into one repair. **At
   least one repair should preserve a valuable ambiguity rather than resolve it** — resolving
   all three by default is itself a finding.

### Hard gates for dialogue (fail = revise, no negotiation)
| Gate | Hard fail | Minimum probe |
|---|---|---|
| Knowledge | fact or wording used before reachable acquisition | ledger/timeline comparison |
| Literal floor | the practical conflict can't be retold plainly | literal retelling |
| Agency | a central participant doesn't protect an agenda; price changes nothing | want/tactic ledger |
| Turn causality | no `antecedent → move → response → delta`; deleting the move leaves the scene identical | move-deletion |
| World necessity | inert substitution leaves leverage, moves, outcome identical | neutral world substitution |
| Fair leakage | protected truth lacks two independent channels or a reason for silence | leak-channel audit |
| Voice mechanism | de-lexicalized clusters swap without changing attention, tactic, disclosure, values | blind swap |
| Author thesis | a line explains theme/emotion but deleting it changes nothing performable | deletion test |
| Exit residue | no material, relational, epistemic, tactical or behavioral delta | before/after state |
| Transfer contamination | new setting but the relationship, topology, tactics or final carrier copy the example | overlap/topology scan |
| Mannerism | one semantic family >20%, or three polished devices in a row | family count |
| Payoff causality | `value → future → threat → cost → changed return` doesn't hold; ablations preserve function | opening deletion + neutral return |
| Route causality | unreachable write, read-before-write, dead state, access with no rendered antecedent | route/read/write trace |
| Choice dominance | fewer than two Pareto-incomparable options, or same intent in different words | gain/cost matrix |
| NPC vending | the NPC abandons its want and gives the same answer on every branch | branch counter-move comparison |
| Echo | the consequence is only a verbal callback | changed-affordance check |
| Runtime | overflow, orphan label, lost commit, player move never rendered, broken interrupt/reload/revisit | physical runtime suite |

### The hierarchy of proof (weakest → strongest)
1. author states intent → 2. reviewer expresses taste → 3. diagnosis cites line and mechanism →
4. **destructive probe** modifies the artifact and compares function → 5. runtime executes all
routes and states → 6. independent reviewers repeat the probes → 7. real people confirm
comprehension or emotional response.

**Never convert an author's, a model's or a critic's enthusiasm into human evidence.**

Mandatory destructive probes: **move deletion · world substitution · speaker swap · author-thesis
deletion · payoff ablation (delete the opening, neutralize the return) · runtime injection**
(route with no opening; counter before the player move is acknowledged; effects before the
counter completes; invalid cursors; unknown route; orphan write; corrupted final state).

Every finding: `exact line/node → gate/mechanism → proof → minimal repair → regression risk`.
End of audit: maximum defect · mechanism worth preserving · new test · claim boundary.

**Also attack the harness itself with mutation tests — a test can be false-green.**

---

## 11. Human validation

Model self-rating is never evidence. Solo-dev protocol: one observer, one tester, no
intervention. Watch for: hesitation before acting; voluntary exploration; misread objectives;
text skipping; twists predicted before they land. A confused player asking "what am I supposed
to do?" is a **finding**, not a moment to help.

Five fixed questions, after (never during), in this order:
1. What were you trying to do? 2. What do you want to know next? 3. What did you expect would
happen? 4. What confused you? 5. Which moment or image do you remember?

Discriminating tests go in a **separate session or cohort**, or the question teaches the tester
what to look for: **blind speaker attribution** (lines without names — who speaks, and what in
the line proves it) · **delayed recall** (after an unrelated task; declare the interval) ·
**choice–cost–echo recall** · **world-substitution blind A/B** (causal world vs. swappable
proper nouns; counterbalance order). These separate four claims usually collapsed into "good
dialogue": speaker specificity, memorability, consequence comprehension, world specificity —
passing one implies nothing about the others.

Report raw counts beside every percentage, name the design (within- vs. between-subject),
counterbalance order, and keep the model's prediction in a *separate column* from the human's
answer so the delta stays visible. A formative pass's numbers are not validation evidence.

---

## 12. Failure-pattern checklist (run as a separate critical pass)

Passive villain · sudden betrayal without setup · lore dump before the first objective ·
choices with identical outcomes · surprise antagonist near the ending · capture-and-escape
loops · characters stating the theme · ending ignoring player decisions · amnesia-for-exposition ·
prophecy replacing causality · quest-dispenser NPCs · constant escalation with no quiet contrast.

Plus the dialogue-specific ones: **clever-line island** (a strong line with no purpose, state
or consequence) · **lore-noun stuffing** · **turn by assertion** · **role as voice** ·
**catchphrase identity** · **reactive corpse** (branches set flags, the NPC always executes the
player's plan) · **all variables in every line** (one greeting must carry class, mood, quest,
relationship and lore; variants explode, differences go unnoticed) · **everything
interruptible** · **coverage vanity** (rare lines funded before frequent states) · **metadata
afterthought** · **"the model says it's memorable."**

Pre-ship gate: score gameplay fit, causality, continuity, agency, ending payoff 0–5; critical
categories need ≥4. On a failure, name the exact node, propose **at least two** repair
strategies, pick the least disruptive.

---

## 13. Two ways a well-written corpus lies at runtime

Both found by adversarial critics reading the *played transcript*, not the source:

1. **Narration drawn from a pool independent of what actually played.** An outcome caption was
   selected from a pool that didn't know which line had been spoken: a *deflection* line got
   the caption "real listening" — the exact opposite of what was played. The truthful text
   already existed in the corpus, filed under `poor`. **Rule:** any color text drawn from a
   pool independent of the state it describes will eventually contradict it, and unit tests
   that never compare copy against emitted content cannot notice. Derive the cited fact from
   simulated state at the call site, or tag both pools with a shared discriminator.
2. **Differentiated voices, randomly attributed.** Archetype variants were written carefully;
   the selector weighted freshness and eligibility but never enforced tag→speaker, so **53% of
   tagged lines came out of the wrong character's mouth.** **Rule:** writing quality is
   necessary and not sufficient. Verify by sampling the *played transcript* and checking the
   emitted speaker against the tag — never by checking pool coverage.

---

## 14. Production discipline (shipping it)

- **Measure before writing.** A probe walking the mandatory spine at real player speed with a
  reading rate (~12 chars/s) tells you in a minute whether the "15–20 minutes" target is
  reachable. Without measurement you write padding.
- **The spine stays short; the minutes come from optional texture that responds to state.**
  Don't lengthen mandatory dialogue — add echoes conditioned on flags the engine already
  writes (`done_<dialogue>`) between optional NPCs. Zero architectural cost.
- **A fact exposed twice is a cut, not reassurance** — move one instance to an environmental
  channel and it becomes discovery.
- **A file-dispenser NPC needs a cost** — repair with a leak ("I read it; I shouldn't have") and
  a sentence someone can't finish, never with more exposition.
- **A closing formula is a tell** — if every dialogue ends with the protagonist's aphorism, cut
  half. Mechanical gates get respected by rewriting, never by loosening the test.
- **The final hook is a scene, not an HUD line.**
- **World state is narrative** — if the scenes are at dusk, the intro's clock must say so.
- **A matrix is not a script.** "Two questions + answers per the matrix" is design, not a
  deliverable. The honest label for the halfway state: *complete design, partial script.*
- **A resource must be experienced to be mourned** — whatever a death destroys must first be
  built in front of the player, line by line.
- **Triple explanation kills attribution** — notebook states it, player confirms it,
  protagonist re-explains it to the sheriff: comprehension survives, ownership of the reasoning
  dies. Every restatement after the first must carry new content or die.
- **The notebook must ask, not explain.** Show the bare facts and pose the question with
  distinguishable readings, rather than handing over the decomposition.
- **Obligatory/optional must match objectives and gates** — a beat declared optional but listed
  in the objective is obligatory in fact. Objectives, gates and declarations are one contract.
- **Observations a system depends on cannot be optional.** Freedom lives in *order*, not coverage.
- **Provenance ≠ approval status** — track `source` (canon / project-fact / adaptation /
  new-proposal / interpretation / uncertain) and `status` (locked / open / deprecated) as two
  independent dimensions. Locking an interpretation silently turns it into truth, which is
  exactly what the lock system exists to prevent.
- **Author knowledge vs. player uncertainty** — the player's protected ambiguity does not
  license authorial vagueness. Production documents decide the internal truths so the writer can
  build consistent traces, timings and lies; the *system* simply never certifies them.
- **The confession is the script.** Summarizing a climax as a beat list is the matrix-is-not-a-
  script failure at the worst possible place: before any mercy choice, the perpetrator admits
  each victim's facts in first person, page by page, tracked per-fact — never one boolean.
- **The supernatural's first line must not absolve.** The entity may provoke, lie, appropriate,
  split — never settle the question of will. And the victim stays the moral center.

---

## 15. Claim boundary (say this out loud)

The mechanical layer — knowledge integrity, causality, turn, world necessity, choice
architecture, runtime routes — can be designed, probed, and certified as *structurally valid*.
"Natural", "memorable", "moving", "recognizable" cannot. A validator may say "structure valid";
it may never upgrade that to "excellent dialogue." Everything about how the work *lands*
remains a hypothesis until real people, in a separate cohort, confirm it — and a passing test
proves that scene with that population, not a universal formula.
