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

  /* NPC classici per mappa: VUOTO dal 2026-09-13 (Cast Presence v0.1). I corpi
   * dei personaggi nominati — coordinate, direzione, cascata di dialogo, wander —
   * vivono in narrative/cast/windows.json (baseline per personaggio) e vengono
   * posati da GAME.CastPresence.syncMaps tramite l'adapter narrativo. Qui non si
   * aggiunge più nessun corpo e nessun `cond` di presenza (V7 single body owner). */
  var NPCS = {
    town: [], sheriff: [], palmer: [], hotel_gn: [], hospital: [], diner: [],
    woods: [], redroom: [], traincar: [], oej: []
  };

  /* interact id (maps.js) -> dialogue id (data.js), oppure cascata condizionale
     (stessa forma della cascata NPC: prima condizione vera vince) */
  var INTERACT_DLG = {
    cartello: 'sign_town',
    cameraLaura: [{ cond: 'flag:done_andy', then: 'laura_room_andy' }, 'laura_room'],
    bacheca: 'bacheca_centrale',
    olio: 'olio',
    cartelloBosco: 'sign_grove',
    tomba_laura: 'tomba_laura',
    specchio315: [
      { cond: 'flag:gigante1', then: 'specchio_dopo' },
      { cond: 'flag:jacques_morto', then: 'gigante1_dlg' },
      'specchio315'
    ],
    lago_riva: [
      { cond: 'flag:maddy_trovata', then: 'lago_dopo' },
      { cond: 'flag:sogno_fatto', then: 'lago_sguardo' },
      'lago_laura'
    ],
    letto_315: 'letto_315',
    scrivania_315: [
      { cond: 'evidence:T1_RONETTE_BOB', then: 'scrivania_315_bob' },
      'scrivania_315'
    ]
  };
  var SPARKLE = { cameraLaura: 1, olio: 1, mucchio_terra: 1, anello_interact: 1, specchio315: 1 };

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
