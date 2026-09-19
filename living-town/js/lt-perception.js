/* lt-perception.js — Living Town: what a character can know, and what they keep.
 *
 * Nobody reads the whole world. Observations are built from the place someone
 * is standing in, the people in it, the things addressed to them and the
 * commitments they made. Memories are written only from events the simulation
 * actually executed and this character actually perceived.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function' && !LT.World) require('./lt-world.js');
  if (typeof require === 'function' && !LT.Actions) require('./lt-actions.js');
  var W = LT.World, A = LT.Actions, U = LT.Util;
  var P = LT.Perception = LT.Perception || {};

  P.MEMORY_LIMIT = 40;

  P.observe = function (sim, actor) {
    var state = sim.state;
    var loc = W.LOCATIONS[actor.location] || null;
    var present = [];
    Object.keys(state.characters).forEach(function (id) {
      if (id === actor.id) return;
      var c = state.characters[id];
      if (c.location !== actor.location || c.transit) return;
      present.push({
        id: c.id, name: c.name,
        doing: c.activity ? c.activity.label : 'nothing in particular'
      });
    });
    var objects = sim.objectsAt(actor.location).map(function (o) {
      return { id: o.id, name: o.name, tags: (o.tags || []).slice(), affordances: (o.affordances || []).slice() };
    });
    var offers = sim.offersFor(actor).map(function (o) {
      return {
        id: o.id, type: o.type, status: o.status, from: o.fromLabel,
        summary: o.summary, params: o.params,
        expiresAt: U.stamp(o.expiresDay, o.expiresMin)
      };
    });
    return {
      day: state.day, minute: state.minute, clock: U.clock(state.minute),
      location: loc ? {
        id: loc.id, name: sim.locationName(loc.id), kind: loc.kind, indoor: !!loc.indoor,
        open: state.minute >= loc.opens && state.minute < loc.closes,
        opensAt: U.clock(loc.opens), closesAt: U.clock(loc.closes)
      } : null,
      inTransit: actor.transit ? { from: actor.transit.from, to: actor.transit.to } : null,
      present: present,
      objects: objects,
      offers: offers,
      /* Public information anyone in town would know. */
      reachable: W.destinations().filter(function (id) {
        return id !== actor.location && W.mayEnter(id, actor.id);
      })
        .map(function (id) {
          var l = W.LOCATIONS[id];
          return { id: id, name: sim.locationName(id), walkMinutes: W.travelMinutes(actor.location, id),
                   opensAt: U.clock(l.opens), closesAt: U.clock(l.closes) };
        })
    };
  };

  /* Every mechanically legal action available to this character right now, plus
   * the ones that were considered and refused. A policy sees only `legal`. */
  P.candidates = function (sim, actor) {
    var legal = [], rejected = [];
    var seen = {};

    function consider(actionId, target, extra) {
      var def = A.get(actionId);
      if (!def) return;
      var targetId = target ? (target.id || target) : null;
      var key = actionId + (targetId ? ':' + targetId : '');
      if (seen[key]) return;
      seen[key] = true;
      var ctx = sim.context(actor, target);
      /* The action's own rules, and a walkable way to where it is done from. */
      var verdict = sim.legality(actor, def, target);
      /* Something that has just failed is not offered again at once: the
       * reason it failed (a blocked spot, someone busy) rarely clears in a minute. */
      var failedAt = (actor.recentFailures || {})[key];
      if (verdict === true && failedAt !== undefined && sim.absMinute() - failedAt < 30) verdict = { reason: 'recently_failed' };
      if (verdict !== true) {
        rejected.push({ id: key, actionId: actionId, targetId: targetId,
                        reason: (verdict && verdict.reason) || 'ineligible' });
        return;
      }
      var duration = Math.max(1, Math.round(def.duration(ctx)));
      legal.push({
        id: key, actionId: actionId, targetKind: def.targetKind, targetId: targetId,
        label: def.label + (target && target.name ? ' — ' + target.name : (extra && extra.withName ? ' — ' + extra.withName : '')),
        durationMinutes: duration,
        interruptible: !!def.interruptible,
        meta: extra || {}
      });
    }

    // things standing in the room
    sim.objectsAt(actor.location).forEach(function (o) {
      (o.affordances || []).forEach(function (id) { consider(id, o); });
    });

    // the employer's counter is an affordance too, but only for the employee
    if (actor.employment && actor.location === actor.employment.locationId) {
      consider('work_shift', sim.objectById('obj_counter'));
    }

    // people
    Object.keys(sim.state.characters).forEach(function (id) {
      if (id === actor.id) return;
      var other = sim.state.characters[id];
      if (other.location !== actor.location || other.transit) return;
      consider('greet', other);
      consider('talk_with', other);
    });

    // someone has come over and spoken: join them, or not
    sim.state.conversations.forEach(function (c) {
      if (c.status !== 'proposed' || c.inviteeId !== actor.id) return;
      var asker = sim.state.characters[c.initiatorId];
      consider('join_conversation', c, { withId: asker.id, withName: asker.name });
      consider('decline_conversation', c, { withId: asker.id, withName: asker.name });
    });

    // opportunities addressed to this character
    sim.offersFor(actor).forEach(function (o) {
      consider('accept_offer', o);
      consider('decline_offer', o);
      if (o.grantsAction) consider(o.grantsAction, o);
    });

    // going somewhere
    W.destinations().forEach(function (id) {
      if (id === actor.location) return;
      if (!W.mayEnter(id, actor.id)) return;
      consider('travel', { id: id, name: sim.locationName(id) });
    });

    consider('wash_and_dress', null);
    consider('withdraw_savings', null);
    consider('wait', null);

    legal.sort(function (a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });
    rejected.sort(function (a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });
    return { legal: legal, rejected: rejected };
  };

  /* Memories are written by the simulation when an event is perceived, never by
   * a policy and never for something that did not execute. */
  P.remember = function (actor, memory) {
    actor.memories = actor.memories || [];
    actor.memories.push(memory);
    if (actor.memories.length > P.MEMORY_LIMIT) {
      // Evict the least salient; ties go to the oldest.
      var worst = 0;
      for (var i = 1; i < actor.memories.length; i++) {
        var m = actor.memories[i], b = actor.memories[worst];
        if (m.salience < b.salience) worst = i;
      }
      actor.memories.splice(worst, 1);
    }
    return memory;
  };

  /* Memories a policy should be shown for this decision: the most salient
   * recent ones, plus anything still unresolved. */
  P.relevantMemories = function (actor, limit) {
    var all = (actor.memories || []).slice();
    all.sort(function (a, b) {
      if (b.salience !== a.salience) return b.salience - a.salience;
      return b.absMinute - a.absMinute;
    });
    return all.slice(0, limit || 8);
  };
})();
