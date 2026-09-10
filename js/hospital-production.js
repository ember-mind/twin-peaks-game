/* hospital-production.js — installa il reparto nativo ('hospital'). Il record
 * della mappa e le porte verso la citta' vivono gia' in js/maps.js: qui si
 * aggancia solo la scena authored. */
(function () {
  'use strict';

  var G = window.GAME;
  if (G.HospitalScene && typeof G.HospitalScene.install === 'function') {
    G.HospitalScene.install();
  } else if (typeof console !== 'undefined') {
    console.warn('hospital-production: GAME.HospitalScene not found, skipping install (art/scene not built yet)');
  }
}());
