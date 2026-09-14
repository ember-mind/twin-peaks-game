/* location-connections.js — compile a semantic connection into map doors.
 *
 * Paired record (default): both endpoints carry triggers + spawn; install writes doors on both maps.
 * One-way record ("one_way": true): a carries triggers and no spawn (nobody arrives there through this
 * record), b carries a spawn and an empty triggers list; install writes doors only on a's map.
 * Door fields on the endpoint that owns the trigger: needsFlag, blockedMsg (strings), needsClues
 * (positive integer, the engine's clue-count gate). */
(function () {
  'use strict';

  var G = (typeof window !== 'undefined' ? window : globalThis);
  var GAME = G.GAME = G.GAME || {};
  var DIRECTIONS = { up: 1, down: 1, left: 1, right: 1 };

  function fail(message) {
    throw new Error('LocationConnections: ' + message);
  }

  function tileKey(tile) {
    return tile[0] + ',' + tile[1];
  }

  /* state: the player state the walkability check assumes. Spawn tiles use no clues; trigger tiles of a
   * door gated by needsClues are judged with that many clues held (glue's 'X' barrier opens at 3). */
  function validateTile(label, tile, map, maps, state) {
    if (!Array.isArray(tile) || tile.length !== 2 ||
        !Number.isInteger(tile[0]) || !Number.isInteger(tile[1])) {
      fail(label + ' must be an integer [x,y] tile');
    }
    var x = tile[0], y = tile[1];
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) {
      fail(label + ' is outside map bounds');
    }
    var solid = typeof maps.isSolid === 'function'
      ? maps.isSolid(map.id, x, y, state || { clues: [] })
      : (typeof map.isSolid === 'function' ? map.isSolid(x, y) : false);
    if (solid) fail(label + ' must be walkable');
  }

  /* opts.oneWay: the endpoint belongs to a one-way record. Only b of a one-way record may have empty
   * triggers (and must); only a of a one-way record has no spawn (and must not). */
  function validateEndpoint(name, endpoint, maps, opts) {
    var oneWay = !!(opts && opts.oneWay);
    if (!endpoint || typeof endpoint.scene !== 'string' || !endpoint.scene) {
      fail(name + '.scene is required');
    }
    var map = maps[endpoint.scene];
    if (!map) fail('map "' + endpoint.scene + '" does not exist');
    if (!map.doors || typeof map.doors !== 'object') fail(endpoint.scene + '.doors is required');
    if (!Number.isInteger(map.width) || !Number.isInteger(map.height)) {
      fail(endpoint.scene + ' must have integer dimensions');
    }
    if (!Array.isArray(endpoint.triggers)) fail(name + '.triggers must be an array');
    if (oneWay && name === 'b') {
      if (endpoint.triggers.length !== 0) fail('b.triggers must be empty on a one-way connection');
    } else if (endpoint.triggers.length === 0) {
      fail(name + '.triggers must not be empty');
    }
    var triggerKeys = {};
    var gate = endpoint.door && Number.isInteger(endpoint.door.needsClues) && endpoint.door.needsClues > 0
      ? { clues: new Array(endpoint.door.needsClues).fill('gate') } : { clues: [] };
    endpoint.triggers.forEach(function (tile, index) {
      validateTile(name + '.triggers[' + index + ']', tile, map, maps, gate);
      var key = tileKey(tile);
      if (triggerKeys[key]) fail(name + '.triggers contains duplicate tile ' + key);
      triggerKeys[key] = true;
    });
    var spawn = endpoint.spawn;
    if (oneWay && name === 'a') {
      if (spawn !== undefined) fail('a.spawn is not allowed on a one-way connection');
      validateDoor(name, endpoint);
      return { endpoint: endpoint, map: map, triggerKeys: Object.keys(triggerKeys) };
    }
    if (!spawn || !Number.isInteger(spawn.tx) || !Number.isInteger(spawn.ty)) {
      fail(name + '.spawn must contain integer tx and ty');
    }
    if (!Object.prototype.hasOwnProperty.call(DIRECTIONS, spawn.dir)) {
      fail(name + '.spawn.dir must be up, down, left, or right');
    }
    validateTile(name + '.spawn', [spawn.tx, spawn.ty], map, maps);
    if (triggerKeys[spawn.tx + ',' + spawn.ty]) {
      fail(name + '.spawn must be outside its trigger tiles');
    }
    validateDoor(name, endpoint);
    return { endpoint: endpoint, map: map, triggerKeys: Object.keys(triggerKeys) };
  }

  function validateDoor(name, endpoint) {
    if (endpoint.door === undefined) return;
    if (!endpoint.door || typeof endpoint.door !== 'object' || Array.isArray(endpoint.door)) {
      fail(name + '.door must be an object');
    }
    if (oneWayB(name, endpoint)) fail(name + '.door is not allowed without triggers');
    ['needsFlag', 'blockedMsg'].forEach(function (key) {
      if (endpoint.door[key] !== undefined && typeof endpoint.door[key] !== 'string') {
        fail(name + '.door.' + key + ' must be a string');
      }
    });
    if (endpoint.door.needsClues !== undefined &&
        (!Number.isInteger(endpoint.door.needsClues) || endpoint.door.needsClues < 1)) {
      fail(name + '.door.needsClues must be a positive integer');
    }
  }
  function oneWayB(name, endpoint) { return name === 'b' && Array.isArray(endpoint.triggers) && endpoint.triggers.length === 0; }

  function isOneWay(connection) {
    if (connection.one_way !== undefined && connection.one_way !== true) fail('one_way must be true when present');
    return connection.one_way === true;
  }

  function copyDoorFields(target, endpoint) {
    if (!endpoint.door) return;
    ['needsFlag', 'blockedMsg', 'needsClues'].forEach(function (key) {
      if (endpoint.door[key] !== undefined) target[key] = endpoint.door[key];
    });
  }

  function install(connection, maps) {
    maps = maps || GAME.Maps;
    if (!maps) fail('maps are required');
    if (!connection || typeof connection.id !== 'string' || !connection.id) fail('id is required');

    var oneWay = isOneWay(connection);
    var a = validateEndpoint('a', connection.a, maps, { oneWay: oneWay });
    var b = validateEndpoint('b', connection.b, maps, { oneWay: oneWay });
    if (connection.a.scene === connection.b.scene) fail('endpoints must use different scenes');

    var descriptorA = {
      connectionId: connection.id,
      to: connection.b.scene,
      tx: connection.b.spawn.tx,
      ty: connection.b.spawn.ty,
      dir: connection.b.spawn.dir
    };
    if (connection.a.departureReaction) descriptorA.departureReaction = connection.a.departureReaction;
    copyDoorFields(descriptorA, connection.a);

    var writes = [];
    a.triggerKeys.forEach(function (key) { writes.push({ doors: a.map.doors, key: key, value: descriptorA }); });
    if (!oneWay) {
      var descriptorB = {
        connectionId: connection.id,
        to: connection.a.scene,
        tx: connection.a.spawn.tx,
        ty: connection.a.spawn.ty,
        dir: connection.a.spawn.dir
      };
      if (connection.b.departureReaction) descriptorB.departureReaction = connection.b.departureReaction;
      copyDoorFields(descriptorB, connection.b);
      b.triggerKeys.forEach(function (key) { writes.push({ doors: b.map.doors, key: key, value: descriptorB }); });
    }
    writes.forEach(function (write) {
      write.hadOwn = Object.prototype.hasOwnProperty.call(write.doors, write.key);
      write.previous = write.doors[write.key];
      write.doors[write.key] = write.value;
    });

    var installed = true;
    return {
      connection: connection,
      uninstall: function () {
        if (!installed) return;
        installed = false;
        writes.forEach(function (write) {
          if (write.hadOwn) write.doors[write.key] = write.previous;
          else delete write.doors[write.key];
        });
      }
    };
  }

     /* validateConnection runs the SAME endpoint checks as install() but returns a {valid,errors} list
      * instead of mutating GAME.Maps — the editor and the node apply tool call this to validate an edited
      * connection before it ever becomes a changeset or touches a map. It catches each endpoint's throw so
      * every problem is reported at once rather than crashing on the first. */
    function validateConnection(connection, maps) {
      maps = maps || GAME.Maps;
      if (!maps) return { valid: false, errors: ['maps are required'] };
      if (!connection || typeof connection.id !== 'string' || !connection.id) {
        return { valid: false, errors: ['id is required'] };
        }
       var errors = [];
      var oneWay = false;
      try { oneWay = isOneWay(connection); }
      catch (e) { errors.push(e.message.replace(/^LocationConnections: /, '')); }
      ['a', 'b'].forEach(function (side) {
        try { validateEndpoint(side, connection[side], maps, { oneWay: oneWay }); }
        catch (e) { errors.push(e.message.replace(/^LocationConnections: /, '')); }
         });
      if (connection.a && connection.b && connection.a.scene === connection.b.scene) {
        errors.push('endpoints must use different scenes');
        }
          return { valid: errors.length === 0, errors: errors };
          }

       /* connectionRecordsFor filters the canonical registry (GAME.WorldData.connections, set by
        * world-connections.gen.js) down to the records a location owns, looked up by id. Production
        * installers use this instead of the retired *LocationConnections group arrays, so the install
        * survives those files being deleted. It throws when the registry is not loaded yet rather than
        * skipping: a silent skip would let a missing record masquerade as "no doors" — the very bug the
        * deletion exists to prevent. */
       function connectionRecordsFor(ids) {
         var recs = GAME.WorldData && GAME.WorldData.connections;
         if (!Array.isArray(recs)) {
           fail('GAME.WorldData.connections not loaded (require world-connections.gen.js first)');
          }
         return ids.map(function (id) {
           for (var i = 0; i < recs.length; i++) { if (recs[i].id === id) return recs[i]; }
            fail('registry has no connection with id "' + id + '"');
            });
          }

       GAME.LocationConnections = { install: install, validateEndpoint: validateEndpoint, validateConnection: validateConnection, connectionRecordsFor: connectionRecordsFor, isOneWay: function (c) { return !!c && c.one_way === true; } };
      }());
