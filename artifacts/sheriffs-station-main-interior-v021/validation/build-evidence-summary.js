#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '../../..');
const native = JSON.parse(fs.readFileSync(path.join(__dirname, 'native-results.json'), 'utf8'));
const preservation = JSON.parse(fs.readFileSync(path.join(__dirname, 'preservation-report.json'), 'utf8'));
const coldstage = JSON.parse(fs.readFileSync(path.join(__dirname, 'coldstage-changed.json'), 'utf8'));
const review = JSON.parse(fs.readFileSync(path.join(__dirname, 'coldstage-review.json'), 'utf8'));
const sheriff = coldstage.scenarios.find((scenario) => scenario.name === 'sheriffsStation');
const artPath = path.join(root, 'js/sheriffs-station-art.js');
const artSha256 = crypto.createHash('sha256').update(fs.readFileSync(artPath)).digest('hex');

const summary = {
  generatedAt: new Date().toISOString(),
  workingDirectory: root,
  sourceCode: {
    file: 'js/sheriffs-station-art.js',
    sha256: artSha256
  },
  execution: [
    ...native.commands.map((entry) => ({
      command: entry.command,
      exitCode: entry.exitCode,
      resultFrom: entry.log
    })),
    {
      command: 'coldstage run changed --json',
      exitCode: coldstage.status === 'pass' ? 0 : null,
      resultFrom: 'artifacts/sheriffs-station-main-interior-v021/validation/coldstage-changed.json',
      reportPath: coldstage.reportPath
    },
    {
      command: `coldstage review sheriffsStation --run ${coldstage.reportPath} --json`,
      exitCode: review.status === 'ready-for-review' ? 0 : null,
      resultFrom: 'artifacts/sheriffs-station-main-interior-v021/validation/coldstage-review.json'
    }
  ],
  evidence: {
    nativeAllPassed: native.allPassed,
    protectedFilesUnchanged: preservation.protectedFilesUnchanged,
    protectedFileCount: preservation.protectedFiles.length,
    geometryUnchanged: preservation.geometryUnchanged,
    coldstageStatus: coldstage.status,
    sheriffRuntimeStatus: sheriff.status,
    sheriffChecks: sheriff.checks,
    sheriffConsoleSevere: sheriff.consoleSevere,
    sheriffPixelDiff: sheriff.pixelDiff,
    sheriffReviewStatus: review.status,
    sheriffContactSheet: review.contactSheet,
    sourceCaptures: review.sourceArtifacts
  },
  baselineAction: 'none'
};
fs.writeFileSync(path.join(__dirname, 'evidence-summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ status: 'pass', output: 'artifacts/sheriffs-station-main-interior-v021/validation/evidence-summary.json' }));
