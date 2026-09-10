#!/usr/bin/env node
'use strict';

/* tools/traincar-captures.js — rasterizza l'arte nativa della radura del vagone
 * (js/traincar-art.js) sull'intera mappa 384x192 e la scrive come PNG.
 * L'arte e' fatta solo di rettangoli interi a tinta piatta: qui il "renderer"
 * e' un contesto registrante piu' un rasterizzatore, quindi le catture a mappa
 * intera sono deterministiche e non passano da Chrome. Le catture in-game con
 * gli attori restano compito di test/native-shot.js.
 *
 * Uso: node tools/traincar-captures.js <out.png> [--scale=1] [--ring-hidden]
 *      [--overlay] [--compose=a.png,b.png,...] [--labels=...] */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const root = path.resolve(__dirname, '..');

/* ---------------- ambiente browser minimo ---------------- */
const noop = () => {};
/* Il modulo e' anche una dipendenza di test/traincar-native.js: non deve mai
 * sovrascrivere gli stub gia' installati da chi lo carica (in particolare
 * addEventListener, da cui dipende la prova con tastiera reale). */
function ensure(name, value) { if (global[name] === undefined) global[name] = value; }
global.window = global;
ensure('performance', { now: () => 0 });
ensure('requestAnimationFrame', noop);
ensure('setInterval', () => 0);
ensure('addEventListener', noop);
ensure('localStorage', { getItem: () => null, setItem: noop, removeItem: noop });
ensure('document', {
  body: { classList: { toggle: noop }, setAttribute: noop },
  getElementById: () => null,
  addEventListener: noop
});
global.GAME = global.GAME || {};
require(path.join(root, 'js', 'retro-font.js'));
require(path.join(root, 'js', 'traincar-art.js'));
const Art = global.GAME.TraincarArt;

/* ---------------- rasterizzatore ---------------- */
function surface(width, height) {
  const rgb = Buffer.alloc(width * height * 3, 0);
  const ctx = {
    fillStyle: '#000000',
    fillRect(x, y, w, h) {
      const color = ctx.fillStyle;
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y));
      const x1 = Math.min(width, Math.round(x) + Math.round(w));
      const y1 = Math.min(height, Math.round(y) + Math.round(h));
      for (let py = y0; py < y1; py++) {
        for (let px = x0; px < x1; px++) {
          const i = (py * width + px) * 3;
          rgb[i] = r; rgb[i + 1] = g; rgb[i + 2] = b;
        }
      }
    }
  };
  return { rgb, ctx, width, height };
}

function renderMap(state) {
  const s = surface(Art.width, Art.height);
  Art.draw(s.ctx, 0, 0, state || {});
  return s;
}

function scaleUp(src, factor) {
  const width = src.width * factor, height = src.height * factor;
  const rgb = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const si = (Math.floor(y / factor) * src.width + Math.floor(x / factor)) * 3;
      const di = (y * width + x) * 3;
      rgb[di] = src.rgb[si]; rgb[di + 1] = src.rgb[si + 1]; rgb[di + 2] = src.rgb[si + 2];
    }
  }
  return { rgb, width, height };
}

/* ---------------- PNG ---------------- */
function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePng(image) {
  const stride = image.width * 3;
  const raw = Buffer.alloc((stride + 1) * image.height);
  for (let y = 0; y < image.height; y++) {
    raw[y * (stride + 1)] = 0;
    image.rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(image.width, 0); ihdr.writeUInt32BE(image.height, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}
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
  const rawAll = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = rawAll[y * (stride + 1)];
    const line = rawAll.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
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

function blit(dst, src, ox, oy) {
  for (let y = 0; y < src.height; y++) {
    const dy = oy + y;
    if (dy < 0 || dy >= dst.height) continue;
    for (let x = 0; x < src.width; x++) {
      const dx = ox + x;
      if (dx < 0 || dx >= dst.width) continue;
      const si = (y * src.width + x) * 3, di = (dy * dst.width + dx) * 3;
      dst.rgb[di] = src.rgb[si]; dst.rgb[di + 1] = src.rgb[si + 1]; dst.rgb[di + 2] = src.rgb[si + 2];
    }
  }
}
function blank(width, height, color) {
  const s = surface(width, height);
  s.ctx.fillStyle = color; s.ctx.fillRect(0, 0, width, height);
  return s;
}
function label(target, text, x, y, color) {
  global.GAME.RetroFont.draw(target.ctx, text, x, y, color || '#e6e2cf', { scale: 1 });
}

module.exports = {
  renderMap, scaleUp, encodePng, decodePng, blit, blank, surface, label, Art
};

/* ---------------- CLI ---------------- */
if (require.main === module) {
  const args = new Map();
  const positional = [];
  for (const a of process.argv.slice(2)) {
    const m = /^--([a-zA-Z0-9-]+)(?:=(.*))?$/.exec(a);
    if (m) args.set(m[1], m[2] === undefined ? '1' : m[2]);
    else positional.push(a);
  }
  const out = path.resolve(root, positional[0] || 'artifacts/traincar-v01/native-1x.png');
  const scale = Number(args.get('scale') || 1);
  const state = { ringHidden: args.has('ring-hidden'), overlay: args.has('overlay') };
  let image = renderMap(state);
  if (scale > 1) image = scaleUp(image, scale);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, encodePng(image));
  console.log('wrote ' + path.relative(root, out) + ' (' + image.width + 'x' + image.height + ')');
}
