#!/usr/bin/env node
'use strict';
// world-catalog-coverage.js — guards the authored<->catalog connection bijection that
// test/world-engine-v0.1-catalog.js only checks in one direction.
//
// That test proves catalog->authored ("every id World.getConnections() returns has an
// authored record") but builds its lookup as a Map keyed by id, so two authored records
// that share an id across files collapse silently, and it never checks the reverse: an
// authored door added to a *LocationConnections array but left out of world-catalog.js
// would still pass. These two gaps are exactly what this test covers.
//
// It deliberately does NOT validate doors, scenes, or spawn geometry -- that is the job of
// the catalog test -- so it loads only what determines connection-id coverage: the four
// authored arrays and the registered catalog.

const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.join(__dirname, '..');

// The *LocationConnections arrays expose themselves on window.GAME at module load; make
// Node's global that window so the (typeof window !== 'undefined') guards fire. We do not
// load GAME.Maps: World.register() skips scene validation when Maps is absent, which keeps
// this test scoped to id coverage rather than re-running the catalog test's door checks.
global.window = global;
global.GAME = {};

require(path.join(root, 'js/world-engine.js'));        // defines GAME.World (not yet registered)
require(path.join(root, 'js/double-r-location-data.js'));
require(path.join(root, 'js/sheriffs-station-location-data.js'));
require(path.join(root, 'js/traincar-location-data.js'));
require(path.join(root, 'js/room-315-location-data.js'));
require(path.join(root, 'js/world-catalog.js'));        // registers -> World.getConnections() works

const GAME = global.GAME;
const World = GAME.World;

// ---- authored side -----------------------------------------------------------
// The four arrays that hold connection descriptors. If a location ever adds its own array,
// add it here so coverage stays complete -- forgetting an array is the very failure this
// test exists to catch on the reverse direction too.
const AUTHORED_ARRAYS = [
   'DoubleRLocationConnections',
   'SheriffsStationLocationConnections',
   'TraincarLocationConnections',
   'Room315LocationConnections'
];

for (const name of AUTHORED_ARRAYS) {
  assert(Array.isArray(GAME[name]), `${name} must be exposed by its location-data module`);
}

// Flatten every authored record. Each must declare a nonempty id: a malformed descriptor
// would otherwise silently drop out of the comparison instead of failing loudly here.
const authoredIds = [];
for (const name of AUTHORED_ARRAYS) {
  GAME[name].forEach((record, index) => {
    assert(record && typeof record.id === 'string' && record.id.trim().length > 0,
      `${name}[${index}] must declare a nonempty string connection id`);
    authoredIds.push(record.id);
   });
}

// ---- cross-file id uniqueness -------------------------------------------------
// The catalog test keys its lookup by id (a Map), which collapses a cross-file duplicate.
// A Set over the authored ids catches any repeat and names both sources for diagnosis, so
// it also covers a within-array duplicate that the catalog's per-location check cannot see.
const firstSeen = new Map(); // id -> source string that declared it first
for (const name of AUTHORED_ARRAYS) {
  GAME[name].forEach((record, index) => {
    if (firstSeen.has(record.id)) {
      assert(false,
        `connection id "${record.id}" is authored twice: ${firstSeen.get(record.id)} and ${name}[${index}]`);
    }
    firstSeen.set(record.id, `${name}[${index}]`);
   });
}

// ---- bijection with the catalog ----------------------------------------------
// getConnections() returns the deduplicated catalog-wide id list in author order. A shared
// connection legitimately appears in two locations' arrays, so compare SETS -- never the raw
// per-location lists -- and do NOT assert uniqueness on this side: it is already deduplicated
// by World.prepare() via its global connectionSeen set.
const authoredSet = new Set(authoredIds);
const catalogSet = new Set(Array.from(World.getConnections()));
assert(catalogSet.size > 0, 'the catalog must declare at least one connection');

for (const id of catalogSet) {
  assert(authoredSet.has(id),
    `catalog connection "${id}" has no authored descriptor in any *LocationConnections array`);
}
for (const id of authoredSet) {
  assert(catalogSet.has(id),
    `authored connection "${id}" (${firstSeen.get(id)}) is not referenced by any location in world-catalog.js`);
}

console.log(
   `WORLD-CATALOG-COVERAGE-PASS ${authoredSet.size} authored connections biject with the catalog, ids unique across ${AUTHORED_ARRAYS.length} arrays`
);
