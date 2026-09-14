/* world-connections-production.js — install every registry connection (GAME.WorldData.connections) once.
 *
 * The single door installer: js/maps.js carries no door data, so every door in GAME.Maps comes from here.
 * Loaded after every map/scene script (glue maps and the scene installers that register native scenes)
 * and before world-engine.js. Fails loudly instead of skipping:
 *   - every record is validated against the real maps before any door is written (all-or-nothing);
 *   - a trigger tile claimed by two records, or already holding a door descriptor, is an error — there is
 *     no first-match-wins between candidate descriptors;
 *   - installing twice is an error. */
(function () {
  'use strict';

  var G = (typeof window !== 'undefined' ? window : globalThis).GAME;
  function fail(message) { throw new Error('world-connections-production: ' + message); }

  var LC = G && G.LocationConnections;
  var records = G && G.WorldData && G.WorldData.connections;
  if (!LC || !Array.isArray(records)) fail('load location-connections.js and world-connections.gen.js first');
  if (!G.Maps) fail('GAME.Maps is not built (load glue.js first)');
  if (G.WorldConnections) fail('registry connections are already installed');

  var errors = [];
  var claims = {};
  records.forEach(function (record) {
    var res = LC.validateConnection(record, G.Maps);
    res.errors.forEach(function (e) { errors.push(record.id + ': ' + e); });
    ['a', 'b'].forEach(function (side) {
      var ep = record[side];
      if (!ep || !Array.isArray(ep.triggers) || !G.Maps[ep.scene]) return;
      ep.triggers.forEach(function (t) {
        var key = t[0] + ',' + t[1];
        var claim = ep.scene + ' ' + key;
        if (claims[claim]) errors.push(claim + ' is claimed by both ' + claims[claim] + ' and ' + record.id);
        else claims[claim] = record.id;
        var doors = G.Maps[ep.scene].doors;
        if (doors && Object.prototype.hasOwnProperty.call(doors, key)) {
          errors.push(claim + ' already holds a door descriptor before ' + record.id + ' installs');
        }
      });
    });
  });
  if (errors.length) fail(errors.length + ' problem(s):\n  - ' + errors.join('\n  - '));

  records.forEach(function (record) { LC.install(record, G.Maps); });
  G.WorldConnections = Object.freeze({ installed: Object.freeze(records.map(function (r) { return r.id; })) });
}());
