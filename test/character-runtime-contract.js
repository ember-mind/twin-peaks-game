/* Production bitmap-character runtime contract.
 * Run with: node test/character-runtime-contract.js
 */
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file));
const index = read('index.html').toString('utf8');
const main = read('js/main.js').toString('utf8');
const authored = read('js/retro-authored.js').toString('utf8');
const charsSource = read('js/chars.js').toString('utf8');
const manifest = JSON.parse(read('assets/sprites/cast-manifest.json'));
const atlas = read('assets/sprites/cast-walkcycles-16.png');
const atlasVersion = 'cast-' + crypto.createHash('sha256').update(atlas).digest('hex').slice(0, 12);

const context = { GAME: {} };
vm.runInNewContext(charsSource, context);
const runtimeCast = Object.keys(context.GAME.sprites.CHARS);
const manifestCast = manifest.characters.map((character) => character.key);

assert(!/three\.min\.js|render3d\.js/.test(index), 'production must not load legacy 3D renderer');
assert(/js\/retro\.js/.test(index) && /js\/retro-authored\.js/.test(index), 'production bitmap renderer missing');
assert(/GAME\.Engine\.init\(cv, null\)/.test(main), 'production must boot without WebGL');
assert.equal(atlas.toString('ascii', 1, 4), 'PNG', 'cast atlas must be PNG');
assert.equal(atlas.readUInt32BE(16), 240, 'cast atlas width');
assert.equal(atlas.readUInt32BE(20), 240, 'cast atlas height');
assert.equal(manifestCast.length, 24, 'complete moving cast');
assert.deepEqual(manifestCast, runtimeCast, 'manifest and runtime cast must match');
assert(authored.includes(`cast-walkcycles-16.png?v=${atlasVersion}`), 'atlas cache version must match bytes');
assert(index.includes(`retro-authored.js?v=${atlasVersion}-r98`), 'renderer cache version must match atlas and visual revision');
assert(/drawCastWalkSheet\(ctx, name/.test(authored), 'runtime must draw generated cast sheet');
assert(/CAST_SHEET_ORDER\.indexOf\(name\)/.test(authored), 'runtime must resolve cast atlas block');
assert(/rows: \['down', 'up', 'right'\]/.test(authored), 'direction rows contract');
assert(/columns: \['idle', 'stepA', 'stepB'\]/.test(authored), 'walk animation columns contract');
assert(/ctx\.scale\(-1, 1\)/.test(authored), 'left direction must mirror right');
assert(/setRuntimeActorScale/.test(authored), 'desktop actor scale hook missing');

console.log('CHARACTER-RUNTIME-PASS — retro 2D, 24 actors, 4 directions, 3-frame walk cycles');
