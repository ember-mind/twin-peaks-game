/* lt-interventions.js — Living Town: typed changes to circumstance.
 *
 * An intervention changes what is true in the world. It never chooses anyone's
 * reaction: it creates a circumstance, the characters perceive it through the
 * ordinary perception rules, and their own policies decide what to do.
 *
 * This is the mechanical half of the eventual public pipeline
 *   proposal -> moderation -> candidate -> vote -> winner -> schedule -> apply
 * Everything left of "schedule" is deliberately absent from this milestone.
 *
 * Definition contract:
 *   type, label, paramsSchema (documentation), validate(params, sim) -> true | {error},
 *   apply(params, sim, record) -> { ok, data }
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function') {
    if (!LT.Util) require('./lt-util.js');
    if (!LT.World) require('./lt-world.js');
  }
  var U = LT.Util, W = LT.World;
  var I = LT.Interventions = LT.Interventions || {};

  var DEFS = {};

  I.define = function (def) {
    if (!def || !def.type || typeof def.validate !== 'function' || typeof def.apply !== 'function') {
      throw new Error('an intervention needs type, validate and apply');
    }
    DEFS[def.type] = def;
    return def;
  };

  I.get = function (type) { return DEFS[type] || null; };
  I.types = function () { return Object.keys(DEFS); };

  /* Validation happens at scheduling time, so a malformed proposal never
   * reaches the world and never becomes a half-applied fact. */
  I.schedule = function (sim, entry) {
    var def = DEFS[entry.type];
    if (!def) return { ok: false, error: 'unknown_intervention_type' };
    var verdict;
    try { verdict = def.validate(entry.params || {}, sim); }
    catch (e) { verdict = { error: 'validate_threw:' + (e && e.message) }; }
    if (verdict !== true) return { ok: false, error: (verdict && verdict.error) || 'invalid_params' };

    var atDay = entry.atDay === undefined ? sim.state.day : entry.atDay;
    var atMin = entry.atMinute === undefined ? sim.state.minute : entry.atMinute;
    var record = {
      id: 'itv_' + (sim.scheduledInterventions.length + 1),
      type: entry.type, params: entry.params || {},
      source: entry.source || 'developer',
      atDay: atDay, atMinute: atMin, atAbs: U.absolute(atDay, atMin),
      status: 'scheduled', scheduledStamp: sim.stamp()
    };
    sim.scheduledInterventions.push(record);
    sim.state.interventions.push(record);
    sim.touch();
    sim.emit('INTERVENTION_SCHEDULED', {
      data: { interventionId: record.id, type: record.type, at: U.stamp(atDay, atMin), source: record.source },
      text: 'Intervention scheduled: ' + (def.label || record.type) + ' at ' + U.stamp(atDay, atMin)
    });
    return { ok: true, record: record };
  };

  I.applyDue = function (sim) {
    var now = sim.absMinute();
    sim.scheduledInterventions.forEach(function (record) {
      if (record.status !== 'scheduled' || record.atAbs > now) return;
      var def = DEFS[record.type];
      var verdict;
      try { verdict = def.validate(record.params, sim); }
      catch (e) { verdict = { error: 'validate_threw:' + (e && e.message) }; }
      if (verdict !== true) {
        record.status = 'failed';
        record.error = (verdict && verdict.error) || 'invalid_at_apply_time';
        sim.emit('INTERVENTION_FAILED', {
          data: { interventionId: record.id, type: record.type, error: record.error },
          text: 'Intervention could not be applied: ' + record.type + ' (' + record.error + ')'
        });
        return;
      }
      var result;
      try { result = def.apply(record.params, sim, record); }
      catch (e) { result = { ok: false, error: 'apply_threw:' + (e && e.message) }; }
      if (!result || !result.ok) {
        record.status = 'failed';
        record.error = (result && result.error) || 'apply_failed';
        sim.emit('INTERVENTION_FAILED', {
          data: { interventionId: record.id, type: record.type, error: record.error },
          text: 'Intervention could not be applied: ' + record.type
        });
        return;
      }
      record.status = 'applied';
      record.appliedStamp = sim.stamp();
      record.result = result.data || null;
      sim.touch();
      sim.emit('INTERVENTION_APPLIED', {
        locationId: result.locationId || null,
        data: { interventionId: record.id, type: record.type, result: record.result },
        text: def.describe ? def.describe(record.params, sim) : ('Something changed in town: ' + record.type)
      });
    });
  };

  /* ---------------- offer_extra_work ---------------- */

  I.define({
    type: 'offer_extra_work',
    label: 'An extra shift becomes available',
    paramsSchema: {
      toId: 'character id the shift is offered to',
      locationId: 'where the shift is worked',
      startMin: 'minute of day the shift starts',
      endMin: 'minute of day the shift ends',
      pay: 'EUR paid for the whole shift',
      expiresMin: 'minute of day the offer lapses'
    },
    validate: function (p, sim) {
      if (!p.toId || !sim.state.characters[p.toId]) return { error: 'unknown_character' };
      var loc = W.LOCATIONS[p.locationId];
      if (!loc) return { error: 'unknown_location' };
      if (typeof p.startMin !== 'number' || typeof p.endMin !== 'number') return { error: 'missing_window' };
      if (p.endMin <= p.startMin) return { error: 'empty_window' };
      if (p.startMin < loc.opens || p.endMin > loc.closes) return { error: 'outside_opening_hours' };
      if (typeof p.pay !== 'number' || p.pay <= 0) return { error: 'invalid_pay' };
      if (typeof p.expiresMin !== 'number' || p.expiresMin <= p.startMin - 1) {
        // An offer must still be decidable when it arrives, and must lapse.
        if (typeof p.expiresMin !== 'number') return { error: 'missing_expiry' };
      }
      return true;
    },
    describe: function (p, sim) {
      var c = sim.state.characters[p.toId];
      return 'The café posted an extra shift for ' + c.name + ': ' +
             U.clock(p.startMin) + '–' + U.clock(p.endMin) + ', ' + p.pay + ' EUR.';
    },
    apply: function (p, sim, record) {
      var offer = {
        id: 'off_' + (sim.state.offers.length + 1),
        type: 'offer_extra_work',
        interventionId: record.id,
        toId: p.toId,
        fromLabel: W.LOCATIONS[p.locationId].name,
        locationId: p.locationId,
        delivery: p.delivery || 'posted',   // 'posted' = only visible on site
        summary: 'extra shift ' + U.clock(p.startMin) + '–' + U.clock(p.endMin) + ' for ' + p.pay + ' EUR',
        params: { locationId: p.locationId, startMin: p.startMin, endMin: p.endMin, pay: p.pay },
        status: 'open',
        createdDay: sim.state.day, createdMin: sim.state.minute,
        expiresDay: p.expiresDay === undefined ? sim.state.day : p.expiresDay,
        expiresMin: p.expiresMin,
        perceivedBy: {},
        grantsAction: 'work_extra_shift',
        commitment: {
          kind: 'work', strength: 'soft', withId: 'cafe',
          label: 'Work the extra shift until ' + U.clock(p.endMin),
          dueDay: sim.state.day, dueMin: p.endMin, graceMin: 0
        }
      };
      sim.state.offers.push(offer);
      sim.touch();
      return { ok: true, locationId: p.locationId, data: { offerId: offer.id } };
    }
  });
})();
