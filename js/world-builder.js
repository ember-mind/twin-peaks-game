/* world-builder.js — WORLD BUILDER M4b browser glue (dev page only; index.html never loads it).
 *
 * Renders ONE frozen model — GAME.WorldBuilderData.adaptWorld(GAME) — and edits connection endpoints as
 * DRAFTS. Nothing here writes to disk or to the runtime registry: the only way out is EXPORT CHANGESET
 * (a JSON textarea), which tools/world-apply.js turns into a world/connections.json change.
 *
 *   selection   stable ids from js/editor/core/identity.js, hit-tested topmost-wins over the same
 *               paint-ordered list the canvas draws (GameWorldBuilderCore.sceneItems)
 *   VIEW/EDIT   EDIT unlocks spawn x/y/facing, MOVE SPAWN, trigger MOVE/ADD/REMOVE, revert, export
 *   M7          door gating fields (needsFlag / blockedMsg / needsClues) on the endpoint that owns the trigger, and
 *               CONVERT TO ONE-WAY / CONVERT TO PAIRED with a confirm step (one-way asks for the source side when
 *               the losing side holds several triggers; paired asks for the missing a.spawn and b trigger)
 *   M6          NEW CONNECTION (pick a tile in scene A, a tile in scene B, PAIRED/ONE-WAY, id, live validation,
 *               CONFIRM) and DELETE CONNECTION (with a confirm step); both land in the draft store, so the
 *               record shows (or disappears) at once and the export carries a version-2 create/delete op
 *   drafts      Editor.edit store (id -> whole record), every edit committed to Editor.history (Ctrl+Z / Ctrl+Shift+Z)
 *   validation  GAME.LocationConnections messages verbatim + registry/endpoint/scene/paired checks
 *   story       NPC overlay from GAME.CastPresence.resolveCast(seed state) over the cast DRAFT (Editor.cast); in EDIT
 *               a PLACED body gets MOVE (click a tile, arrow keys set facing): the inspector names the source window
 *               and owner or "baseline"; the export is a cast-windows-changeset, or a world-builder-bundle when
 *               connections changed too
 *   legacy      map doors with no connection id: read-only `legacy-door` items
 *   M8          scene objects and interact keys of world/scene-objects.json (Editor.sceneObjects drafts): in EDIT an object
 *               gets MOVE (origin tile), RESIZE (w/h, rects only), DELETE (refused while a mission node references its
 *               dialogue), REVERT; an interact key gets MOVE / DELETE / REVERT; NEW OBJECT (kind already present, existing
 *               dialogue id, tile picked on the canvas) and NEW INTERACT (an INTERACT_DLG id). Export: a
 *               scene-objects-changeset, or part of the world-builder-bundle. ON THIS TILE lists stacked items.
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

  var PIECES_OK = !!(WB && Core && Ed && Ed.edit && Ed.cast && Ed.sceneObjects && Ed.history && Ed.identity && Ed.hitTest && Ed.model);

  var DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  function mount() {
    var G = window.GAME;
    var world = WB.adaptWorld(G);
    if (!world.model) throw new Error('[world-builder] editor core model missing — load js/editor/core/*.js first');
    var model = world.model;
    var E = Ed.edit, C = Ed.cast, S = Ed.sceneObjects, H = Ed.history, ID = Ed.identity;
    var store = E.createStore(world.source.connections);
    var vctx = WB.validationContext(G);
    var castStore = G.NarrativeData && G.NarrativeData.cast ? C.createCastStore(G.NarrativeData.cast) : null;
    var octx = WB.objectsContext(G);
    var objStore = S.createObjectStore(octx.registry);
    var cctx = WB.castContext(G, function (scene, x, y) {
      var d = draft(), hit = null;
      Object.keys(d).sort().forEach(function (id) {
        ['a', 'b'].forEach(function (sd) {
          var ep = d[id] && d[id][sd];
          if (ep && ep.scene === scene && (ep.triggers || []).some(function (t) { return t[0] === x && t[1] === y; })) hit = hit || id;
        });
      });
      return hit;
    });

    var ui = {
      sceneId: null,
      mode: 'view',             // 'view' | 'edit'
      selectedId: null,
      pending: null,            // null | {action:'move-spawn'|'move-trigger'|'add-trigger', connId, side, index?}
      creating: null,           // null | {step:'a'|'b'|'confirm', oneWay, a, b, id, idEdited, spawn:{a,b}, moving}
      confirmDelete: null,      // connection id awaiting DELETE confirmation
      converting: null,         // null | {connId, to:'one-way'|'paired', source, aSpawn, bTrigger, facing, placing}
      hover: null,
      notice: null,
      exportOpen: false,
      momentKey: 'baseline',
      moments: {},              // seed key -> seed (from test/fixtures/cast-pins-acts-1-4.json)
      momentCast: null,         // castForSeed result for the chosen seed
      zoom: 16,
      newObject: null,          // null | {scene, kind, sourceId, sourceIdEdited, dialogue, w, h, tile, placing}
      newInteract: null,        // null | {scene, id, tile, placing}
      confirmObjectDelete: null, // item id awaiting DELETE confirmation
      stackTile: null           // {scene, tx, ty} of the last canvas click (ON THIS TILE)
    };
    // history holds { conn, cast, objects }: one undo stack across connection, cast and scene object edits
    var hist = H.create({ conn: store.base, cast: castStore ? castStore.base : null, objects: objStore.base });
    function draft() { return hist.present.conn; }
    function castDraft() { return hist.present.cast; }
    function objDraft() { return hist.present.objects; }

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
    var redoBtn = bar.appendChild(el('button', { 'data-action': 'redo', title: 'Ctrl+Shift+Z' }, 'REDO'));
    var newBtn = bar.appendChild(el('button', { 'data-action': 'new-connection' }, 'NEW CONNECTION'));
    var newObjBtn = bar.appendChild(el('button', { 'data-action': 'new-object' }, 'NEW OBJECT'));
    var newIntBtn = bar.appendChild(el('button', { 'data-action': 'new-interact' }, 'NEW INTERACT'));
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
    var programBox = side.appendChild(el('div', { id: 'wb-program' }));
    var valBox = side.appendChild(el('div', { id: 'wb-validation' }));
    var exportBox = side.appendChild(el('div', { id: 'wb-export' }));

    legend.innerHTML =
      '<span class="lg lg-ep">◆</span> endpoint spawn&nbsp;&nbsp; <span class="lg lg-tr">■</span> trigger&nbsp;&nbsp; ' +
      '<span class="lg lg-ghost">◇</span> original (dimmed)&nbsp;&nbsp; <span class="lg lg-bad">◆</span> invalid draft&nbsp;&nbsp; ' +
      '<span class="lg lg-new">◈</span> new connection (unconfirmed)&nbsp;&nbsp; <span class="lg lg-npc">▲</span> npc&nbsp;&nbsp; <span class="lg lg-obj">▭</span> object&nbsp;&nbsp; <span class="lg" style="color:#96d7ff">▫</span> interact key&nbsp;&nbsp; <span class="lg lg-leg">□</span> legacy door (read-only)';

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
    // resolved cast for the chosen moment over the cast draft (cached per draft + moment)
    var castCache = { draft: null, key: null, value: null };
    function castChanged() { return castStore ? C.changedKeys(castStore, castDraft()) : []; }
    function momentCast() {
      if (!castStore) return ui.momentKey === 'baseline' ? null : ui.momentCast;
      if (castCache.draft !== castDraft() || castCache.key !== ui.momentKey) {
        var data = C.castDataWithDraft(castStore.data, castStore, castDraft());
        castCache = { draft: castDraft(), key: ui.momentKey, value: WB.castForSeed(G, ui.momentKey === 'baseline' ? null : ui.moments[ui.momentKey], data) };
      }
      return castCache.value;
    }
    function sceneNpcs(sceneId) {
      var mc = momentCast();
      if (!mc) return null; // model baseline overlay
      return mc[sceneId] || [];
    }
    function castBody(characterId) {
      var mc = momentCast() || {}, hit = null;
      Object.keys(mc).forEach(function (sc) { (mc[sc] || []).forEach(function (b) { if (b.id === characterId) hit = Object.assign({ sceneId: sc }, b); }); });
      return hit;
    }
    // the editable identity of a resolved body: its source window (or baseline) in the cast store
    function bodyRef(body) {
      if (!castStore || !body) return null;
      var win = body.source === 'BASELINE' ? C.BASELINE : body.source;
      return castDraft()[C.key(win, body.id)] ? { window: win, character: body.id } : null;
    }
    function occupantsAt(sceneId, x, y, except) {
      var mc = momentCast() || {};
      return (mc[sceneId] || []).filter(function (b) { return b.id !== except && b.x === x && b.y === y; }).map(function (b) { return b.id; });
    }
    // registry objects + interact keys of one scene as sceneItems specs (null: the scene has no registry entry)
    function objectOverlays(sceneId) {
      var ds = objDraft()[sceneId];
      if (!ds) return null;
      return ds.objects.map(function (o) {
        return { key: o.sourceId, entry: 'object', sourceId: o.sourceId, type: o.type, subkind: o.kind || null, tx: o.x, ty: o.y,
          w: o.w || 1, h: o.h || 1, rect: o.w !== undefined, dialogue: o.dialogue };
      }).concat(ds.interact.map(function (e) {
        return { key: S.interactItemKey(e.ref), entry: 'interact', ref: e.ref, interactId: e.id, type: octx.isSparkle(e.id) ? 'sparkle' : 'plain',
          subkind: null, tx: e.x, ty: e.y, w: 1, h: 1, rect: false, dialogue: octx.resolveInteract(e.id) };
      }));
    }
    function items(sceneId) {
      var sid = sceneId || ui.sceneId;
      return Core.sceneItems(model, sid, { connections: draft(), npcs: sceneNpcs(sid), objects: objectOverlays(sid) });
    }
    function objectChanges() { return S.changes(objStore, objDraft()); }
    function objectOpsList() { return S.buildObjectsChangeset(objStore, objDraft()).operations; }
    // the base and draft entries behind a registry object item
    function objectEntry(it) {
      var bs = objStore.base[it.scene], ds = objDraft()[it.scene];
      if (!bs || !ds) return { base: null, now: null };
      if (it.entry === 'object') {
        return { base: bs.objects.filter(function (o) { return o.sourceId === it.sourceId; })[0] || null,
          now: ds.objects.filter(function (o) { return o.sourceId === it.sourceId; })[0] || null };
      }
      return { base: bs.interact.filter(function (e) { return e.ref === it.ref; })[0] || null,
        now: ds.interact.filter(function (e) { return e.ref === it.ref; })[0] || null };
    }
    function objectRefs(it) {
      var ids = it.entry === 'object' ? S.dialogueIds(it.dialogue) : [it.interactId].concat(S.dialogueIds(octx.resolveInteract(it.interactId)));
      return S.missionReferences(octx.missions, ids);
    }
    function cleanMsg(e) { return String(e.message || e).replace(/^[scene-objects] /, ''); }
    // NEW OBJECT / NEW INTERACT candidates: the draft they would commit, or the reason they cannot
    function newObjectPlan() {
      var n = ui.newObject;
      if (!n) return null;
      if (!n.tile) return { draft: null, errors: ['pick the origin tile on the canvas'] };
      try {
        var next = S.createObject(objStore, objDraft(), n.scene, { sourceId: n.sourceId, kind: n.kind, x: n.tile.tx, y: n.tile.ty, w: n.w, h: n.h, dialogue: n.dialogue });
        return { draft: next, errors: (S.draftErrors(octx, objStore, next)[n.scene] || []) };
      } catch (e) { return { draft: null, errors: [cleanMsg(e)] }; }
    }
    function newInteractPlan() {
      var n = ui.newInteract;
      if (!n) return null;
      if (!n.tile) return { draft: null, ref: null, errors: ['pick the tile on the canvas'] };
      try {
        var res = S.createInteract(objStore, objDraft(), n.scene, { x: n.tile.tx, y: n.tile.ty, id: n.id });
        return { draft: res.draft, ref: res.ref, errors: (S.draftErrors(octx, objStore, res.draft)[n.scene] || []) };
      } catch (e) { return { draft: null, ref: null, errors: [cleanMsg(e)] }; }
    }
    function errorsFor(connId) {
      var d = draft();
      if (!d[connId]) return store.base[connId] ? [] : ['connection id "' + connId + '" does not exist in the draft']; // a delete is a valid draft
      if (E.isCreated(store, d, connId)) return E.validateDraft(d[connId], vctx, { created: true, draft: d });
      return E.validateDraft(d[connId], vctx, { changedSides: E.changedEndpoints(store, d, connId), draft: d });
    }

    // ---- NEW CONNECTION candidate (not in the draft until CONFIRM)
    function candidate() {
      var c = ui.creating;
      if (!c || !c.a || !c.b) return null;
      var sa = model.scenes[c.a.scene], sb = model.scenes[c.b.scene];
      return E.newConnection({ id: c.id, oneWay: c.oneWay, spawn: c.spawn,
        a: { scene: c.a.scene, tx: c.a.tx, ty: c.a.ty, width: sa.width, height: sa.height },
        b: { scene: c.b.scene, tx: c.b.tx, ty: c.b.ty, width: sb.width, height: sb.height } });
    }
    function candidateErrors() {
      var rec = candidate();
      if (!rec) return ['pick ' + (ui.creating && ui.creating.a ? 'a tile in scene B' : 'a tile in scene A') + ' first'];
      var d = Object.assign({}, draft());
      var errs = E.idErrors(rec.id, store, d, null);
      d[rec.id] = rec;
      E.validateDraft(rec, vctx, { created: true, draft: d }).forEach(function (e) { errs.push(e); });
      return errs.filter(function (e, i) { return errs.indexOf(e) === i; });
    }
    // ---- M7 PAIRED <-> ONE-WAY conversion candidate (not in the draft until CONFIRM)
    function conversion() {
      var cv = ui.converting;
      if (!cv) return null;
      var rec = draft()[cv.connId];
      if (!rec) return { record: null, errors: ['connection ' + cv.connId + ' left the draft'], dropped: [] };
      if (cv.to === 'one-way') {
        var plan = E.planOneWay(rec, cv.source ? { source: cv.source } : {});
        if (plan.needsChoice) return { record: null, errors: [plan.reason], dropped: [], needsChoice: true };
        return { record: plan.record, errors: conversionErrors(plan.record), dropped: plan.dropped };
      }
      var missing = [];
      if (!cv.aSpawn) missing.push('place a.spawn in ' + rec.a.scene);
      if (!cv.bTrigger) missing.push('place a b trigger in ' + rec.b.scene);
      if (missing.length) return { record: null, errors: missing, dropped: [] };
      var paired = E.planPaired(rec, { aSpawn: { tx: cv.aSpawn.tx, ty: cv.aSpawn.ty, dir: cv.facing }, bTrigger: cv.bTrigger });
      return { record: paired, errors: conversionErrors(paired), dropped: [] };
    }
    function conversionErrors(rec) {
      var d = Object.assign({}, draft());
      d[rec.id] = rec;
      var errs = E.validateDraft(rec, vctx, { changedSides: ['a', 'b'], draft: d });
      return errs.filter(function (e, i) { return errs.indexOf(e) === i; });
    }

    function castOpsList() { return castStore ? C.buildCastChangeset(castStore, castDraft()).operations : []; }

    function draftOps() {
      var d = draft();
      return E.changedIds(store, d).map(function (id) {
        return { id: id, op: !d[id] ? 'delete' : (E.isCreated(store, d, id) ? 'create' : 'upsert') };
      });
    }
    function allErrors() {
      var out = {};
      E.changedIds(store, draft()).forEach(function (id) {
        var errs = errorsFor(id);
        if (errs.length) out[id] = errs;
      });
      var oe = S.draftErrors(octx, objStore, objDraft());
      Object.keys(oe).forEach(function (sc) { out['scene-objects:' + sc] = oe[sc]; });
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
      hist = H.commit(hist, { conn: next, cast: castDraft(), objects: objDraft() }, { label: label });
    }
    function commitCast(next, label) {
      if (next === castDraft()) return;
      hist = H.commit(hist, { conn: draft(), cast: next, objects: objDraft() }, { label: label });
    }
    function commitObjects(next, label) {
      if (next === objDraft()) return;
      hist = H.commit(hist, { conn: draft(), cast: castDraft(), objects: next }, { label: label });
    }
    function unsavedCount() { return E.changedIds(store, draft()).length + castChanged().length + objectChanges().length; }
    function exportObject() {
      return C.buildBundle([E.buildChangeset(store, draft()), castStore ? C.buildCastChangeset(castStore, castDraft()) : null,
        S.buildObjectsChangeset(objStore, objDraft())]);
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

      // originals of changed scene objects / interact keys, dashed, under the draft
      var objBad = !!errs['scene-objects:' + sc.sceneId];
      objectChanges().forEach(function (ch) {
        if (ch.scene !== sc.sceneId || !ch.before) return;
        var b = ch.before;
        drawObject(ctx, { tx: b.x, ty: b.y, w: b.w || 1, h: b.h || 1 }, z, false, { ghost: true });
      });

      list.forEach(function (it) {
        var isSel = it.id === ui.selectedId;
        var bad = !!(it.connectionId && errs[it.connectionId]);
        if (it.kind === 'legacy-door') drawLegacy(ctx, it, z, isSel);
        else if (it.kind === 'object') {
          var oe = it.entry ? objectEntry(it) : null;
          drawObject(ctx, it, z, isSel, { bad: objBad && !!oe && JSON.stringify(oe.base) !== JSON.stringify(oe.now), interact: it.entry === 'interact' });
        }
        else if (it.kind === 'npc') drawNpc(ctx, it, z, isSel);
        else if (it.kind === 'trigger') drawTrigger(ctx, sc, it.tx, it.ty, z, { sel: isSel, bad: bad, label: it.side + it.index });
        else if (it.kind === 'connection-endpoint') drawSpawn(ctx, sc, it.tx, it.ty, it.dir, it.side, z, { sel: isSel, bad: bad });
      });

      var c = ui.creating;
      if (c) {
        var cand = candidate();
        var cbad = cand && candidateErrors().length > 0;
        ['a', 'b'].forEach(function (s) {
          var pick = c[s];
          if (!pick || pick.scene !== sc.sceneId) return;
          if (cand) {
            (cand[s].triggers || []).forEach(function (t) { drawTrigger(ctx, sc, t[0], t[1], z, { bad: cbad, label: 'new ' + s, sel: true }); });
            if (cand[s].spawn) drawSpawn(ctx, sc, cand[s].spawn.tx, cand[s].spawn.ty, cand[s].spawn.dir, s, z, { bad: cbad, sel: c.moving === s });
            if (!(cand[s].triggers || []).length) drawPick(ctx, pick.tx, pick.ty, z, s);
          } else {
            drawPick(ctx, pick.tx, pick.ty, z, s);
          }
        });
      }

      [ui.newObject, ui.newInteract].forEach(function (n) {
        if (!n || !n.tile || n.scene !== sc.sceneId) return;
        var w = n === ui.newObject ? Math.max(1, Number(n.w) || 1) : 1, h = n === ui.newObject ? Math.max(1, Number(n.h) || 1) : 1;
        if (w > 1 || h > 1) drawObject(ctx, { tx: n.tile.tx, ty: n.tile.ty, w: w, h: h }, z, true, {});
        drawPick(ctx, n.tile.tx, n.tile.ty, z, 'new');
      });

      var cv = ui.converting;
      if (cv && cv.to === 'paired') {
        var crec = draft()[cv.connId];
        if (crec && cv.aSpawn && crec.a.scene === sc.sceneId) drawSpawn(ctx, sc, cv.aSpawn.tx, cv.aSpawn.ty, cv.facing, 'a', z, { sel: true });
        if (crec && cv.bTrigger && crec.b.scene === sc.sceneId) drawTrigger(ctx, sc, cv.bTrigger[0], cv.bTrigger[1], z, { sel: true, label: 'new b' });
      }

      if ((ui.pending || (c && (c.step !== 'confirm' || c.moving)) || (cv && cv.placing) || placingObject()) && ui.hover) {
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

    function drawPick(ctx, tx, ty, z, sideName) {
      ctx.save();
      ctx.strokeStyle = '#7fd4ff'; ctx.lineWidth = 3;
      ctx.strokeRect(tx * z + 2.5, ty * z + 2.5, z - 5, z - 5);
      ctx.fillStyle = '#7fd4ff';
      ctx.font = 'bold ' + Math.max(8, Math.round(z * 0.3)) + 'px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('◈' + sideName.toUpperCase(), tx * z + z / 2, ty * z + z / 2);
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

    function drawObject(ctx, it, z, isSel, o) {
      o = o || {};
      ctx.save();
      if (o.ghost) {
        ctx.globalAlpha = 0.5; ctx.setLineDash([3, 3]);
        ctx.strokeStyle = '#e6b84a'; ctx.lineWidth = 1.5;
        ctx.strokeRect(it.tx * z + 2.5, it.ty * z + 2.5, it.w * z - 5, it.h * z - 5);
        ctx.restore();
        return;
      }
      var inset = o.interact ? Math.round(z * 0.18) : 1;
      ctx.fillStyle = o.bad ? 'rgba(224,48,58,.55)' : isSel ? 'rgba(230,184,74,.5)' : o.interact ? 'rgba(120,200,255,.25)' : 'rgba(230,184,74,.2)';
      ctx.fillRect(it.tx * z + inset, it.ty * z + inset, it.w * z - 2 * inset, it.h * z - 2 * inset);
      ctx.strokeStyle = isSel ? '#ffffff' : o.bad ? '#ff9a9a' : o.interact ? 'rgba(150,215,255,.9)' : 'rgba(230,184,74,.8)';
      ctx.lineWidth = isSel ? 3 : 1;
      ctx.strokeRect(it.tx * z + inset + 0.5, it.ty * z + inset + 0.5, it.w * z - 2 * inset - 1, it.h * z - 2 * inset - 1);
      ctx.restore();
    }
    function placingObject() { return !!((ui.newObject && ui.newObject.placing) || (ui.newInteract && ui.newInteract.placing)); }

    function drawNpc(ctx, it, z, isSel) {
      var cx = it.tx * z + z / 2, cy = it.ty * z + z / 2;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy - z * 0.34); ctx.lineTo(cx + z * 0.3, cy + z * 0.28); ctx.lineTo(cx - z * 0.3, cy + z * 0.28); ctx.closePath();
      ctx.fillStyle = '#7ee07e'; ctx.fill();
      ctx.strokeStyle = isSel ? '#ffffff' : '#244d24'; ctx.lineWidth = isSel ? 3 : 1; ctx.stroke();
      var fv = DIRV[it.dir] || [0, 1];
      ctx.strokeStyle = '#eaffea'; ctx.lineWidth = Math.max(2, z * 0.07);
      ctx.beginPath(); ctx.moveTo(cx, cy + z * 0.05); ctx.lineTo(cx + fv[0] * z * 0.46, cy + z * 0.05 + fv[1] * z * 0.46); ctx.stroke();
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

    function renderProgram() {
      programBox.textContent = '';
      var environment;
      Object.keys(model.locationsById).some(function (locationId) {
        var location = model.locationsById[locationId];
        environment = location.environments.find(function (item) { return item.sceneId === ui.sceneId; });
        return !!environment;
      });
      if (!environment || !environment.program) return;
      var program = environment.program;
      programBox.appendChild(el('h2', null, 'ENVIRONMENT PROGRAM · READ ONLY'));
      programBox.appendChild(el('h3', null, 'INTENT'));
      row(programBox, 'FUNCTION', program.intent.function);
      row(programBox, 'PLAYER EXPERIENCE', program.intent.playerExperience);
      row(programBox, 'TONE', program.intent.tone);
      programBox.appendChild(el('h3', null, 'VISUAL GOALS'));
      program.visualGoals.forEach(function (goal) { row(programBox, goal.id, goal.aim); });
      programBox.appendChild(el('h3', null, 'ACTIVITIES'));
      program.activities.forEach(function (activity) { row(programBox, activity.id, activity.description); });
      programBox.appendChild(el('h3', null, 'GROUPS'));
      program.groups.forEach(function (group) {
        var item = programBox.appendChild(el('div', { class: 'wb-program-group' }));
        item.appendChild(el('div', { class: 'wb-id' }, group.id));
        row(item, 'ROLE', group.role);
        row(item, 'ANCHORS', group.anchors.join(', '));
        row(item, 'ACTIVITIES', group.activities.join(', '));
        row(item, 'VISUAL', group.visual);
      });
      if (program.contributions && program.contributions.length) {
        programBox.appendChild(el('h3', null, 'CONTRIBUTIONS'));
        program.contributions.forEach(function (item) {
          row(programBox, item.anchor + ' · ' + item.contributesTo.join(', '), item.reason);
        });
      }
      if (program.relationships && program.relationships.length) {
        programBox.appendChild(el('h3', null, 'RELATIONSHIPS'));
        program.relationships.forEach(function (item) {
          row(programBox, item.from + ' ' + item.kind + ' ' + item.to, item.reason);
        });
      }
      if (program.residue && program.residue.ambient.length) {
        programBox.appendChild(el('h3', null, 'AMBIENT RESIDUE'));
        program.residue.ambient.forEach(function (item) {
          row(programBox, item.anchor + ' · ' + item.detail, item.reason);
        });
      }
    }

    function renderCreate() {
      var c = ui.creating;
      insp.appendChild(el('h2', null, 'NEW CONNECTION'));
      var box = insp.appendChild(el('div', { id: 'wb-create' }));
      var step = { a: 'click the TRIGGER tile in scene A (any scene)', b: 'switch scene if needed, click the tile in scene B', confirm: 'check direction, id and spawns, then CONFIRM' }[c.step];
      box.appendChild(el('div', { class: 'wb-hint', id: 'wb-create-step' }, (c.moving ? 'MOVE SPAWN ' + c.moving.toUpperCase() + ' · click a tile in ' + c[c.moving].scene : step)));
      function pickText(side) {
        var p = c[side];
        return p ? p.scene + ' @ ' + p.tx + ',' + p.ty : '—';
      }
      row(box, 'A (trigger)', pickText('a'));
      row(box, 'B (' + (c.oneWay ? 'arrival' : 'trigger') + ')', pickText('b'));
      var seg = el('span', { class: 'wb-seg', id: 'wb-create-direction' });
      var pBtn = seg.appendChild(el('button', { 'data-action': 'create-paired', class: c.oneWay ? '' : 'on' }, 'PAIRED'));
      var oBtn = seg.appendChild(el('button', { 'data-action': 'create-one-way', class: c.oneWay ? 'on' : '' }, 'ONE-WAY'));
      pBtn.addEventListener('click', function () { c.oneWay = false; render(); });
      oBtn.addEventListener('click', function () { c.oneWay = true; if (c.moving === 'a') c.moving = null; render(); });
      row(box, 'DIRECTION', seg);
      var idIn = el('input', { type: 'text', id: 'wb-create-id', spellcheck: 'false', value: c.id });
      row(box, 'ID', idIn);
      var cand = candidate();
      ['a', 'b'].forEach(function (side) {
        if (!cand) return;
        var sp = cand[side].spawn;
        var v = el('span', { class: 'wb-inline' });
        v.appendChild(el('span', { id: 'wb-create-spawn-' + side }, sp ? sp.tx + ',' + sp.ty + ' ' + sp.dir : '— (one-way source)'));
        if (sp) {
          var mv = v.appendChild(el('button', { 'data-action': 'create-move-spawn-' + side, class: c.moving === side ? 'on' : '' }, 'MOVE SPAWN'));
          mv.addEventListener('click', function () {
            guard(function () { setScene(c[side].scene); c.moving = side; });
          });
        }
        row(box, 'SPAWN ' + side.toUpperCase(), v);
      });
      var errBox = box.appendChild(el('ul', { id: 'wb-create-errors' }));
      var acts = box.appendChild(el('div', { class: 'wb-actions' }));
      var confirmBtn = button(acts, 'CONFIRM', 'create-confirm', function () {
        guard(function () {
          var rec = candidate();
          var errs = candidateErrors();
          if (errs.length) throw new Error('NEW CONNECTION invalid: ' + errs.join('; '));
          commit(E.createConnection(store, draft(), rec, vctx), 'create ' + rec.id);
          ui.creating = null;
          setScene(rec.a.scene);
          ui.selectedId = E.isOneWay(rec) ? ID.triggerId(rec.id, 'a', 0) : ID.endpointId(rec.id, 'a');
          ui.notice = { level: 'info', text: 'Created ' + rec.id + ' in the draft (export to apply).' };
        });
      }, { cls: 'wb-primary' });
      button(acts, 'CANCEL', 'create-cancel', function () { ui.creating = null; render(); });
      function refreshErrors() {
        errBox.textContent = '';
        var errs = candidateErrors();
        errs.forEach(function (e) { errBox.appendChild(el('li', { class: 'wb-error' }, e)); });
        if (!errs.length && cand) errBox.appendChild(el('li', { class: 'wb-ok', id: 'wb-create-valid' }, '✓ valid'));
        confirmBtn.disabled = errs.length > 0;
      }
      idIn.addEventListener('input', function () {
        c.id = idIn.value; c.idEdited = true;
        refreshErrors();
        drawCanvas(model.scenes[ui.sceneId], items(), allErrors());
      });
      refreshErrors();
    }

    function renderConvert() {
      var cv = ui.converting;
      var rec = draft()[cv.connId];
      insp.appendChild(el('h2', null, cv.to === 'one-way' ? 'CONVERT TO ONE-WAY' : 'CONVERT TO PAIRED'));
      var box = insp.appendChild(el('div', { id: 'wb-convert' }));
      row(box, 'CONNECTION', cv.connId);
      var res = conversion();
      if (cv.to === 'one-way') {
        box.appendChild(el('div', { class: 'wb-hint' }, 'The source keeps its triggers; the arrival keeps its spawn and loses its triggers.'));
        var seg = el('span', { class: 'wb-seg', id: 'wb-convert-source' });
        ['a', 'b'].forEach(function (sd) {
          var b = seg.appendChild(el('button', { 'data-action': 'convert-source-' + sd, class: cv.source === sd ? 'on' : '' },
            sd.toUpperCase() + ' · ' + rec[sd].scene + ' (' + (rec[sd].triggers || []).length + ' trigger' + ((rec[sd].triggers || []).length === 1 ? '' : 's') + ')'));
          b.addEventListener('click', function () { cv.source = sd; render(); });
        });
        row(box, 'SOURCE', seg);
        var drop = box.appendChild(el('ul', { id: 'wb-convert-dropped' }));
        (res.dropped || []).forEach(function (t) { drop.appendChild(el('li', { class: 'wb-warn' }, 'drops ' + t)); });
      } else {
        box.appendChild(el('div', { class: 'wb-hint', id: 'wb-convert-step' },
          cv.placing === 'aSpawn' ? 'click the a.spawn tile in ' + rec.a.scene : cv.placing === 'bTrigger' ? 'click the b trigger tile in ' + rec.b.scene
            : 'Place the missing a.spawn and b trigger, then CONFIRM.'));
        var sp = el('span', { class: 'wb-inline' });
        sp.appendChild(el('span', { id: 'wb-convert-a-spawn' }, cv.aSpawn ? rec.a.scene + ' ' + cv.aSpawn.tx + ',' + cv.aSpawn.ty : '— not placed'));
        button(sp, 'PLACE A SPAWN', 'convert-place-a-spawn', function () { guard(function () { setScene(rec.a.scene); cv.placing = 'aSpawn'; }); }, { cls: cv.placing === 'aSpawn' ? 'on' : '' });
        row(box, 'A SPAWN', sp);
        var face = el('select', { id: 'wb-convert-facing' });
        E.FACINGS.forEach(function (f) { var o = face.appendChild(el('option', { value: f }, f)); if (f === cv.facing) o.selected = true; });
        face.addEventListener('change', function () { cv.facing = face.value; render(); });
        row(box, 'A FACING', face);
        var tr = el('span', { class: 'wb-inline' });
        tr.appendChild(el('span', { id: 'wb-convert-b-trigger' }, cv.bTrigger ? rec.b.scene + ' ' + cv.bTrigger[0] + ',' + cv.bTrigger[1] : '— not placed'));
        button(tr, 'PLACE B TRIGGER', 'convert-place-b-trigger', function () { guard(function () { setScene(rec.b.scene); cv.placing = 'bTrigger'; }); }, { cls: cv.placing === 'bTrigger' ? 'on' : '' });
        row(box, 'B TRIGGER', tr);
      }
      var errBox = box.appendChild(el('ul', { id: 'wb-convert-errors' }));
      res.errors.forEach(function (e) { errBox.appendChild(el('li', { class: 'wb-error' }, e)); });
      if (!res.errors.length && res.record) errBox.appendChild(el('li', { class: 'wb-ok', id: 'wb-convert-valid' }, '✓ valid'));
      var acts = box.appendChild(el('div', { class: 'wb-actions' }));
      button(acts, 'CONFIRM', 'convert-confirm', function () {
        guard(function () {
          var r = conversion();
          if (!r.record || r.errors.length) throw new Error('conversion invalid: ' + r.errors.join('; '));
          var next = cv.to === 'one-way' ? E.toOneWay(draft(), cv.connId, cv.source ? { source: cv.source } : {})
            : E.toPaired(draft(), cv.connId, { aSpawn: { tx: cv.aSpawn.tx, ty: cv.aSpawn.ty, dir: cv.facing }, bTrigger: cv.bTrigger });
          commit(next, 'to ' + cv.to + ' ' + cv.connId);
          ui.converting = null;
          ui.selectedId = ID.endpointId(r.record.id, 'a');
          setScene(r.record.a.scene);
          ui.notice = { level: 'info', text: cv.connId + ' is now ' + cv.to + ' in the draft (export to apply).' };
        });
      }, { cls: 'wb-primary', disabled: !res.record || res.errors.length > 0 });
      button(acts, 'CANCEL', 'convert-cancel', function () { ui.converting = null; render(); });
    }

    function renderDoor(parent, rec, ref, ep, editing) {
      if (!(ep.triggers || []).length) {
        row(parent, 'DOOR', el('span', { class: 'wb-muted', id: 'wb-door-none' }, '— (no trigger on this endpoint)'));
        return;
      }
      var door = ep.door || {};
      if (!editing) {
        row(parent, 'DOOR', el('span', { id: 'wb-door' }, Object.keys(door).length ? E.DOOR_KEYS.filter(function (k) { return door[k] !== undefined; }).map(function (k) { return k + '=' + door[k]; }).join(' · ') : 'ungated'));
        return;
      }
      E.DOOR_KEYS.forEach(function (key) {
        var input = el('input', key === 'needsClues' ? { type: 'number', step: '1', min: '1', id: 'wb-door-' + key, placeholder: '(none)' }
          : { type: 'text', spellcheck: 'false', id: 'wb-door-' + key, placeholder: '(none)' });
        input.value = door[key] === undefined ? '' : String(door[key]);
        input.addEventListener('change', function () {
          var v = input.value.trim();
          guard(function () { commit(E.setDoorField(draft(), ref.connId, ref.side, key, v === '' ? null : (key === 'needsClues' ? Number(v) : v)), 'door ' + key); });
        });
        row(parent, 'DOOR ' + key, input);
      });
    }

    function renderInspector(list) {
      insp.textContent = '';
      if (ui.creating) { renderCreate(); return; }
      if (ui.converting) { renderConvert(); return; }
      if (ui.newObject) { renderNewObject(); return; }
      if (ui.newInteract) { renderNewInteract(); return; }
      insp.appendChild(el('h2', null, 'INSPECTOR'));
      if (!ui.selectedId) { insp.appendChild(el('div', { class: 'wb-muted' }, 'Click a marker on the canvas.')); return; }
      var it = Core.findItem(list, ui.selectedId);
      var ref = selectedRef();
      insp.appendChild(el('div', { class: 'wb-id', id: 'wb-selected-id' }, ui.selectedId));
      renderStack(list);
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
        row(insp, 'DRAFT', E.isCreated(store, draft(), ref.connId) ? 'new (create)' : changed ? 'modified (' + E.changedEndpoints(store, draft(), ref.connId).join(', ') + ')' : 'unchanged');

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
        pairBox.appendChild(el('span', null, pair ? otherSide + ' · ' + pair.scene + ' @ ' + (pair.spawn ? pair.spawn.tx + ',' + pair.spawn.ty + ' ' + pair.spawn.dir : (oneWay ? 'no spawn (one-way source)' : '?')) : '—'));
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
        renderDoor(insp, rec, ref, ep, editing);

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
          if (oneWay) {
            button(acts, 'CONVERT TO PAIRED', 'convert-paired', function () {
              ui.pending = null; ui.confirmDelete = null;
              var sa = model.scenes[rec.a.scene], t0 = rec.a.triggers[0];
              ui.converting = { connId: ref.connId, to: 'paired', source: null, aSpawn: null, bTrigger: null, placing: null,
                facing: t0 && sa ? E.interiorFacing(t0[0], t0[1], sa.width, sa.height) : 'down' };
              render();
            });
          } else {
            button(acts, 'CONVERT TO ONE-WAY', 'convert-one-way', function () {
              ui.pending = null; ui.confirmDelete = null;
              ui.converting = { connId: ref.connId, to: 'one-way', source: null, aSpawn: null, bTrigger: null, placing: null, facing: null };
              render();
            });
          }
          button(acts, 'DELETE CONNECTION', 'delete-connection', function () {
            ui.pending = null; ui.confirmDelete = ref.connId; render();
          }, { cls: 'wb-danger' });
          if (ui.confirmDelete === ref.connId) {
            var conf = insp.appendChild(el('div', { class: 'wb-warn', id: 'wb-delete-confirm' }));
            conf.appendChild(el('div', null, 'Delete ' + ref.connId + '? Both endpoints (' + rec.a.scene + ' and ' + rec.b.scene +
              ') leave the draft. tools/world-apply.js removes the id from the catalog and refuses ids still referenced in js/ test/ narrative/.'));
            var ca = conf.appendChild(el('div', { class: 'wb-actions' }));
            button(ca, 'CONFIRM DELETE', 'delete-confirm', function () {
              guard(function () {
                var id = ui.confirmDelete;
                commit(E.deleteConnection(store, draft(), id), 'delete ' + id);
                ui.confirmDelete = null; ui.selectedId = null;
                ui.notice = { level: 'info', text: 'Deleted ' + id + ' from the draft (export to apply).' };
              });
            }, { cls: 'wb-danger' });
            button(ca, 'CANCEL', 'delete-cancel', function () { ui.confirmDelete = null; render(); });
          }
          if (ui.pending) insp.appendChild(el('div', { class: 'wb-hint' }, 'Esc cancels. Tiles snap to integers.'));
        }
        return;
      }

      if (!it) return;
      if (it.kind === 'npc') { renderNpc(it); return; }
      if (it.kind === 'object' && it.entry) { renderSceneObject(it); return; }
      row(insp, 'KIND', it.kind + (it.readOnly ? ' (read-only)' : ''));
      row(insp, 'SCENE', it.scene);
      if (it.kind === 'legacy-door') {
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

    // ON THIS TILE: every item covering the last clicked tile, so a stacked entry (the town welcome sign under its
    // cartello interact key) stays selectable.
    function renderStack(list) {
      var st = ui.stackTile;
      if (!st || st.scene !== ui.sceneId) return;
      var here = list.filter(function (x) { return Ed.hitTest.covers(x, st.tx, st.ty); });
      if (here.length < 2) return;
      var chips = el('div', { class: 'wb-triggers', id: 'wb-stack' });
      here.slice().reverse().forEach(function (x) {
        var b = chips.appendChild(el('button', { class: 'wb-chip' + (x.id === ui.selectedId ? ' on' : ''), 'data-stack': x.id }, x.id));
        b.addEventListener('click', function () { ui.selectedId = x.id; ui.pending = null; ui.confirmObjectDelete = null; render(); });
      });
      row(insp, 'ON THIS TILE', chips);
    }

    function renderSceneObject(it) {
      var ent = objectEntry(it), isObj = it.entry === 'object';
      var created = !ent.base, changed = JSON.stringify(ent.base) !== JSON.stringify(ent.now);
      var editing = ui.mode === 'edit';
      row(insp, 'KIND', isObj ? 'object (world/scene-objects.json)' : 'interact key (world/scene-objects.json)');
      row(insp, 'SCENE', it.scene);
      if (isObj) {
        row(insp, 'SOURCE ID', it.sourceId);
        row(insp, 'TYPE', (it.type || '—') + (it.subkind ? ' / ' + it.subkind : ''));
      } else {
        row(insp, 'INTERACT ID', it.interactId);
        row(insp, 'KEY', created ? '(new)' : '"' + it.ref + '" in the registry');
        row(insp, 'SPARKLE', it.type === 'sparkle' ? 'yes' : 'no');
      }
      row(insp, 'TILE', el('span', { id: 'wb-obj-tile' }, it.tx + ',' + it.ty));
      if (isObj) row(insp, 'SIZE', el('span', { id: 'wb-obj-size' }, it.rect ? it.w + '×' + it.h : 'single tile'));
      var cascade = typeof it.dialogue !== 'string';
      row(insp, 'DIALOGUE', el('span', { id: 'wb-obj-dialogue' }, (cascade ? JSON.stringify(it.dialogue) + '  (cascade: conditions are hand-edited)' : it.dialogue)));
      var was = ent.base ? ent.base.x + ',' + ent.base.y + (ent.base.w !== undefined ? ' ' + ent.base.w + '×' + ent.base.h : '') : '';
      row(insp, 'DRAFT', el('span', { id: 'wb-obj-draft' }, created ? 'new (create)' : changed ? 'changed (was ' + was + ')' : 'unchanged'));
      var refs = objectRefs(it);
      row(insp, 'MISSION REFS', el('span', { id: 'wb-obj-refs' }, refs.length ? refs.map(function (r) { return r.mission + ' ' + r.node + ' (' + r.id + ')'; }).join(', ') : 'none'));
      if (!editing) return;

      var acts = insp.appendChild(el('div', { class: 'wb-actions' }));
      var pend = ui.pending && ui.pending.action === 'move-object' && ui.pending.itemId === it.id;
      button(acts, pend ? 'MOVE · click a tile…' : 'MOVE', 'move-object', function () {
        ui.pending = { action: 'move-object', itemId: it.id, scene: it.scene, entry: it.entry, sourceId: it.sourceId, ref: it.ref };
        ui.confirmObjectDelete = null; render();
      }, { cls: pend ? 'on' : '' });
      button(acts, 'REVERT', 'revert-object', function () {
        guard(function () {
          commitObjects(S.revertEntry(objStore, objDraft(), it.scene, isObj ? { sourceId: it.sourceId } : { ref: it.ref }), 'revert ' + it.id);
          ui.pending = null;
          if (created) ui.selectedId = null;
        });
      }, { disabled: !changed });
      button(acts, 'DELETE', 'delete-object', function () {
        ui.pending = null; ui.confirmObjectDelete = it.id; render();
      }, { cls: 'wb-danger', disabled: refs.length > 0 });
      if (isObj && it.rect) {
        var wh = el('span', { class: 'wb-inline' });
        var inW = wh.appendChild(el('input', { type: 'number', step: '1', min: '1', id: 'wb-obj-w', value: it.w }));
        var inH = wh.appendChild(el('input', { type: 'number', step: '1', min: '1', id: 'wb-obj-h', value: it.h }));
        [inW, inH].forEach(function (input) {
          input.addEventListener('change', function () {
            guard(function () { commitObjects(S.resizeObject(objDraft(), it.scene, it.sourceId, inW.value, inH.value), 'resize ' + it.sourceId); });
          });
        });
        row(insp, 'RESIZE w/h', wh);
      }
      if (refs.length) {
        insp.appendChild(el('div', { class: 'wb-warn', id: 'wb-obj-delete-refused' }, 'DELETE refused: ' + refs.map(function (r) { return r.mission + ' node ' + r.node; }).join(', ') +
          ' reference' + (refs.length === 1 ? 's' : '') + ' "' + refs[0].id + '". Remove the mission reference under narrative/ first; tools/world-apply.js refuses the same delete.'));
      }
      if (ui.confirmObjectDelete === it.id) {
        var conf = insp.appendChild(el('div', { class: 'wb-warn', id: 'wb-obj-delete-confirm' }));
        conf.appendChild(el('div', null, 'Delete ' + (isObj ? 'object ' + it.sourceId : 'interact key ' + it.tx + ',' + it.ty + ' (' + it.interactId + ')') + ' from ' + it.scene + '?'));
        var ca = conf.appendChild(el('div', { class: 'wb-actions' }));
        button(ca, 'CONFIRM DELETE', 'delete-object-confirm', function () {
          guard(function () {
            commitObjects(isObj ? S.deleteObject(objDraft(), it.scene, it.sourceId) : S.deleteInteract(objDraft(), it.scene, it.ref), 'delete ' + it.id);
            ui.confirmObjectDelete = null; ui.selectedId = null;
            ui.notice = { level: 'info', text: 'Deleted ' + it.id + ' from the draft (export to apply).' };
          });
        }, { cls: 'wb-danger' });
        button(ca, 'CANCEL', 'delete-object-cancel', function () { ui.confirmObjectDelete = null; render(); });
      }
      if (pend) insp.appendChild(el('div', { class: 'wb-hint' }, 'Click the new ' + (it.rect ? 'origin (top-left) ' : '') + 'tile. Esc cancels.'));
    }

    function renderNewPanel(kindLabel, n, plan, fields, onConfirm, prefix) {
      insp.appendChild(el('h2', null, kindLabel));
      var box = insp.appendChild(el('div', { id: 'wb-' + prefix }));
      box.appendChild(el('div', { class: 'wb-hint', id: 'wb-' + prefix + '-step' }, n.placing ? 'click the ' + (prefix === 'new-object' ? 'origin ' : '') + 'tile in ' + n.scene : 'check the fields, then CONFIRM'));
      row(box, 'SCENE', n.scene);
      fields(box);
      var tile = el('span', { class: 'wb-inline' });
      tile.appendChild(el('span', { id: 'wb-' + prefix + '-tile' }, n.tile ? n.tile.tx + ',' + n.tile.ty : '— not picked'));
      button(tile, 'PICK TILE', prefix + '-pick', function () { n.placing = true; render(); }, { cls: n.placing ? 'on' : '' });
      row(box, 'TILE', tile);
      var errBox = box.appendChild(el('ul', { id: 'wb-' + prefix + '-errors' }));
      var acts = box.appendChild(el('div', { class: 'wb-actions' }));
      var confirmBtn = button(acts, 'CONFIRM', prefix + '-confirm', function () { guard(onConfirm); }, { cls: 'wb-primary' });
      button(acts, 'CANCEL', prefix + '-cancel', function () { ui.newObject = null; ui.newInteract = null; render(); });
      function refresh() {
        var p = plan();
        errBox.textContent = '';
        p.errors.forEach(function (e) { errBox.appendChild(el('li', { class: 'wb-error' }, e)); });
        if (!p.errors.length && p.draft) errBox.appendChild(el('li', { class: 'wb-ok', id: 'wb-' + prefix + '-valid' }, '✓ valid'));
        confirmBtn.disabled = !p.draft || p.errors.length > 0;
      }
      refresh();
      return refresh;
    }

    function renderNewObject() {
      var n = ui.newObject, refresh = null;
      refresh = renderNewPanel('NEW OBJECT', n, newObjectPlan, function (box) {
        var kindSel = el('select', { id: 'wb-new-object-kind' });
        S.kinds(objStore).forEach(function (k) { var o = kindSel.appendChild(el('option', { value: k.kind }, k.kind + ' (' + k.type + ')')); if (k.kind === n.kind) o.selected = true; });
        kindSel.addEventListener('change', function () {
          n.kind = kindSel.value;
          if (!n.sourceIdEdited) n.sourceId = S.suggestSourceId(objDraft(), n.scene, n.kind);
          render();
        });
        row(box, 'KIND', kindSel);
        var idIn = el('input', { type: 'text', spellcheck: 'false', id: 'wb-new-object-id', value: n.sourceId });
        idIn.addEventListener('input', function () { n.sourceId = idIn.value; n.sourceIdEdited = true; if (refresh) refresh(); });
        row(box, 'SOURCE ID', idIn);
        var dlgIn = el('input', { type: 'text', spellcheck: 'false', id: 'wb-new-object-dialogue', value: n.dialogue, placeholder: 'dialogue id in js/data.js' });
        dlgIn.addEventListener('input', function () { n.dialogue = dlgIn.value.trim(); if (refresh) refresh(); });
        row(box, 'DIALOGUE', dlgIn);
        var wh = el('span', { class: 'wb-inline' });
        var inW = wh.appendChild(el('input', { type: 'number', step: '1', min: '1', id: 'wb-new-object-w', value: n.w }));
        var inH = wh.appendChild(el('input', { type: 'number', step: '1', min: '1', id: 'wb-new-object-h', value: n.h }));
        [inW, inH].forEach(function (input) { input.addEventListener('change', function () { n.w = inW.value; n.h = inH.value; render(); }); });
        row(box, 'SIZE w/h', wh);
        box.appendChild(el('div', { class: 'wb-muted' }, 'One dialogue id; cascades with conditions are hand-edited in world/scene-objects.json.'));
      }, function () {
        var p = newObjectPlan();
        if (!p.draft || p.errors.length) throw new Error('NEW OBJECT invalid: ' + p.errors.join('; '));
        commitObjects(p.draft, 'create ' + n.sourceId);
        ui.selectedId = ID.objectId(n.scene, n.sourceId);
        ui.stackTile = { scene: n.scene, tx: n.tile.tx, ty: n.tile.ty };
        ui.newObject = null;
        ui.notice = { level: 'info', text: 'Created object ' + n.sourceId + ' in ' + n.scene + ' (export to apply).' };
      }, 'new-object');
    }

    function renderNewInteract() {
      var n = ui.newInteract;
      renderNewPanel('NEW INTERACT', n, newInteractPlan, function (box) {
        var idSel = el('select', { id: 'wb-new-interact-id' });
        octx.interactIds().forEach(function (k) {
          var d = octx.resolveInteract(k);
          var o = idSel.appendChild(el('option', { value: k }, k + ' → ' + (typeof d === 'string' ? d : 'cascade') + (octx.isSparkle(k) ? ' ✦' : '')));
          if (k === n.id) o.selected = true;
        });
        idSel.addEventListener('change', function () { n.id = idSel.value; render(); });
        row(box, 'INTERACT ID', idSel);
        box.appendChild(el('div', { class: 'wb-muted' }, 'Ids come from glue\'s INTERACT_DLG table (js/glue.js); a new id needs a hand edit there first.'));
      }, function () {
        var p = newInteractPlan();
        if (!p.draft || p.errors.length) throw new Error('NEW INTERACT invalid: ' + p.errors.join('; '));
        commitObjects(p.draft, 'create interact ' + n.id);
        ui.selectedId = ID.objectId(n.scene, S.interactItemKey(p.ref));
        ui.stackTile = { scene: n.scene, tx: n.tile.tx, ty: n.tile.ty };
        ui.newInteract = null;
        ui.notice = { level: 'info', text: 'Created interact key ' + n.tile.tx + ',' + n.tile.ty + ' = ' + n.id + ' in ' + n.scene + ' (export to apply).' };
      }, 'new-interact');
    }

    function renderNpc(it) {
      var body = castBody(it.characterId);
      var ref = bodyRef(body);
      var editing = ui.mode === 'edit' && !!ref;
      row(insp, 'KIND', 'npc' + (editing ? ' (PLACED body)' : ' (read-only)'));
      row(insp, 'SCENE', it.scene);
      row(insp, 'CHARACTER', it.characterId);
      row(insp, 'NAME', it.name);
      row(insp, 'TILE', it.tx + ',' + it.ty);
      row(insp, 'FACING', it.dir);
      row(insp, 'MOMENT', ui.momentKey === 'baseline' ? 'baseline cast' : 'story moment ' + ui.momentKey);
      row(insp, 'SOURCE', el('span', { id: 'wb-npc-source' }, !body ? '—' : body.source === 'BASELINE' ? 'baseline' + (body.owner ? ' (' + body.owner + ')' : '')
        : 'window ' + body.source + (body.owner ? ' · owner ' + body.owner : '')));
      if (!ref) {
        if (ui.mode === 'edit') insp.appendChild(el('div', { class: 'wb-muted' }, 'Not a registry cast body: not editable here.'));
        return;
      }
      var entry = castDraft()[C.key(ref.window, ref.character)];
      var changed = !!castStore.base[C.key(ref.window, ref.character)] && JSON.stringify(castStore.base[C.key(ref.window, ref.character)]) !== JSON.stringify(entry);
      row(insp, 'DRAFT', changed ? 'moved (was ' + castStore.base[C.key(ref.window, ref.character)].map_id + ' ' + castStore.base[C.key(ref.window, ref.character)].x + ',' + castStore.base[C.key(ref.window, ref.character)].y + ' ' + castStore.base[C.key(ref.window, ref.character)].dir + ')' : 'unchanged');
      if (!editing) return;
      var twins = C.sameWhenConflicts(castStore.data, ref.window, ref.character);
      var acts = insp.appendChild(el('div', { class: 'wb-actions' }));
      var pend = ui.pending && ui.pending.action === 'move-npc' && ui.pending.character === ref.character;
      button(acts, pend ? 'MOVE · click a tile…' : 'MOVE', 'move-npc', function () {
        ui.pending = { action: 'move-npc', character: ref.character, window: ref.window, sceneId: it.scene }; ui.confirmDelete = null; render();
      }, { cls: pend ? 'on' : '', disabled: twins.length > 0 });
      button(acts, 'REVERT BODY', 'revert-npc', function () {
        guard(function () { commitCast(C.revertBody(castStore, castDraft(), ref.window, ref.character), 'revert ' + ref.character); ui.pending = null; });
      }, { disabled: !changed });
      if (twins.length) {
        insp.appendChild(el('div', { class: 'wb-warn', id: 'wb-npc-refused' }, 'MOVE refused: ' + ref.character + ' is placed by ' + ref.window +
          ' and, under the same `when`, elsewhere by ' + twins.join(', ') + '. Fix the overlap in narrative/cast/windows.json first (V2).'));
      }
      insp.appendChild(el('div', { class: 'wb-hint', id: 'wb-npc-hint' }, 'Arrow keys set the facing. Only map/x/y/facing move here; windows, when, status and dialogue stay hand-authored (docs/cast-presence-authoring.md).'));
    }

    function renderValidation(errs) {
      valBox.textContent = '';
      valBox.appendChild(el('h2', null, 'VALIDATION'));
      var ids = Object.keys(errs);
      var changed = E.changedIds(store, draft());
      var castOps = castOpsList();
      var objOps = objectOpsList();
      if (!changed.length && !castOps.length && !objOps.length) { valBox.appendChild(el('div', { class: 'wb-muted' }, 'No drafts.')); return; }
      var opsBox = valBox.appendChild(el('ul', { id: 'wb-draft-ops' }));
      draftOps().forEach(function (o) { opsBox.appendChild(el('li', { class: 'wb-op wb-op-' + o.op, 'data-op': o.op }, o.op + ' ' + o.id)); });
      castOps.forEach(function (o) { opsBox.appendChild(el('li', { class: 'wb-op wb-op-place', 'data-op': 'place' }, 'place ' + o.window + ' / ' + o.character + ' → ' + o.map_id + ' ' + o.x + ',' + o.y + ' ' + o.dir)); });
      objOps.forEach(function (o) {
        var what = o.sourceId !== undefined
          ? ' object ' + o.sourceId + (o.object ? ' → ' + o.object.x + ',' + o.object.y + (o.object.w !== undefined ? ' ' + o.object.w + '×' + o.object.h : '') : '')
          : ' interact ' + o.interact + (o.to ? ' → ' + o.to : o.id ? ' = ' + o.id : '');
        opsBox.appendChild(el('li', { class: 'wb-op wb-op-' + o.op, 'data-op': o.op }, o.op + ' ' + o.scene + what));
      });
      if (!ids.length) { valBox.appendChild(el('div', { class: 'wb-ok', id: 'wb-valid' }, '✓ ' + (changed.length + castOps.length + objOps.length) + ' draft(s) valid')); return; }
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
      var castOps = castOpsList();
      var out = exportObject() || cs;
      exportBox.appendChild(el('div', { class: 'wb-muted', id: 'wb-export-summary' },
        cs.operations.length + ' changed connection(s), ' + castOps.length + ' cast placement(s), ' + objectOpsList().length + ' scene object change(s)' + (out.format === C.BUNDLE_FORMAT ? ' (bundle)' : '') +
        '. Save as a file, then: node tools/world-apply.js <file> --dry-run' + (castOps.length ? ' (add --repin if V5 pins must follow)' : '')));
      var ta = exportBox.appendChild(el('textarea', { id: 'wb-export-text', readonly: 'readonly', spellcheck: 'false' }));
      ta.value = JSON.stringify(out, null, 2) + '\n';
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
      var n = unsavedCount();
      title.textContent = 'WORLD BUILDER · ' + n + ' unsaved change' + (n === 1 ? '' : 's');
      modeBadge.textContent = ui.mode === 'edit' ? 'EDIT' : 'VIEW';
      modeBadge.className = ui.mode === 'edit' ? 'edit' : 'view';
      viewBtn.className = ui.mode === 'view' ? 'on' : '';
      editBtn.className = ui.mode === 'edit' ? 'on' : '';
      undoBtn.disabled = !H.canUndo(hist);
      redoBtn.disabled = !H.canRedo(hist);
      newBtn.disabled = ui.mode !== 'edit';
      newBtn.className = ui.creating ? 'on' : '';
      newObjBtn.disabled = ui.mode !== 'edit' || !objStore.base[ui.sceneId];
      newObjBtn.className = ui.newObject ? 'on' : '';
      newObjBtn.title = objStore.base[ui.sceneId] ? '' : ui.sceneId + ' has no entry in world/scene-objects.json';
      newIntBtn.disabled = newObjBtn.disabled;
      newIntBtn.className = ui.newInteract ? 'on' : '';
      newIntBtn.title = newObjBtn.title;
      revertAllBtn.disabled = ui.mode !== 'edit' || n === 0;
      exportBtn.disabled = ui.mode !== 'edit';
      if (sceneSel.value !== ui.sceneId) sceneSel.value = ui.sceneId;
      if (momentSel.value !== ui.momentKey) momentSel.value = ui.momentKey;
      canvas.style.cursor = ui.pending || (ui.creating && (ui.creating.step !== 'confirm' || ui.creating.moving)) || (ui.converting && ui.converting.placing) || placingObject() ? 'crosshair' : 'pointer';

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
      renderProgram();
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
      if (!ui.pending && !(ui.creating && (ui.creating.step !== 'confirm' || ui.creating.moving)) && !(ui.converting && ui.converting.placing) && !placingObject()) return;
      var t = tileFromEvent(ev);
      if (!t || (ui.hover && ui.hover.tx === t.tx && ui.hover.ty === t.ty)) return;
      ui.hover = t;
      render();
    });

    canvas.addEventListener('click', function (ev) {
      var t = tileFromEvent(ev);
      if (!t) return;
      var p = ui.pending;
      var c = ui.creating;
      var cv = ui.converting;
      var no = ui.newObject || ui.newInteract;
      if (no && no.placing) {
        guard(function () {
          if (ui.sceneId !== no.scene) throw new Error((ui.newObject ? 'NEW OBJECT' : 'NEW INTERACT') + ' belongs to ' + no.scene + ' — switch back to that scene');
          no.tile = { tx: t.tx, ty: t.ty };
          no.placing = false;
          ui.hover = null;
        });
        return;
      }
      if (cv) {
        guard(function () {
          if (!cv.placing) return;
          var crec = draft()[cv.connId];
          var sceneFor = cv.placing === 'aSpawn' ? crec.a.scene : crec.b.scene;
          if (ui.sceneId !== sceneFor) throw new Error((cv.placing === 'aSpawn' ? 'a.spawn' : 'the b trigger') + ' belongs to ' + sceneFor + ' — switch to that scene first');
          if (cv.placing === 'aSpawn') cv.aSpawn = { tx: t.tx, ty: t.ty };
          else cv.bTrigger = [t.tx, t.ty];
          cv.placing = null;
          ui.hover = null;
        });
        return;
      }
      if (c) {
        guard(function () {
          if (c.moving) {
            var side = c.moving;
            if (c[side].scene !== ui.sceneId) throw new Error('spawn ' + side + ' belongs to ' + c[side].scene + ' — switch to that scene first');
            var cur = candidate()[side].spawn;
            c.spawn[side] = { tx: t.tx, ty: t.ty, dir: cur.dir };
            c.moving = null;
          } else if (c.step === 'a') {
            c.a = { scene: ui.sceneId, tx: t.tx, ty: t.ty };
            c.step = 'b';
          } else if (c.step === 'b') {
            c.b = { scene: ui.sceneId, tx: t.tx, ty: t.ty };
            c.step = 'confirm';
            if (!c.idEdited) c.id = E.suggestId(c.a.scene, c.b.scene);
          }
          ui.hover = null;
        });
        return;
      }
      if (!p) {
        var hit = Core.itemAt(items(), t.tx, t.ty);
        ui.selectedId = hit ? hit.id : null;
        ui.stackTile = { scene: ui.sceneId, tx: t.tx, ty: t.ty };
        ui.confirmObjectDelete = null;
        ui.notice = null;
        render();
        return;
      }
      guard(function () {
        if (p.action === 'move-object') {
          if (ui.sceneId !== p.scene) { ui.pending = null; throw new Error('MOVE keeps ' + p.itemId + ' on ' + p.scene + ' — switch back to that scene'); }
          if (p.entry === 'object') commitObjects(S.moveObject(objDraft(), p.scene, p.sourceId, t.tx, t.ty), 'move ' + p.sourceId);
          else commitObjects(S.moveInteract(objDraft(), p.scene, p.ref, t.tx, t.ty), 'move interact ' + p.ref);
          ui.selectedId = p.itemId;
          ui.stackTile = { scene: p.scene, tx: t.tx, ty: t.ty };
          ui.notice = { level: 'info', text: 'Moved ' + p.itemId + ' to ' + t.tx + ',' + t.ty + ' in the draft (export to apply).' };
        } else if (p.action === 'move-npc') {
          if (ui.sceneId !== p.sceneId) { ui.pending = null; throw new Error('MOVE keeps ' + p.character + ' on ' + p.sceneId + ' — switch back to that scene'); }
          var errs = C.placementErrors(cctx, { map_id: ui.sceneId, x: t.tx, y: t.ty }, occupantsAt(ui.sceneId, t.tx, t.ty, p.character));
          if (errs.length) { ui.pending = p; ui.hover = null; throw new Error('MOVE refused: ' + errs.join('; ')); }
          commitCast(C.placeBody(castStore, castDraft(), { window: p.window, character: p.character, map_id: ui.sceneId, x: t.tx, y: t.ty }), 'move ' + p.character);
          ui.selectedId = ID.npcId(p.character, ui.sceneId);
          ui.notice = { level: 'info', text: 'Moved ' + p.character + ' (' + p.window + ') to ' + ui.sceneId + ' ' + t.tx + ',' + t.ty + ' in the draft (export to apply).' };
        } else if (p.action === 'move-spawn') {
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
      guard(function () { setScene(sceneSel.value); ui.selectedId = null; ui.pending = null; ui.newObject = null; ui.newInteract = null; ui.confirmObjectDelete = null; ui.stackTile = null; });
    });
    momentSel.addEventListener('change', function () {
      guard(function () {
        var key = momentSel.value;
        ui.momentCast = key === 'baseline' ? null : WB.castForSeed(G, ui.moments[key]);
        ui.momentKey = key;
        ui.pending = null;
        var p = ui.selectedId && ID.parse(ui.selectedId);
        if (p && p.kind === ID.KINDS.NPC) ui.selectedId = null;
      });
    });
    viewBtn.addEventListener('click', function () { ui.mode = 'view'; ui.pending = null; ui.creating = null; ui.converting = null; ui.confirmDelete = null; ui.newObject = null; ui.newInteract = null; ui.confirmObjectDelete = null; ui.exportOpen = false; render(); });
    newObjBtn.addEventListener('click', function () {
      if (ui.mode !== 'edit' || !objStore.base[ui.sceneId]) return;
      ui.pending = null; ui.creating = null; ui.converting = null; ui.confirmDelete = null; ui.newInteract = null; ui.confirmObjectDelete = null; ui.selectedId = null; ui.exportOpen = false;
      var k = S.kinds(objStore)[0];
      ui.newObject = { scene: ui.sceneId, kind: k ? k.kind : '', sourceId: S.suggestSourceId(objDraft(), ui.sceneId, k && k.kind), sourceIdEdited: false,
        dialogue: '', w: '1', h: '1', tile: null, placing: true };
      render();
    });
    newIntBtn.addEventListener('click', function () {
      if (ui.mode !== 'edit' || !objStore.base[ui.sceneId]) return;
      ui.pending = null; ui.creating = null; ui.converting = null; ui.confirmDelete = null; ui.newObject = null; ui.confirmObjectDelete = null; ui.selectedId = null; ui.exportOpen = false;
      ui.newInteract = { scene: ui.sceneId, id: octx.interactIds()[0], tile: null, placing: true };
      render();
    });
    newBtn.addEventListener('click', function () {
      if (ui.mode !== 'edit') return;
      ui.pending = null; ui.confirmDelete = null; ui.converting = null; ui.selectedId = null; ui.exportOpen = false; ui.newObject = null; ui.newInteract = null; ui.confirmObjectDelete = null;
      ui.creating = { step: 'a', oneWay: false, a: null, b: null, id: '', idEdited: false, spawn: { a: null, b: null }, moving: null };
      render();
    });
    editBtn.addEventListener('click', function () { ui.mode = 'edit'; render(); });
    function undo() {
      if (!H.canUndo(hist)) return;
      hist = H.undo(hist);
      ui.pending = null; ui.confirmObjectDelete = null;
      var ref = selectedRef();
      if (ref && ref.kind === ID.KINDS.TRIGGER) {
        var ep = draft()[ref.connId] && draft()[ref.connId][ref.side];
        if (!ep || !ep.triggers[ref.index]) ui.selectedId = ID.endpointId(ref.connId, ref.side);
      }
      render();
    }
    undoBtn.addEventListener('click', undo);
    function redo() {
      if (!H.canRedo(hist)) return;
      hist = H.redo(hist);
      ui.pending = null; ui.confirmDelete = null;
      render();
    }
    redoBtn.addEventListener('click', redo);
    revertAllBtn.addEventListener('click', function () {
      guard(function () {
        var next = { conn: E.revertAll(store), cast: castStore ? castStore.base : null, objects: objStore.base };
        if (next.conn !== draft() || next.cast !== castDraft() || next.objects !== objDraft()) hist = H.commit(hist, next, { label: 'revert all' });
        ui.pending = null;
      });
    });
    exportBtn.addEventListener('click', function () { ui.exportOpen = true; render(); });
    document.addEventListener('keydown', function (ev) {
      var typing = ev.target && (ev.target.tagName === 'TEXTAREA' || ev.target.tagName === 'INPUT');
      if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'z' || ev.key === 'Z' || ev.key === 'y' || ev.key === 'Y')) {
        if (typing) return;
        ev.preventDefault();
        if (ev.shiftKey || ev.key === 'y' || ev.key === 'Y') redo(); else undo();
      } else if (C.arrowDir(ev.key) && !typing && ui.mode === 'edit' && ui.selectedId && !ui.creating && !ui.converting) {
        var sel = ID.parse(ui.selectedId);
        if (!sel || sel.kind !== ID.KINDS.NPC) return;
        var ref = bodyRef(castBody(sel.npcId));
        if (!ref) return;
        ev.preventDefault();
        guard(function () { commitCast(C.placeBody(castStore, castDraft(), { window: ref.window, character: ref.character, dir: C.arrowDir(ev.key) }), 'face ' + ev.key); });
      } else if (ev.key === 'Escape') {
        if (ui.pending) ui.pending = null;
        else if (ui.newObject && ui.newObject.placing && ui.newObject.tile) ui.newObject.placing = false;
        else if (ui.newObject) ui.newObject = null;
        else if (ui.newInteract && ui.newInteract.placing && ui.newInteract.tile) ui.newInteract.placing = false;
        else if (ui.newInteract) ui.newInteract = null;
        else if (ui.confirmObjectDelete) ui.confirmObjectDelete = null;
        else if (ui.converting && ui.converting.placing) ui.converting.placing = null;
        else if (ui.converting) ui.converting = null;
        else if (ui.creating && ui.creating.moving) ui.creating.moving = null;
        else if (ui.creating) ui.creating = null;
        else if (ui.confirmDelete) ui.confirmDelete = null;
        else return;
        ui.hover = null; render();
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
          momentKey: ui.momentKey, unsaved: unsavedCount(), changedIds: E.changedIds(store, draft()),
          errors: errs, exportOpen: ui.exportOpen, exportBlocked: ui.exportOpen && Object.keys(errs).length > 0,
          canUndo: H.canUndo(hist), canRedo: H.canRedo(hist), ops: draftOps(), confirmDelete: ui.confirmDelete,
          castOps: castOpsList(), pendingNpc: ui.pending && ui.pending.action === 'move-npc' ? { character: ui.pending.character, window: ui.pending.window } : null,
          npcs: list.filter(function (it) { return it.kind === 'npc'; }).map(function (it) {
            var b = castBody(it.characterId);
            return { characterId: it.characterId, tx: it.tx, ty: it.ty, dir: it.dir, source: b ? b.source : null, owner: b ? b.owner : null, editable: !!bodyRef(b) };
          }),
          converting: ui.converting && (function () {
            var r = conversion();
            return { connId: ui.converting.connId, to: ui.converting.to, source: ui.converting.source, aSpawn: ui.converting.aSpawn,
              bTrigger: ui.converting.bTrigger, facing: ui.converting.facing, placing: ui.converting.placing,
              record: r.record, errors: r.errors, dropped: r.dropped, needsChoice: !!r.needsChoice };
          }()),
          creating: ui.creating && { step: ui.creating.step, oneWay: ui.creating.oneWay, a: ui.creating.a, b: ui.creating.b, id: ui.creating.id,
            moving: ui.creating.moving, candidate: candidate(), errors: candidateErrors() },
          objectOps: JSON.parse(JSON.stringify(objectOpsList())), objectChangeCount: objectChanges().length, confirmObjectDelete: ui.confirmObjectDelete,
          newObject: ui.newObject && Object.assign(JSON.parse(JSON.stringify(ui.newObject)), { errors: newObjectPlan().errors }),
          newInteract: ui.newInteract && Object.assign(JSON.parse(JSON.stringify(ui.newInteract)), { errors: newInteractPlan().errors }),
          objectItems: list.filter(function (it) { return it.kind === 'object'; }).map(function (it) {
            return { id: it.id, entry: it.entry || null, sourceId: it.sourceId || null, ref: it.ref || null, interactId: it.interactId || null,
              tx: it.tx, ty: it.ty, w: it.w, h: it.h, readOnly: !!it.readOnly, refs: it.entry ? objectRefs(it) : [] };
          }),
          momentsLoaded: !momentSel.disabled, notice: ui.notice && ui.notice.text,
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
