/* world-engine.js — immutable catalog boundary for authored locations. */
(function () {
  'use strict';

  var G = (typeof window !== 'undefined' ? window : globalThis);
  var GAME = G.GAME = G.GAME || {};
  var catalog;
  var locationsById;
  var locationsByScene;
  var environmentsByLocation;
  var allConnections;

  function fail(message) {
    throw new Error('World: ' + message);
  }

  function requireId(value, label) {
    if (typeof value !== 'string' || value.length === 0) fail(label + ' must be a nonempty string');
    return value;
  }

  function requireDense(array, label) {
    for (var i = 0; i < array.length; i++) {
      if (!Object.prototype.hasOwnProperty.call(array, i)) fail(label + ' must not contain empty entries');
    }
  }

  function requireRecord(value, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail(label + ' must be an object');
    return value;
  }

  function requireKeys(value, allowed, label) {
    Object.keys(value).forEach(function (key) {
      if (allowed.indexOf(key) === -1) fail(label + ' has unknown field "' + key + '"');
    });
  }

  function requireList(value, label) {
    if (!Array.isArray(value)) fail(label + ' must be an array');
    requireDense(value, label);
    return value;
  }

  function copyStrings(value, label) {
    return Object.freeze(requireList(value, label).map(function (item, index) {
      return requireId(item, label + '[' + index + ']');
    }));
  }

  /* Authoring metadata only. No spatial or actor state is owned here. */
  function copyProgram(source, label) {
    requireRecord(source, label);
    requireKeys(source, ['intent', 'visualGoals', 'activities', 'groups'], label);
    var intent = requireRecord(source.intent, label + '.intent');
    requireKeys(intent, ['function', 'playerExperience', 'tone'], label + '.intent');
    var activityIds = Object.create(null);
    var groupIds = Object.create(null);
    var goalIds = Object.create(null);
    var activities = requireList(source.activities, label + '.activities').map(function (activity, index) {
      var at = label + '.activities[' + index + ']';
      requireRecord(activity, at);
      requireKeys(activity, ['id', 'description'], at);
      var id = requireId(activity.id, at + '.id');
      if (activityIds[id]) fail('duplicate activity id "' + id + '" in ' + label);
      activityIds[id] = true;
      return Object.freeze({ id: id, description: requireId(activity.description, at + '.description') });
    });
    var goals = requireList(source.visualGoals, label + '.visualGoals').map(function (goal, index) {
      var at = label + '.visualGoals[' + index + ']';
      requireRecord(goal, at);
      requireKeys(goal, ['id', 'aim'], at);
      var id = requireId(goal.id, at + '.id');
      if (goalIds[id]) fail('duplicate visual goal id "' + id + '" in ' + label);
      goalIds[id] = true;
      return Object.freeze({ id: id, aim: requireId(goal.aim, at + '.aim') });
    });
    var groups = requireList(source.groups, label + '.groups').map(function (group, index) {
      var at = label + '.groups[' + index + ']';
      requireRecord(group, at);
      requireKeys(group, ['id', 'role', 'anchors', 'activities', 'visual'], at);
      var id = requireId(group.id, at + '.id');
      if (groupIds[id]) fail('duplicate group id "' + id + '" in ' + label);
      groupIds[id] = true;
      var groupActivities = copyStrings(group.activities, at + '.activities');
      groupActivities.forEach(function (activityId) {
        if (!activityIds[activityId]) fail(at + ' references unknown activity "' + activityId + '"');
      });
      return Object.freeze({
        id: id,
        role: requireId(group.role, at + '.role'),
        anchors: copyStrings(group.anchors, at + '.anchors'),
        activities: groupActivities,
        visual: requireId(group.visual, at + '.visual')
      });
    });
    return Object.freeze({
      intent: Object.freeze({
        function: requireId(intent.function, label + '.intent.function'),
        playerExperience: requireId(intent.playerExperience, label + '.intent.playerExperience'),
        tone: requireId(intent.tone, label + '.intent.tone')
      }),
      visualGoals: Object.freeze(goals),
      activities: Object.freeze(activities),
      groups: Object.freeze(groups)
    });
  }

  function prepare(source) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) fail('catalog must be an object');
    var worldId = requireId(source.id, 'catalog.id');
    if (!Array.isArray(source.locations) || source.locations.length === 0) {
      fail('catalog.locations must be a nonempty array');
    }
    requireDense(source.locations, 'catalog.locations');

    var nextLocationsById = Object.create(null);
    var nextLocationsByScene = Object.create(null);
    var nextEnvironmentsByLocation = Object.create(null);
    var connectionSeen = Object.create(null);
    var nextAllConnections = [];

    var nextLocations = source.locations.map(function (location, locationIndex) {
      var label = 'catalog.locations[' + locationIndex + ']';
      if (!location || typeof location !== 'object' || Array.isArray(location)) fail(label + ' must be an object');
      var locationId = requireId(location.id, label + '.id');
      if (nextLocationsById[locationId]) fail('duplicate location id "' + locationId + '"');
      if (!Array.isArray(location.environments) || location.environments.length === 0) {
        fail(label + '.environments must be a nonempty array');
      }
      if (!Array.isArray(location.connections)) fail(label + '.connections must be an array');
      requireDense(location.environments, label + '.environments');
      requireDense(location.connections, label + '.connections');

      var environmentIds = Object.create(null);
      var environmentIndex = Object.create(null);
      var nextEnvironments = location.environments.map(function (environment, index) {
        var environmentLabel = label + '.environments[' + index + ']';
        if (!environment || typeof environment !== 'object' || Array.isArray(environment)) {
          fail(environmentLabel + ' must be an object');
        }
        var environmentId = requireId(environment.id, environmentLabel + '.id');
        var sceneId = requireId(environment.sceneId, environmentLabel + '.sceneId');
        if (environmentIds[environmentId]) {
          fail('duplicate environment id "' + environmentId + '" in location "' + locationId + '"');
        }
        if (nextLocationsByScene[sceneId]) fail('duplicate scene id "' + sceneId + '"');
        if (GAME.Maps && (!Object.prototype.hasOwnProperty.call(GAME.Maps, sceneId) || !GAME.Maps[sceneId])) {
          fail('map "' + sceneId + '" does not exist');
        }
        environmentIds[environmentId] = true;
        var environmentCopy = { id: environmentId, sceneId: sceneId };
        if (Object.prototype.hasOwnProperty.call(environment, 'program')) {
          environmentCopy.program = copyProgram(environment.program, environmentLabel + '.program');
        }
        var copy = Object.freeze(environmentCopy);
        environmentIndex[environmentId] = copy;
        nextLocationsByScene[sceneId] = locationId;
        return copy;
      });

      var localConnections = Object.create(null);
      var nextConnections = location.connections.map(function (connectionId, index) {
        requireId(connectionId, label + '.connections[' + index + ']');
        if (localConnections[connectionId]) {
          fail('duplicate connection id "' + connectionId + '" in location "' + locationId + '"');
        }
        localConnections[connectionId] = true;
        if (!connectionSeen[connectionId]) {
          connectionSeen[connectionId] = true;
          nextAllConnections.push(connectionId);
        }
        return connectionId;
      });

      var copy = Object.freeze({
        id: locationId,
        environments: Object.freeze(nextEnvironments),
        connections: Object.freeze(nextConnections)
      });
      nextLocationsById[locationId] = copy;
      nextEnvironmentsByLocation[locationId] = environmentIndex;
      return copy;
    });

    return {
      catalog: Object.freeze({ id: worldId, locations: Object.freeze(nextLocations) }),
      locationsById: nextLocationsById,
      locationsByScene: nextLocationsByScene,
      environmentsByLocation: nextEnvironmentsByLocation,
      allConnections: Object.freeze(nextAllConnections)
    };
  }

  function register(source) {
    if (catalog !== undefined) fail('catalog is already registered');
    var prepared = prepare(source);
    catalog = prepared.catalog;
    locationsById = prepared.locationsById;
    locationsByScene = prepared.locationsByScene;
    environmentsByLocation = prepared.environmentsByLocation;
    allConnections = prepared.allConnections;
    return catalog;
  }

  var World = {
    register: register,
    getLocation: function (id) {
      return locationsById && locationsById[id];
    },
    getEnvironment: function (locationId, environmentId) {
      var environments = environmentsByLocation && environmentsByLocation[locationId];
      return environments && environments[environmentId];
    },
    getLocationForScene: function (sceneId) {
      var locationId = locationsByScene && locationsByScene[sceneId];
      return locationId === undefined ? undefined : locationsById[locationId];
    },
     getConnections: function (locationId) {
       if (locationId === undefined) return allConnections;
       var location = locationsById && locationsById[locationId];
       return location && location.connections;
      },
    /* connections() returns the canonical connection RECORDS from GAME.WorldData — the single registry
     * that replaced the four *-location-data groups. getConnections() above resolves a location to its
     * list of ids (catalog membership); this resolves the authoritative record bodies (a/b endpoints,
     * door fields) that install into GAME.Maps.<scene>.doors and that the World Builder edits through
     * changesets. Read lazily from WorldData so it is independent of load order: catalog registers its
     * ids while records live in the registry module, which may load before or after this one. The
     * returned array is a fresh frozen copy; each record is already deep-frozen by world-connections.gen.js. */
     connections: function () {
       var data = G.GAME.WorldData;
       if (!data || !Array.isArray(data.connections)) {
         throw new Error('World.connections(): GAME.WorldData.connections missing — load js/world-connections.gen.js');
         }
       return Object.freeze(data.connections.slice());
      }
     };
  Object.defineProperty(World, 'catalog', { enumerable: true, get: function () { return catalog; } });
  GAME.World = Object.freeze(World);
}());
