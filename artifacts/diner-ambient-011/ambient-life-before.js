/* Ambient Life v0.1 — deterministic per-element clocks, read-only pixel rendering. */
(function(root){
  'use strict';
  var GAME=root.GAME=root.GAME||{};
  var TYPES={
    STEAM_SMALL:{kind:'continuous',duration:[1260,1260],frames:7},
    LIGHT_WARM_VARIATION:{kind:'intermittent',delay:[4000,12000],duration:[240,360],frames:5},
    LIGHT_NEON:{kind:'signature',delay:[8000,25000],duration:[140,280],frames:6},
    GLASS_SUBTLE_REFLECTION:{kind:'intermittent',delay:[5000,15000],duration:[2000,4000],frames:8}
  };
  function hash(s){var h=2166136261;for(var i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0;}
  function random(seed){var s=seed||1;return function(){s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};}
  function create(seed){
    var registry={},scenes={},enabled=true,paused=false;
    seed=seed===undefined?Date.now()>>>0:seed>>>0;
    function register(id,defs){
      var ids={};
      registry[id]=defs.map(function(d){
        if(!TYPES[d.type]||!d.id||ids[d.id])throw new Error('Invalid ambient definition: '+d.id);
        if(!Number.isInteger(d.x)||!Number.isInteger(d.y)||!Number.isFinite(d.depth))throw new Error('Ambient anchors must use integer world pixels');
        ['delay','duration'].forEach(function(k){if(d[k]&&(!(d[k][0]>0)||d[k][1]<d[k][0]))throw new Error('Invalid ambient '+k);});
        ids[d.id]=true;return Object.assign({},d);
      });
      delete scenes[id];
    }
    function range(rng,pair){return Math.round(pair[0]+rng()*(pair[1]-pair[0]));}
    function init(id){
      if(!registry[id])return null;
      var scene={time:0,items:registry[id].map(function(d){
        var t=TYPES[d.type],rng=random(hash(id+':'+d.id)^seed);
        var duration=range(rng,d.duration||t.duration),phase=d.phase===undefined?Math.floor(rng()*duration):d.phase;
        return {def:d,rng:rng,duration:duration,phase:phase,next:t.kind==='continuous'?0:range(rng,d.delay||t.delay),start:-1,end:-1,variant:Math.floor(rng()*(d.variants||3)),events:0};
      })};scenes[id]=scene;return scene;
    }
    function advance(scene,dt){
      scene.time+=dt;
      scene.items.forEach(function(e){
        var d=e.def,t=TYPES[d.type];if(d.enabled===false||t.kind==='continuous')return;
        while(scene.time>=e.next){
          e.start=e.next;e.duration=range(e.rng,d.duration||t.duration);e.end=e.start+e.duration;
          e.variant=Math.floor(e.rng()*(d.variants||3));
          var fires=e.rng()<(d.probability===undefined?1:d.probability);
          if(fires)e.events++;else e.start=e.end=-1;
          e.next=e.next+e.duration+range(e.rng,d.delay||t.delay);
        }
      });
    }
    function update(dt,id){if(!enabled||paused||!Number.isFinite(dt)||dt<0)return;var s=scenes[id]||init(id);if(s)advance(s,dt);}
    function state(e,time){
      var t=TYPES[e.def.type],continuous=t.kind==='continuous';
      var active=e.def.enabled!==false&&(continuous||(time>=e.start&&time<e.end));
      var progress=continuous?((time+e.phase)%e.duration)/e.duration:(time-e.start)/e.duration;
      return {id:e.def.id,type:e.def.type,active:active,frame:active?Math.min(t.frames-1,Math.floor(progress*t.frames)):-1,variant:e.variant,next:e.next,start:e.start,end:e.end,events:e.events};
    }
    function snapshot(id){var s=scenes[id];return {time:s?s.time:0,enabled:enabled,paused:paused,items:s?s.items.map(function(e){return state(e,s.time);}):[]};}
    function draw(ctx,id,cx,cy,min,max){
      var scene=scenes[id];if(!enabled||!scene)return;
      min=min===undefined?-Infinity:min;max=max===undefined?Infinity:max;
      var oldAlpha=ctx.globalAlpha,oldFill=ctx.fillStyle;
      function mark(d,dx,dy,w,h,color,alpha,depth){
        depth=depth===undefined?d.depth:depth;
        if(depth<min||depth>=max||alpha<=0)return;
        ctx.globalAlpha=oldAlpha*alpha*(d.intensity===undefined?1:d.intensity);
        ctx.fillStyle=color;ctx.fillRect(Math.round(d.x-cx)+dx,Math.round(d.y-cy)+dy,w,h);
      }
      scene.items.forEach(function(e){
        var d=e.def,s=state(e,scene.time),f=s.frame,v=s.variant;if(!s.active)return;
        if(d.type==='STEAM_SMALL'){
          var wisps=[[[0,-1],[0,-2]],[[0,-2],[1,-3]],[[1,-3],[1,-4],[0,-5]],[[0,-4],[-1,-5],[0,-6]],[[-1,-5],[0,-7]],[[0,-7],[1,-9]],[]];
          wisps[f].forEach(function(p,n){mark(d,v%2?-p[0]:p[0],p[1]-(v===2&&n===0?1:0),1,1,'#f4e6c8',[.20,.24,.22,.18,.14,.09,0][f]);});
        } else if(d.type==='LIGHT_WARM_VARIATION'){
          var amount=[.025,.065,.085,.045,.015][f],color=v%2?'#35271f':'#f4e6c8';
          mark(d,0,0,3,4,color,amount);
          mark(d,-2,3,7,1,color,amount*.35);
          (d.regions||[]).forEach(function(r){mark(d,r.x-d.x,r.y-d.y,r.w,r.h,color,amount*.55,r.depth);});
        } else if(d.type==='LIGHT_NEON'){
          var level=[[.08,.16,.11,.05,.02,0],[.04,.10,.04,.13,.03,0],[.06,.12,.07,.04,.015,0]][v%3][f];
          var r=(d.segments||[])[v%(d.segments||[1]).length];
          if(r)mark(d,r.x,r.y,r.w,r.h,'#501f29',level);
          (d.regions||[]).forEach(function(r){mark(d,r.x-d.x,r.y-d.y,r.w,r.h,'#35271f',level*.2,r.depth);});
        } else if(d.type==='GLASS_SUBTLE_REFLECTION'){
          var alpha=[.025,.06,.10,.14,.12,.08,.04,0][f],dx=f>=3&&f<=5?1:0;
          mark(d,dx,0,f===5?1:2,1,'#d9dfc9',alpha);
          if(f>=2&&f<=5)mark(d,dx-1,1,1,1,'#d9dfc9',alpha*.6);
        }
      });
      ctx.globalAlpha=oldAlpha;ctx.fillStyle=oldFill;
    }
    return {register:register,update:update,draw:draw,snapshot:snapshot,
      setEnabled:function(v){enabled=!!v;},setPaused:function(v){paused=!!v;},
      reset:function(value){if(value!==undefined)seed=value>>>0;scenes={};},
      seek:function(id,time){if(!Number.isFinite(time)||time<0)throw new Error('Invalid ambient time');var s=init(id);if(s)advance(s,time);},
      archetypes:TYPES};
  }
  GAME.AmbientLife=create();GAME.AmbientLife.create=create;
  if(typeof module!=='undefined'&&module.exports)module.exports={create:create,archetypes:TYPES};
})(typeof window!=='undefined'?window:globalThis);
