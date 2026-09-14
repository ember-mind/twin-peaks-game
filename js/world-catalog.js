/* world-catalog.js — canonical Twin Peaks location membership. */
(function () {
  'use strict';
  var G = (typeof window !== 'undefined' ? window : globalThis);
  var GAME = G.GAME = G.GAME || {};

  GAME.World.register({
    id: 'twin-peaks',
    locations: [
      {
        id: 'double-r',
        environments: [
          { id: 'exterior', sceneId: 'double_r_exterior_prototype' },
          { id: 'interior', sceneId: 'diner' }
        ],
        connections: ['double-r-front-entrance', 'town-double-r-lot']
      },
      {
        id: 'town',
        environments: [{ id: 'town', sceneId: 'town' }],
        connections: ['town-traincar-east', 'town-sheriffs-station-lot', 'town-double-r-lot',
          'town-great-northern-lobby', 'town-hospital', 'town-palmer-house', 'town-roadhouse', 'town-woods-north',
          'arrival-town']
      },
      {
        id: 'sheriffs-station',
        environments: [
          { id: 'exterior', sceneId: 'sheriffs_station_exterior' },
          { id: 'interior', sceneId: 'sheriff' }
        ],
        connections: ['sheriffs-station-front-entrance', 'town-sheriffs-station-lot']
      },
      {
        id: 'traincar-crossing',
        environments: [{ id: 'traincar', sceneId: 'traincar' }],
        connections: ['town-traincar-east', 'traincar-oej-entrance']
      },
      {
        id: 'one-eyed-jacks',
        environments: [{ id: 'interior', sceneId: 'oej' }],
        connections: ['traincar-oej-entrance']
      },
      {
        id: 'great-northern',
        environments: [
          { id: 'room-315', sceneId: 'room_315' },
          // lobby: legacy glyph map (hotel_gn), not a native-authored environment
          { id: 'lobby', sceneId: 'hotel_gn' }
        ],
        connections: ['great-northern-room-315-hall', 'town-great-northern-lobby', 'redroom-room-315-wake']
      },
      {
        id: 'hospital',
        environments: [{ id: 'ward', sceneId: 'hospital' }],
        connections: ['town-hospital']
      },
      {
        id: 'palmer-house',
        environments: [{ id: 'interior', sceneId: 'palmer' }],
        connections: ['town-palmer-house']
      },
      {
        id: 'roadhouse',
        environments: [{ id: 'interior', sceneId: 'roadhouse' }],
        connections: ['town-roadhouse']
      },
      {
        id: 'ghostwood',
        environments: [{ id: 'woods', sceneId: 'woods' }],
        connections: ['town-woods-north', 'woods-redroom-dream']
      },
      {
        id: 'red-room',
        environments: [{ id: 'dream', sceneId: 'redroom' }],
        connections: ['woods-redroom-dream', 'redroom-room-315-wake']
      },
      {
        id: 'arrival',
        environments: [{ id: 'arrival', sceneId: 'arrival' }],
        connections: ['arrival-town']
      }
    ]
  });
}());
