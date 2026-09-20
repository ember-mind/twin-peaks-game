#!/usr/bin/env node
/* capture-gallery.js — every image this package ships, taken off the real renderer.
 *
 * Opens living-town/content/town-places-v01/gallery.html in headless Chrome with
 * the production interior kit loaded exactly as the game loads it, and asks the
 * page for its own canvases. Nothing is drawn here: this tool only chooses what
 * to keep and where to put it.
 *
 *   node living-town/content/town-places-v01/tools/capture-gallery.js
 *   node living-town/content/town-places-v01/tools/capture-gallery.js --check
 *
 * `--check` writes nothing and exits non-zero the moment an image or the
 * manifest on disk stops being what the renderer produces now.
 *
 * One Chrome driver at a time on this machine: the tool takes /tmp/lt-chrome.lock
 * itself, waits for it, and gives it back however it exits.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { launch, sleep } = require('../../../../test/lib/chrome-cdp.js');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const DIR = path.resolve(__dirname, '..');
const PAGE = 'living-town/content/town-places-v01/gallery.html';
const LOCK = '/tmp/lt-chrome.lock';
const check = process.argv.includes('--check');
const problems = [];

const PLACES = ['park', 'street', 'flat_a', 'flat_b', 'flat_c', 'flat_d', 'flat_e'];

function put(rel, buffer) {
  const file = path.join(DIR, rel);
  if (check) {
    const same = fs.existsSync(file) && fs.readFileSync(file).equals(buffer);
    if (!same) problems.push(rel);
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buffer);
  console.log('  wrote ' + path.relative(ROOT, file));
}
const fromDataUrl = (url) => Buffer.from(String(url).replace(/^data:image\/png;base64,/, ''), 'base64');

async function takeLock() {
  for (let i = 0; i < 180; i++) {
    try { fs.mkdirSync(LOCK); return; } catch (e) { if (e.code !== 'EEXIST') throw e; }
    if (i === 0) console.log('  waiting for ' + LOCK + ' …');
    await sleep(20000);
  }
  throw new Error('another Chrome driver has held ' + LOCK + ' for an hour');
}
function dropLock() { try { fs.rmdirSync(LOCK); } catch (e) { /* not ours to drop */ } }

(async function () {
  await takeLock();
  let page = null;
  try {
    page = await launch({ root: ROOT, width: 1400, height: 1200 });
    await page.navigate(PAGE);
    for (let i = 0; i < 90; i++) {
      if (await page.evaluate('!!(window.GALLERY && window.GALLERY.frames && window.GALLERY.frames.park)')) break;
      await sleep(150);
    }
    const state = await page.evaluate("document.getElementById('status').textContent");
    console.log('  ' + state);
    if (!/decoded/.test(state) || /NOT decoded/.test(state)) throw new Error('the production atlas never decoded: ' + state);

    /* Real defect check, not test theatre: a solid cell nobody paints is a
     * hole in the room, and a walkable cell painted as furniture is a lie
     * about where a person may go. */
    const bad = JSON.parse(await page.evaluate('GALLERY.agreement()'));
    if (bad.length) throw new Error('art and rows disagree: ' + bad.join('; '));
    console.log('  art and rows agree on every cell of ' + PLACES.length + ' places');

    put('images/01-cafe-bar.png', fromDataUrl(await page.evaluate("GALLERY.png('cafe', 1)")));
    for (const id of PLACES) {
      put('images/02-' + id.replace(/_/g, '-') + '.png', fromDataUrl(await page.evaluate("GALLERY.png('" + id + "', 1)")));
      put('images/03-' + id.replace(/_/g, '-') + '-x3.png', fromDataUrl(await page.evaluate("GALLERY.png('" + id + "', 3)")));
    }
    for (let n = 0; n < 4; n++) {
      put('images/04-hour-' + n + '.png', fromDataUrl(await page.evaluate("GALLERY.png('hour-" + n + "', 1)")));
    }
    for (const id of ['park', 'street', 'flat_a']) {
      put('images/05-collision-' + id.replace(/_/g, '-') + '.png',
        fromDataUrl(await page.evaluate("GALLERY.png('collision-" + id + "', 1)")));
    }
    for (const key of await page.evaluate('GALLERY.reviewSpecs.map(s => s.key)')) {
      put('images/06-' + key + '.png', fromDataUrl(await page.evaluate("GALLERY.png('" + key + "', 1)")));
    }
    put('town-places.manifest.json', Buffer.from(await page.evaluate('GALLERY.manifest()') + '\n'));

    if (check) {
      console.log(JSON.stringify({ status: problems.length ? 'fail' : 'pass', stale: problems }));
      process.exitCode = problems.length ? 1 : 0;
      return;
    }
    console.log(JSON.stringify({ status: 'pass', places: PLACES.length }));
  } finally {
    if (page) await page.close();
    dropLock();
  }
})().catch((e) => { console.error(e); dropLock(); process.exit(1); });
