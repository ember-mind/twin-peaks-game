# Creating beautiful playable rooms — method v0.1

Status: proposed authoring workflow, distilled from the room studies. This document introduces no runtime feature or new schema. [Evidence review](../reports/room-method-review.md) explains what the studies support and what remains unproven.

Integration context: `environment.program` and its Builder inspector exist on the research branch. Current inspected main selectively received diner art and activity changes; the Program foundation still needs a reviewed integration.

## What we are trying to repeat

A room should communicate a deliberate identity through its space, composition, materials, people and ordinary life. Every meaningful element can contribute through use, gameplay, narrative, character, atmosphere, composition or spatial readability. A purely aesthetic contribution is valid.

Reuse the questions and evidence process. Choose each room's visual answer afresh. A quiet station, a repeated social diner and a lodge lobby should not converge on the same furniture arrangement or lighting recipe.

Keep `environment.program` as authoring intent attached to the existing environment. Geometry, doors, actors, story state, art and animation retain their canonical owners. Working diagrams and visual studies are review artifacts, not another coordinate database.

## One-page room brief

Write this before detailed art; revise it when play or images contradict it. Plain text is enough. Where applicable, express it through existing Program fields.

| Question | Minimum useful answer |
| --- | --- |
| Identity and feeling | What place is this, what should arrival feel like, and what should remain memorable? |
| Ordinary use | Who normally uses it? Where do arrival, work, waiting, storage, service and departure happen? Activities do not assert actor presence. |
| Player task | What must a newcomer understand, approach, interact with and leave through? |
| Composition | Choose one focus, several related social foci, or a sequence of reveals. Name intended first/second reads as hypotheses. |
| Groups | Give important clusters a role, density, silhouette and visual character; refer to canonical anchors when they exist. |
| Visual language | State palette roles, material planes, local light sources, busy/quiet areas, repetition and intended variation. |
| Contributions | Explain selected important or ambiguous elements. Include balance, rhythm, warmth and depth; do not inventory every pixel. |
| Life and state | Identify existing ordinary residue, motion owners, quiet periods and relevant canonical actor/story states. |
| Evidence and budget | Name real camera views, routes, reference, baseline, success conditions and a finite iteration budget. |

For the diner: service counter orients; booths are legitimate parallel social destinations; repeated red modules establish identity; table states provide variation; a clear work surface makes staff action readable. The plant can contribute an organic silhouette and route cue without needing a practical job.

## Small cycle, evaluated throughout

```text
brief and room-use plan
    → playable blockout and actual camera views
    → broad composition and grouped forms
    → material craft and ordinary life
    → compare, walk, observe
    → keep, revert, or return to the failed decision
```

These are working checkpoints, not a rigid waterfall. Walk and inspect each version. A late camera failure may require an earlier layout change; additional detail cannot repair it.

### 1. Plan a place people could occupy

Draw activity areas, public/staff boundaries, important supports and routes before drawing a collection of objects. A reception desk needs an arriving guest side, a work side, an accessible clerk position and a relation to upstairs access. A wall sign cannot make a freestanding counter feel built into the room.

Choose believable arrangements compatible with the game's camera and interaction scale. Decorative objects may create beauty or character; avoid making every object prove practical necessity.

Build the plan through existing canonical geometry tools. If an old footprint prevents the intended room from functioning, record that conflict and revise the canonical plan within the approved scope. Update dependent doors, actor positions and tests together. Widening a map is a design hypothesis; it can worsen camera coverage.

### 2. Prove the plan in the player view

Load blockout with real movement, collision, facing, interactions and doors. Capture normal entrance, each distinct return, and important decision or interaction positions. For a scrolling room, a whole-map drawing is supplementary evidence.

Compare the working diagram with these views: do objects occupy the promised area, does the usable route agree with visible silhouettes, and can the player reach public destinations without crossing staff work? Resolve divergence now. Preserve a labeled plan-to-render comparison in the evidence packet.

### 3. Choose a composition using large shapes

Temporarily ignore papers, cups and texture. Compare the major masses: position, size, contrast, silhouette, material and relationship. Identify what attracts the reviewer's eye; do not call this measured player attention.

Make up to three genuinely different composition thumbnails when direction is uncertain. View each at native resolution, with representative sprites and in the full room. Select on concrete gains: clearer hierarchy, more convincing space, better group balance or more memorable character. Keep the baseline when none wins.

A focus can be distributed. Repetition can establish architecture. Negative space can be generous without becoming empty. All three depend on room intent.

### 4. Resolve craft at the correct scale

Work on planes, thickness, contacts, occlusion, silhouettes, value and material distinctions before incidental detail. Review at native 1× first, integer enlargement second. An isolated attractive furniture crop must also work repeated, occupied, empty and within the room.

Use exact mechanical specifications for exactly diagnosable problems: periodic floor patterns, pixel bounds, supported tabletop objects and draw order. Use visual alternatives and judgment for aesthetic choices. The Red Room formula succeeded as a geometry correction; physically coherent booth specifications still lost aesthetic comparisons.

Generated images can suggest forms. Promote them only after checking native-grid craft, character preservation and full-room context. Label concept images, pasted mockups and real game captures distinctly.

### 5. Compose signs of use and time

Recognize existing mugs, papers, cups, cleared tables, steam and task lamps before adding anything. Ordinary residue may belong to the baseline. Traces of a specific event require existing canonical state; the current Program pilot does not implement narrative residue.

Use existing ambient/activity owners. Judge whether actions are visible, plausible and subordinate to room reading. Allow natural overlaps. Intervene when overlap causes competition, implausibility, synchronized rhythms or lost readability.

Observe short visits, longer stillness and re-entry, including actor absence. A room needs coherent quiet as well as motion. Repeated entry choreography is a hypothesis to test with players; never make non-overlap itself the definition of naturalness.

## Review and acceptance

Keep three reviews distinct:

| Review | Evidence | Decision it can support |
| --- | --- | --- |
| Engineering | Canonical references, collision/door/Cast checks, affected tests and real routes | Room operates and preserves game contracts. |
| Visual and temporal critique | Matched actual frames/clips, reference, native and enlarged views | Reviewers prefer a composition or perceive clearer forms and plausible sampled motion. |
| Player understanding and experience | Unguided tasks, movement observations and debrief from unfamiliar people | People understand use, notice life, remember the place and choose to linger. |

Use equal evidence for baseline and candidate: same camera, state, scale, route, observation length and available views. Seeded comparisons isolate differences; unseeded observations test variation. Record measured wall-time intervals when building sampled videos. Low-rate captures cannot establish smoothness or physical-device performance.

First obtain anonymous baseline/candidate preferences with shuffled labels and matched polish. Then inspect intent and ask room/group/object questions, including: **what is lost if this element disappears?** Aesthetic loss counts. Critics propose; lead reviews; no automatic clutter deletion.

Prefer concrete findings over a universal beauty score. Record target, observation, consequence, next experiment and evidence limit. Any numerical score belongs to that reviewer and packet; do not compare numbers across unrelated rounds as a calibrated metric.

Proposed default experiment budget: at most three initial directions and two refinements of the selected direction. If the same gap survives two refinements, diagnose whether it concerns layout, camera, composition, craft or runtime evidence. Rewrite the hypothesis or stop with the best verified version. This budget is a proposal, not a measured productivity claim.

Use targeted checks during iteration. Broader release and browser checks belong at integration or when shared owners change. Save rejected studies, but promote only the selected coherent version. Repeated testing without a new change or unresolved failure adds little evidence.

## Small deliverable per room

Keep one reviewer entry point containing the brief, canonical plan/anchors, labeled actual views, matched before/after, important states, one temporal comparison where relevant, decisions including reverts, affected gates and unresolved findings. Record source commit and evidence provenance. A short decision log replaces a pile of contradictory final verdicts.

A room is ready for playtest when engineering and perceptual checks support it. Human evidence is required before claiming improved player understanding or engagement. Repeatability remains a research question until another author can follow this method on a contrasting room within the agreed budget.
