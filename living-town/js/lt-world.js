/* lt-world.js — Living Town: the small original world.
 *
 * Content only: character grids, where things stand, how far apart places are,
 * who lives here on day one. No mechanics, no decisions.
 *
 * Nobody here has a name. Inhabitants are identified by a stable id that never
 * changes, and their display names are drawn from lt-names.js when the world is
 * created. A place named after its resident carries a template instead of a
 * title, resolved once at creation.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  var W = LT.World = LT.World || {};

  /* Grid legend
   *   #  wall        T  tree        w  water       ,  grass      -  paving
   *   .  floor       D  doorway     B  bed         K  kitchen    G  guitar
   *   C  cafe counter  t  table     c  chair       b  bench      =  window
   */
  var SOLID = '#TwBKGCtb=';

  W.isSolid = function (ch) { return SOLID.indexOf(ch) >= 0; };

  W.LOCATIONS = {
    flat_a: {
      id: 'flat_a', kind: 'home', indoor: true,
      nameTemplate: "%s's flat", resident: 'resident_a',
      opens: 0, closes: 1440, owner: 'resident_a',
      spawn: { x: 5, y: 5, dir: 'up' },
      exit: { x: 5, y: 7 },
      rows: [
        '############',
        '#BB..=....K#',
        '#....t....K#',
        '#....c.....#',
        '#..........#',
        '#.........G#',
        '#..........#',
        '#####DD#####',
        ',,,,,--,,,,,'
      ]
    },
    cafe: {
      id: 'cafe', name: 'Café Meridiana', kind: 'workplace', indoor: true,
      opens: 480, closes: 1260,          // 08:00 – 21:00
      spawn: { x: 3, y: 8, dir: 'up' },
      exit: { x: 3, y: 8 },
      /* A small neighbourhood café, and deliberately lopsided: a short counter
       * in the back-left corner, the door off to the left, a window along the
       * right half of the back wall with a bench under it, one booth against
       * the right wall and one bench on the left, none of them facing another. Collision is these rows and
       * nothing else; a test holds them and `visual.plan` in agreement.
       *   C counter   b stool / plant / board / rack   t bench table   D door */
      rows: [
        '###############',
        '###############',
        '#.......b.ttt.#',
        '#CCCCCC.......#',
        '#b.b.b........#',
        '#.............#',
        '#.....b....ttt#',
        '#ttt..........#',
        '#............b#',
        '###DD##########'
      ],
      /* What the shared interior kit is asked to arrange (lt-cafe-scene.js).
       * Tile units unless marked px (room-local pixels, for things on walls). */
      visual: {
        scene: 'lt_cafe',
        plan: {
          size: [15, 10], floorTop: 2,
          counter: [1, 3, 6],
          stools: [[1, 4], [3, 4], [5, 4]],
          banquettes: [[10, 2, 3], [11, 6, 3], [1, 7, 3]],
          board: [6, 6], plant: [8, 2], coatRack: [13, 8],
          door: [3, 9, 2],
          window: [134, -6, 90, 26],      // px: x, y, w, h on the back wall
          sign: [14, -12], menu: [92, -12],   // px
          wallLamps: [[0, 84], [1, 52], [1, 116]],   // [right wall?, y px]
          signage: {
            name: 'MERIDIANA',
            menu: [['CAFFE', '1.40'], ['FOCACCIA', '3.80']],
            specials: ['OGGI', 'ZUPPA', '4.50'],
            monogram: 'CM'
          }
        }
      }
    },
    park: {
      id: 'park', name: 'Riverside park', kind: 'social', indoor: false,
      opens: 0, closes: 1440,
      spawn: { x: 7, y: 8, dir: 'up' },
      exit: { x: 7, y: 9 },
      rows: [
        ',,,TTT,,,,TTT,,,',
        ',,,,,,,,,,,,,,,,',
        ',,,b,,,,,,,,b,,,',
        ',,,,,,ww,,,,,,,,',
        ',,,,,wwww,,,,,,,',
        ',,,,,,ww,,,,,,,,',
        ',,,b,,,,,,,,b,,,',
        ',,,,,,,,,,,,,,,,',
        'TT,,,,,--,,,,,TT',
        ',,,,,,,DD,,,,,,,'
      ]
    },
    flat_b: {
      id: 'flat_b', kind: 'home', indoor: true,
      nameTemplate: "%s's room", resident: 'resident_b',
      opens: 0, closes: 1440, owner: 'resident_b',
      spawn: { x: 4, y: 5, dir: 'up' },
      exit: { x: 4, y: 6 },
      rows: [
        '##########',
        '#BB.....K#',
        '#.......K#',
        '#..tc....#',
        '#........#',
        '#........#',
        '####DD####',
        ',,,,--,,,,'
      ]
    },
    /* Transit only. Nobody lives on the street, but travel happens in public:
     * a viewer must be able to watch someone walk between two places. */
    street: {
      id: 'street', name: 'Via del Ponte', kind: 'transit', indoor: false,
      opens: 0, closes: 1440, transit: true,
      spawn: { x: 9, y: 4, dir: 'right' },
      rows: [
        'TT,,,,,,,,,,,,,,,,TT',
        ',,,,,,,,,,,,,,,,,,,,',
        ',,,DD,,,,,,,,,,DD,,,',
        ',,,--,,,,,,,,,,--,,,',
        '--------------------',
        '--------------------',
        ',,,,,,,,--,,,,,,,,,,',
        ',,,,,,,,--,,,,,,,,,,',
        ',,,,,,,,DD,,,,,,,,,,',
        ',,,,,,,,,,,,,,,,,,,,',
        'TT,,,,,,,,,,,,,,,,TT'
      ]
    }
  };

  /* Where each place meets the street, so a traveller has a path to walk. */
  W.STREET_PORTALS = {
    flat_a: { x: 3, y: 3 }, cafe: { x: 16, y: 3 }, park: { x: 8, y: 8 }, flat_b: { x: 1, y: 6 }
  };

  /* Minutes on foot. Symmetric, and no route is instant. */
  var TRAVEL = {};
  [['flat_a', 'cafe', 12], ['flat_a', 'park', 14], ['cafe', 'park', 8],
   ['flat_b', 'cafe', 9], ['flat_b', 'park', 11], ['flat_b', 'flat_a', 16]].forEach(function (r) {
    TRAVEL[[r[0], r[1]].sort().join('|')] = r[2];
  });

  W.travelMinutes = function (from, to) {
    if (from === to) return 0;
    var key = [from, to].sort().join('|');
    return TRAVEL[key] || 0;
  };

  W.destinations = function () { return ['flat_a', 'flat_b', 'cafe', 'park']; };

  /* A private place is only a destination for the person who lives there.
   * Nobody wanders into someone else's flat because the pathfinder allows it. */
  W.mayEnter = function (locationId, actorId) {
    var loc = W.LOCATIONS[locationId];
    if (!loc || !loc.owner) return true;
    return loc.owner === actorId;
  };

  /* Objects are content. Each advertises only affordances the action catalogue
   * actually implements; lt-actions.js is checked against this at boot. */
  W.OBJECTS = [
    { id: 'obj_bed_a', name: 'bed', location: 'flat_a', x: 1, y: 1,
      tags: ['furniture', 'rest'], portable: false, owner: 'resident_a',
      affordances: ['sleep'] },
    { id: 'obj_kitchen_a', name: 'kitchen counter', location: 'flat_a', x: 10, y: 1,
      tags: ['furniture', 'food'], portable: false, owner: 'resident_a',
      affordances: ['eat_at_home'] },
    { id: 'obj_guitar', name: 'guitar', location: 'flat_a', x: 10, y: 5,
      tags: ['instrument'], portable: true, owner: 'resident_a', condition: 'worn',
      value: 180, affordances: ['practise_guitar'] },
    /* Where someone stands depends on what they are doing with the thing:
     * staff work the counter from behind it, customers order from the front. */
    { id: 'obj_counter', name: 'café counter', location: 'cafe', x: 3, y: 3,
      tags: ['work', 'food'], portable: false, owner: 'cafe',
      affordances: ['work_shift', 'buy_meal'],
      anchors: { work_shift: { x: 3, y: 2, dir: 'down' }, work_extra_shift: { x: 3, y: 2, dir: 'down' },
                 buy_meal: { x: 4, y: 4, dir: 'up' } } },
    { id: 'obj_cafe_table', name: 'café bench', location: 'cafe', x: 3, y: 7,
      tags: ['furniture', 'seat'], portable: false, owner: 'cafe',
      affordances: ['take_break'],
      anchors: { take_break: { x: 4, y: 7, dir: 'left' } } },
    { id: 'obj_bench', name: 'park bench', location: 'park', x: 3, y: 2,
      tags: ['furniture', 'seat'], portable: false, owner: 'town',
      affordances: ['sit_and_rest'] },
    { id: 'obj_bed_b', name: 'bed', location: 'flat_b', x: 1, y: 1,
      tags: ['furniture', 'rest'], portable: false, owner: 'resident_b',
      affordances: ['sleep'] },
    { id: 'obj_kitchen_b', name: 'kitchen counter', location: 'flat_b', x: 8, y: 1,
      tags: ['furniture', 'food'], portable: false, owner: 'resident_b',
      affordances: ['eat_at_home'] }
  ];

  /* Day-one inhabitants, in draw order: the first generated inhabitant, then
   * the second. Everything measurable here is mechanics — money is spent,
   * energy is consumed, the goal target is compared against savings. */
  W.CHARACTERS = [
    {
      id: 'resident_a', homeId: 'flat_a',
      location: 'flat_a', pos: { x: 5, y: 5, dir: 'down' },
      needs: { energy: 74, hunger: 38 },
      money: 18.5,
      savings: 62,
      pantry: 3,
      policyId: 'utility',
      traits: { conscientiousness: 0.72, sociability: 0.62, ambition: 0.80, caution: 0.45 },
      employment: {
        employer: 'cafe', locationId: 'cafe',
        shiftStart: 540, shiftEnd: 1020,   // 09:00 – 17:00
        wagePerHour: 9
      },
      goals: [{
        id: 'goal_studio', kind: 'savings', label: 'Book the studio session',
        target: 120, progress: 62, unit: 'EUR', deadlineDay: 2,
        note: 'The deposit is due to the studio by the end of tomorrow.'
      }],
      commitments: [
        { id: 'cmt_shift', kind: 'work', strength: 'soft', withId: 'cafe', locationId: 'cafe',
          label: 'Finish the café shift at 17:00', dueDay: 1, dueMin: 1020, status: 'open' },
        { id: 'cmt_meet_friend', kind: 'social', strength: 'soft', withId: 'resident_b', locationId: 'park',
          labelTemplate: 'Meet %s at the park at 17:30', dueDay: 1, dueMin: 1050,
          graceMin: 45, status: 'open' },
        { id: 'cmt_practise', kind: 'personal', strength: 'soft', withId: null, locationId: 'flat_a',
          label: 'Practise guitar this evening', dueDay: 1, dueMin: 1320, graceMin: 60,
          windowStartMin: 1140, status: 'open' }
      ],
      relationships: { resident_b: { trust: 68, closeness: 71, lastMetDay: 0 } }
    },
    {
      id: 'resident_b', homeId: 'flat_b',
      location: 'cafe', pos: { x: 9, y: 5, dir: 'down' },
      needs: { energy: 80, hunger: 30 },
      money: 41,
      savings: 0,
      pantry: 2,
      policyId: 'utility',
      traits: { conscientiousness: 0.58, sociability: 0.86, ambition: 0.35, caution: 0.40 },
      employment: null,
      goals: [{
        id: 'goal_see_friend', kind: 'social', labelTemplate: 'Spend time with %s',
        relatesTo: 'resident_a',
        target: 1, progress: 0, unit: 'meetings', deadlineDay: 1,
        note: 'He suggested the park himself.'
      }],
      commitments: [
        { id: 'cmt_be_at_park', kind: 'social', strength: 'soft', withId: 'resident_a', locationId: 'park',
          labelTemplate: 'Be at the park at 17:30 for %s', dueDay: 1, dueMin: 1050,
          graceMin: 45, status: 'open' }
      ],
      relationships: { resident_a: { trust: 70, closeness: 71, lastMetDay: 0 } }
    }
  ];

  W.START = { day: 1, minute: 360 };   // 06:00
})();
