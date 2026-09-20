/* lt-everyday.js — Living Town: the seam between two content packages.
 *
 * everyday-opportunities-v01 says what a book or a parcel IS and what state an
 * instance is in. everyday-props-v01 knows how a `book_used` or a `food_parcel`
 * in a given visual state is drawn, and nothing about the simulation. This
 * file introduces them: for each visual type both packages agree on, it
 * registers the props painter with LT.Content. It draws nothing itself and
 * holds no state; the view asks LT.Content what an instance looks like this
 * minute and hands the answer to the painter.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  var C = LT.Content, EP = LT.EverydayProps;
  if (!C || !EP) return;

  ['book_used', 'food_parcel'].forEach(function (typeId) {
    if (!EP.TYPES[typeId]) return;
    C.registerPainter(typeId, function (g, state, x, y) {
      var kit = root.GAME && root.GAME.Retro2D && root.GAME.Retro2D.interiorKit;
      if (!kit || EP.TYPES[typeId].states.indexOf(state) < 0) return false;   // not drawable here: the view says so
      EP.draw(g, typeId, state, x, y, { kit: kit, material: 'lt_cafe' });
      return true;
    });
  });
})();
