#!/usr/bin/env node
'use strict';

// test/native-shot.js — cattura il frame NATIVO 256x192 di una scena retro.
// Nessun upscaling, nessuno screenshot del compositor: prende i pixel esatti
// del canvas esportati da test/retro-scene.html su <body data-native-png>.
//
// Uso: node test/native-shot.js --map=town --x=30 --y=31 --dir=up \
//        --out=artifacts/retro-gauntlet/r52-town-native.png [--dialogue=1]

const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const args = new Map();
for (const a of process.argv.slice(2)) {
  const m = /^--([a-zA-Z0-9-]+)=(.*)$/.exec(a);
  if (m) args.set(m[1], m[2]);
}
const map = args.get('map') || 'town';
const x = args.get('x') || '30';
const y = args.get('y') || '31';
const dir = args.get('dir') || 'up';
const dialogue = args.get('dialogue') || '';
const silhouette = args.get('silhouette') || '';
const narrative = args.get('narrative') || '';
const out = path.resolve(root, args.get('out') || '/tmp/native.png');
const chrome = process.env.CHROME_BIN ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const port = 18000 + (process.pid % 20000);
const server = spawn('python3',
  ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', root],
  { stdio: 'ignore' });
const stop = () => { try { server.kill(); } catch (_) {} };
process.on('exit', stop);

let up = false;
for (let i = 0; i < 100 && !up; i++) {
  up = spawnSync('curl', ['-fsS', `http://127.0.0.1:${port}/test/retro-scene.html`],
    { stdio: 'ignore' }).status === 0;
  if (!up) spawnSync('sleep', ['0.05']);
}
if (!up) { console.error('native-shot: server non raggiungibile'); process.exit(2); }

let url = `http://127.0.0.1:${port}/test/retro-scene.html?map=${map}&x=${x}&y=${y}&dir=${dir}`;
if (dialogue) url += `&dialogue=${dialogue}`;
if (silhouette) url += `&silhouette=${silhouette}`;
if (narrative) url += `&narrative=${narrative}`;
if (args.get('nstate')) url += `&nstate=${encodeURIComponent(args.get('nstate'))}`;

// Cattura + gate anti-frame-bianco. La pipeline headless ogni tanto consegna
// un canvas non ancora dipinto: il file esiste, il titolo e' pronto, e lo
// screenshot e' una tinta piatta. Un "ok" su un frame vuoto e' peggio di un
// errore, perche' entra fra le prove del round. Qui il frame viene decodificato
// e rifiutato se non ha almeno MIN_COLORS colori distinti.
/* Master palette approvata produce anche quattro valori visibili in crop
 * piccoli: e' palette Game Boy legittima, non tinta piatta. */
const MIN_COLORS = 4;

function distinctColors(file) {
  const buf = fs.readFileSync(file);
  if (buf.length < 1200) return 0;
  const { spawnSync: run } = require('node:child_process');
  const r = run(process.execPath, [path.join(root, 'tools', 'frame-gates', 'pixel-gates.js'), file,
    '--rect=0,0,255,191'], { encoding: 'utf8' });
  if (r.status !== 0) return 0;
  try { return JSON.parse(r.stdout).colors || 0; } catch (_) { return 0; }
}

fs.mkdirSync(path.dirname(out), { recursive: true });
const res = spawnSync(process.execPath, [
  path.join(root, 'test', 'capture-chrome.js'),
  `--chrome=${chrome}`, `--url=${url}`, `--output=${out}`,
  '--width=800', '--height=720', '--ready-prefix=TP-RETRO-READY',
  '--timeout-ms=25000', '--gpu=swiftshader', '--native-attr=data-native-png'
], { encoding: 'utf8' });
stop();
process.stdout.write(res.stdout || '');
if (res.status !== 0) { process.stderr.write(res.stderr || ''); process.exit(2); }
const colors = distinctColors(out);
if (!silhouette && colors < MIN_COLORS) {
  console.error(`native-shot: frame vuoto o piatto (${colors} colori distinti) — cattura rifiutata`);
  process.exit(3);
}
