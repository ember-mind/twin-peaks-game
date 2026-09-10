// Isolated, throwaway visual experiment. Existing production lanes are unchanged.
export default {
  root: '..',
  projectId: 'twin-peaks-hd2d-cabin-prototype',
  origin: 'http://127.0.0.1:4188',
  outputDir: '.gauntlet/hd2d-cabin-prototype/evidence/coldstage',
  baselineDir: '.gauntlet/hd2d-cabin-prototype/pixel-baselines',
  stateFile: '.gauntlet/hd2d-cabin-prototype/coldstage-state.json',
  watch: ['test/hd2d-cabin-prototype.html', 'test/hd2d-cabin-prototype.js', 'test/hd2d-cabin-coldstage.config.mjs'],
  browser: { viewport: { width: 1100, height: 760 }, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] },
  scenarios: {
    cabin: {
      review: 'visual',
      path: '/test/hd2d-cabin-prototype.html?capture=1',
      readyScript: 'return Boolean(window.GAME?.HD2DPrototype?.snapshot().ready);',
      setupScript: `
        const p = GAME.HD2DPrototype;
        p.reset();
        const before = p.snapshot().player;
        const walked = p.move(0, -0.5);
        const after = p.snapshot().player;
        const cabinBlocked = !p.move(-6, -6);
        const boundaryBlocked = !p.move(50, 0);
        p.reset();
        const reset = JSON.stringify(p.snapshot().player) === JSON.stringify(before);
        p.setVariant('flat'); const flat = p.snapshot().variant === 'flat';
        p.setVariant('hd2d');
        window.__cabinProof = { walked: walked && after.z < before.z, cabinBlocked, boundaryBlocked, reset, variants: flat && p.snapshot().variant === 'hd2d' };
      `,
      evidenceScript: 'return {...GAME.HD2DPrototype.snapshot(), ...window.__cabinProof, canvas: {width: document.querySelector("canvas").width, height: document.querySelector("canvas").height}};',
      checks: ['ready', 'walked', 'cabinBlocked', 'boundaryBlocked', 'reset', 'variants'].map(path => ({path, equals: true})),
      captures: [
        { name: 'flat-comparison', readyScript: "GAME.HD2DPrototype.setVariant('flat'); return true;", settleMs: 50 },
        { name: 'hd2d-spawn', readyScript: "GAME.HD2DPrototype.setVariant('hd2d'); return true;", settleMs: 50 }
      ]
    }
  },
  selectChanged() { return ['cabin']; }
};
