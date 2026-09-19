/* lt-remote-policy.js — Living Town: a policy whose answers come from somewhere
 * slow, unreliable and outside this process.
 *
 * Provider-neutral and transport-neutral: `transport(brief)` is supplied by
 * whoever creates the policy and returns a Promise of text or an object. This
 * file does not know what is on the other end, makes no network call of its
 * own, and ships with no transport. It turns a request into a brief
 * (LT.PolicyBrief), bounds how many are in flight, bounds how long one may
 * take in real time, and turns every way it can go wrong into an ordinary
 * DecisionResponse — the simulation's existing rules (stale answers, superseded
 * requests, its own timeout in town minutes, the fallback wait) do the rest.
 *
 *   LT.RemotePolicy.create({ id, label, transport, timeoutMs, maxInFlight, patienceMs })
 *
 * `remote: true` and `patienceMs` are read by the page: it holds the town's
 * clock, up to that long, rather than let twenty minutes pass while a question
 * is out.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function') { if (!LT.Policy) require('./lt-policy.js'); if (!LT.PolicyBrief) require('./lt-brief.js'); }
  var Pol = LT.Policy, Brief = LT.PolicyBrief;
  var R = LT.RemotePolicy = {};

  function now() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }

  R.create = function (opts) {
    if (!opts || !opts.id || typeof opts.transport !== 'function') throw new Error('a remote policy needs an id and a transport(brief) -> Promise');
    var timeoutMs = opts.timeoutMs || 8000, maxInFlight = opts.maxInFlight || 2;
    var queue = [], inFlight = 0;
    var stats = { asked: 0, answered: 0, timeouts: 0, errors: 0, unusable: 0, latencies: [] };

    function run(job) {
      /* The clock started when the question was asked, not when its turn came:
       * one whose time ran out in the queue is never sent — it would be paid
       * for, refused as late, and hold up the questions that are still live. */
      var left = timeoutMs - (now() - job.asked);
      if (left <= 0) {
        stats.timeouts++;
        job.resolve(Pol.unavailable(job.request, opts.id, 'timeout_in_queue'));
        if (queue.length) run(queue.shift());
        return;
      }
      inFlight++;
      var started = now(), settled = false, timer;
      function finish(response, kind) {
        if (settled) return;                         // a reply after the timeout is dropped here, not delivered twice
        settled = true; clearTimeout(timer); inFlight--;
        stats[kind]++; if (kind === 'answered') stats.latencies.push(Math.round(now() - started));
        job.resolve(response);
        if (queue.length) run(queue.shift());
      }
      timer = setTimeout(function () { finish(Pol.unavailable(job.request, opts.id, 'timeout_' + timeoutMs + 'ms'), 'timeouts'); }, left);
      var sent;
      try { sent = Promise.resolve(opts.transport(Brief.render(job.request))); }
      catch (e) { finish(Pol.failed(job.request, opts.id, 'transport_threw: ' + (e && e.message)), 'errors'); return; }
      sent.then(function (raw) {
        var response = Brief.parse(job.request, raw, opts.id);
        finish(response, response.status === 'selected' ? 'answered' : 'unusable');
      }, function (e) { finish(Pol.failed(job.request, opts.id, 'transport_failed: ' + (e && e.message || e)), 'errors'); });
    }

    var policy = {
      id: opts.id, label: opts.label || opts.id, remote: true,
      patienceMs: opts.patienceMs === undefined ? Math.min(timeoutMs, 6000) : opts.patienceMs,
      decide: function (request) {
        stats.asked++;
        return new Promise(function (resolve) {
          var job = { request: request, resolve: resolve, asked: now() };
          if (inFlight < maxInFlight) run(job); else queue.push(job);
        });
      },
      stats: function () {
        var l = stats.latencies.slice().sort(function (a, b) { return a - b; });
        function pct(p) { return l.length ? l[Math.min(l.length - 1, Math.floor(p * l.length))] : null; }
        return { asked: stats.asked, answered: stats.answered, timeouts: stats.timeouts, errors: stats.errors, unusable: stats.unusable,
                 inFlight: inFlight, queued: queue.length, p50: pct(0.5), p95: pct(0.95) };
      }
    };
    return Pol.register(policy);
  };
})();
