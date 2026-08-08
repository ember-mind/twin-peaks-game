#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'sprites', 'cast-manifest.json'), 'utf8'));
const charsSource = fs.readFileSync(path.join(root, 'js', 'chars.js'), 'utf8');
const authored = fs.readFileSync(path.join(root, 'js', 'retro-authored.js'), 'utf8');
const castPng = fs.readFileSync(path.join(root, 'assets', 'sprites', 'cast-walkcycles-16.png'));

const context = { GAME: {} };
vm.runInNewContext(charsSource, context);
const charKeys = Object.keys(context.GAME.sprites.CHARS);
const manifestKeys = manifest.characters.map((entry) => entry.key);
const orderMatch = authored.match(/var CAST_SHEET_ORDER = (\[[\s\S]*?\]);/);
assert(orderMatch, 'runtime cast order declared');
const runtimeOrder = Array.from(vm.runInNewContext(orderMatch[1]));

assert.equal(manifest.schema, 1, 'manifest schema');
assert.equal(manifestKeys.length, 24, 'all 24 moving characters in manifest');
assert.deepEqual(manifestKeys, charKeys, 'manifest matches runtime character registry');
assert.deepEqual(runtimeOrder, manifestKeys, 'atlas order matches manifest');
assert.equal(castPng.toString('ascii', 1, 4), 'PNG', 'cast atlas PNG signature');
assert.equal(castPng.readUInt32BE(16), 240, 'cast atlas width');
assert.equal(castPng.readUInt32BE(20), 240, 'cast atlas height');

for (const key of manifestKeys) {
  const file = path.join(root, 'assets', 'sprites', 'cast-16', `${key}.png`);
  const png = fs.readFileSync(file);
  assert.equal(png.toString('ascii', 1, 4), 'PNG', `${key}: PNG signature`);
  assert.equal(png.readUInt32BE(16), 48, `${key}: three animation columns`);
  assert.equal(png.readUInt32BE(20), 48, `${key}: three direction rows`);
}

assert(/naturalWidth !== 240/.test(authored), 'runtime validates atlas width');
assert(/naturalHeight !== 240/.test(authored), 'runtime validates atlas height');
assert(/drawCastWalkSheet\(ctx, name/.test(authored), 'runtime uses generated art for every known character');
assert(/CAST_SHEET_ORDER\.indexOf\(name\)/.test(authored), 'runtime resolves character block');

console.log('CAST-SPRITE-PASS 34/34');
