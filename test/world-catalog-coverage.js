#!/usr/bin/env node
'use strict';
// world-catalog-coverage.js — guards the authored<->catalog connection bijection that
// test/world-engine-v0.1-catalog.js only checks in one direction, now against the single
// authoritative source: GAME.WorldData.connections (js/world-connections.gen.js). The four
// *-location-data groups that used to hold these records were deleted in favour of this one
// registry; its frozen array IS the authored side of the bijection.
//
// That catalog test proves catalog->authored ("every id World.getConnections() returns has an
// record") but keys its lookup by id, so two records that share an id collapse silently and it
// never checks the reverse: a registry record id left out of world-catalog.js would still pass.
// These two gaps are what this test covers, set-based (a shared connection legitimately appears
// in two locations' connection lists, so we compare SETS, never raw per-location lists).

const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.join(__dirname, '..');

// WorldData.connections expose themselves on window.GAME at module load; make Node's global that
// window so the (typeof window !== 'undefined') guards fire. We do not load GAME.Maps:
// World.register() skips scene validation when Maps is absent, which keeps this test scoped to
// connection-id coverage rather than re-running the catalog test's door checks.
global.window = global;
global.GAME = {};

require(path.join(root, 'js/world-engine.js'));         // defines GAME.World (not yet registered)
require(path.join(root, 'js/world-connections.gen.js')); // builds + freezes GAME.WorldData.connections
require(path.join(root, 'js/world-catalog.js'));         // registers -> World.getConnections() works

const GAME = global.GAME;
const World = GAME.World;
const registry = GAME.WorldData.connections;

// ---- authored side: the single registry -------------------------------------
// Records live in one frozen array now. Each must still declare a nonempty id: a malformed
// record would silently drop out of the comparison instead of failing loudly here.
assert(Array.isArray(registry), 'GAME.WorldData.connections must be the registry array');
assert(Object.isFrozen(registry), 'the connection registry is frozen — editors work on drafts, never the source');

const authoredIds = [];
registry.forEach((record, index) => {
   assert(record && typeof record.id === 'string' && record.id.trim().length > 0,
     `registry[${index}] must declare a nonempty string connection id`);
    authoredIds.push(record.id);
    });

// ---- id uniqueness ----------------------------------------------------------
// The catalog test keys its lookup by id (a Map), which collapses a duplicate. A first-seen map
// over registry ids catches any repeat and names both positions for diagnosis.
const firstSeen = new Map(); // id -> index that declared it first
registry.forEach((record, index) => {
   if (firstSeen.has(record.id)) {
      assert(false, `connection id "${record.id}" appears twice in the registry: ${firstSeen.get(record.id)} and ${index}`);
    }
     firstSeen.set(record.id, index);
     });

// ---- bijection with the catalog ----------------------------------------------
// getConnections() returns the deduplicated catalog-wide id list. Compare SETS: a shared
// connection legitimately belongs to two locations, so uniqueness is already guaranteed by
// World.prepare()'s global connectionSeen set — we assert it here instead of on per-location lists.
const authoredSet = new Set(authoredIds);
const catalogSet = new Set(Array.from(World.getConnections()));
assert(catalogSet.size > 0, 'the catalog must declare at least one connection');

for (const id of catalogSet) {
   assert(authoredSet.has(id), `catalog connection "${id}" has no record in the registry`);
    }
for (const id of authoredSet) {
     assert(catalogSet.has(id), `registry connection "${id}" (${firstSeen.get(id)}) is not referenced by any location in world-catalog.js`);
      }

console.log(
   `WORLD-CATALOG-COVERAGE-PASS ${authoredSet.size} registry connections biject with the catalog, ids unique across the single registry`
    );
