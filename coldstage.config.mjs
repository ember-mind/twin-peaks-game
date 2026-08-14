const runtimeFiles = [
  'index.html',
  'js/',
  'assets/',
  'narrative/',
  'coldstage.config.mjs',
];

const bootReady = `
  const game = window.GAME;
  const state = game?.Engine?.state;
  const canvas = document.querySelector('#game');
  return Boolean(state && canvas)
    && state.mode === 'title'
    && document.body.dataset.screen === 'title'
    && canvas.width === 160
    && canvas.height === 144;
`;

const startNewGame = `
  const press = (code) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code }));
  };
  press('KeyN');
  for (let index = 0; index < GAME.Engine.introPages().length; index += 1) {
    press('Enter');
  }
`;

const shellEvidence = `
  const state = GAME.Engine.state;
  const canvas = document.querySelector('#game');
  const stage = document.querySelector('#stage');
  const rect = stage.getBoundingClientRect();
  const style = getComputedStyle(canvas);
  const controls = [...document.querySelectorAll('.tp-touch-ctrl')];
  const visible = controls.filter((element) => {
    const controlStyle = getComputedStyle(element);
    return controlStyle.visibility !== 'hidden'
      && controlStyle.display !== 'none'
      && Number(controlStyle.opacity) > 0;
  });
  return {
    mode: state.mode,
    mapId: state.mapId,
    viewport: { width: innerWidth, height: innerHeight },
    canvas: {
      width: canvas.width,
      height: canvas.height,
      imageRendering: style.imageRendering,
    },
    stage: {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      left: Math.round(rect.left),
      top: Math.round(rect.top),
    },
    touchMode: Boolean(GAME.touchMode),
    touchControls: controls.length,
    visibleTouchControls: visible.length,
    savePresent: Boolean(localStorage.getItem('tp_save')),
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    verticalOverflow: document.documentElement.scrollHeight > innerHeight,
  };
`;

const mobileGameplayEvidence = `
  const state = GAME.Engine.state;
  const canvas = document.querySelector('#game');
  const stage = document.querySelector('#stage');
  const rect = stage.getBoundingClientRect();
  const visible = [...document.querySelectorAll('.tp-touch-ctrl')].filter((element) => {
    const style = getComputedStyle(element);
    return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0;
  });
  return {
    mode: state.mode,
    mapId: state.mapId,
    player: { tx: state.player.tx, ty: state.player.ty },
    dialogueActive: Boolean(state.dialogue),
    viewport: { width: innerWidth, height: innerHeight },
    canvas: { width: canvas.width, height: canvas.height },
    stage: { width: Math.round(rect.width), height: Math.round(rect.height) },
    touchMode: Boolean(GAME.touchMode),
    visibleTouchControls: visible.length,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    verticalOverflow: document.documentElement.scrollHeight > innerHeight,
  };
`;

const cooperDirectionScenario = (dir, code) => ({
  path: `/?coldstage=cooper-${dir}`,
  viewport: { width: 1280, height: 720 },
  readyScript: bootReady,
  settleMs: 220,
  setupScript: `${startNewGame}
    press('Enter'); press('Enter'); press('Enter');
    press('${code}');
  `,
  evidenceScript: `
    const state = GAME.Engine.state;
    const rect = document.querySelector('#stage').getBoundingClientRect();
    return {
      mode: state.mode,
      mapId: state.mapId,
      dir: state.player.dir,
      dialogueActive: Boolean(state.dialogue),
      stage: { width: Math.round(rect.width), height: Math.round(rect.height) },
    };
  `,
  checks: [
    { path: 'mode', equals: 'play' },
    { path: 'mapId', equals: 'arrival' },
    { path: 'dir', equals: dir },
    { path: 'dialogueActive', equals: false },
    { path: 'stage.width', equals: 800 },
    { path: 'stage.height', equals: 720 },
  ],
  captures: [{
    name: `cooper-${dir}`,
    readyScript: `return GAME.Engine.state.player.dir === '${dir}' && !GAME.Engine.state.dialogue;`,
    settleMs: 120,
  }],
});

export default {
  projectId: 'twin-peaks-pokemon',
  origin: 'http://127.0.0.1:4177',
  outputDir: '.coldstage/runs',
  baselineDir: 'test/coldstage-baselines',
  stateFile: '.coldstage/state.json',
  watch: runtimeFiles,
  browser: {
    viewport: { width: 1280, height: 720 },
    pageLoadTimeoutMs: 30_000,
    scriptTimeoutMs: 15_000,
  },
  scenarios: {
    desktop: {
      path: '/?coldstage=desktop',
      viewport: { width: 1280, height: 720 },
      readyScript: bootReady,
      settleMs: 120,
      evidenceScript: shellEvidence,
      checks: [
        { path: 'mode', equals: 'title' },
        { path: 'mapId', equals: 'arrival' },
        { path: 'viewport.width', equals: 1280 },
        { path: 'viewport.height', equals: 720 },
        { path: 'canvas.width', equals: 160 },
        { path: 'canvas.height', equals: 144 },
        { path: 'canvas.imageRendering', notEquals: 'auto' },
        { path: 'stage.width', equals: 800 },
        { path: 'stage.height', equals: 720 },
        { path: 'touchMode', equals: false },
        { path: 'touchControls', equals: 0 },
        { path: 'savePresent', equals: false },
        { path: 'horizontalOverflow', equals: false },
        { path: 'verticalOverflow', equals: false },
      ],
    },
    gameplay: {
      path: '/?coldstage=gameplay',
      viewport: { width: 1280, height: 720 },
      readyScript: bootReady,
      settleMs: 80,
      setupScript: startNewGame,
      evidenceScript: `
        const state = GAME.Engine.state;
        const canvas = document.querySelector('#game');
        return {
          mode: state.mode,
          mapId: state.mapId,
          player: { tx: state.player.tx, ty: state.player.ty },
          introPages: GAME.Engine.introPages().length,
          dialogueActive: Boolean(state.dialogue),
          canvas: { width: canvas.width, height: canvas.height },
          saveCreated: Boolean(localStorage.getItem('tp_save')),
        };
      `,
      checks: [
        { path: 'mode', equals: 'play' },
        { path: 'mapId', equals: 'arrival' },
        { path: 'player.tx', equals: 4 },
        { path: 'player.ty', equals: 3 },
        { path: 'introPages', min: 1 },
        { path: 'dialogueActive', equals: true },
        { path: 'canvas.width', equals: 160 },
        { path: 'canvas.height', equals: 144 },
        { path: 'saveCreated', equals: true },
      ],
    },
    mobile: {
      path: '/?touch=1&coldstage=mobile',
      viewport: { width: 390, height: 844 },
      readyScript: bootReady,
      settleMs: 120,
      evidenceScript: shellEvidence,
      checks: [
        { path: 'mode', equals: 'title' },
        { path: 'viewport.width', equals: 390 },
        { path: 'viewport.height', equals: 844 },
        { path: 'canvas.width', equals: 160 },
        { path: 'canvas.height', equals: 144 },
        { path: 'canvas.imageRendering', notEquals: 'auto' },
        { path: 'stage.width', equals: 320 },
        { path: 'stage.height', equals: 288 },
        { path: 'touchMode', equals: true },
        { path: 'touchControls', equals: 3 },
        { path: 'visibleTouchControls', equals: 2 },
        { path: 'savePresent', equals: false },
        { path: 'horizontalOverflow', equals: false },
        { path: 'verticalOverflow', equals: false },
      ],
    },
    mobileGameplay: {
      path: '/?touch=1&coldstage=mobile-gameplay',
      viewport: { width: 390, height: 844 },
      readyScript: bootReady,
      settleMs: 120,
      setupScript: startNewGame,
      evidenceScript: mobileGameplayEvidence,
      checks: [
        { path: 'mode', equals: 'play' },
        { path: 'mapId', equals: 'arrival' },
        { path: 'player.tx', equals: 4 },
        { path: 'player.ty', equals: 3 },
        { path: 'dialogueActive', equals: true },
        { path: 'viewport.width', equals: 390 },
        { path: 'viewport.height', equals: 844 },
        { path: 'canvas.width', equals: 160 },
        { path: 'canvas.height', equals: 144 },
        { path: 'stage.width', equals: 320 },
        { path: 'stage.height', equals: 288 },
        { path: 'touchMode', equals: true },
        { path: 'visibleTouchControls', equals: 1 },
        { path: 'horizontalOverflow', equals: false },
        { path: 'verticalOverflow', equals: false },
      ],
      captures: [{
        name: 'mobile-portrait-gameplay',
        readyScript: `return GAME.Engine.state.mode === 'play' && Boolean(GAME.Engine.state.dialogue);`,
        settleMs: 120,
      }],
    },
    mobileLandscapeGameplay: {
      path: '/?touch=1&coldstage=mobile-landscape-gameplay',
      viewport: { width: 844, height: 390 },
      readyScript: bootReady,
      settleMs: 120,
      setupScript: startNewGame,
      evidenceScript: mobileGameplayEvidence,
      checks: [
        { path: 'mode', equals: 'play' },
        { path: 'mapId', equals: 'arrival' },
        { path: 'dialogueActive', equals: true },
        { path: 'viewport.width', equals: 844 },
        { path: 'viewport.height', equals: 390 },
        { path: 'canvas.width', equals: 160 },
        { path: 'canvas.height', equals: 144 },
        { path: 'stage.width', equals: 320 },
        { path: 'stage.height', equals: 288 },
        { path: 'touchMode', equals: true },
        { path: 'visibleTouchControls', equals: 1 },
        { path: 'horizontalOverflow', equals: false },
        { path: 'verticalOverflow', equals: false },
      ],
      captures: [{
        name: 'mobile-landscape-gameplay',
        readyScript: `return GAME.Engine.state.mode === 'play' && Boolean(GAME.Engine.state.dialogue);`,
        settleMs: 120,
      }],
    },
    cooperDown: cooperDirectionScenario('down', 'ArrowDown'),
    cooperUp: cooperDirectionScenario('up', 'ArrowUp'),
    cooperRight: cooperDirectionScenario('right', 'ArrowRight'),
    cooperLeft: cooperDirectionScenario('left', 'ArrowLeft'),
    visual: {
      review: 'visual',
      diff: { threshold: 0.1, maxChangedRatio: 0.001, includeAA: false },
      path: '/?coldstage=visual',
      viewport: { width: 1280, height: 720 },
      readyScript: bootReady,
      settleMs: 80,
      setupScript: startNewGame,
      evidenceScript: `
        const state = GAME.Engine.state;
        return {
          mode: state.mode,
          mapId: state.mapId,
          dialogueActive: Boolean(state.dialogue),
        };
      `,
      checks: [
        { path: 'mode', equals: 'play' },
        { path: 'mapId', equals: 'arrival' },
        { path: 'dialogueActive', equals: true },
      ],
      captures: [{
        name: 'arrival-dialogue',
        readyScript: `return document.body.dataset.screen === 'play';`,
        settleMs: 180,
      }],
    },
  },
  selectChanged(files) {
    const selected = new Set();
    const all = () => ['desktop', 'gameplay', 'mobile', 'mobileGameplay', 'mobileLandscapeGameplay',
      'cooperDown', 'cooperUp', 'cooperRight', 'cooperLeft', 'visual']
      .forEach((name) => selected.add(name));
    for (const file of files) {
      if (['index.html', 'coldstage.config.mjs'].includes(file)
        || ['js/main.js', 'js/engine.js', 'js/glue.js'].includes(file)) {
        all();
      } else if (file === 'js/touch.js') {
        selected.add('mobile');
        selected.add('mobileGameplay');
        selected.add('mobileLandscapeGameplay');
      } else if (file.startsWith('js/narrative-') || file.startsWith('narrative/')) {
        selected.add('gameplay');
        selected.add('visual');
      } else if (file.startsWith('assets/')
        || /^js\/retro-cast-matrices-[ab]\.js$/.test(file)
        || ['js/retro.js', 'js/retro-authored.js', 'js/retro-ui.js', 'js/retro-font.js',
          'js/portraits.js', 'js/gold-tone.js', 'js/chars.js', 'js/tiles.js'].includes(file)) {
        all();
      } else if (file.startsWith('js/')) {
        selected.add('gameplay');
      }
    }
    return ['desktop', 'gameplay', 'mobile', 'mobileGameplay', 'mobileLandscapeGameplay',
      'cooperDown', 'cooperUp', 'cooperRight', 'cooperLeft', 'visual']
      .filter((name) => selected.has(name));
  },
};
