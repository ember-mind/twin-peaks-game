/* main.js — bootstrap */
(function () {
  function hasTouchInput() {
    return ('ontouchstart' in window) || navigator.maxTouchPoints > 0 ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
      /(?:\?|&)touch=1(?:&|$)/.test(window.location.search);
  }

  function viewportSize() {
    var vv = window.visualViewport;
    return {
      width: Math.max(1, Math.round(vv ? vv.width : window.innerWidth)),
      height: Math.max(1, Math.round(vv ? vv.height : window.innerHeight))
    };
  }

  var PORTRAIT_CONTROL_GAP = 8;
  var PORTRAIT_CONTROL_HEIGHT = 144;
  var PORTRAIT_PANEL_EDGE = 8;
  var PORTRAIT_ORNAMENT_GAP = 16;
  var PORTRAIT_ORNAMENT_INSET = 24;

  function portraitPanelTop(viewport, stageHeight) {
    var panelHeight = stageHeight + PORTRAIT_CONTROL_GAP + PORTRAIT_CONTROL_HEIGHT;
    return Math.max(0, Math.floor((viewport.height - panelHeight) / 2));
  }

  // touch.js resta proprietario di input, safe-area, visibilita' e dimensioni.
  // Qui coordiniamo soltanto le sue coordinate portrait con quelle dello stage:
  // su 390x844 il framebuffer 256x192 resta 1x, ma display e controlli leggono
  // come un unico pannello centrato invece di due isole nella meta' superiore.
  function installPortraitComposition(stage) {
    if (!hasTouchInput() || !document.body || !document.querySelectorAll ||
        !document.createElement) {
      return function () {};
    }

    var panel = document.createElement('div');
    var rail = document.createElement('div');
    var header = document.createElement('div');
    var headerTitle = document.createElement('div');
    var headerSub = document.createElement('div');
    var footer = document.createElement('div');
    panel.id = 'tp-portrait-panel';
    panel.setAttribute('aria-hidden', 'true');
    rail.setAttribute('aria-hidden', 'true');
    header.setAttribute('aria-hidden', 'true');
    footer.setAttribute('aria-hidden', 'true');
    headerTitle.textContent = 'TWIN PEAKS';
    headerSub.textContent = 'CASO PALMER';
    header.appendChild(headerTitle);
    header.appendChild(headerSub);
    panel.appendChild(header);
    panel.appendChild(footer);
    document.body.appendChild(panel);
    document.body.appendChild(rail);
    var defaultStageZ = stage.style.zIndex;

    setStyle(panel, 'position', 'fixed');
    setStyle(panel, 'boxSizing', 'border-box');
    setStyle(panel, 'pointerEvents', 'none');
    setStyle(panel, 'zIndex', '1');
    setStyle(panel, 'background', 'linear-gradient(to bottom, #1b2d21 0, #17241b 31%, #17241b 69%, #1b2d21 100%)');
    setStyle(panel, 'border', '4px solid #d8d0a0');
    setStyle(panel, 'boxShadow', 'inset 0 0 0 4px #344438, 6px 6px 0 #080c09');
    setStyle(panel, 'clipPath', 'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)');
    setStyle(panel, 'overflow', 'hidden');
    setStyle(panel, 'visibility', 'hidden');
    setStyle(rail, 'position', 'fixed');
    setStyle(rail, 'left', 'calc(24px + env(safe-area-inset-left, 0px))');
    setStyle(rail, 'right', 'calc(24px + env(safe-area-inset-right, 0px))');
    setStyle(rail, 'height', '2px');
    setStyle(rail, 'zIndex', '3');
    setStyle(rail, 'pointerEvents', 'none');
    setStyle(rail, 'background', '#d8d0a0');
    setStyle(rail, 'boxShadow', '0 3px 0 #080c09');
    setStyle(rail, 'visibility', 'hidden');

    setStyle(header, 'position', 'absolute');
    setStyle(header, 'top', '48px');
    setStyle(header, 'left', '20px');
    setStyle(header, 'right', '20px');
    setStyle(header, 'height', '72px');
    setStyle(header, 'display', 'flex');
    setStyle(header, 'flexDirection', 'column');
    setStyle(header, 'alignItems', 'center');
    setStyle(header, 'justifyContent', 'center');
    setStyle(header, 'borderTop', '2px solid #344438');
    setStyle(header, 'borderBottom', '2px solid #344438');
    setStyle(header, 'boxShadow', '0 3px 0 #080c09');
    setStyle(header, 'fontFamily', 'ui-monospace, Menlo, Monaco, "Courier New", monospace');
    setStyle(header, 'textAlign', 'center');
    setStyle(headerTitle, 'color', '#fff8d0');
    setStyle(headerTitle, 'fontSize', '18px');
    setStyle(headerTitle, 'fontWeight', '800');
    setStyle(headerTitle, 'lineHeight', '24px');
    setStyle(headerTitle, 'letterSpacing', '4px');
    setStyle(headerTitle, 'textShadow', '3px 3px 0 #080c09');
    setStyle(headerSub, 'color', '#9aaa85');
    setStyle(headerSub, 'fontSize', '8px');
    setStyle(headerSub, 'fontWeight', '700');
    setStyle(headerSub, 'lineHeight', '14px');
    setStyle(headerSub, 'letterSpacing', '3px');

    setStyle(footer, 'position', 'absolute');
    setStyle(footer, 'left', '20px');
    setStyle(footer, 'right', '20px');
    setStyle(footer, 'bottom', '56px');
    setStyle(footer, 'height', '64px');
    setStyle(footer, 'display', 'flex');
    setStyle(footer, 'flexDirection', 'column');
    setStyle(footer, 'alignItems', 'center');
    setStyle(footer, 'justifyContent', 'center');
    setStyle(footer, 'gap', '6px');
    setStyle(footer, 'borderTop', '2px solid #344438');
    setStyle(footer, 'borderBottom', '2px solid #344438');
    for (var ventIndex = 0; ventIndex < 3; ventIndex++) {
      var vent = document.createElement('span');
      setStyle(vent, 'display', 'block');
      setStyle(vent, 'width', (144 - ventIndex * 32) + 'px');
      setStyle(vent, 'height', '4px');
      setStyle(vent, 'background', '#344438');
      setStyle(vent, 'boxShadow', '0 3px 0 #080c09');
      footer.appendChild(vent);
    }

    function setStyle(el, key, value) {
      if (el && el.style[key] !== value) el.style[key] = value;
    }

    function visible(el) {
      return !!el && el.style.visibility === 'visible';
    }

    function hidePanel() {
      setStyle(panel, 'visibility', 'hidden');
      setStyle(rail, 'visibility', 'hidden');
      setStyle(stage, 'zIndex', defaultStageZ);
    }

    function compose() {
      var viewport = viewportSize();
      if (viewport.height <= viewport.width) {
        hidePanel();
        return;
      }

      var engineState = GAME.Engine && GAME.Engine.state;
      /* La scocca c'e' dal titolo in poi: prima il quadro restava in alto e
       * A in un angolo, lontano dal pollice (audit 2026-09-24). */
      var gameplay = !!(engineState && (engineState.mode === 'play' || engineState.mode === 'title' || engineState.mode === 'intro'));
      if (!gameplay) {
        hidePanel();
        if (stage.__tpPortraitDefaultTop) {
          setStyle(stage, 'top', stage.__tpPortraitDefaultTop);
        }
        return;
      }

      var controls = document.querySelectorAll('.tp-touch-ctrl');
      var dpad = null;
      var buttons = [];
      for (var i = 0; i < controls.length; i++) {
        if (controls[i].tagName === 'BUTTON') buttons.push(controls[i]);
        else if (!dpad) dpad = controls[i];
      }
      if (!dpad || buttons.length < 2) return;

      var stageHeight = parseInt(stage.style.height, 10) || 192;
      var stageTop = portraitPanelTop(viewport, stageHeight);
      var controlTop = stageTop + stageHeight + PORTRAIT_CONTROL_GAP;
      var a = buttons[0], b = buttons[1];
      setStyle(stage, 'top', stageTop + 'px');
      setStyle(stage, 'zIndex', '2');
      setStyle(panel, 'left', 'calc(' + PORTRAIT_PANEL_EDGE + 'px + env(safe-area-inset-left, 0px))');
      setStyle(panel, 'right', 'calc(' + PORTRAIT_PANEL_EDGE + 'px + env(safe-area-inset-right, 0px))');
      setStyle(panel, 'top', 'calc(' + PORTRAIT_PANEL_EDGE + 'px + env(safe-area-inset-top, 0px))');
      setStyle(panel, 'bottom', 'calc(' + PORTRAIT_PANEL_EDGE + 'px + env(safe-area-inset-bottom, 0px))');
      setStyle(panel, 'height', 'auto');
      setStyle(panel, 'visibility', 'visible');
      // La scocca resta full-height. Su 390x844 il display non puo' superare
      // 1x senza il salto intero a 512px; usiamo quindi lo spazio residuo per
      // pannelli ornamentali continui, lasciando soltanto 16px attorno alle
      // due vere aree interattive invece di grandi fasce verticali morte.
      var ornamentDisplay = viewport.height >= 720 ? 'flex' : 'none';
      var ornamentHeight = Math.max(56, stageTop - PORTRAIT_PANEL_EDGE -
        PORTRAIT_ORNAMENT_INSET - PORTRAIT_ORNAMENT_GAP);
      setStyle(header, 'display', ornamentDisplay);
      setStyle(header, 'top', PORTRAIT_ORNAMENT_INSET + 'px');
      setStyle(header, 'height', ornamentHeight + 'px');
      setStyle(header, 'background', 'linear-gradient(to bottom, rgba(52,68,56,.28), rgba(8,12,9,.14))');
      setStyle(footer, 'display', ornamentDisplay);
      setStyle(footer, 'bottom', PORTRAIT_ORNAMENT_INSET + 'px');
      setStyle(footer, 'height', ornamentHeight + 'px');
      setStyle(footer, 'background', 'linear-gradient(to top, rgba(52,68,56,.28), rgba(8,12,9,.14))');
      setStyle(rail, 'top', (stageTop + stageHeight + 5) + 'px');
      setStyle(rail, 'visibility', 'visible');

      if (visible(dpad)) {
        // Gameplay: D-pad e pulsanti condividono una griglia centrale. A/B
        // hanno stessa baseline, target originali e 8px di separazione.
        setStyle(dpad, 'left', 'calc(24px + env(safe-area-inset-left, 0px))');
        setStyle(dpad, 'top', controlTop + 'px');
        setStyle(a, 'top', (controlTop + 36) + 'px');
        setStyle(a, 'right', 'calc(24px + env(safe-area-inset-right, 0px))');
        if (visible(b)) {
          setStyle(b, 'top', (controlTop + 36) + 'px');
          setStyle(b, 'right', 'calc(104px + env(safe-area-inset-right, 0px))');
        }
      } else {
        // Dialoghi/menu mantengono il controllo compatto centrato verticalmente
        // nella stessa plancia e sulla stessa colonna destra di A.
        var compact = visible(a) ? a : (visible(b) ? b : null);
        if (compact) {
          setStyle(compact, 'top', (controlTop + Math.floor((PORTRAIT_CONTROL_HEIGHT -
            (parseInt(compact.style.height, 10) || 50)) / 2)) + 'px');
          setStyle(compact, 'right', 'calc(24px + env(safe-area-inset-right, 0px))');
          setStyle(compact, 'bottom', 'auto');
        }
        // Titolo con salvataggio: B (nuova partita) accanto ad A, stessa riga.
        if (compact === a && visible(b)) {
          setStyle(b, 'top', (controlTop + Math.floor((PORTRAIT_CONTROL_HEIGHT -
            (parseInt(b.style.height, 10) || 42)) / 2)) + 'px');
          setStyle(b, 'right', 'calc(104px + env(safe-area-inset-right, 0px))');
          setStyle(b, 'bottom', 'auto');
        }
      }
    }

    // touch.js cambia modalita' nel proprio requestAnimationFrame. Seguendolo
    // con un watcher leggero evitiamo dipendenze da MutationObserver nei WebView
    // e ricomponiamo anche transizioni che non generano resize.
    function watchComposition() {
      compose();
      window.requestAnimationFrame(watchComposition);
    }
    window.requestAnimationFrame(watchComposition);
    return compose;
  }

  function boot() {
    var cv = document.getElementById('game');
    var stage = document.getElementById('stage');
    var composePortrait = function () {};
    function size() {
      // HeartGold-scale field: buffer nativo 256x192, nearest-neighbour.
      cv.width = 256;
      cv.height = 192;
      if (stage) {
        var viewport = viewportSize();
        var touch = hasTouchInput();
        var portrait = viewport.height > viewport.width;
        // Ritratto mobile: riserva l'area dei controlli prima di calcolare la
        // scala; installPortraitComposition centra poi il pannello completo.
        // Sopra 1x la scala resta SEMPRE intera: un pixel nativo non puo'
        // diventare largo 2px in una colonna e 3px nella successiva.
        var gameHeight = touch && portrait ? viewport.height * 0.54 : viewport.height;
        var fit = Math.min(viewport.width / 256, gameHeight / 192);
        /* Whole DEVICE pixels per native pixel: on a 3x phone a native pixel
         * can be 4 screen pixels (1.33 CSS) and stay even, instead of the
         * game staying at 256 CSS px on a 390 px screen (audit 2026-09-23).
         * On a 1x screen this is the whole-CSS-pixel scale it always was. */
        var dpr = Math.max(1, window.devicePixelRatio || 1);
        var scale = fit >= 1 ? Math.max(1, Math.floor(fit * dpr) / dpr) : fit;
        // Same native OBJ on desktop and mobile. Fractional actor transforms
        // create uneven pixel widths and make screenshots diverge by viewport.
        var actorScale = 1;
        var stageWidth = Math.round(256 * scale * dpr) / dpr;
        var stageHeight = Math.round(192 * scale * dpr) / dpr;
        stage.style.width = stageWidth + 'px';
        stage.style.height = stageHeight + 'px';
        stage.style.setProperty('--native-scale', scale);
        stage.style.left = Math.floor((viewport.width - stageWidth) / 2 * dpr) / dpr + 'px';
        stage.style.top = touch && portrait
          ? Math.max(0, Math.floor((gameHeight - stageHeight) / 2)) + 'px'
          : Math.floor((viewport.height - stageHeight) / 2) + 'px';
        stage.__tpPortraitDefaultTop = stage.style.top;
        if (GAME.Sprites && GAME.Sprites.setRuntimeActorScale) {
          GAME.Sprites.setRuntimeActorScale(actorScale);
        }
        stage.style.transform = 'none';
        composePortrait();
      }
      if (GAME.Engine.onResize) GAME.Engine.onResize();
    }
    size();
    if (stage) composePortrait = installPortraitComposition(stage);
    GAME.Engine.init(cv, null);
    GAME.Engine.onResize();
    window.addEventListener('resize', size);
    window.addEventListener('orientationchange', function () {
      window.requestAnimationFrame(size);
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', size);
    }
    if (GAME.Sprites && GAME.Sprites.castReady && typeof GAME.Sprites.castReady.then === 'function') {
      GAME.Sprites.castReady.then(function () { GAME.Engine.start(); }, function () { GAME.Engine.start(); });
    } else {
      GAME.Engine.start();
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
