/* ember-worldview.js — Ember Engine: drawing a map made of a game's kit.
 *
 * Browser only. The engine draws the world; the game brings the art and
 * the actors. A kit manifest (kit.json) names the art and everything about
 * how it looks, so two games on this engine can look nothing alike:
 *
 *   { "tileSet": "ground/ground.json", "groundImage": "ground/ground",
 *     "objects": "objects.json", "backdrop": "objects/backdrop",
 *     "grades": ["dusk", "day", "night"],          // one image per grade: name.png, name-day.png ...
 *     "schedule": [[fromMin, toMin, gradeA, gradeB], ...],   // gradeA fades into gradeB
 *     "darkness": { "night": 1, "dusk": 0.45, "day": 0 },
 *     "light": { "warm": [255, 170, 80], "reflection": 0.35 },
 *     "objectMeta": { "<object id>": { "alwaysLit": true } } }
 *
 * Objects carry their own metadata from the kit: kind 'lamp' lights at
 * night; a door gets an open frame (<id>-door-open) and a lit hall; windows
 * glow while their place is lit. Materials with `reflects` mirror their
 * bank and the backdrop.
 *
 *   EMBER.WorldView.loadKit(baseUrl) -> Promise<kit>     (kit.tileSet, kit.objects, images)
 *   var view = EMBER.WorldView.create(world, kit)
 *   view.draw(g, camX, camY, t, { actors, lit, doorOpen, debug })
 *     actors: [{ sortY, draw(g, camX, camY, light) }]   game-drawn, depth-sorted with objects
 *     lit:    { placeName: true }                       places whose windows glow
 *     doorOpen(placeName) -> 0..1
 *   view.lightAt(t) -> { a, b, k, dark }
 *   view.lightsNear(x, y, lit) -> [{ dx, dy, s }]        for relighting actors
 *   EMBER.WorldView.relight(ctx, w, h, light, lights, ambient, tint)   helper for actor sprites
 */
(function (root) {
  var EMBER = root.EMBER = root.EMBER || {};
  var WV = EMBER.WorldView = EMBER.WorldView || {};
  var WM = EMBER.WorldMap;

  function loadImage(src) {
    return new Promise(function (res) {
      var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = src;
    });
  }
  function getJSON(u) { return fetch(u, { cache: 'no-store' }).then(function (r) { return r.json(); }); }

  WV.loadKit = function (base) {
    if (base.slice(-1) !== '/') base += '/';
    var kit = { base: base, images: {} };
    return getJSON(base + 'kit.json').then(function (m) {
      kit.manifest = m; kit.grades = m.grades || ['base'];
      return Promise.all([getJSON(base + m.tileSet), getJSON(base + m.objects)]);
    }).then(function (r) {
      kit.tileSet = r[0]; kit.objects = r[1];
      /* per-object overrides the art build does not know, e.g. a shop
       * window that is always lit */
      var meta = kit.manifest.objectMeta || {};
      kit.objects.forEach(function (o) { var x = meta[o.id]; if (x) for (var k in x) o[k] = x[k]; });
      var m = kit.manifest, loads = [graded('ground', m.groundImage)];
      if (m.backdrop) loads.push(graded('backdrop', m.backdrop));
      kit.objects.forEach(function (k) {
        if (k.kind === 'backdrop') return;
        loads.push(graded(k.id, k.file.replace(/\.png$/, '')));
        if (k.door) loads.push(graded(k.id + ':open', (k.door.open || ('objects/' + k.id + '-door-open.png')).replace(/\.png$/, '')));
      });
      return Promise.all(loads).then(function () { return kit; });
    });
    function graded(key, path) {
      return Promise.all(kit.grades.map(function (g, i) { return loadImage(base + path + (i === 0 ? '' : '-' + g) + '.png'); }))
        .then(function (ims) {
          var set = {}; kit.grades.forEach(function (g, i) { set[g] = ims[i] || ims[0]; });
          kit.images[key] = ims[0] ? set : null;
        });
    }
  };

  WV.create = function (world, kit) {
    var map = world.map, T = world.T, WW = world.W * T, HH = world.H * T, m = kit.manifest;
    var grades = kit.grades, schedule = m.schedule || [[0, 1440, grades[0], grades[0]]];
    var darkness = m.darkness || {}, warm = (m.light && m.light.warm) || [255, 170, 80];
    var reflectAlpha = (m.light && m.light.reflection) || 0.35;
    function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')'; }
    var pick = EMBER.Ground.picker(kit.tileSet);
    var reflects = {}; Object.keys(kit.tileSet.materials).forEach(function (k) { if (kit.tileSet.materials[k].reflects) reflects[k] = true; });

    /* ground: one canvas per grade per animation frame, laid once */
    var grid = []; for (var y = 0; y < world.H; y++) { grid.push([]); for (var x = 0; x < world.W; x++) grid[y].push(WM.materialAt(map, x, y)); }
    var picks = [], frames = 1;
    for (var yy = 0; yy < world.H; yy++) for (var xx = 0; xx < world.W; xx++) {
      var p = map.legend && grid[yy][xx] !== 'void' ? pick(grid, xx, yy, map.seed || 1) : null;
      if (p && p.frames) frames = Math.max(frames, p.frames.length);
      picks.push(p);
    }
    var ground = {};
    grades.forEach(function (gr) {
      var atlas = kit.images.ground[gr], cols = Math.floor(atlas.width / T);
      ground[gr] = [];
      for (var f = 0; f < frames; f++) {
        var cv = canvas(WW, HH), cx = cv.getContext('2d');
        picks.forEach(function (p, i) {
          if (!p) return;
          var c = p.frames ? p.frames[f % p.frames.length] : p.cell;
          cx.drawImage(atlas, (c % cols) * T, Math.floor(c / cols) * T, T, T, (i % world.W) * T, Math.floor(i / world.W) * T, T, T);
        });
        ground[gr].push(cv);
      }
    });
    function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').imageSmoothingEnabled = false; return c; }

    /* water mirrors its bank near the shore and the backdrop's sky further out */
    function shoreOf(x) { for (var y = 0; y < world.H; y++) if (reflects[grid[y][x]]) return y; return -1; }
    var reflections = {};
    if (Object.keys(reflects).length) grades.forEach(function (gr) {
      var scene = canvas(WW, HH), sc = scene.getContext('2d');
      sc.drawImage(ground[gr][0], 0, 0);
      if (map.backdrop && kit.images.backdrop) sc.drawImage(kit.images.backdrop[gr], map.backdrop.x, map.backdrop.y);
      world.objects.filter(function (o) { return o.kit.kind !== 'foreground' && o.kit.kind !== 'backdrop'; })
        .sort(function (a, b) { return a.depth - b.depth; })
        .forEach(function (o) { var im = kit.images[o.kit.id]; if (im) sc.drawImage(im[gr], o.px, o.py); });
      var ref = canvas(WW, HH), rc = ref.getContext('2d'), bd = kit.images.backdrop && kit.images.backdrop[gr];
      for (var tx = 0; tx < world.W; tx++) {
        var sy = shoreOf(tx); if (sy < 0) continue;
        var line = sy * T;
        for (var y = line; y < HH; y++) {
          if (!reflects[grid[Math.floor(y / T)][tx]]) continue;
          var d = y - line, bank = Math.max(0, 1 - d / 34);
          if (bd) { rc.globalAlpha = 0.5; rc.drawImage(bd, tx * T, bd.height - 1 - Math.min(bd.height - 1, Math.floor(d * 1.25)), T, 1, tx * T, y, T, 1); }
          var src = 2 * line - y - 1;
          if (bank > 0 && src >= 0) { rc.globalAlpha = bank; rc.drawImage(scene, tx * T, src, T, 1, tx * T, y, T, 1); }
        }
      }
      rc.globalAlpha = 1;
      reflections[gr] = ref;
    });

    var lamps = world.objects.filter(function (o) { return o.kit.kind === 'lamp'; }).map(function (o) {
      var head = o.kit.light || [Math.floor(o.kit.w / 2), 6];
      return { hx: o.px + head[0], hy: o.py + head[1], gx: o.px + Math.floor(o.kit.w / 2), gy: o.depth };
    });
    var placesOf = new Map();
    Object.keys(world.places).forEach(function (k) {
      var o = world.places[k].object; if (!o) return;
      if (!placesOf.has(o)) placesOf.set(o, []); placesOf.get(o).push(k);
    });

    function lightAt(t) {
      var mm = ((t % 1440) + 1440) % 1440, L = schedule[schedule.length - 1];
      for (var i = 0; i < schedule.length; i++) if (mm < schedule[i][1]) { L = schedule[i]; break; }
      var k = L[2] === L[3] ? 0 : (mm - L[0]) / (L[1] - L[0]);
      return { a: L[2], b: L[3], k: k, dark: (darkness[L[2]] || 0) * (1 - k) + (darkness[L[3]] || 0) * k };
    }
    function blitGraded(g, set, l, dx, dy) {
      if (!set) return;
      g.drawImage(set[l.a], dx, dy);
      if (l.k > 0) { g.globalAlpha = l.k; g.drawImage(set[l.b], dx, dy); g.globalAlpha = 1; }
    }

    function drawWindow(g, x, y, ww, hh, dark) {
      var glow = 0.35 + 0.65 * dark;
      g.globalCompositeOperation = 'lighter';
      [[8, 6, 0.035], [5, 4, 0.05], [2, 2, 0.07]].forEach(function (r) { g.fillStyle = rgba(warm, r[2] * glow); g.fillRect(x - r[0], y - r[1], ww + r[0] * 2, hh + r[1] * 3); });
      g.fillStyle = rgba(warm, 0.05 * glow); g.fillRect(x - 2, y + hh + 2, ww + 4, 14);
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#b8742f'; g.fillRect(x + 1, y + 1, ww - 2, hh - 2);
      g.fillStyle = '#e2a24a'; g.fillRect(x + 1, y + 3, ww - 2, hh - 4);
      g.fillStyle = '#f4c870'; g.fillRect(x + 2, y + Math.floor(hh / 2) + 1, ww - 4, Math.ceil(hh / 2) - 3);
      g.fillStyle = '#fbe3a0'; g.fillRect(x + 2, y + hh - 4, Math.max(2, Math.floor(ww / 3)), 2);
      g.fillStyle = '#4a3222'; g.fillRect(x + Math.floor(ww / 2), y + 1, 1, hh - 2); g.fillRect(x + 1, y + Math.floor(hh / 2), ww - 2, 1);
    }
    function drawDoorway(g, x, y, r, dark) {
      var dx = x + r[0] + 1, dy = y + r[1] + 1, w = r[2] - 2, h = r[3] - 2, glow = 0.55 + 0.45 * dark;
      g.fillStyle = '#6b4128'; g.fillRect(dx, dy, w, h);
      g.fillStyle = '#9a6236'; g.fillRect(dx + 1, dy + 2, w - 3, h - 8);
      g.fillStyle = '#c98a45'; g.fillRect(dx + 2, dy + 4, w - 6, h - 12);
      g.fillStyle = '#e8b664'; g.fillRect(dx + 3, dy + 6, Math.max(2, w - 9), 4);
      g.fillStyle = '#7a5134'; g.fillRect(dx + 1, dy + h - 7, w - 2, 6);
      g.fillStyle = '#a57044'; g.fillRect(dx + 2, dy + h - 7, w - 4, 1);
      g.fillStyle = '#3e2a1c'; g.fillRect(dx + w - 3, dy, 3, h);
      g.fillStyle = '#d9a35a'; g.fillRect(dx + w - 3, dy + 1, 1, h - 2);
      g.globalCompositeOperation = 'lighter';
      [[0, 0.10], [3, 0.07], [6, 0.05]].forEach(function (s) { g.fillStyle = rgba(warm, s[1] * glow); g.fillRect(dx - s[0], dy + h, w + s[0] * 2, 5 + s[0] * 2); });
      g.globalCompositeOperation = 'source-over';
    }

    function drawObject(g, o, l, opts, camX, camY) {
      var x = o.px - camX, y = o.py - camY;
      blitGraded(g, kit.images[o.kit.id], l, x, y);
      if (!o.door) return;
      var places = placesOf.get(o) || [], open = 0, home = false;
      places.forEach(function (pl) {
        if (opts.doorOpen) open = Math.max(open, opts.doorOpen(pl));
        if (opts.lit && opts.lit[pl]) home = true;
      });
      if (open && kit.images[o.kit.id + ':open']) { blitGraded(g, kit.images[o.kit.id + ':open'], l, x, y); drawDoorway(g, x, y, o.kit.door.rect, l.dark); }
      if (home) (o.kit.windows || []).forEach(function (wn) { drawWindow(g, x + wn[0], y + wn[1], wn[2], wn[3], l.dark); });
    }

    function draw(g, camX, camY, t, opts) {
      opts = opts || {};
      var l = lightAt(t), now = performance.now();
      g.fillStyle = '#101416'; g.fillRect(0, 0, g.canvas.width, g.canvas.height);
      var f = Math.floor(now / 420) % frames;
      g.drawImage(ground[l.a][f], -camX, -camY);
      if (l.k > 0) { g.globalAlpha = l.k; g.drawImage(ground[l.b][f], -camX, -camY); g.globalAlpha = 1; }
      if (map.backdrop) blitGraded(g, kit.images.backdrop, l, map.backdrop.x - camX, map.backdrop.y - camY);
      /* reflections, a pixel of ripple either way */
      [[l.a, 1], [l.b, l.k]].forEach(function (pair) {
        var ref = reflections[pair[0]]; if (!pair[1] || !ref) return;
        for (var y = 0; y < HH; y += 2) {
          var off = Math.round(Math.sin(now / 1000 * 1.3 + y * 0.45) * (y % 6 === 0 ? 1.4 : 0.8));
          g.globalAlpha = pair[1] * (y % 4 === 0 ? reflectAlpha * 0.85 : reflectAlpha * 1.15);
          g.drawImage(ref, 0, y, WW, 2, off - camX, y - camY, WW, 2);
        }
      });
      g.globalAlpha = 1;
      var night = l.dark > 0.3 ? (l.dark - 0.3) / 0.7 : 0;
      if (night) {             /* lamp pools lie on the ground, under everything standing */
        g.globalCompositeOperation = 'lighter';
        lamps.forEach(function (L) {
          [[30, 9, 0.05], [21, 7, 0.06], [12, 4, 0.07]].forEach(function (r) {
            g.fillStyle = rgba(warm, r[2] * night);
            g.fillRect(L.gx - camX - r[0], L.gy - camY - r[1], r[0] * 2, r[1] * 2);
            g.fillRect(L.gx - camX - r[0] + 4, L.gy - camY - r[1] - 2, r[0] * 2 - 8, r[1] * 2 + 4);
          });
        });
        /* and their streaks on the water, under whatever stands in front */
        var tt = now / 1000;
        lamps.forEach(function (L) {
          var sh = shoreOf(Math.max(0, Math.min(world.W - 1, Math.floor(L.hx / T))));
          if (sh < 0) return;
          var line = sh * T, my = 2 * line - L.hy;
          if (my - line > 260 || my < line) return;
          my = Math.min(my, line + 60);
          for (var k = 0; k < 7; k++) {
            var w = 5 - Math.abs(k - 3), wob = Math.round(Math.sin(tt * 2 + k) * 1.5);
            g.fillStyle = rgba(warm, 0.22 * night); g.fillRect(L.hx - camX - w + wob, my - 6 + k * 5 - camY, w * 2, 2);
          }
        });
        g.globalCompositeOperation = 'source-over';
      }
      var order = [];
      world.objects.forEach(function (o) { if (o.kit.kind !== 'backdrop') order.push({ y: o.depth, o: o }); });
      (opts.actors || []).forEach(function (a) { order.push({ y: a.sortY, a: a }); });
      order.sort(function (A, B) { return A.y - B.y || (A.o ? -1 : 1); });
      order.forEach(function (it) { if (it.o) drawObject(g, it.o, l, opts, camX, camY); else it.a.draw(g, camX, camY, l); });
      if (night) {             /* halos at the lamp heads */
        g.globalCompositeOperation = 'lighter';
        lamps.forEach(function (L) {
          [[9, 0.06], [5, 0.10]].forEach(function (r) { g.fillStyle = rgba(warm, r[1] * night); g.fillRect(L.hx - camX - r[0], L.hy - camY - r[0], r[0] * 2, r[0] * 2); });
        });
        g.globalCompositeOperation = 'source-over';
      }
      if (opts.debug) drawDebug(g, camX, camY, opts.routes || []);
      return l;
    }

    function drawDebug(g, camX, camY, routes) {
      for (var y = 0; y < world.H; y++) for (var x = 0; x < world.W; x++) if (world.blocked[y * world.W + x]) {
        g.fillStyle = 'rgba(255,0,60,.25)'; g.fillRect(x * T - camX, y * T - camY, T, T);
      }
      world.objects.forEach(function (o) {
        g.fillStyle = '#0ff'; g.fillRect(o.px - camX, o.depth - camY, o.kit.w, 1);
        if (o.door) { g.strokeStyle = '#0f0'; g.strokeRect(o.door.tx * T - camX + .5, o.door.ty * T - camY + .5, o.door.w * T - 1, T - 1); }
      });
      Object.keys(world.spots).forEach(function (k) { var s = world.spots[k]; g.strokeStyle = '#ff0'; g.strokeRect(s.tile[0] * T - camX + .5, s.tile[1] * T - camY + .5, T - 1, T - 1); });
      routes.forEach(function (r) {
        g.strokeStyle = 'rgba(255,0,255,.9)'; g.beginPath();
        r.legs.forEach(function (L, i) { if (!i) g.moveTo(L.a[0] - camX, L.a[1] - camY); g.lineTo(L.b[0] - camX, L.b[1] - camY); });
        g.stroke();
      });
    }

    /* light sources near a point: lamps, and windows of lit places (plus
     * any the kit marks as always lit, e.g. a shop window) */
    function lightsNear(fx, fy, lit) {
      var out = lamps.map(function (L) { return [L.hx, L.hy + 4, 70, 1]; });
      world.objects.forEach(function (o) {
        var places = placesOf.get(o) || [];
        if (!(o.kit.alwaysLit || places.some(function (p) { return lit && lit[p]; }))) return;
        (o.kit.windows || []).forEach(function (wn) { out.push([o.px + wn[0] + wn[2] / 2, o.py + wn[1] + wn[3] / 2, 50, 0.7]); });
      });
      return out.map(function (L) { var dx = L[0] - fx, dy = L[1] - (fy - 12), d = Math.sqrt(dx * dx + dy * dy); return { dx: dx, dy: dy, s: Math.max(0, 1 - d / L[2]) * L[3] }; })
        .filter(function (L) { return L.s > 0; });
    }

    return { world: world, kit: kit, size: [WW, HH], draw: draw, lightAt: lightAt, lightsNear: lightsNear,
             mix: function (tbl, l) { var a = tbl[l.a], b = tbl[l.b]; return [0, 1, 2].map(function (i) { return a[i] * (1 - l.k) + b[i] * l.k; }); } };
  };

  /* Relight an actor sprite drawn into ctx (w x h): dark outlines melt toward
   * the ambient air, the figure takes the hour's tint, and the silhouette
   * edge facing each light catches it. `ambient`/`tint` are RGB triples. */
  WV.relight = function (ctx, w, h, dark, lights, ambient, tint, warm) {
    warm = warm || [255, 188, 110];
    var img = ctx.getImageData(0, 0, w, h), d = img.data;
    function opaque(x, y) { return x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0; }
    var rim = new Float32Array(w * h);
    (dark > 0.15 ? lights : []).forEach(function (L) {
      var sx = Math.abs(L.dx) > Math.abs(L.dy) * 0.5 ? (L.dx > 0 ? 1 : -1) : 0, sy = L.dy < -Math.abs(L.dx) ? -1 : 0;
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        if (!opaque(x, y)) continue;
        if ((sx && !opaque(x + sx, y)) || (sy && !opaque(x, y + sy))) rim[y * w + x] = Math.max(rim[y * w + x], L.s * dark);
        else if (sx && !opaque(x + 2 * sx, y)) rim[y * w + x] = Math.max(rim[y * w + x], L.s * dark * 0.45);
      }
    });
    /* outlines melt into the air only as far as the light is low: crisp by
     * day, softer at dusk and night */
    var melt = 0.12 + 0.3 * dark;
    for (var i = 0; i < w * h; i++) {
      var o = i * 4; if (!d[o + 3]) continue;
      var r = d[o], g = d[o + 1], b = d[o + 2];
      if (0.3 * r + 0.59 * g + 0.11 * b < 48) { r = r * (1 - melt) + ambient[0] * melt; g = g * (1 - melt) + ambient[1] * melt; b = b * (1 - melt) + ambient[2] * melt; }
      r *= tint[0]; g *= tint[1]; b *= tint[2];
      var k = Math.min(0.8, rim[i]);
      if (k > 0) { r += (warm[0] - r) * k * 0.9; g += (warm[1] - g) * k * 0.8; b += (warm[2] - b) * k * 0.5; }
      d[o] = r; d[o + 1] = g; d[o + 2] = b;
    }
    ctx.putImageData(img, 0, 0);
  };
})(typeof window !== 'undefined' ? window : this);
