'use strict';

/* Real classic-dialogue completion into the narrative inventory. This is a
 * controlled input fixture, never a substitute for the unseeded browser run. */
const assert = require('node:assert/strict');
const path = require('node:path');
const handlers = {};
global.window = global;
global.addEventListener = (type, fn) => { handlers[type] = fn; };
global.requestAnimationFrame = () => {};
global.performance = { now: () => 0 };
const ctx = new Proxy({ measureText: (s) => ({ width: String(s).length * 5 }) }, {
  get: (o, k) => k in o ? o[k] : () => {}, set: () => true
});
for (const file of ['tiles','chars','houses','maps','data','retro-font','engine','scene-objects.gen','glue',
  'narrative-runtime','narrative-data.gen','narrative-bootstrap','cast-presence','narrative-production']) {
  require(path.join(__dirname, '..', 'js', file + '.js'));
}
GAME.installNarrativeCatalogs();
const E = GAME.Engine, NR = GAME.NarrativeRuntime, NP = GAME.NarrativeProduction;
E.init({ width: 256, height: 192, getContext: () => ctx });
let story = NR.createState();
function key(code) { handlers.keydown({code,repeat:false,preventDefault(){}}); handlers.keyup({code}); }
function sync() { NP.syncClassicToNarrative(NR, story, E.state.flags, E.state.clues); }
function finish() {
  for (let n = 0; n < 100 && E.state.dialogue; n++) key('Enter');
  assert.equal(E.state.dialogue, null);
}
function scene(map, x, y, dir) {
  E.state.mode = 'title'; E.loadMap(map, x, y, dir); E.state.mode = 'play';
  E.state.dialogue = null; E.state.menu = false;
  GAME.CastPresence.syncMaps(GAME.Maps, story, E.state);
}
sync(); assert.deepEqual(story.evidence, {});
scene('sheriff', 10, 5, 'up'); key('Enter');
assert.equal(E.state.dialogue.id, 'truman');
sync(); assert.equal(story.evidence.E1_DIARIO, undefined, 'opening the scene is not acquisition');
finish(); assert.ok(E.state.clues.includes('diario'));
sync(); assert.equal(story.evidence.E1_DIARIO, true, 'completed Truman dialogue imports its earned diary');
assert.equal(story.evidence.E3_LETTERA_R, undefined, 'no premature R');
assert.equal(story.revision, 1);
const repeated = NR.serialize(story); sync(); assert.equal(NR.serialize(story), repeated);
scene('palmer', 6, 2, 'up'); key('Enter');
assert.equal(E.state.dialogue.id, 'laura_room');
sync(); assert.equal(story.evidence.E3_LETTERA_R, undefined, 'unread room pages cannot grant the R');
finish(); assert.ok(E.state.clues.includes('lettera_r'));
sync(); assert.equal(story.evidence.E3_LETTERA_R, true);
assert.equal(story.revision, 2);
assert.deepEqual(Object.keys(story.evidence).sort(), ['E1_DIARIO', 'E3_LETTERA_R']);
assert.deepEqual(story.props, {}, 'importing observations must never formulate a deduction');
story = NR.deserialize(NR.serialize(story));
const saved = NR.serialize(story); sync(); assert.equal(NR.serialize(story), saved, 'reload and repeat are idempotent');
const empty = NR.createState(); NP.syncClassicToNarrative(NR, empty, {sogno_fatto:true,atto4:true});
assert.deepEqual(empty.evidence, {}, 'act flags are not evidence sources; legacy three-argument calls remain valid');
assert.equal(empty.revision, 0);
const unrelated = NR.createState(); NP.syncClassicToNarrative(NR, unrelated, {}, ['cuore','poesia_fuoco','unknown']);
assert.deepEqual(unrelated.evidence, {}, 'only the explicit already-authored bridge is imported');
assert.equal(unrelated.revision, 0);
const batch = NR.createState(); NP.syncClassicToNarrative(NR, batch, {}, ['diario','lettera_r','diario']);
assert.deepEqual(Object.keys(batch.evidence).sort(), ['E1_DIARIO','E3_LETTERA_R']);
assert.equal(batch.revision, 1, 'one import batch is one state revision');
assert.equal(E.state.clues.filter((id) => id === 'diario').length, 1, 'classic inventory was not duplicated');
console.log('classic-evidence-bridge: earned pages, no early grants, exact mapping, revisions and reload idempotence PASS');
