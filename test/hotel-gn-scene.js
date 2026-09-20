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
const solidCells=[];for(let y=1;y<11;y++)for(let x=1;x<19;x++)if('CUht'.includes(map.rows[y][x]))solidCells.push(x+','+y);
assert.deepEqual(plain(art.props.flatMap(d=>d.cells.map(c=>c.join(','))).sort()),solidCells.sort(),'all solid furniture glyphs visibly occupied');
const authoredPalette=new Set(Object.values(art.palette));
const ctx={globalAlpha:.75,fillStyle:'before',marks:[],overlayMarks:[],fillRect(x,y,w,h){
  assert.ok([x,y,w,h].every(Number.isInteger),'sharp integer pixel rectangles');
  assert.ok(w>0&&h>0);
  assert.ok(authoredPalette.has(this.fillStyle),'authored palette only');
  if(this.globalAlpha===1){
    this.marks.push([x,y,w,h,this.fillStyle]);
  }else{
    assert.ok(this.globalAlpha>0&&this.globalAlpha<=.19,'light overlays stay low-alpha');
    assert.ok(this.fillStyle===art.palette.fire||this.fillStyle===art.palette.gold,'light overlays use authored warm colors');
    assert.equal(h,1,'light pools use one-pixel row spans');
    this.overlayMarks.push([x,y,w,h,this.fillStyle,this.globalAlpha]);
  }
}};
G.sprites.drawStructures(ctx,map,.25,.75);assert.equal(ctx.globalAlpha,.75);
assert.equal(new Set(ctx.marks.map(m=>m[4])).size,Object.keys(art.palette).length,'whole scene palette renders');
assert.ok(ctx.overlayMarks.length>0,'light pools render translucent rows');
assert.ok(ctx.overlayMarks.some(m=>m[4]===art.palette.fire),'hearth/chandelier fire tone reaches receiving surfaces');
assert.ok(ctx.overlayMarks.some(m=>m[4]===art.palette.gold),'inner pool uses authored gold tone');
/* A fresh PNG-only critic read the round-1 lobby as a room split by "a flat
 * vertical band with no perspective break", behind a log wall that "repeats
 * the same brick-like unit across the entire upper half at uniform contrast",
 * with a stair and a left picture that "read as abstract stripes and boxes"
 * at 1x. Lock each fix against the recorded marks of one real scene draw. */
/* drawStructures ran with cy=.75, which the painter rounds to 1, so every
 * recorded y is one below its authored value. Normalise once. */
const shell=ctx.marks.map(m=>[m[0],m[1]+1,m[2],m[3],m[4]]);
function markAt(x,y,w,h){return shell.filter(m=>m[0]===x&&m[1]===y&&m[2]===w&&m[3]===h);}

/* 1. The runner tapers. Its ink bands are the widest rects that start inside
 * x=130..145 and span the runner's height; the north band must be narrower
 * than the south one and there must be several intermediate widths. */
const runnerBands=shell.filter(m=>m[4]===art.palette.ink&&m[0]>=130&&m[0]<=150&&
  m[2]>=30&&m[2]<=56&&m[3]>=10&&m[1]>=40&&m[1]<176);
assert.ok(runnerBands.length>=6,'the runner is built from stepped bands, got '+runnerBands.length);
const widths=runnerBands.map(m=>m[2]);
assert.ok(new Set(widths).size>=6,'the runner taper has at least six distinct widths');
const north=runnerBands.reduce((a,b)=>b[1]<a[1]?b:a);
const south=runnerBands.reduce((a,b)=>b[1]>a[1]?b:a);
assert.ok(north[2]<south[2],
  'the runner is narrower at the wall than at the doors ('+north[2]+' vs '+south[2]+')');
/* Fringe at both short ends, and the lounge rug reaching its west edge. */
assert.ok(shell.filter(m=>m[4]===art.palette.cream&&m[2]===1&&m[3]<=3&&m[1]>=60&&m[1]<=66).length>=8,
  'the runner carries a woven fringe at the wall end');
assert.ok(shell.filter(m=>m[4]===art.palette.cream&&m[2]===1&&m[3]<=3&&m[1]>=170).length>=10,
  'the runner carries a woven fringe at the door end');
assert.ok(markAt(40,84,96,52).length===1,'the lounge rug reaches the runner edge at x=136');
/* Something crosses it: the counter shadow steps onto the runner's east half. */
const crossing=shell.filter(m=>m[1]>=130&&m[1]<=148&&m[0]<184&&m[0]+m[2]>168&&
  (m[4]===art.palette.ink||m[4]===art.palette.redDark));
assert.ok(crossing.length>=4,'the counter shadow crosses the runner east edge');

/* 2. The log wall recedes: no lit highlight on any log face. Round 1 drew a
 * wallLight line on every course, which is what made the wall shout. */
const courseHighlights=shell.filter(m=>m[4]===art.palette.wallLight&&
  m[1]>=7&&m[1]<58&&m[2]>=20&&m[3]===1);
assert.equal(courseHighlights.length,0,
  'no lit edge on the log courses: '+JSON.stringify(courseHighlights.slice(0,3)));
const courseFaces=shell.filter(m=>m[1]>=7&&m[1]<51&&m[3]===10&&
  (m[4]===art.palette.wall||m[4]===art.palette.wallDark));
assert.ok(courseFaces.length>=12,'the log courses are still drawn');
assert.ok(new Set(courseFaces.map(m=>m[2])).size>=3,
  'the log run varies in length instead of repeating one unit');
assert.ok(markAt(16,51,288,7).length===1,'a darker band falls away under the ceiling beam');

/* 3. The stair reads as steps: a dark riser under a light tread with a lit
 * nosing, twelve times, plus one newel post at the foot of the flight. */
const risers=shell.filter(m=>m[4]===art.palette.wallDark&&m[0]>=236&&m[3]===4&&m[2]>20);
const treads=shell.filter(m=>m[4]===art.palette.oak&&m[0]>=236&&m[3]===4&&m[2]>20);
const nosings=shell.filter(m=>m[4]===art.palette.oakHi&&m[0]>=236&&m[3]===1&&m[2]>20);
assert.equal(risers.length,12,'twelve risers');
assert.equal(treads.length,12,'twelve treads');
assert.equal(nosings.length,12,'every tread carries a lit nosing');
assert.ok(markAt(236,128,10,26).length===1,'a newel post anchors the foot of the flight');

/* 4. The framed picture hung entirely behind the fireplace stack (x24..104)
 * in round 1, so it was paint nobody could see. It hangs clear of it now and
 * carries a horizon line. */
const frame=shell.filter(m=>m[4]===art.palette.gold&&m[2]===34&&m[3]===28);
assert.equal(frame.length,1,'the framed picture is painted once');
assert.ok(frame[0][0]>=104,'the picture hangs clear of the fireplace stack, at x='+frame[0][0]);
assert.ok(shell.some(m=>m[4]===art.palette.ink&&m[0]===110&&m[3]===1&&m[2]===26),
  'the picture carries a horizon line');

ctx.marks=[];
G.sprites.drawForegroundStructures(ctx,map,0,0,{forestDepthMin:80,forestDepthMax:81});
assert.ok(ctx.marks.length>0,'foreground includes hearth at exact depth');
ctx.marks=[];G.sprites.drawForegroundStructures(ctx,map,0,0,{forestDepthMin:81,forestDepthMax:111});
assert.equal(ctx.marks.length,0,'foreground excludes props outside depth slice');
assert.equal(G.Sprites.drawTile(ctx,'f',0,0,0,0,[],{mapId:'hotel_gn'}),undefined);
assert.equal(G.Retro2D.limitBackgroundPalettes(ctx,0,0,320,192,'hotel_gn'),undefined);
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
assert.deepEqual(defs.map(d=>d.id),['lobby-fire','lobby-hearth-glow','lobby-chandelier','lobby-desk-lamp']);
assert.deepEqual(defs.map(d=>d.type),['MACHINE_IDLE_ACTIVITY','LIGHT_WARM_VARIATION','LIGHT_WARM_VARIATION','LIGHT_WARM_VARIATION']);
const fire=defs[0];assert.equal(fire.variants,3);assert.equal(fire.marks.length,3);
assert.equal(new Set(fire.marks.map(JSON.stringify)).size,3,'three distinct flame silhouettes');
const byId=Object.fromEntries(defs.map(d=>[d.id,d]));
const deskLamp=byId['lobby-desk-lamp'];
assert.ok(deskLamp.regions.some(r=>r.x===225&&r.y===122),'desk lamp reaches transaction edge');
assert.ok(deskLamp.regions.some(r=>r.x===225&&r.y===112),'desk lamp reaches key cubbies');
assert.ok(deskLamp.regions.some(r=>r.y===124),'desk lamp reaches the counter top');
const hearth=byId['lobby-hearth-glow'];
assert.ok(hearth.regions.some(r=>r.depth===80&&r.y<50),'fire light reaches the hearth stone');
assert.ok(hearth.regions.some(r=>r.depth===112),'fire light reaches the near chair');
assert.ok(hearth.regions.some(r=>r.depth===0&&r.y>=82),'fire light reaches the floor in front of it');
const chandelier=byId['lobby-chandelier'];
/* The runner tapered, so its two vertical edge receivers moved with it: at
 * the north end the strip is 36px wide and the old x138/x179 fell onto bare
 * oak, where this archetype's dim paints nothing. */
for(const edge of chandelier.regions.filter(r=>r.h>=10)){
  assert.ok(edge.x>=142&&edge.x+edge.w<=178,
    'runner edge region '+edge.x+','+edge.y+' stays on the tapered strip');
  assert.ok(edge.y>=64,'runner edge region starts below the wall foot at y=64');
}
assert.ok(chandelier.regions.some(r=>r.y>=58&&r.y<66&&r.depth===0),'chandelier light reaches the ceiling beam under it');
assert.ok(chandelier.regions.some(r=>r.y>=90&&r.depth===0),'chandelier light reaches the runner');

/* The E8 temporal unit failed twice because each source was active for a
 * couple of seconds out of every fifteen, so a sampled frame almost always
 * caught the room at rest. Lock the fix: every light is lit most of the time,
 * the room is never entirely still for long, no region is bigger than a small
 * patch, and no two sources share a cycle length. */
const REGION_MAX_PX=48;
for(const def of defs){
  for(const r of (def.regions||[])){
    assert.ok(Number.isInteger(r.x)&&Number.isInteger(r.y)&&r.w>0&&r.h>0,def.id+': integer region');
    assert.ok(r.w*r.h<=REGION_MAX_PX,def.id+': region '+r.x+','+r.y+' is '+(r.w*r.h)+'px, over '+REGION_MAX_PX);
  }
}
const cycles=defs.map(d=>d.duration[0]+d.delay[0]);
assert.equal(new Set(cycles).size,defs.length,'each practical runs on its own cycle length: '+cycles.join(','));
assert.equal(new Set(defs.map(d=>d.firstDelay[0])).size,defs.length,'each practical starts on its own offset');
for(const def of defs.slice(1)){
  const on=def.duration[0]/(def.duration[0]+def.delay[0]);
  assert.ok(on>=.6&&on<=.75,def.id+': duty cycle '+(on*100).toFixed(0)+'% must breathe, not blink');
  assert.ok(def.duration[0]>=4000,def.id+': a five-frame ramp under 4s reads as a flicker');
  assert.ok(def.intensity<=.6,def.id+': intensity '+def.intensity+' is a pulse, not a breath');
}

/* No light region may land on a Cast Presence body. Ben stands at 12,7 and
 * Audrey at 15,9; a region at or past a body's foot line is repainted over
 * that body by the engine's depth slices. */
const BODIES={benhorne:{x:12,y:7},audrey:{x:15,y:9}};
for(const [who,cell] of Object.entries(BODIES)){
  const box={x:cell.x*16,y:cell.y*16-8,w:16,h:24},foot=(cell.y+1)*16;
  for(const def of defs){
    for(const r of (def.regions||[])){
      const overlaps=r.x<box.x+box.w&&r.x+r.w>box.x&&r.y<box.y+box.h&&r.y+r.h>box.y;
      assert.ok(!(overlaps&&r.depth>=foot),
        def.id+': region '+r.x+','+r.y+' is painted over '+who+' at '+cell.x+','+cell.y);
    }
  }
}
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
G.Maps.isSolid=(id,x,y)=>id==='hotel_gn'&&x===12&&y===7||solid(id,x,y);
assert.throws(()=>scene.install(),/blocked Cast Presence body benhorne/);G.Maps.isSolid=solid;
G.Maps.isSolid=(id,x,y)=>id==='hotel_gn'&&x===9&&y===10||solid(id,x,y);
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
console.log('Great Northern scene PASS: exact map/room/registry locks, no door access at install, '+
  'footprints, actor routes, hooks, integer art, three ambient types, 60s fire variants, '+
  'runner taper and crossings, receding log wall, stair tread rhythm, visible framed picture, '+
  'late-door lifecycle and script order.');
