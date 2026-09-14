'use strict';

// EDITOR CORE — selection. A pure, frozen ordered SET of stable ids (from identity.js) naming which
// entities the user currently has active. The editor is single-select-by-default: a plain click picks
// ONE thing, but shift/ctrl accumulate. Ids are the only thing stored — never an entity object or a
// game reference — so selection can outlive any view it was built in and routing to the inspector /
// drag layer just parses the id via identity.kindOf. This module never imports the runtime; it holds
// ids, not entities.

(function () {
  const R = globalThis.Editor || {};

   // createSelection() -> an empty frozen selection. The canonical starting point after a scene change.
  function createSelection() {
    return Object.freeze({ ids: [] });
     }

     // select(selection, id) -> replace the whole set with a single selection (the plain-click case).
     // Returns the same object unchanged if that id is already the lone selection (no needless work).
  function select(selection, id) {
    const cur = currentId(selection);
    if (cur === id && selection.ids.length === 1) return selection;
    return Object.freeze({ ids: [id] });
     }

     // addTo / toggle implement multi-select. addTo accumulates in first-inserted order (stable, so a
     // UI can render the set without re-sorting); toggle flips membership for shift-click accumulation.
  function addTo(selection, id) {
    if (selection.ids.indexOf(id) !== -1) return selection; // already present: no-op, keep order
      return Object.freeze({ ids: selection.ids.concat([id]) });
        }
  function toggle(selection, id) {
    const i = selection.ids.indexOf(id);
    if (i === -1) return addTo(selection, id);
       return Object.freeze({ ids: selection.ids.slice(0, i).concat(selection.ids.slice(i + 1)) });
      }

     // isSelected / clear / size — the read side. clear returns the empty selection (scene change = reset).
  function isSelected(selection, id) { return selection.ids.indexOf(id) !== -1; }
  function clear() { return createSelection(); }
  function size(selection) { return selection.ids.length; }
  function currentId(selection) { // the topmost selected entity for single-select consumers (inspector).
    return selection.ids.length ? selection.ids[selection.ids.length - 1] : null;
       }

  R.selection = Object.freeze({ createSelection, select, addTo, toggle, isSelected, clear, size, currentId });
  globalThis.Editor = R;
  if (typeof module !== 'undefined' && module.exports) module.exports = R.selection;
  return R.selection;
})();
