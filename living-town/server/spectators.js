/* spectators.js — Living Town server: the people watching.
 *
 * A spectator is a random token and a display name, nothing else. Tokens
 * recharge a purse that is kept per address, not per token, so opening ten
 * tabs opens one purse. The purse starts full — the first thing someone
 * does should not be to wait — and refills one token every so many real
 * minutes of presence, up to its cap. Each entry of the hand has a price.
 *
 * Nothing here touches the town. Whether an action is possible is the
 * simulation's call; whether it is affordable is this file's.
 */
'use strict';
const crypto = require('node:crypto');

const DEFAULTS = {
  purseMax: 5,
  rechargeMs: 2 * 60 * 1000,
  costs: { leave_book: 1, send_parcel: 2, refund: 3, bill: 3, extra_shift: 3, lose_wallet: 2 },
  defaultCost: 2,
  nameMax: 24
};

function cleanName(raw) {
  const s = String(raw === undefined || raw === null ? '' : raw).replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  return s;
}

function create(opts) {
  opts = Object.assign({}, DEFAULTS, opts || {});
  const now = opts.now || (() => Date.now());
  const byToken = new Map();     // token -> { token, name, ip, adopted, joinedAt, seenAt, connections }
  const purses = new Map();      // ip -> { tokens, credit (ms toward the next token), at }

  function purseOf(ip) {
    let p = purses.get(ip);
    if (!p) { p = { tokens: opts.purseMax, credit: 0, at: now() }; purses.set(ip, p); }
    return p;
  }

  const api = {
    costs: opts.costs,
    purseMax: opts.purseMax,

    costOf(entryId) {
      return Object.prototype.hasOwnProperty.call(opts.costs, entryId) ? opts.costs[entryId] : opts.defaultCost;
    },

    /* A name is required; that is the whole of signing in. */
    join(rawName, ip) {
      const name = cleanName(rawName);
      if (!name) return { ok: false, error: 'name_required' };
      if (name.length > opts.nameMax) return { ok: false, error: 'name_too_long' };
      const token = crypto.randomBytes(18).toString('base64url');
      const s = { token, name, ip, adopted: null, joinedAt: now(), seenAt: now(), connections: 0 };
      byToken.set(token, s);
      purseOf(ip);
      return { ok: true, token, you: api.describe(s) };
    },

    get(token) { return (token && byToken.get(token)) || null; },

    describe(s) {
      const p = purseOf(s.ip);
      return { name: s.name, adopted: s.adopted, purse: p.tokens, purseMax: opts.purseMax };
    },

    /* Presence is what earns tokens. A connection opening or closing is
     * reported here; recharge() then credits every address with someone
     * connected. */
    connect(token, delta) {
      const s = api.get(token);
      if (!s) return false;
      s.connections = Math.max(0, s.connections + delta);
      s.seenAt = now();
      return true;
    },

    /* Called every few seconds. Time counts toward a token only while
     * someone from that address is connected, and only while the purse is
     * not full: a full purse banks nothing for later. */
    recharge() {
      const t = now(), credited = [];
      const present = new Set();
      byToken.forEach((s) => { if (s.connections > 0) present.add(s.ip); });
      purses.forEach((p, ip) => {
        const elapsed = Math.max(0, t - p.at);
        p.at = t;
        if (!present.has(ip)) return;
        if (p.tokens >= opts.purseMax) { p.credit = 0; return; }
        p.credit += elapsed;
        while (p.credit >= opts.rechargeMs && p.tokens < opts.purseMax) { p.tokens++; p.credit -= opts.rechargeMs; credited.push(ip); }
        if (p.tokens >= opts.purseMax) p.credit = 0;
      });
      return credited;
    },

    /* Pays for an entry of the hand, or says why not. */
    spend(token, entryId) {
      const s = api.get(token);
      if (!s) return { ok: false, error: 'unknown_spectator' };
      const cost = api.costOf(entryId), p = purseOf(s.ip);
      if (p.tokens < cost) return { ok: false, error: 'purse_short', cost, purse: p.tokens };
      p.tokens -= cost;
      return { ok: true, cost, purse: p.tokens };
    },

    /* The purchase did not happen after all: the town refused it. */
    refund(token, cost) {
      const s = api.get(token);
      if (!s) return false;
      const p = purseOf(s.ip);
      p.tokens = Math.min(opts.purseMax, p.tokens + cost);
      return true;
    },

    /* Winning a prediction, later: tokens earned, never beyond the cap. */
    credit(token, n) { return api.refund(token, n); },

    adopt(token, actorId) {
      const s = api.get(token);
      if (!s) return { ok: false, error: 'unknown_spectator' };
      s.adopted = actorId || null;
      return { ok: true, you: api.describe(s) };
    },

    tokensOnAddress(ip) { return purseOf(ip).tokens; },

    /* Who is here, for everyone to see: names and what they follow. */
    present() {
      const rows = [];
      byToken.forEach((s) => { if (s.connections > 0) rows.push({ name: s.name, adopted: s.adopted }); });
      rows.sort((a, b) => a.name.localeCompare(b.name));
      return rows;
    },

    /* For a restart: what can be kept. Purses are not; a fresh start is a
     * full purse anyway. */
    toJSON() {
      const out = [];
      byToken.forEach((s) => out.push({ token: s.token, name: s.name, ip: s.ip, adopted: s.adopted, joinedAt: s.joinedAt }));
      return { format: 'living-town/spectators@1', spectators: out };
    },
    load(saved) {
      if (!saved || saved.format !== 'living-town/spectators@1') return 0;
      let n = 0;
      (saved.spectators || []).forEach((r) => {
        if (!r.token || !cleanName(r.name)) return;
        byToken.set(r.token, { token: r.token, name: cleanName(r.name), ip: r.ip || '?', adopted: r.adopted || null, joinedAt: r.joinedAt || now(), seenAt: now(), connections: 0 });
        n++;
      });
      return n;
    }
  };
  return api;
}

module.exports = { create, cleanName, DEFAULTS };
