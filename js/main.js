/* main.js — bootstrap */
(function () {
  function boot() {
    var cv = document.getElementById('game');
    var gl = document.getElementById('gl');
    function size() {
      var w = window.innerWidth, h = window.innerHeight;
      gl.width = w; gl.height = h;
      cv.height = 320;
      cv.width = Math.max(480, Math.round(320 * w / h));
      if (GAME.Render3D && GAME.Render3D.resize) GAME.Render3D.resize(w, h);
      if (GAME.Engine.onResize) GAME.Engine.onResize();
    }
    size();
    GAME.Engine.init(cv, gl);
    GAME.Engine.onResize();
    window.addEventListener('resize', size);
    GAME.Engine.start();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
