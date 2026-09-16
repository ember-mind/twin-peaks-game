/* props-production.js — the runtime consumer of the M9 prop registry (GAME.WorldData.props, js/props.gen.js).
 *
 * One installer. It wraps GAME.sprites.drawForegroundStructures so a scene that has prop instances paints its
 * atlas frames on the native scene canvas after the authored art of that scene, at integer scale with
 * imageSmoothingEnabled = false, sorted by layer, then by anchor foot y, then by instance id.
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

  /* drawScene(ctx, sceneId, cx, cy) -> instances drawn. Public so the browser harnesses and
   * test/props-render-order.js can drive one scene without the installer. */
  function drawScene(ctx, sceneId, cx, cy) {
    if (!GAME.PROPS_ENABLED) return 0;
    var list = instancesFor(sceneId);
    if (!list.length) return 0;
    cx = Math.round(cx || 0); cy = Math.round(cy || 0);
    var drawn = 0;
    for (var i = 0; i < list.length; i++) if (drawInstance(ctx, list[i], cx, cy)) drawn++;
    return drawn;
  }

  var installed = false;
  var originalForeground;
  function install() {
    if (installed || !registry) return false;
    if (!GAME.sprites || typeof GAME.sprites.drawForegroundStructures !== 'function') return false;
    installed = true;
    preload();
    originalForeground = GAME.sprites.drawForegroundStructures;
    GAME.sprites.drawForegroundStructures = function (ctx, m, cx, cy, opts) {
      var out = originalForeground.apply(this, arguments);
      /* Props are painted after the scene's own foreground pass, and only on the last depth band, so a banded
       * scene does not draw them once per band. */
      var banded = opts && opts.forestDepthMax != null && opts.forestDepthMax !== Infinity;
      if (m && m.id && !banded) drawScene(ctx, m.id, cx, cy);
      return out;
    };
    return true;
  }

  function uninstall() {
    if (!installed) return;
    installed = false;
    GAME.sprites.drawForegroundStructures = originalForeground;
  }

  GAME.Props = {
    registry: registry,
    tilePx: TILE,
    instancesFor: instancesFor,
    originOf: originOf,
    drawScene: drawScene,
    install: install,
    uninstall: uninstall,
    /* test seam: js/props.gen.js is loaded once, so test/props-render-order.js swaps in fake instances */
    preload: preload,
    _setRegistry: function (next) { registry = next; TILE = (next && next.tilePx) || 16; byScene = null; atlases = {}; },
    _setAtlas: function (src, img) { atlases[src] = img; }
  };

  if (!install() && typeof console !== 'undefined' && registry && Object.keys(registry.instances).length) {
    console.warn('props-production: GAME.sprites.drawForegroundStructures not found, props not installed');
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.Props;
}());
