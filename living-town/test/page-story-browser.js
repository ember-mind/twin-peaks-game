/* page-story-browser.js — Living Town: what the real page tells a watcher.
 * Real headless Chrome. Not part of run-all.js; one Chrome driver at a time.
 * node living-town/test/page-story-browser.js [--shots]
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { launch, sleep } = require('../../test/lib/chrome-cdp.js');
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'artifacts', 'living-town-story');
const SHOTS = process.argv.includes('--shots');

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

(async function () {
  const page = await launch({ root: ROOT, width: 1280, height: 1100 });
  const js = (code, wait) => page.evaluate(code, !!wait, 120000);
  const txt = (id) => js("document.getElementById('" + id + "').textContent");
  const runTo = (day, minute) => js("(async function(){ var st = LT_OBSERVER; st.speedIndex = 0; await st.sim.runUntil(" + day + ", " + minute + "); st.view.observe(); return true; })()", true);
  async function shot(name) {
    if (!SHOTS) return;
    fs.mkdirSync(OUT, { recursive: true });
    await sleep(250);
    const r = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, name), Buffer.from(r.data, 'base64'));
    console.log('  wrote artifacts/living-town-story/' + name);
  }
  try {
    await page.navigate('living-town/index.html?world=new&cast=pair'); await sleep(1200);
    console.log('# page: on the way to work');
    await runTo(1, 545); await sleep(300);
    const name = await js("LT_OBSERVER.sim.state.characters.resident_a.name");
    ok((await txt('lt-caption-doing')).indexOf(name + ' · On the way to: ') === 0, 'under the picture: who, and that they are still on the way (' + await txt('lt-caption-doing') + ')');
    const line = await txt('lt-caption-why');
    ok(line === await js("LT.Story.why(LT_OBSERVER.sim.state.characters.resident_a.recentDecisions[0]).line") && /^Weighed most: /.test(line), 'and what weighed, straight from the last decision: ' + line);
    ok(await txt('lt-decision-why') === line, 'the same line sits with the last decision');
    ok(/EUR to go/.test(await txt('lt-stakes')), 'at stake: the savings gap (' + (await txt('lt-stakes')).slice(0, 80) + ')');
    await shot('01-on-the-way-to-work.png');

    console.log('# page: the action');
    await js("document.querySelector('[data-actor=resident_b]').click(); true"); await sleep(200);
    ok(await js("LT_OBSERVER.selected") === 'resident_b' && (await txt('lt-caption-doing')).indexOf(name) !== 0, 'choosing a name follows that person');
    await js("document.getElementById('lt-follow-action').click(); true"); await sleep(300);
    ok(await js("LT_OBSERVER.selected") === 'resident_a', 'The action moves to whoever has more going on');
    await js("document.querySelector('[data-actor=resident_b]').click(); true"); await sleep(200);
    ok(await js("LT_OBSERVER.followAction") === false && await js("LT_OBSERVER.selected") === 'resident_b', 'choosing a name again turns it off');

    console.log('# page: a promise coming due, then the day looked back on');
    await js("document.querySelector('[data-actor=resident_a]').click(); true");
    await runTo(1, 1030); await sleep(300);
    ok(/due in 20 min/.test(await txt('lt-stakes')), 'the meeting shows its minutes: ' + (await txt('lt-stakes')).replace(/\s+/g, ' ').slice(0, 140));
    ok(/^Day 1, so far/.test(await txt('lt-recap-title')), 'during day 1 the recap is the day so far');
    await shot('02-promise-coming-due.png');
    const before = await js("JSON.stringify(LT_OBSERVER.sim.state)");
    await sleep(400);
    ok(before === await js("JSON.stringify(LT_OBSERVER.sim.state)"), 'a paused page painting these panels changes nothing in the world');
    await runTo(2, 30); await sleep(400);
    ok(/^Day 1, looked back on/.test(await txt('lt-recap-title')), 'on day 2 it is day 1, finished');
    const recap = await txt('lt-recap');
    ok(/worked .* EUR/.test(recap) && /talked for/.test(recap) && /In town/.test(recap), 'work, the conversation and what happened to the town are in it');
    await js("document.getElementById('lt-recap-next').click(); true"); await sleep(300);
    ok(/^Day 2, so far/.test(await txt('lt-recap-title')), 'Later shows today');
    await js("document.getElementById('lt-recap-prev').click(); true"); await sleep(300);
    await shot('03-day-one-looked-back-on.png');
    console.log('# page: make something happen');
    await page.navigate('living-town/index.html?world=new&cast=pair'); await sleep(1200);
    await runTo(1, 480);
    const pick = (id, value) => js("(function(){ var n = document.getElementById('" + id + "'); n.value = '" + value + "'; n.dispatchEvent(new Event('change')); return n.value; })()");
    await pick('lt-hand-what', 'leave_book');
    await js("document.querySelector('#lt-hand-fields select').value = 'park_bench_sw'; true");
    const registerBefore = await js("LT_OBSERVER.sim.state.interventions.length");
    await js("document.getElementById('lt-hand-do').click(); true"); await sleep(200);
    ok(/^Arranged for D1 08:00/.test(await txt('lt-hand-status')) && await js("LT_OBSERVER.sim.state.interventions.length") === registerBefore + 1, 'Do it: one entry in the register, and the page says when (' + await txt('lt-hand-status') + ')');
    await js("document.getElementById('lt-hand-do').click(); true"); await sleep(200);
    ok(/^Not done: something is already there/.test(await txt('lt-hand-status')) && await js("LT_OBSERVER.sim.state.interventions.length") === registerBefore + 1, 'the same again is refused in words and nothing is recorded: ' + await txt('lt-hand-status'));
    await pick('lt-hand-what', 'extra_shift');
    ok(await js("document.querySelectorAll('#lt-hand-fields option').length") === 1, 'a shift can only be offered to someone with an employer');
    await runTo(1, 490); await sleep(300);
    ok(/happened/.test(await txt('lt-hand-asked')) && await js("LT_OBSERVER.sim.state.objects.filter(function(o){return o.typeId==='book_used'}).length") === 1, 'a few minutes on it has happened: one book in the world, listed as such');
    await js("document.querySelector('[data-actor=resident_b]').click(); true");
    await shot('04-made-something-happen.png');
    console.log('# page: a new world is the whole street');
    await page.navigate('living-town/index.html?world=new'); await sleep(1200);
    ok(await js("document.querySelectorAll('#lt-characters [data-actor]').length") === 5 && await js("LT_OBSERVER.sim.state.cast") === 'town', 'five people to follow');
    await runTo(1, 1052); await sleep(300);
    await js("document.getElementById('lt-follow-action').click(); true"); await sleep(400);
    const seen = JSON.parse(await js("JSON.stringify(LT_OBSERVER.view.draw())"));
    ok(seen.entities >= 2 && seen.inhabitants === 'atlas', 'The action lands where people are: ' + seen.entities + ' in ' + seen.location + ', drawn from the atlas');
    ok(await js("document.querySelectorAll('#lt-hand-fields option').length") >= 1, 'the hand is offered for this world\'s people');
    await shot('05-the-street-at-half-past-five.png');
    console.log('# page: auto pace, the timeline, looking back');
    await page.navigate('living-town/index.html?world=new'); await sleep(1200);
    await js("LT_OBSERVER.speedIndex = 0; true");
    ok(await js("Array.prototype.map.call(document.querySelectorAll('#lt-speeds button'), function(b){return b.textContent}).join()") === 'Pause,1x,4x,20x,Auto', 'Auto sits with the other speeds');
    ok(await js("LT.Story.pace(LT_OBSERVER.sim)") !== 'asleep' , 'at six in the morning somebody is up');
    /* the page's own loop must take the snapshots, so the page runs the day */
    await js("(function(){ var b = document.querySelectorAll('#lt-speeds button'); b[3].click(); return true; })()");
    for (let i = 0; i < 90 && await js("LT_OBSERVER.sim.absMinute()") < 1120; i++) await sleep(400);
    await js("document.querySelectorAll('#lt-speeds button')[0].click(); true"); await sleep(300);
    const snaps = await js("LT_OBSERVER.snapshots.length");
    ok(snaps >= 20, 'the running page kept a copy of the world every half hour (' + snaps + ')');
    const liveBefore = await js("JSON.stringify(LT_OBSERVER.sim.state)");
    const beat = JSON.parse(await js("(function(){ var b = LT.Story.beats(LT_OBSERVER.sim, 1).filter(function(x){ return x.type === 'TALKED'; })[0]; return JSON.stringify(b); })()"));
    ok(await js("document.querySelectorAll('#lt-timeline .lt-beat').length") >= 5 && !!beat, 'the day\'s moments are on the strip');
    await js("(function(){ var all = LT.Story.beats(LT_OBSERVER.sim, 1); var i = all.findIndex(function(x){ return x.seq === " + beat.seq + "; }); document.querySelectorAll('#lt-timeline .lt-beat')[i].click(); return true; })()");
    for (let i = 0; i < 40 && !(await js("!!LT_OBSERVER.replay")); i++) await sleep(250);
    ok(await js("!!LT_OBSERVER.replay") && /^Looking back at D1/.test(await txt('lt-replay-text')), 'choosing one looks back: ' + (await txt('lt-replay-text')).slice(0, 90));
    ok(await js("LT_OBSERVER.replay.sim.absMinute()") === beat.absMinute - 12 && await js("document.getElementById('lt-save').disabled && document.getElementById('lt-hand-do').disabled"), 'twelve minutes before it, with saving and intervening switched off');
    await js("(async function(){ await LT_OBSERVER.replay.sim.runMinutes(14); LT_OBSERVER.view.observe(); return true; })()", true);
    ok(await js("LT_OBSERVER.replay.sim.state.events.some(function(e){ return e.type === 'TALKED' && e.absMinute === " + beat.absMinute + "; })"), 'run forward, the same talk ends at the same minute');
    await shot('06-looking-back.png');
    ok(liveBefore === await js("JSON.stringify(LT_OBSERVER.sim.state)"), 'the live world has not moved a minute meanwhile');
    await js("document.getElementById('lt-replay-back').click(); true"); await sleep(300);
    ok(!(await js("!!LT_OBSERVER.replay")) && await js("LT_OBSERVER.view.sim === LT_OBSERVER.sim") && await js("document.getElementById('lt-replay').hidden") && !(await js("document.getElementById('lt-hand-do').disabled")), 'Back to now: the live world, its view, its controls');
    ok(liveBefore === await js("JSON.stringify(LT_OBSERVER.sim.state)"), 'exactly as it was left');
    console.log('\npage-story-browser: ' + checks + '/' + checks);
  } finally { await page.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
