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
  if (typeof require === 'function' && !LT.TownMap) require('./lt-town.gen.js');
  var TM = LT.TownMap;

  /* Grid legend
   *   #  wall        T  tree        w  water       ,  grass      -  paving
   *   .  floor       D  doorway     B  bed         K  kitchen    G  guitar
   *   C  cafe counter  t  table     c  chair       b  bench      =  window
   *   H  house front, seen from the street     f  garden wall or fence
   * The town outside (lt-town.gen.js) uses #, f, w, ',', '-' and D: there
   * '#' also hides what is behind it and 'f' does not.
   */
  var SOLID = '#TwBKGCtb=Hf';
  var OPAQUE = '#H';

  W.isSolid = function (ch) { return SOLID.indexOf(ch) >= 0; };

  /* Whether this person may stop on this cell: some cells belong to the
   * people who work in a place (behind a counter). Walking is not stopping. */
  W.mayStand = function (locationId, x, y, actor) {
    var loc = W.LOCATIONS[locationId];
    if (!loc || !loc.staffOnly || loc.staffOnly.indexOf(x + ',' + y) < 0) return true;
    return !!(actor && actor.employment && actor.employment.locationId === locationId);
  };

  /* Every cell of a place nobody can stand on, as 'x,y'. For anything that
   * has to show the map as it is — a painter can be asked whether it accounts
   * for all of them. */
  W.blockedCells = function (locationId) {
    var out = [], loc = W.LOCATIONS[locationId];
    (loc ? loc.rows : []).forEach(function (row, y) { for (var x = 0; x < row.length; x++) if (W.isSolid(row.charAt(x))) out.push(x + ',' + y); });
    return out;
  };

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
      /* Behind the counter is for whoever works here: nobody else stops there,
       * not even to talk to someone serving. */
      staffOnly: ['1,2', '2,2', '3,2', '4,2', '5,2', '6,2'],
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
    /* Outside is one map, the village drawn from the kit (lt-town.gen.js):
     * the street along the houses and the park on the lawn by the river are
     * two parts of it, not two rooms. Both share its grid (`grid: 'town'`),
     * so people walk from one into the other; which of the two someone is in
     * is where they stand (W.zoneAt). Content that says 'park' means the lawn. */
    park: {
      id: 'park', name: 'Riverside park', kind: 'social', indoor: false,
      opens: 0, closes: 1440, grid: 'town', zone: 'p',
      spawn: { x: TM.parkEntry.x, y: TM.parkEntry.y, dir: 'down' },
      rows: TM.rows
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
    /* Three more homes on the same street. Whether anyone lives in them is up
     * to the cast a world is made with (see W.NEIGHBOURS); an empty one keeps
     * its plain name. */
    flat_c: {
      id: 'flat_c', kind: 'home', indoor: true, name: 'the flat over the bakery',
      nameTemplate: "%s's flat", resident: 'resident_c',
      opens: 0, closes: 1440, owner: 'resident_c',
      spawn: { x: 5, y: 5, dir: 'up' },
      exit: { x: 5, y: 6 },
      rows: [
        '##########',
        '#K..=...B#',
        '#K......B#',
        '#....tc..#',
        '#........#',
        '#........#',
        '####DD####',
        ',,,,--,,,,'
      ]
    },
    flat_d: {
      id: 'flat_d', kind: 'home', indoor: true, name: 'the ground-floor rooms',
      nameTemplate: "%s's rooms", resident: 'resident_d',
      opens: 0, closes: 1440, owner: 'resident_d',
      spawn: { x: 4, y: 5, dir: 'up' },
      exit: { x: 4, y: 6 },
      rows: [
        '###########',
        '#BB...=..K#',
        '#........K#',
        '#.ct......#',
        '#.........#',
        '#.........#',
        '###DD######',
        ',,,--,,,,,,'
      ]
    },
    flat_e: {
      id: 'flat_e', kind: 'home', indoor: true, name: 'the attic room',
      nameTemplate: "%s's room", resident: 'resident_e',
      opens: 0, closes: 1440, owner: 'resident_e',
      spawn: { x: 3, y: 4, dir: 'up' },
      exit: { x: 3, y: 5 },
      rows: [
        '########',
        '#BB..=K#',
        '#......#',
        '#..t...#',
        '#......#',
        '##DD####',
        ',,--,,,,'
      ]
    },
    /* Nobody lives on the street, but travel happens in public: whoever
     * walks from one door to another is seen doing it. */
    street: {
      id: 'street', name: 'Via del Ponte', kind: 'transit', indoor: false,
      opens: 0, closes: 1440, transit: true, grid: 'town', zone: 's',
      spawn: { x: 24, y: 13, dir: 'right' },
      rows: TM.rows
    }
  };

  /* Where each place meets the town outside: a building's door, the middle
   * of the lawn for the park. A traveller walks from one to the other. */
  W.STREET_PORTALS = {};
  Object.keys(TM.doors).forEach(function (id) { W.STREET_PORTALS[id] = { x: TM.doors[id].x, y: TM.doors[id].y }; });
  W.STREET_PORTALS.park = { x: TM.parkEntry.x, y: TM.parkEntry.y };

  /* Outside, people walk three cells a town minute (a cell is about a stride
   * and a half); inside a room, one. Outside, "here" is whoever is within
   * SIGHT_CELLS and not hidden behind a house or a tree. */
  W.WALK_CELLS_PER_MINUTE = 3;
  W.SIGHT_CELLS = 10;

  W.gridOf = function (locationId) {
    var loc = W.LOCATIONS[locationId];
    return loc ? (loc.grid || locationId) : null;
  };
  W.outdoorGrid = function (locationId) { var loc = W.LOCATIONS[locationId]; return !!(loc && loc.grid); };
  /* Two location ids one can walk between without a door: the same room, or
   * two parts of the town outside. */
  W.samePlace = function (a, b) { return a === b || (!!a && W.gridOf(a) === W.gridOf(b) && W.outdoorGrid(a)); };

  /* Which part of the town a cell is in: 'park', 'street', or null (nowhere to stand). */
  W.zoneAt = function (x, y) {
    var z = (TM.zones[y] || '').charAt(x);
    return z === 'p' ? 'park' : (z === 's' ? 'street' : null);
  };

  /* Nothing that hides (a house, a tree) on the straight line between two
   * cells, the two ends excepted. Integer steps, so both directions agree. */
  W.inSight = function (rows, a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, n = Math.max(Math.abs(dx), Math.abs(dy));
    for (var i = 1; i < n; i++) {
      var x = a.x + Math.round(dx * i / n), y = a.y + Math.round(dy * i / n);
      var ch = (rows[y] || '').charAt(x);
      if (OPAQUE.indexOf(ch) >= 0 && !(x === a.x && y === a.y) && !(x === b.x && y === b.y)) return false;
    }
    return true;
  };

  /* Shortest walk between two cells of a grid, in cells; -1 when there is none. */
  W.walkCells = function (rows, from, to) {
    if (from.x === to.x && from.y === to.y) return 0;
    var w = rows[0].length, h = rows.length, dist = {}, q = [from], head = 0;
    dist[from.y * w + from.x] = 0;
    while (head < q.length) {
      var c = q[head++], d0 = dist[c.y * w + c.x];
      for (var i = 0; i < 4; i++) {
        var nx = c.x + [0, 1, 0, -1][i], ny = c.y + [-1, 0, 1, 0][i];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || dist[ny * w + nx] !== undefined) continue;
        if (nx === to.x && ny === to.y) return d0 + 1;
        if (W.isSolid(rows[ny].charAt(nx))) continue;
        dist[ny * w + nx] = d0 + 1;
        q.push({ x: nx, y: ny });
      }
    }
    return -1;
  };
  W.minutesForCells = function (cells) { return cells <= 0 ? 0 : Math.max(1, Math.ceil(cells / W.WALK_CELLS_PER_MINUTE)); };

  /* Minutes on foot between two places, door to door. Symmetric, never
   * instant, and measured on the map rather than written down. */
  var TRAVEL = {};
  W.travelMinutes = function (from, to) {
    if (from === to) return 0;
    var key = [from, to].sort().join('|');
    if (TRAVEL[key] === undefined) {
      var a = W.STREET_PORTALS[from] || (W.LOCATIONS[from] && W.LOCATIONS[from].spawn);
      var b = W.STREET_PORTALS[to] || (W.LOCATIONS[to] && W.LOCATIONS[to].spawn);
      /* Two places behind one door (the flat over the café) are still a
       * flight of stairs apart. */
      TRAVEL[key] = (a && b) ? Math.max(1, W.minutesForCells(W.walkCells(TM.rows, a, b))) : 0;
    }
    return TRAVEL[key];
  };

  W.destinations = function () { return ['flat_a', 'flat_b', 'cafe', 'park', 'flat_c', 'flat_d', 'flat_e']; };

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
                 buy_meal: { x: 4, y: 4, dir: 'up' } },
      /* Where the next person stands when the usual spot has someone on it:
       * two people behind one counter, three in front of it, never one tile. */
      moreAnchors: { work_shift: [{ x: 5, y: 2, dir: 'down' }], work_extra_shift: [{ x: 5, y: 2, dir: 'down' }],
                     buy_meal: [{ x: 2, y: 4, dir: 'up' }, { x: 6, y: 4, dir: 'up' }] } },
    { id: 'obj_cafe_table', name: 'café bench', location: 'cafe', x: 3, y: 7,
      tags: ['furniture', 'seat'], portable: false, owner: 'cafe',
      affordances: ['take_break'],
      anchors: { take_break: { x: 4, y: 7, dir: 'left' }, eat_here: { x: 4, y: 7, dir: 'left' } } },
    /* The two booths: nothing is done TO them, they are somewhere to sit with what was bought. */
    { id: 'obj_cafe_booth_window', name: 'window booth', location: 'cafe', x: 10, y: 2,
      tags: ['furniture', 'seat'], portable: false, owner: 'cafe',
      affordances: [], anchors: { eat_here: { x: 9, y: 2, dir: 'right' } } },
    { id: 'obj_cafe_booth_wall', name: 'wall booth', location: 'cafe', x: 11, y: 6,
      tags: ['furniture', 'seat'], portable: false, owner: 'cafe',
      affordances: [], anchors: { eat_here: { x: 10, y: 6, dir: 'right' } } },
    /* Sat on from the lawn at either end: in front of it is the river wall. */
    { id: 'obj_bench', name: 'park bench', location: 'park', x: 12, y: 17,
      tags: ['furniture', 'seat'], portable: false, owner: 'town',
      affordances: ['sit_and_rest'],
      anchors: { sit_and_rest: { x: 11, y: 17, dir: 'right' } },
      moreAnchors: { sit_and_rest: [{ x: 14, y: 17, dir: 'left' }] } },
    { id: 'obj_bed_b', name: 'bed', location: 'flat_b', x: 1, y: 1,
      tags: ['furniture', 'rest'], portable: false, owner: 'resident_b',
      affordances: ['sleep'] },
    { id: 'obj_kitchen_b', name: 'kitchen counter', location: 'flat_b', x: 8, y: 1,
      tags: ['furniture', 'food'], portable: false, owner: 'resident_b',
      affordances: ['eat_at_home'] },
    { id: 'obj_bed_c', name: 'bed', location: 'flat_c', x: 8, y: 1, tags: ['furniture', 'rest'], portable: false, owner: 'resident_c', affordances: ['sleep'] },
    { id: 'obj_kitchen_c', name: 'kitchen counter', location: 'flat_c', x: 1, y: 1, tags: ['furniture', 'food'], portable: false, owner: 'resident_c', affordances: ['eat_at_home'] },
    { id: 'obj_bed_d', name: 'bed', location: 'flat_d', x: 1, y: 1, tags: ['furniture', 'rest'], portable: false, owner: 'resident_d', affordances: ['sleep'] },
    { id: 'obj_kitchen_d', name: 'kitchen counter', location: 'flat_d', x: 9, y: 1, tags: ['furniture', 'food'], portable: false, owner: 'resident_d', affordances: ['eat_at_home'] },
    { id: 'obj_bed_e', name: 'bed', location: 'flat_e', x: 1, y: 1, tags: ['furniture', 'rest'], portable: false, owner: 'resident_e', affordances: ['sleep'] },
    { id: 'obj_kitchen_e', name: 'kitchen counter', location: 'flat_e', x: 6, y: 1, tags: ['furniture', 'food'], portable: false, owner: 'resident_e', affordances: ['eat_at_home'] }
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
      /* What comes after, in order; `more` is measured from the morning it is taken up. */
      nextGoals: [
        { id: 'goal_strings', kind: 'savings', label: 'Put aside for new strings and a strap', more: 75, unit: 'EUR', days: 2 },
        { id: 'goal_cushion', kind: 'savings', label: 'Build a month\'s cushion', more: 150, unit: 'EUR', days: 4 }
      ],
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
      nextGoals: [
        { id: 'goal_see_friend_again', kind: 'social', labelTemplate: 'See %s again', relatesTo: 'resident_a', more: 2, unit: 'meetings', days: 2, repeats: true }
      ],
      commitments: [
        { id: 'cmt_be_at_park', kind: 'social', strength: 'soft', withId: 'resident_a', locationId: 'park',
          labelTemplate: 'Be at the park at 17:30 for %s', dueDay: 1, dueMin: 1050,
          graceMin: 45, status: 'open' }
      ],
      relationships: { resident_a: { trust: 70, closeness: 71, lastMetDay: 0 } }
    }
  ];

  /* The neighbours: three more people, for a world made with the 'town' cast.
   * Same rules as above — ids, not names; mechanics, not story. Between them
   * they share one counter, one park and not much money: the second pair of
   * hands at the café, someone with time and nobody to spend it with, and
   * someone a week from an empty cupboard. */
  W.NEIGHBOURS = [
    {
      id: 'resident_c', homeId: 'flat_c',
      location: 'flat_c', pos: { x: 5, y: 5, dir: 'up' },
      needs: { energy: 82, hunger: 25 },
      money: 12, savings: 140, pantry: 2,
      policyId: 'utility',
      traits: { conscientiousness: 0.80, sociability: 0.45, ambition: 0.60, caution: 0.65 },
      employment: { employer: 'cafe', locationId: 'cafe', shiftStart: 720, shiftEnd: 1200, wagePerHour: 9 },   // 12:00 – 20:00
      goals: [{ id: 'goal_rent', kind: 'savings', label: 'Have the quarter\'s rent together',
                target: 200, progress: 140, unit: 'EUR', deadlineDay: 3 }],
      nextGoals: [ { id: 'goal_coat', kind: 'savings', label: 'Save for a winter coat', more: 85, unit: 'EUR', days: 2 } ],
      commitments: [
        { id: 'cmt_shift', kind: 'work', strength: 'soft', withId: 'cafe', locationId: 'cafe',
          label: 'Finish the café shift at 20:00', dueDay: 1, dueMin: 1200, status: 'open' }
      ],
      relationships: { resident_a: { trust: 60, closeness: 48, lastMetDay: 0 } }
    },
    {
      id: 'resident_d', homeId: 'flat_d',
      location: 'flat_d', pos: { x: 4, y: 5, dir: 'up' },
      needs: { energy: 70, hunger: 32 },
      money: 60, savings: 0, pantry: 4,
      policyId: 'utility',
      traits: { conscientiousness: 0.66, sociability: 0.90, ambition: 0.20, caution: 0.50 },
      employment: null,
      goals: [{ id: 'goal_company', kind: 'social', label: 'Have a proper talk with somebody',
                target: 2, progress: 0, unit: 'talks', deadlineDay: 2 }],
      nextGoals: [ { id: 'goal_company_again', kind: 'social', label: 'Not let two days pass without a proper talk', more: 2, unit: 'talks', days: 2, repeats: true } ],
      commitments: [
        { id: 'cmt_park_morning', kind: 'social', strength: 'soft', withId: 'resident_e', locationId: 'park',
          labelTemplate: 'Be at the park at 11:00 for %s', dueDay: 1, dueMin: 660, graceMin: 45, status: 'open' }
      ],
      relationships: { resident_e: { trust: 64, closeness: 60, lastMetDay: 0 }, resident_b: { trust: 50, closeness: 35, lastMetDay: 0 } }
    },
    {
      id: 'resident_e', homeId: 'flat_e',
      location: 'flat_e', pos: { x: 3, y: 4, dir: 'up' },
      needs: { energy: 64, hunger: 44 },
      money: 9, savings: 0, pantry: 1,
      policyId: 'utility',
      traits: { conscientiousness: 0.35, sociability: 0.55, ambition: 0.30, caution: 0.70 },
      employment: null,
      goals: [{ id: 'goal_old_friend', kind: 'social', labelTemplate: 'Catch up with %s', relatesTo: 'resident_a',
                target: 1, progress: 0, unit: 'talks', deadlineDay: 2 }],
      nextGoals: [ { id: 'goal_keep_up', kind: 'social', labelTemplate: 'Keep up with %s', relatesTo: 'resident_d', more: 1, unit: 'talks', days: 2, repeats: true } ],
      commitments: [
        { id: 'cmt_park_morning', kind: 'social', strength: 'soft', withId: 'resident_d', locationId: 'park',
          labelTemplate: 'Meet %s at the park at 11:00', dueDay: 1, dueMin: 660, graceMin: 45, status: 'open' }
      ],
      relationships: { resident_d: { trust: 58, closeness: 60, lastMetDay: 0 }, resident_a: { trust: 55, closeness: 52, lastMetDay: 0 } }
    }
  ];

  /* What a saved world was standing on. Everything here is static content the
   * save deliberately does not carry: rooms, doors, where furniture is and where
   * people stand to use it. If any of it changes, a position or a walk target
   * recorded against the old town may now be inside a counter, so the save
   * layer compares this value rather than trusting the coordinates. FNV-1a. */
  W.fingerprint = function () {
    var ids = Object.keys(W.LOCATIONS).sort();
    var text = JSON.stringify({
      locations: ids.map(function (id) {
        var l = W.LOCATIONS[id];
        return [id, l.rows, l.spawn, l.exit || null, !!l.indoor];
      }),
      portals: W.STREET_PORTALS,
      objects: W.OBJECTS.map(function (o) { return [o.id, o.location, o.x, o.y, o.anchors || null, o.affordances || null, o.moreAnchors || null]; })
    });
    var h = 0x811c9dc5;
    for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  };

  W.START = { day: 1, minute: 360 };   // 06:00
})();
