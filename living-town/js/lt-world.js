/* lt-world.js — Living Town: the small original world.
 *
 * Content only: character grids, where things stand, how far apart places are,
 * who lives here on day one. No mechanics, no decisions.
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
    home: {
      id: 'home', name: "Mara's flat", kind: 'home', indoor: true,
      opens: 0, closes: 1440, owner: 'mara',
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
      spawn: { x: 6, y: 7, dir: 'up' },
      exit: { x: 6, y: 8 },
      rows: [
        '##############',
        '#CCCCC.......#',
        '#.....K......#',
        '#............#',
        '#..tc...tc...#',
        '#............#',
        '#..tc...tc...#',
        '#............#',
        '######DD######',
        ',,,,,,--,,,,,,'
      ]
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
    tomas_home: {
      id: 'tomas_home', name: "Tomás's room", kind: 'home', indoor: true,
      opens: 0, closes: 1440, owner: 'tomas',
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
    home: { x: 3, y: 3 }, cafe: { x: 16, y: 3 }, park: { x: 8, y: 8 }, tomas_home: { x: 1, y: 6 }
  };

  /* Minutes on foot. Symmetric, and no route is instant. */
  var TRAVEL = {};
  [['home', 'cafe', 12], ['home', 'park', 14], ['cafe', 'park', 8],
   ['tomas_home', 'cafe', 9], ['tomas_home', 'park', 11], ['tomas_home', 'home', 16]].forEach(function (r) {
    TRAVEL[[r[0], r[1]].sort().join('|')] = r[2];
  });

  W.travelMinutes = function (from, to) {
    if (from === to) return 0;
    var key = [from, to].sort().join('|');
    return TRAVEL[key] || 0;
  };

  W.destinations = function () { return ['home', 'tomas_home', 'cafe', 'park']; };

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
    { id: 'obj_bed', name: 'bed', location: 'home', x: 1, y: 1,
      tags: ['furniture', 'rest'], portable: false, owner: 'mara',
      affordances: ['sleep'] },
    { id: 'obj_kitchen', name: 'kitchen counter', location: 'home', x: 10, y: 1,
      tags: ['furniture', 'food'], portable: false, owner: 'mara',
      affordances: ['eat_at_home'] },
    { id: 'obj_guitar', name: 'guitar', location: 'home', x: 10, y: 5,
      tags: ['instrument'], portable: true, owner: 'mara', condition: 'worn',
      value: 180, affordances: ['practise_guitar'] },
    { id: 'obj_counter', name: 'café counter', location: 'cafe', x: 3, y: 1,
      tags: ['work', 'food'], portable: false, owner: 'cafe',
      affordances: ['work_shift', 'buy_meal'] },
    { id: 'obj_cafe_table', name: 'café table', location: 'cafe', x: 3, y: 4,
      tags: ['furniture', 'seat'], portable: false, owner: 'cafe',
      affordances: ['take_break'] },
    { id: 'obj_bench', name: 'park bench', location: 'park', x: 3, y: 2,
      tags: ['furniture', 'seat'], portable: false, owner: 'town',
      affordances: ['sit_and_rest'] },
    { id: 'obj_bed_t', name: 'bed', location: 'tomas_home', x: 1, y: 1,
      tags: ['furniture', 'rest'], portable: false, owner: 'tomas',
      affordances: ['sleep'] },
    { id: 'obj_kitchen_t', name: 'kitchen counter', location: 'tomas_home', x: 8, y: 1,
      tags: ['furniture', 'food'], portable: false, owner: 'tomas',
      affordances: ['eat_at_home'] }
  ];

  /* Day-one inhabitants. Everything measurable here is mechanics: money is
   * spent, energy is consumed, the goal target is compared against savings. */
  W.CHARACTERS = [
    {
      id: 'mara', name: 'Mara', sprite: 'mara', homeId: 'home',
      location: 'home', pos: { x: 5, y: 5, dir: 'down' },
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
        { id: 'cmt_tomas', kind: 'social', strength: 'soft', withId: 'tomas', locationId: 'park',
          label: 'Meet Tomás at the park at 17:30', dueDay: 1, dueMin: 1050,
          graceMin: 45, status: 'open' },
        { id: 'cmt_practise', kind: 'personal', strength: 'soft', withId: null, locationId: 'home',
          label: 'Practise guitar this evening', dueDay: 1, dueMin: 1320, graceMin: 60,
          windowStartMin: 1140, status: 'open' }
      ],
      relationships: { tomas: { trust: 68, closeness: 71, lastMetDay: 0 } }
    },
    {
      id: 'tomas', name: 'Tomás', sprite: 'tomas', homeId: 'tomas_home',
      location: 'cafe', pos: { x: 8, y: 4, dir: 'down' },
      needs: { energy: 80, hunger: 30 },
      money: 41,
      savings: 0,
      pantry: 2,
      policyId: 'utility',
      traits: { conscientiousness: 0.58, sociability: 0.86, ambition: 0.35, caution: 0.40 },
      employment: null,
      goals: [{
        id: 'goal_see_mara', kind: 'social', label: 'Spend time with Mara',
        target: 1, progress: 0, unit: 'meetings', deadlineDay: 1,
        note: 'He suggested the park himself.'
      }],
      commitments: [
        { id: 'cmt_tomas_park', kind: 'social', strength: 'soft', withId: 'mara', locationId: 'park',
          label: 'Be at the park at 17:30 for Mara', dueDay: 1, dueMin: 1050,
          graceMin: 45, status: 'open' }
      ],
      relationships: { mara: { trust: 70, closeness: 71, lastMetDay: 0 } }
    }
  ];

  /* Tomás starts off-screen. He has a home the viewer never enters, so it maps
   * onto the park grid until he travels; his own flat is not part of the first
   * slice and pretending otherwise would be scenery without mechanics. */
  W.OFFSCREEN_HOME = {};

  W.START = { day: 1, minute: 360 };   // 06:00
})();
