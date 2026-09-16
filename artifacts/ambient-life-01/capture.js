#!/usr/bin/env node
'use strict';

/* artifacts/ambient-life-01/capture.js — six frozen frames for the ambient-life
 * details. Serves the repo over http and captures test/retro-scene.html twice
 * per scene: ?freezeMs=0 and ?freezeMs=1000. The frozen clock is what makes the
 * "function of time t" details reproducible across runs.
 *
 *   node artifacts/ambient-life-01/capture.js
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

const REPO = path.resolve(__dirname, '..', '..');
const CAPTURE = path.join(REPO, 'test', 'capture-chrome.js');
const OUT = path.join(REPO, 'artifacts', 'ambient-life-01');
const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAGE = 'test/retro-scene.html';
const FREEZE = [0, 1000, 1500];
/* freezeMs=0 is captured as asked, but js/engine.js:1717 drops every tick while
 * `now - lastTick < 8` and lastTick starts at 0, so a clock pinned to 0 never
 * paints: the t0 shots are the flat page background. t1000/t1500 are the
 * renderable frozen pair (>8ms apart, detail differs) and are the real evidence. */
const SCENES = [
  { id: 'diner', query: 'map=diner&x=6&y=8&dir=up&flags=sogno_fatto' },
  { id: 'roadhouse', query: 'map=roadhouse&x=7&y=8&dir=up' },
  { id: 'redroom', query: 'map=redroom&x=8&y=10&dir=up' }
];

function serve(root) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const port = 18000 + Math.floor(Math.random() * 40000);
    const child = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', root], { stdio: 'ignore' });
    child.unref();
    const deadline = Date.now() + 6000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) break;
      const probe = spawnSync('curl', ['-fsS', '-o', '/dev/null', 'http://127.0.0.1:' + port + '/' + PAGE], { encoding: 'utf8' });
      if (probe.status === 0) return { port: port, child: child };
    }
    try { child.kill(); } catch (e) { /* already gone */ }
  }
  throw new Error('no server came up for ' + root);
}

const server = serve(REPO);
fs.mkdirSync(OUT, { recursive: true });
try {
  for (const scene of SCENES) {
    for (const ms of FREEZE) {
      const out = path.join(OUT, scene.id + '-t' + ms + '.png');
      const url = 'http://127.0.0.1:' + server.port + '/' + PAGE + '?' + scene.query + '&freezeMs=' + ms;
      const r = spawnSync(process.execPath, [CAPTURE,
        '--chrome=' + CHROME, '--url=' + url, '--output=' + out,
        '--width=960', '--height=640', '--ready-prefix=TP-RETRO-READY',
        '--timeout-ms=25000', '--gpu=swiftshader'],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      if (r.status !== 0) throw new Error('capture failed for ' + out + '\n' + (r.stdout || '') + (r.stderr || ''));
      console.log('wrote ' + path.relative(REPO, out) + ' (' + fs.statSync(out).size + ' bytes)');
    }
  }
} finally {
  try { server.child.kill(); } catch (e) { /* already gone */ }
}
