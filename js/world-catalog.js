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
          { id: 'interior', sceneId: 'diner', program: {
            intent: {
              function: 'A working public diner for food service, eating, and conversation.',
              playerExperience: 'Enter a warm, occupied room and read several social destinations without losing the service counter.',
              tone: 'Familiar, hospitable, and actively used; composed rather than cluttered.'
            },
            visualGoals: [
              { id: 'distributed-attention', aim: 'Counter and pie case orient the player while booths retain independent social pulls; no single isolated focal point.' },
              { id: 'booth-rhythm', aim: 'Four red booth modules establish diner rhythm, with occupancy and table states supplying controlled variation.' },
              { id: 'warm-continuity', aim: 'Local practical lights link counter service and seating without a room-wide glow.' },
              { id: 'checker-circulation', aim: 'Checker floor keeps its diner identity and branching routes, but should not overpower small people and tables.' },
              { id: 'island-break', aim: 'Plant and specials board interrupt rigid repetition while both routes around the center island stay legible.' }
            ],
            activities: [
              { id: 'ordering', description: 'Choose food or coffee at the counter and specials board.' },
              { id: 'serving', description: 'Prepare and hand over food and coffee across the counter.' },
              { id: 'eating', description: 'Eat and drink at the booths or counter.' },
              { id: 'conversation', description: 'Talk across tables, stools, and the service counter.' },
              { id: 'staff-work', description: 'Keep the counter, cups, and service equipment in use.' },
              { id: 'circulation', description: 'Move between entrance, booths, and counter by either side of the center island.' }
            ],
            groups: [
              { id: 'service-counter', role: 'Shared service and orientation band', anchors: ['counter', 'stool-0', 'stool-1', 'stool-2', 'stool-3', 'stool-4'], activities: ['ordering', 'serving', 'eating', 'conversation', 'staff-work'], visual: 'Long, dense, warm horizontal mass with pale top, red face, lit pie case and equipment.' },
              { id: 'booth-seating', role: 'Repeated social rooms within the room', anchors: ['booth-0', 'booth-1', 'booth-2', 'booth-3'], activities: ['eating', 'conversation'], visual: 'Four related red modules on both sides; table states and occupancy vary without dissolving rhythm.' },
              { id: 'center-island', role: 'Small specials and organic break in circulation', anchors: ['specials', 'island-plant'], activities: ['ordering', 'circulation'], visual: 'One low sign and one green vertical silhouette divide the checker floor into two readable paths.' }
            ],
            contributions: [
              { anchor: 'counter', contributesTo: ['function', 'composition', 'spatial_readability'], reason: 'Supports service and gives an arriving player a clear horizontal orientation landmark.' },
              { anchor: 'booth-0', contributesTo: ['function', 'composition', 'atmosphere'], reason: 'One module of the repeated red seating rhythm that makes the room recognizably a diner.' },
              { anchor: 'booth-1', contributesTo: ['function', 'composition', 'ambient_life'], reason: 'Continues the booth rhythm while its occupied table gives the seating a social scale.' },
              { anchor: 'booth-3', contributesTo: ['composition', 'ambient_life'], reason: 'A cleared table varies the repeated module and suggests ordinary turnover without asserting a plot event.' },
              { anchor: 'island-plant', contributesTo: ['composition', 'atmosphere', 'spatial_readability'], reason: 'Breaks the rigid counter-and-booth grid with an organic silhouette and separates two circulation branches.' },
              { anchor: 'specials', contributesTo: ['function', 'world_building', 'composition'], reason: 'Advertises everyday food service and gives the center island a small authored vertical accent.' }
            ],
            relationships: [
              { kind: 'NEAR', from: 'counter', to: 'stool-0', reason: 'Counter seating must remain next to the service surface.' },
              { kind: 'REACHABLE', from: 'entrance', to: 'service-approach', reason: 'Both branches around the center island should still let a visitor approach service.' }
            ],
            residue: { ambient: [
              { anchor: 'counter', detail: 'Cups, coffee equipment, pie case, and working service light', reason: 'Daily service remains visible even when named staff are absent.' },
              { anchor: 'booth-0', detail: 'Menu, cup, and plate on a ready table', reason: 'Ordinary table use keeps repetition from becoming sterile.' },
              { anchor: 'booth-3', detail: 'One recently cleared plate and folded napkin', reason: 'Routine turnover varies the seating without implying a canonical event.' }
            ] }
          } }
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
