'use strict';

/* Self-contained, read-only browser projection. Serialized by the restricted
 * driver; no route-supplied expression ever reaches Runtime.evaluate.
 * Semantic text is evidence of UI content, not of canvas legibility.
 */
module.exports = function observeGame() {
  const g = window.GAME, e = g && g.Engine, s = e && e.state;
  const np = g && g.NarrativeProduction, a = g && g.NarrativeAdapter;
  const clone = (v) => v === undefined ? null : JSON.parse(JSON.stringify(v));
  const text = (selector) => { const el = document.querySelector(selector); return el ? el.textContent : null; };
  const shown = (el) => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      if (n.hidden || n.style.display === 'none') return false;
    }
    return true; // Deliberately not opacity: retro-semantic UI is canvas-backed.
  };
  const options = (selector, attribute) => Array.from(document.querySelectorAll(selector))
    .filter(shown).map((el) => ({ id: el.getAttribute(attribute), text: el.textContent,
      focused: el.classList.contains('nw-focus'), selected: /\[x\]/.test(el.textContent) }));
  let narrative = null, observationError = null;
  try { if (a && a.getState) narrative = clone(a.getState()); }
  catch (err) { observationError = String(err.message || err); }
  const saves = {};
  let storageError = null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k === 'tp_save' || /^twin-peaks:(narrative:|finale:)/.test(k)) saves[k] = localStorage.getItem(k);
    }
  } catch (err) { storageError = String(err.message || err); }
  const populations = {}, doors = {};
  if (g && g.Maps) Object.keys(g.Maps).forEach((id) => {
    const map = g.Maps[id];
    if (!map || !Array.isArray(map.rows)) return;
    populations[id] = (map.npcs || []).map((n) => ({ id: n.id, x: n.x, y: n.y,
      homeX: n.homeX, homeY: n.homeY, source: n.cast_source }));
    doors[id] = clone(map.doors || {});
  });
  // Use production collision queries, not a second interpretation of tile codes.
  let map = null;
  if (s && s.map && Array.isArray(s.map.rows)) {
    map = { rows: s.map.rows.slice(), objects: clone(s.map.objects || []),
      solid: s.map.rows.map((row, y) => Array.from(row, (_, x) =>
        g.Maps.isSolid(s.mapId, x, y, s) ? '1' : '0').join('')) };
  }
  // Fixed observational projection of the real touch UI; routes cannot query
  // arbitrary selectors or execute page code. Rectangles use CSS viewport pixels.
  const touchControls = Array.from(document.querySelectorAll('.tp-touch-ctrl')).map((el) => {
    const r = el.getBoundingClientRect(), style = window.getComputedStyle(el);
    return { label: el.getAttribute('aria-label'), role: el.getAttribute('role'),
      tag: el.tagName, text: el.textContent,
      visible: !el.hidden && el.getAttribute('aria-hidden') !== 'true' &&
        style.display !== 'none' && style.visibility !== 'hidden' &&
        style.pointerEvents !== 'none' && Number(style.opacity) > 0 && r.width > 0 && r.height > 0,
      rect: { x: r.x, y: r.y, width: r.width, height: r.height } };
  });
  const nf = g && g.NarrativeFinale;
  const page = Array.from(document.querySelectorAll('#narrative .nw-page')).find(shown);
  return {
    ready: !!(s && np && np.ready), url: location.href, testMode: np ? !!np.testMode : null,
    mode: s ? s.mode : null, mapId: s ? s.mapId : null,
    introPage: s ? s.introPage : null, endPage: s ? s.endPage : null,
    player: s ? clone(s.player) : null, flags: s ? clone(s.flags) : null,
    clues: s ? clone(s.clues) : null, dialogue: s ? clone(s.dialogue) : null,
    menu: s ? !!s.menu : null, fadePhase: s ? s.fadePhase : null,
    liveNpcs: s ? clone((s.npcs || []).filter((n) => !e.npcActive || e.npcActive(n, s))) : null,
    map, doors, populations, narrative, touchControls,
    narrativeActive: !!(a && a.active && a.active()),
    targets: clone(a && a._debugWorldTargets),
    finale: nf && nf.getState ? clone(nf.getState()) : null,
    finaleScreen: nf && nf.currentScreen ? clone(nf.currentScreen()) : null,
    semanticUi: { objective: text('#objective'),
      page: page ? page.textContent : null, pageId: page ? page.getAttribute('data-page-id') : null,
      choices: options('#narrative .nw-opt[data-choice-id]', 'data-choice-id'),
      propositions: options('#narrative [data-prop-choice]', 'data-prop-choice'),
      attachments: options('#narrative [data-attachment-evidence]', 'data-attachment-evidence'),
      attachmentConfirm: options('#narrative [data-attachment-confirm]', 'data-attachment-confirm'),
      notebookSections: options('#narrative [data-nb-section]', 'data-nb-section'),
      notebookClose: options('#narrative [data-nb-close]', 'data-nb-close'),
      notebookEvidence: options('#narrative [data-nb-compare]', 'data-nb-compare'),
      notebook: Array.from(document.querySelectorAll('#narrative .nb-root')).some(shown),
      recovery: !!document.querySelector('#narrative .nw-save-recovery') },
    saves, storageError, observationError
  };
};
