// engine/test/worldmap.js — the shared world engine, checked on a real kit.
// Uses Living Town's village kit and map as the fixture; nothing here is
// specific to either game. Run: node engine/test/worldmap.js
var fs = require('fs'), path = require('path');
var G = require('../ember-ground.js'), WM = require('../ember-worldmap.js');
var KIT = path.join(__dirname, '../../living-town/proto/town-kit');
var tileSet = JSON.parse(fs.readFileSync(KIT + '/ground/ground.json', 'utf8'));
var objects = JSON.parse(fs.readFileSync(KIT + '/objects.json', 'utf8'));
var map = JSON.parse(fs.readFileSync(path.join(__dirname, '../../living-town/proto/town-map/town.json'), 'utf8'));
var fails = 0, checks = 0;
function ok(cond, msg) { checks++; if (!cond) { fails++; console.log('FAIL', msg); } }

// ground: deterministic, every cell resolves, animated cells carry frames
var grid = map.ground.map(function (r) { return r.split('').map(function (c) { return map.legend[c]; }); });
var pick = G.picker(tileSet), a = [], b = [];
for (var y = 0; y < grid.length; y++) for (var x = 0; x < grid[0].length; x++) {
  var p = pick(grid, x, y, map.seed), q = G.picker(tileSet)(grid, x, y, map.seed);
  a.push(p); b.push(q);
  ok(typeof p.cell === 'number', 'cell resolves at ' + x + ',' + y);
  if (tileSet.materials[grid[y][x]].kind === 'animated') ok(p.frames && p.frames.length > 1, 'water animates at ' + x + ',' + y);
}
ok(JSON.stringify(a) === JSON.stringify(b), 'same map and seed give the same tiles');
// seams: horizontally adjacent coursed cells agree on the shared edge code (same R/L)
ok(G.walkable(tileSet, 'cobble') && !G.walkable(tileSet, 'water'), 'walkability comes from the tile set');

// world: collision from ground and footprints, every place reaches every other
var w = WM.build(map, { tileSet: tileSet, objects: objects }), names = Object.keys(w.places);
names.forEach(function (from) { names.forEach(function (to) { if (from !== to) ok(!!WM.route(w, from, to), 'route ' + from + ' -> ' + to); }); });
Object.keys(w.spots).forEach(function (k) { var s = w.spots[k].tile; ok(WM.walkable(w, s[0], s[1]), 'spot ' + k + ' stands on a walkable cell'); });
var door = w.places[names.filter(function (n) { return w.places[n].indoor; })[0]];
ok(WM.walkable(w, door.tile[0], door.tile[1]), 'a door tile is walkable inside its building footprint');
var wx = grid[grid.length - 1].indexOf('water');
ok(!WM.walkable(w, wx, grid.length - 1), 'water blocks');
// routes stay on walkable ground at every pixel step
names.slice(0, 4).forEach(function (from) {
  var r = WM.route(w, from, names[names.length - 1]);
  r.legs.forEach(function (L) {
    for (var s = 0; s <= L.d; s += 4) {
      var px = L.a[0] + (L.b[0] - L.a[0]) * (L.d ? s / L.d : 0), py = L.a[1] + (L.b[1] - L.a[1]) * (L.d ? s / L.d : 0);
      var tx = Math.floor(px / w.T), ty = Math.floor(py / w.T);
      ok(WM.walkable(w, tx, ty) || (tx === r.tiles[0][0] && ty === r.tiles[0][1]) || (tx === r.tiles[r.tiles.length - 1][0] && ty === r.tiles[r.tiles.length - 1][1]),
         'route ' + from + ' stays walkable at ' + tx + ',' + ty);
    }
  });
});
// doors open for a leaving walk and shut once it is well away
var route = WM.route(w, names[0], names[1]), walk = { from: names[0], to: names[1], t0: 100, route: route };
ok(WM.doorOpen([walk], names[0], 100.05, 64) === 1, 'door opens as someone leaves');
ok(WM.doorOpen([walk], names[0], 101, 64) === 0, 'door shuts behind them');
console.log('engine worldmap:', checks - fails, '/', checks, 'checks pass');
process.exit(fails ? 1 : 0);
