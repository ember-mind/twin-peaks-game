/* lt-persistence.js — Living Town: what the page does with a save.
 *
 * lt-save.js turns a world into text and back, and says exactly what happened
 * when it could not. This file holds the few rules the page follows around it,
 * with no DOM in it so they can be tested without a browser:
 *
 *   - At start there are four different situations — no save, a usable save,
 *     a save this build refuses, storage that cannot be read — and only the
 *     first one may quietly begin a new world.
 *   - A refused save is never overwritten. Replacing it is a separate, explicit
 *     act, and even then it is moved aside, not destroyed.
 *   - One tab saves a world at a time. A tab holds a short lease it keeps
 *     renewing; another tab sees the lease and does not write unless the
 *     person tells it to take over.
 *   - Autosave happens between two ticks, at most every AUTOSAVE_SIM_MINUTES of
 *     town time and never more often than AUTOSAVE_REAL_MS, not per frame.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function' && !LT.Save) require('./lt-save.js');
  var Pz = LT.Persistence = LT.Persistence || {};

  Pz.AUTOSAVE_SIM_MINUTES = 30;
  Pz.AUTOSAVE_REAL_MS = 10000;
  Pz.LEASE_MS = 15000;

  function Controller(opts) {
    opts = opts || {};
    this.key = opts.key || LT.Save.DEFAULT_KEY;
    this.now = opts.now || function () { return Date.now(); };
    this.tabId = opts.tabId || ('tab_' + Math.floor(Math.random() * 1e9).toString(36) + '_' + this.now().toString(36));
    this.protectedReason = null;   // why the stored save must not be written over without being told to
    this.lastSaveReal = -Infinity;
    this.lastSaveAbs = null;
    this.lastResult = null;
  }

  function storage() { try { return root.localStorage || null; } catch (e) { return null; } }

  /* ---- the lease ---- */
  Controller.prototype.leaseKey = function () { return this.key + '.owner'; };
  Controller.prototype.readLease = function () {
    try {
      var text = storage() && storage().getItem(this.leaseKey());
      var lease = text ? JSON.parse(text) : null;
      return lease && typeof lease.tab === 'string' ? lease : null;
    } catch (e) { return null; }
  };
  /* Somebody else's, and still fresh. */
  Controller.prototype.heldElsewhere = function () {
    var lease = this.readLease();
    return !!(lease && lease.tab !== this.tabId && this.now() - lease.at < Pz.LEASE_MS);
  };
  Controller.prototype.holdLease = function () {
    try { storage().setItem(this.leaseKey(), JSON.stringify({ tab: this.tabId, at: this.now() })); return true; }
    catch (e) { return false; }
  };
  Controller.prototype.heartbeat = function () {
    if (!storage() || this.heldElsewhere()) return false;
    return this.holdLease();
  };
  Controller.prototype.release = function () {
    try {
      var lease = this.readLease();
      if (lease && lease.tab === this.tabId) storage().removeItem(this.leaseKey());
    } catch (e) { /* nothing to release */ }
  };

  /* ---- start ---- */
  /* `fresh: true` is the page being asked, in its address, for a new world. The
   * stored save is not read into the town and not touched. */
  Controller.prototype.boot = function (opts) {
    opts = opts || {};
    var peek = LT.Save.peekLocal(this.key), out;
    if (opts.fresh) {
      out = { status: peek.status === 'present' ? 'set_aside' : peek.status, sim: null, reason: peek.reason || null };
      if (peek.status === 'present') this.protectedReason = 'a saved world is stored in this browser and was not loaded';
    } else {
      var read = LT.Save.readLocal(this.key, opts.loadOptions);
      out = { status: read.status, sim: read.sim, reason: read.reason };
      if (read.status === 'refused') this.protectedReason = 'the stored save was refused and has been left as it was';
    }
    if (out.status === 'unavailable') this.protectedReason = null;
    if (out.status === 'loaded') { this.lastSaveAbs = out.sim.absMinute(); this.heartbeat(); }
    if (out.status === 'none') this.heartbeat();
    return out;
  };

  /* ---- save ----
   * opts.replaceProtected  the person has confirmed replacing a save this tab
   *                        did not load (refused, or set aside)
   * opts.setAside          keep what is stored under another key first: a new
   *                        world is replacing a different one
   * opts.takeOver          the person has confirmed saving from this tab
   *                        although another tab holds the lease */
  Controller.prototype.save = function (sim, opts) {
    opts = opts || {};
    var result;
    if (this.protectedReason && !opts.replaceProtected) {
      result = { ok: false, status: 'protected', reason: this.protectedReason };
    } else if (this.heldElsewhere() && !opts.takeOver) {
      result = { ok: false, status: 'other_tab', reason: 'another tab is saving this world' };
    } else {
      if (this.protectedReason || opts.setAside) this.setAside();
      this.holdLease();
      result = LT.Save.writeLocal(sim, this.key);
      if (result.ok) {
        this.protectedReason = null;
        this.lastSaveReal = this.now();
        this.lastSaveAbs = sim.absMinute();
      }
    }
    result.auto = !!opts.auto;
    this.lastResult = result;
    return result;
  };

  /* A save that is about to be replaced on purpose is kept under another key. */
  Controller.prototype.setAside = function () {
    try {
      var text = storage().getItem(this.key);
      if (text) storage().setItem(this.key + '.set-aside', text);
      return !!text;
    } catch (e) { return false; }
  };

  Controller.prototype.autosaveDue = function (sim) {
    if (this.protectedReason) return false;
    if (this.lastSaveAbs !== null && sim.absMinute() - this.lastSaveAbs < Pz.AUTOSAVE_SIM_MINUTES) return false;
    if (this.now() - this.lastSaveReal < Pz.AUTOSAVE_REAL_MS) return false;
    return !this.heldElsewhere();
  };
  /* Called between two ticks. Quiet when there is nothing to do. */
  Controller.prototype.autosave = function (sim) {
    if (!this.autosaveDue(sim)) return null;
    return this.save(sim, { auto: true });
  };

  /* ---- resume, new world ---- */
  Controller.prototype.resume = function (loadOptions) {
    var read = LT.Save.readLocal(this.key, loadOptions);
    if (read.status === 'loaded') { this.protectedReason = null; this.lastSaveAbs = read.sim.absMinute(); this.heartbeat(); }
    if (read.status === 'refused') this.protectedReason = 'the stored save was refused and has been left as it was';
    return read;
  };

  /* Whether starting over would replace something, and what. */
  Controller.prototype.newWorldReplaces = function () {
    var peek = LT.Save.peekLocal(this.key);
    return peek.status === 'present' ? (this.protectedReason || 'the saved world in this browser') : null;
  };

  Pz.create = function (opts) { return new Controller(opts); };
})();
