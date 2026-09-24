# Living Town: visual audit (real headless Chrome)

Checkout `.worktrees/lt-kit-world` (branch fix/audit-2), page `living-town/index.html?world=new&speed=1x`.
Pages were captured at 1280x800 at D1 06:45, 07:30, 08:00, 10:00, 12:30, 16:00, 17:30, 18:05, 20:30, 22:30, D2 02:00, 07:30 and 21:00. At each time all five follow views and the whole town were captured. There were also whole-town frames every 4 to 6 minutes through the walking windows (07:18-07:42, 17:02-17:38, 18:02-18:32, 20:02-20:32). Full-page phone captures at 390x844 were taken at 08:00, 12:30, 17:30 and 22:30. A book was left on the jetty through the page's own "Make something happen" panel to get someone onto the jetty; nobody goes there on their own in two days.
There were no console errors or exceptions in any run.

**Summary.** The worst problem: a person standing on the jetty (row 19) is not drawn at all. Only their bubble is visible, in both the follow view and the whole town. Beyond that, the defects are about placement and depth:
- people stacked in one column, with one hidden
- a person inside a bush
- a barista hidden behind the pastry case
- a sleeper lying across a vertical bed
- whole-town labels that drift away from their people or sit over the wrong door

Lighting has a few oddities: lamps are lit at noon, 17:30 looks the same as noon, and every window is lit at 02:00. On the phone the whole town is too small to read or tap. The right-hand panels contradict the picture in a few small ways. Rooms, poses at benches and booths, and night dimming in the follow view mostly look right.

Screenshots: `.audit/shots/visual-lt/`. The `sheet-d*-*.png` files are contact sheets of the five follow views, in the order Nadia, Teodora, Sanne, Laleh, Mira.

## Findings

1. **P0: a person on the jetty is invisible.** D1 07:30 and 07:48, Laleh (22,19) reading, then talking at the jetty. This happens in the follow view and in the whole town. Laleh's sprite is not drawn at all, only the "read"/"talk" bubble floating over the stone landing. At 07:48 Teodora stands at (22,18) and only her head shows above the river-wall top; her body is covered. The caption says "Laleh · Read — A Winter of Small Repairs", so the followed person is missing from her own view.
   `shots/visual-lt/01-jetty-person-invisible-follow.png`, `01b-jetty-person-invisible-town.png`
   Fix: draw actors after the river-wall/jetty top layer, or depth-sort those tiles by row, so y=18-19 on the landing stays in front of them.

2. **P1: two people in a talk are stacked in one column, one hidden.** D1 08:00, Teodora (22,17) and Mira (22,16) talking on the park path. Mira is directly behind Teodora and only her hair shows. Teodora's talk bubble is painted over Mira's face, and the two bubbles are stacked. The same thing happens in the whole town (07:38), where the label lift pushes "TEODORA — COMPANY" up onto the street, far above anyone.
   `02-park-talk-stacked-and-edge-bubbles.png`, `02b-park-talk-page-1280.png`, `07-town-labels-detached-dawn.png` (third strip)
   Fix: have `meetingCell` place the walker beside the partner (x±1, same row), not above or below them.

3. **P1: the second barista is hidden behind the pastry case.** Café, Sanne at the counter (5,2), every shift frame (D1 12:30, 16:00, 17:30, 18:05). Only the top of her hair and her "work" bubble show above the display case; her face and body are covered. Nadia at (3,2) is fine.
   `03-counter-hidden-and-reader-beside-bench.png` (left half), `sheet-d1-1230.png`
   Fix: move the second counter work spot to a clear cell (e.g. 4,2), or draw the pastry case behind people standing on its row.

4. **P1: a sleeper lies across a vertical bed.** Sanne's flat, 22:30 and 02:00. Her bed runs top to bottom, but the sleeping sprite is horizontal. The head and pillow stick out of the bed's left side and the feet out of the right, lying across the green blanket. The other four flats have horizontal beds and look right.
   `04-sleeper-across-vertical-bed.png`, `sheet-d1-2230.png`
   Fix: rotate or pick a vertical sleeping pose when `obj_bed_c` is vertical, or turn that bed horizontal.

5. **P1: a person is inside a bush.** D1 10:00 park, Mira (19,16) talking with Laleh. Mira's lower half is inside the bush, and the bush is drawn over her from the waist down.
   `05-mira-inside-bush.png`, `sheet-d1-1000.png`
   Fix: mark bush cells as blocked for standing and meeting cells (the collision grid lets people stand there).

6. **P1: on the phone, the whole town can't be read or tapped.** 390x844, Whole town at 12:30. The 768x432 map is shown about 308 px wide (0.4x). Names like "NADIA, TEODORA, SANNE, MIRA" and "LALEH — COMPANY" are about 3 px tall and unreadable. People are about 6 px, which is too small to tap to follow someone.
   `06-phone-whole-town.png`, `06b-phone-whole-town-fullpage.png`
   Fix: on narrow screens, let the town canvas pan horizontally at 1x, or crop it to the street and park band, and raise the label size.

7. **P1: whole-town labels drift away from their people.** 07:38, 17:14-17:26 and 07:48 at the jetty. When two people are close, the label lift raises the label and bubble by 26 px per step but leaves the person where they are. "TEODORA — COMPANY" ends up one to two rows above anyone, sometimes over the street or the fence, so you can't tell whose name is whose.
   `07-town-labels-detached-dawn.png`, `07b-town-labels-dusk.png`, `01b-jetty-person-invisible-town.png`
   Fix: offset stacked labels sideways (left/right of the pair) instead of upward, or draw a leader tick down to the head.

8. **P2: café occupants are named over the wrong door.** Whole town, any time people are in the café (12:30: "NADIA, TEODORA, SANNE, MIRA"). The tag sits over the blue door at the right of the café building, the same door where "SANNE" appears at night when she is home. It doesn't sit over the café's glazed front. The long tag also runs onto the next house.
   `08-town-noon.png`, `07b-town-labels-dusk.png`
   Fix: anchor the café's tag to the café entrance cell and Sanne's flat tag to her own door; wrap or shorten tags with 3+ names ("4 in the café").

9. **P2: lamps are lit at noon, and 17:30 looks like noon.** In the whole town the street lamps show their lit glow at 10:00, 12:30 and 16:00. Measured brightness: 17:30 (which the follow view calls "dusk") is identical to noon (mean 94/112/101 vs 95/113/101, same sky). Dusk only starts to show at 18:05.
   `08-town-noon.png`, `08b-town-1730-same-as-noon.png`, `08c-lamps-lit-noon-dusk-evening.png`
   Fix: switch lamp sprites to unlit during "day", and drive the town tint from the same light phase the follow view reports.

10. **P2: every window is lit at 02:00 while everyone sleeps.** Whole town, D2 02:00 and D1 22:30. All five homes have warm lit windows and the closed, empty café's window glows. Everyone is asleep ("Sleep — bed").
    `09-town-0200-all-windows-lit.png`
    Fix: light a home's window only when someone inside is awake, and unlight the café after closing.

11. **P2: the "— COMPANY" suffix contradicts what people are doing.** In the whole town, nearly every outdoor label reads "NAME — COMPANY", including Laleh resting alone on a bench for three hours and Teodora reading alone. At 20:20 Mira walks out to the café labelled "MIRA — STAY IN". The suffix is the hour's intention (`plan.word`), not what the picture shows.
    `07b-town-labels-dusk.png`, `07c-town-labels-evening.png`
    Fix: drop the suffix from the map label (the bubble already says what they do), or show it only for the selected person.

12. **P2: reading happens standing next to the bench.** D1 12:30 Laleh and 16:00 Teodora read "The Harbour Year" at (30,17). They stand on the grass at the end of the empty east bench, holding the book, instead of sitting on it.
    `03-counter-hidden-and-reader-beside-bench.png` (right half), `sheet-d1-1600.png`
    Fix: when the book lies on a bench, seat the reader on that bench (same path as `sit_and_rest`).

13. **P2: Mira's kitchen is cut and she stands in front of it.** Mira's room (flat_e), D1 06:45 "Eat at home — kitchen counter". Only the top of the kitchen unit is drawn (the fridge top); the stove half that other flats show is missing. Mira stands over where it would be, with her bubble on top.
    `10-flat-c-and-e-morning.png` (right), `10b-flat-e-and-b-evening.png` (left)
    Fix: fit the full kitchen unit in flat_e's layout, or move it one row down so it is not clipped by the wall.

14. **P2: waiting spots put people on top of furniture.** 20:30, Mira "Wait" at (3,4) in her room stands right in front of the table, covering it. 18:05 in the café, Teodora (7,6) stands inside the "OGGI ZUPPA" chalkboard.
    `10b-flat-e-and-b-evening.png`, `12-chalkboard-guitar-doorway.png` (left)
    Fix: exclude furniture and sign cells from idle/wait/talk spots.

15. **P2: café talks happen in the doorway.** In the café, D1 07:30 to 12:30 and D2 07:30, the "wait" and "talk" cells are (3,8)/(4,8), right on the entrance mat and against the lower-left booth. People overlap the booth's table edge, and the three other booths stay empty.
    `11-cafe-waiting-in-doorway.png`, `12-chalkboard-guitar-doorway.png` (right), `sheet-d1-1000.png`
    Fix: route waiting and talking pairs to a free booth or the counter stools, not the door cells.

16. **P2: guitar practice has no pose.** Nadia's flat, 08:00, 20:30 and D2 21:00, "Practise guitar". She stands in front of the guitar stand with a music bubble. The guitar is hidden behind her and she isn't holding it (`poses: []`).
    `12-chalkboard-guitar-doorway.png` (middle), `sheet-d1-0800.png`
    Fix: add a playing pose, or at least hide the stand's guitar and draw it in her hands.

17. **P2: off-screen bubbles are pinned to the edge with nobody under them.** Follow views in the park, e.g. 08:00 Teodora and Laleh, and 07:48 at the jetty. Bare "rest"/"talk" bubbles sit at the left or right edge of the canvas with no person or arrow. They read as stray UI.
    `02-park-talk-stacked-and-edge-bubbles.png`
    Fix: add a small edge arrow and name to off-screen markers, or drop them.

18. **P2: the right panel contradicts the picture.** 08:00, Teodora talking with Mira. The caption reads "Teodora · Talk with" with no name (the one who joined the talk never gets a partner name). "Between them" lists only Nadia, not Mira, whom she is talking to. "Fed 2" shows 30 minutes after the log says "07:26 Teodora ate at home".
    `02b-park-talk-page-1280.png`, `13-phone-panels-fed2-between-them.png`
    Fix: name the conversation partner for `join_conversation`, include current talk partners in Between them, and check what eating at home adds to Fed.

19. **P2: "Walk to" has no destination.** D1 20:08, Nadia walking home from the café. The caption reads "Nadia · Walk to" with nothing after it. On the morning walks it reads "Walk to — Riverside park".
    `14-walk-to-no-destination-page.png`
    Fix: fill the travel target name for home-bound walks (flat ids).

20. **P2: the timeline dots overlap.** Under the canvas at 1280 and 390, by midday and evening. The beat dots on the day strip overlap each other (e.g. 20:08, four pairs touching), so single beats are hard to hit.
    `14-walk-to-no-destination-page.png`, `06-phone-whole-town.png`
    Fix: set a minimum spacing, or merge beats closer than N minutes into one dot with a count.

Not seen as defects: night dimming in flats and the follow-view dawn/dusk tints, benches (seated poses sit correctly), café booth seating (20:30 Sanne), the 1280 layout, and the phone stacking of panels (no horizontal scroll, controls wrap cleanly).
