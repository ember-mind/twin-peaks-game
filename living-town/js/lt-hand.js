/* lt-hand.js — Living Town: what someone watching can make happen.
 *
 * A short catalogue over LT.Interventions, for a person, not a developer: each
 * entry asks for who / where / when in words and turns the answer into the
 * typed entry the simulation already knows how to schedule. It adds no
 * intervention type, no second register and no way round validation: an entry
 * is handed to sim.scheduleIntervention, and a refusal comes back by name.
 *
 * An intervention changes a circumstance. Nothing here chooses, suggests or
 * nudges what anyone does about it.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function') {
    if (!LT.World) require('./lt-world.js');
    if (!LT.Interventions) require('./lt-interventions.js');
  }
  var W = LT.World, U = LT.Util;
  var H = LT.Hand = {};

  H.SOURCE = 'watcher';

  /* Where a small thing can be left, and where someone stands to use it. */
  H.BOOK_SPOTS = [
    { id: 'park_bench_e', label: 'the east bench in the park', locationId: 'park', x: 32, y: 17, useSpot: { x: 32, y: 18, dir: 'up' } },
    { id: 'park_jetty', label: 'the end of the jetty', locationId: 'park', x: 22, y: 20, useSpot: { x: 22, y: 19, dir: 'down' } },
    { id: 'park_lawn_w', label: 'the grass at the west end of the park', locationId: 'park', x: 4, y: 17, useSpot: { x: 4, y: 18, dir: 'up' } }
  ];   // the west bench is the one people sit on
  H.DOOR_SPOTS = {
    flat_a: { x: 6, y: 6, useSpot: { x: 5, y: 6, dir: 'right' } },
    flat_b: { x: 6, y: 5, useSpot: { x: 5, y: 5, dir: 'right' } },
    flat_c: { x: 6, y: 5, useSpot: { x: 5, y: 5, dir: 'right' } },
    flat_d: { x: 5, y: 5, useSpot: { x: 4, y: 5, dir: 'right' } },
    flat_e: { x: 4, y: 4, useSpot: { x: 3, y: 4, dir: 'right' } }
  };
  H.TITLES = ['The Harbour Year', 'A Winter of Small Repairs', 'Letters from the Salt Road', 'What the Orchard Kept',
              'The Ferryman\'s Almanac', 'Nine Rooms, One Stove'];
  H.WHEN = [
    { id: 'now', label: 'now', minutes: 0 },
    { id: 'half_hour', label: 'in half an hour', minutes: 30 },
    { id: 'two_hours', label: 'in two hours', minutes: 120 }
  ];

  function people(sim, filter) {
    return sim.actorIds().map(function (id) { return sim.state.characters[id]; })
      .filter(filter || function () { return true; })
      .map(function (c) { return { id: c.id, label: c.name }; });
  }
  function freeId(sim, prefix) {
    var taken = {}, n = 1;
    (sim.state.objects || []).forEach(function (o) { taken[o.id] = true; });
    (sim.state.interventions || []).forEach(function (r) { if (r.params && (r.params.instanceId || r.params.id)) taken[r.params.instanceId || r.params.id] = true; });
    while (taken[prefix + n]) n++;
    return prefix + n;
  }

  H.CATALOGUE = [
    {
      id: 'leave_book', label: 'Leave a book on a bench',
      blurb: 'A used book turns up in the park. Whoever comes across it may read it, or not.',
      fields: function () { return [{ key: 'spot', label: 'Where', options: H.BOOK_SPOTS.map(function (s) { return { id: s.id, label: s.label }; }) }]; },
      build: function (sim, a) {
        var spot = H.BOOK_SPOTS.filter(function (s) { return s.id === a.spot; })[0];
        if (!spot) return { error: 'unknown_spot' };
        var busy = (sim.state.objects || []).some(function (o) { return o.location === spot.locationId && o.x === spot.x && o.y === spot.y; }) ||
          (sim.state.interventions || []).some(function (r) { return r.status === 'scheduled' && r.params && r.params.locationId === spot.locationId && r.params.x === spot.x && r.params.y === spot.y; });
        if (busy) return { error: 'spot_taken' };
        var nth = (sim.state.interventions || []).filter(function (r) { return r.type === 'place_shared_book'; }).length;
        return { type: 'place_shared_book', params: { instanceId: freeId(sim, 'book_'), title: H.TITLES[nth % H.TITLES.length],
          locationId: spot.locationId, x: spot.x, y: spot.y, useSpot: spot.useSpot, requiredReadMinutes: 120 } };
      }
    },
    {
      id: 'send_parcel', label: 'Have a food parcel left at someone\'s door',
      blurb: 'Four portions, inside their door. They find it when they are next home; nobody tells them.',
      fields: function (sim) { return [{ key: 'who', label: 'For', options: people(sim, function (c) { return !!H.DOOR_SPOTS[c.homeId]; }) }]; },
      build: function (sim, a) {
        var c = sim.state.characters[a.who];
        if (!c) return { error: 'unknown_character' };
        var door = H.DOOR_SPOTS[c.homeId];
        if (!door) return { error: 'no_door_spot' };
        var busy = (sim.state.objects || []).some(function (o) { return o.location === c.homeId && o.x === door.x && o.y === door.y; }) ||
          (sim.state.interventions || []).some(function (r) { return r.status === 'scheduled' && r.type === 'deliver_food_parcel' && r.params.toId === c.id; });
        if (busy) return { error: 'spot_taken' };
        return { type: 'deliver_food_parcel', params: { instanceId: freeId(sim, 'parcel_'), toId: c.id, locationId: c.homeId,
          x: door.x, y: door.y, useSpot: door.useSpot, portions: 4 } };
      }
    },
    {
      id: 'extra_shift', label: 'Have the café post an extra shift',
      blurb: 'Two and a half hours, 40 EUR, posted at the counter. It lapses an hour after it starts.',
      fields: function (sim) { return [{ key: 'who', label: 'For', options: people(sim, function (c) { return !!c.employment; }) }]; },
      build: function (sim, a, atAbs) {
        var c = sim.state.characters[a.who];
        if (!c || !c.employment) return { error: 'not_employed' };
        var minute = atAbs % U.MINUTES_PER_DAY;
        var place = W.LOCATIONS[c.employment.locationId];
        /* Asked before the doors open, it is a shift for when they do. */
        var start = Math.max(Math.ceil((minute + 30) / 30) * 30, place ? place.opens : 0), end = start + 150;
        return { type: 'offer_extra_work', params: { toId: c.id, locationId: c.employment.locationId, startMin: start, endMin: end,
          pay: 40, expiresMin: Math.min(start + 60, end - 1), expiresDay: Math.floor(atAbs / U.MINUTES_PER_DAY) + 1 } };
      }
    }
  ];

  H.CATALOGUE.push({
    id: 'refund', label: 'A refund arrives for someone',
    blurb: 'Fifteen euro they were not counting on. Only they know.',
    fields: function (sim) { return [{ key: 'who', label: 'For', options: people(sim) }]; },
    build: function (sim, a) { return sim.state.characters[a.who] ? { type: 'money_turn', params: { toId: a.who, amount: 15, what: 'a refund they were not counting on' } } : { error: 'unknown_character' }; }
  }, {
    id: 'bill', label: 'A bill arrives for someone',
    blurb: 'Fifteen euro owed, from the pocket first and then from savings. Only they know.',
    fields: function (sim) { return [{ key: 'who', label: 'For', options: people(sim) }]; },
    build: function (sim, a) { return sim.state.characters[a.who] ? { type: 'money_turn', params: { toId: a.who, amount: -15, what: 'a repair that could not wait' } } : { error: 'unknown_character' }; }
  });

  /* Somewhere a wallet could slip out of a pocket, and where someone would
   * stand to pick it up. Only offered when the package that knows what a lost
   * wallet is has been loaded. */
  H.WALLET_SPOTS = [
    { id: 'park_path', label: 'on the path in the park', locationId: 'park', x: 22, y: 17, useSpot: { x: 22, y: 18, dir: 'up' } },
    { id: 'cafe_floor', label: 'on the café floor', locationId: 'cafe', x: 8, y: 5, useSpot: { x: 8, y: 6, dir: 'up' } }
  ];
  H.CATALOGUE.push({
    id: 'lose_wallet', label: 'Someone loses their wallet', needs: 'wallet_lost',
    blurb: 'Ten euro of theirs, lying where anyone might find it. Whoever does can give it back, or not. Its owner is not told where it is.',
    fields: function (sim) {
      return [{ key: 'who', label: 'Whose', options: people(sim, function (c) { return c.money >= 10; }) },
              { key: 'spot', label: 'Where', options: H.WALLET_SPOTS.map(function (s) { return { id: s.id, label: s.label }; }) }];
    },
    build: function (sim, a) {
      var c = sim.state.characters[a.who], spot = H.WALLET_SPOTS.filter(function (s) { return s.id === a.spot; })[0];
      if (!c) return { error: 'unknown_character' };
      if (!spot) return { error: 'unknown_spot' };
      return { type: 'wallet_lost', params: { id: freeId(sim, 'wallet_'), ownerId: c.id, cash: 10, locationId: spot.locationId, x: spot.x, y: spot.y, useSpot: spot.useSpot } };
    }
  });

  /* What can be offered in this build: an entry that needs an intervention
   * type no loaded package defines is left out rather than offered and refused. */
  H.offered = function () {
    return H.CATALOGUE.filter(function (e) { return !e.needs || !!LT.Interventions.get(e.needs); });
  };

  H.entry = function (id) { return H.CATALOGUE.filter(function (e) { return e.id === id; })[0] || null; };

  /* A refusal, in words. An error nobody has put into words yet is shown as it is. */
  var SAID = {
    spot_taken: 'something is already there, or already on its way there',
    unknown_spot: 'that is not a place a book can be left',
    unknown_character: 'there is nobody by that name in this town',
    not_employed: 'they do not work anywhere that could post a shift',
    no_door_spot: 'there is nowhere by their door to leave it',
    outside_opening_hours: 'the place is not open for the whole of that shift',
    not_recipient_home: 'a parcel can only be left at the home of the person it is for',
    instance_id_in_use: 'that very thing is already in town',
    unknown_when: 'that is not a time this page can schedule'
  };
  H.say = function (error) { return SAID[error] || String(error).replace(/_/g, ' '); };

  /* Turn an answer into a scheduled intervention, or a named refusal.
   * Returns { ok, record } or { ok:false, error, said }. */
  H.make = function (sim, id, answers, whenId) {
    var e = H.entry(id), when = H.WHEN.filter(function (w) { return w.id === (whenId || 'now'); })[0];
    function no(error) { return { ok: false, error: error, said: H.say(error) }; }
    if (!e) return no('unknown_intervention');
    if (!when) return no('unknown_when');
    var atAbs = sim.absMinute() + when.minutes;
    var built = e.build(sim, answers || {}, atAbs);
    if (built.error) return no(built.error);
    var r = sim.scheduleIntervention({ type: built.type, params: built.params, source: H.SOURCE,
      atDay: Math.floor(atAbs / U.MINUTES_PER_DAY) + 1, atMinute: atAbs % U.MINUTES_PER_DAY });
    return r.ok ? r : no(r.error);
  };

  /* What has been asked for so far, newest first, as the register has it. */
  H.asked = function (sim, limit) {
    return (sim.state.interventions || []).filter(function (r) { return r.source === H.SOURCE; }).slice().reverse().slice(0, limit || 6)
      .map(function (r) {
        var def = LT.Interventions.get(r.type);
        return { id: r.id, label: (def && def.label) || r.type, at: U.stamp(r.atDay, r.atMinute), status: r.status,
                 said: r.status === 'failed' ? H.say(r.error) : '' };
      });
  };
})();
