// test/kit-exteriors.js — the Twin Peaks exterior kit on the shared engine.
// The kit (assets/kits/tp-exteriors-v01) loads with the same manifest fields
// as Living Town's, its main street builds, every place reaches every other,
// routes stay on walkable ground, doors open, and the cast's day stays on
// the street. Run: node test/kit-exteriors.js
var fs = require('fs'), path = require('path');
var G = require('../engine/ember-ground.js'), WM = require('../engine/ember-worldmap.js');
var SC = require('../assets/kits/tp-exteriors-v01/maps/street-cast.js');
var KIT = path.join(__dirname, '../assets/kits/tp-exteriors-v01');
function json(p) { return JSON.parse(fs.readFileSync(path.join(KIT, p), 'utf8')); }
var fails = 0, checks = 0;
function ok(cond, msg) { checks++; if (!cond) { fails++; console.log('FAIL', msg); } }

// ---- manifest: the engine loads it unchanged ------------------------------
var manifest = json('kit.json');
var lt = JSON.parse(fs.readFileSync(path.join(__dirname, '../living-town/proto/town-kit/kit.json'), 'utf8'));
Object.keys(lt).forEach(function (k) { ok(k in manifest, 'kit.json has ' + k + ' like the Living Town kit'); });
ok(JSON.stringify(manifest.grades) === JSON.stringify(['dusk', 'day', 'night']), 'grades dusk/day/night');
function graded(base) {
  manifest.grades.forEach(function (g, i) {
    var f = base + (i === 0 ? '' : '-' + g) + '.png';
    ok(fs.existsSync(path.join(KIT, f)), 'image exists: ' + f);
  });
}
var tileSet = json(manifest.tileSet), objects = json(manifest.objects), map = json('maps/main-street.json');
graded(manifest.groundImage); graded(manifest.backdrop);
var ids = {};
objects.forEach(function (o) {
  ids[o.id] = o;
  ['id', 'file', 'w', 'h', 'anchor', 'footprint', 'depth', 'kind'].forEach(function (k) { ok(k in o, o.id + ' has ' + k); });
  if (o.kind !== 'backdrop') graded(o.file.replace(/\.png$/, ''));
  if (o.door) { graded(o.door.open.replace(/\.png$/, '')); ok(o.door.w === 2, o.id + ' door is two tiles wide'); }
});
Object.keys(manifest.objectMeta || {}).forEach(function (k) { ok(!!ids[k], 'objectMeta names a kit object: ' + k); });
['double-r', 'sheriff-station', 'rr-sign', 'street-lamp', 'wall-lamp', 'planter-l', 'bin', 'wheel-stop', 'flagpole',
 'fence', 'bench', 'pine-s', 'pine-m', 'pine-l', 'pine-xl', 'bush-1', 'shrub-1', 'stall-line', 'backdrop']
  .forEach(function (k) { ok(!!ids[k], 'kit has ' + k); });
ok(manifest.objectMeta['street-lamp'].alwaysLit && ids['street-lamp'].windows.length, 'the street lamp lights the cast at night');
ok(!!ids['lamp-pool'] && map.objects.filter(function (o) { return o.kit === 'lamp-pool'; }).length ===
   map.objects.filter(function (o) { return o.kit === 'street-lamp'; }).length, 'every street lamp has its pool');
ok(manifest.light.windowPane === false && manifest.light.doorway.length === 7, 'painted windows kept, Twin Peaks doorway colours');

// ---- ground: every cell resolves, deterministic ----------------------------
var grid = map.ground.map(function (r) { return r.split('').map(function (c) { return map.legend[c]; }); });
ok(grid.length === map.h && grid.every(function (r) { return r.length === map.w; }), 'ground is ' + map.w + 'x' + map.h);
var pick = G.picker(tileSet), pick2 = G.picker(tileSet), a = [], b = [];
for (var y = 0; y < map.h; y++) for (var x = 0; x < map.w; x++) {
  var p = pick(grid, x, y, map.seed);
  a.push(p.cell); b.push(pick2(grid, x, y, map.seed).cell);
  ok(typeof p.cell === 'number' && p.cell >= 0 && p.cell < tileSet.cellCount, 'cell resolves at ' + x + ',' + y);
}
ok(JSON.stringify(a) === JSON.stringify(b), 'same map and seed give the same tiles');
['asphalt', 'concrete', 'grass', 'forest'].forEach(function (m) { ok(!!tileSet.materials[m], 'material ' + m); });
ok(!G.walkable(tileSet, 'forest') && G.walkable(tileSet, 'asphalt'), 'walkability comes from the tile set');
// the kerb is the concrete/asphalt fringe: every sidewalk cell above the road carries it
var kerbRule = tileSet.rules[0];
var kerbCells = {}; Object.keys(kerbRule.tables.concrete).forEach(function (k) { if (k.split(',')[0] === '4') kerbCells[kerbRule.tables.concrete[k]] = true; });
for (x = 0; x < map.w; x++) ok(kerbCells[a[8 * map.w + x]], 'kerb drawn along the near sidewalk at x=' + x);

// ---- world: places, routes, doors ------------------------------------------
var w = WM.build(map, { tileSet: tileSet, objects: objects }), names = Object.keys(w.places);
ok(w.places.double_r && w.places.double_r.indoor, 'double_r is the diner door');
ok(w.places.sheriff && w.places.sheriff.indoor, 'sheriff is the station door');
ok(names.length >= 5, 'outdoor spots too: ' + names.join(','));
names.forEach(function (n) { var t = w.places[n].tile; ok(WM.walkable(w, t[0], t[1]), n + ' stands on a walkable tile'); });
var routes = 0;
names.forEach(function (from) {
  names.forEach(function (to) {
    if (from === to) return;
    var r = WM.route(w, from, to);
    ok(!!r && r.length > 0, 'route ' + from + ' -> ' + to);
    if (!r) return;
    routes++;
    r.legs.forEach(function (L) {
      for (var s = 0; s <= L.d; s += 2) {
        var px = L.a[0] + (L.b[0] - L.a[0]) * (L.d ? s / L.d : 0), py = L.a[1] + (L.b[1] - L.a[1]) * (L.d ? s / L.d : 0);
        var tx = Math.floor(px / w.T), ty = Math.floor(py / w.T);
        var end = (tx === r.tiles[0][0] && ty === r.tiles[0][1]) || (tx === r.tiles[r.tiles.length - 1][0] && ty === r.tiles[r.tiles.length - 1][1]);
        ok(WM.walkable(w, tx, ty) || end, 'route ' + from + '->' + to + ' stays walkable at ' + tx + ',' + ty);
      }
    });
  });
});
// a door leads out onto the sidewalk: the tile below each door is walkable
['double_r', 'sheriff'].forEach(function (n) {
  var t = w.places[n].tile; ok(WM.walkable(w, t[0], t[1] + 1), n + ' opens onto the walk');
});
var walk = { from: 'double_r', to: 'sheriff', t0: 100, route: WM.route(w, 'double_r', 'sheriff') };
ok(WM.doorOpen([walk], 'double_r', 100.05, 48) === 1, 'the diner door opens as someone leaves');
ok(WM.doorOpen([walk], 'double_r', 102, 48) === 0, 'and shuts behind them');
ok(WM.doorOpen([walk], 'sheriff', 100 + walk.route.length / 48 - 0.1, 48) === 1, 'the station door opens as they arrive');

// ---- the cast's day ----------------------------------------------------------
var plan = SC.plan(w, map.cast, 1990, 48);
ok(plan.people.length === map.cast.length, 'every cast member has a day');
var seen = {}, stray = 0;
for (var t = 0; t < 1440; t += 0.37) plan.people.forEach(function (p, i) {
  var q = SC.at(plan, i, t);
  if (q.moving) seen[p.id] = (seen[p.id] || 0) + 1;
  if (q.outdoors && !WM.walkable(w, Math.floor(q.x / w.T), Math.floor(q.y / w.T)) && !q.moving) stray++;
});
map.cast.forEach(function (c) { ok(seen[c.id] > 0, c.id + ' walks the street'); });
ok(stray === 0, 'nobody waits on a blocked tile');
var doorsUsed = {}; SC.walks(plan).forEach(function (wk) { doorsUsed[wk.from] = doorsUsed[wk.to] = true; });
ok(doorsUsed.double_r && doorsUsed.sheriff, 'the cast comes and goes through both doors');

console.log('kit-exteriors:', checks - fails, '/', checks, 'checks pass (' + routes + ' routes)');
process.exit(fails ? 1 : 0);
