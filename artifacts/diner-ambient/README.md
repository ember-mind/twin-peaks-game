# Double R — Ambient Animation Pass 01

Only four ambient effects were added: two small coffee wisps, three independently timed hanging lamps, rare Double R neon micro-events, and a tiny pie-case glass reflection. Static art, map layout, character assets, palette, camera and resolution are unchanged. No character-animation or audio work was added.

## Files

Created:
- `js/ambient-life.js` — reusable scheduler, independent seeded clocks/RNG and pixel archetypes.
- `js/ambient-life-scenes.js` — Double R registrations and affected material/depth regions.
- `docs/ambient-life.md` — Environment Rule v0.1, timing budgets, API and registration example.
- `test/ambient-life.js` — scheduling, depth, determinism, duty-cycle and lifecycle tests.
- `test/ambient-life-preview.html` — production-backed live preview, pause/static comparison and deterministic reel export.

Modified:
- `js/engine.js` — optional update and depth-ordered drawing hooks.
- `index.html` — load the two modules; refresh engine cache tag.
- `coldstage.config.mjs` — static layer-off diner check and nine exact-pixel ambient captures.
- `test/capture-chrome.js` — bounded frame-by-frame export for longer motion reels.
- `test/retro-production.js`, `test/coldstage-config.js`, `test/canonical-sync.js`, `CANONICAL-SYNC.md` — audited loading, scenario and mirror scope updates.

## Evidence

- `ambient-life.webp`: lossless 30-second seeded preview, native256×192, sampled at100ms and played at10fps. The demo repeats; production schedules do not loop every30 seconds.
- `frames/`: 300 original production canvas frames.
- `timeline.json`: seed1989 and per-frame event states.
- `pixel-motion.json`:112 distinct frames;141 changing pixels in total, all inside registered effect regions; no base or character drift.
- `static-before.sha256`: unchanged renderer, map and cast atlas hashes.
- `native-results.json`:55 native scripts pass, including368 smoke checks and86 walkthrough acquisitions.
- `coldstage-final.json`:99/99 runtime checks; static diner unchanged.

The live preview uses the actual production index/engine inside an iframe. Only its evidence harness freezes NPC thought timers to isolate ambient motion. No custom raster assets are needed for these four effects. More elaborate future curtains, mechanisms or smoke silhouettes should receive authored animation frames rather than distort static art.

Independent GPT-5.6-sol review: pass-with-notes, no required fixes. Reviewed actual before/active/after motion windows for every archetype. Scoped dinerAmbient review recorded before baseline creation; repeat run reproduced all9 captures exactly with pixelGate pass and no further screenshot inspection. Static diner baseline was not replaced.
