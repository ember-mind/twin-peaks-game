#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
let now = 0, queue = [], handlers = {}, failSave = false, saveCount = 0;
global.window = global;
global.performance = { now: () => now };
global.requestAnimationFrame = (fn) => queue.push(fn);
global.setInterval = () => 0;
global.addEventListener = (type, fn) => { handlers[type] = fn; };
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const noop = () => {};
const ctx = new Proxy({ measureText: (text) => ({ width: String(text).length * 5 }) }, { get: (target, key) => key in target ? target[key] : noop, set: () => true });
const js = (name) => path.join(__dirname, '..', 'js', name);
['tiles.js','chars.js','houses.js','maps.js','data.js','retro-font.js','engine.js','glue.js','location-connections.js','world-connections.gen.js','double-r-exterior-scene.js'].forEach(name => require(js(name)));
GAME.DoubleRExteriorScene.install();
require(js('sheriffs-station-art.js'));
require(js('sheriffs-station-exterior-art.js'));
require(js('sheriffs-station-scene.js'));
require(js('sheriffs-station-exterior-scene.js'));
require(js('environment-reactions.js'));
require(js('sheriffs-station-production.js'));
require(js('world-engine.js'));
require(js('world-catalog.js'));
const E = GAME.Engine;
GAME.LocationConnections.connectionRecordsFor(['town-traincar-east','traincar-oej-entrance']).forEach(connection => GAME.LocationConnections.install(connection, GAME.Maps));
GAME.NarrativeProduction = { onClassicSave() { saveCount++; return failSave ? { handled: true, ok: false, error: 'fixture disk full' } : { handled: true, ok: true }; } };

function frame() { now += 20; queue.splice(0).forEach(fn => fn(now)); }
function pump(ms) { for (let elapsed = 0; elapsed < ms; elapsed += 20) frame(); }
function press(dir) { handlers.keydown({ code: 'Arrow' + dir[0].toUpperCase() + dir.slice(1), preventDefault: noop, repeat: false }); }
function release(dir) { handlers.keyup({ code: 'Arrow' + dir[0].toUpperCase() + dir.slice(1) }); }
function settle() { let guard = 80; while (E.state.fadePhase !== 0 && guard--) frame(); assert(guard > 0, 'fade settles'); }
function setScene(mapId, tx, ty, dir) { E.state.mode = 'title'; E.loadMap(mapId, tx, ty, dir); E.state.mode = 'play'; E.state.dialogue = null; E.state.menu = false; E.state.fade = 0; E.state.fadePhase = 0; E.state.warp = null; }
function cross(dir, mapId, spawn) { press(dir); let guard = 100; while (E.state.fadePhase === 0 && guard--) frame(); assert(guard > 0, 'trigger starts fade'); release(dir); settle(); assert.equal(E.state.mapId, mapId); assert.deepEqual([E.state.player.tx, E.state.player.ty, E.state.player.dir], spawn); }

E.init({ width: 256, height: 192, getContext: () => ctx }); E.start();
assert.equal(GAME.Maps.town.doors['55,14'], GAME.Maps.town.doors['55,15'], 'town leaves share semantic connection descriptor');
assert.equal(GAME.Maps.oej.doors['7,9'], GAME.Maps.oej.doors['8,9'], 'Oej leaves share semantic connection descriptor');
setScene('town', 54, 14, 'right'); press('right'); pump(280); release('right');
assert.equal(E.state.mapId, 'town'); assert.equal(E.state.player.tx, 54); assert(E.state.dialogue, 'Act 3 gate remains authored door behavior'); E.state.dialogue = null;
E.state.flags.atto3 = true; cross('right', 'traincar', [1,7,'right']);
setScene('traincar', 1, 7, 'left'); cross('left', 'town', [54,14,'left']);
// Act 3 span is mission-owned (M5/M6/M8); stub = syncNarrativeToClassic outcome
E.state.flags.east_route_confirmed = true;
setScene('traincar', 21, 1, 'up'); cross('up', 'oej', [8,8,'up']);
for (const leaf of [7, 8]) { setScene('oej', leaf, 8, 'down'); cross('down', 'traincar', [21,1,'down']); pump(300); assert.deepEqual([E.state.player.tx, E.state.player.ty], [21,1], 'non-trigger spawn does not bounce'); }
setScene('traincar', 21, 1, 'up'); const savesBeforeFailure = saveCount; failSave = true; press('up'); pump(700); release('up');
assert.equal(E.state.mapId, 'traincar'); assert.deepEqual([E.state.player.tx, E.state.player.ty], [21,0]); assert.equal(saveCount, savesBeforeFailure + 1, 'failed crossing attempts coordinated save once');
failSave = false; press('down'); pump(280); release('down'); cross('up', 'oej', [8,8,'up']);
assert(saveCount >= 7, 'all successful traversals use coordinated saves');
console.log('TRAINCAR-LOCATION-TRAVERSAL-PASS paired town/traincar and traincar/Oej connections, asymmetric leaves, gate, fade, save rollback/retry, no bounce');
