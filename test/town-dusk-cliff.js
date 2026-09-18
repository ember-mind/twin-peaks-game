#!/usr/bin/env node
'use strict';

/* test/town-dusk-cliff.js — Opus's isolated repro, measured.
 *
 * Opens the production page, loads the town, lets frames run, then measures how
 * long the renderer stalls when the first DOM overlay lands: a bare <div>
 * appended to <body>, and (on a fresh load) the first KeyT (notebook). This is
 * the compositor cliff from reports/opus-campaign-notebook-hang.md, not a
 * js/town-dusk.js defect; it exists only to answer "does the readback fix move
 * the cliff?".
 *
 * Usage: node test/town-dusk-cliff.js [--gpu=swiftshader|metal]
 */

const path = require('node:path');
const { launch, sleep } = require('./lib/chrome-cdp.js');

const ROOT = path.resolve(__dirname, '..');
const ARG = process.argv.slice(2).find((arg) => arg.startsWith('--gpu='));
const GPU = ARG ? ARG.slice(6) : 'swiftshader';
const TOWN = "GAME.Engine.loadMap('town',16,28,'left'); GAME.Engine.state.mode='play'; GAME.Engine.state.flags.intro_town=true;";

const BEACON = `(function () {
  if (window.__cliffBeacon) return true;
  window.__cliffBeacon = true; window.__cliffFrames = 0;
  (function frame() { window.__cliffFrames++; requestAnimationFrame(frame); })();
  return true;
})()`;

const STEADY = `(async () => {
  ${BEACON}
  await new Promise((resolve) => setTimeout(resolve, 400));
  const start = window.__cliffFrames; const t = performance.now();
  return await new Promise((resolve) => {
    const timer = setInterval(() => {
      if (window.__cliffFrames >= start + 3) { clearInterval(timer); resolve(performance.now() - t); }
    }, 10);
  });
})()`;

async function bootTown(session) {
  await session.navigate('index.html');
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (await session.evaluate('!!(window.GAME && GAME.NarrativeProduction && GAME.NarrativeProduction.ready)')) break;
    await sleep(100);
  }
  await session.evaluate(`(function(){ ${TOWN} return true; })()`);
  await sleep(1200);
}

async function measureBareDiv(session) {
  await bootTown(session);
  await session.evaluate(BEACON);
  await session.evaluate(STEADY, true, 30000); // warm frames
  const start = await session.evaluate('window.__cliffFrames');
  const t0 = Date.now();
  await session.evaluate(`(function(){ var d=document.createElement('div'); document.body.appendChild(d); return true; })()`);
  const roundTripMs = Date.now() - t0;
  const resumeMs = await session.evaluate(`(async () => {
    const t = performance.now();
    return await new Promise((resolve) => {
      const timer = setInterval(() => {
        if (window.__cliffFrames >= ${start} + 3) { clearInterval(timer); resolve(performance.now() - t); }
      }, 10);
    });
  })()`, true, 60000);
  return { roundTripMs, resumeMs: Math.round(resumeMs) };
}

async function measureKeyT(session) {
  await bootTown(session);
  await session.evaluate(BEACON);
  await session.evaluate(STEADY, true, 30000);
  const start = await session.evaluate('window.__cliffFrames');
  const t0 = Date.now();
  await session.press('KeyT', 't', 84);
  const dispatchMs = Date.now() - t0;
  const resumeMs = await session.evaluate(`(async () => {
    const t = performance.now();
    return await new Promise((resolve) => {
      const timer = setInterval(() => {
        if (window.__cliffFrames >= ${start} + 3) { clearInterval(timer); resolve(performance.now() - t); }
      }, 10);
    });
  })()`, true, 60000);
  return { dispatchMs, resumeMs: Math.round(resumeMs) };
}

async function main() {
  const session = await launch({ root: ROOT, gpu: GPU, width: 980, height: 700, timeoutMs: 30000 });
  try {
    const bareDiv = await measureBareDiv(session);
    const keyT = await measureKeyT(session);
    console.log('TOWN-DUSK-CLIFF ' + JSON.stringify({ gpu: GPU, bareDiv, keyT }));
  } finally {
    await session.close();
  }
}

main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
