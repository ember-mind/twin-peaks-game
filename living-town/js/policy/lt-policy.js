/* lt-policy.js — Living Town: the decision-policy boundary.
 *
 * A policy is asked a question and answers with one of the answers it was
 * offered. It never touches world state, never invents an action, and never
 * learns anything the request did not carry. Everything downstream of the
 * boundary — validation, movement, money, memory — belongs to the simulation.
 *
 * A future JevPolicy plugs in here with no other change. Nothing in this file
 * or its implementations assumes a language model exists.
 *
 * DecisionRequest {
 *   requestId, seq, actorId, day, minute, absMinute,
 *   stateVersion, relevanceKey,
 *   self         { name, location, activity, needs, money, savings, traits, employment }
 *   observations  (lt-perception.observe)
 *   memories      (bounded, already filtered for relevance)
 *   goals, commitments, relationships
 *   candidates    [{ id, actionId, targetId, label, durationMinutes, ... }]
 *   context      { reason: 'idle' | 'activity_complete' | 'interrupted' }
 * }
 *
 * DecisionResponse {
 *   requestId,
 *   status: 'selected' | 'unavailable' | 'error',
 *   selectedId?   must be one of request.candidates[].id
 *   source        policy identity, e.g. 'utility', 'mock', 'recorded'
 *   diagnostics?  structured factors — never narrated inner monologue
 *   error?
 * }
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  var P = LT.Policy = LT.Policy || {};

  var registry = {};

  P.register = function (policy) {
    if (!policy || !policy.id || typeof policy.decide !== 'function') {
      throw new Error('a policy needs an id and a decide(request) -> Promise');
    }
    registry[policy.id] = policy;
    return policy;
  };

  P.get = function (id) { return registry[id] || null; };
  P.ids = function () { return Object.keys(registry); };
  P.clear = function () { registry = {}; };

  /* Shape check only. Whether the chosen candidate is still legal is the
   * simulation's business, because only the simulation knows the present. */
  P.validateResponse = function (request, response) {
    if (!response || typeof response !== 'object') return { ok: false, error: 'malformed_response' };
    if (response.requestId !== request.requestId) return { ok: false, error: 'request_id_mismatch' };
    if (response.status === 'unavailable') return { ok: true, unavailable: true };
    if (response.status === 'error') return { ok: false, error: response.error || 'policy_error' };
    if (response.status !== 'selected') return { ok: false, error: 'unknown_status' };
    if (typeof response.selectedId !== 'string') return { ok: false, error: 'missing_selection' };
    var offered = request.candidates.some(function (c) { return c.id === response.selectedId; });
    if (!offered) return { ok: false, error: 'selection_not_offered' };
    return { ok: true };
  };

  P.selected = function (request, candidateId, source, diagnostics) {
    return {
      requestId: request.requestId, status: 'selected', selectedId: candidateId,
      source: source, diagnostics: diagnostics || null
    };
  };

  P.unavailable = function (request, source, reason) {
    return { requestId: request.requestId, status: 'unavailable', source: source, error: reason || null };
  };

  P.failed = function (request, source, error) {
    return { requestId: request.requestId, status: 'error', source: source, error: String(error) };
  };
})();
