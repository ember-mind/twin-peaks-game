/* turns.js — Living Town: carrying a talk on, or bringing it to a close.
 * Nine and seventeen minutes into a talk each person is asked, through their
 * own policy, whether to carry on. It is one talk with one settlement whatever
 * they answer; saying nothing means carrying on; nothing else can be chosen
 * mid-talk; and a provider's words at each turn are heard in order.
 * node living-town/test/turns.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
require(path.resolve(__dirname, '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-save.js'));
require(path.resolve(__dirname, '..', 'js', 'policy', 'lt-brief.js'));
const LT = global.LT, Pol = LT.Policy;

let checks = 0, n = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }
const ev = (s, t) => s.state.events.filter((e) => e.type === t);
const strip = (s) => { const c = JSON.parse(JSON.stringify(s.state)); delete c.version; return JSON.stringify(c).replace(/"requestId":"req_(\d+)\.\d+"/g, '"requestId":"req_$1"'); };

/* Talks when it can; at a turn does what `turn(request, nth)` says: 'keep', 'wind', 'never' (no answer), 'throw'. */
function talker(turn, lines) {
  const id = 'turner_' + (++n);
  let nth = 0;
  const api = { id, asked: [], decide(r) {
    api.asked.push({ reason: r.context.reason, ids: r.candidates.map((c) => c.id), meta: r.candidates[0] && r.candidates[0].meta });
    if (r.context.reason === 'conversation_turn') {
      const what = turn(r, nth++);
      if (what === 'never') return new Promise(() => {});
      if (what === 'throw') throw new Error('provider down');
      const c = r.candidates.find((x) => x.actionId === (what === 'wind' ? 'wind_down' : 'keep_talking'));
      return Promise.resolve(Pol.selected(r, c.id, id, null, lines ? { say: lines[Math.min(nth, lines.length - 1)] } : null));
    }
    const want = r.candidates.find((c) => /^(join_conversation|talk_with)/.test(c.id)) || r.candidates.find((c) => c.id === 'wait');
    return Promise.resolve(Pol.selected(r, want.id, id, null, lines ? { say: lines[0] } : null));
  } };
  return Pol.register(api);
}
async function twoInThePark(pa, pb, minutes) {
  const s = LT.Scenario.day1({ intervention: false, everyday: false, policies: { resident_a: pa.id, resident_b: pb.id } });
  s.placeCharacter(s.state.characters.resident_a, 'park'); s.placeCharacter(s.state.characters.resident_b, 'park');
  await s.runMinutes(minutes || 45);
  return s;
}

(async function () {
  console.log('# the day everyone knows is unchanged');
  const day = LT.Scenario.day1({});
  await day.runUntil(1, 1070);
  const meet = day.state.conversations.find((c) => c.status === 'completed' && c.startAbs >= 1030);
  ok(meet && meet.minutes === 25 && ev(day, 'TALKED').some((e) => e.absMinute === meet.startAbs + 25), 'the meeting at the park still runs its twenty-five minutes (from ' + LT.Util.clock(meet.startAbs % 1440) + ')');
  ok(meet.turns.length === 2 && meet.turns.every((t) => t.answers.resident_a === 'keep' && t.answers.resident_b === 'keep') && !meet.woundDownBy, 'both were asked twice, nine and seventeen minutes in, and both carried on');
  ok(meet.turns[0].openedAbs === meet.startAbs + 9 && meet.turns[1].openedAbs === meet.startAbs + 17, 'at the minutes the rule says');

  console.log('# bringing it to a close');
  const closer = talker(() => 'wind'), stayer = talker(() => 'keep');
  const before = LT.Scenario.day1({ intervention: false, everyday: false }).state.characters.resident_a.relationships.resident_b.closeness;
  const s1 = await twoInThePark(closer, stayer);
  const c1 = s1.state.conversations[0];
  ok(c1.status === 'completed' && c1.minutes === 10 && c1.endAbs - c1.startAbs === 10 && !!c1.woundDownBy, 'a talk closed at the first turn lasted ten minutes, not twenty-five');
  ok(ev(s1, 'TALKED').length === 1 && ev(s1, 'TALKED')[0].data.minutes === 10 && ev(s1, 'TALK_WOUND_DOWN').length === 1, 'it is still a talk they had: settled once, for the minutes it lasted, and it is said who closed it');
  const gain = s1.state.characters.resident_a.relationships.resident_b.closeness - before;
  ok(gain > 0 && gain < 4.1, 'one relationship gain, not one per turn (' + gain.toFixed(2) + ')');
  ok(s1.actorIds().every((id) => { const a = s1.state.characters[id].activity; return !a || !a.conversationId; }) && ev(s1, 'ACTIVITY_COMPLETED').filter((e) => /talk|join/.test(e.data.actionId)).length === 2, 'both people\'s part in it ended, together');
  const openA = s1.state.characters.resident_a.commitments.find((k) => k.id === 'cmt_meet_friend');
  ok(openA.status === 'open', 'a short talk at breakfast still does not keep an evening promise');

  console.log('# nothing else can be chosen mid-talk, and the two are offered at no other time');
  const turnAsks = closer.asked.filter((a) => a.reason === 'conversation_turn');
  ok(turnAsks.length === 1 && turnAsks[0].ids.length === 2 && /^keep_talking:conv_/.test(turnAsks[0].ids[0]) && /^wind_down:conv_/.test(turnAsks[0].ids[1]), 'a turn offers exactly: keep talking, or bring it to a close');
  ok(closer.asked.filter((a) => a.reason !== 'conversation_turn').every((a) => !a.ids.some((i) => /keep_talking|wind_down/.test(i))), 'and neither is on offer to someone who is not in a talk');
  ok(turnAsks[0].meta.minutesSoFar === 9 && turnAsks[0].meta.minutesLeft === 16 && turnAsks[0].meta.withId === 'resident_b', 'the candidate says how long it has been and how long is left');

  console.log('# words at each turn, in order');
  const wa = talker(() => 'keep', ['Have you a minute?', 'And then what happened?', 'No!']);
  const wb = talker(() => 'keep', ['For you, yes.', 'You will not believe it.', 'I should let you go.']);
  const s2 = await twoInThePark(wa, wb);
  const lines = s2.state.conversations[0].lines;
  ok(lines.length === 6 && lines.every((l, i) => i === 0 || l.absMinute >= lines[i - 1].absMinute), 'opening, reply, and two exchanges: six lines, in the order they were said');
  ok(ev(s2, 'SAID').length === 6 && new Set(lines.map((l) => l.actorId)).size === 2, 'each heard in the room as it was said, from both of them');
  const heard = wb.asked.filter((a) => a.reason === 'conversation_turn')[1].meta.said;
  ok(heard.length >= 3 && heard.some((x) => x.byId === 'resident_a' && x.text === 'And then what happened?'), 'and the other person\'s next turn is shown what has just been said to them');
  const silent = await twoInThePark(talker(() => 'keep'), talker(() => 'keep'));
  const mech = (s) => JSON.stringify(s.state.conversations.map((c) => [c.status, c.startAbs, c.endAbs, c.minutes, c.turns])) + JSON.stringify(s.actorIds().map((id) => [s.state.characters[id].pos, s.state.characters[id].needs]));
  ok(mech(silent) === mech(s2), 'with or without words the talk is mechanically the same talk');

  console.log('# a provider that does not answer a turn, or cannot');
  const mute = talker(() => 'never'), s3 = await twoInThePark(mute, talker(() => 'keep'));
  const c3 = s3.state.conversations[0];
  ok(c3.status === 'completed' && c3.minutes === 25 && c3.turns.length === 2 && c3.turns.every((t) => t.answers.resident_a === 'none'), 'no answer in three minutes is no answer: the talk runs its course');
  ok(s3.rejections.filter((r) => r.reason === 'turn_lapsed').length === 2 && !ev(s3, 'ACTIVITY_STARTED').some((e) => /^fallback/.test(e.data.source) && e.absMinute > c3.startAbs && e.absMinute < c3.endAbs), 'the lapsed questions are on the record, and nobody was dropped into waiting in the middle of talking');
  const down = talker(() => 'throw'), s4 = await twoInThePark(down, talker(() => 'keep'));
  ok(s4.state.conversations[0].minutes === 25 && s4.state.conversations[0].turns.every((t) => t.answers.resident_a === 'none') && down.asked.filter((a) => a.reason === 'conversation_turn').length === 2, 'a provider that fails is asked once per turn, not once a minute, and the talk goes on');

  console.log('# found in review: a talk broken off with a turn open');
  const holdA = talker(() => 'never'), holdB = talker(() => 'never');
  const s6 = LT.Scenario.day1({ intervention: false, everyday: false, policies: { resident_a: holdA.id, resident_b: holdB.id } });
  s6.placeCharacter(s6.state.characters.resident_a, 'park'); s6.placeCharacter(s6.state.characters.resident_b, 'park');
  while (!(s6.state.conversations[0] && s6.state.conversations[0].turn)) await s6.runMinutes(1);
  await s6.runMinutes(1);
  ok(s6.requestInterrupt('resident_b', 'called_away'), 'one of the two is called away while both are being asked whether to carry on');
  const c6 = s6.state.conversations[0], a6 = s6.state.characters.resident_a;
  ok(c6.status === 'broken_off' && c6.turn === null && c6.turns.length === 1, 'the talk is broken off and the turn ends with it');
  await s6.runMinutes(2);
  const asks = holdA.asked.slice(-1)[0];
  ok((a6.pending || a6.activity) && asks.reason !== 'conversation_turn' && asks.ids.length > 2, 'the other is not left holding a question about a talk that is over: within two minutes they are asked what to do next, with everything on offer');
  const s7 = LT.Save.deserialize(JSON.parse(JSON.stringify((function () { const x = LT.Save.serialize(s6); x.reissue.forEach((r) => { r.reason = 'conversation_turn'; }); return x; })())));
  ok(s7.actorIds().every((id) => { const p = s7.state.characters[id].pending; return !p || s7.requests[p.requestId].request.context.reason === 'idle'; }), 'and a save that still carried the old question re-asks it as what it now is');

  console.log('# found in review: a late answer played back is still a late answer');
  require(path.resolve(__dirname, '..', 'js', 'policy', 'lt-recorded-policy.js'));
  let release = [];
  const slowId = 'slow_winder_' + (++n);
  const slow = Pol.register({ id: slowId, decide(r) {
    if (r.context.reason !== 'conversation_turn') { const w = r.candidates.find((c) => /^(join_conversation|talk_with)/.test(c.id)) || r.candidates.find((c) => c.id === 'wait'); return Promise.resolve(Pol.selected(r, w.id, slowId)); }
    return new Promise((resolve) => { release.push(() => resolve(Pol.selected(r, r.candidates.find((c) => c.actionId === 'wind_down').id, slowId))); });
  } });
  const rec = LT.RecordedPolicy.record(slow, { id: 'rec_' + slowId });
  const s8 = LT.Scenario.day1({ intervention: false, everyday: false, policies: { resident_a: rec.id, resident_b: talker(() => 'keep').id } });
  s8.placeCharacter(s8.state.characters.resident_a, 'park'); s8.placeCharacter(s8.state.characters.resident_b, 'park');
  for (let i = 0; i < 45; i++) { await s8.runMinutes(1); const c = s8.state.conversations[0]; if (c && !c.turn && release.length) { release.forEach((f) => f()); release = []; } }
  const c8 = s8.state.conversations[0];
  ok(c8.minutes === 25 && c8.turns.every((t) => t.answers.resident_a === 'none') && s8.rejections.some((r) => r.reason === 'late_response'), 'live: "wind down" arrived after each turn had lapsed, so the talk ran its twenty-five minutes');
  const player = LT.RecordedPolicy.replay(rec.toJSON(), { id: 'play_' + slowId, unanswered: LT.RecordedPolicy.unansweredIn(s8) });
  const s9 = LT.Scenario.day1({ intervention: false, everyday: false, policies: { resident_a: player.id, resident_b: talker(() => 'keep').id } });
  s9.placeCharacter(s9.state.characters.resident_a, 'park'); s9.placeCharacter(s9.state.characters.resident_b, 'park');
  await s9.runMinutes(45);
  const c9 = s9.state.conversations[0];
  ok(c9.minutes === 25 && JSON.stringify(c9.turns) === JSON.stringify(c8.turns) && player.mismatches.length === 0, 'played back, it is the same twenty-five-minute talk — the late answers are not turned into timely ones');

  console.log('# saved in the middle of a turn');
  const live = LT.Scenario.town({});
  let midTurn = null;
  for (let m = 361; m < 1300 && !midTurn; m++) { await live.runUntil(1, m); midTurn = live.state.conversations.find((c) => c.status === 'active' && c.turn); }
  ok(!!midTurn, 'a town day has a turn open at ' + live.stamp());
  const loaded = LT.Save.deserialize(JSON.parse(JSON.stringify(LT.Save.serialize(live))));
  await live.runMinutes(120); await loaded.runMinutes(120);
  ok(strip(live) === strip(loaded), 'the loaded world and the one that never stopped are the same world two hours on');

  console.log('# in words, for a provider');
  const probe = talker(() => 'keep'), s5 = LT.Scenario.day1({ intervention: false, everyday: false, policies: { resident_a: probe.id, resident_b: talker(() => 'keep').id } });
  s5.placeCharacter(s5.state.characters.resident_a, 'park'); s5.placeCharacter(s5.state.characters.resident_b, 'park');
  let turnReq = null;
  const orig = probe.decide; probe.decide = function (r) { if (r.context.reason === 'conversation_turn' && !turnReq) turnReq = r; return orig.call(probe, r); };
  await s5.runMinutes(20);
  const brief = LT.PolicyBrief.render(turnReq);
  ok(/Why you are deciding now: you are in the middle of a talk/.test(brief.user) && /1\. id "keep_talking:conv_1"/.test(brief.user) && /2\. id "wind_down:conv_1"/.test(brief.user), 'the brief says it is a turn in a talk and lists the two options');
  ok(LT.PolicyBrief.parse(turnReq, '{"choose": 2, "say": "I must run."}', 'p').words.say === 'I must run.', 'and a reply may carry what is said at that turn');

  console.log('\nturns: ' + checks + '/' + checks);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
