#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

class Target {
  constructor() { this.listeners = {}; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  removeEventListener(type, fn) {
    this.listeners[type] = (this.listeners[type] || []).filter(x => x !== fn);
  }
  dispatchEvent(event) {
    event.target ||= this;
    for (const fn of (this.listeners[event.type] || []).slice()) fn(event);
    return true;
  }
}

class Element extends Target {
  constructor(tag) {
    super();
    this.tagName = tag.toUpperCase();
    this.style = {};
    this.children = [];
    this.parentNode = null;
    this.className = '';
    this.attributes = {};
    this.textContent = '';
  }
  appendChild(el) { el.parentNode = this; this.children.push(el); return el; }
  removeChild(el) { this.children = this.children.filter(x => x !== el); el.parentNode = null; }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] ?? null; }
  getBoundingClientRect() {
    const width = parseInt(this.style.width, 10) || 150;
    const height = parseInt(this.style.height, 10) || 150;
    return { left: 0, top: 0, right: width, bottom: height, width, height };
  }
}

const body = new Element('body');
const document = new Target();
document.readyState = 'complete';
document.body = body;
document.hidden = false;
document.createElement = tag => new Element(tag);

const keys = [];
class KeyboardEvent {
  constructor(type, init) { this.type = type; this.code = init.code; }
}
const window = new Target();
window.window = window;
window.document = document;
window.navigator = { maxTouchPoints: 0 };
window.location = { search: '?touch=1' };
window.innerWidth = 390;
window.innerHeight = 844;
window.visualViewport = Object.assign(new Target(), { width: 390, height: 844 });
window.matchMedia = () => ({ matches: false });
window.requestAnimationFrame = () => 1;
window.KeyboardEvent = KeyboardEvent;
window.dispatchEvent = event => { keys.push([event.type, event.code]); return Target.prototype.dispatchEvent.call(window, event); };
window.GAME = { Engine: { state: { mode: 'play', menu: null, dialogue: null } } };

let clock = 10;
const context = vm.createContext({
  window, document, navigator: window.navigator, KeyboardEvent,
  performance: { now: () => clock }, Date, Math, console
});
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../js/touch.js'), 'utf8'), context);

const event = (type, changedTouches, target) => ({
  type, changedTouches, target: target || body, preventDefault() {}
});
const controls = body.children.filter(el => el.className === 'tp-touch-ctrl');
const dpad = controls.find(el => el.tagName === 'DIV');
const buttons = controls.filter(el => el.tagName === 'BUTTON');
const a = buttons.find(el => /Interagisci/.test(el.getAttribute('aria-label') || ''));
const b = buttons.find(el => /fascicolo/.test(el.getAttribute('aria-label') || ''));
const checks = {};

checks.controls_created = !!dpad && !!a && !!b;
checks.touch_mode_enabled = window.GAME.touchMode === true;
checks.portrait_targets_large = parseInt(dpad.style.width, 10) >= 128 &&
  parseInt(a.style.width, 10) >= 44 && parseInt(b.style.width, 10) >= 44;

keys.length = 0;
dpad.dispatchEvent(event('touchstart', [{ identifier: 1, clientX: 145, clientY: 75 }], dpad));
dpad.dispatchEvent(event('touchend', [{ identifier: 1, clientX: 145, clientY: 75 }], dpad));
checks.dpad_holds_and_releases = JSON.stringify(keys) === JSON.stringify([
  ['keydown', 'ArrowRight'], ['keyup', 'ArrowRight']
]);

keys.length = 0;
a.dispatchEvent(event('touchstart', [{ identifier: 2, clientX: 1, clientY: 1 }], a));
a.dispatchEvent(event('touchend', [{ identifier: 2, clientX: 1, clientY: 1 }], a));
b.dispatchEvent(event('touchstart', [{ identifier: 3, clientX: 1, clientY: 1 }], b));
b.dispatchEvent(event('touchend', [{ identifier: 3, clientX: 1, clientY: 1 }], b));
checks.ab_emit_engine_keys = JSON.stringify(keys) === JSON.stringify([
  ['keydown', 'Enter'], ['keyup', 'Enter'], ['keydown', 'Escape'], ['keyup', 'Escape']
]);

keys.length = 0;
window.GAME.NarrativeAdapter = { active: () => false, isNotebookEnabled: () => true };
b.dispatchEvent(event('touchstart', [{ identifier: 31, clientX: 1, clientY: 1 }], b));
b.dispatchEvent(event('touchend', [{ identifier: 31, clientX: 1, clientY: 1 }], b));
checks.mobile_b_opens_narrative_notebook = JSON.stringify(keys) === JSON.stringify([
  ['keydown', 'KeyT'], ['keyup', 'KeyT']
]);

keys.length = 0;
dpad.dispatchEvent(event('touchstart', [{ identifier: 4, clientX: 75, clientY: 145 }], dpad));
window.dispatchEvent({ type: 'blur' });
checks.blur_releases_direction = keys.some(x => x[0] === 'keyup' && x[1] === 'ArrowDown');

keys.length = 0;
window.GAME.NarrativeAdapter = { active: () => true, isNotebookEnabled: () => true };
window.GAME.RetroUI = { inspect: () => ({ kind: 'choice', index: 0, count: 3 }) };
window.dispatchEvent({ type: 'resize' });
checks.narrative_choice_controls_visible = dpad.style.visibility === 'visible' &&
  dpad.style.pointerEvents === 'auto' && a.style.visibility === 'visible' &&
  a.getAttribute('aria-label') === 'Conferma scelta' && b.style.visibility === 'hidden';

keys.length = 0;
dpad.dispatchEvent(event('touchstart', [{ identifier: 41, clientX: 75, clientY: 145 }], dpad));
dpad.dispatchEvent(event('touchend', [{ identifier: 41, clientX: 75, clientY: 145 }], dpad));
dpad.dispatchEvent(event('touchstart', [{ identifier: 42, clientX: 75, clientY: 5 }], dpad));
dpad.dispatchEvent(event('touchend', [{ identifier: 42, clientX: 75, clientY: 5 }], dpad));
checks.narrative_choice_dpad_changes_focus = JSON.stringify(keys) === JSON.stringify([
  ['keydown', 'ArrowDown'], ['keyup', 'ArrowDown'],
  ['keydown', 'ArrowUp'], ['keyup', 'ArrowUp']
]);

keys.length = 0;
a.dispatchEvent(event('touchstart', [{ identifier: 43, clientX: 1, clientY: 1 }], a));
a.dispatchEvent(event('touchend', [{ identifier: 43, clientX: 1, clientY: 1 }], a));
checks.narrative_choice_a_confirms_once = JSON.stringify(keys) === JSON.stringify([
  ['keydown', 'Enter'], ['keyup', 'Enter']
]);

keys.length = 0;
clock = 20;
document.dispatchEvent(event('touchstart', [{ identifier: 5, clientX: 20, clientY: 20 }], body));
clock = 40;
document.dispatchEvent(event('touchend', [{ identifier: 5, clientX: 20, clientY: 20 }], body));
checks.narrative_tap_not_duplicated = !keys.some(x => x[1] === 'Enter');

window.GAME.RetroUI = { inspect: () => ({ kind: 'page', part: 0, parts: 1 }) };
window.dispatchEvent({ type: 'resize' });
checks.narrative_page_has_single_advance_control = dpad.style.visibility === 'hidden' &&
  a.style.visibility === 'visible' && a.getAttribute('aria-label') === 'Avanza dialogo' &&
  b.style.visibility === 'hidden';

window.GAME.NarrativeAdapter = { active: () => false, isNotebookEnabled: () => false };
window.GAME.RetroUI = { inspect: () => null };
document.querySelectorAll = selector => selector === '#narrative .nw-save-recovery .nw-opt' ? [{}, {}] : [];
window.GAME.Engine.state.mode = 'title';
window.dispatchEvent({ type: 'resize' });
checks.recovery_choice_has_mobile_dpad_and_confirm = dpad.style.visibility === 'visible' &&
  dpad.style.pointerEvents === 'auto' && a.style.visibility === 'visible' &&
  a.getAttribute('aria-label') === 'Conferma scelta' && b.style.visibility === 'hidden';

let passed = 0;
for (const [name, ok] of Object.entries(checks)) {
  console.log(`${ok ? 'ok' : 'not ok'} - ${name}`);
  if (ok) passed++;
}
console.log(`\nTOUCH-RUNTIME-${passed === Object.keys(checks).length ? 'PASS' : 'FAIL'} ${passed}/${Object.keys(checks).length}`);
if (passed !== Object.keys(checks).length) process.exit(1);
