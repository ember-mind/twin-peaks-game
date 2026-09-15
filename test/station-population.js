#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const mapId = 'sheriff';
const actorIds = ['truman', 'lucy', 'andy'];
const noop = () => {};

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath));
}

function sha256(relativePath) {
  return crypto.createHash('sha256').update(read(relativePath)).digest('hex');
}

function normalized(value) {
  return JSON.parse(JSON.stringify(value));
}

function capturedProfiles(relativePath) {
  const registrations = [];
  const context = vm.createContext({
    window: {
      GAME: {
        CharacterActivity: {
          registerActors(registeredMapId, profiles) {
            registrations.push({ mapId: registeredMapId, profiles: normalized(profiles) });
          }
        }
      }
    }
  });
  vm.runInContext(read(relativePath).toString('utf8'), context, { filename: relativePath });
  assert.equal(registrations.length, 1, relativePath + ' registers exactly once');
  return registrations[0];
}

/* Il congelamento resta sugli asset (atlas + manifest) e sul motore di
 * Character Life: i file di scena/registrazione cambiano legittimamente con
 * la migrazione del distretto sulla mappa canonica 'sheriff'. */
/* R129: 25-actor atlas (infermiera) */
const frozen = JSON.parse(read('artifacts/station-population-v01/validation/frozen-before.json'));
for (const relativePath of [
  'js/character-activity.js',
  'js/ambient-life.js',
  'assets/sprites/cast-walkcycles-hg-24.png',
  'assets/sprites/character-life-v01.png',
  'assets/sprites/character-life-v01.manifest.json'
]) {
  assert.equal(sha256(relativePath), frozen[relativePath], relativePath + ' remains byte-identical');
}

/* Una sola registrazione Character Life per il distretto. */
assert.equal(fs.existsSync(path.join(root, 'js/station-population-scenes.js')), false,
  'station-population-scenes.js is merged into character-life-scenes.js');
const indexHtml = read('index.html').toString('utf8');
assert.equal(indexHtml.includes('station-population-scenes.js'), false, 'production loads a single Character Life registration');
assert.equal((indexHtml.match(/character-life-scenes\.js/g) || []).length, 1);

const oldRegistration = capturedProfiles('artifacts/station-population-v01/validation/character-life-scenes.before.js');
const populationRegistration = capturedProfiles('js/character-life-scenes.js');
assert.equal(populationRegistration.mapId, mapId);
assert.deepEqual(
  populationRegistration.profiles[0],
  Object.assign({}, oldRegistration.profiles[0], { id: 'truman' }),
  'Truman profile is preserved byte-for-byte apart from the NPC id');
assert.deepEqual(populationRegistration.profiles.map((profile) => profile.id), actorIds);

const lucyProfile = populationRegistration.profiles[1];
const andyProfile = populationRegistration.profiles[2];
assert.deepEqual(lucyProfile, {
  id: 'lucy',
  focusDirection: 'down',
  lockFocus: true,
  behaviors: [
    {
      id: 'blink', category: 'idle', animation: 'blink', delay: [16000, 34000], duration: [110, 150], variants: 1,
      directions: ['down'], frames: { down: Array(9).fill('lucy.blink.down') }
    },
    {
      id: 'telephone', category: 'contextual', animation: 'telephone', delay: [26000, 44000], duration: [2200, 3200], variants: 1,
      directions: ['down'], frames: { down: Array(9).fill('lucy.telephone.down') }
    }
  ]
});
assert.deepEqual(andyProfile, {
  id: 'andy',
  focusDirection: 'down',
  lockFocus: true,
  behaviors: [
    {
      id: 'blink', category: 'idle', animation: 'blink', delay: [23000, 47000], duration: [100, 160], variants: 1,
      directions: ['down'], frames: { down: Array(9).fill('andy.blink.down') }
    },
    {
      id: 'check-note', category: 'contextual', animation: 'check-note', delay: [48000, 78000], duration: [1300, 1900], variants: 1,
      directions: ['down'], frames: { down: Array(9).fill('andy.note.down') }
    }
  ]
});

let now = 0;
let rafQueue = [];
const handlers = {};
global.window = global;
global.performance = { now: () => now };
global.requestAnimationFrame = (callback) => { rafQueue.push(callback); };
global.setInterval = () => 0;
global.addEventListener = (type, callback) => { handlers[type] = callback; };
global.localStorage = { getItem: () => null, setItem: noop, removeItem: noop };
global.document = {
  currentScript: null,
  body: { classList: { toggle: noop }, setAttribute: noop },
  getElementById: () => null,
  addEventListener: noop
};

class FakeImage {
  constructor() {
    this.complete = false;
    this.naturalWidth = 0;
    this.naturalHeight = 0;
    this._src = '';
  }
  set src(value) {
    this._src = value;
    const population = value.includes('station-population-v01.png');
    this.naturalWidth = population ? 192 : 360;
    this.naturalHeight = population ? 24 : 360;
    this.complete = true;
    if (this.onload) this.onload();
  }
  get src() { return this._src; }
}
global.Image = FakeImage;
global.GAME = {};

const drawCalls = [];
const transforms = [];
const context = new Proxy({
  fillStyle: '#000',
  strokeStyle: '#000',
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  imageSmoothingEnabled: false,
  measureText: (text) => ({ width: String(text).length * 5 }),
  drawImage() { drawCalls.push(Array.from(arguments)); },
  translate(x, y) { transforms.push(['translate', x, y]); },
  scale(x, y) { transforms.push(['scale', x, y]); }
}, {
  get(target, key) { return key in target ? target[key] : noop; },
  set(target, key, value) { target[key] = value; return true; }
});
const canvas = { width: 256, height: 192, getContext: () => context };
const load = (name) => require(path.join(root, 'js', name));

[
  'tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'retro-font.js',
  'portraits.js', 'gold-tone.js', 'engine.js', 'scene-objects.gen.js', 'glue.js', 'retro.js',
  'retro-cast-matrices-a.js', 'retro-cast-matrices-b.js', 'retro-authored.js',
  'ambient-life.js'
].forEach(load);
const { create } = load('character-activity.js');
load('location-connections.js');
load('sheriffs-station-art.js');
load('sheriffs-station-exterior-art.js');
load('sheriffs-station-scene.js');
load('sheriffs-station-exterior-scene.js');
load('world-connections.gen.js');
load('environment-reactions.js');
load('double-r-exterior-art.js');
load('double-r-exterior-scene.js');
load('double-r-location-production.js');
load('sheriffs-station-production.js');
load('world-connections-production.js');
load('character-life-scenes.js');

const G = global.GAME;
const scene = G.SheriffsStationScene;
const map = G.Maps[mapId];
assert.equal(scene.mapId, mapId);

/* Il cast narrativo resta in js/glue.js: la scena non pubblica piu' NPC. */
const staff = map.npcs.filter((npc) => actorIds.includes(npc.id));
assert.deepEqual(staff.map((npc) => [npc.id, npc.sprite, npc.x, npc.y]), [
  ['truman', 'truman', 10, 4],
  ['andy', 'andy', 10, 7],
  ['lucy', 'lucy', 2, 6]
]);
const hawk = map.npcs.find((npc) => npc.id === 'hawk');
assert(hawk, 'Hawk is present on the station map');
assert.deepEqual([hawk.sprite, hawk.x, hawk.y], ['hawk', 12, 8]);
assert.equal(populationRegistration.profiles.some((profile) => profile.id === 'hawk'), false,
  'Hawk has no registered Character Life profile (stillness + existing reactive facing only)');
assert.deepEqual(map.npcs.filter((npc) => npc.id === 'leland').map((npc) => [npc.x, npc.y]), [[8, 5]]);

/* maps.js e' la sorgente unica della geometria; la scena fallisce a install()
 * se le due divergono, qui lo verifichiamo esplicitamente. */
assert.deepEqual(map.rows, scene.rows, 'maps.js geometry matches the authored footprints');
const oldSceneContext = vm.createContext({ GAME: { Maps: {}, Sprites: {}, sprites: {}, Retro2D: {} } });
oldSceneContext.window = oldSceneContext;
vm.runInContext(read('artifacts/station-population-v01/validation/sheriffs-station-scene.before.js').toString('utf8'), oldSceneContext);
const oldScene = oldSceneContext.GAME.SheriffsStationScene;
assert.deepEqual(normalized(scene.layout.footprints), normalized(oldScene.layout.footprints), 'furniture footprints remain unchanged');
assert.deepEqual(
  normalized(scene.layout.targets),
  Object.assign(normalized(oldScene.layout.targets), { exit: { x: 7, y: 11 } }),
  'named targets gain only the south entrance trigger');
assert.deepEqual(
  map.rows.map((row, y) => (y === 11 ? oldScene.map.rows[y] : row)),
  Array.from(oldScene.map.rows),
  'only the south wall opens, for the front entrance');

const occupied = new Set(staff.map((npc) => npc.x + ',' + npc.y));
function isFree(x, y) {
  return y >= 0 && y < map.height && x >= 0 && x < map.width
    && map.rows[y][x] === '.' && !occupied.has(x + ',' + y);
}
function reachableFrom(start) {
  const queue = [[start.x, start.y]];
  const seen = new Set([start.x + ',' + start.y]);
  for (let index = 0; index < queue.length; index++) {
    const [x, y] = queue[index];
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = x + dx;
      const ny = y + dy;
      const key = nx + ',' + ny;
      if (isFree(nx, ny) && !seen.has(key)) {
        seen.add(key);
        queue.push([nx, ny]);
      }
    }
  }
  return seen;
}
const freeTiles = map.rows.reduce((total, row, y) => total + Array.from(row).filter((cell, x) => cell === '.' && !occupied.has(x + ',' + y)).length, 0);
const reachable = reachableFrom(scene.layout.targets.entrance);
assert.equal(freeTiles, 83, 'three staff placements leave 83 free floor tiles');
assert.equal(reachable.size, freeTiles, 'all remaining floor tiles stay connected');
for (const [name, target] of Object.entries(scene.layout.targets)) {
  assert(isFree(target.x, target.y), name + ' remains free of furniture and staff');
  assert(reachable.has(target.x + ',' + target.y), name + ' remains reachable');
}
for (let y = 5; y <= 10; y++) {
  for (let x = 6; x <= 9; x++) assert(isFree(x, y), 'main aisle remains clear at ' + x + ',' + y);
}

const activity = create(1989);
activity.registerActors(mapId, populationRegistration.profiles);
const state = {
  mapId,
  mode: 'play',
  fadePhase: 0,
  dialogue: null,
  menu: false,
  npcs: staff.map((npc) => ({ ...npc, vx: npc.x, vy: npc.y, moving: false }))
};
activity.update(0, state);
for (let elapsed = 0; elapsed < 61000; elapsed += 20) activity.update(20, state);

const expectedAnimations = {
  truman: ['blink', 'reading'],
  lucy: ['blink', 'telephone'],
  andy: ['blink', 'check-note']
};
const eventStarts = [];
let totalStill = 0;
let totalObserved = 0;
for (const id of actorIds) {
  const actor = activity.actorSnapshot(id);
  assert(actor, id + ' has a production activity clock');
  for (const animation of expectedAnimations[id]) {
    assert(actor.history.some((event) => event.animation === animation), id + ' performs ' + animation + ' during seed 1989 minute');
  }
  assert(actor.stillMs / actor.observationMs >= 0.85, id + ' remains still for at least 85% of the minute');
  totalStill += actor.stillMs;
  totalObserved += actor.observationMs;
  assert(actor.history.length > 0, id + ' records at least one independent event start');
  eventStarts.push(actor.history[0].time);
}
assert(totalStill / totalObserved >= 0.9, 'population average remains dominated by stillness');
assert.equal(new Set(eventStarts).size, actorIds.length, 'actors do not share a synchronized first event start');
assert.deepEqual(state.npcs.map((npc) => [npc.id, npc.x, npc.y, npc.moving]), [
  ['truman', 10, 4, false],
  ['andy', 10, 7, false],
  ['lucy', 2, 6, false]
]);

for (const [id, reactiveDirection] of [['truman', 'right'], ['lucy', 'right'], ['andy', 'left']]) {
  const sample = create(1989);
  sample.registerActors(mapId, populationRegistration.profiles);
  const sampleState = { ...state, npcs: state.npcs.map((npc) => ({ ...npc, dir: 'down' })) };
  sample.update(0, sampleState);
  const npc = sampleState.npcs.find((item) => item.id === id);
  npc.dir = reactiveDirection;
  assert.equal(sample.reactToInteractor(npc, sampleState), true, id + ' accepts the existing interaction reaction');
  assert.equal(sample.actorPose(id).state, 'reactive');
  for (let elapsed = 0; elapsed < 320; elapsed += 20) sample.update(20, sampleState);
  assert.equal(sample.actorPose(id).state, 'still');
  assert.equal(npc.dir, 'down', id + ' restores its authored task focus');
}

const populationManifest = JSON.parse(read('assets/sprites/station-population-v01.manifest.json'));
assert.equal(populationManifest.asset, 'assets/sprites/station-population-v01.png');
assert.equal(populationManifest.inheritedPrefix.sha256, frozen['assets/sprites/character-life-v01.png']);
assert.equal(populationManifest.inheritedPrefix.decodedPixelsIdentical, true);
assert.deepEqual(Object.fromEntries(Object.entries(populationManifest.frames).map(([id, frame]) => [id, frame.rect.x])), {
  'lucy.blink.down': 96,
  'lucy.telephone.down': 120,
  'andy.blink.down': 144,
  'andy.note.down': 168
});
const populationPng = read('assets/sprites/station-population-v01.png');
assert.equal(populationPng.toString('ascii', 1, 4), 'PNG');
assert.equal(populationPng.readUInt32BE(16), 192);
assert.equal(populationPng.readUInt32BE(20), 24);
assert.deepEqual(Object.fromEntries(Object.entries(G.Retro2D.characterLifeFrames.frames).map(([id, frame]) => [id, frame.x])), {
  'truman.blink.down': 0,
  'truman.blink.right': 24,
  'truman.reading.fileRaised': 48,
  'truman.reading.eyesLowered': 72,
  'lucy.blink.down': 96,
  'lucy.telephone.down': 120,
  'andy.blink.down': 144,
  'andy.note.down': 168
});

function render(sprite, direction, moving, spriteFrame) {
  drawCalls.length = 0;
  transforms.length = 0;
  G.Sprites.drawChar(context, 32, 48, G.Sprites.CHARS[sprite], direction, moving ? 1 : 0, 1, moving, false, 0, {
    mapId,
    npcId: sprite,
    characterLife: { spriteFrame }
  });
  return drawCalls.at(-1);
}
let draw = render('lucy', 'down', false, 'lucy.telephone.down');
assert(draw[0].src.includes('station-population-v01.png'));
assert.deepEqual(draw.slice(1, 5), [120, 0, 24, 24]);
draw = render('andy', 'down', false, 'andy.note.down');
assert.deepEqual(draw.slice(1, 5), [168, 0, 24, 24]);
draw = render('lucy', 'left', false, 'lucy.blink.down');
assert(draw[0].src.includes('cast-walkcycles-hg-24.png'), 'unsupported Lucy direction uses the base atlas');
draw = render('andy', 'down', true, 'andy.note.down');
assert(draw[0].src.includes('cast-walkcycles-hg-24.png'), 'moving Andy uses original locomotion frames');

const html = read('test/station-population.html').toString('utf8');
for (const value of [
  'truman:still', 'truman:blink', 'truman:read-file',
  'lucy:still', 'lucy:blink', 'lucy:telephone',
  'andy:still', 'andy:blink', 'andy:check-note'
]) {
  const [actor, pose] = value.split(':');
  assert(html.includes('data-actor="' + actor + '" data-pose="' + pose + '"'), value + ' manual control is wired');
}

console.log('STATION-POPULATION-PASS 3 staff on canonical sheriff map, 83/83 connected floor, single registration, sparse independent minute, reactions, preserved atlas and Truman profile');
