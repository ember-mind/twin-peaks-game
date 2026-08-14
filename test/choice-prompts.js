'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const missionDir = path.join(root, 'narrative', 'missions');
let checked = 0;

fs.readdirSync(missionDir).filter(file => file.endsWith('.json')).forEach(file => {
  const mission = JSON.parse(fs.readFileSync(path.join(missionDir, file), 'utf8'));
  (mission.nodes || []).filter(node => Array.isArray(node.choices)).forEach(node => {
    assert.ok(typeof node.prompt === 'string' && node.prompt.trim(), `${file}:${node.id} choice prompt missing`);
    assert.ok(node.prompt.length <= 48, `${file}:${node.id} choice prompt too long for mobile`);
    checked++;
  });
});

assert.ok(checked >= 10, `choice coverage unexpectedly small: ${checked}`);
console.log(`CHOICE-PROMPTS-PASS ${checked}/${checked}`);
