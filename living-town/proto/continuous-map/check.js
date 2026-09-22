// Node check: host/mirror determinism, route lengths vs the old minutes table.
var P = require('./town-map.js');
var OLD = { 'cafe|flat_a': 12, 'flat_a|park': 14, 'cafe|park': 8, 'cafe|flat_b': 9, 'flat_b|park': 11, 'flat_a|flat_b': 16,
  'cafe|flat_c': 7, 'flat_c|park': 9, 'cafe|flat_d': 5, 'flat_d|park': 10, 'cafe|flat_e': 8, 'flat_e|park': 6 };
console.log('route             px  tiles  old-min  @4t/min  @20t/min  @60t/min');
P.routeTable().forEach(function (r) {
  var k = [r.from, r.to].sort().join('|'), t = r.px / 16;
  console.log((r.from + '→' + r.to).padEnd(16), String(r.px).padStart(4), t.toFixed(1).padStart(6), String(OLD[k] || '-').padStart(8),
    String(Math.ceil(t / 4)).padStart(8), String(Math.ceil(t / 20)).padStart(9), String(Math.ceil(t / 60)).padStart(9));
});
var fail = 0;
[64, 320, 960].forEach(function (ppm) {
  var a = P.createTown(42, ppm), b = P.createTown(42, ppm), bad = 0, t0 = Date.now();
  for (var m = 0; m < 17 * 60; m++) { P.stepMinute(a); P.stepMinute(b); if (P.fingerprint(a) !== P.fingerprint(b)) bad++; }
  fail += bad;
  console.log('ppm', ppm, 'mismatches', bad, 'walks', a.walks, 'px', a.pxWalked, 'ms', Date.now() - t0);
});
process.exit(fail ? 1 : 0);
