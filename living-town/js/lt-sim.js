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
    if (!LT.Appearance) require('./lt-appearance.js');
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
    this.loads = 0;                            // how many times this world has been restored from a save
    /* How long, in simulated minutes, a decision may stay unanswered before the
     * sim stops waiting for it. Simulated rather than wall-clock so a run does
     * not depend on how fast the host machine is. */
    this.decisionTimeoutMinutes = opts.decisionTimeoutMinutes === undefined ? 30 : opts.decisionTimeoutMinutes;
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
      conversations: [],
      events: [],
      interventions: []
    };
    var self = this;
    /* Names are drawn once, here, from a stream of their own so that adding a
     * random draw elsewhere in the simulation cannot change who lives in town.
     * From this point the name is authoritative state: nothing regenerates it,
     * and every other system addresses people by id. */
    var nextName = LT.Names.generator(U.rng((this.seed ^ 0x9e3779b9) >>> 0), opts.namePools);
    /* A look is drawn the same way, from its own stream, and is just as
     * permanent. It is kept apart from the name on purpose: what someone is
     * called and what they look like are separate facts about them. */
    var nextLook = LT.Appearance.generator(U.rng((this.seed ^ 0x51ed270b) >>> 0));
    W.CHARACTERS.forEach(function (seed) {
      var c = deepCopy(seed);
      var drawn = nextName();
      c.name = drawn.name;
      c.familyName = drawn.familyName;
      c.fullName = drawn.fullName;
      c.appearanceId = nextLook();
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
      case 'conversation': return this.conversationById(candidate.targetId);
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
      /* actorId is who did it. subjectId is who it is about, which is not the
       * same thing and confers no knowledge of it. */
      actorId: opts.actorId || null,
      subjectId: opts.subjectId || null,
      locationId: opts.locationId || null,
      data: opts.data || {},
      text: opts.text || type
    };
    this.state.events.push(ev);
    this.touch();
    this.perceive(ev, opts.notify || [], !!opts.private);
    for (var i = 0; i < this.listeners.length; i++) this.listeners[i](ev, this);
    return ev;
  };

  Sim.prototype.onEvent = function (fn) { this.listeners.push(fn); return this; };

  /* Who could know this happened: whoever was in the room, plus anyone the
   * event was explicitly communicated to. Memories are written here and
   * nowhere else. */
  Sim.prototype.perceive = function (ev, notify, isPrivate) {
    var salience = SALIENCE[ev.type];
    if (salience === undefined) salience = 0.2;
    var self = this;
    var perceivers = {};
    if (ev.actorId) perceivers[ev.actorId] = true;
    Object.keys(this.state.characters).forEach(function (id) {
      var c = self.state.characters[id];
      if (isPrivate) return;   // nothing to witness: only those told will know
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
   * inside the window they agreed on, in the place they agreed on. */
  Sim.prototype.settleMeeting = function (actor, other, locationId) {
    var self = this;
    [[actor, other], [other, actor]].forEach(function (pair) {
      var who = pair[0], with_ = pair[1];
      (who.commitments || []).forEach(function (c) {
        if (c.status !== 'open' || c.kind !== 'social' || c.withId !== with_.id) return;
        if (c.locationId && c.locationId !== locationId) return;
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
      /* Only those who knew about the offer can know it is gone. The addressee
       * is its subject, not its actor, and learns nothing by being named. */
      var informed = Object.keys(o.perceivedBy).sort();
      if (o.status === 'accepted' && o.endAbs !== undefined && now >= o.endAbs) {
        /* The window it was accepted for is over. Whatever was not worked
         * stays unworked; the commitment is judged on its own deadline. */
        o.status = 'lapsed';
        self.touch();
        self.emit('OFFER_LAPSED', {
          subjectId: o.toId, locationId: o.locationId, private: true, notify: informed,
          data: { offerId: o.id, type: o.type, workedMinutes: o.workedMinutes || 0 },
          text: 'The accepted offer ran out: ' + o.summary
        });
        return;
      }
      if (o.status !== 'open') return;
      if (now < self.abs(o.expiresDay, o.expiresMin)) return;
      o.status = 'expired';
      self.touch();
      self.emit('OFFER_EXPIRED', {
        subjectId: o.toId, locationId: o.locationId, private: true, notify: informed,
        data: { offerId: o.id, type: o.type },
        text: 'The offer expired: ' + o.summary
      });
    });
  };

  /* ---------------- conversations ---------------- */

  Sim.prototype.conversationById = function (id) {
    var list = this.state.conversations;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  };

  /* Free to be asked: in the room, not walking out of it, not already in (or
   * being asked into) a conversation, and either idle or doing something one
   * looks up from. */
  Sim.prototype.availableToTalk = function (other) {
    if (!other || other.transit) return false;
    if (this.openConversationOf(other.id)) return false;
    if (!other.activity) return true;
    var def = A.get(other.activity.actionId);
    return !!(def && def.yieldsToConversation);
  };

  /* The one conversation, proposed or under way, this person is part of. */
  Sim.prototype.openConversationOf = function (actorId) {
    var list = this.state.conversations;
    for (var i = list.length - 1; i >= 0; i--) {
      var c = list[i];
      if ((c.status === 'proposed' || c.status === 'active') && c.participants.indexOf(actorId) >= 0) return c;
    }
    return null;
  };

  function adjacent(a, b) {
    return a.location === b.location && Math.abs(a.pos.x - b.pos.x) + Math.abs(a.pos.y - b.pos.y) === 1;
  }
  function facing(from, to) {
    if (to.x > from.x) return 'right';
    if (to.x < from.x) return 'left';
    return to.y < from.y ? 'up' : 'down';
  }

  var REPLY_MINUTES = 5;   // how long someone stands there waiting to be answered

  /* Somebody has walked up to somebody else and spoken. That is all that has
   * happened: one conversation record exists, proposed, and nothing about the
   * other person has been decided for them. They are shown the proposal as two
   * candidates of their own — join it, or decline — and their policy chooses.
   * Being spoken to does make someone look up from waiting or resting; that
   * interruption is the world's and is recorded as such, not as their choice.
   *
   * If the other person was themselves on the way over to talk, both have
   * already chosen, each through their own policy: it is one conversation, and
   * it starts now. */
  Sim.prototype.proposeConversation = function (actor, other, activity) {
    var theirs = other.activity;
    var mutual = theirs && theirs.actionId === 'talk_with' && theirs.targetId === actor.id && !theirs.conversationId;
    if (!mutual && !this.availableToTalk(other)) return this.failActivity(actor, 'partner_busy');
    if (!adjacent(actor, other)) return this.failActivity(actor, 'partner_moved');
    var conv = {
      id: 'conv_' + (this.state.conversations.length + 1),
      participants: [actor.id, other.id].sort(),
      initiatorId: actor.id, inviteeId: other.id,
      locationId: actor.location,
      proposedAbs: this.absMinute(), replyByAbs: this.absMinute() + REPLY_MINUTES,
      startAbs: null, endAbs: null,
      minutes: activity.plannedMinutes,
      status: 'proposed'
    };
    this.state.conversations.push(conv);
    activity.conversationId = conv.id;
    activity.phase = 'waiting_reply';
    this.touch();
    if (mutual) {
      conv.mutual = true;
      other.walkTarget = null;
      theirs.conversationId = conv.id;
      this.startConversation(conv);
      return conv;
    }
    if (other.activity) this.interrupt(other, 'spoken_to');
    this.emit('TALK_PROPOSED', {
      actorId: actor.id, locationId: actor.location, notify: [other.id],
      data: { conversationId: conv.id, toId: other.id },
      text: actor.name + ' walked up to ' + other.name + ' to talk.'
    });
    return conv;
  };

  /* Both are in. The talk, its clock and everything that follows from it
   * start here, not while one of them was crossing the room. */
  Sim.prototype.startConversation = function (conv) {
    var self = this, now = this.absMinute();
    conv.status = 'active';
    conv.startAbs = now; conv.endAbs = now + conv.minutes;
    var a = this.state.characters[conv.participants[0]], b = this.state.characters[conv.participants[1]];
    a.pos = { x: a.pos.x, y: a.pos.y, dir: facing(a.pos, b.pos) };
    b.pos = { x: b.pos.x, y: b.pos.y, dir: facing(b.pos, a.pos) };
    conv.participants.forEach(function (id) {
      var act = self.state.characters[id].activity;
      act.phase = 'executing'; act.conversationId = conv.id;
      act.plannedMinutes = conv.minutes; act.elapsed = 0;
      act.startAbs = now; act.startDay = self.state.day; act.startMin = self.state.minute;
      act.endAbs = conv.endAbs;
    });
    this.touch();
    this.emit('TALK_BEGAN', {
      actorId: conv.initiatorId, locationId: conv.locationId, notify: [conv.inviteeId],
      data: { conversationId: conv.id, participants: conv.participants.slice(), mutual: !!conv.mutual },
      text: a.name + ' and ' + b.name + ' started talking.'
    });
  };

  /* A proposal that will not become a conversation. Nothing is settled; the
   * person who asked is released with the reason, and does not ask the same
   * person again straight away. */
  Sim.prototype.closeProposal = function (conv, status, reason) {
    if (!conv || conv.status !== 'proposed') return false;
    conv.status = status;
    conv.endedReason = reason;
    this.touch();
    var asker = this.state.characters[conv.initiatorId], other = this.state.characters[conv.inviteeId];
    this.emit(status === 'declined' ? 'TALK_DECLINED' : 'TALK_UNANSWERED', {
      actorId: status === 'declined' ? other.id : asker.id, locationId: conv.locationId,
      notify: [asker.id, other.id],
      data: { conversationId: conv.id, fromId: asker.id, toId: other.id, reason: reason },
      text: status === 'declined' ? other.name + ' did not want to talk just now.'
                                  : asker.name + ' got no answer from ' + other.name + ' (' + reason + ').'
    });
    asker.talkRefused = asker.talkRefused || {};
    asker.talkRefused[other.id] = this.absMinute();
    if (asker.activity && asker.activity.conversationId === conv.id) this.failActivity(asker, reason);
    return true;
  };

  Sim.prototype.expireProposals = function () {
    var self = this, now = this.absMinute();
    this.state.conversations.forEach(function (conv) {
      if (conv.status !== 'proposed') return;
      var asker = self.state.characters[conv.initiatorId], other = self.state.characters[conv.inviteeId];
      if (!asker.activity || asker.activity.conversationId !== conv.id) return self.closeProposal(conv, 'withdrawn', 'asker_left');
      if (other.transit || other.location !== conv.locationId) return self.closeProposal(conv, 'unanswered', 'recipient_left');
      if (!adjacent(asker, other)) return self.closeProposal(conv, 'unanswered', 'recipient_moved');
      /* They were asked, and their policy chose to do something else. That is
       * an answer of a kind, but it is not recorded as a refusal they made. */
      if (other.activity) return self.closeProposal(conv, 'unanswered', 'recipient_chose_otherwise');
      if (now >= conv.replyByAbs) return self.closeProposal(conv, 'unanswered', 'no_reply');
    });
  };

  Sim.prototype.conversationIntact = function (conv) {
    var self = this;
    return conv.participants.every(function (id) {
      var c = self.state.characters[id];
      return c && !c.transit && c.location === conv.locationId &&
             c.activity && c.activity.conversationId === conv.id;
    }) && adjacent(this.state.characters[conv.participants[0]], this.state.characters[conv.participants[1]]);
  };

  /* Settlement has the conversation's identity, not an activity's: two people
   * finishing the same talk settle it once. */
  Sim.prototype.settleConversation = function (id) {
    var conv = this.conversationById(id);
    if (!conv || conv.status !== 'active') return null;
    conv.status = 'completed';
    var a = this.state.characters[conv.initiatorId];
    var bId = conv.participants[0] === a.id ? conv.participants[1] : conv.participants[0];
    var b = this.state.characters[bId];
    var now = this.absMinute();
    a.lastTalk = a.lastTalk || {}; b.lastTalk = b.lastTalk || {};
    a.lastTalk[b.id] = now; b.lastTalk[a.id] = now;
    this.adjustRelationship(a, b.id, { trust: 3, closeness: 4 });
    this.adjustRelationship(b, a.id, { trust: 3, closeness: 4 });
    this.settleMeeting(a, b, conv.locationId);
    this.emit('TALKED', {
      actorId: a.id, locationId: conv.locationId, notify: [b.id],
      data: { conversationId: conv.id, withId: b.id, participants: conv.participants.slice(), minutes: conv.minutes },
      text: a.name + ' and ' + b.name + ' talked for ' + conv.minutes + ' minutes.'
    });
    return conv;
  };

  /* A conversation one person leaves is over for both, and settles nothing. */
  Sim.prototype.endConversation = function (conv, reason) {
    if (!conv || conv.status !== 'active') return false;
    conv.status = 'broken_off';
    conv.endedReason = reason;
    this.touch();
    var self = this;
    conv.participants.forEach(function (id) {
      var c = self.state.characters[id];
      if (c && c.activity && c.activity.conversationId === conv.id) self.interrupt(c, 'conversation_ended');
    });
    this.emit('CONVERSATION_ENDED', {
      actorId: null, locationId: conv.locationId, notify: conv.participants.slice(),
      data: { conversationId: conv.id, participants: conv.participants.slice(), reason: reason },
      text: 'A conversation broke off (' + reason + ').'
    });
    return true;
  };

  /* ---------------- activities ---------------- */

  Sim.prototype.anchorFor = function (actor, def, target) {
    /* An object may say where each of its uses is done from. */
    if (target && target.location === actor.location && target.anchors && target.anchors[def.id]) {
      var declared = target.anchors[def.id];
      return { x: declared.x, y: declared.y, dir: declared.dir };
    }
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

  /* ---- where an activity is done from ----
   * Every action declares `position`:
   *   'use_spot'      at the place an object is used from (behind the counter,
   *                   on the bench). `spotObject` names the object when the
   *                   target is not one (an accepted shift is worked at the
   *                   counter).
   *   'beside_person' on a free cell next to the person it is done with.
   *   'anywhere'      where the actor stands — deciding, waiting, a wave
   *                   across the room — or, for travel, along a walk that is
   *                   itself the activity.
   * Returns { needed, at, reason }. `at` is null when there is no such cell or
   * no way to walk to it; nothing is ever done from afar instead. */
  Sim.prototype.useSpot = function (actor, def, target) {
    if (!def.position || def.position === 'anywhere') return { needed: false, at: null };
    var loc = W.LOCATIONS[actor.location], self = this;
    if (def.position === 'beside_person') {
      if (!target || target.location !== actor.location || target.transit) return { needed: true, at: null, reason: 'not_present' };
      var best = null, bestLen = Infinity;
      STEP_DIRS.forEach(function (d) {
        var cell = { x: target.pos.x + d.x, y: target.pos.y + d.y };
        if (W.isSolid(EMBER.Grid.cell(loc.rows, cell.x, cell.y, '#'))) return;
        var len = self.routeLength(loc, actor.pos, cell);
        if (len >= 0 && len < bestLen) { bestLen = len; best = { x: cell.x, y: cell.y, dir: facing(cell, target.pos) }; }
      });
      return { needed: true, at: best, reason: best ? null : 'person_unreachable' };
    }
    var object = def.spotObject ? this.objectById(def.spotObject) : target;
    var spot = this.anchorFor(actor, def, object);
    if (!spot) return { needed: true, at: null, reason: 'no_use_spot' };
    if (W.isSolid(EMBER.Grid.cell(loc.rows, spot.x, spot.y, '#')) || this.routeLength(loc, actor.pos, spot) < 0) {
      return { needed: true, at: null, reason: 'use_spot_unreachable' };
    }
    return { needed: true, at: spot, reason: null };
  };

  /* An action is legal when its own rules allow it and the place it is done
   * from can be walked to. Candidates, starts and arrivals all ask this. */
  Sim.prototype.legality = function (actor, def, target) {
    var verdict;
    try { verdict = def.eligible(this.context(actor, target)); } catch (e) { verdict = { reason: 'error:' + (e && e.message) }; }
    if (verdict !== true) return { reason: (verdict && verdict.reason) || 'ineligible' };
    var spot = this.useSpot(actor, def, target);
    if (spot.needed && !spot.at) return { reason: spot.reason };
    return true;
  };

  /* Choosing an activity and doing it are different moments. The record made
   * here says what was chosen; if it has to be done somewhere else in the room
   * the person first walks there (`approaching`), and only on arrival does the
   * activity begin: its clock, its per-minute effects, whatever it opens. */
  Sim.prototype.startActivity = function (actor, candidate, source, requestId) {
    var def = A.get(candidate.actionId);
    if (!def) return { ok: false, error: 'unknown_action' };
    var target = this.resolveTarget(candidate);
    var legal = this.legality(actor, def, target);
    if (legal !== true) return { ok: false, error: legal.reason };
    var ctx = this.context(actor, target);
    var spot = this.useSpot(actor, def, target);
    var here = !spot.needed || (spot.at.x === actor.pos.x && spot.at.y === actor.pos.y);

    var minutes = Math.max(1, Math.round(def.duration(ctx)));
    actor.activity = {
      id: 'act_' + (++this.eventSeq),
      actionId: candidate.actionId,
      label: def.label + (target && target.name ? ' — ' + target.name : ''),
      targetKind: def.targetKind, targetId: candidate.targetId || null,
      phase: here ? 'executing' : 'approaching',
      chosenAbs: this.absMinute(), approachMinutes: 0,
      startDay: this.state.day, startMin: this.state.minute,
      startAbs: this.absMinute(),
      plannedMinutes: minutes,
      endAbs: this.absMinute() + minutes,
      elapsed: 0,
      interruptible: !!def.interruptible,
      settled: false,
      conversationId: null,
      source: source, requestId: requestId || null
    };
    actor.walkTarget = here ? null : spot.at;
    this.touch();
    this.emit('ACTIVITY_STARTED', {
      actorId: actor.id, locationId: actor.location,
      data: { actionId: candidate.actionId, targetId: candidate.targetId || null,
              minutes: minutes, source: source, requestId: requestId || null,
              phase: actor.activity.phase },
      text: actor.name + (here ? ' began: ' : ' set about: ') + actor.activity.label + ' (' + minutes + ' min)'
    });
    var started = actor.activity;
    if (here) this.beginExecution(actor);
    return { ok: true, activity: started };
  };

  /* The activity actually starts: at the use spot, facing the right way. How
   * long it lasts is worked out now — a shift reached at 09:06 is paid from
   * 09:06 — and its rules are asked again, because the walk took time. */
  Sim.prototype.beginExecution = function (actor) {
    var act = actor.activity, def = A.get(act.actionId);
    var target = this.resolveTarget({ targetKind: act.targetKind, targetId: act.targetId });
    var ctx = this.context(actor, target);
    if (act.approachMinutes > 0) {
      var verdict;
      try { verdict = def.eligible(ctx); } catch (e) { verdict = { reason: 'error:' + (e && e.message) }; }
      if (verdict !== true) return this.failActivity(actor, (verdict && verdict.reason) || 'ineligible');
      act.plannedMinutes = Math.max(1, Math.round(def.duration(ctx)));
    }
    act.phase = 'executing';
    act.startDay = this.state.day; act.startMin = this.state.minute;
    act.startAbs = this.absMinute(); act.endAbs = act.startAbs + act.plannedMinutes;
    act.elapsed = 0;
    this.touch();
    if (def.onStart) def.onStart(ctx);
    if (act.approachMinutes > 0 && actor.activity === act && act.phase === 'executing') {
      this.emit('ACTIVITY_REACHED', {
        actorId: actor.id, locationId: actor.location,
        data: { actionId: act.actionId, targetId: act.targetId, approachMinutes: act.approachMinutes, minutes: act.plannedMinutes },
        text: actor.name + ' got there and began: ' + act.label + ' (' + act.plannedMinutes + ' min)'
      });
    }
  };

  /* Chosen, not done. Nothing of the activity is settled; the reason is an
   * event anyone can read, and the same thing is not tried again at once. */
  Sim.prototype.failActivity = function (actor, reason) {
    var act = actor.activity;
    if (!act) return false;
    this.emit('ACTIVITY_FAILED', {
      actorId: actor.id, locationId: actor.location,
      data: { actionId: act.actionId, targetId: act.targetId, phase: act.phase, reason: reason,
              approachMinutes: act.approachMinutes },
      text: actor.name + ' could not: ' + act.label + ' (' + reason + ')'
    });
    actor.recentFailures = actor.recentFailures || {};
    actor.recentFailures[act.actionId + (act.targetId ? ':' + act.targetId : '')] = this.absMinute();
    actor.activity = null;
    actor.walkTarget = null;
    actor.lastFinishedAbs = this.absMinute();
    this.touch();
    if (act.conversationId) {
      var conv = this.conversationById(act.conversationId);
      if (conv && conv.status === 'proposed') this.closeProposal(conv, 'withdrawn', reason);
      else this.endConversation(conv, reason);
    }
    return false;
  };

  Sim.prototype.advanceActivity = function (actor, minutes) {
    var act = actor.activity;
    if (!act) return;
    var def = A.get(act.actionId);
    var target = this.resolveTarget({ targetKind: act.targetKind, targetId: act.targetId });
    var ctx = this.context(actor, target);
    ctx.activity = act;

    if (act.phase === 'approaching') {
      /* Walking there costs what walking costs. It is not a minute of work,
       * practice, rest or talk, and none of those are counted. */
      var still;
      try { still = def.eligible(ctx); } catch (e) { still = { reason: 'error:' + (e && e.message) }; }
      if (still !== true) return this.failActivity(actor, (still && still.reason) || 'ineligible');   // the shift ended, they left: stop walking
      var spot = this.useSpot(actor, def, target);
      if (!spot.at) return this.failActivity(actor, spot.reason);
      if (spot.at.x === actor.pos.x && spot.at.y === actor.pos.y) {
        actor.pos = { x: actor.pos.x, y: actor.pos.y, dir: spot.at.dir || actor.pos.dir };
        actor.walkTarget = null;
        return this.beginExecution(actor);
      }
      actor.walkTarget = spot.at;            // a person may have moved; a counter has not
      act.approachMinutes += minutes;
      this.adjustNeed(actor, 'energy', -0.02 * minutes);
      this.touch();
      return;
    }
    if (act.phase === 'waiting_reply') { this.touch(); return; }   // asked; the answer is the other person's

    if (act.conversationId) {
      var conv = this.conversationById(act.conversationId);
      if (conv && conv.status === 'active' && !this.conversationIntact(conv)) {
        this.endConversation(conv, 'participant_left');
        return;
      }
    }
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
    if (def.onInterrupt && act.phase === 'executing') def.onInterrupt(ctx);
    this.emit('ACTIVITY_INTERRUPTED', {
      actorId: actor.id, locationId: actor.location,
      data: { actionId: act.actionId, elapsed: act.elapsed, planned: act.plannedMinutes, reason: reason, phase: act.phase },
      text: actor.name + ' stopped: ' + act.label + ' (' + reason + ')'
    });
    actor.activity = null;
    actor.walkTarget = null;
    this.touch();
    if (act.conversationId) {
      var conv = this.conversationById(act.conversationId);
      if (conv && conv.status === 'proposed') this.closeProposal(conv, 'withdrawn', reason);
      else this.endConversation(conv, reason);
    }
    return true;
  };

  /* ---------------- movement inside a place ---------------- */

  Sim.prototype.walkStep = function (actor) {
    var t = actor.walkTarget;
    if (!t) return;
    var loc = W.LOCATIONS[actor.location];
    if (!loc) return;
    var p = actor.pos;
    if (p.x === t.x && p.y === t.y) {
      if (t.dir && p.dir !== t.dir) { actor.pos = { x: p.x, y: p.y, dir: t.dir }; this.touch(); }
      actor.walkTarget = null;
      return;
    }
    var n = this.nextStep(loc, p, t);
    if (!n) { actor.walkTarget = null; return; }   // walled off: stay put rather than slide through
    actor.pos = { x: n.x, y: n.y, dir: n.dir };
    this.touch();
  };

  /* One step along a shortest walkable route. Rooms have furniture people have
   * to walk round — the back of a counter is reached by its end, not through
   * it — so heading straight at the target is not enough. Breadth-first over a
   * room of a hundred-odd cells; neighbour order is fixed, so the route is
   * deterministic. */
  var STEP_DIRS = [{ x: 0, y: -1, dir: 'up' }, { x: 1, y: 0, dir: 'right' },
                   { x: 0, y: 1, dir: 'down' }, { x: -1, y: 0, dir: 'left' }];
  Sim.prototype.nextStep = function (loc, from, to) {
    var rows = loc.rows, w = rows[0].length, h = rows.length;
    var key = function (x, y) { return y * w + x; };
    var cameFrom = {}, queue = [{ x: to.x, y: to.y }], head = 0;
    cameFrom[key(to.x, to.y)] = true;
    /* Searched from the target back to the walker, so the answer is simply
     * the neighbour of `from` that the search reached first. */
    while (head < queue.length) {
      var cur = queue[head++];
      for (var i = 0; i < STEP_DIRS.length; i++) {
        var d = STEP_DIRS[i], nx = cur.x + d.x, ny = cur.y + d.y;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (cameFrom[key(nx, ny)]) continue;
        if (nx === from.x && ny === from.y) {
          var back = STEP_DIRS[(i + 2) % 4];
          return { x: cur.x, y: cur.y, dir: back.dir };
        }
        if (W.isSolid(EMBER.Grid.cell(rows, nx, ny, '#'))) continue;
        cameFrom[key(nx, ny)] = true;
        queue.push({ x: nx, y: ny });
      }
    }
    return null;
  };

  /* Steps along the shortest walkable route, or -1 when there is none. */
  Sim.prototype.routeLength = function (loc, from, to) {
    if (from.x === to.x && from.y === to.y) return 0;
    var rows = loc.rows, w = rows[0].length, h = rows.length;
    var dist = {}, queue = [{ x: from.x, y: from.y }], head = 0;
    dist[from.y * w + from.x] = 0;
    while (head < queue.length) {
      var cur = queue[head++], d0 = dist[cur.y * w + cur.x];
      for (var i = 0; i < STEP_DIRS.length; i++) {
        var nx = cur.x + STEP_DIRS[i].x, ny = cur.y + STEP_DIRS[i].y;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || dist[ny * w + nx] !== undefined) continue;
        if (nx === to.x && ny === to.y) return d0 + 1;
        if (W.isSolid(EMBER.Grid.cell(rows, nx, ny, '#'))) continue;
        dist[ny * w + nx] = d0 + 1;
        queue.push({ x: nx, y: ny });
      }
    }
    return -1;
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
    /* A promise being kept, broken or newly made changes what is worth doing. */
    var promises = (actor.commitments || []).map(function (c) { return c.id + ':' + c.status; }).sort().join(',');
    /* Being asked something is a reason to think again. */
    var asked = this.state.conversations.filter(function (c) {
      return c.status === 'proposed' && c.inviteeId === actor.id;
    }).map(function (c) { return c.id; }).join(',');
    return [
      actor.location,
      actor.activity ? actor.activity.actionId : '-',
      Math.round(actor.money), Math.round(actor.savings),
      Math.floor(actor.needs.energy / 5), Math.floor(actor.needs.hunger / 5),
      here, offers, promises, asked
    ].join('|');
  };

  Sim.prototype.buildRequest = function (actor, reason, reissuedSeq) {
    var cand = P.candidates(this, actor);
    /* A restored world puts its open questions again under the numbers they
     * already had: it is the same question, and a recording made of the
     * uninterrupted run must still line up with it. The id, though, says which
     * load asked it, so an answer addressed to the question as it was asked
     * before the save — by a provider that no longer has anything to do with
     * this world — is an unknown request here, not a second answer. Only the
     * save layer passes this, and only for a number not live in this sim. */
    var self = this;
    if (reissuedSeq && (reissuedSeq > this.requestSeq ||
        Object.keys(this.requests).some(function (k) { return self.requests[k].request.seq === reissuedSeq; }))) {
      throw new Error('cannot re-issue request ' + reissuedSeq);
    }
    var seq = reissuedSeq || ++this.requestSeq;
    var request = {
      requestId: 'req_' + seq + (reissuedSeq ? '.' + (this.loads || 1) : ''), seq: seq,
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
    /* The sim's record of the question is its own. Several fields above are
     * live references into the world (offer params, memory objects), so the
     * record is a detached copy, and a provider is handed another one. Nothing
     * a provider does to its request can reach the world or the record. */
    request = deepCopy(request);
    this.requests[request.requestId] = {
      request: request, resolved: false, timedOut: false, actorId: actor.id,
      rejectedCandidates: cand.rejected
    };
    return request;
  };

  Sim.prototype.requestDecision = function (actor, reason, reissuedSeq, firstAskedAbs) {
    var policy = Pol.get(actor.policyId);
    if (!policy) throw new Error('no policy registered for ' + actor.id + ' (' + actor.policyId + ')');
    var request = this.buildRequest(actor, reason, reissuedSeq);
    actor.pending = {
      requestId: request.requestId, seq: request.seq,
      /* A question put again after a reload has been open since it was first
       * asked: the timeout runs from then, or reloading often enough would
       * let someone wait for ever. */
      issuedAbs: firstAskedAbs === undefined ? request.absMinute : firstAskedAbs,
      relevanceKey: request.relevanceKey,
      candidateIds: request.candidates.map(function (c) { return c.id; })
    };
    this.touch();
    var self = this;
    var requestId = request.requestId;
    var result;
    try { result = policy.decide(deepCopy(request)); } catch (e) { result = Promise.resolve(Pol.failed(request, actor.policyId, e)); }
    /* The completion is tied to the question that was asked, not to whatever
     * identity the answer claims, so an answer with no id or the wrong id is
     * still this request's answer and takes this request's refusal path. */
    Promise.resolve(result).then(function (response) { self.receive(requestId, response); },
                                 function (err) { self.receive(requestId, Pol.failed(request, actor.policyId, err)); });
    return request;
  };

  /* An answer arriving for a known request. Responses never apply where they
   * land: they queue, and the queue is drained at a tick boundary. */
  Sim.prototype.receive = function (requestId, response) {
    var rec = this.requests[requestId];
    if (!rec) {
      this.rejections.push({ stamp: this.stamp(), requestId: requestId, reason: 'unknown_request' });
      return false;
    }
    if (rec.resolved) {
      this.rejections.push({ stamp: this.stamp(), requestId: requestId, actorId: rec.actorId,
                             reason: rec.timedOut ? 'late_response' : 'duplicate_response' });
      return false;
    }
    var invalid = null, copy = null;
    if (!response || typeof response !== 'object' || typeof response.requestId !== 'string') invalid = 'malformed_response';
    else if (response.requestId !== requestId) invalid = 'request_id_mismatch';
    else { try { copy = deepCopy(response); } catch (e) { invalid = 'malformed_response'; } }
    rec.resolved = true;
    rec.response = invalid ? { requestId: requestId, status: 'invalid', invalid: invalid } : copy;
    this.inbox.push(rec.response);
    return true;
  };

  /* The entry point for a transport that only has the answer in hand. With no
   * usable identity there is no request to route it to, so it can only be
   * logged; a provider called through requestDecision never ends up here. */
  Sim.prototype.deliver = function (response) {
    if (!response || typeof response !== 'object' || typeof response.requestId !== 'string') {
      this.rejections.push({ stamp: this.stamp(), requestId: null, reason: 'malformed_response' });
      return false;
    }
    return this.receive(response.requestId, response);
  };

  /* Ordering promise, stated exactly: answers that have arrived by the same
   * tick boundary are applied in request order, whatever order they arrived
   * in. An answer that has not arrived does not hold the others up — one slow
   * brain must not stop the town — so when an answer arrives does shape what
   * happens next. Reproducing a run is RecordedPolicy's job, not this queue's. */
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

    var shape = response.status === 'invalid'
      ? { ok: false, error: response.invalid }
      : Pol.validateResponse(request, response);
    if (!shape.ok) {
      actor.pending = null;
      var refused = this.reject(request, shape.error, shape.detail || null);
      /* The policy, not the world, is what went wrong here, so asking it again
       * this minute would spin: a policy that answers with garbage once will
       * answer with garbage again. The character waits instead, tagged as a
       * fallback so nothing downstream reads it as a choice. */
      this.fallback(actor, shape.error);
      return refused;
    }
    if (shape.unavailable) {
      actor.pending = null;
      this.reject(request, 'policy_unavailable');
      return this.fallback(actor, 'policy_unavailable');
    }

    if (actor.activity) { actor.pending = null; return this.reject(request, 'actor_already_busy'); }

    /* The two refusals below are different in kind: the answer was well formed
     * and the policy is healthy, but the world moved underneath it. No fallback
     * here — the actor re-asks on the next tick, against the world that
     * actually exists now, which is the correct response to a stale answer. */
    var nowKey = this.relevanceKey(actor);
    if (nowKey !== request.relevanceKey) {
      actor.pending = null;
      return this.reject(request, 'stale_state', { was: request.relevanceKey, now: nowKey });
    }

    /* The answer names a candidate; it does not describe one. What executes is
     * the sim's own candidate of that id, derived from the present world — not
     * the request snapshot, and never anything a provider could have touched. */
    var live = P.candidates(this, actor).legal;
    var candidate = null;
    for (var i = 0; i < live.length; i++) {
      if (live[i].id === response.selectedId) { candidate = live[i]; break; }
    }
    if (!candidate) {
      actor.pending = null;
      return this.reject(request, 'candidate_no_longer_legal', { candidateId: response.selectedId });
    }

    var started = this.startActivity(actor, candidate, response.source || actor.policyId, request.requestId);
    actor.pending = null;
    if (!started.ok) {
      var refusedExec = this.reject(request, 'execution_refused', started);
      this.fallback(actor, 'execution_refused');
      return refusedExec;
    }

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
    this.expireProposals();
    this.expireDecisions();

    this.actorIds().forEach(function (id) {
      var actor = self.state.characters[id];
      if (actor.activity || actor.pending) return;
      self.requestDecision(actor, actor.lastFinishedAbs === self.absMinute() ? 'activity_complete' : 'idle');
    });
    return this.state;
  };

  /* A provider that never answers must not hold a person still for ever. Past
   * the timeout the request is closed, the person falls back, and an answer
   * that turns up afterwards is refused as late. */
  Sim.prototype.expireDecisions = function () {
    var self = this, now = this.absMinute();
    this.actorIds().forEach(function (id) {
      var actor = self.state.characters[id];
      if (!actor.pending || now - actor.pending.issuedAbs < self.decisionTimeoutMinutes) return;
      var rec = self.requests[actor.pending.requestId];
      if (rec.resolved) return;   // answered, waiting in the inbox for the next flush
      rec.resolved = true;
      rec.timedOut = true;
      actor.pending = null;
      self.reject(rec.request, 'policy_timeout', { afterMinutes: now - rec.request.absMinute });
      self.fallback(actor, 'policy_timeout');
    });
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
    /* The same courtesy before the first minute as between any two: a question
     * asked just before this call (a world that has only now been restored
     * re-asks its open ones) gets its answer in before the clock moves, exactly
     * as it would have had the run never stopped. */
    return Promise.resolve().then(function () { return Promise.resolve(); }).then(step);
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
