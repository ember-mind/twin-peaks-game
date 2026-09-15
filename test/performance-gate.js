#!/usr/bin/env node
'use strict';

/*
 * Twin Peaks archived WebGL performance gate.
 *
 * Canonical invocation (representative desktop hardware):
 *   node test/performance-gate.js
 *
 * Useful diagnostics:
 *   node test/performance-gate.js --quick --report-only
 *   node test/performance-gate.js --gpu=swiftshader --allow-software --report-only
 *   node test/performance-gate.js --legacy
 *   node test/performance-gate.js --help
 *
 * Exit codes: 0 pass, 1 threshold failure, 2 infrastructure/configuration error.
 * Requires Node 22+ (global fetch + WebSocket) and a Chromium/Google Chrome binary.
 */

const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_REPORT = path.join(os.tmpdir(), 'twin-peaks-performance-gate.json');
const AUDIT_CALL_CEILINGS = Object.freeze({
  town: 788,
  woods: 644,
  sheriff: 1193
});
const THRESHOLDS = Object.freeze({
  desktopP95Ms: 16.7,
  coldTransitionMs: 100,
  gpuGeometryGrowth: 0,
  gpuTextureGrowth: 0,
  gpuProgramGrowth: 0,
  jsHeapGrowthBytes: 8 * 1024 * 1024
});
const ROUTE = Object.freeze([
  { id: 'town', x: 30, y: 31, dir: 'up' },
  { id: 'sheriff', x: 7, y: 7, dir: 'up' },
  { id: 'palmer', x: 8, y: 10, dir: 'up' },
  { id: 'hotel_gn', x: 8, y: 10, dir: 'up' },
  { id: 'room_315', x: 2, y: 6, dir: 'down' },
  { id: 'hospital', x: 7, y: 10, dir: 'up' },
  { id: 'diner', x: 7, y: 8, dir: 'up' },
  { id: 'woods', x: 14, y: 16, dir: 'up' },
  { id: 'redroom', x: 8, y: 10, dir: 'up' },
  { id: 'traincar', x: 12, y: 6, dir: 'up' },
  { id: 'oej', x: 8, y: 8, dir: 'up' },
  { id: 'roadhouse', x: 8, y: 8, dir: 'up' }
]);

function usage() {
  return `
Twin Peaks automated shipping performance gate

Usage:
  node test/performance-gate.js [options]

Options:
  --chrome=/path          Chrome/Chromium binary (or set CHROME_BIN)
  --gpu=auto|metal|swiftshader
                          ANGLE backend; default: metal on macOS, auto elsewhere
  --width=N               CSS viewport width (default: 1280)
  --height=N              CSS viewport height (default: 720)
  --dpr=N                 Emulated device pixel ratio (default: 2)
  --samples=N             Timed steady frames per map (default: 60)
  --warmup=N              Untimed warm-up frames per map (default: 8)
  --memory-passes=N       Cached full-route memory passes (default: 3)
  --maps=a,b,c            Limit maps for a diagnostic run
  --output=/path.json     JSON report (default: ${DEFAULT_REPORT})
  --quick                 15 samples, 2 warmups, 2 memory passes
  --allow-software        Do not fail solely because Chrome uses software WebGL
  --report-only           Always exit 0 after a completed measurement
  --legacy                Measure archived Three.js path (not production)
  --help                  Show this help

Shipping thresholds:
  steady p95              <= ${THRESHOLDS.desktopP95Ms} ms on every map
  cold transition/build   <  ${THRESHOLDS.coldTransitionMs} ms on every map
  cached route growth     0 geometries, 0 textures, 0 shader programs
  post-GC JS heap growth  <= ${THRESHOLDS.jsHeapGrowthBytes / 1024 / 1024} MiB
  audited render calls    town <= 788, woods <= 644, sheriff <= 1193

The JSON report records all map timings, calls, triangles, Three.js GPU-resource
counts, adapter identity, drawing-buffer size, adaptive-quality state and heap.
Run the shipping gate on representative hardware; SwiftShader is diagnostic.
`.trim();
}

function parseNumber(value, name, min) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min) throw new Error(`Invalid ${name}: ${value}`);
  return n;
}

function parseArgs(argv) {
  const options = {
    chrome: process.env.CHROME_BIN || '',
    gpu: process.platform === 'darwin' ? 'metal' : 'auto',
    width: 1280,
    height: 720,
    dpr: 2,
    samples: 60,
    warmup: 8,
    memoryPasses: 3,
    maps: null,
    output: DEFAULT_REPORT,
    allowSoftware: false,
    reportOnly: false,
    legacy: false,
    quick: false
  };
  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    } else if (arg === '--quick') options.quick = true;
    else if (arg === '--allow-software') options.allowSoftware = true;
    else if (arg === '--report-only') options.reportOnly = true;
    else if (arg === '--legacy') options.legacy = true;
    else if (arg.startsWith('--chrome=')) options.chrome = arg.slice(9);
    else if (arg.startsWith('--gpu=')) options.gpu = arg.slice(6);
    else if (arg.startsWith('--width=')) options.width = parseNumber(arg.slice(8), 'width', 320);
    else if (arg.startsWith('--height=')) options.height = parseNumber(arg.slice(9), 'height', 240);
    else if (arg.startsWith('--dpr=')) options.dpr = parseNumber(arg.slice(6), 'dpr', 1);
    else if (arg.startsWith('--samples=')) options.samples = parseNumber(arg.slice(10), 'samples', 5);
    else if (arg.startsWith('--warmup=')) options.warmup = parseNumber(arg.slice(9), 'warmup', 0);
    else if (arg.startsWith('--memory-passes=')) {
      options.memoryPasses = parseNumber(arg.slice(16), 'memory-passes', 2);
    } else if (arg.startsWith('--maps=')) {
      options.maps = arg.slice(7).split(',').map((x) => x.trim()).filter(Boolean);
    } else if (arg.startsWith('--output=')) options.output = path.resolve(arg.slice(9));
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (!['auto', 'metal', 'swiftshader'].includes(options.gpu)) {
    throw new Error(`Invalid --gpu value: ${options.gpu}`);
  }
  if (options.quick) {
    options.samples = Math.min(options.samples, 15);
    options.warmup = Math.min(options.warmup, 2);
    options.memoryPasses = Math.min(options.memoryPasses, 2);
  }
  const knownMaps = new Set(ROUTE.map((entry) => entry.id));
  if (options.maps) {
    for (const id of options.maps) {
      if (!knownMaps.has(id)) throw new Error(`Unknown map in --maps: ${id}`);
    }
  }
  return options;
}

function findChrome(explicit) {
  const candidates = [
    explicit,
    process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : '',
    process.platform === 'darwin'
      ? '/Applications/Chromium.app/Contents/MacOS/Chromium'
      : '',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error('Chrome/Chromium not found; pass --chrome=/path or set CHROME_BIN');
}

function contentType(file) {
  const ext = path.extname(file).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.glb': 'model/gltf-binary',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  }[ext] || 'application/octet-stream';
}

function harnessHtml() {
  const scripts = [
    'js/vendor/three.min.js',
    'js/vendor/loaders/GLTFLoader.js',
    'js/vendor/postprocessing/Pass.js',
    'js/vendor/postprocessing/CopyShader.js',
    'js/vendor/postprocessing/GammaCorrectionShader.js',
    'js/vendor/postprocessing/ShaderPass.js',
    'js/vendor/postprocessing/EffectComposer.js',
    'js/vendor/postprocessing/SimplexNoise.js',
    'js/vendor/postprocessing/SSAOShader.js',
    'js/vendor/postprocessing/SSAOPass.js'
  ].map((src) => `<script src="/${src}"></script>`).join('\n');
  const gameScripts = [
    'js/tiles.js',
    'js/chars.js',
    'js/houses.js',
    'js/maps.js',
    'js/data.js',
    'js/retro-font.js',
    'js/presentation3d.js',
    'js/engine.js',
    'js/render3d.js',
    'js/scene-objects.gen.js', 'js/glue.js'
  ].map((src) => `<script src="/${src}"></script>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Twin Peaks performance gate</title>
<style>
html,body,#stage{margin:0;width:100%;height:100%;overflow:hidden;background:#000}
#stage{position:fixed;inset:0}
canvas{position:absolute;inset:0;width:100%;height:100%}
#game{z-index:2}
#gl{z-index:1}
#presentation{z-index:0}
</style>
<script>
// The gate owns every submitted frame. Production timers would make a frame
// sample race a second render and invalidate both GPU timings and call counts.
window.requestAnimationFrame=function(){return 1};
window.cancelAnimationFrame=function(){};
window.setInterval=function(){return 1};
</script>
</head>
<body>
<div id="stage">
  <canvas id="presentation" width="1280" height="720"></canvas>
  <canvas id="gl" width="1280" height="720"></canvas>
  <canvas id="game" width="480" height="320"></canvas>
  <div id="cinematic-kicker"></div>
  <div id="cinematic-title"></div>
  <div id="cinematic-body"></div>
  <div id="cinematic-action"></div>
  <div id="cinematic-meta"></div>
</div>
${scripts}
<script>
window.__tpRenderers=[];
(function(){
  var NativeRenderer=THREE.WebGLRenderer;
  class GateRenderer extends NativeRenderer {
    constructor(options){
      super(options);
      window.__tpRenderers.push(this);
    }
  }
  THREE.WebGLRenderer=GateRenderer;
})();
</script>
${gameScripts}
<script>
// Mirror main.js initialization without Engine.start(): the gate owns all
// submitted frames and must not inherit its delayed production prewarm.
(function(){
  var cv=document.getElementById('game');
  var gl=document.getElementById('gl');
  var presentation=document.getElementById('presentation');
  if(GAME.Presentation3D&&GAME.Presentation3D.init){
    GAME.Presentation3D.init(presentation);
  }
  var w=window.innerWidth,h=window.innerHeight;
  gl.width=w;gl.height=h;
  cv.height=320;
  cv.width=Math.max(480,Math.round(320*w/h));
  GAME.Engine.init(cv,gl);
  GAME.Engine.onResize();
})();
</script>
</body>
</html>`;
}

async function startServer() {
  const html = harnessHtml();
  const server = http.createServer((request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      if (url.pathname === '/__tp_performance_gate__.html') {
        response.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store'
        });
        response.end(html);
        return;
      }
      const decoded = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      const file = path.resolve(ROOT, decoded);
      if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
      }
      const stat = fs.statSync(file);
      if (!stat.isFile()) throw new Error('Not a file');
      response.writeHead(200, {
        'Content-Type': contentType(file),
        'Content-Length': stat.size,
        'Cache-Control': 'no-store'
      });
      fs.createReadStream(file).pipe(response);
    } catch (error) {
      response.writeHead(404);
      response.end('Not found');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return { server, port: server.address().port };
}

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function waitForJson(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError || 'no response'}`);
}

class Cdp {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.id = 0;
    this.pending = new Map();
  }

  async connect() {
    if (typeof WebSocket === 'undefined') {
      throw new Error('Node 22+ is required: global WebSocket is unavailable');
    }
    this.ws = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !this.pending.has(message.id)) return;
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(`${message.error.message} (${message.error.code})`));
      else resolve(message.result || {});
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression, awaitPromise = false) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise,
      returnByValue: true
    });
    if (result.exceptionDetails) {
      const detail = result.exceptionDetails.exception &&
        result.exceptionDetails.exception.description;
      throw new Error(detail || result.exceptionDetails.text || 'Page evaluation failed');
    }
    return result.result ? result.result.value : undefined;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function waitForPageReady(cdp, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    try {
      last = await cdp.evaluate(`(() => {
        if (!window.GAME || !GAME.Engine || !GAME.Engine.state ||
            !GAME.Render3D || !GAME.Render3D.stats) return 'runtime';
        var stats=GAME.Render3D.stats();
        var assetStates=[
          ['props',stats.authoredPropAsset,stats.authoredPropError],
          ['welcome-biome',stats.authoredWelcomeBiomeAsset,stats.authoredWelcomeBiomeError],
          ['vegetation',stats.authoredVegetationAsset,stats.authoredVegetationError],
          ['character',stats.authoredCharacterAsset,stats.authoredCharacterError],
          ['architecture',stats.authoredArchitectureAsset,stats.authoredArchitectureError]
        ];
        for(var i=0;i<assetStates.length;i++){
          var name=assetStates[i][0],state=assetStates[i][1],error=assetStates[i][2];
          if(state==='failed') return 'failed:'+name+':'+(error||'unknown');
          if(state==='idle'||state==='loading') return state+':'+name;
        }
        var renderers=window.__tpRenderers||[];
        var gameplay=renderers.filter(function(r){
          return r.domElement&&r.domElement.id==='gl';
        })[0];
        return gameplay ? 'ready' : 'renderer';
      })()`);
      if (last === 'ready') return;
    } catch (error) {
      last = error.message;
    }
    if (typeof last === 'string' && last.startsWith('failed:')) {
      throw new Error(`Authored asset did not become benchmark-ready: ${last.slice(7)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Game did not become benchmark-ready: ${last}`);
}

function percentile(values, p) {
  if (!values.length) return 0;
  const ordered = values.slice().sort((a, b) => a - b);
  return ordered[Math.min(ordered.length - 1, Math.ceil(ordered.length * p) - 1)];
}

function mean(values) {
  return values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : 0;
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function benchmarkExpression(spec, options) {
  return `(() => {
    var spec=${JSON.stringify(spec)};
    var options=${JSON.stringify({
      samples: options.samples,
      warmup: options.warmup,
      width: options.width,
      height: options.height
    })};
    var E=GAME.Engine;
    var R=GAME.Render3D;
    var renderers=window.__tpRenderers||[];
    var renderer=renderers.filter(function(r){
      return r.domElement&&r.domElement.id==='gl';
    })[0];
    if(!renderer) throw new Error('Gameplay WebGLRenderer not captured');
    var gl=renderer.getContext();
    function sync(){ if(gl&&gl.finish) gl.finish(); }
    function resources(){
      var totals={geometries:0,textures:0,programs:0};
      var byRenderer=renderers.map(function(r){
        var memory=r.info&&r.info.memory||{};
        var row={
          canvas:r.domElement&&r.domElement.id||'unknown',
          geometries:memory.geometries||0,
          textures:memory.textures||0,
          programs:r.info&&r.info.programs?r.info.programs.length:0
        };
        totals.geometries+=row.geometries;
        totals.textures+=row.textures;
        totals.programs+=row.programs;
        return row;
      });
      return {totals:totals,byRenderer:byRenderer};
    }
    function submit(now){
      if(GAME.Presentation3D&&GAME.Presentation3D.render){
        GAME.Presentation3D.render('play',now,0);
      }
      R.render(E.state,16.667,now);
      sync();
      return R.stats();
    }
    E.state.mode='play';
    E.state.dialogue=null;
    E.state.menu=false;
    // Reset balanced/adaptive state outside the timed transition.
    R.resize(options.width,options.height);
    var before=resources();
    var transitionStart=performance.now();
    var prewarmStart=performance.now();
    var prewarmReportedMs=R.prewarm(spec.id,E.state.clues||[]);
    var prewarmMs=performance.now()-prewarmStart;
    var loadStart=performance.now();
    E.loadMap(spec.id,spec.x,spec.y,spec.dir);
    var loadMapMs=performance.now()-loadStart;
    var firstSubmitStart=performance.now();
    var coldStats=submit(1000);
    var firstSubmitMs=performance.now()-firstSubmitStart;
    var coldMs=performance.now()-transitionStart;
    for(var w=0;w<options.warmup;w++) submit(1100+w*16.667);
    var times=[];
    var calls=[];
    var triangles=[];
    var lastStats=coldStats;
    for(var i=0;i<options.samples;i++){
      var start=performance.now();
      lastStats=submit(2000+i*16.667);
      times.push(performance.now()-start);
      calls.push(lastStats.calls||0);
      triangles.push(lastStats.triangles||0);
    }
    return {
      id:spec.id,
      coldMs:coldMs,
      coldPhases:{
        prewarmMs:prewarmMs,
        prewarmReportedMs:prewarmReportedMs,
        loadMapMs:loadMapMs,
        firstSubmitMs:firstSubmitMs
      },
      frameTimes:times,
      calls:calls,
      triangles:triangles,
      coldStats:coldStats,
      finalStats:lastStats,
      resourcesBefore:before,
      resourcesAfter:resources()
    };
  })()`;
}

function revisitExpression(route) {
  return `(() => {
    var route=${JSON.stringify(route)};
    var E=GAME.Engine;
    var R=GAME.Render3D;
    var renderers=window.__tpRenderers||[];
    var renderer=renderers.filter(function(r){
      return r.domElement&&r.domElement.id==='gl';
    })[0];
    var gl=renderer.getContext();
    for(var i=0;i<route.length;i++){
      var spec=route[i];
      E.loadMap(spec.id,spec.x,spec.y,spec.dir);
      R.render(E.state,16.667,9000+i*16.667);
      if(gl&&gl.finish) gl.finish();
    }
    var totals={geometries:0,textures:0,programs:0};
    var byRenderer=renderers.map(function(r){
      var memory=r.info&&r.info.memory||{};
      var row={
        canvas:r.domElement&&r.domElement.id||'unknown',
        geometries:memory.geometries||0,
        textures:memory.textures||0,
        programs:r.info&&r.info.programs?r.info.programs.length:0
      };
      totals.geometries+=row.geometries;
      totals.textures+=row.textures;
      totals.programs+=row.programs;
      return row;
    });
    return {
      resources:{totals:totals,byRenderer:byRenderer},
      renderStats:R.stats()
    };
  })()`;
}

async function heapUsed(cdp) {
  try {
    await cdp.send('HeapProfiler.collectGarbage');
  } catch (_) {
    // Some Chromium builds do not expose HeapProfiler in headless mode.
  }
  const metrics = await cdp.send('Performance.getMetrics');
  const value = (metrics.metrics || []).find((entry) => entry.name === 'JSHeapUsedSize');
  return value ? value.value : 0;
}

async function environmentInfo(cdp) {
  return cdp.evaluate(`(() => {
    var renderers=window.__tpRenderers||[];
    var renderer=renderers.filter(function(r){
      return r.domElement&&r.domElement.id==='gl';
    })[0];
    var gl=renderer.getContext();
    var ext=gl.getExtension('WEBGL_debug_renderer_info');
    var adapter=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
    var vendor=ext?gl.getParameter(ext.UNMASKED_VENDOR_WEBGL):gl.getParameter(gl.VENDOR);
    return {
      userAgent:navigator.userAgent,
      platform:navigator.platform,
      hardwareConcurrency:navigator.hardwareConcurrency||0,
      devicePixelRatio:devicePixelRatio,
      visibilityState:document.visibilityState,
      adapter:adapter,
      vendor:vendor,
      maxTextureSize:gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxRenderbufferSize:gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      webglVersion:gl instanceof WebGL2RenderingContext?2:1,
      rendererCount:renderers.length
    };
  })()`);
}

async function primePresentationRenderer(cdp) {
  return cdp.evaluate(`(() => {
    var presentation=(window.__tpRenderers||[]).filter(function(r){
      return r.domElement&&r.domElement.id==='presentation';
    })[0];
    if(GAME.Presentation3D&&GAME.Presentation3D.render){
      GAME.Presentation3D.render('title',0,0);
      if(presentation){
        var gl=presentation.getContext();
        if(gl&&gl.finish) gl.finish();
      }
    }
    return !!presentation;
  })()`);
}

function summarizeMap(raw) {
  return {
    id: raw.id,
    coldTransitionMs: round(raw.coldMs),
    coldPhases: {
      prewarmMs: round(raw.coldPhases.prewarmMs),
      prewarmReportedMs: round(raw.coldPhases.prewarmReportedMs),
      loadMapMs: round(raw.coldPhases.loadMapMs),
      firstSubmitMs: round(raw.coldPhases.firstSubmitMs)
    },
    steady: {
      samples: raw.frameTimes.length,
      meanMs: round(mean(raw.frameTimes)),
      p50Ms: round(percentile(raw.frameTimes, 0.5)),
      p95Ms: round(percentile(raw.frameTimes, 0.95)),
      maxMs: round(Math.max(...raw.frameTimes))
    },
    render: {
      callsMean: round(mean(raw.calls), 1),
      callsP95: round(percentile(raw.calls, 0.95), 1),
      callsMax: Math.max(...raw.calls),
      trianglesMean: round(mean(raw.triangles), 1),
      trianglesMax: Math.max(...raw.triangles)
    },
    quality: {
      mode: raw.finalStats.qualityMode,
      adaptiveDegraded: !!raw.finalStats.adaptiveDegraded,
      pixelRatio: raw.finalStats.pixelRatio,
      ssao: !!raw.finalStats.ssao,
      drawingBuffer: [
        raw.finalStats.drawingBufferWidth,
        raw.finalStats.drawingBufferHeight
      ]
    },
    gpuResources: raw.resourcesAfter
  };
}

function resourceDelta(first, last) {
  return {
    geometries: last.geometries - first.geometries,
    textures: last.textures - first.textures,
    programs: last.programs - first.programs
  };
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    console.error('\n' + usage());
    process.exitCode = 2;
    return;
  }

  const productionIndex = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const productionUsesLegacy3D = /three\.min\.js|render3d\.js/.test(productionIndex);
  if (!productionUsesLegacy3D && !options.legacy) {
    console.log('PERFORMANCE-GATE-PASS production runtime is native 2D; archived WebGL path excluded');
    console.log('Run with --legacy to benchmark archived Three.js renderer.');
    return;
  }

  let chrome;
  try {
    chrome = findChrome(options.chrome);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return;
  }

  const selectedRoute = options.maps
    ? ROUTE.filter((entry) => options.maps.includes(entry.id))
    : ROUTE.slice();
  const tempProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-performance-gate-'));
  let server;
  let browser;
  let cdp;
  let chromeLog = '';

  try {
    const hosted = await startServer();
    server = hosted.server;
    const debugPort = await freePort();
    const args = [
      '--headless=new',
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${tempProfile}`,
      `--window-size=${options.width},${options.height}`,
      '--enable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-sync',
      '--metrics-recording-only',
      '--mute-audio',
      '--hide-scrollbars',
      'about:blank'
    ];
    if (options.gpu === 'metal') args.splice(2, 0, '--use-angle=metal');
    if (options.gpu === 'swiftshader') {
      args.splice(2, 0, '--enable-unsafe-swiftshader', '--use-angle=swiftshader');
    }
    browser = spawn(chrome, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    browser.stderr.on('data', (chunk) => {
      chromeLog = (chromeLog + chunk.toString()).slice(-20000);
    });
    browser.once('error', (error) => {
      chromeLog += `\nChrome spawn error: ${error.message}`;
    });

    const targets = await waitForJson(`http://127.0.0.1:${debugPort}/json/list`, 15000);
    const page = targets.find((target) => target.type === 'page');
    if (!page) throw new Error('Chrome exposed no page target');
    cdp = new Cdp(page.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Performance.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: options.width,
      height: options.height,
      deviceScaleFactor: options.dpr,
      mobile: false
    });
    await cdp.send('Page.navigate', {
      url: `http://127.0.0.1:${hosted.port}/__tp_performance_gate__.html?quality=balanced`
    });
    await waitForPageReady(cdp, 20000);

    // The shipped route starts on the title screen. Upload its separate
    // renderer once so total GPU-resource counts include the real resident set,
    // while gameplay timings remain isolated to the gameplay renderer.
    await primePresentationRenderer(cdp);
    const environment = await environmentInfo(cdp);
    console.log(`Adapter: ${environment.adapter}`);
    console.log(`Viewport: ${options.width}x${options.height} CSS @ DPR ${options.dpr}`);
    console.log(`Maps: ${selectedRoute.map((entry) => entry.id).join(', ')}`);

    const perMap = [];
    for (const spec of selectedRoute) {
      process.stdout.write(`Benchmarking ${spec.id} ... `);
      const raw = await cdp.evaluate(benchmarkExpression(spec, options));
      const summary = summarizeMap(raw);
      perMap.push(summary);
      console.log(
        `cold ${summary.coldTransitionMs.toFixed(1)} ms, ` +
        `phases ${summary.coldPhases.prewarmMs.toFixed(1)} + ` +
        `${summary.coldPhases.loadMapMs.toFixed(1)} + ` +
        `${summary.coldPhases.firstSubmitMs.toFixed(1)} ms, ` +
        `p95 ${summary.steady.p95Ms.toFixed(1)} ms, ` +
        `calls ${summary.render.callsMax}`
      );
    }

    const memorySnapshots = [];
    for (let pass = 0; pass < options.memoryPasses; pass++) {
      process.stdout.write(`Memory route ${pass + 1}/${options.memoryPasses} ... `);
      const snapshot = await cdp.evaluate(revisitExpression(selectedRoute));
      snapshot.jsHeapUsedBytes = await heapUsed(cdp);
      memorySnapshots.push(snapshot);
      const total = snapshot.resources.totals;
      console.log(
        `${total.geometries} geometries, ${total.textures} textures, ` +
        `${total.programs} programs, ${(snapshot.jsHeapUsedBytes / 1048576).toFixed(1)} MiB heap`
      );
    }

    const issues = [];
    const software = /swiftshader|llvmpipe|software/i.test(
      `${environment.adapter} ${environment.vendor}`
    );
    if (software && !options.allowSoftware) {
      issues.push(
        `Environment uses software WebGL (${environment.adapter}); ` +
        'shipping certification requires representative desktop GPU hardware'
      );
    }
    for (const map of perMap) {
      if (map.coldTransitionMs >= THRESHOLDS.coldTransitionMs) {
        issues.push(
          `${map.id}: cold transition ${map.coldTransitionMs} ms ` +
          `>= ${THRESHOLDS.coldTransitionMs} ms`
        );
      }
      if (map.steady.p95Ms > THRESHOLDS.desktopP95Ms) {
        issues.push(
          `${map.id}: steady p95 ${map.steady.p95Ms} ms ` +
          `> ${THRESHOLDS.desktopP95Ms} ms`
        );
      }
      if (map.quality.adaptiveDegraded || map.quality.mode !== 'balanced') {
        issues.push(
          `${map.id}: balanced mode did not remain stable ` +
          `(mode=${map.quality.mode}, adaptive=${map.quality.adaptiveDegraded})`
        );
      }
      const callCeiling = AUDIT_CALL_CEILINGS[map.id];
      if (callCeiling !== undefined && map.render.callsMax > callCeiling) {
        issues.push(
          `${map.id}: render calls ${map.render.callsMax} > audited ceiling ${callCeiling}`
        );
      }
    }

    let memory = {
      passes: memorySnapshots,
      gpuResourceGrowth: { geometries: 0, textures: 0, programs: 0 },
      jsHeapGrowthBytes: 0
    };
    if (memorySnapshots.length >= 2) {
      const first = memorySnapshots[0].resources.totals;
      const last = memorySnapshots[memorySnapshots.length - 1].resources.totals;
      memory.gpuResourceGrowth = resourceDelta(first, last);
      memory.jsHeapGrowthBytes =
        memorySnapshots[memorySnapshots.length - 1].jsHeapUsedBytes -
        memorySnapshots[0].jsHeapUsedBytes;
      if (memory.gpuResourceGrowth.geometries > THRESHOLDS.gpuGeometryGrowth) {
        issues.push(`cached route leaked ${memory.gpuResourceGrowth.geometries} geometries`);
      }
      if (memory.gpuResourceGrowth.textures > THRESHOLDS.gpuTextureGrowth) {
        issues.push(`cached route leaked ${memory.gpuResourceGrowth.textures} textures`);
      }
      if (memory.gpuResourceGrowth.programs > THRESHOLDS.gpuProgramGrowth) {
        issues.push(`cached route added ${memory.gpuResourceGrowth.programs} shader programs`);
      }
      if (memory.jsHeapGrowthBytes > THRESHOLDS.jsHeapGrowthBytes) {
        issues.push(
          `post-GC JS heap grew ${(memory.jsHeapGrowthBytes / 1048576).toFixed(1)} MiB ` +
          `> ${THRESHOLDS.jsHeapGrowthBytes / 1048576} MiB`
        );
      }
    }

    const report = {
      schemaVersion: 2,
      generatedAt: new Date().toISOString(),
      result: issues.length ? 'fail' : 'pass',
      thresholds: {
        ...THRESHOLDS,
        auditedCallCeilings: AUDIT_CALL_CEILINGS
      },
      configuration: {
        width: options.width,
        height: options.height,
        dpr: options.dpr,
        samples: options.samples,
        warmup: options.warmup,
        memoryPasses: options.memoryPasses,
        maps: selectedRoute.map((entry) => entry.id),
        gpuMode: options.gpu,
        quick: options.quick,
        softwareAllowed: options.allowSoftware
      },
      environment,
      perMap,
      memory,
      issues
    };
    fs.mkdirSync(path.dirname(options.output), { recursive: true });
    fs.writeFileSync(options.output, JSON.stringify(report, null, 2) + '\n');
    console.log(`\n${report.result.toUpperCase()}: ${issues.length} issue(s)`);
    for (const issue of issues) console.log(`  - ${issue}`);
    console.log(`Report: ${options.output}`);
    if (issues.length && !options.reportOnly) process.exitCode = 1;
  } catch (error) {
    console.error(`Performance gate infrastructure failure: ${error.stack || error.message}`);
    if (chromeLog) console.error(`\nChrome tail:\n${chromeLog}`);
    process.exitCode = 2;
  } finally {
    if (cdp) cdp.close();
    if (browser && browser.exitCode === null) browser.kill('SIGTERM');
    if (server) await new Promise((resolve) => server.close(resolve));
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch (_) {
      // Chrome may still hold a transient lock for a few milliseconds.
    }
  }
}

main();
