'use strict';

/* Host-side recovery checks over JSON observations and ordinary browser input.
 * No save injection, runtime calls or test-mode switches. The whole route earns
 * its progress first; comparisons are against a verified DURABLE save pair.
 */
const assert = require('node:assert/strict');
const clone = (value) => JSON.parse(JSON.stringify(value));
const record = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (record(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
const equal = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
function classicOf(s) {
  if (!s || !s.player || !Array.isArray(s.clues) || !record(s.flags)) return null;
  return { mapId: s.mapId, tx: s.player.tx, ty: s.player.ty, dir: s.player.dir,
    clues: s.clues.slice().sort(), flags: clone(s.flags) };
}
function normalizeClassic(value) {
  if (!record(value) || !Array.isArray(value.clues) || !record(value.flags)) return null;
  return { ...value, clues: value.clues.slice().sort() };
}
function idle(s) {
  return !!(s && s.mode === 'play' && s.player && !s.player.moving && !s.fadePhase && !s.dialogue &&
    !s.menu && !s.narrativeActive && !(s.finale && s.finale.active) && s.semanticUi &&
    !s.semanticUi.recovery && !s.semanticUi.notebook && !s.semanticUi.choices.length);
}
function durablePair(s) {
  const fail = (reason) => ({ ok: false, reason });
  if (!s || s.storageError || s.observationError || !record(s.saves) || !record(s.narrative)) return fail('missing_observation');
  const pkg = s.narrative.package;
  if (typeof pkg !== 'string' || !pkg) return fail('missing_package');
  const key = `twin-peaks:narrative:${pkg}:slot:main`;
  let classic, envelope, meta, savedFinale = null;
  try {
    classic = normalizeClassic(JSON.parse(s.saves.tp_save));
    envelope = JSON.parse(s.saves[key]);
    meta = JSON.parse(s.saves[`twin-peaks:narrative:${pkg}:meta`]);
    if (s.finale) savedFinale = JSON.parse(s.saves['twin-peaks:finale:v2']);
  } catch (_) { return fail('missing_or_invalid_json'); }
  if (!classic || !record(envelope) || !record(meta) || !record(meta.slots) || !record(envelope.state)) return fail('invalid_save_shape');
  if (envelope.format_version !== '1.0.0' || envelope.narrative_package !== pkg || envelope.slot_id !== 'main' ||
    envelope.narrative_schema_version !== s.narrative.schema) return fail('wrong_save_identity');
  if (!Number.isInteger(envelope.save_generation) || envelope.save_generation < 1 ||
    meta.slots.main !== envelope.save_generation) return fail('generation_mismatch');
  if (s.saves[key + ':tmp'] != null || s.saves['twin-peaks:finale:v2:tmp'] != null) return fail('unfinished_save');
  if (envelope.classic_save_fingerprint !== JSON.stringify(canonical(classic))) return fail('fingerprint_mismatch');
  if (!equal(classic, classicOf(s))) return fail('classic_not_durable');
  if (!equal(envelope.state, s.narrative)) return fail('narrative_not_durable');
  if (s.finale && !equal(savedFinale, s.finale)) return fail('finale_not_durable');
  return { ok: true, classic, narrative: clone(envelope.state), finale: savedFinale,
    key, generation: envelope.save_generation };
}
function authoredCast(s) {
  const result = [];
  for (const [map, npcs] of Object.entries(s.populations || {})) {
    for (const npc of npcs) if (typeof npc.source === 'string' && npc.source) {
      result.push({ map, id: npc.id, x: npc.x, y: npc.y, source: npc.source });
    }
  }
  return result.sort((a, b) => (a.map + '/' + a.id).localeCompare(b.map + '/' + b.id));
}
function assertRestored(before, after) {
  const saved = durablePair(before);
  assert.ok(saved.ok, 'The reference must be a genuine durable pair: ' + saved.reason);
  assert.ok(durablePair(after).ok, 'The restored save pair must also be readable and durable');
  assert.equal(after.mode, 'play', 'Continue restores gameplay, not a new prologue');
  assert.equal(after.semanticUi.recovery, false, 'A valid earned save must not enter recovery UI');
  assert.deepEqual(canonical(classicOf(after)), canonical(saved.classic), 'Restore the persisted position, facing, flags and earned clues');
  assert.deepEqual(canonical(after.narrative), canonical(saved.narrative), 'Restore the persisted narrative ledger, not just the act flag');
  assert.deepEqual(canonical(after.finale), canonical(saved.finale), 'Restore the actual finale checkpoint without replaying M10');
  assert.deepEqual(authoredCast(after), authoredCast(before), 'Derive the same authored cast placements (not wandering pixel positions)');
  assert.equal(after.semanticUi.objective, before.semanticUi.objective, 'Resume with the same resolved objective');
}

const RELOAD_POINTS = Object.freeze(['physical-awakening', 'act3-earned', 'act4-earned', 'lodge-handoff-not-ending']);
const ADMISSIONS = ['taxi_lie', 'traincar_presence', 'laura_homicide', 'maddy_homicide', 'maddy_body_transport', 'letters'];
function createRecovery(player, browser, log = () => {}) {
  const results = [];
  function success(name, detail = {}) {
    const event = { name, result: 'PASS', ...detail };
    results.push(event); log({ type: 'recovery', ...event });
  }
  async function reloadEarned(name) {
    const before = await browser.waitFor('durable earned save: ' + name, (s) => idle(s) && durablePair(s).ok);
    const saved = durablePair(before);
    await browser.capture('before-reload-' + name);
    let loaded = await browser.reload();
    // The finale may restore straight to play. Do not press A there and
    // accidentally interact; the classic title explicitly requires Continue.
    if (loaded.mode === 'title') await player.press('Enter');
    else assert.equal(loaded.mode, 'play', 'Reload is either title/Continue or the actual finale resume');
    await browser.waitFor('Continue restores play: ' + name, (s) => s.mode === 'play' && !s.semanticUi.recovery);
    await player.drain();
    loaded = await browser.waitFor('restored durable idle: ' + name, (s) => idle(s) && durablePair(s).ok);
    assertRestored(before, loaded);
    await browser.capture('after-reload-' + name);
    success('reload-' + name, { generation: saved.generation, map: loaded.mapId, revision: loaded.narrative.revision });
  }
  async function checkpoint(name) {
    if (RELOAD_POINTS.includes(name)) await reloadEarned(name);
    if (name === 'diary-earned') {
      const before = await browser.waitFor('durable earned diary before repeat', (s) => idle(s) && durablePair(s).ok);
      await player.actor('sheriff', 'truman');
      const after = await player.snapshot();
      assert.deepEqual(after.clues.slice().sort(), before.clues.slice().sort(), 'Repeating the opening dialogue cannot duplicate clues');
      assert.deepEqual(after.narrative.evidence, before.narrative.evidence, 'Repeating dialogue cannot grant extra narrative evidence');
      assert.deepEqual(after.narrative.props, before.narrative.props, 'Repeating dialogue cannot formulate a deduction');
      success('repeat-earned-diary');
    }
    if (name === 'admissions-before-tape') {
      const before = await player.snapshot();
      assert.equal(before.narrative.values.s3, undefined, 'Tape decision is still uncommitted');
      await player.press('Escape');
      const cancelled = await browser.waitFor('cancel uncommitted tape choice releases input', idle);
      assert.equal(cancelled.narrative.values.s3, undefined, 'Cancellation must not confirm a default choice');
      for (const id of ADMISSIONS) assert.equal(cancelled.narrative.values['material_admissions.' + id], 'leland_first_person', 'Prior admission remains committed: ' + id);
      await reloadEarned('cancelled-tape-choice');
      await player.actor('sheriff', 'leland');
      const resumed = await player.snapshot();
      assert.ok(resumed.semanticUi.choices.some((c) => c.id === 's3_on'), 'The same uncommitted tape choice can be resumed');
      assert.equal(resumed.narrative.values.s3, undefined, 'Resuming does not decide for the player');
      success('cancel-reload-resume-tape');
    }
  }
  function finish() {
    const expected = ['repeat-earned-diary', ...RELOAD_POINTS.map((p) => 'reload-' + p), 'reload-cancelled-tape-choice', 'cancel-reload-resume-tape'];
    assert.deepEqual(results.map((r) => r.name).sort(), expected.sort(), 'Every promised recovery scenario must actually run exactly once');
    return clone(results);
  }
  return Object.freeze({ checkpoint, finish, results: () => clone(results) });
}
module.exports = { canonical, classicOf, durablePair, assertRestored, authoredCast, createRecovery };
