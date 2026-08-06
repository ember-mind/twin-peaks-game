#!/usr/bin/env node
'use strict';

const fs = require('node:fs');

const file = process.argv[2];
const expectedWidth = Number(process.argv[3] || 960);
const expectedHeight = Number(process.argv[4] || 640);

function die(message) {
  console.error(`verify-shot: ${message}`);
  process.exit(2);
}

if (!file || !fs.existsSync(file)) die(`file mancante: ${file || '(nessuno)'}`);
const png = fs.readFileSync(file);
if (png.length < 33 || png.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
  die(`${file} non è un PNG valido`);
}
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
if (width !== expectedWidth || height !== expectedHeight) {
  die(`${file}: ${width}x${height}, atteso ${expectedWidth}x${expectedHeight}`);
}
if (png.length < 4096) die(`${file}: PNG sospettosamente piccolo (${png.length} byte)`);
console.log(`ok - ${file}: ${width}x${height}, ${png.length} byte`);
