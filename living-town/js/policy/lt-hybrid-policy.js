/* lt-hybrid-policy.js — Living Town: ask the expensive one only when it matters,
 * and never be left without an answer.
 *
 * Wraps two registered policies. The fast one (the offline UtilityPolicy) is
 * asked first, always. If its own arithmetic says the choice is clear — the
 * best option leads the next different one by more than `closeGap` — that is
 * the answer, and the slow one is not troubled with whether to sleep at
 * midnight. If it is close, the slow one is asked; and if the slow one fails,
 * is unavailable, or names something not on offer, the fast answer stands
 * instead of the person falling back to waiting.
 *
 * Every answer says where it came from (`source`), so a watcher can tell a
 * choice the provider made from one it was never asked about.
 *
 *   LT.HybridPolicy.create({ id, fast: 'utility', slow: '<remote id>', closeGap: 3 })
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function' && !LT.Policy) require('./lt-policy.js');
  var Pol = LT.Policy;
  var H = LT.HybridPolicy = {};

  /* The lead of the chosen option over the best different thing to do. */
  H.lead = function (response) {
    var f = response && response.diagnostics && response.diagnostics.factors;
    if (!f || !f.length) return Infinity;
    var chosen = null, second = null;
    f.forEach(function (x) { if (x.candidateId === response.selectedId) chosen = x; });
    if (!chosen) return Infinity;
    f.forEach(function (x) { if (x !== chosen && x.actionId !== chosen.actionId && (!second || x.score > second.score)) second = x; });
    return second ? chosen.score - second.score : Infinity;
  };

  H.create = function (opts) {
    if (!opts || !opts.id || !opts.fast || !opts.slow) throw new Error('a hybrid policy needs an id, a fast policy id and a slow policy id');
    var closeGap = opts.closeGap === undefined ? 3 : opts.closeGap;
    var stats = { asked: 0, clear: 0, close: 0, slowAnswered: 0, slowFailed: 0 };
    var policy = {
      id: opts.id, label: opts.label || opts.id,
      get remote() { var s = Pol.get(opts.slow); return !!(s && s.remote); },
      get patienceMs() { var s = Pol.get(opts.slow); return s ? s.patienceMs : 0; },
      decide: function (request) {
        var fast = Pol.get(opts.fast), slow = Pol.get(opts.slow);
        if (!fast) return Promise.resolve(Pol.failed(request, opts.id, 'fast policy "' + opts.fast + '" is not registered'));
        stats.asked++;
        return Promise.resolve(fast.decide(request)).then(function (quick) {
          var usable = quick && quick.status === 'selected';
          if (usable && H.lead(quick) > closeGap) { stats.clear++; return tag(quick, opts.id + ':' + quick.source + ':clear'); }
          if (!slow) { return usable ? tag(quick, opts.id + ':' + quick.source + ':no_slow') : quick; }
          stats.close++;
          return Promise.resolve(slow.decide(request)).then(function (slowAnswer) {
            if (Pol.validateResponse(request, slowAnswer).ok && slowAnswer.status === 'selected') { stats.slowAnswered++; return tag(slowAnswer, opts.id + ':' + slowAnswer.source); }
            stats.slowFailed++;
            return usable ? tag(quick, opts.id + ':' + quick.source + ':stood_in') : slowAnswer;
          }, function () { stats.slowFailed++; return usable ? tag(quick, opts.id + ':' + quick.source + ':stood_in') : Pol.failed(request, opts.id, 'both policies failed'); });
        });
      },
      stats: function () { return JSON.parse(JSON.stringify(stats)); }
    };
    function tag(response, source) { var out = {}; Object.keys(response).forEach(function (k) { out[k] = response[k]; }); out.source = source; return out; }
    return Pol.register(policy);
  };
})();
