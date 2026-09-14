/* PROTOTYPE — opt-in atomic prop catalog on actual World Builder.
 * Open world-builder.html?propPrototype=1. No exports; no map/collision mutation. */
(function () {
  'use strict';

  var manifestUrl = 'assets/prototypes/direct-reference/roadhouse-props.prototype.json';
  var atlas = new Image();
  var manifest;
  var selectedId = null;
  var instances = [
    { propId: 'roadhouse.pendant.brass', tx: 4, ty: 1.05 },
    { propId: 'roadhouse.pendant.brass', tx: 11, ty: 1.05 },
    { propId: 'roadhouse.table.round', tx: 7.5, ty: 7 },
    { propId: 'roadhouse.chair.red', tx: 6.8, ty: 7.65 },
    { propId: 'roadhouse.chair.red', tx: 9.25, ty: 7.65 },
    { propId: 'roadhouse.candle.brass', tx: 8.3, ty: 6.9 }
  ];

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
      '<div class="wb-muted">Atomic sprites · click asset, then map tile · memory only</div>' +
      '<div id="wb-prop-catalog"></div>' +
      '<div class="wb-row"><span class="wb-k">collision</span><span class="wb-v">map rows (unchanged)</span></div>' +
      '<div class="wb-row"><span class="wb-k">instances</span><span class="wb-v" id="wb-prop-count"></span></div>';
    side.insertBefore(panel, side.firstChild);

    var catalog = panel.querySelector('#wb-prop-catalog');
    manifest.props.forEach(function (prop) {
      var button = document.createElement('button');
      button.type = 'button';
      button.dataset.propId = prop.id;
      button.style.cssText = 'display:grid;grid-template-columns:56px 1fr;align-items:center;width:100%;margin:6px 0;text-align:left';
      var preview = document.createElement('canvas');
      preview.width = 48; preview.height = 40;
      preview.style.cssText = 'width:48px;height:40px;image-rendering:pixelated;background:#241a1d';
      var pctx = preview.getContext('2d');
      pctx.imageSmoothingEnabled = false;
      var f = prop.frame;
      var scale = Math.min(2, 36 / f[3]);
      pctx.drawImage(atlas, f[0], f[1], f[2], f[3],
        Math.round((48 - f[2] * scale) / 2), Math.round((40 - f[3] * scale) / 2), f[2] * scale, f[3] * scale);
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
      instances.slice().sort(function (a, b) { return a.ty - b.ty; }).forEach(function (instance) {
        var prop = byId(instance.propId);
        var f = prop.frame;
        var x = instance.tx * zoom - prop.anchor[0] * scale;
        var y = instance.ty * zoom - prop.anchor[1] * scale;
        ctx.drawImage(atlas, f[0], f[1], f[2], f[3], Math.round(x), Math.round(y),
          Math.round(f[2] * scale), Math.round(f[3] * scale));
      });
      panel.querySelector('#wb-prop-count').textContent = String(instances.length);
    }

    canvas.addEventListener('click', function (event) {
      if (!selectedId || window.WB.state().sceneId !== 'roadhouse') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      var rect = canvas.getBoundingClientRect();
      var tx = Math.max(0, Math.min(15, Math.floor((event.clientX - rect.left) / rect.width * 16)));
      var ty = Math.max(0, Math.min(9, Math.floor((event.clientY - rect.top) / rect.height * 10)));
      instances.push({ propId: selectedId, tx: tx + 0.5, ty: ty + 0.85 });
      renderOverlay();
    }, true);

    document.getElementById('wb-scene').addEventListener('change', function () { setTimeout(renderOverlay, 0); });
    window.addEventListener('resize', function () { setTimeout(renderOverlay, 0); });
    renderOverlay();
    document.body.setAttribute('data-wb-props-ready', '1');
    document.title = 'TP-WB-PROP-READY';
  }

  Promise.all([
    fetch(manifestUrl).then(function (response) {
      if (!response.ok) throw new Error('manifest HTTP ' + response.status);
      return response.json();
    }),
    new Promise(function (resolve, reject) { atlas.onload = resolve; atlas.onerror = reject; atlas.src = 'assets/prototypes/direct-reference/runtime/roadhouse-props-atlas.png'; })
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
