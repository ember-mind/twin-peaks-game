#!/usr/bin/env node
'use strict';

// tools/frame-values.js — value-range measurer for a native frame.
//
// Prints the three numbers the room value rounds are judged on:
//   mean luma      (0.299R + 0.587G + 0.114B over every pixel)
//   light %        (share of pixels with luma > 160)
//   black %        (share of pixels with luma < 16)
//
// Usage: node tools/frame-values.js <png> [<png> ...]

const fs = require('node:fs');
const zlib = require('node:zlib');

function decodePng(file) {
  const buf = fs.readFileSync(file);
  let pos = 8, width = 0, height = 0, colorType = 0, palette = null;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); colorType = data[9]; }
    else if (type === 'PLTE') palette = Buffer.from(data);
    else if (type === 'IDAT') idat.push(Buffer.from(data));
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
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
        const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      }
      cur[i] = v & 255;
    }
    cur.copy(out, y * stride); prev = cur;
  }
  const rgb = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    if (colorType === 3) {
      const idx = out[i] * 3;
      rgb[i * 3] = palette[idx]; rgb[i * 3 + 1] = palette[idx + 1]; rgb[i * 3 + 2] = palette[idx + 2];
    } else {
      rgb[i * 3] = out[i * channels];
      rgb[i * 3 + 1] = out[i * channels + 1];
      rgb[i * 3 + 2] = out[i * channels + 2];
    }
  }
  return { width, height, rgb };
}

function measure(file) {
  const { width, height, rgb } = decodePng(file);
  const total = width * height;
  let sum = 0, light = 0, black = 0;
  for (let i = 0; i < total; i++) {
    const l = 0.299 * rgb[i * 3] + 0.587 * rgb[i * 3 + 1] + 0.114 * rgb[i * 3 + 2];
    sum += l;
    if (l > 160) light++;
    if (l < 16) black++;
  }
  return {
    file, width, height,
    mean: sum / total,
    lightPct: (light / total) * 100,
    blackPct: (black / total) * 100
  };
}

if (require.main === module) {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('usage: node tools/frame-values.js <png> [<png> ...]');
    process.exit(2);
  }
  for (const file of files) {
    const m = measure(file);
    console.log(
      `${m.file}  ${m.width}x${m.height}  mean=${m.mean.toFixed(1)}  ` +
      `light(>160)=${m.lightPct.toFixed(2)}%  black(<16)=${m.blackPct.toFixed(2)}%`
    );
  }
}

module.exports = { decodePng, measure };
