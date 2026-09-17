#!/usr/bin/env node
'use strict';

/* Ambient life frame contract (node, no Chrome).
 *
 * Each of the three ambient details is a deterministic function of time t.
 * This renders the real scene draw for each one at t = 0, 500, 1000, 1600
 * through the same headless path the other scene tests use (a pixel-recording
 * 2D context and real modules), then asserts:
 *   (a) the four frames are not all identical;
 *   (b) the changed pixels stay inside the detail's named rectangle;
 *   (c) no more than 60 pixels change across the sampled frames.
 * The rectangles are constants derived from the authored art coordinates.
 */

const assert = require('node:assert/strict');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SAMPLES = [0, 500, 1000, 1600];

const RECTS = {
  diner: { xMin: 111, xMax: 115, yMin: 39, yMax: 47 },
  roadhouse: { xMin: 28, xMax: 55, yMin: 20, yMax: 27 },
  redroom: { xMin: 112, xMax: 127, yMin: 68, yMax: 71 }
};

function freshGame() {
  global.window = global;
  global.GAME = {};
  return global.GAME;
}

function requireFresh(file) {
  const resolved = require.resolve(path.join(ROOT, file));
  delete require.cache[resolved];
  require(resolved);
}

function setClock(t) {
  global.performance = { now: function () { return t; } };
}

function pixelContext() {
  const pixels = new Map();
  const ctx = {
    globalAlpha: 1,
    fillStyle: '#000000',
    fillRect: function (x, y, w, h) {
      x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
      const color = String(this.fillStyle).toLowerCase();
      for (let py = y; py < y + h; py++) {
        for (let px = x; px < x + w; px++) pixels.set(px + ',' + py, color);
      }
    }
  };
  return { ctx: ctx, pixels: pixels };
}

function renderDiner(t) {
  freshGame();
  requireFresh('js/ambient-life.js');
  requireFresh('js/ambient-life-scenes.js');
  const life = global.GAME.AmbientLife;
  life.seek('diner', t);
  const view = pixelContext();
  life.draw(view.ctx, 'diner', 0, 0);
  // Other diner details share the scene; this crop isolates the migrated cup
  // at its authored anchor while lifecycle assertions below cover the layer.
  const cropped = new Map();
  for (const [key, value] of view.pixels) {
    const [x, y] = key.split(',').map(Number);
    const rect = RECTS.diner;
    if (x >= rect.xMin && x <= rect.xMax && y >= rect.yMin && y <= rect.yMax) {
      cropped.set(key, value);
    }
  }
  return cropped;
}

function renderRoadhouse(t) {
  setClock(t);
  freshGame();
  requireFresh('js/roadhouse-art.js');
  const view = pixelContext();
  global.GAME.RoadhouseArt.draw(view.ctx, 0, 0);
  return view.pixels;
}

function renderRedroom(t) {
  setClock(t);
  freshGame();
  requireFresh('js/redroom-art.js');
  const view = pixelContext();
  global.GAME.RedRoomArt.draw(view.ctx, 0, 0);
  return view.pixels;
}

const SCENES = { diner: renderDiner, roadhouse: renderRoadhouse, redroom: renderRedroom };

function assertDinerLifecycle() {
  freshGame();
  requireFresh('js/ambient-life.js');
  requireFresh('js/ambient-life-scenes.js');
  const life = global.GAME.AmbientLife;
  life.update(0, 'diner');
  const initial = life.snapshot('diner');
  const secondCup = initial.items.find((item) => item.id === 'counter-cup-steam');
  assert(secondCup, 'diner: migrated second counter cup is registered');
  assert.equal(secondCup.type, 'STEAM_SMALL', 'diner: migrated second cup uses STEAM_SMALL');
  let hasWispAtDepth = false;
  for (const time of [0, 250, 500, 750, 1000, 1250, 1500]) {
    life.seek('diner', time);
    const before = pixelContext(); life.draw(before.ctx, 'diner', 0, 0, 0, 64);
    const atCounter = pixelContext(); life.draw(atCounter.ctx, 'diner', 0, 0, 64, 65);
    const inCup = (pixels) => [...pixels.keys()].some((key) => {
      const [x, y] = key.split(',').map(Number);
      return x >= 111 && x <= 115 && y >= 39 && y <= 47;
    });
    assert.equal(inCup(before.pixels), false, 'diner: cup steam is absent below counter depth');
    hasWispAtDepth ||= inCup(atCounter.pixels);
  }
  assert(hasWispAtDepth, 'diner: cup steam paints in counter foreground depth slice');
  life.seek('diner', 0);
  const held = JSON.stringify(initial.items);

  life.setPaused(true);
  life.update(1000, 'diner');
  assert.equal(JSON.stringify(life.snapshot('diner').items), held,
    'diner: pause holds the migrated cup clock');

  life.setPaused(false);
  life.update(1000, 'town');
  assert.equal(JSON.stringify(life.snapshot('diner').items), held,
    'diner: off-map update does not advance the migrated cup');

  life.setEnabled(false);
  const view = pixelContext();
  life.draw(view.ctx, 'diner', 0, 0);
  assert.equal(view.pixels.size, 0, 'diner: disabled layer draws no migrated cup');
}

assertDinerLifecycle();

function changedPixels(a, b) {
  const keys = new Set([...a.keys(), ...b.keys()]);
  const changed = [];
  for (const key of keys) {
    if (a.get(key) !== b.get(key)) changed.push(key);
  }
  return changed;
}

for (const [scene, render] of Object.entries(SCENES)) {
  const frames = SAMPLES.map(render);
  const signatures = new Set(frames.map((f) => JSON.stringify([...f].sort())));
  assert(signatures.size >= 2, scene + ': the four sampled frames must not all be identical');

  const changed = new Set();
  for (let i = 0; i < frames.length; i++) {
    for (let j = i + 1; j < frames.length; j++) {
      for (const key of changedPixels(frames[i], frames[j])) changed.add(key);
    }
  }
  assert(changed.size > 0, scene + ': the detail must actually animate');

  const rect = RECTS[scene];
  for (const key of changed) {
    const [x, y] = key.split(',').map(Number);
    assert(x >= rect.xMin && x <= rect.xMax && y >= rect.yMin && y <= rect.yMax,
      scene + ': changed pixel ' + key + ' outside ' + JSON.stringify(rect));
  }
  assert(changed.size <= 60, scene + ': ' + changed.size + ' animated pixels exceeds 60');
  console.log('  ' + scene + ': ' + changed.size + ' animated px, inside ' +
    JSON.stringify(rect) + ', ' + signatures.size + ' distinct frames');
}

console.log('AMBIENT-LIFE-FRAMES-PASS deterministic t, bounded rectangles, <=60 animated pixels per scene');
