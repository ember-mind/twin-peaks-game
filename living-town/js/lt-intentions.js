/* lt-intentions.js — Living Town: what someone means to do with the next hour.
 *
 * Two levels of deciding. Once an hour (and whenever the last hour's plan has
 * run out) a person is offered, among the other things they could do, to plan
 * the next hour: work, seek company, stay in, go out, get something to eat.
 * That choice is an ordinary decision — the same request, the same policy, the
 * same record, the same save and the same live frame as any other — so a mind
 * like Jev can make it and a watcher can see it. It takes a minute and changes
 * nothing in the world but the person's own intention.
 *
 * Minute by minute the other decisions go on as before; a policy may weigh
 * what fits the intention (the offline policy does, with a modest term). An
 * intention is a lean, not an order: a promise, hunger or someone speaking
 * to them can always win.
 *
 *   LT.Intentions.LIST, byId(id), fits(intentionId, candidate, self)
 *   LT.Intentions.due(actor, absMinute), offlineScore(request, intentionId)
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function') {
    if (!LT.Util) require('./lt-util.js');
    if (!LT.World) require('./lt-world.js');
    if (!LT.Actions) require('./lt-actions.js');
  }
  var I = LT.Intentions = LT.Intentions || {};
  var A = LT.Actions, U = LT.Util;

  I.HOUR = 60;                 // how long a plan lasts
  I.AWAKE_FROM = 6 * 60;       // nobody plans an hour in the middle of the night
  I.AWAKE_UNTIL = 22 * 60 + 30;

  /* id, what the person is said to mean to do, and one word for a bubble. */
  I.LIST = [
    { id: 'intent_work', name: 'work', label: 'getting some work done', word: 'work' },
    { id: 'intent_company', name: 'seek company', label: 'seeking company', word: 'company' },
    { id: 'intent_home', name: 'stay in', label: 'staying in', word: 'stay in' },
    { id: 'intent_outing', name: 'go out', label: 'getting out for a bit', word: 'go out' },
    { id: 'intent_food', name: 'get something to eat', label: 'getting something to eat', word: 'food' }
  ];
  var BY_ID = {}; I.LIST.forEach(function (i) { BY_ID[i.id] = i; });
  I.byId = function (id) { return BY_ID[id] || null; };

  /* Whether this person has an hour to plan now. */
  I.due = function (actor, absMinute) {
    var minute = ((absMinute % 1440) + 1440) % 1440;
    if (minute < I.AWAKE_FROM || minute >= I.AWAKE_UNTIL) return false;
    return !actor.intention || absMinute >= actor.intention.untilAbs;
  };

  /* The intentions that make sense for this person at all: work only for
   * someone with a job or a shift on offer. */
  I.optionsFor = function (actor, offers) {
    return I.LIST.filter(function (i) {
      if (i.id !== 'intent_work') return true;
      return !!actor.employment || (offers || []).some(function (o) { return o.type === 'extra_shift' && o.status === 'open'; });
    });
  };

  /* Whether doing a candidate is doing what the intention says. `self` is
   * the request's own description of the person (homeId, employment). */
  I.fits = function (intentionId, cand, self) {
    var a = cand.actionId, t = cand.targetId, home = self && self.homeId, here = self && self.location;
    var work = self && self.employment && self.employment.locationId;
    /* Going out to where people are fits company only from indoors: once in a
     * public place, seeking company is staying there, not walking on to the
     * next one (which would have them pace between the park and the café). */
    var outFromIndoors = here !== 'park' && here !== 'street' && here !== 'cafe';
    switch (intentionId) {
      case 'intent_work': return a === 'work_shift' || a === 'work_extra_shift' || a === 'accept_offer' || (a === 'travel' && !!work && t === work);
      case 'intent_company': return a === 'talk_with' || a === 'greet' || a === 'join_conversation' || a === 'invite_to_meal' || a === 'accept_meal' || a === 'help_out' ||
                                    (a === 'travel' && outFromIndoors && (t === 'park' || t === 'cafe'));
      case 'intent_home': return (a === 'travel' && t === home) || a === 'eat_at_home' || a === 'practise_guitar' || a === 'sleep' || a === 'unpack_food_parcel' || a === 'wash_and_dress';
      case 'intent_outing': return (a === 'travel' && t === 'park' && outFromIndoors) || a === 'sit_and_rest' || a === 'read_book';
      case 'intent_food': return a === 'buy_meal' || a === 'eat_at_home' || a === 'accept_meal' || a === 'unpack_food_parcel' || (a === 'travel' && t === 'cafe' && here !== 'cafe');
      default: return false;
    }
  };

  /* The offline policy's reading of which plan fits the person now, in the
   * units the rest of its arithmetic uses. Deterministic: the request only. */
  I.offlineScore = function (req, intentionId) {
    var t = req.self.traits || {}, trait = function (k) { return t[k] === undefined ? 0.5 : t[k]; };
    var hunger = req.self.needs.hunger, energy = req.self.needs.energy, now = U.absolute(req.day, req.minute);
    var soon = function (c, within) { var due = U.absolute(c.dueDay, c.dueMin); return c.status === 'open' && due >= now && due - now <= within; };
    var promises = req.commitments || [];
    switch (intentionId) {
      case 'intent_work': {
        var e = req.self.employment, s = 0;
        if (e && req.minute >= e.shiftStart - 45 && req.minute < e.shiftEnd) s += 30 * (0.4 + 0.6 * trait('conscientiousness'));
        if (promises.some(function (c) { return c.kind === 'work' && soon(c, 90); })) s += 10;
        return s || -5;
      }
      case 'intent_food': return hunger >= 55 ? hunger / 3 : hunger >= 40 ? 4 : -2;
      case 'intent_company': return 4 + 10 * trait('sociability') + (promises.some(function (c) { return c.kind === 'social' && soon(c, 90); }) ? 25 : 0);
      /* The evening draws people home (the policy's own evening_home): a plan
       * made then agrees with it rather than sending them out to come back. */
      case 'intent_home': return 3 + 6 * trait('caution') + (energy < 35 ? 15 : 0) + (req.minute >= 18 * 60 ? 10 : 0) + (req.minute >= 21 * 60 ? 12 : 0);
      case 'intent_outing': return 5 + 4 * (1 - trait('caution')) + (req.minute >= 8 * 60 && req.minute < 19 * 60 ? 3 : 0);
      default: return 0;
    }
  };

  /* The action: a minute spent deciding what the next hour is for. */
  A.define({
    id: 'plan_hour', label: 'Plan the next hour', targetKind: 'intention', interruptible: false,
    position: 'anywhere',
    duration: function () { return 1; },
    eligible: function (ctx) {
      if (!ctx.target || !I.byId(ctx.target.id)) return { reason: 'unknown_intention' };
      if (!I.due(ctx.actor, ctx.absMinute)) return { reason: 'hour_already_planned' };
      return true;
    },
    onComplete: function (ctx) {
      var i = I.byId(ctx.target.id);
      ctx.actor.intention = { id: i.id, sinceAbs: ctx.absMinute, untilAbs: ctx.absMinute + I.HOUR };
      /* A plan is kept to oneself: nobody in the room learns it. */
      ctx.sim.emit('INTENDED', { actorId: ctx.actor.id, locationId: ctx.actor.location, private: true,
        data: { intentionId: i.id, untilAbs: ctx.absMinute + I.HOUR },
        text: ctx.actor.name + ' means to spend the next hour ' + i.label + '.' });
    }
  });
})();
