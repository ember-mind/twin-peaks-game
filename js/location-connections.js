/* location-connections.js — compile a semantic two-way connection into map doors. */
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

  function validateTile(label, tile, map, maps) {
    if (!Array.isArray(tile) || tile.length !== 2 ||
        !Number.isInteger(tile[0]) || !Number.isInteger(tile[1])) {
      fail(label + ' must be an integer [x,y] tile');
    }
    var x = tile[0], y = tile[1];
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) {
      fail(label + ' is outside map bounds');
    }
    var solid = typeof maps.isSolid === 'function'
      ? maps.isSolid(map.id, x, y, { clues: [] })
      : (typeof map.isSolid === 'function' ? map.isSolid(x, y) : false);
    if (solid) fail(label + ' must be walkable');
  }

  function validateEndpoint(name, endpoint, maps) {
    if (!endpoint || typeof endpoint.scene !== 'string' || !endpoint.scene) {
      fail(name + '.scene is required');
    }
    var map = maps[endpoint.scene];
    if (!map) fail('map "' + endpoint.scene + '" does not exist');
    if (!map.doors || typeof map.doors !== 'object') fail(endpoint.scene + '.doors is required');
    if (!Number.isInteger(map.width) || !Number.isInteger(map.height)) {
      fail(endpoint.scene + ' must have integer dimensions');
    }
    if (!Array.isArray(endpoint.triggers) || endpoint.triggers.length === 0) {
      fail(name + '.triggers must not be empty');
    }
    var triggerKeys = {};
    endpoint.triggers.forEach(function (tile, index) {
      validateTile(name + '.triggers[' + index + ']', tile, map, maps);
      var key = tileKey(tile);
      if (triggerKeys[key]) fail(name + '.triggers contains duplicate tile ' + key);
      triggerKeys[key] = true;
    });
    var spawn = endpoint.spawn;
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
    if (endpoint.door !== undefined) {
      if (!endpoint.door || typeof endpoint.door !== 'object' || Array.isArray(endpoint.door)) {
        fail(name + '.door must be an object');
      }
      ['needsFlag', 'blockedMsg'].forEach(function (key) {
        if (endpoint.door[key] !== undefined && typeof endpoint.door[key] !== 'string') {
          fail(name + '.door.' + key + ' must be a string');
        }
      });
    }
    return { endpoint: endpoint, map: map, triggerKeys: Object.keys(triggerKeys) };
  }

  function copyDoorFields(target, endpoint) {
    if (!endpoint.door) return;
    ['needsFlag', 'blockedMsg'].forEach(function (key) {
      if (endpoint.door[key] !== undefined) target[key] = endpoint.door[key];
    });
  }

  function install(connection, maps) {
    maps = maps || GAME.Maps;
    if (!maps) fail('maps are required');
    if (!connection || typeof connection.id !== 'string' || !connection.id) fail('id is required');

    var a = validateEndpoint('a', connection.a, maps);
    var b = validateEndpoint('b', connection.b, maps);
    if (connection.a.scene === connection.b.scene) fail('endpoints must use different scenes');

    var descriptorA = {
      connectionId: connection.id,
      to: connection.b.scene,
      tx: connection.b.spawn.tx,
      ty: connection.b.spawn.ty,
      dir: connection.b.spawn.dir
    };
    var descriptorB = {
      connectionId: connection.id,
      to: connection.a.scene,
      tx: connection.a.spawn.tx,
      ty: connection.a.spawn.ty,
      dir: connection.a.spawn.dir
    };
    if (connection.a.departureReaction) descriptorA.departureReaction = connection.a.departureReaction;
    if (connection.b.departureReaction) descriptorB.departureReaction = connection.b.departureReaction;
    copyDoorFields(descriptorA, connection.a);
    copyDoorFields(descriptorB, connection.b);

    var writes = [];
    a.triggerKeys.forEach(function (key) { writes.push({ doors: a.map.doors, key: key, value: descriptorA }); });
    b.triggerKeys.forEach(function (key) { writes.push({ doors: b.map.doors, key: key, value: descriptorB }); });
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
      ['a', 'b'].forEach(function (side) {
        try { validateEndpoint(side, connection[side], maps); }
        catch (e) { errors.push(e.message.replace(/^LocationConnections: /, '')); }
         });
      if (connection.a && connection.b && connection.a.scene === connection.b.scene) {
        errors.push('endpoints must use different scenes');
        }
      return { valid: errors.length === 0, errors: errors };
      }

     GAME.LocationConnections = { install: install, validateEndpoint: validateEndpoint, validateConnection: validateConnection };
  }());
