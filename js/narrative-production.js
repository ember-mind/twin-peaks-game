/* narrative-production.js — boot participant del runtime M4→M9→finale.
 * Collega runtime/adapter/taccuino alla build reale e sincronizza solo i flag
 * di confine col motore classico. Dopo M9 consegna M10/Loggia al finale
 * causale, conservando valori e conseguenze del runtime.
 */
(function () {
  if (typeof window === 'undefined') return;
  var GAME = window.GAME = window.GAME || {};
  var NP = GAME.NarrativeProduction = {};
  var SLOT = 'main';
  var syncTimer = null;
  var lastSavedRevision = -1;
  var lastSavedClassicFingerprint = null;
  var resetSeen = false;
  var testMode = false;

  function classicSnapshot() {
    var E = GAME.Engine, s = E && E.state;
    if (!s) return null;
    return {
      mapId: s.mapId,
      tx: s.player.tx,
      ty: s.player.ty,
      dir: s.player.dir,
      clues: s.clues.slice(),
      flags: JSON.parse(JSON.stringify(s.flags || {}))
    };
  }

  function inspectClassicSave() {
    var raw;
    try {
      raw = localStorage.getItem('tp_save');
      if (raw === null) return { ok: true, absent: true, state: null };
      var parsed = JSON.parse(raw);
      var E = GAME.Engine;
      var checked = E && E.inspectClassicSaveState
        ? E.inspectClassicSaveState(parsed)
        : { ok: false, error: 'classic_save_map_catalog_unavailable' };
      if (!checked.ok) return { ok: false, error: checked.error, raw_present: true };
      return { ok: true, absent: false, state: parsed };
    } catch (_) { return { ok: false, error: 'classic_save_corrupt_json', raw_present: raw !== null }; }
  }

  function readClassicSave() {
    var inspected = inspectClassicSave();
    return inspected.ok ? inspected.state : null;
  }

  function clearNarrativeSlot() {
    var NS = GAME.NarrativeSave;
    if (!NS) return;
    var key = NS.keyFor(SLOT);
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(key + ':tmp');
      localStorage.removeItem(key + ':backup');
      localStorage.removeItem('twin-peaks:narrative:narrative-v1.0:meta');
    } catch (_) {}
  }

  function loadNarrativeState(NR, NS, classic) {
    if (!classic || !NS) return { ok: true, fresh: true, state: NR.createState() };
    return NS.load(SLOT, { classic: classic, classicAdvanced: false });
  }

  function showSaveRecovery(problem) {
    problem = problem || {};
    GAME.NarrativeLoadBlocked = true;
    NP.loadError = { source: problem.source || 'narrative', error: problem.error || 'save_invalid' };
    // Quarantena logica: la coppia resta intatta nello storage per eventuale
    // recupero manuale, ma nessun lato viene caricato o promosso nel runtime.
    try {
      NP.quarantinedSavePair = {
        source: NP.loadError.source,
        error: NP.loadError.error,
        classic_present: localStorage.getItem('tp_save') !== null,
        narrative_present: localStorage.getItem('twin-peaks:narrative:narrative-v1.0:slot:main') !== null
      };
    } catch (_) {
      NP.quarantinedSavePair = { source: NP.loadError.source, error: NP.loadError.error };
    }
    var container = document.getElementById('narrative');
    if (!container || container.querySelector('.nw-save-recovery')) return;
    var root = document.createElement('div');
    root.className = 'nw-root nw-save-recovery';
    root.setAttribute('role', 'alertdialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('data-save-source', NP.loadError.source);
    var title = document.createElement('div'); title.className = 'nw-title'; title.textContent = 'SALVATAGGIO DANNEGGIATO';
    var copy = document.createElement('div'); copy.className = 'nw-page';
    copy.textContent = 'Backup gia\' provato. Nessun dato cancellato. Riprova o inizia da capo.';
    var retry = document.createElement('div'); retry.className = 'nw-opt nw-focus'; retry.setAttribute('data-recovery-action', 'retry'); retry.textContent = '▶ RIPROVA';
    var fresh = document.createElement('div'); fresh.className = 'nw-opt'; fresh.setAttribute('data-recovery-action', 'new'); fresh.textContent = '  NUOVA PARTITA';
    root.appendChild(title); root.appendChild(copy); root.appendChild(retry); root.appendChild(fresh); container.appendChild(root);
    var options = [retry, fresh], selected = 0, done = false;
    function render() {
      options.forEach(function (el, i) { el.className = 'nw-opt' + (i === selected ? ' nw-focus' : ''); el.textContent = (i === selected ? '▶ ' : '  ') + (i ? 'NUOVA PARTITA' : 'RIPROVA'); });
    }
    function cleanup() { window.removeEventListener('keydown', onKey, true); }
    function activate(action) {
      if (done) return; done = true; cleanup();
      if (action === 'new') {
        clearNarrativeSlot();
        try {
          localStorage.removeItem('twin-peaks:finale:v2');
          localStorage.removeItem('tp_save');
        } catch (_) {}
      }
      location.reload();
    }
    function onKey(e) {
      e.stopPropagation(); e.preventDefault();
      if (e.repeat) return;
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'KeyW' || e.code === 'KeyS') { selected = selected ? 0 : 1; render(); }
      else if (e.code === 'Enter' || e.code === 'KeyE' || e.code === 'KeyZ') activate(selected ? 'new' : 'retry');
    }
    root.addEventListener('click', function (e) {
      var opt = e.target.closest && e.target.closest('[data-recovery-action]');
      if (opt) activate(opt.getAttribute('data-recovery-action'));
    });
    root.addEventListener('touchend', function (e) {
      var opt = e.target.closest && e.target.closest('[data-recovery-action]');
      if (opt) { e.preventDefault(); activate(opt.getAttribute('data-recovery-action')); }
    }, { passive: false });
    window.addEventListener('keydown', onKey, true);
  }

  function ensureFlag(NR, state, name) {
    if (!state.flags[name]) NR.applyEffects(state, [{ set: name }]);
  }

  function ensureEvidence(NR, state, name) {
    if (!state.evidence[name]) NR.applyEffects(state, [{ evidence: name }]);
  }

  // Explicit aliases for evidence genuinely acquired by the opening classic
  // dialogues. Act flags are not proof of acquisition. Do not formulate any
  // proposition here: the later notebook comparisons remain player actions.
  function syncClassicEvidence(NR, state, classicClues) {
    if (!Array.isArray(classicClues)) return [];
    var aliases = { diario: 'E1_DIARIO', lettera_r: 'E3_LETTERA_R' };
    var added = [];
    Object.keys(aliases).forEach(function (clue) {
      var evidence = aliases[clue];
      if (classicClues.indexOf(clue) >= 0 && !state.evidence[evidence]) {
        ensureEvidence(NR, state, evidence);
        added.push(evidence);
      }
    });
    // A repaired older save must be persisted even if its classic fingerprint
    // did not change. Repeated polling must not bump revision or duplicate data.
    if (added.length) state.revision++;
    return added;
  }

  function syncClassicToNarrative(NR, state, classicFlags) {
    var changed = false;
    // audrey_indaga è scritto dal layer classico (data.js audrey_a2 /
    // audrey_a2_ben): senza questo ponte il nodo facoltativo m6_audrey resta
    // irraggiungibile a runtime (M6 stitch C4).
    ['sogno_fatto', 'atto3', 'atto4', 'atto5', 'gigante1', 'maddy_trovata', 'leland_morto', 'sarah_visione_ascoltata', 'audrey_indaga'].forEach(function (name) {
      if (classicFlags[name] && !state.flags[name]) {
        ensureFlag(NR, state, name);
        changed = true;
      }
    });
    // Compatibilità salvataggi legacy: il vecchio dialogo classico vale come
    // testimonianza. Nelle nuove partite la sorgente canonica è m8_leland_taxi,
    // fisicamente prima del ritrovamento; M9 non la scrive mai.
    if (classicFlags.done_leland_dove && !state.evidence.T_LELAND_TAXI) {
      ensureEvidence(NR, state, 'T_LELAND_TAXI');
      changed = true;
    }
    return changed;
  }

  function syncNarrativeToClassic(state, classicFlags) {
    if (state.flags.atto3) classicFlags.atto3 = true;
    if (state.flags.atto4) classicFlags.atto4 = true;
    if (state.flags.atto5) classicFlags.atto5 = true;
    if (state.flags.jacques_preso) classicFlags.jacques_preso = true;
    // Atto 3: la porta classica traincar 21,0 → oej legge east_route_confirmed
    // (js/maps.js); l'unico writer è il nodo narrativo m5_tracks_north.
    if (state.flags.east_route_confirmed) classicFlags.east_route_confirmed = true;
    if (state.flags.jacques_dead) classicFlags.jacques_morto = true;
    if (state.flags.maddy_trovata) classicFlags.maddy_trovata = true;
    // M8 narrativa possiede Maddy e Leland: i duplicati classici a Palmer
    // restano nascosti mentre le presenze fisiche canoniche vivono al diner.
    if (state.flags.atto4) classicFlags.narrative_m8_owned = true;
    // pass 01 (node split B1): il tavolo (Truman, dichiarazione del Gigante)
    // e' ora m8_roadhouse_truman; il telefono e' un nodo separato
    // (m8_roadhouse_phone) che NON deve pilotare gigante2.
    if (state.nodes_done.m8_roadhouse_truman) classicFlags.gigante2 = true;
    // Act 5 pass 01: M10 scrive leland_morto; il mondo classico (obiettivo
    // Loggia, porta del sogno) legge anche i due flag del vecchio dialogo.
    if (state.flags.leland_morto) {
      classicFlags.leland_morto = true;
      classicFlags.leland_confessa = true;
      classicFlags.done_leland_interr = true;
    }
  }

  function objectiveText(NR, A) {
    return A.getObjectiveText ? A.getObjectiveText() : '';
  }

  function renderObjective(NR, A) {
    var el = document.getElementById('objective');
    var E = GAME.Engine;
    if (!el || !E || !E.state || E.state.mode !== 'play') {
      if (el) el.style.display = 'none';
      return;
    }
    // Notebook possiede gia' una sola copia risolta dell'obiettivo. Il sync
    // periodico non deve riaprire il duplicato DOM mentre il pannello e' vivo.
    if (A.isNotebookOpen && A.isNotebookOpen()) {
      el.style.display = 'none';
      return;
    }
    if (!A.isEnabled()) {
      if (GAME.NarrativeFinaleProduction && GAME.NarrativeFinaleProduction.renderObjective &&
          GAME.NarrativeFinaleProduction.renderObjective()) return;
      el.style.display = 'none';
      return;
    }
    var copy = objectiveText(NR, A);
    el.style.display = copy ? '' : 'none';
    if (copy) el.textContent = copy + '  ·  T: taccuino';
  }

  function persist(NR, NS, A, classicOverride) {
    if (testMode) return { ok: false, skipped: 'test_mode' };
    if (!NS || !A.isEnabled() || !NS.canSave()) return { ok: false, skipped: 'save_not_allowed' };
    var state = A.getState();
    var classic = classicOverride || classicSnapshot();
    if (!classic) return { ok: false, skipped: 'classic_missing' };
    var fingerprint = NS.classicFingerprint(classic);
    if (state.revision === lastSavedRevision && fingerprint === lastSavedClassicFingerprint) return { ok: true, repeated: true };
    var mainKey = NS.keyFor(SLOT);
    var storageKeys = [mainKey, mainKey + ':tmp', mainKey + ':backup', 'twin-peaks:narrative:' + NR.packageId + ':meta'];
    var before = {};
    storageKeys.forEach(function (key) { before[key] = localStorage.getItem(key); });
    var saved = NS.save(SLOT, { classic: classic, savedAt: new Date().toISOString() });
    if (saved.ok) {
      try { localStorage.setItem('tp_save', JSON.stringify(classic)); }
      catch (_) {
        var rollbackError = null;
        storageKeys.forEach(function (key) {
          try {
            if (before[key] === null) localStorage.removeItem(key);
            else localStorage.setItem(key, before[key]);
          } catch (e) { rollbackError = String(e && e.message || e); }
        });
        return { ok: false, error: rollbackError ? 'classic_save_write_failed_rollback_failed: ' + rollbackError : 'classic_save_write_failed_rolled_back' };
      }
      lastSavedRevision = state.revision;
      lastSavedClassicFingerprint = fingerprint;
    }
    return saved;
  }

  // Nel finale A resta UI read-only, ma B6 può aggiungere al ledger condiviso
  // le ammissioni già pronunciate. Save layer riallinea fingerprint e payload
  // narrativo nello stesso envelope; tp_save cambia solo dopo rebind valida.
  function persistFinaleClassic(NS, classic) {
    if (testMode) return { handled: true, ok: true, skipped: 'test_mode' };
    if (!NP.ready) return { handled: false, ok: false, skipped: 'boot_not_ready' };
    if (!NS || !classic) return { handled: true, ok: false, error: 'finale_checkpoint_missing_dependency' };
    var fingerprint = NS.classicFingerprint(classic);
    var A = GAME.NarrativeAdapter;
    var narrativeRevision = A && A.getState ? A.getState().revision : lastSavedRevision;
    if (fingerprint === lastSavedClassicFingerprint && narrativeRevision === lastSavedRevision) {
      return { handled: true, ok: true, repeated: true };
    }
    var mainKey = NS.keyFor(SLOT);
    var storageKeys = [mainKey, mainKey + ':tmp', mainKey + ':backup', 'twin-peaks:narrative:' + GAME.NarrativeRuntime.packageId + ':meta', 'tp_save'];
    var before = {};
    storageKeys.forEach(function (key) { before[key] = localStorage.getItem(key); });
    var rebound = NS.rebindClassicForFinale(SLOT, classic, {
      savedAt: new Date().toISOString(),
      narrativeState: A && A.getState ? A.getState() : null
    });
    if (!rebound.ok) {
      NP.checkpointError = rebound.error || 'finale_checkpoint_rebind_failed';
      return { handled: true, ok: false, error: NP.checkpointError };
    }
    try { localStorage.setItem('tp_save', JSON.stringify(classic)); }
    catch (_) {
      var rollbackError = null;
      storageKeys.forEach(function (key) {
        try {
          if (before[key] === null) localStorage.removeItem(key);
          else localStorage.setItem(key, before[key]);
        } catch (e) { rollbackError = String(e && e.message || e); }
      });
      NP.checkpointError = rollbackError
        ? 'classic_save_write_failed_rollback_failed: ' + rollbackError
        : 'classic_save_write_failed_rolled_back';
      return { handled: true, ok: false, error: NP.checkpointError };
    }
    lastSavedClassicFingerprint = fingerprint;
    lastSavedRevision = narrativeRevision;
    NP.checkpointError = null;
    return { handled: true, ok: true, generation: rebound.generation };
  }

  function boot() {
    var NR = GAME.NarrativeRuntime;
    var A = GAME.NarrativeAdapter;
    var NS = GAME.NarrativeSave;
    var D = GAME.NarrativeData;
    var container = document.getElementById('narrative');
    if (!NR || !A || !D || !container || !GAME.installNarrativeCatalogs) return;

    testMode = new URLSearchParams(location.search).get('narrativeTest') === '1';
    NP.testMode = testMode;
    GAME.installNarrativeCatalogs();
    if (GAME.NarrativeLoadBlocked) { showSaveRecovery(NP.loadError || { source: 'finale', error: 'save_invalid' }); return; }
    var missions = ['M4', 'M5', 'M6', 'M8', 'M9', 'M10'].map(function (id) { return D.missions[id]; }).filter(Boolean);
    var classicLoad = testMode ? { ok: true, state: null } : inspectClassicSave();
    if (!classicLoad.ok) { showSaveRecovery({ source: 'classic', error: classicLoad.error }); return; }
    var classic = classicLoad.state;
    // currentMissionFor(), usato dalla validazione save, richiede che elenco
    // missioni sia già installato nell'adapter: enable fresh → load → setState.
    var state = NR.createState();
    A.enable({ mission: missions[0], missions: missions, state: state, container: container });
    var loaded = loadNarrativeState(NR, NS, classic);
    if (!loaded || !loaded.ok || !loaded.state) {
      A.disable({ keepNotebook: false });
      showSaveRecovery({ source: 'narrative', error: loaded && loaded.error });
      return;
    }
    state = loaded.state;
    lastSavedRevision = state.revision; // Durable revision, before any import repair.
    if (classic && classic.flags) syncClassicToNarrative(NR, state, classic.flags);
    if (classic) syncClassicEvidence(NR, state, classic.clues);
    A.setState(state);
    lastSavedClassicFingerprint = classic && NS ? NS.classicFingerprint(classic) : null;
    var finaleRestore = { ok: true, absent: true };
    if (GAME.NarrativeFinaleProduction && GAME.NarrativeFinaleProduction.restoreFromStorage) {
      finaleRestore = GAME.NarrativeFinaleProduction.restoreFromStorage(classic);
      if (!finaleRestore.ok) {
        A.disable({ keepNotebook: false });
        showSaveRecovery({ source: 'finale', error: finaleRestore.error });
        return;
      }
      if (finaleRestore.restored) A.disable({ keepNotebook: true });
    }
    NP.ready = true;

    syncTimer = window.setInterval(function () {
      var E = GAME.Engine;
      if (!E || !E.state) return;

      // N dal titolo è autorizzazione esplicita a cancellare la partita:
      // azzera anche slot narrativo correlato, una volta per nuovo prologo.
      if (!testMode && E.state.mode === 'intro' && !readClassicSave() && !resetSeen) {
        resetSeen = true;
        clearNarrativeSlot();
        state = NR.createState();
        A.setState(state);
        if (GAME.NarrativeFinaleProduction && GAME.NarrativeFinaleProduction.reset) GAME.NarrativeFinaleProduction.reset();
        lastSavedRevision = -1;
        lastSavedClassicFingerprint = null;
      }
      if (E.state.mode === 'title') resetSeen = false;

      if (E.state.mode === 'play') {
        if (GAME.NarrativeFinaleProduction && GAME.NarrativeFinaleProduction.poll) GAME.NarrativeFinaleProduction.poll();
        var classicChanged = syncClassicToNarrative(NR, state, E.state.flags);
        var classicEvidence = syncClassicEvidence(NR, state, E.state.clues);
        var carryoverEvidence = A.syncCarryoverEvidence ? A.syncCarryoverEvidence() : [];
        // Classic acquisitions bypass NR.commit* hooks. Reconcile the same
        // authored cast before persisting the imported state, not only after
        // the next narrative interaction or a page reload.
        if (classicChanged || classicEvidence.length || carryoverEvidence.length) {
          if (A.syncNarrativeEntities) A.syncNarrativeEntities('classic-progress');
        }
        syncNarrativeToClassic(state, E.state.flags);
        renderObjective(NR, A);
        persist(NR, NS, A);

        // M10 chiusa (leland_morto dalla missione) e lease rilasciato: conserva
        // stato, poi consegna la Loggia al finale (Act 5 pass 01).
        if (A.isEnabled() && state.flags.leland_morto && state.nodes_done.m10_morte && !A.active()) {
          persist(NR, NS, A);
          if (GAME.NarrativeFinaleProduction && GAME.NarrativeFinaleProduction.arm) {
            var armed = GAME.NarrativeFinaleProduction.arm(state);
            if (!armed || !armed.ok) {
              NP.checkpointError = armed && armed.error || 'finale_arm_failed';
              showSaveRecovery({ source: 'finale', error: NP.checkpointError });
              return;
            }
          }
          /* Finale prende le interazioni. T resta consultabile in sola lettura;
           * B6 aggiunge soltanto ammissioni e stato fattuale al ledger condiviso. */
          A.disable({ keepNotebook: true });
          renderObjective(NR, A);
        }
      } else renderObjective(NR, A);
    }, 180);
  }

  NP.classicSnapshot = classicSnapshot;
  NP.captureSaveCursor = function () {
    return { revision: lastSavedRevision, classic_fingerprint: lastSavedClassicFingerprint };
  };
  NP.restoreSaveCursor = function (cursor) {
    if (!cursor) return;
    lastSavedRevision = cursor.revision;
    lastSavedClassicFingerprint = cursor.classic_fingerprint;
  };
  NP.inspectClassicSave = inspectClassicSave;
  NP.syncClassicToNarrative = syncClassicToNarrative;
  NP.syncClassicEvidence = syncClassicEvidence;
  NP.syncNarrativeToClassic = syncNarrativeToClassic;
  NP.renderObjective = renderObjective;
  NP.showSaveRecovery = showSaveRecovery;
  NP.onClassicSave = function (classic) {
    if (!NP.ready) return { handled: false, ok: false, skipped: 'boot_not_ready' };
    if (testMode) return { handled: true, ok: true, skipped: 'test_mode' };
    var FP = GAME.NarrativeFinaleProduction;
    if (FP && FP.isPending && FP.isPending()) return persistFinaleClassic(GAME.NarrativeSave, classic);
    var result = persist(GAME.NarrativeRuntime, GAME.NarrativeSave, GAME.NarrativeAdapter, classic);
    return { handled: true, ok: !!(result && result.ok), error: result && result.error, skipped: result && result.skipped };
  };
  NP.onFinaleClassicSave = function (classic) { return persistFinaleClassic(GAME.NarrativeSave, classic); };
  NP.stop = function () { if (syncTimer) window.clearInterval(syncTimer); syncTimer = null; };
  window.addEventListener('load', boot);
})();
