/* lt-actions.js — Living Town: the action catalogue.
 *
 * An action is the only way world state changes. Each one declares what it
 * needs, how long it takes, what it drains per minute and what it settles once
 * at completion. A decision policy may pick only from these; it can neither
 * invent an action nor reach past one into the state.
 *
 * Contract per definition:
 *   id, label, targetKind: null|'object'|'person'|'offer'|'location'
 *   duration(ctx)      -> whole minutes, > 0
 *   eligible(ctx)      -> true, or { reason } explaining refusal
 *   tick(ctx, minutes) -> continuous drain/recovery; survives interruption
 *   onComplete(ctx)    -> discrete settlement; the sim runs it exactly once
 *   onInterrupt(ctx)   -> optional; no discrete settlement is allowed here
 *   yieldsToConversation -> someone doing this answers when spoken to
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function' && !LT.World) require('./lt-world.js');
  var W = LT.World;
  var A = LT.Actions = LT.Actions || {};

  /* Baseline metabolism, per simulated minute. */
  var DRIFT = { hunger: 0.055, energy: -0.045 };
  var SAVINGS_SHARE = 0.6;   // the rest is spent living
  var WORK_BLOCK = 120;      // a shift is worked in blocks, so the café floor
                             // is a place where small decisions happen

  A.DRIFT = DRIFT;
  A.SAVINGS_SHARE = SAVINGS_SHARE;
  A.WORK_BLOCK = WORK_BLOCK;

  function need(ctx, key, delta) { ctx.sim.adjustNeed(ctx.actor, key, delta); }

  function at(ctx, locationId) { return ctx.actor.location === locationId; }

  function atHome(ctx) { return ctx.actor.location === ctx.actor.homeId; }

  function locationOpen(ctx, locationId) {
    var loc = W.LOCATIONS[locationId];
    if (!loc) return false;
    return ctx.minute >= loc.opens && ctx.minute < loc.closes;
  }

  function personPresent(ctx, id) {
    var other = ctx.state.characters[id];
    return !!(other && other.location === ctx.actor.location && !other.transit);
  }

  var DEFS = {

    /* ---------------- home ---------------- */

    sleep: {
      id: 'sleep', label: 'Sleep', targetKind: 'object', interruptible: true,
      duration: function (ctx) {
        // Until 06:30, or a hard cap so a nap cannot swallow a whole day.
        var wake = 390;
        var mins = ctx.minute < wake ? wake - ctx.minute : (1440 - ctx.minute) + wake;
        return Math.max(30, Math.min(540, mins));
      },
      eligible: function (ctx) {
        if (!atHome(ctx)) return { reason: 'not_at_home' };
        if (ctx.minute > 420 && ctx.minute < 1230 && ctx.actor.needs.energy > 22) {
          return { reason: 'not_tired_enough' };
        }
        return true;
      },
      tick: function (ctx, m) { need(ctx, 'energy', 0.13 * m); need(ctx, 'hunger', 0.02 * m); },
      onComplete: function (ctx) {
        ctx.emit('SLEPT', {}, ctx.actor.name + ' woke up at home.');
      }
    },

    eat_at_home: {
      id: 'eat_at_home', label: 'Eat at home', targetKind: 'object', interruptible: false,
      duration: function () { return 20; },
      eligible: function (ctx) {
        if (!atHome(ctx)) return { reason: 'not_at_home' };
        if ((ctx.actor.pantry || 0) <= 0) return { reason: 'no_food_at_home' };
        if (ctx.actor.needs.hunger < 18) return { reason: 'not_hungry' };
        return true;
      },
      tick: function (ctx, m) { need(ctx, 'energy', 0.01 * m); },
      onComplete: function (ctx) {
        ctx.actor.pantry -= 1;
        need(ctx, 'hunger', -45);
        ctx.emit('ATE', { source: 'home', pantryLeft: ctx.actor.pantry },
          ctx.actor.name + ' ate at home.');
      }
    },

    wash_and_dress: {
      id: 'wash_and_dress', label: 'Wash and dress', targetKind: null, interruptible: false,
      duration: function () { return 15; },
      eligible: function (ctx) {
        if (!atHome(ctx)) return { reason: 'not_at_home' };
        if (ctx.actor.readyDay === ctx.day) return { reason: 'already_ready' };
        return true;
      },
      tick: function (ctx, m) { need(ctx, 'energy', 0.01 * m); },
      onComplete: function (ctx) {
        ctx.actor.readyDay = ctx.day;
        ctx.emit('PREPARED', {}, ctx.actor.name + ' got ready for the day.');
      }
    },

    practise_guitar: {
      id: 'practise_guitar', label: 'Practise guitar', targetKind: 'object', interruptible: true,
      duration: function () { return 60; },
      eligible: function (ctx) {
        if (!atHome(ctx)) return { reason: 'not_at_home' };
        var g = ctx.sim.objectById('obj_guitar');
        if (!g || g.owner !== ctx.actor.id) return { reason: 'no_instrument' };
        if (ctx.actor.needs.energy < 12) return { reason: 'too_tired' };
        return true;
      },
      tick: function (ctx, m) { need(ctx, 'energy', -0.03 * m); },
      onComplete: function (ctx) {
        ctx.actor.practiceMinutes = (ctx.actor.practiceMinutes || 0) + 60;
        ctx.sim.keepCommitment(ctx.actor, 'cmt_practise');
        ctx.emit('PRACTISED', { minutes: 60, total: ctx.actor.practiceMinutes },
          ctx.actor.name + ' practised for an hour.');
      }
    },

    /* ---------------- travel ---------------- */

    travel: {
      id: 'travel', label: 'Walk to', targetKind: 'location', interruptible: false,
      duration: function (ctx) { return W.travelMinutes(ctx.actor.location, ctx.target.id); },
      eligible: function (ctx) {
        var to = ctx.target && ctx.target.id;
        if (!to || !W.LOCATIONS[to]) return { reason: 'unknown_destination' };
        if (to === ctx.actor.location) return { reason: 'already_there' };
        if (W.travelMinutes(ctx.actor.location, to) <= 0) return { reason: 'no_route' };
        return true;
      },
      onStart: function (ctx) {
        var from = ctx.actor.location, dest = ctx.target.id;
        ctx.sim.beginTransit(ctx.actor, from, dest);
        ctx.emit('DEPARTED', { from: from, to: dest },
          ctx.actor.name + ' set off for ' + ctx.sim.locationName(dest) + '.');
      },
      tick: function (ctx, m) { need(ctx, 'energy', -0.02 * m); },
      onComplete: function (ctx) {
        var to = ctx.target.id;
        ctx.sim.endTransit(ctx.actor, to);
        ctx.emit('ARRIVED', { at: to },
          ctx.actor.name + ' arrived at ' + ctx.sim.locationName(to) + '.');
      },
      onInterrupt: function (ctx) {
        // A walk cannot be half-taken: the walker is returned to where they set
        // out from rather than left standing in a place that does not exist.
        ctx.sim.endTransit(ctx.actor, ctx.actor.transit ? ctx.actor.transit.from : ctx.actor.location);
      }
    },

    /* ---------------- work ---------------- */

    work_shift: {
      id: 'work_shift', label: 'Work the shift', targetKind: 'object', interruptible: true,
      duration: function (ctx) {
        /* Never past the end of the shift: eligibility guarantees at least a
         * minute remains, and a last short block is paid for what it is. */
        var e = ctx.actor.employment;
        return Math.min(WORK_BLOCK, e.shiftEnd - ctx.minute);
      },
      eligible: function (ctx) {
        var e = ctx.actor.employment;
        if (!e) return { reason: 'not_employed' };
        if (!at(ctx, e.locationId)) return { reason: 'not_at_workplace' };
        if (!locationOpen(ctx, e.locationId)) return { reason: 'workplace_closed' };
        if (ctx.minute < e.shiftStart) return { reason: 'shift_not_started' };
        if (ctx.minute >= e.shiftEnd) return { reason: 'shift_over' };
        return true;
      },
      tick: function (ctx, m) { need(ctx, 'hunger', 0.03 * m); need(ctx, 'energy', -0.022 * m); },
      onComplete: function (ctx) {
        var e = ctx.actor.employment;
        var hours = ctx.activity.plannedMinutes / 60;
        var gross = Math.round(hours * e.wagePerHour * 100) / 100;
        var saved = Math.round(gross * SAVINGS_SHARE * 100) / 100;
        ctx.sim.credit(ctx.actor, { savings: saved, money: Math.round((gross - saved) * 100) / 100 });
        ctx.actor.workedMinutes = (ctx.actor.workedMinutes || 0) + ctx.activity.plannedMinutes;
        ctx.actor.lastWorkAbs = ctx.absMinute;
        if (ctx.minute >= e.shiftEnd) ctx.sim.keepCommitment(ctx.actor, 'cmt_shift');
        ctx.emit('WORKED', { minutes: ctx.activity.plannedMinutes, gross: gross, saved: saved },
          ctx.actor.name + ' worked ' + ctx.activity.plannedMinutes + ' min at the café (+' + gross + ' EUR).');
      }
    },

    work_extra_shift: {
      id: 'work_extra_shift', label: 'Work the extra shift', targetKind: 'offer', interruptible: true,
      duration: function (ctx) {
        return Math.min(WORK_BLOCK, ctx.target.endAbs - ctx.absMinute);
      },
      eligible: function (ctx) {
        var o = ctx.target;
        if (!o || o.type !== 'offer_extra_work') return { reason: 'not_an_extra_shift' };
        if (o.status !== 'accepted') return { reason: 'not_accepted' };
        if (!at(ctx, o.params.locationId)) return { reason: 'not_at_workplace' };
        if (!locationOpen(ctx, o.params.locationId)) return { reason: 'workplace_closed' };
        /* The window is a moment in the town's history, not an hour that comes
         * round again tomorrow. */
        if (ctx.absMinute < o.startAbs) return { reason: 'too_early' };
        if (ctx.absMinute >= o.endAbs) return { reason: 'shift_over' };
        return true;
      },
      tick: function (ctx, m) { need(ctx, 'hunger', 0.03 * m); need(ctx, 'energy', -0.028 * m); },
      onComplete: function (ctx) {
        var o = ctx.target;
        var total = o.endAbs - o.startAbs;
        var share = ctx.activity.plannedMinutes / total;
        var gross = Math.round(o.params.pay * share * 100) / 100;
        var saved = Math.round(gross * SAVINGS_SHARE * 100) / 100;
        ctx.sim.credit(ctx.actor, { savings: saved, money: Math.round((gross - saved) * 100) / 100 });
        o.workedMinutes = (o.workedMinutes || 0) + ctx.activity.plannedMinutes;
        ctx.actor.lastWorkAbs = ctx.absMinute;
        if (ctx.absMinute >= o.endAbs) {
          o.status = 'completed';
          /* Being on the floor when it ends is not enough: the promise was to
           * work the shift, so most of it has to have been worked. */
          var needed = (o.commitment && o.commitment.minWorkedShare) || 0;
          if (o.workedMinutes / total >= needed) ctx.sim.keepCommitment(ctx.actor, 'cmt_extra_' + o.id);
        }
        ctx.emit('WORKED_EXTRA', { offerId: o.id, minutes: ctx.activity.plannedMinutes, gross: gross, saved: saved },
          ctx.actor.name + ' worked the extra shift (+' + gross + ' EUR).');
      }
    },

    take_break: {
      id: 'take_break', label: 'Take a break', targetKind: 'object', interruptible: true,
      yieldsToConversation: true,
      duration: function () { return 15; },
      eligible: function (ctx) {
        if (!at(ctx, 'cafe')) return { reason: 'not_at_cafe' };
        if (!locationOpen(ctx, 'cafe')) return { reason: 'cafe_closed' };
        if ((ctx.actor.workedMinutes || 0) <= 0) return { reason: 'nothing_to_break_from' };
        /* A break belongs to a shift. Once the work has stopped, standing at
         * the counter resting is not a break, it is loitering. */
        if (ctx.absMinute - (ctx.actor.lastWorkAbs || -9999) > 20) return { reason: 'not_on_shift' };
        return true;
      },
      tick: function (ctx, m) { need(ctx, 'energy', 0.05 * m); },
      onComplete: function (ctx) {
        ctx.emit('BROKE', {}, ctx.actor.name + ' took a short break.');
      }
    },

    buy_meal: {
      id: 'buy_meal', label: 'Buy a meal', targetKind: 'object', interruptible: false,
      duration: function () { return 20; },
      eligible: function (ctx) {
        if (!at(ctx, 'cafe')) return { reason: 'not_at_cafe' };
        if (!locationOpen(ctx, 'cafe')) return { reason: 'cafe_closed' };
        if (ctx.actor.money < 6) return { reason: 'cannot_afford' };
        if (ctx.actor.needs.hunger < 18) return { reason: 'not_hungry' };
        return true;
      },
      tick: function (ctx, m) { need(ctx, 'energy', 0.01 * m); },
      onComplete: function (ctx) {
        ctx.sim.credit(ctx.actor, { money: -6 });
        need(ctx, 'hunger', -50);
        ctx.emit('ATE', { source: 'cafe', cost: 6 }, ctx.actor.name + ' bought a meal (-6 EUR).');
      }
    },

    withdraw_savings: {
      id: 'withdraw_savings', label: 'Take money out of savings', targetKind: null, interruptible: false,
      duration: function () { return 5; },
      eligible: function (ctx) {
        if (ctx.actor.savings < 10) return { reason: 'savings_too_low' };
        if (ctx.actor.money >= 8) return { reason: 'has_cash' };
        return true;
      },
      onComplete: function (ctx) {
        ctx.sim.credit(ctx.actor, { savings: -10, money: 10 });
        ctx.emit('WITHDREW', { amount: 10 },
          ctx.actor.name + ' moved 10 EUR out of savings.');
      }
    },

    /* ---------------- people ---------------- */

    greet: {
      id: 'greet', label: 'Greet', targetKind: 'person', interruptible: false,
      duration: function () { return 2; },
      eligible: function (ctx) {
        if (!ctx.target || ctx.target.id === ctx.actor.id) return { reason: 'no_one_to_greet' };
        if (!personPresent(ctx, ctx.target.id)) return { reason: 'not_present' };
        if (ctx.sim.greetedToday(ctx.actor, ctx.target.id)) return { reason: 'already_greeted' };
        return true;
      },
      onComplete: function (ctx) {
        ctx.sim.adjustRelationship(ctx.actor, ctx.target.id, { closeness: 1 });
        ctx.actor.greetedToday = ctx.actor.greetedToday || {};
        ctx.actor.greetedToday[ctx.target.id] = ctx.day;
        ctx.emit('GREETED', { withId: ctx.target.id },
          ctx.actor.name + ' greeted ' + ctx.target.name + '.', [ctx.target.id]);
      }
    },

    talk_with: {
      id: 'talk_with', label: 'Talk with', targetKind: 'person', interruptible: true,
      duration: function () { return 25; },
      eligible: function (ctx) {
        if (!ctx.target || ctx.target.id === ctx.actor.id) return { reason: 'no_one_to_talk_to' };
        if (!personPresent(ctx, ctx.target.id)) return { reason: 'not_present' };
        /* A conversation needs the other person. They join it, so they have to
         * be free to: idle, or doing something one would look up from. */
        if (!ctx.sim.availableToTalk(ctx.target)) return { reason: 'partner_busy' };
        /* The same conversation does not restart the moment it ends. */
        var last = (ctx.actor.lastTalk || {})[ctx.target.id];
        if (last !== undefined && ctx.absMinute - last < 90) return { reason: 'just_talked' };
        return true;
      },
      /* One conversation is one shared thing with two people in it. The sim
       * owns it: whoever speaks first opens it and the other joins, and it is
       * settled once, by whichever of them finishes first. */
      onStart: function (ctx) { ctx.sim.openConversation(ctx.actor, ctx.target, ctx.activity); },
      tick: function (ctx, m) { need(ctx, 'energy', -0.005 * m); },
      onComplete: function (ctx) { ctx.sim.settleConversation(ctx.activity.conversationId); }
    },

    /* ---------------- opportunities ---------------- */

    accept_offer: {
      id: 'accept_offer', label: 'Accept', targetKind: 'offer', interruptible: false,
      duration: function () { return 2; },
      eligible: function (ctx) {
        var o = ctx.target;
        if (!o) return { reason: 'no_offer' };
        if (o.status !== 'open') return { reason: 'offer_' + o.status };
        if (o.toId !== ctx.actor.id) return { reason: 'not_addressed_to_actor' };
        if (ctx.sim.absMinute() >= ctx.sim.abs(o.expiresDay, o.expiresMin)) return { reason: 'expired' };
        return true;
      },
      onComplete: function (ctx) { ctx.sim.acceptOffer(ctx.actor, ctx.target); }
    },

    decline_offer: {
      id: 'decline_offer', label: 'Decline', targetKind: 'offer', interruptible: false,
      duration: function () { return 1; },
      eligible: function (ctx) {
        var o = ctx.target;
        if (!o) return { reason: 'no_offer' };
        if (o.status !== 'open') return { reason: 'offer_' + o.status };
        if (o.toId !== ctx.actor.id) return { reason: 'not_addressed_to_actor' };
        return true;
      },
      onComplete: function (ctx) { ctx.sim.declineOffer(ctx.actor, ctx.target); }
    },

    /* ---------------- elsewhere ---------------- */

    sit_and_rest: {
      id: 'sit_and_rest', label: 'Sit on the bench', targetKind: 'object', interruptible: true,
      yieldsToConversation: true,
      duration: function () { return 20; },
      eligible: function (ctx) {
        if (!ctx.target || ctx.target.location !== ctx.actor.location) return { reason: 'no_seat_here' };
        return true;
      },
      tick: function (ctx, m) { need(ctx, 'energy', 0.06 * m); },
      onComplete: function (ctx) {
        ctx.emit('RESTED', { where: ctx.actor.location }, ctx.actor.name + ' sat for a while.');
      }
    },

    wait: {
      id: 'wait', label: 'Wait', targetKind: null, interruptible: true,
      yieldsToConversation: true,
      duration: function () { return 10; },
      eligible: function () { return true; },
      onComplete: function () { /* waiting settles nothing; it only spends time */ }
    }
  };

  A.get = function (id) { return DEFS[id] || null; };
  A.ids = function () { return Object.keys(DEFS); };
  A.all = function () { return DEFS; };

  /* The world must never advertise an affordance nobody implements. */
  A.auditAffordances = function () {
    var missing = [];
    W.OBJECTS.forEach(function (o) {
      (o.affordances || []).forEach(function (id) {
        if (!DEFS[id]) missing.push(o.id + ' -> ' + id);
      });
    });
    return missing;
  };
})();
