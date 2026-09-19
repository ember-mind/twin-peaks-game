/* Twin Peaks — Il Mistero di Laura Palmer
 * engine.js — loop di gioco, input, movimento su griglia, camera, rendering,
 * finestre di dialogo in stile Game Boy, menu indizi, macchina a stati
 * (title -> intro -> play -> end).
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var GAME = root.GAME = root.GAME || {};

  var E = GAME.Engine = {};

  var canvas, ctx, S;
  var last = 0, tGlobal = 0;
  var uiLayoutMode = '';
  var speakerPortraitKey = null;
  var speakerTypographySignature = '';
  var caseUiSignature = '';
  var dialogueLiveSignature = '';
  var TILE = 16, VW = 256, VH = 192; // viewport DS-like: 16x12 metatile
  // Primo frame giocabile: ingresso sud della città, accanto al cartello.
  // Coordinate già validate da genmaps contro collisioni e occlusione camera.
  var START_MAP = 'town', START_TX = 28, START_TY = 31, START_DIR = 'up';
  var UW = VW;                       // larghezza UI dinamica (fullscreen)
  // 16 px/tile: 0.12 completava un'intera cella in ~133 ms e faceva leggere
  // la locomozione riggata come pattinata accelerata. ~213 ms conserva risposta
  // arcade ma lascia una falcata visibile e un appoggio riconoscibile.
  var SPEED = 0.075;
  var NPC_SPEED = SPEED * 0.55; // NPCs walk a bit slower than the player
  var NPC_WANDER_RADIUS = 3; // tile radius from home

  /* Funzione pura condivisa da player, NPC e prove. Ogni attraversamento di
   * tile riparte da fase 0; progress=1 viene saturato per diagnostica, mentre
   * il runtime torna all'idle appena chiude il movimento. */
  function walkPhase(progress) {
    return Math.max(0, Math.min(3, Math.floor(progress * 4)));
  }
  E.walkPhase = walkPhase;

  /* Produzione piatta retro 2D. Codice warp storico resta irraggiungibile:
   * buffer nativo 256x192 e scala CSS nearest-neighbour sono unica proiezione. */
  var SCALE = 1;
  var WVW = 352, WVH = 240; // finestra mondo campionata (in px mondo)
  var TOP_SCALE = 0.72;     // compressione prospettica della riga più lontana
  var PITCH = 1.25;         // schiacciamento verticale del terreno (camera inclinata)
  var octx = null, offCv = null, ectx = null, entCv = null;
  var OFF_W = WVW * 2, OFF_H = WVH * 2;
  var warpSY = null, warpSW = null, warpS = null; // tabelle per riga dest
  var destOf = null;                              // riga off -> riga dest (per i billboard)
  var camX = 0, camY = 0, camSnap = true;

  function buildWarp(h) {
    warpSY = new Array(h); warpSW = new Array(h); warpS = new Array(h);
    var total = 0, i, sh;
    for (i = 0; i < h; i++) {
      var s = TOP_SCALE + (1 - TOP_SCALE) * (i / (h - 1));
      warpS[i] = s;
      warpSW[i] = (VW * SCALE) / s;
      total += PITCH / s;
    }
    var sy = OFF_H - total; // ancora il fondo dell'offscreen al fondo dello schermo
    for (i = 0; i < h; i++) { warpSY[i] = sy; sy += PITCH / warpS[i]; }
    // lookup inverso: per ogni riga dell'offscreen, la riga schermo che la mostra
    destOf = new Array(OFF_H);
    var d = 0;
    for (i = 0; i < OFF_H; i++) {
      while (d < h - 1 && warpSY[d + 1] <= i) d++;
      destOf[i] = i < warpSY[0] ? 0 : d;
    }
  }

  var KEYMAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    Space: 'A', Enter: 'A', KeyZ: 'A',
    Escape: 'B', KeyX: 'B',
    KeyN: 'N'
  };

  var held = []; // pila delle direzioni tenute premutе
  // Conserva un tap breve fino al prossimo tick: keydown+keyup possono cadere
  // fra due frame (automazione, tastiere Bluetooth, browser sotto carico).
  var queuedDirection = null;

  /* ---------------- stato ---------------- */

  function freshState() {
    return {
      mode: 'title',           // title | intro | play | end
      mapId: START_MAP, map: null, npcs: [],
      player: { tx: START_TX, ty: START_TY, x: START_TX * TILE, y: START_TY * TILE, dir: START_DIR, moving: false, mx: 0, my: 0, turnUntil: 0 },
      clues: [], flags: {},
      introPage: 0,           // indice della pagina VISIBILE, incluse continuazioni
      endPage: 0,
      dialogue: null,          // {id, def, pages, i, replay}
      menu: false,
      menuIndex: 0,
      menuDocument: false,
      menuPage: 0,
      fade: 0, fadePhase: 0,   // 0 niente, 1 uscita, 2 rientro
      warp: null,
      lastBump: -9999
    };
  }

  function loadMap(id, tx, ty, dir) {
    var previous = S && S.player ? {
      mapId: S.mapId, map: S.map, npcs: S.npcs, camSnap: camSnap,
      player: { tx: S.player.tx, ty: S.player.ty, x: S.player.x, y: S.player.y, dir: S.player.dir, moving: S.player.moving }
    } : null;
    S.mapId = id;
    S.map = GAME.Maps[id];
    S.npcs = (S.map.npcs || []).map(function (n) {
      return {
        id: n.id, x: n.x, y: n.y, vx: n.x, vy: n.y, sprite: n.sprite, name: n.name, dialogue: n.dialogue,
        dir: n.dir || 'down', cond: n.cond, wander: n.wander,
        homeX: n.x, homeY: n.y,
        moving: false, mx: n.x, my: n.y, moveStartX: n.x, moveStartY: n.y, moveT: 0,
        nextThink: tGlobal + Math.random() * 4000, reverseUntil: 0
      };
    });
    var p = S.player;
    p.tx = tx; p.ty = ty; p.x = tx * TILE; p.y = ty * TILE;
    p.dir = dir || 'down'; p.moving = false;
    camSnap = true;
    if (S.mode === 'play' && saveGame() === false) {
      // Nessun avanzamento solo in RAM: se la coppia save non committa, anche
      // la porta torna allo stato precedente. Player può riprovare.
      if (previous) {
        S.mapId = previous.mapId; S.map = previous.map; S.npcs = previous.npcs; camSnap = previous.camSnap;
        p.tx = previous.player.tx; p.ty = previous.player.ty; p.x = previous.player.x; p.y = previous.player.y;
        p.dir = previous.player.dir; p.moving = previous.player.moving;
      }
      return false;
    } // porta attraversata in partita: persisti posizione o rollback
    if (GAME.EnvironmentReactions) GAME.EnvironmentReactions.reset(id);
    // arrivo su una mappa con monologo d'apertura una tantum (solo browser, solo in partita,
    // solo la prima volta: il flag "once" viene salvato con S.flags dal saveGame qui sopra)
    var oe = S.map.onEnter;
    if (oe && oe.dialogue && oe.once && typeof document !== 'undefined' &&
        S.mode === 'play' && !S.flags[oe.once]) {
      S.flags[oe.once] = true;
      startDialogue(oe.dialogue);
    }
    return true;
  }

  /* ---------------- salvataggio (localStorage) ---------------- */

  var SAVE_KEY = 'tp_save';

  function saveGame() {
    if (typeof localStorage === 'undefined') return true;
    try {
      var snapshot = {
        mapId: S.mapId, tx: S.player.tx, ty: S.player.ty, dir: S.player.dir,
        clues: S.clues, flags: S.flags
      };
      // Save classico + envelope narrativo devono avanzare come coppia.
      // Il participant scrive entrambi; il fallback diretto vale solo prima
      // che il runtime narrativo abbia completato il boot.
      if (GAME.NarrativeProduction && GAME.NarrativeProduction.onClassicSave) {
        var coordinated = GAME.NarrativeProduction.onClassicSave(JSON.parse(JSON.stringify(snapshot)));
        if (coordinated && coordinated.handled) {
          E.lastSaveError = coordinated.ok ? null : (coordinated.error || 'classic_save_failed');
          return !!coordinated.ok;
        }
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
      E.lastSaveError = null;
      return true;
    } catch (e) { E.lastSaveError = String(e && e.message || e); return false; }
  }

  function loadSave() {
    if (typeof localStorage === 'undefined') return null;
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  // R103 apriva nuove partite nella radura arrival. Se quel save non contiene
  // ancora alcun progresso, trattalo come nuova partita: evita che cache locali
  // riportino il giocatore al vecchio punto dopo il fix dello spawn.
  function isLegacyOpeningSave(save) {
    if (!save || save.mapId !== 'arrival' || save.tx !== 4 || save.ty !== 3 ||
        (save.dir || 'up') !== 'up' || (save.clues || []).length !== 0) return false;
    var flagKeys = Object.keys(save.flags || {});
    return flagKeys.every(function (key) { return key === 'intro_town'; });
  }

  function clearSave() {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignora */ }
  }

  function hasSave() {
    if (typeof localStorage === 'undefined') return false;
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  }

  // Un save non basta sia JSON ben formato: la posizione deve appartenere al
  // catalogo mappe realmente caricato e indicare una tile calpestabile. Questa
  // funzione e' condivisa col participant narrativo, cosi' titolo e recovery
  // applicano lo stesso confine semantico prima di chiamare loadMap().
  function inspectClassicSaveState(save) {
    var shapeValid = save && typeof save === 'object' && !Array.isArray(save) &&
      typeof save.mapId === 'string' && save.mapId.length > 0 &&
      Number.isInteger(save.tx) && Number.isInteger(save.ty) &&
      ['up', 'down', 'left', 'right'].indexOf(save.dir) >= 0 &&
      (save.clues === undefined || Array.isArray(save.clues)) &&
      (save.flags === undefined || (save.flags && typeof save.flags === 'object' && !Array.isArray(save.flags)));
    if (!shapeValid) return { ok: false, error: 'classic_save_invalid_shape' };

    var map = GAME.Maps && GAME.Maps[save.mapId];
    if (!map || !Array.isArray(map.rows)) return { ok: false, error: 'classic_save_invalid_map' };
    var row = map.rows[save.ty];
    if (save.ty < 0 || save.tx < 0 || typeof row !== 'string' || save.tx >= row.length) {
      return { ok: false, error: 'classic_save_out_of_bounds' };
    }
    var collisionState = { clues: (save.clues || []).slice(), flags: save.flags || {} };
    if (!GAME.Maps.isSolid || GAME.Maps.isSolid(save.mapId, save.tx, save.ty, collisionState)) {
      return { ok: false, error: 'classic_save_invalid_tile' };
    }
    return { ok: true, state: save };
  }

  // Ripristino boot-safe: usato dal titolo e dal checkpoint del finale.
  // loadMap gira ancora in `title`, quindi non risalva una town fresca e non
  // attiva onEnter; solo dopo mondo e coordinate validi passiamo a `play`.
  function restoreClassicSave(save) {
    var inspected = inspectClassicSaveState(save);
    if (!inspected.ok) return inspected;
    S.clues = (save.clues || []).slice();
    S.flags = JSON.parse(JSON.stringify(save.flags || {}));
    S.mode = 'title';
    loadMap(save.mapId, save.tx, save.ty, save.dir);
    S.mode = 'play';
    return { ok: true, mapId: S.mapId, tx: S.player.tx, ty: S.player.ty, dir: S.player.dir };
  }

  // Snapshot RAM completo del sottoinsieme mutato da loadMap/restoreClassicSave.
  // Map e roster precedenti restano referenze vive ma scollegate durante il
  // restore sincrono; ripristinarle evita coppie impossibili mapId/map/NPC.
  function captureWorldState() {
    if (!S || !S.player) return null;
    return {
      mode: S.mode,
      mapId: S.mapId,
      map: S.map,
      npcs: S.npcs,
      player: JSON.parse(JSON.stringify(S.player)),
      clues: S.clues.slice(),
      flags: JSON.parse(JSON.stringify(S.flags || {})),
      camSnap: camSnap
    };
  }
  function restoreWorldState(snapshot) {
    if (!S || !snapshot || !snapshot.player || !Array.isArray(snapshot.npcs)) return false;
    S.mode = snapshot.mode;
    S.mapId = snapshot.mapId;
    S.map = snapshot.map;
    S.npcs = snapshot.npcs;
    Object.keys(S.player).forEach(function (key) { delete S.player[key]; });
    Object.keys(snapshot.player).forEach(function (key) { S.player[key] = snapshot.player[key]; });
    S.clues = snapshot.clues.slice();
    S.flags = JSON.parse(JSON.stringify(snapshot.flags || {}));
    camSnap = snapshot.camSnap;
    return true;
  }

  var r3d = false;

  E.init = function (cv, glcv) {
    canvas = cv;
    // Il renderer retro ha un solo buffer logico. Riparalo anche quando un
    // host/test ha mutato gli attributi del canvas prima del boot.
    if (canvas.width !== VW) canvas.width = VW;
    if (canvas.height !== VH) canvas.height = VH;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    if (glcv && GAME.Render3D && GAME.Render3D.init(glcv)) {
      r3d = true; // motore 3D WebGL attivo: il canvas 2D fa solo da overlay UI
    }
    if (!r3d && false) {
      offCv = document.createElement('canvas');
      offCv.width = OFF_W; offCv.height = OFF_H;
      octx = offCv.getContext('2d');
      octx.imageSmoothingEnabled = false;
      entCv = document.createElement('canvas'); // scratch per i billboard dei personaggi
      entCv.width = 48; entCv.height = 60;
      ectx = entCv.getContext('2d');
      ectx.imageSmoothingEnabled = false;
      buildWarp(VH * SCALE);
    }
    S = E.state = freshState();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearHeldInputs);
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }
  };

  E.loadMap = loadMap;
  // Narrow world-event adapter. Future outputs can consume the same fact here.
  E.emitEnvironmentEvent = function (event) {
    return GAME.EnvironmentReactions ? GAME.EnvironmentReactions.handle(event) : 0;
  };
  E.inspectClassicSaveState = inspectClassicSaveState;
  E.restoreClassicSave = restoreClassicSave;
  E.captureWorldState = captureWorldState;
  E.restoreWorldState = restoreWorldState;
  E.checkCond = checkCond;
  E.resolveDialogue = resolveDialogue;
  E.introPages = function () {
    return introPages().map(function (p) {
      return { sourceIndex: p.sourceIndex, part: p.part, parts: p.parts, lines: p.lines.slice() };
    });
  };
  E.introLayout = function () {
    var l = introLayout();
    var titleWidth = RF.measure('FEBBRAIO, 1989', 1);
    return {
      canvasWidth: UW, canvasHeight: VH,
      boxX: l.boxX, boxY: l.boxY, boxW: l.boxW, boxH: l.boxH,
      innerLeft: l.boxX + 10, innerRight: l.boxX + l.boxW - 10,
      titleWidth: titleWidth,
      titleFits: titleWidth <= l.boxW - 20,
      bodyLastBottom: l.bodyY + 6 * l.lineGap + 7,
      promptY: l.promptY,
      contentFitsVertically: l.bodyY + 6 * l.lineGap + 7 < l.promptY && l.promptY + 7 < l.boxY + l.boxH
    };
  };
  E.npcActive = function (n, st) {
    if (!n.cond) return true;
    if (Object.prototype.toString.call(n.cond) === '[object Array]') {
      // array di condizioni = AND (es. Maddy: ['flag:atto4', '!flag:gigante2'])
      for (var i = 0; i < n.cond.length; i++) if (!checkCond(n.cond[i], st)) return false;
      return true;
    }
    return checkCond(n.cond, st);
  };

  E.onResize = function () {
    // Mai derivare coordinate UI dai pixel CSS/device: causava prologo largo
    // quanto il browser ma alto solo 144px, quindi testo enorme e tagliato.
    UW = VW;
    if (!canvas) return;
    if (canvas.width !== VW) canvas.width = VW;
    if (canvas.height !== VH) canvas.height = VH;
    if (ctx) ctx.imageSmoothingEnabled = false;
  };

  E.start = function () {
    loadMap(START_MAP, START_TX, START_TY, START_DIR);
    // Costruisce e compila la scena iniziale mentre il titolo 3D la copre.
    // Il primo frame giocabile non paga così il cold path WebGL.
    if (GAME.Render3D && GAME.Render3D.prewarm && typeof window !== 'undefined') {
      window.setTimeout(function () {
        if (S.mode === 'title') GAME.Render3D.prewarm('town', []);
      }, 700);
    }
    last = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    requestAnimationFrame(loop);
    // fallback: se il rAF è sospeso (tab nascosta/occlusa) il gioco continua via timer
    if (typeof document !== 'undefined') {
      setInterval(function () {
        var n = (typeof performance !== 'undefined') ? performance.now() : Date.now();
        if (n - lastTick > 200) tick(n);
      }, 100);
    }
  };

  /* ---------------- input ---------------- */

  // vero durante una sessione narrativa (visita/widget): il gameplay è in lease
  function narrativeActive() {
    return !!((GAME.NarrativeAdapter && GAME.NarrativeAdapter.active()) ||
      (GAME.NarrativeFinaleProduction && GAME.NarrativeFinaleProduction.isActive()));
  }

  function audioSfx(name, options) {
    if (GAME.Audio && typeof GAME.Audio.playSfx === 'function') {
      GAME.Audio.playSfx(name, options || {});
    }
  }

  function onKeyDown(e) {
    var a = KEYMAP[e.code];
    if (!a) return;
    if (narrativeActive()) return; // input in lease alla UI narrativa
    e.preventDefault();
    if (a === 'up' || a === 'down' || a === 'left' || a === 'right') {
      // Il fascicolo possiede il D-pad finche' e' aperto: le frecce verticali
      // scorrono gli indizi, quelle orizzontali vengono assorbite e nessuna
      // direzione resta in coda per il movimento alla chiusura.
      if (S && S.menu) {
        clearHeldInputs();
        if (S.menuDocument) {
          if (a === 'up' || a === 'left') moveDocumentPage(-1);
          else if (a === 'down' || a === 'right') moveDocumentPage(1);
        } else {
          if (a === 'up') moveMenuSelection(-1);
          else if (a === 'down') moveMenuSelection(1);
        }
        return;
      }
      if (held.indexOf(a) < 0) {
        held.push(a);
        queuedDirection = a;
      }
      return;
    }
    if (e.repeat) return;
    if (a === 'A') pressA();
    else if (a === 'B') pressB();
    else if (a === 'N') pressN();
  }

  function onKeyUp(e) {
    var a = KEYMAP[e.code];
    if (!a) return;
    var i = held.indexOf(a);
    if (i >= 0) held.splice(i, 1);
  }

  function clearHeldInputs() {
    held.length = 0;
    queuedDirection = null;
  }

  function onVisibilityChange() {
    if (typeof document !== 'undefined' && document.hidden) clearHeldInputs();
  }

  function normalizeMenuIndex() {
    var count = S.clues.length;
    if (!count) { S.menuIndex = 0; return; }
    S.menuIndex = clamp(S.menuIndex || 0, 0, count - 1);
  }

  function moveMenuSelection(delta) {
    var count = S.clues.length;
    if (!count) return;
    normalizeMenuIndex();
    S.menuIndex = (S.menuIndex + delta + count) % count;
    audioSfx('page');
  }

  function selectedClueDocument() {
    normalizeMenuIndex();
    if (!S.clues.length) return null;
    var clue = GAME.Data.clues[S.clues[S.menuIndex]];
    if (!clue || !clue.document || !Array.isArray(clue.document.pages) || !clue.document.pages.length) return null;
    return clue.document;
  }

  function openSelectedClue() {
    if (!selectedClueDocument()) return false;
    S.menuDocument = true;
    S.menuPage = 0;
    caseUiSignature = '';
    audioSfx('page');
    return true;
  }

  function closeDocument() {
    S.menuDocument = false;
    S.menuPage = 0;
    caseUiSignature = '';
    audioSfx('menu_close');
  }

  function moveDocumentPage(delta) {
    var doc = selectedClueDocument();
    if (!doc) { closeDocument(); return; }
    var next = clamp((S.menuPage || 0) + delta, 0, doc.pages.length - 1);
    if (next === S.menuPage) return;
    S.menuPage = next;
    caseUiSignature = '';
    audioSfx('page');
  }

  function setMenu(open) {
    S.menu = !!open;
    S.menuDocument = false;
    S.menuPage = 0;
    caseUiSignature = '';
    clearHeldInputs();
    if (S.menu) normalizeMenuIndex();
    audioSfx(S.menu ? 'menu_open' : 'menu_close');
  }

  function pressA() {
    if (S.fadePhase !== 0) return;
    if (S.mode === 'title') {
      var save = loadSave();
      if (isLegacyOpeningSave(save)) {
        clearSave();
        S.mode = 'intro'; S.introPage = 0;
      } else if (save) { // riprendi la partita salvata
        restoreClassicSave(save);
      } else {
        S.mode = 'intro'; S.introPage = 0;
      }
      return;
    }
    if (S.mode === 'intro') {
      S.introPage++;
      audioSfx('page');
      if (S.introPage >= introPages().length) {
        S.mode = 'play';
        // la mappa iniziale e' stata caricata da E.start() mentre si era ancora al
        // titolo (onEnter non poteva scattare, mode non era 'play'): ricarica ora
        // che si e' davvero in partita, cosi' il monologo d'arrivo puo' partire.
        loadMap(S.mapId, S.player.tx, S.player.ty, S.player.dir);
      }
      return;
    }
    if (S.mode === 'end') {
      var pages = endPages();
      if ((S.endPage || 0) < pages.length - 1) { S.endPage = (S.endPage || 0) + 1; audioSfx('page'); return; }
      S = E.state = freshState(); loadMap(START_MAP, START_TX, START_TY, START_DIR); return;
    }
    if (S.mode !== 'play') return;
    if (S.dialogue) { advanceDialogue(); return; }
    if (S.menu) {
      if (!S.menuDocument) { openSelectedClue(); return; }
      var doc = selectedClueDocument();
      if (doc && S.menuPage < doc.pages.length - 1) moveDocumentPage(1);
      else closeDocument();
      return;
    }
    interact();
  }

  function pressB() {
    if (S.mode === 'title') { pressN(); return; } // su touch il tasto B = nuova partita
    if (S.mode !== 'play' || S.fadePhase !== 0 || S.dialogue) return;
    if (S.menu && S.menuDocument) { closeDocument(); return; }
    setMenu(!S.menu);
  }

  function pressN() { // titolo: N forza una partita nuova, scartando il salvataggio
    if (S.mode !== 'title') return;
    clearSave();
    S.mode = 'intro'; S.introPage = 0;
  }

  /* ---------------- dialoghi ---------------- */

  // valuta una condizione di gating: 'cluesN' (indizi >= N, es. legacy 'clues3'),
  // 'flag:nome' / '!flag:nome'. st opzionale: stato {clues,flags} alternativo,
  // usato dal walkthrough per simulare partite senza toccare lo stato reale.
  function checkCond(c, st) {
    st = st || S;
    if (!c) return false;
    if (Object.prototype.toString.call(c) === '[object Array]') {
      for (var i = 0; i < c.length; i++) if (!checkCond(c[i], st)) return false;
      return true;
    }
    if (typeof c !== 'string') return false;
    // Il layer classico può leggere prove narrative senza copiarle in flag
    // legacy. Uno stato esplicito con `evidence` resta simulabile dai test;
    // nel gioco il resolver consulta lo stato posseduto dall'adapter.
    var narrativeState = st && st.evidence ? st : null;
    if (!narrativeState && (!st || st === S) && GAME.NarrativeAdapter && GAME.NarrativeAdapter.getState) {
      narrativeState = GAME.NarrativeAdapter.getState();
    }
    if (c.indexOf('evidence:') === 0) return !!(narrativeState && narrativeState.evidence && narrativeState.evidence[c.slice(9)]);
    if (c.indexOf('nflag:') === 0) return !!(narrativeState && narrativeState.flags && narrativeState.flags[c.slice(6)]);
    var m = /^clues(\d+)$/.exec(c);
    if (m) return !!(st && st.clues) && st.clues.length >= +m[1];
    if (c.indexOf('!flag:') === 0) return !(st && st.flags && st.flags[c.slice(6)]);
    if (c.indexOf('flag:') === 0) return !!(st && st.flags && st.flags[c.slice(5)]);
    return false;
  }

  function resolveDialogue(d, st) {
    if (typeof d === 'string') return d;
    if (!d) return null;
    if (Array.isArray(d)) { // cascata: prima condizione vera vince, un elemento senza cond e' il fallback
      for (var i = 0; i < d.length; i++) {
        var entry = d[i];
        if (typeof entry === 'string') return entry;
        if (!entry.cond) return entry.then;
        if (checkCond(entry.cond, st)) return entry.then;
      }
      return null;
    }
    if (d.cond) return checkCond(d.cond, st) ? d.then : d.else;
    return d.else || d.then;
  }

  function startDialogue(id) {
    if (!id) return;
    var def = GAME.Data.dialogues[id];
    if (!def) { if (typeof console !== 'undefined') console.warn('dialogo mancante:', id); return; }
    var done = !!S.flags['done_' + id];
    var sourcePages = (done && def.again) ? def.again.pages : def.pages;
    var pages = sourcePages;
    if (typeof document !== 'undefined') {
      pages = [];
      sourcePages.forEach(function (page) {
        var lines = RF.wrapChars(String(page.text || '').replace(/§/g, String(S.clues.length)), 24);
        if (!lines.length) lines = [''];
        for (var li = 0; li < lines.length; li += 2) {
          var pair = lines.slice(li, li + 2);
          if (RF.balanceFixedPair) pair = RF.balanceFixedPair(pair, 24);
          pages.push({
            name: page.name || '', portrait: page.portrait || '',
            text: pair.join('\n')
          });
        }
      });
    }
    S.dialogue = { id: id, def: def, pages: pages, i: 0, replay: done };
    audioSfx('dialogue');
  }

  function advanceDialogue() {
    var d = S.dialogue;
    d.i++;
    if (d.i < d.pages.length) { audioSfx('page'); return; }
    S.dialogue = null;
    // Ispezioni ambientali sono osservazioni ripetibili: non diventano stato
    // di missione e non producono nemmeno il flag tecnico done_<dialogue>.
    if (!d.replay && !d.def.transient) {
      var acquired = false;
      if (d.def.give) {
        d.def.give.forEach(function (c) {
          if (S.clues.indexOf(c) < 0) { S.clues.push(c); acquired = true; }
        });
      }
      if (d.def.setFlag) S.flags[d.def.setFlag] = true;
      S.flags['done_' + d.id] = true;
      if (acquired) audioSfx('acquire');
      if (d.def.end) { S.mode = 'end'; clearSave(); return; }
    }
  }

  /* ---------------- interazione / movimento ---------------- */

  function npcAt(x, y) {
    for (var i = 0; i < S.npcs.length; i++) {
      if (S.npcs[i].x === x && S.npcs[i].y === y && E.npcActive(S.npcs[i])) return S.npcs[i];
    }
    return null;
  }

  function npcReservesTile(n, x, y) {
    if (!E.npcActive(n)) return false;
    if (n.x === x && n.y === y) return true;
    return !!(n.moving && n.mx === x && n.my === y);
  }

  function npcReservingTile(x, y, self) {
    for (var i = 0; i < S.npcs.length; i++) {
      var n = S.npcs[i];
      if (n !== self && npcReservesTile(n, x, y)) return n;
    }
    return null;
  }

  function dirVector(d) {
    if (d === 'up') return { dx: 0, dy: -1 };
    if (d === 'down') return { dx: 0, dy: 1 };
    if (d === 'left') return { dx: -1, dy: 0 };
    return { dx: 1, dy: 0 };
  }

  function tileBlockedForNPC(nx, ny, self) {
    if (GAME.Maps.isSolid(S.mapId, nx, ny, S)) return true;
    if (GAME.Maps.doorAt(S.mapId, nx, ny)) return true; // NPCs avoid doors
    var p = S.player;
    if (p.tx === nx && p.ty === ny) return true;
    if (p.moving && p.mx === nx && p.my === ny) return true;
    return !!npcReservingTile(nx, ny, self);
  }

  function updateNPCs(dt) {
    var p = S.player;
    for (var i = 0; i < S.npcs.length; i++) {
      var n = S.npcs[i];
      if (!E.npcActive(n)) { n.moving = false; continue; }
      if (n.moving) {
        var tx = n.mx * TILE, ty = n.my * TILE;
        var dx = tx - n.moveStartX * TILE, dy = ty - n.moveStartY * TILE;
        n.moveT += dt * NPC_SPEED / TILE;
        if (n.moveT >= 1) {
          n.x = n.mx; n.y = n.my; n.vx = n.x; n.vy = n.y; n.moving = false;
          n.nextThink = tGlobal + 800 + Math.random() * 1500;
        } else {
          var e = n.moveT * n.moveT * (3 - 2 * n.moveT);
          n.vx = n.moveStartX + (n.mx - n.moveStartX) * e;
          n.vy = n.moveStartY + (n.my - n.moveStartY) * e;
        }
      } else if (tGlobal >= n.nextThink &&
          !(GAME.CharacterActivity && GAME.CharacterActivity.managedActor && GAME.CharacterActivity.managedActor(n.id) && !n.wander) &&
          !(GAME.CharacterActivity && GAME.CharacterActivity.busy(n.id))) {
        n.nextThink = tGlobal + 1500 + Math.random() * 3500;
        var dirs = ['up', 'down', 'left', 'right'];
        var look = dirs[Math.floor(Math.random() * 4)];
        n.dir = look;
        if (n.wander) {
          var dist = Math.abs(n.x - p.tx) + Math.abs(n.y - p.ty);
          if (dist > 5 && Math.random() < 0.35) {
            var v = dirVector(look);
            var nx = n.x + v.dx, ny = n.y + v.dy;
            if (Math.abs(nx - n.homeX) <= NPC_WANDER_RADIUS && Math.abs(ny - n.homeY) <= NPC_WANDER_RADIUS && !tileBlockedForNPC(nx, ny, n)) {
              n.mx = nx; n.my = ny; n.moving = true;
              n.moveStartX = n.x; n.moveStartY = n.y;
              n.moveT = 0;
            }
          }
        }
      }
    }
  }

  function opposite(d) {
    return d === 'up' ? 'down' : d === 'down' ? 'up' : d === 'left' ? 'right' : 'left';
  }

  function interact() {
    var p = S.player, dx = 0, dy = 0;
    if (p.dir === 'up') dy = -1; else if (p.dir === 'down') dy = 1;
    else if (p.dir === 'left') dx = -1; else dx = 1;
    var fx = p.tx + dx, fy = p.ty + dy;
    var npc = npcAt(fx, fy);
    // banconi: se la casella davanti e' solida e senza oggetto authored, ma
    // subito oltre c'e' un NPC (Norma dietro il banco, Lucy alla reception),
    // il giocatore parla attraverso il bancone invece di ispezionare il legno.
    if (!npc && GAME.Maps.isSolid(S.mapId, fx, fy, S) && !GAME.Maps.objectAt(S.mapId, fx, fy)) {
      var across = npcAt(fx + dx, fy + dy);
      if (across) npc = across;
    }
    if (npc) {
      npc.dir = opposite(p.dir);
      if (GAME.CharacterActivity && GAME.CharacterActivity.reactToInteractor) GAME.CharacterActivity.reactToInteractor(npc,S);
      audioSfx('interact');
      if (GAME.NarrativeFinaleProduction && GAME.NarrativeFinaleProduction.tryInteract(S.mapId, npc.id)) return;
      // attori narrativi: l'adapter (se attivo per questo attore) gestisce la visita
      if (GAME.NarrativeAdapter && GAME.NarrativeAdapter.tryInteract(S.mapId, npc.id)) return;
      startDialogue(resolveDialogue(npc.dialogue));
      return;
    }
    // target fisici del finale (cartello sud) hanno precedenza sull'oggetto
    // classico: il finale consuma solo la propria soglia attiva.
    if (GAME.NarrativeFinaleProduction && GAME.NarrativeFinaleProduction.tryInteractAt &&
        GAME.NarrativeFinaleProduction.tryInteractAt(S.mapId, fx, fy)) {
      audioSfx('interact');
      return;
    }
    // target ambientali narrativi (object/landmark/sign): l'adapter risolve
    // genericamente la casella verso il proprio registro di target
    if (GAME.NarrativeAdapter && GAME.NarrativeAdapter.tryInteractAt &&
        GAME.NarrativeAdapter.tryInteractAt(S.mapId, fx, fy)) {
      audioSfx('interact');
      return;
    }
    var obj = GAME.Maps.objectAt(S.mapId, fx, fy);
    if (obj) {
      audioSfx('interact');
      startDialogue(resolveDialogue(obj.dialogue));
      return;
    }
    // Ultima precedenza: una tile solida priva di interazione authored riceve
    // un'osservazione di Cooper. Terreno, porte e spazio vuoto restano muti.
    if (GAME.EnvironmentalInspect && GAME.EnvironmentalInspect.resolve) {
      var environmental = GAME.EnvironmentalInspect.resolve(S.mapId, fx, fy, S);
      if (environmental) {
        audioSfx('interact');
        startDialogue(environmental);
      }
    }
  }

  function bumpMsg(id) {
    if (tGlobal - S.lastBump < 700) return;
    S.lastBump = tGlobal;
    audioSfx('blocked');
    startDialogue(id);
  }

  function tryStep(d) {
    var p = S.player, dx = 0, dy = 0;
    if (d === 'up') dy = -1; else if (d === 'down') dy = 1;
    else if (d === 'left') dx = -1; else dx = 1;
    var nx = p.tx + dx, ny = p.ty + dy;
    var door = GAME.Maps.doorAt(S.mapId, nx, ny);
    if (door && door.locked) { bumpMsg(door.dialogue); return; }
    if (door && door.needsFlag && !S.flags[door.needsFlag]) { bumpMsg(door.blockedMsg); return; }
    if (door && door.needsClues && S.clues.length < door.needsClues) { bumpMsg(door.blockedMsg || 'woods_blocked'); return; }
    if (GAME.Maps.isSolid(S.mapId, nx, ny, S)) return;
    if (npcReservingTile(nx, ny, null)) return;
    p.mx = nx; p.my = ny; p.moving = true;
    p.moveStartX = p.tx; p.moveStartY = p.ty;
    p.moveT = 0;
    // dust: spawn later in render3d
  }

  function onArrive() {
    var door = GAME.Maps.doorAt(S.mapId, S.player.tx, S.player.ty);
    if (!door || door.locked) return;
    if (door.needsFlag && !S.flags[door.needsFlag]) return;
    if (door.needsClues && S.clues.length < door.needsClues) return;
    if (door.departureReaction) E.emitEnvironmentEvent({type:'ENTITY_ENTERED_DOORWAY',
      sceneId:S.mapId,arrivalKey:S.player.tx+','+S.player.ty,entityId:'player',
      connectionId:door.connectionId,reactionId:door.departureReaction});
    audioSfx('door');
    S.warp = door;
    S.fadePhase = 1;
  }

  /* ---------------- update ---------------- */

  function update(dt) {
    tGlobal += dt;
    if(GAME.CharacterActivity) GAME.CharacterActivity.update(dt,S);
    if (GAME.AmbientLife && S.mode === 'play') GAME.AmbientLife.update(dt, S.mapId);
    // Preserve the opening pose while the destination is hidden by the warp fade.
    if (GAME.EnvironmentReactions && S.mode === 'play' && S.fadePhase === 0) GAME.EnvironmentReactions.update(dt, S.mapId);
    if (S.fadePhase === 1) {
      S.fade += dt / 180;
      if (S.fade >= 1) {
        S.fade = 1;
        // Un frame nero completo precede build/upload/compile. La fase 3
        // assorbe il cold path senza bloccare un'immagine a metà dissolvenza.
        S.fadePhase = 3;
      }
    } else if (S.fadePhase === 3) {
      var w = S.warp; S.warp = null;
      if (w && GAME.Render3D && GAME.Render3D.prewarm) {
        GAME.Render3D.prewarm(w.to, S.clues);
      }
      if (w) {
        var fromMapId=S.mapId,fromDoorKey=S.player.tx+','+S.player.ty;
        if (loadMap(w.to,w.tx,w.ty,w.dir)) E.emitEnvironmentEvent({type:'ENTITY_ENTERED_DOORWAY',
          sceneId:w.to,arrivalKey:w.tx+','+w.ty,fromMapId:fromMapId,fromDoorKey:fromDoorKey,
          entityId:'player',connectionId:w.connectionId});
      }
      S.fadePhase = 2;
    } else if (S.fadePhase === 2) {
      S.fade -= dt / 180;
      if (S.fade <= 0) { S.fade = 0; S.fadePhase = 0; }
    }
    if (S.mode !== 'play' || S.dialogue || S.menu || S.fadePhase !== 0 || narrativeActive()) return;
    var p = S.player;
    if (p.moving) {
      var tx = p.mx * TILE, ty = p.my * TILE;
      var dx = tx - p.moveStartX * TILE, dy = ty - p.moveStartY * TILE;
      var total = TILE; // sempre un tile alla volta
      p.moveT += dt * SPEED / total;
      if (p.moveT >= 1) {
        p.x = tx; p.y = ty; p.tx = p.mx; p.ty = p.my; p.moving = false;
        var footRow = S.map.rows[p.ty] || '';
        audioSfx('footstep', { surface: footRow.charAt(p.tx) });
        onArrive();
        // Se la stessa direzione resta tenuta, prenota subito la tile seguente:
        // elimina il frame morto fra due passi senza cambiare durata/velocita'
        // del singolo passo. Porte, dialoghi e collisioni restano autorita'.
        if (S.fadePhase === 0 && !S.dialogue && held.length &&
            held[held.length - 1] === p.dir) {
          tryStep(p.dir);
        }
      } else {
        var e = p.moveT * p.moveT * (3 - 2 * p.moveT); // smoothstep
        p.x = p.moveStartX * TILE + dx * e;
        p.y = p.moveStartY * TILE + dy * e;
      }
    } else if (held.length || queuedDirection) {
      var d = held.length ? held[held.length - 1] : queuedDirection;
      if (p.dir !== d) {
        // turn-in-place: girati e aspetta un micro-frame prima di partire
        p.dir = d;
        // A short changed-direction tap is consumed by this turn. A key held
        // through the delay still walks; a released tap must not force a step
        // onto a walkable interaction target (e.g. the Roadhouse phone).
        if (queuedDirection === d) queuedDirection = null;
        p.turnUntil = tGlobal + 60;
      } else if (tGlobal >= (p.turnUntil || 0)) {
        if (queuedDirection === d) queuedDirection = null;
        tryStep(d);
      }
    }
    updateNPCs(dt);
  }

  /* ---------------- rendering ---------------- */

  var RF = GAME.RetroFont;
  function fontScale(font) {
    var m = /(\d+)px/.exec(font || ''), n = m ? +m[1] : 8;
    return n >= 20 ? 3 : n >= 14 ? 2 : 1;
  }

  function text(str, x, y, color, font, align) {
    return RF.draw(ctx, str, x, y, color || '#183225', { scale: fontScale(font), align: align || 'left' });
  }

  function wrap(str, maxW) {
    return RF.wrapPixels(str, maxW, 1);
  }

  function box(x, y, w, h) {
    RF.frame(ctx, x, y, w, h);
  }

  function rule(x, y, w, color) {
    ctx.fillStyle = color || '#394566';
    ctx.fillRect(x, y, w, 1);
  }

  function fitText(str, maxW) {
    return RF.fit(str, maxW, 1);
  }

  function drawNameplate(name, x, y) {
    var label = String(name || '').toUpperCase();
    var w = RF.measure(label, 1) + 14;
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(x + 2, y + 2, w, 14);
    ctx.fillStyle = '#35111b';
    ctx.fillRect(x, y, w, 14);
    ctx.strokeStyle = '#c9b878';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 13);
    ctx.fillStyle = '#7d3142';
    ctx.fillRect(x + 3, y + 3, 2, 8);
    text(label, x + 8, y + 3, '#f5efcf', 'bold 7px monospace');
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // terreno + strutture + sparkle su un contesto, finestra (cx,cy,vw,vh) in px mondo
  function paintGround(g, cx, cy, vw, vh) {
    var map = S.map, rows = map.rows;
    /* Stanza d'arrivo: fondale authored, centrato nel viewport 256x192.
     * Collisioni restano nella mappa ASCII; raster non eredita ingombri 16px. */
    if (map.id === 'arrival' && GAME.Retro2D && GAME.Retro2D.drawArrivalBackdrop) {
      GAME.Retro2D.drawArrivalBackdrop(g, cx, cy, vw, vh);
      return;
    }
    /* Sprite di alberi e tetti superano la cella 16px che li ancora. Senza
     * overdraw, la camera che attraversa un confine tile li faceva apparire
     * o sparire prima che la sagoma avesse lasciato davvero il viewport. */
    var overdraw = 2;
    var x0 = Math.floor(cx / TILE) - overdraw, y0 = Math.floor(cy / TILE) - overdraw;
    var x1 = Math.floor((cx + vw - 1) / TILE) + overdraw;
    var y1 = Math.floor((cy + vh - 1) / TILE) + overdraw;
    var opts = {
      woodsOpen: S.clues.length >= 3,
      t: tGlobal,
      mapId: S.mapId,
      indoor: !!map.indoor,
      viewportWidth: vw,
      viewportHeight: vh
    };
    var x, y, mx, my;
    for (y = y0; y <= y1; y++) {
      for (x = x0; x <= x1; x++) {
        // fuori mappa: estendi il tile del bordo (muri/alberi continuano)
        mx = clamp(x, 0, map.width - 1); my = clamp(y, 0, map.height - 1);
        GAME.Sprites.drawTile(g, rows[my][mx], x * TILE - cx, y * TILE - cy, mx, my, rows, opts);
      }
    }
    // strutture volumetriche (case 3D) sopra i tile, sotto le entità
    if (GAME.sprites && GAME.sprites.drawStructures) {
      GAME.sprites.drawStructures(g, map, cx, cy, opts);
    }
    // oggetti (sparkle cercabile)
    (map.objects || []).forEach(function (o) {
      if (o.type !== 'sparkle') return;
      // cascata (es. cameraLaura): la scintilla sparisce quando UNA qualsiasi variante e' gia' stata letta
      var ids = Array.isArray(o.dialogue)
        ? o.dialogue.map(function (e) { return typeof e === 'string' ? e : e.then; })
        : [resolveDialogue(o.dialogue, S)];
      var read = ids.some(function (id) { return id && S.flags['done_' + id]; });
      if (!read && ids[0]) {
        GAME.Sprites.drawSparkle(g, o.x * TILE - cx, o.y * TILE - cy, tGlobal);
      }
    });
  }

  // lista entità (player + npc) ordinata per profondità (y dei piedi)
  function entityList() {
    var p = S.player;
    var arrivalOx = S.mapId === 'arrival' ? 48 : 0;
    var arrivalOy = S.mapId === 'arrival' ? 24 : 0;
    var ents = S.npcs.filter(function (n) { return E.npcActive(n); }).map(function (n) {
      return { id:n.id, wx: Math.round(n.vx * TILE) + arrivalOx, wy: Math.round(n.vy * TILE) + arrivalOy, sprite: n.sprite, dir: n.dir,
               fr: n.moving ? walkPhase(n.moveT) : 0,
               moving: n.moving || false, alpha: n.sprite === 'laura' ? 0.85 : 1 };
    });
    ents.push({ id:'cooper', wx: Math.round(p.x) + arrivalOx + (S.mapId === 'arrival' ? 8 : 0), wy: Math.round(p.y) + arrivalOy - (S.mapId === 'arrival' ? 1 : 0), sprite: 'cooper', dir: p.dir,
                /* Un tile contiene sempre l'intero ciclo: contatto, A,
                 * contatto, B. Il passo non dipende dall'istante globale in
                 * cui il tasto viene premuto e non puo' iniziare a meta'. */
                fr: p.moving ? walkPhase(p.moveT) : 0,
                moving: p.moving, alpha: 1 });
    ents.sort(function (a, b) { return a.wy - b.wy; });
    return ents;
  }

  // mondo piatto (fallback node / canvas 1x): terreno + entità senza proiezione
  function paintWorld(g, cx, cy, vw, vh) {
    paintGround(g, cx, cy, vw, vh);
    if (GAME.Retro2D && GAME.Retro2D.limitBackgroundPalettes) {
      GAME.Retro2D.limitBackgroundPalettes(g, cx, cy, vw, vh, S.mapId);
    }
    if (GAME.Diorama) GAME.Diorama.groundLight(g, S.map, cx, cy, vw, vh, tGlobal);
    var entities = entityList();
    if (GAME.AmbientLife) GAME.AmbientLife.draw(g,S.mapId,cx,cy,-Infinity,entities.length?entities[0].wy+TILE:Infinity);
    if (GAME.EnvironmentReactions) GAME.EnvironmentReactions.draw(g,S.mapId,cx,cy,-Infinity,entities.length?entities[0].wy+TILE:Infinity);
    entities.forEach(function (e, index) {
      var pal = GAME.Sprites.CHARS[e.sprite] || GAME.Sprites.CHARS.cooper;
      if (GAME.Diorama) GAME.Diorama.actorGround(g, S.map, e, cx, cy, tGlobal);
      GAME.Sprites.drawChar(g, e.wx - cx, e.wy - cy, pal, e.dir, e.fr, e.alpha, e.moving, S.mapId === 'woods', tGlobal, {mapId:S.mapId,wx:e.wx,wy:e.wy,npcId:e.id,characterLife:GAME.CharacterActivity&&GAME.CharacterActivity.actorPose?GAME.CharacterActivity.actorPose(e.id):null});
      /* Painter's algorithm completo. Alberi erano tutti nel ground pass,
       * quindi Cooper compariva davanti anche quando suoi piedi erano a nord
       * della radice. Dopo ogni attore ridisegniamo sola fascia di alberi fra
       * suoi piedi e quelli del prossimo attore: NPC e player mantengono
       * entrambi profondita' corretta, senza ombre sopra sprite. */
      if (GAME.sprites && GAME.sprites.drawForegroundStructures) {
        var footY = e.wy + TILE;
        var nextFootY = index + 1 < entities.length ? entities[index + 1].wy + TILE : Infinity;
        GAME.sprites.drawForegroundStructures(g, S.map, cx, cy, {
          mapId: S.mapId,
          indoor: !!S.map.indoor,
          viewportWidth: vw,
          viewportHeight: vh,
          forestDepthMin: footY,
          forestDepthMax: nextFootY
        });
        if (GAME.AmbientLife) GAME.AmbientLife.draw(g,S.mapId,cx,cy,footY,nextFootY);
        if (GAME.EnvironmentReactions) GAME.EnvironmentReactions.draw(g,S.mapId,cx,cy,footY,nextFootY);
      }
    });
    if (GAME.Diorama) GAME.Diorama.atmosphere(g, S.map, cx, cy, vw, vh, tGlobal);
  }

  // camera con easing verso il centro del giocatore
  function updateCamera(dt, vw, vh) {
    var map = S.map, p = S.player;
    var mw = map.width * TILE, mh = map.height * TILE;
    var txx = mw > vw ? clamp(p.x + 8 - vw / 2, 0, mw - vw) : (mw - vw) / 2;
    var tyy = mh > vh ? clamp(p.y + 8 - vh / 2, 0, mh - vh) : (mh - vh) / 2;
    /* Look-ahead Gen II: quando Cooper guarda un landmark, il frame mostra
     * il volume intero invece di tagliarne il tetto. Due tile verso nord,
     * uno sugli altri assi; nessun cambio a coordinate o collisioni. */
    if (!S.dialogue && !map.indoor) {
      if (p.dir === 'up' && mh > vh) tyy = clamp(tyy - 24, 0, mh - vh);
      else if (p.dir === 'down' && mh > vh) tyy = clamp(tyy + 16, 0, mh - vh);
      if (p.dir === 'left' && mw > vw) txx = clamp(txx - 16, 0, mw - vw);
      else if (p.dir === 'right' && mw > vw) txx = clamp(txx + 16, 0, mw - vw);
    }
    /* Nel reference dialogo e ritratto occupano il terzo inferiore: alza il
     * soggetto nel mondo visibile, invece di lasciarlo dietro la UI. */
    if (S.dialogue && !map.indoor && mh > vh) tyy = clamp(tyy + 12, 0, mh - vh);
    /* Lobby 20x12: al ritorno dalla 315 il normale follow taglia quasi
     * tutto il camino occidentale. Un tile di anticipo verso ovest tiene
     * lounge e scala nello stesso frame senza alterare coordinate o porte. */
    if (map.id === 'hotel_gn' && p.ty <= 4 && mw > vw) {
      txx = clamp(txx - 16, 0, mw - vw);
    }
    /* Soggiorno Palmer: porta, tavolo, divano e camino devono condividere
     * frame. Look-ahead solo visivo; griglia e interazioni restano identiche. */
    if (map.id === 'palmer' && p.ty >= 7 && mh > vh) {
      tyy = clamp(tyy - 16, 0, mh - vh);
    }
    /* Il frame Lodge di riferimento tiene Cooper a x~72 e lascia piu'
     * respiro a destra: offset costante di mezzo metatile, senza spostare
     * arte oltre i confini delle tile o alterare collisioni. */
    if (map.id === 'woods' && mw > vw) txx = clamp(txx - 8, 0, mw - vw);
    if (camSnap) { camX = txx; camY = tyy; camSnap = false; return; }
    var k = 1 - Math.exp(-dt * 0.012);
    camX += (txx - camX) * k;
    camY += (tyy - camY) * k;
  }

  function drawWorld(dt) {
    if (r3d) { // motore 3D: mondo su WebGL, qui non si disegna nulla
      GAME.Render3D.render(S, dt || 16, tGlobal);
      return;
    }
    if (!octx) { // fallback piatto (node / canvas 1x)
      updateCamera(dt || 16, VW, VH);
      paintWorld(ctx, Math.round(camX), Math.round(camY), VW, VH);
      return;
    }
    updateCamera(dt || 16, WVW, WVH);
    // 1) terreno 2x sull'offscreen (sub-pixel: offset camera a mezzi pixel mondo)
    var cxr = Math.round(camX * 2) / 2, cyr = Math.round(camY * 2) / 2;
    octx.setTransform(1, 0, 0, 1, 0, 0);
    octx.clearRect(0, 0, OFF_W, OFF_H);
    octx.setTransform(2, 0, 0, 2, 0, 0);
    paintGround(octx, cxr, cyr, WVW, WVH);
    // 2) composito prospettico del terreno a strisce (schiacciato da PITCH)
    var w = VW * SCALE, h = VH * SCALE;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var i, sw, sx;
    for (i = 0; i < h; i++) {
      sw = warpSW[i];
      sx = (OFF_W - sw) / 2;
      ctx.drawImage(offCv, sx, warpSY[i], sw, PITCH / warpS[i], 0, i, w, 1);
    }
    // 3) entità come billboard NON schiacciati, scalati con la distanza
    entityList().forEach(function (e) {
      var footOff = (e.wy + TILE - cyr) * 2;            // riga offscreen dei piedi
      if (footOff < 0 || footOff >= OFF_H) return;
      var di = destOf[Math.floor(footOff)];             // riga schermo
      var s = warpS[di];                                // scala prospettica a quella riga
      // sprite 24x30 disegnato 1x sullo scratch 48x60
      ectx.setTransform(1, 0, 0, 1, 0, 0);
      ectx.clearRect(0, 0, 48, 60);
      var pal = GAME.Sprites.CHARS[e.sprite] || GAME.Sprites.CHARS.cooper;
      GAME.Sprites.drawChar(ectx, 0, 0, pal, e.dir, e.fr, 1, e.moving, S.mapId === 'woods', tGlobal, {mapId:S.mapId,wx:e.wx,wy:e.wy,npcId:e.id,characterLife:GAME.CharacterActivity&&GAME.CharacterActivity.actorPose?GAME.CharacterActivity.actorPose(e.id):null}); // piedi a y ~52
      // posizione schermo: centro X proiettato alla scala della riga
      var offX = (e.wx + 12 - cxr) * 2;
      var scrX = (offX - (OFF_W - warpSW[di]) / 2) * s;
      var dw = 48 * s, dh = 60 * s;
      if (e.alpha < 1) ctx.globalAlpha = e.alpha;
      ctx.drawImage(entCv, scrX - dw / 2, di - 52 * s, dw, dh);
      ctx.globalAlpha = 1;
    });
  }

  function drawDialogue() {
    var d = S.dialogue;
    var page = d.pages[d.i];
    var Portraits = GAME.Portraits;
    var uiInk = Portraits ? Portraits.palette.ink : '#181818';
    // Box e card non consumano righe: testo conserva due righe complete.
    var bw = Math.min(UW - 8, 248);
    var bx = Math.floor((UW - bw) / 2);
    /* Reference R69: mondo 95 px, box 49 px. Card termina a y=104;
     * testo parte a y=111: sette pixel nativi di respiro dal ritratto. */
    var by = VH - 53, bh = 49;
    if (Portraits) Portraits.frame(ctx, bx, by, bw, bh);
    else RF.frame(ctx, bx, by, bw, bh);
    var str = page.text.replace(/§/g, String(S.clues.length));
    var lines = RF.wrapFixed(str, bw - 16, 1);
    if (RF.balanceFixedPair) lines = RF.balanceFixedPair(lines, 24);
    var displayTypography = typeof document !== 'undefined' &&
      typeof document.getElementById === 'function' &&
      document.getElementById('speaker-dialogue-hires');
    if (!displayTypography) {
      for (var i = 0; i < Math.min(2, lines.length); i++) {
        RF.drawFixed(ctx, lines[i], bx + 11, by + 16 + i * 11, uiInk);
      }
    }
    // Affordance persistente: la freccia sola non spiegava come continuare.
    // Resta nel bordo inferiore, fuori dalle due righe narrative.
    if (!displayTypography) {
      RF.draw(ctx, GAME.touchMode ? 'A AVANTI >' : 'INVIO AVANTI >',
        bx + bw - 10, by + 39, uiInk, { align: 'right' });
    }
    if (Portraits) Portraits.drawCard(ctx, page.portrait, page.name, bx + 9, by - 37);
  }

  function drawMenu() {
    ctx.fillStyle = 'rgba(24,50,37,0.78)';
    ctx.fillRect(0, 0, UW, VH);
    var mw = Math.min(UW - 10, 280);
    var mx = Math.floor((UW - mw) / 2);
    var px = mx + 9, innerW = mw - 18;
    box(mx, 4, mw, 136);

    var openDocument = S.menuDocument ? selectedClueDocument() : null;
    if (openDocument) {
      drawMenuDocument(mx, mw, px, innerW, openDocument);
      return;
    }

    // Gerarchia: fascicolo -> obiettivo attivo -> inventario prove.
    text('FASCICOLO // CASO PALMER', px, 10, '#183225', 'bold 8px monospace');
    text('OBIETTIVO ATTIVO', px, 22, '#63834a', 'bold 6px monospace');
    var objective = wrap(GAME.Data.objectiveFor(S, checkCond), innerW);
    for (var oi = 0; oi < Math.min(2, objective.length); oi++) {
      text(objective[oi], px, 30 + oi * 10, '#183225', '8px monospace');
    }
    rule(px, 51, innerW, '#6f6040');

    var count = S.clues.length;
    normalizeMenuIndex();
    text('PROVE RACCOLTE', px, 56, '#31543a', 'bold 7px monospace');
    if (!S.clues.length) {
      text('0', mx + mw - 10, 56, '#183225', 'bold 7px monospace', 'right');
      text('Nessun indizio raccolto.', px, 72, '#183225');
      ctx.fillStyle = '#c3d879';
      ctx.fillRect(px, 108, innerW, 22);
      text('NOTE DI COOPER', px + 6, 115, '#31543a', '7px monospace');
    } else {
      var visible = 4;
      var start = clamp(S.menuIndex - 1, 0, Math.max(0, count - visible));
      var end = Math.min(count, start + visible);
      text((start + 1) + '-' + end + ' / ' + count, mx + mw - 22, 56, '#63834a', '6px monospace', 'right');
      if (start > 0) text('▲', mx + mw - 14, 69, '#31543a', '7px monospace');
      if (end < count) text('▼', mx + mw - 14, 101, '#31543a', '7px monospace');
      for (var i = start; i < end; i++) {
        var c = GAME.Data.clues[S.clues[i]];
        var rowY = 68 + (i - start) * 10;
        var selected = i === S.menuIndex;
        if (selected) {
          ctx.fillStyle = '#31543a';
          ctx.fillRect(px, rowY - 1, innerW, 10);
          ctx.fillStyle = '#63834a';
          ctx.fillRect(px, rowY - 1, 2, 10);
        }
        text(selected ? '›' : '·', px + 5, rowY, selected ? '#f5efcf' : '#63834a', '7px monospace');
        text(fitText(c ? c.name : S.clues[i], innerW - 24), px + 14, rowY,
             selected ? '#f5efcf' : '#183225', '7px monospace');
      }

      var selectedClue = GAME.Data.clues[S.clues[S.menuIndex]];
      var desc = selectedClue && selectedClue.desc ? selectedClue.desc : 'Nessuna annotazione disponibile.';
      ctx.fillStyle = '#c3d879';
      ctx.fillRect(px, 108, innerW, 22);
      ctx.fillStyle = '#63834a';
      ctx.fillRect(px, 108, 2, 22);
      var descLines = wrap(desc, innerW - 13);
      for (var di = 0; di < Math.min(2, descLines.length); di++) {
        text(descLines[di], px + 7, 112 + di * 9, '#183225', '7px monospace');
      }
    }
    rule(px, 132, innerW, '#394566');
    var selectedDoc = selectedClueDocument();
    text(GAME.touchMode
           ? (selectedDoc ? 'TOCCA APRI  SCORRI  X CHIUDE' : 'SCORRI  X CHIUDE')
           : (selectedDoc ? 'SU/GIU CAMBIA  INVIO APRE  X CHIUDE' : 'SU/GIU CAMBIA  X CHIUDE'),
         mx + mw / 2, 133, '#31543a', '6px monospace', 'center');
  }

  function drawMenuDocument(mx, mw, px, innerW, doc) {
    var page = doc.pages[S.menuPage] || doc.pages[0];
    text(fitText('DOCUMENTO // ' + String(doc.title || 'PROVA').toUpperCase(), innerW - 38), px, 10,
         '#183225', 'bold 7px monospace');
    text((S.menuPage + 1) + ' / ' + doc.pages.length, mx + mw - 10, 10,
         '#63834a', '6px monospace', 'right');
    rule(px, 23, innerW, '#6f6040');
    text(String(page.label || 'PAGINA').toUpperCase(), px, 31, '#63834a', 'bold 7px monospace');
    ctx.fillStyle = '#f5efcf';
    ctx.fillRect(px, 43, innerW, 78);
    ctx.fillStyle = '#668448';
    ctx.fillRect(px, 43, 2, 78);
    var lines = wrap(page.text || '', innerW - 14);
    for (var i = 0; i < Math.min(8, lines.length); i++) {
      text(lines[i], px + 8, 50 + i * 9, '#183225', '7px monospace');
    }
    rule(px, 132, innerW, '#394566');
    text(GAME.touchMode ? 'SCORRI PAGINE  TOCCA AVANTI  X INDIETRO' : '< > PAGINE  INVIO AVANTI  X INDIETRO',
         mx + mw / 2, 133, '#31543a', '6px monospace', 'center');
  }

  /* Fascicolo HTML: font Verdana a risoluzione schermo. Il renderer bitmap
   * resta fallback per harness e ambienti senza DOM completo. */
  function syncCaseUi() {
    if (typeof document === 'undefined' || !document.body ||
        typeof document.getElementById !== 'function') return false;
    var rootEl = document.getElementById('case-ui');
    var listEl = document.getElementById('case-evidence-list');
    var objectiveEl = document.getElementById('case-objective-copy');
    var countEl = document.getElementById('case-count');
    var headingEl = document.getElementById('case-heading-copy');
    var noteEl = document.getElementById('case-note');
    var helpEl = document.getElementById('case-help');
    var documentEl = document.getElementById('case-document');
    var documentTitleEl = document.getElementById('case-document-title');
    var documentLabelEl = document.getElementById('case-document-label');
    var documentCopyEl = document.getElementById('case-document-copy');
    var active = !!(rootEl && S.mode === 'play' && S.menu);
    document.body.setAttribute('data-menu', active ? 'true' : 'false');
    if (rootEl) rootEl.setAttribute('aria-hidden', active ? 'false' : 'true');
    if (!active || !listEl || !objectiveEl || !countEl || !headingEl || !noteEl || !helpEl) return false;

    var objective = GAME.Data.objectiveFor(S, checkCond);
    var signature = [S.menuIndex, S.menuDocument ? 'document' : 'list', S.menuPage || 0,
      S.clues.join('|'), objective, GAME.touchMode ? 'touch' : 'keys'].join('::');
    if (signature === caseUiSignature) return true;
    caseUiSignature = signature;
    normalizeMenuIndex();

    var openDocument = S.menuDocument ? selectedClueDocument() : null;
    document.body.setAttribute('data-case-view', openDocument ? 'document' : 'list');
    if (openDocument && documentEl && documentTitleEl && documentLabelEl && documentCopyEl) {
      var page = openDocument.pages[S.menuPage] || openDocument.pages[0];
      headingEl.textContent = 'Documento · ' + (openDocument.title || 'Prova');
      countEl.textContent = 'Pagina ' + (S.menuPage + 1) + ' / ' + openDocument.pages.length;
      documentTitleEl.textContent = openDocument.title || 'Documento repertato';
      documentLabelEl.textContent = page.label || 'Pagina repertata';
      documentCopyEl.textContent = page.text || '';
      while (helpEl.firstChild) helpEl.removeChild(helpEl.firstChild);
      if (GAME.touchMode) {
        helpPart('SCORRI SU / GIÙ', 'sfoglia pagine');
        helpPart('TOCCA', S.menuPage < openDocument.pages.length - 1 ? 'pagina seguente' : 'torna al fascicolo');
        helpPart('X', 'torna al fascicolo');
      } else {
        helpPart('FRECCE', 'sfogliano pagine');
        helpPart('INVIO oppure Z', S.menuPage < openDocument.pages.length - 1 ? 'pagina seguente' : 'torna al fascicolo');
        helpPart('ESC oppure X', 'torna al fascicolo');
      }
      return true;
    }

    S.menuDocument = false;
    S.menuPage = 0;
    document.body.setAttribute('data-case-view', 'list');
    headingEl.textContent = 'Fascicolo · Caso Palmer';

    objectiveEl.textContent = objective;
    countEl.textContent = S.clues.length + ' / ' + Object.keys(GAME.Data.clues).length;
    while (listEl.firstChild) listEl.removeChild(listEl.firstChild);

    if (!S.clues.length) {
      var emptyEl = document.createElement('div');
      emptyEl.className = 'case-evidence';
      emptyEl.textContent = 'Nessuna prova raccolta.';
      listEl.appendChild(emptyEl);
      noteEl.textContent = 'Esamina luoghi, oggetti e persone. Cooper annoterà qui ciò che conta.';
    } else {
      var visible = 4;
      var start = clamp(S.menuIndex - 1, 0, Math.max(0, S.clues.length - visible));
      var end = Math.min(S.clues.length, start + visible);
      for (var i = start; i < end; i++) {
        var clue = GAME.Data.clues[S.clues[i]];
        var item = document.createElement('div');
        item.className = 'case-evidence' + (i === S.menuIndex ? ' is-selected' : '');
        item.textContent = (i === S.menuIndex ? 'Selezionata: ' : '') + (clue ? clue.name : S.clues[i]);
        listEl.appendChild(item);
      }
      var selected = GAME.Data.clues[S.clues[S.menuIndex]];
      noteEl.textContent = selected && selected.desc
        ? selected.desc
        : 'Nessuna annotazione disponibile.';
    }

    while (helpEl.firstChild) helpEl.removeChild(helpEl.firstChild);
    function helpPart(key, copy) {
      var span = document.createElement('span');
      var kbd = document.createElement('kbd');
      kbd.textContent = key;
      span.appendChild(kbd);
      span.appendChild(document.createTextNode(' ' + copy));
      helpEl.appendChild(span);
    }
    if (GAME.touchMode) {
      helpPart('SCORRI SU / GIÙ', 'cambia prova');
      if (selectedClueDocument()) helpPart('TOCCA', 'apre documento');
      helpPart('X', 'chiude fascicolo');
    } else {
      helpPart('FRECCE ↑ / ↓', 'cambiano prova');
      if (selectedClueDocument()) helpPart('INVIO oppure Z', 'apre documento');
      helpPart('ESC oppure X', 'chiude fascicolo');
    }
    return true;
  }

  function curtainRows(yTop, n) {
    var fakeRows = ['RRRRRRRRRRRRRRR', 'RRRRRRRRRRRRRRR'];
    var cols = Math.ceil(UW / TILE);
    for (var r = 0; r < n; r++) {
      for (var x = 0; x < cols; x++) {
        GAME.Sprites.drawTile(ctx, 'R', x * TILE, yTop + r * TILE, x % 15, r, fakeRows, {});
      }
    }
  }

  function drawTitle() {
    var touch = !!GAME.touchMode;
    var save = hasSave();
    // Cartolina Game Boy: cielo, doppia catena con due cime innevate,
    // due file di abeti, prato e insegna del Benvenuti sui pali.
    ctx.fillStyle = '#9abf5a'; ctx.fillRect(0, 0, UW, VH);
    // Cresta lontana: piu' chiara e bassa, stacca il monte principale.
    ctx.fillStyle = '#8ab252';
    ctx.beginPath(); ctx.moveTo(0, 88); ctx.lineTo(30, 62); ctx.lineTo(64, 86);
    ctx.lineTo(104, 58); ctx.lineTo(150, 88); ctx.lineTo(196, 60); ctx.lineTo(UW, 84);
    ctx.lineTo(UW, 104); ctx.lineTo(0, 104); ctx.fill();
    // Monte principale con le due vette.
    ctx.fillStyle = '#63834a';
    ctx.beginPath(); ctx.moveTo(0, 76); ctx.lineTo(48, 28); ctx.lineTo(88, 72);
    ctx.lineTo(132, 20); ctx.lineTo(198, 75); ctx.lineTo(UW, 48); ctx.lineTo(UW, 104);
    ctx.lineTo(0, 104); ctx.fill();
    // Nevai a gradini sulle due vette, in crema come il pannello insegna.
    ctx.fillStyle = '#f5efcf';
    ctx.beginPath(); ctx.moveTo(40, 38); ctx.lineTo(44, 31); ctx.lineTo(48, 34);
    ctx.lineTo(52, 30); ctx.lineTo(56, 38); ctx.lineTo(52, 36); ctx.lineTo(44, 36);
    ctx.fill();
    ctx.beginPath(); ctx.moveTo(123, 31); ctx.lineTo(128, 24); ctx.lineTo(132, 27);
    ctx.lineTo(137, 23); ctx.lineTo(141, 31); ctx.lineTo(136, 29); ctx.lineTo(128, 29);
    ctx.fill();
    // Prato sotto la foresta, appena piu' scuro del cielo, con ciuffi e fiori.
    ctx.fillStyle = '#93b957'; ctx.fillRect(0, 104, UW, 48);
    ctx.fillStyle = '#63834a';
    for (var gx = 6; gx < UW; gx += 22) {
      var gh = 2 + ((gx * 5) % 3);
      ctx.fillRect(gx, 146 - gh, 6, gh);
    }
    ctx.fillStyle = '#f5efcf';
    for (var fx = 15; fx < UW; fx += 29) ctx.fillRect(fx, 128 + ((fx * 3) % 12), 2, 2);
    // Due file di abeti sovrapposte: il fondo chiaro resta sul monte,
    // il davanti scuro copre il prato. Triangoli larghi e ravvicinati.
    function titlePine(color, base, spacing, offset, minH, varH, w) {
      ctx.fillStyle = color;
      for (var tx = -offset; tx < UW + w; tx += spacing) {
        var h = minH + ((tx * 7) % varH + varH) % varH;
        ctx.beginPath(); ctx.moveTo(tx, base); ctx.lineTo(tx + w / 2, base - h);
        ctx.lineTo(tx + w, base); ctx.fill();
        ctx.fillRect(tx + w / 2 - 1, base - 3, 2, 5);
      }
    }
    titlePine('#557a44', 108, 14, 4, 20, 10, 14);
    titlePine('#31543a', 114, 16, 6, 24, 12, 18);
    // Pali dell'insegna: escono dal bordo e scendono nella fila di abeti.
    ctx.fillStyle = '#183225';
    ctx.fillRect(64, 86, 4, 28); ctx.fillRect(188, 86, 4, 28);
    ctx.fillStyle = '#f5efcf';
    ctx.fillRect(64, 86, 1, 28); ctx.fillRect(188, 86, 1, 28);
    ctx.fillStyle = '#183225'; ctx.fillRect(10, 37, UW - 20, 49);
    ctx.fillStyle = '#f5efcf'; ctx.fillRect(13, 40, UW - 26, 43);
    ctx.strokeStyle = '#63834a'; ctx.strokeRect(16.5, 43.5, UW - 33, 36);
    text('TWIN PEAKS', UW / 2, 50, '#183225', 'bold 14px monospace', 'center');
    // Il font bitmap usa scala intera: 6px e 7px producono entrambi scala 1.
    // Il maiuscolo misurava 147px e finiva sotto la cornice; il titolo misto
    // misura 125px e resta intero nel bordo interno da 127px.
    text('Mistero di Laura Palmer', UW / 2, 69, '#31543a', '7px monospace', 'center');
    ctx.fillStyle = '#183225'; ctx.fillRect(0, VH - 40, UW, 40);
    if (Math.floor(tGlobal / 500) % 2 === 0) {
      text(save ? (touch ? 'TOCCA: CONTINUA' : 'INVIO: CONTINUA')
                : (touch ? 'TOCCA PER INIZIARE' : 'PREMI INVIO'),
           UW / 2, VH - 26, '#f5efcf', 'bold 8px monospace', 'center');
    }
    var hint;
    if (touch) hint = 'D-PAD  A ESAMINA  B PROVE';
    else hint = 'FRECCE MUOVI  INVIO ESAMINA';
    text(hint, UW / 2, VH - 10, '#9abf5a', '7px monospace', 'center');
  }

  function introLayout() {
    var boxW = Math.min(144, UW - 16);
    return {
      boxW: boxW,
      boxX: Math.floor((UW - boxW) / 2),
      boxY: 34,
      boxH: 104,
      titleY: 42,
      dividerY: 53,
      bodyY: 60,
      lineGap: 9,
      // Ultima riga corpo termina a 121; footer 126..132 resta dentro frame.
      promptY: 126
    };
  }

  function drawIntro() {
    ctx.fillStyle = '#31543a'; ctx.fillRect(0, 0, UW, VH);
    ctx.fillStyle = '#63834a';
    for (var x = 0; x < UW; x += 16) {
      ctx.beginPath(); ctx.moveTo(x + 8, 4); ctx.lineTo(x, 34); ctx.lineTo(x + 16, 34); ctx.fill();
      ctx.fillRect(x + 7, 28, 2, 24);
    }
    var l = introLayout();
    RF.frame(ctx, l.boxX, l.boxY, l.boxW, l.boxH);
    // Scala 1: 76px reali dentro 124px utili. La vecchia scala 2 occupava
    // 152px e tagliava entrambe le estremita' del titolo.
    text('FEBBRAIO, 1989', UW / 2, l.titleY, '#31543a', 'bold 8px monospace', 'center');
    rule(l.boxX + 9, l.dividerY, l.boxW - 18, '#63834a');
    var page = introPages()[S.introPage] || { lines: [] };
    var lines = page.lines;
    for (var i = 0; i < lines.length; i++) {
      text(lines[i], l.boxX + 10, l.bodyY + i * l.lineGap, '#183225');
    }
    // Contesto e comando non spariscono: pulsa soltanto la freccia.
    text('PAG. ' + (S.introPage + 1) + '/' + introPages().length,
         l.boxX + 10, l.promptY, '#63834a', '7px monospace');
    var advanceLabel = GAME.touchMode ? 'A' : 'INVIO';
    text(advanceLabel, l.boxX + l.boxW - 18, l.promptY,
         '#31543a', 'bold 8px monospace', 'right');
    if (Math.floor(tGlobal / 500) % 2 === 0) {
      text('>', l.boxX + l.boxW - 10, l.promptY,
           '#31543a', 'bold 8px monospace', 'right');
    }
  }

  // Sette righe entrano fra titolo e prompt. Ogni blocco narrativo occupa
  // una pagina: niente continuazioni quasi vuote o intestazioni ripetute.
  function introPages() {
    var boxW = introLayout().boxW, pages = [];
    (GAME.Data.intro || []).forEach(function (entry, sourceIndex) {
      var lines = wrap(entry, boxW - 20), parts = Math.max(1, Math.ceil(lines.length / 7));
      for (var part = 0; part < parts; part++) {
        pages.push({ sourceIndex: sourceIndex, part: part, parts: parts, lines: lines.slice(part * 7, part * 7 + 7) });
      }
    });
    return pages.length ? pages : [{ sourceIndex: 0, part: 0, parts: 1, lines: [] }];
  }

  function endPages() {
    var source = GAME.Data.endText || ["Twin Peaks tornera'. Grazie per aver giocato."], pages = [], page = [];
    source.forEach(function (line) {
      var wrapped = RF.wrapChars(line, 23);
      if (page.length && page.length + wrapped.length > 5) { pages.push(page); page = []; }
      while (wrapped.length > 5) { pages.push(wrapped.slice(0, 5)); wrapped = wrapped.slice(5); }
      page = page.concat(wrapped);
    });
    if (page.length) pages.push(page);
    return pages.length ? pages : [['FINE.']];
  }

  function drawEnd() {
    var pages = endPages(), pageIndex = clamp(S.endPage || 0, 0, pages.length - 1), lines = pages[pageIndex];
    curtainRows(0, 10);
    RF.frame(ctx, 4, 5, UW - 8, VH - 10);
    text('IL CERCHIO', UW / 2, 15, '#183225', 'bold 16px monospace', 'center');
    text('SI CHIUDE', UW / 2, 31, '#31543a', 'bold 16px monospace', 'center');
    rule(10, 46, UW - 20, '#63834a');
    for (var i = 0; i < lines.length; i++) text(lines[i], 10, 53 + i * 9, '#183225', '8px monospace');
    var total = Object.keys(GAME.Data.clues).length;
    text('PAG. ' + (pageIndex + 1) + '/' + pages.length, 10, 106, '#63834a', '7px monospace');
    text('INDIZI ' + S.clues.length + '/' + total, UW - 10, 106, '#31543a', '7px monospace', 'right');
    rule(10, 117, UW - 20, '#63834a');
    if (Math.floor(tGlobal / 500) % 2 === 0) {
      text(pageIndex < pages.length - 1 ? 'INVIO . PAGINA SEGUENTE' : 'INVIO . TORNA AL TITOLO',
           UW / 2, 124, '#31543a', '8px monospace', 'center');
    }
  }

  function syncCinematicUi() {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
    var kicker = document.getElementById('cinematic-kicker');
    var title = document.getElementById('cinematic-title');
    var body = document.getElementById('cinematic-body');
    var action = document.getElementById('cinematic-action');
    var meta = document.getElementById('cinematic-meta');
    if (!kicker || !title || !body || !action || !meta) return;
    var touch = !!GAME.touchMode;
    if (S.mode === 'title') {
      kicker.textContent = 'CASO 1989  ·  TWIN PEAKS, WASHINGTON';
      title.textContent = '';
      body.textContent = '';
      action.textContent = hasSave()
        ? (touch ? 'TOCCA PER CONTINUARE' : 'INVIO  ·  CONTINUA')
        : (touch ? 'TOCCA PER INIZIARE' : 'INVIO  ·  NUOVA PARTITA');
      meta.textContent = touch
        ? 'D-PAD MUOVI  ·  A INTERAGISCI  ·  B INDIZI'
        : (hasSave()
          ? 'N: NUOVA PARTITA  ·  FRECCE: MUOVI  ·  X: FASCICOLO'
          : 'FRECCE: MUOVI  ·  INVIO: ESAMINA O PARLA  ·  X: FASCICOLO');
    } else if (S.mode === 'intro') {
      var intro = introPages(), introPage = intro[S.introPage] || intro[0];
      kicker.textContent = 'PROLOGO  ·  ' + (S.introPage + 1) + ' / ' + intro.length;
      title.textContent = 'FEBBRAIO, 1989';
      body.textContent = introPage.lines.join('\n');
      action.textContent = touch ? 'TOCCA PER CONTINUARE' : 'INVIO  ·  CONTINUA';
      meta.textContent = 'OGNI SEGRETO LASCIA UNA TRACCIA';
    } else if (S.mode === 'end') {
      kicker.textContent = 'EPILOGO';
      title.textContent = 'IL CERCHIO SI CHIUDE';
      body.textContent = GAME.Data.endText ? GAME.Data.endText.join('\n') : 'Twin Peaks tornerà.';
      action.textContent = touch ? 'TOCCA PER TORNARE' : 'INVIO  ·  TORNA AL TITOLO';
      meta.textContent = 'INDIZI RACCOLTI  ' + S.clues.length + ' / ' + Object.keys(GAME.Data.clues).length;
    }
  }

  function syncDialogueUi() {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
    var canvasActive = !!(S.mode === 'play' && S.dialogue);
    var active = !!(r3d && canvasActive);
    document.body.setAttribute('data-dialogue', active ? 'true' : 'false');
    var live = document.getElementById('dialogue-live');
    if (!canvasActive) { dialogueLiveSignature = ''; if (live) live.textContent = ''; return; }
    var d = S.dialogue;
    var page = d.pages[d.i] || {};
    var liveCopy = (page.name ? page.name + '. ' : '') + String(page.text || '').replace(/§/g, String(S.clues.length));
    var liveSignature = d.id + '|' + d.i + '|' + liveCopy;
    if (live && liveSignature !== dialogueLiveSignature) {
      dialogueLiveSignature = liveSignature;
      live.textContent = liveCopy;
    }
    if (!active) return;
    var speaker = document.getElementById('dialogue-speaker');
    var context = document.getElementById('dialogue-context');
    var copy = document.getElementById('dialogue-text');
    if (!speaker || !copy) return;
    speaker.textContent = page.name || 'APPUNTO';
    if (context) {
      context.textContent = page.name === 'COOPER'
        ? 'REGISTRAZIONE DIANE  ·  CASO PALMER'
        : 'INTERVISTA SUL CAMPO  ·  CASO PALMER';
    }
    copy.textContent = String(page.text || '').replace(/§/g, String(S.clues.length));
  }

  function syncSpeakerPortrait() {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
    var image = document.getElementById('speaker-portrait-hires');
    if (!image) return;
    var page = S.mode === 'play' && S.dialogue
      ? (S.dialogue.pages[S.dialogue.i] || {})
      : null;
    var key = page && GAME.Portraits
      ? GAME.Portraits.resolve(page.name, page.portrait)
      : '';
    var visible = !!(key && GAME.Portraits && GAME.Portraits.faces[key] && !r3d);
    var nextKey = visible ? key : '';
    if (speakerPortraitKey === nextKey) return;
    /* Il widget narrativo (retro-ui.js) puo' possedere lo stesso overlay
     * quando non c'e' un dialogo classico da mostrare: non rubargli il
     * ritratto, altrimenti ogni frame senza S.dialogue lo spegnerebbe. */
    if (!visible && image.getAttribute('data-speaker-source') === 'narrative') return;
    speakerPortraitKey = nextKey;
    image.hidden = true;
    image.removeAttribute('data-speaker-source');
    image.setAttribute('data-speaker', nextKey);
    if (!visible) return;
    var assetRoot = image.getAttribute('data-portrait-root') || 'assets/portraits/hires/';
    var nextSrc = assetRoot + nextKey + '.png';
    image.onload = function () {
      if (speakerPortraitKey === nextKey) image.hidden = false;
    };
    image.onerror = function () {
      if (speakerPortraitKey === nextKey) image.hidden = true;
    };
    if (image.getAttribute('src') !== nextSrc) image.setAttribute('src', nextSrc);
    if (image.complete && image.naturalWidth > 0) image.hidden = false;
  }

  function syncSpeakerTypography() {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
    var name = document.getElementById('speaker-name-hires');
    var box = document.getElementById('speaker-dialogue-hires');
    var advance = document.getElementById('speaker-advance-hires');
    var line1 = document.getElementById('speaker-dialogue-line-1');
    var line2 = document.getElementById('speaker-dialogue-line-2');
    if (!name || !box || !advance || !line1 || !line2) return;
    var active = !!(S.mode === 'play' && S.dialogue && !r3d);
    if (!active) {
      if (speakerTypographySignature) {
        speakerTypographySignature = '';
        name.hidden = true;
        box.hidden = true;
        advance.hidden = true;
      }
      return;
    }
    var page = S.dialogue.pages[S.dialogue.i] || {};
    var raw = String(page.text || '').replace(/§/g, String(S.clues.length));
    var lines = RF.wrapFixed(raw, 144, 1);
    if (RF.balanceFixedPair) lines = RF.balanceFixedPair(lines, 24);
    var key = GAME.Portraits ? GAME.Portraits.resolve(page.name, page.portrait) : '';
    var label = GAME.Portraits && GAME.Portraits.label
      ? GAME.Portraits.label(page.name, key, 36)
      : String(page.name || '');
    var signature = label + '|' + (lines[0] || '') + '|' + (lines[1] || '');
    if (speakerTypographySignature === signature) return;
    speakerTypographySignature = signature;
    name.textContent = label;
    line1.textContent = lines[0] || '';
    line2.textContent = lines[1] || '';
    advance.textContent = GAME.touchMode ? 'A · AVANTI' : 'INVIO · AVANTI';
    name.hidden = false;
    box.hidden = false;
    advance.hidden = false;
  }

  function render(dt) {
    /* Schermata finale ha un solo proprietario. Overlay narrativa viene
     * svuotato/nascosto prima del primo drawEnd, evitando frame compositi. */
    if (GAME.RetroUI && GAME.RetroUI.setEngineOwned) GAME.RetroUI.setEngineOwned(S.mode === 'end');
    if (typeof document !== 'undefined' && document.body) {
      var nextLayoutMode = S.mode === 'play' ? 'play' : 'full';
      if (nextLayoutMode !== uiLayoutMode) {
        uiLayoutMode = nextLayoutMode;
        document.body.setAttribute('data-ui-mode', uiLayoutMode);
      }
      document.body.setAttribute('data-screen', S.mode);
    }
    /* Frame atomico: nessuno stato canvas (alpha/composite/transform) passa
     * dalla scena precedente all'epilogo o a qualunque schermata successiva. */
    if (ctx.setTransform) ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (ctx.setTransform) ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    if (GAME.Presentation3D && GAME.Presentation3D.render) {
      GAME.Presentation3D.render(S.mode, tGlobal, S.introPage);
    }
    syncCinematicUi();
    syncDialogueUi();
    syncSpeakerPortrait();
    syncSpeakerTypography();
    var caseUiActive = syncCaseUi();
    if (S.mode === 'title') { drawTitle(); return; }
    if (S.mode === 'intro') { drawIntro(); return; }
    if (S.mode === 'end') { drawEnd(); return; }
    drawWorld(dt); // (gestisce da sé la trasformazione)
    if (ctx.setTransform) ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    /* Il background e' gia' normalizzato per cella 8x8 da
     * Retro2D.limitBackgroundPalettes prima degli OBJ. Una seconda passata
     * luma-only sul frame composito cancellava le palette materiali e
     * riquantizzava anche personaggi/UI: comportamento opposto ai bank
     * BG/OBJ del Game Boy Color. */
    // WebGL usa il pannello HTML sincronizzato da syncDialogueUi().
    // Disegnare anche il box legacy sul canvas causa un cross-fade visibile:
    // prima compare il vecchio dialogo, poi #dialogue-ui lo sostituisce.
    if (S.dialogue && !r3d) drawDialogue();
    if (S.menu && !caseUiActive) drawMenu();
    if (S.fade > 0) {
      ctx.fillStyle = 'rgba(0,0,0,' + S.fade.toFixed(3) + ')';
      ctx.fillRect(0, 0, UW, VH);
    }
  }

  var lastTick = 0;

  function tick(now) {
    if (now - lastTick < 8) return;
    lastTick = now;
    var dt = Math.min(50, now - last);
    last = now;
    update(dt);
    render(dt);
  }

  function loop(now) {
    tick(now);
    requestAnimationFrame(loop);
  }
})();
