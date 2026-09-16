/* props-production.js — the runtime consumer of the M9 prop registry (GAME.WorldData.props, js/props.gen.js).
 *
 * One installer, three hooks on the frame the engine already paints (js/engine.js paintWorld): the ground pass
 * (GAME.sprites.drawStructures) starts the frame, GAME.Sprites.drawChar releases the props each actor must draw
 * over just before that actor, and the open-ended depth band of GAME.sprites.drawForegroundStructures releases
 * whatever is left. Frames are drawn on the native scene canvas at integer scale with
 * imageSmoothingEnabled = false, sorted by layer, then by anchor foot y, then by instance id — and INTERLEAVED
 * with the actors by foot y, so Cooper and every Cast Presence body pass in front of and behind them.
 *
 * Ownership, as the handoff requires: map rows stay authoritative for collision and walkability. This module
 * NEVER writes a row, a door or an interact key; footprints are metadata the World Builder uses for selection
 * and warnings, and are not read here at all.
 *
 * Feature flag: nothing is drawn unless GAME.PROPS_ENABLED === true. Default false, so the Roadhouse renders
 * exactly as it did before M9 (test/props-flag-off.js byte-compares a Chrome shot against main).
 * A scene with no instances is a no-op even when the flag is on.
 */
(function () {
  'use strict';

  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  if (GAME.PROPS_ENABLED === undefined) GAME.PROPS_ENABLED = false;

  var registry = GAME.WorldData && GAME.WorldData.props;
  var TILE = (registry && registry.tilePx) || 16;

  /* instancesFor(sceneId) -> the scene's instances in deterministic draw order.
   * layer (instance override, else the definition's defaultLayer), then the anchor foot y in pixels, then the
   * instance id: two props on the same layer and the same foot always draw in the same order. */
  var byScene = null;
  function instancesFor(sceneId) {
    if (!registry) return [];
    if (!byScene) {
      byScene = {};
      Object.keys(registry.instances).forEach(function (id) {
        var inst = registry.instances[id];
        var def = registry.definitions[inst.propId];
        if (!def) return; // a missing definition is a validation error in tools/world-apply.js; never draw a guess
        var entry = {
          id: id,
          inst: inst,
          def: def,
          layer: inst.layer === undefined ? def.defaultLayer : inst.layer,
          foot: Math.round(inst.ty * TILE)
        };
        (byScene[inst.sceneId] = byScene[inst.sceneId] || []).push(entry);
      });
      Object.keys(byScene).forEach(function (scene) {
        byScene[scene].sort(function (a, b) {
          return (a.layer - b.layer) || (a.foot - b.foot) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
        });
      });
    }
    return byScene[sceneId] || [];
  }

  /* Atlas paths in world/props.json are repo-root relative ("assets/…"), and the harness pages do not sit at the
   * repo root (test/retro-scene.html is one level down). Resolve them against THIS script's own URL instead of
   * the document's, so index.html and every test page load the same file. */
  var ROOT = '';
  (function () {
    var self = typeof document !== 'undefined' && document.currentScript && document.currentScript.src;
    if (self) ROOT = String(self).replace(/[?#].*$/, '').replace(/js\/props-production\.js$/, '');
  }());

  var atlases = {};
  function atlasFor(src) {
    if (!Object.prototype.hasOwnProperty.call(atlases, src)) {
      var img = null;
      if (typeof G.Image === 'function') { img = new G.Image(); img.src = ROOT + src; }
      atlases[src] = img;
    }
    return atlases[src];
  }

  /* Decoding is asynchronous, and a capture can land before it finishes, so every atlas the registry names is
   * requested at install time rather than on the first draw. A frame drawn before an atlas decodes draws nothing
   * for that atlas — never a placeholder. */
  function preload() {
    if (!registry) return;
    Object.keys(registry.definitions).forEach(function (id) { atlasFor(registry.definitions[id].atlas); });
  }

  /* The draw origin of an instance. tx/ty name the ANCHOR point in scene pixels / TILE, so a flipped prop keeps
   * its anchor: the mirrored image occupies the same box, and the anchor mirrors with it. */
  function originOf(entry) {
    var f = entry.def.frame, a = entry.def.anchor, inst = entry.inst;
    var ax = inst.flipX ? f[2] - a[0] : a[0];
    return {
      left: Math.round(inst.tx * TILE) - ax + (inst.ox || 0),
      top: Math.round(inst.ty * TILE) - a[1] + (inst.oy || 0)
    };
  }

  function drawInstance(ctx, entry, cx, cy) {
    var img = atlasFor(entry.def.atlas);
    if (!img || !img.width || !img.height) return false; // atlas not decoded yet: draw nothing, never a placeholder
    var f = entry.def.frame, o = originOf(entry);
    var x = o.left - cx, y = o.top - cy;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (entry.inst.flipX) {
      ctx.translate(x + f[2], y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, f[0], f[1], f[2], f[3], 0, 0, f[2], f[3]);
    } else {
      ctx.drawImage(img, f[0], f[1], f[2], f[3], x, y, f[2], f[3]);
    }
    ctx.restore();
    return true;
  }

  /* drawScene(ctx, sceneId, cx, cy) -> every instance of the scene, ignoring depth. Public for the browser
   * harnesses and for a preview canvas that has no actors to interleave with. */
  function drawScene(ctx, sceneId, cx, cy) {
    if (!GAME.PROPS_ENABLED) return 0;
    var list = instancesFor(sceneId);
    if (!list.length) return 0;
    cx = Math.round(cx || 0); cy = Math.round(cy || 0);
    var drawn = 0;
    for (var i = 0; i < list.length; i++) if (drawInstance(ctx, list[i], cx, cy)) drawn++;
    return drawn;
  }

  /* ---- depth ----------------------------------------------------------------------------------------------
   * Props interleave with actors by foot y: an actor whose foot y is greater than a prop's anchor foot draws
   * OVER that prop, a smaller one draws behind it. On a tie the prop goes first.
   *
   * ACTOR_LAYER is the escape hatch the sort order needs: an instance on a layer STRICTLY ABOVE it is not a
   * floor object at all and always draws after every actor, whatever its foot y. Layers at or below it
   * interleave. 6 is the highest layer the seeded Roadhouse gives a floor object (the chairs); see the report
   * for which definitions sit above it.
   */
  var ACTOR_LAYER = 6;

  /* The engine paints a frame as: ground (one drawStructures call) -> for each actor, sorted by foot y:
   * drawChar, then drawForegroundStructures with the band [thisFoot, nextFoot) (the last one open-ended).
   * There is no hook BEFORE the first actor, so a prop behind everybody cannot be released from a band call.
   * Hooking drawChar instead gives the one moment that is missing — immediately before each actor — and keeps
   * every edit inside this file. `pending` is the frame's undrawn instances, in (layer, foot, id) order. */
  var pending = null;
  var pendingScene = null;

  function beginFrame(sceneId) {
    var list = instancesFor(sceneId);
    pending = list.length ? list.slice() : null;
    pendingScene = pending ? sceneId : null;
  }

  /* drawBand(ctx, sceneId, cx, cy, upToFoot) -> instances released. Draws every still-undrawn instance on a
   * layer <= ACTOR_LAYER whose foot y is <= upToFoot, in list order, so the (layer, foot, id) order is kept
   * among everything released together. upToFoot Infinity also releases the layers above ACTOR_LAYER: that is
   * the end of the frame, after the last actor. */
  function drawBand(ctx, sceneId, cx, cy, upToFoot) {
    if (!GAME.PROPS_ENABLED || !pending || pendingScene !== sceneId) return 0;
    cx = Math.round(cx || 0); cy = Math.round(cy || 0);
    var last = upToFoot === Infinity;
    var keep = [], drawn = 0;
    for (var i = 0; i < pending.length; i++) {
      var e = pending[i];
      var release = e.layer > ACTOR_LAYER ? last : (last || e.foot <= upToFoot);
      if (!release) { keep.push(e); continue; }
      drawInstance(ctx, e, cx, cy);
      drawn++;
    }
    pending = keep.length ? keep : null;
    if (!pending) pendingScene = null;
    return drawn;
  }

  var installed = false;
  var originalForeground, originalDrawChar;
  function install() {
    if (installed || !registry) return false;
    if (!GAME.sprites || typeof GAME.sprites.drawForegroundStructures !== 'function') return false;
    installed = true;
    preload();

    /* Ground pass: once per frame, before any actor. Only bookkeeping — nothing is drawn here. */
    var originalStructures = GAME.sprites.drawStructures;
    if (typeof originalStructures === 'function') {
      GAME.sprites.drawStructures = function (ctx, m, cx, cy, opts) {
        if (GAME.PROPS_ENABLED && m && m.id) beginFrame(m.id);
        return originalStructures.apply(this, arguments);
      };
      uninstallStructures = function () { GAME.sprites.drawStructures = originalStructures; };
    }

    /* Immediately before an actor: release the props it must draw over (foot y <= the actor's, ties first). */
    if (GAME.Sprites && typeof GAME.Sprites.drawChar === 'function') {
      originalDrawChar = GAME.Sprites.drawChar;
      GAME.Sprites.drawChar = function (ctx, x, y, pal, dir, fr, alpha, moving, woods, t, meta) {
        if (GAME.PROPS_ENABLED && meta && meta.mapId && meta.mapId === pendingScene && typeof meta.wy === 'number') {
          /* drawChar is handed screen coordinates; the camera is the difference from the world ones. */
          drawBand(ctx, meta.mapId, meta.wx - x, meta.wy - y, meta.wy + TILE);
        }
        return originalDrawChar.apply(this, arguments);
      };
    }

    /* End of frame: the open-ended band, after the last actor. Releases whatever is left, the layers above
     * ACTOR_LAYER included. A scene whose ground pass never ran (a harness drawing one pass by hand) still
     * gets its props here. */
    originalForeground = GAME.sprites.drawForegroundStructures;
    GAME.sprites.drawForegroundStructures = function (ctx, m, cx, cy, opts) {
      var out = originalForeground.apply(this, arguments);
      var open = !opts || opts.forestDepthMax == null || opts.forestDepthMax === Infinity;
      if (GAME.PROPS_ENABLED && m && m.id && open) {
        if (pendingScene !== m.id) beginFrame(m.id);
        drawBand(ctx, m.id, cx, cy, Infinity);
      }
      return out;
    };
    return true;
  }

  var uninstallStructures = null;
  function uninstall() {
    if (!installed) return;
    installed = false;
    GAME.sprites.drawForegroundStructures = originalForeground;
    if (originalDrawChar) GAME.Sprites.drawChar = originalDrawChar;
    if (uninstallStructures) uninstallStructures();
    originalDrawChar = null; uninstallStructures = null;
    pending = null; pendingScene = null;
  }

  GAME.Props = {
    registry: registry,
    tilePx: TILE,
    instancesFor: instancesFor,
    originOf: originOf,
    drawScene: drawScene,
    drawBand: drawBand,
    beginFrame: beginFrame,
    ACTOR_LAYER: ACTOR_LAYER,
    install: install,
    uninstall: uninstall,
    /* test seam: js/props.gen.js is loaded once, so test/props-render-order.js swaps in fake instances */
    preload: preload,
    _setRegistry: function (next) { registry = next; TILE = (next && next.tilePx) || 16; byScene = null; atlases = {}; pending = null; pendingScene = null; },
    _setAtlas: function (src, img) { atlases[src] = img; }
  };

  if (!install() && typeof console !== 'undefined' && registry && Object.keys(registry.instances).length) {
    console.warn('props-production: GAME.sprites.drawForegroundStructures not found, props not installed');
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.Props;
}());
