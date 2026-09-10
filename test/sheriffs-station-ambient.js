'use strict';
const assert=require('node:assert/strict');
const {create}=require('../js/ambient-life.js');
function scene(seed){global.GAME={AmbientLife:create(seed)};delete require.cache[require.resolve('../js/ambient-life-scenes.js')];require('../js/ambient-life-scenes.js');return GAME.AmbientLife;}

// Capture the registered definitions directly instead of parsing source.
function captureDefs(){
  const life=create(1989), captured={};
  const realRegister=life.register.bind(life);
  life.register=function(id,defs){captured[id]=defs;return realRegister(id,defs);};
  global.GAME={AmbientLife:life};
  delete require.cache[require.resolve('../js/ambient-life-scenes.js')];
  require('../js/ambient-life-scenes.js');
  life.register=realRegister;
  return captured;
}

// Authored prop bounds for each registered element (js/sheriffs-station-art.js).
const BOUNDS={
  'mug-steam':{xMin:105,xMax:112,yMin:37,yMax:49},
  'dispatch-radio':{xMin:183,xMax:200,yMin:34,yMax:42},
  'rear-door-presence':{xMin:213,xMax:230,yMin:11,yMax:30},
  'fluorescent-west':{xMin:27,xMax:70,yMin:7,yMax:13},
  'sheriff-desk-lamp':{xMin:133,xMax:160,yMin:41,yMax:62}
};
const EXPECTED_TYPES={
  'mug-steam':'STEAM_SMALL',
  'dispatch-radio':'MACHINE_IDLE_ACTIVITY',
  'rear-door-presence':'LIGHT_WARM_VARIATION',
  'fluorescent-west':'MACHINE_IDLE_ACTIVITY',
  'sheriff-desk-lamp':'LIGHT_WARM_VARIATION'
};

const defs=captureDefs()['sheriff'];

// 1. exactly the five registered elements, correct ids and types.
assert.equal(defs.length,5,'sheriffs station registers exactly five ambient elements');
assert.deepEqual(defs.map(function(d){return d.id;}).sort(),Object.keys(BOUNDS).sort(),'registered ids match the authored set');
defs.forEach(function(d){assert.equal(d.type,EXPECTED_TYPES[d.id],'type for '+d.id+' matches the authored table');});

// 2. exactly one continuous element (mug-steam, STEAM_SMALL); no clock, no actor,
// no neon — the station still has no signature behavior of its own.
const steamCount=defs.filter(function(d){return d.type==='STEAM_SMALL';}).length;
assert.equal(steamCount,1,'exactly one continuous STEAM_SMALL element is registered: '+steamCount);
['CLOCK_TICK','ACTOR_ACTIVITY','LIGHT_NEON'].forEach(function(type){
  assert.equal(defs.filter(function(d){return d.type===type;}).length,0,'no '+type+' archetype registered');
});

// 3. quieter than the diner.
const shared=scene(1989);
shared.update(0,'sheriff');shared.update(0,'diner');
const items=shared.snapshot('sheriff').items;
const dinerItems=shared.snapshot('diner').items;
assert(items.length<dinerItems.length,'sheriffs station registers strictly fewer elements than diner');

// 4/5. containment + alpha ceiling: drive each element in isolation on a fresh
// instance so one element's rects can never be attributed to another, and record
// every fillRect the archetype's draw() emits across a long deterministic run.
const allAlphas=[];
function isolate(seed,def){
  const life=create(seed);
  life.register('iso',[def]);
  life.update(0,'iso');
  return life;
}
function recordRects(life,minutes){
  const rects=[];
  const stubCtx={globalAlpha:1,fillStyle:'',fillRect:function(x,y,w,h){rects.push({x:x,y:y,w:w,h:h,alpha:stubCtx.globalAlpha});}};
  for(let t=0;t<minutes*60000;t+=20){
    life.update(20,'iso');
    life.draw(stubCtx,'iso',0,0);
  }
  return rects;
}
defs.forEach(function(def){
  const life=isolate(1989,def);
  const rects=recordRects(life,10);
  assert(rects.length>0,def.id+' draws at least one rect across the run');
  const bounds=BOUNDS[def.id];
  rects.forEach(function(r){
    assert(r.x>=bounds.xMin,def.id+' rect x within prop bounds: '+r.x);
    assert(r.x+r.w-1<=bounds.xMax,def.id+' rect x+w-1 within prop bounds: '+(r.x+r.w-1));
    assert(r.y>=bounds.yMin,def.id+' rect y within prop bounds: '+r.y);
    assert(r.y+r.h-1<=bounds.yMax,def.id+' rect y+h-1 within prop bounds: '+(r.y+r.h-1));
    assert(r.alpha>0&&r.alpha<=1,def.id+' drawn alpha stays within (0,1]: '+r.alpha);
    allAlphas.push(r.alpha);
  });
});
assert(allAlphas.length>0,'alpha samples recorded across all elements');

// 6. duty cycle: every INTERMITTENT element (all except the continuous mug-steam)
// is active less than 35% of a 10-minute run. mug-steam is continuous by design
// and sits at ~100%, so it is deliberately excluded from this ceiling.
defs.filter(function(d){return d.id!=='mug-steam';}).forEach(function(def){
  const life=isolate(1989,def);
  let activeMs=0,totalMs=0;
  for(let t=0;t<600000;t+=20){
    life.update(20,'iso');
    totalMs+=20;
    if(life.snapshot('iso').items[0].active)activeMs+=20;
  }
  assert(activeMs/totalMs<.35,def.id+' active less than 35% of the time: '+(activeMs/totalMs));
});

// 7. idle gaps: for every element with a registered delay range, every observed
// idle gap falls within that element's own delay range (20ms sampling tolerance
// on the upper bound). Read the range from the captured def, never hardcoded.
// mug-steam declares no delay and is naturally excluded.
defs.filter(function(d){return d.delay;}).forEach(function(def){
  const life=isolate(1989,def);
  let idleStart=0,gapWasActive=false;
  const gaps=[];
  for(let t=0;t<600000;t+=20){
    life.update(20,'iso');
    const active=life.snapshot('iso').items[0].active;
    if(active){
      if(!gapWasActive){gaps.push(t-idleStart);gapWasActive=true;}
    } else {
      if(gapWasActive){idleStart=t;gapWasActive=false;}
    }
  }
  assert(gaps.length>0,def.id+' observed at least one idle gap');
  gaps.forEach(function(g){
    assert(g>=def.delay[0]&&g<=def.delay[1]+20,def.id+' idle gap within its own registered delay range: '+g);
  });
});

// 8. liveliness floor: over a deterministic 5-minute run of the full scene, at
// least 80% of sampled steps must emit at least one rect. This is the regression
// guard for "the room renders correctly but looks dead" — measured value is
// ~92.6%.
const livelinessScene=scene(1989);
let sampledSteps=0,liveSteps=0;
const livelinessCtx={globalAlpha:1,fillStyle:'',fillRect:function(){liveThisStep=true;}};
let liveThisStep=false;
for(let t=0;t<300000;t+=20){
  livelinessScene.update(20,'sheriff');
  liveThisStep=false;
  livelinessScene.draw(livelinessCtx,'sheriff',0,0);
  sampledSteps++;
  if(liveThisStep)liveSteps++;
}
assert(liveSteps/sampledSteps>=.80,'at least 80% of sampled steps emit at least one rect: '+(liveSteps/sampledSteps));

// 9. independent clocks: the five elements must not all share the same clock
// at scene start.
const clockScene=scene(1989);
clockScene.update(0,'sheriff');
const nexts=clockScene.snapshot('sheriff').items.map(function(i){return i.next;});
assert(new Set(nexts).size>1,'the five elements do not all share the same clock at scene start: '+nexts);

// 10. no EnvironmentReactions registered for the sheriff's station scene.
const {create:reactionsCreate,doorEntryFrames}=require('../js/environment-reactions.js');
global.GAME.EnvironmentReactions=reactionsCreate();
GAME.EnvironmentReactions.doorEntryFrames=doorEntryFrames;
delete require.cache[require.resolve('../js/ambient-life-scenes.js')];
require('../js/ambient-life-scenes.js');
assert.deepEqual(GAME.EnvironmentReactions.snapshot('sheriff'),[],'no environment reactions registered for sheriffs station');

console.log('SHERIFFS-STATION-AMBIENT-PASS five elements (one continuous), quieter than diner, per-element isolated containment + alpha ceiling, duty cycle, idle gaps, liveliness floor, independent clocks, no reactions');
