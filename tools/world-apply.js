#!/usr/bin/env node
'use strict';

/* tools/world-apply.js — apply a World Builder export: connection changeset, cast changeset, or a bundle of both.
 *
 *   node tools/world-apply.js <changeset.json> [--dry-run] [--repin] [--root=<repo root>]
 *
 * The file holds one of (js/editor/core/cast.js splitChangesets):
 *   - a world-connections-changeset (target world/connections.json), versions 1 and 2, below;
 *   - a cast-windows-changeset (target narrative/cast/windows.json, M7), see CAST below;
 *   - { format: 'world-builder-bundle', version: 1, changesets: [...] } with at most one changeset per target.
 * Every part is validated before anything is written; the write is atomic across every file of every part.
 *
 * CONNECTIONS
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
 * CAST (M7): only map_id / x / y / dir of a PLACED body in an existing window or baseline (op "place").
 *   1. apply STRICTLY (Editor.cast.applyCastChangeset): unknown window/character, non-PLACED body, unknown field,
 *      second op on one body, bad tile or facing exits 2
 *   2. boot <root>/js plus the narrative runtime, data and GAME.CastPresence (as test/cast-continuity-validate.js);
 *      the target tile must exist, be walkable (GAME.Maps.isSolid with no clues), not be a door trigger tile (a
 *      legacy map door or a trigger of the resulting registry), and not be occupied by another PLACED body on any
 *      pin story moment where the moved body resolves through the edited window
 *   3. a body placed elsewhere by another window with the same `when` refuses the move (V2 overlap)
 *   4. V6 transitions (test/fixtures/cast-transitions-acts-1-4.json) resolved against the new data: any
 *      disagreement fails the run; transitions are never repinned
 *   5. V5 pins (test/fixtures/cast-pins-acts-1-4.json): a disagreement fails the run and prints the exact pin lines.
 *      --repin rewrites exactly those (pin, character) entries, keeping each pin's form, and appends one line per
 *      moved body to artifacts/world-character-audit/cast-windows-acts-1-4.md under "## Builder change record".
 *      A pin that disagrees for a character the changeset did not move is never repinned.
 * Writes narrative/cast/windows.json (2-space JSON, only the four fields change), runs test/gen-narrative-data.js,
 * writes the pins fixture and the audit record when repinning, then runs test/cast-continuity-validate.js.
 *
 * Any failure after the first write restores every written file (registry, gen, catalog, windows.json,
 * narrative-data.gen.js, pins fixture, audit record) from the pre-run bytes and exits 1.
 *
 * Exit codes: 0 ok / no-op, 1 validation failed, refused delete, pin/transition disagreement, or rolled back,
 * 2 usage or refused changeset.
 * --root: a repo copy (test/world-apply.js, test/world-builder-browser.js); every file is read from that root.
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO = path.resolve(__dirname, '..');
const TARGET_REL = 'world/connections.json';
const CATALOG_REL = 'js/world-catalog.js';
const GEN_REL = 'js/world-connections.gen.js';
const CAST_REL = 'narrative/cast/windows.json';
const NARRATIVE_GEN_REL = 'js/narrative-data.gen.js';
const PINS_REL = 'test/fixtures/cast-pins-acts-1-4.json';
const TRANSITIONS_REL = 'test/fixtures/cast-transitions-acts-1-4.json';
const AUDIT_REL = 'artifacts/world-character-audit/cast-windows-acts-1-4.md';
const Edit = require(path.join(REPO, 'js', 'editor', 'core', 'edit.js'));
const Cast = require(path.join(REPO, 'js', 'editor', 'core', 'cast.js'));
const CatalogWrite = require(path.join(REPO, 'js', 'editor', 'apply', 'catalog-write.js'));
const CastWrite = require(path.join(REPO, 'js', 'editor', 'apply', 'cast-write.js'));

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
// test/cast-continuity-validate.js order after the world chain: runtime, data, bootstrap, resolver.
const NARRATIVE_CHAIN = ['narrative-runtime.js', 'narrative-data.gen.js', 'narrative-bootstrap.js', 'cast-presence.js'];
const REFERENCE_DIRS = ['js', 'test', 'narrative'];
const REFERENCE_EXEMPT = [CATALOG_REL, GEN_REL];

function usage(msg) {
  if (msg) console.error('world-apply: ' + msg);
  console.error('usage: node tools/world-apply.js <changeset.json> [--dry-run] [--repin] [--root=<dir>]');
  process.exit(2);
}

function parseArgs(argv) {
  const out = { file: null, dryRun: false, repin: false, root: REPO };
  for (const a of argv) {
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--repin') out.repin = true;
    else if (a.startsWith('--root=')) out.root = path.resolve(a.slice(7));
    else if (a.startsWith('--')) usage('unknown option ' + a);
    else if (out.file) usage('only one changeset file');
    else out.file = a;
  }
  if (!out.file) usage('changeset file required');
  return out;
}

// Boot <root>/js headlessly (stubs as test/legacy-door-inventory.js) and return GAME.
function loadWorld(root, withCast) {
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
    if (withCast) NARRATIVE_CHAIN.forEach(function (f) { require(path.join(root, 'js', f)); });
  } finally { console.log = quiet[0]; console.warn = quiet[1]; }
  const G = global.GAME;
  if (withCast) {
    if (!G.CastPresence || !G.NarrativeRuntime || typeof G.installNarrativeCatalogs !== 'function') {
      throw new Error('could not boot GAME.NarrativeRuntime + GAME.CastPresence from ' + path.join(root, 'js'));
    }
    G.installNarrativeCatalogs({ data: G.NarrativeData, runtime: G.NarrativeRuntime });
  }
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

class Refused extends Error {}

// ---- connections part: M4b/M5/M6 behaviour, unchanged output --------------------------------------------------
function planConnections(args, changeset, boot, problems) {
  const target = path.join(args.root, TARGET_REL);
  for (const rel of [TARGET_REL, CATALOG_REL, GEN_REL, 'test/gen-world-data.js', 'test/world-engine-v0.1-catalog.js']) {
    if (!fs.existsSync(path.join(args.root, rel))) usage('no ' + rel + ' under ' + args.root);
  }
  const sourceText = fs.readFileSync(target, 'utf8');
  const catalogPath = path.join(args.root, CATALOG_REL);
  const catalogText = fs.readFileSync(catalogPath, 'utf8');
  const registry = JSON.parse(sourceText);
  if (!registry || !Array.isArray(registry.connections)) usage(TARGET_REL + ' has no connections[]');

  let draft;
  try { draft = Edit.reapply(registry.connections, changeset); }
  catch (e) { throw new Refused(e.message); }
  const G = boot(); // a refused changeset never pays for the boot

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

  const nextText = JSON.stringify({ version: registry.version, connections: nextConnections }, null, 2) + '\n';
  return {
    nextConnections: nextConnections,
    noop: changes === 0 || nextText === sourceText,
    report: function () {
      console.log('VALID ' + nextConnections.length + ' record(s) against real maps');
      if (catalogPlan.changed) {
        console.log('CATALOG ' + CATALOG_REL + ' ' + catalogPlan.touched.map(function (t) { return t.op + ' ' + t.id + ' -> ' + t.locations.join(' + '); }).join(', '));
        CatalogWrite.diffLines(catalogText, catalogPlan.text).forEach(function (l) { console.log('  ' + l); });
      } else {
        console.log('CATALOG ' + CATALOG_REL + ' unchanged');
      }
    },
    noopLine: 'NO-OP ' + TARGET_REL + ' already matches the changeset',
    dryLine: 'DRY-RUN ' + changes + ' endpoint change(s); nothing written',
    files: [TARGET_REL, GEN_REL, CATALOG_REL],
    write: function (run) {
      writeAtomic(target, nextText);
      console.log('WROTE ' + TARGET_REL + ' (' + changes + ' endpoint change(s))');
      console.log(run('test/gen-world-data.js').trim().split('\n').pop());
      if (catalogPlan.changed) {
        writeAtomic(catalogPath, catalogPlan.text);
        console.log('WROTE ' + CATALOG_REL);
      }
      console.log('CHECK ' + run('test/world-engine-v0.1-catalog.js').trim().split('\n').pop());
    }
  };
}

// ---- cast part (M7) ----------------------------------------------------------------------------------------
function stateFromSeed(G, seed) {
  const s = G.NarrativeRuntime.createState();
  Object.assign(s.flags, seed.flags || {});
  Object.assign(s.values, seed.values || {});
  Object.assign(s.evidence, seed.evidence || {});
  Object.assign(s.nodes_done, seed.nodes_done || {});
  if (seed.props) s.props = JSON.parse(JSON.stringify(seed.props));
  return s;
}

function planCast(args, changeset, G, finalConnections, problems) {
  for (const rel of [CAST_REL, NARRATIVE_GEN_REL, PINS_REL, TRANSITIONS_REL, 'test/gen-narrative-data.js', 'test/cast-continuity-validate.js']) {
    if (!fs.existsSync(path.join(args.root, rel))) usage('no ' + rel + ' under ' + args.root);
  }
  const castPath = path.join(args.root, CAST_REL);
  const castText = fs.readFileSync(castPath, 'utf8');
  const castData = JSON.parse(castText);
  if (JSON.stringify(castData, null, 2) + '\n' !== castText) usage(CAST_REL + ' is not canonical 2-space JSON; refusing to rewrite it');
  let applied;
  try { applied = Cast.applyCastChangeset(castData, changeset); }
  catch (e) { throw new Refused(e.message); }

  const live = applied.changes.filter(function (c) { return Edit.canonical(c.before) !== Edit.canonical(c.after); });
  applied.changes.forEach(function (c) {
    console.log('TARGET ' + CAST_REL + ' :: ' + c.window + ' / ' + c.character + (c.owner ? ' (owner ' + c.owner + ')' : ''));
    console.log('BEFORE ' + JSON.stringify(c.before));
    console.log('AFTER  ' + JSON.stringify(c.after));
  });
  const nextCastText = JSON.stringify(applied.data, null, 2) + '\n';
  if (nextCastText !== castText) {
    console.log('DIFF ' + CAST_REL);
    CatalogWrite.diffLines(castText, nextCastText).forEach(function (l) { console.log('  ' + l); });
  }

  // tiles: walkable, not a door trigger, not claimed by the same window's `when` twin
  const triggerAt = {};
  finalConnections.forEach(function (rec) {
    ['a', 'b'].forEach(function (s) { (rec[s].triggers || []).forEach(function (t) { triggerAt[rec[s].scene + ' ' + t[0] + ',' + t[1]] = rec.id; }); });
  });
  const tctx = {
    sceneExists: function (m) { const map = G.Maps[m]; return !!(map && typeof map.width === 'number'); },
    isWalkable: function (m, x, y) { return !G.Maps.isSolid(m, x, y, { clues: [] }); },
    doorAt: function (m, x, y) {
      if (triggerAt[m + ' ' + x + ',' + y]) return 'trigger of ' + triggerAt[m + ' ' + x + ',' + y];
      const d = G.Maps[m].doors && G.Maps[m].doors[x + ',' + y];
      return d && !d.connectionId ? 'legacy map door' : null;
    }
  };
  live.forEach(function (c) {
    Cast.placementErrors(tctx, c.after, []).forEach(function (e) { problems.push('INVALID ' + c.window + ' / ' + c.character + ': ' + e); });
    const twins = Cast.sameWhenConflicts(castData, c.window, c.character);
    if (twins.length) problems.push('INVALID ' + c.window + ' / ' + c.character + ': placed elsewhere under the same `when` by ' + twins.join(', ') + ' (V2 overlap)');
  });

  const pinsPath = path.join(args.root, PINS_REL);
  const pinsText = fs.readFileSync(pinsPath, 'utf8');
  const ctx = {
    cp: G.CastPresence, data: applied.data, stateFromSeed: function (seed) { return stateFromSeed(G, seed); },
    pins: JSON.parse(pinsText), transitions: JSON.parse(fs.readFileSync(path.join(args.root, TRANSITIONS_REL), 'utf8')),
    moved: {}
  };
  live.forEach(function (c) { ctx.moved[c.character] = true; });
  let pinPlan = { repins: [], unrelated: [] }, lines = {};
  try {
    CastWrite.occupancy(ctx, live).forEach(function (e) { problems.push('INVALID ' + e); });
    CastWrite.planTransitions(ctx).forEach(function (t) {
      problems.push('TRANSITION ' + TRANSITIONS_REL + ' ' + t.id + ' character=' + t.character + ' ' + t.side + ' (' + t.seed + ') expected=' + t.expected + ' got=' + t.got + ' — transitions are never repinned');
    });
    pinPlan = CastWrite.planPins(ctx);
    lines = CastWrite.pinLines(pinsText);
  } catch (e) { problems.push('CAST ' + (e.code ? e.code + ' ' : '') + e.message); }
  pinPlan.unrelated.forEach(function (u) {
    problems.push('PIN ' + PINS_REL + ' ' + u.pin + ' character=' + u.character + ' expected=' + u.expected + ' got=' + u.got + ' — not caused by this changeset, never repinned');
  });
  const pinLine = function (r) {
    const at = lines[r.pin + '/' + r.character];
    return PINS_REL + ':' + (at ? at.line : '?') + '  ' + (at ? at.text.trim() : '') + '  ->  "' + r.next + '"  (' + r.pin + ', resolves ' + r.got + ')';
  };
  if (pinPlan.repins.length && !args.repin) {
    pinPlan.repins.forEach(function (r) { problems.push('PIN ' + pinLine(r)); });
    problems.push('PINS ' + pinPlan.repins.length + ' V5 pin entr' + (pinPlan.repins.length === 1 ? 'y disagrees' : 'ies disagree') + ' with the new placement; rerun with --repin to update exactly these entries');
  }

  const date = new Date().toISOString().slice(0, 10);
  const auditLines = live.map(function (c) { return CastWrite.auditLine(date, c, pinPlan.repins, path.basename(args.file)); });
  const repinning = args.repin && pinPlan.repins.length > 0;
  return {
    noop: nextCastText === castText,
    report: function () {
      console.log('VALID ' + live.length + ' cast placement(s): walkable, no door tile, unoccupied; V6 transitions agree');
      if (!pinPlan.repins.length) console.log('PINS ' + PINS_REL + ' agree');
      else if (args.repin) pinPlan.repins.forEach(function (r) { console.log('REPIN ' + pinLine(r)); });
      if (repinning) auditLines.forEach(function (l) { console.log('AUDIT ' + AUDIT_REL + ' ' + l); });
    },
    noopLine: 'NO-OP ' + CAST_REL + ' already matches the changeset',
    dryLine: 'DRY-RUN ' + live.length + ' cast placement change(s)' + (repinning ? ', ' + pinPlan.repins.length + ' repin(s)' : '') + '; nothing written',
    files: [CAST_REL, NARRATIVE_GEN_REL].concat(repinning ? [PINS_REL, AUDIT_REL] : []),
    write: function (run) {
      writeAtomic(castPath, nextCastText);
      console.log('WROTE ' + CAST_REL + ' (' + live.length + ' placement change(s))');
      console.log(run('test/gen-narrative-data.js').trim().split('\n').pop());
      if (repinning) {
        const auditPath = path.join(args.root, AUDIT_REL);
        if (!fs.existsSync(auditPath)) throw new Error('no ' + AUDIT_REL + ' under ' + args.root + ' for the change record');
        writeAtomic(pinsPath, CastWrite.repinText(pinsText, pinPlan.repins));
        console.log('WROTE ' + PINS_REL + ' (' + pinPlan.repins.length + ' repinned entr' + (pinPlan.repins.length === 1 ? 'y' : 'ies') + ')');
        writeAtomic(auditPath, CastWrite.auditAppend(fs.readFileSync(auditPath, 'utf8'), auditLines));
        console.log('WROTE ' + AUDIT_REL + ' (' + auditLines.length + ' change record line(s))');
      }
      const out = run('test/cast-continuity-validate.js');
      console.log('CHECK ' + out.trim().split('\n').pop());
    }
  };
}

function writeAtomic(file, text) {
  const tmp = file + '.tmp-' + process.pid;
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, file);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  let parsed;
  try { parsed = JSON.parse(fs.readFileSync(args.file, 'utf8')); }
  catch (e) { usage('cannot read changeset: ' + e.message); }
  let parts;
  try { parts = Cast.splitChangesets(parsed); }
  catch (e) {
    console.error('world-apply: REFUSED — ' + e.message.replace(/^\[cast\] /, '') + '; this tool writes nothing else');
    process.exit(2);
  }
  const conn = parts.find(function (p) { return p.target === TARGET_REL; });
  const cast = parts.find(function (p) { return p.target === CAST_REL; });

  const problems = [];
  const planned = [];
  try {
    let G = null;
    const boot = function () { return G || (G = loadWorld(args.root, !!cast)); };
    let connPlan = null;
    if (conn) {
      connPlan = planConnections(args, conn.changeset, boot, problems);
      planned.push(connPlan);
    }
    if (cast) {
      const finalConnections = connPlan ? connPlan.nextConnections : JSON.parse(fs.readFileSync(path.join(args.root, TARGET_REL), 'utf8')).connections;
      planned.push(planCast(args, cast.changeset, boot(), finalConnections, problems));
    }
  } catch (e) {
    if (e instanceof Refused) { console.error('world-apply: REFUSED — ' + e.message); process.exit(2); }
    throw e;
  }

  if (problems.length) {
    problems.forEach(function (p) { console.error(p); });
    console.error('world-apply: ' + problems.length + ' problem(s); nothing written');
    process.exit(1);
  }
  planned.forEach(function (p) { p.report(); });
  const live = planned.filter(function (p) { return !p.noop; });
  planned.filter(function (p) { return p.noop; }).forEach(function (p) { console.log(p.noopLine); });
  if (!live.length) return;
  if (args.dryRun) {
    live.forEach(function (p) { console.log(p.dryLine); });
    return;
  }

  const rels = [];
  live.forEach(function (p) { p.files.forEach(function (rel) { if (rels.indexOf(rel) === -1) rels.push(rel); }); });
  const saved = rels.map(function (rel) { const f = path.join(args.root, rel); return [f, fs.readFileSync(f)]; });
  function run(rel) {
    const r = spawnSync(process.execPath, [path.join(args.root, rel)], { cwd: args.root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (r.status !== 0) {
      const all = String((r.stdout || '') + (r.stderr || '')).trim().split('\n');
      const failing = all.filter(function (l) { return /FAIL|expected=|Error/.test(l); }).slice(0, 30);
      throw new Error(rel + ' exited ' + r.status + '\n' + (failing.length ? failing : all.slice(-15)).join('\n'));
    }
    return r.stdout;
  }
  try {
    live.forEach(function (p) { p.write(run); });
  } catch (e) {
    saved.forEach(function (pair) { fs.writeFileSync(pair[0], pair[1]); });
    const restored = saved.every(function (pair) { return fs.readFileSync(pair[0]).equals(pair[1]); });
    console.error('world-apply: FAILED — ' + e.message);
    console.error('world-apply: ROLLED BACK ' + rels.join(', ') + (restored ? ' (byte-identical to the pre-run copy)' : ' — RESTORE MISMATCH, inspect by hand'));
    process.exit(1);
  }
}

main();
