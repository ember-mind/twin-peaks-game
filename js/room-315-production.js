/* room-315-production.js — install the production room 315 interior
 * ('room_315'). Its connection to the Great Northern corridor ('hotel_gn') is
 * installed by js/world-connections-production.js. No EnvironmentReactions:
 * stillness accepted, review later. */
(function () {
  'use strict';

  var G = window.GAME;
  if (G.Room315Scene && typeof G.Room315Scene.install === 'function') {
    G.Room315Scene.install();
  } else if (typeof console !== 'undefined') {
    console.warn('room-315-production: GAME.Room315Scene not found, skipping install (art/scene not built yet)');
  }
}());
