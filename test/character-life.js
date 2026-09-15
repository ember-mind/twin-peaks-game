#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const noop = () => {};
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
    const legacyLife = value.includes('character-life-v01.png');
    this.naturalWidth = population ? 192 : (legacyLife ? 96 : 360);
    this.naturalHeight = population || legacyLife ? 24 : 360;
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
  'ambient-life.js', 'narrative-runtime.js', 'narrative-data.gen.js', 'cast-presence.js'
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
const MAP_ID = G.SheriffsStationScene.mapId;
const ACTOR_ID = 'truman';

function profile(id = ACTOR_ID) {
  return {
    id,
    focusDirection: 'down',
    lockFocus: true,
    behaviors: [
      {
        id: 'blink', category: 'idle', animation: 'blink', delay: [12000, 38000], duration: [100, 160], variants: 1,
        directions: ['down', 'left', 'right'],
        frames: {
          down: Array(9).fill('truman.blink.down'),
          left: Array(9).fill('truman.blink.right'),
          right: Array(9).fill('truman.blink.right')
        }
      },
      {
        id: 'read-file', category: 'contextual', animation: 'reading', delay: [32000, 65000], duration: [2400, 3400], variants: 1,
        directions: ['down'], frames: { down: Array(9).fill('truman.reading.fileRaised') }
      }
    ]
  };
}

function actorState(mapId = MAP_ID, id = ACTOR_ID) {
  return {
    mapId,
    mode: 'play',
    fadePhase: 0,
    dialogue: null,
    menu: false,
    npcs: [{ id, x: 10, y: 4, vx: 10, vy: 4, dir: 'down', moving: false }]
  };
}

function activityFor(seed = 1989, mapId = MAP_ID, id = ACTOR_ID) {
  const activity = create(seed);
  activity.registerActors(mapId, [profile(id)]);
  const state = actorState(mapId, id);
  activity.update(0, state);
  return { activity, state };
}

function advance(activity, state, duration, step = 20) {
  for (let elapsed = 0; elapsed < duration; elapsed += step) activity.update(Math.min(step, duration - elapsed), state);
}

function advanceUntil(activity, state, predicate, limit = 70000) {
  for (let elapsed = 0; elapsed < limit; elapsed += 20) {
    activity.update(20, state);
    if (predicate()) return elapsed + 20;
  }
  assert.fail('timed out waiting for Character Life state');
}

// Production timing is sparse, deterministic, and dominated by stillness.
const minute = activityFor();
advance(minute.activity, minute.state, 65000);
const minuteSnapshot = minute.activity.actorSnapshot(ACTOR_ID);
assert.equal(minuteSnapshot.observationMs, 65000);
assert(minuteSnapshot.history.some((event) => event.animation === 'blink'), 'seed 1989 blinks during a 65 second observation');
assert(minuteSnapshot.history.some((event) => event.animation === 'reading'), 'seed 1989 reads during a 65 second observation');
assert(minuteSnapshot.stillMs / minuteSnapshot.observationMs >= 0.85, 'at least 85% of production observation remains still');
assert.equal(minute.state.npcs[0].x, 10);
assert.equal(minute.state.npcs[0].y, 4);
assert.equal(minute.state.npcs[0].moving, false);

// The same seed is partition invariant, while two actor identities get independent phases.
const partitionA = activityFor(1989);
const partitionB = activityFor(1989);
advance(partitionA.activity, partitionA.state, 65000, 20);
advance(partitionB.activity, partitionB.state, 65000, 1000);
assert.deepEqual(
  partitionA.activity.actorSnapshot(ACTOR_ID).behaviors.map((item) => [item.id, item.events, item.next, item.start, item.end]),
  partitionB.activity.actorSnapshot(ACTOR_ID).behaviors.map((item) => [item.id, item.events, item.next, item.start, item.end]),
  'seeded clock outcome does not depend on update partition'
);
const asynchronous = create(1989);
asynchronous.registerActors(MAP_ID, [profile('actor-a'), profile('actor-b')]);
const asyncState = { mapId: MAP_ID, mode: 'play', fadePhase: 0, dialogue: null, menu: false, npcs: [
  { id: 'actor-a', x: 1, y: 1, dir: 'down', moving: false },
  { id: 'actor-b', x: 2, y: 1, dir: 'down', moving: false }
] };
asynchronous.update(0, asyncState);
assert.notEqual(asynchronous.actorSnapshot('actor-a').nextEvent, asynchronous.actorSnapshot('actor-b').nextEvent, 'actors do not share an idle phase');

// A natural contextual action cancels on every gameplay interruption and never resumes mid-event.
for (const interruption of ['menu', 'dialogue', 'fade', 'moving', 'inactive', 'narrative', 'disable']) {
  const sample = activityFor(2000 + interruption.length);
  sample.activity.setActorTimeScale(100);
  advanceUntil(sample.activity, sample.state, () => sample.activity.actorPose(ACTOR_ID).state === 'contextual');
  const activeItem = sample.activity.actorSnapshot(ACTOR_ID).behaviors.find((item) => item.id.endsWith(':read-file'));
  if (interruption === 'menu') sample.state.menu = true;
  if (interruption === 'dialogue') sample.state.dialogue = { id: 'fixture' };
  if (interruption === 'fade') sample.state.fadePhase = 1;
  if (interruption === 'moving') sample.state.npcs[0].moving = true;
  if (interruption === 'inactive') sample.state.mode = 'title';
  if (interruption === 'narrative') G.NarrativeAdapter = { active: () => true };
  if (interruption === 'disable') sample.activity.setEnabled(false);
  sample.activity.update(20, sample.state);
  assert.equal(sample.activity.actorPose(ACTOR_ID).state, 'still', interruption + ' cancels active reading');
  sample.state.menu = false;
  sample.state.dialogue = null;
  sample.state.fadePhase = 0;
  sample.state.npcs[0].moving = false;
  sample.state.mode = 'play';
  delete G.NarrativeAdapter;
  if (interruption === 'disable') sample.activity.setEnabled(true);
  sample.activity.update(20, sample.state);
  assert.equal(sample.activity.actorPose(ACTOR_ID).state, 'still', interruption + ' does not resume the cancelled reading');
  assert.equal(sample.activity.actorSnapshot(ACTOR_ID).behaviors.find((item) => item.id.endsWith(':read-file')).start, activeItem.start);
}

// Reactive facing preempts reading, releases to task focus, and cancels on movement.
const reactive = activityFor(1989);
reactive.activity.setActorTimeScale(100);
advanceUntil(reactive.activity, reactive.state, () => reactive.activity.actorPose(ACTOR_ID).state === 'contextual');
reactive.state.npcs[0].dir = 'right';
assert.equal(reactive.activity.reactToInteractor(reactive.state.npcs[0], reactive.state), true);
assert.equal(reactive.activity.actorPose(ACTOR_ID).state, 'reactive');
advance(reactive.activity, reactive.state, 240);
assert.equal(reactive.state.npcs[0].dir, 'right', 'reaction keeps facing the interactor before release');
advance(reactive.activity, reactive.state, 40);
assert.equal(reactive.activity.actorPose(ACTOR_ID).state, 'still');
assert.equal(reactive.state.npcs[0].dir, 'down', 'reaction returns to authored task focus');
reactive.state.npcs[0].dir = 'left';
reactive.activity.reactToInteractor(reactive.state.npcs[0], reactive.state);
reactive.state.npcs[0].moving = true;
reactive.activity.update(20, reactive.state);
assert.equal(reactive.activity.actorPose(ACTOR_ID).state, 'still', 'movement cancels reactive ownership');
assert.equal(reactive.state.npcs[0].dir, 'left', 'movement retains its own facing direction');

// Disable, direction eligibility, pause, and map-scoped IDs remain explicit.
const guards = activityFor();
guards.activity.previewActor(ACTOR_ID, 'blink', 60);
assert.equal(guards.activity.actorPose(ACTOR_ID).state, 'idle');
const pausedFrame = guards.activity.actorPose(ACTOR_ID).frame;
guards.activity.setPaused(true);
guards.activity.update(1000, guards.state);
assert.equal(guards.activity.actorPose(ACTOR_ID).frame, pausedFrame, 'pause freezes an authored preview frame');
guards.activity.setEnabled(false);
assert.equal(guards.activity.actorPose(ACTOR_ID).state, 'still', 'disable immediately suppresses pose');
const up = activityFor();
up.state.npcs[0].dir = 'up';
up.activity.previewActor(ACTOR_ID, 'blink', 60);
assert.equal(up.activity.actorPose(ACTOR_ID).spriteFrame, null, 'unsupported up blink falls back to base frame');
assert.equal(up.state.npcs[0].dir, 'up', 'frame direction whitelist never rotates the actor');
const scoped = create(1989);
scoped.registerActors('map-a', [profile('same-id')]);
scoped.registerActors('map-b', [profile('same-id')]);
const mapA = actorState('map-a', 'same-id');
const mapB = actorState('map-b', 'same-id');
scoped.update(0, mapA);
scoped.previewActor('same-id', 'blink', 60);
assert.equal(scoped.actorPose('same-id').state, 'idle');
scoped.update(0, mapB);
assert.equal(scoped.actorPose('same-id').state, 'still', 'same actor ID has independent map state');

// Renderer uses life frames only for the matching stationary actor and direction.
function renderCharacter(palette, direction, frame, moving, characterLife) {
  drawCalls.length = 0;
  transforms.length = 0;
  G.Sprites.drawChar(context, 32, 48, palette, direction, frame, 1, moving, false, 0, {
    mapId: MAP_ID,
    npcId: ACTOR_ID,
    characterLife
  });
  return { draw: drawCalls.at(-1), transforms: transforms.slice() };
}
let rendered = renderCharacter(G.Sprites.CHARS.truman, 'down', 0, false, { spriteFrame: 'truman.blink.down' });
assert(rendered.draw[0].src.includes('station-population-v01.png'));
assert.deepEqual(rendered.draw.slice(1, 5), [0, 0, 24, 24]);
rendered = renderCharacter(G.Sprites.CHARS.truman, 'left', 0, false, { spriteFrame: 'truman.blink.right' });
assert(rendered.draw[0].src.includes('station-population-v01.png'));
assert.deepEqual(rendered.draw.slice(1, 5), [24, 0, 24, 24]);
assert(rendered.transforms.some((entry) => entry[0] === 'scale' && entry[1] === -1), 'left life frame mirrors the right source');
rendered = renderCharacter(G.Sprites.CHARS.truman, 'down', 1, true, { spriteFrame: 'truman.blink.down' });
assert(rendered.draw[0].src.includes('cast-walkcycles-hg-24.png'), 'moving Truman uses original step atlas');
rendered = renderCharacter(G.Sprites.CHARS.cooper, 'down', 0, false, { spriteFrame: 'truman.blink.down' });
assert(rendered.draw[0].src.includes('cast-walkcycles-hg-24.png'), 'Cooper ignores Truman frame descriptor');
rendered = renderCharacter(G.Sprites.CHARS.truman, 'up', 0, false, { spriteFrame: 'truman.blink.down' });
assert(rendered.draw[0].src.includes('cast-walkcycles-hg-24.png'), 'unsupported up pose uses original atlas');

// Il corpo di Truman non vive piu' in js/glue.js ma nel registro cast
// (narrative/cast/windows.json), risolto da GAME.CastPresence contro lo
// stato narrativo. Stato nullo = baseline autorale (nessuna finestra attiva).
const productionTrumans = G.CastPresence.bodiesFor(MAP_ID, null).filter((npc) => npc.id === ACTOR_ID);
assert.equal(productionTrumans.length, 1, 'the population pass preserves exactly one Truman record');
assert.deepEqual([productionTrumans[0].x, productionTrumans[0].y, productionTrumans[0].sprite, productionTrumans[0].dir],
  [10, 4, 'truman', 'down']);
const oldSceneContext = vm.createContext({ GAME: { Maps: {}, Sprites: {}, sprites: {}, Retro2D: {} } });
oldSceneContext.window = oldSceneContext;
vm.runInContext(fs.readFileSync(path.join(root, 'artifacts/character-life-v01/validation/sheriffs-station-scene.js.before'), 'utf8'), oldSceneContext);
const oldRows = Array.from(oldSceneContext.GAME.SheriffsStationScene.map.rows);
assert.deepEqual(G.Maps[MAP_ID].rows.map((row, y) => (y === 11 ? oldRows[y] : row)), oldRows,
  'station collision geometry changes only where the south entrance opens');
assert.deepEqual(G.Maps[MAP_ID].rows[11], 'TTTTTTT..TTTTTTT', 'south wall opens on the two entrance triggers');
assert.deepEqual(G.SheriffsStationScene.layout.footprints, JSON.parse(JSON.stringify(oldSceneContext.GAME.SheriffsStationScene.layout.footprints)));
assert.deepEqual(G.SheriffsStationScene.layout.targets,
  Object.assign(JSON.parse(JSON.stringify(oldSceneContext.GAME.SheriffsStationScene.layout.targets)), { exit: { x: 7, y: 11 } }));
/* R129: 25-actor atlas (infermiera) */
const beforeHashes = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/character-life-v01/validation/before-hashes.json'), 'utf8'));
for (const file of [
  'js/world-engine.js', 'js/ambient-life.js', 'assets/sprites/cast-walkcycles-hg-24.png'
]) {
  const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
  assert.equal(hash, beforeHashes[file], file + ' remains unchanged');
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/sprites/character-life-v01.manifest.json'), 'utf8'));
for (const [frameId, frame] of Object.entries(manifest.frames)) {
  assert(G.Retro2D.characterLifeFrames.frames[frameId], frameId + ' remains in the combined renderer vocabulary');
  assert.equal(G.Retro2D.characterLifeFrames.frames[frameId].x, frame.rect.x, frameId + ' keeps its original source position');
}
assert.equal(manifest.source.sha256, beforeHashes['assets/sprites/cast-walkcycles-hg-24.png']);

// Engine keeps locomotion ownership and invokes the real interaction reaction hook.
// Il corpo di Truman non arriva piu' da js/glue.js: lo si posa a mano su
// GAME.Maps[MAP_ID] prima del loadMap, come farebbe l'adapter narrativo in
// produzione (GAME.CastPresence.syncMaps), per stato baseline (nessuna missione).
G.Maps[MAP_ID].npcs = G.CastPresence.bodiesFor(MAP_ID, null);
G.CharacterActivity.reset(1989);
G.Engine.init(canvas, null);
G.Engine.start();
G.Engine.state.mode = 'title';
G.Engine.loadMap(MAP_ID, 11, 4, 'left');
G.Engine.state.mode = 'play';
G.Engine.state.fade = 0;
G.Engine.state.fadePhase = 0;
G.Engine.state.dialogue = null;
G.Engine.state.menu = false;
G.CharacterActivity.update(0, G.Engine.state);
handlers.keydown({ code: 'Enter', preventDefault: noop, repeat: false });
handlers.keyup({ code: 'Enter' });
const productionTruman = G.Engine.state.npcs.find((npc) => npc.id === ACTOR_ID);
assert.equal(productionTruman.dir, 'right');
assert.equal(G.CharacterActivity.actorPose(ACTOR_ID).state, 'reactive');
function engineFrame() {
  now += 20;
  const callbacks = rafQueue.splice(0);
  callbacks.forEach((callback) => callback(now));
}
/* Il Truman canonico porta la cascata narrativa: la reazione si rilascia solo
 * quando il dialogo aperto dallo stesso tasto azione si chiude. */
let dialogueGuard = 64;
while (G.Engine.state.dialogue && dialogueGuard--) {
  handlers.keydown({ code: 'Enter', preventDefault: noop, repeat: false });
  handlers.keyup({ code: 'Enter' });
  engineFrame();
}
assert.equal(G.Engine.state.dialogue, null, 'Truman dialogue closes');
for (let i = 0; i < 16; i++) engineFrame();
assert.equal(productionTruman.dir, 'down', 'real action-key reaction releases to task focus');
G.Engine.state.mode = 'title';
G.Engine.loadMap(MAP_ID, 7, 10, 'up');
G.Engine.state.mode = 'play';
handlers.keydown({ code: 'ArrowUp', preventDefault: noop, repeat: false });
handlers.keyup({ code: 'ArrowUp' });
for (let i = 0; i < 20; i++) engineFrame();
assert.deepEqual([G.Engine.state.player.tx, G.Engine.state.player.ty], [7, 9], 'original player locomotion remains active');
const stillTruman = G.Engine.state.npcs.find((npc) => npc.id === ACTOR_ID);
assert.deepEqual([stillTruman.x, stillTruman.y, stillTruman.dir, stillTruman.moving], [10, 4, 'down', false], 'managed stationary Truman does not wander or randomly turn');

console.log('CHARACTER-LIFE-PASS sparse seeded life, interruption cancellation, reactive priority, map scoping, renderer fallbacks, preserved geometry and locomotion');
