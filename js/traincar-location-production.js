/* traincar-location-production.js — install existing traincar paired doors. */
(function () {
  'use strict';
  var G = window.GAME;
  G.LocationConnections.connectionRecordsFor(['town-traincar-east', 'traincar-oej-entrance']).forEach(function (connection) {
    G.LocationConnections.install(connection, G.Maps);
     });
}());
