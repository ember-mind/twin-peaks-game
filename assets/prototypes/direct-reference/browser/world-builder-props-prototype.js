/* PROTOTYPE — three Roadhouse compositions on actual World Builder.
 * Open world-builder.html?propPrototype=A|B|C. No exports; no map/collision mutation. */
(function () {
  'use strict';

  var manifestUrl = 'assets/prototypes/direct-reference/roadhouse-props.prototype.json';
  var atlas = new Image();
  var manifest;
  var selectedId = null;
  var params = new URLSearchParams(location.search);
  var variant = /^[ABC]$/.test(params.get('propPrototype')) ? params.get('propPrototype') : 'C';
  var variantNames = { A: 'Dining atoms', B: 'Architecture kit', C: 'Full Roadhouse' };
  var diningInstances = [
    { propId: 'roadhouse.pendant.brass', tx: 4, ty: 1.05 },
    { propId: 'roadhouse.pendant.brass', tx: 11, ty: 1.05 },
    { propId: 'roadhouse.table.round', tx: 7.5, ty: 7 },
    { propId: 'roadhouse.chair.red', tx: 6.8, ty: 7.65, flipX: true },
    { propId: 'roadhouse.chair.red', tx: 9.25, ty: 7.65 },
    { propId: 'roadhouse.candle.brass', tx: 8.3, ty: 6.9 }
  ];
  var architectureInstances = [
    { propId: 'roadhouse.neon.sign', tx: 8, ty: 0.55, layer: 2 },
    { propId: 'roadhouse.trophy.deer', tx: 1.5, ty: 1.15, layer: 2 },
    { propId: 'roadhouse.stage.velvet', tx: 8, ty: 3.05, layer: 0 },
    { propId: 'roadhouse.piano.upright', tx: 4.6, ty: 2.82, layer: 3 },
    { propId: 'roadhouse.bar.segment', tx: 7.25, ty: 5.95 },
    { propId: 'roadhouse.payphone.wall', tx: 8.5, ty: 5.85, layer: 5 },
    { propId: 'roadhouse.door.double', tx: 8, ty: 9.95 }
  ];
  var roomInstances = [
    { propId: 'roadhouse.booth.red', tx: 2.8, ty: 5.0 },
    { propId: 'roadhouse.booth.red', tx: 13.0, ty: 8.05 },
    { propId: 'roadhouse.table.round', tx: 3.4, ty: 7.0 },
    { propId: 'roadhouse.chair.red', tx: 2.2, ty: 7.65, flipX: true },
    { propId: 'roadhouse.chair.red', tx: 4.7, ty: 7.65 },
    { propId: 'roadhouse.candle.brass', tx: 3.7, ty: 6.9 },
    { propId: 'roadhouse.table.round', tx: 11.7, ty: 7.0 },
    { propId: 'roadhouse.chair.red', tx: 10.5, ty: 7.65, flipX: true },
    { propId: 'roadhouse.chair.red', tx: 13.0, ty: 7.65 },
    { propId: 'roadhouse.candle.brass', tx: 12.0, ty: 6.9 }
  ];
  var userInstances = [];

  function activeInstances() {
    if (variant === 'A') return diningInstances.concat(userInstances);
    if (variant === 'B') return architectureInstances.concat(userInstances);
    return architectureInstances.concat(diningInstances, roomInstances, userInstances);
  }

  function byId(id) {
    return manifest.props.filter(function (prop) { return prop.id === id; })[0];
  }

  function selectRoadhouse() {
    var scene = document.getElementById('wb-scene');
    if (!scene) return false;
    scene.value = 'roadhouse';
    scene.dispatchEvent(new Event('change', { bubbles: true }));
    return window.WB && window.WB.state().sceneId === 'roadhouse';
  }

  function installUi() {
    var stage = document.getElementById('wb-stage');
    var canvas = document.getElementById('wb-canvas');
    var side = document.getElementById('wb-side');
    stage.style.position = 'relative';

    var overlay = document.createElement('canvas');
    overlay.id = 'wb-prop-overlay';
    overlay.style.cssText = 'position:absolute;pointer-events:none;image-rendering:pixelated;z-index:3';
    stage.appendChild(overlay);

    var panel = document.createElement('section');
    panel.id = 'wb-prop-prototype';
    panel.innerHTML = '<h2>REFERENCE PROP PROTOTYPE</h2>' +
      '<div class="wb-muted">' + variant + ' — ' + variantNames[variant] + ' · click asset, then map tile · memory only</div>' +
      '<div id="wb-prop-catalog"></div>' +
      '<div class="wb-row"><span class="wb-k">collision</span><span class="wb-v">map rows (unchanged)</span></div>' +
      '<div class="wb-row"><span class="wb-k">instances</span><span class="wb-v" id="wb-prop-count"></span></div>';
    side.insertBefore(panel, side.firstChild);

    var catalog = panel.querySelector('#wb-prop-catalog');
    catalog.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:6px 0';
    manifest.props.forEach(function (prop) {
      var button = document.createElement('button');
      button.type = 'button';
      button.dataset.propId = prop.id;
      button.style.cssText = 'display:grid;grid-template-columns:40px 1fr;align-items:center;width:100%;min-width:0;padding:3px;text-align:left;font-size:10px';
      var preview = document.createElement('canvas');
      preview.width = 36; preview.height = 32;
      preview.style.cssText = 'width:36px;height:32px;image-rendering:pixelated;background:#241a1d';
      var pctx = preview.getContext('2d');
      pctx.imageSmoothingEnabled = false;
      var f = prop.frame;
      var scale = Math.min(1.5, 30 / f[3], 34 / f[2]);
      pctx.drawImage(atlas, f[0], f[1], f[2], f[3],
        Math.round((36 - f[2] * scale) / 2), Math.round((32 - f[3] * scale) / 2), f[2] * scale, f[3] * scale);
      button.appendChild(preview);
      button.appendChild(document.createTextNode(prop.label));
      button.onclick = function () {
        selectedId = selectedId === prop.id ? null : prop.id;
        Array.prototype.forEach.call(catalog.querySelectorAll('button'), function (b) {
          b.classList.toggle('on', b.dataset.propId === selectedId);
        });
      };
      catalog.appendChild(button);
    });

    function renderOverlay() {
      var rect = canvas.getBoundingClientRect();
      var stageRect = stage.getBoundingClientRect();
      overlay.width = canvas.width;
      overlay.height = canvas.height;
      overlay.style.left = (rect.left - stageRect.left + stage.scrollLeft) + 'px';
      overlay.style.top = (rect.top - stageRect.top + stage.scrollTop) + 'px';
      overlay.style.width = rect.width + 'px';
      overlay.style.height = rect.height + 'px';
      var ctx = overlay.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      var state = window.WB.state();
      if (state.sceneId !== 'roadhouse') return;
      var zoom = canvas.width / 16;
      var scale = zoom / manifest.nativeTilePx;
      activeInstances().slice().sort(function (a, b) {
        return (a.layer == null ? 1 : a.layer) - (b.layer == null ? 1 : b.layer) || a.ty - b.ty;
      }).forEach(function (instance) {
        var prop = byId(instance.propId);
        var f = prop.frame;
        var x = instance.tx * zoom - prop.anchor[0] * scale;
        var y = instance.ty * zoom - prop.anchor[1] * scale;
        var dw = Math.round(f[2] * scale), dh = Math.round(f[3] * scale);
        if (instance.flipX) {
          ctx.save(); ctx.translate(Math.round(x) + dw, Math.round(y)); ctx.scale(-1, 1);
          ctx.drawImage(atlas, f[0], f[1], f[2], f[3], 0, 0, dw, dh); ctx.restore();
        } else ctx.drawImage(atlas, f[0], f[1], f[2], f[3], Math.round(x), Math.round(y), dw, dh);
      });
      panel.querySelector('#wb-prop-count').textContent = String(activeInstances().length);
    }

    canvas.addEventListener('click', function (event) {
      if (!selectedId || window.WB.state().sceneId !== 'roadhouse') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      var rect = canvas.getBoundingClientRect();
      var tx = Math.max(0, Math.min(15, Math.floor((event.clientX - rect.left) / rect.width * 16)));
      var ty = Math.max(0, Math.min(9, Math.floor((event.clientY - rect.top) / rect.height * 10)));
      userInstances.push({ propId: selectedId, tx: tx + 0.5, ty: ty + 0.85 });
      renderOverlay();
    }, true);

    var switcher = document.createElement('div');
    switcher.style.cssText = 'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:20;display:flex;gap:8px;align-items:center;padding:7px 10px;border:1px solid #5ec8ff;border-radius:18px;background:#081018;color:#e6f6ff;box-shadow:0 4px 18px #000';
    switcher.innerHTML = '<button type="button" data-dir="-1">←</button><strong>' + variant + ' — ' + variantNames[variant] + '</strong><button type="button" data-dir="1">→</button>';
    document.body.appendChild(switcher);
    function cycle(delta) {
      var keys = ['A', 'B', 'C'];
      params.set('propPrototype', keys[(keys.indexOf(variant) + delta + keys.length) % keys.length]);
      location.search = params.toString();
    }
    switcher.querySelector('[data-dir="-1"]').onclick = function () { cycle(-1); };
    switcher.querySelector('[data-dir="1"]').onclick = function () { cycle(1); };
    document.addEventListener('keydown', function (event) {
      if (event.target.matches('input,textarea,[contenteditable]')) return;
      if (event.key === 'ArrowLeft') cycle(-1);
      if (event.key === 'ArrowRight') cycle(1);
    });

    document.getElementById('wb-scene').addEventListener('change', function () { setTimeout(renderOverlay, 0); });
    window.addEventListener('resize', function () { setTimeout(renderOverlay, 0); });
    renderOverlay();
    document.body.setAttribute('data-wb-props-ready', '1');
    document.title = 'TP-WB-PROP-READY ' + variant;
  }

  Promise.all([
    fetch(manifestUrl).then(function (response) {
      if (!response.ok) throw new Error('manifest HTTP ' + response.status);
      return response.json();
    }),
    new Promise(function (resolve, reject) { atlas.onload = resolve; atlas.onerror = reject; atlas.src = 'assets/prototypes/direct-reference/expanded/runtime/roadhouse-props-expanded-atlas.png'; })
  ]).then(function (results) {
    manifest = results[0];
    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      if (window.WB && selectRoadhouse()) { clearInterval(timer); installUi(); }
      else if (attempts > 100) { clearInterval(timer); throw new Error('World Builder did not become ready'); }
    }, 25);
  }).catch(function (error) {
    console.error('[world-builder-props-prototype]', error);
    document.title = 'TP-WB-PROP-ERROR';
  });
}());
