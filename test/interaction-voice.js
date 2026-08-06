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
  'glue.js'
].forEach((file) => require(J(file)));

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
  'laura_finale2:first',
  'laura_sogno:first',
  'gigante2_dlg:first'
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

function conditionValueNames(condition, out) {
  if (!condition || typeof condition !== 'object') return out;
  if (condition.value_is && condition.value_is.name) out.add(condition.value_is.name);
  Object.values(condition).forEach((value) => {
    if (Array.isArray(value)) value.forEach((item) => conditionValueNames(item, out));
    else if (value && typeof value === 'object') conditionValueNames(value, out);
  });
  return out;
}

function evalPageCondition(condition, values) {
  if (!condition) return true;
  if (condition.value_is) return values[condition.value_is.name] === condition.value_is.equals;
  if (condition.all) return condition.all.every((item) => evalPageCondition(item, values));
  if (condition.any) return condition.any.some((item) => evalPageCondition(item, values));
  if (condition.not) return !evalPageCondition(condition.not, values);
  throw new Error('interaction-voice: condizione pagina non supportata ' + JSON.stringify(condition));
}

function domainFor(valueName) {
  const domainName = enumData.values_allowed[valueName] || valueName;
  const domain = enumData.enums[domainName];
  if (!Array.isArray(domain) || !domain.length) throw new Error(`dominio mancante per ${valueName}`);
  return domain;
}

function assignments(names, index, current, out) {
  if (index === names.length) { out.push({ ...current }); return out; }
  const name = names[index];
  for (const value of domainFor(name)) {
    current[name] = value;
    assignments(names, index + 1, current, out);
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
  if (node.pages_by_value) names.add(node.pages_by_value.value);
  [...(node.pages || []), ...(node.pages_after_branch || [])]
    .forEach((page) => conditionValueNames(page.condition, names));
  const valueNames = [...names];
  const states = valueNames.length ? assignments(valueNames, 0, {}, []) : [{}];
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

console.log('# voce Cooper nelle missioni narrative');
for (const mission of missions) {
  for (const node of mission.data.nodes || []) {
    if (node.channel !== 'world') continue;
    worldRoots++;
    const variants = renderedEntryVariants(mission.data, node);
    variants.forEach((variant, index) => {
      renderedVariants++;
      const label = `${mission.name}:${node.id}:entry${variants.length > 1 ? '[' + (index + 1) + ']' : ''}`;
      if (!variant.pages.some(cooperPage)) fail(`${label} privo di battuta COOPER`);
      else console.log(`  ok - ${label}`);
      variant.pages.filter(cooperPage).forEach((page) => missionVoicePages.set(page.id, page));
    });
    if (node.rules && node.rules.reopen) {
      renderedVariants++;
      const pages = node.rules.reopen.pages || [];
      const label = `${mission.name}:${node.id}:reopen`;
      if (!pages.some(cooperPage)) fail(`${label} privo di battuta COOPER`);
      else console.log(`  ok - ${label}`);
      pages.filter(cooperPage).forEach((page) => missionVoicePages.set(page.id, page));
    }
    if (node.repeat) {
      repeatVariants++;
      const label = `${mission.name}:${node.id}:repeat`;
      if (!cooperPage(node.repeat)) fail(`${label} privo di battuta COOPER`);
      else console.log(`  ok - ${label}`);
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

if (worldRoots !== 37) fail(`world roots attese 37, trovate ${worldRoots}`);
if (renderedVariants !== 52) fail(`varianti entry/reopen attese 52, trovate ${renderedVariants}`);
if (repeatVariants !== 7) fail(`repeat autoriali attesi 7, trovati ${repeatVariants}`);

if (failures.length) {
  throw new Error(`interaction-voice: ${failures.length} errore/i`);
}

console.log(`interaction-voice: PASS (classici ${variantCount}/${variantCount}; narrative ${renderedVariants}/${renderedVariants}; repeat ${repeatVariants}/${repeatVariants})`);
