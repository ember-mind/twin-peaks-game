/* lt-story.js — Living Town: what a watcher needs to follow a life.
 *
 * Three readings of the authoritative state, and nothing else:
 *   why(decision)   — what weighed most in the last choice, what weighed
 *                     against it, and what came second. These are the policy's
 *                     own named terms, ranked. They are arithmetic put into
 *                     words; they are not thoughts and are never worded as one.
 *                     A policy that gave no terms gets no sentence made up for it.
 *   stakes(sim, c)  — what this person stands to gain or lose, and by when:
 *                     goals with their gap and last day, promises with the time
 *                     left and the walk still to do, an empty pantry.
 *   recap(sim, day) — the day as the event log recorded it, a few lines each.
 *   interest(sim,id)— how much is going on around someone, for a camera that
 *                     follows the action.
 *
 * Everything here reads. Nothing here writes, schedules or decides.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function') {
    if (!LT.World) require('./lt-world.js');
    if (!LT.Actions) require('./lt-actions.js');
  }
  var W = LT.World, U = LT.Util;
  var S = LT.Story = {};

  /* The policy's term names, in the words of someone watching. A term a
   * content package brings is shown under its own name. */
  var TERM = {
    hunger_relief: 'hunger', energy_relief: 'tiredness', night: 'the hour', night_home: 'the hour',
    routine: 'the morning routine', conscientiousness: 'being someone who does things properly',
    ambition: 'ambition', income: 'the money, with a goal to reach', obligation: 'it is the job',
    goal_completion: 'it would reach the goal', commitment_keep: 'a promise to keep',
    commitment_pull: 'a promise waiting there', work_pull: 'the shift', social: 'wanting company',
    closeness: 'how close the two are', asked: 'having been asked', keep_to_oneself: 'wanting to be left alone',
    food_at_home: 'food at home', kindness: 'seeing someone in need', find_help: 'nowhere else to turn', meal_there: 'a meal to be had there', evening_home: 'the day being done', rest_at_home: 'a bed at home', commitments_preserved: 'the promises it leaves intact',
    rest: 'needing rest', cash_needed: 'an empty pocket', baseline: 'nothing better to do',
    money_cost: 'what it costs', energy_cost: 'how tiring it is', time_cost: 'the time it takes',
    travel_cost: 'the walk', commitment_conflict: 'a promise it would break', promise_elsewhere: 'a promise to someone else', wrong_hour: 'the wrong hour for it',
    forgone_income: 'the money given up', goal_cost: 'the goal it sets back', unknown_offer: 'an offer nobody can find'
  };
  function termLabel(k) { return TERM[k] || String(k).replace(/_/g, ' '); }
  S.termLabel = termLabel;

  function actionLabel(f) {
    var def = LT.Actions.get(f.actionId);
    var place = f.actionId === 'travel' && W.LOCATIONS[f.targetId];
    if (place) return 'Walk to ' + place.name;
    return (def && def.label) || f.actionId;
  }

  S.why = function (decision) {
    if (!decision) return null;
    var factors = decision.diagnostics && decision.diagnostics.factors;
    if (!factors || !factors.length) {
      return { source: decision.source, known: false, line: 'Chosen by ' + decision.source + ', which gave no reasons.' };
    }
    var chosen = null, i;
    for (i = 0; i < factors.length; i++) if (factors[i].candidateId === decision.selectedId) chosen = factors[i];
    if (!chosen) return { source: decision.source, known: false, line: 'Chosen by ' + decision.source + '; its reasons do not name this choice.' };

    var keys = Object.keys(chosen.terms);
    var pro = keys.filter(function (k) { return chosen.terms[k] > 0; })
                  .sort(function (a, b) { return chosen.terms[b] - chosen.terms[a] || (a < b ? -1 : 1); });
    var con = keys.filter(function (k) { return chosen.terms[k] < 0; })
                  .sort(function (a, b) { return chosen.terms[a] - chosen.terms[b] || (a < b ? -1 : 1); });
    /* Second place is the best thing that was a different thing to do, not
     * the same action aimed somewhere else. */
    var second = null;
    for (i = 0; i < factors.length; i++) {
      if (factors[i] === chosen || factors[i].actionId === chosen.actionId) continue;
      if (!second || factors[i].score > second.score) second = factors[i];
    }
    var top = pro.length ? chosen.terms[pro[0]] : 0;
    var weighed = pro.filter(function (k, n) { return n === 0 || (n < 2 && chosen.terms[k] >= top * 0.3); });
    var against = con.length && Math.abs(chosen.terms[con[0]]) >= 1 ? con[0] : null;

    var line = weighed.length ? 'Weighed most: ' + weighed.map(termLabel).join(', ') + '.' : 'Nothing weighed much.';
    if (against) line += ' Against it: ' + termLabel(against) + '.';
    if (second) {
      var gap = Math.round((chosen.score - second.score) * 10) / 10;
      line += ' Next best: ' + actionLabel(second).toLowerCase() + (gap < 3 ? ', and it was close.' : '.');
    }
    return {
      source: decision.source, known: true, line: line,
      weighed: weighed.map(function (k) { return { term: k, label: termLabel(k), value: chosen.terms[k] }; }),
      against: against ? { term: against, label: termLabel(against), value: chosen.terms[against] } : null,
      second: second ? { actionId: second.actionId, label: actionLabel(second), score: second.score } : null,
      score: chosen.score, close: !!second && (chosen.score - second.score) < 3
    };
  };

  /* ---------------- stakes ---------------- */

  function span(minutes) {
    if (minutes < 60) return minutes + ' min';
    var h = Math.floor(minutes / 60), m = minutes % 60;
    if (h < 24) return h + ' h' + (m ? ' ' + m : '');
    return Math.floor(h / 24) + ' d ' + (h % 24) + ' h';
  }
  function money(v) { return (Math.round(v * 100) / 100).toFixed(2); }
  function amount(gap, unit) {
    if (unit === 'EUR') return money(gap) + ' EUR';
    var u = unit || '';
    return gap + (u ? ' ' + (gap === 1 ? u.replace(/s$/, '') : u) : '');
  }

  S.stakes = function (sim, c) {
    var out = [], now = sim.absMinute(), day = sim.state.day;
    (c.goals || []).forEach(function (g) {
      var row = { kind: 'goal', id: g.id, label: g.label };
      var gap = Math.max(0, g.target - g.progress);
      if (g.reached) { row.status = 'reached'; row.line = 'Reached' + (g.reachedStamp ? ' at ' + g.reachedStamp : '') + '.'; }
      else if (g.missed) { row.status = 'missed'; row.line = 'Not reached in time: ' + amount(gap, g.unit) + ' short.'; }
      else {
        var left = Math.max(0, U.absolute(g.deadlineDay + 1, 0) - now);
        row.status = (g.deadlineDay === day) ? 'last_day' : 'open';
        row.minutesLeft = left;
        row.line = amount(gap, g.unit) + ' to go, ' +
          (g.deadlineDay === day ? 'and today is the last day (' + span(left) + ' left).' : span(left) + ' left.');
      }
      out.push(row);
    });
    (c.commitments || []).forEach(function (k) {
      if (k.status !== 'open') return;
      var due = U.absolute(k.dueDay, k.dueMin), last = due + (k.graceMin || 0);
      if (due - now > 240) return;                       // not yet something to watch
      var there = c.transit ? c.transit.to : c.location;
      var walk = (k.locationId && k.locationId !== there) ? W.travelMinutes(there, k.locationId) : 0;
      var slack = last - now - walk;
      var row = { kind: 'promise', id: k.id, label: k.label, minutesLeft: due - now, walkMinutes: walk };
      row.status = slack < 0 ? 'out_of_reach' : slack < 15 ? 'tight' : 'open';
      var when = due >= now ? 'due in ' + span(due - now) : span(now - due) + ' late';
      row.line = when + (walk ? ', ' + walk + ' min walk away' : ', already there') +
        (row.status === 'out_of_reach' ? ' — cannot be kept from here any more.' : row.status === 'tight' ? ' — only just possible.' : '.');
      out.push(row);
    });
    if ((c.pantry || 0) <= 0 && c.needs.hunger >= 55) {
      out.push({ kind: 'need', id: 'food', label: 'Food', status: c.money < 6 ? 'tight' : 'open',
        line: 'Hungry, nothing to eat at home, ' + money(c.money) + ' EUR in the pocket' + (c.money < 6 ? ' — not enough for a meal.' : '.') });
    }
    return out;
  };

  /* ---------------- the day, looked back on ---------------- */

  var TOLD = {   // event types worth a line of their own, most telling first
    GOAL_REACHED: 1, GOAL_MISSED: 1, COMMITMENT_BROKEN: 1, COMMITMENT_KEPT: 1, TALKED: 1,
    OFFER_ACCEPTED: 1, OFFER_DECLINED: 1, OFFER_LAPSED: 1, ACTIVITY_FAILED: 1, WITHDREW: 1,
    WENT_HUNGRY: 1, HELPED_OUT: 1, TALK_DECLINED: 1, TALK_UNANSWERED: 1, BOOK_READ: 1, FOOD_PARCEL_OPENED: 1, INTERVENTION_APPLIED: 1
  };

  S.recap = function (sim, day) {
    var events = sim.state.events.filter(function (e) { return e.day === day; });
    var people = sim.actorIds().map(function (id) {
      var c = sim.state.characters[id];
      var mine = events.filter(function (e) { return e.actorId === id; });
      var worked = 0, earned = 0, saved = 0, meals = 0;
      mine.forEach(function (e) {
        if (e.type === 'WORKED' || e.type === 'WORKED_EXTRA') { worked += e.data.minutes || 0; earned += e.data.gross || 0; saved += e.data.saved || 0; }
        if (e.type === 'ATE') meals++;
      });
      var facts = [];
      if (worked) facts.push('worked ' + span(worked) + ' for ' + money(earned) + ' EUR (' + money(saved) + ' saved)');
      facts.push(meals ? 'ate ' + (meals === 1 ? 'once' : meals + ' times') : 'did not eat');
      return { id: id, name: c.name, facts: facts,
               told: mine.filter(function (e) { return TOLD[e.type]; }).map(function (e) { return { stamp: e.stamp, type: e.type, text: e.text }; }) };
    });
    var town = events.filter(function (e) { return !e.actorId && TOLD[e.type]; })
                     .map(function (e) { return { stamp: e.stamp, type: e.type, text: e.text }; });
    return { day: day, complete: sim.state.day > day, events: events.length, people: people, town: town };
  };

  /* ---------------- where to look ---------------- */

  S.interest = function (sim, id) {
    var c = sim.state.characters[id], a = c.activity, now = sim.absMinute(), score = 0;
    if (a) {
      if (a.phase === 'waiting_reply') score = 5;
      else if (a.actionId === 'talk_with' || a.actionId === 'join_conversation') score = a.phase === 'executing' ? 5 : 4;
      else if (a.phase === 'approaching') score = 3;
      else if (a.actionId === 'sleep') score = 0;
      else if (a.actionId === 'wait') score = 1;
      else score = 2;
    } else if (c.transit) score = 2;
    var events = sim.state.events;
    for (var i = events.length - 1; i >= 0 && now - events[i].absMinute <= 10; i--) {
      var e = events[i];
      if (e.actorId !== id) continue;
      if (e.type === 'ACTIVITY_FAILED' || e.type === 'COMMITMENT_BROKEN' || e.type === 'GOAL_REACHED' || e.type === 'GOAL_MISSED') { score += 3; break; }
    }
    return score;
  };

  /* The camera stays with someone until somebody else is clearly more worth
   * watching: a tie never moves it. */
  S.mostInteresting = function (sim, currentId) {
    var best = currentId, bestScore = currentId ? S.interest(sim, currentId) + 1 : -1;
    sim.actorIds().forEach(function (id) {
      if (id === currentId) return;
      var v = S.interest(sim, id);
      if (v > bestScore) { best = id; bestScore = v; }
    });
    return best;
  };
})();
