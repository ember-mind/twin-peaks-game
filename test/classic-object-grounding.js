/* R19L — Oggetti classici: descrizione osservabile prima dell'inferenza.
 * Nessuna intenzione invisibile dichiarata come fatto; anello verificato anche
 * attraverso Enter reale, prima visita e repeat. */
'use strict';

const assert = require('assert');
const path = require('path');

let now = 0;
let rafQueue = [];
const handlers = {};
global.window = global;
global.addEventListener = (type, fn) => { handlers[type] = fn; };
global.requestAnimationFrame = (fn) => { rafQueue.push(fn); };
global.performance = { now: () => now };

const ctx = new Proxy({}, { get: () => () => {}, set: () => true });
const canvas = { getContext: () => ctx };
const ROOT = path.join(__dirname, '..');
const J = (file) => path.join(ROOT, 'js', file);
[
  'tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js',
  'retro-font.js', 'engine.js', 'glue.js'
].forEach((file) => require(J(file)));

const GAME = global.GAME;
const E = GAME.Engine;
const D = GAME.Data.dialogues;
const INVISIBLE_INTENT = /\b(?:con cura|deliberat\w*|intenzional\w*|apposta|voleva|ha scelto|era destinat\w*|per (?:nasconder\w*|depistar\w*|guidar\w*|attirar\w*))\b/i;
const DEHUMANIZING_REMAINS = /\b(?:ciò che (?:ne )?(?:resta|hanno trovato)|resti (?:umani|del corpo|di Laura)|pezz\w* (?:del corpo|di Laura)|quel corpo|il cadavere|solo (?:un|il) corpo)\b/i;
const HARD_BOILED = /\b(?:bella fine|un altro cadavere|che spreco|giustizia inutile|la morte non sorprende|solo un caso|carne da fascicolo)\b/i;
let checks = 0;

function ok(value, label) {
  assert(value, label);
  checks++;
  console.log('  ok - ' + label);
}

function dialogueIds(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(dialogueIds);
  if (!value || typeof value !== 'object') return [];
  return [value.then, value.else].filter(Boolean).flatMap(dialogueIds);
}

function key(code) {
  handlers.keydown({ code, preventDefault() {}, repeat: false });
  handlers.keyup({ code });
}

function pump(ms) {
  for (let i = 0; i < Math.ceil(ms / 16); i++) {
    now += 16;
    const batch = rafQueue.splice(0);
    batch.forEach((fn) => fn(now));
  }
}

function drain() {
  while (E.state.dialogue) { key('Enter'); pump(16); }
}

console.log('# corpus oggetti classici');
const refs = new Map();
for (const [mapId, map] of Object.entries(GAME.Maps)) {
  for (const object of map.objects || []) {
    for (const id of dialogueIds(object.dialogue)) {
      if (!refs.has(id)) refs.set(id, []);
      refs.get(id).push(`${mapId}@${object.x},${object.y}`);
    }
  }
}
ok(refs.size > 0, 'registro oggetti authored non vuoto');
for (const [id, targets] of refs) {
  const def = D[id];
  ok(!!def, `${id}: dialogo esistente (${targets.join(', ')})`);
  for (const [variant, pages] of [['first', def.pages], ['again', def.again && def.again.pages]]) {
    for (const [index, page] of (pages || []).entries()) {
      ok(!INVISIBLE_INTENT.test(page.text), `${id}:${variant}[${index}] senza intenzione invisibile: "${page.text}"`);
      ok(!DEHUMANIZING_REMAINS.test(page.text), `${id}:${variant}[${index}] non riduce persone a resti corporei`);
      ok(!HARD_BOILED.test(page.text), `${id}:${variant}[${index}] senza cinismo hard-boiled`);
    }
  }
}

console.log('# cimitero: Laura resta persona');
const cemetery = D.landmark_cemetery;
const cemeteryCooper = cemetery.pages.find((page) => page.name === 'COOPER');
ok(!!cemeteryCooper, 'cimitero contiene battuta Cooper');
ok(/Laura Palmer/i.test(cemeteryCooper.text), 'cimitero nomina Laura, non un corpo anonimo');
ok(/lapide|date/i.test(cemeteryCooper.text), 'battuta resta specifica al cimitero');
ok(/diciassette|vita|persona/i.test(cemeteryCooper.text), 'battuta conserva età e umanità di Laura');
ok(/fascicolo/i.test(cemeteryCooper.text) && /non ridurre/i.test(cemeteryCooper.text), 'metodo di Cooper rifiuta riduzione investigativa');
ok(!DEHUMANIZING_REMAINS.test(cemeteryCooper.text) && !HARD_BOILED.test(cemeteryCooper.text), 'cimitero supera guardia tono/grounding');

console.log('# anello: osservazione e inferenza separate');
const ring = D.anello_interact;
ok(ring.pages.length === 3 && ring.again.pages.length === 1, 'anello conserva first/repeat completi');
ok(/giace piatto sotto l.asse/i.test(ring.pages[1].text), 'pagina oggetto descrive posizione visibile');
ok(!/nascost|cura|volut|deliber|intenz|apposta/i.test(ring.pages[1].text), 'pagina oggetto non attribuisce gesto o intenzione');
ok(/centro del vano|polvere interrotta|traccia di rotolamento/i.test(ring.pages[2].text), 'pagina successiva espone segnali osservabili');
ok(/potrebbe/i.test(ring.pages[2].text), 'inferenza sul posizionamento resta provvisoria');
ok(!INVISIBLE_INTENT.test(ring.again.pages[0].text), 'repeat non introduce intenzione retroattiva');

console.log('# Enter reale: prima visita e repeat');
E.init(canvas);
E.start();
E.state.mode = 'play';
E.state.flags.intro_town = true;
E.loadMap('traincar', 13, 4, 'down');
key('Enter');
pump(16);
ok(E.state.dialogue && E.state.dialogue.id === 'anello_interact' && !E.state.dialogue.replay, 'primo Enter apre first anello');
ok(E.state.dialogue.pages.every((page) => !INVISIBLE_INTENT.test(page.text)), 'first runtime resta grounded');
drain();
ok(E.state.clues.includes('anello'), 'prima visita acquisisce anello');
key('Enter');
pump(16);
ok(E.state.dialogue && E.state.dialogue.id === 'anello_interact' && E.state.dialogue.replay, 'secondo Enter apre repeat anello');
ok(E.state.dialogue.pages.every((page) => !INVISIBLE_INTENT.test(page.text)), 'repeat runtime resta grounded');
drain();

console.log(`classic-object-grounding: PASS (${checks} checks; ${refs.size} dialoghi oggetto)`);
