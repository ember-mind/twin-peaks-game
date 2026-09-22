// Node check: the composed map builds, every place reaches every other, and
// host and mirror agree minute by minute.
var fs = require('fs'), C = require('./town-core.js'), WM = require('../../../engine/ember-worldmap.js');
var map = JSON.parse(fs.readFileSync(__dirname + '/town.json', 'utf8'));
var kit = { objects: JSON.parse(fs.readFileSync(__dirname + '/../town-kit/objects.json', 'utf8')),
            tileSet: JSON.parse(fs.readFileSync(__dirname + '/../town-kit/ground/ground.json', 'utf8')) };
var w = WM.build(map, kit), names = Object.keys(w.places), bad = [];
names.forEach(function (a) { names.forEach(function (b) { if (a !== b && !WM.route(w, a, b)) bad.push(a + '→' + b); }); });
console.log('places', names.length, 'unreachable', bad.length ? bad.join(' ') : 'none');
var fail = bad.length;
[64, 320].forEach(function (ppm) {
  var h = C.createTown(w, map.residents, 42, ppm), m = C.createTown(w, map.residents, 42, ppm), mis = 0, t0 = Date.now();
  for (var i = 0; i < 17 * 60; i++) { C.stepMinute(h); C.stepMinute(m); if (C.fingerprint(h) !== C.fingerprint(m)) mis++; }
  fail += mis;
  console.log('ppm', ppm, 'mismatches', mis, 'walks', h.walks, 'ms', Date.now() - t0);
});
process.exit(fail ? 1 : 0);
