// test/gen-world-data.js — GENERATE js/world-connections.gen.js from world/connections.json, and
// js/scene-objects.gen.js from world/scene-objects.json (M8; written first, so the last output line stays the
// connections line tools/world-apply.js prints).
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

// ---- scene objects (M8): world/scene-objects.json -> js/scene-objects.gen.js ----------------------------------
// Shape only; dialogue ids and scene ids are checked against the booted game by test/scene-objects-equality.js.
// Scene and entry order are kept as authored: glue emits objects[] in order, then interact keys in key order, and
// GAME.Maps.objectAt returns the first entry on a tile.
(function () {
  const soSource = path.join(__dirname, '..', 'world', 'scene-objects.json');
  let so;
  try { so = JSON.parse(fs.readFileSync(soSource, 'utf8')); } catch (e) { die('cannot parse world/scene-objects.json: ' + e.message); }
  const bad = function (m) { die('world/scene-objects.json: ' + m); };
  if (!so || typeof so !== 'object' || so.version !== 1) bad('version must be 1');
  if (!so.scenes || typeof so.scenes !== 'object' || Array.isArray(so.scenes)) bad('scenes must be an object');
  const OBJECT_KEYS = { sourceId: 1, type: 1, kind: 1, x: 1, y: 1, w: 1, h: 1, dialogue: 1 };
  const isTile = function (n) { return Number.isInteger(n) && n >= 0; };
  const isDialogueId = function (d) { return typeof d === 'string' && /^[A-Za-z0-9_]+$/.test(d); };
  let nObjects = 0, nInteract = 0;
  Object.keys(so.scenes).forEach(function (scene) {
    const sc = so.scenes[scene];
    if (!/^[a-z0-9_]+$/.test(scene)) bad('scene id "' + scene + '" is not a map id');
    if (!sc || typeof sc !== 'object' || Object.keys(sc).sort().join(',') !== 'interact,objects') bad(scene + ' must have exactly objects[] and interact{}');
    if (!Array.isArray(sc.objects)) bad(scene + '.objects must be an array');
    if (!sc.interact || typeof sc.interact !== 'object' || Array.isArray(sc.interact)) bad(scene + '.interact must be an object');
    const ids = new Set();
    sc.objects.forEach(function (o, i) {
      const at = scene + '.objects[' + i + ']';
      if (!o || typeof o !== 'object') bad(at + ' is not an object');
      Object.keys(o).forEach(function (k) { if (!OBJECT_KEYS[k]) bad(at + ' has unknown field "' + k + '"'); });
      if (typeof o.sourceId !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(o.sourceId)) bad(at + '.sourceId must be kebab-case');
      if (ids.has(o.sourceId)) bad(scene + ': duplicate sourceId ' + o.sourceId);
      ids.add(o.sourceId);
      if (typeof o.type !== 'string' || !o.type) bad(at + '.type must be a non-empty string');
      if (o.kind !== undefined && (typeof o.kind !== 'string' || !o.kind)) bad(at + '.kind must be a non-empty string when present');
      if (!isTile(o.x) || !isTile(o.y)) bad(at + ' x,y must be non-negative integers');
      if ((o.w === undefined) !== (o.h === undefined)) bad(at + ' carries w and h together or neither');
      if (o.w !== undefined && (!Number.isInteger(o.w) || o.w < 1 || !Number.isInteger(o.h) || o.h < 1)) bad(at + ' w,h must be positive integers');
      if (Array.isArray(o.dialogue)) {
        if (!o.dialogue.length) bad(at + '.dialogue cascade is empty');
        o.dialogue.forEach(function (step, j) {
          if (isDialogueId(step)) return;
          const condOk = typeof step.cond === 'string' || (Array.isArray(step.cond) && step.cond.length && step.cond.every(function (c) { return typeof c === 'string'; }));
          if (!step || typeof step !== 'object' || !condOk || !isDialogueId(step.then) || Object.keys(step).length !== 2) bad(at + '.dialogue[' + j + '] must be a dialogue id or { cond, then }');
        });
      } else if (!isDialogueId(o.dialogue)) bad(at + '.dialogue must be a dialogue id or a cascade');
      nObjects++;
    });
    Object.keys(sc.interact).forEach(function (key) {
      if (!/^\d+,\d+$/.test(key)) bad(scene + '.interact key "' + key + '" must be "x,y"');
      if (typeof sc.interact[key] !== 'string' || !/^[A-Za-z0-9_]+$/.test(sc.interact[key])) bad(scene + '.interact["' + key + '"] must be an interact id');
      nInteract++;
    });
  });
  const soBody = JSON.stringify(so.scenes, null, 2).replace(/\n/g, '\n    ');
  fs.writeFileSync(path.join(__dirname, '..', 'js', 'scene-objects.gen.js'), [
'/* scene-objects.gen.js — GENERATED from world/scene-objects.json by test/gen-world-data.js.',
' * DO NOT EDIT BY HAND. Change world/scene-objects.json and run `node test/gen-world-data.js`.',
' * GAME.WorldData.sceneObjects is the only source of scene objects and interact keys: js/glue.js reads it and',
' * refuses a js/maps.js map that still carries objects/interact. Deep-frozen; glue copies every entry.',
' */',
'(function () {',
"  'use strict';",
'  var G = (typeof window !== "undefined") ? window : globalThis;',
'  var GAME = G.GAME = G.GAME || {};',
'  function freezeDeep(v) {',
'    if (v && typeof v === "object") { Object.freeze(v); for (var k in v) freezeDeep(v[k]); }',
'    return v;',
'  }',
'  var scenes =', soBody + ';',
'  GAME.WorldData = GAME.WorldData || {};',
'  GAME.WorldData.sceneObjects = freezeDeep({ version: ' + so.version + ', scenes: scenes });',
'}());',
''
  ].join('\n'));
  console.log('[gen-world-data] wrote js/scene-objects.gen.js (' + Object.keys(so.scenes).length + ' scenes, ' + nObjects + ' objects, ' + nInteract + ' interact keys)');
}());

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
