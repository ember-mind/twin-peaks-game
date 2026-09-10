#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('/opt/homebrew/lib/node_modules/coldstage/node_modules/sharp');

const root = path.resolve(__dirname, '../../..');
const artifactDir = path.resolve(__dirname, '..');
const panelWidth = 512;
const panelHeight = 384;
const labelHeight = 36;
const gap = 16;
const outputWidth = panelWidth * 3 + gap * 2;
const outputHeight = labelHeight + panelHeight;
const sources = [
  { label: 'GOLDEN CONCEPT', path: path.join(root, 'artifacts/sheriffs-station-main-interior-v01/final.png'), kernel: 'lanczos3' },
  { label: 'NATIVE BEFORE', path: path.join(artifactDir, 'native-before-256.png'), kernel: 'nearest' },
  { label: 'NATIVE AFTER', path: path.join(artifactDir, 'native-after-256.png'), kernel: 'nearest' }
];

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function labelSvg(text) {
  return Buffer.from(`<svg width="${panelWidth}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#202723"/><text x="12" y="24" fill="#ece6d4" font-family="Menlo,monospace" font-size="15" font-weight="700" letter-spacing="1">${text}</text></svg>`);
}

(async () => {
  const panels = [];
  for (const source of sources) {
    panels.push(await sharp(source.path)
      .resize(panelWidth, panelHeight, { fit: 'contain', background: '#0d100f', kernel: source.kernel })
      .png()
      .toBuffer());
  }
  const composites = [];
  for (let index = 0; index < sources.length; index += 1) {
    const left = index * (panelWidth + gap);
    composites.push({ input: labelSvg(sources[index].label), left, top: 0 });
    composites.push({ input: panels[index], left, top: labelHeight });
  }
  const outputPath = path.join(artifactDir, 'comparison.png');
  await sharp({ create: { width: outputWidth, height: outputHeight, channels: 4, background: '#151a18' } })
    .composite(composites)
    .png()
    .toFile(outputPath);
  const report = {
    generatedAt: new Date().toISOString(),
    output: path.relative(root, outputPath),
    outputSha256: sha256(outputPath),
    outputDimensions: { width: outputWidth, height: outputHeight },
    panels: sources.map((source) => ({
      label: source.label,
      source: path.relative(root, source.path),
      sourceSha256: sha256(source.path),
      displayedDimensions: { width: panelWidth, height: panelHeight },
      resizeKernel: source.kernel
    }))
  };
  fs.writeFileSync(path.join(__dirname, 'comparison-manifest.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: 'pass', output: report.output, dimensions: report.outputDimensions }));
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
