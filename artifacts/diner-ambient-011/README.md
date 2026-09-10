# Ambient Life v0.1.1 — organic loop polish

## Change and before/after

Previously, each steam emitter selected one variant and duration at initialization and repeated them indefinitely. It now completes its seven-state cycle, including the existing empty breakup/rest state, before selecting a different compatible variant and resampling its duration. Registered duration ranges remain unchanged; fixed-duration continuous registrations receive ±2.5% jitter. Each emitter retains its own seeded RNG, so replay and update partitioning remain deterministic.

The seed-1989 minute contains 47 completed counter cycles and 43 booth cycles. Both use all three variants, with no adjacent repeats. Counter cycle durations span 1,206–1,358 ms; booth durations span 1,320–1,475 ms in this sample.

Intermittent clocks were left intact. A 200-minute audit across 20 seeds produced 5,961 starts, 381 pairs within 150 ms, and seven clusters with at least three starts within 150 ms. Occasional overlaps remain natural; the audit found no recurring synchronized cadence warranting a scheduler. Before/after intermittent snapshots match exactly throughout the sampled minute.

No changes to scene registrations, anchors, depth drawing, archetype artwork, furniture, characters, map or base artwork. Hashes verify the renderer, map, registrations and character atlas remain unchanged. The reusable change is confined to continuous cycle timing; no diner-specific scheduling was introduced.

## Tests and evidence

- `native-results.json`: all 55 applicable native scripts pass. New tests cover 48 cycle boundaries, empty terminal frames, all variants, no adjacent repeats, duration bounds, single-variant support and independent registration ordering. Existing tests retain 120-second update-partition equivalence, pure drawing, depth slices and lifecycle behavior.
- `coldstage-r1.json`: 99/99 runtime checks pass. Ambient pixel differences are restricted to changed steam states. Existing static diner NPC timing drift and older town presentation-baseline differences are recorded separately; those baselines are not replaced by this pass.
- `ambient-life-011.webp`: lossless 60-second preview, native 256×192, 10 fps. This exported reel loops; production does not reset every minute.
- `frames/`: 600 untouched production canvas frames, with NPC thought timers frozen by the evidence harness only.
- `timeline.json`, `before-after.json`: deterministic 100 ms samples for the entire minute.
- `pixel-motion.json`: 334 distinct frames; 160 changing pixels; zero changes outside emitted ambient regions.
- `overlap-frames/`, `neon-lamp-overlap.webp`: natural overlap at seed-1989 time 104.4–105.08 seconds, sampled every 20 ms. Middle lamp is active at 104.537–104.793 seconds; neon at 104.652–104.872 seconds. The first minute contains no neon/lamp overlap.
- `overlap-audit.json`, `audit-overlaps.cjs`: reproducible multi-seed timing audit.
- `immutable-before.sha256`: unchanged art, map and registration hashes.

The engine rule is documented in `docs/ambient-life.md`: continuous life must avoid perceptible short repetition while preserving fixed-seed determinism. Native frames plus timing evidence support the review; the 10 fps minute reel is not a real-time performance benchmark.

Independent GPT-5.6-sol review: **pass**, no required fixes. The reviewer inspected the diff sheet, selected native transition/event frames, full-minute timing trace and exact-boundary tests. This was not a full real-time video watch. `review-record.json` records the scoped pass before `baseline-approval.json` replaces only the nine ambient captures. `repeatability.json` then reproduces every capture exactly: pixel gate pass, `aiReviewNeeded: false`. Static baselines remain untouched.
