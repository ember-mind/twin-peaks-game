/* lt-live-client.js — Living Town: the page, when the town lives elsewhere.
 *
 * Served by the town server, the page carries a marker (a meta tag) naming
 * the door. Then nothing on it decides or advances anything: it joins with a
 * name, receives the town as a save, mirrors it (js/lt-live.js) frame by
 * frame, and shows it. Speed, save, resume and new world are not offered; a
 * spectator's hand goes to the server and is paid for from a purse; who they
 * follow is told to the server, so others can see who cares about whom.
 *
 * A mirror that stops matching the town says so on the page and starts
 * again from a fresh save. It never shows a town of its own.
 */
(function () {
  var root = window;
  var LT = root.LT;
  var C = LT.LiveClient = {};

  function el(id) { return document.getElementById(id); }
  function text(node, value) { if (node && node.textContent !== value) node.textContent = value; }
  function escape(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* The door, if the page was served by a town server; null on static hosting. */
  C.detect = function () {
    var m = document.querySelector('meta[name="lt-live"]');
    return m && m.getAttribute('content') ? m.getAttribute('content') : null;
  };

  function post(api, p, body) {
    return fetch(api + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}), credentials: 'same-origin' })
      .then(function (r) { return r.json().then(function (j) { j.httpStatus = r.status; return j; }); })
      .catch(function (e) { return { ok: false, error: 'network', said: 'the town could not be reached (' + (e && e.message) + ')' }; });
  }

  C.start = function (state, api) {
    var live = state.live = { api: api, mirror: null, you: null, presence: null, costs: {}, purseMax: 5, status: 'checking', note: '', es: null, resyncs: 0, frames: 0, paused: false, sinceFrame: 0 };
    el('lt-live').hidden = false;
    /* Nobody speeds up, saves or replaces a town that is not theirs. */
    Array.prototype.forEach.call(document.querySelectorAll('.controls'), function (n) {
      if (n.classList.contains('world')) n.hidden = true;
      var speeds = n.querySelector('#lt-speeds');
      if (speeds) speeds.parentNode.hidden = true;
    });
    el('lt-live-join').addEventListener('click', function () { join(state); });
    el('lt-live-name').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') join(state); });
    fetch(api + '/me', { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (me) {
      if (me && me.ok) { live.you = me.you; connect(state); }
      else { live.status = 'join'; paint(state); el('lt-live-name').focus(); }
    }, function () { live.status = 'unreachable'; paint(state); });
    setInterval(function () { paint(state); }, 500);
    return live;
  };

  function join(state) {
    var live = state.live, name = el('lt-live-name').value;
    live.note = '';
    post(live.api, '/join', { name: name }).then(function (r) {
      if (!r.ok) { live.note = r.error === 'name_required' ? 'A name, please.' : r.error === 'name_too_long' ? 'A shorter name, please.' : (r.said || r.error); paint(state); return; }
      live.you = r.you;
      connect(state);
    });
  }

  function connect(state) {
    var live = state.live;
    if (live.es) { try { live.es.close(); } catch (e) { /* gone */ } }
    live.status = 'connecting';
    paint(state);
    var es = live.es = new EventSource(live.api + '/stream');
    es.addEventListener('hello', function (ev) {
      var data = JSON.parse(ev.data);
      var mirror;
      try { mirror = LT.Live.mirror(data.save); }
      catch (e) { live.status = 'refused'; live.note = 'This build cannot show the town: ' + (e && e.message); es.close(); paint(state); return; }
      mirror.attributions = data.attributions || {};
      live.mirror = mirror;
      live.you = data.you || live.you;
      live.costs = data.costs || {};
      live.purseMax = data.purseMax || 5;
      live.presence = data.presence;
      live.paused = !!data.paused;
      live.msPerMinute = data.msPerMinute;
      live.dev = !!data.dev;
      live.status = 'live';
      devControls(state);
      live.sinceFrame = performance.now();
      LT.Observer.adopt(state, mirror.sim);
      if (live.you && live.you.adopted && mirror.sim.state.characters[live.you.adopted]) {
        state.selected = live.you.adopted; state.followAction = false; state.view.focus(state.selected);
      }
      LT.Observer.refresh(state);
      paint(state);
    });
    es.addEventListener('frame', function (ev) {
      if (!live.mirror) return;
      var frame = JSON.parse(ev.data);
      var r = live.mirror.apply(frame);
      live.sinceFrame = performance.now();
      if (!r.ok) {
        live.resyncs++;
        live.note = 'The picture stopped matching the town (' + r.reason + '); starting again from a fresh copy.';
        live.status = 'resync';
        es.close();
        setTimeout(function () { connect(state); }, 400);
        return;
      }
      if (!r.skipped) { live.frames++; state.view.observe(); }
    });
    es.addEventListener('you', function (ev) { live.you = JSON.parse(ev.data); paint(state); });
    es.addEventListener('presence', function (ev) { live.presence = JSON.parse(ev.data); paint(state); });
    es.addEventListener('clock', function (ev) {
      var c = JSON.parse(ev.data);
      live.paused = !!c.paused;
      if (c.msPerMinute) live.msPerMinute = c.msPerMinute;
      paint(state);
    });
    es.onerror = function () {
      /* EventSource reconnects by itself and the server greets again with a
       * fresh save, which replaces the mirror. Until then, say so. */
      if (live.status === 'live') { live.status = 'reconnecting'; paint(state); }
    };
  }

  /* A developer's own town (server started with --dev) can be paced from the
   * page. The buttons are not built otherwise. */
  var DEV_SPEEDS = [{ label: 'Pause', speed: 0 }, { label: '1x', speed: 1 }, { label: '6x', speed: 6 }, { label: '60x', speed: 60 }, { label: '600x', speed: 600 }];
  function devControls(state) {
    var live = state.live, host = el('lt-live-dev');
    host.hidden = !live.dev;
    if (!live.dev || host.children.length) return;
    DEV_SPEEDS.forEach(function (s) {
      var b = document.createElement('button');
      b.className = 'lt-tab'; b.textContent = s.label; b.dataset.speed = s.speed;
      b.addEventListener('click', function () { post(live.api, '/dev/speed', { speed: s.speed }).then(function () { paint(state); }); });
      host.appendChild(b);
    });
    var step = document.createElement('button');
    step.className = 'lt-tab'; step.textContent = 'One minute'; step.id = 'lt-live-step';
    step.addEventListener('click', function () { post(live.api, '/dev/step', {}); });
    host.appendChild(step);
  }

  /* The hand, over the wire. Resolves to what the server said. */
  C.hand = function (state, id, answers, when) {
    var live = state.live;
    return post(live.api, '/hand', { id: id, answers: answers, when: when }).then(function (r) {
      if (r.purse !== undefined && live.you) live.you.purse = r.purse;
      paint(state);
      return r;
    });
  };

  C.adopt = function (state, actorId) {
    var live = state.live;
    if (!live.you) return Promise.resolve({ ok: false });
    return post(live.api, '/adopt', { actorId: actorId }).then(function (r) { if (r.ok) live.you = r.you; paint(state); return r; });
  };

  C.costOf = function (state, entryId) {
    var c = state.live && state.live.costs;
    return c && Object.prototype.hasOwnProperty.call(c, entryId) ? c[entryId] : 2;
  };
  C.attributedTo = function (state, interventionId) {
    var m = state.live && state.live.mirror;
    return (m && m.attributions[interventionId]) || '';
  };

  function purseDots(you, max) {
    var s = '';
    for (var i = 0; i < max; i++) s += i < (you ? you.purse : 0) ? '●' : '○';
    return s;
  }

  function paint(state) {
    var live = state.live;
    var joinRow = el('lt-live-join-row'), status = el('lt-live-status');
    joinRow.hidden = live.status !== 'join';
    el('lt-live-note').textContent = live.note || '';
    var line;
    if (live.status === 'join') line = 'This town is live. Give a name to watch it.';
    else if (live.status === 'checking' || live.status === 'connecting') line = 'Reaching the town…';
    else if (live.status === 'reconnecting') line = 'Lost the town for a moment; reconnecting…';
    else if (live.status === 'resync') line = 'Starting again from a fresh copy…';
    else if (live.status === 'unreachable') line = 'The town cannot be reached.';
    else if (live.status === 'refused') line = 'The town could not be shown.';
    else {
      var watching = live.presence ? live.presence.watching : 1;
      var quiet = live.sinceFrame && (performance.now() - live.sinceFrame) > (live.msPerMinute || 10000) * 3;
      line = (live.paused ? 'Paused by the town' : quiet ? 'Waiting for the town' : 'Live') + ' · ' + watching + ' watching' +
        (live.dev ? ' · dev, a minute every ' + (live.paused ? '—' : (Math.round(live.msPerMinute / 100) / 10) + ' s') : '');
    }
    text(status, line);
    if (live.dev) Array.prototype.forEach.call(el('lt-live-dev').children, function (b) {
      if (b.dataset.speed === undefined) return;
      var on = live.paused ? b.dataset.speed === '0' : Math.abs(60000 / Number(b.dataset.speed) - live.msPerMinute) < 1;
      b.classList.toggle('is-on', on);
    });
    var youNode = el('lt-live-you');
    if (live.you && live.status === 'live') {
      var who = live.you.adopted && state.sim.state.characters[live.you.adopted];
      youNode.innerHTML = '<b>' + escape(live.you.name) + '</b> · purse <span class="lt-purse" title="' + live.you.purse + ' of ' + live.purseMax + '">' + purseDots(live.you, live.purseMax) + '</span>' +
        (who ? ' · following <b>' + escape(who.name) + '</b>' : ' · <i>choose someone to follow</i>');
    } else youNode.innerHTML = '';
    var others = el('lt-live-people');
    if (live.presence && live.status === 'live') {
      var byActor = {};
      live.presence.people.forEach(function (p) { if (p.adopted) (byActor[p.adopted] = byActor[p.adopted] || []).push(p.name); });
      Array.prototype.forEach.call(el('lt-characters').children, function (n) {
        if (!n.dataset.actor) return;
        var names = byActor[n.dataset.actor] || [];
        n.title = names.length ? 'followed by ' + names.join(', ') : '';
        var badge = n.querySelector('.lt-followers');
        if (names.length && !badge) { badge = document.createElement('small'); badge.className = 'lt-followers'; n.appendChild(badge); }
        if (badge) { if (!names.length) badge.remove(); else text(badge, ' ' + names.length); }
      });
      var here = live.presence.people.map(function (p) { return p.name; });
      text(others, here.length ? 'Here: ' + here.join(', ') : '');
    } else text(others, '');
  }
  C.paint = paint;
})();
