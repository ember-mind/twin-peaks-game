# Visual-audit capture

The capture path is deliberately bounded: it never starts the production
`requestAnimationFrame` loop. `shot.html` submits one warm-up render, waits
only for authored assets that are actually loading, then submits either one
native frame or a fixed-step contact strip. `capture-chrome.js` waits for the
harness' explicit ready title before accepting a PNG.

## One native still

The historical positional CLI remains valid:

```sh
test/shot.sh town 30 31 up /tmp/town.png
```

Deterministic visual state is additive:

```sh
test/shot.sh town 30 31 up /tmp/town-autumn-dry.png \
  --seed=104729 --season=autumn --wet=false --suppress-on-enter
```

Every accepted still is 960×640 at DPR 1. The output is first captured to a
temporary sibling file, validated as PNG with the exact dimensions, and only
then atomically renamed to the requested path.

## Reproducible matrices

```sh
node test/visual-audit-capture.js \
  --profile=gameplay \
  --output=artifacts/visual-audit/run-A \
  --blind-label=A

node test/visual-audit-capture.js \
  --profile=temporal \
  --output=artifacts/visual-audit/run-A

node test/visual-audit-capture.js \
  --profile=presentation \
  --output=artifacts/visual-audit/run-A
```

`--profile=all` runs the three bounded matrices. `manifest.json` records the
source commit, blind label, seed, state, standalone reproduction command,
shared-server runner command, SHA-256, byte count and elapsed time for every
accepted file. ImageMagick also builds a neutral per-profile contact sheet
(`--magick=/path` selects the binary; `--no-sheets` is available for minimal
CI environments). The checked-in matrix uses the critic's exact coordinates:
nine town landmarks/facades, every indoor map family (including One Eyed
Jacks), two woods framings, Red Room, the train car, an eight-frame walk
strip, and sixteen-frame rain, water and Red Room strips.

The temporal profile also captures the actual production page at 0, 16, 50,
150, 300 and 600 ms after Enter starts a classic sheriff dialogue. Each
checkpoint freezes the production iframe at that instant, including CSS
transitions, before CDP accepts the image. The 600 ms checkpoint is the
representative sheriff two-shot; the six-frame sheet makes any overlap between
the old canvas dialogue and the HTML presentation visually obvious.

The presentation set is intentionally representative rather than exhaustive:
three stable stops from `presentation-harness.html` and one theory-revision
stop from `m5-screentruth-harness.html`. A stop is accepted only when its
document title reaches the declared harness prefix.

## Scope limitations

- `--season` and `--wet` exercise the public tiles.js terrain inputs. Town and
  woods rain emitters are currently map-authored in render3d.js, so
  `--wet=false` changes terrain albedo but does not disable their rain volume.
- Temporal output is a 960×640 contact strip made from native 960×640 source
  renders. It is for frame-to-frame artifact review, not per-frame pixel
  measurement.
- Walk strips drive the render pose with fixed `moveT`; they do not simulate
  collision or game input. Movement rules remain covered by
  `test/movement-feel.js` and the physical harnesses.
- Dialogue-transition checkpoints are six independent, freshly booted
  production-page runs, not six reads from one uninterrupted browser process.
  `0 ms` means the first timer task after the synchronous Enter handler. The
  harness freezes the reached DOM, CSS animations and future render
  submissions before CDP polls, so polling delay cannot advance the visual
  state; OS/GPU scheduling before the freeze is still not a laboratory clock.
- Presentation harnesses use their existing stop semantics. No attempt is made
  to capture every branch, because several are long-running validation routes
  rather than safe visual states.
