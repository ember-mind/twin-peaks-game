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
/* Seated, with an open book held across the chest in both hands. The book is
 * the silhouette change that separates this from `seated`: a bright outlined
 * rectangle with a spine down the middle, where the lap would be. */
function readingBody(body, frame) {
  const shoulders = body === 'skirt'
    ? ['...OsWTWTWsO...', '..OJJWWWWWJJO..']
    : ['...OsWWTWWsO...', '..OJJWWTWWJJO..'];
  const feet = body === 'skirt' ? '...OBBO.OBBO...' : '...ObBO.ObBO...';
  const pages = frame === 0
    ? ['.OSONNNnNNNOSO.', '.OsONNNnNNNOsO.', '..OONNNnNNNOO..']
    : ['.OSONNNnNnNOSO.', '.OsONNNnONNOsO.', '..OONNNnONNOO..'];
  return shoulders.concat(['.OJOOOOOOOOOJO.'], pages, ['..OOOOOOOOOOO..', feet]);
}

/* ---- work_counter ------------------------------------------------------ */
/* Full standing height — a worker is not a shorter person — with a small rag
 * held at chest level in one hand and swept across the body, left, centre,
 * right. Deliberately narrow: a wide pale rectangle at that height is the
 * open book, and the two poses must not be confused. */
function workCounterBody(body, frame) {
  const rows = body === 'skirt' ? [
    '...OsWTWTWsO...', '..OJJWWWWWJJO..', '.OJjJWwWwWJjJO.', '.OJjJWWWWWJjJO.',
    '.OSJJwWwWwJJSO.', '.OsOPPPpPPPOsO.', '..OPPpPPPpPPO..', '..OPPPPPPPPPO..',
    '..OPPPPPPPPPO..', '...OOSSOSSOO...', '....OBBOBBO....', '....ObBObBO....'
  ] : [
    '...OsWWTWWsO...', '..OJJWWTWWJJO..', '.OJjJJWTWJJjJO.', '.OJjJJWTWJJjJO.',
    '.OJjJJwTwJJjJO.', '.OSJJJwWwJJJSO.', '.OsOJJwwwJJOsO.', '..OOPPpPpPPOO..',
    '...OPPpOpPPO...', '...OPPPOPPPO...', '...ObBOObBO....', '...OBBO.OBBO...'
  ];
  const at = [3, 5, 7][frame];
  const out = rows.slice();
  out[2] = splice(out[2], at, 'OOOOO');
  out[3] = splice(out[3], at, 'ONNnO');
  out[4] = splice(out[4], at, 'OSNnO');
  return out;
}

/* ---- unpacking --------------------------------------------------------- */
/* Bent at the waist over something at waist height. Drawn with the BACK of
 * the head (the `up` head matrix) on a down-facing body: from the front, a
 * person bent forward shows you their crown, not their face. Six body rows
 * under a 12-row head; the arms leave the silhouette on both sides and drop
 * one row between the two frames. */
const UNPACKING = {
  jacket: [
    ['.OJjJJJJJJJJJJJjJO.', 'OSSOJjJJJJJJJjJOSSO', 'OSSOJJJJJJJJJJJOSSO',
     'OssO.OPPpPpPPO.OssO', '.....OPPpPpPPO.....', '.....OPPPOPPPO.....',
     '.....ObBOObBO......', '.....OBBO.OBBO.....'],
    ['.OJjJJJJJJJJJJJjJO.', '...OJjJJJJJJJjJO...', 'OSSOJJJJJJJJJJJOSSO',
     'OSSO.OPPpPpPPO.OSSO', 'OssO.OPPpPpPPO.OssO', '.....OPPPOPPPO.....',
     '.....ObBOObBO......', '.....OBBO.OBBO.....']
  ],
  skirt: [
    ['.OJjJJJJJJJJJJJjJO.', 'OSSOJjJJJJJJJjJOSSO', 'OSSOJJJJJJJJJJJOSSO',
     'OssO.OPPPpPPPO.OssO', '.....OPPPpPPPO.....', '.....OPPPPPPPO.....',
     '.....OOSSOSSOO.....', '......OBBOBBO......'],
    ['.OJjJJJJJJJJJJJjJO.', '...OJjJJJJJJJjJO...', 'OSSOJJJJJJJJJJJOSSO',
     'OSSO.OPPPpPPPO.OSSO', 'OssO.OPPPpPPPO.OssO', '.....OPPPPPPPO.....',
     '.....OOSSOSSOO.....', '......OBBOBBO......']
  ]
};

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
/* Standing, one forearm lifted clear of the silhouette: beside the ear in the
 * first frame, at the chest in the second. The hand breaking the body's own
 * outline is what makes a still frame read as speech rather than as standing. */
function talkingDown(body, frame) {
  const rows = body === 'skirt' ? [
    '.....OsWTWTWsO.....', '....OJJWWWWWJJO....', '...OJjJWwWwWJjJO...',
    '...OJjJWWWWWJjJO...', '...OSJJwWwWwJJSO...', '...OsOPPPpPPPOsO...',
    '....OPPpPPPpPPO....', '....OPPPPPPPPPO....', '....OPPPPPPPPPO....',
    '.....OOSSOSSOO.....', '......OBBOBBO......', '......ObBObBO......'
  ] : [
    '.....OsWWTWWsO.....', '....OJJWWTWWJJO....', '...OJjJJWTWJJjJO...',
    '...OJjJJWTWJJjJO...', '...OJjJJwTwJJjJO...', '...OSJJJwWwJJJSO...',
    '...OsOJJwwwJJOsO...', '....OOPPpPpPPOO....', '.....OPPpOpPPO.....',
    '.....OPPPOPPPO.....', '.....ObBOObBO......', '.....OBBO.OBBO.....'
  ];
  const out = rows.slice();
  /* The lifted arm replaces the resting one: hand, sleeve, and the shoulder
   * the arm now hangs from. */
  const rest = body === 'skirt' ? 4 : 5;
  out[rest] = rows[rest].replace('S', 'J');
  if (frame === 0) {
    out[0] = splice(out[0], 0, 'OSSO');
    out[1] = splice(out[1], 0, 'OSSO');
    out[2] = splice(out[2], 0, '.OO');
  } else {
    out[3] = splice(out[3], 0, 'OSS');
    out[4] = splice(out[4], 0, 'OSS');
    out[5] = splice(out[5], 0, '.OO');
  }
  return out;
}

function talkingRight(body, frame) {
  const rows = body === 'skirt' ? [
    '.....OJJWTOO.....', '....OJJjWWTJO....', '....OKJjWwTJO....',
    '....OKJjWwSJO....', '....OKKjJJsOO....', '....OPPPpPPPO....',
    '....OPPPpPPPO....', '....OPPPPPPPO....', '.....OOSSSOO.....',
    '......OBBBO......', '......ObBBO......'
  ] : [
    '.....OJJWTOO.....', '....OJJjJWTJO....', '....OKJjJWTJO....',
    '....OKJjJwTJO....', '....OKJjJwSJO....', '....OKKjJJsOO....',
    '.....OPPpPPO.....', '.....OPPpPPO.....', '.....OPPPPPO.....',
    '.....ObBBBBO.....', '.....OBBBBBO.....'
  ];
  const out = rows.slice();
  const hand = body === 'skirt' ? 3 : 4;   /* the row the resting hand is on */
  const top = frame === 0 ? hand - 1 : hand;
  out[hand] = out[hand].replace('S', body === 'skirt' ? 'w' : 'J');
  out[top] = splice(out[top], 13, 'OSO');
  out[top + 1] = splice(out[top + 1], 13, 'OsO');
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
      return { head: 'down', overlayDir: 'down', pad: 0, blankTop: 0,
        body: { jacket: workCounterBody('jacket', frame), skirt: workCounterBody('skirt', frame) } };
    case 'unpacking/down':
      return { head: 'up', overlayDir: 'up', pad: 2, blankTop: 0, headRows: 8,
        body: { jacket: UNPACKING.jacket[frame], skirt: UNPACKING.skirt[frame] } };
    case 'sleeping/right':
      return { head: null, overlayDir: 'right', pad: 0, blankTop: 0,
        body: { jacket: SLEEPING, skirt: SLEEPING } };
    case 'talking/down':
      return { head: 'down', overlayDir: 'down', pad: 2, blankTop: 0,
        body: { jacket: talkingDown('jacket', frame), skirt: talkingDown('skirt', frame) } };
    case 'talking/right':
      return { head: 'right', overlayDir: 'right', pad: 2, blankTop: 0,
        body: { jacket: talkingRight('jacket', frame), skirt: talkingRight('skirt', frame) } };
    default: return null;
  }
}

module.exports = { PAPER, APRON, art };
