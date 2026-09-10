#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const artifactDir = path.resolve(__dirname, '..');
const review = JSON.parse(fs.readFileSync(path.join(__dirname, 'coldstage-review.json'), 'utf8'));
const names = {
  'sheriffsStation-native-clean.png': 'native-after.png',
  'sheriffsStation-native-debug.png': 'native-debug.png',
  'sheriffsStation-reception-access.png': 'reception-access.png',
  'sheriffsStation-right-workspace.png': 'right-workspace.png',
  'sheriffsStation-files-access.png': 'files-access.png',
  'sheriffsStation-rear-door.png': 'rear-door.png',
  'sheriffsStation-depth-behind.png': 'depth-behind.png',
  'sheriffsStation-depth-front.png': 'depth-front.png'
};

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

const captures = review.sourceEvidence.map((source) => {
  const sourcePath = path.join(root, source.path);
  const outputName = names[path.basename(source.path)];
  assert(outputName, `known semantic output name for ${source.path}`);
  const verifiedSourceSha256 = sha256(sourcePath);
  assert.equal(verifiedSourceSha256, source.sha256, `review manifest hash matches ${source.path}`);
  const outputPath = path.join(artifactDir, outputName);
  fs.copyFileSync(sourcePath, outputPath);
  const outputSha256 = sha256(outputPath);
  assert.equal(outputSha256, source.sha256, `copied bytes match ${outputName}`);
  return {
    source: source.path,
    sourceSha256: source.sha256,
    output: path.relative(root, outputPath),
    outputSha256,
    bytes: fs.statSync(outputPath).size,
    exactCopy: true
  };
});

assert.equal(captures.length, 8, 'all eight sheriff captures copied');
const manifest = {
  generatedAt: new Date().toISOString(),
  reviewRunId: review.runId,
  sourceCount: review.sourceArtifacts,
  captures
};
fs.writeFileSync(path.join(__dirname, 'capture-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ status: 'pass', captures: captures.length, exactCopies: true }));
