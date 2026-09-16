# Deep — Chrome harness hardening: ready race + freezeMs=0

Branch: `deep/harness-ready-race`. Base was created from `origin/main` by name:

```
$ git fetch origin && git checkout -b deep/harness-ready-race origin/main
$ git log --oneline -1
6342af6 feat(world-builder): M10a props interleave with actors by foot y
```

`origin/main` was `374b5a0` and did **not** contain `test/props-depth-chrome.js` or
`reports/opus-world-builder-m10a-depth.md`; M10a (`6342af6`) lived only on the unpushed local
`main`. Per your decision, `6342af6` was pushed to `origin/main` as a fast-forward
(`374b5a0..6342af6`) and the branch re-created from the updated head, so both the gate and the
workaround exist on the base.

Implementation commit: `8f689258fdd463849ec5043062b1469b9e74d20c`.
Report commit: child of it.

## Scope — Defect 2 only

You chose option 1: fix `freezeMs=0` now; leave READY and Opus's recapture workaround until the
READY race is reproducible. So this change touches `test/retro-scene.html` (the freeze hook),
adds `test/harness-ready-race.js`, and leaves the READY timer, `props-depth-chrome.js`, and
`capture-chrome.js` untouched.

## Defect 1 — TP-RETRO-READY race (root cause only; not reproduced, not fixed)

Root cause, the two lines: `test/retro-scene.html:167` switches the state
(`GAME.Engine.state.mode = 'play';`) inside `prepareScene`, while
`test/retro-scene.html:240` declares the frame on a **fixed 360 ms timer** that is independent of
that state (`setTimeout(function exportNativeFrame() { … document.title = 'TP-RETRO-READY ' + map; }`,
line 244). Because the harness freezes the clock, `js/engine.js:1717`
(`if (now - lastTick < 8) return;`) lets the engine render **exactly one** tick: whichever state
is current when that single tick fires is what the canvas holds forever after. If the tick lands
before `mode='play'` (i.e. `castReady` resolves early enough), READY and the capture show the
title card.

Proof attempted, per the brief: the new test on a **detached `origin/main` worktree**
(`/var/folders/…/T/opencode/hrdet` at `6342af6`). Case 1 asserts 20 captures after READY are
byte-identical to a reference, with a map-difference guard so a shared title card cannot pass
vacuously.

**It passed** (READY delivered the requested scene every time), twice — 40 captures, two URL
configs, including `props-depth-chrome.js`'s exact query with `suppressOnEnter=0`:

```
  20 READY captures, reference sha cdf595667172, 14313 bytes
```

I confirmed the reference is the scene and not the title card: an independent capture has a
green-dominant pixel fraction of **0.009** (Opus measured the title card at 0.587).

Your rule: *"If it passes before the fix, STOP and report; do not build a substitute."* So the
READY gate, `test/props-depth-chrome.js`'s reject-and-recapture workaround, and
`test/capture-chrome.js` are deliberately unchanged. The race is real in the code (the ordering
above) but did not manifest on this machine; it is timing/load dependent.

## Defect 2 — ?freezeMs=0 renders nothing (fixed)

Root cause: same `js/engine.js:1717` gate. `test/retro-scene.html:31` pinned the clock with
`var t = Number(raw) || 0;`, so `?freezeMs=0` left `lastTick = 0` and every tick was dropped —
a 3146-byte flat-background PNG.

Fix, one place in the harness page (`test/retro-scene.html:31-40`): clamp the frozen clock to a
minimum of 16 and log the clamp. Values ≥ 16 (every other Chrome gate uses 1000) are untouched.

Failing then passing output of `test/harness-ready-race.js`:

```
# BEFORE the fix — detached origin/main worktree (6342af6)
  20 READY captures, reference sha cdf595667172, 14313 bytes
AssertionError [ERR_ASSERTION]: ?freezeMs=0 paints more than the blank frame (3146 bytes)
    at ok (…/test/harness-ready-race.js:167:1)

# AFTER the fix — deep/harness-ready-race @ 8f68925
  20 READY captures, reference sha cdf595667172, 14313 bytes
HARNESS-READY-RACE-PASS 5 checks, 20 captures, freezeMs=0 painted 405504 px
```

Note the reference sha is identical before and after, i.e. the clamp does not perturb the
`freezeMs=1000` frame.

## Gates — output verbatim

```
harness-ready-race:  HARNESS-READY-RACE-PASS 5 checks, 20 captures, freezeMs=0 painted 405504 px
props-depth-chrome:  PROPS-DEPTH-CHROME-PASS 9 checks · roadhouse-table-01 frame [180,48,21,22]
                     anchor [10,20] foot y 102 · Cooper 6,5 (foot 96) vs 6,6 (foot 112)
props-flag-off:      PROPS-FLAG-OFF-PASS 9 checks, roadhouse 7,6 up, 14388 byte shot
smoke:               415 controlli superati ✔
walkthrough:         OK: cammino completo simulato, 85 acquisizioni, finale raggiunto ✔
act-3-playthrough:   act-3-playthrough: 189/189 assertions passed   (console errors: 1 — favicon 404)
act-4-playthrough:   act-4-playthrough: 530/530 assertions passed   (console errors: 1 — favicon 404)
```

`node test/ambient-life-frames.js` **cannot run on this base**: it was added on
`deep/ambient-life-01` and is not on `origin/main` (`6342af6` has no `test/ambient-life-frames.js`).
It is unrelated to the freeze hook.

Chrome drivers were run one at a time. All artifacts rewritten by the Act-3/Act-4 Chrome runs
(`artifacts/act-3-closure/*`, `artifacts/act-4-implementation/*`, `artifacts/cast-presence-v0.1/*`)
were restored with `git checkout --`; the tree carries only the two fence files plus this report.
