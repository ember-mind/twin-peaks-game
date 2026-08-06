#!/usr/bin/env node
'use strict';
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const ctx = { fillStyle: '', rects: [], fillRect(x, y, w, h) { this.rects.push([x, y, w, h, this.fillStyle]); } };
const sandbox = { globalThis: {}, module: { exports: {} } };
sandbox.globalThis.GAME = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/retro-font.js'), 'utf8'), sandbox);
sandbox.module = { exports: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/portraits.js'), 'utf8'), sandbox);
const P = sandbox.globalThis.GAME.Portraits;
assert(P, 'portrait runtime missing');
assert.strictEqual(P.resolve('COOPER'), 'cooper');
assert.strictEqual(P.resolve('OMBRA DI LAURA'), 'laura');
assert.strictEqual(P.resolve('VOCE'), 'bob');
assert.strictEqual(P.resolve('TACCUINO'), '');
assert(Object.keys(P.faces).length >= 25, 'full speaking cast not covered');
const card = P.drawCard(ctx, '', 'COOPER', 5, 55);
assert.strictEqual(card.key, 'cooper');
assert.strictEqual(card.label, 'COOPER');
assert(card.width >= 40 && card.height === 43, 'card geometry unstable');
assert(ctx.rects.length >= 35, 'portrait lacks authored pixel detail');
assert(ctx.rects.every(r => Number.isInteger(r[0]) && Number.isInteger(r[1])), 'subpixel portrait draw');
assert.deepStrictEqual(Object.values(P.palette).sort(), ['#183225','#31543a','#63834a','#a8be72','#f5efcf'].sort());

/* Copertura reale, non conteggio config: ogni identità parlante dei due
 * dataset deve risolversi. Diario/taccuino sono documenti, non persone. */
sandbox.global = sandbox.globalThis;
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/data.js'), 'utf8'), sandbox);
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/narrative-data.gen.js'), 'utf8'), sandbox);
const names = new Set();
const dialogues = sandbox.globalThis.GAME.Data.dialogues;
Object.values(dialogues).forEach(def => {
  (def.pages || []).concat(def.again && def.again.pages || []).forEach(page => { if (page.name) names.add(page.name); });
});
(function walk(value) {
  if (!value || typeof value !== 'object') return;
  if (typeof value.display_name === 'string' && value.display_name) names.add(value.display_name);
  Object.values(value).forEach(walk);
})(sandbox.globalThis.GAME.NarrativeData.missions);
const documents = new Set(['TACCUINO', 'DIARIO DI LAURA']);
const unresolved = [...names].filter(name => !documents.has(name) && !P.resolve(name));
assert.deepStrictEqual(unresolved, [], 'unresolved speaking identities');
for (const name of names) {
  if (documents.has(name)) continue;
  const full = P.drawCard(ctx, '', name, 5, 55);
  assert(full && full.label.indexOf('...') < 0, 'truncated speaker label: ' + name);
}
const finaleSource = fs.readFileSync(path.join(root, 'js/narrative-finale.js'), 'utf8');
assert(/raw\[i\]\.display_name, chunk\.join/.test(finaleSource), 'finale chunks lose speaker metadata');
assert(!/combined\s*=\s*prefix\s*\+/.test(finaleSource), 'finale burns speaker into body copy');
console.log('PORTRAIT-GOLD-PASS 9/9');
