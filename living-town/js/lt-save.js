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
 *                      provider in the process that is about to disappear, so
 *                      the saved copy carries pending: null. What is kept is
 *                      the fact that the question was open and why it was
 *                      asked (`reissue`). Requests are issued at the end of a
 *                      tick, from exactly the state a save captures, so asking
 *                      again at load puts the same question to the same world
 *                      and the restored town does not lose the minute. It is
 *                      put under the number it already had, so a recording of
 *                      the uninterrupted run still lines up, but under an id
 *                      that names this load ('req_7.2'): an answer addressed
 *                      to the question as the vanished process asked it is an
 *                      unknown request here, never a second answer.
 *
 * What a save is checked against before it is allowed to become the world:
 *   - the town it was made in (LT.World.fingerprint). Positions, walk targets
 *     and use spots are coordinates in rooms the save does not carry. If the
 *     rooms have changed the save is refused, by name, unless a migration
 *     registered for that old town (S.WORLD_MIGRATIONS) moves everybody
 *     somewhere valid — and the result is verified like any other save.
 *   - who people are: a name, and a look this build can draw. A look that no
 *     longer exists is refused rather than drawn as somebody else.
 *   - where people are: a known place, a walkable cell.
 *   - who answers for them: every policy id must be registered.
 * A refusal is an Error with a sentence a person can read. Nothing here ever
 * falls back to a fresh world; that choice belongs to whoever is asking.
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

  /* A town fingerprint maps to a function that takes a save made in that town
   * and returns one that fits the next: people moved off cells that are now
   * furniture, walk targets dropped, and `world` set to the town it now fits.
   * Empty on purpose: a migration is written against a real old save and
   * tested, never guessed. What it returns goes through verify() all the same. */
  S.WORLD_MIGRATIONS = S.WORLD_MIGRATIONS || {};

  /* ---------------- serialise ---------------- */

  S.serialize = function (sim) {
    if (!sim || !sim.state) throw new Error('serialize needs a Sim');

    /* The save owns its facts. The state is copied, never referenced, and the
     * single normalisation — dropping pending decisions — is applied to the
     * copy only, so the live sim keeps the question its provider is holding. */
    var state = deepCopy(sim.state);
    var reissue = [];
    Object.keys(state.characters || {}).forEach(function (id) {
      var pending = state.characters[id].pending;
      if (pending) {
        var rec = sim.requests[pending.requestId];
        reissue.push({ actorId: id, seq: pending.seq,
                       reason: (rec && rec.request.context && rec.request.context.reason) || 'idle' });
      }
      state.characters[id].pending = null;
    });
    reissue.sort(function (a, b) { return a.seq - b.seq; });

    return {
      format: S.FORMAT,
      world: LT.World.fingerprint(),
      reissue: reissue,
      savedAt: sim.stamp(),
      seed: sim.seed,
      policies: deepCopy(sim.policies || {}),
      eventSeq: sim.eventSeq,
      requestSeq: sim.requestSeq,
      loads: sim.loads || 0,
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

  /* The town may have moved on since the save was written. */
  function fitWorld(saved) {
    var here = LT.World.fingerprint(), guard = 0;
    while (saved.world !== here) {
      var migrate = S.WORLD_MIGRATIONS[saved.world];
      if (!migrate) {
        throw new Error('this save was made in a different version of the town (' +
          (saved.world || 'unrecorded') + '; this build is ' + here + ') and there is no migration for it. ' +
          'Rooms or furniture have changed, so saved positions cannot be trusted. The save has not been modified.');
      }
      var before = saved.world;
      saved = migrate(deepCopy(saved));
      if (!saved || saved.world === before || ++guard > 100) {
        throw new Error('the town migration from ' + before + ' made no progress; the save has not been loaded');
      }
    }
    return saved;
  }

  /* Identity, place and policy: every reference the restored world will follow
   * on its first tick, checked now, with the person and the problem named. */
  function verifyWorld(saved, policies) {
    var W = LT.World, state = saved.state, problems = [];
    Object.keys(state.characters).forEach(function (id) {
      var c = state.characters[id];
      if (!c.name) problems.push(id + ' has no name');
      if (LT.Appearance && !LT.Appearance.LOOKS[c.appearanceId]) {
        problems.push(id + ' has the look "' + c.appearanceId + '", which this build cannot draw');
      }
      var loc = W.LOCATIONS[c.location];
      if (!loc) { problems.push(id + ' is in "' + c.location + '", which is not a place in this town'); return; }
      var spots = [['stands', c.pos]];
      if (c.walkTarget) spots.push(['is walking to', c.walkTarget]);
      spots.forEach(function (s) {
        var p = s[1], row = p && loc.rows[p.y], ch = row && row.charAt(p.x);
        if (!ch || W.isSolid(ch)) problems.push(id + ' ' + s[0] + ' ' + (p ? p.x + ',' + p.y : 'nowhere') + ' in ' + c.location + ', which is not floor');
      });
      var policyId = policies[id] || c.policyId;
      if (!LT.Policy.get(policyId)) problems.push(id + ' is decided by the policy "' + policyId + '", which is not registered');
    });
    (saved.reissue || []).forEach(function (r) {
      if (!state.characters[r.actorId]) problems.push('a decision is to be re-asked for ' + r.actorId + ', who is not in the save');
    });
    if (problems.length) throw new Error('save refused: ' + problems.join('; ') + '. The save has not been modified.');
  }

  S.deserialize = function (saved, opts) {
    opts = opts || {};
    saved = upgrade(saved);
    verify(saved);
    saved = fitWorld(saved);
    verify(saved);

    var policies = opts.policies ? deepCopy(opts.policies) : deepCopy(saved.policies || {});
    verifyWorld(saved, policies);

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
    sim.loads = (saved.loads || 0) + 1;
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

    /* The questions that were open when the save was written, put again in
     * the order they were first asked. See the note at the top of this file. */
    (saved.reissue || []).forEach(function (r) {
      var actor = sim.state.characters[r.actorId];
      if (!actor.activity && !actor.pending) sim.requestDecision(actor, r.reason, r.seq);
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

  /* Three different answers, never folded into one: there is no save; there is
   * one and here is the town; there is one and it cannot be used, and why. A
   * caller that starts a new world on 'refused' is making that choice in the
   * open, with the reason in hand and the stored save still where it was. */
  S.readLocal = function (key, opts) {
    var text;
    try {
      var storage = root.localStorage;
      if (!storage) return { status: 'none', sim: null, reason: null };
      text = storage.getItem(key || S.DEFAULT_KEY);
    } catch (e) {
      return { status: 'none', sim: null, reason: null };
    }
    if (!text) return { status: 'none', sim: null, reason: null };
    try {
      return { status: 'loaded', sim: S.fromJSON(text, opts), reason: null };
    } catch (e) {
      return { status: 'refused', sim: null, reason: String(e && e.message || e) };
    }
  };
})();
