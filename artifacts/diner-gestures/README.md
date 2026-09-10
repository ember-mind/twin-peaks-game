# Double R — coffee sip and counter wipe

Added two production character routines: upper-right booth customer sipping coffee and Norma making two short wiping passes on the counter. They run automatically on independent seeded schedules. Explicit preview buttons allow immediate inspection.

- Sip: 12–26 seconds idle, then 3.0–3.4 seconds. Cup leaves the existing table position, reaches the mouth, pauses and returns; saucer stays in place.
- Wipe: 18–34 seconds idle, then 2.8–3.2 seconds. Norma remains at her workstation; hand and cloth follow a connected bent arm. Talking to Norma cancels the current wipe. Customer can continue sipping independently.

Character poses use authored integer pixel clusters and the existing palette/head/body artwork. No map, atlas, collision, resolution or audio changes. Existing environment/ambient clocks use their original instance and are unaffected.

## Evidence

- `sip-and-wipe.webp`: eight-second native 256×192 clip at 10 fps; sip starts at0.5 seconds and wipe at4 seconds. Timings are accelerated only by explicit preview overrides. No scripted door event in this clip.
- `frames/`: 80 untouched production canvas frames.
- `pixel-motion.json`: seven distinct appearances,161 changed pixels, zero outside the two gesture bounds; first/final frames are byte-identical.
- `timing.json`: two-minute seeded production schedule showing independent starts.
- `native-results.json`:58 applicable native scripts pass.
- `coldstage-r1.json`:105/105 browser checks; existing diner, ambient and environment captures unchanged.
- `independent-review.json`: GPT-5.6-sol visual review passes, including native-frame checks for hand/cup/cloth contact and restoration. Review used frame sequences rather than a full real-time watch.
- `review-record.json`, `baseline-approval.json`: scoped visual pass recorded before gesture baseline creation.
- `repeatability.json`: exact replay of eleven gesture captures.
- `immutable-before.sha256`: unchanged map and character atlas.

Preview: `test/ambient-life-preview.html`, buttons **Prova sorso** and **Prova pulizia**. Production behavior is already active in the local game; publishing the online game is a separate action and was not performed. Architecture/behavior notes: `docs/character-activity.md`.
