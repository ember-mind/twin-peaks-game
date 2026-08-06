#!/usr/bin/env node
'use strict';

// test/pixel-gates.js — misure riproducibili su un frame nativo 160x144.
// Nasce dalle misure del critico grammatica-pixel R53: il terreno dev'essere
// una texture con dither periodico, non un fondale piatto con macchioline,
// e la fascia alberi non dev'essere uno stampo ripetuto a passo fisso.
//
// Uso:
//   node test/pixel-gates.js <frame.png> --rect=x0,y0,x1,y1 [--label=prato]
//   node test/pixel-gates.js <frame.png> --tile-discipline
//   node test/pixel-gates.js <frame.png> --stamp=y0,y1
//
// Nessuna dipendenza esterna: decoder PNG minimale (RGB/RGBA 8 bit).

const fs = require('node:fs');
const zlib = require('node:zlib');

function decodePng(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${file}: non e' un PNG`);
  let pos = 8, width = 0, height = 0, depth = 0, colorType = 0, palette = null, idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      depth = data[8]; colorType = data[9];
    } else if (type === 'PLTE') palette = Buffer.from(data);
    else if (type === 'IDAT') idat.push(Buffer.from(data));
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (depth !== 8) throw new Error(`${file}: profondita' ${depth} non supportata`);
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`${file}: colorType ${colorType} non supportato`);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = Buffer.alloc(stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? cur[i - channels] : 0;
      const b = prev[i];
      const c = i >= channels ? prev[i - channels] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      }
      cur[i] = v & 255;
    }
    cur.copy(out, y * stride);
    prev = cur;
  }
  const px = (x, y) => {
    const i = y * stride + x * channels;
    if (colorType === 3) {
      const k = out[i] * 3;
      return (palette[k] << 16) | (palette[k + 1] << 8) | palette[k + 2];
    }
    if (colorType === 0 || colorType === 4) return (out[i] << 16) | (out[i] << 8) | out[i];
    return (out[i] << 16) | (out[i + 1] << 8) | out[i + 2];
  };
  return { width, height, px };
}

function coverage(img, r) {
  const counts = new Map();
  for (let y = r[1]; y <= r[3]; y++) {
    for (let x = r[0]; x <= r[2]; x++) {
      const v = img.px(x, y);
      counts.set(v, (counts.get(v) || 0) + 1);
    }
  }
  const total = (r[2] - r[0] + 1) * (r[3] - r[1] + 1);
  let base = 0;
  for (const n of counts.values()) if (n > base) base = n;
  return { nonBasePct: +(100 * (1 - base / total)).toFixed(1), colors: counts.size };
}

// Autocorrelazione binaria: 1 se il pixel differisce dal colore dominante.
function autocorr(img, r, lag, axis) {
  let hits = 0, total = 0, ones = 0, n = 0;
  const counts = new Map();
  for (let y = r[1]; y <= r[3]; y++) {
    for (let x = r[0]; x <= r[2]; x++) {
      const v = img.px(x, y); counts.set(v, (counts.get(v) || 0) + 1);
    }
  }
  let baseColor = 0, best = -1;
  for (const [v, c] of counts) if (c > best) { best = c; baseColor = v; }
  const mask = (x, y) => (img.px(x, y) === baseColor ? 0 : 1);
  for (let y = r[1]; y <= r[3]; y++) {
    for (let x = r[0]; x <= r[2]; x++) {
      const a = mask(x, y);
      ones += a; n++;
      const bx = axis === 'x' ? x + lag : x;
      const by = axis === 'y' ? y + lag : y;
      if (bx > r[2] || by > r[3]) continue;
      total++;
      if (a === mask(bx, by) && a === 1) hits++;
    }
  }
  const p = ones / n;
  if (!total || p === 0 || p === 1) return 0;
  // Correlazione normalizzata: quanto il co-occorrere supera il caso.
  return +(((hits / total) - p * p) / (p * (1 - p))).toFixed(3);
}

// Delta di luminanza fra colore base e colore del segno: misura QUANTO urla
// il dither, non solo se esiste. Il riferimento Gold sta a ~26; sopra ~30 il
// fondale si mangia la scala tonale che serve a far staccare sprite e edifici.
function paletteDelta(img, r) {
  const counts = new Map();
  for (let y = r[1]; y <= r[3]; y++) {
    for (let x = r[0]; x <= r[2]; x++) {
      const v = img.px(x, y); counts.set(v, (counts.get(v) || 0) + 1);
    }
  }
  const total = (r[2] - r[0] + 1) * (r[3] - r[1] + 1);
  const lum = (v) => 0.2126 * ((v >> 16) & 255) + 0.7152 * ((v >> 8) & 255) + 0.0722 * (v & 255);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const base = sorted[0], mark = sorted[1];
  if (!mark) return { basePct: 100, markPct: 0, deltaL: 0 };
  return {
    baseHex: '#' + base[0].toString(16).padStart(6, '0'),
    basePct: +(100 * base[1] / total).toFixed(1),
    markHex: '#' + mark[0].toString(16).padStart(6, '0'),
    markPct: +(100 * mark[1] / total).toFixed(1),
    deltaL: +Math.abs(lum(base[0]) - lum(mark[0])).toFixed(1)
  };
}

// Quante righe di tile 8x8 sono diverse fra loro: se ogni riga e' la copia
// della precedente il terreno e' tappezzeria, non texture.
function tileMap(img, r) {
  const rows = [];
  for (let ty = r[1]; ty + 8 <= r[3] + 1; ty += 8) {
    const row = [];
    for (let tx = r[0]; tx + 8 <= r[2] + 1; tx += 8) {
      let key = '';
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) key += img.px(tx + x, ty + y).toString(36) + ',';
      row.push(key);
    }
    rows.push(row.join('|'));
  }
  const distinctRows = new Set(rows).size;
  const allTiles = new Set(rows.flatMap((r2) => r2.split('|')));
  return { tileRows: rows.length, distinctTileRows: distinctRows, distinctTiles: allTiles.size };
}

// IoU fra le maschere binarie di due sprite. E' la misura che un critico usa
// per dire "sono lo stesso pupazzo con due palette": contare i pixel diversi
// e' lusinghiero, l'IoU no. Sfondo = colori presenti sul perimetro del box.
function maskOf(img, box, bgList) {
  const [x0, y0, w, h] = box;
  const bg = new Set(bgList || []);
  if (!bgList) {
    for (let x = x0; x < x0 + w; x++) { bg.add(img.px(x, y0)); bg.add(img.px(x, y0 + h - 1)); }
    for (let y = y0; y < y0 + h; y++) { bg.add(img.px(x0, y)); bg.add(img.px(x0 + w - 1, y)); }
  }
  const mask = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) mask.push(bg.has(img.px(x0 + x, y0 + y)) ? 0 : 1);
  }
  return mask;
}

function maskIou(img, boxA, boxB, bgList) {
  const a = maskOf(img, boxA, bgList), b = maskOf(img, boxB, bgList);
  let inter = 0, union = 0, diff = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] || b[i]) union++;
    if (a[i] && b[i]) inter++;
    if (a[i] !== b[i]) diff++;
  }
  return { iou: +(inter / (union || 1)).toFixed(3), pixelDiff: diff, boxPixels: a.length };
}

function tileDiscipline(img) {
  let bad = 0, tiles = 0, worst = 0;
  for (let ty = 0; ty + 8 <= img.height; ty += 8) {
    for (let tx = 0; tx + 8 <= img.width; tx += 8) {
      const set = new Set();
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) set.add(img.px(tx + x, ty + y));
      tiles++;
      if (set.size > worst) worst = set.size;
      if (set.size > 4) bad++;
    }
  }
  return { tiles, over4: bad, over4Pct: +(100 * bad / tiles).toFixed(1), maxColors: worst };
}

function stampMatch(img, y0, y1, lag) {
  let same = 0, total = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = 0; x + lag < img.width; x++) {
      total++;
      if (img.px(x, y) === img.px(x + lag, y)) same++;
    }
  }
  return +(100 * same / total).toFixed(1);
}

// Il riferimento e' uno screenshot riscalato e ricompresso: misurarlo a pixel
// grezzi da numeri privi di senso (migliaia di colori). --native-scale=S
// ricampiona al centro di ogni cella nativa e quantizza sui colori dominanti,
// riportando l'immagine alla griglia Game Boy prima di misurarla.
function toNative(img, scale, quantize) {
  const w = Math.floor(img.width / scale), h = Math.floor(img.height / scale);
  const grid = new Int32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      grid[y * w + x] = img.px(
        Math.min(img.width - 1, Math.round((x + 0.5) * scale)),
        Math.min(img.height - 1, Math.round((y + 0.5) * scale))
      );
    }
  }
  if (quantize) {
    const counts = new Map();
    for (const v of grid) counts.set(v, (counts.get(v) || 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, quantize).map((e) => e[0]);
    const nearest = (v) => {
      let best = top[0], bd = Infinity;
      for (const t of top) {
        const d = Math.abs(((v >> 16) & 255) - ((t >> 16) & 255)) +
          Math.abs(((v >> 8) & 255) - ((t >> 8) & 255)) + Math.abs((v & 255) - (t & 255));
        if (d < bd) { bd = d; best = t; }
      }
      return best;
    };
    for (let i = 0; i < grid.length; i++) grid[i] = nearest(grid[i]);
  }
  return { width: w, height: h, px: (x, y) => grid[y * w + x] };
}

const [file, ...rest] = process.argv.slice(2);
if (!file) { console.error('uso: pixel-gates.js <frame.png> [--rect=...] [--tile-discipline] [--stamp=y0,y1]'); process.exit(2); }
let img = decodePng(file);
const opts = new Map(rest.map((a) => { const m = /^--([a-z-]+)(?:=(.*))?$/.exec(a); return [m[1], m[2] || true]; }));
if (opts.has('native-scale')) {
  img = toNative(img, Number(opts.get('native-scale')), Number(opts.get('quantize') || 8));
}
const out = { file, size: [img.width, img.height] };

if (opts.has('rect')) {
  const r = String(opts.get('rect')).split(',').map(Number);
  out.label = opts.get('label') || 'rect';
  out.rect = r;
  Object.assign(out, coverage(img, r));
  out.autocorr = {
    x2: autocorr(img, r, 2, 'x'), x4: autocorr(img, r, 4, 'x'), x8: autocorr(img, r, 8, 'x'),
    y2: autocorr(img, r, 2, 'y'), y4: autocorr(img, r, 4, 'y'), y8: autocorr(img, r, 8, 'y')
  };
}
if (opts.has('rect') && opts.has('palette-delta')) {
  const r = String(opts.get('rect')).split(',').map(Number);
  out.paletteDelta = paletteDelta(img, r);
}
if (opts.has('rect') && opts.has('tile-map')) {
  const r = String(opts.get('rect')).split(',').map(Number);
  out.tileMap = tileMap(img, r);
}
if (opts.has('mask-a') && opts.has('mask-b')) {
  const a = String(opts.get('mask-a')).split(',').map(Number);
  const b = String(opts.get('mask-b')).split(',').map(Number);
  const bgList = opts.has('bg')
    ? String(opts.get('bg')).split(',').map((h) => parseInt(h.replace('#', ''), 16))
    : null;
  out.maskIou = maskIou(img, a, [b[0], b[1], a[2], a[3]], bgList);
}
if (opts.has('tile-discipline')) out.tileDiscipline = tileDiscipline(img);
if (opts.has('stamp')) {
  const [y0, y1] = String(opts.get('stamp')).split(',').map(Number);
  out.stamp = { band: [y0, y1], match16: stampMatch(img, y0, y1, 16), match32: stampMatch(img, y0, y1, 32) };
}
console.log(JSON.stringify(out, null, 2));
