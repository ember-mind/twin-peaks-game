/* lt-content.js — Living Town: where a content package says what it brings.
 *
 * A package adds actions through LT.Actions.define and interventions through
 * LT.Interventions.define. What it also has to declare, once, is here:
 *
 *   - its id and the version of its definitions and mechanics. That version is
 *     what a save is compatible with or not. The state of one saved instance —
 *     a parcel opened, forty minutes of a book read — is not a version of
 *     anything, and never makes a save incompatible.
 *   - for every object type it creates: how to check a saved instance, and
 *     what that instance looks like right now (a type id and a visual state,
 *     read from the instance, never stored).
 *
 * This is a table, not a system: no clock, no scheduling, no inventory.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  var C = LT.Content = LT.Content || {};

  var PACKAGES = {}, TYPES = {}, PAINTERS = {};

  C.register = function (pkg) {
    if (!pkg || typeof pkg.id !== 'string' || typeof pkg.version !== 'string') throw new Error('a content package needs an id and a version');
    if (PACKAGES[pkg.id]) {
      if (PACKAGES[pkg.id] === pkg) return pkg;
      throw new Error('content package "' + pkg.id + '" is already registered');
    }
    Object.keys(pkg.objectTypes || {}).forEach(function (typeId) {
      var t = pkg.objectTypes[typeId];
      if (TYPES[typeId]) throw new Error('object type "' + typeId + '" is already registered by ' + TYPES[typeId].packageId);
      if (typeof t.validate !== 'function') throw new Error('object type "' + typeId + '" needs validate(object, env)');
    });
    Object.keys(pkg.objectTypes || {}).forEach(function (typeId) {
      var t = pkg.objectTypes[typeId];
      TYPES[typeId] = { packageId: pkg.id, validate: t.validate, visual: t.visual || null };
    });
    PACKAGES[pkg.id] = pkg;
    return pkg;
  };

  C.packageOf = function (typeId) { return TYPES[typeId] ? TYPES[typeId].packageId : null; };
  C.version = function (packageId) { return PACKAGES[packageId] ? PACKAGES[packageId].version : null; };
  C.interventionPackage = function (type) {
    var found = null;
    Object.keys(PACKAGES).forEach(function (id) {
      if ((PACKAGES[id].interventionTypes || []).indexOf(type) >= 0) found = id;
    });
    return found;
  };

  /* The packages a given state actually depends on, with their versions. */
  C.usedBy = function (state) {
    var used = {};
    (state.objects || []).forEach(function (o) { if (o.typeId && TYPES[o.typeId]) used[TYPES[o.typeId].packageId] = true; });
    (state.interventions || []).forEach(function (r) { var p = C.interventionPackage(r.type); if (p) used[p] = true; });
    Object.keys(used).forEach(function (id) { used[id] = PACKAGES[id].version; });
    return used;
  };

  /* null when the instance is sound, otherwise a sentence fragment. */
  C.validateObject = function (object, env) {
    var t = TYPES[object.typeId];
    if (!t) return 'is of type "' + object.typeId + '", which no loaded content package provides';
    try { return t.validate(object, env) || null; } catch (e) { return 'could not be checked: ' + (e && e.message); }
  };

  /* { typeId, state } for an instance as it is this minute, or null. */
  C.visualOf = function (object, sim) {
    var t = object && object.typeId && TYPES[object.typeId];
    if (!t || !t.visual) return null;
    return t.visual(object, sim);
  };

  /* Who can draw a visual type. A painter reads its arguments and writes to
   * the canvas; it is never handed the simulation. */
  C.registerPainter = function (typeId, paint) {
    if (PAINTERS[typeId] && PAINTERS[typeId] !== paint) throw new Error('a painter for "' + typeId + '" is already registered');
    PAINTERS[typeId] = paint;
  };
  C.painterFor = function (typeId) { return PAINTERS[typeId] || null; };
})();
