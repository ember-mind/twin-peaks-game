/* page-persistence-browser.js — Living Town: Save / Resume / New world on the real page.
 * Real headless Chrome, the page's own buttons. Not part of run-all.js (no
 * browser there); run on its own, one Chrome driver at a time.
 * node living-town/test/page-persistence-browser.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { launch, sleep } = require('../../test/lib/chrome-cdp.js');
const ROOT = path.resolve(__dirname, '..', '..');
const PAGE = 'living-town/index.html?speed=1x';   // these were written against a page that opens at 1x

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

(async function () {
  const page = await launch({ root: ROOT, width: 1280, height: 900 });
  const js = (code, wait) => page.evaluate(code, !!wait, 60000);
  const status = () => js("document.getElementById('lt-save-status').textContent");
  const click = (id) => js("document.getElementById('" + id + "').click(); true");
  const stored = () => js("localStorage.getItem(LT.Save.DEFAULT_KEY)");
  try {
    console.log('# page: first visit');
    await page.navigate(PAGE); await sleep(1200);
    await js("LT_OBSERVER.speedIndex = 0; true");
    ok(await js("LT_OBSERVER.worlds") === 1 && /new one|Autosaved/.test(await status()), 'no save in this browser: a new world, and the page says so (' + await status() + ')');

    console.log('# page: Save, then a reload resumes');
    await js("(async function(){ await LT_OBSERVER.sim.runUntil(1, 620); return true; })()", true);
    const who = await js("JSON.stringify(LT_OBSERVER.sim.actorIds().map(function(id){ var c = LT_OBSERVER.sim.state.characters[id]; return [c.name, c.appearanceId, c.money, c.savings]; }))");
    await click('lt-save');
    ok(/^Saved at D1 10:20/.test(await status()), 'Save reports success with the town time: ' + await status());
    await page.navigate(PAGE); await sleep(1200);
    await js("LT_OBSERVER.speedIndex = 0; true");
    ok(/Resumed the saved world at D1 10:20/.test(await status()), 'after a reload the page resumes it and says so');
    ok(await js("JSON.stringify(LT_OBSERVER.sim.actorIds().map(function(id){ var c = LT_OBSERVER.sim.state.characters[id]; return [c.name, c.appearanceId, c.money, c.savings]; }))") === who, 'the same people, looks and money');
    ok(await js("LT_OBSERVER.sim.loads") === 1, 'it is a loaded world, not a new one that happens to look alike');

    console.log('# page: New world asks first, and one loop follows the new world');
    const before = await stored();
    const leftAt = await js("LT_OBSERVER.sim.absMinute()");
    await click('lt-new-world');
    ok(await js("!document.getElementById('lt-confirm').hidden") && await stored() === before, 'a question is shown and nothing has been replaced yet');
    await click('lt-confirm-no');
    ok(await js("document.getElementById('lt-confirm').hidden && LT_OBSERVER.worlds === 1") && await stored() === before, 'Cancel changes nothing');
    await click('lt-new-world'); await click('lt-confirm-yes');
    ok(await js("LT_OBSERVER.worlds") === 2 && await js("LT_OBSERVER.sim.state.minute") < 400 && /new world has begun and been saved/.test(await status()), 'Yes: a new world at the start of its day, saved: ' + await status());
    ok(await js("localStorage.getItem(LT.Save.DEFAULT_KEY + '.set-aside')") === before, 'the world it replaced was kept aside, byte for byte');
    await js("LT_OBSERVER.speedIndex = 3; true"); await sleep(3000); await js("LT_OBSERVER.speedIndex = 0; true"); await sleep(100);   // 20x: a minute every 50 ms
    const clocks = JSON.parse(await js("JSON.stringify({ now: LT_OBSERVER.sim.absMinute(), retired: LT_OBSERVER.retired.absMinute(), view: LT_OBSERVER.view.sim === LT_OBSERVER.sim, tabs: document.querySelectorAll('#lt-characters [data-actor]').length, who: document.getElementById('lt-who').textContent, names: LT_OBSERVER.sim.actorIds().map(function(id){ return LT_OBSERVER.sim.state.characters[id].fullName || LT_OBSERVER.sim.state.characters[id].name; }) })"));
    ok(clocks.now > 400 && clocks.retired === leftAt && clocks.view, 'the new world advances (' + clocks.now + '); the one it replaced is no longer being ticked (still ' + clocks.retired + '); the view follows the new one');
    ok(clocks.tabs === clocks.names.length && clocks.names.indexOf(clocks.who) >= 0, 'tabs and panels show the new world\'s people (' + clocks.who + ')');

    console.log('# page: a refused save is shown, kept, and not written over');
    /* Tampered with from another page of the same origin: the town page saves
     * once more as it is left, which would write over a change made under it. */
    await page.navigate('living-town/assets/inhabitants-hg-24.png'); await sleep(500);
    await js("(function(){ var LT = { Save: { DEFAULT_KEY: 'living-town/save' } }; var k = LT.Save.DEFAULT_KEY; localStorage.setItem(k, localStorage.getItem(k).replace(/\"world\":\"[0-9a-f]{8}\"/, '\"world\":\"deadbeef\"')); localStorage.removeItem(k + '.owner'); return true; })()");
    const refusedText = await js("localStorage.getItem('living-town/save')");
    await page.navigate(PAGE); await sleep(1200);
    await js("LT_OBSERVER.speedIndex = 0; true");
    ok(/could not be used and has been left untouched.*different version of the town/.test(await status()), 'the page says the save was refused, and why');
    await js("LT_OBSERVER.speedIndex = 3; true"); await sleep(1200); await js("LT_OBSERVER.speedIndex = 0; true");
    ok(await stored() === refusedText, 'a while later, autosave has not touched it');
    await click('lt-save');
    ok(await js("!document.getElementById('lt-confirm').hidden") && await stored() === refusedText, 'Save asks before replacing it');
    await click('lt-confirm-no');
    ok(await stored() === refusedText, 'and Cancel leaves it exactly as it was');

    console.log('# page: storage that fails is reported as failing');
    await page.navigate(PAGE + '&world=new&cast=pair'); await sleep(1200);
    ok(/address asked for one/.test(await status()) && await stored() === refusedText, '?world=new&cast=pair starts a new world and leaves the stored one alone');
    await js("Storage.prototype.setItem = function () { var e = new Error('full'); e.name = 'QuotaExceededError'; throw e; }; true");
    await click('lt-save'); await click('lt-confirm-yes');
    ok(/Save failed: .*QuotaExceededError/.test(await status()), 'a write the browser refuses shows as a failure: ' + await status());

    console.log('\npage-persistence-browser: ' + checks + '/' + checks);
  } finally { await page.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
