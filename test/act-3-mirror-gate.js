/* test/act-3-mirror-gate.js — Atto 3 classic-layer topology cleanup.
 * Copre: (a) la cascata specchio315 risolve gigante1_dlg/specchio315/
 * specchio_dopo in base ai soli flag classici jacques_morto e gigante1;
 * (b) syncNarrativeToClassic (js/narrative-production.js) scrive
 * jacques_morto solo quando flags.jacques_dead e' vero; (c) jacques_a3 (che
 * scriveva jacques_preso, non jacques_morto) e' stato ritirato, e l'unico
 * writer classico residuo di jacques_morto resta lucy_a3, invariato; (d) la
 * porta vagone->oej ('21,0') e' gated da east_route_confirmed/oej_bloccato,
 * sia in js/maps.js sia nel dialogo di blocco in js/data.js.
 * Esegui con: node test/act-3-mirror-gate.js
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

const GAME = global.GAME;
const E = GAME.Engine;
E.init(canvasStub);

let checks = 0, failures = 0;
function ok(cond, label) {
  checks++;
  if (!cond) { failures++; console.error('  ✗ ' + label); }
}

console.log('# act-3-mirror-gate: topologia classica Atto 3 dopo la pulizia');

/* ---------------- (a) cascata specchio315 ---------------- */

const specchio = GAME.INTERACT_DLG.specchio315;

ok(E.resolveDialogue(specchio, { flags: { jacques_morto: false, gigante1: false } }) === 'specchio315',
  '(a) jacques_morto assente: risolve al fallback specchio315');
ok(E.resolveDialogue(specchio, { flags: { jacques_morto: true, gigante1: false } }) === 'gigante1_dlg',
  '(a) jacques_morto vero, gigante1 assente: risolve a gigante1_dlg');
ok(E.resolveDialogue(specchio, { flags: { jacques_morto: true, gigante1: true } }) === 'specchio_dopo',
  '(a) gigante1 gia\' vero: risolve a specchio_dopo (gigante1 precede jacques_morto nella cascata)');
ok(E.resolveDialogue(specchio, { flags: { jacques_morto: false, gigante1: true } }) === 'specchio_dopo',
  '(a) gigante1 vero e jacques_morto falso: resta specchio_dopo');

/* ---------------- (b) syncNarrativeToClassic: unico writer mission-side ---------------- */

const productionSource = fs.readFileSync(J('narrative-production.js'), 'utf8');
const syncMatch = /function syncNarrativeToClassic\(state, classicFlags\) \{([\s\S]*?)\n  \}/.exec(productionSource);
ok(!!syncMatch, '(b) syncNarrativeToClassic trovata in js/narrative-production.js');
const syncBody = syncMatch ? syncMatch[1] : '';
ok(/if\s*\(state\.flags\.jacques_dead\)\s*classicFlags\.jacques_morto\s*=\s*true;/.test(syncBody),
  '(b) syncNarrativeToClassic imposta classicFlags.jacques_morto = true SOLO se state.flags.jacques_dead');
ok(!/classicFlags\.jacques_morto\s*=\s*true;/.test(syncBody.replace(/if\s*\(state\.flags\.jacques_dead\)\s*classicFlags\.jacques_morto\s*=\s*true;/, '')),
  '(b) nessun altro punto di syncNarrativeToClassic scrive jacques_morto incondizionatamente');

/* ---------------- (b2) east_route_confirmed attraversa il ponte narrativo->classico ---------------- */

// Playthrough E1 (2026-09-10): la porta classica '21,0' legge il flag classico,
// ma l'unico writer e' il nodo m5_tracks_north (stato narrativo). Senza questa
// riga la porta restava chiusa per sempre: One Eyed Jacks irraggiungibile.
ok(/if\s*\(state\.flags\.east_route_confirmed\)\s*classicFlags\.east_route_confirmed\s*=\s*true;/.test(syncBody),
  '(b2) syncNarrativeToClassic mirrora east_route_confirmed (la porta oej legge il flag classico)');

/* ---------------- (c) jacques_a3 non scrive piu' jacques_morto ---------------- */

// Correzione fattuale rispetto all'assunto iniziale: jacques_a3 (ritirato)
// scriveva jacques_preso, non jacques_morto. Il writer classico di
// jacques_morto e' sempre stato lucy_a3 (ponte "Jacques muore in ospedale"),
// non toccato da questa pulizia e tuttora presente. Qui verifichiamo che (1)
// jacques_a3 non esiste piu' come dialogo e (2) l'unico writer classico
// residuo di jacques_morto e' lucy_a3 — nessun altro dialogo lo scrive.
ok(!GAME.Data.dialogues.jacques_a3, '(c) il dialogo jacques_a3 e\' stato ritirato');
const dataSource = fs.readFileSync(J('data.js'), 'utf8');
const writerBlocks = dataSource.split(/(?=^\s{4}\w+:\s*\{)/m).filter((b) => /setFlag:\s*'jacques_morto'/.test(b));
ok(writerBlocks.length === 1 && /^\s{4}lucy_a3:/.test(writerBlocks[0]),
  '(c) l\'unico writer classico residuo di jacques_morto e\' lucy_a3 (invariato)');

/* ---------------- (d) porta vagone->oej gated ---------------- */

const door = GAME.Maps.traincar.doors['21,0'];
ok(!!door, '(d) la porta vagone->oej (21,0) esiste');
ok(door && door.needsFlag === 'east_route_confirmed', '(d) needsFlag = east_route_confirmed');
ok(door && door.blockedMsg === 'oej_bloccato', '(d) blockedMsg = oej_bloccato');
ok(!!GAME.Data.dialogues.oej_bloccato, '(d) js/data.js definisce il dialogo oej_bloccato');

console.log(checks + ' controlli superati' + (failures ? (', ' + failures + ' FALLITI ✗') : ' ✔'));
if (failures > 0) { console.error('ACT-3-MIRROR-GATE-FAIL ' + failures + '/' + checks); process.exit(1); }
console.log('ACT-3-MIRROR-GATE-PASS ' + checks + '/' + checks);
