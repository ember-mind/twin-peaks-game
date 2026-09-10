#!/usr/bin/env node
'use strict';

/**
 * Build the 24 hand-authored 72x72 walk sheets from tools/cast-authored-frames.js
 * and assemble the production atlas assets/sprites/cast-walkcycles-hg-24.png.
 *
 *   node tools/build-cast-authored.js            # write sheets + atlas
 *   node tools/build-cast-authored.js --check    # verify sheets match source
 *   node tools/build-cast-authored.js --preview out.png [--scale 4]
 *
 * Supersedes tools/build-heartgold-cast.js as the sheet producer (R128).
 * build-heartgold-cast.js --verify-only remains the audit gate.
 */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { spawnSync } = require('node:child_process');
const { HEADS, BODIES, OVERLAYS, CHARACTERS, pal } = require('./cast-authored-frames.js');

const ROOT = path.resolve(__dirname, '..');
const SHEET_DIR = path.join(ROOT, 'assets/sprites/cast-hg-24');
const ATLAS = path.join(ROOT, 'assets/sprites/cast-walkcycles-hg-24.png');
const FRAME = 24;
const SIZE = 72;
const DIRS = ['down', 'up', 'right'];
const ORDER = [
  'cooper', 'truman', 'lucy', 'andy', 'hawk',
  'sarah', 'leland', 'norma', 'shelly', 'loglady',
  'bobby', 'donna', 'jacoby', 'audrey', 'mfap',
  'laura', 'gerard', 'benhorne', 'giant', 'maddy',
  'bob', 'james', 'jacques', 'ronette', 'infermiera'
];

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function assemble(key, dir, phase) {
  const spec = CHARACTERS[key];
  const head = HEADS[spec.head][dir];
  const body = BODIES[spec.body][dir][phase];
  const rows = [...head, ...body].map(row => [...row]);
  const width = rows[0].length;
  if (rows.length !== FRAME) fail(`${key}/${dir}/${phase}: ${rows.length} rows`);
  if (rows.some(row => row.length !== width)) fail(`${key}/${dir}/${phase}: ragged rows`);
  for (const name of spec.overlays || []) {
    const ops = OVERLAYS[name] && OVERLAYS[name][dir];
    if (!ops) continue;
    for (const [row, col, ch] of ops) {
      if (rows[row] && col < width) rows[row][col] = ch;
    }
  }
  return rows.map(row => row.join(''));
}

function frames(key) {
  const out = [];
  for (const dir of DIRS) for (let phase = 0; phase < 3; phase += 1) out.push(assemble(key, dir, phase));
  return out;
}

function hexToRgb(hex) {
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
}

function rasterize(key) {
  const colors = pal(CHARACTERS[key].colors);
  const pixels = Buffer.alloc(SIZE * SIZE * 4, 0);
  frames(key).forEach((rows, index) => {
    const width = rows[0].length;
    const ox = (index % 3) * FRAME + Math.floor((FRAME - width) / 2);
    const oy = Math.floor(index / 3) * FRAME + (FRAME - rows.length);
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === '.') return;
        const color = colors[ch];
        if (!color) fail(`${key}: no color for slot '${ch}'`);
        const [r, g, b] = hexToRgb(color);
        const at = ((oy + y) * SIZE + ox + x) * 4;
        pixels[at] = r; pixels[at + 1] = g; pixels[at + 2] = b; pixels[at + 3] = 255;
      });
    });
  });
  return pixels;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xFFFFFFFF;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(pixels, size) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * stride] = 0;
    pixels.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function atlasPixels(sheets) {
  const atlasSize = 360;
  const pixels = Buffer.alloc(atlasSize * atlasSize * 4, 0);
  ORDER.forEach((key, index) => {
    const bx = (index % 5) * SIZE;
    const by = Math.floor(index / 5) * SIZE;
    const sheet = sheets[key];
    for (let y = 0; y < SIZE; y += 1) {
      sheet.copy(pixels, ((by + y) * atlasSize + bx) * 4, y * SIZE * 4, (y + 1) * SIZE * 4);
    }
  });
  return encodePng(pixels, atlasSize);
}

function stats(key) {
  return frames(key).map((rows, index) => {
    const opaque = rows.join('').replace(/\./g, '');
    const colors = pal(CHARACTERS[key].colors);
    const unique = new Set([...opaque].map(ch => colors[ch]));
    const width = Math.max(...rows.map(row => row.trimEnd().length - (row.length - row.trimStart().length)));
    const cols = rows.map(row => [row.search(/[^.]/), row.length - 1 - [...row].reverse().join('').search(/[^.]/)]).filter(pair => pair[0] >= 0);
    const minX = Math.min(...cols.map(p => p[0]));
    const maxX = Math.max(...cols.map(p => p[1]));
    return { frame: index, colors: unique.size, width: maxX - minX + 1 };
  });
}

function main() {
  const argv = process.argv.slice(2);
  const check = argv.includes('--check');
  const previewAt = argv.indexOf('--preview');
  const sheets = {};
  const problems = [];
  for (const key of ORDER) {
    if (!CHARACTERS[key]) fail(`missing character spec: ${key}`);
    sheets[key] = rasterize(key);
    for (const s of stats(key)) {
      if (s.colors < 12 || s.colors > 15) problems.push(`${key}/${s.frame}: ${s.colors} colors`);
      if (s.width < 13 || s.width > 17) problems.push(`${key}/${s.frame}: width ${s.width}`);
    }
  }
  if (problems.length) fail(`contract problems:\n- ${problems.join('\n- ')}`);

  if (previewAt >= 0) {
    const out = argv[previewAt + 1];
    const scaleAt = argv.indexOf('--scale');
    const scale = scaleAt >= 0 ? Number(argv[scaleAt + 1]) : 4;
    const tmp = path.join(require('node:os').tmpdir(), `tp-cast-preview-${process.pid}.png`);
    fs.writeFileSync(tmp, atlasPixels(sheets));
    const r = spawnSync('magick', [tmp, '-background', '#96AA78', '-flatten', '-filter', 'point', '-resize', `${scale * 100}%`, out], { encoding: 'utf8' });
    fs.rmSync(tmp, { force: true });
    if (r.status !== 0) fail(r.stderr);
    process.stdout.write(`${JSON.stringify({ status: 'pass', preview: out })}\n`);
    return;
  }

  if (check) {
    const mismatched = ORDER.filter(key => {
      const file = path.join(SHEET_DIR, `${key}.png`);
      return !fs.existsSync(file) || !fs.readFileSync(file).equals(encodePng(sheets[key], SIZE));
    });
    const atlasSame = fs.existsSync(ATLAS) && fs.readFileSync(ATLAS).equals(atlasPixels(sheets));
    const ok = mismatched.length === 0 && atlasSame;
    process.stdout.write(`${JSON.stringify({ status: ok ? 'pass' : 'fail', mismatched, atlasSame })}\n`);
    process.exit(ok ? 0 : 1);
  }

  fs.mkdirSync(SHEET_DIR, { recursive: true });
  for (const key of ORDER) fs.writeFileSync(path.join(SHEET_DIR, `${key}.png`), encodePng(sheets[key], SIZE));
  fs.writeFileSync(ATLAS, atlasPixels(sheets));
  process.stdout.write(`${JSON.stringify({ status: 'pass', characters: ORDER.length, sheets: path.relative(ROOT, SHEET_DIR), atlas: path.relative(ROOT, ATLAS) })}\n`);
}

main();
