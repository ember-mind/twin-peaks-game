(function () {
  'use strict';
  var G = window.GAME, E = G.Engine, scene = G.DoubleRExteriorScene, MAP = scene.mapId;
  var q = new URLSearchParams(location.search), debug = q.get('debug') === '1';
  var status = document.getElementById('status'), overlay = document.getElementById('debug'), dctx = overlay.getContext('2d');
  var connectionHandle, ready = false, busy = false, token = 0, history = [], saveCount = 0, lastMap = '';
  var clean = q.get('clean') === '1', staticMode = q.get('static') === '1';
  document.body.classList.toggle('clean', clean);
  dctx.imageSmoothingEnabled = false;
  scene.install();
  function memorySave() { saveCount++; return {handled:true,ok:true}; }
  G.NarrativeProduction = { onClassicSave: memorySave };
  function registerDoorReaction() {
    var R = G.EnvironmentReactions;
    R.register('diner', [{id:'front-door', trigger:'ENTITY_ENTERED_DOORWAY', x:96, y:144, depth:160,
      frames:R.doorEntryFrames, palette:{frame:'#35271f',void:'#17251e',threshold:'#81918b',red:'#8c2f3e',edge:'#501f29',gold:'#e9bd5d',glass:'#f4e6c8'}}]);
  }
  function installConnection() {
    if (connectionHandle) connectionHandle.uninstall();
    connectionHandle = G.LocationConnections.install(G.DoubleRLocationConnection, G.Maps);
  }
  function install() {
    scene.map.doors = scene.map.doors || {};
    installConnection();
    registerDoorReaction();
    E.state.mode='title'; E.loadMap(MAP, 6, 10, 'up'); E.state.mode='play';
    E.state.dialogue=null; E.state.fade=0; E.state.fadePhase=0; E.state.warp=null;
    history=[]; saveCount=0; lastMap=MAP; status.textContent='';
    if (staticMode) { G.AmbientLife.setEnabled(false); G.EnvironmentReactions.setEnabled(false); G.CharacterActivity.setEnabled(false); }
  }
  function recordArrival() {
    var id=E.state.mapId;
    if (id!==lastMap) {
      history.push({source:lastMap,dest:id,player:{tx:E.state.player.tx,ty:E.state.player.ty,dir:E.state.player.dir}}); lastMap=id;
      status.textContent=(id==='diner'?'Inside Double R · facing into the room':'Outside Double R · facing parking');
    }
  }
  function poll() { recordArrival(); drawDebug(); requestAnimationFrame(poll); }
  function drawDebug() {
    dctx.clearRect(0,0,256,192); if (!debug) return;
    var p=E.state.player, cx=0, cy=0;
    if (E.state.mapId==='diner') { cx=-16; cy=-16; }
    dctx.fillStyle='rgba(35,220,100,.40)';
    if (E.state.mapId===MAP) [[6,6],[7,6]].forEach(function(xy){dctx.fillRect(xy[0]*16-cx,xy[1]*16-cy,16,16);});
    if (E.state.mapId==='diner') [[6,9],[7,9]].forEach(function(xy){dctx.fillStyle='rgba(35,220,100,.40)';dctx.fillRect(xy[0]*16-cx,xy[1]*16-cy,16,16);});
    var spawn=E.state.mapId===MAP?G.DoubleRLocationConnection.a.spawn:G.DoubleRLocationConnection.b.spawn;
    dctx.fillStyle='rgba(70,220,255,.65)'; dctx.fillRect(spawn.tx*16-cx+4,spawn.ty*16-cy+4,8,8);
  }
  function snapshot() { var p=E.state.player, cv=document.getElementById('game'); return {ready:ready,mapId:E.state.mapId,
    player:{tx:p.tx,ty:p.ty,dir:p.dir,moving:!!p.moving},connectionId:G.DoubleRLocationConnection.id,history:history.slice(),
    reactionEvents:G.EnvironmentReactions.snapshot('diner').map(function(x){return x.events;}),saveCount:saveCount,
    roundTripComplete:history.length>=2&&E.state.mapId===MAP,fadePhase:E.state.fadePhase,canvas:{width:cv.width,height:cv.height}}; }
  function waitUntil(fn, ms, operation) {
    return new Promise(function(resolve,reject){
      var started=Date.now();
      (function loop(){
        if(operation!==token)return resolve(false);
        recordArrival();
        if(fn())return resolve(true);
        if(Date.now()-started>ms)return reject(new Error('Location preview: movement timed out'));
        setTimeout(loop,16);
      })();
    });
  }
  function pressAndWait(code, operation) {
    operation=operation===undefined?token:operation;
    if(operation!==token)return Promise.resolve(false);
    var before=E.state.mapId+':'+E.state.player.tx+','+E.state.player.ty;
    window.dispatchEvent(new KeyboardEvent('keydown',{code:code,key:code,bubbles:true}));
    window.dispatchEvent(new KeyboardEvent('keyup',{code:code,key:code,bubbles:true}));
    return waitUntil(function(){
      return (E.state.mapId+':'+E.state.player.tx+','+E.state.player.ty)!==before &&
        !E.state.player.moving && E.state.fadePhase===0;
    },3000,operation);
  }
  function resetCore(){++token;window.dispatchEvent(new Event('blur'));install();return snapshot();}
  async function walkInside(operation) {
    for(var i=0;i<4;i++)if(!await pressAndWait('ArrowUp',operation))return false;
    return waitUntil(function(){return E.state.mapId==='diner'&&E.state.fadePhase===0;},3000,operation);
  }
  async function enter(){resetCore();await walkInside(token);return snapshot();}
  async function exit(){
    if(E.state.mapId!=='diner')throw new Error('Location preview: exit requires the diner');
    await pressAndWait('ArrowDown',token);return snapshot();
  }
  async function demoRoundTrip(){
    if(busy)return snapshot();
    busy=true;document.getElementById('demo').disabled=true;resetCore();var operation=token;
    try {
      if(!await walkInside(operation))return snapshot();
      if(!await pressAndWait('ArrowDown',operation))return snapshot();
      var settled=Date.now();
      if(!await waitUntil(function(){return Date.now()-settled>=400;},1000,operation))return snapshot();
      status.textContent='Round trip complete · exterior → interior → exterior';
      return snapshot();
    } finally {
      if(operation===token){busy=false;document.getElementById('demo').disabled=false;}
    }
  }
  function reset(){var out=resetCore();busy=false;document.getElementById('demo').disabled=false;return out;}
  function setDebug(v){debug=!!v;drawDebug();return snapshot();}
  G.__LOCATION_PREVIEW__={reset:reset,snapshot:snapshot,setDebug:setDebug,enter:enter,exit:exit,demoRoundTrip:demoRoundTrip,pressAndWait:pressAndWait}; window.__LOCATION_PREVIEW__=G.__LOCATION_PREVIEW__;
  document.getElementById('toggle').onclick=function(){setDebug(!debug);}; document.getElementById('reset').onclick=reset;
  document.getElementById('demo').onclick=function(){demoRoundTrip().catch(function(error){status.textContent=error.message;});};
  function fit(){var s=Math.max(1,Math.floor(Math.min((innerWidth-(clean?0:24))/256,(innerHeight-(clean?0:120))/192))),st=document.getElementById('stage');st.style.width=(256*s)+'px';st.style.height=(192*s)+'px';}
  E.init(document.getElementById('game'),null); function begin(){E.start();install();ready=true;poll();}
  if(G.Sprites.castReady&&typeof G.Sprites.castReady.then==='function')G.Sprites.castReady.then(begin,begin);else begin(); fit(); addEventListener('resize',fit);
}());
