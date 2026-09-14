#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
global.window = global;
global.GAME = {};
require('../js/location-connections.js');

function fixture() {
  const maps = {
    street: { id: 'street', width: 5, height: 4, rows: ['.....', '.....', '..#..', '.....'], doors: { '1,3': { legacy: true } } },
    cafe: { id: 'cafe', width: 4, height: 4, rows: ['....', '.#..', '....', '....'], doors: {} },
    woods: { id: 'woods', width: 3, height: 3, rows: ['...', '...', '...'], doors: {} },
    cabin: { id: 'cabin', width: 3, height: 3, rows: ['...', '...', '...'], doors: {} }
  };
  maps.isSolid = (id, x, y) => maps[id].rows[y][x] === '#';
  return maps;
}

const maps = fixture();
const connection = {
  id: 'double-r-front',
  a: { scene: 'street', triggers: [[1, 3], [2, 3]], spawn: { tx: 1, ty: 2, dir: 'down' }, departureReaction: 'street-door' },
  b: { scene: 'cafe', triggers: [[1, 3], [2, 3]], spawn: { tx: 2, ty: 2, dir: 'up' }, departureReaction: 'cafe-door' }
};
const handle = GAME.LocationConnections.install(connection, maps);
assert.strictEqual(maps.street.doors['1,3'], maps.street.doors['2,3'], 'one source endpoint shares one door descriptor');
assert.strictEqual(maps.cafe.doors['1,3'], maps.cafe.doors['2,3'], 'one destination endpoint shares one door descriptor');
assert.notStrictEqual(maps.street.doors['1,3'], maps.cafe.doors['1,3'], 'opposite endpoints have distinct descriptors');
assert.deepEqual(maps.street.doors['1,3'], { connectionId: 'double-r-front', to: 'cafe', tx: 2, ty: 2, dir: 'up', departureReaction: 'street-door' });
assert.deepEqual(maps.cafe.doors['1,3'], { connectionId: 'double-r-front', to: 'street', tx: 1, ty: 2, dir: 'down', departureReaction: 'cafe-door' });
assert.strictEqual(handle.connection, connection);
handle.uninstall();
assert.deepEqual(maps.street.doors['1,3'], { legacy: true }, 'uninstall restores an overridden door');
assert.equal(maps.street.doors['2,3'], undefined);

const arbitrary = {
  id: 'woods-cabin',
  a: { scene: 'woods', triggers: [[0, 1], [0, 2]], spawn: { tx: 1, ty: 1, dir: 'left' } },
  b: { scene: 'cabin', triggers: [[2, 1], [2, 2]], spawn: { tx: 1, ty: 1, dir: 'right' } }
};
GAME.LocationConnections.install(arbitrary, maps);
assert.deepEqual(maps.woods.doors['0,1'], { connectionId: 'woods-cabin', to: 'cabin', tx: 1, ty: 1, dir: 'right' });
assert.deepEqual(maps.cabin.doors['2,2'], { connectionId: 'woods-cabin', to: 'woods', tx: 1, ty: 1, dir: 'left' });

const gated = {
  id: 'gated-street-cafe',
  a: { scene: 'street', triggers: [[0, 0]], spawn: { tx: 1, ty: 2, dir: 'down' }, door: { needsFlag: 'opened', blockedMsg: 'closed' } },
  b: { scene: 'cafe', triggers: [[0, 0]], spawn: { tx: 2, ty: 2, dir: 'up' } }
};
GAME.LocationConnections.install(gated, maps);
assert.deepEqual(maps.street.doors['0,0'], { connectionId: 'gated-street-cafe', to: 'cafe', tx: 2, ty: 2, dir: 'up', needsFlag: 'opened', blockedMsg: 'closed' });

function rejectsAtomically(change, message) {
  const local = fixture();
  const candidate = JSON.parse(JSON.stringify(connection));
  change(candidate);
  const before = JSON.stringify({ street: local.street.doors, cafe: local.cafe.doors });
  assert.throws(() => GAME.LocationConnections.install(candidate, local), message);
  assert.equal(JSON.stringify({ street: local.street.doors, cafe: local.cafe.doors }), before, 'validation failure makes no door writes');
}

rejectsAtomically(c => { c.a.triggers[1] = [9, 3]; }, /outside map bounds/);
rejectsAtomically(c => { c.a.triggers[1] = [2, 2]; }, /must be walkable/);
rejectsAtomically(c => { c.b.spawn = { tx: 1, ty: 1, dir: 'up' }; }, /must be walkable/);
rejectsAtomically(c => { c.b.spawn.dir = 'north'; }, /spawn\.dir/);
rejectsAtomically(c => { c.b.spawn.dir = 'constructor'; }, /spawn\.dir/);
rejectsAtomically(c => { c.b.spawn = { tx: 1, ty: 3, dir: 'up' }; }, /outside its trigger tiles/);
rejectsAtomically(c => { c.b.scene = 'missing'; }, /does not exist/);
rejectsAtomically(c => { c.a.triggers = []; }, /must not be empty/);
rejectsAtomically(c => { c.b.scene = 'street'; c.b.spawn = { tx: 3, ty: 1, dir: 'up' }; }, /different scenes/);
rejectsAtomically(c => { c.a.door = { needsFlag: 1 }; }, /door\.needsFlag/);

rejectsAtomically(c => { c.a.door = { needsClues: 0 }; }, /door\.needsClues/);
rejectsAtomically(c => { c.b.triggers = []; }, /b\.triggers must not be empty/);
rejectsAtomically(c => { c.one_way = false; }, /one_way must be true/);

// ---- one-way records: a = triggers only, b = spawn only; install writes a's map only
{
  const local = fixture();
  const oneWay = {
    id: 'woods-cabin-dream', one_way: true,
    a: { scene: 'woods', triggers: [[0, 1], [0, 2]], door: { needsClues: 3, blockedMsg: 'dream_closed' } },
    b: { scene: 'cabin', triggers: [], spawn: { tx: 1, ty: 1, dir: 'up' } }
  };
  assert.deepEqual(GAME.LocationConnections.validateConnection(oneWay, local), { valid: true, errors: [] });
  const h = GAME.LocationConnections.install(oneWay, local);
  assert.deepEqual(local.woods.doors['0,1'], { connectionId: 'woods-cabin-dream', to: 'cabin', tx: 1, ty: 1, dir: 'up', blockedMsg: 'dream_closed', needsClues: 3 },
    'one-way source descriptor carries b spawn and a door fields');
  assert.strictEqual(local.woods.doors['0,1'], local.woods.doors['0,2']);
  assert.deepEqual(local.cabin.doors, {}, 'one-way install writes nothing on the arrival map');
  h.uninstall();
  assert.deepEqual(local.woods.doors, {}, 'one-way uninstall restores the source map');

  const rejectsOneWay = (mutate, pattern) => {
    const m = fixture();
    const c = JSON.parse(JSON.stringify(oneWay));
    mutate(c);
    assert.throws(() => GAME.LocationConnections.install(c, m), pattern);
    assert.deepEqual([m.woods.doors, m.cabin.doors], [{}, {}], 'rejected one-way install writes nothing');
    assert.equal(GAME.LocationConnections.validateConnection(c, m).valid, false);
  };
  rejectsOneWay(c => { c.b.triggers = [[2, 2]]; }, /b\.triggers must be empty on a one-way connection/);
  rejectsOneWay(c => { c.a.triggers = []; }, /a\.triggers must not be empty/);
  rejectsOneWay(c => { c.a.spawn = { tx: 1, ty: 1, dir: 'down' }; }, /a\.spawn is not allowed on a one-way connection/);
  rejectsOneWay(c => { delete c.b.spawn; }, /b\.spawn must contain/);
  rejectsOneWay(c => { c.b.door = { needsFlag: 'x' }; }, /b\.door is not allowed without triggers/);
  // the same shape without one_way is a paired record with empty b triggers: still rejected
  rejectsOneWay(c => { delete c.one_way; }, /triggers must not be empty|a\.spawn/);
  const paired = JSON.parse(JSON.stringify(oneWay)); delete paired.one_way; paired.a.spawn = { tx: 1, ty: 1, dir: 'down' };
  assert.deepEqual(GAME.LocationConnections.validateConnection(paired, fixture()).errors, ['b.triggers must not be empty']);
}

console.log('LOCATION-CONNECTIONS-PASS shared endpoint descriptors, generic mapping, atomic validation and uninstall, one-way records');
