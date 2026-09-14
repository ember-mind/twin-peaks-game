#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const path = require('node:path');

let now = 0;
let rafQueue = [];
const handlers = {};
const storage = new Map();

global.window = global;
global.addEventListener = (type, fn) => { handlers[type] = fn; };
global.requestAnimationFrame = (fn) => { rafQueue.push(fn); };
global.performance = { now: () => now };
global.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); }
};

const context = new Proxy(
  { measureText: (text) => ({ width: String(text).length * 5 }) },
  { get(target, key) { return key in target ? target[key] : () => {}; }, set() { return true; } }
);
const canvas = { width: 0, height: 0, getContext: () => context };
const script = (name) => path.join(__dirname, '..', 'js', name);

require(script('tiles.js'));
require(script('chars.js'));
require(script('houses.js'));
require(script('maps.js'));
require(script('data.js'));
require(script('retro-font.js'));
require(script('engine.js'));
require(script('glue.js'));

require(script('ambient-life.js'));
require(script('environment-reactions.js'));
require(script('ambient-life-scenes.js'));
require(script('location-connections.js'));
require(script('world-connections.gen.js'));
require(script('double-r-exterior-art.js'));
require(script('double-r-exterior-scene.js'));
require(script('double-r-location-production.js'));
require(script('sheriffs-station-art.js'));
require(script('sheriffs-station-exterior-art.js'));
require(script('sheriffs-station-scene.js'));
require(script('sheriffs-station-exterior-scene.js'));
require(script('sheriffs-station-production.js'));
require(script('world-connections-production.js'));
const E = global.GAME.Engine;

function press(code) {
  handlers.keydown({ code, preventDefault() {}, repeat: false });
  handlers.keyup({ code });
}


function tick(ms){for(let i=0;i<ms;i+=20){now+=20;rafQueue.splice(0).forEach(fn=>fn(now));}}
E.init(canvas);E.start();E.state.mode='play';E.state.dialogue=null;
const original=E.emitEnvironmentEvent,events=[];E.emitEnvironmentEvent=e=>{events.push(e);return original(e);};
E.loadMap('town',42,19,'down');assert.equal(events.length,0,'loadMap alone is not doorway entry');
handlers.keydown({code:'ArrowDown',preventDefault(){},repeat:false});tick(200);handlers.keyup({code:'ArrowDown'});
for(let i=0;i<50&&E.state.mapId!=='double_r_exterior_prototype';i++)tick(20);
assert.equal(E.state.mapId,'double_r_exterior_prototype');assert.equal(events.length,1);assert.equal(events[0].fromDoorKey,'42,20');assert.equal(events[0].arrivalKey,'6,10');
events.length=0;
for(let step=0;step<4;step++){handlers.keydown({code:'ArrowUp',preventDefault(){},repeat:false});tick(200);handlers.keyup({code:'ArrowUp'});}
for(let i=0;i<50&&E.state.mapId!=='diner';i++)tick(20);
assert.equal(E.state.mapId,'diner');assert.equal(events.length,1);assert.equal(events[0].fromDoorKey,'6,6');assert.equal(events[0].arrivalKey,'6,8');
assert(GAME.EnvironmentReactions.snapshot('diner')[0].events===1,'committed world entry reaches production door');
assert.equal(E.state.fadePhase,2);
while(E.state.fadePhase!==0){assert.equal(GAME.EnvironmentReactions.snapshot('diner')[0].elapsed,0,'opening pose cannot be consumed behind fade');tick(20);}
assert.equal(GAME.EnvironmentReactions.snapshot('diner')[0].frame,0);tick(100);
assert.equal(GAME.EnvironmentReactions.snapshot('diner')[0].frame,0,'first opening pose remains visible after fade');tick(60);
assert.equal(GAME.EnvironmentReactions.snapshot('diner')[0].frame,1);tick(140);
assert.equal(GAME.EnvironmentReactions.snapshot('diner')[0].state,'OPEN');
tick(1600);assert.equal(GAME.EnvironmentReactions.snapshot('diner')[0].state,'CLOSED');
E.loadMap('double_r_exterior_prototype',6,7,'up');events.length=0;
const save=localStorage.setItem;localStorage.setItem=()=>{throw new Error('fixture disk full');};
handlers.keydown({code:'ArrowUp',preventDefault(){},repeat:false});tick(200);handlers.keyup({code:'ArrowUp'});tick(400);
assert.equal(E.state.mapId,'double_r_exterior_prototype','failed save rolls back doorway transition');assert.equal(events.length,0,'rolled-back transition emits no world event');
localStorage.setItem=save;
console.log('ENVIRONMENT-ENTRY-PASS real movement to door, commit dispatch, reaction completion, no load-only events, no rollback events');
