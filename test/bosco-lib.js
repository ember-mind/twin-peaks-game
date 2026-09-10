'use strict';
/* test/bosco-lib.js — decoder PNG + encoder + palette del contratto bosco.
 * Condiviso da test/bosco-gates.js e dagli script di ritaglio: builder e
 * critico devono leggere lo stesso numero dallo stesso codice. */
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

function crc32(buf) {
  let c, table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  c = -1;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/* encodePng(w,h,get) — get(x,y) restituisce 0xRRGGBB. */
function encodePng(file, w, h, get) {
  const stride = w * 3;
  const raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const v = get(x, y) >>> 0, i = y * (stride + 1) + 1 + x * 3;
      raw[i] = (v >> 16) & 255; raw[i + 1] = (v >> 8) & 255; raw[i + 2] = v & 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))
  ]));
}

/* Palette a 5 ancore del contratto. I nomi T0..T3 + cream sono quelli usati
 * nelle misure del revisore. */
const ANCHORS = [
  ['T0', 0x072619], ['T1', 0x34572d], ['T2', 0x6a8a43],
  ['T3', 0x9aab69], ['cream', 0xeee6b5]
];

function quantize(rgb) {
  let best = null, bestD = Infinity;
  const r = (rgb >> 16) & 255, g = (rgb >> 8) & 255, b = rgb & 255;
  for (const [name, v] of ANCHORS) {
    const dr = r - ((v >> 16) & 255), dg = g - ((v >> 8) & 255), db = b - (v & 255);
    const d = dr * dr + dg * dg + db * db;
    if (d < bestD) { bestD = d; best = name; }
  }
  return best;
}

/* Estrae il campo di gioco nativo 160x144 da un mockup upscalato. */
function nativeFrom(img, ox, oy, factor, w, h) {
  const grid = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) {
      const sx = Math.min(img.width - 1, Math.round(ox + (x + 0.5) * factor));
      const sy = Math.min(img.height - 1, Math.round(oy + (y + 0.5) * factor));
      row.push(quantize(img.px(sx, sy)));
    }
    grid.push(row);
  }
  return grid;
}

function gridOf(img, w, h) {
  const grid = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) row.push(quantize(img.px(x, y)));
    grid.push(row);
  }
  return grid;
}

const HEX = { T0: 0x072619, T1: 0x34572d, T2: 0x6a8a43, T3: 0x9aab69, cream: 0xeee6b5 };

module.exports = { decodePng, encodePng, quantize, nativeFrom, gridOf, HEX, ANCHORS };
