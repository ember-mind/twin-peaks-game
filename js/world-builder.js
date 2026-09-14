/* world-builder.js — WORLD BUILDER M4b browser glue (dev page only; index.html never loads it).
 *
 * Renders ONE frozen model — GAME.WorldBuilderData.adaptWorld(GAME) — and edits connection endpoints as
 * DRAFTS. Nothing here writes to disk or to the runtime registry: the only way out is EXPORT CHANGESET
 * (a JSON textarea), which tools/world-apply.js turns into a world/connections.json change.
 *
 *   selection   stable ids from js/editor/core/identity.js, hit-tested topmost-wins over the same
 *               paint-ordered list the canvas draws (GameWorldBuilderCore.sceneItems)
 *   VIEW/EDIT   EDIT unlocks spawn x/y/facing, MOVE SPAWN, trigger MOVE/ADD/REMOVE, revert, export
 *   drafts      Editor.edit store (id -> whole record), every edit committed to Editor.history (Ctrl+Z)
 *   validation  GAME.LocationConnections messages verbatim + registry/endpoint/scene/paired checks
 *   story       read-only NPC overlay from GAME.CastPresence.resolveCast(seed state)
 *   legacy      map doors with no connection id: read-only `legacy-door` items
 */
(function () {
  'use strict';

  var WB = null, Core = null, Ed = null;
  if (typeof window !== 'undefined') {
    WB = window.GAME && window.GAME.WorldBuilderData;
    Core = window.GameWorldBuilderCore;
    Ed = window.Editor;
  }

  // Pure scene -> draw-spec list over the snapshot overlays (kept for the node data-layer suite).
  function planScene(scene) {
    if (!scene) return { width: 0, height: 0, markers: [] };
    var order = { object: 0, npc: 1, exit: 2 };
    var markers = scene.overlays.slice().sort(function (a, b) { return (order[a.kind] || 0) - (order[b.kind] || 0); });
    return { width: scene.width, height: scene.height, indoor: !!scene.indoor, markers: markers };
  }

  // Connection spawns landing on a scene (pure; node-tested).
  function planSpawns(snap, sceneId) {
    var out = [];
    (snap.connections || []).forEach(function (c) {
      ['a', 'b'].forEach(function (which) {
        var e = c[which];
        if (!e || e.scene !== sceneId || !e.spawn) return;
        out.push({ which: which, id: c.id, tx: e.spawn.tx, ty: e.spawn.ty, dir: e.spawn.dir });
      });
    });
    return out.sort(function (x, y) { return x.which < y.which ? -1 : 1; });
  }

  var PIECES_OK = !!(WB && Core && Ed && Ed.edit && Ed.history && Ed.identity && Ed.hitTest && Ed.model);

  var DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  function mount() {
    var G = window.GAME;
    var world = WB.adaptWorld(G);
    if (!world.model) throw new Error('[world-builder] editor core model missing — load js/editor/core/*.js first');
    var model = world.model;
    var E = Ed.edit, H = Ed.history, ID = Ed.identity;
    var store = E.createStore(world.source.connections);
    var vctx = WB.validationContext(G);

    var ui = {
      sceneId: null,
      mode: 'view',             // 'view' | 'edit'
      selectedId: null,
      pending: null,            // null | {action:'move-spawn'|'move-trigger'|'add-trigger', connId, side, index?}
      hover: null,
      notice: null,
      exportOpen: false,
      momentKey: 'baseline',
      moments: {},              // seed key -> seed (from test/fixtures/cast-pins-acts-1-4.json)
      momentCast: null,         // castForSeed result for the chosen seed
      zoom: 16
    };
    var hist = H.create(store.base);
    function draft() { return hist.present; }

    // ------------------------------------------------------------------ DOM
    function el(tag, attrs, text) {
      var e = document.createElement(tag);
      Object.keys(attrs || {}).forEach(function (k) {
        if (k === 'class') e.className = attrs[k]; else e.setAttribute(k, attrs[k]);
      });
      if (text != null) e.textContent = text;
      return e;
    }
    var root = document.getElementById('wb-root') || document.body.appendChild(el('div', { id: 'wb-root' }));
    root.textContent = '';
    var header = root.appendChild(el('header', { id: 'wb-header' }));
    var title = header.appendChild(el('span', { id: 'wb-title' }));
    var modeBadge = header.appendChild(el('span', { id: 'wb-mode-badge' }));

    var bar = root.appendChild(el('div', { id: 'wb-toolbar' }));
    function labelled(text, control) {
      var w = el('label', { class: 'wb-field' });
      w.appendChild(el('span', null, text));
      w.appendChild(control);
      return w;
    }
    var sceneSel = el('select', { id: 'wb-scene' });
    bar.appendChild(labelled('SCENE', sceneSel));
    var momentSel = el('select', { id: 'wb-moment' });
    bar.appendChild(labelled('STORY MOMENT', momentSel));
    var modeGroup = bar.appendChild(el('div', { class: 'wb-seg', id: 'wb-mode' }));
    var viewBtn = modeGroup.appendChild(el('button', { 'data-action': 'mode-view' }, 'VIEW'));
    var editBtn = modeGroup.appendChild(el('button', { 'data-action': 'mode-edit' }, 'EDIT'));
    var undoBtn = bar.appendChild(el('button', { 'data-action': 'undo', title: 'Ctrl+Z' }, 'UNDO'));
    var revertAllBtn = bar.appendChild(el('button', { 'data-action': 'revert-all' }, 'REVERT ALL'));
    var exportBtn = bar.appendChild(el('button', { 'data-action': 'export', class: 'wb-primary' }, 'EXPORT CHANGESET'));

    var main = root.appendChild(el('main', { id: 'wb-main' }));
    var stage = main.appendChild(el('section', { id: 'wb-stage' }));
    var stageInfo = stage.appendChild(el('div', { id: 'wb-stage-info' }));
    var canvas = stage.appendChild(el('canvas', { id: 'wb-canvas' }));
    var legend = stage.appendChild(el('div', { id: 'wb-legend' }));
    var side = main.appendChild(el('aside', { id: 'wb-side' }));
    var noticeBox = side.appendChild(el('div', { id: 'wb-notice' }));
    var insp = side.appendChild(el('div', { id: 'wb-inspector' }));
    var valBox = side.appendChild(el('div', { id: 'wb-validation' }));
    var exportBox = side.appendChild(el('div', { id: 'wb-export' }));

    legend.innerHTML =
      '<span class="lg lg-ep">◆</span> endpoint spawn&nbsp;&nbsp; <span class="lg lg-tr">■</span> trigger&nbsp;&nbsp; ' +
      '<span class="lg lg-ghost">◇</span> original (dimmed)&nbsp;&nbsp; <span class="lg lg-bad">◆</span> invalid draft&nbsp;&nbsp; ' +
      '<span class="lg lg-npc">▲</span> npc&nbsp;&nbsp; <span class="lg lg-obj">▭</span> object&nbsp;&nbsp; <span class="lg lg-leg">□</span> legacy door (read-only)';

    // ------------------------------------------------------------------ scene + moment selectors
    var catalogScenes = {};
    world.snapshot.locations.forEach(function (loc) {
      var grp = el('optgroup', { label: loc.name });
      loc.environments.forEach(function (env) {
        var sc = model.scenes[env.sceneId];
        catalogScenes[env.sceneId] = true;
        grp.appendChild(el('option', { value: env.sceneId }, env.sceneId + (sc ? ' (' + sc.width + '×' + sc.height + ')' : ' (not loaded)')));
      });
      sceneSel.appendChild(grp);
    });
    var others = Object.keys(model.scenes).filter(function (s) { return !catalogScenes[s]; }).sort();
    if (others.length) {
      var og = el('optgroup', { label: 'Other maps (not in catalog)' });
      others.forEach(function (s) { og.appendChild(el('option', { value: s }, s + ' (' + model.scenes[s].width + '×' + model.scenes[s].height + ')')); });
      sceneSel.appendChild(og);
    }
    momentSel.appendChild(el('option', { value: 'baseline' }, 'baseline (default)'));
    momentSel.disabled = true;

    function loadMoments() {
      if (typeof fetch !== 'function') return;
      fetch('test/fixtures/cast-pins-acts-1-4.json').then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (json) {
        Object.keys(json.seeds || {}).forEach(function (k) {
          ui.moments[k] = json.seeds[k];
          momentSel.appendChild(el('option', { value: k }, k));
        });
        momentSel.disabled = false;
        render();
      }).catch(function (e) {
        momentSel.title = 'story moments unavailable (' + e.message + ') — serve the repo over http';
      });
    }

    // ------------------------------------------------------------------ derived state
    function sceneNpcs(sceneId) {
      if (ui.momentKey === 'baseline' || !ui.momentCast) return null; // model baseline overlay
      return ui.momentCast[sceneId] || [];
    }
    function items(sceneId) {
      return Core.sceneItems(model, sceneId || ui.sceneId, { connections: draft(), npcs: sceneNpcs(sceneId || ui.sceneId) });
    }
    function errorsFor(connId) {
      var d = draft();
      if (!d[connId]) return ['connection id "' + connId + '" does not exist in the draft'];
      return E.validateDraft(d[connId], vctx, { changedSides: E.changedEndpoints(store, d, connId) });
    }
    function allErrors() {
      var out = {};
      E.changedIds(store, draft()).forEach(function (id) {
        var errs = errorsFor(id);
        if (errs.length) out[id] = errs;
      });
      return out;
    }
    function selectedRef() {
      var p = ui.selectedId ? ID.parse(ui.selectedId) : null;
      if (!p) return null;
      if (p.kind === ID.KINDS.ENDPOINT) return { kind: p.kind, connId: p.connId, side: p.side };
      if (p.kind === ID.KINDS.TRIGGER) return { kind: p.kind, connId: p.connId, side: p.side, index: p.n };
      return { kind: p.kind };
    }

    function commit(next, label) {
      if (next === draft()) return;
      hist = H.commit(hist, next, { label: label });
    }
    function guard(fn) {
      try { ui.notice = null; fn(); }
      catch (e) { ui.notice = { level: 'error', text: String(e.message || e) }; }
      render();
    }

    // ------------------------------------------------------------------ canvas
    function fitZoom(sc) {
      var availW = Math.max(200, stage.clientWidth - 24);
      var availH = Math.max(200, window.innerHeight - 170);
      return Math.max(8, Math.min(56, Math.floor(Math.min(availW / sc.width, availH / sc.height))));
    }
    function clampTile(sc, tx, ty) {
      return { tx: Math.max(0, Math.min(sc.width - 1, tx)), ty: Math.max(0, Math.min(sc.height - 1, ty)),
               out: tx < 0 || ty < 0 || tx >= sc.width || ty >= sc.height };
    }

    function drawCanvas(sc, list, errs) {
      var z = ui.zoom = fitZoom(sc);
      canvas.width = sc.width * z;
      canvas.height = sc.height * z;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = sc.indoor ? '#10171f' : '#0a140e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      var base = WB.planBaseMap(world.snapshot.scenes[sc.sceneId]);
      base.rows.forEach(function (row, y) {
        row.forEach(function (cell, x) { ctx.fillStyle = cell.color; ctx.fillRect(x * z, y * z, z, z); });
      });
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      for (var gx = 0; gx <= sc.width; gx++) { ctx.beginPath(); ctx.moveTo(gx * z + .5, 0); ctx.lineTo(gx * z + .5, canvas.height); ctx.stroke(); }
      for (var gy = 0; gy <= sc.height; gy++) { ctx.beginPath(); ctx.moveTo(0, gy * z + .5); ctx.lineTo(canvas.width, gy * z + .5); ctx.stroke(); }

      // originals of changed connections, dimmed, UNDER the draft markers
      E.changedIds(store, draft()).forEach(function (id) {
        var rec = store.base[id];
        if (!rec) return;
        ['a', 'b'].forEach(function (s) {
          var ep = rec[s];
          if (!ep || ep.scene !== sc.sceneId) return;
          (ep.triggers || []).forEach(function (t) { drawTrigger(ctx, sc, t[0], t[1], z, { ghost: true }); });
          if (ep.spawn) drawSpawn(ctx, sc, ep.spawn.tx, ep.spawn.ty, ep.spawn.dir, s, z, { ghost: true });
        });
      });

      list.forEach(function (it) {
        var isSel = it.id === ui.selectedId;
        var bad = !!(it.connectionId && errs[it.connectionId]);
        if (it.kind === 'legacy-door') drawLegacy(ctx, it, z, isSel);
        else if (it.kind === 'object') drawObject(ctx, it, z, isSel);
        else if (it.kind === 'npc') drawNpc(ctx, it, z, isSel);
        else if (it.kind === 'trigger') drawTrigger(ctx, sc, it.tx, it.ty, z, { sel: isSel, bad: bad, label: it.side + it.index });
        else if (it.kind === 'connection-endpoint') drawSpawn(ctx, sc, it.tx, it.ty, it.dir, it.side, z, { sel: isSel, bad: bad });
      });

      if (ui.pending && ui.hover) {
        ctx.save();
        ctx.strokeStyle = '#ffe36e'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
        ctx.strokeRect(ui.hover.tx * z + 1.5, ui.hover.ty * z + 1.5, z - 3, z - 3);
        ctx.restore();
      }
    }

    function drawSpawn(ctx, sc, tx, ty, dir, sideName, z, o) {
      var c = clampTile(sc, tx, ty);
      var cx = c.tx * z + z / 2, cy = c.ty * z + z / 2, r = z * 0.42;
      ctx.save();
      ctx.globalAlpha = o.ghost ? 0.4 : 1;
      if (o.ghost) ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.closePath();
      ctx.fillStyle = o.ghost ? 'rgba(255,120,200,0.15)' : (o.bad ? '#e0303a' : '#ff5fb8');
      ctx.fill();
      ctx.strokeStyle = o.sel ? '#ffffff' : (o.bad ? '#ff9a9a' : '#ffc0e4');
      ctx.lineWidth = o.sel ? 3 : 1.5;
      ctx.stroke();
      var dv = DIRV[dir] || [0, 0];
      ctx.setLineDash([]);
      ctx.strokeStyle = o.ghost ? '#ffc0e4' : '#ffffff';
      ctx.lineWidth = Math.max(2, z * 0.08);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + dv[0] * z * 0.62, cy + dv[1] * z * 0.62); ctx.stroke();
      if (!o.ghost) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold ' + Math.max(9, Math.round(z * 0.36)) + 'px ui-monospace, Menlo, monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(sideName.toUpperCase(), cx - dv[0] * z * 0.12, cy - dv[1] * z * 0.12);
      }
      if (c.out) {
        ctx.fillStyle = '#ff5a5a';
        ctx.font = 'bold ' + Math.max(9, Math.round(z * 0.28)) + 'px ui-monospace, Menlo, monospace';
        var label = 'OUT ' + tx + ',' + ty, lw = ctx.measureText(label).width;
        ctx.textAlign = 'left';
        ctx.fillText(label, Math.max(2, Math.min(canvas.width - lw - 2, cx - lw / 2)), Math.max(z * 0.3, cy - z * 0.7));
      }
      ctx.restore();
    }

    function drawTrigger(ctx, sc, tx, ty, z, o) {
      var c = clampTile(sc, tx, ty);
      var px = c.tx * z, py = c.ty * z;
      ctx.save();
      if (o.ghost) {
        ctx.globalAlpha = 0.45; ctx.setLineDash([3, 3]);
        ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 1.5;
        ctx.strokeRect(px + 3.5, py + 3.5, z - 7, z - 7);
      } else {
        ctx.fillStyle = o.bad ? 'rgba(224,48,58,0.85)' : 'rgba(255,170,60,0.72)';
        ctx.fillRect(px + 3, py + 3, z - 6, z - 6);
        ctx.strokeStyle = o.sel ? '#ffffff' : (o.bad ? '#ff9a9a' : '#ffd79a');
        ctx.lineWidth = o.sel ? 3 : 1.5;
        ctx.strokeRect(px + 3.5, py + 3.5, z - 7, z - 7);
        if (o.label && z >= 14) {
          ctx.fillStyle = '#1a1206';
          ctx.font = 'bold ' + Math.max(8, Math.round(z * 0.26)) + 'px ui-monospace, Menlo, monospace';
          ctx.textAlign = 'left'; ctx.textBaseline = 'top';
          ctx.fillText(o.label, px + 5, py + 5);
        }
      }
      ctx.restore();
    }

    function drawLegacy(ctx, it, z, isSel) {
      var px = it.tx * z, py = it.ty * z;
      ctx.save();
      ctx.strokeStyle = isSel ? '#ffffff' : '#5ec8ff';
      ctx.lineWidth = isSel ? 3 : 1.5;
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(px + 2.5, py + 2.5, z - 5, z - 5);
      ctx.setLineDash([]);
      ctx.fillStyle = '#5ec8ff';
      ctx.font = 'bold ' + Math.max(8, Math.round(z * 0.34)) + 'px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('L', px + z / 2, py + z / 2);
      ctx.restore();
    }

    function drawObject(ctx, it, z, isSel) {
      ctx.save();
      ctx.fillStyle = isSel ? 'rgba(230,184,74,.5)' : 'rgba(230,184,74,.2)';
      ctx.fillRect(it.tx * z + 1, it.ty * z + 1, it.w * z - 2, it.h * z - 2);
      ctx.strokeStyle = isSel ? '#ffffff' : 'rgba(230,184,74,.8)';
      ctx.lineWidth = isSel ? 3 : 1;
      ctx.strokeRect(it.tx * z + 1.5, it.ty * z + 1.5, it.w * z - 3, it.h * z - 3);
      ctx.restore();
    }

    function drawNpc(ctx, it, z, isSel) {
      var cx = it.tx * z + z / 2, cy = it.ty * z + z / 2;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy - z * 0.34); ctx.lineTo(cx + z * 0.3, cy + z * 0.28); ctx.lineTo(cx - z * 0.3, cy + z * 0.28); ctx.closePath();
      ctx.fillStyle = '#7ee07e'; ctx.fill();
      ctx.strokeStyle = isSel ? '#ffffff' : '#244d24'; ctx.lineWidth = isSel ? 3 : 1; ctx.stroke();
      var name = String(it.name || it.characterId);
      ctx.font = 'bold ' + Math.max(9, Math.round(z * 0.26)) + 'px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      var w = ctx.measureText(name).width + 6;
      var ly = Math.max(z * 0.34, it.ty * z + 2);
      ctx.fillStyle = 'rgba(5,10,5,.78)';
      ctx.fillRect(cx - w / 2, ly - Math.max(10, z * 0.3), w, Math.max(10, z * 0.3));
      ctx.fillStyle = '#b9f5b9';
      ctx.fillText(name, cx, ly);
      ctx.restore();
    }

    // ------------------------------------------------------------------ side panel
    function row(parent, label, value) {
      var r = parent.appendChild(el('div', { class: 'wb-row' }));
      r.appendChild(el('span', { class: 'wb-k' }, label));
      var v = r.appendChild(el('span', { class: 'wb-v' }));
      if (value instanceof Node) v.appendChild(value); else v.textContent = value == null ? '—' : String(value);
      return v;
    }
    function button(parent, label, action, onClick, opts) {
      var b = parent.appendChild(el('button', { 'data-action': action, class: (opts && opts.cls) || '' }, label));
      if (opts && opts.disabled) b.disabled = true;
      b.addEventListener('click', onClick);
      return b;
    }
    function fmtTile(t) { return t[0] + ',' + t[1]; }

    function renderInspector(list) {
      insp.textContent = '';
      insp.appendChild(el('h2', null, 'INSPECTOR'));
      if (!ui.selectedId) { insp.appendChild(el('div', { class: 'wb-muted' }, 'Click a marker on the canvas.')); return; }
      var it = Core.findItem(list, ui.selectedId);
      var ref = selectedRef();
      insp.appendChild(el('div', { class: 'wb-id', id: 'wb-selected-id' }, ui.selectedId));
      if (!it && !(ref && ref.connId)) { insp.appendChild(el('div', { class: 'wb-muted' }, 'selection not in this scene')); return; }

      if (ref && (ref.kind === ID.KINDS.ENDPOINT || ref.kind === ID.KINDS.TRIGGER)) {
        var rec = draft()[ref.connId];
        var ep = rec && rec[ref.side];
        if (!ep) { insp.appendChild(el('div', { class: 'wb-warn' }, 'endpoint missing from draft')); return; }
        var editing = ui.mode === 'edit';
        var changed = E.isChanged(store, draft(), ref.connId);
        var oneWay = E.isOneWay(rec);
        row(insp, 'CONNECTION', ref.connId);
        row(insp, 'DIRECTION', el('span', { id: 'wb-direction', class: oneWay ? 'wb-oneway' : '' },
          oneWay ? 'ONE-WAY ' + rec.a.scene + ' → ' + rec.b.scene : 'paired'));
        row(insp, 'ENDPOINT', ref.side + (oneWay ? (ref.side === 'a' ? ' (source: triggers only)' : ' (arrival: spawn only)') : ''));
        row(insp, 'SCENE', ep.scene);
        row(insp, 'DRAFT', changed ? 'modified (' + E.changedEndpoints(store, draft(), ref.connId).join(', ') + ')' : 'unchanged');

        var trList = el('div', { class: 'wb-triggers' });
        (ep.triggers || []).forEach(function (t, i) {
          var tid = ID.triggerId(ref.connId, ref.side, i);
          var b = trList.appendChild(el('button', { class: 'wb-chip' + (tid === ui.selectedId ? ' on' : ''), 'data-trigger': tid }, '#' + i + '  ' + fmtTile(t)));
          b.addEventListener('click', function () { ui.selectedId = tid; ui.pending = null; render(); });
        });
        if (!(ep.triggers || []).length) trList.textContent = '(none)';
        row(insp, 'TRIGGERS', trList);

        if (ref.kind === ID.KINDS.TRIGGER) {
          var t = (ep.triggers || [])[ref.index];
          row(insp, 'TRIGGER', t ? '#' + ref.index + ' at ' + fmtTile(t) : '(removed)');
        }

        var spawn = ep.spawn || {};
        var hasSpawn = !(oneWay && ref.side === 'a');
        if (!hasSpawn) {
          row(insp, 'SPAWN x/y', '— (one-way source)');
        } else if (editing) {
          var xy = el('span', { class: 'wb-inline' });
          var inX = xy.appendChild(el('input', { type: 'number', step: '1', id: 'wb-spawn-x', value: spawn.tx }));
          var inY = xy.appendChild(el('input', { type: 'number', step: '1', id: 'wb-spawn-y', value: spawn.ty }));
          row(insp, 'SPAWN x/y', xy);
          [[inX, 'tx'], [inY, 'ty']].forEach(function (pair) {
            pair[0].addEventListener('change', function () {
              var v = pair[0].value;
              guard(function () {
                var patch = {}; patch[pair[1]] = Number(v);
                commit(E.setSpawn(draft(), ref.connId, ref.side, patch), 'spawn ' + pair[1]);
              });
            });
          });
          var face = el('select', { id: 'wb-facing' });
          E.FACINGS.forEach(function (f) {
            var o = face.appendChild(el('option', { value: f }, f));
            if (f === spawn.dir) o.selected = true;
          });
          face.addEventListener('change', function () {
            guard(function () { commit(E.setSpawn(draft(), ref.connId, ref.side, { dir: face.value }), 'facing'); });
          });
          row(insp, 'FACING', face);
        } else {
          row(insp, 'SPAWN x/y', spawn.tx + ', ' + spawn.ty);
          row(insp, 'FACING', spawn.dir);
        }

        var otherSide = ref.side === 'a' ? 'b' : 'a';
        var pair = rec[otherSide];
        var pairBox = el('span', { class: 'wb-inline' });
        pairBox.appendChild(el('span', null, pair ? otherSide + ' · ' + pair.scene + ' @ ' + (pair.spawn ? pair.spawn.tx + ',' + pair.spawn.ty + ' ' + pair.spawn.dir : '?') : '—'));
        if (pair) {
          var jump = pairBox.appendChild(el('button', { 'data-action': 'jump' }, 'jump'));
          jump.addEventListener('click', function () {
            ui.pending = null;
            setScene(pair.scene);
            ui.selectedId = ID.endpointId(ref.connId, otherSide);
            render();
          });
        }
        row(insp, 'PAIRED ENDPOINT', pairBox);

        if (editing) {
          var acts = insp.appendChild(el('div', { class: 'wb-actions' }));
          var pend = ui.pending && ui.pending.connId === ref.connId && ui.pending.side === ref.side ? ui.pending.action : null;
          if (ref.kind === ID.KINDS.ENDPOINT && hasSpawn) {
            button(acts, pend === 'move-spawn' ? 'MOVE SPAWN · click a tile…' : 'MOVE SPAWN', 'move-spawn', function () {
              ui.pending = { action: 'move-spawn', connId: ref.connId, side: ref.side }; render();
            }, { cls: pend === 'move-spawn' ? 'on' : '' });
          } else if (ref.kind === ID.KINDS.TRIGGER) {
            button(acts, pend === 'move-trigger' ? 'MOVE · click a tile…' : 'MOVE', 'move-trigger', function () {
              ui.pending = { action: 'move-trigger', connId: ref.connId, side: ref.side, index: ref.index }; render();
            }, { cls: pend === 'move-trigger' ? 'on' : '', disabled: !(ep.triggers || [])[ref.index] });
            button(acts, 'REMOVE', 'remove-trigger', function () {
              guard(function () {
                commit(E.removeTrigger(draft(), ref.connId, ref.side, ref.index), 'remove trigger');
                ui.selectedId = ID.endpointId(ref.connId, ref.side);
              });
            }, { cls: 'wb-danger', disabled: !(ep.triggers || [])[ref.index] });
          }
          if (oneWay && ref.side === 'b') {
            acts.appendChild(el('div', { class: 'wb-muted', id: 'wb-oneway-note' }, 'One-way arrival: endpoint b takes no triggers.'));
          } else {
            button(acts, pend === 'add-trigger' ? 'ADD TRIGGER · click an empty tile…' : 'ADD TRIGGER', 'add-trigger', function () {
              ui.pending = { action: 'add-trigger', connId: ref.connId, side: ref.side }; render();
            }, { cls: pend === 'add-trigger' ? 'on' : '' });
          }
          button(acts, 'REVERT SELECTED', 'revert-selected', function () {
            guard(function () { commit(E.revertConnection(store, draft(), ref.connId), 'revert ' + ref.connId); ui.pending = null; });
          }, { disabled: !changed });
          if (ui.pending) insp.appendChild(el('div', { class: 'wb-hint' }, 'Esc cancels. Tiles snap to integers.'));
        }
        return;
      }

      if (!it) return;
      row(insp, 'KIND', it.kind + (it.readOnly ? ' (read-only)' : ''));
      row(insp, 'SCENE', it.scene);
      if (it.kind === 'npc') {
        row(insp, 'CHARACTER', it.characterId);
        row(insp, 'NAME', it.name);
        row(insp, 'TILE', it.tx + ',' + it.ty);
        row(insp, 'FACING', it.dir);
        row(insp, 'SOURCE', ui.momentKey === 'baseline' ? 'baseline cast' : 'story moment ' + ui.momentKey);
      } else if (it.kind === 'legacy-door') {
        row(insp, 'TILE', it.tx + ',' + it.ty);
        row(insp, 'TARGET', it.target ? it.target.scene : '—');
        row(insp, 'SPAWN', it.target ? it.target.x + ',' + it.target.y + (it.dir ? ' ' + it.dir : '') : '—');
        insp.appendChild(el('div', { class: 'wb-muted' }, 'Classic js/maps.js door — not in world/connections.json, not editable.'));
      } else if (it.kind === 'object') {
        row(insp, 'TYPE', (it.type || '—') + (it.subkind ? ' / ' + it.subkind : ''));
        row(insp, 'TILE', it.tx + ',' + it.ty + '  ' + it.w + '×' + it.h);
        if (it.dialogue != null) row(insp, 'DIALOGUE', typeof it.dialogue === 'string' ? it.dialogue : JSON.stringify(it.dialogue));
      }
    }

    function renderValidation(errs) {
      valBox.textContent = '';
      valBox.appendChild(el('h2', null, 'VALIDATION'));
      var ids = Object.keys(errs);
      var changed = E.changedIds(store, draft());
      if (!changed.length) { valBox.appendChild(el('div', { class: 'wb-muted' }, 'No drafts.')); return; }
      if (!ids.length) { valBox.appendChild(el('div', { class: 'wb-ok', id: 'wb-valid' }, '✓ ' + changed.length + ' draft(s) valid')); return; }
      ids.forEach(function (id) {
        var box = valBox.appendChild(el('div', { class: 'wb-errors', 'data-connection': id }));
        box.appendChild(el('div', { class: 'wb-errors-head' }, id));
        var ul = box.appendChild(el('ul'));
        errs[id].forEach(function (msg) { ul.appendChild(el('li', { class: 'wb-error' }, msg)); });
      });
    }

    function renderExport(errs) {
      exportBox.textContent = '';
      if (!ui.exportOpen) return;
      exportBox.appendChild(el('h2', null, 'EXPORT CHANGESET'));
      var bad = Object.keys(errs);
      if (bad.length) {
        exportBox.appendChild(el('div', { class: 'wb-warn', id: 'wb-export-blocked' },
          'EXPORT BLOCKED — ' + bad.length + ' invalid draft(s): ' + bad.join(', ') + '. Fix or revert them first.'));
        return;
      }
      var cs = E.buildChangeset(store, draft());
      exportBox.appendChild(el('div', { class: 'wb-muted' },
        cs.operations.length + ' changed connection(s). Save as a file, then: node tools/world-apply.js <file> --dry-run'));
      var ta = exportBox.appendChild(el('textarea', { id: 'wb-export-text', readonly: 'readonly', spellcheck: 'false' }));
      ta.value = E.serialize(cs);
      var copy = button(exportBox, 'COPY', 'copy', function () {
        ta.select();
        var done = function () { copy.textContent = 'COPIED'; };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done, function () { document.execCommand('copy'); done(); });
        else { document.execCommand('copy'); done(); }
      });
    }

    // ------------------------------------------------------------------ render
    function render() {
      var sc = model.scenes[ui.sceneId];
      var list = items();
      var errs = allErrors();
      var n = E.changedIds(store, draft()).length;
      title.textContent = 'WORLD BUILDER · ' + n + ' unsaved change' + (n === 1 ? '' : 's');
      modeBadge.textContent = ui.mode === 'edit' ? 'EDIT' : 'VIEW';
      modeBadge.className = ui.mode === 'edit' ? 'edit' : 'view';
      viewBtn.className = ui.mode === 'view' ? 'on' : '';
      editBtn.className = ui.mode === 'edit' ? 'on' : '';
      undoBtn.disabled = !H.canUndo(hist);
      revertAllBtn.disabled = ui.mode !== 'edit' || n === 0;
      exportBtn.disabled = ui.mode !== 'edit';
      if (sceneSel.value !== ui.sceneId) sceneSel.value = ui.sceneId;
      if (momentSel.value !== ui.momentKey) momentSel.value = ui.momentKey;
      canvas.style.cursor = ui.pending ? 'crosshair' : 'pointer';

      var counts = { 'connection-endpoint': 0, trigger: 0, npc: 0, object: 0, 'legacy-door': 0 };
      list.forEach(function (it) { counts[it.kind]++; });
      stageInfo.textContent = sc.sceneId + ' · ' + sc.width + '×' + sc.height + (sc.indoor ? ' interior' : '') +
        ' · endpoints ' + counts['connection-endpoint'] + ' · triggers ' + counts.trigger + ' · npcs ' + counts.npc +
        ' · objects ' + counts.object + ' · legacy doors ' + counts['legacy-door'] +
        ' · cast: ' + (ui.momentKey === 'baseline' ? 'baseline' : ui.momentKey);

      drawCanvas(sc, list, errs);
      noticeBox.textContent = '';
      if (ui.notice) noticeBox.appendChild(el('div', { class: ui.notice.level === 'error' ? 'wb-warn' : 'wb-hint' }, ui.notice.text));
      renderInspector(list);
      renderValidation(errs);
      renderExport(errs);
    }

    function setScene(sceneId) {
      if (!model.scenes[sceneId]) throw new Error('unknown scene ' + sceneId);
      ui.sceneId = sceneId;
      ui.hover = null;
    }

    // ------------------------------------------------------------------ events
    function tileFromEvent(ev) {
      var rect = canvas.getBoundingClientRect();
      var sx = canvas.width / rect.width, sy = canvas.height / rect.height;
      var tx = Math.floor((ev.clientX - rect.left) * sx / ui.zoom);
      var ty = Math.floor((ev.clientY - rect.top) * sy / ui.zoom);
      var sc = model.scenes[ui.sceneId];
      if (tx < 0 || ty < 0 || tx >= sc.width || ty >= sc.height) return null;
      return { tx: tx, ty: ty };
    }

    canvas.addEventListener('mousemove', function (ev) {
      if (!ui.pending) return;
      var t = tileFromEvent(ev);
      if (!t || (ui.hover && ui.hover.tx === t.tx && ui.hover.ty === t.ty)) return;
      ui.hover = t;
      render();
    });

    canvas.addEventListener('click', function (ev) {
      var t = tileFromEvent(ev);
      if (!t) return;
      var p = ui.pending;
      if (!p) {
        var hit = Core.itemAt(items(), t.tx, t.ty);
        ui.selectedId = hit ? hit.id : null;
        ui.notice = null;
        render();
        return;
      }
      guard(function () {
        if (p.action === 'move-spawn') {
          commit(E.setSpawn(draft(), p.connId, p.side, { tx: t.tx, ty: t.ty }), 'move spawn');
          ui.selectedId = ID.endpointId(p.connId, p.side);
        } else if (p.action === 'move-trigger') {
          commit(E.moveTrigger(draft(), p.connId, p.side, p.index, t.tx, t.ty), 'move trigger');
          ui.selectedId = ID.triggerId(p.connId, p.side, p.index);
        } else if (p.action === 'add-trigger') {
          var occupant = Core.itemAt(items(), t.tx, t.ty);
          if (occupant) { ui.pending = p; throw new Error('ADD needs an empty tile — ' + t.tx + ',' + t.ty + ' holds ' + occupant.id); }
          var next = E.addTrigger(draft(), p.connId, p.side, t.tx, t.ty);
          commit(next, 'add trigger');
          ui.selectedId = ID.triggerId(p.connId, p.side, next[p.connId][p.side].triggers.length - 1);
        }
        ui.pending = null;
        ui.hover = null;
      });
    });

    sceneSel.addEventListener('change', function () {
      guard(function () { setScene(sceneSel.value); ui.selectedId = null; ui.pending = null; });
    });
    momentSel.addEventListener('change', function () {
      guard(function () {
        var key = momentSel.value;
        ui.momentCast = key === 'baseline' ? null : WB.castForSeed(G, ui.moments[key]);
        ui.momentKey = key;
        var p = ui.selectedId && ID.parse(ui.selectedId);
        if (p && p.kind === ID.KINDS.NPC) ui.selectedId = null;
      });
    });
    viewBtn.addEventListener('click', function () { ui.mode = 'view'; ui.pending = null; ui.exportOpen = false; render(); });
    editBtn.addEventListener('click', function () { ui.mode = 'edit'; render(); });
    function undo() {
      if (!H.canUndo(hist)) return;
      hist = H.undo(hist);
      ui.pending = null;
      var ref = selectedRef();
      if (ref && ref.kind === ID.KINDS.TRIGGER) {
        var ep = draft()[ref.connId] && draft()[ref.connId][ref.side];
        if (!ep || !ep.triggers[ref.index]) ui.selectedId = ID.endpointId(ref.connId, ref.side);
      }
      render();
    }
    undoBtn.addEventListener('click', undo);
    revertAllBtn.addEventListener('click', function () { guard(function () { commit(E.revertAll(store), 'revert all'); ui.pending = null; }); });
    exportBtn.addEventListener('click', function () { ui.exportOpen = true; render(); });
    document.addEventListener('keydown', function (ev) {
      if ((ev.ctrlKey || ev.metaKey) && !ev.shiftKey && (ev.key === 'z' || ev.key === 'Z')) {
        if (ev.target && ev.target.tagName === 'TEXTAREA') return;
        ev.preventDefault();
        undo();
      } else if (ev.key === 'Escape' && ui.pending) {
        ui.pending = null; ui.hover = null; render();
      }
    });
    window.addEventListener('resize', function () { render(); });

    // ------------------------------------------------------------------ boot
    setScene(sceneSel.options.length ? sceneSel.options[0].value : Object.keys(model.scenes)[0]);
    render();
    loadMoments();

    // Read-only debug/test handle: state readers + tile->client geometry. Mutations go through the UI.
    window.WB = {
      model: model,
      state: function () {
        var list = items();
        var errs = allErrors();
        return {
          sceneId: ui.sceneId, mode: ui.mode, selectedId: ui.selectedId, pending: ui.pending && ui.pending.action,
          momentKey: ui.momentKey, unsaved: E.changedIds(store, draft()).length, changedIds: E.changedIds(store, draft()),
          errors: errs, exportOpen: ui.exportOpen, exportBlocked: ui.exportOpen && Object.keys(errs).length > 0,
          canUndo: H.canUndo(hist), momentsLoaded: !momentSel.disabled, notice: ui.notice && ui.notice.text,
          draft: JSON.parse(JSON.stringify(draft())),
          items: list.map(function (it) { return { id: it.id, kind: it.kind, tx: it.tx, ty: it.ty }; }),
          npcIds: list.filter(function (it) { return it.kind === 'npc'; }).map(function (it) { return it.characterId; })
        };
      },
      tileToClient: function (tx, ty) {
        var rect = canvas.getBoundingClientRect();
        var k = rect.width / canvas.width;
        return { x: rect.left + (tx + 0.5) * ui.zoom * k, y: rect.top + (ty + 0.5) * ui.zoom * k };
      }
    };
    document.title = 'World Builder — ready';
    document.body.setAttribute('data-wb-ready', '1');
  }

  function boot() {
    if (document.body.getAttribute('data-wb-ready')) return;
    try { mount(); }
    catch (e) {
      console.error('[world-builder] mount failed', e);
      var pre = document.createElement('pre');
      pre.id = 'wb-fatal';
      pre.textContent = 'WORLD BUILDER failed to mount:\n' + (e && e.stack || e);
      document.body.appendChild(pre);
    }
  }
  if (typeof window !== 'undefined' && typeof document !== 'undefined' && document) {
    if (!PIECES_OK) {
      if (typeof console !== 'undefined') console.warn('[world-builder] data layer or editor core missing — not mounting.');
    } else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }

  var api = { mount: mount, planScene: planScene, planSpawns: planSpawns };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') { window.GAME = window.GAME || {}; window.GAME.WorldBuilder = api; }
})();
