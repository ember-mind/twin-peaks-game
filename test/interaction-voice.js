'use strict';

const fs = require('fs');
const path = require('path');

/* Carica lo stesso grafo dati usato dal gioco. Nessun elenco di dialoghi
 * mantenuto a mano: i target classici sono gli NPC e gli oggetti normalizzati
 * da glue.js, cioe' quelli che engine.js puo' raggiungere con Enter. */
global.window = global;
global.addEventListener = function () {};
global.requestAnimationFrame = function () {};

const J = (file) => path.join(__dirname, '..', 'js', file);
[
  'tiles.js',
  'chars.js',
  'houses.js',
  'maps.js',
  'data.js',
  'retro-font.js',
  'engine.js',
  'scene-objects.gen.js', 'glue.js'
].forEach((file) => require(J(file)));
// NPC targets: every authored Cast Presence placement (baseline + windows), since b529711 emptied glue.js NPCS.
['narrative-runtime.js', 'narrative-data.gen.js'].forEach((f) => require(J(f)));
{
  const cast = global.GAME.NarrativeData.cast;
  const put = (id, p) => { if (p && p.status === 'PLACED' && p.dialogue) global.GAME.Maps[p.map_id].npcs.push({ id, dialogue: p.dialogue }); };
  Object.keys(cast.characters).forEach((id) => put(id, cast.characters[id].baseline));
  cast.windows.forEach((w) => Object.keys(w.cast).forEach((id) => put(id, w.cast[id])));
}

const GAME = global.GAME;
const failures = [];
let pageCount = 0;
let cooperCount = 0;

function fail(message) {
  failures.push(message);
  console.error('  not ok - ' + message);
}

function dialogueIds(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(dialogueIds);
  if (!value || typeof value !== 'object') return [];
  return [value.then, value.else].filter(Boolean).flatMap(dialogueIds);
}

function normalized(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/* Frasi fatte che potrebbero soddisfare presenza/lunghezza senza dare voce o
 * osservazione specifica. Il controllo lessicale resta intenzionalmente
 * conservativo: segnala solo battute interamente composte da parole-vuoto. */
const GENERIC_WORDS = new Set([
  'diane', 'interessante', 'interessanti', 'capisco', 'bene', 'andiamo',
  'avanti', 'continuiamo', 'continuare', 'indagine', 'indagare', 'attenzione',
  'scopriremo', 'vedremo', 'devo', 'dobbiamo', 'serve', 'altro', 'altra',
  'qui', 'ora', 'ancora', 'annota', 'annotalo', 'prendo', 'nota', 'caso',
  'pista', 'cosa', 'cose', 'questo', 'questa', 'cosi', 'poi', 'per', 'con',
  'senza', 'solo', 'non', 'si', 'e', 'o', 'ma', 'di', 'da', 'a', 'il', 'lo',
  'la', 'i', 'gli', 'le', 'un', 'una', 'mi', 'ci'
]);

function isObviouslyGeneric(text) {
  const value = normalized(text);
  if (value.length < 20) return true;
  const meaningful = value.split(' ').filter((word) => !GENERIC_WORDS.has(word));
  return meaningful.length < 2;
}

const targets = [];
const targetKeys = new Set();

function addTarget(kind, mapId, identity, label, dialogue) {
  const ids = [...new Set(dialogueIds(dialogue))];
  if (!ids.length) return;
  const key = [kind, mapId, identity, ids.join(',')].join(':');
  if (targetKeys.has(key)) return; // maps.js puo' esporre lo stesso oggetto in due registri
  targetKeys.add(key);
  targets.push({ kind, mapId, label, ids });
}

for (const [mapId, map] of Object.entries(GAME.Maps)) {
  if (!map || !Array.isArray(map.npcs) || !Array.isArray(map.objects)) continue;
  for (const npc of map.npcs) {
    addTarget('NPC', mapId, npc.id, npc.id, npc.dialogue);
  }
  for (const object of map.objects) {
    if (!object.dialogue) continue;
    addTarget('OBJ', mapId, object.x + ',' + object.y,
      object.x + ',' + object.y, object.dialogue);
  }
}

console.log('# target classici attivabili con Enter');
for (const target of targets) {
  console.log(`  - ${target.kind} ${target.mapId}:${target.label} -> ${target.ids.join(', ')}`);
}

const branches = new Map();
for (const target of targets) {
  for (const id of target.ids) {
    if (!branches.has(id)) branches.set(id, new Set());
    branches.get(id).add(`${target.kind} ${target.mapId}:${target.label}`);
  }
}

const seenCooper = new Map();
let variantCount = 0;
const allowedClassicDiane = new Set([
  'truman_atto3:first',
  'leland_morte:first',
  'leland_interr:first',
  'bob_finale:first',
  'laura_finale2:first',
  'laura_sogno:first'
  // gigante2_dlg ritirato (Act 3 pass 01): il Roadhouse è del layer missione (M8)
]);
const seenClassicDiane = new Set();

console.log('# voce Cooper per ramo');
for (const [id, refs] of branches) {
  const def = GAME.Data.dialogues[id];
  if (!def) {
    fail(`${id}: dialogo mancante (da ${[...refs].join('; ')})`);
    continue;
  }

  const variants = [['first', def.pages]];
  if (def.again) variants.push(['again', def.again.pages]);

  for (const [variant, pages] of variants) {
    variantCount++;
    if (!Array.isArray(pages) || pages.length === 0) {
      fail(`${id}:${variant} non contiene pagine`);
      continue;
    }

    const cooperPages = [];
    pages.forEach((page, index) => {
      pageCount++;
      if (!page || typeof page.text !== 'string') {
        fail(`${id}:${variant}[${index}] non contiene testo`);
        return;
      }
      if (page.text.length > 129) {
        fail(`${id}:${variant}[${index}] supera 129 caratteri (${page.text.length})`);
      }
      if (page.name === 'COOPER') cooperPages.push({ page, index });
    });

    if (!cooperPages.length) {
      fail(`${id}:${variant} privo di battuta COOPER (da ${[...refs].join('; ')})`);
      continue;
    }

    for (const item of cooperPages) {
      cooperCount++;
      const text = item.page.text;
      const voiceKey = normalized(text);
      if (/\bDiane\b/i.test(text)) {
        const branchKey = `${id}:${variant}`;
        if (!allowedClassicDiane.has(branchKey)) {
          fail(`${id}:${variant}[${item.index}] usa Diane fuori da apertura/chiusura/redirect esplicito: "${text}"`);
        } else {
          seenClassicDiane.add(branchKey);
        }
      }
      if (isObviouslyGeneric(text)) {
        fail(`${id}:${variant}[${item.index}] battuta COOPER palesemente generica: "${text}"`);
      }
      if (seenCooper.has(voiceKey)) {
        fail(`${id}:${variant}[${item.index}] duplica ${seenCooper.get(voiceKey)}: "${text}"`);
      } else {
        seenCooper.set(voiceKey, `${id}:${variant}[${item.index}]`);
      }
    }

    console.log(`  ok - ${id}:${variant} (${cooperPages.length} COOPER)`);
  }
}

for (const branchKey of allowedClassicDiane) {
  if (!seenClassicDiane.has(branchKey)) fail(`${branchKey} doveva conservare il richiamo motivato a Diane`);
}

console.log('# conteggi');
console.log(`  target fisici: ${targets.length}`);
console.log(`  rami dialogo unici: ${branches.size}`);
console.log(`  varianti first/again: ${variantCount}`);
console.log(`  pagine verificate: ${pageCount}`);
console.log(`  battute COOPER verificate: ${cooperCount}`);
console.log(`  richiami a Diane giustificati: ${seenClassicDiane.size}/${allowedClassicDiane.size}`);

/* Missioni narrative: enumera le pagine REALMENTE assemblabili dal runtime
 * (pages + pages_by_value + conditional pages), deduplica le rese identiche e
 * include refresh/repeat come varianti autonome. I vincoli tra valori scritti
 * dalla stessa scelta vengono derivati dagli effects, non hardcodati per nodo. */
const rootDir = path.join(__dirname, '..');
const enumData = JSON.parse(fs.readFileSync(path.join(rootDir, 'narrative', 'state-enums.json'), 'utf8'));
const missionNames = ['M4', 'M5', 'M6', 'M8', 'M9'];
const missions = missionNames.map((name) => ({
  name,
  data: JSON.parse(fs.readFileSync(path.join(rootDir, 'narrative', 'missions', name + '.json'), 'utf8'))
}));

function cooperPage(page) {
  return !!page && (page.name === 'COOPER' || page.speaker_id === 'cooper' || page.display_name === 'COOPER');
}

// Sentinella per un valore MAI scritto (peekValue === undefined nel runtime):
// distinta da qualunque valore reale del dominio, cosi' value_set/¬value_set
// possono essere enumerati come stato a se' quando un `value` non ha default.
const UNSET = Symbol('unset');

function conditionValueNames(condition, out, unsetOut) {
  if (!condition || typeof condition !== 'object') return out;
  if (condition.value_is && condition.value_is.name) out.add(condition.value_is.name);
  if (typeof condition.value_set === 'string') {
    out.add(condition.value_set);
    if (unsetOut) unsetOut.add(condition.value_set);
  }
  Object.values(condition).forEach((value) => {
    if (Array.isArray(value)) value.forEach((item) => conditionValueNames(item, out, unsetOut));
    else if (value && typeof value === 'object') conditionValueNames(value, out, unsetOut);
  });
  return out;
}

function evalPageCondition(condition, values) {
  if (!condition) return true;
  if (condition.value_is) return values[condition.value_is.name] === condition.value_is.equals;
  if (typeof condition.value_set === 'string') {
    var v = values[condition.value_set];
    return v !== undefined && v !== UNSET;
  }
  if (condition.all) return condition.all.every((item) => evalPageCondition(item, values));
  if (condition.any) return condition.any.some((item) => evalPageCondition(item, values));
  if (condition.not) return !evalPageCondition(condition.not, values);
  // condizioni di stato (node_done/flag/evidence/proposition_path, C8-B
  // conditional_pages): non dipendono dai valori enumerati → la pagina è
  // auditata come presente (stesso trattamento per tutte, mirror NR.evalCond
  // ma senza uno state runtime da interrogare in questo audit statico).
  if (condition.node_done !== undefined || condition.flag !== undefined ||
    condition.evidence !== undefined || condition.proposition_path !== undefined) return true;
  throw new Error('interaction-voice: condizione pagina non supportata ' + JSON.stringify(condition));
}

function domainFor(valueName) {
  const domainName = enumData.values_allowed[valueName] || valueName;
  const domain = enumData.enums[domainName];
  if (!Array.isArray(domain) || !domain.length) throw new Error(`dominio mancante per ${valueName}`);
  return domain;
}

function assignments(names, index, current, out, unsetNames) {
  if (index === names.length) { out.push({ ...current }); return out; }
  const name = names[index];
  const domain = domainFor(name);
  const options = unsetNames && unsetNames.has(name) ? [...domain, UNSET] : domain;
  for (const value of options) {
    current[name] = value;
    assignments(names, index + 1, current, out, unsetNames);
  }
  delete current[name];
  return out;
}

function choiceValueWrites(mission) {
  const writes = [];
  for (const node of mission.nodes || []) {
    for (const choice of node.choices || []) {
      const record = {};
      for (const effect of choice.effects || []) {
        if (effect.value && effect.to !== undefined) record[effect.value] = effect.to;
      }
      if (Object.keys(record).length > 1) writes.push(record);
    }
  }
  return writes;
}

function respectsChoiceCorrelations(values, writes) {
  for (const write of writes) {
    const shared = Object.keys(write).filter((name) => Object.prototype.hasOwnProperty.call(values, name));
    if (shared.length < 2) continue;
    const compatible = writes.some((candidate) =>
      shared.every((name) => Object.prototype.hasOwnProperty.call(candidate, name) && candidate[name] === values[name]));
    if (!compatible) return false;
  }
  return true;
}

function renderedEntryVariants(mission, node) {
  const names = new Set();
  const unsetNames = new Set();
  if (node.pages_by_value) names.add(node.pages_by_value.value);
  [...(node.pages || []), ...(node.pages_after_branch || [])]
    .forEach((page) => conditionValueNames(page.condition, names, unsetNames));
  const valueNames = [...names];
  const states = valueNames.length ? assignments(valueNames, 0, {}, [], unsetNames) : [{}];
  const writes = choiceValueWrites(mission);
  const variants = new Map();

  for (const values of states) {
    if (!respectsChoiceCorrelations(values, writes)) continue;
    let pages = (node.pages || []).slice();
    if (node.pages_by_value) pages = pages.concat(node.pages_by_value.cases[values[node.pages_by_value.value]] || []);
    pages = pages.concat(node.pages_after_branch || []).filter((page) => evalPageCondition(page.condition, values));
    const key = pages.map((page) => page.id || `${page.speaker_id}:${page.text}`).join('|');
    if (!variants.has(key)) variants.set(key, { pages, values });
  }
  return [...variants.values()];
}

let worldRoots = 0;
let renderedVariants = 0;
let repeatVariants = 0;
const missionVoicePages = new Map();

/* Eccezione riveduta ed esplicita (non un fallback generico): questi due
 * world root di M8 sono muti per contratto di scena, non per lacuna di
 * scrittura. m8_roadhouse_truman e' il beat di testimonianza (la voce di
 * Cooper arriva al nodo telefono, m8_roadhouse_phone, non qui);
 * m8_giant_stage e' presenza silenziosa per contratto (S3/L4,
 * artifacts/act-4-design/scene-contracts.md: "indica nulla"). Entry e
 * repeat esenti SOLO per questi id; il gate resta rigido per tutto il resto. */
const silentByDesign = {
  M8: new Set(['m8_roadhouse_truman', 'm8_giant_stage'])
};

console.log('# voce Cooper nelle missioni narrative');
for (const mission of missions) {
  const silentIds = silentByDesign[mission.name] || new Set();
  for (const node of mission.data.nodes || []) {
    if (node.channel !== 'world') continue;
    worldRoots++;
    const silent = silentIds.has(node.id);
    const variants = renderedEntryVariants(mission.data, node);
    variants.forEach((variant, index) => {
      renderedVariants++;
      const label = `${mission.name}:${node.id}:entry${variants.length > 1 ? '[' + (index + 1) + ']' : ''}`;
      if (!variant.pages.some(cooperPage)) {
        if (silent) console.log(`  ok - ${label} (silenzioso per contratto)`);
        else fail(`${label} privo di battuta COOPER`);
      } else console.log(`  ok - ${label}`);
      variant.pages.filter(cooperPage).forEach((page) => missionVoicePages.set(page.id, page));
    });
    if (node.rules && node.rules.reopen) {
      renderedVariants++;
      const pages = node.rules.reopen.pages || [];
      const label = `${mission.name}:${node.id}:reopen`;
      if (!pages.some(cooperPage)) {
        if (silent) console.log(`  ok - ${label} (silenzioso per contratto)`);
        else fail(`${label} privo di battuta COOPER`);
      } else console.log(`  ok - ${label}`);
      pages.filter(cooperPage).forEach((page) => missionVoicePages.set(page.id, page));
    }
    if (node.repeat) {
      repeatVariants++;
      const label = `${mission.name}:${node.id}:repeat`;
      if (!cooperPage(node.repeat)) {
        if (silent) console.log(`  ok - ${label} (silenzioso per contratto)`);
        else fail(`${label} privo di battuta COOPER`);
      } else console.log(`  ok - ${label}`);
      if (cooperPage(node.repeat)) missionVoicePages.set(node.repeat.id, node.repeat);
    }
  }
}

const missionTextOwners = new Map();
for (const [id, page] of missionVoicePages) {
  if (isObviouslyGeneric(page.text)) fail(`${id} battuta COOPER palesemente generica: "${page.text}"`);
  const key = normalized(page.text);
  if (missionTextOwners.has(key)) fail(`${id} duplica ${missionTextOwners.get(key)}: "${page.text}"`);
  else missionTextOwners.set(key, id);
}

console.log('# conteggi missioni narrative');
console.log(`  world roots: ${worldRoots}`);
console.log(`  varianti entry/reopen rese: ${renderedVariants}`);
console.log(`  repeat autoriali: ${repeatVariants}`);
console.log(`  pagine COOPER uniche: ${missionVoicePages.size}`);

/* M6 stitch: +2 world root (m6_hospital_guard, m6_return_night_early) con il
 * loro repeat; +3 varianti di m6_news (la correzione «impeto» rende una pagina
 * in piu' solo con m5_final_theory=degeneration, su ognuna delle 3 tattiche) e
 * +1 di m6_atto4_bridge (le due letture esclusive di s1). */
// Act 4 pass 01 (split B1 + B2): +5 world root M8 (m8_leland_waiting,
// m8_roadhouse_truman, m8_giant_stage al posto di m8_roadhouse; m8_lucy),
// +3 repeat autoriali (m8_leland_waiting, m8_giant_stage, m8_focus_choice);
// value_set ora enumerato (UNSET) aggiunge le varianti reali su m8_lucy.
if (worldRoots !== 54) fail(`world roots attese 54, trovate ${worldRoots}`);
if (renderedVariants !== 77) fail(`varianti entry/reopen attese 77, trovate ${renderedVariants}`);
if (repeatVariants !== 24) fail(`repeat autoriali attesi 24, trovati ${repeatVariants}`);

if (failures.length) {
  throw new Error(`interaction-voice: ${failures.length} errore/i`);
}

console.log(`interaction-voice: PASS (classici ${variantCount}/${variantCount}; narrative ${renderedVariants}/${renderedVariants}; repeat ${repeatVariants}/${repeatVariants})`);
