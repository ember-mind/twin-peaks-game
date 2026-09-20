/* lt-production-host.js — Living Town: the seat the production renderer sits in.
 *
 * Twin Peaks' production 2D renderer (js/retro-authored.js: the interior room
 * kit, material shading, contact shadows, depth-band occlusion and the 24px
 * walk-cycle atlas renderer) installs itself onto a `GAME` object and reads two
 * pieces of content from it: who is on the character sheet, and the palette
 * table it uses to tell people apart. This file supplies Living Town's answers
 * to both BEFORE that script loads, and nothing else.
 *
 * What is deliberately absent: js/chars.js, the cast matrices, cast presence,
 * narrative, maps, data — every Twin Peaks script that carries identity or
 * story. The renderer never sees a Twin Peaks character because none exists
 * in this page.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function' && !LT.Appearance) require('./lt-appearance.js');
  var GAME = root.GAME = root.GAME || {};

  var looks = {};
  LT.Appearance.ORDER.forEach(function (id) { looks[id] = { look: id }; });

  GAME.Sprites = { CHARS: looks, drawTile: function () {} };
  GAME.RetroCastAtlas = {
    src: (typeof document !== 'undefined' && document.currentScript && document.currentScript.src)
      ? new URL('../assets/inhabitants-hg-24.png', document.currentScript.src).href
      : 'living-town/assets/inhabitants-hg-24.png',
    order: LT.Appearance.ORDER
  };

  var H = LT.ProductionHost = { ready: false, failed: null, looks: looks };
  /* Called once the renderer script has run. Until the sheet has decoded the
   * view keeps using its temporary art; it never draws a half-loaded person. */
  H.attach = function () {
    var Spr = GAME.Sprites;
    if (!Spr.drawChar || !GAME.sprites || !GAME.sprites.drawStructures) {
      H.failed = 'production renderer did not install';
      return H;
    }
    /* Living Town's rooms are arrangements of the renderer's kit; they are
     * handed over here, once the kit exists. */
    if (LT.CafeScene) LT.CafeScene.register(GAME.Retro2D);
    if (Spr.castReady && Spr.castReady.then) {
      Spr.castReady.then(function () { H.ready = true; }, function (e) { H.failed = String(e && e.message || e); });
    }
    return H;
  };
})();
