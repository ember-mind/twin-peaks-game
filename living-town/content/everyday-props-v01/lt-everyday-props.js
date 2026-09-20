/* lt-everyday-props.js — Living Town: four everyday objects, drawn.
 *
 * Content, not machinery. This file adds no object system, no inventory, no
 * simulation: it answers one question the renderer will ask — "what does a
 * `book_used` in state `open` look like at this spot" — and nothing else.
 *
 * The drawing is the production interior kit's own (js/retro-authored.js:
 * `GAME.Retro2D.interiorKit`). Every pixel goes down through `kit.rect`, every
 * contact shadow through `kit.contactShadow`, and every colour is a role in a
 * kit material, so an object put in Café Meridiana is lit and shaded by the
 * same table the counter and the banquettes are. Nothing here is resampled,
 * smoothed or scaled: the canvas is the native 256x192 one and a pixel is a
 * pixel.
 *
 * Purity is load-bearing. `draw` reads its arguments and writes to the canvas.
 * A parcel drawn `open` does not consume food; a book drawn `open` does not
 * advance anybody's reading. Visual state is an argument, never a record.
 *
 *   LT.EverydayProps.draw(g, 'book_used', 'open', x, y, { palette: p, kit: kit })
 *
 * (x, y) is where the object's pivot lands, in the same pixel space the scene
 * painter is drawing in. The pivot is the object's contact point — the middle
 * of what it stands or rests on — not the middle of its picture.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  var EP = LT.EverydayProps = LT.EverydayProps || {};

  EP.VERSION = 'everyday-props-v01';

  /* ---- shared pixel figures -------------------------------------------
   * A wheel is a ring with spokes across an open middle, never a filled disc:
   * you can see the floor through a bicycle, and at eleven pixels across that
   * gap is most of what says "wheel" rather than "wheel-shaped lump". */

  var WHEEL_OUT = [[3, 5], [2, 7], [1, 9], [0, 11], [0, 11], [0, 11], [0, 11], [0, 11], [1, 9], [2, 7], [3, 5]];
  var WHEEL_IN = [[3, 5], [2, 7], [1, 9], [1, 9], [1, 9], [1, 9], [1, 9], [2, 7], [3, 5]];
  /* The same rim after a kerb: pulled out of true on the near side and flat at
   * the bottom. Eleven rows still, so it stands on the same ground line. */
  var BENT_OUT = [[3, 5], [2, 7], [1, 9], [0, 11], [0, 11], [0, 11], [0, 10], [1, 8], [2, 7], [3, 6], [3, 6]];
  var BENT_IN = [[3, 5], [2, 7], [1, 9], [1, 9], [1, 9], [1, 8], [2, 6], [3, 5], [4, 4]];

  function ring(R, g, x, y, outer, inner, tyre) {
    for (var i = 0; i < outer.length; i++) {
      var ox = outer[i][0], ow = outer[i][1];
      var hole = (i > 0 && i < outer.length - 1) ? inner[i - 1] : null;
      if (!hole) { R(g, x + ox, y + i, ow, 1, tyre); continue; }
      var ix = hole[0], iw = hole[1];
      if (ix > ox) R(g, x + ox, y + i, ix - ox, 1, tyre);
      if (ox + ow > ix + iw) R(g, x + ix + iw, y + i, (ox + ow) - (ix + iw), 1, tyre);
    }
  }

  /* Four short spokes and a hub, inside an 11px wheel box. Short on purpose:
   * spokes drawn across the whole rim close the wheel up again. */
  function spokes(R, g, x, y, p, sprung) {
    R(g, x + 5, y + 2, 1, 3, p.metal);
    R(g, x + 2, y + 5, 3, 1, p.metal);
    if (!sprung) { R(g, x + 5, y + 6, 1, 3, p.metal); R(g, x + 6, y + 5, 3, 1, p.metal); }
    else { R(g, x + 6, y + 6, 2, 1, p.metal); R(g, x + 3, y + 8, 2, 1, p.metal); }
    R(g, x + 5, y + 5, 1, 1, p.metalHi);
  }

  /* The rim, seen edge-on just inside the tyre: without it a dark tyre on a
   * dark floor loses the wheel altogether. */
  function rim(R, g, x, y, p, short) {
    R(g, x + 1, y + 3, 1, short ? 3 : 5, p.metal);
    R(g, x + 9, y + 3, 1, short ? 2 : 5, p.metal);
  }

  /* A mudguard clears the tyre by a pixel all the way over the crown. */
  function mudguard(R, g, x, y, p, tone) {
    R(g, x + 3, y - 1, 5, 1, tone);
    R(g, x + 2, y, 1, 1, tone); R(g, x + 8, y, 1, 1, tone);
    R(g, x + 1, y + 1, 1, 1, tone); R(g, x + 9, y + 1, 1, 1, tone);
    R(g, x, y + 2, 1, 1, p.metal); R(g, x + 10, y + 2, 1, 1, p.metal);
  }

  /* ---- book_used -------------------------------------------------------
   * Read many times and looked after. The cloth is rubbed pale at a corner,
   * the stamped band has worn through where a thumb goes, and the page block
   * no longer sits square with the boards. */

  function bookClosed(R, g, x, y, p) {
    R(g, x + 2, y, 10, 1, p.ink);                              // the far edge of the board
    R(g, x + 1, y + 1, 12, 3, p.ink);
    R(g, x + 2, y + 1, 10, 3, p.redDark);                      // cloth over board
    R(g, x + 2, y + 1, 10, 1, p.red);                          // the lit top of the cover
    R(g, x + 3, y + 1, 6, 1, p.redHi);
    R(g, x + 4, y + 2, 3, 1, p.gold);                          // the stamped title, worn through
    R(g, x + 8, y + 2, 1, 1, p.gold);
    R(g, x + 10, y + 1, 2, 1, p.creamShade);                   // a corner rubbed down to the board
    R(g, x + 2, y + 3, 2, 1, p.redHi);
    R(g, x, y + 4, 14, 2, p.ink);                              // the page block, proud of the boards
    R(g, x + 1, y + 4, 12, 1, p.cream);
    R(g, x + 1, y + 5, 12, 1, p.creamShade);
    R(g, x + 9, y + 4, 3, 1, p.creamShade);                    // and no longer square with them
    R(g, x + 1, y + 6, 12, 1, p.ink);
  }

  function bookOpen(R, g, x, y, p) {
    R(g, x + 2, y, 15, 1, p.ink);                              // the far edge of both leaves
    R(g, x + 3, y, 13, 1, p.cream);
    R(g, x + 1, y + 1, 17, 1, p.ink);
    R(g, x + 2, y + 1, 15, 1, p.cream);
    R(g, x, y + 2, 19, 3, p.ink);
    R(g, x + 1, y + 2, 17, 3, p.cream);
    R(g, x + 1, y + 4, 17, 1, p.creamShade);                   // both leaves fall away to the gutter
    R(g, x + 9, y, 1, 5, p.creamShade);
    R(g, x + 9, y + 3, 1, 2, p.wood);                          // the gutter itself
    R(g, x + 2, y + 2, 5, 1, p.ink);                           // the line being read
    R(g, x + 3, y + 3, 4, 1, p.metal);                         // and the set type round it
    R(g, x + 11, y + 2, 5, 1, p.metal);
    R(g, x + 11, y + 3, 4, 1, p.metal);
    R(g, x, y + 5, 19, 2, p.ink);                              // the cover, under the leaves
    R(g, x + 1, y + 5, 17, 1, p.redDark);
    R(g, x + 7, y + 5, 4, 1, p.red);
    R(g, x + 2, y + 6, 15, 1, p.redDark);
    R(g, x + 9, y + 6, 1, 1, p.gold);                          // the ribbon, out over the near edge
    R(g, x + 3, y + 7, 13, 1, p.ink);
  }

  /* ---- food_parcel -----------------------------------------------------
   * A paper bag of groceries, folded shut across the counter at the shop. No
   * mark and no brand: the gusset, the creases and the roll of the top are
   * the whole of what says what it is. */

  /* Kraft paper across a five-value horizontal gradient: the bag is a prism,
   * not a slab, and the gusset is the one fold that runs its whole height. */
  function parcelBody(R, g, x, y, p, h) {
    var b = y + h - 1;
    R(g, x, y, 13, h, p.ink);
    R(g, x + 1, y, 11, h - 1, p.woodHi);
    R(g, x + 1, y, 1, h - 1, p.wood);                          // the near corner, turning away
    R(g, x + 2, y, 3, h - 1, p.creamShade);                    // the panel facing the light
    R(g, x + 5, y, 1, h - 1, p.woodLight);
    R(g, x + 6, y, 1, h - 1, p.woodDark);                      // the gusset
    R(g, x + 7, y, 2, h - 1, p.woodLight);
    R(g, x + 9, y, 2, h - 1, p.woodHi);
    R(g, x + 11, y, 1, h - 1, p.wood);
    /* Creases, a hairline each. They are placed from the top, so a shorter
     * body simply has fewer of them rather than three below its own base. */
    if (h > 6) R(g, x + 3, y + 3, 1, 2, p.woodLight);
    if (h > 9) R(g, x + 9, y + 6, 1, 2, p.wood);
    if (h > 12) R(g, x + 2, y + 9, 2, 1, p.cream);
    R(g, x + 1, b - 3, 10, 1, p.wood);                         // the bag darkens into its own base
    R(g, x + 1, b - 2, 10, 2, p.woodDark);
    R(g, x + 3, b - 2, 6, 1, p.wood);
  }

  function parcelSealed(R, g, x, y, p) {
    parcelBody(R, g, x, y + 4, p, 12);
    R(g, x + 1, y, 11, 4, p.ink);                              // the top, rolled twice and pressed
    R(g, x + 2, y + 1, 9, 2, p.woodLight);
    R(g, x + 2, y + 2, 9, 1, p.woodHi);
    R(g, x + 3, y, 4, 1, p.creamShade);                        // the new fold catching the light
    R(g, x + 1, y + 3, 11, 1, p.woodDark);                     // the shadow the fold lays on the bag
  }

  function parcelOpen(R, g, x, y, p) {
    parcelBody(R, g, x, y + 5, p, 12);
    R(g, x + 1, y + 3, 11, 3, p.ink);                          // the roll undone: the mouth stands open
    R(g, x + 2, y + 4, 9, 2, p.wood);
    R(g, x + 2, y + 4, 9, 1, p.woodDark);                      // looking down into the bag
    R(g, x + 1, y + 2, 2, 2, p.ink);                           // the corners of the mouth, bent back
    R(g, x + 10, y + 2, 2, 2, p.ink);
    R(g, x + 2, y + 3, 1, 1, p.creamShade);
    R(g, x + 10, y + 3, 1, 1, p.woodHi);
    R(g, x + 2, y, 4, 5, p.ink);                               // the end of a loaf
    R(g, x + 3, y, 2, 4, p.gold);
    R(g, x + 3, y, 2, 1, p.creamShade);
    R(g, x + 4, y + 2, 1, 2, '#c08a45');
    R(g, x + 6, y + 1, 5, 4, p.ink);                           // leaves over the rim
    R(g, x + 7, y + 1, 3, 3, p.leaf);
    R(g, x + 7, y + 1, 2, 1, p.leafHi);
    R(g, x + 9, y + 2, 1, 2, p.green);
  }

  function parcelEmpty(R, g, x, y, p) {
    /* The same bag, emptied: the body is shorter because it has slumped, and
     * the top is crumpled open instead of rolled. Nothing here says how much
     * it held — what was in it is state, and state is not drawn. */
    parcelBody(R, g, x, y + 3, p, 8);
    R(g, x + 1, y + 1, 11, 3, p.ink);
    R(g, x + 2, y + 2, 9, 2, p.wood);
    R(g, x + 2, y + 2, 9, 1, p.woodDark);                      // looking down into an empty bag
    R(g, x + 2, y + 1, 3, 1, p.creamShade);                    // paper folded back, no longer level
    R(g, x + 7, y, 3, 2, p.ink);
    R(g, x + 8, y + 1, 2, 1, p.woodHi);
    R(g, x + 5, y + 1, 1, 1, p.woodLight);
  }

  /* ---- umbrella_worn ---------------------------------------------------
   * Bought once, mended never, still working. Closed it stands on its tip in
   * a corner with the crook up, which is where an umbrella actually waits. */

  /* Closed it stands on its tip with the crook up, which is how an umbrella
   * actually waits in a corner. The furl tapers to the ferrule: a straight
   * tube of fabric reads as a bottle. */
  var FURL = [5, 5, 5, 5, 5, 5, 5, 5, 4, 4, 3, 3, 2, 2];       // widths for rows 6..19, centred on x2

  function umbrellaClosed(R, g, x, y, p) {
    R(g, x, y, 4, 1, p.woodHi);                                // the arc over the top of the crook
    R(g, x + 1, y, 2, 1, p.woodLight);
    R(g, x, y + 1, 1, 2, p.wood);                              // its short leg, open at the bottom
    R(g, x + 3, y + 1, 1, 2, p.woodHi);                        // its long leg
    R(g, x + 2, y + 3, 2, 3, p.ink);                           // down into the shaft
    R(g, x + 3, y + 3, 1, 3, p.woodHi);
    for (var r = 0; r < FURL.length; r++) {
      var w = FURL[r], sx = 2 - (w >> 1), yy = y + 6 + r;
      /* Only the lit side carries an outline: at five pixels across, ink on
       * both edges leaves the furl reading as a black tube. */
      R(g, x + sx, yy, w, 1, p.redDark);
      R(g, x + sx, yy, 1, 1, p.ink);
      if (w > 2) R(g, x + sx + 1, yy, 1, 1, p.red);            // the fold catching the light
    }
    R(g, x + 3, y + 10, 1, 2, p.redLight);                     // the panel the sun has taken
    R(g, x + 1, y + 13, 2, 1, p.gold);                         // the strap, loose, never done up again
    R(g, x + 3, y + 14, 1, 1, p.gold);
    R(g, x + 2, y + 17, 1, 2, p.metal);                        // a rib out where the hem has frayed
    R(g, x + 1, y + 20, 2, 3, p.ink);                          // the ferrule
    R(g, x + 1, y + 20, 1, 2, p.metalHi);
    R(g, x + 1, y + 23, 1, 1, p.ink);
  }

  /* Open: ten rows of dome over six panels, the seams drawn on top of the
   * panel values and the rib ends dropping below the hem. The values keep a
   * narrow range on purpose — a canopy is one object, not six stripes. */
  function umbrellaOpen(R, g, x, y, p) {
    var DOME = [[9, 6], [7, 10], [5, 14], [4, 16], [3, 18], [2, 20], [1, 22], [1, 22], [0, 24], [0, 24]];
    var RIBS = [0, 4, 8, 12, 16, 20, 24];
    /* Two rows of values, not one: the crown of a dome is lighter than its
     * hem, and without that the six panels read as six stripes. */
    var HIGH = [p.redDark, p.red, p.redHi, p.redLight, p.red, p.redDark];
    var LOW = [p.redDark, p.redDark, p.red, p.redHi, p.redDark, p.redDark];
    R(g, x + 11, y, 2, 3, p.ink);                              // the finial
    R(g, x + 11, y, 1, 2, p.metalHi);
    for (var r = 0; r < DOME.length; r++) {
      var sx = DOME[r][0], w = DOME[r][1], yy = y + 2 + r, band = r >= 7 ? LOW : HIGH;
      R(g, x + sx, yy, w, 1, p.ink);
      for (var c = 1; c < w - 1; c++) {
        var col = sx + c, n = 0;
        while (n < band.length - 1 && col >= RIBS[n + 1]) n++;
        R(g, x + col, yy, 1, 1, band[n]);
      }
    }
    for (var k = 1; k < RIBS.length - 1; k++) {                // the rib ends, under the hem
      R(g, x + RIBS[k], y + 12, 1, k === 3 ? 3 : 2, p.ink);
    }
    R(g, x, y + 12, 1, 2, p.ink); R(g, x + 23, y + 12, 1, 2, p.ink);
    R(g, x + 9, y + 3, 5, 1, p.redHi);                         // the crown, lit
    R(g, x + 11, y + 11, 2, 6, p.ink);                         // the shaft, down through the dome
    R(g, x + 11, y + 11, 1, 6, p.metal);
    R(g, x + 8, y + 16, 5, 4, p.ink);                          // the crook, down on the floor
    R(g, x + 9, y + 17, 3, 1, p.woodHi);
    R(g, x + 9, y + 17, 2, 1, p.woodLight);
    R(g, x + 9, y + 18, 1, 2, p.woodHi);
    R(g, x + 10, y + 19, 2, 1, p.wood);
  }

  /* ---- bicycle_old -----------------------------------------------------
   * A town bicycle with a front basket, on its stand, seen from the side. It
   * has to read with nobody on it, so the diamond, the chain ring, the bars,
   * the mudguards and the basket are all drawn rather than implied. */

  /* Tube runs of the frame: [x, y, w, h], bottom bracket at 13,13. */
  var FRAME = [
    [6, 12, 5, 1], [11, 13, 2, 1],                             // chain stay
    [6, 10, 1, 2], [7, 8, 1, 2], [8, 6, 1, 2], [9, 5, 1, 2],  // seat stay
    [12, 11, 1, 3], [11, 9, 1, 3], [10, 7, 1, 3], [9, 5, 1, 3], // seat tube
    [13, 12, 1, 2], [14, 11, 1, 2], [15, 10, 1, 2], [16, 9, 1, 2],
    [17, 8, 1, 2], [18, 7, 1, 2], [19, 5, 1, 3],               // down tube
    [9, 4, 12, 1],                                            // top tube
    [20, 2, 1, 5],                                             // head tube
    [21, 6, 1, 2], [22, 8, 1, 2], [23, 10, 1, 2],              // fork
    [9, 2, 1, 3]                                              // seat post
  ];

  function bicycle(R, g, x, y, p, damaged) {
    var rear = x, front = x + 19, wy = y + 6;
    ring(R, g, rear, wy, WHEEL_OUT, WHEEL_IN, p.ink);
    rim(R, g, rear, wy, p, false);
    spokes(R, g, rear, wy, p, false);
    ring(R, g, front, wy, damaged ? BENT_OUT : WHEEL_OUT, damaged ? BENT_IN : WHEEL_IN, p.ink);
    rim(R, g, front, wy, p, damaged);
    spokes(R, g, front, wy, p, damaged);
    mudguard(R, g, rear, wy, p, p.metal);
    if (!damaged) mudguard(R, g, front, wy, p, p.metalHi);
    else R(g, front + 3, wy - 1, 4, 1, p.metal);               // the front guard, half torn away

    FRAME.forEach(function (t) { R(g, x + t[0], y + t[1], t[2], t[3], p.redDark); });
    R(g, x + 9, y + 4, 11, 1, p.red);                         // the top tube, lit along its length
    R(g, x + 9, y + 5, 1, 3, p.red);
    R(g, x + 20, y + 2, 1, 3, p.red);
    if (damaged) {
      R(g, x + 15, y + 10, 1, 2, p.gold);                      // rust coming through the enamel
      R(g, x + 10, y + 8, 1, 2, p.wood);
      R(g, x + 20, y + 4, 1, 2, p.wood);
    }

    R(g, x + 11, y + 12, 4, 3, p.ink);                         // chain ring and crank
    R(g, x + 12, y + 13, 2, 1, p.metalHi);
    if (damaged) {
      R(g, x + 7, y + 14, 5, 1, p.ink);                        // the chain, off the ring and slack
      R(g, x + 6, y + 13, 1, 1, p.ink);
    } else {
      R(g, x + 14, y + 14, 2, 1, p.metal);                     // the near pedal
      R(g, x + 7, y + 13, 5, 1, p.ink);                        // the chain on the ring
    }

    R(g, x + 6, y + 1, 7, 2, p.ink);                           // the sprung saddle, nose forward
    R(g, x + 7, y + 1, 5, 1, p.woodDark);
    R(g, x + 7, y + 1, 3, 1, p.woodHi);
    R(g, x + 12, y + 2, 1, 1, p.woodDark);
    R(g, x + 9, y + 3, 1, 1, p.ink);

    if (damaged) {                                             // the bars pulled round out of line
      R(g, x + 18, y + 1, 4, 2, p.ink);
      R(g, x + 19, y + 1, 2, 1, p.metal);
      R(g, x + 21, y + 2, 1, 2, p.ink);
    } else {
      R(g, x + 17, y + 1, 8, 2, p.ink);                        // swept-back town bars
      R(g, x + 18, y + 1, 6, 1, p.metalHi);
      R(g, x + 17, y + 2, 2, 1, p.woodDark);                   // the grips
      R(g, x + 23, y + 2, 2, 1, p.woodDark);
    }

    R(g, x + 22, y, 8, 7, p.ink);                              // the basket, hung off the bars
    R(g, x + 23, y + 1, 6, 5, damaged ? p.wood : p.woodHi);
    R(g, x + 23, y + 1, 6, 1, p.woodLight);
    R(g, x + 23, y + 3, 6, 1, p.woodDark);
    [24, 26, 28].forEach(function (wx) { R(g, x + wx, y + 1, 1, 5, p.woodDark); });
    if (damaged) { R(g, x + 26, y, 4, 2, p.ink); R(g, x + 27, y + 1, 2, 1, p.woodDark); }

    if (!damaged) {                                            // the stand it is parked on
      R(g, x + 9, y + 13, 1, 3, p.ink);
      R(g, x + 8, y + 16, 3, 1, p.ink);
    } else {
      R(g, x + 9, y + 13, 3, 1, p.ink);                       // the stand, folded, never put down
    }
  }

  /* ---- the table the renderer reads ------------------------------------ */

  EP.TYPES = {
    book_used: {
      typeId: 'book_used',
      states: ['closed', 'open'],
      frames: {
        closed: { w: 14, h: 7, pivot: [7, 7], shadow: [1, 7, 12] },
        open: { w: 19, h: 8, pivot: [9, 8], shadow: [1, 8, 17] }
      },
      footprint: { kind: 'surface', cells: [] },
      placement: 'Rests on a surface or is carried. On a table it goes after the table and before whoever is sitting at it.'
    },
    food_parcel: {
      typeId: 'food_parcel',
      states: ['sealed', 'open', 'empty'],
      frames: {
        sealed: { w: 13, h: 16, pivot: [6, 16], shadow: [1, 16, 11] },
        open: { w: 13, h: 17, pivot: [6, 17], shadow: [1, 17, 11] },
        empty: { w: 13, h: 11, pivot: [6, 11], shadow: [1, 11, 11] }
      },
      footprint: { kind: 'surface', cells: [] },
      placement: 'Rests on a counter, a table or the floor. All three states share the pivot and the same 13px width; `open` stands a row taller because a loaf sticks out of it and `empty` five rows shorter because the bag has slumped. Nothing moves sideways between states.'
    },
    umbrella_worn: {
      typeId: 'umbrella_worn',
      states: ['closed', 'open'],
      frames: {
        closed: { w: 5, h: 24, pivot: [2, 24], shadow: [0, 24, 5] },
        open: { w: 24, h: 20, pivot: [11, 20], shadow: [7, 20, 9] }
      },
      footprint: { kind: 'soft', cells: [[0, 0]] },
      placement: 'Stands against a wall or on a rack when closed, stands open on the floor to dry. Both pivots are the handle on the ground, so the handle does not jump between states. `open` is 13 columns wider to the left of the pivot than to the right of it: it leans over what is beside it and must be painted after it.'
    },
    bicycle_old: {
      typeId: 'bicycle_old',
      states: ['parked', 'damaged'],
      frames: {
        parked: { w: 30, h: 17, pivot: [14, 17], shadow: [0, 17, 30] },
        damaged: { w: 30, h: 17, pivot: [14, 17], shadow: [0, 17, 30] }
      },
      footprint: { kind: 'physical', cells: [[-1, 0], [0, 0], [1, 0]] },
      placement: 'Stands on the ground, both wheels on the same floor line, nobody on it. Its picture is about two tiles wide; the three solid cells are the ground it blocks, not the pixels it covers. Bars and basket lean a row above the tile above the footprint and may cross a wall: place it clear of one.'
    }
  };

  var PAINT = {
    book_used: { closed: bookClosed, open: bookOpen },
    food_parcel: { sealed: parcelSealed, open: parcelOpen, empty: parcelEmpty },
    umbrella_worn: { closed: umbrellaClosed, open: umbrellaOpen },
    bicycle_old: {
      parked: function (R, g, x, y, p) { bicycle(R, g, x, y, p, false); },
      damaged: function (R, g, x, y, p) { bicycle(R, g, x, y, p, true); }
    }
  };

  EP.ORDER = ['book_used', 'food_parcel', 'umbrella_worn', 'bicycle_old'];

  EP.frame = function (typeId, state) {
    var t = EP.TYPES[typeId];
    return (t && t.frames[state]) || null;
  };

  /* The one entry point. `opts.kit` and `opts.palette` default to the
   * production interior kit and Café Meridiana's material, because that is the
   * room these were drawn against; any other kit material works unchanged. */
  EP.draw = function (g, typeId, state, x, y, opts) {
    opts = opts || {};
    var kit = opts.kit || (root.GAME && root.GAME.Retro2D && root.GAME.Retro2D.interiorKit);
    if (!kit) throw new Error('everyday props draw with the production interior kit; it is not loaded');
    var p = opts.palette || kit.materials[opts.material || 'lt_cafe'];
    if (!p) throw new Error('unknown interior material: ' + (opts.material || 'lt_cafe'));
    var paint = PAINT[typeId] && PAINT[typeId][state];
    if (!paint) throw new Error('no such everyday prop state: ' + typeId + '/' + state);
    var f = EP.TYPES[typeId].frames[state];
    var ox = Math.round(x) - f.pivot[0], oy = Math.round(y) - f.pivot[1];
    if (opts.shadow !== false) kit.contactShadow(g, ox + f.shadow[0], oy + f.shadow[1], f.shadow[2], p);
    paint(kit.rect, g, ox, oy, p);
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = EP;
})();
