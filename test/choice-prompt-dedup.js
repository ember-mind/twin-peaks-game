'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const missionDir = path.join(root, 'narrative', 'missions');
const stop = new Set(['a', 'al', 'alla', 'che', 'cosa', 'della', 'di', 'e', 'il', 'la', 'le', 'lo', 'l', 'un', 'una']);
let checked = 0;

function words(text) {
  return String(text || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/)
    .filter((word) => word && !stop.has(word));
}

function duplicatesPrompt(pageText, prompt) {
  const page = words(pageText);
  const ask = words(prompt);
  if (!page.length || !ask.length) return false;
  if (page.join(' ') === ask.join(' ')) return true;
  const shared = new Set(page.filter((word) => ask.includes(word))).size;
  if (Math.min(page.length, ask.length) >= 2 && shared / Math.min(page.length, ask.length) >= 0.8) return true;
  return semanticIntent(pageText) && semanticIntent(pageText) === semanticIntent(prompt);
}

function semanticIntent(text) {
  const normalized = String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/promess|promett/.test(normalized)) return 'promise';
  if (/avvertiment/.test(normalized) && /(chi|ricev|sent|destinat|scelg)/.test(normalized)) return 'warning_recipient';
  if (/\bdove\b.*\b(vai|andare|direzion|luog)|scelg[^.]{0,30}direzion/.test(normalized)) return 'destination';
  if (/metod[^.]{0,30}jacques|come[^.]{0,30}(sied|affront)[^.]{0,30}jacques|scelg[^.]{0,30}metod/.test(normalized)) return 'interrogation_method';
  if (/che cosa[^.]{0,30}(dimostr|aggiung)|(?:dimostr|aggiung)[^.]{0,50}(confront|testimon|pendagli)/.test(normalized)) return 'comparison_conclusion';
  return '';
}

[
  ['La promessa a Maddy.', 'Che cosa prometti a Maddy?'],
  ['Scelgo chi deve sentire l’avvertimento.', 'Chi deve ricevere l’avvertimento?'],
  ['Dove andare, adesso?', 'Dove vai?'],
  ['Scelgo il metodo prima della domanda.', 'Quale metodo usi con Jacques?'],
  ['Che cosa aggiunge il pendaglio alla testimonianza?', 'Che cosa dimostra il confronto?']
].forEach(([page, prompt]) => {
  assert.ok(duplicatesPrompt(page, prompt), `fixture semantica non rilevata: ${page}`);
});

fs.readdirSync(missionDir).filter((file) => file.endsWith('.json')).forEach((file) => {
  const mission = JSON.parse(fs.readFileSync(path.join(missionDir, file), 'utf8'));
  (mission.nodes || []).filter((node) => node.prompt && Array.isArray(node.pages) && node.pages.length).forEach((node) => {
    node.pages.slice(-3).forEach((page) => assert.ok(!duplicatesPrompt(page.text, node.prompt),
      `${file}:${node.id}:${page.id} ripete semanticamente il prompt nelle tre pagine precedenti`));
    checked++;
  });
});

assert.ok(checked >= 10, `copertura pre-choice insufficiente: ${checked}`);
console.log(`CHOICE-PROMPT-DEDUP-PASS ${checked}/${checked}`);
