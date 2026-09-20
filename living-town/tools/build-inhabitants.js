#!/usr/bin/env node
/* build-inhabitants.js — compile Living Town's looks into a walk-cycle atlas.
 *
 * Same paper-doll parts, same rasteriser, same 360x360 / 72px-block / 24px-frame
 * layout as the Twin Peaks production cast atlas, so the production atlas
 * renderer draws it unchanged. Only the recipes (living-town/js/lt-appearance.js)
 * are Living Town's.
 *   node living-town/tools/build-inhabitants.js           write the atlas
 *   node living-town/tools/build-inhabitants.js --check   verify it is current
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { rasterize, stats, atlasPixels } = require('../../tools/build-cast-authored.js');
global.window = global;
require('../js/lt-appearance.js');
const A = global.LT.Appearance;

const OUT = path.resolve(__dirname, '..', 'assets', 'inhabitants-hg-24.png');
const sheets = {};
const problems = [];
A.ORDER.forEach((id) => {
  const spec = A.spec(id);
  sheets[id] = rasterize(id, spec);
  stats(id, spec).forEach((s) => {
    /* The production cast's own legibility contract. */
    if (s.colors < 12 || s.colors > 15) problems.push(id + '/' + s.frame + ': ' + s.colors + ' colors');
    if (s.width < 13 || s.width > 17) problems.push(id + '/' + s.frame + ': width ' + s.width);
  });
});
if (problems.length) { console.error('contract problems:\n- ' + problems.join('\n- ')); process.exit(1); }
const png = atlasPixels(sheets, A.ORDER);
if (process.argv.includes('--check')) {
  const same = fs.existsSync(OUT) && fs.readFileSync(OUT).equals(png);
  console.log(JSON.stringify({ status: same ? 'pass' : 'fail', atlas: path.relative(process.cwd(), OUT) }));
  process.exit(same ? 0 : 1);
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, png);
console.log(JSON.stringify({ status: 'pass', looks: A.ORDER.length, atlas: path.relative(process.cwd(), OUT) }));
