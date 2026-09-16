'use strict';
/* Real production boot/poll + actual adapter/resolver/save modules with a
 * minimal browser surface. Classic acquisition is fixture input, not a
 * claimed unseeded playthrough. Browser recovery run 35109208269 found this.
 */
const assert=require('node:assert/strict');
const path=require('node:path');
const callbacks={},timers=[];
global.window=global;
global.addEventListener=(type,fn)=>{(callbacks[type]||=[]).push(fn);};
global.removeEventListener=()=>{};
global.setInterval=(fn,ms)=>{timers.push({fn,ms});return timers.length;};
global.clearInterval=()=>{};
global.requestAnimationFrame=()=>{};
global.performance={now:()=>0};
global.location={search:''};
const storage=new Map();
global.localStorage={getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
const ctx=new Proxy({measureText:s=>({width:String(s).length*5})},{get:(t,k)=>k in t?t[k]:()=>{},set:()=>true});
for(const name of ['tiles','chars','maps','data','retro-font','engine','scene-objects.gen','glue','narrative-runtime','narrative-data.gen','narrative-bootstrap','cast-presence']){
  require(path.join(__dirname,'..','js',name+'.js'));
}
const E=GAME.Engine;E.init({getContext:()=>ctx});
GAME.NarrativeUI={};
global.document={getElementById:id=>id==='narrative'?{querySelector:()=>null}:null,querySelector:()=>null};
for(const name of ['narrative-engine-adapter','narrative-save','narrative-production']) require(path.join(__dirname,'..','js',name+'.js'));
for(const fn of callbacks.load||[])fn();
const A=GAME.NarrativeAdapter,CP=GAME.CastPresence,NR=GAME.NarrativeRuntime,NP=GAME.NarrativeProduction,NS=GAME.NarrativeSave;
assert.ok(NP.ready && NP.testMode===false,'Normal production boot, persistence enabled');
const poll=timers.filter(t=>t.ms===180);assert.equal(poll.length,1,'Capture the actual production poll, not a rewritten test implementation');
E.state.mode='play';E.loadMap('diner',1,8,'up');
const tick=()=>poll[0].fn();tick();
const has=(list,id)=>list.some(n=>n.id===id);
assert.equal(has(GAME.Maps.diner.npcs,'james'),false,'James is offscreen before the dream');
assert.equal(has(E.state.npcs,'james'),false);
E.state.flags.sogno_fatto=true; // Fixture input: a classic acquisition, no narrative commit.
tick();
assert.equal(A.getState().flags.sogno_fatto,true,'Bridge imports classic story state');
assert.equal(CP.resolveCharacterPresence('james',A.getState()).status,'PLACED');
assert.equal(has(GAME.Maps.diner.npcs,'james'),true,'Classic progress must materialize James without another interaction or reload');
assert.equal(has(E.state.npcs,'james'),true,'Reconcile the live map as well as unloaded map definitions');
const normalize=list=>list.map(n=>({id:n.id,x:n.homeX===undefined?n.x:n.homeX,y:n.homeY===undefined?n.y:n.homeY})).sort((a,b)=>a.id.localeCompare(b.id));
assert.deepEqual(normalize(GAME.Maps.diner.npcs),normalize(CP.bodiesFor('diner',A.getState())));
const changes=A.events.filter(e=>e.event==='narrative_entities_synced').length;
const saved=storage.get(NS.keyFor('main'));
for(let i=0;i<6;i++)tick();
assert.equal(A.events.filter(e=>e.event==='narrative_entities_synced').length,changes,'Repeated polls do not respawn or duplicate the cast');
assert.equal(storage.get(NS.keyFor('main')),saved,'Idempotent polls do not rewrite a durable save');
const before=normalize(GAME.Maps.diner.npcs);
const restored=NS.load('main',{classic:JSON.parse(storage.get('tp_save')),classicAdvanced:false});
assert.ok(restored.ok,JSON.stringify(restored));A.setState(restored.state);
assert.deepEqual(normalize(GAME.Maps.diner.npcs),before,'Real saved-state restore must not reveal a previously missing body');
assert.equal(NP.syncClassicToNarrative(NR,restored.state,E.state.flags),false,'No change when flags are already imported');
NP.stop();
console.log('classic-cast-sync: real production poll, live/unloaded cast, durable restore and idempotence PASS (fixture, not campaign)');
