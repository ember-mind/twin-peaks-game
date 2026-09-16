'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { compileTargets } = require('../js/editor/core/narrative-targets.js');
const root = path.resolve(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const copy = (v) => JSON.parse(JSON.stringify(v));
const data = read('world/narrative-targets.json'), objects = read('world/scene-objects.json');
const baseline = read('test/fixtures/narrative-targets-before-registry.json');
const original = JSON.stringify({ data, objects });
const compiled = compileTargets(data, objects);
assert.deepEqual(compiled, baseline, 'all 14 authored identities, kinds and coordinates remain unchanged');
assert.equal(data.targets.length, 14);
assert.equal(JSON.stringify({ data, objects }), original, 'compiler must not mutate source data');
assert.deepEqual(compileTargets({ ...data, targets: data.targets.slice().reverse() }, objects), baseline, 'authoring order does not change meaning');
const moved = copy(objects);
delete moved.scenes.traincar.interact['4,6']; moved.scenes.traincar.interact['5,6'] = 'sign_ponte';
assert.deepEqual(compileTargets(data, moved).traincar.bridge_rail, { x: 5, y: 6, kind: 'landmark' });
const deleted = copy(objects); delete deleted.scenes.traincar.interact['4,6'];
assert.throws(() => compileTargets(data, deleted), /sign_ponte resolves to 0/);
const ambiguous = copy(objects); ambiguous.scenes.traincar.interact['5,6'] = 'sign_ponte';
assert.throws(() => compileTargets(data, ambiguous), /sign_ponte resolves to 2/);
for (const mutate of [
  (d) => { d.version = 2; }, (d) => { d.extra = true; },
  (d) => { d.targets.push(copy(d.targets[0])); }, (d) => { d.targets[0].scene = 'missing'; },
  (d) => { d.targets[0].id = '__proto__'; }, (d) => { d.targets[0].kind = 'actor'; },
  (d) => { d.targets[0].position = { x: 4, y: 6 }; }, (d) => { delete d.targets[0].bind; },
  (d) => { d.targets[0].bind.objectId = 'a'; }, (d) => { d.targets[4].position.x = -1; },
  (d) => { d.targets[4].position.y = 1.5; }, (d) => { d.targets[4].position.x = Number.MAX_SAFE_INTEGER + 1; },
  (d) => { d.targets[4].position = { x: 4, y: 6 }; }, (d) => { d.targets[4].position.extra = true; }
]) { const d = copy(data); mutate(d); assert.throws(() => compileTargets(d, objects)); }
const linkedObject = { version: 1, targets: [{ scene: 'town', id: 'entrance_sign', kind: 'sign', bind: { objectId: 'welcome-sign' } }] };
assert.equal(compileTargets(linkedObject, objects).town.entrance_sign.x, 30);
const movedObject = copy(objects); movedObject.scenes.town.objects.find((o) => o.sourceId === 'welcome-sign').x = 31;
assert.equal(compileTargets(linkedObject, movedObject).town.entrance_sign.x, 31);
const context = { GAME: {} }; context.window = context; vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'js/scene-objects.gen.js'), 'utf8'), context);
assert.deepEqual(copy(context.GAME.WorldData.narrativeTargets), baseline);
assert.ok(Object.isFrozen(context.GAME.WorldData.narrativeTargets));
assert.ok(Object.isFrozen(context.GAME.WorldData.narrativeTargets.traincar.bridge_rail));
vm.runInContext(fs.readFileSync(path.join(root, 'js/narrative-engine-adapter.js'), 'utf8'), context);
assert.equal(context.GAME.NarrativeAdapter.isEnabled(), false);
delete context.GAME.WorldData.narrativeTargets;
assert.throws(() => context.GAME.NarrativeAdapter.enable(), /load generated narrative targets/);
assert.equal(context.GAME.NarrativeAdapter.isEnabled(), false, 'missing data must fail before enabling');
let references = 0;
for (const name of fs.readdirSync(path.join(root, 'narrative/missions')).filter((f) => f.endsWith('.json'))) {
  for (const node of read('narrative/missions/' + name).nodes || []) {
    if (!['object', 'landmark', 'sign'].includes(node.target_kind)) continue;
    const target = compiled[node.map_id] && compiled[node.map_id][node.target_id];
    assert.ok(target, name + ':' + node.id + ' must reference a canonical target');
    assert.equal(target.kind, node.target_kind, name + ':' + node.id + ' kind agrees'); references++;
  }
}
assert.equal(references, 18, 'current environmental mission roots retain coverage');
console.log('narrative-targets: 14 targets, 18 mission bindings, parity, explicit movement/deletion, ambiguity, immutability and fail-closed contracts PASS');
