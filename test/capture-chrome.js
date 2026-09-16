#!/usr/bin/env node
'use strict';

// Bounded CDP screenshot helper. Unlike Chrome's --virtual-time-budget capture,
// this waits for the harness' explicit ready title and never accepts a half-
// rendered frame as evidence.

const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

function fail(message) {
  console.error(`capture-chrome: ${message}`);
  process.exitCode = 2;
}

function parse(argv) {
  const out = {
    chrome: '',
    url: '',
    output: '',
    width: 960,
    height: 640,
    readyPrefix: 'TP-SHOT-READY',
    timeoutMs: 15000,
    gpu: process.platform === 'darwin' ? 'metal' : 'auto',
    framesDir: '',
    nativeAttr: ''
  };
  for (const arg of argv) {
    if (arg.startsWith('--chrome=')) out.chrome = arg.slice(9);
    else if (arg.startsWith('--url=')) out.url = arg.slice(6);
    else if (arg.startsWith('--output=')) out.output = arg.slice(9);
    else if (arg.startsWith('--width=')) out.width = Number(arg.slice(8));
    else if (arg.startsWith('--height=')) out.height = Number(arg.slice(9));
    else if (arg.startsWith('--ready-prefix=')) out.readyPrefix = arg.slice(15);
    else if (arg.startsWith('--timeout-ms=')) out.timeoutMs = Number(arg.slice(13));
    else if (arg.startsWith('--gpu=')) out.gpu = arg.slice(6);
    else if (arg.startsWith('--frames-dir=')) out.framesDir = arg.slice(13);
    else if (arg.startsWith('--native-attr=')) out.nativeAttr = arg.slice(14);
    else throw new Error(`unknown option: ${arg}`);
  }
  if (!out.chrome || !fs.existsSync(out.chrome)) throw new Error('Chrome binary missing');
  if (!/^https?:\/\/127\.0\.0\.1(?::\d+)?\//.test(out.url)) {
    throw new Error('only loopback HTTP(S) URLs are accepted');
  }
  if (!out.output) throw new Error('--output is required');
  if (!Number.isInteger(out.width) || out.width < 320 ||
      !Number.isInteger(out.height) || out.height < 240) {
    throw new Error('invalid viewport');
  }
  if (!Number.isFinite(out.timeoutMs) || out.timeoutMs < 1000) {
    throw new Error('invalid timeout');
  }
  if (!['auto', 'metal', 'swiftshader'].includes(out.gpu)) {
    throw new Error(`invalid gpu mode: ${out.gpu}`);
  }
  return out;
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
  let last = 'no response';
  while (Date.now() < deadline) {
    try {
      const remaining = Math.max(1, deadline - Date.now());
      const response = await fetch(url, {
        signal: AbortSignal.timeout(Math.min(1000, remaining))
      });
      if (response.ok) return await response.json();
      last = `HTTP ${response.status}`;
    } catch (error) {
      last = error.message;
    }
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
  throw new Error(`DevTools endpoint timeout (${last})`);
}

class Cdp {
  constructor(url, timeoutMs) {
    this.url = url;
    this.timeoutMs = timeoutMs;
    this.ws = null;
    this.id = 0;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP connect timeout')), this.timeoutMs);
      this.ws.onopen = () => {
        clearTimeout(timer);
        resolve();
      };
      this.ws.onerror = (event) => {
        clearTimeout(timer);
        reject(new Error(event && event.message || 'CDP socket error'));
      };
    });
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !this.pending.has(message.id)) return;
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      clearTimeout(pending.timer);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result || {});
    };
    this.ws.onerror = (event) => {
      this.rejectPending(new Error(event && event.message || 'CDP socket error'));
    };
    this.ws.onclose = () => {
      this.rejectPending(new Error('CDP socket closed'));
    };
  }

  rejectPending(error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
  }

  send(method, params = {}, timeoutMs = this.timeoutMs) {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error(`CDP socket is not open for ${method}`));
        return;
      }
      const id = ++this.id;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP command timeout: ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      try {
        this.ws.send(JSON.stringify({ id, method, params }));
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(error);
      }
    });
  }

  async evaluate(expression, timeoutMs = this.timeoutMs) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true
    }, timeoutMs);
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text || 'page evaluation failed');
    }
    return result.result && result.result.value;
  }

  close() {
    this.rejectPending(new Error('CDP client closed'));
    if (this.ws) this.ws.close();
  }
}

async function terminate(child) {
  if (!child || child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 1200))
  ]);
  if (child.exitCode === null) child.kill('SIGKILL');
}

async function main() {
  const options = parse(process.argv.slice(2));
  const port = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-shot-chrome-'));
  const chromeLog = path.join(profile, 'chrome.log');
  const logFd = fs.openSync(chromeLog, 'w');
  let child;
  let cdp;
  try {
    const chromeArgs = [
      '--headless=new', '--mute-audio',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      '--enable-gpu',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank'
    ];
    if (options.gpu === 'metal') chromeArgs.splice(3, 0, '--use-angle=metal');
    if (options.gpu === 'swiftshader') {
      chromeArgs.splice(3, 0, '--enable-unsafe-swiftshader', '--use-angle=swiftshader');
    }
    child = spawn(options.chrome, chromeArgs, { stdio: ['ignore', logFd, logFd] });

    const pages = await waitForJson(`http://127.0.0.1:${port}/json/list`, options.timeoutMs);
    const page = pages.find((item) => item.type === 'page');
    if (!page || !page.webSocketDebuggerUrl) throw new Error('no debuggable page');
    cdp = new Cdp(page.webSocketDebuggerUrl, options.timeoutMs);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: options.width,
      height: options.height,
      screenWidth: options.width,
      screenHeight: options.height,
      deviceScaleFactor: 1,
      mobile: false
    });
    await cdp.send('Page.navigate', { url: options.url });

    const deadline = Date.now() + options.timeoutMs;
    let title = '';
    let pageError = '';
    while (Date.now() < deadline) {
      try {
        const commandTimeoutMs = Math.max(1, Math.min(2000, deadline - Date.now()));
        const state = await cdp.evaluate(`({
          title: document.title,
          error: window.__TP_SHOT_ERROR__ || '',
          size: [innerWidth, innerHeight]
        })`, commandTimeoutMs);
        title = state && state.title || '';
        pageError = state && state.error || '';
        if (title.startsWith(options.readyPrefix)) break;
        if (pageError || /(?:^|-)ERR(?:OR)?/.test(title) || title === 'TP-SHOT-ERROR') {
          throw new Error(`page reported ${title}: ${pageError || 'unknown error'}`);
        }
      } catch (error) {
        if (/page reported/.test(error.message)) throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    if (!title.startsWith(options.readyPrefix)) {
      throw new Error(`ready-title timeout; expected prefix "${options.readyPrefix}", got "${title}"`);
    }

    // Give the compositor one bounded task after the harness copied the final
    // WebGL pixels, then capture exactly the emulated CSS viewport at DPR 1.
    await new Promise((resolve) => setTimeout(resolve, 60));
    if (options.nativeAttr) {
      // Native-frame mode: the harness already exported the untouched canvas
      // pixels on a body attribute. No screenshot, no scaling, no compositor.
      const attrDeadline = Date.now() + 8000;
      let url = '';
      while (Date.now() < attrDeadline) {
        url = await cdp.evaluate(
          `document.body.getAttribute(${JSON.stringify(options.nativeAttr)}) || ''`,
          2000
        );
        if (url) break;
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
      const match = /^data:image\/png;base64,(.+)$/.exec(String(url || ''));
      if (!match) throw new Error(`native frame attribute ${options.nativeAttr} missing`);
      const buffer = Buffer.from(match[1], 'base64');
      const nw = buffer.readUInt32BE(16);
      const nh = buffer.readUInt32BE(20);
      if (nw !== 256 || nh !== 192) throw new Error(`native frame is ${nw}x${nh}, expected 256x192`);
      fs.writeFileSync(options.output, buffer);
      console.log(JSON.stringify({ ok: true, title, native: [nw, nh], output: options.output }));
      return;
    }
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false
    });
    if (!shot.data) throw new Error('Page.captureScreenshot returned no data');
    fs.writeFileSync(options.output, Buffer.from(shot.data, 'base64'));
    let exportedFrames = 0;
    if (options.framesDir) {
      // Fetch frames individually: long native animation reels can exceed CDP message limits.
      const frameCount = await cdp.evaluate('(window.__TP_SHOT_FRAMES__ || []).length', options.timeoutMs);
      fs.mkdirSync(options.framesDir, { recursive: true });
      for (let index = 0; index < frameCount; index++) {
        const frame = await cdp.evaluate(`window.__TP_SHOT_FRAMES__[${index}]`, options.timeoutMs);
        const match = /^data:image\/(png|webp);base64,(.+)$/.exec(frame);
        if (!match) throw new Error(`invalid exported motion frame ${index}`);
        fs.writeFileSync(
          path.join(options.framesDir, `frame-${String(index).padStart(3, '0')}.${match[1]}`),
          Buffer.from(match[2], 'base64')
        );
      }
      exportedFrames = frameCount;
    }
    console.log(JSON.stringify({
      ok: true,
      title,
      gpu: options.gpu,
      viewport: [options.width, options.height],
      output: options.output,
      exportedFrames
    }));
  } catch (error) {
    let log = '';
    try { log = fs.readFileSync(chromeLog, 'utf8').slice(-5000); } catch (_) {}
    throw new Error(`${error.message}${log ? `\nChrome log:\n${log}` : ''}`);
  } finally {
    if (cdp) cdp.close();
    await terminate(child);
    try { fs.closeSync(logFd); } catch (_) {}
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

main().catch((error) => fail(error.stack || error.message));
