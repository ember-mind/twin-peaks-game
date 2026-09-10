/* room-315-location-data.js — connessione semantica tra la stanza 315
 * (mappa canonica 'room_315') e il corridoio del Great Northern ('hotel_gn'). */
(function () {
  'use strict';
  var hall = {
    id: 'great-northern-room-315-hall',
    a: { scene: 'room_315', triggers: [[7,11]], spawn: { tx: 7, ty: 10, dir: 'up' } },
    b: { scene: 'hotel_gn',  triggers: [[14,1]], spawn: { tx: 14, ty: 2, dir: 'down' } }
  };
  var connections = [hall];
  if (typeof window !== 'undefined') {
    window.GAME.Room315LocationConnections = connections;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = connections;
}());
