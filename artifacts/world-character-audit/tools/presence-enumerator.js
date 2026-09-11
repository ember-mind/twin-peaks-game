/* artifacts/world-character-audit/tools/presence-enumerator.js
 *
 * Forensic duplicate/offscreen enumerator for the world-character audit.
 * NOT a test — throwaway tool, writes only its own report.
 *
 * Bootstrap pattern copied from test/act-4-flow.js "(b) adapter path"
 * (test/act-4-flow.js:306-321): fake `window`/`addEventListener`/
 * `requestAnimationFrame`, require the same script list in the same
 * order, then use GAME.NarrativeAdapter._debugNarrativeEntities and
 * GAME.NarrativeAdapter._debugEvalWhen to evaluate `when` exactly the
 * way the real adapter does (no second implementation of that semantics).
 *
 * For classic NPC `cond` we use js/engine.js's own evaluator
 * (E.npcActive / E.checkCond, exported as GAME.Engine.npcActive /
 * GAME.Engine.checkCond) for the same reason: one semantics, not a
 * reimplementation.
 *
 * IMPORTANT SIMPLIFICATION (documented, not hidden): this tool does NOT
 * drive missions through NR.prepareNode/commitNode to reach each seeded
 * state. `when` and classic `cond` read only state.flags / state.values /
 * state.nodes_done / state.evidence (narrative side) and st.flags / st.clues
 * (classic side) — so seeds are built by constructing those objects
 * directly to the shape a real playthrough would have left them in. This
 * is faithful to the evaluators (verified by reading js/narrative-runtime.js
 * evalCond and js/engine.js checkCond) but does NOT verify that a real
 * playthrough can actually reach every seed (that is act-3-flow.js /
 * act-4-flow.js's job, not this tool's).
 *
 * Classic vs narrative flag namespaces: js/narrative-production.js:137-166
 * documents the bridge between the two. The shared-name set (sogno_fatto,
 * atto3, atto4, atto5, gigante1, maddy_trovata, leland_morto,
 * sarah_visione_ascoltata, audrey_indaga, jacques_preso) is written
 * identically on both sides in real play, so seeds below use ONE `flags`
 * object for both. Two flags are NOT shared 1:1 and are handled explicitly
 * per seed: narrative `jacques_dead` <-> classic `jacques_morto`
 * (js/narrative-production.js:158), and classic-only `gigante2`, which
 * js/narrative-data.gen.js:4938 says derives from node_done:
 * m8_roadhouse_truman / the same node that writes presagio_status=active
 * (js/narrative-production.js:165-166) — so seeds set flags.gigante2
 * directly from the point presagio_status is active onward.
 */
'use strict';
const fs = require('fs');
const path = require('path');

for (const k of Object.keys(require.cache)) delete require.cache[k];
global.window = global;
global.addEventListener = function () {};
global.requestAnimationFrame = function () {};
const J = (f) => path.join(__dirname, '..', '..', '..', 'js', f);
[
  'tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'retro-font.js',
  'engine.js', 'glue.js', 'narrative-runtime.js', 'narrative-data.gen.js',
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

/* ------------------------------------------------------------------ */
/* Identity normalisation: sprite/character identity a duplicate check
 * groups by. Every adapter entity id and every classic NPC id in
 * js/glue.js is listed explicitly — nothing here is inferred. Where the
 * registry id differs from the sprite/character it is a *scenery* id
 * (piantone/piantone_ronette both use sprite 'andy' but are not Andy;
 * hawk_bridge/hawk_door/hawk_cut/hawk_shore_first/hawk_shore_after are
 * all Hawk under a placement-scoped id, by design comment
 * js/narrative-engine-adapter.js:203-205 and :300-301: "un id per
 * collocazione: syncNarrativeEntities identifica per npc.id, e tre voci
 * con lo stesso id si rimuoverebbero a vicenda"). */
const IDENTITY = {
  // classic NPCs (js/glue.js)
  bobby: 'bobby', donna: 'donna', jacoby: 'jacoby', truman: 'truman', andy: 'andy',
  hawk: 'hawk', lucy: 'lucy', leland: 'leland', sarah: 'sarah', benhorne: 'benhorne',
  audrey: 'audrey', gerard: 'gerard', norma: 'norma', shelly: 'shelly', loglady: 'loglady',
  james: 'james', mfap: 'mfap', laura: 'laura', bob: 'bob',
  // adapter entities (js/narrative-engine-adapter.js NARRATIVE_ENTITIES)
  ronette: 'ronette', infermiera: 'infermiera',
  piantone: 'agente_guardia (sprite=andy, NOT Andy)',
  piantone_ronette: 'agente_guardia (sprite=andy, NOT Andy)',
  jacques: 'jacques',
  maddy: 'maddy',
  gigante: 'giant',
  hawk_bridge: 'hawk', hawk_door: 'hawk', hawk_cut: 'hawk',
  hawk_shore_first: 'hawk', hawk_shore_after: 'hawk'
};
function identityOf(id) { return IDENTITY[id] || id; }

/* ------------------------------------------------------------------ */
/* Seeds. See file header for the flag-namespace note. */
const SEEDS = [
  { name: 'act1_start', flags: {}, values: {}, nodes_done: {}, evidence: {} },
  { name: 'act1_after_dream', flags: { sogno_fatto: true }, values: {}, nodes_done: {}, evidence: {} },
  { name: 'act2_room315', flags: { sogno_fatto: true }, values: {}, nodes_done: {}, evidence: {} },
  { name: 'act2_hospital_ronette', flags: { sogno_fatto: true, jacques_preso: true }, values: {}, nodes_done: {}, evidence: {} },
  { name: 'act3_pre_northcut', flags: { sogno_fatto: true, atto3: true }, values: {}, nodes_done: {}, evidence: {} },
  { name: 'act3_oej', flags: { sogno_fatto: true, atto3: true }, values: {}, nodes_done: {}, evidence: {} },
  { name: 'act3_hospital_guard', flags: { sogno_fatto: true, atto3: true, jacques_preso: true }, values: {}, nodes_done: {}, evidence: {} },
  { name: 'act3_room315_gigante1', flags: { sogno_fatto: true, atto3: true, jacques_preso: true, jacques_dead: true, jacques_morto: true, gigante1: true }, values: {}, nodes_done: {}, evidence: {} },
  { name: 'act4_afternoon', flags: { sogno_fatto: true, atto3: true, atto4: true, jacques_preso: true, jacques_dead: true, jacques_morto: true, gigante1: true }, values: {}, nodes_done: {}, evidence: {} },
  { name: 'act4_after_promise', flags: { sogno_fatto: true, atto3: true, atto4: true, jacques_preso: true, jacques_dead: true, jacques_morto: true, gigante1: true }, values: { promise_stance: 'accompagno' }, nodes_done: { m8_diner: true }, evidence: { T_LELAND_TAXI: true } },
  { name: 'act4_presagio_active', flags: { sogno_fatto: true, atto3: true, atto4: true, jacques_preso: true, jacques_dead: true, jacques_morto: true, gigante1: true, gigante2: true }, values: { promise_stance: 'accompagno', presagio_status: 'active' }, nodes_done: { m8_diner: true, m8_roadhouse_truman: true }, evidence: { T_LELAND_TAXI: true } },
  { name: 'act4_warning_palmer', flags: { sogno_fatto: true, atto3: true, atto4: true, jacques_preso: true, jacques_dead: true, jacques_morto: true, gigante1: true, gigante2: true }, values: { promise_stance: 'accompagno', presagio_status: 'active', warning_target: 'palmer' }, nodes_done: { m8_diner: true, m8_roadhouse_truman: true }, evidence: { T_LELAND_TAXI: true } },
  { name: 'act4_warning_centrale', flags: { sogno_fatto: true, atto3: true, atto4: true, jacques_preso: true, jacques_dead: true, jacques_morto: true, gigante1: true, gigante2: true }, values: { promise_stance: 'accompagno', presagio_status: 'active', warning_target: 'centrale' }, nodes_done: { m8_diner: true, m8_roadhouse_truman: true }, evidence: { T_LELAND_TAXI: true } },
  { name: 'act4_after_discovery_hawk', flags: { sogno_fatto: true, atto3: true, atto4: true, jacques_preso: true, jacques_dead: true, jacques_morto: true, gigante1: true, gigante2: true, maddy_trovata: true }, values: { promise_stance: 'accompagno', presagio_status: 'verified', warning_target: 'centrale', body_found_by: 'hawk' }, nodes_done: { m8_diner: true, m8_roadhouse_truman: true }, evidence: { T_LELAND_TAXI: true } },
  { name: 'act4_after_discovery_cooper', flags: { sogno_fatto: true, atto3: true, atto4: true, jacques_preso: true, jacques_dead: true, jacques_morto: true, gigante1: true, gigante2: true, maddy_trovata: true }, values: { promise_stance: 'accompagno', presagio_status: 'verified', warning_target: 'centrale', body_found_by: 'cooper' }, nodes_done: { m8_diner: true, m8_roadhouse_truman: true }, evidence: { T_LELAND_TAXI: true } },
  { name: 'act4_after_station', flags: { sogno_fatto: true, atto3: true, atto4: true, jacques_preso: true, jacques_dead: true, jacques_morto: true, gigante1: true, gigante2: true, maddy_trovata: true }, values: { promise_stance: 'accompagno', presagio_status: 'verified', warning_target: 'centrale', body_found_by: 'hawk' }, nodes_done: { m8_diner: true, m8_roadhouse_truman: true, m8_station: true }, evidence: { T_LELAND_TAXI: true } }
];

/* ------------------------------------------------------------------ */
const ALL_MAP_IDS = Object.keys(GAME.Maps).filter((id) => id !== 'doorAt' && id !== 'objectAt' && id !== 'isSolid');

function resolveSeed(seed) {
  const st = NR.createState();
  Object.assign(st.flags, seed.flags);
  Object.assign(st.values, seed.values);
  Object.assign(st.nodes_done, seed.nodes_done);
  Object.assign(st.evidence, seed.evidence);
  A.setState(st); // triggers syncNarrativeEntities('setState') on GAME.Maps[*].npcs

  const classicSt = { flags: seed.flags, clues: [] };
  const rows = []; // {map, x, y, id, identity, source}

  ALL_MAP_IDS.forEach((mapId) => {
    const map = GAME.Maps[mapId];
    (map.npcs || []).forEach((n) => {
      const isAdapterOwned = !!(A._debugNarrativeEntities.find((e) => e.map_id === mapId && e.npc.id === n.id));
      const source = isAdapterOwned ? 'adapter' : 'classic';
      const active = isAdapterOwned
        ? true // already filtered into map.npcs only when `when` passed, by syncNarrativeEntities
        : E.npcActive(n, classicSt);
      if (active) {
        rows.push({ map: mapId, x: n.x, y: n.y, id: n.id, identity: identityOf(n.id), source: source });
      }
    });
  });
  return rows;
}

/* ------------------------------------------------------------------ */
let md = '# Presence enumeration\n\n';
md += 'Generated by `artifacts/world-character-audit/tools/presence-enumerator.js`. ';
md += 'See that file\'s header for the bootstrap, evaluator-reuse and seed-namespace notes.\n\n';

const allDupSummary = []; // {seed, identity, count, locations:[...]}
const allZero = {}; // seed -> [identity...]
const universeIdentities = Array.from(new Set(Object.values(IDENTITY)));

SEEDS.forEach((seed) => {
  const rows = resolveSeed(seed);
  md += `## ${seed.name}\n\n`;
  md += 'flags: `' + JSON.stringify(seed.flags) + '`  \n';
  md += 'values: `' + JSON.stringify(seed.values) + '`  \n';
  md += 'nodes_done: `' + JSON.stringify(seed.nodes_done) + '`  \n';
  md += 'evidence: `' + JSON.stringify(seed.evidence) + '`\n\n';

  const byIdentity = {};
  rows.forEach((r) => {
    (byIdentity[r.identity] = byIdentity[r.identity] || []).push(r);
  });

  md += '| character | count | locations (map,x,y,source,id) | DUPLICATE |\n';
  md += '|---|---|---|---|\n';
  Object.keys(byIdentity).sort().forEach((identity) => {
    const locs = byIdentity[identity];
    const dup = locs.length > 1;
    if (dup) allDupSummary.push({ seed: seed.name, identity: identity, count: locs.length, locs: locs.slice() });
    const locStr = locs.map((l) => `${l.map},${l.x},${l.y},${l.source},${l.id}`).join('; ');
    md += `| ${identity} | ${locs.length} | ${locStr} | ${dup ? '**YES**' : ''} |\n`;
  });

  const present = Object.keys(byIdentity);
  const zero = universeIdentities.filter((id) => present.indexOf(id) === -1);
  allZero[seed.name] = zero;
  md += '\nZero presence in this state: ' + (zero.length ? zero.sort().join(', ') : '(none)') + '\n\n';
});

md += '## Summary: all duplicates across all seeded states\n\n';
md += '| state | character | count | locations |\n';
md += '|---|---|---|---|\n';
if (allDupSummary.length === 0) {
  md += '| (none found) | | | |\n';
} else {
  allDupSummary.forEach((d) => {
    const locStr = d.locs.map((l) => `${l.map}(${l.x},${l.y})[${l.source}:${l.id}]`).join(', ');
    md += `| ${d.seed} | ${d.identity} | ${d.count} | ${locStr} |\n`;
  });
}

md += '\n## Summary: zero-presence characters per state\n\n';
md += '| state | zero-presence characters |\n';
md += '|---|---|\n';
Object.keys(allZero).forEach((seedName) => {
  md += `| ${seedName} | ${allZero[seedName].sort().join(', ') || '(none)'} |\n`;
});

const outPath = path.join(__dirname, '..', 'presence-enumeration.md');
fs.writeFileSync(outPath, md, 'utf8');
console.log('wrote ' + outPath);
console.log('');
console.log(md);
