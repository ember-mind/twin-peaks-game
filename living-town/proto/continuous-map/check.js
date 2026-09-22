// Node check: determinism, route lengths, what speed does to travel minutes.
var P = require('./town-map.js');
P.rows.forEach(function (r, i) { console.log(String(i).padStart(2), r); });
var OLD = { 'cafe|flat_a': 12, 'flat_a|park': 14, 'cafe|park': 8, 'cafe|flat_b': 9, 'flat_b|park': 11, 'flat_a|flat_b': 16,
  'cafe|flat_c': 7, 'flat_c|park': 9, 'cafe|flat_d': 5, 'flat_d|park': 10, 'cafe|flat_e': 8, 'flat_e|park': 6 };
console.log('\nroute            tiles  old-min  @4t/min  @20t/min  @60t/min');
P.routeTable().forEach(function (r) {
  var k = [r.from, r.to].sort().join('|');
  console.log((r.from + '→' + r.to).padEnd(16), String(r.tiles).padStart(5), String(OLD[k] || '-').padStart(8),
    String(Math.ceil(r.tiles / 4)).padStart(8), String(Math.ceil(r.tiles / 20)).padStart(9), String(Math.ceil(r.tiles / 60)).padStart(9));
});
[4, 20, 60].forEach(function (tpm) {
  var a = P.createTown(42, tpm), b = P.createTown(42, tpm), bad = 0, overlaps = 0, outdoorsMin = 0, t0 = Date.now();
  for (var m = 0; m < 17 * 60; m++) {
    P.stepMinute(a); P.stepMinute(b);
    if (P.fingerprint(a) !== P.fingerprint(b)) bad++;
    var seen = {}, out = 0;
    a.people.forEach(function (p) { var q = P.positionAt(a, p, a.minute); if (!q.outdoors) return; out++; var k = q.x + ',' + q.y; if (seen[k]) overlaps++; seen[k] = 1; });
    outdoorsMin += out;
  }
  console.log('\ntpm', tpm, 'mismatches', bad, 'walks', a.walks, 'tiles', a.tilesWalked, 'same-tile person-minutes', overlaps,
    'avg people outdoors', (outdoorsMin / (17 * 60)).toFixed(2), 'ms', Date.now() - t0);
});
