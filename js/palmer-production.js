/* palmer-production.js — installa la casa Palmer nativa ('palmer'). Il record
 * della mappa e la connessione con la citta' vivono gia' nel registro: qui si
 * aggancia solo la scena authored. */
(function () {
  'use strict';

  var G = window.GAME;
  if (G.PalmerScene && typeof G.PalmerScene.install === 'function') {
    G.PalmerScene.install();
  } else if (typeof console !== 'undefined') {
    console.warn('palmer-production: GAME.PalmerScene not found, skipping install (art/scene not built yet)');
  }
}());
