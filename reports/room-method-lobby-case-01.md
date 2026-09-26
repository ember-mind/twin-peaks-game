# Room repair, lesson 1 — a hotel, not a collection of hotel objects

Case-study checkpoint, 2026-09-26. Start with the earlier agent-built Great Northern lobby because its mistake is visible: reception and lounge compete with arrival space. This lesson reconstructs existing revisions and explains their decisions; it does **not** claim to have designed a new repair today. Production and the frozen Double R candidate are untouched.

## 1. Look before explaining

![Flawed lobby, normal entrance](../artifacts/room-method-lobby-case/00-baseline-entry.png)

Source: `3929eca907c0b6dff0067d0c3dea41f96f4e8c8a`. Fresh native game capture, 256×192, normal town-entrance spawn `(8,10)`, facing up, narrative adapter enabled with no state override.

The room contains recognizable hotel objects: counter, clerk, sign, fireplace, red chairs, stairs, rugs and luggage. Its problem is their relationship, not their absence.

- The narrow entrance runner finishes below the chairs and table. It visually offers a route into a place occupied by furniture rather than a clear arrival area.
- The reception projects into centre-left public space. A sign behind it does not make the counter feel attached to the room's service edge.
- Hearth, lounge and arrival share the same central column. Resting and moving do not read as distinct activities.
- The stairs form a strong repeated stripe at right. Their visual weight is substantial even when the reception should be easy to find.

These are visual judgments from the frame, not measured eye tracking. A freestanding hotel reception is not inherently wrong. It fails **this** brief when its guest side, work side and circulation relationships become ambiguous.

My inferred old visual flow: entrance → red runner → chairs/fireplace, with stair stripes competing at right → counter discovered off to the left. Intended flow is not a compulsory gaze sequence: entrance → understand reception and upstairs as choices, with a warm lounge available to one side. Human first-look order remains untested.

## 2. Give the whole room an intention

> A warm, established lodge lobby where arriving guests can orient themselves, approach reception, pause by the fire, and reach upstairs without entering staff work.

That sentence combines use and aesthetics. We want welcome, warmth and a recognizable lodge character, not maximum practical efficiency.

### Short authoring brief

This is a design brief, not a new runtime schema or a second coordinate registry. It can later be expressed through the existing research `environment.program`; that implementation is not integrated into this main-based branch.

| Part | Intention |
| --- | --- |
| Arrival | A readable choice between reception, waiting and upstairs. Keep its public path visually quieter than activity groups. |
| Reception group | Counter, clerk, keys/sign, bell and lamp form one service composition. Public approach and staff work side remain distinct. |
| Lounge group | Hearth, two chairs, table and rug form a sheltered warm pocket beside, not across, circulation. |
| Upstairs group | Stair silhouette and runner indicate the actual room-hall connection. No invented painted exit. |
| Material character | Substantial wood and stone, softer red fabric, restrained practical light. Not equally bright outlines everywhere. |
| Visual hierarchy | Reception must be easy to locate; fire may be the strongest warm accent. Do not force both into one numerical “primary focal point.” |
| Busy / quiet | Detail collects in lounge and service groups. The central route supplies separation and breathing room. |
| Ordinary life | Existing furniture, working lights and canonical people. No invented incident or new narrative residue. |

### What do objects contribute?

| Element | What disappears if we remove it? |
| --- | --- |
| Counter with work-side storage | The guest/staff boundary and recognizable service group. |
| Fireplace and stone surround | Warm destination, lodge identity and a substantial balancing mass. |
| Two chairs with shared table | A place to wait or converse, not merely two red shapes. |
| Lounge rug | A visual boundary around the resting group; fabric character against hard floor. |
| Arrival runner | A directional visual link and rhythm distinct from the lounge rug. |
| Plant | Organic silhouette that softens rigid architecture. Aesthetic contribution is sufficient. |
| Bear head | A distinctive silhouette and lodge character. It need not have a practical job or imply a new canonical event. |

This is selective explanation, not mandatory bureaucracy for every pixel.

## 3. Rearrange relationships before adding detail

Concept diagram only; it is not collision geometry and adds no doors:

```text
                    BACK OF LOBBY
   HEARTH             OPEN ROUTE       KEYS / SIGN   STAIRS
   CHAIRS + TABLE                       CLERK         ↑
   LOUNGE RUG                           COUNTER       ↑
                     OPEN ROUTE       GUEST APPROACH
                       ENTRANCE
```

The recorded repair `111f924a6380e09e43c886a212ed7c848078e2e0` widens the room from 18×12 to 20×12 tiles. It moves hearth/lounge west and reception east, relocates luggage near service, and clears the central arrival route. Lobby-side connections, actor tiles, rendered footprints and collision checks move together. Room 315 interior stays unchanged.

![Recorded layout repair, normal entrance](../artifacts/room-method-lobby-case/01-layout-entry.png)

Fresh native capture at the repaired town-entrance spawn `(9,10)`, facing up. Same resolution and narrative setup as the baseline. World position differs because the canonical entrance moved; this compares the equivalent player experience, not the same coordinate in two different plans.

| Decision | Intended gain | Result visible in the frame |
| --- | --- | --- |
| Put reception on service side near stairs | Check-in and upstairs belong to a coherent sequence | Counter/clerk/sign read together at right; public floor remains in front. |
| Move lounge beside circulation | Waiting feels like a destination, not an obstruction | Chairs/table sit on their own left rug; the entrance runner no longer ends in their footprint. |
| Separate large masses | Better group composition and usable negative space | Warm lounge at left balances a service/stair group at right. Central red spine separates them. |
| Add two columns of map width | Space for these relationships | Entrance works better, but the camera cannot show the whole wider room at every position. |

This is a compound historical revision, not a controlled experiment proving which individual change caused preference. It demonstrates a clearer arrangement; it does not establish human comprehension or beauty through a test score.

## 4. The player sees a frame, not our floor plan

Same repaired room, hall-return spawn `(16,2)`, facing down:

![Layout repair, hall return](../artifacts/room-method-lobby-case/02-layout-hall.png)

The left hearth is heavily cropped. A good entrance frame did not guarantee a good return frame. Widening is a hypothesis with a camera cost, not an automatic upgrade.

The next recorded revision, `734215c427cb736ff3161edab0b30b4ea92bc42c`, adds a hotel-only westward camera bias at this return position:

![Recorded framing correction, same hall return](../artifacts/room-method-lobby-case/03-framing-hall.png)

More of the hearth/lounge becomes visible while the stairs remain readable. The frame still leans right and retains strong repeated wall/stair patterns. This is an improvement in coverage, not a declaration that the room is finished.

## 5. What studies contribute to this decision

- **Playable foundations:** The Level Design Book's [Blockout](https://book.leveldesignbook.com/process/blockout) recommends testing foundational shapes in the game. Our 2D adaptation: validate tile routes and inspect actual spawn cameras before polishing props.
- **Grouped composition:** Its [Environment Art](https://book.leveldesignbook.com/process/env-art) discusses related clusters, readability and beginning with large forms. Our application: compose chairs/table/hearth as one pocket rather than spreading hotel props around.
- **Local repository study:** [Great Northern spatial study](../docs/great-northern-lobby-spatial-study.md) records guest/staff relationships and the required coordinated geometry migration. [E8 report](gauntlet-e8-lobby.md) preserves successes, rejected lighting trials and their limits.
- **Vault notes:** [Spatial Playtest Protocol](</Users/ebuccelli/Vault/3. Resources/Game Development/Level Design/Concepts/Spatial Playtest Protocol.md>) distinguishes a visible cue, recognizable silhouette and human understanding. [Prop Placement and Ecological Coherence](</Users/ebuccelli/Vault/3. Resources/Game Development/Level Design/Concepts/Prop Placement and Ecological Coherence.md>) supplies the removal question. Its older functional quota and automatic deletion rule are **not** adopted: our approved principle allows purely aesthetic contribution.

The external book is practitioner guidance; Vault notes include tutor-authored interpretation. Neither is an academic study proving that this lobby is beautiful. Local captures are inspectable project evidence.

## 6. Checks performed now

Tests executed on clean temporary exports of the historical sources, not on a modified production checkout:

| Check | Baseline `3929eca` | Layout `111f924` | Framing `734215c` |
| --- | --- | --- | --- |
| `test/hotel-gn-scene.js` | Pass | Pass | Pass |
| `test/room-315-location.js` | Pass | Pass | Pass |
| `test/world-door-equality.js` | 59 descriptors, pass | 59, approved lobby moves, pass | 59, approved lobby moves, pass |
| `test/smoke.js` | 415/415 | 415/415 | Not rerun |
| `test/walkthrough.js` | 85 acquisitions, finale reached | 85 acquisitions, finale reached | Not rerun |
| Fresh native Chrome capture | Entry pass after one retry | Entry and hall pass | Hall pass |

The first baseline browser attempt timed out at `TP-RETRO-LOADING`; a second identical attempt succeeded. Cause was not established. Failed output was not accepted as visual evidence. Historical Room 315 tests emit an optional scene-install skip warning, then pass location assertions. Node smoke runs emit a localStorage availability warning. No human playtest, real-keyboard walkthrough or new release certification is claimed; the walkthrough above is the existing simulator.

The screenshot harness directly loads each canonical spawn; it does not walk through the entrance unlock. Ambient clocks are live and unpinned. Use these stills for large-shape comparison, not matched temporal judgments. [Manifest and reproduction recipe](../artifacts/room-method-lobby-case/README.md) preserve exact source commits and commands.

The evidence packet passed 34 local PNG-dimension, SHA-256, source-commit and link checks. The four native captures were inspected visually. Documentation, review-page HTML and evidence only were added; no map, art, Cast, registry, Program or runtime file changed. In-app comparison-tab attachment failed, so no successful app-page preview is claimed; the local HTML and native image links remain available.

## Next conversation: one question, not another giant loop

We have recovered a real mistake, defined meaning, and inspected its existing repair. Next study should compare the later current-production room before proposing any **new** change. Focus: does wall/stair contrast overpower the welcome and service groups? Pick one room-scale adjustment, capture matched views, then keep it only if the image improves.

Later chapters can address material craft, source-to-surface light, ordinary life and an unfamiliar player's choices. Do not tune animation or add clutter to solve a massing failure. Stop this first checkpoint here so the user can discuss the evidence before another design decision.
