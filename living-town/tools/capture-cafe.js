#!/usr/bin/env node
/* capture-cafe.js — native-scale evidence frames for the café visual-reuse slice.
 * Real headless Chrome, real pages, real canvases read back at 256x192.
 *   node living-town/tools/capture-cafe.js reference   -> Twin Peaks diner
 *   node living-town/tools/capture-cafe.js cafe <tag>  -> Living Town café still + activity sequence
 *   node living-town/tools/capture-cafe.js continuity  -> one inhabitant followed through every place, and a mid-walk reload
 * Run one Chrome driver at a time. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { launch, sleep } = require('../../test/lib/chrome-cdp.js');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'artifacts', 'living-town-cafe');
fs.mkdirSync(OUT, { recursive: true });

function save(name, dataUrl) {
  const b64 = String(dataUrl).replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(path.join(OUT, name), Buffer.from(b64, 'base64'));
  console.log('  wrote artifacts/living-town-cafe/' + name);
}

async function reference(page) {
  await page.navigate('index.html');
  await sleep(2500);
  for (let i = 0; i < 8; i++) {
    if (await page.evaluate("GAME.Engine.state.mode") === 'play') break;
    await page.press('Enter', 'Enter', 13);
    await sleep(600);
  }
  await page.evaluate("GAME.Engine.loadMap('diner', 6, 7, 'up'); GAME.Engine.state.mode = 'play'; true");
  await sleep(1200);
  /* Entering the diner opens story dialogue. It is read through, not removed:
   * the frame wanted is the room as the game shows it in play. */
  for (let i = 0; i < 40; i++) {
    const busy = await page.evaluate("!!(GAME.Engine.state.dialogue || GAME.Engine.state.menu || (GAME.NarrativeAdapter && GAME.NarrativeAdapter.active && GAME.NarrativeAdapter.active()))");
    if (!busy) break;
    await page.press('Enter', 'Enter', 13);
    await sleep(350);
  }
  await sleep(600);
  const info = await page.evaluate("JSON.stringify({ map: GAME.Engine.state.mapId, dialogue: !!GAME.Engine.state.dialogue, npcs: GAME.Engine.state.npcs.map(function(n){return n.id+'@'+n.x+','+n.y}) })");
  console.log('  reference: ' + info);
  save('01-reference-twin-peaks-diner.png', await page.evaluate("document.getElementById('game').toDataURL('image/png')"));
}

const SHOT = "document.getElementById('lt-canvas').toDataURL('image/png')";
async function runTo(page, minute) {
  await page.evaluate("(async function(){ var st = LT_OBSERVER; st.speedIndex = 0; await st.sim.runUntil(1, " + minute + "); st.view.focus('resident_a'); for (var i=0;i<40;i++) st.view.update(33); st.view.draw(); return true; })()", true, 120000);
}
async function describe(page) {
  return page.evaluate("JSON.stringify(LT_OBSERVER.sim.actorIds().map(function(id){var c=LT_OBSERVER.sim.state.characters[id];return c.name+' ['+c.appearanceId+'] '+c.location+' '+c.pos.x+','+c.pos.y+' '+c.pos.dir+' '+(c.activity?c.activity.actionId:'-')})) + ' @' + LT_OBSERVER.sim.stamp()");
}

async function frames(page, tag, from, ticks, start) {
  let n = start;
  await runTo(page, from);
  for (let f = 0; f < ticks; f++) {
    await page.evaluate("(function(){ LT_OBSERVER.sim.tick(); return true; })()");
    await sleep(30);
    for (let k = 0; k < 2; k++) {
      await page.evaluate("(function(){ var st = LT_OBSERVER; for (var i=0;i<4;i++) st.view.update(33); st.view.draw(); return true; })()");
      save(tag + '-seq-' + String(n++).padStart(2, '0') + '.png', await page.evaluate(SHOT));
    }
  }
  return n;
}

async function cafe(page, tag) {
  await page.navigate('living-town/index.html');
  await sleep(1500);
  console.log('  renderer host: ' + await page.evaluate("JSON.stringify(window.LT && LT.ProductionHost ? { ready: LT.ProductionHost.ready, failed: LT.ProductionHost.failed } : 'absent')"));
  /* Everything below is the page's own simulation on its own clock. Nothing
   * is posed: the capture only chooses when to look. Three real moments are
   * joined into one sequence — she comes in, she goes to work, she orders. */
  await runTo(page, 497);
  console.log('  arriving: ' + await describe(page));
  let n = await frames(page, tag, 497, 4, 0);          // 08:17 → through the door
  n = await frames(page, tag, 547, 16, n);             // 09:07 → she takes up the shift and goes round the counter
  await runTo(page, 600);
  console.log('  at work: ' + await describe(page));
  save(tag + '-living-town-cafe.png', await page.evaluate(SHOT));
  n = await frames(page, tag, 1170, 11, n);            // 19:30 → extra shift ends, out to the customer side
  console.log('  ordering: ' + await describe(page));
  save(tag + '-living-town-cafe-ordering.png', await page.evaluate(SHOT));
  console.log('  lettering not supported by the kit: ' + await page.evaluate("JSON.stringify(GAME.Retro2D.unsupportedGlyphs)"));
}

/* The same person at home, on the street, at work and in the park, as the day
 * puts them there; then the page's own world saved and reloaded while they are
 * half way round the counter, and looked at again. */
async function continuity(page) {
  await page.navigate('living-town/index.html');
  await sleep(1500);
  const stops = [['home', 365], ['street', 492], ['cafe', 600], ['park', 1052]];
  for (const [name, minute] of stops) {
    await runTo(page, minute);
    console.log('  ' + name + ': ' + await describe(page) + ' ' + await page.evaluate("JSON.stringify(LT_OBSERVER.view.draw())"));
    save('05-continuity-' + name + '.png', await page.evaluate(SHOT));
  }
  await page.navigate('living-town/index.html');
  await sleep(1500);
  await runTo(page, 552);
  console.log('  before reload: ' + await describe(page));
  console.log('  reload: ' + await page.evaluate("(async function(){ var st = LT_OBSERVER, a = st.sim.state.characters.resident_a; var was = JSON.stringify([a.name, a.appearanceId, a.pos, a.walkTarget, a.activity && a.activity.actionId, a.money]); var ok = LT.Save.writeLocal(st.sim); var r = LT.Save.readLocal(); if (r.status !== 'loaded') return 'REFUSED ' + r.reason; st.sim = r.sim; st.view.sim = r.sim; var b = r.sim.state.characters.resident_a; var now = JSON.stringify([b.name, b.appearanceId, b.pos, b.walkTarget, b.activity && b.activity.actionId, b.money]); await r.sim.runMinutes(12); for (var i=0;i<60;i++) st.view.update(33); st.view.draw(); return (ok && was === now ? 'same person, same step: ' : 'DIFFERENT: ' + was + ' vs ') + now; })()", true, 60000));
  console.log('  after reload: ' + await describe(page));
  save('05-continuity-after-reload.png', await page.evaluate(SHOT));
}

(async function () {
  const mode = process.argv[2] || 'cafe';
  const page = await launch({ root: ROOT, width: 1200, height: 800 });
  try {
    if (mode === 'reference') await reference(page);
    else if (mode === 'continuity') await continuity(page);
    else await cafe(page, process.argv[3] || '02-before');
  } finally { await page.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
