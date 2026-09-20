#!/usr/bin/env node
/* capture-gallery.js — everything this package ships in pictures, taken off
 * the real renderer.
 *
 * Opens living-town/content/activity-poses-v01/gallery.html in headless
 * Chrome, with the production interior kit and the production walk atlas
 * loaded exactly as the game loads them, and asks the page for its own
 * canvases. Nothing is drawn here: this tool only chooses what to keep.
 *
 *   node living-town/content/activity-poses-v01/tools/capture-gallery.js
 *   node living-town/content/activity-poses-v01/tools/capture-gallery.js --check
 *
 * `--check` writes nothing and fails if any committed image or the manifest
 * is not byte-for-byte what the renderer produces now. Run one Chrome driver
 * at a time.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { launch, sleep } = require('../../../../test/lib/chrome-cdp.js');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const DIR = path.resolve(__dirname, '..');
const PAGE = 'living-town/content/activity-poses-v01/gallery.html';
const check = process.argv.includes('--check');
const problems = [];

function put(rel, buffer) {
  const file = path.join(DIR, rel);
  if (check) {
    if (!fs.existsSync(file) || !fs.readFileSync(file).equals(buffer)) problems.push(rel);
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buffer);
  console.log('  wrote ' + path.relative(ROOT, file));
}
const fromDataUrl = (url) => Buffer.from(String(url).replace(/^data:image\/png;base64,/, ''), 'base64');
const dash = (s) => s.replace(/_/g, '-');

(async function () {
  const page = await launch({ root: ROOT, width: 1500, height: 1000 });
  try {
    await page.navigate(PAGE);
    for (let i = 0; i < 100; i++) {
      if (await page.evaluate('!!(window.GALLERY && window.GALLERY.ready())')) break;
      await sleep(150);
    }
    const state = await page.evaluate("document.getElementById('status').textContent");
    console.log('  ' + state);
    if (!/walk atlas: decoded/.test(state)) throw new Error('the production atlas never decoded: ' + state);
    if (!/pose sheet: decoded/.test(state)) throw new Error('the pose sheet never decoded: ' + state);

    const poses = JSON.parse(await page.evaluate('JSON.stringify(LT.ActivityPoses.POSE_IDS)'));
    const look = await page.evaluate('LT.Appearance.BASE_IDS[0]');

    for (const id of poses) {
      put('images/01-' + dash(id) + '-x1.png',
        fromDataUrl(await page.evaluate("GALLERY.poseStrip('" + id + "','" + look + "',1)")));
      put('images/01-' + dash(id) + '-x5.png',
        fromDataUrl(await page.evaluate("GALLERY.poseStrip('" + id + "','" + look + "',5)")));
      put('images/02-' + dash(id) + '-looks-x4.png',
        fromDataUrl(await page.evaluate("GALLERY.looksStrip('" + id + "',false,4)")));
      put('images/02-' + dash(id) + '-looks-work-x4.png',
        fromDataUrl(await page.evaluate("GALLERY.looksStrip('" + id + "',true,4)")));
    }

    put('images/03-stage-anchors.png', fromDataUrl(await page.evaluate('GALLERY.stage(1)')));
    put('images/03-stage-anchors-x3.png', fromDataUrl(await page.evaluate('GALLERY.stage(3)')));
    put('images/03-cafe-empty.png', fromDataUrl(await page.evaluate('GALLERY.cafe({empty:true},1)')));
    put('images/03-cafe-posed.png', fromDataUrl(await page.evaluate('GALLERY.cafe({},1)')));
    put('images/03-cafe-posed-x3.png', fromDataUrl(await page.evaluate('GALLERY.cafe({},3)')));

    const hours = JSON.parse(await page.evaluate('GALLERY.light()'));
    for (const h of hours) {
      put('images/04-cafe-' + h.label.replace(':', '') + '.png',
        fromDataUrl(await page.evaluate('GALLERY.cafe({minute:' + h.minute + '},1)')));
    }
    put('images/05-day-ramp.png', fromDataUrl(await page.evaluate('GALLERY.ramp()')));

    /* Real defect checks, not test theatre. */
    const bounds = JSON.parse(await page.evaluate('GALLERY.bounds()'));
    const outsize = bounds.filter((b) => b.drawn[0] > b.declared[0] || b.drawn[1] > b.declared[1]);
    if (outsize.length) throw new Error('drawn outside the declared box: ' + JSON.stringify(outsize));
    /* Every standing-height pose must end on the same floor line as the walk
     * sprite, or a person jumps when the pose changes. drawChar's cell bottom
     * is 16px under the y it is given; `foot` is measured from that same y. */
    const floating = bounds.filter((b) => b.poseId !== 'sleeping' && b.foot !== 15);
    if (floating.length) throw new Error('pose feet off the standing ground line: ' + JSON.stringify(floating));
    console.log('  every cell inside its box, every standing pose on the ground line');

    const drift = hours.filter((h, i) => i && h.glass === hours[i - 1].glass);
    if (drift.length) throw new Error('two of the four hours share a window colour: ' + JSON.stringify(drift));
    console.log('  four hours: ' + hours.map((h) => h.label + ' ' + h.phase + ' ' + h.glass +
      ' lamps=' + h.lamps).join(', '));

    put('activity-poses.manifest.json', Buffer.from(await page.evaluate('GALLERY.manifest()') + '\n'));

    if (check) {
      console.log(JSON.stringify({ status: problems.length ? 'fail' : 'pass', stale: problems }));
      process.exit(problems.length ? 1 : 0);
    }
    console.log(JSON.stringify({ status: 'pass', poses: poses.length, cells: bounds.length }));
  } finally { await page.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
