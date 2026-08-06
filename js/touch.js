/* touch.js — controlli touch per dispositivi mobili: D-pad virtuale + pulsanti
 * A/B, che sintetizzano gli stessi eventi keydown/keyup ascoltati da engine.js
 * (nessuna modifica al motore: e' pura emulazione della tastiera).
 * Attivo solo su dispositivi touch-capable; su desktop non crea nulla nel DOM.
 */
(function () {
  if (typeof window === 'undefined') return; // ambiente node (test/smoke.js): niente DOM

  // `?touch=1` permette audit ripetibili da browser desktop e controller
  // assistivi; sui telefoni il rilevamento resta automatico.
  var isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 ||
    /(?:\?|&)touch=1(?:&|$)/.test(window.location.search);
  if (!isTouch) return;

  // segnala al motore che i comandi sono touch: il titolo mostra le scritte giuste
  window.GAME = window.GAME || {};
  window.GAME.touchMode = true;

  var DIR_CODE = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
  var DEAD = 24;              // raggio morto al centro del d-pad (px)
  var TAP_MAX_MS = 300;       // durata massima di un "tap" (per l'avanzamento dialoghi)
  var TAP_MAX_MOVE = 12;      // spostamento massimo di un "tap" (px)
  var MENU_SWIPE_MOVE = 28;   // gesto verticale intenzionale nel fascicolo (px)

  function css(el, props) {
    for (var k in props) if (props.hasOwnProperty(k)) el.style[k] = props[k];
  }

  function sendKey(type, code) {
    window.dispatchEvent(new KeyboardEvent(type, { code: code }));
  }

  function pressKey(code) {
    sendKey('keydown', code);
    sendKey('keyup', code);
  }

  function noContextMenu(el) {
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  var CTRL_CLASS = 'tp-touch-ctrl';

  function isControlTarget(el) {
    while (el && el !== document.body) {
      if (el.className && (' ' + el.className + ' ').indexOf(' ' + CTRL_CLASS + ' ') >= 0) return true;
      el = el.parentNode;
    }
    return false;
  }

  /* ---------------- d-pad ---------------- */

  var dpadTouchId = null; // identifier del dito che controlla il d-pad (null = nessuno)
  var dpadDir = null;     // direzione attualmente "tenuta premuta"

  function dirFromPoint(rect, x, y) {
    var cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    var dx = x - cx, dy = y - cy;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < DEAD) return null;
    var deg = Math.atan2(dy, dx) * 180 / Math.PI; // -180..180, 0 = destra
    if (deg > -45 && deg <= 45) return 'right';
    if (deg > 45 && deg <= 135) return 'down';
    if (deg > 135 || deg <= -135) return 'left';
    return 'up';
  }

  function setDpadDir(dir) {
    if (dir === dpadDir) return;
    if (dpadDir) sendKey('keyup', DIR_CODE[dpadDir]);
    dpadDir = dir;
    if (dpadDir) sendKey('keydown', DIR_CODE[dpadDir]);
  }

  function buildDpad() {
    var dpad = document.createElement('div');
    dpad.className = CTRL_CLASS;
    dpad.setAttribute('role', 'group');
    dpad.setAttribute('aria-label', 'Controllo direzionale: muovi in quattro direzioni');
    css(dpad, {
      position: 'fixed',
      left: 'calc(16px + env(safe-area-inset-left, 0px))',
      bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
      width: '150px', height: '150px',
      background: 'transparent', border: '0', borderRadius: '0',
      boxShadow: 'none',
      touchAction: 'none', opacity: '1', zIndex: '9999',
      transition: 'none',
      userSelect: 'none', webkitUserSelect: 'none', webkitTouchCallout: 'none'
    });

    var cross = document.createElement('span');
    cross.setAttribute('aria-hidden', 'true');
    css(cross, {
      position: 'absolute', inset: '0', background: '#d8d0a0',
      clipPath: 'polygon(34% 0,66% 0,66% 34%,100% 34%,100% 66%,66% 66%,66% 100%,34% 100%,34% 66%,0 66%,0 34%,34% 34%)',
      filter: 'drop-shadow(4px 4px 0 #080c09)', pointerEvents: 'none'
    });
    dpad.appendChild(cross);
    var crossCore = document.createElement('span');
    crossCore.setAttribute('aria-hidden', 'true');
    css(crossCore, {
      position: 'absolute', inset: '5px', background: '#17241b',
      clipPath: 'polygon(34% 0,66% 0,66% 34%,100% 34%,100% 66%,66% 66%,66% 100%,34% 100%,34% 66%,0 66%,0 34%,34% 34%)',
      boxShadow: 'inset 0 0 0 2px #344438', pointerEvents: 'none'
    });
    dpad.appendChild(crossCore);

    var arrows = { up: '▲', down: '▼', left: '◀', right: '▶' };
    var pos = {
      up: { top: '6px', left: '50%', marginLeft: '-14px' },
      down: { bottom: '6px', left: '50%', marginLeft: '-14px' },
      left: { left: '6px', top: '50%', marginTop: '-14px' },
      right: { right: '6px', top: '50%', marginTop: '-14px' }
    };
    for (var d in arrows) {
      var span = document.createElement('span');
      span.textContent = arrows[d];
      span.setAttribute('aria-hidden', 'true');
      css(span, {
        position: 'absolute', width: '28px', height: '28px',
        lineHeight: '28px', textAlign: 'center',
        color: '#fff8d0', fontFamily: 'monospace', fontSize: '20px',
        pointerEvents: 'none'
      });
      css(span, pos[d]);
      dpad.appendChild(span);
    }

    function onStart(e) {
      e.preventDefault();
      if (dpadTouchId !== null) return; // gia' un dito sul d-pad
      var t = e.changedTouches[0];
      dpadTouchId = t.identifier;
      setDpadDir(dirFromPoint(dpad.getBoundingClientRect(), t.clientX, t.clientY));
    }
    function onMove(e) {
      e.preventDefault();
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.identifier === dpadTouchId) {
          setDpadDir(dirFromPoint(dpad.getBoundingClientRect(), t.clientX, t.clientY));
        }
      }
    }
    function onEnd(e) {
      e.preventDefault();
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === dpadTouchId) {
          dpadTouchId = null;
          setDpadDir(null);
        }
      }
    }

    dpad.addEventListener('touchstart', onStart);
    dpad.addEventListener('touchmove', onMove);
    dpad.addEventListener('touchend', onEnd);
    dpad.addEventListener('touchcancel', onEnd);
    noContextMenu(dpad);
    return dpad;
  }

  /* ---------------- pulsanti A/B ---------------- */

  function buildButton(opts) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = CTRL_CLASS;
    btn.textContent = opts.label;
    btn.setAttribute('aria-label', opts.ariaLabel);
    btn.setAttribute('title', opts.ariaLabel);
    css(btn, {
      position: 'fixed',
      right: 'calc(' + opts.right + 'px + env(safe-area-inset-right, 0px))',
      bottom: 'calc(' + opts.bottom + 'px + env(safe-area-inset-bottom, 0px))',
      width: opts.size + 'px', height: opts.size + 'px',
      borderRadius: '0',
      background: '#17241b', border: '4px solid #d8d0a0',
      boxShadow: 'inset 0 0 0 2px #344438, 4px 4px 0 #080c09',
      clipPath: 'polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)',
      color: '#fff8d0', fontFamily: 'monospace',
      fontWeight: 'bold', fontSize: Math.round(opts.size * 0.4) + 'px',
      padding: '0', margin: '0', lineHeight: '1', appearance: 'none',
      webkitAppearance: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column',
      touchAction: 'none', opacity: '1', zIndex: '9999',
      transition: 'none',
      userSelect: 'none', webkitUserSelect: 'none', webkitTouchCallout: 'none'
    });

    var touchId = null, ignoreClickUntil = 0, activeCode = null;
    function currentCode() {
      var game = window.GAME || {};
      if (opts.secondary && interactionMode() === 'play' && game.NarrativeAdapter &&
          game.NarrativeAdapter.isNotebookEnabled && game.NarrativeAdapter.isNotebookEnabled()) return 'KeyT';
      return opts.code;
    }
    function onStart(e) {
      e.preventDefault();
      if (touchId !== null) return; // gia' un dito su questo pulsante
      touchId = e.changedTouches[0].identifier;
      btn.style.transform = 'translate(2px, 2px)';
      btn.style.boxShadow = 'inset 0 0 0 3px #344438, 1px 1px 0 #080c09';
      activeCode = currentCode();
      sendKey('keydown', activeCode);
    }
    function onEnd(e) {
      e.preventDefault();
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          sendKey('keyup', activeCode || currentCode());
          activeCode = null;
          btn.style.transform = 'scale(1)';
          btn.style.boxShadow = 'inset 0 0 0 2px #344438, 4px 4px 0 #080c09';
          ignoreClickUntil = now() + 500; // il click sintetico del touch non deve duplicare l'azione
        }
      }
    }
    function onClick(e) {
      e.preventDefault();
      if (now() < ignoreClickUntil) return;
      pressKey(currentCode()); // attivazione da switch-control/screen reader/tastiera
    }
    btn.addEventListener('touchstart', onStart);
    btn.addEventListener('touchend', onEnd);
    btn.addEventListener('touchcancel', onEnd);
    btn.addEventListener('click', onClick);
    noContextMenu(btn);
    return btn;
  }

  function buttonFace(btn, letter, hint) {
    while (btn.children && btn.children.length) btn.removeChild(btn.children[0]);
    btn.textContent = '';
    var main = document.createElement('span');
    main.textContent = letter;
    css(main, { display: 'block', fontSize: '22px', lineHeight: '20px', pointerEvents: 'none' });
    btn.appendChild(main);
    if (hint) {
      var sub = document.createElement('span');
      sub.textContent = hint;
      css(sub, { display: 'block', fontSize: '8px', lineHeight: '10px', letterSpacing: '1px', pointerEvents: 'none' });
      btn.appendChild(sub);
    }
  }

  /* ---------------- layout per stato di gioco ---------------- */

  var uiDpad = null, uiA = null, uiB = null;
  var controlMode = '';

  function viewportSize() {
    var vv = window.visualViewport;
    return {
      width: Math.max(1, Math.round(vv ? vv.width : window.innerWidth)),
      height: Math.max(1, Math.round(vv ? vv.height : window.innerHeight))
    };
  }

  function playLayout() {
    var vp = viewportSize(), landscape = vp.width > vp.height;
    var shortSide = Math.min(vp.width, vp.height);
    var stage = document.getElementById ? document.getElementById('stage') : null;
    var rect = stage ? stage.getBoundingClientRect() : { left: 0, right: vp.width, top: 0, height: vp.height };
    var side = landscape ? Math.max(0, Math.min(rect.left, vp.width - rect.right)) : 0;
    var gutter = landscape && side >= 88;
    var dpad = landscape ? Math.min(144, Math.max(96, side - 24)) : (vp.width < 360 ? 128 : 144);
    return {
      landscape: landscape, gutter: gutter, dpad: dpad,
      dpadLeft: Math.max(8, Math.round((rect.left - dpad) / 2)),
      dpadTop: Math.max(8, Math.round((vp.height - dpad) / 2)),
      gutterRight: Math.max(8, Math.round((vp.width - rect.right - 64) / 2)),
      edge: landscape ? 10 : 16,
      a: landscape ? 64 : 72,
      aRight: landscape ? 14 : 20,
      aBottom: landscape ? 76 : 90,
      b: landscape ? 64 : 72,
      bRight: landscape ? 82 : 96,
      bBottom: landscape ? 14 : 20
    };
  }

  function narrativeChoiceActive() {
    // DOM semantico = fonte immediata; RetroUI.inspect copre anche WebView
    // dove il selettore complesso puo' non essere ancora aggiornato.
    if (document.querySelectorAll) {
      var roots = document.querySelectorAll('#narrative .nw-root');
      for (var i = roots.length - 1; i >= 0; i--) {
        var root = roots[i];
        var isNotebook = (' ' + (root.className || '') + ' ').indexOf(' nb-root ') >= 0;
        if (!isNotebook && root.style.display !== 'none' && root.querySelector && root.querySelector('.nw-opt')) return true;
      }
    }
    var retro = window.GAME && window.GAME.RetroUI;
    var view = retro && retro.inspect ? retro.inspect() : null;
    return !!(view && view.kind === 'choice');
  }

  function recoveryChoiceActive() {
    if (!document.querySelectorAll) return false;
    var options = document.querySelectorAll('#narrative .nw-save-recovery .nw-opt');
    return !!(options && options.length > 1);
  }

  function interactionMode() {
    var game = window.GAME || {};
    // Recovery vive sopra titolo/boot, fuori da adapter e finale. Deve comunque
    // usare lo stesso contratto touch delle altre scelte: D-pad + A.
    if (recoveryChoiceActive()) return 'narrative-choice';
    if (game.NarrativeFinaleProduction && game.NarrativeFinaleProduction.isActive &&
        game.NarrativeFinaleProduction.isActive()) return narrativeChoiceActive() ? 'narrative-choice' : 'narrative';
    if (game.NarrativeAdapter && game.NarrativeAdapter.active &&
        game.NarrativeAdapter.active()) return narrativeChoiceActive() ? 'narrative-choice' : 'narrative';
    var st = game.Engine && game.Engine.state;
    if (!st) return 'advance';
    if (st.menu) return st.menuDocument ? 'menu-document' : 'menu';
    if (st.dialogue) return 'dialogue';
    if (st.mode === 'play') return 'play';
    if (st.mode === 'title') return 'title';
    return 'advance'; // intro e finale: serve soltanto avanzare
  }

  function showControl(el, visible, opacity) {
    if (!el) return;
    el.style.visibility = visible ? 'visible' : 'hidden';
    el.style.pointerEvents = visible ? 'auto' : 'none';
    /* Controlli opachi e pixel-authored: niente bolle traslucide sopra il
     * mondo. `opacity` resta parametro compatibile ma non cambia il look. */
    el.style.opacity = visible ? '1' : '0';
    el.style.transform = visible ? 'scale(1)' : 'scale(0.88)';
    el.setAttribute('aria-hidden', visible ? 'false' : 'true');
    if (el.tagName === 'BUTTON') el.tabIndex = visible ? 0 : -1;
  }

  function compactTopButton(btn, size, top, right) {
    css(btn, {
      width: size + 'px', height: size + 'px',
      top: 'calc(' + top + 'px + env(safe-area-inset-top, 0px))',
      right: 'calc(' + right + 'px + env(safe-area-inset-right, 0px))',
      bottom: 'auto',
      fontSize: Math.round(size * 0.38) + 'px'
    });
  }

  function restorePlayButton(btn, size, right, bottom) {
    css(btn, {
      width: size + 'px', height: size + 'px',
      top: 'auto',
      right: 'calc(' + right + 'px + env(safe-area-inset-right, 0px))',
      bottom: 'calc(' + bottom + 'px + env(safe-area-inset-bottom, 0px))',
      fontSize: Math.round(size * 0.4) + 'px'
    });
  }

  function placeGutterButton(btn, size, right, top) {
    css(btn, {
      width: size + 'px', height: size + 'px',
      top: top + 'px',
      right: right + 'px', bottom: 'auto',
      fontSize: Math.round(size * 0.4) + 'px'
    });
  }

  function syncControls(force) {
    var mode = interactionMode();
    if (mode === controlMode && !force) return;
    controlMode = mode;

    // Lasciare un d-pad nascosto con una direzione attiva farebbe camminare
    // Cooper dietro al menu/dialogo: rilascia sempre il lease direzionale.
    if (mode !== 'play') {
      dpadTouchId = null;
      setDpadDir(null);
    }

    if (mode === 'play') {
      var layout = playLayout();
      if (layout.gutter) {
        css(uiDpad, {
          left: layout.dpadLeft + 'px', top: layout.dpadTop + 'px', bottom: 'auto',
          width: layout.dpad + 'px', height: layout.dpad + 'px', borderRadius: '0'
        });
        placeGutterButton(uiA, 64, layout.gutterRight, Math.round(viewportSize().height / 2 - 76));
        placeGutterButton(uiB, 64, layout.gutterRight + 58, Math.round(viewportSize().height / 2 + 18));
      } else {
        css(uiDpad, {
          left: 'calc(' + layout.edge + 'px + env(safe-area-inset-left, 0px))', top: 'auto',
          bottom: 'calc(' + layout.edge + 'px + env(safe-area-inset-bottom, 0px))',
          width: layout.dpad + 'px', height: layout.dpad + 'px', borderRadius: '0'
        });
        restorePlayButton(uiA, layout.a, layout.aRight, layout.aBottom);
        restorePlayButton(uiB, layout.b, layout.bRight, layout.bBottom);
      }
      buttonFace(uiA, 'A', 'AZIONE');
      var game = window.GAME || {};
      var notebook = game.NarrativeAdapter && game.NarrativeAdapter.isNotebookEnabled && game.NarrativeAdapter.isNotebookEnabled();
      buttonFace(uiB, 'B', notebook ? 'TACCUINO' : 'MENU');
      uiA.setAttribute('aria-label', 'Interagisci');
      uiB.setAttribute('aria-label', 'Apri fascicolo indizi');
      showControl(uiDpad, true, 0.85);
      showControl(uiA, true, 0.85);
      showControl(uiB, true, 0.85);
    } else if (mode === 'menu' || mode === 'menu-document') {
      // Il fascicolo usa tutto il portrait: niente overlay in basso.
      // Swipe cambia prova/pagina; tap apre o avanza; × torna indietro.
      var menuLayout = playLayout();
      if (menuLayout.gutter) placeGutterButton(uiB, 64, menuLayout.gutterRight, Math.round(viewportSize().height / 2 - 32));
      else compactTopButton(uiB, 44, 10, 10);
      buttonFace(uiB, '×', mode === 'menu-document' ? 'INDIETRO' : 'CHIUDI');
      uiB.setAttribute('aria-label', mode === 'menu-document' ? 'Torna al fascicolo indizi' : 'Chiudi fascicolo indizi');
      showControl(uiDpad, false, 0);
      showControl(uiA, false, 0);
      showControl(uiB, true, 0.72);
    } else if (mode === 'narrative-choice') {
      // Il canvas mostra una sola opzione alla volta. D-pad cambia focus;
      // A conferma. Stessi key event della tastiera, quindi nessun secondo
      // percorso di commit e nessun doppio avanzamento da touch sintetico.
      var choiceLayout = playLayout();
      if (choiceLayout.gutter) {
        css(uiDpad, {
          left: choiceLayout.dpadLeft + 'px', top: choiceLayout.dpadTop + 'px', bottom: 'auto',
          width: choiceLayout.dpad + 'px', height: choiceLayout.dpad + 'px', borderRadius: '0'
        });
        placeGutterButton(uiA, 64, choiceLayout.gutterRight, Math.round(viewportSize().height / 2 - 32));
      } else {
        css(uiDpad, {
          left: 'calc(' + choiceLayout.edge + 'px + env(safe-area-inset-left, 0px))', top: 'auto',
          bottom: 'calc(' + choiceLayout.edge + 'px + env(safe-area-inset-bottom, 0px))',
          width: choiceLayout.dpad + 'px', height: choiceLayout.dpad + 'px', borderRadius: '0'
        });
        restorePlayButton(uiA, choiceLayout.a, choiceLayout.aRight, choiceLayout.aBottom);
      }
      buttonFace(uiA, 'A', 'SCEGLI');
      uiA.setAttribute('aria-label', 'Conferma scelta');
      showControl(uiDpad, true, 0.85);
      showControl(uiA, true, 0.85);
      showControl(uiB, false, 0);
    } else if (mode === 'narrative' || mode === 'dialogue' || mode === 'advance') {
      var advanceLayout = playLayout();
      if (advanceLayout.gutter) placeGutterButton(uiA, 64, advanceLayout.gutterRight, Math.round(viewportSize().height / 2 - 32));
      else compactTopButton(uiA, 50, 12, 12);
      buttonFace(uiA, 'A', 'AVANTI');
      uiA.setAttribute('aria-label', (mode === 'dialogue' || mode === 'narrative') ? 'Avanza dialogo' : 'Continua');
      showControl(uiDpad, false, 0);
      showControl(uiA, true, 0.68);
      showControl(uiB, false, 0);
    } else if (mode === 'title') {
      var titleLayout = playLayout();
      if (titleLayout.gutter) {
        placeGutterButton(uiA, 64, titleLayout.gutterRight, Math.round(viewportSize().height / 2 - 70));
        placeGutterButton(uiB, 64, titleLayout.gutterRight + 58, Math.round(viewportSize().height / 2 + 20));
      } else {
        compactTopButton(uiA, 50, 12, 12);
        compactTopButton(uiB, 42, 70, 16);
      }
      buttonFace(uiA, 'A', 'CONTINUA');
      buttonFace(uiB, 'B', 'NUOVA');
      uiA.setAttribute('aria-label', 'Continua partita');
      uiB.setAttribute('aria-label', 'Nuova partita');
      showControl(uiDpad, false, 0);
      showControl(uiA, true, 0.68);
      showControl(uiB, true, 0.58);
    } else {
      showControl(uiDpad, false, 0);
      showControl(uiA, false, 0);
      showControl(uiB, false, 0);
    }
  }

  function watchControls() {
    syncControls();
    window.requestAnimationFrame(watchControls);
  }

  /* ---------------- tap ovunque = A (avanza dialoghi/titolo) ---------------- */

  var tapId = null, tapX = 0, tapY = 0, tapT = 0;

  function now() { return (typeof performance !== 'undefined') ? performance.now() : Date.now(); }

  function onDocTouchStart(e) {
    if (isControlTarget(e.target)) return;
    if (tapId !== null) return; // un tap potenziale e' gia' in corso
    var t = e.changedTouches[0];
    tapId = t.identifier;
    tapX = t.clientX; tapY = t.clientY;
    tapT = now();
  }

  function onDocTouchEnd(e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (t.identifier !== tapId) continue;
      var dt = now() - tapT;
      var dx = t.clientX - tapX, dy = t.clientY - tapY;
      var moved = Math.sqrt(dx * dx + dy * dy);
      tapId = null;
      if (interactionMode().indexOf('menu') === 0 && dt < 900 &&
          Math.abs(dy) >= MENU_SWIPE_MOVE && Math.abs(dy) > Math.abs(dx) * 1.15) {
        pressKey(dy < 0 ? 'ArrowUp' : 'ArrowDown');
        return;
      }
      // UI narrativa bitmap gestisce il proprio click. Inviare anche Enter
      // avanzerebbe due nodi con un solo tap su Safari/Chrome mobile.
      if (interactionMode().indexOf('narrative') === 0) return;
      if (dt < TAP_MAX_MS && moved < TAP_MAX_MOVE) {
        pressKey('Enter');
      }
    }
  }

  /* ---------------- avvio ---------------- */

  function setup() {
    uiDpad = buildDpad();
    uiA = buildButton({ label: 'A', ariaLabel: 'Interagisci', code: 'Enter', size: 72, right: 20, bottom: 90 });
    uiB = buildButton({ label: 'B', ariaLabel: 'Apri fascicolo indizi', code: 'Escape', secondary: true, size: 56, right: 96, bottom: 20 });
    document.body.appendChild(uiDpad);
    document.body.appendChild(uiA);
    document.body.appendChild(uiB);

    document.addEventListener('touchstart', onDocTouchStart, { passive: true });
    document.addEventListener('touchend', onDocTouchEnd, { passive: true });

    syncControls();
    window.addEventListener('resize', function () { syncControls(true); });
    window.addEventListener('orientationchange', function () { syncControls(true); });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () { syncControls(true); });
    }
    window.addEventListener('blur', function () {
      dpadTouchId = null;
      setDpadDir(null);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        dpadTouchId = null;
        setDpadDir(null);
      }
    });
    window.requestAnimationFrame(watchControls);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
