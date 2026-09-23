/* kit-editor.js — Ember Engine: a map editor for any game's kit.
 *
 * Opens a kit (tile set + object sprites, see engine/ember-worldview.js) and
 * a map in the engine's format, and edits the map: paint ground materials,
 * place / move / delete kit objects, name places (a building's door) and
 * spots, override single cells walkable or blocked. The world is rebuilt by
 * the engine after every edit, so collision, routes and the check panel are
 * always the game's own. Export writes the map JSON; nothing is saved on
 * the server.
 *
 *   engine/tools/kit-editor.html?kit=<kit dir>&map=<map json>
 * Paths are relative to this page. Default: Living Town's village.
 */
(function () {
  var WM = EMBER.WorldMap, WV = EMBER.WorldView;
  var qs = new URLSearchParams(location.search);
  var KIT = qs.get('kit') || '../../living-town/proto/town-kit/';
  var MAP = qs.get('map') || '../../living-town/proto/town-map/town.json';
  var CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  var kit, map, world, view, T = 16, error = null;
  var tool = 'paint', material = null, objectKit = null, selected = null, hover = null, dragging = null, painting = null;
  var undo = [], redo = [], t = +(qs.get('t') || 1167), showDebug = true, dirtyView = false;
  var cv = document.getElementById('map'), g = cv.getContext('2d'), scale = 1;
  g.imageSmoothingEnabled = false;
  var alpha = {};   // kit id -> ImageData, for picking objects by their pixels

  Promise.all([fetch(MAP, { cache: 'no-store' }).then(function (r) { return r.json(); }), WV.loadKit(KIT)]).then(function (r) {
    map = r[0]; kit = r[1]; T = map.tile || kit.manifest.tile || 16;
    map.objects = map.objects || []; map.places = map.places || {}; map.spots = map.spots || {};
    map.walkable = map.walkable || []; map.blocked = map.blocked || []; map.legend = map.legend || {};
    document.getElementById('mapName').textContent = MAP.split('/').pop() + ' · kit ' + (kit.manifest.name || KIT);
    buildPalettes();
    material = Object.keys(kit.tileSet.materials)[0];
    setTool('paint');
    rebuild(true);
    requestAnimationFrame(loop);
  });

  /* ---- model ------------------------------------------------------------- */
  function snapshot() { undo.push(JSON.stringify(map)); if (undo.length > 200) undo.shift(); redo.length = 0; }
  function restore(json) { map = JSON.parse(json); selected = null; rebuild(true); }
  function charFor(mat) {
    for (var c in map.legend) if (map.legend[c] === mat) return c;
    for (var i = 0; i < CHARS.length; i++) if (!map.legend[CHARS[i]]) { map.legend[CHARS[i]] = mat; return CHARS[i]; }
    throw new Error('legend full');
  }
  function setCell(x, y, mat) {
    if (x < 0 || y < 0 || x >= map.w || y >= map.h) return false;
    var c = charFor(mat), row = map.ground[y];
    if (row.charAt(x) === c) return false;
    map.ground[y] = row.slice(0, x) + c + row.slice(x + 1);
    return true;
  }
  function uniqueId(base) {
    var ids = {}; map.objects.forEach(function (o) { ids[o.id] = 1; });
    for (var n = 1; ; n++) if (!ids[base + '-' + n]) return base + '-' + n;
  }
  function removeCell(list, x, y) { for (var i = list.length - 1; i >= 0; i--) if (list[i][0] === x && list[i][1] === y) list.splice(i, 1); }

  /* The engine rebuilds the world and its view from the map after every
   * edit, so what is drawn is exactly what the game will build. */
  function rebuild() {
    try {
      world = WM.build(map, kit); error = null;
      var sized = view && cv.width === map.w * T && cv.height === map.h * T;
      view = WV.create(world, kit);
      if (!sized) fit();
    } catch (e) { error = e.message; }
    check();
  }

  /* ---- palettes ---------------------------------------------------------- */
  function buildPalettes() {
    var mats = document.getElementById('materials');
    var atlas = kit.images.ground[kit.grades[0]], cols = Math.floor(atlas.width / T);
    Object.keys(kit.tileSet.materials).forEach(function (m) {
      var M = kit.tileSet.materials[m], cell = (M.frames ? M.frames[0][0] : M.table[0]);
      var d = document.createElement('div'); d.className = 'swatch'; d.dataset.mat = m;
      var c = document.createElement('canvas'); c.width = T; c.height = T; c.style.width = '40px'; c.style.height = '40px';
      c.getContext('2d').drawImage(atlas, (cell % cols) * T, Math.floor(cell / cols) * T, T, T, 0, 0, T, T);
      d.appendChild(c); d.appendChild(document.createTextNode(m + (M.walkable === false ? ' ⛔' : '')));
      d.onclick = function () { material = m; setTool('paint'); };
      mats.appendChild(d);
    });
    var objs = document.getElementById('objects');
    kit.objects.forEach(function (k) {
      if (k.kind === 'backdrop' || !kit.images[k.id]) return;
      var im = kit.images[k.id][kit.grades[0]];
      var d = document.createElement('div'); d.className = 'swatch'; d.dataset.obj = k.id; d.title = k.id + ' (' + k.kind + ')';
      var s = Math.min(48 / k.w, 40 / k.h, 2), c = document.createElement('canvas');
      c.width = k.w; c.height = k.h; c.style.width = Math.round(k.w * s) + 'px'; c.style.height = Math.round(k.h * s) + 'px';
      c.getContext('2d').drawImage(im, 0, 0);
      d.appendChild(c); d.appendChild(document.createTextNode(k.id));
      d.onclick = function () { objectKit = k; setTool('place'); };
      objs.appendChild(d);
      var a = document.createElement('canvas'); a.width = k.w; a.height = k.h;
      var ac = a.getContext('2d'); ac.drawImage(im, 0, 0); alpha[k.id] = ac.getImageData(0, 0, k.w, k.h);
    });
    document.getElementById('objFilter').oninput = function (e) {
      var q = e.target.value.toLowerCase();
      [].forEach.call(objs.children, function (d) { d.style.display = !q || d.title.toLowerCase().indexOf(q) >= 0 ? '' : 'none'; });
    };
  }

  var HINTS = {
    paint: 'Drag to paint the selected ground material.',
    place: 'Click to place the selected object; its anchor snaps to the tile under the cursor.',
    move: 'Drag an object to move it; arrows nudge the selection by a tile.',
    erase: 'Click an object to delete it.',
    'place-name': 'Click a building with a door, then name the place (e.g. flat_a, cafe).',
    spot: 'Click a walkable tile, then name the spot people can go to.',
    walk: 'Click cells to force them walkable (e.g. a bridge deck over water).',
    block: 'Click cells to force them blocked.',
    clear: 'Click cells to remove walkable/blocked overrides.'
  };
  function setTool(tl) {
    tool = tl;
    [].forEach.call(document.querySelectorAll('#tools button'), function (b) { b.classList.toggle('on', b.dataset.tool === tl); });
    [].forEach.call(document.querySelectorAll('#materials .swatch'), function (d) { d.classList.toggle('on', tl === 'paint' && d.dataset.mat === material); });
    [].forEach.call(document.querySelectorAll('#objects .swatch'), function (d) { d.classList.toggle('on', tl === 'place' && objectKit && d.dataset.obj === objectKit.id); });
    document.getElementById('hint').textContent = HINTS[tl] || '';
  }
  [].forEach.call(document.querySelectorAll('#tools button'), function (b, i) {
    b.onclick = function () { setTool(b.dataset.tool); };
  });

  /* ---- picking ----------------------------------------------------------- */
  function mouse(ev) {
    var r = cv.getBoundingClientRect(), s = r.width / cv.width;
    var x = (ev.clientX - r.left) / s, y = (ev.clientY - r.top) / s;
    return { x: x, y: y, tx: Math.floor(x / T), ty: Math.floor(y / T) };
  }
  function objectAt(x, y) {
    if (!world) return null;
    var hit = null;
    world.objects.slice().sort(function (a, b) { return a.depth - b.depth; }).forEach(function (o) {
      var lx = Math.floor(x - o.px), ly = Math.floor(y - o.py), a = alpha[o.kit.id];
      if (!a || lx < 0 || ly < 0 || lx >= a.width || ly >= a.height) return;
      if (a.data[(ly * a.width + lx) * 4 + 3] > 0) hit = o;
    });
    return hit ? map.objects[hit.i] : null;
  }

  /* ---- input ------------------------------------------------------------- */
  cv.addEventListener('mousedown', function (ev) {
    var m = mouse(ev);
    if (tool === 'paint') { snapshot(); painting = true; paintAt(m); return; }
    if (tool === 'place' && objectKit) {
      snapshot();
      var o = { kit: objectKit.id, id: uniqueId(objectKit.id), tx: m.tx, ty: m.ty };
      map.objects.push(o); selected = o; rebuildSoon(); return;
    }
    if (tool === 'move') {
      var hit = objectAt(m.x, m.y); selected = hit;
      if (hit) { snapshot(); dragging = { o: hit, dx: m.tx - hit.tx, dy: m.ty - hit.ty }; }
      showSelection(); return;
    }
    if (tool === 'erase') {
      var del = objectAt(m.x, m.y);
      if (del) { snapshot(); map.objects.splice(map.objects.indexOf(del), 1); dropPlacesOf(del.id); selected = null; rebuildSoon(); }
      return;
    }
    if (tool === 'place-name') {
      var b = objectAt(m.x, m.y), k = b && kit.objects.filter(function (q) { return q.id === b.kit; })[0];
      selected = b && k && k.door ? b : null; showSelection(); return;
    }
    if (tool === 'spot') { selected = { spotTile: [m.tx, m.ty] }; showSelection(); return; }
    if (tool === 'walk' || tool === 'block' || tool === 'clear') {
      snapshot();
      removeCell(map.walkable, m.tx, m.ty); removeCell(map.blocked, m.tx, m.ty);
      if (tool === 'walk') map.walkable.push([m.tx, m.ty]);
      if (tool === 'block') map.blocked.push([m.tx, m.ty]);
      rebuildSoon();
    }
  });
  cv.addEventListener('mousemove', function (ev) {
    hover = mouse(ev);
    if (painting) paintAt(hover);
    if (dragging) {
      var nx = hover.tx - dragging.dx, ny = hover.ty - dragging.dy;
      if (nx !== dragging.o.tx || ny !== dragging.o.ty) { dragging.o.tx = nx; dragging.o.ty = ny; rebuildSoon(); }
    }
  });
  window.addEventListener('mouseup', function () {
    if (painting) { painting = false; rebuild(true); }
    dragging = null;
  });
  cv.addEventListener('mouseleave', function () { hover = null; });
  function paintAt(m) {
    var n = +document.getElementById('brush').value, r = Math.floor(n / 2), changed = false;
    for (var dy = -r; dy < n - r; dy++) for (var dx = -r; dx < n - r; dx++) changed = setCell(m.tx + dx, m.ty + dy, material) || changed;
    if (changed) { try { world = WM.build(map, kit); } catch (e) { error = e.message; } dirtyView = true; }
  }
  var soon = null;
  function rebuildSoon() { clearTimeout(soon); soon = setTimeout(function () { rebuild(true); showSelection(); }, 30); }
  function dropPlacesOf(id) { Object.keys(map.places).forEach(function (k) { if (map.places[k] === id) delete map.places[k]; }); }

  window.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT') return;
    var mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) { if (redo.length) { undo.push(JSON.stringify(map)); restore(redo.pop()); } }
      else if (undo.length) { redo.push(JSON.stringify(map)); restore(undo.pop()); }
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selected && selected.kit) {
      snapshot(); map.objects.splice(map.objects.indexOf(selected), 1); dropPlacesOf(selected.id); selected = null; rebuildSoon(); return;
    }
    var arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (arrows && selected && selected.kit) { e.preventDefault(); snapshot(); selected.tx += arrows[0]; selected.ty += arrows[1]; rebuildSoon(); return; }
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9) { var b = document.querySelectorAll('#tools button')[n - 1]; if (b) setTool(b.dataset.tool); }
  });
  document.getElementById('undo').onclick = function () { if (undo.length) { redo.push(JSON.stringify(map)); restore(undo.pop()); } };
  document.getElementById('redo').onclick = function () { if (redo.length) { undo.push(JSON.stringify(map)); restore(redo.pop()); } };
  document.getElementById('time').oninput = function (e) { t = +e.target.value; };
  document.getElementById('debug').onchange = function (e) { showDebug = e.target.checked; };
  document.getElementById('export').onclick = function () {
    var text = JSON.stringify(map, null, 1), a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = MAP.split('/').pop(); a.click();
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(function () {});
  };
  document.getElementById('resize').onclick = function () {
    var w = +document.getElementById('mw').value, h = +document.getElementById('mh').value;
    if (!(w >= 8 && h >= 8)) return;
    snapshot();
    var fill = charFor(Object.keys(kit.tileSet.materials).filter(function (m) { return kit.tileSet.materials[m].walkable !== false; })[0]);
    map.ground = map.ground.slice(0, h).map(function (r) { return (r + new Array(w + 1).join(fill)).slice(0, w); });
    while (map.ground.length < h) map.ground.push(new Array(w + 1).join(fill));
    map.w = w; map.h = h; rebuild(true);
  };

  /* ---- panels ------------------------------------------------------------ */
  function check() {
    var el = document.getElementById('check'), out = [];
    document.getElementById('mw').value = map.w; document.getElementById('mh').value = map.h;
    if (error) { el.innerHTML = '<div class="bad">' + error + '</div>'; return; }
    var names = Object.keys(world.places), bad = [];
    names.forEach(function (a) { names.forEach(function (b) { if (a !== b && !WM.route(world, a, b)) bad.push(a + ' → ' + b); }); });
    /* a route may end on a blocked cell (a door inside its building), so a
     * spot standing on one looks reachable: that is a map error of its own */
    Object.keys(world.spots).forEach(function (k) { var s = world.spots[k].tile; if (!WM.walkable(world, s[0], s[1])) bad.unshift('spot ' + k + ' stands on a blocked cell'); });
    var blocked = 0; for (var i = 0; i < world.blocked.length; i++) blocked += world.blocked[i];
    out.push(['objects', map.objects.length], ['places', names.length], ['blocked cells', blocked]);
    out.push(['unreachable', bad.length ? '<span class="bad">' + bad.length + '</span>' : '<span class="ok">none</span>']);
    el.innerHTML = out.map(function (r) { return '<div><span>' + r[0] + '</span><span>' + r[1] + '</span></div>'; }).join('') +
      bad.slice(0, 8).map(function (b) { return '<div class="bad">' + b + '</div>'; }).join('');
    var pl = document.getElementById('places');
    pl.innerHTML = Object.keys(map.places).map(function (k) { return '<div><span>' + k + '</span><span>' + map.places[k] + '</span></div>'; }).join('') +
      Object.keys(map.spots).map(function (k) { var s = map.spots[k]; return '<div><span>' + k + '</span><span>spot ' + s.tx + ',' + s.ty + ' <a href="#" data-del="' + k + '">×</a></span></div>'; }).join('');
    [].forEach.call(pl.querySelectorAll('a[data-del]'), function (a) {
      a.onclick = function (e) { e.preventDefault(); snapshot(); delete map.spots[a.dataset.del]; rebuild(false); };
    });
  }

  function showSelection() {
    var el = document.getElementById('sel');
    if (!selected) { el.innerHTML = '<div style="color:var(--dim)">nothing selected</div>'; return; }
    if (selected.spotTile) {
      el.innerHTML = '<div>tile ' + selected.spotTile.join(',') + '</div><div class="row"><input id="spotName" placeholder="spot name" style="width:130px"><label><input type="checkbox" id="spotSeat"> seats</label><button id="spotSet">Set</button></div>';
      document.getElementById('spotSet').onclick = function () {
        var n = document.getElementById('spotName').value.trim(); if (!n) return;
        snapshot();
        map.spots[n] = { tx: selected.spotTile[0], ty: selected.spotTile[1] };
        if (document.getElementById('spotSeat').checked) map.spots[n].seats = [[-8, -23], [9, -23]];
        rebuild(false);
      };
      return;
    }
    var o = selected, names = Object.keys(map.places).filter(function (k) { return map.places[k] === o.id; });
    el.innerHTML = '<div><span>' + o.id + '</span><span>' + o.kit + '</span></div><div><span>tile</span><span>' + o.tx + ', ' + o.ty + '</span></div>' +
      '<div><span>places</span><span>' + (names.join(', ') || '—') + '</span></div>' +
      (tool === 'place-name' ? '<div class="row"><input id="placeName" placeholder="place name" style="width:130px"><button id="placeSet">Set</button></div>' : '');
    var ps = document.getElementById('placeSet');
    if (ps) ps.onclick = function () {
      var n = document.getElementById('placeName').value.trim(); if (!n) return;
      snapshot(); map.places[n] = o.id; rebuild(false); showSelection();
    };
  }

  /* ---- drawing ----------------------------------------------------------- */
  function fit() {
    var WW = map.w * T, HH = map.h * T;
    cv.width = WW; cv.height = HH; g.imageSmoothingEnabled = false;
    var main = cv.parentElement, s = Math.min((main.clientWidth - 24) / WW, (main.clientHeight - 24) / HH);
    scale = s >= 1 ? Math.max(1, Math.floor(s * 2) / 2) : s;
    cv.style.width = WW * scale + 'px'; cv.style.height = HH * scale + 'px';
  }
  window.addEventListener('resize', fit);

  function loop() {
    if (view) {
      if (dirtyView && !painting) { dirtyView = false; rebuild(true); }
      var lit = {}; Object.keys(map.places).forEach(function (k) { lit[k] = true; });
      try { view.draw(g, 0, 0, t, { lit: lit, debug: showDebug && !error }); } catch (e) { error = e.message; }
      if (painting || dirtyView) drawPaintPreview();
      drawOverlay();
      var hh = String(Math.floor(t / 60)).padStart(2, '0'), mm = String(t % 60).padStart(2, '0');
      document.getElementById('clock').textContent = hh + ':' + mm;
    }
    requestAnimationFrame(loop);
  }
  /* While a stroke is in progress the ground layers are stale: show the
   * painted cells as their material's swatch until the stroke ends. */
  function drawPaintPreview() {
    var atlas = kit.images.ground[kit.grades[0]], cols = Math.floor(atlas.width / T);
    for (var y = 0; y < map.h; y++) for (var x = 0; x < map.w; x++) {
      var m = WM.materialAt(map, x, y), M = kit.tileSet.materials[m];
      if (!M || !view) continue;
      var c = M.frames ? M.frames[0][0] : M.table[0];
      if (m === material) { g.globalAlpha = 0.6; g.drawImage(atlas, (c % cols) * T, Math.floor(c / cols) * T, T, T, x * T, y * T, T, T); g.globalAlpha = 1; }
    }
  }
  function drawOverlay() {
    Object.keys(map.places).forEach(function (k) {
      var pl = world && world.places[k]; if (!pl || !pl.feet) return;
      label(k, pl.feet[0], pl.feet[1] - 30, '#e9b458');
    });
    Object.keys(map.spots).forEach(function (k) { var s = map.spots[k]; label(k, s.tx * T + 8, s.ty * T - 2, '#f0e68c'); });
    if (selected && selected.kit && world) {
      var o = world.objects.filter(function (q) { return map.objects[q.i] === selected; })[0];
      if (o) { g.strokeStyle = '#e9b458'; g.lineWidth = 1; g.strokeRect(o.px + .5, o.py + .5, o.kit.w - 1, o.kit.h - 1); }
    }
    if (!hover) return;
    if (tool === 'place' && objectKit && kit.images[objectKit.id]) {
      g.globalAlpha = 0.65; g.drawImage(kit.images[objectKit.id][kit.grades[0]], hover.tx * T - objectKit.anchor[0], hover.ty * T - objectKit.anchor[1]); g.globalAlpha = 1;
      g.strokeStyle = '#e9b458';
      (objectKit.footprint || []).forEach(function (f) { g.strokeRect((hover.tx + f[0]) * T + .5, (hover.ty + f[1]) * T + .5, T - 1, T - 1); });
    } else if (tool === 'paint') {
      var n = +document.getElementById('brush').value, r = Math.floor(n / 2);
      g.strokeStyle = '#e9b458'; g.strokeRect((hover.tx - r) * T + .5, (hover.ty - r) * T + .5, n * T - 1, n * T - 1);
    } else if (tool === 'move' || tool === 'erase' || tool === 'place-name') {
      var h = objectAt(hover.x, hover.y);
      var o2 = h && world.objects.filter(function (q) { return map.objects[q.i] === h; })[0];
      if (o2) { g.strokeStyle = tool === 'erase' ? '#e07a5f' : '#8fc27a'; g.strokeRect(o2.px + .5, o2.py + .5, o2.kit.w - 1, o2.kit.h - 1); }
    } else {
      g.strokeStyle = '#e9b458'; g.strokeRect(hover.tx * T + .5, hover.ty * T + .5, T - 1, T - 1);
    }
  }
  function label(text, x, y, colour) {
    g.font = '8px monospace'; var w = Math.ceil(g.measureText(text).width) + 4;
    g.fillStyle = 'rgba(16,20,22,.8)'; g.fillRect(Math.round(x - w / 2), y - 8, w, 10);
    g.fillStyle = colour; g.fillText(text, Math.round(x - w / 2) + 2, y);
  }

  window.KIT_EDITOR = { map: function () { return map; }, world: function () { return world; }, setTool: setTool,
                        select: function (id) { selected = map.objects.filter(function (o) { return o.id === id; })[0] || null; showSelection(); } };
})();
