'use strict';

/* Pure Node contracts, not a campaign test. Does not launch Chrome. */
const assert = require('node:assert/strict');
const { openPlayableBrowser, keyParams } = require('./lib/playable-browser.js');
let checks = 0;
function check(fn) { fn(); checks++; }
async function rejects(fn, pattern) { await assert.rejects(fn, pattern); checks++; }

async function main() {
  check(() => assert.deepEqual(keyParams('ArrowUp'), {
    code: 'ArrowUp', key: 'ArrowUp', windowsVirtualKeyCode: 38, nativeVirtualKeyCode: 38
  }));
  for (const code of ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Space',
    'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyZ', 'KeyX', 'KeyT', 'KeyM', 'KeyN']) {
    const p = keyParams(code);
    check(() => assert.equal(p.code, code));
    check(() => assert.equal(typeof p.key, 'string'));
    check(() => assert.equal(p.windowsVirtualKeyCode, p.nativeVirtualKeyCode));
  }
  for (const code of ['F12', 'KeyQ', 'seed', 'loadMap', 'toString', '__proto__', '', null, undefined, {}, ['ArrowUp']]) {
    check(() => assert.throws(() => keyParams(code), /Unsupported player key/));
  }
  await rejects(() => openPlayableBrowser(), /root and outputDir/);
  await rejects(() => openPlayableBrowser({ root: '.' }), /root and outputDir/);
  await rejects(() => openPlayableBrowser({ root: '.', outputDir: '.', timeoutMs: 0 }), /timeoutMs/);
  await rejects(() => openPlayableBrowser({ root: '.', outputDir: '.', timeoutMs: NaN }), /timeoutMs/);
  await rejects(() => openPlayableBrowser({ root: '.', outputDir: '.', width: -1 }), /width/);
  await rejects(() => openPlayableBrowser({ root: '.', outputDir: '.', height: 1.5 }), /height/);
  await rejects(() => openPlayableBrowser({ root: '.', outputDir: '.', mobile: 'false' }), /mobile must be boolean/);
  await rejects(() => openPlayableBrowser({ root: '.', outputDir: '.', noSandbox: 'true' }), /noSandbox must be boolean/);
  await rejects(() => openPlayableBrowser({ root: '.', outputDir: '.', chromeBin: '/no-such-browser/playable' }), /Chrome not found/);
  console.log(`playable-browser unit: ${checks}/${checks} assertions passed (no campaign executed)`);
}
main().catch((e) => { console.error(e.stack || e); process.exitCode = 1; });
