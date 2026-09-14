// test/gen-world-data.js — GENERATE js/world-connections.gen.js from world/connections.json.
//
// Mirrors test/gen-narrative-data.js: the JSON is the human-edited source of truth and the .gen.js
// is NEVER edited by hand (same rationale as narrative-data.gen.js — see CANONICAL-SYNC). Run it after
// changing world/connections.json; the stale-guard in test/world-engine-v0.1-catalog.js fails CI if the
// generated file drifts from its source. This step ALSO validates the registry shape before embedding it,
// so a malformed record can't reach runtime.
const fs = require('fs');
const path = require('path');

function die(msg) { console.error('[gen-world-data] ' + msg); process.exit(1); }
function ok(cond, msg) { if (!cond) die(msg); else console.log('  ✓ ' + msg); }

// ---- read + validate the canonical source ---------------------------------
const source = path.join(__dirname, '..', 'world', 'connections.json');
let json;
try { json = JSON.parse(fs.readFileSync(source, 'utf8')); } catch (e) { die('cannot parse world/connections.json: ' + e.message); }

ok(json && typeof json === 'object' && Array.isArray(json.connections), 'file has a connections[] array');
const version = (json.version == null) ? 1 : json.version;
ok(typeof version === 'number', 'version is numeric (' + version + ')');

// Each record must have a unique id and an a/b endpoint pair with a named scene. A paired record carries
// triggers + spawn on both sides; a one-way record ("one_way": true) carries triggers and no spawn on a,
// a spawn and empty triggers on b.
const seen = new Set();
for (let i = 0; i < json.connections.length; i++) {
  const c = json.connections[i];
  ok(c && typeof c === 'object', '[' + i + '] record is an object');
  ok(typeof c.id === 'string' && c.id, '[' + i + '] has a non-empty id');
  if (seen.has(c.id)) die('duplicate connection id: ' + c.id);
  seen.add(c.id);
  ok(c.one_way === undefined || c.one_way === true, '[' + c.id + '] one_way absent or true');
  const oneWay = c.one_way === true;
  for (const key of ['a', 'b']) {
    const ep = c[key];
    ok(ep && typeof ep === 'object', '[' + c.id + '].' + key + ' endpoint present');
    ok(typeof ep.scene === 'string' && ep.scene, '[' + c.id + '].' + key + '.scene names a scene');
    ok(Array.isArray(ep.triggers), '[' + c.id + '].' + key + '.triggers is an array');
    if (oneWay && key === 'a') {
      ok(ep.triggers.length > 0 && ep.spawn === undefined, '[' + c.id + '].a one-way source: triggers, no spawn');
    } else {
      ok(ep.triggers.length > 0 || oneWay, '[' + c.id + '].' + key + '.triggers not empty (paired)');
      if (oneWay) ok(ep.triggers.length === 0, '[' + c.id + '].b one-way arrival: no triggers');
      ok(ep.spawn && typeof ep.spawn.tx === 'number', '[' + c.id + '].' + key + '.spawn.tx numeric');
    }
  }
}
// The record count is not pinned here: tools/world-apply.js runs this generator after create/delete.
// test/test-world-registry.js pins the real repo's exact id set.
ok(json.connections.length > 0, 'registry has records (' + json.connections.length + ')');

// ---- emit the generated module --------------------------------------------
// Records are sorted by id for a stable load order (the registry is the single source, so its order
// must never depend on authoring file order). The module deep-freezes the data at load: GAME.WorldData
// is the immutable runtime binding; editors mutate drafts, never this array.
const records = json.connections.slice().sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));
const body = JSON.stringify(records, null, 2).replace(/\n/g, '\n    ');

const out = path.join(__dirname, '..', 'js', 'world-connections.gen.js');
fs.writeFileSync(out, [
'/* world-connections.gen.js — GENERATED from world/connections.json by test/gen-world-data.js.',
' * DO NOT EDIT BY HAND. Change world/connections.json and run `node test/gen-world-data.js`.',
' * GAME.WorldData is the canonical runtime binding of the connection registry; it is deep-frozen so',
' * the World Builder can only mutate drafts, never this array. The stale-guard test fails if this file',
' * drifts from its source.',
' */',
'(function () {',
"  'use strict';",
'  var G = (typeof window !== "undefined") ? window : globalThis;',
'  var GAME = G.GAME = G.GAME || {};',
'  function freezeDeep(v) {',
'    if (v && typeof v === "object") { Object.freeze(v); for (var k in v) freezeDeep(v[k]); }',
'    return v;',
'  }',
'  var connections =', body + ';',
'  GAME.WorldData = GAME.WorldData || {};',
'  GAME.WorldData.version = ' + version + ';',
'  GAME.WorldData.connections = freezeDeep(connections);',
'}());',
''
].join('\n'));

console.log('[gen-world-data] wrote js/world-connections.gen.js (' + records.length + ' records, version ' + version + ')');
