const assert = require('node:assert/strict');

(async function () {
  const config = (await import('../coldstage.config.mjs')).default;

  assert.deepEqual(config.selectChanged(['Twin Peaks Game.md']), []);
  assert.deepEqual(config.selectChanged(['js/touch.js']), [
    'mobile',
    'mobileGameplay',
    'mobileLandscapeGameplay',
  ]);
  assert.deepEqual(config.selectChanged(['narrative/missions/M8.json']), ['gameplay', 'visual']);
  assert.deepEqual(config.selectChanged(['assets/sprites/cooper.png']), [
    'desktop',
    'gameplay',
    'mobile',
    'mobileGameplay',
    'mobileLandscapeGameplay',
    'cooperDown',
    'cooperUp',
    'cooperRight',
    'cooperLeft',
    'visual',
  ]);
  assert.deepEqual(config.selectChanged(['js/retro-cast-matrices-a.js']), [
    'desktop',
    'gameplay',
    'mobile',
    'mobileGameplay',
    'mobileLandscapeGameplay',
    'cooperDown',
    'cooperUp',
    'cooperRight',
    'cooperLeft',
    'visual',
  ]);
  assert.deepEqual(config.selectChanged(['js/engine.js']), [
    'desktop',
    'gameplay',
    'mobile',
    'mobileGameplay',
    'mobileLandscapeGameplay',
    'cooperDown',
    'cooperUp',
    'cooperRight',
    'cooperLeft',
    'visual',
  ]);

  console.log('Coldstage routing: 6/6 controlli superati ✔');
})().catch(function (error) {
  console.error(error);
  process.exitCode = 1;
});
