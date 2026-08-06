/* Frozen rigged-character pack + Three.js r147 runtime contract.
 * Run with: node test/character-runtime-contract.js
 */
'use strict';

const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const glbPath = path.join(root, 'assets', 'models', 'twin-peaks-character-pack-rigged.glb');
const buffer = fs.readFileSync(glbPath);
assert.strictEqual(
  crypto.createHash('sha256').update(buffer).digest('hex'),
  '35fefa35e120557dcc6ab8dabdd93901924d728c91acc0a128d5bf55b2ca1419',
  'character pack must stay on v3.0 adult-proportion Blender build'
);
assert.strictEqual(buffer.toString('ascii', 0, 4), 'glTF', 'asset must be binary glTF');

const jsonLength = buffer.readUInt32LE(12);
const json = JSON.parse(
  buffer.toString('utf8', 20, 20 + jsonLength).replace(/\0+$/, '')
);
const binaryHeader = 20 + jsonLength;
assert.strictEqual(buffer.readUInt32LE(binaryHeader + 4), 0x004e4942, 'GLB BIN chunk missing');
const binaryOffset = binaryHeader + 8;

const expectedRoots = [
  'TP_CHAR_Andy', 'TP_CHAR_Audrey', 'TP_CHAR_BenHorne', 'TP_CHAR_BOB',
  'TP_CHAR_Bobby', 'TP_CHAR_Cooper', 'TP_CHAR_Donna', 'TP_CHAR_Gerard',
  'TP_CHAR_Giant', 'TP_CHAR_Hawk', 'TP_CHAR_Jacoby', 'TP_CHAR_Jacques',
  'TP_CHAR_James', 'TP_CHAR_Laura', 'TP_CHAR_Leland', 'TP_CHAR_LogLady',
  'TP_CHAR_Lucy', 'TP_CHAR_Maddy', 'TP_CHAR_MFAP', 'TP_CHAR_Norma',
  'TP_CHAR_Ronette', 'TP_CHAR_Sarah', 'TP_CHAR_Shelly', 'TP_CHAR_Truman'
];
const expectedClips = [
  'TP_blink_gaze', 'TP_bob_menace', 'TP_cooper_coffee', 'TP_grid_walk',
  'TP_idle', 'TP_inspect', 'TP_laura_spectral', 'TP_mfap_dance',
  'TP_start', 'TP_stop', 'TP_talk_subtle', 'TP_turn180', 'TP_turn90'
];
const scene = json.scenes[json.scene];
assert.strictEqual(scene.extras.tp_version, '3.0.0', 'pack version mismatch');
assert.strictEqual(scene.extras.tp_root_motion, 'zero', 'root-motion policy mismatch');
assert.strictEqual(json.skins.length, 1, 'pack must use one shared source skin');
assert.strictEqual(json.skins[0].joints.length, 42, 'shared rig must contain 42 joints');

const namedNodes = new Map(json.nodes.map((node, index) => [node.name, { node, index }]));
const roots = [...namedNodes.keys()].filter((name) => /^TP_CHAR_(?!PACK$|Rig$)/.test(name)).sort();
assert.deepStrictEqual(roots, expectedRoots.slice().sort(), '24 authored character roots mismatch');
for (const name of expectedRoots) {
  const node = namedNodes.get(name).node;
  assert(Number.isInteger(node.mesh), `${name}: mesh missing`);
  assert.strictEqual(node.skin, 0, `${name}: shared skin missing`);
  assert.strictEqual(node.extras.tp_origin, 'floor_center', `${name}: floor origin contract`);
  assert.strictEqual(node.extras.tp_forward, '-Y', `${name}: facing contract`);
}
assert.deepStrictEqual(
  json.animations.map((animation) => animation.name).sort(),
  expectedClips,
  'thirteen runtime clips mismatch'
);
assert(
  json.materials.some((material) => material.name === 'TP_CHAR_SHARED_Prop'),
  'context-gated character prop material missing'
);

function floatAccessor(index) {
  const accessor = json.accessors[index];
  assert.strictEqual(accessor.componentType, 5126, 'animation accessor must be FLOAT');
  const components = { SCALAR: 1, VEC3: 3, VEC4: 4 }[accessor.type];
  assert(components, `unsupported accessor type ${accessor.type}`);
  const view = json.bufferViews[accessor.bufferView];
  const stride = view.byteStride || components * 4;
  const start = binaryOffset + (view.byteOffset || 0) + (accessor.byteOffset || 0);
  const values = [];
  for (let row = 0; row < accessor.count; row++) {
    for (let component = 0; component < components; component++) {
      values.push(buffer.readFloatLE(start + row * stride + component * 4));
    }
  }
  return values;
}

const rootBone = namedNodes.get('root');
assert(rootBone && json.skins[0].joints.includes(rootBone.index), 'root bone missing from skin');
for (const animation of json.animations) {
  const rootTranslations = animation.channels.filter((channel) =>
    channel.target.node === rootBone.index && channel.target.path === 'translation'
  );
  assert.strictEqual(rootTranslations.length, 1, `${animation.name}: root translation channel`);
  const sampler = animation.samplers[rootTranslations[0].sampler];
  assert(
    floatAccessor(sampler.output).every((value) => Math.abs(value) <= 1e-7),
    `${animation.name}: root motion must remain exactly zero`
  );
}

const renderer = fs.readFileSync(path.join(root, 'js', 'render3d.js'), 'utf8');
for (const token of [
  'twin-peaks-character-pack-rigged.glb',
  'cloneCharacterBoneTree',
  'new THREE.Skeleton(bones, inverses)',
  'new THREE.AnimationMixer(visual)',
  'applyAuthoredCharacterMaterialStyle(gltf.scene)',
  'new THREE.MeshToonMaterial',
  "clipName === 'TP_grid_walk'",
  'AUTHORED_CHARACTER_WORLD_SCALE = 0.76',
  'AUTHORED_CHARACTER_HEIGHT_SCALE = 0.86',
  'AUTHORED_CHARACTER_TILE_PHASE = 1 / 3',
  'AUTHORED_CHARACTER_WALK_PHASE_OFFSET = 0',
  'walkActionWeight(moveT, wasMoving)',
  'restoreRiggedPolishPose(data)',
  'captureRiggedPolishPose(data)',
  "clipName === 'TP_start'",
  "clipName === 'TP_stop'",
  "clipName === 'TP_turn90'",
  "clipName === 'TP_turn180'",
  'AUTHORED_CHARACTER_TURN_180_MS = 380',
  'reconcileWorldNpcActors(cur, S.npcs, false)',
  "part.castShadow = !/(Eye|Metal)/i.test",
  'disposeRuntimeActor'
]) {
  assert(renderer.includes(token), `runtime integration token missing: ${token}`);
}

console.log('ok - v3.0.0, 24 adult-proportion roots, 42 bones, 13 clips, retargeted walk, cel runtime');
