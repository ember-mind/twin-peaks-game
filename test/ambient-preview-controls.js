'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const {create}=require('../js/ambient-life.js');
const html=fs.readFileSync('test/ambient-life-preview.html','utf8');
const code=html.slice(html.indexOf(' let paused=false,'),html.indexOf(" setInterval(()=>document.querySelector('#clock')"));
const elements={},timers=new Map();let serial=0,copies=0;
const life=create(1989);global.GAME={AmbientLife:life};require('../js/ambient-life-scenes.js');life.update(0,'diner');
const state={actors:true,reactions:true};
function layer(key){return{setEnabled(v){state[key]=v;},setPaused(){},reset(){},play(){}};}
vm.runInNewContext(code,{document:{querySelector(id){return elements[id]??={textContent:'',getContext(){return{drawImage(){copies++;}};}};}},life,actors:layer('actors'),reactions:layer('reactions'),entry(){},wait:async()=>{},s:{map:{width:14,height:10}},w:{requestAnimationFrame(fn){fn();},document:{querySelector(){return{};}}},setInterval(fn){timers.set(++serial,fn);return serial;},clearInterval(id){timers.delete(id);}});
(async()=>{
for(const mode of ['#static','#reactive'])for(const trigger of ['#sip','#wipe','#entry','#lights','#neon','#glass']){
 elements[mode].onclick();assert.equal(life.snapshot('diner').enabled,false);
 await elements[trigger].onclick();assert.equal(life.snapshot('diner').enabled,true);assert.equal(state.actors,true);assert.equal(state.reactions,true);
}
for(const [button,id] of [['#lights','pendant-middle'],['#neon','double-r-neon'],['#glass','pie-glass']]){
 await elements[button].onclick();assert.equal(elements['#effect-detail'].hidden,false);
 assert.equal(life.snapshot('diner').paused,true);
 let active=0,rests=0,marks=0,ticks=0;
 while(timers.size){assert.ok(++ticks<3000,'preview terminates');for(const fn of [...timers.values()])fn();
  const e=life.snapshot('diner').items.find(e=>e.id===id);if(e.active)active++;else rests++;
  life.draw({globalAlpha:1,fillStyle:'',fillRect(){marks++;}},'diner',0,0);
 }
 assert.ok(active>15,'real event remains observable over multiple rendered ticks');assert.ok(rests>=24,'rest between real cycles');assert.ok(marks>0);assert.equal(life.snapshot('diner').paused,false);
}
await elements['#neon'].onclick();elements['#static'].onclick();assert.equal(timers.size,0);assert.equal(elements['#effect-detail'].hidden,true);
elements['#ambient'].onclick();assert.equal(life.snapshot('diner').paused,false);assert.ok(copies>100);
console.log('AMBIENT-PREVIEW-CONTROLS-PASS real seeded events, real-time replay, rest, zoom capture, cancellation and mode recovery');
})().catch(e=>{console.error(e);process.exitCode=1;});
