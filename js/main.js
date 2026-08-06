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

  function boot() {
    var cv = document.getElementById('game');
    function size() {
      // Game Boy Color: buffer nativo 160x144, ingrandito nearest-neighbour.
      cv.width = 160;
      cv.height = 144;
      var stage = document.getElementById('stage');
      if (stage) {
        var viewport = viewportSize();
        var touch = hasTouchInput();
        var portrait = viewport.height > viewport.width;
        // Ritratto mobile: schermo nel settore superiore, controlli nel settore
        // inferiore. Scala a ottavi: quasi piena larghezza e pixel ancora netti.
        var gameHeight = touch && portrait ? viewport.height * 0.54 : viewport.height;
        var fit = Math.min(viewport.width / 160, gameHeight / 144);
        var scale = touch
          ? (portrait ? Math.max(0.5, Math.floor(fit * 8) / 8) : (fit >= 1 ? Math.max(1, Math.floor(fit)) : fit))
          : (fit >= 1 ? Math.max(1, Math.floor(fit)) : fit);
        var stageWidth = Math.floor(160 * scale);
        var stageHeight = Math.floor(144 * scale);
        stage.style.width = stageWidth + 'px';
        stage.style.height = stageHeight + 'px';
        stage.style.left = Math.floor((viewport.width - stageWidth) / 2) + 'px';
        stage.style.top = touch && portrait
          ? Math.max(0, Math.floor((gameHeight - stageHeight) / 2)) + 'px'
          : Math.floor((viewport.height - stageHeight) / 2) + 'px';
        stage.style.transform = 'none';
      }
      if (GAME.Engine.onResize) GAME.Engine.onResize();
    }
    size();
    GAME.Engine.init(cv, null);
    GAME.Engine.onResize();
    window.addEventListener('resize', size);
    window.addEventListener('orientationchange', function () {
      window.requestAnimationFrame(size);
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', size);
    }
    GAME.Engine.start();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
