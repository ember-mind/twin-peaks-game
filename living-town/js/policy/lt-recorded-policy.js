/* lt-recorded-policy.js — Living Town: replay without calling anything.
 *
 * A seed reproduces a simulation only while every decision is a pure function
 * of state. The moment a remote model answers a question, the seed is no longer
 * enough, so the answers themselves are what gets recorded.
 *
 * A recording keeps decision order, the request identity, the state version the
 * request was built from and the chosen candidate. Replay refuses to guess: if
 * the run diverges, it says so rather than inventing the next answer.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function' && !LT.Policy) require('./lt-policy.js');
  var Pol = LT.Policy;

  /* Wrap any policy and capture what it answered. */
  function recorder(inner, options) {
    options = options || {};
    var entries = [];
    var api = {
      id: options.id || 'recording',
      label: 'RecordingPolicy(' + inner.id + ')',
      entries: entries,
      decide: function (request) {
        return Promise.resolve(inner.decide(request)).then(function (response) {
          entries.push({
            ordinal: entries.length,
            requestId: request.requestId, seq: request.seq,
            actorId: request.actorId, day: request.day, minute: request.minute,
            stateVersion: request.stateVersion, relevanceKey: request.relevanceKey,
            candidateIds: request.candidates.map(function (c) { return c.id; }),
            status: response.status,
            selectedId: response.selectedId || null,
            words: response.words || null,             // a provider's own words are part of what it answered
            innerSource: response.source || inner.id
          });
          return response;
        });
      },
      toJSON: function () {
        return { format: 'living-town/recording@1', policy: inner.id, entries: entries.slice() };
      }
    };
    return api;
  }

  /* Replay a recording. Mismatch is an error, never a silent improvisation. */
  function player(recording, options) {
    options = options || {};
    var entries = (recording && recording.entries) || [];
    /* Looked up by the question's own number, not by how many questions this
     * player has been asked: a world restored from a save puts its open
     * questions again, and a player started in a new process has been asked
     * none. Either way question n gets the answer recorded for question n. */
    var bySeq = {}, answered = {}, used = 0;
    entries.forEach(function (e) { bySeq[e.seq] = e; });
    var api = {
      id: options.id || 'recorded',
      label: 'RecordedPolicy',
      mismatches: [],
      exhausted: false,
      remaining: function () { return entries.length - used; },
      decide: function (request) {
        var e = bySeq[request.seq];
        if (!e) {
          api.exhausted = true;
          return Promise.resolve(Pol.unavailable(request, 'recorded', 'recording_exhausted'));
        }
        if (!answered[e.seq]) { answered[e.seq] = true; used++; }
        var problems = [];
        if (e.actorId !== request.actorId) problems.push('actor:' + e.actorId + '!=' + request.actorId);
        if (e.seq !== request.seq) problems.push('seq:' + e.seq + '!=' + request.seq);
        if (e.minute !== request.minute || e.day !== request.day) {
          problems.push('time:' + e.day + '/' + e.minute + '!=' + request.day + '/' + request.minute);
        }
        if (e.relevanceKey !== request.relevanceKey) problems.push('relevance');
        if (problems.length) {
          api.mismatches.push({ ordinal: e.ordinal, problems: problems });
          if (!options.tolerant) {
            return Promise.resolve(Pol.failed(request, 'recorded', 'replay_divergence:' + problems.join(',')));
          }
        }
        if (e.status !== 'selected') return Promise.resolve(Pol.unavailable(request, 'recorded', 'recorded_' + e.status));
        /* Replayed under the name of whoever answered first: the words were theirs. */
        return Promise.resolve(Pol.selected(request, e.selectedId, options.keepSource ? e.innerSource : 'recorded', {
          replayedFrom: e.ordinal, originalSource: e.innerSource
        }, e.words || null));
      }
    };
    return api;
  }

  LT.RecordedPolicy = {
    record: function (inner, o) { return Pol.register(recorder(inner, o)); },
    replay: function (recording, o) { return Pol.register(player(recording, o)); },
    buildRecorder: recorder,
    buildPlayer: player
  };
})();
