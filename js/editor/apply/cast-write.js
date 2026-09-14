// js/editor/apply/cast-write.js — WORLD BUILDER M7 (node-only): what a cast placement change does to the V5 pins,
// the V6 transitions and the audit record, computed BEFORE tools/world-apply.js writes anything.
//
//   planPins(ctx)         every pin of test/fixtures/cast-pins-acts-1-4.json resolved against the NEW cast data;
//                         a disagreement is repinnable only when the character is one the changeset moved, the
//                         pin used a map form ("map@x,y" or "map") and the body is still PLACED; the new value
//                         keeps the pin's form. Anything else is an unrelated failure: never repinned.
//   planTransitions(ctx)  every V6 record of test/fixtures/cast-transitions-acts-1-4.json against the new data; a
//                         disagreement always fails the run (transitions are never repinned).
//   repinText(text, repins)  rewrites exactly those (pin, character) entries; any other changed line fails.
//   pinLines(text)        "<pin id>/<character>" -> 1-based line number in the fixture, for the printed pin lines.
//   auditAppend(text, lines)  appends under "## Builder change record" (created at the end of the file if absent).
//
// Resolution goes through GAME.CastPresence with opts.data, the same resolver and the same `when` evaluator the
// game and test/cast-continuity-validate.js use; ctx.stateFromSeed builds the state exactly as the validator does.

'use strict';

function fail(msg) { throw new Error('[cast-write] ' + msg); }

/* expect grammar (test/cast-continuity-validate.js matches()): "map@x,y" | "map" | "OFFSCREEN" | "OFFSCREEN:label" | "TERMINAL_REMOVED" */
function matches(result, expect) {
  if (!result) return false;
  if (expect === 'TERMINAL_REMOVED') return result.status === 'TERMINAL_REMOVED';
  if (expect === 'OFFSCREEN') return result.status === 'OFFSCREEN';
  if (expect.indexOf('OFFSCREEN:') === 0) return result.status === 'OFFSCREEN' && result.label === expect.slice('OFFSCREEN:'.length);
  if (expect.indexOf('@') !== -1) {
    const at = expect.indexOf('@');
    const xy = expect.slice(at + 1).split(',');
    return result.status === 'PLACED' && result.sceneId === expect.slice(0, at) && result.x === Number(xy[0]) && result.y === Number(xy[1]);
  }
  return result.status === 'PLACED' && result.sceneId === expect;
}

function describe(r) {
  if (!r) return '<no result>';
  if (r.status === 'PLACED') return r.sceneId + '@' + r.x + ',' + r.y + ' ' + r.dir + ' [' + r.source + ']';
  if (r.status === 'OFFSCREEN') return 'OFFSCREEN' + (r.label ? ':' + r.label : '') + ' [' + r.source + ']';
  return 'TERMINAL_REMOVED [' + r.source + ']';
}

function resolveAll(ctx, seed) {
  return ctx.cp.resolveCast(ctx.stateFromSeed(seed), { data: ctx.data });
}

// ctx = { cp, data, stateFromSeed, pins, moved: {character: true} }
function planPins(ctx) {
  const repins = [], unrelated = [];
  ctx.pins.pins.forEach(function (pin) {
    const seed = ctx.pins.seeds[pin.seed];
    if (!seed) { unrelated.push({ pin: pin.id, character: '*', expected: '*', got: 'no seed ' + pin.seed }); return; }
    let all;
    try { all = resolveAll(ctx, seed); }
    catch (e) { unrelated.push({ pin: pin.id, character: '*', expected: '*', got: 'THROW ' + (e.code || e.message) }); return; }
    Object.keys(pin.expect).forEach(function (c) {
      const expect = pin.expect[c], r = all[c];
      if (matches(r, expect)) return;
      const mapForm = expect.indexOf('@') !== -1 || !/^(OFFSCREEN|TERMINAL_REMOVED)/.test(expect);
      if (ctx.moved[c] && mapForm && r && r.status === 'PLACED') {
        const next = expect.indexOf('@') !== -1 ? r.sceneId + '@' + r.x + ',' + r.y : r.sceneId;
        repins.push({ pin: pin.id, character: c, expected: expect, next: next, got: describe(r) });
      } else {
        unrelated.push({ pin: pin.id, character: c, expected: expect, got: describe(r) });
      }
    });
  });
  return { repins: repins, unrelated: unrelated };
}

// ctx = { cp, data, stateFromSeed, pins, transitions }
function planTransitions(ctx) {
  const out = [];
  ctx.transitions.transitions.forEach(function (rec) {
    ['before', 'after'].forEach(function (side) {
      const expect = side === 'before' ? rec.from : rec.to;
      const seed = ctx.pins.seeds[rec[side]];
      let r;
      try { r = seed ? resolveAll(ctx, seed)[rec.character] : null; }
      catch (e) { out.push({ id: rec.id, character: rec.character, side: side, expected: expect, got: 'THROW ' + (e.code || e.message) }); return; }
      if (!matches(r, expect)) out.push({ id: rec.id, character: rec.character, side: side, seed: rec[side], expected: expect, got: describe(r) });
    });
  });
  return out;
}

// occupancy(ctx, changes) -> errors: on every pin seed where a moved body resolves through the edited source, no
// other PLACED body may stand on its tile.
function occupancy(ctx, changes) {
  const errs = [];
  const seen = {};
  ctx.pins.pins.forEach(function (pin) {
    const all = resolveAll(ctx, ctx.pins.seeds[pin.seed]);
    changes.forEach(function (ch) {
      const r = all[ch.character];
      const source = ch.window === 'baseline' ? 'BASELINE' : ch.window;
      if (!r || r.status !== 'PLACED' || r.source !== source) return;
      Object.keys(all).forEach(function (other) {
        const o = all[other];
        if (other === ch.character || o.status !== 'PLACED' || o.sceneId !== r.sceneId || o.x !== r.x || o.y !== r.y) return;
        const msg = ch.character + ' (' + ch.window + ') on ' + r.sceneId + ' ' + r.x + ',' + r.y + ' is occupied by ' + other + ' [' + o.source + ']';
        if (!seen[msg]) { seen[msg] = true; errs.push(msg + ' at story moment ' + pin.id); }
      });
    });
  });
  return errs;
}

// pinLines(text) -> { "<pin>/<character>": line } for every expect entry, verified against the parsed fixture.
function pinLines(text) {
  const parsed = JSON.parse(text);
  const lines = text.split('\n');
  const out = {};
  let inPins = false, pin = null, inExpect = false;
  lines.forEach(function (l, i) {
    if (/^ "pins": \[/.test(l)) { inPins = true; return; }
    if (!inPins) return;
    let m = /^\s*"id": "([^"]+)",?$/.exec(l);
    if (m && !inExpect) { pin = m[1]; return; }
    if (/^\s*"expect": \{$/.test(l)) { inExpect = true; return; }
    if (inExpect && /^\s*\},?$/.test(l)) { inExpect = false; return; }
    m = /^\s*"([^"]+)": "([^"]*)",?$/.exec(l);
    if (inExpect && m && pin) out[pin + '/' + m[1]] = { line: i + 1, text: l };
  });
  parsed.pins.forEach(function (p) {
    Object.keys(p.expect).forEach(function (c) {
      const hit = out[p.id + '/' + c];
      if (!hit || hit.text.indexOf('"' + c + '": ' + JSON.stringify(p.expect[c])) === -1) fail('cannot locate pin line for ' + p.id + '/' + c + ' in the pins fixture');
    });
  });
  return out;
}

function repinText(text, repins) {
  const parsed = JSON.parse(text);
  repins.forEach(function (r) {
    const pin = parsed.pins.find(function (p) { return p.id === r.pin; });
    if (!pin || pin.expect[r.character] !== r.expected) fail('pin ' + r.pin + '/' + r.character + ' is not ' + JSON.stringify(r.expected) + ' in the fixture');
    pin.expect[r.character] = r.next;
  });
  const next = JSON.stringify(parsed, null, 1);
  if (JSON.stringify(JSON.parse(text), null, 1) !== text) fail('pins fixture is not in canonical 1-space JSON; refusing to rewrite it');
  const want = {};
  const lines = pinLines(text);
  repins.forEach(function (r) { want[lines[r.pin + '/' + r.character].line] = true; });
  const A = text.split('\n'), B = next.split('\n');
  if (A.length !== B.length) fail('repin changed the line count of the pins fixture');
  A.forEach(function (l, i) {
    if (l !== B[i] && !want[i + 1]) fail('repin would change line ' + (i + 1) + ' of the pins fixture, which is not a repinned entry');
  });
  return next;
}

const AUDIT_HEADING = '## Builder change record';

function auditAppend(text, lines) {
  let out = text;
  if (out.split('\n').indexOf(AUDIT_HEADING) === -1) {
    out = out.replace(/\n*$/, '\n') + '\n' + AUDIT_HEADING + '\n\n' +
      'Placement moves applied by tools/world-apply.js --repin (date · window (owner) · character · before → after · repinned pins · changeset).\n\n';
  } else {
    out = out.replace(/\n*$/, '\n');
  }
  return out + lines.map(function (l) { return l + '\n'; }).join('');
}

function place(p) { return p.map_id + '@' + p.x + ',' + p.y + ' ' + p.dir; }

function auditLine(date, change, repins, changesetName) {
  const pins = repins.filter(function (r) { return r.character === change.character; }).map(function (r) { return r.pin; });
  return '- ' + date + ' · window ' + change.window + (change.owner ? ' (' + change.owner + ')' : '') + ' · ' + change.character + ' · ' +
    place(change.before) + ' → ' + place(change.after) + ' · pins ' + (pins.length ? pins.join(', ') : 'none') + ' · changeset ' + changesetName;
}

module.exports = { matches, describe, planPins, planTransitions, occupancy, pinLines, repinText, auditAppend, auditLine, AUDIT_HEADING };
