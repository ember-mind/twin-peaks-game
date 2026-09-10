#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
let now=0,queue=[],handlers={};const noop=()=>{};
const nativeSetInterval=setInterval,nativeClearInterval=clearInterval;global.setInterval=()=>0;
global.window=global;global.performance={now:()=>now};global.requestAnimationFrame=fn=>queue.push(fn);global.addEventListener=(t,f)=>handlers[t]=f;
global.dispatchEvent=e=>{if(handlers[e.type])handlers[e.type](e);return true;};
global.KeyboardEvent=function(t,o){return Object.assign({type:t,preventDefault:noop,repeat:false},o||{})};global.Event=function(t){return{type:t}};
global.location={search:''};global.innerWidth=256;global.innerHeight=192;global.localStorage={getItem:()=>null,setItem:noop,removeItem:noop};
const ctx=new Proxy({measureText:t=>({width:String(t).length*5}),imageSmoothingEnabled:false},{get:(o,k)=>k in o?o[k]:noop,set:()=>true});
const els={};function el(id){return els[id]||(els[id]={id,hidden:false,disabled:false,textContent:'',onclick:null,width:256,height:192,style:{setProperty:noop},getContext:()=>ctx,classList:{toggle:noop},setAttribute:noop,addEventListener:noop});}
global.document={body:{classList:{toggle:noop},setAttribute:noop},getElementById:el,addEventListener:noop};global.GAME={};const js=n=>require(path.join(__dirname,'..','js',n));
['tiles.js','chars.js','houses.js','maps.js','data.js','retro-font.js','portraits.js','gold-tone.js','engine.js','glue.js','retro.js','retro-authored.js','retro-cast-matrices-a.js','retro-cast-matrices-b.js','ambient-life.js','character-activity.js','environment-reactions.js','ambient-life-scenes.js','location-connections.js'].forEach(js);
js('double-r-exterior-art.js');js('double-r-exterior-scene.js');js('double-r-location-data.js');require('./double-r-location.js');
function pump(){now+=20;queue.splice(0).forEach(fn=>fn(now));}
async function waitFor(predicate,message){for(let i=0;i<300;i++){pump();if(predicate())return;await new Promise(r=>setTimeout(r,1));}assert.fail(message);}
(async function(){
  const unhandled=[];const catchUnhandled=e=>unhandled.push(e);process.on('unhandledRejection',catchUnhandled);const timer=nativeSetInterval(pump,1);
  try{
    await waitFor(()=>global.__LOCATION_PREVIEW__.snapshot().ready,'controller becomes ready');const api=global.__LOCATION_PREVIEW__;
    let state=api.reset();assert.equal(state.mapId,'double_r_exterior_prototype');assert.equal(state.roundTripComplete,false);
    state=await api.demoRoundTrip();assert.equal(state.roundTripComplete,true,'controller demo completes a real round trip');
    assert.deepEqual(state.history.map(x=>x.dest),['diner','double_r_exterior_prototype']);assert.equal(state.saveCount,2,'one coordinated save per crossing');
    assert.deepEqual(state.reactionEvents,[1],'round trip leaves the coalesced front-door animation active');assert.equal(state.fadePhase,0);
    api.reset();const interrupted=api.demoRoundTrip();await waitFor(()=>api.snapshot().player.moving||api.snapshot().fadePhase!==0,'demo begins before reset');
    state=api.reset();assert.equal(state.mapId,'double_r_exterior_prototype');assert.equal(state.roundTripComplete,false);await interrupted;await new Promise(r=>setTimeout(r,20));
    state=api.snapshot();assert.equal(state.mapId,'double_r_exterior_prototype','reset keeps cancelled demo in parking scene');assert.equal(state.roundTripComplete,false,'cancelled demo has no spurious round trip');assert.equal(unhandled.length,0,'no unhandled cancellation timeout');
    console.log('DOUBLE-R-LOCATION-CONTROLLER-PASS demo round trip, save/reaction ledger and reset cancellation');
  }finally{nativeClearInterval(timer);process.off('unhandledRejection',catchUnhandled);}
}()).catch(e=>{console.error(e.stack||e);process.exitCode=1;});
