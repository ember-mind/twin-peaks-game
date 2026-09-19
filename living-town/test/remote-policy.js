/* remote-policy.js — Living Town: a slow, unreliable, wordy provider at the boundary.
 * No model is called here or anywhere: the transports below are local functions
 * that behave badly on purpose. What is tested is the boundary — the brief
 * carries only the request, replies are parsed strictly, words are only words,
 * every failure becomes an ordinary response, and the town keeps its rules.
 * node living-town/test/remote-policy.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
require(path.resolve(__dirname, '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-save.js'));
require(path.resolve(__dirname, '..', 'js', 'policy', 'lt-brief.js'));
require(path.resolve(__dirname, '..', 'js', 'policy', 'lt-remote-policy.js'));
const LT = global.LT, Pol = LT.Policy, Brief = LT.PolicyBrief;

let checks = 0, n = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const after = (ms, v) => new Promise((r) => setTimeout(() => r(v), ms));
const optionIds = (brief) => brief.user.split('\n').filter((l) => /^\s+\d+\. id "/.test(l)).map((l) => /id "([^"]+)"/.exec(l)[1]);

(async function () {
  console.log('# the brief is the request in words, and nothing more');
  const sim = LT.Scenario.town({});
  await sim.runUntil(1, 1040);
  const a = sim.state.characters.resident_a;
  const req = sim.buildRequest(a, 'idle');
  const before = JSON.stringify(req);
  const brief = Brief.render(req);
  ok(JSON.stringify(req) === before && JSON.stringify(Brief.render(req)) === JSON.stringify(brief), 'rendering is pure and repeatable');
  ok(JSON.stringify(optionIds(brief)) === JSON.stringify(req.candidates.map((c) => c.id)), 'every option is listed with its id, in order, and no other');
  ok(brief.user.length <= Brief.MAX_CHARS && brief.chars / 4 < 1800, 'about ' + Math.round(brief.chars / 4) + ' tokens');
  const others = sim.actorIds().filter((id) => id !== 'resident_a').map((id) => sim.state.characters[id]);
  ok(others.every((c) => c.money === a.money || brief.user.indexOf(c.money.toFixed(2)) < 0), 'nobody else\'s purse is in it');
  ok(others.every((c) => Math.round(c.needs.hunger) === Math.round(a.needs.hunger) || brief.user.indexOf('hunger ' + Math.round(c.needs.hunger) + '/100') < 0), 'nor anybody else\'s hunger as a number');
  ok(!/undefined|NaN|\[object/.test(brief.user), 'no holes in the wording');
  const big = JSON.parse(before);
  big.memories = Array.from({ length: 8 }, (_, i) => ({ stamp: 'D1 0' + i + ':00', summary: 'x'.repeat(900), firsthand: true }));
  ok(Brief.render(big).user.length <= Brief.MAX_CHARS && JSON.stringify(optionIds(Brief.render(big))) === JSON.stringify(req.candidates.map((c) => c.id)), 'over budget, memories go first and the options never do');

  console.log('# a reply is parsed strictly');
  const first = req.candidates[0].id;
  ok(Brief.parse(req, '{"choose":"' + first + '"}', 'p').selectedId === first, 'an id');
  ok(Brief.parse(req, 'Sure! Here you go:\n```json\n{"choose": 2, "reason": "because"}\n```', 'p').selectedId === req.candidates[1].id, 'a number, inside chatter and a code fence');
  ok(Brief.parse(req, { choose: first, reason: 'ok' }, 'p').words.reason === 'ok', 'an object');
  ['', 'I would rather go dancing', '{"choose":"fly_away"}', '{"choose": 99}', '{"choose": null}', '{broken', null, 42].forEach((bad) => {
    const r = Brief.parse(req, bad, 'p');
    assert(r.status === 'error' && Pol.validateResponse(req, r).ok === false, 'accepted: ' + bad);
  });
  ok(true, 'anything that does not name an option on offer is an error response, never a guess');
  const bell = String.fromCharCode(7);
  const w = Pol.cleanWords({ reason: '  many\n\nlines <b>and</b> ' + bell + ' bells ', say: 'x'.repeat(500), extra: 'dropped', mood: 7 });
  ok(w.reason === 'many lines b and /b bells' && w.say.length <= 240 && /…$/.test(w.say) && !('extra' in w), 'words are one clean capped line each; nothing else comes through');
  ok(Pol.cleanWords({ reason: 5, say: '   ' }) === null && Pol.cleanWords('hello') === null, 'no usable words is no words');

  console.log('# words are carried, heard and kept — and change nothing');
  const talker = (say, reason) => {
    const id = 'wordy_' + (++n);
    return Pol.register({ id, decide(r) {
      const want = r.candidates.find((c) => /^(join_conversation|talk_with)/.test(c.id)) || r.candidates.find((c) => c.id === 'wait');
      return Promise.resolve(Pol.selected(r, want.id, id, null, { say: say, reason: reason }));
    } });
  };
  const run = async (policies) => {
    const s = LT.Scenario.day1({ intervention: false, everyday: false, policies });
    s.placeCharacter(s.state.characters.resident_a, 'park'); s.placeCharacter(s.state.characters.resident_b, 'park');
    await s.runMinutes(60);
    return s;
  };
  const wa = talker('Have you got a minute?', 'They have not spoken all week.'), wb = talker('For you, always.', 'An old friend is asking.');
  const spoken = await run({ resident_a: wa.id, resident_b: wb.id });
  const said = spoken.state.events.filter((e) => e.type === 'SAID');
  const conv = spoken.state.conversations.find((c) => c.lines && c.lines.length);
  ok(said.length >= 2 && conv && conv.lines.length >= 2 && conv.lines.every((l) => /^wordy_/.test(l.source)), 'what each said is on the conversation, with the provider\'s name on it');
  ok(/"(Have you got a minute\?|For you, always\.)"/.test(said[0].text), 'and in the town\'s record, in their words: ' + said[0].text);
  ok(spoken.state.characters.resident_b.memories.some((m) => m.type === 'SAID'), 'whoever was there remembers it');
  ok(spoken.state.characters.resident_a.recentDecisions.some((d) => d.words && d.words.reason === 'They have not spoken all week.'), 'the reason is kept with the decision');
  const silent = await run({ resident_a: talker(undefined, undefined).id, resident_b: talker(undefined, undefined).id });
  const mech = (s) => JSON.stringify(s.state.conversations.map((c) => [c.participants, c.status, c.startAbs, c.endAbs])) +
    JSON.stringify(s.actorIds().map((id) => [s.state.characters[id].pos, s.state.characters[id].needs, s.state.characters[id].relationships]));
  ok(mech(silent) === mech(spoken) && silent.state.events.filter((e) => e.type === 'SAID').length === 0, 'the same two without words do exactly the same things, and nothing is said for them');
  const reloaded = LT.Save.deserialize(JSON.parse(JSON.stringify(LT.Save.serialize(spoken))));
  ok(JSON.stringify(reloaded.state.conversations) === JSON.stringify(spoken.state.conversations), 'lines survive a save');
  const utility = await run({ resident_a: 'utility', resident_b: 'utility' });
  ok(utility.state.events.filter((e) => e.type === 'SAID').length === 0 && !utility.state.conversations.some((c) => c.lines), 'the offline policy says nothing, and nothing is said on its behalf');

  console.log('# a provider that is slow, broken, or too late');
  const slow = LT.RemotePolicy.create({ id: 'remote_slow', timeoutMs: 400, maxInFlight: 1,
    transport: () => after(30, '{"choose":"wait","reason":"nothing pressing"}') });
  const t0 = Date.now();
  const three = await Promise.all([1, 2, 3].map(() => slow.decide(req)));
  ok(three.every((r) => r.status === 'selected' && r.selectedId === 'wait') && Date.now() - t0 >= 85, 'one in flight at a time: three answers took three turns (' + (Date.now() - t0) + ' ms)');
  ok(slow.stats().answered === 3 && slow.stats().p50 >= 25 && slow.remote === true && slow.patienceMs === 400, 'latency is measured, and the page is told how patient to be');
  const dead = LT.RemotePolicy.create({ id: 'remote_dead', timeoutMs: 60, transport: () => new Promise(() => {}) });
  const timedOut = await dead.decide(req);
  ok(timedOut.status === 'unavailable' && /timeout/.test(timedOut.error) && dead.stats().timeouts === 1, 'no answer in time is "unavailable", not a hang');
  let lateResolve;
  const late = LT.RemotePolicy.create({ id: 'remote_late', timeoutMs: 40, transport: () => new Promise((r) => { lateResolve = r; }) });
  const lateAnswer = await late.decide(req); lateResolve('{"choose":"wait"}'); await sleep(10);
  ok(lateAnswer.status === 'unavailable' && late.stats().answered === 0 && late.stats().inFlight === 0, 'an answer after the timeout is dropped, not delivered twice');
  const broken = LT.RemotePolicy.create({ id: 'remote_broken', transport: () => { throw new Error('no route'); } });
  const rejecting = LT.RemotePolicy.create({ id: 'remote_rejecting', transport: () => Promise.reject(new Error('503')) });
  const babble = LT.RemotePolicy.create({ id: 'remote_babble', transport: () => Promise.resolve('I think she should rest.') });
  ok((await broken.decide(req)).status === 'error' && (await rejecting.decide(req)).status === 'error' && (await babble.decide(req)).status === 'error' && babble.stats().unusable === 1,
     'a throw, a rejection and a reply with no choice in it are all error responses');

  console.log('# found in review: time spent queueing counts');
  let sent = 0;
  const jam = LT.RemotePolicy.create({ id: 'remote_jam', timeoutMs: 120, maxInFlight: 2, transport: () => { sent++; return new Promise(() => {}); } });
  const tj = Date.now();
  const eight = await Promise.all(Array.from({ length: 8 }, () => jam.decide(req)));
  ok(eight.every((r) => r.status === 'unavailable') && Date.now() - tj < 320, 'eight questions into a dead provider are all answered "unavailable" within about one timeout (' + (Date.now() - tj) + ' ms), not four');
  ok(sent === 2 && eight.filter((r) => r.error === 'timeout_in_queue').length === 6 && jam.stats().inFlight === 0 && jam.stats().queued === 0, 'and the six whose time ran out in the queue were never sent at all');

  console.log('# in a running town');
  let asked = 0;
  const flaky = LT.RemotePolicy.create({ id: 'remote_flaky', timeoutMs: 200, maxInFlight: 2, transport: (b) => {
    asked++;
    const ids = optionIds(b);
    if (asked % 3 === 2) return Promise.resolve('no idea');
    if (asked % 4 === 0) return new Promise(() => {});
    const pick = ids.find((id) => /^(eat_at_home|buy_meal|sleep|work_shift|join_conversation)/.test(id)) || ids[ids.length - 1];
    return after(2, JSON.stringify({ choose: pick, reason: 'test transport', say: /conversation/.test(pick) ? 'All right.' : undefined }));
  } });
  const live = LT.Scenario.day1({ policies: { resident_a: flaky.id, resident_b: 'utility' }, decisionTimeoutMinutes: 30 });
  for (let i = 0; i < 700; i++) { live.tick(); await sleep(1); }
  const sources = {};
  live.state.events.filter((e) => e.type === 'ACTIVITY_STARTED' && e.actorId === 'resident_a').forEach((e) => { sources[e.data.source] = (sources[e.data.source] || 0) + 1; });
  ok(sources.remote_flaky > 0 && Object.keys(sources).some((k) => /^fallback:/.test(k)), 'good answers are acted on and bad ones fall back to waiting, each tagged with where it came from: ' + JSON.stringify(sources));
  ok(live.absMinute() === 360 + 700 && live.state.characters.resident_b.recentDecisions.length > 0, 'the town never stopped for it, and the neighbour on another policy carried on');
  ok(live.rejections.every((r) => typeof r.reason === 'string') && live.rejections.some((r) => /policy_error|policy_unavailable/.test(r.reason)), 'every refusal is on the record with its reason');
  const st = flaky.stats();
  ok(st.asked === st.answered + st.timeouts + st.errors + st.unusable + st.inFlight + st.queued, 'every question is accounted for: ' + JSON.stringify(st));

  console.log('# asked only when it is close, and never left without an answer');
  require(path.resolve(__dirname, '..', 'js', 'policy', 'lt-hybrid-policy.js'));
  let slowAsked = 0, failNext = false;
  LT.RemotePolicy.create({ id: 'remote_for_hybrid', timeoutMs: 150, transport: (b) => {
    slowAsked++;
    if (failNext) return Promise.resolve('cannot say');
    const ids = optionIds(b); return after(1, JSON.stringify({ choose: ids[0], reason: 'first on the list' }));
  } });
  const hybrid = LT.HybridPolicy.create({ id: 'hybrid_test', fast: 'utility', slow: 'remote_for_hybrid', closeGap: 15 });
  const hsim = LT.Scenario.day1({ policies: { resident_a: hybrid.id, resident_b: 'utility' } });
  for (let i = 0; i < 900; i++) { if (i === 300) failNext = true; hsim.tick(); await sleep(1); }
  const hs = hybrid.stats();
  const hsrc = {}; hsim.state.events.filter((e) => e.type === 'ACTIVITY_STARTED' && e.actorId === 'resident_a').forEach((e) => { hsrc[e.data.source] = (hsrc[e.data.source] || 0) + 1; });
  ok(hs.clear > 0 && hs.close > 0 && slowAsked === hs.close && hs.asked === hs.clear + hs.close, 'the slow provider was asked only for the close calls: ' + JSON.stringify(hs));
  ok(hs.slowFailed > 0 && hsrc['hybrid_test:utility:stood_in'] > 0 && !Object.keys(hsrc).some((k) => /^fallback:policy_error/.test(k)), 'when it failed, the offline answer stood in — nobody was left waiting for nothing: ' + JSON.stringify(hsrc));
  ok(Object.keys(hsrc).every((k) => /^hybrid_test:|^fallback:/.test(k)) && hsrc['hybrid_test:utility:clear'] > 0, 'every choice says who made it');
  ok(hybrid.remote === true && hybrid.patienceMs === 150, 'the page is told to be patient for it as for the provider inside it');

  console.log('\nremote-policy: ' + checks + '/' + checks);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
