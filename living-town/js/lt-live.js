/* lt-live.js — Living Town: one town, and the browsers that mirror it.
 *
 * The town that everyone watches runs in one process, the host. A browser
 * does not receive pictures of it, nor its state minute by minute: it receives
 * the town once, as an exact save, and after that only what the simulation
 * cannot work out for itself — the answers the policies gave, by question
 * number, and the circumstances that were scheduled — grouped by the minute
 * they went in. It runs the same simulation over the same input and arrives
 * at the same world, which it checks against the host's fingerprint every
 * minute. A mirror that stops matching says so and starts again from a fresh
 * save; it never carries on quietly with a town of its own.
 *
 * A frame is the unit of that stream:
 *   { at, itv: [{ entry }], ans: [{ seq, response }], abs, fp }
 * `at` is the minute the frame was made in (the world's clock before the
 * tick), `itv` the interventions scheduled since the previous frame, `ans` the
 * answers that were in the inbox when the tick began, `abs` and `fp` the
 * clock and fingerprint after it. Everything in a frame is plain data that
 * survives JSON.
 *
 * Nothing here decides anything, and nothing here calls a model.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function') {
    if (!LT.Save) require('./lt-save.js');
  }
  var L = LT.Live = {};

  L.FED_POLICY = 'live_fed';

  function deepCopy(v) { return JSON.parse(JSON.stringify(v)); }

  /* JSON with every object's keys in order, so two worlds that are the same
   * hash the same even when their objects were built in a different order —
   * one grew a field at run time, the other read it back from a save. */
  L.canon = function (v, skip) {
    if (v === null || typeof v !== 'object') return v === undefined ? 'null' : JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(function (x) { return L.canon(x, skip); }).join(',') + ']';
    var keys = Object.keys(v).sort(), parts = [];
    for (var i = 0; i < keys.length; i++) {
      if (v[keys[i]] === undefined || (skip && skip[keys[i]])) continue;
      parts.push(JSON.stringify(keys[i]) + ':' + L.canon(v[keys[i]], skip));
    }
    return '{' + parts.join(',') + '}';
  };

  /* Who decides for a person is not part of what happened to them: the host's
   * people are decided by their policies, a mirror's by the frames. Nor is the
   * id a question was given: a world restored from a save re-asks its open
   * questions under a suffixed id, and the answer is to the same question —
   * and that re-asking touches the state's change counter once more. */
  L.NOT_WORLD = { policyId: true, requestId: true, version: true };

  /* FNV-1a, 32 bits, over the canonical text of what a save would carry of
   * the world: the state, the question counter and the random stream. */
  L.fingerprint = function (sim) {
    var text = L.canon(sim.state, L.NOT_WORLD) + '|' + sim.requestSeq + '|' + sim.eventSeq + '|' + JSON.stringify(sim.rng.getState());
    var h = 0x811c9dc5;
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-8);
  };

  /* ---------------- the host ---------------- */

  /* Wraps the one simulation that is the town. Interventions scheduled through
   * the sim are noted; the answers waiting when a minute begins are noted;
   * step() advances one minute and returns the frame that lets a mirror do
   * the same. */
  L.host = function (sim) {
    var host = { sim: sim, pendingItv: [], frames: 0 };
    var schedule = sim.scheduleIntervention;
    sim.scheduleIntervention = function (entry) {
      var r = schedule.call(sim, entry);
      if (r.ok) host.pendingItv.push({ entry: deepCopy(entry), id: r.record.id });
      return r;
    };
    host.step = function () {
      var at = sim.absMinute();
      var ans = sim.inbox.map(function (response) {
        return { seq: sim.requests[response.requestId].request.seq, response: deepCopy(response) };
      });
      var itv = host.pendingItv;
      host.pendingItv = [];
      sim.tick();
      host.frames++;
      return { at: at, itv: itv, ans: ans, abs: sim.absMinute(), fp: L.fingerprint(sim) };
    };
    /* Several minutes in a row, with the same courtesy between them that
     * Sim.runMinutes gives: a question asked in one minute is answered before
     * the next is decided, as it would be in a town that never stopped. */
    host.stepMany = function (n, each) {
      var i = 0;
      function one() {
        if (i++ >= n) return Promise.resolve();
        var frame = host.step();
        if (each) each(frame);
        return Promise.resolve().then(function () { return Promise.resolve(); }).then(one);
      }
      return Promise.resolve().then(function () { return Promise.resolve(); }).then(one);
    };
    host.save = function () { return LT.Save.toJSON(sim); };
    return host;
  };

  /* ---------------- the mirror ---------------- */

  /* A mirror's people are decided by nobody here: their policy never answers,
   * and the answers arrive in frames, each for the question number it was
   * given to. */
  function fedPolicy() {
    return { id: L.FED_POLICY, label: 'the town', decide: function () { return new Promise(function () {}); } };
  }
  L.registerFed = function () { if (!LT.Policy.get(L.FED_POLICY)) LT.Policy.register(fedPolicy()); };

  /* From a save's text. Every person is re-labelled with the fed policy; the
   * save's own policy ids are remembered so the page can still say who
   * decided (the answers carry their source anyway). */
  L.mirror = function (saveText) {
    L.registerFed();
    var saved = JSON.parse(saveText), policies = {};
    Object.keys(saved.policies || {}).forEach(function (id) { policies[id] = L.FED_POLICY; });
    Object.keys((saved.state && saved.state.characters) || {}).forEach(function (id) { policies[id] = L.FED_POLICY; });
    var sim = LT.Save.deserialize(saved, { policies: policies });
    var m = { sim: sim, applied: 0, hostPolicies: saved.policies || {}, attributions: {} };

    function requestBySeq(seq) {
      var keys = Object.keys(sim.requests);
      for (var i = keys.length - 1; i >= 0; i--) {
        var rec = sim.requests[keys[i]];
        if (rec.request.seq === seq) return rec;
      }
      return null;
    }

    /* One frame, in the minute it was made in. Returns { ok } when the world
     * matched afterwards, { ok:false, reason } when it did not; a frame from a
     * minute already passed is ignored, one from a minute not yet reached is
     * a gap and cannot be applied. */
    m.apply = function (frame) {
      var abs = sim.absMinute();
      if (frame.at < abs) return { ok: true, skipped: true };
      if (frame.at > abs) return { ok: false, reason: 'gap', expected: abs, got: frame.at };
      for (var i = 0; i < frame.itv.length; i++) {
        var r = sim.scheduleIntervention(frame.itv[i].entry);
        if (!r.ok) return { ok: false, reason: 'intervention_refused:' + r.error, id: frame.itv[i].id };
        if (r.record.id !== frame.itv[i].id) return { ok: false, reason: 'intervention_id', expected: frame.itv[i].id, got: r.record.id };
        if (frame.itv[i].by) m.attributions[r.record.id] = frame.itv[i].by;
      }
      for (var j = 0; j < frame.ans.length; j++) {
        var rec = requestBySeq(frame.ans[j].seq);
        if (!rec) return { ok: false, reason: 'unknown_question', seq: frame.ans[j].seq };
        var response = deepCopy(frame.ans[j].response);
        response.requestId = rec.request.requestId;   // a world restored from a save numbers its re-asked questions with a suffix; the answer is to the same question
        if (!sim.receive(rec.request.requestId, response)) return { ok: false, reason: 'answer_refused', seq: frame.ans[j].seq };
      }
      sim.tick();
      m.applied++;
      var fp = L.fingerprint(sim);
      if (fp !== frame.fp) return { ok: false, reason: 'diverged', at: frame.at, expected: frame.fp, got: fp };
      return { ok: true };
    };
    return m;
  };
})();
