(function () {
  'use strict';

  var G = window.GAME;
  var Engine = G.Engine;
  var Activity = G.CharacterActivity;
  var Scene = G.SheriffsStationScene;
  var MAP_ID = Scene.mapId;
  var ACTOR_ID = 'station-truman';
  var SEED = 1989;
  var query = new URLSearchParams(window.location.search);
  var clean = query.get('clean') === '1';
  var ready = false;
  var paused = false;
  var accelerated = false;
  var rate = 1;
  var observationStartedAt = 0;
  var activeRoute = null;

  var stage = document.getElementById('stage');
  var canvas = document.getElementById('game');
  var debug = document.getElementById('debug');
  var debugDetails = document.getElementById('debug-details');

  function actorNpc() {
    return Engine.state && Engine.state.npcs.find(function (npc) { return npc.id === ACTOR_ID; });
  }

  function actorDetails() {
    return Activity.actorSnapshot(ACTOR_ID) || {
      pose: { state: 'still', animation: null, frame: -1, spriteFrame: null, direction: null },
      nextEvent: null,
      time: 0,
      observationMs: 0,
      stillMs: 0,
      events: 0,
      history: [],
      behaviors: []
    };
  }

  function snapshot() {
    var actor = actorDetails();
    var pose = actor.pose;
    var npc = actorNpc();
    var player = Engine.state && Engine.state.player;
    var observationMs = observationStartedAt ? Math.max(0, performance.now() - observationStartedAt) : 0;
    return {
      ready: ready,
      mapId: Engine.state && Engine.state.mapId,
      canvas: { width: canvas.width, height: canvas.height },
      player: player ? { tx: player.tx, ty: player.ty, dir: player.dir, moving: !!player.moving } : null,
      npc: npc ? { id: npc.id, sprite: npc.sprite, x: npc.x, y: npc.y, dir: npc.dir, moving: !!npc.moving } : null,
      state: pose.state,
      animation: pose.animation,
      frame: pose.frame,
      spriteFrame: pose.spriteFrame,
      direction: pose.direction,
      nextIdleEvent: actor.nextEvent == null ? null : Math.max(0, actor.nextEvent - actor.time),
      contextual: pose.state === 'contextual',
      reactive: pose.state === 'reactive',
      paused: paused,
      accelerated: accelerated,
      rate: rate,
      observationMs: observationMs,
      logicalObservationMs: actor.observationMs,
      stillMs: actor.stillMs,
      stillFraction: actor.observationMs ? actor.stillMs / actor.observationMs : 1,
      observationComplete: observationMs >= 60000,
      events: actor.events,
      history: actor.history.slice(),
      behaviors: actor.behaviors.map(function (behavior) {
        return { id: behavior.id, active: behavior.active, next: behavior.next, events: behavior.events };
      }),
      atlasId: G.Retro2D && G.Retro2D.castRenderer && G.Retro2D.castRenderer.id,
      characterLifeFrames: G.Retro2D && G.Retro2D.characterLifeFrames
        ? Object.keys(G.Retro2D.characterLifeFrames.frames) : []
    };
  }

  function resize() {
    var panelWidth = clean || window.innerWidth <= 980 ? 0 : 430;
    var panelHeight = clean || window.innerWidth > 980 ? 0 : 470;
    var gutter = clean ? 0 : 32;
    var scale = Math.max(1, Math.floor(Math.min(
      Math.max(256, window.innerWidth - panelWidth - gutter) / 256,
      Math.max(192, window.innerHeight - panelHeight - gutter) / 192
    )));
    stage.style.width = 256 * scale + 'px';
    stage.style.height = 192 * scale + 'px';
    stage.dataset.scale = String(scale);
  }

  function reset() {
    if (activeRoute) throw new Error('Interaction demo is still running');
    paused = false;
    accelerated = false;
    rate = 1;
    Activity.setPaused(false);
    Activity.setEnabled(true);
    Activity.setActorTimeScale(1);
    Activity.reset(SEED);
    Engine.state.mode = 'title';
    var entrance = Scene.layout.targets.entrance;
    Engine.loadMap(MAP_ID, entrance.x, entrance.y, 'up');
    Engine.state.mode = 'play';
    Engine.state.fade = 0;
    Engine.state.fadePhase = 0;
    Engine.state.dialogue = null;
    Engine.state.menu = false;
    Activity.update(0, Engine.state);
    observationStartedAt = performance.now();
    activeRoute = null;
    syncControls();
    return snapshot();
  }

  function setPaused(value) {
    paused = !!value;
    if (!paused) Activity.clearActorPreview(ACTOR_ID);
    Activity.setPaused(paused);
    syncControls();
    return snapshot();
  }

  function setAccelerated(value) {
    accelerated = !!value;
    rate = accelerated ? 12 : 1;
    Activity.setActorTimeScale(rate);
    syncControls();
    return snapshot();
  }

  function setManualPose(name) {
    var npc = actorNpc();
    if (!npc) throw new Error('Station Truman is not loaded');
    setPaused(true);
    Activity.clearActorPreview(ACTOR_ID);
    if (name === 'still') {
      npc.dir = 'down';
    } else if (name === 'blink') {
      npc.dir = 'down';
      Activity.previewActor(ACTOR_ID, 'blink', 65, 0);
    } else if (name === 'reading-raised') {
      npc.dir = 'down';
      Activity.previewActor(ACTOR_ID, 'read-file', 0, 0);
    } else if (name === 'reading-lowered') {
      npc.dir = 'down';
      Activity.previewActor(ACTOR_ID, 'read-file', 1250, 0);
    } else if (name === 'reaction-left' || name === 'reaction-right') {
      npc.dir = name === 'reaction-left' ? 'left' : 'right';
      Activity.reactToInteractor(npc, Engine.state);
    } else {
      throw new Error('Unknown manual pose: ' + name);
    }
    return snapshot();
  }

  function clearManualPose() {
    Activity.clearActorPreview(ACTOR_ID);
    return setPaused(false);
  }

  function keyCode(direction) {
    return { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[direction];
  }

  function waitFor(predicate, timeout, message) {
    return new Promise(function (resolve, reject) {
      var started = performance.now();
      function poll(now) {
        if (predicate()) return resolve();
        if (now - started >= timeout) return reject(new Error(message));
        requestAnimationFrame(poll);
      }
      requestAnimationFrame(poll);
    });
  }

  async function step(direction) {
    var before = Engine.state.player.tx + ',' + Engine.state.player.ty;
    var code = keyCode(direction);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: code }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code: code }));
    await waitFor(function () {
      return Engine.state.player.moving || before !== Engine.state.player.tx + ',' + Engine.state.player.ty;
    }, 500, 'Movement did not start toward ' + direction);
    await waitFor(function () {
      return !Engine.state.player.moving && before !== Engine.state.player.tx + ',' + Engine.state.player.ty;
    }, 1500, 'Movement did not complete toward ' + direction);
  }

  function routeTo(target) {
    var start = [Engine.state.player.tx, Engine.state.player.ty];
    var queue = [{ point: start, route: [] }];
    var seen = new Set([start.join(',')]);
    var npc = actorNpc();
    var directions = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];
    while (queue.length) {
      var current = queue.shift();
      if (current.point[0] === target.x && current.point[1] === target.y) return current.route;
      directions.forEach(function (direction) {
        var x = current.point[0] + direction[1];
        var y = current.point[1] + direction[2];
        var key = x + ',' + y;
        var npcBlocked = npc && npc.x === x && npc.y === y;
        if (!seen.has(key) && !npcBlocked && !G.Maps.isSolid(MAP_ID, x, y, Engine.state)) {
          seen.add(key);
          queue.push({ point: [x, y], route: current.route.concat(direction[0]) });
        }
      });
    }
    return null;
  }

  async function demoInteraction() {
    if (activeRoute) return activeRoute;
    activeRoute = (async function () {
      Activity.clearActorPreview(ACTOR_ID);
      setPaused(false);
      var target = { x: 11, y: 4 };
      var route = routeTo(target);
      if (!route) throw new Error('No route to the Truman interaction point');
      for (var i = 0; i < route.length; i++) await step(route[i]);
      if (Engine.state.player.tx !== 11 || Engine.state.player.ty !== 4) throw new Error('Interaction route ended at the wrong tile');

      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowLeft' }));
      await waitFor(function () { return Engine.state.player.dir === 'left' && !Engine.state.player.moving; }, 500, 'Cooper did not face Truman');
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Enter' }));
      await waitFor(function () {
        var npc = actorNpc();
        var pose = Activity.actorPose(ACTOR_ID);
        return npc && npc.dir === 'right' && pose && pose.state === 'reactive';
      }, 500, 'Truman did not react to the real interaction');
      await waitFor(function () {
        var npc = actorNpc();
        var pose = Activity.actorPose(ACTOR_ID);
        return npc && npc.dir === 'down' && pose && pose.state === 'still';
      }, 1500, 'Truman did not return to his task focus');
      return snapshot();
    }()).finally(function () { activeRoute = null; syncControls(); });
    syncControls();
    return activeRoute;
  }

  function observeLogical(duration) {
    var started = actorDetails().observationMs;
    return waitFor(function () {
      return actorDetails().observationMs - started >= duration;
    }, Math.max(2000, duration + 2000), 'Observation did not reach ' + duration + 'ms');
  }

  function syncControls() {
    document.getElementById('pause').textContent = paused ? 'Resume' : 'Pause';
    document.getElementById('accelerate').textContent = 'Accelerated review: ' + (accelerated ? 'on (12× waits)' : 'off');
    document.getElementById('reset').disabled = !!activeRoute;
  }

  function updateDebug() {
    if (debugDetails.open) debug.textContent = JSON.stringify(snapshot(), null, 2);
    window.setTimeout(updateDebug, 125);
  }

  async function boot() {
    document.body.classList.toggle('clean', clean);
    debugDetails.open = query.get('debug') === '1';
    resize();
    window.addEventListener('resize', resize);
    Engine.init(canvas, null);
    if (G.Sprites.castReady && typeof G.Sprites.castReady.then === 'function') await G.Sprites.castReady;
    if (G.Sprites.characterLifeReady && typeof G.Sprites.characterLifeReady.then === 'function') {
      var lifeReady = await G.Sprites.characterLifeReady;
      if (!lifeReady) throw new Error('Character Life frame sheet failed validation');
    }
    Engine.start();
    ready = true;
    reset();
    updateDebug();
  }

  var api = {
    snapshot: snapshot,
    reset: reset,
    setPaused: setPaused,
    setAccelerated: setAccelerated,
    setManualPose: setManualPose,
    clearManualPose: clearManualPose,
    demoInteraction: demoInteraction,
    observeLogical: observeLogical
  };
  G.__CHARACTER_LIFE_PREVIEW__ = api;
  window.__CHARACTER_LIFE_PREVIEW__ = api;

  document.getElementById('pause').onclick = function () { setPaused(!paused); };
  document.getElementById('reset').onclick = reset;
  document.getElementById('accelerate').onclick = function () { setAccelerated(!accelerated); };
  document.getElementById('interact').onclick = function () { demoInteraction().catch(function (error) { debug.textContent = error.stack || error.message; }); };
  Array.from(document.querySelectorAll('[data-pose]')).forEach(function (button) {
    button.onclick = function () { setManualPose(button.dataset.pose); };
  });
  boot().catch(function (error) { ready = false; debugDetails.open = true; debug.textContent = error.stack || error.message; throw error; });
}());
