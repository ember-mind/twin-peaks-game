#!/usr/bin/env node
/* gen-town-map.js — Living Town: the simulation's outdoor grid, from the kit map.
 *
 * The town outside is drawn by the shared engine from the village kit
 * (proto/town-kit) and its map (proto/town-map/town.json). The simulation
 * does not load the engine's art or its map format: it walks a grid of
 * characters like every other place. This writes that grid, generated from the
 * same collision the engine computes (EMBER.WorldMap.build), so what people
 * walk round is exactly what is drawn.
 *
 *   node living-town/tools/gen-town-map.js          write js/lt-town.gen.js
 *   node living-town/tools/gen-town-map.js --check  exit 1 if it is stale
 *
 * Cells
 *   #  blocked, and hides what is behind it (a house, a tree, the gardens
 *      behind the houses nobody walks in)
 *   f  blocked, seen through (fence, lamp post, bench, bin, planter)
 *   w  water           ,  grass           -  paving, cobble, jetty
 *   D  a building's door (walkable)
 * Zones: `p` the park (the lawn and the jetty south of the street),
 *        `s` the street (everything else one can stand on), ' ' nowhere.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const LT_DIR = path.join(__dirname, '..');
const ROOT = path.join(LT_DIR, '..');
const KIT_DIR = path.join(LT_DIR, 'proto', 'town-kit');
const MAP_FILE = path.join(LT_DIR, 'proto', 'town-map', 'town.json');
const OUT = path.join(LT_DIR, 'js', 'lt-town.gen.js');

const WM = require(path.join(ROOT, 'engine', 'ember-worldmap.js'));
const kit = JSON.parse(fs.readFileSync(path.join(KIT_DIR, 'kit.json'), 'utf8'));
const tileSet = JSON.parse(fs.readFileSync(path.join(KIT_DIR, kit.tileSet), 'utf8'));
const objectsFile = JSON.parse(fs.readFileSync(path.join(KIT_DIR, kit.objects), 'utf8'));
const kitObjects = Array.isArray(objectsFile) ? objectsFile : objectsFile.objects;
const mapText = fs.readFileSync(MAP_FILE, 'utf8');
const map = JSON.parse(mapText);
const world = WM.build(map, { tileSet: tileSet, objects: kitObjects });
const W = world.W, H = world.H;

const OPAQUE_KINDS = { building: true, tree: true, backdrop: true };
const PAVED = { paving: true, cobble: true, kerb: true };
const PARK_ROW = 15, PARK_EAST = 39;   // the lawn and the jetty; the bridge ramp east of it is street

/* Doors: one per place with a building, at the tile its door leaf is centred on. */
const doors = {};
Object.keys(world.places).sort().forEach((name) => {
  const p = world.places[name];
  if (p.indoor) doors[name] = { x: p.tile[0], y: p.tile[1] };
});
const doorAt = {};
Object.keys(doors).forEach((n) => { doorAt[doors[n].x + ',' + doors[n].y] = true; });
const lowestDoorRow = Math.max.apply(null, Object.keys(doors).map((n) => doors[n].y));

/* Which cells an object's footprint hides, as opposed to merely blocks. */
const opaque = new Uint8Array(W * H);
world.objects.forEach((o) => {
  if (!OPAQUE_KINDS[o.kit.kind] || o.walkable) return;
  (o.kit.footprint || []).forEach((f) => {
    const x = o.tx + f[0], y = o.ty + f[1];
    if (x >= 0 && y >= 0 && x < W && y < H) opaque[y * W + x] = 1;
  });
});

const rows = [], zones = [];
for (let y = 0; y < H; y++) {
  let row = '', zone = '';
  for (let x = 0; x < W; x++) {
    const i = y * W + x, mat = WM.materialAt(map, x, y);
    let ch;
    if (doorAt[x + ',' + y]) ch = 'D';
    else if (y <= lowestDoorRow) ch = '#';          // behind the fronts: gardens nobody walks in
    else if (world.blocked[i]) ch = opaque[i] ? '#' : (mat === 'water' ? 'w' : (mat === 'embankment_face' ? '#' : 'f'));
    else ch = PAVED[mat] || mat === 'water' ? '-' : ',';   // walkable water is the jetty
    row += ch;
    zone += ch === '#' || ch === 'f' || ch === 'w' ? ' ' : (y >= PARK_ROW && x <= PARK_EAST ? 'p' : 's');
  }
  rows.push(row); zones.push(zone);
}

/* Everyone must be able to reach every door and the park from every other. */
function reach(from) {
  const seen = new Uint8Array(W * H), q = [from]; seen[from.y * W + from.x] = 1;
  while (q.length) {
    const c = q.shift();
    [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy]) => {
      const x = c.x + dx, y = c.y + dy;
      if (x < 0 || y < 0 || x >= W || y >= H || seen[y * W + x] || '#fw'.indexOf(rows[y][x]) >= 0) return;
      seen[y * W + x] = 1; q.push({ x, y });
    });
  }
  return seen;
}
/* The park's own entry point: the middle of the lawn, on the path down from
 * the street, with the ends of both benches in sight (W.SIGHT_CELLS). */
const parkEntry = { x: 22, y: 17 };
const seen = reach(parkEntry);
Object.keys(doors).forEach((n) => {
  if (!seen[doors[n].y * W + doors[n].x]) throw new Error('door of ' + n + ' cannot be reached from the park');
});
/* Cells nobody can reach are closed: nobody is ever placed where they could not walk out. */
for (let y = 0; y < H; y++) {
  let row = '', zone = '';
  for (let x = 0; x < W; x++) {
    const open = '#fw'.indexOf(rows[y][x]) < 0;
    row += open && !seen[y * W + x] ? 'f' : rows[y][x];
    zone += open && !seen[y * W + x] ? ' ' : zones[y][x];
  }
  rows[y] = row; zones[y] = zone;
}

const spots = {};
Object.keys(map.spots || {}).sort().forEach((n) => { spots[n] = { x: map.spots[n].tx, y: map.spots[n].ty }; });

let h = 0x811c9dc5;
for (let i = 0; i < mapText.length; i++) { h ^= mapText.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }

const data = {
  source: 'living-town/proto/town-map/town.json', mapHash: ('0000000' + h.toString(16)).slice(-8),
  w: W, h: H, rows: rows, zones: zones, doors: doors, parkEntry: parkEntry, spots: spots
};
const text = '/* lt-town.gen.js — GENERATED by living-town/tools/gen-town-map.js from the kit map.\n' +
  ' * Do not edit: change the map (engine/tools/kit-editor.html) and regenerate. */\n' +
  '(function () {\n' +
  '  var root = (typeof window !== \'undefined\') ? window : global;\n' +
  '  var LT = root.LT = root.LT || {};\n' +
  '  LT.TownMap = ' + JSON.stringify(data, null, 1).replace(/\n\s*/g, ' ').replace(/\[ /g, '[').replace(/ \]/g, ']') + ';\n' +
  '})();\n';

if (process.argv.includes('--check')) {
  const have = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (have !== text) { console.error('lt-town.gen.js is stale: run node living-town/tools/gen-town-map.js'); process.exit(1); }
  console.log('lt-town.gen.js is current (' + data.mapHash + ')');
} else {
  fs.writeFileSync(OUT, text);
  console.log('wrote ' + path.relative(ROOT, OUT) + ' (' + W + 'x' + H + ', map ' + data.mapHash + ')');
  rows.forEach((r, y) => console.log(String(y).padStart(2) + ' ' + r + '  ' + zones[y]));
}
