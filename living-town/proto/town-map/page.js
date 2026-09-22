/* page.js — prototype view of the tile-and-object town. A projection only. */
(function () {
  LT.ProductionHost.attach();
  LT.ActivityPoses.load();
  var C = window.TownCore, VW = 256, VH = 192, KIT = '../town-kit/';
  var qs = new URLSearchParams(location.search);
  var state = {
    mode: qs.get('mode') || 'overview', focus: +(qs.get('focus') || 0), hover: -1,
    ppm: +(qs.get('ppm') || 320), rate: +(qs.get('rate') || 1),
    t: +(qs.get('start') || 8 * 60), debug: qs.get('debug') === '1'
  };
  var GRADES = ['dusk', 'day', 'night'];
  var world, map, kitObjects, groundKit, host, mirror, mismatches = 0, checked = 0, ready = false;
  var images = {};          // key -> { dusk, day, night } Image
  var groundLayers = {};    // grade -> [frame canvases]

  function loadImage(src) {
    return new Promise(function (res) {
      var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = src;
    });
  }
  function loadGraded(key, base) {
    return Promise.all(GRADES.map(function (g) { return loadImage(base + (g === 'dusk' ? '' : '-' + g) + '.png'); }))
      .then(function (ims) { images[key] = { dusk: ims[0], day: ims[1] || ims[0], night: ims[2] || ims[0] }; });
  }
  function getJSON(u) { return fetch(u).then(function (r) { return r.json(); }); }

  Promise.all([getJSON('town.json'), getJSON(KIT + 'objects.json'), getJSON(KIT + 'ground/ground.json')]).then(function (r) {
    map = r[0]; kitObjects = r[1]; groundKit = r[2];
    if (window.setGroundTable) window.setGroundTable(groundKit);
    world = C.build(map, kitObjects);
    var loads = [loadGraded('ground', KIT + 'ground/ground'), loadGraded('backdrop', KIT + 'objects/backdrop')];
    kitObjects.forEach(function (k) {
      if (k.kind === 'backdrop') return;
      loads.push(loadGraded(k.id, KIT + k.file.replace(/\.png$/, '')));
      if (k.door) loads.push(loadGraded(k.id + ':open', KIT + 'objects/' + k.id + '-door-open'));
    });
    return Promise.all(loads);
  }).then(function () {
    buildGround();
    buildReflections();
    reset(); setMode(state.mode); ready = true;
  });

  /* The ground never changes but for the water: one canvas per grade per
   * water frame, laid once. */
  function buildGround() {
    var T = world.T, frames = 1;
    var grid = []; for (var y = 0; y < world.H; y++) { grid.push([]); for (var x = 0; x < world.W; x++) grid[y].push(C.materialAt(map, x, y)); }
    var picks = [];
    for (var yy = 0; yy < world.H; yy++) for (var xx = 0; xx < world.W; xx++) {
      var p = window.pickTile(grid, xx, yy, map.seed || 1);
      if (p && p.frames) frames = Math.max(frames, p.frames.length);
      picks.push(p);
    }
    GRADES.forEach(function (g) {
      var atlas = images.ground[g], cols = Math.floor(atlas.width / T);
      groundLayers[g] = [];
      for (var f = 0; f < frames; f++) {
        var cv = document.createElement('canvas'); cv.width = world.W * T; cv.height = world.H * T;
        var cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false;
        picks.forEach(function (p, i) {
          if (!p) return;
          var cell = p.frames ? p.frames[f % p.frames.length] : p.cell;
          var layers = Array.isArray(cell) ? cell : [cell];
          layers.forEach(function (c) {
            cx.drawImage(atlas, (c % cols) * T, Math.floor(c / cols) * T, T, T, (i % world.W) * T, Math.floor(i / world.W) * T, T, T);
          });
        });
        groundLayers[g].push(cv);
      }
    });
  }

  /* Water mirrors what stands above its shore: the wall, the park, the
   * buildings, the sky. Built once per grade from the ground and the
   * objects on land, flipped about each water column's shore line and kept
   * to water cells only; drawn each frame with a slow row wobble. People
   * are not in it: a prototype economy. */
  var reflections = {};
  function shoreOf(x) { for (var y = 0; y < world.H; y++) if (C.materialAt(map, x, y) === 'water') return y; return -1; }
  function buildReflections() {
    var T = world.T, WW = world.W * T, HH = world.H * T;
    GRADES.forEach(function (gr) {
      var scene = document.createElement('canvas'); scene.width = WW; scene.height = HH;
      var sc = scene.getContext('2d'); sc.imageSmoothingEnabled = false;
      sc.drawImage(groundLayers[gr][0], 0, 0);
      if (map.backdrop && images.backdrop[gr]) sc.drawImage(images.backdrop[gr], map.backdrop.x, map.backdrop.y);
      world.objects.filter(function (o) { return o.kit.kind !== 'foreground' && o.kit.kind !== 'backdrop'; })
        .sort(function (a, b) { return a.depth - b.depth; })
        .forEach(function (o) { var im = images[o.kit.id] && images[o.kit.id][gr]; if (im) sc.drawImage(im, o.px, o.py); });
      var ref = document.createElement('canvas'); ref.width = WW; ref.height = HH;
      var rc = ref.getContext('2d'); rc.imageSmoothingEnabled = false;
      /* Near the shore the bank mirrors, fading within a few rows; out in
       * the stream the water holds the sky, as in the painting: the
       * backdrop flipped, its tree line first, then the clouds. */
      var bd = images.backdrop && images.backdrop[gr];
      for (var tx = 0; tx < world.W; tx++) {
        var sy = shoreOf(tx); if (sy < 0) continue;
        var line = sy * T;
        for (var y = line; y < HH; y++) {
          if (C.materialAt(map, tx, Math.floor(y / T)) !== 'water') continue;
          var d = y - line, bank = Math.max(0, 1 - d / 34);
          if (bd) {
            var sky = Math.min(bd.height - 1, Math.floor(d * 1.25));
            rc.globalAlpha = 0.5;
            rc.drawImage(bd, tx * T, bd.height - 1 - sky, T, 1, tx * T, y, T, 1);
          }
          var src = 2 * line - y - 1;
          if (bank > 0 && src >= 0) { rc.globalAlpha = bank; rc.drawImage(scene, tx * T, src, T, 1, tx * T, y, T, 1); }
        }
      }
      rc.globalAlpha = 1;
      reflections[gr] = ref;
    });
  }
  function drawReflection(g, l, camX, camY) {
    var t = performance.now() / 1000, T = world.T, WW = world.W * T;
    [[l.a, 1], [l.b, l.k]].forEach(function (pair) {
      if (!pair[1]) return;
      var ref = reflections[pair[0]];
      for (var y = 0; y < world.H * T; y += 2) {
        /* fainter with distance from the shore, rippled a pixel either way */
        var off = Math.round(Math.sin(t * 1.3 + y * 0.45) * (y % 6 === 0 ? 1.4 : 0.8));
        g.globalAlpha = pair[1] * (y % 4 === 0 ? 0.3 : 0.4);
        g.drawImage(ref, 0, y, WW, 2, off - camX, y - camY, WW, 2);
      }
    });
    g.globalAlpha = 1;
  }

  function reset() {
    host = C.createTown(world, map.residents, 42, state.ppm); mirror = C.createTown(world, map.residents, 42, state.ppm);
    mismatches = 0; checked = 0;
    while (host.minute < Math.floor(state.t)) advance();
  }
  function advance() {
    C.stepMinute(host); C.stepMinute(mirror); checked++;
    if (C.fingerprint(host) !== C.fingerprint(mirror)) mismatches++;
  }

  /* ---- light ------------------------------------------------------------- */
  var LIGHT = [[0, 300, 'night', 'night'], [300, 390, 'night', 'dusk'], [390, 510, 'dusk', 'day'],
               [510, 1050, 'day', 'day'], [1050, 1170, 'day', 'dusk'], [1170, 1290, 'dusk', 'night'], [1290, 1440, 'night', 'night']];
  function lightAt(t) {
    var m = ((t % 1440) + 1440) % 1440;
    for (var i = 0; i < LIGHT.length; i++) { var L = LIGHT[i]; if (m < L[1]) return { a: L[2], b: L[3], k: L[2] === L[3] ? 0 : (m - L[0]) / (L[1] - L[0]) }; }
  }
  function nightness(l) { var v = { night: 1, dusk: 0.45, day: 0 }; return v[l.a] * (1 - l.k) + v[l.b] * l.k; }
  function drawGraded(g, key, l, dx, dy) {
    var set = images[key]; if (!set || !set.dusk) return;
    g.drawImage(set[l.a], dx, dy);
    if (l.k > 0) { g.globalAlpha = l.k; g.drawImage(set[l.b], dx, dy); g.globalAlpha = 1; }
  }

  var AMBIENT = { day: [112, 108, 92], dusk: [64, 66, 78], night: [26, 34, 58] };
  var TINT = { day: [1.0, 0.99, 0.95], dusk: [0.9, 0.86, 0.88], night: [0.52, 0.58, 0.8] };
  function mixGrade(tbl, l) { var a = tbl[l.a], b = tbl[l.b]; return [0, 1, 2].map(function (i) { return a[i] * (1 - l.k) + b[i] * l.k; }); }

  function lamps() {
    return world.objects.filter(function (o) { return o.kit.kind === 'lamp'; }).map(function (o) {
      var head = o.kit.light || [Math.floor(o.kit.w / 2), 6];
      return { hx: o.px + head[0], hy: o.py + head[1], gx: o.px + Math.floor(o.kit.w / 2), gy: o.depth };
    });
  }
  function litPlaces(ents) {
    var lit = {};
    ents.forEach(function (e) { if (!e.q.outdoors && world.places[e.p.at] && world.places[e.p.at].indoor) lit[e.p.at] = true; });
    return lit;
  }
  function lightsNear(fx, fy, ents) {
    var out = lamps().map(function (L) { return [L.hx, L.hy + 4, 70, 1]; });
    var lit = litPlaces(ents);
    world.objects.forEach(function (o) {
      var place = Object.keys(world.places).filter(function (k) { return world.places[k].object === o; })[0];
      if (!place || !(lit[place] || place === 'cafe')) return;
      (o.kit.windows || []).forEach(function (wn) { out.push([o.px + wn[0] + wn[2] / 2, o.py + wn[1] + wn[3] / 2, 50, 0.7]); });
    });
    return out.map(function (L) { var dx = L[0] - fx, dy = L[1] - (fy - 12), d = Math.sqrt(dx * dx + dy * dy); return { dx: dx, dy: dy, s: Math.max(0, 1 - d / L[2]) * L[3] }; })
      .filter(function (L) { return L.s > 0; });
  }

  var spriteBuf = document.createElement('canvas'); spriteBuf.width = 48; spriteBuf.height = 48;
  var sb = spriteBuf.getContext('2d', { willReadFrequently: true }); sb.imageSmoothingEnabled = false;
  function lightFigure(e, l, dark, ents) {
    var img = sb.getImageData(0, 0, 48, 48), d = img.data, amb = mixGrade(AMBIENT, l), tint = mixGrade(TINT, l);
    var lights = dark > 0.15 ? lightsNear(e.fx, e.fy, ents) : [];
    function opaque(x, y) { return x >= 0 && y >= 0 && x < 48 && y < 48 && d[(y * 48 + x) * 4 + 3] > 0; }
    var rim = new Float32Array(48 * 48);
    lights.forEach(function (L) {
      var sx = Math.abs(L.dx) > Math.abs(L.dy) * 0.5 ? (L.dx > 0 ? 1 : -1) : 0, sy = L.dy < -Math.abs(L.dx) ? -1 : 0;
      for (var y = 0; y < 48; y++) for (var x = 0; x < 48; x++) {
        if (!opaque(x, y)) continue;
        if ((sx && !opaque(x + sx, y)) || (sy && !opaque(x, y + sy))) rim[y * 48 + x] = Math.max(rim[y * 48 + x], L.s * dark);
        else if (sx && !opaque(x + 2 * sx, y)) rim[y * 48 + x] = Math.max(rim[y * 48 + x], L.s * dark * 0.45);
      }
    });
    for (var i = 0; i < 48 * 48; i++) {
      var o = i * 4; if (!d[o + 3]) continue;
      var r = d[o], gg = d[o + 1], b = d[o + 2], lum = 0.3 * r + 0.59 * gg + 0.11 * b;
      if (lum < 48) { var m = 0.42; r = r * (1 - m) + amb[0] * m; gg = gg * (1 - m) + amb[1] * m; b = b * (1 - m) + amb[2] * m; }
      r *= tint[0]; gg *= tint[1]; b *= tint[2];
      var k = Math.min(0.8, rim[i]);
      if (k > 0) { r += (255 - r) * k * 0.9; gg += (188 - gg) * k * 0.8; b += (110 - b) * k * 0.5; }
      d[o] = r; d[o + 1] = gg; d[o + 2] = b;
    }
    sb.putImageData(img, 0, 0);
  }

  /* ---- people ------------------------------------------------------------ */
  var LANES = [-5, 4, -1, 8, -8];
  function entities() {
    var atSpot = {};
    return host.people.map(function (p, i) {
      var q = C.positionAt(host, p, state.t), ox = 0, oy = 0, seated = false;
      if (q.moving) {
        var lane = LANES[i % LANES.length] * Math.min(1, q.fromEnds / 14);
        ox = q.nx * lane; oy = q.ny * lane;
      } else if (q.outdoors) {
        var spot = world.spots[q.place], n = atSpot[q.place] = (atSpot[q.place] || 0) + 1;
        if (spot && spot.seats && n <= spot.seats.length) { ox = spot.seats[n - 1][0]; oy = spot.seats[n - 1][1]; seated = true; }
        else { var ring = [[0, 0], [-14, 3], [14, 3], [-7, 12], [7, 12]][(n - 1) % 5]; ox = ring[0]; oy = ring[1]; }
      }
      var fx = Math.round(q.x + ox), fy = Math.round(q.y + oy);
      return { i: i, p: p, q: q, fx: fx, fy: fy, seated: seated };
    });
  }

  /* ---- drawing ----------------------------------------------------------- */
  var cv = { overview: document.getElementById('overview'), follow: document.getElementById('follow') };
  var gOver, gFol;
  function sizeCanvases() {
    if (!world) return;
    var WW = world.W * world.T, HH = world.H * world.T;
    if (!gOver) { gOver = EMBER.Viewport.attachNative(cv.overview, WW, HH); gFol = EMBER.Viewport.attachNative(cv.follow, VW, VH); }
    var aw = window.innerWidth - 32, ah = window.innerHeight - 70;
    var so = EMBER.Viewport.integerScale(aw, ah, WW, HH), sf = EMBER.Viewport.integerScale(aw, ah, VW, VH);
    cv.overview.style.width = WW * so + 'px'; cv.overview.style.height = HH * so + 'px';
    cv.follow.style.width = VW * sf + 'px'; cv.follow.style.height = VH * sf + 'px';
  }
  window.addEventListener('resize', sizeCanvases);

  function drawWorld(g, camX, camY, ents) {
    var l = lightAt(state.t), dark = nightness(l), T = world.T;
    g.fillStyle = '#101416'; g.fillRect(0, 0, g.canvas.width, g.canvas.height);
    var frames = groundLayers[l.a].length, f = Math.floor(performance.now() / 420) % frames;
    g.drawImage(groundLayers[l.a][f], -camX, -camY);
    if (l.k > 0) { g.globalAlpha = l.k; g.drawImage(groundLayers[l.b][f], -camX, -camY); g.globalAlpha = 1; }
    if (map.backdrop) drawGraded(g, 'backdrop', l, map.backdrop.x - camX, map.backdrop.y - camY);
    drawReflection(g, l, camX, camY);

    /* lamp pools lie on the ground, under everything standing */
    if (dark > 0.3) {
      var a = (dark - 0.3) / 0.7;
      g.globalCompositeOperation = 'lighter';
      lamps().forEach(function (L) {
        [[30, 9, 0.05], [21, 7, 0.06], [12, 4, 0.07]].forEach(function (r) {
          g.fillStyle = 'rgba(255,170,80,' + (r[2] * a).toFixed(3) + ')';
          g.fillRect(L.gx - camX - r[0], L.gy - camY - r[1], r[0] * 2, r[1] * 2);
          g.fillRect(L.gx - camX - r[0] + 4, L.gy - camY - r[1] - 2, r[0] * 2 - 8, r[1] * 2 + 4);
        });
      });
      g.globalCompositeOperation = 'source-over';
    }

    var lit = litPlaces(ents);
    var order = [];
    world.objects.forEach(function (o) { if (o.kit.kind !== 'backdrop') order.push({ y: o.depth, o: o }); });
    ents.forEach(function (e) { if (e.q.outdoors) order.push({ y: e.fy, e: e }); });
    order.sort(function (A, B) { return A.y - B.y || (A.o ? -1 : 1); });
    var how = LT.ProductionHost.ready ? 'atlas' : 'placeholder';
    order.forEach(function (it) {
      if (it.o) { drawObject(g, it.o, l, dark, lit, camX, camY); return; }
      drawPerson(g, it.e, l, dark, ents, camX, camY, how);
    });

    if (dark > 0.3) {
      var a2 = (dark - 0.3) / 0.7, tt = performance.now() / 1000;
      g.globalCompositeOperation = 'lighter';
      lamps().forEach(function (L) {
        var tx = Math.floor(L.hx / T), sh = shoreOf(Math.max(0, Math.min(world.W - 1, tx)));
        if (sh < 0) return;
        var line = sh * T, my = 2 * line - L.hy;
        if (my - line > 260 || my < line) return;
        my = Math.min(my, line + 90);
        for (var k = 0; k < 7; k++) {
          var yy = my - 6 + k * 5, wob = Math.round(Math.sin(tt * 2 + k) * 1.5), w = 5 - Math.abs(k - 3);
          g.fillStyle = 'rgba(255,196,110,' + (0.22 * a2).toFixed(3) + ')';
          g.fillRect(L.hx - camX - w + wob, yy - camY, w * 2, 2);
        }
      });
      g.globalCompositeOperation = 'source-over';
      g.globalCompositeOperation = 'lighter';
      lamps().forEach(function (L) {
        [[9, 0.06], [5, 0.10]].forEach(function (r) { g.fillStyle = 'rgba(255,190,110,' + (r[1] * a2).toFixed(3) + ')'; g.fillRect(L.hx - camX - r[0], L.hy - camY - r[0], r[0] * 2, r[0] * 2); });
      });
      g.globalCompositeOperation = 'source-over';
    }
    if (state.debug) drawDebug(g, camX, camY);
  }

  function placeOf(o) { return Object.keys(world.places).filter(function (k) { return world.places[k].object === o; }); }

  function drawObject(g, o, l, dark, lit, camX, camY) {
    var x = o.px - camX, y = o.py - camY;
    drawGraded(g, o.kit.id, l, x, y);
    if (!o.door) return;
    var places = placeOf(o), open = 0;
    places.forEach(function (pl) { open = Math.max(open, C.doorOpen(host, pl, state.t)); });
    if (open && images[o.kit.id + ':open']) { drawGraded(g, o.kit.id + ':open', l, x, y); doorway(g, x, y, o.kit.door.rect, dark); }
    var home = places.some(function (pl) { return lit[pl]; });
    if (home) (o.kit.windows || []).forEach(function (wn) { litWindow(g, x + wn[0], y + wn[1], wn[2], wn[3], dark); });
  }

  /* An open door shows a lit hall: warm wall, a floor, the leaf's edge, and
   * light falling out over the step, stronger as the evening darkens. */
  function doorway(g, x, y, r, dark) {
    var dx = x + r[0] + 1, dy = y + r[1] + 1, w = r[2] - 2, h = r[3] - 2, warm = 0.55 + 0.45 * dark;
    g.fillStyle = '#6b4128'; g.fillRect(dx, dy, w, h);
    g.fillStyle = '#9a6236'; g.fillRect(dx + 1, dy + 2, w - 3, h - 8);
    g.fillStyle = '#c98a45'; g.fillRect(dx + 2, dy + 4, w - 6, h - 12);
    g.fillStyle = '#e8b664'; g.fillRect(dx + 3, dy + 6, Math.max(2, w - 9), 4);
    g.fillStyle = '#7a5134'; g.fillRect(dx + 1, dy + h - 7, w - 2, 6);
    g.fillStyle = '#a57044'; g.fillRect(dx + 2, dy + h - 7, w - 4, 1);
    g.fillStyle = '#3e2a1c'; g.fillRect(dx + w - 3, dy, 3, h);
    g.fillStyle = '#d9a35a'; g.fillRect(dx + w - 3, dy + 1, 1, h - 2);
    g.globalCompositeOperation = 'lighter';
    [[0, 0.10], [3, 0.07], [6, 0.05]].forEach(function (st) {
      g.fillStyle = 'rgba(255,176,90,' + (st[1] * warm).toFixed(3) + ')';
      g.fillRect(dx - st[0], dy + h, w + st[0] * 2, 5 + st[0] * 2);
    });
    g.globalCompositeOperation = 'source-over';
  }

  function litWindow(g, x, y, ww, hh, dark) {
    var glow = 0.35 + 0.65 * dark;
    g.globalCompositeOperation = 'lighter';
    [[8, 6, 0.035], [5, 4, 0.05], [2, 2, 0.07]].forEach(function (r) {
      g.fillStyle = 'rgba(255,170,80,' + (r[2] * glow).toFixed(3) + ')'; g.fillRect(x - r[0], y - r[1], ww + r[0] * 2, hh + r[1] * 3);
    });
    g.fillStyle = 'rgba(255,170,80,' + (0.05 * glow).toFixed(3) + ')'; g.fillRect(x - 2, y + hh + 2, ww + 4, 14);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#b8742f'; g.fillRect(x + 1, y + 1, ww - 2, hh - 2);
    g.fillStyle = '#e2a24a'; g.fillRect(x + 1, y + 3, ww - 2, hh - 4);
    g.fillStyle = '#f4c870'; g.fillRect(x + 2, y + Math.floor(hh / 2) + 1, ww - 4, Math.ceil(hh / 2) - 3);
    g.fillStyle = '#fbe3a0'; g.fillRect(x + 2, y + hh - 4, Math.max(2, Math.floor(ww / 3)), 2);
    g.fillStyle = '#4a3222'; g.fillRect(x + Math.floor(ww / 2), y + 1, 1, hh - 2); g.fillRect(x + 1, y + Math.floor(hh / 2), ww - 2, 1);
  }

  function drawPerson(g, e, l, dark, ents, camX, camY, how) {
    var sheet = e.p.look || LT.Appearance.ORDER[e.i % LT.Appearance.ORDER.length];
    var sx = e.fx - camX, sy = e.fy - camY;
    if (!e.seated) { g.fillStyle = 'rgba(18,22,26,0.34)'; g.fillRect(sx - 6, sy - 1, 12, 3); g.fillRect(sx - 4, sy - 2, 8, 5); }
    sb.clearRect(0, 0, 48, 48);
    var drew = false;
    if (e.seated && LT.ActivityPoses.ready) drew = LT.ActivityPoses.draw(sb, sheet, 'seated', 'down', 16, 16, 0, { shadow: false }) !== false;
    if (!drew && how === 'atlas') {
      GAME.Sprites.drawChar(sb, 16, 16, LT.ProductionHost.looks[sheet], e.q.dir || 'down',
        e.q.moving ? EMBER.Grid.walkPhase(e.q.phase % 1) : 0, 1, e.q.moving, false, performance.now() / 1000,
        { mapId: 'lt_street', wx: e.fx, wy: e.fy, npcId: e.p.id, characterLife: null });
    } else if (!drew) { sb.fillStyle = '#e2b458'; sb.fillRect(20, 10, 8, 20); }
    lightFigure(e, l, dark, ents);
    /* drawChar's (16,16) is the tile's top-left; feet sit at the tile bottom */
    g.drawImage(spriteBuf, sx - 8 - 16, sy + 3 - 16 - 16);
  }

  function drawDebug(g, camX, camY) {
    var T = world.T;
    for (var y = 0; y < world.H; y++) for (var x = 0; x < world.W; x++) if (world.blocked[y * world.W + x]) {
      g.fillStyle = 'rgba(255,0,60,.25)'; g.fillRect(x * T - camX, y * T - camY, T, T);
    }
    world.objects.forEach(function (o) {
      g.fillStyle = '#0ff'; g.fillRect(o.px - camX, o.depth - camY, o.kit.w, 1);
      if (o.door) { g.strokeStyle = '#0f0'; g.strokeRect(o.door.tx * T - camX + .5, o.door.ty * T - camY + .5, o.door.w * T - 1, T - 1); }
    });
    Object.keys(world.spots).forEach(function (k) { var s = world.spots[k]; g.strokeStyle = '#ff0'; g.strokeRect(s.tile[0] * T - camX + .5, s.tile[1] * T - camY + .5, T - 1, T - 1); });
    host.people.forEach(function (p) {
      if (!p.walk) return;
      g.strokeStyle = 'rgba(255,0,255,.9)'; g.beginPath();
      p.walk.route.legs.forEach(function (L, i) { if (!i) g.moveTo(L.a[0] - camX, L.a[1] - camY); g.lineTo(L.b[0] - camX, L.b[1] - camY); });
      g.stroke();
    });
  }

  function label(g, text, x, y, colour) {
    var F = GAME.RetroFont, t = text.toUpperCase(), w = (F ? F.measure(t, 1) : t.length * 6) + 6, x0 = Math.round(x - w / 2), y0 = y - 9;
    g.fillStyle = 'rgba(20,22,28,0.82)'; g.fillRect(x0, y0, w, 11);
    g.fillStyle = 'rgba(233,180,88,0.55)'; g.fillRect(x0 + 1, y0 + 10, w - 2, 1);
    if (F) F.draw(g, t, x0 + 3, y0 + 2, colour, { scale: 1 });
    g.fillStyle = 'rgba(20,22,28,0.82)'; g.fillRect(Math.round(x) - 1, y0 + 11, 3, 1); g.fillRect(Math.round(x), y0 + 12, 1, 1);
  }

  function frame() {
    var ents = entities();
    if (state.mode === 'overview') {
      drawWorld(gOver, 0, 0, ents);
      ents.filter(function (e) { return e.i === state.focus || e.i === state.hover || qs.get('labels') === 'all'; }).forEach(function (e) {
        if (qs.get('labels') === '0') return;
        if (e.q.outdoors) label(gOver, e.p.name, e.fx, e.fy - 28, e.i === state.focus ? '#e9b458' : '#e8e2d2');
        else { var pl = world.places[e.p.at], f = C.feet(world, pl.tile); label(gOver, e.p.name, f[0], f[1] - 34, '#f3d27a'); }
      });
    } else {
      var f = ents[state.focus];
      var cam = EMBER.Camera.centerOn(f.fx - 8, f.fy - 16, { anchorX: 8, anchorY: 8, worldW: world.W * world.T, worldH: world.H * world.T, viewW: VW, viewH: VH });
      drawWorld(gFol, Math.round(cam.x), Math.round(cam.y), ents);
      var cap = document.getElementById('caption');
      if (cap) cap.textContent = f.p.name + (f.q.outdoors ? (f.q.moving ? ' · walking' : ' · outside') : ' · inside');
    }
    var hh = String(Math.floor(state.t / 60) % 24).padStart(2, '0'), mm = String(Math.floor(state.t) % 60).padStart(2, '0');
    document.getElementById('stats').innerHTML = hh + ':' + mm + ' · walking ' + ents.filter(function (e) { return e.q.moving; }).length +
      ' · walks ' + host.walks + ' · mirror <span class="' + (mismatches ? 'bad' : 'ok') + '">' + (checked - mismatches) + '/' + checked + ' minutes match</span>';
  }

  var last = performance.now(), paused = qs.get('paused') === '1';
  function loop(now) {
    var dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (ready) {
      if (!gOver) sizeCanvases();
      if (!paused) { state.t += dt * state.rate; while (host.minute < Math.floor(state.t)) advance(); }
      try { frame(); } catch (err) { document.getElementById('stats').textContent = 'ERROR ' + err.message + ' ' + (err.stack || '').split('\n')[1]; }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function nearest(ev) {
    var r = cv.overview.getBoundingClientRect(), s = r.width / (world.W * world.T);
    var x = (ev.clientX - r.left) / s, y = (ev.clientY - r.top) / s, best = -1, bd = 28 * 28;
    entities().forEach(function (e) { if (!e.q.outdoors) return; var dx = e.fx - x, dy = e.fy - 10 - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = e.i; } });
    return best;
  }
  cv.overview.addEventListener('click', function (ev) { var b = nearest(ev); if (b >= 0) { state.focus = b; setMode('follow'); } });
  cv.overview.addEventListener('mousemove', function (ev) { state.hover = nearest(ev); });
  cv.follow.addEventListener('click', function () { setMode('overview'); });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMode('overview');
    if (e.key === 'Tab') { e.preventDefault(); state.focus = (state.focus + 1) % host.people.length; }
    if (e.key === ' ') paused = !paused;
    if (e.key === 'd') state.debug = !state.debug;
  });
  function setMode(m) {
    state.mode = m;
    cv.overview.style.display = m === 'overview' ? 'block' : 'none';
    cv.follow.style.display = m === 'follow' ? 'block' : 'none';
    document.getElementById('bOverview').classList.toggle('on', m === 'overview');
    document.getElementById('bFollow').classList.toggle('on', m === 'follow');
  }
  document.getElementById('bOverview').onclick = function () { setMode('overview'); };
  document.getElementById('bFollow').onclick = function () { setMode('follow'); };
  var sp = document.getElementById('speed'); sp.value = String(state.ppm);
  sp.onchange = function () { state.ppm = +sp.value; reset(); };
  var rt = document.getElementById('rate'); rt.value = String(state.rate);
  rt.onchange = function () { state.rate = +rt.value; };
  window.PROTO = { state: state, ready: function () { return ready && LT.ProductionHost.ready; }, world: function () { return world; }, host: function () { return host; } };
})();
