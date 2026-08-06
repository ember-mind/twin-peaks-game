/* retro.js — renderer 2D di produzione, stile RPG Game Boy Color.
 * Sovrascrive solo facciate grafiche: mappe, collisioni e narrativa restano
 * quelle canoniche. Risoluzione GBC 160x144, tile 16x16, sprite 16x20.
 */
(function () {
  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME;
  if (!GAME || !GAME.Sprites || !GAME.sprites) return;

  var Spr = GAME.Sprites;
  var Sp = GAME.sprites;
  var CHARS = Spr.CHARS || {};

  var P = {
    ink: '#17261d', deep: '#294b32', leaf: '#4f813f', grass: '#91bd55',
    grassHi: '#b8d46b', path: '#d3c98a', pathDark: '#9f9363',
    road: '#a4a58a', roadDark: '#747766', water: '#579093', waterHi: '#9bc2a9',
    cream: '#eee8c4', paper: '#f7f2d5', wood: '#8b623f', woodDark: '#523b2b',
    red: '#9d3f45', gold: '#d3ad5b', blue: '#597b90', white: '#f6f0d6'
  };

  var BUILDINGS = {
    '1': { roof: '#536c83', roofHi: '#7892a4', wall: '#c7aa76', door: '#365064' },
    '2': { roof: '#3e7094', roofHi: '#6595b0', wall: '#a86c49', door: '#973943' },
    '3': { roof: '#835741', roofHi: '#a97859', wall: '#d1bd8c', door: '#69433a' },
    '4': { roof: '#355d42', roofHi: '#5f7d4c', wall: '#79583a', door: '#453020' },
    '5': { roof: '#71838b', roofHi: '#9da9aa', wall: '#e2dfc5', door: '#527885' },
    '6': { roof: '#3b3128', roofHi: '#66503b', wall: '#624634', door: '#2f211b' }
  };

  function R(c, x, y, w, h, color) {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function hash(x, y, salt) {
    var n = Math.imul((x | 0) + 41, 374761393) ^ Math.imul((y | 0) + 73, 668265263) ^ salt;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return (n ^ (n >>> 16)) >>> 0;
  }

  function cell(rows, x, y) {
    if (!rows || y < 0 || y >= rows.length || x < 0 || x >= rows[y].length) return ' ';
    return rows[y].charAt(x);
  }

  function grass(c, x, y, tx, ty, dark) {
    var h = hash(tx, ty, dark ? 19 : 11);
    R(c, x, y, 16, 16, dark ? '#527943' : P.grass);
    var low = dark ? '#365d39' : P.leaf;
    var hi = dark ? '#779850' : P.grassHi;
    if ((h & 3) === 0) {
      var px = 2 + (h % 11), py = 4 + ((h >>> 5) % 9);
      R(c, x + px, y + py, 1, 3, low);
      R(c, x + px - 1, y + py + 1, 1, 1, low);
      R(c, x + px + 1, y + py, 1, 1, hi);
    }
    if ((h % 7) === 0) R(c, x + 12, y + 2, 2, 1, hi);
  }

  function tree(c, x, y, tx, ty, rows, sycamore) {
    grass(c, x, y, tx, ty, true);
    R(c, x + 6, y + 10, 4, 6, sycamore ? '#715e3c' : '#4d402c');
    R(c, x + 2, y + 10, 12, 5, P.ink);
    var dark = sycamore ? '#416b3f' : '#285135';
    var mid = sycamore ? '#69904c' : '#3d7540';
    var hi = sycamore ? '#9eb267' : '#6b9b4a';
    R(c, x + 2, y + 2, 12, 10, dark);
    R(c, x + 4, y, 8, 14, dark);
    R(c, x + 1, y + 5, 14, 6, dark);
    R(c, x + 4, y + 2, 7, 8, mid);
    R(c, x + 2, y + 6, 6, 4, mid);
    R(c, x + 5, y + 1, 4, 3, hi);
    R(c, x + 3, y + 6, 3, 2, hi);
    if (cell(rows, tx, ty - 1) === (sycamore ? 'Y' : 'T')) R(c, x + 3, y, 10, 2, dark);
  }

  function building(c, ch, x, y, tx, ty, rows) {
    var b = BUILDINGS[ch];
    var top = cell(rows, tx, ty - 1), bottom = cell(rows, tx, ty + 1);
    R(c, x, y, 16, 16, b.roof);
    R(c, x, y, 16, 2, top === ch ? b.roof : P.ink);
    R(c, x + 2, y + 3, 12, 2, b.roofHi);
    R(c, x + ((tx & 1) ? 3 : 9), y + 7, 5, 1, b.roofHi);
    R(c, x, y + 14, 16, 2, P.ink);
    if (bottom !== ch && bottom !== 'D') {
      R(c, x, y + 10, 16, 4, b.wall);
      R(c, x + 2, y + 11, 5, 2, P.cream);
      R(c, x + 3, y + 11, 3, 2, P.blue);
    }
  }

  function door(c, x, y, tx, ty, rows) {
    var side = cell(rows, tx - 1, ty);
    if (!BUILDINGS[side]) side = cell(rows, tx + 1, ty);
    var b = BUILDINGS[side] || BUILDINGS['3'];
    R(c, x, y, 16, 16, b.wall);
    R(c, x, y, 16, 3, b.roof);
    R(c, x + 4, y + 4, 8, 12, P.ink);
    R(c, x + 5, y + 5, 6, 11, b.door);
    R(c, x + 9, y + 10, 1, 1, P.gold);
  }

  function floor(c, x, y, tx, ty, carpet) {
    var base = carpet ? '#8b4c52' : '#d8bb7b';
    var line = carpet ? '#713840' : '#ad8553';
    R(c, x, y, 16, 16, base);
    if (carpet) {
      R(c, x, y, 1, 16, line); R(c, x + 15, y, 1, 16, line);
      if (((tx + ty) & 1) === 0) R(c, x + 7, y + 7, 2, 2, '#bd7670');
    } else {
      R(c, x, y + ((ty & 1) ? 4 : 12), 16, 1, line);
      R(c, x + ((tx & 1) ? 5 : 12), y, 1, 16, '#c49b62');
    }
  }

  Spr.drawTile = function (c, ch, x, y, tx, ty, rows, opts) {
    var h = hash(tx, ty, 31);
    switch (ch) {
      case '.': grass(c, x, y, tx, ty, false); break;
      case 'g': grass(c, x, y, tx, ty, true); break;
      case ',':
        grass(c, x, y, tx, ty, false);
        R(c, x + 4, y + 5, 2, 2, '#e7d9b0'); R(c, x + 11, y + 10, 2, 2, '#c97876');
        break;
      case 'r':
        R(c, x, y, 16, 16, P.road);
        if ((h & 3) === 0) R(c, x + 3, y + 8, 5, 1, P.roadDark);
        if ((h & 7) === 2) R(c, x + 12, y + 3, 1, 3, '#c2c1a2');
        break;
      case '=':
        R(c, x, y, 16, 16, '#c9c8a7'); R(c, x, y + 14, 16, 2, P.roadDark);
        R(c, x + ((tx & 1) ? 0 : 15), y, 1, 14, '#a8aa92');
        break;
      case '-':
        R(c, x, y, 16, 16, P.road);
        R(c, x + 2, y + 1, 3, 14, P.cream); R(c, x + 8, y + 1, 3, 14, P.cream);
        R(c, x + 14, y + 1, 2, 14, P.cream);
        break;
      case ':':
        R(c, x, y, 16, 16, P.road);
        R(c, x + 1, y + 2, 14, 3, P.cream); R(c, x + 1, y + 8, 14, 3, P.cream);
        R(c, x + 1, y + 14, 14, 2, P.cream);
        break;
      case 'p':
        R(c, x, y, 16, 16, P.path);
        R(c, x, y, 2, 16, P.pathDark); R(c, x + 14, y, 2, 16, P.pathDark);
        if ((h & 3) === 0) R(c, x + 6, y + 4, 3, 2, '#b7aa70');
        break;
      case 'w':
        R(c, x, y, 16, 16, P.water);
        R(c, x + ((h >>> 3) & 3), y + 4, 8, 1, P.waterHi);
        R(c, x + 7, y + 11, 7, 1, '#376e78');
        break;
      case 'T': tree(c, x, y, tx, ty, rows, false); break;
      case 'Y': tree(c, x, y, tx, ty, rows, true); break;
      case '1': case '2': case '3': case '4': case '5': case '6':
        building(c, ch, x, y, tx, ty, rows); break;
      case 'D': door(c, x, y, tx, ty, rows); break;
      case 'i':
        R(c, x, y, 16, 16, P.woodDark); R(c, x + 2, y + 2, 12, 12, '#6d5940');
        R(c, x + 3, y + 3, 10, 2, '#907650'); break;
      case 'f': floor(c, x, y, tx, ty, false); break;
      case 'c': floor(c, x, y, tx, ty, true); break;
      case 'Z':
        R(c, x, y, 16, 16, P.paper);
        for (var z = 0; z < 4; z++) { R(c, x + z * 4, y + ((ty & 1) ? 5 : 9), 4, 3, P.ink); }
        break;
      case 'R':
        R(c, x, y, 16, 16, '#7f2532'); R(c, x + 2, y, 3, 16, '#ad4550');
        R(c, x + 11, y, 2, 16, '#4c1f28'); break;
      case 'S':
        grass(c, x, y, tx, ty, false); R(c, x + 4, y + 7, 2, 9, P.woodDark);
        R(c, x + 10, y + 7, 2, 9, P.woodDark); R(c, x + 1, y + 1, 14, 9, P.ink);
        R(c, x + 2, y + 2, 12, 7, P.cream); R(c, x + 4, y + 4, 8, 1, P.deep); break;
      case 'X':
        grass(c, x, y, tx, ty, false); R(c, x, y + 5, 16, 3, P.red);
        R(c, x + 3, y + 2, 2, 12, P.cream); R(c, x + 11, y + 2, 2, 12, P.cream); break;
      case 'C':
        floor(c, x, y, tx, ty, false); R(c, x, y + 5, 16, 11, P.woodDark);
        R(c, x + 1, y + 6, 14, 3, '#b7824e'); break;
      case 't':
        floor(c, x, y, tx, ty, false); R(c, x + 2, y + 4, 12, 9, P.ink);
        R(c, x + 3, y + 3, 10, 8, '#8a5a3c'); break;
      case 'h':
        floor(c, x, y, tx, ty, false); R(c, x + 4, y + 3, 8, 10, P.woodDark);
        R(c, x + 5, y + 4, 6, 4, '#b17c4d'); break;
      case 'K':
        floor(c, x, y, tx, ty, false); R(c, x + 1, y + 2, 14, 13, P.ink);
        R(c, x + 2, y + 3, 12, 11, '#d8d4b8'); R(c, x + 3, y + 4, 5, 3, P.white); break;
      case 'U':
        floor(c, x, y, tx, ty, false); R(c, x + 2, y + 3, 12, 12, P.woodDark);
        R(c, x + 3, y + 4, 10, 3, '#a97746'); R(c, x + 7, y + 5, 2, 1, P.gold); break;
      case 'o':
        floor(c, x, y, tx, ty, false); R(c, x + 3, y + 7, 10, 6, P.ink);
        R(c, x + 6, y + 5, 5, 4, '#34392f'); break;
      case 'L':
        grass(c, x, y, tx, ty, false); R(c, x + 7, y + 4, 2, 12, P.ink);
        R(c, x + 4, y + 1, 8, 5, P.ink); R(c, x + 5, y + 2, 6, 3, P.gold); break;
      case 'P':
        grass(c, x, y, tx, ty, false); R(c, x + 7, y + 2, 2, 14, P.woodDark);
        R(c, x + 4, y + 4, 8, 5, P.ink); R(c, x + 5, y + 5, 6, 3, '#56768b'); break;
      case 'B':
        grass(c, x, y, tx, ty, false); R(c, x + 1, y + 8, 14, 4, P.woodDark);
        R(c, x + 2, y + 7, 12, 3, '#9d6b3e'); R(c, x + 3, y + 12, 2, 4, P.ink);
        R(c, x + 11, y + 12, 2, 4, P.ink); break;
      case 'F':
        grass(c, x, y, tx, ty, false); R(c, x, y + 5, 16, 3, '#8e6a3f');
        R(c, x, y + 11, 16, 2, P.woodDark); R(c, x + 3, y + 2, 3, 14, P.woodDark);
        R(c, x + 11, y + 2, 3, 14, P.woodDark); break;
      case 'A':
        grass(c, x, y, tx, ty, false); R(c, x + 1, y + 8, 14, 7, '#315d38');
        R(c, x + 3, y + 6, 3, 3, '#dfcb74'); R(c, x + 9, y + 9, 3, 3, '#c26870'); break;
      case 'H':
        grass(c, x, y, tx, ty, false); R(c, x + 5, y + 6, 6, 9, P.ink);
        R(c, x + 6, y + 4, 4, 11, '#b84c43'); R(c, x + 4, y + 7, 8, 3, '#d66a55'); break;
      case 'E':
        grass(c, x, y, tx, ty, false); R(c, x + 7, y + 8, 2, 8, P.ink);
        R(c, x + 3, y + 3, 10, 7, '#6a7681'); R(c, x + 4, y + 4, 8, 2, '#9da7a4'); break;
      case 'n':
        grass(c, x, y, tx, ty, false); R(c, x + 1, y + 7, 14, 8, P.deep);
        R(c, x + 3, y + 4, 10, 10, P.leaf); R(c, x + 5, y + 5, 4, 3, '#78a34f'); break;
      case 'M':
        floor(c, x, y, tx, ty, false); R(c, x + 5, y + 2, 6, 13, '#777a6f');
        R(c, x + 3, y + 12, 10, 4, '#4e544c'); break;
      case 'G':
        grass(c, x, y, tx, ty, false); R(c, x + 5, y + 4, 6, 11, '#7c7d70');
        R(c, x + 3, y + 7, 10, 2, '#a5a38d'); break;
      case 'v': R(c, x, y, 16, 16, P.ink); break;
      default: grass(c, x, y, tx, ty, false); break;
    }
  };

  function nameOf(pal) {
    for (var name in CHARS) if (CHARS[name] === pal) return name;
    return 'cooper';
  }

  Spr.drawChar = function (c, x, y, pal, dir, frame, alpha, moving) {
    var name = nameOf(pal);
    var p = pal || CHARS.cooper;
    var oldAlpha = c.globalAlpha;
    if (alpha != null) c.globalAlpha = oldAlpha * alpha;

    var ox = Math.round(x), oy = Math.round(y) - 4;
    var step = moving && (frame & 1) ? 1 : 0;
    var side = dir === 'left' ? -1 : (dir === 'right' ? 1 : 0);
    var skin = p.skin || '#d7b07e', hair = p.hair || P.ink;
    var shirt = p.shirt || '#4d5960', pants = p.pants || '#30373c';

    R(c, ox + 3, oy + 17, 10, 2, 'rgba(20,31,24,0.35)');
    R(c, ox + 4 - step, oy + 13, 3, 5, pants);
    R(c, ox + 9 + step, oy + 13, 3, 5, pants);
    R(c, ox + 3 - step, oy + 17, 4, 2, P.ink);
    R(c, ox + 9 + step, oy + 17, 4, 2, P.ink);
    R(c, ox + 3 + side, oy + 7, 10, 8, P.ink);
    R(c, ox + 4 + side, oy + 8, 8, 6, shirt);
    if (p.tie) R(c, ox + 7 + side, oy + 8, 2, 5, p.tie);
    if (p.badge) R(c, ox + 10 + side, oy + 9, 2, 2, p.badge);

    R(c, ox + 3 + side, oy + 1, 10, 8, P.ink);
    R(c, ox + 4 + side, oy + 2, 8, 6, skin);
    if (dir === 'up') {
      R(c, ox + 4 + side, oy + 2, 8, 7, hair);
      R(c, ox + 5 + side, oy + 7, 6, 2, hair);
    } else {
      R(c, ox + 4 + side, oy + 1, 8, 3, hair);
      R(c, ox + 3 + side, oy + 3, 2, 5, hair);
      R(c, ox + 11 + side, oy + 3, 2, 5, hair);
      if (dir === 'down') {
        R(c, ox + 5, oy + 5, 2, 2, P.ink); R(c, ox + 9, oy + 5, 2, 2, P.ink);
        R(c, ox + 7, oy + 7, 2, 1, name === 'bob' ? P.white : '#9c5d53');
      } else {
        var eyeX = dir === 'left' ? ox + 4 : ox + 10;
        R(c, eyeX, oy + 5, 2, 2, P.ink);
      }
    }
    if (p.hat) {
      R(c, ox + 2 + side, oy, 12, 3, P.ink);
      R(c, ox + 4 + side, oy - 2, 8, 3, p.hat);
    }
    if (p.long) {
      R(c, ox + 3 + side, oy + 4, 2, 8, hair);
      R(c, ox + 11 + side, oy + 4, 2, 8, hair);
    }
    if (p.shadow) c.globalAlpha *= 0.72;
    c.globalAlpha = oldAlpha;
  };

  Spr.drawSparkle = function (c, x, y, t) {
    var on = (Math.floor(t / 220) & 1) === 0;
    R(c, x + 7, y + 5, 2, 7, P.white);
    R(c, x + 4, y + 8, 8, 2, P.white);
    if (on) R(c, x + 6, y + 7, 4, 4, P.gold);
  };

  // Case già leggibili nei tile: nessuna massa obliqua/prospettica aggiuntiva.
  Sp.drawStructures = function () {};
  GAME.Retro2D = { palette: P, logicalWidth: 160, logicalHeight: 144 };
})();
