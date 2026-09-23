/* ember-cast.js — Ember Engine: drawing characters from a manifest-described atlas.
 *
 * A game's cast sheet is art; where each frame sits is data:
 *
 *   { "image": "residents.png", "cell": [32, 32], "feet": [16, 30],
 *     "frames": { "stand": 0, "walk": [1, 2, 3, 4], "seated": 5 },
 *     "mirrorLeft": false,
 *     "residents": [{ "id": "rust_jacket", "col": 0, "rows": { "down": 0, "up": 1, "left": 2, "right": 3 } }] }
 *
 * Frame cell: column = resident.col + frames[name] (walk: frames.walk[i]),
 * row = resident.rows[dir]. The cell's `feet` pixel lands on the actor's
 * ground point. With mirrorLeft, 'left' draws the 'right' row flipped.
 * Frames missing for a direction (e.g. 'seated' only facing down) fall back
 * to the 'down' row.
 *
 *   EMBER.Cast.load(manifestUrl) -> Promise<cast>
 *   cast.draw(g, id, { dir, walking, phase, seated }, feetX, feetY) -> bool
 *   cast.ids -> resident ids
 */
(function (root) {
  var EMBER = root.EMBER = root.EMBER || {};
  var CA = EMBER.Cast = EMBER.Cast || {};

  CA.create = function (manifest, image) {
    var cw = manifest.cell[0], ch = manifest.cell[1], fx = manifest.feet[0], fy = manifest.feet[1];
    var byId = {}; manifest.residents.forEach(function (r) { byId[r.id] = r; });
    var F = manifest.frames, walk = F.walk || [F.stand || 0];

    function cellFor(r, pose) {
      var dir = pose.dir || 'down', flip = false;
      if (dir === 'left' && manifest.mirrorLeft) { dir = 'right'; flip = true; }
      var col;
      if (pose.seated && F.seated != null) { col = F.seated; dir = 'down'; flip = false; }
      else if (pose.walking) col = walk[Math.floor(((pose.phase || 0) % 1 + 1) % 1 * walk.length) % walk.length];
      else col = F.stand || 0;
      var row = r.rows[dir]; if (row == null) row = r.rows.down;
      return { sx: (r.col + col) * cw, sy: row * ch, flip: flip };
    }

    return {
      ids: manifest.residents.map(function (r) { return r.id; }),
      cell: [cw, ch], feet: [fx, fy],
      draw: function (g, id, pose, x, y) {
        var r = byId[id]; if (!r || !image) return false;
        var c = cellFor(r, pose || {}), dx = Math.round(x - fx), dy = Math.round(y - fy);
        if (c.flip) {
          g.save(); g.translate(dx + cw, dy); g.scale(-1, 1);
          g.drawImage(image, c.sx, c.sy, cw, ch, 0, 0, cw, ch); g.restore();
        } else g.drawImage(image, c.sx, c.sy, cw, ch, dx, dy, cw, ch);
        return true;
      }
    };
  };

  CA.load = function (url) {
    var base = url.replace(/[^/]*$/, '');
    return fetch(url, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (m) {
      return new Promise(function (res) {
        var im = new Image(); im.onload = function () { res(CA.create(m, im)); }; im.onerror = function () { res(CA.create(m, null)); };
        im.src = base + m.image;
      });
    });
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = CA;
})(typeof window !== 'undefined' ? window : this);
