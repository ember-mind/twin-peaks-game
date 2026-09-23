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
 * INTEGRATED (foundation branch). The catalogue now has LT.Actions.define and
 * this package registers through it at load. Three things changed from the
 * package as delivered, all to fit the core it now runs on:
 *   - both actions declare `position: 'use_spot'`. The core walks the person
 *     there first and runs duration, tick, onStart and onComplete only once
 *     they have arrived; atUseSpot below stays as this package's own check.
 *   - the single copy of a book is claimed by the core (`exclusive: true`,
 *     Sim.claim / Sim.releaseClaim): reserved when reading is chosen, released
 *     when that activity ends for any reason. The package no longer sets or
 *     clears inUseBy itself — one owner for the field.
 *   - reading is done in sittings of at most SITTING_MINUTES. Progress is kept
 *     between sittings; finishing is reaching the book's total, once.
 * It also declares itself to LT.Content (version, per-type save validation and
 * visual state) and offers UtilityPolicy a score for each action.
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
  var W = LT.World, A = LT.Actions, I = LT.Interventions;
  var E = LT.EverydayV01 = LT.EverydayV01 || {};

  E.VERSION = 'v01';

  /* Typed, bounded parameters. Everything a caller may spend or accumulate in
   * this package is capped here, and the caps are rejected outside, never
   * silently clamped. */
  var SITTING_MINUTES = 45;   // how long anybody reads at a stretch
  E.SITTING_MINUTES = SITTING_MINUTES;

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
    /* Outside, the town is one map: a thing left in the park is used from the park. */
    if (loc.grid && W.zoneAt(p.useSpot.x, p.useSpot.y) !== p.locationId) return 'use_spot_elsewhere';
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
    position: 'use_spot', exclusive: true,
    interruptible: true, yieldsToConversation: true,
    duration: function (ctx) {
      /* One sitting: what remains for THIS reader, up to SITTING_MINUTES. The
       * last sitting is exactly what is left, so finishing the book is
       * reaching its total and not a fixed slot repeated. */
      return Math.max(1, Math.min(SITTING_MINUTES, remainingRead(ctx)));
    },
    candidateMeta: function (ctx) {
      return { typeId: ctx.target.typeId, remainingMinutes: remainingRead(ctx), totalMinutes: ctx.target.requiredReadMinutes };
    },
    eligible: function (ctx) {
      var book = ctx.target;
      if (!book || book.typeId !== OBJECT_TYPES.book_used.typeId) return { reason: 'not_a_book' };
      if (!isPositiveInteger(book.requiredReadMinutes)) return { reason: 'book_unreadable' };
      if (ctx.actor.transit || ctx.actor.location !== book.location) return { reason: 'not_present' };
      if (readMinutes(book, ctx.actor.id) >= book.requiredReadMinutes) return { reason: 'already_read' };
      if (book.completedBy && book.completedBy[ctx.actor.id]) return { reason: 'already_read' };
      return true;
    },
    tick: function (ctx, minutes) {
      var book = ctx.target;
      if (!book || book.typeId !== OBJECT_TYPES.book_used.typeId) return;
      if (!atUseSpot(ctx, 'read_book')) return;
      var done = readMinutes(book, ctx.actor.id);
      book.readBy[ctx.actor.id] = Math.min(book.requiredReadMinutes, done + minutes);
    },
    /* Nothing to undo on interruption: readBy keeps the minutes actually read,
     * and the claim on the copy is the core's to release. */
    onComplete: function (ctx) {
      var book = ctx.target;
      if (!book || book.typeId !== OBJECT_TYPES.book_used.typeId) return;
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
    position: 'use_spot',
    interruptible: false,
    candidateMeta: function (ctx) { return { typeId: ctx.target.typeId, portions: ctx.target.contentsLeft }; },
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
                requiredReadMinutes: p.requiredReadMinutes, interventionId: record.id },
        text: 'A copy of "' + p.title + '" was left in ' + sim.locationName(p.locationId) + '.'
      });
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
                interventionId: record.id },
        text: 'A food parcel was left at ' + sim.locationName(p.locationId) + '.'
      });
      return { ok: true, locationId: p.locationId, data: { parcelId: id, typeId: parcel.typeId } };
    }
  });

  /* ---------------- what a saved instance must look like ----------------
   * Checked when a save is loaded. The state of an instance is free to be
   * anything the mechanics above can produce; it is refused when it is
   * something they cannot. `env` gives the saved state and the town's own
   * reachability test. */
  function checkCommon(o, env, useId) {
    if (!isIdString(o.id)) return 'has no usable id';
    var loc = W.LOCATIONS[o.location];
    if (!loc) return 'is in "' + o.location + '", which is not a place';
    if (!inBounds(loc, o.x, o.y) || isWall(loc, o.x, o.y)) return 'rests at ' + o.x + ',' + o.y + ', which is not inside ' + o.location;
    var spot = o.anchors && o.anchors[useId];
    if (!spot || !isFloor(loc, spot.x, spot.y)) return 'has no walkable use spot';
    if (!env.reachable(o.location, spot)) return 'has a use spot at ' + spot.x + ',' + spot.y + ' that cannot be walked to';
    return null;
  }

  function validateBook(o, env) {
    var bad = checkCommon(o, env, 'read_book');
    if (bad) return bad;
    if (!isPositiveInteger(o.requiredReadMinutes) || o.requiredReadMinutes > LIMITS.maxRequiredReadMinutes) return 'needs an impossible amount of reading (' + o.requiredReadMinutes + ')';
    var people = env.state.characters, id;
    for (id in (o.readBy || {})) {
      if (!people[id]) return 'has reading progress for ' + id + ', who does not exist';
      if (!isFiniteNumber(o.readBy[id]) || o.readBy[id] < 0 || o.readBy[id] > o.requiredReadMinutes) return 'has ' + o.readBy[id] + ' minutes read by ' + id + ', outside 0..' + o.requiredReadMinutes;
    }
    for (id in (o.completedBy || {})) {
      if (!people[id]) return 'was finished by ' + id + ', who does not exist';
      if (readMinutes(o, id) < o.requiredReadMinutes) return 'is marked finished by ' + id + ' after only ' + readMinutes(o, id) + ' of ' + o.requiredReadMinutes + ' minutes';
    }
    var readers = Object.keys(people).filter(function (pid) {
      var act = people[pid].activity;
      return act && act.actionId === 'read_book' && act.targetId === o.id;
    });
    if (readers.length > 1) return 'is being read by ' + readers.join(' and ') + ' at once';
    if (o.inUseBy && readers[0] !== o.inUseBy) return 'is held by ' + o.inUseBy + ', who is not reading it';
    if (!o.inUseBy && readers.length) return 'is being read by ' + readers[0] + ' without being held';
    return null;
  }

  function validateParcel(o, env) {
    var bad = checkCommon(o, env, 'unpack_food_parcel');
    if (bad) return bad;
    var to = env.state.characters[o.toId];
    if (!to) return 'is addressed to ' + o.toId + ', who does not exist';
    if (o.location !== to.homeId) return 'is not at the home of the person it is addressed to';
    if (!isPositiveInteger(o.portions) || o.portions > LIMITS.maxPortions) return 'holds an impossible number of portions (' + o.portions + ')';
    if (!isInteger(o.contentsLeft) || o.contentsLeft < 0 || o.contentsLeft > o.portions) return 'has ' + o.contentsLeft + ' portions left of ' + o.portions;
    if (o.status === 'sealed') {
      if (o.contentsLeft !== o.portions || o.openedBy) return 'is sealed but not full';
    } else if (o.status === 'empty') {
      if (o.contentsLeft !== 0) return 'is empty but still holds ' + o.contentsLeft + ' portions';
      if (!env.state.characters[o.openedBy]) return 'is empty but was opened by nobody';
    } else return 'is in the unknown state "' + o.status + '"';
    return null;
  }

  /* What an instance looks like this minute. Read from the instance and from
   * who is using it; never stored, and drawing it changes nothing. */
  function usingNow(sim, o, actionId) {
    var people = sim.state.characters;
    return Object.keys(people).some(function (id) {
      var act = people[id].activity;
      return act && act.actionId === actionId && act.targetId === o.id && act.phase === 'executing';
    });
  }

  LT.Content.register({
    id: 'everyday-opportunities', version: E.VERSION,
    interventionTypes: ['place_shared_book', 'deliver_food_parcel'],
    objectTypes: {
      book_used: {
        validate: validateBook,
        visual: function (o, sim) { return { typeId: 'book_used', state: usingNow(sim, o, 'read_book') ? 'open' : 'closed' }; }
      },
      food_parcel: {
        validate: validateParcel,
        visual: function (o, sim) {
          return { typeId: 'food_parcel', state: o.status === 'empty' ? 'empty' : (usingNow(sim, o, 'unpack_food_parcel') ? 'open' : 'sealed') };
        }
      }
    }
  });

  /* What these are worth to a person, offered to UtilityPolicy in its own
   * arithmetic. Neither is a rule: a book is a modest pleasure that loses to a
   * pressing goal, a promise about to be broken, hunger or a bed; a parcel
   * matters more the emptier the cupboard is. Different people weigh them
   * differently, and either can go unchosen all day. */
  function offerScores(policy) {
    if (!policy || typeof policy.defineScore !== 'function') return;
    policy.defineScore('read_book', function (req, cand, h) {
      var terms = {};
      terms.interest = 4 + 7 * (1 - h.trait('ambition')) + 2 * (1 - h.trait('sociability'));
      if (cand.meta && cand.meta.totalMinutes && cand.meta.remainingMinutes < cand.meta.totalMinutes) terms.already_begun = 2;
      terms.sitting_down = Math.pow((100 - h.energy) / 100, 2) * 18;
      terms.goal_pressure = -3 * h.urgency;
      terms.time_cost = -cand.durationMinutes * 0.05;
      var broken = h.conflictPenalty();
      if (broken) terms.commitment_conflict = -broken;
      return terms;
    });
    policy.defineScore('unpack_food_parcel', function (req, cand, h) {
      var pantry = req.self.pantry || 0;
      return {
        cupboard: pantry <= 0 ? 22 : pantry <= 1 ? 15 : pantry <= 3 ? 8 : 3,
        tidiness: 6 * h.trait('conscientiousness'),
        hunger_ahead: Math.pow(h.hunger / 100, 2) * 20
      };
    });
  }
  offerScores(LT.UtilityPolicy);
  E.offerScores = offerScores;

  E.registerActions(A);
})();
