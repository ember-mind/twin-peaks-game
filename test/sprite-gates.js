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
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const W = 40, H = 40, OX = 12, OY = 10;   // margine ampio: l'overflow si vede

function loadGame() {
  global.window = global;
  require(path.join(root, 'js', 'chars.js'));
  const GAME = global.GAME;
  GAME.Sprites = { CHARS: GAME.sprites.CHARS, drawTile: function () {} };
  GAME.maps = { maps: {} };
  require(path.join(root, 'js', 'retro-cast-matrices-a.js'));
  require(path.join(root, 'js', 'retro-cast-matrices-b.js'));
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
  const width = maxX - minX + 1, height = maxY - minY + 1;
  let upperMass = 0, lowerMass = 0;
  const splitY = minY + Math.ceil(height / 2);
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    if (!px[y * W + x]) continue;
    if (y < splitY) upperMass++; else lowerMass++;
  }
  const seen = new Uint8Array(px.length), components = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const start = y * W + x;
    if (!px[start] || seen[start]) continue;
    const stack = [start]; seen[start] = 1; let size = 0;
    while (stack.length) {
      const pos = stack.pop(), cy = Math.floor(pos / W), cx = pos % W; size++;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const next = ny * W + nx;
        if (px[next] && !seen[next]) { seen[next] = 1; stack.push(next); }
      }
    }
    components.push(size);
  }
  components.sort((a, b) => b - a);
  return {
    bbox: [minX, minY, maxX, maxY],
    width, height, mass,
    fillPct: +(100 * mass / (width * height || 1)).toFixed(1),
    upperLower: +(upperMass / (lowerMass || 1)).toFixed(2),
    contained16: minX >= OX && maxX < OX + 16 && minY >= OY && maxY < OY + 16,
    baseline15: maxY === OY + 15,
    colorCount: colors.length,
    colors: colors.map(([hex, n]) => [hex, n]),
    darkest, darkPct,
    components,
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

/* Quota di pixel dentro componenti 4-connesse da 1–2 px DELLO STESSO TONO.
 * Reference Crystal (24 umani): mediana 13,5 %. Il vecchio atlante ridotto
 * con point sampling arrivava a 31,2 %: rumore, non dettaglio. */
function tinyClusterPct(px) {
  const seen = new Uint8Array(px.length);
  let mass = 0, tiny = 0;
  for (const v of px) if (v) mass++;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const start = y * W + x, tone = px[start];
    if (!tone || seen[start]) continue;
    const stack = [start]; seen[start] = 1; let n = 0;
    while (stack.length) {
      const pos = stack.pop(), cy = Math.floor(pos / W), cx = pos % W; n++;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const np = ny * W + nx;
        if (!seen[np] && px[np] === tone) { seen[np] = 1; stack.push(np); }
      }
    }
    if (n <= 2) tiny += n;
  }
  return +(100 * tiny / (mass || 1)).toFixed(1);
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

function maskSignature(px) {
  let s = '';
  for (let y = OY; y < OY + 16; y++) {
    for (let x = OX; x < OX + 16; x++) s += px[y * W + x] ? '1' : '0';
  }
  return s;
}

function signatureIou(a, b) {
  let inter = 0, union = 0;
  for (let i = 0; i < a.length; i++) {
    const aa = a.charAt(i) === '1', bb = b.charAt(i) === '1';
    if (aa || bb) union++;
    if (aa && bb) inter++;
  }
  return inter / (union || 1);
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
const fullCast = !args.get('char');
if (fullCast) {
  assert.equal(names.length, 24, 'production cast inventory');
  for (const name of names) {
    const sig = GAME.Sprites.CHARS[name].pixel16;
    assert(sig && sig.down && sig.up && sig.side && !sig.left, name + ' requires down/up/side pixel16 signatures only');
  }
}
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
            tinyClusterPct: tinyClusterPct(px),
            blackRows: blackRows(px, s.bbox, s.darkest),
            steps: contourSteps(px, s.bbox),
            feet: footSignature(px, s.bbox)
          });
      }
    }
  }
  row.headSig = headSignature(masks.down, row.dirs.down.bbox);
  row.maskSig = {
    down: maskSignature(masks.down),
    up: maskSignature(masks.up),
    side: maskSignature(masks.right)
  };
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

/* JSON is formatting, never a bypass: assertions below always execute. */
const jsonMode = args.has('json');
const realConsoleLog = console.log;
if (jsonMode) console.log = function () {};

const F = (v, n = 1) => (typeof v === 'number' ? v.toFixed(n) : String(v));
console.log('nome        IoU F/L  lato/fr%  collo%  spalle-testa  colori  nero%  nero?  tile  contorno%  notte=giorno');
let worstClosure = 100, maxColors = 0, maxTile = 0, minDark = 100, worstNeck = 999, worstShoulder = 999, maxIou = 0;
let minIou = 999, minSideMass = 999, maxSideMass = 0, minFrontW = 999, maxFrontW = 0,
  minSideW = 999, maxSideW = 0, maxTiny = 0, maxHeight = 0;
const containmentFailures = [], baselineFailures = [], componentFailures = [];
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
  minIou = Math.min(minIou, r.iouFrontSide, r.iouFrontSideLeft);
  minSideMass = Math.min(minSideMass, r.sideMassPct); maxSideMass = Math.max(maxSideMass, r.sideMassPct);
  minFrontW = Math.min(minFrontW, r.dirs.down.width, r.dirs.up.width);
  maxFrontW = Math.max(maxFrontW, r.dirs.down.width, r.dirs.up.width);
  minSideW = Math.min(minSideW, r.dirs.left.width, r.dirs.right.width);
  maxSideW = Math.max(maxSideW, r.dirs.left.width, r.dirs.right.width);
  for (const k of Object.keys(r.dirs)) {
    const state = r.dirs[k];
    maxTiny = Math.max(maxTiny, state.tinyClusterPct);
    maxHeight = Math.max(maxHeight, state.height);
    if (!state.contained16) containmentFailures.push(r.name + '/' + k + '=' + state.bbox.join(','));
    if (!state.baseline15) baselineFailures.push(r.name + '/' + k + '=y' + state.bbox[3]);
    if (state.components.length !== 1) componentFailures.push(r.name + '/' + k + '=' + state.components.join(','));
  }
  console.log(
    r.name.padEnd(11) + F(r.iouFrontSide, 3).padStart(7) + F(r.sideMassPct).padStart(10) +
    F(neck).padStart(8) + String(sh).padStart(14) + String(cols).padStart(8) +
    F(dark).padStart(7) + (r.dirs.down.darkestIsBlack ? '   si' : '   NO') +
    String(tile).padStart(6) + F(cl).padStart(11) + (r.nightIdentical ? '      si' : '      NO'));
}
console.log('\n--- peggior caso su ' + report.length + ' personaggi ---');
console.log('IoU fronte/lato min/max  ' + F(minIou, 3) + ' / ' + F(maxIou, 3) + '   (diagnostica; fonte mediana 0,749)');
console.log('collo/testa min          ' + F(worstNeck) + ' %  (diagnostica)');
console.log('spalle - testa min       ' + worstShoulder + ' px  (diagnostica include cappelli/chiome)');
console.log('colori per sprite max    ' + maxColors + '     (gate <= 3)');
console.log('colori per tile 8x8 max  ' + maxTile + '     (gate <= 3)');
console.log('massa tono scuro min     ' + F(minDark) + ' %  (diagnostica; nessun gate)');
console.log('contorno chiuso min      ' + F(worstClosure) + ' %  (gate >= 94,4 % · minimo Crystal)');
console.log('notte identica al giorno ' + report.every((r) => r.nightIdentical));
console.log('bbox fronte min/max      ' + minFrontW + ' / ' + maxFrontW + ' px  (bar 12–16)');
console.log('bbox profilo min/max     ' + minSideW + ' / ' + maxSideW + ' px  (bar 12–15)');
console.log('massa lato/fronte min/max ' + F(minSideMass) + ' / ' + F(maxSideMass) + ' %  (diagnostica; fonte mediana 79,5)');
console.log('micro-cluster max        ' + F(maxTiny) + ' %  (diagnostica; nessun gate)');
console.log('altezza massima          ' + maxHeight + ' px  (gate <= 16)');
console.log('overflow cella 16x16     ' + containmentFailures.length + (containmentFailures.length ? '  ' + containmentFailures.slice(0, 8).join(' · ') : ''));
console.log('baseline piedi errata    ' + baselineFailures.length + (baselineFailures.length ? '  ' + baselineFailures.slice(0, 8).join(' · ') : ''));
console.log('componenti flottanti     ' + componentFailures.length + (componentFailures.length ? '  ' + componentFailures.slice(0, 8).join(' · ') : ''));
{
  /* gate R62.1: il profilo e' piu' stretto e piu' leggero del frontale */
  let sw = 0, fw = 0, sm = 0;
  for (const r of report) for (const k of Object.keys(r.dirs)) {
    if (/^(left|right)/.test(k)) sw = Math.max(sw, r.dirs[k].width);
    else fw = Math.max(fw, r.dirs[k].width);
    sm = Math.max(sm, r.sideMassPct);
  }
  console.log('larghezza profilo max    ' + sw + ' px  (gate <= 15, frontale ' + fw + ')');
  console.log('massa profilo / fronte   ' + F(sm) + ' %  (diagnostica)');
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
const tinySamples = report.flatMap((r) => Object.entries(r.dirs)
  .filter(([key]) => !key.includes('night'))
  .map(([, d]) => d.tinyClusterPct)).sort((a, b) => a - b);
const tinyMedian = tinySamples[Math.floor(tinySamples.length / 2)];
const tinyP90 = tinySamples[Math.floor(tinySamples.length * 0.9)];

function mirroredCell(a, b) {
  for (let y = 0; y < H; y++) for (let x = 0; x < 16; x++) {
    if (a[y * W + OX + x] !== b[y * W + OX + 15 - x]) return false;
  }
  return true;
}
function sameCell(a, b) {
  for (let y = 0; y < H; y++) for (let x = 0; x < 16; x++) {
    if (a[y * W + OX + x] !== b[y * W + OX + x]) return false;
  }
  return true;
}
function differentCell(a, b) { return !sameCell(a, b); }
let gaitPass = true;
const gaitFailures = [];
const gaitFailureReasons = [];
for (const r of report) {
  const name = r.name;
  const downIdle = render(GAME, name, 'down', 0, false, false);
  const upIdle = render(GAME, name, 'up', 0, false, false);
  const rightIdle = render(GAME, name, 'right', 0, false, false);
  const leftIdle = render(GAME, name, 'left', 0, false, false);
  const downA = render(GAME, name, 'down', 1, true, false);
  const upA = render(GAME, name, 'up', 1, true, false);
  const rightStep = render(GAME, name, 'right', 1, true, false);
  const cadenceChecks = {
    downContact0: sameCell(downIdle, render(GAME, name, 'down', 0, true, false)),
    downContact2: sameCell(downIdle, render(GAME, name, 'down', 2, true, false)),
    downStepExists: differentCell(downIdle, downA),
    downStepMirror: mirroredCell(downA, render(GAME, name, 'down', 3, true, false)),
    upContact0: sameCell(upIdle, render(GAME, name, 'up', 0, true, false)),
    upContact2: sameCell(upIdle, render(GAME, name, 'up', 2, true, false)),
    upStepExists: differentCell(upIdle, upA),
    upStepMirror: mirroredCell(upA, render(GAME, name, 'up', 3, true, false)),
    sideContact0: sameCell(rightIdle, render(GAME, name, 'right', 0, true, false)),
    sideContact2: sameCell(rightIdle, render(GAME, name, 'right', 2, true, false)),
    sideStepExists: differentCell(rightIdle, rightStep),
    sideStepReuse: sameCell(rightStep, render(GAME, name, 'right', 3, true, false)),
    leftIdleMirror: mirroredCell(rightIdle, leftIdle),
    leftStepAMirror: mirroredCell(rightStep, render(GAME, name, 'left', 1, true, false)),
    leftStepBMirror: mirroredCell(rightStep, render(GAME, name, 'left', 3, true, false))
  };
  const failedCadenceChecks = Object.keys(cadenceChecks).filter((key) => !cadenceChecks[key]);
  const actorGaitPass = failedCadenceChecks.length === 0;
  gaitPass = gaitPass && actorGaitPass;
  if (!actorGaitPass) {
    gaitFailures.push(name);
    gaitFailureReasons.push(name + ':' + failedCadenceChecks.join('|'));
  }
}

/* R101b — identita' del Gigante. La statura non puo' dipendere da una
 * traslazione invisibile dentro la cella: testa stretta, spalle frontali
 * nettamente piu' larghe e profilo che cresce dalla testa al busto. */
const giant = report.find((r) => r.name === 'giant');
const maddy = report.find((r) => r.name === 'maddy');
const giantFrontRows = giant ? giant.dirs.down.rowWidths : [];
const giantSideRows = giant ? giant.dirs.right.rowWidths : [];
const giantShapePass = !!giant && giant.dirs.down.height === 16 && giant.dirs.right.height === 16 &&
  giant.dirs.down.headW <= 10 && giant.dirs.down.shoulderW - giant.dirs.down.headW >= 4 &&
  Math.max(...giantSideRows.slice(0, 8)) <= 9 && Math.max(...giantSideRows.slice(8)) >= 11;
const maddyShapePass = !!maddy && ['down', 'down-walk', 'up', 'up-walk'].every((key) =>
  maddy.dirs[key].neckPct >= 71 && maddy.dirs[key].shoulderVsHead >= 0);
const viewUniqueness = {};
let crossActorIou = { v: -1, who: '', view: '' };
const crossActorPairs = [];
for (const view of ['down', 'up', 'side']) {
  viewUniqueness[view] = new Set(report.map((r) => r.maskSig[view])).size;
  for (let i = 0; i < report.length; i++) for (let j = i + 1; j < report.length; j++) {
    const v = signatureIou(report[i].maskSig[view], report[j].maskSig[view]);
    crossActorPairs.push({ v, who: report[i].name + '/' + report[j].name, view });
    if (v > crossActorIou.v) crossActorIou = { v, who: report[i].name + '/' + report[j].name, view };
  }
}
crossActorPairs.sort((a, b) => b.v - a.v);
const cooperRow = report.find((r) => r.name === 'cooper');
const donnaRow = report.find((r) => r.name === 'donna');
const cooperDonnaSideIou = cooperRow && donnaRow ?
  signatureIou(cooperRow.maskSig.side, donnaRow.maskSig.side) : null;

const G = (ok) => (ok ? 'OK  ' : 'NO  ');
console.log('\n--- R63, dettaglio interno (peggior caso sul cast) ---');
console.log('    stacco interno fronte   ' + F(cFront.v, 3) + '  (diagnostica)  ' + cFront.who);
console.log('    stacco interno profilo  ' + F(cSide.v, 3) + '  (diagnostica)  ' + cSide.who);
console.log('    stacco interno retro    ' + F(cBack.v, 3) + '  (diagnostica)  ' + cBack.who);
console.log('    righe interamente nere  ' + blk.v + '/16   (diagnostica)  ' + blk.who);
console.log('    righe-testa identiche   ' + headPair.v + '/8    (diagnostica)  ' + headPair.who);
console.log('    rampa: toni non-neri    ' + F(gap.v) + '   (diagnostica RGB; palette-index gate separato)  ' + gap.who);
console.log('    gradini contorno lato   ' + stp.v + '     (diagnostica; reference min 11)  ' + stp.who);
console.log('    toni nel tile 8x8 min   ' + tile3.v + '     (diagnostica: due toni sono validi)');
console.log('    piedi lato = frontale   ' + (feetSame.length ? feetSame.join(',') : 'nessuno') + '   (diagnostica)');
console.log('    ' +
  'micro-cluster med/p90/max ' + F(tinyMedian) + '/' + F(tinyP90) + '/' + F(maxTiny) +
  ' %  (diagnostica; nessun gate)');
console.log(G(gaitPass) + 'cadenza Crystal  idle→A→idle→B · down/up B mirror · side idle↔step · left mirror' +
  (gaitFailures.length ? '  FAIL: ' + gaitFailures.join(',') : ''));
if (gaitFailureReasons.length) console.log('    dettaglio cadenza      ' + gaitFailureReasons.join(' · '));
console.log(G(giantShapePass) + 'firma Gigante            testa 10/9 · spalle 14 · altezza 16');
console.log(G(maddyShapePass) + 'firma Maddy              collo 83,3% · spalle +2 px');
console.log('    silhouette uniche        ' + viewUniqueness.down + '/24 D · ' + viewUniqueness.up + '/24 U · ' + viewUniqueness.side + '/24 S  (diagnostica locale)');
console.log('    IoU massimo fra attori   ' + F(crossActorIou.v, 3) + '  ' + crossActorIou.who + '/' + crossActorIou.view + '  (diagnostica; Crystal contiene coppie IoU 1,000)');
console.log('    top 5 coppie          ' + crossActorPairs.slice(0, 5)
  .map((pair) => F(pair.v, 3) + ' ' + pair.who + '/' + pair.view).join(' · '));
if (cooperDonnaSideIou != null) console.log('    Cooper/Donna profilo    ' + F(cooperDonnaSideIou, 3) + '  (diagnostica locale)');

/* R10: precondizioni strutturali soltanto. Morfologia/identita/qualita'
 * restano gate visuali per-attore; questi numeri non producono un voto. */
assert(containmentFailures.length === 0, 'opaque pixels escape immutable 16x16 actor cell: ' + containmentFailures.slice(0, 12).join(' · '));
assert(baselineFailures.length === 0, 'feet must remain on actor-cell row 15: ' + baselineFailures.slice(0, 12).join(' · '));
assert(componentFailures.length === 0, 'actor silhouette contains detached pixel islands: ' + componentFailures.slice(0, 12).join(' · '));
assert(minFrontW >= 12 && maxFrontW <= 16, 'front/back bbox outside Crystal 12–16px bar');
assert(minSideW >= 12 && maxSideW <= 15, 'side bbox outside Crystal 12–15px bar');
assert(maxColors <= 3 && maxTile <= 3, 'OBJ must use at most three opaque tones');
assert(worstClosure >= 94.4, 'outline closure below Crystal minimum');
assert(gaitPass, 'walk transform grammar diverges from Crystal');
if (fullCast) {
  assert(giantShapePass, 'Giant must preserve elongated uncanny silhouette in front and side states');
  assert(maddyShapePass, 'Maddy must preserve human neck and shoulder proportions in front/back states');
}
console.log('\nNATIVE-CAST-R10 STRUCTURAL PASS — visual review still mandatory for all 24 actors');
if (jsonMode) {
  console.log = realConsoleLog;
  realConsoleLog(JSON.stringify({ ok: true, report }, null, 2));
}
