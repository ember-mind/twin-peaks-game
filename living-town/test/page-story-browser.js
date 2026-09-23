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
  const runTo = (day, minute) => js("(async function(){ var st = LT_OBSERVER; st.speedIndex = 0; await st.sim.runUntil(" + day + ", " + minute + "); st.view.observe(); LT.Observer.paintNow(); return true; })()", true);
  async function shot(name) {
    if (!SHOTS) return;
    fs.mkdirSync(OUT, { recursive: true });
    await sleep(250);
    const r = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, name), Buffer.from(r.data, 'base64'));
    console.log('  wrote artifacts/living-town-story/' + name);
  }
  try {
    await page.navigate('living-town/index.html?speed=1x&world=new&cast=pair'); await sleep(1200);
    console.log('# page: on the way to work');
    await runTo(1, 555); await sleep(300);   // 09:15, walking up to the counter
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
    await page.navigate('living-town/index.html?speed=1x&world=new&cast=pair'); await sleep(1200);
    await runTo(1, 480);
    const pick = (id, value) => js("(function(){ var n = document.getElementById('" + id + "'); n.value = '" + value + "'; n.dispatchEvent(new Event('change')); return n.value; })()");
    await pick('lt-hand-what', 'leave_book');
    await js("document.querySelector('#lt-hand-fields select').value = 'park_lawn_w'; true");
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
    await page.navigate('living-town/index.html?speed=1x&world=new'); await sleep(1200);
    ok(await js("document.querySelectorAll('#lt-characters [data-actor]').length") === 5 && await js("LT_OBSERVER.sim.state.cast") === 'town', 'five people to follow');
    await runTo(1, 1052); await sleep(300);
    await js("document.getElementById('lt-follow-action').click(); true"); await sleep(400);
    const seen = JSON.parse(await js("JSON.stringify(LT_OBSERVER.view.draw())"));
    ok(seen.entities >= 2 && seen.inhabitants === 'atlas', 'The action lands where people are: ' + seen.entities + ' in ' + seen.location + ', drawn from the atlas');
    ok(await js("document.querySelectorAll('#lt-hand-fields option').length") >= 1, 'the hand is offered for this world\'s people');
    ok(/friends|close|acquainted|barely know/.test(await txt('lt-bonds')) && /last seen (today|yesterday|not yet)/.test(await txt('lt-bonds')), 'Between them: ' + (await txt('lt-bonds')).replace(/\s+/g, ' ').slice(0, 100));
    await shot('05-the-street-at-half-past-five.png');
    console.log('# page: auto pace, the timeline, looking back');
    await page.navigate('living-town/index.html?speed=1x&world=new'); await sleep(1200);
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
    console.log('# page: how it opens for someone who just arrived');
    await page.navigate('living-town/index.html' + '?world=new'); await sleep(1500);
    ok(await js("document.querySelector('#lt-speeds .is-on').textContent") === 'Auto' && await js("LT_OBSERVER.followAction") === true && await js("document.getElementById('lt-follow-action').classList.contains('is-on')"), 'on Auto, following the action');
    ok(await js("LT_OBSERVER.sim.absMinute()") > 365, 'and the town is already moving (' + await js("LT_OBSERVER.sim.stamp()") + ' after a second and a half)');
    await js("LT_OBSERVER.speedIndex = 0; true");

    console.log('# found in review: what the watcher did is part of what is looked back at');
    await page.navigate('living-town/index.html?speed=1x&world=new'); await sleep(1200);
    await js("LT_OBSERVER.speedIndex = 0; true");
    await js("(function(){ document.querySelectorAll('#lt-speeds button')[3].click(); return true; })()");
    for (let i = 0; i < 60 && await js("LT_OBSERVER.sim.absMinute()") < 455; i++) await sleep(200);
    await js("document.querySelectorAll('#lt-speeds button')[0].click(); true"); await sleep(400);
    await pick('lt-hand-what', 'leave_book');
    await js("document.querySelector('#lt-hand-fields select').value = 'park_jetty'; document.getElementById('lt-hand-do').click(); true");
    const askedAt = await js("LT_OBSERVER.sim.absMinute()");
    await js("document.querySelectorAll('#lt-speeds button')[3].click(); true");
    for (let i = 0; i < 60 && await js("LT_OBSERVER.sim.absMinute()") < askedAt + 50; i++) await sleep(200);
    await js("document.querySelectorAll('#lt-speeds button')[0].click(); true"); await sleep(400);
    const applied = JSON.parse(await js("JSON.stringify(LT.Story.beats(LT_OBSERVER.sim, 1).filter(function(b){ return b.type === 'INTERVENTION_APPLIED' && b.absMinute > " + askedAt + " - 1; })[0] || null)"));
    ok(!!applied && await js("LT_OBSERVER.snapshots.every(function(s){ return typeof s.save === 'string'; })"), 'the book the watcher left is a moment on the strip (' + (applied && applied.stamp) + '), and copies are kept as text');
    await js("(function(){ window.__r2 = null; LT.Observer.replay(LT_OBSERVER, " + JSON.stringify(applied) + ").then(function(v){ window.__r2 = v; }); return true; })()");
    for (let i = 0; i < 40 && (await js("window.__r2")) === null; i++) await sleep(250);
    await js("(async function(){ await LT_OBSERVER.replay.sim.runMinutes(1); return true; })()", true);
    await js("document.querySelectorAll('#lt-speeds button')[1].click(); true");
    for (let i = 0; i < 40 && await js("LT_OBSERVER.replay.sim.absMinute()") < applied.absMinute + 2; i++) await sleep(300);
    ok(await js("LT_OBSERVER.replay.sim.state.events.some(function(e){ return e.type === 'INTERVENTION_APPLIED' && e.absMinute === " + (applied ? applied.absMinute : 0) + "; }) && LT_OBSERVER.replay.sim.state.objects.filter(function(o){ return o.typeId === 'book_used'; }).length === LT_OBSERVER.sim.state.objects.filter(function(o){ return o.typeId === 'book_used' && true; }).length - (LT_OBSERVER.sim.state.interventions.filter(function(r){ return r.type === 'place_shared_book' && r.status === 'applied' && r.atAbs > " + (applied ? applied.absMinute : 0) + " + 2; }).length)"),
       'looking back at it, it happens again at the same minute — though the copy the replay started from was taken before it was asked for');
    await js("document.getElementById('lt-replay-back').click(); true"); await sleep(300);

    console.log('# found in review: a provider\'s words cannot leave the text they are in');
    await js(`(function(){ try {
      LT.Policy.register({ id: 'wordy_page_test', decide: function (r) {
        var c = r.candidates.filter(function (x) { return /^(join_conversation|talk_with)/.test(x.id); })[0] || r.candidates.filter(function (x) { return x.id === 'wait'; })[0];
        return Promise.resolve(LT.Policy.selected(r, c.id, 'wordy_page_test', null, { say: ['hi', ' onmouseover=', 'window.__pwned=1', ' x=', String.fromCharCode(39)].join(String.fromCharCode(34)) })); } });
      var sim = LT.Scenario.day1({ intervention: false, everyday: false, policies: { resident_a: 'wordy_page_test', resident_b: 'wordy_page_test' } });
      sim.placeCharacter(sim.state.characters.resident_a, 'park'); sim.placeCharacter(sim.state.characters.resident_b, 'park');
      LT.Observer.adopt(LT_OBSERVER, sim); return 'ok'; } catch (e) { return String(e && e.stack || e); } })()`);
    await js("(async function(){ await LT_OBSERVER.sim.runMinutes(40); return true; })()", true); await sleep(500);
    const titles = JSON.parse(await js("JSON.stringify(Array.prototype.map.call(document.querySelectorAll('#lt-timeline .lt-beat.is-said'), function(b){ return { title: b.title, attrs: b.getAttributeNames() }; }))"));
    ok(titles.length >= 1 && titles.every((t) => t.attrs.indexOf('onmouseover') < 0 && t.attrs.indexOf('x') < 0 && /onmouseover=/.test(t.title)), 'a line with quotes in it stays inside the tooltip, whole: ' + (titles[0] && titles[0].title.slice(0, 70)));
    ok(await js("window.__pwned === undefined") && /onmouseover/.test(await txt('lt-events')), 'and is shown as the text it is everywhere else');

    console.log('# page: a provider that takes real seconds');
    await page.navigate('living-town/index.html?speed=1x&world=new'); await sleep(1200);
    await js("LT_OBSERVER.speedIndex = 0; true");
    await js(`(function(){
      window.__asked = 0;
      LT.RemotePolicy.create({ id: 'remote_page_test', label: 'a slow test provider', timeoutMs: 4000, patienceMs: 3000, maxInFlight: 1,
        transport: function (brief) { window.__asked++; return new Promise(function (r) { setTimeout(function () {
          var m = /id "(wash_and_dress|eat_at_home[^"]*|wait)"/.exec(brief.user); r(JSON.stringify({ choose: m ? m[1] : 'wait', reason: 'Asked by the page test.' })); }, 700); }); } });
      var sim = LT.Scenario.town({ policies: { resident_a: 'remote_page_test' } });
      LT.Observer.adopt(LT_OBSERVER, sim);
      document.querySelector('[data-actor=resident_a]').click();
      document.querySelectorAll('#lt-speeds button')[3].click();      // 20x
      return true; })()`);
    const startAbs = await js("LT_OBSERVER.sim.absMinute()");
    let sawWaiting = false;
    for (let i = 0; i < 12; i++) { await sleep(250); if (/waiting for a slow test provider to decide for/.test(await txt('lt-caption-why'))) sawWaiting = true; }
    await js("document.querySelectorAll('#lt-speeds button')[0].click(); true"); await sleep(900);
    const ran = await js("LT_OBSERVER.sim.absMinute()") - startAbs;
    const srcs = JSON.parse(await js("JSON.stringify(LT_OBSERVER.sim.state.events.filter(function(e){ return e.type === 'ACTIVITY_STARTED' && e.actorId === 'resident_a'; }).map(function(e){ return e.data.source; }))"));
    ok(sawWaiting, 'while the question is out the page says whom the town is waiting for');
    ok(srcs.length >= 2 && srcs.every((x) => x === 'remote_page_test'), 'its answers arrive in time and are acted on — none timed out into a fallback: ' + JSON.stringify(srcs));
    ok(ran > 15 && ran < 200, 'three seconds at 20x would be 250 town minutes; held only while a question was out, it was ' + ran);
    ok(/a slow test provider gave this reason: "Asked by the page test\."|remote_page_test gave this reason/.test(await txt('lt-decision-why')), 'the provider\'s own reason is quoted with its name on it: ' + await txt('lt-decision-why'));
    console.log('# page: looking back in a world with a provider plays its recorded answers');
    ok(await js("LT.Observer.replayBlockedBy(LT_OBSERVER) === null && Object.keys(LT_OBSERVER.recorders).join() === 'remote_page_test'"), 'the page has been recording the provider since it took up this world');
    await js("document.querySelectorAll('#lt-speeds button')[3].click(); true");
    for (let i = 0; i < 120 && await js("LT_OBSERVER.sim.absMinute()") < 560; i++) await sleep(400);
    await js("document.querySelectorAll('#lt-speeds button')[0].click(); true"); await sleep(1000);
    const askedLive = await js("window.__asked");
    const target = JSON.parse(await js("(function(){ var s = LT_OBSERVER.sim, e = s.state.events.filter(function(x){ return x.type === 'ACTIVITY_STARTED' && x.actorId === 'resident_a' && x.absMinute > 440; })[0]; return JSON.stringify({ seq: e.seq, absMinute: e.absMinute, minute: e.minute, stamp: e.stamp, type: e.type, text: e.text, actorId: 'resident_a' }); })()"));
    await js("(function(){ window.__replayed = null; LT.Observer.replay(LT_OBSERVER, " + JSON.stringify(target) + ").then(function (v) { window.__replayed = v; }); return true; })()");
    for (let i = 0; i < 40 && (await js("window.__replayed")) === null; i++) await sleep(250);
    ok(await js("window.__replayed") === true, 'a moment of the provider\'s person can be looked back at');
    await js("(async function(){ await LT_OBSERVER.replay.sim.runMinutes(16); return true; })()", true);
    const same = await js("(function(){ var r = LT_OBSERVER.replay.sim, l = LT_OBSERVER.sim; var pick = function (s) { return JSON.stringify(s.state.events.filter(function(x){ return x.type === 'ACTIVITY_STARTED' && x.actorId === 'resident_a' && x.absMinute <= " + (target.absMinute + 2) + "; }).map(function(x){ return [x.absMinute, x.text, x.data.source]; })); }; return pick(r) === pick(l); })()");
    ok(same, 'it shows the same choices at the same minutes, under the provider\'s name');
    ok(await js("window.__asked") === askedLive, 'and the provider was not asked again (' + askedLive + ' questions, before and after)');
    ok(!/stopped matching/.test(await txt('lt-replay-text')), 'the replay matches what was recorded');
    await js("document.getElementById('lt-replay-back').click(); true"); await sleep(300);
    ok(await js("LT.Policy.get('remote_page_test') === LT_OBSERVER.recorders.remote_page_test"), 'back to now, the live provider is the one being asked again');
    console.log('\npage-story-browser: ' + checks + '/' + checks);
  } finally { await page.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
