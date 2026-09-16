'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const context=vm.createContext({console});
function load(file){vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});}
function plain(value){return JSON.parse(JSON.stringify(value));}
load('js/maps.js');
const G=context.GAME;G.Maps=G.maps.maps;
G.Maps.isSolid=(id,x,y)=>G.maps.isSolid(G.Maps[id].rows[y][x]);
load('js/location-connections.js');load('js/world-connections.gen.js');
const calls=[];
function delegate(name){return function(){calls.push([name,this,Array.from(arguments)]);return name;};}
G.Sprites={drawTile:delegate('tile')};
G.sprites={drawStructures:delegate('structures'),drawForegroundStructures:delegate('foreground')};
G.Retro2D={limitBackgroundPalettes:delegate('limit')};
load('js/ambient-life.js');
const definitions={},register=G.AmbientLife.register;
G.AmbientLife.register=function(id,defs){definitions[id]=plain(defs);return register(id,defs);};
load('js/ambient-life-scenes.js');load('js/hotel-gn-art.js');load('js/hotel-gn-scene.js');
const scene=G.HotelGNScene,art=G.HotelGNArt,map=G.Maps.hotel_gn,room=G.Maps.room_315;
const before=JSON.stringify(map),roomBefore=JSON.stringify(room);
const original={tile:G.Sprites.drawTile,structures:G.sprites.drawStructures,foreground:G.sprites.drawForegroundStructures,limit:G.Retro2D.limitBackgroundPalettes,ambient:G.AmbientLife.draw};
const oldDoors=map.doors;
/* A getter that throws proves installation never inspects this field, even
 * indirectly through LocationConnections' endpoint validator. */
Object.defineProperty(map,'doors',{configurable:true,get(){throw new Error('FORBIDDEN lobby door read');},set(){throw new Error('FORBIDDEN lobby door write');}});
assert.equal(scene.install(),map);
const first=G.Sprites.drawTile;
scene.install();assert.equal(G.Sprites.drawTile,first,'idempotent hook install');
scene.validate();scene.uninstall();scene.uninstall();scene.install();
Object.defineProperty(map,'doors',{configurable:true,writable:true,enumerable:true,value:oldDoors});
assert.equal(JSON.stringify(map),before,'all lobby data unchanged');
assert.equal(JSON.stringify(room),roomBefore,'all room 315 data unchanged');
assert.equal(G.AmbientLife.draw,original.ambient,'uses ambient engine unchanged');
assert.deepEqual(plain(scene.rows),plain(map.rows));
const cast=JSON.parse(fs.readFileSync(path.join(root,'narrative/cast/windows.json'),'utf8'));
for(const [id,pos] of Object.entries(scene.actors)){
  const actual=cast.characters[id].baseline;
  assert.equal(actual.map_id,'hotel_gn');assert.equal(actual.x,pos.x);assert.equal(actual.y,pos.y);
  assert.equal(G.Maps.isSolid('hotel_gn',pos.x,pos.y),false);
}
const registry=JSON.parse(fs.readFileSync(path.join(root,'world/connections.json'),'utf8'));
const records=Array.isArray(registry)?registry:registry.connections;
const ids=['town-great-northern-lobby','great-northern-room-315-hall'];
const canonical=G.LocationConnections.connectionRecordsFor(ids);
for(const record of canonical)assert.deepEqual(plain(record),records.find(r=>r.id===record.id),'generated and canonical record exact');
for(const d of art.props)for(const [x,y] of d.cells)assert.equal(G.Maps.isSolid('hotel_gn',x,y),true,d.id+' has grounded solid footprint');
const solidCells=[];for(let y=1;y<11;y++)for(let x=1;x<17;x++)if('CUht'.includes(map.rows[y][x]))solidCells.push(x+','+y);
assert.deepEqual(plain(art.props.flatMap(d=>d.cells.map(c=>c.join(','))).sort()),solidCells.sort(),'all solid furniture glyphs visibly occupied');
const ctx={globalAlpha:.75,fillStyle:'before',marks:[],fillRect(x,y,w,h){
  assert.ok([x,y,w,h].every(Number.isInteger),'sharp integer pixel rectangles');
  assert.ok(w>0&&h>0);assert.equal(this.globalAlpha,1,'opaque base art');
  assert.ok(Object.values(art.palette).includes(this.fillStyle),'authored palette only');
  this.marks.push([x,y,w,h,this.fillStyle]);
}};
G.sprites.drawStructures(ctx,map,.25,.75);assert.equal(ctx.globalAlpha,.75);
assert.equal(new Set(ctx.marks.map(m=>m[4])).size,Object.keys(art.palette).length,'whole scene palette renders');
ctx.marks=[];
G.sprites.drawForegroundStructures(ctx,map,0,0,{forestDepthMin:80,forestDepthMax:81});
assert.ok(ctx.marks.length>0,'foreground includes hearth at exact depth');
ctx.marks=[];G.sprites.drawForegroundStructures(ctx,map,0,0,{forestDepthMin:81,forestDepthMax:111});
assert.equal(ctx.marks.length,0,'foreground excludes props outside depth slice');
assert.equal(G.Sprites.drawTile(ctx,'f',0,0,0,0,[],{mapId:'hotel_gn'}),undefined);
assert.equal(G.Retro2D.limitBackgroundPalettes(ctx,0,0,288,192,'hotel_gn'),undefined);
assert.equal(G.Sprites.drawTile(ctx,'f',1,2,3,4,[],{mapId:'town'}),'tile');
assert.equal(G.sprites.drawStructures(ctx,{id:'diner'},3,5),'structures');
assert.equal(G.sprites.drawForegroundStructures(ctx,{id:'room_315'},3,5,{forestDepthMin:2}),'foreground');
assert.equal(G.Retro2D.limitBackgroundPalettes(ctx,3,5,160,144,'redroom'),'limit');
assert.equal(calls.length,4,'only foreign scenes delegated');
assert.equal(calls[0][1],G.Sprites);assert.equal(calls[1][1],G.sprites);assert.equal(calls[3][1],G.Retro2D);
assert.equal(calls[0][2][2],1);assert.equal(calls[0][2][6].length,0);assert.equal(calls[2][2][4].forestDepthMin,2);
/* The production render order paints structures before actors, then the
 * depth-sliced foreground; hook installation must not move these passes. */
const engine=fs.readFileSync(path.join(root,'js/engine.js'),'utf8');
assert.ok(engine.includes('drawForegroundStructures'));
const defs=definitions.hotel_gn;
assert.equal(defs.length,4);
assert.deepEqual(defs.map(d=>d.type),['MACHINE_IDLE_ACTIVITY','LIGHT_WARM_VARIATION','LIGHT_WARM_VARIATION','GLASS_SUBTLE_REFLECTION']);
const fire=defs[0];assert.equal(fire.variants,3);assert.equal(fire.marks.length,3);
assert.equal(new Set(fire.marks.map(JSON.stringify)).size,3,'three distinct flame silhouettes');
const deskLamp=defs[2];assert.equal(deskLamp.id,'lobby-desk-lamp');
assert.ok(deskLamp.regions.some(r=>r.x===112&&r.y===123),'desk lamp reaches transaction edge');
assert.ok(deskLamp.regions.some(r=>r.x===110&&r.y===107),'desk lamp reaches key cubbies');
G.AmbientLife.reset(7);
let marks=0;const fireVariants=new Set();
const ambientCtx={globalAlpha:.8,fillStyle:'original',fillRect(x,y,w,h){
  assert.ok([x,y,w,h].every(Number.isInteger));assert.ok(w>0&&h>0);marks++;
}};
for(let t=0;t<60000;t+=80){
  G.AmbientLife.update(80,'hotel_gn');G.AmbientLife.draw(ambientCtx,'hotel_gn',3,5,-Infinity,Infinity);
  const fireState=G.AmbientLife.snapshot('hotel_gn').items.find(i=>i.id==='lobby-fire');
  if(fireState.active)fireVariants.add(fireState.variant);
  assert.equal(ambientCtx.globalAlpha,.8);assert.equal(ambientCtx.fillStyle,'original');
}
assert.ok(marks>0);assert.equal(fireVariants.size,3,'60 seconds exercises every fire variant');
const snapshot=G.AmbientLife.snapshot('hotel_gn');
assert.ok(snapshot.items.every(i=>i.events>0),'each ambient practical animates within 60 seconds');
assert.equal(JSON.stringify(map),before);assert.equal(JSON.stringify(room),roomBefore);
/* Real late connection compilation, then lifecycle, preserves the exact
 * descriptor identities as well as the JSON and all object identities. */
const installs=canonical.map(c=>G.LocationConnections.install(c,G.Maps));
const late=JSON.stringify(map.doors),lateRoom=JSON.stringify(room.doors);
const doorEntries=Object.entries(map.doors),mapIdentity=map,roomIdentity=room;
const objects=map.objects;
scene.uninstall();scene.uninstall();
assert.equal(G.Sprites.drawTile,original.tile);assert.equal(G.sprites.drawStructures,original.structures);
assert.equal(G.sprites.drawForegroundStructures,original.foreground);assert.equal(G.Retro2D.limitBackgroundPalettes,original.limit);
scene.install();assert.equal(JSON.stringify(map.doors),late);assert.equal(JSON.stringify(room.doors),lateRoom);
for(const [key,value] of doorEntries)assert.equal(map.doors[key],value);
assert.equal(G.Maps.hotel_gn,mapIdentity);assert.equal(G.Maps.room_315,roomIdentity);assert.equal(map.objects,objects);
function failMutation(object,key,value,pattern){const old=object[key];object[key]=value;assert.throws(()=>scene.install(),pattern);object[key]=old;}
failMutation(map,'width',17,/dimensions diverge/);
failMutation(map,'rows',map.rows.map((r,i)=>i===9?r.replace('f','i'):r),/rows diverge/);
failMutation(room,'width',17,/room_315 geometry diverges/);
failMutation(room,'rows',room.rows.map((r,i)=>i===9?r.replace('.','T'):r),/room_315 geometry diverges/);
failMutation(room,'onEnter',{dialogue:'changed',once:'intro_hotel'},/room_315 onEnter diverges/);
for(const record of canonical){
  const changed=plain(G.WorldData.connections);changed.find(c=>c.id===record.id).b.spawn.ty=0;
  failMutation(G.WorldData,'connections',changed,/canonical connection diverges/);
}
const solid=G.Maps.isSolid;
G.Maps.isSolid=(id,x,y)=>id==='hotel_gn'&&x===5&&y===7||solid(id,x,y);
assert.throws(()=>scene.install(),/blocked Cast Presence body benhorne/);G.Maps.isSolid=solid;
G.Maps.isSolid=(id,x,y)=>id==='hotel_gn'&&x===8&&y===10||solid(id,x,y);
assert.throws(()=>scene.install(),/blocked entrance walk spine/);G.Maps.isSolid=solid;
scene.validate();installs.forEach(i=>i.uninstall());
assert.equal(JSON.stringify(map),before);assert.equal(JSON.stringify(room),roomBefore);
for(const file of ['index.html','test/retro-scene.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  const names=['js/location-connections.js','js/world-connections.gen.js','js/hotel-gn-art.js','js/hotel-gn-scene.js','js/hotel-gn-production.js','js/world-connections-production.js'];
  names.forEach(n=>assert.ok(html.includes(n),file+' loads '+n));
  for(let i=1;i<names.length;i++)assert.ok(html.indexOf(names[i-1])<html.indexOf(names[i]),'registry before lobby before door compilation');
}
for(const name of ['js/retro.js','js/retro-authored.js','js/tiles.js']){
  assert.equal(fs.readFileSync(path.join(root,name),'utf8').includes('HotelGN'),false,'protected renderer contains no lobby integration');
}
console.log('Great Northern scene PASS: exact map/room/registry locks, no door access at install, footprints, actor routes, hooks, integer art, three ambient types, 60s fire variants, late-door lifecycle and script order.');
