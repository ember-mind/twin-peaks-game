/* test/act-4-mirror-gate.js — Atto 4 (M8) classic-layer topology cross-check.
 * Copre: (a) gigante2 (sync narrativo->classico) deriva SOLO da
 * nodes_done.m8_roadhouse_truman, mai da m8_roadhouse (id ritirato dallo
 * split B1); (b) gigante2 non è nella whitelist classico->narrativo e nessun
 * `when`/condizione narrativa in tutto il progetto legge `flag: gigante2`
 * (è un flag di SOLA uscita verso il classico); (c) i classici sarah/bobby/
 * donna/jacoby sono condizionati a !flag:gigante2; (d) WORLD_TARGETS.town.
 * town_crossroads = (47,30); (e) gli id classici ritirati dell'Atto 4 sono
 * assenti da js/data.js e js/glue.js; (f) index.html ha i tag di cache
 * aggiornati per narrative-data.gen.js e per l'adapter narrativo.
 * Esegui con: node test/act-4-mirror-gate.js
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

global.window = global;
global.addEventListener = () => {};
global.requestAnimationFrame = () => {};
global.performance = { now: () => 0 };

const ctxStub = new Proxy(
  { measureText: (s) => ({ width: String(s).length * 5 }) },
  { get(t, k) { return k in t ? t[k] : () => {}; }, set() { return true; } }
);
const canvasStub = { getContext: () => ctxStub };

const root = path.resolve(__dirname, '..');
const J = (f) => path.join(root, 'js', f);
require(J('tiles.js'));
require(J('chars.js'));
require(J('houses.js'));
require(J('maps.js'));
require(J('data.js'));
require(J('retro-font.js'));
require(J('engine.js'));
require(J('glue.js'));
require(J('narrative-runtime.js'));
require(J('narrative-data.gen.js'));
require(J('narrative-bootstrap.js'));
require(J('narrative-engine-adapter.js'));
require(J('narrative-production.js'));

const GAME = global.GAME;
const E = GAME.Engine;
E.init(canvasStub);
GAME.installNarrativeCatalogs({ data: GAME.NarrativeData, runtime: GAME.NarrativeRuntime });

let checks = 0, failures = 0;
function ok(cond, label) {
  checks++;
  if (!cond) { failures++; console.error('  ✗ ' + label); }
}

console.log('# act-4-mirror-gate: topologia classica Atto 4 dopo lo split B1');

/* ---------------- (a) gigante2 deriva SOLO da m8_roadhouse_truman ---------------- */

const productionSource = fs.readFileSync(J('narrative-production.js'), 'utf8');
ok(/nodes_done\.m8_roadhouse_truman/.test(productionSource),
  '(a) narrative-production.js legge nodes_done.m8_roadhouse_truman per derivare gigante2');
ok(!/nodes_done\.m8_roadhouse\b(?!_)/.test(productionSource.replace(/nodes_done\.m8_roadhouse_truman/g, '')),
  '(a) nessun riferimento residuo a nodes_done.m8_roadhouse (id ritirato dallo split B1)');
// riga esatta: solo m8_roadhouse_truman pilota classicFlags.gigante2 (non m8_roadhouse_phone)
const giganteLineMatch = /if\s*\(state\.nodes_done\.(\w+)\)\s*classicFlags\.gigante2\s*=\s*true;/.exec(productionSource);
ok(!!giganteLineMatch && giganteLineMatch[1] === 'm8_roadhouse_truman',
  '(a) l\'unico writer di classicFlags.gigante2 è gated su nodes_done.m8_roadhouse_truman (trovato: ' + (giganteLineMatch && giganteLineMatch[1]) + ')');
ok((productionSource.match(/classicFlags\.gigante2\s*=\s*true/g) || []).length === 1,
  '(a) classicFlags.gigante2 è scritto in un unico punto di narrative-production.js');

/* ---------------- (b) gigante2 e' un flag di SOLA uscita ---------------- */

// non deve comparire nella whitelist classico->narrativo (syncClassicToNarrative)
const syncClassicMatch = /function syncClassicToNarrative\(NR, state, classicFlags\) \{([\s\S]*?)\n  \}/.exec(productionSource);
ok(!!syncClassicMatch, '(b) syncClassicToNarrative trovata in js/narrative-production.js');
ok(!!syncClassicMatch && syncClassicMatch[1].indexOf('gigante2') === -1,
  '(b) gigante2 non è nella whitelist classico->narrativo (mai letto in ingresso dal runtime)');

// nessun `when`/condizione narrativa in tutto il progetto legge flag gigante2
const M8 = GAME.NarrativeData.missions.M8;
function scanConds(obj, path_, hits) {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) { obj.forEach((v, i) => scanConds(v, path_ + '[' + i + ']', hits)); return; }
  if (obj.flag === 'gigante2') hits.push(path_);
  Object.keys(obj).forEach((k) => scanConds(obj[k], path_ + '.' + k, hits));
}
const missionHits = [];
Object.values(GAME.NarrativeData.missions).forEach((m) => scanConds(m, m.id || m.name || 'mission', missionHits));
ok(missionHits.length === 0, '(b) nessuna condizione narrativa (`when`/`conditions`/`condition`) legge flag:gigante2 (trovati: ' + missionHits.join(',') + ')');
// e la stessa cosa sulle entità del registro (NARRATIVE_ENTITIES.when)
const A = GAME.NarrativeAdapter;
const NR = GAME.NarrativeRuntime;
const state0 = NR.createState();
state0.flags.atto4 = true;
A.enable({ mission: M8, missions: [M8], state: state0, container: {} });
const entityHits = [];
A._debugNarrativeEntities.forEach((e) => scanConds(e.when, e.map_id + ':' + e.npc.id, entityHits));
ok(entityHits.length === 0, '(b) nessuna entità narrativa condiziona la presenza su flag:gigante2 (trovati: ' + entityHits.join(',') + ')');

/* ---------------- (c) classici sarah/bobby/donna/jacoby: !flag:gigante2 ---------------- */

const glueSource = fs.readFileSync(J('glue.js'), 'utf8');
['sarah', 'bobby', 'donna', 'jacoby'].forEach((id) => {
  const re = new RegExp("id: '" + id + "'[\\s\\S]{0,200}?cond: \\[([\\s\\S]{0,80}?)\\]");
  const m = re.exec(glueSource);
  ok(!!m && m[1].indexOf("'!flag:gigante2'") !== -1, '(c) NPC classico ' + id + ' ha cond !flag:gigante2 (js/glue.js)');
});
/* ---------------- (d) WORLD_TARGETS.town.town_crossroads ---------------- */

const reg = A._debugWorldTargets.town;
ok(!!reg && !!reg.town_crossroads, '(d) WORLD_TARGETS.town.town_crossroads registrato');
ok(reg && reg.town_crossroads.x === 47 && reg.town_crossroads.y === 30, '(d) town_crossroads = (47,30)');
ok(GAME.Maps.isSolid('town', 47, 30, {}) === false, '(d) (47,30) calpestabile sulla mappa classica town');

/* ---------------- (e) id classici ritirati dell'Atto 4 assenti ---------------- */

const RETIRED_DIALOGUES = ['truman_atto4', 'truman_atto5', 'truman_wait5', 'lago_maddy', 'maddy_a4', 'leland_a4', 'leland_dove', 'leland_dopo', 'gerard_a4'];
RETIRED_DIALOGUES.forEach((id) => ok(!GAME.Data.dialogues[id], '(e) dialogo classico ritirato "' + id + '" assente da js/data.js'));
ok(!GAME.Data.clues.lettera_o, '(e) indizio classico ritirato "lettera_o" assente da js/data.js');
const dataSource = fs.readFileSync(J('data.js'), 'utf8');
RETIRED_DIALOGUES.concat(['lettera_o']).forEach((id) => {
  ok(dataSource.indexOf("'" + id + "'") === -1, '(e) nessun riferimento testuale all\'id ritirato "' + id + '" in js/data.js');
  ok(glueSource.indexOf("'" + id + "'") === -1, '(e) nessun riferimento testuale all\'id ritirato "' + id + '" in js/glue.js');
});

/* ---------------- (f) index.html: cache tag aggiornati ---------------- */

const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const dataGenTag = /narrative-data\.gen\.js\?v=([^"]+)"/.exec(indexSource);
const adapterTag = /narrative-engine-adapter\.js\?v=([^"]+)"/.exec(indexSource);
ok(!!dataGenTag, '(f) index.html referenzia narrative-data.gen.js con un tag di cache');
ok(!!adapterTag, '(f) index.html referenzia narrative-engine-adapter.js con un tag di cache');
// il pacchetto Atto 4 (M8 pass01/gigante2 split) deve aver bumpato ENTRAMBI i
// tag rispetto alla baseline pre-M8 nota (v=13qa3 / v=10): un tag invariato
// servirebbe agli utenti il codice narrativo/adapter cacheato e vecchio.
ok(!!dataGenTag && dataGenTag[1] !== '13qa3', '(f) narrative-data.gen.js: tag di cache bumpato oltre la baseline pre-Atto4 (v=' + (dataGenTag && dataGenTag[1]) + ')');
ok(!!adapterTag && adapterTag[1] !== '10', '(f) narrative-engine-adapter.js: tag di cache bumpato oltre la baseline pre-Atto4 (v=' + (adapterTag && adapterTag[1]) + ')');

console.log(checks + ' controlli superati' + (failures ? (', ' + failures + ' FALLITI ✗') : ' ✔'));
if (failures > 0) { console.error('ACT-4-MIRROR-GATE-FAIL ' + failures + '/' + checks); process.exit(1); }
console.log('ACT-4-MIRROR-GATE-PASS ' + checks + '/' + checks);
