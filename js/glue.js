/* glue.js — ponte tra le due generazioni di codice:
 * sprites.js espone GAME.sprites, maps.js espone GAME.maps (API nuova);
 * engine.js si aspetta GAME.Sprites / GAME.Maps (API vecchia).
 * Qui: facciate, dati NPC, normalizzazione porte/oggetti interagibili.
 */
(function () {
  var G = (typeof window !== 'undefined' ? window : globalThis);
  var GAME = G.GAME = G.GAME || {};
  var Sp = GAME.sprites, Mp = GAME.maps;

  /* ---------------- NPC per mappa (posizioni dai commenti di maps.js) -- */

  var NPCS = {
    town: [
      { id: 'bobby',  x: 31, y: 16, sprite: 'bobby',  name: 'Bobby',  dialogue: 'bobby', wander: true },
      { id: 'donna',  x: 44, y: 10, sprite: 'donna',  name: 'Donna',  dialogue: 'donna', wander: true },
      { id: 'jacoby', x: 16, y: 25, sprite: 'jacoby', name: 'Jacoby', dialogue: 'jacoby' }
    ],
    sheriff: [
      { id: 'truman', x: 7,  y: 3, sprite: 'truman', name: 'Truman',
        dialogue: [
          { cond: 'flag:leland_morto', then: 'truman_fine' },
          { cond: 'flag:atto5', then: 'truman_wait5' },
          { cond: 'flag:maddy_trovata', then: 'truman_atto5' },
          { cond: 'flag:atto4', then: 'truman_wait4' },
          { cond: 'flag:gigante1', then: 'truman_atto4' },
          { cond: 'flag:atto3', then: 'truman_wait3' },
          { cond: 'clues6', then: 'truman_atto3' },
          { cond: 'flag:sogno_fatto', then: 'truman_a2' },
          'truman'
        ], dir: 'down' },
      { id: 'andy',   x: 2,  y: 3, sprite: 'andy',   name: 'Andy',   dialogue: 'andy',   dir: 'down' },
      { id: 'hawk',   x: 7, y: 6, sprite: 'hawk',   name: 'Hawk',   dialogue: 'hawk',   dir: 'down' },
      { id: 'lucy',   x: 2,  y: 6, sprite: 'lucy',   name: 'Lucy',
        dialogue: [{ cond: 'flag:jacques_preso', then: 'lucy_a3' }, 'lucy'], dir: 'down' },
      { id: 'leland', x: 5,  y: 3, sprite: 'leland', name: 'Leland',
        cond: ['flag:atto5', '!flag:leland_morto'],
        dialogue: [{ cond: 'flag:leland_confessa', then: 'leland_morte' }, 'leland_interr'], dir: 'down' }
    ],
    palmer: [
      { id: 'sarah',  x: 9,  y: 7, sprite: 'sarah',  name: 'Sarah',
        dialogue: [{ cond: 'flag:atto4', then: 'sarah_visione' }, 'sarah'], dir: 'down' },
      { id: 'leland', x: 12, y: 8, sprite: 'leland', name: 'Leland',
        cond: ['!flag:atto5', '!flag:gigante2', '!flag:narrative_m8_owned'],
        dialogue: [
          { cond: 'flag:maddy_trovata', then: 'leland_dopo' },
          { cond: 'flag:gigante2', then: 'leland_dove' },
          { cond: 'flag:atto4', then: 'leland_a4' },
          'leland'
        ], dir: 'down' },
      { id: 'maddy', x: 11, y: 7, sprite: 'maddy', name: 'Maddy', dialogue: 'maddy_a4',
        cond: ['flag:atto4', '!flag:gigante2', '!flag:narrative_m8_owned'], dir: 'down' }
    ],
    hotel_gn: [
      { id: 'benhorne', x: 5,  y: 7, sprite: 'benhorne', name: 'Ben Horne', dialogue: 'benhorne_a2', dir: 'down' },
      { id: 'audrey',   x: 12, y: 9, sprite: 'audrey',   name: 'Audrey',    dialogue: 'audrey_a2',   dir: 'down', wander: true }
    ],
    hospital: [
      { id: 'gerard', x: 7, y: 6, sprite: 'gerard', name: 'Gerard',
        dialogue: [{ cond: 'flag:atto4', then: 'gerard_a4' }, 'gerard_a2'], dir: 'down' }
    ],
    diner: [
      { id: 'norma',   x: 5, y: 1, sprite: 'norma',   name: 'Norma',    dialogue: 'norma',   dir: 'down' },
      { id: 'shelly',  x: 8, y: 4, sprite: 'shelly',  name: 'Shelly',   dialogue: 'shelly',  dir: 'down' },
      { id: 'loglady', x: 4, y: 5, sprite: 'loglady', name: 'Log Lady',
        dialogue: [{ cond: 'flag:atto4', then: 'loglady_a4' }, 'loglady'], dir: 'down' },
      { id: 'james',   x: 10, y: 6, sprite: 'james',  name: 'James',    dialogue: 'james_a2', dir: 'down', cond: 'flag:sogno_fatto' }
    ],
    woods: [],
    redroom: [
      { id: 'mfap',  x: 8,  y: 4, sprite: 'mfap',  name: '???',
        dialogue: [{ cond: 'flag:leland_morto', then: 'mfap_finale' }, 'mfap'], dir: 'down' },
      { id: 'laura', x: 11, y: 2, sprite: 'laura', name: 'Ombra',
        dialogue: [
          { cond: 'flag:leland_morto', then: 'laura_finale2' },
          { cond: 'flag:met_mfap', then: 'laura_sogno' },
          'laura_hint'
        ], dir: 'down' },
      { id: 'bob', x: 14, y: 2, sprite: 'bob', name: 'BOB', dialogue: 'bob_finale',
        cond: ['flag:leland_morto'], dir: 'down' }
    ],
    traincar: [
      { id: 'hawk_vagone', x: 12, y: 4, sprite: 'hawk', name: 'Hawk', dialogue: 'hawk_vagone', dir: 'down' }
    ],
    oej: [
      { id: 'jacques', x: 7,  y: 5, sprite: 'jacques', name: 'Jacques', dialogue: 'jacques_a3', dir: 'down', cond: '!flag:jacques_morto' },
      { id: 'audrey',  x: 13, y: 7, sprite: 'audrey',  name: 'Audrey',  dialogue: 'audrey_oej',
        dir: 'down', cond: 'flag:audrey_indaga' }
    ]
  };

  /* interact id (maps.js) -> dialogue id (data.js), oppure cascata condizionale
     (stessa forma della cascata NPC: prima condizione vera vince) */
  var INTERACT_DLG = {
    cartello: 'sign_town',
    cameraLaura: 'laura_room',
    olio: 'olio',
    cartelloBosco: 'sign_grove',
    tomba_laura: 'tomba_laura',
    specchio315: [
      { cond: 'flag:gigante1', then: 'specchio_dopo' },
      { cond: 'flag:jacques_morto', then: 'gigante1_dlg' },
      'specchio315'
    ],
    palco_gigante: [
      { cond: 'flag:gigante2', then: 'palco_dopo' },
      'gigante2_dlg'
    ],
    lago_riva: [
      { cond: 'flag:maddy_trovata', then: 'lago_dopo' },
      { cond: 'flag:gigante2', then: 'lago_maddy' },
      'lago_sguardo'
    ]
  };
  var SPARKLE = { cameraLaura: 1, olio: 1, mucchio_terra: 1, anello_interact: 1 };

  GAME.INTERACT_DLG = INTERACT_DLG; // esposto per test/smoke.js (guardia interact -> dialogo)

  /* ---------------- GAME.Maps: mappe normalizzate + helper ------------- */

  var Maps = GAME.Maps = {};

  // campi di un oggetto mappa (maps.js) che vengono RIMODELLATI (non copiati
  // 1:1) qui sotto: doors/gate confluiscono in un unico "doors", objects/
  // interact confluiscono in un unico "objects". Ogni altro campo presente
  // sull'oggetto src (rows, width, height, indoor, onEnter, id, ...) viene
  // copiato cosi' com'e': un campo nuovo aggiunto a maps.js arriva qui senza
  // bisogno di toccare questo file. test/smoke.js verifica che nessun campo
  // src venga perso in silenzio.
  var TRANSFORMED_KEYS = { doors: 1, gate: 1, interact: 1, objects: 1 };

  Object.keys(Mp.maps).forEach(function (id) {
    var src = Mp.maps[id];

    var doors = {};
    Object.keys(src.doors || {}).forEach(function (k) {
      var d = src.doors[k];
      // porta "messaggio" (hotel chiuso) -> porta bloccata con dialogo
      doors[k] = d.msg === 'hotel' ? { locked: true, dialogue: 'hotel_locked' } : d;
    });
    if (src.gate) { // transenna del bosco: porta che richiede 3 indizi
      doors[src.gate.x + ',' + src.gate.y] = {
        to: src.gate.to, tx: src.gate.tx, ty: src.gate.ty, dir: src.gate.dir, needsClues: 3
      };
    }

    var objects = (src.objects || []).concat(Object.keys(src.interact || {}).map(function (k) {
      var xy = k.split(',');
      var key = src.interact[k];
      return {
        x: +xy[0], y: +xy[1],
        dialogue: INTERACT_DLG[key] || key,
        type: SPARKLE[key] ? 'sparkle' : 'plain'
      };
    }));

    var m = Maps[id] = { doors: doors, objects: objects, npcs: NPCS[id] || [] };
    Object.keys(src).forEach(function (k) {
      if (!TRANSFORMED_KEYS[k]) m[k] = src[k];
    });
    m.indoor = !!src.indoor; // normalizza a booleano anche quando assente in src
  });

  Maps.doorAt = function (mapId, x, y) {
    return Maps[mapId].doors[x + ',' + y] || null;
  };

  Maps.objectAt = function (mapId, x, y) {
    var os = Maps[mapId].objects;
    for (var i = 0; i < os.length; i++) if (os[i].x === x && os[i].y === y) return os[i];
    return null;
  };

  Maps.isSolid = function (mapId, x, y, S) {
    var m = Maps[mapId];
    if (x < 0 || y < 0 || x >= m.width || y >= m.height) return true;
    var ch = m.rows[y].charAt(x);
    if (ch === 'X') return !(S && S.clues.length >= 3); // transenna: apre con 3 indizi
    return !!Mp.SOLID[ch];
  };

  /* ---------------- GAME.Sprites: facciata ----------------------------- */

  var Spr = GAME.Sprites = { CHARS: Sp.CHARS };

  Spr.drawTile = function (ctx, ch, x, y, tx, ty, rows, opts) {
    opts = opts || {};
    // sprites.js usa (frame >> 4) per l'animazione di acqua/olio
    var frame = Math.floor((opts.t || 0) / 250) << 4;
    Sp.drawTile(ctx, ch, x, y, tx, ty, frame, {
      map: { rows: rows, width: rows[0].length },
      woodsOpen: !!opts.woodsOpen
    });
  };

  function nameOf(pal) {
    for (var k in Sp.CHARS) if (Sp.CHARS[k] === pal) return k;
    return 'cooper';
  }

  Spr.drawChar = function (ctx, x, y, pal, dir, frame, alpha, moving, t) {
    if (alpha != null && alpha < 1) {
      var old = ctx.globalAlpha;
      ctx.globalAlpha = alpha;
      Sp.drawChar(ctx, nameOf(pal), x, y, dir, frame, !!moving, t || 0);
      ctx.globalAlpha = old;
    } else {
      Sp.drawChar(ctx, nameOf(pal), x, y, dir, frame, !!moving, t || 0);
    }
  };

  Spr.drawSparkle = function (ctx, x, y, t) {
    var ph = Math.floor(t / 260) % 3;
    ctx.fillStyle = ph === 2 ? '#fff8d0' : '#ffe060';
    ctx.fillRect(x + 7, y + 6, 2, 2);
    if (ph !== 1) {
      ctx.fillRect(x + 7, y + 3, 2, 2);
      ctx.fillRect(x + 7, y + 9, 2, 2);
      ctx.fillRect(x + 4, y + 6, 2, 2);
      ctx.fillRect(x + 10, y + 6, 2, 2);
    }
  };
})();
