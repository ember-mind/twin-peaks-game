# Deep — Town dusk: stop reading the GPU canvas back every frame

Branch `deep/town-dusk-readback`, worktree `.worktrees/dusk`, based on `main`
(`3fcd79e`, M10b; the worktree was created from `621ebf1` and fast-forwarded).

## Verdict

**No listed fix holds. Production rendering is unchanged** apart from one
behaviour-neutral measurement seam. `applyGrade` is already cheap per frame
(median 2.3 ms; p95 5.3 ms on the real GPU), so the per-frame readback is not the
steady-state bottleneck — at the `shore-discovery` stall `GetImageData` is a
victim, exactly as `reports/opus-campaign-notebook-hang.md` concluded.
`willReadFrequently` (a) removes the readback but moves pixels; the CPU scratch
(b) keeps pixels but is slower and still reads the production canvas.

**Pre-existing red gate:** `node test/town-dusk.js` fails on `main` itself
(`ln 112: #e8d08f: asfalto freddo (blu > rosso)`; pristine `3fcd79e` worktree
also exits 1). The DQ3 rebalance changed the asphalt curve (`A_MID_GAIN`
0.24→0.78) without updating the test. I did not touch the test or the grade.

## Step 0 — harness and baseline

New: `test/town-dusk-readback.js` (loads town at dusk, 300 live frames, wraps
`performance.now` around `GAME.TownDusk.applyGrade`, then captures the frozen
native 256×192 frame) and `test/lib/chrome-cdp.js`. Repro:

```
node test/town-dusk-readback.js --gpu=swiftshader --shot=/tmp/before.png
```

| build | GPU | median | p95 | max | mean | shot sha256 (12) | px moved |
| --- | --- | ---: | ---: | ---: | ---: | --- | ---: |
| **baseline** | swiftshader | **2.30** | **188.0** | 263.8 | 58.5 | `331276f95201` | — |
| (a) `willReadFrequently` on `#game` | swiftshader | 187.5 | 193.3 | 355.0 | 176.8 | `694f8421c5d1` | **1464** |
| (b) CPU scratch + one `drawImage` | swiftshader | 187.4 | 193.7 | 259.3 | 186.6 | `331276f95201` | **0** |
| **baseline** | metal | **2.30** | **5.3** | 8.3 | 2.93 | `a0d0e60325b7` | — |
| (a) | metal | 4.10 | 6.6 | 9.4 | 4.49 | `694f8421c5d1` | **1459** |
| (b) | metal | 3.90 | 7.0 | 11.5 | 4.35 | `a0d0e60325b7` | **0** |

Each build is deterministic: three baseline runs gave the same numbers and the
same sha; two (a) runs gave the same sha.

## Step 1 — fixes tried, in order

- **(a) `js/engine.js` `getContext('2d', { willReadFrequently: true })`.**
  Rejected: the pixel readback changes (CPU vs GPU backing, colour management —
  1464 px, max delta 37, same histogram on swiftshader and metal), and it is
  slower (swiftshader median 2.3 → 187.5 ms; metal 2.3 → 4.1 ms). A moved shot is
  the hard stop.
- **(b) grade on the CPU-backed scratch `town-dusk.js` already owns, draw the
  result once.** Implemented and measured: byte-identical (0 px) on both GPUs,
  but slower (swiftshader median 187.4 ms; metal 3.9 ms) and it *still* reads the
  production canvas back (`scratchCtx.drawImage(ctx.canvas, …)`), so it does not
  stop the readback the brief targets. Rejected.
- **(c) precomputed LUT applied via compositing.** Not adopted. The grade is a
  24-bit per-pixel remap of the *composited* background (props/shadows blend
  colours no tile palette contains), so a LUT/compositing pass cannot reproduce
  it bit-for-bit; and the baseline already shows there is no per-frame readback
  cost to recover (median 2.3 ms, metal p95 5.3 ms).

Kept (not a fix, a seam): `js/town-dusk.js` hook now calls the exported
`GAME.TownDusk.applyGrade` instead of the closed-over local, so the harness can
time exactly that call. Behaviour-neutral — 0 px shot diff, smoke / walkthrough /
release suite green. Drop the line and the harness can wrap the public
`limitBackgroundPalettes` hook instead if you prefer zero production edits.

## Step 2 — Opus's isolated repro, before and after

`test/town-dusk-cliff.js`: production `index.html`, `loadMap('town',16,28,'left')`,
then the first DOM overlay — a bare `<div>`, and `KeyT` on a fresh load (CDP
dispatch round-trip plus frame-resume time).

```
before (3 runs):  bareDiv 183/191/188 ms (resume 439/413/496); KeyT 465/506/490 ms (resume 203/192/203)
after (a) (2 runs): bareDiv 192/186 ms;                        KeyT 482/456 ms
```

A single earlier probe saw `KeyT` at **4754 ms**; it did not reproduce in any of
five subsequent runs. The 16 s cliff does not reproduce on demand here — it is
load/cold-start bound — and where observed it does **not** move with (a). This is
consistent with Opus's `willReadFrequently` no-effect measurement.

## Gates

```
node test/town-dusk.js                     FAIL (pre-existing on main; pristine 3fcd79e also fails)
node test/smoke.js                         415 controlli superati ✔   exit 0
node test/walkthrough.js                   OK: 85 acquisizioni, finale raggiunto ✔   exit 0
node tools/run-release-tests.js --out=/tmp/tp-dusk   PASS 115/115 Node commands   exit 0
```

Not pushed. Nothing else under `js/` or `assets/` changed; `test/town-dusk.js`
and the `tests.yml` gate list are untouched.
