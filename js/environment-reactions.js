/* Environment Life v0.2: small event-to-visual adapter, no random scheduler. */
(function(root){
  'use strict';
  var GAME=root.GAME=root.GAME||{};
  function create(){
    var registry={},scenes={},enabled=true,paused=false;
    function reset(id){
      if(id===undefined){scenes={};return;}
      scenes[id]=(registry[id]||[]).map(function(d){return {def:d,elapsed:-1,events:0};});
    }
    function register(id,defs){
      var ids={};
      registry[id]=defs.map(function(d){
        if(!d.id||ids[d.id]||!d.trigger||!Number.isInteger(d.x)||!Number.isInteger(d.y)||!Number.isFinite(d.depth))throw new Error('Invalid environment reaction');
        if(!d.frames||!d.frames.length||d.frames.some(function(f){return !(f.duration>0)||!['OPENING','OPEN','CLOSING'].includes(f.state)||f.pixels.some(function(p){return !p.slice(0,4).every(Number.isInteger)||p[2]<1||p[3]<1;});}))throw new Error('Invalid reaction frames');
        ids[d.id]=true;return d;
      });reset(id);
    }
    function handle(event){
      if(!enabled||!event)return 0;
      var items=scenes[event.sceneId];if(!items){reset(event.sceneId);items=scenes[event.sceneId];}
      var count=0;
      items.forEach(function(e){var d=e.def;
        if(d.trigger!==event.type||(d.arrivalKey&&d.arrivalKey!==event.arrivalKey)||(d.fromMapId&&d.fromMapId!==event.fromMapId)||(event.reactionId&&event.reactionId!==d.id))return;
        // Coalesce entries during one cycle; never snap an open door shut.
        if(e.elapsed>=0)return;
        e.elapsed=0;e.events++;count++;
      });return count;
    }
    function update(dt,id){
      if(!enabled||paused||!Number.isFinite(dt)||dt<0)return;
      (scenes[id]||[]).forEach(function(e){if(e.elapsed<0)return;e.elapsed+=dt;
        if(e.elapsed>=e.def.frames.reduce(function(n,f){return n+f.duration;},0))e.elapsed=-1;
      });
    }
    function state(e){
      var time=e.elapsed,index=-1;
      if(time>=0)for(var i=0;i<e.def.frames.length;i++){if(time<e.def.frames[i].duration){index=i;break;}time-=e.def.frames[i].duration;}
      return {id:e.def.id,state:index<0?'CLOSED':e.def.frames[index].state,frame:index,elapsed:e.elapsed,events:e.events};
    }
    function draw(ctx,id,cx,cy,min,max){
      if(!enabled)return;min=min===undefined?-Infinity:min;max=max===undefined?Infinity:max;
      var fill=ctx.fillStyle,alpha=ctx.globalAlpha;
      (scenes[id]||[]).forEach(function(e){var d=e.def,s=state(e);if(s.frame<0||d.depth<min||d.depth>=max)return;
        d.frames[s.frame].pixels.forEach(function(p){ctx.fillStyle=d.palette[p[4]]||p[4];ctx.fillRect(d.x-Math.round(cx)+p[0],d.y-Math.round(cy)+p[1],p[2],p[3]);});
      });ctx.fillStyle=fill;ctx.globalAlpha=alpha;
    }
    return {register:register,handle:handle,update:update,draw:draw,reset:reset,
      snapshot:function(id){return (scenes[id]||[]).map(state);},
      setEnabled:function(v){enabled=!!v;},setPaused:function(v){paused=!!v;}};
  }
  // Authored 32x16 cutaway double-door overlays. No base-image transforms.
  // Rectangles encode jambs, threshold, projected leaves, inset glass and edges.
  var opening=[
    [0,0,32,16,'frame'],[1,1,30,14,'void'],[1,14,30,1,'threshold'],
    [1,1,10,13,'red'],[21,1,10,13,'red'],[10,3,2,12,'edge'],[20,3,2,12,'edge'],
    [3,3,6,6,'gold'],[23,3,6,6,'gold'],[4,4,4,4,'glass'],[24,4,4,4,'glass']
  ];
  var angled=[
    [0,0,32,16,'frame'],[1,1,30,14,'void'],[1,14,30,1,'threshold'],
    [1,1,5,13,'red'],[26,1,5,13,'red'],[5,4,2,11,'edge'],[25,4,2,11,'edge'],
    [2,3,3,6,'gold'],[27,3,3,6,'gold'],[3,4,1,4,'glass'],[28,4,1,4,'glass']
  ];
  var open=[
    [0,0,32,16,'frame'],[1,1,30,14,'void'],[1,14,30,1,'threshold'],
    [1,1,2,13,'red'],[29,1,2,13,'red'],[3,4,1,11,'edge'],[28,4,1,11,'edge'],
    [2,3,1,6,'gold'],[29,3,1,6,'gold']
  ];
  var doorFrames=[{state:'OPENING',duration:140,pixels:opening},{state:'OPENING',duration:140,pixels:angled},
    {state:'OPEN',duration:520,pixels:open},{state:'CLOSING',duration:140,pixels:angled},{state:'CLOSING',duration:140,pixels:opening}];
  GAME.EnvironmentReactions=create();GAME.EnvironmentReactions.create=create;GAME.EnvironmentReactions.doorEntryFrames=doorFrames;
  if(typeof module!=='undefined'&&module.exports)module.exports={create:create,doorEntryFrames:doorFrames};
})(typeof window!=='undefined'?window:globalThis);
