#!/usr/bin/env node
'use strict';

/* tools/world-apply.js — apply a World Builder changeset to the connection registry.
 *
 *   node tools/world-apply.js <changeset.json> [--dry-run] [--root=<repo root>]
 *
 * 1. loads <root>/world/connections.json (root defaults to this repo)
 * 2. reapplies the changeset STRICTLY (js/editor/core/edit.js#reapply): unknown connection id, unknown
 *    endpoint, or a target other than world/connections.json exits non-zero before anything is written
 * 3. validates EVERY resulting record against the real maps with GAME.LocationConnections.validateConnection
 * 4. prints, per changed endpoint:
 *        TARGET world/connections.json :: <connectionId>
 *        BEFORE <endpoint json>
 *        AFTER  <endpoint json>
 * 5. without --dry-run: writes ONLY <root>/world/connections.json (record order kept, 2-space JSON, version
 *    unchanged), then runs <root>/test/gen-world-data.js. A changeset that changes nothing writes nothing.
 *
 * Exit codes: 0 ok / no-op, 1 validation failed, 2 usage or refused changeset.
 * --root exists for test/world-apply.js (a temp copy fixture); maps always load from this repo's js/.
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REPO = path.resolve(__dirname, '..');
const TARGET_REL = 'world/connections.json';
const Edit = require(path.join(REPO, 'js', 'editor', 'core', 'edit.js'));

function usage(msg) {
  if (msg) console.error('world-apply: ' + msg);
  console.error('usage: node tools/world-apply.js <changeset.json> [--dry-run] [--root=<dir>]');
  process.exit(2);
}

function parseArgs(argv) {
  const out = { file: null, dryRun: false, root: REPO };
  for (const a of argv) {
    if (a === '--dry-run') out.dryRun = true;
    else if (a.startsWith('--root=')) out.root = path.resolve(a.slice(7));
    else if (a.startsWith('--')) usage('unknown option ' + a);
    else if (out.file) usage('only one changeset file');
    else out.file = a;
  }
  if (!out.file) usage('changeset file required');
  return out;
}

// Boot the real map chain headlessly (same stubs as test/test-world-registry.js) and return GAME.
function loadWorld() {
  global.window = global;
  global.addEventListener = function () {};
  global.requestAnimationFrame = function () {};
  global.performance = global.performance || { now: function () { return 0; } };
  global.document = { createElement: function () { return { style: {}, getContext: function () {
    return new Proxy({ measureText: function () { return { width: 1 }; } },
      { get: function (t, k) { return k in t ? t[k] : function () {}; }, set: function () { return true; } });
  }, addEventListener: function () {}, body: {} }; }, readyState: 'loading', getElementById: function () { return null; }, addEventListener: function () {} };
  global.matchMedia = function () { return { matches: false }; };
  const quiet = console.log; console.log = function () {};
  try {
    ['tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'environmental-inspect.js', 'retro-font.js', 'portraits.js',
     'gold-tone.js', 'engine.js', 'glue.js', 'location-connections.js', 'world-connections.gen.js', 'world-engine.js',
     'double-r-exterior-art.js', 'double-r-exterior-scene.js', 'double-r-location-production.js',
     'sheriffs-station-art.js', 'sheriffs-station-exterior-art.js', 'sheriffs-station-scene.js', 'sheriffs-station-exterior-scene.js', 'sheriffs-station-production.js',
     'room-315-art.js', 'room-315-scene.js', 'room-315-production.js', 'hospital-art.js', 'hospital-scene.js', 'hospital-production.js',
     'traincar-art.js', 'traincar-scene.js', 'traincar-location-production.js'
    ].forEach(function (f) { try { require(path.join(REPO, 'js', f)); } catch (e) { /* scene installers needing audio */ } });
  } finally { console.log = quiet; }
  const G = global.GAME;
  if (!G || !G.Maps || !G.LocationConnections || typeof G.LocationConnections.validateConnection !== 'function') {
    throw new Error('could not load GAME.Maps + LocationConnections');
  }
  return G;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = path.join(args.root, TARGET_REL);
  if (!fs.existsSync(target)) usage('no ' + TARGET_REL + ' under ' + args.root);

  let changeset;
  try { changeset = JSON.parse(fs.readFileSync(args.file, 'utf8')); }
  catch (e) { usage('cannot read changeset: ' + e.message); }
  if (changeset && changeset.target !== undefined && changeset.target !== TARGET_REL) {
    console.error('world-apply: REFUSED — changeset target ' + JSON.stringify(changeset.target) + ' is not ' + TARGET_REL + '; this tool writes nothing else');
    process.exit(2);
  }

  const sourceText = fs.readFileSync(target, 'utf8');
  const registry = JSON.parse(sourceText);
  if (!registry || !Array.isArray(registry.connections)) usage(TARGET_REL + ' has no connections[]');

  let draft;
  try { draft = Edit.reapply(registry.connections, changeset); }
  catch (e) { console.error('world-apply: REFUSED — ' + e.message); process.exit(2); }

  const before = {};
  registry.connections.forEach(function (c) { before[c.id] = c; });
  const nextConnections = registry.connections.filter(function (c) { return !!draft[c.id]; })
    .map(function (c) { return JSON.parse(JSON.stringify(draft[c.id])); });

  // print per changed endpoint
  let changes = 0;
  changeset.operations.forEach(function (op) {
    const id = op.id !== undefined ? op.id : op.connection && op.connection.id;
    ['a', 'b'].forEach(function (side) {
      const b = before[id] ? before[id][side] : null;
      const a = draft[id] ? draft[id][side] : null;
      if (Edit.canonical(b) === Edit.canonical(a)) return;
      changes++;
      console.log('TARGET ' + TARGET_REL + ' :: ' + id);
      console.log('BEFORE ' + JSON.stringify(b));
      console.log('AFTER  ' + JSON.stringify(a));
    });
  });

  // validate every record against the real maps
  const G = loadWorld();
  let invalid = 0;
  nextConnections.forEach(function (rec) {
    const res = G.LocationConnections.validateConnection(rec, G.Maps);
    if (!res.valid) {
      invalid++;
      res.errors.forEach(function (e) { console.error('INVALID ' + rec.id + ': ' + e); });
    }
  });
  if (invalid) {
    console.error('world-apply: ' + invalid + ' invalid record(s); nothing written');
    process.exit(1);
  }
  console.log('VALID ' + nextConnections.length + ' record(s) against real maps');

  const nextText = JSON.stringify({ version: registry.version, connections: nextConnections }, null, 2) + '\n';
  if (changes === 0 || nextText === sourceText) {
    console.log('NO-OP ' + TARGET_REL + ' already matches the changeset');
    return;
  }
  if (args.dryRun) {
    console.log('DRY-RUN ' + changes + ' endpoint change(s); nothing written');
    return;
  }
  const tmp = target + '.tmp-' + process.pid;
  fs.writeFileSync(tmp, nextText);
  fs.renameSync(tmp, target);
  console.log('WROTE ' + TARGET_REL + ' (' + changes + ' endpoint change(s))');
  execFileSync(process.execPath, [path.join(args.root, 'test', 'gen-world-data.js')], { stdio: 'inherit' });
}

main();
