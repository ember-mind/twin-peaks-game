/* sheriffs-station-production.js — install the production sheriff exterior,
 * the canonical interior ('sheriff') and the two connections that join them
 * to Town. Le scene devono esistere prima delle connessioni. */
(function () {
  'use strict';

  var G = window.GAME;
  G.SheriffsStationExteriorScene.install();
  G.SheriffsStationScene.install();
  G.LocationConnections.connectionRecordsFor(['sheriffs-station-front-entrance', 'town-sheriffs-station-lot']).forEach(function (connection) {
    G.LocationConnections.install(connection, G.Maps);
    });

  /* Reactive entrance door: the closed double leaves at x112..144,y176..192
   * (js/sheriffs-station-art.js, south wall) react only to a committed
   * arrival through sheriffs-station-front-entrance. */
  G.EnvironmentReactions.register('sheriff', [{
    id: 'front-door', trigger: 'ENTITY_ENTERED_DOORWAY',
    arrivalKey: '7,10', fromMapId: 'sheriffs_station_exterior',
    x: 112, y: 176, depth: 192,
    frames: G.EnvironmentReactions.doorEntryFrames,
    palette: {
      frame: '#34231c', void: '#252a27', threshold: '#738083',
      red: '#6d4930', edge: '#4a3023', gold: '#d2a342', glass: '#9eafad'
    }
  }]);
}());
