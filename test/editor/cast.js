#!/usr/bin/env node
'use strict';

// Editor cast core (js/editor/core/cast.js) — WORLD BUILDER M7 placement editing. Synthetic cast data plus the
// real narrative/cast/windows.json (read only): store over PLACED bodies only, strict changeset, byte-stable
// JSON round trip, same-`when` refusal, tile errors, bundle split.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Cast = require('../../js/editor/core/cast.js');
const Edit = require('../../js/editor/core/edit.js');
const History = require('../../js/editor/core/history.js');
let pass = 0;
function ok(cond, label) { assert.ok(cond, label); pass++; }

const DATA = {
  version: 'x',
  characters: {
    anna: { class: 'PERSISTENT', name: 'Anna', baseline: { status: 'PLACED', map_id: 'hall', x: 2, y: 3, dir: 'down', dialogue: 'anna' } },
    bert: { class: 'PERSISTENT', name: 'Bert', baseline: { status: 'OFFSCREEN', label: 'away' } },
    cleo: { class: 'TEMP', name: 'Cleo' }
  },
  windows: [
    { id: 'W_ONE', owner: 'M1', when: { flag: 'f1' }, cast: { anna: { status: 'PLACED', map_id: 'yard', x: 5, y: 5, dir: 'up', dialogue: 'a2' }, bert: { status: 'PLACED', map_id: 'hall', x: 7, y: 1, dir: 'left' } } },
    { id: 'W_GONE', owner: 'M2', when: { flag: 'f2' }, cast: { anna: { status: 'TERMINAL_REMOVED', event: 'x' } } },
    { id: 'W_CLEO_A', owner: 'M3', when: { all: [{ flag: 'c' }, { not: { flag: 'd' } }] }, cast: { cleo: { status: 'PLACED', map_id: 'yard', x: 1, y: 1, dir: 'down' } } },
    { id: 'W_CLEO_B', owner: 'M3', when: { all: [{ flag: 'c' }, { not: { flag: 'd' } }] }, cast: { cleo: { status: 'PLACED', map_id: 'hall', x: 9, y: 9, dir: 'down' } } }
  ]
};

const st = Cast.createCastStore(DATA);
ok(Object.keys(st.base).join() === 'baseline/anna,W_ONE/anna,W_ONE/bert,W_CLEO_A/cleo,W_CLEO_B/cleo', 'store holds PLACED placements only (no OFFSCREEN / TERMINAL_REMOVED)');
ok(st.base['W_ONE/anna'].owner === 'M1' && st.base['baseline/anna'].owner === 'PERSISTENT', 'entries carry owner (window owner or character class)');
ok(Object.isFrozen(st.base['W_ONE/anna']) && st.draft === st.base, 'base frozen, fresh draft is base');

// ---- placeBody + refusals
let d = Cast.placeBody(st, st.draft, { window: 'W_ONE', character: 'anna', x: 6, y: 4 });
d = Cast.placeBody(st, d, { window: 'W_ONE', character: 'anna', dir: Cast.arrowDir('ArrowLeft') });
ok(JSON.stringify(d['W_ONE/anna']) === JSON.stringify({ window: 'W_ONE', character: 'anna', owner: 'M1', map_id: 'yard', x: 6, y: 4, dir: 'left' }), 'move + arrow rotate');
ok(d['baseline/anna'] === st.base['baseline/anna'] && st.base['W_ONE/anna'].x === 5, 'copy-on-write, base untouched');
ok(Cast.arrowDir('ArrowUp') === 'up' && Cast.arrowDir('a') === null, 'arrowDir maps arrow keys only');
assert.throws(() => Cast.placeBody(st, st.draft, { window: 'W_GONE', character: 'anna', x: 1, y: 1 }), /anna in W_GONE is TERMINAL_REMOVED; only PLACED bodies move/);
assert.throws(() => Cast.placeBody(st, st.draft, { window: 'baseline', character: 'bert', x: 1, y: 1 }), /bert in baseline is OFFSCREEN/);
assert.throws(() => Cast.placeBody(st, st.draft, { window: 'baseline', character: 'cleo', x: 1, y: 1 }), /"cleo" has no baseline/);
assert.throws(() => Cast.placeBody(st, st.draft, { window: 'W_NEW', character: 'anna', x: 1, y: 1 }), /unknown window "W_NEW"; creating windows stays hand-authored/);
assert.throws(() => Cast.placeBody(st, st.draft, { window: 'W_ONE', character: 'cleo', x: 1, y: 1 }), /window W_ONE does not name character "cleo"/);
assert.throws(() => Cast.placeBody(st, st.draft, { window: 'W_ONE', character: 'zed', x: 1, y: 1 }), /unknown character "zed"/);
assert.throws(() => Cast.placeBody(st, st.draft, { window: 'W_ONE', character: 'anna', x: 1.5 }), /x must be an integer/);
assert.throws(() => Cast.placeBody(st, st.draft, { window: 'W_ONE', character: 'anna', dir: 'north' }), /facing must be/);
pass += 8;

// ---- same `when` placing the same body elsewhere (V2 overlap) refuses the move
ok(Cast.sameWhenConflicts(DATA, 'W_CLEO_A', 'cleo').join() === 'W_CLEO_B' && Cast.sameWhenConflicts(DATA, 'W_ONE', 'anna').length === 0 && Cast.sameWhenConflicts(DATA, 'baseline', 'anna').length === 0, 'sameWhenConflicts compares `when` canonically');
assert.throws(() => Cast.placeBody(st, st.draft, { window: 'W_CLEO_A', character: 'cleo', x: 2, y: 2 }), /cleo is placed by W_CLEO_A and, under the same `when`, elsewhere by W_CLEO_B; fix the overlap/);
pass++;

// ---- changeset: only changed bodies, sorted; revert; history
d = Cast.placeBody(st, d, { window: 'baseline', character: 'anna', x: 3 });
const cs = Cast.buildCastChangeset(st, d);
assert.deepEqual(JSON.parse(JSON.stringify(cs)), { format: 'cast-windows-changeset', version: 1, target: 'narrative/cast/windows.json', operations: [
  { op: 'place', window: 'W_ONE', character: 'anna', map_id: 'yard', x: 6, y: 4, dir: 'left' },
  { op: 'place', window: 'baseline', character: 'anna', map_id: 'hall', x: 3, y: 3, dir: 'down' }] });
pass++;
ok(Cast.buildCastChangeset(st, Cast.placeBody(st, st.draft, { window: 'W_ONE', character: 'anna', x: 5 })).operations.length === 0, 'moving back to the base emits nothing');
ok(Cast.changedKeys(st, Cast.revertBody(st, d, 'W_ONE', 'anna')).join() === 'baseline/anna', 'revertBody restores one body');
const h = History.commit(History.create(st.base), d, { label: 'move' });
ok(History.undo(h).present === st.base, 'cast drafts undo through history.js');

// ---- apply: strict, only the four fields change, key order kept
const applied = Cast.applyCastChangeset(DATA, cs);
ok(applied.data.windows[0].cast.anna.x === 6 && applied.data.windows[0].cast.anna.dialogue === 'a2' && DATA.windows[0].cast.anna.x === 5, 'apply writes a copy; untouched fields kept');
ok(JSON.stringify(Object.keys(applied.data.windows[0].cast.anna)) === JSON.stringify(Object.keys(DATA.windows[0].cast.anna)), 'key order kept');
assert.deepEqual(applied.changes[0], { window: 'W_ONE', character: 'anna', owner: 'M1', before: { map_id: 'yard', x: 5, y: 5, dir: 'up' }, after: { map_id: 'yard', x: 6, y: 4, dir: 'left' } });
pass++;
const bad = (mut) => { const c = JSON.parse(JSON.stringify(cs)); mut(c); return () => Cast.applyCastChangeset(DATA, c); };
assert.throws(bad((c) => { c.format = 'world-connections-changeset'; }), /format must be cast-windows-changeset/);
assert.throws(bad((c) => { c.version = 2; }), /version must be 1/);
assert.throws(bad((c) => { c.target = 'narrative/missions/M8.json'; }), /target must be narrative\/cast\/windows\.json/);
assert.throws(bad((c) => { c.operations[0].op = 'create'; }), /op must be "place"/);
assert.throws(bad((c) => { c.operations[0].when = { flag: 'z' }; }), /unknown field "when"/);
assert.throws(bad((c) => { c.operations[0].status = 'OFFSCREEN'; }), /unknown field "status"/);
assert.throws(bad((c) => { c.operations[1] = Object.assign({}, c.operations[0]); }), /second operation on W_ONE\/anna/);
assert.throws(bad((c) => { c.operations[0].window = 'W_GONE'; }), /TERMINAL_REMOVED/);
assert.throws(bad((c) => { c.operations[0].x = '6'; }), /x and y must be integers/);
assert.throws(bad((c) => { c.operations[0].dir = 'n'; }), /dir must be up\/down\/left\/right/);
pass += 10;
ok(Cast.castDataWithDraft(DATA, st, st.draft) === DATA && Cast.castDataWithDraft(DATA, st, d).characters.anna.baseline.x === 3, 'castDataWithDraft applies drafts only when there are any');

// ---- tile errors
const tctx = { sceneExists: (m) => m === 'hall', isWalkable: (m, x, y) => !(x === 0 && y === 0), doorAt: (m, x, y) => (x === 4 && y === 4 ? 'hall-door' : null) };
ok(Cast.placementErrors(tctx, { map_id: 'hall', x: 1, y: 1 }, []).length === 0, 'free walkable tile');
ok(Cast.placementErrors(tctx, { map_id: 'hall', x: 0, y: 0 }, []).join() === 'hall 0,0 is not walkable', 'solid tile');
ok(Cast.placementErrors(tctx, { map_id: 'hall', x: 4, y: 4 }, []).join() === 'hall 4,4 is a door trigger tile (hall-door)', 'door tile');
ok(Cast.placementErrors(tctx, { map_id: 'hall', x: 1, y: 1 }, ['lucy']).join() === 'hall 1,1 is occupied by lucy', 'occupied tile');
ok(Cast.placementErrors(tctx, { map_id: 'nope', x: 1, y: 1 }, []).join() === 'map "nope" does not exist', 'unknown map');

// ---- bundle split
const conn = { format: 'world-connections-changeset', version: 2, target: 'world/connections.json', operations: [{ op: 'delete', id: 'x' }] };
ok(Cast.splitChangesets(conn)[0].target === 'world/connections.json' && Cast.splitChangesets({ operations: [] })[0].target === 'world/connections.json', 'plain connections changeset (v1 without format too)');
ok(Cast.splitChangesets(cs)[0].target === 'narrative/cast/windows.json', 'plain cast changeset');
const bundle = Cast.buildBundle([conn, cs]);
ok(bundle.format === 'world-builder-bundle' && bundle.version === 1 && Cast.splitChangesets(bundle).map((x) => x.target).join() === 'world/connections.json,narrative/cast/windows.json', 'bundle of both');
ok(Cast.buildBundle([conn, Cast.buildCastChangeset(st, st.draft)]) === conn && Cast.buildBundle([]) === null, 'one live changeset exports bare; none exports nothing');
assert.throws(() => Cast.splitChangesets({ format: 'world-builder-bundle', version: 1, changesets: [cs, cs] }), /second changeset for narrative\/cast\/windows\.json/);
assert.throws(() => Cast.splitChangesets({ format: 'world-builder-bundle', version: 2, changesets: [cs] }), /bundle version must be 1/);
assert.throws(() => Cast.splitChangesets({ format: 'world-builder-bundle', version: 1, changesets: [] }), /non-empty changesets/);
assert.throws(() => Cast.splitChangesets({ format: 'world-builder-bundle', version: 1, changesets: [bundle] }), /nests a bundle/);
assert.throws(() => Cast.splitChangesets({ format: 'mystery', operations: [] }), /unknown format "mystery"/);
assert.throws(() => Cast.splitChangesets(Object.assign({}, conn, { target: 'js/maps.js' })), /only world\/connections\.json, narrative\/cast\/windows\.json and world\/scene-objects\.json are writable/);
pass += 6;

// ---- the real windows.json (read only): every PLACED body is editable, apply round-trips byte-identically
const REAL_TEXT = fs.readFileSync(path.join(__dirname, '..', '..', 'narrative', 'cast', 'windows.json'), 'utf8');
const REAL = JSON.parse(REAL_TEXT);
const rs = Cast.createCastStore(REAL);
ok(Object.keys(rs.base).length >= 40 && rs.base['baseline/truman'].map_id === 'sheriff' && rs.base['ACT3_TRUMAN_REPORT/truman'].owner === 'M5', 'real store: baselines + windows');
const moved = Cast.placeBody(rs, rs.draft, { window: 'ACT3_TRUMAN_REPORT', character: 'truman', x: 10 });
const realCs = Cast.buildCastChangeset(rs, moved);
const realOut = JSON.stringify(Cast.applyCastChangeset(REAL, realCs).data, null, 2) + '\n';
const diff = realOut.split('\n').map((l, i) => [l, REAL_TEXT.split('\n')[i]]).filter((p) => p[0] !== p[1]);
ok(diff.length === 1 && diff[0][1].trim() === '"x": 9,' && diff[0][0].trim() === '"x": 10,', 'real apply changes exactly one JSON line');
ok(JSON.stringify(Cast.applyCastChangeset(REAL, Cast.buildCastChangeset(rs, rs.draft)).data, null, 2) + '\n' === REAL_TEXT, 'empty changeset keeps the real bytes');
ok(Object.keys(rs.base).every((k) => Cast.sameWhenConflicts(REAL, rs.base[k].window, rs.base[k].character).length === 0), 'no real body sits in a same-`when` overlap');
ok(Edit.canonical({ b: 1, a: 2 }) === Edit.canonical({ a: 2, b: 1 }), 'canonical parity with edit.js');

console.log(`EDITOR-CAST-PASS ${pass}`);
