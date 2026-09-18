# M11 — can `GAME.PROPS_ENABLED` go true in index.html?

Branch `opus/props-m11-production`, cut from `main` (`3fcd79e`). Worktree `.worktrees/m11`.
Not pushed. `index.html` is **unchanged**: the flag is forced on in temp copies only.

**Answer: do not flip.** The prop layer paints a second Roadhouse on top of the one
`js/roadhouse-art.js` already draws, and at the Giant's moment it erases the actor the
scene exists for. Neither is a layer number that can be nudged; both are open work.

## The harness

`test/props-production-chrome.js` — 3 Roadhouse checkpoints × {flag off, flag on},
depth / bodies / cost checks, a contact sheet, evidence under `artifacts/props-m11/`.

It drives **`index.html`**, through `test/act-4-playthrough-probe.html` the way
`test/act-4-playthrough.js` does (the probe loads the production page in an iframe and
reaches into it; it is the only path in this repo that can put the real build into an
act-4 state). Every pixel it captures comes from the production script chain.

The checkpoints are the ones act-4 plays (`playRoadhouse`, `test/act-4-playthrough.js:575-731`),
reached by seeding exactly the state each Cast Presence window reads and walking in:

| checkpoint | window | actors |
| --- | --- | --- |
| `roadhouse-empty` | — | Cooper |
| `roadhouse-gathering` | `ACT4_EVENING_GATHERING` | Cooper + 7 (Truman, Norma, Shelly, Log Lady, James, Bobby, Donna) |
| `roadhouse-giant-stage` | `ACT4_GIANT_STAGE` | Cooper + the Giant |

`sogno_fatto` is in every seed because the classic window `JAMES_NOT_YET`
(`not sogno_fatto`) otherwise holds James offscreen, and two true windows for one
character are a Cast Presence error, never first-match-wins.

### Determinism, and what the off shot proves

`index.html` has no `?freezeMs=` — that is a `test/retro-scene.html` mode, which is why
`props-flag-off.js` and `props-depth-chrome.js` both use that page. So the harness freezes
this page itself: pin `performance.now`/`Date.now` (the neon flickers as a pure function of
`nowMs()`, `js/roadhouse-art.js:653-681`), paint a few frames at that instant with a rising
timestamp, then hand the engine a **constant** timestamp so `js/engine.js:1721`
(`if (now - lastTick < 8) return`) makes `tick()` a no-op and the canvas holds that frame.

What that cannot do is rewind the animation phase the engine carries in state (a walk
frame, a lamp's flicker counter): it advances with `dt`, not with the clock. So instead of
claiming byte-identity the run **measures its own noise floor** — two visits to the
untouched tree, same checkpoint — and requires the flag-off injection to change nothing
beyond it:

| checkpoint | reload noise (same tree, twice) | untouched vs flag-off-injected |
| --- | --- | --- |
| `roadhouse-empty` | 63 px | **72 px** |
| `roadhouse-gathering` | 18 243 px | **1 854 px** |
| `roadhouse-giant-stage` | 63 px | **45 px** |

Both diffs exclude the actor sprite boxes, which is where the phase noise lives. The claim
this evidence supports is "the injected page is indistinguishable from the untouched one to
within the untouched page's own run-to-run variation", **not** "byte-identical": on a page
with seven animated bodies the scenery residual swings by thousands of pixels between
loads (the `roadhouse-gathering` control ranged from 1 800 to 18 243 px across runs), so the
assertion's bound is twice the control plus a floor. Out of 686 000 pixels, the two shots
that matter — `roadhouse-empty` and `roadhouse-giant-stage` — differ by 72 and 45 px.
`cmp` confirms off and on differ on disk. Three trees: `pristine`, `flagoff` (injected
`false`), `flagon` (injected `true`).

## Finding 1 — the props duplicate the room that is already painted

`artifacts/props-m11/roadhouse-empty-{off,on}.png`. The flag-off Roadhouse is not an empty
box: `js/roadhouse-art.js` already paints the neon sign, the booths, the bar, the tables,
the chairs and the double door. Turning the flag on draws the prop set **on top of it**:

- two neon signs, the prop one offset and clipped against the painted one;
- a velvet stage and a piano over the painted back wall;
- red booth sofas over the painted booths, left and right;
- a gold bar segment over the painted bar;
- prop tables and chairs beside the painted tables and chairs, both visible;
- a second double door below the painted one, hanging past the room's wall line.

This is not a depth or layer problem. The prop set was authored to *be* the Roadhouse
furniture (`artifacts/.../world-builder-prop-handoff.md`), and the scene art already is.
One of the two has to go before the flag can be true.

## Finding 2 — the stage erases the Giant

`artifacts/props-m11/roadhouse-giant-stage-{off,on}.png`. Flag off: the Giant stands at the
microphone on the stage. Flag on: `roadhouse-stage-01` is painted over him — **55 % of his
sprite box is repainted by the prop layer**, the microphone with it, and what is left reads
as a curtain, not a character. He is the actor whose scene this is (`m8_giant_stage`).

The numbers say why, and they say it is working as designed:

```
giant   tile 8,1   foot y 32
roadhouse-stage-01  layer 1  anchor foot y 46   ->  prop foot 46 > actor foot 32  ->  prop in front
```

The interleave rule (M10a) is "greater foot y draws in front", and the stage's anchor is
its **downstage edge**, 14 px south of a performer standing upstage on it. So the rule puts
the whole 112×46 velvet frame over him, correctly and fatally.

That is why this one is not a re-layering: layers at or below `ACTOR_LAYER` (6) interleave
by foot, and the only escape hatch is *above* it — "always in front", the wrong direction.
Nothing in the current model says "always behind every actor". Closing it needs either a
below-actors band in `js/props-production.js`, or the stage anchored at its upstage edge
(`ty` ≈ 1.5 rather than 2.875) so its foot sorts behind anyone standing on it. Both are
decisions for the lead; I changed neither, and `world/props.json` is untouched.

## Finding 3 — props stand in front of faces at the gathering

`artifacts/props-m11/roadhouse-gathering-{off,on}.png`. Per actor, the share of its 16×24
sprite box that the prop layer repaints (`roadhouse-gathering-coverage.json`):

```
loglady 82%   cooper 45%   donna 44%   shelly 39%   norma 34%   truman 16%   james 12%   bobby 11%
```

**Read that metric for what it is.** It counts every changed pixel in the actor's box,
and a sprite is transparent around its silhouette — a prop drawn *behind* a character
repaints the background inside the box and scores just as high as one drawn over the
character's face. So the number flags candidates; it does not by itself prove occlusion.
Looking at the crops: the Log Lady, top of the list at 82 %, is still readable — the booth
sofa appears behind her. The Giant, at 55 %, is not there at all. That asymmetry is the
whole point: **coverage ranks, the eye decides**, and the eye says the Giant is the defect.

The pairs the registry marks "prop in front", with their foot numbers, are where to look
next:

```
norma   tile 5,6  foot 112  <-  roadhouse-chair-01  L6  foot 116   chair back at her torso
james   tile 2,4  foot  80  <-  roadhouse-booth-01  L4  foot  98   booth back at his legs
```

`roadhouse-chair-01` is the one I would argue about on taste rather than correctness: 4 px
of foot y (116 against Norma's 112) decide that a chair back covers a standing character,
and the chair reads as *beside* her, not in front. That is a placement question (its `ty`
7.25 against her 6), not only a layer.

Across the whole gathering frame the prop layer changes pixels from x 114 to 857 and y 86
to 607 — the entire room, which is Finding 1 restated in numbers.

## The other checks

**bodies.** One footprint overlap in the whole scene, and it is the one
`tools/world-apply.js` already prints:

```
WARN roadhouse-booth-01: footprint tile roadhouse 2,6 is a Cast Presence body tile (loglady (ACT4_EVENING_GATHERING))
```

No instance footprint touches a door tile or a scene-objects interact tile
(`artifacts/props-m11/footprint-overlaps.json`). **It is not zero — it is one**, and the Log
Lady stands on that tile at the gathering. Her foot y (112) is south of the booth's (98), so
she draws in front of it; the overlap is a shared tile, not an occlusion.

**cost.** 300 frames on the Roadhouse, `performance.now()` around the engine's own rAF
callbacks, headless swiftshader on this Mac:

| | median | p95 |
| --- | --- | --- |
| flag off | 28.6 ms | 29.6 ms |
| flag on | 28.8 ms | 30.1 ms |

**+0.2 ms on the median (+0.7 %), +0.5 ms on p95.** The absolute numbers belong to
swiftshader, which paints this scene far slower than a GPU would; what transfers is the
delta, and the prop layer is not what makes this frame expensive. Cost is not a reason to
refuse the flip.

**depth (the rule itself).** Two pairs where an actor must be in front show prop pixels
inside the actor's core box, both thin slivers at a frame edge
(`cooper`/`roadhouse-table-02`, 3 sampled pixels; `loglady`/`roadhouse-booth-01`, 6).
I am not confident those pixels are actor-opaque rather than sprite margin, so I record
them as measured and do not claim the interleave is broken on that evidence. The
interleave's real problem is Finding 2, where it works exactly as specified.

**runtime.** One assertion fails that is worth the lead's eye: on the production page the
outermost `GAME.sprites.drawStructures` / `drawForegroundStructures` are
`js/traincar-scene.js`'s wrappers, not `js/props-production.js`'s
(`artifacts/props-m11/prop-runtime.json`). Those wrappers do call through for other maps,
and `GAME.Sprites.drawChar` is called once per actor per frame as M10a expects, so the
chain looks intact — but the M10a depth proof was taken on `test/retro-scene.html`, where
the load order differs, and this is the kind of difference that turns a proven mechanism
into an unproven one. Worth one pass before any flip.

## Gates

```
node test/props-registry.js          PROPS-REGISTRY-PASS 12 definitions, 19 instances, 53 checks
node test/props-changeset.js         PROPS-CHANGESET-PASS 47 checks
node test/props-render-order.js      PROPS-RENDER-ORDER-PASS 32 checks
node test/props-flag-off.js          PROPS-FLAG-OFF-PASS 9 checks
node test/props-core.js              PROPS-CORE-PASS 122 checks
node test/smoke.js                   415 controlli superati
node test/walkthrough.js             OK: 85 acquisizioni, finale raggiunto
node test/act-4-playthrough.js       act-4-playthrough: 530/530 assertions passed   (flag off)
<flag-on tree>/test/act-4-playthrough.js  act-4-playthrough: 530/530 assertions passed   (flag on)
node tools/run-release-tests.js --out=/tmp/tp-m11   PASS: 115/115 Node commands
node test/props-production-chrome.js PROPS-PRODUCTION-CHROME 16/22   (the six failures are the findings)
```

One Chrome driver at a time; none left behind.

**act-4 passes 530/530 with the flag ON as well as off** — the prop layer breaks the
picture, not the playthrough. No assertion in act-4 looks at a pixel, which is exactly why
this milestone needed its own harness.

**`test/props-production-chrome.js` exits non-zero (16/22), and that is the finding.** It is an
evidence gate for this decision, not a CI gate: the assertions that fail are Findings 2 and
3 plus the runtime note. It should turn green as part of the work that makes the flip
possible, and only then is it worth adding to `tools/run-release-tests.js`.

## What the flip needs first

1. **Decide what draws the Roadhouse furniture** — the painted art or the prop set. Until
   one is removed, the flag doubles the room.
2. **Give the stage a way to sit behind every actor** — a below-actors band in
   `js/props-production.js`, or re-anchor `roadhouse-stage-01` upstage. Foot numbers:
   stage 46, the Giant 32.
3. **Re-read `roadhouse-chair-01`** against Norma at 5,6 (chair foot 116, her foot 112).
4. **Re-prove M10a's banding on the production page**, not on `test/retro-scene.html`.

## Verdict

**do not flip: the prop set duplicates the painted Roadhouse furniture, and
`roadhouse-stage-01` (foot y 46) draws over the Giant (foot y 32) and erases him at
`m8_giant_stage`.**
