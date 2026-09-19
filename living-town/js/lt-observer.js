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
    { label: '20x', msPerMinute: 12 },
    /* Auto picks one of the paces below every frame from what is going on. */
    { label: 'Auto', msPerMinute: 62, auto: true }
  ];
  var PACE_MS = { close: 250, steady: 90, quick: 20, asleep: 5 };
  var SNAPSHOT_EVERY = 30, SNAPSHOT_KEEP = 72;    // sim minutes between snapshots; two days of them, which is as far back as the full record goes
  var REPLAY_LEAD = 12, REPLAY_TAIL = 35;          // minutes shown before and after the moment asked for

  function msPerMinute(state) {
    var s = SPEEDS[state.speedIndex];
    if (state.replay) return s.msPerMinute ? 250 : 0;      // a replay is watched at 1x, or paused
    return s.auto ? PACE_MS[LT.Story.pace(state.sim)] : s.msPerMinute;
  }
  /* The world on screen: the live one, or a replay of an earlier hour of it. */
  function shown(state) { return state.replay ? state.replay.sim : state.sim; }
  O.shown = shown;
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
    /* A new world has the whole street in it. `?cast=pair` asks for the two
     * people the town began with; a resumed world keeps whoever it was made with. */
    var pair = /(?:^|[?&])cast=pair(?:&|$)/.test(String(root.location && root.location.search || ''));
    O.newWorld = function (opts) { return pair ? LT.Scenario.day1(opts || {}) : LT.Scenario.town(opts || {}); };
    var sim = booted.sim || O.newWorld({});
    if (LT.ActivityPoses) LT.ActivityPoses.load();
    var view = LT.View.create(el('lt-canvas'), sim);
    /* Someone opening the page for the first time should see something happen:
     * it opens on Auto, following the action. `?speed=1x` (or pause, 4x, 20x)
     * opens it the plain way, which is what the capture tools and tests ask for. */
    var asked = /(?:^|[?&])speed=([a-z0-9]+)/i.exec(String(root.location && root.location.search || ''));
    var startSpeed = SPEEDS.length - 1, plain = false;
    if (asked) SPEEDS.forEach(function (sp, i) { if (sp.label.toLowerCase() === asked[1].toLowerCase()) { startSpeed = i; plain = true; } });
    var state = {
      sim: sim, view: view, speedIndex: startSpeed, accumulator: 0,
      lastFrame: 0, pumping: false, inspector: false, selected: sim.actorIds()[0],
      persistence: persistence, worlds: 1,
      followAction: !plain, recapDay: null, snapshots: [], replay: null, recorders: {}
    };
    O.state = state;
    O.recordRemote(state);
    root.LT_OBSERVER = state;

    buildCharacterTabs(state);
    buildSpeedButtons(state);
    wireWorldControls(state, booted);
    wireHand(state);
    el('lt-replay-back').addEventListener('click', function () { O.backToNow(state); });
    el('lt-recap-prev').addEventListener('click', function () { stepRecap(state, -1); });
    el('lt-recap-next').addEventListener('click', function () { stepRecap(state, 1); });
    el('lt-inspector-toggle').addEventListener('click', function () {
      state.inspector = !state.inspector;
      el('lt-inspector').hidden = !state.inspector;
      this.textContent = state.inspector ? 'Hide inspector' : 'Developer inspector';
    });

    function frame(now) {
      var step = O.clockStep(now, state.lastFrame);
      state.lastFrame = now;
      pump(state, step.sim);
      state.held = heldFor(state);     // also while paused, so the caption never says "waiting" after the answer is in
      followTheAction(state);
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
  /* A question is out with a provider that answers in real seconds. Rather than
   * let a quarter of an hour of town time go by while it thinks, the town's
   * clock is held — for as long as that provider says it is worth waiting,
   * counted from when the page first saw the question, and no longer. After
   * that time moves again and the simulation's own timeout does what it does. */
  function heldFor(state) {
    if (state.replay) return null;
    var sim = state.sim, now = performance.now(), held = null;
    state.waiting = state.waiting || {};
    var open = {};
    sim.actorIds().forEach(function (id) {
      var c = sim.state.characters[id], policy = c.pending && LT.Policy.get(c.policyId);
      if (!policy || !policy.remote) return;
      var key = c.pending.requestId;
      /* Once the answer is in, it is the next tick that applies it: holding
       * any longer would be waiting for something that has already come. */
      if ((sim.inbox || []).some(function (r) { return r.requestId === key; })) return;
      open[key] = true;
      if (state.waiting[key] === undefined) state.waiting[key] = now;
      if (now - state.waiting[key] < (policy.patienceMs || 0)) held = held || { actorId: id, name: c.name, source: policy.label || policy.id };
    });
    Object.keys(state.waiting).forEach(function (k) { if (!open[k]) delete state.waiting[k]; });
    return held;
  }
  O.heldFor = heldFor;

  function pump(state, dt) {
    var ms = msPerMinute(state);
    if (!ms) return;
    state.held = heldFor(state);
    if (state.held) { state.accumulator = 0; return; }
    state.accumulator = Math.min(BACKLOG_CAP, state.accumulator + dt);
    if (state.pumping) return;
    var budget = O.dueTicks(state.accumulator, ms, MAX_TICKS_PER_FRAME);
    state.pumping = true;
    (function step() {
      var nowMs = msPerMinute(state);
      if (budget-- <= 0 || !nowMs || state.accumulator < nowMs) {
        state.pumping = false;
        return;
      }
      if (state.replay) {
        /* Only the replay moves. The live world waits exactly where it was,
         * and nothing about a replay is ever saved. */
        askedAgain(state, state.replay.sim);
        state.replay.sim.tick();
        state.view.observe();
        state.accumulator -= nowMs;
        if (state.replay.sim.absMinute() >= state.replay.untilAbs) { state.speedIndex = 0; buildSpeedButtons(state); }
        Promise.resolve().then(function () { return Promise.resolve(); }).then(step);
        return;
      }
      if (heldFor(state)) { state.accumulator = 0; state.pumping = false; return; }   // a question went out on the last tick
      state.sim.tick();
      state.view.observe();   // every step, so a sprite follows the route and not a chord across it
      state.accumulator -= nowMs;
      keepSnapshot(state);
      /* Between two ticks is the one moment the world is whole: nothing half
       * applied. The controller decides whether one is due; most ticks it is not. */
      var auto = state.persistence.autosave(state.sim);
      if (auto) reportSave(state, auto);
      Promise.resolve().then(function () { return Promise.resolve(); }).then(step);
    })();
  }

  /* ---------------- looking back ---------------- */

  /* Every half hour of town time the world is copied, exactly as a save would
   * copy it. A moment on the timeline is shown by loading the copy before it
   * and letting that run forward: the same people deciding again from the
   * same state. With a policy that answers the same way twice this is what
   * happened; with one that may not, it is what could have. */
  function keepSnapshot(state) {
    var abs = state.sim.absMinute();
    if (abs % SNAPSHOT_EVERY) return;
    /* Kept as text: a quarter of the memory of the object it came from. */
    try { state.snapshots.push({ abs: abs, save: JSON.stringify(LT.Save.serialize(state.sim)) }); } catch (e) { return; }
    if (state.snapshots.length > SNAPSHOT_KEEP) state.snapshots.shift();
  }

  /* Looking back asks the policies again from an earlier state. That is what
   * happened only while every policy answers the same way twice; with a
   * provider outside this process it would be a second, different, paid-for
   * answer passed off as the first, so it is not offered. */
  O.replayBlockedBy = function (state) {
    var sim = state.sim, who = null;
    sim.actorIds().forEach(function (id) {
      var p = LT.Policy.get(sim.state.characters[id].policyId);
      if (p && p.remote && !state.recorders[p.id] && !who) who = (p.label || p.id);
    });
    return who;
  };

  /* A provider outside this process is recorded from the moment the page
   * follows a world: every answer it gives is kept, by the question's number.
   * Looking back then plays those answers instead of asking again, and says so
   * if the replay stops matching what was recorded. */
  O.recordRemote = function (state) {
    state.recorders = state.recorders || {};
    state.sim.actorIds().forEach(function (id) {
      var pid = state.sim.state.characters[id].policyId, inner = LT.Policy.get(pid);
      if (!inner || !inner.remote || state.recorders[pid]) return;
      if (inner.recordingOf) inner = inner.recordingOf;      // another world's recorder: this world gets its own, around the same provider
      var rec = LT.RecordedPolicy.buildRecorder(inner, { id: pid });
      rec.recordingOf = inner; rec.remote = true; rec.label = inner.label || pid;
      Object.defineProperty(rec, 'patienceMs', { get: function () { return inner.patienceMs; } });
      if (inner.stats) rec.stats = inner.stats;
      LT.Policy.register(rec);
      state.recorders[pid] = rec;
    });
  };
  O.canReplay = function (state, abs) {
    if (O.replayBlockedBy(state)) return false;
    return state.snapshots.some(function (s) { return s.abs <= abs - REPLAY_LEAD; });
  };

  O.replay = function (state, beat) {
    if (state.replay) O.backToNow(state);
    var from = null;
    state.snapshots.forEach(function (s) { if (s.abs <= beat.absMinute - REPLAY_LEAD) from = s; });
    if (!from) return Promise.resolve(false);
    /* While looking back, recorded providers are played, not asked. The live
     * world is not ticking, so it misses nothing; a question it already has out
     * is answered through the recorder it was asked through. */
    var players = {};
    Object.keys(state.recorders || {}).forEach(function (pid) {
      players[pid] = LT.RecordedPolicy.buildPlayer(state.recorders[pid].toJSON(), { id: pid, keepSource: true });
      LT.Policy.register(players[pid]);
    });
    var sim;
    try { sim = LT.Save.deserialize(JSON.parse(from.save)); }
    catch (e) { restoreRecorders(state); return Promise.resolve(false); }
    var startAt = beat.absMinute - REPLAY_LEAD;
    return replayForward(state, sim, startAt).then(function () {
      state.replay = { sim: sim, untilAbs: beat.absMinute + REPLAY_TAIL, beat: beat, players: players, resumeSpeed: state.speedIndex, liveView: state.view, liveSelected: state.selected };
      state.view = LT.View.create(el('lt-canvas'), sim);
      if (beat.actorId && sim.state.characters[beat.actorId]) state.selected = beat.actorId;
      state.followAction = false;
      state.accumulator = 0;
      state.speedIndex = 1;
      buildCharacterTabs(state); buildSpeedButtons(state);
      showReplayBar(state);
      return true;
    });
  };

  function restoreRecorders(state) {
    Object.keys(state.recorders || {}).forEach(function (pid) { LT.Policy.register(state.recorders[pid]); });
  }

  /* What a watcher made happen after the copy was taken is part of what
   * happened: it is asked for again in the replay at the very minute it was
   * asked for in the town, through the same register. */
  function askedAgain(state, sim) {
    var at = sim.absMinute(), have = sim.state.interventions.length;
    state.sim.state.interventions.forEach(function (r, i) {
      if (i < have || r.scheduledAbs !== at) return;
      sim.scheduleIntervention({ type: r.type, params: JSON.parse(JSON.stringify(r.params)), source: r.source, atDay: r.atDay, atMinute: r.atMinute });
    });
  }
  function replayForward(state, sim, untilAbs) {
    if (sim.absMinute() >= untilAbs) { askedAgain(state, sim); return Promise.resolve(); }
    askedAgain(state, sim);
    return sim.runMinutes(1).then(function () { return replayForward(state, sim, untilAbs); });
  }

  O.backToNow = function (state) {
    if (!state.replay) return;
    var r = state.replay;
    state.replay = null;
    restoreRecorders(state);
    state.view = r.liveView;
    state.selected = r.liveSelected;
    state.speedIndex = r.resumeSpeed;
    state.accumulator = 0;
    buildCharacterTabs(state); buildSpeedButtons(state);
    showReplayBar(state);
  };

  function showReplayBar(state) {
    var bar = el('lt-replay');
    bar.hidden = !state.replay;
    if (state.replay) {
      var off = Object.keys(state.replay.players || {}).some(function (pid) { var p = state.replay.players[pid]; return p.mismatches.length || p.exhausted; });
      text(el('lt-replay-text'), 'Looking back at ' + state.replay.beat.stamp + ' — ' + state.replay.beat.text + ' The town itself is waiting at ' + state.sim.stamp() + '.' +
        (off ? ' This replay has stopped matching what was recorded, and from here it is not what happened.' : ''));
    }
    ['lt-save', 'lt-new-world', 'lt-resume', 'lt-hand-do'].forEach(function (id) { el(id).disabled = !!state.replay; });
    if (!state.replay) refreshButtons(state);
  }

  function paintTimeline(state) {
    var sim = state.sim, day = recapDayOf(state);        // always the live world's days
    var key = state.worlds + ':' + day + ':' + sim.state.events.length + ':' + state.snapshots.length + ':' + (state.replay ? state.replay.beat.seq : '-');
    var host = el('lt-timeline');
    if (host.__key === key) return;
    host.__key = key;
    var beats = LT.Story.beats(sim, day), blocked = O.replayBlockedBy(state);
    host.innerHTML = '<span class="lt-timeline-day">Day ' + day + '</span>' + beats.map(function (b, i) {
      var can = O.canReplay(state, b.absMinute), on = state.replay && state.replay.beat.seq === b.seq;
      return '<button class="lt-beat is-' + b.type.toLowerCase() + (on ? ' is-on' : '') + '" style="left:' + (b.minute / 1440 * 100).toFixed(2) + '%"' +
        (can ? '' : ' disabled') + ' data-i="' + i + '" title="' + escape(b.stamp + ' — ' + b.text + (can ? '' : blocked ? ' (cannot be looked back at: ' + blocked + ' would be asked again, and that would not be what happened)' : ' (too early to look back at)')) + '"></button>';
    }).join('') + (day === sim.state.day ? '<i class="lt-now" style="left:' + (sim.state.minute / 1440 * 100).toFixed(2) + '%"></i>' : '');
    Array.prototype.forEach.call(host.querySelectorAll('.lt-beat'), function (n) {
      n.addEventListener('click', function () { O.replay(state, beats[Number(n.dataset.i)]); });
    });
  }

  /* ---------------- this world: save, resume, new ---------------- */

  /* The page starts following another world. One loop, one view, one set of
   * panels: they all read state.sim, which is replaced here, so the world that
   * was on screen simply stops being advanced — nothing keeps ticking it. */
  O.adopt = function (state, sim) {
    if (state.replay) O.backToNow(state);
    state.retired = state.sim;
    state.sim = sim;
    state.snapshots = [];            // another world's past is not this one's
    state.recorders = {};
    O.recordRemote(state);
    state.view = LT.View.create(el('lt-canvas'), sim);
    state.accumulator = 0;
    state.worlds++;
    if (!sim.state.characters[state.selected]) state.selected = sim.actorIds()[0];
    buildCharacterTabs(state);
    buildHandFields(state);
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
    if (state.replay) return;          // while looking back they stay off, whatever else happens
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
        var sim = O.newWorld({ seed: (Date.now() % 2147483647) || 1 });
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

  /* ---------------- make something happen ---------------- */

  function options(select, list) {
    select.innerHTML = list.map(function (o) { return '<option value="' + escape(o.id) + '">' + escape(o.label) + '</option>'; }).join('');
  }

  /* The form is rebuilt for the world on screen: its people, its places. */
  function buildHandFields(state) {
    var entry = LT.Hand.entry(el('lt-hand-what').value);
    text(el('lt-hand-blurb'), entry.blurb);
    el('lt-hand-fields').innerHTML = entry.fields(state.sim).map(function (f) {
      return '<select data-key="' + escape(f.key) + '" aria-label="' + escape(f.label) + '">' +
        f.options.map(function (o) { return '<option value="' + escape(o.id) + '">' + escape(f.label + ': ' + o.label) + '</option>'; }).join('') + '</select>';
    }).join(' ');
  }

  function wireHand(state) {
    options(el('lt-hand-what'), LT.Hand.CATALOGUE);
    options(el('lt-hand-when'), LT.Hand.WHEN);
    buildHandFields(state);
    el('lt-hand-what').addEventListener('change', function () { buildHandFields(state); text(el('lt-hand-status'), ''); });
    el('lt-hand-do').addEventListener('click', function () {
      var answers = {};
      Array.prototype.forEach.call(el('lt-hand-fields').querySelectorAll('select'), function (n) { answers[n.dataset.key] = n.value; });
      /* Between two ticks, like a save: never while a minute is half applied. */
      var r = LT.Hand.make(state.sim, el('lt-hand-what').value, answers, el('lt-hand-when').value);
      var node = el('lt-hand-status');
      node.className = 'save-status is-' + (r.ok ? 'ok' : 'warn');
      text(node, r.ok ? 'Arranged for ' + LT.Util.stamp(r.record.atDay, r.record.atMinute) + '.' : 'Not done: ' + r.said + '.');
    });
  }

  function paintHand(state) {
    var rows = LT.Hand.asked(state.sim, 5);
    var html = rows.map(function (r) {
      return '<li class="is-' + r.status + '">' + escape(r.at) + ' — ' + escape(r.label) + ' · ' +
        escape(r.status === 'failed' ? 'could not happen: ' + r.said : r.status === 'applied' ? 'happened' : 'on its way') + '</li>';
    }).join('');
    var host = el('lt-hand-asked');
    if (host.__html !== html) { host.innerHTML = html; host.__html = html; }
  }

  /* With "The action" on, the page looks at whoever has the most going on.
   * It changes who is looked at and nothing else; choosing a name turns it off. */
  function followTheAction(state) {
    if (!state.followAction) return;
    var id = LT.Story.mostInteresting(shown(state), state.selected);
    if (id === state.selected) return;
    state.selected = id;
    state.view.focus(id);
    markTabs(state);
  }

  function markTabs(state) {
    Array.prototype.forEach.call(el('lt-characters').children, function (n) {
      n.classList.toggle('is-on', n.dataset.actor ? (!state.followAction && n.dataset.actor === state.selected) : state.followAction);
      if (n.dataset.actor) n.classList.toggle('is-watched', state.followAction && n.dataset.actor === state.selected);
    });
  }

  function buildCharacterTabs(state) {
    var host = el('lt-characters');
    host.innerHTML = '';
    shown(state).actorIds().forEach(function (id) {
      var c = shown(state).state.characters[id];
      var b = document.createElement('button');
      b.className = 'lt-tab';
      b.textContent = c.name;
      b.dataset.actor = id;
      b.addEventListener('click', function () {
        state.selected = id;
        state.followAction = false;
        state.view.focus(id);
        markTabs(state);
      });
      host.appendChild(b);
    });
    var auto = document.createElement('button');
    auto.className = 'lt-tab';
    auto.id = 'lt-follow-action';
    auto.textContent = 'The action';
    auto.addEventListener('click', function () { state.followAction = !state.followAction; markTabs(state); });
    host.appendChild(auto);
    markTabs(state);
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
        if (state.replay && s.msPerMinute && state.replay.sim.absMinute() >= state.replay.untilAbs) state.replay.untilAbs += REPLAY_TAIL;   // Play again: carry on a little
      });
      if (i === state.speedIndex) b.classList.add('is-on');
      host.appendChild(b);
    });
  }

  /* ---------------- panels ---------------- */

  function paint(state) {
    var sim = shown(state), s = sim.state;
    paintTimeline(state);
    if (state.replay) showReplayBar(state);
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

    var why = LT.Story.why(c.recentDecisions[0]);
    text(el('lt-caption-doing'), c.name + ' · ' + (act ? phaseLabel + act.label : (c.pending ? 'deciding what to do next' : 'between things')));
    text(el('lt-caption-why'), state.held && !state.replay ? 'The town is waiting for ' + state.held.source + ' to decide for ' + state.held.name + '.' : (why ? why.line : ''));
    var line = LT.Story.lastLine(sim, c);
    text(el('lt-caption-said'), line ? line.name + ': “' + line.text + '”  — ' + line.source : '');
    paintBonds(sim, c);
    paintStakes(sim, c);
    paintHand(state);
    paintRecap(state);
    paintGoals(c);
    paintCommitments(sim, c);
    paintEvents(sim, c);
    paintDecision(c);
    if (state.inspector) paintInspector(state, c);
  }

  function paintBonds(sim, c) {
    var rows = LT.Story.bonds(sim, c);
    var html = rows.length ? rows.map(function (r) {
      return '<div class="lt-bond"><span>' + escape(r.name) + '</span><span class="lt-meter"><i style="width:' + r.closeness.toFixed(0) + '%"></i></span>' +
        '<small>' + escape(r.word + ' · trust ' + Math.round(r.trust) + ' · last seen ' + r.seen) + '</small></div>';
    }).join('') : '<p class="note">Nobody yet.</p>';
    var host = el('lt-bonds');
    if (host.__html !== html) { host.innerHTML = html; host.__html = html; }
  }

  function paintStakes(sim, c) {
    var rows = LT.Story.stakes(sim, c);
    var html = rows.length ? rows.map(function (r) {
      return '<div class="lt-stake is-' + r.status + '"><i></i><span>' + escape(r.label) + '</span><small>' + escape(r.line) + '</small></div>';
    }).join('') : '<p class="note">Nothing pressing.</p>';
    var host = el('lt-stakes');
    if (host.__html !== html) { host.innerHTML = html; host.__html = html; }
  }

  /* The day shown is the last finished one, or today while the first is still
   * running; Earlier and Later pin another. */
  function recapDayOf(state) {
    var today = state.sim.state.day;
    if (state.recapDay !== null) return Math.max(1, Math.min(today, state.recapDay));
    return Math.max(1, today - 1);
  }
  function stepRecap(state, by) {
    var today = state.sim.state.day;
    var next = Math.max(1, Math.min(today, recapDayOf(state) + by));
    state.recapDay = (next === Math.max(1, today - 1)) ? null : next;
  }
  function paintRecap(state) {
    var sim = state.sim, day = recapDayOf(state);
    var key = state.worlds + ':' + day + ':' + sim.state.events.length + ':' + sim.state.day;
    var host = el('lt-recap');
    if (host.__key === key) return;
    host.__key = key;
    var r = LT.Story.recap(sim, day);
    text(el('lt-recap-title'), 'Day ' + day + (r.complete ? ', looked back on' : ', so far'));
    host.innerHTML = r.people.map(function (p) {
      return '<div class="lt-recap-person"><b>' + escape(p.name) + '</b>' + escape(p.facts.join('; ')) + '.' +
        (p.told.length ? '<ul>' + p.told.map(function (t) { return '<li>' + escape(t.stamp.replace(/^D\d+ /, '')) + ' — ' + escape(t.text) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
    }).join('') + (r.town.length ? '<div class="lt-recap-person"><b>In town</b><ul>' + r.town.map(function (t) {
      return '<li>' + escape(t.stamp.replace(/^D\d+ /, '')) + ' — ' + escape(t.text) + '</li>'; }).join('') + '</ul></div>' : '');
    el('lt-recap-prev').disabled = day <= 1;
    el('lt-recap-next').disabled = day >= sim.state.day;
  }

  function paintGoals(c) {
    var host = el('lt-goals');
    host.innerHTML = '';
    (c.goals || []).forEach(function (g) {
      var row = document.createElement('div');
      row.className = 'lt-goal' + (g.reached ? ' is-done' : g.missed ? ' is-missed' : '');
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
    var why = LT.Story.why(d);
    text(el('lt-decision-why'), why ? why.line : '');
  }

  /* ---------------- developer inspector ---------------- */

  function paintInspector(state, c) {
    var sim = shown(state);
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
  /* Safe in element content and inside a quoted attribute alike: some of this
   * text is a provider's own words. */
  function escape(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
})();
