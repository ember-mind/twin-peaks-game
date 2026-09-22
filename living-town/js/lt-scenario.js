/* lt-scenario.js — Living Town: the day-one setup shared by the page and the tests.
 *
 * Keeping this in one place is what makes the browser and the headless runs the
 * same run. The scenario schedules a circumstance; it never scripts a response.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function') {
    if (!LT.Sim) require('./lt-sim.js');
    if (!LT.Interventions) require('./lt-interventions.js');
    if (!LT.UtilityPolicy) require('./policy/lt-utility-policy.js');
    if (!LT.EverydayV01) require('../content/everyday-opportunities-v01/everyday-opportunities.js');
    /* Inviting someone to eat is part of how this town lives, not something a watcher sets off. */
    if (!LT.SharedMeal) require('../content/shared-meal-v01/shared-meal.js');
  }
  var S = LT.Scenario = LT.Scenario || {};

  /* The extra shift is posted at the café at 16:30, while the first inhabitant
   * is still on the floor and can therefore see it. It pays toward the studio
   * deposit, and it runs straight through the hour they promised to the other
   * inhabitant. The simulation does not care which way that goes. */
  S.EXTRA_SHIFT = {
    type: 'offer_extra_work',
    source: 'developer',
    atDay: 1, atMinute: 990,          // 16:30
    params: {
      toId: 'resident_a', locationId: 'cafe',
      startMin: 1020, endMin: 1170,   // 17:00 – 19:30
      pay: 40,
      expiresMin: 1080,               // lapses at 18:00
      expiresDay: 1
    }
  };

  /* Two small things that turn up in town on the first day. Nobody is told
   * to do anything about either: a used book is left on a bench in the park
   * in the morning, and a food parcel is left inside the first inhabitant's
   * door at midday, while they are at work. Whoever comes across them decides. */
  S.EVERYDAY = [
    { type: 'place_shared_book', source: 'developer', atDay: 1, atMinute: 600,       // 10:00
      params: { instanceId: 'book_park', title: 'The Harbour Year', locationId: 'park',
                x: 12, y: 6, useSpot: { x: 12, y: 7, dir: 'up' }, requiredReadMinutes: 120 } },
    { type: 'deliver_food_parcel', source: 'developer', atDay: 1, atMinute: 750,     // 12:30
      params: { instanceId: 'parcel_door', toId: 'resident_a', locationId: 'flat_a',
                x: 6, y: 6, useSpot: { x: 5, y: 6, dir: 'right' }, portions: 4 } }
  ];

  S.day1 = function (opts) {
    opts = opts || {};
    var sim = LT.Sim.create({
      seed: opts.seed === undefined ? 20260918 : opts.seed,
      cast: opts.cast,
      policies: opts.policies || { resident_a: 'utility', resident_b: 'utility' },
      decisionTimeoutMinutes: opts.decisionTimeoutMinutes
    });
    if (opts.intervention !== false) {
      var scheduled = sim.scheduleIntervention(opts.intervention || S.EXTRA_SHIFT);
      if (!scheduled.ok) throw new Error('scenario intervention rejected: ' + scheduled.error);
    }
    /* `intervention: false` means a town nobody intervenes in at all; the
     * everyday things can also be left out on their own. */
    if (opts.intervention !== false && opts.everyday !== false) {
      S.EVERYDAY.forEach(function (entry) {
        var r = sim.scheduleIntervention(entry);
        if (!r.ok) throw new Error('scenario intervention rejected: ' + entry.type + ' ' + r.error);
      });
    }
    return sim;
  };

  /* The same first day with the neighbours in it: five people, one counter. */
  S.town = function (opts) {
    opts = opts || {};
    var o = {}; Object.keys(opts).forEach(function (k) { o[k] = opts[k]; });
    o.cast = 'town';
    return S.day1(o);
  };

  S.END_OF_DAY = { day: 1, minute: 1439 };
})();
