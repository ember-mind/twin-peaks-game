#!/usr/bin/env node
'use strict';

// js/editor/apply/catalog-write.js — the text rewrite of js/world-catalog.js behind tools/world-apply.js.
// Synthetic catalogs plus the real file (read-only): add/remove keep every other byte, create+delete round-trips,
// scene resolution never guesses, and a rewrite that would not evaluate to the planned membership fails.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../js/editor/apply/catalog-write.js');
let pass = 0;
function ok(cond, label) { assert.ok(cond, label); pass++; }

const SYN = `(function () {
  GAME.World.register({
    id: 'w',
    locations: [
      { id: 'alpha', environments: [{ id: 'in', sceneId: 's-in' }, { id: 'out', sceneId: 's-out' }], connections: ['one', 'two'] },
      {
        id: 'beta',
        environments: [{ id: 'beta', sceneId: 's-beta' }],
        // a comment above the array stays
        connections: ['one',
          'three', 'four']
      },
      { id: 'gamma', environments: [{ id: 'g', sceneId: 's-gamma' }], connections: [] },
      { id: 'delta', environments: [{ id: 'd', sceneId: 's-beta' }], connections: [] }
    ]
  });
}());
`;

// ---- readCatalog / membership
assert.deepEqual(C.membership(C.readCatalog(SYN)), { alpha: ['one', 'two'], beta: ['one', 'three', 'four'], gamma: [], delta: [] });
pass++;

// ---- addId: append after the last id, into an empty array, multi-line array
let t = C.addId(SYN, 'alpha', 'five');
ok(t.includes("connections: ['one', 'two', 'five'] }") && t.replace(", 'five'", '') === SYN, 'add appends and changes nothing else');
t = C.addId(SYN, 'gamma', 'five');
ok(t.includes("sceneId: 's-gamma' }], connections: ['five'] }") && t.replace("'five'", '') === SYN, 'add into an empty array');
t = C.addId(SYN, 'beta', 'five');
ok(t.includes("'three', 'four', 'five']") && t.includes('// a comment above the array stays'), 'add into a wrapped array keeps comments');
assert.throws(() => C.addId(SYN, 'alpha', 'two'), /already listed in location alpha/);
assert.throws(() => C.addId(SYN, 'nope', 'x'), /location "nope" appears 0 time\(s\)/);
pass += 2;

// ---- removeId: first, middle, last, only, across a line break
ok(C.removeId(SYN, 'alpha', 'one').includes("connections: ['two'] }"), 'remove first');
ok(C.removeId(SYN, 'alpha', 'two').includes("connections: ['one'] }"), 'remove last');
ok(C.removeId(SYN, 'beta', 'three').includes("connections: ['one', 'four']") || C.removeId(SYN, 'beta', 'three').includes("connections: ['one',\n          'four']"), 'remove middle');
ok(C.removeId(SYN, 'beta', 'four').includes("connections: ['one',\n          'three']"), 'remove last across a wrapped line');
ok(C.removeId(C.addId(SYN, 'gamma', 'x'), 'gamma', 'x') === SYN, 'add then remove from an empty array round-trips');
assert.throws(() => C.removeId(SYN, 'alpha', 'three'), /not listed exactly once in location alpha/);
pass++;

// ---- a hand-written array with anything but quoted ids is refused, not rewritten
const commented = SYN.replace("connections: ['one', 'two']", "connections: ['one', /* keep */ 'two']");
assert.throws(() => C.addId(commented, 'alpha', 'x'), /holds something other than quoted ids; edit it by hand/);
pass++;

// ---- locationForScene: exactly one, none (lists locations), several (ambiguous)
const syn = C.readCatalog(SYN);
ok(C.locationForScene(syn, 's-out') === 'alpha', 'scene resolves through environments');
assert.throws(() => C.locationForScene(syn, 's-none'), /scene "s-none" has no catalog location; .*Locations: alpha \(s-in, s-out\); beta \(s-beta\); gamma \(s-gamma\); delta \(s-beta\)/);
assert.throws(() => C.locationForScene(syn, 's-beta'), /scene "s-beta" belongs to 2 catalog locations \(beta, delta\); the catalog is ambiguous/);
pass += 2;

// ---- planCatalog: create / delete / shared location / refusals
const rec = (id, a, b) => ({ id, a: { scene: a }, b: { scene: b } });
let plan = C.planCatalog(SYN, [{ op: 'create', record: rec('new-door', 's-in', 's-gamma') }]);
assert.deepEqual(plan.after, { alpha: ['one', 'two', 'new-door'], beta: ['one', 'three', 'four'], gamma: ['new-door'], delta: [] });
assert.deepEqual(plan.touched, [{ op: 'create', id: 'new-door', locations: ['alpha', 'gamma'] }]);
pass += 2;
ok(C.planCatalog(plan.text, [{ op: 'delete', record: rec('new-door', 's-in', 's-gamma') }]).text === SYN, 'create then delete gives the original bytes');
plan = C.planCatalog(SYN, [{ op: 'create', record: rec('hall', 's-in', 's-out') }]);
ok(JSON.stringify(plan.after.alpha) === '["one","two","hall"]' && plan.touched[0].locations.join() === 'alpha', 'both endpoints in one location: listed once');
assert.throws(() => C.planCatalog(SYN, [{ op: 'create', record: rec('three', 's-in', 's-gamma') }]), /"three" is already listed in js\/world-catalog\.js \(beta\)/);
assert.throws(() => C.planCatalog(SYN, [{ op: 'create', record: rec('x', 's-in', 's-beta') }]), /ambiguous/);
assert.throws(() => C.planCatalog(SYN, [{ op: 'delete', record: rec('two', 's-in', 's-gamma') }]), /listed in \[alpha\] but its endpoints belong to \[alpha, gamma\]/);
pass += 3;
plan = C.planCatalog(SYN, [{ op: 'delete', record: rec('one', 's-in', 's-beta-only') }].slice(0, 0));
ok(!plan.changed && plan.text === SYN, 'no create/delete op: catalog unchanged');

// ---- the rewrite is re-evaluated: an array the regex accepts but the vm reads differently fails loudly
const tricky = SYN.replace("{ id: 'gamma', environments: [{ id: 'g', sceneId: 's-gamma' }], connections: [] }",
  "{ id: 'gamma', environments: [{ id: 'g', sceneId: 's-gamma' }], connections: [].concat(['z']) }");
assert.throws(() => C.planCatalog(tricky, [{ op: 'create', record: rec('q', 's-in', 's-gamma') }]), /does not evaluate to the planned membership/);
pass++;

// ---- diffLines
assert.deepEqual(C.diffLines('a\nb\nc', 'a\nB\nc\nd'), ['@@ line 2', '- b', '+ B', '@@ line 4', '+ d']);
pass++;

// ---- the real catalog (read only): every location's array is editable, round-trip is byte-identical
const REAL = fs.readFileSync(path.join(__dirname, '..', 'js', 'world-catalog.js'), 'utf8');
const real = C.readCatalog(REAL);
real.locations.forEach((loc) => {
  const added = C.addId(REAL, loc.id, 'm6-probe-id');
  assert.deepEqual(C.membership(C.readCatalog(added))[loc.id], loc.connections.concat(['m6-probe-id']));
  assert.equal(C.removeId(added, loc.id, 'm6-probe-id'), REAL, loc.id + ' add/remove round-trips');
});
pass += real.locations.length;
ok(C.locationForScene(real, 'hotel_gn') === 'great-northern' && C.locationForScene(real, 'redroom') === 'red-room', 'real scenes resolve');

console.log(`CATALOG-WRITE-PASS ${pass}`);
