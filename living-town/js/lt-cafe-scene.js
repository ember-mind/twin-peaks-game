/* lt-cafe-scene.js — Living Town: how Café Meridiana is arranged.
 *
 * This file draws nothing itself. It is an arrangement: which pieces of the
 * shared interior kit stand where, in what material, and which of them must be
 * painted again in front of someone standing behind them. Every rectangle on
 * screen comes from the kit the Double R is drawn with; the room is a
 * different room because the plan is different, not because the drawing is.
 *
 * The plan lives with the location (lt-world.js `visual.plan`) and is the same
 * data the collision rows are checked against.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function' && !LT.World) require('./lt-world.js');
  var S = LT.CafeScene = LT.CafeScene || {};
  var T = 16;

  S.ID = 'lt_cafe';
  S.MATERIAL = 'lt_cafe';

  /* A material is a set of named roles, not of hues. The kit's role names were
   * coined for a diner ("red" is its upholstery and trim accent); here that
   * accent is a sea green over pale oak and a warm board floor. */
  S.PALETTE = {
    ink: '#25282b', cream: '#f1ead8', creamShade: '#cfc5a9', gold: '#e2b458',
    red: '#3f7a73', redHi: '#68a79b', redLight: '#97c9ba', redDark: '#21453f',
    wood: '#8a6a48', woodHi: '#b08c62', woodLight: '#d0b083', woodDark: '#4a382a',
    green: '#2b4436', leaf: '#5d7f4c', leafHi: '#93a860', metal: '#8a9796', metalHi: '#dde3d6',
    tile: '#b88b61', tileShade: '#a47a53', floorLight: '#c69b6f', floorShade: '#b2885e',
    glass: '#9ec3cf', glassHi: '#d2e6e2'
  };

  function plan() { return LT.World.LOCATIONS.cafe.visual.plan; }

  /* Furniture, as placed pieces. `depth` is the floor line of the piece: an
   * actor whose feet are above it is behind the piece. */
  S.pieces = function () {
    var P = plan(), out = [];
    out.push({ kind: 'counter', depth: (P.counter[1] + 1) * T, at: P.counter });
    P.stools.forEach(function (s) { out.push({ kind: 'stool', depth: (s[1] + 1) * T, at: s }); });
    P.banquettes.forEach(function (b, n) { out.push({ kind: 'banquette', depth: (b[1] + 1) * T, at: b, n: n }); });
    out.push({ kind: 'board', depth: (P.board[1] + 1) * T, at: P.board });
    out.push({ kind: 'plant', depth: (P.plant[1] + 1) * T, at: P.plant });
    out.push({ kind: 'coatRack', depth: (P.coatRack[1] + 1) * T, at: P.coatRack });
    return out;
  };

  function drawPiece(g, x, y, p, kit, piece) {
    var a = piece.at, px = x + a[0] * T, py = y + a[1] * T;
    switch (piece.kind) {
      case 'counter':
        var w = a[2] * T;
        kit.counterSlab(g, px, py, w, p, true);
        kit.serviceCluster(g, px + 3, py - 17, p, 'coffee');
        kit.serviceCluster(g, px + 50, py - 15, p, 'register');
        kit.pieCase(g, px + w - 29, py - 15, 28, p);
        kit.cup(g, px + 27, py - 3, p);
        kit.warmLight(g, px + 2, py - 8, 46, 20, .85);
        break;
      case 'stool': kit.stool(g, px, py, p); break;
      case 'banquette':
        kit.booth(g, px, py, a[2] * T, p, piece.n, null);
        kit.warmLight(g, px + 2, py - 4, a[2] * T - 4, 19, [.45, .8, .6][piece.n % 3]);
        break;
      case 'board': kit.specials(g, px, py, p, plan().signage.specials); break;
      case 'plant': kit.floorPlant(g, px - 4, py, p); break;
      case 'coatRack': kit.coatRack(g, px, py, p); break;
    }
  }

  S.draw = function (g, map, x, y, p, kit) {
    var P = plan(), W = P.size[0] * T, H = P.size[1] * T, R = kit.rect;
    var floorTop = P.floorTop * T, front = (P.size[1] - 1) * T;

    /* floor: boards, a service mat behind the counter, daylight by the window */
    kit.plankFloor(g, x, y, T, floorTop, W - T, front, p);
    R(g, x + P.counter[0] * T, y + floorTop, (P.counter[2] + 1) * T, T, 'rgba(37,40,43,.30)');
    for (var m = 0; m < (P.counter[2] + 1) * T; m += 4) R(g, x + P.counter[0] * T + m, y + floorTop + 2, 2, T - 4, 'rgba(37,40,43,.10)');
    R(g, x + T, y + floorTop, W - 2 * T, 7, 'rgba(32,28,21,.22)');
    R(g, x + T, y + floorTop, 5, front - floorTop, 'rgba(34,29,21,.17)');
    R(g, x + W - T - 6, y + floorTop, 6, front - floorTop, 'rgba(34,29,21,.20)');
    kit.daylight(g, x + P.window[0], y + floorTop + 10, P.window[2] + 8, 46, 1);

    /* back wall: boarded on the service side, plastered round the window */
    kit.panel(g, x, y - 14, P.window[0] - 10, floorTop + 14, p);
    R(g, x + P.window[0] - 10, y - 14, W - P.window[0] + 10, floorTop + 14, p.creamShade);
    R(g, x + P.window[0] - 10, y - 14, W - P.window[0] + 10, 3, p.woodLight);
    R(g, x + P.window[0] - 10, y + floorTop - 6, W - P.window[0] + 10, 6, p.wood);
    R(g, x + P.window[0] - 10, y + floorTop - 6, W - P.window[0] + 10, 1, p.woodHi);
    kit.window(g, x + P.window[0], y + P.window[1], P.window[2], P.window[3], p);

    /* pendants first: their cords pass behind the sign board */
    [[30, -14], [70, -14]].forEach(function (l) {
      kit.warmLight(g, x + l[0] - 20, y + 12, 43, 30, .7); kit.pendant(g, x + l[0], y + l[1], p);
    });
    /* the sign is a painted board, lettered with the kit's own glyphs */
    var sx = x + P.sign[0], sy = y + P.sign[1], name = P.signage.name, sw = name.length * 6 + 9;
    R(g, sx, sy, sw, 15, p.ink); R(g, sx + 1, sy + 1, sw - 2, 13, p.cream);
    R(g, sx + 1, sy + 12, sw - 2, 2, p.creamShade);
    kit.signWord(g, name, sx + 5, sy + 4, p.redDark);
    R(g, sx + 4, sy + 12, sw - 8, 1, p.red);
    kit.menuBoard(g, x + P.menu[0], y + P.menu[1], p, P.signage.menu);
    kit.picture(g, x + 20, y + 8, 14, 14, p, 'photo');
    kit.picture(g, x + P.sign[0] + sw + 3, y - 9, 12, 14, p, 'clock');
    /* shelf under the sign: jars and cups, two values each */
    R(g, x + 38, y + 20, 50, 2, p.woodLight); R(g, x + 38, y + 22, 50, 1, p.woodDark);
    [40, 47, 56, 63, 72, 80].forEach(function (dx, n) {
      R(g, x + dx, y + 13 + (n % 2) * 2, 5, 7 - (n % 2) * 2, n % 3 ? p.creamShade : p.red);
      R(g, x + dx, y + 13 + (n % 2) * 2, 5, 1, n % 3 ? p.cream : p.redHi);
    });

    /* side walls, their lamps and pictures */
    kit.panel(g, x, y + floorTop - 4, T, front - floorTop + 4, p);
    kit.panel(g, x + W - T, y + floorTop - 4, T, front - floorTop + 4, p);
    kit.picture(g, x + 2, y + 58, 12, 16, p, 'portrait');
    kit.picture(g, x + W - 14, y + 76, 12, 15, p, 'photo');
    P.wallLamps.forEach(function (l) {
      kit.warmLight(g, x + (l[0] ? W - 31 : 1), y + l[1] + 1, 30, 20, .8);
      kit.lamp(g, x + (l[0] ? W - 8 : 7), y + l[1], p);
    });

    S.pieces().forEach(function (piece) { drawPiece(g, x, y, p, kit, piece); });

    kit.frontWall(g, x + T, y + front, W - 2 * T, x + P.door[0] * T, p);
  };

  S.foreground = function (g, map, x, y, p, kit, min, max) {
    S.pieces().forEach(function (piece) {
      if (piece.depth >= min && piece.depth < max) drawPiece(g, x, y, p, kit, piece);
    });
  };

  /* Lights an actor can stand in: the pendants, the wall lamps, the window. */
  S.actorLights = function () {
    var P = plan(), W = P.size[0] * T;
    return [[30, 22], [70, 22], [P.window[0] + P.window[2] / 2, 40]]
      .concat(P.wallLamps.map(function (l) { return [l[0] ? W - 8 : 7, l[1] + 15]; }));
  };

  S.register = function (retro2d) {
    retro2d.interiorKit.materials[S.MATERIAL] = S.PALETTE;
    return retro2d.registerInteriorScene(S.ID, {
      material: S.MATERIAL, draw: S.draw, foreground: S.foreground,
      actorLights: S.actorLights(), monogram: plan().signage.monogram, backdrop: '#161d1f'
    });
  };
})();
