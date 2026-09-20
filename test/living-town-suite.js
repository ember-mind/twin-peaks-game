#!/usr/bin/env node
/* living-town-suite.js — CI entry point for the Living Town checks.
 *
 * The suite itself lives in living-town/test/ so the experience stays
 * self-contained. This file exists because the release runner reads
 * .github/workflows/tests.yml and only accepts `node test/<name>.js`, and a
 * gate that CI cannot see is not a gate.
 */
'use strict';
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const runner = path.join(__dirname, '..', 'living-town', 'test', 'run-all.js');
const result = spawnSync(process.execPath, [runner], { stdio: 'inherit' });
if (result.error) { console.error(result.error.message); process.exit(1); }
process.exit(result.status === null ? 1 : result.status);
