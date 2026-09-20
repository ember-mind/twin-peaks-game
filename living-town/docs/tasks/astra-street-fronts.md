# ASTRA TASK — Living Town: make Via del Ponte a street, and finish what four cold viewers could not name

Graphics only. No simulation, no map, no page work. If you think the map is wrong, stop and say so;
do not repaint around it.

## Base and fence

- Repo `ember-mind/twin-peaks-game`, branch `feat/living-town-foundation`; your base must contain the commit
  titled "Give the street its houses" (check: `git log --oneline | grep "street its houses"`). New branch
  `feat/living-town-street-fronts`. Never push, never touch `main`, stage explicit paths only.
- Write ONLY under `living-town/content/town-places-v01/` (the package Opus delivered: read its `README.md`
  first — API, construction rules, depth rules, the `--check` tool, the honest limits). Do not edit
  `living-town/js/*`, `living-town/index.html`, `living-town/test/*`, or any other package.
- Same house rules as that package: drawn only through the production kit's primitives (`kit.rect`,
  `kit.contactShadow`, its materials), nothing resampled, smoothed or scaled, no external images, no second
  renderer, no lettering of any kind, no Twin Peaks identity, no resident ids, no `Math.random`.
- Headless Chrome: one driver at a time on the machine — `mkdir /tmp/lt-chrome.lock` (retry every 20 s),
  `rmdir` on exit. The package's `tools/capture-gallery.js` already does this.

## What changed under you (already done, do not redo)

The street's collision map in `living-town/js/lt-world.js` now has houses. New legend character `H` = house
front, solid. `LOCATIONS.street.rows` (20×11, tile 16, so 320×176 px; the view shows a 256×192 window):

```
HHHHHHHHHHHHHHHHHHHH   0
HHHHHHHHHHHHHHHHHHHH   1
HHHDDHHHHDDHHHHDDHHH   2   doors: first flat (3–4), flat over the bakery (9–10), café (15–16)
--------------------   3   north pavement
--------------------   4   carriageway
--------------------   5   carriageway
--------------------   6   carriageway
--------------------   7   south pavement
HDDHHHHHDDHHHDDHHDDH   8   doors: second flat's room (1–2), PARK GATE (8–9), attic stair (13–14), ground-floor rooms (17–18)
HHHHHHHHHHHHHHHHHHHH   9
HHHHHHHHHHHHHHHHHHHH   10
```

People appear and disappear at `W.STREET_PORTALS` (the walkable cell in front of each door). `D` cells are
walkable. The package does not know `H`, so today: its own test is red for the street, the view detects
that (`LT.World.blockedCells` vs `LT.TownPlaces.claims`) and falls back to the plain cell painter for the
street only. The park and the homes are still painted by the package.

## Deliverable 1 — the street (this is the task)

Paint the `H` cells as two continuous rows of house fronts, north side seen from the front (rows 0–2, doors
in row 2 opening onto the pavement), south side as the backs/roofs of the buildings nearest the viewer
(rows 8–10) with their doorways and the park gate in row 8. Requirements, in the words of the four critics
whose verdicts are in the package README ("where it stands against the bar") — they all asked for the same
thing and it could not be done before the map allowed it:

- a façade, not a kiosk: wall at least 3 tiles (48 px) tall on the north side, in the café's wall family,
  1 px dark outline, a darker base line and a 2 px cast shadow where wall meets pavement, an eave/roof strip;
- every door taller than a person (a character is ~22 px): the door belongs IN the wall;
- windows between the doors in the café's window style; they may be lit or dark from `opts.minute`
  (the package already does this for home windows and lanterns) — tinting is NOT yours, `LT.DayLight` does it;
- the seven doorways must be tellable apart without lettering: the café's gets the café's teal and an
  awning; the park's is the existing stone-and-iron gate set into a garden wall rather than a house; each
  home gets the same per-home accent its interior already uses (`materialFor('flat_a'..'flat_e')`);
- pavement (rows 3 and 7) vs carriageway (rows 4–6) stay distinct, kerb included; drop the three "drain
  grate" slabs unless they read as grates at native size;
- anything that must cover a person standing in a doorway (lintel, awning, gate piers) goes through
  `drawForeground` with the right depth, exactly as the package's doorways do now.

`LT.TownPlaces.claims('street', rows)` must claim every solid cell exactly once and paint nothing solid on a
walkable cell (doorways and gateways excepted, as now). The package's `test/town-places.js` must go green
again unchanged in intent — extend its expected counts, do not weaken it.

## Deliverable 2 — only if Deliverable 1 passes its critic

From the last critic round, never re-judged after Opus's final fixes: the park benches (were read as crates),
the guitar on its stand in `flat_a` (read as a mop in a bucket), the block under the home window (read as a
radiator or a staircase), the kitchen tower (which appliance?). Re-capture, put them in front of a fresh
critic as they are now, and fix only what still cannot be named.

## Bar and process

Reference: the café as the page renders it (`artifacts/living-town-poses/03-noon-cafe.png`,
`05-evening-cafe.png`). The street passes when a fresh viewer shown the café frame and the street frame side
by side at native 256×192 says (a) same game, (b) "houses along a street, with doors" and can point at the
café and at the park entrance, (c) can tell where a person can walk. Judge with a fresh-context critic that
sees ONLY images and this bar — never your reasoning. At most 4 critic rounds. Report honestly what still
fails when you stop; "the loop ran" is not a pass.

## Done means these commands

```
node living-town/content/town-places-v01/test/town-places.js              # last line N/N, exit 0, street included
node living-town/content/town-places-v01/tools/capture-gallery.js         # regenerates images + manifest
node living-town/content/town-places-v01/tools/capture-gallery.js --check # {"status":"pass","stale":[]}
node living-town/test/run-all.js                                          # unchanged total, exit 0
git status --short                                                        # only living-town/content/town-places-v01/
```

## Report back

Branch, full commit hash, the five outputs' last lines verbatim, the last critic's verdict verbatim and
unedited, what still fails, and any place where the map itself stopped you from drawing what the bar asks.
