(function () {
  'use strict';

  var G = window.GAME;
  var Engine = G.Engine;
  var Activity = G.CharacterActivity;
  var Scene = G.SheriffsStationScene;
  var MAP_ID = Scene.mapId;
  var SEED = 1989;
  var ACTORS = [
    { id: 'truman', name: 'Truman', focus: 'down', activity: 'read-file', side: 1, face: 'left', reactive: 'right' },
    { id: 'lucy', name: 'Lucy', focus: 'down', activity: 'telephone', side: 1, face: 'left', reactive: 'right' },
    { id: 'andy', name: 'Andy', focus: 'down', activity: 'check-note', side: -1, face: 'right', reactive: 'left' }
  ];
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

  function actorDefinition(id) {
    return ACTORS.find(function (actor) { return actor.id === id; });
  }

  function actorNpc(id) {
    return Engine.state && Engine.state.npcs.find(function (npc) { return npc.id === id; });
  }

  function emptyDetails(id) {
    return {
      id: id,
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

  function actorSnapshot(definition) {
    var details = Activity.actorSnapshot(definition.id) || emptyDetails(definition.id);
    var pose = details.pose;
    var npc = actorNpc(definition.id);
    return {
      id: definition.id,
      name: definition.name,
      npc: npc ? {
        id: npc.id,
        sprite: npc.sprite,
        x: npc.x,
        y: npc.y,
        dir: npc.dir,
        moving: !!npc.moving
      } : null,
      managed: Activity.managedActor(definition.id),
      state: pose.state,
      animation: pose.animation,
      frame: pose.frame,
      spriteFrame: pose.spriteFrame,
      direction: pose.direction,
      contextual: pose.state === 'contextual',
      reactive: pose.state === 'reactive',
      nextEventMs: details.nextEvent == null ? null : Math.max(0, details.nextEvent - details.time),
      logicalObservationMs: details.observationMs,
      stillMs: details.stillMs,
      stillFraction: details.observationMs ? details.stillMs / details.observationMs : 1,
      events: details.events,
      history: details.history.slice(),
      behaviors: details.behaviors.map(function (behavior) {
        return {
          id: behavior.id,
          active: behavior.active,
          next: behavior.next,
          events: behavior.events
        };
      })
    };
  }

  function snapshot() {
    var player = Engine.state && Engine.state.player;
    var actorList = ACTORS.map(actorSnapshot);
    var actors = {};
    var totalObservation = 0;
    var totalStill = 0;
    actorList.forEach(function (actor) {
      actors[actor.id] = actor;
      totalObservation += actor.logicalObservationMs;
      totalStill += actor.stillMs;
    });
    var namedRoutes = namedRouteStatus();
    var observationMs = observationStartedAt ? Math.max(0, performance.now() - observationStartedAt) : 0;
    return {
      ready: ready,
      mapId: Engine.state && Engine.state.mapId,
      canvas: { width: canvas.width, height: canvas.height },
      player: player ? { tx: player.tx, ty: player.ty, dir: player.dir, moving: !!player.moving } : null,
      actorCount: actorList.filter(function (actor) { return !!actor.npc; }).length,
      actors: actors,
      actorList: actorList,
      allManaged: actorList.every(function (actor) { return actor.managed; }),
      allStationary: actorList.every(function (actor) { return actor.npc && !actor.npc.moving; }),
      namedRoutes: namedRoutes,
      allNamedRoutesReachable: Object.keys(namedRoutes).every(function (name) { return namedRoutes[name]; }),
      paused: paused,
      accelerated: accelerated,
      rate: rate,
      observationMs: observationMs,
      observationComplete: observationMs >= 60000,
      aggregateStillFraction: totalObservation ? totalStill / totalObservation : 1,
      atlasId: G.Retro2D && G.Retro2D.castRenderer && G.Retro2D.castRenderer.id,
      populationFrameIds: G.Retro2D && G.Retro2D.characterLifeFrames
        ? Object.keys(G.Retro2D.characterLifeFrames.frames) : []
    };
  }

  function resize() {
    var panelWidth = clean || window.innerWidth <= 1020 ? 0 : 440;
    var panelHeight = clean || window.innerWidth > 1020 ? 0 : 520;
    var gutter = clean ? 0 : 32;
    var scale = Math.max(1, Math.floor(Math.min(
      Math.max(256, window.innerWidth - panelWidth - gutter) / 256,
      Math.max(192, window.innerHeight - panelHeight - gutter) / 192
    )));
    stage.style.width = 256 * scale + 'px';
    stage.style.height = 192 * scale + 'px';
    stage.dataset.scale = String(scale);
  }

  function clearAllPreviews() {
    ACTORS.forEach(function (definition) {
      Activity.clearActorPreview(definition.id);
      var npc = actorNpc(definition.id);
      if (npc && !npc.moving) npc.dir = definition.focus;
    });
  }

  function reset(seed) {
    if (activeRoute) throw new Error('Population interaction demo is still running');
    paused = false;
    accelerated = false;
    rate = 1;
    Activity.setPaused(false);
    Activity.setEnabled(true);
    Activity.setActorTimeScale(1);
    Activity.reset(seed == null ? SEED : seed);
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
    syncControls();
    return snapshot();
  }

  function setPaused(value) {
    paused = !!value;
    if (!paused) clearAllPreviews();
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

  function setManualPose(actorId, poseName) {
    var definition = actorDefinition(actorId);
    var npc = actorNpc(actorId);
    if (!definition || !npc) throw new Error('Population actor is not loaded: ' + actorId);
    setPaused(true);
    clearAllPreviews();
    npc.dir = definition.focus;
    if (poseName === 'still') return snapshot();
    if (poseName === 'blink') {
      Activity.previewActor(actorId, 'blink', 65, 0);
    } else if (poseName === definition.activity) {
      Activity.previewActor(actorId, definition.activity, 0, 0);
    } else {
      throw new Error('Unknown pose for ' + actorId + ': ' + poseName);
    }
    return snapshot();
  }

  function clearManualPose() {
    clearAllPreviews();
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

  function nextFrame() {
    return new Promise(function (resolve) { requestAnimationFrame(resolve); });
  }

  async function dismissDialogue(timeout) {
    var started = performance.now();
    while (Engine.state.dialogue) {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Enter' }));
      await nextFrame();
      if (performance.now() - started >= (timeout || 2000)) throw new Error('Dialogue did not close');
    }
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

  function occupied(x, y) {
    return Engine.state.npcs.some(function (npc) { return npc.x === x && npc.y === y; });
  }

  function routeToFrom(start, target) {
    var queue = [{ point: start, route: [] }];
    var seen = new Set([start.join(',')]);
    var directions = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];
    while (queue.length) {
      var current = queue.shift();
      if (current.point[0] === target.x && current.point[1] === target.y) return current.route;
      directions.forEach(function (direction) {
        var x = current.point[0] + direction[1];
        var y = current.point[1] + direction[2];
        var key = x + ',' + y;
        if (!seen.has(key) && !occupied(x, y) && !G.Maps.isSolid(MAP_ID, x, y, Engine.state)) {
          seen.add(key);
          queue.push({ point: [x, y], route: current.route.concat(direction[0]) });
        }
      });
    }
    return null;
  }

  function routeTo(target) {
    return routeToFrom([Engine.state.player.tx, Engine.state.player.ty], target);
  }

  function namedRouteStatus() {
    var result = {};
    if (!Engine.state || Engine.state.mapId !== MAP_ID) return result;
    var entrance = Scene.layout.targets.entrance;
    Object.keys(Scene.layout.targets).forEach(function (name) {
      var target = Scene.layout.targets[name];
      result[name] = !occupied(target.x, target.y)
        && routeToFrom([entrance.x, entrance.y], target) !== null;
    });
    return result;
  }

  async function face(direction) {
    var code = keyCode(direction);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: code }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code: code }));
    await waitFor(function () {
      return Engine.state.player.dir === direction && !Engine.state.player.moving;
    }, 500, 'Cooper did not face ' + direction);
  }

  async function interactWith(definition) {
    var npc = actorNpc(definition.id);
    if (!npc) throw new Error(definition.name + ' is not loaded');
    var point = { x: npc.x + definition.side, y: npc.y };
    if (occupied(point.x, point.y) || G.Maps.isSolid(MAP_ID, point.x, point.y, Engine.state)) {
      throw new Error(definition.name + ' interaction point is blocked');
    }
    var route = routeTo(point);
    if (!route) throw new Error('No route to ' + definition.name + ' interaction point');
    for (var index = 0; index < route.length; index++) await step(route[index]);
    if (Engine.state.player.tx !== point.x || Engine.state.player.ty !== point.y) {
      throw new Error(definition.name + ' interaction route ended at the wrong tile');
    }
    await face(definition.face);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Enter' }));
    await waitFor(function () {
      var current = actorNpc(definition.id);
      var pose = Activity.actorPose(definition.id);
      return current && current.dir === definition.reactive && pose && pose.state === 'reactive';
    }, 500, definition.name + ' did not face Cooper reactively');
    var reactive = snapshot().actors[definition.id];
    await dismissDialogue();
    await waitFor(function () {
      var current = actorNpc(definition.id);
      var pose = Activity.actorPose(definition.id);
      return current && current.dir === definition.focus && pose && pose.state === 'still';
    }, 1500, definition.name + ' did not restore task focus');
    return {
      id: definition.id,
      interactionPoint: point,
      reactiveDirection: reactive.npc.dir,
      reactiveState: reactive.state,
      restoredDirection: actorNpc(definition.id).dir,
      restoredState: Activity.actorPose(definition.id).state
    };
  }

  function demoInteractions() {
    if (activeRoute) return activeRoute;
    activeRoute = (async function () {
      clearAllPreviews();
      setPaused(false);
      var proofs = [];
      for (var index = 0; index < ACTORS.length; index++) {
        proofs.push(await interactWith(ACTORS[index]));
      }
      return { proofs: proofs, snapshot: snapshot() };
    }()).finally(function () {
      activeRoute = null;
      syncControls();
    });
    syncControls();
    return activeRoute;
  }

  function observeReal(duration) {
    duration = duration == null ? 61000 : duration;
    var started = performance.now();
    return waitFor(function () {
      return performance.now() - started >= duration;
    }, duration + 3000, 'Real population observation did not reach ' + duration + 'ms').then(snapshot);
  }

  function syncControls() {
    document.getElementById('pause').textContent = paused ? 'Resume' : 'Pause';
    document.getElementById('accelerate').textContent = 'Accelerated review: ' + (accelerated ? 'on (12× waits)' : 'off');
    document.getElementById('reset').disabled = !!activeRoute;
    document.getElementById('interact-all').disabled = !!activeRoute;
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
      var populationReady = await G.Sprites.characterLifeReady;
      if (!populationReady) throw new Error('Station Population frame sheet failed validation');
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
    demoInteractions: demoInteractions,
    observeReal: observeReal
  };
  G.__STATION_POPULATION_PREVIEW__ = api;
  window.__STATION_POPULATION_PREVIEW__ = api;

  document.getElementById('pause').onclick = function () { setPaused(!paused); };
  document.getElementById('reset').onclick = function () { reset(); };
  document.getElementById('accelerate').onclick = function () { setAccelerated(!accelerated); };
  document.getElementById('interact-all').onclick = function () {
    demoInteractions().catch(function (error) { debugDetails.open = true; debug.textContent = error.stack || error.message; });
  };
  document.getElementById('return-live').onclick = clearManualPose;
  Array.from(document.querySelectorAll('[data-actor][data-pose]')).forEach(function (button) {
    button.onclick = function () { setManualPose(button.dataset.actor, button.dataset.pose); };
  });
  boot().catch(function (error) {
    ready = false;
    debugDetails.open = true;
    debug.textContent = error.stack || error.message;
    throw error;
  });
}());
