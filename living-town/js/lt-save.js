/* lt-save.js — Living Town: persisting the authoritative simulation.
 *
 * Everything true about the town lives in one object, sim.state. This file is
 * the only place that turns that object into text and back. It does not know
 * how the world is drawn, and it never asks a policy anything: it serialises
 * facts, and a restored world is the same world with a later clock.
 *
 * A save is versioned and strict. The format string is the contract; a save
 * whose format this build does not know is refused rather than guessed at, and
 * MIGRATIONS is where a future format teaches the loader about an old one.
 *
 * What is deliberately not persisted:
 *   - sim.listeners  — runtime callbacks, meaningless in a new process.
 *   - sim.requests   — the audit trail of questions asked this run. The answers
 *                      still in flight belonged to providers that are gone.
 *   - sim.inbox      — answers that arrived but were not yet applied at a tick
 *                      boundary. A decision made against a state that was then
 *                      saved and reloaded is exactly the kind of stale answer
 *                      the simulation already refuses; silently replaying it
 *                      would put a decision into the world that was never
 *                      validated against the world that came back. So every
 *                      queued answer is dropped and its character re-asks.
 *   - every character's `pending`. A pending decision is a promise held by a
 *                      provider in the process that is about to disappear.
 *                      After a reload nobody will answer it and the character
 *                      would stand still until the 30-minute timeout. The
 *                      saved copy therefore carries pending: null, and the
 *                      character asks again on its first tick. requestSeq is
 *                      restored, so the re-issued request gets a fresh id that
 *                      cannot collide with a saved rejection or decision.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function' && !LT.Sim) require('./lt-sim.js');
  var S = LT.Save = LT.Save || {};

  S.FORMAT = 'living-town/save@1';
  S.DEFAULT_KEY = 'living-town/save';

  function deepCopy(v) { return JSON.parse(JSON.stringify(v)); }

  /* A format string maps to a function that upgrades that save one step closer
   * to the current format. Ship it empty: there is only one format so far. */
  S.MIGRATIONS = S.MIGRATIONS || {};

  /* ---------------- serialise ---------------- */

  S.serialize = function (sim) {
    if (!sim || !sim.state) throw new Error('serialize needs a Sim');

    /* The save owns its facts. The state is copied, never referenced, and the
     * single normalisation — dropping pending decisions — is applied to the
     * copy only, so the live sim keeps the question its provider is holding. */
    var state = deepCopy(sim.state);
    Object.keys(state.characters || {}).forEach(function (id) {
      state.characters[id].pending = null;
    });

    return {
      format: S.FORMAT,
      savedAt: sim.stamp(),
      seed: sim.seed,
      policies: deepCopy(sim.policies || {}),
      eventSeq: sim.eventSeq,
      requestSeq: sim.requestSeq,
      rngState: sim.rng.getState(),
      /* JSON cannot hold Infinity, and a decision timeout of Infinity is a
       * meaningful setting: "wait for this policy for ever". */
      decisionTimeoutMinutes: sim.decisionTimeoutMinutes === Infinity
        ? 'Infinity' : sim.decisionTimeoutMinutes,
      rejections: deepCopy(sim.rejections || []),
      state: state,
      integrity: {
        events: state.events.length,
        version: state.version,
        characters: Object.keys(state.characters).sort()
      }
    };
  };

  S.toJSON = function (sim) { return JSON.stringify(S.serialize(sim)); };

  /* ---------------- deserialise ---------------- */

  /* Walk the migration chain until the save claims the current format. A
   * migration that does not change the format cannot make progress and is
   * refused, so a broken hook can never spin the loader. */
  function upgrade(saved) {
    if (!saved || typeof saved !== 'object') {
      throw new Error('unsupported save format: ' + saved);
    }
    var guard = 0;
    while (saved.format !== S.FORMAT) {
      var migrate = S.MIGRATIONS[saved.format];
      if (!migrate) throw new Error('unsupported save format: ' + saved.format);
      var before = saved.format;
      saved = migrate(saved);
      if (!saved || typeof saved !== 'object' || saved.format === before) {
        throw new Error('unsupported save format: ' + before);
      }
      if (++guard > 1000) throw new Error('unsupported save format: ' + saved.format);
    }
    return saved;
  }

  function verify(saved) {
    var integrity = saved.integrity, state = saved.state, detail = null;
    if (!integrity || typeof integrity !== 'object') detail = 'missing integrity block';
    else if (!state || typeof state !== 'object') detail = 'missing state';
    else if (!Array.isArray(state.events)) detail = 'state has no event log';
    else if (integrity.events !== state.events.length) {
      detail = 'events ' + integrity.events + ' != ' + state.events.length;
    } else if (integrity.version !== state.version) {
      detail = 'version ' + integrity.version + ' != ' + state.version;
    } else if (!Array.isArray(integrity.characters) ||
               JSON.stringify(integrity.characters) !==
                 JSON.stringify(Object.keys(state.characters || {}).sort())) {
      detail = 'characters do not match the character table';
    }
    if (detail) throw new Error('save integrity check failed: ' + detail);
  }

  S.deserialize = function (saved, opts) {
    opts = opts || {};
    saved = upgrade(saved);
    verify(saved);

    var policies = opts.policies ? deepCopy(opts.policies) : deepCopy(saved.policies || {});

    /* The Sim constructor runs world generation, which draws names and looks
     * from the current pools. None of that survives: the whole generated state
     * is replaced below with the saved one, so a restore can never re-name
     * anybody even if the pools have changed. */
    var sim = LT.Sim.create({ seed: saved.seed, policies: policies });

    sim.state = deepCopy(saved.state);
    sim.seed = saved.seed;
    sim.policies = policies;
    sim.rng.setState(saved.rngState);
    sim.eventSeq = saved.eventSeq;
    sim.requestSeq = saved.requestSeq;
    sim.rejections = deepCopy(saved.rejections || []);
    sim.decisionTimeoutMinutes = saved.decisionTimeoutMinutes === 'Infinity'
      ? Infinity : saved.decisionTimeoutMinutes;
    /* Neither the question table nor the answer queue is restored: see the
     * note at the top of this file. */
    sim.requests = {};
    sim.inbox = [];
    sim.listeners = [];

    /* The scheduler reads sim.scheduledInterventions; the state carries the
     * same records in state.interventions. One list, two references, so an
     * intervention scheduled before the save still fires and its status change
     * is visible in state. */
    sim.scheduledInterventions = sim.state.interventions;

    /* An override changes which policy answers for an actor, and the sim reads
     * the actor's own policyId, so the restored characters must be relabelled
     * too, not just the bookkeeping map. */
    Object.keys(sim.state.characters || {}).forEach(function (id) {
      if (policies[id]) sim.state.characters[id].policyId = policies[id];
    });

    return sim;
  };

  S.fromJSON = function (text, opts) { return S.deserialize(JSON.parse(text), opts); };

  /* ---------------- browser convenience ----------------
   * Every storage access is guarded: a blocked, disabled or full localStorage
   * must degrade to "no save" without breaking the page or throwing out. */
  S.writeLocal = function (sim, key) {
    try {
      var storage = root.localStorage;
      if (!storage) return false;
      storage.setItem(key || S.DEFAULT_KEY, S.toJSON(sim));
      return true;
    } catch (e) {
      return false;
    }
  };

  S.readLocal = function (key, opts) {
    try {
      var storage = root.localStorage;
      if (!storage) return null;
      var text = storage.getItem(key || S.DEFAULT_KEY);
      if (!text) return null;
      return S.fromJSON(text, opts);
    } catch (e) {
      return null;
    }
  };
})();
