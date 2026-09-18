/* lt-sim.js — Living Town: the authoritative simulation.
 *
 * One state object is the world. Everything a viewer sees is a projection of
 * it; nothing that renders may write back into it. Scene changes are camera
 * moves, not lifecycles: characters keep living whether or not anyone is
 * looking at them.
 *
 * The simulation owns validation, movement, travel time, resources, execution,
 * completion, interruption, failure and every mutation. A decision policy owns
 * exactly one thing: which of the offered candidates to take.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function') {
    if (!LT.Util) require('./lt-util.js');
    if (!LT.World) require('./lt-world.js');
    if (!LT.Actions) require('./lt-actions.js');
    if (!LT.Perception) require('./lt-perception.js');
    if (!LT.Policy) require('./policy/lt-policy.js');
    if (!LT.Names) require('./lt-names.js');
    if (!root.EMBER || !root.EMBER.Grid) require('../../engine/ember-grid.js');
  }
  var U = LT.Util, W = LT.World, A = LT.Actions, P = LT.Perception, Pol = LT.Policy;
  var EMBER = root.EMBER;

  var SALIENCE = {
    COMMITMENT_BROKEN: 1.0, GOAL_REACHED: 1.0, OFFER_ACCEPTED: 0.85,
    TALKED: 0.8, OFFER_RECEIVED: 0.7, OFFER_DECLINED: 0.7,
    COMMITMENT_KEPT: 0.6, WORKED_EXTRA: 0.6, PRACTISED: 0.5,
    WITHDREW: 0.4, GREETED: 0.3, WORKED: 0.25, SLEPT: 0.2,
    ATE: 0.15, RESTED: 0.15, BROKE: 0.1, ARRIVED: 0.1, DEPARTED: 0.1, PREPARED: 0.1
  };
  var MEMORY_THRESHOLD = 0.2;

  function deepCopy(v) { return JSON.parse(JSON.stringify(v)); }

  function Sim(opts) {
    opts = opts || {};
    this.seed = opts.seed === undefined ? 20260918 : opts.seed;
    this.rng = U.rng(this.seed);
    this.policies = opts.policies || {};       // actorId -> policy id
    this.eventSeq = 0;
    this.requestSeq = 0;
    this.requests = {};                        // requestId -> record
    this.inbox = [];
    this.rejections = [];                      // async-safety audit trail
    this.scheduledInterventions = [];
    this.state = this.freshState(opts);
    this.listeners = [];
  }

  Sim.prototype.freshState = function (opts) {
    var start = opts.start || W.START;
    var state = {
      version: 0,
      day: start.day, minute: start.minute,
      seed: this.seed,
      characters: {},
      locationNames: {},
      objects: deepCopy(W.OBJECTS),
      offers: [],
      events: [],
      interventions: []
    };
    var self = this;
    /* Names are drawn once, here, from a stream of their own so that adding a
     * random draw elsewhere in the simulation cannot change who lives in town.
     * From this point the name is authoritative state: nothing regenerates it,
     * and every other system addresses people by id. */
    var nextName = LT.Names.generator(U.rng((this.seed ^ 0x9e3779b9) >>> 0), opts.namePools);
    W.CHARACTERS.forEach(function (seed) {
      var c = deepCopy(seed);
      var drawn = nextName();
      c.name = drawn.name;
      c.familyName = drawn.familyName;
      c.fullName = drawn.fullName;
      c.activity = null;
      c.transit = null;
      c.pending = null;
      c.memories = [];
      c.recentDecisions = [];
      c.greetedToday = {};
      c.standing = { cafe: 100 };
      c.workedMinutes = 0;
      c.practiceMinutes = 0;
      c.policyId = self.policies[c.id] || c.policyId;
      var loc = W.LOCATIONS[c.location];
      if (loc && loc.spawn) c.pos = { x: loc.spawn.x, y: loc.spawn.y, dir: loc.spawn.dir };
      c.walkTarget = null;
      state.characters[c.id] = c;
    });
    /* Second pass: anything worded about another person, or about whose home a
     * place is, can only be resolved once everyone has a name. */
    Object.keys(W.LOCATIONS).forEach(function (id) {
      var loc = W.LOCATIONS[id];
      if (loc.nameTemplate && loc.resident && state.characters[loc.resident]) {
        state.locationNames[id] = loc.nameTemplate.replace('%s', state.characters[loc.resident].name);
      } else {
        state.locationNames[id] = loc.name || id;
      }
    });
    Object.keys(state.characters).forEach(function (id) {
      var c = state.characters[id];
      (c.commitments || []).forEach(function (k) { k.label = resolveLabel(k, state); });
      (c.goals || []).forEach(function (g) { g.label = resolveLabel(g, state); });
    });
    return state;
  };

  function resolveLabel(item, state) {
    if (!item.labelTemplate) return item.label;
    var otherId = item.withId || item.relatesTo;
    var other = otherId ? state.characters[otherId] : null;
    return item.labelTemplate.replace('%s', other ? other.name : 'someone');
  }

  /* ---------------- clocks and identity ---------------- */

  Sim.prototype.abs = function (day, minute) { return U.absolute(day, minute); };
  Sim.prototype.absMinute = function () { return U.absolute(this.state.day, this.state.minute); };
  Sim.prototype.stamp = function () { return U.stamp(this.state.day, this.state.minute); };
  Sim.prototype.touch = function () { this.state.version++; };
  Sim.prototype.actorIds = function () { return Object.keys(this.state.characters).sort(); };

  /* Place names live in state because one of them is a person's name. */
  Sim.prototype.locationName = function (id) {
    return (this.state.locationNames && this.state.locationNames[id]) || id;
  };

  /* ---------------- world queries ---------------- */

  Sim.prototype.objectById = function (id) {
    for (var i = 0; i < this.state.objects.length; i++) {
      if (this.state.objects[i].id === id) return this.state.objects[i];
    }
    return null;
  };

  Sim.prototype.objectsAt = function (locationId) {
    return this.state.objects.filter(function (o) { return o.location === locationId; });
  };

  Sim.prototype.offerById = function (id) {
    for (var i = 0; i < this.state.offers.length; i++) {
      if (this.state.offers[i].id === id) return this.state.offers[i];
    }
    return null;
  };

  /* Only offers this character has actually perceived, and only while they are
   * still live. Nobody reacts to an opportunity they never heard about. */
  Sim.prototype.offersFor = function (actor) {
    return this.state.offers.filter(function (o) {
      if (o.toId !== actor.id) return false;
      if (!o.perceivedBy[actor.id]) return false;
      return o.status === 'open' || o.status === 'accepted';
    });
  };

  Sim.prototype.context = function (actor, target) {
    return {
      sim: this, state: this.state, actor: actor, target: target || null,
      activity: actor.activity,
      day: this.state.day, minute: this.state.minute, absMinute: this.absMinute(),
      emit: this.emitFor(actor)
    };
  };

  Sim.prototype.resolveTarget = function (candidate) {
    if (!candidate.targetId) return null;
    switch (candidate.targetKind) {
      case 'object': return this.objectById(candidate.targetId);
      case 'person': return this.state.characters[candidate.targetId] || null;
      case 'offer': return this.offerById(candidate.targetId);
      case 'location':
        var l = W.LOCATIONS[candidate.targetId];
        return l ? { id: l.id, name: l.name } : null;
      default: return null;
    }
  };

  /* ---------------- events, perception, memory ---------------- */

  Sim.prototype.emitFor = function (actor) {
    var self = this;
    return function (type, data, text, notify) {
      return self.emit(type, {
        actorId: actor.id, locationId: actor.location, data: data || {},
        text: text || type, notify: notify || []
      });
    };
  };

  Sim.prototype.emit = function (type, opts) {
    opts = opts || {};
    var ev = {
      seq: ++this.eventSeq,
      day: this.state.day, minute: this.state.minute, absMinute: this.absMinute(),
      stamp: U.stamp(this.state.day, this.state.minute),
      type: type,
      actorId: opts.actorId || null,
      locationId: opts.locationId || null,
      data: opts.data || {},
      text: opts.text || type
    };
    this.state.events.push(ev);
    this.touch();
    this.perceive(ev, opts.notify || []);
    for (var i = 0; i < this.listeners.length; i++) this.listeners[i](ev, this);
    return ev;
  };

  Sim.prototype.onEvent = function (fn) { this.listeners.push(fn); return this; };

  /* Who could know this happened: whoever was in the room, plus anyone the
   * event was explicitly communicated to. Memories are written here and
   * nowhere else. */
  Sim.prototype.perceive = function (ev, notify) {
    var salience = SALIENCE[ev.type];
    if (salience === undefined) salience = 0.2;
    var self = this;
    var perceivers = {};
    if (ev.actorId) perceivers[ev.actorId] = true;
    Object.keys(this.state.characters).forEach(function (id) {
      var c = self.state.characters[id];
      if (ev.locationId && c.location === ev.locationId && !c.transit) perceivers[id] = true;
    });
    (notify || []).forEach(function (id) { perceivers[id] = true; });
    Object.keys(perceivers).forEach(function (id) {
      var c = self.state.characters[id];
      if (!c) return;
      var personal = salience + (ev.actorId === id ? 0.1 : 0);
      if (personal < MEMORY_THRESHOLD) return;
      P.remember(c, {
        id: 'mem_' + ev.seq + '_' + id,
        eventSeq: ev.seq, type: ev.type,
        day: ev.day, minute: ev.minute, absMinute: ev.absMinute, stamp: ev.stamp,
        locationId: ev.locationId,
        participants: Object.keys(perceivers).sort(),
        firsthand: ev.actorId === id,
        summary: ev.text,
        salience: Math.round(personal * 100) / 100
      });
    });
  };

  /* ---------------- state mutation primitives ---------------- */

  Sim.prototype.adjustNeed = function (actor, key, delta) {
    actor.needs[key] = U.clamp(U.round2(actor.needs[key] + delta), 0, 100);
    this.touch();
  };

  Sim.prototype.credit = function (actor, deltas) {
    if (deltas.money) actor.money = U.round2(actor.money + deltas.money);
    if (deltas.savings) actor.savings = U.round2(actor.savings + deltas.savings);
    if (actor.money < 0) actor.money = 0;
    if (actor.savings < 0) actor.savings = 0;
    this.touch();
    this.refreshGoals(actor);
  };

  Sim.prototype.adjustRelationship = function (actor, otherId, deltas) {
    actor.relationships = actor.relationships || {};
    var r = actor.relationships[otherId] || (actor.relationships[otherId] = { trust: 50, closeness: 50, lastMetDay: 0 });
    if (deltas.trust) r.trust = U.clamp(U.round2(r.trust + deltas.trust), 0, 100);
    if (deltas.closeness) r.closeness = U.clamp(U.round2(r.closeness + deltas.closeness), 0, 100);
    r.lastMetDay = this.state.day;
    this.touch();
  };

  Sim.prototype.greetedToday = function (actor, otherId) {
    return (actor.greetedToday || {})[otherId] === this.state.day;
  };

  Sim.prototype.placeCharacter = function (actor, locationId, pos) {
    var loc = W.LOCATIONS[locationId];
    actor.location = locationId;
    actor.pos = pos ? { x: pos.x, y: pos.y, dir: pos.dir || 'down' }
                    : { x: loc.spawn.x, y: loc.spawn.y, dir: loc.spawn.dir };
    actor.walkTarget = null;
    this.touch();
  };

  Sim.prototype.beginTransit = function (actor, from, to) {
    var portalFrom = W.STREET_PORTALS[from] || W.LOCATIONS.street.spawn;
    var portalTo = W.STREET_PORTALS[to] || W.LOCATIONS.street.spawn;
    actor.transit = { from: from, to: to };
    actor.location = 'street';
    actor.pos = { x: portalFrom.x, y: portalFrom.y, dir: 'down' };
    actor.walkTarget = { x: portalTo.x, y: portalTo.y };
    this.touch();
  };

  Sim.prototype.endTransit = function (actor, locationId) {
    actor.transit = null;
    this.placeCharacter(actor, locationId);
  };

  /* ---------------- goals and commitments ---------------- */

  Sim.prototype.refreshGoals = function (actor) {
    var self = this;
    (actor.goals || []).forEach(function (g) {
      var before = g.progress;
      if (g.kind === 'savings') g.progress = actor.savings;
      if (g.kind === 'social') {
        g.progress = (actor.memories || []).filter(function (m) { return m.type === 'TALKED'; }).length;
      }
      if (!g.reached && g.progress >= g.target) {
        g.reached = true;
        g.reachedStamp = self.stamp();
        self.emit('GOAL_REACHED', {
          actorId: actor.id, locationId: actor.location,
          data: { goalId: g.id, target: g.target, progress: g.progress },
          text: actor.name + ' reached the goal "' + g.label + '" (' + g.progress + '/' + g.target + ').'
        });
      }
      if (before !== g.progress) self.touch();
    });
  };

  Sim.prototype.commitmentById = function (actor, id) {
    var list = actor.commitments || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  };

  Sim.prototype.keepCommitment = function (actor, id) {
    var c = this.commitmentById(actor, id);
    if (!c || c.status !== 'open') return null;
    /* A promise made for the evening is not kept by doing it at breakfast. */
    if (c.windowStartMin !== undefined && this.state.minute < c.windowStartMin) return null;
    c.status = 'kept';
    c.settledStamp = this.stamp();
    this.touch();
    this.emit('COMMITMENT_KEPT', {
      actorId: actor.id, locationId: actor.location,
      data: { commitmentId: id, kind: c.kind, withId: c.withId },
      text: actor.name + ' kept a commitment: ' + c.label,
      notify: c.withId && this.state.characters[c.withId] ? [c.withId] : []
    });
    return c;
  };

  Sim.prototype.breakCommitment = function (actor, c, reason) {
    if (!c || c.status !== 'open') return null;
    c.status = 'broken';
    c.settledStamp = this.stamp();
    c.brokenReason = reason || 'not_fulfilled';
    this.touch();
    var notify = [];
    if (c.withId && this.state.characters[c.withId]) {
      var other = this.state.characters[c.withId];
      // The person let down is the one whose trust moves.
      this.adjustRelationship(other, actor.id, { trust: -8, closeness: -5 });
      this.adjustRelationship(actor, other.id, { closeness: -2 });
      notify.push(c.withId);
    } else if (c.withId === 'cafe') {
      actor.standing.cafe = U.clamp(actor.standing.cafe - 12, 0, 100);
    }
    this.emit('COMMITMENT_BROKEN', {
      actorId: actor.id, locationId: actor.location,
      data: { commitmentId: c.id, kind: c.kind, withId: c.withId, reason: c.brokenReason },
      text: actor.name + ' did not keep: ' + c.label,
      notify: notify
    });
    return c;
  };

  /* A meeting is kept by both sides at once when the two people actually talk
   * inside the window they agreed on. */
  Sim.prototype.settleMeeting = function (actor, other) {
    var self = this;
    [[actor, other], [other, actor]].forEach(function (pair) {
      var who = pair[0], with_ = pair[1];
      (who.commitments || []).forEach(function (c) {
        if (c.status !== 'open' || c.kind !== 'social' || c.withId !== with_.id) return;
        var due = self.abs(c.dueDay, c.dueMin);
        var now = self.absMinute();
        if (now >= due - 30 && now <= due + (c.graceMin || 0)) self.keepCommitment(who, c.id);
      });
    });
  };

  Sim.prototype.evaluateCommitments = function () {
    var self = this, now = this.absMinute();
    this.actorIds().forEach(function (id) {
      var actor = self.state.characters[id];
      (actor.commitments || []).forEach(function (c) {
        if (c.status !== 'open') return;
        var deadline = self.abs(c.dueDay, c.dueMin) + (c.graceMin || 0);
        if (now > deadline) self.breakCommitment(actor, c, 'deadline_passed');
      });
    });
  };

  /* ---------------- offers ---------------- */

  Sim.prototype.acceptOffer = function (actor, offer) {
    offer.status = 'accepted';
    offer.acceptedStamp = this.stamp();
    if (offer.commitment) {
      actor.commitments.push({
        id: 'cmt_extra_' + offer.id, kind: offer.commitment.kind || 'work',
        locationId: offer.commitment.locationId || offer.locationId,
        strength: offer.commitment.strength || 'soft', withId: offer.commitment.withId || null,
        label: offer.commitment.label, dueDay: offer.commitment.dueDay,
        dueMin: offer.commitment.dueMin, graceMin: offer.commitment.graceMin || 0,
        status: 'open'
      });
    }
    this.touch();
    this.emit('OFFER_ACCEPTED', {
      actorId: actor.id, locationId: actor.location,
      data: { offerId: offer.id, type: offer.type, params: offer.params },
      text: actor.name + ' accepted: ' + offer.summary
    });
  };

  Sim.prototype.declineOffer = function (actor, offer) {
    offer.status = 'declined';
    offer.declinedStamp = this.stamp();
    this.touch();
    this.emit('OFFER_DECLINED', {
      actorId: actor.id, locationId: actor.location,
      data: { offerId: offer.id, type: offer.type },
      text: actor.name + ' declined: ' + offer.summary
    });
  };

  /* An offer becomes knowable when its addressee is where it was posted, or
   * immediately if it was delivered to them personally. */
  Sim.prototype.updateOfferPerception = function () {
    var self = this;
    this.state.offers.forEach(function (o) {
      if (o.status !== 'open' && o.status !== 'accepted') return;
      var actor = self.state.characters[o.toId];
      if (!actor || o.perceivedBy[actor.id]) return;
      var here = actor.location === o.locationId && !actor.transit;
      if (o.delivery === 'message' || here) {
        o.perceivedBy[actor.id] = self.stamp();
        self.touch();
        self.emit('OFFER_RECEIVED', {
          actorId: actor.id, locationId: actor.location,
          data: { offerId: o.id, type: o.type, params: o.params },
          text: actor.name + ' learned of: ' + o.summary
        });
      }
    });
  };

  Sim.prototype.expireOffers = function () {
    var self = this, now = this.absMinute();
    this.state.offers.forEach(function (o) {
      if (o.status !== 'open') return;
      if (now < self.abs(o.expiresDay, o.expiresMin)) return;
      o.status = 'expired';
      self.touch();
      self.emit('OFFER_EXPIRED', {
        actorId: o.toId, locationId: o.locationId,
        data: { offerId: o.id, type: o.type },
        text: 'The offer expired: ' + o.summary
      });
    });
  };

  /* ---------------- activities ---------------- */

  Sim.prototype.anchorFor = function (actor, def, target) {
    if (target && target.location === actor.location && target.x !== undefined) {
      var loc = W.LOCATIONS[actor.location];
      var options = [{ x: target.x, y: target.y + 1 }, { x: target.x, y: target.y - 1 },
                     { x: target.x - 1, y: target.y }, { x: target.x + 1, y: target.y }];
      for (var i = 0; i < options.length; i++) {
        var o = options[i];
        if (o.y < 0 || o.y >= loc.rows.length || o.x < 0 || o.x >= loc.rows[0].length) continue;
        if (!W.isSolid(loc.rows[o.y].charAt(o.x))) return o;
      }
    }
    if (target && target.pos && target.location === actor.location) {
      return { x: target.pos.x + 1, y: target.pos.y };
    }
    return null;
  };

  Sim.prototype.startActivity = function (actor, candidate, source, requestId) {
    var def = A.get(candidate.actionId);
    if (!def) return { ok: false, error: 'unknown_action' };
    var target = this.resolveTarget(candidate);
    var ctx = this.context(actor, target);
    var verdict;
    try { verdict = def.eligible(ctx); } catch (e) { verdict = { reason: 'error:' + (e && e.message) }; }
    if (verdict !== true) return { ok: false, error: (verdict && verdict.reason) || 'ineligible' };

    var minutes = Math.max(1, Math.round(def.duration(ctx)));
    actor.activity = {
      id: 'act_' + (++this.eventSeq),
      actionId: candidate.actionId,
      label: def.label + (target && target.name ? ' — ' + target.name : ''),
      targetKind: def.targetKind, targetId: candidate.targetId || null,
      startDay: this.state.day, startMin: this.state.minute,
      startAbs: this.absMinute(),
      plannedMinutes: minutes,
      endAbs: this.absMinute() + minutes,
      elapsed: 0,
      interruptible: !!def.interruptible,
      settled: false,
      source: source, requestId: requestId || null
    };
    ctx.activity = actor.activity;
    var anchor = this.anchorFor(actor, def, target);
    if (anchor) actor.walkTarget = anchor;
    this.touch();
    if (def.onStart) def.onStart(ctx);
    this.emit('ACTIVITY_STARTED', {
      actorId: actor.id, locationId: actor.location,
      data: { actionId: candidate.actionId, targetId: candidate.targetId || null,
              minutes: minutes, source: source, requestId: requestId || null },
      text: actor.name + ' began: ' + actor.activity.label + ' (' + minutes + ' min)'
    });
    return { ok: true, activity: actor.activity };
  };

  Sim.prototype.advanceActivity = function (actor, minutes) {
    var act = actor.activity;
    if (!act) return;
    var def = A.get(act.actionId);
    var target = this.resolveTarget({ targetKind: act.targetKind, targetId: act.targetId });
    var ctx = this.context(actor, target);
    ctx.activity = act;
    if (def.tick) def.tick(ctx, minutes);
    act.elapsed += minutes;
    this.touch();
    if (act.elapsed < act.plannedMinutes) return;
    /* Settlement runs exactly once. Every discrete consequence — money, goal,
     * relationship, commitment — lives behind this flag. */
    if (!act.settled) {
      act.settled = true;
      if (def.onComplete) def.onComplete(ctx);
      this.emit('ACTIVITY_COMPLETED', {
        actorId: actor.id, locationId: actor.location,
        data: { actionId: act.actionId, targetId: act.targetId, minutes: act.plannedMinutes },
        text: actor.name + ' finished: ' + act.label
      });
    }
    actor.activity = null;
    actor.lastFinishedAbs = this.absMinute();
    this.refreshGoals(actor);
  };

  Sim.prototype.interrupt = function (actor, reason) {
    var act = actor.activity;
    if (!act) return false;
    if (!act.interruptible) return false;
    var def = A.get(act.actionId);
    var target = this.resolveTarget({ targetKind: act.targetKind, targetId: act.targetId });
    var ctx = this.context(actor, target);
    ctx.activity = act;
    if (def.onInterrupt) def.onInterrupt(ctx);
    this.emit('ACTIVITY_INTERRUPTED', {
      actorId: actor.id, locationId: actor.location,
      data: { actionId: act.actionId, elapsed: act.elapsed, planned: act.plannedMinutes, reason: reason },
      text: actor.name + ' stopped: ' + act.label + ' (' + reason + ')'
    });
    actor.activity = null;
    this.touch();
    return true;
  };

  /* ---------------- movement inside a place ---------------- */

  Sim.prototype.walkStep = function (actor) {
    var t = actor.walkTarget;
    if (!t) return;
    var loc = W.LOCATIONS[actor.location];
    if (!loc) return;
    var p = actor.pos;
    if (p.x === t.x && p.y === t.y) { actor.walkTarget = null; return; }
    var dx = t.x - p.x, dy = t.y - p.y;
    var tries = [];
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (dx) tries.push({ x: p.x + (dx > 0 ? 1 : -1), y: p.y, dir: dx > 0 ? 'right' : 'left' });
      if (dy) tries.push({ x: p.x, y: p.y + (dy > 0 ? 1 : -1), dir: dy > 0 ? 'down' : 'up' });
    } else {
      if (dy) tries.push({ x: p.x, y: p.y + (dy > 0 ? 1 : -1), dir: dy > 0 ? 'down' : 'up' });
      if (dx) tries.push({ x: p.x + (dx > 0 ? 1 : -1), y: p.y, dir: dx > 0 ? 'right' : 'left' });
    }
    for (var i = 0; i < tries.length; i++) {
      var n = tries[i];
      var ch = EMBER.Grid.cell(loc.rows, n.x, n.y, '#');
      if (W.isSolid(ch)) continue;
      actor.pos = { x: n.x, y: n.y, dir: n.dir };
      this.touch();
      return;
    }
  };

  /* ---------------- decisions ---------------- */

  /* What must still hold for a pending answer to be worth executing. It
   * deliberately excludes everything the decision did not depend on, so an
   * unrelated event elsewhere in town never invalidates an answer. */
  Sim.prototype.relevanceKey = function (actor) {
    var self = this;
    var here = Object.keys(this.state.characters).filter(function (id) {
      var c = self.state.characters[id];
      return id !== actor.id && c.location === actor.location && !c.transit;
    }).sort().join(',');
    var offers = this.offersFor(actor).map(function (o) { return o.id + ':' + o.status; }).sort().join(',');
    return [
      actor.location,
      actor.activity ? actor.activity.actionId : '-',
      Math.round(actor.money), Math.round(actor.savings),
      Math.floor(actor.needs.energy / 5), Math.floor(actor.needs.hunger / 5),
      here, offers
    ].join('|');
  };

  Sim.prototype.buildRequest = function (actor, reason) {
    var cand = P.candidates(this, actor);
    var seq = ++this.requestSeq;
    var request = {
      requestId: 'req_' + seq, seq: seq,
      actorId: actor.id,
      day: this.state.day, minute: this.state.minute, clock: U.clock(this.state.minute),
      absMinute: this.absMinute(),
      stateVersion: this.state.version,
      relevanceKey: this.relevanceKey(actor),
      self: {
        id: actor.id, name: actor.name, location: actor.location, homeId: actor.homeId,
        needs: deepCopy(actor.needs), money: actor.money, savings: actor.savings,
        pantry: actor.pantry, traits: deepCopy(actor.traits),
        employment: actor.employment ? deepCopy(actor.employment) : null,
        standing: deepCopy(actor.standing)
      },
      observations: P.observe(this, actor),
      memories: P.relevantMemories(actor, 8),
      goals: deepCopy(actor.goals || []),
      commitments: deepCopy(actor.commitments || []),
      relationships: deepCopy(actor.relationships || {}),
      candidates: cand.legal,
      context: { reason: reason }
    };
    this.requests[request.requestId] = {
      request: request, resolved: false, actorId: actor.id,
      rejectedCandidates: cand.rejected
    };
    return request;
  };

  Sim.prototype.requestDecision = function (actor, reason) {
    var policy = Pol.get(actor.policyId);
    if (!policy) throw new Error('no policy registered for ' + actor.id + ' (' + actor.policyId + ')');
    var request = this.buildRequest(actor, reason);
    actor.pending = {
      requestId: request.requestId, seq: request.seq,
      issuedAbs: request.absMinute, relevanceKey: request.relevanceKey,
      candidateIds: request.candidates.map(function (c) { return c.id; })
    };
    this.touch();
    var self = this;
    var result;
    try { result = policy.decide(request); } catch (e) { result = Promise.resolve(Pol.failed(request, actor.policyId, e)); }
    Promise.resolve(result).then(function (response) { self.deliver(response); },
                                 function (err) { self.deliver(Pol.failed(request, actor.policyId, err)); });
    return request;
  };

  /* Responses never apply where they land. They queue, and the queue is drained
   * in request order at a tick boundary, so timing jitter cannot reorder the
   * world. */
  Sim.prototype.deliver = function (response) {
    if (!response || typeof response !== 'object' || typeof response.requestId !== 'string') {
      this.rejections.push({ stamp: this.stamp(), requestId: null, reason: 'malformed_response' });
      return false;
    }
    var rec = this.requests[response.requestId];
    if (!rec) {
      this.rejections.push({ stamp: this.stamp(), requestId: response.requestId, reason: 'unknown_request' });
      return false;
    }
    if (rec.resolved) {
      this.rejections.push({ stamp: this.stamp(), requestId: response.requestId, reason: 'duplicate_response' });
      return false;
    }
    rec.resolved = true;
    rec.response = response;
    this.inbox.push(response);
    return true;
  };

  Sim.prototype.flushDecisions = function () {
    var self = this;
    if (!this.inbox.length) return;
    var batch = this.inbox.sort(function (a, b) {
      return self.requests[a.requestId].request.seq - self.requests[b.requestId].request.seq;
    });
    this.inbox = [];
    batch.forEach(function (response) { self.applyDecision(response); });
  };

  Sim.prototype.reject = function (request, reason, extra) {
    var entry = { stamp: this.stamp(), requestId: request ? request.requestId : null,
                  actorId: request ? request.actorId : null, reason: reason };
    if (extra) entry.detail = extra;
    this.rejections.push(entry);
    return entry;
  };

  Sim.prototype.applyDecision = function (response) {
    var rec = this.requests[response.requestId];
    var request = rec.request;
    var actor = this.state.characters[request.actorId];

    if (!actor.pending || actor.pending.requestId !== request.requestId) {
      return this.reject(request, 'superseded');
    }

    var shape = Pol.validateResponse(request, response);
    if (!shape.ok) { actor.pending = null; return this.reject(request, shape.error); }
    if (shape.unavailable) {
      actor.pending = null;
      this.reject(request, 'policy_unavailable');
      return this.fallback(actor, 'policy_unavailable');
    }

    if (actor.activity) { actor.pending = null; return this.reject(request, 'actor_already_busy'); }

    var nowKey = this.relevanceKey(actor);
    if (nowKey !== request.relevanceKey) {
      actor.pending = null;
      return this.reject(request, 'stale_state', { was: request.relevanceKey, now: nowKey });
    }

    var candidate = null;
    for (var i = 0; i < request.candidates.length; i++) {
      if (request.candidates[i].id === response.selectedId) { candidate = request.candidates[i]; break; }
    }

    // Re-derive legality from the present, not from the request snapshot.
    var live = P.candidates(this, actor).legal;
    var stillLegal = live.some(function (c) { return c.id === candidate.id; });
    if (!stillLegal) {
      actor.pending = null;
      return this.reject(request, 'candidate_no_longer_legal', { candidateId: candidate.id });
    }

    var started = this.startActivity(actor, candidate, response.source || actor.policyId, request.requestId);
    actor.pending = null;
    if (!started.ok) return this.reject(request, 'execution_refused', started);

    actor.recentDecisions.unshift({
      requestId: request.requestId, stamp: request.clock, day: request.day,
      selectedId: candidate.id, actionId: candidate.actionId, label: candidate.label,
      source: response.source || actor.policyId,
      candidateCount: request.candidates.length,
      diagnostics: response.diagnostics || null,
      rejectedCandidates: rec.rejectedCandidates
    });
    if (actor.recentDecisions.length > 20) actor.recentDecisions.pop();
    return null;
  };

  /* A policy that cannot answer must not stop time: the character waits, and
   * the fallback is recorded as its own source so nothing is mistaken for a
   * policy choice. */
  Sim.prototype.fallback = function (actor, reason) {
    var live = P.candidates(this, actor).legal;
    var wait = null;
    for (var i = 0; i < live.length; i++) if (live[i].actionId === 'wait') wait = live[i];
    if (!wait) return null;
    this.startActivity(actor, wait, 'fallback:' + reason, null);
    return wait;
  };

  /* ---------------- the tick ---------------- */

  Sim.prototype.tick = function () {
    var self = this;
    this.flushDecisions();

    this.state.minute += 1;
    if (this.state.minute >= U.MINUTES_PER_DAY) {
      this.state.minute -= U.MINUTES_PER_DAY;
      this.state.day += 1;
      this.actorIds().forEach(function (id) { self.state.characters[id].workedMinutes = 0; });
    }
    this.touch();

    this.applyDueInterventions();
    this.updateOfferPerception();

    this.actorIds().forEach(function (id) {
      var actor = self.state.characters[id];
      var asleep = actor.activity && actor.activity.actionId === 'sleep';
      if (!asleep) {
        self.adjustNeed(actor, 'hunger', A.DRIFT.hunger);
        self.adjustNeed(actor, 'energy', A.DRIFT.energy);
      }
      self.walkStep(actor);
      self.advanceActivity(actor, 1);
    });

    this.evaluateCommitments();
    this.expireOffers();

    this.actorIds().forEach(function (id) {
      var actor = self.state.characters[id];
      if (actor.activity || actor.pending) return;
      self.requestDecision(actor, actor.lastFinishedAbs === self.absMinute() ? 'activity_complete' : 'idle');
    });
    return this.state;
  };

  /* Interruptions are rare and named. An offer marked urgent can pull someone
   * out of an interruptible activity; nothing else may. */
  Sim.prototype.requestInterrupt = function (actorId, reason) {
    var actor = this.state.characters[actorId];
    if (!actor || !actor.activity) return false;
    if (!this.interrupt(actor, reason)) return false;
    actor.pending = null;
    return true;
  };

  /* Advancing time is asynchronous because deciding is. Between two minutes the
   * loop yields microtasks so a settled policy promise can be delivered, and a
   * real macrotask now and then so timer-based policies and the host event loop
   * are not starved. Microtasks are used for the common case because a
   * backgrounded browser tab throttles timers to about one per second, and a
   * town that stops when nobody is looking is not a persistent world. */
  Sim.prototype.runMinutes = function (minutes) {
    var self = this;
    var i = 0;
    function yieldTurn() {
      if (i % 60 === 0) return new Promise(function (r) { setTimeout(r, 0); });
      return Promise.resolve().then(function () { return Promise.resolve(); });
    }
    function step() {
      if (i++ >= minutes) return Promise.resolve(self.state);
      self.tick();
      return yieldTurn().then(step);
    }
    return step();
  };

  Sim.prototype.runUntil = function (day, minute) {
    var target = this.abs(day, minute);
    return this.runMinutes(Math.max(0, target - this.absMinute()));
  };

  /* ---------------- interventions ---------------- */

  Sim.prototype.scheduleIntervention = function (entry) {
    var I = LT.Interventions;
    if (!I) throw new Error('lt-interventions.js is not loaded');
    return I.schedule(this, entry);
  };

  Sim.prototype.applyDueInterventions = function () {
    var I = LT.Interventions;
    if (I) I.applyDue(this);
  };

  LT.Sim = {
    create: function (opts) { return new Sim(opts); },
    Sim: Sim,
    SALIENCE: SALIENCE
  };
})();
