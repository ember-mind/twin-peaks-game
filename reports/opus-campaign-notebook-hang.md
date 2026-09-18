# Campaign hang at the act-5 notebook compare — what is busy

Branch `opus/campaign-notebook-hang`, from `main`.

```
$ git log --oneline -2
<this commit>  fix(test): reap a Chrome that outlives its driver
e581124        Log canonical sync for E0 evidence shots
```

(The branch is `main` at `e581124` plus the single commit carrying this report;
amending it would only make a hash written here go stale.)

## Verdict

**(c) environment — headless Chrome's GPU/compositor path on macOS. Not a game
bug, not swiftshader-only, and the driver change I can prove does not fix it.**

Two things are true and they are not the same event:

1. **A reproducible cliff, fully explained and fixable.** The first time the page
   puts a **DOM overlay over the canvas**, headless Chrome on this Mac rebuilds
   its GPU output surface, and the renderer blocks on the GPU command buffer for
   the whole rebuild — 8–16 s. `--disable-gpu-compositing` removes it entirely
   (10 000 ms → 68 ms in the isolated reproduction).
2. **The campaign hang itself, still unexplained.** With that flag — and also
   with `--disable-gpu`, i.e. no GPU process at all — `campaign-playthrough.js`
   **still hangs at `shore-discovery`** on a quiet machine. So the flag is not
   the fix, and I have not committed it.

What I can state with evidence: the notebook code is innocent (opens in **1 ms**),
the engine is innocent (60 fps up to the tap), `press('KeyT')` matters only
because it is the first DOM overlay of the run on that map, and the failure is
not swiftshader-specific (metal hangs too).

Per the brief's rule for (c) — propose the driver change and stop — the proposal
is below, unmerged. The one change committed here is a separate, proven driver
bug (b): the run leaks a live Chrome.

## Evidence

### 1. The hang is not JavaScript

At the failing tap:

```
HD cdp Input.dispatchKeyEvent 14ms
HD cdp Input.dispatchKeyEvent 200ms
HD cdp FAIL Runtime.evaluate       10003ms  CDP timeout: Runtime.evaluate
HD captureScreenshot        FAIL   30003ms  CDP timeout: Page.captureScreenshot
HD Profiler.stop arm-to-hang FAIL  60004ms  CDP timeout: Profiler.stop
HD Profiler.start 5s         FAIL  30003ms  CDP timeout: Profiler.start
HD evaluate __HD hang        FAIL  60004ms  CDP timeout: Runtime.evaluate
```

`Profiler.stop` timing out means the V8 inspector was never serviced. The page
was healthy right up to the tap — 60 fps, no visibility flip:

```
HD page pre-KeyT {"now":470019,"frames":24317,"lastFrameAgo":8,"hidden":false,
                  "gapMedian":16.7,"gapP95":33.3, …}
```

A native `sample` of the renderer during the **campaign** hang shows the main
thread parked in the message pump, 3491 of 3491 samples:

```
3491 Thread_…  DispatchQueue_1: com.apple.main-thread
  3491 … ChromeMain + 2927632 → ChromeMain + 8716628
    3491 mach_msg → mach_msg_overwrite → mach_msg2_internal → mach_msg2_trap
```

So during the campaign hang the renderer is not burning CPU at all. The CPU is
elsewhere (browser/GPU processes were 86–114 % in `ps` sampling); I did not
manage to sample those cleanly before the run tore down, and that is the gap.

### 2. The cliff, named by tracing

Browser-level tracing across the stall in the seeded reproduction:

```
CrRendererMain      | GetImageData                          9131ms  max 5826ms  n=12
CrRendererMain      |   RasterImplementation::ReadbackImagePixels   max 5826ms
CrRendererMain      |   ImplementationBase::WaitForCmd
CrRendererMain      |   CommandBufferHelper::Finish
CrRendererMain      |   CommandBufferProxyImpl::WaitForGetOffset   <- the mach_msg wait
CrBrowserMain       | Compositor::destructor                 8062ms  max 6011ms
VizCompositorThread | SkiaOutputSurfaceImpl::Initialize              max 5722ms
CrGpuMain           | CommandBuffer::Flush                   9148ms  n=675
```

`Compositor::destructor` (6.0 s) and `SkiaOutputSurfaceImpl::Initialize` (5.7 s)
are the work. `GetImageData` is a victim: `js/town-dusk.js` grades every frame of
the `town` map through `getImageData`/`putImageData`, and one readback lands
inside the rebuild and waits out all of it.

### 3. The trigger is a DOM overlay, not the notebook

Seeded `shore-discovery` save, keys pressed directly:

| key | what it does | time |
| --- | --- | --- |
| ArrowLeft / ArrowRight | movement, no overlay | 37–38 ms |
| KeyX (fascicolo) | overlay drawn **on the canvas** | 38 ms |
| **KeyT (notebook)** | overlay inserted **into the DOM** | **> 10 000 ms** |
| KeyT, second time | DOM overlay again | 1 211 ms |

The page's own beacons show the notebook's JavaScript is not the cost:

```
t=761   key=KeyT
t=762   nb.open.enter
t=762   nb.open.returned        <- 1 ms
t=7311  slow=getImageData&ms=6292
t=8315  frames=3                <- 3 frames in 8 s
```

A bare, unstyled `<div>` reproduces it with no notebook at all, and only the
**first** insertion pays:

| seeded state | map | bare `<div>` appended | second insertion |
| --- | --- | --- | --- |
| `taxi-testimony` | diner | 206 ms | 26 ms |
| `act3-earned` | sheriff | 206 ms | 21 ms |
| `shore-discovery` | town | **16 159 ms** | 860 ms |

Disabling `js/town-dusk.js` does not avoid it — the 16 s moves to whichever DOM
insertion comes first. The readback amplifies the stall; it does not cause it.

### 4. Not swiftshader-only

Same campaign with `--use-angle=metal`:

```
HD cdp Input.dispatchKeyEvent 12ms
HD cdp Runtime.evaluate 8710ms          <- returned, but 8.7 s
HD cdp FAIL Runtime.evaluate 10002ms    <- then timed out anyway
```

Metal makes the rebuild cheaper but still hangs the run. GPU load *drops* during
the stall (GPU helper ~999 % in normal play → ~88 % while hung), which is a
stalled pipeline, not a busy rasteriser.

## Proposed driver change (not committed)

```js
'--disable-gpu-compositing',
```

The page composites one 256×192 canvas scaled by CSS and has nothing to gain from
GPU compositing. It removes the cliff in isolation (`KeyT` 10 000 ms → 68 ms).
**It does not make `campaign-playthrough.js` pass** — the campaign still hangs at
`shore-discovery` with it, and with `--disable-gpu` too. Offered as a real
improvement to the environment, not as the fix.

## Committed: the driver leaks a live Chrome (b)

Separate defect, proven, in fence. When Chrome relaunches itself mid-run — a
Google Chrome auto-update does exactly this, and did it three times during this
investigation — the new browser process is no longer the driver's child. The
`SIGTERM`/`SIGKILL` in `close()` hits a dead pid, and a fully live Chrome is left
parented to `launchd`, still rendering the page at 60 fps.

Observed cost: four orphans from my own runs, ~100 minutes old, GPU processes at
218–284 % CPU each, load average **60** on a 16-core machine. Every measurement
taken while they ran is worthless, and the user hit the same leak this morning
with an act-5 orphan at 650–1090 % CPU. This is also a plausible contributor to
"the unseeded campaign is flaky on macOS": a starved machine changes every timing.

`reapStrays()` kills anything still holding this run's unique profile directory
at teardown. It cannot touch another run: the profile path is per-run and is
matched whole.

## Reproduction

| run | config | result |
| --- | --- | --- |
| baseline (4 prior runs) | swiftshader | hang at `shore-discovery` |
| run-swift | swiftshader + diagnostics | hang; evaluate/screenshot/profiler all time out |
| run-metal | `--use-angle=metal` | evaluate 8710 ms, then hang |
| fast-1 (seeded) | swiftshader | first `KeyT` 8398 ms, later 373–563 ms |
| keys-nogpucomp (seeded) | `--disable-gpu-compositing` | `KeyT` 68 ms |
| run-fix1 | full campaign, `--disable-gpu-compositing`, quiet machine | **still hangs** at `shore-discovery` |
| run-verify4 | full campaign, `--disable-gpu` | still hangs |

The seeded reproduction injects the `shore-discovery` save and presses `KeyT`,
turning an 8-minute reproduction into 30 seconds. It is scratch-only and stays
that way: it injects a save, which `campaign-recovery.js` forbids for
certification, so it is a diagnostic, not a test.

## What I ruled out

- **The notebook** (`js/narrative-notebook.js`): opens in 1 ms, every time.
- **`js/town-dusk.js`'s per-frame readback**: disabling it leaves the stall.
- **`willReadFrequently`** on `#game` (`js/engine.js:282`), `#retro-ui-canvas`
  and the town-dusk scratch canvas: no effect (8239 ms). The block is the
  surface rebuild, not the canvas backing.
- **swiftshader**: metal hangs too.
- **GPU entirely** (`--disable-gpu`): campaign still hangs — which is what keeps
  the campaign hang unexplained.

## What I would do next

1. Sample the **browser** and **GPU** processes during the campaign hang (the
   renderer is idle, so the answer is in one of those two). My capture script
   mis-matched the pids on the last attempt; the fix is to read the pid from
   `chrome.log` rather than `pgrep`.
2. Trace the campaign hang through the browser endpoint the way the seeded one
   was traced, reading the port from `<user-data-dir>/DevToolsActivePort`.
3. Ask why the seeded reproduction stalls for 8 s but the campaign for minutes:
   something accumulating over ~8 minutes of play is still missing from the
   picture. `drawCastWalkSheet` (`js/retro-authored.js:6880`) creating a fresh
   24×24 canvas on every draw is the first thing I would measure.

## Gates

```
node test/smoke.js             → 415 controlli superati ✔
node test/walkthrough.js       → OK: cammino completo simulato, 85 acquisizioni, finale raggiunto ✔
node test/playable-browser.js  → playable-browser unit: 66/66 assertions passed (no campaign executed)
```

Run one Chrome at a time; no Chrome left behind afterwards.
`node test/campaign-playthrough.js` still fails at `shore-discovery`: that is the
open defect this report does not close.

## Also found

- **Chrome auto-update kills long runs.** Three runs died with
  `Error: Browser disconnected` while the Google updater ran; Chrome went
  153.0.8010.52 → .53 mid-investigation. Worth knowing before trusting any
  macOS campaign result.
- **`drawCastWalkSheet` (`js/retro-authored.js:6880`) creates a fresh 24×24
  canvas per draw** — thousands per run, visible throughout the context-creation
  trace. Out of fence, not touched, worth a look.

## Commits

- One commit: fix(test): reap a Chrome that outlives its driver, carrying this report.

Nothing pushed.

## Fence

Touched: `test/lib/playable-browser.js` (stray-Chrome reaping), this report.
`js/engine.js`, `js/narrative-notebook.js`, `js/town-dusk.js`, `js/retro-*.js`
were read and experimented on **in scratch copies only**; none is modified on
this branch. All instrumentation (beacons, tracing, seeded reproduction) stayed
in the scratchpad and is not committed.
