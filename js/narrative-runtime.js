/* narrative-runtime.js — interprete PURO dei dati narrativi (narrative-v1.0).
 * Unica semantica per test (node) e motore (browser). A.1.2:
 *  - LETTURE che non creano MAI stato: peekVisit/peekProp per condizioni,
 *    obiettivi, worldRoots, availableChoices, presentationOptions e ogni
 *    prepare*; ensureVisit/ensureProp SOLO dentro i commit e gli effetti.
 *  - TRANSAZIONI one-shot: state.revision monotona; ogni prepared porta
 *    {tx_id, base_revision}; commit* CONSUMANO il prepared (mai ricalcolo),
 *    rifiutano transazioni stale e rendono idempotente il doppio commit.
 *  - ALREADY_REJECTED: nessuna scrittura canonica (nemmeno globale).
 *  - Riapertura visita a due fasi (prepareVisitRefresh/commitVisitRefresh):
 *    la pagina dell'infermiera si vede PRIMA che reopened esista.
 *  - deserialize valida schema/package/deprecati/revision. */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var GAME = root.GAME = root.GAME || {};
  var NR = GAME.NarrativeRuntime = {};

  var SCHEMA = '1.1.0', PACKAGE = 'narrative-v1.0'; // 1.1.0: state.values (C5-B)
  var DEPRECATED = ['clues6_gate', 'material_facts_recorded', 'm6_tactic_changed', 'maddy_salvabile', 'jacques_murder_confirmed', 'jacques_murder_attributed', 'leland_is_host', 'bob_true', 'correct_interpretation', 'forgiven', 'good_ending', 'bad_ending', 's4_correct'];

  var EMPTY_VISIT = Object.freeze({ questions_asked: Object.freeze([]), terminal_reached: false, closed: false, reopened: false, closed_at_beats: 0 });
  var EMPTY_PROP = Object.freeze({
    formulation: Object.freeze({ status: 'unformulated', created_from: Object.freeze([]) }),
    presentations: Object.freeze([]), social_status: Object.freeze({ accepted_by: Object.freeze([]) }), factual_status: 'unconfirmed'
  });
  function makeVisit() { return { questions_asked: [], terminal_reached: false, closed: false, reopened: false, closed_at_beats: 0 }; }
  function makeProp() { return { formulation: { status: 'unformulated', created_from: [] }, presentations: [], social_status: { accepted_by: [] }, factual_status: 'unconfirmed' }; }

  NR.createState = function () {
    return {
      schema: SCHEMA, package: PACKAGE, revision: 0, committed_tx: {},
      flags: {}, evidence: {}, notebook: [], props: {}, visits: {},
      presentations: [], b8_attempt_history: [], assistance_level: 0,
      beats_completed: [], nodes_done: {}, comparisons: {}, values: {}
    };
  };

  // stato strutturato dei confronti (B3): opened/attempts/completed/result.
  // MAI usare nodes_done di un nodo comparison come gate narrativo: la fonte
  // autorevole del successo resta la formulazione della proposizione.
  function ensureComparison(state, id) {
    if (!state.comparisons[id]) state.comparisons[id] = { opened: false, attempts: [], completed: false, result: null };
    return state.comparisons[id];
  }
  // Il registro dei tentativi (comparisons[node.id]) dipende dai DATI, non dal
  // kind: un choice-node con rules.attempt_scope='comparison' (es. il beat P5)
  // usa lo stesso registro di un nodo comparison. Non tocca MAI b8_attempt_history
  // né assistance_level (privati del tutorial M4).
  function usesComparisonScope(node) {
    return node.kind === 'comparison' || (node.rules && node.rules.attempt_scope === 'comparison');
  }

  // ---- letture PURE ----
  function peekVisit(state, id) { return state.visits[id] || EMPTY_VISIT; }
  function peekProp(state, id) { return state.props[id] || EMPTY_PROP; }
  // ---- creazione SOLO in scrittura ----
  function ensureVisit(state, id) { if (!state.visits[id]) state.visits[id] = makeVisit(); return state.visits[id]; }
  function ensureProp(state, id) { if (!state.props[id]) state.props[id] = makeProp(); return state.props[id]; }
  NR.peekProp = peekProp;
  function peekValue(state, name) { return state.values ? state.values[name] : undefined; }
  NR.peekValue = peekValue;
  // domini dei valori tipizzati (nome → array), iniettati dal chiamante
  // (validatore/boot) leggendo state-enums.values_allowed + enums
  NR.valueDomains = {};
  NR.setValueDomains = function (map) { NR.valueDomains = map || {}; };
  // transizioni controllate ammesse (nome → array di coppie [from, to]), iniettate
  // dal chiamante leggendo state-enums.value_transitions + diff value_transitions_add.
  // I valori restano write-once per default: le uniche mutazioni ammesse sono queste.
  NR.valueTransitions = {};
  NR.setValueTransitions = function (map) { NR.valueTransitions = map || {}; };

  function getPath(state, pathStr) {
    var parts = pathStr.split('.');
    var cur = peekProp(state, parts[0]);
    for (var i = 1; i < parts.length; i++) { if (cur == null) return undefined; cur = cur[parts[i]]; }
    return cur;
  }

  var COND_KEYS = ['not', 'all', 'flag', 'evidence', 'proposition_path', 'contains', 'equals', 'node_done', 'value_set', 'value_is', 'groups_completed'];
  NR.evalCond = function (state, cond, mission) {
    if (cond == null) return true;
    for (var k in cond) if (COND_KEYS.indexOf(k) === -1) throw new Error('condizione con operatore sconosciuto: ' + k);
    if (cond.value_set) return peekValue(state, cond.value_set) !== undefined;
    if (cond.value_is) return peekValue(state, cond.value_is.name) === cond.value_is.equals;
    if (cond.groups_completed) {
      if (!mission) throw new Error('groups_completed richiede la missione');
      return NR.groupsCompleted(state, mission, cond.groups_completed.set) >= cond.groups_completed.gte;
    }
    if (cond.not) return !NR.evalCond(state, cond.not, mission);
    if (cond.all) return cond.all.every(function (c) { return NR.evalCond(state, c, mission); });
    if (cond.flag !== undefined) return !!state.flags[cond.flag];
    if (cond.evidence !== undefined) return !!state.evidence[cond.evidence];
    if (cond.node_done !== undefined) return !!state.nodes_done[cond.node_done];
    if (cond.proposition_path) {
      var v = getPath(state, cond.proposition_path);
      if (cond.contains !== undefined) return Array.isArray(v) && v.indexOf(cond.contains) !== -1;
      if (cond.equals !== undefined) return v === cond.equals;
      return !!v;
    }
    return false;
  };

  var EFFECT_KEYS = ['set', 'evidence', 'notebook', 'notebook_observation', 'notebook_question', 'proposition', 'to', 'created_from', 'value', 'from_value', 'opposite_of', 'within', 'value_transition', 'from_derivation'];

  // validazione PURA degli effetti-valore (chiamata nei prepare*): dominio,
  // sorgente presente per from_value/opposite_of, within coerente
  function validateValueEffects(state, effects) {
    var effs = effects || [];
    for (var i = 0; i < effs.length; i++) {
      var e = effs[i];
      if (!e.value) continue;
      var dom = NR.valueDomains[e.value];
      if (!dom) return 'value_without_domain: ' + e.value;
      if (e.to !== undefined && dom.indexOf(e.to) === -1) return 'value_out_of_domain: ' + e.value + '=' + e.to;
      if (e.from_value !== undefined) {
        var src = peekValue(state, e.from_value);
        if (src === undefined) return 'value_source_missing: ' + e.from_value;
        if (dom.indexOf(src) === -1) return 'value_out_of_domain: ' + e.value + '=' + src;
      }
      if (e.opposite_of !== undefined) {
        var pair = e.within;
        if (!Array.isArray(pair) || pair.length !== 2 || pair[0] === pair[1]) return 'value_invalid_opposite_pair: ' + e.value;
        if (dom.indexOf(pair[0]) === -1 || dom.indexOf(pair[1]) === -1) return 'value_opposite_out_of_domain: ' + e.value;
        var src2 = peekValue(state, e.opposite_of);
        if (src2 === undefined) return 'value_source_missing: ' + e.opposite_of;
        if (pair.indexOf(src2) === -1) return 'value_source_outside_within: ' + src2;
      }
    }
    return null;
  }
  NR.validateValueEffects = validateValueEffects;
  // Primitive DIFFERITE (C8-B): value_transition e from_derivation. RISOLTE e
  // VALIDATE qui in modo PURO (prepare), CONGELATE nel prepared; il commit consuma
  // il risultato e NON rideriva/riesamina la sorgente. Generico: nessun if(mission).
  NR.resolveDeferredEffects = function (state, effects) {
    var derived = [], transitions = [], effs = effects || [];
    for (var i = 0; i < effs.length; i++) {
      var e = effs[i];
      if (e.from_derivation) {
        var d = e.from_derivation;
        var dom = NR.valueDomains[e.value];
        if (!dom) return { ok: false, error: 'value_without_domain: ' + e.value };
        // contratto GENERICO della derivazione: la sorgente ha un dominio; il valore
        // corrente è nel dominio; la map COPRE l'intero dominio-sorgente; OGNI output
        // (anche non selezionato) è nel dominio del derivato. Validazione totale (non
        // solo del valore corrente): la copertura è provata a prescindere dal percorso.
        var sourceDomain = NR.valueDomains[d.of];
        if (!sourceDomain) return { ok: false, error: 'derivation_source_without_domain: ' + d.of };
        var src = peekValue(state, d.of);
        if (src === undefined) return { ok: false, error: 'derivation_source_missing: ' + d.of };
        if (sourceDomain.indexOf(src) === -1) return { ok: false, error: 'derivation_source_out_of_domain: ' + d.of + '=' + src };
        for (var si = 0; si < sourceDomain.length; si++) {
          var sv = sourceDomain[si];
          if (!d.map || !Object.prototype.hasOwnProperty.call(d.map, sv)) return { ok: false, error: 'derivation_map_incomplete: ' + d.of + '=' + sv };
          if (dom.indexOf(d.map[sv]) === -1) return { ok: false, error: 'derivation_map_output_out_of_domain: ' + sv + '->' + d.map[sv] };
        }
        derived.push({ value: e.value, resolved: d.map[src] });
      }
      if (e.value_transition) {
        var t = e.value_transition;
        var pairs = NR.valueTransitions[t.name];
        if (!pairs) return { ok: false, error: 'undeclared_transition: ' + t.name };
        if (!pairs.some(function (p) { return p[0] === t.from && p[1] === t.to; })) return { ok: false, error: 'undeclared_transition_pair: ' + t.name + ' ' + t.from + '->' + t.to };
        var cur = peekValue(state, t.name);
        if (cur !== t.from) return { ok: false, error: 'wrong_from_value: ' + t.name + '=' + cur + ' (atteso ' + t.from + ')' };
        var tdom = NR.valueDomains[t.name];
        if (!tdom || tdom.indexOf(t.to) === -1) return { ok: false, error: 'transition_target_out_of_domain: ' + t.name + '=' + t.to };
        transitions.push({ name: t.name, to: t.to });
      }
    }
    return { ok: true, derived: derived, transitions: transitions };
  };
  function upsertNote(state, kind, entry) {
    var id = entry.id || null, text = entry.text || entry;
    if (id) for (var i = 0; i < state.notebook.length; i++) if (state.notebook[i].id === id) { state.notebook[i].text = text; return; }
    state.notebook.push({ id: id, kind: kind, text: text });
  }
  NR.applyEffects = function (state, effects) {
    (effects || []).forEach(function (eff) {
      for (var k in eff) if (EFFECT_KEYS.indexOf(k) === -1) throw new Error('effetto con chiave sconosciuta: ' + k);
      if (eff.set) {
        if (DEPRECATED.indexOf(eff.set) !== -1) throw new Error('flag deprecato: ' + eff.set);
        state.flags[eff.set] = true;
      }
      if (eff.evidence) state.evidence[eff.evidence] = true;
      if (eff.notebook) upsertNote(state, 'note', eff.notebook);
      if (eff.notebook_observation) upsertNote(state, 'observation', eff.notebook_observation);
      if (eff.notebook_question) upsertNote(state, 'question', eff.notebook_question);
      if (eff.value) {
        // write-once: un valore già scritto non viene MAI riscritto
        if (state.values[eff.value] === undefined) {
          var v2;
          if (eff.to !== undefined && eff.from_value === undefined && eff.opposite_of === undefined) v2 = eff.to;
          else if (eff.from_value !== undefined) v2 = state.values[eff.from_value];
          else if (eff.opposite_of !== undefined) {
            var pair = eff.within || [];
            var src = state.values[eff.opposite_of];
            v2 = pair[0] === src ? pair[1] : pair[0];
          }
          if (v2 !== undefined) state.values[eff.value] = v2;
        }
        return;
      }
      if (eff.proposition && eff.to === 'formulated') {
        var p = ensureProp(state, eff.proposition);
        if (p.formulation.status !== 'formulated') {
          p.formulation.status = 'formulated';
          p.formulation.created_from = (eff.created_from || []).slice();
        }
      }
    });
  };

  // ---- transazioni ----
  function txId(kind, targetId, state) { return 'tx.' + kind + '.' + targetId + '.r' + state.revision; }
  function txGuard(state, prepared) {
    if (!prepared || !prepared.tx_id) return { ok: false, error: 'not_a_prepared_transaction' };
    if (state.committed_tx[prepared.tx_id]) return { ok: true, repeated: true };
    if (prepared.base_revision !== state.revision) return { ok: false, error: 'stale_transaction' };
    return null;
  }
  function txDone(state, prepared) { state.committed_tx[prepared.tx_id] = true; state.revision++; }

  // ---- gruppi di osservazione e milestone (letture PURE, C5-B) ----
  NR.groupsCompleted = function (state, mission, setId) {
    var og = mission.observation_groups;
    if (!og || og.set_id !== setId) return 0;
    var n = 0;
    for (var g in og.groups) {
      if (og.groups[g].every(function (ev) { return state.evidence[ev] === true; })) n++;
    }
    return n;
  };
  // milestone: trigger GENERICO. Due forme dichiarative, mai un caso speciale:
  //  - after_groups (M5): soglia sui gruppi d'osservazione;
  //  - pending_when (M6): una condizione qualsiasi (es. un flag committato).
  // La RISOLUZIONE resta sempre resolved_when (mai milestones_done nello stato).
  NR.pendingMilestones = function (state, mission) {
    var out = [];
    (mission.milestones || []).forEach(function (m) {
      var reached = (m.pending_when !== undefined)
        ? NR.evalCond(state, m.pending_when, mission)
        : NR.groupsCompleted(state, mission, m.group_set) >= m.after_groups;
      var resolved = NR.evalCond(state, m.resolved_when, mission);
      if (reached && !resolved) out.push(m);
    });
    return out;
  };

  // ---- scelte disponibili (PURA) ----
  NR.availableChoices = function (state, mission, node) {
    var list = (node.choices || []).slice();
    // regola dati (B3): un risultato già tentato non è riproponibile
    if (node.rules && node.rules.hide_attempted_results) {
      var hist = [];
      if (node.rules.attempt_scope === 'comparison') {
        hist = (state.comparisons[node.id] || {}).attempts || [];
      } else if (node.rules.attempt_history) {
        hist = state[node.rules.attempt_history] || [];
      }
      list = list.filter(function (c) { return !c.result || hist.indexOf(c.result) === -1; });
    }
    if (!(node.choices && node.rules && node.rules.visit_state)) return list;
    var v = peekVisit(state, node.rules.visit_state);
    var notAsked = list.filter(function (c) { return v.questions_asked.indexOf(c.id) === -1; });
    if (v.closed && !v.reopened) return [];
    if (v.closed && v.reopened) return notAsked;
    if (v.questions_asked.length === 0) return notAsked;
    if (!v.terminal_reached && node.rules.second_question_policy === 'force_terminal') {
      return notAsked.filter(function (c) { return c.id === node.rules.terminal_choice; });
    }
    return notAsked;
  };

  // ---- riapertura visita: due fasi ----
  NR.prepareVisitRefresh = function (state, mission, node) {
    if (!(node.rules && node.rules.visit_state && node.rules.reopen)) return null;
    var v = peekVisit(state, node.rules.visit_state);
    if (v.closed && !v.reopened && node.rules.reopen.after_new_mandatory_beat &&
        state.beats_completed.length > v.closed_at_beats) {
      return { tx_id: txId('reopen', node.id, state), base_revision: state.revision, node_id: node.id, visit_state: node.rules.visit_state, pages: node.rules.reopen.pages || [] };
    }
    return null;
  };
  NR.commitVisitRefresh = function (state, prepared) {
    var g = txGuard(state, prepared); if (g) return g;
    ensureVisit(state, prepared.visit_state).reopened = true;
    txDone(state, prepared);
    return { ok: true };
  };

  // ---- nodi: due fasi (il commit CONSUMA il prepared) ----
  // pagine effettive di un nodo: pages + pages_by_value[caso corrente] + after
  function assembledPages(state, node, mission) {
    var pages = (node.pages || []).slice();
    if (node.pages_by_value) {
      var v = peekValue(state, node.pages_by_value.value);
      var branch = node.pages_by_value.cases[v];
      if (branch) pages = pages.concat(branch);
    }
    if (node.pages_after_branch) pages = pages.concat(node.pages_after_branch);
    // conditional_pages (C8-B): valuta il `condition` di ciascuna pagina e CONGELA
    // la sequenza risultante nel prepared (l'ordine è preservato); il commit non
    // rifiltra mai — le pagine vivono solo nel prepared. Generico: nessun if(mission).
    pages = pages.filter(function (pg) { return !pg.condition || NR.evalCond(state, pg.condition, mission); });
    return pages;
  }

  NR.prepareNode = function (state, mission, nodeId) {
    var node = mission.nodes.filter(function (n) { return n.id === nodeId; })[0];
    if (!node) return { ok: false, error: 'node_not_found: ' + nodeId };
    // blocchi delle milestone pendenti (C5-B)
    var pend = NR.pendingMilestones(state, mission);
    for (var b = 0; b < pend.length; b++) {
      var mb = pend[b];
      if (mb.node === nodeId) continue; // il nodo-milestone stesso resta apribile
      if (mb.blocks && mb.blocks.kind === 'observation_group_prepare' && node.observation_group &&
          mission.observation_groups && mission.observation_groups.set_id === mb.blocks.set) {
        return { ok: false, error: 'milestone_pending: ' + mb.id };
      }
      if (mb.blocks && mb.blocks.kind === 'node_prepare' && (mb.blocks.nodes || []).indexOf(nodeId) !== -1) {
        return { ok: false, error: 'milestone_pending: ' + mb.id };
      }
    }
    var conds = node.conditions || [];
    for (var i = 0; i < conds.length; i++) if (!NR.evalCond(state, conds[i], mission)) return { ok: false, error: 'conditions_not_met: ' + nodeId };
    var vErr = validateValueEffects(state, node.effects);
    if (vErr) return { ok: false, error: vErr };
    if (state.nodes_done[nodeId] && (node.effect_policy || 'once') === 'once') {
      // choice-node composto: done ma completion_when falsa → RIAPRE il widget
      if (node.completion_when && !NR.evalCond(state, node.completion_when, mission)) {
        return { ok: true, tx_id: txId('node', nodeId, state), base_revision: state.revision, node: node, resume_choice: true, pages: [] };
      }
      // continuation incompleta: riprendi il primo anello non risolto della catena
      if (node.next) {
        var cur = node.next, guard = 0;
        while (cur && guard++ < 20) {
          var cn = mission.nodes.filter(function (n) { return n.id === cur; })[0];
          if (!cn) break;
          if (cn.completion_when && !NR.evalCond(state, cn.completion_when, mission)) {
            return { ok: true, continuation: cur, node: node, pages: [] };
          }
          if (!cn.completion_when && !state.nodes_done[cur]) {
            return { ok: true, continuation: cur, node: node, pages: [] };
          }
          cur = cn.next;
        }
      }
      // repeat SOLO se repeat_when (quando dichiarata) è vera
      if (node.repeat_when && !NR.evalCond(state, node.repeat_when, mission)) {
        return { ok: true, continuation: node.next || null, node: node, pages: [] };
      }
      return { ok: true, tx_id: txId('node', nodeId, state), base_revision: state.revision, node: node, already_completed: true, pages: node.repeat ? [node.repeat] : [] };
    }
    // primitive differite (value_transition/from_derivation): risolte e CONGELATE
    // qui in prepare; se la validazione fallisce, il prepare fallisce (fail-closed).
    var dfr = NR.resolveDeferredEffects(state, node.effects);
    if (!dfr.ok) return { ok: false, error: dfr.error };
    return { ok: true, tx_id: txId('node', nodeId, state), base_revision: state.revision, node: node, derived: dfr.derived, transitions: dfr.transitions, pages: assembledPages(state, node, mission) };
  };
  NR.commitNode = function (state, mission, prepared) {
    var g = txGuard(state, prepared); if (g) return g;
    if (prepared.already_completed) { txDone(state, prepared); return { ok: true, repeated: true }; }
    if (prepared.node.kind === 'comparison') {
      var cmpN = ensureComparison(state, prepared.node.id);
      cmpN.opened = true;
      if (prepared.node.comparison_completion === 'node_commit') {
        cmpN.completed = true;
        cmpN.result = prepared.node.result || null;
      }
    }
    // primitive differite: applica i valori RISOLTI e CONGELATI in prepare — MAI
    // riderivati/rivalidati qui. La transizione è l'UNICA mutazione ammessa su un
    // valore write-once; il derivato resta write-once.
    (prepared.transitions || []).forEach(function (t) { state.values[t.name] = t.to; });
    (prepared.derived || []).forEach(function (d) { if (state.values[d.value] === undefined) state.values[d.value] = d.resolved; });
    NR.applyEffects(state, prepared.node.effects);
    state.nodes_done[prepared.node.id] = true;
    if (prepared.node.mandatory_beat && state.beats_completed.indexOf(prepared.node.id) === -1) state.beats_completed.push(prepared.node.id);
    txDone(state, prepared);
    return { ok: true };
  };

  // ---- scelte: due fasi ----
  NR.prepareChoice = function (state, mission, node, choiceId) {
    var avail = NR.availableChoices(state, mission, node);
    var choice = avail.filter(function (c) { return c.id === choiceId; })[0];
    if (!choice) return { ok: false, error: 'choice_not_available: ' + choiceId };
    var vErr = validateValueEffects(state, choice.effects);
    if (vErr) return { ok: false, error: vErr };
    // feedback per-valore: RISOLTO e CONGELATO qui (prepareChoice), mai al commit.
    // Legge il valore tipizzato ora, seleziona il caso, lo blocca nel prepared;
    // commitChoice consuma il prepared e non riseleziona (semantica transazionale).
    var feedback = choice.feedback_pages || [];
    if (choice.feedback_pages_by_value) {
      var fv = peekValue(state, choice.feedback_pages_by_value.value);
      var cs = choice.feedback_pages_by_value.cases[fv];
      if (!cs) return { ok: false, error: 'feedback_value_case_missing: ' + choice.feedback_pages_by_value.value + '=' + fv };
      feedback = cs;
    }
    return { ok: true, tx_id: txId('choice', node.id + '.' + choiceId, state), base_revision: state.revision, node_id: node.id, choice: choice, feedback_pages: feedback, goto: choice.goto || null, retry: !!choice.retry };
  };
  NR.commitChoice = function (state, mission, node, prepared) {
    var g = txGuard(state, prepared); if (g) return g;
    var choice = prepared.choice;
    if (node.rules && node.rules.visit_state) {
      var v = ensureVisit(state, node.rules.visit_state);
      if (v.questions_asked.indexOf(choice.id) === -1) v.questions_asked.push(choice.id);
      if (choice.id === node.rules.terminal_choice) v.terminal_reached = true;
      if (!v.reopened) {
        var closeNow = v.terminal_reached || v.questions_asked.length >= (node.rules.max_questions || 2);
        if (closeNow) { v.closed = true; v.closed_at_beats = state.beats_completed.length; }
      }
    }
    if (choice.result && node.rules && node.rules.attempt_history) {
      state.b8_attempt_history.push(choice.result);
      if (choice.retry && node.rules.track_assistance !== false) state.assistance_level = Math.min(3, state.assistance_level + 1);
    }
    if (usesComparisonScope(node)) {
      var cmp = ensureComparison(state, node.id);
      if (choice.result) cmp.attempts.push(choice.result);
      // completed SOLO dalla scelta che formula una proposizione
      var formulates = (choice.effects || []).some(function (e) { return e.proposition && e.to === 'formulated'; });
      if (formulates) { cmp.completed = true; cmp.result = choice.result || null; }
    }
    NR.applyEffects(state, choice.effects);
    txDone(state, prepared);
    return { ok: true, retry: prepared.retry, goto: prepared.goto };
  };

  // ---- presentazione: due fasi ----
  NR.presentationOptions = function (state, mission, node) {
    var out = [];
    for (var pid in ((node.presentation && node.presentation.on) || {})) {
      if (pid.charAt(0) === '_') continue;
      if (peekProp(state, pid).formulation.status === 'formulated') out.push(pid);
    }
    return out;
  };
  NR.preparePresentation = function (state, mission, node, propId, attached) {
    var on = node.presentation.on;
    var target = node.presentation.target_actor_id;
    if (!target) throw new Error('presentazione senza target_actor_id');
    var base = { tx_id: txId('present', node.id + '.' + (propId || 'none'), state), base_revision: state.revision, node_id: node.id };
    if (!propId || NR.presentationOptions(state, mission, node).indexOf(propId) === -1) {
      var br0 = on._none_formulated;
      base.branch = br0; base.pages = br0.pages || [];
      base.record = { proposition: propId || null, target: target, mission: mission.mission, result: 'rejected', reason_code: br0.reason_code };
      base.ok = true; return base;
    }
    var p = peekProp(state, propId);
    var already = p.presentations.filter(function (r) { return r.target === target; });
    if (already.some(function (r) { return r.result === 'accepted'; })) {
      base.ok = true; base.repeated = true; base.pages = node.repeat ? [node.repeat] : [];
      return base;
    }
    var branch = on[propId], evidenceAttached = null, branchParent = branch;
    if (node.presentation.attachment && node.presentation.attachment.mode === 'manual') {
      evidenceAttached = Array.isArray(attached) ? attached.slice() : [];
      var seenAttachment = {}, evCatalog = GAME.NarrativeData && GAME.NarrativeData.evidence && GAME.NarrativeData.evidence.evidence;
      for (var ai = 0; ai < evidenceAttached.length; ai++) {
        var eid = evidenceAttached[ai];
        if (seenAttachment[eid]) return { ok: false, error: 'duplicate_attachment: ' + eid };
        if (!state.evidence[eid]) return { ok: false, error: 'unacquired_attachment: ' + eid };
        if (evCatalog && !evCatalog[eid]) return { ok: false, error: 'unknown_attachment: ' + eid };
        seenAttachment[eid] = true;
      }
      var by = branch.by_support || {}, picked = null;
      for (var bk in by) {
        var rule = by[bk], all = rule.when_attached_all || [], missing = rule.when_missing_any || [];
        if (all.length && all.every(function (id) { return !!seenAttachment[id]; })) { picked = rule; break; }
        if (!picked && missing.length && missing.some(function (id) { return !seenAttachment[id]; })) picked = rule;
      }
      if (!picked) return { ok: false, error: 'attachment_partition_no_match' };
      branch = picked;
    }
    if (already.some(function (r) { return r.result === 'rejected' && r.reason_code === branch.reason_code; })) {
      // memoria del rifiuto: pagina diegetica STABILE dai dati (mai commit invisibile)
      base.ok = true; base.already_rejected = true;
      base.pages = branchParent.already_rejected_page ? [branchParent.already_rejected_page] : [];
      base.record = { proposition: propId, target: target, mission: mission.mission, result: 'rejected', reason_code: 'ALREADY_REJECTED' };
      return base;
    }
    base.ok = true; base.branch = branch;
    base.provenance = node.presentation.auto_show_provenance ? { from: p.formulation.created_from.slice() } : null;
    base.record = {
      proposition: propId, target: target, mission: mission.mission,
      result: branch.result, reason_code: branch.reason_code,
      acceptance_type: branch.result === 'accepted' ? branch.acceptance_type : undefined
    };
    if (evidenceAttached) base.record.evidence_attached = evidenceAttached.slice();
    else base.record.evidence_shown = p.formulation.created_from.slice();
    var responsePages = [];
    if (evidenceAttached && branchParent.attachment_responses) {
      evidenceAttached.forEach(function (id) {
        var response = branchParent.attachment_responses[id];
        if (response && response.page) responsePages.push(response.page);
      });
    }
    base.pages = responsePages.concat(assembledPages(state, branch, mission));
    return base;
  };
  NR.commitPresentation = function (state, mission, node, prepared) {
    var g = txGuard(state, prepared); if (g) return g;
    if (prepared.repeated) { txDone(state, prepared); return { ok: true, repeated: true }; }
    if (prepared.already_rejected) { txDone(state, prepared); return { ok: true, repeated: true, record: prepared.record }; }
    var rec = prepared.record;
    if (rec.proposition) {
      var p = ensureProp(state, rec.proposition);
      p.presentations.push(rec);
      if (rec.result === 'accepted' && p.social_status.accepted_by.indexOf(rec.target) === -1) p.social_status.accepted_by.push(rec.target);
      state.presentations.push(rec);
    } else {
      // ramo anticipato (nessuna proposizione): UN solo record canonico per
      // node+target+reason — le ripetizioni sono telemetry, non history
      var dup = state.presentations.some(function (r) {
        return !r.proposition && r.target === rec.target && r.reason_code === rec.reason_code;
      });
      if (!dup) state.presentations.push(rec);
    }
    NR.applyEffects(state, prepared.branch && prepared.branch.effects);
    if (rec.result === 'accepted') {
      state.nodes_done[node.id] = true;
      if (node.mandatory_beat && state.beats_completed.indexOf(node.id) === -1) state.beats_completed.push(node.id);
    }
    NR.checkCompletion(state, mission);
    txDone(state, prepared);
    return { ok: true, record: rec };
  };

  // ---- obiettivi / completamento / roots (letture pure) ----
  NR.activeObjective = function (state, mission) {
    var t = mission.objectives.filter(function (o) { return NR.evalCond(state, o.when, mission); });
    if (t.length === 0) return null;
    t.sort(function (a, b) { return b.priority - a.priority; });
    return t[0];
  };
  NR.trueObjectives = function (state, mission) {
    return mission.objectives.filter(function (o) { return NR.evalCond(state, o.when, mission); });
  };
  NR.checkCompletion = function (state, mission) {
    var c = mission.completion;
    if (!c) return false;
    if (NR.evalCond(state, c.when, mission)) { (c.sets || []).forEach(function (f) { state.flags[f] = true; }); return true; }
    return false;
  };
  // una root è CONCLUSA quando è nodes_done e non ha più nulla da offrire
  // (nessuna scelta da riaprire con completion_when falsa, nessun repeat attivo).
  function rootConcluded(state, mission, n) {
    if (!state.nodes_done[n.id]) return false;
    if (n.completion_when && !NR.evalCond(state, n.completion_when, mission)) return false; // widget da riaprire
    if (n.repeat_when && NR.evalCond(state, n.repeat_when, mission)) return false;           // repeat attivo
    return true;
  }
  NR.worldRoots = function (state, mission, mapId, actorId) {
    var list = mission.nodes.filter(function (n) {
      if (n.channel !== 'world' || n.exposed === false) return false;
      if (mapId && n.map_id !== mapId) return false;
      if (actorId && n.actor_id !== actorId) return false;
      var conds = n.conditions || [];
      for (var i = 0; i < conds.length; i++) if (!NR.evalCond(state, conds[i], mission)) return false;
      return true;
    });
    // 2ª difesa del root-contract (le guardie di rientro `not` nei dati sono la 1ª):
    // se più root condividono lo stesso target, una CONCLUSA non oscura una
    // irrisolta. Non sostituisce le guardie dati; le doppia. Sui target senza
    // collisione (il caso di M4/M5) è un no-op.
    if (list.length < 2) return list;
    var keyOf = function (n) { return (n.map_id || '') + '|' + (n.target_kind || '') + '|' + (n.target_id || ''); };
    var byKey = {};
    list.forEach(function (n) { (byKey[keyOf(n)] = byKey[keyOf(n)] || []).push(n); });
    return list.filter(function (n) {
      var group = byKey[keyOf(n)];
      if (group.length < 2 || !rootConcluded(state, mission, n)) return true;
      return !group.some(function (m) { return m !== n && !rootConcluded(state, mission, m); });
    });
  };

  // azioni disponibili nel taccuino (PURA): nodi comparison sul canale
  // notebook con condizioni vere. La UI non conosce ID specifici — riceve
  // anche l'elenco delle evidenze richieste (dalle conditions del nodo).
  NR.notebookActions = function (state, missions) {
    missions = Array.isArray(missions) ? missions : [missions];
    var seen = {}, out = [];
    missions.forEach(function (mission) {
      var entered = !mission.entry_condition || NR.evalCond(state, mission.entry_condition, mission);
      mission.nodes.forEach(function (n) {
        if (!(n.kind === 'comparison' && n.channel === 'notebook')) return;
        if (seen[n.id]) throw new Error('duplicate_comparison_node_id: ' + n.id);
        seen[n.id] = true;
        var cmp = state.comparisons[n.id];
        if (cmp && cmp.completed) return; // completato: sparisce (anche cross-mission)
        if (!entered && !(cmp && cmp.opened)) return; // missioni FUTURE invisibili
        if (!(n.conditions || []).every(function (c) { return NR.evalCond(state, c, mission); })) return;
        out.push({
          node: n, source_mission: mission.mission,
          required_evidence: (n.conditions || []).filter(function (c) { return c.evidence; })
            .map(function (c) { return c.evidence; })
        });
      });
    });
    return out;
  };

  // esito di una COPPIA di evidenze nel taccuino (PURA, tre esiti):
  //  available → il confronto esiste ed è eseguibile
  //  completed → il nesso è GIÀ registrato (mai dire "nessun filo")
  //  none      → nessuna relazione (o condizioni non ancora vere)
  // resolver delle coppie (C5-B.2): DUE passaggi — prima si costruisce e
  // valida l'INTERO registro visibile (gli ID duplicati emergono sempre,
  // qualunque coppia sia stata chiesta), poi si risolve. Un match non
  // disponibile non oscura mai un match successivo disponibile; due match
  // contemporaneamente validi per la stessa coppia = ambiguità ESPLICITA.
  NR.notebookPairStatus = function (state, missions, evidenceIds) {
    missions = Array.isArray(missions) ? missions : [missions];
    var wanted = evidenceIds.slice().sort().join('|');
    var seenIds = {};
    var matches = [];
    for (var mi = 0; mi < missions.length; mi++) {
      var mission = missions[mi];
      var entered = !mission.entry_condition || NR.evalCond(state, mission.entry_condition, mission);
      for (var ni = 0; ni < mission.nodes.length; ni++) {
        var node = mission.nodes[ni];
        if (node.kind !== 'comparison' || node.channel !== 'notebook') continue;
        if (seenIds[node.id]) throw new Error('duplicate_comparison_node_id: ' + node.id);
        seenIds[node.id] = true;
        var cmp = state.comparisons[node.id];
        if (!entered && !(cmp && cmp.opened)) continue;
        var required = (node.conditions || []).filter(function (c) { return c.evidence; })
          .map(function (c) { return c.evidence; }).sort().join('|');
        if (required !== wanted) continue;
        matches.push({ node: node, mission: mission, comparison: cmp });
      }
    }
    var completed = [], available = [];
    matches.forEach(function (match) {
      if (match.comparison && match.comparison.completed) { completed.push(match); return; }
      var pass = (match.node.conditions || []).every(function (c) { return NR.evalCond(state, c, match.mission); });
      if (pass) available.push(match);
    });
    if (completed.length + available.length > 1) throw new Error('ambiguous_comparison_pair: ' + wanted);
    if (completed.length === 1) return { status: 'completed', node: completed[0].node, source_mission: completed[0].mission.mission };
    if (available.length === 1) return { status: 'available', node: available[0].node, source_mission: available[0].mission.mission };
    return { status: 'none', node: null };
  };

  NR.schemaVersion = SCHEMA;   // autorità unica delle versioni (B5.1)
  NR.packageId = PACKAGE;

  NR.serialize = function (state) { return JSON.stringify(state); };
  NR.deserialize = function (s) {
    var st = JSON.parse(s);
    if (st.schema !== SCHEMA) throw new Error('save_schema_mismatch: ' + st.schema);
    if (st.package !== PACKAGE) throw new Error('save_package_mismatch: ' + st.package);
    if (typeof st.revision !== 'number') throw new Error('save_missing_field: revision');
    for (var i = 0; i < DEPRECATED.length; i++) if (st.flags && st.flags[DEPRECATED[i]]) throw new Error('save_deprecated_flag: ' + DEPRECATED[i]);
    var required = ['flags', 'evidence', 'notebook', 'props', 'visits', 'presentations', 'b8_attempt_history', 'beats_completed', 'nodes_done', 'committed_tx', 'comparisons', 'values'];
    for (var j = 0; j < required.length; j++) if (st[required[j]] === undefined) throw new Error('save_missing_field: ' + required[j]);
    // ogni valore tipizzato nel SUO dominio: stati impossibili respinti al load
    for (var vn in st.values) {
      var dom = NR.valueDomains[vn];
      if (!dom) throw new Error('save_value_without_domain: ' + vn);
      if (dom.indexOf(st.values[vn]) === -1) throw new Error('save_value_out_of_domain: ' + vn + '=' + st.values[vn]);
    }
    return st;
  };
})();
