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
    B: { label: 'B — raw Blender render', image: 'table-set-blender-raw.png', smoothing: true },
    C: { label: 'C — native pixel hybrid', image: 'table-set-native.png', smoothing: false }
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
    collisionOwner: 'map-rows'
  });
  var instances = Object.freeze([
    { id: 'rh-table-centre', propId: definition.id, tx: 8, ty: 7 },
    { id: 'builder-preview', propId: definition.id, tx: 4, ty: 3 }
  ]);

  function floorPatch(ctx, x0, y0, w, h) {
    ctx.fillStyle = '#33252a'; ctx.fillRect(x0, y0, w, h);
    for (var y = y0; y < y0 + h; y += 8) {
      for (var x = x0; x < x0 + w; x += 8) {
        ctx.fillStyle = (((x >> 3) + (y >> 3)) & 1) ? '#46302e' : '#533831';
        ctx.fillRect(x, y, Math.min(8, x0 + w - x), Math.min(8, y0 + h - y));
      }
    }
  }

  function drawScene() {
    sctx.imageSmoothingEnabled = false;
    GAME.RoadhouseArt.draw(sctx, 0, 0);
    if (!variants[key].image) return;
    floorPatch(sctx, 96, 104, 80, 40);
    sctx.imageSmoothingEnabled = variants[key].smoothing;
    sctx.drawImage(image, 104, 96, 64, 48);
    sctx.imageSmoothingEnabled = false;
    sctx.strokeStyle = '#f4c568';
    sctx.strokeRect(112, 112, 48, 32);
  }

  function drawCatalog() {
    floorPatch(cctx, 0, 0, 192, 128);
    cctx.imageSmoothingEnabled = variants[key].smoothing;
    if (variants[key].image) {
      cctx.drawImage(image, 12, 28, 64, 48);
      cctx.drawImage(image, 108, 54, 48, 36);
    } else {
      cctx.fillStyle = '#b87943';
      cctx.fillText('current art has no reusable asset', 10, 62);
    }
    cctx.imageSmoothingEnabled = false;
    cctx.strokeStyle = '#f4c568'; cctx.strokeRect(12, 28, 64, 48); cctx.strokeRect(108, 54, 48, 36);
  }

  function render() {
    document.getElementById('variant-label').textContent = variants[key].label;
    document.getElementById('manifest').textContent = JSON.stringify({ definition: definition, instances: instances }, null, 2);
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
