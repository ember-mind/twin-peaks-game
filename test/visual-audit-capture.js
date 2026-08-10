#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const MATRIX_FILE = path.join(__dirname, 'visual-audit-matrix.json');

function usage() {
  return `
Uso:
  node test/visual-audit-capture.js --output=DIR [opzioni]

Opzioni:
  --profile=gameplay|temporal|presentation|all   default: gameplay
  --seed=N                                      default dal matrix
  --season=spring|summer|autumn|winter
  --wet=true|false
  --blind-label=A                               etichetta anonima nel manifest
  --chrome=/path
  --magick=/path                                default: MAGICK_BIN o magick
  --no-sheets                                   non genera i contact sheet

Ogni PNG è validato a 960x640 e pubblicato atomicamente. Un errore interrompe
la matrice, elimina il file parziale e produce un manifest con status=failed.
`.trim();
}

function parse(argv) {
  const options = {
    output: '',
    profile: 'gameplay',
    seed: null,
    season: null,
    wet: null,
    blindLabel: null,
    chrome: null,
    magick: process.env.MAGICK_BIN || 'magick',
    sheets: true
  };
  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    } else if (arg.startsWith('--output=')) options.output = path.resolve(arg.slice(9));
    else if (arg.startsWith('--profile=')) options.profile = arg.slice(10);
    else if (arg.startsWith('--seed=')) options.seed = Number(arg.slice(7));
    else if (arg.startsWith('--season=')) options.season = arg.slice(9);
    else if (arg.startsWith('--wet=')) {
      const value = arg.slice(6);
      if (!['true', 'false'].includes(value)) throw new Error(`wet non valido: ${value}`);
      options.wet = value === 'true';
    }
    else if (arg.startsWith('--blind-label=')) options.blindLabel = arg.slice(14);
    else if (arg.startsWith('--chrome=')) options.chrome = arg.slice(9);
    else if (arg.startsWith('--magick=')) options.magick = arg.slice(9);
    else if (arg === '--no-sheets') options.sheets = false;
    else throw new Error(`opzione sconosciuta: ${arg}`);
  }
  if (!options.output) throw new Error('--output è obbligatorio');
  if (!['gameplay', 'temporal', 'presentation', 'all'].includes(options.profile)) {
    throw new Error(`profilo non valido: ${options.profile}`);
  }
  if (options.season && !['spring', 'summer', 'autumn', 'winter'].includes(options.season)) {
    throw new Error(`stagione non valida: ${options.season}`);
  }
  if (options.seed !== null &&
      (!Number.isInteger(options.seed) || options.seed < 0 || options.seed > 0xffffffff)) {
    throw new Error(`seed non valido: ${options.seed}`);
  }
  return options;
}

function contentType(file) {
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.glb': 'model/gltf-binary',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  }[path.extname(file).toLowerCase()] || 'application/octet-stream';
}

async function startServer() {
  const server = http.createServer((request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      const file = path.resolve(ROOT, relative);
      if (file !== ROOT && !file.startsWith(`${ROOT}${path.sep}`)) {
        response.writeHead(403).end('Forbidden');
        return;
      }
      const stat = fs.statSync(file);
      if (!stat.isFile()) throw new Error('not a file');
      response.writeHead(200, {
        'Content-Type': contentType(file),
        'Content-Length': stat.size,
        'Cache-Control': 'no-store'
      });
      fs.createReadStream(file).pipe(response);
    } catch (_) {
      response.writeHead(404).end('Not found');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return server;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '', stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${command} exit ${code}\n${stdout}${stderr}`));
    });
  });
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function pngSize(file) {
  const png = fs.readFileSync(file);
  if (png.length < 24 || png.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
    throw new Error(`sheet non PNG: ${file}`);
  }
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
}

function gitHead() {
  try {
    return require('node:child_process')
      .execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch (_) {
    return null;
  }
}

function commandFor(entry, common, baseUrl, output, options) {
  const args = [
    entry.map || 'town',
    String(entry.x === undefined ? 30 : entry.x),
    String(entry.y === undefined ? 31 : entry.y),
    entry.dir || 'up',
    output,
    `--base-url=${baseUrl}`
  ];
  if (entry.page) {
    args.push(`--page=${entry.page}`);
    args.push(`--stop=${entry.stop}`);
    if (entry.stopParam) args.push(`--stop-param=${entry.stopParam}`);
    args.push(`--ready-prefix=${entry.readyPrefix}`);
    args.push(`--timeout-ms=${entry.timeoutMs || 20000}`);
  } else {
    args.push('--retro');
    args.push(`--seed=${common.seed}`);
    args.push(`--season=${common.season}`);
    args.push(`--wet=${common.wet}`);
    if (common.suppressOnEnter) args.push('--suppress-on-enter');
    if (entry.flags) args.push(`--flags=${entry.flags}`);
    if (entry.frames) {
      args.push('--strip');
      args.push(`--frames=${entry.frames}`);
      args.push(`--step-ms=${entry.stepMs || 100}`);
      args.push(`--motion=${entry.motion || 'idle'}`);
      args.push('--timeout-ms=30000');
    }
  }
  if (options.chrome) args.push(`--chrome=${options.chrome}`);
  return args;
}

async function main() {
  const options = parse(process.argv.slice(2));
  const matrix = JSON.parse(fs.readFileSync(MATRIX_FILE, 'utf8'));
  const common = {
    seed: options.seed === null ? matrix.defaults.seed : options.seed,
    season: options.season || matrix.defaults.season,
    wet: options.wet === null ? matrix.defaults.wet : options.wet,
    suppressOnEnter: matrix.defaults.suppressOnEnter
  };
  const profiles = options.profile === 'all'
    ? ['gameplay', 'temporal', 'presentation']
    : [options.profile];
  fs.mkdirSync(options.output, { recursive: true });
  const manifestFile = path.join(options.output, 'manifest.json');
  const manifest = {
    schema: 'twin-peaks.visual-audit-capture.v1',
    status: 'running',
    matrix: path.relative(ROOT, MATRIX_FILE),
    sourceCommit: gitHead(),
    capturedAt: new Date().toISOString(),
    blindLabel: options.blindLabel,
    viewport: matrix.viewport,
    state: common,
    matrixNotes: matrix.notes,
    profiles,
    captures: [],
    sheets: []
  };
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);

  const server = await startServer();
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const profile of profiles) {
      const directory = path.join(options.output, profile);
      fs.mkdirSync(directory, { recursive: true });
      const profileOutputs = [];
      for (const entry of matrix[profile]) {
        const output = path.join(directory, `${entry.id}.png`);
        const args = commandFor(entry, common, baseUrl, output, options);
        const started = Date.now();
        process.stdout.write(`[${profile}] ${entry.id} ... `);
        await run(path.join(ROOT, 'test', 'shot.sh'), args);
        const record = {
          id: entry.id,
          profile,
          file: path.relative(options.output, output),
          sha256: sha256(output),
          bytes: fs.statSync(output).size,
          durationMs: Date.now() - started,
          seed: entry.page ? null : common.seed,
          state: entry.page ? {
            page: entry.page,
            stopParam: entry.stopParam || 'shot',
            stop: entry.stop,
            readyPrefix: entry.readyPrefix
          } : {
            map: entry.map,
            x: entry.x,
            y: entry.y,
            dir: entry.dir,
            season: common.season,
            wet: common.wet,
            flags: entry.flags || null,
            frames: entry.frames || 1,
            stepMs: entry.stepMs || null,
            motion: entry.motion || 'idle'
          },
          reproduceCommand: ['test/shot.sh'].concat(args
            .filter((arg) => !arg.startsWith('--base-url='))
            .map((arg, index) => index === 4 ? path.relative(ROOT, arg) : arg)),
          runnerCommand: ['test/shot.sh'].concat(args.map((arg, index) => {
            if (arg.startsWith('--base-url=')) return '--base-url=<shared-audit-server>';
            return index === 4 ? path.relative(ROOT, arg) : arg;
          }))
        };
        manifest.captures.push(record);
        profileOutputs.push(output);
        fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
        console.log(`${record.durationMs} ms`);
      }
      if (options.sheets) {
        const sheet = path.join(options.output, `${profile}-sheet.png`);
        process.stdout.write(`[${profile}] contact sheet ... `);
        await run(options.magick, [
          'montage',
          ...profileOutputs,
          '-thumbnail', '480x320^',
          '-gravity', 'center',
          '-extent', '480x320',
          '-tile', '4x',
          '-geometry', '+4+4',
          '-background', '#101820',
          sheet
        ]);
        const sheetRecord = {
          profile,
          file: path.relative(options.output, sheet),
          sha256: sha256(sheet),
          bytes: fs.statSync(sheet).size,
          dimensions: pngSize(sheet),
          sourceCount: profileOutputs.length
        };
        manifest.sheets.push(sheetRecord);
        fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
        console.log(sheetRecord.dimensions.join('x'));
      }
    }
    manifest.status = 'complete';
    manifest.completedAt = new Date().toISOString();
  } catch (error) {
    manifest.status = 'failed';
    manifest.error = error.message;
    throw error;
  } finally {
    fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
    await new Promise((resolve) => server.close(resolve));
  }
  console.log(`ok - ${manifest.captures.length} catture: ${manifestFile}`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(2);
});
