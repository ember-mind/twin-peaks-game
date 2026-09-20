/* lt-brief.js — Living Town: a decision request, put into words for a provider
 * that reads words, and that provider's reply turned back into a response.
 *
 * Provider-neutral. Nothing here calls anything, names a model, or knows what
 * is on the other end: render() is a pure function of a DecisionRequest, and
 * parse() is a pure function of that request and whatever came back. The brief
 * carries exactly what the request carries — it is the same question in
 * another form, so it can leak nothing the request did not already hold.
 *
 * Reply expected (JSON, anywhere in the text):
 *   { "choose": "<an option id, or its number>", "reason": "<short>", "say": "<short>" }
 * `say` only matters when the option is to talk, join or decline. Both texts
 * are optional, are the provider's own, and are cleaned by LT.Policy.cleanWords.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function' && !LT.Policy) require('./lt-policy.js');
  var Pol = LT.Policy, U = LT.Util;
  var B = LT.PolicyBrief = {};

  B.VERSION = 'brief-v1';
  B.MAX_CHARS = 6000;   // about 1500 tokens; render() trims memories, then options' detail, to stay under it

  function clock(m) { var h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm; }
  function level(v, words) { return v >= 80 ? words[3] : v >= 55 ? words[2] : v >= 30 ? words[1] : words[0]; }
  function eur(v) { return (Math.round(v * 100) / 100).toFixed(2) + ' EUR'; }
  B.SYSTEM = [
    'You decide what one inhabitant of a small town does next.',
    'You are given who they are, what they can see and remember, and a numbered list of options.',
    'The options are the only things that can be done right now. Choose exactly one.',
    'You cannot do anything that is not listed, be somewhere you are not, or know what is not written here.',
    'Reply with JSON only: {"choose": "<option id>", "reason": "<under 25 words, why this person does this>", "say": "<under 35 words, only if the option is to talk with, join or decline someone: what this person says out loud>"}.'
  ].join('\n');

  B.SCHEMA = {
    type: 'object', additionalProperties: false, required: ['choose'],
    properties: { choose: { type: 'string' }, reason: { type: 'string', maxLength: 160 }, say: { type: 'string', maxLength: 240 } }
  };

  function lines(req, memoryCount, detail) {
    var s = req.self, o = req.observations, out = [];
    out.push('You are ' + s.name + '. It is day ' + req.day + ', ' + clock(req.minute) + '. You are at ' + (o.location && o.location.name || s.location) + '.');
    out.push('Body: ' + level(s.needs.hunger, ['not hungry', 'a little hungry', 'hungry', 'very hungry']) + ' (hunger ' + Math.round(s.needs.hunger) + '/100), ' +
             level(100 - s.needs.energy, ['rested', 'fine', 'tired', 'exhausted']) + ' (energy ' + Math.round(s.needs.energy) + '/100).');
    out.push('Money: ' + eur(s.money) + ' in your pocket, ' + eur(s.savings) + ' saved. Food at home: ' + (s.pantry || 0) + ' meal(s).' +
             (s.employment ? ' You work at the ' + s.employment.employer + ', ' + clock(s.employment.shiftStart) + '–' + clock(s.employment.shiftEnd) + '.' : ' You have no job.'));
    var t = s.traits || {};
    out.push('Temperament (0–1): conscientious ' + (t.conscientiousness || 0.5) + ', sociable ' + (t.sociability || 0.5) + ', ambitious ' + (t.ambition || 0.5) + ', cautious ' + (t.caution || 0.5) + '.');
    (req.goals || []).forEach(function (g) {
      out.push('Goal: ' + g.label + ' — ' + (g.reached ? 'reached' : g.missed ? 'missed, it is over' : (Math.round(g.progress * 100) / 100) + ' of ' + g.target + ' ' + (g.unit || '') + ', by the end of day ' + g.deadlineDay) + '.');
    });
    (req.commitments || []).filter(function (c) { return c.status === 'open'; }).forEach(function (c) {
      out.push('Promised: ' + c.label + ' (day ' + c.dueDay + ', ' + clock(c.dueMin) + (c.graceMin ? ', up to ' + c.graceMin + ' min late is still kept' : '') + ').');
    });
    var present = o.present || [];
    out.push(present.length ? 'Here with you: ' + present.map(function (p) {
      var r = (req.relationships || {})[p.id];
      return p.name + ' (' + p.doing + (p.looksUnwell ? '; looks unwell, as if they have not eaten' : '') + (r ? '; you are ' + level(r.closeness, ['barely acquainted', 'acquainted', 'friends', 'close']) : '; a stranger') + ')';
    }).join('; ') + '.' : 'Nobody else is here.');
    if ((o.objects || []).length) out.push('Things here: ' + o.objects.map(function (x) { return x.name; }).join(', ') + '.');
    if ((o.offers || []).length) out.push('Offers to you: ' + o.offers.map(function (x) { return x.summary + ' from ' + x.from + (x.status === 'open' ? ', open until ' + x.expiresAt : ', ' + x.status); }).join('; ') + '.');
    if ((o.reachable || []).length) out.push('You can walk to: ' + o.reachable.map(function (r) {
      return r.name + ' (' + r.walkMinutes + ' min' + (r.opens === 0 && r.closes >= 1440 ? '' : ', open ' + r.opensAt + '–' + r.closesAt) + ((r.services || []).indexOf('buy_meal') >= 0 ? ', sells meals' : '') + ')';
    }).join('; ') + '.');
    var mem = (req.memories || []).slice(0, memoryCount);
    if (mem.length) { out.push('You remember:'); mem.forEach(function (m) { out.push('  - ' + m.stamp + ': ' + m.summary); }); }   // a memory does not record whether it was seen or told, so the brief claims neither
    out.push('Why you are deciding now: ' + ({ idle: 'you have nothing in hand', activity_complete: 'you have just finished something', interrupted: 'you were interrupted', conversation_turn: 'you are in the middle of a talk, and can carry on or bring it to a close' }[req.context && req.context.reason] || 'you have nothing in hand') + '.');
    out.push('Options:');
    req.candidates.forEach(function (c, i) {
      var meta = detail && c.meta && Object.keys(c.meta).length ? ' ' + JSON.stringify(c.meta) : '';
      out.push('  ' + (i + 1) + '. id "' + c.id + '" — ' + c.label + ', ' + c.durationMinutes + ' min' + meta);
    });
    return out;
  }

  /* -> { version, requestId, system, user, schema, chars } */
  B.render = function (request) {
    var memoryCount = 8, detail = true, text;
    for (;;) {
      text = lines(request, memoryCount, detail).join('\n');
      if (text.length <= B.MAX_CHARS || (memoryCount === 0 && !detail)) break;
      if (memoryCount > 0) memoryCount -= 2; else detail = false;
    }
    return { version: B.VERSION, requestId: request.requestId, system: B.SYSTEM, user: text, schema: B.SCHEMA, chars: B.SYSTEM.length + text.length };
  };

  function firstJson(text) {
    var start = text.indexOf('{');
    while (start >= 0) {
      var depth = 0, inStr = false, esc = false;
      for (var i = start; i < text.length; i++) {
        var ch = text.charAt(i);
        if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
        if (ch === '"') inStr = true;
        else if (ch === '{') depth++;
        else if (ch === '}' && --depth === 0) { try { return JSON.parse(text.slice(start, i + 1)); } catch (e) { break; } }
      }
      start = text.indexOf('{', start + 1);
    }
    return null;
  }

  /* Whatever came back -> a DecisionResponse. Never throws; a reply that does
   * not name one of the options is an error response, and the simulation's
   * own fallback takes it from there. */
  B.parse = function (request, raw, source) {
    var obj = (raw && typeof raw === 'object') ? raw : (typeof raw === 'string' ? firstJson(raw) : null);
    if (!obj) return Pol.failed(request, source, 'unparseable_reply');
    var pick = obj.choose, id = null;
    if (typeof pick === 'number' || (typeof pick === 'string' && /^\d+$/.test(pick.trim()))) {
      var c = request.candidates[Number(pick) - 1];
      id = c ? c.id : null;
    } else if (typeof pick === 'string') {
      var wanted = pick.trim();
      id = request.candidates.some(function (x) { return x.id === wanted; }) ? wanted : null;
    }
    if (!id) return Pol.failed(request, source, 'chose_nothing_on_offer');
    return Pol.selected(request, id, source, null, Pol.cleanWords({ reason: obj.reason, say: obj.say }));
  };
})();
