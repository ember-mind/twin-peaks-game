/* narrative-finale-production.js — ponte fisico M9 → M10 → Loggia → epilogo.
 * M10 parte dalla soglia appena M9 consegna Leland. In Loggia ordine e attori
 * sono scelti camminando; epilogo torna nel mondo e finisce al cartello sud.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  var GAME = window.GAME = window.GAME || {};
  var FP = GAME.NarrativeFinaleProduction = {};
  var KEY = 'twin-peaks:finale:v2';
  var testMode = new URLSearchParams(location.search).get('narrativeTest') === '1';
  var restoring = false;
  var woodsRetryBlocked = false;

  function engine() { return GAME.Engine; }
  function finale() { return GAME.NarrativeFinale; }
  function classicSnapshot() {
    var E = engine(), s = E && E.state;
    if (!s) return null;
    return { mapId: s.mapId, tx: s.player.tx, ty: s.player.ty, dir: s.player.dir, clues: s.clues.slice(), flags: JSON.parse(JSON.stringify(s.flags || {})) };
  }
  function saveClassic() {
    if (testMode) return true;
    var snap = classicSnapshot(); if (!snap) return;
    var NP = GAME.NarrativeProduction;
    if (NP && NP.onFinaleClassicSave) {
      var coordinated = NP.onFinaleClassicSave(snap);
      if (coordinated && coordinated.handled) {
        if (!coordinated.ok) FP.checkpointError = coordinated.error || 'finale_checkpoint_failed';
        else FP.checkpointError = null;
        return !!coordinated.ok;
      }
    }
    try { localStorage.setItem('tp_save', JSON.stringify(snap)); return true; }
    catch (_) { FP.checkpointError = 'classic_save_write_failed'; return false; }
  }
  function saveFinale() {
    if (testMode) return true;
    var NF = finale(), raw = NF && NF.serialize();
    if (!raw) { FP.checkpointError = 'finale_state_missing'; return false; }
    try {
      localStorage.setItem(KEY + ':tmp', raw);
      if (localStorage.getItem(KEY + ':tmp') !== raw) throw new Error('finale_temp_verify_failed');
      localStorage.setItem(KEY, raw);
      localStorage.removeItem(KEY + ':tmp');
      return true;
    } catch (_) {
      try { localStorage.removeItem(KEY + ':tmp'); } catch (_) {}
      FP.checkpointError = 'finale_save_write_failed';
      return false;
    }
  }
  function checkpointStorageKeys() {
    var NS = GAME.NarrativeSave;
    var main = NS && NS.keyFor ? NS.keyFor('main') : null;
    return [KEY, KEY + ':tmp', 'tp_save'].concat(main ? [
      main, main + ':tmp', main + ':backup', 'twin-peaks:narrative:' + GAME.NarrativeRuntime.packageId + ':meta'
    ] : []);
  }
  function captureCheckpoint() {
    var snap = {};
    checkpointStorageKeys().forEach(function (key) { snap[key] = localStorage.getItem(key); });
    return snap;
  }
  function restoreCheckpoint(snap) {
    var error = null;
    Object.keys(snap).forEach(function (key) {
      try {
        if (snap[key] === null) localStorage.removeItem(key);
        else localStorage.setItem(key, snap[key]);
      } catch (e) { error = String(e && e.message || e); }
    });
    return error;
  }
  function saveCheckpoint() {
    if (restoring || testMode) return true;
    var before = captureCheckpoint();
    if (!saveClassic()) {
      var classicRollback = restoreCheckpoint(before);
      if (classicRollback) FP.checkpointError = 'checkpoint_rollback_failed: ' + classicRollback;
      return false;
    }
    if (!saveFinale()) {
      var finaleRollback = restoreCheckpoint(before);
      if (finaleRollback) FP.checkpointError = 'checkpoint_rollback_failed: ' + finaleRollback;
      return false;
    }
    FP.checkpointError = null;
    return true;
  }
  function removeSave() {
    if (testMode) return;
    try { localStorage.removeItem(KEY); localStorage.removeItem(KEY + ':tmp'); } catch (_) {}
  }
  /* L'uscita dal sogno è definita in js/maps.js (redroom '8,11' -> stanza 315):
   * la ricordiamo prima che il finale la dirotti sul bosco, così il reset
   * ripristina la porta canonica invece di un letterale legacy. */
  var dreamExit = null;
  function rememberDreamExit() {
    if (dreamExit || !GAME.Maps || !GAME.Maps.redroom) return;
    var d = GAME.Maps.redroom.doors['8,11'];
    if (d && d.to !== 'woods') dreamExit = { to: d.to, tx: d.tx, ty: d.ty, dir: d.dir };
  }
  function restoreDreamExit() {
    if (!GAME.Maps || !GAME.Maps.redroom) return;
    rememberDreamExit();
    GAME.Maps.redroom.doors['8,11'] = dreamExit ? { to: dreamExit.to, tx: dreamExit.tx, ty: dreamExit.ty, dir: dreamExit.dir }
      : { to: 'room_315', tx: 2, ty: 6, dir: 'down' };
  }
  function copyFlagsToClassic(finalState) {
    var E = engine(); if (!E || !E.state || !finalState) return;
    Object.keys(finalState.flags || {}).forEach(function (name) { if (finalState.flags[name]) E.state.flags[name] = true; });
    if (finalState.flags && finalState.flags.leland_morto) {
      E.state.flags.leland_confessa = true;
      E.state.flags.done_leland_interr = true;
    }
  }
  function finaleProp(state, id) {
    if (!state.props[id]) state.props[id] = {
      formulation: { status: 'unformulated', created_from: [] },
      presentations: [], social_status: { accepted_by: [] }, factual_status: 'unconfirmed'
    };
    return state.props[id];
  }
  function upsertFinaleNote(state, id, text) {
    var i;
    for (i = 0; i < state.notebook.length; i++) {
      if (state.notebook[i].id === id) { state.notebook[i].text = text; return; }
    }
    state.notebook.push({ id: id, kind: 'note', text: text });
  }
  function commitAdmissionsToNarrative(payload) {
    var A = GAME.NarrativeAdapter;
    var state = A && A.getState && A.getState();
    if (!state) throw new Error('narrative_state_missing_for_admissions');
    if (state.flags.m10_admissions_committed) return state;
    finaleProp(state, 'P6').factual_status = payload.p6_status;
    finaleProp(state, 'P8').factual_status = payload.p8_status;
    upsertFinaleNote(state, 'm10.admission.taxi', 'A verbale — Leland: il taxi non è mai stato chiamato. «Ho mentito io.»');
    upsertFinaleNote(state, 'm10.admission.victims', 'A verbale — Leland ammette di avere ucciso Laura Palmer e Maddy Ferguson.');
    upsertFinaleNote(state, 'm10.admission.scene', 'A verbale — Leland ammette il vagone, il trasporto al lago e le lettere R/O.');
    state.flags.m10_admissions_committed = true;
    state.revision += 1;
    A.setState(state);
    return state;
  }
  function participantSnapshot() {
    var E = engine(), A = GAME.NarrativeAdapter, NR = GAME.NarrativeRuntime;
    var NP = GAME.NarrativeProduction;
    return {
      classic: classicSnapshot(),
      classic_mode: E && E.state && E.state.mode,
      engine_world: E && E.captureWorldState ? E.captureWorldState() : null,
      narrative: A && A.getState && NR ? NR.deserialize(NR.serialize(A.getState())) : null,
      save_cursor: NP && NP.captureSaveCursor ? NP.captureSaveCursor() : null
    };
  }
  function restoreParticipants(snapshot) {
    if (!snapshot) return;
    var E = engine(), s = E && E.state, classic = snapshot.classic;
    if (E && E.restoreWorldState && snapshot.engine_world) {
      E.restoreWorldState(snapshot.engine_world);
    } else if (s && classic) {
      s.mapId = classic.mapId;
      s.player.tx = classic.tx; s.player.ty = classic.ty; s.player.dir = classic.dir;
      s.clues = classic.clues.slice();
      s.flags = JSON.parse(JSON.stringify(classic.flags || {}));
      s.mode = snapshot.classic_mode;
    }
    var A = GAME.NarrativeAdapter;
    if (A && A.setState && snapshot.narrative) A.setState(snapshot.narrative);
    var NP = GAME.NarrativeProduction;
    if (NP && NP.restoreSaveCursor) NP.restoreSaveCursor(snapshot.save_cursor);
  }
  function callbacks() {
    return {
      container: document.getElementById('narrative'),
      onBeforeMutation: participantSnapshot,
      onRollback: restoreParticipants,
      onFlag: function (name, value) {
        var E = engine(); if (E && E.state && value) E.state.flags[name] = true;
        if (name === 'leland_morto' && E && E.state) { E.state.flags.leland_confessa = true; E.state.flags.done_leland_interr = true; }
      },
      onAdmissions: commitAdmissionsToNarrative,
      onState: function (state) {
        copyFlagsToClassic(state);
        return saveCheckpoint()
          ? { ok: true }
          : { ok: false, error: FP.checkpointError || 'finale_checkpoint_failed' };
      },
      onPause: function () { renderObjective(); },
      onComplete: function (state) {
        copyFlagsToClassic(state);
        var E = engine(); if (E && E.state) E.state.mode = 'end';
        if (!testMode) { try { localStorage.removeItem('tp_save'); } catch (_) {} }
        removeSave(); renderObjective();
      }
    };
  }
  function mergedValues(state) {
    var out = JSON.parse(JSON.stringify((state && state.values) || {}));
    Object.keys((state && state.evidence) || {}).forEach(function (id) { if (state.evidence[id]) out[id.toLowerCase()] = true; });
    Object.keys((state && state.flags) || {}).forEach(function (id) { if (state.flags[id] && out[id] === undefined) out[id] = true; });
    return out;
  }
  function renderObjective() {
    var el = document.getElementById('objective'), NF = finale();
    if (!el || !NF || !NF.isPending || !NF.isPending()) return false;
    var copy = FP.lastTransitionError ? 'Salvataggio non riuscito. Premi A per riprovare.' : NF.objective();
    el.style.display = copy && !NF.isActive() ? '' : 'none';
    if (copy) {
      var A = GAME.NarrativeAdapter;
      el.textContent = copy + (A && A.isNotebookEnabled && A.isNotebookEnabled() ? '  ·  T: taccuino' : '');
    }
    if (GAME.RetroUI && GAME.RetroUI.render) GAME.RetroUI.render();
    return true;
  }
  function consumePhysicalTransition(result) {
    if (result && result.ok) {
      FP.lastTransitionError = null;
      renderObjective();
    } else {
      FP.lastTransitionError = result && result.error || 'finale_checkpoint_failed';
      FP.checkpointError = FP.lastTransitionError;
      renderObjective();
    }
    // Finale possiede questa interazione anche quando checkpoint fallisce:
    // mai cadere nel dialogo legacy. Stato rollbackato permette retry.
    return true;
  }

  /* Act 5 pass 01: la missione M10 possiede l'interrogatorio; il finale viene
   * armato solo a leland_morto e parte in pausa sulla Loggia. */
  FP.arm = function (narrativeState) {
    var NF = finale(); if (!NF) return { ok: false, error: 'finale_module_missing' };
    if (NF.isPending && NF.isPending()) return { ok: true, repeated: true };
    if (!narrativeState || !narrativeState.flags || !narrativeState.flags.leland_morto) return { ok: false, error: 'finale_arm_before_leland_morto' };
    var p6 = narrativeState.props && narrativeState.props.P6;
    var carry = {
      values: mergedValues(narrativeState),
      flags: JSON.parse(JSON.stringify((narrativeState && narrativeState.flags) || {})),
      p6_status: p6 ? p6.factual_status : undefined,
      narrative_revision: narrativeState && narrativeState.revision
    };
    var opts = callbacks(); opts.carryover = carry;
    FP.checkpointError = null;
    woodsRetryBlocked = false;
    var started = NF.startAtLodge(opts);
    if (started.ok && FP.checkpointError) {
      var checkpointError = FP.checkpointError;
      NF.reset();
      return { ok: false, error: checkpointError };
    }
    if (started.ok) renderObjective(); // onState ha gia' salvato checkpoint correlato
    return started;
  };

  FP.tryInteract = function (mapId, actorId) {
    var NF = finale(); if (!NF || !NF.isPending || !NF.isPending()) return false;
    if (NF.isActive()) return true;
    var state = NF.getState();
    if (state.stage === 'await_post_s3' && mapId === 'sheriff' && actorId === 'leland') {
      return consumePhysicalTransition(NF.resumePostS3());
    }
    if ((state.stage === 'await_lodge' || state.stage === 'await_lodge_second') && mapId === 'redroom' && (actorId === 'mfap' || actorId === 'bob')) {
      var lodge = NF.beginLodge(actorId);
      if (!lodge.ok && lodge.error === 'lodge_actor_already_seen') {
        return consumePhysicalTransition(NF.blockLodgeInteraction(actorId));
      }
      return consumePhysicalTransition(lodge);
    }
    if (state.stage === 'await_laura' && mapId === 'redroom' && actorId === 'laura') {
      return consumePhysicalTransition(NF.resumeLaura());
    }
    // Finale pending possiede sempre gli attori della Loggia. Un'interazione
    // fuori ordine mostra feedback ma non puo' cadere nei dialoghi legacy,
    // alcuni dei quali chiudono ancora il gioco per compatibilita' classica.
    if (mapId === 'redroom' && (actorId === 'mfap' || actorId === 'bob' || actorId === 'laura')) {
      var blocked = NF.blockLodgeInteraction(actorId);
      return consumePhysicalTransition(blocked);
    }
    if (state.stage === 'await_epilogue_station' && mapId === 'sheriff' && actorId === 'truman') {
      return consumePhysicalTransition(NF.resumeEpilogueStation());
    }
    if (state.stage === 'await_epilogue_exit' && mapId === 'palmer' && actorId === 'sarah') {
      return consumePhysicalTransition(NF.resumeEpilogueOptional('sarah'));
    }
    if (state.stage === 'await_epilogue_exit' && mapId === 'hospital' && actorId === 'ronette') {
      return consumePhysicalTransition(NF.resumeEpilogueOptional('ronette'));
    }
    return false;
  };

  FP.tryInteractAt = function (mapId, x, y) {
    var NF = finale(); if (!NF || !NF.isPending || !NF.isPending() || NF.isActive()) return false;
    var state = NF.getState();
    if (state.stage === 'await_lodge_exit' && mapId === 'woods' && woodsRetryBlocked) {
      var woodsRetry = NF.resumeWoods();
      woodsRetryBlocked = !woodsRetry.ok;
      return consumePhysicalTransition(woodsRetry);
    }
    if (state.stage === 'await_epilogue_exit' && mapId === 'town' && x === 30 && y === 30) {
      return consumePhysicalTransition(NF.resumeEpilogueExit());
    }
    return false;
  };

  FP.poll = function () {
    var NF = finale(), E = engine();
    if (!NF || !E || !E.state || !NF.isPending || !NF.isPending()) return false;
    var state = NF.getState();
    if (state.flags && state.flags.leland_morto && GAME.Maps && GAME.Maps.redroom) {
      rememberDreamExit();
      GAME.Maps.redroom.doors['8,11'] = { to: 'woods', tx: 14, ty: 5, dir: 'down' };
    }
    if (!NF.isActive() && state.stage === 'await_lodge_exit' && E.state.mapId === 'woods') {
      if (woodsRetryBlocked) return false;
      var woods = NF.resumeWoods();
      woodsRetryBlocked = !woods.ok;
      return consumePhysicalTransition(woods);
    }
    return false;
  };

  FP.objective = function () { var NF = finale(); return NF && NF.objective ? NF.objective() : ''; };
  FP.isActive = function () { var NF = finale(); return !!(NF && NF.isActive && NF.isActive()); };
  FP.isPending = function () { var NF = finale(); return !!(NF && NF.isPending && NF.isPending()); };
  FP.reset = function () { var NF = finale(); woodsRetryBlocked = false; if (NF && NF.reset) NF.reset(); restoreDreamExit(); removeSave(); renderObjective(); };
  FP.renderObjective = renderObjective;
  FP.restoreFromStorage = function (classic) {
    if (testMode) return { ok: true, absent: true };
    var raw = null;
    try { raw = localStorage.getItem(KEY); }
    catch (_) { return { ok: false, error: 'finale_save_read_failed' }; }
    if (!raw) return { ok: true, absent: true };
    if (!classic) return { ok: false, error: 'finale_classic_save_missing' };
    var E = engine();
    if (!E || !E.restoreClassicSave) return { ok: false, error: 'classic_restore_unavailable' };
    var beforeRestore = participantSnapshot();
    function rollbackRestore(error) {
      var NF = finale();
      if (NF && NF.reset) NF.reset();
      woodsRetryBlocked = false;
      restoreParticipants(beforeRestore);
      restoreDreamExit();
      FP.loadError = error || 'finale_restore_failed';
      renderObjective();
      return { ok: false, error: FP.loadError, rolled_back: true };
    }
    var world = E.restoreClassicSave(classic);
    if (!world.ok) return rollbackRestore(world.error || 'classic_restore_failed');
    restoring = true;
    var restored;
    try { restored = finale() && finale().deserialize(raw, callbacks()); }
    finally { restoring = false; }
    if (!restored || !restored.ok) {
      return rollbackRestore(restored && restored.error || 'finale_save_invalid');
    }
    // M10 retro ritirata (Act 5 pass 01): un checkpoint salvato dentro le fasi
    // parafrasate dell'interrogatorio non viene rigiocato. Fail loud: la UI di
    // recupero lo mostra, nessuna conversione silenziosa.
    if (finale().RETIRED_M10_STAGES && finale().RETIRED_M10_STAGES.indexOf(restored.state.stage) >= 0) {
      return rollbackRestore('finale_save_in_retired_m10_stage: ' + restored.state.stage);
    }
    if (restored.migrated && !saveCheckpoint()) {
      return rollbackRestore(FP.checkpointError || 'finale_migration_save_failed');
    }
    copyFlagsToClassic(restored.state);
    renderObjective();
    FP.loadError = null;
    return { ok: true, restored: true, state: restored.state, world: world };
  };
})();
