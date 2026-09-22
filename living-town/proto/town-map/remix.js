// remix.js — writes town-remix.json: the same kit, rearranged by editing data only.
var fs = require('fs');
var m = JSON.parse(fs.readFileSync(__dirname + '/town.json', 'utf8'));
function obj(id) { return m.objects.filter(function (o) { return o.id === id; })[0]; }
function setRow(y, x0, x1, ch) { var r = m.ground[y].split(''); for (var x = x0; x <= x1; x++) r[x] = ch; m.ground[y] = r.join(''); }

// 1. swap two houses: the red-roofed cottage and the blue one trade places
var a = obj('cottage-2'), b = obj('cottage-3'), t = a.tx; a.tx = b.tx; b.tx = t;
// 2. the café moves to the far right, the last cottage takes its plot
var cafe = obj('cafe'), c4 = obj('cottage-4'); t = cafe.tx; cafe.tx = c4.tx - 1; c4.tx = t + 1;
['table-set', 'a-frame-sign'].forEach(function (id) { obj(id).tx += 17; });
// 3. a sixth house: a second copy of cottage-1 at the left edge of the park
m.objects.push({ kit: 'cottage-1', id: 'cottage-new', tx: 1, ty: 15 });
m.places.flat_f = 'cottage-new';
m.residents.push({ id: 'resident_f', name: 'Franco', home: 'flat_f' });
// 4. the park loses a tree and gains a row of three
m.objects = m.objects.filter(function (o) { return o.id !== 'tree-park-4'; });
[27, 31, 35].forEach(function (x, i) { m.objects.push({ kit: 'tree-park-3', id: 'tree-row-' + i, tx: x, ty: 16 }); });
// 5. a paved path across the lawn to the new house's door
setRow(17, 5, 12, 'p');
// 7. more lamps along the park
[10, 26].forEach(function (x, i) { m.objects.push({ kit: 'lamp-2', id: 'lamp-park-' + i, tx: x, ty: 15 }); });

// 6. clear a garden gate in front of every door: take out the fence, post,
//    hedge or bush standing in the column from the door to the street
var C = require('./town-core.js');
var kit = JSON.parse(fs.readFileSync(__dirname + '/../town-kit/objects.json', 'utf8'));
var w = C.build(m, kit), kitById = {}; kit.forEach(function (k) { kitById[k.id] = k; });
Object.keys(m.places).forEach(function (name) {
  var pl = w.places[name], x = pl.tile[0], y0 = pl.tile[1] + 1;
  var col = []; for (var y = y0; y <= y0 + 2 && y < 12; y++) col.push([x, y]);
  m.objects = m.objects.filter(function (o) {
    var k = kitById[o.kit];
    if (!/fence|gate|pillar|wall-garden|hedge|bush|garden-foliage|flowers-garden|planter|barrel/.test(k.id)) return true;
    return !(k.footprint || []).some(function (f) { return col.some(function (c) { return o.tx + f[0] === c[0] && o.ty + f[1] === c[1]; }); });
  });
  col.forEach(function (c) { m.walkable.push(c); });
});
// places/objects that moved keep their names; routes are recomputed from the new collisions
fs.writeFileSync(__dirname + '/town-remix.json', JSON.stringify(m, null, 1));
console.log('remix written:', m.objects.length, 'objects,', Object.keys(m.places).length, 'places');
