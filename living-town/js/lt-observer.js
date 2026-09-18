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
  var MAX_TICKS_PER_FRAME = 30;

  function el(id) { return document.getElementById(id); }
  function text(node, value) { if (node && node.textContent !== value) node.textContent = value; }

  function bar(node, value) {
    if (!node) return;
    node.style.width = Math.max(0, Math.min(100, value)) + '%';
  }

  O.start = function () {
    var sim = LT.Scenario.day1({});
    var view = LT.View.create(el('lt-canvas'), sim);
    var state = {
      sim: sim, view: view, speedIndex: 1, accumulator: 0,
      lastFrame: 0, pumping: false, inspector: false, selected: sim.actorIds()[0]
    };
    O.state = state;
    root.LT_OBSERVER = state;

    buildCharacterTabs(state);
    buildSpeedButtons(state);
    el('lt-inspector-toggle').addEventListener('click', function () {
      state.inspector = !state.inspector;
      el('lt-inspector').hidden = !state.inspector;
      this.textContent = state.inspector ? 'Hide inspector' : 'Developer inspector';
    });

    function frame(now) {
      var dt = state.lastFrame ? Math.min(100, now - state.lastFrame) : 16;
      state.lastFrame = now;
      pump(state, dt);
      state.view.update(dt);
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
    state.accumulator += dt;
    if (state.pumping) return;
    var budget = MAX_TICKS_PER_FRAME;
    state.pumping = true;
    (function step() {
      if (state.accumulator < ms || budget-- <= 0 || !SPEEDS[state.speedIndex].msPerMinute) {
        state.pumping = false;
        return;
      }
      state.sim.tick();
      state.accumulator -= ms;
      Promise.resolve().then(function () { return Promise.resolve(); }).then(step);
    })();
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
    text(el('lt-doing'), c.activity ? c.activity.label : (c.pending ? 'deciding what to do next' : 'between things'));
    text(el('lt-doing-detail'), c.activity
      ? (c.activity.elapsed + ' of ' + c.activity.plannedMinutes + ' min · chosen by ' + c.activity.source)
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
      if (e.actorId && e.actorId !== c.id && !involves(e, c.id)) continue;
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
