#!/usr/bin/env node
/* capture-poses.js — the town as the page draws it, at moments when people are
 * in a pose and at four hours of the day. Native 256x192 canvas frames.
 * Nothing is posed by this tool: it runs the page's own world and looks.
 *   node living-town/tools/capture-poses.js
 * One Chrome driver at a time (mkdir /tmp/lt-chrome.lock). */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { launch, sleep } = require('../../test/lib/chrome-cdp.js');
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'artifacts', 'living-town-poses');
fs.mkdirSync(OUT, { recursive: true });

(async function () {
  const page = await launch({ root: ROOT, width: 1200, height: 800 });
  const js = (code, wait) => page.evaluate(code, !!wait, 120000);
  const save = async (name) => {
    const url = await js("document.getElementById('lt-canvas').toDataURL('image/png')");
    fs.writeFileSync(path.join(OUT, name), Buffer.from(String(url).replace(/^data:image\/png;base64,/, ''), 'base64'));
    console.log('  wrote artifacts/living-town-poses/' + name);
  };
  const look = (day, minute, who) => js("(async function(){ var st = LT_OBSERVER; st.speedIndex = 0; await st.sim.runUntil(" + day + ", " + minute + "); st.selected = '" + who + "'; st.view.focus('" + who + "'); for (var i=0;i<60;i++) st.view.update(33); return JSON.stringify(st.view.draw()); })()", true);
  try {
    await page.navigate('living-town/index.html?speed=1x&world=new'); await sleep(1500);
    console.log('  poses sheet: ' + await js("JSON.stringify({ ready: !!(LT.ActivityPoses && LT.ActivityPoses.ready), failed: LT.ActivityPoses && LT.ActivityPoses.failed || null })"));
    const stops = [['01-dawn-asleep', 1, 370, 'resident_a'], ['02-morning-park-bench-and-book', 1, 640, 'resident_d'], ['03-noon-cafe', 1, 780, 'resident_c'],
                   ['04-dusk-park-talking', 1, 1065, 'resident_a'], ['05-evening-cafe', 1, 1180, 'resident_c'], ['06-night-asleep', 1, 1400, 'resident_b']];
    for (const [name, d, m, who] of stops) { console.log('  ' + name + ': ' + await look(d, m, who)); await save(name + '.png'); }
  } finally { await page.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
