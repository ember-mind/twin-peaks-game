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
 *   yieldsToConversation -> someone doing this looks up when spoken to
 *   position           -> 'use_spot' | 'beside_person' | 'anywhere'. Where the
 *                         action is done from; see Sim.useSpot. With the first
 *                         two the person walks there first, and duration, tick,
 *                         onStart and onComplete only ever apply once they
 *                         have arrived. `spotObject` names the object whose
 *                         use spot it is when the target is not an object.
 *   onStart(ctx)       -> runs when the action really begins, not when chosen
 *   exclusive          -> the target object is used by one person at a time.
 *                         The simulation holds the claim (object.inUseBy); see
 *                         Sim.claim. An action never sets or clears it itself.
 *   candidateMeta(ctx) -> optional plain facts shown to a policy with the
 *                         candidate (how much of the book is left, say)
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
  var HELP_AMOUNT = 8;       // a café meal is 6
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

  function talkMeta(ctx) {
    var c = ctx.target, otherId = c.participants[0] === ctx.actor.id ? c.participants[1] : c.participants[0];
    var other = ctx.state.characters[otherId];
    return { withId: otherId, withName: other ? other.name : null, minutesSoFar: ctx.absMinute - c.startAbs, minutesLeft: Math.max(0, c.endAbs - ctx.absMinute),
             said: (c.lines || []).slice(-4).map(function (l) { return { byId: l.actorId, text: l.text }; }) };
  }

  function personPresent(ctx, id) {
    var other = ctx.state.characters[id];
    return !!(other && other.location === ctx.actor.location && !other.transit);
  }

  var DEFS = {

    /* ---------------- home ---------------- */

    sleep: {
      id: 'sleep', label: 'Sleep', targetKind: 'object', interruptible: true,
      position: 'use_spot',
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
      position: 'use_spot',
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
      position: 'anywhere',
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
      position: 'use_spot',
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
      position: 'anywhere',
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
      position: 'use_spot',
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
      position: 'use_spot', spotObject: 'obj_counter',
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
      position: 'use_spot',
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
      position: 'use_spot',
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

    /* Seeing someone who has plainly not eaten, and handing them the price of
     * a meal. It changes what they can afford and nothing else: whether they
     * go and eat is theirs to decide. Once per person per day. */
    help_out: {
      id: 'help_out', label: 'Give the price of a meal to', targetKind: 'person', interruptible: false,
      position: 'beside_person', offeredToPresent: true,
      duration: function () { return 3; },
      eligible: function (ctx) {
        if (!personPresent(ctx, ctx.target.id)) return { reason: 'not_present' };
        if (!ctx.target.unwell) return { reason: 'they_seem_fine' };
        if (ctx.actor.unwell) return { reason: 'in_need_oneself' };
        if (ctx.actor.money < HELP_AMOUNT + 12) return { reason: 'cannot_spare_it' };
        if (((ctx.actor.helpedOut || {})[ctx.target.id]) === ctx.state.day) return { reason: 'already_helped_today' };
        if (!ctx.sim.availableToTalk(ctx.target)) return { reason: 'partner_busy' };
        return true;
      },
      candidateMeta: function (ctx) { return { toId: ctx.target.id, toName: ctx.target.name, amount: HELP_AMOUNT }; },
      tick: function () {},
      onComplete: function (ctx) {
        var other = ctx.target;
        ctx.sim.credit(ctx.actor, { money: -HELP_AMOUNT });
        ctx.sim.credit(other, { money: HELP_AMOUNT });
        ctx.actor.helpedOut = ctx.actor.helpedOut || {};
        ctx.actor.helpedOut[other.id] = ctx.state.day;
        ctx.sim.adjustRelationship(other, ctx.actor.id, { trust: 9, closeness: 7 });
        ctx.sim.adjustRelationship(ctx.actor, other.id, { closeness: 3 });
        ctx.emit('HELPED_OUT', { toId: other.id, withId: other.id, amount: HELP_AMOUNT },
          ctx.actor.name + ' gave ' + other.name + ' ' + HELP_AMOUNT + ' EUR for a meal.', [other.id]);
      }
    },

    withdraw_savings: {
      id: 'withdraw_savings', label: 'Take money out of savings', targetKind: null, interruptible: false,
      position: 'anywhere',
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
      position: 'anywhere',
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
      position: 'beside_person',
      duration: function () { return 25; },
      eligible: function (ctx) {
        if (!ctx.target || ctx.target.id === ctx.actor.id) return { reason: 'no_one_to_talk_to' };
        if (!personPresent(ctx, ctx.target.id)) return { reason: 'not_present' };
        if (ctx.sim.openConversationOf(ctx.actor.id)) return { reason: 'already_in_conversation' };
        /* They have to be free to answer: idle, doing something one looks up
         * from — or on their way over to talk to this very person. Asked again
         * at every step of the walk over, so a person who gets busy meanwhile
         * is not walked up to and interrupted. */
        var theirs = ctx.target.activity;
        var comingOver = theirs && theirs.actionId === 'talk_with' && theirs.targetId === ctx.actor.id && !theirs.conversationId;
        if (!comingOver && !ctx.sim.availableToTalk(ctx.target)) return { reason: 'partner_busy' };
        /* The same conversation does not restart the moment it ends, and a
         * person who said no is not asked again five minutes later. */
        var last = (ctx.actor.lastTalk || {})[ctx.target.id];
        if (last !== undefined && ctx.absMinute - last < 90) return { reason: 'just_talked' };
        var refused = (ctx.actor.talkRefused || {})[ctx.target.id];
        if (refused !== undefined && ctx.absMinute - refused < 60) return { reason: 'recently_refused' };
        return true;
      },
      /* Reaching the other person is where this begins, and what begins is a
       * proposal: one shared conversation record that the other person's own
       * policy joins or declines. Its clock and its consequences start when
       * they join (Sim.startConversation), and it is settled once. */
      onStart: function (ctx) { ctx.sim.proposeConversation(ctx.actor, ctx.target, ctx.activity); },
      tick: function (ctx, m) { need(ctx, 'energy', -0.005 * m); },
      onComplete: function (ctx) { ctx.sim.settleConversation(ctx.activity.conversationId); }
    },

    /* What someone who has been spoken to may choose. Both are theirs to
     * choose; neither is ever started for them. */
    join_conversation: {
      id: 'join_conversation', label: 'Talk with', targetKind: 'conversation', interruptible: true,
      position: 'anywhere',   // the person asking has already come over
      duration: function (ctx) { return ctx.target.minutes; },
      eligible: function (ctx) {
        var c = ctx.target;
        if (!c || c.inviteeId !== ctx.actor.id) return { reason: 'not_asked' };
        if (c.status !== 'proposed') return { reason: 'proposal_' + c.status };
        return true;
      },
      onStart: function (ctx) {
        ctx.activity.conversationId = ctx.target.id;
        ctx.sim.startConversation(ctx.target);
      },
      tick: function (ctx, m) { need(ctx, 'energy', -0.005 * m); },
      onComplete: function (ctx) { ctx.sim.settleConversation(ctx.activity.conversationId); }
    },

    /* Mid-talk: carry on, or bring it to a close. Neither starts anything —
     * the simulation takes the answer and the talk goes on or ends (see
     * Sim.answerTurn); the durations say what each would mean. */
    keep_talking: {
      id: 'keep_talking', label: 'Keep talking', targetKind: 'conversation', interruptible: false, position: 'anywhere',
      duration: function (ctx) { return Math.max(1, ctx.target.endAbs - ctx.absMinute); },
      eligible: function (ctx) { return ctx.sim.openTurnOf(ctx.actor) === ctx.target ? true : { reason: 'no_turn_open' }; },
      candidateMeta: function (ctx) { return talkMeta(ctx); },
      tick: function () {}
    },
    wind_down: {
      id: 'wind_down', label: 'Bring the talk to a close', targetKind: 'conversation', interruptible: false, position: 'anywhere',
      duration: function () { return 1; },
      eligible: function (ctx) { return ctx.sim.openTurnOf(ctx.actor) === ctx.target ? true : { reason: 'no_turn_open' }; },
      candidateMeta: function (ctx) { return talkMeta(ctx); },
      tick: function () {}
    },

    decline_conversation: {
      id: 'decline_conversation', label: 'Not now', targetKind: 'conversation', interruptible: false,
      position: 'anywhere',
      duration: function () { return 1; },
      eligible: function (ctx) {
        var c = ctx.target;
        if (!c || c.inviteeId !== ctx.actor.id) return { reason: 'not_asked' };
        if (c.status !== 'proposed') return { reason: 'proposal_' + c.status };
        return true;
      },
      onStart: function (ctx) { ctx.sim.closeProposal(ctx.target, 'declined', 'declined'); }
    },

    /* ---------------- opportunities ---------------- */

    accept_offer: {
      id: 'accept_offer', label: 'Accept', targetKind: 'offer', interruptible: false,
      position: 'anywhere',
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
      position: 'anywhere',
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
      position: 'use_spot',
      exclusive: true,   // one bench, one person: the simulation holds the claim
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
      position: 'anywhere',
      yieldsToConversation: true,
      duration: function () { return 10; },
      eligible: function () { return true; },
      onComplete: function () { /* waiting settles nothing; it only spends time */ }
    }
  };

  /* The one way a content package adds to the catalogue. A definition is
   * checked against the contract at the top of this file before it is let in,
   * and an id that is already taken is refused: nothing is ever replaced by
   * being defined twice. A.all() is for reading; writing to what it returns
   * is not registration and is not supported. */
  var TARGET_KINDS = [null, 'object', 'person', 'offer', 'location', 'conversation'];
  var POSITIONS = ['use_spot', 'beside_person', 'anywhere'];
  var HOOKS = ['tick', 'onStart', 'onComplete', 'onInterrupt', 'candidateMeta'];
  A.define = function (def) {
    var problems = [];
    if (!def || typeof def !== 'object') throw new Error('an action definition must be an object');
    if (typeof def.id !== 'string' || !/^[a-z][a-z0-9_]*$/.test(def.id)) problems.push('id must be a lower_snake_case string');
    if (typeof def.label !== 'string' || !def.label) problems.push('label is required');
    if (TARGET_KINDS.indexOf(def.targetKind === undefined ? 'missing' : def.targetKind) < 0) problems.push('targetKind must be one of ' + TARGET_KINDS.join('|'));
    if (POSITIONS.indexOf(def.position) < 0) problems.push('position must be one of ' + POSITIONS.join('|'));
    if (def.position === 'beside_person' && def.targetKind !== 'person') problems.push("position 'beside_person' needs targetKind 'person'");
    if (typeof def.duration !== 'function') problems.push('duration(ctx) is required');
    if (typeof def.eligible !== 'function') problems.push('eligible(ctx) is required');
    if (typeof def.interruptible !== 'boolean') problems.push('interruptible must be true or false');
    HOOKS.forEach(function (h) { if (def[h] !== undefined && typeof def[h] !== 'function') problems.push(h + ' must be a function when present'); });
    if (def.exclusive !== undefined && typeof def.exclusive !== 'boolean') problems.push('exclusive must be true or false');
    if (def.exclusive && def.targetKind !== 'object') problems.push("exclusive needs targetKind 'object'");
    if (problems.length) throw new Error('action "' + (def && def.id) + '" refused: ' + problems.join('; '));
    if (DEFS[def.id]) {
      if (DEFS[def.id] === def) return def;          // the same definition, registered again: nothing to do
      throw new Error('action "' + def.id + '" is already in the catalogue and will not be replaced');
    }
    DEFS[def.id] = def;
    return def;
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
