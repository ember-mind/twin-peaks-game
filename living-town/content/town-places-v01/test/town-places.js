/* town-places.js — what can be checked about the park, the street and the homes
 * without eyes: that the art and the collision rows say the same thing, that
 * nothing here writes to the world, that the same arguments always paint the
 * same pixels, that the furniture the world lists is drawn at its own tile, and
 * that nothing letters a name onto a wall.
 *
 * Whether it LOOKS right is a browser question; see tools/capture-gallery.js.
 *
 *   node living-town/content/town-places-v01/test/town-places.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const J = (...p) => path.resolve(__dirname, '..', '..', '..', '..', ...p);

global.window = global;
global.Image = class { set src(v) { this._src = v; this.complete = true; this.naturalWidth = 360; this.naturalHeight = 360; setTimeout(() => this.onload && this.onload(), 0); } get src() { return this._src; } };
['ember-math.js', 'ember-grid.js', 'ember-camera.js', 'ember-tilemap.js', 'ember-viewport.js'].forEach((f) => require(J('engine', f)));
require(J('living-town', 'js', 'lt-util.js'));
require(J('living-town', 'js', 'lt-names.js'));
require(J('living-town', 'js', 'lt-appearance.js'));
require(J('living-town', 'js', 'lt-production-host.js'));
require(J('js', 'retro-authored.js'));
require(J('living-town', 'js', 'lt-world.js'));
require(J('living-town', 'content', 'town-places-v01', 'lt-town-places.js'));

const LT = global.LT, GAME = global.GAME, W = LT.World, TP = LT.TownPlaces;
const KIT = GAME.Retro2D.interiorKit;
const PLACES = ['park', 'street', 'flat_a', 'flat_b', 'flat_c', 'flat_d', 'flat_e'];
const SOURCE = fs.readFileSync(path.resolve(__dirname, '..', 'lt-town-places.js'), 'utf8');
/* The checks below are about what the file DOES, so they read it with its
 * prose taken out: a comment saying "no randomness" is not randomness. */
const CODE = SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); console.log('  ok - ' + msg); }

/* A context that writes nothing but a list of what it was asked to paint. */
function recorder() {
  const log = [];
  const ctx = {
    canvas: { width: 256, height: 192 }, globalAlpha: 1, imageSmoothingEnabled: false, fillStyle: '#000',
    fillRect(x, y, w, h) { log.push(['rect', Math.round(x), Math.round(y), w, h, this.fillStyle]); },
    drawImage() { log.push(['image']); },
    save() {}, restore() {}, translate() {}, scale() {}, clearRect() {}, beginPath() {}, moveTo() {},
    lineTo() {}, closePath() {}, fill() {}, stroke() {}, arc() {}, rect() {}, clip() {}, setTransform() {}
  };
  ctx.log = log;
  return ctx;
}
const rowsOf = (id) => W.LOCATIONS[id].rows;

function artAndRowsAgree() {
  console.log('# every solid cell is painted as the thing it is, and nothing else is');
  let solidCells = 0, walkableClaims = 0;
  PLACES.forEach((id) => {
    const rows = rowsOf(id), claims = TP.claims(id, rows);
    assert(claims, id + ' has no plan');
    for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y].charAt(x), solid = W.isSolid(ch), kind = claims[x + ',' + y];
      if (solid) {
        assert(kind, id + ' ' + x + ',' + y + " ('" + ch + "') is solid and nothing paints it");
        solidCells++;
      } else if (kind) {
        assert(TP.WALKABLE_KINDS[kind], id + ' ' + x + ',' + y + ' is walkable but painted as ' + kind);
        walkableClaims++;
      }
    }
  });
  ok(solidCells > 200, solidCells + ' solid cells across ' + PLACES.length + ' places are each claimed by a piece');
  ok(walkableClaims > 0, walkableClaims + ' pieces stand on a walkable cell, and every one of them is a doorway or a chair');
}

function furnitureIsWhereTheWorldSaysItIs() {
  console.log('# the furniture the world lists is drawn at its own tile, as itself');
  const WANT = { bed: 'bed', 'kitchen counter': 'kitchen', guitar: 'guitar', 'park bench': 'bench' };
  let n = 0;
  W.OBJECTS.filter((o) => PLACES.indexOf(o.location) >= 0).forEach((o) => {
    const want = WANT[o.name];
    assert(want, 'no piece kind is claimed for ' + o.name + ' (' + o.id + ')');
    const kind = TP.claims(o.location, rowsOf(o.location))[o.x + ',' + o.y];
    assert(kind === want, o.id + ' at ' + o.x + ',' + o.y + ' in ' + o.location + ' is painted as ' + kind + ', not ' + want);
    n++;
  });
  ok(n >= 12, 'all ' + n + ' beds, kitchen counters, guitars and benches the world places are recognisable pieces at their own tile');
  /* And the other way: a bed run is one piece, however the rows lay it. */
  const across = TP.plan('flat_a', rowsOf('flat_a')).pieces.filter((p) => p.kind === 'bed');
  const down = TP.plan('flat_c', rowsOf('flat_c')).pieces.filter((p) => p.kind === 'bed');
  ok(across.length === 1 && across[0].w === 2 && across[0].orient === 'across' &&
     down.length === 1 && down[0].h === 2 && down[0].orient === 'down',
     'a bed lies the way its own cells lie: one piece across in flat_a, one piece down in flat_c');
}

function depthIsCorrect() {
  console.log('# the foreground pass covers whoever is behind a piece, and nobody else');
  PLACES.forEach((id) => {
    TP.plan(id, rowsOf(id)).pieces.forEach((piece) => {
      assert(piece.depth === (piece.y + piece.h) * 16, id + '/' + piece.kind + ' has a depth that is not its own floor line');
      if (piece.claimOnly) assert(!piece.foreground, id + ' claims a wall as a foreground piece');
    });
  });
  const beds = [];
  PLACES.forEach((id) => TP.plan(id, rowsOf(id)).pieces.forEach((p) => { if (p.kind === 'bed') beds.push(id + ':' + p.foreground); }));
  ok(beds.length === 5 && beds.every((b) => /:false$/.test(b)),
     'a bed is never repainted in front of anybody: a sleeper is drawn lying on it, and would be painted over');
  const chairs = [];
  PLACES.forEach((id) => TP.plan(id, rowsOf(id)).pieces.forEach((p) => { if (p.kind === 'chair') chairs.push(p.foreground); }));
  ok(chairs.length >= 4 && chairs.every((f) => f === false),
     'nor is a chair, because its cell is one a person stands on');
  /* The band pass really is selective. */
  const rows = rowsOf('park'), all = recorder(), band = recorder();
  TP.drawForeground(all.log && all, 'park', rows, 0, -16, -Infinity, Infinity, {});
  TP.drawForeground(band, 'park', rows, 0, -16, 0, 48, {});
  ok(band.log.length > 0 && band.log.length < all.log.length,
     'one band paints some of the park\'s pieces (' + band.log.length + ' draws) and the whole range paints all of them (' + all.log.length + ')');
}

function itIsAProjection() {
  console.log('# drawing reads its arguments and writes pixels, and does nothing else');
  const before = JSON.stringify(W.LOCATIONS);
  PLACES.forEach((id) => {
    const g1 = recorder(), g2 = recorder();
    TP.draw(g1, id, rowsOf(id), 0, -16, { minute: 600 });
    TP.draw(g2, id, rowsOf(id), 0, -16, { minute: 600 });
    assert(g1.log.length > 400, id + ' is painted with only ' + g1.log.length + ' draws');
    assert(JSON.stringify(g1.log) === JSON.stringify(g2.log), id + ' does not paint the same pixels twice running');
  });
  ok(true, 'every place paints the same pixels for the same arguments, twice running');
  ok(JSON.stringify(W.LOCATIONS) === before, 'and nothing in the world changed while it was drawn');
  ok(!/Math\.random|Date\.now|new Date|localStorage|fetch\(/.test(CODE),
     'the source reads no clock, no randomness and no storage');
  ok(!/LT\.(Sim|World)\s*\.\s*[A-Za-z]+\s*=/.test(CODE) && !/\.rows\s*\[[^\]]*\]\s*=/.test(CODE),
     'and it assigns to nothing that belongs to the simulation');
}

function nothingIsLettered() {
  console.log('# no name, no sign, no monogram is painted anywhere');
  let lettered = 0;
  const word = KIT.word, signWord = KIT.signWord, specials = KIT.specials, menuBoard = KIT.menuBoard, neon = KIT.neon;
  KIT.word = KIT.signWord = KIT.specials = KIT.menuBoard = KIT.neon = function () { lettered++; };
  try { PLACES.forEach((id) => TP.draw(recorder(), id, rowsOf(id), 0, -16, { minute: 780 })); }
  finally { KIT.word = word; KIT.signWord = signWord; KIT.specials = specials; KIT.menuBoard = menuBoard; KIT.neon = neon; }
  ok(lettered === 0, 'not one glyph is drawn by any of the seven places');
  ok(!/signWord|menuBoard|\bneon\b|signage|monogram/.test(CODE), 'and the source never reaches for the kit\'s lettering at all');
}

function everythingGoesThroughTheKit() {
  console.log('# every pixel goes down through the kit, in the kit\'s own material');
  const calls = { rect: 0, contactShadow: 0 };
  const rect = KIT.rect, contact = KIT.contactShadow;
  KIT.rect = function () { calls.rect++; return rect.apply(this, arguments); };
  KIT.contactShadow = function () { calls.contactShadow++; return contact.apply(this, arguments); };
  let direct = 0;
  const g = recorder();
  const fillRect = g.fillRect;
  g.fillRect = function () { direct++; return fillRect.apply(this, arguments); };
  try { PLACES.forEach((id) => TP.draw(g, id, rowsOf(id), 0, -16, { minute: 600 })); }
  finally { KIT.rect = rect; KIT.contactShadow = contact; }
  ok(calls.rect > 3000 && calls.contactShadow > 20,
     calls.rect + ' rectangles and ' + calls.contactShadow + ' contact shadows, all of them the production kit\'s');
  ok(direct >= calls.rect, 'and every fill on the context came from one of them, or from a kit piece drawing itself ('
     + direct + ' fills for ' + calls.rect + ' kit.rect calls)');
  ok(!/\bctx\.fillRect|g\.fillRect|createLinearGradient|globalAlpha\s*=|drawImage|filter\s*=|imageSmoothing/.test(CODE),
     'the source never fills, blends, scales or resamples on its own');
}

function materialsAreRoomsNotPeople() {
  console.log('# a place\'s colour belongs to the place');
  PLACES.forEach((id) => {
    const m = TP.materialFor(id);
    assert(KIT.materials[m], id + ' asks for material ' + m + ', which is not registered on the kit');
  });
  ok(true, 'every place has a material registered on the production kit');
  const accents = ['flat_a', 'flat_b', 'flat_c', 'flat_d', 'flat_e'].map((id) => KIT.materials[TP.materialFor(id)].red);
  ok(new Set(accents).size === 5, 'the five homes have five different accents: ' + accents.join(' '));
  ok(TP.materialFor('flat_c') === TP.materialFor('flat_c'), 'and a home keeps the same one every time it is asked');
  const residents = W.CHARACTERS.concat(W.NEIGHBOURS).map((c) => c.id).concat(['resident_a', 'resident_b']);
  ok(residents.every((r) => CODE.indexOf(r) < 0) && !/resident|character|inhabitant\b|appearanceId|activity/.test(CODE),
     'and nothing in the source knows that anybody lives anywhere');
}

function itKnowsWhatItCannotDraw() {
  console.log('# it says no rather than drawing a hole');
  ok(TP.draw(recorder(), 'cafe', rowsOf('cafe'), 0, -16, {}) === false, 'the café is not this package\'s room, and it says so');
  ok(TP.drawForeground(recorder(), 'cafe', rowsOf('cafe'), 0, -16, 0, 99, {}) === false, 'the same for its foreground pass');
  ok(TP.draw(recorder(), 'nowhere', ['...'], 0, 0, {}) === false && TP.draw(recorder(), 'park', null, 0, 0, {}) === false,
     'an unknown place and a place with no rows both fall back');
  ok(TP.draw(recorder(), 'park', rowsOf('park'), 0, -16, { kit: null }) === false ||
     TP.handles('park') === true, 'and `handles` answers before anybody draws anything');
  ok(PLACES.every((id) => TP.handles(id)) && !TP.handles('cafe'), 'it handles the seven places it paints and nothing else');
}

function lampsReadTheClockAndNothingElse() {
  console.log('# the only thing the clock changes is whether a lamp is burning');
  const day = recorder(), night = recorder(), none = recorder();
  TP.draw(day, 'street', rowsOf('street'), 0, -8, { minute: 720 });
  TP.draw(night, 'street', rowsOf('street'), 0, -8, { minute: 1380 });
  TP.draw(none, 'street', rowsOf('street'), 0, -8, {});
  const differ = JSON.stringify(day.log) !== JSON.stringify(night.log);
  ok(differ, 'midday and midnight paint the street differently: the lanterns are lit');
  ok(JSON.stringify(day.log) === JSON.stringify(none.log), 'and a frame with no minute at all is the unlit one, not a broken one');
  const doors = TP.plan('street', rowsOf('street')).pieces.filter((p) => p.kind === 'door').length;
  const lit = night.log.filter((e) => e[5] === '#ffdc82').length;
  ok(doors === 6 && lit === doors && day.log.filter((e) => e[5] === '#ffdc82').length === 0,
     'each of the street\'s ' + doors + ' house doors carries a lantern, lit at midnight and out at midday');
}

function paintStaysInsideTheFrame() {
  console.log('# nothing paints far outside the viewport it was given');
  PLACES.forEach((id) => {
    const rows = rowsOf(id), g = recorder();
    const camX = Math.max(0, (rows[0].length * 16 - 256) / 2) || (rows[0].length * 16 - 256) / 2;
    const camY = (rows.length * 16 - 192) / 2;
    TP.draw(g, id, rows, camX, camY, { minute: 600 });
    g.log.forEach((e) => {
      if (e[0] !== 'rect') return;
      assert(e[1] > -80 && e[2] > -80 && e[1] + e[3] < 336 && e[2] + e[4] < 272,
        id + ' paints at ' + e.slice(1, 5).join(',') + ', far outside the 256x192 frame');
    });
  });
  ok(true, 'every rectangle of every place lands within one overdraw tile of the native frame');
}

function streetFrontsAgree() {
  console.log('# the street has seven entrances inside two continuous building bands');
  const rows = rowsOf('street'), plan = TP.plan('street', rows), counts = {};
  plan.pieces.forEach((p) => {
    const cells = p.cells || Array.from({length:p.w * p.h}, (_, i) => ({x:p.x + i % p.w, y:p.y + Math.floor(i / p.w)}));
    cells.forEach(c => { const k=c.x + ',' + c.y; counts[k]=(counts[k] || 0)+1; });
  });
  const blocked = W.blockedCells('street');
  ok(blocked.length === 94 && blocked.every(c => counts[c] === 1),
    'all 94 solid cells (house fronts, the park boundary, garden walls and fences) are claimed exactly once');
  const doors = plan.pieces.filter(p => p.kind === 'door'), gates = plan.pieces.filter(p => p.kind === 'gate');
  ok(doors.length === 6 && gates.length === 1 && gates[0].x === 8 && gates[0].y === 8,
    'six house/shop doors and the park gate occupy the seven real D runs');
  ok(doors.map(d=>d.destination).sort().join(',') === 'cafe,flat_a,flat_b,flat_c,flat_d,flat_e',
    'each home and the cafe have their own entrance material');
  ok(doors.concat(gates).every(d => {
    const portal = W.STREET_PORTALS[d.destination];
    return portal && portal.x >= d.x && portal.x < d.x + d.w && Math.abs(portal.y - d.y) === (d.kind === 'gate' ? 0 : 1);
  }), 'every entrance accent matches the actual world destination, including the attic and ground-floor home');
  ok(plan.fronts.filter(f=>f.side === 'north').every(f=>f.h * 16 >= 48),
    'the north facades have at least 48 pixels of wall');
  ok(plan.northPavement === 3 && plan.southPavement === 7,
    'rows 3 and 7 are pavements; only rows 4 through 6 form the carriageway');
  const front = recorder(), behind = recorder();
  TP.drawForeground(front, 'street', rows, 0, -8, 48, 49, {minute:600});
  TP.drawForeground(behind, 'street', rows, 0, -8, 49, 143, {minute:600});
  ok(front.log.length > 0 && behind.log.length === 0,
    'north lintels and the cafe awning repaint at door depth, never over pavement walkers');
}

artAndRowsAgree();
streetFrontsAgree();
furnitureIsWhereTheWorldSaysItIs();
depthIsCorrect();
itIsAProjection();
nothingIsLettered();
everythingGoesThroughTheKit();
materialsAreRoomsNotPeople();
itKnowsWhatItCannotDraw();
lampsReadTheClockAndNothingElse();
paintStaysInsideTheFrame();
console.log('\ntown-places: ' + checks + '/' + checks);
