(function () {
  'use strict';
  var G = window.GAME, E = G.Engine, scene = G.DoubleRExteriorScene;
  var MAP = scene.mapId, map = scene.map;
  scene.install();
  var query = typeof location === 'undefined' ? '' : location.search;
  var debug = new URLSearchParams(query).get('debug') === '1';
  var route = [], triggerVisits = 0, lastTile = '', demoBusy = false, ready = false, demoToken = 0;
  var status = document.getElementById('status'), overlay = document.getElementById('debug');
  var dctx = overlay.getContext('2d'); dctx.imageSmoothingEnabled = false;

  function install() {
    E.state.mode = 'title'; E.loadMap(MAP, 6, 10, 'up');
    E.state.mode = 'play'; E.state.dialogue = null; E.state.fade = 0; E.state.fadePhase = 0;
    route = [[6, 10]]; triggerVisits = 0; lastTile = '6,10';
    status.textContent = '';
  }
  function snapshot() {
    var p = E.state.player;
    var cv=document.getElementById('game');
    return { ready:ready, mapId:E.state.mapId, canvas:{width:cv.width,height:cv.height},
      player:{tx:p.tx,ty:p.ty,moving:!!p.moving}, debug:debug, triggerVisits:triggerVisits,
      route:route.map(function (xy) { return xy.slice(); }), atlasId:G.Retro2D && G.Retro2D.castRenderer && G.Retro2D.castRenderer.id,
      transitionDisabled:true };
  }
  function drawDebug() {
    dctx.clearRect(0,0,256,192); if (!debug || E.state.mapId !== MAP) return;
    dctx.fillStyle='rgba(184,47,65,.25)';
    map.rows.forEach(function(row,y){ for(var x=0;x<16;x++) if(row.charAt(x)==='T') dctx.fillRect(x*16,y*16,16,16); });
    dctx.fillStyle='rgba(244,230,200,.18)';
    for(var gx=0;gx<256;gx+=16)dctx.fillRect(gx,0,1,192);
    for(var gy=0;gy<192;gy+=16)dctx.fillRect(0,gy,256,1);
    dctx.fillStyle='rgba(35,220,100,.40)'; dctx.fillRect(6*16,6*16,16,16); dctx.fillRect(7*16,6*16,16,16);
    dctx.strokeStyle='rgba(255,220,80,.7)'; dctx.lineWidth=1; dctx.beginPath(); dctx.moveTo(0,96.5); dctx.lineTo(256,96.5); dctx.moveTo(0,112.5); dctx.lineTo(256,112.5); dctx.stroke();
  }
  function recordPosition() {
    var p=E.state.player, key=p.tx+','+p.ty;
    if (!p.moving && key !== lastTile) { route.push([p.tx,p.ty]); lastTile=key; if (key==='6,6'||key==='7,6') { triggerVisits++; status.textContent='Entrance reached — transition disabled'; } }
  }
  function poll() { recordPosition(); drawDebug(); requestAnimationFrame(poll); }
  function pressAndWait(code) {
    var p=E.state.player, ox=p.tx, oy=p.ty;
    window.dispatchEvent(new KeyboardEvent('keydown',{code:code,key:code,bubbles:true}));
    window.dispatchEvent(new KeyboardEvent('keyup',{code:code,key:code,bubbles:true}));
    return new Promise(function(resolve){ var started=Date.now(); (function check(){
      var q=E.state.player;
      if (!q.moving && (q.tx!==ox||q.ty!==oy || Date.now()-started>150)) { recordPosition(); return resolve(snapshot()); }
      if (Date.now()-started>2000) return resolve(snapshot());
      setTimeout(check,16);
    })(); });
  }
  async function demo() {
    if(demoBusy)return snapshot();
    demoBusy=true; var token=++demoToken; install();
    for(var i=0;i<4 && token===demoToken;i++) await pressAndWait('ArrowUp');
    if(token===demoToken)demoBusy=false;
    recordPosition(); return snapshot();
  }
  function reset(){ ++demoToken; demoBusy=false; install(); }
  function setDebug(v){ debug=!!v; drawDebug(); return snapshot(); }
  G.__EXTERIOR_PREVIEW__={reset:reset,snapshot:snapshot,setDebug:setDebug,demo:demo,pressAndWait:pressAndWait};
  window.__EXTERIOR_PREVIEW__ = G.__EXTERIOR_PREVIEW__;
  document.getElementById('toggle').onclick=function(){setDebug(!debug);};
  document.getElementById('reset').onclick=reset; document.getElementById('demo').onclick=demo;
  var clean = new URLSearchParams(query).get('clean') === '1';
  document.body.classList.toggle('clean',clean);
  function fitStage(){
    var scale=Math.max(1,Math.floor(Math.min((innerWidth-(clean?0:24))/256,(innerHeight-(clean?0:140))/192)));
    var st=document.getElementById('stage'); st.style.width=(256*scale)+'px'; st.style.height=(192*scale)+'px';
  }
  E.init(document.getElementById('game'),null);
  function begin(){ E.start(); install(); ready=true; poll(); }
  if (G.Sprites.castReady && typeof G.Sprites.castReady.then === 'function') G.Sprites.castReady.then(begin,begin); else begin();
  fitStage(); addEventListener('resize',fitStage);
})();
