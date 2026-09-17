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
          { id: 'interior', sceneId: 'sheriff', program: {
            intent: {
              function: 'A small-town station for reception, case work, waiting, and conversation.',
              playerExperience: 'Arrive easily, read the work areas, and feel familiar routine with a faint unease.',
              tone: 'Functional, warm, lived-in, and imperfect rather than ceremonial.'
            },
            visualGoals: [
              { id: 'warm-focus', aim: 'Sheriff desk and task lamp form the primary warm focal point.' },
              { id: 'edge-density', aim: 'Work density gathers around the edges; entrance-to-desk circulation stays visually quiet.' },
              { id: 'material-contrast', aim: 'Steel and institutional green are softened by oak, paper, plant, and warm light.' },
              { id: 'controlled-asymmetry', aim: 'Left reception and files balance right desks without mirror symmetry or random clutter.' }
            ],
            activities: [
              { id: 'reception', description: 'Receive visitors and handle calls or paperwork.' },
              { id: 'case-work', description: 'Review files, make calls, and work at desks.' },
              { id: 'waiting', description: 'Wait near the entrance without blocking circulation.' },
              { id: 'conversation', description: 'Talk across the public-to-staff boundary.' }
            ],
            groups: [
              { id: 'sheriff-work', role: 'Primary work focal point', anchors: ['sheriffDesk', 'sheriffChair'], activities: ['case-work', 'conversation'], visual: 'Compact, warm, occupied; strongest local light.' },
              { id: 'records', role: 'Institutional storage mass', anchors: ['files'], activities: ['case-work'], visual: 'Tall, cool, orderly; softened by one plant.' },
              { id: 'reception', role: 'Public-to-staff threshold', anchors: ['reception', 'receptionReturn'], activities: ['reception', 'conversation'], visual: 'Grounded oak counter; readable from entrance.' },
              { id: 'waiting', role: 'Quiet pause near arrival', anchors: ['bench'], activities: ['waiting'], visual: 'Low-density, simple silhouette; does not block aisle.' },
              { id: 'shared-work', role: 'Secondary everyday work', anchors: ['rightDeskNorth', 'rightChairNorth', 'rightDeskSouth', 'rightChairSouth'], activities: ['case-work'], visual: 'Repeated desks with lighter emphasis than sheriff work.' }
            ],
            contributions: [
              { anchor: 'sheriffDesk', contributesTo: ['function', 'atmosphere', 'composition'], reason: 'Holds active case work and the room’s warm, human focal light.' },
              { anchor: 'files', contributesTo: ['function', 'composition', 'world_building'], reason: 'Makes records work credible and gives the left wall a tall institutional mass.' },
              { anchor: 'reception', contributesTo: ['function', 'spatial_readability'], reason: 'Marks the public-to-staff boundary without blocking the entry route.' },
              { anchor: 'bench', contributesTo: ['function', 'composition'], reason: 'Makes waiting legible and keeps this low corner visually occupied.' },
              { anchor: 'rightDeskNorth', contributesTo: ['function', 'composition'], reason: 'Suggests shared routine work and balances the heavy reception side.' }
            ],
            relationships: [
              { kind: 'NEAR', from: 'sheriffChair', to: 'sheriffDesk', reason: 'A working seat belongs beside the primary desk.' },
              { kind: 'NEAR', from: 'receptionReturn', to: 'reception', reason: 'Return and counter read as one public threshold.' },
              { kind: 'REACHABLE', from: 'entrance', to: 'sheriffDesk', reason: 'Visitor can move from front door toward the primary work area.' }
            ],
            residue: { ambient: [
              { anchor: 'sheriffDesk', detail: 'One mug with steam', reason: 'An ordinary sign that desk work is ongoing; it asserts no story event.' },
              { anchor: 'sheriffDesk', detail: 'Case papers, phone, and working lamp', reason: 'A used workspace with a warm focal point, not random clutter.' },
              { anchor: 'files', detail: 'One plant on the filing bank', reason: 'Softens repeated steel silhouettes and implies everyday care.' },
              { anchor: 'reception', detail: 'Phone, in-tray, and public forms', reason: 'Routine intake is visible at the visitor threshold.' },
              { anchor: 'rightDeskNorth', detail: 'Paper and desk stationery', reason: 'Shows secondary work without inventing a specific case.' }
            ] }
          } }
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
