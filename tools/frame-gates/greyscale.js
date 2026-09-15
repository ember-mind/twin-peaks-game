#!/usr/bin/env node
'use strict';

// tools/frame-gates/greyscale.js — versione desaturata di un frame nativo.
// Serve al critico sprite: se due personaggi si distinguono solo per colore,
// in scala di grigi diventano lo stesso sprite. Rende visibile il difetto.
// Uso: node tools/frame-gates/greyscale.js <in.png> <out.png>

const fs = require('node:fs');
const zlib = require('node:zlib');

const [inFile, outFile] = process.argv.slice(2);
if (!inFile || !outFile) { console.error('uso: greyscale.js <in.png> <out.png>'); process.exit(2); }

const buf = fs.readFileSync(inFile);
let pos = 8, width = 0, height = 0, depth = 0, colorType = 0, palette = null;
const idat = [];
while (pos < buf.length) {
  const len = buf.readUInt32BE(pos);
  const type = buf.toString('ascii', pos + 4, pos + 8);
  const data = buf.subarray(pos + 8, pos + 8 + len);
  if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); depth = data[8]; colorType = data[9]; }
  else if (type === 'PLTE') palette = Buffer.from(data);
  else if (type === 'IDAT') idat.push(Buffer.from(data));
  else if (type === 'IEND') break;
  pos += 12 + len;
}
if (depth !== 8) throw new Error(`profondita' ${depth} non supportata`);
const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
const raw = zlib.inflateSync(Buffer.concat(idat));
const stride = width * channels;
const flat = Buffer.alloc(height * stride);
let prev = Buffer.alloc(stride);
for (let y = 0; y < height; y++) {
  const filter = raw[y * (stride + 1)];
  const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
  const cur = Buffer.alloc(stride);
  for (let i = 0; i < stride; i++) {
    const a = i >= channels ? cur[i - channels] : 0, b = prev[i], c = i >= channels ? prev[i - channels] : 0;
    let v = line[i];
    if (filter === 1) v += a; else if (filter === 2) v += b;
    else if (filter === 3) v += (a + b) >> 1;
    else if (filter === 4) {
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
    }
    cur[i] = v & 255;
  }
  cur.copy(flat, y * stride); prev = cur;
}
const out = Buffer.alloc(height * (width * 3 + 1));
for (let y = 0; y < height; y++) {
  out[y * (width * 3 + 1)] = 0;
  for (let x = 0; x < width; x++) {
    const i = y * stride + x * channels;
    let r, g, b;
    if (colorType === 3) { const k = flat[i] * 3; r = palette[k]; g = palette[k + 1]; b = palette[k + 2]; }
    else if (colorType === 0 || colorType === 4) { r = g = b = flat[i]; }
    else { r = flat[i]; g = flat[i + 1]; b = flat[i + 2]; }
    const l = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    const o = y * (width * 3 + 1) + 1 + x * 3;
    out[o] = l; out[o + 1] = l; out[o + 2] = l;
  }
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crcTable = chunk.table || (chunk.table = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
    return t;
  })());
  let crc = -1;
  for (const byte of body) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE((crc ^ -1) >>> 0);
  return Buffer.concat([len, body, crcBuf]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8; ihdr[9] = 2;
fs.writeFileSync(outFile, Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(out)), chunk('IEND', Buffer.alloc(0))
]));
console.log(`greyscale: ${outFile} ${width}x${height}`);
