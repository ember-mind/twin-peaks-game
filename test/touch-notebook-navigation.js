'use strict';
// Extend the existing touch DOM fixture while executing the actual controller.
// Real notebook navigation is separately checked by the production browser test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const fixture = fs.readFileSync(path.join(__dirname, 'touch-runtime.js'), 'utf8');
const marker = 'let passed = 0;';
assert.equal(fixture.split(marker).length, 2, 'Known fixture assertion boundary');
const extra = `
const notebookRoot = { className: 'nw-root nb-root', style: { display: '' } };
const nestedChoice = { className: 'nw-root', style: { display: '' }, querySelector: () => ({}) };
let visibleRoots = [notebookRoot];
document.querySelectorAll = selector => selector === '#narrative .nw-root' ? visibleRoots : [];
window.GAME.Engine.state.mode = 'play';
window.GAME.NarrativeAdapter = { active: () => true, isNotebookEnabled: () => true };
window.GAME.RetroUI = { inspect: () => ({ kind: 'choice' }) };
window.dispatchEvent({ type: 'resize' });
checks.notebook_has_back_control = b.style.visibility === 'visible' && b.style.pointerEvents === 'auto' &&
  b.getAttribute('aria-label') === 'Indietro nel taccuino';
checks.notebook_retains_navigation = dpad.style.visibility === 'visible' && a.style.visibility === 'visible';
keys.length = 0;
b.dispatchEvent(event('touchstart', [{ identifier: 51, clientX: 1, clientY: 1 }], b));
b.dispatchEvent(event('touchend', [{ identifier: 51, clientX: 1, clientY: 1 }], b));
checks.notebook_back_is_escape_once = JSON.stringify(keys) === JSON.stringify([['keydown','Escape'],['keyup','Escape']]);
keys.length = 0; clock = 100;
document.dispatchEvent(event('touchstart', [{ identifier: 52, clientX: 20, clientY: 20 }], body));
clock = 120;
document.dispatchEvent(event('touchend', [{ identifier: 52, clientX: 20, clientY: 20 }], body));
checks.notebook_generic_tap_does_not_confirm = !keys.some(k => k[1] === 'Enter');
notebookRoot.style.display = 'none'; visibleRoots = [notebookRoot, nestedChoice];
window.dispatchEvent({ type: 'resize' });
checks.nested_comparison_keeps_own_controls = b.style.visibility === 'hidden' && a.getAttribute('aria-label') === 'Conferma scelta';
visibleRoots = [notebookRoot]; notebookRoot.style.display = '';
window.dispatchEvent({ type: 'resize' });
checks.return_from_comparison_restores_back = b.style.visibility === 'visible';
visibleRoots = []; window.GAME.NarrativeAdapter.active = () => false;
window.GAME.RetroUI = { inspect: () => null };
window.dispatchEvent({ type: 'resize' }); keys.length = 0;
b.dispatchEvent(event('touchstart', [{ identifier: 53, clientX: 1, clientY: 1 }], b));
b.dispatchEvent(event('touchend', [{ identifier: 53, clientX: 1, clientY: 1 }], b));
checks.after_close_b_opens_notebook = JSON.stringify(keys) === JSON.stringify([['keydown','KeyT'],['keyup','KeyT']]);
`;
vm.runInNewContext(fixture.replace(marker, extra + '\n' + marker), {
  require, __dirname, console,
  process: { exit(code) { if (code) throw new Error('Actual touch notebook contracts failed'); } }
}, { filename: 'touch-runtime-with-notebook-checks.js' });
