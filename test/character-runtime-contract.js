/* Production bitmap-character runtime contract (HeartGold 24 px atlas).
 * Run with: node test/character-runtime-contract.js
 *
 * R127 (2026-09-07): rewritten for the hg-24 atlas renderer. The previous
 * version pinned the retired native-authored-r101f 16 px renderer and had
 * been failing since the R103-R126 migration.
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file));
const index = read('index.html').toString('utf8');
const main = read('js/main.js').toString('utf8');
const authored = read('js/retro-authored.js').toString('utf8');
const charsSource = read('js/chars.js').toString('utf8');
const atlas = read('assets/sprites/cast-walkcycles-hg-24.png');

const context = { GAME: {} };
vm.runInNewContext(charsSource, context);
const runtimeCast = Object.keys(context.GAME.sprites.CHARS).sort();

const orderMatch = authored.match(/var CAST_SHEET_ORDER = \[([^\]]+)\]/);
assert(orderMatch, 'CAST_SHEET_ORDER missing');
const sheetOrder = orderMatch[1].match(/'([a-z]+)'/g).map((key) => key.replace(/'/g, ''));

assert(!/three\.min\.js|render3d\.js/.test(index), 'production must not load legacy 3D renderer');
assert(/js\/retro\.js/.test(index) && /js\/retro-authored\.js/.test(index), 'production bitmap renderer missing');
assert(/GAME\.Engine\.init\(cv, null\)/.test(main), 'production must boot without WebGL');
assert.equal(atlas.toString('ascii', 1, 4), 'PNG', 'cast atlas must be PNG');
assert.equal(atlas.readUInt32BE(16), 360, 'cast atlas width');
assert.equal(atlas.readUInt32BE(20), 360, 'cast atlas height');
assert.equal(sheetOrder.length, 25, 'complete moving cast');
assert.equal(sheetOrder[0], 'cooper', 'cooper must own atlas block 0');
assert.deepEqual([...sheetOrder].sort(), runtimeCast, 'atlas order and runtime cast must match');

const sheetFile = authored.match(/var CAST_SHEET_FILE = 'assets\/sprites\/cast-walkcycles-hg-24\.png\?v=([^']+)'/);
assert(sheetFile, 'CAST_SHEET_FILE must point at the hg-24 atlas with a cache tag');
assert(index.includes(`href="assets/sprites/cast-walkcycles-hg-24.png?v=${sheetFile[1]}"`),
  'index preload cache tag must equal CAST_SHEET_FILE tag');
assert(/var CAST_RENDERER = 'heartgold-atlas-r116'/.test(authored), 'production renderer id');
assert(/function drawCastWalkSheet\(ctx, name, x, y, dir, frame, alpha, moving, environment\)/.test(authored), 'atlas draw path missing');
assert(/if \(drawCastWalkSheet\(ctx, name, x, y, dir, frame, alpha, moving, environment\)\) return;/.test(authored),
  'drawChar must render from the atlas before any fallback');
assert(/naturalWidth !== 360 \|\| castWalkSheet\.naturalHeight !== 360/.test(authored), 'atlas size guard missing');
assert(/if \(dir === 'left'\) \{\s*ctx\.translate\(ox \+ 24, 0\);\s*ctx\.scale\(-1, 1\);/.test(authored), 'left direction must mirror right');
assert(/setRuntimeActorScale/.test(authored), 'desktop actor scale hook missing');

const cooper = spawnSync(process.execPath, [path.join(root, 'tools/build-cast-authored.js'), '--check'], {
  cwd: root, encoding: 'utf8'
});
assert.equal(cooper.status, 0, cooper.stderr || cooper.stdout || 'cast sheets or atlas do not match tools/cast-authored-frames.js');

console.log('CHARACTER-RUNTIME-PASS — heartgold-atlas-r116, 25 actors, cast authored R128');
