/* traincar-production.js — installa la radura nativa del vagone ('traincar').
 * Il record della mappa, le porte verso la citta' e verso One Eyed Jacks e gli
 * oggetti authored vivono gia' in js/maps.js: qui si aggancia solo la scena. */
(function () {
  'use strict';

  var G = window.GAME;
  if (G.TraincarScene && typeof G.TraincarScene.install === 'function') {
    G.TraincarScene.install();
  } else if (typeof console !== 'undefined') {
    console.warn('traincar-production: GAME.TraincarScene not found, skipping install (art/scene not built yet)');
  }
}());
