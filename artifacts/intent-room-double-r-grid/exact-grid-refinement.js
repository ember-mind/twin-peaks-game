#!/usr/bin/env node

// Deterministic native-raster A-F probes for the Double R occupied booth crop.
// Every variant is copied from BASE independently; production files are never read
// for mutation and no image-generation/filtering step is involved.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const WIDTH = 64;
const HEIGHT = 48;
const PIXELS = WIDTH * HEIGHT;
const ROOT = __dirname;
const BASE_PATH = path.resolve(ROOT, '../intent-room-double-r-visual/packet/booth-lower-left-occupied-native.png');
const MASK_PATH = path.resolve(ROOT, 'table-front-lip-mask-native.png');
const OUT = ROOT;

const specs = {
  A: { expected: 8, rect: [27, 28, 34, 28], color: '#9c6944' },
  B: { expected: 16, rect: [27, 28, 34, 29], color: '#9c6944' },
  C: { expected: 8, rect: [19, 28, 26, 28], color: '#946345' },
  D: { expected: 8, rect: [37, 28, 44, 28], color: '#946345' },
  E: { expected: 6, rect: [20, 30, 25, 30], copyRow: 29, boundaryOverlap: true },
  F: { expected: 6, rect: [38, 30, 43, 30], copyRow: 29, boundaryOverlap: true },
};

function fail(message) {
  throw new Error(message);
}

function magick(args, input) {
  const result = spawnSync('magick', args, { input, encoding: null });
  if (result.error) fail(`magick failed to start: ${result.error.message}`);
  if (result.status !== 0) {
    fail(`magick ${args.join(' ')} failed (${result.status}): ${(result.stderr || '').toString()}`);
  }
  return result.stdout || Buffer.alloc(0);
}

function readRawPng(file, format) {
  return magick([file, '-depth', '8', `${format}:-`]);
}

function writePng(file, raw, format, width = WIDTH, height = HEIGHT) {
  magick([
    '-size', `${width}x${height}`,
    '-depth', '8',
    `${format}:-`,
    '-define', 'png:color-type=2',
    '-strip',
    file,
  ], raw);
}

function resizeNearest(source, destination) {
  magick([source, '-filter', 'point', '-resize', '400%', '-strip', destination]);
}

function identifySize(file) {
  return magick(['identify', '-format', '%wx%h', file]).toString().trim();
}

function assertEncodedPixels(label, expected, file) {
  const actual = readRawPng(file, 'rgb');
  if (Buffer.compare(actual, expected) !== 0) fail(`${label}: encoded PNG pixels differ from the deterministic raster`);
}

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)];
}

function rgbToHex(raw, index) {
  return `#${[raw[index], raw[index + 1], raw[index + 2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function pixelOffset(x, y) {
  return (y * WIDTH + x) * 3;
}

function maskOffset(x, y) {
  return y * WIDTH + x;
}

function makeVariant(name, base, mask) {
  const spec = specs[name];
  const variant = Buffer.from(base);
  const [x0, y0, x1, y1] = spec.rect;
  const records = [];
  const targetRgb = spec.color ? hexToRgb(spec.color) : null;

  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const position = maskOffset(x, y);
      if (mask[position] === 0) fail(`${name}: changed coordinate ${x},${y} is outside white mask`);

      const sourceY = spec.copyRow === undefined ? y : spec.copyRow;
      const oldOffset = pixelOffset(x, y);
      const sourceOffset = pixelOffset(x, sourceY);
      const newRgb = targetRgb || [base[sourceOffset], base[sourceOffset + 1], base[sourceOffset + 2]];
      const oldHex = rgbToHex(base, oldOffset);
      const newHex = `#${newRgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
      if (oldHex !== newHex) {
        records.push({
          x,
          y,
          old: oldHex,
          new: newHex,
          mask: mask[position],
          ...(spec.copyRow === undefined ? {} : { copiedFrom: { x, y: sourceY }, source: rgbToHex(base, sourceOffset) }),
        });
        variant[oldOffset] = newRgb[0];
        variant[oldOffset + 1] = newRgb[1];
        variant[oldOffset + 2] = newRgb[2];
      }
    }
  }

  const diffPositions = [];
  for (let i = 0; i < PIXELS; i += 1) {
    const offset = i * 3;
    if (base[offset] !== variant[offset] || base[offset + 1] !== variant[offset + 1] || base[offset + 2] !== variant[offset + 2]) {
      const x = i % WIDTH;
      const y = Math.floor(i / WIDTH);
      diffPositions.push({ x, y });
      if (mask[i] === 0) fail(`${name}: diff outside white mask at ${x},${y}`);
    }
  }

  if (records.length !== spec.expected || diffPositions.length !== spec.expected) {
    fail(`${name}: expected ${spec.expected} changed pixels, got records=${records.length}, diff=${diffPositions.length}`);
  }
  if (records.length > 30) fail(`${name}: changed pixel count exceeds 30`);

  const allowedChanged = new Set(['#9c6944', '#946345']);
  for (const record of records) {
    if (!allowedChanged.has(record.new)) fail(`${name}: changed color ${record.new} is outside wood/red family`);
    if (spec.copyRow !== undefined && record.new !== record.source) {
      fail(`${name}: copied pixel ${record.x},${record.y} does not match row ${spec.copyRow}`);
    }
  }

  for (let i = 0; i < PIXELS; i += 1) {
    if (mask[i] === 0) {
      const offset = i * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        if (base[offset + channel] !== variant[offset + channel]) fail(`${name}: baseline changed outside mask at ${i % WIDTH},${Math.floor(i / WIDTH)}`);
      }
    }
  }

  return { variant, records, diffPositions, spec };
}

function diffHighlight(base, variant) {
  const output = Buffer.from(base);
  for (let i = 0; i < PIXELS; i += 1) {
    const offset = i * 3;
    if (base[offset] !== variant[offset] || base[offset + 1] !== variant[offset + 1] || base[offset + 2] !== variant[offset + 2]) {
      output[offset] = 255;
      output[offset + 1] = 0;
      output[offset + 2] = 255;
    }
  }
  return output;
}

function maskRgb(mask) {
  const output = Buffer.alloc(PIXELS * 3);
  for (let i = 0; i < PIXELS; i += 1) output.fill(mask[i], i * 3, i * 3 + 3);
  return output;
}

function appendPngs(files, destination) {
  magick([...files, '+append', destination]);
}

fs.mkdirSync(OUT, { recursive: true });
const base = readRawPng(BASE_PATH, 'rgb');
const mask = readRawPng(MASK_PATH, 'gray');
if (base.length !== PIXELS * 3) fail(`BASE raw RGB size ${base.length} is not ${PIXELS * 3}`);
if (mask.length !== PIXELS) fail(`mask raw gray size ${mask.length} is not ${PIXELS}`);

const baseNative = path.join(OUT, 'base-native.png');
const base4x = path.join(OUT, 'base-4x.png');
writePng(baseNative, base, 'rgb');
resizeNearest(baseNative, base4x);
if (identifySize(baseNative) !== '64x48') fail('BASE native output dimensions are wrong');
if (identifySize(base4x) !== '256x192') fail('BASE 4x output dimensions are wrong');
assertEncodedPixels('BASE native', base, baseNative);

const results = {};
for (const name of Object.keys(specs)) {
  const result = makeVariant(name, base, mask);
  const nativePath = path.join(OUT, `${name}-native.png`);
  const fourXPath = path.join(OUT, `${name}-4x.png`);
  const diffNativePath = path.join(OUT, `${name}-diff-native.png`);
  const diff4xPath = path.join(OUT, `${name}-diff-4x.png`);
  writePng(nativePath, result.variant, 'rgb');
  resizeNearest(nativePath, fourXPath);
  writePng(diffNativePath, diffHighlight(base, result.variant), 'rgb');
  resizeNearest(diffNativePath, diff4xPath);
  if (identifySize(nativePath) !== '64x48') fail(`${name} native output dimensions are wrong`);
  if (identifySize(fourXPath) !== '256x192') fail(`${name} 4x output dimensions are wrong`);
  if (identifySize(diffNativePath) !== '64x48') fail(`${name} diff native output dimensions are wrong`);
  if (identifySize(diff4xPath) !== '256x192') fail(`${name} diff 4x output dimensions are wrong`);
  assertEncodedPixels(`${name} native`, result.variant, nativePath);

  const metadata = {
    variant: name,
    source: path.relative(process.cwd(), BASE_PATH),
    mask: path.relative(process.cwd(), MASK_PATH),
    boundaryOverlapExploratory: Boolean(result.spec.boundaryOverlap),
    count: result.records.length,
    bbox: {
      minX: Math.min(...result.records.map((p) => p.x)),
      minY: Math.min(...result.records.map((p) => p.y)),
      maxX: Math.max(...result.records.map((p) => p.x)),
      maxY: Math.max(...result.records.map((p) => p.y)),
    },
    coordinates: result.records,
    checks: {
      fromBaseIndependently: true,
      dimensions: { native: '64x48', nearest4x: '256x192' },
      allChangedPixelsInsideWhiteMask: true,
      outsideMaskByteEquivalentToBase: true,
      changedPixelLimit: '<=30',
      changedColorsLocalWoodRedFamily: true,
      noWinnerSelected: true,
    },
    outputs: {
      native: path.relative(process.cwd(), nativePath),
      nearest4x: path.relative(process.cwd(), fourXPath),
      diffNative: path.relative(process.cwd(), diffNativePath),
      diff4x: path.relative(process.cwd(), diff4xPath),
    },
  };
  fs.writeFileSync(path.join(OUT, `${name}.json`), `${JSON.stringify(metadata, null, 2)}\n`);
  results[name] = { ...result, nativePath, fourXPath, diffNativePath, diff4xPath };
}

const maskDisplayPath = path.join(OUT, 'mask-native.png');
const mask4xPath = path.join(OUT, 'mask-4x.png');
writePng(maskDisplayPath, maskRgb(mask), 'rgb');
resizeNearest(maskDisplayPath, mask4xPath);

const nativeSheet = path.join(OUT, 'contact-sheet-native.png');
const fourXSheet = path.join(OUT, 'contact-sheet-4x.png');
appendPngs([baseNative, ...Object.keys(specs).map((name) => path.join(OUT, `${name}-native.png`))], nativeSheet);
appendPngs([base4x, ...Object.keys(specs).map((name) => path.join(OUT, `${name}-4x.png`))], fourXSheet);

const nativeMaskDiffSheet = path.join(OUT, 'contact-sheet-mask-diff-native.png');
const fourXMaskDiffSheet = path.join(OUT, 'contact-sheet-mask-diff-4x.png');
appendPngs([maskDisplayPath, ...Object.keys(specs).map((name) => results[name].diffNativePath)], nativeMaskDiffSheet);
appendPngs([mask4xPath, ...Object.keys(specs).map((name) => results[name].diff4xPath)], fourXMaskDiffSheet);

const manifest = {
  source: path.relative(process.cwd(), BASE_PATH),
  mask: path.relative(process.cwd(), MASK_PATH),
  dimensions: { native: '64x48', nearest4x: '256x192' },
  variants: Object.fromEntries(Object.keys(specs).map((name) => [name, {
    count: results[name].records.length,
    bbox: {
      minX: Math.min(...results[name].records.map((p) => p.x)),
      minY: Math.min(...results[name].records.map((p) => p.y)),
      maxX: Math.max(...results[name].records.map((p) => p.x)),
      maxY: Math.max(...results[name].records.map((p) => p.y)),
    },
    boundaryOverlapExploratory: Boolean(results[name].spec.boundaryOverlap),
  }])),
  checks: {
    everyVariantStartsFromBase: true,
    allChangedPixelsInsideWhiteMask: true,
    baselineOutsideMaskByteEquivalent: true,
    everyVariantAtMost30ChangedPixels: true,
    changedColorsRestrictedToWoodRedFamily: true,
    noWinnerSelected: true,
  },
  outputs: {
    contactSheetNative: path.relative(process.cwd(), nativeSheet),
    contactSheetNearest4x: path.relative(process.cwd(), fourXSheet),
    contactSheetMaskDiffNative: path.relative(process.cwd(), nativeMaskDiffSheet),
    contactSheetMaskDiffNearest4x: path.relative(process.cwd(), fourXMaskDiffSheet),
  },
};
fs.writeFileSync(path.join(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

for (const name of Object.keys(specs)) {
  const result = results[name];
  console.log(`${name}: ${result.records.length} changed; bbox ${manifest.variants[name].bbox.minX},${manifest.variants[name].bbox.minY}..${manifest.variants[name].bbox.maxX},${manifest.variants[name].bbox.maxY}${result.spec.boundaryOverlap ? ' [boundary-overlap exploratory]' : ''}`);
}
console.log('PASS: native 64x48, nearest 4x 256x192, mask containment, <=30 pixels, outside-mask equality, local wood/red colors. No winner selected.');
