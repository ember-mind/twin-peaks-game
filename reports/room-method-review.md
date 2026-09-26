# Room-method evidence review

Repository audit, 2026-09-26. Research snapshot: `490b5c4`; production snapshot: `7a3de3fd249cc908756a269e116c597bc82f1767`. This review separates implementation, reviewer opinion, and player evidence. It makes no new art or runtime changes.

Verdict: we have a promising, reusable authoring process and two Program pilots, with useful architectural evidence from the lobby. We have not yet demonstrated reliable room creation by another author, improved human experience, or predictable cost. The next work should make the process reproducible and test its transfer. [Proposed method](../docs/beautiful-room-method-v0.1.md) and [publication draft](beautiful-rooms-post-draft.md) turn this review into concrete deliverables.

## What the studies actually established

| Study | Supported result | Limit |
| --- | --- | --- |
| [Sheriff Program pilot](intent-room-sheriff.md) | Added immutable intent metadata, native anchor binding and read-only Builder inspection; tested adjacency and routes. | Metadata does not generate or certify attractive art. |
| [Sheriff visual pass](intent-room-sheriff-visual-pass.md) | Empty-floor experiment lost its comparison; narrow runner/work-wall candidate was selected after native captures and fresh critics. | Desk remained weaker than the bright county map. The runner is a local solution, not a universal room recipe. |
| [Double R Program](intent-room-double-r.md) | Same Program shape described distributed social attention; a diner adapter derived anchors from existing tuples/rows. Floor/light trials were kept, brighter booth panels rejected. | Final comparison described a modest gain. This report's art verdict is superseded by the vitality pass. |
| [Art/life](intent-room-double-r-art-life.md) and [booth craft](intent-room-double-r-craft.md) | Native static alternatives lost to baseline and were restored. Existing service/sip gestures gained clearer timing and drawing. | Physically coherent specifications and passing geometry tests did not imply a better-looking booth. |
| [Visual-first study](intent-room-double-r-visual-first.md) | Five generated directions and one refinement failed the pre-code visual gate; translation never began. | It tests this constrained bitmap workflow, not the general impossibility of AI pixel art. |
| [Playable booth work](../artifacts/intent-room-double-r-grid/new-pass/review/RESULT.md) | Blind reviewer preferred B refinement; final highlights were restrained. | Local booth improvement remained less apparent in the full frame. |
| [Whole-room vitality](intent-room-double-r-vitality.md) | Service recess, counter planes, seating-state weights and existing gestures changed room-scale reading; route C and focused gates passed. | Accepted visual judgment is not a measured player response. |
| [Temporal stress test](intent-room-double-r-temporal-naturalness.md) | Five entries, three approximately 90-second observations and three returns sampled owner guards, quiet intervals and resumed clocks. | Fresh sessions consistently opened with wipe before sip; wider initial ranges were recommended but not implemented. |

## Architecture that exists

On the research branch, [`copyProgram`](../js/world-engine.js) validates and deeply freezes intent, visual goals, activities, groups, contributions, relationships and ambient residue. [`world-catalog.js`](../js/world-catalog.js) authors Sheriff and diner records. [`double-r-location-production.js`](../js/double-r-location-production.js) derives frozen, non-enumerable `map.layout` anchors from canonical diner geometry. Builder [copies](../js/world-builder-data.js) and [displays](../js/world-builder.js) that metadata; it is not an art solver or editable Program exporter.

Registration validates references. Separate [diner tests](../test/diner-program.js) prove tile adjacency and collision paths around both sides of the island. `NEAR` and `REACHABLE` do not prove sightlines, actor occupancy or visual clearance. [`Room Critic`](../docs/environment-program-room-critic.md) is a review protocol, not a runtime scoring engine. Narrative residue is explicitly rejected; future event-specific traces require a canonical state binding.

Production integration is selective. Commit [`5f094c9`](https://github.com/ember-mind/twin-peaks-game/commit/5f094c9627049e0f4df6e7fc76bea9542aa7c9c4), merged through `ee675c6`, imported the `2a2677e` diner art/life work and `firstDelay`, restored the original checker tint, and excluded Program, its test, CDP harness and Sheriff/Builder changes. Pinned production [`world-engine.js`](https://github.com/ember-mind/twin-peaks-game/blob/7a3de3fd249cc908756a269e116c597bc82f1767/js/world-engine.js) and [`world-catalog.js`](https://github.com/ember-mind/twin-peaks-game/blob/7a3de3fd249cc908756a269e116c597bc82f1767/js/world-catalog.js) contain no Program implementation. Research captures therefore are not current-main acceptance evidence.

## Evidence limits and workflow debts

The [final blind critic](../artifacts/intent-room-double-r-grid/vitality-pass/review/final-blind.md) saw a baseline still but final still **plus** six temporal frames and gesture crop. Its vitality 6.6→8.3 is not a matched temporal comparison; “playable experience” 7.5→8.1 is PNG-only opinion. Scores across separate critics and reference packets are not a calibrated improvement curve. No human playtest establishes lingering, noticed gestures or navigation comfort.

Old [release reports](../artifacts/intent-room-double-r-craft/release-node24-R/report.json) explicitly say `FAIL`: 100/101, with pre-existing narrative M10 drift. Campaign and human fields say `NOT_RUN`; separately documented Chrome results must remain separate. Reported ≈18.9 rAF/s under headless SwiftShader is not player FPS or a zero-cost benchmark. Fresh audit checks of diner Program, Ambient Life and Character Activity passed on Node 26; no full current release or browser certification was performed here.

Temporal [manifests](../artifacts/intent-room-double-r-grid/temporal-naturalness/long/run-1-baseline/manifest.json) record a modified capture harness. The committed [harness](../test/double-r-real-cdp-capture.js) only accepts 30–45 seconds and lacks recorded QA state/re-entry modes: the 90-second protocol cannot be reproduced from committed tooling alone. Preserve the exact harness and commands alongside future evidence.

Repeated crop refinements, increasingly exact prose specifications and broad regression reruns consumed effort before the room-level question was resolved. Existing studies justify an earlier whole-room/native gate and smaller verification sets for rejected concepts. They do not justify deleting failed evidence or claiming measured cost savings.

## Later lobby evidence: historical versus current

Pinned [E8 report](https://github.com/ember-mind/twin-peaks-game/blob/7a3de3fd249cc908756a269e116c597bc82f1767/reports/gauntlet-e8-lobby.md) shows functional hotel planning eventually required approved geometry, cast and connection changes; its spatial rebuild supersedes earlier locked-layout experiments. Its 6.5 temporal score is historical. Later [`82331f7`](https://github.com/ember-mind/twin-peaks-game/commit/82331f7ea1a2ab5d46efc5f0b76554ac4e90ef2c) changed duty cycles and receiving surfaces; [`b2ce836`](https://github.com/ember-mind/twin-peaks-game/commit/b2ce83606d8f50414a809a99471e752537e48094) further revised composition. Both cite new sampled motion evidence; neither assigns a new numerical ambient verdict. Current production status must be assessed from those later sources, not copied from E8's superseded score.

## Earlier reference loops and exact-grid studies

[Roadhouse E3](gauntlet-e3-roadhouse.md) accumulated 16 shared full-scene rounds before the later cap. Some unit bests reached the floor, while later versions regressed and light stayed below it. This is evidence against using an indefinite score chase as the default workflow.

[Red Room E7/E7b](gauntlet-e7-redroom.md) distinguishes art approval from green gameplay gates. Initial floor rounds stalled; an exact triangle-wave/band formula corrected the zigzag and reached 7/10 in one follow-up round. This supports mechanical specs when the error is precisely identifiable. It does not show that aesthetic craft can always be specified numerically.

The [exact-grid manifest](../artifacts/intent-room-double-r-grid/manifest.json) bounds six booth variants to 6–16 changed pixels and records `noWinnerSelected: true`. The [native contact sheet](../artifacts/intent-room-double-r-grid/contact-sheet-native.png) is a controlled local study, not a shipped whole-room improvement. Its construction is useful for fragile contacts after overall composition is settled.

## Visual synthesis from inspected images

The lead inspected Sheriff before/final frames, Double R whole-room comparison and motion sheet, rejected generated booths, exact-grid variants, and historical lobby entry/hall captures.

- **Place logic must reach the image.** The old hotel counter protrudes into the arrival space even though prose calls it wall-anchored. The rebuilt plan makes lounge, reception and the upstairs route more distinct. A wider plan also needs multiple camera checks; plan width alone is not an improvement.
- **Composition operates above props.** Sheriff gains from the directional runner and work-wall grouping. Double R gains from separating service wall, staff surface and public counter. These changes organize existing elements rather than increase their count.
- **Reuse a method, not a visual template.** Sheriff benefits from a directed approach; Double R retains repeated seating and several social pulls. A universal single-focus or anti-repetition rule would erase that distinction.
- **Construction correctness is necessary but insufficient.** Some booth studies clarify supports yet weaken upholstery and native cluster rhythm. Exact-grid variants look very close in the whole room. Both should remain local evidence rather than be counted as a major art result.
- **Time is part of the room's composition.** Service space supports an understandable staff action. Captured owner guards and quiet intervals matter; mutual exclusion of independent activities does not establish naturalness.

Room Program preserves the reasons for choices and gives critics something to test. Actual drawing, placement, camera framing and human response determine whether those choices work. Nothing in the studies establishes a universal beauty algorithm or AAA parity.

## Three next steps, in order

### 1. Make the research repeatable and easy to hand off

Use the proposed one-page brief and finite compare/keep/revert cycle. Align existing critic and visual-bible guidance with distributed/sequential focus, useful repetition and purely aesthetic contributions. Treat legacy Vault prop quotas as context-specific tutor heuristics, not mandatory room rules.

Recover or reconstruct the capture-only QA options recorded in the manifests: 90-second observations, state setup and genuine re-entry. Commit the tool, exact commands and source version with matching baseline/candidate clips. Give one reviewer index to the chosen version, important rejected studies, gates and limitations. No further art or timing changes are needed to do this.

Completion evidence: a fresh checkout can repeat the protocol and a reviewer can distinguish candidate, baseline and mockup without reading the entire history.

### 2. Test the frozen Double R candidate with unfamiliar people

Pin this research comparison to candidate `2a2677e` (the frozen art/runtime also carried by `490b5c4`) and pre-vitality baseline `e567b35`. Prepare equivalent canonical save/state and display settings on both. Current main is a different treatment because it intentionally retained the older floor tint; do not substitute it silently. If the intended target becomes production, declare a new comparison against a pinned production snapshot.

Proposed small formative sample: five people, counterbalanced baseline/candidate order, equivalent state/audio/display and no coaching to admire the room. Let them enter, approach someone, interact and leave. Record first route, corrections, noticed activity and spontaneous pauses. Ask what they remember, why they paused and whether anything felt rehearsed. Treat stated impressions separately from observed actions; do not infer gaze without measuring it.

The candidate is unchanged. Adjust `firstDelay` only if repeated opening behavior becomes a concrete player finding. Longer stays can mean confusion; the debrief must identify the reason. Five people can reveal problems, not establish statistical generality.

Completion evidence: attributable observations, concrete room findings, and a keep/change decision with reasons rather than another universal score.

### 3. Run a bounded transfer test on a contrasting room

First reconcile the accepted Program/inspector foundation with current main through a small reviewed integration and fresh affected gates. Selective art promotion means merging the entire experimental history blindly would be inappropriate. Preserve current production art while integrating metadata ownership checks.

Then give another author the method and approved references for a contrasting small private room, such as Room 315. Use its existing canon and real gameplay requirements. In an isolated study, begin from a playable blockout or saved baseline and declare the plan before detailed art. Reuse existing owners and Program fields; do not add generic systems unless a concrete repeated need appears.

Completion evidence: plan-to-render agreement, actual route and alternate-state evidence, a room-specific composition, recorded iterations/time and independent human review. Room 315 is an existing, previously studied environment: call this a cross-author transfer test, not a clean unseen-room benchmark. A later genuinely new canonical room would be needed to support stronger creation claims.

## Post recommendation

Lead with the misplaced reception and the question **“what does this contribute?”** Show one correction, one failed design and the accepted diner candidate. Explain why a method should produce different room compositions. Keep numerical critic scores out of the headline and distinguish the experimental Program from selectively integrated art.

The linked draft is suitable as an honest development case study now. A stronger post about a validated reusable method should follow the human and transfer tests. Neither the post nor this review publishes externally or changes the frozen candidate.

## Sources and validation for this review

Primary sources are the linked repository reports, code, commits and stored captures. Vault context consulted: [corrected learning path](</Users/ebuccelli/Vault/3. Resources/Game Development/Level Design/Concepts/Level Design Learning Path.md>), [spatial playtest protocol](</Users/ebuccelli/Vault/3. Resources/Game Development/Level Design/Concepts/Spatial Playtest Protocol.md>) and [prop placement notes](</Users/ebuccelli/Vault/3. Resources/Game Development/Level Design/Concepts/Prop Placement and Ecological Coherence.md>). These are internal notes with their own provenance limits, not newly verified academic sources. Continuous playtest and the counterfactual object question carry forward; functional-only quotas do not override the approved contribution principle.

This pass adds documentation only. Independent source audit ran the existing diner Program, Ambient Life and Character Activity tests successfully; documentation links and diff are checked separately. Historic gate results remain historic, with their original failures and limitations. No new gameplay/browser acceptance or human study is claimed.
