/* shared-meal.js — Living Town: content package `shared-meal-v01`.
 *
 * One person invites another to eat together at the café, at one of the two
 * sittings the town keeps (lunch 13:00, dinner 19:30). The invitation is an
 * object the invitee carries; whether to accept or decline is put to the
 * invitee's own policy, never decided here. If it is accepted, both people come
 * away with an ordinary `social` commitment, and the core — which already knows
 * how to keep a meeting (they talk there inside the window) and how to break one
 * (the hour passes) — is left to judge it. This package never calls
 * keepCommitment or breakCommitment and never reimplements them.
 *
 * All state lives on the object in sim.state.objects; nothing in a closure. The
 * three actions are registered through the real LT.Actions.define, the object
 * type through LT.Content.register. There is no intervention: a meal begins as
 * one person's question to another, not as a scheduled circumstance.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function') {
    if (!LT.Util) require('../../js/lt-util.js');
    if (!LT.World) require('../../js/lt-world.js');
    if (!LT.Actions) require('../../js/lt-actions.js');
    if (!LT.Content) require('../../js/lt-content.js');
  }
  var W = LT.World, A = LT.Actions, C = LT.Content, U = LT.Util;
  var SM = LT.SharedMeal = LT.SharedMeal || {};

  var VERSION = 'v01';
  var TYPE_ID = 'meal_invitation';
  var STATUSES = ['open', 'accepted', 'declined'];
  var MAX_ID_LENGTH = 64;

  var CAFE_ID = 'cafe';
  /* The two fixed sittings, as minutes of the day. */
  var SITTINGS = [{ min: 780, label: 'lunch' }, { min: 1170, label: 'dinner' }];
  var LEAD_MIN = 60;      // an invitation is not asked less than an hour ahead
  var LEAD_MAX = 360;     // nor more than six hours ahead
  var ANSWER_LEAD = 45;   // it stops being answerable this long before the sitting
  var GRACE_MIN = 30;     // how late the core lets a meeting be kept

  SM.VERSION = VERSION;
  SM.TYPE_ID = TYPE_ID;
  SM.STATUSES = STATUSES.slice();
  SM.SITTINGS = SITTINGS.slice();
  SM.CAFE_ID = CAFE_ID;
  SM.GRACE_MIN = GRACE_MIN;

  /* ---------------- small typed checks ---------------- */

  function isFiniteNumber(v) { return typeof v === 'number' && isFinite(v); }
  function isInteger(v) { return isFiniteNumber(v) && Math.floor(v) === v; }
  function isArray(v) { return Object.prototype.toString.call(v) === '[object Array]'; }
  function isIdString(v) {
    return typeof v === 'string' && v.length > 0 && v.length <= MAX_ID_LENGTH;
  }

  /* The next sitting this minute could be asked about, or null: the first of
   * the two that is at least an hour and at most six hours away. */
  function sittingFor(minute) {
    for (var i = 0; i < SITTINGS.length; i++) {
      var ahead = SITTINGS[i].min - minute;
      if (ahead >= LEAD_MIN && ahead <= LEAD_MAX) return SITTINGS[i];
    }
    return null;
  }
  function sittingByMin(min) {
    for (var i = 0; i < SITTINGS.length; i++) if (SITTINGS[i].min === min) return SITTINGS[i];
    return null;
  }
  function cafeOpenAt(minute) {
    var loc = W.LOCATIONS[CAFE_ID];
    return !!loc && minute >= loc.opens && minute < loc.closes;
  }

  /* Neither person is already meeting the other: an open social commitment
   * between them, in either direction. */
  function hasOpenSocialWith(state, aId, bId) {
    var a = state.characters[aId], b = state.characters[bId];
    function withOpenSocial(person, otherId) {
      return !!person && (person.commitments || []).some(function (c) {
        return c.status === 'open' && c.kind === 'social' && c.withId === otherId;
      });
    }
    return withOpenSocial(a, bId) || withOpenSocial(b, aId);
  }

  /* Nobody answered and the time to answer has gone: the invitation stays
   * `open` on record (nothing ticks it shut), but it is a question nobody can
   * be asked any more. Found at integration: without this, one unanswered
   * invitation kept two people from ever inviting each other again, and an
   * expired lunch invitation hid a live dinner one from the person holding both. */
  function lapsed(state, o) { return o.status === 'open' && U.absolute(state.day, state.minute) > o.expiresAbs; }
  SM.lapsed = lapsed;

  /* A meal invitation between the two that can still be answered, in either direction. */
  function openInvitationBetween(state, aId, bId) {
    return state.objects.some(function (o) {
      if (o.typeId !== TYPE_ID || o.status !== 'open' || lapsed(state, o)) return false;
      return (o.fromId === aId && o.toId === bId) || (o.fromId === bId && o.toId === aId);
    });
  }

  function invitationsIssuedToday(state, actorId) {
    var prefix = 'meal_' + state.day + '_' + actorId + '_';
    return state.objects.filter(function (o) {
      return o.typeId === TYPE_ID && o.id.indexOf(prefix) === 0;
    }).length;
  }

  /* The open invitation the actor is carrying, if any. If several are held at
   * once, the one due soonest (ties by id) is the one a single question can be
   * about: accept_meal and decline_meal name no target. */
  function openInvitationHeldBy(state, actorId) {
    var held = state.objects.filter(function (o) {
      return o.typeId === TYPE_ID && o.status === 'open' && o.heldBy === actorId;
    });
    held.sort(function (a, b) {
      var la = lapsed(state, a), lb = lapsed(state, b);
      if (la !== lb) return la ? 1 : -1;               // one that can still be answered comes before one that cannot
      var da = U.absolute(a.dueDay, a.dueMin), db = U.absolute(b.dueDay, b.dueMin);
      if (da !== db) return da - db;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
    return held.length ? held[0] : null;
  }
  function dueAbsOf(invitation) { return U.absolute(invitation.dueDay, invitation.dueMin); }

  /* ---------------- object builder (pure state, JSON-safe) ---------------- */

  function makeInvitation(p, day) {
    var dueAbs = U.absolute(day, p.sitting.min);
    return {
      id: 'meal_' + day + '_' + p.fromId + '_' + p.toId + '_' + p.sitting.min,
      typeId: TYPE_ID,
      name: 'an invitation to ' + p.sitting.label + ' at the café',
      fromId: p.fromId,
      toId: p.toId,
      locationId: CAFE_ID,
      dueDay: day,
      dueMin: p.sitting.min,
      expiresAbs: dueAbs - ANSWER_LEAD,
      status: 'open',
      answeredAbs: null,
      /* It never lies anywhere: it is carried by the invitee while it is open. */
      location: null, x: null, y: null,
      heldBy: p.toId,
      affordances: [],
      heldAffordances: ['accept_meal', 'decline_meal']
    };
  }
  SM.makeInvitation = makeInvitation;

  /* ---------------- the actions ---------------- */

  var ACTIONS = {};

  /* The core walks a beside_person action to a free cell next to the target;
   * this is the package's own guard so a callback driven directly does not land
   * the question from across the room. */
  function besidePerson(ctx, person) {
    if (!person || ctx.actor.transit) return false;
    if (ctx.actor.location !== person.location || person.transit) return false;
    var dx = Math.abs(ctx.actor.pos.x - person.pos.x);
    var dy = Math.abs(ctx.actor.pos.y - person.pos.y);
    return dx + dy === 1;
  }

  ACTIONS.invite_to_meal = {
    id: 'invite_to_meal', label: 'Invite to a meal', targetKind: 'person', position: 'beside_person',
    offeredToPresent: true, interruptible: false,
    duration: function () { return 2; },
    candidateMeta: function (ctx) {
      var s = sittingFor(ctx.state.minute);
      if (!s) return {};
      return { locationId: CAFE_ID, dueDay: ctx.state.day, dueMin: s.min };
    },
    eligible: function (ctx) {
      var other = ctx.target;
      if (!other || !other.id || other.id === ctx.actor.id) return { reason: 'no_one_to_invite' };
      if (ctx.actor.transit) return { reason: 'actor_in_transit' };
      if (other.transit || other.location !== ctx.actor.location) return { reason: 'not_present' };
      var s = sittingFor(ctx.state.minute);
      if (!s) return { reason: 'no_sitting_to_ask_about' };
      if (!cafeOpenAt(s.min)) return { reason: 'cafe_closed' };
      if (hasOpenSocialWith(ctx.state, ctx.actor.id, other.id)) return { reason: 'already_meeting_them' };
      if (openInvitationBetween(ctx.state, ctx.actor.id, other.id)) return { reason: 'invitation_already_open' };
      if (invitationsIssuedToday(ctx.state, ctx.actor.id) > 0) return { reason: 'already_invited_someone_today' };
      return true;
    },
    onComplete: function (ctx) {
      var other = ctx.target;
      if (!other) return;
      if (!besidePerson(ctx, other)) return;                       // not asked from across the room
      if (invitationsIssuedToday(ctx.state, ctx.actor.id) > 0) return;   // once per inviter per day
      var s = sittingFor(ctx.state.minute);
      if (!s) return;
      if (hasOpenSocialWith(ctx.state, ctx.actor.id, other.id)) return;
      if (openInvitationBetween(ctx.state, ctx.actor.id, other.id)) return;
      var inv = makeInvitation({ fromId: ctx.actor.id, toId: other.id, sitting: s }, ctx.state.day);
      ctx.state.objects.push(inv);
      ctx.sim.touch();
      ctx.emit('MEAL_INVITED', {
        invitationId: inv.id, fromId: ctx.actor.id, toId: other.id,
        locationId: CAFE_ID, dueDay: inv.dueDay, dueMin: inv.dueMin
      }, ctx.actor.name + ' invited ' + other.name + ' to ' + s.label + '.', [other.id]);
    }
  };

  ACTIONS.accept_meal = {
    id: 'accept_meal', label: 'Accept the invitation', targetKind: null, position: 'anywhere',
    interruptible: false,
    duration: function () { return 1; },
    candidateMeta: function (ctx) {
      var inv = openInvitationHeldBy(ctx.state, ctx.actor.id);
      if (!inv) return {};
      var from = ctx.state.characters[inv.fromId];
      return { fromId: inv.fromId, fromName: from ? from.name : null,
               locationId: inv.locationId, dueDay: inv.dueDay, dueMin: inv.dueMin };
    },
    eligible: function (ctx) {
      var inv = openInvitationHeldBy(ctx.state, ctx.actor.id);
      if (!inv) return { reason: 'no_invitation' };
      if (ctx.absMinute > inv.expiresAbs) return { reason: 'invitation_expired' };
      return true;
    },
    onComplete: function (ctx) {
      var inv = openInvitationHeldBy(ctx.state, ctx.actor.id);
      if (!inv || inv.status !== 'open' || inv.heldBy !== ctx.actor.id) return;   // once
      if (ctx.absMinute > inv.expiresAbs) return;
      var from = ctx.state.characters[inv.fromId], to = ctx.state.characters[inv.toId];
      if (!from || !to) return;
      inv.status = 'accepted';
      inv.heldBy = null;
      inv.heldAffordances = [];
      inv.answeredAbs = ctx.absMinute;
      /* One ordinary social commitment on each, in the shape acceptOffer pushes. */
      var id = 'cmt_meal_' + inv.id;
      from.commitments = from.commitments || [];
      to.commitments = to.commitments || [];
      from.commitments.push(mealCommitment(id, to.id, inv, 'Eat with ' + to.name + ' at the café at ' + U.clock(inv.dueMin)));
      to.commitments.push(mealCommitment(id, from.id, inv, 'Eat with ' + from.name + ' at the café at ' + U.clock(inv.dueMin)));
      ctx.sim.touch();
      ctx.sim.adjustRelationship(from, to.id, { closeness: 1 });
      ctx.sim.adjustRelationship(to, from.id, { closeness: 1 });
      ctx.emit('MEAL_ACCEPTED', {
        invitationId: inv.id, fromId: inv.fromId, toId: inv.toId, dueDay: inv.dueDay, dueMin: inv.dueMin
      }, to.name + ' accepted ' + from.name + "'s invitation.", [from.id]);
    }
  };

  ACTIONS.decline_meal = {
    id: 'decline_meal', label: 'Decline the invitation', targetKind: null, position: 'anywhere',
    interruptible: false,
    duration: function () { return 1; },
    candidateMeta: function (ctx) {
      var inv = openInvitationHeldBy(ctx.state, ctx.actor.id);
      if (!inv) return {};
      var from = ctx.state.characters[inv.fromId];
      return { fromId: inv.fromId, fromName: from ? from.name : null,
               locationId: inv.locationId, dueDay: inv.dueDay, dueMin: inv.dueMin };
    },
    eligible: function (ctx) {
      var inv = openInvitationHeldBy(ctx.state, ctx.actor.id);
      if (!inv) return { reason: 'no_invitation' };
      if (ctx.absMinute > inv.expiresAbs) return { reason: 'invitation_expired' };
      return true;
    },
    onComplete: function (ctx) {
      var inv = openInvitationHeldBy(ctx.state, ctx.actor.id);
      if (!inv || inv.status !== 'open' || inv.heldBy !== ctx.actor.id) return;   // once
      if (ctx.absMinute > inv.expiresAbs) return;
      inv.status = 'declined';
      inv.heldBy = null;
      inv.heldAffordances = [];
      inv.answeredAbs = ctx.absMinute;
      ctx.sim.touch();
      /* Only the inviter feels the small coolness; nothing else moves. */
      var from = ctx.state.characters[inv.fromId];
      if (from) ctx.sim.adjustRelationship(from, ctx.actor.id, { closeness: -1 });
      ctx.emit('MEAL_DECLINED', {
        invitationId: inv.id, fromId: inv.fromId, toId: inv.toId, dueDay: inv.dueDay, dueMin: inv.dueMin
      }, ctx.actor.name + ' declined ' + (from ? from.name : 'the') + "'s invitation.", [inv.fromId]);
    }
  };

  /* The commitment shape acceptOffer pushes: id, kind, strength, withId,
   * locationId, label, dueDay, dueMin, graceMin, status. */
  function mealCommitment(id, withId, invitation, label) {
    return {
      id: id, kind: 'social', strength: 'soft', withId: withId,
      locationId: invitation.locationId, label: label,
      dueDay: invitation.dueDay, dueMin: invitation.dueMin,
      graceMin: GRACE_MIN, status: 'open'
    };
  }

  SM.ACTIONS = ACTIONS;

  SM.registerActions = function (catalogue) {
    if (!catalogue || typeof catalogue.define !== 'function') {
      throw new Error('shared-meal v01: the action catalogue has no define(); nothing can be registered');
    }
    Object.keys(ACTIONS).forEach(function (id) { catalogue.define(ACTIONS[id]); });
    return Object.keys(ACTIONS);
  };
  SM.registerActions(A);

  /* ---------------- what a saved instance must look like ---------------- */

  function validateInvitation(o, env) {
    if (!o || o.typeId !== TYPE_ID) return 'is not a meal invitation';
    if (!isIdString(o.id)) return 'has no usable id';
    if (typeof o.name !== 'string' || o.name.length === 0) return 'has no name';
    var people = env.state.characters;
    if (!people[o.fromId]) return 'names an inviter (' + o.fromId + ') who is not in the town';
    if (!people[o.toId]) return 'names an invitee (' + o.toId + ') who is not in the town';
    if (o.fromId === o.toId) return 'invites ' + o.fromId + ' to a meal with themselves';
    if (!W.LOCATIONS[o.locationId]) return 'names a place (' + o.locationId + ') that is not in the town';
    if (!isInteger(o.dueDay)) return 'has a due day that is not a whole number';
    if (!isInteger(o.dueMin)) return 'has a due minute that is not a whole number';
    if (!isFiniteNumber(o.expiresAbs)) return 'has an expiry that is not a finite minute';
    if (STATUSES.indexOf(o.status) < 0) return 'is in the unknown state "' + o.status + '"';
    if (o.location !== null && o.location !== undefined) return 'is recorded in ' + o.location + ', but an invitation never lies anywhere';
    if (o.x !== null && o.x !== undefined) return 'has a position, but an invitation never lies anywhere';
    if (!isArray(o.affordances) || o.affordances.length) return 'offers room affordances, but an invitation is never an object of a room';
    if (!isArray(o.heldAffordances)) return 'has no held-affordances list';

    if (o.status === 'open') {
      if (o.heldBy !== o.toId) return 'is open but not held by the invitee (' + o.toId + ')';
      if (o.heldAffordances.indexOf('accept_meal') < 0 || o.heldAffordances.indexOf('decline_meal') < 0) {
        return 'is open but does not offer being accepted or declined';
      }
      if (o.answeredAbs !== null && o.answeredAbs !== undefined) return 'is open but already carries an answer time';
    } else {
      if (o.heldBy) return 'is ' + o.status + ' but still held by ' + o.heldBy;
      if (o.heldAffordances.length) return 'is ' + o.status + ' but still offers ' + o.heldAffordances.join(', ');
      if (!isFiniteNumber(o.answeredAbs)) return 'is ' + o.status + ' with no answer time';
    }
    return null;
  }

  /* An invitation is never drawn anywhere. */
  function visualInvitation() { return null; }

  C.register({
    id: 'shared-meal', version: VERSION,
    interventionTypes: [],
    objectTypes: {
      meal_invitation: { validate: validateInvitation, visual: visualInvitation }
    }
  });

  /* ---------------- what these are worth to a person ----------------
   *
   * Offered to UtilityPolicy in its own arithmetic, never as rules. Inviting
   * someone is worth more the closer they are and the more sociable the asker;
   * it is worth nothing, or less, toward a stranger. Accepting is worth the
   * company and the trust of the person asking, and is worth much less when
   * another promise already sits within ninety minutes of the sitting;
   * declining is its mirror. Nothing says "always accept". */

  function openness(req, id) {
    var rel = id && req.relationships ? req.relationships[id] : null;
    return {
      closeness: rel && isFiniteNumber(rel.closeness) ? rel.closeness / 100 : 0,
      trust: rel && isFiniteNumber(rel.trust) ? rel.trust / 100 : 0
    };
  }

  /* How many of the actor's open promises fall within ninety minutes of the
   * sitting they are being asked about. */
  function clashNear(req, meta) {
    if (!meta || meta.dueDay === undefined || meta.dueMin === undefined) return 0;
    var sitting = U.absolute(meta.dueDay, meta.dueMin), n = 0;
    (req.commitments || []).forEach(function (c) {
      if (c.status !== 'open') return;
      if (Math.abs(U.absolute(c.dueDay, c.dueMin) - sitting) <= 90) n++;
    });
    /* A shift that covers the sitting is a clash too, whenever its promise
     * falls due: someone serving at the counter cannot sit down to eat
     * (found by audit: lunches accepted mid-shift lapsed with both there). */
    var e = req.self && req.self.employment;
    if (e && meta.dueMin >= e.shiftStart && meta.dueMin < e.shiftEnd) n += 2;
    return n;
  }

  var SCORES = {
    invite_to_meal: function (req, cand, h) {
      var o = openness(req, cand.targetId), clash = clashNear(req, cand.meta);
      var out = { company: o.closeness * 40 - 12 + 14 * h.trait('sociability') };
      /* Not asking someone to a sitting one cannot keep oneself (a shift, another promise). */
      if (clash) out.clash = -clash * 22;
      return out;
    },
    accept_meal: function (req, cand, h) {
      var meta = cand.meta || {};
      var o = openness(req, meta.fromId);
      return {
        company: o.closeness * 22,
        trust: o.trust * 14,
        clash: -clashNear(req, meta) * 22
      };
    },
    decline_meal: function (req, cand, h) {
      var meta = cand.meta || {};
      var o = openness(req, meta.fromId);
      return {
        avoid_clash: clashNear(req, meta) * 22,
        keep_to_oneself: (1 - o.closeness) * 10
      };
    }
  };
  SM.SCORES = SCORES;

  function offerScores(policy) {
    if (!policy || typeof policy.defineScore !== 'function') return;
    Object.keys(SCORES).forEach(function (id) { policy.defineScore(id, SCORES[id]); });
  }
  offerScores(LT.UtilityPolicy);
  SM.offerScores = offerScores;
})();
