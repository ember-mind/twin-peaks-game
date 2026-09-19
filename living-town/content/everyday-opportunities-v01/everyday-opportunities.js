/* everyday-opportunities.js — Living Town: content package v01.
 *
 * A shared book a person can read, and a food parcel delivered to a home and
 * opened into the pantry. Two typed interventions introduce them. Nothing here
 * asks a policy anything, and nothing here makes a person act: the audience
 * introduces a possibility, the inhabitant's own decision decides whether to
 * use it.
 *
 * This package owns only its own content. It adds no clock, no scheduler, no
 * inventory and no reservation manager. It reads and writes sim.state, and it
 * emits events through sim.emit.
 *
 * WHAT THIS FILE CANNOT DO YET — read before wiring:
 *   LT.Actions (living-town/js/lt-actions.js) exposes get/ids/all but no entry
 *   point to add an action to the catalogue. The two actions below are
 *   therefore exported as definitions and exercised through real Sim contexts,
 *   but the simulation cannot yet offer them as candidates. Fable must add an
 *   action registration hook (see registerActions below and README.md); until
 *   then the full pipeline (a policy choosing read_book / unpack_food_parcel)
 *   is not connected. The interventions DO register and run through the real
 *   LT.Interventions.define / schedule / applyDue API.
 *
 * The approach/execution separation is Fable's work in progress. This package
 * grants consequences only while the actor is at the object's declared use
 * spot with no walk target pending (atUseSpot). It never pays for approach.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function') {
    if (!LT.Util) require('../../js/lt-util.js');
    if (!LT.World) require('../../js/lt-world.js');
    if (!LT.Actions) require('../../js/lt-actions.js');
    if (!LT.Interventions) require('../../js/lt-interventions.js');
    if (!LT.Sim) require('../../js/lt-sim.js');
  }
  var W = LT.World, A = LT.Actions, I = LT.Interventions;
  var E = LT.EverydayV01 = LT.EverydayV01 || {};

  E.VERSION = 'v01';

  /* Typed, bounded parameters. Everything a caller may spend or accumulate in
   * this package is capped here, and the caps are rejected outside, never
   * silently clamped. */
  var LIMITS = {
    maxRequiredReadMinutes: 600,
    maxPortions: 24,
    maxTitleLength: 200,
    maxInstanceIdLength: 64
  };
  E.LIMITS = LIMITS;

  var OBJECT_TYPES = {
    book_used: {
      typeId: 'book_used', kind: 'book', name: 'book',
      tags: ['book', 'readable'], affordances: ['read_book']
    },
    food_parcel: {
      typeId: 'food_parcel', kind: 'parcel', name: 'food parcel',
      tags: ['food', 'parcel'], affordances: ['unpack_food_parcel']
    }
  };
  E.OBJECT_TYPES = OBJECT_TYPES;

  /* ---------------- small typed checks ---------------- */

  function isFiniteNumber(v) { return typeof v === 'number' && isFinite(v); }
  function isInteger(v) { return isFiniteNumber(v) && Math.floor(v) === v; }
  function isPositiveInteger(v) { return isInteger(v) && v > 0; }
  function isIdString(v) {
    return typeof v === 'string' && v.length > 0 && v.length <= LIMITS.maxInstanceIdLength;
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

  function uniqueInstanceId(sim, prefix) {
    var n = 1;
    while (sim.objectById(prefix + n)) n++;
    return prefix + n;
  }

  /* A declared instance id is optional; if present it must be well formed and
   * unused. At apply time this runs again, so two interventions naming the same
   * instance cannot both create it. */
  function checkInstanceId(sim, p) {
    if (p.instanceId === undefined || p.instanceId === null) return null;
    if (!isIdString(p.instanceId)) return 'invalid_instance_id';
    if (sim.objectById(p.instanceId)) return 'instance_id_in_use';
    return null;
  }

  /* Object position and use spot. The object itself adds no collision, so a
   * book may rest on a table; the use spot is where someone stands and must be
   * a walkable cell reachable from the room's spawn. */
  function checkPlacement(sim, p) {
    var loc = W.LOCATIONS[p.locationId];
    if (!loc) return 'unknown_location';
    if (!inBounds(loc, p.x, p.y)) return 'object_position_out_of_bounds';
    if (isWall(loc, p.x, p.y)) return 'object_position_on_wall';
    if (!p.useSpot || typeof p.useSpot !== 'object') return 'missing_use_spot';
    if (!isInteger(p.useSpot.x) || !isInteger(p.useSpot.y)) return 'invalid_use_spot';
    if (!inBounds(loc, p.useSpot.x, p.useSpot.y)) return 'use_spot_out_of_bounds';
    if (!isFloor(loc, p.useSpot.x, p.useSpot.y)) return 'use_spot_not_walkable';
    if (p.useSpot.dir !== undefined && !isDir(p.useSpot.dir)) return 'invalid_use_spot_dir';
    if (!reachableFromSpawn(sim, loc, p.useSpot.x, p.useSpot.y)) return 'use_spot_unreachable';
    return null;
  }

  /* ---------------- object builders (pure state, JSON-safe) ---------------- */

  E.makeBookObject = function (p, instanceId, record) {
    return {
      id: instanceId,
      typeId: OBJECT_TYPES.book_used.typeId,
      kind: OBJECT_TYPES.book_used.kind,
      name: p.title,
      title: p.title,
      location: p.locationId,
      x: p.x, y: p.y,
      anchors: { read_book: { x: p.useSpot.x, y: p.useSpot.y, dir: p.useSpot.dir || 'down' } },
      tags: OBJECT_TYPES.book_used.tags.slice(),
      portable: false,
      affordances: OBJECT_TYPES.book_used.affordances.slice(),
      /* Finite reading needed, and per-person progress. The book object is the
       * single authority: progress is never kept in a closure. */
      requiredReadMinutes: p.requiredReadMinutes,
      readBy: {},
      completedBy: {},
      /* A single physical copy is used by one person at a time. This is the
       * minimal availability contract; see README.md. */
      inUseBy: null,
      interventionId: record ? record.id : null
    };
  };

  E.makeFoodParcelObject = function (p, instanceId, record) {
    return {
      id: instanceId,
      typeId: OBJECT_TYPES.food_parcel.typeId,
      kind: OBJECT_TYPES.food_parcel.kind,
      name: OBJECT_TYPES.food_parcel.name,
      location: p.locationId,
      x: p.x, y: p.y,
      anchors: { unpack_food_parcel: { x: p.useSpot.x, y: p.useSpot.y, dir: p.useSpot.dir || 'down' } },
      tags: OBJECT_TYPES.food_parcel.tags.slice(),
      portable: false,
      affordances: OBJECT_TYPES.food_parcel.affordances.slice(),
      toId: p.toId,
      portions: p.portions,
      contentsLeft: p.portions,
      status: 'sealed',
      openedBy: null,
      openedStamp: null,
      interventionId: record ? record.id : null
    };
  };

  /* ---------------- the actions ----------------
   *
   * Contract taken from lt-actions.js: id, label, targetKind, duration(ctx),
   * eligible(ctx), tick(ctx, minutes), onComplete(ctx), onInterrupt(ctx),
   * interruptible, yieldsToConversation. These are definitions; they become
   * candidates only once the catalogue can accept them (see registerActions).
   */

  function readMinutes(book, actorId) {
    var v = book && book.readBy ? book.readBy[actorId] : 0;
    return isFiniteNumber(v) && v > 0 ? v : 0;
  }

  function remainingRead(ctx) {
    var book = ctx.target;
    var req = isPositiveInteger(book.requiredReadMinutes) ? book.requiredReadMinutes : 1;
    return Math.max(0, req - readMinutes(book, ctx.actor.id));
  }

  /* True only where the consequence may land: in the right room, no longer
   * walking, and standing on the object's declared use spot. This is the
   * boundary against "paid for merely approaching". */
  function atUseSpot(ctx, actionId) {
    var target = ctx.target;
    if (!target || ctx.actor.transit || ctx.actor.location !== target.location) return false;
    if (ctx.actor.walkTarget) return false;
    var def = ACTIONS[actionId];
    var spot = ctx.sim.anchorFor(ctx.actor, def, target);
    if (!spot) return false;
    return ctx.actor.pos.x === spot.x && ctx.actor.pos.y === spot.y;
  }

  var ACTIONS = {};

  ACTIONS.read_book = {
    id: 'read_book', label: 'Read', targetKind: 'object',
    interruptible: true, yieldsToConversation: true,
    duration: function (ctx) {
      /* The block that remains for THIS reader, so finishing the book is
       * exactly reaching its target, not a fixed slot repeated. */
      return Math.max(1, remainingRead(ctx));
    },
    eligible: function (ctx) {
      var book = ctx.target;
      if (!book || book.typeId !== OBJECT_TYPES.book_used.typeId) return { reason: 'not_a_book' };
      if (!isPositiveInteger(book.requiredReadMinutes)) return { reason: 'book_unreadable' };
      if (ctx.actor.transit || ctx.actor.location !== book.location) return { reason: 'not_present' };
      if (readMinutes(book, ctx.actor.id) >= book.requiredReadMinutes) return { reason: 'already_read' };
      if (book.completedBy && book.completedBy[ctx.actor.id]) return { reason: 'already_read' };
      if (book.inUseBy && book.inUseBy !== ctx.actor.id) return { reason: 'book_in_use' };
      return true;
    },
    /* Claim the single physical copy while it is being used. Released on
     * completion and on interruption; nothing else may hold it. */
    onStart: function (ctx) {
      if (ctx.target && ctx.target.typeId === OBJECT_TYPES.book_used.typeId) {
        ctx.target.inUseBy = ctx.actor.id;
      }
    },
    tick: function (ctx, minutes) {
      var book = ctx.target;
      if (!book || book.typeId !== OBJECT_TYPES.book_used.typeId) return;
      if (!atUseSpot(ctx, 'read_book')) return;
      var done = readMinutes(book, ctx.actor.id);
      book.readBy[ctx.actor.id] = Math.min(book.requiredReadMinutes, done + minutes);
    },
    onInterrupt: function (ctx) {
      var book = ctx.target;
      if (book && book.inUseBy === ctx.actor.id) book.inUseBy = null;
      /* readBy keeps the minutes actually read. */
    },
    onComplete: function (ctx) {
      var book = ctx.target;
      if (!book || book.typeId !== OBJECT_TYPES.book_used.typeId) return;
      if (book.inUseBy === ctx.actor.id) book.inUseBy = null;
      if (book.completedBy && book.completedBy[ctx.actor.id]) return;   // once per person
      if (!atUseSpot(ctx, 'read_book')) return;                          // consequence only in valid execution
      var done = readMinutes(book, ctx.actor.id);
      if (done < book.requiredReadMinutes) return;                       // approach cannot stand in for reading
      book.completedBy[ctx.actor.id] = ctx.sim.stamp();
      ctx.emit('BOOK_READ', {
        bookId: book.id, typeId: book.typeId, title: book.title,
        minutes: done, targetMinutes: book.requiredReadMinutes
      }, ctx.actor.name + ' finished reading "' + book.title + '".');
    }
  };

  ACTIONS.unpack_food_parcel = {
    id: 'unpack_food_parcel', label: 'Open the food parcel', targetKind: 'object',
    interruptible: false,
    duration: function () { return 5; },
    eligible: function (ctx) {
      var parcel = ctx.target;
      if (!parcel || parcel.typeId !== OBJECT_TYPES.food_parcel.typeId) return { reason: 'not_a_food_parcel' };
      if (ctx.actor.transit || ctx.actor.location !== parcel.location) return { reason: 'not_present' };
      if (parcel.toId && ctx.actor.id !== parcel.toId) return { reason: 'not_recipient' };
      if (parcel.status !== 'sealed') return { reason: 'parcel_' + (parcel.status || 'opened') };
      if (!isPositiveInteger(parcel.contentsLeft)) return { reason: 'parcel_empty' };
      return true;
    },
    onComplete: function (ctx) {
      var parcel = ctx.target;
      if (!parcel || parcel.typeId !== OBJECT_TYPES.food_parcel.typeId) return;
      if (parcel.status !== 'sealed') return;              // transfer happens once
      if (!atUseSpot(ctx, 'unpack_food_parcel')) return;   // just arriving transfers nothing
      var left = isPositiveInteger(parcel.contentsLeft) ? parcel.contentsLeft : 0;
      var allowed = isPositiveInteger(parcel.portions) ? parcel.portions : left;
      var moved = Math.min(left, allowed);
      if (moved > 0) ctx.actor.pantry = (ctx.actor.pantry || 0) + moved;
      parcel.contentsLeft = 0;
      parcel.status = 'empty';
      parcel.openedBy = ctx.actor.id;
      parcel.openedStamp = ctx.sim.stamp();
      /* No hunger change here: eat_at_home remains the only way the food is
       * eaten, and no money or relationship moves. */
      ctx.emit('FOOD_PARCEL_OPENED', {
        parcelId: parcel.id, typeId: parcel.typeId, portions: moved, pantry: ctx.actor.pantry
      }, ctx.actor.name + ' opened the food parcel (' + moved + ' portion' + (moved === 1 ? '' : 's') + ' into the pantry).');
    }
  };

  E.ACTIONS = ACTIONS;

  /* The catalogue entry point this package needs and this base commit does not
   * have. When Fable adds one, calling this wires both actions; until then it
   * fails loudly with the exact missing piece, never silently. */
  E.registerActions = function (catalogue) {
    if (!catalogue || typeof catalogue.define !== 'function') {
      throw new Error('everyday-opportunities v01: LT.Actions has no action registration entry point ' +
        '(it exposes get/ids/all only), so read_book and unpack_food_parcel cannot be added to the ' +
        'catalogue from a content package. Fable must add one (an A.define(def) alongside A.get), then ' +
        'call LT.EverydayV01.registerActions(LT.Actions).');
    }
    Object.keys(ACTIONS).forEach(function (id) { catalogue.define(ACTIONS[id]); });
    return Object.keys(ACTIONS);
  };

  /* ---------------- the interventions ----------------
   * Registered through the real LT.Interventions.define. Validation runs at
   * scheduling time and again at application time, so a malformed proposal
   * never becomes a half-applied fact and a duplicate instance is refused when
   * it would actually be created.
   */

  I.define({
    type: 'place_shared_book',
    label: 'A shared book is placed',
    paramsSchema: {
      instanceId: 'optional unique id for this copy; generated when omitted',
      title: 'the book title, non-empty',
      locationId: 'where the copy rests',
      x: 'object cell x',
      y: 'object cell y',
      useSpot: '{ x, y, dir? } walkable cell where reading happens',
      requiredReadMinutes: 'finite reading needed to finish, 1..' + LIMITS.maxRequiredReadMinutes
    },
    describe: function (p, sim) {
      return 'A copy of "' + p.title + '" was placed in ' + sim.locationName(p.locationId) + '.';
    },
    validate: function (p, sim) {
      if (!p || typeof p !== 'object') return { error: 'missing_params' };
      if (typeof p.title !== 'string' || p.title.trim().length === 0) return { error: 'missing_title' };
      if (p.title.length > LIMITS.maxTitleLength) return { error: 'title_too_long' };
      if (!isPositiveInteger(p.requiredReadMinutes)) return { error: 'invalid_required_read_minutes' };
      if (p.requiredReadMinutes > LIMITS.maxRequiredReadMinutes) return { error: 'required_read_minutes_too_large' };
      var idError = checkInstanceId(sim, p);
      if (idError) return { error: idError };
      var placeError = checkPlacement(sim, p);
      if (placeError) return { error: placeError };
      return true;
    },
    apply: function (p, sim, record) {
      if (p.instanceId !== undefined && p.instanceId !== null && sim.objectById(p.instanceId)) {
        return { ok: false, error: 'instance_id_in_use' };
      }
      var id = (p.instanceId === undefined || p.instanceId === null)
        ? uniqueInstanceId(sim, 'book_') : p.instanceId;
      var book = E.makeBookObject(p, id, record);
      sim.state.objects.push(book);
      sim.touch();
      sim.emit('BOOK_PLACED', {
        locationId: p.locationId,
        data: { bookId: id, typeId: book.typeId, title: p.title,
                requiredReadMinutes: p.requiredReadMinutes, interventionId: record.id }
      }, 'A copy of "' + p.title + '" was placed in ' + sim.locationName(p.locationId) + '.');
      return { ok: true, locationId: p.locationId, data: { bookId: id, typeId: book.typeId } };
    }
  });

  I.define({
    type: 'deliver_food_parcel',
    label: 'A food parcel is delivered',
    paramsSchema: {
      instanceId: 'optional unique id for this parcel; generated when omitted',
      toId: 'character id the parcel is for',
      locationId: 'the recipient home where it is left',
      x: 'object cell x',
      y: 'object cell y',
      useSpot: '{ x, y, dir? } walkable cell where it is opened',
      portions: 'finite portions, 1..' + LIMITS.maxPortions
    },
    describe: function (p, sim) {
      var c = sim.state.characters[p.toId];
      return 'A food parcel was left for ' + (c ? c.name : p.toId) + ' at ' + sim.locationName(p.locationId) + '.';
    },
    validate: function (p, sim) {
      if (!p || typeof p !== 'object') return { error: 'missing_params' };
      if (typeof p.toId !== 'string' || !sim.state.characters[p.toId]) return { error: 'unknown_character' };
      if (p.locationId !== sim.state.characters[p.toId].homeId) return { error: 'not_recipient_home' };
      if (!isPositiveInteger(p.portions)) return { error: 'invalid_portions' };
      if (p.portions > LIMITS.maxPortions) return { error: 'portions_too_large' };
      var idError = checkInstanceId(sim, p);
      if (idError) return { error: idError };
      var placeError = checkPlacement(sim, p);
      if (placeError) return { error: placeError };
      return true;
    },
    apply: function (p, sim, record) {
      if (p.instanceId !== undefined && p.instanceId !== null && sim.objectById(p.instanceId)) {
        return { ok: false, error: 'instance_id_in_use' };
      }
      var id = (p.instanceId === undefined || p.instanceId === null)
        ? uniqueInstanceId(sim, 'parcel_') : p.instanceId;
      var parcel = E.makeFoodParcelObject(p, id, record);
      sim.state.objects.push(parcel);
      sim.touch();
      /* No notify: the addressee learns of the parcel only by being where it
       * is, exactly as any other circumstance is perceived. */
      sim.emit('FOOD_PARCEL_DELIVERED', {
        locationId: p.locationId,
        data: { parcelId: id, typeId: parcel.typeId, toId: p.toId, portions: p.portions,
                interventionId: record.id }
      }, 'A food parcel was left at ' + sim.locationName(p.locationId) + '.');
      return { ok: true, locationId: p.locationId, data: { parcelId: id, typeId: parcel.typeId } };
    }
  });

  /* If the catalogue ever gains the entry point, join it automatically; the
   * check is defensive, never an invented call. At this commit LT.Actions has
   * no define, so this is a no-op and the README explains the one line Fable
   * must add instead. */
  if (A && typeof A.define === 'function') E.registerActions(A);
})();
