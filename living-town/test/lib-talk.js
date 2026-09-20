/* lib-talk.js — test helper: get two people into a real conversation.
 * One walks up and asks; the other joins by taking the candidate the world
 * offers them, exactly as a policy would. Nothing is forced. */
'use strict';
const assert = require('node:assert/strict');

exports.walkUpAndAsk = function (sim, asker, other) {
  const started = sim.startActivity(asker, { actionId: 'talk_with', targetKind: 'person', targetId: other.id }, 'test', null);
  assert(started.ok, 'talk_with could not be chosen: ' + started.error);
  for (let i = 0; i < 40 && asker.activity && asker.activity.phase === 'approaching'; i++) sim.tick();
  return started;
};

exports.converse = function (sim, asker, other) {
  exports.walkUpAndAsk(sim, asker, other);
  assert(asker.activity && asker.activity.phase === 'waiting_reply', 'the asker should be waiting for an answer');
  const joined = sim.startActivity(other, { actionId: 'join_conversation', targetKind: 'conversation', targetId: asker.activity.conversationId }, 'test', null);
  assert(joined.ok, 'join_conversation refused: ' + joined.error);
  return sim.conversationById(asker.activity.conversationId);
};
