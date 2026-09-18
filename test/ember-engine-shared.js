#!/usr/bin/env node
/* ember-engine-shared.js — proof that the extraction is real.
 *
 * A folder move is not an extraction. This drives Twin Peaks and Living Town
 * against instrumented copies of the Ember Engine functions and fails unless
 * both experiences actually call the same implementations. It also fails if
 * the engine starts to know anything about either game.
 *
 * Run: node test/ember-engine-shared.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const J = (...p) => path.join(ROOT, ...p);
let checks = 0;
const ok = (msg) => { checks++; console.log('  ok - ' + msg); };

/* ---------------- 1. the engine knows nothing about either game ---------------- */

const EMBER_FILES = fs.readdirSync(J('engine')).filter((f) => f.endsWith('.js')).sort();
assert.ok(EMBER_FILES.length >= 5, 'engine/ holds the extracted modules');
const FORBIDDEN = [
  [/\bGAME\b/, 'the Twin Peaks GAME namespace'],
  [/\bLT\b\s*[.=]/, 'the Living Town LT namespace'],
  [/cooper|laura|palmer|twin\s*peaks|roadhouse|sheriff/i, 'Twin Peaks content'],
  [/\bmara\b|\btomas\b|cafe|café|intervention|commitment/i, 'Living Town content']
];
/* Comments may name the consumers — that is documentation. Code may not:
 * a dependency is what the engine executes, not what it talks about. */
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
EMBER_FILES.forEach((f) => {
  const code = stripComments(fs.readFileSync(J('engine', f), 'utf8'));
  FORBIDDEN.forEach(([re, what]) => {
    assert.ok(!re.test(code), `engine/${f} must not reference ${what} in code`);
  });
});
ok(`${EMBER_FILES.length} engine modules reference neither game in code`);

/* The engine must also load with neither game present. */
execFileSync(process.execPath, ['-e', `
  ${EMBER_FILES.map((f) => `require(${JSON.stringify(J('engine', f))});`).join('\n')}
  if (typeof global.GAME !== 'undefined') throw new Error('engine created GAME');
  if (typeof global.LT !== 'undefined') throw new Error('engine created LT');
  if (!global.EMBER.Grid || !global.EMBER.Camera || !global.EMBER.Tilemap) throw new Error('incomplete');
`], { stdio: 'pipe' });
ok('engine modules load standalone, creating neither GAME nor LT');

/* ---------------- 2. Twin Peaks refuses to run without it ---------------- */

let refused = false;
try {
  execFileSync(process.execPath, ['-e', `
    global.window = global;
    global.addEventListener = function () {};
    global.GAME = {};
    global.EMBER = { Grid: null };            // present but empty: the guard must still fire
    require(${JSON.stringify(J('js', 'engine.js'))});
  `], { stdio: 'pipe' });
} catch (e) {
  refused = /Ember Engine missing/.test(String(e.stderr || e.message));
}
assert.ok(refused, 'js/engine.js must refuse to boot without the Ember Engine');
ok('Twin Peaks refuses to boot without the Ember Engine');

/* ---------------- 3. both experiences call the same functions ---------------- */

const tnow = { t: 0 };
global.window = global;
global.addEventListener = () => {};
global.removeEventListener = () => {};
global.requestAnimationFrame = () => {};
global.performance = { now: () => tnow.t };
global.document = { addEventListener: () => {}, createElement: () => makeCanvas() };

const ctxStub = new Proxy(
  { measureText: (s) => ({ width: String(s).length * 5 }) },
  { get(t, k) { return k in t ? t[k] : () => {}; }, set() { return true; } }
);
function makeCanvas() { return { width: 0, height: 0, getContext: () => ctxStub, style: {} }; }

EMBER_FILES.forEach((f) => require(J('engine', f)));
const EMBER = global.EMBER;

/* Instrument every exported engine function, then attribute each call to
 * whichever experience is running. */
const calls = { twinpeaks: new Set(), livingtown: new Set() };
let who = null;
Object.keys(EMBER).forEach((ns) => {
  Object.keys(EMBER[ns]).forEach((fn) => {
    const original = EMBER[ns][fn];
    if (typeof original !== 'function') return;
    EMBER[ns][fn] = function () {
      if (who) calls[who].add(ns + '.' + fn);
      return original.apply(this, arguments);
    };
  });
});

/* -- Twin Peaks -- */
/* Driven exactly as test/smoke.js drives it: start() installs the loop through
 * requestAnimationFrame, which the harness owns, so update() and render() run
 * for real. */
const rafQueue = [];
global.requestAnimationFrame = (cb) => { rafQueue.push(cb); };
global.setInterval = () => 0;

['tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'retro-font.js', 'engine.js',
 'scene-objects.gen.js', 'glue.js'].forEach((f) => require(J('js', f)));
const GAME = global.GAME;

who = 'twinpeaks';
const canvas = makeCanvas();
GAME.Engine.init(canvas);
GAME.Engine.onResize();
GAME.Engine.start();
const S = GAME.Engine.state;
S.mode = 'play';
/* Commit the player to a step so the shared kinematics run, not just the
 * camera and the tilemap. */
S.player.mx = S.player.tx; S.player.my = S.player.ty - 1;
S.player.moveStartX = S.player.tx; S.player.moveStartY = S.player.ty;
S.player.moving = true; S.player.moveT = 0;
for (let frame = 0; frame < 40; frame++) {
  tnow.t += 16;
  rafQueue.splice(0).forEach((cb) => cb(tnow.t));
}
assert.ok(GAME.Engine.state.player.moveT > 0, 'the engine loop actually ran');
who = null;

/* -- Living Town -- */
require(J('living-town', 'js', 'lt-scenario.js'));
require(J('living-town', 'js', 'lt-art.js'));
require(J('living-town', 'js', 'lt-view.js'));
const LT = global.LT;
who = 'livingtown';
const sim = LT.Scenario.day1({ intervention: false });
for (let i = 0; i < 90; i++) sim.tick();
const view = LT.View.create(makeCanvas(), sim);
view.update(16);
view.draw();
view.update(16);
view.draw();
who = null;

const shared = [...calls.twinpeaks].filter((k) => calls.livingtown.has(k)).sort();
console.log('  twin peaks  :', [...calls.twinpeaks].sort().join(', ') || '(none)');
console.log('  living town :', [...calls.livingtown].sort().join(', ') || '(none)');
console.log('  shared      :', shared.join(', ') || '(none)');

/* Every one of these is executed by both experiences from the same file. If
 * either side grows a private copy, it drops out of this list and the test
 * fails, which is the only thing that makes "shared" a fact rather than a
 * folder name. */
const MUST_SHARE = [
  'Math.clamp', 'Math.approach',
  'Grid.walkPhase',
  'Camera.clampAxis', 'Camera.centerOn', 'Camera.approach',
  'Tilemap.visibleRange', 'Tilemap.paintWindow', 'Tilemap.depthSort',
  'Viewport.attachNative', 'Viewport.sizeNative'
];
/* Kinematics and easing are Twin Peaks' today; Living Town's view smooths
 * instead of stepping. Asserted here so a regression is visible either way. */
['Grid.advanceStep', 'Math.smoothstep'].forEach((k) => {
  assert.ok(calls.twinpeaks.has(k), `Twin Peaks must execute EMBER.${k}`);
});
MUST_SHARE.forEach((k) => {
  assert.ok(calls.twinpeaks.has(k), `Twin Peaks must execute EMBER.${k}`);
  assert.ok(calls.livingtown.has(k), `Living Town must execute EMBER.${k}`);
});
ok(`${shared.length} engine functions are executed by both experiences`);

/* ---------------- 4. Living Town does not need Twin Peaks ---------------- */

execFileSync(process.execPath, ['-e', `
  require(${JSON.stringify(J('living-town', 'js', 'lt-scenario.js'))});
  if (typeof global.GAME !== 'undefined') throw new Error('Living Town pulled in Twin Peaks');
  var sim = global.LT.Scenario.day1({});
  for (var i = 0; i < 120; i++) sim.tick();
  if (!sim.state.events.length) throw new Error('nothing happened');
`], { stdio: 'pipe' });
ok('Living Town boots and runs with no Twin Peaks module loaded');

console.log(`\nEMBER-SHARED-PASS — ${checks} checks`);
