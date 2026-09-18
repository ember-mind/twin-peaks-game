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

  V.NATIVE = { width: VW, height: VH, tile: TILE };

  function View(canvas, sim) {
    this.sim = sim;
    this.canvas = canvas;
    this.ctx = EMBER.Viewport.attachNative(canvas, VW, VH);
    this.camX = 0; this.camY = 0; this.camSnap = true;
    /* Whoever the world generated first; the view never names anybody. */
    this.focusId = sim.actorIds()[0];
    this.render = {};      // actorId -> { x, y, phaseT, dir }
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
      r = this.render[c.id] = { x: c.pos.x * TILE, y: c.pos.y * TILE, dir: c.pos.dir, phaseT: 0, moving: false };
    }
    return r;
  };

  /* dt in real milliseconds. Smoothing only. */
  View.prototype.update = function (dt) {
    var state = this.sim.state, self = this;
    this.sim.actorIds().forEach(function (id) {
      var c = state.characters[id];
      var r = self.renderStateFor(c);
      var tx = c.pos.x * TILE, ty = c.pos.y * TILE;
      var dx = tx - r.x, dy = ty - r.y;
      var dist = Math.abs(dx) + Math.abs(dy);
      if (dist > 48) { r.x = tx; r.y = ty; }   // a scene change is a cut, not a slide
      else {
        r.x = EMBER.Math.approach(r.x, tx, dt, 0.010);
        r.y = EMBER.Math.approach(r.y, ty, dt, 0.010);
      }
      r.moving = dist > 1.2;
      r.dir = c.pos.dir || r.dir;
      if (r.moving) r.phaseT += dt * 0.006;
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

  View.prototype.draw = function () {
    var g = this.ctx;
    if (!g) return;
    var locId = this.visibleLocation();
    var loc = LT.World.LOCATIONS[locId];
    var Art = LT.Art;
    var cx = Math.round(this.camX), cy = Math.round(this.camY);

    g.fillStyle = Art.palette.ink;
    g.fillRect(0, 0, VW, VH);

    var opts = { indoor: !!loc.indoor, locationId: locId, minute: this.sim.state.minute };
    EMBER.Tilemap.paintWindow(g, {
      rows: loc.rows, width: loc.rows[0].length, height: loc.rows.length, tile: TILE,
      camX: cx, camY: cy, viewW: VW, viewH: VH, overdraw: 1
    }, function (ctx, ch, sx, sy, mx, my, rows) {
      Art.drawCell(ctx, ch, sx, sy, mx, my, rows, opts);
    });

    var ents = this.charactersHere(locId).map(function (e) {
      return {
        id: e.character.id, sprite: e.character.sprite,
        wx: Math.round(e.render.x), wy: Math.round(e.render.y),
        dir: e.render.dir, moving: e.render.moving,
        phase: EMBER.Grid.walkPhase(e.render.phaseT % 1)
      };
    });
    EMBER.Tilemap.depthSort(ents);
    ents.forEach(function (e) {
      Art.drawCharacter(g, e.sprite, e.wx - cx, e.wy - cy - (CH_H - TILE), e.dir,
                        e.moving ? e.phase : 0, { moving: e.moving, alpha: 1 });
    });

    this.drawActivityMarks(g, cx, cy, ents);
    return { location: locId, entities: ents.length };
  };

  /* A viewer must be able to tell working from resting without reading a label.
   * These are modest marks over the actor, not a second UI. */
  View.prototype.drawActivityMarks = function (g, cx, cy, ents) {
    var state = this.sim.state, Art = LT.Art;
    var MARK = {
      work_shift: '#e2c15a', work_extra_shift: '#e2c15a',
      practise_guitar: '#8fb3e0', talk_with: '#e08f9c', greet: '#e08f9c',
      sleep: '#7f8bb0', eat_at_home: '#9fc16a', buy_meal: '#9fc16a',
      sit_and_rest: '#9aa39a', take_break: '#9aa39a'
    };
    ents.forEach(function (e) {
      var c = state.characters[e.id];
      if (!c.activity) return;
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
