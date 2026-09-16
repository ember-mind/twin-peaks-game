'use strict';

/* Infrastructure test on a tiny fixture, NOT campaign acceptance.
 * CHROME_BIN=/path/to/chrome node test/browser/playable-browser-selftest.js
 * CHROME_NO_SANDBOX=1 is an explicit option for container CI only.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { openPlayableBrowser } = require('../lib/playable-browser.js');

const FIXTURE = `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="icon" href="data:,"><title>Browser boundary fixture - NOT THE GAME</title></head>
<body><p id="objective">Begin fixture</p><div id="narrative"></div>
<button style="position:absolute;left:20px;top:80px;width:150px;height:70px" id="touch">Fixture input</button>
<script>
var saved = JSON.parse(localStorage.getItem('tp_save') || 'null');
var state = { mode: 'title', mapId: 'fixture', player: { tx: saved ? saved.tx : 0, ty: 0, dir: 'right', moving: false },
  flags: saved ? saved.flags : {}, clues: [], dialogue: null, npcs: [], menu: false, fadePhase: 0 };
window.GAME = { Engine: { state: state }, NarrativeProduction: { ready: true, testMode: false },
  NarrativeAdapter: { getState: function () { return { flags: state.flags, values: {}, evidence: {}, nodes_done: {} }; }, active: function () { return false; } },
  Maps: { fixture: { npcs: [] } } };
function save() { localStorage.setItem('tp_save', JSON.stringify({ tx: state.player.tx, flags: state.flags })); }
window.addEventListener('keydown', function (e) {
  if (!e.isTrusted) throw new Error('Fixture refuses synthetic DOM input');
  if (e.code === 'Enter') { state.mode = 'play'; state.flags.started = true; document.querySelector('#objective').textContent = 'Walk fixture'; save(); }
  if (e.code === 'ArrowRight') { state.player.tx++; state.flags.trustedKey = e.isTrusted; save(); }
  if (e.code === 'KeyZ') document.querySelector('#narrative').innerHTML = '<div class="nw-page">Fixture choice</div><div class="nw-opt nw-focus" data-choice-id="fixture-confirm">Confirm</div>';
  if (e.code === 'KeyX') console.error('intentional fixture console error');
  if (e.code === 'KeyM') setTimeout(function () { throw new Error('intentional fixture exception'); }, 0);
  if (e.code === 'KeyT') fetch('/missing-fixture.json');
});
window.addEventListener('keyup', function (e) { state.flags.lastReleased = e.code; });
document.querySelector('#touch').addEventListener('click', function (e) { state.flags.trustedPointer = e.isTrusted; save(); });
</script></body></html>`;

let checks = 0;
function check(fn) { fn(); checks++; }
async function rejects(fn, pattern) { await assert.rejects(fn, pattern); checks++; }
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
function requestStatus(origin, requestPath, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(origin, { path: requestPath, method }, (res) => { res.resume(); resolve(res.statusCode); });
    req.on('error', reject); req.end();
  });
}

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tp-driver-fixture-'));
  const outputRoot = process.env.PLAYABLE_SELFTEST_OUT
    ? path.resolve(process.env.PLAYABLE_SELFTEST_OUT)
    : await fs.mkdtemp(path.join(os.tmpdir(), 'tp-driver-evidence-'));
  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(path.join(root, 'index.html'), FIXTURE);
  await fs.mkdir(path.join(root, '.hidden'));
  await fs.writeFile(path.join(root, '.hidden', 'private.txt'), 'not served');
  const outside = path.join(outputRoot, 'outside.txt');
  await fs.writeFile(outside, 'outside root');
  await fs.symlink(outside, path.join(root, 'escape.txt'));
  const common = { root, noSandbox: process.env.CHROME_NO_SANDBOX === '1', timeoutMs: 15000 };
  let browser;
  try {
    const out1 = path.join(outputRoot, 'desktop');
    browser = await openPlayableBrowser({ ...common, outputDir: out1 });
    check(() => assert.deepEqual(Object.keys(browser).sort(), ['capture', 'close', 'press', 'reload', 'snapshot', 'tap', 'waitFor']));
    check(() => assert.equal(Object.isFrozen(browser), true));
    check(() => assert.equal(browser.evaluate, undefined));
    check(() => assert.equal(browser.seed, undefined));
    check(() => assert.equal(browser.travel, undefined));
    let snapshot = await browser.snapshot();
    check(() => assert.equal(snapshot.mode, 'title'));
    check(() => assert.deepEqual(snapshot.saves, {}));
    check(() => assert.equal(snapshot.testMode, false));
    snapshot.flags.injected = true; snapshot.player.tx = 999;
    const unchanged = await browser.snapshot();
    check(() => assert.equal(unchanged.flags.injected, undefined));
    check(() => assert.equal(unchanged.player.tx, 0));
    await rejects(() => browser.press('F12'), /Unsupported player key/);
    await rejects(() => browser.press('KeyZ', -1), /holdMs/);
    await rejects(() => browser.tap(-1, 0), /x must/);
    await rejects(() => browser.capture('../escape'), /Invalid capture label/);
    await rejects(() => browser.waitFor('invalid async predicate', async () => false), /synchronous boolean/);
    await rejects(() => browser.waitFor('invalid truthy predicate', () => 'false'), /synchronous boolean/);
    await browser.press('Enter');
    await browser.waitFor('fixture started', (s) => s.mode === 'play');
    await browser.press('ArrowRight');
    snapshot = await browser.waitFor('trusted key and release', (s) => s.player.tx === 1 && s.flags.lastReleased === 'ArrowRight');
    check(() => assert.equal(snapshot.flags.trustedKey, true));
    check(() => assert.equal(JSON.parse(snapshot.saves.tp_save).tx, 1));
    await browser.press('KeyZ');
    snapshot = await browser.waitFor('fixture semantic UI', (s) => s.semanticUi.choices.length === 1);
    check(() => assert.equal(snapshot.semanticUi.page, 'Fixture choice'));
    check(() => assert.equal(snapshot.semanticUi.choices[0].id, 'fixture-confirm'));
    check(() => assert.equal(snapshot.semanticUi.choices[0].focused, true));
    const shot = await browser.capture('choice');
    const png = await fs.readFile(path.join(out1, shot.prefix + '.png'));
    check(() => assert.equal(png.subarray(1, 4).toString(), 'PNG'));
    const beforeSave = (await browser.snapshot()).saves.tp_save;
    snapshot = await browser.reload();
    check(() => assert.equal(snapshot.mode, 'title')); // Never choose Continue secretly.
    check(() => assert.equal(snapshot.player.tx, 1));
    check(() => assert.equal(snapshot.saves.tp_save, beforeSave));
    await browser.press('Enter');
    await browser.tap(75, 115);
    snapshot = await browser.waitFor('trusted mouse input', (s) => s.flags.trustedPointer === true);
    check(() => assert.equal(snapshot.flags.trustedPointer, true));

    const meta = JSON.parse(await fs.readFile(path.join(out1, 'session.json'), 'utf8')).metadata;
    const origin = new URL(meta.url).origin;
    check(() => assert.equal(new URL(meta.url).pathname, '/index.html'));
    check(() => assert.equal(new URL(meta.url).search, ''));
    const statuses = await Promise.all([
      requestStatus(origin, '/.hidden/private.txt'), requestStatus(origin, '/%2e%2e/outside.txt'),
      requestStatus(origin, '/escape.txt'), requestStatus(origin, '/%ZZ'),
      requestStatus(origin, '/index.html', 'POST'), requestStatus(origin, '/missing.json')
    ]);
    check(() => assert.deepEqual(statuses, [403, 403, 403, 400, 405, 404]));

    await browser.press('KeyX'); await browser.press('KeyM'); await browser.press('KeyT');
    await delay(250);
    await rejects(() => browser.waitFor('deliberately impossible fixture milestone', () => false, 100), /Timed out waiting/);
    await browser.close(); await browser.close();
    await rejects(() => browser.snapshot(), /closed/);
    browser = null;
    const evidence = JSON.parse(await fs.readFile(path.join(out1, 'session.json'), 'utf8'));
    check(() => assert.equal(evidence.metadata.campaignVerdict, 'NOT_EVALUATED'));
    check(() => assert.equal(evidence.metadata.lastFailure.kind, 'timeout'));
    check(() => assert.ok(evidence.metadata.closedAt));
    check(() => assert.ok(evidence.faults.some((f) => f.type === 'console' && /intentional fixture/.test(f.text))));
    check(() => assert.ok(evidence.faults.some((f) => f.type === 'exception')));
    check(() => assert.ok(evidence.faults.some((f) => f.type === 'http' && f.status === 404 && /missing-fixture/.test(f.url))));
    check(() => assert.ok(evidence.events.some((e) => e.type === 'capture' && e.label === 'timeout')));
    await rejects(() => openPlayableBrowser({ ...common, outputDir: out1 }), /EEXIST/);
    await rejects(() => fetch(meta.url, { signal: AbortSignal.timeout(1000) }), /fetch failed|aborted/i);

    const out2 = path.join(outputRoot, 'mobile');
    browser = await openPlayableBrowser({ ...common, outputDir: out2, width: 390, height: 844, mobile: true });
    snapshot = await browser.snapshot();
    check(() => assert.equal(snapshot.player.tx, 0));
    check(() => assert.deepEqual(snapshot.saves, {}));
    await browser.tap(75, 115);
    await browser.waitFor('trusted touch input', (s) => s.flags.trustedPointer === true);
    checks++;
    await browser.close(); browser = null;

    if (process.platform !== 'win32') {
      const brokenChrome = path.join(root, 'broken-chrome');
      await fs.writeFile(brokenChrome, '#!/bin/sh\nexit 9\n', { mode: 0o755 });
      const out3 = path.join(outputRoot, 'startup-failure');
      await rejects(() => openPlayableBrowser({ ...common, chromeBin: brokenChrome, outputDir: out3 }), /Chrome exited/);
      const failed = JSON.parse(await fs.readFile(path.join(out3, 'session.json'), 'utf8'));
      check(() => assert.equal(failed.metadata.lastFailure.kind, 'startup'));
      check(() => assert.ok(failed.metadata.closedAt));
    }
    console.log(`playable-browser selftest: ${checks}/${checks} assertions passed on FIXTURE ONLY`);
    console.log(`Evidence: ${outputRoot}`);
  } finally {
    if (browser) await browser.close();
    await fs.rm(root, { recursive: true, force: true });
  }
}
main().catch((e) => { console.error(e.stack || e); process.exitCode = 1; });
