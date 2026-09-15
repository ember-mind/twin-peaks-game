'use strict';

// EDITOR CORE — index / FACADE. Assembles ONE Editor namespace out of the ten core pieces, so a consumer
// (dev glue, tests, future UI) reaches identity/hitTest/selection/model/changeset/draft/history/validation/
// interaction/inspector through a single entry point instead of ten separate files.
//
// WHY A FACADE: every sibling is game-agnostic and self-registers its sub-namespace (each IIFE does
// globalThis.Editor = R or module.exports = api). Stacking them in load order already accumulates one object
// in the browser; this file makes that assembly EXPLICIT and portable to node by requiring each piece, and it
// emits a frozen `assembly` manifest so tests can assert "all ten pieces present" without re-listing them.
//
// THIS FILE STAYS RUNTIME-FREE ON PURPOSE (it carries no runtime token): it only composes siblings, never
// reaches the runtime or world data. That is what keeps the core grep-guard clean; the sole game-aware
// bridge lives in js/world-builder-data.js (the adapter), which is outside this guarded directory.
(function () {
    // module file -> canonical key under which its API is exposed on the assembled Editor.
  const PIECES = [
     ['identity', 'identity'],
     ['hit-test', 'hitTest'],
     ['selection', 'selection'],
     ['model', 'model'],
     ['changeset', 'changeset'],
     ['draft', 'draft'],
     ['history', 'history'],
     ['validation', 'validation'],
     ['interaction', 'interaction'],
     ['inspector', 'inspector'],
     ['edit', 'edit'],
     ['cast', 'cast']
    ];

    // node: require each sibling so it exports its API; the core stays game-agnostic because no piece reads
    // runtime world data. browser: <script> tags already ran each sibling, so read what accumulated on the
    // neutral Editor namespace. Either way the assembled shape and key set are identical.
  function assemble() {
    const R = {};
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
      PIECES.forEach(function (p) {
        const m = require('./' + p[0] + '.js');
        if (m) R[p[1]] = m;
        });
     } else {
      const acc = (typeof globalThis !== 'undefined' && globalThis.Editor) || {};
      PIECES.forEach(function (p) {
        if (acc[p[1]]) R[p[1]] = acc[p[1]];
        });
      }
    R.assembly = Object.freeze(PIECES.map(function (p) {
      return Object.freeze({ module: p[0], key: p[1], present: !!R[p[1]] });
       }));
    return Object.freeze(R);
     }

  const api = assemble();

     // node exports the assembled object; a browser consumer keeps seeing its sub-namespaces plus `assembly`.
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = api;
   } else if (typeof globalThis !== 'undefined') {
    globalThis.Editor = globalThis.Editor || {};
    Object.assign(globalThis.Editor, api);
     }
  return api;
})();
