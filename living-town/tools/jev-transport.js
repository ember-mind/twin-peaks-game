/* jev-transport.js — Living Town: a transport for LT.RemotePolicy that asks
 * TypeSafe's Jev which of the options on offer a person takes.
 *
 * Jev is not a writer: it returns one of the options and a probability for
 * each, never text. So this transport has no `reason` and no `say` — nothing
 * is put in a person's mouth — and what it adds to the decision record is the
 * distribution it was given. The question is a Choice whose options are
 * exactly the request's candidates; whatever comes back that is not one of
 * them is an unusable reply, and the simulation's own fallback takes over.
 *
 * Node only. The key is read from the environment or from
 * ~/.config/typesafe/.env (TYPESAFE_API_KEY=...), never from the repository
 * and never sent to a page: a browser reaches Jev through tools/jev-relay.js.
 *
 *   const T = require('./jev-transport.js');
 *   LT.RemotePolicy.create({ id: 'jev', label: 'Jev', transport: T.create(), perTownDay: 40 })
 */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
const MODEL = 'jev-latest';
const KEY_FILE = path.join(os.homedir(), '.config', 'typesafe', '.env');

function loadKey() {
  if (process.env.TYPESAFE_API_KEY) return process.env.TYPESAFE_API_KEY.trim();
  let text;
  try { text = fs.readFileSync(KEY_FILE, 'utf8'); } catch (e) { throw new Error('no TypeSafe key: set TYPESAFE_API_KEY or write it to ' + KEY_FILE); }
  const m = /^\s*TYPESAFE_API_KEY\s*=\s*(.+?)\s*$/m.exec(text);
  if (!m) throw new Error(KEY_FILE + ' has no TYPESAFE_API_KEY= line');
  return m[1].replace(/^["']|["']$/g, '');
}

/* brief (LT.PolicyBrief.render) -> { body, keys }. Pure. An option's key is
 * what the model reads, so it is the option in words ("3. Buy a meal — café
 * counter"), numbered so that two options with the same label stay apart;
 * `keys` maps each back to the candidate id. */
function toRequest(brief, model) {
  const criteria = {}, keys = {};
  brief.options.forEach((o, i) => {
    const key = (i + 1) + '. ' + o.label;
    keys[key] = o.id;
    criteria[key] = 'Takes ' + o.minutes + ' minutes.' + (o.meta ? ' Details: ' + JSON.stringify(o.meta) : '');
  });
  return {
    keys,
    body: {
      model: model || MODEL,
      state: { person: brief.who, situation: brief.situation },
      questions: {
        next: {
          type: 'choice',
          instructions: 'Read `situation`: it describes `person`, an inhabitant of a small town, right now — body, money, temperament, goals, promises, who is there, what they remember. ' +
            'Which one of these things does `person` do next? Choose what this particular person would most plausibly do, given their needs, their promises and the hour, not what would be ideal.',
          criteria
        }
      }
    }
  };
}

/* Jev's reply -> what LT.PolicyBrief.parse understands, or a reason it is unusable. */
function fromReply(reply, keys) {
  const a = reply && reply.answers && reply.answers.next;
  if (!a || a.type !== 'choice' || typeof a.choice !== 'string') return { error: 'no_choice_in_reply' };
  const id = keys[a.choice];
  if (!id) return { error: 'chose_nothing_on_offer' };
  const probabilities = {};
  Object.keys(a.probabilities || {}).forEach((k) => { if (keys[k]) probabilities[keys[k]] = a.probabilities[k]; });
  return { choose: id, jev: { model: reply.model, confidence: a.confidence, probabilities, usage: reply.usage || null } };
}

/* -> transport(brief) -> Promise<object>. `onCall` sees every exchange (for a
 * log or a meter); it never sees the key. */
function create(opts) {
  opts = opts || {};
  const key = opts.key || loadKey(), doFetch = opts.fetch || fetch, onCall = opts.onCall || null;
  return async function transport(brief) {
    const built = toRequest(brief, opts.model), started = Date.now();
    const res = await doFetch(opts.endpoint || ENDPOINT, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(built.body)
    });
    const text = await res.text();
    let reply = null; try { reply = JSON.parse(text); } catch (e) { /* handled below */ }
    const out = res.ok ? fromReply(reply, built.keys) : { error: 'http_' + res.status + ': ' + String(text).slice(0, 200) };
    if (onCall) onCall({ requestId: brief.requestId, who: brief.who, ms: Date.now() - started, status: res.status, options: brief.options.length, result: out });
    if (out.error) throw new Error(out.error);
    return out;
  };
}

module.exports = { create, toRequest, fromReply, loadKey, ENDPOINT, MODEL, KEY_FILE };
