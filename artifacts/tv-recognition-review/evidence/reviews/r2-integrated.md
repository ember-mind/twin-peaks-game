# Integrated TV-location visual audit — round 2

**Verdict: BAR_WINS.** The floor is 8/10 per location; only the Red Room clears it (1 of 12). Scores stay per unit, with no aggregate hiding weak scenes. All twelve physical locations now have reference support; source-specific confidence limits are noted below.

## Evidence and limits

- Main images are 256×192 production `index.html` renders at source commit `7a3de3fd249cc908756a269e116c597bc82f1767`. The capture record says these are diagnostic placements at verified walkable cells, not proven campaign routes; the ambient phase was not frozen. This review makes no temporal claims.
- Palmer day and evening are listed separately because both captures were requested; they show the same underlying room design and receive the same identity score.
- Scores judge scene identity from shape, materials, palette, and object relationships. Location lettering and cast recognition are excluded.
- Reference limits affect confidence: the sheriff image is a reception subset; Room 315 has one dark low-angle broadcast frame; the Red Room frame’s exact episode is unverified. Those frames support only the visible design cues, not unseen room geometry.
- `reference/hotel-pilot-exterior.jpg` is now verified as the actual Pilot establishing frame, as documented in the appended assessment. My earlier suspicion that it showed Kiana/Blue Pine Lodge is retracted: it came from the wrong MovieMaps parent `/images/kx`; the corrected `/images/kxw` identifies that older image as Salish/Audrey.

## Main captures

| View | Identity | Confidence | Strongest retained clue | Biggest gap | Smallest justified next change |
|---|---:|---|---|---|---|
| Diner | 7/10 | Medium | Warm red-and-cream checker floor, red booths, and the long pie/coffee service zone form a credible small-town diner. | The Double R set’s counter and display case have a stronger, more specific material and focal arrangement than this generic top-down diner. | Enlarge the pie case as the focal fixture on the service counter. |
| Sheriff station interior | 5.5/10 | Low | Wood trim, a town map, and clustered service desks suggest a working civic office. | The visible reception reference is defined by its framed service opening and planter-filled vestibule; the render reads as a generic office instead. | Turn one rear wall stretch into a wood-framed reception opening. |
| Palmer home — day | 4.5/10 | Medium | Warm wood surfaces and a carpeted central zone retain a period domestic feel. | The pilot room’s sitting group and Laura portrait are not legible as the room’s focal relationship here. | Promote the existing framed portrait into a clearly readable console focal prop. |
| Palmer home — evening capture | 4.5/10 | Medium | Same retained domestic wood-and-carpet cues as the day capture. | Same gap as the day capture; the image does not establish a separate TV-specific room identity. | Same as day: make the framed portrait readable at a glance. |
| Great Northern lobby | 6.5/10 | Medium-high | The red patterned runner, fireplace zone, timber interior, and staircase establish a substantial lodge lobby. | The reference’s totem-carved reception fascia and massive stone hearth are much more distinctive than the current small flame panel and plain desk. | Replace the small flame panel with a broad stone hearth. |
| Room 315 | 3.5/10 | Low | A mountain-facing window and hotel furnishings establish a hotel room, but not this one. | The one dark, low-angle broadcast view shows deep horizontal timber paneling across walls and sloped ceiling; that dark plank material is absent from the bright green-carpeted render. | Give the main wall band the deep plank treatment visible in the broadcast frame. |
| Red Room | 8.5/10 | Medium | The red curtain wall and high-contrast zigzag floor preserve the room’s signature grammar even in top-down compression. | The heavy dark armchairs read as small low blocks rather than the bulky upholstered forms in the reference. | Make the dark armchairs larger and more clearly arm-shaped. |
| One Eyed Jacks | 6.5/10 | Medium-high | Green gaming tables against a long bar and red wall treatment preserve the casino-bar relationship. | The current magenta fields overpower the dark timber, amber light, and velvet material grammar in the episode references. | Recolor the large magenta fields toward dark wood and warm amber while keeping green felt as the accent. |
| Roadhouse | 5.5/10 | Medium | The table cluster and rear service zone preserve the tavern use of the room. | It reads as a bright red lounge; the reference is a dark timber roadhouse with a cavernous upper rail and hanging lights. | Add one dark timber balcony/beam rail along the far edge. |
| Double R exterior | 6.5/10 | Medium-high | The low, wide storefront, red trim, broad windows, and forecourt carry the roadside diner silhouette. | Its roadside sign lacks the tall stacked neon silhouette and broad café panel that dominate the pilot exterior. | Make the existing roadside sign a taller stacked oval-and-panel silhouette. |
| Sheriff station exterior | 5.5/10 | Medium-high | Flat canopy, central glazed entry, and forest-edge setting retain the broad civic-building read. | The pilot exterior’s low stone seal marker is a strong site-specific object, and no equivalent anchors this forecourt. | Add a low stone seal marker in front of the entrance. |
| Grove | 6.5/10 | Medium | Dense conifers enclosing a central clearing retain the episode’s forest-site composition. | The render turns the small disturbed-earth center into a constructed stone ring with strong cardinal markers not supported by the supplied view. | Replace the hard stone rim with a small bare, needle-covered depression. |
| Great Northern exterior | 4/10 | Medium-high | Dark timber façade with long window rows and surrounding evergreens. | The Pilot frame’s defining cliff-and-waterfall setting is absent, so the render reads as a small roadside lodge in a clearing. | Place the hotel above a visible rocky cliff and waterfall. |

## Existing candidate images

These are separate diagnostic captures from different source commits; they are not assumed to be merged or shipped. Verdicts address TV-specific recognition, not composition quality.

| Candidate | Versus main | Recognition basis |
|---|---|---|
| Palmer day (`9ef70a4`) | **Worse** | The broad green treatment pulls the room farther from the warm, muted family-room palette in the pilot references; it adds no more legible room-specific prop. |
| Diner (`33a45d7`) | **Worse** | The candidate changes the large checker-floor field toward green, while the supplied Double R interior shows a warm red/cream floor and red counter fronts. Cleaner staging does not offset that loss of material match. |
| Sheriff (`cfdc0c7`) | **Same** | The office’s TV-specific reception cues do not change in a meaningful way; no reception opening or other source-specific feature is added. |
| Hotel lobby (`9ad365e`) | **Same** | The runner, hearth, desk, and stairs remain materially the same; the reference’s distinctive carved fascia and stone hearth are still missing. |

## Three repair priorities

1. **Room 315 — 3.5/10.** Re-establish the dark sloped timber material visible in the only supplied frame; keep the low confidence tied to the single-angle evidence.
2. **Palmer home — 4.5/10.** Make the framed Laura portrait the readable room focal prop so the interior stops reading as a generic paneled parlor.
3. **Sheriff exterior — 5.5/10.** Add the observed stone seal marker to anchor the otherwise generic office façade to the pilot exterior.

The Roadhouse is next in line at 5.5/10: its timber rail/light grammar remains weak, but the three priorities above have more direct, compact source-matched cues to restore.

## Source-corrected Great Northern exterior assessment

The corrected reference is the [Pilot establishing frame](https://twinpeaksblog.com/2018/06/07/setting-the-stage-the-great-northern-hotel-exteriors/) ([direct image](https://www.twinpeaksblog.com/wp-content/uploads/2018/06/01_TPB_SetStage_GNH_1000_GNHExtFalls01.jpg)); it shows the Great Northern above Snoqualmie Falls. Comparing it with [`main/great-northern-exterior.png`](../main/great-northern-exterior.png), the render keeps a timber hotel façade, long window rows, and surrounding evergreens, but the building reads as a small roadside lodge in a green clearing.

**Identity: 4/10 (medium-high confidence).** Biggest gap: the establishing view’s defining cliff-and-waterfall relationship is absent, so the composition loses the Great Northern’s distinctive site identity. This score is reflected in the main matrix; other scores remain unchanged.
