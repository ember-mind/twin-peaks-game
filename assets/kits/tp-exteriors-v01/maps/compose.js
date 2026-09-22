// compose.js — writes main-street.json: a short Twin Peaks street in the
// engine's map format (engine/ember-worldmap.js), made of this kit.
//
// North side: the Double R and its lot, a verge of pines with the roadside
// sign, the sheriff's station with its flagpole and fence. A sidewalk runs
// in front of both, then the lots, the road with its centre line, the far
// sidewalk, a verge with street lights and the forest.
//
// Objects that stand against a building are placed on that building's own
// tile grid (build-objects.py aligns them), so they sit where the concept
// has them. Run: node compose.js
var fs = require('fs'), path = require('path');
var KIT = path.join(__dirname, '..');
var kit = JSON.parse(fs.readFileSync(path.join(KIT, 'objects.json'), 'utf8'));
var tileSet = JSON.parse(fs.readFileSync(path.join(KIT, 'ground/ground.json'), 'utf8'));
var W = 44, H = 22, T = 16;

function row(fill, spans) {
  var r = new Array(W + 1).join(fill).split('');
  (spans || []).forEach(function (s) { for (var x = s[0]; x <= s[1]; x++) r[x] = s[2]; });
  return r.join('');
}
var ground = [];
// 0-4 behind the buildings: forest duff, the verge between the two lots
for (var y = 0; y < 5; y++) ground.push(row('f', [[15, 20, 'g'], [35, 43, y < 3 ? 'f' : 'g']]));
// 5-6 the buildings' rows; grass round them
// under each facade the walk runs up to the wall, as in both concepts
ground.push(row('g', [[0, 1, 'f'], [2, 14, 'c'], [21, 33, 'c']])); ground.push(row('g', [[2, 14, 'c'], [21, 34, 'c']]));
ground.push(row('c')); ground.push(row('c'));                         // 7-8 sidewalk (kerb on row 8)
for (y = 9; y < 17; y++) ground.push(row('a'));                        // 9-12 lots, 13-16 road
ground.push(row('c'));                                                 // 17 far sidewalk
ground.push(row('g'));                                                 // 18 verge
ground.push(row('g', [[0, 5, 'f'], [12, 25, 'f'], [33, 43, 'f']]));    // 19 forest edge
ground.push(row('f')); ground.push(row('f'));                          // 20-21 forest

var objects = [];
function put(kitId, tx, ty, id) { objects.push({ kit: kitId, id: id || (kitId + '@' + tx + ',' + ty), tx: tx, ty: ty }); }

// the Double R: footprint cols 2-14, rows 5-6; planters one row in front
var DR = { tx: 2, ty: 5 };
put('double-r', DR.tx, DR.ty, 'double-r');
put('planter-l', DR.tx + 1, DR.ty + 2); put('planter-r', DR.tx + 10, DR.ty + 2);
put('light-spill', DR.tx + 5, DR.ty + 2, 'diner-light');
put('bin', 1, 6, 'bin');
// the verge between the lots: sign, bushes, pines, a street light
put('rr-sign', 16, 6, 'rr-sign');
put('bush-2', 16, 7); put('bush-1', 15, 5);
put('pine-xl', 17, 5); put('pine-l', 19, 4); put('pine-m', 16, 3); put('pine-l2', 20, 2);
put('street-lamp', 18, 8, 'lamp-verge');
// the station: footprint cols 21-33, rows 5-6; bench, shrubs, flagpole in front
var SH = { tx: 21, ty: 5 };
put('sheriff-station', SH.tx, SH.ty, 'sheriff-station');
put('bench', SH.tx + 2, SH.ty + 2, 'bench');
put('shrub-1', SH.tx, SH.ty + 2);
put('shrub-2', SH.tx + 10, SH.ty + 2); put('shrub-3', SH.tx + 11, SH.ty + 2); put('shrub-4', SH.tx + 12, SH.ty + 2);
put('flagpole', SH.tx + 13, SH.ty + 2, 'flagpole');
// split-rail fence east of the station, pines behind it
for (var fx = 35; fx <= 41; fx += 2) put('fence', fx, 6);
put('fence-post', 43, 6);
put('pine-xl', 36, 4); put('pine-l2', 39, 3); put('pine-l', 42, 5); put('pine-m2', 38, 2);
// west end: forest
put('pine-l', 0, 5); put('pine-m2', 1, 3); put('pine-xl', 0, 2);

// lots: stall lines, wheel stops, repairs; leave each door's approach clear
[3, 6, 12, 15].forEach(function (x) { put('stall-line', x, 11); });
[4, 13].forEach(function (x) { put('wheel-stop', x, 9); });
[22, 25, 31, 34].forEach(function (x) { put('stall-line', x, 11); });
[23, 32].forEach(function (x) { put('wheel-stop', x, 9); });
put('asphalt-patch-1', 8, 13); put('asphalt-patch-2', 29, 12); put('asphalt-patch-3', 18, 14);
put('asphalt-patch-4', 38, 15); put('asphalt-patch-1', 33, 15); put('asphalt-patch-2', 2, 15);
// road centre line
for (var dx = 0; dx < W; dx += 2) put('road-dash', dx, 15);
// far side: street lights on the verge, pines and bushes along the forest edge
[5, 19, 33].forEach(function (x, i) { put('street-lamp', x, 18, 'lamp-far-' + i); });
put('pine-l', 2, 20); put('pine-m', 8, 21); put('pine-xl', 14, 21); put('pine-l2', 21, 20); put('pine-m2', 25, 21);
put('pine-l', 29, 20); put('pine-xl', 37, 21); put('pine-m', 41, 20); put('pine-s', 11, 19); put('pine-s', 31, 19);
put('bush-2', 0, 19); put('bush-2', 9, 19); put('bush-1', 17, 19); put('bush-1', 23, 19); put('bush-2', 39, 19); put('bush-1', 27, 19);
put('bush-1', 6, 20); put('bush-2', 33, 20);

var map = {
  w: W, h: H, tile: T, seed: 23,
  legend: { a: 'asphalt', c: 'concrete', g: 'grass', f: 'forest' },
  ground: ground,
  backdrop: { x: 0, y: 0 },
  objects: objects,
  places: { double_r: 'double-r', sheriff: 'sheriff-station' },
  spots: {
    bench: { tx: 23, ty: 8, face: 'up' },
    rr_sign: { tx: 16, ty: 8, face: 'up' },
    diner_lot: { tx: 9, ty: 11, face: 'up' },
    station_lot: { tx: 27, ty: 12, face: 'up' },
    far_walk: { tx: 18, ty: 17, face: 'up' },
    fence: { tx: 38, ty: 8, face: 'up' }
  },
  cast: [
    { id: 'cooper', name: 'Cooper', home: 'double_r', loop: ['double_r', 'sheriff', 'rr_sign', 'double_r', 'far_walk', 'sheriff'] },
    { id: 'truman', name: 'Truman', home: 'sheriff', loop: ['sheriff', 'station_lot', 'double_r', 'sheriff', 'fence'] },
    { id: 'lucy', name: 'Lucy', home: 'sheriff', loop: ['sheriff', 'bench', 'sheriff', 'double_r'] },
    { id: 'andy', name: 'Andy', home: 'sheriff', loop: ['sheriff', 'diner_lot', 'double_r', 'bench', 'sheriff', 'far_walk'] },
    { id: 'hawk', name: 'Hawk', home: 'far_walk', loop: ['far_walk', 'fence', 'sheriff', 'double_r', 'rr_sign'] }
  ],
  walkable: [], blocked: []
};

// sanity: the map builds on the engine
var WM = require(path.join(KIT, '../../../engine/ember-worldmap.js'));
var w = WM.build(map, { tileSet: tileSet, objects: kit });
fs.writeFileSync(path.join(__dirname, 'main-street.json'), JSON.stringify(map, null, 1));
console.log('main-street', W + 'x' + H, 'objects', objects.length, 'places', Object.keys(w.places).join(','));
