'use strict';
const assert = require('node:assert/strict');
const { PAD, pointFor, assertLayout, stepCandidate } = require('./lib/touch-preflight');
const clone=(v)=>JSON.parse(JSON.stringify(v));
let checks=0;
const s={touchControls:[{label:PAD,visible:true,rect:{x:10,y:200,width:150,height:150}},
  {label:'A',visible:true,rect:{x:250,y:240,width:64,height:64}},
  {label:'A',visible:false,rect:{x:0,y:0,width:0,height:0}}]};
assert.deepEqual(pointFor(s,'A'),[282,272]);checks++;
assert.deepEqual(pointFor(s,PAD,'up'),[85,223]);checks++;
assert.deepEqual(pointFor(s,PAD,'right'),[138,275]);checks++;
assert.deepEqual(pointFor(s,PAD,'down'),[85,328]);checks++;
assert.deepEqual(pointFor(s,PAD,'left'),[33,275]);checks++;
assertLayout(s,390,844);checks++;
for(const fn of [()=>pointFor(s,'missing'),()=>pointFor(s,'A','up'),()=>pointFor(s,PAD,'toString'),
  ()=>pointFor({touchControls:[s.touchControls[0],s.touchControls[0]]},PAD),
  ()=>pointFor({touchControls:[{label:PAD,visible:true,rect:{x:0,y:0,width:60,height:60}}]},PAD,'up'),
  ()=>assertLayout(s,200,844),()=>assertLayout(s,390,250),()=>assertLayout({},390,844)]){assert.throws(fn);checks++;}
const before=JSON.stringify(s);pointFor(s,PAD,'up');assertLayout(s,390,844);assert.equal(JSON.stringify(s),before);checks++;
const world={player:{tx:1,ty:1,dir:'up'},mapId:'town',map:{solid:['11111','10001','10001','11111']},doors:{town:{}},liveNpcs:[]};
assert.deepEqual(stepCandidate(world),{dir:'right',x:2,y:1});checks++;
const door=clone(world);door.doors.town['2,1']={to:'elsewhere'};assert.equal(stepCandidate(door).dir,'down');checks++;
const npc=clone(world);npc.liveNpcs=[{x:2,y:1}];assert.equal(stepCandidate(npc).dir,'down');checks++;
const closed=clone(door);closed.liveNpcs=[{x:1,y:2}];assert.throws(()=>stepCandidate(closed));checks++;
const overlap=clone(s);overlap.touchControls[1].rect.x=50;assert.throws(()=>assertLayout(overlap,390,844),/overlap/);checks++;
console.log('touch-preflight: '+checks+' pure geometry contracts passed; actual browser test is separate');
