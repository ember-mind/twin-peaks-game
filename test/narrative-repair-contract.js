'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
global.window = global;
require(path.join(root, 'js', 'data.js'));

const Data = global.GAME.Data;
const D = Data.dialogues;
const M4 = JSON.parse(fs.readFileSync(path.join(root, 'narrative', 'missions', 'M4.json'), 'utf8'));
const M6Source = fs.readFileSync(path.join(root, 'narrative', 'missions', 'M6.json'), 'utf8');
const finaleSource = fs.readFileSync(path.join(root, 'js', 'narrative-finale.js'), 'utf8');
let checks = 0;

function ok(value, label) {
  assert.ok(value, label);
  checks++;
}

function corpus(dialogue) {
  return (dialogue.pages || []).map((page) => page.text).join(' ');
}

const dream = D.laura_sogno.pages;
const grey = dream.findIndex((page) => /capelli lunghi e grigi/i.test(page.text));
const whisper = dream.findIndex((page) => /sussurra un nome/i.test(page.text));
ok(grey >= 0 && whisper > grey, 'il sogno mostra l’uomo dai capelli grigi prima del sussurro');

const cemetery = corpus(D.landmark_cemetery) + ' ' + corpus(D.tomba_laura);
ok(/Laura Palmer/i.test(cemetery) && /diciassette anni/i.test(cemetery), 'il cimitero nomina Laura e la sua età concreta');
ok(/foto/i.test(cemetery) && /torta/i.test(cemetery) && /fascicolo/i.test(cemetery) && /non ridurr(?:e|ò)/i.test(cemetery),
  'il cimitero restituisce Laura come persona attraverso un oggetto umano concreto');
ok(!/memoriale provvisorio|funerale|terra (?:è )?ancora smossa|Riposa, Laura|stamattina/i.test(cemetery),
  'il cimitero è statico e non presume un momento della timeline');

const room = D.laura_room.pages;
ok(room.some((page) => /Sotto il cuscino/.test(page.text) && /ciondolo/i.test(page.text)), 'sotto il cuscino resta soltanto il ciondolo');
ok(room.some((page) => page.name === 'ANDY' && /medico legale/i.test(page.text) && /lettera R/i.test(page.text)), 'la R arriva da Andy via radio');
ok(!room.some((page) => /rapporto dell.autopsia/i.test(page.text)), 'il rapporto dell’autopsia non appare nella camera di Laura');

const counters = {
  bobby: ['BOBBY', /messo in bocca/i],
  jacoby: ['JACOBY', /medico e paziente/i],
  hawk: ['HAWK', /cammini davanti/i],
  sarah: ['SARAH', /una cosa cancella l'altra/i],
  leland: ['LELAND', /chiudo le tende/i],
  shelly: ['SHELLY', /se lo proteggete/i],
  loglady: ['LOG LADY', /non lo porto in centrale/i]
};
Object.entries(counters).forEach(([id, expected]) => {
  const last = D[id].pages[D[id].pages.length - 1];
  ok(last.name === expected[0] && expected[1].test(last.text), `${id} oppone una contro-risposta alla domanda di Cooper`);
});

ok(/dall'infanzia/i.test(corpus(D.leland_interr)) && !/\b(?:sei|dodici) anni\b/i.test(corpus(D.leland_interr)),
  'il classico usa infanzia senza fissare un’età contraddittoria');
ok(/Da bambino/.test(finaleSource) && !/Avevo (?:sei|dodici) anni/.test(finaleSource),
  'il finale usa infanzia senza fissare sei o dodici anni');

const luogo = M4.nodes.find((node) => node.id === 'ronette_luogo');
const laura = M4.nodes.find((node) => node.id === 'ronette_laura');
ok(luogo.pages[0].mode === 'action' && /indica la porta/i.test(luogo.pages[0].text), 'la scelta porta esegue il gesto promesso');
ok(laura.pages[0].mode === 'action' && /posa la foto di Laura/i.test(laura.pages[0].text), 'la scelta foto esegue il gesto promesso');

const death = corpus(D.leland_morte);
ok(/urto/.test(death) && /tubo cede/.test(death) && /acqua invade/.test(death), 'la morte di Leland ha una causa fisica visibile');
ok(/foto di Laura/.test(death) && /non risponde/.test(death), 'Cooper mostra la foto e non concede assoluzione');
ok(D.leland_morte.pages.every((page) => !page.name || !/^\s*[(*]/.test(page.text)), 'nessuna didascalia della morte viene pronunciata da un personaggio');

ok(/Norma.*ciliegie.*Donna.*James/i.test(Data.clues.diario.document.pages[0].text), 'il diario conserva un momento ordinario di Laura');
ok(!Data.endText.some((line) => /porte.*non si richiudono|so cosa vede|Twin Peaks tornerà/i.test(line)), 'endText non chiude con tesi astratte');
ok(/7:12/.test(Data.endText[0]) && /sole.*alberi/i.test(Data.endText[0]) && !Data.endText.some((line) => /2:30|2:37/i.test(line)),
  'endText avviene dopo l’alba e non contraddice l’orario del finale');
ok(!Data.endText.some((line) => /nastro|registratore|registrazione/i.test(line)),
  'endText resta neutrale rispetto alla scelta di registrare il verbale');
ok(Data.endText.some((line) => /Twin Peaks Taxi.*verbale firmato/i.test(line)) &&
  Data.endText.some((line) => /7:40.*Missoula.*Maddy/i.test(line)),
  'endText ripaga oggetti e orari preparati prima del finale');
ok(!/cane era sotto il portico|volantino delle scomparse/i.test(finaleSource) &&
  /Centrale dello sceriffo/.test(finaleSource) && /Twin Peaks Taxi.*verbale firmato/.test(finaleSource),
  'l’epilogo usa immagini preparate, non cane e volantino introdotti al payoff');
ok(/curva dei binari/i.test(corpus(D.landmark_tracks_vagone)), 'la provenienza del vagone conserva la parola binari');
ok(!/entra e esce/i.test(corpus(D.lucy) + ' ' + M6Source) && /entra ed esce/i.test(corpus(D.lucy) + ' ' + M6Source),
  'la concordanza formale «entra ed esce» è coerente nel classico e in M6');
ok(D.leland_dopo.pages.some((page) => !page.name && /Leland ride/i.test(page.text)) &&
  D.leland_dopo.pages.every((page) => !page.name || !/\*?ride\*?/i.test(page.text)),
  'la risata di Leland è azione, non didascalia pronunciata');
ok(D.gigante2_dlg.pages.some((page) => !page.name && /Gigante svanisce/i.test(page.text)) &&
  D.gigante2_dlg.pages.every((page) => !page.name || !/svanisce/i.test(page.text)),
  'la scomparsa del Gigante è azione, non battuta');
ok(Data.clues.anello.desc.includes('Perché') && /Una sola occasione/.test(corpus(D.gerard_a2)), 'grammatica corretta nei due errori noti');

function checkCond(cond, state) {
  if (/^clues\d+$/.test(cond)) return state.clues.length >= Number(cond.slice(5));
  if (cond.startsWith('flag:')) return !!state.flags[cond.slice(5)];
  return false;
}
ok(Data.objectiveFor({ clues: [], flags: {} }, checkCond) === 'Parla con lo sceriffo Truman (a ovest).', 'obiettivo iniziale: Truman');
ok(Data.objectiveFor({ clues: ['diario'], flags: {} }, checkCond) === 'Casa Palmer: esamina la camera di Laura.', 'dopo Truman l’obiettivo indica casa Palmer');
ok(Data.objectiveFor({ clues: ['diario', 'cuore', 'lettera_r'], flags: {} }, checkCond) === 'Segui il sentiero nel bosco.', 'a tre indizi l’obiettivo indica il bosco');

console.log(`NARRATIVE-REPAIR-CONTRACT-PASS ${checks}/${checks}`);
