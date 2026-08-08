#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const png = fs.readFileSync(path.join(root, 'assets', 'sprites', 'cooper-walkcycle-16.png'));
const cast = fs.readFileSync(path.join(root, 'assets', 'sprites', 'cast-walkcycles-16.png'));
const authored = fs.readFileSync(path.join(root, 'js', 'retro-authored.js'), 'utf8');

assert.strictEqual(png.toString('ascii', 1, 4), 'PNG', 'valid PNG signature');
assert.strictEqual(png.readUInt32BE(16), 48, 'three 16px columns');
assert.strictEqual(png.readUInt32BE(20), 48, 'three 16px rows');
assert.strictEqual(cast.readUInt32BE(16), 240, 'five 48px cast columns');
assert.strictEqual(cast.readUInt32BE(20), 240, 'five 48px cast rows');
assert(/rows: \['down', 'up', 'right'\]/.test(authored), 'direction rows declared');
assert(/columns: \['idle', 'stepA', 'stepB'\]/.test(authored), 'animation columns declared');
assert(/ctx\.scale\(-1, 1\)/.test(authored), 'left direction mirrors right');
assert(/castWalkSheet\.complete/.test(authored), 'procedural fallback remains until cast image loads');

console.log('COOPER-SPRITE-PASS 9/9');
