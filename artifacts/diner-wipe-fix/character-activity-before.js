/* Two authored idle gestures. Own seeded clocks; no environment-event triggers. */
(function(root){
  'use strict';
  var GAME=root.GAME=root.GAME||{};
  function create(seed){
    var clock=GAME.AmbientLife.create(seed),context=null,enabled=true,paused=false,manual={},cancelled={};
    clock.register('diner',[
      {id:'booth-sip',type:'ACTOR_ACTIVITY',x:183,y:80,depth:112,delay:[12000,26000],duration:[3000,3400]},
      {id:'counter-wipe',type:'ACTOR_ACTIVITY',x:80,y:32,depth:64,delay:[18000,34000],duration:[2800,3200]}
    ]);
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
    function update(dt,state){
      context=state;
      if(!enabled||paused||!state||state.mode!=='play'||state.fadePhase||state.menu)return;
      clock.update(dt,state.mapId);
      Object.keys(manual).forEach(function(id){manual[id]+=dt;if(manual[id]>=3000)delete manual[id];});
      var wipe=raw('counter-wipe');
      if(wipe&&wipe.active&&!eligible('counter-wipe'))cancelled['counter-wipe']=wipe.start;
      if(pose('counter-wipe')>=0){var n=state.npcs.find(function(n){return n.id==='norma';});n.dir='down';}
    }
    return {update:update,pose:pose,
      busy:function(id){return id==='norma'&&pose('counter-wipe')>=0;},
      play:function(id){if(!['booth-sip','counter-wipe'].includes(id))return false;manual[id]=0;delete cancelled[id];return true;},
      preview:function(id,time){manual[id]=time;delete cancelled[id];},
      seek:function(time){clock.seek('diner',time);manual={};cancelled={};},
      reset:function(seed){clock.reset(seed);manual={};cancelled={};},
      setEnabled:function(v){enabled=!!v;if(!enabled){manual={};cancelled={};}},
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
  var wrists=[90,94,98,94,90,94,98,94,90];
  api.wipeFrame=function(){return api.pose('counter-wipe');};
  api.drawWipe=function(g,cx,cy){
    var f=api.wipeFrame();if(f<0)return;
    var wrist=wrists[f];
    function P(x,y,w,h,c){g.fillStyle=c;g.fillRect(x-Math.round(cx),y-Math.round(cy),w,h);}
    // Shoulder remains at (91,38); elbow bends, hand and cloth travel together.
    P(90,37,3,5,'#9a5a5e');P(90,37,2,1,'#b57a7c');
    P(91,41,3,3,'#c8a080');P(91,41,2,1,'#e8caa8');
    var elbow=92,sign=wrist>=elbow?1:-1;
    for(var y=43;y<48;y++){var x=elbow+sign*Math.min(Math.abs(wrist-elbow),y-42);P(x,y,3,1,'#c8a080');P(x,y,2,1,'#e8caa8');}
    P(wrist-1,49,7,1,'#cfbc92');P(wrist-1,47,7,2,'#d9dfc9');P(wrist,47,5,1,'#f4e6c8');
    P(wrist,46,3,2,'#e8caa8');
  };
  if(typeof module!=='undefined'&&module.exports)module.exports={create:create,cups:cups,arms:arms,wrists:wrists};
})(typeof window!=='undefined'?window:globalThis);
