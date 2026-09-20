/* lt-mock-policy.js — Living Town: a policy that does exactly what a test says.
 *
 * Exists so the asynchronous contract can be attacked deliberately: late
 * answers, answers to questions nobody asked, two answers to one question,
 * answers naming an action that was never offered, and no answer at all.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function' && !LT.Policy) require('./lt-policy.js');
  var Pol = LT.Policy;

  /* script entries, consumed in order:
   *   { select: 'travel:cafe' }           choose a candidate by id
   *   { prefer: 'work_shift' }            choose the first candidate for an action
   *   { selectIndex: 0 }
   *   { unavailable: 'reason' }
   *   { error: 'boom' }
   *   { malformed: {...} }                answer with arbitrary junk
   *   { raw: { ... } }                    answer verbatim (wrong requestId, etc.)
   *   { delayTicks: n }                   hold the answer for n manual releases
   *   { duplicate: true }                 answer twice
   *   { silent: true }                    never answer
   * Anything unspecified falls through to `fallbackPrefer`, then candidate 0.
   */
  function create(options) {
    options = options || {};
    var script = (options.script || []).slice();
    var api = {
      id: options.id || 'mock',
      label: 'MockPolicy',
      calls: [],
      held: [],          // answers waiting for release()
      decide: function (request) {
        var step = script.length ? script.shift() : {};
        api.calls.push({ requestId: request.requestId, actorId: request.actorId,
                         clock: request.clock, candidates: request.candidates.map(function (c) { return c.id; }),
                         step: step });

        if (step.silent) return new Promise(function () { /* never settles */ });

        var response = build(request, step, api.id);
        api.lastResponse = response;

        if (step.delayTicks) {
          return new Promise(function (resolve) {
            api.held.push({ request: request, response: response, resolve: resolve, remaining: step.delayTicks, step: step });
          });
        }
        if (step.duplicate && options.sim) {
          // The same answer arrives a second time; the sim must refuse it.
          Promise.resolve().then(function () { options.sim.deliver(response); });
        }
        return Promise.resolve(response);
      },
      /* Let one simulated minute pass for every held answer; those that run out
       * of delay are released now. */
      release: function () {
        var ready = [];
        api.held = api.held.filter(function (h) {
          h.remaining -= 1;
          if (h.remaining <= 0) { ready.push(h); return false; }
          return true;
        });
        ready.forEach(function (h) { h.resolve(h.response); });
        return ready.length;
      },
      releaseAll: function () {
        var held = api.held; api.held = [];
        held.forEach(function (h) { h.resolve(h.response); });
        return held.length;
      },
      pushScript: function (entry) { script.push(entry); return api; }
    };
    return api;
  }

  function build(request, step, sourceId) {
    if (step.raw) return step.raw;
    if (step.malformed) return step.malformed;
    if (step.unavailable) return Pol.unavailable(request, sourceId, step.unavailable);
    if (step.error) return Pol.failed(request, sourceId, step.error);

    var id = null;
    if (step.select) id = step.select;
    else if (step.selectIndex !== undefined) {
      var c = request.candidates[step.selectIndex];
      id = c ? c.id : '__missing__';
    } else if (step.prefer) id = firstFor(request, step.prefer);
    if (!id && step.fallbackPrefer) id = firstFor(request, step.fallbackPrefer);
    if (!id) id = request.candidates.length ? request.candidates[0].id : '__none__';
    return Pol.selected(request, id, sourceId, { scripted: true, step: step });
  }

  function firstFor(request, actionId) {
    for (var i = 0; i < request.candidates.length; i++) {
      if (request.candidates[i].actionId === actionId) return request.candidates[i].id;
    }
    return null;
  }

  LT.MockPolicy = { create: function (o) { return Pol.register(create(o)); }, build: create };
})();
