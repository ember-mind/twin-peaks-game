/* narrative-notebook.js — B3: il taccuino di Cooper, DERIVATO dai dati.
 *
 * Regole (contratto B3):
 *  - le sezioni sono prodotte da cataloghi (evidence.json, propositions.json)
 *    e stato (state.evidence, state.notebook, state.props) — mai hardcoded;
 *  - si mostrano SOLO elementi acquisiti; mai ID interni, supports, flag,
 *    factual ceiling, reason code o assistance_level;
 *  - le proposizioni distinguono formulata / presentata / accettata /
 *    confermata — P2 in M4 appare FORMULATA e NON CONFERMATA;
 *  - Confronta: selezione di DUE evenienze acquisite; il nodo comparison è
 *    riconosciuto dai DATI (NR.notebookActions + conditions), mai da if
 *    hardcoded nella UI; la selezione della coppia NON scrive stato;
 *  - stessa disciplina di input del widget: textContent, event.repeat
 *    ignorato, Escape torna indietro/chiude, blur chiude in modo puro. */
(function () {
  var G = (typeof window !== 'undefined' ? window : globalThis);
  var GAME = G.GAME = G.GAME || {};
  var NB = GAME.NarrativeNotebook = {};

  // cataloghi participant-facing: ogni valore di schema DEVE avere un'etichetta
  // (il validatore fallisce se un evidence.kind non è coperto)
  var KIND_LABEL = NB.KIND_LABEL = {
    object: 'oggetto', testimony: 'testimonianza', testimony_recited: 'testimonianza recitata',
    observation: 'osservazione', document: 'documento', place: 'luogo', vision: 'visione',
    phantom: 'traccia onirica'
  };
  var ACTOR_NAMES = NB.ACTOR_NAMES = { truman: 'Truman', cooper: 'Cooper', hawk: 'Hawk', lucy: 'Lucy', albert: 'Albert' };
  var NOTE_PREFIX = { note: '', observation: '(osservato) ', question: '(domanda) ' };

  if (typeof window === 'undefined') return; // in node servono solo i cataloghi

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // deriva le sezioni correnti dallo stato — pura, chiamata a ogni render
  function buildSections(state, missions, data) {
    var NR = GAME.NarrativeRuntime;
    var evCat = (data.evidence && data.evidence.evidence) || {};
    var prCat = (data.propositions && data.propositions.propositions) || {};

    var evidences = Object.keys(state.evidence).filter(function (id) { return state.evidence[id] === true && evCat[id]; })
      .map(function (id) {
        var e = evCat[id];
        // e.function è un metadato di DESIGN: mai renderizzato (rivelerebbe
        // l'operazione che il confronto chiede di compiere). L'origine visibile
        // è solo il ui_origin diegetico del catalogo, se esiste.
        return { id: id, label: e.label, kind: KIND_LABEL[e.kind] || '(?)', origin: e.ui_origin || '' };
      });

    var notes = state.notebook.map(function (n) { return { id: n.id, text: (NOTE_PREFIX[n.kind] || '') + n.text, kind: n.kind }; });

    var props = Object.keys(state.props).map(function (pid) {
      var p = state.props[pid];
      var cat = prCat[pid] || {};
      var badges = [];
      if (p.formulation.status === 'formulated') badges.push('FORMULATA');
      if (p.presentations.length > 0) badges.push('PRESENTATA');
      if (p.social_status.accepted_by.length > 0) {
        badges.push('ACCETTATA DA ' + p.social_status.accepted_by.map(function (a) { return (ACTOR_NAMES[a] || a).toUpperCase(); }).join(', '));
      }
      // respinta: derivata dalla presentation history (mai da flag), esclusa
      // la memoria ALREADY_REJECTED; solo target non già accettanti
      var rejBy = [];
      p.presentations.forEach(function (r) {
        if (r.result === 'rejected' && r.reason_code !== 'ALREADY_REJECTED' &&
            p.social_status.accepted_by.indexOf(r.target) === -1 && rejBy.indexOf(r.target) === -1) rejBy.push(r.target);
      });
      if (rejBy.length > 0) {
        badges.push('RESPINTA DA ' + rejBy.map(function (a) { return (ACTOR_NAMES[a] || a).toUpperCase(); }).join(', '));
      }
      if (p.factual_status === 'confirmed') badges.push('CONFERMATA');
      else if (p.factual_status === 'confirmed_as_lie') badges.push('CONFERMATA COME MENZOGNA');
      else if (p.factual_status === 'corroborated') badges.push('CORROBORATA');
      else if (p.factual_status === 'contested') badges.push('CONTESTATA');
      else if (p.factual_status === 'refuted') badges.push('CONFUTATA');
      else badges.push('NON CONFERMATA');
      return { id: pid, text: cat.ui_short || cat.text || pid, badges: badges, visible: p.formulation.status === 'formulated' || p.presentations.length > 0 };
    }).filter(function (p) { return p.visible; });

    var actions = NR.notebookActions(state, missions);

    return { evidences: evidences, notes: notes, props: props, actions: actions };
  }

  // opts: { state, mission, data, container, inputContext {suspend,restore}, readOnly,
  //         log, advanceLockMs, runComparison(node) → Promise, onNoMatch() → Promise }
  NB.open = function (opts) {
    var state = opts.state, mission = opts.mission, data = opts.data;
    var missions = opts.missions || [mission];
    var container = opts.container, input = opts.inputContext;
    var log = opts.log || function () {};
    return new Promise(function (resolve) {
      var SECTIONS = opts.readOnly ? ['Evidenze', 'Appunti', 'Proposizioni'] : ['Evidenze', 'Appunti', 'Proposizioni', 'Confronta'];
      var view = 'menu';   // menu | section | compare
      var section = 0, idx = 0, closed = false, busy = false;
      var selected = [];   // id evidenze selezionate in Confronta

      input.suspend();
      var root = el('div', 'nw-root nb-root');
      root.setAttribute('role', 'dialog');
      root.setAttribute('data-nb', 'notebook');
      container.appendChild(root);

      function finish() {
        if (closed) return;
        closed = true;
        window.removeEventListener('keydown', onKey, true);
        window.removeEventListener('blur', onBlur);
        root.remove();
        input.restore();
        log({ event: 'notebook_view_closed' });
        resolve({ closed: true });
      }

      function activateMenu(i) {
        idx = i; section = i;
        if (SECTIONS[i] === 'Confronta') { view = 'compare'; idx = 0; selected = []; }
        else view = 'section';
        render();
      }

      function goBack() {
        if (view === 'menu') finish();
        else { view = 'menu'; idx = 0; selected = []; render(); }
      }

      function toggleCompare(i) {
        var S = buildSections(state, missions, data), ev = S.evidences[i];
        if (!ev) return;
        idx = i;
        var at = selected.indexOf(ev.id);
        if (at >= 0) selected.splice(at, 1);
        else if (selected.length < 2) selected.push(ev.id);
        render();
        if (selected.length === 2) confirmPair();
      }

      function render() {
        while (root.firstChild) root.removeChild(root.firstChild);
        var S = buildSections(state, missions, data);
        if (view === 'menu') {
          root.appendChild(el('div', 'nw-title', opts.readOnly ? 'TACCUINO — SOLA LETTURA' : 'TACCUINO'));
          var objectiveText = opts.getObjectiveText ? opts.getObjectiveText() : (opts.objectiveText || '');
          if (objectiveText) {
            var objective = el('div', 'nw-page nb-objective', 'OBIETTIVO: ' + objectiveText);
            objective.setAttribute('data-nb-objective', 'true');
            root.appendChild(objective);
          }
          SECTIONS.forEach(function (name, i) {
            var counts = { Evidenze: S.evidences.length, Appunti: S.notes.length, Proposizioni: S.props.length, Confronta: null };
            var suffix = counts[name] === null ? '' : ' (' + counts[name] + ')';
            var o = el('div', 'nw-opt' + (i === idx ? ' nw-focus' : ''), (i === idx ? '▶ ' : '  ') + name + suffix);
            o.setAttribute('data-nb-section', name);
            o.onclick = function () { activateMenu(i); };
            root.appendChild(o);
          });
          root.appendChild(el('div', 'nw-hint', '↑↓ · Invio · Esc chiude'));
          var close = el('div', 'nw-opt', '× Chiudi'); close.setAttribute('data-nb-close', 'true'); close.onclick = finish; root.appendChild(close);
        } else if (view === 'section') {
          var name = SECTIONS[section];
          root.appendChild(el('div', 'nw-title', 'TACCUINO — ' + name.toUpperCase()));
          var rows = [];
          if (name === 'Evidenze') rows = S.evidences.map(function (e) { return { key: e.id, text: e.label + ' — ' + e.kind + (e.origin ? ' · ' + e.origin : '') }; });
          if (name === 'Appunti') rows = S.notes.map(function (n) { return { key: n.id, text: n.text }; });
          if (name === 'Proposizioni') rows = S.props.map(function (p) { return { key: p.id, text: p.text + '  [' + p.badges.join(' · ') + ']' }; });
          if (rows.length === 0) root.appendChild(el('div', 'nw-page', '(niente, per ora)'));
          rows.forEach(function (r) {
            var o = el('div', 'nw-opt', '· ' + r.text);
            o.setAttribute('data-nb-entry', r.key);
            root.appendChild(o);
          });
          var back = el('div', 'nw-opt', '‹ Indietro'); back.setAttribute('data-nb-back', 'true'); back.onclick = goBack; root.appendChild(back);
        } else if (view === 'compare') {
          root.appendChild(el('div', 'nw-title', 'TACCUINO — CONFRONTA (scegli due voci)'));
          S.evidences.forEach(function (e, i) {
            var mark = selected.indexOf(e.id) >= 0 ? '[x] ' : '[ ] ';
            var o = el('div', 'nw-opt' + (i === idx ? ' nw-focus' : ''), (i === idx ? '▶ ' : '  ') + mark + e.label);
            o.setAttribute('data-nb-compare', e.id);
            o.onclick = function () { toggleCompare(i); };
            root.appendChild(o);
          });
          if (S.evidences.length === 0) root.appendChild(el('div', 'nw-page', '(niente da confrontare, per ora)'));
          root.appendChild(el('div', 'nw-hint', 'Invio seleziona · Esc indietro'));
          var backCompare = el('div', 'nw-opt', '‹ Indietro'); backCompare.setAttribute('data-nb-back', 'true'); backCompare.onclick = goBack; root.appendChild(backCompare);
        }
      }

      function currentListLength() {
        var S = buildSections(state, missions, data);
        if (view === 'menu') return SECTIONS.length;
        if (view === 'compare') return S.evidences.length;
        return 0;
      }

      async function confirmPair() {
        var NR = GAME.NarrativeRuntime;
        // tre esiti: available → confronto; completed → richiamo (il nesso è
        // GIÀ registrato — mai «nessun filo»); none → riga neutra
        var ps;
        try { ps = NR.notebookPairStatus(state, missions, selected); }
        catch (eDev) {
          // duplicate/ambiguous = errori di SVILUPPO: nessun «nessun filo»,
          // nessuna scrittura, log chiaro, stato della UI intatto
          log({ event: 'pair_resolver_error', error: String(eDev && eDev.message || eDev) });
          selected = []; render();
          return;
        }
        log({ event: 'compare_pair_selected', pair: selected.slice(), status: ps.status, matched: ps.node ? ps.node.id : null });
        busy = true;
        root.style.display = 'none'; // i flussi usano i propri widget/pagine
        var recall = null;
        if (ps.status === 'available') await opts.runComparison(ps.node, ps.source_mission);
        else if (ps.status === 'completed') { if (opts.onCompleted) recall = await opts.onCompleted(ps.node, ps.source_mission); }
        else if (opts.onNoMatch) await opts.onNoMatch();
        root.style.display = '';
        busy = false;
        selected = []; idx = 0;
        if (ps.status === 'completed') { view = 'section'; section = (recall && recall.recallSection !== undefined) ? recall.recallSection : 2; }
        else view = 'menu';
        render();
      }

      function onKey(e) {
        e.stopPropagation(); e.preventDefault();
        if (e.repeat || busy) return;
        var len = currentListLength();
        if (e.code === 'ArrowUp' || e.code === 'KeyW') { if (len) { idx = (idx + len - 1) % len; render(); } }
        else if (e.code === 'ArrowDown' || e.code === 'KeyS') { if (len) { idx = (idx + 1) % len; render(); } }
        else if (e.code === 'Enter' || e.code === 'KeyE') {
          if (view === 'menu') {
            activateMenu(idx);
          } else if (view === 'compare') {
            toggleCompare(idx);
          }
        }
        else if (e.code === 'Escape') goBack();
      }
      function onBlur() { if (!busy) finish(); }

      window.addEventListener('keydown', onKey, true);
      window.addEventListener('blur', onBlur);
      render();
      log({ event: 'notebook_opened' });
    });
  };
})();
