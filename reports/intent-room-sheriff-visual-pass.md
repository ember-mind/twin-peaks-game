# Sheriff’s Station — intent-driven visual pass

## Starting evidence and fixed view

This pass starts from the completed [Environment Program pilot](intent-room-sheriff.md) and its [Room Critic contract](../docs/environment-program-room-critic.md), without changing Program schema or ownership. The production room is a fixed 256×192 viewport: its 16×12 map fits the camera exactly. The normal interior arrival is tile `(7,10)`, facing up. [Before the pilot](../artifacts/intent-room-sheriff/before-native.png) and [current pilot](../artifacts/intent-room-sheriff/after-m2-native.png) are actual native game frames with baseline narrative cast; [Builder inspector](../artifacts/intent-room-sheriff/builder-program.png) is authoring evidence, not a game frame. A fresh native capture from the same spawn visually reproduced the current pilot; two animated pixels varied between captures.

## Phase 1 — player view, before this pass

The player sees a working station immediately: sign, filing bank, public counter, staff desks and people. The central route is readable and invites movement north. At native scale, eye is first caught by the pale, broad county map and ceiling fixtures on the rear wall. The large, near-field rug catches the approach, then repeated desk/cabinet edges distribute attention to both sides. The sheriff desk and amber lamp are identifiable under the map, but not the dominant warm mass. Cast sprites create extra moment-to-moment accents; the art hierarchy must not depend on a particular NPC being present.

```text
ACTUAL VISUAL FLOW
entrance → rug / central aisle → pale county map → repeated side work masses → sheriff desk/lamp

INTENDED VISUAL FLOW (from environment.program)
entrance → quiet, legible aisle and reception threshold → warm sheriff-work cluster
         → records, waiting and shared-work as supporting context
```

The mismatch is not navigation: the aisle remains walkable. It is visual ranking. Map, files and duplicate right desks compete with the intended sheriff-work focal group. The counter is recognisable, but its short return does not yet make a crisp L at native size.

## Phase 2–3 — large masses and focal hierarchy

Ignore mugs, papers and single-pixel accents. Approximate authored bounds and current native-view reading:

| Mass | Size / position | Contrast and silhouette | Role / relationship |
| --- | --- | --- | --- |
| County map and upper wall | Map about 84×32 px, north center; wall spans 224×48 px | Largest pale field, many hard internal edges, bright fixtures at either side | Correct thematic backdrop, but visually outranks desk beneath it. |
| Filing bank | About 64×39 px, northwest | Tall repeated steel drawers and dark separators | Strong institutional counterweight; competes through edge density. |
| Reception and return | Counter about 64×42 px, west middle; 16 px return | Bright steel top above warm oak block; return nearly same value as counter | Public/staff threshold; broad coherent mass, soft corner turn. |
| Sheriff work | Desk about 64×39 px, north center below map | Dark oak and black silhouette, small amber pool | Intended primary warm mass; dark face merges partly with oak wainscot. |
| Shared work | Two roughly 48×29 px desks, east middle/south, plus chairs | Nearly identical contrast and silhouettes, repeated twice | Balances left masses, but creates two equal secondary pulls. |
| Waiting bench | About 48×31 px, southwest | Low green/oak horizontal form | Useful quiet anchor; does not steal focus. |
| Rug and central floor | Rug 58×35 px near entrance; open aisle through center | Rug has low local contrast after M2 but remains a large, near-field rectangle | Provides rhythm; may be unnecessary against existing broad floor values. Test, do not assume. |

Without small details, layout still reads as a station with balanced edges and open circulation. It does **not** yet have a strong single focal hierarchy. On an unpopulated native frame, current art attraction ranks approximately: (1) pale map/fixtures, (2) filing-bank and reception edges, (3) repeated right workstations, (4) sheriff desk/lamp. Player and cast sprites alter momentary attention, but do not repair the underlying ranking.

## Phase 4 — group composition

| Program group | Primary mass / focus | Density, temperature, silhouette | Whole-room reading |
| --- | --- | --- | --- |
| `sheriff-work` | Desk and map backdrop; task lamp | Compact, dark oak with small warm pool; low horizontal desk | Thematically coherent, visually underweighted against its own bright map. |
| `records` | Filing bank; plant breaks steel | Dense, cool, tall repetitive forms | Coherent institutional group, strong left-side weight. |
| `reception` | Counter and return; steel top | Medium density, cool top/warm base, L-shaped intent | Coherent threshold, though short return blends with counter. |
| `waiting` | Bench | Sparse, cool green and oak, low horizontal form | Clear visual rest; keep sparse. |
| `shared-work` | Two desks/chairs | Medium-high density, warm oak/cool green, same silhouette twice | Reads as a work row, but duplication gives two near-equal accents. |

## Phase 5 — local art direction

Keep existing world grammar: integer hard-edged pixel clusters; cool sage/steel institutional base; oak joinery and furniture; one local amber desk lamp; strong dark joints with restrained lit rims; sparse placed wear. Floors and approach remain quiet. Rear wall frames work but should not become brighter than focal furniture. No new global visual system, prop scattering, lore, or atmospheric wash. This derives from [World Visual Bible](../docs/world-visual-bible-v0.1.md) and comparison with the shipped diner, hospital, Room 315 and Sheriff frames.

## Phase 6 — prioritized experiments, before code changes

1. **Protect central negative space.** Problem: near-field rug and explicit seams compete with intended empty approach. Evidence: current native frame, original Sheriff native golden’s quiet center, and comparison rooms’ restrained floor seams. Smallest interventions, tested separately: omit rug drawing; consider lowering floor-seam contrast. Expected: stronger visual rest and clearer route to rear work. Risk: floor may feel flat; revert either intervention if hierarchy or rhythm worsens.
2. **Rebalance map and desk.** Problem: pale county map outranks sheriff work. Evidence: map is broader/brighter than desk in same north-center stack; current Program names desk warm primary focus. Smallest intervention: adjust map field and desk face values locally, in separate render/compare steps, without expanding lamp beyond practical source. Expected: map and desk read as one work vignette, desk leads. Risk: map legibility or evening light character could weaken.
3. **Quiet and distinguish one shared-work desk.** Problem: two identical right workstations act as equal secondary foci. Evidence: same art helper is called twice. Smallest intervention: one authored value or silhouette variation, no new prop. Expected: right side remains functional but reads as supporting rhythm. Risk: right side may become too empty or visually imbalanced.
4. **Clarify reception return only if still worthwhile after larger changes.** Problem: corner turn is soft. Evidence: current native frame and existing Room Critic. Smallest intervention: local edge/material separation. Expected: L-shaped public threshold reads faster. Risk: contrast could pull attention left; reject if it competes with sheriff work.

Each experiment must be captured from the same player view, judged at 256×192, and retained only if it improves the room. No tiny-prop solution to a big-shape problem.

## Iteration log

### 1. Remove old broad rug — KEEP as replacement step

[Native frame after rug removal](../artifacts/intent-room-sheriff/visual-pass/experiment-1-no-rug.png). Removing the old wide, outlined rectangle initially made circulation clearer. Targeted Sheriff native, location, door, and ambient tests passed. Independent PNG-only review later found this **too empty** against the original. The old rug stays removed, but the empty-floor-only result was superseded by a narrower directional runner below. This revises the pilot critic's earlier “keep muted rug” recommendation based on actual new captures, rather than silently treating that recommendation as still current.

### 2. Moderate county-map paper value — KEEP, modest

[Native frame with quieter map](../artifacts/intent-room-sheriff/visual-pass/experiment-2-map-muted.png). One broad paper field changes from pale cream to a warm mid-cream; the 1px rim drops one existing paper value. County shapes, river, frame and story meaning remain legible. At native size, map still reads first, but no longer flares quite as strongly over the desk. This helps the rear cluster rather than finishing the hierarchy by itself. No footprint, wall geometry, collision or lighting-source change.

### 3. Brighten one sheriff-desk top strip — REVERT

[Native experiment](../artifacts/intent-room-sheriff/visual-pass/experiment-3-desk-top.png). Raising one 56×6 px desk plane from `oak` to `oakMid` barely changes the native frame because existing detail and lamp pool occupy much of it. It does not alter the focal ranking. Reverted instead of accumulating a technically compliant but visually ineffective tweak.

### 4. Quiet south shared-work desk — REVERT

[Native experiment](../artifacts/intent-room-sheriff/visual-pass/experiment-4-south-desk-quiet.png). A darker 44×5 px top and softer 40×2 px rim barely distinguish the two desks at native resolution. The added helper variant is not justified by the visible result, so it was reverted. Shared-work repetition remains a critic finding, but smaller colour edits are not the remedy.

### 5. Frame rear sheriff-work bay — KEEP

[Native frame with work-wall panel](../artifacts/intent-room-sheriff/visual-pass/experiment-5-work-bay.png). A recessed 80×11 px oak panel aligns beneath the existing county map and behind the existing desk/lamp. This is architectural grouping, not an extra prop or light source. At native size, it makes map, lamp and desk feel like one intentional work wall, and the amber lamp has a calmer dark ground. No footprint or collision changed.

### 6. Remove full-field floor seams — REVERT

[Native experiment](../artifacts/intent-room-sheriff/visual-pass/experiment-6-no-grid.png). Broad value patches alone make the floor too flat and weaken furniture grounding at native size. Restoring the 1px seams preserves the linoleum reading while the rug removal keeps the central route quiet. The art-direction audit correctly identified the grid as a watch point, but complete removal is not an improvement.

### 7. Dark vertical runner — REJECT FIRST VALUE

[Native experiment](../artifacts/intent-room-sheriff/visual-pass/experiment-7-runner.png). Replacing the old wide rug with a narrow north–south runner gives the room a clear approach axis, but its original dark field becomes the new floor focal point. Geometry was useful; value was not.

### 8. Lighter runner — KEEP geometry, refine edge

[Native experiment](../artifacts/intent-room-sheriff/visual-pass/experiment-8-runner-light.png). A light sage field makes the axis secondary to the room. A fresh PNG-only critic ranked it above both original and pilot, but only narrowly; its textile edge was ambiguous at native resolution. A mid-room player capture confirmed the runner stays beneath the sprite without occlusion.

### 9. Thin dark edge around light runner — KEEP final candidate

[Native final candidate](../artifacts/intent-room-sheriff/visual-pass/experiment-9-runner-edge.png). Only the runner's 2px outer band becomes dark sage; its broad interior remains quiet. The border makes it read as an authored floor element, not a blank painted stripe, without restoring the old horizontal board-like focus or adding internal decoration. Side floor remains negative space and main aisle stays fully walkable.

## Final player-camera comparison

All three frames use `sheriff`, spawn `(7,10)`, facing `up`, baseline narrative cast, and native 256×192 pixels. Tiny differences in ambient animation timing can affect two or three pixels between otherwise identical captures.

| Stage | Real native frame | SHA-256 |
| --- | --- | --- |
| Before pilot | [before-native.png](../artifacts/intent-room-sheriff/before-native.png) | `5c0cebfde4c21976ba3f95e4224283a3a3b92ae05b5f275beedf8b3b0ff495b4` |
| Current M1–M4 pilot | [after-m2-native.png](../artifacts/intent-room-sheriff/after-m2-native.png) | `691b2bb39484bab897887f00319fe34a5857a2f93e0fa5acceb681b556fde2ee` |
| Final visual pass | [final-native.png](../artifacts/intent-room-sheriff/visual-pass/final-native.png) | `96c70ba41c73d577c29213fefb35044efaeb8018ee46b061993dd05cbf23f216` |

```text
BEFORE: entrance → wide, dark central rug → pale county map → side cabinets/desks → sheriff desk
AFTER:  entrance → narrow entry runner → county-map / sheriff-work bay → reception and edge work
```

The map still has the broadest pale field; the desk/lamp are not an absolute first-read focal point. The gain is a coherent route and work-wall stack: floor mass now points toward the intended north-center activity instead of forming a separate horizontal object. Side-floor negative space remains useful for visual rest, group separation, and four-tile central circulation. [Mid-room native view](../artifacts/intent-room-sheriff/visual-pass/player-midroom.png) checks that the player remains readable on the runner at `(7,7)`.

## Room Critic, final candidate

| Level / target | Observation and why it matters | Decision / next change |
| --- | --- | --- |
| ROOM / identity | Sign, records, reception and staff work still read as a lived-in small-town station; no event-shaped clutter added. | Keep. |
| ROOM / massing and eye flow | Narrow runner gives near-to-far axis; recessed work wall groups map, desk and lamp. Better than old wide floor board and empty-floor experiment. | Keep; do not widen runner. |
| ROOM / focal hierarchy | Sheriff-work is more coherent, but bright map and repeated side edges still rival small lamp at 256×192. | Future art pass may strengthen desk without another room-wide light wash. |
| ROOM / negative space/navigation | Quiet floor on both sides of runner frames movement and group separation. Main aisle remains connected and cast sprites stay readable. | Protect. |
| GROUP / reception | Counter communicates visitor threshold; return edge remains a little soft. Stronger left contrast could compete with sheriff-work. | Defer small edge change, not current bottleneck. |
| GROUP / shared-work | Two identical right desks repeat, but a subtle recolour was invisible at native size. | Defer until a justified silhouette/role change; no decorative prop. |
| GROUP / waiting and records | Bench gives low quiet southwest mass; plant breaks file-bank steel repetition. Removing either would weaken balance or warmth. | Keep. |
| OBJECT / runner | Removing it made center feel under-dressed in independent PNG review; old broad rug instead stole focus. Current narrow form contributes eye flow and scale, not practical function. | Keep. Endpoint transition still slightly abrupt. |

The previous pilot's “keep muted rug” recommendation is superseded by this capture-led finding, not erased from its historical report. Static PNGs cannot prove ambient timing; Ambient Life tests remain the evidence for motion.

## Independent reviews and architecture boundary

First fresh PNG-only review preferred the original over the empty-floor candidate. Response: test a narrow directional runner instead of declaring empty space automatically better. Second and final fresh PNG-only reviews ranked the runner candidates above the pilot; final reviewer called the thin-edge version materially better than original and pilot, while flagging runner endpoints as a remaining gap. Main art review agrees on clearer eye flow but keeps warm-focus only partially met.

Hostile code review found no changed map rows, collision, doors or cast. It raised pre-existing duplicated footprint IDs between scene and art; the native test now checks art prop IDs, occupied cells and south-edge depth against the scene-owned layout. It also flagged the prior rug recommendation as stale; this report explains the new evidence and replacement. No Program schema, World Engine state, registry, render lifecycle, or new prop system changed.

## Gate status

| Gate | Result | Evidence / note |
| --- | --- | --- |
| CI-pinned Node 24 release suite | 99/100 PASS | [Run report](../artifacts/intent-room-sheriff/visual-pass/release-node24/report.json); sole failure is `test/narrative-validate-m10.js` on four verbatim narrative keys. Same failure exists on unmodified main and predates this visual pass. |
| Sheriff native, location, door, ambient | PASS | Included in Node 24 suite. Native test now also catches drift between art prop IDs/cells/depth and scene-owned footprints. |
| World Engine, Cast Continuity, Ambient Life, connections, smoke, walkthrough | PASS | Included in Node 24 suite, including `world-door-equality`. |
| World Builder browser | 194/194 PASS | Read-only Program inspection and existing Builder flows still work. |
| Act 3 Chrome playthrough | 189/189 PASS | Normal gameplay, including station/cast and route checks. |
| Act 4 Chrome playthrough, all paths | 530/530 PASS | All four paths reach the station and exercise Truman's scene. One harmless test-server `favicon.ico` 404 appears in browser console. |
| Source/diff integrity | PASS | Only Sheriff art, native art test, reports, and new visual-pass evidence changed. No map rows, collision, door registry, Cast Presence, or Program schema changed. Regenerated tracked test artifacts were restored. |

**Verdict: YES, a material compositional improvement, with a clear limit.** The room's near-field mass no longer competes horizontally with work furniture; its narrow runner and rear work-wall panel give entrance-to-desk direction and stronger group cohesion. Fresh PNG-only review ranked the final frame above both the original and M1–M4 pilot. This does **not** claim the warm sheriff desk is now the single strongest first-read focal point: the county map remains brighter and broader. That remaining hierarchy gap belongs to a later, separately judged art pass, not another metadata layer.
