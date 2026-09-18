#!/usr/bin/env node
'use strict';

/* test/props-core.js — the editor props core (js/editor/core/props.js), WORLD BUILDER M10b.
 *
 * Covers the store contract on a synthetic registry (place / move / nudge / flip / delete / revert, frozen drafts,
 * undo through js/editor/core/history.js), the changeset it builds, the byte-stable registry round trip, the
 * geometry the UI draws with (origin, footprint tiles, hit-test, overlaps), and — the point of the validation
 * split — that its verdicts are the ones tools/world-apply.js gives for the same registry.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const P = require('../js/editor/core/props.js');
const Cast = require('../js/editor/core/cast.js');
const History = require('../js/editor/core/history.js');
const WorldApply = require('../tools/world-apply.js');
const ROOT = path.join(__dirname, '..');
let pass = 0;
function ok(cond, label) { assert.ok(cond, label); pass++; }
function throws(fn, re) { assert.throws(fn, re); pass++; }
const clone = (v) => JSON.parse(JSON.stringify(v));

// ---- a synthetic registry: two scenes, three definitions, four instances ------------------------------------
const DATA = {
  version: 1,
  scenes: { hall: { canvas: [256, 192] }, yard: { canvas: [320, 192] } },
  definitions: {
    'hall.chair.red': { label: 'Red chair', atlas: 'assets/fake/atlas.png', frame: [0, 0, 16, 24], anchor: [8, 22],
      footprint: [[0, 0]], defaultLayer: 6, tags: ['hall', 'seating'], transforms: ['flipX'] },
    'hall.table.round': { label: 'Round table', atlas: 'assets/fake/atlas.png', frame: [16, 0, 32, 24], anchor: [16, 22],
      footprint: [[0, 0], [1, 0]], defaultLayer: 5, tags: ['hall'], transforms: [] },
    'hall.lamp.brass': { label: 'Brass lamp', atlas: 'assets/fake/atlas.png', frame: [48, 0, 8, 12], anchor: [4, 0],
      footprint: [], defaultLayer: 8, tags: ['hall', 'light'], transforms: [] }
  },
  instances: {
    'hall-chair-01': { propId: 'hall.chair.red', sceneId: 'hall', tx: 4, ty: 5 },
    'hall-chair-02': { propId: 'hall.chair.red', sceneId: 'hall', tx: 5.8125, ty: 5, flipX: true },
    'hall-table-01': { propId: 'hall.table.round', sceneId: 'hall', tx: 8, ty: 6, layer: 4 },
    'yard-lamp-01': { propId: 'hall.lamp.brass', sceneId: 'yard', tx: 2, ty: 1, ox: 3 }
  }
};

const store = P.createPropStore(clone(DATA));
ok(Object.isFrozen(store) && Object.isFrozen(store.base) && store.draft === store.base, 'store is frozen, draft starts at base');
ok(Object.isFrozen(store.base['hall-chair-01']), 'base entries are frozen');
throws(() => P.createPropStore({ version: 2, scenes: {}, definitions: {}, instances: {} }), /registry version must be 1/);
throws(() => P.createPropStore({ version: 1, scenes: {}, definitions: {} }), /registry\.instances must be an object/);

// ---- place ---------------------------------------------------------------------------------------------------
{
  const d = P.placeProp(store, store.draft, { id: 'hall-lamp-01', propId: 'hall.lamp.brass', sceneId: 'hall', tx: 3, ty: 2 });
  ok(d !== store.draft && Object.isFrozen(d), 'placeProp returns a new frozen draft');
  ok(store.draft['hall-lamp-01'] === undefined, 'the base draft is untouched');
  assert.deepEqual(d['hall-lamp-01'], { propId: 'hall.lamp.brass', sceneId: 'hall', tx: 3, ty: 2 }); pass++;
  throws(() => P.placeProp(store, d, { id: 'hall-lamp-01', propId: 'hall.lamp.brass', sceneId: 'hall', tx: 1, ty: 1 }), /already exists/);
  throws(() => P.placeProp(store, store.draft, { id: 'hall-chair-01', propId: 'hall.chair.red', sceneId: 'hall', tx: 1, ty: 1 }), /already exists/);
  throws(() => P.placeProp(store, store.draft, { id: 'Hall_Lamp', propId: 'hall.chair.red', sceneId: 'hall', tx: 1, ty: 1 }), /must be kebab-case/);
  throws(() => P.placeProp(store, store.draft, { id: 'x-01', propId: 'hall.nope', sceneId: 'hall', tx: 1, ty: 1 }), /definitions stay hand-edited/);
  throws(() => P.placeProp(store, store.draft, { id: 'x-01', propId: 'hall.chair.red', sceneId: 'cellar', tx: 1, ty: 1 }), /has no canvas/);
  throws(() => P.placeProp(store, store.draft, { id: 'x-01', propId: 'hall.chair.red', sceneId: 'hall', tx: 1.01, ty: 1 }), /whole pixel/);
  throws(() => P.placeProp(store, store.draft, { id: 'x-01', propId: 'hall.table.round', sceneId: 'hall', tx: 1, ty: 1, flipX: true }), /flipX is not allowed/);
  // a definition's default layer is never written back as an override
  const dl = P.placeProp(store, store.draft, { id: 'x-01', propId: 'hall.chair.red', sceneId: 'hall', tx: 1, ty: 1, layer: 6 });
  ok(dl['x-01'].layer === undefined, 'a layer equal to the default is not stored');
  ok(P.placeProp(store, store.draft, { id: 'x-01', propId: 'hall.chair.red', sceneId: 'hall', tx: 1, ty: 1, layer: 2 })['x-01'].layer === 2, 'a real override is stored');
  throws(() => P.placeProp(store, store.draft, { id: 'x-01', propId: 'hall.chair.red', sceneId: 'hall', tx: 1, ty: 1, layer: 11 }), /integer 0\.\.9/);
}

// ---- suggestInstanceId ---------------------------------------------------------------------------------------
ok(P.suggestInstanceId(store, store.draft, 'hall.chair.red') === 'hall-chair-03', 'suggestInstanceId skips the taken 01 and 02');
ok(P.suggestInstanceId(store, store.draft, 'hall.lamp.brass') === 'hall-lamp-01', 'suggestInstanceId starts at 01');

// ---- move / nudge / flip / delete -----------------------------------------------------------------------------
{
  const moved = P.moveProp(store.draft, 'hall-chair-01', 7.5, 9);
  ok(moved['hall-chair-01'].tx === 7.5 && moved['hall-chair-01'].ty === 9, 'moveProp writes the anchor');
  ok(store.draft['hall-chair-01'].tx === 4, 'moveProp does not mutate the old draft');
  throws(() => P.moveProp(store.draft, 'nope', 1, 1), /no instance "nope"/);
  throws(() => P.moveProp(store.draft, 'hall-chair-01', 1.03, 1), /whole pixel/);

  const nudged = P.nudgeProp(store.draft, 'hall-chair-01', 2, -3);
  ok(nudged['hall-chair-01'].ox === 2 && nudged['hall-chair-01'].oy === -3, 'nudgeProp writes ox/oy');
  const back = P.nudgeProp(nudged, 'hall-chair-01', 0, 0);
  assert.deepEqual(back['hall-chair-01'], store.base['hall-chair-01']); pass++; // 0 drops the field: a nudge and back is the base entry
  ok(P.changes(store, back).length === 0, 'a nudge and back leaves no change');

  const flipped = P.flipProp(store, store.draft, 'hall-chair-01');
  ok(flipped['hall-chair-01'].flipX === true, 'flipProp sets flipX');
  ok(P.flipProp(store, flipped, 'hall-chair-01')['hall-chair-01'].flipX === undefined, 'flipping back removes the field (present only when true)');
  ok(P.flipProp(store, store.draft, 'hall-chair-02')['hall-chair-02'].flipX === undefined, 'flipProp clears a base flip');
  throws(() => P.flipProp(store, store.draft, 'hall-table-01'), /flipX is not allowed by hall\.table\.round/);

  const gone = P.deleteProp(store.draft, 'hall-chair-01');
  ok(!('hall-chair-01' in gone) && 'hall-chair-02' in gone, 'deleteProp drops exactly one instance');
  throws(() => P.deleteProp(gone, 'hall-chair-01'), /no instance/);
}

// ---- revert ----------------------------------------------------------------------------------------------------
{
  let d = P.moveProp(store.draft, 'hall-chair-01', 7, 7);
  d = P.deleteProp(d, 'hall-table-01');
  d = P.placeProp(store, d, { id: 'hall-lamp-09', propId: 'hall.lamp.brass', sceneId: 'hall', tx: 1, ty: 1 });
  ok(P.changes(store, d).length === 3, 'three changes pending');

  const r1 = P.revertEntry(store, d, 'hall-chair-01');
  assert.deepEqual(r1['hall-chair-01'], store.base['hall-chair-01']); pass++;
  const r2 = P.revertEntry(store, d, 'hall-table-01');
  assert.deepEqual(r2['hall-table-01'], store.base['hall-table-01']); pass++; // a deleted entry comes back
  ok(!('hall-lamp-09' in P.revertEntry(store, d, 'hall-lamp-09')), 'reverting a created entry removes it');
  ok(P.revertEntry(store, store.draft, 'hall-chair-01') === store.draft, 'reverting an unchanged entry is the same draft');

  const rs = P.revertScene(store, d, 'hall');
  ok(P.changes(store, rs).length === 0, 'revertScene undoes every change of that scene');
  const other = P.moveProp(d, 'yard-lamp-01', 4, 4);
  ok(P.changes(store, P.revertScene(store, other, 'yard')).length === 3, 'revertScene leaves the other scene alone');
}

// ---- changes + changeset ----------------------------------------------------------------------------------------
{
  let d = P.moveProp(store.draft, 'hall-chair-02', 6, 5);
  d = P.deleteProp(d, 'yard-lamp-01');
  d = P.placeProp(store, d, { id: 'hall-lamp-02', propId: 'hall.lamp.brass', sceneId: 'hall', tx: 1, ty: 1 });
  const ch = P.changes(store, d);
  assert.deepEqual(ch.map((c) => c.op + ':' + c.id), ['upsert:hall-chair-02', 'delete:yard-lamp-01', 'create:hall-lamp-02']); pass++;
  ok(ch[0].before.tx === 5.8125 && ch[0].after.tx === 6, 'a change carries before and after');

  const cs = P.buildPropsChangeset(store, d);
  ok(cs.format === 'props-changeset' && cs.version === 2 && cs.target === 'world/props.json', 'changeset header');
  assert.deepEqual(cs.operations[1], { op: 'delete', id: 'yard-lamp-01' }); pass++;
  ok(cs.operations[0].instance.flipX === true, 'an upsert carries the whole instance');
  ok(Object.isFrozen(cs) && Object.isFrozen(cs.operations), 'the changeset is frozen');
  ok(P.buildPropsChangeset(store, store.draft).operations.length === 0, 'an untouched draft builds an empty changeset');

  // splitChangesets owns world/props.json now (M10b): the shim in tools/world-apply.js is gone
  assert.deepEqual(Cast.splitChangesets(cs), [{ target: 'world/props.json', changeset: cs }]); pass++;
  const bundle = Cast.buildBundle([cs, P.buildPropsChangeset(store, store.draft)]);
  ok(bundle === cs, 'buildBundle drops the empty props changeset');
  throws(() => Cast.splitChangesets({ format: Cast.BUNDLE_FORMAT, version: 1, changesets: [cs, cs] }), /second changeset for world\/props\.json/);
  throws(() => Cast.splitChangesets(Object.assign({}, cs, { target: 'world/connections.json' })), /props changeset targeting/);
  throws(() => Cast.splitChangesets({ format: 'world-connections-changeset', target: 'world/props.json', operations: [] }), /without format props-changeset/);

  // the draft's registry is what tools/world-apply.js writes for the same changeset, key order included
  const applied = WorldApply.applyPropsChangeset(clone(DATA), clone(cs)).data;
  assert.deepEqual(P.registryWithDraft(store, d), applied); pass++;
  assert.equal(JSON.stringify(P.registryWithDraft(store, d)), JSON.stringify(applied)); pass++;
  assert.deepEqual(P.registryWithDraft(store, store.draft), DATA); pass++;
}

// ---- undo through the shared history core -------------------------------------------------------------------------
{
  let h = History.create(store.base);
  h = History.commit(h, P.moveProp(h.present, 'hall-chair-01', 9, 9), { label: 'move' });
  h = History.commit(h, P.flipProp(store, h.present, 'hall-chair-01'), { label: 'flip' });
  ok(P.changes(store, h.present).length === 1 && h.present['hall-chair-01'].flipX === true, 'two edits, one changed instance');
  h = History.undo(h);
  ok(h.present['hall-chair-01'].flipX === undefined && h.present['hall-chair-01'].tx === 9, 'undo drops the flip, keeps the move');
  h = History.undo(h);
  ok(h.present === store.base && P.changes(store, h.present).length === 0, 'undo to base');
  h = History.redo(h);
  ok(h.present['hall-chair-01'].tx === 9, 'redo replays the move');
}

// ---- geometry the UI draws and clicks with ---------------------------------------------------------------------
{
  const def = DATA.definitions['hall.chair.red'];
  assert.deepEqual(P.originOf(def, DATA.instances['hall-chair-01']), { left: 4 * 16 - 8, top: 5 * 16 - 22 }); pass++;
  // a flip mirrors the anchor inside the frame, so the box stays put
  assert.deepEqual(P.originOf(def, { tx: 4, ty: 5, flipX: true }), { left: 4 * 16 - (16 - 8), top: 5 * 16 - 22 }); pass++;
  assert.deepEqual(P.originOf(DATA.definitions['hall.lamp.brass'], DATA.instances['yard-lamp-01']), { left: 2 * 16 - 4 + 3, top: 1 * 16 }); pass++;
  assert.deepEqual(P.instanceTiles(DATA.definitions['hall.table.round'], DATA.instances['hall-table-01']), [[8, 6], [9, 6]]); pass++;
  assert.deepEqual(P.instanceTiles(DATA.definitions['hall.lamp.brass'], DATA.instances['yard-lamp-01']), []); pass++;
  ok(P.layerOf(def, DATA.instances['hall-chair-01']) === 6 && P.layerOf(DATA.definitions['hall.table.round'], DATA.instances['hall-table-01']) === 4,
    'layerOf prefers the instance override');

  // bandOf: the three actor-relative bands the inspector labels a layer with (js/props-production.js ACTOR_LAYER)
  ok(P.BANDS.BELOW_ACTORS === 'below the actors' && P.BANDS.ACTOR_BAND === 'interleaves with the actors' &&
     P.BANDS.ABOVE_ACTORS === 'above the actors', 'the three band labels are exported');
  ok(P.bandOf(P.ACTOR_LAYER - 1) === P.BANDS.BELOW_ACTORS && P.bandOf(P.ACTOR_LAYER) === P.BANDS.ACTOR_BAND &&
     P.bandOf(P.ACTOR_LAYER + 1) === P.BANDS.ABOVE_ACTORS, 'bandOf splits exactly on ACTOR_LAYER');
  ok(P.bandOf(P.LAYER_MIN) === P.BANDS.BELOW_ACTORS && P.bandOf(P.LAYER_MAX) === P.BANDS.ABOVE_ACTORS,
    'bandOf covers the whole legal layer range');
  ok(P.bandOf(P.layerOf(DATA.definitions['hall.chair.red'], DATA.instances['hall-chair-01'])) === P.BANDS.ACTOR_BAND &&
     P.bandOf(P.layerOf(DATA.definitions['hall.table.round'], DATA.instances['hall-table-01'])) === P.BANDS.BELOW_ACTORS &&
     P.bandOf(P.layerOf(DATA.definitions['hall.lamp.brass'], DATA.instances['yard-lamp-01'])) === P.BANDS.ABOVE_ACTORS,
    'bandOf labels the fixture layers: chair interleaves, table is below, lamp is above');

  // hit-test: the topmost instance covering a scene pixel, null off every frame
  ok(P.hitTest(store, store.draft, 'hall', 4 * 16, 5 * 16 - 1) === 'hall-chair-01', 'hit-test finds the chair');
  ok(P.hitTest(store, store.draft, 'hall', 0, 0) === null, 'empty pixel hits nothing');
  ok(P.hitTest(store, store.draft, 'yard', 2 * 16, 1 * 16) === 'yard-lamp-01', 'hit-test honours the pixel nudge (ox)');
  ok(P.hitTest(store, store.draft, 'yard', 4 * 16, 5 * 16 - 1) === null, 'the hall chair is not clickable in the yard');
  ok(P.hitTest(store, store.draft, 'hall', 8 * 16, 6 * 16 - 1) === 'hall-table-01', 'hit-test finds the table');
  // two stacked frames: the one drawn last (higher layer) wins
  const stacked = P.placeProp(store, store.draft, { id: 'hall-lamp-03', propId: 'hall.lamp.brass', sceneId: 'hall', tx: 4, ty: 5 });
  // the two frames overlap on x 60..67, y 80..81; the lamp is layer 8, the chair layer 6
  ok(P.hitTest(store, store.draft, 'hall', 64, 80) === 'hall-chair-01', 'the chair alone is hit before the lamp exists');
  ok(P.hitTest(store, stacked, 'hall', 64, 80) === 'hall-lamp-03', 'the higher layer wins the click');

  const over = P.overlaps(store, P.moveProp(store.draft, 'hall-chair-01', 8, 6));
  assert.deepEqual(over, [{ sceneId: 'hall', tile: '8,6', ids: ['hall-chair-01', 'hall-table-01'] }]); pass++;
  ok(P.overlaps(store, store.draft).length === 0, 'the seeded synthetic registry has no overlap');
}

// ---- validation: the core's verdicts, then the same verdicts from tools/world-apply.js ---------------------------
const CTX = { atlasSize: () => ({ width: 64, height: 32 }), mapSize: () => ({ width: 16, height: 12 }) };
{
  const bad = [
    [{ propId: 'hall.nope', sceneId: 'hall', tx: 1, ty: 1 }, /missing definition "hall\.nope"/],
    [{ propId: 'hall.chair.red', sceneId: 'cellar', tx: 1, ty: 1 }, /scene "cellar" has no canvas/],
    [{ propId: 'hall.chair.red', sceneId: 'hall', tx: 99, ty: 1 }, /falls outside hall \(16x12 tiles\)/],
    [{ propId: 'hall.chair.red', sceneId: 'hall', tx: 1.03, ty: 1 }, /must land on a whole pixel/],
    [{ propId: 'hall.chair.red', sceneId: 'hall', tx: 'x', ty: 1 }, /must be a finite number/],
    [{ propId: 'hall.chair.red', sceneId: 'hall', tx: 1, ty: 1, layer: 11 }, /layer must be an integer 0\.\.9/],
    [{ propId: 'hall.table.round', sceneId: 'hall', tx: 1, ty: 1, flipX: true }, /transform flipX is not allowed by hall\.table\.round/],
    [{ propId: 'hall.chair.red', sceneId: 'hall', tx: 1, ty: 1, flipX: false }, /flipX is present only when true/],
    [{ propId: 'hall.chair.red', sceneId: 'hall', tx: 1, ty: 1, ox: 1.5 }, /ox must be an integer pixel offset/],
    [{ propId: 'hall.chair.red', sceneId: 'hall', tx: 1, ty: 1, colour: 'red' }, /has unknown field "colour"/]
  ];
  bad.forEach(function (pair) {
    const errs = P.instanceErrors(CTX, DATA, 'probe-01', pair[0]);
    ok(errs.some((e) => pair[1].test(e)), 'instanceErrors: ' + pair[1]);
  });
  ok(P.instanceErrors(CTX, DATA, 'Probe_01', DATA.instances['hall-chair-01']).some((e) => /instance id must be kebab-case/.test(e)), 'instanceErrors: bad id');
  ok(P.instanceErrors(CTX, DATA, 'hall-chair-01', DATA.instances['hall-chair-01']).length === 0, 'a good instance has no errors');

  ok(P.definitionErrors(CTX, 'hall.chair.red', DATA.definitions['hall.chair.red']).length === 0, 'a good definition has no errors');
  ok(P.definitionErrors(CTX, 'HallChair', DATA.definitions['hall.chair.red']).some((e) => /dotted lowercase/.test(e)), 'definitionErrors: bad id');
  ok(P.definitionErrors(CTX, 'hall.chair.red', Object.assign({}, DATA.definitions['hall.chair.red'], { frame: [0, 0, 999, 24] }))
    .some((e) => /falls outside atlas/.test(e)), 'definitionErrors: frame outside the atlas');
  ok(P.definitionErrors(CTX, 'hall.chair.red', Object.assign({}, DATA.definitions['hall.chair.red'], { anchor: [99, 0] }))
    .some((e) => /falls outside its own frame/.test(e)), 'definitionErrors: anchor outside the frame');
  ok(P.definitionErrors(CTX, 'hall.chair.red', Object.assign({}, DATA.definitions['hall.chair.red'], { transforms: ['rotate'] }))
    .some((e) => /may only list flipX/.test(e)), 'definitionErrors: unknown transform');
  ok(P.definitionErrors({}, 'hall.chair.red', Object.assign({}, DATA.definitions['hall.chair.red'], { frame: [0, 0, 999, 24] })).length === 0,
    'without an injected atlas size the frame bound is not checked (never guessed)');

  ok(P.sceneErrors(CTX, 'hall', { canvas: [256, 192] }).length === 0, 'a good scene has no errors');
  ok(P.sceneErrors(CTX, 'hall', { canvas: [256, 176] }).some((e) => /is smaller than the map \(256x192\)/.test(e)), 'sceneErrors: canvas smaller than the map');
  ok(P.sceneErrors({ mapSize: () => null }, 'hall', { canvas: [256, 192] }).some((e) => /is not a map in js\/maps\.js/.test(e)), 'sceneErrors: not a map');
  ok(P.sceneErrors(CTX, 'hall', { canvas: [256, 192], extra: 1 }).some((e) => /must carry exactly \{ canvas \}/.test(e)), 'sceneErrors: unknown field');
  ok(P.sceneErrors({}, 'hall', { canvas: [250, 192] }).some((e) => /whole tiles of 16px/.test(e)), 'sceneErrors: canvas not whole tiles');

  // draftErrors reports only what the draft changed, grouped by scene
  let d = P.moveProp(store.draft, 'hall-chair-01', 99, 1);
  const de = P.draftErrors(CTX, store, d);
  ok(Object.keys(de).join() === 'hall' && de.hall.length === 1 && /falls outside hall/.test(de.hall[0]), 'draftErrors groups by scene');
  ok(Object.keys(P.draftErrors(CTX, store, store.draft)).length === 0, 'an untouched draft has no errors');
  ok(Object.keys(P.draftErrors(CTX, store, P.deleteProp(store.draft, 'hall-chair-01'))).length === 0, 'a delete cannot be invalid');
}

// ---- the same verdicts as tools/world-apply.js, on the real world/props.json --------------------------------------
{
  const REAL = JSON.parse(fs.readFileSync(path.join(ROOT, 'world/props.json'), 'utf8'));
  const realCtx = { atlasSize: (atlas) => WorldApply.pngSize(path.join(ROOT, atlas)) };
  ok(P.registryErrors(realCtx, REAL).length === 0, 'the shipped registry is clean by the core');
  const toolProblems = [];
  WorldApply.propsShapeProblems(ROOT, REAL, toolProblems);
  ok(toolProblems.length === 0, 'the shipped registry is clean by the tool');

  // every mutation: the tool prints exactly the core's message with an INVALID prefix
  const mutations = [
    ['a missing definition', (r) => { r.instances['roadhouse-chair-02'].propId = 'roadhouse.nope'; }],
    ['an off-canvas anchor', (r) => { r.instances['roadhouse-chair-02'].tx = 99; }],
    ['a bad layer', (r) => { r.instances['roadhouse-chair-02'].layer = 11; }],
    ['a forbidden transform', (r) => { r.instances['roadhouse-candle-01'].flipX = true; }],
    ['an unknown instance field', (r) => { r.instances['roadhouse-chair-02'].collides = true; }],
    ['a sub-pixel anchor', (r) => { r.instances['roadhouse-chair-02'].tx = 7.01; }],
    ['a frame outside the atlas', (r) => { r.definitions['roadhouse.chair.red'].frame = [0, 0, 9999, 24]; }],
    ['a definition missing a field', (r) => { delete r.definitions['roadhouse.chair.red'].tags; }],
    ['a bad canvas', (r) => { r.scenes.roadhouse.canvas = [250, 192]; }],
    ['an unknown scene field', (r) => { r.scenes.roadhouse.note = 'x'; }]
  ];
  mutations.forEach(function (m) {
    const r = clone(REAL);
    m[1](r);
    const core = P.registryErrors(realCtx, r);
    const tool = [];
    WorldApply.propsShapeProblems(ROOT, r, tool);
    ok(core.length > 0, 'the core rejects ' + m[0]);
    assert.deepEqual(tool, core.map((e) => 'INVALID ' + e)); pass++;
  });

  // a missing atlas file is the tool's problem to report (the core cannot read the disk) and still names the definition
  const missing = clone(REAL);
  missing.definitions['roadhouse.chair.red'].atlas = 'assets/does-not-exist.png';
  const tool = [];
  WorldApply.propsShapeProblems(ROOT, missing, tool);
  ok(tool.some((e) => e === 'INVALID definitions.roadhouse.chair.red.atlas assets/does-not-exist.png does not exist'),
    'the tool names the definition whose atlas is missing');
}

console.log('PROPS-CORE-PASS ' + pass + ' checks');
