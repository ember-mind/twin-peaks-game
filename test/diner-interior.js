#!/usr/bin/env node
'use strict';

/* test/diner-interior.js — contratto della sala del Double R.
 *
 * Un critico fresco (solo PNG) ha bocciato tre cose: l'insegna DOUBLE R
 * illeggibile a 1x con D e B che collassano nella tavola, il checker
 * grigio-verde freddo e slegato dalla griglia delle panche, e le strisce di
 * quadri a parete piu' le macchine del bancone che a 1x diventano puntini.
 * Questo file blocca le tre correzioni sulle chiamate di disegno reali.
 *
 * Nota: il checker era gia' stato schiarito una volta (2026-09-19) e il
 * cambiamento e' stato revertito perche' il pavimento si slavava. Qui si
 * verifica che la luma resti quella e che a cambiare sia la tinta.
 */

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.resolve(__dirname, '..');
const noop = () => {};

global.window = global;
global.GAME = { Sprites: { CHARS: {}, drawTile: noop }, maps: {} };
global.Image = function Image() {};
global.performance = { now: () => 0 };
global.document = { getElementById: () => null, addEventListener: noop };

require(path.join(ROOT, 'js/tiles.js'));
require(path.join(ROOT, 'js/chars.js'));
require(path.join(ROOT, 'js/houses.js'));
require(path.join(ROOT, 'js/maps.js'));
global.GAME.maps = global.GAME.maps || global.GAME.Maps;
require(path.join(ROOT, 'js/retro-authored.js'));

const source = fs.readFileSync(path.join(ROOT, 'js/retro-authored.js'), 'utf8');

// ------------------------------------------------------------- 1. insegna
const fontBlock = source.slice(source.indexOf('NEON_FONT_4X6'), source.indexOf('function interiorNeon'));
const letters = ['D', 'O', 'U', 'B', 'L', 'E'];
for (const letter of letters) {
  assert.ok(new RegExp('\\b' + letter + ': \\[').test(fontBlock), 'the sign font carries ' + letter);
}
const rows = fontBlock.match(/'[01]{4}'/g) || [];
assert.equal(rows.length, letters.length * 6, 'every glyph is six rows of a four-pixel grid');
/* Ogni coppia di lettere adiacenti deve differire: e' il difetto che il
 * critico ha visto (D e B che collassano). */
function glyphOf(letter) {
  const block = fontBlock.slice(fontBlock.indexOf(letter + ': ['));
  return (block.slice(0, block.indexOf(']')).match(/'[01]{4}'/g) || []).join('');
}
const shapes = letters.map(glyphOf);
assert.equal(new Set(shapes).size, letters.length, 'no two sign glyphs are the same shape');
assert.notEqual(glyphOf('D'), glyphOf('B'), 'D and B are distinct shapes');
/* Il passo di glow +1,+1 riempiva lo spazio di un pixel fra le lettere:
 * l'ombra ora scende dritta. */
const neon = source.slice(source.indexOf('function interiorNeon'), source.indexOf('function interiorPool'));
assert.ok(!/a\[0\]\+1,a\[1\]\+1/.test(neon), 'no diagonal glow pass fills the one-pixel letter gaps');
assert.ok(/Math\.floor\(\(6-row\)\/3\)/.test(neon) === false, 'the glyphs are upright, not sheared');
assert.ok(neon.includes('p.cream'), 'the lettering is cream on the dark board');
assert.ok(neon.includes('p.redHi'), 'the looped R stays the red accent');

// ------------------------------------------------- 2. checker caldo, stessa luma
const kit = global.GAME.Retro2D.interiorKit && global.GAME.Retro2D.interiorKit.materials;
const palette = kit ? kit.diner : null;
assert.ok(palette, 'the diner material kit is exported for inspection');
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const luma = (hex) => { const [r, g, b] = rgb(hex); return 0.299 * r + 0.587 * g + 0.114 * b; };
const warm = (hex) => { const [r, g, b] = rgb(hex); return r > g && r > b; };
for (const key of ['tile', 'tileShade', 'floorLight', 'floorShade']) {
  assert.ok(warm(palette[key]), key + ' ' + palette[key] + ' must be warm: red above green and blue');
}
/* Valori di partenza del build bocciato, per ancorare la luma. */
const BEFORE = { tile: 136.0, tileShade: 128.1, floorLight: 188.1, floorShade: 176.1 };
for (const [key, was] of Object.entries(BEFORE)) {
  const now = luma(palette[key]);
  assert.ok(Math.abs(now - was) <= 8,
    key + ' changes hue, not brightness (' + was.toFixed(1) + ' -> ' + now.toFixed(1) + ')');
}
assert.ok(luma(palette.floorLight) - luma(palette.tile) > 40,
  'the checker keeps a readable light/dark step');
/* La fase del checker e' ancorata alla griglia dei tile della stanza, non al
 * proprio passo da 8px: le panche stanno a y=96 e y=128, fronte a 112 e 144. */
const floorLoop = source.slice(source.indexOf('function drawDinerInterior'), source.indexOf('function drawDinerInterior') + 2200);
assert.ok(/dark=\(\(\(fx-16\)\/8\)\+\(\(fy-16\)\/8\)\)&1/.test(floorLoop.replace(/\s/g, '')),
  'the checker parity is phased on the room tile grid');
assert.ok(floorLoop.includes('fx%16===0') && floorLoop.includes('fy%16===0'),
  'grout marks the 16px room grid so the floor reads as aligned to it');

// --------------------------------------- 3. silhouette a parete e sul bancone
const wall = source.slice(source.indexOf('interiorPicture(g,x+1,y+30'), source.indexOf('interiorPicture(g,x+1,y+30') + 400);
const hung = wall.match(/interiorPicture\(/g) || [];
assert.equal(hung.length, 3, 'three large frames, not a strip of small ones');
const sizes = [...wall.matchAll(/interiorPicture\(g,[^,]+,[^,]+,(\d+),(\d+),/g)]
  .map((m) => Number(m[1]) * Number(m[2]));
assert.ok(sizes.every((area) => area >= 300),
  'every hung frame is at least 300 square pixels, got ' + sizes.join(','));
/* Le lampade a parete stanno a y=68 e y=119: nessun quadro le attraversa. */
const spans = [...wall.matchAll(/interiorPicture\(g,[^,]+,y\+(\d+),(\d+),(\d+),/g)]
  .map((m) => [Number(m[1]), Number(m[1]) + Number(m[3])]);
for (const [top, bottom] of spans) {
  for (const lamp of [68, 119]) {
    assert.ok(bottom <= lamp || top >= lamp + 14,
      'a frame at ' + top + '..' + bottom + ' collides with the wall lamp at ' + lamp);
  }
}
const picture = source.slice(source.indexOf('function interiorPicture'), source.indexOf('function interiorPlant'));
assert.ok(picture.includes('ridge'), 'the landscape frame carries a ridge silhouette');
assert.ok(/R\(g,ix,iy\+sky,iw,1,p\.ink\)/.test(picture), 'the landscape frame carries a horizon line');

const machine = source.slice(source.indexOf('function interiorCoffeeMachine'), source.indexOf('function interiorPieCase'));
assert.ok(/R\(g,x\+1,y,14,12,p\.woodDark\)/.test(machine),
  'the coffee machine has a dark body so it silhouettes against the pale back bar');
assert.ok(machine.includes('y-5,16,21'), 'the coffee machine is one tall mass, not a 16x16 box');
const pies = source.slice(source.indexOf('function interiorPieCase'), source.indexOf('function interiorPieCase') + 1400);
assert.ok(/i\+=14/.test(pies), 'the pie case carries three whole pies per shelf, not five slivers');

// --------------------------------------------- neon ambient follows the glyphs
global.GAME.AmbientLife = undefined;
delete require.cache[require.resolve(path.join(ROOT, 'js/ambient-life.js'))];
delete require.cache[require.resolve(path.join(ROOT, 'js/ambient-life-scenes.js'))];
require(path.join(ROOT, 'js/ambient-life.js'));
require(path.join(ROOT, 'js/ambient-life-scenes.js'));
const life = global.GAME.AmbientLife;
life.seek('diner', 0);
const sign = life.snapshot('diner').items.find((item) => item.id === 'double-r-neon');
assert.ok(sign, 'the sign still has its neon clock');
const defs = global.GAME.AmbientLife.__defs || null;
void defs;
const scenes = fs.readFileSync(path.join(ROOT, 'js/ambient-life-scenes.js'), 'utf8');
const segs = scenes.slice(scenes.indexOf("id:'double-r-neon'"), scenes.indexOf("id:'coffee-machine'"));
assert.ok(segs.includes('{x:6,y:7,w:4,h:6}'),
  'the lettering flicker segment sits on the rebuilt DOUBLE glyphs');
assert.ok(segs.includes('{x:46,y:7,w:7,h:2}') && segs.includes('{x:46,y:13,w:6,h:2}'),
  'the two R flicker segments still sit on the looped R');

console.log('DINER-INTERIOR-PASS legible DOUBLE R glyphs, warm checker at matched luma phased to the ' +
  'room grid, three large wall frames clear of the lamps, dark coffee machine and whole pies, ' +
  'neon segments aligned to the new lettering');
