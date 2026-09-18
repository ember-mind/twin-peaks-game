/* lt-names.js — Living Town: who the inhabitants turn out to be.
 *
 * Content, not engine. The pools live here so a town can be reseeded with
 * different people without touching the simulation, and so no character's
 * identity is ever hardcoded into behaviour: code addresses people by a stable
 * id, and only the display layer reads a name.
 *
 * The draw is deterministic in the world seed. The same seed makes the same
 * town, a different seed makes different people, and nothing regenerates a name
 * after the world exists — the name is authoritative state from then on.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function' && !LT.Util) require('./lt-util.js');
  var N = LT.Names = LT.Names || {};

  /* Ordinary, original names. Nothing borrowed from an existing fiction. */
  N.FIRST = [
    'Nadia', 'Iris', 'Orla', 'Sanne', 'Teodora', 'Petra', 'Junia', 'Laleh',
    'Amara', 'Vesna', 'Rhea', 'Solveig', 'Mira', 'Ludo', 'Brann', 'Emre',
    'Kaisa', 'Odile', 'Tomek', 'Yara'
  ];

  N.LAST = [
    'Vellani', 'Okonkwo', 'Brandt', 'Ferraris', 'Lindqvist', 'Osei',
    'Marchetti', 'Dahlberg', 'Kovacs', 'Pereira', 'Ashby', 'Roussel',
    'Halvorsen', 'Nakamura', 'Eberhardt', 'Silvestri'
  ];

  /* A generator that hands out names without repeating a first name, so two
   * inhabitants are never confusable in the timeline. */
  N.generator = function (rng, pools) {
    pools = pools || {};
    var first = (pools.first || N.FIRST).slice();
    var last = (pools.last || N.LAST).slice();
    if (!first.length || !last.length) throw new Error('a name pool cannot be empty');
    return function () {
      if (!first.length) first = (pools.first || N.FIRST).slice();
      var f = first.splice(Math.floor(rng() * first.length), 1)[0];
      var l = last[Math.floor(rng() * last.length)];
      return { name: f, familyName: l, fullName: f + ' ' + l };
    };
  };
})();
