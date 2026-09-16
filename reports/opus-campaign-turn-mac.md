# Campaign turn-tap failure on macOS Chrome — root cause and fix

Branch `opus/campaign-turn-mac`, cut from `origin/main`, with the GPT
integration branch merged on top.

```
142dff5 Merge origin/integ/playable-01 into opus/campaign-turn-mac
36b8a9a Mute audio in every headless Chrome driver
```

Verdict: **(a) a fix in the driver**, with a failing-then-passing reproduction.
It is not a game bug and not "environment only" in the sense of being
unfixable — the harness was letting the browser stop the game.

A second, unrelated defect sits immediately behind it and is described in its
own section. It is out of fence, so this report stops there rather than
touching it.

## Mechanism

Headless Chrome on this Mac lets the page fall to `document.hidden` partway
through a long run. `requestAnimationFrame` then stops, so `js/engine.js`
freezes between frames. CDP keeps delivering keys normally — the renderer is
alive, it just never runs another frame — so a 20 ms `ArrowUp` tap sets
`queuedDirection` and nothing ever consumes it. The player does not turn.

This is why every symptom in the brief had the same shape at different places:
the freeze lands wherever the run happens to be when Chrome hides the page.

### Evidence

Instrumented run, read at the moment the failing tap is asserted
(`run-instr-1`, temporary `window.__TPDIAG` recorder, not committed):

```
"lastFrameAgo": 102697.8
"medianGapAll": 16.7
"focus": [ ... {"t":197184,"e":"visibility:hidden"} ]
"keys": [ {"t":299666.7,"code":"ArrowUp","type":"keydown","phase":"capture","dp":false},
          {"t":299666.7,"code":"ArrowUp","type":"keydown","phase":"bubble","dp":false}, ... ]
```

- the last `requestAnimationFrame` callback ran **102.7 seconds** before the tap;
- the page went hidden at t=197184 ms and never came back;
- the median frame gap up to that point was 16.7 ms, so this is a full stop,
  not a slowdown;
- the key *was* delivered, at both capture and bubble phase, on `BODY`.

The pre-existing evidence dirs agree without any instrumentation. `player.moveT`
is left at exactly `1.171875` at the failing tap in **both** independent runs
(`tp-diag5/01551-failure.json`, `tp-review-1789587597/clean-1/01152-failure.json`),
while every healthy checkpoint shows `1.0153…`:

- `js/engine.js:1723` clamps `dt = Math.min(50, now - last)`;
- `js/engine.js:857` advances `moveT += dt * SPEED / TILE`, i.e. `50 * 0.075 / 16 = 0.234375` per clamped frame;
- `5 × 0.234375 = 1.171875`, bit for bit. Every frame of that last step hit the clamp.
- `1.0153…` is 13 frames at ~16.7 ms, i.e. 60 fps.

An exact repeated binary value across two independent runs is not organic frame
jitter; it is the clamp, and the clamp means the frame loop had already stopped
keeping time.

### Why `defaultPrevented` is false

A detail worth recording, because it looks like a listener leak and is not. The
freeze caught the notebook open: `Escape` was pressed but no frame ever
processed it, so `S.menu` stayed true. Every later arrow therefore took the
`S.menu` branch of `onKeyDown` (`js/engine.js:399`), which calls
`clearHeldInputs()` and returns **without** `preventDefault()`. The engine's own
listener ran; it just took the menu path in a game frozen with a menu open.

### Suspects from the brief, dismissed

1. **Leaked capture-phase keydown listener** — no. The recorder sees the key at
   capture *and* bubble phase with `defaultPrevented:false`; nothing intercepted
   it, and the engine's listener ran (see above).
2. **rAF loop stalling or throwing after `onArrive`** — no exception, and the
   loop does not throw: it is never called again, because the page is hidden.
   `faults[]` holds only the favicon 404s.
3. **Chrome 153 `Input.dispatchKeyEvent` for arrows** — no. The same dispatch
   works for thousands of presses in the same run, and the failing keydown is
   observed arriving in the page.

## Fix

`test/lib/playable-browser.js`, at browser setup:

```js
await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: true });
```

One call, before `Emulation.setDeviceMetricsOverride`. It pins the page focused
so Chrome does not background it, and the frame loop runs for the whole
campaign. I also tried `Page.setWebLifecycleState({state:'active'})` alongside
it; a run with focus emulation alone behaves identically, so the redundant call
was dropped.

No game file is touched. The engine's behaviour under `document.hidden` is
correct — rAF is supposed to stop — and `clearHeldInputs()` on hide is right.
The bug was that the harness let the page get there.

### Kept diagnostic

The temporary recorder is not committed. One small piece of it is, because
without it this failure costs hours and reads as a game bug:

- `test/lib/campaign-observation.js` reports `pageHidden: !!document.hidden`;
- `test/lib/playable-browser.js` pushes a `{type:'visibility'}` fault the first
  time a snapshot comes back hidden, so `session.json` names the cause.

It records; it does not change control flow.

## Reproduction

Same machine, same Chrome (`Chrome/153.0.8010.48`, `--headless=new`), unseeded
`node test/campaign-playthrough.js`.

| run | driver | result |
| --- | --- | --- |
| baseline (brief) | unfixed | 6 of 6 fail at the turn assertion, various places |
| `run-instr-1` | unfixed + recorder | fails at the turn assertion; `visibility:hidden`, rAF stopped 102.7 s |
| `run-instr-2` | fixed + recorder | turn assertion never fires again; 60 fps at every checkpoint, no visibility event |
| `run-clean-1..4` | fixed | turn assertion never fires again |

With the fix, the run passes every point that used to fail it — sheriff 10,5,
traincar 12,6, traincar 13,7 — and every checkpoint reports a healthy frame
loop:

```
FPSDIAG act2-entry   {"frames":120,"median":16.7,"p90":33.3,"focus":[{"t":653.7,"e":"pageshow"}]}
FPSDIAG act3-earned  {"frames":120,"median":16.7,"p90":33.3,"focus":[{"t":653.7,"e":"pageshow"}]}
FPSDIAG act4-earned  {"frames":120,"median":16.7,"p90":33.4,"focus":[{"t":653.7,"e":"pageshow"}]}
```

(120 frames in a 2000 ms window = 60 fps; `focus` holds only the initial
`pageshow`, never a `visibility:hidden`.)

### Why Linux differs

Page backgrounding on hidden/occluded windows is a platform decision. The
launch flags already present — `--disable-renderer-backgrounding`,
`--disable-backgrounding-occluded-windows`,
`--disable-background-timer-throttling` — cover renderer priority and timer
throttling, but none of them stops `document.visibilityState` from flipping to
`hidden` on macOS headless, and it is the visibility flip, not the throttle,
that halts `requestAnimationFrame`. The hosted Linux runner never flips, so the
same route passes there. `chrome.log` on this Mac is also full of
`CVDisplayLinkCreateWithCGDisplay failed. CVReturn: -6670`, which is the macOS
display-link path the Linux runner does not exercise at all.

## Second defect, out of fence

With the turn failure gone, the campaign now reaches `shore-discovery` and
hangs there, reproducibly, 3 runs of 3 (`run-clean-1`, `-2`, `-3`).

```
CHECKPOINT shore-discovery
Error: CDP timeout: Runtime.evaluate
```

- The last recorded event is `press KeyT` (open the notebook) at
  `campaign-acts.js:45`, `p.compare('E9A_LETTERA_O', 'E3_LETTERA_R')`.
- The next `Runtime.evaluate` never returns. Raising the CDP timeout from 10 s
  to 60 s does not help, so the renderer is stuck, not slow.
- `faults[]` is clean apart from favicon 404s; no exception was thrown.
- State at the checkpoint: `town`, 4 clues, `maddy_trovata` and
  `m8_promise_echo` set.
- Sampling `ps` every 3 s through the hang window (`run-clean-4`): the GPU
  process holds **107–114 % CPU**, the renderer 61–67 %, the browser process
  ~106 %, and browser RSS climbs 372 → 454 MB across the samples. The renderer
  is *busy*, not deadlocked — which is why `Runtime.evaluate` never returns.

That CPU shape points at the software rasterizer rather than a JavaScript
deadlock: `--use-angle=swiftshader` is in force and the GPU process is the one
pinned. Confirming it means profiling the act-5 notebook compare path, which is
out of fence.

This is a different failure from the briefed one, it is unaffected by the fix
(it reproduces identically with and without `setWebLifecycleState`), and every
prior run died before reaching it, so I cannot say from this evidence whether it
is new or merely newly exposed. Diagnosing it means reading
`js/narrative-notebook.js` and the act-5 notebook compare path, which the fence
does not include. **Stopping here and reporting, as instructed.**

Consequence for the acceptance bar: `node test/campaign-playthrough.js` cannot
be green twice locally yet. It is green through the entire briefed failure mode
and dies later, for an unrelated reason, at a point no previous run reached.

## Gates

```
$ node test/smoke.js
415 controlli superati ✔

$ node test/walkthrough.js
OK: cammino completo simulato, 85 acquisizioni, finale raggiunto ✔

$ node test/turn-in-place.js
turn-in-place: 7 physical input contracts passed (unit fixture, not campaign acceptance)

$ node test/act-3-playthrough.js
act-3-playthrough: 189/189 assertions passed
console errors: 1

$ node test/act-4-playthrough.js
act-4-playthrough: 530/530 assertions passed
console errors: 1
  Failed to load resource: the server responded with a status of 404 (File not found)  <http://127.0.0.1:26833/favicon.ico>
```

smoke 415 and walkthrough 85 hold. The single console error in each playthrough
is the favicon 404, unchanged. Chrome gates were run one at a time. Artifacts
the Chrome runs rewrote were restored with `git checkout -- artifacts/`.

`node test/campaign-playthrough.js` is **not** green — it dies at the second
defect above, past every point the briefed bug used to kill it.

## Commits

```
ca8ef85 fix(test): keep the campaign page focused so the frame loop never stops
```

plus the commit carrying this report. Neither is pushed.

## Fence

Touched: `test/lib/playable-browser.js`, `test/lib/campaign-observation.js`,
`reports/opus-campaign-turn-mac.md`. No game file, no narrative listener file —
the leak was not real, so none was needed.
