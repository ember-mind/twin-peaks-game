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
        var copy = Object.freeze({ id: environmentId, sceneId: sceneId });
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
    }
  };
  Object.defineProperty(World, 'catalog', { enumerable: true, get: function () { return catalog; } });
  GAME.World = Object.freeze(World);
}());
