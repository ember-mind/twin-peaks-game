#!/usr/bin/env node
'use strict';

/* test/town-dusk-readback.js — measure js/town-dusk.js applyGrade per frame.
 *
 * Loads the town at dusk in headless Chrome, lets the production loop run 300
 * frames, and times the full-canvas applyGrade readback (getImageData -> pixel
 * grade -> putImageData) with performance.now. Also captures the deterministic
 * native 256x192 frame (freezeMs) and prints its sha256, so the fix can be
 * held to "the shot does not move".
 *
 * One Chrome at a time. Nothing under the repo is written unless --shot=<path>
 * is given. Usage:
 *   node test/town-dusk-readback.js [--gpu=swiftshader|metal] [--shot=<png>] [--frames=300]
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { launch } = require('./lib/chrome-cdp.js');

const ROOT = path.resolve(__dirname, '..');
const ARGS = process.argv.slice(2);
function option(name, fallback) {
  const hit = ARGS.find((arg) => arg.startsWith('--' + name + '='));
  return hit ? hit.slice(name.length + 3) : fallback;
}
const GPU = option('gpu', 'swiftshader');
const FRAMES = Number(option('frames', '300'));
const SHOT = option('shot', '');
const SCENE = 'test/retro-scene.html?map=town&x=16&y=28&dir=left&suppressOnEnter=0';

const BENCH = `(async () => {
  const dusk = window.GAME && GAME.TownDusk;
  if (!dusk || typeof dusk.applyGrade !== 'function') throw new Error('GAME.TownDusk.applyGrade missing');
  const original = dusk.applyGrade;
  const samples = [];
  dusk.applyGrade = function () {
    const t0 = performance.now();
    const result = original.apply(this, arguments);
    samples.push(performance.now() - t0);
    return result;
  };
  await new Promise((resolve) => {
    let frame = 0;
    function tick() { if (++frame >= ${FRAMES}) resolve(); else requestAnimationFrame(tick); }
    requestAnimationFrame(tick);
  });
  dusk.applyGrade = original;
  samples.sort((a, b) => a - b);
  const at = (p) => samples[Math.min(samples.length - 1, Math.floor(p * samples.length))];
  return {
    frames: samples.length,
    median: at(0.5),
    p95: at(0.95),
    max: samples[samples.length - 1],
    mean: samples.reduce((a, b) => a + b, 0) / (samples.length || 1)
  };
})()`;

const round = (value) => Math.round(value * 100) / 100;

async function main() {
  const session = await launch({ root: ROOT, gpu: GPU, width: 960, height: 640, timeoutMs: 120000 });
  try {
    /* Phase 1: live clock, per-frame applyGrade. */
    await session.navigate(SCENE);
    await session.waitForTitle('TP-RETRO-READY', 60000);
    const timing = await session.evaluate(BENCH, true, 120000);
    if (!timing || !timing.frames) throw new Error('no applyGrade samples collected');
    const out = { gpu: GPU, frames: timing.frames, median: round(timing.median), p95: round(timing.p95),
      max: round(timing.max), mean: round(timing.mean) };

    /* Phase 2: frozen clock, deterministic native frame. */
    await session.navigate(SCENE + '&freezeMs=1000');
    await session.waitForTitle('TP-RETRO-READY', 60000);
    const dataUrl = await session.evaluate('document.body.getAttribute("data-native-png") || ""');
    const match = /^data:image\/png;base64,(.+)$/.exec(String(dataUrl || ''));
    if (!match) throw new Error('deterministic native frame missing');
    const png = Buffer.from(match[1], 'base64');
    out.shot = { sha256: crypto.createHash('sha256').update(png).digest('hex'), bytes: png.length };
    if (SHOT) { fs.writeFileSync(path.resolve(SHOT), png); out.shot.path = path.resolve(SHOT); }
    else { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-dusk-shot-')); const file = path.join(dir, 'town-dusk.png'); fs.writeFileSync(file, png); out.shot.path = file; }

    console.log('TOWN-DUSK-READBACK ' + JSON.stringify(out));
  } finally {
    await session.close();
  }
}

main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
