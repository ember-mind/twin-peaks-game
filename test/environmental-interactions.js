/* environmental-interactions.js — copertura fisica del fallback su Invio.
 * Esegui con: node test/environmental-interactions.js
 */
'use strict';
const assert = require('assert');
const path = require('path');

let tnow = 0;
const rafQueue = [];
const handlers = {};
global.window = global;
global.addEventListener = (type, fn) => { handlers[type] = fn; };
global.requestAnimationFrame = (cb) => { rafQueue.push(cb); };
global.performance = { now: () => tnow };
let saveWrites = 0;
Object.defineProperty(global, 'localStorage', {
  configurable: true,
  value: {
    getItem() { return null; },
    setItem() { saveWrites++; },
    removeItem() {}
  }
});

const ctxStub = new Proxy(
  { measureText: (s) => ({ width: String(s).length * 5 }) },
  { get(t, k) { return k in t ? t[k] : () => {}; }, set() { return true; } }
);
const canvasStub = { getContext: () => ctxStub };
const J = (f) => path.join(__dirname, '..', 'js', f);
require(J('tiles.js'));
require(J('chars.js'));
require(J('houses.js'));
require(J('maps.js'));
require(J('data.js'));
require(J('environmental-inspect.js'));
require(J('retro-font.js'));
require(J('engine.js'));
require(J('glue.js'));

const GAME = global.GAME;
const E = GAME.Engine;
const ENV = GAME.EnvironmentalInspect;
const RF = GAME.RetroFont;
const REQUIRED = ['T', 'S', 'w', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'i', 'C', 't', 'h', 'K', 'U', 'Y', 'R', 'M', 'v', 'G', 'L', 'P', 'B', 'F', 'A', 'H', 'E', 'n', 'q', 'V', 'J'];
const TARGET_TERMS = {
  T: /alber|chiom|agh|tronch/i, S: /cartell|pali|asse|letter|Benvenuti|Glastonbury|One Eyed|ponticell/i, w: /acqua|riva|rifless/i,
  '0': /bottega|insegna|vetrina|casa/i, '1': /distrett|ardesia|matton/i, '2': /Double R|tendalin|matton/i, '3': /casa|scandol|assito|Palmer/i,
  '4': /Great Northern|albergo|tronch|portic/i, '5': /ospedal|croce|stucco/i, '6': /Roadhouse|insegna|tavole/i,
  '7': /Bookhouse|vetro|finestr/i, '8': /Loggia|facciata|mattoni viola/i,
  '9': /Horne|vetrin|merce|magazzin/i,
  i: /paret|muro|pannell|cornic|vagone/i, C: /banc|scrivani|reception|modul|palco/i,
  t: /tavol/i, h: /sedi|sedut|schienal/i, K: /lett|materass|cuscino|coperta|Ronette/i, U: /comò|cassett/i,
  Y: /sicomor|chiom|corteccia/i, R: /tend|vellut|pieg/i, M: /statu|figura|base/i, v: /nero|vuoto/i,
  G: /lapid|pietra|tomba|nome|Laura/i, L: /lamp|lanterna|vetro/i, P: /palo|isolator|traversa/i,
  B: /panchin|sedile|schienal/i, F: /pali|staccion|ringhier|montant/i, A: /fior|aiuol|cordolo/i,
  H: /idrant|bocchett|calotta/i, E: /cassett|bandierina|messaggio/i, n: /cespugl|chioma|foglie/i,
  q: /cassa|tavole|coperchio/i, V: /auto|parabrezza|cofano/i, J: /cabina|finestra|tetto|legno/i
};
const DELTAS = [
  { dx: 0, dy: -1, dir: 'down' },
  { dx: 0, dy: 1, dir: 'up' },
  { dx: -1, dy: 0, dir: 'right' },
  { dx: 1, dy: 0, dir: 'left' }
];
let passed = 0;
function ok(value, label) {
  assert(value, label);
  passed++;
  console.log('  ok - ' + label);
}
function key(code) {
  handlers.keydown({ code, preventDefault() {}, repeat: false });
  handlers.keyup({ code });
}
function dialogueSnapshot() {
  return JSON.stringify({ clues: E.state.clues, flags: E.state.flags });
}

console.log('# registro');
for (const tile of REQUIRED) ok(ENV.archetypes[tile], `archetipo solido "${tile}" registrato`);
for (const tile of REQUIRED) {
  const archetypeDef = GAME.Data.dialogues[ENV.archetypes[tile].id];
  assert(TARGET_TERMS[tile].test(archetypeDef.pages[0].text),
    `${archetypeDef.pages[0].text}: archetipo intercambiabile, manca lessico target "${tile}"`);
}
ok(ENV.resolve('town', 6, 2, { flags: {} }) === null, 'terreno passabile resta muto');
ok(ENV.resolve('town', -1, 2, { flags: {} }) === null, 'spazio fuori mappa resta muto');
ok(ENV.resolve('town', 50, 0, { flags: {} }) === null, 'transenna dinamica non usa fallback ambientale');

const environmentalDefs = Object.entries(GAME.Data.dialogues).filter(([, def]) => def.environmental);
const texts = [];
const UNGROUNDED = /\b(qualcuno|persona|persone|visitat\w*|cliente|ospite|mazziere|recente\w*|appena|ieri|settimana|giorni|ore|minuti|prima|dopo|voleva|preferisce|premura|cura|curat\w*|progettat\w*|costruit\w*|pensat\w*|volut\w*|sceglie|scelt\w*|privilegia|organizz\w*|destinat\w*|intenzion\w*|fuga|fretta|manca\w*|assente\w*|tolto|rimoss\w*|spostat\w*|aperto|richius\w*|scavat\w*|attraversat\w*|impront\w*|tracc\w*|indizio|prova|fuliggine|cinghi\w*|segatura fresca|terra smossa|polvere)\b/i;
const CURATED_IDS = new Set([
  'env_interior_wall', 'env_counter', 'env_table', 'env_sycamore', 'env_streetlamp',
  'env_telephone_pole', 'env_hydrant', 'env_bush', 'env_town_service_crate', 'env_woods_crate',
  'env_sheriff_wall', 'env_hotel_wall', 'env_diner_wall', 'env_traincar_wall', 'env_oej_wall',
  'env_roadhouse_wall', 'env_sheriff_desk', 'env_hotel_counter', 'env_diner_counter', 'env_oej_counter',
  'env_roadhouse_counter', 'env_sheriff_table', 'env_diner_table', 'env_oej_gaming_table',
  'env_roadhouse_table', 'env_roadhouse_chair', 'env_hotel_bed', 'env_hotel_dresser',
  'env_roadhouse_stage', 'env_mixed_use_shop'
]);
const MAXIM_TIC = /;\s*(?:una?|ogni|presenza|visibilità|sapere|l['’]ordine)\b|\bnon (?:significa|equivale|stabilisce|prova)\b/i;
const knownFlags = new Set(Object.values(GAME.Data.dialogues).map((def) => def.setFlag).filter(Boolean));
const knownClues = new Set(Object.keys(GAME.Data.clues));
let oneSentenceCount = 0;
let twoSentenceCount = 0;
for (const [id, def] of environmentalDefs) {
  assert.strictEqual(def.transient, true, `${id}: dialogo deve essere transitorio`);
  assert(!def.give && !def.setFlag && !def.end && !def.again, `${id}: effetti mutanti vietati`);
  assert.strictEqual(def.pages.length, 1, `${id}: una sola pagina`);
  const page = def.pages[0];
  const meta = def.environmentalMeta;
  assert(meta && meta.sourceClass && meta.scope && meta.scope.kind, `${id}: metadati source/scope mancanti`);
  if (meta.sourceClass === 'authored-canon') {
    assert(meta.canonDialogue && GAME.Data.dialogues[meta.canonDialogue], `${id}: fonte canonica non risolta`);
  } else if (meta.sourceClass === 'state-context') {
    assert((meta.scope.flag && knownFlags.has(meta.scope.flag)) || (meta.scope.clue && knownClues.has(meta.scope.clue)),
      `${id}: stato canonico non risolto`);
  } else {
    assert(!UNGROUNDED.test(page.text), `${id}: claim ambientale non fondato: ${page.text}`);
  }
  assert(!/\bDiane\b/i.test(page.text), `${id}: Diane vietata nel fallback ambientale`);
  assert.strictEqual(page.name, 'COOPER', `${id}: voce deve essere COOPER`);
  assert(page.text.length <= 129, `${id}: ${page.text.length} caratteri`);
  assert(page.text.length > 0, `${id}: testo vuoto`);
  const sentences = page.text.replace(/(\d)\.(\d)/g, '$1$2').split(/[.!?]+/).filter((part) => part.trim()).length;
  assert(sentences >= 1 && sentences <= 2, `${id}: richieste 1-2 frasi, trovate ${sentences}`);
  if (sentences === 1) oneSentenceCount++; else twoSentenceCount++;
  const lines = RF.wrapChars(page.text, 24);
  const renderedPages = Math.ceil(lines.length / 2);
  assert(renderedPages >= 1 && renderedPages <= 3, `${id}: ${renderedPages} pagine RetroFont, richieste 1-3`);
  const unsupported = [...new Set([...RF.clean(page.text)].filter((ch) => ch !== ' ' && !RF.FONT[ch]))];
  assert.deepStrictEqual(unsupported, [], `${id}: glifi RetroFont non supportati: ${unsupported.join(' ')}`);
  texts.push(page.text);
}
assert.strictEqual(new Set(texts).size, texts.length, 'testi ambientali duplicati');
const curated = [...CURATED_IDS].map((id) => {
  const def = GAME.Data.dialogues[id];
  assert(def && def.environmental, `${id}: bersaglio audit R19K mancante`);
  assert(!MAXIM_TIC.test(def.pages[0].text), `${id}: ricade nella formula osservazione; massima`);
  return { id, text: def.pages[0].text };
});
assert.strictEqual(curated.length, 30, 'audit R19K deve coprire esattamente 30 bersagli');

function countMatches(list, re) {
  return list.reduce((sum, text) => sum + (text.match(re) || []).length, 0);
}
const semicolonCount = countMatches(texts, /;/g);
const negationCount = countMatches(texts, /\b(?:non|né|senza)\b/gi);
const abstractCount = countMatches(texts, /\b(?:ipotesi|verità|storia|domanda|procedura|fatti)\b/gi);
assert(semicolonCount <= Math.ceil(environmentalDefs.length * 0.30),
  `tic del punto e virgola: ${semicolonCount}/${environmentalDefs.length}`);
assert(negationCount <= Math.ceil(environmentalDefs.length * 0.25),
  `negazioni troppo frequenti: ${negationCount}/${environmentalDefs.length}`);
assert(abstractCount <= Math.ceil(environmentalDefs.length * 0.08),
  `lessico astratto ripetuto: ${abstractCount}/${environmentalDefs.length}`);

const openings = new Map();
const grams = new Map();
for (const item of curated) {
  const normalized = item.text.toLowerCase()
    .replace(/one eyed jack['’]s/g, 'oneeyedjacks')
    .replace(/great northern/g, 'greatnorthern')
    .replace(/double r/g, 'doubler')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const words = normalized.match(/[a-z]+/g) || [];
  const opening = words.slice(0, 3).join(' ');
  openings.set(opening, (openings.get(opening) || 0) + 1);
  for (let i = 0; i <= words.length - 5; i++) {
    const gram = words.slice(i, i + 5).join(' ');
    if (!grams.has(gram)) grams.set(gram, new Set());
    grams.get(gram).add(item.id);
  }
}
assert(Math.max(...openings.values()) === 1, 'attacchi di frase ripetuti nel cluster R19K');
const repeatedGram = [...grams.entries()].find(([, owners]) => owners.size > 1);
assert(!repeatedGram, `fraseggio ripetuto fra bersagli: ${repeatedGram && repeatedGram[0]}`);

const curatedTwoSentence = curated.filter(({ text }) =>
  text.replace(/(\d)\.(\d)/g, '$1$2').split(/[.!?]+/).filter((part) => part.trim()).length === 2
).length;
assert(curatedTwoSentence >= 8 && curatedTwoSentence <= 22,
  `cadenza cluster uniforme: ${curatedTwoSentence}/30 righe a due frasi`);
assert(oneSentenceCount >= Math.ceil(environmentalDefs.length * 0.65),
  `cadenza troppo uniforme: solo ${oneSentenceCount}/${environmentalDefs.length} righe a frase singola`);
assert(twoSentenceCount >= 5, `cadenza senza variazione: solo ${twoSentenceCount} righe a due frasi`);
ok(true, `${environmentalDefs.length} dialoghi COOPER unici, <=129, senza effetti`);
ok(true, `cadenza variata: ${oneSentenceCount} righe a una frase, ${twoSentenceCount} a due`);
ok(true, `diversità R19K: ; ${semicolonCount}, negazioni ${negationCount}, astratti ${abstractCount}, cluster 2-frasi ${curatedTwoSentence}/30`);

console.log('# copertura fisica');
const faced = new Set();
const usage = {};
let faceableCount = 0;
let resolvedFaceableCount = 0;
function tileAt(mapId, x, y) {
  const map = GAME.maps.maps[mapId];
  return map && y >= 0 && x >= 0 && y < map.height && x < map.width ? map.rows[y][x] : '';
}
function scopeMatches(scope, mapId, x, y, state) {
  const tile = tileAt(mapId, x, y);
  if (scope.kind === 'tile') return tile === scope.tile;
  if (scope.kind === 'map-tile') return mapId === scope.mapId && tile === scope.tile;
  if (scope.kind === 'coord') return mapId === scope.mapId && x === scope.x && y === scope.y;
  if (scope.kind === 'region') {
    return mapId === scope.mapId && tile === scope.tile && x >= scope.x0 && x <= scope.x1 && y >= scope.y0 && y <= scope.y1;
  }
  if (scope.kind === 'coords') {
    return mapId === scope.mapId && tile === scope.tile && scope.keys.indexOf(x + ',' + y) >= 0;
  }
  if (scope.kind === 'state') {
    const flagMatch = scope.flag && state && state.flags && state.flags[scope.flag];
    const clueMatch = scope.clue && state && state.clues && state.clues.indexOf(scope.clue) >= 0;
    return mapId === scope.mapId && tile === scope.tile && !!(flagMatch || clueMatch);
  }
  return false;
}
for (const [mapId, map] of Object.entries(GAME.maps.maps)) {
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tile = map.rows[y][x];
      if (!GAME.maps.SOLID[tile]) continue;
      const faceable = DELTAS.some(({ dx, dy }) => {
        const px = x + dx, py = y + dy;
        return py >= 0 && px >= 0 && py < map.height && px < map.width &&
          !GAME.Maps.isSolid(mapId, px, py, { clues: [], flags: {} });
      });
      if (!faceable) continue;
      faceableCount++;
      faced.add(tile);
      const id = ENV.resolve(mapId, x, y, { clues: [], flags: {} });
      assert(id, `${mapId}@${x},${y} tile "${tile}" non risolta`);
      const def = GAME.Data.dialogues[id];
      assert(def, `${mapId}@${x},${y} dialogo "${id}" mancante`);
      assert(scopeMatches(def.environmentalMeta.scope, mapId, x, y, { flags: {} }),
        `${id}: scope non copre ${mapId}@${x},${y}`);
      assert(TARGET_TERMS[tile].test(def.pages[0].text),
        `${id}: testo intercambiabile per tile "${tile}" a ${mapId}@${x},${y}`);
      resolvedFaceableCount++;
      usage[id] = (usage[id] || 0) + 1;
    }
  }
}
for (const tile of REQUIRED.filter((ch) => ch !== 'v')) ok(faced.has(tile), `tile "${tile}" affrontabile coperta`);
ok(resolvedFaceableCount === faceableCount,
  `${resolvedFaceableCount}/${faceableCount} tile solide affrontabili risolte`);

const UNSAFE_SHARED_GEOMETRY = /\b(nord|sud|est|ovest|destra|sinistra|accanto|presso|davanti|dietro|verso|perimetro)\b/i;
for (const [id, count] of Object.entries(usage)) {
  const def = GAME.Data.dialogues[id], kind = def.environmentalMeta.scope.kind;
  if (count > 1 && (kind === 'tile' || kind === 'map-tile')) {
    assert(!UNSAFE_SHARED_GEOMETRY.test(def.pages[0].text), `${id}: geometria specifica riusata su ${count} coordinate`);
  }
}
ok(true, 'scope verificato su ogni coordinata; linee condivise prive di geometria non garantita');

const sycamore = (() => {
  const m = GAME.maps.maps.woods;
  for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) if (m.rows[y][x] === 'Y') return { x, y };
})();
const beforeDream = ENV.resolve('woods', sycamore.x, sycamore.y, { flags: {} });
const afterDream = ENV.resolve('woods', sycamore.x, sycamore.y, { flags: { sogno_fatto: true } });
ok(beforeDream !== afterDream && /after_dream/.test(afterDream), 'override di stato sceglie osservazione diversa');
ok(scopeMatches(GAME.Data.dialogues[afterDream].environmentalMeta.scope, 'woods', sycamore.x, sycamore.y,
   { flags: { sogno_fatto: true } }), 'scope override di stato verificato');
const afterLeland = ENV.resolve('town', 50, 22, { clues: [], flags: { leland_morto: true } });
ok(afterLeland === 'env_town_grave_after_leland' &&
   scopeMatches(GAME.Data.dialogues[afterLeland].environmentalMeta.scope, 'town', 50, 22,
     { clues: [], flags: { leland_morto: true } }), 'variante lapidi fondata su flag leland_morto');
const afterRing = ENV.resolve('traincar', 8, 3, { clues: ['anello'], flags: {} });
ok(afterRing === 'env_traincar_after_ring' &&
   scopeMatches(GAME.Data.dialogues[afterRing].environmentalMeta.scope, 'traincar', 8, 3,
     { clues: ['anello'], flags: {} }), 'variante vagone fondata su indizio anello');
const afterRonette = ENV.resolve('hospital', 1, 1, { clues: [], flags: { ronette_bob: true } });
ok(afterRonette === 'env_hospital_bed_after_ronette' &&
   scopeMatches(GAME.Data.dialogues[afterRonette].environmentalMeta.scope, 'hospital', 1, 1,
     { clues: [], flags: { ronette_bob: true } }), 'variante letti fondata su flag ronette_bob');
ok(ENV.resolve('town', 50, 22, { flags: {} }) === 'env_laura_grave', 'override per coordinata vince');
ok(ENV.resolve('sheriff', 0, 0, { flags: {} }) === 'env_sheriff_wall', 'override mappa+tile vince');
ok(ENV.resolve('town', 40, 4, { flags: {} }) === 'env_palmer_house' &&
   ENV.resolve('town', 33, 3, { flags: {} }) === 'env_horne_department_store',
   'casa Palmer e Horne\'s hanno archetipi distinti');
ok(ENV.resolve('roadhouse', 1, 1, { flags: {} }) === 'env_roadhouse_stage' &&
   ENV.resolve('roadhouse', 4, 5, { flags: {} }) === 'env_roadhouse_counter',
   'tile C distingue palco da bancone Roadhouse');

console.log('# Invio reale');
E.init(canvasStub);

function findFacing(mapId, tile) {
  const map = GAME.maps.maps[mapId];
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.rows[y][x] !== tile || GAME.Maps.objectAt(mapId, x, y)) continue;
      for (const d of DELTAS) {
        const px = x + d.dx, py = y + d.dy;
        if (py < 0 || px < 0 || py >= map.height || px >= map.width) continue;
        if (!GAME.Maps.isSolid(mapId, px, py, { clues: [], flags: {} }) && !GAME.Maps.doorAt(mapId, px, py)) {
          return { px, py, dir: d.dir, x, y };
        }
      }
    }
  }
  throw new Error(`nessuna posizione per ${mapId}:${tile}`);
}
function place(mapId, spot) {
  E.state.mode = 'title';
  E.loadMap(mapId, spot.px, spot.py, spot.dir);
  E.state.mode = 'play';
  E.state.dialogue = null;
}
function enterEnvironmental(mapId, tile) {
  const spot = findFacing(mapId, tile);
  place(mapId, spot);
  const before = dialogueSnapshot();
  const writesBefore = saveWrites;
  const expected = ENV.resolve(mapId, spot.x, spot.y, E.state);
  key('Enter');
  assert(E.state.dialogue, `${mapId}:${tile} non apre dialogo`);
  assert.strictEqual(E.state.dialogue.id, expected, `${mapId}:${tile} id errato`);
  key('Enter');
  assert.strictEqual(E.state.dialogue, null, `${mapId}:${tile} non chiude dialogo`);
  assert.strictEqual(dialogueSnapshot(), before, `${mapId}:${tile} ha mutato clues/flags`);
  assert.strictEqual(saveWrites, writesBefore, `${mapId}:${tile} ha scritto un salvataggio`);
  ok(true, `Invio ${mapId}:${tile} apre ${expected} senza mutare stato`);
}

enterEnvironmental('town', 'T');
enterEnvironmental('town', '0');
enterEnvironmental('town', '1');
enterEnvironmental('town', '9');
enterEnvironmental('town', 'B');
enterEnvironmental('diner', 't');
enterEnvironmental('redroom', 'R');

// Oggetto authored sulla stessa tile del fallback: l'authored deve vincere.
place('town', { px: 30, py: 31, dir: 'up' });
key('Enter');
ok(E.state.dialogue && E.state.dialogue.id === 'sign_town', 'oggetto esplicito precede fallback per coordinata');
E.state.dialogue = null;

// NPC davanti a una parete potenzialmente risolvibile altrove: NPC resta prima scelta.
place('sheriff', { px: 6, py: 3, dir: 'right' });
key('Enter');
ok(E.state.dialogue && E.state.dialogue.id === 'truman', 'NPC precede fallback ambientale');

console.log(`\n${passed} controlli ambientali superati.`);
