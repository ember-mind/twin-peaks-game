#!/usr/bin/env node
/* capture-interaction.js — acceptance evidence, from the real page in real Chrome.
 * One sitting: the page's own world runs to the late afternoon; one inhabitant
 * decides to go over to the other, who answers through their own policy; they
 * talk side by side; the world is saved with the page's Save button; the page
 * is reloaded; and the town that comes back is compared with the one that was
 * saved. Nothing is posed or injected: the tool chooses when to look, presses
 * the page's buttons, and reads state.
 *   node living-town/tools/capture-interaction.js
 * Frames go to artifacts/living-town-interactions/. One Chrome driver at a time. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { launch, sleep } = require('../../test/lib/chrome-cdp.js');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'artifacts', 'living-town-interactions');
fs.mkdirSync(OUT, { recursive: true });
const PAGE = 'living-town/index.html?speed=1x&cast=pair';   // the two-person world this sequence was written for

function write(name, dataUrl) {
  fs.writeFileSync(path.join(OUT, name), Buffer.from(String(dataUrl).replace(/^data:image\/png;base64,/, ''), 'base64'));
}
const CANVAS = "document.getElementById('lt-canvas').toDataURL('image/png')";
const SNAPSHOT = `(function(){ var st = LT_OBSERVER, s = st.sim.state; var out = { stamp: st.sim.stamp(), people: {}, conversations: s.conversations.map(function(c){ return [c.id, c.status, c.startAbs, c.endAbs]; }) };
  st.sim.actorIds().forEach(function(id){ var c = s.characters[id]; out.people[id] = { name: c.name, look: c.appearanceId, at: c.location + ' ' + c.pos.x + ',' + c.pos.y, money: c.money, savings: c.savings,
    commitments: c.commitments.map(function(k){ return k.id + ':' + k.status; }), goals: c.goals.map(function(g){ return g.id + ':' + g.progress; }), relationships: c.relationships, lastTalk: c.lastTalk || null }; });
  return JSON.stringify(out); })()`;
const MOMENT = `(function(){ var st = LT_OBSERVER, s = st.sim.state, ids = st.sim.actorIds(); var a = s.characters[ids[0]], b = s.characters[ids[1]];
  var conv = s.conversations[s.conversations.length - 1];
  return JSON.stringify({ stamp: st.sim.stamp(), a: a.name + ' ' + a.location + ' ' + a.pos.x + ',' + a.pos.y + ' ' + (a.activity ? a.activity.actionId + '/' + a.activity.phase : '-'),
    b: b.name + ' ' + b.location + ' ' + b.pos.x + ',' + b.pos.y + ' ' + (b.activity ? b.activity.actionId + '/' + b.activity.phase + ' by ' + b.activity.source : '-'),
    distance: a.location === b.location ? Math.abs(a.pos.x - b.pos.x) + Math.abs(a.pos.y - b.pos.y) : null, conversation: conv ? conv.id + ':' + conv.status : null }); })()`;

async function tickAndShoot(page, n, label) {
  await page.evaluate("(async function(){ var st = LT_OBSERVER; await st.sim.runMinutes(1); st.view.observe(); for (var i=0;i<10;i++) st.view.update(33); st.view.draw(); return true; })()", true, 30000);
  write('seq-' + String(n).padStart(3, '0') + '.png', await page.evaluate(CANVAS));
  const m = JSON.parse(await page.evaluate(MOMENT));
  if (label) console.log('  ' + label + ': ' + JSON.stringify(m));
  return m;
}

(async function () {
  const page = await launch({ root: ROOT, width: 1280, height: 900 });
  try {
    await page.navigate(PAGE);
    await sleep(1500);
    console.log('  start: ' + await page.evaluate("document.getElementById('lt-save-status').textContent"));
    /* Pause the page's own clock and drive the same sim by whole minutes, so
     * every frame is a known minute. Follow the second inhabitant: the park is
     * where they wait. */
    await page.evaluate("(async function(){ var st = LT_OBSERVER; st.speedIndex = 0; await st.sim.runUntil(1, 1015); st.selected = st.sim.actorIds()[1]; st.view.focus(st.selected); return true; })()", true, 120000);
    let n = 0, m = null, seen = {};
    for (let i = 0; i < 90; i++) {
      m = await tickAndShoot(page, n++);
      const key = (m.conversation || 'none') + '|' + m.a.split(' ').pop();
      if (!seen[key]) { seen[key] = true; console.log('  ' + JSON.stringify(m)); }
      if (m.conversation && /completed|declined|unanswered|broken_off/.test(m.conversation)) break;
    }
    const events = await page.evaluate("JSON.stringify(LT_OBSERVER.sim.state.events.filter(function(e){ return /TALK|ACTIVITY_FAILED/.test(e.type) || (e.type === 'ACTIVITY_STARTED' && /talk|conversation/.test(e.data.actionId)); }).map(function(e){ return e.stamp + ' ' + e.type + ' [' + (e.data.source || '') + '] ' + e.text; }))");
    console.log('  events: ' + JSON.parse(events).join('\n          '));

    const before = await page.evaluate(SNAPSHOT);
    await page.evaluate("document.getElementById('lt-save').click(); true");
    await sleep(200);
    console.log('  after pressing Save: ' + await page.evaluate("document.getElementById('lt-save-status').textContent"));
    const shot1 = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, 'page-saved.png'), Buffer.from(shot1.data, 'base64'));

    await page.navigate(PAGE);             // a real reload: a new page, a new process-side world
    await sleep(1800);
    await page.evaluate("LT_OBSERVER.speedIndex = 0; true");
    const status = await page.evaluate("document.getElementById('lt-save-status').textContent");
    console.log('  after reload: ' + status);
    await page.evaluate("(function(){ var st = LT_OBSERVER; st.selected = st.sim.actorIds()[1]; st.view.focus(st.selected); for (var i=0;i<10;i++) st.view.update(33); st.view.draw(); return true; })()");
    const after = await page.evaluate(SNAPSHOT);
    const shot2 = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, 'page-reloaded.png'), Buffer.from(shot2.data, 'base64'));
    /* The reloaded page is already running again by the time it can be asked,
     * so the clock and where people stand have moved on. What must not have
     * moved is who they are and what has happened to them, and the page must
     * say it resumed at the minute that was saved. */
    const lasting = (text) => { const o = JSON.parse(text); Object.keys(o.people).forEach((id) => { delete o.people[id].at; }); delete o.stamp; return JSON.stringify(o); };
    console.log('  saved   : ' + before);
    console.log('  reloaded: ' + after);
    const savedStamp = JSON.parse(before).stamp;
    const same = lasting(before) === lasting(after) && status.indexOf(savedStamp) >= 0;
    console.log(same ? '  SAME: resumed at ' + savedStamp + ' with the same names, looks, money, promises, goals, relationships and the one completed conversation'
                     : '  DIFFERENT after reload');
    /* and the town goes on from there, on one loop */
    const went = await page.evaluate("(async function(){ var st = LT_OBSERVER; var t0 = st.sim.absMinute(); await st.sim.runMinutes(30); return JSON.stringify({ from: t0, to: st.sim.absMinute(), talked: st.sim.state.events.filter(function(e){return e.type==='TALKED'}).length, worlds: st.worlds }); })()", true, 60000);
    console.log('  carried on: ' + went);

    const ff = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '6', '-i', path.join(OUT, 'seq-%03d.png'),
      '-vf', 'scale=512:384:flags=neighbor,split[a][b];[a]palettegen=max_colors=64[p];[b][p]paletteuse=dither=none', path.join(OUT, 'meeting-sequence.gif')]);
    if (ff.status === 0) { fs.readdirSync(OUT).filter((f) => /^seq-\d+\.png$/.test(f)).forEach((f, i, all) => { if (i !== 0 && i !== all.length - 1 && i % 12) fs.unlinkSync(path.join(OUT, f)); }); console.log('  wrote meeting-sequence.gif (' + n + ' frames)'); }
    else console.log('  ffmpeg unavailable; frames left as PNG');
    if (!same) process.exitCode = 1;
  } finally { await page.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
