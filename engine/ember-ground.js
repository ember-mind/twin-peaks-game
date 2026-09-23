/* ember-ground.js — Ember Engine: picking ground tiles from a tile set.
 *
 * A game brings a tile set (JSON, built with its art): materials with their
 * tile tables, and rules for how materials meet. The engine knows rule
 * types, never material names, so every game can have its own ground.
 *
 * Seams: edge codes are hashed from an edge's position and the map seed, so
 * two cells sharing an edge always agree on it and whatever crosses that
 * edge (a stone, a tuft, a ripple) is drawn the same on both sides.
 *
 * Material kinds:
 *   coursed   L/R codes on vertical edges: table[(L*codes+R)*interiors+i]
 *   textured  N/E/S/W codes: table[((((N*c+E)*c+S)*c+W)*interiors)+i]
 *   animated  like coursed, with frames[f][index]
 * Optional per material: walkable (default true), rare {index, oneIn}.
 *
 * Rules (tileSet.rules, first match wins):
 *   fringe  a material in `materials` next to any of `neighbours` takes
 *           tables[material]['mask,L,R'] (mask N=1 E=2 S=4 W=8)
 *   lip     `material` with any of `above` directly above takes table[L*c+R]
 *   shore   `material` with anything but `aboveNot` above takes
 *           frames[f][L*c+R]
 *
 * EMBER.Ground.picker(tileSet) -> pick(grid, x, y, seed) -> { cell, frames? }
 * grid[y][x] is a material name. Out-of-map neighbours count as the cell's own.
 */
(function (root) {
  var EMBER = root.EMBER = root.EMBER || {};
  var G = EMBER.Ground = EMBER.Ground || {};

  function h32(a, b, c) {
    var h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b9);
    h ^= h >>> 15; h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0;
  }
  function vcode(x, y, seed) { return h32(x, y, seed ^ 0x51515151); }   // edge left of (x, y)
  function hcode(x, y, seed) { return h32(x, y, seed ^ 0x2a3a4a5a); }   // edge above (x, y)
  function cellHash(x, y, seed) { return h32(x, y, seed ^ 0x77177717); }

  function set(list) { var o = {}; (list || []).forEach(function (k) { o[k] = true; }); return o; }

  G.picker = function (tileSet) {
    var M = tileSet.materials;
    var rules = (tileSet.rules || []).map(function (r) {
      return { type: r.type, materials: set(r.materials || [r.material]), neighbours: set(r.neighbours),
               above: set(r.above), aboveNot: set(r.aboveNot), tables: r.tables, table: r.table, frames: r.frames };
    });

    return function pick(grid, x, y, seed) {
      seed = seed | 0;
      var mat = grid[y][x], m = M[mat];
      if (!m) throw new Error('unknown ground material: ' + mat);
      function at(dx, dy) { var row = grid[y + dy], v = row && row[x + dx]; return v === undefined ? mat : v; }
      var hv = cellHash(x, y, seed), K = m.codes;
      var L = vcode(x, y, seed) % K, R = vcode(x + 1, y, seed) % K;

      for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        if (!r.materials[mat]) continue;
        if (r.type === 'fringe') {
          var nb = r.neighbours;
          var mask = (nb[at(0, -1)] ? 1 : 0) | (nb[at(1, 0)] ? 2 : 0) | (nb[at(0, 1)] ? 4 : 0) | (nb[at(-1, 0)] ? 8 : 0);
          var t = r.tables && r.tables[mat];
          if (mask && t) return { cell: t[mask + ',' + (mask & 8 ? 0 : L) + ',' + (mask & 2 ? 0 : R)] };
        } else if (r.type === 'lip') {
          if (r.above[at(0, -1)]) return { cell: r.table[L * K + R] };
        } else if (r.type === 'shore') {
          if (!r.aboveNot[at(0, -1)]) {
            var fr = r.frames.map(function (f) { return f[L * K + R]; });
            return { cell: fr[0], frames: fr };
          }
        }
      }

      var n = m.interiors || 1;
      if (m.kind === 'textured') {
        var N = hcode(x, y, seed) % K, S = hcode(x, y + 1, seed) % K;
        var idx = m.rare && n > m.rare.index && (hv % m.rare.oneIn) === 0 ? m.rare.index
          : (hv >>> 8) % (m.rare ? Math.min(m.rare.index, n) : n);
        return { cell: m.table[((((N * K + R) * K + S) * K + L) * n) + idx] };
      }
      var j = (L * K + R) * n + (hv >>> 8) % n;
      if (m.kind === 'animated') {
        var out = m.frames.map(function (f) { return f[j]; });
        return { cell: out[0], frames: out };
      }
      return { cell: m.table[j] };
    };
  };

  G.walkable = function (tileSet, material) {
    var m = tileSet.materials[material];
    return !!m && m.walkable !== false;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(typeof window !== 'undefined' ? window : global);
