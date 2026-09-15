'use strict';
const assert = require('node:assert/strict');
global.window = global;
require('../js/tiles.js');
require('../js/chars.js');
require('../js/maps.js');
require('../js/data.js');
require('../js/scene-objects.gen.js'); require('../js/glue.js');
const map = GAME.Maps.diner;
const model = map.interior;
assert(model, 'generated interior model survives glue normalization');
assert.equal(map.width,14); assert.equal(map.height,10);
const [x,y,width] = model.counter;
for(let dx=0;dx<width;dx++) assert.equal(map.rows[y][x+dx],'C');
for(const [sx,sy] of model.stools) assert.equal(map.rows[sy][sx],'h');
for(const [bx,by,bw] of model.booths) {
  for(let dx=0;dx<bw;dx++) assert.equal(map.rows[by][bx+dx],'t');
  assert(bx===1 || bx+bw===13, 'booths meet west or east room boundary');
}
// Both sides of the central specials island stay open, as does entrance row.
for(let ay=5;ay<=8;ay++) for(const ax of [4,5,7,9]) {
  assert(!GAME.Maps.isSolid('diner',ax,ay,{clues:[]}), 'island bypass aisle remains open');
}
for(const [sx,sy] of [[6,6],[8,6]]) {
  assert(GAME.Maps.isSolid('diner',sx,sy,{clues:[]}), 'specials island has real collisions');
}
assert.deepEqual(Object.keys(map.doors),['6,9','7,9']);
assert.deepEqual(model.counter,[2,3,9],'polish preserves counter anchor');
assert.deepEqual(model.booths,[[1,6,3],[10,6,3],[1,8,3],[10,8,3]],'polish preserves booth architecture');
assert(!GAME.Maps.isSolid('diner',7,7,{clues:[]}), 'smaller offset board frees old entrance sightline cell');
for (const includeJames of [false,true]) {
  const actors=map.npcs.filter(n=>includeJames || n.id!=='james');
  const occupied=new Set(actors.map(n=>`${n.x},${n.y}`));
  const seen=new Set(),queue=[[6,8]];
  while(queue.length) {
    const [px,py]=queue.shift(),key=`${px},${py}`;
    if(seen.has(key)||occupied.has(key)||GAME.Maps.isSolid('diner',px,py,{clues:[]})) continue;
    seen.add(key); queue.push([px+1,py],[px-1,py],[px,py+1],[px,py-1]);
  }
  for(const n of actors) assert([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>seen.has(`${n.x+dx},${n.y+dy}`)),`${n.id}: reachable with active patrons`);
  assert(seen.has('5,5') && seen.has('8,5'),'both bypass paths reach service zone');
}

assert.equal(map.npcs.find(n=>n.id==='james').x,9,'conditional NPC remains beside booth and outside island');
require('../js/retro-authored.js');
const kit=GAME.Retro2D.interiorKit;
assert(kit && kit.materials[model.material]);
for (const guest of model.guests.filter(Boolean)) {
  const pixels=new Map();
  const poseContext={fillRect(x,y,w,h){
    assert([x,y,w,h].every(Number.isInteger),'seated sprite stays on native pixels');
    for(let py=y;py<y+h;py++) for(let px=x;px<x+w;px++) pixels.set(`${px},${py}`,this.fillStyle);
  }};
  const pose=kit.seatedGuest(poseContext,0,0,guest);
  const todo=[[...pixels.keys()][0]], seen=new Set();
  while(todo.length){const k=todo.pop();if(seen.has(k)||!pixels.has(k))continue;seen.add(k);const [x,y]=k.split(',').map(Number);todo.push(`${x+1},${y}`,`${x-1},${y}`,`${x},${y+1}`,`${x},${y-1}`);}
  assert.equal(seen.size,pixels.size,'seated head, neck, torso and limbs form one connected silhouette');
  assert(pixels.has('8,12') && pixels.has('8,15'),'visible neck and chest are authored');
  pixels.clear(); kit.seatedHands(poseContext,pose);
  const handX=pose.mirror?7:8, farHandX=pose.mirror?3:12;
  assert(pixels.has(`${handX},17`) && pixels.has(`${farHandX},16`),'asymmetric resting hands continue the original seated pose');
  assert([...pixels.keys()].every(k=>Number(k.split(',')[1])>=15),'foreground pass never creates a second torso');
  pixels.clear(); kit.occupiedTable(poseContext,0,0,48,kit.materials.diner,guest);
  assert([...pixels.keys()].every(k=>Number(k.split(',')[1])>=3),'occupied table props leave cuff and hand rows clear');
}

// Environmental accents use world distance; neutral entrance never inherits lamp light.
assert(kit.actorLight(60,20)>kit.actorLight(104,136),'nearby lamp affects actor more than neutral entrance');
assert.equal(kit.actorLight(104,136),0,'entrance retains unlit sprite palette');
assert.equal(kit.actorLight(60,20),kit.actorLight(60,20),'light response is deterministic');
const contact=[];kit.contactShadow({fillRect(x,y,w,h){contact.push([x,y,w,h]);}},10,20,12,kit.materials.diner);
assert(contact.every(r=>r.every(Number.isInteger) && r[2]>0 && r[3]===1),'contact shadows consist of crisp native pixel rows');
assert(contact.every(([x,y,w])=>x>=10 && x+w<=22 && y>=20 && y<=22),'contact shadow stays inside compact footprint');

// Shared painters must translate cleanly with the camera at integer pixels.
function marks(dx,dy) {
 const draws=[];
 const ctx={fillRect(x,y,w,h){draws.push([x-dx,y-dy,w,h,this.fillStyle]);}};
 kit.booth(ctx,dx,dy,48,kit.materials.diner,0);
 kit.pieCase(ctx,dx+60,dy,48,kit.materials.diner);
 return draws;
}
assert.deepEqual(marks(0,0),marks(-37,19),'furniture stays anchored as camera moves');
let occlusionDraws=0;
const depthContext={fillRect(){occlusionDraws++;}};
GAME.sprites.drawForegroundStructures(depthContext,map,0,0,{forestDepthMin:48,forestDepthMax:80});
assert(occlusionDraws>0,'counter occludes staff behind it');
occlusionDraws=0;
GAME.sprites.drawForegroundStructures(depthContext,map,0,0,{forestDepthMin:145,forestDepthMax:Infinity});
assert.equal(occlusionDraws,0,'foreground never paints over entrance player');
assert(marks(0,0).every(r=>r.slice(0,4).every(Number.isInteger)&&r[2]>0&&r[3]>0));
console.log('DINER-LAYOUT-PASS generated geometry, aisle, doors, NPC and shared painter translation');
