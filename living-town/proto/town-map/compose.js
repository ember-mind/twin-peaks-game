// compose.js — writes town.json: the same street, rebuilt from the kit.
// Ground is authored here as rows; objects are placed on the grid near where
// the painting had them (their `source`), snapped to whole tiles.
var fs = require('fs');
var kit = JSON.parse(fs.readFileSync(__dirname + '/../town-kit/objects.json', 'utf8'));
var W = 48, H = 27, T = 16;

function row(fill, spans) { var r = new Array(W + 1).join(fill).split(''); (spans || []).forEach(function (s) { for (var x = s[0]; x <= s[1]; x++) r[x] = s[2]; }); return r.join(''); }
var ground = [];
for (var y = 0; y < 7; y++) ground.push(row('G'));
// front gardens with a paved path from every door, the café terrace
var paths = [[5, 6, 'p'], [13, 14, 'p'], [19, 27, 'p'], [31, 32, 'p'], [40, 41, 'p']];
ground.push(row('G', paths)); ground.push(row('G', paths)); ground.push(row('G', paths)); ground.push(row('G', paths));
ground.push(row('k'));                                   // 11 kerb
ground.push(row('c')); ground.push(row('c')); ground.push(row('c'));   // 12-14 street
// East end: the bridge's road is the street's own cobbles running down a
// ramp to the right of its parapet; left of the parapet, water under the arch.
// First cobble column per row follows the parapet's diagonal.
var RAMP = { 15: 42, 16: 43, 17: 44, 18: 45, 19: 45, 20: 46, 21: 47 };
function east(y, base) { var spans = [[41, 47, 'w']]; if (RAMP[y] != null) spans.push([RAMP[y], 47, 'c']); return row(base, base === 'g' ? [[21 + (y === 15 ? -1 : 0), 23 + (y === 15 ? 1 : 0), 'p']].concat(spans) : spans); }
ground.push(east(15, 'g')); ground.push(east(16, 'g')); ground.push(east(17, 'g'));   // 15-17 lawn to the bridge pillar
ground.push(east(18, 't'));                                                          // 18 coping
ground.push(east(19, 'f'));                                                          // 19 wall face
for (y = 20; y < H; y++) ground.push(RAMP[y] != null ? row('w', [[RAMP[y], 47, 'c']]) : row('w'));

var SKIP = { backdrop: 1, 'fence-iron': 1, 'fence-wood': 1, balustrade: 1, embankment: 1, 'embankment-run-1': 1, 'embankment-run-2': 1 };
var objects = kit.filter(function (k) { return !SKIP[k.id]; }).map(function (k) {
  return { kit: k.id, id: k.id, tx: Math.round((k.source[0] + k.anchor[0]) / T), ty: Math.round((k.source[1] + k.anchor[1]) / T) };
});
/* Long runs cut from the painting have holes where a tree or lamp stood in
 * front of them; placed anew those holes show. Runs are rebuilt from the
 * kit's repeatable 32 px segments instead. */
objects = objects.filter(function (o) { return !/^(balustrade-run|fence-iron-|fence-wood-|gate-post-|wall-garden-low)/.test(o.id); });
function lay(kitId, ty, x0, x1, tag) { for (var x = x0; x + 1 <= x1; x += 2) objects.push({ kit: kitId, id: tag + '-' + x, tx: x, ty: ty }); }
// railing along the top of the park: west of the steps and east of them, to the bridge pillar
lay('balustrade', 15, 2, 19, 'rail-w'); lay('balustrade', 15, 26, 39, 'rail-e');
// park bushes sit on the lawn, not on the river wall's coping
objects.forEach(function (o) { if (/^bush-park-[2-6]$/.test(o.id)) o.ty -= 1; });
var byId = {}; objects.forEach(function (o) { byId[o.id] = o; });

var map = {
  w: W, h: H, tile: T, seed: 7,
  legend: { G: 'garden', p: 'paving', k: 'kerb', c: 'cobble', g: 'grass', t: 'embankment_top', f: 'embankment_face', w: 'water' },
  ground: ground,
  backdrop: { x: 0, y: 0 },
  objects: objects,
  places: { flat_a: 'cottage-1', flat_b: 'cottage-2', cafe: 'cafe', flat_c: 'cafe', flat_d: 'cottage-3', flat_e: 'cottage-4' },
  spots: {},
  residents: [
    { id: 'resident_a', name: 'Ada', home: 'flat_a' }, { id: 'resident_b', name: 'Bruno', home: 'flat_b' },
    { id: 'resident_c', name: 'Clara', home: 'flat_c' }, { id: 'resident_d', name: 'Dario', home: 'flat_d' },
    { id: 'resident_e', name: 'Elsa', home: 'flat_e' }
  ],
  walkable: [], blocked: []
};
// benches: sit on the bench, stand on the tile in front of it
['bench-1', 'bench-2'].forEach(function (id, i) {
  var o = byId[id];
  map.spots['bench_' + (i ? 'e' : 'w')] = { tx: o.tx + 1, ty: o.ty + 1, seats: [[-8, -23], [9, -23]] };
});
// the jetty's boards run out over the wall and the water below the steps
[[21, 18], [22, 18], [23, 18], [21, 19], [22, 19], [23, 19], [21, 20], [22, 20], [23, 20]].forEach(function (c) { map.walkable.push(c); });
map.spots.jetty_end = { tx: 22, ty: 20 };
map.spots.lawn_w = { tx: 9, ty: 16 };
// the bridge deck runs down to the right over the water
map.spots.bridge = { tx: 45, ty: 17 };
// garden fences along the pavement, with a gate gap in front of every door
var WM = require('../../../engine/ember-worldmap.js');
var probe = WM.build(map, { objects: kit, tileSet: JSON.parse(fs.readFileSync(__dirname + '/../town-kit/ground/ground.json', 'utf8')) }), gaps = {};
Object.keys(probe.places).forEach(function (n) {
  var pl = probe.places[n]; if (!pl.indoor) return;
  var gx = Math.round((pl.feet[0] - 16) / 16); gaps[gx] = gaps[gx + 1] = true;
});
function fenceRun(x0, x1, kitId) {
  for (var x = x0; x + 1 <= x1; x++) {
    if (gaps[x] || gaps[x + 1]) continue;
    map.objects.push({ kit: kitId, id: 'fence-' + x, tx: x, ty: 10 }); x++;
  }
  Object.keys(gaps).forEach(function (g) {
    g = +g; if (g < x0 || g > x1 || gaps[g - 1]) return;
    map.objects.push({ kit: 'gate-post-1', id: 'post-' + g + 'a', tx: g - 1, ty: 10 });
    map.objects.push({ kit: 'gate-post-1', id: 'post-' + g + 'b', tx: g + 2, ty: 10 });
  });
}
fenceRun(0, 18, 'fence-iron'); fenceRun(28, 41, 'fence-iron'); fenceRun(42, 47, 'fence-wood');
map.walkable = map.walkable.concat(Object.keys(gaps).map(function (g) { return [+g, 10]; }));
fs.writeFileSync(__dirname + '/town.json', JSON.stringify(map, null, 1));
console.log('objects', objects.length, 'places', Object.keys(map.places).length, 'spots', Object.keys(map.spots).join(','));
