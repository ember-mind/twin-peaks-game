'use strict';

/* Focused engine-input fixture, not a campaign test. Uses real map geometry
 * and input handlers, with a controlled clock. The full browser journey stays
 * unseeded and independently exercises the phone interaction.
 */
const assert = require('node:assert/strict');
const path = require('node:path');
let clock = 0, frames = [];
const handlers = {};
global.window = global;
global.performance = { now: () => clock };
global.requestAnimationFrame = (fn) => { frames.push(fn); };
global.setInterval = () => 0;
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
global.addEventListener = (kind, fn) => { (handlers[kind] ||= []).push(fn); };
global.document = { hidden: false, addEventListener() {} };
const ctx = new Proxy({ measureText: (s) => ({ width: String(s).length * 5 }) }, {
  get: (o, key) => key in o ? o[key] : () => {}, set: () => true
});
for (const name of ['tiles', 'chars', 'maps', 'data', 'retro-font', 'engine', 'scene-objects.gen', 'glue']) {
  require(path.join(__dirname, '..', 'js', name + '.js'));
}
const E = GAME.Engine;
function emit(kind, code) {
  for (const fn of handlers[kind] || []) fn({ type: kind, code, repeat: false, preventDefault() {} });
}
function pump(ms) {
  for (let i = 0; i < Math.ceil(ms / 16); i++) {
    clock += 16; const next = frames; frames = [];
    for (const fn of next) fn(clock);
  }
}
function reset(map = 'sheriff', x = 6, y = 7, dir = 'right') {
  emit('blur');
  E.loadMap(map, x, y, dir);
  Object.assign(E.state, { mode: 'play', dialogue: null, menu: false, fade: 0, fadePhase: 0, warp: null, npcs: [] });
}
function at(x, y, dir) {
  assert.deepEqual([E.state.player.tx, E.state.player.ty, E.state.player.dir, E.state.player.moving], [x, y, dir, false]);
}
E.init({ width: 256, height: 192, getContext: () => ctx });
E.start(); pump(32);

reset();
emit('keydown', 'ArrowLeft'); pump(16); emit('keyup', 'ArrowLeft'); pump(300);
at(6, 7, 'left'); // This fails on ba8e67f: the queued tap walks onto x=5.
emit('keydown', 'ArrowLeft'); emit('keyup', 'ArrowLeft'); pump(300);
at(5, 7, 'left'); // A second tap in the same direction still takes one step.

reset();
emit('keydown', 'ArrowLeft'); emit('keyup', 'ArrowLeft'); pump(300);
at(6, 7, 'left'); // Between-frame taps are retained as turns, not discarded.

reset();
emit('keydown', 'ArrowLeft'); pump(96); emit('keyup', 'ArrowLeft'); pump(300);
at(5, 7, 'left'); // Holding past the turn delay preserves ordinary walking.

reset('roadhouse', 8, 6, 'right');
emit('keydown', 'ArrowUp'); pump(16); emit('keyup', 'ArrowUp'); pump(300);
at(8, 6, 'up');
let facedTarget = null;
GAME.NarrativeAdapter = { active: () => false, tryInteract: () => false,
  tryInteractAt(map, x, y) { facedTarget = [map, x, y]; return true; } };
emit('keydown', 'Enter'); emit('keyup', 'Enter');
assert.deepEqual(facedTarget, ['roadhouse', 8, 5]);
delete GAME.NarrativeAdapter;

reset();
emit('keydown', 'ArrowLeft'); pump(16); emit('blur'); pump(300); emit('keyup', 'ArrowLeft');
at(6, 7, 'left');
console.log('turn-in-place: 7 physical input contracts passed (unit fixture, not campaign acceptance)');
