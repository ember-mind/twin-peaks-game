/* lt-save.js — Living Town: persisting the authoritative simulation.
 *
 * Everything true about the town lives in one object, sim.state. This file is
 * the only place that turns that object into text and back. It does not know
 * how the world is drawn, and it never asks a policy anything: it serialises
 * facts, and a restored world is the same world with a later clock.
 *
 * A save is versioned and strict. The format string is the contract; a save
 * whose format this build does not know is refused rather than guessed at, and
 * MIGRATIONS is where a future format teaches the loader about an old one.
 *
 * What is deliberately not persisted:
 *   - sim.listeners  — runtime callbacks, meaningless in a new process.
 *   - sim.requests   — the audit trail of questions asked this run. The answers
 *                      still in flight belonged to providers that are gone.
 *   - sim.inbox      — answers that arrived but were not yet applied at a tick
 *                      boundary. A decision made against a state that was then
 *                      saved and reloaded is exactly the kind of stale answer
 *                      the simulation already refuses; silently replaying it
 *                      would put a decision into the world that was never
 *                      validated against the world that came back. So every
 *                      queued answer is dropped and its character re-asks.
 *   - every character's `pending`. A pending decision is a promise held by a
 *                      provider in the process that is about to disappear, so
 *                      the saved copy carries pending: null. What is kept is
 *                      the fact that the question was open and why it was
 *                      asked (`reissue`). Requests are issued at the end of a
 *                      tick, from exactly the state a save captures, so asking
 *                      again at load puts the same question to the same world
 *                      and the restored town does not lose the minute. It is
 *                      put under the number it already had, so a recording of
 *                      the uninterrupted run still lines up, but under an id
 *                      that names this load ('req_7.2'): an answer addressed
 *                      to the question as the vanished process asked it is an
 *                      unknown request here, never a second answer. The key
 *                      an answer is judged by (relevanceKey), its time and
 *                      its candidates are the ones it was first asked with:
 *                      people go on walking while a question is open, so
 *                      the world at the save can differ from the world it
 *                      was asked in.
 *
 * Re-asked, not replayed. What the save guarantees is the question: the same
 * person, the same state, the same candidates, the same request number, and
 * the original asking time, so the decision timeout keeps running from when
 * the question was first put and cannot be renewed by reloading. What it does
 * not and cannot guarantee is the answer. UtilityPolicy is a pure function of
 * the request and will answer identically; a recorded policy answers by
 * request number; a provider with a mind of its own (a remote model, some
 * day) is simply asked again, may take as long as it takes, and may say
 * something else. An answer that had already arrived but had not yet been
 * applied is in the same position: it is not carried over, the question is.
 * Nothing the old process sends can land here, because its answers are
 * addressed to a request id this world never issued.
 *
 * What a save is checked against before it is allowed to become the world:
 *   - the town it was made in (LT.World.fingerprint). Positions, walk targets
 *     and use spots are coordinates in rooms the save does not carry. If the
 *     rooms have changed the save is refused, by name, unless a migration
 *     registered for that old town (S.WORLD_MIGRATIONS) moves everybody
 *     somewhere valid — and the result is verified like any other save.
 *   - who people are: a name, and a look this build can draw. A look that no
 *     longer exists is refused rather than drawn as somebody else.
 *   - where people are: a known place, a walkable cell.
 *   - who answers for them: every policy id must be registered.
 * A refusal is an Error with a sentence a person can read. Nothing here ever
 * falls back to a fresh world; that choice belongs to whoever is asking.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function' && !LT.Sim) require('./lt-sim.js');
  if (typeof require === 'function' && !LT.Content) require('./lt-content.js');
  var S = LT.Save = LT.Save || {};

  S.FORMAT = 'living-town/save@2';
  S.DEFAULT_KEY = 'living-town/save';

  function deepCopy(v) { return JSON.parse(JSON.stringify(v)); }

  /* A format string maps to a function that upgrades that save one step closer
   * to the current format. Each step is written against a real save of the
   * format it upgrades (living-town/test/fixtures). */
  S.MIGRATIONS = S.MIGRATIONS || {};

  /* @1 -> @2. In @1 an activity was one thing from the moment it was chosen:
   * minutes were counted while the person was still walking to where it is
   * done. @2 tells the approach from the doing. Someone saved mid-walk comes
   * back approaching, and the minutes @1 had counted during the walk are
   * recorded as what they were — walking — so nothing is paid for them. A
   * conversation in @1 was joined automatically; one already under way stays
   * under way, and the record gains the field that says who was asked. */
  S.MIGRATIONS['living-town/save@1'] = function (old) {
    var save = deepCopy(old);
    Object.keys(save.state.characters || {}).forEach(function (id) {
      var c = save.state.characters[id], act = c.activity;
      if (!act || act.phase) return;
      var walking = !!c.walkTarget && !c.transit;
      act.phase = walking ? 'approaching' : 'executing';
      act.chosenAbs = act.startAbs;
      act.approachMinutes = walking ? act.elapsed : 0;
      if (walking) act.elapsed = 0;
    });
    (save.state.conversations || []).forEach(function (conv) {
      if (conv.inviteeId) return;
      conv.inviteeId = conv.participants[0] === conv.initiatorId ? conv.participants[1] : conv.participants[0];
      conv.proposedAbs = conv.startAbs;
    });
    save.format = 'living-town/save@2';
    return save;
  };

  /* A town fingerprint maps to a function that takes a save made in that town
   * and returns one that fits the next: people moved off cells that are now
   * furniture, walk targets dropped, and `world` set to the town it now fits.
   * Empty on purpose: a migration is written against a real old save and
   * tested, never guessed. What it returns goes through verify() all the same. */
  S.WORLD_MIGRATIONS = S.WORLD_MIGRATIONS || {};

  /* 6d2aa6eb -> e3450c3d: the town grew. Three homes were added on the same street,
   * with their furniture and their doors onto it, and the café counter gained
   * spare standing spots. No existing room, door, object or use spot moved, so
   * every saved position and walk target is still where it was; what the save
   * lacks is the new furniture and the new places' names. Nobody is added: who
   * lives in a world was decided when it was made. Written against
   * test/fixtures/save-v1-walking-to-work.json (a 6d2aa6eb save). */
  /* Frozen here, not read from the running build: this step produces the
   * e3450c3d town and nothing later, so the next migration starts from what
   * it was written against. */
  var TOWN_E3450C3D = {
    objects: [
      { id: 'obj_bed_c', name: 'bed', location: 'flat_c', x: 8, y: 1, tags: ['furniture', 'rest'], portable: false, owner: 'resident_c', affordances: ['sleep'] },
      { id: 'obj_kitchen_c', name: 'kitchen counter', location: 'flat_c', x: 1, y: 1, tags: ['furniture', 'food'], portable: false, owner: 'resident_c', affordances: ['eat_at_home'] },
      { id: 'obj_bed_d', name: 'bed', location: 'flat_d', x: 1, y: 1, tags: ['furniture', 'rest'], portable: false, owner: 'resident_d', affordances: ['sleep'] },
      { id: 'obj_kitchen_d', name: 'kitchen counter', location: 'flat_d', x: 9, y: 1, tags: ['furniture', 'food'], portable: false, owner: 'resident_d', affordances: ['eat_at_home'] },
      { id: 'obj_bed_e', name: 'bed', location: 'flat_e', x: 1, y: 1, tags: ['furniture', 'rest'], portable: false, owner: 'resident_e', affordances: ['sleep'] },
      { id: 'obj_kitchen_e', name: 'kitchen counter', location: 'flat_e', x: 6, y: 1, tags: ['furniture', 'food'], portable: false, owner: 'resident_e', affordances: ['eat_at_home'] }
    ],
    counterMoreAnchors: { work_shift: [{ x: 5, y: 2, dir: 'down' }], work_extra_shift: [{ x: 5, y: 2, dir: 'down' }],
                          buy_meal: [{ x: 2, y: 4, dir: 'up' }, { x: 6, y: 4, dir: 'up' }] },
    names: { flat_c: 'the flat over the bakery', flat_d: 'the ground-floor rooms', flat_e: 'the attic room' }
  };
  S.WORLD_MIGRATIONS['6d2aa6eb'] = function (save) {
    var state = save.state, have = {}, T = TOWN_E3450C3D;
    (state.objects || []).forEach(function (o) { have[o.id] = o; });
    T.objects.forEach(function (o) { if (!have[o.id]) state.objects.push(deepCopy(o)); });
    if (have.obj_counter && !have.obj_counter.moreAnchors) have.obj_counter.moreAnchors = deepCopy(T.counterMoreAnchors);
    state.locationNames = state.locationNames || {};
    Object.keys(T.names).forEach(function (id) { if (!state.locationNames[id]) state.locationNames[id] = T.names[id]; });
    if (!state.cast) state.cast = 'pair';
    save.world = 'e3450c3d';
    return save;
  };

  /* e3450c3d -> e6451950: the street got its houses. Both sides of Via del
   * Ponte are now house fronts with a doorway for every place, and three places
   * meet the street one cell from where they did.
   *
   * People on the old street walked over grass that is now wall: the way from
   * the attic stair to the park ran along what is now the south row of fronts.
   * So a walker is put right, by rule and not by guess: someone standing on a
   * cell that is now a house front steps onto the pavement beside it (same
   * column; row 7 from the south side, row 3 from the north), and everyone on
   * the street is sent to where the place they were going to meets the street
   * now — taken from their own record of where they were going, not matched
   * against old coordinates. The street as it stands after this step is frozen
   * here, so a later migration starts from what this one was written against.
   * Written against two real saves: test/fixtures/save-town-e3450c3d-walking-home.json
   * and save-town-e3450c3d-on-the-grass.json. */
  var STREET_E6451950 = {
    rows: ['HHHHHHHHHHHHHHHHHHHH', 'HHHHHHHHHHHHHHHHHHHH', 'HHHDDHHHHDDHHHHDDHHH', '--------------------', '--------------------', '--------------------',
           '--------------------', '--------------------', 'HDDHHHHHDDHHHDDHHDDH', 'HHHHHHHHHHHHHHHHHHHH', 'HHHHHHHHHHHHHHHHHHHH'],
    portals: { flat_a: { x: 3, y: 3 }, cafe: { x: 16, y: 3 }, park: { x: 8, y: 8 }, flat_b: { x: 1, y: 7 },
               flat_c: { x: 9, y: 3 }, flat_d: { x: 18, y: 7 }, flat_e: { x: 14, y: 7 } }
  };
  S.WORLD_MIGRATIONS['e3450c3d'] = function (save) {
    var T = STREET_E6451950;
    Object.keys(save.state.characters || {}).forEach(function (id) {
      var c = save.state.characters[id];
      if (c.location !== 'street') return;
      var row = T.rows[c.pos.y] || '', ch = row.charAt(c.pos.x);
      if (ch === 'H' || ch === '') c.pos = { x: Math.max(0, Math.min(19, c.pos.x)), y: c.pos.y >= 8 ? 7 : 3, dir: c.pos.dir };
      var to = c.transit && T.portals[c.transit.to];
      if (to && c.walkTarget) c.walkTarget = { x: to.x, y: to.y };
    });
    save.world = 'e6451950';
    return save;
  };

  /* e6451950 -> e41937ba: the near side of the street got front gardens. Behind
   * the south pavement each home now has a low wall with a gate in it and a
   * path over grass to the house, where there was a solid row of fronts.
   *
   * Nobody needs moving, and that is checked rather than assumed: every cell
   * that was walkable still is (the gates are where the doorways were, and
   * every place meets the street where it did), and the only cells that
   * changed from solid to open are garden cells nobody could have been on.
   * So the step verifies that each person on the street stands on a cell that
   * is open in the street as frozen here, refuses the save by name if one does
   * not, and otherwise only says which town the save now belongs to.
   * Written against a real save: test/fixtures/save-town-e6451950-walking-to-a-south-home.json. */
  var STREET_E41937BA = {
    rows: ['HHHHHHHHHHHHHHHHHHHH', 'HHHHHHHHHHHHHHHHHHHH', 'HHHDDHHHHDDHHHHDDHHH', '--------------------', '--------------------', '--------------------',
           '--------------------', '--------------------', 'fDDffHHHDDHffDDffDDf', ',--,fHHHHHH,,--,f--,', 'HHHHHHHHHHHHHHHHHHHH']
  };
  S.WORLD_MIGRATIONS['e6451950'] = function (save) {
    Object.keys(save.state.characters || {}).forEach(function (id) {
      var c = save.state.characters[id];
      if (c.location !== 'street') return;
      var ch = (STREET_E41937BA.rows[c.pos.y] || '').charAt(c.pos.x);
      if (ch !== '-' && ch !== 'D' && ch !== ',') throw new Error('save e6451950: ' + id + ' stands at ' + c.pos.x + ',' + c.pos.y + ' on the street, which is not open ground');
    });
    save.world = 'e41937ba';
    return save;
  };

  /* e41937ba -> d7dfa67e: the café's tables became somewhere to sit. The bench
   * gained a seat for someone eating and the two booths became objects with
   * one each; nothing moved and no cell changed, so every saved position is
   * still good. What the save lacks is the two booths and the bench's new
   * anchor. Someone saved part-way through a meal at the counter has no seat
   * on record, and will look for one like anybody else. Frozen here.
   * Written against test/fixtures/save-town-e41937ba-eating-at-the-counter.json. */
  var CAFE_D7DFA67E = {
    booths: [
      { id: 'obj_cafe_booth_window', name: 'window booth', location: 'cafe', x: 10, y: 2, tags: ['furniture', 'seat'], portable: false, owner: 'cafe',
        affordances: [], anchors: { eat_here: { x: 9, y: 2, dir: 'right' } } },
      { id: 'obj_cafe_booth_wall', name: 'wall booth', location: 'cafe', x: 11, y: 6, tags: ['furniture', 'seat'], portable: false, owner: 'cafe',
        affordances: [], anchors: { eat_here: { x: 10, y: 6, dir: 'right' } } }
    ],
    benchSeat: { x: 4, y: 7, dir: 'left' }
  };
  S.WORLD_MIGRATIONS['e41937ba'] = function (save) {
    var state = save.state, have = {};
    (state.objects || []).forEach(function (o) { have[o.id] = o; });
    CAFE_D7DFA67E.booths.forEach(function (o) { if (!have[o.id]) state.objects.push(deepCopy(o)); });
    if (have.obj_cafe_table) {
      have.obj_cafe_table.anchors = have.obj_cafe_table.anchors || {};
      if (!have.obj_cafe_table.anchors.eat_here) have.obj_cafe_table.anchors.eat_here = deepCopy(CAFE_D7DFA67E.benchSeat);
    }
    save.world = 'd7dfa67e';
    return save;
  };

  /* d7dfa67e -> 98626395, the kit town: outside became one map. The street (20x11) and
   * the park (16x10) were two rooms; now both are parts of one 48x27 village
   * drawn from the kit (lt-town.gen.js), with the park on the lawn by the
   * river. Every position outside, every walk target outside and everything
   * lying in the park is moved, by rule:
   *   - what stood at one of the old park's named spots (the bench people sit
   *     on, the three other benches, the path) goes to the spot that took its
   *     place, and so does whoever was using it or walking to use it;
   *   - anyone walking between places is put on the new route between the
   *     same two doors, as far from the end as they could still walk in the
   *     minutes their walk has left, so they arrive when they would have;
   *   - anyone else outside keeps their place in proportion, moved onto the
   *     nearest open ground of the same part of the town.
   * The town as it stands after this step is frozen here (its rows 9-21; the
   * rest is wall and water). Written against two real saves:
   * test/fixtures/save-town-d7dfa67e-walking-to-the-park.json and
   * save-town-d7dfa67e-reading-in-the-park.json. */
  var KIT_TOWN = {
    world: '98626395', w: 48, h: 27, top: 9, parkRow: 15, parkEast: 39,
    rows: ['#######D#######D##########D#####D#######D#######', 'ffffff-,ffffff-,ffff-ff-f--ffff--ffffff,-ffff#ff',
           '-f----------------f-----------------f---------f-', '------------------------------------------------',
           '------------------------------------------------', '------------------------------------------------',
           ',,fffffffffffffffffff----fffffffffffffff,w------', ',,,,,,,,,#,,,,,#,,,,,---,,,#,,,,,,,,,,,,,ww-----',
           ',#,ffff,,,,,ff,,,fff,---ff,,,,,ff,fff,ff,www----', 'fffffffffffffffffffff,,,fffffffffffffffffwwww---',
           '#####################,,,#################wwww---', 'wwwwwwwwwwwwwwwwwwwww---wwwwwwwwwwwwwwwwwwwwww--',
           'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww-'],
    portals: { cafe: { x: 26, y: 9 }, flat_a: { x: 7, y: 9 }, flat_b: { x: 15, y: 9 }, flat_c: { x: 26, y: 9 },
               flat_d: { x: 32, y: 9 }, flat_e: { x: 40, y: 9 }, park: { x: 22, y: 17 } },
    /* the bench is sat on from the lawn at either end: in front of it is the wall */
    bench: { anchors: { sit_and_rest: { x: 11, y: 17, dir: 'right' } }, moreAnchors: { sit_and_rest: [{ x: 14, y: 17, dir: 'left' }] } },
    /* old park cell -> new cell, for things and for the cells they are used from */
    spots: { '3,2': [12, 17], '3,3': [11, 17, 'right'], '12,6': [32, 17], '12,7': [30, 17, 'right'], '3,6': [7, 17], '3,7': [7, 16, 'down'],
             '12,2': [22, 20], '12,3': [22, 19, 'down'], '8,6': [22, 16], '8,7': [22, 17, 'up'] }
  };
  function kitCell(x, y) {
    var T = KIT_TOWN, row = T.rows[y - T.top];
    return row ? row.charAt(x) : (y < T.top ? '#' : 'w');
  }
  function kitOpen(x, y) { return x >= 0 && x < KIT_TOWN.w && '#fw'.indexOf(kitCell(x, y)) < 0 && kitCell(x, y) !== ''; }
  function kitZone(x, y) { return y >= KIT_TOWN.parkRow && x <= KIT_TOWN.parkEast ? 'park' : 'street'; }
  /* The nearest open cell to (x, y) in the given part of town, breadth first in a fixed order. */
  function kitSnap(x, y, zone) {
    var seen = {}, q = [[x, y]];
    while (q.length) {
      var c = q.shift(), k = c[0] + ',' + c[1];
      if (seen[k] || c[0] < 0 || c[1] < 0 || c[0] >= KIT_TOWN.w || c[1] >= KIT_TOWN.h) continue;
      seen[k] = true;
      if (kitOpen(c[0], c[1]) && kitZone(c[0], c[1]) === zone) return { x: c[0], y: c[1] };
      q.push([c[0], c[1] - 1], [c[0] + 1, c[1]], [c[0], c[1] + 1], [c[0] - 1, c[1]]);
    }
    return { x: KIT_TOWN.portals.park.x, y: KIT_TOWN.portals.park.y };
  }
  /* The shortest walk between two cells of the frozen town, as the cells in order. */
  function kitRoute(a, b) {
    var prev = {}, q = [a], key = function (c) { return c.x + ',' + c.y; };
    prev[key(a)] = null;
    while (q.length) {
      var c = q.shift();
      if (c.x === b.x && c.y === b.y) break;
      [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(function (d) {
        var n = { x: c.x + d[0], y: c.y + d[1] };
        if (prev[key(n)] !== undefined || !kitOpen(n.x, n.y)) return;
        prev[key(n)] = c; q.push(n);
      });
    }
    if (prev[key(b)] === undefined) return [a];
    var out = [], at = b;
    while (at) { out.unshift(at); at = prev[key(at)]; }
    return out;
  }
  function kitPlace(x, y, from) {
    var s = KIT_TOWN.spots[x + ',' + y];
    if (from === 'park' && s) return { x: s[0], y: s[1], dir: s[2] };
    if (from === 'park') return kitSnap(Math.round(2 + x * 2.4), 16 + Math.round(y / 9), 'park');
    return kitSnap(Math.round(2 + x * 2.2), 11 + Math.max(0, Math.min(3, y - 3)), 'street');
  }
  S.WORLD_MIGRATIONS['d7dfa67e'] = function (save) {
    var state = save.state, T = KIT_TOWN;
    (state.objects || []).forEach(function (o) {
      if (o.location !== 'park' && o.location !== 'street') return;
      var at = kitPlace(o.x, o.y, o.location);
      if (!T.spots[o.x + ',' + o.y] && !kitOpen(at.x, at.y)) at = kitSnap(at.x, at.y, 'park');
      Object.keys(o.anchors || {}).forEach(function (k) {
        var a = o.anchors[k], n = kitPlace(a.x, a.y, o.location);
        o.anchors[k] = { x: n.x, y: n.y, dir: n.dir || a.dir };
      });
      o.x = at.x; o.y = at.y;
      o.location = kitZone(at.x, at.y);
      if (o.id === 'obj_bench') { o.anchors = deepCopy(T.bench.anchors); o.moreAnchors = deepCopy(T.bench.moreAnchors); }
    });
    Object.keys(state.characters || {}).forEach(function (id) {
      var c = state.characters[id];
      if (c.location !== 'park' && c.location !== 'street') return;
      var act = c.activity;
      if (c.transit && act && act.actionId === 'travel') {
        var start = c.transit.from === 'park' || !T.portals[c.transit.from] ? kitPlace(c.pos.x, c.pos.y, c.location) : T.portals[c.transit.from];
        var end = T.portals[c.transit.to] || T.portals.park;
        var route = kitRoute({ x: start.x, y: start.y }, { x: end.x, y: end.y });
        var left = Math.max(0, (act.plannedMinutes || 0) - (act.elapsed || 0)) * 3;
        var at = route[Math.max(0, route.length - 1 - left)];
        c.pos = { x: at.x, y: at.y, dir: c.pos.dir };
        c.walkTarget = { x: end.x, y: end.y };
      } else {
        var from = c.location, p = kitPlace(c.pos.x, c.pos.y, from);
        c.pos = { x: p.x, y: p.y, dir: p.dir || c.pos.dir };
        if (c.walkTarget) {
          var t = kitPlace(c.walkTarget.x, c.walkTarget.y, from);
          c.walkTarget = { x: t.x, y: t.y, dir: t.dir || c.walkTarget.dir };
        }
      }
      c.location = kitZone(c.pos.x, c.pos.y);
    });
    save.world = T.world;
    return save;
  };

  /* 98626395 -> c0e11a4d: the second place to work behind the café counter
   * moved from 5,2, which is behind the pastry case (only a hat showed), to
   * 4,2. The counter's spare work spots are rewritten, and whoever was
   * working from the old spot, or walking to it, is on the new one. Nothing
   * else moved. Written against test/fixtures/save-town-98626395-second-barista.json. */
  var COUNTER_C0E11A4D = { work_shift: [{ x: 4, y: 2, dir: 'down' }], work_extra_shift: [{ x: 4, y: 2, dir: 'down' }] };
  S.WORLD_MIGRATIONS['98626395'] = function (save) {
    var state = save.state;
    (state.objects || []).forEach(function (o) {
      if (o.id !== 'obj_counter' || !o.moreAnchors) return;
      Object.keys(COUNTER_C0E11A4D).forEach(function (k) { o.moreAnchors[k] = deepCopy(COUNTER_C0E11A4D[k]); });
    });
    Object.keys(state.characters || {}).forEach(function (id) {
      var c = state.characters[id];
      if (c.location !== 'cafe') return;
      if (c.pos.x === 5 && c.pos.y === 2) c.pos = { x: 4, y: 2, dir: c.pos.dir };
      if (c.walkTarget && c.walkTarget.x === 5 && c.walkTarget.y === 2) c.walkTarget = { x: 4, y: 2, dir: c.walkTarget.dir };
    });
    save.world = 'c0e11a4d';
    return save;
  };

  /* ---------------- serialise ---------------- */

  S.serialize = function (sim) {
    if (!sim || !sim.state) throw new Error('serialize needs a Sim');

    /* The save owns its facts. The state is copied, never referenced, and the
     * single normalisation — dropping pending decisions — is applied to the
     * copy only, so the live sim keeps the question its provider is holding. */
    var state = deepCopy(sim.state);
    var reissue = [];
    Object.keys(state.characters || {}).forEach(function (id) {
      var pending = state.characters[id].pending;
      if (pending) {
        var rec = sim.requests[pending.requestId];
        /* The question as it was asked — when, what was on offer, the key an
         * answer is judged by. A question can stay open for minutes while
         * people walk, so the world at the save is not the world it was asked
         * in; the same question must be put, and answered the same way. */
        var q = rec && rec.request;
        var asked = q ? { day: q.day, minute: q.minute, clock: q.clock, absMinute: q.absMinute,
                          relevanceKey: q.relevanceKey, candidates: deepCopy(q.candidates) } : null;
        reissue.push({ actorId: id, seq: pending.seq, issuedAbs: pending.issuedAbs, asked: asked,
                       reason: (rec && rec.request.context && rec.request.context.reason) || 'idle' });
      }
      state.characters[id].pending = null;
    });
    reissue.sort(function (a, b) { return a.seq - b.seq; });

    return {
      format: S.FORMAT,
      world: LT.World.fingerprint(),
      /* The content packages this world actually uses, by version of their
       * definitions. What state their objects are in is not part of this. */
      content: LT.Content.usedBy(state),
      reissue: reissue,
      savedAt: sim.stamp(),
      seed: sim.seed,
      policies: deepCopy(sim.policies || {}),
      eventSeq: sim.eventSeq,
      requestSeq: sim.requestSeq,
      loads: sim.loads || 0,
      rngState: sim.rng.getState(),
      /* JSON cannot hold Infinity, and a decision timeout of Infinity is a
       * meaningful setting: "wait for this policy for ever". */
      decisionTimeoutMinutes: sim.decisionTimeoutMinutes === Infinity
        ? 'Infinity' : sim.decisionTimeoutMinutes,
      rejections: deepCopy(sim.rejections || []),
      state: state,
      integrity: {
        events: state.events.length,
        version: state.version,
        characters: Object.keys(state.characters).sort()
      }
    };
  };

  S.toJSON = function (sim) { return JSON.stringify(S.serialize(sim)); };

  /* ---------------- deserialise ---------------- */

  /* Walk the migration chain until the save claims the current format. A
   * migration that does not change the format cannot make progress and is
   * refused, so a broken hook can never spin the loader. */
  function upgrade(saved) {
    if (!saved || typeof saved !== 'object') {
      throw new Error('unsupported save format: ' + saved);
    }
    var guard = 0;
    while (saved.format !== S.FORMAT) {
      var migrate = S.MIGRATIONS[saved.format];
      if (!migrate) throw new Error('unsupported save format: ' + saved.format);
      var before = saved.format;
      saved = migrate(saved);
      if (!saved || typeof saved !== 'object' || saved.format === before) {
        throw new Error('unsupported save format: ' + before);
      }
      if (++guard > 1000) throw new Error('unsupported save format: ' + saved.format);
    }
    return saved;
  }

  function verify(saved) {
    var integrity = saved.integrity, state = saved.state, detail = null;
    if (!integrity || typeof integrity !== 'object') detail = 'missing integrity block';
    else if (!state || typeof state !== 'object') detail = 'missing state';
    else if (!Array.isArray(state.events)) detail = 'state has no event log';
    else if (integrity.events !== state.events.length) {
      detail = 'events ' + integrity.events + ' != ' + state.events.length;
    } else if (integrity.version !== state.version) {
      detail = 'version ' + integrity.version + ' != ' + state.version;
    } else if (!Array.isArray(integrity.characters) ||
               JSON.stringify(integrity.characters) !==
                 JSON.stringify(Object.keys(state.characters || {}).sort())) {
      detail = 'characters do not match the character table';
    }
    if (detail) throw new Error('save integrity check failed: ' + detail);
  }

  /* The town may have moved on since the save was written. */
  function fitWorld(saved) {
    var here = LT.World.fingerprint(), guard = 0;
    while (saved.world !== here) {
      var migrate = S.WORLD_MIGRATIONS[saved.world];
      if (!migrate) {
        throw new Error('this save was made in a different version of the town (' +
          (saved.world || 'unrecorded') + '; this build is ' + here + ') and there is no migration for it. ' +
          'Rooms or furniture have changed, so saved positions cannot be trusted. The save has not been modified.');
      }
      var before = saved.world;
      saved = migrate(deepCopy(saved));
      if (!saved || saved.world === before || ++guard > 100) {
        throw new Error('the town migration from ' + before + ' made no progress; the save has not been loaded');
      }
    }
    return saved;
  }

  /* Identity, place and policy: every reference the restored world will follow
   * on its first tick, checked now, with the person and the problem named. */
  function verifyWorld(saved, policies) {
    var W = LT.World, state = saved.state, problems = [];
    Object.keys(state.characters).forEach(function (id) {
      var c = state.characters[id];
      if (!c.name) problems.push(id + ' has no name');
      if (LT.Appearance && !LT.Appearance.LOOKS[c.appearanceId]) {
        problems.push(id + ' has the look "' + c.appearanceId + '", which this build cannot draw');
      }
      var loc = W.LOCATIONS[c.location];
      if (!loc) { problems.push(id + ' is in "' + c.location + '", which is not a place in this town'); return; }
      var spots = [['stands', c.pos]];
      if (c.walkTarget) spots.push(['is walking to', c.walkTarget]);
      spots.forEach(function (s) {
        var p = s[1], row = p && loc.rows[p.y], ch = row && row.charAt(p.x);
        if (!ch || W.isSolid(ch)) problems.push(id + ' ' + s[0] + ' ' + (p ? p.x + ',' + p.y : 'nowhere') + ' in ' + c.location + ', which is not floor');
      });
      var policyId = policies[id] || c.policyId;
      if (!LT.Policy.get(policyId)) problems.push(id + ' is decided by the policy "' + policyId + '", which is not registered');
    });
    /* Things. The town's own furniture is known by id; everything else was
     * brought by a content package, which says what a sound instance is. A
     * book half read or a parcel already opened is a sound instance: state
     * never makes a save incompatible, only a definition this build lacks. */
    Object.keys(saved.content || {}).forEach(function (pkg) {
      var have = LT.Content.version(pkg);
      if (!have) problems.push('this world uses the content package "' + pkg + '" (' + saved.content[pkg] + '), which this build does not have');
      else if (have !== saved.content[pkg]) problems.push('this world was saved with "' + pkg + '" ' + saved.content[pkg] + ' and this build has ' + have + ', with no migration between them');
    });
    var env = {
      state: state,
      reachable: function (locationId, spot) {
        var loc = W.LOCATIONS[locationId];
        return !!loc && LT.Sim.Sim.prototype.routeLength.call(null, loc, loc.spawn, spot) >= 0;
      }
    };
    var seen = {};
    (state.objects || []).forEach(function (o) {
      if (seen[o.id]) problems.push('there are two things with the id "' + o.id + '"');
      seen[o.id] = true;
      if (!o.typeId) {
        if (!W.OBJECTS.some(function (w) { return w.id === o.id; })) problems.push('"' + o.id + '" is neither part of this town nor of any content package');
        return;
      }
      var bad = LT.Content.validateObject(o, env);
      if (bad) problems.push('the ' + (o.name || o.typeId) + ' "' + o.id + '" ' + bad);
    });
    (state.interventions || []).forEach(function (r) {
      if (r.status === 'scheduled' && !LT.Interventions.get(r.type)) problems.push('a scheduled "' + r.type + '" cannot be applied by this build');
    });

    (saved.reissue || []).forEach(function (r) {
      if (!state.characters[r.actorId]) problems.push('a decision is to be re-asked for ' + r.actorId + ', who is not in the save');
    });
    if (problems.length) throw new Error('save refused: ' + problems.join('; ') + '. The save has not been modified.');
  }

  S.deserialize = function (saved, opts) {
    opts = opts || {};
    saved = upgrade(saved);
    verify(saved);
    saved = fitWorld(saved);
    verify(saved);

    var policies = opts.policies ? deepCopy(opts.policies) : deepCopy(saved.policies || {});
    verifyWorld(saved, policies);

    /* The Sim constructor runs world generation, which draws names and looks
     * from the current pools. None of that survives: the whole generated state
     * is replaced below with the saved one, so a restore can never re-name
     * anybody even if the pools have changed. */
    var sim = LT.Sim.create({ seed: saved.seed, policies: policies });

    sim.state = deepCopy(saved.state);
    sim.seed = saved.seed;
    sim.policies = policies;
    sim.rng.setState(saved.rngState);
    sim.eventSeq = saved.eventSeq;
    sim.requestSeq = saved.requestSeq;
    sim.loads = (saved.loads || 0) + 1;
    sim.rejections = deepCopy(saved.rejections || []);
    sim.decisionTimeoutMinutes = saved.decisionTimeoutMinutes === 'Infinity'
      ? Infinity : saved.decisionTimeoutMinutes;
    /* Neither the question table nor the answer queue is restored: see the
     * note at the top of this file. */
    sim.requests = {};
    sim.inbox = [];
    sim.listeners = [];

    /* The scheduler reads sim.scheduledInterventions; the state carries the
     * same records in state.interventions. One list, two references, so an
     * intervention scheduled before the save still fires and its status change
     * is visible in state. */
    sim.scheduledInterventions = sim.state.interventions;

    /* An override changes which policy answers for an actor, and the sim reads
     * the actor's own policyId, so the restored characters must be relabelled
     * too, not just the bookkeeping map. */
    Object.keys(sim.state.characters || {}).forEach(function (id) {
      if (policies[id]) sim.state.characters[id].policyId = policies[id];
    });

    /* The questions that were open when the save was written, put again in
     * the order they were first asked. See the note at the top of this file. */
    (saved.reissue || []).forEach(function (r) {
      var actor = sim.state.characters[r.actorId];
      /* Someone with nothing in hand — or someone mid-talk who had been asked
       * whether to carry on: that question is put to a person who is busy. */
      var midTalk = r.reason === 'conversation_turn' && !!sim.openTurnOf(actor);
      /* A turn question whose talk is no longer going is not that question any
       * more: the person is simply someone with nothing in hand. */
      var reason = (r.reason === 'conversation_turn' && !midTalk) ? 'idle' : r.reason;
      if ((!actor.activity || midTalk) && !actor.pending) sim.requestDecision(actor, reason, r.seq, r.issuedAbs, r.asked || undefined);
    });

    return sim;
  };

  S.fromJSON = function (text, opts) { return S.deserialize(JSON.parse(text), opts); };

  /* ---------------- browser storage ----------------
   * Four different answers, never folded into one another:
   *   none         there is no save
   *   loaded       there is one, and here is the town
   *   refused      there is one and it cannot be used; `reason` says why, and
   *                it is still where it was
   *   unavailable  the storage itself could not be read — which is not the
   *                same as there being nothing in it
   * Nothing here starts a new world or deletes anything. */
  function storageOf() {
    try { return { storage: root.localStorage || null, reason: root.localStorage ? null : 'this browser offers no local storage here' }; }
    catch (e) { return { storage: null, reason: 'local storage is blocked: ' + String(e && e.message || e) }; }
  }

  S.peekLocal = function (key) {
    var st = storageOf();
    if (!st.storage) return { status: 'unavailable', reason: st.reason };
    try {
      var text = st.storage.getItem(key || S.DEFAULT_KEY);
      return text ? { status: 'present', bytes: text.length } : { status: 'none' };
    } catch (e) { return { status: 'unavailable', reason: 'local storage could not be read: ' + String(e && e.message || e) }; }
  };

  S.writeLocal = function (sim, key) {
    var st = storageOf();
    if (!st.storage) return { ok: false, status: 'unavailable', reason: st.reason };
    var text;
    try { text = S.toJSON(sim); } catch (e) { return { ok: false, status: 'failed', reason: 'the world could not be serialised: ' + String(e && e.message || e) }; }
    try {
      st.storage.setItem(key || S.DEFAULT_KEY, text);
      /* A write that did not throw is not yet a save: read it back. */
      if (st.storage.getItem(key || S.DEFAULT_KEY) !== text) return { ok: false, status: 'failed', reason: 'the save did not read back as written' };
      return { ok: true, status: 'saved', bytes: text.length, savedAt: sim.stamp() };
    } catch (e) {
      return { ok: false, status: 'failed', reason: 'local storage refused the write: ' + String(e && (e.name || e.message) || e) };
    }
  };

  S.readLocal = function (key, opts) {
    var st = storageOf(), text;
    if (!st.storage) return { status: 'unavailable', sim: null, reason: st.reason };
    try { text = st.storage.getItem(key || S.DEFAULT_KEY); }
    catch (e) { return { status: 'unavailable', sim: null, reason: 'local storage could not be read: ' + String(e && e.message || e) }; }
    if (!text) return { status: 'none', sim: null, reason: null };
    try {
      return { status: 'loaded', sim: S.fromJSON(text, opts), reason: null };
    } catch (e) {
      return { status: 'refused', sim: null, reason: String(e && e.message || e) };
    }
  };
})();
