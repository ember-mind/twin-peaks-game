#!/usr/bin/env node
'use strict';

/* Instrument bounded production capture driver only to accept this test's
 * 160x144 native canvas. Chrome still runs headless with SwiftShader. */
const fs = require('node:fs');
const path = require('node:path');
const driverPath = path.join(__dirname, 'capture-chrome.js');
const source = fs.readFileSync(driverPath, 'utf8').replace(/^#![^\n]*\n/, '');
const expected = "      if (nw !== 256 || nh !== 192) throw new Error(`native frame is ${nw}x${nh}, expected 256x192`);";
if (!source.includes(expected)) throw new Error('capture native-size guard changed');
const instrumented = source.replace(
  expected,
  "      if (nw !== 160 || nh !== 144) throw new Error(`native frame is ${nw}x${nh}, expected 160x144`);"
);
new Function('require', '__dirname', '__filename', instrumented)(require, __dirname, driverPath);
