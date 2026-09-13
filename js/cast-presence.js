/* cast-presence.js — Cast Continuity v0.1 resolver (docs/cast-continuity-contract-v0.1.md).
 *
 * Una sola verità derivata su DOVE STA ogni personaggio nominato: per ogni
 * stato narrativo raggiungibile ESATTAMENTE UN risultato fra
 *   PLACED (scena + coordinate) · OFFSCREEN · TERMINAL_REMOVED.
 *
 * Risoluzione (contratto §3, NON negoziabile):
 *   matches = tutte le finestre esplicite che nominano il personaggio e il cui
 *             predicato è vero sullo stato;
 *   1 match  -> quella placement;
 *   >1 match -> HARD ERROR (OVERLAP: mondo autoriale contraddittorio);
 *   0 match  -> baseline autorale; nessuna baseline -> HARD ERROR (NO_PLACEMENT).
 * Nessun first-match-wins, nessuna priorità, nessun ordine: il risultato è
 * indipendente dall'ordine delle finestre e del registro (V4).
 *
 * Puro: nessun side effect, nessuna mutazione dello stato, nessuna scrittura
 * di salvataggio, nessuna dipendenza dalla posizione del giocatore o dal clock.
 * I predicati usano la STESSA semantica delle condizioni di missione
 * (GAME.NarrativeRuntime.evalCond): una seconda implementazione divergerebbe.
 *
 * Sorgente dati: narrative/cast/windows.json, incorporato in
 * js/narrative-data.gen.js come GAME.NarrativeData.cast (generato).
 */
(function () {
  'use strict';
  var G = (typeof window !== 'undefined' ? window : globalThis);
  var GAME = G.GAME = G.GAME || {};
  var CP = GAME.CastPresence = {};

  var STATUS = { PLACED: 'PLACED', OFFSCREEN: 'OFFSCREEN', TERMINAL_REMOVED: 'TERMINAL_REMOVED' };
  CP.STATUS = STATUS;

  function CastPresenceError(code, detail) {
    var e = new Error('CastPresence ' + code + ': ' + JSON.stringify(detail));
    e.name = 'CastPresenceError';
    e.code = code;
    e.detail = detail;
    return e;
  }
  CP.CastPresenceError = CastPresenceError;

  function dataOf(opts) {
    var d = (opts && opts.data) || (GAME.NarrativeData && GAME.NarrativeData.cast) || null;
    if (!d || !d.characters || !d.windows) throw CastPresenceError('NO_DATA', { hint: 'GAME.NarrativeData.cast mancante: rigenerare js/narrative-data.gen.js' });
    return d;
  }
  CP.data = function (opts) { return dataOf(opts); };

  function emptyState() {
    var NR = GAME.NarrativeRuntime;
    if (NR && NR.createState) { try { return NR.createState(); } catch (e) { /* cataloghi non installati: forma minima */ } }
    return { flags: {}, values: {}, evidence: {}, nodes_done: {}, propositions: {} };
  }

  function evalWhen(when, state, opts) {
    if (when == null) return true;
    var ev = (opts && opts.evalCond) || (GAME.NarrativeRuntime && GAME.NarrativeRuntime.evalCond);
    if (!ev) throw CastPresenceError('NO_EVALUATOR', { hint: 'GAME.NarrativeRuntime.evalCond non caricato' });
    return !!ev(state, when, null);
  }

  function fromPlacement(characterId, ch, pl, source, owner, cause) {
    var r = { characterId: characterId, status: pl.status, source: source, owner: owner || null };
    if (pl.status === STATUS.PLACED) {
      r.sceneId = pl.map_id; r.x = pl.x; r.y = pl.y; r.dir = pl.dir || 'down';
      r.body = {
        id: characterId, x: pl.x, y: pl.y, sprite: ch.sprite, name: ch.name,
        dialogue: (pl.dialogue === undefined ? null : pl.dialogue), dir: pl.dir || 'down',
        wander: !!pl.wander, cast_source: source
      };
      // id-attore delle missioni a cui questo corpo risponde (es. hawk → hawk_bridge):
      // riferimento d'interazione autorale, MAI un alias implicito.
      if (Array.isArray(pl.actor_ids) && pl.actor_ids.length) r.body.actor_ids = pl.actor_ids.slice();
    } else if (pl.status === STATUS.OFFSCREEN) {
      r.label = pl.label || null;
    } else if (pl.status === STATUS.TERMINAL_REMOVED) {
      r.event = pl.event || null;
    } else {
      throw CastPresenceError('BAD_PLACEMENT', { characterId: characterId, source: source, placement: pl });
    }
    if (cause) r.cause = cause;
    return r;
  }

  /* resolveCharacterPresence(characterId, storyState, opts?)
   *   opts.data      — dataset alternativo (test)
   *   opts.windows   — lista finestre alternativa, es. mescolata (V4)
   *   opts.evalCond  — valutatore alternativo (test)
   * Lancia CastPresenceError su OVERLAP / NO_PLACEMENT / UNKNOWN_CHARACTER. */
  CP.resolveCharacterPresence = function (characterId, storyState, opts) {
    var D = dataOf(opts);
    var ch = D.characters[characterId];
    if (!ch) throw CastPresenceError('UNKNOWN_CHARACTER', { characterId: characterId });
    var state = storyState || emptyState();
    var windows = (opts && opts.windows) || D.windows;
    var matches = [];
    for (var i = 0; i < windows.length; i++) {
      var w = windows[i];
      if (!w.cast || !Object.prototype.hasOwnProperty.call(w.cast, characterId)) continue;
      if (evalWhen(w.when, state, opts)) matches.push(w);
    }
    if (matches.length > 1) {
      throw CastPresenceError('OVERLAP', {
        characterId: characterId,
        windows: matches.map(function (w) { return w.id; }).sort(),
        placements: matches.map(function (w) { return { window: w.id, owner: w.owner || null, placement: w.cast[characterId] }; })
          .sort(function (a, b) { return a.window < b.window ? -1 : 1; })
      });
    }
    if (matches.length === 1) {
      var m = matches[0];
      return fromPlacement(characterId, ch, m.cast[characterId], m.id, m.owner, m.cause);
    }
    if (ch.baseline) return fromPlacement(characterId, ch, ch.baseline, 'BASELINE', ch.class || null, null);
    throw CastPresenceError('NO_PLACEMENT', { characterId: characterId, hint: 'nessuna finestra vera e nessuna baseline autorale (assenza implicita vietata, V3)' });
  };

  CP.characterIds = function (opts) { return Object.keys(dataOf(opts).characters).sort(); };
  CP.windows = function (opts) { return dataOf(opts).windows.slice(); };

  /* resolveCast(storyState, opts?) -> { characterId: result } per TUTTO il registro
   * (ordine per id, deterministico). Lancia al primo errore. */
  CP.resolveCast = function (storyState, opts) {
    var ids = CP.characterIds(opts), out = {};
    for (var i = 0; i < ids.length; i++) out[ids[i]] = CP.resolveCharacterPresence(ids[i], storyState, opts);
    return out;
  };

  /* tryResolveCast: come resolveCast ma raccoglie gli errori invece di lanciare
   * (per validatori e strumenti di diagnosi). -> { results, errors } */
  CP.tryResolveCast = function (storyState, opts) {
    var ids = CP.characterIds(opts), results = {}, errors = [];
    for (var i = 0; i < ids.length; i++) {
      try { results[ids[i]] = CP.resolveCharacterPresence(ids[i], storyState, opts); }
      catch (e) { errors.push({ characterId: ids[i], code: e.code || 'ERROR', detail: e.detail || String(e && e.message || e) }); }
    }
    return { results: results, errors: errors };
  };

  /* bodiesFor(mapId, storyState, opts?) -> corpi da posare su quella mappa,
   * stessa forma dei record NPC classici (js/glue.js NPCS) senza `cond`:
   * la placement è già decisa qui, il motore non rivaluta nulla. */
  CP.bodiesFor = function (mapId, storyState, opts) {
    var all = CP.resolveCast(storyState, opts), bodies = [];
    Object.keys(all).sort().forEach(function (id) {
      var r = all[id];
      if (r.status === STATUS.PLACED && r.sceneId === mapId) bodies.push(r.body);
    });
    return bodies;
  };

  /* snapshot(storyState, opts?) -> { id: 'PLACED@map x,y [source]' | 'OFFSCREEN(label) [source]' | 'TERMINAL_REMOVED(event) [source]' }
   * Stringhe compatte e ordinate: confrontabili byte-a-byte (V4, V8). */
  CP.format = function (r) {
    if (r.status === STATUS.PLACED) return 'PLACED@' + r.sceneId + ' ' + r.x + ',' + r.y + ' ' + r.dir + ' [' + r.source + ']';
    if (r.status === STATUS.OFFSCREEN) return 'OFFSCREEN(' + (r.label || '') + ') [' + r.source + ']';
    return 'TERMINAL_REMOVED(' + (r.event || '') + ') [' + r.source + ']';
  };
  CP.snapshot = function (storyState, opts) {
    var all = CP.resolveCast(storyState, opts), out = {};
    Object.keys(all).sort().forEach(function (id) { out[id] = CP.format(all[id]); });
    return out;
  };

  /* ---------------- seam di popolazione (Fase 6) ----------------
   * syncMaps(maps, storyState, live?, opts?)
   *   maps  — GAME.Maps (map_id -> { npcs: [...] })
   *   live  — { mapId, npcs } del motore (E.state) oppure null
   * Per OGNI mappa: i corpi dei personaggi del registro sono ESATTAMENTE quelli
   * che il resolver pone lì; ogni altro corpo con id del registro viene tolto.
   * I corpi non del registro (folla anonima, sfondo locale) non sono toccati.
   * Idempotente; ritorna la lista dei cambi. Unico punto in cui il registro
   * tocca il mondo: l'adapter la chiama dove oggi chiama syncNarrativeEntities.
   * `opts.hydrate(body)` dà la forma viva del motore (js/engine.js loadMap). */
  CP.syncMaps = function (maps, storyState, live, opts) {
    var all = CP.resolveCast(storyState, opts);
    var ids = Object.keys(all).sort();
    var owned = {}; ids.forEach(function (id) { owned[id] = true; });
    var wantByMap = {};
    ids.forEach(function (id) {
      var r = all[id];
      if (r.status !== STATUS.PLACED) return;
      (wantByMap[r.sceneId] = wantByMap[r.sceneId] || []).push(r.body);
    });
    var changes = [];
    var hydrate = (opts && opts.hydrate) || function (b) { return b; };
    function reconcile(mapId, list, isLive) {
      var want = wantByMap[mapId] || [];
      var wantById = {}; want.forEach(function (b) { wantById[b.id] = b; });
      for (var i = list.length - 1; i >= 0; i--) {
        var n = list[i];
        if (!owned[n.id]) continue;
        var w = wantById[n.id];
        // dati mappa: la placement deve coincidere; corpo vivo: confronta la
        // posizione di casa (homeX/homeY: il wander sposta x/y ma non la casa),
        // così un cambio di finestra sulla stessa mappa ricolloca il corpo.
        var hx = (isLive && n.homeX !== undefined) ? n.homeX : n.x;
        var hy = (isLive && n.homeY !== undefined) ? n.homeY : n.y;
        if (!w || hx !== w.x || hy !== w.y) {
          list.splice(i, 1);
          changes.push({ id: n.id, map: mapId, to: 'absent', live: isLive });
        }
      }
      var present = {}; list.forEach(function (n) { present[n.id] = true; });
      want.forEach(function (b) {
        if (present[b.id]) return;
        list.push(isLive ? hydrate(b) : b);
        changes.push({ id: b.id, map: mapId, to: 'present', source: b.cast_source, live: isLive });
      });
    }
    Object.keys(maps).forEach(function (mapId) {
      var m = maps[mapId];
      if (!m) return;
      if (!m.npcs) m.npcs = [];
      reconcile(mapId, m.npcs, false);
    });
    if (live && live.mapId && Array.isArray(live.npcs)) reconcile(live.mapId, live.npcs, true);
    return changes;
  };

  /* ---------------- helper sviluppatore (nessuna UI giocatore) ----------------
   * GAME.CastPresence.resolve('truman')  -> risultato sullo stato narrativo corrente
   * GAME.CastPresence.where()            -> snapshot completo sullo stato corrente */
  function currentState() {
    var A = GAME.NarrativeAdapter;
    return (A && A.getState && A.getState()) || emptyState();
  }
  CP.resolve = function (characterId) {
    var r = CP.resolveCharacterPresence(characterId, currentState());
    r.text = String(characterId).toUpperCase() + '\n' + r.status + (r.sceneId ? '\n' + r.sceneId + ' ' + r.x + ',' + r.y : (r.label ? '\n' + r.label : '')) + '\n' + r.source + '\nowner: ' + (r.owner || '-');
    return r;
  };
  CP.where = function () { return CP.snapshot(currentState()); };
})();
