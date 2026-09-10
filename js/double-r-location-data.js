(function () {
  'use strict';
  var connection = {
    id: 'double-r-front-entrance',
    a: { scene: 'double_r_exterior_prototype', triggers: [[6,6],[7,6]], spawn: { tx: 6, ty: 7, dir: 'down' } },
    b: { scene: 'diner', triggers: [[6,9],[7,9]], spawn: { tx: 6, ty: 8, dir: 'up' }, departureReaction: 'front-door' }
  };
  /* Uscita verso Town: senza questa il piazzale del Double R e' un vicolo cieco. */
  var townLot = {
    id: 'town-double-r-lot',
    a: { scene: 'town', triggers: [[42,20]], spawn: { tx: 42, ty: 21, dir: 'down' } },
    b: {
      scene: 'double_r_exterior_prototype',
      triggers: [[2,11],[3,11],[4,11],[5,11],[6,11],[7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11]],
      spawn: { tx: 6, ty: 10, dir: 'up' }
    }
  };
  var connections = [connection, townLot];
  if (typeof window !== 'undefined') {
    window.GAME.DoubleRLocationConnection = connection;
    window.GAME.DoubleRLocationConnections = connections;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = connection;
    module.exports.connections = connections;
  }
}());
