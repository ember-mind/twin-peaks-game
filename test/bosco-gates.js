#!/usr/bin/env node
'use strict';

/* test/bosco-gates.js — misure riproducibili su conifere, sottobosco e ciuffi
 * del tableau di arrivo. Builder e critico devono leggere lo stesso numero
 * dallo stesso codice, quindi le regioni non sono a occhio: sono derivate dal
 * frame stesso.
 *
 *   node test/bosco-gates.js artifacts/bosco/base-arrival.png
 *   node test/bosco-gates.js artifacts/reference/target.png \
 *        --mockup=18,27,5.9375 --exclude=8,55,52,94
 *
 * Regioni, definite una volta:
 *   campo          y 0..94 (sotto ci sta la finestra di dialogo)
 *   maschera bosco pixel non-crema raggiungibili (4-vicini) dalla colonna
 *                  x=0, dalla colonna x=159 o dalla riga y=94. Gli edifici
 *                  toccano solo il bordo alto, l'auto e lo sprite non toccano
 *                  nulla: restano fuori.
 *   skyline        per ogni colonna x in [20..139], la riga piu' alta della
 *                  corsa continua di bosco che arriva a y=94.
 *   ciuffi         componenti connesse (8-vicini) di non-crema nel campo,
 *                  fuori dalla maschera bosco, di area <= 16 px.
 */

const path = require('node:path');
const L = require(path.join(__dirname, 'bosco-lib.js'));

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
if (!file) { console.error('uso: bosco-gates.js <frame.png> [--mockup=ox,oy,f] [--exclude=x0,y0,x1,y1]'); process.exit(2); }
const opt = (k) => { const a = args.find((v) => v.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const jsonOut = args.includes('--json');

const W = 160, H = 144, FIELD_BOTTOM = 94;
const img = L.decodePng(path.resolve(file));
let grid;
if (opt('mockup')) {
  const [ox, oy, f] = opt('mockup').split(',').map(Number);
  grid = [];
  for (let y = 0; y < H; y++) {
    const row = [];
    for (let x = 0; x < W; x++) {
      const x0 = ox + x * f, y0 = oy + y * f, c = {};
      for (let sy = Math.ceil(y0 + f * 0.25); sy < y0 + f * 0.75; sy++)
        for (let sx = Math.ceil(x0 + f * 0.25); sx < x0 + f * 0.75; sx++) {
          if (sx < 0 || sy < 0 || sx >= img.width || sy >= img.height) continue;
          const q = L.quantize(img.px(sx, sy)); c[q] = (c[q] || 0) + 1;
        }
      let best = 'cream', bv = -1;
      for (const k in c) if (c[k] > bv) { bv = c[k]; best = k; }
      row.push(best);
    }
    grid.push(row);
  }
} else {
  if (img.width !== W || img.height !== H) throw new Error(`${file}: atteso 160x144, trovato ${img.width}x${img.height}`);
  grid = L.gridOf(img, W, H);
}

/* Zone escluse dalla misura (la scheda ritratto del mockup non e' vegetazione). */
const excluded = [];
for (const a of args) if (a.startsWith('--exclude=')) excluded.push(a.slice(10).split(',').map(Number));
const isExcluded = (x, y) => excluded.some((e) => x >= e[0] && y >= e[1] && x <= e[2] && y <= e[3]);
const at = (x, y) => (x < 0 || y < 0 || x >= W || y > FIELD_BOTTOM || isExcluded(x, y)) ? null : grid[y][x];

/* --- maschera bosco --- */
const forest = new Uint8Array(W * (FIELD_BOTTOM + 1));
{
  const stack = [];
  const push = (x, y) => {
    const c = at(x, y);
    if (c === null || c === 'cream' || forest[y * W + x]) return;
    forest[y * W + x] = 1; stack.push(x, y);
  };
  for (let y = 0; y <= FIELD_BOTTOM; y++) { push(0, y); push(W - 1, y); }
  for (let x = 0; x < W; x++) push(x, FIELD_BOTTOM);
  while (stack.length) {
    const y = stack.pop(), x = stack.pop();
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
}
const inForest = (x, y) => x >= 0 && y >= 0 && x < W && y <= FIELD_BOTTOM && forest[y * W + x] === 1;

/* --- toni dentro la maschera --- */
const tone = { T0: 0, T1: 0, T2: 0, T3: 0, cream: 0 };
let forestArea = 0;
for (let y = 0; y <= FIELD_BOTTOM; y++) for (let x = 0; x < W; x++) {
  if (!inForest(x, y)) continue;
  tone[grid[y][x]]++; forestArea++;
}
const pct = (n, d) => d ? (100 * n / d) : 0;

/* --- contorno verso il crema --- */
let border = 0, borderT0 = 0;
for (let y = 0; y <= FIELD_BOTTOM; y++) for (let x = 0; x < W; x++) {
  if (!inForest(x, y)) continue;
  let edge = false;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const c = at(x + dx, y + dy);
    if (c === 'cream') edge = true;
  }
  if (edge) { border++; if (grid[y][x] === 'T0') borderT0++; }
}

/* --- skyline della fascia inferiore ---
 * Solo le colonne che arrivano davvero a terra: dove la scheda ritratto del
 * mockup taglia la fascia, la colonna non ha skyline e spezza la corsa. */
const [SX0, SX1] = (opt('skyline') || '20,139').split(',').map(Number);
const sky = [];
for (let x = SX0; x <= SX1; x++) {
  if (!inForest(x, FIELD_BOTTOM)) { sky.push(null); continue; }
  let y = FIELD_BOTTOM;
  while (y >= 0 && inForest(x, y)) y--;
  sky.push(y + 1);
}
let plateau = 1, maxPlateau = 1;
for (let i = 1; i < sky.length; i++) {
  if (sky[i] === null || sky[i - 1] === null) { plateau = 1; continue; }
  if (sky[i] === sky[i - 1]) { plateau++; if (plateau > maxPlateau) maxPlateau = plateau; } else plateau = 1;
}
let dsum = 0, dn = 0;
for (let i = 1; i < sky.length; i++) {
  if (sky[i] === null || sky[i - 1] === null) continue;
  dsum += Math.abs(sky[i] - sky[i - 1]); dn++;
}
const skyVals = sky.filter((v) => v !== null).slice().sort((a, b) => a - b);
const skyTop = skyVals[0];
/* Il bbox della fascia parte dal 20esimo percentile della skyline, non dalla
 * punta piu' alta: con il minimo assoluto il rettangolo ingloberebbe mezza
 * radura e la percentuale di crema misurerebbe il cielo, non le tacche fra
 * un albero e l'altro. Con questa soglia il riferimento legge 17,x %. */
const skyP20 = skyVals[Math.floor(skyVals.length * 0.50)];

/* crema nel bbox della fascia inferiore */
let bboxN = 0, bboxCream = 0;
for (let y = skyP20; y <= FIELD_BOTTOM; y++) for (let x = SX0; x <= SX1; x++) {
  if (isExcluded(x, y)) continue;
  bboxN++; if (grid[y][x] === 'cream') bboxCream++;
}

/* --- run orizzontali dentro la maschera --- */
let runTot = 0, runN = 0;
for (let y = 0; y <= FIELD_BOTTOM; y++) {
  let len = 0, prev = null;
  for (let x = 0; x <= W; x++) {
    const c = (x < W && inForest(x, y)) ? grid[y][x] : null;
    if (c !== null && c === prev) len++;
    else { if (len) { runTot += len; runN++; } len = c === null ? 0 : 1; }
    prev = c;
  }
  if (len) { runTot += len; runN++; }
}

/* --- ciuffi: componenti piccole fuori dalla maschera bosco --- */
const seen = new Uint8Array(W * (FIELD_BOTTOM + 1));
const comps = [];
for (let y = 0; y <= FIELD_BOTTOM; y++) for (let x = 0; x < W; x++) {
  if (seen[y * W + x] || inForest(x, y) || at(x, y) === null || grid[y][x] === 'cream') continue;
  const st = [[x, y]]; seen[y * W + x] = 1; const px = [];
  while (st.length) {
    const [cx, cy] = st.pop(); px.push([cx, cy]);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny > FIELD_BOTTOM) continue;
      if (seen[ny * W + nx] || inForest(nx, ny) || at(nx, ny) === null || grid[ny][nx] === 'cream') continue;
      seen[ny * W + nx] = 1; st.push([nx, ny]);
    }
  }
  comps.push(px);
}
/* i grandi sono edifici / auto / sprite: fuori misura, con un margine di 3 px
 * perche' l'ombra di contatto appartiene all'oggetto, non al prato */
const big = comps.filter((c) => c.length > 16);
const banned = new Set();
for (const c of big) {
  const xs = c.map((p) => p[0]), ys = c.map((p) => p[1]);
  for (let y = Math.min(...ys) - 3; y <= Math.max(...ys) + 3; y++)
    for (let x = Math.min(...xs) - 3; x <= Math.max(...xs) + 3; x++) banned.add(x + ',' + y);
}
const tufts = comps.filter((c) => c.length <= 16 && !c.some((p) => banned.has(p[0] + ',' + p[1])));
let openArea = 0;
for (let y = 0; y <= FIELD_BOTTOM; y++) for (let x = 0; x < W; x++) {
  if (inForest(x, y) || at(x, y) === null || banned.has(x + ',' + y)) continue;
  openArea++;
}
/* Radura a rettangolo fisso: la stessa finestra su riferimento e build,
 * cosi' la copertura ciuffi e' confrontabile riga per riga. */
const [RX0, RY0, RX1, RY1] = (opt('radura') || '20,6,142,60').split(',').map(Number);
let radArea = 0, radMarks = 0;
for (let y = RY0; y <= RY1; y++) for (let x = RX0; x <= RX1; x++) {
  if (inForest(x, y) || at(x, y) === null || banned.has(x + ',' + y)) continue;
  radArea++; if (grid[y][x] !== 'cream') radMarks++;
}

let tuftPx = 0, tuftT2 = 0, singles = 0;
const sizes = {};
for (const c of tufts) {
  tuftPx += c.length; if (c.length === 1) singles++;
  sizes[c.length] = (sizes[c.length] || 0) + 1;
  for (const [x, y] of c) if (grid[y][x] === 'T2') tuftT2++;
}
const modHist = (sel) => { const h = new Array(8).fill(0); for (const c of tufts) h[sel(c) % 8]++; return h; };

const forestNoCream = forestArea - tone.cream;
const out = {
  maschera_bosco_px: forestArea,
  toni_bosco: { T0: +pct(tone.T0, forestNoCream).toFixed(1), T1: +pct(tone.T1, forestNoCream).toFixed(1), T2: +pct(tone.T2, forestNoCream).toFixed(1), T3: +pct(tone.T3, forestNoCream).toFixed(2) },
  bordo_T0_pct: +pct(borderT0, border).toFixed(1),
  bordo_px: border,
  skyline_plateau_max: maxPlateau,
  skyline_righe_per_colonna: +(dsum / dn).toFixed(2),
  skyline_top: skyTop,
  skyline_bbox_top: skyP20,
  crema_bbox_fascia_pct: +pct(bboxCream, bboxN).toFixed(1),
  run_orizzontale_medio: +(runTot / runN).toFixed(2),
  ciuffi_copertura_pct: +pct(tuftPx, openArea).toFixed(2),
  ciuffi_radura_pct: +pct(radMarks, radArea).toFixed(2),
  ciuffi_px2_per_marca: +(openArea / (tufts.length || 1)).toFixed(1),
  ciuffi_n: tufts.length,
  ciuffi_singoli_pct: +pct(singles, tufts.length).toFixed(1),
  ciuffi_T2_pct: +pct(tuftT2, tuftPx).toFixed(1),
  ciuffi_dimensioni: sizes,
  ciuffi_x_mod8: modHist((c) => c[0][0]),
  ciuffi_y_mod8: modHist((c) => c[0][1])
};

/* RIF = gli stessi campi letti da questo script su artifacts/reference/target.png
 *   node test/bosco-gates.js artifacts/reference/target.png \
 *     --mockup=18,27,5.9375 --exclude=8,55,52,94 --skyline=52,139
 * Dove la soglia del contratto e la lettura del riferimento non coincidono
 * (run orizzontale, copertura ciuffi) vince il riferimento: la barra e'
 * l'immagine, non il numero riassunto. Entrambi restano stampati. */
const RIF = {
  toni_bosco: { T0: 45.2, T1: 25.7, T2: 28.5, T3: 0.51 },
  bordo_T0_pct: 71.7, skyline_plateau_max: 2, skyline_righe_per_colonna: 2.43,
  crema_bbox_fascia_pct: 19.8, run_orizzontale_medio: 1.92,
  ciuffi_copertura_pct: 3.75, ciuffi_radura_pct: 4.53,
  ciuffi_singoli_pct: 54.4, ciuffi_T2_pct: 85.1
};

const gates = [
  ['skyline: nessun plateau > 2 px', out.skyline_plateau_max <= 2, out.skyline_plateau_max, RIF.skyline_plateau_max],
  ['crema nel bbox fascia 15-20%', out.crema_bbox_fascia_pct >= 15 && out.crema_bbox_fascia_pct <= 20, out.crema_bbox_fascia_pct + '%', RIF.crema_bbox_fascia_pct + '%'],
  ['bordo silhouette T0 >= 65%', out.bordo_T0_pct >= 65, out.bordo_T0_pct + '%', RIF.bordo_T0_pct + '%'],
  ['T3 nel bosco <= 0,6% (rif: rumore del mockup)', out.toni_bosco.T3 <= 0.6, out.toni_bosco.T3 + '%', RIF.toni_bosco.T3 + '%'],
  ['T0 nel bosco 42-48%', out.toni_bosco.T0 >= 42 && out.toni_bosco.T0 <= 48, out.toni_bosco.T0 + '%', RIF.toni_bosco.T0 + '%'],
  ['T1 nel bosco 22-29%', out.toni_bosco.T1 >= 22 && out.toni_bosco.T1 <= 29, out.toni_bosco.T1 + '%', RIF.toni_bosco.T1 + '%'],
  ['T2 nel bosco 25-32%', out.toni_bosco.T2 >= 25 && out.toni_bosco.T2 <= 32, out.toni_bosco.T2 + '%', RIF.toni_bosco.T2 + '%'],
  ['run orizzontale medio 1,8-2,4', out.run_orizzontale_medio >= 1.8 && out.run_orizzontale_medio <= 2.4, out.run_orizzontale_medio, RIF.run_orizzontale_medio],
  ['ciuffi copertura radura 4-6%', out.ciuffi_radura_pct >= 4 && out.ciuffi_radura_pct <= 6, out.ciuffi_radura_pct + '%', RIF.ciuffi_radura_pct + '%'],
  ['ciuffi singoli >= 50%', out.ciuffi_singoli_pct >= 50, out.ciuffi_singoli_pct + '%', RIF.ciuffi_singoli_pct + '%'],
  ['ciuffi 100% T2 (rif: 85 = antialias mockup)', out.ciuffi_T2_pct >= 99.5, out.ciuffi_T2_pct + '%', RIF.ciuffi_T2_pct + '%']
];

if (jsonOut) { console.log(JSON.stringify(out, null, 2)); }
else {
  console.log(file);
  for (const k of Object.keys(out)) console.log('  ' + k.padEnd(26) + JSON.stringify(out[k]));
  console.log('');
  console.log('gate'.padEnd(48) + 'build'.padEnd(12) + 'riferimento');
  for (const [name, ok, val, rif] of gates) console.log(`${ok ? 'ok  ' : 'FAIL'} - ${name.padEnd(42)} ${String(val).padEnd(11)} ${rif}`);
}
process.exitCode = gates.every((g) => g[1]) ? 0 : 1;
