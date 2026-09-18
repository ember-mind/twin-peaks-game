#!/usr/bin/env node
'use strict';

/* test/town-dusk.js — contratto del grade serale del Town (Phase 4, D1/D5).
 *
 * Verifica cio' che il brief chiede di poter far fallire a un revisore:
 * il grade e' deterministico e memoizzato, non produce mai nero pieno,
 * porta i campioni diurni del town nelle famiglie misurate sul lotto
 * Double R, i rettangoli emissivi restano dentro i visualBounds del loro
 * landmark e l'overlay non disegna nulla fuori da `town`. */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
global.window = global;
global.GAME = global.GAME || {};

/* La tabella dei landmark e' la stessa fonte del renderer: la si legge da
 * js/retro-authored.js senza caricare tutto il modulo grafico. */
const authored = fs.readFileSync(path.join(root, 'js/retro-authored.js'), 'utf8');
const defsBlock = authored.slice(
  authored.indexOf('var TOWN_STRUCTURE_DEFS = ['),
  authored.indexOf('/* Contratto dati R80', authored.indexOf('var TOWN_STRUCTURE_DEFS = ['))
);
const STRUCTS = [];
const defRe = /\{\s*id:'([^']+)'[^}]*anchor:\[(\d+),(\d+)\][^}]*visualBounds:\[(-?\d+),(-?\d+),(\d+),(\d+)\]/g;
let m;
while ((m = defRe.exec(defsBlock))) {
  STRUCTS.push({
    id: m[1], anchor: [Number(m[2]), Number(m[3])],
    visualBounds: [Number(m[4]), Number(m[5]), Number(m[6]), Number(m[7])]
  });
}
assert.ok(STRUCTS.length >= 11, 'landmark table parsed from js/retro-authored.js');
GAME.Retro2D = GAME.Retro2D || {};
GAME.Retro2D.townStructureDefs = STRUCTS;

const maps = require(path.join(root, 'js/maps.js')) || GAME.maps;
GAME.Maps = { town: { id: 'town', rows: GAME.maps.maps.town.rows } };

const Dusk = require(path.join(root, 'js/town-dusk.js'));

let checks = 0;
function check(name, fn) {
  fn();
  checks++;
  console.log('  ok  ' + name);
}

function hex(rgb) {
  return '#' + rgb.map((v) => ('0' + v.toString(16)).slice(-2)).join('');
}
function px(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function within(actual, target, tol, label) {
  for (let i = 0; i < 3; i++) {
    assert.ok(Math.abs(actual[i] - target[i]) <= tol,
      `${label}: ${hex(actual)} vs ${hex(target)} — canale ${i} fuori di ±${tol}`);
  }
}
function inBand(actual, lo, hi, label) {
  for (let i = 0; i < 3; i++) {
    assert.ok(actual[i] >= lo[i] - 12 && actual[i] <= hi[i] + 12,
      `${label}: ${hex(actual)} fuori dalla banda ${hex(lo)}..${hex(hi)} sul canale ${i}`);
  }
}
const luma = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

console.log('town-dusk: grade');

check('deterministico: stesso ingresso, stessa uscita', () => {
  for (const h of ['#e8d08f', '#83d3a7', '#8f2430', '#2f4d63', '#000000', '#ffffff']) {
    const p = px(h);
    assert.deepStrictEqual(Dusk.grade(p[0], p[1], p[2]), Dusk.grade(p[0], p[1], p[2]));
    assert.deepStrictEqual(Dusk.grade(p[0], p[1], p[2], true), Dusk.grade(p[0], p[1], p[2], true));
  }
});

check('memoizzato per chiave 24 bit: la seconda chiamata non aggiunge voci', () => {
  Dusk.gradePacked(17, 34, 51, false);
  const before = Dusk.memoSize();
  for (let i = 0; i < 500; i++) Dusk.gradePacked(17, 34, 51, false);
  assert.strictEqual(Dusk.memoSize(), before, 'nessuna voce nuova per un colore gia' + "'" + ' visto');
  Dusk.gradePacked(17, 34, 52, false);
  assert.strictEqual(Dusk.memoSize(), before + 1, 'un colore nuovo aggiunge esattamente una voce');
});

check('uscita intera in 0..255 e mai nero pieno', () => {
  for (let r = 0; r < 256; r += 17) for (let g = 0; g < 256; g += 17) for (let b = 0; b < 256; b += 17) {
    const o = Dusk.grade(r, g, b);
    for (let i = 0; i < 3; i++) {
      assert.ok(Number.isInteger(o[i]), 'canale intero');
      assert.ok(o[i] >= Dusk.constants.minChannel, `mai nero pieno: ${hex(o)}`);
      assert.ok(o[i] <= 255, 'canale <= 255');
    }
    assert.ok(luma(o) > 0, 'luminanza positiva');
  }
});

/* Le due curve non si toccano mai: qualunque pixel di terreno dentro una
 * tile di strada deve uscire piu' freddo e piu' scuro della stessa crema
 * fuori strada, altrimenti la carreggiata torna a leggere come marciapiede. */
check('la curva asfalto e quella terreno restano separate', () => {
  for (const h of ['#e8d08f', '#dfcb91', '#d6bc7d', '#c5ac74']) {
    const p = px(h);
    const ground = Dusk.grade(p[0], p[1], p[2], false);
    const road = Dusk.grade(p[0], p[1], p[2], true);
    assert.ok(luma(road) < luma(ground) - 15, `${h}: asfalto piu' scuro del calcestruzzo`);
    /* DQ3 (bf6c2c2) rebalanced the asphalt to a neutral grey: no longer blue-led,
     * but never warm, and always far less warm than the concrete beside it. */
    assert.ok(road[2] >= road[0] - 8, `${h}: asfalto mai caldo (blu >= rosso - 8)`);
    assert.ok((ground[0] - ground[2]) - (road[0] - road[2]) > 40, `${h}: asfalto molto meno caldo del calcestruzzo`);
    assert.ok(ground[0] > ground[2] + 8, `${h}: calcestruzzo caldo (rosso > blu)`);
  }
});

console.log('town-dusk: famiglie misurate sul lotto Double R');

/* Terreno battuto e marciapiede: calcestruzzo del lotto. */
check('creme del terreno -> calcestruzzo #6f6d64..#7a766c', () => {
  for (const h of ['#e8d08f', '#dfcb91', '#d6bc7d', '#dbc78d', '#d4be84']) {
    inBand(Dusk.grade(...px(h)), px('#6f6d64'), px('#7a766c'), `terreno ${h}`);
  }
});

check('tile di strada -> ardesia #485665 del lotto (±12 per canale)', () => {
  for (const h of ['#dfcb91', '#e8d08f']) {
    within(Dusk.grade(px(h)[0], px(h)[1], px(h)[2], true), px('#485665'), 12, `strada ${h}`);
  }
});

check('prato e alberi -> verde profondo, e sono la famiglia piu\' scura', () => {
  const groundL = luma(Dusk.grade(...px('#e8d08f')));
  for (const h of ['#83d3a7', '#86d5aa', '#88d5ac', '#80d1a5']) {
    inBand(Dusk.grade(...px(h)), px('#2f4d3b'), px('#33553f'), `prato ${h}`);
  }
  for (const h of ['#24382f', '#315a49', '#3e725b', '#46745e', '#5e987b', '#8fa474', '#c5c886']) {
    const o = Dusk.grade(...px(h));
    assert.ok(luma(o) < groundL - 20, `${h}: vegetazione piu' scura del terreno (${hex(o)})`);
    assert.ok(o[0] <= 93 && o[1] <= 122 && o[2] <= 90,
      `${h}: verde entro il tetto #5d7a5a (${hex(o)})`);
  }
});

check('bordeaux resta bordeaux e i legni restano bruni', () => {
  within(Dusk.grade(...px('#8f2430')), px('#8c2f3e'), 14, 'bordeaux del lotto');
  for (const h of ['#a86848', '#a9754f', '#6f5238']) {
    const o = Dusk.grade(...px(h));
    assert.ok(o[0] > o[1] && o[1] > o[2], `${h}: legno ancora bruno (${hex(o)})`);
  }
});

check('inchiostri e contorni restano scuri (nessun sollevamento del nero)', () => {
  for (const h of ['#24382f', '#30383b', '#2c1a1f', '#000000']) {
    const o = Dusk.grade(...px(h));
    assert.ok(luma(o) <= 60, `${h}: contorno ancora scuro (${hex(o)}, L=${luma(o).toFixed(0)})`);
  }
});

check('le alteluci restano superfici accese ma sotto #b8b4a4', () => {
  for (const h of ['#fff8d0', '#f3dfa8', '#ffffff']) {
    const o = Dusk.grade(...px(h));
    const ground = luma(Dusk.grade(...px('#e8d08f')));
    assert.ok(luma(o) > ground, `${h}: piu' luminoso del terreno`);
    assert.ok(luma(o) <= luma(px('#b8b4a4')),
      `${h}: alteluce sotto il tetto #b8b4a4 (${hex(o)}, L=${luma(o).toFixed(0)})`);
  }
});

/* Il marciapiede del town deve leggere come il grembiule di calcestruzzo
 * del lotto, non come la terra battuta del sentiero. I valori diurni sono
 * quelli di WALK in js/retro-authored.js; qui si verifica dove atterrano e
 * che nessuno finisca nella famiglia vegetazione (che li scurirebbe). */
const WALK = (() => {
  const line = authored.match(/var WALK = \{[^}]*\};/);
  assert.ok(line, 'WALK palette trovata in js/retro-authored.js');
  const out = {};
  for (const [, k, v] of line[0].matchAll(/(\w+):\s*'(#[0-9a-f]{6})'/g)) out[k] = v;
  return out;
})();

check('il marciapiede atterra sullo stack di calcestruzzo del lotto', () => {
  const stack = [
    ['slab', WALK.slab, '#a9a38f'],
    ['seam', WALK.seam, '#898a7a'],
    ['kerb', WALK.kerb, '#777b70']
  ];
  stack.forEach(([name, input, target]) => {
    within(Dusk.grade(...px(input)), px(target), 12, `calcestruzzo ${name}`);
  });
  /* La scaglia sta sopra il tetto del grade: la si prova comunque piu'
   * chiara della lastra, cosi' il regista vede subito se sparisce. */
  assert.ok(luma(Dusk.grade(...px(WALK.chip))) > luma(Dusk.grade(...px(WALK.slab))),
    'la scaglia resta piu\' chiara della lastra');
});

check('nessun tono di calcestruzzo cade nella famiglia vegetazione', () => {
  Object.keys(WALK).forEach((k) => {
    assert.strictEqual(Dusk.familyOf(...px(WALK[k])), 'ground',
      `${k} ${WALK[k]} resta terreno, non vegetazione`);
  });
  /* Il marciapiede resta piu' chiaro della terra battuta e della strada. */
  const slab = luma(Dusk.grade(...px(WALK.slab)));
  assert.ok(slab > luma(Dusk.grade(...px('#e8d08f'))) + 30, 'calcestruzzo piu\' chiaro del sentiero');
  assert.ok(slab > luma(Dusk.grade(px('#dfcb91')[0], px('#dfcb91')[1], px('#dfcb91')[2], true)) + 60,
    'calcestruzzo piu\' chiaro dell\'asfalto');
});

console.log('town-dusk: practicals');

const boundsById = {};
STRUCTS.forEach((d) => {
  boundsById[d.id] = {
    x0: d.anchor[0] * 16 + d.visualBounds[0],
    y0: d.anchor[1] * 16 + d.visualBounds[1],
    x1: d.anchor[0] * 16 + d.visualBounds[0] + d.visualBounds[2],
    y1: d.anchor[1] * 16 + d.visualBounds[1] + d.visualBounds[3],
    anchor: d.anchor
  };
});

check('ogni rettangolo emissivo sta dentro i visualBounds del suo landmark', () => {
  const table = Dusk.practicals;
  const ids = Object.keys(table);
  assert.deepStrictEqual(ids.sort(), ['double-r', 'sheriff'],
    'solo i landmark dello slice hanno practicals');
  ids.forEach((id) => {
    const b = boundsById[id];
    assert.ok(b, `${id} esiste nella tabella dei landmark`);
    assert.ok(table[id].length > 0, `${id} ha almeno un rettangolo`);
    table[id].forEach((r, i) => {
      const x0 = b.anchor[0] * 16 + r.x, y0 = b.anchor[1] * 16 + r.y;
      assert.ok(r.w > 0 && r.h > 0, `${id}[${i}]: rettangolo non vuoto`);
      assert.ok(Number.isInteger(r.x) && Number.isInteger(r.y) &&
        Number.isInteger(r.w) && Number.isInteger(r.h), `${id}[${i}]: coordinate intere`);
      assert.ok(x0 >= b.x0 && x0 + r.w <= b.x1,
        `${id}[${i}]: x ${x0}..${x0 + r.w} fuori da ${b.x0}..${b.x1}`);
      assert.ok(y0 >= b.y0 && y0 + r.h <= b.y1,
        `${id}[${i}]: y ${y0}..${y0 + r.h} fuori da ${b.y0}..${b.y1}`);
      assert.ok(/^#[0-9a-f]{6}$/.test(r.c), `${id}[${i}]: colore esadecimale a 6 cifre`);
    });
  });
});

check('le luci sono piu\' chiare della parete su cui poggiano', () => {
  const wall = luma(Dusk.grade(...px('#fdedbe')));
  ['sheriff', 'double-r'].forEach((id) => {
    const brightest = Dusk.practicals[id]
      .map((r) => luma(px(r.c)))
      .reduce((a, b) => Math.max(a, b), 0);
    assert.ok(brightest > wall, `${id}: l'apertura accesa supera la parete graduata`);
  });
});

check('i lampioni nascono dal glifo L, solo sulla fascia civica, mai sotto un landmark', () => {
  const rows = GAME.Maps.town.rows;
  const cells = Dusk.lampCells();
  assert.ok(cells.length >= 3, 'almeno tre lampioni sulla fascia civica');
  cells.forEach(([tx, ty]) => {
    assert.strictEqual(rows[ty].charAt(tx), 'L', `(${tx},${ty}) e' davvero un lampione`);
    assert.ok(ty >= Dusk.constants.lampRows[0] && ty <= Dusk.constants.lampRows[1],
      `(${tx},${ty}) dentro le righe ${Dusk.constants.lampRows}`);
    assert.ok(tx >= Dusk.constants.lampCols[0] && tx <= Dusk.constants.lampCols[1],
      `(${tx},${ty}) dentro le colonne ${Dusk.constants.lampCols}`);
    STRUCTS.forEach((d) => {
      const b = boundsById[d.id];
      const covered = tx * 16 + 16 > b.x0 && tx * 16 < b.x1 && ty * 16 + 16 > b.y0 && ty * 16 < b.y1;
      assert.ok(!covered, `(${tx},${ty}) non e' coperto da ${d.id}`);
    });
  });
  /* Il lampione (10,16) sta dietro la massa del distretto: la sua pozza
   * finirebbe sospesa sul tetto. */
  assert.ok(!cells.some(([tx, ty]) => tx === 10 && ty === 16),
    'il lampione dietro il distretto resta escluso');
});

console.log('town-dusk: hook');

check('l\'hook grada e disegna solo per town, e delega per ogni altra mappa', () => {
  const calls = [];
  function ctxStub(mapTag) {
    return {
      tag: mapTag, ops: [],
      canvas: { width: 256, height: 192 },
      getImageData(x, y, w, h) {
        this.ops.push('getImageData');
        return { data: new Uint8ClampedArray(w * h * 4).fill(200), width: w, height: h };
      },
      putImageData() { this.ops.push('putImageData'); },
      set fillStyle(v) { this._f = v; },
      get fillStyle() { return this._f; },
      fillRect(x, y, w, h) { this.ops.push(['fillRect', x, y, w, h, this._f]); }
    };
  }
  const townCtx = ctxStub('town');
  GAME.Retro2D.limitBackgroundPalettes(townCtx, 0, 0, 256, 192, 'town');
  assert.ok(townCtx.ops.includes('getImageData'), 'town: il grade legge il framebuffer');
  assert.ok(townCtx.ops.some((o) => Array.isArray(o) && o[0] === 'fillRect'),
    'town: i practicals disegnano');

  const otherCtx = ctxStub('woods');
  GAME.Retro2D.limitBackgroundPalettes(otherCtx, 0, 0, 256, 192, 'woods');
  assert.ok(!otherCtx.ops.some((o) => Array.isArray(o) && o[0] === 'fillRect'),
    'fuori da town l\'overlay non disegna nulla');
  calls.push(1);
});

check('applyGrade usa la curva asfalto solo dentro le tile di strada', () => {
  const w = 32, h = 16;
  const data = new Uint8ClampedArray(w * h * 4);
  const cream = px('#e8d08f');
  for (let i = 0; i < data.length; i += 4) {
    data[i] = cream[0]; data[i + 1] = cream[1]; data[i + 2] = cream[2]; data[i + 3] = 255;
  }
  const image = { data, width: w, height: h };
  const ctx = {
    getImageData: () => image,
    putImageData: () => {}
  };
  /* Riga 17: la colonna 26 e' marciapiede, la 27 e' la strada verticale.
   * Il viewport copre entrambe, quindi la maschera va provata sul confine. */
  assert.strictEqual(GAME.Maps.town.rows[17].charAt(26), '=', 'colonna 26 riga 17 e\' marciapiede');
  assert.strictEqual(GAME.Maps.town.rows[17].charAt(27), 'r', 'colonna 27 riga 17 e\' strada');
  Dusk.applyGrade(ctx, 26 * 16, 17 * 16, w, h);
  const at = (x, y) => [data[(y * w + x) * 4], data[(y * w + x) * 4 + 1], data[(y * w + x) * 4 + 2]];
  inBand(at(4, 8), px('#6f6d64'), px('#7a766c'), 'pixel fuori dalla tile di strada');
  within(at(20, 8), px('#485665'), 12, 'pixel dentro la tile di strada');
});

console.log(`\ntown-dusk: ${checks} check ok`);
