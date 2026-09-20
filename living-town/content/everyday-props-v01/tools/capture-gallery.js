#!/usr/bin/env node
/* capture-gallery.js — everything this package ships, taken off the real renderer.
 *
 * Opens living-town/content/everyday-props-v01/gallery.html in headless Chrome,
 * with the production interior kit loaded exactly as the game loads it, and
 * asks the page for its own canvases. Nothing is drawn here: this tool only
 * chooses what to keep and where to put it.
 *
 *   node living-town/content/everyday-props-v01/tools/capture-gallery.js
 *   node living-town/content/everyday-props-v01/tools/capture-gallery.js --check
 *
 * `--check` writes nothing and fails if the baked sheet or the manifest on
 * disk are not byte-for-byte what the renderer produces now.
 * Run one Chrome driver at a time.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { launch, sleep } = require('../../../../test/lib/chrome-cdp.js');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const DIR = path.resolve(__dirname, '..');
const PAGE = 'living-town/content/everyday-props-v01/gallery.html';
const check = process.argv.includes('--check');
const problems = [];

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

(async function () {
  const page = await launch({ root: ROOT, width: 1400, height: 1000 });
  try {
    await page.navigate(PAGE);
    /* The objects are on screen at once; the café and the person wait for the
     * production cast atlas to decode. Every frame below wants the decoded one. */
    for (let i = 0; i < 80; i++) {
      if (await page.evaluate('!!(window.GALLERY && window.GALLERY.ready())')) break;
      await sleep(150);
    }
    const state = await page.evaluate("document.getElementById('status').textContent");
    console.log('  ' + state);
    if (!/decoded/.test(state)) throw new Error('the production atlas never decoded: ' + state);

    const order = JSON.parse(await page.evaluate('JSON.stringify(LT.EverydayProps.ORDER)'));

    put('images/01-specimens-x1.png', fromDataUrl(await page.evaluate('GALLERY.specimens(1)')));
    put('images/01-specimens-x6.png', fromDataUrl(await page.evaluate('GALLERY.specimens(6)')));
    for (const typeId of order) {
      put('images/02-' + typeId.replace(/_/g, '-') + '-x1.png',
        fromDataUrl(await page.evaluate("GALLERY.strip('" + typeId + "', 1)")));
      put('images/02-' + typeId.replace(/_/g, '-') + '-x4.png',
        fromDataUrl(await page.evaluate("GALLERY.strip('" + typeId + "', 4)")));
    }
    put('images/03-cafe-untouched.png', fromDataUrl(await page.evaluate('GALLERY.cafe(false, 1)')));
    put('images/04-cafe-with-props.png', fromDataUrl(await page.evaluate('GALLERY.cafe(true, 1)')));
    put('images/04-cafe-with-props-x3.png', fromDataUrl(await page.evaluate('GALLERY.cafe(true, 3)')));

    /* Real defect check, not test theatre: a frame that paints outside its own
     * box will clip against the furniture next to it. */
    const bounds = JSON.parse(await page.evaluate('GALLERY.bounds()'));
    const outside = bounds.filter((b) => b.offset[0] < 0 || b.offset[1] < 0 ||
      b.offset[0] + b.drawn[0] > b.declared[0] || b.offset[1] + b.drawn[1] > b.declared[1]);
    if (outside.length) {
      throw new Error('drawn outside the declared frame: ' + JSON.stringify(outside));
    }
    console.log('  every frame paints inside its own box: ' +
      bounds.map((b) => b.typeId + '/' + b.state + ' ' + b.drawn.join('x')).join(', '));

    const baked = JSON.parse(await page.evaluate('GALLERY.bake()'));
    const png = baked.png; delete baked.png;
    put('assets/everyday-props-v01.png', fromDataUrl(png));
    put('assets/everyday-props-v01.frames.json', Buffer.from(JSON.stringify(baked, null, 2) + '\n'));
    put('everyday-props.manifest.json', Buffer.from(await page.evaluate('GALLERY.manifest()') + '\n'));

    if (check) {
      console.log(JSON.stringify({ status: problems.length ? 'fail' : 'pass', stale: problems }));
      process.exit(problems.length ? 1 : 0);
    }
    console.log(JSON.stringify({ status: 'pass', sheet: baked.width + 'x' + baked.height,
      frames: baked.frames.length }));
  } finally { await page.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
