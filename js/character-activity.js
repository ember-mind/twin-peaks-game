/* Sparse character life plus two authored Diner gestures. Seeded, actor-local clocks. */
(function(root){
  'use strict';
  var GAME=root.GAME=root.GAME||{};
  function create(seed){
    var clock=GAME.AmbientLife.create(seed),context=null,enabled=true,paused=false,manual={},cancelled={};
    var actorMaps={},actorRuntime={},actorManual={},lastMap=null,actorTimeScale=1,runtimeTime=0;
    var dinerDefs=[
      // Service stays quiet between the guest's sip and Norma's counter work.
      {id:'booth-sip',type:'ACTOR_ACTIVITY',x:183,y:80,depth:112,delay:[15000,18000],duration:[3000,3400]},
      {id:'counter-wipe',type:'ACTOR_ACTIVITY',x:80,y:32,depth:64,delay:[25000,28000],duration:[2800,3200]}
    ];
    clock.register('diner',dinerDefs);
    function actorKey(mapId,actorId,behaviorId){return 'character:'+mapId+':'+actorId+':'+behaviorId;}
    function runtimeKey(mapId,actorId){return mapId+':'+actorId;}
    function actorProfiles(mapId){return actorMaps[mapId]||[];}
    function findProfile(mapId,id){
      var profiles=actorProfiles(mapId);
      for(var i=0;i<profiles.length;i++)if(profiles[i].id===id)return profiles[i];
      return null;
    }
    function findNpc(state,id){
      var npcs=state&&state.npcs||[];
      for(var i=0;i<npcs.length;i++)if(npcs[i].id===id)return npcs[i];
      return null;
    }
    function validPair(pair){return Array.isArray(pair)&&pair.length===2&&pair[0]>0&&pair[1]>=pair[0];}
    function registerActors(mapId,profiles){
      if(typeof mapId!=='string'||!mapId||!Array.isArray(profiles))throw new Error('Invalid character activity registry');
      var ids={};
      actorMaps[mapId]=profiles.map(function(source){
        if(!source||typeof source.id!=='string'||!source.id||ids[source.id]||!Array.isArray(source.behaviors))throw new Error('Invalid character profile: '+(source&&source.id));
        ids[source.id]=true;
        var profile={id:source.id,focusDirection:source.focusDirection||null,lockFocus:!!source.lockFocus,behaviors:[]};
        source.behaviors.forEach(function(b){
          if(!b||typeof b.id!=='string'||!b.id||!validPair(b.delay)||!validPair(b.duration))throw new Error('Invalid character behavior: '+(b&&b.id));
          if(b.category!=='idle'&&b.category!=='contextual')throw new Error('Invalid character behavior category: '+b.category);
          profile.behaviors.push({id:b.id,category:b.category,animation:b.animation||b.id,
            delay:b.delay.slice(),duration:b.duration.slice(),variants:Math.max(1,b.variants||1),
            directions:Array.isArray(b.directions)?b.directions.slice():null,look:!!b.look,frames:b.frames||{}});
        });
        return profile;
      });
      var defs=mapId==='diner'?dinerDefs.slice():[];
      actorMaps[mapId].forEach(function(profile){profile.behaviors.forEach(function(b){
        defs.push({id:actorKey(mapId,profile.id,b.id),type:'ACTOR_ACTIVITY',x:0,y:0,depth:0,
          delay:b.delay,duration:b.duration,variants:b.variants});
      });});
      clock.register(mapId,defs);
      clock.update(0,mapId);
      return actorMaps[mapId].length;
    }
    function eligible(id){
      if(!context||context.mapId!=='diner'||context.mode!=='play')return false;
      if(id==='booth-sip')return true;
      var n=(context.npcs||[]).find(function(n){return n.id==='norma';});
      return !!n&&!n.moving&&n.x===5&&n.y===2&&!context.dialogue&&!context.menu;
    }
    function raw(id){
      if(manual[id]!==undefined)return {id:id,start:'preview',active:manual[id]<3000,frame:Math.min(8,Math.floor(manual[id]/3000*9))};
      return clock.snapshot('diner').items.find(function(e){return e.id===id;});
    }
    function pose(id){
      var e=raw(id);return enabled&&eligible(id)&&e&&e.active&&cancelled[id]!==e.start?e.frame:-1;
    }
    function clockItem(mapId,key){
      var snap=clock.snapshot(mapId),items=snap.items||[];
      for(var i=0;i<items.length;i++)if(items[i].id===key)return items[i];
      return null;
    }
    function interactionActive(state){
      if(state&&(state.dialogue||state.menu))return true;
      if(GAME.NarrativeAdapter&&GAME.NarrativeAdapter.active&&GAME.NarrativeAdapter.active())return true;
      return !!(GAME.NarrativeFinaleProduction&&GAME.NarrativeFinaleProduction.isActive&&GAME.NarrativeFinaleProduction.isActive());
    }
    function actorEligible(profile,npc,state){
      return !!(state&&state.mode==='play'&&!state.fadePhase&&!state.menu&&!state.dialogue&&!interactionActive(state)&&npc&&!npc.moving&&
        (!GAME.Engine||!GAME.Engine.npcActive||GAME.Engine.npcActive(npc,state)));
    }
    function behaviorPose(profile,npc,state){
      var scoped=runtimeKey(state.mapId,profile.id),forced=actorManual[scoped];
      if(forced){
        var forcedBehavior=profile.behaviors.find(function(b){return b.id===forced.behaviorId;});
        if(forcedBehavior)return {behavior:forcedBehavior,item:forced.item};
      }
      if(!actorEligible(profile,npc,state))return null;
      var chosen=null;
      profile.behaviors.forEach(function(b){
        var item=clockItem(state.mapId,actorKey(state.mapId,profile.id,b.id));
        if(!item||!item.active||cancelled[item.id]===item.start)return;
        if(b.look&&profile.lockFocus){cancelled[item.id]=item.start;return;}
        if(!b.look&&b.directions&&b.directions.indexOf(npc.dir)<0){cancelled[item.id]=item.start;return;}
        if(!chosen||(b.category==='contextual'&&chosen.behavior.category!=='contextual'))chosen={behavior:b,item:item};
      });
      if(chosen&&chosen.behavior.category==='contextual')profile.behaviors.forEach(function(b){
        if(b===chosen.behavior)return;
        var item=clockItem(state.mapId,actorKey(state.mapId,profile.id,b.id));
        if(item&&item.active)cancelled[item.id]=item.start;
      });
      return chosen;
    }
    function spriteFrameFor(behavior,item,dir){
      var frames=behavior.frames||{},sequence=frames[dir];
      if(!sequence&&dir==='left')sequence=frames.right;
      return Array.isArray(sequence)?sequence[item.frame]||null:null;
    }
    function currentActorPose(profile,npc,state){
      var rt=actorRuntime[runtimeKey(state.mapId,profile.id)];
      if(!enabled)return {state:'still',animation:null,frame:-1,variant:0,direction:null,spriteFrame:null};
      if(rt&&rt.reactive&&npc&&!npc.moving)return {state:'reactive',animation:'look-toward-interactor',frame:-1,variant:0,direction:rt.reactive.direction,spriteFrame:null};
      var active=behaviorPose(profile,npc,state);
      if(!active)return {state:'still',animation:null,frame:-1,variant:0,direction:null,spriteFrame:null};
      return {state:active.behavior.category,animation:active.behavior.animation,frame:active.item.frame,
        variant:active.item.variant,direction:npc&&npc.dir||null,
        spriteFrame:spriteFrameFor(active.behavior,active.item,npc&&npc.dir)};
    }
    function cancelActorEvents(profile,mapId){
      profile.behaviors.forEach(function(b){
        var item=clockItem(mapId,actorKey(mapId,profile.id,b.id));
        if(item&&item.active)cancelled[item.id]=item.start;
      });
    }
    function updateActor(profile,state,dt){
      var scoped=runtimeKey(state.mapId,profile.id),npc=findNpc(state,profile.id);
      var rt=actorRuntime[scoped]||(actorRuntime[scoped]={history:[],observationMs:0,stillMs:0});
      var npcActive=!!(state.mode==='play'&&!state.fadePhase&&npc&&(!GAME.Engine||!GAME.Engine.npcActive||GAME.Engine.npcActive(npc,state)));
      if(!npcActive||npc.moving)rt.reactive=null;
      if(rt.reactive){
        cancelActorEvents(profile,state.mapId);
        if(npc)npc.dir=rt.reactive.direction;
        if(interactionActive(state))rt.reactive.releaseAt=runtimeTime+250;
        else if(runtimeTime>=rt.reactive.releaseAt){if(npc)npc.dir=profile.focusDirection||rt.reactive.returnDirection;rt.reactive=null;}
      }
      if(!actorEligible(profile,npc,state)&&!actorManual[scoped]){
        cancelActorEvents(profile,state.mapId);
        if(rt.behaviorStart&&npc&&!npc.moving&&!rt.reactive)npc.dir=profile.focusDirection||rt.returnDirection||npc.dir;
        rt.behaviorStart=null;
        return;
      }
      var active=behaviorPose(profile,npc,state);
      rt.observationMs+=dt;
      if(!active&&!rt.reactive)rt.stillMs+=dt;
      if(!active){
        if(rt.behaviorStart&&npc&&!npc.moving&&!rt.reactive)npc.dir=profile.focusDirection||rt.returnDirection||npc.dir;
        rt.behaviorStart=null;
        if(profile.focusDirection&&!rt.reactive&&npc)npc.dir=profile.focusDirection;
        return;
      }
      var start=active.behavior.id+':'+active.item.start;
      if(rt.behaviorStart!==start){
        rt.behaviorStart=start;rt.returnDirection=npc&&npc.dir;
        rt.history.push({time:runtimeTime,animation:active.behavior.animation,category:active.behavior.category,variant:active.item.variant});
        if(rt.history.length>32)rt.history.shift();
      }
      if(npc&&active.behavior.look&&active.behavior.directions&&!profile.lockFocus&&active.behavior.directions.length)npc.dir=active.behavior.directions[active.item.variant%active.behavior.directions.length];
    }
    function scaledClockUpdate(dt,mapId){
      var profiles=actorProfiles(mapId);
      if(actorTimeScale<=1||!profiles.length){clock.update(dt,mapId);return;}
      var snap=clock.snapshot(mapId),keys={},active=false,next=Infinity;
      profiles.forEach(function(p){p.behaviors.forEach(function(b){keys[actorKey(mapId,p.id,b.id)]=true;});});
      (snap.items||[]).forEach(function(item){
        if(!keys[item.id])return;
        if(item.active&&cancelled[item.id]!==item.start)active=true;
        if(item.next>=snap.time)next=Math.min(next,item.next-snap.time);
      });
      clock.update(active?dt:Math.min(dt*actorTimeScale,next),mapId);
    }
    function update(dt,state){
      context=state;
      if(!state)return;
      if(lastMap!==null&&lastMap!==state.mapId)actorProfiles(lastMap).forEach(function(profile){cancelActorEvents(profile,lastMap);delete actorManual[runtimeKey(lastMap,profile.id)];});
      lastMap=state.mapId;
      actorProfiles(state.mapId).forEach(function(profile){
        var npc=findNpc(state,profile.id);
        if(!actorEligible(profile,npc,state))delete actorManual[runtimeKey(state.mapId,profile.id)];
      });
      if(!enabled){actorProfiles(state.mapId).forEach(function(profile){cancelActorEvents(profile,state.mapId);});return;}
      if(state.mode!=='play'||state.fadePhase||state.menu){
        actorProfiles(state.mapId).forEach(function(profile){updateActor(profile,state,0);});
        return;
      }
      if(paused){actorProfiles(state.mapId).forEach(function(profile){updateActor(profile,state,0);});return;}
      runtimeTime+=dt;
      scaledClockUpdate(dt,state.mapId);
      Object.keys(manual).forEach(function(id){manual[id]+=dt;if(manual[id]>=3000)delete manual[id];});
      var wipe=raw('counter-wipe');
      if(wipe&&wipe.active&&!eligible('counter-wipe'))cancelled['counter-wipe']=wipe.start;
      if(pose('counter-wipe')>=0){var n=state.npcs.find(function(n){return n.id==='norma';});n.dir='down';}
      actorProfiles(state.mapId).forEach(function(profile){updateActor(profile,state,dt);});
    }
    function actorPose(id){
      var profile=context&&findProfile(context.mapId,id),npc=profile&&findNpc(context,id);
      return profile?currentActorPose(profile,npc,context):null;
    }
    function actorSnapshot(id){
      var profile=context&&findProfile(context.mapId,id);
      if(!profile)return null;
      var snap=clock.snapshot(context.mapId),prefix='character:'+context.mapId+':'+id+':',behaviors=(snap.items||[]).filter(function(item){return item.id.indexOf(prefix)===0;});
      var next=Infinity,events=0;
      behaviors.forEach(function(item){if(item.next<next)next=item.next;events+=item.events||0;});
      var rt=actorRuntime[runtimeKey(context.mapId,id)]||{history:[],observationMs:0,stillMs:0};
      return {id:id,mapId:context.mapId,pose:actorPose(id),nextEvent:Number.isFinite(next)?next:null,time:snap.time,timeScale:actorTimeScale,
        observationMs:rt.observationMs||0,stillMs:rt.stillMs||0,events:events,history:(rt.history||[]).slice(),behaviors:behaviors};
    }
    function managedActor(id){return !!(context&&findProfile(context.mapId,id));}
    function reactToInteractor(npc,state){
      state=state||context;
      var profile=state&&npc&&findProfile(state.mapId,npc.id);
      if(!profile)return false;
      cancelActorEvents(profile,state.mapId);
      var scoped=runtimeKey(state.mapId,profile.id);
      var rt=actorRuntime[scoped]||(actorRuntime[scoped]={history:[],observationMs:0,stillMs:0});
      var returnDirection=profile.focusDirection||rt.returnDirection||npc.dir;
      delete actorManual[scoped];rt.behaviorStart=null;
      rt.reactive={direction:npc.dir,returnDirection:returnDirection,releaseAt:runtimeTime+250};
      rt.history.push({time:runtimeTime,animation:'look-toward-interactor',category:'reactive',direction:npc.dir});
      return true;
    }
    function previewActor(id,behaviorId,time,variant){
      var profile=context&&findProfile(context.mapId,id),behavior=profile&&profile.behaviors.find(function(b){return b.id===behaviorId;});
      var scoped=context&&runtimeKey(context.mapId,id);
      if(!behavior){if(scoped)delete actorManual[scoped];return false;}
      var duration=(behavior.duration[0]+behavior.duration[1])/2,elapsed=Math.max(0,Math.min(duration-1,Number(time)||0));
      actorManual[scoped]={behaviorId:behaviorId,item:{id:actorKey(context.mapId,id,behaviorId),active:true,start:'preview',end:duration,
        duration:duration,frame:Math.min(8,Math.floor(elapsed/duration*9)),variant:Math.max(0,variant||0)}};
      return true;
    }
    function clearActorPreview(id){
      var scoped=context&&runtimeKey(context.mapId,id);if(scoped)delete actorManual[scoped];
      var rt=scoped&&actorRuntime[scoped];if(rt)rt.reactive=null;
      var profile=context&&findProfile(context.mapId,id),npc=profile&&findNpc(context,id);
      if(profile)cancelActorEvents(profile,context.mapId);
      if(profile&&npc&&profile.focusDirection)npc.dir=profile.focusDirection;
    }
    return {update:update,pose:pose,registerActors:registerActors,actorPose:actorPose,actorSnapshot:actorSnapshot,
      managedActor:managedActor,reactToInteractor:reactToInteractor,previewActor:previewActor,clearActorPreview:clearActorPreview,
      setActorTimeScale:function(scale){scale=Number(scale);if(!Number.isFinite(scale)||scale<1)throw new Error('Invalid character activity time scale');actorTimeScale=scale;},
      busy:function(id){return id==='norma'&&pose('counter-wipe')>=0;},
      play:function(id){if(!['booth-sip','counter-wipe'].includes(id))return false;manual[id]=0;delete cancelled[id];return true;},
      preview:function(id,time){manual[id]=time;delete cancelled[id];},
      seek:function(time){clock.seek('diner',time);manual={};cancelled={};},
      reset:function(seed){clock.reset(seed);manual={};cancelled={};actorRuntime={};actorManual={};lastMap=null;runtimeTime=0;},
      setEnabled:function(v){
        enabled=!!v;
        if(!enabled){
          if(context)actorProfiles(context.mapId).forEach(function(profile){cancelActorEvents(profile,context.mapId);});
          manual={};actorRuntime={};actorManual={};
        }
      },
      setPaused:function(v){paused=!!v;},snapshot:function(){return clock.snapshot('diner');}};
  }
  var api=GAME.CharacterActivity=create();api.create=create;
  // Local pose coordinates follow the existing seated sprite's mirroring.
  var cups=[[1,21],[4,16],[7,10],[7,10],[7,10],[4,16],[1,21],[1,21],[1,21]];
  var arms=[
    [[3,15,3,3],[2,17,3,4]], [[4,14,3,3],[5,15,3,3]],
    [[4,13,3,3],[6,11,3,4]], [[4,13,3,3],[6,11,3,4]], [[4,13,3,3],[6,11,3,4]],
    [[4,14,3,3],[5,15,3,3]], [[3,15,3,3],[2,17,3,4]], [], []
  ];
  api.seatedFrame=function(){return api.pose('booth-sip');};
  api.drawSip=function(g,pose,p){
    var f=pose.gesture;if(f<0)return false;
    function P(x,y,w,h,c){g.fillStyle=c;g.fillRect(pose.x+(pose.mirror?16-x-w:x),pose.y+y,w,h);}
    // Far arm stays resting. Near arm has discrete authored elbow/forearm poses.
    P(12,15,2,1,pose.shirt);P(12,16,2,2,pose.skinShadow);P(12,16,2,1,pose.skinHi);
    if(f>=7)return false;
    arms[f].forEach(function(a,i){P(a[0],a[1],a[2],a[3],i?pose.skinShadow:pose.coat);P(a[0],a[1],a[2],1,i?pose.skinHi:pose.coatHi);});
    var c=cups[f];
    var cupX=pose.x+(pose.mirror?16-c[0]-5:c[0]),cupY=pose.y+c[1];
    function C(x,y,w,h,color){g.fillStyle=color;g.fillRect(cupX+x,cupY+y,w,h);}
    C(0,0,5,4,p.cream);C(1,0,3,1,p.woodDark);C(5,1,2,2,p.cream);
    C(1,3,3,1,p.creamShade);C(1,1,1,2,p.metalHi);C(5,2,2,1,pose.skinHi);
    return true;
  };
  api.sipLiftsCup=function(f){return f>=0&&f<7;};
  var wrists=[91,91,95,99,102,101,97,93,91];
  api.wipeFrame=function(){return api.pose('counter-wipe');};
  api.drawWipe=function(g,cx,cy){
    var f=api.wipeFrame();if(f<0)return;
    var wrist=wrists[f];
    function P(x,y,w,h,c){g.fillStyle=c;g.fillRect(x-Math.round(cx),y-Math.round(cy),w,h);}
    // Reach, one long sweep, return. Cloth remains on the cream counter plane.
    P(90,38,3,3,'#9a5a5e');P(90,38,2,1,'#b57a7c');
    P(91,41,3,2,'#c8a080');P(91,41,2,1,'#e8caa8');
    P(92,43,Math.max(2,wrist-91),2,'#c8a080');
    P(92,43,Math.max(2,wrist-92),1,'#e8caa8');
    P(wrist,44,3,2,'#c8a080');P(wrist,44,2,1,'#e8caa8');
    P(wrist-1,46,7,2,'#81918b');P(wrist,46,5,1,'#d9dfc9');
    P(wrist,48,5,1,'#cfbc92');
  };
  if(typeof module!=='undefined'&&module.exports)module.exports={create:create,cups:cups,arms:arms,wrists:wrists};
})(typeof window!=='undefined'?window:globalThis);
