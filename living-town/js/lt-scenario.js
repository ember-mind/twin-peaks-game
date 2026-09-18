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
  }
  var S = LT.Scenario = LT.Scenario || {};

  /* The extra shift is posted at the café at 16:30, while Mara is still on the
   * floor and can therefore see it. It pays toward the studio deposit and it
   * runs straight through the hour she promised to Tomás. The simulation does
   * not care which way she goes. */
  S.EXTRA_SHIFT = {
    type: 'offer_extra_work',
    source: 'developer',
    atDay: 1, atMinute: 990,          // 16:30
    params: {
      toId: 'mara', locationId: 'cafe',
      startMin: 1020, endMin: 1170,   // 17:00 – 19:30
      pay: 40,
      expiresMin: 1080,               // lapses at 18:00
      expiresDay: 1
    }
  };

  S.day1 = function (opts) {
    opts = opts || {};
    var sim = LT.Sim.create({
      seed: opts.seed === undefined ? 20260918 : opts.seed,
      policies: opts.policies || { mara: 'utility', tomas: 'utility' }
    });
    if (opts.intervention !== false) {
      var scheduled = sim.scheduleIntervention(opts.intervention || S.EXTRA_SHIFT);
      if (!scheduled.ok) throw new Error('scenario intervention rejected: ' + scheduled.error);
    }
    return sim;
  };

  S.END_OF_DAY = { day: 1, minute: 1439 };
})();
