# Twin Peaks visual audit (real headless Chrome)

**Build:** `.worktrees/lt-kit-world` (branch `fix/audit-2`), `index.html`, served by `test/lib/chrome-cdp.js`.
**Runs:** desktop 1024x768, and phone 390x844 (DPR 2, `mobile:true`, touch emulation, iPhone UA, `?touch=1`). One Chrome at a time, under `/tmp/lt-chrome.lock`.
**How places were reached:** the title was cleared with real Enter presses and the opening dialogue was drained. After that, `GAME.Engine.loadMap(map, x, y, dir)` placed the player at each door's arrival tile. The arrival tiles come from `GAME.Maps.*.doors`. Two arrivals were also checked by actually walking through the door: Room 315 to the lobby, and the woods to the Red Room. To talk to an NPC, the player was placed on the tile next to them, facing them, and A was pressed. The case file was opened with Esc/B and the notebook with T.
**Covered:** title, intro, opening dialogue, town (9 points), sheriff exterior and interior, Double R exterior and diner, Great Northern lobby and upper hall, Room 315, hospital, Palmer house, woods (south and north), Red Room, traincar (west and east), One Eyed Jacks, Roadhouse, case file, case document, notebook. Also 7 conversations (Bobby, Andy, Log Lady, Audrey, Gerard, Sarah, Laura).
**Console:** both profiles logged only one error, `favicon.ico` 404. No JS exceptions.

**Counts:** P0 0, P1 6, P2 16. No blocker was found. Every location loaded and rendered. The worst defects are characters hidden inside geometry or covering each other, a car drawn on a roof, and a phone title screen that ignores the handheld layout.

Screenshots are in `.audit/shots/visual-tp/` (prefix `desk-` or `phone-`).

## Findings

### 1. P1: After leaving Room 315, Cooper is hidden behind the lobby staircase
- **Where:** Great Northern lobby, arrival tile (16,2) reached by walking out of Room 315's door.
- **What:** Only Cooper's head shows at the top of the stairs, inside the door frame. His body is drawn under the landing and railing.
- **Shots:** `desk-v-hall-from-315.png`, `desk-hotel-gn-hall.png`
- **Fix:** Move the arrival one tile onto the landing floor, or draw the player above the stair and landing layer on that tile.

### 2. P1: A parked car is drawn on top of a shop roof
- **Where:** Town, south of the hospital (loadMap town 23,8, the hospital door's return tile).
- **What:** A white car sits on the red roof of the shop left of the path. Car and roof overlap completely.
- **Shot:** `desk-town-hospital.png`
- **Fix:** Move the car prop off the building footprint, or give it a sort key below the roof.

### 3. P1: When talking from below, Cooper's head covers the NPC's body
- **Where:** Every conversation started from the tile under an NPC: Bobby (town), Andy (sheriff), Log Lady (diner), Gerard (hospital), Sarah (Palmer), Laura (Red Room), Jacques (One Eyed Jacks).
- **What:** Cooper's hair is drawn over the NPC's torso, so the pair reads as one stacked two-headed sprite during the scene.
- **Shots:** `desk-sheriff-talk-andy.png`, `desk-diner-talk-loglady.png`, `desk-hospital-talk-gerard.png`, `desk-palmer-talk-sarah.png`, `desk-redroom-talk-laura.png`, `desk-town-sheriff-lot-talk-bobby.png`, `desk-oej-talk-jacques.png`
- **Fix:** Shorten the vertical overlap, for example by giving the NPC a y-offset or drawing the NPC over the player while they face each other. Another option is to keep a one-tile gap for conversations.

### 4. P1: Hawk is wedged between a desk chair and the desk in the sheriff station
- **Where:** Sheriff interior, arrival 7,10 (Hawk at 12,8).
- **What:** Only his black hair shows between the green chair and the lower desk. When he turns, his face is squeezed between the chair back and the desk top, so he reads as a character inside furniture. Lucy is also cut to a strip of hair and one eye behind the reception counter.
- **Shots:** `desk-sheriff.png`, `desk-sheriff-talk-andy.png`
- **Fix:** Move Hawk to a free floor tile, or give him a proper seated pose. Raise Lucy so her face clears the counter.

### 5. P1: When entering the woods from town, Cooper spawns cut off at the bottom of the screen
- **Where:** Woods, arrival 14,20. This is the real target of the town door at 50,0.
- **What:** The camera clamps to the map bottom. Only Cooper's head is visible at the bottom edge, and his body is off-screen.
- **Shot:** `desk-woods.png`
- **Fix:** Move the arrival tile up one or two rows, or give the woods map a bottom margin so the camera can centre the player.

### 6. P1 (phone): The title and intro screens do not use the handheld layout
- **Where:** Phone 390x844, first load (title) and after the first A press (February 1989 prologue).
- **What:** The canvas sits in the top 45% of the screen and the lower 55% is empty black. The only control, an `A INIZIA` / `A AVANTI` button, is in the top-right corner, away from the thumb. From the first gameplay frame onwards, the shell with its D-pad and A/B buttons appears.
- **Shots:** `phone-00-title.png`, `phone-01-after-start.png`
- **Fix:** Show the handheld shell and its A button from the title screen on, or centre the title vertically and place A where it sits during play.

### 7. P2: Dialogue text uses less than half the box width
- **Where:** Every speaker dialogue, on desktop and phone.
- **What:** Lines wrap at about 25–30 characters and fill only the left 40–45% of the box. Sentences break mid-phrase across pages ("Credevo di essere", "Capelli", "di").
- **Shots:** `desk-palmer-talk-sarah.png`, `desk-sheriff-talk-andy.png`, `desk-hotel-gn-talk-audrey.png`
- **Fix:** Wrap to the actual inner width of the box, from the portrait gutter to the right border.

### 8. P2: The music button overlaps the dialogue box and the notebook frame
- **Where:** Desktop, any dialogue, and the notebook.
- **What:** The round ♪ button sits on the bottom-right corner of the dialogue frame, beside `INVIO · AVANTI`, and on the notebook's border.
- **Shots:** `desk-03-opening-dialogue.png`, `desk-notebook.png`
- **Fix:** Hide the button or move it clear while a dialogue or panel is open, or add bottom and right insets to the panels.

### 9. P2: The prologue box footer sits on its border
- **Where:** Intro "FEBBRAIO, 1989" card, on desktop and phone.
- **What:** `PAG. 1/3` and `INVIO` / `A >` are drawn over the inner bottom frame line.
- **Shots:** `desk-01-after-start.png`, `phone-01-after-start.png`
- **Fix:** Raise the footer baseline by one line or enlarge the card by about 6px.

### 10. P2: The notebook shows one option per page and wastes the panel
- **Where:** Notebook (T or B on touch), during play.
- **What:** `SCELTA 1/5` shows a single row. The other four options are hidden until you scroll, and about 80% of the panel is empty. The two-line objective has almost no line spacing: "Palmer." touches the line above. The notebook also says `Evidenze (0)` while the case file shows collected evidence ("La poesia del fuoco", 1/8), and the two panels use different fonts and styles.
- **Shots:** `desk-notebook.png`, `desk-v-notebook-down2.png`, `desk-menu.png`, `phone-notebook.png`
- **Fix:** List all five choices with the cursor on one, add leading to the objective lines, and make both panels read the same evidence source.

### 11. P2: The desktop title shows two start prompts, one hugging the bottom edge
- **Where:** Desktop title.
- **What:** `PREMI INVIO` and `INVIO INIZIA` are stacked. The second one sits almost on the bottom edge of the viewport.
- **Shot:** `desk-00-title.png`
- **Fix:** Keep a single prompt and centre it in the dark band.

### 12. P2 (phone): The game canvas is wider than the handheld shell
- **Where:** Phone gameplay, all maps.
- **What:** The game view spans the full width (x≈2–778 at 2x) and covers the shell's cream side borders. The shell frame visibly runs under the picture.
- **Shots:** `phone-04-town-start.png`, `phone-diner-talk-loglady.png`
- **Fix:** Size the screen to the shell's inner width, or widen the shell inset to match the canvas.

### 13. P2: Trees are drawn over building roofs
- **Where:** Town. Roadhouse roof beside the Double R (loadMap town 42,22). House roof at the woods edge (town 50,2). Bush over the Roadhouse roof peak (town 47,30).
- **What:** Tree canopies sit on top of the roofs, with the trunk inside the roof area.
- **Shots:** `desk-town-doubler.png`, `desk-town-woods-edge.png`, `desk-town-roadhouse.png`
- **Fix:** Move the tree props off the building footprints, or sort by trunk base rather than drawing the canopy over the roof.

### 14. P2: Placeholder-looking prop on an opaque teal square
- **Where:** Town north, between the path and the railway (town 50,2).
- **What:** A bush sprite is drawn inside a solid mint-teal tile square with a hard edge. It reads as missing transparency or a debug tile.
- **Shot:** `desk-town-woods-edge.png`
- **Fix:** Make the prop's background transparent, or swap in the grass-ground variant.

### 15. P2: Flat teal shadow slabs read as puddles and rectangles
- **Where:** Town, under nearly every prop, tree and building front. The worst cases are a large rectangle behind the bush south-west of the Palmer house and an L-shaped slab bottom-right of the hospital path.
- **What:** The shadows are flat, saturated teal shapes with hard edges instead of darkened ground.
- **Shots:** `desk-town-palmer.png`, `desk-town-hospital.png`, `desk-town-gn.png`
- **Fix:** Render shadows as a darkening multiply at low alpha, and clip or soften the large rectangular ones.

### 16. P2: Ragged streaks on the pharmacy's red roof
- **Where:** Town, pharmacy with the red cross (seen from the Great Northern and hospital paths).
- **What:** The roof's upper edge breaks into stray horizontal pixel streaks that look like a scaling or tiling artifact.
- **Shots:** `desk-town-gn.png` (right edge), `desk-town-hospital.png` (left edge)
- **Fix:** Clean the roof tile's top rows and regenerate the sprite.

### 17. P2: The town pond is built from hard square tiles with a broken right seam
- **Where:** Town, pond south of the sheriff lot (town 12,22). A second pond is north-west of the Great Northern.
- **What:** The water edge steps in whole tiles. On the right side there is a vertical seam: a blue strip, then a grass column, then more water. Flat dark-green rectangles float on the surface.
- **Shots:** `desk-town-sheriff-lot.png`, `desk-town-gn.png`
- **Fix:** Add water edge and corner autotiles, and fix the right-column tile assignment.

### 18. P2: The Roadhouse facade in town looks unfinished
- **Where:** Town, Roadhouse exterior (town 42,22 and 47,30).
- **What:** The windows are hollow dark outline boxes with gaps. A dark smear breaks the right roof corner.
- **Shots:** `desk-town-doubler.png`, `desk-town-roadhouse.png`
- **Fix:** Replace the outline boxes with filled window sprites to match the other storefronts.

### 19. P2: Cemetery headstones stand on bare cream squares
- **Where:** Town, north-east of the Roadhouse by the railway (town 47,30, top of view).
- **What:** Each headstone sits on a light cream tile that does not match the grass around it, which reads as missing ground.
- **Shot:** `desk-town-roadhouse.png`
- **Fix:** Use a grass or earth base tile under the headstones.

### 20. P2: Diner "DAMN GOOD COFFEE" sign is clipped and seated patrons look translucent
- **Where:** Double R diner, arrival 6,8.
- **What:** The right wall lamp's glow and the clock cover the sign, so it reads "...NN / OOD / COFFEE". The two seated booth patrons are washed out and semi-transparent against the booths.
- **Shot:** `desk-diner.png`
- **Fix:** Move the sign or the lamp so the lettering is fully visible, and draw the patrons at full opacity.

### 21. P2: Hard-edged light artifacts in Room 315 and the woods clearing
- **Where:** Room 315, lamp beside the bed. Woods, lit clearing around the pool.
- **What:** In Room 315 the lamp light leaks as stepped yellow rectangles over the wall and floor. In the woods, the light pool is a circle plus hard tile-square patches, with visible square boundaries.
- **Shots:** `desk-room315.png`, `desk-woods.png`
- **Fix:** Clip the lamp glow to a soft radial gradient, and blend the light mask per pixel instead of per tile.

### 22. P2: The traincar area's One Eyed Jacks sign overflows, and the ground looks like placeholder slabs
- **Where:** Traincar, east end (21,1, the OEJ return) and west arrival (1,7).
- **What:** The "ONE EYED JACKS" letters run past the left edge of the sign board. The ground east of the car and around the stream is flat grey and olive blocks, and the path is marked with dark rectangles.
- **Shots:** `desk-traincar-east.png`, `desk-traincar.png`
- **Fix:** Widen the board or shorten the lettering, and texture the ground tiles.

### Other things noticed in the screenshots (lower confidence, not counted)
- **Red Room:** the side lamps and tables near the columns render as faint white ghost outlines (`desk-redroom.png`).
- **Palmer upper floor:** the rug cross has an offset duplicate shadow (`desk-palmer.png`).
- **Roadhouse interior:** Cooper spawns among the chair backs at 7,8, and a black post object with no base floats between the tables (`desk-roadhouse.png`).
- **One Eyed Jacks:** pressing A while facing Jacques from below opened no dialogue (`desk-oej-talk-jacques.png`).
- **`arrival` map:** it renders with a flat untextured mint ground and blocky bush squares (`desk-arrival.png`). No town door leads to it, so players do not see it.
