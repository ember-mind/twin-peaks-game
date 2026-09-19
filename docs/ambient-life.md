# Ambient Life v0.1

The approved environment art is an immutable base layer. Ambient Life adds sparse native-pixel overlays; disabling it draws nothing. No asset regeneration, furniture edits, character animation or audio belongs to this pass.

## Environment rule v0.1

Important environments normally use **1–2 continuous behaviors**, **1–3 intermittent behavior families**, and **at least one signature behavior**. These are art-direction budgets, not quotas. Multiple lamps are instances of one intermittent family. A signature may also be intermittent. Fewer, better accents beat filling every prop with motion.

Double R uses two coffee wisps, three individually timed hanging lamps, rare Double R neon micro-events (signature), and one glass reflection. No pies move. No lamp or whole sign switches off. Shadows, palette and static reflection art remain unchanged.

## Components

- `js/ambient-life.js`: four reusable archetypes, per-element seeded RNG, scheduling, pixel rendering and lifecycle controls.
- `js/ambient-life-scenes.js`: declarative world anchors and affected material regions.
- `js/engine.js`: advances only the active playable scene and draws depth slices between existing actor/furniture passes.
- `test/ambient-life.js`: clock independence, duty cycle, deterministic replay, depth partitioning, integer pixels, pause, disable and reuse.
- `test/ambient-life-preview.html`: actual production iframe, pause/base comparison and deterministic 30-second recording mode. NPC thought timers are frozen only inside this evidence harness.

## Register another environment

Load the engine once, then register named elements after it loads:

```js
GAME.AmbientLife.register('hotel_gn', [
  { id: 'desk-coffee', type: 'STEAM_SMALL', x: 88, y: 119,
    depth: 144, duration: [1250, 1450], variants: 3, intensity: 0.8 },
  { id: 'desk-lamp', type: 'LIGHT_WARM_VARIATION', x: 98, y: 96,
    depth: 144, delay: [6000, 12000],
    regions: [{x: 94, y: 121, w: 6, h: 1, depth: 144}] }
]);
```

Coordinates and region sizes are integer **world pixels**, never screen coordinates. `depth` is the furniture's existing foot/occlusion boundary. Each affected region can specify its own depth. This lets a lamp affect both back-wall wood and a foreground countertop without painting twice or disappearing behind a redraw. Rendering is observational: it never advances time or consumes RNG.

Supported options: `id`, `type`, `x`, `y`, `depth`, `enabled`, `intensity`, `variants`, optional continuous `phase` in milliseconds, `duration:[min,max]`, intermittent `delay:[min,max]`, optional intermittent `firstDelay:[min,max]`, `probability` (0–1), and affected `regions`. `firstDelay` stages only the first observation after scene entry; recurrence still uses `delay`, and elements keep independent clocks. Neon additionally accepts small local `segments` that must align with existing lit sign pixels.

## Timing and restraint

| Archetype | Life class | Timing | Visual budget |
|---|---|---|---|
| STEAM_SMALL | Continuous | 7 states, 1.2–1.48s in Double R | 0–3 individual pixels; irregular rise and breakup |
| LIGHT_WARM_VARIATION | Intermittent | 4–12s idle, 240–360ms active | Max8.5% local blend; independent clock per lamp |
| LIGHT_NEON | Signature/intermittent | 8–25s idle, 140–280ms active | One tiny existing segment; sign stays normal >95% |
| GLASS_SUBTLE_REFLECTION | Intermittent/material | 5–15s idle, 2–4s active | 1–3 reflection pixels, 1px shift; no sweep or sparkle |

Each element owns a PRNG derived from session seed, scene and stable ID. Adding/reordering another element does not consume its random stream. Gameplay `Math.random()` is untouched. Delays, event variants and steam phases differ. Leaving a map pauses its clocks; re-entry resumes without a catch-up burst. Only the active playable scene advances, and the engine's existing capped delta avoids background-tab bursts. Ambient state is cosmetic, not saved progression.

`setEnabled(false)` suppresses all drawing and advancement. `setPaused(true)` freezes current state. `reset(seed)` and `seek(scene,timeMs)` support deterministic QA; they are not player-facing gameplay controls. Production uses a session seed. QA uses1989. The static diner Coldstage scenario disables this layer; `dinerAmbient` captures fixed times and scheduled event phases. Both render actual production code. The 30-second recording samples that same renderer at100ms intervals and plays at10fps; it is deterministic timeline evidence, not a wall-clock recording.

## Future custom art

These four effects need no new raster assets: their deliberately small authored pixel states run in code. Future curtain motion, elevator mechanisms, compressor vibration, or larger steam silhouettes should receive custom frame art. Do not simulate them by warping static furniture. Reuse timing and registration while adding an appropriately authored archetype.

## Non-repetition rule — v0.1.1

Continuous ambient life should contain enough temporal or visual variation that the player does not perceive a short repeating loop. Variation may come from animation variants, duration jitter, phase differences, occasional idle frames or procedural deformation. Variation must remain deterministic when the environment uses a fixed seed.

STEAM_SMALL now finishes its existing breakup/rest frame before choosing a different compatible variant and resampling duration within the registered range. A fixed-duration continuous registration receives only ±2.5% timing jitter. There is no mid-wisp variant change, no immediate variant repeat when multiple variants exist, and no phase reset tied to another prop. Initial seeded phases remain intact. Per-element RNG and depth rendering are unchanged.

Before v0.1.1, each cup repeated one chosen variant and one chosen duration indefinitely. After v0.1.1, consecutive completed cycles vary independently while preserving the same seven authored pixel states and anchors. Glass and intermittent light scheduling are unchanged: their existing random idle and active durations already prevent a fixed short loop.

Overlap audit: twenty seeds, ten minutes each, produced 5,961 intermittent starts. Seven clusters contained three starts within 150 ms; occasional overlaps were not periodic synchronization. No cross-element scheduler or timing bias was added. Preserve independent clocks unless evidence shows a conspicuous repeating collision pattern.

QA preview accepts `?record=1&seconds=60` for 600 native frames over one minute. Tests additionally cover 48 completed steam cycles, all variants, non-repeating adjacent variants, rest-frame transitions, bounded duration jitter, one-variant compatibility and registration-order independence.

## Environment Life model v0.2

Environment life now distinguishes three causes of motion:

| Class | Cause | Double R behavior |
|---|---|---|
| Continuous | Time progresses | Existing steam; slow clock mechanism |
| Intermittent | Independent seeded idle timers | Existing lamps, neon and glass; new machine idle activity |
| Reactive | A committed world event | Entrance door opening, holding and closing |

Reactive behaviors must not use random timers as their primary trigger. They may use elapsed time to complete an animation after an event. `CLOCK_TICK` is an autonomous mechanical subtype: its direction follows time, not random cycle selection. No world-time simulation, audio, NPC animation or interaction UI is introduced.

### Machine activity

`MACHINE_IDLE_ACTIVITY` uses the existing per-element intermittent scheduler: 8–25 seconds idle, then 500–900 ms of activity by default. Its renderer knows only configured pixel marks, not appliance geometry. Double R overrides those ranges with a slow, bounded percolator cycle and two compact fascia/carafe clusters large enough to survive native scale. Other equipment can register different marks/colors at its own integer anchor. It is static for most of the time.

```js
AmbientLife.register('office', [{
  id: 'copier-status', type: 'MACHINE_IDLE_ACTIVITY',
  x: 48, y: 32, depth: 64, variants: 2,
  marks: [[{x: 0, y: 0, color: '#e9bd5d'}],
          [{x: 0, y: 0, color: '#d9dfc9'}]]
}]);
```

### Clock mechanism and future World Time

The existing 10×10 clock face supports three tiny pixel hands. Second-hand direction changes every five seconds; minute direction advances every five minutes; hour direction every hour. These quantized positions are deliberately constrained by the existing face resolution. Default time starts at 03:00 and advances with active scene time. It is not a random decorative loop and does not claim to be authoritative game time.

`AmbientLife.setTimeSource((clockId, sceneElapsedMs) => absoluteSeconds)` can later provide World Time. The function must be pure and return finite seconds so drawing/snapshots remain observational and deterministic. `setTimeSource(null)` restores the local scene-time fallback. Fixed-seed QA also requires a fixed time source. Only hand pixels change; the erase mask covers the original hands rather than clearing the illuminated face. The static clock artwork is never rewritten or transformed.

### World event to door animation

Inspection found an existing doorway transaction (`onArrive` → warp/fade → `loadMap` with save rollback), but no shared world-event bus. The extension uses that transaction and one narrow adapter, rather than introducing a general event framework:

```text
Player finishes movement onto a valid doorway
  → onArrive records warp
  → engine fade commits loadMap(destination)
  → successful map/save transaction
  → Engine.emitEnvironmentEvent({type: 'ENTITY_ENTERED_DOORWAY', ...})
  → EnvironmentReactions.handle(event) matches scene/arrival/source
  → front-door: OPENING → OPEN → CLOSING → CLOSED
```

Locked/gated doors, failed save transactions, save restoration and direct `loadMap` calls do not emit an entry event. Production currently emits player entries; future NPC traversal can emit the same fact with another `entityId`. NPC traversal itself is not added. Preview's **Trigger entry event** calls the exact same adapter with a preview entity.

The event contains `sceneId`, `arrivalKey`, `fromMapId`, `fromDoorKey` and `entityId`. Matching uses scene, trigger type and optional arrival/source/reaction identity. The adapter is the future attachment point for additional event consumers; none are implemented now.

Reactions have no RNG and no autonomous scheduler. Each registered visual owns elapsed time only after a matching event. Repeated entries during an active cycle coalesce, avoiding abrupt resets. Reaction time freezes during doorway fades so the first opening pose is not consumed behind black. Scene loading resets destination reactions to closed; off-map clocks pause; disabled reactions reject events; pause freezes motion. Reaction drawing uses the same depth slices as ambient life and restores canvas state.

### Reuse in another environment

Register another scene with its own anchor and doorway identity. No Double R condition exists in the engine or reaction renderer:

```js
EnvironmentReactions.register('hotel', [{
  id: 'lobby-door', trigger: 'ENTITY_ENTERED_DOORWAY',
  arrivalKey: '2,3', fromMapId: 'street',
  x: 16, y: 32, depth: 48,
  frames: EnvironmentReactions.doorEntryFrames,
  palette: {
    frame: '#35271f', void: '#17251e', threshold: '#81918b',
    red: '#8c2f3e', edge: '#501f29', gold: '#e9bd5d', glass: '#f4e6c8'
  }
}]);
```

The shared door asset is a small authored 32×16 rectangle-frame sequence: two opening poses, open hold, then the two closing poses. All coordinates and edges are integer pixels; no rotation, scaling, raster distortion or interpolation is used. `CLOSED` draws nothing, revealing the exact base artwork. Another door can reuse this asset when geometry fits, or supply authored `frames` with its own palette. A differently shaped door needs matching frames; it must not stretch the diner artwork. No additional custom pixel-art asset is outstanding for this pass.

### Sheriff's station main interior

The main interior registers five elements: `mug-steam` (`STEAM_SMALL` rising from the sheriff desk mug — the only continuous element, so the room is never fully still), `dispatch-radio` (`MACHINE_IDLE_ACTIVITY` on the wall radio's whole amber lamp plus a bar on the dark grille), `rear-door-presence` (`LIGHT_WARM_VARIATION` painting a dark shape across the lit frosted rear-door panel, reading as someone working in the back room), `fluorescent-west` (`MACHINE_IDLE_ACTIVITY` dipping the west fluorescent tube only — the east tube never dips), and `sheriff-desk-lamp` (`LIGHT_WARM_VARIATION` on the desk task lamp, with regions covering the stepped pool already painted on the desktop). No signature behavior and no clock is registered here.

Every mark stays inside the bounds of the authored prop it belongs to. `test/sheriffs-station-ambient.js` drives each of the five elements in isolation and asserts containment per element, so one effect's rects can never be attributed to another, plus a liveliness floor (at least 80% of sampled frames across a full-scene run must draw something) so a future retune cannot silently make the room dead again.

**Substrate-contrast rule (three passes to get right):** a mark must paint AGAINST its substrate and cover a whole authored shape, or it reads as nothing regardless of how the math checks out. Three concrete failures got us here: (a) a single pixel of amber at the archetype's 0.38 alpha ceiling, painted on an already-lit amber lamp, was invisible; (b) near-white reflection marks on light frosted glass were invisible — replaced by a dark shape on the lit panel (`rear-door-presence` moved from `GLASS_SUBTLE_REFLECTION` to `LIGHT_WARM_VARIATION` for this reason); (c) idle ranges of 8–26 s meant a player standing still for 30–60 s saw almost nothing, no matter how visible each individual event was on its own — frequency is part of visibility, not separate from it. `intensity` above 1 is the supported way to lift a mark past an archetype's authored alpha ceiling; keep the resulting `globalAlpha` at or below 1.

The entrance door reaction **is** now implemented. `js/sheriffs-station-production.js` registers `front-door` for map `sheriff` (`arrivalKey '7,10'`, `fromMapId 'sheriffs_station_exterior'`, x 112 y 176 depth 192, `doorEntryFrames`, station oak/glass palette), tested by `test/sheriffs-station-door.js`. Coldstage `sheriffsStation` now asserts two connections and still disables Ambient Life for the static baseline.

The frozen `sheriffsStation` Coldstage scenario disables Ambient Life in its `setupScript` so the approved static reference stays byte-identical despite this registration.

### Preview and evidence

`test/ambient-life-preview.html` offers **Static**, **Ambient life**, **Reactive only**, **Pause**, and **Trigger entry event** controls. A door event is never generated by a random preview timer. Deterministic record mode injects one explicitly scripted event for evidence. `?record=1&seconds=60` captures one minute; `?record=1&clip=door` captures a three-second isolated reaction at 25 fps. Production behavior remains event-driven.

`test/environment-entry.js` walks through the actual production doorway and checks successful dispatch, animation completion and save-failure rollback. `test/environment-life.js` covers matching, no spontaneous doors, duplicate events, depth slices, lifecycle, update partitioning, independent hotel registration, sparse machine activity and external clock time. Existing Pass 01 tests remain in place. Coldstage's `dinerEnvironment` scenario captures the machine, two clock states and all door phases; `dinerAmbient` continues checking Pass 01 effects.

## Visibility correction — September 8

Actual browser clicks exposed inadequate contrast: the former glass preview changed only one pixel by three RGB levels. Double R lamps now use 800–1200 ms events, a seven-by-six-pixel bulb accent and stronger existing surface accents. Neon uses 500–650 ms localized segment dips; its seeded 120-second duty-cycle test still keeps it normal over 95% of the time. Glass highlights move across a short stepped cluster at (143,43), clear of the existing bright painted reflection. Rendering remains integer-aligned, deterministic and depth ordered. No base artwork, layout or character gestures changed.

Preview buttons replay three events at production speed and intensity; comparison crops sit below the room. Actual browser tests click each button and compare canvas pixels, requiring at least four changed pixels and a peak RGB channel difference of 25. This measures rendered output, not merely clock activation. Evidence: `artifacts/diner-ambient-visible/`.

## Readable motion pass

User feedback rejected the tiny accents even after their first contrast increase. Lamp events now dim and restore the full diffuser over 1.2–1.6 seconds. The large neon R uses a geometry mask matching its existing tubes, so the entire letter dips without darkening a rectangular patch of sign background. Its event lasts 0.7–0.85 seconds; the existing fixed-seed duty-cycle test still passes. Glass reflections travel 32 native pixels across the upper pane in stepped diagonal clusters, making displacement legible at normal speed. The renderer accepts configured tube geometry and reflection travel for reuse. No new archetypes or base-art changes.
