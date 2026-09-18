# Double R baseline capture

Date: 2026-09-18 (Europe/Rome)

## Fixed state

- Page: `test/retro-scene.html?map=diner&x=6&y=8&dir=up&narrative=1`
- Player: `diner`, tile `[6,8]`, facing `up`, `moving=false`, `fadePhase=0`
- Visible NPC bodies: Log Lady `[4,5]`, Norma `[5,2]`, Shelly `[9,7]`
- Native canvas: `256×192`, RGBA, direct `canvas.toDataURL()` pixels

## Captures

- `double-r-baseline-native.png` — `256×192`; native-shot PASS. SHA-256 `e2c579d8945c5401d639e3cf6d49053884cdcbd7a7f99b89096d0ea3cdd7e923`.
- `double-r-baseline-display.png` — compositor screenshot `800×720`. SHA-256 `92f9efa558f6de77077a6436c565babb43310eac4db7b11234f3e8c60f141fa8`.
- `double-r-baseline-motion-contact-sheet.png` — contact sheet of all 26 stationary samples. SHA-256 `927405602441eba8b600107315cf7da291f85392125696276a79a3a1f9cee9bb`.
- `cdp-real/manifest.json` — full state/timestamp/hash record; status `PASS`.
- `cdp-real/canonical/t+003633ms-canonical-diner.png` — canonical populated frame, pixel gate `919` colors / `78.5%` non-base.
- `cdp-real/stationary/` — 26 frames, all `256×192`, all unique, sampled over measured `30,627 ms`; filenames carry elapsed timestamps.

## Display scaling evidence

Capture harness viewport: `800×720`. `retro-scene.html` computes
`floor(min(800/256, 720/192)) = 3`; stage/canvas CSS box is therefore
`768×576`, centered at `(16,72)`. The PNG is the full `800×720` compositor
surface with the 3× pixelated game canvas and dark margins.

## Temporal observation

Animation is visible and real: all 26 stationary hashes differ; the manifest
records advancing rAF (`565` frames), ambient clock (`800 → 26,544.2 ms`) and
character clock (`800 → 26,544.2 ms`). Ambient events incremented for pendant
lamps (`2/3/2`), neon (`1`), coffee machine (`2`) and pie-glass reflection
(`2`); booth sip character activity fired once. NPC directions change while
their map positions remain fixed.

## Commands

```sh
node test/native-shot.js --map=diner --x=6 --y=8 --dir=up --narrative=1 \
  --out=artifacts/intent-room-double-r-grid/new-pass/baseline/double-r-baseline-native.png
node test/capture-chrome.js --chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --url='http://127.0.0.1:18555/test/retro-scene.html?map=diner&x=6&y=8&dir=up&narrative=1' \
  --output=artifacts/intent-room-double-r-grid/new-pass/baseline/double-r-baseline-display.png \
  --width=800 --height=720 --ready-prefix=TP-RETRO-READY --timeout-ms=25000 --gpu=swiftshader
node test/double-r-real-cdp-capture.js --canonical-only --duration-ms=30000 \
  --sample-ms=1000 --no-video \
  --output=artifacts/intent-room-double-r-grid/new-pass/baseline/cdp-real \
  --chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
```

The optional `retro-scene.html&motion=1` reel was blocked by a stale harness
provenance check expecting `r126-tree-cleanup` while this checkout's production
`index.html` serves `retro-authored.js?v=r141-gestures`; the independent
`double-r-real-cdp-capture.js` sequence above passed without modifying either.
