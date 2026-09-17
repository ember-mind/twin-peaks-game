/* double-r-location-production.js — canonical Double R exterior/interior slice (scene + diner door reaction). */
(function () {
  'use strict';

  var G = window.GAME;
  G.DoubleRExteriorScene.install();

  /* The diner model and generated rows remain the only geometry owners.  This
   * local view gives World Engine named anchors without copying a second map
   * or collision table into the production installer. */
  function fail(message) {
    throw new Error('DoubleRLocation: ' + message);
  }

  function isRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  function requireTuple(tuple, label, length) {
    if (!Array.isArray(tuple) || tuple.length !== length ||
        !tuple.every(function (value) { return Number.isInteger(value); })) {
      fail(label + ' must be an integer tuple of length ' + length);
    }
    return tuple;
  }

  function installDinerLayout() {
    var map = G.Maps && G.Maps.diner;
    if (!map) fail('GAME.Maps.diner is missing');
    var model = map.interior;
    if (!isRecord(model)) fail('GAME.Maps.diner.interior is missing');
    ['counter', 'stools', 'booths', 'plant', 'coatRack', 'specials', 'islandPlant']
      .forEach(function (key) {
        if (!Object.prototype.hasOwnProperty.call(model, key)) {
          fail('diner model is missing ' + key);
        }
      });
    if (!Array.isArray(map.rows) || map.rows.length === 0 ||
        !map.rows.every(function (row) { return typeof row === 'string' && row.length === map.rows[0].length; })) {
      fail('diner rows must be a non-empty rectangular string grid');
    }

    var rows = map.rows;
    var width = rows[0].length;
    var height = rows.length;
    var footprints = {};

    function cell(x, y, label, glyph) {
      if (!Number.isInteger(x) || !Number.isInteger(y) ||
          x < 0 || y < 0 || x >= width || y >= height) {
        fail(label + ' is outside diner rows');
      }
      var actual = rows[y].charAt(x);
      if (actual !== glyph) {
        fail(label + ' expects glyph "' + glyph + '" but found "' + actual + '" at ' + x + ',' + y);
      }
      return [x, y];
    }

    function addFootprint(id, cells) {
      if (Object.prototype.hasOwnProperty.call(footprints, id)) fail('duplicate footprint "' + id + '"');
      footprints[id] = cells;
    }

    var counter = requireTuple(model.counter, 'diner model counter', 3);
    var counterCells = [];
    if (counter[2] < 1) fail('diner model counter width must be positive');
    for (var counterDx = 0; counterDx < counter[2]; counterDx++) {
      counterCells.push(cell(counter[0] + counterDx, counter[1], 'counter[' + counterDx + ']', 'C'));
    }
    addFootprint('counter', counterCells);

    if (!Array.isArray(model.stools)) fail('diner model stools must be an array');
    model.stools.forEach(function (stool, index) {
      stool = requireTuple(stool, 'diner model stool-' + index, 2);
      addFootprint('stool-' + index, [cell(stool[0], stool[1], 'stool-' + index, 'h')]);
    });

    if (!Array.isArray(model.booths)) fail('diner model booths must be an array');
    model.booths.forEach(function (booth, index) {
      booth = requireTuple(booth, 'diner model booth-' + index, 3);
      var boothX = booth[0], boothY = booth[1], boothWidth = booth[2];
      if (boothWidth < 1) fail('diner model booth-' + index + ' width must be positive');
      var boothCells = [];
      var dx;
      for (dx = 0; dx < boothWidth; dx++) {
        boothCells.push(cell(boothX + dx, boothY, 'booth-' + index + ' table[' + dx + ']', 't'));
      }
      /* Raised backrests are the solid row immediately north of the table.
       * Read that row instead of restating the generator's left/right rule. */
      if (boothY < 1) fail('booth-' + index + ' has no north row for its backrest');
      var backrestCount = 0;
      for (dx = 0; dx < boothWidth; dx++) {
        if (rows[boothY - 1].charAt(boothX + dx) !== 'h') continue;
        boothCells.push(cell(boothX + dx, boothY - 1,
          'booth-' + index + ' backrest[' + dx + ']', 'h'));
        backrestCount++;
      }
      if (!backrestCount) fail('booth-' + index + ' has no solid backrest');
      addFootprint('booth-' + index, boothCells);
    });

    function addSingle(id, tuple, glyph) {
      tuple = requireTuple(tuple, 'diner model ' + id, 2);
      addFootprint(id, [cell(tuple[0], tuple[1], id, glyph)]);
    }
    addSingle('wall-plant', model.plant, 'h');
    addSingle('coat-rack', model.coatRack, 'h');

    var specials = requireTuple(model.specials, 'diner model specials', 4);
    if (specials[2] < 1 || specials[3] < 1) fail('diner model specials dimensions must be positive');
    var specialsCells = [];
    for (var specialY = 0; specialY < specials[3]; specialY++) {
      for (var specialX = 0; specialX < specials[2]; specialX++) {
        specialsCells.push(cell(specials[0] + specialX, specials[1] + specialY,
          'specials[' + specialX + ',' + specialY + ']', 't'));
      }
    }
    addFootprint('specials', specialsCells);
    addSingle('island-plant', model.islandPlant, 'h');

    var southY = height - 1;
    var south = rows[southY];
    var doorStart = -1;
    var doorEnd = -1;
    for (var x = 0; x < width; x++) {
      if (south.charAt(x) === 'D') {
        if (doorStart < 0) doorStart = x;
        doorEnd = x;
      }
    }
    if (doorStart < 0 || doorEnd - doorStart !== 1 || south.slice(doorStart, doorEnd + 1) !== 'DD') {
      fail('south diner row must contain one contiguous DD doorway');
    }
    var counterCenterX = counter[0] + Math.floor(counter[2] / 2);
    var targets = {
      entrance: { x: doorStart, y: southY - 1 },
      'service-approach': { x: counterCenterX, y: counter[1] + 2 }
    };

    function validateTarget(id, target) {
      if (target.x < 0 || target.y < 0 || target.x >= width || target.y >= height) {
        fail(id + ' target is outside diner rows');
      }
      var glyph = rows[target.y].charAt(target.x);
      if (glyph !== 'f') {
        fail(id + ' target expects glyph "f" but found "' + glyph + '" at ' + target.x + ',' + target.y);
      }
      if (G.Maps.isSolid && G.Maps.isSolid('diner', target.x, target.y, { clues: [] })) {
        fail(id + ' target must be walkable at ' + target.x + ',' + target.y + ' (glyph "' + glyph + '")');
      }
    }
    Object.keys(targets).forEach(function (id) { validateTarget(id, targets[id]); });

    Object.keys(footprints).forEach(function (id) {
      footprints[id].forEach(Object.freeze);
      Object.freeze(footprints[id]);
    });
    Object.keys(targets).forEach(function (id) { Object.freeze(targets[id]); });
    var layout = Object.freeze({ footprints: Object.freeze(footprints), targets: Object.freeze(targets) });
    if (Object.prototype.hasOwnProperty.call(map, 'layout')) fail('diner map already exposes a layout');
    Object.defineProperty(map, 'layout', {
      value: layout,
      enumerable: false,
      writable: false,
      configurable: false
    });
  }

  installDinerLayout();
  /* Doors (double-r-front-entrance, town-double-r-lot) are installed by js/world-connections-production.js. */
  G.EnvironmentReactions.register('diner', [{
    id: 'front-door', trigger: 'ENTITY_ENTERED_DOORWAY', x: 96, y: 144, depth: 160,
    frames: G.EnvironmentReactions.doorEntryFrames,
    palette: { frame: '#35271f', void: '#17251e', threshold: '#81918b', red: '#8c2f3e', edge: '#501f29', gold: '#e9bd5d', glass: '#f4e6c8' }
  }]);
}());
