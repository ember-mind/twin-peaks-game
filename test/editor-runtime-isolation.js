#!/usr/bin/env node
'use strict';

// Editor/runtime isolation — proves the editor core is a DEV-only surface, never reached
// by the game at runtime. The invariant "no runtime path imports editor core except through
// the adapter" means: index.html (the game) loads ZERO js/editor/* and zero world-builder-data;
// only the dev page wires editor code, and it does so via the sole adapter. This test reads
// the static HTML + scans core files — no GAME global, fully headless.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
let pass = 0;
function ok(cond, label) { assert.ok(cond, label); pass++; }

function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }

// ---- the game runtime (index.html) reaches neither core nor adapter ----
const indexHtml = read('index.html');
ok(!/js\/editor\//.test(indexHtml), 'index.html loads zero js/editor/* (runtime never imports core)');
ok(!/world-builder-data/.test(indexHtml), 'index.html loads zero world-builder-data (no editor data at runtime)');

// ---- the dev page is where editor wiring lives, and it goes through the adapter ----
const wb = read('world-builder.html');
ok(/world-builder-data\.js/.test(wb), 'world-builder.html (dev page) wires editor code via the sole adapter');

// ---- core stays game-agnostic: no GAME / location-data / Twin Peaks token anywhere in core ----
// This is the "except through the adapter" half — only js/world-builder-data.js may be
// game-aware; everything under js/editor/core/ must not name the game.
const banned = /\bGAME\b|location-data|Twin Peaks/;
const coreDir = path.join(root, 'js', 'editor', 'core');
function listCore(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? listCore(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}
const coreFiles = listCore(coreDir);
ok(coreFiles.length >= 1, 'core has at least one module to scan');
let tainted = [];
for (const f of coreFiles) {
  if (banned.test(fs.readFileSync(f, 'utf8'))) tainted.push(path.relative(root, f));
}
ok(tainted.length === 0, `no core file names the game (offenders: ${tainted.join(', ') || 'none'})`);

// ---- core is also UI-free: it never touches DOM/canvas/rAF/storage, even in code with comments removed ----
// hit-test.js / interaction.js MENTION canvas/document/window in comments that assert they avoid it, so the
// scan strips block + line comments first; otherwise a naive token match would false-fail on those very guards.
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}
// Message text is not usage either ('unknown window "X"' in js/editor/core/cast.js): blank single/double-quoted literals.
function stripStrings(src) {
  return src.replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g, "''");
}
// `window` as a data field (a cast window: `op.window`, `{ window: id }`, `'window'`) is not the browser global.
const UI_USAGE = /document\.|(?<![.\w'"])window\b(?!\s*:|['"])|\.getContext\(|requestAnimationFrame|cancelAnimationFrame|\blocalStorage\b|\bsessionStorage\b/;
let uiTainted = [];
for (const f of coreFiles) {
  if (UI_USAGE.test(stripStrings(stripComments(fs.readFileSync(f, 'utf8'))))) uiTainted.push(path.relative(root, f));
}
ok(uiTainted.length === 0, `core is UI-free: no DOM/canvas/rAF/storage usage (offenders: ${uiTainted.join(', ') || 'none'})`);
// Evidence the exact files scanned, so any module later added under js/editor/core/ is visibly auto-covered.
ok(UI_USAGE.test(stripStrings('if (typeof window !== "undefined") window.GAME = 1;')) && UI_USAGE.test('var w = window;') && UI_USAGE.test(stripStrings("document.body")) &&
  !UI_USAGE.test(stripStrings("op.window + { window: id }['window'] + fail('unknown window ' + id)")), 'UI guard still catches the window global, not a cast window field or message text');
console.log('EDITOR-RUNTIME-ISOLATION-SCAN core=[' + coreFiles.map(f => path.relative(root, f)).join(', ') + ']');

console.log(`EDITOR-RUNTIME-ISOLATION-PASS ${pass}`);
