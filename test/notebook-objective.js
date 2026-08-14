#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const path = require('node:path');

class EventHub {
  constructor() { this.listeners = {}; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  removeEventListener(type, fn) {
    this.listeners[type] = (this.listeners[type] || []).filter(x => x !== fn);
  }
}

class Element {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.className = '';
    this.children = [];
    this.parentNode = null;
    this.attributes = {};
    this.style = {};
    this._text = '';
    this.onclick = null;
  }
  get firstChild() { return this.children[0] || null; }
  get textContent() { return this._text + this.children.map(x => x.textContent).join(''); }
  set textContent(value) { this._text = String(value); this.children = []; }
  appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
  removeChild(child) {
    this.children = this.children.filter(x => x !== child);
    child.parentNode = null;
  }
  remove() { if (this.parentNode) this.parentNode.removeChild(this); }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  getAttribute(key) { return this.attributes[key] ?? null; }
}

function findAll(root, predicate, out = []) {
  if (predicate(root)) out.push(root);
  root.children.forEach(child => findAll(child, predicate, out));
  return out;
}

const window = new EventHub();
const document = { createElement: tag => new Element(tag) };
window.window = window;
window.document = document;
window.GAME = {
  NarrativeRuntime: {
    notebookActions: () => [],
    notebookPairStatus: () => ({ status: 'none', node: null })
  }
};
global.window = window;
global.document = document;

require(path.resolve(__dirname, '../js/narrative-notebook.js'));

(async function () {
  const container = new Element('div');
  let resolverCalls = 0;
  const pending = window.GAME.NarrativeNotebook.open({
    state: { evidence: {}, notebook: [], props: {} },
    mission: { mission: 'M4' },
    missions: [],
    data: { evidence: { evidence: {} }, propositions: { propositions: {} } },
    container,
    inputContext: { suspend() {}, restore() {} },
    getObjectiveText() {
      resolverCalls++;
      return 'Parla con lo sceriffo Truman (a ovest).';
    }
  });

  const objectiveRows = findAll(container, el => el.getAttribute('data-nb-objective') === 'true');
  const sections = findAll(container, el => el.getAttribute('data-nb-section') !== null);
  const close = findAll(container, el => el.getAttribute('data-nb-close') === 'true')[0];

  assert.equal(objectiveRows.length, 1, 'one objective row');
  assert.equal(objectiveRows[0].textContent, 'OBIETTIVO: Parla con lo sceriffo Truman (a ovest).');
  assert.equal(sections.length, 4, 'normal notebook sections preserved');
  assert.equal(resolverCalls, 1, 'single resolver call per render');
  assert(close && typeof close.onclick === 'function', 'touch close remains available');

  close.onclick();
  await pending;
  assert.equal(container.children.length, 0, 'notebook removes its only objective copy on close');

  console.log('NOTEBOOK-OBJECTIVE-PASS 6/6');
})().catch(err => {
  console.error(err.stack || err);
  process.exit(1);
});
