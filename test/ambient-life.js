'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {create}=require('../js/ambient-life.js');
function scene(seed=1989){global.GAME={AmbientLife:create(seed)};delete require.cache[require.resolve('../js/ambient-life-scenes.js')];require('../js/ambient-life-scenes.js');return GAME.AmbientLife;}
const a=scene(),b=scene();a.update(0,'diner');b.update(0,'diner');
assert.equal(a.snapshot('diner').items.length,10);
const first=a.snapshot('diner').items;
assert.equal(new Set(first.filter(x=>x.type==='LIGHT_WARM_VARIATION').map(x=>x.next)).size,3,'lamps have independent start clocks');
const active={},frames=new Set();
for(let t=0;t<120000;t+=20){
 a.update(20,'diner');
 for(const s of a.snapshot('diner').items){if(s.active)active[s.id]=(active[s.id]||0)+20;if(s.id==='counter-coffee')frames.add(s.frame);}
}
b.update(120000,'diner');assert.deepEqual(a.snapshot('diner'),b.snapshot('diner'),'scheduling independent of update partition');
assert.equal(frames.size,7,'seven steam states including breakup/rest');
assert(active['double-r-neon']/120000<.05,'neon stays normal over95%');
assert(Object.values(active).every(n=>n>0),'every archetype activates');
const snap=JSON.stringify(a.snapshot('diner'));
const ctx={globalAlpha:1,fillStyle:'#000',marks:[],fillRect(x,y,w,h){assert([x,y,w,h].every(Number.isInteger));this.marks.push([x,y,w,h,this.globalAlpha,this.fillStyle]);}};
a.seek('diner',first.find(x=>x.id==='pie-glass').next+1500);
const before=JSON.stringify(a.snapshot('diner'));
a.draw(ctx,'diner',0,0);const once=JSON.stringify(ctx.marks);ctx.marks=[];a.draw(ctx,'diner',0,0);
assert.equal(JSON.stringify(ctx.marks),once,'drawing is observational, no RNG or time consumption');assert.equal(JSON.stringify(a.snapshot('diner')),before);
assert.equal(ctx.globalAlpha,1);assert.equal(ctx.fillStyle,'#000');
ctx.marks=[];a.draw(ctx,'diner',0,0,-Infinity,64);a.draw(ctx,'diner',0,0,64,112);a.draw(ctx,'diner',0,0,112,Infinity);
assert.deepEqual(ctx.marks.slice().sort(),JSON.parse(once).sort(),'depth slices render each accent exactly once');
a.setPaused(true);a.update(1000,'diner');assert.equal(JSON.stringify(a.snapshot('diner').items),JSON.stringify(JSON.parse(before).items));
a.setPaused(false);a.update(1000,'town');assert.equal(JSON.stringify(a.snapshot('diner').items),JSON.stringify(JSON.parse(before).items),'off-map clocks pause');
a.setEnabled(false);ctx.marks=[];a.draw(ctx,'diner',0,0);assert.equal(ctx.marks.length,0,'disabled layer leaves base untouched');
const custom=create(4);custom.register('hotel',[{id:'urn',type:'STEAM_SMALL',x:12,y:24,depth:32},{id:'off',type:'LIGHT_NEON',x:0,y:0,depth:0,enabled:false}]);custom.update(25000,'hotel');assert.equal(custom.snapshot('hotel').items[1].events,0);
assert.throws(()=>custom.register('bad',[{id:'x',type:'STEAM_SMALL',x:.5,y:0,depth:0}]),/integer/);
const engine=fs.readFileSync('js/engine.js','utf8');assert(engine.includes('GAME.AmbientLife.update(dt, S.mapId)'));assert(engine.includes('GAME.AmbientLife.draw(g,S.mapId,cx,cy,footY,nextFootY)'));
console.log('AMBIENT-LIFE-PASS clocks, duty cycle,7 steam states, independent lamps, deterministic replay, read-only draw, depth, pause, disable and reuse');

// v0.1.1: variant/duration changes happen only after a completed rest frame.
const organic=create(1989);organic.register('lab',[{id:'steam',type:'STEAM_SMALL',x:0,y:0,depth:1,variants:3,duration:[1200,1360]}]);organic.update(0,'lab');
const variants=new Set(),durations=new Set();let previous=organic.snapshot('lab').items[0];
for(let cycle=0;cycle<48;cycle++){
 organic.seek('lab',previous.end-1);const terminal=organic.snapshot('lab').items[0];
 assert.equal(terminal.frame,6,'variant held through final empty breakup state');
 const blank={globalAlpha:1,fillStyle:'',fillRect(){throw new Error('cycle transition must pass through rest');}};organic.draw(blank,'lab',0,0);
 organic.update(1,'lab');const next=organic.snapshot('lab').items[0];
 assert.equal(next.frame,0);assert.equal(next.start,previous.end);assert.notEqual(next.variant,previous.variant,'no immediate variant repeat');
 assert(next.duration>=1200&&next.duration<=1360);variants.add(next.variant);durations.add(next.duration);previous=next;
}
assert.equal(variants.size,3);assert(durations.size>12,'minute contains varied durations, not a short GIF cadence');
const single=create(3);single.register('one',[{id:'steam',type:'STEAM_SMALL',x:0,y:0,depth:1,variants:1}]);single.update(60000,'one');assert.equal(single.snapshot('one').items[0].variant,0,'single-variant effects remain valid');
const defs=[{id:'steam',type:'STEAM_SMALL',x:0,y:0,depth:1},{id:'lamp',type:'LIGHT_WARM_VARIATION',x:0,y:0,depth:0}];
const normal=create(12),reordered=create(12);normal.register('lab',defs);reordered.register('lab',[...defs].reverse());normal.update(60000,'lab');reordered.update(60000,'lab');
for(const e of normal.snapshot('lab').items)assert.deepEqual(e,reordered.snapshot('lab').items.find(x=>x.id===e.id),'registration ordering cannot couple clocks');
console.log('AMBIENT-ORGANIC-PASS 48 seamless cycles,3 variants,no adjacent repeat,duration jitter,single variant and ordering independence');
