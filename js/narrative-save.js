/* narrative-save.js — B5: persistenza dello stato narrativo.
 *
 * Responsabilità ESCLUSIVA (contratto B5): gate di salvataggio, envelope,
 * lettura/scrittura storage, validazione envelope, correlazione col save
 * classico, consegna dello stato deserializzato. NON interpreta regole
 * narrative: l'autorità di validazione del PAYLOAD è NR.deserialize;
 * l'envelope è validato qui (format, schema, package, slot, mission,
 * fingerprint, generazione per-slot — B5.1: tutti AUTOMATICI).
 *
 * Chiave separata dal gioco classico (il payload classico NON viene toccato):
 *   twin-peaks:narrative:<package>:slot:<id>            (main)
 *   ...:tmp / ...:backup                                (scrittura atomica)
 *   twin-peaks:narrative:<package>:meta                 ({slots:{id:gen}})
 *
 * Scrittura ATOMICA: envelope → stringify → temp → rilettura → validazione
 * con NR.deserialize → backup del main → main → rimozione temp.
 *
 * NIENTE bypass pubblici del gate (B5.1): il vecchio opts.force è stato
 * eliminato; per i test esiste _saveUncheckedForTests, fuori dal percorso
 * participant. */
(function () {
  var G = (typeof window !== 'undefined' ? window : globalThis);
  var GAME = G.GAME = G.GAME || {};
  var NS = GAME.NarrativeSave = {};

  var FORMAT = '1.0.0';
  function NR() { return GAME.NarrativeRuntime; }
  function PKG() { return NR().packageId; }

  // storage iniettabile: default localStorage (browser), Map-like nei test node
  var storage = (typeof localStorage !== 'undefined') ? localStorage : null;
  NS._setStorage = function (s) { storage = s; }; // test hook (node/validatore)

  function keyFor(slotId) { return 'twin-peaks:narrative:' + PKG() + ':slot:' + slotId; }
  function metaKey() { return 'twin-peaks:narrative:' + PKG() + ':meta'; }
  NS.keyFor = keyFor;

  // lettura della meta: LASSISTA solo quando nessun main esiste (nuova
  // partita); RIGOROSA quando un main esiste — una meta assente/corrotta non
  // deve MAI trasformarsi in un controllo di generazione saltato (B5.2)
  // lettura della meta (B5.4): la modalità permissiva è permissiva SOLO
  // sull'ASSENZA (nuova partita) — la CORRUZIONE lancia SEMPRE, altrimenti
  // il recupero anticipato del primo salvataggio potrebbe ricostruire in
  // silenzio una meta corrotta perdendo le generazioni degli altri slot
  function readMeta(strictForSlot) {
    var raw = storage.getItem(metaKey());
    if (raw === null) {
      if (strictForSlot) throw new Error('save_generation_meta_missing');
      return { slots: {} };
    }
    var m;
    try { m = JSON.parse(raw); } catch (e) { throw new Error('save_generation_meta_corrupt'); }
    if (!m || typeof m !== 'object' || Array.isArray(m) ||
        !m.slots || typeof m.slots !== 'object' || Array.isArray(m.slots)) {
      throw new Error('save_generation_meta_corrupt');
    }
    for (var sid in m.slots) {
      if (Object.prototype.hasOwnProperty.call(m.slots, sid)) {
        var generation = m.slots[sid];
        if (typeof generation !== 'number' || generation < 1 || generation % 1 !== 0) {
          throw new Error('save_generation_meta_corrupt');
        }
      }
    }
    return m;
  }
  function writeMeta(m) { storage.setItem(metaKey(), JSON.stringify(m)); }
  function snapshotKeys(keys) {
    var out = {};
    keys.forEach(function (key) { out[key] = storage.getItem(key); });
    return out;
  }
  function restoreKeys(snapshot) {
    var error = null;
    Object.keys(snapshot).forEach(function (key) {
      try {
        if (snapshot[key] === null) storage.removeItem(key);
        else storage.setItem(key, snapshot[key]);
      } catch (e) { error = String(e && e.message || e); }
    });
    return error;
  }

  // fingerprint del save classico: rappresentazione CANONICA dell'INTERO
  // payload (chiavi ordinate ricorsivamente; clues normalizzate perché il
  // loro ordine non è significativo). Mai scritta dentro il payload classico.
  function canonicalize(value) {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (value && typeof value === 'object') {
      var out = {};
      Object.keys(value).sort().forEach(function (k) { out[k] = canonicalize(value[k]); });
      return out;
    }
    return value;
  }
  NS.classicFingerprint = function (classic) {
    if (!classic) return 'none';
    var normalized = JSON.parse(JSON.stringify(classic));
    normalized.clues = (normalized.clues || []).slice().sort();
    return JSON.stringify(canonicalize(normalized));
  };

  // salvataggio permesso SOLO in idle: nessun lease, nessuna UI narrativa,
  // nessuna transazione parziale
  NS.canSave = function () {
    var A = GAME.NarrativeAdapter;
    if (!A || !A.isEnabled()) return false;
    if (A.active() || A.sessionStatus() !== 'idle') return false;
    if (typeof document !== 'undefined' && document.querySelector('#narrative .nw-root')) return false;
    return true;
  };
  NS.CANNOT_SAVE_TEXT = 'Termina prima il dialogo o l’annotazione in corso.';

  function doSave(slotId, opts) {
    var A = GAME.NarrativeAdapter;
    // il classico è OBBLIGATORIO nell'API participant (B5.2)
    if (opts.classic === undefined) return { ok: false, error: 'classic_save_required' };
    var mainExists = storage.getItem(keyFor(slotId)) !== null;
    var meta;
    try { meta = readMeta(mainExists); } catch (eM) { return { ok: false, error: String(eM.message || eM) }; }
    var gen = (meta.slots[String(slotId)] || 0) + 1;
    var envelope = {
      format_version: FORMAT,
      narrative_schema_version: NR().schemaVersion,
      narrative_package: PKG(),
      slot_id: String(slotId),
      save_generation: gen,
      classic_save_fingerprint: NS.classicFingerprint(opts.classic),
      mission: A.getMission().mission,
      saved_at: opts.savedAt || 'unknown',
      state: JSON.parse(NR().serialize(A.getState()))
    };
    var mainKey = keyFor(slotId), tempKey = mainKey + ':tmp', backupKey = mainKey + ':backup';
    var payload = JSON.stringify(envelope);
    var before = snapshotKeys([mainKey, tempKey, backupKey, metaKey()]);
    try {
      storage.setItem(tempKey, payload);
      var reread = storage.getItem(tempKey);
      var parsed = JSON.parse(reread);
      NR().deserialize(JSON.stringify(parsed.state));
      var current = storage.getItem(mainKey);
      if (current !== null) storage.setItem(backupKey, current);
      storage.setItem(mainKey, reread);
      // B5.2: la temp fa da JOURNAL — si rimuove SOLO dopo la commit della meta
      meta.slots[String(slotId)] = gen;
      writeMeta(meta);
      storage.removeItem(tempKey);
      return { ok: true, key: mainKey, generation: gen };
    } catch (e) {
      var rollback = restoreKeys(before);
      return { ok: false, error: rollback
        ? 'save_validation_failed_rollback_failed: ' + rollback
        : 'save_validation_failed: ' + String(e && e.message || e) };
    }
  }

  NS.save = function (slotId, opts) {
    opts = opts || {};
    if (!NS.canSave()) return { ok: false, error: 'save_not_allowed', message: NS.CANNOT_SAVE_TEXT };
    return doSave(slotId, opts);
  };
  // SOLO per i test e SOLO dietro flag esplicito: mai nella build participant
  if (G.__NARRATIVE_TEST__) {
    NS._saveUncheckedForTests = function (slotId, opts) { return doSave(slotId, opts || {}); };
  }

  // validazione AUTOMATICA dell'envelope (B5.1): format, schema, package,
  // slot richiesto, missione dell'adapter, fingerprint, generazione per-slot
  function validateEnvelope(env, slotId, opts, expectedGen) {
    if (env.format_version !== FORMAT) throw new Error('save_format_mismatch: ' + env.format_version);
    if (env.narrative_schema_version !== NR().schemaVersion) throw new Error('narrative_schema_mismatch: ' + env.narrative_schema_version);
    if (env.narrative_package !== PKG()) throw new Error('save_package_mismatch: ' + env.narrative_package);
    if (env.slot_id !== String(slotId)) throw new Error('save_slot_mismatch: env=' + env.slot_id + ' requested=' + slotId);
    // la missione si valida DOPO il deserialize, contro lo stato caricato
    // (validateMissionAgainstState in attempt) — qui nessun check pre-load
    if (opts.classic !== undefined) {
      var fp = NS.classicFingerprint(opts.classic);
      if (env.classic_save_fingerprint !== fp) throw new Error('classic_fingerprint_mismatch');
    }
    if (expectedGen !== undefined && env.save_generation !== expectedGen) {
      throw new Error('save_generation_mismatch: env=' + env.save_generation + ' expected=' + expectedGen);
    }
  }

  // load: main (generazione = meta.slots[slot]) → se corrotto/invalidо,
  // backup (generazione = meta - 1, poi promosso a main con meta riallineata)
  NS.load = function (slotId, opts) {
    opts = opts || {};
    var mainKey = keyFor(slotId), backupKey = mainKey + ':backup', tempKey = mainKey + ':tmp';
    var raw = storage.getItem(mainKey);
    // il classico è obbligatorio quando esiste una chiave o classicAdvanced (B5.2)
    if (opts.classic === undefined && (raw !== null || opts.classicAdvanced)) {
      return { ok: false, error: 'classic_save_required' };
    }
    if (raw === null) {
      // chiave assente: nuova partita → stato nuovo; partita avanzata → errore
      if (opts.classicAdvanced) return { ok: false, error: 'narrative_save_missing_for_advanced_classic' };
      return { ok: true, fresh: true, state: NR().createState() };
    }
    // B5.3: recupero del PRIMISSIMO salvataggio interrotto — caso strettamente
    // delimitato in cui la meta non è mai stata scritta (o lo slot mai
    // registrato): main==temp, generazione 1, nessun backup, envelope e
    // payload COMPLETAMENTE validi. Va gestito PRIMA della lettura rigorosa,
    // altrimenti il journal valido resterebbe irraggiungibile.
    var tempEarly = storage.getItem(tempKey);
    if (tempEarly !== null && storage.getItem(mainKey) === tempEarly && storage.getItem(backupKey) === null) {
      try {
        var tEnv0 = JSON.parse(tempEarly);
        if (tEnv0.save_generation === 1) {
          var metaLoose = readMeta(false);
          if (metaLoose.slots[String(slotId)] === undefined) {
            validateEnvelope(tEnv0, slotId, opts, 1);
            NR().deserialize(JSON.stringify(tEnv0.state));
            metaLoose.slots[String(slotId)] = 1;
            writeMeta(metaLoose);
            storage.removeItem(tempKey);
          }
        }
      } catch (e0) { /* journal non riparabile: prosegue il percorso rigoroso */ }
    }
    var meta;
    try { meta = readMeta(true); } catch (eM) { return { ok: false, error: String(eM.message || eM) }; }
    var currentGen = meta.slots[String(slotId)];
    if (currentGen === undefined) return { ok: false, error: 'save_generation_slot_missing' };
    // B5.2: recupero del salvataggio INTERROTTO (journal): main scritto,
    // meta non finalizzata → temp==main con generazione meta+1
    var temp = storage.getItem(tempKey);
    if (temp !== null) {
      var repaired = false;
      try {
        var tEnv = JSON.parse(temp);
        if (storage.getItem(mainKey) === temp && tEnv.save_generation === currentGen + 1) {
          validateEnvelope(tEnv, slotId, opts, currentGen + 1); // fingerprint/slot/mission inclusi
          NR().deserialize(JSON.stringify(tEnv.state));
          meta.slots[String(slotId)] = tEnv.save_generation;
          writeMeta(meta);
          currentGen = tEnv.save_generation;
          repaired = true;
        }
      } catch (eT) { /* temp non riparabile: orfano */ }
      storage.removeItem(tempKey); // in ogni caso la temp non sopravvive al load
      if (repaired) raw = storage.getItem(mainKey);
    }
    // migrazione ESPLICITA degli envelope di versioni precedenti (C5-B):
    // 1.0.0 → 1.1.0 aggiunge SOLO values:{} (stato e envelope allineati)
    function migrateEnvelope(env) {
      if (env.narrative_schema_version === '1.0.0' && NR().schemaVersion === '1.1.0') {
        env.narrative_schema_version = '1.1.0';
        if (env.state && env.state.values === undefined) env.state.values = {};
        if (env.state && env.state.schema === '1.0.0') env.state.schema = '1.1.0';
        env.migrated_from = '1.0.0';
      }
      return env;
    }
    function attempt(payload, source, expectedGen) {
      var env = migrateEnvelope(JSON.parse(payload));
      validateEnvelope(env, slotId, opts, expectedGen);
      var st = NR().deserialize(JSON.stringify(env.state));
      // B4 (C5-C.1): env.mission contro la missione derivata dallo STATO
      // deserializzato — non dallo stato ancora in memoria prima del load
      var A2 = GAME.NarrativeAdapter;
      var expectedMission = opts.expectedMission ||
        (A2 && A2.currentMissionFor ? A2.currentMissionFor(st).mission :
         (A2 && A2.getMission ? A2.getMission().mission : undefined));
      if (expectedMission && env.mission !== expectedMission) {
        throw new Error('save_mission_mismatch: env=' + env.mission + ' expected=' + expectedMission);
      }
      return { ok: true, state: st, envelope: env, source: source };
    }
    try { return attempt(raw, 'main', currentGen); }
    catch (e1) {
      var bak = storage.getItem(backupKey);
      if (bak !== null) {
        try {
          var r = attempt(bak, 'backup', currentGen !== undefined ? currentGen - 1 : undefined);
          // recupero: il backup diventa main e la meta viene riallineata
          storage.setItem(mainKey, bak);
          meta.slots[String(slotId)] = r.envelope.save_generation;
          writeMeta(meta);
          r.recovered_from_backup = true; r.main_error = String(e1.message || e1);
          return r;
        } catch (e2) {
          return { ok: false, error: 'save_corrupted_main_and_backup', main_error: String(e1.message || e1), backup_error: String(e2.message || e2) };
        }
      }
      return { ok: false, error: String(e1.message || e1) };
    }
  };

  // Durante il finale l'adapter resta UI read-only. Porte/flag cambiano il
  // mondo; B6 può inoltre aggiungere al ledger narrativo le ammissioni già
  // pronunciate. Riallinea fingerprint e, quando fornito, quel payload validato
  // nello stesso envelope atomico. API disponibile solo con finale pending.
  NS.rebindClassicForFinale = function (slotId, classic, opts) {
    opts = opts || {};
    var NF = GAME.NarrativeFinale;
    // The completed state needs one last atomic write before onComplete.
    // The finale grants this authority only inside that synchronous checkpoint;
    // unrelated writes after completion remain forbidden. No force option.
    if (!NF || !NF.isPending || (!NF.isPending() &&
        !(NF.isCompletingCheckpoint && NF.isCompletingCheckpoint()))) {
      return { ok: false, error: 'finale_not_pending' };
    }
    if (!classic) return { ok: false, error: 'classic_save_required' };
    var mainKey = keyFor(slotId), tempKey = mainKey + ':tmp', backupKey = mainKey + ':backup';
    var raw = storage.getItem(mainKey);
    if (raw === null) return { ok: false, error: 'narrative_save_missing_for_finale' };
    var meta;
    try { meta = readMeta(true); }
    catch (eM) { return { ok: false, error: String(eM.message || eM) }; }
    var currentGen = meta.slots[String(slotId)];
    if (currentGen === undefined) return { ok: false, error: 'save_generation_slot_missing' };
    var env, frozenState, stateToWrite;
    try {
      env = JSON.parse(raw);
      validateEnvelope(env, slotId, {}, currentGen);
      frozenState = NR().deserialize(JSON.stringify(env.state));
      stateToWrite = opts.narrativeState ? NR().deserialize(JSON.stringify(opts.narrativeState)) : frozenState;
      var A = GAME.NarrativeAdapter;
      var expectedMission = A && A.currentMissionFor ? A.currentMissionFor(stateToWrite).mission : env.mission;
      if (expectedMission && env.mission !== expectedMission) {
        throw new Error('save_mission_mismatch: env=' + env.mission + ' expected=' + expectedMission);
      }
    } catch (eV) { return { ok: false, error: String(eV.message || eV) }; }

    env.save_generation = currentGen + 1;
    env.classic_save_fingerprint = NS.classicFingerprint(classic);
    env.saved_at = opts.savedAt || new Date().toISOString();
    env.state = JSON.parse(NR().serialize(stateToWrite));
    var payload = JSON.stringify(env);
    var before = snapshotKeys([mainKey, tempKey, backupKey, metaKey()]);
    try {
      storage.setItem(tempKey, payload);
      var reread = storage.getItem(tempKey);
      var checked = JSON.parse(reread);
      validateEnvelope(checked, slotId, { classic: classic }, currentGen + 1);
      NR().deserialize(JSON.stringify(checked.state));
      storage.setItem(backupKey, raw);
      storage.setItem(mainKey, reread);
      meta.slots[String(slotId)] = currentGen + 1;
      writeMeta(meta);
      storage.removeItem(tempKey);
      return { ok: true, key: mainKey, generation: currentGen + 1 };
    } catch (eW) {
      var rollback = restoreKeys(before);
      return { ok: false, error: rollback
        ? 'save_validation_failed_rollback_failed: ' + rollback
        : 'save_validation_failed: ' + String(eW && eW.message || eW) };
    }
  };

  NS.has = function (slotId) { return storage.getItem(keyFor(slotId)) !== null; };
  NS.clear = function (slotId) {
    var k = keyFor(slotId);
    storage.removeItem(k); storage.removeItem(k + ':tmp'); storage.removeItem(k + ':backup');
    var meta = readMeta(); delete meta.slots[String(slotId)]; writeMeta(meta);
  };
  NS.inspect = function (slotId) { // developer-only
    var raw = storage.getItem(keyFor(slotId));
    return raw ? JSON.parse(raw) : null;
  };
  NS.generation = function (slotId) { return readMeta().slots[String(slotId === undefined ? '0' : slotId)] || 0; };
})();
