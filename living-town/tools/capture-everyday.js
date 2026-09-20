#!/usr/bin/env node
/* capture-everyday.js — the book and the parcel on the real page, in real Chrome.
 * The page's own default day, both inhabitants on UtilityPolicy, nothing posed:
 * the tool chooses when to look, presses Save, reloads, and reads state.
 *   node living-town/tools/capture-everyday.js
 * Frames go to artifacts/living-town-everyday/. One Chrome driver at a time. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { launch, sleep } = require('../../test/lib/chrome-cdp.js');
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'artifacts', 'living-town-everyday');
fs.mkdirSync(OUT, { recursive: true });

const CANVAS = "document.getElementById('lt-canvas').toDataURL('image/png')";
function write(name, dataUrl) { fs.writeFileSync(path.join(OUT, name), Buffer.from(String(dataUrl).replace(/^data:image\/png;base64,/, ''), 'base64')); console.log('  wrote ' + name); }
const LOOK = (who) => `(function(){ var st = LT_OBSERVER, id = st.sim.actorIds()[${who}]; st.selected = id; st.view.focus(id); st.view.observe(); for (var i=0;i<40;i++) st.view.update(33); return JSON.stringify(st.view.draw()); })()`;
const THINGS = `(function(){ var s = LT_OBSERVER.sim; return JSON.stringify({ stamp: s.stamp(), things: s.state.objects.filter(function(o){return o.typeId}).map(function(o){ return { id: o.id, readBy: o.readBy, inUseBy: o.inUseBy, status: o.status, contentsLeft: o.contentsLeft }; }),
  people: s.actorIds().map(function(id){ var c = s.state.characters[id]; return c.name + ' ' + c.location + ' ' + (c.activity ? c.activity.actionId + '/' + c.activity.phase : '-') + ' pantry ' + c.pantry; }) }); })()`;
const runTo = (page, day, minute) => page.evaluate("(async function(){ var st = LT_OBSERVER; st.speedIndex = 0; await st.sim.runUntil(" + day + ", " + minute + "); return true; })()", true, 240000);

(async function () {
  const page = await launch({ root: ROOT, width: 1280, height: 900 });
  try {
    await page.navigate('living-town/index.html?speed=1x&world=new&cast=pair');
    await sleep(1500);
    const shots = [
      ['01-book-on-the-bench-closed', 1, 875, 1], ['02-book-being-read-open', 1, 900, 1],
      ['03-parcel-inside-the-door-sealed', 1, 1290, 0], ['04-parcel-opened-empty', 2, 430, 0]
    ];
    let saved = null;
    for (const [name, day, minute, who] of shots) {
      await runTo(page, day, minute);
      console.log('  ' + name + ': ' + await page.evaluate(LOOK(who)) + '\n      ' + await page.evaluate(THINGS));
      write(name + '.png', await page.evaluate(CANVAS));
      if (name.indexOf('02-') === 0) {
        saved = await page.evaluate(THINGS);
        await page.evaluate("document.getElementById('lt-save').click(); true"); await sleep(200);
        console.log('  Save pressed mid-reading: ' + await page.evaluate("document.getElementById('lt-save-status').textContent"));
        await page.navigate('living-town/index.html?speed=1x'); await sleep(1500);
        await page.evaluate("LT_OBSERVER.speedIndex = 0; true");
        console.log('  after reload: ' + await page.evaluate("document.getElementById('lt-save-status').textContent"));
        const back = JSON.parse(await page.evaluate(THINGS)), was = JSON.parse(saved);
        const b0 = was.things.find((t) => t.id === 'book_park'), b1 = back.things.find((t) => t.id === 'book_park');
        console.log('      saved:    ' + JSON.stringify(b0) + '\n      reloaded: ' + JSON.stringify(b1) + ' @' + back.stamp);
        console.log(b1.inUseBy === b0.inUseBy && b1.readBy.resident_b >= b0.readBy.resident_b && b1.readBy.resident_b - b0.readBy.resident_b <= 12
          ? '  SAME reader, same copy, reading carried on from where it was' : '  DIFFERENT after reload');
        console.log('  ' + await page.evaluate(LOOK(1)));
        write('02b-after-reload-still-reading.png', await page.evaluate(CANVAS));
      }
    }
  } finally { await page.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
