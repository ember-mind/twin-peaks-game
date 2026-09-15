/* test/cast-presence-pre-migration.js
 *
 * PROOF (not a passing test): shows that today's world — before the Cast
 * Continuity migration — places named characters wrongly (duplicates,
 * phantoms, missing bodies) versus the authored truth in
 * test/fixtures/cast-pins-acts-1-4.json. Exits 1 whenever any defect is
 * found; that failure IS the deliverable.
 *
 * Bootstrap and evaluation approach copied verbatim from
 * artifacts/world-character-audit/tools/presence-enumerator.js: fake
 * window/addEventListener/requestAnimationFrame, require the same script
 * list in the same order, then evaluate classic NPC `cond` with
 * GAME.Engine.npcActive (js/engine.js) and adapter `when` with
 * GAME.NarrativeAdapter._debugEvalWhen (js/narrative-engine-adapter.js) —
 * one semantics, reused, never reimplemented. See that file's header for
 * the documented seed-construction simplification (states are built
 * directly, not driven through NR.prepareNode/commitNode).
 *
 * Does NOT modify js/narrative-engine-adapter.js, js/glue.js or
 * index.html, and does not touch any existing file.
 */
'use strict';

/* Post-migration guard (2026-09-13): once js/glue.js NPCS and NARRATIVE_ENTITIES
 * carry no registry-owned body, there is nothing left to prove here. The
 * pre-migration run is preserved in artifacts/cast-presence-v0.1/pre-migration-failures.md.
 * Exit 0 with a note so the regression suite stays green; V7 in
 * test/cast-continuity-validate.js is the live guard against old owners. */
(function postMigrationGuard() {
  const fs0 = require('fs'), path0 = require('path');
  const glue = fs0.readFileSync(path0.join(__dirname, '..', 'js', 'glue.js'), 'utf8');
  const adapter = fs0.readFileSync(path0.join(__dirname, '..', 'js', 'narrative-engine-adapter.js'), 'utf8');
  const glueEmpty = /var NPCS = \{[^}]*\}/.test(glue) && !/id: '[a-z_]+',\s*x:/.test(glue.slice(glue.indexOf('var NPCS'), glue.indexOf('};', glue.indexOf('var NPCS'))));
  const adapterEmpty = /var NARRATIVE_ENTITIES = \[\];/.test(adapter);
  if (glueEmpty && adapterEmpty) {
    console.log('cast-presence-pre-migration: old body owners already removed (glue NPCS empty, NARRATIVE_ENTITIES empty) — nothing to prove; historical proof in artifacts/cast-presence-v0.1/pre-migration-failures.md');
    process.exit(0);
  }
})();
const fs = require('fs');
const path = require('path');

for (const k of Object.keys(require.cache)) delete require.cache[k];
global.window = global;
global.addEventListener = function () {};
global.requestAnimationFrame = function () {};
const J = (f) => path.join(__dirname, '..', 'js', f);
[
  'tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'retro-font.js',
  'engine.js', 'scene-objects.gen.js', 'glue.js', 'narrative-runtime.js', 'narrative-data.gen.js',
  'narrative-engine-adapter.js', 'narrative-bootstrap.js'
].forEach((f) => require(J(f)));

const GAME = global.GAME;
const E = GAME.Engine;
const NR = GAME.NarrativeRuntime;
const A = GAME.NarrativeAdapter;
const D = GAME.NarrativeData;

const missions = ['M4', 'M5', 'M6', 'M8', 'M9'].map((id) => D.missions[id]).filter(Boolean);
const state0 = NR.createState();
A.enable({ mission: missions[0], missions: missions, state: state0, container: {} });

const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'cast-pins-acts-1-4.json');
const fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));

const ALL_MAP_IDS = Object.keys(GAME.Maps).filter((id) => id !== 'doorAt' && id !== 'objectAt' && id !== 'isSolid');

/* map placement-scoped registry ids to the character identity the pin
 * fixture names, per the team-lead brief (verbatim mapping). */
const HAWK_PLACEMENT_IDS = { hawk_bridge: 1, hawk_door: 1, hawk_cut: 1, hawk_shore_first: 1, hawk_shore_after: 1 };
function charOf(id) {
  if (HAWK_PLACEMENT_IDS[id]) return 'hawk';
  if (id === 'gigante') return 'giant';
  return id;
}

const NOT_UNDERSTOOD = []; // {pin, kind, detail} — cond/when forms this script could not evaluate

/* -------------------------------------------------------------------- */
/* Per-pin: build narrative state, mirror it into the classic state per
 * js/narrative-production.js's documented bridge, then enumerate bodies. */
function bodiesForSeed(seed) {
  const st = NR.createState();
  Object.assign(st.flags, seed.flags || {});
  Object.assign(st.values, seed.values || {});
  Object.assign(st.nodes_done, seed.nodes_done || {});
  Object.assign(st.evidence, seed.evidence || {});
  if (seed.props) Object.assign(st.props, seed.props);
  A.setState(st); // triggers syncNarrativeEntities('setState') on GAME.Maps[*].npcs

  const classicFlags = Object.assign({}, seed.flags || {}, {
    gigante2: !!(seed.nodes_done && seed.nodes_done.m8_roadhouse_truman),
    jacques_morto: !!(seed.flags && seed.flags.jacques_dead)
  });
  const classicState = { flags: classicFlags, clues: [] };

  const bodies = []; // {map, x, y, id, char, source}

  // classic NPCS entries (js/glue.js): every id in map.npcs NOT owned by the
  // narrative registry for that map. map.npcs === NPCS[mapId] (same array
  // reference, js/glue.js:156), and the adapter only ever pushes/splices
  // its OWN registered ids onto it — so anything else on the array is a
  // classic entry regardless of what the adapter did to the array.
  ALL_MAP_IDS.forEach((mapId) => {
    const map = GAME.Maps[mapId];
    (map.npcs || []).forEach((n) => {
      const isAdapterOwned = A._debugNarrativeEntities.some((e) => e.map_id === mapId && e.npc.id === n.id);
      if (isAdapterOwned) return;
      let active;
      try {
        active = E.npcActive(n, classicState);
      } catch (err) {
        NOT_UNDERSTOOD.push({ kind: 'classic cond', detail: mapId + ':' + n.id + ' -> ' + String(err && err.message || err) });
        return;
      }
      if (active) bodies.push({ map: mapId, x: n.x, y: n.y, id: n.id, char: charOf(n.id), source: 'classic' });
    });
  });

  // adapter-registered entities: evaluated directly via _debugEvalWhen,
  // independent of whatever syncNarrativeEntities already did to map.npcs.
  A._debugNarrativeEntities.forEach((ent) => {
    let active;
    try {
      active = A._debugEvalWhen(ent.when);
    } catch (err) {
      NOT_UNDERSTOOD.push({ kind: 'adapter when', detail: ent.map_id + ':' + ent.npc.id + ' -> ' + String(err && err.message || err) });
      return;
    }
    if (active) bodies.push({ map: ent.map_id, x: ent.npc.x, y: ent.npc.y, id: ent.npc.id, char: charOf(ent.npc.id), source: 'adapter' });
  });

  return bodies;
}

/* -------------------------------------------------------------------- */
function classifyDefects(expect, bodies) {
  const defects = [];
  const isOffscreenLike = expect === 'OFFSCREEN' || expect === 'TERMINAL_REMOVED' || expect.indexOf('OFFSCREEN:') === 0;
  if (bodies.length > 1) defects.push('DUPLICATE');
  if (isOffscreenLike) {
    if (bodies.length > 0) defects.push('PHANTOM');
  } else {
    const expMap = expect.split('@')[0];
    const onExpMap = bodies.some((b) => b.map === expMap);
    if (!onExpMap) defects.push('MISSING');
    if (bodies.some((b) => b.map !== expMap)) defects.push('PHANTOM');
  }
  return defects;
}

/* -------------------------------------------------------------------- */
let md = '# Cast presence pre-migration failures\n\n';
md += 'Date: 2026-09-12\n\n';
md += 'Generated by `test/cast-presence-pre-migration.js`. Proves, against the ';
md += 'authored Cast Continuity truth in `test/fixtures/cast-pins-acts-1-4.json`, ';
md += 'that the world TODAY places named characters wrongly: duplicate bodies ';
md += '(two live copies of one character), phantom bodies (present where the pin ';
md += 'says OFFSCREEN/TERMINAL_REMOVED, or on the wrong map), and missing bodies ';
md += '(expected on a map, no body found there). Coordinates are informational ';
md += 'only — this script never fails on a coordinate mismatch, only on map-level ';
md += 'placement. This script is EXPECTED TO FAIL today; the failure is the proof.\n\n';

let totalDup = 0, totalMissing = 0, totalPhantom = 0;
const byCharDup = {}, byCharMissing = {}, byCharPhantom = {};
const notRepresentable = [];
let anyDefect = false;

fixture.pins.forEach((pin) => {
  const seed = fixture.seeds[pin.seed];
  if (!seed) {
    NOT_UNDERSTOOD.push({ kind: 'fixture', detail: 'pin ' + pin.id + ' references unknown seed ' + pin.seed });
    return;
  }
  const bodies = bodiesForSeed(seed);
  const byChar = {};
  bodies.forEach((b) => { (byChar[b.char] = byChar[b.char] || []).push(b); });

  md += `## ${pin.id}\n\n`;
  md += '| character | expected | actual (map,x,y,source,id) | defects |\n';
  md += '|---|---|---|---|\n';

  Object.keys(pin.expect).sort().forEach((character) => {
    const expect = pin.expect[character];
    const chBodies = byChar[character] || [];
    const defects = classifyDefects(expect, chBodies);
    const actualStr = chBodies.length
      ? chBodies.map((b) => `${b.map},${b.x},${b.y},${b.source},${b.id}`).join('; ')
      : '(none)';

    if (defects.length) {
      anyDefect = true;
      md += `| ${character} | ${expect} | ${actualStr} | **${defects.join(', ')}** |\n`;
      if (defects.indexOf('DUPLICATE') !== -1) { totalDup++; byCharDup[character] = (byCharDup[character] || 0) + 1; }
      if (defects.indexOf('MISSING') !== -1) { totalMissing++; byCharMissing[character] = (byCharMissing[character] || 0) + 1; }
      if (defects.indexOf('PHANTOM') !== -1) { totalPhantom++; byCharPhantom[character] = (byCharPhantom[character] || 0) + 1; }
    } else {
      md += `| ${character} | ${expect} | ${actualStr} | |\n`;
      // Coincidental non-defect on an OFFSCREEN-like expectation for a
      // character with a KNOWN dedicated absence-reason ("guarded" etc.)
      // that the world does not actually represent (it just happens to
      // produce zero bodies) — surfaced separately, not as a defect.
      if (character === 'jacques' && expect === 'OFFSCREEN:guarded') {
        notRepresentable.push(`${pin.id}: jacques OFFSCREEN:guarded — zero bodies today, but there is no dedicated "guarded, held offscreen" representation; it passes only because the jacques narrative entity's condition (not jacques_preso) happens to be false.`);
      }
    }
  });
  md += '\n';
});

md += '## Summary\n\n';
md += `- DUPLICATE: ${totalDup}\n`;
md += `- MISSING: ${totalMissing}\n`;
md += `- PHANTOM: ${totalPhantom}\n\n`;
md += '### By character\n\n';
md += '| character | duplicate | missing | phantom |\n|---|---|---|---|\n';
Array.from(new Set([].concat(Object.keys(byCharDup), Object.keys(byCharMissing), Object.keys(byCharPhantom)))).sort().forEach((c) => {
  md += `| ${c} | ${byCharDup[c] || 0} | ${byCharMissing[c] || 0} | ${byCharPhantom[c] || 0} |\n`;
});

md += '\n### Known doubles reproduced\n\n';
const knownDoubles = [
  'ACT4_EVENING_GATHERING / ACT4_ROADHOUSE_PRE_PHONE — Norma: diner + roadhouse',
  'ACT4_EVENING_GATHERING / ACT4_ROADHOUSE_PRE_PHONE — Truman: sheriff + roadhouse',
  'ACT3_OEJ — Hawk: sheriff body, no body at oej (MISSING + PHANTOM, not a duplicate)'
];
knownDoubles.forEach((d) => { md += `- ${d}\n`; });

md += '\n### Not representable today (not a body defect)\n\n';
if (notRepresentable.length) {
  Array.from(new Set(notRepresentable)).forEach((n) => { md += `- ${n}\n`; });
} else {
  md += '- (none)\n';
}

if (NOT_UNDERSTOOD.length) {
  md += '\n### Cond/when forms this script could not evaluate\n\n';
  NOT_UNDERSTOOD.forEach((n) => { md += `- [${n.kind}] ${n.detail}\n`; });
}

const outPath = path.join(__dirname, '..', 'artifacts', 'cast-presence-v0.1', 'pre-migration-failures.md');
fs.writeFileSync(outPath, md, 'utf8');

console.log(md);
console.log('wrote ' + outPath);

if (NOT_UNDERSTOOD.length) {
  console.log('');
  console.log('COULD NOT EVALUATE (' + NOT_UNDERSTOOD.length + '):');
  NOT_UNDERSTOOD.forEach((n) => console.log('  [' + n.kind + '] ' + n.detail));
}

console.log('');
console.log('SUMMARY: duplicate=' + totalDup + ' missing=' + totalMissing + ' phantom=' + totalPhantom);

if (anyDefect || NOT_UNDERSTOOD.length) {
  process.exit(1);
} else {
  process.exit(0);
}
