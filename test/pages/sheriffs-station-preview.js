(function () {
  'use strict';

  var G = window.GAME;
  var Engine = G.Engine;
  var Scene = G.SheriffsStationScene;
  var MAP_ID = Scene.mapId;
  var TILE = 16;
  var query = new URLSearchParams(window.location.search);
  var clean = query.get('clean') === '1';
  var debugEnabled = query.get('debug') === '1';
  var ready = false;
  var routesComplete = false;
  var routeVisits = [];
  var runGeneration = 0;
  var activeDemo = null;

  var stage = document.getElementById('stage');
  var canvas = document.getElementById('game');
  var debugCanvas = document.getElementById('debug');
  var debugContext = debugCanvas.getContext('2d');
  var status = document.getElementById('status');
  debugContext.imageSmoothingEnabled = false;

  function setStatus(message) {
    status.textContent = message || '';
  }

  function worldDetails() {
    var location = G.World.getLocationForScene(Engine.state.mapId);
    var environment;
    if (location) {
      environment = location.environments.find(function (candidate) {
        return candidate.sceneId === Engine.state.mapId;
      });
    }
    return {
      location: location,
      environment: environment,
      connections: location ? Array.from(G.World.getConnections(location.id)) : []
    };
  }

  function snapshot() {
    var player = Engine.state && Engine.state.player;
    var world = Engine.state ? worldDetails() : {};
    return {
      ready: ready,
      mapId: Engine.state && Engine.state.mapId,
      canvas: { width: canvas.width, height: canvas.height },
      player: player ? { tx: player.tx, ty: player.ty, dir: player.dir, moving: !!player.moving } : null,
      worldLocation: world.location && world.location.id,
      worldEnvironment: world.environment && world.environment.id,
      connections: world.connections || [],
      routesComplete: routesComplete,
      routeVisits: routeVisits.slice(),
      atlasId: G.Retro2D && G.Retro2D.castRenderer && G.Retro2D.castRenderer.id
    };
  }

  function resize() {
    var reservedHeight = clean ? 0 : 72;
    var availableHeight = Math.max(192, window.innerHeight - reservedHeight);
    var scale = Math.max(1, Math.floor(Math.min(window.innerWidth / 256, availableHeight / 192)));
    stage.style.width = 256 * scale + 'px';
    stage.style.height = 192 * scale + 'px';
    stage.dataset.scale = String(scale);
  }

  function reset() {
    runGeneration++;
    routesComplete = false;
    routeVisits = [];
    Engine.state.mode = 'title';
    var entrance = Scene.layout.targets.entrance;
    Engine.loadMap(MAP_ID, entrance.x, entrance.y, 'up');
    Engine.state.mode = 'play';
    Engine.state.fade = 0;
    Engine.state.fadePhase = 0;
    Engine.state.dialogue = null;
    Engine.state.menu = false;
    setStatus('Ready');
    drawDebug();
    return snapshot();
  }

  function keyCode(direction) {
    return { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[direction];
  }

  function waitFor(predicate, timeout, failure) {
    return new Promise(function (resolve, reject) {
      var started = performance.now();
      function check(now) {
        if (predicate()) return resolve();
        if (now - started >= timeout) return reject(new Error(failure));
        requestAnimationFrame(check);
      }
      requestAnimationFrame(check);
    });
  }

  async function step(direction, generation) {
    var player = Engine.state.player;
    var before = player.tx + ',' + player.ty;
    var code = keyCode(direction);
    if (!code) throw new Error('Unknown direction: ' + direction);

    window.dispatchEvent(new KeyboardEvent('keydown', { code: code }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code: code }));
    await waitFor(function () {
      return generation !== runGeneration || Engine.state.player.moving ||
        before !== Engine.state.player.tx + ',' + Engine.state.player.ty;
    }, 500, 'Movement did not start toward ' + direction + ' from ' + before);
    if (generation !== runGeneration) throw new Error('Route cancelled by reset');
    await waitFor(function () {
      return generation !== runGeneration ||
        (!Engine.state.player.moving && before !== Engine.state.player.tx + ',' + Engine.state.player.ty);
    }, 1500, 'Movement did not complete toward ' + direction + ' from ' + before);
    if (generation !== runGeneration) throw new Error('Route cancelled by reset');
  }

  function pathTo(target) {
    var start = [Engine.state.player.tx, Engine.state.player.ty];
    var queue = [{ point: start, directions: [] }];
    var seen = new Set([start.join(',')]);
    var directions = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];
    while (queue.length) {
      var current = queue.shift();
      if (current.point[0] === target.x && current.point[1] === target.y) return current.directions;
      directions.forEach(function (direction) {
        var x = current.point[0] + direction[1];
        var y = current.point[1] + direction[2];
        var key = x + ',' + y;
        var occupied = Engine.state.npcs.some(function (npc) {
          return Engine.npcActive(npc) && ((npc.x === x && npc.y === y) ||
            (npc.moving && npc.mx === x && npc.my === y));
        });
        if (!seen.has(key) && !occupied && !G.Maps.isSolid(MAP_ID, x, y, Engine.state)) {
          seen.add(key);
          queue.push({ point: [x, y], directions: current.directions.concat(direction[0]) });
        }
      });
    }
    return null;
  }

  async function goTo(name) {
    if (!ready) throw new Error('Preview is not ready');
    var target = Scene.layout.targets[name];
    if (!target) throw new Error('Unknown route target: ' + name);
    var route = pathTo(target);
    if (route === null) throw new Error('No walkable route to ' + name);
    var generation = runGeneration;
    setStatus('Walking to ' + name + '…');
    for (var i = 0; i < route.length; i++) await step(route[i], generation);
    var player = Engine.state.player;
    if (player.tx !== target.x || player.ty !== target.y) {
      throw new Error('Route to ' + name + ' ended at ' + player.tx + ',' + player.ty);
    }
    routeVisits.push(name);
    setStatus('Arrived at ' + name);
    return snapshot();
  }

  function demoRoutes() {
    if (activeDemo) return activeDemo;
    activeDemo = (async function () {
      reset();
      /* 'exit' sits on the live front-entrance trigger tiles (7,11/8,11):
       * arriving there fires the real door warp to the exterior scene, same
       * as in normal play. Walking the demo route onto it would leave
       * 'sheriff' mid-sweep and strand every target visited afterward, so
       * it is excluded from the automatic walkthrough. */
      var names = Object.keys(Scene.layout.targets).filter(function (name) { return name !== 'exit'; });
      for (var i = 0; i < names.length; i++) await goTo(names[i]);
      routesComplete = names.every(function (name) { return routeVisits.indexOf(name) >= 0; });
      if (!routesComplete) throw new Error('Route demo did not visit every named target');
      setStatus('All ' + names.length + ' routes complete');
      return snapshot();
    }()).finally(function () {
      activeDemo = null;
    });
    return activeDemo;
  }

  function drawDebug() {
    debugContext.clearRect(0, 0, 256, 192);
    if (!debugEnabled || !G.Maps[MAP_ID]) return;
    var map = G.Maps[MAP_ID];
    var x;
    var y;
    debugContext.fillStyle = 'rgba(184, 47, 65, .32)';
    for (y = 0; y < map.height; y++) {
      for (x = 0; x < map.width; x++) {
        if (G.Maps.isSolid(MAP_ID, x, y, Engine.state)) debugContext.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    }
    debugContext.strokeStyle = 'rgba(244, 230, 200, .22)';
    debugContext.lineWidth = 1;
    for (x = 0; x <= map.width; x++) {
      debugContext.beginPath(); debugContext.moveTo(x * TILE + 0.5, 0); debugContext.lineTo(x * TILE + 0.5, map.height * TILE); debugContext.stroke();
    }
    for (y = 0; y <= map.height; y++) {
      debugContext.beginPath(); debugContext.moveTo(0, y * TILE + 0.5); debugContext.lineTo(map.width * TILE, y * TILE + 0.5); debugContext.stroke();
    }
    Object.keys(Scene.layout.targets).forEach(function (name) {
      var target = Scene.layout.targets[name];
      debugContext.fillStyle = '#ffe060';
      debugContext.fillRect(target.x * TILE + 5, target.y * TILE + 5, 6, 6);
    });
    var props = G.SheriffsStationArt && G.SheriffsStationArt.props || [];
    props.forEach(function (prop) {
      debugContext.strokeStyle = 'rgba(88, 208, 255, .72)';
      debugContext.beginPath();
      debugContext.moveTo(prop.bounds[0], prop.footY + 0.5);
      debugContext.lineTo(prop.bounds[0] + prop.bounds[2], prop.footY + 0.5);
      debugContext.stroke();
    });
  }

  function setDebug(value) {
    debugEnabled = !!value;
    drawDebug();
    return snapshot();
  }

  async function boot() {
    document.body.classList.toggle('clean', clean);
    resize();
    window.addEventListener('resize', resize);
    Engine.init(canvas, null);
    if (G.Sprites.castReady && typeof G.Sprites.castReady.then === 'function') await G.Sprites.castReady;
    Engine.start();
    ready = true;
    reset();
    requestAnimationFrame(function debugLoop() { drawDebug(); requestAnimationFrame(debugLoop); });
  }

  var api = { snapshot: snapshot, reset: reset, setDebug: setDebug, demoRoutes: demoRoutes, goTo: goTo };
  G.__SHERIFF_PREVIEW__ = api;
  window.__SHERIFF_PREVIEW__ = api;
  document.getElementById('toggle').onclick = function () { setDebug(!debugEnabled); };
  document.getElementById('reset').onclick = reset;
  document.getElementById('demo').onclick = function () { demoRoutes().catch(function (error) { setStatus(error.message); }); };
  boot().catch(function (error) { ready = false; setStatus(error.message); throw error; });
}());
