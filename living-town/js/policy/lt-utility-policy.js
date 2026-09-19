/* lt-utility-policy.js — Living Town: the offline decision policy.
 *
 * This is the competent baseline, not a straw man. It weighs needs against
 * deadlines, money against fatigue, and a promise against what breaking it
 * would cost. Every number it produces is exposed as a named term, because a
 * developer must be able to see why a choice was made. Those terms are not
 * thoughts and are never presented as an inner voice: they are the arithmetic.
 *
 * It reads only the request. It cannot see the world, and it cannot act.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function') {
    if (!LT.Policy) require('./lt-policy.js');
    if (!LT.World) require('../lt-world.js');
  }
  var Pol = LT.Policy, W = LT.World, U = LT.Util;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function trait(req, name, dflt) {
    var t = req.self.traits || {};
    return t[name] === undefined ? (dflt === undefined ? 0.5 : dflt) : t[name];
  }
  function abs(day, minute) { return U.absolute(day, minute); }

  /* How badly a measurable goal wants attention right now. */
  function goalUrgency(req) {
    var best = 0, tracked = null;
    (req.goals || []).forEach(function (g) {
      if (g.reached || g.missed || g.kind !== 'savings') return;
      var gap = Math.max(0, g.target - g.progress);
      if (gap <= 0) return;
      var daysLeft = Math.max(1, (g.deadlineDay - req.day) + 1);
      var u = clamp(0.5 + gap / (15 * daysLeft), 0, 2.5);
      if (u > best) { best = u; tracked = g; }
    });
    return { urgency: best, goal: tracked };
  }

  /* Value of not breaking a promise, in the same units as everything else. */
  function commitmentWeight(req, c) {
    var base = c.kind === 'work' ? 40 : c.kind === 'social' ? 45 : 22;
    if (c.strength === 'hard') base *= 1.6;
    var con = 0.4 + 0.6 * trait(req, 'conscientiousness');
    var rel = 1;
    if (c.withId && req.relationships && req.relationships[c.withId]) {
      var r = req.relationships[c.withId];
      rel = 0.5 + 0.5 * (r.closeness / 100);
    }
    var soc = c.kind === 'social' ? (0.6 + 0.4 * trait(req, 'sociability')) : 1;
    return base * con * rel * soc;
  }

  /* Some promises carry an earliest hour as well as a deadline. */
  function inWindow(req, c, afterMinutes) {
    if (c.windowStartMin === undefined) return true;
    return (req.minute + (afterMinutes || 0)) >= c.windowStartMin;
  }

  function openCommitments(req) {
    return (req.commitments || []).filter(function (c) { return c.status === 'open'; });
  }

  /* Can this commitment still be met if the actor is tied up at `where` until
   * `untilAbs`? Travel time is real, so this is arithmetic, not opinion. */
  function stillReachable(req, c, untilAbs, where) {
    if (!c.locationId) return true;
    var walk = W.travelMinutes(where, c.locationId);
    return (untilAbs + walk) <= abs(c.dueDay, c.dueMin) + (c.graceMin || 0);
  }

  function conflictPenalty(req, obligation) {
    var total = 0, broken = [];
    openCommitments(req).forEach(function (c) {
      if (obligation.commitmentId && c.id === obligation.commitmentId) return;
      if (stillReachable(req, c, obligation.untilAbs, obligation.where)) return;
      total += commitmentWeight(req, c);
      broken.push(c.id);
    });
    return { penalty: total, broken: broken };
  }

  function fatigue(req) {
    return clamp((100 - req.self.needs.energy) / 100, 0, 1);
  }

  function score(req, cand, shared) {
    var terms = {};
    var nowAbs = req.absMinute;
    var endAbs = nowAbs + cand.durationMinutes;
    var here = req.self.location;
    var hunger = req.self.needs.hunger, energy = req.self.needs.energy;
    var urgency = shared.urgency;
    var money = req.self.money;

    switch (cand.actionId) {

      case 'eat_at_home':
        terms.hunger_relief = Math.pow(hunger / 100, 2) * 130;
        break;

      case 'buy_meal':
        terms.hunger_relief = Math.pow(hunger / 100, 2) * 130;
        terms.money_cost = -6 * (1 + urgency) * 0.9;
        break;

      case 'sleep':
        terms.energy_relief = Math.pow((100 - energy) / 100, 2) * 140;
        terms.night = (req.minute >= 1290 || req.minute < 390) ? 45 : 0;
        if (req.minute >= 390 && req.minute < 1200 && energy > 35) terms.wrong_hour = -60;
        break;

      case 'sit_and_rest':
      case 'take_break':
        terms.energy_relief = Math.pow((100 - energy) / 100, 2) * 45;
        terms.time_cost = -cand.durationMinutes * 0.06;
        break;

      case 'wash_and_dress':
        terms.routine = req.minute < 720 ? 14 : 3;
        terms.conscientiousness = 8 * trait(req, 'conscientiousness');
        break;

      case 'practise_guitar':
        terms.ambition = 16 * trait(req, 'ambition');
        var prac = openCommitments(req).filter(function (c) { return c.id === 'cmt_practise'; })[0];
        if (prac && inWindow(req, prac)) terms.commitment_keep = commitmentWeight(req, prac);
        terms.energy_cost = -cand.durationMinutes * 0.10 * (0.4 + fatigue(req));
        break;

      case 'work_shift':
      case 'work_extra_shift': {
        var payRate = cand.actionId === 'work_shift'
          ? (req.self.employment ? req.self.employment.wagePerHour : 0) / 60
          : payRateOfOffer(req, cand);
        var gross = payRate * cand.durationMinutes;
        terms.income = gross * 1.1 * urgency * (0.6 + 0.4 * trait(req, 'ambition'));
        terms.obligation = cand.actionId === 'work_shift'
          ? 34 * trait(req, 'conscientiousness') : 26 * trait(req, 'conscientiousness');
        terms.energy_cost = -cand.durationMinutes * 0.07 * (0.3 + fatigue(req) * 1.6);
        var wconf = conflictPenalty(req, { untilAbs: endAbs, where: here });
        if (wconf.penalty) { terms.commitment_conflict = -wconf.penalty; }
        break;
      }

      case 'greet':
        terms.social = 7 * (0.5 + trait(req, 'sociability'));
        break;

      /* Being asked weighs what asking weighs: the same company, the same
       * promises. Saying no has a small standing value of its own, so it is
       * what gets chosen when talking is worth less than that — and when
       * something else is worth more than either, that is chosen instead and
       * the person asking simply gets no answer. */
      case 'decline_conversation':
        terms.keep_to_oneself = 4;
        break;

      case 'join_conversation':
      case 'talk_with': {
        var withId = cand.actionId === 'talk_with' ? cand.targetId : cand.meta.withId;
        terms.social = 14 * (0.5 + trait(req, 'sociability'));
        if (cand.actionId === 'join_conversation') terms.asked = 3;
        var meeting = openCommitments(req).filter(function (c) {
          return c.kind === 'social' && c.withId === withId;
        })[0];
        if (meeting) {
          var due = abs(meeting.dueDay, meeting.dueMin);
          if (nowAbs >= due - 30 && nowAbs <= due + (meeting.graceMin || 0)) {
            terms.commitment_keep = commitmentWeight(req, meeting);
          }
        }
        var rel = req.relationships[withId];
        if (rel) terms.closeness = (rel.closeness / 100) * 9;
        /* A talk with someone else, long enough that a meeting promised to a
         * third person could no longer be held in time, costs that promise. */
        var squeezed = 0;
        openCommitments(req).forEach(function (c) {
          if (c.kind !== 'social' || !c.withId || c.withId === withId) return;
          var last = abs(c.dueDay, c.dueMin) + (c.graceMin || 0);
          if (nowAbs < abs(c.dueDay, c.dueMin) - 90 || nowAbs > last) return;
          if (endAbs + 25 > last) squeezed += commitmentWeight(req, c);
        });
        if (squeezed) terms.promise_elsewhere = -squeezed;
        break;
      }

      case 'accept_offer': {
        var offer = offerById(req, cand.targetId);
        if (!offer) { terms.unknown_offer = -50; break; }
        var pay = offer.params.pay || 0;
        var saved = pay * 0.6;
        terms.income = pay * 1.1 * urgency * (0.6 + 0.4 * trait(req, 'ambition'));
        if (shared.goal && (req.self.savings + saved) >= shared.goal.target) {
          terms.goal_completion = 34 * clamp(urgency, 0.4, 2);
        }
        var mins = (offer.params.endMin || 0) - (offer.params.startMin || 0);
        terms.energy_cost = -mins * 0.07 * (0.3 + fatigue(req) * 1.6);
        var conf = conflictPenalty(req, {
          untilAbs: abs(req.day, offer.params.endMin),
          where: offer.params.locationId
        });
        if (conf.penalty) terms.commitment_conflict = -conf.penalty;
        break;
      }

      case 'decline_offer': {
        var off2 = offerById(req, cand.targetId);
        if (!off2) { terms.unknown_offer = -50; break; }
        // Declining is worth exactly the promises it leaves intact, discounted
        // by how much the money was needed.
        var conf2 = conflictPenalty(req, {
          untilAbs: abs(req.day, off2.params.endMin),
          where: off2.params.locationId
        });
        terms.commitments_preserved = conf2.penalty * 0.55;
        terms.rest = Math.pow((100 - energy) / 100, 2) * 16;
        terms.forgone_income = -(off2.params.pay || 0) * 0.35 * urgency;
        break;
      }

      case 'travel': {
        var dest = cand.targetId;
        var arrival = nowAbs + cand.durationMinutes;
        terms.travel_cost = -cand.durationMinutes * 0.45;
        // pulled by the workplace as the shift approaches
        var e = req.self.employment;
        if (e && dest === e.locationId) {
          var arrMin = req.minute + cand.durationMinutes;
          if (arrMin < e.shiftEnd) {
            var late = arrMin - e.shiftStart;
            var ramp = late >= 0 ? 1 : clamp(1 - (-late) / 60, 0, 1);
            terms.work_pull = 72 * trait(req, 'conscientiousness') * ramp;
          }
        }
        // pulled by a promise that lives there
        var pull = 0;
        openCommitments(req).forEach(function (c) {
          if (c.locationId !== dest) return;
          var due = abs(c.dueDay, c.dueMin);
          if (arrival > due + (c.graceMin || 0)) return;
          if (!inWindow(req, c, cand.durationMinutes)) return;
          var slack = due - arrival;
          var factor = slack <= 45 ? 1 : clamp(1 - (slack - 45) / 180, 0.02, 1);
          pull += commitmentWeight(req, c) * factor;
        });
        if (pull) terms.commitment_pull = pull;
        // going home to eat or sleep, when that is what is actually needed
        if (dest === req.self.homeId) {
          if (req.self.pantry > 0) terms.food_at_home = Math.pow(hunger / 100, 2) * 45;
          if (req.minute >= 1230 || energy < 25) terms.rest_at_home = Math.pow((100 - energy) / 100, 2) * 60;
          // Late enough that the only sensible place to be is one's own bed.
          if (req.minute >= 1260 || req.minute < 330) terms.night_home = 46;
        }
        if (dest === req.self.homeId && req.minute >= 1080 && req.minute < 1260) terms.evening_home = 8;
        // an empty pantry, and somewhere that sells a meal and will still be open
        var place = ((req.observations && req.observations.reachable) || []).filter(function (r) { return r.id === dest; })[0];
        if (place && (place.services || []).indexOf('buy_meal') >= 0 && !(req.self.pantry > 0) && money >= 6) {
          var arriveMin = req.minute + cand.durationMinutes;
          if (arriveMin >= place.opens && arriveMin + 20 <= place.closes) terms.meal_there = Math.pow(hunger / 100, 2) * 45;
        }
        var tconf = conflictPenalty(req, { untilAbs: arrival, where: dest });
        if (tconf.penalty) terms.commitment_conflict = -tconf.penalty * 0.7;
        break;
      }

      case 'withdraw_savings':
        terms.cash_needed = money < 6 ? 18 : 4;
        terms.goal_cost = -10 * urgency;
        break;

      case 'wait':
        terms.baseline = 1.2;
        break;

      default: {
        /* Actions from content packages. The package says what its action
         * is worth to a person in its own terms; the arithmetic it is given —
         * traits, needs, urgency, the cost of a broken promise — is this
         * policy's, so a book competes with a shift on the same scale. */
        var extra = EXTRA_SCORES[cand.actionId];
        if (extra) {
          var given = extra(req, cand, {
            trait: function (k) { return trait(req, k); },
            urgency: urgency, fatigue: fatigue(req), hunger: hunger, energy: energy, money: money,
            conflictPenalty: function () { return conflictPenalty(req, { untilAbs: endAbs, where: here }).penalty; }
          }) || {};
          Object.keys(given).forEach(function (k) { if (typeof given[k] === 'number' && isFinite(given[k])) terms[k] = given[k]; });
        } else terms.unscored = 0;
      }
    }

    var total = 0;
    Object.keys(terms).forEach(function (k) { total += terms[k]; });
    return { candidateId: cand.id, actionId: cand.actionId, targetId: cand.targetId || null,
             score: Math.round(total * 100) / 100, terms: roundTerms(terms) };
  }

  function roundTerms(terms) {
    var out = {};
    Object.keys(terms).sort().forEach(function (k) { out[k] = Math.round(terms[k] * 100) / 100; });
    return out;
  }

  function offerById(req, id) {
    var list = (req.observations && req.observations.offers) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function payRateOfOffer(req, cand) {
    var o = offerById(req, cand.targetId);
    if (!o) return 0;
    var span = (o.params.endMin - o.params.startMin) || 1;
    return (o.params.pay || 0) / span;
  }

  var EXTRA_SCORES = {};
  /* One scoring function per action id, and only for actions this file does
   * not already score. */
  function defineScore(actionId, fn) {
    if (typeof fn !== 'function') throw new Error('a score needs a function');
    if (EXTRA_SCORES[actionId] && EXTRA_SCORES[actionId] !== fn) throw new Error('"' + actionId + '" already has a score');
    EXTRA_SCORES[actionId] = fn;
  }

  var policy = {
    id: 'utility',
    label: 'UtilityPolicy',
    decide: function (request) {
      if (!request.candidates.length) return Promise.resolve(Pol.unavailable(request, 'utility', 'no_candidates'));
      var g = goalUrgency(request);
      var shared = { urgency: g.urgency, goal: g.goal };
      var scored = request.candidates.map(function (c) { return score(request, c, shared); });
      // Deterministic: ties break on candidate id, never on a random draw.
      scored.sort(function (a, b) {
        if (b.score !== a.score) return b.score - a.score;
        return a.candidateId < b.candidateId ? -1 : 1;
      });
      var best = scored[0];
      return Promise.resolve(Pol.selected(request, best.candidateId, 'utility', {
        goalUrgency: Math.round(shared.urgency * 100) / 100,
        fatigue: Math.round(fatigue(request) * 100) / 100,
        considered: scored.length,
        factors: scored
      }));
    }
  };

  Pol.register(policy);
  policy.defineScore = defineScore;
  LT.UtilityPolicy = policy;
})();
