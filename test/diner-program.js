#!/usr/bin/env node
'use strict';

/* Double R authoring Program: real production chain, native geometry only. */
const assert = require('node:assert/strict');
const path = require('node:path');

const noop = () => {};
let now = 0;
global.window = global;
global.performance = { now: () => now };
global.requestAnimationFrame = noop;
global.setInterval = () => 0;
global.addEventListener = noop;
global.removeEventListener = noop;
global.localStorage = { getItem: () => null, setItem: noop, removeItem: noop };
global.innerWidth = 256;
global.innerHeight = 192;
try { global.navigator = { maxTouchPoints: 0 }; } catch (error) { /* Node may expose a read-only navigator getter. */ }

const context = new Proxy({
  measureText: (text) => ({ width: String(text).length * 5 }),
  imageSmoothingEnabled: false
}, {
  get(target, key) { return key in target ? target[key] : noop; },
  set(target, key, value) { target[key] = value; return true; }
});
const elements = {};
function element(id) {
  return elements[id] || (elements[id] = {
    id, hidden: false, disabled: false, textContent: '', style: {},
    classList: { toggle: noop, add: noop, remove: noop },
    getContext: () => context, addEventListener: noop,
    setAttribute: noop, removeAttribute: noop, getAttribute: () => null
  });
}
global.document = {
  readyState: 'loading', body: { classList: { toggle: noop }, setAttribute: noop },
  getElementById: element, createElement: () => element('created'), addEventListener: noop
};
global.GAME = {};

const js = (name) => require(path.join(__dirname, '..', 'js', name));

/* These are the same source modules consumed by index.html. Keep the scene
 * installers explicit: World.catalog validates programs against their map
 * layouts at registration time. */
[
  'tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js',
  'environmental-inspect.js', 'retro-font.js', 'portraits.js', 'gold-tone.js',
  'engine.js', 'scene-objects.gen.js', 'glue.js', 'retro.js',
  'retro-cast-matrices-a.js', 'retro-cast-matrices-b.js', 'retro-authored.js',
  'ambient-life.js', 'character-activity.js', 'environment-reactions.js',
  'ambient-life-scenes.js', 'location-connections.js', 'world-connections.gen.js',
  'double-r-exterior-art.js', 'double-r-exterior-scene.js',
  'sheriffs-station-art.js', 'sheriffs-station-exterior-art.js',
  'sheriffs-station-scene.js', 'sheriffs-station-exterior-scene.js'
].forEach(js);

const map = GAME.Maps.diner;
assert(map, 'real normalized diner map loads before the native installer');
const rowsBefore = map.rows.slice();
const interiorBefore = JSON.parse(JSON.stringify(map.interior));

/* The installer derives and exposes layout; it must not become a second
 * source of rows/interior/collision. */
js('double-r-location-production.js');
assert.deepEqual(map.rows, rowsBefore, 'Double R layout install preserves map rows');
assert.deepEqual(map.interior, interiorBefore, 'Double R layout install preserves diner interior model');
js('sheriffs-station-production.js');
js('world-connections-production.js');
js('world-engine.js');
js('world-catalog.js');

assert.deepEqual(map.rows, rowsBefore, 'layout installation preserves map rows');
assert.deepEqual(map.interior, interiorBefore, 'layout installation preserves the diner interior model');
assert(map.layout && map.layout.footprints && map.layout.targets, 'diner exposes a native layout boundary');
assert.strictEqual(map.layout, GAME.Maps.diner.layout, 'layout is installed on the normalized diner map');

const environment = GAME.World.getEnvironment('double-r', 'interior');
assert(environment && environment.program, 'Double R interior carries the authored Program');
const program = environment.program;
const layout = map.layout;
const footprints = layout.footprints;
const targets = layout.targets;

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function cellsFromRect(rect) {
  const [x, y, width, height = 1] = rect;
  const cells = [];
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) cells.push([x + dx, y + dy]);
  }
  return cells;
}

function cellsFromPoint(point) {
  return [[point[0], point[1]]];
}

function canonicalCells(cells) {
  return cells.map(([x, y]) => [x, y]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

function assertFootprint(name, expected, glyph) {
  assert(Array.isArray(footprints[name]), name + ' footprint exists');
  assert.deepEqual(canonicalCells(footprints[name]), canonicalCells(expected),
    name + ' footprint mirrors the diner source model');
  for (const [x, y] of footprints[name]) {
    assert(Number.isInteger(x) && Number.isInteger(y), name + ' footprint uses integer tiles');
    assert(y >= 0 && y < map.height && x >= 0 && x < map.width,
      name + ' cell is in map bounds');
    if (glyph) assert.equal(map.rows[y].charAt(x), glyph, name + ' cell preserves its authored glyph');
    assert(GAME.Maps.isSolid('diner', x, y, { clues: [] }),
      name + ' footprint cell is backed by a solid map glyph');
  }
}

const model = map.interior;
const [counterX, counterY, counterWidth] = model.counter;
assertFootprint('counter', cellsFromRect([counterX, counterY, counterWidth, 1]), 'C');
model.stools.forEach((point, index) => assertFootprint('stool-' + index, cellsFromPoint(point), 'h'));
model.booths.forEach(([x, y, width], index) => {
  const expected = cellsFromRect([x, y, width, 1]);
  /* Booth footprint includes the authored raised backrest cells as well as
   * the table row; these are present in rows.js, not duplicated in interior. */
  const backrestStart = x === 1 ? x : x + width - 1;
  const backrestEnd = x === 1 ? x + 1 : x + width - 1;
  for (let backrestX = backrestStart; backrestX <= backrestEnd; backrestX++) {
    expected.push([backrestX, y - 1]);
  }
  assertFootprint('booth-' + index, expected);
  for (let tableX = x; tableX < x + width; tableX++) {
    assert.equal(map.rows[y].charAt(tableX), 't', 'booth-' + index + ' table preserves its authored glyph');
  }
  for (let backrestX = backrestStart; backrestX <= backrestEnd; backrestX++) {
    assert.equal(map.rows[y - 1].charAt(backrestX), 'h', 'booth-' + index + ' backrest preserves its authored glyph');
  }
});
assertFootprint('wall-plant', cellsFromPoint(model.plant), 'h');
assertFootprint('coat-rack', cellsFromPoint(model.coatRack), 'h');
const [specialsX, specialsY, specialsWidth, specialsHeight] = model.specials;
assertFootprint('specials', cellsFromRect([specialsX, specialsY, specialsWidth, specialsHeight]), 't');
assertFootprint('island-plant', cellsFromPoint(model.islandPlant), 'h');

/* Every declared Program reference must resolve through the native layout. */
const activityIds = new Set(program.activities.map((activity) => activity.id));
for (const group of program.groups) {
  for (const anchor of group.anchors) assert(hasOwn(footprints, anchor),
    'group ' + group.id + ' anchor ' + anchor + ' resolves');
  for (const activity of group.activities) assert(activityIds.has(activity),
    'group ' + group.id + ' activity ' + activity + ' resolves');
}
for (const contribution of program.contributions || []) {
  assert(hasOwn(footprints, contribution.anchor),
    'contribution anchor ' + contribution.anchor + ' resolves');
}
for (const item of (program.residue && program.residue.ambient) || []) {
  assert(hasOwn(footprints, item.anchor), 'residue anchor ' + item.anchor + ' resolves');
}
for (const relationship of program.relationships || []) {
  const table = relationship.kind === 'NEAR' ? footprints : targets;
  assert(hasOwn(table, relationship.from), relationship.kind + ' from anchor resolves');
  assert(hasOwn(table, relationship.to), relationship.kind + ' to anchor resolves');
}

function adjacent(left, right) {
  return left.some(([x1, y1]) => right.some(([x2, y2]) =>
    Math.abs(x1 - x2) + Math.abs(y1 - y2) === 1));
}
for (const relationship of (program.relationships || []).filter((item) => item.kind === 'NEAR')) {
  assert(adjacent(footprints[relationship.from], footprints[relationship.to]),
    'NEAR endpoints are tile-adjacent: ' + relationship.from + ' -> ' + relationship.to);
}

function walkable(point) {
  return point && Number.isInteger(point.x) && Number.isInteger(point.y) &&
    !GAME.Maps.isSolid('diner', point.x, point.y, { clues: [] });
}

function hasPath(from, to) {
  if (!walkable(from) || !walkable(to)) return false;
  const queue = [from];
  const seen = new Set([from.x + ',' + from.y]);
  for (let i = 0; i < queue.length; i++) {
    const point = queue[i];
    if (point.x === to.x && point.y === to.y) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { x: point.x + dx, y: point.y + dy };
      const key = next.x + ',' + next.y;
      if (seen.has(key) || !walkable(next)) continue;
      seen.add(key); queue.push(next);
    }
  }
  return false;
}

function pathVia(from, via, to) {
  return hasPath(from, via) && hasPath(via, to);
}

for (const relationship of (program.relationships || []).filter((item) => item.kind === 'REACHABLE')) {
  assert(hasPath(targets[relationship.from], targets[relationship.to]),
    'REACHABLE endpoints have a walkable collision path: ' + relationship.from + ' -> ' + relationship.to);
}

const reachable = (program.relationships || []).find((item) => item.kind === 'REACHABLE' &&
  item.from === 'entrance' && item.to === 'service-approach');
assert(reachable, 'Program declares entrance-to-service-approach reachability');
const entrance = targets.entrance;
const serviceApproach = targets['service-approach'];
const islandCells = [].concat(footprints.specials, footprints['island-plant']);
const islandMinX = Math.min(...islandCells.map(([x]) => x));
const islandMaxX = Math.max(...islandCells.map(([x]) => x));
const leftBypass = { x: islandMinX - 1, y: model.islandPlant[1] };
const rightBypass = { x: islandMaxX + 1, y: model.islandPlant[1] };
assert(walkable(leftBypass) && walkable(rightBypass), 'both center-island bypass cells are walkable');
assert(pathVia(entrance, leftBypass, serviceApproach), 'reachable path uses the left side of the center island');
assert(pathVia(entrance, rightBypass, serviceApproach), 'reachable path uses the right side of the center island');

function assertDeepFrozen(value, label) {
  if (!value || typeof value !== 'object') return;
  assert(Object.isFrozen(value), label + ' is frozen');
  for (const key of Object.keys(value)) assertDeepFrozen(value[key], label + '.' + key);
}
assertDeepFrozen(program, 'Double R Program');
assertDeepFrozen(layout, 'derived diner layout view');
assert.equal(Object.prototype.propertyIsEnumerable.call(map, 'layout'), false,
  'derived layout does not join copied map fields');

function assertNoOwnershipKeys(value, label) {
  if (!value || typeof value !== 'object') return;
  for (const key of Object.keys(value)) {
    assert(!/^(?:npc|npcs|door|doors|x|y|tx|ty|coord|coords|coordinate|coordinates)$/i.test(key),
      label + ' does not own runtime ' + key + ' state');
    assertNoOwnershipKeys(value[key], label + '.' + key);
  }
}
assertNoOwnershipKeys(program, 'Double R Program');

console.log('DINER-PROGRAM-PASS real catalog/layout chain, source preservation, anchors, reachability and immutable intent');
