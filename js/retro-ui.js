/* retro-ui.js — proiezione canvas GBC 160x144 della UI narrativa DOM.
 * DOM resta sorgente semantica/accessibile e gestore input; visuale usa font
 * bitmap 5x7, scala intera e cornici tile-based in stile Game Boy.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || !window.document) return;
  var GAME = window.GAME = window.GAME || {};
  var doc = window.document, source, objective, canvas, ctx, hit = [], RF = GAME.RetroFont;
  var W = 160, H = 144;
  var lastSignature = '', engineOwned = false;
  var visualKey = '', visualPart = 0, visualView = null;

  var FONT = {
    'A':['01110','10001','10001','11111','10001','10001','10001'],
    'B':['11110','10001','10001','11110','10001','10001','11110'],
    'C':['01111','10000','10000','10000','10000','10000','01111'],
    'D':['11110','10001','10001','10001','10001','10001','11110'],
    'E':['11111','10000','10000','11110','10000','10000','11111'],
    'F':['11111','10000','10000','11110','10000','10000','10000'],
    'G':['01111','10000','10000','10111','10001','10001','01111'],
    'H':['10001','10001','10001','11111','10001','10001','10001'],
    'I':['11111','00100','00100','00100','00100','00100','11111'],
    'J':['00111','00010','00010','00010','10010','10010','01100'],
    'K':['10001','10010','10100','11000','10100','10010','10001'],
    'L':['10000','10000','10000','10000','10000','10000','11111'],
    'M':['10001','11011','10101','10101','10001','10001','10001'],
    'N':['10001','11001','10101','10011','10001','10001','10001'],
    'O':['01110','10001','10001','10001','10001','10001','01110'],
    'P':['11110','10001','10001','11110','10000','10000','10000'],
    'Q':['01110','10001','10001','10001','10101','10010','01101'],
    'R':['11110','10001','10001','11110','10100','10010','10001'],
    'S':['01111','10000','10000','01110','00001','00001','11110'],
    'T':['11111','00100','00100','00100','00100','00100','00100'],
    'U':['10001','10001','10001','10001','10001','10001','01110'],
    'V':['10001','10001','10001','10001','10001','01010','00100'],
    'W':['10001','10001','10001','10101','10101','10101','01010'],
    'X':['10001','10001','01010','00100','01010','10001','10001'],
    'Y':['10001','10001','01010','00100','00100','00100','00100'],
    'Z':['11111','00001','00010','00100','01000','10000','11111'],
    '0':['01110','10001','10011','10101','11001','10001','01110'],
    '1':['00100','01100','00100','00100','00100','00100','01110'],
    '2':['01110','10001','00001','00010','00100','01000','11111'],
    '3':['11110','00001','00001','01110','00001','00001','11110'],
    '4':['00010','00110','01010','10010','11111','00010','00010'],
    '5':['11111','10000','10000','11110','00001','00001','11110'],
    '6':['01110','10000','10000','11110','10001','10001','01110'],
    '7':['11111','00001','00010','00100','01000','01000','01000'],
    '8':['01110','10001','10001','01110','10001','10001','01110'],
    '9':['01110','10001','10001','01111','00001','00001','01110'],
    '.':['00000','00000','00000','00000','00000','00110','00110'],
    ',':['00000','00000','00000','00000','00110','00110','00100'],
    ':':['00000','00110','00110','00000','00110','00110','00000'],
    ';':['00000','00110','00110','00000','00110','00110','00100'],
    '!':['00100','00100','00100','00100','00100','00000','00100'],
    '?':['01110','10001','00001','00010','00100','00000','00100'],
    '"':['01010','01010','00000','00000','00000','00000','00000'],
    "'":['00100','00100','00000','00000','00000','00000','00000'],
    '-':['00000','00000','00000','11111','00000','00000','00000'],
    '/':['00001','00010','00010','00100','01000','01000','10000'],
    '(':['00010','00100','01000','01000','01000','00100','00010'],
    ')':['01000','00100','00010','00010','00010','00100','01000'],
    '[':['01110','01000','01000','01000','01000','01000','01110'],
    ']':['01110','00010','00010','00010','00010','00010','01110'],
    '+':['00000','00100','00100','11111','00100','00100','00000'],
    '>':['10000','01000','00100','00010','00100','01000','10000'],
    '<':['00001','00010','00100','01000','00100','00010','00001'],
    ' ' :['00000','00000','00000','00000','00000','00000','00000']
  };

  function clean(text) {
    return RF.clean(text);
  }

  function glyph(ctx2, ch, x, y, color) {
    RF.glyph(ctx2, ch, x, y, color, 1);
  }

  function text(ctx2, str, x, y, color, maxChars) {
    RF.draw(ctx2, str, x, y, color, { maxChars: maxChars, scale: 1 });
  }

  function wrap(str, chars) {
    return RF.wrapChars(str, chars);
  }

  function frame(x, y, w, h) {
    RF.frame(ctx, x, y, w, h);
  }

  function visibleRoot() {
    if (!source) return null;
    var roots = source.querySelectorAll('.nw-root');
    for (var i = roots.length - 1; i >= 0; i--) if (roots[i].style.display !== 'none') return roots[i];
    return null;
  }

  function renderObjective(rootEl) {
    /* Pokémon Oro non sovrappone quest banner al mondo. Obiettivo vive nel
     * fascicolo B: gameplay resta pixel-puro e leggibile su mobile. */
    return;
  }

  function directChildren(rootEl) {
    var out = [], kids = rootEl ? rootEl.children : [], i;
    for (i = 0; i < kids.length; i++) if (kids[i].style.display !== 'none') out.push(kids[i]);
    return out;
  }

  function pageBody(pageEl, nameEl) {
    var out = '';
    for (var i = 0; i < pageEl.childNodes.length; i++) {
      var n = pageEl.childNodes[i];
      if (n !== nameEl) out += n.textContent || '';
    }
    return out.trim();
  }

  function pageView(rootEl, isNotebook) {
    var pageEl = directChildren(rootEl).filter(function (e) { return e.classList.contains('nw-page'); })[0];
    if (!pageEl) return null;
    var portrait = pageEl.getAttribute('data-portrait');
    var chars = Math.floor((152 - (portrait ? 43 : 16)) / 6);
    var maxLines = isNotebook ? 14 : 4;
    var nameEl = pageEl.querySelector('.nw-name');
    var name = nameEl ? clean(nameEl.textContent).replace(/:\s*$/, '') : '';
    var nameLines = name ? wrap(name + ':', chars) : [];
    var body = pageBody(pageEl, nameEl), bodyLines = wrap(body, chars);
    var capacity = Math.max(1, maxLines - nameLines.length), chunks = [];
    if (!bodyLines.length) bodyLines = [''];
    for (var i = 0; i < bodyLines.length; i += capacity) chunks.push(bodyLines.slice(i, i + capacity));
    var key = (pageEl.getAttribute('data-page-id') || '') + '|' + (portrait || '') + '|' + name + '|' + body;
    if (key !== visualKey) { visualKey = key; visualPart = 0; }
    visualPart = Math.min(visualPart, chunks.length - 1);
    visualView = {
      kind: 'page', key: key, part: visualPart, parts: chunks.length,
      nameLines: nameLines, bodyLines: chunks[visualPart], sourceBody: body, portrait: portrait
    };
    rootEl.setAttribute('data-visual-part', String(visualPart + 1));
    rootEl.setAttribute('data-visual-parts', String(chunks.length));
    return visualView;
  }

  function advanceVisualPage() {
    var rootEl = visibleRoot();
    if (!rootEl || rootEl.classList.contains('nb-root') || rootEl.querySelector('.nw-opt')) return false;
    var view = pageView(rootEl, false);
    if (!view || visualPart >= view.parts - 1) return false;
    visualPart++; lastSignature = ''; render(true); return true;
  }

  function renderPanel(rootEl) {
    var kids = directChildren(rootEl), isNotebook = rootEl.classList.contains('nb-root');
    var options = kids.filter(function (e) { return e.classList.contains('nw-opt'); });
    var titleEl = kids.filter(function (e) { return e.classList.contains('nw-title'); })[0];
    var pageEl = kids.filter(function (e) { return e.classList.contains('nw-page'); })[0];
    var x = isNotebook ? 3 : 4, y, w = isNotebook ? 154 : 152, h;
    hit = [];
    if (isNotebook) { y = 3; h = 138; }
    else if (options.length) {
      var previewChars = Math.floor((w - 24) / 6);
      var focusedIndex = Math.max(0, options.findIndex(function (e) { return e.classList.contains('nw-focus'); }));
      var focusedCopy = clean(options[focusedIndex].textContent).replace(/^\s*[▶>]\s*/, '');
      var focusedLines = wrap(focusedCopy, Math.floor((w - 27) / 6));
      var previewTitle = titleEl ? wrap(titleEl.textContent, Math.floor((w - 14) / 6)).length : 0;
      var previewPage = pageEl ? wrap(pageEl.textContent, previewChars).length : 0;
      h = Math.min(138, 28 + focusedLines.length * 9 + previewTitle * 8 + (previewTitle ? 3 : 0) + previewPage * 8 + (previewPage ? 4 : 0)); y = 141 - h;
    }
    else { h = 50; y = 91; }
    frame(x, y, w, h);
    var cy = y + 7;
    if (titleEl) {
      var titleLines = wrap(titleEl.textContent, Math.floor((w - 14) / 6));
      for (var ti = 0; ti < titleLines.length; ti++) text(ctx, titleLines[ti], x + 7, cy + ti * 8, '#31543a');
      cy += titleLines.length * 8 + 3;
    }
    if (options.length) {
      if (pageEl) {
        var recoveryLines = wrap(pageEl.textContent, Math.floor((w - 24) / 6));
        for (var ri = 0; ri < recoveryLines.length; ri++) text(ctx, recoveryLines[ri], x + 8, cy + ri * 8, '#183225');
        cy += recoveryLines.length * 8 + 4;
      }
      var oi = Math.max(0, options.findIndex(function (e) { return e.classList.contains('nw-focus'); }));
      var copy = clean(options[oi].textContent).replace(/^\s*[▶>]\s*/, '');
      var optionLines = wrap(copy, Math.floor((w - 27) / 6));
      if (!optionLines.length) optionLines = [''];
      text(ctx, 'SCELTA ' + (oi + 1) + '/' + options.length, x + 8, cy, '#63834a'); cy += 9;
      var optionH = optionLines.length * 9;
      ctx.fillStyle = '#31543a'; ctx.fillRect(x + 5, cy - 1, w - 10, optionH);
      text(ctx, '>', x + 8, cy, '#f5efcf');
      for (var ol = 0; ol < optionLines.length; ol++) text(ctx, optionLines[ol], x + 20, cy + ol * 9, '#f5efcf', Math.floor((w - 27) / 6));
      hit.push({ y0: cy - 2, y1: cy + optionH, el: options[oi] });
      visualKey = ''; visualPart = 0;
      visualView = { kind: 'choice', index: oi, count: options.length, choiceLines: optionLines.slice(), sourceText: copy };
      rootEl.setAttribute('data-visual-choice', String(oi + 1) + '/' + options.length);
    } else if (pageEl) {
      var view = pageView(rootEl, isNotebook);
      var portrait = view.portrait, pi;
      for (pi = 0; pi < view.nameLines.length; pi++) text(ctx, view.nameLines[pi], x + 8, cy + pi * 9, '#31543a');
      cy += view.nameLines.length * 9;
      for (pi = 0; pi < view.bodyLines.length; pi++) text(ctx, view.bodyLines[pi], x + 8, cy + pi * 9, '#183225');
      if (portrait && GAME.Sprites && GAME.Sprites.CHARS[portrait]) {
        ctx.fillStyle = '#b8c087'; ctx.fillRect(x + w - 30, y + 6, 23, 33);
        ctx.fillStyle = '#31543a'; ctx.fillRect(x + w - 31, y + 5, 25, 1); ctx.fillRect(x + w - 31, y + 39, 25, 1);
        GAME.Sprites.drawChar(ctx, x + w - 27, y + 14, GAME.Sprites.CHARS[portrait], 'down', 0, 1, false, 0);
      }
    }
    if (!isNotebook) {
      ctx.fillStyle = '#31543a'; ctx.fillRect(x + w - 12, y + h - 9, 5, 2); ctx.fillRect(x + w - 11, y + h - 7, 3, 2); ctx.fillRect(x + w - 10, y + h - 5, 1, 1);
    }
  }

  function render(force) {
    if (!ctx) return;
    if (engineOwned) { ctx.clearRect(0, 0, W, H); return; }
    var rootEl = visibleRoot();
    var sig = (rootEl ? rootEl.textContent + '|' + rootEl.className + '|' + Array.prototype.map.call(rootEl.querySelectorAll('.nw-page'), function (e) { return e.getAttribute('data-portrait') || ''; }).join('|') + '|' + Array.prototype.map.call(rootEl.querySelectorAll('.nw-focus'), function (e) { return e.textContent; }).join('|') : '') + '|' + (objective ? objective.textContent + objective.style.display : '');
    if (!force && sig === lastSignature) return;
    lastSignature = sig;
    ctx.clearRect(0, 0, W, H);
    canvas.style.display = rootEl ? '' : 'none';
    canvas.style.pointerEvents = rootEl ? 'auto' : 'none';
    renderObjective(rootEl);
    if (rootEl) renderPanel(rootEl);
  }

  function boot() {
    source = doc.getElementById('narrative'); objective = doc.getElementById('objective');
    var stage = doc.getElementById('stage'); if (!source || !stage) return;
    canvas = doc.createElement('canvas'); canvas.id = 'retro-ui-canvas'; canvas.width = W; canvas.height = H;
    canvas.setAttribute('aria-hidden', 'true'); stage.appendChild(canvas); ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    source.classList.add('retro-semantic-ui'); if (objective) objective.classList.add('retro-semantic-ui');
    /* Poll leggero: evita differenze MutationObserver tra iframe/WebView mobile.
     * La firma rende il redraw no-op finché DOM narrativo non cambia. */
    window.setInterval(function () { render(false); }, 100);
    canvas.addEventListener('click', function (event) {
      var rect = canvas.getBoundingClientRect(), py = (event.clientY - rect.top) * H / rect.height;
      for (var i = 0; i < hit.length; i++) if (py >= hit[i].y0 && py <= hit[i].y1) { hit[i].el.click(); return; }
      if (advanceVisualPage()) return;
      var rootEl = visibleRoot(); if (rootEl) rootEl.click();
    });
    // Installato prima delle sessioni narrative: ogni A/Invio consuma prima
    // le continuazioni bitmap. Solo l'ultima lascia passare il commit reale.
    window.addEventListener('keydown', function (event) {
      if (engineOwned || event.repeat || (event.code !== 'Enter' && event.code !== 'KeyE')) return;
      if (advanceVisualPage()) { event.preventDefault(); event.stopImmediatePropagation(); }
    }, true);
    render(true);
  }

  function setEngineOwned(owned) {
    owned = !!owned;
    if (engineOwned === owned) return;
    engineOwned = owned; lastSignature = '';
    if (canvas) {
      if (ctx) ctx.clearRect(0, 0, W, H);
      canvas.style.display = owned ? 'none' : '';
      canvas.style.pointerEvents = 'none';
    }
    if (source) source.style.display = owned ? 'none' : '';
    if (!owned) render(true);
  }

  GAME.RetroUI = {
    render: function () { render(true); }, setEngineOwned: setEngineOwned,
    isEngineOwned: function () { return engineOwned; }, bitmapFont: true,
    inspect: function () { return visualView ? JSON.parse(JSON.stringify(visualView)) : null; }
  };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})();
