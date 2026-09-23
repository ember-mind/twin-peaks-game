/* save-load.js — Living Town: persistence of the authoritative state.
 *
 * A save must be enough to resume the same town, not a lookalike: same people,
 * same names and looks, same money, same promises, same conversation, same
 * scheduled intervention, same generator stream — and none of the runtime
 * scaffolding that makes no sense across a reload (listeners, in-flight
 * questions, queued answers, pending decisions).
 *
 * node living-town/test/save-load.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');

require(path.resolve(__dirname, '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'js', 'policy', 'lt-mock-policy.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-save.js'));
const LT = global.LT;
const Save = LT.Save;

const closer = (c) => Math.round((c + 4 * (1 - c / 125)) * 100) / 100;   // +4, less the closer two people already are
let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

const copy = (v) => JSON.parse(JSON.stringify(v));
const count = (sim, type) => sim.state.events.filter((e) => e.type === type).length;
const starts = (sim, id) => sim.state.events.filter((e) => e.type === 'ACTIVITY_STARTED' && e.actorId === id);
const statuses = (sim, id) => sim.state.characters[id].commitments.map((c) => c.id + ':' + c.status).sort().join(',');
const eventTrace = (sim) => sim.state.events.map((e) => e.stamp + ' ' + e.type).join('\n');
function quiet(sim) { sim.requestDecision = function () { return null; }; return sim; }

/* ---------------- 1: round trip mid-day ---------------- */

async function roundTripMidDay() {
  console.log('# 1: round trip mid-day');
  const sim = LT.Scenario.day1({});
  await sim.runUntil(1, 900);
  /* A moment with no question outstanding: one that is gets asked again on
   * restore, which is test 2's business, not this one's. */
  while (sim.actorIds().some((id) => sim.state.characters[id].pending)) await sim.runMinutes(1);
  const saved = Save.serialize(sim);
  const restored = Save.fromJSON(Save.toJSON(sim));

  const expected = copy(sim.state);
  Object.keys(expected.characters).forEach((id) => { expected.characters[id].pending = null; });
  assert.deepEqual(restored.state, expected);
  ok(true, 'restored state deep-equals the original with every pending normalised to null');

  ok(saved.format === Save.FORMAT && saved.savedAt === sim.stamp(),
     'format is the constant and savedAt is the sim clock (' + saved.savedAt + '), not wall time');
  ok(restored.state.version === sim.state.version && restored.eventSeq === sim.eventSeq,
     'version and event sequence survive the round trip');
  ok(restored.state.characters.resident_a.activity &&
     restored.state.characters.resident_a.activity.actionId === sim.state.characters.resident_a.activity.actionId,
     'an activity in flight survives verbatim');
}

/* ---------------- 2: resume is identical (the real acceptance test) ---------------- */

async function resumeIsIdentical() {
  console.log('# 2: a restored world resumes identically');
  const direct = LT.Scenario.day1({});
  const toSave = LT.Scenario.day1({});
  await direct.runUntil(1, 900);
  await toSave.runUntil(1, 900);

  const text = Save.toJSON(toSave);
  await direct.runUntil(1, 1200);
  const restored = Save.fromJSON(text);
  await restored.runUntil(1, 1200);

  const same = (id) => {
    const a = direct.state.characters[id], b = restored.state.characters[id];
    return a.savings === b.savings && a.money === b.money && a.location === b.location;
  };
  ok(same('resident_a') && same('resident_b'),
     'both inhabitants end with the same savings, money and location as the uninterrupted run');
  ok(statuses(direct, 'resident_a') === statuses(restored, 'resident_a') &&
     statuses(direct, 'resident_b') === statuses(restored, 'resident_b'),
     'every commitment reaches the same status');
  ok(eventTrace(direct) === eventTrace(restored),
     'the full (stamp, type) event sequence is identical');
  const itv = restored.state.interventions[0];
  ok(itv && itv.status === 'applied' && restored.state.events.some((e) => e.type === 'INTERVENTION_APPLIED'),
     'the 16:30 intervention scheduled before the save fired after the restore');
}

/* ---------------- 3: names and looks survive ---------------- */

async function namesAndLooksSurvive() {
  console.log('# 3: names, looks and place names survive a changed content pool');
  const sim = LT.Scenario.day1({});
  await sim.runUntil(1, 420);
  const before = {};
  Object.keys(sim.state.characters).forEach((id) => {
    const c = sim.state.characters[id];
    before[id] = { name: c.name, familyName: c.familyName, fullName: c.fullName, appearanceId: c.appearanceId };
  });
  const placeNames = copy(sim.state.locationNames);
  const text = Save.toJSON(sim);

  const names = LT.Names.FIRST, looks = LT.Appearance.BASE_IDS;
  let restored;
  try {
    LT.Names.FIRST = ['Onlyname'];
    LT.Appearance.BASE_IDS = ['look_teal_bob'];
    restored = Save.fromJSON(text);
  } finally {
    LT.Names.FIRST = names;
    LT.Appearance.BASE_IDS = looks;
  }

  let sameNames = true, sameLooks = true;
  Object.keys(before).forEach((id) => {
    const c = restored.state.characters[id];
    if (c.name !== before[id].name || c.familyName !== before[id].familyName || c.fullName !== before[id].fullName) sameNames = false;
    if (c.appearanceId !== before[id].appearanceId) sameLooks = false;
  });
  ok(sameNames, 'every restored character keeps the name it was saved with, even when the pool changed');
  ok(sameLooks, 'every restored character keeps the look it was saved with, even when the sheet changed');
  assert.deepEqual(restored.state.locationNames, placeNames);
  ok(true, 'state.locationNames is restored verbatim (the flat named after its resident keeps its name)');
}

/* ---------------- 4: ids, not names ---------------- */

async function idsNotNames() {
  console.log('# 4: references are character ids, never display names');
  const sim = LT.Scenario.day1({});
  await sim.runUntil(1, 900);
  const restored = Save.fromJSON(Save.toJSON(sim));
  const idSet = new Set(Object.keys(restored.state.characters));
  const nameSet = new Set(Object.keys(restored.state.characters).map((id) => restored.state.characters[id].name));
  const bad = [];

  restored.state.events.forEach((e) => {
    if (e.actorId && !idSet.has(e.actorId)) bad.push('event.actorId=' + e.actorId);
    if (e.subjectId && !idSet.has(e.subjectId)) bad.push('event.subjectId=' + e.subjectId);
  });
  Object.keys(restored.state.characters).forEach((id) => {
    const c = restored.state.characters[id];
    Object.keys(c.relationships || {}).forEach((k) => { if (!idSet.has(k)) bad.push('relationship key=' + k); });
    (c.commitments || []).forEach((k) => {
      if (k.withId && k.withId !== 'cafe' && !idSet.has(k.withId)) bad.push('commitment.withId=' + k.withId);
    });
  });
  restored.state.conversations.forEach((c) => {
    c.participants.forEach((p) => { if (!idSet.has(p)) bad.push('participant=' + p); });
  });
  restored.state.offers.forEach((o) => { if (o.toId && !idSet.has(o.toId)) bad.push('offer.toId=' + o.toId); });

  ok(bad.length === 0, 'every person reference resolves to a character id (' + (bad.slice(0, 3).join('; ') || 'none bad') + ')');
  const nameRefs = bad.filter((b) => nameSet.has(b.split('=')[1]));
  ok(nameRefs.length === 0, 'no person reference is a display name masquerading as an id');
}

/* ---------------- 5: version monotonicity ---------------- */

async function versionMonotonicity() {
  console.log('# 5: state.version is monotonic across a restore');
  const sim = LT.Scenario.day1({});
  await sim.runUntil(1, 600);
  const saved = Save.serialize(sim);
  const restored = Save.deserialize(saved);
  ok(restored.state.version === saved.state.version, 'a restored sim starts from the saved version');
  let last = restored.state.version, mono = true;
  for (let i = 0; i < 20; i++) {
    restored.tick();
    if (restored.state.version < last) mono = false;
    last = restored.state.version;
  }
  ok(mono && restored.state.version > saved.state.version, 'version only ever increases as the restored sim ticks');
}

/* ---------------- 6: a pending decision is dropped and re-asked ---------------- */

async function pendingDecisionIsDropped() {
  console.log('# 6: a pending decision is never saved; the question is asked again');
  const id = 'save-hold';
  const sim = LT.Scenario.day1({ intervention: false, policies: { resident_a: id, resident_b: 'utility' } });
  LT.MockPolicy.create({ id: id, script: [{ delayTicks: 5 }] });
  sim.state.minute = 500;
  await sim.runMinutes(1);   // issues a request whose answer is held

  const a = sim.state.characters.resident_a;
  assert(a.pending, 'precondition: the live sim holds a pending decision');
  const savedSeq = a.pending.seq;
  const json = Save.toJSON(sim);
  const parsed = JSON.parse(json);
  ok(parsed.state.characters.resident_a.pending === null, 'the saved copy writes pending: null');
  ok(a.pending && a.pending.seq === savedSeq, 'the live sim pending decision is untouched by serialising');

  const restored = Save.fromJSON(json, { policies: { resident_a: 'utility', resident_b: 'utility' } });
  const reasked = restored.state.characters.resident_a.pending;
  ok(reasked && reasked.seq === savedSeq && parsed.reissue.some((r) => r.actorId === 'resident_a' && r.reason === 'idle' && r.seq === savedSeq),
     'the open question is put again at load, under its own number, to the policy now answering for them');
  const startedBefore = starts(restored, 'resident_a').length;

  await restored.runMinutes(6);
  const seqs = Object.keys(restored.requests).map((k) => restored.requests[k].request.seq);
  ok(seqs.length > 0 && new Set(seqs).size === seqs.length && Math.min.apply(null, seqs) === savedSeq,
     'request numbers carry on from the re-asked one, none issued twice');
  ok(starts(restored, 'resident_a').length > startedBefore,
     'an activity starts within a few ticks instead of waiting out the 30-minute timeout');
  const ids2 = starts(restored, 'resident_a').map((e) => e.data.requestId);
  ok(new Set(ids2).size === ids2.length, 'no activity was started twice');
}

/* ---------------- 7: a dropped inbox answer is safe ---------------- */

async function droppedInboxIsSafe() {
  console.log('# 7: queued answers are dropped, not replayed');
  const sim = LT.Scenario.day1({ intervention: false });
  sim.state.minute = 500;
  await sim.runMinutes(1);
  await new Promise((r) => setTimeout(r, 0));   // let the answers land, without a flush
  assert(sim.inbox.length > 0, 'precondition: an answer is waiting in the live inbox');
  const dropped = copy(sim.inbox[0]);

  const json = Save.toJSON(sim);
  const parsed = JSON.parse(json);
  ok(parsed.inbox === undefined && parsed.requests === undefined,
     'the save carries neither the inbox nor the request table');
  const restored = Save.fromJSON(json);
  ok(restored.inbox.length === 0, 'the restored sim starts with an empty inbox');

  const refused = restored.deliver(dropped);
  ok(refused === false && restored.rejections.some((r) => r.reason === 'unknown_request'),
     'the dropped answer is refused as an unknown request after reload');

  await restored.runMinutes(5);
  ok(!restored.state.events.some((e) => e.type === 'ACTIVITY_STARTED' && e.data && e.data.requestId === dropped.requestId),
     'no activity can be traced to the dropped answer');
  const allStartIds = restored.state.events.filter((e) => e.type === 'ACTIVITY_STARTED').map((e) => e.data.requestId);
  ok(new Set(allStartIds).size === allStartIds.length, 'no activity was started twice');
}

/* ---------------- 8: format and integrity rejection ---------------- */

function rejectionChecks() {
  console.log('# 8: unknown formats and tampered saves are refused');
  assert.throws(() => Save.deserialize({ format: 'nope' }), /unsupported save format: nope/);
  ok(true, "an unknown format throws 'unsupported save format: <x>'");
  assert.throws(() => Save.deserialize({}), /unsupported save format: /);
  ok(true, 'a save with no format is refused the same way');

  const saved = Save.serialize(LT.Scenario.day1({}));
  saved.integrity.events += 1;
  assert.throws(() => Save.deserialize(saved), /save integrity check failed: /);
  ok(true, "a tampered integrity block throws 'save integrity check failed: <detail>'");
}

/* ---------------- 9: the migration hook ---------------- */

function migrationHook() {
  console.log('# 9: a migration chain upgrades an older format');
  const saved = JSON.parse(Save.toJSON(LT.Scenario.day1({})));
  const original = saved.state.characters.resident_a.name;
  saved.format = 'living-town/save@0';

  Save.MIGRATIONS['living-town/save@0'] = function (old) { old.format = 'living-town/save@0.5'; return old; };
  Save.MIGRATIONS['living-town/save@0.5'] = function (old) { old.format = Save.FORMAT; old.upgraded = true; return old; };
  try {
    const restored = Save.deserialize(saved);
    ok(restored.state.characters.resident_a.name === original, 'a save relabelled @0 is upgraded through two hops and loads');
    ok(true, 'the loader follows the whole migration chain, not just one step');
  } finally {
    delete Save.MIGRATIONS['living-town/save@0'];
    delete Save.MIGRATIONS['living-town/save@0.5'];
  }
}

/* ---------------- 10: a conversation survives ---------------- */

async function conversationSurvives() {
  console.log('# 10: a conversation survives a save exactly once');
  const sim = quiet(LT.Scenario.day1({ intervention: false }));
  sim.state.minute = 1040;
  const a = sim.state.characters.resident_a, b = sim.state.characters.resident_b;
  sim.placeCharacter(a, 'park');
  sim.placeCharacter(b, 'park');
  const relA = copy(a.relationships.resident_b), relB = copy(b.relationships.resident_a);

  require('./lib-talk.js').converse(sim, a, b);
  ok(a.activity.conversationId === b.activity.conversationId, 'the conversation is one shared activity across both people');
  for (let i = 0; i < 10; i++) sim.tick();

  const restored = quiet(Save.fromJSON(Save.toJSON(sim)));
  await restored.runMinutes(20);

  ok(count(restored, 'TALKED') === 1, 'exactly one TALKED event after the restore');
  const conv = restored.state.conversations[0];
  ok(conv && conv.status === 'completed', 'the conversation record ends completed');
  const ra = restored.state.characters.resident_a.relationships.resident_b;
  const rb = restored.state.characters.resident_b.relationships.resident_a;
  ok(ra.trust === relA.trust + 3 && ra.closeness === closer(relA.closeness) &&
     rb.trust === relB.trust + 3 && rb.closeness === closer(relB.closeness),
     'the +3 trust / +4 closeness gain is applied once per participant, not once per activity');
}

/* ---------------- 11: an accepted shift keeps its absolute window ---------------- */

function acceptedShiftKeepsWindow() {
  console.log('# 11: an accepted shift keeps its absolute window');
  const sim = quiet(LT.Scenario.day1({}));
  const a = sim.state.characters.resident_a;
  sim.state.minute = 985;
  sim.placeCharacter(a, 'cafe');
  for (let i = 0; i < 6; i++) sim.tick();
  const offer = sim.state.offers[0];
  sim.acceptOffer(a, offer);

  const restored = Save.fromJSON(Save.toJSON(sim));
  const r = restored.state.offers[0];
  ok(r.startAbs === offer.startAbs && r.endAbs === offer.endAbs, 'startAbs and endAbs survive the save');
  ok(r.status === 'accepted', 'the accepted status survives');
  assert.deepEqual(r.perceivedBy, offer.perceivedBy);
  ok(true, 'perceivedBy survives, so nobody forgets an opportunity they had already seen');
}

/* ---------------- 12: no static content in a save ---------------- */

async function noStaticContent() {
  console.log('# 12: static world content is never duplicated into a save');
  const sim = LT.Scenario.day1({});
  await sim.runUntil(1, 900);
  const json = Save.toJSON(sim);
  ok(json.indexOf('#####DD#####') === -1, "the save does not contain a single map row ('#####DD#####')");
  ok(json.indexOf('######DD######') === -1, 'nor the café rows the painter draws from');
  ok(LT.World.LOCATIONS.flat_a.rows.indexOf('#####DD#####') >= 0,
     'that geometry still lives only in lt-world.js, where it belongs');
}

async function fullDaySerialises() {
  console.log('# extra: a full simulated day serialises and reloads');
  const sim = LT.Scenario.day1({});
  await sim.runUntil(1, 1439);
  let text = null;
  assert.doesNotThrow(() => { text = Save.toJSON(sim); });
  ok(text && text.length > 0, 'toJSON survives a full day of events and memories');
  const restored = Save.fromJSON(text);
  const memOk = restored.state.characters.resident_a.memories.every((m) =>
    restored.state.events.some((e) => e.seq === m.eventSeq)) &&
    restored.state.characters.resident_b.memories.every((m) =>
      restored.state.events.some((e) => e.seq === m.eventSeq));
  ok(memOk, 'every memory back-reference still resolves against the restored event log');
}

/* ---------------- 13: every moment of the day is a safe moment to save ---------------- */

/* version counts touches, and a re-asked question's id names the load that
 * asked it. Every other byte of the state must match, request numbers included. */
function facts(sim) {
  const s = copy(sim.state);
  delete s.version;
  return JSON.stringify(s).replace(/"requestId":"req_(\d+)\.\d+"/g, '"requestId":"req_$1"');
}

async function anyMomentIsSafe() {
  console.log('# 13: saving mid-walk, mid-transit, mid-activity or mid-question changes nothing that follows');
  const seen = { walking: 0, transit: 0, activity: 0, question: 0, conversation: 0 };
  let points = 0;
  for (let minute = 365; minute < 1435; minute += 23) {
    const direct = LT.Scenario.day1({}), saver = LT.Scenario.day1({});
    await direct.runUntil(1, minute); await saver.runUntil(1, minute);
    const people = Object.values(saver.state.characters);
    if (people.some((c) => c.walkTarget && !c.transit)) seen.walking++;
    if (people.some((c) => c.transit)) seen.transit++;
    if (people.some((c) => c.activity && c.activity.elapsed > 0)) seen.activity++;
    if (people.some((c) => c.pending)) seen.question++;
    if (saver.state.conversations.some((c) => !c.endedAbs && c.status !== 'completed' && c.status !== 'ended')) seen.conversation++;
    const restored = Save.fromJSON(Save.toJSON(saver));
    await direct.runUntil(2, 480); await restored.runUntil(2, 480);
    assert.equal(facts(restored), facts(direct), 'a save at minute ' + minute + ' resumed into a different town');
    points++;
  }
  ok(points === 47, points + ' save points across the day each resume into exactly the town that was never saved');
  ok(seen.walking > 0 && seen.transit > 0 && seen.activity > 0 && seen.question > 0,
     'including mid-walk (' + seen.walking + '), on the street between places (' + seen.transit + '), mid-activity (' + seen.activity + ') and with a decision in flight (' + seen.question + ')');
}

async function nothingHappensTwice() {
  console.log('# 14: no wage, purchase or completion is applied twice by a reload');
  const direct = LT.Scenario.day1({});
  await direct.runUntil(2, 480);
  /* the same day, saved and reloaded every 37 minutes */
  let sim = LT.Scenario.day1({}), reloads = 0;
  for (let abs = 360 + 37; abs < 1440 + 480; abs += 37) {
    await sim.runUntil(abs >= 1440 ? 2 : 1, abs % 1440);
    sim = Save.fromJSON(Save.toJSON(sim)); reloads++;
  }
  await sim.runUntil(2, 480);
  const a = sim.state.characters.resident_a, d = direct.state.characters.resident_a;
  ok(a.money === d.money && a.savings === d.savings && a.pantry === d.pantry,
     reloads + ' reloads later, money ' + a.money + ', savings ' + a.savings + ' and pantry ' + a.pantry + ' equal the uninterrupted day');
  const completions = (s) => s.state.events.filter((e) => e.type === 'ACTIVITY_COMPLETED').map((e) => e.stamp + e.actorId + e.data.actionId);
  ok(JSON.stringify(completions(sim)) === JSON.stringify(completions(direct)) && new Set(completions(sim)).size === completions(sim).length,
     'every activity completes once, at the same minute (' + completions(sim).length + ' completions)');
  ok(facts(sim) === facts(direct), 'and the whole town is the same town');
}

/* ---------------- 15: a save that does not fit is refused out loud ---------------- */

function refusalsAreExplicit() {
  console.log('# 15: a save that does not fit this build is refused, with the reason, and left alone');
  const fresh = () => copy(Save.serialize(LT.Scenario.day1({})));
  const refuses = (saved, pattern, msg) => {
    const before = JSON.stringify(saved);
    assert.throws(() => Save.deserialize(saved), pattern);
    ok(JSON.stringify(saved) === before, msg);
  };

  const otherTown = fresh(); otherTown.world = 'deadbeef';
  refuses(otherTown, /different version of the town \(deadbeef; this build is [0-9a-f]{8}\).*no migration/, 'a save from a differently laid-out town is refused by fingerprint, not loaded onto the new furniture');
  const unrecorded = fresh(); delete unrecorded.world;
  refuses(unrecorded, /different version of the town \(unrecorded/, 'a save that never recorded its town is refused the same way');

  const lostLook = fresh(); lostLook.state.characters.resident_a.appearanceId = 'look_retired';
  refuses(lostLook, /resident_a has the look "look_retired", which this build cannot draw/, 'a look this build cannot draw is refused rather than drawn as somebody else');
  const noName = fresh(); noName.state.characters.resident_b.name = '';
  refuses(noName, /resident_b has no name/, 'a person with no name is refused rather than renamed');

  const inCounter = fresh(); inCounter.state.characters.resident_b.location = 'cafe'; inCounter.state.characters.resident_b.pos = { x: 3, y: 3, dir: 'down' };
  refuses(inCounter, /resident_b stands 3,3 in cafe, which is not floor/, 'someone saved inside the counter is refused');
  const badTarget = fresh(); badTarget.state.characters.resident_b.walkTarget = { x: 1, y: 3 };
  refuses(badTarget, /resident_b is walking to 1,3 in cafe, which is not floor/, 'so is a walk whose destination is furniture');
  const nowhere = fresh(); nowhere.state.characters.resident_a.location = 'harbour';
  refuses(nowhere, /resident_a is in "harbour", which is not a place in this town/, 'and a place that does not exist');

  const noBrain = fresh(); noBrain.state.characters.resident_a.policyId = 'model-not-installed'; noBrain.policies.resident_a = 'model-not-installed';
  refuses(noBrain, /resident_a is decided by the policy "model-not-installed", which is not registered/, 'an unregistered policy is refused at load, not discovered as a crash on the first tick');
  ok(Save.deserialize(noBrain, { policies: { resident_a: 'utility', resident_b: 'utility' } }).state.characters.resident_a.policyId === 'utility',
     'and naming a registered policy for them at load is the way through');
}

function worldMigrationIsVerified() {
  console.log('# 16: a town migration is a registered, verified step');
  const old = copy(Save.serialize(LT.Scenario.day1({})));
  old.world = 'oldtown1';
  old.state.characters.resident_b.location = 'cafe';
  old.state.characters.resident_b.pos = { x: 3, y: 3, dir: 'down' };   // floor in the old town, counter in this one

  Save.WORLD_MIGRATIONS.oldtown1 = (s) => { s.world = LT.World.fingerprint(); return s; };   // claims to fit, moves nobody
  assert.throws(() => Save.deserialize(old), /resident_b stands 3,3 in cafe, which is not floor/);
  ok(true, 'a migration that leaves someone inside furniture is caught by the same checks as any save');

  Save.WORLD_MIGRATIONS.oldtown1 = (s) => {
    const spawn = LT.World.LOCATIONS.cafe.spawn;
    s.state.characters.resident_b.pos = { x: spawn.x, y: spawn.y, dir: 'up' };
    s.state.characters.resident_b.walkTarget = null;
    s.world = LT.World.fingerprint();
    return s;
  };
  const moved = Save.deserialize(old).state.characters.resident_b;
  ok(moved.pos.x === LT.World.LOCATIONS.cafe.spawn.x && moved.name === old.state.characters.resident_b.name && moved.appearanceId === old.state.characters.resident_b.appearanceId,
     'one that moves them to the door loads, with the same name and look');
  ok(old.world === 'oldtown1' && old.state.characters.resident_b.pos.x === 3, 'the old save itself is never rewritten by migrating it');
  Save.WORLD_MIGRATIONS.oldtown1 = (s) => s;
  assert.throws(() => Save.deserialize(old), /made no progress/);
  ok(true, 'and one that goes nowhere is stopped');
  delete Save.WORLD_MIGRATIONS.oldtown1;
}

function localStorageNeverResetsSilently() {
  console.log('# 17: the browser helper tells "no save" from "a save I cannot use"');
  const store = {};
  global.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
  ok(Save.readLocal().status === 'none', 'nothing stored: none');
  ok(Save.writeLocal(LT.Scenario.day1({})).ok === true && Save.readLocal().status === 'loaded' && !!Save.readLocal().sim.state, 'a good save: loaded, with the town');
  const bad = JSON.parse(store[Save.DEFAULT_KEY]); bad.world = 'deadbeef'; store[Save.DEFAULT_KEY] = JSON.stringify(bad);
  const kept = store[Save.DEFAULT_KEY];
  const r = Save.readLocal();
  ok(r.status === 'refused' && r.sim === null && /different version of the town/.test(r.reason), 'a save from another town: refused, with the sentence to show');
  ok(store[Save.DEFAULT_KEY] === kept, 'and the refused save is still in storage, untouched');
  store[Save.DEFAULT_KEY] = '{not json';
  ok(Save.readLocal().status === 'refused', 'unreadable text is refused too, never mistaken for "no save"');
  global.localStorage = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('SecurityError'); } };
  const blocked = Save.readLocal(), blockedWrite = Save.writeLocal(LT.Scenario.day1({}));
  ok(blocked.status === 'unavailable' && /could not be read/.test(blocked.reason) && Save.peekLocal().status === 'unavailable',
     'storage that throws is "unavailable", with the error — never "none"');
  ok(blockedWrite.ok === false && /refused the write/.test(blockedWrite.reason), 'and a failed write says it failed');
  global.localStorage = { getItem: () => null, setItem() { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; } };
  ok(/QuotaExceededError/.test(Save.writeLocal(LT.Scenario.day1({})).reason), 'a full store is reported by name');
  global.localStorage = { getItem: () => 'something else', setItem() {} };
  ok(Save.writeLocal(LT.Scenario.day1({})).ok === false, 'a write that does not read back is not reported as a save');
  delete global.localStorage;
  ok(Save.readLocal().status === 'unavailable' && Save.writeLocal(LT.Scenario.day1({})).status === 'unavailable', 'no storage at all: unavailable, both ways');
}

/* ---------------- 18: a recording still lines up after a reload ---------------- */

async function replaySurvivesReload() {
  console.log('# 18: a recorded run replays across a save, with or without a question in flight');
  require(path.resolve(__dirname, '..', 'js', 'policy', 'lt-recorded-policy.js'));
  const recorded = LT.Sim.create({ seed: 20260918, policies: { resident_a: 'save-recorder', resident_b: 'utility' } });
  recorded.scheduleIntervention(LT.Scenario.EXTRA_SHIFT);
  const recorder = LT.RecordedPolicy.record(LT.UtilityPolicy, { id: 'save-recorder' });
  await recorded.runUntil(1, 1439);
  const recording = copy(recorder.toJSON());

  /* Two reload points with a question in flight and two without, found by
   * looking rather than hard-coded: when people decide depends on how long
   * they spend walking to things. */
  const probe = LT.Sim.create({ seed: 20260918, policies: { resident_a: 'utility', resident_b: 'utility' } });
  probe.scheduleIntervention(LT.Scenario.EXTRA_SHIFT);
  const asking = [], settled = [];
  for (let m = 420; m < 1300 && (asking.length < 2 || settled.length < 2); m++) {
    await probe.runUntil(1, m);
    const open = !!probe.state.characters.resident_a.pending;
    if (open && asking.length < 2 && (!asking.length || m - asking[asking.length - 1] > 120)) asking.push(m);
    if (!open && settled.length < 2 && m % 97 === 0) settled.push(m);
  }
  let inFlight = 0;
  for (const minute of asking.concat(settled)) {
    /* first half in one "process" ... */
    const id1 = 'save-player-a-' + minute, id2 = 'save-player-b-' + minute;
    LT.RecordedPolicy.replay(recording, { id: id1 });
    const first = LT.Sim.create({ seed: 20260918, policies: { resident_a: id1, resident_b: 'utility' } });
    first.scheduleIntervention(LT.Scenario.EXTRA_SHIFT);
    await first.runUntil(1, minute);
    if (first.state.characters.resident_a.pending) inFlight++;
    const text = Save.toJSON(first);
    /* ... second half with a player that has never been asked anything */
    const player = LT.RecordedPolicy.replay(recording, { id: id2 });
    const second = Save.fromJSON(text, { policies: { resident_a: id2, resident_b: 'utility' } });
    await second.runUntil(1, 1439);
    assert.equal(player.mismatches.length, 0, 'reload at ' + minute + ': ' + JSON.stringify(player.mismatches.slice(0, 2)));
    assert.equal(second.state.characters.resident_a.savings, recorded.state.characters.resident_a.savings, 'reload at ' + minute + ' changed the savings');
    assert.equal(eventTrace(second), eventTrace(recorded), 'reload at ' + minute + ' changed the event sequence');
  }
  ok(inFlight >= 2, 'four reload points, ' + inFlight + ' of them with a question in flight: zero replay mismatches, same savings, same event sequence');
}

/* ---------------- 19: reloading around a genuinely asynchronous answer ---------------- */

async function asynchronousAnswersAcrossReload() {
  console.log('# 19: reloading while an answer is immediate, held for several ticks, arrived-but-unapplied, or never coming');
  const mk = (script) => { const id = 'save-async-' + (++asyncN); return { id, mock: LT.MockPolicy.create({ id, script }) }; };
  const simFor = (id, extra) => { const sim = LT.Scenario.day1(Object.assign({ intervention: false, policies: { resident_a: id, resident_b: 'utility' } }, extra || {})); sim.state.minute = 500; return sim; };
  const startsA = (sim) => starts(sim, 'resident_a');

  /* immediate: answered within the same turn, waiting in the inbox at save time */
  let p = mk([{ prefer: 'wait' }, { prefer: 'wait' }, { prefer: 'wait' }]);
  let sim = simFor(p.id);
  await sim.runMinutes(1);
  assert(sim.inbox.length > 0 && sim.state.characters.resident_a.pending, 'precondition: the answer has arrived and has not been applied');
  const arrived = copy(sim.inbox.filter((r) => r.requestId === sim.state.characters.resident_a.pending.requestId)[0]);
  let restored = Save.fromJSON(Save.toJSON(sim));
  ok(restored.inbox.length === 0 && restored.state.characters.resident_a.pending.requestId === arrived.requestId + '.1',
     'arrived-but-unapplied: the answer is not carried over; the question is, as ' + restored.state.characters.resident_a.pending.requestId);
  ok(restored.deliver(arrived) === false && restored.rejections.slice(-1)[0].reason === 'unknown_request', 'the old process\'s answer, delivered to the new world, is an unknown request');
  await sim.runMinutes(1); await restored.runMinutes(1);
  ok(startsA(restored).length === 1 && startsA(sim).length === 1 && startsA(restored)[0].absMinute === startsA(sim)[0].absMinute,
     'the re-asked question is answered and applied once, in the same minute the uninterrupted world applied its own');
  ok(p.mock.calls.filter((c) => c.actorId === 'resident_a').length >= 2, 'the provider really was asked again — it was not replayed from the save');

  /* held for several ticks */
  p = mk([{ delayTicks: 4, prefer: 'wait' }, { delayTicks: 2, prefer: 'wash_and_dress' }]);
  sim = simFor(p.id);
  await sim.runMinutes(2);
  const firstAsk = sim.state.characters.resident_a.pending.issuedAbs;
  restored = Save.fromJSON(Save.toJSON(sim));
  const again = restored.state.characters.resident_a.pending;
  ok(again.issuedAbs === firstAsk && again.seq === sim.state.characters.resident_a.pending.seq, 'held: re-asked under the same number, still dated from the first asking (' + firstAsk + ')');
  await restored.runMinutes(3);
  ok(startsA(restored).length === 0 && restored.state.characters.resident_a.pending, 'while the new answer is held the person waits, as before the save');
  p.mock.releaseAll();                    // releases the old world's answer and the new world's
  await sim.runMinutes(2); await restored.runMinutes(2);
  ok(startsA(sim).length === 1 && startsA(sim)[0].data.actionId === 'wait', 'the old world got the old answer (wait) ...');
  ok(startsA(restored).length === 1 && startsA(restored)[0].data.actionId === 'wash_and_dress',
     '... and the new world got the answer to its own asking (wash_and_dress): a different one, which is allowed, and only one');
  ok(!restored.rejections.some((r) => r.reason === 'duplicate_response'), 'nothing from the old process reached the new world at all');

  /* never coming: reloading must not renew the timeout */
  p = mk([{ silent: true }, { silent: true }, { silent: true }, { silent: true }, { silent: true }]);
  sim = simFor(p.id);
  await sim.runMinutes(1);
  const asked = sim.state.characters.resident_a.pending.issuedAbs;
  let reloads = 0;
  while (!sim.rejections.some((r) => r.actorId === 'resident_a' && r.reason === 'policy_timeout') && sim.absMinute() < asked + 90) {
    await sim.runMinutes(8);
    sim = Save.fromJSON(Save.toJSON(sim)); reloads++;
  }
  const timedOut = sim.rejections.find((r) => r.actorId === 'resident_a' && r.reason === 'policy_timeout');
  ok(timedOut && sim.absMinute() - asked <= 30 + 8 && reloads >= 3,
     'never answered, reloaded every 8 minutes (' + reloads + ' times): the 30-minute timeout still fires, ' + (sim.absMinute() - asked) + ' minutes after the first asking');
  const a = sim.state.characters.resident_a;
  ok(starts(sim, 'resident_a').some((e) => /^fallback:policy_timeout/.test(e.data.source)), 'and the person falls back to waiting, tagged as a fallback, not as a choice');
  void a;
}
let asyncN = 0;

/* ---------------- 20: a real save from the previous format ---------------- */

async function previousFormatIsMigrated() {
  console.log('# 20: a save written by the previous build (save@1) is migrated, and verified');
  const text = require('node:fs').readFileSync(path.resolve(__dirname, 'fixtures', 'save-v1-walking-to-work.json'), 'utf8');
  const old = JSON.parse(text);
  ok(old.format === 'living-town/save@1' && old.state.characters.resident_a.activity.phase === undefined && old.state.characters.resident_a.activity.elapsed === 3,
     'the fixture is a genuine @1 save: 09:11, walking to the counter, with 3 "worked" minutes already counted on the way');
  const sim = Save.fromJSON(text);
  const a = sim.state.characters.resident_a;
  ok(a.name === old.state.characters.resident_a.name && a.appearanceId === old.state.characters.resident_a.appearanceId, 'same person, same look');
  ok(a.activity.phase === 'approaching' && a.activity.elapsed === 0 && a.activity.approachMinutes === 3, 'they come back approaching; the three minutes are recorded as the walk they were');
  const before = a.money + a.savings;
  await sim.runMinutes(140);
  const worked = sim.state.events.filter((e) => e.type === 'WORKED');
  const reached = sim.state.events.find((e) => e.type === 'ACTIVITY_REACHED');
  ok(reached && worked.length === 1 && worked[0].absMinute - reached.absMinute === worked[0].data.minutes, 'work is counted from reaching the counter (' + reached.stamp + '), for ' + worked[0].data.minutes + ' minutes');
  ok(Math.abs((a.money + a.savings - before) - worked[0].data.gross) < 0.011, 'and paid for exactly those');
  ok(JSON.parse(text).format === 'living-town/save@1', 'the old save text is not rewritten by loading it');
  {
    const migrated = Save.deserialize(JSON.parse(text));
    const freshPair = LT.Scenario.day1({});
    const town = (sim) => JSON.stringify(sim.state.objects.filter((o) => !o.typeId).map((o) => [o.id, o.location, o.x, o.y, o.anchors || null, o.moreAnchors || null, o.affordances]).sort());
    ok(town(migrated) === town(freshPair) && JSON.stringify(Object.keys(migrated.state.locationNames).sort()) === JSON.stringify(Object.keys(freshPair.state.locationNames).sort()) && migrated.state.cast === 'pair',
       'migrated from 6d2aa6eb, the town\'s furniture and places are exactly this build\'s, and nobody was added');
  }
  {
    /* The street got its houses (e3450c3d -> this town). A real save from the old street: five people, one of them walking home. */
    const oldText = require('node:fs').readFileSync(path.resolve(__dirname, 'fixtures', 'save-town-e3450c3d-walking-home.json'), 'utf8');
    const old = JSON.parse(oldText);
    const walker = Object.keys(old.state.characters).map((id) => old.state.characters[id]).find((c) => c.location === 'street' && c.walkTarget);
    ok(old.world === 'e3450c3d' && walker && walker.transit.to === 'flat_b' && walker.walkTarget.x === 1 && walker.walkTarget.y === 6, 'the fixture is a genuine old-street save: ' + walker.name + ' on the way home, heading for where her door used to meet the street');
    /* Each step is checked on what that step returns; the later steps carry the save on to this town. */
    const stepped = Save.WORLD_MIGRATIONS.e3450c3d(JSON.parse(oldText)).state.characters[walker.id];
    ok(stepped.pos.x === walker.pos.x && stepped.pos.y === walker.pos.y && stepped.walkTarget.x === 1 && stepped.walkTarget.y === 7, 'she stands where she stood and is now heading for where the door is');
    const moved = Save.deserialize(JSON.parse(oldText));
    const w = moved.state.characters[walker.id];
    ok(moved.actorIds().every((id) => { const c = moved.state.characters[id]; return !LT.World.isSolid(LT.World.LOCATIONS[c.location].rows[c.pos.y].charAt(c.pos.x)); }), 'nobody has ended up inside a house front');
    await moved.runMinutes(30);
    ok(w.location === 'flat_b' && !w.transit, 'and she gets home');
    await moved.runUntil(2, 0);
    ok(moved.state.events.filter((e) => e.type === 'ARRIVED').length > 10 && JSON.parse(oldText).world === 'e3450c3d', 'the day goes on, people come and go through the new doors, and the old save text is untouched');
    /* Found in review: the old way from the attic stair to the park ran over grass that is now a row of house fronts. */
    const grassText = require('node:fs').readFileSync(path.resolve(__dirname, 'fixtures', 'save-town-e3450c3d-on-the-grass.json'), 'utf8');
    const onGrass = JSON.parse(grassText).state.characters.resident_e;
    ok(onGrass.location === 'street' && onGrass.pos.x === 12 && onGrass.pos.y === 8 && LT.World.isSolid(LT.World.LOCATIONS.street.rows[8].charAt(12)), 'a second real save: ' + onGrass.name + ' at 12,8 on the way to the park — a cell that is a house front now');
    const liftStep = Save.WORLD_MIGRATIONS.e3450c3d(JSON.parse(grassText)).state.characters.resident_e;
    ok(liftStep.pos.x === 12 && liftStep.pos.y === 7 && liftStep.walkTarget.x === 8 && liftStep.walkTarget.y === 8, 'she is on the pavement beside where she stood, still heading for the park gate');
    const lifted = Save.deserialize(JSON.parse(grassText));
    const le = lifted.state.characters.resident_e;
    await lifted.runMinutes(20);
    ok(le.location === 'park', 'and gets there');
    /* The near side got front gardens (e6451950 -> this town). A real save from the street of house fronts. */
    const gardenText = require('node:fs').readFileSync(path.resolve(__dirname, 'fixtures', 'save-town-e6451950-walking-to-a-south-home.json'), 'utf8');
    const before = JSON.parse(gardenText);
    const homing = Object.keys(before.state.characters).map((id) => before.state.characters[id]).find((c) => c.location === 'street' && c.transit);
    ok(before.world === 'e6451950' && homing && homing.transit.to === 'flat_b', 'a genuine save from the street of house fronts: ' + homing.name + ' on the way to a south-side home');
    const gStep = Save.WORLD_MIGRATIONS.e6451950(JSON.parse(gardenText)).state.characters[homing.id];
    ok(gStep.pos.x === homing.pos.x && gStep.pos.y === homing.pos.y && gStep.walkTarget.x === homing.walkTarget.x && gStep.walkTarget.y === homing.walkTarget.y, 'nobody is moved and nobody is re-aimed: the gates are where the doorways were');
    const gardened = Save.deserialize(JSON.parse(gardenText));
    const hg = gardened.state.characters[homing.id];
    await gardened.runMinutes(30);
    ok(hg.location === 'flat_b' && !hg.transit, 'and she gets home through the gate');
    const inWall = JSON.parse(gardenText); inWall.state.characters[homing.id].pos = { x: 0, y: 8, dir: 'down' };
    let refused = null; try { Save.deserialize(inWall); } catch (e) { refused = e.message; }
    ok(refused && /not open ground/.test(refused) && refused.indexOf(homing.id) >= 0, 'a save with someone inside the garden wall is refused by name, not repaired by guess');
    /* The café's tables became seats (e41937ba -> this town). A real save: someone six minutes into a meal, standing at the counter. */
    const mealText = require('node:fs').readFileSync(path.resolve(__dirname, 'fixtures', 'save-town-e41937ba-eating-at-the-counter.json'), 'utf8');
    const mealOld = JSON.parse(mealText), eater = mealOld.state.characters.resident_e;
    ok(mealOld.world === 'e41937ba' && eater.activity.actionId === 'buy_meal' && eater.pos.x === 4 && eater.pos.y === 4 && !mealOld.state.objects.some((o) => o.id === 'obj_cafe_booth_wall'),
       'a genuine save from before the seats: ' + eater.name + ' eating on her feet at the counter, and no booths on record');
    const seated = Save.deserialize(JSON.parse(mealText));
    const town2 = (sim) => JSON.stringify(sim.state.objects.filter((o) => !o.typeId).map((o) => [o.id, o.location, o.x, o.y, o.anchors || null, o.moreAnchors || null, o.affordances]).sort());
    ok(town2(seated) === town2(LT.Scenario.town({})), 'migrated, the town\'s furniture is exactly this build\'s');
    const se = seated.state.characters.resident_e, hungerBefore = se.needs.hunger;
    await seated.runMinutes(6);
    ok(se.activity && se.activity.seat && se.activity.seat.state === 'seated' && (se.pos.x !== 4 || se.pos.y !== 4), 'she goes and sits down with it');
    await seated.runMinutes(20);
    ok(!se.activity || se.activity.actionId !== 'buy_meal', 'and finishes the meal she had begun');
    ok(se.needs.hunger < hungerBefore, 'fed by it, once');
    /* Outside became one map (d7dfa67e -> this town). Two real saves from the two-room outside. */
    const walkText = require('node:fs').readFileSync(path.resolve(__dirname, 'fixtures', 'save-town-d7dfa67e-walking-to-the-park.json'), 'utf8');
    const walkOld = JSON.parse(walkText), goer = walkOld.state.characters.resident_a, sitter = walkOld.state.characters.resident_b;
    ok(walkOld.world === 'd7dfa67e' && goer.location === 'street' && goer.transit.to === 'park' && goer.activity.elapsed === 3 && goer.activity.plannedMinutes === 8 &&
       sitter.location === 'park' && sitter.activity.actionId === 'sit_and_rest',
       'a genuine save from the two-room outside: ' + goer.name + ' three minutes into an eight-minute walk to the park, ' + sitter.name + ' on the bench');
    const walked = Save.deserialize(JSON.parse(walkText));
    const wg = walked.state.characters.resident_a, ws = walked.state.characters.resident_b, bench = walked.objectById('obj_bench');
    const open = (c) => !LT.World.isSolid(LT.World.LOCATIONS[c.location].rows[c.pos.y].charAt(c.pos.x));
    ok(wg.transit && LT.World.outdoorGrid(wg.location) && open(wg) && wg.walkTarget.x === LT.World.STREET_PORTALS.park.x && wg.walkTarget.y === LT.World.STREET_PORTALS.park.y,
       'she is on the new way from the café to the park (' + wg.pos.x + ',' + wg.pos.y + '), still heading there');
    ok(bench.x === 12 && bench.y === 17 && ws.location === 'park' && ws.pos.x === 11 && ws.pos.y === 17, 'the bench is the kit\'s west bench, and whoever sat on it sits on it, from its west end');
    await walked.runUntil(1, 1030);
    ok(walked.state.events.some((e) => e.type === 'ARRIVED' && e.actorId === 'resident_a' && e.absMinute === goer.activity.endAbs), 'she arrives when her walk said she would, 17:10');
    await walked.runUntil(1, 1080);
    ok(walked.state.conversations.some((c) => c.status === 'completed' && c.participants.indexOf('resident_a') >= 0 && c.participants.indexOf('resident_b') >= 0), 'and the two meet and talk, as they did in the old town');
    const readText = require('node:fs').readFileSync(path.resolve(__dirname, 'fixtures', 'save-town-d7dfa67e-reading-in-the-park.json'), 'utf8');
    const readOld = JSON.parse(readText), reader = readOld.state.characters.resident_d;
    ok(readOld.world === 'd7dfa67e' && reader.activity.actionId === 'read_book' && reader.activity.phase === 'approaching' && reader.walkTarget.x === 12 && reader.walkTarget.y === 7,
       'a second: ' + reader.name + ' crossing the old park to the book on the south-east bench');
    const read = Save.deserialize(JSON.parse(readText));
    const rd = read.state.characters.resident_d, book = read.objectById('book_park');
    ok(book.x === 32 && book.y === 17 && book.anchors.read_book.x === 30 && book.anchors.read_book.y === 17 && rd.walkTarget.x === 30 && rd.walkTarget.y === 17 && open(rd),
       'the book is on the east bench, read from in front of it, and she is heading there from open ground');
    await read.runMinutes(20);
    ok(rd.activity && rd.activity.actionId === 'read_book' && rd.activity.phase === 'executing' && rd.pos.x === 30 && rd.pos.y === 17, 'and she gets there and reads');
    ok(JSON.parse(walkText).world === 'd7dfa67e' && JSON.parse(readText).world === 'd7dfa67e', 'the old save texts are untouched');
    const again = Save.deserialize(JSON.parse(JSON.stringify(Save.serialize(moved))));
    ok(again.state.day === 2 && JSON.parse(JSON.stringify(Save.serialize(moved))).world === LT.World.fingerprint(), 'saved again, it is a save of this town');
  }
}

async function main() {
  await roundTripMidDay();
  await resumeIsIdentical();
  await namesAndLooksSurvive();
  await idsNotNames();
  await versionMonotonicity();
  await pendingDecisionIsDropped();
  await droppedInboxIsSafe();
  rejectionChecks();
  migrationHook();
  await conversationSurvives();
  acceptedShiftKeepsWindow();
  await noStaticContent();
  await fullDaySerialises();
  await anyMomentIsSafe();
  await nothingHappensTwice();
  refusalsAreExplicit();
  worldMigrationIsVerified();
  localStorageNeverResetsSilently();
  await replaySurvivesReload();
  await asynchronousAnswersAcrossReload();
  await previousFormatIsMigrated();
  console.log('\nsave-load: ' + checks + '/' + checks);
}

main().catch((e) => { console.error(e); process.exit(1); });
