/* oej-production.js — install the native One Eyed Jacks interior. */
(function () {
  'use strict';
  var G = window.GAME;
  if (G.OejScene && typeof G.OejScene.install === 'function') {
    G.OejScene.install();
  } else if (typeof console !== 'undefined') {
    console.warn('oej-production: GAME.OejScene not found, skipping install (art/scene not built yet)');
  }
}());
