#!/usr/bin/env node
/* activity-poses.js — what this package promises, checked without a browser.
 *
 *   node living-town/content/activity-poses-v01/test/activity-poses.js
 *
 * Structure and purity only. Whether a pose READS as its activity is a
 * question for a pair of eyes on a captured frame, not for this file.
 */
'use strict';
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

global.window = global;
require('../../../js/lt-appearance.js');
require('../activity-poses.table.js');
require('../lt-activity-poses.js');
require('../lt-daylight.js');
const A = global.LT.Appearance;
const AP = global.LT.ActivityPoses;
const D = global.LT.DayLight;
const { art } = require('../tools/pose-frames.js');

const DIR = path.resolve(__dirname, '..');
let checks = 0;
const ok = (what, fn) => { fn(); checks += 1; process.stdout.write('  ok  ' + what + '\n'); };

/* ---- the table ---------------------------------------------------------- */

ok('every needed pose exists', () => {
  ['seated', 'reading', 'work_counter', 'unpacking', 'sleeping', 'talking']
    .forEach((id) => assert(AP.POSES[id], 'missing pose ' + id));
});

ok('no pose id names a person, a character id or an action id', () => {
  /* A pose id is an activity SHAPE. These are the words that would mean this
   * package had started to know things it must not know. */
  const forbidden = /(cooper|truman|lucy|andy|hawk|sarah|leland|norma|shelly|bobby|donna|jacoby|audrey|laura|gerard|giant|maddy|james|jacques|ronette|infermiera|loglady|benhorne|mfap|_shift|char_|npc_)/i;
  AP.POSE_IDS.forEach((id) => assert(!forbidden.test(id), 'pose id looks like an identity: ' + id));
  /* The compiler borrows the generic paper-doll parts and nothing else: the
   * cast table is the one export it must never pull in. */
  const code = ['tools/pose-frames.js', 'tools/build-poses.js', 'lt-activity-poses.js']
    .map((f) => fs.readFileSync(path.join(DIR, f), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''))
    .join('\n');
  assert(!/\bCHARACTERS\b/.test(code), 'the production cast table is referenced');
  assert(/const \{ HEADS, OVERLAYS, pal \}/.test(code), 'the compiler no longer borrows just the parts');
});

ok('the sheet order and the pose table agree', () => {
  assert.strictEqual(AP.ORDER.length, AP.COLUMNS);
  let counted = 0;
  AP.POSE_IDS.forEach((id) => {
    const p = AP.POSES[id];
    counted += p.dirs.length * p.frames;
    p.dirs.forEach((dir) => {
      for (let f = 0; f < p.frames; f++) {
        assert(AP.column(id, dir, f) >= 0, 'no column for ' + id + '/' + dir + '/' + f);
        assert(art(id, dir, f), 'no art for ' + id + '/' + dir + '/' + f);
      }
    });
  });
  assert.strictEqual(counted, AP.ORDER.length, 'the table declares ' + counted + ' frames, the sheet has ' + AP.ORDER.length);
});

ok('left is the mirror of right and never a column of its own', () => {
  AP.ORDER.forEach((row) => assert.notStrictEqual(row[1], 'left'));
  assert.strictEqual(AP.column('seated', 'left', 0), AP.column('seated', 'right', 0));
  assert.strictEqual(AP.column('reading', 'left', 0), -1, 'reading has no profile to mirror');
});

ok('every look and every apron variant compiles for every cell', () => {
  A.ORDER.forEach((sheetId) => {
    assert(AP.rowOf(sheetId) >= 0, 'no sheet row for ' + sheetId);
    const spec = A.spec(sheetId);
    AP.ORDER.forEach(([id, dir, frame]) => {
      assert(art(id, dir, frame).body[spec.body], sheetId + ' has no ' + id + '/' + dir + ' body');
    });
  });
  assert.strictEqual(A.ORDER.length, 12, 'six looks plus six apron variants');
});

ok('draw refuses instead of drawing a hole', () => {
  const g = { drawImage() { throw new Error('drew with no sheet'); } };
  assert.strictEqual(AP.draw(g, 'look_teal_bob', 'flying', 'down', 0, 0, 0), false);
  assert.strictEqual(AP.draw(g, 'look_teal_bob', 'reading', 'right', 0, 0, 0), false);
  assert.strictEqual(AP.draw(g, 'nobody', 'seated', 'down', 0, 0, 0), false);
  assert.strictEqual(AP.draw(g, 'look_teal_bob', 'seated', 'down', 0, 0, 0), false);
  assert.strictEqual(AP.draw(null, 'look_teal_bob', 'seated', 'down', 0, 0, 0), false);
});

ok('a looping pose is a pure function of t', () => {
  const seen = {};
  for (let t = 0; t < 4000; t += 10) {
    const f = AP.frameAt('work_counter', t);
    assert(f >= 0 && f < 3);
    seen[f] = true;
    assert.strictEqual(f, AP.frameAt('work_counter', t));
  }
  assert.strictEqual(Object.keys(seen).length, 3, 'all three frames are reachable');
  assert.strictEqual(AP.frameAt('seated', 999999), 0, 'a still pose never animates');
});

ok('the committed sheet is on disk and is the size the runtime expects', () => {
  const png = fs.readFileSync(path.join(DIR, 'assets', 'activity-poses-v01.png'));
  assert.strictEqual(png.readUInt32BE(16), 336);
  assert.strictEqual(png.readUInt32BE(20), 336);
  const index = JSON.parse(fs.readFileSync(path.join(DIR, 'assets', 'activity-poses-v01.frames.json'), 'utf8'));
  assert.strictEqual(index.frames.length, AP.ORDER.length);
  assert.strictEqual(index.rows.length, A.ORDER.length);
  index.frames.forEach((f, i) => {
    assert.deepStrictEqual([f.poseId, f.dir, f.frame], AP.ORDER[i], 'sheet column ' + i + ' is not what the table says');
  });
});

/* ---- the light ---------------------------------------------------------- */

const channels = (light) => [
  ...[light.glass, light.glassHi, light.ambient.color, light.warm.color]
    .flatMap((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))),
  light.ambient.alpha * 255, light.warm.alpha * 255, light.lampStrength * 255
];

ok('at() is pure and total', () => {
  const a = D.at(13 * 60), b = D.at(13 * 60);
  assert.deepStrictEqual(a, b);
  assert.notStrictEqual(a, b, 'a fresh object every call, never a shared one');
  assert.deepStrictEqual(D.at(-60), D.at(1380), 'minutes wrap backwards');
  assert.deepStrictEqual(D.at(1440 + 90), D.at(90), 'minutes wrap forwards');
  assert.deepStrictEqual(D.at('not a minute'), D.at(0));
});

ok('no adjacent minute of the day jumps', () => {
  let worst = 0, at = 0;
  for (let m = 0; m < 1440; m++) {
    const a = channels(D.at(m)), b = channels(D.at((m + 1) % 1440));
    for (let i = 0; i < a.length; i++) {
      const d = Math.abs(a[i] - b[i]);
      if (d > worst) { worst = d; at = m; }
    }
  }
  assert(worst <= 3, 'worst one-minute step is ' + worst.toFixed(2) + ' of 255, at minute ' + at);
  process.stdout.write('      worst one-minute step: ' + worst.toFixed(2) + '/255\n');
});

ok('midnight is continuous with the minute before it', () => {
  const a = channels(D.at(1439)), b = channels(D.at(0));
  a.forEach((v, i) => assert(Math.abs(v - b[i]) <= 3, 'midnight jumps on channel ' + i));
});

ok('the four hours of the day are plainly different', () => {
  const lit = { '07:00': D.at(420), '13:00': D.at(780), '18:30': D.at(1110), '23:00': D.at(1380) };
  const names = Object.keys(lit);
  names.forEach((a, i) => names.slice(i + 1).forEach((b) => {
    const x = channels(lit[a]), y = channels(lit[b]);
    const far = x.reduce((n, v, k) => Math.max(n, Math.abs(v - y[k])), 0);
    assert(far > 24, a + ' and ' + b + ' differ by only ' + far.toFixed(1) + '/255');
  }));
  assert.strictEqual(lit['13:00'].lamps, false, 'lamps are off at one in the afternoon');
  assert.strictEqual(lit['23:00'].lamps, true, 'lamps are on at eleven at night');
  assert(lit['13:00'].ambient.alpha < 0.02, 'the middle of the day barely tints the room');
  assert.strictEqual(D.at(720).ambient.alpha, 0, 'true noon does not tint the room at all');
  assert(lit['23:00'].ambient.alpha > lit['18:30'].ambient.alpha, 'night is darker than dusk');
});

ok('night is darker and cooler than noon, dusk is warmer', () => {
  const noon = D.at(780), night = D.at(1380), dusk = D.at(1110), dawn = D.at(420);
  const value = (h) => [1, 3, 5].reduce((n, i) => n + parseInt(h.slice(i, i + 2), 16), 0) / 3;
  assert(value(night.glass) < value(noon.glass) - 60, 'night glass is much darker than noon glass');
  const warmth = (h) => parseInt(h.slice(1, 3), 16) - parseInt(h.slice(5, 7), 16);
  assert(warmth(dusk.glass) > warmth(noon.glass) + 40, 'dusk glass is much warmer than noon glass');
  assert(warmth(dawn.glass) > warmth(noon.glass) + 20, 'dawn glass is warmer than noon glass');
  assert(warmth(night.glass) < 0, 'night glass is cool');
});

ok('apply is two whole-pixel fills and touches nothing else', () => {
  const calls = [];
  const g = {
    globalCompositeOperation: 'source-over', globalAlpha: 1, fillStyle: '', imageSmoothingEnabled: true,
    fillRect(x, y, w, h) { calls.push({ op: this.globalCompositeOperation, a: this.globalAlpha, rect: [x, y, w, h] }); },
    filter: 'none', drawImage() { throw new Error('apply resampled something'); }
  };
  assert.strictEqual(D.apply(g, D.at(1380), { width: 256, height: 192 }), true);
  assert.strictEqual(calls.length, 2);
  calls.forEach((c) => {
    assert.deepStrictEqual(c.rect, [0, 0, 256, 192]);
    c.rect.forEach((n) => assert.strictEqual(n, Math.round(n), 'a fractional rectangle'));
  });
  assert.strictEqual(calls[0].op, 'multiply');
  assert.strictEqual(calls[1].op, 'lighter');
  assert.strictEqual(g.globalCompositeOperation, 'source-over', 'the context was left as it was found');
  assert.strictEqual(g.globalAlpha, 1);
  assert.strictEqual(g.filter, 'none', 'no canvas filter was ever set');
  calls.length = 0;
  D.apply(g, D.at(720), {});
  assert.strictEqual(calls.length, 0, 'noon paints nothing at all');
});

ok('material() only swaps the two glass values', () => {
  const room = { ink: '#25282b', glass: '#9ec3cf', glassHi: '#d2e6e2', wood: '#8a6a48' };
  const out = D.material(room, D.at(1380));
  assert.notStrictEqual(out, room, 'the room palette is not written to');
  assert.strictEqual(out.ink, room.ink);
  assert.strictEqual(out.wood, room.wood);
  assert.notStrictEqual(out.glass, room.glass);
  assert.strictEqual(room.glass, '#9ec3cf');
});

ok('neither module reads or writes a simulation', () => {
  const source = fs.readFileSync(path.join(DIR, 'lt-activity-poses.js'), 'utf8') +
                 fs.readFileSync(path.join(DIR, 'lt-daylight.js'), 'utf8');
  [/LT\.Sim/, /\.sim\b/, /state\.characters/, /\bDate\.now\b/, /localStorage/, /LT\.World/, /LT\.Actions/]
    .forEach((re) => assert(!re.test(source), 'projection reaches into the simulation: ' + re));
});

process.stdout.write(JSON.stringify({ status: 'pass', checks }) + '\n');
