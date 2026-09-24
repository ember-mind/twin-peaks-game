/* lt-kit-town.js — Living Town: the town outside, drawn by the shared engine.
 *
 * The street and the park are one map made of the village kit
 * (proto/town-kit, proto/town-map/town.json). The engine draws it — ground,
 * houses, water, lamps, doors, the hour's light (engine/ember-worldview.js) —
 * and this file hands it the people: where the simulation says each one is,
 * drawn with the production character renderer and relit by the engine so
 * they stand in the kit's light. Nothing here reads or writes simulation
 * state beyond looking at it.
 *
 * The simulation's outdoor grid (lt-town.gen.js) is generated from the same
 * map, so a cell here is a tile there.
 *
 *   LT.KitTown.load(kitBase, mapUrl) -> Promise; LT.KitTown.ready afterwards
 *   LT.KitTown.draw(g, camX, camY, sim, people, things, opts)
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  var EMBER = root.EMBER;
  var K = LT.KitTown = LT.KitTown || {};
  var TILE = 16;

  K.ready = false;
  K.KIT = 'proto/town-kit/';
  K.MAP = 'proto/town-map/town.json';

  K.load = function (kitBase, mapUrl) {
    if (K.loading) return K.loading;
    var WM = EMBER && EMBER.WorldMap, WV = EMBER && EMBER.WorldView;
    if (!WM || !WV || typeof fetch !== 'function') return Promise.resolve(false);
    kitBase = kitBase || K.KIT; mapUrl = mapUrl || K.MAP;
    K.loading = Promise.all([fetch(mapUrl).then(function (r) { return r.json(); }), WV.loadKit(kitBase)]).then(function (r) {
      K.map = r[0];
      K.world = WM.build(K.map, r[1]);
      K.view = WV.create(K.world, r[1]);
      K.ready = true;
      return true;
    }).catch(function (e) { K.error = String(e && e.message || e); return false; });
    return K.loading;
  };

  /* The simulation's place ids for each building door on the map. Two places
   * behind one door (the flat over the café) light the same windows. */
  function placeOfLocation(locId) { return K.world && K.world.places[locId] ? locId : null; }

  /* A building is lit when someone is in it. */
  K.litPlaces = function (sim) {
    var lit = {};
    /* The café is lit while it is open, whoever is in it. */
    var cafe = LT.World.LOCATIONS.cafe, m = sim.state.minute;
    if (cafe && K.world.places.cafe && m >= cafe.opens && m < cafe.closes) lit.cafe = true;
    sim.actorIds().forEach(function (id) {
      var c = sim.state.characters[id];
      if (c.transit || LT.World.outdoorGrid(c.location)) return;
      /* A window is lit by someone awake behind it (audit: every window lit at 02:00). */
      if (c.activity && c.activity.actionId === 'sleep' && c.activity.phase === 'executing') return;
      var p = placeOfLocation(c.location);
      if (p) lit[p] = true;
      if (c.location === 'flat_c' && K.world.places.cafe) lit.cafe = true;
    });
    return lit;
  };

  /* A door stands open while someone is going through it: on the doorstep,
   * leaving or arriving. */
  K.doorOpenFor = function (sim) {
    var doors = {};
    Object.keys(LT.World.STREET_PORTALS).forEach(function (id) {
      if (!K.world.places[id] || !K.world.places[id].indoor) return;
      var d = LT.World.STREET_PORTALS[id];
      doors[id] = sim.actorIds().some(function (aid) {
        var c = sim.state.characters[aid];
        if (!LT.World.outdoorGrid(c.location)) return false;
        var near = c.pos.x === d.x && Math.abs(c.pos.y - d.y) <= 1;
        var through = c.transit && (c.transit.from === id || c.transit.to === id || (id === 'cafe' && (c.transit.from === 'flat_c' || c.transit.to === 'flat_c')));
        return near && !!through;
      });
    });
    return function (place) { return doors[place] ? 1 : 0; };
  };

  var AMBIENT = { day: [112, 108, 92], dusk: [64, 66, 78], night: [26, 34, 58] };
  var TINT = { day: [1.0, 0.99, 0.95], dusk: [0.9, 0.86, 0.88], night: [0.52, 0.58, 0.8] };
  var buf = null, bg = null;
  function buffer() {
    if (!buf && typeof document !== 'undefined') {
      buf = document.createElement('canvas'); buf.width = 48; buf.height = 48;
      bg = buf.getContext('2d', { willReadFrequently: true }); bg.imageSmoothingEnabled = false;
    }
    return bg;
  }

  /* Where someone sitting on a kit bench is drawn: on the seat above the
   * cell they sat down from, sorted where their feet are. Null when not seated. */
  function seatFor(sim, e) {
    if (!e.pose || e.pose.poseId !== 'seated' || e.moving) return null;
    var act = sim.state.characters[e.id].activity, obj = act && act.targetId && sim.objectById(act.targetId);
    if (!obj || !LT.World.outdoorGrid(obj.location)) return null;
    /* The kit bench's two seats, the one at the end they sat down from; sorted
     * in front of the bench, not behind its backrest. */
    var right = Math.round(e.wx / TILE) > obj.x;
    return { x: obj.x * TILE + TILE + (right ? 17 : 0), y: obj.y * TILE + 6, sortY: (obj.y + 1) * TILE + TILE - 3 };
  }

  /* One person as an engine actor. `drawPerson(g, e, x, y)` draws them with
   * the tile's top-left at (x, y) — the production renderer's convention. */
  /* Cells the map opens over the wall and the water (the jetty and its
   * steps): whoever stands there stands on the boards, drawn over them
   * (audit 2026-09-24: a reader on the jetty was not drawn at all). */
  function onBoards(e) {
    var tx = Math.round(e.wx / TILE), ty = Math.round(e.wy / TILE);
    return (K.map.walkable || []).some(function (c) { return c[0] === tx && c[1] === ty; });
  }

  function actor(sim, e, lit, drawPerson) {
    var seat = seatFor(sim, e);
    var fx = e.wx + TILE / 2, fy = e.wy + TILE - 3;
    return { sortY: seat ? seat.sortY : fy + (onBoards(e) ? 3 * TILE : 0), draw: function (g, camX, camY, l) {
      var sb = buffer(), V = EMBER.WorldView, view = K.view;
      var px = seat ? seat.x : fx, py = seat ? seat.y : fy;
      var sx = px - camX, sy = py - camY;
      if (!seat) { g.fillStyle = 'rgba(18,22,26,0.34)'; g.fillRect(sx - 6, sy - 1, 12, 3); g.fillRect(sx - 4, sy - 2, 8, 5); }
      if (!sb) { drawPerson(g, e, sx - TILE / 2, sy - TILE + 3); return; }
      sb.clearRect(0, 0, 48, 48);
      drawPerson(sb, e, 16, 16, seat);
      V.relight(sb, 48, 48, l.dark, view.lightsNear(px, py, lit), view.mix(AMBIENT, l), view.mix(TINT, l));
      g.drawImage(buf, sx - TILE / 2 - 16, sy + 3 - TILE - 16);
    } };
  }

  /* Things a package brought (a book on a bench, a wallet on the path) as
   * actors too, so the depth order is one. */
  function thingActor(e, drawThing) {
    return { sortY: e.py, draw: function (g, camX, camY) { drawThing(g, e, camX, camY); } };
  }

  K.draw = function (g, camX, camY, sim, people, things, opts) {
    if (!K.ready) return false;
    opts = opts || {};
    var lit = K.litPlaces(sim);
    var actors = people.map(function (e) { return actor(sim, e, lit, opts.drawPerson); })
      .concat(things.map(function (e) { return thingActor(e, opts.drawThing); }));
    K.view.draw(g, camX, camY, sim.state.minute + (opts.fraction || 0), {
      actors: actors, lit: lit, doorOpen: K.doorOpenFor(sim)
    });
    return true;
  };

  K.isSeated = function (sim, e) { return !!seatFor(sim, e); };
  K.seatOf = function (sim, e) { return seatFor(sim, e); };
})();
