'use strict';

/* Actual finale + save-layer contract, with a fixture adapter/storage/scene.
 * This is deliberately NOT a fresh-game/browser completion claim. The full
 * journey discovered the last-page failure in Actions run 35104963254.
 */
const assert = require('node:assert/strict');
const path = require('node:path');
global.GAME = {};
for (const name of ['narrative-runtime', 'narrative-data.gen', 'narrative-bootstrap', 'narrative-save', 'narrative-finale']) {
  require(path.join(__dirname, '..', 'js', name + '.js'));
}
GAME.installNarrativeCatalogs();
const NR = GAME.NarrativeRuntime, NS = GAME.NarrativeSave, NF = GAME.NarrativeFinale;
const mainKey = NS.keyFor('main');
const storage = new Map();
let failMainOnce = false, enableAdapter = true;
NS._setStorage({ getItem: (k) => storage.has(k) ? storage.get(k) : null,
  setItem(k, v) { if (k === mainKey && failMainOnce) { failMainOnce = false; throw new Error('fixture_disk_full'); } storage.set(k, String(v)); },
  removeItem: (k) => storage.delete(k) });
const clone = (v) => JSON.parse(JSON.stringify(v));
const state = NR.createState();
state.flags.leland_morto = true;
state.flags.atto5 = true;
state.values = { m10_method: 'probatorio', s3: 'on', s1: 'documented_custody' };
for (const name of ['taxi_lie', 'traincar_presence', 'laura_homicide', 'maddy_homicide', 'maddy_body_transport', 'letters']) {
  state.values['material_admissions.' + name] = 'leland_first_person';
}
NR.deserialize(NR.serialize(state));
let classic = { mapId: 'town', tx: 29, ty: 30, dir: 'right', clues: [], flags: clone(state.flags) };
GAME.NarrativeAdapter = { isEnabled: () => enableAdapter, active: () => false, sessionStatus: () => 'idle',
  getState: () => state, getMission: () => ({ mission: 'M10' }), currentMissionFor: () => ({ mission: 'M10' }) };
assert.ok(NS.save('main', { classic }).ok, 'initial fixture envelope uses the real save API');
enableAdapter = false;
assert.equal(NS.rebindClassicForFinale('main', classic).error, 'finale_not_pending', 'no finale means no save authority');
let completions = 0, terminalCallbacks = 0;
const carryover = { values: clone(state.values), flags: clone(state.flags), p6_status: 'confirmed_as_lie' };
const started = NF.startAtLodge({ carryover,
  onBeforeMutation: () => clone(classic),
  onRollback: (before) => { classic = before; },
  onFlag: (flag, value) => { classic.flags[flag] = value; },
  onState: (finale) => {
    if (finale.stage === 'complete') terminalCallbacks++;
    return NS.rebindClassicForFinale('main', classic, { narrativeState: state });
  },
  onComplete: () => { completions++; }
});
assert.ok(started.ok, JSON.stringify(started));
function drain() {
  for (let i = 0; i < 100 && NF.isActive(); i++) {
    if (NF.currentScreen().kind === 'choice') return;
    const result = NF.advance(); assert.ok(result.ok, JSON.stringify(result));
  }
}
assert.ok(NF.beginLodge('mfap').ok); drain(); assert.ok(NF.choose('kept').ok); drain();
assert.ok(NF.beginLodge('bob').ok); drain(); assert.ok(NF.choose('A').ok); drain();
assert.ok(NF.resumeLaura().ok); drain();
assert.ok(NF.resumeWoods().ok); drain(); assert.ok(NF.choose('avvertimento').ok); drain();
assert.ok(NF.resumeEpilogueStation().ok); drain();
assert.ok(NF.resumeEpilogueExit().ok);
for (let i = 0; i < 30 && NF.currentScreen().page.id !== 'nf.epilogue.exit.03'; i++) {
  const result = NF.advance(); assert.ok(result.ok, JSON.stringify(result));
}
assert.equal(NF.currentScreen().page.id, 'nf.epilogue.exit.03');
const before = NF.serialize(), beforeClassic = clone(classic), beforeStorage = [...storage.entries()];
failMainOnce = true;
const rejected = NF.advance();
assert.equal(rejected.ok, false, 'a real terminal write failure blocks completion');
assert.equal(rejected.rolled_back, true, 'failure restores the last page');
assert.equal(failMainOnce, false, 'completion must reach the real persistence write, not be refused as not pending');
assert.equal(NF.serialize(), before, 'restore the complete pre-transaction finale state');
assert.deepEqual(classic, beforeClassic, 'rollback the end flag');
assert.deepEqual([...storage.entries()], beforeStorage, 'rollback persisted envelope, backup and generation');
assert.equal(completions, 0, 'do not show terminal screen before a successful checkpoint');
assert.equal(NF.isCompletingCheckpoint(), false, 'completion authority must not leak after failure');
const success = NF.advance();
assert.ok(success.ok && success.complete, JSON.stringify(success));
assert.equal(NF.getState().stage, 'complete');
assert.equal(NF.isPending(), false);
assert.equal(NF.isActive(), false);
assert.equal(classic.flags.end, true);
assert.equal(completions, 1, 'emit completion exactly once');
assert.equal(terminalCallbacks, 2, 'one failed write, then one successful retry');
assert.equal(NS.inspect('main').classic_save_fingerprint, NS.classicFingerprint(classic));
assert.equal(NF.isCompletingCheckpoint(), false, 'completion authority must not leak after success');
assert.equal(NS.rebindClassicForFinale('main', classic).error, 'finale_not_pending', 'arbitrary writes after completion remain forbidden');
assert.equal(NF.advance().error, 'finale_not_active');
assert.equal(completions, 1);
console.log('finale-completion-persistence: terminal checkpoint, rollback, retry and closed authority PASS (fixture, not full campaign)');
