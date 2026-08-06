#!/usr/bin/env node
'use strict';
const assert = require('node:assert');
global.GAME = {};
const GoldTone = require('../js/gold-tone.js');
const original = new Uint8ClampedArray([
  208,160,176,255, 168,208,104,255, 228,214,161,255,
  32,40,32,255, 104,152,72,255, 88,72,88,255,
  63,86,112,255, 138,120,168,255, 184,102,92,255
]);
let stored = null;
const ctx = {
  getImageData() { return { data: new Uint8ClampedArray(original) }; },
  putImageData(img) { stored = img.data; }
};
assert.strictEqual(GoldTone.apply(ctx, 3, 3, 'town'), true);
assert(stored, 'quantized pixels not committed');
const approved = new Set(GoldTone.palette.map(hex => hex.toLowerCase()));
function hexAt(data, i) { return '#' + [data[i],data[i+1],data[i+2]].map(v => v.toString(16).padStart(2,'0')).join(''); }
for (let i = 0; i < stored.length; i += 4) assert(approved.has(hexAt(stored, i)), 'pixel outside master palette');
assert(['#3f5368','#8095aa'].includes(hexAt(stored, 24)), 'blue material ramp lost');
assert(['#554c70','#9184a8'].includes(hexAt(stored, 28)), 'purple material ramp lost');
assert(['#70404f','#b8665c','#d69874'].includes(hexAt(stored, 32)), 'warm material ramp lost');
stored = null;
assert.strictEqual(GoldTone.apply(ctx, 3, 3, 'woods'), false);
assert.strictEqual(stored, null, 'night scene must retain authored palette');
assert.strictEqual(GoldTone.apply(ctx, 3, 3, 'sheriff'), false);
assert.strictEqual(stored, null, 'interior must retain authored palette');
console.log('GOLD-TONE-PASS 8/8');
