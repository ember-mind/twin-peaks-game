/* lt-view.js — Living Town: drawing the world.
 *
 * A projection, strictly. Nothing here writes to simulation state; the only
 * thing the view owns is where a sprite is between two authoritative tile
 * positions, which is a smoothing concern and not a fact about the world.
 *
 * Rendering is the Ember Engine's, the same code Twin Peaks runs.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  var EMBER = root.EMBER;
  var V = LT.View = LT.View || {};

  var VW = 256, VH = 192, TILE = 16;
  var CH_W = 16, CH_H = 24;
  var WALK_PX_PER_MS = 0.08;   // a tile in 200 ms: just ahead of one tile per minute at 1x
  var MAX_TRAIL = 6;           // tiles a sprite may lag before it is cut forward

  V.NATIVE = { width: VW, height: VH, tile: TILE };

  function View(canvas, sim) {
    this.sim = sim;
    this.canvas = canvas;
    this.ctx = EMBER.Viewport.attachNative(canvas, VW, VH);
    this.camX = 0; this.camY = 0; this.camSnap = true;
    /* Whoever the world generated first; the view never names anybody. */
    this.focusId = sim.actorIds()[0];
    this.render = {};      // actorId -> { x, y, phaseT, dir }
    this.sceneMaps = {};   // locationId -> the scene object handed to the production painter
    this.clock = 0;        // seconds of view time, for the renderer's own animation
    this.lastLocation = null;
  }

  View.prototype.focus = function (actorId) {
    if (this.focusId !== actorId) { this.focusId = actorId; this.camSnap = true; }
  };

  View.prototype.focusedCharacter = function () {
    return this.sim.state.characters[this.focusId] || this.sim.state.characters[this.sim.actorIds()[0]];
  };

  /* The scene shown is wherever the followed character canonically is. It is a
   * camera move: nobody is created, reset or removed by looking elsewhere. */
  View.prototype.visibleLocation = function () {
    return this.focusedCharacter().location;
  };

  View.prototype.charactersHere = function (locationId) {
    var state = this.sim.state, out = [];
    var self = this;
    this.sim.actorIds().forEach(function (id) {
      var c = state.characters[id];
      if (c.location !== locationId) return;
      out.push({ character: c, render: self.renderStateFor(c) });
    });
    return out;
  };

  View.prototype.renderStateFor = function (c) {
    var r = this.render[c.id];
    if (!r) {
      r = this.render[c.id] = { dir: c.pos.dir, phaseT: 0, trail: [] };
      cut(r, c);
    }
    return r;
  };

  /* Put the sprite where the person is, now. */
  function cut(r, c) {
    r.location = c.location;
    r.seenX = r.tx = r.mx = c.pos.x;
    r.seenY = r.ty = r.my = c.pos.y;
    r.x = c.pos.x * TILE; r.y = c.pos.y * TILE;
    r.moving = false; r.moveT = 0; r.trail = [];
  }

  /* What the view remembers between frames is the list of tiles the simulation
   * has already put someone on and the sprite has not yet reached. It is read
   * off state after a tick, never computed: the view does not route anybody.
   * The observer calls this after every tick, so at 20x — more than one tile a
   * frame — the sprite still goes round the counter the way the person did
   * instead of sliding across its corner. */
  View.prototype.observe = function () {
    var state = this.sim.state, self = this;
    this.sim.actorIds().forEach(function (id) {
      var c = state.characters[id];
      var r = self.renderStateFor(c);
      if (r.location !== c.location) { cut(r, c); return; }   // another place: a cut, however near the numbers are
      if (c.pos.x === r.seenX && c.pos.y === r.seenY) return;
      if (Math.abs(c.pos.x - r.seenX) + Math.abs(c.pos.y - r.seenY) !== 1) {
        cut(r, c);                                // steps the view never saw: cut, do not invent a route
        return;
      }
      r.seenX = c.pos.x; r.seenY = c.pos.y;
      r.trail.push({ x: c.pos.x, y: c.pos.y });
      if (r.trail.length > MAX_TRAIL) {           // far behind: cut forward along the walked route
        var at = r.trail[r.trail.length - MAX_TRAIL - 1];
        r.tx = r.mx = at.x; r.ty = r.my = at.y; r.moving = false; r.moveT = 0;
        r.x = at.x * TILE; r.y = at.y * TILE;
        r.trail = r.trail.slice(-MAX_TRAIL);
      }
    });
  };

  /* dt in real milliseconds. Smoothing only: each tile of the trail is one
   * step of the engine's grid mover, the same one Twin Peaks walks with. */
  View.prototype.update = function (dt) {
    var state = this.sim.state, self = this;
    this.clock += dt / 1000;
    this.observe();
    this.sim.actorIds().forEach(function (id) {
      var c = state.characters[id];
      var r = self.renderStateFor(c);
      var left = dt, walked = false, dir = null;
      while (left > 0 && (r.moving || r.trail.length)) {
        if (!r.moving) {
          var next = r.trail.shift();
          r.mx = next.x; r.my = next.y; r.moveT = 0; r.moving = true;
        }
        dir = r.mx > r.tx ? 'right' : r.mx < r.tx ? 'left' : r.my > r.ty ? 'down' : 'up';
        var speed = WALK_PX_PER_MS * (1 + r.trail.length);      // hurry when behind
        var slice = Math.min(left, (1 - r.moveT) * TILE / speed);
        var fromX = r.tx, fromY = r.ty;
        var step = EMBER.Grid.advanceStep(r, slice + 1e-9, { tile: TILE, speed: speed });
        r.x = (fromX + (r.mx - fromX) * step.ease) * TILE;
        r.y = (fromY + (r.my - fromY) * step.ease) * TILE;
        left -= slice; walked = true;
      }
      r.walking = walked || r.moving || r.trail.length > 0;
      r.dir = (r.walking && dir) || c.pos.dir || r.dir;
      if (r.walking) r.phaseT += dt * 0.006;
      else r.phaseT = 0;
    });

    var loc = LT.World.LOCATIONS[this.visibleLocation()];   // grid only; the name lives in state
    if (this.lastLocation !== loc.id) { this.lastLocation = loc.id; this.camSnap = true; }
    var focus = this.renderStateFor(this.focusedCharacter());
    var target = EMBER.Camera.centerOn(focus.x, focus.y, {
      anchorX: TILE / 2, anchorY: TILE / 2,
      worldW: loc.rows[0].length * TILE, worldH: loc.rows.length * TILE,
      viewW: VW, viewH: VH
    });
    if (this.camSnap) { this.camX = target.x; this.camY = target.y; this.camSnap = false; }
    else {
      this.camX = EMBER.Camera.approach(this.camX, target.x, dt, 0.012);
      this.camY = EMBER.Camera.approach(this.camY, target.y, dt, 0.012);
    }
  };

  /* A location with `visual` content is drawn by the production renderer once
   * it is installed and its character sheet has decoded. */
  View.prototype.productionScene = function (loc) {
    var H = LT.ProductionHost, GAME = root.GAME;
    if (!loc.visual || !H || !H.ready || !GAME || !GAME.sprites) return null;
    var scene = this.sceneMaps[loc.id];
    if (!scene) {
      scene = this.sceneMaps[loc.id] = {
        id: loc.visual.scene, indoor: !!loc.indoor, rows: loc.rows,
        width: loc.rows[0].length, height: loc.rows.length
      };
    }
    return scene;
  };

  /* Who draws the people is a separate question from who draws the room. An
   * inhabitant is the same person in the café and on the street, so they come
   * off the same sheet in both: the look the world generated for them, kept in
   * state. 'placeholder' only happens while that sheet is still decoding, and
   * even then the colours are the look's own, never somebody's id. */
  View.prototype.inhabitantRenderer = function () {
    var H = LT.ProductionHost, GAME = root.GAME;
    return (H && H.ready && GAME && GAME.Sprites && GAME.Sprites.drawChar) ? 'atlas' : 'placeholder';
  };

  View.prototype.drawInhabitant = function (g, e, cx, cy, mapId, how) {
    if (how === 'atlas') {
      root.GAME.Sprites.drawChar(g, e.wx - cx, e.wy - cy, LT.ProductionHost.looks[e.sheetId], e.dir,
        e.phase, 1, e.moving, false, this.clock,
        { mapId: mapId, wx: e.wx, wy: e.wy, npcId: e.id, characterLife: null });
      return;
    }
    LT.Art.drawCharacter(g, LT.Appearance.spec(e.sheetId), e.wx - cx, e.wy - cy - (CH_H - TILE), e.dir,
                         e.moving ? e.phase : 0, { moving: e.moving, alpha: 1 });
  };

  /* The production room: the shared interior painter, with the shared
   * depth-band pass between people so the counter covers whoever is behind it
   * and nobody in front. */
  View.prototype.drawProductionRoom = function (g, scene, ents, cx, cy, how) {
    var GAME = root.GAME, self = this;
    var opts = { mapId: scene.id, indoor: true, viewportWidth: VW, viewportHeight: VH, t: this.clock };
    GAME.sprites.drawStructures(g, scene, cx, cy, opts);
    EMBER.Tilemap.paintDepthBands(ents, TILE, function (e) {
      self.drawInhabitant(g, e, cx, cy, scene.id, how);
    }, function (footY, nextFootY, afterIndex) {
      if (afterIndex < 0) return;
      GAME.sprites.drawForegroundStructures(g, scene, cx, cy, {
        mapId: scene.id, indoor: true, viewportWidth: VW, viewportHeight: VH,
        forestDepthMin: footY, forestDepthMax: nextFootY
      });
    });
  };

  View.prototype.drawTemporaryPlace = function (g, loc, ents, cx, cy, how) {
    var Art = LT.Art, self = this;
    g.fillStyle = Art.palette.ink;
    g.fillRect(0, 0, VW, VH);
    var opts = { indoor: !!loc.indoor, locationId: loc.id, minute: this.sim.state.minute };
    EMBER.Tilemap.paintWindow(g, {
      rows: loc.rows, width: loc.rows[0].length, height: loc.rows.length, tile: TILE,
      camX: cx, camY: cy, viewW: VW, viewH: VH, overdraw: 1
    }, function (ctx, ch, sx, sy, mx, my, rows) {
      Art.drawCell(ctx, ch, sx, sy, mx, my, rows, opts);
    });
    /* Never a production map id: no room lighting is borrowed for a place that has none. */
    ents.forEach(function (e) { self.drawInhabitant(g, e, cx, cy, 'lt_temporary', how); });
    this.drawActivityMarks(g, cx, cy, ents);
  };

  View.prototype.draw = function () {
    var g = this.ctx;
    if (!g) return;
    var locId = this.visibleLocation();
    var loc = LT.World.LOCATIONS[locId];
    var cx = Math.round(this.camX), cy = Math.round(this.camY);
    var ents = this.entitiesAt(locId);
    var how = this.inhabitantRenderer();
    var scene = this.productionScene(loc);
    if (scene) this.drawProductionRoom(g, scene, ents, cx, cy, how);
    else this.drawTemporaryPlace(g, loc, ents, cx, cy, how);
    return { location: locId, entities: ents.length,
             environment: scene ? 'production' : 'temporary', inhabitants: how };
  };

  /* Depth-sorted projections of whoever the simulation says is here. */
  View.prototype.entitiesAt = function (locId) {
    var ents = this.charactersHere(locId).map(function (e) {
      return {
        id: e.character.id, sheetId: LT.Appearance.sheetIdFor(e.character),
        wx: Math.round(e.render.x), wy: Math.round(e.render.y),
        dir: e.render.dir, moving: e.render.walking,
        phase: EMBER.Grid.walkPhase(e.render.phaseT % 1)
      };
    });
    return EMBER.Tilemap.depthSort(ents);
  };

  /* A viewer must be able to tell working from resting without reading a label.
   * These are modest marks over the actor, not a second UI. */
  View.prototype.drawActivityMarks = function (g, cx, cy, ents) {
    var state = this.sim.state, Art = LT.Art;
    var MARK = {
      work_shift: '#e2c15a', work_extra_shift: '#e2c15a',
      practise_guitar: '#8fb3e0', talk_with: '#e08f9c', join_conversation: '#e08f9c', greet: '#e08f9c',
      sleep: '#7f8bb0', eat_at_home: '#9fc16a', buy_meal: '#9fc16a',
      sit_and_rest: '#9aa39a', take_break: '#9aa39a'
    };
    ents.forEach(function (e) {
      var c = state.characters[e.id];
      /* The mark says what someone is doing, so it appears when they are
       * doing it — not while they are still walking over to it. */
      if (!c.activity || c.activity.phase !== 'executing') return;
      var colour = MARK[c.activity.actionId];
      if (!colour) return;
      var x = e.wx - cx + 6, y = e.wy - cy - (CH_H - TILE) - 6;
      g.fillStyle = Art.palette.ink;
      g.fillRect(x - 1, y - 1, 6, 6);
      g.fillStyle = colour;
      g.fillRect(x, y, 4, 4);
    });
  };

  V.create = function (canvas, sim) { return new View(canvas, sim); };
  V.View = View;
})();
