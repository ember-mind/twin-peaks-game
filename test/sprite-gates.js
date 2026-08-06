#!/usr/bin/env node
'use strict';

/* test/sprite-gates.js — misure sugli sprite dei personaggi, senza sfondo.
 *
 * I gate del contratto R62 (profilo, collo, spalle, budget colore, contorno)
 * riguardano l'OBJ, non il frame composito: su una cattura 160x144 i colori
 * del terreno entrano in ogni tile e falsano sia il conteggio colori sia la
 * maschera. Qui drawChar() dipinge su un ctx finto che registra i fillRect,
 * quindi la maschera e' esattamente quella dell'OBJ, come la vedrebbe
 * l'hardware.
 *
 * Uso:
 *   node test/sprite-gates.js               # tutto il cast, riassunto
 *   node test/sprite-gates.js --char=cooper --verbose
 *   node test/sprite-gates.js --json
 */

const path = require('node:path');
const fs = require('node:fs');

const root = path.resolve(__dirname, '..');
const W = 40, H = 40, OX = 12, OY = 10;   // margine ampio: l'overflow si vede

function loadGame() {
  global.window = global;
  require(path.join(root, 'js', 'chars.js'));
  const GAME = global.GAME;
  GAME.Sprites = { CHARS: GAME.sprites.CHARS, drawTile: function () {} };
  GAME.maps = { maps: {} };
  require(path.join(root, 'js', 'retro-authored.js'));
  return GAME;
}

function makeCtx() {
  const px = new Array(W * H).fill(null);
  return {
    globalAlpha: 1,
    fillStyle: '#000000',
    px,
    fillRect(x, y, w, h) {
      const col = normHex(this.fillStyle);
      if (col === null) return;                       // rgba(...) = ombra, ignorata
      x = Math.round(x); y = Math.round(y);
      for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) {
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          px[yy * W + xx] = col;
        }
      }
    }
  };
}

function normHex(s) {
  s = String(s || '');
  if (s.charAt(0) !== '#') return null;
  let raw = s.slice(1);
  if (raw.length === 3) raw = raw.replace(/(.)/g, '$1$1');
  if (raw.length !== 6) return null;
  return '#' + raw.toLowerCase();
}

function luma(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
}

function render(GAME, name, dir, frame, moving, night) {
  const ctx = makeCtx();
  GAME.Sprites.drawChar(ctx, OX, OY, GAME.Sprites.CHARS[name], dir, frame, 1, !!moving, !!night, 0);
  return ctx.px;
}

function stats(px) {
  let minX = W, maxX = -1, minY = H, maxY = -1, mass = 0;
  const counts = new Map();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = px[y * W + x];
    if (!v) continue;
    mass++;
    counts.set(v, (counts.get(v) || 0) + 1);
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  const colors = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  let darkest = null;
  for (const [hex] of colors) if (!darkest || luma(hex) < luma(darkest)) darkest = hex;
  const darkPct = darkest ? +(100 * counts.get(darkest) / mass).toFixed(1) : 0;
  return {
    bbox: [minX, minY, maxX, maxY],
    width: maxX - minX + 1, height: maxY - minY + 1, mass,
    colorCount: colors.length,
    colors: colors.map(([hex, n]) => [hex, n]),
    darkest, darkPct,
    darkestIsBlack: darkest === '#000000'
  };
}

/* Contorno chiuso: fra i pixel della maschera che confinano (4-vicini) con il
 * vuoto, quanti sono del tono piu' scuro. E' la definizione usata dal critico:
 * un buco nel contorno e' un pixel di riempimento affacciato sullo sfondo. */
function outlineClosure(px, darkest) {
  let border = 0, ink = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = px[y * W + x];
    if (!v) continue;
    const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx < 0 || ny < 0 || nx >= W || ny >= H || !px[ny * W + nx];
    });
    if (!n) continue;
    border++;
    if (v === darkest) ink++;
  }
  return { borderPixels: border, inkBorder: ink, closedPct: +(100 * ink / (border || 1)).toFixed(1) };
}

/* Disciplina per tile 8x8, sulla griglia dell'OBJ (ancorata all'origine dello
 * sprite): l'hardware GBC vede quattro tile 8x8, non la griglia dello schermo. */
function tileColors(px, bbox) {
  const gx = Math.floor(bbox[0] / 8) * 8, gy = Math.floor(bbox[1] / 8) * 8;
  let worst = 0; const tiles = [];
  for (let ty = gy; ty <= bbox[3]; ty += 8) {
    for (let tx = gx; tx <= bbox[2]; tx += 8) {
      const set = new Set();
      for (let y = ty; y < ty + 8; y++) for (let x = tx; x < tx + 8; x++) {
        const v = px[y * W + x]; if (v) set.add(v);
      }
      if (set.size) { tiles.push(set.size); if (set.size > worst) worst = set.size; }
    }
  }
  return { tiles: tiles.length, maxColorsPerTile: worst };
}

/* --- R63: dettaglio DENTRO la sagoma -------------------------------
 *
 * Le misure qui sotto riproducono quelle del critico su pret/pokecrystal
 * (gfx/sprites/*.png, 16x96). Verificate: chris down 0,473 · kris down 0,574
 * · gramps down 0,539 · officer down 0,430 · youngster up 0,240; righe nere
 * chris 3/16, kris 2/16, gramps 2/16; righe-testa identiche max in Oro 4/8
 * (gentleman/officer). Stessa formula qui e nel critico: stesso numero. */

/* Densita' di stacco interno: coppie di pixel adiacenti (destra e sotto)
 * ENTRAMBI dentro la sagoma, quante hanno colore diverso. Il contorno verso
 * il vuoto non conta: e' dettaglio interno, non profilo. */
function internalContrast(px) {
  let pairs = 0, diff = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = px[y * W + x];
    if (!a) continue;
    if (x + 1 < W && px[y * W + x + 1]) { pairs++; if (px[y * W + x + 1] !== a) diff++; }
    if (y + 1 < H && px[(y + 1) * W + x]) { pairs++; if (px[(y + 1) * W + x] !== a) diff++; }
  }
  return +(diff / (pairs || 1)).toFixed(3);
}

/* Righe interamente nere: righe della sagoma in cui ogni pixel e' del tono
 * piu' scuro. In Oro chris 3, kris 2, gramps 2 su 16. */
function blackRows(px, bbox, darkest) {
  let n = 0;
  for (let y = bbox[1]; y <= bbox[3]; y++) {
    let any = false, allInk = true;
    for (let x = bbox[0]; x <= bbox[2]; x++) {
      const v = px[y * W + x];
      if (!v) continue;
      any = true;
      if (v !== darkest) { allInk = false; break; }
    }
    if (any && allInk) n++;
  }
  return n;
}

/* Gradini di contorno: quante volte il bordo sinistro e quante volte il bordo
 * destro cambiano colonna, riga per riga. Sui side frame di Oro: chris 18,
 * kris 19, gramps 17, officer 15, gentleman 17, cooltrainer_m 18. */
function contourSteps(px, bbox) {
  let prev = null, n = 0;
  for (let y = bbox[1]; y <= bbox[3]; y++) {
    let lo = -1, hi = -1;
    for (let x = bbox[0]; x <= bbox[2]; x++) if (px[y * W + x]) { if (lo < 0) lo = x; hi = x; }
    if (lo < 0) continue;
    if (prev) { if (lo !== prev[0]) n++; if (hi !== prev[1]) n++; }
    prev = [lo, hi];
  }
  return n;
}

/* Le quattro tile 8x8 dell'OBJ, ancorate all'origine dello sprite (x = OX,
 * y = prima riga piena). In Oro tutti e quattro i tile portano 3 toni. */
function objTiles(px, bbox) {
  const y0 = bbox[1], counts = [];
  for (const ty of [y0, y0 + 8]) for (const tx of [OX, OX + 8]) {
    const set = new Set();
    for (let y = ty; y < ty + 8; y++) for (let x = tx; x < tx + 8; x++) {
      if (y < 0 || y >= H || x < 0 || x >= W) continue;
      const v = px[y * W + x]; if (v) set.add(v);
    }
    counts.push(set.size);
  }
  return { objTileTones: counts, minObjTileTones: Math.min(...counts) };
}

/* Firma della testa: le prime 8 righe piene, codificate per CLASSE di tono
 * (vuoto / piu' scuro / medio / piu' chiaro), non per colore. Due
 * personaggi con incarnati diversi ma lo stesso stampo risultano uguali,
 * che e' esattamente il difetto misurato. */
function headSignature(px, bbox) {
  const order = [];
  for (let y = bbox[1]; y <= bbox[3]; y++) for (let x = bbox[0]; x <= bbox[2]; x++) {
    const v = px[y * W + x]; if (v && order.indexOf(v) < 0) order.push(v);
  }
  order.sort((a, b) => luma(a) - luma(b));
  const cls = (v) => (!v ? '.' : (order.indexOf(v) === 0 ? '#' : (order.indexOf(v) === order.length - 1 ? 'o' : '+')));
  const rows = [];
  for (let y = bbox[1]; y <= bbox[3] && rows.length < 8; y++) {
    let s = '';
    for (let x = OX; x < OX + 16; x++) s += cls(px[y * W + x]);
    rows.push(s);
  }
  return rows;
}

/* Le due righe piu' basse della sagoma, codificate come sopra: servono a
 * verificare che i piedi di profilo NON siano il fotogramma frontale. */
function footSignature(px, bbox) {
  const rows = [];
  for (let y = bbox[3] - 1; y <= bbox[3]; y++) {
    let s = '';
    for (let x = OX; x < OX + 16; x++) s += (px[y * W + x] ? '#' : '.');
    rows.push(s);
  }
  return rows.join('/');
}

function maskIou(a, b) {
  let inter = 0, union = 0;
  for (let i = 0; i < a.length; i++) {
    const ma = a[i] ? 1 : 0, mb = b[i] ? 1 : 0;
    if (ma || mb) union++;
    if (ma && mb) inter++;
  }
  return +(inter / (union || 1)).toFixed(3);
}

/* Collo e spalle. La testa e' la banda di righe sopra la prima riga che
 * contiene il colore dell'abito (o, se l'abito manca, la meta' alta).
 * Il collo e' la riga piu' stretta fra la riga piu' larga della testa e la
 * riga piu' larga delle spalle: la stessa lettura del critico su chris. */
function rowWidths(px, bbox) {
  const out = [];
  for (let y = bbox[1]; y <= bbox[3]; y++) {
    let lo = -1, hi = -1;
    for (let x = bbox[0]; x <= bbox[2]; x++) if (px[y * W + x]) { if (lo < 0) lo = x; hi = x; }
    out.push(lo < 0 ? 0 : hi - lo + 1);
  }
  return out;
}

function anatomy(px, bbox) {
  const w = rowWidths(px, bbox);
  // La testa e' la banda in cima: si scende fino al primo minimo locale che
  // poi risale. Quel minimo e' il collo, la risalita e' la linea delle spalle.
  let i = 0, headW = w[0];
  while (i + 1 < w.length && !(w[i + 1] > w[i] && w[i] < headW)) { i++; headW = Math.max(headW, w[i]); }
  const neckW = w[i];
  // Le spalle sono il massimo della risalita che segue il collo: e' la stessa
  // lettura con cui il critico ha misurato "10 contro 12" sullo sprite vecchio.
  let j = i + 1;
  while (j + 1 < w.length && w[j + 1] >= w[j]) j++;
  const shoulderW = Math.max(...w.slice(Math.min(i + 1, w.length - 1), j + 1));
  const torsoMax = Math.max(...w.slice(i + 1));
  return {
    rowWidths: w, headW, neckW, shoulderW, torsoMax, neckRow: i,
    neckPct: +(100 * neckW / headW).toFixed(1),
    shoulderVsHead: shoulderW - headW
  };
}

const args = new Map(process.argv.slice(2).map((a) => {
  const m = /^--([a-z-]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
}));

const GAME = loadGame();

if (args.has('art')) {
  const who = String(args.get('char') || 'cooper').split(',');
  const key = { }; // stampa la matrice: # = nero, + = accento, . = incarnato, spazio = vuoto
  for (const name of who) {
    const frames = ['down', 'up', 'right'].map((d) => {
      const px = render(GAME, name, d, args.has('walk') ? 1 : 0, args.has('walk'), false);
      const s = stats(px);
      const acc = s.colors.map(([h]) => h).filter((h) => h !== '#000000')
        .sort((a, b) => luma(a) - luma(b));
      return { px, dark: '#000000', acc: acc[0], skin: acc[1] };
    });
    console.log('\n=== ' + name + ' ===   down / up / right');
    for (let y = 4; y < 30; y++) {
      let line = '';
      for (const f of frames) {
        for (let x = 9; x < 31; x++) {
          const v = f.px[y * W + x];
          line += v === null ? ' ' : (v === '#000000' ? '#' : (v === f.acc ? '+' : '.'));
        }
        line += ' | ';
      }
      if (line.trim() !== '|  |  |') console.log(line);
    }
  }
  process.exit(0);
}
const names = args.get('char') ? String(args.get('char')).split(',') : Object.keys(GAME.Sprites.CHARS);
const report = [];

for (const name of names) {
  const row = { name, dirs: {} };
  const masks = {};
  for (const dir of ['down', 'up', 'left', 'right']) {
    for (const night of [false, true]) {
      for (const frame of [0, 1]) {
        const moving = frame === 1;
        const px = render(GAME, name, dir, frame, moving, night);
        const s = stats(px);
        const key = dir + (night ? '-night' : '') + (moving ? '-walk' : '');
        masks[key] = px;
        row.dirs[key] = Object.assign(s, outlineClosure(px, s.darkest), tileColors(px, s.bbox),
          objTiles(px, s.bbox), anatomy(px, s.bbox), {
            contrast: internalContrast(px),
            blackRows: blackRows(px, s.bbox, s.darkest),
            steps: contourSteps(px, s.bbox),
            feet: footSignature(px, s.bbox)
          });
      }
    }
  }
  row.headSig = headSignature(masks.down, row.dirs.down.bbox);
  /* Rampa di valore: distanza di luminanza fra i due toni NON neri. In Oro
   * la rampa e' 0 / 85 / 170, cioe' sempre 85. */
  {
    const lit = row.dirs.down.colors.map(([hex]) => hex).filter((h) => h !== '#000000')
      .sort((a, b) => luma(a) - luma(b));
    row.toneGap = lit.length >= 2 ? +(luma(lit[lit.length - 1]) - luma(lit[0])).toFixed(1) : 0;
    row.tones = lit;
  }
  row.feetFrontVsSide = row.dirs.down.feet === row.dirs.right.feet;
  row.iouFrontSide = maskIou(masks.down, masks.right);
  row.iouFrontSideLeft = maskIou(masks.down, masks.left);
  row.iouFrontBack = maskIou(masks.down, masks.up);
  row.sideMassPct = +(100 * row.dirs.right.mass / row.dirs.down.mass).toFixed(1);
  row.nightIdentical = ['down', 'up', 'left', 'right'].every((d) => {
    const a = masks[d], b = masks[d + '-night'];
    return a.every((v, i) => v === b[i]);
  });
  report.push(row);
}

if (args.has('json')) { console.log(JSON.stringify(report, null, 2)); process.exit(0); }

const F = (v, n = 1) => (typeof v === 'number' ? v.toFixed(n) : String(v));
console.log('nome        IoU F/L  lato/fr%  collo%  spalle-testa  colori  nero%  nero?  tile  contorno%  notte=giorno');
let worstClosure = 100, maxColors = 0, maxTile = 0, minDark = 100, worstNeck = 999, worstShoulder = 999, maxIou = 0;
for (const r of report) {
  const d = r.dirs.down;
  let cl = 100, cols = 0, tile = 0, dark = 100, neck = 999, sh = 999;
  for (const k of Object.keys(r.dirs)) {
    const x = r.dirs[k];
    cl = Math.min(cl, x.closedPct); cols = Math.max(cols, x.colorCount);
    tile = Math.max(tile, x.maxColorsPerTile); dark = Math.min(dark, x.darkPct);
    neck = Math.min(neck, x.neckPct); sh = Math.min(sh, x.shoulderVsHead);
  }
  worstClosure = Math.min(worstClosure, cl); maxColors = Math.max(maxColors, cols);
  maxTile = Math.max(maxTile, tile); minDark = Math.min(minDark, dark);
  worstNeck = Math.min(worstNeck, neck); worstShoulder = Math.min(worstShoulder, sh);
  maxIou = Math.max(maxIou, r.iouFrontSide, r.iouFrontSideLeft);
  console.log(
    r.name.padEnd(11) + F(r.iouFrontSide, 3).padStart(7) + F(r.sideMassPct).padStart(10) +
    F(neck).padStart(8) + String(sh).padStart(14) + String(cols).padStart(8) +
    F(dark).padStart(7) + (r.dirs.down.darkestIsBlack ? '   si' : '   NO') +
    String(tile).padStart(6) + F(cl).padStart(11) + (r.nightIdentical ? '      si' : '      NO'));
}
console.log('\n--- peggior caso su ' + report.length + ' personaggi ---');
console.log('IoU fronte/lato max      ' + F(maxIou, 3) + '   (gate <= 0,80)');
console.log('collo/testa min          ' + F(worstNeck) + ' %  (gate >= 71 %)');
console.log('spalle - testa min       ' + worstShoulder + ' px  (gate >= 0)');
console.log('colori per sprite max    ' + maxColors + '     (gate <= 3)');
console.log('colori per tile 8x8 max  ' + maxTile + '     (gate <= 3)');
console.log('massa tono scuro min     ' + F(minDark) + ' %  (gate >= 50 %)');
console.log('contorno chiuso min      ' + F(worstClosure) + ' %  (gate >= 95 %)');
console.log('notte identica al giorno ' + report.every((r) => r.nightIdentical));
{
  /* gate R62.1: il profilo e' piu' stretto e piu' leggero del frontale */
  let sw = 0, fw = 0, sm = 0;
  for (const r of report) for (const k of Object.keys(r.dirs)) {
    if (/^(left|right)/.test(k)) sw = Math.max(sw, r.dirs[k].width);
    else fw = Math.max(fw, r.dirs[k].width);
    sm = Math.max(sm, r.sideMassPct);
  }
  console.log('larghezza profilo max    ' + sw + ' px  (gate <= 10, frontale ' + fw + ')');
  console.log('massa profilo / fronte   ' + F(sm) + ' %  (gate <= 80 %)');
}

/* --- R63 -------------------------------------------------------------- */

const FRONT = ['down', 'down-walk'], BACK = ['up', 'up-walk'],
  SIDE = ['left', 'left-walk', 'right', 'right-walk'];
function worstOf(keys, pick) {
  let w = Infinity, who = '';
  for (const r of report) for (const k of keys) {
    const v = pick(r.dirs[k]);
    if (v < w) { w = v; who = r.name + '/' + k; }
  }
  return { v: w, who };
}
function maxOf(keys, pick) {
  let w = -Infinity, who = '';
  for (const r of report) for (const k of keys) {
    const v = pick(r.dirs[k]);
    if (v > w) { w = v; who = r.name + '/' + k; }
  }
  return { v: w, who };
}

const cFront = worstOf(FRONT, (d) => d.contrast);
const cSide = worstOf(SIDE, (d) => d.contrast);
const cBack = worstOf(BACK, (d) => d.contrast);
const allKeys = Object.keys(report[0].dirs);
const blk = maxOf(allKeys, (d) => d.blackRows);
const stp = worstOf(SIDE, (d) => d.steps);
const tile3 = worstOf(allKeys, (d) => d.minObjTileTones);
let gap = { v: Infinity, who: '' };
for (const r of report) if (r.toneGap < gap.v) gap = { v: r.toneGap, who: r.name };
let headPair = { v: -1, who: '' };
for (let i = 0; i < report.length; i++) for (let j = i + 1; j < report.length; j++) {
  const a = report[i].headSig, b = report[j].headSig;
  let n = 0;
  for (let k = 0; k < Math.min(a.length, b.length); k++) if (a[k] === b[k]) n++;
  if (n > headPair.v) headPair = { v: n, who: report[i].name + '/' + report[j].name };
}
const feetSame = report.filter((r) => r.feetFrontVsSide).map((r) => r.name);

const G = (ok) => (ok ? 'OK  ' : 'NO  ');
console.log('\n--- R63, dettaglio interno (peggior caso sul cast) ---');
console.log(G(cFront.v >= 0.36) + 'stacco interno fronte   ' + F(cFront.v, 3) + '  (gate >= 0,360)  ' + cFront.who);
console.log(G(cSide.v >= 0.36) + 'stacco interno profilo  ' + F(cSide.v, 3) + '  (gate >= 0,360)  ' + cSide.who);
console.log(G(cBack.v >= 0.30) + 'stacco interno retro    ' + F(cBack.v, 3) + '  (gate >= 0,300)  ' + cBack.who);
console.log(G(blk.v <= 3) + 'righe interamente nere  ' + blk.v + '/16   (gate <= 3)      ' + blk.who);
console.log(G(headPair.v <= 4) + 'righe-testa identiche   ' + headPair.v + '/8    (gate <= 4)      ' + headPair.who);
console.log(G(gap.v >= 70) + 'rampa: toni non-neri    ' + F(gap.v) + '   (gate >= 70)     ' + gap.who);
console.log(G(stp.v >= 13) + 'gradini contorno lato   ' + stp.v + '     (gate >= 13)     ' + stp.who);
console.log(G(tile3.v >= 3) + 'toni nel tile 8x8 min   ' + tile3.v + '     (gate = 3)      ' + tile3.who);
console.log(G(feetSame.length === 0) + 'piedi lato = frontale   ' + (feetSame.length ? feetSame.join(',') : 'nessuno') + '   (gate: nessuno)');
