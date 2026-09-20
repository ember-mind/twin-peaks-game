/* lt-daylight.js — Living Town: what hour it is, as colour.
 *
 * `LT.DayLight.at(minuteOfDay)` is a pure function of one number. It reads no
 * clock, no simulation and no state, it allocates a fresh object every call,
 * and the same minute always answers the same. `LT.DayLight.apply` takes that
 * answer and tints a frame that is already drawn.
 *
 * What it gives a painter, and nothing more:
 *   glass, glassHi   the two window-pane values. A room hands these to the
 *                    interior kit's material so `kit.window` paints the sky
 *                    that is actually outside at that minute.
 *   ambient          one colour and one alpha, multiplied over the whole
 *                    frame: the room's own air.
 *   warm             one colour and one alpha, added back over the frame:
 *                    what the lamps put into the dark.
 *   lamps            whether the lamps are on at all, plus how strongly, for
 *                    a room that wants to skip its warm pools by day.
 *   phase            'night' | 'dawn' | 'day' | 'dusk', for a caption.
 *
 * Window light comes first and nothing else is offered. There are no
 * particles, no shafts, no bloom, and `apply` never blurs, resamples or
 * scales: it is two fillRects on whole pixels.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  var D = LT.DayLight = LT.DayLight || {};

  D.VERSION = 'activity-poses-v01';
  D.DAY_MINUTES = 1440;

  /* Keyframes, in minutes of the day. Between two of them everything is
   * eased, and the last one eases back into the first across midnight, so
   * there is no minute in the day where the picture jumps. */
  D.KEYS = [
    { at: 0,    phase: 'night', glass: '#141d2c', glassHi: '#22304a', ambient: '#232c52', amount: 0.62, warm: '#2e2210', glow: 0.05, lamp: 1 },
    { at: 270,  phase: 'night', glass: '#141d2c', glassHi: '#22304a', ambient: '#232c52', amount: 0.62, warm: '#2e2210', glow: 0.05, lamp: 1 },
    { at: 330,  phase: 'dawn',  glass: '#3b3a54', glassHi: '#59526e', ambient: '#36385e', amount: 0.54, warm: '#302410', glow: 0.06, lamp: 1 },
    { at: 420,  phase: 'dawn',  glass: '#c98a94', glassHi: '#efc4c0', ambient: '#5e5280', amount: 0.34, warm: '#392810', glow: 0.06, lamp: 0.7 },
    { at: 495,  phase: 'dawn',  glass: '#c3aeae', glassHi: '#ecdcd2', ambient: '#8a86a0', amount: 0.19, warm: '#33260f', glow: 0.04, lamp: 0.4 },
    { at: 585,  phase: 'day',   glass: '#a6c6d0', glassHi: '#d8ebe6', ambient: '#9fb0bc', amount: 0.06, warm: '#000000', glow: 0.00, lamp: 0 },
    { at: 720,  phase: 'day',   glass: '#9ec3cf', glassHi: '#d2e6e2', ambient: '#ffffff', amount: 0.00, warm: '#000000', glow: 0.00, lamp: 0 },
    { at: 960,  phase: 'day',   glass: '#a8c2c2', glassHi: '#dce6d8', ambient: '#e8ddc4', amount: 0.05, warm: '#000000', glow: 0.00, lamp: 0 },
    { at: 1035, phase: 'dusk',  glass: '#dba463', glassHi: '#f6d698', ambient: '#a07c56', amount: 0.14, warm: '#2e2008', glow: 0.03, lamp: 0.4 },
    { at: 1110, phase: 'dusk',  glass: '#cf6a32', glassHi: '#f5a24e', ambient: '#86583c', amount: 0.32, warm: '#3a2a10', glow: 0.05, lamp: 0.6 },
    { at: 1185, phase: 'dusk',  glass: '#6e4c6a', glassHi: '#a06e78', ambient: '#463a5f', amount: 0.48, warm: '#342610', glow: 0.06, lamp: 0.9 },
    { at: 1290, phase: 'night', glass: '#141d2c', glassHi: '#22304a', ambient: '#232c52', amount: 0.62, warm: '#2e2210', glow: 0.05, lamp: 1 }
  ];

  function rgb(hex) {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  }
  function hex(c) {
    return '#' + c.map(function (v) {
      var s = Math.max(0, Math.min(255, Math.round(v))).toString(16);
      return s.length < 2 ? '0' + s : s;
    }).join('');
  }
  function mixHex(a, b, k) {
    var x = rgb(a), y = rgb(b);
    return hex([x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k]);
  }
  /* Eased, not linear: a linear ramp has a visible corner at every keyframe,
   * and the corner is what a viewer reads as a jump. */
  function ease(k) { return k * k * (3 - 2 * k); }

  D.normalise = function (minute) {
    var m = Number(minute);
    if (!isFinite(m)) return 0;
    m = m % D.DAY_MINUTES;
    return m < 0 ? m + D.DAY_MINUTES : m;
  };

  D.at = function (minuteOfDay) {
    var m = D.normalise(minuteOfDay), keys = D.KEYS, i, a = keys[keys.length - 1], b = keys[0], span;
    for (i = 0; i < keys.length; i++) {
      if (keys[i].at <= m && (i + 1 === keys.length || keys[i + 1].at > m)) {
        a = keys[i];
        b = keys[(i + 1) % keys.length];
        break;
      }
    }
    if (m < keys[0].at) { a = keys[keys.length - 1]; b = keys[0]; }
    span = (b.at - a.at + D.DAY_MINUTES) % D.DAY_MINUTES || D.DAY_MINUTES;
    var travelled = (m - a.at + D.DAY_MINUTES) % D.DAY_MINUTES;
    var k = ease(Math.min(1, travelled / span));
    var lamp = a.lamp + (b.lamp - a.lamp) * k;
    return {
      minute: m,
      phase: k < 0.5 ? a.phase : b.phase,
      glass: mixHex(a.glass, b.glass, k),
      glassHi: mixHex(a.glassHi, b.glassHi, k),
      ambient: { color: mixHex(a.ambient, b.ambient, k), alpha: a.amount + (b.amount - a.amount) * k },
      warm: { color: mixHex(a.warm, b.warm, k), alpha: a.glow + (b.glow - a.glow) * k },
      lampStrength: lamp,
      lamps: lamp > 0.5
    };
  };

  /* A material a room can paint with at this minute: the room's own palette
   * with its two glass values replaced. Nothing else about the room changes,
   * because nothing else about the room is outdoors. */
  D.material = function (palette, light) {
    var out = {}, k;
    for (k in palette) out[k] = palette[k];
    out.glass = light.glass;
    out.glassHi = light.glassHi;
    return out;
  };

  /* Tints a frame that is already drawn. Two whole-pixel fillRects over the
   * region, one multiplied in and one added back; no filter, no shadow, no
   * gradient, no scaling, so every pixel keeps the value the painter gave it
   * or a flatly shifted one. */
  D.apply = function (g, light, opts) {
    if (!g || !light) return false;
    opts = opts || {};
    var x = opts.x || 0, y = opts.y || 0;
    var w = opts.width == null ? 256 : opts.width;
    var h = opts.height == null ? 192 : opts.height;
    var strength = opts.strength == null ? 1 : opts.strength;
    if (w <= 0 || h <= 0) return false;
    var old = g.globalCompositeOperation, alpha = g.globalAlpha;
    var smooth = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    if (light.ambient.alpha > 0 && strength > 0) {
      g.globalCompositeOperation = 'multiply';
      g.globalAlpha = Math.min(1, light.ambient.alpha * strength);
      g.fillStyle = light.ambient.color;
      g.fillRect(x, y, w, h);
    }
    if (light.warm.alpha > 0 && strength > 0 && opts.lamps !== false) {
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = Math.min(1, light.warm.alpha * strength);
      g.fillStyle = light.warm.color;
      g.fillRect(x, y, w, h);
    }
    g.globalCompositeOperation = old;
    g.globalAlpha = alpha;
    g.imageSmoothingEnabled = smooth;
    return true;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})();
