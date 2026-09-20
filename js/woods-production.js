/* woods-production.js — installa la radura di Glastonbury nativa ('woods').
 * La geometria, le celle interagibili e il varco del sogno vivono gia' nella
 * mappa: qui si aggancia solo la scena authored. */
(function () {
  'use strict';

  var G = window.GAME;
  if (G.WoodsScene && typeof G.WoodsScene.install === 'function') {
    G.WoodsScene.install();
  } else if (typeof console !== 'undefined') {
    console.warn('woods-production: GAME.WoodsScene not found, skipping install (art/scene not built yet)');
  }
}());
