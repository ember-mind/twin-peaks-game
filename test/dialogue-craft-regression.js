'use strict';

/* Dialogue craft regression: protegge il primo arco revisionato senza fingere
 * che gusto e sottotesto siano interamente automatizzabili. Qui testiamo i
 * segnali osservabili usati nella diagnosi: voce, tattica, dettaglio concreto,
 * leggibilita' e contratti di stato. */

const assert = require('assert');
const path = require('path');

global.window = global;
require(path.join(__dirname, '..', 'js', 'data.js'));

const D = global.GAME.Data.dialogues;
let checks = 0;

function ok(value, label) {
  assert(value, label);
  checks++;
  console.log('  ok - ' + label);
}

const scenes = {
  bobby: {
    speakers: ['BOBBY', 'BOBBY', 'COOPER', 'BOBBY'],
    anchors: [/Shelly/i, /guardi me/i, /dove si trovava/i],
    counter: { speaker: 'BOBBY', anchor: /messo in bocca/i }
  },
  jacoby: {
    speakers: ['JACOBY', 'JACOBY', 'COOPER', 'JACOBY'],
    anchors: [/cocco/i, /penna/i, /quale domanda/i],
    counter: { speaker: 'JACOBY', anchor: /medico e paziente/i }
  },
  truman: {
    speakers: ['TRUMAN', 'TRUMAN', 'COOPER', 'TRUMAN', 'TRUMAN', 'COOPER'],
    anchors: [/diario/i, /ROBERT/i, /pasti a domicilio/i],
    give: ['diario']
  },
  lucy: {
    speakers: ['LUCY', 'LUCY', 'COOPER', 'LUCY'],
    anchors: [/centralino/i, /respiro/i, /orari/i]
  },
  andy: {
    speakers: ['ANDY', 'ANDY', 'COOPER'],
    anchors: [/diciassette/i, /rapporto/i, /cinque minuti/i]
  },
  hawk: {
    speakers: ['HAWK', 'HAWK', 'COOPER', 'HAWK'],
    anchors: [/animale/i, /passi/i, /dove ti sei fermato/i],
    counter: { speaker: 'HAWK', anchor: /camminerà davanti/i }
  },
  sarah: {
    speakers: ['SARAH', 'SARAH', 'COOPER', 'SARAH'],
    anchors: [/corridoio/i, /sorriso/i, /letto, la finestra o la porta/i],
    counter: { speaker: 'SARAH', anchor: /una cosa cancella l'altra/i }
  },
  leland: {
    speakers: ['LELAND', 'LELAND', 'COOPER', 'LELAND'],
    anchors: [/ballo/i, /salotto/i, /che disco/i],
    counter: { speaker: 'LELAND', anchor: /chiudo le tende/i }
  },
  benhorne_a2: {
    speakers: ['BEN HORNE', 'BEN HORNE', 'COOPER', 'BEN HORNE'],
    anchors: [/315/i, /nulla\. Nulla/i, /la sera l'ha portata lei/i]
  },
  audrey_a2: {
    speakers: ['AUDREY', 'AUDREY', 'COOPER', 'AUDREY'],
    anchors: [/banco profumi/i, /nessuno, e in questo sono brava/i, /chiamo suo padre/i],
    setFlag: 'audrey_indaga'
  },
  shelly: {
    speakers: ['SHELLY', 'SHELLY', 'COOPER', 'SHELLY'],
    anchors: [/con Laura/i, /prima controllava la porta/i, /niente da sapere/i],
    counter: { speaker: 'SHELLY', anchor: /se lo proteggete/i }
  },
  loglady: {
    speakers: ['LOG LADY', 'LOG LADY', 'COOPER', 'LOG LADY'],
    anchors: [/ceppo/i, /fuoco/i, /dov'era lei/i],
    counter: { speaker: 'LOG LADY', anchor: /non lo porto in centrale/i }
  }
};

// audrey_oej: rimosso dal layer classico, e' mission-owned (M6).
const bridges = {
  truman_a2: {
    speakers: ['COOPER', 'COOPER', 'TRUMAN', 'TRUMAN'],
    anchors: [/nome che non abbiamo/i, /qualcosa che abbiamo/i, /venditore di scarpe/i]
  },
  truman_atto3: {
    speakers: ['COOPER', 'TRUMAN', 'TRUMAN', 'COOPER'],
    anchors: [/due fatti/i, /e il luogo/i, /partiamo dalla scena/i],
    setFlag: 'atto3'
  },
  sarah_visione: {
    speakers: ['SARAH', 'SARAH', 'SARAH', 'COOPER'],
    anchors: [/sorriso/i, /io scrivo/i, /non deve difendersi/i],
    setFlag: 'sarah_visione_ascoltata'
  },
  loglady_a4: {
    speakers: ['LOG LADY', 'LOG LADY', 'LOG LADY', 'COOPER'],
    anchors: [/luogo e ora/i, /ci sarò/i]
  },
  leland_interr: {
    speakers: ['', 'COOPER', '', 'BOB', '', 'BOB', 'LELAND', 'COOPER'],
    anchors: [/dov'era lei/i, /dall'infanzia/i, /stesso volto/i],
    setFlag: 'leland_confessa'
  },
  bob_finale: {
    speakers: ['', 'BOB', 'BOB', 'COOPER'],
    anchors: [/guanto/i, /firma sotto le ammissioni/i, /Leland Palmer/i]
  }
};

console.log('# scene primo arco');
for (const [id, spec] of Object.entries(scenes)) {
  const scene = D[id];
  ok(!!scene, `${id}: scena presente`);
  ok(scene.pages.map((page) => page.name).join('|') === spec.speakers.join('|'), `${id}: turni e numero pagine stabili`);
  ok(scene.pages.every((page) => page.text.length <= 129), `${id}: testo entro limite UI di 129 caratteri`);

  const corpus = scene.pages.map((page) => page.text).join('\n');
  for (const anchor of spec.anchors) {
    ok(anchor.test(corpus), `${id}: conserva dettaglio concreto ${anchor}`);
  }

  if (spec.counter) {
    const reply = scene.pages[scene.pages.length - 1];
    ok(reply.name === spec.counter.speaker, `${id}: l'NPC riprende il turno dopo la domanda di Cooper`);
    ok(spec.counter.anchor.test(reply.text), `${id}: la contro-risposta protegge una propria agenda`);
  }

  if (spec.give) ok(JSON.stringify(scene.give) === JSON.stringify(spec.give), `${id}: contratto indizi invariato`);
  if (spec.setFlag) ok(scene.setFlag === spec.setFlag, `${id}: contratto flag invariato`);
}

console.log('# ponti Atto 2-5');
for (const [id, spec] of Object.entries(bridges)) {
  const scene = D[id];
  ok(!!scene, `${id}: ponte presente`);
  ok(scene.pages.map((page) => page.name).join('|') === spec.speakers.join('|'), `${id}: turni e numero pagine stabili`);
  ok(scene.pages.every((page) => page.text.length <= 129), `${id}: testo entro limite UI di 129 caratteri`);
  const corpus = scene.pages.map((page) => page.text).join('\n');
  for (const anchor of spec.anchors) ok(anchor.test(corpus), `${id}: conserva funzione drammatica ${anchor}`);
  if (spec.setFlag) ok(scene.setFlag === spec.setFlag, `${id}: contratto flag invariato`);
}

console.log('# vecchie formule autoriali rimosse');
const oldLines = [
  'Shelly è una persona, non un alibi',
  'Quale porta ha provato ad aprire',
  'La sua precisione sarà più utile della paura',
  'Il dolore non rende debole il rapporto',
  'La visione è un dato, non una colpa',
  'Il dolore ha un ritmo',
  'Una difesa così precisa indica il punto da verificare',
  'L’invisibilità non è un piano',
  "L'invisibilità non è un piano",
  'Quale dettaglio ricorda davvero, e quale ha aggiunto dopo',
  'Il ceppo non è un testimone verificabile',
  'la lista dei sospetti cresce più in fretta',
  'Questo non è un gioco, per te',
  'con lei succede sempre qualcosa di strano',
  'il suo ceppo ha un ottimo senso della procedura',
  'Domani chiudo questo cerchio',
  'Una mano senza impronte è una vanteria'
];
const revisedCorpus = Object.keys(scenes).concat(Object.keys(bridges))
  .flatMap((id) => D[id].pages.map((page) => page.text))
  .join('\n');
for (const line of oldLines) ok(!revisedCorpus.includes(line), `formula rimossa: "${line}"`);

console.log('# Cooper agisce nella conversazione');
for (const id of Object.keys(scenes)) {
  const cooper = D[id].pages.filter((page) => page.name === 'COOPER');
  ok(cooper.length >= 1, `${id}: almeno una contromossa Cooper leggibile`);
  ok(cooper.every((page) => /[?.:]|\b(?:cominci|finisca|fammi|scriva|guardi)\b/i.test(page.text)), `${id}: ogni battuta di Cooper contiene domanda, ordine o pressione concreta`);
}

console.log(`dialogue-craft-regression: PASS (${checks} checks; ${Object.keys(scenes).length} scene, ${Object.keys(bridges).length} ponti)`);
