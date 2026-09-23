/* page.js — Living Town prototype on the shared engine.
 *
 * The world — ground, objects, collision, routes, doors, light, water — is
 * the Ember Engine's (engine/ember-worldmap.js, ember-worldview.js) drawing
 * this game's kit (../town-kit/kit.json). This file is only Living Town:
 * the town's day, its people and how they are drawn, and the page.
 */
(function () {
  LT.ProductionHost.attach();
  LT.ActivityPoses.load();
  var C = window.TownCore, WM = EMBER.WorldMap, WV = EMBER.WorldView, VW = 256, VH = 192;
  var qs = new URLSearchParams(location.search);
  var state = {
    mode: qs.get('mode') || 'overview', focus: +(qs.get('focus') || 0), hover: -1,
    ppm: +(qs.get('ppm') || 320), rate: +(qs.get('rate') || 1),
    t: +(qs.get('start') || 8 * 60), debug: qs.get('debug') === '1'
  };
  var world, map, view, host, mirror, mismatches = 0, checked = 0, ready = false;
  /* ?cast=painted draws residents from the painted sheet (engine/ember-cast.js);
   * default is Twin Peaks' 24 px renderer over Living Town's resident sheet. */
  var painted = null;
  if (qs.get('cast') === 'painted') EMBER.Cast.load('../town-kit/cast/residents.json').then(function (c) { painted = c; });

  Promise.all([fetch(qs.get('map') || 'town.json', { cache: 'no-store' }).then(function (r) { return r.json(); }),
               WV.loadKit('../town-kit/')]).then(function (r) {
    map = r[0];
    world = WM.build(map, r[1]);
    view = WV.create(world, r[1]);
    reset(); setMode(state.mode); ready = true;
  });

  function reset() {
    host = C.createTown(world, map.residents, 42, state.ppm); mirror = C.createTown(world, map.residents, 42, state.ppm);
    mismatches = 0; checked = 0;
    while (host.minute < Math.floor(state.t)) advance();
  }
  function advance() {
    C.stepMinute(host); C.stepMinute(mirror); checked++;
    if (C.fingerprint(host) !== C.fingerprint(mirror)) mismatches++;
  }

  /* ---- where each person stands, as a picture (view only) ----------- */
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
      /* someone on a bench is drawn at the seat but sorted where they sit
       * from: in front of the bench, not behind its backrest */
      return { i: i, p: p, q: q, fx: fx, fy: fy, seated: seated, sortY: seated ? fy + 23 : fy };   // seated: in front of the bench, whichever end it is sat on from
    });
  }

  /* ---- people: Living Town's residents, drawn with Twin Peaks' character
   * renderer and relit by the engine to sit in the kit's light ------------ */
  var AMBIENT = { day: [112, 108, 92], dusk: [64, 66, 78], night: [26, 34, 58] };
  var TINT = { day: [1.0, 0.99, 0.95], dusk: [0.9, 0.86, 0.88], night: [0.52, 0.58, 0.8] };
  var spriteBuf = document.createElement('canvas'); spriteBuf.width = 48; spriteBuf.height = 48;
  var sb = spriteBuf.getContext('2d', { willReadFrequently: true }); sb.imageSmoothingEnabled = false;

  function litPlaces(ents) {
    var lit = {};
    ents.forEach(function (e) { if (!e.q.outdoors && world.places[e.p.at] && world.places[e.p.at].indoor) lit[e.p.at] = true; });
    return lit;
  }

  function actor(e, lit) {
    return { sortY: e.sortY, draw: function (g, camX, camY, l) {
      var sheet = e.p.look || LT.Appearance.ORDER[e.i % LT.Appearance.ORDER.length];
      var sx = e.fx - camX, sy = e.fy - camY;
      if (!e.seated) { g.fillStyle = 'rgba(18,22,26,0.34)'; g.fillRect(sx - 6, sy - 1, 12, 3); g.fillRect(sx - 4, sy - 2, 8, 5); }
      sb.clearRect(0, 0, 48, 48);
      var drew = false;
      if (painted) {
        var pid = painted.ids[e.i % painted.ids.length];
        painted.draw(sb, pid, { dir: e.q.dir || 'down', walking: e.q.moving, phase: (e.q.phase || 0) / 2, seated: e.seated },
                     24, e.seated ? 47 : 44);
        WV.relight(sb, 48, 48, l.dark, view.lightsNear(e.fx, e.fy, lit), view.mix(AMBIENT, l), view.mix(TINT, l));
        /* seated: the sheet's seat line sits 6 px above its feet; the seat
         * offset already put fy on the bench top */
        g.drawImage(spriteBuf, sx - 24, sy - 44 + (e.seated ? 3 : 0));
        return;
      }
      if (e.seated && LT.ActivityPoses.ready) drew = LT.ActivityPoses.draw(sb, sheet, 'seated', 'down', 16, 16, 0, { shadow: false }) !== false;
      if (!drew && LT.ProductionHost.ready) {
        GAME.Sprites.drawChar(sb, 16, 16, LT.ProductionHost.looks[sheet], e.q.dir || 'down',
          e.q.moving ? EMBER.Grid.walkPhase(e.q.phase % 1) : 0, 1, e.q.moving, false, performance.now() / 1000,
          { mapId: 'lt_street', wx: e.fx, wy: e.fy, npcId: e.p.id, characterLife: null });
      } else if (!drew) { sb.fillStyle = '#e2b458'; sb.fillRect(20, 10, 8, 20); }
      WV.relight(sb, 48, 48, l.dark, view.lightsNear(e.fx, e.fy, lit), view.mix(AMBIENT, l), view.mix(TINT, l));
      /* drawChar's (16,16) is the tile's top-left; feet sit at the tile bottom */
      g.drawImage(spriteBuf, sx - 8 - 16, sy + 3 - 16 - 16);
    } };
  }

  function drawWorld(g, camX, camY, ents) {
    var lit = litPlaces(ents), walks = [];
    host.people.forEach(function (p) { if (p.walk) walks.push(p.walk.route); });
    view.draw(g, camX, camY, state.t, {
      actors: ents.filter(function (e) { return e.q.outdoors; }).map(function (e) { return actor(e, lit); }),
      lit: lit, doorOpen: function (place) { return C.doorOpen(host, place, state.t); },
      debug: state.debug, routes: walks
    });
  }

  var cv = { overview: document.getElementById('overview'), follow: document.getElementById('follow') };
  var gOver, gFol;
  function sizeCanvases() {
    if (!world) return;
    var WW = world.W * world.T, HH = world.H * world.T;
    if (!gOver) { gOver = EMBER.Viewport.attachNative(cv.overview, WW, HH); gFol = EMBER.Viewport.attachNative(cv.follow, VW, VH); }
    var aw = window.innerWidth - 32, ah = window.innerHeight - 96;
    /* Fill the window. Whole device pixels per art pixel when that is big
     * enough; otherwise a fractional fit, still nearest-neighbour. */
    var dpr = window.devicePixelRatio || 1;
    function fit(w, h) { var s = Math.min(aw / w, ah / h), d = Math.floor(s * dpr) / dpr; return d >= s * 0.9 ? d : s; }
    var so = fit(WW, HH), sf = fit(VW, VH);
    cv.overview.style.width = WW * so + 'px'; cv.overview.style.height = HH * so + 'px';
    cv.follow.style.width = VW * sf + 'px'; cv.follow.style.height = VH * sf + 'px';
  }
  window.addEventListener('resize', sizeCanvases);

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
        else { var pl = world.places[e.p.at], f = pl.feet || WM.feet(world, pl.tile); label(gOver, e.p.name, f[0], f[1] - 34, '#f3d27a'); }
      });
    } else {
      var f = ents[state.focus];
      var cam = EMBER.Camera.centerOn(f.fx - 8, f.fy - 16, { anchorX: 8, anchorY: 8, worldW: world.W * world.T, worldH: world.H * world.T, viewW: VW, viewH: VH });
      drawWorld(gFol, Math.round(cam.x), Math.round(cam.y), ents);
      var cap = document.getElementById('caption');
      if (cap) cap.textContent = f.p.name + (f.q.outdoors ? (f.q.moving ? ' · walking' : ' · outside') : ' · inside');
    }
    var hh = String(Math.floor(state.t / 60) % 24).padStart(2, '0'), mm = String(Math.floor(state.t) % 60).padStart(2, '0');
    document.getElementById('stats').innerHTML = '<b>' + (qs.get('map') || 'town.json') + '</b> · ' + hh + ':' + mm + ' · walking ' + ents.filter(function (e) { return e.q.moving; }).length +
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
