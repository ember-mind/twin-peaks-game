'use strict';
/* Synthetic JSON observations validate the HOST checker, not the game/save
 * implementation. The separate browser route earns all its save references.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { canonical, classicOf, durablePair, assertRestored, authoredCast, createRecovery } = require('./lib/campaign-recovery.js');
const clone = (v) => JSON.parse(JSON.stringify(v));
let checks = 0;
function ok(value, name) { assert.ok(value, name); checks++; }
const s = { mode: 'play', mapId: 'town', player: { tx: 2, ty: 3, dir: 'up', moving: false },
  flags: { earned: true }, clues: ['lettera_r', 'diario'], storageError: null, observationError: null,
  narrative: { schema: '1.1.0', package: 'narrative-v1.0', revision: 12, flags: { earned: true },
    evidence: { E1_DIARIO: true, E3_LETTERA_R: true }, values: {}, props: {}, nodes_done: {} },
  finale: null, saves: {}, semanticUi: { recovery: false, objective: 'Investigate.', notebook: false, choices: [] },
  populations: { town: [{ id: 'witness', x: 4, y: 5, source: 'BASELINE' }, { id: 'crowd', x: 8, y: 8 }] },
  liveNpcs: [{ id: 'witness', x: 4, y: 5 }] };
const key = 'twin-peaks:narrative:narrative-v1.0:slot:main', metaKey = 'twin-peaks:narrative:narrative-v1.0:meta';
function writeFixture(t) {
  const classic = classicOf(t);
  t.saves.tp_save = JSON.stringify(classic);
  t.saves[key] = JSON.stringify({ format_version: '1.0.0', narrative_package: t.narrative.package, narrative_schema_version: t.narrative.schema,
    slot_id: 'main', save_generation: 3, classic_save_fingerprint: JSON.stringify(canonical(classic)), state: clone(t.narrative) });
  t.saves[metaKey] = JSON.stringify({ slots: { main: 3 } });
  if (t.finale) t.saves['twin-peaks:finale:v2'] = JSON.stringify(t.finale);
}
writeFixture(s);
ok(durablePair(s).ok, 'actual-shaped pair agrees with observation');
ok(durablePair(s).generation === 3, 'generation is retained as evidence');
const stable = JSON.stringify(s); durablePair(s); assertRestored(s, clone(s));
ok(JSON.stringify(s) === stable, 'checking must not modify observed inputs');
for (const mutate of [
  (t) => { t.storageError = 'denied'; }, (t) => { t.observationError = 'failed'; },
  (t) => { delete t.saves.tp_save; }, (t) => { t.saves[key] = '{'; },
  (t) => { delete t.saves[metaKey]; }, (t) => { t.saves[metaKey] = '{"slots":{"main":4}}'; },
  (t) => { t.saves[key + ':tmp'] = '{}'; }, (t) => { t.saves['twin-peaks:finale:v2:tmp'] = '{}'; },
  (t) => { const e = JSON.parse(t.saves[key]); e.format_version = 'unknown'; t.saves[key] = JSON.stringify(e); },
  (t) => { t.player.tx++; }, (t) => { t.clues.push('unpersisted'); },
  (t) => { t.narrative.revision++; }, (t) => { t.narrative.evidence.extra = true; },
  (t) => { const e = JSON.parse(t.saves[key]); e.slot_id = 'other'; t.saves[key] = JSON.stringify(e); },
  (t) => { const e = JSON.parse(t.saves[key]); e.narrative_package = 'other'; t.saves[key] = JSON.stringify(e); },
  (t) => { const e = JSON.parse(t.saves[key]); e.narrative_schema_version = 'other'; t.saves[key] = JSON.stringify(e); },
  (t) => { const e = JSON.parse(t.saves[key]); e.classic_save_fingerprint = 'wrong'; t.saves[key] = JSON.stringify(e); }
]) { const t = clone(s); mutate(t); ok(!durablePair(t).ok, 'reject stale, absent or mismatched durable reference'); }
const finale = clone(s); finale.finale = { stage: 'await_lodge', active: false, values: { s3: 'on' } }; writeFixture(finale);
ok(durablePair(finale).ok, 'finale checkpoint must also be durable');
finale.finale.stage = 'unpersisted'; ok(!durablePair(finale).ok, 'a narrative pair alone cannot prove finale durability');
const wandering = clone(s); wandering.liveNpcs[0].x = 6; wandering.populations.town[1].x = 9;
assertRestored(s, wandering); checks++;
for (const mutate of [
  (t) => { t.storageError = 'unreadable'; }, (t) => { t.saves[key] = '{}'; },
  (t) => { t.mode = 'intro'; }, (t) => { t.semanticUi.recovery = true; },
  (t) => { t.player.tx++; }, (t) => { t.narrative.revision++; },
  (t) => { t.semanticUi.objective = 'Stale objective'; }, (t) => { t.populations.town[0].x++; }
]) { const t = clone(s); mutate(t); assert.throws(() => assertRestored(s, t)); checks++; }
ok(authoredCast(s).length === 1, 'compare named authored placements, not anonymous wandering');
const controller = createRecovery({}, {});
assert.throws(() => controller.finish(), /Every promised recovery scenario/); checks++;
for (const forbidden of ['seed', 'travel', 'evaluate', 'setState']) ok(controller[forbidden] === undefined, 'no direct mutation capability');
const source = fs.readFileSync(require.resolve('./lib/campaign-recovery.js'), 'utf8');
ok(!/\b(?:loadMap|applyEffects|commitNode|setState|setItem|removeItem)\s*\(/.test(source), 'recovery route cannot edit game or save data');
ok(!/player\.start\s*\(/.test(source), 'Continue must never call the New Game helper');
console.log('campaign-recovery: ' + checks + ' host-checker contracts passed; browser recovery NOT_RUN');
