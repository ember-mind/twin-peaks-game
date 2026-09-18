#!/usr/bin/env node
'use strict';

/* tools/world-apply.js — apply a World Builder export: connection changeset, cast changeset, or a bundle of both.
 *
 *   node tools/world-apply.js <changeset.json> [--dry-run] [--repin] [--root=<repo root>]
 *   node tools/world-apply.js --gen-props [--root=<repo root>]     regenerate js/props.gen.js only
 *
 * The file holds one of (js/editor/core/cast.js splitChangesets):
 *   - a world-connections-changeset (target world/connections.json), versions 1 and 2, below;
 *   - a cast-windows-changeset (target narrative/cast/windows.json, M7), see CAST below;
 *   - a scene-objects-changeset (target world/scene-objects.json, M8), see SCENE OBJECTS below;
 *   - a props-changeset (target world/props.json, M9), see PROPS below;
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
 * SCENE OBJECTS (M8): world/scene-objects.json entries (js/editor/core/scene-objects.js for the schema).
 *   1. apply STRICTLY (Editor.sceneObjects.applyObjectsChangeset): unknown scene or entry, create of an existing
 *      entry, two ops on one entry, an upsert changing anything but x/y/w/h, an interact key collision exits 2
 *   2. boot <root>/js; every touched entry must fit its map, bind existing dialogue ids (GAME.Data.dialogues), and a
 *      created object must be a kind already present, bound to one dialogue id; a created interact key must use a
 *      GAME.INTERACT_DLG id
 *   3. delete: refused when a mission node under <root>/narrative/missions holds the entry's dialogue id (or its
 *      interact id) as an exact string value; the nodes are listed
 * Writes world/scene-objects.json (2-space JSON), runs test/gen-world-data.js, then
 * test/scene-objects-equality.js --registry-only (glue reproduces the new registry, js/maps.js still empty), then
 * test/smoke.js and test/walkthrough.js after the write: either failing, or walkthrough's acquisition count dropping below
 * its count before the write (the project acceptance rule), rolls back. Smoke's check count is not compared: it has one
 * check per dialogue binding, so it follows the number of entries. That is the guard for entries a classic clue
 * or act gate needs: the act 1 clue sources are not mission nodes (deleting woods 14,12 olio drops 85 -> 84 acquisitions).
 *
 * PROPS (M9): world/props.json, the prop registry (definitions + instances + per-scene canvas). A props-changeset
 * (version 2) carries create / upsert / delete of INSTANCES only; definitions stay hand-edited this milestone.
 *   1. apply STRICTLY (applyPropsChangeset): unknown op, unknown/duplicate id, a second op on one id, an unknown
 *      field, an upsert that changes propId/sceneId, or a foreign target exits 2
 *   2. shape (propsShapeProblems, no game needed): missing definition, duplicate instance id (raw-text scan, since
 *      JSON.parse silently keeps the last one), frame outside the atlas (PNG IHDR, no image library), NaN or
 *      off-canvas tx/ty, a transform the definition does not allow, a layer that is not an integer 0..9.
 *      M10b: the rules themselves are js/editor/core/props.js (registryErrors / sceneErrors), so the World Builder
 *      gives the same verdicts live; only the disk reads (the atlas file, its PNG header) stay here
 *   3. world (propsWorldProblems, booted): the Roadhouse locks are hard rejects — map rows unchanged, no footprint
 *      on the south door tiles 7,9 / 8,9, none on the pay phone tile 8,5 (which stays walkable), the stage stays on
 *      row <= 2, every Cast Presence roadhouse body tile stays walkable. Footprint overlap with any other door tile,
 *      scene-objects interact tile or Cast Presence body tile WARNS
 *   4. delete: refused when the instance id is referenced under js/ test/ narrative/ (js/props.gen.js exempt)
 * Writes world/props.json (2-space JSON), regenerates js/props.gen.js (regenProps — the only path; a hand edit fails
 * test/props-registry.js), then runs test/props-registry.js and test/props-render-order.js.
 * --repin does not apply: props carry no pinned placement (Cast Presence owns pins).
 *
 * Any failure after the first write restores every written file (registry, gen, catalog, windows.json,
 * narrative-data.gen.js, pins fixture, audit record, scene-objects.json, scene-objects.gen.js) from the pre-run
 * bytes and exits 1.
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
const OBJECTS_REL = 'world/scene-objects.json';
const OBJECTS_GEN_REL = 'js/scene-objects.gen.js';
const MISSIONS_REL = 'narrative/missions';
const PROPS_REL = 'world/props.json';
const PROPS_GEN_REL = 'js/props.gen.js';
const PROPS_FORMAT = 'props-changeset';
const Edit = require(path.join(REPO, 'js', 'editor', 'core', 'edit.js'));
const Cast = require(path.join(REPO, 'js', 'editor', 'core', 'cast.js'));
const CatalogWrite = require(path.join(REPO, 'js', 'editor', 'apply', 'catalog-write.js'));
const CastWrite = require(path.join(REPO, 'js', 'editor', 'apply', 'cast-write.js'));
const SceneObjects = require(path.join(REPO, 'js', 'editor', 'core', 'scene-objects.js'));
const PropsCore = require(path.join(REPO, 'js', 'editor', 'core', 'props.js'));

// index.html order (test/legacy-door-inventory.js): every file must load; a skipped installer would hide doors.
const CHAIN = ['tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'environmental-inspect.js', 'retro-font.js',
  'portraits.js', 'gold-tone.js', 'engine.js', 'scene-objects.gen.js', 'glue.js', 'environment-reactions.js', 'location-connections.js',
  'world-connections.gen.js',
  'double-r-exterior-art.js', 'double-r-exterior-scene.js', 'double-r-location-production.js',
  'sheriffs-station-art.js', 'sheriffs-station-exterior-art.js', 'sheriffs-station-scene.js',
  'sheriffs-station-exterior-scene.js', 'sheriffs-station-production.js',
  'room-315-art.js', 'room-315-scene.js', 'room-315-production.js',
  'hospital-art.js', 'hospital-scene.js', 'hospital-production.js',
  // M9: the Roadhouse scene and the prop registry — the props target validates the Roadhouse locks against them
  'roadhouse-art.js', 'roadhouse-scene.js', 'roadhouse-production.js', 'props.gen.js', 'props-production.js',
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
  const out = { file: null, dryRun: false, repin: false, genProps: false, root: REPO };
  for (const a of argv) {
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--repin') out.repin = true;
    else if (a === '--gen-props') out.genProps = true;
    else if (a.startsWith('--root=')) out.root = path.resolve(a.slice(7));
    else if (a.startsWith('--')) usage('unknown option ' + a);
    else if (out.file) usage('only one changeset file');
    else out.file = a;
  }
  if (!out.file && !out.genProps) usage('changeset file required');
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

// ---- scene objects part (M8) ----------------------------------------------------------------------------------
function planSceneObjects(args, changeset, boot, problems) {
  for (const rel of [OBJECTS_REL, OBJECTS_GEN_REL, GEN_REL, 'test/gen-world-data.js', 'test/scene-objects-equality.js', 'test/smoke.js', 'test/walkthrough.js', MISSIONS_REL]) {
    if (!fs.existsSync(path.join(args.root, rel))) usage('no ' + rel + ' under ' + args.root);
  }
  const target = path.join(args.root, OBJECTS_REL);
  const sourceText = fs.readFileSync(target, 'utf8');
  const registry = JSON.parse(sourceText);
  if (JSON.stringify(registry, null, 2) + '\n' !== sourceText) usage(OBJECTS_REL + ' is not canonical 2-space JSON; refusing to rewrite it');
  let applied;
  try { applied = SceneObjects.applyObjectsChangeset(registry, changeset); }
  catch (e) { throw new Refused(e.message); }
  const G = boot();

  const describe = function (c) { return c.scene + (c.entry === 'object' ? ' object ' : ' interact ') + c.key; };
  applied.changes.forEach(function (c) {
    console.log((c.op === 'create' ? 'CREATE ' : c.op === 'delete' ? 'DELETE ' : 'TARGET ') + OBJECTS_REL + ' :: ' + describe(c));
    console.log('BEFORE ' + JSON.stringify(c.before));
    console.log('AFTER  ' + JSON.stringify(c.after));
  });
  const nextText = JSON.stringify(applied.data, null, 2) + '\n';
  if (nextText !== sourceText) {
    console.log('DIFF ' + OBJECTS_REL);
    CatalogWrite.diffLines(sourceText, nextText).forEach(function (l) { console.log('  ' + l); });
  }

  // validate touched entries against the booted game, with the same rules the Builder uses
  const ctx = {
    sceneSize: function (scene) { const m = G.maps.maps[scene] && G.Maps[scene]; return m ? { width: m.width, height: m.height } : null; },
    dialogueExists: function (id) { return !!(G.Data && G.Data.dialogues && G.Data.dialogues[id]); },
    interactIdKnown: function (id) { return !!(G.INTERACT_DLG && Object.prototype.hasOwnProperty.call(G.INTERACT_DLG, id)); }
  };
  const knownKinds = {};
  Object.keys(registry.scenes).forEach(function (sc) { registry.scenes[sc].objects.forEach(function (o) { if (o.kind) knownKinds[o.kind] = o.type; }); });
  const resolveInteract = function (id) { return (G.INTERACT_DLG && G.INTERACT_DLG[id]) || id; };
  applied.changes.forEach(function (c) {
    if (c.op === 'delete') return;
    if (c.entry === 'object') {
      SceneObjects.objectErrors(ctx, c.scene, c.after, { created: c.op === 'create' }).forEach(function (e) { problems.push('INVALID ' + e); });
      if (c.op === 'create' && knownKinds[c.after.kind] !== c.after.type) {
        problems.push('INVALID ' + c.scene + ' ' + c.key + ': kind/type ' + c.after.kind + '/' + c.after.type + ' is not a kind already present in ' + OBJECTS_REL);
      }
    } else {
      const xy = c.after.key.split(',');
      SceneObjects.interactErrors(ctx, c.scene, { x: +xy[0], y: +xy[1], id: c.after.id }, { created: c.op === 'create' }).forEach(function (e) { problems.push('INVALID ' + e); });
      SceneObjects.dialogueIds(resolveInteract(c.after.id)).forEach(function (id) {
        if (!ctx.dialogueExists(id)) problems.push('INVALID ' + describe(c) + ': dialogue "' + id + '" does not exist');
      });
    }
  });

  // delete guard: mission nodes under narrative/missions that hold the entry's dialogue (or interact id) as a value
  const deletes = applied.changes.filter(function (c) { return c.op === 'delete'; });
  if (deletes.length) {
    const missionsDir = path.join(args.root, MISSIONS_REL);
    const missions = fs.readdirSync(missionsDir).filter(function (f) { return /\.json$/.test(f); }).sort().map(function (f) {
      const m = JSON.parse(fs.readFileSync(path.join(missionsDir, f), 'utf8'));
      return { mission: MISSIONS_REL + '/' + f, nodes: m.nodes || [] };
    });
    deletes.forEach(function (c) {
      const ids = c.entry === 'object' ? SceneObjects.dialogueIds(c.before.dialogue) : [c.before.id].concat(SceneObjects.dialogueIds(resolveInteract(c.before.id)));
      const refs = SceneObjects.missionReferences(missions, ids);
      if (refs.length) {
        problems.push('REFUSED delete ' + describe(c) + ': referenced by ' + refs.length + ' mission node(s):\n    ' +
          refs.map(function (r) { return r.mission + ' ' + r.node + ' (' + r.id + ')'; }).join('\n    '));
      }
    });
  }

  return {
    noop: nextText === sourceText,
    report: function () { console.log('VALID ' + applied.changes.length + ' scene object change(s) against real maps and dialogues'); },
    noopLine: 'NO-OP ' + OBJECTS_REL + ' already matches the changeset',
    dryLine: 'DRY-RUN ' + applied.changes.length + ' scene object change(s); nothing written',
    files: [OBJECTS_REL, OBJECTS_GEN_REL, GEN_REL],
    write: function (run) {
      // gameplay baseline on the untouched files: the acquisition count the written registry must not drop below
      const ACQUISITIONS = /(\d+) acquisizioni/;
      const before = ACQUISITIONS.exec(run('test/walkthrough.js').trim().split('\n').pop());
      if (!before) throw new Error('test/walkthrough.js printed no acquisition count before the write');
      const acquisitionsBefore = Number(before[1]);
      writeAtomic(target, nextText);
      console.log('WROTE ' + OBJECTS_REL + ' (' + applied.changes.length + ' change(s))');
      console.log(run('test/gen-world-data.js').trim().split('\n')[0]);
      console.log('CHECK ' + run('test/scene-objects-equality.js', ['--registry-only']).trim().split('\n').pop());
      console.log('CHECK smoke ' + run('test/smoke.js').trim().split('\n').pop().trim());
      const last = run('test/walkthrough.js').trim().split('\n').pop().trim();
      const m = ACQUISITIONS.exec(last);
      if (!m || Number(m[1]) < acquisitionsBefore) throw new Error('test/walkthrough.js acquisitions dropped: ' + acquisitionsBefore + ' before, ' + (m ? m[1] : '?') + ' after (' + last + ')');
      console.log('CHECK walkthrough ' + last);
    }
  };
}

// ---- props part (M9) ------------------------------------------------------------------------------------------
// world/props.json is the prop registry: `definitions` (reusable visual sources) and `instances` (placements),
// plus `scenes` (per-scene native canvas — see the note in the file header). Instances are placed in SCENE PIXEL
// space expressed in tiles: the draw origin of an instance is
//     left = round(tx * TILE) - (flipX ? frame[2] - anchor[0] : anchor[0]) + (ox || 0)
//     top  = round(ty * TILE) - anchor[1] + (oy || 0)
// so tx/ty name the anchor point and survive a flip. Map rows stay authoritative for collision: nothing here
// writes a row, and the schema has no field that could.
// The schema constants are the core's (js/editor/core/props.js), so the tool and the Builder cannot drift apart.
const PROPS_TILE = PropsCore.TILE;
const INSTANCE_KEYS = PropsCore.INSTANCE_KEYS;
// Roadhouse locks (artifacts/art-pass-e/e3/prop-prototype/world-builder-prop-handoff.md, "Roadhouse locks").
const ROADHOUSE_LOCKS = {
  scene: 'roadhouse',
  doorTiles: [[7, 9], [8, 9]],   // south double door
  payPhone: [8, 5],
  stageProp: 'roadhouse.stage.velvet',
  stageMaxRow: 2                 // the stage stays north
};

function propsFail(msg) { throw new Refused('[props] ' + msg); }

// PNG IHDR only — no image library. Returns { width, height }.
function pngSize(file) {
  const fd = fs.openSync(file, 'r');
  const head = Buffer.alloc(24);
  let read = 0;
  try { read = fs.readSync(fd, head, 0, 24, 0); } finally { fs.closeSync(fd); }
  if (read < 24 || head.slice(0, 8).toString('hex') !== '89504e470d0a1a0a' || head.slice(12, 16).toString('ascii') !== 'IHDR') {
    throw new Error(file + ' is not a PNG (no IHDR)');
  }
  return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
}

// Duplicate JSON keys survive neither JSON.parse nor a round-trip, so the raw text is scanned for them.
function duplicateKeys(text, section) {
  const start = text.indexOf('"' + section + '": {');
  if (start === -1) return [];
  let depth = 0, i = text.indexOf('{', start), seen = {}, dup = [];
  for (; i < text.length; i++) {
    const c = text[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) break; }
    else if (c === '"' && depth === 1) {
      const end = text.indexOf('"', i + 1);
      if (end === -1) break;
      const key = text.slice(i + 1, end);
      if (text.slice(end + 1).replace(/^\s*/, '')[0] === ':') {
        if (Object.prototype.hasOwnProperty.call(seen, key)) dup.push(key);
        seen[key] = true;
      }
      i = end;
    }
  }
  return dup;
}

function requirePropsRegistry(data) {
  if (!data || typeof data !== 'object' || data.version !== 1) propsFail('registry version must be 1');
  ['scenes', 'definitions', 'instances'].forEach(function (k) {
    if (!data[k] || typeof data[k] !== 'object' || Array.isArray(data[k])) propsFail('registry.' + k + ' must be an object');
  });
}

// Shape of the registry, independent of the booted game. Pushes "<RULE> ..." strings into problems.
// M10b: every rule that needs only the registry lives in js/editor/core/props.js, so the Builder gives the same
// verdicts live. What stays here is what needs the disk: the atlas file and its PNG header.
function propsShapeProblems(root, data, problems) {
  const atlasSizes = {};
  const ctx = {
    // Read once per atlas, reported once per definition: a missing file is that definition's problem, the way it
    // was before the shape rules moved into the core.
    atlasSize: function (atlas, at) {
      if (!Object.prototype.hasOwnProperty.call(atlasSizes, atlas)) {
        const file = path.join(root, atlas);
        if (!fs.existsSync(file)) atlasSizes[atlas] = { size: null, error: '.atlas ' + atlas + ' does not exist' };
        else {
          try { atlasSizes[atlas] = { size: pngSize(file), error: null }; }
          catch (e) { atlasSizes[atlas] = { size: null, error: ': ' + e.message }; }
        }
      }
      const entry = atlasSizes[atlas];
      if (entry.error) problems.push('INVALID ' + at + entry.error);
      return entry.size;
    }
  };
  PropsCore.registryErrors(ctx, data).forEach(function (e) { problems.push('INVALID ' + e); });
}

// instanceTiles(data, id) -> the map tiles the instance's footprint claims (anchor tile + each offset)
function instanceTiles(data, id) {
  return PropsCore.instanceTiles(data.definitions[data.instances[id].propId], data.instances[id]);
}

// Rules that need the booted game: the Roadhouse locks (hard) and the overlap warnings (soft).
function propsWorldProblems(args, data, G, problems, warnings) {
  const tileKey = function (t) { return t[0] + ',' + t[1]; };
  const registry = JSON.parse(fs.readFileSync(path.join(args.root, TARGET_REL), 'utf8')).connections;
  const triggerAt = {};
  registry.forEach(function (rec) {
    ['a', 'b'].forEach(function (s) { (rec[s].triggers || []).forEach(function (t) { triggerAt[rec[s].scene + ' ' + tileKey(t)] = rec.id; }); });
  });
  const objects = JSON.parse(fs.readFileSync(path.join(args.root, OBJECTS_REL), 'utf8')).scenes;
  const bodies = {};
  (function () {
    const cast = JSON.parse(fs.readFileSync(path.join(args.root, CAST_REL), 'utf8'));
    const note = function (owner, c, b) {
      if (!b || b.status !== 'PLACED' || !b.map_id) return;
      const k = b.map_id + ' ' + b.x + ',' + b.y;
      (bodies[k] = bodies[k] || []).push(c + ' (' + owner + ')');
    };
    Object.keys(cast.characters).forEach(function (c) { note('baseline', c, cast.characters[c].baseline); });
    (cast.windows || []).forEach(function (w) { Object.keys(w.cast || {}).forEach(function (c) { note(w.id, c, w.cast[c]); }); });
  }());

  // The canvas-against-the-map rule is the core's (js/editor/core/props.js sceneErrors) with the map sizes injected;
  // the shape pass ran it without them.
  const sizeCtx = { mapSize: function (scene) {
    const map = G.Maps[scene];
    return map && Number.isInteger(map.width) ? { width: map.width, height: map.height } : null;
  } };
  Object.keys(data.scenes).forEach(function (scene) {
    PropsCore.sceneErrors(sizeCtx, scene, data.scenes[scene]).forEach(function (e) { problems.push('INVALID ' + e); });
  });

  Object.keys(data.instances).forEach(function (id) {
    const inst = data.instances[id];
    if (!data.definitions[inst.propId] || !data.scenes[inst.sceneId]) return; // already reported by the shape pass
    const map = G.Maps[inst.sceneId];
    if (!map) return;
    instanceTiles(data, id).forEach(function (t) {
      if (t[0] < 0 || t[1] < 0 || t[0] >= map.width || t[1] >= map.height) return; // art-only band below/around the rows
      const k = inst.sceneId + ' ' + tileKey(t);
      const door = map.doors && map.doors[tileKey(t)];
      if (triggerAt[k] || door) warnings.push('WARN ' + id + ': footprint tile ' + k + ' is a door tile (' + (triggerAt[k] ? 'trigger of ' + triggerAt[k] : 'legacy map door') + ')');
      if (objects[inst.sceneId] && objects[inst.sceneId].interact[tileKey(t)]) {
        warnings.push('WARN ' + id + ': footprint tile ' + k + ' is the scene-objects interact tile "' + objects[inst.sceneId].interact[tileKey(t)] + '"');
      }
      if (bodies[k]) warnings.push('WARN ' + id + ': footprint tile ' + k + ' is a Cast Presence body tile (' + bodies[k].join(', ') + ')');
    });
  });

  // ---- Roadhouse locks: hard rejects ----------------------------------------------------------------------
  const L = ROADHOUSE_LOCKS;
  const scene = G.RoadhouseScene;
  const map = G.Maps[L.scene];
  if (!scene || !map) { problems.push('INVALID roadhouse lock: GAME.RoadhouseScene did not boot'); return; }
  if ((map.rows || []).join('\n') !== scene.rows.join('\n')) problems.push('LOCK roadhouse: map rows changed (props never own collision)');
  const claimed = {};
  Object.keys(data.instances).forEach(function (id) {
    const inst = data.instances[id];
    if (inst.sceneId !== L.scene || !data.definitions[inst.propId]) return;
    instanceTiles(data, id).forEach(function (t) { (claimed[tileKey(t)] = claimed[tileKey(t)] || []).push(id); });
    if (inst.propId === L.stageProp && Math.floor(inst.ty) > L.stageMaxRow) {
      problems.push('LOCK roadhouse: ' + id + ' puts the stage on row ' + Math.floor(inst.ty) + '; the stage stays north (row <= ' + L.stageMaxRow + ')');
    }
  });
  L.doorTiles.forEach(function (t) {
    if (claimed[tileKey(t)]) problems.push('LOCK roadhouse: south door tile ' + tileKey(t) + ' is claimed by ' + claimed[tileKey(t)].join(', ') + '; the south door is unchanged');
  });
  if (claimed[tileKey(L.payPhone)]) problems.push('LOCK roadhouse: pay phone tile ' + tileKey(L.payPhone) + ' is claimed by ' + claimed[tileKey(L.payPhone)].join(', ') + '; the pay phone stays at ' + tileKey(L.payPhone));
  if (G.Maps.isSolid(L.scene, L.payPhone[0], L.payPhone[1], { clues: [] })) problems.push('LOCK roadhouse: pay phone tile ' + tileKey(L.payPhone) + ' is not walkable');
  /* The handoff's fifth lock ("every Cast Presence body tile remains walkable") is enforced by the rows check
   * above, not per tile: props own no row, so the only way a body tile could change walkability is a row edit.
   * A per-tile assert would also be wrong today — the Giant's body tile roadhouse 8,1 is the raised stage and is
   * deliberately solid (js/roadhouse-scene.js, "the stage placement is intentionally solid"). */
}

// applyPropsChangeset(data, changeset) -> { data, changes }. STRICT; instances only.
//   { format: 'props-changeset', version: 2, target: 'world/props.json', operations: [
//       { op: 'create', id, instance: {...} }   a new instance; the id must be free
//       { op: 'upsert',  id, instance: {...} }  replaces the instance's placement fields
//       { op: 'delete', id } ] }
// Definitions are hand-edited in this milestone: no operation touches them.
function applyPropsChangeset(data, changeset) {
  requirePropsRegistry(data);
  if (!changeset || typeof changeset !== 'object' || !Array.isArray(changeset.operations)) propsFail('changeset must be an object with an operations[] array');
  if (changeset.format !== PROPS_FORMAT) propsFail('changeset format must be ' + PROPS_FORMAT + ', got ' + JSON.stringify(changeset.format));
  if (changeset.version !== 2) propsFail('props changeset version must be 2, got ' + JSON.stringify(changeset.version));
  if (changeset.target !== PROPS_REL) propsFail('props changeset target must be ' + PROPS_REL + ', got ' + JSON.stringify(changeset.target));
  const out = JSON.parse(JSON.stringify(data));
  const seen = {}, changes = [];
  changeset.operations.forEach(function (op, i) {
    const where = 'operations[' + i + ']';
    if (!op || typeof op !== 'object') propsFail(where + ' is not an object');
    if (['create', 'upsert', 'delete'].indexOf(op.op) === -1) propsFail(where + '.op must be create, upsert or delete, got ' + JSON.stringify(op.op));
    if (typeof op.id !== 'string' || !op.id) propsFail(where + '.id must be an instance id');
    const allowed = op.op === 'delete' ? ['op', 'id'] : ['op', 'id', 'instance'];
    Object.keys(op).forEach(function (k) { if (allowed.indexOf(k) === -1) propsFail(where + ' carries unknown field "' + k + '"'); });
    if (Object.prototype.hasOwnProperty.call(seen, op.id)) propsFail(where + ' is a second operation on ' + op.id + ' (' + seen[op.id] + ' already)');
    seen[op.id] = where;
    const existing = out.instances[op.id];
    if (op.op === 'delete') {
      if (!existing) propsFail(where + ' deletes unknown instance ' + op.id);
      const before = existing;
      delete out.instances[op.id];
      changes.push({ op: 'delete', id: op.id, before: before, after: null });
      return;
    }
    if (op.op === 'create' && existing) propsFail(where + ' creates ' + op.id + ', which already exists');
    if (op.op === 'upsert' && !existing) propsFail(where + ' upserts unknown instance ' + op.id + ' (use create)');
    if (!op.instance || typeof op.instance !== 'object' || Array.isArray(op.instance)) propsFail(where + '.instance must be an object');
    Object.keys(op.instance).forEach(function (k) { if (INSTANCE_KEYS.indexOf(k) === -1) propsFail(where + '.instance carries unknown field "' + k + '"'); });
    if (op.op === 'upsert' && (op.instance.propId !== existing.propId || op.instance.sceneId !== existing.sceneId)) {
      propsFail(where + ' changes propId/sceneId of ' + op.id + '; delete and create instead');
    }
    const next = {};
    INSTANCE_KEYS.forEach(function (k) { if (op.instance[k] !== undefined) next[k] = op.instance[k]; });
    out.instances[op.id] = next;
    changes.push({ op: op.op, id: op.id, before: existing || null, after: next });
  });
  return { data: out, changes: changes };
}

// regenProps(root) -> writes js/props.gen.js from world/props.json. The single regeneration path: a hand edit of
// the gen file fails test/props-registry.js, which rebuilds the expected text with this function.
function propsGenText(data) {
  const body = function (v) { return JSON.stringify(v, null, 2).replace(/\n/g, '\n    '); };
  return [
'/* props.gen.js — GENERATED from world/props.json by tools/world-apply.js (regenProps).',
' * DO NOT EDIT BY HAND. Change world/props.json and run `node tools/world-apply.js --gen-props`.',
' * GAME.WorldData.props is the only source of the prop registry: js/props-production.js reads it and draws',
' * nothing unless GAME.PROPS_ENABLED is true. Map rows stay authoritative for collision. Deep-frozen.',
' */',
'(function () {',
"  'use strict';",
'  var G = (typeof window !== "undefined") ? window : globalThis;',
'  var GAME = G.GAME = G.GAME || {};',
'  function freezeDeep(v) {',
'    if (v && typeof v === "object") { Object.freeze(v); for (var k in v) freezeDeep(v[k]); }',
'    return v;',
'  }',
'  var scenes =', body(data.scenes) + ';',
'  var definitions =', body(data.definitions) + ';',
'  var instances =', body(data.instances) + ';',
'  GAME.WorldData = GAME.WorldData || {};',
'  GAME.WorldData.props = freezeDeep({ version: ' + data.version + ', tilePx: ' + PROPS_TILE + ', scenes: scenes, definitions: definitions, instances: instances });',
'}());',
''
  ].join('\n');
}

function regenProps(root) {
  const data = JSON.parse(fs.readFileSync(path.join(root, PROPS_REL), 'utf8'));
  requirePropsRegistry(data);
  const text = propsGenText(data);
  writeAtomic(path.join(root, PROPS_GEN_REL), text);
  return '[world-apply] wrote ' + PROPS_GEN_REL + ' (' + Object.keys(data.definitions).length + ' definitions, ' +
    Object.keys(data.instances).length + ' instances)';
}

function planProps(args, changeset, boot, problems) {
  for (const rel of [PROPS_REL, TARGET_REL, OBJECTS_REL, CAST_REL, 'test/props-registry.js', 'test/props-render-order.js']) {
    if (!fs.existsSync(path.join(args.root, rel))) usage('no ' + rel + ' under ' + args.root);
  }
  const target = path.join(args.root, PROPS_REL);
  const sourceText = fs.readFileSync(target, 'utf8');
  const registry = JSON.parse(sourceText);
  if (JSON.stringify(registry, null, 2) + '\n' !== sourceText) usage(PROPS_REL + ' is not canonical 2-space JSON; refusing to rewrite it');
  duplicateKeys(sourceText, 'instances').forEach(function (k) { problems.push('INVALID instances.' + k + ': duplicate instance id in ' + PROPS_REL); });
  const applied = applyPropsChangeset(registry, changeset);
  const G = boot(); // a refused changeset never pays for the boot

  applied.changes.forEach(function (c) {
    console.log((c.op === 'create' ? 'CREATE ' : c.op === 'delete' ? 'DELETE ' : 'TARGET ') + PROPS_REL + ' :: ' + c.id);
    console.log('BEFORE ' + JSON.stringify(c.before));
    console.log('AFTER  ' + JSON.stringify(c.after));
  });
  const nextText = JSON.stringify(applied.data, null, 2) + '\n';
  if (nextText !== sourceText) {
    console.log('DIFF ' + PROPS_REL);
    CatalogWrite.diffLines(sourceText, nextText).forEach(function (l) { console.log('  ' + l); });
  }

  const warnings = [];
  propsShapeProblems(args.root, applied.data, problems);
  if (!problems.length) propsWorldProblems(args, applied.data, G, problems, warnings);

  // delete guard: the instance id may not be referenced under js/ test/ narrative/ (the gen file is exempt)
  applied.changes.filter(function (c) { return c.op === 'delete'; }).forEach(function (c) {
    const refs = referencesTo(args.root, c.id).filter(function (rel) { return rel !== PROPS_GEN_REL; });
    if (refs.length) problems.push('REFUSED delete ' + c.id + ': referenced by ' + refs.length + ' file(s) outside ' + PROPS_REL + ':\n    ' + refs.join('\n    '));
  });

  return {
    noop: nextText === sourceText,
    report: function () {
      warnings.forEach(function (w) { console.log(w); });
      console.log('VALID ' + Object.keys(applied.data.instances).length + ' prop instance(s) against real maps, atlases and the Roadhouse locks' +
        (warnings.length ? ' (' + warnings.length + ' warning(s))' : ''));
      console.log('REPIN --repin does not apply to ' + PROPS_REL + ': props carry no pinned placement (Cast Presence owns pins)');
    },
    noopLine: 'NO-OP ' + PROPS_REL + ' already matches the changeset',
    dryLine: 'DRY-RUN ' + applied.changes.length + ' prop instance change(s); nothing written',
    files: [PROPS_REL, PROPS_GEN_REL],
    write: function (run) {
      writeAtomic(target, nextText);
      console.log('WROTE ' + PROPS_REL + ' (' + applied.changes.length + ' change(s))');
      console.log(regenProps(args.root));
      console.log('CHECK ' + run('test/props-registry.js', ['--registry-only']).trim().split('\n').pop());
      console.log('CHECK ' + run('test/props-render-order.js', ['--registry-only']).trim().split('\n').pop());
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
  if (args.genProps && !args.file) { console.log(regenProps(args.root)); return; }
  let parsed;
  try { parsed = JSON.parse(fs.readFileSync(args.file, 'utf8')); }
  catch (e) { usage('cannot read changeset: ' + e.message); }
  let parts = [];
  try { parts = Cast.splitChangesets(parsed); }
  catch (e) {
    console.error('world-apply: REFUSED — ' + e.message.replace(/^\[cast\] /, '') + '; this tool writes nothing else');
    process.exit(2);
  }
  const conn = parts.find(function (p) { return p.target === TARGET_REL; });
  const cast = parts.find(function (p) { return p.target === CAST_REL; });
  const objects = parts.find(function (p) { return p.target === OBJECTS_REL; });
  const props = parts.find(function (p) { return p.target === PROPS_REL; });

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
    if (objects) planned.push(planSceneObjects(args, objects.changeset, boot, problems));
    if (props) planned.push(planProps(args, props.changeset, boot, problems));
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
  function run(rel, extra) {
    const r = spawnSync(process.execPath, [path.join(args.root, rel)].concat(extra || []), { cwd: args.root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
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

// test/props-*.js drive the props layer in-process; the CLI only runs when this file is the entry point.
module.exports = {
  PROPS_REL, PROPS_GEN_REL, PROPS_FORMAT, PROPS_TILE, ROADHOUSE_LOCKS,
  pngSize, duplicateKeys, requirePropsRegistry, propsShapeProblems, propsWorldProblems,
  instanceTiles, applyPropsChangeset, propsGenText, regenProps, loadWorld, Refused
};

if (require.main === module) main();
