# Deep — ambient life 01: three animated details

Branch: `deep/ambient-life-01`, created from `origin/main` by name.

```
$ git fetch origin && git checkout -b deep/ambient-life-01 origin/main
$ git log --oneline -1
374b5a0 Log canonical sync for opus/world-builder-m9-props
```

`git rev-parse origin/main` = `374b5a05ea82f56a431beeacbc890ee35d8ff26b` — the same commit,
so the branch is the real `origin/main` head, not a local branch.

Work ran in an isolated worktree (`.worktrees/deep`) because the shared checkout was
mid‑integration on `integ/playable-01` with unrelated dirty files and a live Act‑4 Chrome.
Part 1 commit: `7042ca88beacf92e42d3214fe6421e06b6d00a77` (branch `deep/m4-loglady-optional`).
Part 2 commit: `d67b6f1004ff49421e49a536a517c93c73264aa0` (this report is its child commit).

## What each detail is, where it lives, and why

Every detail is one pure function of time `t` (milliseconds from the pinned clock:
`performance.now()`, which `?freezeMs` freezes). No randomness, no bodies, no map rows.

| scene | function | file | named rectangle (native px) | animated px |
|---|---|---|---|---|
| Double R | `dinerCupSteam(g,cx,cy,t)` | `js/ambient-life-scenes.js` | x 111–115, y 39–47 | 7 |
| Roadhouse | `neonFlicker(R,t)` | `js/roadhouse-art.js` | x 28–55, y 20–27 | 56 |
| Red Room | `curtainBreath(R,t)` + `floorColor(x,y,off)` | `js/redroom-art.js` | x 112–127, y 68–71 | 16 |

### 1. Double R — steam off one counter cup (`dinerCupSteam`)

A cup already exists in the art: `drawDinerCounter` places `interiorCup(g, counterX+75,
counterY-3, p)` (`js/retro-authored.js:4665`) with the counter model `[2,3,9]` from
`js/maps.js` (`diner.interior`), i.e. world `(107,45)`. That is the **second** counter cup,
so the `counter-coffee` ambient steam already registered on the first cup is left untouched.
Six-frame loop (`floor(t/300) % 6`, 1800 ms period) of 2–3 one-pixel wisps rising 1–7 px above
the rim, in the diner palette's muted warm-greys `#cfbc92` (`creamShade`) and `#898b75` (`tile`).
Wired by wrapping `GAME.sprites.drawStructures` for `map.id === 'diner'`.

**Why here:** the Double R has **no `-art.js`**; its interior pixels live in
`js/retro-authored.js`, and its ambient loop (`life.register('diner', …)`) is registered in
`js/ambient-life-scenes.js`. So the diner's detail function lives there too and hooks the same
pass the interior already draws through (`js/retro-authored.js:4990` is called from
`js/engine.js:969`).

### 2. Roadhouse — neon sign flicker (`neonFlicker`)

Irregular two-state bright/dim schedule — bright 1400 ms, dim 90 ms, bright 700 ms, dim 60 ms,
looped — ordered so `freezeMs=1000` lands in the long bright hold (the sign then renders
byte-identically to a tree without the detail, which is what `test/props-flag-off.js` compares
against `main`). Dim is the authored sign colour 70 % toward the wall behind it:
`blendToward(palette.neonHi, palette.walnutDeep, .7)` = `#6e3930`. Never off.

**Why here:** the sign's pixels and its palette live in `js/roadhouse-art.js` (`drawNeon`), and
`RoadhouseScene` hands the whole map to `RoadhouseArt.draw`, so the loop belongs there.
Bounded to the sign's four mountain-peak rects (`[28,24,4,3] [32,20,4,4] [48,20,4,4]
[52,24,4,3]` = 56 px) — the restraint rule's "reduce it", keeping the animated budget under 60
while the existing `roadhouse-neon` ambient still carries the broader glow.

### 3. Red Room — curtains breathe (`curtainBreath`)

`floorColor(x,y,off)` now takes the breathe offset (default `0`, so the static formula and every
existing floor assertion are unchanged): `v = abs((x mod 16) - 8)`,
`band = floor((y + v + off) / 4) mod 2`, `off = round(sin(2π·t/3200)) ∈ {-1,0,1}`. The offset is
applied inside one named 16×4 floor patch (112,68). The default `floor(R)` still paints `off=0`.

**Why here:** the zigzag formula is `js/redroom-art.js:floorColor`, and `RedRoomScene` gives the
map to `RedRoomArt.draw`, so the function lives in the same module. Nothing else in the detail
moves: no bodies, no props, no other room element (16 animated px rest lightly on the existing
Red Room ambient).

`js/ambient-life.js` was authorised but **not needed** and is untouched.

## Tests

New: `test/ambient-life-frames.js` (node, no Chrome). Renders each scene's real draw at
`t = 0, 500, 1000, 1600` through the repo's headless path (real modules, a pixel-recording 2D
context, a stubbed clock) and asserts (a) the four frames are not all identical, (b) every
changed pixel stays inside the detail's named rectangle (constants from the art coordinates),
(c) ≤ 60 animated pixels. Output:

```
  diner: 7 animated px, inside {"xMin":111,"xMax":115,"yMin":39,"yMax":47}, 4 distinct frames
  roadhouse: 56 animated px, inside {"xMin":28,"xMax":55,"yMin":20,"yMax":27}, 2 distinct frames
  redroom: 16 animated px, inside {"xMin":112,"xMax":127,"yMin":68,"yMax":71}, 2 distinct frames
AMBIENT-LIFE-FRAMES-PASS deterministic t, bounded rectangles, <=60 animated pixels per scene
```

Note: the details are two-state/quantised, so a fourth *distinct* frame is impossible for the
neon and the breathe; the test asserts "not all identical" for those, as the spec allows.

## Gates — output verbatim

```
smoke:               415 controlli superati ✔
walkthrough:         OK: cammino completo simulato, 85 acquisizioni, finale raggiunto ✔
retro-production:    RETRO-PROD-PASS 54/54
mobile-production:   MOBILE-PROD-PASS 20/20
props-flag-off:      PROPS-FLAG-OFF-PASS 9 checks, roadhouse 7,6 up, 14388 byte shot
ambient-life-frames: AMBIENT-LIFE-FRAMES-PASS deterministic t, bounded rectangles, <=60 animated pixels per scene
act-4-playthrough:   act-4-playthrough: 530/530 assertions passed
                     console errors: 1   (favicon.ico 404 from the test http server — benign)
```

Extra regressions, all green (unchanged expected counts): `test/ambient-life.js`
(`AMBIENT-LIFE-PASS` / `AMBIENT-ORGANIC-PASS`), `test/redroom-scene.js` (`Red Room scene PASS`),
`test/diner-layout.js` (`DINER-LAYOUT-PASS`), `test/sheriffs-station-ambient.js`,
`test/graphic-pass-contract.js` `14/14`, `test/environment-life.js`, `test/environment-entry.js`,
`test/character-life.js`, `test/character-activity.js`, `test/ambient-preview-controls.js`,
`test/environmental-interactions.js` `98`, `test/double-r-location-native.js`,
`test/sheriffs-station-native.js`, `test/hospital-native.js`, `test/traincar-native.js`,
`test/room-315-native.js`, `test/interior-prop-semantics.js` `24/24`,
`test/interior-zoning-reachability.js` `42/42`.

Artifacts rewritten by the Act‑4 Chrome run (`artifacts/act-4-implementation/*`,
`artifacts/cast-presence-v0.1/*`) were restored with `git checkout --`; the tree is clean
except the fence paths.

## Chrome captures — six requested, plus a renderable pair

`artifacts/ambient-life-01/capture.js` captures `test/retro-scene.html` at
`diner (6,8)`, `roadhouse (7,8)`, `redroom (8,10)`.

`?freezeMs=0` **cannot render** in this harness: `js/engine.js:1717` drops every tick while
`now - lastTick < 8`, and `lastTick` starts at 0, so a clock pinned to 0 never paints — the
three `-t0.png` files are the flat page background (`#111913`, verified by decoding the PNGs).
`js/engine.js` is on the do-not-touch list, so the six requested files exist exactly as asked
(`<scene>-t0.png`, `<scene>-t1000.png`) and I added `-t1500.png` as a renderable second frozen
time for each scene. `-t1000` vs `-t1500`:

- Red Room: the diff lands exactly on the named rectangle (144 px = 16 native px × 9 at scale 3).
- Roadhouse: the diff begins on the named rectangle (`bbox` origin 180,140 = the peak rect).
- Double R: decoding the frozen native canvas shows the two steam tones at exactly the two wisp
  pixels, shifted by the map camera (−16,−16); I confirmed the wiring in the live page with a
  throwaway probe that pinned `performance.now` to 300/600 and diffed `drawStructures` — it
  returned precisely `[113,45,#cfbc92],[113,44,#898b75],[114,44,#cfbc92],[113,43,#898b75],
  [114,45,#cfbc92]` (the probe file was deleted, never committed).

Caveat, stated plainly: `?freezeMs=N` also seeds `Math.random` from `N`, so a cross-time pixel
diff is **not** a clean isolation of one detail. The rigorous per-detail bound is the node test;
the Chrome shots are the illustrative deliverable the task asked for.
