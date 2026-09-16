'use strict';
// Focused engine/bridge fixture. Map placement is test setup, NOT campaign proof.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const handlers = {};
global.window = global;
global.addEventListener = (name, fn) => { handlers[name] = fn; };
global.requestAnimationFrame = () => {};
global.performance = { now: () => 0 };
const storage = new Map();
global.localStorage = { getItem: (k) => storage.has(k) ? storage.get(k) : null,
  setItem: (k, v) => storage.set(k, String(v)), removeItem: (k) => storage.delete(k) };
const js = (name) => path.join(__dirname, '..', 'js', name + '.js');
for (const name of ['tiles', 'chars', 'maps', 'data', 'retro-font', 'engine',
  'scene-objects.gen', 'glue', 'narrative-runtime', 'narrative-data.gen',
  'narrative-bootstrap', 'cast-presence', 'narrative-production']) require(js(name));
GAME.installNarrativeCatalogs();
GAME.CastPresence.syncMaps(GAME.Maps, null);
const NR = GAME.NarrativeRuntime, NP = GAME.NarrativeProduction, E = GAME.Engine;
assert.equal(typeof NP.syncClassicEvidence, 'function', 'production must expose the actual import seam');
let checks = 0;
function check(value, label) { assert.ok(value, label); checks++; }
const state = NR.createState();
const empty = JSON.stringify(state);
for (const clues of [undefined, null, {}, 'diario', [], ['unknown'], ['E1_DIARIO']]) {
  assert.deepEqual(NP.syncClassicEvidence(NR, state, clues), []);
  check(JSON.stringify(state) === empty, 'absence or unknown aliases cannot grant evidence');
}
NP.syncClassicToNarrative(NR, state, { atto4: true, sogno_fatto: true });
check(!state.evidence.E1_DIARIO && !state.evidence.E3_LETTERA_R, 'an act flag is not an acquisition');
const ctx = new Proxy({ measureText: (s) => ({ width: String(s).length * 5 }) },
  { get: (o, k) => k in o ? o[k] : () => {}, set: () => true });
E.init({ getContext: () => ctx }); E.state.mode = 'play';
function key() {
  handlers.keydown({ code: 'Enter', preventDefault() {}, repeat: false });
  handlers.keyup({ code: 'Enter' });
}
function sync() { return NP.syncClassicEvidence(NR, state, E.state.clues); }
function drain() { let count = 0; while (E.state.dialogue && count++ < 100) key(); check(count < 100, 'dialogue completes'); }
E.loadMap('sheriff', 11, 4, 'left'); key();
check(E.state.dialogue && E.state.dialogue.id === 'truman', 'actual classic diary dialogue opens');
sync(); check(!state.evidence.E1_DIARIO, 'opening a dialogue does not grant its unearned clue');
drain(); check(E.state.clues.includes('diario'), 'classic engine awards diary after completion');
assert.deepEqual(sync(), ['E1_DIARIO']); check(state.evidence.E1_DIARIO, 'earned diary reaches narrative notebook');
check(!state.evidence.E3_LETTERA_R, 'diary alone does not grant the letter');
E.loadMap('palmer', 6, 2, 'up'); key();
check(E.state.dialogue && E.state.dialogue.id === 'laura_room', 'actual room/radio dialogue opens');
sync(); check(!state.evidence.E3_LETTERA_R, 'letter is unavailable before rendered acquisition completes');
drain(); check(E.state.clues.includes('lettera_r'), 'classic engine awards letter');
assert.deepEqual(sync(), ['E3_LETTERA_R']);
check(state.evidence.E3_LETTERA_R, 'earned letter reaches narrative notebook');
const serialized = NR.serialize(state), revision = state.revision;
for (let i = 0; i < 5; i++) assert.deepEqual(sync(), []);
check(NR.serialize(state) === serialized && state.revision === revision, 'polling is idempotent');
check(NR.peekProp(state, 'P8').formulation.status === 'unformulated', 'import never performs a deduction');
const restored = NR.deserialize(serialized);
check(restored.evidence.E1_DIARIO && restored.evidence.E3_LETTERA_R, 'both earned clues survive serialization');
const older = NR.createState(), olderRevision = older.revision;
NP.syncClassicEvidence(NR, older, ['diario', 'lettera_r', 'diario']);
check(older.revision === olderRevision + 1, 'repair dirties an older save once, not per duplicate clue');
assert.deepEqual(Object.keys(older.evidence).sort(), ['E1_DIARIO', 'E3_LETTERA_R']);
const source = fs.readFileSync(js('narrative-production'), 'utf8');
check(source.includes('syncClassicEvidence(NR, state, classic.clues)'), 'boot imports the actual loaded inventory');
check(source.includes('syncClassicEvidence(NR, state, E.state.clues)'), 'poll imports the actual live inventory');
check(source.indexOf('lastSavedRevision = state.revision; // Durable revision') <
  source.indexOf('syncClassicEvidence(NR, state, classic.clues)'), 'save cursor precedes load repair');
console.log('classic-evidence-bridge: ' + checks + ' contracts passed; not a full browser playthrough');
