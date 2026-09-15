#!/usr/bin/env node
'use strict';

// Editor scene objects core (js/editor/core/scene-objects.js) — WORLD BUILDER M8. Synthetic registry plus the real
// world/scene-objects.json and narrative/missions (read only): store, move / resize / delete / create for objects and
// interact keys, draft validation, strict changeset, byte-stable JSON round trip, mission reference guard, bundle split.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const SO = require('../../js/editor/core/scene-objects.js');
const Cast = require('../../js/editor/core/cast.js');
const History = require('../../js/editor/core/history.js');
const ROOT = path.join(__dirname, '..', '..');
let pass = 0;
function ok(cond, label) { assert.ok(cond, label); pass++; }
function throws(fn, re) { assert.throws(fn, re); pass++; }

const DATA = {
  version: 1,
  scenes: {
    yard: {
      objects: [
        { sourceId: 'pond', type: 'landmark', kind: 'water', x: 1, y: 1, w: 3, h: 2, dialogue: 'pond_dlg' },
        { sourceId: 'post', type: 'landmark', kind: 'sign', x: 6, y: 0, dialogue: [{ cond: 'flag:f', then: 'post_after' }, 'post_dlg'] }
      ],
      interact: { '4,4': 'bell', '2,5': 'gate' }
    },
    hall: { objects: [], interact: {} }
  }
};
const SIZES = { yard: { width: 10, height: 8 }, hall: { width: 5, height: 5 } };
const DIALOGUES = { pond_dlg: 1, post_after: 1, post_dlg: 1, bell_dlg: 1, gate: 1, new_dlg: 1 };
const INTERACT = { bell: 'bell_dlg', lamp: 'new_dlg' };
const ctx = {
  sceneSize: (s) => SIZES[s] || null,
  dialogueExists: (id) => !!DIALOGUES[id],
  interactIdKnown: (id) => Object.prototype.hasOwnProperty.call(INTERACT, id)
};

// ---- store
const st = SO.createObjectStore(DATA);
ok(Object.keys(st.base).join() === 'yard,hall' && st.draft === st.base && Object.isFrozen(st.base.yard.objects[0]), 'store: scenes in registry order, frozen base, draft is base');
ok(JSON.stringify(st.base.yard.interact) === '[{"ref":"4,4","x":4,"y":4,"id":"bell"},{"ref":"2,5","x":2,"y":5,"id":"gate"}]', 'interact keys become ordered entries with a stable ref');
ok(SO.kinds(st).map((k) => k.kind + ':' + k.type).join() === 'sign:landmark,water:landmark', 'kinds lists the kinds already present');
ok(SO.interactItemKey('13,5') === 'interact-13-5' && SO.interactItemKey('new-2') === 'interact-new-2', 'interact item keys are colon-free');

// ---- objects: move, resize, delete, create
let d = SO.moveObject(st.draft, 'yard', 'post', 7, 1);
ok(d.yard.objects[1].x === 7 && d.yard.objects[1].y === 1 && st.base.yard.objects[1].x === 6 && d.hall === st.base.hall, 'move: copy-on-write, untouched scene shared');
ok(JSON.stringify(d.yard.objects[1].dialogue) === JSON.stringify(DATA.scenes.yard.objects[1].dialogue), 'move keeps the cascade untouched');
d = SO.resizeObject(d, 'yard', 'pond', 4, 3);
ok(d.yard.objects[0].w === 4 && d.yard.objects[0].h === 3, 'resize a rect');
throws(() => SO.resizeObject(d, 'yard', 'post', 2, 2), /post is a single-tile object \(no w\/h\); RESIZE applies to rects only/);
throws(() => SO.resizeObject(d, 'yard', 'pond', 0, 2), /w must be an integer >= 1/);
throws(() => SO.moveObject(d, 'yard', 'nope', 1, 1), /no object "nope" in yard/);
throws(() => SO.moveObject(d, 'attic', 'pond', 1, 1), /scene "attic" is not in world\/scene-objects.json/);
throws(() => SO.moveObject(d, 'yard', 'pond', -1, 1), /x must be an integer >= 0/);
ok(SO.suggestSourceId(d, 'yard', 'water') === 'water' && SO.suggestSourceId(SO.createObject(st, d, 'yard', { sourceId: 'water', kind: 'water', x: 0, y: 7, dialogue: 'pond_dlg' }), 'yard', 'water') === 'water-2', 'suggestSourceId is kebab and unique');
d = SO.createObject(st, d, 'hall', { sourceId: 'hall-sign', kind: 'sign', x: 2, y: 2, dialogue: 'new_dlg' });
ok(JSON.stringify(d.hall.objects[0]) === '{"sourceId":"hall-sign","type":"landmark","kind":"sign","x":2,"y":2,"dialogue":"new_dlg"}', 'create: type comes from the kind, single tile has no w/h');
const rect = SO.newObject(st, { sourceId: 'lake', kind: 'water', x: 0, y: 0, w: 2, h: 1, dialogue: 'pond_dlg' });
ok(rect.w === 2 && rect.h === 1, 'newObject with a size carries w and h');
throws(() => SO.createObject(st, d, 'hall', { sourceId: 'x', kind: 'tree', x: 1, y: 1, dialogue: 'new_dlg' }), /kind "tree" is not present in world\/scene-objects.json; pick one of sign, water/);
throws(() => SO.createObject(st, d, 'yard', { sourceId: 'pond', kind: 'water', x: 1, y: 1, dialogue: 'pond_dlg' }), /sourceId "pond" already exists in yard/);

// ---- interact: move, delete, create
d = SO.moveInteract(d, 'yard', '4,4', 5, 4);
ok(d.yard.interact[0].ref === '4,4' && d.yard.interact[0].x === 5, 'interact move keeps its ref and position');
const created = SO.createInteract(st, d, 'hall', { x: 1, y: 1, id: 'lamp' });
ok(created.ref === 'new-1' && created.draft.hall.interact[0].id === 'lamp', 'interact create gets ref new-1');
d = created.draft;
d = SO.deleteInteract(d, 'yard', '2,5');
ok(d.yard.interact.length === 1, 'interact delete');

// ---- changes + changeset
let cs = SO.buildObjectsChangeset(st, d);
ok(cs.format === 'scene-objects-changeset' && cs.version === 1 && cs.target === 'world/scene-objects.json', 'changeset header');
ok(JSON.stringify(cs.operations.map((o) => o.op + ' ' + o.scene + ' ' + (o.sourceId || o.interact))) ===
  JSON.stringify(['upsert yard pond', 'upsert yard post', 'upsert yard 4,4', 'delete yard 2,5', 'create hall hall-sign', 'create hall 1,1']), 'changeset: objects then interact, registry scene order', cs.operations);
ok(cs.operations[2].to === '5,4' && cs.operations[5].id === 'lamp', 'interact upsert carries to, create carries id');
ok(Object.keys(SO.draftErrors(ctx, st, d)).length === 0, 'the draft is valid');

// ---- revert
let r = SO.revertEntry(st, d, 'yard', { sourceId: 'pond' });
ok(r.yard.objects[0] === st.base.yard.objects[0], 'revert an object');
r = SO.revertEntry(st, d, 'yard', { ref: '2,5' });
ok(JSON.stringify(r.yard.interact.map((e) => e.ref)) === '["4,4","2,5"]', 'revert a deleted interact key puts it back in key order');
r = SO.revertEntry(st, SO.deleteObject(st.draft, 'yard', 'pond'), 'yard', { sourceId: 'pond' });
ok(JSON.stringify(r.yard.objects) === JSON.stringify(st.base.yard.objects), 'revert a deleted object puts it back at its position');
r = SO.revertEntry(st, d, 'hall', { sourceId: 'hall-sign' });
ok(r.hall.objects.length === 0, 'revert a created object removes it');
ok(SO.changes(st, SO.revertScene(st, SO.revertScene(st, d, 'yard'), 'hall')).length === 0, 'revertScene back to base');

// ---- draft validation
function errs(draft) { return [].concat.apply([], Object.values(SO.draftErrors(ctx, st, draft))); }
ok(/falls outside yard \(10x8\)/.test(errs(SO.moveObject(st.draft, 'yard', 'pond', 8, 1)).join()), 'rect outside the scene');
ok(/interact 12,1 falls outside yard/.test(errs(SO.moveInteract(st.draft, 'yard', '4,4', 12, 1)).join()), 'interact outside the scene');
ok(/two interact keys on 2,5/.test(errs(SO.moveInteract(st.draft, 'yard', '4,4', 2, 5)).join()), 'interact collision');
ok(/dialogue "ghost" does not exist/.test(errs(SO.createObject(st, st.draft, 'hall', { sourceId: 'g', kind: 'sign', x: 0, y: 0, dialogue: 'ghost' })).join()), 'NEW OBJECT dialogue must exist');
ok(/binds one dialogue id; cascades are hand-edited/.test(errs(SO.createObject(st, st.draft, 'hall', { sourceId: 'g', kind: 'sign', x: 0, y: 0, dialogue: ['new_dlg'] })).join()), 'NEW OBJECT with a cascade refused');
ok(/sourceId must be kebab-case/.test(errs(SO.createObject(st, st.draft, 'hall', { sourceId: 'Bad_Id', kind: 'sign', x: 0, y: 0, dialogue: 'new_dlg' })).join()), 'kebab-case sourceId');
ok(/may not start with "interact-"/.test(errs(SO.createObject(st, st.draft, 'hall', { sourceId: 'interact-1', kind: 'sign', x: 0, y: 0, dialogue: 'new_dlg' })).join()), 'reserved sourceId prefix');
ok(/interact id "gate" is not an INTERACT_DLG key/.test(errs(SO.createInteract(st, st.draft, 'hall', { x: 0, y: 0, id: 'gate' }).draft).join()), 'NEW interact id must be known');
ok(errs(SO.moveInteract(st.draft, 'yard', '2,5', 3, 5)).length === 0, 'moving an existing interact with an unlisted id is fine');

// ---- strict apply
const applied = SO.applyObjectsChangeset(DATA, cs);
ok(JSON.stringify(applied.data) === JSON.stringify(SO.registryWithDraft(st, d)), 'apply(buildChangeset(draft)) equals the draft registry');
ok(JSON.stringify(Object.keys(applied.data.scenes.yard.interact)) === '["5,4"]' && DATA.scenes.yard.interact['4,4'] === 'bell', 'apply works on a copy');
ok(applied.changes.length === 6 && applied.changes[0].before.w === 3 && applied.changes[0].after.w === 4, 'apply reports before/after');
const moveKeepOrder = SO.applyObjectsChangeset(DATA, { format: SO.FORMAT, version: 1, target: SO.TARGET, operations: [{ op: 'upsert', scene: 'yard', interact: '4,4', to: '9,9' }] });
ok(JSON.stringify(Object.keys(moveKeepOrder.data.scenes.yard.interact)) === '["9,9","2,5"]', 'a moved interact key keeps its place in key order');
function bad(ops) { return () => SO.applyObjectsChangeset(DATA, { format: SO.FORMAT, version: 1, target: SO.TARGET, operations: ops }); }
throws(bad([{ op: 'upsert', scene: 'yard', sourceId: 'post', object: Object.assign({}, DATA.scenes.yard.objects[1], { dialogue: 'post_dlg' }) }]), /changes "dialogue" of yard\/post; only x, y, w, h move/);
throws(bad([{ op: 'upsert', scene: 'yard', sourceId: 'post', object: Object.assign({}, DATA.scenes.yard.objects[1], { w: 2, h: 2 }) }]), /adds w\/h to single-tile object post/);
throws(bad([{ op: 'upsert', scene: 'yard', sourceId: 'pond', object: { sourceId: 'pond', type: 'landmark', kind: 'water', x: 1, y: 1, dialogue: 'pond_dlg' } }]), /drops w\/h from rect pond/);
throws(bad([{ op: 'create', scene: 'yard', sourceId: 'pond', object: DATA.scenes.yard.objects[0] }]), /creates yard\/pond, which already exists/);
throws(bad([{ op: 'create', scene: 'hall', sourceId: 'c', object: { sourceId: 'c', type: 't', kind: 'k', x: 0, y: 0, dialogue: ['x'] } }]), /must be one dialogue id \(cascades are hand-edited\)/);
throws(bad([{ op: 'delete', scene: 'yard', sourceId: 'pond' }, { op: 'delete', scene: 'yard', sourceId: 'pond' }]), /second operation on yard\/pond/);
throws(bad([{ op: 'delete', scene: 'attic', sourceId: 'pond' }]), /unknown scene "attic"/);
throws(bad([{ op: 'delete', scene: 'yard', interact: '9,9' }]), /unknown interact key yard "9,9"/);
throws(bad([{ op: 'upsert', scene: 'yard', interact: '4,4', to: '2,5' }]), /two interact keys on 2,5 after the changeset/);
throws(bad([{ op: 'upsert', scene: 'yard', interact: '4,4', to: '2,5', id: 'x' }]), /carries unknown field "id"/);
throws(bad([{ op: 'move', scene: 'yard', sourceId: 'pond' }]), /op must be upsert, create or delete/);
throws(bad([{ op: 'delete', scene: 'yard', sourceId: 'pond', interact: '4,4' }]), /exactly one of sourceId or interact/);
throws(() => SO.applyObjectsChangeset(DATA, { format: SO.FORMAT, version: 1, target: 'world/connections.json', operations: [] }), /target must be world\/scene-objects.json/);
throws(bad([{ op: 'upsert', scene: 'yard', sourceId: 'pond', object: Object.assign({}, DATA.scenes.yard.objects[0], { x: -3 }) }]), /object x,y must be non-negative integers/);
throws(bad([{ op: 'upsert', scene: 'yard', sourceId: 'pond', object: Object.assign({}, DATA.scenes.yard.objects[0], { h: 0 }) }]), /object w,h must be integers >= 1/);
throws(bad([{ op: 'create', scene: 'hall', sourceId: 'c', object: { sourceId: 'c', type: '', kind: 'k', x: 0, y: 0, dialogue: 'x' } }]), /object type must be a non-empty string/);
// a new key on the tile a base key just left is a different entry: the draft is valid, so apply must accept it too
{
  let d2 = SO.moveInteract(st.draft, 'yard', '4,4', 4, 6);
  d2 = SO.createInteract(st, d2, 'yard', { x: 4, y: 4, id: 'lamp' }).draft;
  ok(Object.keys(SO.draftErrors(ctx, st, d2)).length === 0 && JSON.stringify(SO.applyObjectsChangeset(DATA, SO.buildObjectsChangeset(st, d2)).data.scenes.yard.interact) === '{"4,6":"bell","2,5":"gate","4,4":"lamp"}', 'move a key away, create a new one on its tile: draft valid and apply agrees');
  let d3 = SO.deleteInteract(st.draft, 'yard', '2,5');
  d3 = SO.createInteract(st, d3, 'yard', { x: 2, y: 5, id: 'lamp' }).draft;
  ok(Object.keys(SO.draftErrors(ctx, st, d3)).length === 0 && JSON.stringify(SO.applyObjectsChangeset(DATA, SO.buildObjectsChangeset(st, d3)).data.scenes.yard.interact) === '{"4,4":"bell","2,5":"lamp"}', 'delete a key, create another on its tile: draft valid and apply agrees');
  throws(bad([{ op: 'create', scene: 'yard', interact: '2,5', id: 'lamp' }]), /two interact keys on 2,5 after the changeset/);
}

// ---- history over drafts
let h = History.create(st.draft);
h = History.commit(h, SO.moveObject(h.present, 'yard', 'post', 8, 0), { label: 'move' });
h = History.undo(h);
ok(h.present === st.draft && History.canRedo(h), 'drafts ride the shared history');

// ---- real registry: byte-stable round trip, one line per move
const REAL_TEXT = fs.readFileSync(path.join(ROOT, 'world', 'scene-objects.json'), 'utf8');
const REAL = JSON.parse(REAL_TEXT);
ok(JSON.stringify(REAL, null, 2) + '\n' === REAL_TEXT, 'world/scene-objects.json is canonical 2-space JSON');
const rs = SO.createObjectStore(REAL);
const signMove = SO.buildObjectsChangeset(rs, SO.moveObject(rs.draft, 'town', 'welcome-sign', 31, 30));
const nextText = JSON.stringify(SO.applyObjectsChangeset(REAL, signMove).data, null, 2) + '\n';
const a = REAL_TEXT.split('\n'), b = nextText.split('\n');
ok(a.length === b.length && a.filter((l, i) => l !== b[i]).join('|') === '          "x": 30,' && b.filter((l, i) => l !== a[i]).join('|') === '          "x": 31,', 'moving the welcome sign changes exactly its x line');
ok(JSON.stringify(SO.applyObjectsChangeset(REAL, SO.buildObjectsChangeset(rs, rs.draft)).data, null, 2) + '\n' === REAL_TEXT, 'empty changeset reproduces the bytes');
ok(SO.kinds(rs).map((k) => k.kind).join() === 'cemetery,tracks,waterfall,welcomesign', 'real kinds');

// ---- mission reference guard on the real missions
const missions = {};
fs.readdirSync(path.join(ROOT, 'narrative', 'missions')).forEach((f) => { const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'narrative', 'missions', f), 'utf8')); missions[m.mission] = m; });
ok(JSON.stringify(SO.missionReferences(missions, ['sign_oej'])) === '[{"mission":"M5","node":"m5_sign_oej","id":"sign_oej"}]', 'sign_oej is referenced by M5 node m5_sign_oej (target_id)');
ok(SO.missionReferences(missions, ['cartello', 'sign_town', 'landmark_tracks', 'landmark_tracks_vagone']).length === 0, 'prose mentioning "cartello" is not a reference');
ok(JSON.stringify(SO.dialogueIds(REAL.scenes.town.objects[2].dialogue)) === '["landmark_tracks_vagone","landmark_tracks_route","landmark_tracks"]', 'dialogueIds walks a cascade');

// ---- bundle split knows the third target
const parts = Cast.splitChangesets({ format: Cast.BUNDLE_FORMAT, version: 1, changesets: [
  { format: 'world-connections-changeset', version: 2, target: 'world/connections.json', operations: [{ op: 'delete', id: 'x' }] },
  { format: Cast.FORMAT, version: 1, target: Cast.TARGET, operations: [] },
  signMove] });
ok(parts.map((p) => p.target).join() === 'world/connections.json,narrative/cast/windows.json,world/scene-objects.json', 'bundle splits into three targets');
throws(() => Cast.splitChangesets({ format: Cast.BUNDLE_FORMAT, version: 1, changesets: [signMove, signMove] }), /second changeset for world\/scene-objects.json/);
throws(() => Cast.splitChangesets({ format: SO.FORMAT, version: 1, target: 'world/connections.json', operations: [] }), /scene objects changeset targeting "world\/connections.json"/);
throws(() => Cast.splitChangesets({ target: 'world/scene-objects.json', operations: [] }), /without format scene-objects-changeset/);
ok(Cast.buildBundle([null, signMove]) === signMove, 'a single live changeset exports bare');

console.log('EDITOR-SCENE-OBJECTS-PASS ' + pass);
