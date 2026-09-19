# Deep — props: the below-actors band

Branch `deep/props-below-band`, worktree `.worktrees/props-band`, from `main`
(`4a8bf55`, M11). `world/props.json` untouched; not pushed.

## What changed

`js/props-production.js` now draws in three bands split on `ACTOR_LAYER` (6):

| band | layer | release |
| --- | --- | --- |
| `BELOW_ACTORS` = `'below the actors'` | `< 6` | once, on the frame's first band call — before every actor, whatever the foot y (backdrops, rugs, stage frames) |
| `ACTOR_BAND` = `'interleaves with the actors'` | `== 6` | by foot y as before (tie draws the prop first) |
| `ABOVE_ACTORS` = `'above the actors'` | `> 6` | once, at the end of the frame, after every actor |

`BANDS`, `bandOf(layer)` and `ACTOR_LAYER` are exported by both `js/props-production.js`
and the game-free `js/editor/core/props.js`. The inspector label
(`js/world-builder.js`, `wb-prop-layer`) now reads `6 (definition default) — interleaves with
the actors` instead of only tagging layers above 6.

One latent bug surfaced and was fixed en route: a frame that released **every** prop before
the open end band left `pendingScene` null, so the end band re-began the frame and drew the
whole scene a second time. The end band now checks a `frameScene` marker set by `beginFrame`.
The new below band makes a fully-drained frame common, which is how the test caught it.

## Proof of the band

`test/props-below-band.js` (new, 12 checks) loads `world/props.json`, overrides
`roadhouse-stage-01` to `ACTOR_LAYER - 1` in memory (file untouched), installs the render-order
fixture's fake sprite surface, drives one real frame, and asserts the Giant's sprite
(`@giant`, foot 32) reaches the canvas **after** the stage frame (`draw:0,0,112,46`). The
seeded stage foot is 46 > 32, so foot y alone would put it in front; the band is the only
difference. `test/props-render-order.js` gained the same boundary in the unit fixture
(37 checks, was 32).

## M11 harness before/after (override `roadhouse-stage-01:5`, so it runs without editing the registry)

`PROPS_LAYER_OVERRIDE=roadhouse-stage-01:5 node test/props-production-chrome.js`
(evidence redirected with `PROPS_OUT` so the canonical `artifacts/props-m11/` is not overwritten):

```
BEFORE (original runtime, 16/22)
  FAIL - roadhouse-giant-stage: depth — every prop that must be BEHIND an actor leaves the actor's pixels alone (3 pairs)
      giant foot 32 <- roadhouse-stage-01 L5 foot 46, sampled 30, changed 30
  FAIL - roadhouse-giant-stage: no actor loses more than half its sprite to the prop layer (cooper 45%, giant 55%)
      giant covered 0.552 (212/384)

AFTER (band runtime, 17/22)
  FAIL - roadhouse-giant-stage: depth — every prop that must be BEHIND an actor leaves the actor's pixels alone (3 pairs)
      giant foot 32 <- roadhouse-stage-01 L5 foot 46, sampled 30, changed 18
  PASS - roadhouse-giant-stage: no actor loses more than half its sprite to the prop layer (cooper 39%, giant 26%)
```

The band moves the stage behind the Giant: coverage drops **55% → 26%** (the "erases the
Giant" finding is closed). The strict behind check still counts **18 of 30** sampled pixels,
all in the Giant's core where his own sprite is transparent and the stage now shows through —
the metric the M11 report already flagged as "a prop drawn behind a character repaints the
background inside the box". The other five failures remain: `roadhouse-empty` depth (table-02,
3 px), `roadhouse-gathering` depth (booth, 6 px), `roadhouse-gathering` coverage (loglady 60%),
`roadhouse-giant-stage` depth (above), and the runtime-hooks note (traincar-scene wrappers are
outermost). `PROPS-PRODUCTION-CHROME 17/22`, exactly five remaining.

## Recommendation for `world/props.json`

Set **`"layer": 5`** (`ACTOR_LAYER - 1`) on `roadhouse-stage-01`. The default (1) already
lands in the below band, but 5 declares the intent: the velvet frame sits above the lower
backdrop layers (neon 2, piano 3, booth/bar 4) and below every actor — the exact value the
new test and the harness override use.

Collateral the lead should decide at the same time: the band reclassifies **every** layer `< 6`.
`roadhouse-table-01`, `roadhouse-table-02` and `roadhouse-payphone-01` sit at 5 and so now draw
behind all actors. If the tables should keep interleaving (they do today — `props-depth-chrome`
exists for exactly that), move them to `ACTOR_LAYER` = 6. `props-depth-chrome` now pins its
fixture instance to `ACTOR_LAYER` in the served tree, so it keeps proving the interleave
regardless of the registry default.

## Gates

```
node test/props-render-order.js         PROPS-RENDER-ORDER-PASS 37 checks
node test/props-below-band.js           PROPS-BELOW-BAND-PASS 12 checks        (new)
node test/props-core.js                 PROPS-CORE-PASS 126 checks
node test/props-depth-chrome.js         PROPS-DEPTH-CHROME-PASS 9 checks
node test/props-flag-off.js             PROPS-FLAG-OFF-PASS 9 checks, 14388 byte shot
node test/world-builder-browser.js      WORLD-BUILDER-BROWSER 229/229
node test/props-changeset.js            PROPS-CHANGESET-PASS 47 checks
node test/props-registry.js             PROPS-REGISTRY-PASS 12 definitions, 19 instances, 53 checks
node test/smoke.js                      415 controlli superati ✔
node test/walkthrough.js                OK: 85 acquisizioni, finale raggiunto ✔
node tools/run-release-tests.js --out=/tmp/tp-props   PASS 116/116 Node commands
```

`props-flag-off` hit the known `test/retro-scene.html` READY race once (a stripped tree
photographed the title card); it passed byte-identical on re-run. One Chrome at a time, none
left behind. `test/props-below-band.js` is not wired into `.github/workflows/tests.yml` (no
props test is); recommend adding it with the other `test/props-*.js`.
