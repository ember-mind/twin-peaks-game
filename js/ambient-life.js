/* Ambient Life v0.2 — deterministic per-element clocks, read-only pixel rendering. */
(function(root){
  'use strict';
  var GAME=root.GAME=root.GAME||{};
  var TYPES={
    ACTOR_ACTIVITY:{kind:'intermittent',delay:[18000,34000],duration:[3000,3000],frames:9},
    MACHINE_IDLE_ACTIVITY:{kind:'intermittent',delay:[8000,25000],duration:[500,900],frames:5},
    CLOCK_TICK:{kind:'mechanical',duration:[60000,60000],frames:12},
    STEAM_SMALL:{kind:'continuous',duration:[1260,1260],frames:7},
    LIGHT_WARM_VARIATION:{kind:'intermittent',delay:[4000,12000],duration:[240,360],frames:5},
    LIGHT_NEON:{kind:'signature',delay:[8000,25000],duration:[140,280],frames:6},
    GLASS_SUBTLE_REFLECTION:{kind:'intermittent',delay:[5000,15000],duration:[2000,4000],frames:8}
  };
  function hash(s){var h=2166136261;for(var i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0;}
  function random(seed){var s=seed||1;return function(){s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};}
  function create(seed){
    var registry={},scenes={},enabled=true,paused=false,timeSource=null;
    seed=seed===undefined?Date.now()>>>0:seed>>>0;
    function register(id,defs){
      var ids={};
      registry[id]=defs.map(function(d){
        if(!TYPES[d.type]||!d.id||ids[d.id])throw new Error('Invalid ambient definition: '+d.id);
        if(!Number.isInteger(d.x)||!Number.isInteger(d.y)||!Number.isFinite(d.depth))throw new Error('Ambient anchors must use integer world pixels');
        ['delay','duration','firstDelay'].forEach(function(k){
          var pair=d[k];
          if(pair&&(!Array.isArray(pair)||pair.length!==2||!Number.isFinite(pair[0])||!Number.isFinite(pair[1])||!(pair[0]>0)||pair[1]<pair[0]))throw new Error('Invalid ambient '+k);
        });
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
        phase=((phase%duration)+duration)%duration;
        var continuous=t.kind==='continuous';
        return {def:d,rng:rng,duration:duration,phase:phase,next:continuous?duration-phase:t.kind==='mechanical'?Infinity:range(rng,d.firstDelay||d.delay||t.delay),start:continuous?-phase:-1,end:continuous?duration-phase:-1,variant:Math.floor(rng()*(d.variants||3)),events:0,cycles:0};
      })};scenes[id]=scene;return scene;
    }
    function advance(scene,dt){
      scene.time+=dt;
      scene.items.forEach(function(e){
        var d=e.def,t=TYPES[d.type];if(d.enabled===false)return;
        if(t.kind==='mechanical')return;
        if(t.kind==='continuous'){
          // Change only after the breakup/rest frame: no mid-wisp popping.
          while(scene.time>=e.end){
            e.start=e.end;
            var pair=d.duration||t.duration,count=d.variants||3;
            if(pair[0]===pair[1])pair=[Math.round(pair[0]*.975),Math.round(pair[1]*1.025)];
            e.duration=range(e.rng,pair);
            if(count>1)e.variant=(e.variant+1+Math.floor(e.rng()*(count-1)))%count;
            e.end=e.start+e.duration;e.next=e.end;e.cycles++;
          }
          return;
        }
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
      if(t.kind==='mechanical'){
        var seconds=timeSource?timeSource(e.def.clockId||e.def.id,time):(e.def.startSeconds||0)+time/1000;
        if(!Number.isFinite(seconds))throw new Error('Clock source must return finite seconds');
        seconds=((seconds%43200)+43200)%43200;
        return {id:e.def.id,type:e.def.type,active:e.def.enabled!==false,frame:Math.floor(seconds%60/5),second:Math.floor(seconds%60/5),minute:Math.floor(seconds%3600/300),hour:Math.floor(seconds/3600),seconds:seconds};
      }
      var active=e.def.enabled!==false&&(continuous||(time>=e.start&&time<e.end));
      var progress=(time-e.start)/e.duration;
      return {id:e.def.id,type:e.def.type,active:active,frame:active?Math.min(t.frames-1,Math.floor(progress*t.frames)):-1,variant:e.variant,next:e.next,start:e.start,end:e.end,events:e.events,cycles:e.cycles,duration:e.duration};
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
        if(d.type==='MACHINE_IDLE_ACTIVITY'){
          // Device-specific marks are configuration, not coffee-machine geometry.
          var marks=(d.marks||[])[v%(d.marks||[1]).length]||[];
          marks.forEach(function(r){mark(d,r.x,r.y,r.w||1,r.h||1,r.color,[.08,.28,.38,.20,0][f]);});
        } else if(d.type==='CLOCK_TICK'){
          // Twelve authored directions; one second-hand step represents five seconds.
          var directions=[[0,-3],[1,-3],[3,-1],[3,0],[3,1],[1,3],[0,3],[-1,3],[-3,1],[-3,0],[-3,-1],[-1,-3]];
          var palette=d.palette,initial=d.initialHands||[0,0,3];
          if(s.second===initial[0]&&s.minute===initial[1]&&s.hour===initial[2])return;
          (d.face||[]).forEach(function(r){mark(d,r[0],r[1],r[2],r[3],palette.face,1);});
          function hand(index,length,color){var tip=directions[index];for(var n=0;n<=length;n++)mark(d,Math.round(tip[0]*n/3),Math.round(tip[1]*n/3),1,1,color,1);}
          hand(s.second,3,palette.second);hand(s.minute,3,palette.hand);hand(s.hour,2,palette.hand);
        } else if(d.type==='STEAM_SMALL'){
          var wisps=[[[0,-1],[0,-2]],[[0,-2],[1,-3]],[[1,-3],[1,-4],[0,-5]],[[0,-4],[-1,-5],[0,-6]],[[-1,-5],[0,-7]],[[0,-7],[1,-9]],[]];
          wisps[f].forEach(function(p,n){mark(d,v%2?-p[0]:p[0],p[1]-(v===2&&n===0?1:0),1,1,'#f4e6c8',[.20,.24,.22,.18,.14,.09,0][f]);});
        } else if(d.type==='LIGHT_WARM_VARIATION'){
          // Dim the full diffuser, then restore it; tiny bright-on-bright marks disappear.
          var amount=[.12,.42,.62,.30,0][f],color='#69462d';
          mark(d,-3,0,9,7,color,amount);
          mark(d,-4,1,1,5,color,amount*.7);
          (d.regions||[]).forEach(function(r){mark(d,r.x-d.x,r.y-d.y,r.w,r.h,color,amount*.6,r.depth);});
        } else if(d.type==='LIGHT_NEON'){
          var level=[[.25,.90,.70,.32,.10,0],[.20,.75,.35,.80,.12,0],[.35,.85,.60,.25,.08,0]][v%3][f];
          // A configured tube mask dims the whole letter without painting over its background.
          var segments=d.tubes||[(d.segments||[])[v%(d.segments||[1]).length]];
          segments.forEach(function(r){if(r)mark(d,r.x,r.y,r.w,r.h,'#501f29',level);});
          (d.regions||[]).forEach(function(r){mark(d,r.x-d.x,r.y-d.y,r.w,r.h,'#35271f',level*.5,r.depth);});
        } else if(d.type==='GLASS_SUBTLE_REFLECTION'){
          var alpha=[.18,.40,.62,.72,.62,.40,.18,0][f];
          var dx=Math.round(f*(d.travel===undefined?3:d.travel)/6);
          // Short stepped reflection crosses the pane; pies remain visible between clusters.
          mark(d,dx,0,3,1,'#e5e6cd',alpha);
          mark(d,dx-1,1,2,2,'#d9dfc9',alpha*.85);
          mark(d,dx-2,3,2,2,'#d9dfc9',alpha*.65);

        }
      });
      ctx.globalAlpha=oldAlpha;ctx.fillStyle=oldFill;
    }
    return {register:register,update:update,draw:draw,snapshot:snapshot,
      setEnabled:function(v){enabled=!!v;},setPaused:function(v){paused=!!v;},
      reset:function(value){if(value!==undefined)seed=value>>>0;scenes={};},
      seek:function(id,time){if(!Number.isFinite(time)||time<0)throw new Error('Invalid ambient time');var s=init(id);if(s)advance(s,time);},
      setTimeSource:function(fn){if(fn!==null&&typeof fn!=='function')throw new Error('Invalid clock source');timeSource=fn;},
      archetypes:TYPES};
  }
  GAME.AmbientLife=create();GAME.AmbientLife.create=create;
  if(typeof module!=='undefined'&&module.exports)module.exports={create:create,archetypes:TYPES};
})(typeof window!=='undefined'?window:globalThis);
