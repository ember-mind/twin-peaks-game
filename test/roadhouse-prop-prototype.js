/* PROTOTYPE — three ways to author Roadhouse visuals on native 256x192 canvas.
 * A=current procedural scene, B=combined Blender prefab, C=reusable atomic PNG kit. */
(function () {
  'use strict';

  window.onerror = function (message) { document.title = 'TP-PROP-PROTOTYPE-ERROR ' + message; };
  var variants = {
    A: { label: 'A — current native scene' },
    B: { label: 'B — Blender table prefab' },
    C: { label: 'C — atomic reference kit' }
  };
  var keys = Object.keys(variants);
  var params = new URLSearchParams(location.search);
  var key = variants[params.get('variant')] ? params.get('variant') : 'C';
  var scene = document.getElementById('scene');
  var catalog = document.getElementById('catalog');
  var sctx = scene.getContext('2d');
  var cctx = catalog.getContext('2d');
  var prefab = new Image();
  var atlas = new Image();
  var manifest;

  var atomicInstances = [
    { propId: 'roadhouse.neon.sign', x: 6, y: 8, layer: 2 },
    { propId: 'roadhouse.stage.velvet', x: 72, y: 2, layer: 1 },
    { propId: 'roadhouse.piano.upright', x: 80, y: 15, layer: 3 },
    { propId: 'roadhouse.trophy.deer', x: 231, y: 7, layer: 2 },
    { propId: 'roadhouse.pendant.brass', x: 151, y: 42, layer: 3 },
    { propId: 'roadhouse.pendant.brass', x: 207, y: 42, layer: 3 },
    { propId: 'roadhouse.bar.segment', x: 174, y: 72, layer: 4 },
    { propId: 'roadhouse.payphone.wall', x: 243, y: 68, layer: 5 },
    { propId: 'roadhouse.booth.red', x: 8, y: 70, layer: 4 },
    { propId: 'roadhouse.booth.red', x: 204, y: 119, layer: 4 },
    { propId: 'roadhouse.table.round', x: 95, y: 82, layer: 5 },
    { propId: 'roadhouse.chair.red', x: 76, y: 88, flipX: true, layer: 6 },
    { propId: 'roadhouse.chair.red', x: 116, y: 88, layer: 6 },
    { propId: 'roadhouse.candle.brass', x: 101, y: 78, layer: 7 },
    { propId: 'roadhouse.table.round', x: 120, y: 126, layer: 5 },
    { propId: 'roadhouse.chair.red', x: 101, y: 132, flipX: true, layer: 6 },
    { propId: 'roadhouse.chair.red', x: 141, y: 132, layer: 6 },
    { propId: 'roadhouse.candle.brass', x: 126, y: 122, layer: 7 },
    { propId: 'roadhouse.door.double', x: 113, y: 165, layer: 8 }
  ];

  function prop(id) {
    return manifest.props.filter(function (entry) { return entry.id === id; })[0];
  }

  function drawAtomic(ctx, instance, scale) {
    var entry = prop(instance.propId);
    var f = entry.frame;
    scale = scale || 1;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (instance.flipX) {
      ctx.translate(Math.round(instance.x + f[2] * scale), Math.round(instance.y));
      ctx.scale(-1, 1);
      ctx.drawImage(atlas, f[0], f[1], f[2], f[3], 0, 0, Math.round(f[2] * scale), Math.round(f[3] * scale));
    } else {
      ctx.drawImage(atlas, f[0], f[1], f[2], f[3], Math.round(instance.x), Math.round(instance.y),
        Math.round(f[2] * scale), Math.round(f[3] * scale));
    }
    ctx.restore();
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

  function drawAtomicRoom() {
    sctx.fillStyle = '#171418'; sctx.fillRect(0, 0, 256, 192);
    sctx.fillStyle = '#302021'; sctx.fillRect(0, 0, 256, 34);
    for (var x = 0; x < 256; x += 16) {
      sctx.fillStyle = (x / 16 & 1) ? '#402725' : '#392326';
      sctx.fillRect(x + 1, 1, 14, 31);
    }
    floorPatch(sctx, 0, 32, 256, 128);
    sctx.fillStyle = '#302021'; sctx.fillRect(0, 160, 256, 32);
    sctx.fillStyle = '#75422f'; sctx.fillRect(0, 160, 256, 3);
    atomicInstances.slice().sort(function (a, b) { return a.layer - b.layer; }).forEach(function (instance) {
      drawAtomic(sctx, instance, 1);
    });
  }

  function drawScene() {
    sctx.clearRect(0, 0, scene.width, scene.height);
    sctx.imageSmoothingEnabled = false;
    if (key === 'C') drawAtomicRoom();
    else {
      GAME.RoadhouseArt.draw(sctx, 0, 0);
      if (key === 'B') {
        floorPatch(sctx, 96, 104, 80, 40);
        sctx.drawImage(prefab, 104, 96, 64, 48);
      }
    }
  }

  function drawCatalog() {
    floorPatch(cctx, 0, 0, 192, 128);
    cctx.imageSmoothingEnabled = false;
    if (key === 'A') {
      cctx.fillStyle = '#d5b979'; cctx.font = '10px monospace';
      cctx.fillText('procedural scene; no atomic PNG catalog', 7, 64);
      return;
    }
    if (key === 'B') {
      cctx.drawImage(prefab, 16, 30, 160, 90);
      return;
    }
    var ids = ['roadhouse.stage.velvet', 'roadhouse.bar.segment', 'roadhouse.booth.red',
      'roadhouse.piano.upright', 'roadhouse.neon.sign', 'roadhouse.payphone.wall'];
    ids.forEach(function (id, index) {
      var entry = prop(id), f = entry.frame;
      var cellX = (index % 2) * 96, cellY = Math.floor(index / 2) * 42;
      var scale = Math.min(1, 86 / f[2], 30 / f[3]);
      drawAtomic(cctx, { propId: id, x: cellX + (96 - f[2] * scale) / 2, y: cellY + 2 }, scale);
    });
  }

  function render() {
    document.getElementById('variant-label').textContent = variants[key].label;
    document.getElementById('manifest').textContent = JSON.stringify({
      question: 'Can atomic reference-derived props rebuild a better Roadhouse?',
      variant: key,
      definitions: key === 'C' ? manifest.props.length : (key === 'B' ? 1 : 0),
      instances: key === 'C' ? atomicInstances.length : (key === 'B' ? 1 : 0),
      collisionOwner: 'map-rows',
      persistence: false
    }, null, 2);
    drawScene(); drawCatalog();
    document.title = 'TP-PROP-PROTOTYPE-READY ' + key;
  }

  function cycle(delta) {
    params.set('variant', keys[(keys.indexOf(key) + delta + keys.length) % keys.length]);
    location.search = params.toString();
  }
  document.getElementById('prev').onclick = function () { cycle(-1); };
  document.getElementById('next').onclick = function () { cycle(1); };
  addEventListener('keydown', function (event) {
    if (event.target.matches('input,textarea,[contenteditable]')) return;
    if (event.key === 'ArrowLeft') cycle(-1);
    if (event.key === 'ArrowRight') cycle(1);
  });

  Promise.all([
    fetch('../assets/prototypes/direct-reference/roadhouse-props.prototype.json').then(function (response) { return response.json(); }),
    new Promise(function (resolve, reject) { atlas.onload = resolve; atlas.onerror = reject; atlas.src = '../assets/prototypes/direct-reference/expanded/runtime/roadhouse-props-expanded-atlas.png'; }),
    new Promise(function (resolve, reject) { prefab.onload = resolve; prefab.onerror = reject; prefab.src = '../artifacts/art-pass-e/e3/prop-prototype/round-3-asset.png'; })
  ]).then(function (results) { manifest = results[0]; render(); }).catch(function (error) {
    console.error(error); document.title = 'TP-PROP-PROTOTYPE-ERROR';
  });
}());
