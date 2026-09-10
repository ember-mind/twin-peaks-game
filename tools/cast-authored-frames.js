'use strict';

/**
 * Hand-authored 24 px overworld cast (R128, 2026-09-07).
 *
 * Every character = HEAD style (rows 0-11) + BODY variant (rows 12-23),
 * per direction (down 15 wide, up 15 wide, right 13 wide; left mirrored at
 * runtime), 3 phases (idle, stepA, stepB), plus optional overlays and a
 * per-character palette. Letters are semantic slots, colors come from the
 * character palette. '.' = transparent.
 *
 * Slots: O outline, H/h hair, S/s skin, E eye, W/w shirt|top, T accent (tie,
 * badge, apron strap), J/j/K jacket|dress, P/p pants|skirt, B/b shoes,
 * A/a hat, G glasses, L/l log.
 *
 * Design references: assets/sprites/cooper-redesign-reference-2026-09-07.png,
 * assets/sprites/cast-redesign-guide-2026-09-07.png.
 */

const FACE_DOWN = [
  'OHSSSSSSSSSSHHO',
  'OHSESSSSSESSHHO',
  'OHSESSSSSESSHHO',
  '.OSSSsSSSsSSSO.',
  '..OSSSSSSSSSO..'
];

const HEADS = {
  short: {
    down: [
      '....OOOOOO.O...',
      '..OOHHHHHHOHOO.',
      '.OHHhHHHHHHHHO.',
      '.OHHHHhHHHHHHO.',
      'OHHHHHHHHHHHHHO',
      'OHHhHHHHHHHhHHO',
      'OHHSSHSSSHSSHHO',
      ...FACE_DOWN
    ],
    up: [
      '....OOOOOO.O...',
      '..OOHHHHHHOHOO.',
      '.OHHhHHhHHHHHO.',
      '.OHHHHHHHHhHHO.',
      'OHHhHHHHHHHHHHO',
      'OHHHHHHhHHHHHHO',
      'OHHHHHHHHHhHHHO',
      'OHHhHHHHHHHHHHO',
      'OHHHHHHHHHHHHHO',
      'OHHHHHhHHHHHHHO',
      '.OHHHHHHHHHHHO.',
      '..OHHHHHHHHHO..'
    ],
    right: [
      '....OOOOOO.O.',
      '..OOHHHHHHOHO',
      '.OHHhHHHHHHHO',
      '.OHHHHHhHHHHO',
      'OHHhHHHHHHHHO',
      'OHHHHHHHHHHHO',
      'OHHHHHHHHSSO.',
      'OHHHHHHSSSSSO',
      'OHHHHHHSSESSO',
      '.OHHHHHSSESSO',
      '.OHHHHHsSSSSO',
      '..OHHHHsSSSO.',
      '...OOOsSSsO..'
    ]
  },
  neat: {
    down: [
      '.....OOOOO.....',
      '...OOHHHHHOO...',
      '..OHHhHHHHHHO..',
      '.OHHHHHHHHHHHO.',
      '.OHHHhHHHHHHHO.',
      'OHHHHHHHHHHHHHO',
      'OHSSHHSSSSSSSHO',
      'OSSSSSSSSSSSSSO',
      'OSSESSSSSESSSSO',
      'OSSESSSSSESSSSO',
      '.OSSSsSSSsSSSO.',
      '..OSSSSSSSSSO..'
    ],
    up: [
      '.....OOOOO.....',
      '...OOHHHHHOO...',
      '..OHHhHHHHHHO..',
      '.OHHHHHHHHHHHO.',
      '.OHHHhHHHHHHHO.',
      'OHHHHHHHHHHHHHO',
      'OHHHHHHhHHHHHHO',
      'OHHHHHHHHHHHHHO',
      '.OHHHHHHHHHHHO.',
      '.OHHHHHHHHHHHO.',
      '.OsHHHHHHHHHsO.',
      '..OsSSSSSSSsO..'
    ],
    right: [
      '.....OOOOO...',
      '...OOHHHHHOO.',
      '..OHHhHHHHHHO',
      '.OHHHHHHHHHHO',
      '.OHHHhHHHHHHO',
      'OHHHHHHHHHHHO',
      'OHHHHHHHSSSO.',
      'OHHHHHSSSSSSO',
      'OHHHHHSSSESSO',
      '.OHHHHSSSESSO',
      '.OsHHHsSSSSSO',
      '..OsHHsSSSSO.',
      '...OOsSSSsO..'
    ]
  },
  bob: {
    down: [
      '....OOOOOOO....',
      '..OOHHHHHHHOO..',
      '.OHHhHHHHHHHHO.',
      '.OHHHHHHHHHHHO.',
      'OHHHHHHHHHHHHHO',
      'OHHHHHHHHHHHHHO',
      'OHHHSSSSSSSHHHO',
      'OHHSSSSSSSSSHHO',
      'OHHSESSSSSESHHO',
      'OHHSESSSSSESHHO',
      'OHHSSsSSSsSSHHO',
      '.OOOSSSSSSSOOO.'
    ],
    up: [
      '....OOOOOOO....',
      '..OOHHHHHHHOO..',
      '.OHHhHHHHHHHHO.',
      '.OHHHHHHHHHHHO.',
      'OHHHHHHHHHHHHHO',
      'OHHHHHhHHHHHHHO',
      'OHHHHHHHHHHHHHO',
      'OHHHHHHHHHhHHHO',
      'OHHhHHHHHHHHHHO',
      'OHHHHHHHHHHHHHO',
      'OHHHHHHHHHHHHHO',
      '.OOOOOOOOOOOOO.'
    ],
    right: [
      '....OOOOOOO..',
      '..OOHHHHHHHOO',
      '.OHHhHHHHHHHO',
      '.OHHHHHHHHHHO',
      'OHHHHHHHHHHHO',
      'OHHHHHHHHHHHO',
      'OHHHHHHHSSSO.',
      'OHHHHHHSSSSSO',
      'OHHHHHHSSESSO',
      'OHHHHHHSSESSO',
      'OHHHHHHsSSSSO',
      '.OHHHHHsSSSO.',
      '.OOOOOOsSSsO.'
    ]
  },
  long: {
    down: [
      '....OOOOOOO....',
      '..OOHHHHHHHOO..',
      '.OHHhHHHHHHHHO.',
      '.OHHHHHHHHHHHO.',
      'OHHHHHHHHHHHHHO',
      'OHHHHHHHHHHHHHO',
      'OHHHSSSSSSSHHHO',
      'OHHSSSSSSSSSHHO',
      'OHHSESSSSSESHHO',
      'OHHSESSSSSESHHO',
      'OHHSSsSSSsSSHHO',
      'OHHOSSSSSSSOHHO'
    ],
    up: [
      '....OOOOOOO....',
      '..OOHHHHHHHOO..',
      '.OHHhHHHHHHHHO.',
      '.OHHHHHHHHHHHO.',
      'OHHHHHHHHHHHHHO',
      'OHHHHHhHHHHHHHO',
      'OHHHHHHHHHHHHHO',
      'OHHHHHHHHHhHHHO',
      'OHHhHHHHHHHHHHO',
      'OHHHHHHHHHHHHHO',
      'OHHHHHHHHHHHHHO',
      'OHHHHHHHHHHHHHO'
    ],
    right: [
      '....OOOOOOO..',
      '..OOHHHHHHHOO',
      '.OHHhHHHHHHHO',
      '.OHHHHHHHHHHO',
      'OHHHHHHHHHHHO',
      'OHHHHHHHHHHHO',
      'OHHHHHHHSSSO.',
      'OHHHHHHSSSSSO',
      'OHHHHHHSSESSO',
      'OHHHHHHSSESSO',
      'OHHHHHHsSSSSO',
      'OHHHHHHsSSSO.',
      'OHHHHHOsSSsO.'
    ]
  },
  bun: {
    down: [
      '.....OOOO......',
      '....OHHhHO.....',
      '..OOHHHHHHOO...',
      '.OHHHHHHHHHHO..',
      '.OHHHhHHHHHHHO.',
      'OHHHHHHHHHHHHHO',
      'OHHSSSSSSSSSHHO',
      'OHSSSSSSSSSSSHO',
      'OHSESSSSSESSSHO',
      'OHSESSSSSESSSHO',
      '.OSSSsSSSsSSSO.',
      '..OSSSSSSSSSO..'
    ],
    up: [
      '.....OOOO......',
      '....OHHhHO.....',
      '..OOHHHHHHOO...',
      '.OHHHHHHHHHHO..',
      '.OHHHhHHHHHHHO.',
      'OHHHHHHHHHHHHHO',
      'OHHHHHHhHHHHHHO',
      'OHHHHHHHHHHHHHO',
      '.OHHHHHHHHHHHO.',
      '.OHHHHHHHHHHHO.',
      '.OsHHHHHHHHHsO.',
      '..OsSSSSSSSsO..'
    ],
    right: [
      '..OOOO.......',
      '.OHHhHOOOO...',
      '.OHHHHHHHHOO.',
      '.OHHHHHHHHHHO',
      'OHHHHhHHHHHHO',
      'OHHHHHHHHHHHO',
      'OHHHHHHHSSSO.',
      'OHHHHHSSSSSSO',
      'OHHHHHSSSESSO',
      '.OHHHHSSSESSO',
      '.OsHHHsSSSSSO',
      '..OsHHsSSSSO.',
      '...OOsSSSsO..'
    ]
  },
  // R129 — cuffia da infermiera: calotta piatta e stretta appoggiata sopra i
  // capelli raccolti. Silhouette distinta da bun/hat: la corona e' bianca e
  // piu' larga del nodo dello chignon, ma non deborda oltre la testa.
  cap: {
    down: [
      '....OAAAAAO....',
      '...OAAaAAAAO...',
      '..OOAAAAAAAOO..',
      '.OHHHHHHHHHHHO.',
      '.OHHHhHHHHHHHO.',
      'OHHHHHHHHHHHHHO',
      'OHHSSSSSSSSSHHO',
      'OHSSSSSSSSSSSHO',
      'OHSESSSSSESSSHO',
      'OHSESSSSSESSSHO',
      '.OSSSsSSSsSSSO.',
      '..OSSSSSSSSSO..'
    ],
    up: [
      '....OAAAAAO....',
      '...OAAaAAAAO...',
      '..OOAAAAAAAOO..',
      '.OHHHHHHHHHHHO.',
      '.OHHHhHHHHHHHO.',
      'OHHHHHHHHHHHHHO',
      'OHHHHHHhHHHHHHO',
      'OHHHHHHHHHHHHHO',
      '.OHHHhhhhhHHHO.',
      '.OHHHhhhhhHHHO.',
      '.OsHHHHHHHHHsO.',
      '..OsSSSSSSSsO..'
    ],
    right: [
      '...OAAAAO....',
      '..OAAaAAAO...',
      '.OOAAAAAAOO..',
      '.OHHHHHHHHHHO',
      'OHHHHhHHHHHHO',
      'OHhHHHHHHHHHO',
      'OHhHHHHHSSSO.',
      'OHHHHHSSSSSSO',
      'OHHHHHSSSESSO',
      '.OHHHHSSSESSO',
      '.OsHHHsSSSSSO',
      '..OsHHsSSSSO.',
      '...OOsSSSsO..'
    ]
  },
  hat: {
    down: [
      '.....OOOOO.....',
      '....OAAaAAO....',
      '....OAAAAAO....',
      '.OOOOAAAAAOOOO.',
      'OAAAAAAAAAAAAAO',
      '.OOOOOOOOOOOOO.',
      '.OHSSSSSSSSSHO.',
      'OHSSSSSSSSSSSHO',
      'OHSESSSSSESSSHO',
      'OHSESSSSSESSSHO',
      '.OSSSsSSSsSSSO.',
      '..OSSSSSSSSSO..'
    ],
    up: [
      '.....OOOOO.....',
      '....OAAaAAO....',
      '....OAAAAAO....',
      '.OOOOAAAAAOOOO.',
      'OAAAAAAAAAAAAAO',
      '.OOOOOOOOOOOOO.',
      '.OHHHHHHHHHHHO.',
      'OHHHHHHhHHHHHHO',
      'OHHHHHHHHHHHHHO',
      '.OHHHHHHHHHHHO.',
      '.OsHHHHHHHHHsO.',
      '..OsSSSSSSSsO..'
    ],
    right: [
      '.....OOOOO...',
      '....OAAaAAO..',
      '....OAAAAAO..',
      '.OOOOAAAAAOOO',
      'OAAAAAAAAAAAO',
      '.OOOOOOOOOOO.',
      '.OHHHHHHSSSO.',
      'OHHHHHSSSSSSO',
      'OHHHHHSSSESSO',
      '.OHHHHSSSESSO',
      '.OsHHHsSSSSSO',
      '..OsHHsSSSSO.',
      '...OOsSSSsO..'
    ]
  }
};

const BODIES = {
  jacket: {
    down: [
      [
        '...OsWWTWWsO...',
        '..OJJWWTWWJJO..',
        '.OJjJJWTWJJjJO.',
        '.OJjJJWTWJJjJO.',
        '.OJjJJwTwJJjJO.',
        '.OSJJJwWwJJJSO.',
        '.OsOJJwwwJJOsO.',
        '..OOPPpPpPPOO..',
        '...OPPpOpPPO...',
        '...OPPPOPPPO...',
        '...ObBOObBO....',
        '...OBBO.OBBO...'
      ],
      [
        '...OsWWTWWsO...',
        '..OJJWWTWWJJO..',
        '.OJjJJWTWJJjJO.',
        '.OSjJJWTWJJjJO.',
        '.OsJJJwTwJJJJO.',
        '..OJJJwWwJJJSO.',
        '..OOJJwwwJJOsO.',
        '...OPPpPpPPOO..',
        '...OPPpOpPPO...',
        '....OPPOPPPO...',
        '....ObBOObBO...',
        '....OBBO.OBBO..'
      ],
      [
        '...OsWWTWWsO...',
        '..OJJWWTWWJJO..',
        '.OJjJJWTWJJjJO.',
        '.OJjJJWTWJJjSO.',
        '.OJJJJwTwJJJsO.',
        '.OSJJJwWwJJJO..',
        '.OsOJJwwwJJOO..',
        '..OOPPpPpPPO...',
        '...OPPpOpPPO...',
        '...OPPPOPPO....',
        '...ObBOObBO....',
        '..OBBO.OBBO....'
      ]
    ],
    up: [
      [
        '...OsSSSSSsO...',
        '..OJJJJKJJJJO..',
        '.OJJjJJKJJjJJO.',
        '.OJJJJJKJJJJJO.',
        '.OJJJJJKJJJJJO.',
        '.OSJJJJKJJJJSO.',
        '.OsOJJJKJJJOsO.',
        '..OOPPpPpPPOO..',
        '...OPPpOpPPO...',
        '...OPPPOPPPO...',
        '...OBBOObBO....',
        '...OBBO.OBBO...'
      ],
      [
        '...OsSSSSSsO...',
        '..OJJJJKJJJJO..',
        '.OJJjJJKJJjJJO.',
        '.OSJJJJKJJJJJO.',
        '.OsJJJJKJJJJJO.',
        '..OJJJJKJJJJSO.',
        '..OOJJJKJJJOsO.',
        '...OPPpPpPPOO..',
        '...OPPpOpPPO...',
        '....OPPOPPPO...',
        '....OBBOObBO...',
        '....OBBO.OBBO..'
      ],
      [
        '...OsSSSSSsO...',
        '..OJJJJKJJJJO..',
        '.OJJjJJKJJjJJO.',
        '.OJJJJJKJJJJSO.',
        '.OJJJJJKJJJJsO.',
        '.OSJJJJKJJJJO..',
        '.OsOJJJKJJJOO..',
        '..OOPPpPpPPO...',
        '...OPPpOpPPO...',
        '...OPPPOPPO....',
        '...OBBOObBO....',
        '..OBBO.OBBO....'
      ]
    ],
    right: [
      [
        '...OJJWTOO...',
        '..OJJjJWTJO..',
        '..OKJjJWTJO..',
        '..OKJjJwTJO..',
        '..OKJjJwSJO..',
        '..OKKjJJsOO..',
        '...OPPpPPO...',
        '...OPPpPPO...',
        '...OPPPPPO...',
        '...ObBBBBO...',
        '...OBBBBBO...'
      ],
      [
        '...OJJWTOO...',
        '..OJJjJWTJO..',
        '..OKJjJWTSO..',
        '..OKJjJwTsO..',
        '..OKJjJwJOO..',
        '..OKKjJJJO...',
        '...OPPpPPO...',
        '..OPPpOPPPO..',
        '.OPPPO.OPPPO.',
        '.ObBBO..OBBO.',
        '.OBBBO..OBBO.'
      ],
      [
        '...OJJWTOO...',
        '..OJJjJWTJO..',
        '..OKJjJWTJO..',
        '..OSJjJwTJO..',
        '..OsJjJwJJO..',
        '..OOKjJJJOO..',
        '...OPPpPPO...',
        '...OPPOPPO...',
        '..OPPO.OPpO..',
        '..OBBO..OBO..',
        '..OBBO.......'
      ]
    ]
  },
  skirt: {
    down: [
      [
        '...OsWTWTWsO...',
        '..OJJWWWWWJJO..',
        '.OJjJWwWwWJjJO.',
        '.OJjJWWWWWJjJO.',
        '.OSJJwWwWwJJSO.',
        '.OsOPPPpPPPOsO.',
        '..OPPpPPPpPPO..',
        '..OPPPPPPPPPO..',
        '..OPPPPPPPPPO..',
        '...OOSSOSSOO...',
        '....OBBOBBO....',
        '....ObBObBO....'
      ],
      [
        '...OsWTWTWsO...',
        '..OJJWWWWWJJO..',
        '.OJjJWwWwWJjJO.',
        '.OSjJWWWWWJjJO.',
        '.OsJJwWwWwJJJO.',
        '..OOPPPpPPPOSO.',
        '..OPPpPPPpPPsO.',
        '..OPPPPPPPPPO..',
        '..OPPPPPPPPPO..',
        '...OOSSOSSOO...',
        '....OBBO.OBO...',
        '....ObBO.OOO...'
      ],
      [
        '...OsWTWTWsO...',
        '..OJJWWWWWJJO..',
        '.OJjJWwWwWJjJO.',
        '.OJjJWWWWWJjSO.',
        '.OJJJwWwWwJJsO.',
        '.OSOPPPpPPPOO..',
        '.OsPPpPPPpPPO..',
        '..OPPPPPPPPPO..',
        '..OPPPPPPPPPO..',
        '...OOSSOSSOO...',
        '...OBO.OBBO....',
        '...OOO.ObBO....'
      ]
    ],
    up: [
      [
        '...OsSSSSSsO...',
        '..OJJJJKJJJJO..',
        '.OJjJJJKJJJjJO.',
        '.OJjJJJKJJJjJO.',
        '.OSJJJJKJJJJSO.',
        '.OsOPPPpPPPOsO.',
        '..OPPpPPPpPPO..',
        '..OPPPPPPPPPO..',
        '..OPPPPPPPPPO..',
        '...OOSSOSSOO...',
        '....OBBOBBO....',
        '....ObBObBO....'
      ],
      [
        '...OsSSSSSsO...',
        '..OJJJJKJJJJO..',
        '.OJjJJJKJJJjJO.',
        '.OSjJJJKJJJjJO.',
        '.OsJJJJKJJJJJO.',
        '..OOPPPpPPPOSO.',
        '..OPPpPPPpPPsO.',
        '..OPPPPPPPPPO..',
        '..OPPPPPPPPPO..',
        '...OOSSOSSOO...',
        '....OBBO.OBO...',
        '....ObBO.OOO...'
      ],
      [
        '...OsSSSSSsO...',
        '..OJJJJKJJJJO..',
        '.OJjJJJKJJJjJO.',
        '.OJjJJJKJJJjSO.',
        '.OJJJJJKJJJJsO.',
        '.OSOPPPpPPPOO..',
        '.OsPPpPPPpPPO..',
        '..OPPPPPPPPPO..',
        '..OPPPPPPPPPO..',
        '...OOSSOSSOO...',
        '...OBO.OBBO....',
        '...OOO.ObBO....'
      ]
    ],
    right: [
      [
        '...OJJWTOO...',
        '..OJJjWWTJO..',
        '..OKJjWwTJO..',
        '..OKJjWwSJO..',
        '..OKKjJJsOO..',
        '..OPPPpPPPO..',
        '..OPPPpPPPO..',
        '..OPPPPPPPO..',
        '...OOSSSOO...',
        '....OBBBO....',
        '....ObBBO....'
      ],
      [
        '...OJJWTOO...',
        '..OJJjWWTJO..',
        '..OKJjWwTSO..',
        '..OKJjWwJsO..',
        '..OKKjJJJOO..',
        '..OPPPpPPPO..',
        '..OPPPpPPPO..',
        '..OPPPPPPPO..',
        '..OOSSOOSSO..',
        '.OBBBO..OBBO.',
        '.ObBBO..OBBO.'
      ],
      [
        '...OJJWTOO...',
        '..OJJjWWTJO..',
        '..OKJjWwTJO..',
        '..OSJjWwJJO..',
        '..OsKjJJJOO..',
        '..OPPPpPPPO..',
        '..OPPPpPPPO..',
        '..OPPPPPPPO..',
        '...OOSSSOO...',
        '...OBBBO.....',
        '...ObBBO.....'
      ]
    ]
  }
};

// Overlays: [direction, row, col, char] applied after assembly (row from top).
const OVERLAYS = {
  glasses: {
    down: [[8, 2, 'G'], [8, 4, 'G'], [8, 6, 'G'], [8, 8, 'G'], [8, 10, 'G'], [9, 2, 'G'], [9, 10, 'G']],
    right: [[8, 7, 'G'], [8, 9, 'G'], [8, 11, 'G'], [9, 7, 'G']]
  },
  // Log Lady's log, held across the chest (outlined, 4 rows).
  log: {
    down: [
      [13, 2, 'O'], [13, 3, 'O'], [13, 4, 'O'], [13, 5, 'O'], [13, 6, 'O'], [13, 7, 'O'], [13, 8, 'O'], [13, 9, 'O'], [13, 10, 'O'], [13, 11, 'O'], [13, 12, 'O'],
      [14, 2, 'O'], [14, 3, 'l'], [14, 4, 'L'], [14, 5, 'l'], [14, 6, 'L'], [14, 7, 'L'], [14, 8, 'l'], [14, 9, 'L'], [14, 10, 'l'], [14, 11, 'L'], [14, 12, 'O'],
      [15, 2, 'O'], [15, 3, 'L'], [15, 4, 'l'], [15, 5, 'L'], [15, 6, 'l'], [15, 7, 'L'], [15, 8, 'L'], [15, 9, 'l'], [15, 10, 'L'], [15, 11, 'l'], [15, 12, 'O'],
      [16, 2, 'O'], [16, 3, 'L'], [16, 4, 'L'], [16, 5, 'l'], [16, 6, 'L'], [16, 7, 'l'], [16, 8, 'L'], [16, 9, 'L'], [16, 10, 'l'], [16, 11, 'L'], [16, 12, 'O'],
      [17, 2, 'O'], [17, 3, 'O'], [17, 4, 'O'], [17, 5, 'O'], [17, 6, 'O'], [17, 7, 'O'], [17, 8, 'O'], [17, 9, 'O'], [17, 10, 'O'], [17, 11, 'O'], [17, 12, 'O']
    ],
    right: [
      [13, 5, 'O'], [13, 6, 'O'], [13, 7, 'O'], [13, 8, 'O'], [13, 9, 'O'], [13, 10, 'O'], [13, 11, 'O'],
      [14, 5, 'O'], [14, 6, 'l'], [14, 7, 'L'], [14, 8, 'l'], [14, 9, 'L'], [14, 10, 'l'], [14, 11, 'O'],
      [15, 5, 'O'], [15, 6, 'L'], [15, 7, 'l'], [15, 8, 'L'], [15, 9, 'l'], [15, 10, 'L'], [15, 11, 'O'],
      [16, 5, 'O'], [16, 6, 'l'], [16, 7, 'L'], [16, 8, 'L'], [16, 9, 'l'], [16, 10, 'L'], [16, 11, 'O'],
      [17, 5, 'O'], [17, 6, 'O'], [17, 7, 'O'], [17, 8, 'O'], [17, 9, 'O'], [17, 10, 'O'], [17, 11, 'O']
    ]
  },
  // Hair falling onto the shoulders for long styles (outlined).
  hairShoulders: {
    down: [[12, 1, 'O'], [12, 2, 'H'], [12, 3, 'H'], [12, 11, 'H'], [12, 12, 'H'], [12, 13, 'O'], [13, 1, 'O'], [13, 2, 'H'], [13, 12, 'H'], [13, 13, 'O'], [14, 2, 'O'], [14, 12, 'O']],
    up: [[12, 1, 'O'], [12, 2, 'H'], [12, 3, 'H'], [12, 11, 'H'], [12, 12, 'H'], [12, 13, 'O'], [13, 1, 'O'], [13, 2, 'H'], [13, 3, 'H'], [13, 11, 'H'], [13, 12, 'H'], [13, 13, 'O'], [14, 1, 'O'], [14, 2, 'H'], [14, 12, 'H'], [14, 13, 'O'], [15, 2, 'O'], [15, 12, 'O']],
    right: [[12, 0, 'O'], [12, 1, 'H'], [12, 2, 'H'], [12, 3, 'H'], [13, 0, 'O'], [13, 1, 'H'], [13, 2, 'H'], [14, 1, 'O'], [14, 2, 'O']]
  },
  // Wild spikes on top of long hair (BOB).
  wild: {
    down: [[0, 1, 'O'], [0, 2, 'O'], [0, 12, 'O'], [0, 13, 'O'], [1, 1, 'O'], [1, 2, 'H'], [1, 12, 'H'], [1, 13, 'O'], [2, 1, 'O'], [2, 13, 'O']],
    up: [[0, 1, 'O'], [0, 2, 'O'], [0, 12, 'O'], [0, 13, 'O'], [1, 1, 'O'], [1, 2, 'H'], [1, 12, 'H'], [1, 13, 'O'], [2, 1, 'O'], [2, 13, 'O']],
    right: [[0, 1, 'O'], [0, 2, 'O'], [0, 11, 'O'], [0, 12, 'O'], [1, 1, 'O'], [1, 2, 'H'], [1, 11, 'H'], [1, 12, 'O'], [2, 1, 'O'], [2, 12, 'O']]
  },
  // Beard / moustache on the neat head.
  beard: {
    down: [[10, 4, 'H'], [10, 5, 'H'], [10, 6, 'H'], [10, 8, 'H'], [10, 9, 'H'], [10, 10, 'H'], [11, 4, 'H'], [11, 5, 'H'], [11, 6, 'H'], [11, 7, 'H'], [11, 8, 'H'], [11, 9, 'H'], [11, 10, 'H']],
    right: [[10, 8, 'H'], [10, 9, 'H'], [10, 10, 'H'], [11, 7, 'H'], [11, 8, 'H'], [11, 9, 'H'], [11, 10, 'H'], [12, 7, 'H'], [12, 8, 'H'], [12, 9, 'H']]
  },
  // Sheriff star on the chest (jacket body, down + right).
  badge: {
    down: [[14, 4, 'T']],
    right: [[14, 5, 'T']]
  },
  // Apron bib for waitresses (skirt body): lighter panel over the skirt.
  apron: {
    down: [[17, 5, 'W'], [17, 6, 'w'], [17, 7, 'W'], [17, 8, 'w'], [17, 9, 'W'], [18, 5, 'W'], [18, 6, 'W'], [18, 7, 'w'], [18, 8, 'W'], [18, 9, 'W'], [19, 5, 'W'], [19, 6, 'w'], [19, 7, 'W'], [19, 8, 'w'], [19, 9, 'W'], [20, 5, 'w'], [20, 6, 'W'], [20, 7, 'W'], [20, 8, 'W'], [20, 9, 'w']],
    right: [[17, 6, 'W'], [17, 7, 'w'], [17, 8, 'W'], [18, 6, 'w'], [18, 7, 'W'], [18, 8, 'W'], [19, 6, 'W'], [19, 7, 'W'], [19, 8, 'w']]
  }
};

const OUTLINE = '#241E22';
const EYE = '#241E22';

function pal(spec) {
  return Object.assign({ O: OUTLINE, E: EYE, G: '#3A3A44', L: '#7A5535', l: '#A67D52' }, spec);
}

// Shared tone families (muted, from the guide palette).
const SKIN = { S: '#E8CAA8', s: '#C8A080' };
const SKIN_DARK = { S: '#C99A72', s: '#A5764F' };
const SKIN_PALE = { S: '#F2DCC2', s: '#D4B292' };
const HAIR = {
  dark: { H: '#33262A', h: '#54403E' },
  brown: { H: '#4E3526', h: '#705039' },
  blond: { H: '#C9A25A', h: '#E3C27E' },
  auburn: { H: '#7A3B2A', h: '#9C5539' },
  grey: { H: '#8A8A88', h: '#B0B0AC' },
  white: { H: '#C9C6BC', h: '#E4E1D6' },
  black: { H: '#1F1B22', h: '#3B343C' },
  red: { H: '#8E4A2E', h: '#B36A44' }
};
const SHOES = { brown: { B: '#4B3527', b: '#6E4E38' }, black: { B: '#26232A', b: '#3E3A44' }, tan: { B: '#7A5A3A', b: '#9C7A52' } };

const CHARACTERS = {
  cooper: { head: 'short', body: 'jacket', colors: { ...HAIR.dark, ...SKIN, W: '#EEE5D1', w: '#CFC4AD', T: '#722A31', J: '#3F4637', j: '#59624A', K: '#2B3028', P: '#2A2C35', p: '#3D404C', ...SHOES.brown } },
  truman: { head: 'hat', body: 'jacket', overlays: ['badge'], colors: { ...HAIR.brown, ...SKIN, A: '#6B4E30', a: '#6B4E30', W: '#D8C8A2', w: '#B8A886', T: '#D9B44A', J: '#8A6E45', j: '#A88A5A', K: '#5E4A2E', P: '#3A3E33', p: '#4C5143', ...SHOES.brown } },
  lucy: { head: 'bun', body: 'skirt', colors: { ...HAIR.blond, ...SKIN_PALE, W: '#F0E4D8', w: '#D2C2B2', T: '#B9506A', J: '#B0607A', j: '#C87C92', K: '#8A4258', P: '#4B4A5E', p: '#5E5D74', ...SHOES.black } },
  andy: { head: 'neat', body: 'jacket', overlays: ['badge'], colors: { ...HAIR.brown, ...SKIN, W: '#D8C8A2', w: '#B8A886', T: '#D9B44A', J: '#8A6E45', j: '#A88A5A', K: '#5E4A2E', P: '#3A3E33', p: '#4C5143', ...SHOES.brown } },
  hawk: { head: 'long', body: 'jacket', overlays: ['badge', 'hairShoulders'], colors: { ...HAIR.black, ...SKIN_DARK, W: '#D8C8A2', w: '#B8A886', T: '#D9B44A', J: '#4A4E44', j: '#616656', K: '#33362F', P: '#3A3E33', p: '#4C5143', ...SHOES.brown } },
  sarah: { head: 'bun', body: 'skirt', colors: { ...HAIR.dark, ...SKIN_PALE, W: '#D9C9C4', w: '#B9A8A2', T: '#7A3F4A', J: '#6E4652', j: '#8A5E6A', K: '#4E3038', P: '#3E3440', p: '#524556', ...SHOES.black } },
  leland: { head: 'neat', body: 'jacket', colors: { ...HAIR.grey, ...SKIN, W: '#EEE5D1', w: '#CFC4AD', T: '#5A2A34', J: '#3E4250', j: '#565A6A', K: '#2C2F3A', P: '#2E3038', p: '#42444E', ...SHOES.black } },
  norma: { head: 'bun', body: 'skirt', overlays: ['apron'], colors: { ...HAIR.auburn, ...SKIN, W: '#F1E8DA', w: '#D3C7B6', T: '#8E4A50', J: '#9A5A5E', j: '#B57A7C', K: '#6E3E42', P: '#4E4450', p: '#625868', ...SHOES.brown } },
  shelly: { head: 'bob', body: 'skirt', overlays: ['apron'], colors: { ...HAIR.dark, ...SKIN, W: '#F1E8DA', w: '#D3C7B6', T: '#8E4A50', J: '#9A5A5E', j: '#B57A7C', K: '#6E3E42', P: '#4E4450', p: '#625868', ...SHOES.black } },
  loglady: { head: 'bun', body: 'skirt', overlays: ['glasses', 'log'], colors: { ...HAIR.brown, ...SKIN_PALE, G: '#4E3526', W: '#D6B8A0', w: '#D6B8A0', T: '#8C3E3A', J: '#8C3E3A', j: '#A85A52', K: '#652C2A', P: '#3E4A3A', p: '#52604C', ...SHOES.brown } },
  bobby: { head: 'short', body: 'jacket', colors: { ...HAIR.brown, ...SKIN, W: '#E8E0D0', w: '#C9C1AE', T: '#E8E0D0', J: '#8C2E34', j: '#AC4A4E', K: '#651F26', P: '#3A4458', p: '#4E5A70', ...SHOES.black } },
  donna: { head: 'bob', body: 'skirt', colors: { ...HAIR.dark, ...SKIN, W: '#E0D4C4', w: '#C2B4A2', T: '#7A4A5A', J: '#5C6E86', j: '#7A8CA4', K: '#44526A', P: '#4E4046', p: '#63535A', ...SHOES.brown } },
  jacoby: { head: 'neat', body: 'jacket', overlays: ['glasses', 'beard'], colors: { ...HAIR.grey, ...SKIN, G: '#8A3A4A', W: '#E6D2A0', w: '#E6D2A0', T: '#4A8A7A', J: '#C87A4A', j: '#E09A62', K: '#9A5A32', P: '#6A6A62', p: '#82827A', ...SHOES.tan } },
  audrey: { head: 'bob', body: 'skirt', colors: { ...HAIR.black, ...SKIN_PALE, W: '#F0E8DC', w: '#D2C8BA', T: '#8A2A34', J: '#6E3A44', j: '#8A5262', K: '#4E2830', P: '#7A3A40', p: '#94505A', ...SHOES.black } },
  mfap: { head: 'short', body: 'jacket', colors: { ...HAIR.dark, ...SKIN, W: '#F0E8DC', w: '#D2C8BA', T: '#2A2430', J: '#9C2A30', j: '#BC4A48', K: '#701C24', P: '#942830', p: '#B03E40', ...SHOES.black } },
  laura: { head: 'long', body: 'skirt', overlays: ['hairShoulders'], colors: { ...HAIR.blond, ...SKIN_PALE, W: '#F2ECE0', w: '#D4CEC2', T: '#C48A9A', J: '#B6C2C8', j: '#D0DADE', K: '#8E9AA2', P: '#5A6A80', p: '#6E8098', ...SHOES.brown } },
  gerard: { head: 'neat', body: 'jacket', colors: { ...HAIR.grey, ...SKIN, W: '#D4C8B0', w: '#B6AA94', T: '#4A4A4A', J: '#6A5A48', j: '#84745E', K: '#4C4034', P: '#4A4A48', p: '#5E5E5C', ...SHOES.brown } },
  benhorne: { head: 'neat', body: 'jacket', colors: { ...HAIR.dark, ...SKIN, W: '#EEE5D1', w: '#CFC4AD', T: '#7A2A30', J: '#2E3038', j: '#464850', K: '#1F2026', P: '#2C2E36', p: '#42444E', ...SHOES.black } },
  giant: { head: 'tall', body: 'jacketTall', colors: { ...HAIR.white, ...SKIN_PALE, W: '#F4F0E6', w: '#D8D4CA', T: '#2A2430', J: '#2A2C36', j: '#40424E', K: '#1C1D24', P: '#282A33', p: '#3E404C', ...SHOES.black } },
  maddy: { head: 'long', body: 'skirt', overlays: ['glasses', 'hairShoulders'], colors: { ...HAIR.dark, ...SKIN_PALE, G: '#33262A', W: '#E0D8CC', w: '#C2BAAE', T: '#7A4A5A', J: '#7A6E9A', j: '#968AB4', K: '#5A5074', P: '#3E3A48', p: '#524E5E', ...SHOES.brown } },
  bob: { head: 'long', body: 'jacket', overlays: ['hairShoulders', 'wild', 'beard'], colors: { ...HAIR.grey, ...SKIN_DARK, W: '#8A8A80', w: '#6E6E66', T: '#4A4A48', J: '#4A6080', j: '#5E7898', K: '#34465E', P: '#3A4A62', p: '#4E5E78', ...SHOES.black } },
  james: { head: 'short', body: 'jacket', colors: { ...HAIR.dark, ...SKIN, W: '#E4E0D8', w: '#C6C2BA', T: '#E4E0D8', J: '#2E2C34', j: '#46444E', K: '#1E1D24', P: '#3A4458', p: '#4E5A70', ...SHOES.black } },
  jacques: { head: 'neat', body: 'jacket', overlays: ['beard'], colors: { ...HAIR.red, ...SKIN, W: '#D8C8A2', w: '#B8A886', T: '#3A3A3A', J: '#8A3A34', j: '#A85A4A', K: '#652A28', P: '#3A4458', p: '#4E5A70', ...SHOES.brown } },
  ronette: { head: 'long', body: 'skirt', overlays: ['hairShoulders'], colors: { ...HAIR.brown, ...SKIN, W: '#E8DCC8', w: '#CABEAA', T: '#8A6A5A', J: '#6A7A5A', j: '#849470', K: '#4E5C42', P: '#5A4A44', p: '#6E5E58', ...SHOES.brown } },
  /* R129 — personale dell'ospedale. Cinque livelli di bianco/grigio (A cuffia,
   * a ombra cuffia, W grembiule, w ombra grembiule, T bordo colletto) sopra un
   * abito azzurro ardesia: legge come "reparto" accanto al letto di Ronette,
   * non come cameriera. K = P di proposito: l'abito e' un pezzo solo, e tiene
   * il conteggio colori del profilo dentro il tetto di 15. */
  infermiera: { head: 'cap', body: 'skirt', overlays: ['apron'], colors: { ...HAIR.dark, ...SKIN, A: '#F7F5EF', a: '#D9D8D0', W: '#ECECE4', w: '#C9CBC4', T: '#AEB6BC', J: '#8E9CB4', j: '#A6B4CA', K: '#7C8AA2', P: '#7C8AA2', p: '#94A2B8', ...SHOES.black } }
};

// Tall variant (Giant): two hair rows removed from the neat head, two leg rows
// added to the jacket body. Same 24 px envelope, smaller head, longer legs.
HEADS.tall = { down: HEADS.neat.down.slice(2), up: HEADS.neat.up.slice(2), right: HEADS.neat.right.slice(2) };
BODIES.jacketTall = {};
for (const dir of ['down', 'up', 'right']) {
  BODIES.jacketTall[dir] = BODIES.jacket[dir].map(rows => {
    const legRow = dir === 'right' ? 8 : 9;
    return [...rows.slice(0, legRow), rows[legRow], rows[legRow], ...rows.slice(legRow)];
  });
}

module.exports = { HEADS, BODIES, OVERLAYS, CHARACTERS, pal };
