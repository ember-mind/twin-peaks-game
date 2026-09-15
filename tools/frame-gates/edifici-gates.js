#!/usr/bin/env node
'use strict';

/* tools/frame-gates/edifici-gates.js — misure riproducibili su negozio, casa e cartello
 * del tableau d'arrivo. Stesso codice per il riferimento e per il build:
 * ogni numero del build va letto accanto al numero che QUESTO script legge
 * sul target, non accanto a un numero scritto in un contratto.
 *
 *   node tools/frame-gates/edifici-gates.js artifacts/edifici/base.png
 *   node tools/frame-gates/edifici-gates.js artifacts/reference/target.png \
 *        --mockup=32,22.5,5.844,5.880
 *
 * La normalizzazione del mockup (X0=32, Y0=22,5, SX=5,844, SY=5,880) e'
 * quella dichiarata dal revisore in "Spec Target — Edifici e cartello.md";
 * riproduce le coordinate della specifica al pixel (negozio x27..61 y2..38,
 * casa x88..131, cartello x63..68 y24..29).
 *
 * Nessuna regione e' scritta a mano: negozio, casa e cartello sono le
 * componenti connesse non-crema piu' grandi della meta' alta del campo, e le
 * bande interne (insegna, tettoia, balza, facciata / tetto, muro, veranda,
 * gradini) sono derivate dalla texture di ogni riga.
 */

const path = require('node:path');
const L = require(path.join(__dirname, 'bosco-lib.js'));

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
if (!file) {
  console.error('uso: edifici-gates.js <frame.png> [--mockup=ox,oy,fx,fy] [--json]');
  process.exit(2);
}
const opt = (k) => { const a = args.find((v) => v.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const jsonOut = args.includes('--json');
const dump = args.includes('--dump');

const W = 160, H = 144, TOP = 46; /* gli edifici stanno tutti sopra y=46 */
const img = L.decodePng(path.resolve(file));

let grid;
if (opt('mockup')) {
  const p = opt('mockup').split(',').map(Number);
  const ox = p[0], oy = p[1], fx = p[2], fy = p.length > 3 ? p[3] : p[2];
  grid = [];
  for (let y = 0; y < H; y++) {
    const row = [];
    for (let x = 0; x < W; x++) {
      const x0 = ox + x * fx, y0 = oy + y * fy, c = {};
      for (let sy = Math.ceil(y0 + fy * 0.25); sy < y0 + fy * 0.75; sy++)
        for (let sx = Math.ceil(x0 + fx * 0.25); sx < x0 + fx * 0.75; sx++) {
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
  if (img.width !== W || img.height !== H)
    throw new Error(`${file}: atteso 160x144, trovato ${img.width}x${img.height}`);
  grid = L.gridOf(img, W, H);
}

const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 'cream' : grid[y][x];
const dark = (c) => c === 'T0';
const light = (c) => c === 'T3' || c === 'cream';

/* --- componenti connesse non-crema nella meta' alta --- */
function components(y0, y1, x0, x1) {
  const seen = new Set(), out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const k = y * W + x;
    if (seen.has(k) || at(x, y) === 'cream') continue;
    const stack = [x, y], px = [];
    seen.add(k);
    while (stack.length) {
      const cy = stack.pop(), cx = stack.pop();
      px.push([cx, cy]);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx, ny = cy + dy, nk = ny * W + nx;
        if (nx < x0 || ny < y0 || nx > x1 || ny > y1 || seen.has(nk)) continue;
        if (at(nx, ny) === 'cream') continue;
        seen.add(nk); stack.push(nx, ny);
      }
    }
    let bx0 = W, by0 = H, bx1 = -1, by1 = -1;
    for (const [a, b] of px) {
      if (a < bx0) bx0 = a; if (a > bx1) bx1 = a;
      if (b < by0) by0 = b; if (b > by1) by1 = b;
    }
    out.push({ area: px.length, x0: bx0, y0: by0, x1: bx1, y1: by1, px });
  }
  return out.sort((a, b) => b.area - a.area);
}

/* Se la riga 0 e' una cornice piena (i mockup ce l'hanno, le catture native
 * no) la salto: altrimenti fonde tutte le componenti in una sola. */
let ROW0 = 0;
{
  let n = 0;
  for (let x = 0; x < W; x++) if (at(x, 0) !== 'cream') n++;
  if (n >= W * 0.95) ROW0 = 1;
}
/* Il bosco laterale tocca i bordi: resto in x 22..142 e scarto le componenti
 * che toccano i due bordi della finestra. Gli edifici sono le componenti che
 * partono in alto (y0 <= 25): auto e sprite iniziano piu' in basso. */
const raw = components(ROW0, TOP, 22, 142);
const comps = raw.filter((c) => c.x0 > 22 && c.x1 < 142 && c.area >= 20);
const bldg = comps.filter((c) => c.area >= 200 && c.y0 <= 25);
const shop = bldg.filter((c) => (c.x0 + c.x1) / 2 < 78).sort((a, b) => b.area - a.area)[0];
const cabin = bldg.filter((c) => (c.x0 + c.x1) / 2 > 78).sort((a, b) => b.area - a.area)[0];
const sign = comps.filter((c) => c !== shop && c !== cabin && c.area >= 20 && c.area < 200 &&
  c.x0 > (shop ? shop.x1 : 0) && c.x1 < (cabin ? cabin.x0 : W))
  .sort((a, b) => b.area - a.area)[0];

const M = {};
const bbox = (c) => c ? { w: c.x1 - c.x0 + 1, h: c.y1 - c.y0 + 1, x0: c.x0, y0: c.y0, x1: c.x1, y1: c.y1 } : null;

/* ============================ NEGOZIO ============================ */
if (shop) {
  const b = bbox(shop);
  M.shop_w = b.w; M.shop_h = b.h;
  M.shop_box = `${b.x0}..${b.x1} / ${b.y0}..${b.y1}`;

  /* riga della tettoia = prima riga piena T0 sotto le prime 3 righe */
  const fullDark = (y) => {
    let n = 0;
    for (let x = b.x0; x <= b.x1; x++) if (dark(at(x, y))) n++;
    return n / b.w;
  };
  let awning = -1;
  for (let y = b.y0 + 4; y <= b.y1 - 8; y++) if (fullDark(y) >= 0.92) { awning = y; break; }
  M.shop_insegna_rows = awning < 0 ? 0 : awning - b.y0;

  /* icona: componente T0 piu' grande dentro la banda insegna, staccata dal bordo */
  let icon = null;
  if (awning > 0) {
    const seen = new Set();
    for (let y = b.y0 + 2; y < awning - 1; y++) for (let x = b.x0 + 2; x < b.x1 - 1; x++) {
      const k = y * W + x;
      if (seen.has(k) || !dark(at(x, y))) continue;
      const st = [x, y], px = []; seen.add(k);
      while (st.length) {
        const cy = st.pop(), cx = st.pop(); px.push([cx, cy]);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx, ny = cy + dy, nk = ny * W + nx;
          if (nx <= b.x0 + 1 || ny <= b.y0 + 1 || nx >= b.x1 - 1 || ny >= awning - 1 || seen.has(nk)) continue;
          if (!dark(at(nx, ny))) continue;
          seen.add(nk); st.push(nx, ny);
        }
      }
      let a0 = W, c0 = H, a1 = -1, c1 = -1;
      for (const [p, q] of px) { if (p < a0) a0 = p; if (p > a1) a1 = p; if (q < c0) c0 = q; if (q > c1) c1 = q; }
      const cand = { area: px.length, w: a1 - a0 + 1, h: c1 - c0 + 1 };
      if (!icon || cand.area > icon.area) icon = cand;
    }
  }
  M.shop_icona_w = icon ? icon.w : 0;
  M.shop_icona_h = icon ? icon.h : 0;

  /* balza a righe: finestra di 6 righe sotto la tettoia con il massimo numero
   * di strisce verticali chiare su fondo T0. */
  let best = { rows: 0, stripes: 0, hilite: 0, y: -1, widths: [] };
  if (awning > 0) {
    for (let y = awning + 1; y <= Math.min(awning + 8, b.y1 - 6); y++) {
      const cols = [];
      for (let x = b.x0 + 1; x <= b.x1 - 1; x++) {
        let n = 0;
        for (let k = 0; k < 6; k++) if (!dark(at(x, y + k)) && at(x, y + k) !== 'cream') n++;
        cols.push(n >= 4);
      }
      const widths = []; let run = 0;
      for (let i = 0; i < cols.length; i++) {
        if (cols[i]) run++;
        else { if (run) widths.push(run); run = 0; }
      }
      if (run) widths.push(run);
      /* strisce = run larghe 1..3 (le lesene larghe non contano) */
      const stripes = widths.filter((v) => v >= 1 && v <= 3);
      let hil = 0;
      for (let k = 0; k < 6; k++) for (let x = b.x0; x <= b.x1; x++) if (light(at(x, y + k))) hil++;
      if (stripes.length > best.stripes) best = { rows: 6, stripes: stripes.length, hilite: hil, y, widths: stripes };
    }
  }
  M.shop_strisce = best.stripes;
  M.shop_striscia_w = best.widths.length ? best.widths.sort((a, c) => a - c)[best.widths.length >> 1] : 0;
  M.shop_luce_balza = best.hilite;

  /* finestra della facciata: telaio chiaro? conta i px T2 nella meta' sinistra
   * della facciata (sotto la balza). */
  const facTop = best.y > 0 ? best.y + 6 : b.y0 + Math.round(b.h * 0.7);
  let t2 = 0, t0 = 0;
  for (let y = facTop; y <= b.y1; y++) for (let x = b.x0; x < b.x0 + Math.round(b.w * 0.55); x++) {
    const c = at(x, y);
    if (c === 'T2') t2++; else if (c === 'T0') t0++;
  }
  M.shop_telaio_T2 = t2;
}

/* ============================= CASA ============================== */
if (cabin) {
  const b = bbox(cabin);
  M.casa_w = b.w; M.casa_h = b.h;
  M.casa_box = `${b.x0}..${b.x1} / ${b.y0}..${b.y1}`;

  /* fughe del tetto: colonne con una corsa verticale T0 >= 6 che inizia nel
   * terzo alto della casa. */
  const roofLimit = b.y0 + Math.round(b.h * 0.5);
  let seams = 0;
  for (let x = b.x0 + 1; x < b.x1; x++) {
    let run = 0, ok = false;
    for (let y = b.y0; y <= roofLimit; y++) {
      if (dark(at(x, y)) && !dark(at(x - 1, y)) && !dark(at(x + 1, y))) run++;
      else { if (run >= 6) ok = true; run = 0; }
    }
    if (run >= 6) ok = true;
    if (ok) seams++;
  }
  M.casa_fughe_tetto = seams;

  /* chevron del timpano: righe consecutive in cui la corsa T2 piu' larga
   * cresce di 1..6 colonne. */
  const widest = (y) => {
    let bestw = 0, run = 0;
    for (let x = b.x0; x <= b.x1; x++) {
      if (at(x, y) === 'T2') { run++; if (run > bestw) bestw = run; } else run = 0;
    }
    return bestw;
  };
  let chev = 0, chevBest = 0;
  for (let y = b.y0 + 1; y <= roofLimit; y++) {
    const d = widest(y) - widest(y - 1);
    if (d >= 1 && d <= 6 && widest(y) >= 6) { chev++; if (chev > chevBest) chevBest = chev; }
    else chev = 0;
  }
  M.casa_chevron_righe = chevBest;

  /* balaustrini: finestra di 3 righe con il massimo numero di barre chiare
   * larghe 1 px isolate fra pixel scuri. */
  let bal = 0, balY = -1;
  for (let y = b.y0 + Math.round(b.h * 0.45); y <= b.y1 - 3; y++) {
    let n = 0;
    for (let x = b.x0 + 1; x < b.x1; x++) {
      let ok = true;
      for (let k = 0; k < 3; k++) {
        const c = at(x, y + k);
        if (dark(c) || c === 'cream' || !dark(at(x - 1, y + k)) || !dark(at(x + 1, y + k))) { ok = false; break; }
      }
      if (ok) n++;
    }
    if (n > bal) { bal = n; balY = y; }
  }
  M.casa_balaustrini = bal;

  /* gradini: righe quasi tutte T0 nella colonna centrale, nella meta' bassa. */
  const cx0 = b.x0 + Math.round(b.w * 0.35), cx1 = b.x0 + Math.round(b.w * 0.65);
  let steps = 0;
  for (let y = b.y0 + Math.round(b.h * 0.6); y <= b.y1; y++) {
    let n = 0;
    for (let x = cx0; x <= cx1; x++) if (dark(at(x, y))) n++;
    const prev = (() => { let m = 0; for (let x = cx0; x <= cx1; x++) if (dark(at(x, y - 1))) m++; return m; })();
    if (n / (cx1 - cx0 + 1) >= 0.8 && prev / (cx1 - cx0 + 1) < 0.8) steps++;
  }
  M.casa_gradini = steps;

  /* vetri crema: pixel T3/cream dentro la casa (le 8 losanghe delle finestre) */
  let panes = 0;
  for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) if (light(at(x, y))) panes++;
  M.casa_vetri_chiari = panes;

  /* ombra portata: colonne subito a destra della casa con corsa T2 >= 10 */
  let sh = 0;
  for (let x = b.x1 + 1; x <= b.x1 + 6; x++) {
    let run = 0, ok = false;
    for (let y = b.y0; y <= b.y1 + 4; y++) {
      if (at(x, y) === 'T2') { run++; if (run >= 10) ok = true; } else run = 0;
    }
    if (ok) sh++;
  }
  M.casa_ombra_col = sh;
}

/* ============================ CARTELLO =========================== */
if (sign) {
  const b = bbox(sign);
  M.cartello_w = b.w; M.cartello_h = b.h;
  M.cartello_box = `${b.x0}..${b.x1} / ${b.y0}..${b.y1}`;
  /* tabella = righe larghe >= 5 px; palo = righe larghe <= 3 px */
  let tab = 0, palo = 0, paloW = 0, tabW = 0;
  for (let y = b.y0; y <= b.y1; y++) {
    let n = 0;
    for (let x = b.x0; x <= b.x1; x++) if (at(x, y) !== 'cream') n++;
    if (n >= 5) { tab++; if (n > tabW) tabW = n; }
    else if (n >= 1) { palo++; if (n > paloW) paloW = n; }
  }
  M.cartello_tabella = `${tabW}x${tab}`;
  M.cartello_palo = `${paloW}x${palo}`;
} else {
  M.cartello_w = 0; M.cartello_h = 0;
}

/* ====================== palette dentro gli edifici ================ */
if (!opt('mockup')) {
  const seen = new Set();
  for (const c of [shop, cabin, sign]) {
    if (!c) continue;
    for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) seen.add(img.px(x, y));
  }
  M.tinte_edifici = seen.size;
}

if (dump) {
  const CH = { T0: '#', T1: '+', T2: '-', T3: '.', cream: ' ' };
  for (let y = ROW0; y <= TOP; y++)
    console.log(String(y).padStart(3), grid[y].slice(20, 146).map((c) => CH[c]).join(''));
}
if (jsonOut) console.log(JSON.stringify(M, null, 2));
else for (const k of Object.keys(M)) console.log(k.padEnd(22), M[k]);
