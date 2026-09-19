'use strict';
/* pose-frames.js — the authored pose matrices, in the house paper-doll language.
 *
 * Same alphabet as tools/cast-authored-frames.js: letters are semantic palette
 * SLOTS, not colours, '.' is transparent, and a frame is a head matrix stacked
 * on a body matrix, bottom-aligned inside the 24px actor cell. That is what
 * keeps a seated person the same person as the standing one: identical slots,
 * identical outline weight, the look's own palette.
 *
 * Only the two generic part libraries are borrowed (HEADS, OVERLAYS). The
 * CHARACTERS table — the Twin Peaks cast — is never read here, and no name
 * from it appears in this package.
 *
 * Slots used: O outline, H/h hair, S/s skin, E eye, W/w shirt|top, T accent,
 * J/j/K jacket|dress, P/p pants|skirt, B/b shoes, and two of this package's
 * own: N/n paper (the open book, the counter slab a worker is wiping).
 *
 * Three geometry levers, and nothing else:
 *   rows        — fewer than 24 rows sit LOWER in the cell (bottom-aligned).
 *                 That is the whole trick behind "seated" and "bent over",
 *                 and it keeps every pose's feet on the standing ground line.
 *   pad         — n transparent columns on both sides of the HEAD rows, so a
 *                 body authored wider than 15 still carries a head. The cell
 *                 centres odd widths the same way, so padding by whole columns
 *                 on both sides leaves the figure exactly where it stood while
 *                 giving an arm room to leave the silhouette.
 *   blankTop    — n blank rows above the head, with a shorter body under it:
 *                 the head drops, the feet do not. "Leaning over the counter".
 *   headRows    — keep only the first n rows of the head matrix. A head tipped
 *                 forward shows its crown and little else.
 */

/* Paper: the open book and the wiped slab. Cool white over a grey shade, so
 * the object never disappears into a cream shirt the way a warm white would. */
const PAPER = { N: '#F2EFE4', n: '#93A0A2' };

const splice = (row, at, text) => row.slice(0, at) + text + row.slice(at + text.length);

/* Four transparent columns on each side, so an arm or a rag can leave the
 * body's own outline. Padding by whole columns on both sides leaves the
 * figure exactly where it stood. */
const pad4 = (rows) => rows.map((row) => '....' + row + '....');

/* Hang a limb off the side of a pad4 body. The body's own outline column is
 * REPLACED by the body's own material, so the limb joins the silhouette
 * instead of standing beside it: an outlined block with an outlined body next
 * to it is two objects, and a viewer reads the second one as a floating
 * rectangle rather than as an arm. */
function hangLeft(row, skin) {
  return '..O' + skin + skin + row[6] + row.slice(6);
}
function hangRight(row, skin) {
  return row.slice(0, 17) + row[16] + skin + skin + 'O..';
}

/* Author a wide matrix by shape rather than by counting: spaces are
 * transparent and short rows are filled out to the widest one. */
function rect(rows) {
  const w = rows.reduce((n, r) => Math.max(n, r.length), 0);
  return rows.map((r) => (r + ' '.repeat(w - r.length)).replace(/ /g, '.'));
}

/* ---- seated ----------------------------------------------------------- */
/* Eight body rows under a 12-row head: four rows shorter than standing. The
 * read is the proportion swap — a NARROWER chest over a WIDER lap, thighs
 * pointing at the viewer, and only the toes below them. */
const SEATED_DOWN = {
  jacket: [
    '....OsWTWsO....',
    '...OJJWTWJJO...',
    '..OJjJWTWJjJO..',
    '..OJjJwTwJjJO..',
    '.OSPPPPPPPPPSO.',
    '.OsPPpPPPPPpsO.',
    '..OPPPPPPPPPO..',
    '...ObBO.ObBO...'
  ],
  skirt: [
    '....OsWTWsO....',
    '...OJJWWWJJO...',
    '..OJjJWwWJjJO..',
    '..OJjJWWWJjJO..',
    '.OSPPPPPPPPPSO.',
    '.OsPPpPPPPPpsO.',
    '..OPPPPPPPPPO..',
    '...OBBO.OBBO...'
  ]
};

/* In profile the same swap reads as thighs running forward off the seat, a
 * shin dropping at their end, and one shoe on the floor. */
const SEATED_RIGHT = {
  jacket: [
    '...OJJWTOO...',
    '..OJJjJWTJO..',
    '..OKJjJWTJO..',
    '..OKJjJwSJO..',
    '..OKKJPPPPPO.',
    '..OPPPPPPPPO.',
    '...OOOOOOPPO.',
    '.......OOBBO.'
  ],
  skirt: [
    '...OJJWTOO...',
    '..OJJjWWTJO..',
    '..OKJjWWTJO..',
    '..OKJjWwSJO..',
    '..OKKJPPPPPO.',
    '..OPPPPPPPPO.',
    '...OOOOOOSSO.',
    '.......OOBBO.'
  ]
};

/* ---- reading ----------------------------------------------------------- */
/* STANDING, with an open book held across the chest in both hands: an
 * outlined page block with a spine down the middle and a fold at the bottom.
 * Standing on purpose — a shorter figure holding a rectangle asks the viewer
 * to work out why it is shorter before it asks them to read the rectangle. */
function readingBody(body, frame) {
  const top = body === 'skirt'
    ? ['...OsWTWTWsO...', '..OJJWWWWWJJO..', '.OJjJWwWwWJjJO.']
    : ['...OsWWTWWsO...', '..OJJWWTWWJJO..', '.OJjJJWTWJJjJO.'];
  const legs = body === 'skirt'
    ? ['..OPPPPPPPPPO..', '..OPPPPPPPPPO..', '...OOSSOSSOO...', '....OBBOBBO....']
    : ['...OPPpOpPPO...', '...OPPPOPPPO...', '...ObBOObBO....', '...OBBO.OBBO...'];
  const pages = frame === 0
    ? ['.OSONNNnNNNOSO.', '.OsONNNnNNNOsO.', '..OONNNnNNNOO..']
    : ['.OSONNnOnNNOSO.', '.OsONNnOnNNOsO.', '..OONNnOnNNOO..'];
  return top.concat(['.OJOOOOOOOOOJO.'], pages, ['..OOOOOOOOOOO..'], legs);
}

/* ---- work_counter ------------------------------------------------------ */
/* Full standing height — a worker is not a shorter person — with a rag
 * hanging from one hand OUTSIDE the body's own outline, swinging up and down
 * across three frames. The silhouette has to change, or the gesture is only
 * a rectangle painted on a chest. */
function workCounterBody(body, frame) {
  const rows = pad4(body === 'skirt' ? [
    '...OsWTWTWsO...', '..OJJWWWWWJJO..', '.OJjJWwWwWJjJO.', '.OJjJWWWWWJjJO.',
    '.OSJJwWwWwJJSO.', '.OsOPPPpPPPOsO.', '..OPPpPPPpPPO..', '..OPPPPPPPPPO..',
    '..OPPPPPPPPPO..', '...OOSSOSSOO...', '....OBBOBBO....', '....ObBObBO....'
  ] : [
    '...OsWWTWWsO...', '..OJJWWTWWJJO..', '.OJjJJWTWJJjJO.', '.OJjJJWTWJJjJO.',
    '.OJjJJwTwJJjJO.', '.OSJJJwWwJJJSO.', '.OsOJJwwwJJOsO.', '..OOPPpPpPPOO..',
    '...OPPpOpPPO...', '...OPPPOPPPO...', '...ObBOObBO....', '...OBBO.OBBO...'
  ]);
  const top = [4, 5, 3][frame];
  const out = rows.slice();
  /* The rag hangs from the hand, touching the body's own outline column: one
   * transparent column between them and it reads as a floating rectangle. */
  ['N', 'n', 'N', 'n'].forEach((cloth, i) => { out[top + i] = hangLeft(out[top + i], cloth); });
  out[top + 4] = splice(out[top + 4], 3, 'OO');
  return out;
}

/* ---- unpacking --------------------------------------------------------- */
/* Stooped over something at waist height: four rows shorter than standing,
 * shoulders rolled forward, and both arms hanging clear of the body with a
 * transparent column between arm and torso, dropping one row between frames.
 * The face stays visible — a figure whose head has swallowed its torso reads
 * as a broken sprite, not as a bent back. */
function unpackingBody(body) {
  /* Rows 1-5 are all full-width torso rows on purpose: an arm may only hang
   * off a row whose next column is the body's own cloth, or the join shows,
   * and an arm needs five rows before it reads as hanging rather than as a
   * stub stuck on the side. */
  const rows = pad4(body === 'skirt' ? [
    '...OsWTWTWsO...', '.OJjJWwWwWJjJO.', '.OJjJWWWWWJjJO.', '.OJjJWwWwWJjJO.',
    '.OJJJwWwWwJJJO.', '.OJJPPPpPPPJJO.', '...OOSSOSSOO...', '....OBBOBBO....'
  ] : [
    '...OsWWTWWsO...', '.OJjJJWTWJJjJO.', '.OJjJJWTWJJjJO.', '.OJjJJwTwJJjJO.',
    '.OJJJJwWwJJJJO.', '.OJJPPpPpPPJJO.', '...OPPPOPPPO...', '...ObBOObBO....'
  ]);
  const out = rows.slice();
  ['S', 'S', 'S', 'S', 's'].forEach((skin, i) => {
    out[1 + i] = hangRight(hangLeft(out[1 + i], skin), skin);
  });
  return out;
}

/* ---- sleeping ---------------------------------------------------------- */
/* One authored matrix, no head stack: a body lying on its side, head on a
 * pale pillow (the shirt slots), the rest under a blanket in the wearer's own
 * dress colour. Hair colour and blanket colour identify the sleeper; the hair
 * STYLE is lost, which is the honest cost of lying down at 24px. */
const SLEEPING = rect([
  '      OOOOO',
  '    OOHHHHHO',
  '  OOWHHHHHHHO     OOOO',
  ' OWWWHHHHHHHHO  OOjjjjO',
  ' OWWWWHHHHSSSOOOjJJJJJJO',
  'OWWWWWHHHSssSOjJJJJJJJJO',
  'OWWWWWHHHSSSSOJJJJJJJJJO',
  ' OWWWWWHHSSSOOJJJKJJJJJO',
  '  OWWWWWOOOOOJJJJJJJJJJO',
  '   OOWWWWO  OKKKKKKKKKO',
  '     OOOOO  OOOOOOOOOO'
]);

/* ---- talking ----------------------------------------------------------- */
/* Standing, one forearm lifted clear of the silhouette — beside the ear in
 * the first frame, at the chest in the second. Two pixels of skin with their
 * own outline, outside the body's edge: at this scale a one-pixel hand is a
 * speck, and a speck is not a gesture. */
function talkingDown(body, frame) {
  const rows = pad4(body === 'skirt' ? [
    '...OsWTWTWsO...', '.OJjJWwWwWJjJO.', '.OJjJWwWwWJjJO.', '.OJjJWWWWWJjJO.',
    '.OSJJwWwWwJJSO.', '.OJJPPPpPPPJJO.', '..OPPpPPPpPPO..', '..OPPPPPPPPPO..',
    '..OPPPPPPPPPO..', '...OOSSOSSOO...', '....OBBOBBO....', '....ObBObBO....'
  ] : [
    '...OsWWTWWsO...', '.OJjJJWTWJJjJO.', '.OJjJJWTWJJjJO.', '.OJjJJWTWJJjJO.',
    '.OJjJJwTwJJjJO.', '.OSJJJwWwJJJSO.', '.OsOJJwwwJJOsO.', '..OOPPpPpPPOO..',
    '...OPPpOpPPO...', '...OPPPOPPPO...', '...ObBOObBO....', '...OBBO.OBBO...'
  ]);
  const out = rows.slice();
  const rest = body === 'skirt' ? 4 : 5;          /* the row the resting hand is on */
  out[rest] = out[rest].replace('S', 'J');
  const top = frame === 0 ? 1 : 2;
  ['S', 'S', 'S', 's'].forEach((skin, i) => { out[top + i] = hangLeft(out[top + i], skin); });
  return out;
}

function talkingRight(body, frame) {
  const rows = pad4(body === 'skirt' ? [
    '...OJJWTOO...', '..OJJjWWTJO..', '..OKJjWwTJO..', '..OKJjWwSJO..',
    '..OKKjJJsOO..', '..OPPPpPPPO..', '..OPPPpPPPO..', '..OPPPPPPPO..',
    '...OOSSSOO...', '....OBBBO....', '....ObBBO....'
  ] : [
    '...OJJWTOO...', '..OJJjJWTJO..', '..OKJjJWTJO..', '..OKJjJwTJO..',
    '..OKJjJwSJO..', '..OKKjJJsOO..', '...OPPpPPO...', '...OPPpPPO...',
    '...OPPPPPO...', '...ObBBBBO...', '...OBBBBBO...'
  ]);
  const out = rows.slice();
  const hand = body === 'skirt' ? 3 : 4;
  out[hand] = out[hand].replace('S', 'J');
  const top = frame === 0 ? hand - 2 : hand;
  out[top] = splice(out[top], 15, 'OSSO');
  out[top + 1] = splice(out[top + 1], 15, 'OssO');
  return out;
}

/* Pose-local apron ops, in FINAL matrix coordinates, wherever the standing
 * apron (authored for rows 17-20 of a standing figure) would land on shins or
 * on an open book. `[]` means the pose shows no apron at all — a bent back and
 * a blanket both hide one, and the `_work` cell is then the plain cell. */
function lap(rows, from, to) {
  const ops = [];
  rows.forEach((row, i) => {
    for (let col = from; col <= to; col++) ops.push([row, col, (col + i) % 2 ? 'w' : 'W']);
  });
  return ops;
}

const APRON = {
  'seated/down': lap([16, 17], 4, 10),
  'seated/right': lap([17, 18], 4, 8),
  'reading/down': [],
  'unpacking/down': [],
  'sleeping/right': []
};

/* The art of one cell: the head matrix it stacks on (null = the matrix stands
 * alone), the direction its head was drawn in (overlays follow that), the body
 * rows per body type, and the two geometry levers. */
function art(poseId, dir, frame) {
  switch (poseId + '/' + dir) {
    case 'seated/down':
      return { head: 'down', overlayDir: 'down', pad: 0, blankTop: 0, body: SEATED_DOWN };
    case 'seated/right':
      return { head: 'right', overlayDir: 'right', pad: 0, blankTop: 0, body: SEATED_RIGHT };
    case 'reading/down':
      return { head: 'down', overlayDir: 'down', pad: 0, blankTop: 0,
        body: { jacket: readingBody('jacket', frame), skirt: readingBody('skirt', frame) } };
    case 'work_counter/down':
      return { head: 'down', overlayDir: 'down', pad: 4, blankTop: 0,
        body: { jacket: workCounterBody('jacket', frame), skirt: workCounterBody('skirt', frame) } };
    case 'unpacking/down':
      return { head: 'down', overlayDir: 'down', pad: 4, blankTop: 0,
        body: { jacket: unpackingBody('jacket'), skirt: unpackingBody('skirt') } };
    case 'sleeping/right':
      return { head: null, overlayDir: 'right', pad: 0, blankTop: 0,
        body: { jacket: SLEEPING, skirt: SLEEPING } };
    case 'talking/down':
      return { head: 'down', overlayDir: 'down', pad: 4, blankTop: 0,
        body: { jacket: talkingDown('jacket', frame), skirt: talkingDown('skirt', frame) } };
    case 'talking/right':
      return { head: 'right', overlayDir: 'right', pad: 4, blankTop: 0,
        body: { jacket: talkingRight('jacket', frame), skirt: talkingRight('skirt', frame) } };
    default: return null;
  }
}

module.exports = { PAPER, APRON, art };
