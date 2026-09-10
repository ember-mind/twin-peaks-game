#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'sprites', 'cast-manifest.json'), 'utf8'));
const charsSource = fs.readFileSync(path.join(root, 'js', 'chars.js'), 'utf8');
const authored = fs.readFileSync(path.join(root, 'js', 'retro-authored.js'), 'utf8');
const castPng = fs.readFileSync(path.join(root, 'assets', 'sprites', 'cast-walkcycles-16.png'));
const castVersion = 'cast-' + crypto.createHash('sha256').update(castPng).digest('hex').slice(0, 12);

const context = { GAME: {} };
vm.runInNewContext(charsSource, context);
const charKeys = Object.keys(context.GAME.sprites.CHARS);
const manifestKeys = manifest.characters.map((entry) => entry.key);
const orderMatch = authored.match(/var CAST_SHEET_ORDER = (\[[\s\S]*?\]);/);
assert(orderMatch, 'runtime cast order declared');
const runtimeOrder = Array.from(vm.runInNewContext(orderMatch[1]));

/* R129 — l'archivio 16 px e' congelato a 24 attori. `assets/sprites/CAST.md`
 * lo dichiara "archivio comparativo, non produzione": la produzione e'
 * l'atlante hg-24 generato da tools/build-cast-authored.js. Il cast di
 * produzione puo' quindi crescere (infermiera e' il 25o) senza un master
 * `cast-16/<key>.png`. Restano vincolati: lo schema del manifest, il fatto
 * che l'archivio sia un PREFISSO esatto del registro runtime (stessi nomi,
 * stesso ordine) e la coerenza fra chars.js e CAST_SHEET_ORDER. */
const ARCHIVE_FROZEN_AT = 24;
assert.equal(manifest.schema, 1, 'manifest schema');
assert.equal(manifestKeys.length, ARCHIVE_FROZEN_AT, 'legacy 16 px archive frozen at 24 characters');
assert.deepEqual(charKeys.slice(0, ARCHIVE_FROZEN_AT), manifestKeys,
  'frozen archive must stay an exact prefix of the runtime character registry');
assert.deepEqual(runtimeOrder, charKeys, 'atlas order matches runtime character registry');
assert.equal(castPng.toString('ascii', 1, 4), 'PNG', 'cast atlas PNG signature');
assert.equal(castPng.readUInt32BE(16), 240, 'cast atlas width');
assert.equal(castPng.readUInt32BE(20), 240, 'cast atlas height');
assert(authored.includes("assets/sprites/cast-walkcycles-hg-24.png?v="), 'production atlas has a cache version');
assert(fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('js/retro-authored.js?v='), 'production loads versioned renderer');

for (const key of manifestKeys) {
  const file = path.join(root, 'assets', 'sprites', 'cast-16', `${key}.png`);
  const png = fs.readFileSync(file);
  assert.equal(png.toString('ascii', 1, 4), 'PNG', `${key}: PNG signature`);
  assert.equal(png.readUInt32BE(16), 48, `${key}: three animation columns`);
  assert.equal(png.readUInt32BE(20), 48, `${key}: three direction rows`);
}

assert(/naturalWidth !== 360/.test(authored), 'runtime validates atlas width');
assert(/naturalHeight !== 360/.test(authored), 'runtime validates atlas height');
assert(/production: true/.test(authored), 'HeartGold atlas is production');
assert(/sourceAtlas: true/.test(authored), 'runtime uses HeartGold source atlas');

console.log('CAST-SPRITE-PASS 36/36 — frozen 16 px archive integrity and HeartGold runtime verified');
