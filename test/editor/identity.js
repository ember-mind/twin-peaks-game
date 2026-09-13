#!/usr/bin/env node
'use strict';

// Editor-core identity scheme — exercised over SYNTHETIC ids only (no GAME, no game
// module required). Covers generation round-trips through parse(), fail-loud on
// malformed ids, kind dispatch, and the duplicate-detection safety net.

const assert = require('node:assert/strict');
const identity = require('../../js/editor/core/identity.js');
let pass = 0;
function ok(cond, label) { assert.ok(cond, label); pass++; }

// ---- generators produce canonical strings ----
ok(identity.endpointId('town-traincar-east', 'b') === 'connection-endpoint:town-traincar-east:b', 'endpoint id shape');
ok(identity.triggerId('sheriffs-station-front-entrance', 2) === 'trigger:sheriffs-station-front-entrance:2', 'trigger id shape');
ok(identity.npcId('shelly-npc', 'diner') === 'npc:shelly-npc:diner', 'npc id shape');
ok(identity.legacyDoorId('hotel_gn', 7, 4) === 'legacy-door:hotel_gn:7,4', 'legacy-door id shape');

// ---- parse() round-trips every kind and recovers fields ----
let p;
p = identity.parse('connection-endpoint:town-sheriffs-station-lot:a');
ok(p && p.kind === identity.KINDS.ENDPOINT && p.connId === 'town-sheriffs-station-lot' && p.side === 'a', 'parse endpoint');

p = identity.parse('trigger:great-northern-room-315-hall:0');
ok(p && p.kind === identity.KINDS.TRIGGER && p.connId === 'great-northern-room-315-hall' && p.n === 0, 'parse trigger');

p = identity.parse('npc:logan-npc:sheriff');
ok(p && p.kind === identity.KINDS.NPC && p.npcId === 'logan-npc' && p.scene === 'sheriff', 'parse npc');

p = identity.parse('legacy-door:redroom:12,3');
ok(p && p.kind === identity.KINDS.LEGACY_DOOR && p.scene === 'redroom' && p.x === 12 && p.y === 3, 'parse legacy-door');

// ---- kindOf dispatches without full field parse; unknown prefix is null ----
ok(identity.kindOf('npc:x:y') === identity.KINDS.NPC, 'kindOf npc');
ok(identity.kindOf('legacy-door:a:0,0') === identity.KINDS.LEGACY_DOOR, 'kindOf legacy-door');
ok(identity.kindOf('totally-unknown-id') === null, 'kindOf unknown prefix -> null');

// ---- parse() returns null (not throw) on malformed ids of each kind ----
ok(identity.parse('connection-endpoint:town:a,b') === null, 'endpoint side not a|b -> null');   // extra field leaks into side slot
ok(identity.parse('trigger:x:') === null, 'trigger missing index -> null');
ok(identity.parse('trigger:x:abc') === null, 'trigger non-integer index -> null');
ok(identity.parse('npc:onlyonepart') === null, 'npc missing scene colon -> null');
ok(identity.parse('legacy-door:s:0.5,1') === null, 'legacy-door non-integer coord -> null');
ok(identity.parse('') === null && identity.parse(42) === null, 'empty/non-string -> null');

// ---- validate() is the fail-loud twin of parse() ----
assert.throws(() => identity.validate('nope:1,2'), /not a well-formed/);
assert.doesNotThrow(() => identity.validate('npc:a:b'));

// ---- generators fail loud on bad components (colon-free invariant) ----
assert.throws(() => identity.endpointId('a:b', 'a'), /colon-free/);
assert.throws(() => identity.endpointId('ok', 'c'), /'a' or 'b'/);
assert.throws(() => identity.triggerId('ok', -1), /non-negative/);
assert.throws(() => identity.legacyDoorId('s', 0, -1), /non-negative/);

// ---- dedupe() throws on collision, passes a collision-free set ----
const unique = ['npc:a:diner', 'npc:b:tavern', 'connection-endpoint:c:a'];
ok(identity.dedupe(unique).length === 3, 'dedupe keeps a collision-free set');
assert.throws(() => identity.dedupe(['x:a', 'x:a', 'y:b']), /duplicate ids/);

// ---- the four kind prefixes are prefix-disjoint at the first colon ----
// (guards parse() from ever mistaking one kind for another)
for (const a of Object.values(identity.KINDS)) {
  for (const b of Object.values(identity.KINDS)) {
    ok(a === b || !b.startsWith(a + ':'), `prefix ${a} is not a colon-prefixed prefix of ${b}`);
   }
 }

console.log(`EDITOR-IDENTITY-PASS ${pass}`);
