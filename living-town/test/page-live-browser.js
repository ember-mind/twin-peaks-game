/* page-live-browser.js — Living Town: the real page, served by the town server.
 * A town server starts in this process on a fast clock; real headless Chrome
 * opens the page from it. The page must offer no speed, save or new world,
 * ask for a name, mirror the town frame by frame, send the hand to the
 * server and show what it cost, and make following someone public. The
 * browser's own saved world is never touched. Not part of run-all.js; one
 * Chrome driver at a time.
 * node living-town/test/page-live-browser.js [--shots]
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { launch, sleep } = require('../../test/lib/chrome-cdp.js');
const Server = require(path.resolve(__dirname, '..', 'server', 'town-server.js'));
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'artifacts', 'living-town-live');
const SHOTS = process.argv.includes('--shots');

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

(async function () {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lt-live-page-'));
  const town = Server.createTown({ data: dataDir, speed: 300, seed: 20260922, paused: false, dev: true });   // a town minute every 200 ms; --dev so the pace buttons can be checked
  const server = Server.createServer(town, {});
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  town.start();

  const page = await launch({ root: ROOT, width: 1280, height: 1100 });
  const js = (code, wait) => page.evaluate(code, !!wait, 120000);
  const txt = (id) => js("document.getElementById('" + id + "').textContent");
  const hidden = (sel) => js("(function(){ var n = document.querySelector('" + sel + "'); while (n) { if (n.hidden) return true; n = n.parentElement; } return false; })()");
  async function shot(name) {
    if (!SHOTS) return;
    fs.mkdirSync(OUT, { recursive: true });
    await sleep(250);
    const r = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, name), Buffer.from(r.data, 'base64'));
    console.log('  wrote artifacts/living-town-live/' + name);
  }
  try {
    await page.send('Page.navigate', { url: base + '/living-town/' });
    await sleep(1500);
    console.log('# served live: no speed, no save, a name asked for');
    ok(await js("document.querySelector('meta[name=lt-live]').content") === '/api', 'the page carries the live marker');
    ok(await hidden('#lt-speeds') && await hidden('#lt-save') && await hidden('#lt-new-world'), 'speed, save and new world are not offered');
    ok(!(await hidden('#lt-live-join-row')) && /Give a name/.test(await txt('lt-live-status')), 'a name is asked for: ' + await txt('lt-live-status'));
    ok(await js("LT_OBSERVER.live.status") === 'join' && await js("LT_OBSERVER.live.mirror") === null, 'no town is mirrored before joining');
    ok(await js("['lt-canvas','lt-characters','lt-hand','lt-clock'].every(function (id) { return document.getElementById(id).getClientRects().length === 0; }) && document.querySelector('aside').getClientRects().length === 0"), 'and none is shown: no picture, no names, no panels, no clock');
    await shot('01-asked-for-a-name.png');
    await js("document.getElementById('lt-live-join').click(); true"); await sleep(300);
    ok(/A name, please/.test(await txt('lt-live-note')), 'Watch without a name is refused in words');
    await js("document.getElementById('lt-live-name').value = 'Ada'; document.getElementById('lt-live-join').click(); true");
    await sleep(1200);

    console.log('# the town arrives and moves on its own clock');
    ok(await js("LT_OBSERVER.live.status") === 'live' && /^Live · 1 watching/.test(await txt('lt-live-status')), 'live, one watching: ' + await txt('lt-live-status'));
    ok(await js("getComputedStyle(document.getElementById('lt-canvas')).display") !== 'none' && await js("getComputedStyle(document.querySelector('aside')).display") !== 'none', 'now the town is on screen');
    ok(await js("LT_OBSERVER.sim === LT_OBSERVER.live.mirror.sim"), 'the page follows the mirror');
    ok(await js("LT_OBSERVER.sim.actorIds().every(function (id) { return LT_OBSERVER.sim.state.characters[id].policyId === 'live_fed'; })"), 'nobody on the page decides anything');
    const absA = await js("LT_OBSERVER.sim.absMinute()");
    const clockA = await txt('lt-clock');
    await sleep(1500);
    const absB = await js("LT_OBSERVER.sim.absMinute()");
    ok(absB > absA && absB === town.sim.absMinute() && await txt('lt-clock') !== clockA, 'the clock on the page is the server\'s (' + clockA + ' → ' + await txt('lt-clock') + ')');
    ok(await js("LT_OBSERVER.live.frames") >= 5 && await js("LT_OBSERVER.live.resyncs") === 0, 'frames applied, none diverged (' + await js("LT_OBSERVER.live.frames") + ')');
    const fpPage = await js("LT.Live.fingerprint(LT_OBSERVER.sim)");
    ok(fpPage === global.LT.Live.fingerprint(town.sim) || (await js("LT_OBSERVER.sim.absMinute()")) !== town.sim.absMinute(), 'the page\'s fingerprint is the town\'s at the same minute');
    ok(/purse/.test(await txt('lt-live-you')) && /●●●●●/.test(await txt('lt-live-you')), 'Ada has a full purse: ' + (await txt('lt-live-you')).replace(/\s+/g, ' '));
    ok(/\(1\)$/.test(await js("document.querySelector('#lt-hand-what option[value=leave_book]').textContent")), 'each entry of the hand shows its price');
    ok(await js("localStorage.getItem(LT.Save.DEFAULT_KEY)") === null, 'the browser\'s own saved world is untouched');
    await shot('02-live.png');

    console.log('# the hand goes to the server');
    const pick = (id, value) => js("(function(){ var n = document.getElementById('" + id + "'); n.value = '" + value + "'; n.dispatchEvent(new Event('change')); return n.value; })()");
    await pick('lt-hand-what', 'leave_book');
    await js("document.querySelector('#lt-hand-fields select').value = 'park_bench_sw'; true");
    await js("document.getElementById('lt-hand-do').click(); true"); await sleep(600);
    ok(/^Arranged for D1 \d\d:\d\d \(1 spent, 4 left\)/.test(await txt('lt-hand-status')), 'Do it: arranged, and what it cost (' + await txt('lt-hand-status') + ')');
    ok(town.sim.state.interventions.some((r) => r.source === 'watcher' && r.type === 'place_shared_book'), 'the server\'s town has the book in its register');
    await sleep(500);
    ok(await js("LT_OBSERVER.sim.state.interventions.some(function (r) { return r.source === 'watcher' && r.type === 'place_shared_book'; })"), 'so does the page\'s');
    ok(/by Ada/.test(await txt('lt-hand-asked')), 'the register on the page says who: ' + (await txt('lt-hand-asked')).replace(/\s+/g, ' ').slice(0, 90));
    ok(/●●●●○/.test(await txt('lt-live-you')), 'the purse shows one spent');
    await js("document.getElementById('lt-hand-do').click(); true"); await sleep(600);
    ok(/^Not done: /.test(await txt('lt-hand-status')) && /●●●●○/.test(await txt('lt-live-you')), 'the same again is refused and nothing more is charged (' + await txt('lt-hand-status') + ')');
    await shot('03-a-book-by-ada.png');

    console.log('# following is public');
    await js("document.querySelector('[data-actor=resident_b]').click(); true"); await sleep(500);
    const nameB = await js("LT_OBSERVER.sim.state.characters.resident_b.name");
    ok(new RegExp('following ' + nameB).test(await txt('lt-live-you')), 'Ada follows ' + nameB + ' and the bar says so');
    ok(town.spectators.present()[0].adopted === 'resident_b', 'the server knows');
    ok(await js("document.querySelector('[data-actor=resident_b] .lt-followers') !== null"), 'the tab shows a follower');
    ok(/Here: Ada/.test(await txt('lt-live-people')), 'who is here is listed');
    await shot('04-following.png');

    console.log('# --dev: the pace from the page');
    ok(!(await hidden('#lt-live-dev')) && await js("document.querySelectorAll('#lt-live-dev button').length") === 6, 'with --dev the page shows Pause, 1x, 6x, 60x, 600x and One minute');
    ok(/dev, a minute every 0\.2 s/.test(await txt('lt-live-status')), 'the bar says the pace: ' + await txt('lt-live-status'));
    await js("document.querySelector('#lt-live-dev button[data-speed=\"0\"]').click(); true"); await sleep(400);
    const held = town.sim.absMinute();
    ok(town.clock.paused && /Paused by the town/.test(await txt('lt-live-status')), 'Pause pauses the server\'s clock');
    await js("document.getElementById('lt-live-step').click(); true"); await sleep(400);
    ok(town.sim.absMinute() === held + 1 && await js("LT_OBSERVER.sim.absMinute()") === held + 1, 'One minute moves the town and the page by one');
    await js("document.querySelector('#lt-live-dev button[data-speed=\"600\"]').click(); true"); await sleep(600);
    ok(!town.clock.paused && town.clock.msPerMinute === 100 && town.sim.absMinute() > held + 3 && /a minute every 0\.1 s/.test(await txt('lt-live-status')), '600x runs and the bar says so');
    await js("document.querySelector('#lt-live-dev button[data-speed=\"300\"]') || document.querySelector('#lt-live-dev button[data-speed=\"60\"]').click(); true"); await sleep(200);

    console.log('# reload: known by the cookie, back in without a name');
    await page.send('Page.navigate', { url: base + '/living-town/' });
    await sleep(1500);
    ok(await js("LT_OBSERVER.live.status") === 'live' && await hidden('#lt-live-join-row'), 'no name asked twice');
    ok(await js("LT_OBSERVER.selected") === 'resident_b', 'the page opens on whoever she follows');
    ok(await js("LT_OBSERVER.live.resyncs") === 0 && await js("LT_OBSERVER.sim.absMinute()") >= absB, 'the fresh mirror is the town now, not the town then');
    console.log('# ' + checks + '/' + checks);
  } finally {
    await page.close();
    town.stop();
    await new Promise((r) => server.close(r));
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
})().catch((e) => { console.error(e); process.exit(1); });
