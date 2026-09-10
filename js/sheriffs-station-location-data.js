/* sheriffs-station-location-data.js — connessioni semantiche del distretto:
 * town -> piazzale -> interno (mappa canonica 'sheriff'). */
(function () {
  'use strict';
  var frontEntrance = {
    id: 'sheriffs-station-front-entrance',
    a: { scene: 'sheriffs_station_exterior', triggers: [[7,6],[8,6]], spawn: { tx: 7, ty: 7, dir: 'down' } },
    b: { scene: 'sheriff', triggers: [[7,11],[8,11]], spawn: { tx: 7, ty: 10, dir: 'up' } }
  };
  var townLot = {
    id: 'town-sheriffs-station-lot',
    a: { scene: 'town', triggers: [[12,20]], spawn: { tx: 12, ty: 21, dir: 'down' } },
    b: {
      scene: 'sheriffs_station_exterior',
      triggers: [[2,11],[3,11],[4,11],[5,11],[6,11],[7,11],
                 [8,11],[9,11],[10,11],[11,11],[12,11],[13,11]],
      spawn: { tx: 7, ty: 10, dir: 'up' }
    }
  };
  var connections = [frontEntrance, townLot];
  if (typeof window !== 'undefined') {
    window.GAME.SheriffsStationLocationConnections = connections;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = connections;
}());
