/* PROTOTYPE — throwaway proof for Blender-authored reusable 2D props.
 * Three variants on this existing Roadhouse surface, switchable with ?variant=A|B|C.
 * Question: can one definition render in-scene and in a builder-style catalog without owning collision? */
(function () {
  'use strict';

  window.onerror = function (message) {
    document.title = 'TP-PROP-PROTOTYPE-ERROR ' + message;
  };

  var variants = {
    A: { label: 'A — current native scene', image: null, smoothing: false },
    B: { label: 'B — round 3 Blender diagnostic', image: 'round-3-diagnostic.png', smoothing: false },
    C: { label: 'C — round 3 native 48×36 in 64×48 bounds', image: 'round-3-asset.png', smoothing: false }
  };
  var keys = Object.keys(variants);
  var params = new URLSearchParams(location.search);
  var key = variants[params.get('variant')] ? params.get('variant') : 'A';
  var scene = document.getElementById('scene');
  var catalog = document.getElementById('catalog');
  var sctx = scene.getContext('2d');
  var cctx = catalog.getContext('2d');
  var image = new Image();

  var definition = Object.freeze({
    id: 'roadhouse.table-set.red',
    anchorPx: [32, 43],
    drawBoundsPx: [0, 0, 64, 48],
    footprint: [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]],
    depthFootPx: 43,
    frontAxis: '-Y',
    backAxis: '+Y',
    variants: {
      native: 'round-3-native.png',
      asset: 'round-3-asset.png',
      diagnostic: 'round-3-diagnostic.png'
    },
    collisionOwner: 'map-rows',
    atomic: 'TP_PREFAB_TableTwoChairs',
    reusable: true
  });
  var instances = Object.freeze([
    { id: 'rh-table-centre', propId: definition.id, sceneId: 'roadhouse', tx: 8, ty: 7,
      pixelOffset: [0, 0], facing: 'east', variant: 'native' },
    { id: 'builder-preview', propId: definition.id, sceneId: 'world-builder-catalog', tx: 4, ty: 3,
      pixelOffset: [0, 0], facing: 'east', variant: 'native' },
    { id: 'builder-preview-small', propId: definition.id, sceneId: 'world-builder-catalog', tx: 7, ty: 5,
      pixelOffset: [0, 0], facing: 'east', variant: 'native' }
  ]);

  /* Orientation contract is calculated from each chair position to the table,
   * never inferred from a handwritten rotation. Blender uses FRONT=-Y. */
  var tableAnchor = [0, 0];
  var chairPlacements = Object.freeze([
    { id: 'west', position: [-1.25, 0], yaw: Math.PI / 2 },
    { id: 'east', position: [1.25, 0], yaw: -Math.PI / 2 }
  ]);
  function calculateFacing(position, anchor) {
    var dx = anchor[0] - position[0];
    var dy = anchor[1] - position[1];
    if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'east' : 'west';
    return dy >= 0 ? 'north' : 'south';
  }
  function frontVector(yaw) { return [Math.sin(yaw), -Math.cos(yaw)]; }
  var orientationChecks = chairPlacements.map(function (chair) {
    var expected = calculateFacing(chair.position, tableAnchor);
    var v = frontVector(chair.yaw);
    var target = [tableAnchor[0] - chair.position[0], tableAnchor[1] - chair.position[1]];
    var dot = v[0] * target[0] + v[1] * target[1];
    return { id: chair.id, expected: expected, yaw: chair.yaw, dot: dot, pass: dot > 0 };
  });
  if (orientationChecks.some(function (check) { return !check.pass; })) {
    document.title = 'TP-PROP-PROTOTYPE-ERROR orientation contract';
    throw new Error('chair FRONT points away from table anchor');
  }

  function floorPatch(ctx, x0, y0, w, h) {
    ctx.fillStyle = '#33252a'; ctx.fillRect(x0, y0, w, h);
    for (var y = y0; y < y0 + h; y += 8) {
      for (var x = x0; x < x0 + w; x += 8) {
        ctx.fillStyle = (((x >> 3) + (y >> 3)) & 1) ? '#46302e' : '#533831';
        ctx.fillRect(x, y, Math.min(8, x0 + w - x), Math.min(8, y0 + h - y));
      }
    }
  }

  function drawProp(ctx, instance, x, y, width, height) {
    if (instance.propId !== definition.id) throw new Error('unknown prop definition: ' + instance.propId);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, x + instance.pixelOffset[0], y + instance.pixelOffset[1], width, height);
  }

  function drawScene() {
    sctx.imageSmoothingEnabled = false;
    GAME.RoadhouseArt.draw(sctx, 0, 0);
    if (!variants[key].image) return;
    floorPatch(sctx, 96, 104, 80, 40);
    /* Asset has a 64×48 reusable draw bound with a 48×36 native prop
     * centered inside; this is a 1:1 draw, not a browser enlargement. */
    drawProp(sctx, instances[0], 104, 96, 64, 48);
    sctx.imageSmoothingEnabled = false;
  }

  function drawCatalog() {
    floorPatch(cctx, 0, 0, 192, 128);
    if (variants[key].image) {
      drawProp(cctx, instances[1], 12, 28, 64, 48);
      drawProp(cctx, instances[2], 108, 54, 48, 36);
    } else {
      cctx.fillStyle = '#b87943';
      cctx.fillText('current art has no reusable asset', 10, 62);
    }
    cctx.imageSmoothingEnabled = false;
    cctx.strokeStyle = '#f4c568'; cctx.strokeRect(12, 28, 64, 48); cctx.strokeRect(108, 54, 48, 36);
  }

  function render() {
    document.getElementById('variant-label').textContent = variants[key].label;
    document.getElementById('manifest').textContent = JSON.stringify({
      definition: definition,
      instances: instances,
      orientation: { tableAnchor: tableAnchor, frontAxis: '-Y', backAxis: '+Y', checks: orientationChecks }
    }, null, 2);
    if (!variants[key].image) {
      drawScene(); drawCatalog(); ready(); return;
    }
    image.onload = function () { drawScene(); drawCatalog(); ready(); };
    image.src = '../artifacts/art-pass-e/e3/prop-prototype/' + variants[key].image;
  }

  function cycle(delta) {
    var next = keys[(keys.indexOf(key) + delta + keys.length) % keys.length];
    params.set('variant', next);
    location.search = params.toString();
  }
  document.getElementById('prev').onclick = function () { cycle(-1); };
  document.getElementById('next').onclick = function () { cycle(1); };
  addEventListener('keydown', function (event) {
    if (event.target.matches('input,textarea,[contenteditable]')) return;
    if (event.key === 'ArrowLeft') cycle(-1);
    if (event.key === 'ArrowRight') cycle(1);
  });

  function ready() {
    document.title = 'TP-PROP-PROTOTYPE-READY ' + key;
    console.log(document.title);
  }
  render();
}());
