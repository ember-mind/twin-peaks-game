/* Production bitmap-character runtime contract.
 * Run with: node test/character-runtime-contract.js
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file));
const index = read('index.html').toString('utf8');
const main = read('js/main.js').toString('utf8');
const authored = read('js/retro-authored.js').toString('utf8');
const engine = read('js/engine.js').toString('utf8');
const charsSource = read('js/chars.js').toString('utf8');
const matricesA = read('js/retro-cast-matrices-a.js').toString('utf8');
const matricesB = read('js/retro-cast-matrices-b.js').toString('utf8');
const manifest = JSON.parse(read('assets/sprites/cast-manifest.json'));
const atlas = read('assets/sprites/cast-walkcycles-16.png');

const context = { GAME: {} };
vm.runInNewContext(charsSource, context);
vm.runInNewContext(matricesA, context);
vm.runInNewContext(matricesB, context);
const runtimeCast = Object.keys(context.GAME.sprites.CHARS);
const authoredCast = Object.keys(context.GAME.RetroCastMatrices);
const manifestCast = manifest.characters.map((character) => character.key);

assert(!/three\.min\.js|render3d\.js/.test(index), 'production must not load legacy 3D renderer');
assert(/js\/retro\.js/.test(index) && /js\/retro-authored\.js/.test(index), 'production bitmap renderer missing');
assert(/GAME\.Engine\.init\(cv, null\)/.test(main), 'production must boot without WebGL');
assert.equal(atlas.toString('ascii', 1, 4), 'PNG', 'cast atlas must be PNG');
assert.equal(atlas.readUInt32BE(16), 240, 'cast atlas width');
assert.equal(atlas.readUInt32BE(20), 240, 'cast atlas height');
assert.equal(manifestCast.length, 24, 'complete moving cast');
assert.deepEqual(manifestCast, runtimeCast, 'manifest and runtime cast must match');
assert.deepEqual(authoredCast, runtimeCast, 'every production actor requires explicit matrices');
for (const name of authoredCast) for (const view of ['down', 'up', 'side']) for (const pose of ['idle', 'step']) {
  const rows = context.GAME.RetroCastMatrices[name][view][pose];
  assert.equal(rows.length, 16, `${name}/${view}/${pose} row count`);
  assert(rows.every((row) => row.length === 16 && !/[^.osc]/.test(row)), `${name}/${view}/${pose} authored tokens`);
}
assert(index.includes('retro-cast-matrices-a.js?v=r102e') && index.includes('retro-cast-matrices-b.js?v=r102e'), 'authored matrix files missing');
assert(index.includes('retro-authored.js?v=r102e-authoredcast'), 'native cast renderer cache version');
assert(/var CAST_RENDERER = 'native-authored-r102e'/.test(authored), 'production renderer id');
assert(!/if \(drawCastWalkSheet\(ctx, name/.test(authored), 'legacy downsampled atlas must not override production');
assert(/missing authored cast matrix/.test(authored), 'production cast must not fall back to procedural mannequin');
assert(/opaqueTones: 3/.test(authored), 'Gen II three-tone OBJ contract');
assert(/sourceAtlas: false/.test(authored), 'production must not depend on async cast image');
assert(/kind: 'explicit-authored-matrices'/.test(authored) && /productionFallback: false/.test(authored), 'production cast must use final matrices only');
assert(/var flip = dir === 'left'/.test(authored), 'left direction must mirror right');
assert(/walkPhase\(p\.moveT\)/.test(engine), 'player tile traversal must use behavioral walk phase');
assert(/walkPhase\(n\.moveT\)/.test(engine), 'NPC tile traversal must use behavioral walk phase');
assert(/phase === 1 \|\| phase === 3/.test(authored), 'renderer must alternate contact and step phases');
assert(/phase === 3/.test(authored), 'renderer must mirror the second front/back step');
assert(/setRuntimeActorScale/.test(authored), 'desktop actor scale hook missing');

console.log('CHARACTER-RUNTIME-PASS — explicit authored 16px matrices, 24 actors, 3 opaque tones');
