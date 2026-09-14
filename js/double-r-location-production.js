/* double-r-location-production.js — canonical Double R exterior/interior slice (scene + diner door reaction). */
(function () {
  'use strict';

  var G = window.GAME;
  G.DoubleRExteriorScene.install();
  /* Doors (double-r-front-entrance, town-double-r-lot) are installed by js/world-connections-production.js. */
  G.EnvironmentReactions.register('diner', [{
    id: 'front-door', trigger: 'ENTITY_ENTERED_DOORWAY', x: 96, y: 144, depth: 160,
    frames: G.EnvironmentReactions.doorEntryFrames,
    palette: { frame: '#35271f', void: '#17251e', threshold: '#81918b', red: '#8c2f3e', edge: '#501f29', gold: '#e9bd5d', glass: '#f4e6c8' }
  }]);
}());
