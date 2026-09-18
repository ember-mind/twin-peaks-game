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
    /* Only a call made by the experience itself counts. A call one engine
     * function makes to another (Camera.approach -> Math.approach) says
     * nothing about the caller's own call sites, and used to let a private
     * copy of the inner function go unnoticed. */
    EMBER[ns][fn] = function () {
      if (who && depth === 0) calls[who].add(ns + '.' + fn);
      if (who) reached[who].add(ns + '.' + fn);
      depth++;
      try { return original.apply(this, arguments); } finally { depth--; }
    };
  });
});

let depth = 0;
const reached = { twinpeaks: new Set(), livingtown: new Set() };

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

/* What this gate is, precisely: shared-call coverage. Each name below is
 * called by both experiences' own code, directly, from the one file in
 * engine/. It does not prove that no private copy exists anywhere — the scan
 * further down covers the copies worth worrying about — and it says nothing
 * about how either experience looks. */
const MUST_SHARE = [
  'Grid.walkPhase',
  'Camera.centerOn', 'Camera.approach',
  'Tilemap.paintWindow', 'Tilemap.depthSort',
  'Viewport.attachNative'
];
/* Called directly by one side only, today. Asserted so a side that stops
 * calling the engine and grows its own version shows up here. */
/* Tilemap.paintDepthBands is shared too, but Living Town reaches it only on its
 * production-rendered locations; living-town/test/cafe-scene.js asserts that side. */
['Grid.advanceStep', 'Math.clamp', 'Viewport.sizeNative', 'Tilemap.paintDepthBands'].forEach((k) => {
  assert.ok(calls.twinpeaks.has(k), `Twin Peaks must call EMBER.${k} directly`);
});
['Math.approach'].forEach((k) => {
  assert.ok(calls.livingtown.has(k), `Living Town must call EMBER.${k} directly`);
});
/* Reached through other engine functions rather than called by the
 * experiences themselves. */
['Camera.clampAxis', 'Tilemap.visibleRange', 'Math.approach'].forEach((k) => {
  assert.ok(reached.twinpeaks.has(k) && reached.livingtown.has(k), `EMBER.${k} must run under both experiences`);
});
assert.ok(reached.twinpeaks.has('Math.smoothstep'), 'Twin Peaks must reach EMBER.Math.smoothstep');
MUST_SHARE.forEach((k) => {
  assert.ok(calls.twinpeaks.has(k), `Twin Peaks must call EMBER.${k} directly`);
  assert.ok(calls.livingtown.has(k), `Living Town must call EMBER.${k} directly`);
});
ok(`${shared.length} engine functions are called directly by both experiences`);

/* ---------------- 4. Living Town does not need Twin Peaks ---------------- */

execFileSync(process.execPath, ['-e', `
  require(${JSON.stringify(J('living-town', 'js', 'lt-scenario.js'))});
  if (typeof global.GAME !== 'undefined') throw new Error('Living Town pulled in Twin Peaks');
  var sim = global.LT.Scenario.day1({});
  for (var i = 0; i < 120; i++) sim.tick();
  if (!sim.state.events.length) throw new Error('nothing happened');
`], { stdio: 'pipe' });
ok('Living Town boots and runs with no Twin Peaks module loaded');

/* ---------------- 5. no private copies, real hosts, real outputs ---------------- */

/* The formulas the engine owns must not reappear in either consumer. The
 * utility policy keeps a clamp of its own on purpose: a decision policy has to
 * be able to run where the engine is not loaded. */
const consumers = ['js/engine.js'].concat(
  fs.readdirSync(J('living-town', 'js')).filter((f) => /\.js$/.test(f)).map((f) => 'living-town/js/' + f));
const OWNED = [
  [/Math\.exp\(\s*-/, 'exponential approach (EMBER.Math.approach)'],
  [/\*\s*\(3\s*-\s*2\s*\*/, 'smoothstep (EMBER.Math.smoothstep)'],
  [/Math\.floor\([^)]*\*\s*4\s*\)/, 'walk phase (EMBER.Grid.walkPhase)'],
  [/\.sort\(function \(a, b\) \{ return a\.wy - b\.wy/, 'depth sort (EMBER.Tilemap.depthSort)']
];
consumers.forEach((rel) => {
  const code = stripComments(fs.readFileSync(J(rel), 'utf8'));
  OWNED.forEach(([re, what]) => assert.ok(!re.test(code), `${rel} carries a private copy of ${what}`));
});
ok(`${consumers.length} consumer files carry no private copy of an engine formula`);

/* The pages people actually open load the engine, and load it first. */
[['index.html', 'js/engine.js'], ['living-town/index.html', 'js/lt-view.js']].forEach(([host, consumer]) => {
  const html = fs.readFileSync(J(host), 'utf8');
  const at = html.indexOf(consumer);
  assert.ok(at > 0, `${host} loads ${consumer}`);
  ['ember-math.js', 'ember-grid.js', 'ember-camera.js', 'ember-tilemap.js', 'ember-viewport.js'].forEach((f) => {
    const e = html.indexOf('engine/' + f);
    assert.ok(e > 0 && e < at, `${host} must load engine/${f} before ${consumer}`);
  });
});
ok('both production pages load all five engine files ahead of their consumer');

/* Outputs, not just calls: the values both experiences depend on. */
const E = global.EMBER;
assert.deepEqual([0, 0.24, 0.25, 0.5, 0.99, 1].map(E.Grid.walkPhase), [0, 0, 1, 2, 3, 3]);
assert.equal(E.Camera.clampAxis(500, 320, 256), 64);      // clamped to the far edge
assert.equal(E.Camera.clampAxis(-40, 320, 256), 0);
assert.equal(E.Camera.clampAxis(0, 160, 256), -48);       // smaller world is centred
assert.equal(E.Math.smoothstep(0.5), 0.5);
assert.ok(Math.abs(E.Math.approach(0, 10, 1000, 0) - 0) < 1e-9 && E.Math.approach(0, 10, 1e6, 1) > 9.999);
assert.deepEqual(E.Tilemap.depthSort([{ wy: 3 }, { wy: 1 }, { wy: 2 }]).map((e) => e.wy), [1, 2, 3]);
assert.deepEqual(E.Grid.vector('up'), E.Grid.vector(E.Grid.opposite('down')));
ok('engine outputs match the values both experiences rely on');

console.log(`\nEMBER-SHARED-PASS — ${checks} checks`);
