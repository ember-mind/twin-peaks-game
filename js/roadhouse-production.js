/* roadhouse-production.js — install the native Roadhouse interior. */
(function () {
  'use strict';
  var G = window.GAME;
  if (G.RoadhouseScene && typeof G.RoadhouseScene.install === 'function') {
    G.RoadhouseScene.install();
  } else if (typeof console !== 'undefined') {
    console.warn('roadhouse-production: GAME.RoadhouseScene not found, skipping install (art/scene not built yet)');
  }
}());
