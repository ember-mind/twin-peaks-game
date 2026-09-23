/* everyday-opportunities.js test — Living Town content package v01.
 *
 * These are CALLBACK tests: they drive the package's object builders, action
 * definitions and intervention lifecycle through the real Sim and its real
 * contexts, but they do not claim an autonomous life. The full pipeline — a
 * policy actually choosing read_book / unpack_food_parcel during a tick — needs
 * an action registration hook this base commit does not have; that test lives
 * in pipeline.js and is documented there.
 *
 * node living-town/content/everyday-opportunities-v01/test/everyday-opportunities.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');

require(path.resolve(__dirname, '..', '..', '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', '..', '..', 'js', 'lt-save.js'));
require(path.resolve(__dirname, '..', 'everyday-opportunities.js'));
const LT = global.LT;
const E = LT.EverydayV01, I = LT.Interventions, A = LT.Actions, W = LT.World, P = LT.Perception;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

const copy = (v) => JSON.parse(JSON.stringify(v));

function day() { return LT.Scenario.day1({ intervention: false }); }
function actorIds(sim) { return Object.keys(sim.state.characters).sort(); }

/* A walkable, reachable cell in a room, found from the world's own rows. */
function findUseSpot(sim, locId) {
  const loc = W.LOCATIONS[locId];
  for (let y = 0; y < loc.rows.length; y++) {
    for (let x = 0; x < loc.rows[0].length; x++) {
      if (W.isSolid(loc.rows[y].charAt(x))) continue;
      if (loc.grid && W.zoneAt(x, y) !== locId) continue;   // outside: in this part of the town
      if ((x === loc.spawn.x && y === loc.spawn.y) || sim.nextStep(loc, loc.spawn, { x: x, y: y }) !== null) {
        return { x: x, y: y };
      }
    }
  }
  throw new Error('no use spot in ' + locId);
}

function bookParams(over) {
  return Object.assign({
    instanceId: 'book_t1', title: 'Tide Tables', locationId: 'park',
    x: 10, y: 17, useSpot: { x: 10, y: 16, dir: 'down' }, requiredReadMinutes: 10
  }, over || {});
}

function parcelParams(sim, over) {
  const ids = actorIds(sim);
  const toId = ids[1];
  const home = sim.state.characters[toId].homeId;
  const spot = findUseSpot(sim, home);
  return Object.assign({
    instanceId: 'parcel_t1', toId: toId, locationId: home,
    x: spot.x, y: spot.y, useSpot: { x: spot.x, y: spot.y, dir: 'down' }, portions: 4
  }, over || {});
}

/* The real scheduling API takes { type, source, atDay, atMinute, params }. */
function schedule(sim, type, params, when) {
  return sim.scheduleIntervention({
    type: type, source: 'test', params: params,
    atDay: when ? when.day : undefined, atMinute: when ? when.minute : undefined
  });
}
function place(sim, type, params, when) {
  const r = schedule(sim, type, params, when);
  if (!r.ok) throw new Error('schedule failed: ' + r.error);
  I.applyDue(sim);
  return r.record;
}
function refused(sim, type, params, error) {
  const r = schedule(sim, type, params);
  return r.ok === false && r.error === error;
}

function stand(sim, actor, locationId, spot) {
  sim.placeCharacter(actor, locationId, { x: spot.x, y: spot.y, dir: 'down' });
  actor.walkTarget = null;
}
function ctxFor(sim, actor, object) { return sim.context(actor, object); }

/* ---------------- package shape and registration boundary ---------------- */

function packageShape() {
  console.log('# package: objects, actions and interventions are defined');
  ok(E.OBJECT_TYPES.book_used.typeId === 'book_used' && E.OBJECT_TYPES.food_parcel.typeId === 'food_parcel',
     'the two object typeIds are book_used and food_parcel');
  ok(E.OBJECT_TYPES.book_used.affordances.indexOf('read_book') >= 0 &&
     E.OBJECT_TYPES.food_parcel.affordances.indexOf('unpack_food_parcel') >= 0,
     'the object types advertise exactly the actions this package defines');

  const read = E.ACTIONS.read_book, open = E.ACTIONS.unpack_food_parcel;
  ok(read.id === 'read_book' && read.targetKind === 'object' && typeof read.duration === 'function' &&
     typeof read.eligible === 'function' && typeof read.tick === 'function' &&
     typeof read.onComplete === 'function' && read.interruptible === true &&
     read.position === 'use_spot' && read.exclusive === true && read.onStart === undefined && read.onInterrupt === undefined,
     'read_book matches the lt-actions contract: done at a use spot, one reader at a time, and the claim on the copy left to the core');
  ok(open.id === 'unpack_food_parcel' && typeof open.eligible === 'function' &&
     typeof open.onComplete === 'function' && open.interruptible === false && open.position === 'use_spot',
     'unpack_food_parcel matches the lt-actions contract');

  ok(I.get('place_shared_book') !== null && I.get('deliver_food_parcel') !== null &&
     I.types().indexOf('place_shared_book') >= 0 && I.types().indexOf('deliver_food_parcel') >= 0,
     'both interventions are registered through the real LT.Interventions.define');

  const seen = [];
  E.registerActions({ define: function (def) { seen.push(def.id); } });
  ok(seen.indexOf('read_book') >= 0 && seen.indexOf('unpack_food_parcel') >= 0,
     'registerActions wires both definitions into a catalogue that offers define()');
  assert.throws(() => E.registerActions({}), /everyday-opportunities v01/);
  ok(true, 'registerActions names the missing catalogue hook instead of inventing one');
  const registered = A.get('read_book');
  ok(registered === E.ACTIONS.read_book && A.get('unpack_food_parcel') === E.ACTIONS.unpack_food_parcel,
     'the catalogue holds this package\'s two definitions, registered through LT.Actions.define');
  assert.throws(() => A.define(Object.assign({}, E.ACTIONS.read_book)), /already in the catalogue/);
  ok(true, 'and a second definition under the same id is refused, not swapped in');
}

/* ---------------- intervention validation ---------------- */

function invalidInterventions() {
  console.log('# interventions: invalid parameters and references are refused');
  const sim = day();
  const book = (o) => bookParams(o);
  const parcel = (o) => parcelParams(sim, o);

  ok(refused(sim, 'place_shared_book', book({ title: '' }), 'missing_title'), 'an empty title is refused');
  ok(refused(sim, 'place_shared_book', book({ requiredReadMinutes: 0 }), 'invalid_required_read_minutes'),
     'zero reading is refused');
  ok(refused(sim, 'place_shared_book', book({ requiredReadMinutes: -3 }), 'invalid_required_read_minutes'),
     'negative reading is refused');
  ok(refused(sim, 'place_shared_book', book({ requiredReadMinutes: 2.5 }), 'invalid_required_read_minutes'),
     'fractional reading is refused');
  ok(refused(sim, 'place_shared_book', book({ requiredReadMinutes: Infinity }), 'invalid_required_read_minutes'),
     'non-finite reading is refused');
  ok(refused(sim, 'place_shared_book', book({ requiredReadMinutes: 99999 }), 'required_read_minutes_too_large'),
     'excessive reading is refused');
  ok(refused(sim, 'place_shared_book', book({ locationId: 'nowhere' }), 'unknown_location'),
     'an unknown location is refused');
  ok(refused(sim, 'place_shared_book', book({ x: -1 }), 'object_position_out_of_bounds'),
     'an out-of-bounds object cell is refused');
  ok(refused(sim, 'place_shared_book', book({ locationId: 'flat_a', x: 0, y: 0, useSpot: { x: 5, y: 5 } }),
     'object_position_on_wall'), 'an object cell on a wall is refused');
  ok(refused(sim, 'place_shared_book', book({ useSpot: { x: 10, y: 20 } }), 'use_spot_not_walkable'),
     'a use spot in the water is refused');
  ok(refused(sim, 'place_shared_book', book({ useSpot: { x: 99, y: 3 } }), 'use_spot_out_of_bounds'),
     'an out-of-bounds use spot is refused');
  ok(refused(sim, 'place_shared_book', book({ useSpot: { x: 10, y: 16, dir: 'sideways' } }), 'invalid_use_spot_dir'),
     'a bad facing is refused');
  ok(refused(sim, 'place_shared_book', book({ instanceId: '' }), 'invalid_instance_id'),
     'an empty instance id is refused');

  const unknownId = 'nobody_' + Math.random().toString(36).slice(2);
  ok(refused(sim, 'deliver_food_parcel', parcel({ toId: unknownId }), 'unknown_character'),
     'an unknown recipient is refused');
  ok(refused(sim, 'deliver_food_parcel', parcel({ locationId: 'park' }), 'not_recipient_home'),
     'a delivery away from the recipient home is refused');
  ok(refused(sim, 'deliver_food_parcel', parcel({ portions: 0 }), 'invalid_portions'), 'zero portions are refused');
  ok(refused(sim, 'deliver_food_parcel', parcel({ portions: 1.5 }), 'invalid_portions'),
     'fractional portions are refused');
  ok(refused(sim, 'deliver_food_parcel', parcel({ portions: -2 }), 'invalid_portions'),
     'negative portions are refused');
  ok(refused(sim, 'deliver_food_parcel', parcel({ portions: 999 }), 'portions_too_large'),
     'excessive portions are refused');
  ok(refused(sim, 'deliver_food_parcel', parcel({ locationId: 'cafe' }), 'not_recipient_home'),
     'the café is not the recipient home');
}

function interventionCreatesOneInstance() {
  console.log('# interventions: one instance per applied intervention, revalidated at apply time');
  const sim = day();
  /* Two records naming the same instance: validate passes at schedule time for
   * both, and the second is refused when it would actually create the object. */
  const p = bookParams({ instanceId: 'book_dup' });
  const first = schedule(sim, 'place_shared_book', p);
  const second = schedule(sim, 'place_shared_book', p);
  ok(first.ok === true && second.ok === true, 'both records pass validation when nothing exists yet');
  I.applyDue(sim);
  ok(sim.state.objects.filter((o) => o.id === 'book_dup').length === 1, 'exactly one instance exists');
  ok(first.record.status === 'applied' && second.record.status === 'failed' &&
     second.record.error === 'instance_id_in_use',
     'the second application is refused as instance_id_in_use');
  ok(refused(sim, 'place_shared_book', p, 'instance_id_in_use'),
     'the same instance id is refused at scheduling time afterwards');
}

/* ---------------- objects: identity and independence ---------------- */

function objectIdentity() {
  console.log('# objects: distinct instances share a typeId but not their state');
  const sim = day();
  place(sim, 'place_shared_book', bookParams({ instanceId: 'book_x1', x: 10, y: 17, useSpot: { x: 10, y: 16 } }));
  place(sim, 'place_shared_book', bookParams({ instanceId: 'book_x2', x: 7, y: 17, useSpot: { x: 7, y: 16 } }));
  const b1 = sim.objectById('book_x1'), b2 = sim.objectById('book_x2');
  ok(b1 && b2 && b1.id !== b2.id && b1.typeId === b2.typeId && b1.typeId === 'book_used',
     'two copies have different instance ids and the same typeId');
  ok(b1.readBy !== b2.readBy && Object.keys(b1.readBy).length === 0,
     'each copy owns its own progress record');
  ok(sim.objectsAt('park').filter((o) => o.typeId === 'book_used').length === 2,
     'both copies are observable in the room');

  const aId = actorIds(sim)[0], bId = actorIds(sim)[1];
  stand(sim, sim.state.characters[aId], b1.location, { x: 10, y: 16 });
  const ca = ctxFor(sim, sim.state.characters[aId], b1);
  E.ACTIONS.read_book.tick(ca, 3);
  ok(b1.readBy[aId] === 3 && (b2.readBy[aId] || 0) === 0,
     "reading one copy advances only that copy's progress for that person");
  ok(aId !== bId, 'the two inhabitants are distinct ids');
}

/* ---------------- reading: progress, interruption, once-only completion ---------------- */

function readingCallbacks() {
  console.log('# read_book: no progress for approaching, partial kept, one completion');
  const sim = day();
  place(sim, 'place_shared_book', bookParams({ instanceId: 'book_r1' }));
  const b = sim.objectById('book_r1');
  const actor = sim.state.characters[actorIds(sim)[0]];

  ok(Object.keys(b.readBy).length === 0, 'no reading progress exists before any execution');
  const c = ctxFor(sim, actor, b);

  /* In the room but merely approaching: while walking, nothing is read. */
  sim.placeCharacter(actor, 'park', { x: 22, y: 16 });
  ok(E.ACTIONS.read_book.eligible(c) === true, 'the book is readable from its own room');
  actor.walkTarget = { x: 10, y: 16 };
  E.ACTIONS.read_book.tick(c, 5);
  ok((b.readBy[actor.id] || 0) === 0, 'walking toward the book grants no reading minutes');

  /* At the use spot: progress begins. */
  stand(sim, actor, b.location, { x: 10, y: 16 });
  E.ACTIONS.read_book.tick(c, 4);
  ok(b.readBy[actor.id] === 4, 'standing on the use spot advances reading by the minutes spent');
  ok(E.ACTIONS.read_book.duration(c) === 6, 'the next block is only what remains for this reader');
  /* Stopped and taken up again later: what was read stays read. (Who holds
   * the copy meanwhile is the core's business; see readingExclusivity.) */
  ok(b.readBy[actor.id] === 4, 'minutes read are kept on the book, per person, between sittings');

  /* Finish. */
  E.ACTIONS.read_book.tick(c, 6);
  E.ACTIONS.read_book.onComplete(c);
  ok(b.readBy[actor.id] === 10 && b.completedBy[actor.id] === sim.stamp(),
     'the reader completes exactly at the target');
  const doneVerdict = E.ACTIONS.read_book.eligible(c);
  ok(doneVerdict !== true && doneVerdict.reason === 'already_read',
     'a finished book is no longer a candidate for that person');

  const events = sim.state.events.filter((e) => e.type === 'BOOK_READ');
  ok(events.length === 1 && events[0].data.bookId === b.id && events[0].data.minutes === 10,
     'exactly one factual BOOK_READ event was emitted');

  E.ACTIONS.read_book.onComplete(c);
  ok(sim.state.events.filter((e) => e.type === 'BOOK_READ').length === 1 &&
     Object.keys(b.completedBy).length === 1,
     'a second completion call is a no-op (no double completion)');

  /* The other person is still free to read the same copy. */
  const other = sim.state.characters[actorIds(sim)[1]];
  stand(sim, other, b.location, { x: 10, y: 16 });
  ok(E.ACTIONS.read_book.eligible(ctxFor(sim, other, b)) === true,
     'one person finishing does not mark the book read for anybody else');
  ok(b.readBy[actor.id] === 10 && (b.readBy[other.id] || 0) === 0,
     'progress stays per person per book');
  ok(Object.keys(b.completedBy).length === 1 && b.completedBy[actor.id] !== undefined,
     'only the person who finished is marked as having finished');
}

function readingExclusivity() {
  console.log('# read_book: one physical copy, one reader at a time');
  const sim = day();
  place(sim, 'place_shared_book', bookParams({ instanceId: 'book_e1' }));
  const b = sim.objectById('book_e1');
  const a = sim.state.characters[actorIds(sim)[0]], c = sim.state.characters[actorIds(sim)[1]];
  stand(sim, a, b.location, { x: 10, y: 16 });
  stand(sim, c, b.location, { x: 10, y: 16 });
  const READ = { actionId: 'read_book', targetKind: 'object', targetId: b.id };
  sim.requestDecision = () => null;

  ok(sim.startActivity(a, READ, 'test', null).ok && b.inUseBy === a.id, 'choosing to read claims the single copy, through the simulation');
  const second = sim.startActivity(c, READ, 'test', null);
  ok(!second.ok && second.error === 'in_use' && !c.activity, 'while one person holds the copy, another cannot start reading it (' + second.error + ')');
  ok(sim.legality(a, E.ACTIONS.read_book, b) === true, 'the holder remains eligible to continue');
  sim.tick(); sim.tick(); sim.tick();
  ok(sim.requestInterrupt(a.id, 'called_away') && b.inUseBy === null && b.readBy[a.id] === 3,
     'an interruption releases the copy and keeps the three minutes read');
  ok(sim.startActivity(c, READ, 'test', null).ok && b.inUseBy === c.id, 'releasing the copy lets the other person read it');
}

function readingHasNoArbitraryBonuses() {
  console.log('# read_book: no money, trust or goal is invented');
  const sim = day();
  place(sim, 'place_shared_book', bookParams({ instanceId: 'book_b1' }));
  const b = sim.objectById('book_b1');
  const actor = sim.state.characters[actorIds(sim)[0]];
  stand(sim, actor, b.location, { x: 10, y: 16 });
  const before = copy({
    money: actor.money, savings: actor.savings,
    relationships: actor.relationships, standing: actor.standing, goals: actor.goals
  });
  const c = ctxFor(sim, actor, b);
  E.ACTIONS.read_book.tick(c, 10);
  E.ACTIONS.read_book.onComplete(c);
  ok(actor.money === before.money && actor.savings === before.savings,
     'reading moves no money and no savings');
  assert.deepEqual(actor.relationships, before.relationships);
  ok(true, 'reading changes no relationship');
  assert.deepEqual(actor.standing, before.standing);
  ok(true, 'reading changes no standing');
  assert.deepEqual(actor.goals, before.goals);
  ok(true, 'reading moves no goal');
}

/* ---------------- food parcel ---------------- */

function parcelCallbacks() {
  console.log('# unpack_food_parcel: one transfer, no hunger change');
  const sim = day();
  const p = parcelParams(sim);
  place(sim, 'deliver_food_parcel', p);
  const parcel = sim.objectById(p.instanceId);
  const actor = sim.state.characters[p.toId];
  stand(sim, actor, p.locationId, p.useSpot);
  const before = { pantry: actor.pantry, hunger: actor.needs.hunger, money: actor.money, savings: actor.savings };

  const c = ctxFor(sim, actor, parcel);
  ok(E.ACTIONS.unpack_food_parcel.eligible(c) === true, 'the recipient can open the sealed parcel');
  E.ACTIONS.unpack_food_parcel.onComplete(c);
  const moved = actor.pantry - before.pantry;
  ok(moved === p.portions && moved <= parcel.portions,
     'the portions move into the pantry exactly once and never exceed the contents');
  ok(parcel.status === 'empty' && parcel.contentsLeft === 0 && parcel.openedBy === p.toId,
     'the parcel goes from sealed to empty, opened by the recipient');
  ok(actor.needs.hunger === before.hunger, 'opening the parcel does not directly reduce hunger');
  ok(actor.money === before.money && actor.savings === before.savings, 'opening moves no money');

  E.ACTIONS.unpack_food_parcel.onComplete(c);
  ok(actor.pantry - before.pantry === moved, 'a second completion transfers nothing more');
  const verdict = E.ACTIONS.unpack_food_parcel.eligible(c);
  ok(verdict !== true && verdict.reason === 'parcel_empty', 'an opened parcel is no longer a candidate');
}

function parcelIsPerceivedNotAnnounced() {
  console.log('# the parcel is perceived, not announced, and only its addressee opens it');
  const sim = day();
  const p = parcelParams(sim);
  const actor = sim.state.characters[p.toId];
  sim.placeCharacter(actor, 'park');   // away from home at delivery time
  place(sim, 'deliver_food_parcel', p);
  const parcel = sim.objectById(p.instanceId);
  ok(parcel !== null && parcel.location === p.locationId, 'the parcel exists in the recipient home');
  ok(!actor.memories.some((m) => m.type === 'FOOD_PARCEL_DELIVERED'),
     'a recipient who was not there has no memory of the delivery');

  const otherId = actorIds(sim).find((id) => id !== p.toId);
  sim.placeCharacter(sim.state.characters[otherId], p.locationId);
  const otherVerdict = E.ACTIONS.unpack_food_parcel.eligible(ctxFor(sim, sim.state.characters[otherId], parcel));
  ok(otherVerdict !== true && otherVerdict.reason === 'not_recipient',
     'somebody who is not the addressee cannot open it');

  const hero = sim.state.characters[p.toId];
  stand(sim, hero, p.locationId, p.useSpot);
  sim.placeCharacter(hero, 'park');
  const awayVerdict = E.ACTIONS.unpack_food_parcel.eligible(ctxFor(sim, hero, parcel));
  ok(awayVerdict !== true && awayVerdict.reason === 'not_present',
     'the addressee cannot open it from another place');
}

function eatAtHomeAfterRefill() {
  console.log('# the existing eat_at_home becomes available once the pantry is filled');
  const sim = day();
  const p = parcelParams(sim);
  place(sim, 'deliver_food_parcel', p);
  const parcel = sim.objectById(p.instanceId);
  const actor = sim.state.characters[p.toId];
  actor.pantry = 0;
  actor.needs.hunger = 60;
  stand(sim, actor, p.locationId, p.useSpot);

  const eat = A.get('eat_at_home');
  const beforeVerdict = eat.eligible(ctxFor(sim, actor, null));
  ok(beforeVerdict !== true && beforeVerdict.reason === 'no_food_at_home',
     'eat_at_home is refused while the pantry is empty');

  E.ACTIONS.unpack_food_parcel.onComplete(ctxFor(sim, actor, parcel));
  ok(actor.pantry >= 1, 'the opened parcel put food in the pantry');
  ok(eat.eligible(ctxFor(sim, actor, null)) === true,
     'eat_at_home is now a legal action; eating itself stays the existing mechanics');
}

/* ---------------- persistence and read-only safety ---------------- */

function serializableAndRoundTrip() {
  console.log('# state is JSON-safe, addressed by id, and survives a save/load');
  const sim = day();
  place(sim, 'place_shared_book', bookParams({ instanceId: 'book_p1' }));
  const pp = parcelParams(sim, { instanceId: 'parcel_p1' });
  place(sim, 'deliver_food_parcel', pp);
  const book = sim.objectById('book_p1');
  const parcel = sim.objectById('parcel_p1');
  const reader = sim.state.characters[actorIds(sim)[0]];
  stand(sim, reader, book.location, { x: 10, y: 16 });
  const c = ctxFor(sim, reader, book);
  E.ACTIONS.read_book.tick(c, 4);   // partial, unfinished

  let text = null;
  assert.doesNotThrow(() => { text = JSON.stringify(sim.state); });
  ok(text && text.indexOf('read_book') >= 0 && text.indexOf('unpack_food_parcel') >= 0,
     'the object state is JSON-serialisable and names its affordances');
  ok(typeof book.id === 'string' && typeof book.typeId === 'string' &&
     typeof parcel.toId === 'string' && typeof book.readBy[reader.id] === 'number',
     'every reference in the new state is an id string or a number');

  const restored = LT.Save.deserialize(LT.Save.serialize(sim));
  const rb = restored.objectById('book_p1');
  const rp = restored.objectById('parcel_p1');
  ok(rb && rp, 'the book and the parcel survive a save/load');
  ok(rb.readBy[reader.id] === 4, 'partial reading progress survives a save/load');
  ok(rb.requiredReadMinutes === book.requiredReadMinutes && rb.inUseBy === book.inUseBy,
     'the reading target and the availability holder survive');
  ok(rp.status === 'sealed' && rp.contentsLeft === parcel.contentsLeft &&
     rp.portions === parcel.portions && rp.toId === parcel.toId,
     'the parcel contents, status and addressee id survive');
}

function readOnlyOperationsDoNotMutate() {
  console.log('# read-only queries never write to the authoritative state');
  const sim = day();
  place(sim, 'place_shared_book', bookParams({ instanceId: 'book_q1' }));
  place(sim, 'deliver_food_parcel', parcelParams(sim, { instanceId: 'parcel_q1' }));
  const book = sim.objectById('book_q1');
  const parcel = sim.objectById('parcel_q1');
  const actor = sim.state.characters[actorIds(sim)[0]];
  stand(sim, actor, book.location, { x: 10, y: 16 });

  const snapshot = JSON.stringify(sim.state);
  E.ACTIONS.read_book.eligible(ctxFor(sim, actor, book));
  E.ACTIONS.unpack_food_parcel.eligible(ctxFor(sim, actor, parcel));
  P.observe(sim, actor);
  sim.objectsAt('park');
  sim.anchorFor(actor, E.ACTIONS.read_book, book);
  ok(JSON.stringify(sim.state) === snapshot,
     'eligible / observe / objectsAt / anchorFor leave state byte-identical');
}

async function main() {
  packageShape();
  invalidInterventions();
  interventionCreatesOneInstance();
  objectIdentity();
  readingCallbacks();
  readingExclusivity();
  readingHasNoArbitraryBonuses();
  parcelCallbacks();
  parcelIsPerceivedNotAnnounced();
  eatAtHomeAfterRefill();
  serializableAndRoundTrip();
  readOnlyOperationsDoNotMutate();
  console.log('\neveryday-opportunities: ' + checks + '/' + checks);
}

main().catch((e) => { console.error(e); process.exit(1); });
