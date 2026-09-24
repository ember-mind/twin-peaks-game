/* lt-bubbles.js — Living Town: what someone is deciding, over their head.
 *
 * A projection of what the simulation already records, never a second story:
 *   - a person waiting for their mind to answer shows a thinking bubble ("…"),
 *     and, when the question is one that changes the story (a fork), the
 *     options on offer with a question mark;
 *   - a decision that changes what they do shows as a fork for a moment: the
 *     two best different things, then the one taken, with the chance the mind
 *     gave it when it gave one (Jev answers with probabilities);
 *   - otherwise a small sign of what they are doing (a cup, a book, a bed).
 * Choices that change nothing ("wait a little longer") show nothing.
 *
 * Everything shown is read from a person's decision record, their pending
 * question and their activity. The only state here is when a bubble started,
 * which is a matter of the picture, like a sprite's walk phase.
 *
 *   LT.Bubbles.optionsOf(sim, decision) -> [{ id, label, chosen, chance }]
 *   LT.Bubbles.meaningful(decision, before) -> bool
 *   LT.Bubbles.draw(g, kind, x, y, content, t)   kind 'think' | 'fork' | 'sign'
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  var B = LT.Bubbles = LT.Bubbles || {};

  B.FORK_MS = 2600;         // how long a decision stays over someone's head
  B.REVEAL_MS = 900;        // the options alone, before the one taken lights up
  B.THINK_AFTER_MS = 500;   // a question answered sooner than this is not shown as thinking

  /* Questions that change the story: to speak or not, to accept or refuse,
   * to keep or give back, to plan the next hour. */
  B.FORK_ACTIONS = { talk_with: 1, join_conversation: 1, decline_conversation: 1, invite_to_meal: 1, accept_meal: 1, decline_meal: 1,
    return_wallet: 1, keep_wallet_money: 1, pick_up_wallet: 1, help_out: 1, keep_talking: 1, wind_down: 1, plan_hour: 1,
    accept_offer: 1, decline_offer: 1 };
  /* Nothing to show: carrying on as before is not a decision anyone watches. */
  var QUIET = { wait: 1, keep_talking: 1 };

  function nameOf(sim, id) { var c = sim && sim.state.characters[id]; return c ? c.name : null; }

  /* A few words for one option, from its action and target. */
  B.short = function (sim, actionId, targetId) {
    var W = LT.World, obj = sim && targetId && sim.objectById && sim.objectById(targetId);
    switch (actionId) {
      case 'travel': {
        var loc = W && W.LOCATIONS[targetId];
        if (!loc) return 'go';
        if (targetId === 'cafe') return 'café';
        if (targetId === 'park') return 'park';
        var own = sim && sim.state.characters && Object.keys(sim.state.characters).some(function (k) { return sim.state.characters[k].homeId === targetId; });
        return own ? 'home' : 'go';
      }
      case 'talk_with': case 'greet': return nameOf(sim, targetId) || 'talk';
      case 'join_conversation': return 'talk';
      case 'decline_conversation': return 'not now';
      case 'invite_to_meal': return 'dinner?';
      case 'accept_meal': return 'yes, eat';
      case 'decline_meal': return 'no thanks';
      case 'work_shift': case 'work_extra_shift': return 'work';
      case 'accept_offer': return 'take shift';
      case 'decline_offer': return 'no shift';
      case 'buy_meal': return 'eat';
      case 'eat_at_home': return 'cook';
      case 'eat_here': return 'eat';
      case 'sleep': return 'sleep';
      case 'wash_and_dress': return 'dress';
      case 'practise_guitar': return 'guitar';
      case 'read_book': return 'read';
      case 'sit_and_rest': case 'take_break': return 'rest';
      case 'unpack_food_parcel': return 'parcel';
      case 'pick_up_wallet': return 'pick up';
      case 'return_wallet': return 'give back';
      case 'keep_wallet_money': return 'keep it';
      case 'withdraw_savings': return 'cash';
      case 'wind_down': return 'goodbye';
      case 'keep_talking': return 'go on';
      case 'plan_hour': return (obj && obj.name) || B.intentionWord(targetId);
      case 'wait': return 'wait';
      default: return actionId.replace(/_/g, ' ');
    }
  };

  B.intentionWord = function (id) {
    var I = LT.Intentions && LT.Intentions.byId && LT.Intentions.byId(id);
    return I ? I.word : String(id || '').replace(/^intent_/, '');
  };

  function parts(candidateId) {
    var i = candidateId.indexOf(':');
    return i < 0 ? { actionId: candidateId, targetId: null } : { actionId: candidateId.slice(0, i), targetId: candidateId.slice(i + 1) };
  }

  /* The chosen option and the best different thing to do, from what the mind
   * gave: Jev's probabilities, or the offline policy's scores. */
  B.optionsOf = function (sim, decision) {
    if (!decision) return [];
    var d = decision.diagnostics || {}, chosen = parts(decision.selectedId), list = [];
    if (d.probabilities) {
      Object.keys(d.probabilities).forEach(function (id) { var p = parts(id); list.push({ id: id, actionId: p.actionId, targetId: p.targetId, weight: d.probabilities[id], chance: d.probabilities[id] }); });
    } else if (d.factors) {
      d.factors.forEach(function (f) { list.push({ id: f.candidateId, actionId: f.actionId, targetId: f.targetId, weight: f.score, chance: null }); });
    }
    var mine = null, second = null;
    list.forEach(function (o) { if (o.id === decision.selectedId) mine = o; });
    if (!mine) mine = { id: decision.selectedId, actionId: chosen.actionId, targetId: chosen.targetId, weight: 0, chance: null };
    var mineLabel = B.short(sim, mine.actionId, mine.targetId);
    list.forEach(function (o) {
      if (o === mine || (o.actionId === mine.actionId && o.targetId === mine.targetId)) return;
      if (B.short(sim, o.actionId, o.targetId) === mineLabel) return;   // "work / work" says nothing
      if (QUIET[o.actionId] && o.actionId !== 'wait') return;
      if (!second || o.weight > second.weight) second = o;
    });
    var out = [{ id: mine.id, label: B.short(sim, mine.actionId, mine.targetId), chosen: true, chance: mine.chance }];
    if (second) out.push({ id: second.id, label: B.short(sim, second.actionId, second.targetId), chosen: false, chance: second.chance });
    return out;
  };

  /* A decision worth showing: it starts something other than what was going on. */
  B.meaningful = function (decision, before) {
    if (!decision) return false;
    var p = parts(decision.selectedId);
    if (QUIET[p.actionId]) return false;
    if (before && before.selectedId === decision.selectedId) return false;
    return true;
  };

  /* While a question is out: the options that change the story, if it is
   * one of those; otherwise nothing but the thinking. */
  B.pendingOptions = function (sim, request) {
    if (!request) return [];
    var forks = (request.candidates || []).filter(function (c) { return B.FORK_ACTIONS[c.actionId]; });
    if (!forks.length) return [];
    var seen = {}, out = [];
    forks.forEach(function (c) { var l = B.short(sim, c.actionId, c.targetId); if (!seen[l] && out.length < 3) { seen[l] = 1; out.push(l); } });
    return out;
  };

  /* ---------------- signs: what someone is doing, as a picture ---------------- */

  var SIGNS = {
    work:  ['.....', '.###.', '#...#', '#####', '#.#.#', '#####', '.....'],
    eat:   ['.....', '#.#.#', '#####', '#####', '.###.', '..#..', '.###.'],
    sleep: ['#####', '...#.', '..#..', '.#...', '#####', '.....', '.....'],
    read:  ['.....', '##.##', '#.#.#', '#.#.#', '#.#.#', '##.##', '.....'],
    talk:  ['.....', '#####', '#...#', '#.#.#', '#####', '.#...', '.....'],
    rest:  ['.....', '.....', '#####', '#...#', '#####', '#...#', '.....'],
    music: ['..##.', '..#.#', '..#..', '..#..', '###..', '###..', '.....'],
    plan:  ['.###.', '#...#', '...#.', '..#..', '..#..', '.....', '..#..'],
    parcel:['.....', '#####', '#.#.#', '#####', '#.#.#', '#####', '.....'],
    coin:  ['.###.', '#.#.#', '#.#..', '.###.', '..#.#', '#.#.#', '.###.']
  };
  var SIGN_OF = { work_shift: 'work', work_extra_shift: 'work', buy_meal: 'eat', eat_at_home: 'eat', eat_here: 'eat', sleep: 'sleep',
    read_book: 'read', talk_with: 'talk', join_conversation: 'talk', greet: 'talk', invite_to_meal: 'talk', sit_and_rest: 'rest', take_break: 'rest',
    practise_guitar: 'music', unpack_food_parcel: 'parcel', pick_up_wallet: 'coin', return_wallet: 'coin', keep_wallet_money: 'coin', plan_hour: 'plan' };
  B.signOf = function (actionId) { return SIGN_OF[actionId] || null; };

  /* ---------------- drawing ---------------- */

  var INK = '#1d1b20', PAPER = '#fbf6e6', DIM = '#9a9486', GOLD = '#b8791f';

  function textW(t) { var F = root.GAME && root.GAME.RetroFont; return F ? F.measure(t, 1) : t.length * 6; }
  function text(g, t, x, y, colour) {
    var F = root.GAME && root.GAME.RetroFont;
    if (F) F.draw(g, t, x, y, colour, { scale: 1 });
    else { g.fillStyle = colour; g.font = '7px monospace'; g.fillText(t, x, y + 7); }
  }

  /* A speech-bubble box with its tail at (x, y): the point over the head. */
  function box(g, x, y, w, h) {
    var x0 = Math.round(x - w / 2), y0 = Math.round(y - h - 3);
    /* Inside the picture: at its edges the box slides in and the tail stays over the head. */
    var t = g.getTransform ? g.getTransform() : null, sw = g.canvas ? Math.round(g.canvas.width / (t && t.a ? t.a : 1)) : 256;
    x0 = Math.max(1, Math.min(sw - w - 1, x0)); y0 = Math.max(1, y0);
    g.fillStyle = INK;
    g.fillRect(x0 + 1, y0, w - 2, h); g.fillRect(x0, y0 + 1, w, h - 2);
    g.fillStyle = PAPER;
    g.fillRect(x0 + 1, y0 + 1, w - 2, h - 2);
    /* tail */
    g.fillStyle = INK; g.fillRect(Math.round(x) - 1, y0 + h, 3, 1); g.fillRect(Math.round(x), y0 + h + 1, 1, 2);
    g.fillStyle = PAPER; g.fillRect(Math.round(x), y0 + h - 1, 1, 1);
    return { x: x0, y: y0 };
  }

  function drawSign(g, name, x, y) {
    var bm = SIGNS[name];
    if (!bm) return;
    var b = box(g, x, y, 9, 11);
    g.fillStyle = INK;
    for (var r = 0; r < 7; r++) for (var c = 0; c < 5; c++) if (bm[r].charAt(c) === '#') g.fillRect(b.x + 2 + c, b.y + 2 + r, 1, 1);
  }

  function drawThink(g, x, y, t, options) {
    var dots = 1 + Math.floor((t / 350) % 3), label = options && options.length ? options.join(' / ') + ' ?' : '';
    var w = Math.max(15, label ? textW(label) + 8 : 15);
    var b = box(g, x, y, w, 11);
    if (label) { text(g, label, b.x + 4, b.y + 2, INK); return; }
    g.fillStyle = INK;
    for (var i = 0; i < dots; i++) g.fillRect(b.x + 4 + i * 3, b.y + 7, 2, 2);
  }

  function drawFork(g, x, y, t, opts) {
    var reveal = t >= B.REVEAL_MS, a = opts[0], o = opts[1];
    var la = a.label + (reveal && a.chance != null ? ' ' + Math.round(a.chance * 100) + '%' : '');
    var lb = o ? o.label : '';
    var sep = o ? ' / ' : '';
    var w = textW(la) + (o ? textW(sep) + textW(lb) : 0) + 8 + (reveal ? 0 : textW(' ?'));
    var b = box(g, x, y, w, 11), cx = b.x + 4;
    if (!reveal) {
      text(g, la, cx, b.y + 2, INK); cx += textW(la);
      if (o) { text(g, sep, cx, b.y + 2, INK); cx += textW(sep); text(g, lb, cx, b.y + 2, INK); cx += textW(lb); }
      text(g, ' ?', cx, b.y + 2, GOLD);
      return;
    }
    text(g, la, cx, b.y + 2, INK);
    g.fillStyle = GOLD; g.fillRect(cx, b.y + 9, textW(la) - 1, 1);
    cx += textW(la);
    if (o) {
      cx += textW(sep);
      text(g, lb, cx, b.y + 2, DIM);
      g.fillStyle = DIM; g.fillRect(cx, b.y + 5, textW(lb) - 1, 1);
    }
  }

  B.draw = function (g, kind, x, y, content, t) {
    if (kind === 'sign') return drawSign(g, content, x, y);
    if (kind === 'think') return drawThink(g, x, y, t || 0, content);
    if (kind === 'fork' && content && content.length) return drawFork(g, x, y, t || 0, content);
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})();
