#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let now=0, queue=[], handlers={};
global.window=global; global.performance={now:()=>now}; global.requestAnimationFrame=fn=>{queue.push(fn);};
global.innerWidth=256; global.innerHeight=192;
// The deterministic rAF pump owns time; disable the hidden-tab fallback timer.
global.setInterval=()=>0;
global.addEventListener=(t,fn)=>{handlers[t]=fn;};
global.KeyboardEvent=function(type,opts){return Object.assign({type},opts||{});};
const noop=()=>{}; const ctx=new Proxy({measureText:t=>({width:String(t).length*5}),imageSmoothingEnabled:false},{get:(o,k)=>k in o?o[k]:noop,set:()=>true});
const els={}; function el(id){return els[id]||(els[id]={id,hidden:false,textContent:'',style:{},getContext:()=>ctx,classList:{toggle:noop},_attrs:{},setAttribute(n,v){this._attrs[n]=v;},getAttribute(n){return n in this._attrs?this._attrs[n]:null;},removeAttribute(n){delete this._attrs[n];},addEventListener:noop});}
global.document={body:{classList:{toggle:noop},setAttribute:noop},getElementById:el,addEventListener:noop};
let storageWrites=0;
global.localStorage={getItem:()=>null,setItem:()=>{storageWrites++;},removeItem:noop};
global.GAME={};
const js=n=>require(path.join(__dirname,'..','js',n));
['tiles.js','chars.js','houses.js','maps.js','data.js','retro-font.js','portraits.js','gold-tone.js','engine.js','scene-objects.gen.js','glue.js','retro.js','retro-authored.js','retro-cast-matrices-a.js','retro-cast-matrices-b.js'].forEach(js);
js('double-r-exterior-art.js');
js('double-r-exterior-scene.js');
require('./double-r-exterior-prototype.js');
const P=GAME.__EXTERIOR_PREVIEW__, E=GAME.Engine;
function pump(frames=1){for(let i=0;i<frames;i++){now+=16;const fn=queue.shift();if(fn)fn(now);}}
function press(code){handlers.keydown({code,preventDefault:noop,repeat:false});handlers.keyup({code});for(let i=0;i<24;i++)pump();}
assert.equal(P.snapshot().ready,true); assert.equal(P.snapshot().mapId,'double_r_exterior_prototype');
assert.deepEqual(P.snapshot().canvas,{width:256,height:192}); assert.deepEqual([E.state.player.tx,E.state.player.ty],[6,10]);
assert.equal(GAME.Maps.isSolid('double_r_exterior_prototype',6,9,E.state),false);
assert.equal(GAME.Maps.isSolid('double_r_exterior_prototype',0,7,E.state),true,'planter');
assert.equal(GAME.Maps.isSolid('double_r_exterior_prototype',14,8,E.state),true,'sign');
assert.equal(GAME.Maps.isSolid('double_r_exterior_prototype',2,9,E.state),true,'wheelstop');
assert.equal(GAME.Maps.isSolid('double_r_exterior_prototype',1,11,E.state),true,'foreground foliage');
press('ArrowUp'); assert.deepEqual([E.state.player.tx,E.state.player.ty],[6,9]);
press('ArrowUp'); assert.deepEqual([E.state.player.tx,E.state.player.ty],[6,8]);
press('ArrowUp'); assert.deepEqual([E.state.player.tx,E.state.player.ty],[6,7]);
press('ArrowUp'); assert.deepEqual([E.state.player.tx,E.state.player.ty],[6,6]);
assert.equal(P.snapshot().triggerVisits,1); assert.equal(P.snapshot().transitionDisabled,true);
press('ArrowRight'); assert.deepEqual([E.state.player.tx,E.state.player.ty],[7,6]);
assert.equal(P.snapshot().triggerVisits,2,'both entrance triggers');
assert.equal(storageWrites,0,'preview never persists');
const before=[E.state.player.tx,E.state.player.ty]; press('ArrowUp'); assert.deepEqual([E.state.player.tx,E.state.player.ty],before,'wall remains solid');
P.reset(); assert.deepEqual([E.state.player.tx,E.state.player.ty],[6,10]); assert.equal(P.snapshot().triggerVisits,0);
assert.match(fs.readFileSync(path.join(__dirname,'double-r-exterior-prototype.html'),'utf8'),/width="256" height="192"/);
assert.equal(GAME.Retro2D.castRenderer.id,'heartgold-atlas-r116');
console.log('DOUBLE-R-EXTERIOR-NATIVE-PASS 18/18');
