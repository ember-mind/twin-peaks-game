/* narrative-engine-adapter.js — B2: ponte tra il motore e il runtime narrativo.
 *
 * Responsabilità (contratto B2):
 *  - carica la missione e lo stato narrativo;
 *  - interroga NR.worldRoots per (mapId, actorId) — solo i nodi world/exposed;
 *  - sospende il VERO gameplay con un lease ANNIDABILE (mai un booleano):
 *    la sessione di visita tiene il lease; i widget/pagine acquisiscono lock
 *    figli; il gameplay torna attivo solo al rilascio del token di sessione —
 *    per costruzione zero frame di gioco tra due widget della stessa visita;
 *  - macchina della visita: refresh (pagina infermiera → commit) / prima
 *    visita (prepareNode → pagine iniziali → commitNode → widget) / visita
 *    attiva (widget diretto); dopo ogni ramo ricalcola availableChoices;
 *  - MAI un widget vuoto: choices.length === 0 → risposta diegetica breve;
 *  - non scrive mai flag/evidenze/history direttamente: solo prepare/commit
 *    del runtime;
 *  - transazioni parziali (ramo fallito): esito esplicito, gameplay sospeso
 *    finché l'adapter non ha scelto il recupero (qui: log + chiusura visita).
 *
 * Attivazione: opt-in via NarrativeAdapter.enable() — il gioco classico
 * non è toccato finché nessuno chiama enable(). */
(function () {
  var G = (typeof window !== 'undefined' ? window : globalThis);
  var GAME = G.GAME = G.GAME || {};
  var A = GAME.NarrativeAdapter = {};

  var NR = null, UI = null;
  var enabled = false;
  var notebookOnly = false;
  var notebookOpen = false;
  var listenersBound = false; // enable() idempotente: listener globali UNA volta
  var partialError = false;   // transazione parziale avvenuta e non risolta
  var mission = null, state = null, container = null;
  var advanceLockMs = 150;
  var events = [];
  A.events = events;

  function logEv(e) {
    e.seq = events.length; events.push(e);
    if (e.event === 'pair_resolver_error') partialError = true; // errore di SVILUPPO
    if (A.onLog) A.onLog(e);
  }

  /* ---------------- lease annidabile dell'input ---------------- */
  var locks = [];
  var inputContexts = {
    acquire: function (name) { var tok = { name: name }; locks.push(tok); logEv({ event: 'lease_acquire', name: name, depth: locks.length }); return tok; },
    release: function (tok) {
      var i = locks.indexOf(tok);
      if (i >= 0) { locks.splice(i, 1); logEv({ event: 'lease_release', name: tok.name, depth: locks.length }); }
    }
  };
  A.inputContexts = inputContexts;
  A.active = function () { return locks.length > 0; };

  // context figlio per un singolo widget/presentatore: il suo restore rilascia
  // SOLO il lock figlio — il lease di sessione resta e Cooper resta fermo.
  function childInput(name) {
    var tok = null;
    return {
      suspend: function () { tok = inputContexts.acquire(name); },
      restore: function () { if (tok) { inputContexts.release(tok); tok = null; } },
      forceRelease: function () { if (tok) { inputContexts.release(tok); tok = null; } }
    };
  }

  /* ---------------- setup ---------------- */
  // registro dei target ambientali: coords per (mappa, target_id) — l'identità
  // narrativa resta l'id logico nel nodo; la posizione deriva dal registro.
  // Compiled authored identities; no coordinate-based fallback.
  var WORLD_TARGETS = null;
  A._debugWorldTargets = null; // per i gate di allineamento nei test
  var missionsList = [];
  function enteredMissions() {
    return missionsList.filter(function (m) {
      return !m.entry_condition || NR.evalCond(state, m.entry_condition, m);
    });
  }
  function syncCarryoverEvidence(reason) {
    if (!state || !NR) return [];
    var added = [];
    enteredMissions().forEach(function (m) {
      (m.carryover_evidence || []).forEach(function (entry) {
        if (state.evidence[entry.evidence] || !NR.evalCond(state, entry.when, m)) return;
        NR.applyEffects(state, [{ evidence: entry.evidence }]);
        state.revision++;
        added.push(entry.evidence);
      });
    });
    if (added.length) logEv({ event: 'carryover_evidence_synced', reason: reason, evidence: added.slice() });
    return added;
  }

  /* ------- presenza fisica dei personaggi nominati: Cast Continuity v0.1 -------
   * Dal 2026-09-13 NESSUN corpo di personaggio nominato è dichiarato qui né in
   * js/glue.js NPCS: la sorgente unica è narrative/cast/windows.json (baseline +
   * finestre autorali, docs/cast-continuity-contract-v0.1.md), risolta da
   * js/cast-presence.js (GAME.CastPresence) — esattamente UNA risposta per
   * personaggio e stato: PLACED / OFFSCREEN / TERMINAL_REMOVED, senza priorità
   * né first-match. L'adapter non decide posizioni: chiama il seam
   * CastPresence.syncMaps agli stessi punti di prima (enable, setState,
   * refreshFromState, ogni commit). Il vecchio registro NARRATIVE_ENTITIES è
   * vuoto e resta solo come simbolo per gli strumenti che lo leggono. */
  var NARRATIVE_ENTITIES = [];
  A._debugNarrativeEntities = NARRATIVE_ENTITIES;

  // valutatore delle condizioni di presenza. Riusa la SEMANTICA UNICA delle
  // condizioni del runtime (flag / not / all / value_set / value_is / evidence /
  // node_done): una seconda implementazione divergerebbe. `when: null` = sempre.
  // Nessuna missione passata: le condizioni di presenza sono globali sullo stato,
  // non mission-scoped (un operatore mission-scoped qui è un errore di dati e
  // il runtime lo segnala).
  function evalWhen(when) {
    if (!when) return true;
    if (!NR || !state) return true;
    return NR.evalCond(state, when, null);
  }
  A._debugEvalWhen = evalWhen;

  // stessa forma che loadMap dà agli NPC (js/engine.js): l'entità aggiunta a
  // mappa GIÀ CARICATA deve essere indistinguibile da una posata dal caricamento.
  function hydrateNpc(n) {
    return {
      id: n.id, x: n.x, y: n.y, vx: n.x, vy: n.y, sprite: n.sprite, name: n.name, dialogue: n.dialogue,
      dir: n.dir || 'down', cond: n.cond, wander: n.wander,
      homeX: n.x, homeY: n.y,
      moving: false, mx: n.x, my: n.y, moveStartX: n.x, moveStartY: n.y, moveT: 0,
      nextThink: 0, reverseUntil: 0
    };
  }
  function indexOfNpc(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return i;
    return -1;
  }

  /* sincronizza i corpi dei personaggi nominati con lo stato narrativo corrente
   * (Cast Presence, Fase 6): su TUTTE le mappe (GAME.Maps[*].npcs) e — se quella
   * mappa è la mappa CARICATA — sugli NPC vivi del motore (E.state.npcs), perché
   * loadMap ne fa una copia allo spawn. Idempotente e silenziosa quando non
   * cambia nulla; logga un evento solo sui cambi effettivi. Una risoluzione che
   * fallisce (OVERLAP / NO_PLACEMENT) è un mondo autoriale contraddittorio:
   * viene loggata come hard error e nessun corpo viene toccato. */
  function syncNarrativeEntities(reason) {
    if (!enabled || !state || !NR) return [];
    var CP = GAME.CastPresence;
    if (!CP || !GAME.Maps) { logEv({ event: 'cast_presence_missing', reason: reason || null }); return []; }
    var E = GAME.Engine;
    var live = (E && E.state && E.state.npcs) ? { mapId: E.state.mapId, npcs: E.state.npcs } : null;
    var changes;
    try {
      changes = CP.syncMaps(GAME.Maps, state, live, { hydrate: hydrateNpc });
    } catch (e) {
      logEv({ event: 'cast_presence_error', reason: reason || null, code: e && e.code, detail: e && e.detail, error: String(e && e.message || e) });
      throw e;
    }
    if (changes.length) logEv({ event: 'narrative_entities_synced', reason: reason || null, changes: changes });
    return changes;
  }
  A.syncNarrativeEntities = syncNarrativeEntities;

  /* «dopo OGNI commit»: i commit non passano tutti dall'adapter — il widget
   * (narrative-ui.js) chiama NR.commitChoice/commitNode da sé. Il runtime è
   * byte-invariante in questa fase, quindi l'adapter avvolge UNA VOLTA SOLA,
   * in modo GENERICO (qualunque NR.commit*), le funzioni di commit con una
   * post-sincronizzazione. Nessuna funzione elencata a mano, nessun wrapping
   * doppio. */
  var commitsWrapped = false;
  function wrapCommitsForEntitySync() {
    if (commitsWrapped || !NR) return;
    commitsWrapped = true;
    Object.keys(NR).forEach(function (k) {
      if (typeof NR[k] !== 'function' || k.indexOf('commit') !== 0) return;
      var orig = NR[k];
      NR[k] = function () {
        var r = orig.apply(this, arguments);
        try { syncNarrativeEntities(k); } catch (e) { logEv({ event: 'entity_sync_error', at: k, error: String(e && e.message || e) }); }
        return r;
      };
    });
  }

  A.enable = function (opts) {
    opts = opts || {};
    if (!GAME.WorldData || !GAME.WorldData.narrativeTargets) {
      throw new Error('NarrativeAdapter: load generated narrative targets before enabling');
    }
    WORLD_TARGETS = GAME.WorldData.narrativeTargets;
    NR = GAME.NarrativeRuntime; UI = GAME.NarrativeUI;
    // C8-C.1 Fix 1 — rete di sicurezza: se un boot dimenticasse il bootstrap dei
    // cataloghi, l'adapter lo esegue (stessa funzione, idempotente) e lo dichiara
    // nel log invece di partire con valueDomains vuoti.
    if (GAME.installNarrativeCatalogs && !GAME.narrativeCatalogsInstalled) {
      GAME.installNarrativeCatalogs();
      logEv({ event: 'narrative_catalogs_installed_by_adapter' });
    }
    mission = opts.mission || (GAME.NarrativeData && GAME.NarrativeData.missions.M4);
    missionsList = opts.missions || [mission];
    if (missionsList.indexOf(mission) === -1) missionsList.unshift(mission);
    state = opts.state || NR.createState();
    container = opts.container;
    if (opts.advanceLockMs !== undefined) advanceLockMs = opts.advanceLockMs;
    enabled = true;
    notebookOnly = false;
    A._debugWorldTargets = WORLD_TARGETS;
    // C8-C.1 Fix 2 — le entità narrative non si iniettano più «e basta»: si
    // SINCRONIZZANO dal registro condizionale contro lo stato corrente (qui e
    // dopo setState / refreshFromState / ogni commit). Il posizionamento fisico
    // definitivo resta C8-E.
    wrapCommitsForEntitySync();
    syncCarryoverEvidence('enable');
    syncNarrativeEntities('enable');
    // taccuino: tasto T dal gameplay (il motore non mappa KeyT; capture NON
    // necessario — quando una sessione narrativa è attiva si ignora).
    // Listener registrati UNA SOLA volta: enable() è idempotente.
    if (!listenersBound) {
      listenersBound = true;
      window.addEventListener('keydown', function (e) {
        if ((!enabled && !notebookOnly) || e.code !== 'KeyT' || A.active()) return;
        if (GAME.NarrativeFinaleProduction && GAME.NarrativeFinaleProduction.isActive && GAME.NarrativeFinaleProduction.isActive()) return;
        var E = GAME.Engine;
        if (!E || !E.state || E.state.mode !== 'play' || E.state.dialogue || E.state.menu) return;
        A.openNotebook();
      });
    }
    logEv({ event: 'adapter_enabled', mission: mission.mission });
  };
  A.disable = function (opts) {
    enabled = false;
    notebookOnly = !!(opts && opts.keepNotebook);
    logEv({ event: 'adapter_disabled', notebook_read_only: notebookOnly });
  };
  A.isEnabled = function () { return enabled; };
  A.isNotebookEnabled = function () { return enabled || notebookOnly; };
  A.isNotebookOpen = function () { return notebookOpen; };
  A.getState = function () { return state; };
  // uno stato reinstallato (load/checkpoint) può implicare un mondo diverso:
  // il registro delle entità va ri-sincronizzato PRIMA di qualunque interazione.
  A.setState = function (s) { state = s; partialError = false; syncCarryoverEvidence('setState'); syncNarrativeEntities('setState'); };
  A.syncCarryoverEvidence = function () { return syncCarryoverEvidence('external'); };
  function missionById(id) { return missionsList.filter(function (m) { return m.mission === id; })[0]; }
  // missione corrente derivata da uno STATO arbitrario (per il load: la
  // missione dell'envelope si valida contro lo stato DESERIALIZZATO)
  A.currentMissionFor = function (st) {
    var ent = missionsList.filter(function (m) {
      return !m.entry_condition || NR.evalCond(st, m.entry_condition, m);
    });
    return ent.length ? ent[ent.length - 1] : mission;
  };
  A.getPrimaryMission = function () { return mission; };
  A.getMission = function () { return currentMission(); };
  // stato esplicito della sessione narrativa (per il gate di salvataggio)
  A.sessionStatus = function () {
    if (partialError) return 'partial_error';
    return locks.length > 0 ? 'active' : 'idle';
  };
  // ricostruzione post-load: solo letture derivate, sulla missione CORRENTE
  A.refreshFromState = function () {
    syncCarryoverEvidence('refreshFromState');
    var cm = currentMission();
    syncNarrativeEntities('refreshFromState');
    var o = NR.activeObjective(state, cm);
    logEv({ event: 'refreshed_from_state', mission: cm.mission, objective: o ? o.id : null, revision: state.revision });
    return { mission: cm.mission, objective: o ? o.id : null };
  };

  function peek() { return JSON.parse(NR.serialize(state)); }

  function currentMission() {
    var ent = enteredMissions();
    return ent.length ? ent[ent.length - 1] : mission;
  }
  A.currentMission = currentMission;

  /* Unica sorgente participant-facing dell'obiettivo. La missione narrativa
   * corrente vince solo quando e' davvero entrata e possiede un obiettivo
   * attivo; prima di M4 (e negli interstizi) resta valido il percorso classico.
   * Notebook, DOM semantico e log leggono tutti questo resolver: mai due copie
   * divergenti dello stesso comando. */
  function currentObjectiveText() {
    var NF = GAME.NarrativeFinale;
    if (NF && NF.isPending && NF.isPending() && NF.objective) return NF.objective() || '';
    var cm = currentMission();
    if (enabled && cm && (!cm.entry_condition || NR.evalCond(state, cm.entry_condition, cm))) {
      var narrative = NR.activeObjective(state, cm);
      if (narrative) return narrative.text + (narrative.optional_line ? ' — ' + narrative.optional_line : '');
    }
    var E = GAME.Engine;
    if (E && E.state && GAME.Data && GAME.Data.objectiveFor && E.checkCond) {
      return GAME.Data.objectiveFor(E.state, E.checkCond) || '';
    }
    return '';
  }
  A.getObjectiveText = currentObjectiveText;

  function objectiveUpdate() {
    var cm = currentMission();
    var o = NR.activeObjective(state, cm);
    logEv({ event: 'objective', mission: cm.mission, id: o ? o.id : null, text: currentObjectiveText() || null });
  }

  /* ---------------- interazione dal motore ---------------- */
  // risoluzione CONDIVISA anti-softlock: il nodo della PRIMA milestone pendente
  // di una missione. Una milestone abbandonata (es. la revisione della teoria)
  // blocca le root del rapporto e resta pendente; senza questo, ogni interazione
  // della missione cade su interaction_no_roots = softlock reale (il player non
  // può più chiudere la revisione). Qui la riapriamo da QUALSIASI interazione
  // della missione proprietaria. Per costruzione è mission-scoped: la milestone
  // di una missione non reindirizza le interazioni di un'altra.
  function pendingMilestoneNode(ownerMission) {
    var pend = NR.pendingMilestones(state, ownerMission);
    if (!pend.length) return null;
    return ownerMission.nodes.filter(function (n) { return n.id === pend[0].node; })[0] || null;
  }
  function completedTargetNode(ownerMission, mapId, targetKind, targetId) {
    var matches = ownerMission.nodes.filter(function (n) {
      var id = targetKind === 'actor' ? (n.actor_id || n.target_id) : n.target_id;
      return n.channel === 'world' && n.map_id === mapId && n.target_kind === targetKind && id === targetId && state.nodes_done[n.id];
    });
    return matches.length ? matches[matches.length - 1] : null;
  }

  // Un target posseduto dal layer narrativo non deve mai cadere nel dialogo
  // classico quando, nello stato corrente, non ha root attive. Mostra invece
  // una risposta diegetica breve sotto lease. Nessun prepare/commit: stato
  // narrativo byte-identico prima e dopo il feedback.
  function showNoRootsFeedback(meta) {
    meta = meta || {};
    var session = inputContexts.acquire('narrative-no-roots');
    var isActor = !!meta.actor;
    var page = {
      id: isActor ? 'adapter.no_roots.actor' : 'adapter.no_roots.target',
      mode: 'dialogue',
      speaker_id: 'cooper',
      display_name: 'COOPER',
      portrait: 'cooper',
      text: isActor
        ? 'Non c\'è altro da chiedere qui, per ora.'
        : 'Qui non c\'è altro da leggere, per ora.'
    };
    logEv({
      event: 'interaction_no_roots_feedback',
      mission: meta.mission || null,
      map: meta.map || null,
      actor: meta.actor || null,
      target: meta.target || null,
      page_id: page.id
    });
    var shown;
    try {
      shown = UI.showPages({
        pages: [page], container: container, inputContext: childInput('narrative-pages'),
        log: logEv, allowCancel: true, advanceLockMs: advanceLockMs
      });
    } catch (error) {
      inputContexts.release(session);
      partialError = true;
      logEv({ event: 'interaction_no_roots_feedback_error', error: String(error && error.message || error) });
      return;
    }
    Promise.resolve(shown).then(function (outcome) {
      inputContexts.release(session);
      logEv({ event: 'interaction_no_roots_feedback_closed', outcome: outcome });
    }, function (error) {
      inputContexts.release(session);
      partialError = true;
      logEv({ event: 'interaction_no_roots_feedback_error', error: String(error && error.message || error) });
    });
  }

  // true = l'adapter ha gestito l'interazione (il motore non apre il vecchio dialogo)
  /* Cast Presence: un corpo del registro risponde agli id-attore autorali della
   * sua placement (body.actor_ids, es. hawk → hawk_bridge; giant → gigante).
   * L'elenco viene dai DATI mappa (GAME.Maps[map].npcs), non dal corpo vivo,
   * perché loadMap copia solo i campi classici. Nessun alias implicito. */
  function actorIdsFor(mapId, npcId) {
    var map = GAME.Maps && GAME.Maps[mapId];
    var body = map && map.npcs ? map.npcs.filter(function (n) { return n.id === npcId; })[0] : null;
    var ids = (body && Array.isArray(body.actor_ids) && body.actor_ids.length) ? body.actor_ids.slice() : [];
    if (ids.indexOf(npcId) === -1) ids.push(npcId);
    return ids;
  }
  A.tryInteract = function (mapId, npcId) {
    if (!enabled) return false;
    syncCarryoverEvidence('interaction');
    if (A.active()) return true; // sessione già in corso: consuma
    var ids = actorIdsFor(mapId, npcId);
    for (var k = 0; k < ids.length; k++) if (tryInteractAs(mapId, ids[k])) return true;
    return false;
  };
  function tryInteractAs(mapId, actorId) {
    var ent = enteredMissions();
    var owner = null, roots = [];
    // C6-C: quando più missioni hanno un nodo sullo STESSO target attore
    // (es. Truman@sheriff: il rapporto M4 e il ritorno notturno M6), vince la
    // missione ENTRATA PIÙ DI RECENTE — la corrente. Generico: itera dal fondo
    // di enteredMissions (ordine di entrata) e prende la prima con root attive.
    for (var i = ent.length - 1; i >= 0; i--) {
      var m = ent[i];
      if (!m.nodes.some(function (n) { return n.channel === 'world' && n.map_id === mapId && n.actor_id === actorId; })) continue;
      owner = m;
      var rs = NR.worldRoots(state, m, mapId, actorId);
      if (rs.length) { roots = rs; break; }
    }
    if (!owner) return false;
    if (roots.length === 0) {
      var ms = pendingMilestoneNode(owner);
      if (ms) { logEv({ event: 'milestone_resume', source: actorId, to: ms.id }); runSession(owner, ms, actorId); return true; }
      if (NR.checkCompletion(state, owner)) {
        var completedActor = completedTargetNode(owner, mapId, 'actor', actorId);
        if (completedActor) runSession(owner, completedActor, actorId);
        logEv({ event: 'completed_mission_repeat', mission: owner.mission, actor: actorId, node: completedActor ? completedActor.id : null });
        return true;
      }
      logEv({ event: 'interaction_no_roots', actor: actorId });
      showNoRootsFeedback({ mission: owner.mission, map: mapId, actor: actorId });
      return true;
    }
    // C6-C.1: più root attive sullo STESSO target = errore DI SVILUPPO (il
    // root-contract è violato), MAI scelta silenziosa della prima. Fail-closed:
    // interazione consumata, nessuna sessione, stato invariato, zero lease.
    if (roots.length > 1) { logEv({ event: 'ambiguous_world_roots', map: mapId, actor: actorId, roots: roots.map(function (n) { return n.id; }) }); partialError = true; return true; }
    runSession(owner, roots[0], actorId);
    return true;
  }

  // target ambientali (object/landmark/sign): risoluzione GENERICA
  // casella → target_id (registro) → nodi world compatibili per identità
  A.tryInteractAt = function (mapId, x, y) {
    if (!enabled) return false;
    if (A.active()) return true;
    var reg = WORLD_TARGETS[mapId];
    if (!reg) return false;
    var tid = null, tkind = null;
    for (var id in reg) { if (reg[id].x === x && reg[id].y === y) { tid = id; tkind = reg[id].kind; break; } }
    if (!tid) return false;
    var ent = enteredMissions();
    // C6-C.1: stessa precedenza latest-first degli attori (la missione corrente
    // vince su un target ambientale condiviso), stesso fail-closed sulle ambiguità.
    for (var i = ent.length - 1; i >= 0; i--) {
      var m = ent[i];
      var candidates = NR.worldRoots(state, m, mapId) // condizioni valutate dal runtime
        .filter(function (n) { return n.target_id === tid && n.target_kind === tkind; });
      if (candidates.length > 1) { logEv({ event: 'ambiguous_world_roots', map: mapId, target: tid, roots: candidates.map(function (n) { return n.id; }) }); partialError = true; return true; }
      if (candidates.length) { runSession(m, candidates[0], tid); return true; }
      // il target appartiene a una missione con nodi su questo id ma senza root ora?
      if (m.nodes.some(function (n) { return n.map_id === mapId && n.target_id === tid; })) {
        // milestone pendente della missione → riapri (un target già completato è
        // comunque una porta per chiudere una revisione abbandonata; anti-softlock)
        var ms = pendingMilestoneNode(m);
        if (ms) { logEv({ event: 'milestone_resume', source: tid, to: ms.id }); runSession(m, ms, tid); return true; }
        if (NR.checkCompletion(state, m)) {
          var completedTarget = completedTargetNode(m, mapId, tkind, tid);
          if (completedTarget) runSession(m, completedTarget, tid);
          logEv({ event: 'completed_mission_repeat', mission: m.mission, target: tid, node: completedTarget ? completedTarget.id : null });
          return true;
        }
        logEv({ event: 'interaction_no_roots', target: tid });
        showNoRootsFeedback({ mission: m.mission, map: mapId, target: tid });
        return true; // consumata: il classico non deve rispondere per un target narrativo
      }
    }
    return false;
  };

  /* ---------------- taccuino (B3) ---------------- */
  A.openNotebook = function () {
    if ((!enabled && !notebookOnly) || A.active()) return Promise.resolve({ skipped: true });
    if (GAME.NarrativeFinaleProduction && GAME.NarrativeFinaleProduction.isActive && GAME.NarrativeFinaleProduction.isActive()) {
      return Promise.resolve({ skipped: true, reason: 'finale_active' });
    }
    syncCarryoverEvidence('notebook');
    // Il notebook contiene gia' l'obiettivo risolto: nascondi la copia DOM
    // esterna anche all'albero accessibile finche' il pannello resta aperto.
    var objectiveEl = document.getElementById && document.getElementById('objective');
    var objectiveDisplay = objectiveEl ? objectiveEl.style.display : '';
    notebookOpen = true;
    if (objectiveEl) objectiveEl.style.display = 'none';
    var session = inputContexts.acquire('narrative-notebook');
    var notebookInput = childInput('notebook-view');
    function releaseNotebook() {
      notebookOpen = false;
      if (objectiveEl) objectiveEl.style.display = objectiveDisplay;
      inputContexts.release(session);
      logEv({ event: 'notebook_closed' });
    }
    var opened;
    try {
      opened = GAME.NarrativeNotebook.open({
      state: state, mission: mission, missions: enteredMissions(), data: GAME.NarrativeData,
      container: container, inputContext: notebookInput,
      getObjectiveText: currentObjectiveText,
      readOnly: notebookOnly,
      log: logEv, advanceLockMs: advanceLockMs,
      runComparison: runComparisonFlow,
      onNoMatch: function () {
        // coppia senza nesso: NESSUNA scrittura di stato, una riga neutra
        // (testo adapter [N], id proprio — dichiarato al revisore)
        return UI.showPages({
          pages: [{ id: 'm4.b7.adapter.no_link', mode: 'notebook', text: '(Le due voci restano una accanto all\'altra. Nessun filo, per ora.)' }],
          container: container, inputContext: childInput('narrative-pages'), log: logEv, allowCancel: true, advanceLockMs: advanceLockMs
        });
      },
      onCompleted: function (node) {
        // richiamo GIÀ registrato: il punto d'atterraggio è presentazione
        // participant-facing e vive nei DATI (node.completed_recall), MAI dedotto
        // dalla forma tecnica degli effetti (choice vs node — l'euristica sbagliava
        // cmp_t1_e5, una proposizione formulata dagli effetti del NODO). L'adapter
        // si limita a leggere. Mai «nessun filo», mai scritture di stato.
        var recall = node.completed_recall;
        if (!recall) {
          logEv({ event: 'comparison_completed_recall_missing', node_id: node.id });
          throw new Error('comparison_completed_recall_missing: ' + node.id);
        }
        // SECTIONS = [Evidenze(0), Appunti(1), Proposizioni(2), Confronta(3)]
        var section = recall.section === 'propositions' ? 2 : 1;
        return UI.showPages({
          pages: [recall.page], container: container, inputContext: childInput('narrative-pages'), log: logEv, allowCancel: true, advanceLockMs: advanceLockMs
        }).then(function () { return { recallSection: section }; });
      }
      });
    } catch (err) {
      notebookInput.forceRelease();
      partialError = true;
      logEv({ event: 'notebook_error', error: String(err && err.message || err) });
      releaseNotebook();
      return Promise.resolve({ ok: false, error: 'notebook_open_failed' });
    }
    return Promise.resolve(opened).catch(function (err) {
      notebookInput.forceRelease();
      partialError = true;
      logEv({ event: 'notebook_error', error: String(err && err.message || err) });
    }).then(function () {
      releaseNotebook();
    });
  };

  // flusso del confronto: prepareNode → pagine intro → commitNode → widget B8
  // in loop (retry) finché la scelta formulante chiude, SEMPRE sotto il lease
  // del taccuino — zero frame di gameplay tra feedback e menu successivo.
  async function runComparisonFlow(node, sourceMissionId) {
    var owner = sourceMissionId ? missionById(sourceMissionId) : mission;
    if (!owner) { logEv({ event: 'comparison_source_mission_not_found', id: sourceMissionId }); partialError = true; return; }
    var st = peek();
    var cmp0 = st.comparisons[node.id];
    if (cmp0 && cmp0.completed) { logEv({ event: 'comparison_already_completed', node_id: node.id }); return; }
    if (!st.nodes_done[node.id]) {
      var prep = NR.prepareNode(state, owner, node.id);
      if (!prep.ok) { logEv({ event: 'node_prepare_failed', node_id: node.id, error: prep.error }); return; }
      var r = await UI.showPages({ pages: prep.pages, container: container, inputContext: childInput('narrative-pages'), log: logEv, allowCancel: true, advanceLockMs: advanceLockMs });
      if (r.aborted) { logEv({ event: 'node_aborted', node_id: node.id }); return; }
      var cn = NR.commitNode(state, owner, prep);
      logEv({ event: 'node_committed', node_id: node.id, ok: cn.ok });
      if (!cn.ok) return;
    }
    while (true) {
      var done = peek().comparisons[node.id];
      if (done && done.completed) break;
      var choices = NR.availableChoices(state, owner, node);
      if (choices.length === 0) { logEv({ event: 'comparison_no_choices_left', node_id: node.id }); break; }
      var ctx = childInput('narrative-widget');
      var res = await UI.openChoice({
        state: state, mission: owner, node: node, container: container,
        inputContext: ctx, log: logEv, allowCancel: true, advanceLockMs: advanceLockMs
      });
      if (res.aborted) { logEv({ event: 'widget_aborted' }); break; }
      if (res.error) {
        logEv({ event: 'widget_error', error: res.error, partial: !!res.partial_transaction });
        if (res.partial_transaction) partialError = true;
        ctx.forceRelease();
        break;
      }
      // retry: il widget si riapre nel prossimo giro, lease sempre tenuto
    }
    NR.checkCompletion(state, owner);
    objectiveUpdate();
  }

  /* ---------------- sessione (async, sotto lease) ---------------- */
  function runSession(ownerMission, rootNode, actorId) {
    var leaseName = rootNode.presentation ? 'narrative-presentation' : 'narrative';
    var session = inputContexts.acquire(leaseName);
    var p = rootNode.presentation ? presentationSession(ownerMission, rootNode)
      : (rootNode.rules && rootNode.rules.visit_state) ? visitSession(rootNode)
      : genericNodeSession(ownerMission, rootNode.id);
    p.catch(function (err) {
      logEv({ event: 'session_error', error: String(err && err.message || err) });
    }).then(function () {
      inputContexts.release(session);
      logEv({ event: 'session_closed', actor: actorId });
    });
  }

  /* ---------------- presentazione (B4) ---------------- */
  // menu delle proposizioni: SOLO lettura — nessuna scrittura di stato.
  // Label participant-facing (ui_short dal catalogo), mai gli ID.
  function proposalMenu(options, node) {
    return new Promise(function (resolve) {
      var prCat = (GAME.NarrativeData.propositions && GAME.NarrativeData.propositions.propositions) || {};
      var ctx = childInput('presentation-menu');
      ctx.suspend();
      var root = document.createElement('div');
      root.className = 'nw-root';
      root.setAttribute('role', 'dialog');
      var idx = 0, done = false;
      container.appendChild(root);
      function finish(val) {
        if (done) return;
        done = true;
        window.removeEventListener('keydown', onKey, true);
        window.removeEventListener('blur', onBlur);
        root.remove(); ctx.restore();
        resolve(val);
      }
      function render() {
        while (root.firstChild) root.removeChild(root.firstChild);
        var title = document.createElement('div'); title.className = 'nw-title';
        title.textContent = (node.pages && node.pages[0] && node.pages[0].text) ? 'Quale nesso regge?' : 'Quale nesso regge?';
        root.appendChild(title);
        options.forEach(function (pid, i) {
          var o = document.createElement('div');
          o.className = 'nw-opt' + (i === idx ? ' nw-focus' : '');
          o.setAttribute('data-prop-choice', pid);
          o.textContent = (i === idx ? '▶ ' : '  ') + ((prCat[pid] && prCat[pid].ui_short) || '(nesso)');
          o.onclick = function () { idx = i; render(); finish(pid); };
          root.appendChild(o);
        });
        var h = document.createElement('div'); h.className = 'nw-hint'; h.textContent = '↑↓ · Invio · Esc';
        root.appendChild(h);
      }
      function onKey(e) {
        e.stopPropagation(); e.preventDefault();
        if (e.repeat) return;
        if (e.code === 'ArrowUp' || e.code === 'KeyW') { idx = (idx + options.length - 1) % options.length; render(); }
        else if (e.code === 'ArrowDown' || e.code === 'KeyS') { idx = (idx + 1) % options.length; render(); }
        else if (e.code === 'Enter' || e.code === 'KeyE') finish(options[idx]);
        else if (e.code === 'Escape') finish(null);
      }
      function onBlur() { finish(null); }
      window.addEventListener('keydown', onKey, true);
      window.addEventListener('blur', onBlur);
      render();
      logEv({ event: 'presentation_menu', options: options.slice() });
    });
  }

  function attachmentMenu(node, propId) {
    return new Promise(function (resolve) {
      var branch = node.presentation.on[propId] || {};
      var ids = (branch.attachment_required || []).slice();
      Object.keys(branch.attachment_responses || {}).forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); });
      ids = ids.filter(function (id) { return !!state.evidence[id]; });
      var evCat = (GAME.NarrativeData.evidence && GAME.NarrativeData.evidence.evidence) || {};
      var selected = {}, idx = 0, done = false, ctx = childInput('presentation-attachment');
      ctx.suspend();
      var root = document.createElement('div'); root.className = 'nw-root'; root.setAttribute('role', 'dialog'); container.appendChild(root);
      function finish(value) {
        if (done) return; done = true;
        window.removeEventListener('keydown', onKey, true); window.removeEventListener('blur', onBlur);
        root.remove(); ctx.restore(); resolve(value);
      }
      function label(id) {
        var e = evCat[id] || {};
        return e.ui_origin || e.label || '(elemento del fascicolo)';
      }
      function render() {
        while (root.firstChild) root.removeChild(root.firstChild);
        var title = document.createElement('div'); title.className = 'nw-title'; title.textContent = 'Quali elementi alleghi?'; root.appendChild(title);
        ids.forEach(function (id, i) {
          var o = document.createElement('div'); o.className = 'nw-opt' + (i === idx ? ' nw-focus' : '');
          o.setAttribute('data-attachment-evidence', id);
          o.textContent = (i === idx ? '▶ ' : '  ') + (selected[id] ? '[x] ' : '[ ] ') + label(id);
          o.onclick = function () { selected[id] = !selected[id]; idx = i; render(); };
          root.appendChild(o);
        });
        var confirm = document.createElement('div'); confirm.className = 'nw-opt' + (idx === ids.length ? ' nw-focus' : '');
        confirm.setAttribute('data-attachment-confirm', 'true'); confirm.textContent = (idx === ids.length ? '▶ ' : '  ') + 'Presenta';
        confirm.onclick = function () { finish(ids.filter(function (id) { return selected[id]; })); };
        root.appendChild(confirm);
      }
      function onKey(e) {
        e.stopPropagation(); e.preventDefault(); if (e.repeat) return;
        var count = ids.length + 1;
        if (e.code === 'ArrowUp' || e.code === 'KeyW') { idx = (idx + count - 1) % count; render(); }
        else if (e.code === 'ArrowDown' || e.code === 'KeyS') { idx = (idx + 1) % count; render(); }
        else if (e.code === 'Enter' || e.code === 'KeyE' || e.code === 'Space') {
          if (idx === ids.length) finish(ids.filter(function (id) { return selected[id]; }));
          else { selected[ids[idx]] = !selected[ids[idx]]; render(); }
        } else if (e.code === 'Escape') finish(null);
      }
      function onBlur() { finish(null); }
      window.addEventListener('keydown', onKey, true); window.addEventListener('blur', onBlur);
      render(); logEv({ event: 'presentation_attachment_menu', proposition: propId, candidates: ids.slice() });
    });
  }

  // sequenza vincolante: prepare (puro) → provenienza generata → pagine di
  // Truman → conferma ultima pagina → commit UNA volta → completion/obiettivo.
  async function presentationSession(ownerMission, node) {
    var target = node.presentation.target_actor_id;
    var stP = peek();
    var localProps = Object.keys(node.presentation.on || {});
    var acceptedProp = Object.keys(stP.props || {}).filter(function (pid) {
      return localProps.indexOf(pid) >= 0 && (stP.props[pid].social_status.accepted_by || []).indexOf(target) >= 0;
    })[0];
    if (acceptedProp) {
      // ri-interazione dopo l'accettazione: repeat canonico, niente menu
      var prepR = NR.preparePresentation(state, ownerMission, node, acceptedProp);
      var rr = await UI.showPages({ pages: prepR.pages, container: container, inputContext: childInput('narrative-pages'), log: logEv, allowCancel: true, advanceLockMs: advanceLockMs });
      if (!rr.aborted) { var cR = NR.commitPresentation(state, ownerMission, node, prepR); logEv({ event: 'presentation_repeat', repeated: !!cR.repeated }); }
      return;
    }
    var introPrep = NR.prepareNode(state, ownerMission, node.id);
    if (!introPrep.ok) { logEv({ event: 'presentation_intro_prepare_failed', error: introPrep.error }); return; }
    var ir = await UI.showPages({ pages: introPrep.pages || [], container: container, inputContext: childInput('narrative-pages'), log: logEv, allowCancel: true, advanceLockMs: advanceLockMs });
    if (ir.aborted) { logEv({ event: 'presentation_aborted', at: 'intro' }); return; }
    var options = NR.presentationOptions(state, ownerMission, node);
    var propId = null;
    if (options.length > 0) {
      propId = await proposalMenu(options, node);
      if (propId === null) { logEv({ event: 'presentation_cancelled' }); return; }
    }
    // options vuote → propId null → ramo _none_formulated (MAI menu vuoto)
    var attached = null;
    if (propId && node.presentation.attachment && node.presentation.attachment.mode === 'manual') {
      attached = await attachmentMenu(node, propId);
      if (attached === null) { logEv({ event: 'presentation_attachment_cancelled' }); return; }
    }
    var prepared = NR.preparePresentation(state, ownerMission, node, propId, attached);
    if (!prepared.ok) { logEv({ event: 'presentation_prepare_failed', error: prepared.error }); return; }
    if (prepared.already_rejected) {
      // memoria del rifiuto: la pagina diegetica STABILE arriva dai DATI
      // (branch.already_rejected_page) — mai un commit invisibile
      var ar = await UI.showPages({
        pages: prepared.pages, container: container, inputContext: childInput('narrative-pages'), log: logEv, allowCancel: true, advanceLockMs: advanceLockMs
      });
      if (!ar.aborted) { var cA = NR.commitPresentation(state, ownerMission, node, prepared); logEv({ event: 'presentation_already_rejected', ok: cA.ok }); }
      return;
    }
    var pages = [];
    if (prepared.provenance && prepared.provenance.from.length) {
      var evCat = GAME.NarrativeData.evidence.evidence;
      var labels = prepared.provenance.from.map(function (id) { return (evCat[id] && evCat[id].label) || '—'; });
      pages.push({ id: 'm4.b9.provenance.' + propId, mode: 'notebook', text: 'Provenienza: ' + labels.join(' · ') });
    }
    pages = pages.concat(prepared.pages || []);
    var pr = await UI.showPages({ pages: pages, container: container, inputContext: childInput('narrative-pages'), log: logEv, allowCancel: true, advanceLockMs: advanceLockMs });
    if (pr.aborted) { logEv({ event: 'presentation_aborted', at: 'pages' }); return; } // prepared scartato: stato puro
    var c = NR.commitPresentation(state, ownerMission, node, prepared);
    logEv({ event: 'presentation_committed', ok: c.ok, result: c.record ? c.record.result : null, reason: c.record ? c.record.reason_code : null });
    objectiveUpdate();
  }

  /* ---------------- sessione generica C5-C (M5 e oltre) ---------------- */
  // gestisce: dialoghi con effetti, choice-node compositi (prompt→widget),
  // resume_choice, continuation (rapporto→S1→chiusura), milestone auto-aperte
  // nello stesso lease (zero frame di gameplay)
  async function genericNodeSession(m, nodeId) {
    var guard = 0;
    var cur = nodeId;
    while (cur && guard++ < 12) {
      var node = m.nodes.filter(function (n) { return n.id === cur; })[0];
      if (!node) { logEv({ event: 'node_not_found', node_id: cur }); return; }
      var prep = NR.prepareNode(state, m, cur);
      if (!prep.ok) {
        // un'interazione bloccata da una milestone REINDIRIZZA alla milestone
        // nella stessa sessione (mai un'interazione morta)
        if (String(prep.error).indexOf('milestone_pending') === 0) {
          var pend0 = NR.pendingMilestones(state, m);
          if (pend0.length) { logEv({ event: 'milestone_redirect', from: cur, to: pend0[0].node }); cur = pend0[0].node; continue; }
        }
        logEv({ event: 'node_prepare_failed', node_id: cur, error: prep.error });
        return;
      }
      if (prep.continuation) { logEv({ event: 'continuation', from: cur, to: prep.continuation }); cur = prep.continuation; continue; }
      if (prep.resume_choice) {
        logEv({ event: 'resume_choice', node_id: cur });
        var done = await runChoiceWidget(m, node);
        if (!done) return; // abort: milestone/blocchi restano
      } else if (prep.already_completed) {
        // anti-softlock: se una milestone è pendente, l'interazione con un nodo
        // GIÀ concluso (le cui conditions restano vere → resta un candidato world)
        // riporta alla milestone da chiudere, invece di una pagina di repeat morta.
        // Copre i target ambientali già completati (anello/mucchio/scena) mentre
        // la revisione della teoria è abbandonata: sono comunque una porta valida.
        var pendAC = NR.pendingMilestones(state, m);
        if (pendAC.length) { logEv({ event: 'milestone_redirect', from: cur, to: pendAC[0].node }); cur = pendAC[0].node; continue; }
        if (prep.pages.length) {
          var rr = await UI.showPages({ pages: prep.pages, container: container, inputContext: childInput('narrative-pages'), log: logEv, allowCancel: true, advanceLockMs: advanceLockMs });
          if (!rr.aborted) NR.commitNode(state, m, prep);
        }
        return;
      } else {
        if (node.pages_by_value) {
          var selPage = prep.pages.filter(function (pg) { return (node.pages_by_value.cases[NR.peekValue(state, node.pages_by_value.value)] || []).some(function (c) { return c.id === pg.id; }); })[0];
          logEv({ event: 'pages_by_value', node: cur, value: NR.peekValue(state, node.pages_by_value.value), selected_page_id: selPage ? selPage.id : null });
        }
        if (prep.pages.length) {
          var r = await UI.showPages({ pages: prep.pages, container: container, inputContext: childInput('narrative-pages'), log: logEv, allowCancel: true, advanceLockMs: advanceLockMs });
          if (r.aborted) { logEv({ event: 'node_aborted', node_id: cur }); return; }
        }
        var isChoiceOnly = (node.choices || []).length && !(node.pages || []).length && !node.pages_by_value;
        if (!isChoiceOnly) {
          var cn = NR.commitNode(state, m, prep);
          logEv({ event: 'node_committed', node_id: cur, ok: cn.ok });
          if (!cn.ok) return;
          objectiveUpdate();
        }
        if ((node.choices || []).length) {
          var done2 = await runChoiceWidget(m, node);
          if (!done2) return;
        }
      }
      objectiveUpdate();
      // milestone pendenti: si aprono NELLO STESSO LEASE
      var pend = NR.pendingMilestones(state, m);
      if (pend.length) { cur = pend[0].node; continue; }
      // continuation dichiarativa del nodo appena concluso
      cur = (node.next && node.id !== node.next) ? node.next : null;
      if (cur) {
        // se la catena è già oltre (es. widget con goto ha già eseguito il
        // next), un prepareNode già-fatto la salterà al giro dopo
        var nxt = m.nodes.filter(function (n) { return n.id === cur; })[0];
        if (nxt && state.nodes_done[cur] && !(nxt.completion_when && !NR.evalCond(state, nxt.completion_when, m))) cur = null;
      }
    }
  }

  // widget per un choice-node (teoria, revisione, S1): il goto del widget
  // segue la continuation (B1 invariato). Ritorna true se una scelta è stata
  // committata, false su abort/errore.
  async function runChoiceWidget(m, node) {
    var choices = NR.availableChoices(state, m, node);
    if (!choices.length) { logEv({ event: 'no_choices', node_id: node.id }); return false; }
    var ctx = childInput('narrative-widget');
    var res = await UI.openChoice({
      state: state, mission: m, node: node, container: container,
      inputContext: ctx, log: logEv, allowCancel: true, advanceLockMs: advanceLockMs
    });
    if (res.aborted) { logEv({ event: 'widget_aborted', node_id: node.id }); return false; }
    if (res.error) {
      logEv({ event: 'widget_error', error: res.error, partial: !!res.partial_transaction });
      if (res.partial_transaction) partialError = true;
      ctx.forceRelease();
      return false;
    }
    objectiveUpdate();
    NR.checkCompletion(state, m);
    return true;
  }

  // nodo world semplice (es. infermiera_ctx): prepare → pagine → commit
  async function nodeSession(node) {
    var prep = NR.prepareNode(state, mission, node.id);
    if (!prep.ok) { logEv({ event: 'node_prepare_failed', node_id: node.id, error: prep.error }); return; }
    var r = await UI.showPages({ pages: prep.pages, container: container, inputContext: childInput('narrative-pages'), log: logEv, allowCancel: true, advanceLockMs: advanceLockMs });
    if (r.aborted) { logEv({ event: 'node_aborted', node_id: node.id }); return; } // prepared scartato, stato invariato
    var cr = NR.commitNode(state, mission, prep);
    logEv({ event: 'node_committed', node_id: node.id, ok: cr.ok, repeated: !!cr.repeated });
    objectiveUpdate();
  }

  // visita senza contenuto: MAI un menu vuoto — breve risposta diegetica.
  // Testo: riuso della battuta canonica dell'infermiera (m4.b2.ronette_uomo.p06);
  // page id proprio dell'adapter, NESSUNA scrittura di stato.
  async function closedLine() {
    await UI.showPages({
      pages: [{ id: 'm4.b2.adapter.visit_closed', mode: 'dialogue', display_name: 'INFERMIERA', text: 'Quando si stanca, ricomincia dal soffitto. Per oggi basta.' }],
      container: container, inputContext: childInput('narrative-pages'), log: logEv, allowCancel: true, advanceLockMs: advanceLockMs
    });
  }

  // macchina della visita (Ronette)
  async function visitSession(node) {
    var vs = node.rules.visit_state;

    // 1) visita chiusa + refresh disponibile → pagina dell'infermiera → commit
    var refresh = NR.prepareVisitRefresh(state, mission, node);
    if (refresh) {
      var rr = await UI.showPages({ pages: refresh.pages, container: container, inputContext: childInput('narrative-pages'), log: logEv, allowCancel: true, advanceLockMs: advanceLockMs });
      if (rr.aborted) { logEv({ event: 'refresh_aborted' }); return; } // reopened resta false
      var rc = NR.commitVisitRefresh(state, refresh);
      logEv({ event: 'visit_reopened', ok: rc.ok });
      if (!rc.ok) return;
    } else {
      var st = peek();
      var v0 = st.visits[vs];
      // visita chiusa e NON riapribile: mai un menu vuoto — risposta diegetica.
      if (v0 && v0.closed && !v0.reopened) { await closedLine(); return; }
      // 2) root non ancora completato → prepareNode → pagine iniziali → commitNode
      if (!st.nodes_done[node.id]) {
        var prep = NR.prepareNode(state, mission, node.id);
        if (!prep.ok) { logEv({ event: 'node_prepare_failed', node_id: node.id, error: prep.error }); return; }
        var pr = await UI.showPages({ pages: prep.pages, container: container, inputContext: childInput('narrative-pages'), log: logEv, allowCancel: true, advanceLockMs: advanceLockMs });
        if (pr.aborted) { logEv({ event: 'node_aborted', node_id: node.id }); return; }
        var cn = NR.commitNode(state, mission, prep);
        logEv({ event: 'node_committed', node_id: node.id, ok: cn.ok });
        if (!cn.ok) return;
        objectiveUpdate();
      }
      // 3) visita già attiva: si prosegue direttamente col widget
    }

    // loop del widget: dopo ogni ramo si ricalcolano le scelte residue.
    // Visita iniziale con domande già poste: si continua AUTOMATICAMENTE
    // (zero frame di gameplay tra le due domande). Visita riaperta: le
    // domande residue sono facoltative, la cancellazione è consentita.
    var firstIter = true;
    while (true) {
      var choices = NR.availableChoices(state, mission, node);
      if (choices.length === 0) {
        // sessione APERTA senza nulla da offrire (es. riaperta ma residue
        // esaurite): risposta diegetica; a metà visita il silenzio è corretto
        // (l'ultima pagina del ramo ha già chiuso la scena).
        if (firstIter) await closedLine();
        logEv({ event: 'visit_no_choices_left' });
        break;
      }
      firstIter = false;
      var stNow = peek();
      var v = stNow.visits[vs] || { questions_asked: [], reopened: false };
      var allowCancel = v.reopened || v.questions_asked.length === 0;
      var ctx = childInput('narrative-widget');
      var res = await UI.openChoice({
        state: state, mission: mission, node: node, container: container,
        inputContext: ctx, log: logEv, allowCancel: allowCancel, advanceLockMs: advanceLockMs
      });
      if (res.aborted) { logEv({ event: 'widget_aborted' }); break; }
      if (res.error) {
        // transazione parziale o stale: esito esplicito. Recupero scelto
        // dall'adapter: registra, rilascia il lock figlio orfano, chiude la
        // sessione (lo stato committato resta; nulla viene mascherato).
        logEv({ event: 'widget_error', error: res.error, partial: !!res.partial_transaction });
        if (res.partial_transaction) partialError = true;
        ctx.forceRelease();
        break;
      }
      objectiveUpdate();
      NR.checkCompletion(state, mission);
      var after = peek();
      var vAfter = after.visits[vs];
      if (vAfter && vAfter.closed && !vAfter.reopened) { logEv({ event: 'visit_closed' }); break; }
      if (vAfter && vAfter.reopened) {
        var left = NR.availableChoices(state, mission, node);
        if (left.length === 0) { logEv({ event: 'visit_residuals_exhausted' }); break; }
      }
    }
  }
})();
