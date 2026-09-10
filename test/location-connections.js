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

console.log('LOCATION-CONNECTIONS-PASS shared endpoint descriptors, generic mapping, atomic validation and uninstall');
