/* Prova di percorso/stato: il landmark dei binari è raggiungibile da subito,
 * ma non conosce data, vagone o cuore prima delle relative fonti. */
'use strict';

const assert = require('assert');
const path = require('path');

global.window = global;
global.addEventListener = function () {};
global.requestAnimationFrame = function () {};

const ROOT = path.join(__dirname, '..');
const J = (file) => path.join(ROOT, 'js', file);
[
  'tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js',
  'retro-font.js', 'engine.js', 'scene-objects.gen.js', 'glue.js'
].forEach((file) => require(J(file)));

const GAME = global.GAME;
const D = GAME.Data.dialogues;
const E = GAME.Engine;
const tracks = GAME.Maps.town.objects.find((object) => object.kind === 'tracks');
let checks = 0;

function ok(value, label) {
  assert(value, label);
  checks++;
  console.log('  ok - ' + label);
}

function textOf(id) {
  const def = D[id];
  ok(!!def, `${id}: definizione presente`);
  ok(def.pages.some((page) => page.name === 'COOPER'), `${id}: Cooper parla`);
  return def.pages.map((page) => page.text).join(' ');
}

function state(evidence, flags) {
  return { evidence: evidence || {}, flags: flags || {}, clues: [] };
}

function reachable(mapId, fromX, fromY, toX, toY, classicState) {
  const map = GAME.Maps[mapId];
  const queue = [[fromX, fromY]];
  const seen = new Set([`${fromX},${fromY}`]);
  while (queue.length) {
    const [x, y] = queue.shift();
    if (x === toX && y === toY) return true;
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const nx = x + dx, ny = y + dy, key = `${nx},${ny}`;
      if (seen.has(key) || nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue;
      if (GAME.Maps.isSolid(mapId, nx, ny, classicState)) continue;
      seen.add(key);
      queue.push([nx, ny]);
    }
  }
  return false;
}

console.log('# landmark fisico e stato iniziale');
ok(!!tracks, 'landmark tracks presente sulla mappa town');
ok(GAME.Maps.objectAt('town', tracks.x, tracks.y) === tracks, 'casella authored dei binari risolve il landmark reale');
ok(reachable('town', 28, 31, tracks.x, tracks.y + 1, { clues: [], flags: {} }),
  'da spawn si raggiunge la casella da cui Invio affronta i binari');
ok(E.resolveDialogue(tracks.dialogue, state()) === 'landmark_tracks', 'stato vuoto usa risposta neutra');

const neutral = textOf('landmark_tracks');
ok(!/12 febbraio|dodici febbraio/i.test(neutral), 'stato vuoto non inventa la data');
ok(!/vagone/i.test(neutral), 'stato vuoto non conosce il vagone');
ok(!/cuore|ciondol/i.test(neutral), 'stato vuoto non conosce cuore/ciondolo');
ok(/binari|rotaie/i.test(neutral) && /direzione|est/i.test(neutral), 'risposta neutra resta specifica ai binari');

console.log('# gate atomico della rotta');
ok(E.resolveDialogue(tracks.dialogue, state({ E6A_CUORE_INTERO: true })) === 'landmark_tracks',
  'solo cuore intero non basta per conoscere la rotta');
ok(E.resolveDialogue(tracks.dialogue, state({ T_JAMES_EST: true })) === 'landmark_tracks',
  'solo testimonianza geografica non basta per usare il ciondolo');
ok(E.resolveDialogue(tracks.dialogue, state({ E6A_CUORE_INTERO: true, T_JAMES_EST: true })) === 'landmark_tracks_route',
  'E6A + T_JAMES_EST sbloccano insieme la lettura ricca');

const route = textOf('landmark_tracks_route');
ok(/James/i.test(route) && /ciondol/i.test(route), 'lettura ricca attribuisce geografia e relazione alle fonti esatte');
ok(/binari|est/i.test(route), 'lettura ricca resta specifica al target');
ok(!/vagone/i.test(route), 'prove M4 non anticipano ancora il vagone');
ok(!/12 febbraio|dodici febbraio/i.test(route), 'prove M4 non inventano una data');

console.log('# scoperta del vagone e precedenza');
ok(E.resolveDialogue(tracks.dialogue, state({}, { vagone_scoperto: true })) === 'landmark_tracks_vagone',
  'flag semantico esatto sblocca il richiamo al vagone');
ok(E.resolveDialogue(tracks.dialogue, state(
  { E6A_CUORE_INTERO: true, T_JAMES_EST: true }, { vagone_scoperto: true }
)) === 'landmark_tracks_vagone', 'scoperta del vagone ha precedenza sulla variante di rotta');

const discovered = textOf('landmark_tracks_vagone');
ok(/vagone/i.test(discovered) && /binari/i.test(discovered), 'variante scoperta nomina soltanto luogo osservato e target');
ok(!/cuore|ciondol/i.test(discovered), 'flag vagone isolato non importa conoscenza del cuore');
ok(!/12 febbraio|dodici febbraio/i.test(discovered), 'nessuna variante conserva la data senza fonte');

console.log('# percorso runtime: adapter narrativo -> resolver classico');
let live = state();
GAME.NarrativeAdapter = { getState: () => live };
ok(E.resolveDialogue(tracks.dialogue) === 'landmark_tracks', 'runtime vuoto resta neutro');
live = state({ E6A_CUORE_INTERO: true, T_JAMES_EST: true });
ok(E.resolveDialogue(tracks.dialogue) === 'landmark_tracks_route', 'runtime legge prove reali dall\'adapter');
live = state({ E6A_CUORE_INTERO: true, T_JAMES_EST: true }, { vagone_scoperto: true });
ok(E.resolveDialogue(tracks.dialogue) === 'landmark_tracks_vagone', 'runtime legge flag reale dall\'adapter');

console.log(`tracks-provenance: PASS (${checks} checks)`);
