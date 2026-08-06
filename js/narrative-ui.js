/* narrative-ui.js — B1: widget di scelta GENERICO sul contratto A.1.2.
 * Sequenza vincolante: prepare → choice shown → highlight → confirm →
 * selezione congelata → feedback_pages → conferma ultima pagina → commit
 * UNA volta → goto (pagine del ramo, poi commitNode) → gameplay ripristinato.
 * Escape/blur PRIMA del commit: prepared scartato, stato byte-identico.
 * Doppio input: un solo commit. Il widget usa SOLO NR.availableChoices.
 * Hardening B2: testo via textContent (mai innerHTML sul contenuto narrativo);
 * event.repeat ignorato + advance-lock (ogni pagina percepibile); errori del
 * ramo espliciti (branch_prepare_failed/branch_commit_failed/partial_transaction)
 * senza ripristino dell'input — il chiamante decide il recupero. */
(function () {
  if (typeof window === 'undefined') return;
  var GAME = window.GAME = window.GAME || {};
  var NR = GAME.NarrativeRuntime;
  var UI = GAME.NarrativeUI = {};

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // inputContext: { suspend(), restore() } — fornito dall'adapter (o stub nei test).
  // opts.advanceLockMs: intervallo minimo tra pagine (default 150; percepibilità).
  UI.openChoice = function (opts) {
    var state = opts.state, mission = opts.mission, node = opts.node;
    var container = opts.container, input = opts.inputContext;
    var log = opts.log || function () {};
    var advanceLockMs = (opts.advanceLockMs !== undefined) ? opts.advanceLockMs : 150;
    return new Promise(function (resolve) {
      var phase = 'choosing'; // choosing | feedback | branch | done
      var committed = false, confirmedLock = false;
      var prepared = null, branchPrepared = null;
      var choices = NR.availableChoices(state, mission, node);
      var idx = 0, feedbackPages = [], pageIdx = 0, branchPages = [];
      var lastPageShownAt = 0;

      input.suspend();
      var root = el('div', 'nw-root');
      root.setAttribute('role', 'dialog');
      container.appendChild(root);

      function finish(outcome, keepSuspended) {
        if (phase === 'done') return;
        phase = 'done';
        window.removeEventListener('keydown', onKey, true);
        window.removeEventListener('blur', onBlur);
        root.remove();
        if (!keepSuspended) input.restore();
        log({ event: 'widget_closed', outcome: outcome });
        resolve(outcome);
      }

      function abort() {
        if (committed) return; // post-commit: mai annullare
        prepared = null;
        finish({ aborted: true });
      }

      function render() {
        while (root.firstChild) root.removeChild(root.firstChild);
        if (phase === 'choosing') {
          root.appendChild(el('div', 'nw-title', node.prompt || ''));
          choices.forEach(function (c, i) {
            var opt = el('div', 'nw-opt' + (i === idx ? ' nw-focus' : ''), (i === idx ? '▶ ' : '  ') + c.label);
            opt.setAttribute('data-i', String(i));
            opt.setAttribute('data-page-role', 'choice');
            opt.setAttribute('data-choice-id', c.id);
            root.appendChild(opt);
          });
        } else if (phase === 'feedback' || phase === 'branch') {
          var pages = phase === 'feedback' ? feedbackPages : branchPages;
          var pg = pages[pageIdx];
          var box = el('div', 'nw-page');
          box.setAttribute('data-page-id', pg.id);
          if (pg.display_name) box.appendChild(el('span', 'nw-name', pg.display_name + ': '));
          box.appendChild(document.createTextNode(pg.text));
          root.appendChild(box);
          root.appendChild(el('div', 'nw-hint', '▼'));
          lastPageShownAt = performance.now();
          log({ event: 'page_shown', page_id: pg.id, visible_text: pg.text });
        }
      }

      function confirmChoice() {
        if (confirmedLock) return; // atomica: doppio input = niente
        confirmedLock = true;
        var choice = choices[idx];
        prepared = NR.prepareChoice(state, mission, node, choice.id);
        if (!prepared.ok) { confirmedLock = false; return; }
        if (opts.injectStale) state.revision++; // hook di test: transazione stale
        log({ event: 'choice_confirmed', choice_id: choice.id, tx_id: prepared.tx_id, base_revision: prepared.base_revision });
        feedbackPages = prepared.feedback_pages || [];
        if (feedbackPages.length > 0) { phase = 'feedback'; pageIdx = 0; render(); }
        else doCommit();
      }

      function doCommit() {
        if (committed) return;
        if (prepared.node_id !== node.id) throw new Error('prepared_choice_node_mismatch');
        var result = NR.commitChoice(state, mission, node, prepared);
        log({ event: 'commit', ok: result.ok, repeated: !!result.repeated, error: result.error || null });
        if (!result.ok) { finish({ error: result.error }); return; } // stale → abort sicuro
        committed = true;
        if (result.repeated) { finish({ repeated: true }); return; }
        if (result.goto) {
          branchPrepared = NR.prepareNode(state, mission, result.goto);
          if (!branchPrepared.ok) {
            // scelta già committata, ramo non preparabile: transazione PARZIALE.
            // Niente {committed:true} silenzioso; input NON ripristinato — decide il chiamante.
            log({ event: 'branch_prepare_failed', node_id: result.goto, error: branchPrepared.error });
            finish({ error: 'branch_prepare_failed', partial_transaction: true, node_id: result.goto }, true);
            return;
          }
          branchPages = branchPrepared.pages || [];
          if (branchPages.length > 0) { phase = 'branch'; pageIdx = 0; render(); return; }
          commitBranch();
          return;
        }
        finish({ committed: true });
      }

      function commitBranch() {
        var cr = NR.commitNode(state, mission, branchPrepared);
        log({ event: 'branch_committed', node_id: branchPrepared.node.id, ok: cr.ok, error: cr.error || null });
        if (!cr.ok) {
          finish({ error: 'branch_commit_failed', partial_transaction: true, node_id: branchPrepared.node.id }, true);
          return;
        }
        finish({ committed: true, branch: branchPrepared.node.id });
      }

      function advancePage() {
        // advance-lock: la pagina deve restare visibile un tempo percepibile
        if (advanceLockMs > 0 && performance.now() - lastPageShownAt < advanceLockMs) return;
        var pages = phase === 'feedback' ? feedbackPages : branchPages;
        if (pageIdx < pages.length - 1) { pageIdx++; render(); return; }
        // ultima pagina confermata
        if (phase === 'feedback') { doCommit(); return; }
        // ramo: commitNode DOPO l'ultima pagina ("BOB" visibile PRIMA di T1)
        commitBranch();
      }

      function onKey(e) {
        e.stopPropagation(); e.preventDefault(); // niente input che filtra al gameplay
        if (e.repeat) return; // tasto tenuto: mai attraversare pagine o opzioni
        if (phase === 'choosing') {
          if (e.code === 'ArrowUp' || e.code === 'KeyW') { idx = (idx + choices.length - 1) % choices.length; render(); }
          else if (e.code === 'ArrowDown' || e.code === 'KeyS') { idx = (idx + 1) % choices.length; render(); }
          else if (e.code === 'Enter' || e.code === 'KeyE') confirmChoice();
          else if (e.code === 'Escape' && opts.allowCancel !== false) abort();
        } else if (phase === 'feedback' || phase === 'branch') {
          if (e.code === 'Enter' || e.code === 'KeyE') advancePage();
          else if (e.code === 'Escape' && phase === 'feedback' && !committed) abort();
        }
      }
      function onBlur() { if (!committed) abort(); }

      root.addEventListener('mousemove', function (e) {
        var t = e.target.closest && e.target.closest('.nw-opt');
        if (t && phase === 'choosing') { var i = parseInt(t.getAttribute('data-i'), 10); if (i !== idx) { idx = i; render(); } }
      });
      root.addEventListener('click', function (e) {
        if (phase === 'choosing') {
          var t = e.target.closest && e.target.closest('.nw-opt');
          if (t) { idx = parseInt(t.getAttribute('data-i'), 10); confirmChoice(); }
        } else advancePage();
      });
      window.addEventListener('keydown', onKey, true);
      window.addEventListener('blur', onBlur);
      render();
      log({ event: 'widget_opened', choices: choices.map(function (c) { return c.id; }) });
    });
  };

  /* Presentatore di pagine: mostra una sequenza di pagine (nodo/riapertura)
   * SENZA toccare lo stato — il commit resta al chiamante. Stessa disciplina
   * del widget: advance-lock, event.repeat ignorato, Escape/blur = abort. */
  UI.showPages = function (opts) {
    var pages = opts.pages || [], container = opts.container, input = opts.inputContext;
    var log = opts.log || function () {};
    var advanceLockMs = (opts.advanceLockMs !== undefined) ? opts.advanceLockMs : 150;
    return new Promise(function (resolve) {
      if (pages.length === 0) { resolve({ done: true, empty: true }); return; }
      var i = 0, done = false, lastShownAt = 0;
      input.suspend();
      var root = el('div', 'nw-root');
      root.setAttribute('role', 'dialog');
      container.appendChild(root);

      function finish(outcome) {
        if (done) return;
        done = true;
        window.removeEventListener('keydown', onKey, true);
        window.removeEventListener('blur', onBlur);
        root.remove();
        input.restore();
        log({ event: 'pages_closed', outcome: outcome });
        resolve(outcome);
      }
      function render() {
        while (root.firstChild) root.removeChild(root.firstChild);
        var pg = pages[i];
        var box = el('div', 'nw-page');
        box.setAttribute('data-page-id', pg.id);
        if (pg.display_name) box.appendChild(el('span', 'nw-name', pg.display_name + ': '));
        box.appendChild(document.createTextNode(pg.text));
        root.appendChild(box);
        root.appendChild(el('div', 'nw-hint', '▼'));
        lastShownAt = performance.now();
        log({ event: 'page_shown', page_id: pg.id, visible_text: pg.text });
      }
      function advance() {
        if (advanceLockMs > 0 && performance.now() - lastShownAt < advanceLockMs) return;
        if (i < pages.length - 1) { i++; render(); return; }
        finish({ done: true });
      }
      function onKey(e) {
        e.stopPropagation(); e.preventDefault();
        if (e.repeat) return;
        if (e.code === 'Enter' || e.code === 'KeyE') advance();
        else if (e.code === 'Escape' && opts.allowCancel !== false) finish({ aborted: true });
      }
      function onBlur() { if (opts.allowCancel !== false) finish({ aborted: true }); }
      root.addEventListener('click', function () { advance(); });
      window.addEventListener('keydown', onKey, true);
      window.addEventListener('blur', onBlur);
      render();
    });
  };
})();
