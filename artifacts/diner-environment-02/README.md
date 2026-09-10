# Double R — Environment Life Pass 02

Implemented three bounded additions over approved Ambient Life v0.1.1:

- **Intermittent machine activity:** two configured one/two-pixel status marks on the existing coffee-machine fascia. Existing seeded scheduler waits 8–25 seconds between 500–900 ms events. The sampled minute contains four events, about 4.3% active time.
- **Continuous mechanical clock:** integer hand directions follow elapsed time. The second hand steps every five seconds, minute hand every five minutes, hour hand every hour. An optional pure `(clockId, sceneElapsedMs) => seconds` callback, supplied through `setTimeSource(fn)`, returns absolute seconds for future World Time; no world-time system was added.
- **Reactive door:** a successful production doorway transaction emits `ENTITY_ENTERED_DOORWAY`. A separate small reaction layer matches the doorway identity and runs authored opening/open/closing frames. No random timer can open it.

## Exact causal path

`engine.onArrive` → warp/fade → successful `loadMap` plus save commit → `Engine.emitEnvironmentEvent` → `EnvironmentReactions.handle` → matched `front-door` animation.

The first pose holds during fade-in, then its full timing runs once the room is visible. Failed persistence rolls back without emitting the event. Direct map loads and save restoration emit nothing. Active duplicate events coalesce; another entry can trigger again after closing.

## Reusable parts and assets

`js/environment-reactions.js` has no diner-specific dispatch branch. Register another scene's arrival/source identity, integer anchor, depth, palette and frames. Shared `doorEntryFrames` contains tiny authored 32×16 rectangle frames; another door may reuse these when geometry fits or supply its own frames. No raster transforms, interpolation or base-art edits. No missing custom asset remains for this pass.

`MACHINE_IDLE_ACTIVITY` draws configured marks rather than coffee geometry. `CLOCK_TICK` accepts an external clock source. Full registration examples and Environment Life v0.2 model are in `docs/ambient-life.md`.

Static renderer, map and character atlas hashes match the pre-pass files. Existing seven Pass 01 state/timing traces match exactly at every sample in the fixed-seed minute. No audio, character animation, object UI or additional gameplay systems were added.

## Preview

`test/ambient-life-preview.html` uses the actual production index/engine and exposes **Static**, **Ambient life**, **Reactive only**, **Pause**, and **Trigger entry event**. Manual entry invokes the same production event adapter. NPC thinking is frozen only in the evidence harness to isolate environmental motion.

- `environment-life-02.webp`: lossless native 256×192, 60-second reel at 10 fps. One explicit scripted entry at 2 seconds; no random doors.
- `door-entry.webp`: isolated three-second door reaction at 25 fps, explicit event at 400 ms.
- `minute-frames/`, `door-frames/`: untouched production canvas frames.
- `timeline.json`, `behavior-summary.json`: seeded minute trace and exact Pass 01 comparison.
- `pixel-motion.json`: 474 distinct minute frames, 577 changed pixels; isolated door has four unique appearances and 392 changed pixels. Zero pixels change outside emitted effect regions. Door's first and final frames are byte-identical.

Exported reels loop for viewing; production does not reset at reel boundaries. Evidence is deterministic sampled rendering, not a real-time performance benchmark.

## Verification

- `native-results.json`: 57 native scripts pass, including actual movement through the entrance, committed-event dispatch, no event after failed save, first opening pose preserved throughout fade, subsequent visible phases, full closure, depth order, off-map/pause behavior, duplicate event handling, generic hotel reuse, sparse machine timing and external clock source.
- `coldstage-final.json`: final production browser run.
- `immutable-before.sha256`: static art preservation.
- `independent-review.json`: independent GPT-5.6-sol review and any limitations.

Reviewer found two issues during development: opening timing was initially consumed behind entry fade, and an accidental CommonJS clock-setter export referenced instance-local state. Both were fixed before final tests. No unrelated baseline is approved by this pass.

Final independent review: **pass-with-notes**. Final clock mask preserves the original pendant tint; only original hand pixels are erased. Scoped visual records precede replacement of the ambient/environment baselines. The static diner baseline remains unchanged; the unrelated town presentation baseline was not replaced. Both nine-capture suites are replayed separately for exact pixel repeatability.
