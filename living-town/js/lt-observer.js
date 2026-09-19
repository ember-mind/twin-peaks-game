/* lt-observer.js — Living Town: the page you watch.
 *
 * Two audiences share one simulation. The observer panel shows what a visitor
 * needs to follow a life: what someone is doing, what they owe, what they are
 * saving for, what just happened. The inspector shows what a developer needs:
 * the request that was asked, the candidates that were legal, the arithmetic
 * behind the choice, the execution state.
 *
 * Nothing on this page is invented. Every line is read back out of the
 * authoritative state or the event log, and the policy factors shown are the
 * numbers the policy actually produced — not a story about them.
 */
(function () {
  var root = window;
  var LT = root.LT;
  var O = LT.Observer = {};

  var SPEEDS = [
    { label: 'Pause', msPerMinute: 0 },
    { label: '1x', msPerMinute: 250 },
    { label: '4x', msPerMinute: 62 },
    { label: '20x', msPerMinute: 12 }
  ];
  var MAX_TICKS_PER_FRAME = 120;
  var VISUAL_DT_CAP = 100;      // ms; a sprite must not lurch after a long gap
  var BACKLOG_CAP = 5000;       // ms of real time the town will catch up on

  /* Two clocks come out of one gap between callbacks. The town runs on the
   * time that actually passed, so it keeps the same pace whether frames arrive
   * every 16 ms or, in a backgrounded tab, every few hundred. Animation runs
   * on a capped copy. Only a gap longer than BACKLOG_CAP (a suspended laptop)
   * is forgiven rather than replayed. */
  O.clockStep = function (now, last) {
    var real = last ? Math.max(0, now - last) : 16;
    return { sim: Math.min(BACKLOG_CAP, real), visual: Math.min(VISUAL_DT_CAP, real) };
  };

  /* How many whole minutes to run now, within the per-callback work budget. */
  O.dueTicks = function (accumulatorMs, msPerMinute, budget) {
    if (!msPerMinute) return 0;
    return Math.min(budget, Math.floor(accumulatorMs / msPerMinute));
  };
  O.MAX_TICKS_PER_FRAME = MAX_TICKS_PER_FRAME;

  function el(id) { return document.getElementById(id); }
  function text(node, value) { if (node && node.textContent !== value) node.textContent = value; }

  function bar(node, value) {
    if (!node) return;
    node.style.width = Math.max(0, Math.min(100, value)) + '%';
  }

  O.start = function () {
    /* What is stored in this browser decides what world the page opens on.
     * `?world=new` in the address asks for a new one and leaves the stored
     * save exactly as it is. */
    var persistence = LT.Persistence.create({});
    var fresh = /(?:^|[?&])world=new(?:&|$)/.test(String(root.location && root.location.search || ''));
    var booted = persistence.boot({ fresh: fresh });
    var sim = booted.sim || LT.Scenario.day1({});
    var view = LT.View.create(el('lt-canvas'), sim);
    var state = {
      sim: sim, view: view, speedIndex: 1, accumulator: 0,
      lastFrame: 0, pumping: false, inspector: false, selected: sim.actorIds()[0],
      persistence: persistence, worlds: 1
    };
    O.state = state;
    root.LT_OBSERVER = state;

    buildCharacterTabs(state);
    buildSpeedButtons(state);
    wireWorldControls(state, booted);
    el('lt-inspector-toggle').addEventListener('click', function () {
      state.inspector = !state.inspector;
      el('lt-inspector').hidden = !state.inspector;
      this.textContent = state.inspector ? 'Hide inspector' : 'Developer inspector';
    });

    function frame(now) {
      var step = O.clockStep(now, state.lastFrame);
      state.lastFrame = now;
      pump(state, step.sim);
      state.view.update(step.visual);
      state.view.draw();
      paint(state);
    }

    requestAnimationFrame(function loop(now) {
      frame(now);
      requestAnimationFrame(loop);
    });

    /* An occluded or backgrounded tab stops receiving animation frames, and a
     * town that only lives while someone is looking at it is not a persistent
     * world. The same fallback the Twin Peaks loop uses keeps time moving. */
    setInterval(function () {
      var now = performance.now();
      if (now - state.lastFrame > 250) frame(now);
    }, 200);

    return state;
  };

  /* Sim minutes are advanced one at a time with a microtask between them, so a
   * policy promise always settles before the next minute is decided. Running
   * thirty ticks back to back inside one frame would otherwise leave every
   * character waiting on an answer that could not arrive. */
  function pump(state, dt) {
    var ms = SPEEDS[state.speedIndex].msPerMinute;
    if (!ms) return;
    state.accumulator = Math.min(BACKLOG_CAP, state.accumulator + dt);
    if (state.pumping) return;
    var budget = O.dueTicks(state.accumulator, ms, MAX_TICKS_PER_FRAME);
    state.pumping = true;
    (function step() {
      var nowMs = SPEEDS[state.speedIndex].msPerMinute;
      if (budget-- <= 0 || !nowMs || state.accumulator < nowMs) {
        state.pumping = false;
        return;
      }
      state.sim.tick();
      state.view.observe();   // every step, so a sprite follows the route and not a chord across it
      state.accumulator -= nowMs;
      /* Between two ticks is the one moment the world is whole: nothing half
       * applied. The controller decides whether one is due; most ticks it is not. */
      var auto = state.persistence.autosave(state.sim);
      if (auto) reportSave(state, auto);
      Promise.resolve().then(function () { return Promise.resolve(); }).then(step);
    })();
  }

  /* ---------------- this world: save, resume, new ---------------- */

  /* The page starts following another world. One loop, one view, one set of
   * panels: they all read state.sim, which is replaced here, so the world that
   * was on screen simply stops being advanced — nothing keeps ticking it. */
  O.adopt = function (state, sim) {
    state.retired = state.sim;
    state.sim = sim;
    state.view = LT.View.create(el('lt-canvas'), sim);
    state.accumulator = 0;
    state.worlds++;
    if (!sim.state.characters[state.selected]) state.selected = sim.actorIds()[0];
    buildCharacterTabs(state);
    state.view.focus(state.selected);
  };

  function say(kind, message) {
    var node = el('lt-save-status');
    node.className = 'save-status' + (kind ? ' is-' + kind : '');
    text(node, message);
  }

  function reportSave(state, result) {
    if (result.ok) {
      say('ok', (result.auto ? 'Autosaved' : 'Saved') + ' at ' + result.savedAt + ' (' + Math.round(result.bytes / 1024) + ' KB, this browser only).');
    } else if (result.status === 'other_tab') {
      say('warn', 'Not saved: another tab is saving this world. Press Save to take over from it.');
    } else if (result.status === 'protected') {
      say('warn', 'Not saved: ' + result.reason + '.');
    } else {
      say('bad', 'Save failed: ' + result.reason + '.');
    }
    refreshButtons(state);
  }

  function refreshButtons(state) {
    var peek = LT.Save.peekLocal();
    el('lt-resume').disabled = peek.status !== 'present';
    el('lt-save').disabled = peek.status === 'unavailable';
  }

  /* An inline question, not a browser dialog: the town keeps its place while
   * it is on screen, and Cancel changes nothing. */
  function ask(state, question, yesLabel, onYes) {
    var was = state.speedIndex;
    state.speedIndex = 0; buildSpeedButtons(state);
    text(el('lt-confirm-text'), question);
    text(el('lt-confirm-yes'), yesLabel);
    el('lt-confirm').hidden = false;
    function close(run) {
      el('lt-confirm').hidden = true;
      el('lt-confirm-yes').onclick = null; el('lt-confirm-no').onclick = null;
      state.speedIndex = was; buildSpeedButtons(state);
      if (run) onYes();
    }
    el('lt-confirm-yes').onclick = function () { close(true); };
    el('lt-confirm-no').onclick = function () { close(false); say('', 'Cancelled. Nothing was changed.'); };
  }

  function wireWorldControls(state, booted) {
    var pz = state.persistence;
    var described = {
      loaded: function () { say('ok', 'Resumed the saved world at ' + state.sim.stamp() + '.'); },
      none: function () { say('', 'No saved world in this browser. This is a new one; it autosaves as it goes.'); },
      refused: function () { say('bad', 'The saved world could not be used and has been left untouched: ' + booted.reason + ' This is a new world; it will not be saved over the old one unless you say so.'); },
      unavailable: function () { say('bad', 'Saving is unavailable: ' + booted.reason + '. This world lives only as long as this page.'); },
      set_aside: function () { say('warn', 'New world, because the address asked for one. The saved world is untouched; saving will ask before replacing it.'); }
    };
    (described[booted.status] || described.none)();
    refreshButtons(state);

    el('lt-save').addEventListener('click', function () {
      var result = pz.save(state.sim);
      if (result.status === 'protected') {
        return ask(state, 'Replace the stored save? ' + result.reason + '. It will be kept aside, not deleted.', 'Replace it',
          function () { reportSave(state, pz.save(state.sim, { replaceProtected: true, takeOver: true })); });
      }
      if (result.status === 'other_tab') {
        return ask(state, 'Another tab is saving this world. Save from this tab instead? The other tab will stop saving.', 'Save from here',
          function () { reportSave(state, pz.save(state.sim, { takeOver: true })); });
      }
      reportSave(state, result);
    });

    el('lt-resume').addEventListener('click', function () {
      ask(state, 'Go back to the saved world? What has happened here since the last save will be lost.', 'Resume saved', function () {
        var read = pz.resume();
        if (read.status === 'loaded') { O.adopt(state, read.sim); say('ok', 'Resumed the saved world at ' + read.sim.stamp() + '.'); }
        else if (read.status === 'refused') say('bad', 'The saved world could not be used and has been left untouched: ' + read.reason);
        else if (read.status === 'none') say('warn', 'There is no saved world in this browser.');
        else say('bad', 'The saved world could not be read: ' + read.reason + '.');
        refreshButtons(state);
      });
    });

    el('lt-new-world').addEventListener('click', function () {
      var replaces = pz.newWorldReplaces();
      function begin() {
        /* A different town, not the same morning again. */
        var sim = LT.Scenario.day1({ seed: (Date.now() % 2147483647) || 1 });
        O.adopt(state, sim);
        var result = pz.save(sim, { replaceProtected: true, takeOver: true, setAside: true });
        if (result.ok) say('ok', 'A new world has begun and been saved' + (replaces ? '; the previous save was kept aside.' : '.'));
        else reportSave(state, result);
        refreshButtons(state);
      }
      if (replaces) ask(state, 'Start a new world? It replaces ' + replaces + '. The old save will be kept aside, not deleted.', 'Start a new world', begin);
      else begin();
    });

    /* Leaving: one last save if this tab is the one saving, then let go. */
    function leave() {
      if (!pz.protectedReason && !pz.heldElsewhere() && LT.Save.peekLocal().status !== 'unavailable') pz.save(state.sim, { auto: true });
      pz.release();
    }
    root.addEventListener('pagehide', leave);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden' && pz.autosaveDue(state.sim)) reportSave(state, pz.save(state.sim, { auto: true }));
    });
    /* Another tab wrote the world this tab is showing. Say so; do not fight. */
    root.addEventListener('storage', function (ev) {
      if (ev.key === LT.Save.DEFAULT_KEY && ev.newValue) say('warn', 'This world was just saved from another tab. This tab will not save over it unless you press Save.');
      refreshButtons(state);
    });
    setInterval(function () { pz.heartbeat(); }, 5000);
  }

  function buildCharacterTabs(state) {
    var host = el('lt-characters');
    host.innerHTML = '';
    state.sim.actorIds().forEach(function (id) {
      var c = state.sim.state.characters[id];
      var b = document.createElement('button');
      b.className = 'lt-tab';
      b.textContent = c.name;
      b.dataset.actor = id;
      b.addEventListener('click', function () {
        state.selected = id;
        state.view.focus(id);
        Array.prototype.forEach.call(host.children, function (n) {
          n.classList.toggle('is-on', n.dataset.actor === id);
        });
      });
      if (id === state.selected) b.classList.add('is-on');
      host.appendChild(b);
    });
    state.view.focus(state.selected);
  }

  function buildSpeedButtons(state) {
    var host = el('lt-speeds');
    host.innerHTML = '';
    SPEEDS.forEach(function (s, i) {
      var b = document.createElement('button');
      b.className = 'lt-tab';
      b.textContent = s.label;
      b.addEventListener('click', function () {
        state.speedIndex = i;
        Array.prototype.forEach.call(host.children, function (n, j) { n.classList.toggle('is-on', i === j); });
        if (s.msPerMinute) pump(state, 0);
      });
      if (i === state.speedIndex) b.classList.add('is-on');
      host.appendChild(b);
    });
  }

  /* ---------------- panels ---------------- */

  function paint(state) {
    var sim = state.sim, s = sim.state;
    var c = s.characters[state.selected];
    var U = LT.Util, W = LT.World;

    text(el('lt-clock'), 'Day ' + s.day + ' · ' + U.clock(s.minute));
    text(el('lt-place'), sim.locationName(c.location) +
      (c.transit ? ' (on the way to ' + sim.locationName(c.transit.to) + ')' : ''));
    text(el('lt-who'), c.fullName || c.name);
    var act = c.activity;
    var phaseLabel = !act ? '' : act.phase === 'approaching' ? 'On the way to: ' : act.phase === 'waiting_reply' ? 'Waiting for an answer: ' : '';
    text(el('lt-doing'), act ? phaseLabel + act.label : (c.pending ? 'deciding what to do next' : 'between things'));
    text(el('lt-doing-detail'), act
      ? ((act.phase === 'executing' ? act.elapsed + ' of ' + act.plannedMinutes + ' min' : act.approachMinutes + ' min so far, not yet begun') +
         ' · chosen by ' + act.source)
      : (c.pending ? 'request ' + c.pending.requestId : ''));

    bar(el('lt-energy-bar'), c.needs.energy);
    bar(el('lt-hunger-bar'), 100 - c.needs.hunger);
    text(el('lt-energy-value'), Math.round(c.needs.energy) + '');
    text(el('lt-hunger-value'), Math.round(c.needs.hunger) + '');
    text(el('lt-money'), c.money.toFixed(2) + ' EUR');
    text(el('lt-savings'), c.savings.toFixed(2) + ' EUR');

    paintGoals(c);
    paintCommitments(sim, c);
    paintEvents(sim, c);
    paintDecision(c);
    if (state.inspector) paintInspector(state, c);
  }

  function paintGoals(c) {
    var host = el('lt-goals');
    host.innerHTML = '';
    (c.goals || []).forEach(function (g) {
      var row = document.createElement('div');
      row.className = 'lt-goal' + (g.reached ? ' is-done' : '');
      var pct = Math.max(0, Math.min(100, (g.progress / g.target) * 100));
      row.innerHTML = '<div class="lt-goal-head"><span>' + escape(g.label) + '</span>' +
        '<span class="lt-num">' + round(g.progress) + ' / ' + g.target + ' ' + escape(g.unit || '') + '</span></div>' +
        '<div class="lt-meter"><i style="width:' + pct.toFixed(1) + '%"></i></div>';
      host.appendChild(row);
    });
  }

  function paintCommitments(sim, c) {
    var host = el('lt-commitments');
    host.innerHTML = '';
    var U = LT.Util;
    var open = (c.commitments || []).filter(function (k) { return k.status === 'open'; });
    open.sort(function (a, b) { return U.absolute(a.dueDay, a.dueMin) - U.absolute(b.dueDay, b.dueMin); });
    var settled = (c.commitments || []).filter(function (k) { return k.status !== 'open'; });
    open.concat(settled).forEach(function (k) {
      var row = document.createElement('div');
      row.className = 'lt-commit is-' + k.status;
      row.innerHTML = '<span class="lt-dot"></span><span>' + escape(k.label) + '</span>' +
        '<span class="lt-num">' + (k.status === 'open' ? U.clock(k.dueMin) : k.status) + '</span>';
      host.appendChild(row);
    });
  }

  var NOISE = { ACTIVITY_STARTED: 1, ACTIVITY_COMPLETED: 1 };

  function paintEvents(sim, c) {
    var host = el('lt-events');
    var rows = [];
    var events = sim.state.events;
    for (var i = events.length - 1; i >= 0 && rows.length < 14; i--) {
      var e = events[i];
      if (NOISE[e.type]) continue;
      var who = e.actorId || e.subjectId;
      if (who && who !== c.id && !involves(e, c.id)) continue;
      rows.push(e);
    }
    host.innerHTML = rows.map(function (e) {
      return '<li><span class="lt-num">' + escape(e.stamp) + '</span>' + escape(e.text) + '</li>';
    }).join('');
  }

  function involves(e, id) {
    return !!(e.data && (e.data.withId === id || e.data.toId === id));
  }

  function paintDecision(c) {
    var d = c.recentDecisions[0];
    text(el('lt-decision-source'), d ? d.source : '—');
    text(el('lt-decision-detail'), d
      ? (d.stamp + ' · ' + d.label + ' · ' + d.candidateCount + ' legal options')
      : 'no decision recorded yet');
  }

  /* ---------------- developer inspector ---------------- */

  function paintInspector(state, c) {
    var sim = state.sim;
    var d = c.recentDecisions[0];
    var obs = LT.Perception.observe(sim, c);
    var cand = LT.Perception.candidates(sim, c);

    el('lt-insp-observations').textContent = JSON.stringify({
      clock: obs.clock, location: obs.location, present: obs.present,
      objects: obs.objects.map(function (o) { return o.id + ' [' + o.affordances.join(',') + ']'; }),
      offers: obs.offers, reachable: obs.reachable.map(function (r) { return r.id + ' (' + r.walkMinutes + ' min)'; })
    }, null, 1);

    el('lt-insp-memories').textContent = LT.Perception.relevantMemories(c, 8).map(function (m) {
      return m.stamp + '  ' + m.salience.toFixed(2) + '  ' + (m.firsthand ? '*' : ' ') + ' ' + m.summary;
    }).join('\n') || '(none)';

    el('lt-insp-candidates').textContent =
      cand.legal.map(function (x) { return '+ ' + x.id + '  ' + x.durationMinutes + ' min'; }).join('\n') +
      '\n' +
      cand.rejected.map(function (x) { return '- ' + x.id + '  (' + x.reason + ')'; }).join('\n');

    el('lt-insp-activity').textContent = c.activity
      ? JSON.stringify(c.activity, null, 1)
      : (c.pending ? 'awaiting ' + JSON.stringify(c.pending, null, 1) : '(idle)');

    if (d && d.diagnostics && d.diagnostics.factors) {
      el('lt-insp-factors').textContent =
        'request ' + d.requestId + '  selected ' + d.selectedId + '  source ' + d.source + '\n' +
        'goalUrgency ' + d.diagnostics.goalUrgency + '  fatigue ' + d.diagnostics.fatigue + '\n\n' +
        d.diagnostics.factors.map(function (f) {
          return pad(f.score, 9) + '  ' + f.candidateId + '\n' +
            Object.keys(f.terms).map(function (k) { return '            ' + k + ' ' + f.terms[k]; }).join('\n');
        }).join('\n');
    } else {
      el('lt-insp-factors').textContent = d ? ('source ' + d.source + ' (no structured factors)') : '(none)';
    }

    el('lt-insp-rejections').textContent = sim.rejections.length
      ? sim.rejections.slice(-8).map(function (r) { return r.stamp + '  ' + r.reason + '  ' + (r.requestId || ''); }).join('\n')
      : '(no decision was refused)';

    el('lt-insp-events').textContent = sim.state.events.slice(-14).map(function (e) {
      return e.stamp + '  ' + e.type + '  ' + e.text;
    }).join('\n');
  }

  function pad(v, n) { var s = String(v); while (s.length < n) s = ' ' + s; return s; }
  function round(v) { return Math.round(v * 100) / 100; }
  function escape(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
