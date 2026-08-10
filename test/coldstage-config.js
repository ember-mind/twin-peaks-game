const assert = require('node:assert/strict');

(async function () {
  const config = (await import('../coldstage.config.mjs')).default;

  assert.deepEqual(config.selectChanged(['Twin Peaks Game.md']), []);
  assert.deepEqual(config.selectChanged(['js/touch.js']), ['mobile']);
  assert.deepEqual(config.selectChanged(['narrative/missions/M8.json']), ['gameplay', 'visual']);
  assert.deepEqual(config.selectChanged(['assets/sprites/cooper.png']), [
    'desktop',
    'gameplay',
    'mobile',
    'visual',
  ]);
  assert.deepEqual(config.selectChanged(['js/engine.js']), [
    'desktop',
    'gameplay',
    'mobile',
    'visual',
  ]);

  console.log('Coldstage routing: 5/5 controlli superati ✔');
})().catch(function (error) {
  console.error(error);
  process.exitCode = 1;
});
