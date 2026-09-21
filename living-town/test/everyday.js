/* everyday.js — Living Town: a book and a food parcel, in the real world.
 * The content package's own tests exercise its definitions. These exercise the
 * package where it now lives: offered by perception, chosen by a policy,
 * walked to, used, saved and reloaded — and, under UtilityPolicy, competing
 * with hunger, sleep, work and promises with no test telling anyone what to do.
 * node living-town/test/everyday.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
require(path.resolve(__dirname, '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'js', 'policy', 'lt-mock-policy.js'));
require(path.resolve(__dirname, '..', 'js', 'lt-save.js'));
const LT = global.LT, W = LT.World, Save = LT.Save, S = LT.Scenario;

let checks = 0, n = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }
const events = (sim, type, actorId) => sim.state.events.filter((e) => e.type === type && (!actorId || e.actorId === actorId));
function quiet(sim) { sim.requestDecision = function () { return null; }; return sim; }
function tickN(sim, k) { for (let i = 0; i < k; i++) sim.tick(); }
const BOOK = S.EVERYDAY[0], PARCEL = S.EVERYDAY[1];
const READ = { actionId: 'read_book', targetKind: 'object', targetId: BOOK.params.instanceId };
const OPEN = { actionId: 'unpack_food_parcel', targetKind: 'object', targetId: PARCEL.params.instanceId };
function facts(sim) {
  const s = JSON.parse(JSON.stringify(sim.state)); delete s.version;
  return JSON.stringify(s).replace(/"requestId":"req_(\d+)\.\d+"/g, '"requestId":"req_$1"');
}
function chooser(prefs) {
  const id = 'everyday_chooser_' + (++n);
  const api = { id, asked: [], decide(request) {
    api.asked.push(request.candidates.map((c) => c.id));
    for (const p of prefs) { const c = request.candidates.find((x) => x.actionId === p); if (c) return Promise.resolve(LT.Policy.selected(request, c.id, id)); }
    return Promise.resolve(LT.Policy.selected(request, 'wait', id));
  } };
  LT.Policy.register(api);
  return api;
}
/* A quiet world with both things already in it. */
function worldWithThings() {
  const sim = quiet(LT.Scenario.day1({ intervention: false }));
  [BOOK, PARCEL].forEach((e) => assert(sim.scheduleIntervention({ type: e.type, params: e.params }).ok));
  sim.applyDueInterventions();
  return sim;
}

function registrationIsGuarded() {
  console.log('# registration: one public entry point, checked, and nothing replaced');
  const A = LT.Actions;
  ok(A.get('read_book') === LT.EverydayV01.ACTIONS.read_book && A.get('unpack_food_parcel') === LT.EverydayV01.ACTIONS.unpack_food_parcel,
     'loading the scenario loads the package, and the package registered both actions through LT.Actions.define');
  const good = { id: 'zz_test_action', label: 'Test', targetKind: null, position: 'anywhere', interruptible: true, duration: () => 1, eligible: () => true };
  assert.throws(() => A.define(Object.assign({}, good, { id: 'wait' })), /already in the catalogue/);
  assert.throws(() => A.define(Object.assign({}, good, { id: 'read_book' })), /already in the catalogue/);
  ok(A.get('wait').label === 'Wait', 'an id already taken — core or content — is refused, not overwritten');
  const bad = [[{ position: undefined }, /position/], [{ duration: 5 }, /duration/], [{ id: 'Bad Id' }, /id must be/], [{ targetKind: 'planet' }, /targetKind/],
               [{ exclusive: true }, /exclusive needs/], [{ tick: 'no' }, /tick must be a function/], [{ interruptible: undefined }, /interruptible/]];
  bad.forEach(([over, pattern]) => assert.throws(() => A.define(Object.assign({}, good, over)), pattern));
  ok(!A.get('zz_test_action') && !A.get('Bad Id'), bad.length + ' malformed definitions refused with the reason; none entered the catalogue');
  ok(LT.Content.version('everyday-opportunities') === 'v01' && LT.Content.packageOf('book_used') === 'everyday-opportunities', 'the package declared its version and object types');
}

/* ---------------- A: the controlled mechanical proof ---------------- */

async function proofA() {
  console.log('# A (controlled, MockPolicy-style chooser): delivered -> perceived -> chosen -> walked to -> used -> consequences -> saved and resumed');
  const reader = chooser(['read_book']), opener = chooser(['unpack_food_parcel']);
  const sim = LT.Scenario.day1({ intervention: false, policies: { resident_a: opener.id, resident_b: reader.id } });
  const a = sim.state.characters.resident_a, b = sim.state.characters.resident_b;
  sim.state.minute = 700;
  sim.placeCharacter(b, 'park'); sim.placeCharacter(a, 'cafe');
  a.needs.hunger = 5; b.needs.hunger = 5;
  [BOOK, PARCEL].forEach((e) => assert(sim.scheduleIntervention({ type: e.type, params: e.params, atDay: 1, atMinute: 705 }).ok));
  await sim.runUntil(1, 704);
  ok(!sim.objectById('book_park') && !reader.asked.some((c) => c.some((id) => id.indexOf('read_book') === 0)), 'before delivery there is no book and nobody is offered one');
  await sim.runUntil(1, 712);
  const book = sim.objectById('book_park'), parcel = sim.objectById('parcel_door');
  ok(book && parcel && events(sim, 'BOOK_PLACED').length === 1 && events(sim, 'FOOD_PARCEL_DELIVERED').length === 1, 'both are delivered, once each');
  ok(b.memories.some((m) => m.type === 'BOOK_PLACED') && !a.memories.some((m) => m.type === 'FOOD_PARCEL_DELIVERED' || m.type === 'BOOK_PLACED'),
     'the person in the park saw the book arrive; the addressee, at work across town, knows nothing of her parcel');
  ok(!opener.asked.some((c) => c.some((id) => id.indexOf('unpack_food_parcel') === 0)), 'and is not offered it while she is somewhere else');

  const chosen = events(sim, 'ACTIVITY_STARTED', 'resident_b').find((e) => e.data.actionId === 'read_book');
  ok(chosen && chosen.data.phase === 'approaching' && chosen.data.source === reader.id && book.inUseBy === 'resident_b', 'reading is chosen by their policy; the copy is reserved from that moment; they set off');
  await sim.runUntil(1, chosen.minute + 3);
  ok((book.readBy.resident_b || 0) === 0 && b.activity.phase === 'approaching', 'three minutes into the walk, nothing has been read');

  /* saved on the way to the book */
  let restored = Save.fromJSON(Save.toJSON(sim));
  ok(restored.objectById('book_park').inUseBy === 'resident_b' && restored.state.characters.resident_b.activity.phase === 'approaching', 'saved and reloaded on the way there: still approaching, the copy still theirs');

  await sim.runUntil(1, 760);
  const reached = events(sim, 'ACTIVITY_REACHED', 'resident_b')[0];
  ok(reached && book.readBy.resident_b === sim.absMinute() - reached.absMinute && b.pos.x === BOOK.params.useSpot.x && b.pos.y === BOOK.params.useSpot.y,
     'reading began on reaching the use spot and has advanced one minute per minute since (' + book.readBy.resident_b + ')');

  /* saved in the middle of reading; both worlds then run on */
  restored = Save.fromJSON(Save.toJSON(sim));
  await sim.runUntil(1, 1000); await restored.runUntil(1, 1000);
  ok(facts(sim) === facts(restored), 'saved and reloaded mid-sitting: the two worlds are identical three hours later');
  ok(book.readBy.resident_b === 120 && events(sim, 'BOOK_READ').length === 1 && book.inUseBy === null && book.completedBy.resident_b,
     'the book is finished in sittings of at most ' + LT.EverydayV01.SITTING_MINUTES + ' minutes: 120 read, one BOOK_READ, the copy free again');
  const sittings = events(sim, 'ACTIVITY_COMPLETED', 'resident_b').filter((e) => e.data.actionId === 'read_book').map((e) => e.data.minutes);
  ok(JSON.stringify(sittings) === '[45,45,30]', 'sittings: ' + sittings.join(' + '));
  ok(!reader.asked.slice(-1)[0].some((id) => id.indexOf('read_book') === 0), 'a finished book is no longer offered to the person who finished it');

  /* the parcel: home, perceive, choose, walk, open */
  sim.state.minute = 1005; sim.placeCharacter(a, 'flat_a');
  const pantry = a.pantry, hunger0 = a.needs.hunger;
  await sim.runMinutes(3);
  ok(opener.asked.slice(-1)[0].some((id) => id === 'unpack_food_parcel:parcel_door') || events(sim, 'ACTIVITY_STARTED', 'resident_a').some((e) => e.data.actionId === 'unpack_food_parcel'),
     'at home, the parcel is simply one of the things in the room, and opening it is on offer');
  let mid = null;
  for (let i = 0; i < 30 && parcel.status === 'sealed'; i++) {
    await sim.runMinutes(1);
    if (!mid && a.activity && a.activity.actionId === 'unpack_food_parcel' && a.activity.phase === 'executing' && a.activity.elapsed >= 2) mid = Save.toJSON(sim);
  }
  const opened = events(sim, 'FOOD_PARCEL_OPENED');
  ok(opened.length === 1 && a.pantry === pantry + 4 && parcel.status === 'empty' && parcel.contentsLeft === 0 && parcel.openedBy === 'resident_a',
     'opened once at its use spot: four portions into the pantry (' + pantry + ' -> ' + a.pantry + '), the parcel empty');
  ok(Math.abs(a.needs.hunger - hunger0) < 3 && events(sim, 'ATE').filter((e) => e.absMinute >= 1005 + 0).length === 0, 'opening it fed nobody: hunger moved only by the clock; eating is still eat_at_home\'s job');
  ok(mid, 'a save was taken two minutes into opening it');
  restored = Save.fromJSON(mid);
  await restored.runMinutes(10);
  const rp = restored.objectById('parcel_door'), ra = restored.state.characters.resident_a;
  ok(events(restored, 'FOOD_PARCEL_OPENED').length === 1 && ra.pantry === pantry + 4 && rp.contentsLeft === 0, 'reloaded mid-opening: it finishes once, the portions arrive once');
  await sim.runMinutes(30);
  ok(a.pantry <= pantry + 4 && events(sim, 'FOOD_PARCEL_OPENED').length === 1, 'and an empty parcel is never opened again');
}

/* ---------------- availability ---------------- */

async function oneCopyOneReader() {
  console.log('# the copy: reserved when chosen, released however the reading ends');
  const p1 = chooser(['read_book']), p2 = chooser(['read_book']);
  const sim = LT.Scenario.day1({ intervention: false, policies: { resident_a: p1.id, resident_b: p2.id } });
  sim.state.minute = 700;
  sim.placeCharacter(sim.state.characters.resident_a, 'park', { x: 2, y: 8, dir: 'up' });
  sim.placeCharacter(sim.state.characters.resident_b, 'park', { x: 14, y: 1, dir: 'down' });
  assert(sim.scheduleIntervention({ type: BOOK.type, params: BOOK.params }).ok); sim.applyDueInterventions();
  await sim.runMinutes(4);
  const book = sim.objectById('book_park');
  const readers = sim.actorIds().filter((id) => { const act = sim.state.characters[id].activity; return act && act.actionId === 'read_book'; });
  ok(readers.length === 1 && book.inUseBy === readers[0], 'both policies chose the book in the same minute: one person has it (' + readers[0] + '), one copy, one claim');
  const loser = sim.actorIds().find((id) => id !== readers[0]);
  ok(sim.rejections.some((r) => r.actorId === loser && r.reason === 'candidate_no_longer_legal') &&
     LT.Perception.candidates(sim, sim.state.characters[loser]).rejected.some((r) => r.id === 'read_book:book_park' && r.reason === 'in_use'),
     'the other\'s answer is refused as no longer legal, and the book is withheld from them as in_use — they did not cross the park for nothing');

  const q = worldWithThings();
  const a = q.state.characters.resident_a, qb = q.objectById('book_park');
  q.placeCharacter(a, 'park');
  const ends = [];
  assert(q.startActivity(a, READ, 'test', null).ok); tickN(q, 2);
  q.requestInterrupt('resident_a', 'called_away'); ends.push(['interrupted while approaching', qb.inUseBy]);
  assert(q.startActivity(a, READ, 'test', null).ok); tickN(q, 20);
  const readSoFar = qb.readBy.resident_a;
  q.requestInterrupt('resident_a', 'called_away'); ends.push(['interrupted while reading', qb.inUseBy]);
  assert(q.startActivity(a, READ, 'test', null).ok);
  q.failActivity(a, 'use_spot_unreachable'); ends.push(['route failed', qb.inUseBy]);
  a.recentFailures = {};
  assert(q.startActivity(a, READ, 'test', null).ok); tickN(q, 60); ends.push(['sitting completed', qb.inUseBy]);
  ok(ends.every((e) => e[1] === null), 'released after: ' + ends.map((e) => e[0]).join(', '));
  ok(readSoFar > 0 && qb.readBy.resident_a >= readSoFar + 45, 'the minutes read before the interruption (' + readSoFar + ') were kept and built on (' + qb.readBy.resident_a + ')');
  const holders = q.state.objects.filter((o) => o.inUseBy);
  ok(holders.length === 0, 'no claim outlives the activity that made it');

  const b = q.state.characters.resident_b;
  q.placeCharacter(b, 'park'); b.recentFailures = {};
  assert(q.startActivity(b, READ, 'test', null).ok); tickN(q, 30);
  ok(qb.readBy.resident_b > 0 && qb.readBy.resident_a !== qb.readBy.resident_b && !qb.completedBy.resident_b, 'two people\'s progress in the same copy is kept apart');
}

/* ---------------- the parcel ---------------- */

function parcelRules() {
  console.log('# the parcel: for one person, opened where it lies, perceived like anything else');
  const sim = worldWithThings();
  const a = sim.state.characters.resident_a, b = sim.state.characters.resident_b;
  sim.placeCharacter(b, 'flat_a'); sim.placeCharacter(a, 'flat_a');
  const forB = LT.Perception.candidates(sim, b);
  ok(forB.rejected.some((r) => r.id === 'unpack_food_parcel:parcel_door' && r.reason === 'not_recipient') && !sim.startActivity(b, OPEN, 'test', null).ok,
     'a visitor standing in the flat sees the parcel and cannot open it (not_recipient)');
  ok(LT.Perception.observe(sim, b).objects.some((o) => o.id === 'parcel_door'), 'it is an ordinary object in what anyone in the room observes');
  const started = sim.startActivity(a, OPEN, 'test', null);
  ok(started.ok && a.activity.phase === 'approaching', 'the addressee has to walk over to it');
  const pantry = a.pantry;
  tickN(sim, 1);
  ok(a.pantry === pantry && sim.objectById('parcel_door').status === 'sealed', 'nothing is transferred on the way');
  const again = worldWithThings();
  ok(!again.scheduleIntervention({ type: PARCEL.type, params: PARCEL.params }).ok, 'the same parcel cannot be delivered twice (instance id in use)');
}

/* ---------------- saves ---------------- */

async function interventionScheduledAfterLoad() {
  console.log('# saves: an intervention scheduled after a load, and one still waiting at save time');
  const first = LT.Scenario.day1({});                        // extra shift + book + parcel, all still scheduled
  await first.runUntil(1, 500);
  ok(first.state.interventions.filter((r) => r.status === 'scheduled').length === 3, 'saved at 08:20 with three interventions still waiting');
  const sim = Save.fromJSON(Save.toJSON(first));
  const late = { type: 'place_shared_book', atDay: 1, atMinute: 520,
                 params: { instanceId: 'book_late', title: 'Salt', locationId: 'park', x: 3, y: 6, useSpot: { x: 3, y: 7, dir: 'up' }, requiredReadMinutes: 30 } };
  const r = sim.scheduleIntervention(late);
  ok(r.ok && sim.state.interventions.length === 4 && sim.scheduledInterventions === sim.state.interventions &&
     new Set(sim.state.interventions.map((x) => x.id)).size === 4, 'scheduled after the load: one new entry, in the one list, under an id of its own (' + r.record.id + ')');
  await sim.runUntil(1, 800);
  ok(sim.state.objects.filter((o) => o.id === 'book_late').length === 1 && events(sim, 'BOOK_PLACED').length === 2 &&
     events(sim, 'INTERVENTION_APPLIED').filter((e) => e.data.interventionId === r.record.id).length === 1, 'applied once: one object, one event');
  ok(sim.state.objects.filter((o) => o.id === 'book_park').length === 1 && sim.state.objects.filter((o) => o.id === 'parcel_door').length === 1 &&
     sim.state.interventions.filter((x) => x.status === 'applied').length === 3, 'and the two that were waiting in the save were each applied once as well');
  const again = Save.fromJSON(Save.toJSON(sim));
  await again.runUntil(1, 900);
  ok(again.state.objects.filter((o) => o.typeId).length === 3 && events(again, 'BOOK_PLACED').length === 2, 'another reload later, nothing is applied a second time');
}

function savedThingsAreChecked() {
  console.log('# saves: instances are checked by type; their state never makes a save incompatible');
  const sim = worldWithThings();
  const a = sim.state.characters.resident_a;
  sim.placeCharacter(a, 'park'); assert(sim.startActivity(a, READ, 'test', null).ok); tickN(sim, 40);
  sim.placeCharacter(a, 'flat_a'); a.activity = null; sim.objectById('book_park').inUseBy = null;
  assert(sim.startActivity(a, OPEN, 'test', null).ok); tickN(sim, 20);
  const fresh = worldWithThings();
  const used = Save.serialize(sim), untouched = Save.serialize(fresh);
  ok(used.world === untouched.world && JSON.stringify(used.content) === '{"everyday-opportunities":"v01"}',
     'a world with a half-read book and an opened parcel has the same town fingerprint and the same content version as one where neither was touched');
  ok(Save.deserialize(used).objectById('parcel_door').status === 'empty', 'and loads');
  ok(Save.serialize(quiet(LT.Scenario.day1({ intervention: false }))).content['everyday-opportunities'] === undefined, 'a world that uses nothing from the package does not depend on it');

  const copy = () => JSON.parse(JSON.stringify(used));
  const book = (s) => s.state.objects.find((o) => o.id === 'book_park'), parcel = (s) => s.state.objects.find((o) => o.id === 'parcel_door');
  const cases = [
    ['progress for someone who does not exist', (s) => { book(s).readBy.nobody = 5; }, /reading progress for nobody/],
    ['more minutes read than the book has', (s) => { book(s).readBy.resident_a = 9999; }, /outside 0\.\.120/],
    ['a non-finite amount read', (s) => { book(s).readBy.resident_a = null; }, /outside 0\.\.120/],
    ['finished without having been read', (s) => { book(s).completedBy.resident_b = 'D1 10:00'; }, /marked finished by resident_b after only 0/],
    ['held by someone who is not reading it', (s) => { book(s).inUseBy = 'resident_b'; }, /held by resident_b, who is not reading it/],
    ['an impossible length', (s) => { book(s).requiredReadMinutes = 1e9; }, /impossible amount of reading/],
    ['a use spot inside furniture', (s) => { book(s).anchors.read_book = { x: 12, y: 6, dir: 'up' }; }, /no walkable use spot/],
    ['a parcel for nobody', (s) => { parcel(s).toId = 'ghost'; }, /addressed to ghost/],
    ['empty yet still holding food', (s) => { parcel(s).contentsLeft = 2; }, /empty but still holds 2/],
    ['more left than it came with', (s) => { parcel(s).status = 'sealed'; parcel(s).openedBy = null; parcel(s).contentsLeft = 99; }, /99 portions left of 4/],
    ['a negative quantity', (s) => { parcel(s).portions = -1; }, /impossible number of portions/],
    ['an unknown state', (s) => { parcel(s).status = 'exploded'; }, /unknown state "exploded"/],
    ['a type no package provides', (s) => { parcel(s).typeId = 'grand_piano'; }, /no loaded content package provides/],
    ['a thing that is neither town nor content', (s) => { s.state.objects.push({ id: 'obj_mystery', location: 'park', x: 1, y: 1 }); }, /neither part of this town nor of any content package/],
    ['another version of the package', (s) => { s.content['everyday-opportunities'] = 'v00'; }, /saved with "everyday-opportunities" v00 and this build has v01/],
    ['a package this build does not have', (s) => { s.content['weather'] = 'v03'; }, /content package "weather" \(v03\), which this build does not have/]
  ];
  cases.forEach(([label, damage, pattern]) => { const s = copy(); damage(s); assert.throws(() => Save.deserialize(s), pattern, label); });
  ok(true, cases.length + ' impossible instances refused by name: ' + cases.map((c) => c[0]).join('; '));
  const reading = worldWithThings(), ra = reading.state.characters.resident_a;
  reading.placeCharacter(ra, 'park'); assert(reading.startActivity(ra, READ, 'test', null).ok);
  const held = Save.serialize(reading);
  ok(Save.deserialize(held).objectById('book_park').inUseBy === 'resident_a', 'a claim with the activity that made it is sound, and loads');
  held.state.characters.resident_a.activity = null;
  assert.throws(() => Save.deserialize(held), /held by resident_a, who is not reading it/);
  ok(true, 'the same claim without its activity is refused: no permanent inUseBy');
}

/* ---------------- drawing ---------------- */

function drawnFromRuntimeState() {
  console.log('# drawing: what is drawn is what the instance is, and drawing changes nothing');
  const sim = worldWithThings();
  const C = LT.Content, book = sim.objectById('book_park'), parcel = sim.objectById('parcel_door'), a = sim.state.characters.resident_a;
  ok(C.visualOf(book, sim).state === 'closed' && C.visualOf(parcel, sim).state === 'sealed', 'untouched: a closed book, a sealed parcel');
  sim.placeCharacter(a, 'park'); sim.startActivity(a, READ, 'test', null);
  ok(C.visualOf(book, sim).state === 'closed', 'still closed while its reader is walking over');
  tickN(sim, 12);
  ok(a.activity.phase === 'executing' && C.visualOf(book, sim).state === 'open', 'open while it is being read');
  sim.requestInterrupt('resident_a', 'x');
  ok(C.visualOf(book, sim).state === 'closed', 'closed again when they stop');
  sim.placeCharacter(a, 'flat_a'); sim.startActivity(a, OPEN, 'test', null);
  for (let i = 0; i < 20 && a.activity.phase !== 'executing'; i++) sim.tick();
  sim.tick();
  ok(a.activity && a.activity.phase === 'executing' && C.visualOf(parcel, sim).state === 'open', 'the parcel is open while it is being unpacked');
  const before = JSON.stringify(sim.state);
  for (let i = 0; i < 50; i++) { C.visualOf(book, sim); C.visualOf(parcel, sim); }
  ok(JSON.stringify(sim.state) === before, 'asking what they look like writes nothing');
  tickN(sim, 6);
  ok(C.visualOf(parcel, sim).state === 'empty' && parcel.contentsLeft === 0, 'and empty once the simulation\'s parcel is empty — the same instance, not a picture of one');
  const viewSrc = require('node:fs').readFileSync(path.resolve(__dirname, '..', 'js', 'lt-view.js'), 'utf8');
  ok(!/pantry|contentsLeft|readBy|inUseBy/.test(viewSrc), 'the view reads a type and a state; it never touches portions, progress or claims');
}

/* ---------------- B: nobody told anybody anything ---------------- */

async function proofB() {
  console.log('# B (autonomous, UtilityPolicy for both, the default day): what they actually chose');
  const sim = LT.Scenario.day1({});
  await sim.runUntil(3, 480);
  const lines = sim.state.events.filter((e) => /^(BOOK_|FOOD_PARCEL_)/.test(e.type) || (e.type === 'ACTIVITY_REACHED' && /read_book|unpack/.test(e.data.actionId)))
    .map((e) => '      ' + e.stamp + '  ' + e.text);
  console.log(lines.join('\n'));
  const book = sim.objectById('book_park'), parcel = sim.objectById('parcel_door');
  const a = sim.state.characters.resident_a, b = sim.state.characters.resident_b;
  ok(sim.state.events.filter((e) => e.type === 'ACTIVITY_STARTED' && /read_book|unpack/.test(e.data.actionId)).every((e) => e.data.source === 'utility'),
     'every reading and opening in this run was a UtilityPolicy decision');
  console.log('      read: ' + JSON.stringify(book.readBy) + '  finished: ' + JSON.stringify(Object.keys(book.completedBy)) + '  parcel: ' + parcel.status + (parcel.openedStamp ? ' at ' + parcel.openedStamp : ''));
  /* Observations of this seed's day, pinned so a change in them is noticed —
   * not requirements on what anyone should choose. */
  /* A meal someone agreed to that day is a promise of another kind, made and judged by the shared-meal package
   * (test/meal-in-town.js); what is pinned here is that the book and the parcel cost nobody a promise they began the day with. */
  ok(a.commitments.concat(b.commitments).filter((c) => c.dueDay === 1 && !/^cmt_meal_/.test(c.id)).every((c) => c.status === 'kept'), 'nobody broke a day-one promise over a book or a parcel');
  const day1Work = events(sim, 'WORKED', 'resident_a').filter((e) => e.day === 1).reduce((m, e) => m + e.data.minutes, 0);
  ok(day1Work === 464 && (book.readBy.resident_a || 0) === 0, 'the one with a shift and a deadline worked the whole shift (' + day1Work + ' min) and never opened the book');
  const parcelAt = events(sim, 'FOOD_PARCEL_OPENED')[0];
  const home = sim.state.events.find((e) => e.type === 'ARRIVED' && e.actorId === 'resident_a' && e.data.at === 'flat_a' && e.absMinute > 750);
  ok(home && (!parcelAt || parcelAt.absMinute - home.absMinute > 60), 'the parcel was not opened on sight: home at ' + home.stamp + ', opened ' + (parcelAt ? parcelAt.stamp : 'not at all in two days'));
  ok(events(sim, 'BOOK_READ').length <= 2 && events(sim, 'FOOD_PARCEL_OPENED').length <= 1 && sim.state.objects.filter((o) => o.inUseBy).length === 0, 'at most one completion each, one opening, and no claim left hanging');
}

(async function main() {
  registrationIsGuarded();
  await proofA();
  await oneCopyOneReader();
  parcelRules();
  await interventionScheduledAfterLoad();
  savedThingsAreChecked();
  drawnFromRuntimeState();
  await proofB();
  console.log('\neveryday: ' + checks + '/' + checks);
})().catch((e) => { console.error(e); process.exit(1); });
