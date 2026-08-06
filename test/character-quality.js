/* Character roster quality contract.
 * Esegui con: node test/character-quality.js
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

global.window = global;
require(path.join(__dirname, '..', 'js', 'chars.js'));

const chars = global.GAME.sprites.CHARS;
const names = Object.keys(chars);
assert(names.length >= 24, 'roster must cover complete named cast');

for (const name of names) {
  const spec = chars[name];
  assert(spec.eyes, `${name}: authored eye color missing`);
  assert(spec.hairStyle, `${name}: hair silhouette missing`);
  assert(spec.build >= 0.85 && spec.build <= 1.2, `${name}: build outside audited range`);
  assert(spec.height >= 0.9 && spec.height <= 1.2, `${name}: height outside audited range`);
}

assert(new Set(names.map((name) => chars[name].hairStyle)).size >= 7,
  'roster needs at least seven hair silhouettes');
assert(new Set(names.map((name) => chars[name].build)).size >= 8,
  'roster needs real body-shape variation');
assert(names.some((name) => chars[name].dress), 'dress silhouette missing');
assert(names.some((name) => chars[name].hat), 'hat silhouette missing');
assert(names.some((name) => chars[name].glasses), 'glasses silhouette missing');
assert(names.some((name) => chars[name].log), 'hero prop silhouette missing');

const renderer = fs.readFileSync(path.join(__dirname, '..', 'js', 'render3d.js'), 'utf8');
for (const token of [
  'hairLobe:', 'torso:', 'joint:', 'shoe:',
  'leftLeg.knee.rotation.x', 'upperBody.rotation.y',
  'targetDialogueOrbitX', 'authored-character-'
]) {
  assert(renderer.includes(token), `3D character contract missing: ${token}`);
}

console.log(`ok - ${names.length} character profiles, articulated rig, dialogue two-shot`);
