/* touch.js — controlli touch per dispositivi mobili: D-pad virtuale + pulsanti
 * A/B, che sintetizzano gli stessi eventi keydown/keyup ascoltati da engine.js
 * (nessuna modifica al motore: e' pura emulazione della tastiera).
 * Attivo solo su dispositivi touch-capable; su desktop non crea nulla nel DOM.
 */
(function () {
  if (typeof window === 'undefined') return; // ambiente node (test/smoke.js): niente DOM

  var isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (!isTouch) return;

  var DIR_CODE = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
  var DEAD = 24;              // raggio morto al centro del d-pad (px)
  var TAP_MAX_MS = 300;       // durata massima di un "tap" (per l'avanzamento dialoghi)
  var TAP_MAX_MOVE = 12;      // spostamento massimo di un "tap" (px)

  function css(el, props) {
    for (var k in props) if (props.hasOwnProperty(k)) el.style[k] = props[k];
  }

  function sendKey(type, code) {
    window.dispatchEvent(new KeyboardEvent(type, { code: code }));
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
    css(dpad, {
      position: 'fixed', left: '16px',
      bottom: 'calc(16px + env(safe-area-inset-bottom))',
      width: '150px', height: '150px',
      background: 'rgba(0,0,0,0.35)', borderRadius: '24px',
      touchAction: 'none', opacity: '0.5', zIndex: '9999',
      userSelect: 'none', webkitUserSelect: 'none', webkitTouchCallout: 'none'
    });

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
      css(span, {
        position: 'absolute', width: '28px', height: '28px',
        lineHeight: '28px', textAlign: 'center',
        color: 'rgba(255,255,255,0.7)', fontSize: '20px',
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
    var btn = document.createElement('div');
    btn.className = CTRL_CLASS;
    btn.textContent = opts.label;
    css(btn, {
      position: 'fixed', right: opts.right, bottom: opts.bottom,
      width: opts.size + 'px', height: opts.size + 'px',
      borderRadius: '50%',
      background: 'rgba(0,0,0,0.35)', border: '2px solid rgba(255,255,255,0.4)',
      color: 'rgba(255,255,255,0.8)', fontFamily: 'sans-serif',
      fontWeight: 'bold', fontSize: Math.round(opts.size * 0.4) + 'px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      touchAction: 'none', opacity: '0.5', zIndex: '9999',
      userSelect: 'none', webkitUserSelect: 'none', webkitTouchCallout: 'none'
    });

    var touchId = null;
    function onStart(e) {
      e.preventDefault();
      if (touchId !== null) return; // gia' un dito su questo pulsante
      touchId = e.changedTouches[0].identifier;
      sendKey('keydown', opts.code);
    }
    function onEnd(e) {
      e.preventDefault();
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          sendKey('keyup', opts.code);
        }
      }
    }
    btn.addEventListener('touchstart', onStart);
    btn.addEventListener('touchend', onEnd);
    btn.addEventListener('touchcancel', onEnd);
    noContextMenu(btn);
    return btn;
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
      if (dt < TAP_MAX_MS && moved < TAP_MAX_MOVE) {
        sendKey('keydown', 'Enter');
        sendKey('keyup', 'Enter');
      }
    }
  }

  /* ---------------- suggerimento iniziale ("tocca per iniziare") -------- */

  function buildHint() {
    var hint = document.createElement('div');
    hint.textContent = 'tocca per iniziare';
    css(hint, {
      position: 'fixed', left: '50%', bottom: '20%',
      transform: 'translateX(-50%)',
      color: 'rgba(255,255,255,0.8)', fontFamily: 'sans-serif',
      fontSize: '14px', letterSpacing: '1px',
      pointerEvents: 'none', zIndex: '9998'
    });
    return hint;
  }

  /* ---------------- avvio ---------------- */

  function setup() {
    var dpad = buildDpad();
    var btnA = buildButton({ label: 'A', code: 'Enter', size: 72, right: '20px', bottom: 'calc(90px + env(safe-area-inset-bottom))' });
    var btnB = buildButton({ label: 'B', code: 'Escape', size: 56, right: '96px', bottom: 'calc(20px + env(safe-area-inset-bottom))' });
    var hint = buildHint();

    document.body.appendChild(dpad);
    document.body.appendChild(btnA);
    document.body.appendChild(btnB);
    document.body.appendChild(hint);

    document.addEventListener('touchstart', onDocTouchStart, { passive: true });
    document.addEventListener('touchend', onDocTouchEnd, { passive: true });

    // rimuove il suggerimento al primo tocco, ovunque esso avvenga
    document.addEventListener('touchstart', function removeHint() {
      if (hint.parentNode) hint.parentNode.removeChild(hint);
      document.removeEventListener('touchstart', removeHint, true);
    }, { capture: true, once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
