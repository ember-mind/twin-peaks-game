/* kit-editor-selftest.js — drives the editor with real mouse and key events
 * and writes a verdict into <pre id="selftest">. kit-editor.html?selftest=1 */
(function () {
  var out = [], E = window.KIT_EDITOR, cv = document.getElementById('map');
  function ok(c, m) { out.push((c ? 'PASS ' : 'FAIL ') + m); }
  function at(tx, ty, type, extra) {
    var r = cv.getBoundingClientRect(), s = r.width / cv.width;
    var ev = new MouseEvent(type, Object.assign({ bubbles: true, clientX: r.left + (tx * 16 + 8) * s, clientY: r.top + (ty * 16 + 8) * s }, extra || {}));
    (type === 'mouseup' ? window : cv).dispatchEvent(ev);
  }
  function click(tx, ty) { at(tx, ty, 'mousemove'); at(tx, ty, 'mousedown'); at(tx, ty, 'mouseup'); }
  function key(k, extra) { window.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true }, extra || {}))); }
  function tool(t) { document.querySelector('#tools button[data-tool="' + t + '"]').click(); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function mat(x, y) { var m = E.map(); return m.legend[m.ground[y].charAt(x)]; }

  (function ready() { if (!E.world()) return setTimeout(ready, 100); run(); })();
  async function run() {
    var m0 = JSON.stringify(E.map()), n0 = E.map().objects.length;
    // paint a 3x3 patch of water into the park lawn
    document.querySelector('#materials .swatch[data-mat="water"]').click();
    at(5, 16, 'mousemove'); at(5, 16, 'mousedown'); at(6, 16, 'mousemove'); at(6, 16, 'mouseup'); await wait(80);
    ok(mat(5, 16) === 'water' && mat(4, 15) === 'water' && mat(7, 17) === 'water', 'paint stroke lays water with a 3-cell brush');
    ok(!E.world().blocked || E.world().blocked[16 * E.map().w + 5] === 1, 'painted water blocks walking');
    // undo restores
    key('z', { metaKey: true }); await wait(80);
    ok(mat(5, 16) !== 'water', 'undo removes the stroke');
    key('z', { metaKey: true, shiftKey: true }); await wait(80);
    ok(mat(5, 16) === 'water', 'redo puts it back');
    key('z', { metaKey: true }); await wait(80);
    // place a lamp
    document.querySelector('#objects .swatch[data-obj="lamp-2"]').click();
    click(8, 13); await wait(80);
    var lamp = E.map().objects[E.map().objects.length - 1];
    ok(E.map().objects.length === n0 + 1 && lamp.kit === 'lamp-2' && lamp.tx === 8 && lamp.ty === 13, 'place puts lamp-2 at the clicked tile');
    // move it by drag, then nudge with an arrow
    tool('move'); E.select(lamp.id);
    at(8, 13, 'mousemove'); at(8, 12, 'mousedown'); at(11, 12, 'mousemove'); at(11, 12, 'mouseup'); await wait(80);
    var moved = E.map().objects.filter(function (o) { return o.id === lamp.id; })[0];
    ok(moved && moved.tx === 11, 'drag moves the lamp three tiles right (at ' + (moved && moved.tx) + ')');
    key('ArrowRight'); await wait(80);
    ok(moved.tx === 12, 'arrow nudges one tile');
    // delete with the Delete tool
    tool('erase'); click(12, 12); await wait(80);
    ok(!E.map().objects.some(function (o) { return o.id === lamp.id; }), 'delete removes it');
    // a spot on the lawn
    tool('spot'); click(30, 16); await wait(40);
    document.getElementById('spotName').value = 'test_spot'; document.getElementById('spotSet').click(); await wait(80);
    ok(E.map().spots.test_spot && E.world().places.test_spot, 'spot becomes a place the engine routes to');
    ok(/none/.test(document.getElementById('check').textContent), 'check: everything still reachable');
    // blocked override then clear
    tool('block'); click(30, 16); await wait(80);
    ok(/test_spot stands on a blocked cell/.test(document.getElementById('check').textContent), 'blocking the spot tile is reported');
    tool('clear'); click(30, 16); await wait(80);
    ok(/none/.test(document.getElementById('check').textContent), 'clearing the override makes it reachable again');
    ok(JSON.stringify(E.map()) !== m0, 'map changed');
    var pre = document.createElement('pre'); pre.id = 'selftest'; pre.textContent = out.join('\n'); document.body.appendChild(pre);
    document.title = (out.every(function (l) { return l.indexOf('PASS') === 0; }) ? 'SELFTEST PASS ' : 'SELFTEST FAIL ') + out.length;
  }
})();
