/* page.js — prototype view: the plate, the people, what covers them. */
(function () {
  LT.ProductionHost.attach();
  var P = window.ProtoMap, VW = 256, VH = 192;
  var qs = new URLSearchParams(location.search);
  var state = {
    mode: qs.get('mode') || 'overview', focus: +(qs.get('focus') || 0),
    ppm: +(qs.get('ppm') || 320), rate: +(qs.get('rate') || 1),
    t: +(qs.get('start') || 8 * 60), debug: qs.get('debug') === '1'
  };
  var host, mirror, mismatches = 0, checked = 0;
  /* Three grades of one painting: dusk (the painting), day and night. */
  var loaded = 0, GRADES = {};
  ['dusk', 'day', 'night'].forEach(function (k) {
    var pl = new Image(), f = new Image(), suffix = k === 'dusk' ? '' : '-' + k;
    pl.onload = f.onload = function () { loaded++; };
    pl.src = 'plate' + suffix + '.png'; f.src = 'fg' + suffix + '.png';
    GRADES[k] = { plate: pl, fg: f };
  });
  LT.ActivityPoses.load();
  /* [from, to, grade a, grade b]: a fades into b across the span. */
  var LIGHT = [[0, 300, 'night', 'night'], [300, 390, 'night', 'dusk'], [390, 510, 'dusk', 'day'],
               [510, 1050, 'day', 'day'], [1050, 1170, 'day', 'dusk'], [1170, 1290, 'dusk', 'night'], [1290, 1440, 'night', 'night']];
  function lightAt(t) {
    var m = ((t % 1440) + 1440) % 1440;
    for (var i = 0; i < LIGHT.length; i++) {
      var L = LIGHT[i];
      if (m < L[1]) return { a: L[2], b: L[3], k: L[2] === L[3] ? 0 : (m - L[0]) / (L[1] - L[0]) };
    }
  }
  function nightness(l) { var v = { night: 1, dusk: 0.45, day: 0 }; return v[l.a] * (1 - l.k) + v[l.b] * l.k; }
  function blit(g, which, l, sx, sy, w, h, dx, dy) {
    g.drawImage(GRADES[l.a][which], sx, sy, w, h, dx, dy, w, h);
    if (l.k > 0) { g.globalAlpha = l.k; g.drawImage(GRADES[l.b][which], sx, sy, w, h, dx, dy, w, h); g.globalAlpha = 1; }
  }
  /* The air the figure stands in, per grade: outlines melt toward it and the
   * whole figure takes its tint. */
  var AMBIENT = { day: [112, 108, 92], dusk: [64, 66, 78], night: [26, 34, 58] };
  var TINT = { day: [1.0, 0.99, 0.95], dusk: [0.9, 0.86, 0.88], night: [0.52, 0.58, 0.8] };
  function mixGrade(tbl, l) { var a = tbl[l.a], b = tbl[l.b]; return [0, 1, 2].map(function (i) { return a[i] * (1 - l.k) + b[i] * l.k; }); }
  /* Lights a figure can catch: lamps always, the café window while open,
   * a home's windows while someone is in. */
  function lightsNear(fx, fy, ents) {
    var out = P.LAMPS.map(function (L) { return [L[0], L[1] + 6, 70, 1]; });
    out.push([362, 132, 80, 0.9]);
    ents.forEach(function (e) { if (!e.q.outdoors && P.WINDOWS[e.p.at]) P.WINDOWS[e.p.at].forEach(function (w) { out.push([w[0] + w[2] / 2, w[1] + w[3] / 2, 46, 0.7]); }); });
    return out.map(function (L) { var dx = L[0] - fx, dy = L[1] - (fy - 12), d = Math.sqrt(dx * dx + dy * dy); return { dx: dx, dy: dy, s: Math.max(0, 1 - d / L[2]) * L[3] }; })
      .filter(function (L) { return L.s > 0; });
  }
  function lightFigure(e, l, dark, ents) {
    var img = sb.getImageData(0, 0, 48, 48), d = img.data, amb = mixGrade(AMBIENT, l), tint = mixGrade(TINT, l);
    var lights = dark > 0.15 ? lightsNear(e.fx, e.fy, ents) : [];
    function opaque(x, y) { return x >= 0 && y >= 0 && x < 48 && y < 48 && d[(y * 48 + x) * 4 + 3] > 0; }
    var rim = new Float32Array(48 * 48);
    lights.forEach(function (L) {
      /* The silhouette edge that faces the light catches it. */
      var sx = Math.abs(L.dx) > Math.abs(L.dy) * 0.5 ? (L.dx > 0 ? 1 : -1) : 0, sy = L.dy < -Math.abs(L.dx) ? -1 : 0;
      for (var y = 0; y < 48; y++) for (var x = 0; x < 48; x++) {
        if (!opaque(x, y)) continue;
        if ((sx && !opaque(x + sx, y)) || (sy && !opaque(x, y + sy))) rim[y * 48 + x] = Math.max(rim[y * 48 + x], L.s * dark);
        else if ((sx && !opaque(x + 2 * sx, y))) rim[y * 48 + x] = Math.max(rim[y * 48 + x], L.s * dark * 0.45);
      }
    });
    for (var i = 0; i < 48 * 48; i++) {
      var o = i * 4;
      if (!d[o + 3]) continue;
      var r = d[o], gg = d[o + 1], b = d[o + 2], lum = 0.3 * r + 0.59 * gg + 0.11 * b;
      if (lum < 48) { var m = 0.42; r = r * (1 - m) + amb[0] * m; gg = gg * (1 - m) + amb[1] * m; b = b * (1 - m) + amb[2] * m; }
      r *= tint[0]; gg *= tint[1]; b *= tint[2];
      var k = Math.min(0.8, rim[i]);
      if (k > 0) { r += (255 - r) * k * 0.9; gg += (188 - gg) * k * 0.8; b += (110 - b) * k * 0.5; }
      d[o] = r; d[o + 1] = gg; d[o + 2] = b;
    }
    sb.putImageData(img, 0, 0);
  }
  var spriteBuf = document.createElement('canvas'); spriteBuf.width = 48; spriteBuf.height = 48;
  var sb = spriteBuf.getContext('2d', { willReadFrequently: true }); sb.imageSmoothingEnabled = false;

  function reset() {
    host = P.createTown(42, state.ppm); mirror = P.createTown(42, state.ppm);
    mismatches = 0; checked = 0;
    while (host.minute < Math.floor(state.t)) advance();
  }
  function advance() {
    P.stepMinute(host); P.stepMinute(mirror); checked++;
    if (P.fingerprint(host) !== P.fingerprint(mirror)) mismatches++;
  }

  var cv = { overview: document.getElementById('overview'), follow: document.getElementById('follow') };
  var gOver = EMBER.Viewport.attachNative(cv.overview, P.W, P.H);
  var gFol = EMBER.Viewport.attachNative(cv.follow, VW, VH);
  function scaleCanvases() {
    var aw = window.innerWidth - 32, ah = window.innerHeight - 70;
    var so = EMBER.Viewport.integerScale(aw, ah, P.W, P.H), sf = EMBER.Viewport.integerScale(aw, ah, VW, VH);
    cv.overview.style.width = P.W * so + 'px'; cv.overview.style.height = P.H * so + 'px';
    cv.follow.style.width = VW * sf + 'px'; cv.follow.style.height = VH * sf + 'px';
  }
  window.addEventListener('resize', scaleCanvases); scaleCanvases();

  /* Walkers share the street: each keeps a lane of their own across it, so
   * five people on one pavement do not stand in one another. View only. */
  var LANES = [-6, 5, -1, 10, -10];
  function entities() {
    var atSpot = {};
    return host.people.map(function (p, i) {
      var q = P.positionAt(host, p, state.t), ox = 0, oy = 0, seated = false;
      if (q.moving) {
        /* Keep to one's own side of the way; fade to the middle at doors. */
        var lane = LANES[i % LANES.length] * Math.min(1, q.fromEnds / 14);
        ox = q.nx * lane; oy = q.ny * lane;
      } else if (q.outdoors) {
        var spot = q.place || '', n = atSpot[spot] = (atSpot[spot] || 0) + 1, slots = P.SLOTS[spot];
        var seats = P.SEATS[spot];
        if (seats && n <= seats.length) { ox = seats[n - 1][0]; oy = seats[n - 1][1]; seated = true; }
        else if (slots) { var sl = slots[(n - 1) % slots.length]; ox = sl[0]; oy = sl[1]; }
      }
      var fx = Math.round(q.x + ox), fy = Math.round(q.y + oy);
      return { i: i, p: p, q: q, fx: fx, fy: fy, wx: fx - 8, wy: fy - 16, seated: seated };
    });
  }

  function drawWorld(g, camX, camY, ents) {
    g.fillStyle = '#101416'; g.fillRect(0, 0, g.canvas.width, g.canvas.height);
    if (loaded < 6) return;
    var l = lightAt(state.t), dark = nightness(l);
    blit(g, 'plate', l, 0, 0, P.W, P.H, -camX, -camY);
    /* The river moves: thin bands of open water slide a pixel either way. */
    var tt = performance.now() / 1000;
    for (var ry = 334; ry < 372; ry += 2) {
      var off = Math.round(Math.sin(tt * 1.1 + ry * 0.55) * 0.9);
      if (off) blit(g, 'plate', l, 96, ry, 500, 2, 96 + off - camX, ry - camY);
    }
    /* Lamps at night: a stepped warm pool on the ground and a halo at the head. */
    if (dark > 0.3) {
      var a = (dark - 0.3) / 0.7;
      g.globalCompositeOperation = 'lighter';
      P.LAMPS.forEach(function (L) {
        var hx = L[0] - camX, hy = L[1] - camY, gx = L[0] - camX, gy = L[2] - camY;
        [[30, 9, 0.05], [21, 7, 0.06], [12, 4, 0.07]].forEach(function (r) {
          g.fillStyle = 'rgba(255,170,80,' + (r[2] * a).toFixed(3) + ')';
          g.fillRect(gx - r[0], gy - r[1], r[0] * 2, r[1] * 2);
          g.fillRect(gx - r[0] + 4, gy - r[1] - 2, r[0] * 2 - 8, r[1] * 2 + 4);
        });
        [[9, 0.06], [5, 0.10]].forEach(function (r) {
          g.fillStyle = 'rgba(255,190,110,' + (r[1] * a).toFixed(3) + ')';
          g.fillRect(hx - r[0], hy - r[0], r[0] * 2, r[0] * 2);
        });
      });
      g.globalCompositeOperation = 'source-over';
    }
    /* Home is a lit window. */
    ents.forEach(function (e) {
      if (e.q.outdoors || !P.WINDOWS[e.p.at]) return;
      P.WINDOWS[e.p.at].forEach(function (w) {
        var x = w[0] - camX, y = w[1] - camY, ww = w[2], hh = w[3], glow = 0.35 + 0.65 * dark;
        g.globalCompositeOperation = 'lighter';
        [[8, 6, 0.035], [5, 4, 0.05], [2, 2, 0.07]].forEach(function (r) {
          g.fillStyle = 'rgba(255,170,80,' + (r[2] * glow).toFixed(3) + ')';
          g.fillRect(x - r[0], y - r[1], ww + r[0] * 2, hh + r[1] * 2 + r[1]);
        });
        /* light falls out of the window onto the sill and the ground below */
        g.fillStyle = 'rgba(255,170,80,' + (0.05 * glow).toFixed(3) + ')'; g.fillRect(x - 2, y + hh + 2, ww + 4, 14);
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = '#b8742f'; g.fillRect(x + 1, y + 1, ww - 2, hh - 2);
        g.fillStyle = '#e2a24a'; g.fillRect(x + 1, y + 3, ww - 2, hh - 4);
        g.fillStyle = '#f4c870'; g.fillRect(x + 2, y + Math.floor(hh / 2) + 1, ww - 4, Math.ceil(hh / 2) - 3);
        g.fillStyle = '#fbe3a0'; g.fillRect(x + 2, y + hh - 4, Math.max(2, Math.floor(ww / 3)), 2);
        g.fillStyle = '#4a3222'; g.fillRect(x + Math.floor(ww / 2), y + 1, 1, hh - 2);
        g.fillRect(x + 1, y + Math.floor(hh / 2), ww - 2, 1);
      });
    });
    var out = ents.filter(function (e) { return e.q.outdoors; }).sort(function (a, b) { return a.fy - b.fy || a.i - b.i; });
    var how = LT.ProductionHost.ready ? 'atlas' : 'placeholder';
    var pieces = P.FG.slice().sort(function (a, b) { return a.depth - b.depth; });
    /* Pieces deeper than a person cover them: draw people from the back, and
     * lay each piece right after the last person who stands behind it. */
    var order = [];
    out.forEach(function (e) { order.push({ kind: 'p', y: e.fy, e: e }); });
    pieces.forEach(function (f) { order.push({ kind: 'f', y: f.depth, f: f }); });
    order.sort(function (a, b) { return a.y - b.y || (a.kind === 'p' ? -1 : 1); });
    order.forEach(function (o) {
      if (o.kind === 'f') { blit(g, 'fg', l, o.f.x, o.f.y, o.f.w, o.f.h, o.f.x - camX, o.f.y - camY); return; }
      var e = o.e, sheet = LT.Appearance.ORDER[e.i % LT.Appearance.ORDER.length];
      /* A soft contact shadow, then the figure drawn off-screen and lit like
       * the plate around it, so nobody is brighter than the street at night. */
      var sx = e.fx - camX, sy = e.fy - camY;
      if (!e.seated) {
        g.fillStyle = 'rgba(18,22,26,0.34)'; g.fillRect(sx - 6, sy - 2, 12, 3); g.fillRect(sx - 4, sy - 3, 8, 5);
      }
      sb.clearRect(0, 0, 48, 48);
      var drew = false;
      if (e.seated && LT.ActivityPoses.ready) drew = LT.ActivityPoses.draw(sb, sheet, 'seated', 'down', 16, 16, 0, { shadow: false }) !== false;
      if (!drew && how === 'atlas') {
        GAME.Sprites.drawChar(sb, 16, 16, LT.ProductionHost.looks[sheet], e.q.dir || 'down',
          e.q.moving ? EMBER.Grid.walkPhase(e.q.phase % 1) : 0, 1, e.q.moving, false, performance.now() / 1000,
          { mapId: 'lt_street', wx: e.wx, wy: e.wy, npcId: e.p.id, characterLife: null });
      } else if (!drew) { sb.fillStyle = '#e2b458'; sb.fillRect(20, 10, 8, 20); }
      lightFigure(e, l, dark, ents);
      g.drawImage(spriteBuf, e.wx - camX - 16, e.wy - camY - 16);
    });
    if (state.debug) drawDebug(g, camX, camY);
  }

  function drawDebug(g, camX, camY) {
    g.strokeStyle = 'rgba(255,0,255,.9)'; g.lineWidth = 1;
    P.EDGES.forEach(function (e) {
      var a = P.NODES[e[0]], b = P.NODES[e[1]];
      g.beginPath(); g.moveTo(a[0] - camX + .5, a[1] - camY + .5); g.lineTo(b[0] - camX + .5, b[1] - camY + .5); g.stroke();
    });
    Object.keys(P.NODES).forEach(function (k) { var n = P.NODES[k]; g.fillStyle = '#ff0'; g.fillRect(n[0] - 1 - camX, n[1] - 1 - camY, 3, 3); });
    P.FG.forEach(function (f) { g.strokeStyle = 'rgba(0,255,255,.8)'; g.strokeRect(f.x - camX + .5, f.y - camY + .5, f.w, f.h); g.fillStyle = '#0ff'; g.fillRect(f.x - camX, f.depth - camY, f.w, 1); });
    Object.keys(P.WINDOWS).forEach(function (k) { P.WINDOWS[k].forEach(function (w) { g.strokeStyle = '#f80'; g.strokeRect(w[0] - camX + .5, w[1] - camY + .5, w[2], w[3]); }); });
  }

  function label(g, text, x, y, colour) {
    var F = GAME.RetroFont, t = text.toUpperCase(), w = (F ? F.measure(t, 1) : t.length * 6) + 6, x0 = Math.round(x - w / 2), y0 = y - 9;
    g.fillStyle = 'rgba(20,22,28,0.82)'; g.fillRect(x0, y0, w, 11);
    g.fillStyle = 'rgba(233,180,88,0.55)'; g.fillRect(x0 + 1, y0 + 10, w - 2, 1);
    if (F) F.draw(g, t, x0 + 3, y0 + 2, colour, { scale: 1 });
    else { g.fillStyle = colour; g.font = '8px monospace'; g.fillText(t, x0 + 3, y0 + 9); }
    g.fillStyle = 'rgba(20,22,28,0.82)'; g.fillRect(Math.round(x) - 1, y0 + 11, 3, 1); g.fillRect(Math.round(x), y0 + 12, 1, 1);
  }

  function frame() {
    var ents = entities();
    if (state.mode === 'overview') {
      drawWorld(gOver, 0, 0, ents);
      /* Names only for whoever the viewer points at or follows: a town, not a legend. */
      if (qs.get('labels') !== '0') ents.filter(function (e) { return e.i === state.focus || e.i === state.hover || qs.get('labels') === 'all'; }).forEach(function (e) {
        if (e.q.outdoors) label(gOver, e.p.name, e.fx, e.fy - 27, e.i === state.focus ? '#e9b458' : '#e8e2d2');
        else { var n = P.NODES[P.PLACES[e.p.at]]; label(gOver, e.p.name, n[0], n[1] - 32 - (e.p.at === 'flat_c' ? 10 : 0), '#f3d27a'); }
      });
    } else {
      var f = ents[state.focus];
      var cam = EMBER.Camera.centerOn(f.fx - 8, f.fy - 16, { anchorX: 8, anchorY: 8, worldW: P.W, worldH: P.H, viewW: VW, viewH: VH });
      drawWorld(gFol, Math.round(cam.x), Math.round(cam.y), ents);
      label(gFol, f.p.name + (f.q.outdoors ? '' : ' · at home'), 128, 12, '#e9b458');
    }
    var hh = String(Math.floor(state.t / 60) % 24).padStart(2, '0'), mm = String(Math.floor(state.t) % 60).padStart(2, '0');
    var walking = ents.filter(function (e) { return e.q.moving; }).length;
    document.getElementById('stats').innerHTML = hh + ':' + mm + ' · walking ' + walking + ' · walks ' + host.walks +
      ' · mirror <span class="' + (mismatches ? 'bad' : 'ok') + '">' + (checked - mismatches) + '/' + checked + ' minutes match</span>' +
      (LT.ProductionHost.ready ? '' : ' · atlas loading');
  }

  var last = performance.now(), paused = qs.get('paused') === '1';
  function loop(now) {
    var dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (!paused) { state.t += dt * state.rate; while (host.minute < Math.floor(state.t)) advance(); }
    frame();
    requestAnimationFrame(loop);
  }

  cv.overview.addEventListener('click', function (ev) {
    var r = cv.overview.getBoundingClientRect(), s = r.width / P.W;
    var x = (ev.clientX - r.left) / s, y = (ev.clientY - r.top) / s, best = -1, bd = 28 * 28;
    entities().forEach(function (e) { var dx = e.fx - x, dy = e.fy - 10 - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = e.i; } });
    if (best >= 0) { state.focus = best; setMode('follow'); }
  });
  cv.overview.addEventListener('mousemove', function (ev) {
    var r = cv.overview.getBoundingClientRect(), s = r.width / P.W, x = (ev.clientX - r.left) / s, y = (ev.clientY - r.top) / s, best = -1, bd = 28 * 28;
    entities().forEach(function (e) { var dx = e.fx - x, dy = e.fy - 10 - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = e.i; } });
    state.hover = best;
  });
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

  reset(); setMode(state.mode);
  window.PROTO = { state: state, host: function () { return host; }, ready: function () { return LT.ProductionHost.ready && loaded === 6; } };
  requestAnimationFrame(loop);
})();
