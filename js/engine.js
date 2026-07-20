/* Twin Peaks — Il Mistero di Laura Palmer
 * engine.js — loop di gioco, input, movimento su griglia, camera, rendering,
 * finestre di dialogo in stile GBA, menu indizi, macchina a stati
 * (title -> intro -> play -> end).
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var GAME = root.GAME = root.GAME || {};

  var E = GAME.Engine = {};

  var canvas, ctx, S;
  var last = 0, tGlobal = 0;
  var TILE = 16, VW = 240, VH = 160; // coordinate logiche UI (scalate su canvas)
  var UW = VW;                       // larghezza UI dinamica (fullscreen)
  var SPEED = 0.12; // px per ms (~2px per frame a 60fps)

  /* Renderer prospettico stile Pokémon B/W (Mode7-lite):
   * il mondo è disegnato 2x su un canvas offscreen più largo della vista,
   * poi composto a strisce orizzontali di 1px con scala crescente verso
   * il basso: le righe lontane sono compresse e mostrano più mondo. */
  var SCALE = 2;            // canvas 480x320 = 2x le coordinate UI
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

  /* ---------------- stato ---------------- */

  function freshState() {
    return {
      mode: 'title',           // title | intro | play | end
      mapId: 'town', map: null, npcs: [],
      player: { tx: 28, ty: 22, x: 28 * TILE, y: 22 * TILE, dir: 'up', moving: false, mx: 0, my: 0 },
      clues: [], flags: {},
      introPage: 0,
      dialogue: null,          // {id, def, pages, i, replay}
      menu: false,
      fade: 0, fadePhase: 0,   // 0 niente, 1 uscita, 2 rientro
      warp: null,
      lastBump: -9999
    };
  }

  function loadMap(id, tx, ty, dir) {
    S.mapId = id;
    S.map = GAME.Maps[id];
    S.npcs = (S.map.npcs || []).map(function (n) {
      return { id: n.id, x: n.x, y: n.y, sprite: n.sprite, name: n.name, dialogue: n.dialogue, dir: n.dir || 'down', cond: n.cond };
    });
    var p = S.player;
    p.tx = tx; p.ty = ty; p.x = tx * TILE; p.y = ty * TILE;
    p.dir = dir || 'down'; p.moving = false;
    camSnap = true;
    if (S.mode === 'play') saveGame(); // porta attraversata in partita: persisti la posizione
    // arrivo su una mappa con monologo d'apertura una tantum (solo browser, solo in partita,
    // solo la prima volta: il flag "once" viene salvato con S.flags dal saveGame qui sopra)
    var oe = S.map.onEnter;
    if (oe && oe.dialogue && oe.once && typeof document !== 'undefined' &&
        S.mode === 'play' && !S.flags[oe.once]) {
      S.flags[oe.once] = true;
      startDialogue(oe.dialogue);
    }
  }

  /* ---------------- salvataggio (localStorage) ---------------- */

  var SAVE_KEY = 'tp_save';

  function saveGame() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        mapId: S.mapId, tx: S.player.tx, ty: S.player.ty, dir: S.player.dir,
        clues: S.clues, flags: S.flags
      }));
    } catch (e) { /* file:// o storage non disponibile: ignora */ }
  }

  function loadSave() {
    if (typeof localStorage === 'undefined') return null;
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function clearSave() {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignora */ }
  }

  function hasSave() {
    if (typeof localStorage === 'undefined') return false;
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  }

  var r3d = false;

  E.init = function (cv, glcv) {
    canvas = cv;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    if (glcv && GAME.Render3D && GAME.Render3D.init(glcv)) {
      r3d = true; // motore 3D WebGL attivo: il canvas 2D fa solo da overlay UI
    }
    if (!r3d && typeof document !== 'undefined' && canvas.width >= VW * SCALE) {
      offCv = document.createElement('canvas');
      offCv.width = OFF_W; offCv.height = OFF_H;
      octx = offCv.getContext('2d');
      octx.imageSmoothingEnabled = false;
      entCv = document.createElement('canvas'); // scratch per i billboard dei personaggi
      entCv.width = 32; entCv.height = 48;
      ectx = entCv.getContext('2d');
      ectx.imageSmoothingEnabled = false;
      buildWarp(VH * SCALE);
    } else if (!r3d) {
      SCALE = 1; // fallback piatto (test node / canvas piccolo)
    }
    S = E.state = freshState();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  };

  E.loadMap = loadMap;
  E.checkCond = checkCond;
  E.resolveDialogue = resolveDialogue;
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
    if (canvas && canvas.width) UW = Math.max(VW, Math.round(canvas.width / SCALE));
  };

  E.start = function () {
    loadMap('town', 28, 22, 'up');
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

  function onKeyDown(e) {
    var a = KEYMAP[e.code];
    if (!a) return;
    e.preventDefault();
    if (a === 'up' || a === 'down' || a === 'left' || a === 'right') {
      if (held.indexOf(a) < 0) held.push(a);
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

  function pressA() {
    if (S.fadePhase !== 0) return;
    if (S.mode === 'title') {
      var save = loadSave();
      if (save) { // riprendi la partita salvata
        S.clues = save.clues || []; S.flags = save.flags || {};
        loadMap(save.mapId, save.tx, save.ty, save.dir);
        S.mode = 'play';
      } else {
        S.mode = 'intro'; S.introPage = 0;
      }
      return;
    }
    if (S.mode === 'intro') {
      S.introPage++;
      if (S.introPage >= GAME.Data.intro.length) {
        S.mode = 'play';
        // la mappa iniziale e' stata caricata da E.start() mentre si era ancora al
        // titolo (onEnter non poteva scattare, mode non era 'play'): ricarica ora
        // che si e' davvero in partita, cosi' il monologo d'arrivo puo' partire.
        loadMap(S.mapId, S.player.tx, S.player.ty, S.player.dir);
      }
      return;
    }
    if (S.mode === 'end') { S = E.state = freshState(); loadMap('town', 28, 22, 'up'); return; }
    if (S.mode !== 'play') return;
    if (S.dialogue) { advanceDialogue(); return; }
    if (S.menu) { S.menu = false; return; }
    interact();
  }

  function pressB() {
    if (S.mode === 'title') { pressN(); return; } // su touch il tasto B = nuova partita
    if (S.mode !== 'play' || S.fadePhase !== 0 || S.dialogue) return;
    S.menu = !S.menu;
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
    var m = /^clues(\d+)$/.exec(c);
    if (m) return st.clues.length >= +m[1];
    if (c.indexOf('!flag:') === 0) return !st.flags[c.slice(6)];
    if (c.indexOf('flag:') === 0) return !!st.flags[c.slice(5)];
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
    var pages = (done && def.again) ? def.again.pages : def.pages;
    S.dialogue = { id: id, def: def, pages: pages, i: 0, replay: done };
  }

  function advanceDialogue() {
    var d = S.dialogue;
    d.i++;
    if (d.i < d.pages.length) return;
    S.dialogue = null;
    if (!d.replay) {
      if (d.def.give) {
        d.def.give.forEach(function (c) { if (S.clues.indexOf(c) < 0) S.clues.push(c); });
      }
      if (d.def.setFlag) S.flags[d.def.setFlag] = true;
      S.flags['done_' + d.id] = true;
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

  function opposite(d) {
    return d === 'up' ? 'down' : d === 'down' ? 'up' : d === 'left' ? 'right' : 'left';
  }

  function interact() {
    var p = S.player, dx = 0, dy = 0;
    if (p.dir === 'up') dy = -1; else if (p.dir === 'down') dy = 1;
    else if (p.dir === 'left') dx = -1; else dx = 1;
    var fx = p.tx + dx, fy = p.ty + dy;
    var npc = npcAt(fx, fy);
    if (npc) {
      npc.dir = opposite(p.dir);
      startDialogue(resolveDialogue(npc.dialogue));
      return;
    }
    var obj = GAME.Maps.objectAt(S.mapId, fx, fy);
    if (obj) startDialogue(resolveDialogue(obj.dialogue));
  }

  function bumpMsg(id) {
    if (tGlobal - S.lastBump < 700) return;
    S.lastBump = tGlobal;
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
    if (npcAt(nx, ny)) return;
    if (GAME.Maps.objectAt(S.mapId, nx, ny)) return;
    p.mx = nx; p.my = ny; p.moving = true;
  }

  function onArrive() {
    var door = GAME.Maps.doorAt(S.mapId, S.player.tx, S.player.ty);
    if (!door || door.locked) return;
    if (door.needsFlag && !S.flags[door.needsFlag]) return;
    if (door.needsClues && S.clues.length < door.needsClues) return;
    S.warp = door;
    S.fadePhase = 1;
  }

  /* ---------------- update ---------------- */

  function update(dt) {
    tGlobal += dt;
    if (S.fadePhase === 1) {
      S.fade += dt / 180;
      if (S.fade >= 1) {
        S.fade = 1;
        var w = S.warp; S.warp = null;
        if (w) loadMap(w.to, w.tx, w.ty, w.dir);
        S.fadePhase = 2;
      }
    } else if (S.fadePhase === 2) {
      S.fade -= dt / 180;
      if (S.fade <= 0) { S.fade = 0; S.fadePhase = 0; }
    }
    if (S.mode !== 'play' || S.dialogue || S.menu || S.fadePhase !== 0) return;
    var p = S.player;
    if (p.moving) {
      var step = SPEED * dt;
      var tx = p.mx * TILE, ty = p.my * TILE;
      var dx = tx - p.x, dy = ty - p.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= step || dist === 0) {
        p.x = tx; p.y = ty; p.tx = p.mx; p.ty = p.my; p.moving = false;
        onArrive();
      } else {
        p.x += dx / dist * step;
        p.y += dy / dist * step;
      }
    } else if (held.length) {
      var d = held[held.length - 1];
      p.dir = d;
      tryStep(d);
    }
  }

  /* ---------------- rendering ---------------- */

  function text(str, x, y, color, font, align) {
    ctx.font = font || '8px monospace';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = color || '#ffffff';
    ctx.fillText(str, x, y);
  }

  function wrap(str, maxW) {
    ctx.font = '8px monospace';
    var words = str.split(' '), lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var t = cur ? cur + ' ' + words[i] : words[i];
      if (cur && ctx.measureText(t).width > maxW) { lines.push(cur); cur = words[i]; }
      else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function box(x, y, w, h) {
    ctx.fillStyle = 'rgba(16,20,72,0.95)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // terreno + strutture + sparkle su un contesto, finestra (cx,cy,vw,vh) in px mondo
  function paintGround(g, cx, cy, vw, vh) {
    var map = S.map, rows = map.rows;
    var x0 = Math.floor(cx / TILE), y0 = Math.floor(cy / TILE);
    var x1 = Math.floor((cx + vw - 1) / TILE), y1 = Math.floor((cy + vh - 1) / TILE);
    var opts = { woodsOpen: S.clues.length >= 3, t: tGlobal };
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
      if (o.type === 'sparkle' && typeof o.dialogue === 'string' && !S.flags['done_' + o.dialogue]) {
        GAME.Sprites.drawSparkle(g, o.x * TILE - cx, o.y * TILE - cy, tGlobal);
      }
    });
  }

  // lista entità (player + npc) ordinata per profondità (y dei piedi)
  function entityList() {
    var p = S.player;
    var ents = S.npcs.filter(function (n) { return E.npcActive(n); }).map(function (n) {
      return { wx: n.x * TILE, wy: n.y * TILE, sprite: n.sprite, dir: n.dir, fr: 0,
               alpha: n.sprite === 'laura' ? 0.85 : 1 };
    });
    ents.push({ wx: Math.round(p.x), wy: Math.round(p.y), sprite: 'cooper', dir: p.dir,
                fr: p.moving ? (Math.floor(tGlobal / 120) % 2) : 0, alpha: 1 });
    ents.sort(function (a, b) { return a.wy - b.wy; });
    return ents;
  }

  // mondo piatto (fallback node / canvas 1x): terreno + entità senza proiezione
  function paintWorld(g, cx, cy, vw, vh) {
    paintGround(g, cx, cy, vw, vh);
    entityList().forEach(function (e) {
      var pal = GAME.Sprites.CHARS[e.sprite] || GAME.Sprites.CHARS.cooper;
      GAME.Sprites.drawChar(g, e.wx - cx, e.wy - cy, pal, e.dir, e.fr, e.alpha);
    });
  }

  // camera con easing verso il centro del giocatore
  function updateCamera(dt, vw, vh) {
    var map = S.map, p = S.player;
    var mw = map.width * TILE, mh = map.height * TILE;
    var txx = mw > vw ? clamp(p.x + 8 - vw / 2, 0, mw - vw) : (mw - vw) / 2;
    var tyy = mh > vh ? clamp(p.y + 8 - vh / 2, 0, mh - vh) : (mh - vh) / 2;
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
      // sprite 16x24 (da y-4 a y+16+4 margine) disegnato 2x sullo scratch
      ectx.setTransform(1, 0, 0, 1, 0, 0);
      ectx.clearRect(0, 0, 32, 48);
      ectx.setTransform(2, 0, 0, 2, 0, 0);
      var pal = GAME.Sprites.CHARS[e.sprite] || GAME.Sprites.CHARS.cooper;
      GAME.Sprites.drawChar(ectx, 0, 4, pal, e.dir, e.fr, 1); // piedi a y scratch 40
      // posizione schermo: centro X proiettato alla scala della riga
      var offX = (e.wx + 8 - cxr) * 2;
      var scrX = (offX - (OFF_W - warpSW[di]) / 2) * s;
      var dw = 32 * s, dh = 48 * s;
      if (e.alpha < 1) ctx.globalAlpha = e.alpha;
      ctx.drawImage(entCv, scrX - dw / 2, di - 40 * s, dw, dh);
      ctx.globalAlpha = 1;
    });
  }

  function drawDialogue() {
    var d = S.dialogue;
    var page = d.pages[d.i];
    // box centrato, larghezza leggibile anche a schermo largo
    var bw = Math.min(UW - 4, 360);
    var bx = Math.floor((UW - bw) / 2);
    box(bx, 106, bw, 52);
    var name = page.name || '';
    if (name) {
      var w = name.length * 5 + 10;
      box(bx + 4, 96, w, 11);
      text(name, bx + 9, 98, '#ffe9a8');
    }
    var str = page.text.replace(/§/g, String(S.clues.length));
    var lines = wrap(str, bw - 20);
    for (var i = 0; i < Math.min(3, lines.length); i++) text(lines[i], bx + 8, 112 + i * 11, '#ffffff');
    if (Math.floor(tGlobal / 400) % 2 === 0) text('▼', bx + bw - 12, 150, '#ffffff');
  }

  function drawMenu() {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, UW, VH);
    // 240 di larghezza: la riga obiettivo (fino a ~44 caratteri a ~5px l'uno)
    // deve starci senza sbordare; 180 la tagliava.
    var mw = Math.min(UW - 16, 240);
    var mx = Math.floor((UW - mw) / 2);
    box(mx, 24, mw, 125); // +13 di altezza per la riga obiettivo in cima
    text(GAME.Data.objectiveFor(S, checkCond), mx + 12, 34, '#ffe9a8');
    text('INDIZI (' + S.clues.length + ')', mx + 12, 47, '#ffe9a8');
    if (!S.clues.length) {
      text('Nessun indizio raccolto.', mx + 12, 65, '#c8c8d8');
    } else {
      for (var i = 0; i < S.clues.length; i++) {
        var c = GAME.Data.clues[S.clues[i]];
        text('• ' + (c ? c.name : S.clues[i]), mx + 12, 65 + i * 13, '#ffffff');
      }
    }
    text('X / ESC: chiudi', mx + 12, 137, '#8a8ab0');
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
    ctx.fillStyle = '#080810';
    ctx.fillRect(0, 0, UW, VH);
    curtainRows(0, 2);
    curtainRows(VH - 32, 2);
    // Le tende occupano y 0-32 e VH-32..VH: tutto il testo sta dentro 36..122,
    // ben distanziato (le righe si accavallavano e finivano sotto la tenda).
    // NB: una riga da 8px occupa ~17px logici (ascendenti+discendenti), non 8:
    // misurato sui pixel del canvas. Da qui il passo di 20-24px fra le righe e
    // l'ultima riga a 108 (finisce a ~125, la tenda inferiore inizia a 131).
    var touch = !!GAME.touchMode;
    var save = hasSave();
    text('TWIN PEAKS', UW / 2, 40, '#f0f0f0', 'bold 16px monospace', 'center');
    text('Il Mistero di Laura Palmer', UW / 2, 64, '#c8c8d8', '8px monospace', 'center');
    if (Math.floor(tGlobal / 500) % 2 === 0) {
      text(save ? (touch ? 'TOCCA: CONTINUA' : 'INVIO: CONTINUA')
                : (touch ? 'TOCCA PER INIZIARE' : 'PREMI INVIO'),
           UW / 2, 88, '#ffe9a8', '8px monospace', 'center');
    }
    var hint;
    if (touch) hint = save ? 'B: nuova partita   D-pad: muovi   A: parla' : 'D-pad: muovi   A: parla   B: indizi';
    else hint = save ? 'N: nuova partita   Frecce: muovi   X: indizi' : 'Frecce: muovi   Z/Invio: parla   X: indizi';
    text(hint, UW / 2, 108, '#8a8ab0', '8px monospace', 'center');
  }

  function drawIntro() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, UW, VH);
    var x0 = Math.max(20, Math.floor((UW - 200) / 2));
    var lines = wrap(GAME.Data.intro[S.introPage], 200);
    for (var i = 0; i < lines.length; i++) text(lines[i], x0, 46 + i * 11, '#e8e8e8');
    if (Math.floor(tGlobal / 500) % 2 === 0) {
      text('▼ INVIO', UW / 2, 140, '#8a8ab0', '8px monospace', 'center');
    }
  }

  function drawEnd() {
    ctx.fillStyle = '#080810';
    ctx.fillRect(0, 0, UW, VH);
    curtainRows(0, 10);
    var lines = GAME.Data.endText;
    if (!lines) { // fallback: nessun D.endText -> comportamento precedente
      ctx.fillStyle = 'rgba(10,0,4,0.55)';
      ctx.fillRect(0, 56, UW, 48);
      text('CONTINUA...', UW / 2, 66, '#f0f0f0', 'bold 16px monospace', 'center');
      text('Twin Peaks tornera\'. Grazie per aver giocato.', UW / 2, 88, '#e8c8d0', '8px monospace', 'center');
      if (Math.floor(tGlobal / 500) % 2 === 0) {
        text('INVIO: torna al titolo', UW / 2, 140, '#d0a8b0', '8px monospace', 'center');
      }
      return;
    }
    var boxTop = 38, linesY = boxTop + 28, countY = linesY + lines.length * 11 + 5;
    ctx.fillStyle = 'rgba(10,0,4,0.55)';
    ctx.fillRect(0, boxTop, UW, countY + 10 - boxTop);
    text('IL CERCHIO SI CHIUDE', UW / 2, boxTop + 8, '#f0f0f0', 'bold 16px monospace', 'center');
    for (var i = 0; i < lines.length; i++) {
      text(lines[i], UW / 2, linesY + i * 11, '#e8c8d0', '8px monospace', 'center');
    }
    var total = Object.keys(GAME.Data.clues).length;
    text('Indizi raccolti: ' + S.clues.length + '/' + total, UW / 2, countY, '#ffe9a8', '8px monospace', 'center');
    if (Math.floor(tGlobal / 500) % 2 === 0) {
      text('INVIO: torna al titolo', UW / 2, 140, '#d0a8b0', '8px monospace', 'center');
    }
  }

  function render(dt) {
    if (ctx.setTransform) ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.clearRect(0, 0, UW, VH);
    if (S.mode === 'title') { drawTitle(); return; }
    if (S.mode === 'intro') { drawIntro(); return; }
    if (S.mode === 'end') { drawEnd(); return; }
    drawWorld(dt); // (gestisce da sé la trasformazione)
    if (ctx.setTransform) ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    if (S.dialogue) drawDialogue();
    if (S.menu) drawMenu();
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
