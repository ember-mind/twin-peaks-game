# lt-graphics — Living Town graphics audit

Chrome could not start in this environment: `test/lib/chrome-cdp.js` and direct headless launches ended with `Chrome startup timed out` (one direct attempt also logged `nice(5) failed: operation not permitted`), so no page screenshot or browser-console sample was possible. Static code/data traces and Node reproductions found two P1 and six P2 defects; no P0, wall/water/river-wall, door, or 1280x800 defect was reproduced. Existing native checks passed (`view-continuity 22/22`, `town 44/44`, `poses 10/10`, `cafe-scene 37/37`), but they do not cover findings below.

## Findings

### 1. P1 — Follow controls overflow on 390px layout

**Severity**: P1 (clearly wrong, visible to any player)

**Where**: `living-town/index.html?world=new`, viewport 390x844; load town and inspect `Follow` controls.

**What**: At 390px, main content width is 338px; stage content width is 308px after border/padding. `#lt-characters` receives one button per actor plus `Whole town` and `The action`. `.group` is a single-row flex container with no wrapping. Buttons therefore extend beyond the stage instead of forming a usable mobile control row. Expected: controls wrap or use a compact/scrollable control that stays inside viewport.

**Evidence**: `index.html:22-34,38-39,180-183`; `lt-observer.js:616-646`. Width arithmetic: `390 - 52px main padding - 2px stage border - 28px stage padding = 308px`; generated follow row contains actor buttons + two fixed buttons.

**Suggested fix**: Add wrapping/overflow behavior to `#lt-characters` (`flex-wrap:wrap` or horizontal scrolling with an explicit max width), or replace actor tabs with a mobile select/list.

### 2. P1 — Café warm-light overlays ignore hour

**Severity**: P1 (clearly wrong, visible to any player)

**Where**: `living-town/index.html?world=new`; follow the café at daytime/noon, then at night.

**What**: Café scene emits the same nine warm-light pools at every simulated hour. Daytime interior still receives fixed pendant, counter, banquette, and wall-lamp overlays; expected lighting should vary with simulated hour, with daylight dominating at noon and warm pools becoming stronger at night.

**Evidence**: `lt-cafe-scene.js:49-65,72-125` calls `kit.warmLight` with fixed strengths and `S.draw` accepts no minute/light argument. Stub render reproduction produced identical calls at both hours:

```text
minute 720:  warmLightCalls=9, alpha=[0.7,0.7,0.8,0.8,0.8,0.85,0.45,0.8,0.6]
minute 1380: warmLightCalls=9, alpha=[0.7,0.7,0.8,0.8,0.8,0.85,0.45,0.8,0.6]
```

`lt-view.js:250-258,417-440` varies room material and applies global daylight, but does not vary these café-local light pools.

**Suggested fix**: Pass current `DayLight`/minute into café scene drawing and scale or suppress warm pools by hour; keep only intentional always-lit fixtures at daytime strength.

### 3. P2 — One reader hides every open book in same outdoor place

**Severity**: P2 (noticeable flaw)

**Where**: Follow a reader in the park while a second open book remains there; same behavior applies to any outdoor location sharing the place.

**What**: `View.prototype.thingsAt` computes one boolean, `readingHere`, then drops every open `book_used` when any character has reading pose. Expected: hide only book instance held by that reader; unrelated open books remain visible.

**Evidence**: `lt-view.js:198-216`, especially `readingHere` and line 213. Minimal reproduction with two open books and one `poseId:'reading'` actor returned:

```text
{"input":2,"output":0,"ids":[]}
```

The test fixture explicitly supports two observable book instances (`content/everyday-opportunities-v01/test/everyday-opportunities.js:197-205`).

**Suggested fix**: Track reader activity target/book instance and filter only that object, or render held-book state per actor without place-wide suppression.

### 4. P2 — Outdoor everyday props use café material

**Severity**: P2 (noticeable flaw)

**Where**: Follow an outdoor character near a book/parcel, or use Whole town where an outdoor prop is visible.

**What**: Outdoor `book_used` and `food_parcel` painters always pass `material: 'lt_cafe'`. Expected: outdoor props use outdoor/town palette and lighting; actual props are drawn with café interior material regardless of location.

**Evidence**: `lt-everyday.js:17-23` hard-codes `{ material: 'lt_cafe' }`; `lt-view.js:219-224` invokes registered painter without location/map context. Painter wrapper reproduction returned:

```text
[{"type":"book_used","state":"closed","material":"lt_cafe"}]
```

**Suggested fix**: Pass location/material context through `drawThing` and select outdoor vs interior prop material at call time.

### 5. P2 — Seated bench pose ignores declared seat coordinates

**Severity**: P2 (noticeable flaw)

**Where**: Follow a character using either park bench; inspect seated position against bench seat/backrest.

**What**: Runtime seating uses a hard-coded position derived from activity object cell, not the bench spot’s declared seat offsets. For the west bench, declared kit seats and runtime positions differ by 8px horizontally and 13px vertically per seat, so seated sprites are displaced from the authored seat line.

**Evidence**: `lt-kit-town.js:89-99` returns `x=obj.x*TILE+TILE+(right?17:0), y=obj.y*TILE+6`. Map data declares `bench_w` at `town.json:743-756`, seats `[24,-7]` and `[41,-7]`. Reproduction for object cell `(12,17)`:

```text
runtime seats: [[208,278],[225,278]]
kit seats:     [[200,265],[217,265]]
```

**Suggested fix**: Resolve seat position from `spots[spotId].seats` (with the object’s actual spot id) and keep sort/depth coordinate separate from sprite anchor.

### 6. P2 — Whole-town name labels clip at map edges and can overlap

**Severity**: P2 (noticeable flaw)

**Where**: Whole town view; follow people at west/east walkable edge cells with long name/intention labels.

**What**: Labels are drawn centered on actor position with no canvas-bound clamp. A long label is cut by the canvas at x=0 or x=47; adjacent labels can still intersect because stack lifting checks fixed 44x20 center boxes, not measured label widths. Expected: labels stay readable inside map or use edge-aware stacking/truncation.

**Evidence**: `lt-view.js:363-375,407-415`. Map contains walkable edge cells on both x=0 and x=47. Geometry reproduction for `MIRA LINDQVIST - SAVE FOR A WINTER COAT` (approx native width 240px):

```text
map x=0: center=8, left=-112
map x=47: center=752, right=872
```

`label()` writes directly at `x0` with no clamp; stack test at line 365 uses only actor-center distance.

**Suggested fix**: Clamp label rectangles/text to map bounds, shorten at edges, and collision-test measured rectangles rather than fixed center distances.

### 7. P2 — Thought/fork bubbles have no edge or collision layout

**Severity**: P2 (noticeable flaw)

**Where**: Follow people near viewport/map edges while a pending choice or fork is shown; also use Whole town with multiple simultaneous bubbles.

**What**: Bubble coordinates are passed directly from actor head positions. Long option text makes bubble width variable, but no bound check or occupied-rectangle layout exists. Bubbles can be cut at edges and overlap neighboring names/bubbles. Expected: fit/wrap/shift bubbles inside canvas and resolve collisions.

**Evidence**: `lt-view.js:533-556` calls `B.draw` at raw head coordinates. `lt-bubbles.js:165-175,186-205` computes `x0=x-w/2` and draws without clamping; fork width grows with option labels at lines 195-201. No bubble collision pass follows `drawBubbles`.

**Suggested fix**: Measure bubble rectangle, clamp/flip/stack it against canvas bounds, and reserve occupied rectangles for labels and other bubbles before drawing.

### 8. P2 — Developer inspector grid overflows narrow mobile card

**Severity**: P2 (noticeable flaw)

**Where**: `living-town/index.html?world=new`, viewport 390x844; open Developer inspector.

**What**: Inspector card inner width is 304px at this viewport (`338px` main column minus 2px border and 32px card padding), but `.grid` requires `minmax(320px, 1fr)`. The grid therefore creates a track wider than its card and horizontal overflow. Expected: inspector panels fit or scroll intentionally within the card.

**Evidence**: `index.html:22-26,68-69,107-112,264-275`; at 390px main column is 338px, inspector content width is 304px, and minimum grid track is 320px.

**Suggested fix**: Use a mobile breakpoint with `minmax(0,1fr)`/single-column layout, or set inspector overflow and make panel width responsive.
