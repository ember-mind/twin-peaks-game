/* world-builder.js — WORLD BUILDER v0.1 (M1–M3 browser glue; NO game-logic change).
 *
 * A dev-only overlay page that renders the REAL world catalog + scene maps read-only:
 *    M1  location/scene selector built from GAME.World.catalog (all 7 locations) + status.
 *    M2  canvas renders the selected scene's tile grid with semantic overlays (exits,
 *        interactive objects, NPC positions, connection spawn points) + a legend.
 *    M3  clicking the grid selects an overlay; the inspector shows its read-only fields.
 *
 * This is intentionally thin: it reads the pure view-model from js/world-builder-data.js and
 * geometry from js/world-builder-coords.js. It performs NO save / persistence and offers NO
 * tile editing — every drawn mark comes straight from GAME.Maps, so what you see is what runs.
 * Inert by construction: it only mounts once the DOM + canvas exist; outside a page it does
 * nothing, so the production game and node suites are unaffected.
 */
(function () {
  'use strict';

  var WB = null, CO = null;
  if (typeof window !== 'undefined') {
    WB = window.GAME && window.GAME.WorldBuilderData;
    CO = window.GAME && window.GAME.WorldBuilderCoords;
  }

   // Guard: with no view-model / coords layers we cannot render anything true, so bail out
   // rather than draw a fake world. This keeps the page inert when loaded in isolation.
  if (!WB || !CO) {
     if (typeof console !== 'undefined') console.warn('[world-builder] data layer missing — not mounting.');
    return;
   }

  // Pure scene -> draw-spec list: the geometry of every overlay marker, in paint order, with NO
  // DOM/ctx. Kept separate from the pixel renderer so a Node test can assert "N markers of each
  // kind for this scene" against the real source without a browser or canvas (M2 correctness).
    function planScene(scene) {
      if (!scene) return { width: 0, height: 0, markers: [] };
       var order = { object: 0, npc: 1, exit: 2 }; // paint objects first so npcs/exits sit on top.
      var markers = scene.overlays.slice().sort(function (a, b) { return (order[a.kind] || 0) - (order[b.kind] || 0); });
      return { width: scene.width, height: scene.height, indoor: !!scene.indoor, markers: markers };
     }

  function mount() {
    var snapshot = WB.buildWorldSnapshot(WB.collectWorldSource(window.GAME));
    var root = document.getElementById('wb-root');
     if (!root) { // attach a floating panel instead of overwriting the page body.
      root = document.createElement('div');
      root.id = 'wb-root';
      document.body.appendChild(root);
      }

   var selected = null;            // currently inspected overlay
  var selectedSceneKey = null;     // "locationId/sceneId"

    // ---- M1: location/scene selector built from the real catalog ----
   var sel = document.createElement('select');
   sel.className = 'wb-sel';
   snapshot.locations.forEach(function (loc) {
     loc.environments.forEach(function (env) {
      var opt = document.createElement('option');
       // "Double R / interior — diner (14x10)" reads as both a location and a scene.
       var sc = snapshot.scenes[env.sceneId];
       opt.value = loc.id + '/' + env.sceneId;
        var dims = sc ? (sc.width + 'x' + sc.height) : '?';
      opt.textContent = loc.name + ' / ' + env.name + ' — ' + env.sceneId + ' (' + dims + ')';
       sel.appendChild(opt);
       });
     if (loc.environments.length === 0) { // e.g. a location whose scenes did not load
      var empty = document.createElement('option');
      empty.textContent = loc.name + ' / (no environments loaded)';
      empty.value = loc.id + '/';
      sel.appendChild(empty);
      }
     });

   root.innerHTML = '';
  root.style.cssText =
    'position:fixed;top:8px;right:8px;width:360px;max-height:92vh;overflow:auto;' +
    'background:#0b0f14;color:#cdd7e5;font:12px/1.4 ui-monospace,Menlo,Consolas,monospace;' +
    'border:1px solid #2a3646;border-radius:8px;padding:10px;z-index:9998;' +
    'box-shadow:0 6px 24px rgba(0,0,0,.5);';
   root.textContent = '';

    function h(tag, text) { var e = document.createElement(tag); if (text != null) e.textContent = text; return e; }
   root.appendChild(h('div', 'WORLD BUILDER · read-only'));
   root.appendChild(sel);

    var status = h('div'); status.className = 'wb-status';
  root.appendChild(status);

     var legend = document.createElement('div');
  root.appendChild(legend);

     var canvas = document.createElement('canvas');
  canvas.className = 'wb-canvas';
  root.appendChild(canvas);

    var insp = h('div', null); insp.className = 'wb-insp';
  root.appendChild(insp);

     // ---- M2: render the scene grid + overlays onto the canvas at an integer zoom ----
   function renderScene(key) {
    selectedSceneKey = key;
    var parts = String(key).split('/');
    var sceneId = parts[1] || '';
    var sc = snapshot.scenes[sceneId];
     if (!sc) { status.textContent = 'scene not loaded: ' + sceneId; canvas.width = 1; canvas.height = 1; return; }

     var ctx = canvas.getContext('2d');
      // Choose a zoom that fits the (often wide) town map on screen but never distorts tiles.
    var zoom = Math.max(4, Math.floor((360 - 12) / sc.width));
    if (zoom < 4) zoom = 4;
     canvas.width = sc.width * zoom;
     canvas.height = sc.height * zoom;

      // grid
   ctx.fillStyle = sc.indoor ? '#10171f' : '#0a140e';
   ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
     for (var x = 0; x <= sc.width; x++) { ctx.beginPath(); ctx.moveTo(x * zoom + .5, 0); ctx.lineTo(x * zoom + .5, canvas.height); ctx.stroke(); }
    for (var y = 0; y <= sc.height; y++) { ctx.beginPath(); ctx.moveTo(0, y * zoom + .5); ctx.lineTo(canvas.width, y * zoom + .5); ctx.stroke(); }

     // overlays via the pure planScene() so paint order is identical to what the node test checks.
    planScene(sc).markers.forEach(function (o) {
      drawOverlay(ctx, o, zoom, selected === o);
       });

     // legend + status reflect what is actually on screen.
   var counts = countByKind(sc.overlays);
   status.textContent = sc.sceneId + '  ·  ' + sc.width + '×' + sc.height + (sc.indoor ? ' (interior)' : '') +
      '  ·  exits:' + counts.exit + '  objects:' + counts.object + '  npcs:' + counts.npc;
   legend.innerHTML = '<span style="color:#5ec8ff">■</span> exit → target   ' +
     '<span style="color:#e6b84a">●</span> object/region   ' +
     '<span style="color:#7ee07e">▲</span> npc';
   }

    function drawOverlay(ctx, o, zoom, isSel) {
     var px = o.tx * zoom, py = o.ty * zoom;
      if (o.kind === 'exit') {
       // arrow pointing toward the target spawn tile within this scene's grid where possible.
      ctx.fillStyle = '#5ec8ff';
      ctx.strokeStyle = isSel ? '#ffffff' : 'rgba(94,200,255,.5)';
        var cx = px + zoom / 2, cy = py + zoom / 2;
       if (isSel) { ctx.lineWidth = 2; ctx.strokeRect(px + .5, py + .5, zoom - 1, zoom - 1); }
      ctx.beginPath(); ctx.arc(cx, cy, Math.max(3, zoom * 0.32), 0, Math.PI * 2); ctx.fill();
        // direction tick
     var dir = o.dir || 'down';
      var dv = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir] || [0, 0];
      ctx.strokeStyle = '#5ec8ff'; ctx.lineWidth = 2;
       ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + dv[0] * zoom * .6, cy + dv[1] * zoom * .6); ctx.stroke();
        } else if (o.kind === 'object') {
       var w = (o.w || 1) * zoom, hh = (o.h || 1) * zoom;
      ctx.fillStyle = isSel ? 'rgba(230,184,74,.55)' : 'rgba(230,184,74,.25)';
        if (isSel) { ctx.strokeStyle = '#e6b84a'; ctx.lineWidth = 2; }
       ctx.fillRect(px + 1, py + 1, w - 2, hh - 2);
      if (isSel) ctx.strokeRect(px + .5, py + .5, w - 1, hh - 1);
        } else { // npc
       ctx.fillStyle = '#7ee07e';
        var nx = px + zoom / 2, ny = py + zoom / 2;
      ctx.beginPath(); ctx.moveTo(nx, ny - zoom * .35); ctx.lineTo(nx + zoom * .3, ny + zoom * .3);
        ctx.lineTo(nx - zoom * .3, ny + zoom * .3); ctx.closePath(); ctx.fill();
       if (isSel) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke(); }
        }
    }

     function countByKind(overlays) {
      var c = { exit: 0, object: 0, npc: 0 };
      overlays.forEach(function (o) { if (c[o.kind] != null) c[o.kind]++; });
       return c;
    }

    // ---- M3: click selects an overlay -> read-only inspector with the documented fields ----
   canvas.addEventListener('click', function (ev) {
     var rect = canvas.getBoundingClientRect();
     var px = ev.clientX - rect.left, py = ev.clientY - rect.top;
     var sc = snapshot.scenes[(String(selectedSceneKey).split('/')[1] || '')];
      if (!sc) return;
    selected = CO.hitTest(sc.overlays, px, py, currentZoom());
    renderScene(selectedSceneKey); // re-draw with selection highlight
   renderInspector(selected, snapshot);
   });

     function currentZoom() {
      var sc = snapshot.scenes[(String(selectedSceneKey).split('/')[1] || '')];
      if (!sc) return 4;
       return Math.max(4, Math.floor((360 - 12) / sc.width));
    }

   // Inspector mirrors the M3 example: TYPE/KIND · SOURCE · TARGET scene+spawn · tile · connection id.
  function renderInspector(o, snap) {
     insp.textContent = '';
      if (!o) { insp.appendChild(h('div', '— select a highlighted overlay —')); return; }
     function row(label, val) {
       var r = h('div');
      var l = h('span', label + ': '); l.style.color = '#7f93a8';
        var v = h('span', String(val == null ? '—' : val));
      r.appendChild(l); r.appendChild(v); insp.appendChild(r);
       }
    row('TYPE / KIND', o.kind + (o.subkind ? '/' + o.subkind : '') + (o.type ? (' (' + o.type + ')') : ''));
     if (o.id) row('NPC ID', o.id);
     if (o.name && o.kind === 'npc') row('NAME', o.name);
    row('SOURCE (tile)', 'x=' + o.tx + '  y=' + o.ty + ((o.w && o.w > 1) ? ('  w=' + o.w + ' h=' + (o.h || 1)) : ''));
     if (o.kind === 'exit') {
      row('TARGET scene', o.target.scene);
       row('TARGET SPAWN', 'x=' + o.target.x + '  y=' + o.target.y + (o.dir ? '  dir=' + o.dir : ''));
      // find the paired connection record so we can show its canonical id + both endpoints.
     var rec = snap.connections.filter(function (c) { return c.id === o.connectionId; })[0];
       if (rec) {
        row('CONNECTION ID', rec.id);
         row('A endpoint', rec.a ? (rec.a.scene + ' spawn@' + (rec.a.spawn && rec.a.spawn.tx) + ',' + (rec.a.spawn && rec.a.spawn.ty)) : '—');
        row('B endpoint', rec.b ? (rec.b.scene + ' spawn@' + (rec.b.spawn && rec.b.spawn.tx) + ',' + (rec.b.spawn && rec.b.spawn.ty)) : '—');
         } else if (o.connectionId) {
      row('CONNECTION ID', o.connectionId + ' (no paired record loaded)');
       }
     }
     if (o.dialogue != null) row('DIALOGUE', typeof o.dialogue === 'string' ? o.dialogue : JSON.stringify(o.dialogue));
    if (o.sprite) row('SPRITE', o.sprite);
   }

      // default: first location's first environment; select it and render.
  sel.onchange = function () { renderScene(sel.value); selected = null; renderInspector(null, snapshot); };
     sel.selectedIndex = 0;
  renderScene(sel.value);
   renderInspector(null, snapshot);

    // expose for debugging / manual verification (read-only handles only)
  if (typeof window !== 'undefined') window.WB = { snapshot: snapshot, select: function () {} };
  }

   // Mount when the DOM is ready; tolerate scripts loading before/after body.
  function boot() {
     if (document.getElementById('wb-root')) return; // idempotent
    mount();
   }
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
   }

  var api = { mount: mount, planScene: planScene };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
   if (typeof window !== 'undefined') { window.GAME = window.GAME || {}; window.GAME.WorldBuilder = api; }
})();
