/* jev-transport.js — Living Town: the Jev transport, without the network.
 * What is sent is exactly the options on offer, in words; what comes back is
 * either one of them or an error; the key never leaves the process except in
 * the Authorization header. No call is made here: fetch is a stand-in.
 * node living-town/test/jev-transport.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
global.window = global;
require(path.resolve(__dirname, '..', 'js', 'lt-scenario.js'));
require(path.resolve(__dirname, '..', 'js', 'policy', 'lt-remote-policy.js'));
const T = require(path.resolve(__dirname, '..', 'tools', 'jev-transport.js'));
const LT = global.LT;

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

(async function () {
  const town = LT.Scenario.town({});
  await town.runUntil(1, 725);
  const req = town.buildRequest(town.state.characters.resident_b, 'idle');
  const brief = LT.PolicyBrief.render(req);

  console.log('# what is sent');
  ok(brief.options.length === req.candidates.length && brief.options.every((o, i) => o.id === req.candidates[i].id) && brief.situation.indexOf('Options:') < 0 && brief.user.indexOf(brief.situation) === 0,
     'the brief gives the options as data and the situation without them; the text brief is unchanged');
  const built = T.toRequest(brief);
  const q = built.body.questions.next, keys = Object.keys(q.criteria);
  ok(q.type === 'choice' && keys.length === req.candidates.length && keys.every((k) => req.candidates.some((c) => c.id === built.keys[k])), 'one Choice whose options are exactly the candidates, each mapped back to its id');
  ok(new Set(keys).size === keys.length && keys.every((k) => !/resident_|obj_|:/.test(k)), 'options are in words and distinct; no internal id is shown to the model as an option name');
  const sent = JSON.stringify(built.body);
  ok(built.body.model === 'jev-latest' && sent.indexOf('TYPESAFE') < 0 && !/"money":|"hunger":\s*\d/.test(JSON.stringify(built.body.state).replace(brief.situation, '')), 'the state is the situation the person could know, and nothing else');
  ok(town.actorIds().filter((id) => id !== 'resident_b').every((id) => sent.indexOf(town.state.characters[id].money + '.00 EUR') < 0 || town.state.characters[id].money === town.state.characters.resident_b.money), 'nobody else\'s purse is in it');

  console.log('# what comes back');
  const first = keys[0], reply = { model: 'jev-x', answers: { next: { type: 'choice', choice: first, probabilities: { [first]: 0.7, [keys[1] || first]: 0.3 }, confidence: 0.4 } }, usage: { input_tokens: 1, output_tokens: 1 } };
  const good = T.fromReply(reply, built.keys);
  ok(good.choose === built.keys[first] && good.jev.confidence === 0.4 && Object.keys(good.jev.probabilities).every((id) => req.candidates.some((c) => c.id === id)), 'a choice on offer becomes that candidate, with the distribution by candidate id');
  ok(T.fromReply({ answers: { next: { type: 'choice', choice: 'Fly to the moon' } } }, built.keys).error === 'chose_nothing_on_offer' && T.fromReply({}, built.keys).error === 'no_choice_in_reply' && T.fromReply(null, built.keys).error === 'no_choice_in_reply', 'anything else is an error, never a guess');
  ok(!('reason' in good) && !('say' in good), 'nothing is put in anybody\'s mouth: Jev does not write');

  console.log('# through the remote policy, with a stand-in for the network');
  let seen = null;
  const fakeFetch = async (url, init) => { seen = { url, init }; return { ok: true, status: 200, text: async () => JSON.stringify(reply) }; };
  LT.RemotePolicy.create({ id: 'jev_test', transport: T.create({ key: 'k-test', fetch: fakeFetch }) });
  const res = await LT.Policy.get('jev_test').decide(req);
  ok(res.status === 'selected' && res.selectedId === built.keys[first] && res.source === 'jev_test', 'the adapter turns it into an ordinary selection');
  ok(seen.url === T.ENDPOINT && seen.init.headers.Authorization === 'Bearer k-test' && seen.init.body.indexOf('k-test') < 0, 'the key goes in the header and nowhere else');
  LT.RemotePolicy.create({ id: 'jev_down', transport: T.create({ key: 'k', fetch: async () => ({ ok: false, status: 429, text: async () => 'slow down' }) }) });
  const down = await LT.Policy.get('jev_down').decide(req);
  ok(down.status !== 'selected' && /http_429/.test(JSON.stringify(down)), 'a refusal from the service is an ordinary failed answer, named');

  console.log('\njev-transport: ' + checks + '/' + checks);
})().catch((e) => { console.error(e); process.exit(1); });
