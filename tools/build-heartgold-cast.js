#!/usr/bin/env node
'use strict';

/**
 * Build HeartGold-scale 24 px cast sheets from external 3x3 source masters.
 *
 * Source masters stay in deploy storage. This script only reads them and writes
 * derived runtime assets into the canonical Vault project.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_MASTERS_ROOT = '/Users/ebuccelli/Code/solo/projects/twin-peaks-game/assets/sprites';
const DEFAULT_OUTPUT_DIR = path.join(PROJECT_ROOT, 'assets/sprites/cast-hg-24');
const DEFAULT_CAST_ATLAS = path.join(PROJECT_ROOT, 'assets/sprites/cast-walkcycles-hg-24.png');
const DEFAULT_EVIDENCE_DIR = path.join(PROJECT_ROOT, '.gauntlet/heartgold-visual-parity-r103/evidence/round12');
const SOURCE_COLORS = ['072619', '34572D', '6A8A43', '9AAB69', 'DCD9A9', 'EEE6B5'];
const FRAME_SIZE = 24;
const SHEET_SIZE = 72;
const CAST_SIZE = 360;
const MAGENTA = 'ED0BEB';

// Six semantic ramps, dark to light. Each pair supplies restrained local
// variation without blurring or inventing Nintendo pixels.
const PALETTES = {
  cooper:   ['1D2735','334458','31313A','514954','3F536A','6B8198','7A252A','A63A36','C97958','E49A70','D8E0E3','F5F1E5'],
  truman:   ['192025','2B3436','2C2924','463C31','4A4935','666348','88704B','AC8A59','C37F59','DEA278','D6D3C2','F1E9D0'],
  lucy:     ['241B2A','38283E','40282F','623840','7E3447','A8485E','C96772','E2888A','D58A69','EDAD83','E2D9CB','FFF1DC'],
  andy:     ['1C2227','303A3E','342D28','4E4135','4B4B39','6D684C','806B4E','A58A61','C6825E','DEA27B','DDD8C8','F5EBD2'],
  hawk:     ['17242D','334652','2B333D','485461','38556E','62819A','526D77','78949B','A76349','CC8563','B6CBD0','DEE7E4'],
  sarah:    ['201822','342435','2B232D','473649','49354F','67516E','6F536D','92708D','B36F61','D28F74','C9B9CA','E5D8E3'],
  leland:   ['171C22','29333C','35363A','505158','424856','606A79','777078','948994','BC8269','D8A087','D8DADD','F2EEE3'],
  norma:    ['212021','373231','49362C','6A4E3C','49616A','66808A','A56D54','CA8C6A','D6936E','E8B087','E2DFCF','FFF7E4'],
  shelly:   ['201922','352534','382629','57393C','7A3545','A64E5D','C86D74','E58D8B','D28A67','E8AD82','E6E0D2','FFF7E8'],
  loglady:  ['1D2A22','354434','483A2E','6B5340','4B5B39','708149','8A5B31','B57B3E','B87B5D','D29A76','D8C3A5','F2E2C4'],
  bobby:    ['18212C','304050','20262E','414B57','394F68','637B96','65666F','85838B','B76D50','D18A68','CFD4D6','EEF0EB'],
  donna:    ['1D1822','30263A','28222B','423746','5D2C3D','813E50','654F67','856982','C47E62','DFA07C','D9C8C1','F4E2D4'],
  jacoby:   ['202932','3A4751','46464A','646369','52616A','71818B','6B7378','8B9193','B87961','D59878','D5CDB8','F2E4C8'],
  audrey:   ['181923','292634','191921','2E2834','6E2939','9B3E4E','B75D62','D67970','C6795F','E29A76','E5D9CE','FFF2DF'],
  mfap:     ['251B21','412B33','302934','4C3D4B','8B3032','BA433D','C95949','E3785F','C77C5C','E19D76','DADDDD','FFF6E9'],
  laura:    ['182431','304052','384858','52677A','446583','6A88A2','708B99','94A9AD','AF7B62','CE9876','D9B48E','F1D7B2'],
  gerard:   ['202832','384754','3D352F','625447','4A596B','708297','756A65','988981','B47559','D19370','CBC6B9','EEE1CA'],
  benhorne: ['1B2430','334252','2D3440','4F5968','3A4354','647086','72282F','9B3A3D','B87358','D28E6A','DADDDD','F7F3E9'],
  giant:    ['1B2028','35404B','34363D','515862','414B5A','627184','6C6870','8C8790','AD765D','CD9370','D5D8DA','F3F0E6'],
  maddy:    ['1E1922','32273A','24212A','3D3546','693147','91445B','73586E','92758E','C47B61','DF9E7A','DDD2CD','F8E9DF'],
  bob:      ['1E2224','39444A','473A32','6B5848','4B6A85','7293B1','7D6B5B','A18A75','B9785B','D39770','C2CBD0','E0DDD2'],
  james:    ['18212C','304050','20262E','414B57','394F68','637B96','5E626C','7F828B','B66D50','D08A68','D1D5D6','F0EFE8'],
  jacques:  ['241C1A','4B3830','5A4539','80634F','8A493B','B6634C','756052','987B64','B67456','D3936D','D7C4A5','F0E1C5'],
  ronette:  ['211F2D','393444','3B4252','596372','3E6070','638591','6F888D','94AAA5','AC745C','CB9270','D9AA86','F0CEAA']
};

const GEOMETRY = {
  cooper: { width: 19, height: 24, widthByRow: [17, 17, 19], forceRows: [0, 1] },
  lucy: { width: 21, height: 24, widthByRow: [13, 13, 21], forceRows: [0, 1] },
  gerard: { width: 21, height: 24, widthByRow: [14, 14, 21], forceRows: [0, 1] },
  benhorne: { width: 21, height: 24, widthByRow: [13, 13, 21], forceRows: [0, 1] },
  // Giant alone occupies full approved native envelope: 24 px tall, 17 px
  // wide. Narrow crown carving below keeps result tall instead of squat.
  giant: { width: 17, height: 24, force: true },
  mfap: { width: 15, height: 23, force: true },
  bob: { width: 22, height: 24 },
  jacques: { width: 22, height: 23 },
  loglady: { width: 22, height: 23 },
  laura: { width: 18, height: 24 },
  ronette: { width: 19, height: 23 }
};

const SLENDER_CAST = new Set(['lucy', 'sarah', 'norma', 'shelly', 'donna', 'audrey', 'laura', 'maddy', 'ronette']);
const BROAD_CAST = new Set(['truman', 'loglady', 'bob', 'jacques']);
const WIDE_HAIR_CAST = new Set(['lucy', 'sarah', 'norma', 'shelly', 'donna', 'audrey', 'maddy']);
const LONG_HAIR_CAST = new Set(['hawk', 'loglady', 'laura', 'bob', 'ronette']);
const HAT_BRIM_CAST = new Set(['truman']);
const STURDY_PROFILE_CAST = new Set(['cooper', 'andy', 'hawk', 'leland', 'gerard', 'benhorne', 'bobby', 'jacoby', 'james']);
const BACK_COLOR_GUARD_CAST = new Set(['sarah', 'jacques']);
const PALE_CONTRAST_CAST = new Set(['laura', 'ronette']);
const HAIR_SILHOUETTE_CUES = {
  cooper: [
    { ratio: 0.13, sides: ['left'] },
    { ratio: 0.21, sides: ['right'], profileSides: ['left'] }
  ],
  bobby: [
    { ratio: 0.10, sides: ['left', 'right'] },
    { ratio: 0.25, sides: ['right'] }
  ],
  james: [
    { ratio: 0.08, sides: ['right'] },
    { ratio: 0.18, sides: ['right'] }
  ],
  donna: [{ ratio: 0.42, sides: ['left', 'right'], profileSides: ['left'] }],
  audrey: [{ ratio: 0.39, sides: ['left'], profileSides: ['right'] }],
  maddy: [{ ratio: 0.39, sides: ['right'], profileSides: ['left'] }]
};
// Dark-haired men share suit-scale masters, so the rear and profile rows need
// tiny authored asymmetries to keep them readable without increasing dark mass.
const DARK_MALE_CUES = {
  cooper:   { crown: ['left'], shoulder: ['right'], coatTail: ['left'], waistNotch: 'right' },
  andy:     { crown: ['right'], shoulder: ['left'], stance: ['left'], waistNotch: 'right' },
  bobby:    { crown: ['left', 'right'], shoulder: ['left', 'right'], stance: ['right'] },
  gerard:   { crown: ['right'], shoulder: ['right'], coatTail: ['right'], waistNotch: 'left' },
  benhorne: { crown: ['left'], shoulder: ['right'], coatTail: ['left'], stance: ['left'] },
  james:    { crown: ['right'], shoulder: ['left'], coatTail: ['right'], stance: ['right'], waistNotch: 'left' }
};

function fail(message) {
  process.stderr.write(`build-heartgold-cast: ${message}\n`);
  process.exit(1);
}

function usage() {
  process.stdout.write([
    'Usage: node tools/build-heartgold-cast.js [options]',
    '',
    `  --masters-root PATH  Sprite source root (default: ${DEFAULT_MASTERS_ROOT})`,
    `  --evidence-dir PATH  Round evidence output (default: ${DEFAULT_EVIDENCE_DIR})`,
    '  --verify-only        Validate existing canonical outputs without rebuilding',
    '  --check              Alias for --verify-only',
    '  --help               Show this help',
    ''
  ].join('\n'));
}

function parseArgs(argv) {
  const args = { mastersRoot: DEFAULT_MASTERS_ROOT, evidenceDir: DEFAULT_EVIDENCE_DIR, verifyOnly: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--masters-root') {
      if (!argv[i + 1]) fail('--masters-root requires a path');
      args.mastersRoot = path.resolve(argv[++i]);
    } else if (argv[i] === '--evidence-dir') {
      if (!argv[i + 1]) fail('--evidence-dir requires a path');
      args.evidenceDir = path.resolve(argv[++i]);
    } else if (argv[i] === '--verify-only' || argv[i] === '--check') {
      args.verifyOnly = true;
    } else if (argv[i] === '--help' || argv[i] === '-h') {
      usage();
      process.exit(0);
    } else {
      fail(`unknown option: ${argv[i]}`);
    }
  }
  return args;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || PROJECT_ROOT,
    encoding: options.encoding === null ? null : 'utf8',
    maxBuffer: 16 * 1024 * 1024
  });
  if (result.error) fail(`${command}: ${result.error.message}`);
  if (result.status !== 0) {
    fail(`${command} ${args.join(' ')}\n${String(result.stderr || result.stdout).trim()}`);
  }
  return result.stdout;
}

function requireMagick() {
  run('magick', ['-version']);
}

function identify(file) {
  const value = run('magick', ['identify', '-format', '%w %h', file]).trim();
  const match = value.match(/^(\d+) (\d+)$/);
  if (!match) fail(`cannot identify ${file}`);
  return { width: Number(match[1]), height: Number(match[2]) };
}

function sourceFor(mastersRoot, key) {
  return key === 'cooper'
    ? path.join(mastersRoot, 'cooper-walkcycle-master-r2.png')
    : path.join(mastersRoot, 'cast-masters', `${key}.png`);
}

function hexRgb(hex) {
  return [0, 2, 4].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

function shadeBetween(darkHex, lightHex, shade) {
  const dark = hexRgb(darkHex);
  const light = hexRgb(lightHex);
  const ratio = shade / 5;
  return dark.map((value, channel) => Math.round(value + ((light[channel] - value) * ratio)))
    .map(value => value.toString(16).padStart(2, '0'))
    .join('').toUpperCase();
}

function nearestSourceIndex(hex) {
  const rgb = hexRgb(hex);
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < SOURCE_COLORS.length; i += 1) {
    const candidate = hexRgb(SOURCE_COLORS[i]);
    const distance = rgb.reduce((sum, value, channel) => sum + ((value - candidate[channel]) ** 2), 0);
    if (distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  }
  return best;
}

function readPixels(file) {
  const text = run('magick', [file, 'txt:-']);
  const pixels = Array.from({ length: FRAME_SIZE }, () => Array(FRAME_SIZE).fill(null));
  for (const line of text.split('\n')) {
    const match = line.match(/^(\d+),(\d+):.*#([0-9A-Fa-f]{8})\b/);
    if (!match) continue;
    const x = Number(match[1]);
    const y = Number(match[2]);
    const rgba = match[3].toUpperCase();
    pixels[y][x] = rgba.slice(6) === '00' ? null : nearestSourceIndex(rgba.slice(0, 6));
  }
  return pixels;
}

function profileTargetWidth(key) {
  if (BROAD_CAST.has(key) || key === 'mfap') return 15;
  if (STURDY_PROFILE_CAST.has(key) || key === 'giant') return 14;
  return 13;
}

function widenProfilePixels(input, frameIndex, key) {
  if (Math.floor(frameIndex / 3) !== 2) return input;
  const occupied = [];
  for (let y = 0; y < FRAME_SIZE; y += 1) {
    for (let x = 0; x < FRAME_SIZE; x += 1) if (input[y][x] !== null) occupied.push({ x, y });
  }
  if (!occupied.length) return input;
  const left = Math.min(...occupied.map(pixel => pixel.x));
  const right = Math.max(...occupied.map(pixel => pixel.x));
  const width = right - left + 1;
  const targetWidth = profileTargetWidth(key);
  if (width >= targetWidth) return input;
  const center = (left + right) / 2;
  const targetLeft = Math.max(0, Math.min(FRAME_SIZE - targetWidth, Math.round(center - ((targetWidth - 1) / 2))));
  const widened = Array.from({ length: FRAME_SIZE }, () => Array(FRAME_SIZE).fill(null));
  for (let y = 0; y < FRAME_SIZE; y += 1) {
    for (let offset = 0; offset < targetWidth; offset += 1) {
      const sourceX = left + Math.min(width - 1, Math.floor((offset * width) / targetWidth));
      widened[y][targetLeft + offset] = input[y][sourceX];
    }
  }
  return widened;
}

function stylizePixels(input, frameIndex, key) {
  input = widenProfilePixels(input, frameIndex, key);
  const pixels = input.map(row => row.slice());
  const occupied = [];
  for (let y = 0; y < FRAME_SIZE; y += 1) {
    for (let x = 0; x < FRAME_SIZE; x += 1) {
      if (input[y][x] !== null) occupied.push({ x, y });
    }
  }
  if (!occupied.length) return pixels;
  const top = Math.min(...occupied.map(pixel => pixel.y));
  const bottom = Math.max(...occupied.map(pixel => pixel.y));
  const left = Math.min(...occupied.map(pixel => pixel.x));
  const right = Math.max(...occupied.map(pixel => pixel.x));
  const height = Math.max(1, bottom - top + 1);
  const width = Math.max(1, right - left + 1);
  const directionRow = Math.floor(frameIndex / 3);

  for (const { x, y } of occupied) {
    const sourceIndex = input[y][x];
    const neighbors = [[0,-1],[-1,0],[1,0],[0,1]]
      .map(([dx, dy]) => input[y + dy] && input[y + dy][x + dx]);
    const boundary = neighbors.some(value => value === null || value === undefined);
    const solidNeighbors = neighbors.filter(value => value !== null && value !== undefined).length;
    const airTop = y === 0 || input[y - 1][x] === null;
    const airLeft = x === 0 || input[y][x - 1] === null;
    const airBottom = y === FRAME_SIZE - 1 || input[y + 1][x] === null;
    const airRight = x === FRAME_SIZE - 1 || input[y][x + 1] === null;
    const yRatio = (y - top) / height;
    const xRatio = (x - left) / width;
    const isHead = yRatio < 0.37;
    const isBody = yRatio >= 0.37;

    // Source masters reserve their darkest swatch for both contour and filled
    // masses. Preserve it only at silhouette/feature edges. Interior darkness
    // becomes chromatic hair or garment, preventing black body columns.
    const stableLitContour = sourceIndex === 0 && boundary && solidNeighbors >= 2 &&
      (airTop || airLeft) && !(airBottom || airRight);
    const backChromaticContour = directionRow === 1 && sourceIndex === 0 && boundary &&
      solidNeighbors >= 2 && (airTop || airLeft) && !airBottom;
    if (stableLitContour || backChromaticContour) {
      pixels[y][x] = isHead ? 1 : 2;
    } else if (!boundary && sourceIndex === 0) {
      pixels[y][x] = isHead ? 1 : 2;
    } else if (!boundary && sourceIndex === 1 && isBody) {
      pixels[y][x] = 2;
    }

    // On front/profile rows, extend existing skin by one shadow band around
    // high-value face pixels. Back views remain hair/garment only.
    const faceZone = directionRow !== 1 && yRatio >= 0.16 && yRatio <= 0.48 && xRatio >= 0.18 && xRatio <= 0.82;
    if (faceZone && sourceIndex >= 2 && sourceIndex <= 3 && neighbors.some(value => value >= 4)) {
      pixels[y][x] = 4;
    }

    // Reserve band five for authored collar/shirt marks. Original brightest
    // pixels become skin/highlight on visible sides, or hair/garment on backs.
    if (sourceIndex === 5) {
      pixels[y][x] = directionRow === 1 ? (isHead ? 1 : 3) : 4;
    }

    // Laura and Ronette keep their cool, liminal palettes, but a selective
    // lower/right chromatic contour prevents pale skin, hair and clothing from
    // dissolving into bright terrain. Never close the silhouette into a box.
    if (PALE_CONTRAST_CAST.has(key) && boundary && solidNeighbors >= 2 &&
        (airBottom || airRight) && !airTop && yRatio < 0.93) {
      pixels[y][x] = 0;
    }

    // Front-facing collar and narrow center seam make shirt/tie/apron readable
    // against jacket or dress at one native pixel. Character palettes keep
    // these marks identity-specific instead of forcing universal white.
    const collarZone = directionRow === 0 && yRatio >= 0.39 && yRatio <= 0.53 && xRatio >= 0.31 && xRatio <= 0.69;
    const centerAccent = directionRow === 0 && yRatio > 0.53 && yRatio <= 0.67 && xRatio >= 0.42 && xRatio <= 0.58;
    if (!boundary && collarZone && sourceIndex <= 3) {
      pixels[y][x] = 5;
    } else if (!boundary && centerAccent && sourceIndex <= 2) {
      pixels[y][x] = 3;
    }
  }

  function extendHairRow(targetY, sides) {
    if (targetY < top || targetY > bottom) return;
    const row = [];
    for (let x = left; x <= right; x += 1) if (pixels[targetY][x] !== null) row.push(x);
    if (!row.length) return;
    if (sides.includes('left') && row[0] > left && pixels[targetY][row[0] - 1] === null) {
      pixels[targetY][row[0] - 1] = 1;
    }
    if (sides.includes('right') && row[row.length - 1] < right && pixels[targetY][row[row.length - 1] + 1] === null) {
      pixels[targetY][row[row.length - 1] + 1] = 1;
    }
  }

  // Recover character-specific one-pixel hair/accessory signatures lost during
  // 24 px reduction. Extensions stay inside existing actor bounds.
  if (HAT_BRIM_CAST.has(key)) {
    extendHairRow(top + Math.round(height * 0.14), ['left', 'right']);
  }
  if (WIDE_HAIR_CAST.has(key)) {
    extendHairRow(top + Math.round(height * 0.24), ['left', 'right']);
    extendHairRow(top + Math.round(height * 0.32), directionRow === 2 ? ['left'] : ['left', 'right']);
  }
  if (LONG_HAIR_CAST.has(key)) {
    extendHairRow(top + Math.round(height * 0.32), directionRow === 2 ? ['left'] : ['left', 'right']);
    extendHairRow(top + Math.round(height * 0.43), directionRow === 2 ? ['left'] : ['left', 'right']);
  }
  const hairCues = HAIR_SILHOUETTE_CUES[key] || [];
  for (const cue of hairCues) {
    extendHairRow(
      top + Math.round(height * cue.ratio),
      directionRow === 2 && cue.profileSides ? cue.profileSides : cue.sides
    );
  }

  function extendTorsoRow(targetY, sides, value) {
    if (targetY < top || targetY > bottom) return;
    const row = [];
    for (let x = left; x <= right; x += 1) if (pixels[targetY][x] !== null) row.push(x);
    if (!row.length) return;
    if (sides.includes('left') && row[0] > left && pixels[targetY][row[0] - 1] === null) {
      pixels[targetY][row[0] - 1] = value;
    }
    if (sides.includes('right') && row[row.length - 1] < right && pixels[targetY][row[row.length - 1] + 1] === null) {
      pixels[targetY][row[row.length - 1] + 1] = value;
    }
  }

  function carveRowSide(targetY, side) {
    if (targetY < top || targetY > bottom) return;
    const row = [];
    for (let x = left; x <= right; x += 1) if (pixels[targetY][x] !== null) row.push(x);
    if (row.length < 7) return;
    pixels[targetY][side === 'left' ? row[0] : row[row.length - 1]] = null;
  }

  function paintNearestInRow(targetY, targetX, value) {
    if (targetY < top || targetY > bottom) return;
    const row = [];
    for (let x = left; x <= right; x += 1) if (pixels[targetY][x] !== null) row.push(x);
    row.sort((a, b) => Math.abs(a - targetX) - Math.abs(b - targetX) || a - b);
    if (row[0] !== undefined) pixels[targetY][row[0]] = value;
  }

  function paintRowEdge(targetY, side, value) {
    if (targetY < top || targetY > bottom) return;
    const row = [];
    for (let x = left; x <= right; x += 1) if (pixels[targetY][x] !== null) row.push(x);
    if (row.length) pixels[targetY][side === 'left' ? row[0] : row[row.length - 1]] = value;
  }

  // Per-character rear/profile signatures: hair direction, shoulder pitch,
  // coat-tail side and stance. Every added pixel stays inside the actor's
  // established frame bounds, so these are identity cues rather than scale-up.
  const maleCue = DARK_MALE_CUES[key];
  if (maleCue && directionRow !== 0) {
    extendHairRow(top + Math.round(height * 0.18), maleCue.crown);
    extendTorsoRow(top + Math.round(height * 0.50), maleCue.shoulder, 2);
    if (maleCue.coatTail) extendTorsoRow(top + Math.round(height * 0.73), maleCue.coatTail, 3);
    if (maleCue.stance) extendTorsoRow(bottom - 1, maleCue.stance, 2);
    if (maleCue.waistNotch) carveRowSide(top + Math.round(height * 0.64), maleCue.waistNotch);
  }

  if (directionRow === 1) {
    // Four blue rear views share scale and coat ramps. Two existing pixels per
    // actor form distinct native signatures without changing silhouette size.
    const centerX = (left + right) / 2;
    if (key === 'cooper') {
      paintNearestInRow(top + Math.round(height * 0.43), centerX - 1, 5);
      paintNearestInRow(top + Math.round(height * 0.43), centerX + 1, 5);
    } else if (key === 'hawk') {
      paintNearestInRow(top + Math.round(height * 0.43), centerX - 1, 1);
      paintNearestInRow(top + Math.round(height * 0.43), centerX + 1, 1);
    } else if (key === 'bobby') {
      paintNearestInRow(top + Math.round(height * 0.50), centerX - 3, 3);
      paintNearestInRow(top + Math.round(height * 0.50), centerX + 3, 3);
    } else if (key === 'james') {
      paintNearestInRow(top + Math.round(height * 0.50), centerX - 2, 3);
      paintNearestInRow(top + Math.round(height * 0.57), centerX + 1, 3);
    } else if (key === 'giant') {
      paintNearestInRow(top + Math.round(height * 0.52), centerX, 3);
      paintNearestInRow(top + Math.round(height * 0.60), centerX, 3);
    }
  }

  if (directionRow === 2) {
    if (BROAD_CAST.has(key) || key === 'mfap') {
      extendTorsoRow(top + Math.round(height * 0.54), ['left', 'right'], 2);
      extendTorsoRow(top + Math.round(height * 0.66), ['right'], 3);
    } else if (STURDY_PROFILE_CAST.has(key) || key === 'giant') {
      extendTorsoRow(top + Math.round(height * 0.55), ['right'], 2);
    }

    const neckHighlights = occupied.filter(({ x, y }) => {
      const yRatio = (y - top) / height;
      const xRatio = (x - left) / width;
      return pixels[y][x] >= 2 && pixels[y][x] <= 4 && yRatio >= 0.41 && yRatio <= 0.55 && xRatio >= 0.52;
    }).sort((a, b) => a.y - b.y || b.x - a.x);
    if (neckHighlights[0]) pixels[neckHighlights[0].y][neckHighlights[0].x] = 5;

    const torsoMidtones = occupied.filter(({ x, y }) => {
      const yRatio = (y - top) / height;
      const xRatio = (x - left) / width;
      return pixels[y][x] === 2 && yRatio >= 0.54 && yRatio <= 0.72 && xRatio >= 0.48;
    }).sort((a, b) => b.x - a.x || a.y - b.y);
    if (torsoMidtones[0]) pixels[torsoMidtones[0].y][torsoMidtones[0].x] = 3;
  }

  if (directionRow === 1 && BACK_COLOR_GUARD_CAST.has(key)) {
    // These two idle backs otherwise collapse to eleven unique tones after the
    // same-ramp cleanup. Keep one tiny authored collar/yoke accent, never a
    // cross-cast stripe or dark box.
    const yokeAccent = occupied.filter(({ x, y }) => {
      const yRatio = (y - top) / height;
      const xRatio = (x - left) / width;
      return pixels[y][x] === 2 && yRatio >= 0.47 && yRatio <= 0.58 && xRatio >= 0.38 && xRatio <= 0.62;
    }).sort((a, b) => a.y - b.y || Math.abs(a.x - ((left + right) / 2)) - Math.abs(b.x - ((left + right) / 2)));
    if (yokeAccent[0]) pixels[yokeAccent[0].y][yokeAccent[0].x] = 3;
    if (key === 'sarah' && yokeAccent.length > 1) {
      const secondAccent = yokeAccent[yokeAccent.length - 1];
      pixels[secondAccent.y][secondAccent.x] = 3;
    }
  }

  if (directionRow !== 1) {
    const faceHighlights = occupied.filter(({ x, y }) => {
      const yRatio = (y - top) / height;
      const xRatio = (x - left) / width;
      return pixels[y][x] === 4 && yRatio >= 0.20 && yRatio <= 0.43 && xRatio >= 0.22 && xRatio <= 0.62;
    }).sort((a, b) => (a.y * 2 + a.x) - (b.y * 2 + b.x));
    if (faceHighlights[0]) pixels[faceHighlights[0].y][faceHighlights[0].x] = 5;
  }

  if (directionRow === 0) {
    const torsoAccents = occupied.filter(({ x, y }) => {
      const yRatio = (y - top) / height;
      const xRatio = (x - left) / width;
      return pixels[y][x] === 2 && yRatio >= 0.54 && yRatio <= 0.69 && xRatio >= 0.36 && xRatio <= 0.64;
    }).sort((a, b) => Math.abs(a.x - ((left + right) / 2)) - Math.abs(b.x - ((left + right) / 2)));
    if (torsoAccents[0]) pixels[torsoAccents[0].y][torsoAccents[0].x] = 3;
  }

  function carveEdge(targetY) {
    if (targetY < top || targetY > bottom) return;
    const row = [];
    for (let x = left; x <= right; x += 1) if (pixels[targetY][x] !== null) row.push(x);
    if (row.length < 8) return;
    pixels[targetY][row[0]] = null;
    pixels[targetY][row[row.length - 1]] = null;
  }

  if (key === 'loglady') {
    // Keep the shawl broad, but separate crown, shoulder and carried log into
    // an asymmetric silhouette. The log uses its own warm chromatic ramp.
    if (directionRow === 1) {
      carveRowSide(top + Math.round(height * 0.46), 'left');
      carveRowSide(top + Math.round(height * 0.46), 'right');
      carveRowSide(top + Math.round(height * 0.53), 'left');
      carveRowSide(top + Math.round(height * 0.53), 'right');
      carveRowSide(top + Math.round(height * 0.62), 'left');
      carveRowSide(top + Math.round(height * 0.74), 'left');
    } else {
      carveRowSide(top + Math.round(height * 0.58), 'left');
    }
    extendTorsoRow(top + Math.round(height * 0.55), ['right'], 3);
    extendTorsoRow(top + Math.round(height * 0.69), ['right'], 3);
    const logPixels = occupied.filter(({ x, y }) => {
      const yRatio = (y - top) / height;
      const xRatio = (x - left) / width;
      return pixels[y][x] >= 2 && pixels[y][x] <= 3 && yRatio >= 0.46 && yRatio <= 0.76 && xRatio >= 0.54;
    }).sort((a, b) => a.y - b.y || b.x - a.x);
    if (logPixels[0]) pixels[logPixels[0].y][logPixels[0].x] = 3;
    if (logPixels.length > 3) {
      const lowerLog = logPixels[Math.floor(logPixels.length * 0.68)];
      pixels[lowerLog.y][lowerLog.x] = 3;
    }
    // Two-pixel warm band reads as a carried cylinder at native scale. Recolor
    // only existing right-side pixels: silhouette and palette budget stay put.
    for (const ratio of [0.55, 0.63]) {
      const targetY = top + Math.round(height * ratio);
      const row = [];
      for (let x = Math.ceil((left + right) / 2); x <= right; x += 1) {
        if (pixels[targetY][x] !== null) row.push(x);
      }
      const logBand = row.slice(-4);
      for (const x of logBand) pixels[targetY][x] = 3;
      if (logBand.length) pixels[targetY][logBand[logBand.length - 1]] = 2;
    }
  }

  // One-pixel neck notch separates head from torso. Slender cast also gets a
  // two-row waist taper; broad silhouettes retain shoulders, props, and mass.
  if (directionRow !== 2) {
    carveEdge(top + Math.round(height * 0.40));
    if (!BROAD_CAST.has(key)) {
      carveEdge(top + Math.round(height * 0.61));
      carveEdge(top + Math.round(height * 0.68));
      if (SLENDER_CAST.has(key)) carveEdge(top + Math.round(height * 0.75));
    } else {
      carveEdge(top + Math.round(height * 0.70));
    }
  }

  // HeartGold gait reads from alternating extremities, not a vertical bob.
  // Keep the common foot baseline fixed while trading one-pixel arm, hip and
  // shoe edges between Step A and Step B. Profiles and backs get a second
  // silhouette exchange because their source motion is otherwise easiest to
  // lose at native 1x.
  const gaitPhase = frameIndex % 3;
  if (gaitPhase !== 0) {
    const lead = gaitPhase === 1 ? 'left' : 'right';
    const trail = lead === 'left' ? 'right' : 'left';
    const upperArmY = top + Math.round(height * 0.53);
    const hipY = top + Math.round(height * 0.68);
    extendTorsoRow(upperArmY, [lead], 2);
    carveRowSide(upperArmY, trail);
    extendTorsoRow(bottom - 1, [lead], 2);
    if (directionRow !== 0) {
      extendTorsoRow(hipY, [lead], 3);
      carveRowSide(hipY, trail);
    }
    const hipAccent = occupied.filter(({ x, y }) => {
      const yRatio = (y - top) / height;
      const leadHalf = lead === 'left' ? x <= (left + right) / 2 : x >= (left + right) / 2;
      return pixels[y][x] === 2 && yRatio >= 0.61 && yRatio <= 0.77 && leadHalf;
    }).sort((a, b) => b.y - a.y || (lead === 'left' ? a.x - b.x : b.x - a.x));
    if (hipAccent[0]) pixels[hipAccent[0].y][hipAccent[0].x] = 3;
  }

  if (key === 'giant') {
    // Full-height source is already anchored at rows 0 and 23. Tightening two
    // crown rows while retaining 17 px shoulders makes that height legible.
    carveRowSide(top + Math.round(height * 0.13), 'left');
    carveRowSide(top + Math.round(height * 0.13), 'right');
    carveRowSide(top + Math.round(height * 0.25), directionRow === 2 ? 'left' : 'right');
  }

  if (key === 'gerard') {
    // Philip Gerard's missing left arm must survive every gait phase. Front
    // and profile lose the viewer-right arm; rear loses viewer-left.
    const missingSide = directionRow === 1 ? 'left' : 'right';
    carveRowSide(top + Math.round(height * 0.58), missingSide);
    carveRowSide(top + Math.round(height * 0.66), missingSide);
    paintRowEdge(
      top + Math.round(height * 0.62),
      missingSide === 'left' ? 'right' : 'left',
      4
    );
  }
  return pixels;
}

function shadePlan(pixels, frameIndex) {
  const positions = Array.from({ length: SOURCE_COLORS.length }, () => []);
  for (let y = 0; y < FRAME_SIZE; y += 1) {
    for (let x = 0; x < FRAME_SIZE; x += 1) {
      if (pixels[y][x] !== null) positions[pixels[y][x]].push({ x, y });
    }
  }
  const active = positions.map((items, sourceIndex) => ({ sourceIndex, items }))
    .filter(group => group.items.length > 0);
  const maxShadesPerRamp = active.length <= 3 ? 4 : 3;
  const targetColors = Math.min(15, Math.max(12, active.length * 3));
  const allocation = Array(SOURCE_COLORS.length).fill(0);
  for (const group of active) allocation[group.sourceIndex] = 1;
  let allocated = active.length;
  while (allocated < targetColors) {
    const candidate = active
      .filter(group => allocation[group.sourceIndex] < Math.min(group.items.length, maxShadesPerRamp))
      .sort((a, b) => {
        const pressureA = a.items.length / allocation[a.sourceIndex];
        const pressureB = b.items.length / allocation[b.sourceIndex];
        return pressureB - pressureA || a.sourceIndex - b.sourceIndex;
      })[0];
    if (!candidate) break;
    allocation[candidate.sourceIndex] += 1;
    allocated += 1;
  }

  const shades = Array.from({ length: FRAME_SIZE }, () => Array(FRAME_SIZE).fill(0));
  const directionRow = Math.floor(frameIndex / 3);
  for (const group of active) {
    // Fronts keep the top-left light vector. Backs favor a centered shoulder
    // plane; profiles favor their visible face/chest plane. The same restrained
    // ramp is redistributed, so volume improves without adding colors or dark.
    const score = position => {
      if (directionRow === 1) return (position.y * 2) + (Math.abs(position.x - ((FRAME_SIZE - 1) / 2)) * 2);
      if (directionRow === 2) return (position.y * 2) + (FRAME_SIZE - 1 - position.x);
      return position.x + (position.y * 2);
    };
    group.items.sort((a, b) => score(a) - score(b) || a.y - b.y || a.x - b.x);
    const shadeCount = allocation[group.sourceIndex];
    group.items.forEach((position, rank) => {
      let shade = shadeCount - 1 - Math.min(
        shadeCount - 1,
        Math.floor((rank * shadeCount) / group.items.length)
      );
      // Back planes stay within their character ramp: a narrow hair sheen and
      // centered shoulder yoke give readable volume without foreign accent
      // colors or a universal black outline.
      if (directionRow === 1 && shadeCount > 1) {
        const centerDistance = Math.abs(position.x - ((FRAME_SIZE - 1) / 2));
        if (group.sourceIndex === 1 && position.y >= 2 && position.y <= 8 && centerDistance <= 4.5) {
          shade = shadeCount - 1;
        } else if (group.sourceIndex >= 2 && group.sourceIndex <= 3 &&
            position.y >= 9 && position.y <= 15 && centerDistance <= 4.5) {
          shade = shadeCount - 1;
        } else if (group.sourceIndex >= 2 && group.sourceIndex <= 3 &&
            position.y >= 16 && position.y <= 19 && position.x <= (FRAME_SIZE - 1) / 2) {
          shade = Math.max(shade, Math.min(1, shadeCount - 1));
        }
      }
      shades[position.y][position.x] = shade;
    });
  }
  return { allocation, shades };
}

function writePixels(file, pixels, palette, frameIndex, tempDir, key) {
  pixels = stylizePixels(pixels, frameIndex, key);
  const txtPath = path.join(tempDir, `pixels-${path.basename(file, '.png')}.txt`);
  const lines = [`# ImageMagick pixel enumeration: ${FRAME_SIZE},${FRAME_SIZE},0,255,srgba`];
  const plan = shadePlan(pixels, frameIndex);
  for (let y = 0; y < FRAME_SIZE; y += 1) {
    for (let x = 0; x < FRAME_SIZE; x += 1) {
      const sourceIndex = pixels[y][x];
      const rampLight = sourceIndex === 0
        ? shadeBetween(palette[1], palette[3], 2)
        : palette[sourceIndex * 2 + 1];
      const color = sourceIndex === null ? '000000' : shadeBetween(
        palette[sourceIndex * 2],
        rampLight,
        plan.allocation[sourceIndex] === 1
          ? 0
          : (plan.shades[y][x] * 5) / (plan.allocation[sourceIndex] - 1)
      );
      const rgba = sourceIndex === null
        ? '00000000'
        : `${color}FF`;
      const [red, green, blue] = hexRgb(rgba.slice(0, 6));
      const alpha = rgba.slice(6) === '00' ? 0 : 255;
      const label = alpha === 0 ? 'none' : `srgba(${red},${green},${blue},1)`;
      lines.push(`${x},${y}: (${red},${green},${blue},${alpha})  #${rgba}  ${label}`);
    }
  }
  fs.writeFileSync(txtPath, `${lines.join('\n')}\n`);
  run('magick', [`txt:${txtPath}`, '-depth', '8', '-type', 'TrueColorAlpha', '-strip', file]);
}

function makeSourcePalette(file) {
  const inputs = SOURCE_COLORS.flatMap(color => ['xc:#' + color]);
  run('magick', [...inputs, '+append', file]);
}

function normalizeFrame(master, cell, row, col, geometry, sourcePalette, out) {
  const width = geometry.widthByRow ? geometry.widthByRow[row] : geometry.width;
  const force = geometry.force || (geometry.forceRows && geometry.forceRows.includes(row));
  run('magick', [
    master,
    '-crop', `${cell}x${cell}+${col * cell}+${row * cell}`, '+repage',
    '-alpha', 'on', '-fuzz', '14%', '-transparent', `#${MAGENTA}`,
    '-trim', '+repage', '-filter', 'point',
    '-resize', `${width}x${geometry.height}${force ? '!' : '>'}`,
    '-gravity', 'south', '-background', 'none', '-extent', `${FRAME_SIZE}x${FRAME_SIZE}`,
    '-channel', 'A', '-threshold', '50%', '+channel', '-strip', out
  ]);

  const alpha = `${out}.alpha.png`;
  const color = `${out}.color.png`;
  run('magick', [out, '-alpha', 'extract', alpha]);
  run('magick', [out, '-alpha', 'off', '-dither', 'none', '-remap', sourcePalette, color]);
  run('magick', [color, alpha, '-alpha', 'off', '-compose', 'CopyOpacity', '-composite', '-strip', out]);
  fs.unlinkSync(alpha);
  fs.unlinkSync(color);
}

function opaqueColors(file) {
  const output = run('magick', [file, '-unique-colors', 'txt:-']);
  const colors = new Set();
  for (const line of output.split('\n')) {
    const match = line.match(/#([0-9A-Fa-f]{8})\b/);
    if (match && match[1].slice(6).toUpperCase() !== '00') colors.add(match[1].slice(0, 6).toUpperCase());
  }
  return colors;
}

function visibleBounds(file) {
  const value = run('magick', [file, '-alpha', 'extract', '-threshold', '0', '-trim', '-format', '%w %h', 'info:']).trim();
  const match = value.match(/^(\d+) (\d+)$/);
  return match ? { width: Number(match[1]), height: Number(match[2]) } : { width: 0, height: 0 };
}

function inspectFrame(sheet, frameIndex, tempDir) {
  const x = (frameIndex % 3) * FRAME_SIZE;
  const y = Math.floor(frameIndex / 3) * FRAME_SIZE;
  const frame = path.join(tempDir, `audit-${path.basename(sheet, '.png')}-${frameIndex}.png`);
  run('magick', [sheet, '-crop', `${FRAME_SIZE}x${FRAME_SIZE}+${x}+${y}`, '+repage', frame]);
  const colors = opaqueColors(frame);
  const bounds = visibleBounds(frame);
  const unique = run('magick', [frame, 'txt:-']);
  let baseline = -1;
  const hasPartialAlpha = unique.split('\n').some(line => {
    const match = line.match(/#([0-9A-Fa-f]{8})\b/);
    return match && !['00', 'FF'].includes(match[1].slice(6).toUpperCase());
  });
  for (const line of unique.split('\n')) {
    const match = line.match(/^(\d+),(\d+):.*#([0-9A-Fa-f]{8})\b/);
    if (match && match[3].slice(6).toUpperCase() !== '00') baseline = Math.max(baseline, Number(match[2]));
  }
  return {
    colors: colors.size,
    height: bounds.height,
    width: bounds.width,
    baseline,
    hasPartialAlpha,
    hasMagenta: colors.has(MAGENTA)
  };
}

function frameAlphaMask(sheet, frameIndex) {
  const x = (frameIndex % 3) * FRAME_SIZE;
  const y = Math.floor(frameIndex / 3) * FRAME_SIZE;
  const text = run('magick', [sheet, '-crop', `${FRAME_SIZE}x${FRAME_SIZE}+${x}+${y}`, '+repage', 'txt:-']);
  const mask = Array(FRAME_SIZE * FRAME_SIZE).fill(false);
  for (const line of text.split('\n')) {
    const match = line.match(/^(\d+),(\d+):.*#([0-9A-Fa-f]{8})\b/);
    if (!match) continue;
    mask[(Number(match[2]) * FRAME_SIZE) + Number(match[1])] = match[3].slice(6).toUpperCase() !== '00';
  }
  return mask;
}

function frameAlphaDifference(sheet, frameA, frameB) {
  const a = frameAlphaMask(sheet, frameA);
  const b = frameAlphaMask(sheet, frameB);
  return a.reduce((count, value, index) => count + (value !== b[index] ? 1 : 0), 0);
}

function audit(characters, outputDir, castAtlas, tempDir) {
  const failures = [];
  const frames = [];
  const gaitDifferences = [];
  for (const character of characters) {
    const sheet = path.join(outputDir, `${character.key}.png`);
    if (!fs.existsSync(sheet)) {
      failures.push(`${character.key}: missing sheet`);
      continue;
    }
    const dimensions = identify(sheet);
    if (dimensions.width !== SHEET_SIZE || dimensions.height !== SHEET_SIZE) {
      failures.push(`${character.key}: expected 72x72, got ${dimensions.width}x${dimensions.height}`);
    }
    for (let frameIndex = 0; frameIndex < 9; frameIndex += 1) {
      const result = inspectFrame(sheet, frameIndex, tempDir);
      frames.push({ character: character.key, frame: frameIndex, ...result });
      if (result.height < 23 || result.height > 24) failures.push(`${character.key}/${frameIndex}: visible height ${result.height}`);
      if (result.width < 13 || result.width > 17) failures.push(`${character.key}/${frameIndex}: visible width ${result.width}`);
      if (result.colors < 12 || result.colors > 15) failures.push(`${character.key}/${frameIndex}: opaque colors ${result.colors}`);
      if (result.baseline !== FRAME_SIZE - 1) failures.push(`${character.key}/${frameIndex}: foot baseline ${result.baseline}`);
      if (result.hasPartialAlpha) failures.push(`${character.key}/${frameIndex}: partial alpha`);
      if (result.hasMagenta) failures.push(`${character.key}/${frameIndex}: magenta leak`);
    }
    for (let directionRow = 0; directionRow < 3; directionRow += 1) {
      const alphaDifference = frameAlphaDifference(sheet, (directionRow * 3) + 1, (directionRow * 3) + 2);
      gaitDifferences.push({ character: character.key, directionRow, alphaDifference });
      if (alphaDifference < 9) failures.push(`${character.key}/${directionRow}: Step A/B alpha difference ${alphaDifference}`);
    }
  }
  const dimensions = fs.existsSync(castAtlas) ? identify(castAtlas) : { width: 0, height: 0 };
  if (dimensions.width !== CAST_SIZE || dimensions.height !== CAST_SIZE) {
    failures.push(`cast atlas: expected 360x360, got ${dimensions.width}x${dimensions.height}`);
  }
  return { failures, frames, gaitDifferences, atlas: dimensions };
}

const EVIDENCE_NAMES = {
  cooper: 'Dale Cooper', truman: 'Harry Truman', lucy: 'Lucy Moran', andy: 'Andy Brennan',
  hawk: 'Hawk', sarah: 'Sarah Palmer', leland: 'Leland Palmer', norma: 'Norma Jennings',
  shelly: 'Shelly Johnson', loglady: 'Log Lady', bobby: 'Bobby Briggs', donna: 'Donna Hayward',
  jacoby: 'Lawrence Jacoby', audrey: 'Audrey Horne', mfap: 'MFAP', laura: 'Laura Palmer',
  gerard: 'Philip Gerard', benhorne: 'Benjamin Horne', giant: 'The Giant', maddy: 'Maddy Ferguson',
  bob: 'BOB', james: 'James Hurley', jacques: 'Jacques Renault', ronette: 'Ronette Pulaski'
};

function buildEvidence(characters, outputDir, evidenceDir, tempDir) {
  fs.mkdirSync(evidenceDir, { recursive: true });
  const font = '/System/Library/Fonts/SFNSMono.ttf';
  const background = '#E7E1CF';
  const ink = '#25333B';
  const tiles = [];
  for (const character of characters) {
    const tile = path.join(tempDir, `evidence-tile-${character.key}.png`);
    run('magick', [
      '-size', '96x92', `xc:${background}`,
      path.join(outputDir, `${character.key}.png`), '-gravity', 'south', '-geometry', '+0+2', '-composite',
      '-gravity', 'north', '-font', font, '-pointsize', '9', '-fill', ink,
      '-annotate', '+0+2', EVIDENCE_NAMES[character.key] || character.name,
      '-strip', tile
    ]);
    tiles.push(tile);
  }
  const blank = path.join(tempDir, 'evidence-blank.png');
  run('magick', ['-size', '96x92', `xc:${background}`, blank]);
  const nativeBoard = path.join(evidenceDir, 'cast-labeled-native-1x.png');
  run('magick', ['montage', ...tiles, blank, '-tile', '5x5', '-geometry', '96x92+2+2', '-background', background, '-strip', nativeBoard]);
  run('magick', [nativeBoard, '-filter', 'point', '-resize', '600%', '-strip', path.join(evidenceDir, 'cast-labeled-nearest-6x.png')]);

  const motionTiles = [];
  const contactMotionTiles = [];
  for (const character of characters) {
    const sheet = path.join(outputDir, `${character.key}.png`);
    const motionFrames = [];
    for (let direction = 0; direction < 4; direction += 1) {
      for (let phase = 0; phase < 3; phase += 1) {
        const sourceRow = direction === 3 ? 2 : direction;
        const frame = path.join(tempDir, `motion-${character.key}-${direction}-${phase}.png`);
        run('magick', [
          sheet, '-crop', `24x24+${phase * 24}+${sourceRow * 24}`, '+repage',
          ...(direction === 3 ? ['-flop'] : []), '-strip', frame
        ]);
        const contactFrame = path.join(tempDir, `motion-contact-${character.key}-${direction}-${phase}.png`);
        run('magick', [
          '-size', '28x29', 'xc:none', '-stroke', 'none',
          '-fill', 'rgba(49,90,73,0.18)', '-draw', 'rectangle 9,24 14,24 rectangle 9,28 14,28',
          '-fill', 'rgba(49,90,73,0.24)', '-draw', 'rectangle 6,25 17,25',
          '-fill', 'rgba(49,90,73,0.38)', '-draw', 'rectangle 5,26 18,26',
          '-fill', 'rgba(49,90,73,0.28)', '-draw', 'rectangle 7,27 17,27',
          frame, '-geometry', '+2+0', '-composite', '-strip', contactFrame
        ]);
        motionFrames.push({ direction, phase, frame, contactFrame });
      }
    }
    const motionTile = path.join(tempDir, `motion-tile-${character.key}.png`);
    const motionArgs = [
      '-size', '144x142', `xc:${background}`, '-gravity', 'northwest', '-font', font,
      '-pointsize', '9', '-fill', ink, '-annotate', '+4+2', EVIDENCE_NAMES[character.key] || character.name,
      '-pointsize', '7', '-annotate', '+47+14', 'IDLE', '-annotate', '+74+14', 'STEP-A', '-annotate', '+105+14', 'STEP-B',
      '-annotate', '+4+38', 'DOWN', '-annotate', '+4+65', 'UP',
      '-annotate', '+4+92', 'RIGHT', '-annotate', '+4+119', 'LEFT'
    ];
    for (const item of motionFrames) {
      motionArgs.push(item.frame, '-geometry', `+${44 + (item.phase * 30)}+${30 + (item.direction * 27)}`, '-composite');
    }
    motionArgs.push('-stroke', '#9D9A88', '-strokewidth', '1', '-fill', 'none', '-draw', 'rectangle 0,0 143,141', '-strip', motionTile);
    run('magick', motionArgs);
    motionTiles.push(motionTile);

    // Runtime-equivalent proof only: the atlas remains transparent because
    // retro-authored draws one shared tapered 14x5 two-value ellipse for player
    // and NPCs. Proof mirrors its exact pixel silhouette below grounded feet.
    const contactTile = path.join(tempDir, `motion-contact-tile-${character.key}.png`);
    const contactArgs = [
      '-size', '160x158', `xc:${background}`, '-gravity', 'northwest', '-font', font,
      '-pointsize', '9', '-fill', ink, '-annotate', '+4+2', EVIDENCE_NAMES[character.key] || character.name,
      '-pointsize', '7', '-annotate', '+51+14', 'IDLE', '-annotate', '+82+14', 'STEP-A', '-annotate', '+116+14', 'STEP-B',
      '-annotate', '+4+40', 'DOWN', '-annotate', '+4+72', 'UP',
      '-annotate', '+4+104', 'RIGHT', '-annotate', '+4+136', 'LEFT'
    ];
    for (const item of motionFrames) {
      contactArgs.push(item.contactFrame, '-geometry', `+${46 + (item.phase * 36)}+${28 + (item.direction * 32)}`, '-composite');
    }
    contactArgs.push('-stroke', '#9D9A88', '-strokewidth', '1', '-fill', 'none', '-draw', 'rectangle 0,0 159,157', '-strip', contactTile);
    run('magick', contactArgs);
    contactMotionTiles.push(contactTile);
  }
  const motionNative = path.join(evidenceDir, 'cast-all-directions-gait-native-1x.png');
  run('magick', ['montage', ...motionTiles, '-tile', '4x6', '-geometry', '144x142+2+2', '-background', background, '-strip', motionNative]);
  run('magick', [motionNative, '-filter', 'point', '-resize', '600%', '-strip', path.join(evidenceDir, 'cast-all-directions-gait-nearest-6x.png')]);
  const contactNative = path.join(evidenceDir, 'cast-all-directions-gait-contact-native-1x.png');
  run('magick', ['montage', ...contactMotionTiles, '-tile', '4x6', '-geometry', '160x158+2+2', '-background', background, '-strip', contactNative]);
  run('magick', [contactNative, '-filter', 'point', '-resize', '600%', '-strip', path.join(evidenceDir, 'cast-all-directions-gait-contact-nearest-6x.png')]);
}

function build(args, characters, tempDir) {
  const staging = path.join(tempDir, 'cast-hg-24');
  fs.mkdirSync(staging, { recursive: true });
  const sourcePalette = path.join(tempDir, 'source-palette.png');
  makeSourcePalette(sourcePalette);

  for (const character of characters) {
    const key = character.key;
    const master = sourceFor(args.mastersRoot, key);
    if (!fs.existsSync(master)) fail(`missing master: ${master}`);
    const dimensions = identify(master);
    if (dimensions.width !== dimensions.height || dimensions.width % 3 !== 0) {
      fail(`${key}: master must be square and divisible by 3; got ${dimensions.width}x${dimensions.height}`);
    }
    const palette = PALETTES[key];
    if (!palette || palette.length !== 12 || new Set(palette).size !== 12) fail(`${key}: invalid 12-color palette`);
    if (palette.includes(MAGENTA)) fail(`${key}: palette contains chroma magenta`);
    const geometry = GEOMETRY[key] || { width: 21, height: 24 };
    const frameFiles = [];
    for (let frameIndex = 0; frameIndex < 9; frameIndex += 1) {
      const row = Math.floor(frameIndex / 3);
      const col = frameIndex % 3;
      const normalized = path.join(tempDir, `${key}-${frameIndex}-normalized.png`);
      const rendered = path.join(tempDir, `${key}-${frameIndex}.png`);
      normalizeFrame(master, dimensions.width / 3, row, col, geometry, sourcePalette, normalized);
      writePixels(rendered, readPixels(normalized), palette, frameIndex, tempDir, key);
      frameFiles.push(rendered);
    }
    const sheet = path.join(staging, `${key}.png`);
    run('magick', ['montage', ...frameFiles, '-tile', '3x3', '-geometry', '24x24+0+0', '-background', 'none', '-strip', sheet]);
  }

  const blank = path.join(tempDir, 'blank-72.png');
  run('magick', ['-size', '72x72', 'xc:none', blank]);
  const sheets = characters.map(character => path.join(staging, `${character.key}.png`));
  const stagedAtlas = path.join(tempDir, 'cast-walkcycles-hg-24.png');
  run('magick', ['montage', ...sheets, blank, '-tile', '5x5', '-geometry', '72x72+0+0', '-background', 'none', '-strip', stagedAtlas]);

  fs.mkdirSync(DEFAULT_OUTPUT_DIR, { recursive: true });
  for (const character of characters) {
    fs.copyFileSync(path.join(staging, `${character.key}.png`), path.join(DEFAULT_OUTPUT_DIR, `${character.key}.png`));
  }
  fs.copyFileSync(stagedAtlas, DEFAULT_CAST_ATLAS);
  buildEvidence(characters, DEFAULT_OUTPUT_DIR, args.evidenceDir, tempDir);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  requireMagick();
  const manifestPath = path.join(args.mastersRoot, 'cast-manifest.json');
  if (!fs.existsSync(manifestPath)) fail(`missing manifest: ${manifestPath}`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const characters = manifest.characters || [];
  if (characters.length !== 24) fail(`manifest must contain 24 characters; got ${characters.length}`);
  if (new Set(characters.map(character => character.key)).size !== 24) fail('manifest character keys must be unique');
  const missingPalette = characters.find(character => !PALETTES[character.key]);
  if (missingPalette) fail(`missing palette for ${missingPalette.key}`);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-heartgold-cast-'));
  try {
    if (!args.verifyOnly) build(args, characters, tempDir);
    const result = audit(characters, DEFAULT_OUTPUT_DIR, DEFAULT_CAST_ATLAS, tempDir);
    if (result.failures.length) fail(`audit failed:\n${result.failures.map(item => `- ${item}`).join('\n')}`);
    const counts = result.frames.map(frame => frame.colors);
    const heights = result.frames.map(frame => frame.height);
    const widths = result.frames.map(frame => frame.width);
    const baselines = result.frames.map(frame => frame.baseline);
    const gaitDifferences = result.gaitDifferences.map(item => item.alphaDifference);
    process.stdout.write(`${JSON.stringify({
      status: 'pass',
      characters: characters.length,
      frames: result.frames.length,
      sheet: '72x72',
      atlas: `${result.atlas.width}x${result.atlas.height}`,
      opaqueColorsPerFrame: { min: Math.min(...counts), max: Math.max(...counts) },
      visibleHeight: { min: Math.min(...heights), max: Math.max(...heights) },
      visibleWidth: { min: Math.min(...widths), max: Math.max(...widths) },
      stepAlphaDifference: { min: Math.min(...gaitDifferences), max: Math.max(...gaitDifferences) },
      footBaseline: { row: FRAME_SIZE - 1, matchingFrames: baselines.filter(value => value === FRAME_SIZE - 1).length },
      binaryAlpha: true,
      magentaPixels: 0,
      outputDir: path.relative(PROJECT_ROOT, DEFAULT_OUTPUT_DIR),
      castAtlas: path.relative(PROJECT_ROOT, DEFAULT_CAST_ATLAS)
    }, null, 2)}\n`);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

main();
