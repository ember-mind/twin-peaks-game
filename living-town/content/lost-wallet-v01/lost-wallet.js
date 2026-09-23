/* lost-wallet.js — Living Town: content package `lost-wallet-v01`.
 *
 * One wallet someone has lost, which somebody else may find. All state lives on
 * the object in sim.state.objects; nothing is kept in a closure.
 *
 * The object moves through four states: 'lost' (lying on the ground, offering
 * pick_up_wallet), 'carried' (held by whoever found it, offering
 * return_wallet and keep_wallet_money), 'returned' (back with its owner) and
 * 'kept' (the finder took the money). The cash is never duplicated: it leaves
 * the owner when the wallet is lost and lands, exactly once, in the owner's or
 * the finder's pocket.
 *
 * The intervention is registered through the real LT.Interventions.define and
 * the three actions through the real LT.Actions.define. Once carried, the
 * wallet's own `heldAffordances` are what let a carrier be offered
 * return_wallet / keep_wallet_money at all: the core (lt-perception.js,
 * LT.Perception.HELD_AFFORDANCES) offers them from that list, exactly as it
 * offers pick_up_wallet from `affordances` while the wallet lies on the
 * ground. This package sets and clears both lists; it never touches
 * perception itself.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function') {
    if (!LT.Util) require('../../js/lt-util.js');
    if (!LT.World) require('../../js/lt-world.js');
    if (!LT.Actions) require('../../js/lt-actions.js');
    if (!LT.Content) require('../../js/lt-content.js');
    if (!LT.Interventions) require('../../js/lt-interventions.js');
    if (!LT.Sim) require('../../js/lt-sim.js');
  }
  var W = LT.World, A = LT.Actions, I = LT.Interventions, C = LT.Content;
  var LW = LT.LostWallet = LT.LostWallet || {};

  var VERSION = 'v01';
  var TYPE_ID = 'wallet_lost';
  var STATUSES = ['lost', 'carried', 'returned', 'kept'];
  var MAX_ID_LENGTH = 64;

  LW.VERSION = VERSION;
  LW.TYPE_ID = TYPE_ID;
  LW.STATUSES = STATUSES.slice();

  /* ---------------- small typed checks ---------------- */

  function isFiniteNumber(v) { return typeof v === 'number' && isFinite(v); }
  function isInteger(v) { return isFiniteNumber(v) && Math.floor(v) === v; }
  function isArray(v) { return Object.prototype.toString.call(v) === '[object Array]'; }
  function isIdString(v) {
    return typeof v === 'string' && v.length > 0 && v.length <= MAX_ID_LENGTH;
  }
  function isDir(v) { return v === 'up' || v === 'down' || v === 'left' || v === 'right'; }

  function inBounds(loc, x, y) {
    return !!loc && isInteger(x) && isInteger(y) && y >= 0 && y < loc.rows.length &&
           x >= 0 && x < loc.rows[0].length;
  }
  function cellAt(loc, x, y) { return loc.rows[y].charAt(x); }
  function isWall(loc, x, y) { return !inBounds(loc, x, y) || cellAt(loc, x, y) === '#'; }
  function isFloor(loc, x, y) { return inBounds(loc, x, y) && !W.isSolid(cellAt(loc, x, y)); }

  /* Reachable through the room's real collision rows, using the simulation's
   * own pathfinder rather than a second copy of the rule. */
  function reachableFromSpawn(sim, loc, x, y) {
    if (x === loc.spawn.x && y === loc.spawn.y) return true;
    return sim.nextStep(loc, loc.spawn, { x: x, y: y }) !== null;
  }

  /* The carried wallet, read from the one place it can be: state.objects. A
   * wallet is carried by at most one person, and this is the only lookup. */
  function carriedWallet(state, actorId) {
    for (var i = 0; i < state.objects.length; i++) {
      var o = state.objects[i];
      if (o.typeId === TYPE_ID && o.status === 'carried' && o.heldBy === actorId) return o;
    }
    return null;
  }
  function carriedWalletOf(state, actorId, ownerId) {
    var w = carriedWallet(state, actorId);
    return (w && w.ownerId === ownerId) ? w : null;
  }

  /* ---------------- object builder (pure state, JSON-safe) ---------------- */

  LW.makeWalletObject = function (p, record) {
    return {
      id: p.id,
      typeId: TYPE_ID,
      name: 'a lost wallet',
      ownerId: p.ownerId,
      cash: p.cash,
      /* On the ground while lost; null once carried, returned or kept. */
      location: p.locationId,
      x: p.x, y: p.y,
      anchors: { pick_up_wallet: { x: p.useSpot.x, y: p.useSpot.y, dir: p.useSpot.dir || 'down' } },
      tags: ['wallet', 'money', 'lost'],
      portable: true,
      /* What is available where. Perception offers `affordances` while lying
       * on the ground and `heldAffordances` while carried (lt-perception.js,
       * LT.Perception.HELD_AFFORDANCES); this package only maintains the two
       * lists as the wallet moves between states. */
      affordances: ['pick_up_wallet'],
      heldAffordances: [],
      heldBy: null,
      foundBy: null,
      inUseBy: null,          // the core's claim while someone picks it up
      status: 'lost',
      interventionId: record ? record.id : null
    };
  };

  /* ---------------- the actions ----------------
   *
   * Contract from lt-actions.js: id, label, targetKind, position, duration(ctx),
   * eligible(ctx), tick(ctx, minutes), onComplete(ctx), onInterrupt(ctx),
   * interruptible. These are definitions; the catalogue is the only place a
   * decision can pick from, and nothing here chooses anything.
   */

  var ACTIONS = {};

  /* True only where the consequence may land: in the same room, no longer
   * walking, and standing on the declared pick-up spot. Approaching a wallet is
   * not picking it up. */
  function atUseSpot(ctx, actionId) {
    var target = ctx.target;
    if (!target || ctx.actor.transit || ctx.actor.location !== target.location) return false;
    if (ctx.actor.walkTarget) return false;
    var def = ACTIONS[actionId];
    var spot = ctx.sim.anchorFor(ctx.actor, def, target);
    if (!spot) return false;
    return ctx.actor.pos.x === spot.x && ctx.actor.pos.y === spot.y;
  }

  /* The core walks a beside_person action to a free cell next to the target;
   * this is the package's own check that the settlement is not landing from
   * across the room when a callback is driven directly. */
  function besidePerson(ctx, person) {
    if (!person || ctx.actor.transit) return false;
    if (ctx.actor.location !== person.location || person.transit) return false;
    var dx = Math.abs(ctx.actor.pos.x - person.pos.x);
    var dy = Math.abs(ctx.actor.pos.y - person.pos.y);
    return dx + dy === 1;
  }

  ACTIONS.pick_up_wallet = {
    id: 'pick_up_wallet', label: 'Pick up the wallet', targetKind: 'object',
    position: 'use_spot', exclusive: true,
    interruptible: false,
    duration: function () { return 2; },
    eligible: function (ctx) {
      var wallet = ctx.target;
      if (!wallet || wallet.typeId !== TYPE_ID) return { reason: 'not_a_wallet' };
      if (wallet.status !== 'lost') return { reason: 'wallet_' + (wallet.status || 'gone') };
      if (ctx.actor.transit || ctx.actor.location !== wallet.location) return { reason: 'not_present' };
      return true;
    },
    /* No candidateMeta: a finder learns whose wallet it is only by picking it
     * up, not by looking at what lies on the ground. */
    onComplete: function (ctx) {
      var wallet = ctx.target;
      if (!wallet || wallet.typeId !== TYPE_ID) return;
      if (wallet.status !== 'lost') return;                 // once, whichever way
      if (!atUseSpot(ctx, 'pick_up_wallet')) return;        // arriving is not picking it up
      var actor = ctx.actor;
      if (actor.id === wallet.ownerId) {
        /* The owner finds their own wallet: the cash comes straight back. */
        ctx.sim.credit(actor, { money: wallet.cash });
        wallet.status = 'returned';
        wallet.heldBy = null;
        wallet.location = null;
        wallet.x = null; wallet.y = null;
        wallet.affordances = [];
        wallet.heldAffordances = [];
        ctx.emit('WALLET_RECOVERED', { walletId: wallet.id, cash: wallet.cash, ownerId: actor.id },
          actor.name + ' found their own lost wallet.', []);
        return;
      }
      /* Anyone else: the wallet goes with the finder, privately at first. */
      wallet.status = 'carried';
      wallet.heldBy = actor.id;
      wallet.foundBy = actor.id;
      wallet.location = null;
      wallet.x = null; wallet.y = null;
      wallet.affordances = [];
      wallet.heldAffordances = ['return_wallet', 'keep_wallet_money'];
      ctx.sim.emit('WALLET_FOUND', {
        actorId: actor.id, locationId: actor.location, private: true,
        data: { walletId: wallet.id, cash: wallet.cash, ownerId: wallet.ownerId, foundBy: actor.id },
        text: actor.name + ' picked up a lost wallet.'
      });
    }
  };

  ACTIONS.return_wallet = {
    id: 'return_wallet', label: 'Return the wallet', targetKind: 'person',
    position: 'beside_person',
    interruptible: false,
    duration: function () { return 3; },
    candidateMeta: function (ctx) {
      var owner = ctx.target;
      var wallet = owner ? carriedWalletOf(ctx.state, ctx.actor.id, owner.id) : null;
      if (!wallet) return {};
      return { cash: wallet.cash, ownerId: owner.id, ownerName: owner.name };
    },
    eligible: function (ctx) {
      var owner = ctx.target;
      if (!owner || !owner.id || owner.id === ctx.actor.id) return { reason: 'no_owner' };
      if (ctx.actor.transit) return { reason: 'actor_in_transit' };
      if (owner.location !== ctx.actor.location || owner.transit) return { reason: 'owner_not_present' };
      if (!carriedWalletOf(ctx.state, ctx.actor.id, owner.id)) return { reason: 'no_wallet_for_owner' };
      return true;
    },
    onComplete: function (ctx) {
      var owner = ctx.target;
      if (!owner) return;
      var wallet = carriedWalletOf(ctx.state, ctx.actor.id, owner.id);
      if (!wallet || wallet.status !== 'carried' || wallet.heldBy !== ctx.actor.id) return;   // once
      if (!besidePerson(ctx, owner)) return;                 // the settlement lands next to the person
      ctx.sim.credit(owner, { money: wallet.cash });
      wallet.status = 'returned';
      wallet.heldBy = null;
      wallet.location = null;
      wallet.x = null; wallet.y = null;
      wallet.affordances = [];
      wallet.heldAffordances = [];
      /* Both sides of the same act, recorded on both. */
      ctx.sim.adjustRelationship(owner, ctx.actor.id, { trust: 10, closeness: 6 });
      ctx.sim.adjustRelationship(ctx.actor, owner.id, { closeness: 3 });
      ctx.emit('WALLET_RETURNED', {
        walletId: wallet.id, cash: wallet.cash, ownerId: owner.id, byId: ctx.actor.id
      }, ctx.actor.name + ' returned a lost wallet to ' + owner.name + '.', [owner.id]);
    }
  };

  ACTIONS.keep_wallet_money = {
    id: 'keep_wallet_money', label: 'Keep the money', targetKind: null,
    position: 'anywhere',
    interruptible: false,
    duration: function () { return 1; },
    candidateMeta: function (ctx) {
      var wallet = carriedWallet(ctx.state, ctx.actor.id);
      if (!wallet) return {};
      var owner = ctx.state.characters[wallet.ownerId];
      return { cash: wallet.cash, ownerId: wallet.ownerId, ownerName: owner ? owner.name : null };
    },
    eligible: function (ctx) {
      if (!carriedWallet(ctx.state, ctx.actor.id)) return { reason: 'no_carried_wallet' };
      return true;
    },
    onComplete: function (ctx) {
      var wallet = carriedWallet(ctx.state, ctx.actor.id);
      if (!wallet || wallet.status !== 'carried' || wallet.heldBy !== ctx.actor.id) return;   // once
      ctx.sim.credit(ctx.actor, { money: wallet.cash });
      wallet.status = 'kept';
      wallet.heldBy = null;
      wallet.location = null;
      wallet.x = null; wallet.y = null;
      wallet.affordances = [];
      wallet.heldAffordances = [];
      /* Nobody is told, and the owner is never given a way to find out. */
      ctx.sim.emit('WALLET_KEPT', {
        actorId: ctx.actor.id, locationId: ctx.actor.location, private: true,
        data: { walletId: wallet.id, cash: wallet.cash, ownerId: wallet.ownerId, keptBy: ctx.actor.id },
        text: ctx.actor.name + ' kept the money from a lost wallet.'
      });
    }
  };

  LW.ACTIONS = ACTIONS;

  /* Registered through the real catalogue at load, exactly like the model
   * package. A second registration under the same id is refused by the
   * catalogue itself, not swapped in. */
  LW.registerActions = function (catalogue) {
    if (!catalogue || typeof catalogue.define !== 'function') {
      throw new Error('lost-wallet v01: the action catalogue has no define(); nothing can be registered');
    }
    Object.keys(ACTIONS).forEach(function (id) { catalogue.define(ACTIONS[id]); });
    return Object.keys(ACTIONS);
  };
  LW.registerActions(A);

  /* ---------------- the intervention ---------------- */

  I.define({
    type: 'wallet_lost',
    label: 'A wallet is lost',
    paramsSchema: {
      id: 'the wallet instance id, non-empty and unused',
      ownerId: 'character id the wallet belongs to',
      cash: 'EUR in the wallet, more than 0 and no more than the owner has',
      locationId: 'where it is dropped',
      x: 'the floor cell x',
      y: 'the floor cell y',
      useSpot: '{ x, y, dir? } walkable cell to pick it up from'
    },
    /* Deliberately says nothing about where: the loss is private. */
    describe: function () { return 'A wallet was lost.'; },
    validate: function (p, sim) {
      if (!p || typeof p !== 'object') return { error: 'missing_params' };
      if (!isIdString(p.id)) return { error: 'invalid_id' };
      var owner = sim.state.characters[p.ownerId];
      if (!owner) return { error: 'unknown_owner' };
      if (!isFiniteNumber(p.cash) || p.cash <= 0) return { error: 'invalid_cash' };
      if (p.cash > owner.money) return { error: 'cash_exceeds_owner_money' };
      if (sim.objectById(p.id)) return { error: 'id_in_use' };
      var loc = W.LOCATIONS[p.locationId];
      if (!loc) return { error: 'unknown_location' };
      if (!inBounds(loc, p.x, p.y)) return { error: 'object_position_out_of_bounds' };
      if (!isFloor(loc, p.x, p.y)) return { error: 'object_position_not_floor' };
      if (!p.useSpot || typeof p.useSpot !== 'object') return { error: 'missing_use_spot' };
      if (!isInteger(p.useSpot.x) || !isInteger(p.useSpot.y)) return { error: 'invalid_use_spot' };
      if (!inBounds(loc, p.useSpot.x, p.useSpot.y)) return { error: 'use_spot_out_of_bounds' };
      if (!isFloor(loc, p.useSpot.x, p.useSpot.y)) return { error: 'use_spot_not_walkable' };
      /* Outside, the town is one map: a thing left in the park is used from the park. */
      if (loc.grid && W.zoneAt(p.useSpot.x, p.useSpot.y) !== p.locationId) return { error: 'use_spot_elsewhere' };
      if (p.useSpot.dir !== undefined && !isDir(p.useSpot.dir)) return { error: 'invalid_use_spot_dir' };
      if (!reachableFromSpawn(sim, loc, p.useSpot.x, p.useSpot.y)) return { error: 'use_spot_unreachable' };
      return true;
    },
    apply: function (p, sim, record) {
      /* Revalidated here, so a second application of the same id — however it
       * is reached — cannot take the cash out twice. */
      if (sim.objectById(p.id)) return { ok: false, error: 'id_in_use' };
      var owner = sim.state.characters[p.ownerId];
      if (!owner) return { ok: false, error: 'unknown_owner' };
      if (!isFiniteNumber(p.cash) || p.cash <= 0) return { ok: false, error: 'invalid_cash' };
      if (p.cash > owner.money) return { ok: false, error: 'cash_exceeds_owner_money' };
      var wallet = LW.makeWalletObject(p, record);
      sim.state.objects.push(wallet);
      sim.credit(owner, { money: -p.cash });
      sim.touch();
      /* Private, with the owner as subject and nobody notified: the town is not
       * told where it fell, and the owner least of all. The generic applied
       * event is left without a location for the same reason. */
      sim.emit('WALLET_LOST', {
        locationId: p.locationId, subjectId: p.ownerId, private: true,
        data: { walletId: p.id, typeId: TYPE_ID, ownerId: p.ownerId, cash: p.cash, interventionId: record.id },
        text: 'A wallet was lost.'
      });
      return { ok: true, locationId: null, data: { walletId: p.id, typeId: TYPE_ID, ownerId: p.ownerId, cash: p.cash } };
    }
  });

  /* ---------------- what a saved instance must look like ---------------- */

  function validateWallet(o, env) {
    if (!o || o.typeId !== TYPE_ID) return 'is not a wallet';
    if (!isIdString(o.id)) return 'has no usable id';
    if (typeof o.name !== 'string' || o.name.length === 0) return 'has no name';
    var people = env.state.characters;
    if (!people[o.ownerId]) return 'names an owner (' + o.ownerId + ') who is not in the town';
    if (!isFiniteNumber(o.cash) || o.cash <= 0) return 'carries ' + o.cash + ' EUR, which is not a positive amount';
    if (STATUSES.indexOf(o.status) < 0) return 'is in the unknown state "' + o.status + '"';
    if (o.heldBy !== null && o.heldBy !== undefined && !people[o.heldBy]) return 'is held by ' + o.heldBy + ', who is not in the town';
    if (o.foundBy !== null && o.foundBy !== undefined && !people[o.foundBy]) return 'was found by ' + o.foundBy + ', who is not in the town';
    if (o.inUseBy !== null && o.inUseBy !== undefined && !people[o.inUseBy]) return 'is claimed by ' + o.inUseBy + ', who is not in the town';
    if (!isArray(o.affordances)) return 'has no affordances list';
    if (!isArray(o.heldAffordances)) return 'has no held-affordances list';

    if (o.status === 'lost') {
      if (o.heldBy) return 'is lost and held by ' + o.heldBy + ' at the same time';
      var loc = W.LOCATIONS[o.location];
      if (!loc) return 'is lost in "' + o.location + '", which is not a place';
      if (!inBounds(loc, o.x, o.y) || !isFloor(loc, o.x, o.y)) return 'lies at ' + o.x + ',' + o.y + ', which is not floor in ' + o.location;
      var spot = o.anchors && o.anchors.pick_up_wallet;
      if (!spot || !isFloor(loc, spot.x, spot.y)) return 'has no walkable pick-up spot';
      if (!env.reachable(o.location, spot)) return 'has a pick-up spot at ' + spot.x + ',' + spot.y + ' that cannot be walked to';
      if (o.affordances.indexOf('pick_up_wallet') < 0) return 'is lying there but does not offer pick_up_wallet';
      if (o.heldAffordances.length) return 'is lying there but still offers held actions';
    } else {
      if (o.location !== null && o.location !== undefined) return 'is ' + o.status + ' but still recorded in ' + o.location + ', so it is in two places at once';
      if (o.x !== null && o.x !== undefined) return 'is ' + o.status + ' but still has a position';
      if (o.status === 'carried') {
        if (!o.heldBy) return 'is carried by nobody';
        if (o.heldAffordances.indexOf('return_wallet') < 0 || o.heldAffordances.indexOf('keep_wallet_money') < 0) {
          return 'is carried but does not offer returning or keeping the money';
        }
      } else {
        if (o.heldBy) return 'is ' + o.status + ' and still held by ' + o.heldBy;
      }
      if (o.affordances.length) return 'is ' + o.status + ' but still offers ' + o.affordances.join(', ');
      if (o.status !== 'carried' && o.heldAffordances.length) return 'is ' + o.status + ' but still offers held actions';
    }
    return null;
  }

  /* What an instance looks like this minute: only a lost wallet is lying
   * anywhere. A carried, returned or kept wallet is drawn by nothing. */
  function visualWallet(o) {
    return o.status === 'lost' ? { typeId: TYPE_ID, state: 'lost' } : null;
  }

  C.register({
    id: 'lost-wallet', version: VERSION,
    interventionTypes: ['wallet_lost'],
    objectTypes: {
      wallet_lost: { validate: validateWallet, visual: visualWallet }
    }
  });

  /* ---------------- what these are worth to a person ----------------
   *
   * Offered to UtilityPolicy in its own arithmetic, never as rules. Picking a
   * wallet up is idle curiosity; returning it grows with conscientiousness and
   * with how close the finder is to the owner; keeping the money grows with the
   * cash times how urgently the finder needs it, and shrinks with
   * conscientiousness and caution. Different people weigh them differently, and
   * either carried choice can go unchosen. */
  var SCORES = {
    pick_up_wallet: function (req, cand, h) {
      return { curiosity: 2 + 2 * (1 - h.trait('caution')) };
    },
    return_wallet: function (req, cand, h) {
      var ownerId = cand.meta && cand.meta.ownerId;
      var rel = ownerId && req.relationships ? req.relationships[ownerId] : null;
      var closeness = rel && isFiniteNumber(rel.closeness) ? rel.closeness / 100 : 0;
      return {
        doing_right: 20 * h.trait('conscientiousness'),
        closeness: 12 * closeness,
        effort: -cand.durationMinutes * 0.15
      };
    },
    keep_wallet_money: function (req, cand, h) {
      var cash = cand.meta && isFiniteNumber(cand.meta.cash) ? cand.meta.cash : 0;
      return {
        cash_in_hand: cash * 1.8 * h.urgency,
        scruples: -16 * h.trait('conscientiousness'),
        risk: -9 * h.trait('caution')
      };
    }
  };
  LW.SCORES = SCORES;

  function offerScores(policy) {
    if (!policy || typeof policy.defineScore !== 'function') return;
    Object.keys(SCORES).forEach(function (id) { policy.defineScore(id, SCORES[id]); });
  }
  offerScores(LT.UtilityPolicy);
  LW.offerScores = offerScores;
})();
