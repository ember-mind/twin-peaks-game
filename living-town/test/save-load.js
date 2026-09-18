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
  console.log('# 6: a pending decision is never saved');
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
  ok(restored.state.characters.resident_a.pending === null, 'the restored character starts with no pending decision');
  const startedBefore = starts(restored, 'resident_a').length;

  await restored.runMinutes(6);
  const seqs = Object.keys(restored.requests).map((k) => restored.requests[k].request.seq);
  ok(seqs.length > 0 && Math.min.apply(null, seqs) > savedSeq,
     'the re-issued request has a higher sequence than the one that was dropped');
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

  const started = sim.startActivity(a, { actionId: 'talk_with', targetKind: 'person', targetId: 'resident_b' }, 'test', null);
  ok(started.ok && a.activity.conversationId === b.activity.conversationId, 'the conversation is one shared activity across both people');
  for (let i = 0; i < 10; i++) sim.tick();

  const restored = quiet(Save.fromJSON(Save.toJSON(sim)));
  await restored.runMinutes(20);

  ok(count(restored, 'TALKED') === 1, 'exactly one TALKED event after the restore');
  const conv = restored.state.conversations[0];
  ok(conv && conv.status === 'completed', 'the conversation record ends completed');
  const ra = restored.state.characters.resident_a.relationships.resident_b;
  const rb = restored.state.characters.resident_b.relationships.resident_a;
  ok(ra.trust === relA.trust + 3 && ra.closeness === relA.closeness + 4 &&
     rb.trust === relB.trust + 3 && rb.closeness === relB.closeness + 4,
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
  console.log('\nsave-load: ' + checks + '/' + checks);
}

main().catch((e) => { console.error(e); process.exit(1); });
