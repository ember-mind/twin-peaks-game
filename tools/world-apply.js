#!/usr/bin/env node
'use strict';

/* tools/world-apply.js — apply a World Builder changeset to the connection registry AND the catalog.
 *
 *   node tools/world-apply.js <changeset.json> [--dry-run] [--root=<repo root>]
 *
 * Changeset version 1 (upsert / remove) and version 2 (upsert / create / delete) are accepted; see
 * js/editor/core/edit.js for the schema. Everything is validated before anything is written:
 *   1. reapply STRICTLY (Editor.edit.reapply): unknown id, create of an existing id, two ops on one id, an op
 *      not allowed at the changeset version, an unknown endpoint, or a foreign target exits 2
 *   2. boot <root>/js (the index.html map + installer chain) and validate EVERY resulting record with
 *      GAME.LocationConnections.validateConnection; a trigger tile claimed by two records is an error
 *   3. create/delete/upsert/remove: no trigger tile of a touched record may hold a legacy map door (a booted
 *      door descriptor without a connectionId); there are none after M5, the guard stays
 *   4. delete/remove: the id must not be referenced by any file under <root>/js, <root>/test, <root>/narrative
 *      other than js/world-catalog.js and the generated js/world-connections.gen.js; the files are listed
 *   5. catalog plan (js/editor/apply/catalog-write.js): create adds the id to both endpoint locations, delete
 *      removes it from both; a scene with no catalog location fails with the location list
 * Prints, per changed endpoint, TARGET/BEFORE/AFTER lines, then VALID <n> record(s), then the catalog diff.
 *
 * Without --dry-run the write is atomic across three files: world/connections.json is written, gen-world-data
 * regenerates js/world-connections.gen.js, js/world-catalog.js is written, then test/world-engine-v0.1-catalog.js
 * runs in <root>. Any failure restores all three files from the pre-run bytes and exits 1.
 *
 * Exit codes: 0 ok / no-op, 1 validation failed, refused delete, or rolled back, 2 usage or refused changeset.
 * --root: a repo copy (test/world-apply.js, test/world-builder-browser.js); every file is read from that root.
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO = path.resolve(__dirname, '..');
const TARGET_REL = 'world/connections.json';
const CATALOG_REL = 'js/world-catalog.js';
const GEN_REL = 'js/world-connections.gen.js';
const Edit = require(path.join(REPO, 'js', 'editor', 'core', 'edit.js'));
const CatalogWrite = require(path.join(REPO, 'js', 'editor', 'apply', 'catalog-write.js'));

// index.html order (test/legacy-door-inventory.js): every file must load; a skipped installer would hide doors.
const CHAIN = ['tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'environmental-inspect.js', 'retro-font.js',
  'portraits.js', 'gold-tone.js', 'engine.js', 'glue.js', 'environment-reactions.js', 'location-connections.js',
  'world-connections.gen.js',
  'double-r-exterior-art.js', 'double-r-exterior-scene.js', 'double-r-location-production.js',
  'sheriffs-station-art.js', 'sheriffs-station-exterior-art.js', 'sheriffs-station-scene.js',
  'sheriffs-station-exterior-scene.js', 'sheriffs-station-production.js',
  'room-315-art.js', 'room-315-scene.js', 'room-315-production.js',
  'hospital-art.js', 'hospital-scene.js', 'hospital-production.js',
  'traincar-art.js', 'traincar-scene.js', 'traincar-production.js',
  'world-connections-production.js'];
const REFERENCE_DIRS = ['js', 'test', 'narrative'];
const REFERENCE_EXEMPT = [CATALOG_REL, GEN_REL];

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

// Boot <root>/js headlessly (stubs as test/legacy-door-inventory.js) and return GAME.
function loadWorld(root) {
  global.window = global;
  global.addEventListener = function () {};
  global.requestAnimationFrame = function () {};
  global.performance = { now: function () { return 0; } };
  function element() {
    const el = { style: {}, addEventListener() {}, appendChild() {},
      getBoundingClientRect() { return { width: 320, height: 240, top: 0, left: 0 }; } };
    el.getContext = function () {
      return new Proxy({ measureText(s) { return { width: String(s).length * 6 }; } },
        { get(t, k) { return k in t ? t[k] : function () {}; }, set() { return true; } });
    };
    return el;
  }
  global.document = { createElement: element, createElementNS() { return { setAttribute() {}, style: {} }; },
    body: { style: {}, appendChild() {} }, head: { appendChild() {} },
    readyState: 'loading', getElementById() { return null; }, addEventListener() {} };
  global.matchMedia = function () { return { matches: false, addEventListener() {} }; };
  const quiet = [console.log, console.warn];
  console.log = function () {}; console.warn = function () {};
  try {
    CHAIN.forEach(function (f) { require(path.join(root, 'js', f)); });
  } finally { console.log = quiet[0]; console.warn = quiet[1]; }
  const G = global.GAME;
  if (!G || !G.Maps || !G.LocationConnections || typeof G.LocationConnections.validateConnection !== 'function' || !G.WorldConnections) {
    throw new Error('could not boot GAME.Maps + LocationConnections + registry doors from ' + path.join(root, 'js'));
  }
  return G;
}

function walk(dir, out) {
  if (!fs.existsSync(dir)) throw new Error('reference scan: ' + dir + ' does not exist');
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.isFile()) out.push(p);
  }
  return out;
}

// Files under js/ test/ narrative/ that mention `id` as a whole token (not as a prefix of a longer id).
function referencesTo(root, id) {
  const re = new RegExp('(^|[^A-Za-z0-9_-])' + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Za-z0-9_-])');
  const hits = [];
  REFERENCE_DIRS.forEach(function (d) {
    walk(path.join(root, d), []).forEach(function (file) {
      const rel = path.relative(root, file).split(path.sep).join('/');
      if (REFERENCE_EXEMPT.indexOf(rel) !== -1) return;
      if (re.test(fs.readFileSync(file, 'utf8'))) hits.push(rel);
    });
  });
  return hits.sort();
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = path.join(args.root, TARGET_REL);
  for (const rel of [TARGET_REL, CATALOG_REL, GEN_REL, 'test/gen-world-data.js', 'test/world-engine-v0.1-catalog.js']) {
    if (!fs.existsSync(path.join(args.root, rel))) usage('no ' + rel + ' under ' + args.root);
  }

  let changeset;
  try { changeset = JSON.parse(fs.readFileSync(args.file, 'utf8')); }
  catch (e) { usage('cannot read changeset: ' + e.message); }
  if (changeset && changeset.target !== undefined && changeset.target !== TARGET_REL) {
    console.error('world-apply: REFUSED — changeset target ' + JSON.stringify(changeset.target) + ' is not ' + TARGET_REL + '; this tool writes nothing else');
    process.exit(2);
  }

  const sourceText = fs.readFileSync(target, 'utf8');
  const catalogPath = path.join(args.root, CATALOG_REL);
  const catalogText = fs.readFileSync(catalogPath, 'utf8');
  const registry = JSON.parse(sourceText);
  if (!registry || !Array.isArray(registry.connections)) usage(TARGET_REL + ' has no connections[]');

  let draft;
  try { draft = Edit.reapply(registry.connections, changeset); }
  catch (e) { console.error('world-apply: REFUSED — ' + e.message); process.exit(2); }

  const before = {};
  registry.connections.forEach(function (c) { before[c.id] = c; });
  const ops = changeset.operations.map(function (op) {
    const id = op.id !== undefined ? op.id : op.connection && op.connection.id;
    const kind = op.op === 'remove' ? 'delete' : op.op;
    return { kind: kind, id: id };
  });
  // registry order kept; created records appended in changeset order
  const nextConnections = registry.connections.filter(function (c) { return !!draft[c.id]; })
    .map(function (c) { return JSON.parse(JSON.stringify(draft[c.id])); })
    .concat(ops.filter(function (o) { return o.kind === 'create'; }).map(function (o) { return JSON.parse(JSON.stringify(draft[o.id])); }));

  let changes = 0;
  ops.forEach(function (o) {
    if (o.kind === 'create') console.log('CREATE ' + o.id + (draft[o.id].one_way === true ? ' (one-way)' : ' (paired)'));
    if (o.kind === 'delete') console.log('DELETE ' + o.id);
    ['a', 'b'].forEach(function (side) {
      const b = before[o.id] ? before[o.id][side] : null;
      const a = draft[o.id] ? draft[o.id][side] : null;
      if (Edit.canonical(b) === Edit.canonical(a)) return;
      changes++;
      console.log('TARGET ' + TARGET_REL + ' :: ' + o.id);
      console.log('BEFORE ' + JSON.stringify(b));
      console.log('AFTER  ' + JSON.stringify(a));
    });
  });

  const problems = [];
  const G = loadWorld(args.root);
  nextConnections.forEach(function (rec) {
    const res = G.LocationConnections.validateConnection(rec, G.Maps);
    res.errors.forEach(function (e) { problems.push('INVALID ' + rec.id + ': ' + e); });
  });
  Edit.claimConflicts(nextConnections).forEach(function (e) { problems.push('INVALID ' + e); });

  ops.forEach(function (o) {
    const rec = o.kind === 'delete' ? before[o.id] : draft[o.id];
    ['a', 'b'].forEach(function (side) {
      const ep = rec[side], map = G.Maps[ep.scene];
      (ep.triggers || []).forEach(function (t, i) {
        const door = map && map.doors && map.doors[t[0] + ',' + t[1]];
        if (door && !door.connectionId) problems.push('INVALID ' + o.id + ': ' + side + '.triggers[' + i + '] ' + ep.scene + ' ' + t[0] + ',' + t[1] + ' holds a legacy map door');
      });
    });
    if (o.kind === 'delete') {
      const refs = referencesTo(args.root, o.id);
      if (refs.length) problems.push('REFUSED delete ' + o.id + ': referenced by ' + refs.length + ' file(s) outside ' + TARGET_REL + ' and ' + CATALOG_REL + ':\n    ' + refs.join('\n    '));
    }
  });

  let catalogPlan = null;
  try {
    catalogPlan = CatalogWrite.planCatalog(catalogText, ops.filter(function (o) { return o.kind === 'create' || o.kind === 'delete'; })
      .map(function (o) { return { op: o.kind, record: o.kind === 'delete' ? before[o.id] : draft[o.id] }; }));
  } catch (e) { problems.push('CATALOG ' + e.message); }

  if (problems.length) {
    problems.forEach(function (p) { console.error(p); });
    console.error('world-apply: ' + problems.length + ' problem(s); nothing written');
    process.exit(1);
  }
  console.log('VALID ' + nextConnections.length + ' record(s) against real maps');
  if (catalogPlan.changed) {
    console.log('CATALOG ' + CATALOG_REL + ' ' + catalogPlan.touched.map(function (t) { return t.op + ' ' + t.id + ' -> ' + t.locations.join(' + '); }).join(', '));
    CatalogWrite.diffLines(catalogText, catalogPlan.text).forEach(function (l) { console.log('  ' + l); });
  } else {
    console.log('CATALOG ' + CATALOG_REL + ' unchanged');
  }

  const nextText = JSON.stringify({ version: registry.version, connections: nextConnections }, null, 2) + '\n';
  if (changes === 0 || nextText === sourceText) {
    console.log('NO-OP ' + TARGET_REL + ' already matches the changeset');
    return;
  }
  if (args.dryRun) {
    console.log('DRY-RUN ' + changes + ' endpoint change(s); nothing written');
    return;
  }

  const genPath = path.join(args.root, GEN_REL);
  const saved = [[target, fs.readFileSync(target)], [genPath, fs.readFileSync(genPath)], [catalogPath, fs.readFileSync(catalogPath)]];
  function writeAtomic(file, text) {
    const tmp = file + '.tmp-' + process.pid;
    fs.writeFileSync(tmp, text);
    fs.renameSync(tmp, file);
  }
  function run(rel) {
    const r = spawnSync(process.execPath, [path.join(args.root, rel)], { cwd: args.root, encoding: 'utf8' });
    if (r.status !== 0) throw new Error(rel + ' exited ' + r.status + '\n' + String((r.stdout || '') + (r.stderr || '')).trim().split('\n').slice(-15).join('\n'));
    return r.stdout;
  }
  try {
    writeAtomic(target, nextText);
    console.log('WROTE ' + TARGET_REL + ' (' + changes + ' endpoint change(s))');
    const gen = run('test/gen-world-data.js');
    console.log(gen.trim().split('\n').pop());
    if (catalogPlan.changed) {
      writeAtomic(catalogPath, catalogPlan.text);
      console.log('WROTE ' + CATALOG_REL);
    }
    const cat = run('test/world-engine-v0.1-catalog.js');
    console.log('CHECK ' + cat.trim().split('\n').pop());
  } catch (e) {
    saved.forEach(function (pair) { fs.writeFileSync(pair[0], pair[1]); });
    const restored = saved.every(function (pair) { return fs.readFileSync(pair[0]).equals(pair[1]); });
    console.error('world-apply: FAILED — ' + e.message);
    console.error('world-apply: ROLLED BACK ' + [TARGET_REL, GEN_REL, CATALOG_REL].join(', ') + (restored ? ' (byte-identical to the pre-run copy)' : ' — RESTORE MISMATCH, inspect by hand'));
    process.exit(1);
  }
}

main();
