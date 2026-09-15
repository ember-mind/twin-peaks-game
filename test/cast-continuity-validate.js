/* test/cast-continuity-validate.js — Cast Continuity v0.1 hard validators V1–V8
 * (docs/cast-continuity-contract-v0.1.md §9) + regression corpus RC1/RC2/RC5/RC7/RC8.
 *
 * Esegui con: node test/cast-continuity-validate.js [--report <path>]
 * Exit code 1 su QUALSIASI fallimento (V7 è ATTESO fallire finché la Fase 10
 * non rimuove i vecchi owner classici/adapter — vedi V7 sotto).
 *
 * Bootstrap identico a test/cast-continuity.js (righe 30-60) + require di
 * js/cast-presence.js dopo narrative-data.gen.js.
 */
'use strict';
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
require(J('scene-objects.gen.js'));
require(J('glue.js'));
require(J('narrative-runtime.js'));
require(J('narrative-data.gen.js'));
require(J('narrative-bootstrap.js'));
require(J('narrative-engine-adapter.js'));
require(J('narrative-production.js'));
require(J('cast-presence.js'));

const GAME = global.GAME;
const E = GAME.Engine;
E.init(canvasStub);
GAME.installNarrativeCatalogs({ data: GAME.NarrativeData, runtime: GAME.NarrativeRuntime });

const CP = GAME.CastPresence;
/* Snapshot dei corpi classici PRIMA di abilitare l'adapter: A.enable() sincronizza
 * le entità narrative dentro GAME.Maps[mapId].npcs (rendering), quindi leggerlo DOPO
 * abilitare contaminerebbe V7 con doppioni che sono già contati come "adapter@...". */
const CLASSIC_NPCS_SNAPSHOT = {};
Object.keys(GAME.Maps).forEach((mapId) => { CLASSIC_NPCS_SNAPSHOT[mapId] = (GAME.Maps[mapId].npcs || []).slice(); });
const NR0 = GAME.NarrativeRuntime;
GAME.NarrativeAdapter.enable({
  mission: GAME.NarrativeData.missions.M4,
  missions: [GAME.NarrativeData.missions.M4, GAME.NarrativeData.missions.M5, GAME.NarrativeData.missions.M6, GAME.NarrativeData.missions.M8, GAME.NarrativeData.missions.M9, GAME.NarrativeData.missions.M10],
  state: NR0.createState(),
  container: {}
});
const NR = GAME.NarrativeRuntime;
const A = GAME.NarrativeAdapter;
const D = GAME.NarrativeData;
const CAST = D.cast;
const PINS = require(path.join(root, 'test', 'fixtures', 'cast-pins-acts-1-4.json'));
const TRANS = require(path.join(root, 'test', 'fixtures', 'cast-transitions-acts-1-4.json'));
const MISSIONS = [D.missions.M5, D.missions.M6, D.missions.M8, D.missions.M10];

if (!CP) throw new Error('GAME.CastPresence non caricato');

/* ---------------------------------------------------------------------- */
/* Helper generici                                                        */
/* ---------------------------------------------------------------------- */

function deepClone(x) { return JSON.parse(JSON.stringify(x)); }

function stateFromSeed(seed) {
  const s = NR.createState();
  Object.assign(s.flags, seed.flags || {});
  Object.assign(s.values, seed.values || {});
  Object.assign(s.evidence, seed.evidence || {});
  Object.assign(s.nodes_done, seed.nodes_done || {});
  if (seed.props) s.props = deepClone(seed.props);
  return s;
}

/* expect grammar: "map@x,y" | "map" | "OFFSCREEN" | "OFFSCREEN:label" | "TERMINAL_REMOVED" */
function matches(result, expect) {
  if (!result) return false;
  if (expect === 'TERMINAL_REMOVED') return result.status === 'TERMINAL_REMOVED';
  if (expect === 'OFFSCREEN') return result.status === 'OFFSCREEN';
  if (expect.indexOf('OFFSCREEN:') === 0) {
    return result.status === 'OFFSCREEN' && result.label === expect.slice('OFFSCREEN:'.length);
  }
  if (expect.indexOf('@') !== -1) {
    const at = expect.indexOf('@');
    const map = expect.slice(0, at);
    const xy = expect.slice(at + 1).split(',');
    return result.status === 'PLACED' && result.sceneId === map
      && result.x === Number(xy[0]) && result.y === Number(xy[1]);
  }
  return result.status === 'PLACED' && result.sceneId === expect;
}

function describe(r) { return r ? CP.format(r) : '<no result>'; }

function mapOf(expect) {
  if (expect === 'TERMINAL_REMOVED' || expect === 'OFFSCREEN' || expect.indexOf('OFFSCREEN:') === 0) return null;
  const at = expect.indexOf('@');
  return at === -1 ? expect : expect.slice(0, at);
}

/* LCG deterministico (seed intero) + Fisher-Yates */
function lcg(seed) {
  let s = seed >>> 0;
  return function () {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    return (s & 0x7fffffff) / 0x7fffffff;
  };
}
function shuffled(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function shuffledObjectKeys(obj, rng) {
  const keys = shuffled(Object.keys(obj), rng);
  const out = {};
  keys.forEach((k) => { out[k] = obj[k]; });
  return out;
}

function resolveCast(seedId, windowsList) {
  const state = stateFromSeed(PINS.seeds[seedId]);
  return CP.resolveCast(state, windowsList ? { windows: windowsList } : undefined);
}
function tryResolveCast(seedId, windowsList) {
  const state = stateFromSeed(PINS.seeds[seedId]);
  return CP.tryResolveCast(state, windowsList ? { windows: windowsList } : undefined);
}
function findWindow(windowsList, id) {
  if (!id || id === 'BASELINE') return null;
  return windowsList.find((w) => w.id === id) || null;
}

function deepHasId(obj, id) {
  if (obj == null || typeof obj !== 'object') return false;
  if (Array.isArray(obj)) return obj.some((o) => deepHasId(o, id));
  if (obj.id === id) return true;
  return Object.keys(obj).some((k) => deepHasId(obj[k], id));
}
function findNodeWithPage(missionsList, pageId, mapId) {
  for (const mission of missionsList) {
    if (!mission || !mission.nodes) continue;
    for (const node of mission.nodes) {
      if (node.map_id === mapId && deepHasId(node, pageId)) return node;
    }
  }
  return null;
}

/* {flag:X} positivo, ricerca SOLO attraverso `all` (mai dentro `not`) */
function containsPositiveFlag(cond, flagName) {
  if (cond == null) return false;
  if (cond.flag === flagName) return true;
  if (cond.all) return cond.all.some((c) => containsPositiveFlag(c, flagName));
  return false;
}

/* Raccoglie tutti i {flag:X} positivi (mai dentro `not`) attraversando `all`. */
function collectPositiveFlags(cond, out) {
  if (cond == null) return out;
  if (cond.flag !== undefined) { out.push(cond.flag); return out; }
  if (cond.all) { cond.all.forEach((c) => collectPositiveFlags(c, out)); return out; }
  return out;
}

const ACTOR_TO_CHARACTER = {
  hawk_bridge: 'hawk', hawk_door: 'hawk', hawk_cut: 'hawk',
  hawk_shore_first: 'hawk', hawk_shore_after: 'hawk',
  gigante: 'giant'
};
function actorToCharacter(actorId) {
  return Object.prototype.hasOwnProperty.call(ACTOR_TO_CHARACTER, actorId) ? ACTOR_TO_CHARACTER[actorId] : actorId;
}

function checkV5PinMismatches(seedId, windowsList) {
  const pin = PINS.pins.find((p) => p.id === seedId);
  if (!pin) return [{ character: '*', expected: '*', got: 'no pin for seed ' + seedId }];
  try {
    const results = resolveCast(seedId, windowsList);
    const out = [];
    Object.keys(pin.expect).forEach((charId) => {
      if (!matches(results[charId], pin.expect[charId])) {
        out.push({ character: charId, expected: pin.expect[charId], got: describe(results[charId]) });
      }
    });
    return out;
  } catch (e) {
    return [{ character: '*', expected: '*', got: 'THROW ' + (e.code || e.message) }];
  }
}

/* ---------------------------------------------------------------------- */
/* Accumulatore risultati                                                 */
/* ---------------------------------------------------------------------- */

const REPORT = [];
const FAILED = [];
function section(name) {
  const lines = [];
  return {
    log(s) { lines.push(s); },
    finish(pass, count) {
      const head = name + ': ' + (pass ? 'PASS' : 'FAIL') + (count !== undefined ? ' (' + count + ' checks)' : '');
      REPORT.push(head);
      lines.forEach((l) => REPORT.push('  ' + l));
      if (!pass) FAILED.push(name);
      console.log(head);
      lines.forEach((l) => console.log('  ' + l));
      return pass;
    }
  };
}

const SEED_IDS = Object.keys(PINS.seeds);
const CHAR_IDS = CP.characterIds();

/* ---------------------------------------------------------------------- */
/* V1 — exactly one presence                                              */
/* ---------------------------------------------------------------------- */
(function V1() {
  const s = section('V1 exactly-one');
  let pass = true, count = 0;
  SEED_IDS.forEach((seedId) => {
    const { results, errors } = tryResolveCast(seedId);
    if (errors.length) {
      pass = false;
      errors.forEach((e) => s.log('seed=' + seedId + ' character=' + e.characterId + ' ' + e.code + ' ' + JSON.stringify(e.detail)));
    }
    CHAR_IDS.forEach((id) => {
      count++;
      const r = results[id];
      if (r && ['PLACED', 'OFFSCREEN', 'TERMINAL_REMOVED'].indexOf(r.status) === -1) {
        pass = false;
        s.log('seed=' + seedId + ' character=' + id + ' bad status ' + r.status);
      }
    });
  });
  s.finish(pass, count);
})();

/* ---------------------------------------------------------------------- */
/* V2 — zero overlaps                                                     */
/* ---------------------------------------------------------------------- */
(function V2() {
  const s = section('V2 zero-overlaps');
  let pass = true, count = 0;
  SEED_IDS.forEach((seedId) => {
    const state = stateFromSeed(PINS.seeds[seedId]);
    CHAR_IDS.forEach((charId) => {
      count++;
      const owning = CAST.windows.filter((w) => w.cast && Object.prototype.hasOwnProperty.call(w.cast, charId)
        && NR.evalCond(state, w.when, null));
      if (owning.length > 1) {
        pass = false;
        s.log('character=' + charId + ' seed=' + seedId + ' windows=' + owning.map((w) => w.id).join(',')
          + ' placements=' + owning.map((w) => JSON.stringify(w.cast[charId])).join(' | '));
      }
    });
  });
  s.finish(pass, count);
  /* Static, informational only: coppie di finestre che condividono un personaggio,
   * con flag se sono co-vere su QUALCHE seed (nota, non fallisce la build). */
  console.log('  -- V2 static: window pairs sharing a character (co-true table, informational) --');
  const byChar = {};
  CAST.windows.forEach((w) => {
    Object.keys(w.cast || {}).forEach((c) => { (byChar[c] = byChar[c] || []).push(w); });
  });
  Object.keys(byChar).forEach((c) => {
    const ws = byChar[c];
    for (let i = 0; i < ws.length; i++) {
      for (let j = i + 1; j < ws.length; j++) {
        const coTrue = SEED_IDS.some((seedId) => {
          const state = stateFromSeed(PINS.seeds[seedId]);
          return NR.evalCond(state, ws[i].when, null) && NR.evalCond(state, ws[j].when, null);
        });
        console.log('    character=' + c + ' ' + ws[i].id + ' & ' + ws[j].id + ' co-true-on-some-seed=' + coTrue);
      }
    }
  });
})();

/* ---------------------------------------------------------------------- */
/* V3 — no implicit absence                                               */
/* ---------------------------------------------------------------------- */
(function V3() {
  const s = section('V3 no-implicit-absence');
  let pass = true, count = 0;
  SEED_IDS.forEach((seedId) => {
    const state = stateFromSeed(PINS.seeds[seedId]);
    CHAR_IDS.forEach((charId) => {
      count++;
      try { CP.resolveCharacterPresence(charId, state); }
      catch (e) {
        if (e.code === 'NO_PLACEMENT') { pass = false; s.log('seed=' + seedId + ' character=' + charId + ' NO_PLACEMENT'); }
        /* altri codici (OVERLAP) sono di competenza di V1/V2, non ripetiamo qui */
      }
    });
  });
  const noBaseline = CHAR_IDS.filter((id) => !CAST.characters[id].baseline);
  s.log('static: characters without baseline = [' + noBaseline.join(', ') + '] (spec expects only [jacques])');
  if (noBaseline.length !== 1 || noBaseline[0] !== 'jacques') {
    s.log('NOTE: attuale dataset diverge dall\'attesa di spec — jacques HA un baseline TERMINAL_REMOVED; '
      + 'l\'invariante "risolvono su ogni seed" resta rispettato (verificato sopra). Non trattato come FAIL hard: riportare al lead.');
  }
  s.finish(pass, count);
})();

/* ---------------------------------------------------------------------- */
/* V4 — order independence                                                */
/* ---------------------------------------------------------------------- */
(function V4() {
  const s = section('V4 order-independence');
  let pass = true, count = 0;
  SEED_IDS.forEach((seedId) => {
    const state = stateFromSeed(PINS.seeds[seedId]);
    const reference = JSON.stringify(CP.snapshot(state));
    for (let seed = 1; seed <= 5; seed++) {
      const rngA = lcg(seed), rngB = lcg(seed * 1000 + 7), rngC1 = lcg(seed), rngC2 = lcg(seed * 1000 + 7);
      const variants = {
        a_windows: { characters: CAST.characters, windows: shuffled(CAST.windows, rngA) },
        b_characters: { characters: shuffledObjectKeys(CAST.characters, rngB), windows: CAST.windows },
        c_both: { characters: shuffledObjectKeys(CAST.characters, rngC2), windows: shuffled(CAST.windows, rngC1) }
      };
      Object.keys(variants).forEach((variantName) => {
        count++;
        const got = JSON.stringify(CP.snapshot(state, { data: variants[variantName] }));
        if (got !== reference) {
          pass = false;
          s.log('seed=' + seedId + ' shuffle=' + seed + ' variant=' + variantName + ' MISMATCH');
        }
      });
    }
  });
  s.finish(pass, count);
  console.log('  RC8 order independence (Act 3 chain): ' + (['ACT3_BRIDGE', 'ACT3_TRAINCAR_REPORT', 'ACT3_NORTH_CUT', 'ACT3_OEJ', 'ACT3_OEJ_AUDREY_SEEN', 'ACT3_OEJ_NO_AUDREY', 'ACT3_AFTER_ARREST', 'ACT3_GUARDED_HOSPITAL', 'ACT3_NIGHT_STATION'].every((id) => SEED_IDS.indexOf(id) !== -1) && pass ? 'PASS' : 'FAIL'));
  REPORT.push('RC8 order independence (Act 3 chain): ' + (pass ? 'PASS' : 'FAIL'));
})();

/* ---------------------------------------------------------------------- */
/* V5 — world window pins (+ RC1, RC5 sotto V5b)                          */
/* ---------------------------------------------------------------------- */
(function V5() {
  const s = section('V5 world-window-pins');
  let pass = true, count = 0;
  PINS.pins.forEach((pin) => {
    count++;
    CHAR_IDS.forEach((id) => {
      if (!Object.prototype.hasOwnProperty.call(pin.expect, id)) {
        pass = false;
        s.log('pin incomplete: ' + pin.id + ' missing character ' + id);
      }
    });
    Object.keys(pin.expect).forEach((k) => {
      if (CHAR_IDS.indexOf(k) === -1) {
        pass = false;
        s.log('pin ' + pin.id + ' has unknown expect key: ' + k);
      }
    });
    const mismatches = checkV5PinMismatches(pin.seed);
    if (mismatches.length) {
      pass = false;
      mismatches.forEach((m) => s.log('pin ' + pin.id + ' character=' + m.character + ' expected=' + m.expected + ' got=' + m.got));
    }
  });
  s.finish(pass, count);
})();

/* ---------------------------------------------------------------------- */
/* V5b — scene-required presence (+ RC1, RC5)                             */
/* ---------------------------------------------------------------------- */
/* Allowlist V5b, ESPLICITA e stampata: un debito dati noto e ACCETTATO dal lead
 * (docs implementation report §16). SOLO questa voce: m6_audrey (M6) manca `not
 * flag jacques_preso` nelle sue conditions, quindi resta "live" per prepareNode
 * anche dopo l'arresto, quando la finestra di Audrey è già chiusa (residuo R1 —
 * Audrey si allontana perché "il corpo" di quella scena non c'è più, non perché
 * un evento la sposti esplicitamente). Un nodo live in questa lista è riportato
 * come "V5b allowed (R1)" invece di fallire; nessun'altra voce è ammessa. */
const V5B_ALLOWLIST = [
  { node: 'm6_audrey', when: (state) => !!state.flags.jacques_preso, residual: 'R1', reason: 'M6 node relies on the absent body; data debt recorded in the implementation report §16' }
];
function v5bAllowlisted(nodeId, state) {
  return V5B_ALLOWLIST.find((a) => a.node === nodeId && a.when(state)) || null;
}

(function V5b() {
  const s = section('V5b scene-required-presence');
  let pass = true, count = 0;
  MISSIONS.forEach((mission) => {
    (mission.nodes || []).forEach((node) => {
      if (node.target_kind !== 'actor' || !node.actor_id || !node.map_id) return;
      const character = actorToCharacter(node.actor_id);
      if (CHAR_IDS.indexOf(character) === -1) {
        s.log('unmapped actor: ' + node.actor_id + ' (node ' + node.id + ')');
        return;
      }
      let erroredOnce = false;
      const liveSeeds = [];
      SEED_IDS.forEach((seedId) => {
        const state = stateFromSeed(PINS.seeds[seedId]);
        let active;
        try {
          const currentMission = A.currentMissionFor(state);
          const isCurrentMission = !!currentMission && currentMission.mission === mission.mission;
          const prep = isCurrentMission ? NR.prepareNode(state, mission, node.id) : null;
          active = isCurrentMission && !!(prep || {}).ok;
        } catch (e) {
          active = false;
          if (!erroredOnce) { erroredOnce = true; s.log('node=' + node.id + ' prepareNode/currentMissionFor threw: ' + (e && e.message || e)); }
        }
        if (!active) return;
        liveSeeds.push(seedId);
        count++;
        let result;
        try { result = CP.resolveCharacterPresence(character, state); }
        catch (e) { pass = false; s.log('node=' + node.id + ' seed=' + seedId + ' character=' + character + ' THROW ' + e.code); return; }
        if (result.status !== 'PLACED' || result.sceneId !== node.map_id) {
          const allowed = v5bAllowlisted(node.id, state);
          if (allowed) {
            s.log('V5b allowed (' + allowed.residual + '): ' + node.id + ' on ' + seedId + ' — ' + allowed.reason);
          } else {
            pass = false;
            s.log('node=' + node.id + ' seed=' + seedId + ' character=' + character + ' expected PLACED@' + node.map_id + ' got ' + describe(result));
          }
        }
      });
      s.log('node=' + node.id + ' (' + character + '@' + node.map_id + ') live on seeds: [' + liveSeeds.join(', ') + ']');
    });
  });
  /* RC1 */
  ['ACT3_OEJ', 'ACT3_OEJ_AUDREY_SEEN', 'ACT3_OEJ_NO_AUDREY'].forEach((seedId) => {
    const r = resolveCast(seedId).hawk;
    if (!(r.status === 'PLACED' && r.sceneId === 'oej')) {
      pass = false;
      s.log('RC1: hawk not PLACED@oej on ' + seedId + ' got ' + describe(r));
    }
  });
  /* RC5 */
  {
    const r = resolveCast('ACT3_OEJ').truman;
    if (!(r.status === 'PLACED' && r.sceneId === 'traincar')) {
      pass = false;
      s.log('RC5: truman not PLACED@traincar on ACT3_OEJ got ' + describe(r));
    }
  }
  s.finish(pass, count);
})();

/* ---------------------------------------------------------------------- */
/* V6 — causal transitions                                                */
/* ---------------------------------------------------------------------- */
(function V6() {
  const s = section('V6 causal-transitions');
  let pass = true, count = 0;
  TRANS.transitions.forEach((rec) => {
    count++;
    const before = resolveCast(rec.before)[rec.character];
    const after = resolveCast(rec.after)[rec.character];
    if (!matches(before, rec.from)) { pass = false; s.log(rec.id + ' character=' + rec.character + ' before expected=' + rec.from + ' got=' + describe(before)); }
    if (!matches(after, rec.to)) { pass = false; s.log(rec.id + ' character=' + rec.character + ' after expected=' + rec.to + ' got=' + describe(after)); }
  });
  s.finish(pass, count);
})();

/* ---------------------------------------------------------------------- */
/* V6b — no silent vanish / entry (+ B1/RC7, roadhouse exit rule/RC2)      */
/* ---------------------------------------------------------------------- */
function evaluateV6bRecord(record, opts) {
  opts = opts || {};
  const windowsList = opts.windows || CAST.windows;
  const missionsList = opts.missions || MISSIONS;
  const before = resolveCast(record.before, windowsList)[record.character];
  const after = resolveCast(record.after, windowsList)[record.character];
  if (!matches(before, record.from) || !matches(after, record.to)) {
    return { applicable: false, ok: false, reason: 'before/after mismatch (before=' + describe(before) + ' after=' + describe(after) + ')' };
  }
  if (before.status !== 'PLACED' || before.sceneId !== record.event_map) {
    return { applicable: false, ok: true };
  }
  const beforeWin = findWindow(windowsList, before.source);
  const afterWin = findWindow(windowsList, after.source);
  if (record.authored_by) {
    const okExit = !!(beforeWin && beforeWin.exit_authored_by && beforeWin.exit_authored_by[record.character] === record.authored_by);
    const okEntry = !!(afterWin && afterWin.entry_authored_by && afterWin.entry_authored_by[record.character] === record.authored_by);
    if (!okExit && !okEntry) return { applicable: true, ok: false, reason: 'no window carries authored_by=' + record.authored_by + ' for ' + record.character };
    if (record.authored_by.indexOf('classic:') === 0) {
      /* forma "classic:<dialogueId>": nessuna pagina M5/M6/M8, il "testimone" è un
       * dialogo classico. Verifica: il dialogo esiste e il suo setFlag combacia con
       * UN flag positivo (mai sotto `not`) nel `when` della finestra che lo porta. */
      const dialogueId = record.authored_by.slice('classic:'.length);
      const dlg = GAME.Data && GAME.Data.dialogues && GAME.Data.dialogues[dialogueId];
      if (!dlg) return { applicable: true, ok: false, reason: 'classic dialogue not found: ' + dialogueId };
      const carrierWindow = okExit ? beforeWin : afterWin;
      const flags = collectPositiveFlags(carrierWindow.when, []);
      if (flags.indexOf(dlg.setFlag) === -1) {
        return { applicable: true, ok: false, reason: 'classic dialogue ' + dialogueId + ' setFlag=' + dlg.setFlag + ' does not match any positive flag in ' + carrierWindow.id + '.when (' + flags.join(',') + ')' };
      }
      return { applicable: true, ok: true };
    }
    const node = findNodeWithPage(missionsList, record.authored_by, record.event_map);
    if (!node) return { applicable: true, ok: false, reason: 'authored_by page ' + record.authored_by + ' not found in a node on map ' + record.event_map };
    return { applicable: true, ok: true };
  }
  if (record.residual) {
    if (['R1', 'R2'].indexOf(record.residual) === -1) return { applicable: true, ok: false, reason: 'residual not R1/R2: ' + record.residual };
    const okResidual = !!(beforeWin && beforeWin.exit_residual && beforeWin.exit_residual[record.character] === record.residual);
    if (!okResidual) return { applicable: true, ok: false, reason: 'no exit_residual=' + record.residual + ' on before window ' + (beforeWin ? beforeWin.id : before.source) };
    return { applicable: true, ok: true };
  }
  return { applicable: true, ok: false, reason: 'from PLACED on event_map but no authored_by/residual (silent vanish/entry)' };
}

(function V6b() {
  const s = section('V6b no-silent-vanish-entry');
  let pass = true, count = 0;
  TRANS.transitions.forEach((rec) => {
    count++;
    const res = evaluateV6bRecord(rec);
    if (res.applicable && !res.ok) { pass = false; s.log(rec.id + ' character=' + rec.character + ': ' + res.reason); }
    if (!res.applicable && !res.ok) { pass = false; s.log(rec.id + ' character=' + rec.character + ' (base mismatch): ' + res.reason); }
  });

  /* ---- B1 regression (RC7) ---- */
  /* 1. seeds -> presence */
  const g1 = ['norma', 'shelly', 'loglady', 'james'];
  g1.forEach((c) => {
    const r = resolveCast('ACT4_PROMISE_MADE')[c];
    if (!matches(r, 'diner')) { pass = false; s.log('RC7.1: ' + c + ' expected diner on ACT4_PROMISE_MADE got ' + describe(r)); }
  });
  g1.forEach((c) => {
    const r = resolveCast('ACT4_EVENING_GATHERING')[c];
    if (!matches(r, 'roadhouse')) { pass = false; s.log('RC7.1: ' + c + ' expected roadhouse on ACT4_EVENING_GATHERING got ' + describe(r)); }
  });
  /* 2. window entry_authored_by */
  {
    const w = CAST.windows.find((x) => x.id === 'ACT4_EVENING_GATHERING');
    const ok = w && w.entry_authored_by && g1.every((c) => w.entry_authored_by[c] === 'm8.b0.leland_taxi.chiusura.p01');
    if (!ok) { pass = false; s.log('RC7.2: ACT4_EVENING_GATHERING.entry_authored_by missing/mismatched for ' + g1.join(',')); }
  }
  /* 3. node m8_leland_taxi shape */
  {
    const node = (D.missions.M8.nodes || []).find((n) => n.id === 'm8_leland_taxi');
    if (!node || node.map_id !== 'diner') { pass = false; s.log('RC7.3: node m8_leland_taxi missing or map_id != diner'); }
    else {
      const idx = node.pages.findIndex((p) => p.id === 'm8.b0.leland_taxi.chiusura.p01');
      const page = node.pages[idx];
      if (idx === -1 || page.mode !== 'action'
        || page.text !== "(Norma gira il cartello sulla porta e spegne l'insegna. Sedie sui tavoli, cappotti dagli attaccapanni: il Double R chiude alle sei, stasera si va al Roadhouse.)") {
        pass = false; s.log('RC7.3: chiusura.p01 missing/mode/text mismatch');
      } else {
        const beforeDialoguesOk = node.pages.slice(0, idx).every((p) => p.mode !== 'notebook');
        const next = node.pages[idx + 1];
        if (!beforeDialoguesOk || !next || next.id !== 'm8.b0.leland_taxi.p02' || next.mode !== 'notebook') {
          pass = false; s.log('RC7.3: chiusura.p01 not positioned right after dialogue and immediately before notebook p02');
        }
      }
    }
  }
  /* 4. Negative fixtures — the validator must bite */
  (function negatives() {
    const rec = TRANS.transitions.find((r) => r.id === 'C10b.norma');
    /* (a) page removed from node copy */
    {
      const m8 = deepClone(D.missions.M8);
      const node = m8.nodes.find((n) => n.id === 'm8_leland_taxi');
      node.pages = node.pages.filter((p) => p.id !== 'm8.b0.leland_taxi.chiusura.p01');
      const res = evaluateV6bRecord(rec, { missions: [D.missions.M5, D.missions.M6, m8] });
      const bites = res.applicable && !res.ok;
      s.log('RC7 negative (a) page removed: validator bites = ' + bites);
      if (!bites) pass = false;
    }
    /* (b) entry_authored_by deleted from window copy */
    {
      const windows = CAST.windows.map((w) => (w.id === 'ACT4_EVENING_GATHERING' ? deepClone(w) : w));
      const w = windows.find((x) => x.id === 'ACT4_EVENING_GATHERING');
      delete w.entry_authored_by;
      const res = evaluateV6bRecord(rec, { windows });
      const bites = res.applicable && !res.ok;
      s.log('RC7 negative (b) entry_authored_by deleted: validator bites = ' + bites);
      if (!bites) pass = false;
    }
    /* (c) page moved into a copy of a node with map_id 'roadhouse' */
    {
      const m8 = deepClone(D.missions.M8);
      const node = m8.nodes.find((n) => n.id === 'm8_leland_taxi');
      const page = node.pages.find((p) => p.id === 'm8.b0.leland_taxi.chiusura.p01');
      node.pages = node.pages.filter((p) => p.id !== 'm8.b0.leland_taxi.chiusura.p01');
      const roadhouseNode = m8.nodes.find((n) => n.map_id === 'roadhouse');
      if (roadhouseNode) roadhouseNode.pages = (roadhouseNode.pages || []).concat([page]);
      const res = evaluateV6bRecord(rec, { missions: [D.missions.M5, D.missions.M6, m8] });
      const bites = res.applicable && !res.ok;
      s.log('RC7 negative (c) page moved to roadhouse-map node: validator bites = ' + bites);
      if (!bites) pass = false;
    }
    /* (d) gathering window `when` changed so the four move at promise_stance */
    {
      const windows = CAST.windows.map((w) => (w.id === 'ACT4_EVENING_GATHERING' ? deepClone(w) : w));
      const w = windows.find((x) => x.id === 'ACT4_EVENING_GATHERING');
      w.when = { value_set: 'promise_stance' };
      const mismatches = checkV5PinMismatches('ACT4_PROMISE_MADE', windows);
      const bites = mismatches.length > 0;
      s.log('RC7 negative (d) gathering window when->promise_stance: V5(ACT4_PROMISE_MADE) bites = ' + bites
        + (bites ? ' [' + mismatches.map((m) => m.character + ':' + m.expected + '/' + m.got).join(', ') + ']' : ''));
      if (!bites) pass = false;
    }
    /* (e) classic authored_by with wrong setFlag: C2.1 copy pointing at classic:truman_wait3
     * (that dialogue has no setFlag at all, so it cannot match ACT3_HAWK_BRIDGE.when's atto3);
     * the window copy is patched to carry the same page id so the check actually reaches
     * the setFlag-derivation step, not just the "no window carries" earlier guard. */
    {
      const c21 = TRANS.transitions.find((r) => r.id === 'C2.1');
      const mutated = Object.assign({}, c21, { authored_by: 'classic:truman_wait3' });
      const windows = CAST.windows.map((w) => (w.id === 'ACT3_HAWK_BRIDGE' ? deepClone(w) : w));
      const w = windows.find((x) => x.id === 'ACT3_HAWK_BRIDGE');
      w.entry_authored_by.hawk = 'classic:truman_wait3';
      const res = evaluateV6bRecord(mutated, { windows });
      const bites = res.applicable && !res.ok;
      s.log('RC7 negative (e) C2.1 classic:truman_wait3 (wrong setFlag): validator bites = ' + bites
        + (bites ? ' [' + res.reason + ']' : ''));
      if (!bites) pass = false;
    }
  })();

  /* 5. Roadhouse exit rule (RC2) */
  {
    const targets = ['ACT4_POST_PHONE_INSIDE_PALMER', 'ACT4_POST_PHONE_INSIDE_CENTRALE', 'ACT4_POST_PHONE_INSIDE_NESSUNO'];
    targets.forEach((seedId) => {
      const all = resolveCast(seedId);
      const truman = all.truman, giant = all.giant;
      ['norma', 'shelly', 'loglady', 'james', 'bobby', 'donna'].forEach((c) => {
        if (!matches(all[c], 'roadhouse')) { pass = false; s.log('RC2: ' + c + ' expected roadhouse on ' + seedId + ' got ' + describe(all[c])); }
      });
      if (!matches(truman, 'roadhouse')) { pass = false; s.log('RC2: truman expected roadhouse on ' + seedId + ' got ' + describe(truman)); }
      if (!matches(giant, 'OFFSCREEN')) { pass = false; s.log('RC2: giant expected OFFSCREEN on ' + seedId + ' got ' + describe(giant)); }
    });
    /* negative */
    const windows = CAST.windows.map((w) => (w.id === 'ACT4_EVENING_GATHERING' ? deepClone(w) : w));
    const w = windows.find((x) => x.id === 'ACT4_EVENING_GATHERING');
    w.when = { not: { value_set: 'warning_target' } };
    let anyBite = false;
    targets.forEach((seedId) => {
      const mismatches = checkV5PinMismatches(seedId, windows);
      if (mismatches.length) anyBite = true;
    });
    s.log('RC2 negative (when-> not value_set warning_target): validator bites = ' + anyBite);
    if (!anyBite) pass = false;
  }

  s.finish(pass, count);
})();

/* ---------------------------------------------------------------------- */
/* V7 — single body owner (EXPECTED TO FAIL until Phase 10)               */
/* ---------------------------------------------------------------------- */
(function V7() {
  const s = section('V7 single-body-owner');
  let pass = true, count = 0, dupes = 0;
  const A = GAME.NarrativeAdapter;
  const NARRATIVE_ENTITIES = (A && A._debugNarrativeEntities) || [];
  NARRATIVE_ENTITIES.forEach((entry) => {
    count++;
    const character = actorToCharacter(entry.npc.id);
    if (CHAR_IDS.indexOf(character) !== -1) {
      dupes++; pass = false;
      s.log('V7 duplicate owner: ' + character + ' adapter@' + entry.map_id + ':' + entry.npc.id);
    }
  });
  Object.keys(CLASSIC_NPCS_SNAPSHOT).forEach((mapId) => {
    CLASSIC_NPCS_SNAPSHOT[mapId].forEach((npc) => {
      count++;
      const character = actorToCharacter(npc.id);
      if (CHAR_IDS.indexOf(character) !== -1) {
        dupes++; pass = false;
        s.log('V7 duplicate owner: ' + character + ' classic@' + mapId);
      }
    });
  });
  s.log('total duplicate owners found: ' + dupes + ' (EXPECTED > 0 until Phase 10 removes classic/adapter owners)');
  s.finish(pass, count);
})();

/* ---------------------------------------------------------------------- */
/* V8 — save determinism                                                  */
/* ---------------------------------------------------------------------- */
(function V8() {
  const s = section('V8 save-determinism');
  let pass = true, count = 0;
  const FORBIDDEN_KEYS = ['presence', 'cast', 'positions', 'npcs'];
  function walkForbidden(obj, path_) {
    if (obj == null || typeof obj !== 'object') return;
    Object.keys(obj).forEach((k) => {
      if (FORBIDDEN_KEYS.indexOf(k) !== -1) { pass = false; s.log('serialized state contains forbidden key "' + k + '" at ' + path_ + '.' + k); }
      walkForbidden(obj[k], path_ + '.' + k);
    });
  }
  SEED_IDS.forEach((seedId) => {
    count++;
    const state = stateFromSeed(PINS.seeds[seedId]);
    const snapA = CP.snapshot(state);
    const serialized = NR.serialize ? NR.serialize(state) : JSON.stringify(state);
    const round = JSON.parse(typeof serialized === 'string' ? serialized : JSON.stringify(serialized));
    const snapB = CP.snapshot(round);
    if (JSON.stringify(snapA) !== JSON.stringify(snapB)) {
      pass = false;
      s.log('seed=' + seedId + ' snapshot mismatch after serialize/round-trip');
    }
    walkForbidden(JSON.parse(typeof serialized === 'string' ? serialized : JSON.stringify(serialized)), 'state');
  });
  s.finish(pass, count);
})();

/* ---------------------------------------------------------------------- */
/* Terminal lint (Phase 9)                                                */
/* ---------------------------------------------------------------------- */
(function terminalLint() {
  const s = section('terminal lint');
  let pass = true, count = 0;
  const ALLOWED = ['jacques_dead', 'maddy_trovata', 'leland_morto'];
  CHAR_IDS.forEach((id) => {
    const b = CAST.characters[id].baseline;
    if (b && b.status === 'TERMINAL_REMOVED') {
      count++;
      if (ALLOWED.indexOf(b.event) === -1) { pass = false; s.log('baseline ' + id + ' TERMINAL_REMOVED event not allowed: ' + b.event); }
    }
  });
  CAST.windows.forEach((w) => {
    Object.keys(w.cast || {}).forEach((c) => {
      const pl = w.cast[c];
      if (pl.status === 'TERMINAL_REMOVED') {
        count++;
        if (ALLOWED.indexOf(pl.event) === -1) { pass = false; s.log('window ' + w.id + ' character=' + c + ' TERMINAL_REMOVED event not allowed: ' + pl.event); }
        else if (!containsPositiveFlag(w.when, pl.event)) { pass = false; s.log('window ' + w.id + ' character=' + c + ' when does not positively contain {flag: ' + pl.event + '}'); }
      }
    });
  });
  s.finish(pass, count);
})();

/* ---------------------------------------------------------------------- */
/* Summary                                                                */
/* ---------------------------------------------------------------------- */
const summaryParts = REPORT.filter((l) => /^[A-Za-z0-9].* (PASS|FAIL)/.test(l) || /^RC\d/.test(l));
const summary = 'cast-continuity-validate: ' + summaryParts.map((l) => l.split(':')[0].trim() + ' ' + (l.match(/PASS|FAIL/) || [''])[0]).join(' · ');
console.log('\n' + summary);
REPORT.push('');
REPORT.push(summary);

const reportFlagIdx = process.argv.indexOf('--report');
if (reportFlagIdx !== -1 && process.argv[reportFlagIdx + 1]) {
  const outPath = path.resolve(process.cwd(), process.argv[reportFlagIdx + 1]);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, '# cast-continuity-validate report\n\n```\n' + REPORT.join('\n') + '\n```\n');
  console.log('report written to ' + outPath);
}

process.exit(FAILED.length ? 1 : 0);
