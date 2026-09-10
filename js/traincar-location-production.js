/* traincar-location-production.js — install existing traincar paired doors. */
(function () {
  'use strict';
  var G = window.GAME;
  G.TraincarLocationConnections.forEach(function (connection) {
    G.LocationConnections.install(connection, G.Maps);
  });
}());
