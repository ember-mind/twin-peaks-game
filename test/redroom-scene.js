'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const context=vm.createContext({console});
function load(file){vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});}
load('js/maps.js');
const G=context.GAME;
G.Maps=G.maps.maps;
G.Maps.isSolid=(id,x,y)=>G.maps.isSolid(G.Maps[id].rows[y][x]);
const delegates={};
function delegated(name){return function(){delegates[name]=(delegates[name]||0)+1;return name;};}
G.Sprites={drawTile:delegated('tile')};
G.sprites={drawStructures:delegated('structures'),drawForegroundStructures:delegated('foreground')};
G.Retro2D={limitBackgroundPalettes:delegated('limit')};
load('js/ambient-life.js');load('js/ambient-life-scenes.js');
load('js/redroom-art.js');load('js/redroom-scene.js');
const scene=G.RedRoomScene,art=G.RedRoomArt,map=G.Maps.redroom;
const before=JSON.stringify(map),solidBefore=map.rows.map((r,y)=>Array.from(r,(_,x)=>G.Maps.isSolid('redroom',x,y)));
const original={tile:G.Sprites.drawTile,structures:G.sprites.drawStructures,foreground:G.sprites.drawForegroundStructures,limit:G.Retro2D.limitBackgroundPalettes,ambient:G.AmbientLife.draw};
assert.equal(scene.install(),map,'install accepts empty pre-registry doors');
const firstHooks={tile:G.Sprites.drawTile,ambient:G.AmbientLife.draw};
scene.install();
assert.equal(G.Sprites.drawTile,firstHooks.tile);assert.equal(G.AmbientLife.draw,firstHooks.ambient);
assert.equal(JSON.stringify(map),before,'installation leaves all map fields/doors untouched');
assert.deepEqual(map.rows.map((r,y)=>Array.from(r,(_,x)=>G.Maps.isSolid('redroom',x,y))),solidBefore);
for(const p of Object.values(scene.actors))assert.equal(G.Maps.isSolid('redroom',p.x,p.y),false);
const cast=JSON.parse(fs.readFileSync(path.join(root,'narrative/cast/windows.json'),'utf8'));
for(const id of ['laura','mfap']) {
  const b=cast.characters[id].baseline;
  assert.equal(b.map_id,'redroom');assert.equal(b.x,scene.actors[id].x);assert.equal(b.y,scene.actors[id].y);
}
const bob=cast.windows.find(w=>w.id==='BOB_FINALE').cast.bob;
assert.equal(bob.x,scene.actors.bob.x);assert.equal(bob.y,scene.actors.bob.y);
assert.equal(G.Sprites.drawTile(null,'Z',0,0,0,0,[],{mapId:'town'}),'tile');
assert.equal(G.sprites.drawStructures(null,{id:'diner'},0,0),'structures');
assert.equal(G.sprites.drawForegroundStructures(null,{id:'diner'},0,0,{}),'foreground');
assert.equal(G.Retro2D.limitBackgroundPalettes(null,0,0,256,192,'town'),'limit');
assert.equal(G.Sprites.drawTile(null,'Z',0,0,0,0,[],{mapId:'redroom'}),undefined);
assert.equal(G.Retro2D.limitBackgroundPalettes(null,0,0,256,192,'redroom'),undefined);
const palette=new Set(Object.values(art.palette)),seen=new Set();
assert.equal(palette.size,5);
const ctx={globalAlpha:1,fillStyle:art.palette.ink,fillRect(x,y,w,h){
  assert.ok([x,y,w,h].every(Number.isInteger),'integer pixel rectangles');
  assert.equal(this.globalAlpha,1,'opaque scene pixel');
  assert.ok(palette.has(this.fillStyle),'no sixth hue: '+this.fillStyle);
  seen.add(this.fillStyle);
}};
G.sprites.drawStructures(ctx,map,0,0);
G.sprites.drawForegroundStructures(ctx,map,0,0,{forestDepthMin:48,forestDepthMax:112});
assert.equal(seen.size,5,'all five colors rendered');
/* A full chevron spans two 16px tiles; vertical bands remain exactly 4px. */
for(let x=0;x<256;x++)for(let y=32;y<176;y++){
  assert.equal(art.floorColor(x,y),art.floorColor(x+32,y));
  assert.equal(art.floorColor(x,y),art.floorColor(x,y+8));
  assert.notEqual(art.floorColor(x,y),art.floorColor(x,y+4));
  assert.ok([art.palette.cream,art.palette.ink].includes(art.floorColor(x,y)));
}
for(let x=0;x<32;x++){
  let start=0;
  while(art.floorColor(x,start)===art.floorColor(x,start-1))start++;
  for(let band=0;band<4;band++)for(let dy=0;dy<4;dy++){
    assert.equal(art.floorColor(x,start+band*4+dy),art.floorColor(x,start+band*4),'every contiguous band is exactly four pixels');
  }
}
for(let y=0;y<8;y++)for(let seam=16;seam<256;seam+=16){
  assert.equal(art.floorColor(seam-1,y),art.floorColor(seam,y),'the two sides of each tile seam share a continuous crest/trough');
}
/* A 2px horizontal step climbs one pixel, then descends symmetrically. */
for(let y=0;y<8;y++){
  for(let x=0;x<14;x+=2)assert.equal(art.floorColor(x,y),art.floorColor(x+2,y+1),'rising V edge');
  for(let x=16;x<30;x+=2)assert.equal(art.floorColor(x,y),art.floorColor(x+2,y-1),'falling V edge');
}
G.AmbientLife.reset(7);
let ambientDraws=0;
const ambientCtx={globalAlpha:.8,fillStyle:art.palette.cream,fillRect(x,y,w,h){
  ctx.fillRect.call(this,x,y,w,h);ambientDraws++;
}};
for(let t=0;t<60000;t+=160){
  G.AmbientLife.update(160,'redroom');
  G.AmbientLife.draw(ambientCtx,'redroom',0,0,-Infinity,Infinity);
  assert.equal(ambientCtx.globalAlpha,.8);assert.equal(ambientCtx.fillStyle,art.palette.cream);
}
assert.ok(ambientDraws>0,'ambient effects actually rendered');
const snapshot=G.AmbientLife.snapshot('redroom');
assert.equal(snapshot.items.length,4);
assert.ok(snapshot.items.every(i=>['MACHINE_IDLE_ACTIVITY','LIGHT_WARM_VARIATION'].includes(i.type)));
/* Foreign scenes retain their exact alpha/color/rectangle stream. */
G.AmbientLife.seek('diner',14000);
function recorder(){return {globalAlpha:.75,fillStyle:'#ffffff',marks:[],fillRect(x,y,w,h){this.marks.push([x,y,w,h,this.fillStyle,this.globalAlpha]);}};}
const foreignExpected=recorder(),foreignActual=recorder();
original.ambient(foreignExpected,'diner',3,5,-Infinity,Infinity);
G.AmbientLife.draw(foreignActual,'diner',3,5,-Infinity,Infinity);
assert.deepEqual(foreignActual.marks,foreignExpected.marks);
assert.equal(foreignActual.globalAlpha,foreignExpected.globalAlpha);
assert.equal(foreignActual.fillStyle,foreignExpected.fillStyle);
/* Registry and finale may change the exit after installation. Preserve that. */
map.doors['8,11']={to:'woods',tx:14,ty:5,dir:'down'};
const lateDoors=JSON.stringify(map.doors);
scene.uninstall();scene.uninstall();
assert.equal(G.Sprites.drawTile,original.tile);assert.equal(G.sprites.drawStructures,original.structures);
assert.equal(G.sprites.drawForegroundStructures,original.foreground);assert.equal(G.Retro2D.limitBackgroundPalettes,original.limit);
assert.equal(G.AmbientLife.draw,original.ambient);assert.equal(JSON.stringify(map.doors),lateDoors);
const row=map.rows[4];map.rows[4]=row.replace('Z','R');
assert.throws(()=>scene.install(),/rows diverge/);map.rows[4]=row;
const solid=G.Maps.isSolid;G.Maps.isSolid=(id,x,y)=>x===11&&y===2||solid(id,x,y);
assert.throws(()=>scene.install(),/blocked Cast Presence body laura/);G.Maps.isSolid=solid;
scene.install();assert.equal(JSON.stringify(map.doors),lateDoors);
for(const file of ['index.html','test/retro-scene.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  const names=['js/redroom-art.js','js/redroom-scene.js','js/redroom-production.js','js/world-connections-production.js'];
  names.forEach(n=>assert.ok(html.includes(n),file+' loads '+n));
  for(let i=1;i<names.length;i++)assert.ok(html.indexOf(names[i-1])<html.indexOf(names[i]),'script order');
}
G.AmbientLife.register('redroom',[{id:'invalid-hue',type:'MACHINE_IDLE_ACTIVITY',x:0,y:0,depth:0,
  variants:1,delay:[1,1],duration:[1000,1000],marks:[[{x:0,y:0,color:'#00ff00'}]]}]);
G.AmbientLife.update(100,'redroom');
assert.throws(()=>G.AmbientLife.draw(ctx,'redroom',0,0,-Infinity,Infinity),/ambient sixth hue/);
console.log('Red Room scene PASS: geometry, cast, doors, hooks, five opaque colors, floor phase, 60s ambient, lifecycle.');
