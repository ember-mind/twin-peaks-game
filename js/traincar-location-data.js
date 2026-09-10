/* traincar-location-data.js — existing paired traversals, preserved as semantic data. */
(function () {
  'use strict';
  var connections = [
    {
      id: 'town-traincar-east',
      a: { scene: 'town', triggers: [[55,14],[55,15]], spawn: { tx: 54, ty: 14, dir: 'left' },
        door: { needsFlag: 'atto3', blockedMsg: 'est_bloccato' } },
      b: { scene: 'traincar', triggers: [[0,7]], spawn: { tx: 1, ty: 7, dir: 'right' } }
    },
    {
      id: 'traincar-oej-entrance',
      a: { scene: 'traincar', triggers: [[21,0]], spawn: { tx: 21, ty: 1, dir: 'down' },
        door: { needsFlag: 'east_route_confirmed', blockedMsg: 'oej_bloccato' } },
      b: { scene: 'oej', triggers: [[7,9],[8,9]], spawn: { tx: 8, ty: 8, dir: 'up' } }
    }
  ];
  if (typeof window !== 'undefined') window.GAME.TraincarLocationConnections = connections;
  if (typeof module !== 'undefined' && module.exports) module.exports = connections;
}());
