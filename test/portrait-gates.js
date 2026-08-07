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
assert(card.width >= 40 && card.height === 47, 'card geometry unstable');
assert(ctx.rects.length >= 35, 'portrait lacks authored pixel detail');
assert(ctx.rects.every(r => Number.isInteger(r[0]) && Number.isInteger(r[1])), 'subpixel portrait draw');
assert.deepStrictEqual(Object.values(P.palette).sort(), ['#072619','#34572d','#6a8a43','#9aab69','#eee6b5'].sort());

/* Cooper usa davvero asset generato e indicizzato: 32x33, cinque toni,
 * nessun resize o drawImage asincrono nel frame di dialogo. */
const portraitSource = fs.readFileSync(path.join(root, 'js/portraits.js'), 'utf8');
const artBlock = /var COOPER_ART = \[([\s\S]*?)\n  \];/.exec(portraitSource);
assert(artBlock, 'generated Cooper portrait matrix missing');
const artRows = [...artBlock[1].matchAll(/'([.oO*#]+)'/g)].map(m => m[1]);
assert.strictEqual(artRows.length, 33, 'Cooper portrait must be 33 rows');
assert(artRows.every(row => row.length === 32), 'Cooper portrait rows must be 32 px');
assert(fs.existsSync(path.join(root, 'assets/portraits/cooper-speaker-r1.png')), 'source portrait asset missing');
const hiresDir = path.join(root, 'assets', 'portraits', 'hires');
const hiresFiles = fs.readdirSync(hiresDir).filter(file => file.endsWith('.png')).sort();
assert.deepStrictEqual(hiresFiles, Object.keys(P.faces).sort().map(key => key + '.png'), 'hi-res cast does not match portrait resolver');
for (const file of hiresFiles) {
  const png = fs.readFileSync(path.join(hiresDir, file));
  assert.strictEqual(png.readUInt32BE(16), 256, file + ' width must be 256');
  assert.strictEqual(png.readUInt32BE(20), 264, file + ' height must be 264');
}
const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const engineSource = fs.readFileSync(path.join(root, 'js/engine.js'), 'utf8');
assert(/id="speaker-portrait-hires"[\s\S]*assets\/portraits\/hires\/cooper\.png/.test(indexSource), 'hi-res portrait not mounted in stage');
assert(/left: 8\.125%;[\s\S]*top: 42\.361111%;[\s\S]*width: 20%;[\s\S]*height: 22\.916667%/.test(indexSource), 'hi-res portrait not aligned to native portrait well');
assert(/GAME\.Portraits\.faces\[key\]/.test(engineSource), 'hi-res portrait visibility not cast-scoped');
assert(/assetRoot \+ nextKey \+ '\.png'/.test(engineSource), 'hi-res portrait source not switched with speaker');
const progressSource = fs.readFileSync(path.join(root, 'portrait-progress.html'), 'utf8');
assert(/STATO ATTUALE · CANVAS 32×33/.test(progressSource), 'comparison page lacks current-state column');
assert(/PROGRESSO · IMAGEGEN 256×264/.test(progressSource), 'comparison page lacks progress column');
assert.strictEqual([...progressSource.matchAll(/\['[a-z]+'\s*,\s*'[^']+'\]/g)].length, 25, 'comparison page must show full cast');

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
console.log('PORTRAIT-CAST-PASS 25/25');
