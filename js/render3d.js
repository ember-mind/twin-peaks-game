/* render3d.js — motore grafico 3D (THREE.js / WebGL), stile Pokémon Nero/Bianco:
 * mondo in vera geometria 3D + personaggi billboard.
 *  - terreno: piano con texture generata dalla pixel-art dei tile (tiles.js)
 *  - edifici: scatole estruse con tetto a padiglione, facciate texturizzate ricche
 *  - acqua/olio: mesh dedicate con texture animata e riflesso
 *  - luci: hemisphere + sole direzionale con ombre (PCFSoft); blob-shadow per gli sprite
 *  - alberi, cartelli, transenna, statue, personaggi: sprite billboard
 *  - camera prospettica inclinata (~55°) che segue il giocatore con lerp
 * Fallback: se THREE o WebGL mancano, GAME.Render3D resta assente → engine 2D.
 * 1 tile = 1 unità mondo; x → x, riga mappa → z.
 */
(function () {
  if (typeof window === 'undefined') return;
  var GAME = window.GAME = window.GAME || {};
  var Sp = GAME.sprites;

  /* CONFIG — tunables del renderer 3D raggruppati in un solo punto: da qui si
   * calibra tutto (camera, luci, nebbia, muri, terreno, palette edifici). E'
   * il seam naturale per un eventuale secondo gioco che riusi questo motore.
   * Esposto anche se THREE manca (vedi sotto), cosi' i test in node possono
   * leggerlo senza montare WebGL. */
  var CONFIG = {
    camera: {
      up: 13.5, back: 9.2, fov: 38, refAspect: 1.5, maxFov: 62
    },
    quality: {
      // `high` resta opt-in via ?quality=high. Default balanced limita pixel
      // costosi ma mantiene SSAO a risoluzione CSS.
      balancedPixelRatio: 1.25,
      performancePixelRatio: 1,
      highPixelRatio: 2
    },
    walls: {
      wallH: 0.95, roofH: 0.85, eave: 0.25,
      iwallH: 1.25, iwallSouthH: 0.9, iwallTallH: 2.1
    },
    terrain: {
      border: 8,
      skipBake: {
        '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, D: 1, i: 1, R: 1, T: 1, Y: 1, S: 1, X: 1, M: 1, w: 1, o: 1,
        L: 1, P: 1, B: 1, F: 1, A: 1, H: 1, E: 1, n: 1, G: 1
      }
    },
    lighting: {
      // Ogni profilo conserva una key forte e un fill cromatico molto più
      // debole. La separazione di temperatura sostituisce il vecchio "tutto
      // hemi" uniforme senza introdurre shadow pass addizionali.
      redroom: {
        hemiSky: 0xc45561, hemiGround: 0x25101d, hemiIntensity: 0.36,
        sunColor: 0xffc0a7, sunIntensity: 0.6, exposure: 0.88,
        sunOffset: [-6, 11, -4], fillColor: 0x66527f, fillIntensity: 0.1,
        fillOffset: [7, 6, 7], shadowMargin: 1.35, shadowBias: -0.00012, shadowNormalBias: 0.015,
        actorFill: { color: 0xffad8a, intensity: 0.24, distance: 2.6, decay: 2, offset: [0.75, 1.75, 1.35] },
        contactOpacity: 0.55
      },
      indoor: {
        hemiSky: 0xeadfc9, hemiGround: 0x343a3d, hemiIntensity: 0.24,
        sunColor: 0xffd9a5, sunIntensity: 0.44, exposure: 0.99,
        sunOffset: [-6, 14, -5], fillColor: 0x789dab, fillIntensity: 0.14,
        fillOffset: [7, 6, 8], shadowMargin: 1.4, shadowBias: -0.0001, shadowNormalBias: 0.014
      },
      outdoor: {
        hemiSky: 0xb9d5df, hemiGround: 0x40574d, hemiIntensity: 0.34,
        sunColor: 0xffd49e, sunIntensity: 0.84, exposure: 1.02,
        sunOffset: [-11, 24, -8], fillColor: 0x78a7bd, fillIntensity: 0.15,
        fillOffset: [10, 8, 9], shadowExtent: 12, shadowBias: -0.00017, shadowNormalBias: 0.019,
        actorFill: { color: 0xb9dbe1, intensity: 0.4, distance: 4.8, decay: 2, offset: [0.9, 1.85, 1.6] }
      },
      town: {
        hemiSky: 0xb7d6e2, hemiGround: 0x3f594e, hemiIntensity: 0.34,
        sunColor: 0xffd39b, sunIntensity: 0.84, exposure: 1.02,
        sunOffset: [-11, 24, -8], fillColor: 0x76a7be, fillIntensity: 0.16,
        fillOffset: [10, 8, 9], shadowExtent: 12, shadowBias: -0.00017, shadowNormalBias: 0.019,
        actorFill: { color: 0xc5e2e6, intensity: 0.46, distance: 4.8, decay: 2, offset: [0.9, 1.85, 1.6] }
      },
      woods: {
        hemiSky: 0x8faeae, hemiGround: 0x22382b, hemiIntensity: 0.28,
        sunColor: 0xefd2a5, sunIntensity: 0.72, exposure: 1,
        sunOffset: [-10, 23, -8], fillColor: 0x5c8c84, fillIntensity: 0.14,
        fillOffset: [9, 7, 9], shadowExtent: 12.5, shadowBias: -0.00018, shadowNormalBias: 0.021,
        actorFill: { color: 0x8bc7b7, intensity: 0.58, distance: 4.8, decay: 2, offset: [0.9, 1.9, 1.65] }
      },
      sheriff: {
        hemiSky: 0xe6ddc7, hemiGround: 0x35433f, hemiIntensity: 0.2,
        sunColor: 0xffd69a, sunIntensity: 0.42, exposure: 1,
        sunOffset: [-6, 14, -5], fillColor: 0x719ea1, fillIntensity: 0.14,
        fillOffset: [7, 6, 8], shadowMargin: 1.35, shadowBias: -0.00009, shadowNormalBias: 0.013,
        actorFill: { color: 0xffd4a0, intensity: 0.48, distance: 4.6, decay: 2, offset: [0.85, 1.75, 1.5] }
      },
      palmer: {
        hemiSky: 0xe8ddd1, hemiGround: 0x44373b, hemiIntensity: 0.19,
        sunColor: 0xffd5a6, sunIntensity: 0.43, exposure: 0.94,
        sunOffset: [-7, 11, -5], fillColor: 0x7898aa, fillIntensity: 0.083,
        fillOffset: [7, 6, 8], shadowMargin: 1.35, shadowBias: -0.0001, shadowNormalBias: 0.015,
        actorFill: { color: 0xffc38d, intensity: 0.34, distance: 3.1, decay: 2, offset: [0.8, 1.75, 1.4] },
        roomFill: { color: 0x9fc7d8, intensity: 0.62, distance: 3.6, position: [10.4, 1.45, 7.35] },
        contactOpacity: 0.55
      },
      hotel_gn: {
        hemiSky: 0xe3ddce, hemiGround: 0x34383e, hemiIntensity: 0.2,
        sunColor: 0xffcf91, sunIntensity: 0.42, exposure: 0.99,
        sunOffset: [-6, 14, -5], fillColor: 0x749aae, fillIntensity: 0.14,
        fillOffset: [7, 6, 8], shadowMargin: 1.4, shadowBias: -0.00009, shadowNormalBias: 0.013,
        actorFill: { color: 0xffd1a2, intensity: 0.42, distance: 3.8, decay: 2, offset: [0.85, 1.75, 1.5] },
        roomFill: { color: 0xffcb84, intensity: 0.72, distance: 4.2, position: [8.5, 1.5, 8.0] },
        contactOpacity: 0.56
      },
      hospital: {
        hemiSky: 0xd9e7e8, hemiGround: 0x303d42, hemiIntensity: 0.23,
        sunColor: 0xffebc8, sunIntensity: 0.42, exposure: 1,
        sunOffset: [-6, 14, -5], fillColor: 0x7da8b5, fillIntensity: 0.14,
        fillOffset: [7, 6, 8], shadowMargin: 1.4, shadowBias: -0.00009, shadowNormalBias: 0.013,
        actorFill: { color: 0xd4edf0, intensity: 0.43, distance: 4.6, decay: 2, offset: [0.85, 1.75, 1.5] }
      },
      diner: {
        hemiSky: 0xffedcf, hemiGround: 0x403b38, hemiIntensity: 0.24,
        sunColor: 0xffdfb3, sunIntensity: 0.67, exposure: 0.97,
        sunOffset: [-7.5, 12.5, -5.5], fillColor: 0x86a1b2, fillIntensity: 0.07,
        fillOffset: [7, 6, 8], shadowMargin: 1.4, shadowBias: -0.00012, shadowNormalBias: 0.016,
        actorFill: { color: 0xffca91, intensity: 0.32, distance: 3, decay: 2, offset: [0.8, 1.72, 1.4] },
        roomFill: { color: 0x8fbac3, intensity: 0.46, distance: 3.4, position: [8.4, 1.45, 5.1] },
        contactOpacity: 0.58
      },
      oej: {
        hemiSky: 0xd9b4bf, hemiGround: 0x321f2d, hemiIntensity: 0.18,
        sunColor: 0xffaa62, sunIntensity: 0.4, exposure: 0.97,
        sunOffset: [-6, 14, -5], fillColor: 0x6e7ca4, fillIntensity: 0.15,
        fillOffset: [7, 6, 8], shadowMargin: 1.4, shadowBias: -0.00009, shadowNormalBias: 0.013,
        actorFill: { color: 0xffb77b, intensity: 0.45, distance: 4.6, decay: 2, offset: [0.85, 1.75, 1.5] }
      },
      roadhouse: {
        hemiSky: 0xd9bf97, hemiGround: 0x33291f, hemiIntensity: 0.18,
        sunColor: 0xffae5f, sunIntensity: 0.39, exposure: 0.97,
        sunOffset: [-6, 14, -5], fillColor: 0x6c83a5, fillIntensity: 0.15,
        fillOffset: [7, 6, 8], shadowMargin: 1.4, shadowBias: -0.00009, shadowNormalBias: 0.013,
        actorFill: { color: 0xffb874, intensity: 0.48, distance: 4.7, decay: 2, offset: [0.85, 1.75, 1.5] }
      },
      traincar: {
        hemiSky: 0xb6d2e2, hemiGround: 0x465346, hemiIntensity: 0.32,
        sunColor: 0xffefcf, sunIntensity: 0.86, exposure: 1,
        sunOffset: [-12, 19, -9], fillColor: 0x82a9bc, fillIntensity: 0.095,
        fillOffset: [10, 8, 9], shadowExtent: 12, shadowBias: -0.0002, shadowNormalBias: 0.022,
        actorFill: { color: 0x86b8b7, intensity: 0.24, distance: 2.8, decay: 2, offset: [0.8, 1.8, 1.45] },
        contactOpacity: 0.55
      },
      // Il blind gate ha premiato il pass chiaro al lago e all'ingresso del
      // bosco, ma ha bocciato quella stessa curva nei quadri più drammatici.
      // Questi target regionali ripristinano densità/direzione solo dove serve;
      // il blend runtime evita cambi di esposizione a scatto attraversando la
      // città o il sentiero del bosco.
      regional: {
        townDrama: {
          hemiSky: 0xb2d3e4, hemiGround: 0x435144, hemiIntensity: 0.28,
          sunColor: 0xffefcf, sunIntensity: 0.9, exposure: 1,
          sunOffset: [-12, 19, -9], fillColor: 0x87afc1, fillIntensity: 0.105,
          actorFill: { color: 0xc5e2e6, intensity: 0.32, distance: 3.15 },
          fog: { color: 0x344b54, near: 17, far: 50 },
          contactOpacity: 0.55
        },
        woodsGrove: {
          hemiSky: 0x83a5a7, hemiGround: 0x1e3024, hemiIntensity: 0.24,
          sunColor: 0xcfe0d2, sunIntensity: 0.72, exposure: 0.94,
          sunOffset: [-11, 20, -8], fillColor: 0x527d74, fillIntensity: 0.08,
          actorFill: { color: 0x77b8a7, intensity: 0.34, distance: 3.4 },
          fog: { color: 0x1f3530, near: 10, far: 34 },
          contactOpacity: 0.55
        },
        townWelcomeHero: {
          hemiSky: 0xa9ccd9, hemiGround: 0x354f43, hemiIntensity: 0.25,
          sunColor: 0xffe6bd, sunIntensity: 0.96, exposure: 0.99,
          sunOffset: [-11, 17, -8], fillColor: 0x6fa5b2, fillIntensity: 0.12,
          actorFill: { color: 0xaedbd1, intensity: 0.43, distance: 3.15 },
          fog: { color: 0x304a50, near: 17, far: 49 },
          contactOpacity: 0.6
        },
        townLakeHero: {
          hemiSky: 0x9fcbd5, hemiGround: 0x2c4a43, hemiIntensity: 0.26,
          sunColor: 0xe7edf0, sunIntensity: 0.88, exposure: 0.96,
          sunOffset: [-9, 24, -7], fillColor: 0x6f9fac, fillIntensity: 0.11,
          actorFill: { color: 0x9dd0d3, intensity: 0.28, distance: 2.7 },
          fog: { color: 0x2b4850, near: 16, far: 46 },
          contactOpacity: 0.5
        },
        townWaterfallHero: {
          hemiSky: 0xa8cbd6, hemiGround: 0x30483e, hemiIntensity: 0.23,
          sunColor: 0xffe3b6, sunIntensity: 0.98, exposure: 0.94,
          sunOffset: [-12, 18, -9], fillColor: 0x6e9faa, fillIntensity: 0.105,
          actorFill: { color: 0xaed8d2, intensity: 0.34, distance: 2.9 },
          fog: { color: 0x2e474d, near: 16, far: 48 },
          contactOpacity: 0.58
        },
        townWelcomeAccent: {
          color: 0xffd59a, intensity: 0.52, distance: 3.8,
          position: [30.5, 1.15, 30.15]
        },
        townWelcomeHeroAccent: {
          color: 0x8fd0b7, intensity: 0.9, distance: 3.45,
          position: [30.45, 1.25, 30.35]
        },
        townLakeHeroAccent: {
          color: 0x78b4c2, intensity: 0.27, distance: 2.7,
          position: [16.3, 0.9, 28.2]
        },
        townWaterfallHeroAccent: {
          color: 0xd2c39c, intensity: 0.62, distance: 2.8,
          position: [8.8, 1.15, 2.7]
        },
        townWaterfallAccent: {
          color: 0xb9d9d2, intensity: 0.46, distance: 3.6,
          position: [10.5, 1.05, 3.0]
        },
        woodsGroveAccent: {
          color: 0xd4b17d, intensity: 0.48, distance: 4,
          position: [14.5, 1.15, 12.2]
        }
      },
      fill: { color: 0xffd49a, intensity: 0.025, distanceMult: 1.3, decay: 2 },
      practical: {
        sheriff: { color: 0xffc77a, intensity: 1.3, distance: 4.5, decay: 2, position: [12.15, 1.55, 6.6] },
        palmer: { color: 0xffa052, intensity: 1.08, distance: 3.2, decay: 2, position: [1.45, 1.05, 7.45] },
        hotel_gn: { color: 0xffbf72, intensity: 1.45, distance: 4.4, decay: 2, position: [5.8, 1.55, 8.0] },
        hospital: { color: 0xc1e8ed, intensity: 1.05, distance: 4.8, decay: 2, position: [2.5, 1.55, 2.2] },
        diner: { color: 0xffb76f, intensity: 1.16, distance: 3.75, decay: 2, position: [7, 1.45, 2.25] },
        oej: { color: 0xd34c7f, intensity: 1.12, distance: 5.3, decay: 2, position: [7.5, 1.4, 4.4] },
        roadhouse: { color: 0xff9f54, intensity: 1.18, distance: 5.3, decay: 2, position: [8, 1.55, 2.05] }
      },
      accents: {
        sheriff: [
          { color: 0x75b890, intensity: 0.56, distance: 3.8, position: [2.9, 1.02, 2.45] }
        ],
        palmer: [
          { color: 0x9fc7d8, intensity: 0.32, distance: 4.2, position: [12.4, 1.45, 2.2] }
        ],
        hotel_gn: [
          { color: 0x84aebc, intensity: 0.38, distance: 3.6, position: [12.1, 1.45, 8.5] }
        ],
        hospital: [
          { color: 0x8fbfc9, intensity: 0.52, distance: 4.8, position: [8.6, 1.4, 5.2] }
        ],
        diner: [
          { color: 0xff8f4f, intensity: 0.52, distance: 3.35, position: [3.7, 1.25, 6.6] }
        ],
        oej: [
          { color: 0x645a9a, intensity: 0.52, distance: 5, position: [12, 1.25, 6.4] }
        ],
        roadhouse: [
          { color: 0xa33b3a, intensity: 0.5, distance: 5, position: [4.2, 1.25, 6.3] }
        ],
        redroom: [
          { color: 0xb73572, intensity: 0.28, distance: 6.4, position: [8, 1.35, 2.35] },
          { color: 0x78668f, intensity: 0.34, distance: 3.2, position: [8, 1.15, 4.5] }
        ],
        traincar: [
          { color: 0xffc477, intensity: 0.82, distance: 3.7, position: [11.5, 1.05, 5.6] }
        ],
        woods: [
          { color: 0x6f9b85, intensity: 0.35, distance: 3.5, position: [14, 0.48, 10] }
        ]
      },
      shadow: { mapSize: 2048, balancedMapSize: 1024, near: 0.5, bias: -0.0002, normalBias: 0.022 }
    },
    fog: {
      town: { color: 0x3b5257, near: 18, far: 52 },
      woods: { color: 0x29413b, near: 11, far: 37 },
      redroom: { color: 0x310c17, near: 8, far: 28 }
    },
    weather: {
      // One Pacific Northwest pressure system drives every secondary motion:
      // rain, smoke, water normals and foliage never disagree about the wind.
      town: {
        windX: -0.18, windZ: -0.1, rain: 0.62,
        rainBalanced: 280, rainPerformance: 140,
        impactsBalanced: 72, impactsPerformance: 32,
        mistBalanced: 24, mistPerformance: 12,
        mistColor: 0xa9c2c5, mistOpacity: 0.035, mistSize: 1.05,
        mistAnchors: [[9.2, 0.2, 29], [11, 0.5, 3.2], [31, 0.22, 31]]
      },
      woods: {
        windX: -0.2, windZ: -0.12, rain: 0.84,
        rainBalanced: 360, rainPerformance: 170,
        impactsBalanced: 82, impactsPerformance: 36,
        mistBalanced: 64, mistPerformance: 28,
        mistColor: 0xa4bbb2, mistOpacity: 0.075, mistSize: 1.15,
        mistAnchors: [[11.2, 0.26, 12.2], [18.1, 0.18, 17.6], [7.4, 0.32, 7.8]]
      },
      redroom: {
        windX: 0.035, windZ: -0.02, rain: 0,
        rainBalanced: 0, rainPerformance: 0,
        impactsBalanced: 0, impactsPerformance: 0,
        mistBalanced: 58, mistPerformance: 32,
        mistColor: 0xffb092, mistOpacity: 0.7, mistSize: 0.36,
        mistAnchors: [[7.5, 0.65, 3.7], [9.2, 0.52, 6.2], [1.1, 0.85, 5.5], [14.9, 0.9, 5.3]]
      }
    },
    palettes: {
      '1': { rf: '#7c94b0', rb: '#43566e', rr: '#a8bccc', wall: '#c8a878', wd: '#a88858', wl: '#dcc094', trim: '#8a6a48', kind: 'sheriff' },
      '2': { rf: '#5a88c4', rb: '#2e5688', rr: '#9cc0e8', wall: '#b08858', wd: '#8a6238', wl: '#c8a070', trim: '#6a4a28', sign: '#a81828', kind: 'diner' },
      '3': { rf: '#a87c5c', rb: '#5e4230', rr: '#d0a888', wall: '#d0b888', wd: '#a88a58', wl: '#e4d0a4', trim: '#8a6a48', kind: 'palmer' },
      '4': { rf: '#52704e', rb: '#284030', rr: '#7c9878', wall: '#9c7a4e', wd: '#6e5230', wl: '#b08e5e', trim: '#4e3a20', kind: 'hotel' },
      '5': { rf: '#93a5b5', rb: '#5a6a78', rr: '#c5d1db', wall: '#e6e6e0', wd: '#b8b8b0', wl: '#f4f4ee', trim: '#8a98a8', kind: 'hospital' },
      '6': { rf: '#4a3a2e', rb: '#241a12', rr: '#6a5646', wall: '#5a4636', wd: '#3a2e26', wl: '#7a6248', trim: '#241a12', sign: '#a81828', kind: 'roadhouse' }
    }
  };
  GAME.Render3DConfig = CONFIG;

  if (typeof THREE === 'undefined') return;

  var R = {};
  var renderer = null, camera = null;
  var composer = null, ssaoPass = null, gammaPass = null, fxaaPass = null, ssaoEnabled = false;
  var viewportW = 960, viewportH = 640;
  var qualityMode = 'balanced', qualityAllowsSSAO = true, renderPixelRatio = 1, postPixelRatio = 1;
  var measuredFps = 0, frameIntervalMs = 0, lastFrameWall = 0, lastPerfPublish = 0;
  var lowFpsDuration = 0, adaptiveDegraded = false;
  var frameSamples = [], frameP95Ms = 0, deviceProfile = 'balanced';
  var lastShadowUpdate = -99999;
  var prewarmDurationMs = 0, prewarmMapId = null;
  // Sheriff already establishes the shipped maximum. Keeping every scene at
  // that visible-light topology prevents r147 from compiling 0/1/2/3/4-light
  // variants as maps change; zero-intensity slots do not affect illumination.
  var MAX_POINT_LIGHTS = 4;
  var TILE = 16;
  var WALL_H = CONFIG.walls.wallH, ROOF_H = CONFIG.walls.roofH, EAVE = CONFIG.walls.eave, IWALL_H = CONFIG.walls.iwallH;
  // interni: parete anchor (fila sud, verso la camera) piu' bassa per non
  // nascondere il giocatore vicino alla porta; tutte le altre pareti interne
  // (perimetro nord, colonne laterali, partizioni) piu' alte per leggere bene
  // la texture ricca. Gli esterni restano su IWALL_H, invariato.
  var IWALL_SOUTH_H = CONFIG.walls.iwallSouthH, IWALL_TALL_H = CONFIG.walls.iwallTallH;
  var CAM_UP = CONFIG.camera.up, CAM_BACK = CONFIG.camera.back, CAM_FOV = CONFIG.camera.fov;
  var BORDER = CONFIG.terrain.border;
  var REF_ASPECT = CONFIG.camera.refAspect; // aspect di riferimento (landscape) per cui CAM_FOV e' tarato

  // su schermi stretti (mobile ritratto) un FOV verticale fisso restringe troppo
  // il FOV orizzontale (world piu' "zoomato"): lo alziamo per tenere costante
  // il campo visivo orizzontale rispetto al riferimento landscape.
  function fovForAspect(aspect) {
    var baseH = 2 * Math.atan(Math.tan(CAM_FOV * Math.PI / 360) * REF_ASPECT);
    var v = 2 * Math.atan(Math.tan(baseH / 2) / aspect) * 180 / Math.PI;
    return Math.max(CAM_FOV, Math.min(v, CONFIG.camera.maxFov));
  }

  // Portrait: niente zoom-out estremo. Il FOV resta sotto 62° e camera/soggetto
  // si avvicinano mantenendo quasi invariato l'angolo di lettura.
  function cameraScaleForAspect(aspect) {
    if (aspect >= 0.9) return 1;
    var t = Math.max(0, Math.min(1, (aspect - 0.55) / 0.35));
    return 0.86 + t * 0.14;
  }

  function detectedDeviceProfile() {
    if (typeof navigator === 'undefined') return 'balanced';
    var cores = navigator.hardwareConcurrency || 8;
    var memory = navigator.deviceMemory || 8;
    var coarse = typeof matchMedia !== 'undefined' &&
      matchMedia('(pointer: coarse)').matches;
    return (coarse || cores <= 4 || memory <= 4) ? 'performance' : 'balanced';
  }

  function requestedQualityMode() {
    var q = typeof location !== 'undefined'
      ? new URLSearchParams(location.search).get('quality')
      : null;
    if (q === 'high' || q === 'performance' || q === 'balanced') return q;
    deviceProfile = detectedDeviceProfile();
    return deviceProfile;
  }

  function applyRenderQuality(w, h) {
    qualityMode = requestedQualityMode();
    var nativeRatio = Math.max(1, window.devicePixelRatio || 1);
    var cap = CONFIG.quality.balancedPixelRatio;
    qualityAllowsSSAO = true;
    if (qualityMode === 'high') cap = CONFIG.quality.highPixelRatio;
    else if (qualityMode === 'performance') {
      cap = CONFIG.quality.performancePixelRatio;
      qualityAllowsSSAO = false;
    }
    // Su viewport oltre Full HD il costo in pixel cresce più della leggibilità
    // aggiunta: balanced scende a 1×, high conserva il proprio opt-in.
    if (qualityMode === 'balanced' && w * h > 2100000) cap = 1;
    renderPixelRatio = Math.min(nativeRatio, cap);
    lowFpsDuration = 0;
    adaptiveDegraded = false;
    renderer.setPixelRatio(renderPixelRatio);
  }

  function sampleFramePerformance() {
    if (typeof performance === 'undefined') return;
    var now = performance.now();
    if (lastFrameWall) {
      var interval = Math.min(250, now - lastFrameWall);
      frameIntervalMs = frameIntervalMs
        ? frameIntervalMs + (interval - frameIntervalMs) * 0.08
        : interval;
      measuredFps = frameIntervalMs > 0 ? 1000 / frameIntervalMs : 0;
      frameSamples.push(interval);
      if (frameSamples.length > 180) frameSamples.shift();
      if (now - lastPerfPublish > 500 && frameSamples.length) {
        var ordered = frameSamples.slice().sort(function (a, b) { return a - b; });
        frameP95Ms = ordered[Math.min(ordered.length - 1, Math.floor(ordered.length * 0.95))];
      }
      if (qualityMode === 'balanced' && !adaptiveDegraded &&
          typeof document !== 'undefined' && document.visibilityState === 'visible') {
        var pressure = frameP95Ms || frameIntervalMs;
        if (pressure > 23.25) lowFpsDuration += interval;
        else lowFpsDuration = Math.max(0, lowFpsDuration - interval * 2);
        if (lowFpsDuration > 2500) {
          adaptiveDegraded = true;
          qualityMode = 'performance-auto';
          qualityAllowsSSAO = false;
          renderPixelRatio = Math.min(window.devicePixelRatio || 1, 1);
          renderer.setPixelRatio(renderPixelRatio);
          renderer.setSize(viewportW, viewportH, false);
          updatePostQuality(viewportW, viewportH);
        }
      }
    }
    lastFrameWall = now;
    if (typeof document !== 'undefined' && now - lastPerfPublish > 500) {
      lastPerfPublish = now;
      var root = document.documentElement;
      root.setAttribute('data-tp-fps', measuredFps.toFixed(1));
      root.setAttribute('data-tp-frame-ms', frameIntervalMs.toFixed(1));
      root.setAttribute('data-tp-p95-ms', frameP95Ms.toFixed(1));
      root.setAttribute('data-tp-quality', qualityMode);
      root.setAttribute('data-tp-device-profile', deviceProfile);
      root.setAttribute('data-tp-pixel-ratio', renderPixelRatio.toFixed(2));
      root.setAttribute('data-tp-adaptive', adaptiveDegraded ? 'degraded' : 'stable');
      root.setAttribute('data-tp-calls', renderer ? String(renderer.info.render.calls) : '0');
      root.setAttribute('data-tp-triangles', renderer ? String(renderer.info.render.triangles) : '0');
      root.setAttribute('data-tp-prewarm-map', prewarmMapId || '');
      root.setAttribute('data-tp-prewarm-ms', prewarmDurationMs.toFixed(1));
    }
  }

  var worlds = {};
  var cur = null, curId = null;
  var playerActor = null, playerBlob = null;
  var characterEvidenceView = null;
  var charTexCache = {};
  var texCache = {};
  var dataTexCache = {};
  var buildingMaterialCache = {};
  var environmentCache = {};
  var environmentTargets = [];
  var pmremGenerator = null;
  var actorGeo = null, actorMaterialCache = {};
  var actorRigCount = 0, actorDynamicMaterialCount = 0;
var camSnap = true;
var currentCamBack = CAM_BACK;
var currentCamUp = CAM_UP;
var currentAspect = REF_ASPECT;
var wasMoving = false;
var dustParts = [];
var leadX = 0, leadZ = 0, dialogueOrbitX = 0;
var lodgeEnterT = -99999;
var authoredPropAsset = {
  status: 'idle', scene: null, roots: {}, url: null, error: null
};
var authoredWelcomeBiomeAsset = {
  status: 'idle', scene: null, roots: {}, url: null, error: null
};
var authoredVegetationAsset = {
  status: 'idle', scene: null, roots: {}, url: null, error: null
};
var authoredArchitectureAsset = {
  status: 'idle', scene: null, roots: {}, url: null, error: null,
  validation: null
};
var architectureTextureCache = {};
var AUTHORED_ARCHITECTURE_ROOTS = {
  '1': 'TP_BUILD_Sheriff',
  '2': 'TP_BUILD_DoubleR',
  '3': 'TP_BUILD_Palmer',
  '4': 'TP_BUILD_GreatNorthern',
  '5': 'TP_BUILD_Hospital',
  '6': 'TP_BUILD_Roadhouse'
};
var AUTHORED_ARCHITECTURE_FOOTPRINTS = {
  TP_BUILD_Sheriff: [11, 3],
  TP_BUILD_DoubleR: [11, 3],
  TP_BUILD_Palmer: [10, 3],
  TP_BUILD_GreatNorthern: [10, 3],
  TP_BUILD_Hospital: [8, 3],
  TP_BUILD_Roadhouse: [8, 3]
};
function authoredArchitectureEnabled() {
  if (typeof window === 'undefined' || !window.location) return true;
  try {
    var params = new URLSearchParams(window.location.search);
    var mode = params.get('architecture');
    var flags = (params.get('flags') || '').split(',');
    return mode !== 'off' && mode !== '0' && mode !== 'procedural' &&
      flags.indexOf('architecture_procedural') < 0;
  } catch (e) {
    return true;
  }
}
var AUTHORED_VEGETATION_HASH = 'c9a3b44318a56d3b3c2c02e5d6676a3f7dd59e209d57bbb9aee1533a1a12c07b';
function authoredBoundaryVegetation(mapId, baseSpecs, salt) {
  var specs = (baseSpecs || []).slice();
  var map = GAME.maps && GAME.maps.maps && GAME.maps.maps[mapId];
  if (!map) return specs;
  var occupied = {};
  specs.forEach(function (spec) {
    if (!spec.replace) return;
    var rx = spec.replaceX === undefined ? spec.x : spec.replaceX;
    var rz = spec.replaceZ === undefined ? spec.z : spec.replaceZ;
    occupied[Math.floor(rx) + ',' + Math.floor(rz)] = true;
  });
  var fir = 'TP_VEG_DouglasFir_Cascade_LOD0';
  var cedar = 'TP_VEG_WesternRedCedar_Young_LOD0';
  var hemlock = 'TP_VEG_WesternHemlock_Wind_LOD0';
  var sapling = 'TP_VEG_ConiferSapling_LOD0';
  var snag = 'TP_VEG_DouglasFir_BrokenSnag_LOD0';
  var salal = 'TP_VEG_SalalCluster_LOD0';
  var fern = 'TP_VEG_FernCluster_LOD0';
  var conifers = [fir, cedar, hemlock, sapling];
  for (var row = 0; row < map.rows.length; row++) {
    for (var column = 0; column < map.rows[row].length; column++) {
      var kind = map.rows[row].charAt(column);
      if (kind !== 'T' && kind !== 'Y') continue;
      var key = column + ',' + row;
      if (occupied[key]) continue;
      // The waterfall's canonical hedge remains solid in the ASCII map, but
      // the landmark envelope is render-only clear. Authored roots must obey
      // the same clearance as legacy proxies or they simply re-occlude it.
      if (mapId === 'town' && row <= 3 &&
          column >= 5 && column <= 15) continue;
      var left = map.rows[row].charAt(column - 1);
      var right = map.rows[row].charAt(column + 1);
      var above = map.rows[row - 1] && map.rows[row - 1].charAt(column);
      var below = map.rows[row + 1] && map.rows[row + 1].charAt(column);
      var horizontalRun = left === 'T' || right === 'T';
      var verticalRun = above === 'T' || below === 'T';
      var pairedMacro = horizontalRun
        ? Math.floor(column / 2) * 5 + Math.floor(row / 3) * 7
        : Math.floor(row / 2) * 7 + Math.floor(column / 3) * 5;
      var lowBreak = (pairedMacro + salt) % 11 === 3;
      var macro = Math.floor(column / 4) * 11 +
        Math.floor(row / 3) * 17 + salt;
      var root = kind === 'Y'
        ? snag
        : (lowBreak
          ? ((column + row + salt) % 2 ? salal : fern)
          : (((column * 13 + row * 19 + macro) % 23) === 0
            ? snag
            : conifers[Math.abs(column * 7 + row * 11 + macro) % 4]));
      var scaleBand = Math.abs(column * 3 + row * 5 + macro) % 7;
      var jitterX = Math.sin(column * 1.73 + row * 0.61 + salt) * 0.22 +
        Math.sin(macro * 0.37) * 0.07;
      var jitterZ = Math.cos(column * 0.83 + row * 1.47 + salt) * 0.19 +
        Math.cos(macro * 0.29) * 0.06;
      specs.push({
        root: root,
        x: column + 0.5 + jitterX,
        z: row + 0.6 + jitterZ,
        replaceX: column + 0.5,
        replaceZ: row + 0.6,
        ry: -0.58 + Math.abs(column * 5 + row * 9 + macro) % 13 * 0.097,
        scale: lowBreak ? 0.24 + scaleBand * 0.022
          : 0.44 + scaleBand * 0.042,
        replace: true,
        shadow: !lowBreak && ((column * 3 + row * 2 + salt) % 11) === 0
      });
    }
  }
  return specs;
}
var AUTHORED_VEGETATION_PLACEMENTS = {
  woods: (function () {
    var specs = [];
    var fir = 'TP_VEG_DouglasFir_Cascade_LOD0';
    var cedar = 'TP_VEG_WesternRedCedar_Young_LOD0';
    var hemlock = 'TP_VEG_WesternHemlock_Wind_LOD0';
    var sapling = 'TP_VEG_ConiferSapling_LOD0';
    var brokenSnag = 'TP_VEG_DouglasFir_BrokenSnag_LOD0';
    // Upright authored boundary: every visible south-row cone is replaced,
    // but alternating species and height prevent a nursery-row silhouette.
    [6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22]
      .forEach(function (x, index) {
        var windowRoot = x === 9 || x === 10 || x === 18 || x === 22
          ? 'TP_VEG_SalalCluster_LOD0' : null;
        specs.push({
          root: windowRoot || (index % 2 ? cedar : fir),
          x: x + 0.5, z: 21.6,
          ry: -0.22 + (index % 5) * 0.12,
          scale: windowRoot ? 0.58 + (index % 2) * 0.08
            : 0.53 + (index % 4) * 0.035,
          replace: true, shadow: !windowRoot && index % 4 === 1
        });
      });
    // Curated mid-ground hierarchy follows actual ASCII tree cells. Trunks
    // remain upright and are nudged away from the path, grove sign and bench.
    [
      [9, 12, cedar, 0.62], [23, 12, fir, 0.6],
      [8, 13, fir, 0.64], [22, 13, cedar, 0.61],
      [7, 14, cedar, 0.64],
      [6, 15, fir, 0.61], [13, 15, cedar, 0.66], [20, 15, fir, 0.68],
      [5, 16, cedar, 0.58], [12, 16, fir, 0.7],
      [11, 17, cedar, 0.64], [18, 17, fir, 0.7],
      [17, 18, cedar, 0.61],
      [9, 19, cedar, 0.62], [16, 19, fir, 0.58], [23, 19, cedar, 0.6],
      [8, 20, fir, 0.59], [15, 20, cedar, 0.56], [22, 20, fir, 0.62]
    ].forEach(function (entry, index) {
      var px = entry[0] + 0.5;
      var pz = entry[1] + 0.6;
      if (entry[0] === 16 && entry[1] === 19) px -= 0.42;
      if (entry[0] === 17 && entry[1] === 18) pz -= 0.28;
      specs.push({
        root: entry[2], x: px, z: pz,
        replaceX: entry[0] + 0.5, replaceZ: entry[1] + 0.6,
        ry: -0.26 + (index % 7) * 0.085,
        scale: entry[3], replace: true, shadow: index % 5 === 2
      });
    });
    var heroes = [
      { root: fir, x: 9.35, z: 17.35, replaceX: 10.5, replaceZ: 18.6, ry: -0.08, targetHeight: 4.15, replace: true, shadow: true, hero: true },
      { root: cedar, x: 19.45, z: 16.95, replaceX: 19.5, replaceZ: 16.6, ry: 0.24, targetHeight: 3.8, replace: true, shadow: true, hero: true },
      { root: 'TP_VEG_DouglasFir_BrokenSnag_LOD0', x: 21.15, z: 14.95, replaceX: 21.5, replaceZ: 14.6, ry: -0.12, targetHeight: 3.15, replace: true, shadow: true, hero: true },
      { root: 'TP_VEG_SnagRootfall_LOD0', x: 8.65, z: 17.05, ry: 1.32, targetHeight: 0.72, shadow: true, hero: true },
      { root: 'TP_VEG_SnagRootfall_LOD0', x: 20.35, z: 18.45, ry: -1.18, targetHeight: 0.66, shadow: true, hero: true },
      { root: 'TP_VEG_SalalCluster_LOD0', x: 12.5, z: 20.5, ry: 0.2, targetHeight: 0.48, shadow: false, hero: true },
      { root: 'TP_VEG_SalalCluster_LOD0', x: 16.5, z: 20.5, ry: -0.24, targetHeight: 0.62, shadow: false, hero: true },
      { root: 'TP_VEG_FernCluster_LOD0', x: 11.85, z: 18.65, ry: -0.16, scale: 0.58, shadow: false },
      { root: 'TP_VEG_SalalCluster_LOD0', x: 16.05, z: 17.72, ry: 0.34, scale: 0.54, shadow: false },
      { root: 'TP_VEG_SalalCluster_LOD0', x: 18.7, z: 17.9, ry: -0.4, scale: 0.58, shadow: false }
    ];
    var allSpecs = specs.concat(heroes);
    var occupied = {};
    allSpecs.forEach(function (spec) {
      if (!spec.replace) return;
      var rx = spec.replaceX === undefined ? spec.x : spec.replaceX;
      var rz = spec.replaceZ === undefined ? spec.z : spec.replaceZ;
      occupied[Math.floor(rx) + ',' + Math.floor(rz)] = true;
    });
    // The evaluated south-to-north gameplay view used to reveal legacy cone
    // crowns between the authored heroes. Fill every remaining canonical
    // conifer tile in that visible half of the ASCII map with one of the
    // instanced GLB species. Collision remains entirely map-driven.
    var woodsRows = GAME.maps && GAME.maps.maps && GAME.maps.maps.woods
      ? GAME.maps.maps.woods.rows : [];
    for (var row = 0; row < woodsRows.length; row++) {
      for (var column = 0; column < woodsRows[row].length; column++) {
        var treeKind = woodsRows[row].charAt(column);
        if (treeKind !== 'T' && treeKind !== 'Y') continue;
        var key = column + ',' + row;
        if (occupied[key]) continue;
        var species = treeKind === 'Y'
          ? brokenSnag
          : [fir, hemlock, cedar, sapling][
            Math.abs(column * 7 + row * 11) % 4];
        allSpecs.push({
          root: species,
          x: column + 0.5 + Math.sin(column * 2.3 + row) * 0.16,
          z: row + 0.6 + Math.cos(column + row * 1.7) * 0.12,
          replaceX: column + 0.5, replaceZ: row + 0.6,
          ry: -0.42 + ((column * 5 + row * 3) % 9) * 0.105,
          scale: (treeKind === 'Y' ? 0.66 : 0.48) +
            ((column * 3 + row * 5) % 6) * 0.036,
          replace: true,
          shadow: ((column + row * 2) % 7) === 0
        });
      }
    }
    return allSpecs;
  })(),
  town: authoredBoundaryVegetation('town', [
    { root: 'TP_VEG_DouglasFir_Cascade_LOD0', x: 21.5, z: 25.6, ry: 0.18, scale: 0.72, replace: true, shadow: true },
    { root: 'TP_VEG_WesternHemlock_Wind_LOD0', x: 35.5, z: 27.6, ry: -0.36, scale: 0.72, replace: true, shadow: true },
    { root: 'TP_VEG_WesternRedCedar_Young_LOD0', x: 20.5, z: 34.6, ry: 0.44, scale: 0.7, replace: true, shadow: true }
  ], 29),
  traincar: authoredBoundaryVegetation('traincar', [], 47)
};
function authoredVegetationEnabled() {
  if (typeof window === 'undefined' || !window.location) return true;
  try {
    var value = new URLSearchParams(window.location.search).get('vegetation');
    return value !== 'off' && value !== '0' && value !== 'procedural';
  } catch (e) {
    return true;
  }
}
function authoredVegetationReplacesTile(mapId, x, z) {
  if (!authoredVegetationEnabled()) return false;
  var specs = AUTHORED_VEGETATION_PLACEMENTS[mapId] || [];
  for (var i = 0; i < specs.length; i++) {
    if (!specs[i].replace) continue;
    var replaceX = specs[i].replaceX === undefined ? specs[i].x : specs[i].replaceX;
    var replaceZ = specs[i].replaceZ === undefined ? specs[i].z : specs[i].replaceZ;
    if (Math.abs(replaceX - x) < 0.54 &&
        Math.abs(replaceZ - z) < 0.54) return true;
  }
  return false;
}
function authoredVegetationCoversUnderstory(mapId, x, z) {
  if (!authoredVegetationEnabled()) return false;
  var specs = AUTHORED_VEGETATION_PLACEMENTS[mapId] || [];
  for (var i = 0; i < specs.length; i++) {
    if (specs[i].replace ||
        (specs[i].root.indexOf('FernCluster') < 0 &&
         specs[i].root.indexOf('SalalCluster') < 0)) continue;
    if (Math.abs(specs[i].x - x) < 0.72 &&
        Math.abs(specs[i].z - z) < 0.72) return true;
  }
  return false;
}
var AUTHORED_WELCOME_BIOME_PLACEMENTS = [
  // Three overlapping ecological layers form one pocket east of the sign:
  // wet basin foreground, meadow fringe behind, woody shrub at the shoulder.
  { root: 'TP_BIOME_WelcomeRainGarden_A_LOD0', x: 33.9, z: 30.35, ry: 0.03, scale: 1.0 },
  { root: 'TP_BIOME_WelcomeMeadow_B_LOD0', x: 33.1, z: 29.0, ry: -0.24, scale: 0.92 },
  { root: 'TP_BIOME_WelcomeShrub_C_LOD0', x: 34.45, z: 31.45, ry: 0.18, scale: 0.9 }
];
var authoredCharacterAsset = {
  status: 'idle', scene: null, roots: {}, clips: {}, rig: null, boneRoot: null,
  url: null, error: null, version: null, geometryViews: {},
  celRamp: null, stylizedMaterials: {},
  playerActive: false, npcInstances: 0, mixerInstances: 0,
  skeletonInstances: 0, ownedMaterialInstances: 0, cloneErrors: 0
};
var AUTHORED_CHARACTER_ROOTS = {
  cooper: 'TP_CHAR_Cooper',
  truman: 'TP_CHAR_Truman',
  lucy: 'TP_CHAR_Lucy',
  andy: 'TP_CHAR_Andy',
  hawk: 'TP_CHAR_Hawk',
  sarah: 'TP_CHAR_Sarah',
  leland: 'TP_CHAR_Leland',
  norma: 'TP_CHAR_Norma',
  shelly: 'TP_CHAR_Shelly',
  loglady: 'TP_CHAR_LogLady',
  bobby: 'TP_CHAR_Bobby',
  donna: 'TP_CHAR_Donna',
  jacoby: 'TP_CHAR_Jacoby',
  audrey: 'TP_CHAR_Audrey',
  mfap: 'TP_CHAR_MFAP',
  laura: 'TP_CHAR_Laura',
  gerard: 'TP_CHAR_Gerard',
  benhorne: 'TP_CHAR_BenHorne',
  giant: 'TP_CHAR_Giant',
  maddy: 'TP_CHAR_Maddy',
  bob: 'TP_CHAR_BOB',
  james: 'TP_CHAR_James',
  jacques: 'TP_CHAR_Jacques',
  ronette: 'TP_CHAR_Ronette'
};
var AUTHORED_CHARACTER_CLIPS = [
  'TP_idle', 'TP_start', 'TP_grid_walk', 'TP_stop',
  'TP_turn90', 'TP_turn180', 'TP_talk_subtle', 'TP_inspect',
  'TP_blink_gaze', 'TP_cooper_coffee', 'TP_mfap_dance',
  'TP_laura_spectral', 'TP_bob_menace'
];
// GLTFLoader r147 sanitizes dots out of node names (`foot.L` → `footL`).
// Animation tracks still resolve, but runtime polish addresses authored Blender
// names. Keep both keys so limbs, props and contact solvers never silently miss.
var AUTHORED_CHARACTER_DOTTED_BONES = [
  'eye.L', 'eye.R', 'brow.L', 'brow.R',
  'clavicle.L', 'clavicle.R', 'upper_arm.L', 'upper_arm.R',
  'forearm.L', 'forearm.R', 'hand.L', 'hand.R',
  'finger.L', 'finger.R', 'thigh.L', 'thigh.R',
  'shin.L', 'shin.R', 'foot.L', 'foot.R', 'toe.L', 'toe.R',
  'coat.L', 'coat.R', 'prop_socket.L', 'prop_socket.R',
  'skirt.L', 'skirt.R'
];
// Proporzioni runtime calibrate contro porte/panchine. Il pack conserva mesh e
// skin condivisi, ma la silhouette in gioco usa un corpo più alto e stretto:
// l'adulto non legge più come una mascotte larga quanto una tile.
var AUTHORED_CHARACTER_WORLD_SCALE = 0.76;
var AUTHORED_CHARACTER_HEIGHT_SCALE = 0.86;
// TP_grid_walk contiene due appoggi. Tre tile producono un ciclo: la velocità
// della griglia resta invariata, ma la cadenza visiva è un jog (~3.1 passi/s).
var AUTHORED_CHARACTER_TILE_PHASE = 1 / 3;
var AUTHORED_CHARACTER_WALK_PHASE_OFFSET = 0;
var AUTHORED_CHARACTER_WALK_START_BLEND = 0.32;
var AUTHORED_CHARACTER_STOP_BLEND_MS = 285;
var AUTHORED_CHARACTER_START_LOAD_MS = 215;
var AUTHORED_CHARACTER_TURN_90_MS = 320;
var AUTHORED_CHARACTER_TURN_180_MS = 380;
var AUTHORED_CHARACTER_TURN_RECOVER_MS = 90;
// Il pack copre l'intero cast; durante decode/errore resta attivo il rig
// procedurale, quindi una risorsa opzionale non può bloccare la partita.
var AUTHORED_CHARACTERS_ENABLED = true;

  // Render-only dressing: coordinates stay at room/plaza edges and never
  // enter maps.js, M.SOLID, interaction data or actor placement.
  var AUTHORED_PROP_PLACEMENTS = {
    sheriff: [
      // One readable evidence/filing station along the west wall. It extends
      // the existing plant corner without competing with Hawk or Lucy.
      { root: 'TP_IN_EvidenceBoard', x: 1.2, z: 4.58, ry: Math.PI / 2, scale: 0.72 },
      { root: 'TP_IN_FileCabinet', x: 1.45, z: 5.75, ry: Math.PI / 2, scale: 0.8 },
      // Right-wall waiting zone: chair faces the room, table serves it, and
      // the plant/lamp sit against architecture beside the existing coatrack.
      { root: 'TP_IN_PottedPlant', x: 12.2, z: 5.65, ry: -0.18, scale: 0.64 },
      { root: 'TP_IN_FloorLamp', x: 12.18, z: 6.62, ry: 0, scale: 0.76 },
      { root: 'TP_IN_Armchair', x: 11.55, z: 7.62, ry: -Math.PI / 2, scale: 0.7 },
      { root: 'TP_IN_SideTable', x: 10.65, z: 7.68, ry: 0, scale: 0.65 }
    ],
    palmer: [
      { root: 'TP_IN_Sofa', x: 8.15, z: 5.48, ry: 0, scale: 0.86 },
      { root: 'TP_IN_SideTable', x: 9.55, z: 5.5, ry: 0, scale: 0.82 },
      { root: 'TP_IN_Armchair', x: 12.75, z: 5.95, ry: -0.18, scale: 0.8 },
      { root: 'TP_IN_PottedPlant', x: 14.25, z: 9.55, ry: -0.18, scale: 0.75 }
    ],
    town: [
      // The civic sign is the first read; one lamp belongs to its road edge.
      // Freestanding planter/bin novelties are intentionally omitted here.
      { root: 'TP_OUT_Lamppost', x: 26.35, z: 30.45, ry: 0, scale: 0.7 }
    ],
    woods: [
      // Three distinct silhouettes explain three distinct shoulders: a storm-
      // felled trail edge, stones at the oil threshold and a decayed grove.
      // They remain render-only and leave the x=14 walkable spine untouched.
      { root: 'TP_OUT_FallenLogRootball', x: 12.45, z: 11.35, ry: 0.34, scale: 0.72 },
      { root: 'TP_OUT_MossStonesBranch', x: 16.1, z: 9.45, ry: -0.48, scale: 0.72 },
      { root: 'TP_OUT_DecayedStumpFernFan', x: 11.3, z: 6.45, ry: 0.12, scale: 0.68 }
    ]
  };

  /* palette edifici */
  var BPAL = CONFIG.palettes;

  function maxSurfaceAnisotropy() {
    if (!renderer || !renderer.capabilities) return 1;
    return Math.min(4, renderer.capabilities.getMaxAnisotropy());
  }

  // Le texture colore e le data map seguono pipeline diverse. L'alias makeTex
  // resta pixel-sharp per UI/signage; superfici oblique e mappe PBR usano
  // mipmap, filtraggio lineare e nessuna decodifica sRGB sui dati.
  function makeColorTexture(cv, surface) {
    var t = new THREE.CanvasTexture(cv);
    t.encoding = THREE.sRGBEncoding;
    if (surface) {
      t.magFilter = THREE.LinearFilter;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.generateMipmaps = true;
      t.anisotropy = maxSurfaceAnisotropy();
    } else {
      t.magFilter = THREE.NearestFilter;
      t.minFilter = THREE.NearestFilter;
      t.generateMipmaps = false;
    }
    return t;
  }

  function makeTex(cv) { return makeColorTexture(cv, false); }
  function makeSurfaceTex(cv) { return makeColorTexture(cv, true); }

  function makeDataTex(cv, repeatX, repeatY) {
    var t = new THREE.CanvasTexture(cv);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeatX || 1, repeatY || 1);
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = maxSurfaceAnisotropy();
    return t;
  }

  function makeAlignedDataTex(cv) {
    var t = new THREE.CanvasTexture(cv);
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = maxSurfaceAnisotropy();
    return t;
  }

  var ENVIRONMENT_PROFILES = {
    outdoor: { bg: 0x53666d, room: 0x657671, key: 0xd8e4e5, fill: 0x9eb4bd, warm: 0xc9b89c, blur: 0.035 },
    indoor: { bg: 0x241d19, room: 0x6b5440, key: 0xffe4b8, fill: 0xb98e68, warm: 0xffb36f, blur: 0.04 },
    redroom: { bg: 0x140609, room: 0x351014, key: 0xd85a48, fill: 0x621820, warm: 0xffb58d, blur: 0.04 },
    town: { bg: 0x435b65, room: 0x526a67, key: 0xe6f2f1, fill: 0x88aab7, warm: 0xc9aa82, blur: 0.035 },
    woods: { bg: 0x1d2e2b, room: 0x34483d, key: 0xabc8c0, fill: 0x557268, warm: 0x9a8262, blur: 0.04 },
    sheriff: { bg: 0x202522, room: 0x4b4d42, key: 0xf2dfb5, fill: 0x719987, warm: 0xd8a25f, blur: 0.03 },
    palmer: { bg: 0x251c1d, room: 0x60483f, key: 0xe7d7c4, fill: 0x7899aa, warm: 0xe38a4f, blur: 0.03 }
  };

  function environmentFor(kind) {
    if (environmentCache[kind]) return environmentCache[kind];
    if (!renderer || !THREE.PMREMGenerator) return null;
    if (!pmremGenerator) {
      pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileCubemapShader();
    }

    var palette = ENVIRONMENT_PROFILES[kind] || ENVIRONMENT_PROFILES.outdoor;
    var env = new THREE.Scene();
    env.background = new THREE.Color(palette.bg);
    var shell = new THREE.Mesh(
      new THREE.BoxGeometry(20, 20, 20),
      new THREE.MeshBasicMaterial({ color: palette.room, side: THREE.BackSide })
    );
    env.add(shell);

    function panel(w, h, color, pos, rot) {
      var m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide })
      );
      m.position.set(pos[0], pos[1], pos[2]);
      m.rotation.set(rot[0], rot[1], rot[2]);
      env.add(m);
    }
    panel(8, 6, palette.key, [-3.5, 7, -1], [Math.PI / 2, 0, 0]);
    panel(5, 5, palette.fill, [-7, 1.5, -2], [0, Math.PI / 2, 0]);
    panel(3, 3, palette.warm, [5, 0.5, 5], [0, -Math.PI * 0.75, 0]);

    var target = pmremGenerator.fromScene(env, palette.blur, 0.1, 50);
    environmentTargets.push(target);
    environmentCache[kind] = target.texture;
    env.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
    return environmentCache[kind];
  }

  function updatePostQuality(w, h) {
    viewportW = w;
    viewportH = h;
    // SSAO desktop-only: il pass r147 porta anche il beauty target, quindi
    // ridurlo sfoca l'intero frame. Portrait/mobile tengono shadow + contact card.
    ssaoEnabled = !!(qualityAllowsSSAO && THREE.EffectComposer && THREE.SSAOPass &&
      w >= 720 && h >= 420 && w / h >= 0.75);
    // Il beauty target deve avere la stessa densità del renderer: a qualità
    // balanced il precedente target 1x veniva poi ingrandito a 1.25x,
    // ammorbidendo proprio profili architettonici e silhouette.
    postPixelRatio = renderPixelRatio;
    if (composer) {
      composer.setPixelRatio(postPixelRatio);
      composer.setSize(Math.max(1, w), Math.max(1, h));
      if (fxaaPass) {
        fxaaPass.uniforms.resolution.value.set(
          1 / Math.max(1, w * postPixelRatio),
          1 / Math.max(1, h * postPixelRatio)
        );
      }
    }
  }

  function fxaaShader() {
    return {
      uniforms: {
        tDiffuse: { value: null },
        resolution: {
          value: new THREE.Vector2(
            1 / Math.max(1, viewportW * postPixelRatio),
            1 / Math.max(1, viewportH * postPixelRatio)
          )
        }
      },
      vertexShader: [
        'varying vec2 vUv;',
        'void main(){',
        ' vUv=uv;',
        ' gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D tDiffuse;',
        'uniform vec2 resolution;',
        'varying vec2 vUv;',
        'void main(){',
        ' vec3 nw=texture2D(tDiffuse,vUv+vec2(-1.0,-1.0)*resolution).rgb;',
        ' vec3 ne=texture2D(tDiffuse,vUv+vec2( 1.0,-1.0)*resolution).rgb;',
        ' vec3 sw=texture2D(tDiffuse,vUv+vec2(-1.0, 1.0)*resolution).rgb;',
        ' vec3 se=texture2D(tDiffuse,vUv+vec2( 1.0, 1.0)*resolution).rgb;',
        ' vec4 center=texture2D(tDiffuse,vUv);',
        ' vec3 luma=vec3(0.299,0.587,0.114);',
        ' float lNW=dot(nw,luma),lNE=dot(ne,luma),lSW=dot(sw,luma),lSE=dot(se,luma);',
        ' float lM=dot(center.rgb,luma);',
        ' float lMin=min(lM,min(min(lNW,lNE),min(lSW,lSE)));',
        ' float lMax=max(lM,max(max(lNW,lNE),max(lSW,lSE)));',
        ' vec2 dir=vec2(-((lNW+lNE)-(lSW+lSE)),(lNW+lSW)-(lNE+lSE));',
        ' float reduce=max((lNW+lNE+lSW+lSE)*0.0078125,0.0009765625);',
        ' float inv=1.0/(min(abs(dir.x),abs(dir.y))+reduce);',
        ' dir=clamp(dir*inv,vec2(-8.0),vec2(8.0))*resolution;',
        ' vec3 a=0.5*(texture2D(tDiffuse,vUv+dir*(1.0/3.0-0.5)).rgb+',
        '              texture2D(tDiffuse,vUv+dir*(2.0/3.0-0.5)).rgb);',
        ' vec3 b=a*0.5+0.25*(texture2D(tDiffuse,vUv+dir*-0.5).rgb+',
        '                    texture2D(tDiffuse,vUv+dir*0.5).rgb);',
        ' float lB=dot(b,luma);',
        ' vec3 resolved=(lB<lMin||lB>lMax)?a:b;',
        // Dither deterministico di mezzo livello 8-bit: spezza le bande nelle
        // nebbie e nei rossi scuri senza il luccichio di un rumore temporale.
        ' float dither=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);',
        ' gl_FragColor=vec4(clamp(resolved+(dither-0.5)/255.0,0.0,1.0),center.a);',
        '}'
      ].join('\n')
    };
  }

  function configureSsaoForMap(map) {
    if (!ssaoPass || !map || ssaoPass._tpMapId === map.id) return;
    var red = map.id === 'redroom';
    var woods = map.id === 'woods';
    ssaoPass.kernelRadius = red ? 2.2 : (woods ? 2.65 : (map.indoor ? 2.8 : 2.2));
    ssaoPass.minDistance = red ? 0.002 : 0.003;
    ssaoPass.maxDistance = red ? 0.025 : (woods ? 0.032 : (map.indoor ? 0.03 : 0.024));
    ssaoPass._tpMapId = map.id;
  }

  function ensureComposer(scene, map) {
    // SSAOPass r147 produce un comb orizzontale sui grandi piani interni a
    // incidenza radente, visibile anche con albedo solida e bump disattivato.
    // Gli interni conservano ombre direzionali, contact card e materiale PBR,
    // ma passano dal renderer MSAA diretto. Outdoor continua a usare SSAO.
    if (!ssaoEnabled || (map && map.indoor)) return false;
    if (!composer) {
      var target = new THREE.WebGLRenderTarget(
        Math.max(1, viewportW),
        Math.max(1, viewportH)
      );
      target.texture.name = 'TwinPeaks.SSAOComposer';
      composer = new THREE.EffectComposer(renderer, target);
      ssaoPass = new THREE.SSAOPass(
        scene, camera,
        Math.max(1, viewportW),
        Math.max(1, viewportH),
        16
      );
      ssaoPass.kernelRadius = 3.5;
      ssaoPass.minDistance = 0.0025;
      ssaoPass.maxDistance = 0.04;
      ssaoPass.output = THREE.SSAOPass.OUTPUT.Default;
      ssaoPass.needsSwap = true;
      composer.addPass(ssaoPass);
      gammaPass = new THREE.ShaderPass(THREE.GammaCorrectionShader);
      composer.addPass(gammaPass);
      fxaaPass = new THREE.ShaderPass(fxaaShader());
      composer.addPass(fxaaPass);
      composer.setPixelRatio(postPixelRatio);
      composer.setSize(Math.max(1, viewportW), Math.max(1, viewportH));
    }
    ssaoPass.scene = scene;
    ssaoPass.camera = camera;
    configureSsaoForMap(map);
    return true;
  }

  /* ---------------- texture billboard ---------------- */

  var treeGeo = null, treeMats = null;

  function mergedTreeGeometry(parts) {
    var positions = [], normals = [], colors = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var matrix = new THREE.Matrix4().compose(
        new THREE.Vector3(p.pos[0], p.pos[1], p.pos[2]),
        new THREE.Quaternion(),
        new THREE.Vector3(p.scale[0], p.scale[1], p.scale[2])
      );
      var transformed = p.geo.clone();
      transformed.applyMatrix4(matrix);
      var flat = transformed.index ? transformed.toNonIndexed() : transformed;
      var pa = flat.attributes.position.array;
      var na = flat.attributes.normal.array;
      var color = new THREE.Color(p.color);
      for (var j = 0; j < pa.length; j += 3) {
        positions.push(pa[j], pa[j + 1], pa[j + 2]);
        normals.push(na[j], na[j + 1], na[j + 2]);
        colors.push(color.r, color.g, color.b);
      }
      if (flat !== transformed) flat.dispose();
      transformed.dispose();
    }
    var out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    out.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    out.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    out.computeBoundingSphere();
    return out;
  }

  function initTreeResources() {
    if (treeGeo) return;
    var cone = new THREE.ConeGeometry(1, 1, 7, 1, false);
    var crown = new THREE.DodecahedronGeometry(1, 0);
    var trunk = new THREE.CylinderGeometry(0.1, 0.13, 0.58, 7);
    function part(geo, pos, scale, color) {
      return { geo: geo, pos: pos, scale: scale, color: color };
    }
    function evergreen(variant) {
      var forms = [
        [0.77, 0.74, 0.62, 0.68, 0.45, 0.62],
        [0.66, 0.88, 0.56, 0.76, 0.38, 0.68],
        [0.88, 0.62, 0.7, 0.58, 0.5, 0.54],
        [0.72, 0.78, 0.5, 0.72, 0.34, 0.76]
      ];
      var f = forms[variant % forms.length];
      var lean = (variant - 1.5) * 0.018;
      return mergedTreeGeometry([
        part(cone, [lean, 0.75, 0], [f[0], f[1], f[0] * 0.96], variant === 2 ? '#183a24' : '#153f25'),
        part(cone, [-lean * 1.4, 1.11 + (variant === 1 ? 0.08 : 0), 0], [f[2], f[3], f[2] * 1.03], '#1d5830'),
        part(cone, [lean * 2.1, 1.48 + (variant === 3 ? 0.08 : 0), 0], [f[4], f[5], f[4]], variant === 0 ? '#2b7040' : '#347747'),
        part(trunk, [0, 0.29, 0], [1, 1, 1], '#5a3822')
      ]);
    }
    function sycamore(variant) {
      var v = variant % 4;
      var topX = [-0.04, 0.11, -0.14, 0.03][v];
      var broad = [1, 0.88, 1.12, 0.96][v];
      return mergedTreeGeometry([
        part(crown, [0, 1.1, 0], [0.63 * broad, 0.43 + v * 0.025, 0.58], '#315b35'),
        part(crown, [-0.3 - v * 0.025, 1.36, v % 2 ? 0.08 : -0.03], [0.4 + v * 0.02, 0.35 + (3 - v) * 0.02, 0.4], '#477a45'),
        part(crown, [0.31 + (3 - v) * 0.018, 1.34 + (v === 2 ? 0.08 : 0), v % 2 ? -0.06 : 0.05], [0.38 + (3 - v) * 0.018, 0.36, 0.42], '#477a45'),
        part(crown, [topX, 1.62 + v * 0.025, 0], [0.47 + v * 0.018, 0.38 + (v % 2) * 0.05, 0.48], v === 3 ? '#739f64' : '#65985b'),
        part(trunk, [0, 0.29, 0], [1, 1, 1], '#c9c5aa')
      ]);
    }
    treeGeo = {
      T: [evergreen(0), evergreen(1), evergreen(2), evergreen(3)],
      Y: [sycamore(0), sycamore(1), sycamore(2), sycamore(3)]
    };
    treeMats = {
      T: new THREE.MeshStandardMaterial({
        color: 0xffffff, vertexColors: true, roughness: 0.9, metalness: 0,
        flatShading: true, envMapIntensity: 0.42
      }),
      Y: new THREE.MeshStandardMaterial({
        color: 0xffffff, vertexColors: true, roughness: 0.9, metalness: 0,
        flatShading: true, envMapIntensity: 0.42
      })
    };
  }

  function tree3D(kind, x, z, scene, variant, scale, rotation) {
    // Volumi low-poly riusabili: sempreverde a tre falde coniche, sicomoro a
    // masse sfaccettate. Niente piani incrociati/alpha-overdraw.
    initTreeResources();
    var grp = new THREE.Group();
    var variantIndex = Math.abs(variant || 0) % treeGeo[kind].length;
    var treeMesh = new THREE.Mesh(treeGeo[kind][variantIndex], treeMats[kind]);
    treeMesh.castShadow = true;
    treeMesh.receiveShadow = true;
    treeMesh.userData.baseTreeMaterial = treeMats[kind];
    grp.add(treeMesh);
    grp.position.set(x, 0, z);
    grp.rotation.y = rotation || 0;
    grp.scale.setScalar(scale || 1);
    scene.add(grp);
    var blob = blobShadow(scene, x, z, 0.45 * (scale || 1));
    return {
      group: grp, foliage: [treeMesh], fadeMaterials: null,
      blob: blob, x: x, z: z, opacity: 1
    };
  }

  function addBackgroundTreeInstances(world, specsByVariant) {
    initTreeResources();
    world.backgroundTreeInstances = [];
    Object.keys(specsByVariant).forEach(function (key) {
      var specs = specsByVariant[key];
      if (!specs.length) return;
      var kind = key.charAt(0);
      var variant = +key.slice(1);
      var mesh = new THREE.InstancedMesh(
        treeGeo[kind][variant],
        treeMats[kind],
        specs.length
      );
      mesh.name = 'woods-background-trees-' + key;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      var dummy = new THREE.Object3D();
      for (var i = 0; i < specs.length; i++) {
        var spec = specs[i];
        dummy.position.set(spec.x, 0, spec.z);
        dummy.rotation.set(spec.rx, spec.ry, spec.rz);
        dummy.scale.set(spec.sx, spec.sy, spec.sz);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      world.scene.add(mesh);
      world.backgroundTreeInstances.push(mesh);
    });
  }

  // Hash spaziale stabile: spezza le diagonali ripetute prodotte da x/y lineari
  // senza introdurre Math.random (ogni riapertura conserva la stessa foresta).
  function treeVisualSeed(x, y) {
    var h = Math.imul(x + 0x7ed55d16, 0x1b873593) ^
            Math.imul(y + 0x165667b1, 0x85ebca6b);
    h ^= h >>> 15;
    h = Math.imul(h, 0x2c1b3c6d);
    h ^= h >>> 12;
    return h >>> 0;
  }

  // Tutti gli alberi normali condividono materiali. Solo 1-3 chiome davvero
  // interposte ricevono clone trasparente temporaneo; al termine viene disposto.
  function setTreeOpacity(tree, opacity) {
    if (opacity < 0.995) {
      if (!tree.fadeMaterials) {
        tree.fadeMaterials = [];
        for (var i = 0; i < tree.foliage.length; i++) {
          var fm = tree.foliage[i].userData.baseTreeMaterial.clone();
          fm.transparent = true;
          fm.depthWrite = false;
          tree.foliage[i].material = fm;
          tree.fadeMaterials.push(fm);
        }
      }
      for (var j = 0; j < tree.fadeMaterials.length; j++) tree.fadeMaterials[j].opacity = opacity;
    } else if (tree.fadeMaterials) {
      for (var k = 0; k < tree.foliage.length; k++) {
        tree.foliage[k].material = tree.foliage[k].userData.baseTreeMaterial;
        tree.fadeMaterials[k].dispose();
      }
      tree.fadeMaterials = null;
    }
  }

  // Testo dei cartelli, per mappa e posizione. Un tabellone vuoto letto
  // dall'alto sembra un tavolo: il testo e' cio' che lo rende un cartello.
  var SIGN_LABELS = {
    'woods:11,14': ['GLASTONBURY', 'GROVE'],
    'traincar:4,6': ['PONTE'],
    'traincar:20,2': ['ONE EYED JACKS']
  };

  // tavola di legno con scritta incisa; rapporto 320x142 = quello del board
  function signBoardTexture(lines) {
    var key = 'signboard_' + lines.join('|');
    if (texCache[key]) return texCache[key];
    var cv = document.createElement('canvas');
    cv.width = 320; cv.height = 142;
    var c = cv.getContext('2d');
    c.fillStyle = '#b89060'; c.fillRect(0, 0, 320, 142);
    c.fillStyle = '#d0aa78'; c.fillRect(0, 0, 320, 6);        // luce sul bordo alto
    c.fillStyle = '#6a4520';                                   // cornice
    c.fillRect(0, 0, 320, 5); c.fillRect(0, 137, 320, 5);
    c.fillRect(0, 0, 5, 142); c.fillRect(315, 0, 5, 142);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#3a2a18';
    if (lines.length > 1) {
      c.font = 'bold 34px monospace';
      c.fillText(lines[0], 160, 52);
      c.fillText(lines[1], 160, 94);
    } else {
      c.font = 'bold 42px monospace';
      c.fillText(lines[0], 160, 71);
    }
    texCache[key] = makeTex(cv);
    return texCache[key];
  }

  function sign3D(x, z, scene, label) {
    var grp = new THREE.Group();
    var postMat = new THREE.MeshLambertMaterial({ color: '#6a4520', flatShading: true });
    var woodMat = new THREE.MeshLambertMaterial({ color: '#a07c48', flatShading: true });
    // pali piu' stretti e ravvicinati: cosi' non sembrano gambe di un tavolo
    var post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 0.1), postMat);
    post.position.set(x - 0.22, 0.55, z);
    post.castShadow = true; post.receiveShadow = true;
    grp.add(post);
    post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 0.1), postMat);
    post.position.set(x + 0.22, 0.55, z);
    post.castShadow = true; post.receiveShadow = true;
    grp.add(post);
    var faceMat = label
      ? new THREE.MeshLambertMaterial({ map: signBoardTexture(label) })
      : woodMat;
    // ordine materiali BoxGeometry: +x,-x,+y,-y,+z,-z; la camera guarda la faccia +z
    var board = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.42, 0.08),
      [woodMat, woodMat, woodMat, woodMat, faceMat, woodMat]
    );
    board.position.set(x, 0.9, z + 0.02);
    board.castShadow = true; board.receiveShadow = true;
    grp.add(board);
    scene.add(grp);
    blobShadow(scene, x, z, 0.3);
    return grp;
  }

  function treeTexture(kind, variant) {
    var key = 'tree_' + kind + '_' + variant;
    if (texCache[key]) return texCache[key];
    var cv = document.createElement('canvas');
    cv.width = 48; cv.height = 64;
    var c = cv.getContext('2d');
    function F(x, y, w, h, col) { c.fillStyle = col; c.fillRect(x * 2, y * 2, w * 2, h * 2); }
    var out = kind === 'Y' ? '#2a4a30' : '#14301c';
    var dk = kind === 'Y' ? '#4a7a50' : '#245830';
    var md = kind === 'Y' ? '#66a06a' : '#357a42';
    var li = kind === 'Y' ? '#8cc48e' : '#4f9c58';
    var hi = kind === 'Y' ? '#b4dcaa' : '#6cbc70';
    F(10, 23, 4, 9, kind === 'Y' ? '#cfcfbc' : '#6b4423');
    F(10, 23, 1, 9, kind === 'Y' ? '#e6e6d8' : '#8a5c36');
    var rows = variant
      ? [8, 14, 18, 20, 22, 22, 22, 20, 16, 10]
      : [6, 12, 16, 20, 20, 22, 20, 18, 14, 8];
    var y, w;
    for (y = 0; y < rows.length; y++) { w = rows[y]; F(12 - w / 2, y * 2.4, w, 2.4, out); }
    for (y = 0; y < rows.length; y++) {
      w = Math.max(2, rows[y] - 2);
      F(12 - w / 2, y * 2.4 + 0.6, w, y === rows.length - 1 ? 1.2 : 2.4, dk);
    }
    F(4, 4, 10, 6, md); F(3, 8, 12, 7, md); F(6, 14, 10, 5, md);
    F(5, 5, 6, 4, li); F(4, 9, 7, 5, li); F(8, 15, 5, 3, li);
    F(6, 6, 4, 2, hi); F(5, 10, 4, 3, hi);
    F(15, 10, 5, 6, out); F(13, 16, 5, 4, out);
    F(14, 11, 4, 4, dk); F(12, 17, 4, 3, dk);
    texCache[key] = makeTex(cv);
    return texCache[key];
  }

  function simpleTex(key, w, h, draw) {
    if (texCache[key]) return texCache[key];
    var cv = document.createElement('canvas');
    cv.width = w * 2; cv.height = h * 2;
    var c = cv.getContext('2d');
    draw(function (x, y, ww, hh, col) { c.fillStyle = col; c.fillRect(x * 2, y * 2, ww * 2, hh * 2); }, c);
    texCache[key] = makeTex(cv);
    return texCache[key];
  }

  function signTexture() {
    return simpleTex('sign', 16, 16, function (F) {
      F(7, 8, 2, 8, '#6a4520');
      F(1, 1, 14, 8, '#6a4520');
      F(2, 2, 12, 6, '#b89060');
      F(2, 2, 12, 1, '#d0aa78');
      F(4, 4, 8, 1, '#4a3018');
      F(4, 6, 6, 1, '#4a3018');
    });
  }

  function tapeTexture() {
    return simpleTex('tape', 16, 16, function (F) {
      F(1, 4, 2, 12, '#5a5a5a'); F(13, 4, 2, 12, '#5a5a5a');
      F(1, 3, 2, 1, '#8a8a8a'); F(13, 3, 2, 1, '#8a8a8a');
      for (var i = 0; i < 10; i++) {
        F(3 + i, 6, 1, 2, i % 2 ? '#e8c820' : '#181818');
        F(3 + i, 10, 1, 2, i % 2 ? '#181818' : '#e8c820');
      }
    });
  }

  function statueTexture() {
    return simpleTex('statue', 16, 16, function (F) {
      F(4, 12, 8, 3, '#909098');
      F(5, 11, 6, 1, '#a8a8b0');
      F(6, 3, 4, 8, '#b8b8c0');
      F(6, 1, 4, 2, '#b8b8c0');
      F(7, 4, 1, 5, '#8a8a92');
    });
  }

  function sparkleTexture() {
    return simpleTex('spark', 8, 8, function (F) {
      F(3, 1, 2, 6, '#ffe060');
      F(1, 3, 6, 2, '#ffe060');
      F(3, 3, 2, 2, '#fff8d0');
    });
  }

  function smokeTexture() {
    return simpleTex('smoke', 16, 16, function (F) {
      F(5, 8, 7, 5, 'rgba(190,196,208,0.72)');
      F(4, 9, 9, 3, 'rgba(190,196,208,0.62)');
      F(6, 6, 4, 3, 'rgba(200,206,216,0.55)');
      F(6, 9, 3, 2, 'rgba(228,232,240,0.75)');
    });
  }

  function dustTexture() {
    if (texCache.dustSoft) return texCache.dustSoft;
    var cv = document.createElement('canvas');
    cv.width = 64; cv.height = 64;
    var c = cv.getContext('2d');
    // The former 12px crossed rectangles became a pale block over the shoe,
    // reading as duplicated geometry. These overlapping radial wisps stay
    // soil-coloured and disappear without hard silhouettes.
    [
      [24, 38, 21, [121, 105, 78, 0.24]],
      [40, 40, 17, [145, 128, 94, 0.18]],
      [32, 27, 13, [174, 157, 119, 0.12]]
    ].forEach(function (puff) {
      var g = c.createRadialGradient(
        puff[0], puff[1], 0, puff[0], puff[1], puff[2]);
      var rgb = puff[3];
      g.addColorStop(0, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' +
        rgb[2] + ',' + rgb[3] + ')');
      g.addColorStop(0.48, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' +
        rgb[2] + ',' + (rgb[3] * 0.34) + ')');
      g.addColorStop(1, 'rgba(121,105,78,0)');
      c.fillStyle = g;
      c.fillRect(
        puff[0] - puff[2], puff[1] - puff[2],
        puff[2] * 2, puff[2] * 2);
    });
    texCache.dustSoft = makeTex(cv);
    return texCache.dustSoft;
  }

  /* ---------------- insegne facciata: rendono ogni edificio riconoscibile ---------------- */

  // pittogrammi disegnati a percorso (non a blocchi come le altre texture) sul pannello dell'insegna
  function iconPine(c, cx, cy) {
    c.fillStyle = '#2a4a30';
    c.beginPath();
    c.moveTo(cx, cy - 26); c.lineTo(cx + 18, cy - 2); c.lineTo(cx + 10, cy - 2);
    c.lineTo(cx + 22, cy + 16); c.lineTo(cx - 22, cy + 16); c.lineTo(cx - 10, cy - 2); c.lineTo(cx - 18, cy - 2);
    c.closePath(); c.fill();
    c.fillStyle = '#5a3a24';
    c.fillRect(cx - 4, cy + 16, 8, 10);
  }

  function iconCup(c, cx, cy) {
    c.fillStyle = '#f0e8d8';
    c.fillRect(cx - 16, cy - 8, 28, 22);
    c.fillStyle = '#a81828';
    c.fillRect(cx - 16, cy - 8, 28, 5);
    c.strokeStyle = '#f0e8d8'; c.lineWidth = 4;
    c.beginPath(); c.arc(cx + 16, cy + 2, 8, -1.2, 1.2); c.stroke();
    c.fillStyle = 'rgba(240,232,216,0.7)';
    c.fillRect(cx - 10, cy - 22, 3, 12);
    c.fillRect(cx - 2, cy - 26, 3, 16);
    c.fillRect(cx + 6, cy - 22, 3, 12);
  }

  function iconStar(c, cx, cy) {
    c.fillStyle = '#d8b430';
    c.beginPath();
    for (var i = 0; i < 10; i++) {
      var ang = -Math.PI / 2 + i * Math.PI / 5;
      var rad = i % 2 === 0 ? 26 : 11;
      var px = cx + Math.cos(ang) * rad, py = cy + Math.sin(ang) * rad;
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath(); c.fill();
  }

  function iconCross(c, cx, cy) {
    c.fillStyle = '#c81820';
    c.fillRect(cx - 6, cy - 24, 12, 48);
    c.fillRect(cx - 24, cy - 6, 48, 12);
  }

  function iconNote(c, cx, cy) {
    c.fillStyle = '#f8c8e0';
    c.beginPath(); c.arc(cx - 10, cy + 14, 8, 0, 6.2832); c.fill();
    c.fillRect(cx - 2, cy - 24, 4, 38);
    c.beginPath();
    c.moveTo(cx - 2, cy - 24); c.quadraticCurveTo(cx + 14, cy - 20, cx + 12, cy - 6);
    c.quadraticCurveTo(cx + 6, cy - 12, cx - 2, cy - 8);
    c.closePath(); c.fill();
  }

  // targa per edificio: bordo, pannello interno, vite agli angoli, icona + nome in monospace
  var SIGN_SPEC = {
    '1': { label: 'SHERIFF', border: '#5a4228', plate: '#8a6a48', inner: '#c8a878', text: '#3a2810', icon: iconStar },
    '2': { label: 'DOUBLE R DINER', border: '#4a1418', plate: '#a81828', inner: '#f0e4d0', text: '#701018', icon: iconCup },
    '4': { label: 'GREAT NORTHERN', border: '#1c2e1c', plate: '#284030', inner: '#7c9878', text: '#e8d888', icon: iconPine },
    '5': { label: 'OSPEDALE', border: '#8a98a8', plate: '#ffffff', inner: '#e6e6e0', text: '#a81820', icon: iconCross },
    '6': { label: 'ROADHOUSE', border: '#241a12', plate: '#3a2e26', inner: '#5a4636', text: '#ff58c8', glow: '#ff58c8', icon: iconNote }
  };

  function signboardTexture(ch) {
    var key = 'plate_' + ch;
    if (texCache[key]) return texCache[key];
    var spec = SIGN_SPEC[ch];
    var cv = document.createElement('canvas');
    cv.width = 512; cv.height = 96;
    var c = cv.getContext('2d');
    c.fillStyle = spec.border; c.fillRect(0, 0, 512, 96);
    c.fillStyle = spec.plate; c.fillRect(8, 8, 496, 80);
    c.fillStyle = spec.inner; c.fillRect(16, 16, 480, 64);
    c.fillStyle = spec.border; // vite agli angoli
    c.fillRect(14, 14, 6, 6); c.fillRect(492, 14, 6, 6);
    c.fillRect(14, 76, 6, 6); c.fillRect(492, 76, 6, 6);
    spec.icon(c, 62, 48);
    c.font = 'bold 34px monospace';
    c.textBaseline = 'middle'; c.textAlign = 'left';
    if (spec.glow) { c.shadowColor = spec.glow; c.shadowBlur = 14; }
    c.fillStyle = spec.text;
    c.fillText(spec.label, 112, 50);
    texCache[key] = makeTex(cv);
    return texCache[key];
  }

  // targhetta bassa dei Palmer: nessuna insegna commerciale, solo il cognome
  function palmerPlateTexture() {
    var key = 'plate_palmer';
    if (texCache[key]) return texCache[key];
    var cv = document.createElement('canvas');
    cv.width = 256; cv.height = 96;
    var c = cv.getContext('2d');
    c.fillStyle = '#8a8478'; c.fillRect(0, 0, 256, 96);
    c.fillStyle = '#f4f0e6'; c.fillRect(6, 6, 244, 84);
    c.fillStyle = '#2a2420';
    c.font = 'bold 40px monospace';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('PALMER', 128, 50);
    texCache[key] = makeTex(cv);
    return texCache[key];
  }

  // insegna sul colmo del tetto del Double R, come i classici diner americani
  function dinerRoofTexture() {
    var key = 'roofsign_diner';
    if (texCache[key]) return texCache[key];
    var cv = document.createElement('canvas');
    cv.width = 512; cv.height = 128;
    var c = cv.getContext('2d');
    c.fillStyle = '#701018'; c.fillRect(0, 0, 512, 128);
    c.fillStyle = '#a81828'; c.fillRect(6, 6, 500, 116);
    c.fillStyle = '#f0e0c0';
    c.font = 'bold 56px monospace';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('DOUBLE R', 256, 64);
    texCache[key] = makeTex(cv);
    return texCache[key];
  }

  function hospitalCrossTexture() {
    return simpleTex('hosp_cross', 16, 16, function (F) {
      F(6, 1, 4, 14, '#c81820');
      F(1, 6, 14, 4, '#c81820');
    });
  }

  function flagTexture() {
    return simpleTex('flag', 16, 10, function (F) {
      F(0, 0, 16, 10, '#a81828');
      F(0, 0, 7, 5, '#20305a');
      F(0, 1, 2, 1, '#e8e8e8'); F(3, 1, 2, 1, '#e8e8e8');
      F(0, 3, 2, 1, '#e8e8e8'); F(3, 3, 2, 1, '#e8e8e8');
      F(0, 2, 16, 1, '#e8e8e8'); F(0, 6, 16, 1, '#e8e8e8'); F(0, 8, 16, 1, '#e8e8e8');
    });
  }

  function neonTexture() {
    return simpleTex('neon', 4, 16, function (F) {
      F(1, 0, 2, 16, '#ff58c8');
      F(0, 1, 4, 1, '#c8f8ff');
      F(0, 8, 4, 1, '#c8f8ff');
    });
  }

  /* comignolo sul colmo del tetto; ritorna la posizione del camino per il fumo */
  function addChimney(rc, scene) {
    var profile = buildingProfile(rc);
    var x1 = rc.bx + rc.bw + profile.eave;
    var z0 = rc.by - profile.eave, z1 = rc.by + rc.bh + profile.eave;
    var inset = Math.min((z1 - z0) / 2, (x1 - (rc.bx - profile.eave)) * 0.25);
    var cx = x1 - inset - 0.7, cz = (z0 + z1) / 2;
    var yTop = WALL_H + profile.roofH;
    var brick = new THREE.MeshStandardMaterial({ color: '#874f3d', roughness: 0.9, metalness: 0 });
    var mortar = new THREE.MeshStandardMaterial({ color: '#b69b83', roughness: 0.96, metalness: 0 });
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.54, 0.3),
      brick
    );
    body.position.set(cx, yTop + 0.22, cz);
    body.castShadow = true;
    body.receiveShadow = true;
    var cap = new THREE.Mesh(
      new THREE.BoxGeometry(0.39, 0.075, 0.39),
      brick
    );
    cap.position.set(cx, yTop + 0.505, cz);
    var hole = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.035, 0.22),
      new THREE.MeshStandardMaterial({ color: '#120b09', roughness: 1 })
    );
    hole.position.set(cx, yTop + 0.548, cz);
    scene.add(body); scene.add(cap); scene.add(hole);
    for (var band = 0; band < 3; band++) {
      buildingBox(scene, [0.315, 0.022, 0.315], [cx, yTop + 0.06 + band * 0.15, cz], mortar);
    }
    var darkBrick = new THREE.MeshStandardMaterial({ color: '#563127', roughness: 0.94, metalness: 0 });
    for (var row = 0; row < 3; row++) {
      var offset = row % 2 ? 0.075 : -0.075;
      buildingBox(scene, [0.12, 0.065, 0.025], [cx + offset, yTop + 0.115 + row * 0.15, cz + 0.162], darkBrick);
    }
    buildingBox(scene, [0.43, 0.04, 0.43], [cx, yTop + 0.015, cz], buildingMaterial(BPAL[rc.ch], 'metal'));
    return { x: cx, y: yTop + 0.6, z: cz };
  }

  function shingleTexture(pal) {
    var key = 'sh_' + pal.rf;
    if (texCache[key]) return texCache[key];
    var cv = document.createElement('canvas');
    cv.width = 32; cv.height = 16;
    var c = cv.getContext('2d');
    c.fillStyle = pal.rf; c.fillRect(0, 0, 32, 16);
    c.fillStyle = pal.rb;
    for (var y = 3; y < 16; y += 4) c.fillRect(0, y, 32, 1);
    for (var x = 0; x < 32; x += 8) {
      for (var y2 = 0; y2 < 16; y2 += 4) c.fillRect(((y2 / 4) % 2 ? x + 4 : x), y2, 1, 3);
    }
    c.fillStyle = 'rgba(255,255,255,0.10)';
    c.fillRect(0, 0, 32, 1);
    // Usura per famiglia: grandi variazioni a bassa frequenza, abbastanza
    // morbide da sopravvivere alla minificazione senza creare banding.
    if (pal.kind === 'hotel') {
      c.fillStyle = 'rgba(30,55,34,0.2)';
      c.fillRect(2, 4, 7, 3); c.fillRect(20, 10, 9, 3);
    } else if (pal.kind === 'palmer') {
      c.fillStyle = 'rgba(92,60,42,0.16)';
      c.fillRect(0, 10, 11, 2); c.fillRect(23, 3, 6, 2);
    } else if (pal.kind === 'diner') {
      c.fillStyle = 'rgba(210,230,238,0.12)';
      c.fillRect(5, 2, 12, 2); c.fillRect(24, 12, 6, 2);
    } else if (pal.kind === 'roadhouse') {
      c.fillStyle = 'rgba(12,9,8,0.22)';
      c.fillRect(3, 7, 9, 3); c.fillRect(19, 1, 10, 2);
    }
    var t = makeSurfaceTex(cv);
    t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
    texCache[key] = t;
    return t;
  }

  function plankTexture(pal) {
    var key = 'pl_' + pal.wall;
    if (texCache[key]) return texCache[key];
    var cv = document.createElement('canvas');
    cv.width = 32; cv.height = 32;
    var c = cv.getContext('2d');
    c.fillStyle = pal.wall; c.fillRect(0, 0, 32, 32);
    c.fillStyle = pal.wd;
    for (var y = 7; y < 32; y += 8) c.fillRect(0, y, 32, 1);
    c.fillStyle = pal.wl;
    for (y = 0; y < 32; y += 8) c.fillRect(0, y, 32, 1);
    c.fillStyle = pal.wd;
    c.fillRect(9, 2, 1, 1); c.fillRect(25, 11, 1, 1); c.fillRect(5, 19, 1, 1); c.fillRect(19, 27, 1, 1);
    c.fillStyle = pal.kind === 'hotel' || pal.kind === 'roadhouse'
      ? 'rgba(25,20,14,0.16)' : 'rgba(72,62,48,0.1)';
    c.fillRect(2, 15, 8, 2); c.fillRect(21, 23, 7, 2);
    var t = makeSurfaceTex(cv);
    t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
    texCache[key] = t;
    return t;
  }

  function buildingMaterial(pal, role, texture) {
    var key = pal.kind + '|' + role;
    if (texture) key += '|' + (texture.uuid || pal.wall);
    if (buildingMaterialCache[key]) return buildingMaterialCache[key];
    var finish = {
      siding: { roughness: 0.82, metalness: 0.01, env: 0.42 },
      facade: { roughness: 0.78, metalness: 0.01, env: 0.44 },
      roof: { roughness: 0.74, metalness: 0.03, env: 0.48 },
      trim: { roughness: 0.7, metalness: 0.02, env: 0.5 },
      stone: { roughness: 0.94, metalness: 0, env: 0.25 },
      glass: { roughness: 0.18, metalness: 0.12, env: 0.88 },
      metal: { roughness: 0.38, metalness: 0.62, env: 0.92 }
    }[role] || { roughness: 0.8, metalness: 0, env: 0.4 };
    var color = role === 'roof' ? pal.rf :
      (role === 'trim' ? pal.trim :
        (role === 'stone' ? '#77746d' :
          (role === 'glass' ? '#25445a' :
            (role === 'metal' ? pal.rb : 0xffffff))));
    var mat = new THREE.MeshStandardMaterial({
      color: color,
      map: texture || null,
      roughness: finish.roughness,
      metalness: finish.metalness,
      envMapIntensity: finish.env
    });
    buildingMaterialCache[key] = mat;
    return mat;
  }

  function buildingBox(parent, size, position, material, rotation) {
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
    mesh.position.set(position[0], position[1], position[2]);
    if (rotation) mesh.rotation.set(rotation[0] || 0, rotation[1] || 0, rotation[2] || 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function buildingProfile(rc) {
    var profiles = {
      '1': { roofH: 0.67, eave: 0.3, signW: 2.0, dormers: 0 },
      '2': { roofH: 0.48, eave: 0.42, signW: 2.15, dormers: 0 },
      '3': { roofH: 0.76, eave: 0.32, signW: 0, dormers: 1 },
      '4': { roofH: 1.02, eave: 0.44, signW: 2.25, dormers: 0 },
      '5': { roofH: 0.28, eave: 0.25, signW: 2.0, dormers: 0 },
      '6': { roofH: 0.62, eave: 0.38, signW: 2.1, dormers: 0 }
    };
    return profiles[rc.ch] || { roofH: ROOF_H, eave: EAVE, signW: 4.2, dormers: 0 };
  }

  function charTex(name, dir, frame, moving, t) {
    // drawChar usa t solo per respiro (tre offset interi) e blink. Chiavare col
    // tempo assoluto creava una CanvasTexture nuova ogni 80ms per ogni attore:
    // questa chiave rappresenta invece tutti e soli gli stati visivi possibili.
    var tm = t || 0;
    var breath = moving ? 0 : Math.round(Math.sin(tm / 350) * 1.2);
    var blink = !moving && ((tm % 4200) > 3900) ? 1 : 0;
    var key = name + '_' + dir + '_' + frame + '_' + (!!moving ? 1 : 0) + '_' + breath + '_' + blink;
    if (charTexCache[key]) return charTexCache[key];
    var cv = document.createElement('canvas');
    cv.width = 48; cv.height = 60;
    var c = cv.getContext('2d');
    Sp.drawChar(c, name, 0, 2, dir, frame, !!moving, tm);
    charTexCache[key] = makeTex(cv);
    return charTexCache[key];
  }

  /* ---------------- facciata ricca (2x: 32px di altezza) ---------------- */

  function facadeTexture(rc, pal) {
    var w = rc.bw * TILE * 2, h = TILE * 2;
    var cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var c = cv.getContext('2d');
    function F(x, y, ww, hh, col) { c.fillStyle = col; c.fillRect(x, y, ww, hh); }
    // assi orizzontali
    F(0, 0, w, h, pal.wall);
    var y;
    for (y = 6; y < h; y += 8) F(0, y, w, 1, pal.wd);
    for (y = 0; y < h; y += 8) F(0, y + 1, w, 1, pal.wl);
    // ombra della gronda in alto + zoccolo in pietra in basso
    F(0, 0, w, 4, 'rgba(0,0,0,0.30)');
    F(0, h - 4, w, 4, '#8a8478');
    F(0, h - 4, w, 1, '#a8a298');
    for (var sx = 3; sx < w; sx += 9) F(sx, h - 3, 4, 2, '#7a7468');
    // montanti d'angolo
    F(0, 0, 3, h, pal.trim); F(w - 3, 0, 3, h, pal.trim);
    F(3, 0, 1, h, pal.wl); F(w - 4, 0, 1, h, pal.wl);
    // insegna del Double R
    if (pal.kind === 'diner') {
      F(6, 3, w - 12, 7, pal.sign);
      F(6, 3, w - 12, 1, '#c83040');
      F(6, 9, w - 12, 1, '#701018');
      var mid = w / 2;
      F(mid - 9, 5, 3, 3, '#e8d0a0'); F(mid - 5, 5, 2, 1, '#e8d0a0'); F(mid - 5, 7, 2, 1, '#e8d0a0');
      F(mid + 3, 5, 3, 3, '#e8d0a0'); F(mid + 7, 5, 2, 1, '#e8d0a0'); F(mid + 7, 7, 2, 1, '#e8d0a0');
    }
    // stella dello sceriffo
    if (pal.kind === 'sheriff') {
      var mx = w / 2;
      F(mx - 3, 4, 6, 6, '#d8b430'); F(mx - 1, 2, 2, 2, '#d8b430');
      F(mx - 5, 6, 2, 2, '#d8b430'); F(mx + 3, 6, 2, 2, '#d8b430');
      F(mx - 2, 5, 4, 4, '#b09020');
    }
    var d, i, isDoor, px;
    for (i = 0; i < rc.bw; i++) {
      isDoor = false;
      for (d = 0; d < rc.doors.length; d++) if (rc.doors[d].x === rc.bx + i) isDoor = true;
      px = i * TILE * 2;
      if (isDoor) {
        // portico: architrave, vano incassato, pannelli, pomello, gradino
        F(px + 4, 5, 24, 2, pal.trim);
        F(px + 5, 7, 22, 21, '#140c08');
        F(px + 7, 9, 18, 17, '#2a1a10');
        F(px + 9, 11, 6, 6, '#1c1008'); F(px + 17, 11, 6, 6, '#1c1008');
        F(px + 9, 19, 14, 5, '#1c1008');
        F(px + 23, 17, 2, 3, '#d8b878');
        F(px + 3, 28, 26, 3, '#b0a898');
        F(px + 3, 28, 26, 1, '#d0c8b8');
      } else if (i % 2 === 1) {
        // finestra: tenda a righe, telaio, vetro a 4 riquadri, davanzale, persiane
        F(px + 5, 4, 22, 3, pal.kind === 'diner' ? '#e8e8e8' : '#7aa0c8');
        F(px + 7, 4, 3, 3, pal.kind === 'diner' ? '#a81828' : '#5a80a8');
        F(px + 13, 4, 3, 3, pal.kind === 'diner' ? '#a81828' : '#5a80a8');
        F(px + 19, 4, 3, 3, pal.kind === 'diner' ? '#a81828' : '#5a80a8');
        F(px + 4, 7, 24, 1, pal.trim);
        F(px + 2, 8, 3, 14, pal.trim); F(px + 27, 8, 3, 14, pal.trim);
        F(px + 5, 8, 22, 14, pal.wd);
        F(px + 7, 10, 18, 10, '#22303e');
        F(px + 7, 10, 18, 3, '#6a86a2');
        F(px + 15, 10, 2, 10, pal.wd);
        F(px + 7, 14, 18, 1, pal.wd);
        F(px + 4, 22, 24, 2, pal.wl);
        F(px + 4, 24, 24, 1, 'rgba(0,0,0,0.25)');
      }
    }
    return makeSurfaceTex(cv);
  }

  /* ---------------- geometrie ---------------- */

  function hipRoof(rc, pal) {
    var profile = buildingProfile(rc);
    var x0 = rc.bx - profile.eave, x1 = rc.bx + rc.bw + profile.eave;
    var z0 = rc.by - profile.eave, z1 = rc.by + rc.bh + profile.eave;
    var yE = WALL_H, yR = WALL_H + profile.roofH;
    var inset = Math.min((z1 - z0) / 2, (x1 - x0) * 0.25);
    var rx0 = x0 + inset, rx1 = x1 - inset, rz = (z0 + z1) / 2;
    var pos = [], uv = [], idx = [];
    function quad(a, b, c2, d, uw, uh) {
      var base = pos.length / 3;
      pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c2[0], c2[1], c2[2], d[0], d[1], d[2]);
      uv.push(0, 0, uw, 0, uw, uh, 0, uh);
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    function tri(a, b, c2, uw, uh) {
      var base = pos.length / 3;
      pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c2[0], c2[1], c2[2]);
      uv.push(0, 0, uw, 0, uw / 2, uh);
      idx.push(base, base + 1, base + 2);
    }
    var slope = Math.sqrt(inset * inset + profile.roofH * profile.roofH);
    quad([x0, yE, z1], [x1, yE, z1], [rx1, yR, rz], [rx0, yR, rz], (x1 - x0) / 2, slope / 1.2);
    quad([x1, yE, z0], [x0, yE, z0], [rx0, yR, rz], [rx1, yR, rz], (x1 - x0) / 2, slope / 1.2);
    tri([x0, yE, z0], [x0, yE, z1], [rx0, yR, rz], (z1 - z0) / 2, slope / 1.2);
    tri([x1, yE, z1], [x1, yE, z0], [rx1, yR, rz], (z1 - z0) / 2, slope / 1.2);
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    var mesh = new THREE.Mesh(g, buildingMaterial(pal, 'roof', shingleTexture(pal)));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    // colmo
    var ridge = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(0.2, rx1 - rx0 + 0.18), 0.075, 0.16),
      new THREE.MeshStandardMaterial({ color: pal.rr, roughness: 0.5, metalness: 0.18, envMapIntensity: 0.7 })
    );
    ridge.position.set((rx0 + rx1) / 2, yR + 0.035, rz);
    ridge.castShadow = true;
    var grp = new THREE.Group();
    grp.add(mesh); grp.add(ridge);

    // Fasce vere lungo il perimetro anziché una scatola piena sotto il tetto:
    // l'ombra resta netta ma la gronda conserva profondità e non copre la facciata.
    var fascia = buildingMaterial(pal, 'trim');
    buildingBox(grp, [x1 - x0, 0.085, 0.09], [(x0 + x1) / 2, yE - 0.01, z1 - 0.015], fascia);
    buildingBox(grp, [x1 - x0, 0.085, 0.09], [(x0 + x1) / 2, yE - 0.01, z0 + 0.015], fascia);
    buildingBox(grp, [0.09, 0.085, z1 - z0], [x0 + 0.015, yE - 0.01, (z0 + z1) / 2], fascia);
    buildingBox(grp, [0.09, 0.085, z1 - z0], [x1 - 0.015, yE - 0.01, (z0 + z1) / 2], fascia);

    // Canale di gronda + discendenti sul fronte: geometria separata e distanziata
    // elimina il rischio di z-fighting con la fascia.
    var gutterMat = buildingMaterial(pal, 'metal');
    buildingBox(grp, [x1 - x0 - 0.08, 0.055, 0.07], [(x0 + x1) / 2, yE - 0.055, z1 + 0.045], gutterMat);
    buildingBox(grp, [0.055, WALL_H * 0.78, 0.065], [x0 + 0.08, WALL_H * 0.39, z1 + 0.045], gutterMat);
    buildingBox(grp, [0.055, WALL_H * 0.78, 0.065], [x1 - 0.08, WALL_H * 0.39, z1 + 0.045], gutterMat);
    return grp;
  }

  // tetto piatto dell'ospedale: parapetto + croce rossa piatta vista dall'alto
  function flatRoof(rc, pal) {
    var profile = buildingProfile(rc);
    var x0 = rc.bx - profile.eave, x1 = rc.bx + rc.bw + profile.eave;
    var z0 = rc.by - profile.eave, z1 = rc.by + rc.bh + profile.eave;
    var yE = WALL_H;
    var grp = new THREE.Group();
    var roofMat = new THREE.MeshStandardMaterial({ color: '#66727b', roughness: 0.88, metalness: 0.04, envMapIntensity: 0.38 });
    var parapetMat = buildingMaterial(pal, 'facade');
    var capMat = buildingMaterial(pal, 'metal');
    buildingBox(grp, [x1 - x0, 0.08, z1 - z0], [(x0 + x1) / 2, yE + 0.04, (z0 + z1) / 2], roofMat);
    buildingBox(grp, [x1 - x0, 0.26, 0.16], [(x0 + x1) / 2, yE + 0.17, z0 + 0.08], parapetMat);
    buildingBox(grp, [x1 - x0, 0.26, 0.16], [(x0 + x1) / 2, yE + 0.17, z1 - 0.08], parapetMat);
    buildingBox(grp, [0.16, 0.26, z1 - z0], [x0 + 0.08, yE + 0.17, (z0 + z1) / 2], parapetMat);
    buildingBox(grp, [0.16, 0.26, z1 - z0], [x1 - 0.08, yE + 0.17, (z0 + z1) / 2], parapetMat);
    buildingBox(grp, [x1 - x0 + 0.04, 0.035, 0.2], [(x0 + x1) / 2, yE + 0.315, z1 - 0.08], capMat);

    // Impianti volutamente asimmetrici: il tetto legge come edificio operativo,
    // non come rettangolo procedurale. Tutte le superfici sono a quote distinte.
    var unitMat = new THREE.MeshStandardMaterial({ color: '#aab2b4', roughness: 0.55, metalness: 0.42, envMapIntensity: 0.72 });
    buildingBox(grp, [0.9, 0.3, 0.62], [x0 + (x1 - x0) * 0.28, yE + 0.25, (z0 + z1) / 2 - 0.18], unitMat);
    buildingBox(grp, [0.62, 0.24, 0.46], [x0 + (x1 - x0) * 0.7, yE + 0.22, (z0 + z1) / 2 + 0.22], unitMat);
    for (var vent = -1; vent <= 1; vent++) {
      buildingBox(grp, [0.06, 0.02, 0.5], [x0 + (x1 - x0) * 0.28 + vent * 0.19, yE + 0.41, (z0 + z1) / 2 - 0.18], capMat);
    }
    var crossMat = new THREE.MeshStandardMaterial({ color: '#c81820', roughness: 0.5, metalness: 0.12, envMapIntensity: 0.55 });
    var cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    buildingBox(grp, [1.05, 0.045, 0.3], [cx, yE + 0.385, cz], crossMat);
    buildingBox(grp, [0.3, 0.045, 1.05], [cx, yE + 0.385, cz], crossMat);
    return grp;
  }

  // insegna montata sulla facciata sud, sopra la porta; ritorna posizione/dimensioni
  // per chi deve agganciarsi (es. le luci al neon del roadhouse)
  // Insegna dell'edificio. Sul TETTO, non sulla facciata: la facciata e' alta un
  // solo tile e la gronda la mette in ombra, li' il testo non si legge. Sopra il
  // colmo invece l'insegna e' in pieno campo visivo (la lezione del Double R).
  function addBuildingSign(rc, grp) {
    var profile = buildingProfile(rc);
    var doorX = rc.doors.length ? rc.doors[0].x + 0.5 : rc.bx + rc.bw / 2;
    var southZ = rc.by + rc.bh; // bordo sud: la faccia rivolta verso la camera

    if (rc.ch === '3') {
      // casa privata: niente insegna sul tetto, un cartello da giardino sul palo
      var pw = 1.12, ph = pw * 96 / 256;
      var plate = new THREE.Mesh(
        new THREE.PlaneGeometry(pw, ph),
        new THREE.MeshBasicMaterial({ map: palmerPlateTexture(), transparent: true })
      );
      var yardX = doorX + 1.7, yardZ = southZ + 0.82;
      plate.position.set(yardX, 0.72, yardZ);
      grp.add(plate);
      var stake = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.85, 0.08),
        new THREE.MeshLambertMaterial({ color: '#6a4a2e' })
      );
      stake.scale.y = 0.72;
      stake.position.set(yardX, 0.31, yardZ);
      stake.castShadow = true;
      grp.add(stake);
      return null;
    }

    // Ogni landmark usa un supporto leggibile dalla camera fissa: frontone per
    // gli edifici civici/venue, fascia canopy per l'ospedale.
    var w = Math.min(rc.bw * 0.42, profile.signW), h = w * 96 / 512; // rapporto della texture
    var signX = doorX;
    var y = rc.ch === '5' ? 1.07 :
      (rc.ch === '4' ? 1.24 : (rc.ch === '6' ? 1.22 : 1.14));
    var z = southZ + (rc.ch === '5' ? 0.89 :
      (rc.ch === '4' ? 0.7 : (rc.ch === '6' ? 0.56 : 0.55)));
    var backing = new THREE.Mesh(                           // spessore scuro dietro la targa
      new THREE.BoxGeometry(w + 0.14, h + 0.14, 0.09),
      new THREE.MeshStandardMaterial({ color: '#241a12', roughness: 0.5, metalness: 0.16, envMapIntensity: 0.65 })
    );
    backing.position.set(signX, y, z - 0.05);
    backing.castShadow = true;
    grp.add(backing);
    var mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: signboardTexture(rc.ch), transparent: true })
    );
    mesh.position.set(signX, y, z + 0.008);
    grp.add(mesh);
    // due bracci di sostegno che tornano verso la facciata
    var armMat = new THREE.MeshStandardMaterial({ color: '#241a12', roughness: 0.4, metalness: 0.48, envMapIntensity: 0.82 });
    var pi, px;
    for (pi = -1; pi <= 1; pi += 2) {
      px = signX + pi * w * 0.36;
      var armDepth = rc.ch === '5' ? 0.1 : 0.16;
      var arm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, armDepth), armMat);
      arm.position.set(px, y - h / 2 + 0.05, z - armDepth / 2 - 0.045);
      grp.add(arm);
    }
    return { x: signX, y: y, w: w, z: z };
  }

  // insegna sul colmo del tetto del Double R: il classico rooftop sign da diner americano
  function addDinerRoofSign(rc, grp) {
    var profile = buildingProfile(rc);
    var x0 = rc.bx - profile.eave, x1 = rc.bx + rc.bw + profile.eave;
    var z0 = rc.by - profile.eave, z1 = rc.by + rc.bh + profile.eave;
    var inset = Math.min((z1 - z0) / 2, (x1 - x0) * 0.25);
    var rx0 = x0 + inset, rx1 = x1 - inset, rz = (z0 + z1) / 2;
    var w = Math.min((rx1 - rx0) * 0.58, profile.signW), h = w / 4; // stesso rapporto della texture 512x128
    var sy = WALL_H + profile.roofH * 0.46 + h / 2;
    var signZ = z1 + 0.08;
    var back = buildingBox(
      grp, [w + 0.14, h + 0.14, 0.085], [(rx0 + rx1) / 2, sy, signZ - 0.055],
      new THREE.MeshStandardMaterial({ color: '#4a1418', roughness: 0.48, metalness: 0.18, envMapIntensity: 0.62 })
    );
    back.castShadow = true;
    var plane = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: dinerRoofTexture(), transparent: true })
    );
    plane.position.set((rx0 + rx1) / 2, sy, signZ);
    grp.add(plane);
    var postMat = buildingMaterial(BPAL['2'], 'metal');
    for (var side = -1; side <= 1; side += 2) {
      buildingBox(grp, [0.08, 0.38, 0.08], [(rx0 + rx1) / 2 + side * w * 0.32, sy - h / 2 - 0.16, signZ - 0.18], postMat, [-0.45, 0, 0]);
    }
  }

  // pennone dello sceriffo accanto alla porta, con bandierina in cima
  function addFlagpole(rc, grp) {
    var doorX = rc.doors.length ? rc.doors[0].x + 0.5 : rc.bx + rc.bw / 2;
    var px = Math.min(rc.bx + rc.bw + 0.3, doorX + 0.9);
    var pz = rc.by + rc.bh + 0.15;
    var pole = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 1.8, 0.08),
      new THREE.MeshLambertMaterial({ color: '#5a4a38' })
    );
    pole.position.set(px, 0.9, pz);
    pole.castShadow = true;
    grp.add(pole);
    var flag = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.32),
      new THREE.MeshBasicMaterial({ map: flagTexture(), transparent: true, side: THREE.DoubleSide })
    );
    flag.position.set(px + 0.27, 1.65, pz);
    grp.add(flag);
  }

  // due barre "al neon" che affiancano l'insegna del roadhouse
  function addNeonBars(rc, grp, sign) {
    var z = sign.z + 0.015;
    var tubeMat = new THREE.MeshStandardMaterial({
      color: '#ff78d4', emissive: '#ff279f', emissiveIntensity: 1.75,
      roughness: 0.28, metalness: 0.08, envMapIntensity: 0.8
    });
    buildingBox(grp, [0.08, 0.58, 0.06], [sign.x - sign.w / 2 - 0.2, sign.y, z], tubeMat);
    buildingBox(grp, [0.08, 0.58, 0.06], [sign.x + sign.w / 2 + 0.2, sign.y, z], tubeMat);
  }

  // tettoia coperta sopra la porta del Great Northern
  function addAwning(rc, pal, grp) {
    var doorX = rc.doors.length ? rc.doors[0].x + 0.5 : rc.bx + rc.bw / 2;
    var southZ = rc.by + rc.bh;
    var roofMat = buildingMaterial(pal, 'roof', shingleTexture(pal));
    var postMat = buildingMaterial(pal, 'trim');
    buildingBox(grp, [1.65, 0.1, 0.72], [doorX, WALL_H + 0.08, southZ + 0.31], roofMat, [-0.12, 0, 0]);
    buildingBox(grp, [1.52, 0.1, 0.12], [doorX, WALL_H + 0.03, southZ + 0.63], postMat);
    var postH = WALL_H - 0.08;
    buildingBox(grp, [0.09, postH, 0.09], [doorX - 0.66, postH / 2, southZ + 0.58], postMat);
    buildingBox(grp, [0.09, postH, 0.09], [doorX + 0.66, postH / 2, southZ + 0.58], postMat);
    buildingBox(grp, [1.62, 0.11, 0.72], [doorX, 0.055, southZ + 0.35], buildingMaterial(pal, 'stone'));
    buildingBox(grp, [1.18, 0.07, 0.28], [doorX, 0.035, southZ + 0.84], buildingMaterial(pal, 'stone'));
  }

  function addFacadeDepth(rc, pal, grp) {
    var southZ = rc.by + rc.bh;
    var cx = rc.bx + rc.bw / 2;
    var trimMat = buildingMaterial(pal, 'trim');
    var stoneMat = buildingMaterial(pal, 'stone');
    var glassMat = buildingMaterial(pal, 'glass');
    var doorMat = new THREE.MeshStandardMaterial({
      color: pal.kind === 'hospital' ? '#394c58' : pal.wd,
      roughness: 0.64, metalness: pal.kind === 'hospital' ? 0.18 : 0.02,
      envMapIntensity: 0.55
    });
    var recessMat = new THREE.MeshStandardMaterial({ color: '#130f0c', roughness: 1, metalness: 0 });

    // Zoccolo continuo e pilastri d'angolo danno scala e separano l'edificio
    // dal terreno senza decal coplanari.
    buildingBox(grp, [rc.bw + 0.14, 0.13, rc.bh + 0.14], [cx, 0.065, rc.by + rc.bh / 2], stoneMat);
    buildingBox(grp, [0.12, WALL_H - 0.04, 0.1], [rc.bx + 0.06, WALL_H / 2, southZ + 0.045], trimMat);
    buildingBox(grp, [0.12, WALL_H - 0.04, 0.1], [rc.bx + rc.bw - 0.06, WALL_H / 2, southZ + 0.045], trimMat);

    var i, d, isDoor, wx;
    for (i = 0; i < rc.bw; i++) {
      isDoor = false;
      for (d = 0; d < rc.doors.length; d++) {
        if (rc.doors[d].x === rc.bx + i) { isDoor = true; break; }
      }
      wx = rc.bx + i + 0.5;
      if (isDoor) {
        buildingBox(grp, [0.76, 0.8, 0.055], [wx, 0.46, southZ + 0.032], recessMat);
        buildingBox(grp, [0.58, 0.7, 0.055], [wx, 0.42, southZ + 0.085], doorMat);
        buildingBox(grp, [0.1, 0.82, 0.09], [wx - 0.39, 0.46, southZ + 0.095], trimMat);
        buildingBox(grp, [0.1, 0.82, 0.09], [wx + 0.39, 0.46, southZ + 0.095], trimMat);
        buildingBox(grp, [0.88, 0.1, 0.09], [wx, 0.88, southZ + 0.095], trimMat);
        buildingBox(grp, [0.17, 0.06, 0.06], [wx + 0.2, 0.43, southZ + 0.145],
          new THREE.MeshStandardMaterial({ color: '#d0ae68', roughness: 0.32, metalness: 0.7, envMapIntensity: 0.9 }));
      } else if (i % 2 === 1) {
        var windowW = pal.kind === 'diner' ? 0.82 :
          (pal.kind === 'hospital' ? 0.46 : (pal.kind === 'roadhouse' ? 0.62 : 0.7));
        var windowH = pal.kind === 'diner' ? 0.38 :
          (pal.kind === 'hospital' ? 0.46 : (pal.kind === 'roadhouse' ? 0.28 : 0.5));
        var windowY = pal.kind === 'roadhouse' ? 0.47 : 0.52;
        buildingBox(grp, [windowW + 0.16, windowH + 0.16, 0.06], [wx, windowY, southZ + 0.04], trimMat);
        buildingBox(grp, [windowW, windowH, 0.04], [wx, windowY, southZ + 0.095], glassMat);
        buildingBox(grp, [0.035, windowH, 0.035], [wx, windowY, southZ + 0.13], trimMat);
        if (pal.kind !== 'roadhouse') {
          buildingBox(grp, [windowW, 0.035, 0.035], [wx, windowY, southZ + 0.13], trimMat);
        }
        buildingBox(grp, [windowW + 0.22, 0.075, 0.16], [wx, windowY - windowH / 2 - 0.09, southZ + 0.1], stoneMat);
        if (pal.kind === 'palmer' || pal.kind === 'hotel') {
          buildingBox(grp, [0.11, 0.5, 0.08], [wx - 0.42, 0.52, southZ + 0.095], trimMat);
          buildingBox(grp, [0.11, 0.5, 0.08], [wx + 0.42, 0.52, southZ + 0.095], trimMat);
        }
      }
    }

  }

  function addDormers(rc, pal, grp) {
    var profile = buildingProfile(rc);
    if (!profile.dormers || rc.bw < 5) return;
    var southZ = rc.by + rc.bh;
    var roofMat = buildingMaterial(pal, 'roof', shingleTexture(pal));
    var wallMat = buildingMaterial(pal, 'facade', plankTexture(pal));
    var trimMat = buildingMaterial(pal, 'trim');
    var glassMat = buildingMaterial(pal, 'glass');
    var count = Math.min(profile.dormers, Math.floor(rc.bw / 4));
    for (var i = 0; i < count; i++) {
      var dx = rc.bx + rc.bw * (i + 1) / (count + 1);
      var baseY = WALL_H + profile.roofH * 0.24;
      var dz = southZ - 0.14;
      buildingBox(grp, [0.72, 0.44, 0.42], [dx, baseY + 0.22, dz], wallMat);
      buildingBox(grp, [0.5, 0.25, 0.035], [dx, baseY + 0.23, dz + 0.225], glassMat);
      buildingBox(grp, [0.035, 0.25, 0.03], [dx, baseY + 0.23, dz + 0.25], trimMat);
      buildingBox(grp, [0.5, 0.035, 0.03], [dx, baseY + 0.23, dz + 0.25], trimMat);
      buildingBox(grp, [0.5, 0.06, 0.54], [dx - 0.2, baseY + 0.52, dz], roofMat, [0, 0, 0.52]);
      buildingBox(grp, [0.5, 0.06, 0.54], [dx + 0.2, baseY + 0.52, dz], roofMat, [0, 0, -0.52]);
    }
  }

  function addGableCap(grp, x, z, width, depth, wallTop, rise, roofMat) {
    var halfRun = width / 2 + 0.12;
    var panelLen = Math.sqrt(halfRun * halfRun + rise * rise);
    var angle = Math.atan2(rise, halfRun);
    buildingBox(grp, [panelLen, 0.075, depth + 0.22],
      [x - width * 0.25, wallTop + rise * 0.5, z], roofMat, [0, 0, angle]);
    buildingBox(grp, [panelLen, 0.075, depth + 0.22],
      [x + width * 0.25, wallTop + rise * 0.5, z], roofMat, [0, 0, -angle]);
    var joinColor = roofMat && roofMat.color
      ? roofMat.color.clone().multiplyScalar(0.42) : new THREE.Color('#353532');
    var joinMat = new THREE.MeshStandardMaterial({
      color: joinColor, roughness: 0.82, metalness: 0.02, envMapIntensity: 0.3
    });
    // Colmo e scossalina arretrata mascherano i due soli punti di innesto:
    // nessuna coppia di pannelli resta coplanare al tetto principale.
    buildingBox(grp, [0.12, 0.085, depth + 0.3],
      [x, wallTop + rise + 0.035, z], joinMat);
    buildingBox(grp, [width + 0.16, 0.045, 0.09],
      [x, wallTop + 0.025, z - depth / 2 - 0.09], joinMat);
  }

  function addPorchRail(grp, x, z, width, depth, material, openWidth) {
    var sideX = width / 2 - 0.06;
    var railY = 0.34;
    buildingBox(grp, [0.055, 0.055, depth], [x - sideX, railY, z], material);
    buildingBox(grp, [0.055, 0.055, depth], [x + sideX, railY, z], material);
    for (var side = -1; side <= 1; side += 2) {
      for (var front = -1; front <= 1; front += 2) {
        buildingBox(grp, [0.055, railY * 2, 0.055],
          [x + side * sideX, railY, z + front * depth / 2], material);
      }
    }
    if (openWidth && width > openWidth + 0.3) {
      var span = (width - openWidth) / 2;
      buildingBox(grp, [span, 0.055, 0.055], [x - (openWidth + span) / 2, railY, z + depth / 2], material);
      buildingBox(grp, [span, 0.055, 0.055], [x + (openWidth + span) / 2, railY, z + depth / 2], material);
    }
  }

  function addLowSteps(grp, x, southZ, width, material, depth) {
    depth = depth || 0.24;
    buildingBox(grp, [width + 0.34, 0.05, depth], [x, 0.025, southZ + 0.98], material);
    buildingBox(grp, [width + 0.16, 0.105, depth], [x, 0.053, southZ + 0.78], material);
    buildingBox(grp, [width, 0.165, depth], [x, 0.083, southZ + 0.58], material);
  }

  function addModeledEntry(grp, x, frontZ, width, trimMaterial, metalMaterial, options) {
    options = options || {};
    var baseY = 0.23;
    var doorH = options.tall ? 0.84 : 0.72;
    var doorCenterY = baseY + doorH / 2;
    var doubleDoor = !!options.doubleDoor;
    var warmGlass = new THREE.MeshStandardMaterial({
      color: options.cool ? '#527488' : '#6c4934',
      emissive: options.cool ? 0x183542 : 0x5a2b12,
      emissiveIntensity: options.cool ? 0.16 : 0.34,
      roughness: 0.3, metalness: options.cool ? 0.16 : 0.04,
      envMapIntensity: 0.72
    });
    var doorBody = new THREE.MeshStandardMaterial({
      color: options.cool ? '#394d59' : '#4a3022',
      roughness: 0.62, metalness: options.cool ? 0.18 : 0.02,
      envMapIntensity: 0.5
    });
    var recess = new THREE.MeshStandardMaterial({
      color: '#2b201a', emissive: 0x21120a, emissiveIntensity: 0.16,
      roughness: 0.92, metalness: 0
    });

    // Il vano resta scuro ma non è mai un taglio nero: corpo porta, vetro
    // caldo, telaio e soglia occupano quote Z separate.
    buildingBox(grp, [width + 0.18, doorH + 0.18, 0.045],
      [x, doorCenterY + 0.03, frontZ + 0.018], recess);
    buildingBox(grp, [width, doorH, 0.05],
      [x, doorCenterY, frontZ + 0.055], doorBody);
    buildingBox(grp, [width - 0.14, doorH * 0.44, 0.028],
      [x, baseY + doorH * 0.68, frontZ + 0.095], warmGlass);
    buildingBox(grp, [0.08, doorH + 0.16, 0.08],
      [x - width / 2 - 0.07, doorCenterY, frontZ + 0.105], trimMaterial);
    buildingBox(grp, [0.08, doorH + 0.16, 0.08],
      [x + width / 2 + 0.07, doorCenterY, frontZ + 0.105], trimMaterial);
    buildingBox(grp, [width + 0.22, 0.09, 0.08],
      [x, baseY + doorH + 0.08, frontZ + 0.105], trimMaterial);
    if (doubleDoor) {
      buildingBox(grp, [0.055, doorH, 0.045],
        [x, doorCenterY, frontZ + 0.116], metalMaterial);
    }
    buildingBox(grp, [width + 0.28, 0.05, 0.2],
      [x, baseY + 0.025, frontZ + 0.1], metalMaterial);
    var handleX = x + (doubleDoor ? width * 0.14 : width * 0.28);
    buildingBox(grp, [0.045, 0.14, 0.045],
      [handleX, baseY + doorH * 0.48, frontZ + 0.13], metalMaterial);

    var fixture = new THREE.MeshStandardMaterial({
      color: '#ffd39b', emissive: 0xff8a36, emissiveIntensity: 0.72,
      roughness: 0.3, metalness: 0.08, envMapIntensity: 0.68
    });
    buildingBox(grp, [0.075, 0.16, 0.055],
      [x - width / 2 - 0.2, baseY + doorH * 0.72, frontZ + 0.13], fixture);
    buildingBox(grp, [0.075, 0.16, 0.055],
      [x + width / 2 + 0.2, baseY + doorH * 0.72, frontZ + 0.13], fixture);
  }

  function addWarmCanopyUnderside(grp, x, y, z, width, depth) {
    var underside = new THREE.MeshStandardMaterial({
      color: '#61452f', emissive: 0x8a461c, emissiveIntensity: 0.22,
      roughness: 0.74, metalness: 0.02, envMapIntensity: 0.42
    });
    buildingBox(grp, [width, 0.035, depth], [x, y, z], underside);
  }

  function addArchitecturalMassing(rc, pal, grp, facadeTextureMap) {
    var doorX = rc.doors.length ? rc.doors[0].x + 0.5 : rc.bx + rc.bw / 2;
    var southZ = rc.by + rc.bh;
    var cx = rc.bx + rc.bw / 2;
    var siding = buildingMaterial(pal, 'siding', plankTexture(pal));
    var facade = buildingMaterial(pal, 'facade', facadeTextureMap);
    var trim = buildingMaterial(pal, 'trim');
    var stone = buildingMaterial(pal, 'stone');
    var roof = buildingMaterial(pal, 'roof', shingleTexture(pal));
    var glass = buildingMaterial(pal, 'glass');
    var metal = buildingMaterial(pal, 'metal');

    if (pal.kind === 'sheriff') {
      // Blocco civico centrale più alto, frontone e stoop cerimoniale.
      buildingBox(grp, [2.35, 1.18, 0.56], [doorX, 0.59, southZ + 0.18], facade);
      addGableCap(grp, doorX, southZ + 0.18, 2.55, 0.68, 1.18, 0.4, roof);
      buildingBox(grp, [0.16, 1.02, 0.12], [doorX - 0.88, 0.53, southZ + 0.5], trim);
      buildingBox(grp, [0.16, 1.02, 0.12], [doorX + 0.88, 0.53, southZ + 0.5], trim);
      buildingBox(grp, [3.2, 0.24, 0.92], [doorX, 0.12, southZ + 0.49], stone);
      addLowSteps(grp, doorX, southZ, 1.35, stone);
      addPorchRail(grp, doorX, southZ + 0.48, 3.05, 0.72, metal, 1.35);
      addModeledEntry(grp, doorX, southZ + 0.465, 0.7, trim, metal);
    } else if (pal.kind === 'diner') {
      // Canopy cromata bassa e bay vetrata sul lato strada: il profilo legge
      // come diner anche senza lettering.
      var dinerMetal = new THREE.MeshStandardMaterial({
        color: '#a7bdc9', roughness: 0.3, metalness: 0.68, envMapIntensity: 0.95
      });
      var redTrim = new THREE.MeshStandardMaterial({
        color: '#9d1824', roughness: 0.42, metalness: 0.16, envMapIntensity: 0.7
      });
      buildingBox(grp, [rc.bw - 0.75, 0.09, 0.78], [cx, 1.0, southZ + 0.28], dinerMetal, [-0.08, 0, 0]);
      buildingBox(grp, [rc.bw - 0.9, 0.065, 0.08], [cx, 0.92, southZ + 0.68], redTrim);
      var bayX = rc.bx + rc.bw - 1.35;
      buildingBox(grp, [2.15, 0.88, 0.42], [bayX, 0.48, southZ + 0.17], dinerMetal);
      buildingBox(grp, [1.75, 0.46, 0.045], [bayX, 0.52, southZ + 0.405], glass);
      buildingBox(grp, [0.045, 0.46, 0.035], [bayX, 0.52, southZ + 0.44], dinerMetal);
      buildingBox(grp, [3.25, 0.22, 0.92], [doorX, 0.11, southZ + 0.48], dinerMetal);
      addLowSteps(grp, doorX, southZ, 1.25, stone, 0.2);
      buildingBox(grp, [0.07, 0.92, 0.07], [doorX - 1.38, 0.46, southZ + 0.62], dinerMetal);
      buildingBox(grp, [0.07, 0.92, 0.07], [doorX + 1.38, 0.46, southZ + 0.62], dinerMetal);
      buildingBox(grp, [1.28, 0.98, 0.4], [doorX, 0.49, southZ + 0.2], facade);
      addModeledEntry(grp, doorX, southZ + 0.41, 0.68, dinerMetal, dinerMetal);
      addWarmCanopyUnderside(grp, doorX, 0.94, southZ + 0.34, rc.bw - 1.1, 0.52);
    } else if (pal.kind === 'hotel') {
      // Corpo lodge gerarchico: avancorpo a timpano, portico profondo e basamento.
      buildingBox(grp, [3.15, 1.28, 0.72], [doorX, 0.64, southZ + 0.25], siding);
      addGableCap(grp, doorX, southZ + 0.23, 3.4, 0.88, 1.28, 0.52, roof);
      buildingBox(grp, [3.8, 0.24, 0.98], [doorX, 0.12, southZ + 0.52], stone);
      buildingBox(grp, [3.35, 0.09, 0.8], [doorX, 1.08, southZ + 0.48], roof, [-0.1, 0, 0]);
      for (var hp = -1; hp <= 1; hp += 2) {
        buildingBox(grp, [0.16, 1.04, 0.16], [doorX + hp * 1.42, 0.52, southZ + 0.76], trim);
        buildingBox(grp, [0.34, 0.36, 0.34], [doorX + hp * 1.42, 0.18, southZ + 0.76], stone);
      }
      addLowSteps(grp, doorX, southZ, 1.5, stone);
      addPorchRail(grp, doorX, southZ + 0.54, 3.65, 0.72, trim, 1.5);
      addModeledEntry(grp, doorX, southZ + 0.62, 1.12, trim, metal,
        { doubleDoor: true, tall: true });
      addWarmCanopyUnderside(grp, doorX, 1.025, southZ + 0.48, 2.95, 0.58);
    } else if (pal.kind === 'palmer') {
      // Casa domestica asimmetrica: garage basso a sinistra + ingresso a
      // timpano; nessun ritmo commerciale continuo.
      var garageX = rc.bx + 1.55;
      buildingBox(grp, [2.75, 0.76, 0.42], [garageX, 0.38, southZ + 0.16], siding);
      addGableCap(grp, garageX, southZ + 0.14, 2.95, 0.58, 0.76, 0.33, roof);
      buildingBox(grp, [2.28, 0.55, 0.045], [garageX, 0.39, southZ + 0.39], trim);
      buildingBox(grp, [2.05, 0.035, 0.03], [garageX, 0.39, southZ + 0.425], stone);
      buildingBox(grp, [1.82, 1.08, 0.5], [doorX, 0.54, southZ + 0.19], facade);
      addGableCap(grp, doorX, southZ + 0.18, 2.05, 0.66, 1.08, 0.38, roof);
      buildingBox(grp, [2.35, 0.16, 0.72], [doorX, 0.08, southZ + 0.44], stone);
      addLowSteps(grp, doorX, southZ, 1.05, stone, 0.2);
      buildingBox(grp, [0.1, 0.85, 0.1], [doorX - 0.92, 0.43, southZ + 0.68], trim);
      buildingBox(grp, [0.1, 0.85, 0.1], [doorX + 0.92, 0.43, southZ + 0.68], trim);
      addModeledEntry(grp, doorX, southZ + 0.45, 0.68, trim, metal);
    } else if (pal.kind === 'hospital') {
      // Core verticale vetrato + canopy e rampa continua, leggibile come
      // istituzione senza affidarsi alla croce o alla targa.
      var white = new THREE.MeshStandardMaterial({ color: '#e7ecec', roughness: 0.6, metalness: 0.04, envMapIntensity: 0.58 });
      buildingBox(grp, [2.25, 1.46, 0.5], [doorX, 0.73, southZ + 0.18], white);
      buildingBox(grp, [1.58, 1.02, 0.045], [doorX, 0.68, southZ + 0.455], glass);
      buildingBox(grp, [0.07, 1.02, 0.035], [doorX, 0.68, southZ + 0.49], metal);
      buildingBox(grp, [3.25, 0.1, 0.92], [doorX, 1.06, southZ + 0.38], white, [-0.04, 0, 0]);
      buildingBox(grp, [3.65, 0.22, 0.94], [doorX, 0.11, southZ + 0.54], stone, [-0.035, 0, 0]);
      for (var hr = -1; hr <= 1; hr += 2) {
        buildingBox(grp, [0.055, 0.055, 0.78], [doorX + hr * 1.72, 0.35, southZ + 0.56], metal);
        buildingBox(grp, [0.055, 0.62, 0.055], [doorX + hr * 1.72, 0.31, southZ + 0.88], metal);
      }
      addLowSteps(grp, doorX, southZ, 1.15, stone, 0.18);
      addModeledEntry(grp, doorX, southZ + 0.44, 1.16, trim, metal,
        { doubleDoor: true, tall: true, cool: true });
      addWarmCanopyUnderside(grp, doorX, 1.0, southZ + 0.4, 2.95, 0.64);
    } else if (pal.kind === 'roadhouse') {
      // Venue più alto al centro, ali basse e arrivo coperto; il camino resta
      // elemento di skyline e il neon è solo accento secondario.
      buildingBox(grp, [3.05, 1.2, 0.54], [doorX, 0.6, southZ + 0.19], facade);
      addGableCap(grp, doorX, southZ + 0.18, 3.3, 0.7, 1.2, 0.38, roof);
      buildingBox(grp, [2.15, 0.76, 0.38], [rc.bx + rc.bw - 1.25, 0.38, southZ + 0.14], siding);
      buildingBox(grp, [rc.bw - 0.65, 0.1, 0.72], [cx, 1.0, southZ + 0.28], roof, [-0.07, 0, 0]);
      buildingBox(grp, [3.4, 0.16, 0.86], [doorX, 0.08, southZ + 0.48], trim);
      addLowSteps(grp, doorX, southZ, 1.3, stone, 0.2);
      for (var rp = -1; rp <= 1; rp += 2) {
        buildingBox(grp, [0.11, 0.94, 0.11], [doorX + rp * 1.42, 0.47, southZ + 0.68], trim);
      }
      addModeledEntry(grp, doorX, southZ + 0.47, 0.96, trim, metal,
        { doubleDoor: true });
      addWarmCanopyUnderside(grp, doorX, 0.94, southZ + 0.3, rc.bw - 1.0, 0.48);
    }
  }

  function buildingGroup(rc) {
    var pal = BPAL[rc.ch];
    var grp = new THREE.Group();
    var facTex = facadeTexture(rc, pal);
    var sideT = plankTexture(pal);
    var sideMat = buildingMaterial(pal, 'siding', sideT);
    var darkMat = new THREE.MeshStandardMaterial({ color: pal.wd, roughness: 0.86, metalness: 0.01, envMapIntensity: 0.36 });
    var mats = [sideMat, sideMat, darkMat, darkMat, buildingMaterial(pal, 'facade', facTex), darkMat];
    var box = new THREE.Mesh(new THREE.BoxGeometry(rc.bw, WALL_H, rc.bh), mats);
    box.position.set(rc.bx + rc.bw / 2, WALL_H / 2, rc.by + rc.bh / 2);
    box.castShadow = true;
    box.receiveShadow = true;
    grp.add(box);
    addFacadeDepth(rc, pal, grp);
    grp.add(rc.ch === '5' ? flatRoof(rc, pal) : hipRoof(rc, pal));
    addDormers(rc, pal, grp);
    addArchitecturalMassing(rc, pal, grp, facTex);

    // insegna + dettagli che rendono l'edificio riconoscibile a colpo d'occhio
    // il Double R ha la sua insegna da diner sul colmo: niente targa generica
    var sign = (rc.ch === '2') ? null : addBuildingSign(rc, grp);
    if (rc.ch === '2') addDinerRoofSign(rc, grp);
    if (rc.ch === '1') addFlagpole(rc, grp);
    if (rc.ch === '6' && sign) addNeonBars(rc, grp, sign);
    return grp;
  }

  function billboard(tex, w, h, x, z, yOff) {
    var m = new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: 0.05 });
    var s = new THREE.Sprite(m);
    s.center.set(0.5, 0.02);
    s.scale.set(w, h, 1);
    s.position.set(x, yOff || 0.01, z);
    return s;
  }

  /* ---------------- attori chibi low-poly ---------------- */

  function initActorResources() {
    if (actorGeo) return;
    actorGeo = {
      box: new THREE.BoxGeometry(1, 1, 1),
      head: new THREE.SphereGeometry(0.5, 16, 11),
      detail: new THREE.SphereGeometry(0.5, 10, 7),
      hairCap: new THREE.SphereGeometry(0.5, 14, 6, 0, Math.PI * 2, 0, Math.PI * 0.42),
      hairLobe: new THREE.IcosahedronGeometry(0.5, 1),
      torso: new THREE.CylinderGeometry(0.42, 0.31, 1, 10),
      limb: new THREE.CylinderGeometry(0.43, 0.5, 1, 9),
      joint: new THREE.SphereGeometry(0.5, 9, 6),
      shoe: new THREE.SphereGeometry(0.5, 10, 6),
      skirt: new THREE.CylinderGeometry(0.5, 0.3, 1, 12),
      hatBrim: new THREE.CylinderGeometry(0.5, 0.5, 0.08, 16),
      hatCrown: new THREE.CylinderGeometry(0.44, 0.5, 1, 14),
      log: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
      badge: new THREE.OctahedronGeometry(0.5, 0),
      lens: new THREE.TorusGeometry(0.095, 0.014, 6, 12)
    };
  }

  function actorMaterial(color, finish) {
    finish = finish || 'cloth';
    var key = color + '|' + finish;
    if (actorMaterialCache[key]) return actorMaterialCache[key];
    var c = new THREE.Color(color);
    var mat = new THREE.MeshStandardMaterial({
      color: c,
      roughness: finish === 'metal' ? 0.34 :
        (finish === 'eye' ? 0.24 :
          (finish === 'skin' ? 0.68 : (finish === 'hair' ? 0.78 : 0.9))),
      metalness: finish === 'metal' ? 0.46 : 0,
      envMapIntensity: finish === 'metal' ? 0.82 :
        (finish === 'eye' ? 0.62 : (finish === 'skin' ? 0.44 : 0.38)),
      flatShading: finish === 'hair' || finish === 'shadow' || finish === 'wood',
      emissive: c.clone().multiplyScalar(finish === 'shadow' ? 0 : 0.025),
      dithering: true
    });
    actorMaterialCache[key] = mat;
    return mat;
  }

  function actorPart(parent, geo, material, scale, position, rotation) {
    var mesh = new THREE.Mesh(actorGeo[geo], material);
    mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.position.set(position[0], position[1], position[2]);
    if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    // Occhi, mani, sopracciglia e altri micro-volumi non cambiano la
    // silhouette dell'ombra alla camera di gioco, ma moltiplicavano le
    // submission nella centrale. Conserviamo caster su corpo, arti e capelli.
    var shadowVolume = scale[0] * scale[1] * scale[2];
    mesh.castShadow = geo !== 'detail' && geo !== 'lens' && shadowVolume > 0.0015;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function isolateActorMaterials(actor, transparent) {
    var byBase = {}, owned = [];
    actor.traverse(function (o) {
      if (!o.isMesh || !o.material) return;
      var id = o.material.uuid;
      if (!byBase[id]) {
        var clone = o.material.clone();
        clone.userData.baseActorColor = clone.color.clone();
        clone.userData.baseActorEmissive = clone.emissive.clone();
        if (transparent) {
          clone.transparent = true;
          clone.depthWrite = false;
        }
        byBase[id] = clone;
        owned.push(clone);
      }
      o.material = byBase[id];
    });
    actor.userData.dynamicMaterials = owned;
    actorDynamicMaterialCount += owned.length;
  }

  function setActorOpacity(actor, opacity) {
    var mats = actor.userData.dynamicMaterials;
    if (!mats) return;
    for (var i = 0; i < mats.length; i++) mats[i].opacity = opacity;
  }

  function setActorBrightness(actor, amount) {
    var mats = actor.userData.dynamicMaterials;
    if (!mats) return;
    for (var i = 0; i < mats.length; i++) {
      var m = mats[i], base = m.userData.baseActorColor;
      m.color.copy(base).multiplyScalar(amount);
      m.emissive.copy(m.userData.baseActorEmissive).multiplyScalar(0.8 + amount * 0.35);
    }
  }

  function actor3D(name) {
    initActorResources();
    var spec = Sp.CHARS[name] || Sp.CHARS.cooper;
    var silhouette = !!spec.shadow;
    function C(color) { return silhouette ? '#26262f' : color; }
    var skin = actorMaterial(C(spec.skin), silhouette ? 'shadow' : 'skin');
    var hair = actorMaterial(C(spec.hair), silhouette ? 'shadow' : 'hair');
    var shirt = actorMaterial(C(spec.shirt), silhouette ? 'shadow' : 'cloth');
    var pants = actorMaterial(C(spec.dress ? spec.shirt : spec.pants), silhouette ? 'shadow' : 'cloth');
    var shoe = actorMaterial(C('#16191f'), silhouette ? 'shadow' : 'cloth');
    var eye = actorMaterial(C('#11141a'), silhouette ? 'shadow' : 'eye');
    var iris = actorMaterial(C(spec.eyes || '#58675d'), silhouette ? 'shadow' : 'eye');
    var white = actorMaterial(C('#f4f2e9'), silhouette ? 'shadow' : 'eye');
    var mouth = actorMaterial(C(spec.grin ? '#37171a' : '#9b5d58'), silhouette ? 'shadow' : 'skin');
    var sole = actorMaterial(C('#090b0e'), silhouette ? 'shadow' : 'cloth');

    var root = new THREE.Group();
    var visual = new THREE.Group();
    var upperBody = new THREE.Group();
    root.add(visual);
    visual.add(upperBody);
    root.userData.actorName = name;
    root.userData.visual = visual;
    root.userData.baseVisualScaleY = spec.short ? 0.82 : 1;
    visual.scale.y = root.userData.baseVisualScaleY;

    // Arti a due segmenti: ginocchio, caviglia e scarpa mantengono contatto
    // leggibile invece del vecchio cilindro rigido che ruotava dall'anca.
    function leg(x, material) {
      var hip = new THREE.Group();
      hip.position.set(x, 0.63, 0);
      visual.add(hip);
      actorPart(hip, 'limb', material, [0.16, 0.32, 0.16], [0, -0.16, 0]);
      var knee = new THREE.Group();
      knee.position.set(0, -0.31, 0);
      hip.add(knee);
      actorPart(knee, 'joint', material, [0.165, 0.145, 0.165], [0, 0, 0]);
      actorPart(knee, 'limb', material, [0.145, 0.3, 0.145], [0, -0.15, 0]);
      var foot = new THREE.Group();
      foot.position.set(0, -0.31, 0);
      knee.add(foot);
      actorPart(foot, 'shoe', shoe, [0.19, 0.115, 0.3], [0, -0.018, 0.07]);
      actorPart(foot, 'box', sole, [0.18, 0.035, 0.27], [0, -0.073, 0.075]);
      return { pivot: hip, knee: knee, foot: foot };
    }
    var legMat = spec.dress ? skin : pants;
    var leftLeg = leg(-0.14, legMat);
    var rightLeg = leg(0.14, legMat);

    // Bacino e torso rastremato: spalle, vita e silhouette corporea variano
    // per personaggio tramite build/height senza duplicare geometrie.
    actorPart(visual, 'box', pants, [0.39, 0.17, 0.29], [0, 0.61, 0]);
    if (spec.dress) {
      actorPart(visual, 'skirt', shirt, [0.78, 0.47, 0.65], [0, 0.62, 0]);
    }
    actorPart(upperBody, 'torso', shirt, [0.76, 0.52, 0.72], [0, 0.88, 0]);
    actorPart(upperBody, 'box', pants, [0.4, 0.055, 0.31], [0, 0.65, 0]);
    if (!spec.dress && !silhouette) {
      var belt = actorMaterial(C('#30251f'), 'cloth');
      actorPart(upperBody, 'box', belt, [0.41, 0.045, 0.315], [0, 0.69, 0.004]);
      actorPart(upperBody, 'box', actorMaterial(C('#9a7a3d'), 'metal'),
        [0.065, 0.055, 0.025], [0, 0.69, 0.32]);
    }

    function arm(x, side) {
      if (spec.onearm === 'left' && side === 'left') return null;
      var shoulder = new THREE.Group();
      shoulder.position.set(x, 1.08, 0);
      upperBody.add(shoulder);
      actorPart(shoulder, 'joint', shirt, [0.19, 0.18, 0.19], [0, -0.025, 0]);
      actorPart(shoulder, 'limb', shirt, [0.135, 0.29, 0.135], [0, -0.16, 0]);
      var elbow = new THREE.Group();
      elbow.position.set(0, -0.31, 0);
      shoulder.add(elbow);
      actorPart(elbow, 'joint', shirt, [0.14, 0.13, 0.14], [0, 0, 0]);
      actorPart(elbow, 'limb', shirt, [0.115, 0.25, 0.115], [0, -0.13, 0]);
      actorPart(elbow, 'joint', skin, [0.17, 0.15, 0.18], [0, -0.285, 0.018]);
      return { pivot: shoulder, elbow: elbow };
    }
    var leftArm = arm(-0.36, 'left');
    var rightArm = arm(0.36, 'right');

    // Capelli posteriori composti da volumi organici: niente pannelli rettangolari.
    if (spec.long && !spec.short) {
      actorPart(upperBody, 'hairLobe', hair, [0.27, 0.58, 0.22], [-0.25, 1.26, -0.11]);
      actorPart(upperBody, 'hairLobe', hair, [0.27, 0.58, 0.22], [0.25, 1.26, -0.11]);
      actorPart(upperBody, 'hairLobe', hair, [0.5, 0.5, 0.2], [0, 1.28, -0.24]);
    }

    var head = new THREE.Group();
    head.position.set(0, 1.42, 0);
    head.rotation.x = -0.09;
    upperBody.add(head);
    actorPart(upperBody, 'limb', skin, [0.14, 0.18, 0.14], [0, 1.24, 0]);
    actorPart(head, 'head', skin, [0.69, 0.78, 0.67], [0, 0, 0]);
    if (!silhouette) {
      actorPart(head, 'detail', skin, [0.105, 0.16, 0.075], [-0.35, -0.015, 0]);
      actorPart(head, 'detail', skin, [0.105, 0.16, 0.075], [0.35, -0.015, 0]);
      actorPart(head, 'detail', skin, [0.075, 0.11, 0.065], [0, -0.055, 0.345]);
    }

    function eyeGroup(x) {
      var g = new THREE.Group();
      g.position.set(x, 0.025, 0.33);
      head.add(g);
      actorPart(g, 'detail', silhouette ? eye : white, [0.16, 0.105, 0.055], [0, 0, 0]);
      actorPart(g, 'detail', iris, [0.082, 0.09, 0.04], [0, -0.003, 0.044]);
      actorPart(g, 'detail', eye, [0.043, 0.06, 0.026], [0, -0.004, 0.069]);
      if (!silhouette) {
        actorPart(g, 'detail', white, [0.018, 0.022, 0.012], [-0.013, 0.018, 0.087]);
      }
      return g;
    }
    var eyeL = eyeGroup(-0.13);
    var eyeR = eyeGroup(0.13);
    if (!silhouette) {
      actorPart(head, 'box', hair, [0.13, 0.024, 0.022], [-0.13, 0.14, 0.35], [0, 0, -0.08]);
      actorPart(head, 'box', hair, [0.13, 0.024, 0.022], [0.13, 0.14, 0.35], [0, 0, 0.08]);
    }
    actorPart(head, 'box', mouth,
      [spec.grin ? 0.22 : 0.13, spec.grin ? 0.038 : 0.024, 0.022], [0, -0.155, 0.342]);
    if (spec.grin && !silhouette) {
      actorPart(head, 'box', white, [0.17, 0.025, 0.014], [0, -0.148, 0.36]);
    }

    // Acconciature per silhouette: stesso budget geometrico, profili distinti.
    var style = spec.hairStyle || (spec.long ? 'long' : 'sidepart');
    var crownScale = style === 'receding' ? [0.48, 0.24, 0.5] :
      (style === 'pompadour' ? [0.62, 0.34, 0.54] : [0.66, 0.3, 0.58]);
    var crownY = style === 'pompadour' ? 0.34 : 0.28;
    actorPart(head, 'hairLobe', hair, crownScale, [0, crownY, -0.07]);
    if (style !== 'receding') {
      actorPart(head, 'hairLobe', hair, [0.2, 0.31, 0.18], [-0.28, 0.16, -0.005]);
      actorPart(head, 'hairLobe', hair, [0.2, 0.31, 0.18], [0.28, 0.16, -0.005]);
    }
    if (style === 'slick' || style === 'sidepart' || style === 'pompadour') {
      actorPart(head, 'box', hair,
        [style === 'pompadour' ? 0.34 : 0.28, 0.085, 0.11],
        [style === 'sidepart' ? -0.08 : 0.03, 0.24, 0.29],
        [0.18, 0, style === 'sidepart' ? -0.12 : 0.06]);
    } else if (style === 'bob' || style === 'waves' || style === 'long' || style === 'wild') {
      actorPart(head, 'hairLobe', hair, [0.22, 0.43, 0.2], [-0.3, 0.02, -0.01]);
      actorPart(head, 'hairLobe', hair, [0.22, 0.43, 0.2], [0.3, 0.02, -0.01]);
      if (style === 'wild') {
        actorPart(head, 'hairLobe', hair, [0.25, 0.37, 0.22], [-0.18, 0.33, -0.02], [0, 0, -0.35]);
        actorPart(head, 'hairLobe', hair, [0.25, 0.4, 0.22], [0.19, 0.35, -0.02], [0, 0, 0.32]);
      }
    }

    if (spec.glasses) {
      var glass = actorMaterial(C(spec.glassesColor || '#b22d35'), silhouette ? 'shadow' : 'metal');
      actorPart(head, 'lens', glass, [1.02, 0.84, 1], [-0.13, 0.025, 0.374]);
      actorPart(head, 'lens', glass, [1.02, 0.84, 1], [0.13, 0.025, 0.374]);
      actorPart(head, 'box', glass, [0.075, 0.018, 0.018], [0, 0.025, 0.374]);
    }
    if (spec.bun) {
      actorPart(head, 'hairLobe', hair, [0.38, 0.32, 0.34], [0, 0.47, -0.18]);
    }
    if (spec.hat) {
      var hat = actorMaterial(C(spec.hat), silhouette ? 'shadow' : 'cloth');
      actorPart(head, 'hatBrim', hat, [0.86, 1, 0.62], [0, 0.37, -0.015]);
      actorPart(head, 'hatCrown', hat, [0.64, 0.22, 0.58], [0, 0.49, -0.01]);
    }
    if (spec.tie) {
      var tie = actorMaterial(C(spec.tie), silhouette ? 'shadow' : 'cloth');
      actorPart(upperBody, 'box', white, [0.27, 0.42, 0.028], [0, 0.94, 0.235]);
      actorPart(upperBody, 'box', shirt, [0.22, 0.045, 0.035], [-0.14, 1.11, 0.245], [0, 0, -0.42]);
      actorPart(upperBody, 'box', shirt, [0.22, 0.045, 0.035], [0.14, 1.11, 0.245], [0, 0, 0.42]);
      actorPart(upperBody, 'box', tie, [0.065, 0.27, 0.038], [0, 0.93, 0.257]);
    }
    if (spec.badge) {
      actorPart(upperBody, 'badge', actorMaterial(C(spec.badge), silhouette ? 'shadow' : 'metal'),
        [0.15, 0.15, 0.07], [-0.19, 0.98, 0.255]);
    }
    if (spec.log) {
      var logMat = actorMaterial(C('#6a4526'), silhouette ? 'shadow' : 'wood');
      actorPart(upperBody, 'log', logMat, [0.18, 0.76, 0.18], [0, 0.76, 0.36], [0, 0, Math.PI / 2]);
    }

    root.userData.leftLeg = leftLeg;
    root.userData.rightLeg = rightLeg;
    root.userData.leftArm = leftArm;
    root.userData.rightArm = rightArm;
    root.userData.upperBody = upperBody;
    root.userData.head = head;
    root.userData.eyes = [eyeL, eyeR];
    root.userData.hasLog = !!spec.log;

    var baseScale = name === 'giant' ? 1.12 : 1.08;
    var build = spec.build || 1;
    var height = spec.height || 1;
    root.scale.set(baseScale * build, baseScale * height, baseScale * (0.96 + build * 0.04));
    if (name === 'laura' || name === 'giant' || name === 'bob') {
      isolateActorMaterials(root, name === 'laura' || name === 'giant');
    }
    if (name === 'laura') setActorOpacity(root, 0.85);
    actorRigCount++;
    return root;
  }

  function updateActorPose(actor, dir, moving, moveT, t, opts) {
    opts = opts || {};
    var angle = dir === 'up' ? Math.PI :
      (dir === 'left' ? -Math.PI / 2 : (dir === 'right' ? Math.PI / 2 : 0));
    // GLTFLoader converte il fronte Blender `-Y` nello stesso asse locale già
    // usato dal cast procedurale. Un offset addizionale di PI invertiva tutte
    // le direzioni (anche `down` mostrava la schiena).
    var previousYaw = typeof actor.userData.renderYaw === 'number'
      ? actor.userData.renderYaw : angle;
    var priorTarget = typeof actor.userData.desiredYaw === 'number'
      ? actor.userData.desiredYaw : angle;
    var targetChanged = Math.abs(Math.atan2(
      Math.sin(angle - priorTarget), Math.cos(angle - priorTarget))) > 0.01;
    if (targetChanged) {
      var turnArc = Math.atan2(
        Math.sin(angle - previousYaw), Math.cos(angle - previousYaw));
      if (Math.abs(turnArc) > 0.04) {
        actor.userData.turnStartT = t;
        actor.userData.turnFromYaw = previousYaw;
        actor.userData.turnTargetYaw = previousYaw + turnArc;
        actor.userData.turnArc = turnArc;
        actor.userData.turnDuration = Math.abs(turnArc) > Math.PI * 0.72
          ? AUTHORED_CHARACTER_TURN_180_MS : AUTHORED_CHARACTER_TURN_90_MS;
        actor.userData.turnPivotX = turnArc > 0 ? 0.15 : -0.15;
      }
    }
    actor.userData.desiredYaw = angle;

    var renderYaw = previousYaw;
    var turnActive = typeof actor.userData.turnStartT === 'number';
    if (turnActive) {
      var turnElapsed = Math.max(0, t - actor.userData.turnStartT);
      var turnDuration = actor.userData.turnDuration ||
        AUTHORED_CHARACTER_TURN_90_MS;
      var turnProgress = Math.max(0, Math.min(1, turnElapsed / turnDuration));
      // Quintic easing gives the support foot time to load before the torso
      // rotates and removes the instant whole-root snap.
      var turnEase = turnProgress * turnProgress * turnProgress *
        (turnProgress * (turnProgress * 6 - 15) + 10);
      renderYaw = actor.userData.turnFromYaw +
        actor.userData.turnArc * turnEase;
      var recoverProgress = Math.max(0, Math.min(1,
        (turnElapsed - turnDuration) / AUTHORED_CHARACTER_TURN_RECOVER_MS));
      actor.userData.turnPoseProgress = turnProgress;
      actor.userData.turnPoseEnergy = turnProgress < 1
        ? Math.sin(turnProgress * Math.PI)
        : 0.42 * (1 - recoverProgress);
      actor.userData.turnPivotWeight = turnProgress < 1
        ? 1 : (1 - recoverProgress);
      if (recoverProgress >= 1) {
        renderYaw = actor.userData.turnTargetYaw;
        actor.userData.turnStartT = null;
        actor.userData.turnPoseEnergy = 0;
        actor.userData.turnPivotWeight = 0;
      }
    } else {
      var yawDt = typeof actor.userData.renderYawT === 'number'
        ? Math.max(0, Math.min(50, t - actor.userData.renderYawT)) : 50;
      var yawDeltaFree = Math.atan2(
        Math.sin(angle - previousYaw), Math.cos(angle - previousYaw));
      var yawResponse = 1 - Math.exp(-yawDt / (moving ? 125 : 165));
      renderYaw = previousYaw + yawDeltaFree * yawResponse;
      if (Math.abs(yawDeltaFree) < 0.002) renderYaw = angle;
      actor.userData.turnPoseEnergy = 0;
      actor.userData.turnPivotWeight = 0;
    }
    actor.userData.turnDelta = Math.atan2(
      Math.sin(angle - renderYaw), Math.cos(angle - renderYaw));
    actor.userData.renderYaw = renderYaw;
    actor.userData.renderYawT = t;
    actor.rotation.y = renderYaw;

    var phase = 0;
    if (moving) {
      var progress = typeof moveT === 'number' ? moveT : ((t / 720) % 1);
      phase = progress * Math.PI * 2 * (opts.reverse ? -1 : 1);
    }
    if (actor.userData.authoredRigged) {
      updateRiggedActorPose(actor, moving, moveT, t, opts);
      return;
    }
    // I personaggi GLB di questa vertical slice sono mesh statiche autoriali:
    // conservano la stessa semantica direzione/movimento del rig procedurale,
    // ma animano il corpo intero. Nessun accesso a arti/occhi inesistenti.
    if (actor.userData.authoredStatic) {
      var authoredVisual = actor.userData.visual;
      var authoredBob = moving
        ? (1 - Math.abs(Math.cos(phase))) * 0.045
        : Math.sin(t / 760) * 0.012;
      authoredVisual.position.y = authoredBob;
      authoredVisual.rotation.x = moving ? Math.sin(phase) * 0.018 : 0;
      authoredVisual.rotation.z = opts.dance
        ? Math.sin(t / 180) * 0.11
        : (moving ? Math.sin(phase) * 0.025 : Math.sin(t / 1250) * 0.006);
      var authoredBreath = moving ? 1 : 1 + Math.sin(t / 760) * 0.004;
      authoredVisual.scale.set(1, authoredBreath, 1);
      return;
    }
    var stride = moving ? Math.sin(phase) : 0;
    var swing = stride * 0.58;
    var leftLeg = actor.userData.leftLeg, rightLeg = actor.userData.rightLeg;
    leftLeg.pivot.rotation.x = -swing;
    rightLeg.pivot.rotation.x = swing;
    leftLeg.knee.rotation.x = moving ? Math.max(0, stride) * 0.5 : 0;
    rightLeg.knee.rotation.x = moving ? Math.max(0, -stride) * 0.5 : 0;
    leftLeg.foot.rotation.x = swing * 0.55 - leftLeg.knee.rotation.x * 0.35;
    rightLeg.foot.rotation.x = -swing * 0.55 - rightLeg.knee.rotation.x * 0.35;

    var armSwing = actor.userData.hasLog ? swing * 0.08 : swing * 0.82;
    if (actor.userData.leftArm) {
      actor.userData.leftArm.pivot.rotation.x = armSwing;
      actor.userData.leftArm.elbow.rotation.x = moving ? -0.08 - Math.max(0, -stride) * 0.22 : -0.04;
    }
    if (actor.userData.rightArm) {
      actor.userData.rightArm.pivot.rotation.x = -armSwing;
      actor.userData.rightArm.elbow.rotation.x = moving ? -0.08 - Math.max(0, stride) * 0.22 : -0.04;
    }

    var visual = actor.userData.visual;
    var upperBody = actor.userData.upperBody;
    visual.rotation.z = opts.dance ? Math.sin(t / 180) * 0.12 : 0;
    if (opts.dance) {
      if (actor.userData.leftArm) actor.userData.leftArm.pivot.rotation.z = 0.45 + Math.sin(t / 220) * 0.35;
      if (actor.userData.rightArm) actor.userData.rightArm.pivot.rotation.z = -0.45 - Math.sin(t / 220) * 0.35;
    } else {
      if (actor.userData.leftArm) actor.userData.leftArm.pivot.rotation.z = 0;
      if (actor.userData.rightArm) actor.userData.rightArm.pivot.rotation.z = 0;
    }
    upperBody.rotation.y = moving ? -stride * 0.045 : Math.sin(t / 1800) * 0.008;
    upperBody.rotation.z = opts.dance ? Math.sin(t / 180) * 0.1 :
      (moving ? stride * 0.012 : Math.sin(t / 1500) * 0.004);
    actor.userData.head.rotation.y = moving ? stride * 0.025 : Math.sin(t / 2200) * 0.012;
    actor.userData.head.rotation.x = -0.09 +
      (moving ? Math.cos(phase * 2) * 0.012 : Math.sin(t / 1700) * 0.006);
    visual.position.y = moving ? (1 - Math.abs(Math.cos(phase))) * 0.026 :
      Math.sin(t / 700) * 0.008;
    visual.scale.y = actor.userData.baseVisualScaleY *
      (moving ? 1 : 1 + Math.sin(t / 700) * 0.006);

    var blink = !moving && (t % 4200) > 3900;
    for (var i = 0; i < actor.userData.eyes.length; i++) {
      actor.userData.eyes[i].scale.y = blink ? 0.12 : 1;
    }
  }

  var blobGeometry = null, blobSharedMaterial = null;
  var BLOB_BASE_OPACITY = 0.4;
  var blobTexture = (function () {
    var tex = null;
    return function () {
      if (tex) return tex;
      if (typeof document === 'undefined') return null;
      var c = document.createElement('canvas');
      c.width = 64; c.height = 64;
      var g = c.getContext('2d');
      var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, 'rgba(0,0,0,0.42)');
      grd.addColorStop(0.46, 'rgba(0,0,0,0.14)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, 64, 64);
      tex = new THREE.CanvasTexture(c);
      return tex;
    };
  })();

  function sharedBlobMaterial() {
    if (blobSharedMaterial) return blobSharedMaterial;
    var map = blobTexture();
    blobSharedMaterial = map
      ? new THREE.MeshBasicMaterial({
          map: map, transparent: true, opacity: BLOB_BASE_OPACITY, depthWrite: false
        })
      : new THREE.MeshBasicMaterial({
          color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false
        });
    blobSharedMaterial.name = 'TwinPeaks.ContactShadow.Shared';
    return blobSharedMaterial;
  }

  function setBlobOpacity(blob, opacity) {
    if (!blob || !blob.material) return;
    var shared = sharedBlobMaterial();
    var baseOpacity = shared.opacity;
    if (Math.abs(opacity - baseOpacity) < 0.002) {
      if (blob.material !== shared) {
        blob.material.dispose();
        blob.material = shared;
      }
      return;
    }
    if (blob.material === shared) {
      blob.material = shared.clone();
      blob.material.name = 'TwinPeaks.ContactShadow.Dynamic';
    }
    blob.material.opacity = opacity;
  }

  function blobShadow(scene, x, z, r) {
    var mat = sharedBlobMaterial();
    if (!blobGeometry) blobGeometry = new THREE.CircleGeometry(1, 24);
    var m = new THREE.Mesh(blobGeometry, mat);
    m.rotation.x = -Math.PI / 2;
    // L'ellisse larga conserva il contatto sotto i piedi ma evita la macchia
    // circolare "sticker" leggibile nei close-up.
    m.scale.set(r * 1.08, r * 0.7, 1);
    m.position.set(x, 0.012, z);
    if (scene) scene.add(m); // il blob del player nasce senza scena: riparentato a ogni cambio mappa
    return m;
  }

  /* ---------------- arredo urbano: lampioni, pali, panchine, staccionate... ---------------- */
  /* palette allineata a tiles.js (versione 2D) per coerenza fra i due motori di rendering */

  function lampPost(x, z) {
    var grp = new THREE.Group();
    var post = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 2.2, 0.09),
      new THREE.MeshLambertMaterial({ color: '#242424' })
    );
    post.position.set(x, 1.1, z);
    post.castShadow = true;
    var arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.06, 0.06),
      new THREE.MeshLambertMaterial({ color: '#242424' })
    );
    arm.position.set(x + 0.18, 2.05, z);
    var head = new THREE.Mesh( // testa accesa: MeshBasicMaterial per leggerla come "illuminata" senza luci vere
      new THREE.BoxGeometry(0.18, 0.14, 0.14),
      new THREE.MeshBasicMaterial({ color: '#ffe9a8' })
    );
    head.position.set(x + 0.34, 1.98, z);
    var glow = new THREE.Mesh( // alone morbido, molto economico: un piano semitrasparente
      new THREE.PlaneGeometry(0.5, 0.5),
      new THREE.MeshBasicMaterial({ color: '#ffe9a8', transparent: true, opacity: 0.28, depthWrite: false })
    );
    glow.position.set(x + 0.34, 1.98, z + 0.01);
    var base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.13, 0.06, 8),
      new THREE.MeshLambertMaterial({ color: '#2e2e2e' })
    );
    base.position.set(x, 0.03, z);
    grp.add(post); grp.add(arm); grp.add(head); grp.add(glow); grp.add(base);
    return grp;
  }

  function telephonePole(x, z) {
    var grp = new THREE.Group();
    var pole = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 3.0, 0.13),
      new THREE.MeshLambertMaterial({ color: '#3a2818' })
    );
    pole.position.set(x, 1.5, z);
    pole.castShadow = true;
    var arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.08, 0.08),
      new THREE.MeshLambertMaterial({ color: '#2e2014' })
    );
    arm.position.set(x, 2.7, z);
    grp.add(pole); grp.add(arm);
    var offs = [-0.28, 0, 0.28], insMat = new THREE.MeshLambertMaterial({ color: '#d8d0c0' });
    for (var i = 0; i < offs.length; i++) {
      var ins = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.06), insMat);
      ins.position.set(x + offs[i], 2.78, z);
      grp.add(ins);
    }
    return grp;
  }

  function benchMesh(x, z) {
    var grp = new THREE.Group();
    var wood = new THREE.MeshLambertMaterial({ color: '#8a5f36' });
    var dark = new THREE.MeshLambertMaterial({ color: '#3a2410' });
    var seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.32), wood);
    seat.position.set(x, 0.34, z);
    seat.castShadow = true;
    var back = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.38, 0.06), new THREE.MeshLambertMaterial({ color: '#4a3018' }));
    back.position.set(x, 0.56, z - 0.14);
    back.castShadow = true;
    var leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.06), dark);
    leg1.position.set(x - 0.38, 0.17, z + 0.1);
    var leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.06), dark);
    leg2.position.set(x + 0.38, 0.17, z + 0.1);
    grp.add(seat); grp.add(back); grp.add(leg1); grp.add(leg2);
    return grp;
  }

  // staccionata bianca a stecche (white picket, come la versione 2D in tiles.js):
  // stecche verticali + corrimano che arriva ai bordi del tile, cosi' i 'F'
  // adiacenti formano una recinzione continua.
  var fenceMats = null, shoreFenceMats = null;
  function fenceMesh(x, z) {
    if (!fenceMats) {
      fenceMats = {
        white: new THREE.MeshLambertMaterial({ color: '#eae6da' }),
        shade: new THREE.MeshLambertMaterial({ color: '#c2beb2' })
      };
    }
    var grp = new THREE.Group();
    var i, px, picket, tip;
    for (i = 0; i < 5; i++) {                       // 5 stecche con punta
      px = x - 0.4 + i * 0.2;
      picket = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.5, 0.07), fenceMats.white);
      picket.position.set(px, 0.25, z);
      picket.castShadow = true;
      grp.add(picket);
      tip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.07), fenceMats.white);
      tip.position.set(px, 0.53, z);
      grp.add(tip);
    }
    var rail = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.07, 0.05), fenceMats.shade);
    rail.position.set(x, 0.3, z + 0.02);            // corrimano da bordo a bordo
    rail.castShadow = true;
    grp.add(rail);
    return grp;
  }

  function shoreFenceMesh(x, z, seed) {
    if (!shoreFenceMats) {
      shoreFenceMats = {
        post: new THREE.MeshStandardMaterial({
          color: 0x8a8777, roughness: 0.96, metalness: 0,
          envMapIntensity: 0.12, flatShading: true
        }),
        rail: new THREE.MeshStandardMaterial({
          color: 0x77776c, roughness: 0.98, metalness: 0,
          envMapIntensity: 0.1, flatShading: true
        })
      };
    }
    var group = new THREE.Group();
    group.name = 'weathered-lakeside-fence';
    group.position.set(x, 0, z);
    group.rotation.y = ((seed % 3) - 1) * 0.012;
    var post = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.56, 0.11), shoreFenceMats.post);
    post.position.y = 0.28;
    post.rotation.y = ((seed % 5) - 2) * 0.018;
    post.castShadow = true;
    group.add(post);
    [0.23, 0.42].forEach(function (height, index) {
      var rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.065, 0.065, 1.06), shoreFenceMats.rail);
      rail.position.set(index ? 0.012 : -0.008, height, 0);
      rail.rotation.x = ((seed + index) % 3 - 1) * 0.008;
      rail.castShadow = true;
      group.add(rail);
    });
    return group;
  }

  function flowerbedTopTexture() {
    return simpleTex('flowerbed_top', 16, 16, function (F) {
      F(1, 1, 14, 14, '#3a2818');
      var fc = ['#d83030', '#f0d048', '#ffffff'];
      var spots = [[2, 2], [7, 1], [12, 3], [3, 7], [9, 8], [13, 9], [1, 12], [6, 13], [11, 13]];
      for (var i = 0; i < spots.length; i++) F(spots[i][0], spots[i][1], 1, 1, fc[i % 3]);
    });
  }

  function flowerbedMesh(x, z) {
    var group = new THREE.Group();
    var resources = flowerbedMesh.resources;
    if (!resources) {
      resources = flowerbedMesh.resources = {
        curb: new THREE.MeshStandardMaterial({
          color: '#b9b3a6', roughness: 0.86, metalness: 0,
          envMapIntensity: 0.32
        }),
        soil: new THREE.MeshStandardMaterial({
          color: '#493c2b', roughness: 1, metalness: 0,
          envMapIntensity: 0.08
        }),
        moss: new THREE.MeshStandardMaterial({
          color: '#50633b', roughness: 0.96, metalness: 0,
          envMapIntensity: 0.12
        }),
        baseGeo: new THREE.BoxGeometry(0.94, 0.12, 0.94),
        bedGeo: new THREE.BoxGeometry(0.78, 0.065, 0.78),
        leafGeo: [
          new THREE.DodecahedronGeometry(0.14, 0),
          new THREE.DodecahedronGeometry(0.165, 0)
        ],
        bloomGeo: [
          new THREE.OctahedronGeometry(0.055, 0),
          new THREE.OctahedronGeometry(0.067, 0)
        ],
        bloomMaterials: [0xb53b45, 0xe3b34e, 0xe7e1cd].map(function (color) {
          return new THREE.MeshStandardMaterial({
            color: color, roughness: 0.72, metalness: 0,
            envMapIntensity: 0.35
          });
        })
      };
    }
    var base = new THREE.Mesh(resources.baseGeo, resources.curb);
    base.position.y = 0.06;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    var bed = new THREE.Mesh(resources.bedGeo, resources.soil);
    bed.position.y = 0.145;
    bed.receiveShadow = true;
    group.add(bed);

    // Five broad ground-cover clumps replace the old 1px flower checkerboard.
    // Their silhouette reads as landscaping at gameplay distance and remains
    // stable in temporal roof/entry captures.
    var offsets = [
      [-0.24, -0.18], [0.18, -0.2], [-0.04, 0.02],
      [-0.25, 0.22], [0.24, 0.2]
    ];
    for (var i = 0; i < offsets.length; i++) {
      var leaf = new THREE.Mesh(
        resources.leafGeo[i % 2], resources.moss);
      leaf.position.set(offsets[i][0], 0.25 + (i % 3) * 0.018, offsets[i][1]);
      leaf.scale.set(1.3, 0.68, 1);
      leaf.rotation.y = i * 1.17 + x * 0.03 + z * 0.05;
      leaf.castShadow = i % 2 === 0;
      group.add(leaf);
      var bloom = new THREE.Mesh(
        resources.bloomGeo[i % 2],
        resources.bloomMaterials[i % resources.bloomMaterials.length]
      );
      bloom.position.set(offsets[i][0], 0.34 + (i % 3) * 0.018, offsets[i][1]);
      bloom.castShadow = true;
      group.add(bloom);
    }
    group.position.set(x, 0, z);
    return group;
  }

  function hydrantTexture() {
    return simpleTex('hydrant', 8, 12, function (F) {
      F(2, 2, 4, 8, '#a81c1c');
      F(2, 2, 1, 8, '#c83a3a');
      F(5, 2, 1, 8, '#7a1010');
      F(1, 0, 6, 2, '#7a1010');
      F(0, 4, 1, 2, '#8a1414'); F(7, 4, 1, 2, '#8a1414');
    });
  }

  function mailboxTexture() {
    return simpleTex('mailbox', 10, 16, function (F) {
      F(3, 9, 1, 7, '#4a4a52');
      F(1, 2, 8, 6, '#5a6a7a');
      F(1, 2, 8, 1, '#7a8a98');
      F(1, 7, 8, 1, '#3a4650');
      F(8, 3, 2, 2, '#c83030');
    });
  }

  function bushTexture() {
    var key = 'bush';
    if (texCache[key]) return texCache[key];
    var cv = document.createElement('canvas');
    cv.width = 32; cv.height = 32;
    var c = cv.getContext('2d');
    function F(x, y, w, h, col) { c.fillStyle = col; c.fillRect(x * 2, y * 2, w * 2, h * 2); }
    F(4, 4, 8, 8, '#2e5e34');
    F(3, 6, 1, 4, '#2e5e34'); F(12, 6, 1, 4, '#2e5e34');
    F(6, 3, 4, 1, '#2e5e34'); F(6, 11, 4, 1, '#2e5e34');
    F(5, 5, 6, 6, '#3d7a42');
    F(5, 5, 3, 2, '#57a05a');
    F(9, 9, 2, 2, '#183018');
    texCache[key] = makeTex(cv);
    return texCache[key];
  }

  // Kit urbano low-poly: questi tre oggetti occupano esclusivamente celle già
  // solide (n/H/E), quindi guadagnano volume senza creare collisioni fantasma.
  function townShrub3D(x, z, seed) {
    var grp = new THREE.Group();
    var greens = [
      kitMaterial('shrub-dark', 0x244c31, 0.92),
      kitMaterial('shrub-mid', 0x356b40, 0.88),
      kitMaterial('shrub-tip', 0x4f8550, 0.84)
    ];
    var forms = [
      [-0.2, 0.31, 0.03, 0.6, 0.46],
      [0.18, 0.35, -0.02, 0.68, 0.5],
      [0.01, 0.48, 0.08, 0.58, 0.52]
    ];
    for (var i = 0; i < forms.length; i++) {
      var f = forms[i];
      var crown = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), greens[(seed + i) % greens.length]);
      crown.position.set(f[0], f[1], f[2]);
      crown.scale.set(f[3] * (seed % 2 ? 1.08 : 0.94), f[4], f[3] * 0.82);
      crown.rotation.y = ((seed + i * 5) % 11) * 0.31;
      crown.castShadow = true;
      crown.receiveShadow = true;
      grp.add(crown);
    }
    var mulch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.32, 0.045, 10),
      kitMaterial('shrub-mulch', 0x403326, 0.98)
    );
    mulch.position.y = 0.025;
    mulch.receiveShadow = true;
    grp.add(mulch);
    grp.position.set(x, 0, z);
    return grp;
  }

  function townHydrant3D(x, z) {
    var grp = new THREE.Group();
    var red = kitMaterial('hydrant-red', 0xa82424, 0.48, 0.16);
    var dark = kitMaterial('hydrant-dark', 0x641414, 0.58, 0.12);
    var brass = kitMaterial('hydrant-brass', 0xc59345, 0.32, 0.48);
    kitCylinder(grp, 0.13, 0.15, 0.42, 10, [0, 0.24, 0], red);
    kitCylinder(grp, 0.19, 0.17, 0.08, 10, [0, 0.47, 0], dark);
    kitCylinder(grp, 0.09, 0.13, 0.1, 10, [0, 0.55, 0], red);
    kitCylinder(grp, 0.065, 0.065, 0.26, 8, [0.17, 0.34, 0], red, [0, 0, Math.PI / 2]);
    kitCylinder(grp, 0.075, 0.075, 0.035, 8, [0.31, 0.34, 0], brass, [0, 0, Math.PI / 2]);
    kitCylinder(grp, 0.18, 0.2, 0.05, 10, [0, 0.025, 0], dark);
    grp.position.set(x, 0, z);
    markKitShadows(grp);
    return grp;
  }

  function townMailbox3D(x, z) {
    var grp = new THREE.Group();
    var steel = kitMaterial('mailbox-steel', 0x526776, 0.46, 0.32);
    var edge = kitMaterial('mailbox-edge', 0x26343e, 0.58, 0.26);
    var red = kitMaterial('mailbox-flag', 0xb82d32, 0.48, 0.12);
    kitBox(grp, [0.08, 0.62, 0.08], [0, 0.31, 0], edge);
    kitBox(grp, [0.42, 0.27, 0.34], [0, 0.72, 0], steel);
    var roof = kitCylinder(grp, 0.21, 0.21, 0.34, 12, [0, 0.855, 0], steel, [Math.PI / 2, 0, 0]);
    roof.scale.y = 0.58;
    kitBox(grp, [0.035, 0.26, 0.035], [0.24, 0.79, 0], red);
    kitBox(grp, [0.15, 0.055, 0.035], [0.18, 0.9, 0], red);
    grp.position.set(x, 0, z);
    markKitShadows(grp);
    return grp;
  }

  var BUILD_CH = { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1 };
  var SKIP_BAKE = CONFIG.terrain.skipBake;

  function baseCharOf(map) {
    var counts = {}, best = '.', n = 0, y, x, ch;
    for (y = 0; y < map.height; y++) {
      for (x = 0; x < map.width; x++) {
        ch = map.rows[y].charAt(x);
        if (ch === '.' || ch === 'g' || ch === 'f' || ch === 'Z' || ch === 'p' || ch === 'r') {
          counts[ch] = (counts[ch] || 0) + 1;
          if (counts[ch] > n) { n = counts[ch]; best = ch; }
        }
      }
    }
    return best;
  }

  function chAt(map, x, y) {
    var mx = Math.max(0, Math.min(map.width - 1, x));
    var my = Math.max(0, Math.min(map.height - 1, y));
    return map.rows[my].charAt(mx);
  }

  function scanBuildings(map) {
    var acc = {}, y, x, ch, row;
    for (y = 0; y < map.height; y++) {
      row = map.rows[y];
      for (x = 0; x < map.width; x++) {
        ch = row.charAt(x);
        var bc = null, isDoor = false;
        if (BUILD_CH[ch]) bc = ch;
        else if (ch === 'D') {
          var l = row.charAt(x - 1), r = row.charAt(x + 1);
          if (BUILD_CH[l]) { bc = l; isDoor = true; }
          else if (BUILD_CH[r]) { bc = r; isDoor = true; }
        }
        if (!bc) continue;
        var a = acc[bc] || (acc[bc] = { minx: x, miny: y, maxx: x, maxy: y, doors: [] });
        if (x < a.minx) a.minx = x; if (x > a.maxx) a.maxx = x;
        if (y < a.miny) a.miny = y; if (y > a.maxy) a.maxy = y;
        if (isDoor) a.doors.push({ x: x, y: y });
      }
    }
    var out = [], k;
    for (k in acc) {
      out.push({ ch: k, bx: acc[k].minx, by: acc[k].miny,
                 bw: acc[k].maxx - acc[k].minx + 1, bh: acc[k].maxy - acc[k].miny + 1,
                 doors: acc[k].doors });
    }
    return out;
  }

  /* ---------------- acqua / olio: mesh dedicate ---------------- */

  // raggruppa i tile di un tipo in rettangoli (greedy per righe)
  function tileRects(map, kind) {
    var used = {}, rects = [], x, y, x2, y2, ok;
    for (y = 0; y < map.height; y++) {
      for (x = 0; x < map.width; x++) {
        if (used[x + ',' + y] || map.rows[y].charAt(x) !== kind) continue;
        x2 = x;
        while (x2 + 1 < map.width && map.rows[y].charAt(x2 + 1) === kind && !used[(x2 + 1) + ',' + y]) x2++;
        y2 = y;
        for (;;) {
          ok = y2 + 1 < map.height;
          for (var i = x; ok && i <= x2; i++) {
            if (map.rows[y2 + 1].charAt(i) !== kind || used[i + ',' + (y2 + 1)]) ok = false;
          }
          if (!ok) break;
          y2++;
        }
        for (var yy = y; yy <= y2; yy++) for (var xx = x; xx <= x2; xx++) used[xx + ',' + yy] = 1;
        rects.push({ x: x, y: y, w: x2 - x + 1, h: y2 - y + 1 });
      }
    }
    return rects;
  }

  var liquidResourceCache = {};

  function liquidTexture(kind, channel) {
    var key = 'liquid-' + kind + '-' + channel;
    if (texCache[key]) return texCache[key];
    var cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    var c = cv.getContext('2d');
    var i, x, y;
    if (channel === 'color') {
      // Seamless base: a diagonal full-canvas gradient jumps in value at
      // RepeatWrapping boundaries, creating giant panels across the lake.
      // Restrained wavelets below provide variation without a visible tile.
      c.fillStyle = kind === 'o' ? '#1b1924' : '#2d6677';
      c.fillRect(0, 0, 128, 128);
      for (i = 0; i < 28; i++) {
        x = (i * 47 + 13) % 128;
        y = (i * 71 + 29) % 128;
        c.strokeStyle = kind === 'o'
          ? 'rgba(157,100,153,' + (0.045 + (i % 4) * 0.012) + ')'
          : 'rgba(192,226,224,' + (0.035 + (i % 5) * 0.011) + ')';
        c.lineWidth = 0.8 + (i % 3) * 0.48;
        c.save();
        c.translate(x, y);
        c.rotate(-0.39 + (i % 7) * 0.095);
        c.beginPath();
        c.moveTo(-14 - (i % 3) * 4, 0);
        c.bezierCurveTo(-6, -2 - (i % 2), 7, 2,
          16 + (i % 4) * 3, 0);
        c.stroke();
        c.restore();
      }
    } else if (channel === 'normal') {
      c.fillStyle = 'rgb(128,128,255)';
      c.fillRect(0, 0, 128, 128);
      // Two oblique scales in one seamless data map: broad wind swell plus
      // short cross-ripples. Neither cohort is aligned to the ASCII grid.
      for (var cohort = 0; cohort < 2; cohort++) {
        var normalCount = cohort ? 44 : 18;
        c.save();
        c.translate(64, 64);
        c.rotate(cohort ? 0.58 : -0.34);
        c.translate(-64, -64);
        for (i = 0; i < normalCount; i++) {
          y = (i * (cohort ? 13 : 29) + (cohort ? 3 : 11)) % 128;
          c.strokeStyle = i % 2
            ? (cohort ? 'rgb(135,122,252)' : 'rgb(139,124,253)')
            : (cohort ? 'rgb(121,135,252)' : 'rgb(116,137,253)');
          c.lineWidth = cohort ? 0.65 : 1.15;
          c.beginPath();
          for (x = -24; x <= 152; x += cohort ? 7 : 11) {
            var waveY = y + Math.sin(
              (x + i * (cohort ? 7 : 13)) * (cohort ? 0.14 : 0.065)
            ) * (cohort ? 0.7 : (kind === 'o' ? 2.1 : 1.25));
            if (x === -24) c.moveTo(x, waveY);
            else c.lineTo(x, waveY);
          }
          c.stroke();
        }
        c.restore();
      }
    } else {
      c.fillStyle = kind === 'o' ? '#3c3c3c' : '#666666';
      c.fillRect(0, 0, 128, 128);
      for (i = 0; i < 42; i++) {
        x = (i * 37 + 19) % 128;
        y = (i * 59 + 31) % 128;
        var shade = kind === 'o' ? 42 + (i % 5) * 8 : 82 + (i % 7) * 7;
        c.fillStyle = 'rgb(' + shade + ',' + shade + ',' + shade + ')';
        c.beginPath();
        c.ellipse(x, y, 7 + (i % 4) * 3, 2 + (i % 3), (i % 6) * 0.17, 0, Math.PI * 2);
        c.fill();
      }
    }
    var tex = channel === 'color' ? makeSurfaceTex(cv) : makeDataTex(cv, 1, 1);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    // Plane UVs are expressed in world metres. A low repeat yields broad,
    // continuous lake movement; the previous high frequency read as a tiled
    // triangular quilt from the gameplay camera.
    tex.repeat.set(kind === 'o' ? 0.72 : 0.42, kind === 'o' ? 0.9 : 0.5);
    texCache[key] = tex;
    return tex;
  }

  function waterGlintTexture() {
    if (texCache.waterGlint) return texCache.waterGlint;
    var cv = document.createElement('canvas');
    cv.width = 256; cv.height = 128;
    var c = cv.getContext('2d');
    c.clearRect(0, 0, cv.width, cv.height);
    // Large broken reflection path gives the lake a readable light direction.
    // Short strokes add rain-scale response without becoming tiled rings.
    for (var band = 0; band < 5; band++) {
      c.save();
      c.translate(128 + (band - 2) * 17, 64 + (band % 2 ? 7 : -5));
      c.rotate(-0.27 + band * 0.035);
      c.strokeStyle = 'rgba(224,244,238,' +
        (0.055 + band * 0.018) + ')';
      c.lineWidth = 5.5 - band * 0.55;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(-86 + band * 8, -7 + band * 3);
      c.bezierCurveTo(-42, -14 + band, 8, 12 - band,
        78 - band * 6, 2);
      c.stroke();
      c.restore();
    }
    for (var i = 0; i < 34; i++) {
      var x = (i * 73 + 19) % 256;
      var y = (i * 41 + 13) % 128;
      c.strokeStyle = 'rgba(237,250,245,' +
        (0.08 + (i % 4) * 0.025) + ')';
      c.lineWidth = 0.8 + (i % 3) * 0.38;
      c.beginPath();
      c.moveTo(x - 4 - (i % 5) * 1.4, y);
      c.quadraticCurveTo(x, y - 1.6, x + 5 + (i % 4) * 2, y + 0.5);
      c.stroke();
    }
    var tex = makeSurfaceTex(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(0.12, 0.16);
    texCache.waterGlint = tex;
    return tex;
  }

  function liquidResources(kind) {
    if (liquidResourceCache[kind]) return liquidResourceCache[kind];
    var colorMap = liquidTexture(kind, 'color');
    var normalMap = liquidTexture(kind, 'normal');
    var roughnessMap = liquidTexture(kind, 'roughness');
    var glintMap = kind === 'w' ? waterGlintTexture() : null;
    var material = new THREE.MeshPhysicalMaterial({
      color: kind === 'o' ? 0x5c4862 : 0x72aeb8,
      map: colorMap,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(
        kind === 'o' ? 0.12 : 0.078,
        kind === 'o' ? 0.16 : 0.068),
      roughness: kind === 'o' ? 0.24 : 0.46,
      roughnessMap: roughnessMap,
      metalness: 0,
      clearcoat: kind === 'o' ? 0.82 : 0.31,
      clearcoatRoughness: kind === 'o' ? 0.12 : 0.32,
      reflectivity: kind === 'o' ? 0.5 : 0.18,
      envMapIntensity: kind === 'o' ? 0.82 : 0.34,
      vertexColors: kind !== 'o',
      transparent: true,
      opacity: kind === 'o' ? 0.9 : 0.985,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      dithering: true
    });
    var basinMaterial = kind === 'w' ? new THREE.MeshStandardMaterial({
      color: 0x173f50, roughness: 0.9, metalness: 0,
      envMapIntensity: 0.12, dithering: true
    }) : null;
    var highlightMaterial = kind === 'w' ? new THREE.MeshBasicMaterial({
      map: glintMap, color: 0xcfe8e1,
      transparent: true, opacity: 0.19, depthWrite: false,
      depthTest: true, blending: THREE.NormalBlending, toneMapped: false,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3
    }) : null;
    liquidResourceCache[kind] = {
      kind: kind, colorMap: colorMap, normalMap: normalMap,
      roughnessMap: roughnessMap, glintMap: glintMap,
      material: material, basinMaterial: basinMaterial,
      highlightMaterial: highlightMaterial
    };
    return liquidResourceCache[kind];
  }

  function scalePlaneUv(geometry, w, h) {
    var uv = geometry.attributes.uv;
    uv.setXY(0, 0, h);
    uv.setXY(1, w, h);
    uv.setXY(2, 0, 0);
    uv.setXY(3, w, 0);
    uv.needsUpdate = true;
  }

  function liquidRectRadius(angle, halfX, halfZ) {
    var cos = Math.abs(Math.cos(angle));
    var sin = Math.abs(Math.sin(angle));
    return Math.min(
      halfX / Math.max(cos, 0.0001),
      halfZ / Math.max(sin, 0.0001)
    );
  }

  function liquidEdgeNoise(angle, seed) {
    return Math.sin(angle * 2 + seed * 0.011) * 0.13 +
      Math.cos(angle * 3 - seed * 0.009) * 0.09 +
      Math.sin(angle * 5 + seed * 0.017) * 0.14 +
      Math.cos(angle * 9 - seed * 0.031) * 0.07 +
      Math.sin(angle * 13 + seed * 0.007) * 0.032;
  }

  function liquidRightCornerChamfer(angle, halfX, halfZ) {
    var direction = Math.atan2(
      Math.abs(Math.sin(angle)), Math.abs(Math.cos(angle)));
    var corner = Math.atan2(halfZ, halfX);
    return Math.max(0, 1 - Math.abs(direction - corner) / 0.46) * 0.16;
  }

  function irregularLiquidSurfaceGeometry(rc, inset) {
    var segments = 64;
    var halfX = rc.w / 2, halfZ = rc.h / 2;
    var cx = rc.x + halfX, cz = rc.y + halfZ;
    var seed = rc.x * 31 + rc.y * 17;
    var positions = [cx, 0.002, cz];
    var uvs = [halfX, halfZ];
    var colors = [0.34, 0.47, 0.52];
    var indices = [];
    var rings = [
      [0.36, 0.45, 0.58, 0.62, 0.002],
      [0.7, 0.54, 0.68, 0.71, 0.003],
      [1, 0.68, 0.79, 0.79, 0]
    ];
    for (var ring = 0; ring < rings.length; ring++) {
      var ringSpec = rings[ring];
      for (var i = 0; i < segments; i++) {
        var angle = i / segments * Math.PI * 2;
        var edge = liquidRectRadius(angle, halfX, halfZ) - inset +
          liquidEdgeNoise(angle, seed) -
          liquidRightCornerChamfer(angle, halfX, halfZ);
        var radius = Math.max(0.08, edge * ringSpec[0]);
        var tangent = ringSpec[0] * (
          Math.sin(angle * 5.3 + seed * 0.017) * 0.052 +
          Math.sin(angle * 11.1 - seed * 0.013) * 0.024);
        var lx = Math.cos(angle) * radius - Math.sin(angle) * tangent;
        var lz = Math.sin(angle) * radius + Math.cos(angle) * tangent;
        positions.push(cx + lx, ringSpec[4], cz + lz);
        uvs.push(lx + halfX, lz + halfZ);
        var variation = Math.sin(angle * 7 + seed + ring * 0.8) * 0.026;
        var shelfWeight = ring === rings.length - 1 ? Math.max(
          Math.pow(Math.max(0, Math.cos(angle - 0.3)), 18),
          Math.pow(Math.max(0, Math.cos(angle - 2.72)), 18),
          Math.pow(Math.max(0, Math.cos(angle - 4.58)), 18)
        ) : 0;
        colors.push(
          ringSpec[1] + variation - shelfWeight * 0.085,
          ringSpec[2] + variation - shelfWeight * 0.07,
          ringSpec[3] + variation * 0.7 - shelfWeight * 0.045);
      }
    }
    for (i = 0; i < segments; i++) {
      indices.push(0, 1 + (i + 1) % segments, 1 + i);
    }
    for (ring = 0; ring < rings.length - 1; ring++) {
      var ringStart = 1 + ring * segments;
      var nextStart = ringStart + segments;
      for (i = 0; i < segments; i++) {
        var next = (i + 1) % segments;
        indices.push(
          ringStart + i, nextStart + next, nextStart + i,
          ringStart + i, ringStart + next, nextStart + next
        );
      }
    }
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  function waterMesh(rc, kind, world) {
    var resource = liquidResources(kind);
    if (world.liquidResources.indexOf(resource) < 0) world.liquidResources.push(resource);
    var geometry;
    if (kind !== 'o') {
      geometry = irregularLiquidSurfaceGeometry(rc, 0.14);
      var basin = new THREE.Mesh(
        geometry,
        resource.basinMaterial
      );
      basin.position.y = 0.01;
      basin.receiveShadow = true;
      basin.renderOrder = 0;
      world.scene.add(basin);
    } else {
      geometry = new THREE.PlaneGeometry(rc.w, rc.h);
      scalePlaneUv(geometry, rc.w, rc.h);
    }
    var mesh = new THREE.Mesh(geometry, resource.material);
    mesh.name = kind === 'o' ? 'oil-surface' : 'water-surface';
    if (kind === 'o') {
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(rc.x + rc.w / 2, 0.036, rc.y + rc.h / 2);
    } else {
      mesh.position.y = 0.036;
    }
    mesh.receiveShadow = true;
    mesh.renderOrder = 3;
    world.scene.add(mesh);
    var highlight = null;
    if (kind === 'w') {
      highlight = new THREE.Mesh(geometry, resource.highlightMaterial);
      highlight.name = 'water-wind-glints';
      highlight.position.y = 0.044;
      highlight.renderOrder = 4;
      world.scene.add(highlight);
    }
    world.liquids.push({
      mesh: mesh, kind: kind, seed: rc.x * 31 + rc.y * 17,
      resource: resource, highlight: highlight
    });
    if (kind === 'w') world.foamRects.push(rc);
  }

  function foamTexture() {
    if (texCache.shoreFoam) return texCache.shoreFoam;
    var cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    var c = cv.getContext('2d');
    c.clearRect(0, 0, 128, 128);
    for (var i = 0; i < 26; i++) {
      var x = (i * 47 + 9) % 128;
      var y = (i * 73 + 17) % 128;
      c.strokeStyle = 'rgba(235,248,244,' + (0.13 + (i % 4) * 0.055) + ')';
      c.lineWidth = 0.7 + (i % 3) * 0.45;
      c.save();
      c.translate(x, y);
      c.rotate(-0.72 + (i % 9) * 0.17);
      c.beginPath();
      c.moveTo(-5 - (i % 3) * 2, 0);
      c.bezierCurveTo(-2, -1.5, 3, 1.6, 7 + (i % 4) * 2, 0);
      c.stroke();
      c.restore();
    }
    var tex = makeSurfaceTex(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1.6, 1);
    texCache.shoreFoam = tex;
    return tex;
  }

  function liquidEdgeGeometry(rects, edgeWidth) {
    var positions = [], uvs = [], indices = [];
    function quad(x0, z0, x1, z1) {
      var at = positions.length / 3;
      positions.push(x0, 0, z0, x1, 0, z0, x1, 0, z1, x0, 0, z1);
      var du = Math.max(0.1, Math.abs(x1 - x0) + Math.abs(z1 - z0));
      uvs.push(0, 0, du * 4, 0, du * 4, 1, 0, 1);
      indices.push(at, at + 2, at + 1, at, at + 3, at + 2);
    }
    rects.forEach(function (rc) {
      var e = edgeWidth || 0.11;
      var x0 = rc.x, x1 = rc.x + rc.w, z0 = rc.y, z1 = rc.y + rc.h;
      quad(x0, z0, x1, z0 + e);
      quad(x0, z1 - e, x1, z1);
      quad(x0, z0 + e, x0 + e, z1 - e);
      quad(x1 - e, z0 + e, x1, z1 - e);
    });
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  function irregularLiquidRingGeometry(
    rects, outerOffset, innerOffset, broken
  ) {
    var positions = [], uvs = [], indices = [];
    rects.forEach(function (rc, rectIndex) {
      var segments = 48;
      var start = positions.length / 3;
      var halfX = rc.w / 2, halfZ = rc.h / 2;
      var cx = rc.x + halfX, cz = rc.y + halfZ;
      var seed = rc.x * 31 + rc.y * 17;
      for (var i = 0; i < segments; i++) {
        var angle = i / segments * Math.PI * 2;
        var edge = liquidRectRadius(angle, halfX, halfZ) -
          liquidRightCornerChamfer(angle, halfX, halfZ);
        var noise = liquidEdgeNoise(angle, seed);
        var widthNoise = Math.sin(angle * 3.7 + seed * 0.013) * 0.052 +
          Math.cos(angle * 11.3 - seed * 0.019) * 0.024;
        var outer = Math.max(
          0.12, edge + outerOffset + noise + widthNoise);
        var inner = Math.max(
          0.1, edge + innerOffset + noise * 0.82 - widthNoise * 0.46);
        positions.push(
          cx + Math.cos(angle) * outer, 0, cz + Math.sin(angle) * outer,
          cx + Math.cos(angle) * inner, 0, cz + Math.sin(angle) * inner
        );
        var along = i / segments * (4 + Math.max(rc.w, rc.h) * 0.35);
        uvs.push(along, 0, along, 1);
      }
      for (i = 0; i < segments; i++) {
        if (broken) {
          var breakPhase = (i + rectIndex * 7) % 19;
          if ((breakPhase >= 5 && breakPhase <= 9) || breakPhase >= 15) {
            continue;
          }
        }
        var next = (i + 1) % segments;
        var outerAt = start + i * 2;
        var innerAt = outerAt + 1;
        var nextOuter = start + next * 2;
        var nextInner = nextOuter + 1;
        indices.push(
          outerAt, innerAt, nextOuter,
          nextOuter, innerAt, nextInner
        );
      }
    });
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  function irregularLiquidBankGeometry(rects, outerOffset, innerOffset) {
    var positions = [], colors = [], indices = [];
    rects.forEach(function (rc) {
      var halfX = rc.w / 2, halfZ = rc.h / 2;
      var cx = rc.x + halfX, cz = rc.y + halfZ;
      var seed = rc.x * 31 + rc.y * 17;
      // Independent tapered shoulders from the accepted U strategy. Long
      // intervals have no bank geometry at all, so the lake cannot become an
      // outlined game-board token.
      var bankSpans = [
        [2.08, 3.48, 13, 1],
        [4.2, 5.02, 9, 0.68]
      ];
      bankSpans.forEach(function (span, spanIndex) {
        var start = positions.length / 3;
        var samples = span[2];
        for (var i = 0; i < samples; i++) {
          var t = i / (samples - 1);
          var angle = span[0] + (span[1] - span[0]) * t;
          var taper = Math.pow(Math.sin(Math.PI * t), 0.92) * span[3];
          var edge = liquidRectRadius(angle, halfX, halfZ) -
            liquidRightCornerChamfer(angle, halfX, halfZ);
          var noise = liquidEdgeNoise(angle, seed) * 0.46;
          var lateral = Math.sin(
            angle * 3.7 + seed * 0.013 + spanIndex) * 0.038 * taper;
          var bankBase = edge - 0.025 + noise;
          var outer = bankBase +
            (0.12 + outerOffset * 0.46) * taper + lateral;
          var crest = bankBase + 0.055 * taper - lateral * 0.35;
          var inner = bankBase -
            (0.055 + Math.abs(innerOffset) * 0.22) * taper;
          var crestHeight = -0.012 + taper * (
            0.042 + Math.sin(angle * 4.1 + seed) * 0.009);
          var shade = 0.76 + Math.sin(
            angle * 4.7 + seed + spanIndex) * 0.08;
          [
            [outer, -0.018, 0.2, 0.27, 0.16],
            [crest, crestHeight, 0.27, 0.27, 0.15],
            [inner, -0.015 + taper * 0.012, 0.15, 0.21, 0.13]
          ].forEach(function (bankRing) {
            positions.push(
              cx + Math.cos(angle) * bankRing[0],
              bankRing[1],
              cz + Math.sin(angle) * bankRing[0]
            );
            colors.push(
              bankRing[2] * shade,
              bankRing[3] * shade,
              bankRing[4] * shade);
          });
        }
        for (i = 0; i < samples - 1; i++) {
          var a = start + i * 3, b = a + 1, c = a + 2;
          var na = a + 3, nb = a + 4, nc = a + 5;
          indices.push(
            a, b, na, na, b, nb,
            b, c, nb, nb, c, nc
          );
        }
      });
    });
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute(
      'color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  function irregularLiquidContactGeometry(rects) {
    var positions = [], indices = [];
    rects.forEach(function (rc) {
      var halfX = rc.w / 2, halfZ = rc.h / 2;
      var cx = rc.x + halfX, cz = rc.y + halfZ;
      var seed = rc.x * 31 + rc.y * 17;
      // Contact only where rocks or reed roots plausibly disturb the water.
      var contactSpans = [
        [0.12, 0.46, 7],
        [2.56, 2.9, 7],
        [4.44, 4.72, 6]
      ];
      contactSpans.forEach(function (span) {
        var start = positions.length / 3;
        for (var i = 0; i < span[2]; i++) {
          var t = i / (span[2] - 1);
          var angle = span[0] + (span[1] - span[0]) * t;
          var taper = Math.pow(Math.sin(Math.PI * t), 0.8);
          var boundary = liquidRectRadius(angle, halfX, halfZ) -
            liquidRightCornerChamfer(angle, halfX, halfZ) +
            liquidEdgeNoise(angle, seed);
          var outer = boundary - 0.125;
          var inner = outer - (0.018 + taper * 0.035);
          positions.push(
            cx + Math.cos(angle) * outer, 0, cz + Math.sin(angle) * outer,
            cx + Math.cos(angle) * inner, 0, cz + Math.sin(angle) * inner
          );
        }
        for (i = 0; i < span[2] - 1; i++) {
          var a = start + i * 2;
          indices.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
        }
      });
    });
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  function addLiquidShoreDressing(world) {
    var rects = world.foamRects;
    var reedsPerRect = 12;
    var reedCount = rects.length * reedsPerRect;
    var rockCount = rects.length * 6;
    var reeds = new THREE.InstancedMesh(
      groundFoliageGeometry('tuft'),
      new THREE.MeshStandardMaterial({
        color: 0x355c42, roughness: 0.96, metalness: 0,
        flatShading: true, envMapIntensity: 0.2
      }),
      reedCount
    );
    var rocks = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(0.19, 0),
      new THREE.MeshStandardMaterial({
        color: 0x58645e, roughness: 0.94, metalness: 0,
        flatShading: true, envMapIntensity: 0.22
      }),
      rockCount
    );
    var dummy = new THREE.Object3D();
    var at = 0;
    rects.forEach(function (rc, rectIndex) {
      var halfX = rc.w / 2, halfZ = rc.h / 2;
      var cx = rc.x + halfX, cz = rc.y + halfZ;
      var seed = rc.x * 31 + rc.y * 17;
      var reedAnchors = [0.34, 2.72, 4.58];
      var reedOffsets = [-0.13, -0.035, 0.065, 0.17];
      for (var i = 0; i < reedsPerRect; i++) {
        var reedCluster = Math.floor(i / 4);
        var reedRank = i % 4;
        // Three authored clumps leave long quiet shoreline intervals and
        // explain the damp shelves. Low multi-blade tufts replace the former
        // tall cones, which projected as detached spikes in the audit view.
        var angle = reedAnchors[reedCluster] + reedOffsets[reedRank] +
          Math.sin(i * 1.91 + rectIndex) * 0.018;
        var radius = liquidRectRadius(angle, halfX, halfZ) + 0.04 +
          liquidEdgeNoise(angle, seed);
        dummy.position.set(
          cx + Math.cos(angle) * radius,
          0.006,
          cz + Math.sin(angle) * radius
        );
        dummy.rotation.set(
          ((i % 5) - 2) * 0.018,
          angle * 1.7,
          ((i % 4) - 1.5) * 0.016
        );
        var reedScale = 0.72 + reedRank * 0.12 +
          reedCluster * 0.04;
        dummy.scale.set(
          0.78 + (reedRank % 2) * 0.18,
          reedScale,
          0.8 + ((reedRank + 1) % 2) * 0.14);
        dummy.updateMatrix();
        reeds.setMatrixAt(at++, dummy.matrix);
      }
    });
    at = 0;
    rects.forEach(function (rc, rectIndex) {
      var halfX = rc.w / 2, halfZ = rc.h / 2;
      var cx = rc.x + halfX, cz = rc.y + halfZ;
      var seed = rc.x * 31 + rc.y * 17;
      var rockAnchors = [0.22, 3.78];
      var rockAngleOffsets = [-0.085, 0.025, 0.135];
      var rockRadiusOffsets = [-0.12, 0.17, -0.035];
      for (var i = 0; i < 6; i++) {
        var rockCluster = i % rockAnchors.length;
        var rockRank = Math.floor(i / rockAnchors.length);
        var angle = rockAnchors[rockCluster] +
          rockAngleOffsets[rockRank] +
          Math.sin(i * 2.17 + rectIndex) * 0.025;
        var radius = liquidRectRadius(angle, halfX, halfZ) +
          rockRadiusOffsets[rockRank] + liquidEdgeNoise(angle, seed);
        dummy.position.set(
          cx + Math.cos(angle) * radius,
          [0.055, 0.095, 0.068][rockRank],
          cz + Math.sin(angle) * radius
        );
        dummy.rotation.set(i * 0.31, angle, i * 0.17);
        dummy.scale.set(
          0.92 + (i % 3) * 0.25,
          0.58 + (i % 2) * 0.2,
          0.82 + (i % 4) * 0.13
        );
        dummy.updateMatrix();
        rocks.setMatrixAt(at++, dummy.matrix);
      }
    });
    reeds.instanceMatrix.needsUpdate = true;
    rocks.instanceMatrix.needsUpdate = true;
    reeds.name = 'shoreline-rush-tufts-sparse';
    rocks.name = 'shoreline-rocks-sparse';
    reeds.receiveShadow = true;
    rocks.receiveShadow = true;
    world.scene.add(reeds);
    world.scene.add(rocks);
    world.shoreDressing = { reeds: reedCount, rocks: rockCount };
  }

  function finalizeLiquidEdges(world) {
    if (!world.foamRects.length) return;
    var bank = new THREE.Mesh(
      irregularLiquidBankGeometry(world.foamRects, 0.1, -0.02),
      new THREE.MeshStandardMaterial({
        color: 0x68735f, vertexColors: true, roughness: 0.99, metalness: 0,
        envMapIntensity: 0.08, flatShading: true, dithering: true
      })
    );
    bank.name = 'shoreline-wet-moss-bank-batch';
    bank.position.y = 0.032;
    bank.renderOrder = 3;
    bank.receiveShadow = true;
    world.scene.add(bank);
    var contact = new THREE.Mesh(
      irregularLiquidContactGeometry(world.foamRects),
      new THREE.MeshBasicMaterial({
        color: 0xd7e8df, transparent: true, opacity: 0.13,
        depthWrite: false, toneMapped: false,
        polygonOffset: true, polygonOffsetFactor: -3,
        polygonOffsetUnits: -3
      })
    );
    contact.name = 'shoreline-causal-contact-patches';
    contact.position.y = 0.049;
    contact.renderOrder = 4;
    world.scene.add(contact);
    // There is deliberately no closed shallow/foam perimeter.
    world.shoreFoam = null;
    addLiquidShoreDressing(world);
  }

  /* ---------------- muri interni: facciata ricca per stanza ---------------- */
  /* Ogni interno ha una palette propria (legno caldo dello sceriffo, carta da
   * parati fiorita dei Palmer, scacchiera del diner, piastrelle dell'ospedale,
   * verde/oro del Great Northern, rosso del casinò, assi scure del roadhouse).
   * La Loggia Nera resta la tenda 'R' esistente. Le mappe non elencate (es. il
   * vagone) ricadono su WPAL_DEFAULT, vicino ai vecchi colori piatti. */
  var WPAL = {
    sheriff:   { base: '#8a6a48', wain: '#5a4230', wainLite: '#7a5c3e', wallC: '#c8a878', wallLite: '#dcbf94', trim: '#4a3320', pattern: 'plank', decal: 'frame' },
    palmer:    { base: '#c8b088', wain: '#a88a5e', wainLite: '#bda072', wallC: '#e8d8c0', wallLite: '#f2e6d4', trim: '#8a6a48', pattern: 'floral', decal: 'frame' },
    diner:     { base: '#2e5c58', wain: '#1c3e3a', wainLite: '#3a726c', wallC: '#e8e0c8', wallLite: '#f4ecd8', trim: '#b8bcc0', pattern: 'checker', decal: 'clock' },
    hospital:  { base: '#c8ccd0', wain: '#aeb4ba', wainLite: '#d8dce0', wallC: '#eef0f0', wallLite: '#ffffff', trim: '#8a98a8', pattern: 'tile', decal: null },
    hotel_gn:  { base: '#284830', wain: '#1c3220', wainLite: '#3a5c3e', wallC: '#284830', wallLite: '#38603e', trim: '#c8a848', pattern: 'stripe', decal: 'frame' },
    oej:       { base: '#5a1018', wain: '#3a0a10', wainLite: '#701420', wallC: '#701018', wallLite: '#8a1c24', trim: '#c8a848', pattern: 'damask', decal: 'clock' },
    roadhouse: { base: '#3a2e26', wain: '#241a12', wainLite: '#4a3a2c', wallC: '#3a2e26', wallLite: '#4a3a2c', trim: '#1c130c', pattern: 'plank', decal: null }
  };
  var WPAL_DEFAULT = { base: '#4a3636', wain: '#3a2828', wainLite: '#5a4242', wallC: '#4a3636', wallLite: '#5a4242', trim: '#241a1a', pattern: 'plain', decal: null };

  function drawWainscot(c, pal, w, y0, hgt) {
    var x;
    c.fillStyle = pal.wainLite;
    for (x = 0; x < w; x += 16) c.fillRect(x + 2, y0 + 2, 12, 1);
    c.fillStyle = pal.trim;
    for (x = 0; x < w; x += 16) c.fillRect(x, y0, 1, hgt);
  }

  function drawWallpaperPattern(c, pal, w, hgt, h) {
    var x, y;
    function F(xx, yy, ww, hh, col) { c.fillStyle = col; c.fillRect(xx, yy, ww, hh); }
    switch (pal.pattern) {
      case 'plank': // assi verticali chiare/scure (sceriffo, roadhouse)
        for (x = 0; x < w; x += 16) { F(x, 0, 1, hgt, pal.wallLite); F(x + 15, 0, 1, hgt, pal.wain); }
        break;
      case 'floral': // carta da parati Palmer: fiorellini a griglia
        for (y = 8; y < hgt; y += 16) {
          for (x = 8; x < w; x += 16) {
            if (h(x, y) % 3 === 0) { F(x - 1, y, 3, 3, pal.trim); F(x, y - 2, 1, 2, '#7a9e58'); }
          }
        }
        break;
      case 'checker': // scacchiera bassa da diner + fascia cromata in alto
        var cs = 8;
        for (y = hgt - cs * 2; y < hgt; y += cs) {
          for (x = 0; x < w; x += cs) {
            if (((x / cs) + (y / cs)) % 2 === 0) F(x, Math.max(0, y), cs, cs, pal.wallLite);
          }
        }
        F(0, 4, w, 3, '#c8ccd0'); F(0, 4, w, 1, '#eef0f0');
        break;
      case 'tile': // piastrelle bianche dell'ospedale
        for (x = 0; x < w; x += 16) F(x, 0, 1, hgt, pal.trim);
        for (y = 0; y < hgt; y += 10) F(0, y, w, 1, pal.trim);
        break;
      case 'stripe': // righe dorate verticali del Great Northern
        for (x = 6; x < w; x += 20) F(x, 0, 3, hgt, pal.trim);
        break;
      case 'damask': // motivo a losanghe di One Eyed Jacks
        for (y = 6; y < hgt; y += 12) {
          for (x = (Math.floor(y / 12) % 2) * 6; x < w; x += 12) F(x + 3, y, 2, 2, pal.trim);
        }
        break;
      default:
        break;
    }
  }

  function drawFrameDecal(c, cx, cy, pal, hh) {
    var w = 14, hgt = 18;
    c.fillStyle = pal.trim; c.fillRect(cx - w / 2 - 1, cy - hgt / 2 - 1, w + 2, hgt + 2);
    c.fillStyle = hh % 2 ? '#c8a860' : '#7a8a98';
    c.fillRect(cx - w / 2, cy - hgt / 2, w, hgt);
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(cx - w / 2, cy + hgt / 2 - 3, w, 3);
  }

  function drawClockDecal(c, cx, cy) {
    var r = 8;
    c.fillStyle = '#2a1a10'; c.beginPath(); c.arc(cx, cy, r + 1, 0, 6.2832); c.fill();
    c.fillStyle = '#f0e6cc'; c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.fill();
    c.fillStyle = '#2a1a10';
    c.fillRect(cx - 1, cy - r + 2, 1, r - 2);
    c.fillRect(cx, cy, 4, 1);
  }

  // texture della faccia sud della parete (quella che il giocatore vede): battiscopa
  // + zoccolo/wainscot + carta da parati/pattern, con quadro/orologio opzionale.
  // Cache per (mappa, larghezza del run, altezza del muro) cosi' le pareti lunghe
  // restano nitide e non si rigenera la stessa texture piu' volte. L'altezza e'
  // parametrica (non piu' legata a IWALL_H): 32px/unita' mondo in entrambi gli assi,
  // cosi' zoccolo/carta da parati restano proporzionali e i quadri non si stirano.
  function wallFaceTexture(map, runW, hgt) {
    var key = 'wallface_' + map.id + '_' + runW + '_' + hgt;
    if (texCache[key]) return texCache[key];
    var pal = WPAL[map.id] || WPAL_DEFAULT;
    var wpx = runW * TILE * 2, hpx = Math.round(TILE * 2 * hgt);
    var cv = document.createElement('canvas');
    cv.width = wpx; cv.height = hpx;
    var c = cv.getContext('2d');
    function F(x, y, ww, hh, col) { c.fillStyle = col; c.fillRect(x, y, ww, hh); }
    var baseH = Math.round(hpx * 0.13), wainH = Math.round(hpx * 0.34);
    var wainY0 = hpx - baseH - wainH, wpY1 = wainY0;
    // seed deterministico dalla mappa (niente Math.random legato al tempo)
    var seed = 5, i;
    for (i = 0; i < map.id.length; i++) seed = (seed * 31 + map.id.charCodeAt(i)) & 0x7fffffff;
    function h(px, py) { return (seed + px * 7 + py * 13) % 97; }

    F(0, 0, wpx, wpY1, pal.wallC);
    drawWallpaperPattern(c, pal, wpx, wpY1, h);

    F(0, wainY0, wpx, wainH, pal.wain);
    drawWainscot(c, pal, wpx, wainY0, wainH);

    F(0, wainY0 - 2, wpx, 2, pal.trim);
    F(0, wainY0 - 2, wpx, 1, 'rgba(255,255,255,0.12)');

    F(0, hpx - baseH, wpx, baseH, pal.trim);
    F(0, hpx - baseH, wpx, 1, 'rgba(255,255,255,0.10)');

    if (pal.decal && runW >= 3) {
      var slots = Math.max(1, Math.floor(runW / 4));
      for (i = 0; i < slots; i++) {
        var cx = wpx * (i + 1) / (slots + 1), cy = wpY1 * 0.5;
        if (pal.decal === 'clock') drawClockDecal(c, cx, cy);
        else drawFrameDecal(c, cx, cy, pal, h(i, 0));
      }
    }

    var t = makeSurfaceTex(cv);
    texCache[key] = t;
    return t;
  }

  // altezza di un run di muro interno per riga: esterni restano su IWALL_H;
  // interni sono alti (2.1) ovunque tranne la fila sud (verso la camera, y ===
  // map.height-1), tenuta bassa (0.9) per non nascondere il giocatore vicino
  // alla porta. Le tende della Loggia Nera ('R') restano sempre alte, riga sud
  // inclusa: sono un fondale, non nascondono nulla in primo piano. Condivisa
  // tra extrudeWalls (assegna l'altezza al run) e addDoorFrames (deve
  // combaciare con l'altezza del run in cui la porta e' ritagliata).
  function wallRunHeight(map, ch, y) {
    if (!map.indoor) return IWALL_H;
    if (ch === 'R') return IWALL_TALL_H;
    // La partizione del corridoio Palmer e' una parete da modellino cutaway:
    // rimane completa e solida, ma il coronamento più basso lascia leggere il
    // passaggio nord invece di tagliarlo come un fondale a tutta altezza.
    if (map.id === 'palmer' && y === 4) return 1.92;
    return (y === map.height - 1) ? IWALL_SOUTH_H : IWALL_TALL_H;
  }

  /* ---------------- muri estrusi / mobili ---------------- */

  function extrudeWalls(map, scene) {
    var y, x, ch, run, runCh;
    var pal = WPAL[map.id] || WPAL_DEFAULT;
    var wallTop = new THREE.MeshLambertMaterial({ color: '#5a4242' });
    var wallDark = new THREE.MeshLambertMaterial({ color: '#3a2828' });
    var plainSide = new THREE.MeshLambertMaterial({ color: pal.wain });
    var plainFace = new THREE.MeshLambertMaterial({ color: pal.base });
    var curtainTexBase = null;
    function curtain(repeatX, repeatY) {
      if (!curtainTexBase) {
        var cv = document.createElement('canvas');
        cv.width = 32; cv.height = 32;
        var c = cv.getContext('2d');
        c.setTransform(2, 0, 0, 2, 0, 0);
        Sp.drawTile(c, 'R', 0, 0, 0, 0, 0, {});
        curtainTexBase = cv;
      }
      var t = makeTex(curtainTexBase);
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeatX, repeatY);
      return t;
    }
    // vero solo per il muro il cui lato sud e' il pavimento di una stanza (la
    // parete "di fondo" che la camera, rivolta a nord, vede sempre): li' la
    // faccia +z riceve la texture ricca; altrove (pilastri laterali est/ovest,
    // muro perimetrale sud dietro la porta) resta un colore piatto per mappa.
    function rowAt(xx, yy) {
      if (yy < 0 || yy >= map.height) return ' ';
      var r = map.rows[yy];
      if (xx < 0 || xx >= r.length) return ' ';
      return r.charAt(xx);
    }
    function isAnchorRun(x0, x1, y2) {
      // basta UNA colonna del run con pavimento a sud: i run perimetrali
      // partono dall'angolo (sotto c'e' il muro laterale) ma restano di fondo
      for (var xx = x0; xx < x1; xx++) {
        if (INDOOR_FLOOR[rowAt(xx, y2 + 1)] === 1) return true;
      }
      return false;
    }
    function flush(x0, x1, y2, c2) {
      var w = x1 - x0, mesh, mats, hgt = wallRunHeight(map, c2, y2);
      if (c2 === 'R') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(w, hgt, 1),
          new THREE.MeshLambertMaterial({ map: curtain(w, hgt) }));
      } else {
        var southMat = isAnchorRun(x0, x1, y2)
          ? new THREE.MeshLambertMaterial({ map: wallFaceTexture(map, w, hgt) })
          : plainFace;
        mats = [plainSide, plainSide, wallTop, wallDark, southMat, wallDark];
        mesh = new THREE.Mesh(new THREE.BoxGeometry(w, hgt, 1), mats);
      }
      mesh.position.set(x0 + w / 2, hgt / 2, y2 + 0.5);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
    }
    for (y = 0; y < map.height; y++) {
      run = -1; runCh = null;
      for (x = 0; x <= map.width; x++) {
        ch = x < map.width ? map.rows[y].charAt(x) : null;
        var isWall = (ch === 'i' || ch === 'R');
        if (isWall && run < 0) { run = x; runCh = ch; }
        else if (run >= 0 && (!isWall || ch !== runCh)) {
          flush(run, x, y, runCh);
          run = isWall ? x : -1; runCh = ch;
        }
      }
    }
  }

  /* ---------------- porte incorniciate ---------------- */
  /* Ogni gap 'D' dentro un muro perimetrale diventa una soglia leggibile:
   * architrave in alto, due stipiti sottili ai lati, incasso scuro dietro.
   * Le porte stanno solo su righe perimetrali (bordo mappa o bordo stanza),
   * quindi la posizione e' deterministica dai bordi del gap. Elementi solo
   * grafici: nessuna voce di collisione, la geometria dei muri resta invariata. */
  function addDoorFrames(map, scene) {
    var jambMat = new THREE.MeshLambertMaterial({ color: '#2a1a10' });
    var lintelMat = new THREE.MeshLambertMaterial({ color: '#3a2818' });
    var recessMat = new THREE.MeshBasicMaterial({ color: '#120a06', side: THREE.DoubleSide });
    var lintelH = 0.18, jambW = 0.09;
    // il telaio deve combaciare con l'altezza del run di muro in cui la porta e'
    // ritagliata: guarda il carattere di parete ('i' o 'R') subito a sinistra o a
    // destra del varco 'D' e riusa la stessa altezza che extrudeWalls gli ha dato.
    function flankWallCh(y2, x0, x1) {
      var row = map.rows[y2];
      var l = x0 > 0 ? row.charAt(x0 - 1) : '';
      if (l === 'i' || l === 'R') return l;
      var r = x1 < row.length ? row.charAt(x1) : '';
      if (r === 'i' || r === 'R') return r;
      return 'i';
    }
    function addFrame(x0, x1, y2) {
      var w = x1 - x0, z = y2 + 0.5;
      var wallH = wallRunHeight(map, flankWallCh(y2, x0, x1), y2);
      var openH = wallH - lintelH;
      var lintel = new THREE.Mesh(new THREE.BoxGeometry(w, lintelH, 1), lintelMat);
      lintel.position.set(x0 + w / 2, wallH - lintelH / 2, z);
      lintel.castShadow = true;
      scene.add(lintel);
      var j1 = new THREE.Mesh(new THREE.BoxGeometry(jambW, openH, 1), jambMat);
      j1.position.set(x0 + jambW / 2, openH / 2, z);
      scene.add(j1);
      var j2 = new THREE.Mesh(new THREE.BoxGeometry(jambW, openH, 1), jambMat);
      j2.position.set(x1 - jambW / 2, openH / 2, z);
      scene.add(j2);
      var recess = new THREE.Mesh(
        new THREE.PlaneGeometry(Math.max(0.1, w - jambW * 2), openH),
        recessMat
      );
      recess.position.set(x0 + w / 2, openH / 2, z);
      scene.add(recess);
    }
    var y, x, run;
    for (y = 0; y < map.height; y++) {
      run = -1;
      for (x = 0; x <= map.width; x++) {
        var ch = x < map.width ? map.rows[y].charAt(x) : null;
        if (ch === 'D' && run < 0) run = x;
        else if (run >= 0 && ch !== 'D') { addFrame(run, x, y); run = -1; }
      }
    }
  }

  var FURN = { C: 0.55, t: 0.45, h: 0.4, K: 0.42, U: 0.6 };

  // faccia superiore dell'arredo: stessa pixel-art 2D (tiles.js), a 2x, in cache
  // per carattere — floorWood()/i case C,t,h,K,U non variano con la posizione.
  var furnTopMatCache = {};
  function furnTopMaterial(ch) {
    if (furnTopMatCache[ch]) return furnTopMatCache[ch];
    var key = 'furntop_' + ch;
    var tex = texCache[key];
    if (!tex) {
      var cv = document.createElement('canvas');
      cv.width = 32; cv.height = 32;
      var c = cv.getContext('2d');
      c.setTransform(2, 0, 0, 2, 0, 0);
      Sp.drawTile(c, ch, 0, 0, 0, 0, 0, {});
      tex = texCache[key] = makeTex(cv);
    }
    furnTopMatCache[ch] = new THREE.MeshLambertMaterial({ map: tex });
    return furnTopMatCache[ch];
  }

  // facciata frontale (+z, verso la camera) di banconi/comò: pannello con cassetti
  // e pomelli, stessa palette del case 'U' in tiles.js. Sostituisce il flat #6a4a2e
  // solo sulla faccia frontale; le altre restano piatte.
  var furnFrontMatCache = {};
  function furnFrontMaterial(ch) {
    if (furnFrontMatCache[ch]) return furnFrontMatCache[ch];
    var key = 'furnfront_' + ch;
    var tex = texCache[key];
    if (!tex) {
      var cv = document.createElement('canvas');
      cv.width = 64; cv.height = 64;
      var c = cv.getContext('2d');
      function F(x, y, w, h, col) { c.fillStyle = col; c.fillRect(x * 2, y * 2, w * 2, h * 2); }
      F(0, 0, 32, 32, '#8a5c30');
      F(0, 0, 32, 1, '#a67840');
      F(0, 11, 32, 1, '#5a3c1e');
      F(0, 21, 32, 1, '#5a3c1e');
      F(14, 5, 4, 1, '#d8b878');
      F(14, 15, 4, 1, '#d8b878');
      F(14, 25, 4, 1, '#d8b878');
      F(0, 31, 32, 1, '#4a3018');
      tex = texCache[key] = makeTex(cv);
    }
    furnFrontMatCache[ch] = new THREE.MeshLambertMaterial({ map: tex });
    return furnFrontMatCache[ch];
  }

  // arredo come oggetti veri, non casse: stesso ingombro (0.96x0.96) e stessa
  // altezza totale di FURN[ch] (la collisione resta a griglia, invariata) ma con
  // gambe/schienale/telaio scomposti in mesh separate.
  function furniture(map, scene) {
    var y, x, ch, hgt, cx, cz, corners, i, s, mesh;
    var flat = new THREE.MeshLambertMaterial({ color: '#6a4a2e' });
    for (y = 0; y < map.height; y++) {
      for (x = 0; x < map.width; x++) {
        ch = map.rows[y].charAt(x);
        if (!FURN[ch]) continue;
        hgt = FURN[ch];
        cx = x + 0.5; cz = y + 0.5;
        var topMat = furnTopMaterial(ch);

        if (ch === 't') { // tavolo: piano sottile + 4 gambe
          var topH = 0.08, legH = hgt - topH;
          mesh = new THREE.Mesh(new THREE.BoxGeometry(0.86, topH, 0.86),
            [flat, flat, topMat, flat, flat, flat]);
          mesh.position.set(cx, legH + topH / 2, cz);
          mesh.castShadow = true; mesh.receiveShadow = true;
          scene.add(mesh);
          corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
          for (i = 0; i < corners.length; i++) {
            s = corners[i];
            mesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, legH, 0.08), flat);
            mesh.position.set(cx + s[0] * 0.36, legH / 2, cz + s[1] * 0.36);
            mesh.castShadow = true;
            scene.add(mesh);
          }
        } else if (ch === 'h') { // sedia: seduta + schienale a nord (-z) + 4 gambe corte
          var seatH = 0.22, seatT = 0.08;
          mesh = new THREE.Mesh(new THREE.BoxGeometry(0.62, seatT, 0.62),
            [flat, flat, topMat, flat, flat, flat]);
          mesh.position.set(cx, seatH, cz);
          mesh.castShadow = true; mesh.receiveShadow = true;
          scene.add(mesh);
          mesh = new THREE.Mesh(new THREE.BoxGeometry(0.62, hgt - seatH, 0.08), flat);
          mesh.position.set(cx, seatH + (hgt - seatH) / 2, cz - 0.27);
          mesh.castShadow = true;
          scene.add(mesh);
          corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
          for (i = 0; i < corners.length; i++) {
            s = corners[i];
            mesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, seatH, 0.06), flat);
            mesh.position.set(cx + s[0] * 0.26, seatH / 2, cz + s[1] * 0.26);
            mesh.castShadow = true;
            scene.add(mesh);
          }
        } else if (ch === 'K') { // letto: telaio basso + materasso
          var frameH = 0.12;
          mesh = new THREE.Mesh(new THREE.BoxGeometry(0.92, frameH, 0.92), flat);
          mesh.position.set(cx, frameH / 2, cz);
          mesh.castShadow = true; mesh.receiveShadow = true;
          scene.add(mesh);
          var mattH = hgt - frameH;
          mesh = new THREE.Mesh(new THREE.BoxGeometry(0.86, mattH, 0.86),
            [flat, flat, topMat, flat, flat, flat]);
          mesh.position.set(cx, frameH + mattH / 2, cz);
          mesh.castShadow = true; mesh.receiveShadow = true;
          scene.add(mesh);
        } else { // C, U: bancone/comò — box intero, ma con facciata frontale disegnata
          mesh = new THREE.Mesh(new THREE.BoxGeometry(0.96, hgt, 0.96),
            [flat, flat, topMat, flat, furnFrontMaterial(ch), flat]);
          mesh.position.set(cx, hgt / 2, cz);
          mesh.castShadow = true; mesh.receiveShadow = true;
          scene.add(mesh);
        }
      }
    }
  }

  /* ---------------- props d'arredo interni ---------------- */
  /* decorazioni non collidenti (pianta, appendiabiti, lampada da terra): icone
   * disegnate in tiles.js (S.drawProp), montate come billboard + blob-shadow
   * come le altre sculture/arredi urbani. Iniettate render-side: non toccano
   * le griglie di maps.js né M.SOLID. */

  function propTexture(kind) {
    var key = 'prop_' + kind;
    if (texCache[key]) return texCache[key];
    var cv = document.createElement('canvas');
    cv.width = 32; cv.height = 48; // 16x24 logico, a 2x
    var c = cv.getContext('2d');
    c.setTransform(2, 0, 0, 2, 0, 0);
    Sp.drawProp(c, kind, 0, 0);
    texCache[key] = makeTex(cv);
    return texCache[key];
  }

  var PROP_SIZE = { // [larghezza, altezza] del billboard in unità mondo
    plant: [0.55, 0.75],
    coatrack: [0.42, 0.85],
    lamp: [0.42, 0.85]
  };

  // celle di pavimento (f/c) in angoli lontani da porte, NPC e dalla linea
  // diretta porta<->NPC — vedi le griglie in maps.js per la verifica cella per cella.
  var PROPS = {
    sheriff: [{ kind: 'plant', x: 1, y: 3 }, { kind: 'coatrack', x: 12, y: 7 }],
    palmer: [{ kind: 'plant', x: 13, y: 2 }, { kind: 'lamp', x: 2, y: 9 }],
    hotel_gn: [{ kind: 'plant', x: 16, y: 2 }, { kind: 'coatrack', x: 1, y: 9 }],
    hospital: [{ kind: 'plant', x: 9, y: 2 }, { kind: 'lamp', x: 1, y: 7 }],
    diner: [{ kind: 'coatrack', x: 12, y: 1 }, { kind: 'plant', x: 1, y: 8 }],
    oej: [{ kind: 'lamp', x: 1, y: 1 }, { kind: 'plant', x: 14, y: 1 }],
    roadhouse: [{ kind: 'plant', x: 1, y: 2 }, { kind: 'lamp', x: 14, y: 6 }]
  };

  function addProps(map, scene) {
    var list = PROPS[map.id];
    if (!list) return;
    list.forEach(function (p) {
      var size = PROP_SIZE[p.kind];
      scene.add(billboard(propTexture(p.kind), size[0], size[1], p.x + 0.5, p.y + 0.5, 0.01));
      blobShadow(scene, p.x + 0.5, p.y + 0.62, 0.22);
    });
  }

  /* ---------------- authored environment kit ---------------- */

  var environmentKitMaterials = {};

  function kitMaterial(name, color, roughness, metalness, emissive) {
    if (environmentKitMaterials[name]) return environmentKitMaterials[name];
    environmentKitMaterials[name] = new THREE.MeshStandardMaterial({
      color: color,
      roughness: roughness === undefined ? 0.78 : roughness,
      metalness: metalness || 0,
      envMapIntensity: metalness ? 0.75 : 0.38,
      emissive: emissive || 0x000000,
      emissiveIntensity: emissive ? 0.36 : 0,
      flatShading: true
    });
    return environmentKitMaterials[name];
  }

  function kitBox(parent, size, pos, material, rotation) {
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
    mesh.position.set(pos[0], pos[1], pos[2]);
    if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    parent.add(mesh);
    return mesh;
  }

  function kitCylinder(parent, top, bottom, height, segments, pos, material, rotation) {
    var mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, segments), material);
    mesh.position.set(pos[0], pos[1], pos[2]);
    if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    parent.add(mesh);
    return mesh;
  }

  function markKitShadows(group) {
    group.traverse(function (o) {
      if (!o.isMesh) return;
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      var radius = o.geometry.boundingSphere ? o.geometry.boundingSphere.radius : 1;
      // Thin inlays and desk micro-props receive grounding but do not consume
      // shadow submissions. Large vertical forms keep silhouette shadows.
      o.castShadow = o.position.y > 0.15 && radius > 0.22;
      o.receiveShadow = true;
    });
  }

  function addKitWindow(group, x, z, width, curtainColor) {
    var glass = kitMaterial('kit-glass', 0x355263, 0.24, 0.12, 0x17394a);
    var frame = kitMaterial('kit-frame', 0xc9b995, 0.72);
    // Portare vetro e telaio davanti alla pelle del muro evita il vecchio read
    // da sottile linea ciano quasi complanare.
    var frontZ = z + 0.085;
    kitBox(group, [width, 0.74, 0.045], [x, 1.42, frontZ], glass);
    kitBox(group, [width + 0.14, 0.07, 0.09], [x, 1.82, frontZ + 0.018], frame);
    kitBox(group, [width + 0.22, 0.07, 0.18], [x, 1.01, frontZ + 0.055], frame);
    kitBox(group, [0.065, 0.8, 0.09], [x - width / 2, 1.42, frontZ + 0.018], frame);
    kitBox(group, [0.065, 0.8, 0.09], [x + width / 2, 1.42, frontZ + 0.018], frame);
    kitBox(group, [0.045, 0.76, 0.095], [x, 1.42, frontZ + 0.025], frame);
    if (curtainColor) {
      var cloth = kitMaterial('curtain-' + curtainColor, curtainColor, 0.96);
      kitBox(group, [0.18, 0.88, 0.1], [x - width / 2 - 0.07, 1.43, frontZ + 0.08], cloth, [0, 0, -0.05]);
      kitBox(group, [0.18, 0.88, 0.1], [x + width / 2 + 0.07, 1.43, frontZ + 0.08], cloth, [0, 0, 0.05]);
    }
  }

  function addInteriorShellKit(map, group) {
    var pal = WPAL[map.id] || WPAL_DEFAULT;
    var trim = kitMaterial('shell-trim-' + map.id, new THREE.Color(pal.trim).getHex(), 0.82);
    var plaster = kitMaterial('shell-plaster-' + map.id, new THREE.Color(pal.wallLite).getHex(), 0.9);
    // Cornice, battiscopa e montanti trasformano i tre muri estrusi in una
    // scatola architettonica leggibile. Tutto resta dentro le celle muro.
    kitBox(group, [map.width - 2, 0.09, 0.12], [map.width / 2, 2.03, 1.02], trim);
    kitBox(group, [map.width - 2, 0.08, 0.1], [map.width / 2, 0.13, 1.03], trim);
    kitBox(group, [0.12, 0.09, map.height - 2], [1.02, 2.03, map.height / 2], trim);
    kitBox(group, [0.12, 0.09, map.height - 2], [map.width - 1.02, 2.03, map.height / 2], trim);
    kitBox(group, [0.13, 2.0, 0.13], [1.03, 1.0, 1.03], plaster);
    kitBox(group, [0.13, 2.0, 0.13], [map.width - 1.03, 1.0, 1.03], plaster);
    // Il muro frontale cutaway riceve un corrimano finito invece di terminare
    // come un parallelepipedo grezzo.
    kitBox(group, [map.width - 2, 0.08, 0.16],
      [map.width / 2, IWALL_SOUTH_H + 0.03, map.height - 0.98], trim);
  }

  function addDeskSet(group, x, z, variant) {
    var iron = kitMaterial('sheriff-iron', 0x30363a, 0.38, 0.42);
    var key = kitMaterial('sheriff-keys', 0xc6bda8, 0.78);
    var paper = kitMaterial('sheriff-paper', 0xe6ddc7, 0.92);
    var green = kitMaterial('sheriff-lamp', 0x315e48, 0.36, 0.08);
    var phone = kitMaterial('sheriff-phone', 0x20272a, 0.48, 0.16);
    var mug = kitMaterial('sheriff-mug', 0xd0c5aa, 0.76);
    var folder = kitMaterial('sheriff-folder-blue', 0x526a78, 0.9);
    kitBox(group, [0.34, 0.14, 0.24], [x, 0.64, z], iron);
    kitBox(group, [0.3, 0.025, 0.14], [x, 0.72, z + 0.08], key);
    for (var i = 0; i < 3; i++) {
      kitBox(group, [0.055, 0.018, 0.035], [x - 0.09 + i * 0.09, 0.742, z + 0.095], iron);
    }
    kitBox(group, [0.24, 0.018, 0.2], [x + (variant ? -0.34 : 0.35), 0.57, z + 0.02], paper, [0, variant ? -0.08 : 0.08, 0]);
    kitCylinder(group, 0.025, 0.025, 0.34, 7,
      [x + (variant ? 0.32 : -0.31), 0.74, z - 0.02], iron);
    kitCylinder(group, 0.14, 0.06, 0.13, 10,
      [x + (variant ? 0.32 : -0.31), 0.94, z - 0.02], green);
    var phoneX = x + (variant ? -0.48 : 0.48);
    kitBox(group, [0.28, 0.075, 0.18], [phoneX, 0.6, z - 0.23], phone);
    kitBox(group, [0.31, 0.055, 0.07], [phoneX, 0.67, z - 0.23], phone,
      [0, variant ? -0.08 : 0.08, 0]);
    kitCylinder(group, 0.055, 0.05, 0.13, 9,
      [x + (variant ? 0.02 : -0.02), 0.64, z + 0.3], mug);
    kitBox(group, [0.34, 0.025, 0.22], [x + (variant ? 0.2 : -0.2), 0.57, z + 0.31],
      folder, [0, variant ? 0.16 : -0.13, 0]);
  }

  function addSheriffEnvironmentKit(map, group) {
    addInteriorShellKit(map, group);
    addKitWindow(group, 3.8, 1.045, 1.35, null);
    addKitWindow(group, 10.7, 1.045, 1.35, null);

    var cork = kitMaterial('sheriff-cork', 0x8b643c, 0.96);
    var darkWood = kitMaterial('sheriff-darkwood', 0x3b291d, 0.88);
    var paper = kitMaterial('sheriff-paper', 0xe6ddc7, 0.92);
    var gold = kitMaterial('sheriff-badge', 0xc39b37, 0.34, 0.42);
    // Right-wall waiting zone: a low, non-colliding floor inlay and wall rail
    // make the furniture read as a room function rather than loose props.
    var waitingRug = kitMaterial('sheriff-waiting-rug', 0x222d32, 0.98);
    var rugEdge = kitMaterial('sheriff-waiting-edge', 0x151d21, 0.94);
    kitBox(group, [2.72, 0.018, 2.52], [11.36, 0.026, 7.16], waitingRug);
    kitBox(group, [2.78, 0.024, 0.055], [11.36, 0.034, 5.88], rugEdge);
    kitBox(group, [2.78, 0.024, 0.055], [11.36, 0.034, 8.44], rugEdge);
    kitBox(group, [0.055, 0.024, 2.5], [9.98, 0.034, 7.16], rugEdge);
    kitBox(group, [0.055, 0.024, 2.5], [12.74, 0.034, 7.16], rugEdge);
    kitBox(group, [0.07, 0.08, 2.8], [12.94, 1.0, 7.12], darkWood);
    kitBox(group, [0.075, 1.05, 0.075], [12.94, 0.54, 5.72], darkWood);
    kitBox(group, [0.075, 1.05, 0.075], [12.94, 0.54, 8.52], darkWood);

    kitBox(group, [2.2, 0.74, 0.07], [7.1, 1.43, 1.08], darkWood);
    kitBox(group, [2.04, 0.6, 0.075], [7.1, 1.43, 1.12], cork);
    [[6.55, 1.56], [7.02, 1.31], [7.56, 1.52]].forEach(function (p, i) {
      kitBox(group, [0.34 + i * 0.04, 0.22, 0.025], [p[0], p[1], 1.165], paper,
        [0, 0, (i - 1) * 0.05]);
    });
    var badge = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), gold);
    badge.position.set(7.1, 1.42, 1.23);
    badge.scale.set(0.78, 1, 0.16);
    badge.rotation.z = Math.PI / 4;
    group.add(badge);

    addDeskSet(group, 2.9, 2.45, 0);
    addDeskSet(group, 9.1, 2.45, 1);
    var folders = kitMaterial('sheriff-folder', 0x6f3e2d, 0.92);
    [3.35, 4.45, 5.55].forEach(function (x, i) {
      kitBox(group, [0.48, 0.035 + i * 0.012, 0.31], [x, 0.59 + i * 0.008, 5.46], folders,
        [0, (i - 1) * 0.07, 0]);
    });
  }

  function addPalmerEnvironmentKit(map, group) {
    addInteriorShellKit(map, group);
    addKitWindow(group, 3.6, 1.045, 1.55, 0x8b5860);
    addKitWindow(group, 12.4, 1.045, 1.55, 0x8b5860);

    var cream = kitMaterial('palmer-mantle', 0xd8c4a2, 0.86);
    var brick = kitMaterial('palmer-brick', 0x805241, 0.94);
    var soot = kitMaterial('palmer-soot', 0x1e1b1a, 0.98);
    var brass = kitMaterial('palmer-brass', 0xc49a58, 0.32, 0.38);
    // Camino interamente addossato alla cella muro ovest: massa, nicchia e
    // mensola danno al soggiorno un landmark domestico senza bloccare il path.
    kitBox(group, [0.22, 1.22, 1.7], [1.03, 0.61, 7.45], brick);
    kitBox(group, [0.055, 0.62, 0.92], [1.16, 0.42, 7.45], soot);
    kitBox(group, [0.32, 0.13, 1.96], [1.1, 1.18, 7.45], cream);
    kitBox(group, [0.5, 0.055, 2.06], [1.38, 0.036, 7.45], soot);
    kitCylinder(group, 0.08, 0.11, 0.24, 9, [1.22, 1.38, 7.18], brass);
    kitCylinder(group, 0.08, 0.11, 0.24, 9, [1.22, 1.38, 7.72], brass);

    var firewood = kitMaterial('palmer-firewood', 0x4b2c1c, 0.96);
    var ember = kitMaterial('palmer-ember', 0x4f130b, 0.74, 0, 0xff5a24);
    [-0.22, 0, 0.22].forEach(function (offset, index) {
      kitCylinder(group, 0.07, 0.08, 0.68, 7,
        [1.2, 0.24 + index * 0.025, 7.45 + offset], firewood,
        [Math.PI / 2, index * 0.13, 0]);
    });
    [[7.23, 0.3], [7.46, 0.23], [7.68, 0.28]].forEach(function (emberSpec, index) {
      var coal = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.09 + index * 0.012, 0), ember);
      coal.position.set(1.21, emberSpec[1], emberSpec[0]);
      coal.scale.set(0.7, 0.55, 1);
      group.add(coal);
    });

    var frame = kitMaterial('palmer-frame', 0x8a6a48, 0.72);
    var portrait = kitMaterial('palmer-portrait', 0x516477, 0.68);
    // A narrow wood inlay frames the existing carpet without adding another
    // competing rug or changing walkability.
    var carpetEdge = kitMaterial('palmer-carpet-edge', 0x38271d, 0.94);
    kitBox(group, [5.08, 0.022, 0.055], [8.5, 0.03, 5.98], carpetEdge);
    kitBox(group, [5.08, 0.022, 0.055], [8.5, 0.03, 9.02], carpetEdge);
    kitBox(group, [0.055, 0.022, 3.0], [5.98, 0.03, 7.5], carpetEdge);
    kitBox(group, [0.055, 0.022, 3.0], [11.02, 0.03, 7.5], carpetEdge);
    [8.0, 10.15, 12.3].forEach(function (x, i) {
      kitBox(group, [0.74, 0.56, 0.06], [x, 1.34 + (i % 2) * 0.12, 5.06], frame);
      kitBox(group, [0.62, 0.44, 0.065], [x, 1.34 + (i % 2) * 0.12, 5.095], portrait);
    });

    var clockDark = kitMaterial('palmer-clock-dark', 0x3b2b24, 0.82);
    var clockFace = kitMaterial('palmer-clock-face', 0xe3d7ba, 0.68);
    kitBox(group, [0.42, 0.42, 0.11], [1.23, 1.52, 7.45], clockDark);
    var clock = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.025, 16), clockFace);
    clock.rotation.z = Math.PI / 2;
    clock.position.set(1.31, 1.52, 7.45);
    group.add(clock);

    // Natura morta sul tavolo già solido (tile t): libri + vaso, mai sul path.
    var book = kitMaterial('palmer-book', 0x6f3540, 0.92);
    var leaf = kitMaterial('palmer-leaf', 0x365b39, 0.92);
    kitBox(group, [0.36, 0.045, 0.24], [3.42, 0.5, 6.45], book, [0, 0.12, 0]);
    kitCylinder(group, 0.07, 0.1, 0.24, 9, [3.7, 0.58, 6.53], cream);
    kitCylinder(group, 0.025, 0.025, 0.3, 6, [3.7, 0.83, 6.53], leaf, [0, 0, -0.15]);
  }

  function addAuthoredEnvironmentKit(map, scene) {
    if (map.id !== 'sheriff' && map.id !== 'palmer') return;
    var group = new THREE.Group();
    group.name = 'authored-environment-' + map.id;
    if (map.id === 'sheriff') addSheriffEnvironmentKit(map, group);
    else addPalmerEnvironmentKit(map, group);
    markKitShadows(group);
    scene.add(group);
  }

  /* ---------------- authored GLB architecture layer ----------------
   * ASCII rectangles and doors remain the sole collision/interaction source.
   * A procedural layer is always available while the GLB loads or fails. The
   * complete six-root candidate is assembled before that layer is exchanged,
   * preventing both double rendering and one-frame holes. */

  function authoredArchitectureUrl() {
    var relative = 'assets/models/twin-peaks-architecture-slice.glb';
    if (window.location && /\/test\//.test(window.location.pathname)) {
      relative = '../' + relative;
    }
    try {
      return new URL(relative, document.baseURI).href;
    } catch (e) {
      return relative;
    }
  }

  function clearArchitectureSmoke(world) {
    if (!world || !world.smokes) return;
    for (var i = 0; i < world.smokes.length; i++) {
      var sprite = world.smokes[i].s;
      if (sprite && sprite.parent) sprite.parent.remove(sprite);
      if (sprite && sprite.material && sprite.material.dispose) {
        sprite.material.dispose();
      }
    }
    world.smokes.length = 0;
  }

  function addArchitectureSmoke(world, parent, x, y, z, phase) {
    for (var pi = 0; pi < 3; pi++) {
      var pmat = new THREE.SpriteMaterial({
        map: smokeTexture(), transparent: true, opacity: 0, depthWrite: false
      });
      var puff = new THREE.Sprite(pmat);
      puff.position.set(x, y, z);
      parent.add(puff);
      world.smokes.push({
        s: puff, x: x, y: y, z: z,
        ph: pi / 3 + phase
      });
    }
  }

  function disposeProceduralArchitectureGeometry(layer) {
    if (!layer || !layer.traverse) return;
    layer.traverse(function (o) {
      // Materials and CanvasTextures are shared through the building caches;
      // only per-building geometry is owned by this replaceable layer.
      if (o.isMesh && o.geometry && o.geometry.dispose) o.geometry.dispose();
    });
  }

  function removeArchitectureLayer(world) {
    if (!world || !world.architectureLayer) return;
    var old = world.architectureLayer;
    if (old.parent) old.parent.remove(old);
    if (world.architectureLayerState === 'procedural-fallback') {
      disposeProceduralArchitectureGeometry(old);
    }
    clearArchitectureSmoke(world);
    world.architectureLayer = null;
    world.architectureLayerState = null;
    world.architectureCount = 0;
  }

  function addProceduralArchitectureLayer(world, map) {
    if (!world || world.architectureLayer) return;
    var buildings = scanBuildings(map);
    if (!buildings.length) {
      world.architectureLayerState = 'not-used';
      return;
    }
    var group = new THREE.Group();
    group.name = 'procedural-architecture-' + map.id;
    for (var i = 0; i < buildings.length; i++) {
      var rc = buildings[i];
      group.add(buildingGroup(rc));
      if (map.id === 'town' && rc.ch !== '2' && rc.ch !== '5') {
        var chm = addChimney(rc, group);
        addArchitectureSmoke(
          world, group, chm.x, chm.y, chm.z, (rc.bx % 7) * 0.11);
      }
    }
    world.scene.add(group);
    world.architectureLayer = group;
    world.architectureLayerState = 'procedural-fallback';
    world.architectureCount = buildings.length;
  }

  function cloneArchitectureMaterial(material, wet, season) {
    if (!material || !material.clone) return material;
    var tuned = material.clone();
    var name = tuned.name || '';
    var isRoof = /_Roof$/i.test(name);
    var isTrim = /_Trim$/i.test(name);
    var isAccent = /_Accent$/i.test(name);
    var isWall = /_Wall$/i.test(name);
    if ((isRoof || isWall) && !tuned.map) {
      tuned.map = architectureSurfaceTexture(name, isRoof ? 'roof' : 'wall');
    }

    // One PBR policy across all six roots: roofs carry rain sheen, walls stay
    // readable and diffuse, metal/glass accents keep a tighter highlight.
    if (isRoof) {
      tuned.roughness = wet ? 0.3 : Math.max(0.58, tuned.roughness || 0);
      tuned.metalness = Math.min(0.24, tuned.metalness || 0);
      tuned.envMapIntensity = wet ? 1.05 : 0.72;
      if (tuned.isMeshPhysicalMaterial) {
        tuned.clearcoat = wet ? 0.68 : 0.16;
        tuned.clearcoatRoughness = wet ? 0.2 : 0.5;
      }
    } else if (isTrim) {
      tuned.roughness = wet ? 0.48 : 0.64;
      tuned.envMapIntensity = wet ? 0.82 : 0.58;
      if (tuned.isMeshPhysicalMaterial) {
        tuned.clearcoat = wet ? 0.28 : 0.08;
        tuned.clearcoatRoughness = 0.38;
      }
    } else if (isAccent) {
      tuned.roughness = wet ? 0.34 : 0.48;
      tuned.envMapIntensity = wet ? 0.96 : 0.76;
      if (tuned.isMeshPhysicalMaterial) {
        tuned.clearcoat = wet ? 0.36 : 0.14;
        tuned.clearcoatRoughness = 0.28;
      }
    } else if (isWall) {
      tuned.roughness = wet ? 0.7 : 0.78;
      tuned.envMapIntensity = wet ? 0.56 : 0.42;
      if (tuned.isMeshPhysicalMaterial) {
        tuned.clearcoat = wet ? 0.1 : 0.03;
        tuned.clearcoatRoughness = 0.62;
      }
    }
    // Autumn desaturates broad painted/timber masses very slightly without
    // repainting identity accents. Seasonal terrain remains the dominant cue.
    if (season === 'autumn' && (isWall || isRoof) && tuned.color) {
      var hsl = { h: 0, s: 0, l: 0 };
      tuned.color.getHSL(hsl);
      tuned.color.setHSL(hsl.h, hsl.s * 0.92, hsl.l * 0.98);
    }
    tuned.dithering = true;
    tuned.needsUpdate = true;
    return tuned;
  }

  function architectureSurfaceTexture(materialName, role) {
    var key = materialName + ':' + role;
    if (architectureTextureCache[key]) return architectureTextureCache[key];
    var building = materialName.replace(/^TP_ARCH_MAT_/, '')
      .replace(/_(Roof|Wall)$/, '');
    var authoredShingleProfile = {
      GreatNorthern: '4',
      Palmer: '3',
      Roadhouse: '6'
    }[building];
    if (role === 'roof' && authoredShingleProfile && BPAL[authoredShingleProfile]) {
      // Reuse the proven world shingle vocabulary, but clone it so authored UV
      // scale cannot mutate the procedural control texture.  This also keeps
      // both paths in the same art direction rather than inventing a second,
      // coarser roof language just for imported meshes.
      var sharedShingles = shingleTexture(BPAL[authoredShingleProfile]);
      var authoredShingles = sharedShingles.clone();
      authoredShingles.name = 'architecture-shingles-' + building;
      authoredShingles.wrapS = THREE.RepeatWrapping;
      authoredShingles.wrapT = THREE.RepeatWrapping;
      authoredShingles.repeat.set(9, 8);
      authoredShingles.needsUpdate = true;
      architectureTextureCache[key] = authoredShingles;
      return authoredShingles;
    }
    var cv = document.createElement('canvas');
    cv.width = 128;
    cv.height = 128;
    var c = cv.getContext('2d');
    c.fillStyle = '#f3f2ed';
    c.fillRect(0, 0, 128, 128);
    c.lineWidth = 1;

    if (role === 'roof') {
      if (building === 'DoubleR' || building === 'Hospital') {
        // Long standing seams with restrained cross flashing: readable under
        // mipmaps, never a dense high-frequency comb.
        for (var mx = 0; mx < 128; mx += 18) {
          c.fillStyle = mx % 36 ? '#dedfda' : '#cdd2d0';
          c.fillRect(mx, 0, 2, 128);
          c.fillStyle = 'rgba(255,255,255,0.42)';
          c.fillRect(mx + 2, 0, 1, 128);
        }
        c.fillStyle = 'rgba(112,122,124,0.14)';
        c.fillRect(0, 62, 128, 2);
      } else if (building === 'Roadhouse' ||
                 building === 'GreatNorthern' ||
                 building === 'Palmer') {
        // Deliberate broad cedar/slate courses.  The authored hip roofs cover
        // more screen area than the procedural roofs, so the old low-contrast
        // pattern vanished under mipmapping and made them look like flat slabs.
        // These 16px courses remain stable in motion while exposing pitch.
        var targetCourse = building === 'Roadhouse' ? 16 : 18;
        c.fillStyle = building === 'Roadhouse' ? '#ddd8d1' : '#eeeae2';
        c.fillRect(0, 0, 128, 128);
        for (var targetY = 0; targetY < 128; targetY += targetCourse) {
          c.fillStyle = targetY % (targetCourse * 2)
            ? (building === 'Roadhouse' ? '#cbc3ba' : '#ddd8ce')
            : (building === 'Roadhouse' ? '#e4dfd8' : '#f2eee7');
          c.fillRect(0, targetY, 128, targetCourse);
          c.fillStyle = building === 'Roadhouse'
            ? 'rgba(48,39,34,0.68)' : 'rgba(57,52,43,0.56)';
          c.fillRect(0, targetY + targetCourse - 3, 128, 3);
          var targetOffset = (targetY / targetCourse) % 2
            ? targetCourse * 0.62 : 0;
          for (var targetX = targetOffset; targetX < 128;
               targetX += targetCourse * 1.35) {
            c.fillStyle = building === 'Roadhouse'
              ? 'rgba(42,34,30,0.58)' : 'rgba(62,55,44,0.46)';
            c.fillRect(targetX, targetY + 2, 2, targetCourse - 6);
          }
          c.fillStyle = 'rgba(255,255,255,0.24)';
          c.fillRect(0, targetY + 1, 128, 1);
        }
      } else {
        // Broad staggered courses for slate/cedar/shakes. Course size is kept
        // deliberately large to survive the fixed-camera temporal shimmer gate.
        var courseH = building === 'Sheriff' ? 16 : 18;
        for (var sy = 0; sy < 128; sy += courseH) {
          c.fillStyle = sy % (courseH * 2) ? '#e5e3dc' : '#efeee9';
          c.fillRect(0, sy, 128, courseH);
          c.fillStyle = building === 'Sheriff' || building === 'Palmer'
            ? 'rgba(66,65,61,0.34)' : 'rgba(82,82,77,0.22)';
          c.fillRect(0, sy + courseH - 2, 128, 2);
          var offset = (sy / courseH) % 2 ? 11 : 0;
          for (var sx = offset; sx < 128; sx += 22) {
            c.fillStyle = building === 'Sheriff' || building === 'Palmer'
              ? 'rgba(76,72,65,0.24)' : 'rgba(95,91,82,0.16)';
            c.fillRect(sx, sy + 2, 1, courseH - 5);
          }
        }
      }
    } else if (building === 'Sheriff' || building === 'DoubleR') {
      // Large brick modules; low contrast keeps the facade from reading as a
      // procedural checkerboard at the 38-degree shipped camera.
      for (var by = 0; by < 128; by += 18) {
        c.fillStyle = by % 36 ? '#e9e5dd' : '#f1eee8';
        c.fillRect(0, by, 128, 18);
        c.fillStyle = 'rgba(88,78,68,0.18)';
        c.fillRect(0, by + 16, 128, 2);
        var brickOffset = by % 36 ? 16 : 0;
        for (var bx = brickOffset; bx < 128; bx += 32) {
          c.fillStyle = 'rgba(88,78,68,0.14)';
          c.fillRect(bx, by, 1, 16);
        }
      }
    } else if (building === 'Hospital') {
      c.fillStyle = '#f1f1ed';
      c.fillRect(0, 0, 128, 128);
      for (var stipple = 0; stipple < 38; stipple++) {
        var px = (stipple * 47 + 13) % 128;
        var py = (stipple * 71 + 29) % 128;
        c.fillStyle = stipple % 2
          ? 'rgba(126,134,134,0.12)' : 'rgba(255,255,255,0.22)';
        c.fillRect(px, py, 3 + stipple % 4, 2);
      }
    } else {
      var vertical = building === 'Roadhouse';
      c.fillStyle = '#efece5';
      c.fillRect(0, 0, 128, 128);
      for (var board = 0; board < 128; board += 18) {
        c.fillStyle = building === 'GreatNorthern' ||
          building === 'Palmer' || building === 'Roadhouse'
          ? 'rgba(68,59,49,0.34)' : 'rgba(78,70,61,0.18)';
        if (vertical) c.fillRect(board, 0, 2, 128);
        else c.fillRect(0, board, 128, 2);
        c.fillStyle = 'rgba(255,255,255,0.18)';
        if (vertical) c.fillRect(board + 2, 0, 1, 128);
        else c.fillRect(0, board + 2, 128, 1);
      }
    }
    var texture = makeSurfaceTex(cv);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(role === 'roof' ? 2.5 : 2, role === 'roof' ? 2 : 1.5);
    architectureTextureCache[key] = texture;
    return texture;
  }

  function architectureIdentitySign(rootName) {
    var signs = {
      TP_BUILD_Sheriff: ['SHERIFF', 0, 1.31, 1.448, 1.34, 0.25, '#f3d58d'],
      TP_BUILD_DoubleR: ['DOUBLE R DINER', 0, 1.73, 1.448, 1.88, 0.34, '#fff0bc'],
      TP_BUILD_Palmer: ['PALMER', 1.2, 0.48, 1.448, 0.78, 0.17, '#d8c9a8'],
      TP_BUILD_GreatNorthern: ['GREAT NORTHERN', 0, 1.54, 1.448, 2.05, 0.27, '#f1d39a'],
      TP_BUILD_Hospital: ['CALHOUN MEMORIAL', -1.15, 1.42, 1.448, 1.58, 0.23, '#a62932'],
      TP_BUILD_Roadhouse: ['ROADHOUSE', -0.5, 1.58, 1.448, 1.66, 0.28, '#ff7981']
    };
    var spec = signs[rootName];
    if (!spec) return null;
    var key = 'architecture-sign:' + rootName;
    var texture = architectureTextureCache[key];
    if (!texture) {
      var cv = document.createElement('canvas');
      cv.width = 512;
      cv.height = 96;
      var c = cv.getContext('2d');
      c.clearRect(0, 0, 512, 96);
      c.fillStyle = spec[6];
      c.font = '700 46px Georgia, serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.shadowColor = 'rgba(10,8,6,0.72)';
      c.shadowBlur = 4;
      c.fillText(spec[0], 256, 49);
      texture = makeSurfaceTex(cv);
      architectureTextureCache[key] = texture;
    }
    var plane = new THREE.Mesh(
      new THREE.PlaneGeometry(spec[4], spec[5]),
      new THREE.MeshBasicMaterial({
        map: texture, transparent: true, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -2,
        polygonOffsetUnits: -2, toneMapped: false
      })
    );
    plane.name = rootName + '-identity-lettering';
    plane.position.set(spec[1], spec[2], spec[3]);
    plane.renderOrder = 5;
    return plane;
  }

  function prepareArchitectureInstance(source, world, rootName) {
    var instance = source.clone(true);
    instance.position.set(0, 0, 0);
    instance.quaternion.identity();
    instance.scale.set(1, 1, 1);
    instance.updateMatrix();
    var style = world.terrainStyle || { season: 'summer', wet: false };
    var copies = {};
    instance.traverse(function (o) {
      if (!o.isMesh || !o.material) return;
      o.castShadow = true;
      o.receiveShadow = true;
      function copy(material) {
        if (!material) return material;
        var key = material.uuid;
        if (!copies[key]) {
          copies[key] = cloneArchitectureMaterial(
            material, !!style.wet, style.season || 'summer');
        }
        return copies[key];
      }
      if (Array.isArray(o.material)) o.material = o.material.map(copy);
      else o.material = copy(o.material);
    });
    var identitySign = architectureIdentitySign(rootName);
    if (identitySign) instance.add(identitySign);
    applyLightingMaterialPolicy(instance);
    return instance;
  }

  function addAuthoredBuildingSmoke(world, parent, rc) {
    // Local coordinates mirror the three authored chimney tops. Blender -Y is
    // game +Z after glTF's Y-up conversion.
    var chimney = {
      '3': [-3.72, 3.0, -0.34],
      '4': [3.55, 3.14, -0.20],
      '6': [2.62, 3.2, -0.24]
    }[rc.ch];
    if (!chimney) return;
    addArchitectureSmoke(
      world, parent,
      rc.bx + rc.bw / 2 + chimney[0],
      chimney[1],
      rc.by + rc.bh / 2 + chimney[2],
      (rc.bx % 7) * 0.11);
  }

  function addLoadedArchitectureLayer(world, map) {
    if (!world || authoredArchitectureAsset.status !== 'ready') return false;
    var buildings = scanBuildings(map);
    if (!buildings.length) return false;
    var group = new THREE.Group();
    group.name = 'authored-architecture-' + map.id;
    var count = 0;

    for (var i = 0; i < buildings.length; i++) {
      var rc = buildings[i];
      var rootName = AUTHORED_ARCHITECTURE_ROOTS[rc.ch];
      var source = authoredArchitectureAsset.roots[rootName];
      var expected = AUTHORED_ARCHITECTURE_FOOTPRINTS[rootName];
      if (!source || !expected || rc.bw !== expected[0] || rc.bh !== expected[1]) {
        return false;
      }
      var instance = prepareArchitectureInstance(source, world, rootName);
      instance.name = rootName + '-instance';
      instance.position.set(rc.bx + rc.bw / 2, 0, rc.by + rc.bh / 2);
      group.add(instance);
      count++;
    }

    // Build fully first; only then exchange the fallback atomically.
    removeArchitectureLayer(world);
    for (var smokeIndex = 0; smokeIndex < buildings.length; smokeIndex++) {
      addAuthoredBuildingSmoke(world, group, buildings[smokeIndex]);
    }
    world.scene.add(group);
    world.architectureLayer = group;
    world.architectureLayerState = 'glb';
    world.architectureCount = count;
    world.architectureWet = !!(world.terrainStyle && world.terrainStyle.wet);
    world.architectureSeason = world.terrainStyle
      ? world.terrainStyle.season : 'summer';
    return true;
  }

  function applyAuthoredArchitectureLayer(world, map) {
    if (!world) return;
    if (!scanBuildings(map).length) {
      world.architectureLayerState = 'not-used';
      return;
    }
    if (authoredArchitectureEnabled() &&
        authoredArchitectureAsset.status === 'ready' &&
        addLoadedArchitectureLayer(world, map)) return;
    if (!world.architectureLayer) addProceduralArchitectureLayer(world, map);
  }

  function applyAuthoredArchitectureToCachedWorlds() {
    Object.keys(worlds).forEach(function (id) {
      var world = worlds[id];
      if (world && world.map) applyAuthoredArchitectureLayer(world, world.map);
    });
    if (renderer) renderer.shadowMap.needsUpdate = true;
  }

  function validateAuthoredArchitecture(gltf) {
    var roots = {};
    var errors = [];
    var validation = {};
    Object.keys(AUTHORED_ARCHITECTURE_FOOTPRINTS).forEach(function (rootName) {
      var root = gltf.scene.getObjectByName(rootName);
      var expected = AUTHORED_ARCHITECTURE_FOOTPRINTS[rootName];
      if (!root) {
        errors.push('missing ' + rootName);
        return;
      }
      var meta = root.userData || {};
      var footprint = meta.tp_footprint;
      var transformValid =
        root.position.length() < 0.0001 &&
        Math.abs(root.quaternion.x) < 0.0001 &&
        Math.abs(root.quaternion.y) < 0.0001 &&
        Math.abs(root.quaternion.z) < 0.0001 &&
        Math.abs(root.quaternion.w - 1) < 0.0001 &&
        Math.abs(root.scale.x - 1) < 0.0001 &&
        Math.abs(root.scale.y - 1) < 0.0001 &&
        Math.abs(root.scale.z - 1) < 0.0001;
      var contractValid =
        meta.tp_asset_type === 'authored_architecture' &&
        meta.tp_origin === 'footprint_center_floor' &&
        meta.tp_forward === '-Y' &&
        meta.tp_units === 'world_tile' &&
        meta.tp_ascii_collision_authority === true &&
        footprint && footprint.length === 2 &&
        footprint[0] === expected[0] && footprint[1] === expected[1];
      root.updateMatrixWorld(true);
      var bounds = new THREE.Box3().setFromObject(root);
      var size = bounds.getSize(new THREE.Vector3());
      var boundsValid =
        size.x <= expected[0] + 0.01 && size.x >= expected[0] * 0.72 &&
        size.z <= expected[1] + 0.01 && size.z >= expected[1] * 0.72 &&
        size.y >= 1.4 && bounds.min.y >= -0.01;
      validation[rootName] = {
        footprint: [size.x, size.z],
        height: size.y,
        pivot: [bounds.min.x, bounds.min.y, bounds.min.z],
        contract: contractValid,
        transform: transformValid,
        bounds: boundsValid
      };
      if (!contractValid || !transformValid || !boundsValid) {
        errors.push(
          'invalid root contract ' + rootName +
          ' [metadata=' + contractValid +
          ', transform=' + transformValid +
          ', bounds=' + boundsValid +
          ', size=' + size.x.toFixed(3) + 'x' +
            size.z.toFixed(3) + 'x' + size.y.toFixed(3) +
          ', floor=' + bounds.min.y.toFixed(4) + ']'
        );
        return;
      }
      roots[rootName] = root;
    });
    return { roots: roots, errors: errors, validation: validation };
  }

  function failAuthoredArchitecture(error) {
    if (authoredArchitectureAsset.status === 'ready' ||
        authoredArchitectureAsset.status === 'failed') return;
    authoredArchitectureAsset.status = 'failed';
    authoredArchitectureAsset.error = error && error.message
      ? error.message : String(error || 'unknown load failure');
    applyAuthoredArchitectureToCachedWorlds();
    if (window.console && console.warn) {
      console.warn(
        'Twin Peaks authored architecture unavailable; procedural fallback active:',
        authoredArchitectureAsset.error
      );
    }
  }

  function startAuthoredArchitectureLoad() {
    if (authoredArchitectureAsset.status !== 'idle') return;
    if (!authoredArchitectureEnabled()) {
      authoredArchitectureAsset.status = 'disabled';
      applyAuthoredArchitectureToCachedWorlds();
      return;
    }
    if (!THREE.GLTFLoader) {
      failAuthoredArchitecture('THREE.GLTFLoader missing');
      return;
    }
    authoredArchitectureAsset.status = 'loading';
    authoredArchitectureAsset.url = authoredArchitectureUrl();
    var timeout = window.setTimeout(function () {
      if (authoredArchitectureAsset.status === 'loading') {
        failAuthoredArchitecture('GLB load timed out');
      }
    }, 8000);
    new THREE.GLTFLoader().load(
      authoredArchitectureAsset.url,
      function (gltf) {
        if (authoredArchitectureAsset.status !== 'loading') return;
        window.clearTimeout(timeout);
        var result = validateAuthoredArchitecture(gltf);
        if (result.errors.length) {
          failAuthoredArchitecture(result.errors.join(', '));
          return;
        }
        authoredArchitectureAsset.scene = gltf.scene;
        authoredArchitectureAsset.roots = result.roots;
        authoredArchitectureAsset.validation = result.validation;
        authoredArchitectureAsset.status = 'ready';
        applyAuthoredArchitectureToCachedWorlds();
      },
      undefined,
      function (error) {
        window.clearTimeout(timeout);
        failAuthoredArchitecture(error);
      }
    );
  }

  /* ---------------- authored GLB prop layer ---------------- */

  function authoredPropUrl() {
    var relative = 'assets/models/twin-peaks-prop-kit.glb';
    // The permanent screenshot page lives one directory below the game.
    if (window.location && /\/test\//.test(window.location.pathname)) {
      relative = '../' + relative;
    }
    try {
      return new URL(relative, document.baseURI).href;
    } catch (e) {
      return relative;
    }
  }

  function addProceduralPropFallback(world, map) {
    if (world.authoredPropLayerState || !AUTHORED_PROP_PLACEMENTS[map.id]) return;
    var group = new THREE.Group();
    group.name = 'authored-prop-fallback-' + map.id;

    if (map.id === 'sheriff') {
      var cabinet = kitMaterial('fallback-cabinet', 0x294e40, 0.42, 0.34);
      var handle = kitMaterial('fallback-handle', 0x23282a, 0.34, 0.52);
      kitBox(group, [0.5, 1.02, 0.62], [1.45, 0.52, 5.75], cabinet);
      for (var d = 0; d < 4; d++) {
        kitBox(group, [0.035, 0.19, 0.5], [1.72, 0.2 + d * 0.24, 5.75], cabinet);
        kitBox(group, [0.045, 0.035, 0.18], [1.75, 0.23 + d * 0.24, 5.75], handle);
      }
    } else if (map.id === 'palmer') {
      var fabric = kitMaterial('fallback-sofa', 0x286a69, 0.94);
      var wood = kitMaterial('fallback-sofa-leg', 0x4b2b1c, 0.82);
      kitBox(group, [1.48, 0.3, 0.62], [8.15, 0.31, 5.48], fabric);
      kitBox(group, [1.48, 0.68, 0.2], [8.15, 0.7, 5.25], fabric);
      kitBox(group, [0.22, 0.48, 0.64], [7.39, 0.49, 5.48], fabric);
      kitBox(group, [0.22, 0.48, 0.64], [8.91, 0.49, 5.48], fabric);
      kitBox(group, [1.12, 0.05, 0.42], [8.15, 0.12, 5.48], wood);
    }

    markKitShadows(group);
    world.scene.add(group);
    world.authoredPropLayerState = 'procedural-fallback';
    world.authoredPropLayer = group;
    world.authoredPropCount = group.children.length;
  }

  function addLoadedPropLayer(world, map) {
    if (world.authoredPropLayerState || authoredPropAsset.status !== 'ready') return;
    var placements = AUTHORED_PROP_PLACEMENTS[map.id];
    if (!placements) return;
    var group = new THREE.Group();
    group.name = 'authored-props-' + map.id;
    var count = 0;

    for (var i = 0; i < placements.length; i++) {
      var spec = placements[i];
      var source = authoredPropAsset.roots[spec.root];
      if (!source) continue;

      // Blender stores the props as a gallery. The reusable EMPTY root is
      // cloned, stripped of that gallery transform, then wrapped by an
      // instance transform expressed in game-world metres/tiles.
      var instance = source.clone(true);
      instance.name = spec.root + '-instance-' + i;
      instance.position.set(0, 0, 0);
      instance.quaternion.identity();
      instance.scale.set(1, 1, 1);
      instance.updateMatrix();
      instance.traverse(function (o) {
        if (!o.isMesh) return;
        o.castShadow = true;
        o.receiveShadow = true;
      });
      applyLightingMaterialPolicy(instance);

      var anchor = new THREE.Group();
      anchor.name = 'prop-anchor-' + map.id + '-' + i;
      anchor.position.set(spec.x, 0, spec.z);
      anchor.rotation.y = spec.ry || 0;
      anchor.scale.setScalar(spec.scale || 1);
      anchor.add(instance);
      group.add(anchor);
      count++;
    }

    if (!count) {
      addProceduralPropFallback(world, map);
      return;
    }
    world.scene.add(group);
    world.authoredPropLayerState = 'glb';
    world.authoredPropLayer = group;
    world.authoredPropCount = count;
  }

  function applyAuthoredPropLayer(world, map) {
    if (!world || world.authoredPropLayerState) return;
    if (authoredPropAsset.status === 'ready') addLoadedPropLayer(world, map);
    else if (authoredPropAsset.status === 'failed') addProceduralPropFallback(world, map);
  }

  function applyAuthoredPropsToCachedWorlds() {
    Object.keys(worlds).forEach(function (id) {
      var world = worlds[id];
      if (world && world.map) applyAuthoredPropLayer(world, world.map);
    });
  }

  function failAuthoredPropAsset(error) {
    if (authoredPropAsset.status === 'ready' || authoredPropAsset.status === 'failed') return;
    authoredPropAsset.status = 'failed';
    authoredPropAsset.error = error && error.message ? error.message : String(error || 'unknown load failure');
    applyAuthoredPropsToCachedWorlds();
    if (window.console && console.warn) {
      console.warn('Twin Peaks authored prop kit unavailable; procedural fallback active:', authoredPropAsset.error);
    }
  }

  function startAuthoredPropAssetLoad() {
    if (authoredPropAsset.status !== 'idle') return;
    if (!THREE.GLTFLoader) {
      failAuthoredPropAsset('THREE.GLTFLoader missing');
      return;
    }

    authoredPropAsset.status = 'loading';
    authoredPropAsset.url = authoredPropUrl();
    var timeout = window.setTimeout(function () {
      if (authoredPropAsset.status === 'loading') {
        failAuthoredPropAsset('GLB load timed out');
      }
    }, 8000);

    new THREE.GLTFLoader().load(
      authoredPropAsset.url,
      function (gltf) {
        if (authoredPropAsset.status !== 'loading') return;
        window.clearTimeout(timeout);
        var roots = {};
        var missing = [];
        Object.keys(AUTHORED_PROP_PLACEMENTS).forEach(function (mapId) {
          AUTHORED_PROP_PLACEMENTS[mapId].forEach(function (spec) {
            if (roots[spec.root]) return;
            var found = gltf.scene.getObjectByName(spec.root);
            if (found) roots[spec.root] = found;
            else missing.push(spec.root);
          });
        });
        if (missing.length) {
          failAuthoredPropAsset('GLB missing roots: ' + missing.join(', '));
          return;
        }
        authoredPropAsset.scene = gltf.scene;
        authoredPropAsset.roots = roots;
        authoredPropAsset.status = 'ready';
        applyAuthoredPropsToCachedWorlds();
      },
      undefined,
      function (error) {
        window.clearTimeout(timeout);
        failAuthoredPropAsset(error);
      }
    );
  }

  /* ---------------- authored welcome-sign biome slice ----------------
   * Safe fallback contract: town's instanced procedural dressing remains
   * visible while this isolated GLB is idle/loading/failed. It is hidden only
   * after every LOD0 root has loaded and an authored layer was assembled. */

  function authoredWelcomeBiomeUrl() {
    var relative = 'assets/models/twin-peaks-welcome-biome.glb';
    if (window.location && /\/test\//.test(window.location.pathname)) {
      relative = '../' + relative;
    }
    try {
      return new URL(relative, document.baseURI).href;
    } catch (e) {
      return relative;
    }
  }

  function applyAuthoredWelcomeBiome(world) {
    if (!world || !world.map || world.map.id !== 'town' || world.welcomeBiomeLayer) return;
    if (authoredWelcomeBiomeAsset.status !== 'ready') {
      world.welcomeBiomeState = authoredWelcomeBiomeAsset.status === 'failed'
        ? 'procedural-fallback' : 'procedural-loading';
      return;
    }

    var group = new THREE.Group();
    group.name = 'authored-welcome-sign-biome';
    world.welcomeBiomeWind = [];
    world.welcomeBiomeWetMaterials = [];
    for (var i = 0; i < AUTHORED_WELCOME_BIOME_PLACEMENTS.length; i++) {
      var spec = AUTHORED_WELCOME_BIOME_PLACEMENTS[i];
      var source = authoredWelcomeBiomeAsset.roots[spec.root];
      if (!source) return;
      var instance = source.clone(true);
      instance.name = spec.root + '-runtime';
      instance.position.set(0, 0, 0);
      instance.quaternion.identity();
      instance.scale.set(1, 1, 1);
      instance.updateMatrix();
      instance.traverse(function (o) {
        if (!o.isMesh) return;
        var sourceMaterialName = o.material ? (o.material.name || '') : '';
        // The authored RainRipple meshes are closed circles. Even when small
        // they read as repeated target decals, so the runtime excludes them
        // completely and lets the broken point/splash impacts carry rainfall.
        if (/RainRipple/.test(sourceMaterialName)) {
          o.visible = false;
          o.castShadow = false;
          o.receiveShadow = false;
          return;
        }
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.material && o.material.isMeshStandardMaterial) {
          var materialName = o.material.name || '';
          o.material = o.material.clone();
          o.material.envMapIntensity = /ShallowWater|Basalt|WetBark/.test(materialName)
            ? 0.78 : Math.min(o.material.envMapIntensity || 1, 0.5);
          if (/Sedge|NativeLeaf/.test(materialName)) {
            world.welcomeBiomeWind.push({
              mesh: o,
              baseX: o.rotation.x,
              baseZ: o.rotation.z,
              phase: world.welcomeBiomeWind.length * 1.73 + i * 0.91
            });
          }
          if (/ShallowWater/.test(materialName)) {
            world.welcomeBiomeWetMaterials.push({
              material: o.material,
              mesh: o,
              baseScale: o.scale.clone(),
              ripple: false,
              phase: world.welcomeBiomeWetMaterials.length * 2.1
            });
          }
        }
      });
      applyLightingMaterialPolicy(instance);
      var anchor = new THREE.Group();
      anchor.name = 'welcome-biome-anchor-' + i;
      anchor.position.set(spec.x, 0, spec.z);
      anchor.rotation.y = spec.ry || 0;
      anchor.scale.setScalar(spec.scale || 1);
      anchor.add(instance);
      group.add(anchor);
    }

    // The procedural instances are the fallback, not a second vegetation
    // layer. Hiding them here prevents density/draw-call stacking.
    (world.dressing || []).forEach(function (mesh) {
      if (mesh) mesh.visible = false;
    });
    world.scene.add(group);
    world.welcomeBiomeLayer = group;
    world.welcomeBiomeState = 'glb-lod0';
    world.welcomeBiomeInstances = AUTHORED_WELCOME_BIOME_PLACEMENTS.length;
  }

  function applyAuthoredWelcomeBiomeToCachedWorlds() {
    Object.keys(worlds).forEach(function (id) {
      applyAuthoredWelcomeBiome(worlds[id]);
    });
  }

  function failAuthoredWelcomeBiome(error) {
    if (authoredWelcomeBiomeAsset.status === 'ready' ||
        authoredWelcomeBiomeAsset.status === 'failed') return;
    authoredWelcomeBiomeAsset.status = 'failed';
    authoredWelcomeBiomeAsset.error = error && error.message
      ? error.message : String(error || 'unknown load failure');
    applyAuthoredWelcomeBiomeToCachedWorlds();
    if (window.console && console.warn) {
      console.warn(
        'Twin Peaks authored welcome biome unavailable; instanced fallback remains active:',
        authoredWelcomeBiomeAsset.error
      );
    }
  }

  function startAuthoredWelcomeBiomeLoad() {
    if (authoredWelcomeBiomeAsset.status !== 'idle') return;
    if (!THREE.GLTFLoader) {
      failAuthoredWelcomeBiome('THREE.GLTFLoader missing');
      return;
    }
    authoredWelcomeBiomeAsset.status = 'loading';
    authoredWelcomeBiomeAsset.url = authoredWelcomeBiomeUrl();
    var timeout = window.setTimeout(function () {
      if (authoredWelcomeBiomeAsset.status === 'loading') {
        failAuthoredWelcomeBiome('GLB load timed out');
      }
    }, 8000);
    new THREE.GLTFLoader().load(
      authoredWelcomeBiomeAsset.url,
      function (gltf) {
        if (authoredWelcomeBiomeAsset.status !== 'loading') return;
        window.clearTimeout(timeout);
        var roots = {};
        var missing = [];
        AUTHORED_WELCOME_BIOME_PLACEMENTS.forEach(function (spec) {
          var found = gltf.scene.getObjectByName(spec.root);
          if (found) roots[spec.root] = found;
          else missing.push(spec.root);
        });
        if (missing.length) {
          failAuthoredWelcomeBiome('GLB missing LOD roots: ' + missing.join(', '));
          return;
        }
        authoredWelcomeBiomeAsset.scene = gltf.scene;
        authoredWelcomeBiomeAsset.roots = roots;
        authoredWelcomeBiomeAsset.status = 'ready';
        applyAuthoredWelcomeBiomeToCachedWorlds();
      },
      undefined,
      function (error) {
        window.clearTimeout(timeout);
        failAuthoredWelcomeBiome(error);
      }
    );
  }

  /* ---------------- authored PNW vegetation slice ----------------
   * Hero species replace only selected procedural corridor trees. Understory
   * remains render-only. Root meshes are converted to InstancedMesh batches,
   * keeping shared GLB geometry/materials and preserving ASCII collision. */

  function authoredVegetationUrl() {
    var relative = 'assets/models/twin-peaks-vegetation-slice.glb?v=' +
      AUTHORED_VEGETATION_HASH.slice(0, 12);
    if (window.location && /\/test\//.test(window.location.pathname)) {
      relative = '../' + relative;
    }
    try {
      return new URL(relative, document.baseURI).href;
    } catch (e) {
      return relative;
    }
  }

  function hideReplacedProceduralVegetation(world, specs) {
    var replaced = 0;
    specs.forEach(function (spec) {
      if (!spec.replace) return;
      var best = null, bestD2 = 0.86 * 0.86;
      var replaceX = spec.replaceX === undefined ? spec.x : spec.replaceX;
      var replaceZ = spec.replaceZ === undefined ? spec.z : spec.replaceZ;
      for (var i = 0; i < world.trees.length; i++) {
        var tree = world.trees[i];
        if (tree.authoredReplaced) continue;
        var dx = tree.x - replaceX, dz = tree.z - replaceZ;
        var d2 = dx * dx + dz * dz;
        if (d2 < bestD2) {
          best = tree;
          bestD2 = d2;
        }
      }
      if (!best) return;
      best.authoredReplaced = true;
      best.group.visible = false;
      if (best.blob) best.blob.visible = false;
      replaced++;
    });
    return replaced;
  }

  function addVegetationRootInstances(group, rootName, source, specs, world) {
    if (!specs.length) return;
    source.updateMatrixWorld(true);
    var rootInverse = source.matrixWorld.clone().invert();
    var placement = new THREE.Matrix4();
    var local = new THREE.Matrix4();
    var combined = new THREE.Matrix4();
    var position = new THREE.Vector3();
    var quaternion = new THREE.Quaternion();
    var scale = new THREE.Vector3();
    var rotation = new THREE.Euler();
    var batches = 0;
    source.traverse(function (mesh) {
      if (!mesh.isMesh || !mesh.geometry || !mesh.material) return;
      mesh.updateMatrixWorld(true);
      local.copy(rootInverse).multiply(mesh.matrixWorld);
      var instanced = new THREE.InstancedMesh(mesh.geometry, mesh.material, specs.length);
      instanced.name = rootName + '-batch-' + batches;
      for (var i = 0; i < specs.length; i++) {
        var spec = specs[i];
        position.set(spec.x, 0, spec.z);
        rotation.set(0, spec.ry || 0, 0);
        quaternion.setFromEuler(rotation);
        scale.setScalar(spec.scale || 1);
        placement.compose(position, quaternion, scale);
        combined.copy(placement).multiply(local);
        instanced.setMatrixAt(i, combined);
      }
      instanced.instanceMatrix.needsUpdate = true;
      instanced.frustumCulled = false;
      instanced.castShadow = specs.some(function (spec) { return !!spec.shadow; });
      instanced.receiveShadow = true;
      applyLightingMaterialPolicy(instanced);
      group.add(instanced);
      batches++;
    });
    world.authoredVegetationBatches += batches;
  }

  function heroVegetationMaterial(material, rootName, spec) {
    if (!material || !material.clone) return material;
    var copy = material.clone();
    var label = (material.name || '').toLowerCase();
    var cedar = rootName.indexOf('Cedar') >= 0;
    var hemlock = rootName.indexOf('Hemlock') >= 0;
    if (copy.color) {
      if (label.indexOf('bark') >= 0) {
        copy.color.set(cedar ? 0x704733 : 0x5b4334);
      } else if (label.indexOf('deadwood') >= 0) {
        copy.color.set(0x89745b);
      } else if (label.indexOf('moss') >= 0) {
        copy.color.set(0x587347);
      } else if (label.indexOf('needle_tip') >= 0 ||
                 label.indexOf('understorylight') >= 0) {
        copy.color.set(cedar ? 0x5f9164 : (hemlock ? 0x56806a : 0x638c59));
      } else if (label.indexOf('needle') >= 0 ||
                 label.indexOf('understory') >= 0) {
        copy.color.set(cedar ? 0x315f45 : (hemlock ? 0x294f43 : 0x28543a));
      }
      var toneSeed = Math.abs(Math.floor(spec.x * 17 + spec.z * 11)) % 5;
      copy.color.offsetHSL(
        (toneSeed - 2) * 0.006, (toneSeed % 2) * -0.012,
        (toneSeed - 2) * 0.008
      );
    }
    if (copy.roughness !== undefined) {
      copy.roughness = Math.min(
        0.98, Math.max(0.76, copy.roughness) +
          (Math.abs(Math.floor(spec.x * 13 + spec.z * 7)) % 3) * 0.035);
    }
    if (copy.metalness !== undefined) copy.metalness = 0;
    if (copy.envMapIntensity !== undefined) copy.envMapIntensity = 0.34;
    copy.visible = true;
    copy.transparent = false;
    copy.opacity = 1;
    copy.alphaTest = 0;
    copy.depthWrite = true;
    copy.side = THREE.DoubleSide;
    copy.dithering = true;
    copy.needsUpdate = true;
    return copy;
  }

  function addVegetationHeroClone(group, source, spec, world) {
    var model = source.clone(true);
    model.name = source.name + '-normalized-model';
    // Blender validation-gallery offsets belong to preview layout, not the
    // runtime asset. Normalize from the clone's actual local bounds so every
    // hero stands on y=0, is centered in X/Z and reaches an explicit height.
    model.position.set(0, 0, 0);
    model.rotation.set(0, 0, 0);
    model.scale.set(1, 1, 1);
    model.updateMatrixWorld(true);
    var bounds = new THREE.Box3().setFromObject(model);
    var center = bounds.getCenter(new THREE.Vector3());
    var height = Math.max(0.001, bounds.max.y - bounds.min.y);
    model.position.set(-center.x, -bounds.min.y, -center.z);

    var hero = new THREE.Group();
    hero.name = source.name + '-hero';
    hero.position.set(spec.x, 0, spec.z);
    hero.rotation.set(0, spec.ry || 0, 0);
    var scale = spec.targetHeight
      ? spec.targetHeight / height
      : (spec.scale || 1);
    hero.scale.setScalar(scale);
    hero.add(model);
    hero.visible = true;
    hero.layers.set(0);
    var vegetationDebug = window.location &&
      new URLSearchParams(window.location.search).get('vegetationDebug') === '1';
    model.traverse(function (object) {
      object.visible = true;
      object.layers.set(0);
      if (!object.isMesh) return;
      object.frustumCulled = false;
      object.castShadow = !!spec.shadow;
      object.receiveShadow = true;
      if (Array.isArray(object.material)) {
        object.material = object.material.map(function (material) {
          return heroVegetationMaterial(material, source.name, spec);
        });
      } else {
        object.material = heroVegetationMaterial(object.material, source.name, spec);
      }
      if (vegetationDebug) {
        object.material = new THREE.MeshBasicMaterial({
          color: 0xff2bd6, side: THREE.DoubleSide, depthTest: true
        });
      }
    });
    applyLightingMaterialPolicy(hero);
    group.add(hero);
    group.updateMatrixWorld(true);
    world.authoredVegetationHeroes++;
    if (!world.authoredVegetationHeroNames) world.authoredVegetationHeroNames = [];
    world.authoredVegetationHeroNames.push(source.name);
    if (!world.authoredVegetationHeroBounds) world.authoredVegetationHeroBounds = [];
    var placedBounds = new THREE.Box3().setFromObject(hero);
    if (vegetationDebug) {
      world.scene.add(new THREE.Box3Helper(placedBounds, 0xff2bd6));
    }
    world.authoredVegetationHeroBounds.push([
      source.name,
      placedBounds.min.x, placedBounds.min.y, placedBounds.min.z,
      placedBounds.max.x, placedBounds.max.y, placedBounds.max.z
    ]);
  }

  function applyAuthoredVegetation(world) {
    if (!world || !world.map || world.authoredVegetationLayer) return;
    var specs = AUTHORED_VEGETATION_PLACEMENTS[world.map.id];
    if (!specs || !specs.length) {
      world.authoredVegetationState = 'not-used';
      return;
    }
    if (!authoredVegetationEnabled()) {
      world.authoredVegetationState = 'qa-procedural-control';
      return;
    }
    if (authoredVegetationAsset.status !== 'ready') {
      world.authoredVegetationState = authoredVegetationAsset.status === 'failed'
        ? 'procedural-fallback' : 'procedural-loading';
      return;
    }
    var group = new THREE.Group();
    group.name = 'authored-pnw-vegetation-' + world.map.id;
    world.authoredVegetationBatches = 0;
    world.authoredVegetationHeroes = 0;
    var byRoot = {};
    specs.forEach(function (spec) {
      if (spec.hero) return;
      if (!byRoot[spec.root]) byRoot[spec.root] = [];
      byRoot[spec.root].push(spec);
    });
    var roots = Object.keys(byRoot);
    for (var i = 0; i < roots.length; i++) {
      var rootName = roots[i];
      var source = authoredVegetationAsset.roots[rootName];
      if (!source) {
        world.authoredVegetationState = 'procedural-fallback';
        return;
      }
      addVegetationRootInstances(group, rootName, source, byRoot[rootName], world);
    }
    specs.forEach(function (spec) {
      if (!spec.hero) return;
      addVegetationHeroClone(
        group, authoredVegetationAsset.roots[spec.root], spec, world);
    });
    world.authoredVegetationReplacements =
      (world.authoredVegetationPreculled || 0) +
      hideReplacedProceduralVegetation(world, specs);
    world.scene.add(group);
    world.authoredVegetationLayer = group;
    world.authoredVegetationState = 'glb-instanced-lod0';
    world.authoredVegetationInstances = specs.length;
  }

  function applyAuthoredVegetationToCachedWorlds() {
    Object.keys(worlds).forEach(function (id) {
      applyAuthoredVegetation(worlds[id]);
    });
  }

  function failAuthoredVegetation(error) {
    if (authoredVegetationAsset.status === 'ready' ||
        authoredVegetationAsset.status === 'failed') return;
    authoredVegetationAsset.status = 'failed';
    authoredVegetationAsset.error = error && error.message
      ? error.message : String(error || 'unknown load failure');
    applyAuthoredVegetationToCachedWorlds();
    if (window.console && console.warn) {
      console.warn(
        'Twin Peaks authored vegetation unavailable; procedural trees remain active:',
        authoredVegetationAsset.error
      );
    }
  }

  function startAuthoredVegetationLoad() {
    if (authoredVegetationAsset.status !== 'idle') return;
    if (!THREE.GLTFLoader) {
      failAuthoredVegetation('THREE.GLTFLoader missing');
      return;
    }
    authoredVegetationAsset.status = 'loading';
    authoredVegetationAsset.url = authoredVegetationUrl();
    var timeout = window.setTimeout(function () {
      if (authoredVegetationAsset.status === 'loading') {
        failAuthoredVegetation('GLB load timed out');
      }
    // A cold SwiftShader/ANGLE shader compile can monopolize the main thread
    // for well over eight seconds even though the local 1 MiB GLB is already
    // fetched. Do not convert that scheduling delay into a false asset failure.
    }, 60000);
    new THREE.GLTFLoader().load(
      authoredVegetationAsset.url,
      function (gltf) {
        if (authoredVegetationAsset.status !== 'loading') return;
        window.clearTimeout(timeout);
        var roots = {};
        var missing = [];
        Object.keys(AUTHORED_VEGETATION_PLACEMENTS).forEach(function (mapId) {
          AUTHORED_VEGETATION_PLACEMENTS[mapId].forEach(function (spec) {
            if (roots[spec.root]) return;
            var found = gltf.scene.getObjectByName(spec.root);
            if (found) roots[spec.root] = found;
            else if (missing.indexOf(spec.root) < 0) missing.push(spec.root);
          });
        });
        if (missing.length) {
          failAuthoredVegetation('GLB missing LOD roots: ' + missing.join(', '));
          return;
        }
        authoredVegetationAsset.scene = gltf.scene;
        authoredVegetationAsset.roots = roots;
        authoredVegetationAsset.status = 'ready';
        applyAuthoredVegetationToCachedWorlds();
      },
      undefined,
      function (error) {
        window.clearTimeout(timeout);
        failAuthoredVegetation(error);
      }
    );
  }

  /* ---------------- authored GLB character registry ---------------- */

  function authoredCharacterUrl() {
    var relative = 'assets/models/twin-peaks-character-pack-rigged.glb';
    if (window.location && /\/test\//.test(window.location.pathname)) {
      relative = '../' + relative;
    }
    try {
      return new URL(relative, document.baseURI).href;
    } catch (e) {
      return relative;
    }
  }

  function stableCharacterPhase(name) {
    var hash = 2166136261;
    name = String(name || 'actor');
    for (var i = 0; i < name.length; i++) {
      hash ^= name.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) % 4800;
  }

  function authoredCharacterCelRamp() {
    if (authoredCharacterAsset.celRamp) return authoredCharacterAsset.celRamp;
    // A soft four-step diffuse response gives the cast the broad, painterly
    // value grouping of a modern stylized RPG without post-process banding.
    var values = new Uint8Array([138, 178, 218, 255]);
    var ramp = new THREE.DataTexture(values, values.length, 1, THREE.LuminanceFormat);
    ramp.name = 'TP character four-band cel ramp';
    ramp.minFilter = THREE.NearestFilter;
    ramp.magFilter = THREE.NearestFilter;
    ramp.generateMipmaps = false;
    ramp.needsUpdate = true;
    authoredCharacterAsset.celRamp = ramp;
    return ramp;
  }

  function stylizedCharacterMaterial(source) {
    if (!source) return source;
    if (authoredCharacterAsset.stylizedMaterials[source.uuid]) {
      return authoredCharacterAsset.stylizedMaterials[source.uuid];
    }
    var label = source.name || '';
    var preservePbr = /_(Eye|Metal|Skin)$/i.test(label);
    var material;
    if (preservePbr) {
      material = source;
      material.dithering = true;
      material.needsUpdate = true;
    } else {
      material = new THREE.MeshToonMaterial({
        name: label,
        color: source.color ? source.color.clone() : new THREE.Color(0xffffff),
        map: source.map || null,
        gradientMap: authoredCharacterCelRamp(),
        emissive: new THREE.Color(0xffffff),
        emissiveMap: source.map || null,
        emissiveIntensity: 0.10,
        transparent: source.transparent,
        opacity: source.opacity,
        alphaTest: source.alphaTest,
        depthWrite: source.depthWrite,
        depthTest: source.depthTest,
        side: source.side,
        vertexColors: source.vertexColors,
        fog: source.fog,
        toneMapped: source.toneMapped,
        dithering: true
      });
      material.userData = Object.assign({}, source.userData || {}, {
        tpRuntimeFinish: 'four-band-cel'
      });
    }
    authoredCharacterAsset.stylizedMaterials[source.uuid] = material;
    return material;
  }

  function applyAuthoredCharacterMaterialStyle(root) {
    if (!root || !root.traverse) return;
    root.traverse(function (node) {
      if (!node.isMesh || !node.material) return;
      if (Array.isArray(node.material)) {
        node.material = node.material.map(stylizedCharacterMaterial);
      } else {
        node.material = stylizedCharacterMaterial(node.material);
      }
    });
  }

  function cloneCharacterBoneTree(sourceRoot) {
    var cloneRoot = sourceRoot.clone(true);
    var sourceNodes = [], cloneNodes = [];
    sourceRoot.traverse(function (node) { sourceNodes.push(node); });
    cloneRoot.traverse(function (node) { cloneNodes.push(node); });
    if (sourceNodes.length !== cloneNodes.length) {
      throw new Error('character bone clone topology mismatch');
    }
    var bySourceUuid = {};
    for (var i = 0; i < sourceNodes.length; i++) {
      bySourceUuid[sourceNodes[i].uuid] = cloneNodes[i];
    }
    return { root: cloneRoot, bySourceUuid: bySourceUuid };
  }

  // Ogni primitiva mantiene gli stessi BufferAttribute/index GPU del GLB,
  // ma riceve un drawRange proprio. Occhi e metalli possono così evitare il
  // shadow pass senza duplicare vertex buffer o aumentare le beauty draw call.
  function characterGeometryView(geometry, group) {
    var start = group ? group.start : geometry.drawRange.start;
    var count = group ? group.count : geometry.drawRange.count;
    var key = geometry.uuid + ':' + start + ':' + count;
    if (authoredCharacterAsset.geometryViews[key]) {
      return authoredCharacterAsset.geometryViews[key];
    }
    var view = new THREE.BufferGeometry();
    view.name = (geometry.name || 'TP_CHAR_Geometry') + '-view-' + start;
    if (geometry.index) view.setIndex(geometry.index);
    Object.keys(geometry.attributes).forEach(function (name) {
      view.setAttribute(name, geometry.attributes[name]);
    });
    view.morphAttributes = geometry.morphAttributes;
    view.morphTargetsRelative = geometry.morphTargetsRelative;
    view.boundingBox = geometry.boundingBox ? geometry.boundingBox.clone() : null;
    view.boundingSphere = geometry.boundingSphere ? geometry.boundingSphere.clone() : null;
    view.setDrawRange(start, count);
    authoredCharacterAsset.geometryViews[key] = view;
    return view;
  }

  function dynamicCharacterMaterials(name, sourceMaterials) {
    var dynamic = name === 'laura' || name === 'giant' || name === 'bob';
    if (!dynamic) return { byUuid: {}, owned: [] };
    var byUuid = {}, owned = [];
    sourceMaterials.forEach(function (source) {
      if (!source || byUuid[source.uuid]) return;
      var material = source.clone();
      material.name = source.name + '-runtime-' + name;
      if (material.color) material.userData.baseActorColor = material.color.clone();
      if (material.emissive) material.userData.baseActorEmissive = material.emissive.clone();
      if (name === 'laura' || name === 'giant') {
        material.transparent = true;
        material.depthWrite = false;
      }
      byUuid[source.uuid] = material;
      owned.push(material);
    });
    return { byUuid: byUuid, owned: owned };
  }

  function materialForCharacter(source, dynamic) {
    return dynamic.byUuid[source.uuid] || source;
  }

  function skinnedCharacterSources(root) {
    var sources = [];
    if (!root) return sources;
    root.traverse(function (node) {
      if (node.isSkinnedMesh) sources.push(node);
    });
    return sources;
  }

  function createCharacterSkinnedParts(source, visual, skeleton, dynamic) {
    var materials = Array.isArray(source.material) ? source.material : [source.material];
    var groups = source.geometry.groups && source.geometry.groups.length
      ? source.geometry.groups
      : [{ start: source.geometry.drawRange.start, count: source.geometry.drawRange.count, materialIndex: 0 }];
    var shareWholeGeometry = !Array.isArray(source.material) &&
      (!source.geometry.groups || source.geometry.groups.length === 0);
    var parts = [];
    for (var i = 0; i < groups.length; i++) {
      var group = groups[i];
      var sourceMaterial = materials[group.materialIndex || 0];
      if (!sourceMaterial) continue;
      var part = new THREE.SkinnedMesh(
        shareWholeGeometry
          ? source.geometry
          : characterGeometryView(source.geometry, group),
        materialForCharacter(sourceMaterial, dynamic)
      );
      part.name = source.name + '-' + (sourceMaterial.name || ('part-' + i));
      part.position.copy(source.position);
      part.quaternion.copy(source.quaternion);
      part.scale.copy(source.scale);
      part.bindMode = source.bindMode;
      part.bind(skeleton, source.bindMatrix.clone());
      // Lo skin si muove dentro bounds più ampi della posa di riposo. Il cast
      // attivo è piccolo; disabilitare il culling evita arti mozzati al bordo.
      part.frustumCulled = false;
      part.receiveShadow = true;
      part.castShadow = !/(Eye|Metal)/i.test(sourceMaterial.name || '');
      visual.add(part);
      parts.push(part);
    }
    return parts;
  }

  function createAuthoredCharacter(name, role) {
    var rootName = AUTHORED_CHARACTER_ROOTS[name];
    var source = rootName && authoredCharacterAsset.roots[rootName];
    if (!source || authoredCharacterAsset.status !== 'ready') return null;
    try {
      // GLTFLoader r147 represents a multi-primitive glTF mesh as a named
      // Group containing one SkinnedMesh per primitive/material.
      var sourceParts = skinnedCharacterSources(source);
      var sourceSkeleton = sourceParts.length ? sourceParts[0].skeleton : null;
      if (!sourceParts.length || !sourceSkeleton ||
          sourceSkeleton.bones.length !== 42 || !authoredCharacterAsset.boneRoot) {
        throw new Error(rootName + ' has incompatible skin');
      }
      var clonedBones = cloneCharacterBoneTree(authoredCharacterAsset.boneRoot);
      var bones = sourceSkeleton.bones.map(function (bone) {
        return clonedBones.bySourceUuid[bone.uuid];
      });
      if (bones.some(function (bone) { return !bone; })) {
        throw new Error(rootName + ' bone remap incomplete');
      }
      var inverses = sourceSkeleton.boneInverses.map(function (inverse) {
        return inverse.clone();
      });
      var skeleton = new THREE.Skeleton(bones, inverses);
      var visual = new THREE.Group();
      visual.name = rootName + '-runtime-rig';
      visual.add(clonedBones.root);

      var sourceMaterials = [];
      sourceParts.forEach(function (part) {
        var materials = Array.isArray(part.material) ? part.material : [part.material];
        sourceMaterials = sourceMaterials.concat(materials);
      });
      var dynamic = dynamicCharacterMaterials(name, sourceMaterials);
      var parts = [];
      sourceParts.forEach(function (part) {
        parts = parts.concat(createCharacterSkinnedParts(
          part, visual, skeleton, dynamic));
      });
      if (!parts.length) throw new Error(rootName + ' has no renderable primitives');

      var mixer = new THREE.AnimationMixer(visual);
      var actions = {};
      AUTHORED_CHARACTER_CLIPS.forEach(function (clipName) {
        var clip = authoredCharacterAsset.clips[clipName];
        var action = mixer.clipAction(clip);
        action.enabled = true;
        action.clampWhenFinished = false;
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.setEffectiveWeight(0);
        action.play();
        action.paused = true;
        actions[clipName] = action;
      });

      var actor = new THREE.Group();
      actor.name = 'authored-character-' + name;
      actor.userData.actorName = name;
      actor.userData.actorRole = role || 'npc';
      actor.userData.authoredRigged = true;
      actor.userData.visual = visual;
      actor.userData.skeleton = skeleton;
      actor.userData.mixer = mixer;
      actor.userData.actions = actions;
      actor.userData.skinnedParts = parts;
      actor.userData.bonesByName = {};
      actor.userData.bindQuaternions = {};
      actor.userData.bindPositions = {};
      bones.forEach(function (bone) {
        actor.userData.bonesByName[bone.name] = bone;
        actor.userData.bindQuaternions[bone.name] = bone.quaternion.clone();
        actor.userData.bindPositions[bone.name] = bone.position.clone();
      });
      AUTHORED_CHARACTER_DOTTED_BONES.forEach(function (authoredName) {
        var runtimeName = THREE.PropertyBinding.sanitizeNodeName(authoredName);
        var runtimeBone = actor.userData.bonesByName[runtimeName];
        if (!runtimeBone) return;
        actor.userData.bonesByName[authoredName] = runtimeBone;
        actor.userData.bindQuaternions[authoredName] =
          actor.userData.bindQuaternions[runtimeName];
        actor.userData.bindPositions[authoredName] =
          actor.userData.bindPositions[runtimeName];
      });
      actor.userData.contextPropParts = parts.filter(function (part) {
        return part.material && /TP_CHAR_SHARED_Prop/i.test(part.material.name || '');
      });
      actor.userData.contextPropParts.forEach(function (part) {
        part.visible = false;
      });
      actor.userData.dynamicMaterials = dynamic.owned;
      actor.userData.motionPhase = stableCharacterPhase(name);
      actor.userData.walkPhaseBase = AUTHORED_CHARACTER_WALK_PHASE_OFFSET;
      actor.userData.walkWasMoving = false;
      actor.userData.lastWalkMoveT = 0;
      actor.userData.lastWalkSampleTime = 0;
      actor.userData.motionStartT = null;
      actor.userData.startCompleted = false;
      actor.userData.stopStartT = null;
      actor.userData.stopSupportSide = 'L';
      actor.userData.desiredYaw = null;
      actor.userData.turnStartT = null;
      actor.userData.turnPoseEnergy = 0;
      actor.userData.turnPivotWeight = 0;
      actor.userData.activeClip = null;
      actor.userData.previousClip = null;
      actor.userData.previousClipTime = 0;
      actor.add(visual);
      var authoredScale = Number(source.userData.tp_runtime_scale) || 1;
      actor.scale.set(
        AUTHORED_CHARACTER_WORLD_SCALE * authoredScale,
        AUTHORED_CHARACTER_HEIGHT_SCALE * authoredScale,
        AUTHORED_CHARACTER_WORLD_SCALE * authoredScale
      );
      if (name === 'laura') setActorOpacity(actor, 0.85);

      authoredCharacterAsset.mixerInstances++;
      authoredCharacterAsset.skeletonInstances++;
      authoredCharacterAsset.ownedMaterialInstances += dynamic.owned.length;
      if (role === 'player') authoredCharacterAsset.playerActive = true;
      else if (role === 'npc') authoredCharacterAsset.npcInstances++;
      return actor;
    } catch (error) {
      authoredCharacterAsset.cloneErrors++;
      if (window.console && console.warn) {
        console.warn('Twin Peaks character clone failed; using procedural fallback:', name, error);
      }
      return null;
    }
  }

  function authoredWalkCycle(moveT, reverse, walkBase) {
    var progress = typeof moveT === 'number' ? Math.max(0, Math.min(1, moveT)) : 0;
    var eased = progress * progress * (3 - 2 * progress);
    // Distance-driven jog: three tiles make one cycle (two steps). This lowers
    // cadence without changing input latency, collision or canonical movement.
    var signedProgress = (reverse ? -eased : eased) *
      AUTHORED_CHARACTER_TILE_PHASE;
    var cycle = (typeof walkBase === 'number'
      ? walkBase : AUTHORED_CHARACTER_WALK_PHASE_OFFSET) + signedProgress;
    return ((cycle % 1) + 1) % 1;
  }

  function actionSampleTime(
    action, clipName, moving, moveT, t, opts, phase, walkBase, data
  ) {
    data = data || {};
    var duration = Math.max(0.001, action.getClip().duration);
    if (clipName === 'TP_grid_walk') {
      return authoredWalkCycle(moveT, opts.reverse, walkBase) * duration;
    }
    var clampedEnd = Math.max(0, duration - 0.00001);
    if (clipName === 'TP_start') {
      return smoothUnit(typeof moveT === 'number' ? moveT : 0) * clampedEnd;
    }
    if (clipName === 'TP_stop') {
      return smoothUnit((t - (data.stopStartT || t)) /
        AUTHORED_CHARACTER_STOP_BLEND_MS) * clampedEnd;
    }
    if (clipName === 'TP_turn90' || clipName === 'TP_turn180') {
      var turnDuration = data.turnDuration ||
        (clipName === 'TP_turn180'
          ? AUTHORED_CHARACTER_TURN_180_MS : AUTHORED_CHARACTER_TURN_90_MS);
      return smoothUnit((t - (data.turnStartT || t)) / turnDuration) *
        clampedEnd;
    }
    return ((t + phase) * 0.001) % duration;
  }

  function walkActionWeight(moveT, wasMoving) {
    var progress = typeof moveT === 'number' ? Math.max(0, Math.min(1, moveT)) : 0;
    if (wasMoving) return 1;
    var start = Math.min(1, progress / AUTHORED_CHARACTER_WALK_START_BLEND);
    return start * start * (3 - 2 * start);
  }

  function smoothUnit(value) {
    var clamped = Math.max(0, Math.min(1, value));
    return clamped * clamped * (3 - 2 * clamped);
  }

  function locomotionStartWeight(data, t) {
    if (data.motionStartT === null) return 1;
    return smoothUnit((t - data.motionStartT) /
      AUTHORED_CHARACTER_START_LOAD_MS);
  }

  function riggedClipFor(actor, moving, t, opts) {
    var data = actor.userData;
    if (opts.dance) return 'TP_mfap_dance';
    if (opts.coffee) return 'TP_cooper_coffee';
    if (opts.menace) return 'TP_bob_menace';
    if (opts.spectral) return 'TP_laura_spectral';
    if (opts.talk) return 'TP_talk_subtle';
    if (opts.inspect) return 'TP_inspect';
    if (typeof data.turnStartT === 'number') {
      return Math.abs(data.turnArc || 0) > Math.PI * 0.72
        ? 'TP_turn180' : 'TP_turn90';
    }
    if (moving && !data.startCompleted) return 'TP_start';
    if (moving) return 'TP_grid_walk';
    if (typeof data.stopStartT === 'number' &&
        t - data.stopStartT < AUTHORED_CHARACTER_STOP_BLEND_MS) {
      return 'TP_stop';
    }
    var blink = authoredCharacterAsset.clips.TP_blink_gaze;
    var blinkWindow = blink ? Math.min(760, blink.duration * 1000) : 0;
    if (((t + actor.userData.motionPhase) % 5200) < blinkWindow) return 'TP_blink_gaze';
    return 'TP_idle';
  }

  function stabilizeRiggedUpperBody(data, moving) {
    if (!moving || data.activeClip !== 'TP_grid_walk') return;
    var bones = data.bonesByName || {};
    var bind = data.bindQuaternions || {};
    // Gambe e bacino conservano tutto il clip. Sguardo e torace assorbono
    // parte della torsione estrema: corsa leggibile, non marionetta oscillante.
    [
      ['head', 0.18],
      ['neck', 0.12],
      ['chest', 0.08],
      ['spine_02', 0.06],
      ['spine_01', 0.04],
      ['clavicle.L', 0.05],
      ['clavicle.R', 0.05]
    ].forEach(function (entry) {
      var bone = bones[entry[0]], rest = bind[entry[0]];
      if (bone && rest) bone.quaternion.slerp(rest, entry[1]);
    });
  }

  function restoreRiggedPolishPose(data) {
    var restore = data.polishRestore;
    if (!restore) return;
    restore.forEach(function (entry) {
      entry.bone.position.copy(entry.position);
      entry.bone.quaternion.copy(entry.quaternion);
      entry.bone.scale.copy(entry.scale);
    });
  }

  function captureRiggedPolishPose(data) {
    var bones = data.skeleton && data.skeleton.bones;
    if (!bones) return;
    if (!data.polishRestore) {
      data.polishRestore = bones.map(function (bone) {
        return {
          bone: bone,
          position: bone.position.clone(),
          quaternion: bone.quaternion.clone(),
          scale: bone.scale.clone()
        };
      });
      return;
    }
    data.polishRestore.forEach(function (entry) {
      entry.position.copy(entry.bone.position);
      entry.quaternion.copy(entry.bone.quaternion);
      entry.scale.copy(entry.bone.scale);
    });
  }

  function applyRiggedLocomotionPolish(data, moving, moveT, t, opts) {
    var visual = data.visual;
    visual.position.set(0, 0, 0);
    visual.rotation.x = 0;
    visual.rotation.z = 0;
    // Every locomotion pose is baked in Blender. This reset is intentionally
    // the only runtime transform: no additive root, pelvis or foot correction.
  }

  function updateRiggedActorPose(actor, moving, moveT, t, opts) {
    var data = actor.userData;
    // Runtime polish is additive. Restore the unpolished mixer result from the
    // previous sample before evaluating this one; clips such as idle omit limb
    // channels, so relying on AnimationMixer alone accumulated knee/ankle edits.
    restoreRiggedPolishPose(data);
    var walkProgress = typeof moveT === 'number'
      ? Math.max(0, Math.min(1, moveT)) : 0;
    var wasMoving = data.walkWasMoving;
    if (moving && !wasMoving) {
      data.motionStartT = t;
      data.startCompleted = false;
      data.stopStartT = null;
    } else if (!moving && wasMoving) {
      data.stopStartT = t;
      data.motionStartT = null;
      var walkAction = data.actions.TP_grid_walk;
      var walkDuration = walkAction
        ? Math.max(0.001, walkAction.getClip().duration) : 1;
      var stopCycle = ((data.lastWalkSampleTime / walkDuration) % 1 + 1) % 1;
      data.stopSupportSide = Math.cos(stopCycle * Math.PI * 2) >= 0
        ? 'L' : 'R';
    }
    if (moving && wasMoving && walkProgress + 0.45 < data.lastWalkMoveT) {
      data.walkPhaseBase = (data.walkPhaseBase +
        (opts.reverse ? -AUTHORED_CHARACTER_TILE_PHASE :
          AUTHORED_CHARACTER_TILE_PHASE) + 1) % 1;
      data.startCompleted = true;
    }
    var clipName = riggedClipFor(actor, moving, t, opts);
    var previousName = data.activeClip;
    if (clipName !== previousName) {
      data.previousClip = previousName;
      data.previousClipTime = previousName && data.actions[previousName]
        ? data.actions[previousName].time : 0;
      data.clipBlendStart = t;
      data.activeClip = clipName;
    }
    Object.keys(data.actions).forEach(function (name) {
      data.actions[name].setEffectiveWeight(0);
    });
    var active = data.actions[clipName];
    active.time = actionSampleTime(
      active, clipName, moving, moveT, t, opts, data.motionPhase,
      data.walkPhaseBase, data);
    var blend = 1;
    if (data.previousClip) {
      blend = Math.max(0, Math.min(1, (t - data.clipBlendStart) / 140));
      blend = blend * blend * (3 - 2 * blend);
      var previous = data.actions[data.previousClip];
      if (previous) {
        var previousIsTransition =
          data.previousClip === 'TP_start' ||
          data.previousClip === 'TP_stop' ||
          data.previousClip === 'TP_turn90' ||
          data.previousClip === 'TP_turn180';
        previous.time = data.previousClip === 'TP_grid_walk'
          ? data.lastWalkSampleTime
          : (previousIsTransition
            ? data.previousClipTime
            : actionSampleTime(
              previous, data.previousClip, false, 0, t, opts,
              data.motionPhase, data.walkPhaseBase, data));
        previous.setEffectiveWeight(1 - blend);
      }
      if (blend >= 0.999) data.previousClip = null;
    }
    if (clipName === 'TP_grid_walk') {
      // Blend solo sul primo appoggio. Quando moveT torna a zero perché il
      // tasto resta premuto, wasMoving mantiene peso 1: nessun hitch per tile.
      var gaitWeight = walkActionWeight(moveT, wasMoving) *
        locomotionStartWeight(data, t);
      var incomingWeight = data.previousClip &&
        data.previousClip !== 'TP_grid_walk' ? blend : 1;
      var idle = data.actions.TP_idle;
      if (idle) {
        idle.time = actionSampleTime(
          idle, 'TP_idle', false, 0, t, opts, data.motionPhase,
          data.walkPhaseBase, data);
        idle.setEffectiveWeight((1 - gaitWeight) * incomingWeight);
      }
      active.setEffectiveWeight(gaitWeight * incomingWeight);
      data.lastWalkSampleTime = active.time;
    } else {
      // Arresto: conserva ultima posa di cammino e la dissolve verso idle.
      // Altri cambi clip mantengono il crossfade storico.
      var stopBlend = data.previousClip === 'TP_grid_walk'
        ? Math.max(0, Math.min(1, (t - data.clipBlendStart) /
          AUTHORED_CHARACTER_STOP_BLEND_MS))
        : blend;
      stopBlend = stopBlend * stopBlend * (3 - 2 * stopBlend);
      active.setEffectiveWeight(stopBlend);
      if (data.previousClip === 'TP_grid_walk') {
        data.actions.TP_grid_walk.setEffectiveWeight(1 - stopBlend);
        if (stopBlend >= 0.999) data.previousClip = null;
      }
    }
    data.mixer.update(0);
    captureRiggedPolishPose(data);
    (data.contextPropParts || []).forEach(function (part) {
      part.visible = !!opts.coffee;
    });
    applyRiggedLocomotionPolish(data, moving, moveT, t, opts);
    data.lastWalkMoveT = moving ? walkProgress : 0;
    data.walkWasMoving = moving;
  }

  function runtimeActor3D(name, role) {
    if (!AUTHORED_CHARACTERS_ENABLED) return actor3D(name);
    var authored = createAuthoredCharacter(name, role);
    return authored || actor3D(name);
  }

  function disposeRuntimeActor(actor) {
    if (!actor) return;
    var data = actor.userData || {};
    if (data.authoredRigged) {
      if (data.mixer) {
        data.mixer.stopAllAction();
        data.mixer.uncacheRoot(data.visual);
      }
      if (data.skeleton && data.skeleton.dispose) data.skeleton.dispose();
      authoredCharacterAsset.mixerInstances = Math.max(0, authoredCharacterAsset.mixerInstances - 1);
      authoredCharacterAsset.skeletonInstances = Math.max(0, authoredCharacterAsset.skeletonInstances - 1);
      if (data.actorRole === 'npc') {
        authoredCharacterAsset.npcInstances = Math.max(0, authoredCharacterAsset.npcInstances - 1);
      } else if (data.actorRole === 'player') {
        authoredCharacterAsset.playerActive = false;
      }
      authoredCharacterAsset.ownedMaterialInstances = Math.max(
        0,
        authoredCharacterAsset.ownedMaterialInstances -
          ((data.dynamicMaterials && data.dynamicMaterials.length) || 0)
      );
    } else if (data.dynamicMaterials) {
      actorDynamicMaterialCount = Math.max(
        0, actorDynamicMaterialCount - data.dynamicMaterials.length);
    }
    if (data.dynamicMaterials) {
      for (var i = 0; i < data.dynamicMaterials.length; i++) {
        data.dynamicMaterials[i].dispose();
      }
      data.dynamicMaterials.length = 0;
    }
  }

  function replaceRuntimeActor(oldActor, replacement) {
    replacement.position.copy(oldActor.position);
    replacement.quaternion.copy(oldActor.quaternion);
    replacement.visible = oldActor.visible;
    replacement.renderOrder = oldActor.renderOrder;
    replacement.layers.mask = oldActor.layers.mask;
    replacement.userData.npc = oldActor.userData.npc;
    replacement.userData.npcId = oldActor.userData.npcId;
    replacement.userData.blob = oldActor.userData.blob;
    var parent = oldActor.parent;
    if (parent) {
      parent.remove(oldActor);
      parent.add(replacement);
    }
    disposeRuntimeActor(oldActor);
    return replacement;
  }

  function replacePlayerWithAuthoredCharacter() {
    if (authoredCharacterAsset.status !== 'ready') return;
    if (!playerActor || playerActor.userData.authoredRigged) {
      if (playerActor && playerActor.userData.authoredRigged) {
        authoredCharacterAsset.playerActive = true;
      }
      return;
    }
    var replacement = createAuthoredCharacter('cooper', 'player');
    if (!replacement) return;
    playerActor = replaceRuntimeActor(playerActor, replacement);
  }

  function replaceWorldNpcWithAuthoredCharacter(world) {
    if (!world || authoredCharacterAsset.status !== 'ready') return;
    for (var i = 0; i < world.npcs.length; i++) {
      var oldActor = world.npcs[i];
      var npc = oldActor.userData.npc;
      if (!npc || oldActor.userData.authoredRigged ||
          !AUTHORED_CHARACTER_ROOTS[npc.sprite]) continue;
      var replacement = createAuthoredCharacter(npc.sprite, 'npc');
      if (!replacement) continue;
      world.npcs[i] = replaceRuntimeActor(oldActor, replacement);
    }
  }

  function applyAuthoredCharactersToRuntime() {
    if (authoredCharacterAsset.status !== 'ready') return;
    replacePlayerWithAuthoredCharacter();
    Object.keys(worlds).forEach(function (id) {
      replaceWorldNpcWithAuthoredCharacter(worlds[id]);
    });
  }

  function npcVisualStage(map, npc) {
    var northSheriff = map.id === 'sheriff' && npc.y <= 1;
    return {
      side: northSheriff ? (npc.x < map.width / 2 ? -0.86 : 0.86) : 0,
      north: northSheriff ? 1.45 : 0
    };
  }

  function addWorldNpcActor(world, npc) {
    var actor = runtimeActor3D(npc.sprite, 'npc');
    var stage = npcVisualStage(world.map, npc);
    actor.position.set(
      npc.x + 0.5 + stage.side, 0.015, npc.y + 1.0 + stage.north);
    actor.userData.npc = npc;
    actor.userData.npcId = npc.id;
    actor.userData.blob = blobShadow(
      world.scene,
      npc.x + 0.5 + stage.side,
      npc.y + 0.95 + stage.north,
      npc.sprite === 'giant' ? 0.42 : 0.32
    );
    world.scene.add(actor);
    return actor;
  }

  function removeWorldNpcActor(world, actor) {
    if (!actor) return;
    var blob = actor.userData.blob;
    if (actor.parent) actor.parent.remove(actor);
    if (blob) {
      if (blob.parent) blob.parent.remove(blob);
      if (blob.material && blob.material !== sharedBlobMaterial() &&
          blob.material.dispose) blob.material.dispose();
    }
    disposeRuntimeActor(actor);
  }

  function npcRosterSignature(npcs) {
    return (npcs || []).map(function (npc) {
      return npc.id + ':' + npc.sprite;
    }).join('|');
  }

  // Le entità narrative possono entrare/uscire da una mappa già cacheata
  // (Ronette, infermiera, Truman, Maddy). L'id, non l'indice, è l'autorità:
  // in questo modo una rimozione non riassegna per errore il corpo successivo.
  function reconcileWorldNpcActors(world, runtimeNpcs, force) {
    if (!world) return;
    runtimeNpcs = runtimeNpcs || [];
    var signature = npcRosterSignature(runtimeNpcs);
    if (!force && signature === world.npcRosterSignature) return;
    var existingById = {};
    for (var i = 0; i < world.npcs.length; i++) {
      var existing = world.npcs[i];
      var existingNpc = existing.userData.npc;
      var existingId = existing.userData.npcId || (existingNpc && existingNpc.id);
      if (existingId) existingById[existingId] = existing;
    }
    var next = [];
    for (var j = 0; j < runtimeNpcs.length; j++) {
      var npc = runtimeNpcs[j];
      var actor = existingById[npc.id];
      if (actor && actor.userData.actorName !== npc.sprite) {
        removeWorldNpcActor(world, actor);
        actor = null;
      }
      if (!actor) actor = addWorldNpcActor(world, npc);
      actor.userData.npc = npc;
      actor.userData.npcId = npc.id;
      next.push(actor);
      delete existingById[npc.id];
    }
    Object.keys(existingById).forEach(function (id) {
      removeWorldNpcActor(world, existingById[id]);
    });
    world.npcs = next;
    world.npcRosterSignature = signature;
  }

  function dialogueActorContext(S) {
    if (!S.dialogue || !S.player) return { npcId: null, speaker: '' };
    var px = S.player.x / TILE + 0.5;
    var pz = S.player.y / TILE + 1.0;
    var nearest = null, nearestD2 = 6.26;
    for (var i = 0; i < S.npcs.length; i++) {
      var npc = S.npcs[i];
      if (!GAME.Engine.npcActive(npc)) continue;
      var dx = npc.vx + 0.5 - px;
      var dz = npc.vy + 1.0 - pz;
      var d2 = dx * dx + dz * dz;
      if (d2 < nearestD2) {
        nearest = npc;
        nearestD2 = d2;
      }
    }
    var page = S.dialogue.pages && S.dialogue.pages[S.dialogue.i];
    return {
      npcId: nearest ? nearest.id : null,
      speaker: page && page.name ? String(page.name).toUpperCase() : ''
    };
  }

  function failAuthoredCharacterAsset(error) {
    if (authoredCharacterAsset.status === 'ready' || authoredCharacterAsset.status === 'failed') return;
    authoredCharacterAsset.status = 'failed';
    authoredCharacterAsset.error = error && error.message
      ? error.message
      : String(error || 'unknown load failure');
    if (window.console && console.warn) {
      console.warn(
        'Twin Peaks authored character pack unavailable; procedural actors remain active:',
        authoredCharacterAsset.error
      );
    }
  }

  function disposeOrphanCharacterGltf(gltf) {
    if (!gltf || !gltf.scene) return;
    var geometries = {}, materials = {};
    gltf.scene.traverse(function (node) {
      if (!node.isMesh) return;
      if (node.geometry) geometries[node.geometry.uuid] = node.geometry;
      var mats = Array.isArray(node.material) ? node.material : [node.material];
      mats.forEach(function (material) {
        if (material) materials[material.uuid] = material;
      });
    });
    Object.keys(geometries).forEach(function (id) { geometries[id].dispose(); });
    Object.keys(materials).forEach(function (id) { materials[id].dispose(); });
  }

  function startAuthoredCharacterAssetLoad() {
    if (authoredCharacterAsset.status !== 'idle') return;
    if (!AUTHORED_CHARACTERS_ENABLED) {
      authoredCharacterAsset.status = 'disabled';
      return;
    }
    if (!THREE.GLTFLoader) {
      failAuthoredCharacterAsset('THREE.GLTFLoader missing');
      return;
    }

    authoredCharacterAsset.status = 'loading';
    authoredCharacterAsset.url = authoredCharacterUrl();
    var timeout = window.setTimeout(function () {
      if (authoredCharacterAsset.status === 'loading') {
        failAuthoredCharacterAsset('GLB load timed out');
      }
    // Il pack completo è 6 MiB e viene decodificato insieme agli altri GLB.
    // SwiftShader può occupare il main thread oltre otto secondi: non
    // trasformare una coda di scheduling in un falso fallimento della risorsa.
    }, 60000);

    new THREE.GLTFLoader().load(
      authoredCharacterAsset.url,
      function (gltf) {
        window.clearTimeout(timeout);
        if (authoredCharacterAsset.status !== 'loading') {
          disposeOrphanCharacterGltf(gltf);
          return;
        }
        var roots = {}, missing = [];
        Object.keys(AUTHORED_CHARACTER_ROOTS).forEach(function (name) {
          var rootName = AUTHORED_CHARACTER_ROOTS[name];
          if (roots[rootName]) return;
          var found = gltf.scene.getObjectByName(rootName);
          var sources = skinnedCharacterSources(found);
          if (found && sources.length && sources[0].skeleton &&
              sources[0].skeleton.bones.length === 42) {
            roots[rootName] = found;
          } else missing.push(rootName);
        });
        var rig = gltf.scene.getObjectByName('TP_CHAR_Rig');
        var boneRoot = gltf.scene.getObjectByName('root');
        var clips = {}, missingClips = [];
        (gltf.animations || []).forEach(function (clip) { clips[clip.name] = clip; });
        AUTHORED_CHARACTER_CLIPS.forEach(function (clipName) {
          if (!clips[clipName]) missingClips.push(clipName);
        });
        if (missing.length || missingClips.length || !rig || !boneRoot || !boneRoot.isBone) {
          var validationError = missing.length
            ? 'GLB missing/incompatible roots: ' + missing.join(', ')
            : (missingClips.length
              ? 'GLB missing clips: ' + missingClips.join(', ')
              : 'GLB missing TP_CHAR_Rig/root bone');
          disposeOrphanCharacterGltf(gltf);
          failAuthoredCharacterAsset(validationError);
          return;
        }
        applyAuthoredCharacterMaterialStyle(gltf.scene);
        applyLightingMaterialPolicy(gltf.scene);
        authoredCharacterAsset.scene = gltf.scene;
        authoredCharacterAsset.roots = roots;
        authoredCharacterAsset.clips = clips;
        authoredCharacterAsset.rig = rig;
        authoredCharacterAsset.boneRoot = boneRoot;
        authoredCharacterAsset.version = gltf.scene.userData.tp_version || null;
        authoredCharacterAsset.status = 'ready';
        applyAuthoredCharactersToRuntime();
      },
      undefined,
      function (error) {
        window.clearTimeout(timeout);
        failAuthoredCharacterAsset(error);
      }
    );
  }

  /* ---------------- landmark 3D ---------------- */

  // tabellone del benvenuto: 512x192 = rapporto 1.6x0.6 del pannello
  function welcomeSignTexture() {
    if (texCache.welcomeboard) return texCache.welcomeboard;
    var cv = document.createElement('canvas');
    cv.width = 512; cv.height = 192;
    var c = cv.getContext('2d');
    c.fillStyle = '#e8e4d8'; c.fillRect(0, 0, 512, 192);
    c.fillStyle = '#6a4520';                                    // cornice intagliata
    c.fillRect(0, 0, 512, 9); c.fillRect(0, 183, 512, 9);
    c.fillRect(0, 0, 9, 192); c.fillRect(503, 0, 9, 192);
    c.fillStyle = '#c8bfa8'; c.fillRect(9, 9, 494, 4);          // ombra interna
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#5a4228';
    c.font = 'bold 30px monospace'; c.fillText('BENVENUTI A', 256, 48);
    c.fillStyle = '#2e5c36';
    c.font = 'bold 62px monospace'; c.fillText('TWIN PEAKS', 256, 104);
    c.fillStyle = '#5a4228';
    c.font = '24px monospace'; c.fillText('Popolazione 51.201', 256, 156);
    texCache.welcomeboard = makeTex(cv);
    return texCache.welcomeboard;
  }

  function landmarkWelcomesign(x, z, scene) {
    var grp = new THREE.Group();
    var postMat = new THREE.MeshLambertMaterial({ color: '#6a4520', flatShading: true });
    var frameMat = new THREE.MeshLambertMaterial({ color: '#8a6a48', flatShading: true });
    var post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.2, 0.18), postMat);
    post.position.set(x - 0.88, 1.1, z);
    post.castShadow = true; post.receiveShadow = true;
    grp.add(post);
    post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.2, 0.18), postMat);
    post.position.set(x + 0.88, 1.1, z);
    post.castShadow = true; post.receiveShadow = true;
    grp.add(post);
    // faccia +z (verso la camera) col testo; le altre restano legno
    var face = new THREE.MeshLambertMaterial({ map: welcomeSignTexture() });
    var board = new THREE.Mesh(
      new THREE.BoxGeometry(2.35, 0.82, 0.14),
      [frameMat, frameMat, frameMat, frameMat, face, frameMat]
    );
    board.position.set(x, 1.72, z + 0.03);
    board.castShadow = true; board.receiveShadow = true;
    grp.add(board);
    var cap = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 0.22), postMat);
    cap.position.set(x, 2.18, z);
    cap.castShadow = true;
    grp.add(cap);

    // Due picchi come corona del landmark: grande massa leggibile prima del
    // testo, coerente col nome e visibile anche a thumbnail.
    var peakMat = new THREE.MeshLambertMaterial({ color: '#244e36', flatShading: true });
    var snowMat = new THREE.MeshLambertMaterial({ color: '#d7ddd3', flatShading: true });
    [-0.42, 0.42].forEach(function (off, i) {
      var peak = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.56, 5), peakMat);
      peak.position.set(x + off, 2.47 + i * 0.04, z - 0.03);
      peak.scale.z = 0.35;
      peak.castShadow = true;
      grp.add(peak);
      var snow = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.18, 5), snowMat);
      snow.position.set(x + off, 2.72 + i * 0.04, z - 0.03);
      snow.scale.z = 0.38;
      grp.add(snow);
    });

    var stoneMat = new THREE.MeshLambertMaterial({ color: '#66716c', flatShading: true });
    [-0.72, -0.42, 0.48, 0.78].forEach(function (off, i) {
      var stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.13 + (i % 2) * 0.04, 0), stoneMat);
      stone.position.set(x + off, 0.11, z + 0.04 + (i % 2) * 0.12);
      stone.scale.y = 0.72;
      stone.castShadow = true;
      grp.add(stone);
    });
    scene.add(grp);
    blobShadow(scene, x, z, 1.05);
    return grp;
  }

  function landmarkTracks(x, z, w, h, scene) {
    var wood = new THREE.MeshLambertMaterial({ color: '#5a4a36', flatShading: true });
    var steel = new THREE.MeshLambertMaterial({ color: '#7a8290', flatShading: true });
    var ballast = new THREE.MeshLambertMaterial({ color: '#4a4a48', flatShading: true });
    var group = new THREE.Group();
    var bed = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, h), ballast);
    bed.position.set(x + w / 2, 0.04, z + h / 2);
    bed.receiveShadow = true;
    group.add(bed);
    var railX = 0.25;
    for (var i = 0; i < h; i += 1.2) {
      var tie = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, 0.35), wood);
      tie.position.set(x + w / 2, 0.08, z + i + 0.6);
      tie.receiveShadow = true;
      group.add(tie);
    }
    var rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, h), steel);
    rail1.position.set(x + railX, 0.16, z + h / 2);
    group.add(rail1);
    var rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, h), steel);
    rail2.position.set(x + w - railX, 0.16, z + h / 2);
    group.add(rail2);
    scene.add(group);
    return group;
  }

  // Cimitero leggibile: file ORDINATE di lapidi e croci rivolte a sud (verso
  // la camera), terreno delimitato da un prato piu' cupo e un recinto in ferro
  // basso con varco a sud. La versione precedente spargeva ~38 blocchetti
  // chiari a caso: sembravano sassi, non tombe.
  // materiali/mesh delle tombe, condivisi: usati dal tile 'G' (lapidi solide
  // piazzate dalla mappa) e dal landmark (prato+recinto)
  var graveStoneMat = null, graveStoneLightMat = null;
  function graveMats() {
    if (!graveStoneMat) {
      graveStoneMat = new THREE.MeshLambertMaterial({ color: '#8a8d88', flatShading: true });
      graveStoneLightMat = new THREE.MeshLambertMaterial({ color: '#a5a8a0', flatShading: true });
    }
  }
  function graveShadows(g) {
    g.traverse(function (m) { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    return g;
  }
  function graveStone(px, pz) { // lapide ad arco: corpo + sommita' + basamento
    graveMats();
    var g = new THREE.Group();
    var body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.1), graveStoneLightMat);
    body.position.set(px, 0.21, pz);
    var top = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.1), graveStoneLightMat);
    top.position.set(px, 0.46, pz);
    var base = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.18), graveStoneMat);
    base.position.set(px, 0.04, pz);
    g.add(body); g.add(top); g.add(base);
    return graveShadows(g);
  }
  function graveCross(px, pz) { // croce alta e sottile
    graveMats();
    var g = new THREE.Group();
    var v = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.72, 0.1), graveStoneLightMat);
    v.position.set(px, 0.36, pz);
    var o = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.1), graveStoneLightMat);
    o.position.set(px, 0.52, pz);
    var base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.18), graveStoneMat);
    base.position.set(px, 0.04, pz);
    g.add(v); g.add(o); g.add(base);
    return graveShadows(g);
  }

  // Landmark cimitero: SOLO prato consacrato + recinto in ferro con cancello a
  // sud. Le lapidi non si generano piu' qui: sono tile 'G' della mappa (solidi,
  // in file ordinate), cosi' non ci si cammina attraverso.
  function landmarkCemetery(x, z, w, h, scene) {
    var iron = new THREE.MeshLambertMaterial({ color: '#2e2e30', flatShading: true });

    // prato consacrato: piano appena piu' scuro che definisce l'area
    var lawn = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshLambertMaterial({ color: '#5d7446', transparent: true, opacity: 0.3 })
    );
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(x + w / 2, 0.015, z + h / 2);
    lawn.receiveShadow = true;
    scene.add(lawn);

    // recinto in ferro basso sul perimetro, con varco di 2 unita' al centro sud
    function rail(cx2, cz2, len, horiz) {
      var r = new THREE.Mesh(
        new THREE.BoxGeometry(horiz ? len : 0.06, 0.3, horiz ? 0.06 : len), iron);
      r.position.set(cx2, 0.3, cz2);
      r.castShadow = true;
      scene.add(r);
    }
    var gate = 1.0; // semi-larghezza del varco
    var midX = x + w / 2;
    rail(x + w / 2, z, w, true);                                     // nord
    rail(x, z + h / 2, h, false);                                    // ovest
    rail(x + w, z + h / 2, h, false);                                // est
    rail((x + (midX - gate)) / 2, z + h, (midX - gate) - x, true);   // sud sx
    rail(((midX + gate) + (x + w)) / 2, z + h, (x + w) - (midX + gate), true); // sud dx
    var p, gx;
    for (gx = 0; gx <= 1; gx++) { // paletti del cancello
      p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.1), iron);
      p.position.set(midX + (gx ? gate : -gate), 0.28, z + h);
      p.castShadow = true;
      scene.add(p);
    }
  }

  function weatherFor(map) {
    var cfg = CONFIG.weather[map.id];
    if (!cfg) return null;
    return {
      config: cfg,
      windX: cfg.windX,
      windZ: cfg.windZ,
      gust: 0
    };
  }

  function waterfallFlowTexture() {
    if (texCache.waterfallFlow) return texCache.waterfallFlow;
    var cv = document.createElement('canvas');
    cv.width = 64; cv.height = 256;
    var c = cv.getContext('2d');
    var g = c.createLinearGradient(0, 0, 64, 0);
    g.addColorStop(0, 'rgba(86,150,166,0.35)');
    g.addColorStop(0.35, 'rgba(206,239,235,0.82)');
    g.addColorStop(0.62, 'rgba(120,190,203,0.68)');
    g.addColorStop(1, 'rgba(63,126,150,0.28)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 256);
    for (var i = 0; i < 20; i++) {
      var px = (i * 29 + 7) % 64;
      var py = (i * 47 + 13) % 256;
      c.strokeStyle = 'rgba(238,251,247,' +
        (0.1 + (i % 4) * 0.035) + ')';
      c.lineWidth = 0.75 + (i % 3) * 0.48;
      c.beginPath();
      c.moveTo(px, py - 22);
      c.bezierCurveTo(px - 6, py - 6, px + 7, py + 7, px + 2, py + 24);
      c.stroke();
    }
    var tex = makeSurfaceTex(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1.8);
    texCache.waterfallFlow = tex;
    return tex;
  }

  function particleTexture(kind) {
    var key = 'particle-' + kind;
    if (texCache[key]) return texCache[key];
    var cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    var c = cv.getContext('2d');
    c.clearRect(0, 0, 64, 64);
    if (kind === 'impact') {
      // A rain hit is a tiny broken highlight, not a repeated white target.
      // Compressing the glow vertically gives it a wet-surface read without
      // introducing camera-facing rings along roads and paths.
      c.save();
      c.translate(32, 32);
      c.scale(1, 0.32);
      var impactGlow = c.createRadialGradient(-4, -2, 1, 0, 0, 25);
      impactGlow.addColorStop(0, 'rgba(236,250,247,0.52)');
      impactGlow.addColorStop(0.22, 'rgba(199,230,226,0.24)');
      impactGlow.addColorStop(1, 'rgba(174,214,211,0)');
      c.fillStyle = impactGlow;
      c.beginPath();
      c.arc(0, 0, 25, 0, Math.PI * 2);
      c.fill();
      c.restore();
      c.fillStyle = 'rgba(226,244,241,0.2)';
      c.fillRect(18, 29, 5, 2);
      c.fillRect(43, 35, 4, 1);
    } else if (kind === 'ring') {
      c.strokeStyle = 'rgba(255,255,255,0.9)';
      c.lineWidth = 5;
      c.beginPath();
      c.ellipse(32, 32, 20, 9, 0, 0, Math.PI * 2);
      c.stroke();
    } else if (kind === 'mote') {
      // Red Room dust needs a readable incandescent core. Reusing the broad
      // low-mist sprite made every point dissolve into the chevron floor.
      var mote = c.createRadialGradient(32, 32, 0, 32, 32, 29);
      mote.addColorStop(0, 'rgba(255,255,255,0.96)');
      mote.addColorStop(0.11, 'rgba(255,247,224,0.88)');
      mote.addColorStop(0.28, 'rgba(255,212,174,0.3)');
      mote.addColorStop(1, 'rgba(255,180,150,0)');
      c.fillStyle = mote;
      c.fillRect(0, 0, 64, 64);
    } else {
      var g = c.createRadialGradient(32, 32, 1, 32, 32, 31);
      g.addColorStop(0, 'rgba(255,255,255,' + (kind === 'spray' ? '0.92' : '0.34') + ')');
      g.addColorStop(kind === 'spray' ? 0.35 : 0.18, 'rgba(255,255,255,' + (kind === 'spray' ? '0.56' : '0.16') + ')');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 64, 64);
    }
    var tex = makeSurfaceTex(cv);
    texCache[key] = tex;
    return tex;
  }

  function createWaterfallSpray(x, z, w, world) {
    var count = qualityMode === 'performance' ||
      qualityMode === 'performance-auto' ? 36 : 68;
    var positions = new Float32Array(count * 3);
    var phases = new Float32Array(count);
    var lives = new Float32Array(count);
    var rises = new Float32Array(count);
    var drifts = new Float32Array(count * 2);
    var sizes = new Float32Array(count);
    var seed = 0x9e3779b9;
    function rnd() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    for (var i = 0; i < count; i++) {
      var stream = i % 3;
      var center = [-0.02, -0.12, 0.13][stream];
      var spread = [0.11, 0.04, 0.04][stream];
      positions[i * 3] = x + w * (
        0.5 + center + (rnd() - 0.5) * spread);
      positions[i * 3 + 1] = 0.055 + rnd() * 0.12;
      positions[i * 3 + 2] = z + 0.82 + rnd() * 0.36;
      phases[i] = rnd();
      lives[i] = 0.62 + rnd() * 0.94;
      rises[i] = 0.42 + rnd() * 0.78;
      drifts[i * 2] = (rnd() - 0.5) * 0.42;
      drifts[i * 2 + 1] = 0.06 + rnd() * 0.24;
      sizes[i] = 0.1 + rnd() * 0.12;
    }
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aLife', new THREE.BufferAttribute(lives, 1));
    geometry.setAttribute('aRise', new THREE.BufferAttribute(rises, 1));
    geometry.setAttribute('aDrift', new THREE.BufferAttribute(drifts, 2));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    var material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMap: { value: particleTexture('spray') },
        uWind: { value: new THREE.Vector2(
          world.weather ? world.weather.windX : -0.18,
          world.weather ? world.weather.windZ : -0.1
        ) },
        uGust: { value: 0 }
      },
      vertexShader: [
        'attribute float aPhase;',
        'attribute float aLife;',
        'attribute float aRise;',
        'attribute vec2 aDrift;',
        'attribute float aSize;',
        'uniform float uTime;',
        'uniform vec2 uWind;',
        'uniform float uGust;',
        'varying float vAlpha;',
        'void main(){',
        '  float age=fract(uTime/aLife+aPhase);',
        '  float fadeIn=smoothstep(0.0,0.12,age);',
        '  float fadeOut=1.0-smoothstep(0.56,1.0,age);',
        '  vec3 p=position;',
        '  p.x+=(aDrift.x+uWind.x*(0.2+0.08*uGust))*age;',
        '  p.z+=(aDrift.y+uWind.y*0.12)*age;',
        '  p.y+=aRise*age-0.54*age*age;',
        '  vec4 mv=modelViewMatrix*vec4(p,1.0);',
        '  gl_Position=projectionMatrix*mv;',
        '  gl_PointSize=max(1.0,aSize*(0.8+age*0.55)*270.0/max(1.0,-mv.z));',
        '  vAlpha=fadeIn*fadeOut*(0.68+0.22*sin(aPhase*31.0));',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D uMap;',
        'varying float vAlpha;',
        'void main(){',
        '  vec4 texel=texture2D(uMap,gl_PointCoord);',
        '  float a=texel.a*vAlpha*0.72;',
        '  if(a<0.006) discard;',
        '  gl_FragColor=vec4(vec3(0.86,0.96,0.94),a);',
        '}'
      ].join('\n'),
      transparent: true, depthWrite: false, depthTest: true,
      blending: THREE.NormalBlending, toneMapped: false
    });
    var points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = 5;
    world.scene.add(points);
    return { points: points, material: material, count: count };
  }

  function waterfallCliffGeometry(w, h) {
    var columns = 8, rows = 5;
    var positions = [], colors = [], indices = [];
    function frontPoint(column, row) {
      var nx = column / columns;
      var ny = row / rows;
      var topNoise = row === rows
        ? Math.sin(column * 2.11) * 0.035 +
          Math.cos(column * 0.73) * 0.02
        : 0;
      var sideBreak = column === 0
        ? 0.12 + Math.sin(row * 1.71) * 0.13
        : (column === columns
          ? -0.08 + Math.cos(row * 1.37) * 0.16 : 0);
      return [
        (nx - 0.5) * w + sideBreak,
        ny * h + topNoise,
        Math.sin(column * 1.71 + row * 0.83) * 0.13 +
          Math.cos(column * 0.37 - row * 1.29) * 0.075
      ];
    }
    function pushColor(shade, moss) {
      colors.push(
        0.43 * shade,
        0.36 * shade + moss,
        0.26 * shade + moss * 0.42
      );
    }
    function addQuad(a, b, c, d, shade) {
      var start = positions.length / 3;
      positions.push(
        a[0], a[1], a[2], b[0], b[1], b[2],
        c[0], c[1], c[2], d[0], d[1], d[2]
      );
      pushColor(shade, 0.018);
      pushColor(shade * 0.94, 0.012);
      pushColor(shade * 0.82, 0.006);
      pushColor(shade * 0.88, 0.01);
      indices.push(start, start + 2, start + 1, start, start + 3, start + 2);
    }
    for (var row = 0; row <= rows; row++) {
      for (var column = 0; column <= columns; column++) {
        var point = frontPoint(column, row);
        positions.push(point[0], point[1], point[2]);
        var shade = 0.72 + 0.14 * Math.sin(column * 1.37 + row * 2.19);
        var moss = Math.max(0, Math.sin(column * 1.83 - row * 0.74)) * 0.06;
        pushColor(shade, moss);
      }
    }
    for (row = 0; row < rows; row++) {
      for (column = 0; column < columns; column++) {
        var a = row * (columns + 1) + column;
        var b = a + 1;
        var c = a + columns + 1;
        var d = c + 1;
        // Alternating diagonals prevent a machine-perfect triangulation read.
        if ((column + row) % 2) indices.push(a, c, b, b, c, d);
        else indices.push(a, c, d, a, d, b);
      }
    }
    // The old landmark stopped at the front grid and therefore read as a
    // single dark card. Close the visible top and sides into a deep, stepped
    // earth mass so the source pool is physically recessed into terrain.
    var massDepth = 0.78;
    for (column = 0; column < columns; column++) {
      var topA = frontPoint(column, rows);
      var topB = frontPoint(column + 1, rows);
      var backB = [
        topB[0] + Math.sin(column * 1.7) * 0.07,
        h - 0.11 + Math.cos(column * 0.9) * 0.05,
        -massDepth - Math.sin(column * 0.8) * 0.08
      ];
      var backA = [
        topA[0] + Math.sin((column + 1) * 1.4) * 0.06,
        h - 0.08 + Math.sin(column * 1.2) * 0.045,
        -massDepth - Math.cos(column * 0.7) * 0.07
      ];
      addQuad(topA, topB, backB, backA, 0.72 + (column % 3) * 0.04);
    }
    for (row = 0; row < rows; row++) {
      var leftA = frontPoint(0, row);
      var leftB = frontPoint(0, row + 1);
      addQuad(
        leftA, leftB,
        [leftB[0] - 0.08, leftB[1] - 0.04, -massDepth],
        [leftA[0] - 0.04, leftA[1], -massDepth],
        0.62
      );
      var rightA = frontPoint(columns, row);
      var rightB = frontPoint(columns, row + 1);
      addQuad(
        rightB, rightA,
        [rightA[0] + 0.05, rightA[1], -massDepth],
        [rightB[0] + 0.08, rightB[1] - 0.05, -massDepth],
        0.66
      );
    }
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  function waterfallBasinGeometry(w, depth) {
    var segments = 40;
    var positions = [0, 0.002, 0], uvs = [0.5, 0.5];
    var colors = [0.38, 0.53, 0.58], indices = [];
    for (var i = 0; i < segments; i++) {
      var angle = i / segments * Math.PI * 2;
      var irregular = 1 + Math.sin(i * 2.17) * 0.045 + Math.cos(i * 0.73) * 0.035;
      var px = Math.cos(angle) * w * 0.5 * irregular;
      var pz = Math.sin(angle) * depth * 0.5 * irregular;
      positions.push(px, 0, pz);
      uvs.push(px / w + 0.5, pz / depth + 0.5);
      var edgeLight = 0.72 + Math.sin(angle * 5.1 + 0.7) * 0.045;
      colors.push(edgeLight, edgeLight * 1.08, edgeLight * 1.09);
    }
    for (i = 1; i <= segments; i++) indices.push(0, i % segments + 1, i);
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  function waterfallImpactPatchGeometry(w, depth, seed, arcSpan, arcCount) {
    var positions = [], uvs = [], indices = [];
    // Each impact is a handful of open, offset crescents. Keeping the arcs
    // disconnected avoids the synthetic target-like rings that previously
    // lined up across the receiving pool.
    for (var arc = 0; arc < arcCount; arc++) {
      var segments = 5 + ((seed + arc * 3) % 4);
      var span = arcSpan * (0.72 + arc * 0.16);
      var start = -span * 0.5 + Math.sin(seed * 1.71 + arc * 2.3) * 0.48;
      var radius = 0.5 - arc * 0.11;
      var band = 0.1 + ((seed + arc) % 3) * 0.025;
      var shiftX = Math.sin(seed * 0.83 + arc * 1.9) * w * 0.11;
      var shiftZ = Math.cos(seed * 1.13 + arc * 2.1) * depth * 0.12;
      var baseIndex = positions.length / 3;
      for (var segment = 0; segment <= segments; segment++) {
        var along = segment / segments;
        var angle = start + span * along;
        var irregular = 1 + Math.sin(
          seed * 2.07 + arc * 1.31 + segment * 1.77) * 0.09;
        var outerRadius = radius * irregular;
        var innerRadius = Math.max(0.16, outerRadius - band);
        positions.push(
          shiftX + Math.cos(angle) * w * outerRadius,
          0,
          shiftZ + Math.sin(angle) * depth * outerRadius,
          shiftX + Math.cos(angle) * w * innerRadius,
          0,
          shiftZ + Math.sin(angle) * depth * innerRadius
        );
        uvs.push(along * 2, 0, along * 2, 1);
      }
      for (segment = 0; segment < segments; segment++) {
        var outerAt = baseIndex + segment * 2;
        var innerAt = outerAt + 1;
        var nextOuter = outerAt + 2;
        var nextInner = outerAt + 3;
        indices.push(
          outerAt, innerAt, nextOuter,
          nextOuter, innerAt, nextInner
        );
      }
    }
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  function waterfallBasinBankGeometry(w, depth, innerScale, height, phase) {
    var segments = 40;
    var positions = [], colors = [], indices = [];
    phase = phase || 0;
    for (var i = 0; i < segments; i++) {
      var angle = i / segments * Math.PI * 2;
      var lobe = 1 + Math.sin(angle * 3 + phase) * 0.13 +
        Math.cos(angle * 5 - phase * 0.7) * 0.065 +
        Math.sin(angle * 1.7 + phase * 0.4) * 0.055;
      var outerX = Math.cos(angle) * w * 0.55 * lobe;
      var outerZ = Math.sin(angle) * depth * 0.58 * lobe;
      var innerNoise = innerScale +
        Math.sin(angle * 6.3 - phase) * 0.052;
      // Le spalle laterali trattengono il bacino; il fronte si abbassa in
      // aperture diseguali, evitando il vecchio anello-matita uniforme.
      var sideWeight = Math.pow(Math.abs(Math.cos(angle)), 1.35);
      var rearWeight = Math.max(0, -Math.sin(angle));
      var frontGap = Math.max(0, Math.sin(angle)) * (1 - sideWeight);
      var brokenPulse = Math.max(
        0, Math.sin(angle * 3.4 + phase * 1.3) - 0.48);
      var shoulderWeight = Math.max(
        0.08, 0.22 + sideWeight * 0.68 + rearWeight * 0.16 -
        frontGap * 0.42);
      var spanWeight = Math.max(
        sideWeight, rearWeight * 0.72) *
        (1 - brokenPulse * 0.62);
      // Quiet gaps collapse toward the inner toe instead of deleting
      // triangles. This gives broken shoulders without hard wedge endings.
      var outerScale = innerNoise + spanWeight * 0.22;
      var crestScale = innerNoise + spanWeight * (
        0.105 + Math.sin(angle * 4.1 + phase) * 0.018);
      var innerY = -0.018 + height * spanWeight * 0.44;
      var crestY = -0.018 + height * shoulderWeight * spanWeight *
        (0.64 + Math.sin(angle * 4.7 + phase) * 0.1) *
        (1 - brokenPulse * 0.76);
      positions.push(
        outerX * outerScale, -0.018, outerZ * outerScale,
        outerX * crestScale, crestY, outerZ * crestScale,
        outerX * innerNoise, innerY, outerZ * innerNoise,
        outerX * (innerNoise - spanWeight * 0.055), -0.018,
        outerZ * (innerNoise - spanWeight * 0.055)
      );
      var shade = 0.72 + Math.sin(angle * 5.3 + phase) * 0.14;
      colors.push(
        0.23 * shade, 0.29 * shade, 0.17 * shade,
        (0.27 + shoulderWeight * 0.045) * shade,
        (0.28 + shoulderWeight * 0.028) * shade,
        0.17 * shade,
        0.18 * shade, 0.23 * shade, 0.14 * shade,
        0.12 * shade, 0.17 * shade, 0.15 * shade
      );
    }
    for (i = 0; i < segments; i++) {
      var next = (i + 1) % segments;
      for (var ring = 0; ring < 3; ring++) {
        var a = i * 4 + ring;
        var b = a + 1;
        var na = next * 4 + ring;
        var nb = na + 1;
        indices.push(a, b, na, na, b, nb);
      }
    }
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute(
      'color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  function waterfallCrestGeometry(w) {
    var segments = 20;
    var positions = [], uvs = [], indices = [];
    for (var i = 0; i <= segments; i++) {
      var t = i / segments;
      var x = (t - 0.5) * w;
      var y = Math.sin(i * 1.73) * 0.026 + Math.cos(i * 0.61) * 0.014;
      positions.push(x, y + 0.045, 0, x, y - 0.045, 0);
      uvs.push(t * 2.4, 0, t * 2.4, 1);
    }
    for (i = 0; i < segments; i++) {
      // Three missing beats turn the lip into broken foam, not a cyan rail.
      if ((i >= 3 && i <= 5) || (i >= 10 && i <= 12) || i === 17) continue;
      var a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      indices.push(a, b, c, c, b, d);
    }
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  function waterfallImpactTexture() {
    if (texCache.waterfallImpact) return texCache.waterfallImpact;
    var cv = document.createElement('canvas');
    cv.width = 256; cv.height = 96;
    var c = cv.getContext('2d');
    c.clearRect(0, 0, cv.width, cv.height);
    for (var i = 0; i < 17; i++) {
      var x = 15 + ((i * 67) % 224);
      var y = 17 + ((i * 37) % 61);
      c.strokeStyle = 'rgba(232,247,243,' +
        (0.16 + (i % 4) * 0.07) + ')';
      c.lineWidth = 1 + (i % 3) * 0.65;
      c.beginPath();
      c.moveTo(x - 8 - (i % 4) * 3, y);
      c.bezierCurveTo(x - 3, y - 3, x + 5, y + 2, x + 13, y - 1);
      c.stroke();
    }
    texCache.waterfallImpact = makeSurfaceTex(cv);
    return texCache.waterfallImpact;
  }

  function waterfallFlowMassGeometry(w, h, seed) {
    var columns = 5;
    var rows = 14;
    var positions = [];
    var uvs = [];
    var colors = [];
    var indices = [];
    seed = seed || 1;
    for (var row = 0; row <= rows; row++) {
      var q = row / rows;
      var centerX = Math.sin(q * 7.1 + seed * 1.7) * w * 0.045 +
        Math.sin(q * 18.3 - seed) * w * 0.018;
      var flowBulge = Math.pow(
        Math.max(0, Math.sin(Math.PI * q)), 0.72);
      var halfWidth = w * 0.5 * (
        0.72 + flowBulge * 0.18 +
        Math.sin(q * 9.7 + seed * 2.1) * 0.065);
      for (var column = 0; column <= columns; column++) {
        var side = column / columns * 2 - 1;
        var edgeWeight = Math.pow(Math.abs(side), 5);
        var edgeBite = (
          Math.exp(-Math.pow((q - (0.28 + seed * 0.07)) / 0.14, 2)) *
            w * 0.07 +
          Math.exp(-Math.pow((q - (0.76 - seed * 0.035)) / 0.11, 2)) *
            w * 0.045
        ) * edgeWeight;
        var x = centerX + side * halfWidth +
          side * w * 0.025 * Math.sin(q * 17 + side * 2 + seed) +
          (side < 0 ? edgeBite : -edgeBite * 0.72);
        var z = (1 - side * side) * (0.07 + w * 0.035) +
          Math.sin(q * 11 + side * 2 + seed) * 0.035;
        var boundaryY = (q - 0.5) * h;
        if (row === 0) {
          boundaryY += Math.abs(side) * 0.09 +
            Math.sin(column * 1.71 + seed) * 0.035;
        } else if (row === rows) {
          boundaryY += -Math.abs(side) * 0.055 +
            Math.sin(column * 1.37 + seed * 1.3) * 0.035;
        }
        positions.push(x, boundaryY, z);
        uvs.push(column / columns, q * 1.23);
        var light = 0.68 + (1 - Math.abs(side)) * 0.2 +
          Math.sin(q * 13.3 + side * 7.1 + seed) * 0.045;
        colors.push(light * 0.8, light * 0.95, light);
      }
    }
    for (row = 0; row < rows; row++) {
      for (column = 0; column < columns; column++) {
        var a = row * (columns + 1) + column;
        var b = a + 1;
        var c = a + columns + 1;
        var d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute(
      'color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  function landmarkWaterfall(x, z, w, h, world) {
    var group = new THREE.Group();
    group.name = 'authored-waterfall';
    var cliff = new THREE.Mesh(
      waterfallCliffGeometry(w * 0.96, 2.61),
      new THREE.MeshStandardMaterial({
        color: 0xffffff, vertexColors: true, roughness: 0.96, metalness: 0,
        emissive: 0x2b2419, emissiveIntensity: 0.12,
        flatShading: true, envMapIntensity: 0.13, side: THREE.DoubleSide,
        dithering: true
      })
    );
    cliff.name = 'waterfall-continuous-cliff-face';
    cliff.position.set(x + w / 2, 0.04, z + 0.5);
    cliff.receiveShadow = true;
    group.add(cliff);
    var rockMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.96, metalness: 0,
      flatShading: true, envMapIntensity: 0.16, dithering: true
    });
    var rockTints = [0x5e685c, 0x756f5d, 0x53645f, 0x827b65];
    var rockSupports = [
      [0.04, 0.17, 0.09, 1.4, 0.68, 1.16],
      [w - 0.24, 0.22, 0.16, 1.02, 0.62, 1.08],
      [0.24, 0.76, -0.01, 0.82, 0.58, 0.78],
      [w - 0.1, 0.88, 0.08, 1.16, 0.72, 0.86],
      [0.1, 1.38, 0.04, 0.96, 0.68, 0.92],
      [w - 0.18, 1.58, 0.12, 1.24, 0.82, 0.9],
      [w * 0.19, 2.19, -0.05, 0.78, 0.52, 0.98],
      [w * 0.83, 2.3, 0.02, 0.9, 0.48, 0.78],
      [w * 0.34, 1.92, -0.12, 0.64, 0.36, 0.7],
      [w * 0.68, 1.13, -0.1, 0.72, 0.34, 0.66],
      [w * 0.43, 0.42, -0.03, 0.68, 0.3, 0.72],
      [w * 0.76, 0.48, 0.01, 0.8, 0.38, 0.76]
    ];
    var rockCount = rockSupports.length;
    var rocks = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(0.36, 0), rockMaterial, rockCount
    );
    var dummy = new THREE.Object3D();
    for (var i = 0; i < rockCount; i++) {
      var support = rockSupports[i];
      dummy.position.set(
        x + support[0],
        support[1],
        z + 0.62 + support[2]
      );
      dummy.rotation.set(i * 0.17, i * 0.41, i * 0.11);
      dummy.scale.set(support[3], support[4], support[5]);
      dummy.updateMatrix();
      rocks.setMatrixAt(i, dummy.matrix);
      rocks.setColorAt(i, new THREE.Color(rockTints[i % rockTints.length]));
    }
    rocks.instanceMatrix.needsUpdate = true;
    if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
    rocks.castShadow = false;
    rocks.receiveShadow = true;
    group.add(rocks);

    var water = liquidResources('w');
    if (world.liquidResources.indexOf(water) < 0) world.liquidResources.push(water);
    var ribbonMaps = [];
    // Unequal overlapping masses: one dense core, two torn shoulders and two
    // short side strands. Their overlap reads as volume, while no individual
    // mesh is wide enough to become a shower-curtain slab.
    var flowSpecs = [
      [0.24, 2.46, -0.012, 1.38, 0.98, 0.84, 1, 0.15, 0.08, 0.72, 1.22, 1, 0xa3d0ce],
      [0.115, 2.12, -0.12, 1.47, 0.955, 0.46, 2, 0.11, 0.47, 0.86, 1.08, 0, 0x82b8bc],
      [0.075, 1.82, 0.105, 1.31, 1.005, 0.4, 3, 0.18, 0.72, 1.05, 1.31, 0, 0x78aeb5],
      [0.035, 1.05, -0.225, 2.02, 0.92, 0.22, 4, 0.09, 0.28, 0.74, 0.94, 0, 0x719da5],
      [0.024, 0.86, 0.19, 0.71, 1.02, 0.2, 5, 0.2, 0.83, 0.91, 1.42, 0, 0x78a9ad]
    ];
    for (i = 0; i < flowSpecs.length; i++) {
      var flowSpec = flowSpecs[i];
      var flow = waterfallFlowTexture().clone();
      flow.needsUpdate = true;
      flow.wrapS = flow.wrapT = THREE.RepeatWrapping;
      flow.repeat.set(flowSpec[9], flowSpec[10]);
      var ribbonMaterial = new THREE.MeshPhysicalMaterial({
        map: flow, color: flowSpec[12], vertexColors: true,
        normalMap: water.normalMap,
        normalScale: new THREE.Vector2(
          i === 0 ? 0.095 : 0.055, i === 0 ? 0.08 : 0.045),
        roughness: i === 0 ? 0.31 : 0.39,
        metalness: 0, clearcoat: i === 0 ? 0.2 : 0.08,
        clearcoatRoughness: 0.3,
        envMapIntensity: i === 0 ? 0.42 : 0.3,
        emissive: 0x17383c, emissiveIntensity: i === 0 ? 0.025 : 0.05,
        transparent: true, opacity: flowSpec[5],
        depthWrite: !!flowSpec[11],
        side: THREE.DoubleSide, dithering: true
      });
      var ribbonGeometry = waterfallFlowMassGeometry(
        w * flowSpec[0], flowSpec[1], flowSpec[6]);
      var ribbon = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
      ribbon.position.set(
        x + w / 2 + flowSpec[2] * w,
        flowSpec[3],
        z + flowSpec[4]
      );
      ribbon.rotation.y = [0.01, -0.035, 0.045, -0.08, 0.07][i];
      ribbon.renderOrder = 3;
      group.add(ribbon);
      ribbonMaps.push({
        texture: flow, speed: flowSpec[7], phase: flowSpec[8]
      });
    }
    var lipWaterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x4f8d97, roughness: 0.36, metalness: 0,
      clearcoat: 0.18, clearcoatRoughness: 0.3,
      envMapIntensity: 0.3, transparent: true, opacity: 0.68,
      depthWrite: false, dithering: true
    });
    var lipSpecs = [
      [-0.11, 0.13, -0.025, -0.018],
      [0.015, 0.1, 0.018, 0.012],
      [0.12, 0.055, -0.01, 0.028]
    ];
    lipSpecs.forEach(function (lipSpec, lipIndex) {
      var lip = new THREE.Mesh(
        new THREE.BoxGeometry(w * lipSpec[1], 0.055, 0.16),
        lipWaterMaterial
      );
      lip.position.set(
        x + w / 2 + lipSpec[0] * w,
        2.61 + lipSpec[2],
        z + 0.935 + lipSpec[3]
      );
      lip.rotation.z = (lipIndex - 1) * 0.025;
      lip.renderOrder = 3;
      group.add(lip);
    });

    var waterfallWaterMaterial = water.material.clone();
    waterfallWaterMaterial.vertexColors = false;
    waterfallWaterMaterial.transparent = true;
    waterfallWaterMaterial.opacity = 0.97;
    waterfallWaterMaterial.depthWrite = false;
    waterfallWaterMaterial.needsUpdate = true;
    var sourceEarth = new THREE.Mesh(
      waterfallBasinGeometry(w * 0.97, 1.44),
      new THREE.MeshStandardMaterial({
        color: 0x4b5646, roughness: 0.99, metalness: 0,
        envMapIntensity: 0.08, flatShading: true, dithering: true
      })
    );
    sourceEarth.position.set(x + w / 2 - 0.08, 2.69, z + 0.38);
    sourceEarth.receiveShadow = true;
    group.add(sourceEarth);
    var ledgeRockSpecs = [
      [0.05, -0.04, 1.18, 0.52, 0.96],
      [0.23, 0.07, 0.74, 0.39, 0.82],
      [0.49, -0.08, 0.93, 0.44, 0.72],
      [0.72, 0.1, 0.62, 0.35, 0.86]
    ];
    var sourceShelf = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(0.34, 0), rockMaterial,
      ledgeRockSpecs.length);
    for (var shelfIndex = 0; shelfIndex < ledgeRockSpecs.length; shelfIndex++) {
      var ledge = ledgeRockSpecs[shelfIndex];
      dummy.position.set(
        x + w * ledge[0],
        2.61 + ledge[1],
        z + 0.65 + Math.cos(shelfIndex * 1.31) * 0.08
      );
      dummy.rotation.set(
        shelfIndex * 0.19, shelfIndex * 0.47, -0.13 + shelfIndex * 0.035);
      dummy.scale.set(
        ledge[2], ledge[3], ledge[4]
      );
      dummy.updateMatrix();
      sourceShelf.setMatrixAt(shelfIndex, dummy.matrix);
      sourceShelf.setColorAt(
        shelfIndex,
        new THREE.Color(rockTints[(shelfIndex + 1) % rockTints.length])
      );
    }
    sourceShelf.instanceMatrix.needsUpdate = true;
    if (sourceShelf.instanceColor) sourceShelf.instanceColor.needsUpdate = true;
    sourceShelf.receiveShadow = true;
    group.add(sourceShelf);
    // One continuous source surface now sits wholly inside the bank's inner
    // clearance. The former three overlapping discs caused triangular seams,
    // depth-order wedges and the thin silhouette fin seen in gameplay.
    var sourceWater = new THREE.Mesh(
      waterfallBasinGeometry(w * 0.73, 1.03),
      waterfallWaterMaterial
    );
    sourceWater.position.set(x + w / 2 - 0.08, 2.725, z + 0.42);
    sourceWater.rotation.y = -0.025;
    sourceWater.renderOrder = 3;
    group.add(sourceWater);
    var poolGeometry = waterfallBasinGeometry(w * 0.94, 1.52);
    var pool = new THREE.Mesh(poolGeometry, waterfallWaterMaterial);
    pool.position.set(x + w / 2, 0.036, z + 1.18);
    pool.renderOrder = 3;
    group.add(pool);
    var basinBank = new THREE.Mesh(
      waterfallBasinBankGeometry(w * 1.12, 1.88, 0.74, 0.135, 2.7),
      new THREE.MeshStandardMaterial({
        color: 0xa0a68d, vertexColors: true, roughness: 0.99, metalness: 0,
        envMapIntensity: 0.1, flatShading: false, dithering: true
      })
    );
    basinBank.position.set(x + w / 2, 0.018, z + 1.2);
    basinBank.receiveShadow = true;
    group.add(basinBank);
    var basinReeds = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.028, 0.26, 5, 1),
      new THREE.MeshStandardMaterial({
        color: 0x35563c, roughness: 0.98, metalness: 0,
        envMapIntensity: 0.08, flatShading: true
      }),
      9
    );
    for (var reedIndex = 0; reedIndex < 9; reedIndex++) {
      var reedAngle = reedIndex < 5
        ? 2.55 + reedIndex * 0.085
        : -0.18 + (reedIndex - 5) * 0.075;
      dummy.position.set(
        x + w / 2 + Math.cos(reedAngle) * w * 0.49,
        0.12,
        z + 1.18 + Math.sin(reedAngle) * 0.77
      );
      dummy.rotation.set(0, reedAngle, (reedIndex % 3 - 1) * 0.05);
      dummy.scale.setScalar(0.76 + (reedIndex % 4) * 0.09);
      dummy.updateMatrix();
      basinReeds.setMatrixAt(reedIndex, dummy.matrix);
    }
    basinReeds.instanceMatrix.needsUpdate = true;
    basinReeds.receiveShadow = true;
    group.add(basinReeds);

    var foamMaterial = new THREE.MeshBasicMaterial({
      color: 0xb8d6d0, transparent: true, opacity: 0.26,
      depthWrite: false, toneMapped: false,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3
    });
    var crestSpecs = [
      [-0.015, 0.42, 0.935],
      [-0.31, 0.028, 0.86],
      [0.3, 0.022, 0.9]
    ];
    crestSpecs.forEach(function (crestSpec) {
      var crest = new THREE.Mesh(
        waterfallCrestGeometry(w * crestSpec[1]), foamMaterial);
      crest.position.set(
        x + w / 2 + crestSpec[0] * w, 2.71, z + crestSpec[2]);
      crest.renderOrder = 4;
      group.add(crest);
    });
    var impactSpecs = [
      [-0.045, 1.02, 0.28, 0.25, 0.33, 0.11, 2.1, 3, 1.18, 0.3],
      [0.1, 0.94, 0.17, 0.14, 0.24, -0.27, 1.32, 2, 0.94, 2.1],
      [-0.16, 1.12, 0.1, 0.1, 0.17, 0.38, 1.02, 1, 1.34, 4.4]
    ];
    var impactPatches = [];
    var aerationMaterial = new THREE.MeshBasicMaterial({
      map: waterfallImpactTexture(), color: 0xe4f3ee,
      transparent: true, opacity: 0.42, depthWrite: false,
      toneMapped: false, polygonOffset: true,
      polygonOffsetFactor: -4, polygonOffsetUnits: -4
    });
    var aeration = new THREE.Mesh(
      waterfallBasinGeometry(w * 0.19, 0.34), aerationMaterial);
    aeration.position.set(x + w / 2 - w * 0.018, 0.062, z + 0.98);
    aeration.rotation.y = -0.08;
    aeration.renderOrder = 5;
    group.add(aeration);
    impactPatches.push({
      mesh: aeration, material: aerationMaterial,
      baseOpacity: 0.42, staticPatch: false,
      speed: 1.42, phase: 0.9, baseScale: 1,
      baseRotation: -0.08
    });
    impactSpecs.forEach(function (impact, impactIndex) {
      var impactMaterial = foamMaterial.clone();
      impactMaterial.opacity = impact[4];
      var impactFoam = new THREE.Mesh(
        waterfallImpactPatchGeometry(
          w * impact[2], impact[3], impactIndex + 7, impact[6], impact[7]),
        impactMaterial
      );
      impactFoam.position.set(
        x + w / 2 + impact[0] * w,
        0.052 + impactIndex * 0.001,
        z + impact[1]
      );
      impactFoam.rotation.y = impact[5];
      impactFoam.renderOrder = 4;
      group.add(impactFoam);
      impactPatches.push({
        mesh: impactFoam, material: impactMaterial,
        baseOpacity: impact[4], staticPatch: false,
        speed: impact[8], phase: impact[9], baseScale: 1,
        baseRotation: impact[5]
      });
    });

    world.scene.add(group);
    var spray = createWaterfallSpray(x, z, w, world);
    world.waterfalls.push({
      group: group, ribbonMaps: ribbonMaps, spray: spray,
      impactPatches: impactPatches
    });
    return group;
  }

  function createRain(map, scene, weather) {
    // Varied, fog-aware streaks remain one immutable LineSegments draw. Only
    // uTime changes; no position-buffer uploads and no clipped white rods.
    var cfg = weather.config;
    var performanceMode = qualityMode === 'performance' || qualityMode === 'performance-auto';
    var count = performanceMode ? cfg.rainPerformance : cfg.rainBalanced;
    if (!count) return null;
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(count * 6);
    var tip = new Float32Array(count * 2);
    var phase = new Float32Array(count * 2);
    var length = new Float32Array(count * 2);
    var alpha = new Float32Array(count * 2);
    var cohort = new Float32Array(count * 2);
    var seed = 0x6d2b79f5;
    function rnd() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    var rainAnchors = (cfg.mistAnchors || [
      [map.width * 0.5, 0, map.height * 0.5]
    ]).slice();
    // The woods opening is a canonical gameplay composition but sits outside
    // the denser grove mist anchors. Give it its own world-space rain cell so
    // the weather reads on entry without turning into a camera-following veil.
    if (map.id === 'woods') rainAnchors.push([14.2, 0, 16.2, 1]);
    for (var i = 0; i < count; i++) {
      // The global mix stays as quiet as the accepted control. Only the
      // authored woods-entry cell uses the Loop7d winner's denser cohort.
      var rainSlot = i % 24;
      var rainAnchor = rainAnchors[i % rainAnchors.length];
      var entryCell = rainAnchor[3] === 1;
      var rainCohort = entryCell
        ? (rainSlot < 17 ? 0 : (rainSlot < 21 ? 1 : 2))
        : (rainSlot < 17 ? 0 : (rainSlot < 22 ? 1 : 2));
      var cohortRadius = rainCohort === 2
        ? 1.8 : (rainCohort === 1 ? 3.2 : 5.5);
      var uniformBackground = i % 7 === 0;
      var clusterAngle = rnd() * Math.PI * 2;
      var clusterRadius = Math.sqrt(rnd()) * cohortRadius;
      var x = uniformBackground
        ? 0.25 + rnd() * Math.max(0.1, map.width - 0.5)
        : Math.max(0.25, Math.min(
          map.width - 0.25,
          rainAnchor[0] + Math.cos(clusterAngle) * clusterRadius));
      var y = rnd() * 16;
      var z = uniformBackground
        ? 0.25 + rnd() * Math.max(0.1, map.height - 0.5)
        : Math.max(0.25, Math.min(
          map.height - 0.25,
          rainAnchor[2] + Math.sin(clusterAngle) * clusterRadius * 0.72));
      var p = rnd();
      var len = rainCohort === 2
        ? (entryCell ? 0.42 + rnd() * 0.28 : 0.38 + rnd() * 0.24)
        : (rainCohort === 1 ? 0.14 + rnd() * 0.13 : 0.04 + rnd() * 0.06);
      var a = (rainCohort === 2
        ? (entryCell ? 0.14 + rnd() * 0.08 : 0.11 + rnd() * 0.06)
        : (rainCohort === 1
          ? (entryCell ? 0.04 + rnd() * 0.04 : 0.035 + rnd() * 0.035)
          : 0.01 + rnd() * 0.01)
      ) * cfg.rain;
      for (var v = 0; v < 2; v++) {
        var at = (i * 2 + v);
        pos[at * 3] = x;
        pos[at * 3 + 1] = y;
        pos[at * 3 + 2] = z;
        tip[at] = v;
        phase[at] = p;
        length[at] = len;
        alpha[at] = a;
        cohort[at] = rainCohort;
      }
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aTip', new THREE.BufferAttribute(tip, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    geo.setAttribute('aLength', new THREE.BufferAttribute(length, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    geo.setAttribute('aCohort', new THREE.BufferAttribute(cohort, 1));
    var fogCfg = CONFIG.fog[map.id] || { near: 16, far: 44 };
    var mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWind: { value: new THREE.Vector2(weather.windX, weather.windZ) },
        uGust: { value: 0 },
        uFogNear: { value: fogCfg.near },
        uFogFar: { value: fogCfg.far }
      },
      vertexShader: [
        'attribute float aTip;',
        'attribute float aPhase;',
        'attribute float aLength;',
        'attribute float aAlpha;',
        'attribute float aCohort;',
        'uniform float uTime;',
        'uniform vec2 uWind;',
        'uniform float uGust;',
        'varying float vAlpha;',
        'varying float vDepth;',
        'varying float vCohort;',
        'void main() {',
        '  float speed=mix(7.2,14.2,aCohort*0.5);',
        '  float y = mod(position.y - uTime * speed + aPhase * 16.0 + 16.0, 16.0);',
        '  vec3 p = vec3(position.x, y, position.z);',
        '  float windScale=mix(1.25,2.35,aCohort*0.5);',
        '  float localGust=1.0+uGust*(0.14+0.08*sin(aPhase*31.0));',
        '  p += aTip * vec3(uWind.x * windScale * localGust, aLength, uWind.y * windScale * localGust);',
        '  p.x += sin(uTime*0.83+aPhase*18.0)*uGust*0.025;',
        '  vec4 mv=modelViewMatrix*vec4(p,1.0);',
        '  gl_Position=projectionMatrix*mv;',
        '  vDepth=-mv.z;',
        '  vCohort=aCohort;',
        '  vAlpha=aAlpha*(0.72+0.28*aTip);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uFogNear;',
        'uniform float uFogFar;',
        'varying float vAlpha;',
        'varying float vDepth;',
        'varying float vCohort;',
        'void main() {',
        '  float nearFade=smoothstep(1.8,4.2,vDepth);',
        '  float farFade=1.0-smoothstep(uFogNear,uFogFar,vDepth);',
        '  float depthFade=nearFade*farFade;',
        '  float stratum=mix(0.58,1.0,vCohort*0.5);',
        '  float d=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);',
        '  float a=max(0.0,vAlpha*depthFade*stratum+(d-0.5)/255.0);',
        '  gl_FragColor=vec4(0.74,0.84,0.86,a);',
        '}'
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending
    });
    var mesh = new THREE.LineSegments(geo, mat);
    mesh.frustumCulled = false;
    mesh.name = map.id + '-world-anchored-rain-volume';
    mesh.position.set(0, 0, 0);
    scene.add(mesh);
    return { mesh: mesh, material: mat, count: count };
  }

  function createRainImpacts(map, scene, weather) {
    var cfg = weather.config;
    var performanceMode = qualityMode === 'performance' || qualityMode === 'performance-auto';
    var budget = performanceMode ? cfg.impactsPerformance : cfg.impactsBalanced;
    if (!budget) return null;
    var eligible = [];
    for (var y = 0; y < map.height; y++) {
      for (var x = 0; x < map.width; x++) {
        var ch = map.rows[y].charAt(x);
        if (ch === 'r' || ch === '-' || ch === '=' || ch === 'p' || ch === 'w') {
          eligible.push({ x: x, y: y });
        }
      }
    }
    if (!eligible.length) return null;
    var count = Math.min(budget, eligible.length * 2);
    var positions = new Float32Array(count * 3);
    var sizes = new Float32Array(count);
    var phases = new Float32Array(count);
    var lives = new Float32Array(count);
    var rotations = new Float32Array(count);
    var seed = map.id === 'woods' ? 0x51f15e5d : 0x243f6a88;
    function rnd() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    for (var i = 0; i < count; i++) {
      var tile = eligible[Math.floor(rnd() * eligible.length)];
      var tileChar = map.rows[tile.y].charAt(tile.x);
      // Path impacts hug irregular shoulders; they never form a center-line
      // chain. Road and water hits can occupy their wider wet surfaces.
      var localX = tileChar === 'p'
        ? (rnd() < 0.5 ? 0.1 + rnd() * 0.2 : 0.7 + rnd() * 0.2)
        : 0.1 + rnd() * 0.8;
      positions[i * 3] = tile.x + localX;
      positions[i * 3 + 1] = tileChar === 'w' ? 0.057 : 0.055;
      positions[i * 3 + 2] = tile.y + 0.12 + rnd() * 0.76;
      sizes[i] = 0.08 + rnd() * 0.11;
      phases[i] = rnd();
      lives[i] = 0.62 + rnd() * 1.28;
      rotations[i] = rnd() * Math.PI * 2;
    }
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aLife', new THREE.BufferAttribute(lives, 1));
    geometry.setAttribute('aRotation', new THREE.BufferAttribute(rotations, 1));
    var material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMap: { value: particleTexture('impact') },
        uColor: { value: new THREE.Color(0xa9cbca) }
      },
      vertexShader: [
        'attribute float aSize;',
        'attribute float aPhase;',
        'attribute float aLife;',
        'attribute float aRotation;',
        'uniform float uTime;',
        'varying float vLife;',
        'varying float vRotation;',
        'void main(){',
        '  float age=fract(uTime/aLife+aPhase);',
        '  float appear=smoothstep(0.0,0.055,age);',
        '  float vanish=1.0-smoothstep(0.13,0.34,age);',
        '  vLife=appear*vanish;',
        '  vRotation=aRotation;',
        '  vec4 mv=modelViewMatrix*vec4(position,1.0);',
        '  gl_Position=projectionMatrix*mv;',
        '  gl_PointSize=max(1.0,aSize*(0.72+age*2.1)*270.0/max(1.0,-mv.z));',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D uMap;',
        'uniform vec3 uColor;',
        'varying float vLife;',
        'varying float vRotation;',
        'void main(){',
        '  vec2 p=gl_PointCoord-0.5;',
        '  float s=sin(vRotation),c=cos(vRotation);',
        '  vec2 uv=vec2(c*p.x-s*p.y,s*p.x+c*p.y)+0.5;',
        '  float a=texture2D(uMap,uv).a*vLife*0.42;',
        '  if(a<0.004) discard;',
        '  gl_FragColor=vec4(uColor,a);',
        '}'
      ].join('\n'),
      transparent: true, depthWrite: false, depthTest: true,
      blending: THREE.NormalBlending
    });
    var points = new THREE.Points(geometry, material);
    points.name = 'rain-impact-points';
    points.frustumCulled = false;
    points.renderOrder = 5;
    scene.add(points);
    return {
      points: points, material: material, geometry: geometry,
      count: count
    };
  }

  function createAtmosphereField(map, scene, weather) {
    if (!weather) return null;
    var cfg = weather.config;
    var performanceMode = qualityMode === 'performance' || qualityMode === 'performance-auto';
    var count = performanceMode ? cfg.mistPerformance : cfg.mistBalanced;
    if (!count) return null;
    var positions = new Float32Array(count * 3);
    var mistSizes = new Float32Array(count);
    var mistAlphas = new Float32Array(count);
    var seed = map.id === 'redroom' ? 0xc0ffee12 : (map.id === 'woods' ? 0x2f6e2b1d : 0x7a91d3e5);
    function rnd() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    var anchors = cfg.mistAnchors || [[map.width / 2, 0.25, map.height / 2]];
    var redDepthAnchors = [
      [[3.3, 1.2, 2.05], [7.7, 1.48, 1.72], [12.4, 1.08, 2.28]],
      [[2.8, 0.92, 4.35], [6.1, 0.72, 4.85],
       [10.1, 1.02, 4.18], [13.25, 0.76, 4.72]],
      [[3.55, 0.58, 6.82], [7.15, 0.46, 7.34], [11.9, 0.64, 6.7]]
    ];
    for (var i = 0; i < count; i++) {
      var redCohort = map.id === 'redroom' ? i % 3 : -1;
      var anchor = redCohort >= 0
        ? redDepthAnchors[redCohort][
          Math.floor(i / 3) % redDepthAnchors[redCohort].length]
        : anchors[i % anchors.length];
      var angle = rnd() * Math.PI * 2;
      var radius = redCohort >= 0
        ? Math.pow(rnd(), 1.65) * (0.52 + redCohort * 0.12)
        : 0.55 + Math.pow(rnd(), 1.8) * 1.65;
      positions[i * 3] = Math.max(
        0.35, Math.min(map.width - 0.35, anchor[0] + Math.cos(angle) * radius));
      positions[i * 3 + 1] = anchor[1] +
        (redCohort >= 0
          ? rnd() * (0.62 + redCohort * 0.1)
          : Math.pow(rnd(), 2.4) * 0.42);
      positions[i * 3 + 2] = Math.max(
        0.35, Math.min(map.height - 0.35, anchor[2] + Math.sin(angle) * radius * 0.7));
      mistSizes[i] = 0.45 + rnd() * 0.5;
      mistAlphas[i] = map.id === 'woods'
        ? 0.018 + rnd() * 0.032
        : 0.012 + rnd() * 0.023;
    }
    if (map.id === 'redroom') {
      var group = new THREE.Group();
      group.name = 'red-room-depth-mote-cohorts';
      var cohortMaterials = [];
      var baseOpacities = [0.46, 0.6, 0.74];
      var cohortSizes = [0.3, 0.46, 0.66];
      for (var cohortIndex = 0; cohortIndex < 3; cohortIndex++) {
        var cohortPositions = [];
        for (i = cohortIndex; i < count; i += 3) {
          cohortPositions.push(
            positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        }
        var cohortGeometry = new THREE.BufferGeometry();
        cohortGeometry.setAttribute(
          'position', new THREE.Float32BufferAttribute(cohortPositions, 3));
        var cohortMaterial = new THREE.PointsMaterial({
          map: particleTexture('mote'),
          color: cohortIndex === 2 ? 0xffc09d : 0xffaa8e,
          size: cohortSizes[cohortIndex], sizeAttenuation: true,
          opacity: baseOpacities[cohortIndex],
          transparent: true, depthWrite: false, depthTest: true,
          blending: THREE.NormalBlending, toneMapped: false, alphaTest: 0.004
        });
        var cohortPoints = new THREE.Points(cohortGeometry, cohortMaterial);
        cohortPoints.name = 'red-room-mote-depth-' + cohortIndex;
        cohortPoints.frustumCulled = false;
        cohortPoints.renderOrder = 6 + cohortIndex;
        group.add(cohortPoints);
        cohortMaterials.push(cohortMaterial);
      }
      scene.add(group);
      return {
        points: group, material: cohortMaterials[1],
        materials: cohortMaterials, baseOpacities: baseOpacities,
        count: count, draws: 3,
        baseOpacity: cfg.mistOpacity,
        baseX: group.position.x, baseZ: group.position.z
      };
    }
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(mistSizes, 1));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(mistAlphas, 1));
    var material = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: particleTexture('mist') },
        uColor: { value: new THREE.Color(cfg.mistColor) }
      },
      vertexShader: [
        'attribute float aSize;',
        'attribute float aAlpha;',
        'varying float vAlpha;',
        'varying float vDepth;',
        'void main(){',
        '  vec4 mv=modelViewMatrix*vec4(position,1.0);',
        '  gl_Position=projectionMatrix*mv;',
        '  gl_PointSize=max(1.0,aSize*270.0/max(1.0,-mv.z));',
        '  vAlpha=aAlpha;',
        '  vDepth=-mv.z;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D uMap;',
        'uniform vec3 uColor;',
        'varying float vAlpha;',
        'varying float vDepth;',
        'void main(){',
        '  float depthBand=smoothstep(1.4,3.2,vDepth)*',
        '    (1.0-smoothstep(25.0,40.0,vDepth));',
        '  float a=texture2D(uMap,gl_PointCoord).a*vAlpha*depthBand;',
        '  if(a<0.0015) discard;',
        '  gl_FragColor=vec4(uColor,a);',
        '}'
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
      toneMapped: false
    });
    var points = new THREE.Points(geometry, material);
    points.name = map.id + '-low-mist';
    points.frustumCulled = false;
    points.renderOrder = 6;
    scene.add(points);
    return {
      points: points,
      material: material,
      count: count,
      staticOpacity: true,
      baseOpacity: cfg.mistOpacity,
      baseX: points.position.x,
      baseZ: points.position.z
    };
  }

  function addLodgeAtmosphere(map, world) {
    if (map.id !== 'redroom') return;
    var group = new THREE.Group();
    group.name = 'red-room-local-atmosphere';
    var animated = [];
    var material = new THREE.MeshBasicMaterial({
      map: practicalLightPoolTexture(), color: 0xd04462,
      transparent: true, opacity: 0.21, depthWrite: false, depthTest: true,
      blending: THREE.AdditiveBlending, toneMapped: false
    });
    var glow = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 3.3), material);
    glow.name = 'red-room-backlight-haze';
    glow.position.set(10.25, 1.42, 0.5);
    glow.renderOrder = 1;
    group.add(glow);
    animated.push({ material: material, base: 0.19, amplitude: 0.028, phase: 0.2 });

    var rearFloorMaterial = new THREE.MeshBasicMaterial({
      map: practicalLightPoolTexture(), color: 0xb52f52,
      transparent: true, opacity: 0.2, depthWrite: false, depthTest: true,
      blending: THREE.AdditiveBlending, toneMapped: false
    });
    var rearFloorHaze = new THREE.Mesh(
      new THREE.PlaneGeometry(5.6, 2.45), rearFloorMaterial);
    rearFloorHaze.name = 'red-room-rear-floor-haze';
    rearFloorHaze.rotation.x = -Math.PI / 2;
    rearFloorHaze.position.set(10.1, 0.039, 2.08);
    rearFloorHaze.renderOrder = 2;
    group.add(rearFloorHaze);
    animated.push({
      material: rearFloorMaterial, base: 0.185, amplitude: 0.025, phase: 1.8
    });

    var shaftMaterial = new THREE.MeshBasicMaterial({
      map: practicalLightPoolTexture(), color: 0xd84867,
      transparent: true, opacity: 0.21, depthWrite: false, depthTest: true,
      blending: THREE.AdditiveBlending, toneMapped: false,
      side: THREE.DoubleSide
    });
    var shaft = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 5.2), shaftMaterial);
    shaft.name = 'red-room-rear-light-shaft';
    shaft.position.set(10.7, 1.8, 0.51);
    shaft.rotation.z = 0.08;
    shaft.renderOrder = 2;
    group.add(shaft);
    animated.push({
      material: shaftMaterial, base: 0.19, amplitude: 0.018, phase: 0.65
    });

    [1.05, map.width - 1.05].forEach(function (sideX, sideIndex) {
      var sideMaterial = new THREE.MeshBasicMaterial({
        map: practicalLightPoolTexture(), color: sideIndex ? 0xb2173f : 0x8d1740,
        transparent: true, opacity: 0.17, depthWrite: false, depthTest: true,
        blending: THREE.AdditiveBlending, toneMapped: false
      });
      var sidePool = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 6.4), sideMaterial);
      sidePool.rotation.x = -Math.PI / 2;
      sidePool.position.set(sideX, 0.038, 5.45);
      sidePool.renderOrder = 2;
      group.add(sidePool);
      animated.push({
        material: sideMaterial, base: 0.155, amplitude: 0.035,
        phase: 1.1 + sideIndex * 1.7
      });
    });

    [
      [7.5, 3.5], [9.5, 3.5], [6.5, 6.5], [9.5, 6.5]
    ].forEach(function (point, index) {
      var pedestalGlowMaterial = new THREE.MeshBasicMaterial({
        map: practicalLightPoolTexture(),
        color: index % 2 ? 0xc63f47 : 0xa82c4d,
        transparent: true, opacity: 0.17, depthWrite: false, depthTest: true,
        blending: THREE.AdditiveBlending, toneMapped: false
      });
      var pedestalGlow = new THREE.Mesh(
        new THREE.PlaneGeometry(1.08, 1.08), pedestalGlowMaterial);
      pedestalGlow.rotation.x = -Math.PI / 2;
      pedestalGlow.position.set(point[0], 0.041, point[1]);
      pedestalGlow.renderOrder = 3;
      group.add(pedestalGlow);
      animated.push({
        material: pedestalGlowMaterial, base: 0.145, amplitude: 0.035,
        phase: index * 0.83 + 0.4
      });
      var rimMaterial = new THREE.MeshBasicMaterial({
        color: index % 2 ? 0xe15a48 : 0xb93b52,
        transparent: true, opacity: 0.2, depthWrite: false, depthTest: true,
        blending: THREE.AdditiveBlending, toneMapped: false,
        side: THREE.DoubleSide
      });
      var rim = new THREE.Mesh(new THREE.RingGeometry(0.29, 0.5, 28), rimMaterial);
      rim.rotation.x = -Math.PI / 2;
      rim.position.set(point[0], 0.047, point[1]);
      rim.renderOrder = 4;
      group.add(rim);
      animated.push({
        material: rimMaterial, base: 0.17, amplitude: 0.04,
        phase: index * 0.83
      });
    });

    world.scene.add(group);
    world.lodgeGlow = { mesh: glow, material: material };
    world.lodgeAtmosphere = { group: group, animated: animated };
  }

  /* ---------------- terreno + luci ---------------- */

  /* Direzione del terreno a scala-mappa. Ogni wash viene prima dipinto in uno
   * strato continuo e poi mascherato per famiglia di materiale: niente cerchi
   * casuali che attraversano asfalto e prato, niente griglia cromatica 16x16. */
  function decorateGround(c, map, style) {
    style = style || { season: 'summer', wet: false };
    var seed = 7;
    for (var i = 0; i < map.id.length; i++) seed = (seed * 31 + map.id.charCodeAt(i)) & 0x7fffffff;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    var w = (map.width + BORDER * 2) * TILE, h = (map.height + BORDER * 2) * TILE;
    var base = baseCharOf(map);

    function visualGroundChar(tx, ty) {
      var ch = chAt(map, tx, ty);
      return SKIP_BAKE[ch] ? base : ch;
    }

    var familyMask = document.createElement('canvas');
    var familyLayer = document.createElement('canvas');
    familyMask.width = familyLayer.width = w;
    familyMask.height = familyLayer.height = h;
    var familyMaskCtx = familyMask.getContext('2d');
    var familyLayerCtx = familyLayer.getContext('2d');

    function paintFamily(chars, colors, count) {
      var mc = familyMaskCtx;
      var lc = familyLayerCtx;
      mc.clearRect(0, 0, w, h);
      lc.globalCompositeOperation = 'source-over';
      lc.clearRect(0, 0, w, h);
      mc.fillStyle = '#fff';
      for (var ty = -BORDER; ty < map.height + BORDER; ty++) {
        for (var tx = -BORDER; tx < map.width + BORDER; tx++) {
          if (!chars[visualGroundChar(tx, ty)]) continue;
          mc.fillRect((tx + BORDER) * TILE, (ty + BORDER) * TILE, TILE, TILE);
        }
      }
      for (var patchIndex = 0; patchIndex < count; patchIndex++) {
        var cx = rnd() * w;
        var cy = rnd() * h;
        var radius = TILE * (3.8 + rnd() * 5.6);
        var squash = 0.46 + rnd() * 0.42;
        var col = colors[patchIndex % colors.length];
        lc.save();
        lc.translate(cx, cy);
        lc.rotate((rnd() - 0.5) * 0.7);
        lc.scale(1, squash);
        var gradient = lc.createRadialGradient(0, 0, radius * 0.06, 0, 0, radius);
        gradient.addColorStop(0, col);
        gradient.addColorStop(0.58, col);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        lc.fillStyle = gradient;
        lc.beginPath();
        lc.arc(0, 0, radius, 0, Math.PI * 2);
        lc.fill();
        lc.restore();
      }
      lc.globalCompositeOperation = 'destination-in';
      lc.drawImage(familyMask, 0, 0);
      c.drawImage(familyLayer, 0, 0);
    }

    var autumn = style.season === 'autumn';
    var winter = style.season === 'winter';
    paintFamily({ '.': 1, ',': 1 }, autumn
      ? ['rgba(135,119,66,0.085)', 'rgba(69,92,56,0.07)', 'rgba(190,158,91,0.045)']
      : winter
        ? ['rgba(90,112,104,0.075)', 'rgba(49,78,68,0.07)', 'rgba(185,204,190,0.035)']
        : ['rgba(72,112,67,0.075)', 'rgba(42,81,61,0.065)', 'rgba(189,183,111,0.04)'],
    9);
    paintFamily({ g: 1 }, autumn
      ? ['rgba(88,78,49,0.11)', 'rgba(44,66,50,0.1)', 'rgba(151,119,65,0.055)']
      : ['rgba(18,56,45,0.12)', 'rgba(66,96,65,0.075)', 'rgba(91,70,48,0.06)'],
    11);
    paintFamily({ p: 1 }, style.wet
      ? ['rgba(60,64,54,0.085)', 'rgba(177,159,113,0.045)']
      : ['rgba(119,92,54,0.055)', 'rgba(218,194,139,0.045)'],
    7);
    paintFamily({ r: 1, '-': 1, '=': 1 }, style.wet
      ? ['rgba(34,55,56,0.075)', 'rgba(184,204,201,0.035)']
      : ['rgba(69,75,73,0.045)', 'rgba(214,215,204,0.025)'],
    6);
    function paintThroughMask(chars, painter) {
      familyMaskCtx.clearRect(0, 0, w, h);
      familyMaskCtx.fillStyle = '#fff';
      for (var maskY = -BORDER; maskY < map.height + BORDER; maskY++) {
        for (var maskX = -BORDER; maskX < map.width + BORDER; maskX++) {
          if (chars[visualGroundChar(maskX, maskY)]) {
            familyMaskCtx.fillRect(
              (maskX + BORDER) * TILE, (maskY + BORDER) * TILE, TILE, TILE);
          }
        }
      }
      familyLayerCtx.globalCompositeOperation = 'source-over';
      familyLayerCtx.clearRect(0, 0, w, h);
      painter(familyLayerCtx);
      familyLayerCtx.globalCompositeOperation = 'destination-in';
      familyLayerCtx.drawImage(familyMask, 0, 0);
      familyLayerCtx.globalCompositeOperation = 'source-over';
      c.drawImage(familyLayer, 0, 0);
    }

    // Sottobosco per masse, con vere zone negative. Sei tasche sovrapposte
    // sostituiscono centinaia di glifi indipendenti: lettiera, muschio e suolo
    // esposto raccontano umidità e stagione già nel primo read.
    if (map.id === 'woods') {
      paintThroughMask({ g: 1, '.': 1 }, function (fc) {
        var forestMasses = [
          [4.4, 4.7, 4.1, 2.7, -0.22], [23.1, 4.8, 4.7, 2.5, 0.18],
          [5.3, 12.5, 5.0, 3.1, 0.12], [22.7, 11.8, 4.2, 3.4, -0.16],
          [5.2, 19.0, 4.5, 2.5, -0.1], [22.8, 18.7, 4.9, 2.7, 0.2],
          // Trail-edge ecology at the two fixed gameplay views. Paired
          // shoulders preserve a calm walkable spine between them.
          [12.05, 19.35, 2.65, 1.42, -0.26],
          [16.85, 18.75, 3.15, 1.58, 0.2],
          [11.9, 14.15, 2.78, 1.46, 0.16],
          [17.05, 13.55, 3.0, 1.64, -0.21],
          [12.15, 9.35, 2.45, 1.28, -0.18],
          [16.65, 8.85, 2.62, 1.34, 0.2]
        ];
        forestMasses.forEach(function (mass, massIndex) {
          var mx = (mass[0] + BORDER) * TILE;
          var my = (mass[1] + BORDER) * TILE;
          var useMoss = massIndex % 3 === 1;
          var trailPocket = massIndex >= 6;
          var centerColor = trailPocket
            ? (autumn
              ? (useMoss
                ? 'rgba(74,75,39,0.54)' : 'rgba(139,88,40,0.62)')
              : (style.wet
                ? (useMoss
                  ? 'rgba(29,72,49,0.58)' : 'rgba(88,61,39,0.6)')
                : (useMoss
                  ? 'rgba(51,83,50,0.46)' : 'rgba(110,76,43,0.5)')))
            : (useMoss
            ? (autumn ? 'rgba(70,72,38,0.36)' :
              (style.wet ? 'rgba(28,67,48,0.45)' : 'rgba(48,77,48,0.36)'))
            : (autumn ? 'rgba(121,82,42,0.58)' :
              (style.wet ? 'rgba(63,55,39,0.47)' : 'rgba(92,69,44,0.44)')));
          var midColor = trailPocket
            ? (autumn
              ? (useMoss
                ? 'rgba(70,72,38,0.29)' : 'rgba(130,83,40,0.34)')
              : (style.wet
                ? (useMoss
                  ? 'rgba(30,69,48,0.31)' : 'rgba(79,58,39,0.34)')
                : (useMoss
                  ? 'rgba(50,80,49,0.25)' : 'rgba(102,72,43,0.28)')))
            : (useMoss
            ? (autumn ? 'rgba(70,72,38,0.2)' :
              (style.wet ? 'rgba(28,67,48,0.24)' : 'rgba(48,77,48,0.2)'))
            : (autumn ? 'rgba(121,82,42,0.3)' :
              (style.wet ? 'rgba(63,55,39,0.25)' : 'rgba(92,69,44,0.23)')));
          fc.save();
          fc.translate(mx, my);
          fc.rotate(mass[4]);
          fc.scale(1, mass[3] / mass[2]);
          var forestGradient = fc.createRadialGradient(
            0, 0, mass[2] * TILE * 0.08,
            0, 0, mass[2] * TILE);
          forestGradient.addColorStop(0, centerColor);
          forestGradient.addColorStop(0.58, midColor);
          forestGradient.addColorStop(1, 'rgba(0,0,0,0)');
          fc.fillStyle = forestGradient;
          fc.beginPath();
          fc.arc(0, 0, mass[2] * TILE, 0, Math.PI * 2);
          fc.fill();
          fc.restore();
        });

        // Needle beds and decomposed litter form a handful of long authored
        // windrows. Curves vary in length and direction, so they read as
        // material accumulation rather than repeated decals.
        var forestWindrows = [
          [10.6, 20.1, 12.0, 19.3, 13.1, 18.85, 8.5],
          [16.0, 20.05, 17.0, 19.45, 18.5, 18.9, 7.0],
          [10.5, 15.25, 11.8, 14.1, 13.15, 13.75, 8.0],
          [15.85, 15.0, 17.15, 14.15, 18.15, 13.15, 6.6],
          [11.15, 10.9, 12.0, 9.9, 13.25, 9.25, 6.2],
          [15.8, 10.15, 17.0, 9.55, 18.05, 8.75, 5.6]
        ];
        fc.save();
        fc.lineCap = 'round';
        forestWindrows.forEach(function (row, rowIndex) {
          fc.beginPath();
          fc.moveTo(
            (row[0] + BORDER) * TILE,
            (row[1] + BORDER) * TILE);
          fc.quadraticCurveTo(
            (row[2] + BORDER) * TILE,
            (row[3] + BORDER) * TILE,
            (row[4] + BORDER) * TILE,
            (row[5] + BORDER) * TILE);
          fc.lineWidth = row[6];
          fc.strokeStyle = rowIndex % 3 === 1
            ? (style.wet ? 'rgba(37,67,48,0.42)' : 'rgba(71,78,50,0.36)')
            : (autumn
              ? 'rgba(137,86,39,0.58)'
              : (style.wet
                ? 'rgba(85,62,39,0.48)'
                : 'rgba(112,77,43,0.42)'));
          fc.stroke();
        });
        fc.restore();
      });
    } else if (map.id === 'town') {
      // Il prato cittadino usa isole a scala-mondo, non glifi per tile. Attorno
      // all'ingresso sud lasciano grandi pause verdi ma danno al primo piano
      // una gerarchia broad/meso. In autunno le stesse masse diventano suolo
      // secco e lettiera, anziché una semplice tinta oliva globale.
      paintThroughMask({ '.': 1, ',': 1 }, function (fc) {
        var townMasses = [
          [10.9, 3.0, 3.8, 1.45, -0.04],
          [18, 10, 5.4, 2.4, -0.16], [37, 10, 4.8, 2.1, 0.12],
          [42.2, 8.55, 4.7, 2.05, -0.08],
          [38.65, 11.05, 3.9, 1.68, 0.17],
          [46.2, 11.1, 3.7, 1.55, -0.2],
          [16.55, 29.15, 4.25, 1.82, 0.12],
          [20.8, 28.1, 4.8, 2.25, 0.12], [36.7, 27.7, 4.3, 2.1, -0.16],
          [23.4, 33.0, 3.9, 1.6, -0.08], [39.2, 32.1, 4.7, 1.9, 0.14],
          [32.9, 30.75, 4.9, 2.15, -0.1],
          [35.1, 33.0, 4.2, 1.55, 0.12]
        ];
        townMasses.forEach(function (mass, massIndex) {
          // Autumn uses continuous wind-shaped fields below. Suppressing the
          // individual radial masses removes the repeated soft-oval read,
          // while leaving summer/wet captures byte-for-byte on their old path.
          if (autumn) return;
          fc.save();
          fc.translate((mass[0] + BORDER) * TILE, (mass[1] + BORDER) * TILE);
          fc.rotate(mass[4]);
          fc.scale(1, mass[3] / mass[2]);
          var townGradient = fc.createRadialGradient(
            0, 0, mass[2] * TILE * 0.06,
            0, 0, mass[2] * TILE);
          townGradient.addColorStop(0, massIndex % 2
            ? 'rgba(45,88,52,0.25)' : 'rgba(122,108,54,0.24)');
          townGradient.addColorStop(0.58, massIndex % 2
            ? 'rgba(39,77,50,0.14)' : 'rgba(112,94,49,0.13)');
          townGradient.addColorStop(1, 'rgba(0,0,0,0)');
          fc.fillStyle = townGradient;
          fc.beginPath();
          fc.arc(0, 0, mass[2] * TILE, 0, Math.PI * 2);
          fc.fill();
          fc.restore();
        });

        // Broad autumn fields follow wind and drainage across several tiles.
        // They overlap at low opacity instead of exposing radial decal edges.
        // A few individually authored leaves provide the only high-frequency
        // accents; no cluster reuses a stamp or a generated offset pattern.
        if (autumn) {
          var autumnFields = [
            [13.8, 32.0, 23.5, 27.7, 34.2, 33.0, 47.8, 28.6, 5.2, 0],
            [16.5, 35.1, 26.4, 30.3, 37.0, 35.0, 48.2, 31.4, 3.8, 1],
            [28.2, 24.8, 35.4, 27.2, 40.8, 27.8, 49.0, 26.5, 3.1, 2],
            [9.5, 4.3, 22.5, 8.4, 35.0, 6.4, 49.2, 10.1, 4.2, 1]
          ];
          fc.save();
          fc.lineCap = 'round';
          fc.filter = 'blur(' + (TILE * 0.92) + 'px)';
          autumnFields.forEach(function (field) {
            var fieldPalette = [
              ['rgba(141,101,44,0.085)', 'rgba(109,78,40,0.045)'],
              ['rgba(93,76,42,0.08)', 'rgba(158,116,51,0.04)'],
              ['rgba(169,125,52,0.07)', 'rgba(113,83,43,0.036)']
            ][field[9]];
            fc.beginPath();
            fc.moveTo(
              (field[0] + BORDER) * TILE,
              (field[1] + BORDER) * TILE);
            fc.bezierCurveTo(
              (field[2] + BORDER) * TILE,
              (field[3] + BORDER) * TILE,
              (field[4] + BORDER) * TILE,
              (field[5] + BORDER) * TILE,
              (field[6] + BORDER) * TILE,
              (field[7] + BORDER) * TILE);
            fc.lineWidth = field[8] * TILE;
            fc.strokeStyle = fieldPalette[0];
            fc.stroke();
            fc.lineWidth = field[8] * TILE * 0.46;
            fc.strokeStyle = fieldPalette[1];
            fc.stroke();
          });
          fc.restore();

          var sparseLeaves = [
            [20.35, 32.9, 2.3, 1.05, -0.38, '#805126'],
            [22.1, 33.25, 1.45, 0.78, 0.62, '#a46b2b'],
            [24.4, 31.72, 1.85, 0.88, -0.92, '#6f4c29'],
            [29.75, 31.08, 1.2, 0.65, 0.28, '#b0782f'],
            [32.65, 32.3, 2.05, 0.82, 1.03, '#895322'],
            [35.18, 31.44, 1.38, 0.7, -0.16, '#b37a33'],
            [37.95, 29.18, 1.7, 0.76, 0.78, '#744927'],
            [39.46, 28.42, 1.08, 0.62, -0.72, '#a56a2d'],
            [34.28, 27.35, 1.55, 0.74, 0.42, '#875327'],
            [41.72, 31.02, 2.2, 0.9, -1.08, '#a36b2f'],
            [18.62, 30.55, 1.12, 0.58, 0.12, '#704a28']
          ];
          sparseLeaves.forEach(function (leaf) {
            fc.save();
            fc.translate(
              (leaf[0] + BORDER) * TILE,
              (leaf[1] + BORDER) * TILE);
            fc.rotate(leaf[4]);
            fc.fillStyle = leaf[5];
            fc.globalAlpha = 0.48;
            fc.beginPath();
            fc.ellipse(0, 0, leaf[2], leaf[3], 0, 0, Math.PI * 2);
            fc.fill();
            fc.restore();
          });
        } else {
          // Short curved verges follow the road drainage and rain-garden
          // shoulder. Broad colour comes from overlapping soft masses above,
          // so no straight band crosses the field.
          var welcomeVerges = [
            [30.25, 27.2, 30.8, 29.6, 30.35, 32.7, 5.6],
            [32.25, 32.5, 34.0, 31.35, 36.0, 31.0, 4.8],
            [37.1, 28.8, 38.35, 28.0, 39.4, 28.65, 3.8]
          ];
          fc.save();
          fc.lineCap = 'round';
          welcomeVerges.forEach(function (verge, vergeIndex) {
            fc.beginPath();
            fc.moveTo(
              (verge[0] + BORDER) * TILE,
              (verge[1] + BORDER) * TILE);
            fc.quadraticCurveTo(
              (verge[2] + BORDER) * TILE,
              (verge[3] + BORDER) * TILE,
              (verge[4] + BORDER) * TILE,
              (verge[5] + BORDER) * TILE);
            fc.lineWidth = verge[6];
            fc.strokeStyle = vergeIndex % 2
              ? (style.wet
                ? 'rgba(39,83,48,0.24)'
                : 'rgba(89,103,55,0.2)')
              : 'rgba(119,100,48,0.18)';
            fc.stroke();
          });
          fc.restore();
        }
      });
    }

    // Weather is localized as hydrology, not a full-scene gloss. Wet frames
    // collect in three depressions and along one runoff verge; dry frames keep
    // a lighter compacted shoulder in the same places.
    if (map.id === 'town') {
      paintThroughMask({ '.': 1, ',': 1 }, function (fc) {
        var weatherPockets = [
          [33.8, 30.45, 3.4, 1.45, -0.16],
          // A compact damp threshold, not the former detached brown slab.
          [41.92, 7.62, 0.7, 0.34, -0.12],
          [16.1, 29.15, 2.8, 1.15, -0.08]
        ];
        weatherPockets.forEach(function (pocket, pocketIndex) {
          fc.save();
          fc.translate(
            (pocket[0] + BORDER) * TILE,
            (pocket[1] + BORDER) * TILE);
          fc.rotate(pocket[4]);
          fc.scale(1, pocket[3] / pocket[2]);
          var weatherGradient = fc.createRadialGradient(
            0, 0, TILE * 0.2, 0, 0, pocket[2] * TILE);
          if (style.wet) {
            weatherGradient.addColorStop(0, pocketIndex === 2
              ? 'rgba(46,55,37,0.34)' : 'rgba(29,64,47,0.32)');
            weatherGradient.addColorStop(0.62, pocketIndex === 2
              ? 'rgba(64,66,39,0.17)' : 'rgba(38,74,51,0.14)');
          } else {
            weatherGradient.addColorStop(0,
              'rgba(154,125,65,0.2)');
            weatherGradient.addColorStop(0.62,
              'rgba(137,111,58,0.09)');
          }
          weatherGradient.addColorStop(1, 'rgba(0,0,0,0)');
          fc.fillStyle = weatherGradient;
          fc.beginPath();
          fc.arc(0, 0, pocket[2] * TILE, 0, Math.PI * 2);
          fc.fill();
          fc.restore();
        });
        if (style.wet) {
          fc.save();
          fc.lineCap = 'round';
          fc.beginPath();
          fc.moveTo((35.8 + BORDER) * TILE, (29.6 + BORDER) * TILE);
          fc.bezierCurveTo(
            (34.6 + BORDER) * TILE, (30.2 + BORDER) * TILE,
            (32.4 + BORDER) * TILE, (31.7 + BORDER) * TILE,
            (30.15 + BORDER) * TILE, (32.75 + BORDER) * TILE);
          fc.strokeStyle = 'rgba(30,59,45,0.4)';
          fc.lineWidth = TILE * 0.2;
          fc.stroke();
          fc.strokeStyle = 'rgba(115,137,111,0.18)';
          fc.lineWidth = TILE * 0.055;
          fc.stroke();
          fc.restore();
        }
      });
    }

    // Il lago riceve mensole fangose discontinue, erosione e muschio in
    // posizioni authored. Non esiste più un contorno concentrico: lunghi
    // intervalli di prato arrivano direttamente all'acqua. La superficie
    // liquida e le sue regole restano completamente invariate.
    if (map.id === 'town') {
      tileRects(map, 'w').forEach(function (rc) {
        var halfX = rc.w / 2, halfZ = rc.h / 2;
        var centerX = (rc.x + halfX + BORDER) * TILE;
        var centerY = (rc.y + halfZ + BORDER) * TILE;
        var lakeSeed = rc.x * 31 + rc.y * 17;
        var lakeShelves = [
          [2.78, 0.38, 2.45, 0.92, -0.18, 0],
          [2.28, 0.3, 1.7, 0.68, 0.26, 1],
          [4.56, 0.28, 1.8, 0.64, 0.22, 1],
          [5.02, 0.2, 1.18, 0.48, -0.18, 2]
        ];
        lakeShelves.forEach(function (shelf, shelfIndex) {
          var angle = shelf[0];
          var edge = liquidRectRadius(angle, halfX, halfZ) -
            liquidRightCornerChamfer(angle, halfX, halfZ);
          var radial = edge + shelf[1] +
            liquidEdgeNoise(angle, lakeSeed) * 0.42;
          var shelfX = centerX + Math.cos(angle) * radial * TILE;
          var shelfY = centerY + Math.sin(angle) * radial * TILE;
          c.save();
          c.translate(shelfX, shelfY);
          c.rotate(angle + Math.PI * 0.5 + shelf[4]);
          c.scale(1, shelf[3] / shelf[2]);
          var shelfRadius = shelf[2] * TILE;
          var shelfGradient = c.createRadialGradient(
            0, 0, shelfRadius * 0.08,
            0, 0, shelfRadius);
          shelfGradient.addColorStop(0, style.wet
            ? (shelf[5] === 1
              ? 'rgba(43,70,45,0.3)' : 'rgba(69,57,36,0.32)')
            : (shelf[5] === 1
              ? 'rgba(83,95,54,0.28)' : 'rgba(127,88,43,0.3)'));
          shelfGradient.addColorStop(0.58, style.wet
            ? 'rgba(57,65,40,0.11)' : 'rgba(113,86,46,0.1)');
          shelfGradient.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = shelfGradient;
          c.beginPath();
          c.arc(0, 0, shelfRadius, 0, Math.PI * 2);
          c.fill();
          c.restore();
        });

        // A short rain-fed west channel stays physically attached to the
        // bank. The former broad south stroke floated below the shoreline in
        // the audit camera and has deliberately been removed.
        c.save();
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(
          centerX - halfX * TILE * 0.98,
          centerY - halfZ * TILE * 0.42);
        c.bezierCurveTo(
          centerX - halfX * TILE * 1.18,
          centerY - halfZ * TILE * 0.08,
          centerX - halfX * TILE * 1.28,
          centerY + halfZ * TILE * 0.24,
          centerX - halfX * TILE * 1.45,
          centerY + halfZ * TILE * 0.52);
        c.strokeStyle = style.wet
          ? 'rgba(35,66,46,0.18)' : 'rgba(93,99,55,0.15)';
        c.lineWidth = TILE * 0.11;
        c.stroke();
        c.restore();
      });
    }

    // Raccordo cascata: quattro spalle morbide e interrotte, non una lastra
    // centrale. Essendo baked nell'albedo non esistono superfici coplanari.
    if (map.id === 'town') {
      (map.objects || []).forEach(function (object) {
        if (object.type !== 'landmark' || object.kind !== 'waterfall') return;
        var fallX = (object.x + object.w * 0.5 + BORDER) * TILE;
        var fallY = (object.y + 1.5 + BORDER) * TILE;
        var shoulderSpecs = [
          [-0.49, -0.18, 0.38, 1.58, -0.16, 0],
          [0.5, -0.08, 0.36, 1.48, 0.14, 1],
          [-0.4, 0.9, 0.3, 0.76, -0.24, 2],
          [0.42, 0.8, 0.31, 0.7, 0.2, 3],
          [-0.62, 0.42, 0.2, 0.64, 0.1, 4],
          [0.61, 0.36, 0.18, 0.58, -0.12, 5]
        ];
        shoulderSpecs.forEach(function (shoulder) {
          c.save();
          c.translate(
            fallX + object.w * TILE * shoulder[0],
            fallY + TILE * shoulder[1]);
          c.rotate(shoulder[4]);
          c.scale(1, shoulder[3] / (object.w * shoulder[2]));
          var shoulderRadius = object.w * TILE * shoulder[2];
          var shoulderGradient = c.createRadialGradient(
            0, 0, shoulderRadius * 0.08,
            0, 0, shoulderRadius);
          shoulderGradient.addColorStop(0, style.wet
            ? (shoulder[5] < 2
              ? 'rgba(38,61,43,0.36)' : 'rgba(69,68,43,0.3)')
            : 'rgba(98,82,47,0.3)');
          shoulderGradient.addColorStop(0.52, style.wet
            ? 'rgba(45,68,47,0.14)' : 'rgba(104,84,49,0.12)');
          shoulderGradient.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = shoulderGradient;
          c.beginPath();
          c.arc(0, 0, shoulderRadius, 0, Math.PI * 2);
          c.fill();
          c.restore();
        });
      });
    }

    // Sentieri: un'unica rete stratificata attraversa i centri logici.
    // Spalla, piano compattato e centro consumato hanno larghezze differenti;
    // il footprint collisionale continua a essere esattamente un tile.
    function pathPoint(px, py) {
      var pointSeed = treeVisualSeed(px + 311, py + 577);
      var lateralAmplitude = map.id === 'woods' ? 5.2 : 2.4;
      var longDrift = Math.sin(py * 0.54 + px * 0.17 + map.width) +
        Math.sin(py * 0.19 - px * 0.31) * 0.48;
      return {
        x: (px + BORDER + 0.5) * TILE +
          longDrift * lateralAmplitude +
          (((pointSeed >>> 7) & 31) / 31 - 0.5) * 1.2,
        y: (py + BORDER + 0.5) * TILE +
          Math.sin(px * 0.63 + py * 0.13) * 1.3 +
          (((pointSeed >>> 17) & 31) / 31 - 0.5) * 0.8
      };
    }
    function strokePathNetwork(color, width) {
      c.strokeStyle = color;
      c.fillStyle = color;
      c.lineWidth = width;
      for (var pathY = 0; pathY < map.height; pathY++) {
        for (var pathX = 0; pathX < map.width; pathX++) {
          if (map.rows[pathY].charAt(pathX) !== 'p') continue;
          var point = pathPoint(pathX, pathY);
          c.beginPath();
          c.arc(point.x, point.y, width * 0.49, 0, Math.PI * 2);
          c.fill();
          if (pathX + 1 < map.width &&
              map.rows[pathY].charAt(pathX + 1) === 'p') {
            var rightPoint = pathPoint(pathX + 1, pathY);
            c.beginPath();
            c.moveTo(point.x, point.y);
            c.lineTo(rightPoint.x, rightPoint.y);
            c.stroke();
          }
          if (pathY + 1 < map.height &&
              map.rows[pathY + 1].charAt(pathX) === 'p') {
            var downPoint = pathPoint(pathX, pathY + 1);
            c.beginPath();
            c.moveTo(point.x, point.y);
            c.lineTo(downPoint.x, downPoint.y);
            c.stroke();
          }
        }
      }
    }
    c.save();
    c.lineCap = 'round';
    c.lineJoin = 'round';
    strokePathNetwork(
      style.wet ? 'rgba(82,78,60,0.26)' :
        (autumn ? 'rgba(126,96,58,0.28)' : 'rgba(147,119,78,0.25)'),
      TILE * 1.06);
    strokePathNetwork(
      style.wet ? 'rgba(155,143,109,0.88)' :
        (autumn ? 'rgba(191,158,96,0.84)' : 'rgba(202,181,132,0.82)'),
      TILE * 0.82);
    strokePathNetwork(
      style.wet ? 'rgba(96,85,62,0.18)' :
        (autumn ? 'rgba(132,93,48,0.2)' : 'rgba(155,123,72,0.17)'),
      TILE * 0.13);
    c.restore();

    if (map.id === 'town') {
      // Palmer approach: compression varies in broad, soft episodes instead
      // of following the whole ribbon uniformly.
      paintThroughMask({ p: 1 }, function (fc) {
        var palmerWear = [
          [42.5, 7.72, 0.56, 0.72, -0.04]
        ];
        palmerWear.forEach(function (wear, wearIndex) {
          fc.save();
          fc.translate(
            (wear[0] + BORDER) * TILE,
            (wear[1] + BORDER) * TILE);
          fc.rotate(wear[4]);
          fc.scale(1, wear[3] / wear[2]);
          var wearGradient = fc.createRadialGradient(
            0, 0, 1, 0, 0, wear[2] * TILE);
          wearGradient.addColorStop(0, style.wet
            ? (wearIndex === 1
              ? 'rgba(73,60,39,0.58)' : 'rgba(80,67,43,0.48)')
            : 'rgba(133,94,49,0.42)');
          wearGradient.addColorStop(0.66, style.wet
            ? 'rgba(105,86,54,0.23)' : 'rgba(158,117,66,0.18)');
          wearGradient.addColorStop(1, 'rgba(0,0,0,0)');
          fc.fillStyle = wearGradient;
          fc.beginPath();
          fc.arc(0, 0, wear[2] * TILE, 0, Math.PI * 2);
          fc.fill();
          fc.restore();
        });
      });
      paintThroughMask({ '.': 1, ',': 1 }, function (fc) {
        // Two short verge notes and one soft soil compression remain attached
        // to the doorstep. Nothing extends into a rectangular planting slab.
        var palmerEdges = [
          [41.86, 7.45, 41.5, 7.62, 41.2, 8.02, 2.8],
          [43.14, 7.48, 43.46, 7.66, 43.68, 7.96, 2.2]
        ];
        fc.save();
        fc.lineCap = 'round';
        palmerEdges.forEach(function (edge, edgeIndex) {
          fc.beginPath();
          fc.moveTo(
            (edge[0] + BORDER) * TILE,
            (edge[1] + BORDER) * TILE);
          fc.quadraticCurveTo(
            (edge[2] + BORDER) * TILE,
            (edge[3] + BORDER) * TILE,
            (edge[4] + BORDER) * TILE,
            (edge[5] + BORDER) * TILE);
          fc.lineWidth = edge[6];
          fc.strokeStyle = style.wet
            ? 'rgba(38,78,44,0.28)' : 'rgba(76,101,52,0.24)';
          fc.stroke();
        });
        fc.beginPath();
        fc.moveTo(
          (41.82 + BORDER) * TILE,
          (7.5 + BORDER) * TILE);
        fc.bezierCurveTo(
          (41.55 + BORDER) * TILE, (7.42 + BORDER) * TILE,
          (41.18 + BORDER) * TILE, (7.58 + BORDER) * TILE,
          (40.92 + BORDER) * TILE, (7.86 + BORDER) * TILE);
        fc.strokeStyle = style.wet
          ? 'rgba(72,57,36,0.28)' : 'rgba(126,84,42,0.23)';
        fc.lineWidth = TILE * 0.28;
        fc.stroke();
        fc.beginPath();
        fc.moveTo(
          (41.76 + BORDER) * TILE,
          (7.55 + BORDER) * TILE);
        fc.quadraticCurveTo(
          (41.4 + BORDER) * TILE,
          (7.48 + BORDER) * TILE,
          (41.08 + BORDER) * TILE,
          (7.78 + BORDER) * TILE);
        fc.strokeStyle = style.wet
          ? 'rgba(45,91,48,0.48)' : 'rgba(81,107,54,0.42)';
        fc.lineWidth = 2.4;
        fc.stroke();
        fc.restore();
      });
    } else if (map.id === 'woods') {
      // Three path-wear episodes line up with entry, grove and oil clearing.
      // Their varying proportions preserve navigation while giving the trail
      // a history of footfall, saturated soil and exposed roots.
      paintThroughMask({ p: 1 }, function (fc) {
        var trailWear = [
          [14.52, 19.25, 0.78, 2.0, -0.03],
          [14.42, 14.15, 0.82, 2.25, 0.04],
          [14.55, 9.35, 0.74, 1.65, -0.07]
        ];
        trailWear.forEach(function (wear, wearIndex) {
          fc.save();
          fc.translate(
            (wear[0] + BORDER) * TILE,
            (wear[1] + BORDER) * TILE);
          fc.rotate(wear[4]);
          fc.scale(1, wear[3] / wear[2]);
          var trailGradient = fc.createRadialGradient(
            0, 0, 1, 0, 0, wear[2] * TILE);
          trailGradient.addColorStop(0, style.wet
            ? (wearIndex === 1
              ? 'rgba(49,47,35,0.76)' : 'rgba(57,52,37,0.7)')
            : 'rgba(118,83,46,0.48)');
          trailGradient.addColorStop(0.68, style.wet
            ? 'rgba(82,69,46,0.4)' : 'rgba(151,111,65,0.2)');
          trailGradient.addColorStop(1, 'rgba(0,0,0,0)');
          fc.fillStyle = trailGradient;
          fc.beginPath();
          fc.arc(0, 0, wear[2] * TILE, 0, Math.PI * 2);
          fc.fill();
          fc.restore();
        });
        var rootCrossings = [
          [14.08, 18.55, 14.48, 18.36, 14.92, 18.63, 2.6],
          [14.02, 15.18, 14.47, 15.43, 14.98, 15.1, 3.2],
          [14.08, 12.72, 14.55, 12.45, 14.95, 12.78, 2.3],
          [14.12, 9.98, 14.46, 10.17, 14.9, 9.9, 2.8]
        ];
        fc.save();
        fc.lineCap = 'round';
        rootCrossings.forEach(function (root, rootIndex) {
          fc.beginPath();
          fc.moveTo(
            (root[0] + BORDER) * TILE,
            (root[1] + BORDER) * TILE);
          fc.quadraticCurveTo(
            (root[2] + BORDER) * TILE,
            (root[3] + BORDER) * TILE,
            (root[4] + BORDER) * TILE,
            (root[5] + BORDER) * TILE);
          fc.lineWidth = root[6];
          fc.strokeStyle = rootIndex % 2
            ? 'rgba(70,53,35,0.78)'
            : 'rgba(111,82,49,0.68)';
          fc.stroke();
        });
        fc.restore();
      });
    }

    // Basi e ombre di contatto sono parte dell'albedo del terreno: niente
    // decal coplanari, z-fighting o piedini che sembrano appoggiati sul piano.
    var groundedChars = {
      S: 1, G: 1, L: 1, P: 1, B: 1, F: 1, A: 1, H: 1, E: 1, n: 1
    };
    for (var groundY = 0; groundY < map.height; groundY++) {
      for (var groundX = 0; groundX < map.width; groundX++) {
        var grounded = map.rows[groundY].charAt(groundX);
        if (!groundedChars[grounded]) continue;
        var groundSeed = treeVisualSeed(groundX + 491, groundY + 283);
        c.save();
        c.translate(
          (groundX + BORDER + 0.5) * TILE,
          (groundY + BORDER + 0.57) * TILE);
        c.rotate((((groundSeed >>> 11) & 31) / 31 - 0.5) * 0.32);
        c.scale(grounded === 'F' ? 1.2 : 1, grounded === 'F' ? 0.44 : 0.56);
        var contact = c.createRadialGradient(0, 0, 0, 0, 0, TILE * 0.68);
        contact.addColorStop(0, style.wet
          ? 'rgba(29,38,30,0.38)' : 'rgba(61,51,34,0.3)');
        contact.addColorStop(0.58, style.wet
          ? 'rgba(42,53,39,0.2)' : 'rgba(89,72,43,0.14)');
        contact.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = contact;
        c.beginPath();
        c.arc(0, 0, TILE * 0.68, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }
    scanBuildings(map).forEach(function (building) {
      c.save();
      c.strokeStyle = style.wet
        ? 'rgba(40,46,37,0.14)' : 'rgba(83,65,41,0.12)';
      c.lineWidth = TILE * 0.16;
      c.lineJoin = 'round';
      c.strokeRect(
        (building.bx + BORDER) * TILE - TILE * 0.025,
        (building.by + BORDER) * TILE - TILE * 0.025,
        building.bw * TILE + TILE * 0.05,
        building.bh * TILE + TILE * 0.05);
      c.restore();
    });

    // Dettagli rari, raggruppati per valore. Il volume 3D porta il read vicino;
    // l'albedo non deve tornare a essere un campo uniforme di simboli.
    function grassAt(px, py) {
      var tx = Math.floor(px / TILE) - BORDER, ty = Math.floor(py / TILE) - BORDER;
      var ch = visualGroundChar(tx, ty);
      return ch === '.' || ch === 'g';
    }
    var dark = map.id === 'woods';
    var n = Math.floor(map.width * map.height *
      (map.id === 'woods' ? 0.004 : 0.006));
    for (i = 0; i < n; i++) {
      var detailX = Math.floor(rnd() * w), detailY = Math.floor(rnd() * h);
      if (!grassAt(detailX, detailY)) continue;
      var kind = rnd();
      if (kind < 0.5) {
        c.fillStyle = dark ? '#29402d' : '#6f8f4f';
        c.fillRect(detailX, detailY - 2, 1, 3);
        c.fillRect(detailX + 2, detailY - 1, 1, 2);
        c.fillStyle = dark ? '#3f6041' : '#87a65f';
        c.fillRect(detailX + 1, detailY - 3, 1, 2);
      } else if (kind < 0.72) {
        c.fillStyle = 'rgba(0,0,0,0.10)'; c.fillRect(detailX, detailY + 1, 3, 1);
        c.fillStyle = dark ? '#465046' : '#879078'; c.fillRect(detailX, detailY, 2, 2);
        c.fillStyle = dark ? '#5b6656' : '#9aa083'; c.fillRect(detailX, detailY, 1, 1);
      } else {
        c.fillStyle = dark ? 'rgba(0,0,0,0.14)' : 'rgba(90,110,60,0.22)';
        c.fillRect(detailX, detailY, 3, 2);
      }
    }
  }

  // celle interne (pavimento/tappeto/arredo/porta/statua) da dipingere sulle mappe indoor;
  // le altre celle (muri i/R e tutto ciò che sta oltre il perimetro) restano nel vuoto scenico
  var INDOOR_FLOOR = { f: 1, c: 1, C: 1, t: 1, h: 1, K: 1, U: 1, D: 1, Z: 1, M: 1 };
  var VOID_COLOR = '#121b22';

  function groundSurfaceData(map, style) {
    style = style || { season: 'summer', wet: false };
    var key = 'ground_maps_' + map.id + '_' + map.width + 'x' + map.height +
      '_' + style.season + '_' + (style.wet ? 'wet' : 'dry');
    if (dataTexCache[key]) return dataTexCache[key];
    // Four samples/tile plus continuous value fields survive linear mipmapped
    // minification without banding. Keeping original resolution protects cold
    // map-build cost; indoor bump remains disabled.
    var scale = 4;
    var width = (map.width + BORDER * 2) * scale;
    var height = (map.height + BORDER * 2) * scale;
    var roughCv = document.createElement('canvas');
    var bumpCv = document.createElement('canvas');
    roughCv.width = bumpCv.width = width;
    roughCv.height = bumpCv.height = height;
    var roughCtx = roughCv.getContext('2d');
    var bumpCtx = bumpCv.getContext('2d');
    var roughImage = roughCtx.createImageData(width, height);
    var bumpImage = bumpCtx.createImageData(width, height);

    function noiseAt(x, y) {
      var h = Math.imul(x + 0x9e3779b9, 0x85ebca6b) ^
        Math.imul(y + 0xc2b2ae35, 0x27d4eb2d);
      h ^= h >>> 15;
      return (h & 255) / 255 - 0.5;
    }

    function makeNoiseField(cell, salt) {
      var worldWidth = width / scale;
      var worldHeight = height / scale;
      var columns = Math.ceil(worldWidth / cell) + 2;
      var rows = Math.ceil(worldHeight / cell) + 2;
      var values = new Float32Array(columns * rows);
      for (var fy = 0; fy < rows; fy++) {
        for (var fx = 0; fx < columns; fx++) {
          values[fy * columns + fx] = noiseAt(fx + salt, fy - salt);
        }
      }
      return {
        sample: function (x, y) {
          var gx = x / cell;
          var gy = y / cell;
          var x0 = Math.floor(gx), y0 = Math.floor(gy);
          var tx = gx - x0, ty = gy - y0;
          tx = tx * tx * (3 - 2 * tx);
          ty = ty * ty * (3 - 2 * ty);
          var at = y0 * columns + x0;
          var a = values[at];
          var b = values[at + 1];
          var d = values[at + columns];
          var e = values[at + columns + 1];
          return (a + (b - a) * tx) * (1 - ty) + (d + (e - d) * tx) * ty;
        }
      };
    }
    var macroField = makeNoiseField(5.6, 17);
    var middleField = makeNoiseField(1.85, 43);

    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var tx = Math.floor(x / scale) - BORDER;
        var ty = Math.floor(y / scale) - BORDER;
        var inBounds = tx >= 0 && ty >= 0 && tx < map.width && ty < map.height;
        var ch = inBounds || !map.indoor ? chAt(map, tx, ty) : 'void';
        var roughness = 220, bump = 128, bumpAmplitude = 5;
        if (ch === 'r' || ch === '-' || ch === '=') {
          roughness = style.wet ? 96 : 138; bumpAmplitude = 4;
        } else if (ch === 'p') {
          roughness = style.wet ? 160 :
            (style.season === 'autumn' ? 204 : 184);
          bumpAmplitude = style.season === 'autumn' && !style.wet ? 14 : 10;
        } else if (ch === '.' || ch === 'g' || ch === ',') {
          roughness = map.id === 'woods' ? 238 : 230;
          if (style.wet) roughness -= 7;
          else if (style.season === 'autumn') roughness += 6;
          bumpAmplitude = style.season === 'autumn' && !style.wet ? 22 : 18;
        } else if (ch === 'c' || ch === 'C') {
          roughness = 246; bumpAmplitude = 4;
        } else if (ch === 'f' || ch === 't' || ch === 'h' || ch === 'K' || ch === 'U') {
          roughness = 202; bumpAmplitude = 7;
          // La venatura ad alta frequenza produceva un comb orizzontale quando
          // il piano interno veniva visto in forte minificazione prospettica.
          // Il colore baked contiene già tavole e fughe: il data-map indoor
          // deve solo differenziare le famiglie di superficie.
          if (!map.indoor) bump += Math.sin((x + tx * 3) * 1.35) * 5;
        } else if (map.indoor && (ch === 'Z' || ch === 'M')) {
          roughness = 220; bumpAmplitude = 0;
        } else if (ch === 'void') {
          roughness = 238; bumpAmplitude = 2;
        }
        var worldX = x / scale;
        var worldY = y / scale;
        var macro = map.indoor ? 0 : macroField.sample(worldX, worldY);
        var middle = map.indoor ? 0 : middleField.sample(worldX, worldY);
        var broad = macro * 10 + middle * 4;
        var roughNoise = map.indoor
          ? noiseAt(tx, ty) * 2
          : macro * 7 + middle * 5 + noiseAt(x, y) * 2;
        roughness = Math.max(72, Math.min(250,
          roughness + broad + roughNoise));
        bump = map.indoor ? 128 : Math.max(88, Math.min(168,
          bump + macro * bumpAmplitude * 0.48 +
          middle * bumpAmplitude * 0.64 +
          noiseAt(x + 91, y + 47) * bumpAmplitude * 0.16));
        var at = (y * width + x) * 4;
        roughImage.data[at] = roughImage.data[at + 1] =
          roughImage.data[at + 2] = roughness;
        roughImage.data[at + 3] = 255;
        bumpImage.data[at] = bumpImage.data[at + 1] =
          bumpImage.data[at + 2] = bump;
        bumpImage.data[at + 3] = 255;
      }
    }
    roughCtx.putImageData(roughImage, 0, 0);
    bumpCtx.putImageData(bumpImage, 0, 0);
    dataTexCache[key] = {
      roughness: makeAlignedDataTex(roughCv),
      // Zero upload e zero specular-frequency coupling indoors. Outdoor soil,
      // verge e asphalt keep the authored micro-relief.
      bump: map.indoor ? null : makeAlignedDataTex(bumpCv)
    };
    return dataTexCache[key];
  }

  function wetNormalTexture() {
    if (dataTexCache.wetNormal) return dataTexCache.wetNormal;
    var cv = document.createElement('canvas');
    cv.width = 128; cv.height = 128;
    var c = cv.getContext('2d');
    c.fillStyle = 'rgb(128,128,255)';
    c.fillRect(0, 0, 128, 128);
    // Archi incompleti, ampiezze e orientamenti diseguali. Cinque anelli
    // perfetti ripetuti 7x7 producevano una carta da parati speculare.
    var ripples = [
      [15, 20, 8, 0.38, -0.18, 0.12, 2.35],
      [69, 15, 15, 0.29, 0.08, 2.7, 5.55],
      [108, 52, 7, 0.5, -0.3, 0.45, 1.8],
      [39, 87, 11, 0.34, 0.2, 3.35, 6.05],
      [94, 111, 17, 0.25, -0.08, 1.3, 3.9],
      [18, 116, 6, 0.43, 0.32, 4.1, 5.65],
      [119, 91, 10, 0.31, -0.22, 2.1, 4.3]
    ];
    c.lineWidth = 1.5;
    for (var i = 0; i < ripples.length; i++) {
      var ripple = ripples[i];
      c.strokeStyle = i % 2 ? 'rgb(143,118,250)' : 'rgb(113,139,250)';
      c.beginPath();
      c.ellipse(
        ripple[0], ripple[1], ripple[2], ripple[2] * ripple[3],
        ripple[4], ripple[5], ripple[6]
      );
      c.stroke();
    }
    dataTexCache.wetNormal = makeDataTex(cv, 5.5, 5.5);
    return dataTexCache.wetNormal;
  }

  function wetRoughnessTexture() {
    if (dataTexCache.wetRoughness) return dataTexCache.wetRoughness;
    var cv = document.createElement('canvas');
    cv.width = 128; cv.height = 128;
    var c = cv.getContext('2d');
    c.fillStyle = '#a0a0a0';
    c.fillRect(0, 0, 128, 128);
    // Broad neutral-value patches break one continuous highlight into wet and
    // merely damp regions without tinting the underlying road texture.
    var patches = [
      [18, 27, 27, 12, 0.18], [82, 19, 34, 15, -0.12],
      [43, 70, 31, 18, -0.2], [104, 92, 28, 12, 0.16],
      [18, 112, 38, 13, -0.1]
    ];
    patches.forEach(function (patch) {
      var value = Math.round(160 + patch[4] * 255);
      var gradient = c.createRadialGradient(
        patch[0], patch[1], 1, patch[0], patch[1], patch[2]
      );
      gradient.addColorStop(0, 'rgb(' + value + ',' + value + ',' + value + ')');
      gradient.addColorStop(1, 'rgba(160,160,160,0)');
      c.fillStyle = gradient;
      c.beginPath();
      c.ellipse(patch[0], patch[1], patch[2], patch[3], -0.18, 0, Math.PI * 2);
      c.fill();
    });
    dataTexCache.wetRoughness = makeDataTex(cv, 3.5, 3.5);
    return dataTexCache.wetRoughness;
  }

  function bakeGround(map, world, opts) {
    var w = (map.width + BORDER * 2) * TILE, h = (map.height + BORDER * 2) * TILE;
    var cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var c = cv.getContext('2d');
    var base = world.base;
    // Un solo oggetto attraversa il wrapper del capture harness: le opzioni
    // season/wet iniettate dal test restano così disponibili anche al PBR,
    // alla pioggia e al dressing, non soltanto all'albedo.
    var terrainFlags = { map: map, woodsOpen: opts.woodsOpen };
    var x, y, ch;
    if (map.indoor) {
      // Fondale da modellino: alone ardesia sotto la stanza, raccordato al
      // colore della scena. Evita il ritaglio nero puro senza fingere altro
      // pavimento calpestabile o alterare la mappa.
      var backdropRadius = Math.max(w, h) * 0.72;
      var backdrop = c.createRadialGradient(
        w * 0.5, h * 0.52, Math.min(w, h) * 0.08,
        w * 0.5, h * 0.52, backdropRadius
      );
      backdrop.addColorStop(0, '#31414a');
      backdrop.addColorStop(0.48, '#23313a');
      backdrop.addColorStop(1, VOID_COLOR);
      c.fillStyle = backdrop;
      c.fillRect(0, 0, w, h);
      // Soft contact halo under the room footprint. Floor tiles painted below
      // overwrite the center, leaving only a controlled grounding band.
      c.save();
      c.translate(w * 0.5, h * 0.5);
      c.scale(1, 0.62);
      var contactRadius = (map.width + 3) * TILE * 0.58;
      var contact = c.createRadialGradient(
        0, 0, map.width * TILE * 0.34,
        0, 0, contactRadius
      );
      contact.addColorStop(0, 'rgba(0,0,0,0.42)');
      contact.addColorStop(0.68, 'rgba(0,0,0,0.25)');
      contact.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = contact;
      c.beginPath();
      c.arc(0, 0, contactRadius, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    for (y = -BORDER; y < map.height + BORDER; y++) {
      for (x = -BORDER; x < map.width + BORDER; x++) {
        // indoor: chAt clamps out-of-bounds reads to the map edge, which would
        // paint the border ring beyond a door column as floor; only true
        // in-bounds cells may paint on indoor maps (everything else stays void).
        if (map.indoor && (x < 0 || y < 0 || x >= map.width || y >= map.height)) continue;
        ch = chAt(map, x, y);
        if (map.indoor && !INDOOR_FLOOR[ch]) continue; // fuori dalla stanza o muro: resta vuoto
        if (SKIP_BAKE[ch]) ch = base;
        Sp.drawTile(c, ch, (x + BORDER) * TILE, (y + BORDER) * TILE,
                    Math.abs(x), Math.abs(y), 0, terrainFlags);
      }
    }
    world.terrainStyle = Sp.terrainStyle
      ? Sp.terrainStyle(terrainFlags)
      : { season: 'summer', wet: map.id === 'town' || map.id === 'woods' };
    world.groundCtx = c;
    if (!map.indoor) decorateGround(c, map, world.terrainStyle);
    world.groundTex = makeSurfaceTex(cv);
    var surfaceData = groundSurfaceData(map, world.terrainStyle);
    var geo = new THREE.PlaneGeometry(map.width + BORDER * 2, map.height + BORDER * 2);
    var mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      map: world.groundTex,
      roughness: map.indoor ? 0.92 : 0.98,
      roughnessMap: surfaceData.roughness,
      bumpMap: surfaceData.bump,
      bumpScale: map.indoor ? 0 : 0.035,
      metalness: 0,
      envMapIntensity: map.indoor ? 0.3 : 0.34
    }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(map.width / 2, 0, map.height / 2);
    mesh.receiveShadow = true;
    world.scene.add(mesh);
  }

  var wetMaterials = null;

  function wetRectBatchGeometry(rects) {
    var positions = [];
    var normals = [];
    var uvs = [];
    var indices = [];
    rects.forEach(function (rc, i) {
      var base = i * 4;
      var x0 = rc.x;
      var x1 = rc.x + rc.w;
      var z0 = rc.y;
      var z1 = rc.y + rc.h;
      positions.push(
        x0, 0, z0,
        x1, 0, z0,
        x1, 0, z1,
        x0, 0, z1
      );
      normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
      // Ogni rettangolo ricomincia la texture: la grana della pioggia resta
      // leggibile anche quando più segmenti stradali condividono una draw call.
      uvs.push(0, 0, rc.w, 0, rc.w, rc.h, 0, rc.h);
      indices.push(base, base + 2, base + 1, base, base + 3, base + 2);
    });
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeBoundingSphere();
    return geometry;
  }

  function addWetSurfaces(map, world) {
    // Sottile risposta speculare solo su superfici impermeabili. Mantiene la
    // texture leggibile e separa strada, marciapiede/sentiero e prato zuppo.
    if (!wetMaterials) {
      var wetNormal = wetNormalTexture();
      var wetRoughness = wetRoughnessTexture();
      wetMaterials = {
        road: new THREE.MeshPhysicalMaterial({
          color: 0xd8e5e8, transparent: true, opacity: 0.16,
          roughness: 0.24, roughnessMap: wetRoughness,
          metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06,
          clearcoatRoughnessMap: wetRoughness,
          normalMap: wetNormal, normalScale: new THREE.Vector2(0.24, 0.24),
          envMapIntensity: 1.2, depthWrite: false,
          polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
          dithering: true
        }),
        path: new THREE.MeshPhysicalMaterial({
          color: 0xc8c5b8, transparent: true, opacity: 0.1,
          roughness: 0.48, roughnessMap: wetRoughness,
          metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.3,
          normalMap: wetNormal, normalScale: new THREE.Vector2(0.08, 0.08),
          envMapIntensity: 0.68, depthWrite: false,
          polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
          dithering: true
        })
      };
    }
    var roadRects = tileRects(map, 'r')
      .concat(tileRects(map, '-'))
      .concat(tileRects(map, '='));
    [
      { rects: roadRects, mat: wetMaterials.road, name: 'wet-road-batch' },
      { rects: tileRects(map, 'p'), mat: wetMaterials.path, name: 'wet-path-batch' }
    ].forEach(function (surface) {
      if (!surface.rects.length) return;
      var mesh = new THREE.Mesh(wetRectBatchGeometry(surface.rects), surface.mat);
      mesh.name = surface.name;
      mesh.position.y = 0.026;
      mesh.renderOrder = 2;
      mesh.receiveShadow = true;
      world.scene.add(mesh);
      world.wetSurfaces.push(mesh);
    });
  }

  function addTownCurbTransition(map, world) {
    if (map.id !== 'town') return;
    var group = new THREE.Group();
    group.name = 'town-curb-rain-garden';

    function blobGeometry(seed, segments) {
      var positions = [0, 0, 0];
      var indices = [];
      for (var i = 0; i < segments; i++) {
        var angle = i / segments * Math.PI * 2;
        var radius = 0.9 + Math.sin(seed + i * 2.23) * 0.1 +
          Math.cos(seed * 0.61 + i * 1.37) * 0.045;
        positions.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      }
      for (i = 1; i <= segments; i++) indices.push(0, i % segments + 1, i);
      var geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      return geometry;
    }

    var saturatedSoil = new THREE.MeshStandardMaterial({
      color: 0x294332, roughness: 0.96, metalness: 0, envMapIntensity: 0.18,
      transparent: true, opacity: 0.38, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
      dithering: true
    });
    var shallowWater = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, roughness: 0.11, metalness: 0,
      clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.0,
      transparent: true, opacity: 0.075, depthWrite: false,
      normalMap: wetNormalTexture(), normalScale: new THREE.Vector2(0.1, 0.1),
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      dithering: true
    });
    var drainMetal = new THREE.MeshStandardMaterial({
      color: 0x303331, roughness: 0.54, metalness: 0.42, envMapIntensity: 0.48
    });

    // The depression starts in the west lawn and narrows into the curb at the
    // road edge. It is terrain infrastructure, not another freestanding prop.
    var soil = new THREE.Mesh(blobGeometry(4.2, 19), saturatedSoil);
    soil.position.set(25.92, 0.008, 31.55);
    soil.scale.set(0.88, 1, 0.43);
    soil.renderOrder = 1;
    group.add(soil);

    var puddle = new THREE.Mesh(blobGeometry(8.7, 21), shallowWater);
    puddle.position.set(26.27, 0.036, 31.55);
    puddle.scale.set(0.58, 1, 0.23);
    puddle.renderOrder = 3;
    group.add(puddle);
    world.wetSurfaces.push(puddle);

    var drain = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.018, 0.62), drainMetal);
    drain.position.set(26.84, 0.042, 31.55);
    drain.rotation.y = 0.02;
    drain.receiveShadow = true;
    group.add(drain);
    for (var slotIndex = -2; slotIndex <= 2; slotIndex++) {
      var slot = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.008, 0.035),
        new THREE.MeshBasicMaterial({ color: 0x111312, toneMapped: false })
      );
      slot.position.set(26.84, 0.055, 31.55 + slotIndex * 0.105);
      group.add(slot);
    }

    world.scene.add(group);
    world.townCurbTransition = group;
  }

  var dioramaBaseMaterials = null;

  function addDioramaBase(map, world) {
    if (!map.indoor) return;
    if (!dioramaBaseMaterials) {
      dioramaBaseMaterials = {
        lip: new THREE.MeshStandardMaterial({
          color: 0x52606a, roughness: 0.58, metalness: 0.03, envMapIntensity: 0.48
        }),
        band: new THREE.MeshStandardMaterial({
          color: 0x25343d, roughness: 0.72, metalness: 0.02, envMapIntensity: 0.34
        }),
        foot: new THREE.MeshStandardMaterial({
          color: 0x151f25, roughness: 0.88, metalness: 0, envMapIntensity: 0.18
        })
      };
    }
    var group = new THREE.Group();
    group.name = 'diorama-plinth-' + map.id;
    [
      { size: [map.width + 1.04, 0.12, map.height + 1.04], y: -0.07, mat: dioramaBaseMaterials.lip },
      { size: [map.width + 0.82, 0.31, map.height + 0.82], y: -0.275, mat: dioramaBaseMaterials.band },
      { size: [map.width + 0.48, 0.12, map.height + 0.48], y: -0.49, mat: dioramaBaseMaterials.foot }
    ].forEach(function (layer) {
      var slab = new THREE.Mesh(
        new THREE.BoxGeometry(layer.size[0], layer.size[1], layer.size[2]),
        layer.mat
      );
      slab.position.set(map.width / 2, layer.y, map.height / 2);
      slab.castShadow = true;
      slab.receiveShadow = true;
      group.add(slab);
    });
    world.scene.add(group);
    world.dioramaBase = group;
  }

  function groundFoliageGeometry(kind) {
    var positions = [];
    var indices = [];
    function blade(cx, cz, width, depth, height, angle, leanX, leanZ) {
      var base = positions.length / 3;
      var cos = Math.cos(angle), sin = Math.sin(angle);
      function vertex(x, y, z) {
        positions.push(
          cx + x * cos - z * sin,
          y,
          cz + x * sin + z * cos
        );
      }
      vertex(-width * 0.5, 0, -depth * 0.28);
      vertex(width * 0.5, 0, -depth * 0.28);
      vertex(0, 0, depth * 0.72);
      vertex(leanX, height, leanZ);
      indices.push(
        base, base + 2, base + 1,
        base, base + 1, base + 3,
        base + 1, base + 2, base + 3,
        base + 2, base, base + 3
      );
    }
    if (kind === 'tuft') {
      [
        [-0.055, 0.01, 0.09, 0.035, 0.31, -0.28, -0.025, 0.015],
        [0.045, -0.025, 0.075, 0.03, 0.24, 0.72, 0.018, -0.012],
        [0.005, 0.045, 0.08, 0.028, 0.27, 1.72, -0.01, 0.022],
        [-0.018, -0.052, 0.06, 0.025, 0.19, 2.48, 0.012, 0.008],
        [0.072, 0.042, 0.055, 0.024, 0.17, 3.18, -0.012, -0.006]
      ].forEach(function (b) {
        blade(b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7]);
      });
    } else {
      [
        [-0.08, 0.01, 0.17, 0.08, 0.32, -0.42, -0.04, 0.02],
        [0.07, -0.035, 0.15, 0.075, 0.27, 0.56, 0.035, -0.02],
        [0.015, 0.075, 0.18, 0.085, 0.36, 1.45, -0.025, 0.045],
        [-0.045, -0.08, 0.14, 0.07, 0.24, 2.2, 0.02, 0.01],
        [0.11, 0.055, 0.13, 0.065, 0.22, 2.9, -0.018, -0.018],
        [-0.12, 0.09, 0.12, 0.06, 0.2, 3.72, 0.015, 0.025],
        [0.025, -0.12, 0.11, 0.055, 0.18, 4.5, -0.01, -0.02]
      ].forEach(function (b) {
        blade(b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7]);
      });
    }
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  function groundRockGeometry() {
    var segments = 7;
    var positions = [];
    var indices = [];
    for (var i = 0; i < segments; i++) {
      var angle = i / segments * Math.PI * 2;
      var radius = 0.095 + Math.sin(i * 2.37) * 0.018 + Math.cos(i * 1.19) * 0.01;
      positions.push(Math.cos(angle) * radius, 0.004, Math.sin(angle) * radius);
    }
    for (i = 0; i < segments; i++) {
      angle = i / segments * Math.PI * 2 + 0.16;
      radius = 0.055 + Math.cos(i * 1.83) * 0.009;
      positions.push(
        Math.cos(angle) * radius + 0.012,
        0.105 + (i % 3) * 0.012,
        Math.sin(angle) * radius - 0.008
      );
    }
    positions.push(0.006, 0.145, -0.004);
    var cap = segments * 2;
    for (i = 0; i < segments; i++) {
      var next = (i + 1) % segments;
      indices.push(i, next, segments + i, next, segments + next, segments + i);
      indices.push(segments + i, segments + next, cap);
    }
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  function groundRootGeometry() {
    var positions = [];
    var indices = [];
    function branch(angle, length, width, height, bend) {
      var start = positions.length / 3;
      var cos = Math.cos(angle), sin = Math.sin(angle);
      var sideX = -sin * width * 0.5, sideZ = cos * width * 0.5;
      var midX = cos * length * 0.5 - sin * bend;
      var midZ = sin * length * 0.5 + cos * bend;
      var endX = cos * length, endZ = sin * length;
      positions.push(
        sideX, 0, sideZ,
        -sideX, 0, -sideZ,
        midX - sideX * 0.68, height * 0.72, midZ - sideZ * 0.68,
        midX + sideX * 0.68, height * 0.72, midZ + sideZ * 0.68,
        endX - sideX * 0.16, height * 0.08, endZ - sideZ * 0.16,
        endX + sideX * 0.16, height * 0.08, endZ + sideZ * 0.16
      );
      indices.push(
        start, start + 1, start + 2,
        start + 1, start + 3, start + 2,
        start + 2, start + 3, start + 4,
        start + 3, start + 5, start + 4,
        start, start + 2, start + 4,
        start, start + 4, start + 5,
        start, start + 5, start + 1
      );
    }
    branch(-0.18, 0.78, 0.18, 0.11, 0.08);
    branch(2.02, 0.61, 0.16, 0.095, -0.07);
    branch(3.86, 0.54, 0.14, 0.08, 0.05);
    branch(5.08, 0.42, 0.12, 0.07, -0.04);
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  function addGroundDressing(map, world) {
    if (map.id !== 'woods' && map.id !== 'town') return;
    var tufts = [], rocks = [], broadleaf = [], saplings = [], snags = [],
      blooms = [], shrubs = [];

    function instances(items, geometry, material, yBase, colors, castsShadow) {
      if (!items.length) return null;
      var mesh = new THREE.InstancedMesh(geometry, material, items.length);
      var matrix = new THREE.Matrix4();
      var position = new THREE.Vector3();
      var quaternion = new THREE.Quaternion();
      var scale = new THREE.Vector3();
      var euler = new THREE.Euler();
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var sx = it.sx || it.scale;
        var sy = it.sy || it.scale;
        var sz = it.sz || it.scale;
        position.set(it.x, yBase * sy, it.z);
        euler.set(it.tiltX || 0, it.rot, it.tiltZ || 0);
        quaternion.setFromEuler(euler);
        scale.set(sx, sy, sz);
        matrix.compose(position, quaternion, scale);
        mesh.setMatrixAt(i, matrix);
        if (colors && colors.length) {
          mesh.setColorAt(i, new THREE.Color(colors[i % colors.length]));
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.frustumCulled = false;
      mesh.castShadow = !!castsShadow;
      mesh.receiveShadow = true;
      world.scene.add(mesh);
      return mesh;
    }

    if (map.id === 'town') {
      // The former transparent curb polygon read like a card. Keep its
      // functional data but replace its visual layer with low, volumetric,
      // path-aware verge clusters sharing only two instanced draw calls.
      if (world.townCurbTransition) world.townCurbTransition.visible = false;
      var townClusters = [
        { x: 30.45, z: 28.45, rx: 1.08, rz: 0.48, count: 22, salt: 83 },
        { x: 33.2, z: 30.35, rx: 1.62, rz: 1.42, count: 54, salt: 127 },
        { x: 22.7, z: 32.55, rx: 2.05, rz: 0.72, count: 23, salt: 181, scaleBoost: 1.24 },
        { x: 23.7, z: 28.35, rx: 1.72, rz: 1.12, count: 22, salt: 223, scaleBoost: 1.18 },
        { x: 36.65, z: 31.75, rx: 2.08, rz: 0.92, count: 27, salt: 269, scaleBoost: 1.26 },
        { x: 38.15, z: 27.2, rx: 1.55, rz: 0.88, count: 21, salt: 307, scaleBoost: 1.2 },
        // Palmer threshold: compact planted notes hug the fence and leave the
        // whole approach visually open.
        { x: 41.0, z: 7.86, rx: 0.72, rz: 0.36, count: 12, salt: 349, scaleBoost: 1.08 },
        { x: 44.0, z: 7.92, rx: 0.66, rz: 0.38, count: 9, salt: 383, scaleBoost: 1.02 },
        { x: 40.7, z: 8.38, rx: 0.42, rz: 0.32, count: 5, salt: 421, scaleBoost: 0.96 },
        // Waterfall feet: low moss/grass pockets only outside the landmark.
        { x: 6.85, z: 2.55, rx: 1.55, rz: 0.72, count: 16, salt: 463, scaleBoost: 1.05, blooms: false },
        { x: 15.05, z: 2.6, rx: 1.48, rz: 0.7, count: 15, salt: 503, scaleBoost: 1.08, blooms: false }
      ];
      townClusters.forEach(function (cluster) {
        for (var townIndex = 0; townIndex < cluster.count; townIndex++) {
          var townSeed = treeVisualSeed(cluster.salt + townIndex * 7, 719 - townIndex * 11);
          var angle = townIndex * 2.399963 + ((townSeed >>> 9) & 31) / 83;
          var radius = Math.sqrt(((townSeed >>> 16) & 255) / 255);
          var px = cluster.x + Math.cos(angle) * cluster.rx * radius;
          var pz = cluster.z + Math.sin(angle) * cluster.rz * radius;
          var tileX = Math.floor(px);
          var tileZ = Math.floor(pz);
          var townCh = map.rows[tileZ] && map.rows[tileZ].charAt(tileX);
          if (townCh !== '.' && townCh !== ',') continue;
          // Clear Cooper's south approach and the existing bench/hydrant.
          if (px > 29.55 && px < 31.45 && pz > 29.65) continue;
          if ((px - 31.88) * (px - 31.88) + (pz - 31.76) * (pz - 31.76) < 0.72) continue;
          if ((px - 32.78) * (px - 32.78) + (pz - 30.38) * (pz - 30.38) < 0.52) continue;
          var baseScale = (0.62 + ((townSeed >>> 4) & 15) / 28) *
            (cluster.scaleBoost || 1);
          var townItem = {
            x: px, z: pz,
            rot: angle + Math.PI * 0.5,
            sx: baseScale * (0.78 + ((townSeed >>> 20) & 7) / 16),
            sy: baseScale * (0.7 + ((townSeed >>> 24) & 7) / 9),
            sz: baseScale * (0.82 + ((townSeed >>> 27) & 7) / 15),
            tiltX: (((townSeed >>> 12) & 7) - 3) * 0.022,
            tiltZ: (((townSeed >>> 15) & 7) - 3) * 0.018,
            scale: baseScale
          };
          if (((townSeed >>> 21) & 3) === 0) broadleaf.push(townItem);
          else tufts.push(townItem);
          if (cluster.blooms !== false && townIndex % 7 === 0) {
            blooms.push({
              x: px, z: pz, rot: angle,
              sx: 0.72, sy: 0.72, sz: 0.72, scale: 0.72
            });
          }
        }
      });

      var palmerPlantings = [
        [40.72, 7.72, -0.28, 1.02, 'broadleaf'],
        [41.08, 7.88, 0.34, 0.9, 'tuft'],
        [41.42, 7.68, -0.12, 0.98, 'broadleaf'],
        [40.84, 8.14, 0.52, 0.82, 'tuft'],
        [41.32, 8.18, -0.42, 0.88, 'broadleaf'],
        [43.7, 7.72, 0.26, 0.92, 'broadleaf'],
        [44.02, 7.9, -0.35, 0.8, 'tuft'],
        [44.3, 7.75, 0.44, 0.86, 'broadleaf']
      ];
      palmerPlantings.forEach(function (plant, plantIndex) {
        var plantedItem = {
          x: plant[0], z: plant[1], rot: plant[2], scale: plant[3],
          sx: plant[3] * (plantIndex % 2 ? 0.78 : 0.92),
          sy: plant[3] * (plantIndex % 3 ? 1.08 : 0.88),
          sz: plant[3] * (plantIndex % 2 ? 0.9 : 0.76),
          tiltX: (plantIndex % 3 - 1) * 0.025,
          tiltZ: (plantIndex % 4 - 1.5) * 0.018
        };
        if (plant[4] === 'tuft') tufts.push(plantedItem);
        else broadleaf.push(plantedItem);
        if (plantIndex === 1 || plantIndex === 6) {
          blooms.push({
            x: plant[0], z: plant[1], rot: plant[2],
            sx: 0.66, sy: 0.66, sz: 0.66, scale: 0.66
          });
        }
      });
      [
        [40.72, 7.68, -0.18, 0.58, 0.4, 0.5],
        [41.14, 7.78, 0.32, 0.5, 0.36, 0.44],
        [41.5, 7.66, -0.08, 0.44, 0.32, 0.4],
        [40.94, 8.02, 0.45, 0.46, 0.34, 0.42],
        [43.76, 7.72, -0.28, 0.48, 0.34, 0.42],
        [44.16, 7.82, 0.2, 0.42, 0.3, 0.38]
      ].forEach(function (shrub) {
        shrubs.push({
          x: shrub[0], z: shrub[1], rot: shrub[2], scale: 1,
          sx: shrub[3], sy: shrub[4], sz: shrub[5]
        });
      });
    } else {
      function nearTrail(px, pz, minDistance) {
        var minSq = minDistance * minDistance;
        var fx = Math.floor(px), fz = Math.floor(pz);
        for (var yy = fz - 1; yy <= fz + 1; yy++) {
          if (!map.rows[yy]) continue;
          for (var xx = fx - 1; xx <= fx + 1; xx++) {
            var pathCh = map.rows[yy].charAt(xx);
            if (pathCh !== 'p' && pathCh !== 'o') continue;
            var dx = px - (xx + 0.5);
            var dz = pz - (yy + 0.5);
            if (dx * dx + dz * dz < minSq) return true;
          }
        }
        return false;
      }

      function adjacentTrees(x, y) {
        var count = 0;
        for (var oy = -1; oy <= 1; oy++) {
          for (var ox = -1; ox <= 1; ox++) {
            if (!ox && !oy) continue;
            var row = map.rows[y + oy];
            var neighbour = row && row.charAt(x + ox);
            if (neighbour === 'T' || neighbour === 'Y') count++;
          }
        }
        return count;
      }

      var ecologyPockets = [
        { x: 4.4, z: 4.7, rx: 4.2, rz: 2.8, rocks: false },
        { x: 23.1, z: 4.8, rx: 4.7, rz: 2.6, rocks: true },
        { x: 5.3, z: 12.5, rx: 5.0, rz: 3.2, rocks: false },
        { x: 22.7, z: 11.8, rx: 4.3, rz: 3.5, rocks: true },
        { x: 5.2, z: 19.0, rx: 4.6, rz: 2.6, rocks: true },
        { x: 22.8, z: 18.7, rx: 5.0, rz: 2.8, rocks: false }
      ];
      for (var y = 1; y < map.height - 1; y++) {
        for (var x = 1; x < map.width - 1; x++) {
          var ch = map.rows[y].charAt(x);
          if (ch !== '.' && ch !== 'g') continue;
          var seed = treeVisualSeed(x + 71, y + 193);
          var chance = (seed & 65535) / 65535;
          var item = {
            x: x + 0.18 + ((seed >>> 16) & 255) / 255 * 0.64,
            z: y + 0.18 + ((seed >>> 24) & 255) / 255 * 0.64,
            rot: ((seed >>> 8) & 255) / 255 * Math.PI * 2,
            scale: 0.68 + ((seed >>> 4) & 15) / 25
          };
          item.sx = item.scale * (0.72 + ((seed >>> 17) & 7) / 12);
          item.sy = item.scale * (0.68 + ((seed >>> 21) & 7) / 7);
          item.sz = item.scale * (0.74 + ((seed >>> 25) & 7) / 11);
          item.tiltX = (((seed >>> 11) & 7) - 3) * 0.028;
          item.tiltZ = (((seed >>> 14) & 7) - 3) * 0.024;
          if (nearTrail(item.x, item.z, 0.92)) continue;

          var treeBand = adjacentTrees(x, y);
          var pocketInfluence = 0;
          var pocketIndex = -1;
          for (var pocketAt = 0; pocketAt < ecologyPockets.length; pocketAt++) {
            var pocket = ecologyPockets[pocketAt];
            var pocketDx = (item.x - pocket.x) / pocket.rx;
            var pocketDz = (item.z - pocket.z) / pocket.rz;
            var influence = Math.max(
              0, 1 - Math.sqrt(pocketDx * pocketDx + pocketDz * pocketDz));
            if (influence > pocketInfluence) {
              pocketInfluence = influence;
              pocketIndex = pocketAt;
            }
          }
          // Fuori dalle tasche il sottobosco resta quasi vuoto; vicino agli
          // alberi e dentro una massa la densità sale in modo leggibile.
          var density = Math.min(
            0.42, 0.018 + pocketInfluence * 0.34 + treeBand * 0.018);
          var pathDistance = Math.abs(item.x - 14.5);
          if (treeBand >= 2 && pathDistance > 2.4 &&
              chance < 0.018 + pocketInfluence * 0.04) {
            item.sx *= 1.15;
            item.sy *= 0.72;
            item.sz *= 1.15;
            snags.push(item);
            continue;
          } else if (pocketInfluence > 0.4 && pathDistance > 3.1 &&
                     chance < 0.042) {
            item.sx *= 1.3;
            item.sy *= 2.15;
            item.sz *= 1.3;
            saplings.push(item);
            continue;
          }
          if (chance > density) continue;
          var family = (seed >>> 19) & 15;
          var rockPocket = pocketIndex >= 0 && ecologyPockets[pocketIndex].rocks;
          if (family < (rockPocket ? 6 : 2)) rocks.push(item);
          else if (family < 9) broadleaf.push(item);
          else tufts.push(item);
        }
      }

      // Authored path-edge pockets at the two fixed audit views. These are
      // render-only and remain at least 1.25 world units from the walkable
      // centreline, so navigation and collision stay untouched.
      var woodsEdgeAnchors = [
        { x: 12.52, z: 19.35, salt: 557, side: -1 },
        { x: 16.42, z: 18.65, salt: 593, side: 1 },
        { x: 12.38, z: 14.45, salt: 631, side: -1 },
        { x: 16.55, z: 13.65, salt: 677, side: 1 },
        { x: 12.48, z: 9.75, salt: 719, side: -1 },
        { x: 16.38, z: 8.95, salt: 761, side: 1 }
      ];
      woodsEdgeAnchors.forEach(function (anchor, anchorIndex) {
        for (var edgeIndex = 0; edgeIndex < 7; edgeIndex++) {
          var edgeSeed = treeVisualSeed(
            anchor.salt + edgeIndex * 13, 887 - edgeIndex * 17);
          var edgeAngle = edgeIndex * 2.399963 + anchorIndex * 0.37;
          var edgeRadius = 0.18 + edgeIndex * 0.085;
          var edgeItem = {
            x: anchor.x + Math.cos(edgeAngle) * edgeRadius * 0.72,
            z: anchor.z + Math.sin(edgeAngle) * edgeRadius,
            rot: edgeAngle + (anchor.side < 0 ? 0.35 : -0.28),
            scale: 0.72 + ((edgeSeed >>> 7) & 15) / 22
          };
          edgeItem.sx = edgeItem.scale *
            (0.76 + ((edgeSeed >>> 17) & 7) / 13);
          edgeItem.sy = edgeItem.scale *
            (0.72 + ((edgeSeed >>> 21) & 7) / 8);
          edgeItem.sz = edgeItem.scale *
            (0.76 + ((edgeSeed >>> 25) & 7) / 12);
          edgeItem.tiltX = (((edgeSeed >>> 11) & 7) - 3) * 0.026;
          edgeItem.tiltZ = (((edgeSeed >>> 14) & 7) - 3) * 0.022;
          if (edgeIndex === 0 && anchorIndex % 2 === 0) {
            edgeItem.sx *= 1.08;
            edgeItem.sy *= 1.18;
            edgeItem.sz *= 1.06;
            broadleaf.push(edgeItem);
          } else if (edgeIndex === 1 || edgeIndex === 5) {
            edgeItem.scale *= 0.78;
            edgeItem.sx *= 0.78;
            edgeItem.sy *= 0.72;
            edgeItem.sz *= 0.78;
            rocks.push(edgeItem);
          } else if ((edgeIndex + anchorIndex) % 3 === 0) {
            tufts.push(edgeItem);
          } else {
            edgeItem.sy *= 1.15;
            broadleaf.push(edgeItem);
          }
        }
      });
    }

    // All macro-density is instanced. Nonuniform scale and tilt make one mesh
    // family read as varied growth without material or draw-call multiplication.
    var terrainSeason = world.terrainStyle ? world.terrainStyle.season : 'summer';
    var terrainWet = world.terrainStyle ? world.terrainStyle.wet : false;
    var townTuftPalette = map.id !== 'town' ? null :
      (terrainSeason === 'autumn'
        ? [0x8d8242, 0x9a6e3f, 0x69683a, 0x755333]
        : (terrainSeason === 'winter'
          ? [0x486454, 0x5a6e5a, 0x66735e]
          : (terrainWet
            ? [0x315f3b, 0x447348, 0x657547, 0x28573a]
            : [0x5b7045, 0x71804d, 0x7f7b48, 0x48663f])));
    var townBroadleafPalette = map.id !== 'town' ? null :
      (terrainSeason === 'autumn'
        ? [0x776b35, 0x925a32, 0x6f733b, 0x9d7841]
        : (terrainSeason === 'winter'
          ? [0x315044, 0x476153, 0x536b59]
          : (terrainWet
            ? [0x1f4d31, 0x35653d, 0x4e7043, 0x28583a]
            : [0x45643b, 0x5f7342, 0x6f7845, 0x385c37])));
    var woodsTuftPalette = map.id !== 'woods' ? null :
      (terrainSeason === 'autumn'
        ? [0x3c4a2d, 0x59603a, 0x6a5b33, 0x30432f]
        : [0x285039, 0x376044, 0x526f4c, 0x254333]);
    var woodsBroadleafPalette = map.id !== 'woods' ? null :
      (terrainSeason === 'autumn'
        ? [0x354329, 0x4d5733, 0x645437, 0x2d3d2d]
        : [0x224833, 0x315a3d, 0x496a47, 0x2b5038]);
    var tuftPalette = townTuftPalette || woodsTuftPalette;
    var broadleafPalette = townBroadleafPalette || woodsBroadleafPalette;
    var tuftColor = map.id === 'town'
      ? (terrainSeason === 'autumn' ? 0x667044 : (terrainSeason === 'winter' ? 0x486454 : 0x3f693f))
      : (terrainSeason === 'autumn' ? 0x3a4a2d : 0x28482f);
    var broadleafColor = map.id === 'town'
      ? (terrainSeason === 'autumn' ? 0x5b5a2f : (terrainSeason === 'winter' ? 0x315044 : 0x244f31))
      : (terrainSeason === 'autumn' ? 0x3c4327 : 0x24442f);
    var tuftMat = new THREE.MeshStandardMaterial({
      color: tuftPalette ? 0xffffff : tuftColor,
      roughness: 0.96, metalness: 0,
      flatShading: true, envMapIntensity: 0.2
    });
    var rockMat = new THREE.MeshStandardMaterial({
      color: 0x48514b, roughness: 0.94, metalness: 0,
      flatShading: true, envMapIntensity: 0.22
    });
    var broadleafMat = new THREE.MeshStandardMaterial({
      color: broadleafPalette ? 0xffffff : broadleafColor,
      roughness: 0.97, metalness: 0,
      flatShading: true, envMapIntensity: 0.18
    });
    var bloomMesh = instances(
      blooms, new THREE.SphereGeometry(0.065, 7, 5),
      new THREE.MeshStandardMaterial({
        color: 0xe0b86a, roughness: 0.82, metalness: 0,
        emissive: 0x2a1c08, emissiveIntensity: 0.12,
        flatShading: true, envMapIntensity: 0.24
      }),
      0.42, null, false
    );
    var shrubMesh = instances(
      shrubs, new THREE.DodecahedronGeometry(0.27, 0),
      new THREE.MeshStandardMaterial({
        color: terrainSeason === 'autumn'
          ? 0x6f693b : (terrainWet ? 0x3e7040 : 0x5f7745),
        roughness: 0.98, metalness: 0,
        flatShading: true, envMapIntensity: 0.18
      }),
      0.27, null, false
    );
    var tuftMesh = instances(
      tufts, groundFoliageGeometry('tuft'),
      tuftMat, 0.008,
      tuftPalette, false
    );
    var rockMesh = instances(
      rocks, groundRockGeometry(), rockMat, 0.004,
      null, false
    );
    var broadleafMesh = instances(
      broadleaf, groundFoliageGeometry('broadleaf'),
      broadleafMat, 0.008,
      broadleafPalette, false
    );
    var saplingMesh = instances(
      saplings, groundFoliageGeometry('broadleaf'),
      new THREE.MeshStandardMaterial({
        color: 0x31563b, roughness: 0.94, metalness: 0, flatShading: true,
        envMapIntensity: 0.26
      }),
      0.008, null, true
    );
    var snagMesh = instances(
      snags, groundRootGeometry(),
      new THREE.MeshStandardMaterial({
        color: 0x5a4634, roughness: 0.98, metalness: 0, flatShading: true,
        envMapIntensity: 0.2
      }),
      0.006, null, false
    );
    world.dressing = [
      bloomMesh, shrubMesh, tuftMesh, rockMesh,
      broadleafMesh, saplingMesh, snagMesh
    ];
    world.dressingCount = tufts.length + rocks.length + broadleaf.length +
      saplings.length + snags.length + blooms.length + shrubs.length;
  }

  function addTerrainRelief(map, world) {
    if (map.id !== 'town' && map.id !== 'woods') return;
    var segments = 18;
    var positions = [];
    var indices = [];
    var ringRadii = [0.78, 0.48, 0.21];
    var ringHeights = [0.004, 0.075, 0.145];
    for (var ring = 0; ring < ringRadii.length; ring++) {
      for (var i = 0; i < segments; i++) {
        var angle = i / segments * Math.PI * 2;
        var irregular = 1 + Math.sin(i * 2.17 + ring) * 0.085 +
          Math.cos(i * 1.13 - ring) * 0.05;
        var radius = ringRadii[ring] * irregular;
        positions.push(
          Math.cos(angle) * radius,
          ringHeights[ring] + Math.sin(i * 1.7 + ring) * 0.008,
          Math.sin(angle) * radius
        );
      }
    }
    positions.push(0.035, 0.19, -0.026);
    var crown = segments * ringRadii.length;
    for (i = 0; i < segments; i++) {
      var next = (i + 1) % segments;
      for (ring = 0; ring < ringRadii.length - 1; ring++) {
        var outerAt = ring * segments + i;
        var outerNext = ring * segments + next;
        var innerAt = (ring + 1) * segments + i;
        var innerNext = (ring + 1) * segments + next;
        indices.push(
          outerAt, outerNext, innerAt,
          outerNext, innerNext, innerAt);
      }
      var innerRing = (ringRadii.length - 1) * segments;
      indices.push(innerRing + i, innerRing + next, crown);
    }
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();

    function touchesWalkOrWater(x, y) {
      for (var oy = -1; oy <= 1; oy++) {
        for (var ox = -1; ox <= 1; ox++) {
          var row = map.rows[y + oy];
          var ch = row && row.charAt(x + ox);
          if (ch === 'p' || ch === 'r' || ch === '=' || ch === '-' || ch === 'w' || ch === 'o') return true;
        }
      }
      return false;
    }

    var candidates = [];
    var limit = map.id === 'town' ? 22 : 34;
    for (var y = 0; y < map.height; y++) {
      for (var x = 0; x < map.width; x++) {
        var ch = map.rows[y].charAt(x);
        if (ch !== 'T' && ch !== 'Y') continue;
        if (touchesWalkOrWater(x, y)) continue;
        // Preserve waterfall source and southern welcome/spawn sightline.
        if (map.id === 'town' && ((x < 15 && y < 8) || y > 32)) continue;
        var seed = treeVisualSeed(x + 911, y + 431);
        candidates.push({
          x: x + 0.5, z: y + 0.5,
          rank: seed >>> 0,
          rot: ((seed >>> 8) & 255) / 255 * Math.PI * 2,
          sx: 0.88 + ((seed >>> 17) & 31) / 62,
          sy: 0.82 + ((seed >>> 22) & 15) / 25,
          sz: 0.82 + ((seed >>> 27) & 15) / 24
        });
      }
    }
    candidates.sort(function (a, b) { return a.rank - b.rank; });
    var specs = candidates.slice(0, limit);
    if (!specs.length) return;
    var season = world.terrainStyle ? world.terrainStyle.season : 'summer';
    var color = map.id === 'woods'
      ? (season === 'autumn' ? 0x31422f : 0x233d33)
      : (season === 'autumn' ? 0x616c43 : (season === 'winter' ? 0x4c6254 : 0x506f47));
    var material = new THREE.MeshStandardMaterial({
      color: color, roughness: 0.99, metalness: 0,
      flatShading: true, envMapIntensity: 0.18
    });
    var mesh = new THREE.InstancedMesh(geometry, material, specs.length);
    var dummy = new THREE.Object3D();
    specs.forEach(function (spec, index) {
      dummy.position.set(spec.x, 0, spec.z);
      dummy.rotation.set(0, spec.rot, 0);
      dummy.scale.set(spec.sx, spec.sy, spec.sz);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.name = map.id + '-terrain-relief';
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    world.scene.add(mesh);
    world.terrainRelief = mesh;
    world.terrainReliefCount = specs.length;
  }

  function addWoodsPathEdgeZoning(map, world) {
    if (map.id !== 'woods') return;
    var group = new THREE.Group();
    group.name = 'woods-path-edge-zoning';
    var moss = new THREE.MeshStandardMaterial({
      color: 0x263b2c, roughness: 1, metalness: 0,
      transparent: true, opacity: 0.46, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2
    });
    var litter = new THREE.MeshStandardMaterial({
      color: 0x514731, roughness: 1, metalness: 0,
      transparent: true, opacity: 0.3, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2
    });

    function blobGeometry(seed) {
      var segments = 11;
      var positions = [0, 0, 0];
      var indices = [];
      for (var i = 0; i < segments; i++) {
        var angle = i / segments * Math.PI * 2;
        var radius = 0.88 + Math.sin(seed * 1.7 + i * 2.31) * 0.1 +
          Math.cos(seed * 0.63 + i * 1.17) * 0.06;
        positions.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      }
      for (i = 1; i <= segments; i++) {
        indices.push(0, i % segments + 1, i);
      }
      var geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      return geometry;
    }

    [
      { x: 12.45, z: 11.35, rx: 1.34, rz: 0.8, rot: 0.34, seed: 3, material: moss },
      { x: 11.3, z: 6.45, rx: 1.18, rz: 0.82, rot: 0.12, seed: 11, material: litter }
    ].forEach(function (zone, index) {
      var patch = new THREE.Mesh(blobGeometry(zone.seed), zone.material);
      patch.position.set(zone.x, 0.022 + index * 0.001, zone.z);
      patch.rotation.y = zone.rot;
      patch.scale.set(zone.rx, 1, zone.rz);
      patch.receiveShadow = true;
      patch.renderOrder = 1;
      group.add(patch);
    });
    world.scene.add(group);
    world.woodsPathZones = group;
  }

  function addOilPortalTerrain(map, world) {
    if (map.id !== 'woods') return;
    var group = new THREE.Group();
    group.name = 'oil-portal-terrain';

    function rectRadius(angle, halfX, halfZ) {
      var cos = Math.abs(Math.cos(angle));
      var sin = Math.abs(Math.sin(angle));
      return Math.min(
        halfX / Math.max(cos, 0.0001),
        halfZ / Math.max(sin, 0.0001)
      );
    }

    function irregularRectGeometry(seed, halfX, halfZ, padding, segments) {
      var positions = [0, 0, 0];
      var indices = [];
      for (var i = 0; i < segments; i++) {
        var angle = i / segments * Math.PI * 2;
        var radius = rectRadius(angle, halfX, halfZ) + padding +
          Math.sin(seed + i * 2.17) * 0.055 +
          Math.cos(seed * 0.7 + i * 1.31) * 0.025;
        positions.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      }
      for (i = 1; i <= segments; i++) indices.push(0, i % segments + 1, i);
      var geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      return geometry;
    }

    function irregularRectRingGeometry(seed, halfX, halfZ, innerPad, outerPad, segments, vertexColors) {
      var positions = [];
      var colors = [];
      var indices = [];
      for (var i = 0; i < segments; i++) {
        var angle = i / segments * Math.PI * 2;
        var baseRadius = rectRadius(angle, halfX, halfZ);
        var irregularity = Math.sin(seed + i * 2.17) * 0.055 +
          Math.cos(seed * 0.7 + i * 1.31) * 0.025;
        var innerRadius = baseRadius + innerPad + irregularity * 0.2;
        var outerRadius = baseRadius + outerPad + irregularity;
        positions.push(
          Math.cos(angle) * outerRadius, 0, Math.sin(angle) * outerRadius,
          Math.cos(angle) * innerRadius, 0, Math.sin(angle) * innerRadius
        );
        if (vertexColors) {
          var shade = 0.82 + 0.16 * Math.sin(seed * 0.43 + i * 1.91);
          var outerColor = new THREE.Color(0x334b36).multiplyScalar(shade);
          var innerColor = new THREE.Color(0x25372b).multiplyScalar(0.9 + shade * 0.08);
          colors.push(
            outerColor.r, outerColor.g, outerColor.b,
            innerColor.r, innerColor.g, innerColor.b
          );
        }
      }
      for (i = 0; i < segments; i++) {
        var next = (i + 1) % segments;
        var outer = i * 2;
        var inner = outer + 1;
        var nextOuter = next * 2;
        var nextInner = nextOuter + 1;
        indices.push(outer, inner, nextOuter, nextOuter, inner, nextInner);
      }
      var geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      if (vertexColors) {
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      }
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      return geometry;
    }

    var basinMaterial = new THREE.MeshStandardMaterial({
      color: 0x111716, roughness: 0.36, metalness: 0.02, envMapIntensity: 0.52
    });
    var soilMaterial = new THREE.MeshStandardMaterial({
      color: 0x31281f, roughness: 0.98, metalness: 0, envMapIntensity: 0.2
    });
    var mossMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, vertexColors: true, roughness: 0.96, metalness: 0,
      envMapIntensity: 0.24
    });
    var wetContactMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x26362f, roughness: 0.18, metalness: 0,
      clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.9,
      transparent: true, opacity: 0.42, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
      dithering: true
    });
    var stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x465049, roughness: 0.92, metalness: 0, envMapIntensity: 0.28
    });

    tileRects(map, 'o').forEach(function (rc, portalIndex) {
      var cx = rc.x + rc.w / 2;
      var cz = rc.y + rc.h / 2;
      var halfX = rc.w / 2;
      var halfZ = rc.h / 2;
      var basin = new THREE.Mesh(
        irregularRectGeometry(2.3 + portalIndex, halfX, halfZ, 0.2, 24),
        basinMaterial
      );
      basin.position.set(cx, 0.01, cz);
      basin.receiveShadow = true;
      group.add(basin);

      var soilRim = new THREE.Mesh(
        irregularRectRingGeometry(5.1 + portalIndex, halfX, halfZ, 0.08, 0.43, 24, false),
        soilMaterial
      );
      soilRim.position.set(cx, 0.02, cz);
      soilRim.receiveShadow = true;
      group.add(soilRim);

      var mossTransition = new THREE.Mesh(
        irregularRectRingGeometry(7.9 + portalIndex, halfX, halfZ, 0.35, 0.68, 24, true),
        mossMaterial
      );
      mossTransition.position.set(cx, 0.026, cz);
      mossTransition.renderOrder = 2;
      mossTransition.receiveShadow = true;
      group.add(mossTransition);

      var wetContact = new THREE.Mesh(
        irregularRectRingGeometry(11.4 + portalIndex, halfX, halfZ, 0.01, 0.2, 24, false),
        wetContactMaterial
      );
      wetContact.position.set(cx, 0.046, cz);
      wetContact.renderOrder = 4;
      group.add(wetContact);
      world.wetSurfaces.push(wetContact);

      // Low stones sit on the lateral shoulders, never on the north/south
      // approach along the x=14 path.
      [0.12, 0.62, 2.52, 3.04, 3.66, 5.78].forEach(function (angle, stoneIndex) {
        var radius = rectRadius(angle, halfX, halfZ) + 0.49;
        var size = 0.12 + (stoneIndex % 3) * 0.025;
        var stone = new THREE.Mesh(
          new THREE.DodecahedronGeometry(size, 0),
          stoneMaterial
        );
        stone.position.set(
          cx + Math.cos(angle) * radius,
          0.08 + size * 0.25,
          cz + Math.sin(angle) * radius
        );
        stone.scale.set(1.2, 0.62 + (stoneIndex % 2) * 0.14, 0.92);
        stone.rotation.set(stoneIndex * 0.21, angle, stoneIndex * 0.13);
        stone.castShadow = true;
        stone.receiveShadow = true;
        group.add(stone);
      });
    });

    world.scene.add(group);
    world.oilPortalTerrain = group;
  }

  function applyLightingMaterialPolicy(root) {
    if (!root || !root.traverse) return;
    function tune(material) {
      if (!material ||
          (!material.isMeshStandardMaterial && !material.isMeshPhysicalMaterial &&
           !material.isMeshLambertMaterial)) return;
      if (material.dithering) return;
      material.dithering = true;
      material.needsUpdate = true;
    }
    root.traverse(function (o) {
      if (!o.isMesh || !o.material) return;
      if (Array.isArray(o.material)) {
        for (var i = 0; i < o.material.length; i++) tune(o.material[i]);
      } else {
        tune(o.material);
      }
    });
  }

  function upgradeLambertMaterials(world, map) {
    var converted = {};
    function upgrade(source) {
      if (!source || !source.isMeshLambertMaterial) return source;
      if (converted[source.uuid]) return converted[source.uuid];
      var transparentSurface = source.transparent || source.opacity < 0.98;
      var material = new THREE.MeshStandardMaterial({
        color: source.color ? source.color.clone() : new THREE.Color(0xffffff),
        map: source.map || null,
        alphaMap: source.alphaMap || null,
        emissive: source.emissive ? source.emissive.clone() : new THREE.Color(0x000000),
        emissiveIntensity: source.emissiveIntensity || 1,
        roughness: transparentSurface ? 0.34 : (map.indoor ? 0.7 : 0.8),
        metalness: 0,
        envMapIntensity: transparentSurface ? 0.72 : (map.indoor ? 0.34 : 0.38),
        transparent: source.transparent,
        opacity: source.opacity,
        alphaTest: source.alphaTest,
        depthWrite: source.depthWrite,
        depthTest: source.depthTest,
        side: source.side,
        vertexColors: source.vertexColors,
        flatShading: source.flatShading,
        dithering: true,
        fog: source.fog,
        polygonOffset: source.polygonOffset,
        polygonOffsetFactor: source.polygonOffsetFactor,
        polygonOffsetUnits: source.polygonOffsetUnits
      });
      material.name = source.name;
      converted[source.uuid] = material;
      return material;
    }
    world.scene.traverse(function (o) {
      if (!o.isMesh || !o.material) return;
      if (Array.isArray(o.material)) {
        o.material = o.material.map(upgrade);
      } else {
        o.material = upgrade(o.material);
      }
    });
    world.upgradedLambertMaterials = Object.keys(converted).length;
  }

  function lightingProfile(map) {
    var LC = CONFIG.lighting;
    return LC[map.id] ||
      (map.id === 'redroom' ? LC.redroom : (map.indoor ? LC.indoor : LC.outdoor));
  }

  var runtimeLightingColor = new THREE.Color();

  function regionalLightingState(map, px, pz) {
    var regional = CONFIG.lighting.regional;
    if (map.id === 'town') {
      // I tre landmark hanno inquadrature fisse e bisogni opposti. Le soglie
      // restano lontane dai tragitti del gate temporale (x30/y23 e x30/y30).
      if (px > 25 && pz > 31.5) {
        return {
          profile: regional.townWelcomeHero,
          accent: regional.townWelcomeHeroAccent
        };
      }
      if (px < 24 && pz > 24) {
        return { profile: regional.townLakeHero, accent: regional.townLakeHeroAccent };
      }
      if (pz < 10) {
        return {
          profile: regional.townWaterfallHero,
          accent: regional.townWaterfallHeroAccent
        };
      }
      // Il profilo seguente è il contratto temporale approvato in loop 4.
      if (px > 25) {
        return { profile: regional.townDrama, accent: regional.townWelcomeAccent };
      }
    } else if (map.id === 'woods' && pz < 18) {
      // La soglia resta a sud del Grove: l'ingresso vincente non cambia.
      return { profile: regional.woodsGrove, accent: regional.woodsGroveAccent };
    }
    return null;
  }

  function lerpRuntimeColor(color, target, alpha) {
    runtimeLightingColor.setHex(target);
    color.lerp(runtimeLightingColor, alpha);
  }

  function applyRuntimeLighting(world, px, pz, dt) {
    var base = world.lightingProfile;
    var regional = regionalLightingState(world.map, px, pz);
    var target = regional ? regional.profile : base;
    // Un cambio di regione impiega ~0.4 s: abbastanza rapido per leggere una
    // nuova composizione, abbastanza lento da non produrre exposure popping.
    var alpha = 1 - Math.exp(-Math.min(Math.max(dt || 16, 1), 80) / 115);
    var hemi = world.hemiLight;
    if (hemi) {
      lerpRuntimeColor(hemi.color, target.hemiSky, alpha);
      lerpRuntimeColor(hemi.groundColor, target.hemiGround, alpha);
      hemi.intensity += (target.hemiIntensity - hemi.intensity) * alpha;
    }
    if (world.sun) {
      lerpRuntimeColor(world.sun.color, target.sunColor, alpha);
      world.sun.intensity += (target.sunIntensity - world.sun.intensity) * alpha;
    }
    if (world.fillLight) {
      lerpRuntimeColor(world.fillLight.color, target.fillColor, alpha);
      world.fillLight.intensity += (target.fillIntensity - world.fillLight.intensity) * alpha;
    }
    if (world.actorFill && target.actorFill) {
      lerpRuntimeColor(world.actorFill.color, target.actorFill.color, alpha);
      world.actorFill.intensity +=
        (target.actorFill.intensity - world.actorFill.intensity) * alpha;
      world.actorFill.distance +=
        (target.actorFill.distance - world.actorFill.distance) * alpha;
    }
    if (world.regionalAccent) {
      var accent = regional && regional.accent;
      var accentIntensity = accent ? accent.intensity : 0;
      world.regionalAccent.intensity +=
        (accentIntensity - world.regionalAccent.intensity) * alpha;
      if (accent) {
        lerpRuntimeColor(world.regionalAccent.color, accent.color, alpha);
        world.regionalAccent.distance +=
          (accent.distance - world.regionalAccent.distance) * alpha;
        world.regionalAccent.position.x +=
          (accent.position[0] - world.regionalAccent.position.x) * alpha;
        world.regionalAccent.position.y +=
          (accent.position[1] - world.regionalAccent.position.y) * alpha;
        world.regionalAccent.position.z +=
          (accent.position[2] - world.regionalAccent.position.z) * alpha;
      }
    }
    var offset = target.sunOffset;
    world.sunOffset.x += (offset[0] - world.sunOffset.x) * alpha;
    world.sunOffset.y += (offset[1] - world.sunOffset.y) * alpha;
    world.sunOffset.z += (offset[2] - world.sunOffset.z) * alpha;
    world.exposure += (target.exposure - world.exposure) * alpha;
    renderer.toneMappingExposure = world.exposure;
    world.contactOpacity = target.contactOpacity || BLOB_BASE_OPACITY;

    var fog = target.fog || CONFIG.fog[world.map.id];
    if (world.scene.fog && fog) {
      lerpRuntimeColor(world.scene.fog.color, fog.color, alpha);
      world.scene.fog.near += (fog.near - world.scene.fog.near) * alpha;
      world.scene.fog.far += (fog.far - world.scene.fog.far) * alpha;
    }
  }

  function addLights(map, world) {
    var indoor = !!map.indoor;
    var red = map.id === 'redroom';
    var LC = CONFIG.lighting;
    var lp = lightingProfile(map);
    var pointLightCount = 0;
    function addPointLight(light) {
      world.scene.add(light);
      pointLightCount++;
      return light;
    }
    var hemi = new THREE.HemisphereLight(lp.hemiSky, lp.hemiGround, lp.hemiIntensity);
    var sun = new THREE.DirectionalLight(lp.sunColor, lp.sunIntensity);
    world.scene.add(hemi);
    world.hemiLight = hemi;
    var cx = map.width / 2, cz = map.height / 2;
    var offset = lp.sunOffset || (indoor ? [-7, 11, -5] : [-12, 19, -9]);
    var sunOffset = new THREE.Vector3(offset[0], offset[1], offset[2]);
    sun.position.set(cx + sunOffset.x, sunOffset.y, cz + sunOffset.z);
    sun.target.position.set(cx, 0, cz);
    world.scene.add(sun.target);
    sun.castShadow = true;
    // Risoluzione ombre spesa sulla vista corrente, non sull'intera mappa.
    // Il centro segue il player con snap stabile in R.render.
    var d = lp.shadowExtent ||
      (indoor ? Math.max(map.width, map.height) / 2 + (lp.shadowMargin || 1.4) : 12);
    var shadowMapSize = qualityMode === 'high'
      ? LC.shadow.mapSize
      : LC.shadow.balancedMapSize;
    sun.shadow.mapSize.width = shadowMapSize;
    sun.shadow.mapSize.height = shadowMapSize;
    sun.shadow.camera.near = LC.shadow.near;
    sun.shadow.camera.far = indoor ? 42 : 52;
    sun.shadow.camera.left = -d; sun.shadow.camera.right = d;
    sun.shadow.camera.top = d; sun.shadow.camera.bottom = -d;
    sun.shadow.bias = lp.shadowBias === undefined ? LC.shadow.bias : lp.shadowBias;
    sun.shadow.normalBias = lp.shadowNormalBias === undefined
      ? LC.shadow.normalBias : lp.shadowNormalBias;
    // PCFSoft r147 gestisce il filtro; LightShadow.radius non aggiunge una
    // penombra affidabile con questo shadow type.
    sun.shadow.radius = 1;
    world.scene.add(sun);
    world.sun = sun;
    world.sunOffset = sunOffset;
    world.shadowState = {
      extent: d,
      mapSize: shadowMapSize,
      texel: (d * 2) / shadowMapSize,
      // Allineamento a un texel con deadband: niente salto a blocchi da 16
      // texel e niente crawl sub-pixel. Il refresh segue pose e vento a 30 Hz.
      snapTexels: 1,
      refreshMs: 33,
      x: cx,
      z: cz,
      dirty: true
    };
    world.lightingProfile = lp;
    world.exposure = lp.exposure || 1;

    if (lp.fillColor && lp.fillIntensity) {
      var fillOffset = lp.fillOffset || [7, 6, 8];
      var directionalFill = new THREE.DirectionalLight(lp.fillColor, lp.fillIntensity);
      directionalFill.position.set(
        cx + fillOffset[0], fillOffset[1], cz + fillOffset[2]
      );
      directionalFill.target.position.set(cx, 0.45, cz);
      directionalFill.castShadow = false;
      world.scene.add(directionalFill.target);
      world.scene.add(directionalFill);
      world.fillLight = directionalFill;
    }
    if (lp.actorFill) {
      var actorFillCfg = lp.actorFill;
      var actorFill = new THREE.PointLight(
        actorFillCfg.color,
        actorFillCfg.intensity,
        actorFillCfg.distance,
        actorFillCfg.decay
      );
      actorFill.castShadow = false;
      addPointLight(actorFill);
      world.actorFill = actorFill;
      world.actorFillOffset = actorFillCfg.offset;
    }

    // riempimento caldo al centro della stanza: solleva la parete "anchor" (a
    // sud, verso la camera) senza toccare il budget hemi+sun (~1.14 qui sotto
    // ~1.3, il tetto oltre cui Lambert clippa). Fioco e locale: non conta nel
    // budget perché la sua intensità decade rapidamente con la distanza.
    if (indoor && !red) {
      var roomFill = lp.roomFill;
      var fill = new THREE.PointLight(
        roomFill ? roomFill.color : LC.fill.color,
        roomFill ? roomFill.intensity : LC.fill.intensity,
        roomFill ? roomFill.distance : Math.max(map.width, map.height) * LC.fill.distanceMult,
        LC.fill.decay
      );
      if (roomFill) {
        fill.position.set(roomFill.position[0], roomFill.position[1], roomFill.position[2]);
      } else {
        fill.position.set(cx, IWALL_H - 0.05, cz);
      }
      addPointLight(fill);
    }
    world.practicalLights = [];
    var practicalCfg = LC.practical && LC.practical[map.id];
    if (practicalCfg) {
      var practical = new THREE.PointLight(
        practicalCfg.color,
        practicalCfg.intensity,
        practicalCfg.distance,
        practicalCfg.decay
      );
      practical.position.set(
        practicalCfg.position[0],
        practicalCfg.position[1],
        practicalCfg.position[2]
      );
      practical.castShadow = false;
      addPointLight(practical);
      world.practicalLights.push(practical);
      addPracticalLightPool(map, world);
    }
    var accents = LC.accents && LC.accents[map.id];
    if (accents) {
      for (var lightIndex = 0; lightIndex < accents.length; lightIndex++) {
        var accentCfg = accents[lightIndex];
        var accent = new THREE.PointLight(
          accentCfg.color,
          accentCfg.intensity,
          accentCfg.distance,
          2
        );
        accent.position.set(
          accentCfg.position[0],
          accentCfg.position[1],
          accentCfg.position[2]
        );
        accent.castShadow = false;
        addPointLight(accent);
        world.practicalLights.push(accent);
      }
    }
    while (pointLightCount < MAX_POINT_LIGHTS) {
      var inactive = new THREE.PointLight(0xffffff, 0, 0, 2);
      inactive.name = 'shader-topology-point-light-' + pointLightCount;
      inactive.position.set(cx, 0, cz);
      inactive.castShadow = false;
      addPointLight(inactive);
      if (!world.regionalAccent) world.regionalAccent = inactive;
    }
  }

  function practicalLightPoolTexture() {
    if (texCache.practicalLightPool) return texCache.practicalLightPool;
    var cv = document.createElement('canvas');
    cv.width = 128; cv.height = 128;
    var c = cv.getContext('2d');
    var gradient = c.createRadialGradient(64, 64, 2, 64, 64, 62);
    gradient.addColorStop(0, 'rgba(255,255,255,0.88)');
    gradient.addColorStop(0.42, 'rgba(255,255,255,0.34)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gradient;
    c.fillRect(0, 0, 128, 128);
    texCache.practicalLightPool = makeSurfaceTex(cv);
    return texCache.practicalLightPool;
  }

  function addPracticalLightPool(map, world) {
    if (map.id !== 'sheriff' && map.id !== 'palmer') return;
    var group = new THREE.Group();
    group.name = map.id + '-practical-light-pool';
    var warm = map.id === 'sheriff' ? 0xffc779 : 0xff9147;
    var material = new THREE.MeshBasicMaterial({
      map: practicalLightPoolTexture(), color: warm,
      transparent: true, opacity: map.id === 'sheriff' ? 0.24 : 0.25,
      depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
      polygonOffset: true, polygonOffsetFactor: -3
    });
    var pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    pool.rotation.x = -Math.PI / 2;
    if (map.id === 'sheriff') {
      // Pool belongs to the authored floor lamp in the waiting corner.
      pool.position.set(12.02, 0.034, 6.92);
      pool.scale.set(3.4, 2.4, 1);
      var deskGlowMaterial = new THREE.MeshBasicMaterial({
        map: practicalLightPoolTexture(), color: 0x4b9a70,
        transparent: true, opacity: 0.38, depthWrite: false,
        blending: THREE.AdditiveBlending, toneMapped: false,
        polygonOffset: true, polygonOffsetFactor: -3
      });
      [[2.9, 2.45], [9.1, 2.45]].forEach(function (p) {
        var deskGlow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), deskGlowMaterial);
        deskGlow.rotation.x = -Math.PI / 2;
        deskGlow.position.set(p[0], 0.755, p[1]);
        deskGlow.scale.set(0.82, 0.62, 1);
        deskGlow.renderOrder = 3;
        group.add(deskGlow);
      });
    } else {
      // Palmer's western hearth throws a short, broad pool into the room.
      pool.position.set(1.9, 0.034, 7.45);
      pool.scale.set(4, 2.5, 1);
      var source = new THREE.Mesh(
        new THREE.PlaneGeometry(0.48, 0.5),
        new THREE.MeshBasicMaterial({
          map: practicalLightPoolTexture(), color: 0xe66c2f,
          transparent: true, opacity: 0.82, depthWrite: false,
          blending: THREE.AdditiveBlending, toneMapped: false
        })
      );
      source.rotation.y = Math.PI / 2;
      source.position.set(1.195, 0.42, 7.45);
      group.add(source);
    }
    pool.renderOrder = 2;
    group.add(pool);
    world.scene.add(group);
    world.practicalLightPools = group;
  }

  function buildWorld(S) {
    var map = S.map;
    var weather = weatherFor(map);
    var world = {
      scene: new THREE.Scene(), liquids: [], liquidResources: [], foamRects: [],
      waterfalls: [], sparkles: [], npcs: [], trees: [],
      tape: [], smokes: [], dust: [], wetSurfaces: [], map: map,
      weather: weather, rain: null, rainImpacts: null, atmosphere: null,
      authoredPropLayerState: null, authoredPropLayer: null, authoredPropCount: 0,
      architectureLayerState: null, architectureLayer: null,
      architectureCount: 0, architectureWet: false, architectureSeason: null,
      authoredVegetationPreculled: 0
    };
    var bg;
    if (map.id === 'redroom') bg = 0x2a0a0e;
    else if (map.id === 'town' || map.id === 'woods') bg = 0x2a3a40;
    else bg = map.indoor ? 0x121b22 : 0x1a1816;
    world.scene.background = new THREE.Color(bg);
    var environmentKind = ENVIRONMENT_PROFILES[map.id]
      ? map.id
      : (map.indoor ? 'indoor' : 'outdoor');
    world.scene.environment = environmentFor(environmentKind);
    world.environmentKind = environmentKind;
    // nebbia atmosferica: PNW umido, più densa nel bosco
    var fogCfg = CONFIG.fog[map.id];
    if (fogCfg) world.scene.fog = new THREE.Fog(fogCfg.color || bg, fogCfg.near, fogCfg.far);
    world.base = baseCharOf(map);
    bakeGround(map, world, { woodsOpen: S.clues.length >= 3 });
    // Capture/runtime style is one contract: dry terrain cannot keep the wet
    // clearcoat and rain field merely because map id is town/woods.
    if (world.terrainStyle && world.terrainStyle.wet === false) {
      weather = null;
      world.weather = null;
    }
    addDioramaBase(map, world);
    addLights(map, world);
    if (!map.indoor && world.terrainStyle && world.terrainStyle.wet) addWetSurfaces(map, world);
    if (world.terrainStyle && world.terrainStyle.wet) addTownCurbTransition(map, world);
    addGroundDressing(map, world);
    addTerrainRelief(map, world);
    // Woods zoning now lives in the material-aware albedo/roughness bake.
    // Keeping separate y=0.022 decals under y=0.026 wet paths caused shimmer.
    if (weather) {
      world.rain = createRain(map, world.scene, weather);
      world.rainImpacts = createRainImpacts(map, world.scene, weather);
      world.atmosphere = createAtmosphereField(map, world.scene, weather);
    }
    addLodgeAtmosphere(map, world);

    // posizioni dei landmark speciali da non renderizzare come tile normali
    var welcomeSigns = {};
    var visualLandmarkClearance = {};
    var backgroundTreeSpecs = {};
    (map.objects || []).forEach(function (o) {
      if (o.type === 'landmark' && o.kind === 'welcomesign') welcomeSigns[o.x + ',' + o.y] = true;
      if (o.type === 'landmark' && o.kind === 'waterfall') {
        // The ASCII tree wall remains collision-canonical, but its render
        // proxies may not intersect the waterfall source, curtain or basin.
        for (var clearY = o.y; clearY <= o.y + o.h + 1; clearY++) {
          for (var clearX = o.x - 3; clearX <= o.x + o.w + 2; clearX++) {
            visualLandmarkClearance[clearX + ',' + clearY] = true;
          }
        }
      }
    });

    var x, y, ch;
    for (y = 0; y < map.height; y++) {
      for (x = 0; x < map.width; x++) {
        ch = map.rows[y].charAt(x);
        if (ch === 'T' || ch === 'Y') {
          if (visualLandmarkClearance[x + ',' + y]) continue;
          var th = treeVisualSeed(x, y);
          var tv = th & 3;
          var ts = map.id === 'woods'
            ? 0.68 + ((th >>> 2) & 255) / 255 * 0.72
            : 0.86 + ((th >>> 2) & 255) / 255 * 0.28;
          var tr = ((th >>> 10) & 1023) / 1024 * Math.PI * 2;
          var corridorTree = false;
          if (map.id === 'woods') {
            for (var treeDy = -1; treeDy <= 1 && !corridorTree; treeDy++) {
              var neighbourRow = map.rows[y + treeDy];
              for (var treeDx = -1; treeDx <= 1; treeDx++) {
                var neighbourCh = neighbourRow && neighbourRow.charAt(x + treeDx);
                if (neighbourCh === 'p' || neighbourCh === 'o') {
                  corridorTree = true;
                  break;
                }
              }
            }
          }
          var forestJitterX = map.id === 'woods'
            ? (corridorTree ? 0.42 : 0.92)
            : 0.22;
          var forestJitterZ = map.id === 'woods'
            ? (corridorTree ? 0.84 : 0.76)
            : 0.18;
          var tjx = (((th >>> 20) & 31) / 31 - 0.5) * forestJitterX;
          var tjz = (((th >>> 25) & 31) / 31 - 0.5) *
            forestJitterZ;
          var treeScaleX = 0.93 + ((th >>> 5) & 15) / 100;
          var treeScaleZ = 0.94 + ((th >>> 14) & 15) / 110;
          var treeRotX = (((th >>> 7) & 15) / 15 - 0.5) *
            (map.id === 'woods' ? 0.08 : 0.055);
          var treeRotZ = (((th >>> 16) & 15) / 15 - 0.5) *
            (map.id === 'woods' ? 0.1 : 0.065);
          var authoredTreeReplacement = authoredVegetationReplacesTile(
            map.id, x + 0.5, y + 0.6);
          // If the authored GLB is already resident, do not allocate a complete
          // procedural tree only to hide it a few milliseconds later. Loading
          // and failure paths still build the proxy, preserving fallback.
          if (authoredTreeReplacement &&
              authoredVegetationAsset.status === 'ready') {
            world.authoredVegetationPreculled++;
            continue;
          }
          if (map.id === 'woods' && !corridorTree && !authoredTreeReplacement) {
            var instanceKey = ch + tv;
            if (!backgroundTreeSpecs[instanceKey]) backgroundTreeSpecs[instanceKey] = [];
            backgroundTreeSpecs[instanceKey].push({
              x: x + 0.5 + tjx,
              z: y + 0.6 + tjz,
              rx: treeRotX,
              ry: tr,
              rz: treeRotZ,
              sx: ts * treeScaleX,
              sy: ts,
              sz: ts * treeScaleZ
            });
            continue;
          }
          var tree = tree3D(ch, x + 0.5 + tjx, y + 0.6 + tjz, world.scene, tv, ts, tr);
          if (map.id === 'woods') {
            // Blob/contact shadow su ogni tronco; shadow-map dinamica solo per
            // alberi che disegnano il corridoio e per un campione del fondale.
            // Mantiene la lettura della foresta senza oltre cento submission
            // ridondanti nella passata direzionale.
            tree.foliage[0].castShadow = corridorTree || ((th >>> 6) & 3) === 0;
          }
          tree.group.scale.x *= treeScaleX;
          tree.group.scale.z *= treeScaleZ;
          tree.group.rotation.x = treeRotX;
          tree.group.rotation.z = treeRotZ;
          tree.weatherBaseX = treeRotX;
          tree.weatherBaseZ = treeRotZ;
          tree.weatherPhase = ((th >>> 3) & 255) / 255 * Math.PI * 2;
          world.trees.push(tree);
        } else if (ch === 'S' && !welcomeSigns[x + ',' + y]) {
          sign3D(x + 0.5, y + 0.5, world.scene, SIGN_LABELS[map.id + ':' + x + ',' + y]);
        } else if (ch === 'G') {
          var gv = (x * 31 + y * 17) % 3;
          world.scene.add(gv === 0 ? graveCross(x + 0.5, y + 0.5) : graveStone(x + 0.5, y + 0.5));
          blobShadow(world.scene, x + 0.5, y + 0.62, 0.24);
        } else if (ch === 'M') {
          world.scene.add(billboard(statueTexture(), 1, 1, x + 0.5, y + 0.55));
          blobShadow(world.scene, x + 0.5, y + 0.6, 0.3);
        } else if (ch === 'X') {
          var tp = billboard(tapeTexture(), 1, 1, x + 0.5, y + 0.55);
          world.scene.add(tp);
          world.tape.push({ sprite: tp, x: x, y: y });
        } else if (ch === 'L') {
          world.scene.add(lampPost(x + 0.5, y + 0.5));
          blobShadow(world.scene, x + 0.5, y + 0.62, 0.22);
        } else if (ch === 'P') {
          world.scene.add(telephonePole(x + 0.5, y + 0.5));
          blobShadow(world.scene, x + 0.5, y + 0.6, 0.2);
        } else if (ch === 'B') {
          var civicBench = map.id === 'town' && x === 31 && y === 31;
          var benchX = x + (civicBench ? 0.88 : 0.5);
          var benchZ = y + (civicBench ? 0.76 : 0.6);
          world.scene.add(benchMesh(benchX, benchZ));
          blobShadow(world.scene, benchX, benchZ + 0.15, 0.32);
        } else if (ch === 'F') {
          var lakesideFence = map.id === 'town' && x === 14 &&
            y >= 26 && y <= 31;
          world.scene.add(lakesideFence
            ? shoreFenceMesh(x + 0.5, y + 0.5, y)
            : fenceMesh(x + 0.5, y + 0.5));
          blobShadow(world.scene, x + 0.5, y + 0.58, 0.4);
        } else if (ch === 'A') {
          world.scene.add(flowerbedMesh(x + 0.5, y + 0.5));
          blobShadow(world.scene, x + 0.5, y + 0.62, 0.42);
        } else if (ch === 'H') {
          var civicHydrant = map.id === 'town' && x === 32 && y === 30;
          var hydrantX = x + (civicHydrant ? 0.78 : 0.5);
          var hydrantZ = y + (civicHydrant ? 0.38 : 0.5);
          world.scene.add(townHydrant3D(hydrantX, hydrantZ));
          blobShadow(world.scene, hydrantX, hydrantZ + 0.1, 0.2);
        } else if (ch === 'E') {
          world.scene.add(townMailbox3D(x + 0.5, y + 0.5));
          blobShadow(world.scene, x + 0.5, y + 0.6, 0.2);
        } else if (ch === 'n') {
          if (!authoredVegetationCoversUnderstory(map.id, x + 0.5, y + 0.5)) {
            world.scene.add(townShrub3D(x + 0.5, y + 0.5, treeVisualSeed(x, y)));
            blobShadow(world.scene, x + 0.5, y + 0.58, 0.32);
          }
        }
      }
    }
    if (map.id === 'woods') addBackgroundTreeInstances(world, backgroundTreeSpecs);

    // acqua e olio come mesh dedicate
    tileRects(map, 'w').forEach(function (rc) { waterMesh(rc, 'w', world); });
    addOilPortalTerrain(map, world);
    tileRects(map, 'o').forEach(function (rc) { waterMesh(rc, 'o', world); });
    finalizeLiquidEdges(world);

    applyAuthoredArchitectureLayer(world, map);
    extrudeWalls(map, world.scene);
    addDoorFrames(map, world.scene);
    furniture(map, world.scene);
    addProps(map, world.scene);
    addAuthoredEnvironmentKit(map, world.scene);

    (map.objects || []).forEach(function (o) {
      if (o.type === 'sparkle' && typeof o.dialogue === 'string') {
        var sp = billboard(sparkleTexture(), 0.5, 0.5, o.x + 0.5, o.y + 0.6, 0.25);
        sp.userData.dialogue = o.dialogue;
        world.scene.add(sp);
        world.sparkles.push(sp);
      } else if (o.type === 'landmark') {
        if (o.kind === 'welcomesign') {
          // Render-only northward staging separates the base from Cooper while
          // the interaction and collision remain on the original map tile.
          landmarkWelcomesign(o.x + 0.5, o.y + 0.32, world.scene);
        }
        else if (o.kind === 'tracks') landmarkTracks(o.x, o.y, o.w, o.h, world.scene);
        else if (o.kind === 'cemetery') landmarkCemetery(o.x, o.y, o.w, o.h, world.scene);
        else if (o.kind === 'waterfall') landmarkWaterfall(o.x, o.y, o.w, o.h, world);
      }
    });

    S.npcs.forEach(function (n) {
      world.npcs.push(addWorldNpcActor(world, n));
    });
    world.npcRosterSignature = npcRosterSignature(S.npcs);

    upgradeLambertMaterials(world, map);
    applyAuthoredPropLayer(world, map);
    applyAuthoredWelcomeBiome(world);
    applyAuthoredVegetation(world);
    applyLightingMaterialPolicy(world.scene);
    return world;
  }

  /* ---------------- API ---------------- */

  R.init = function (glCanvas) {
    if (!Sp) return false;
    // Capture CSS dimensions before setPixelRatio(): Three.js immediately
    // resizes the backing buffer when pixel ratio changes. Reading
    // glCanvas.width afterwards applied DPR twice (1280×720 → 5120×2880).
    var initialW = glCanvas.clientWidth || glCanvas.width || viewportW;
    var initialH = glCanvas.clientHeight || glCanvas.height || viewportH;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true });
    } catch (e) { return false; }
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    // Il composer esegue più render pass. Impedire il reset automatico fra i
    // pass rende R.stats() una misura del frame completo, non dell'ultimo quad.
    renderer.info.autoReset = false;
    applyRenderQuality(initialW, initialH);
    renderer.setSize(initialW, initialH, false);
    updatePostQuality(initialW, initialH);
    var aspect0 = initialW / initialH;
    currentAspect = aspect0;
    camera = new THREE.PerspectiveCamera(fovForAspect(aspect0), aspect0, 0.1, 300);
    startAuthoredPropAssetLoad();
    startAuthoredWelcomeBiomeLoad();
    startAuthoredVegetationLoad();
    startAuthoredCharacterAssetLoad();
    startAuthoredArchitectureLoad();
    return true;
  };

  R.resize = function (w, h) {
    if (!renderer) return;
    applyRenderQuality(w, h);
    renderer.setSize(w, h, false);
    updatePostQuality(w, h);
    currentAspect = w / h;
    camera.aspect = currentAspect;
    camera.fov = fovForAspect(currentAspect);
    camera.updateProjectionMatrix();
  };

  R.prewarm = function (mapId, clues) {
    if (!renderer || !camera || !GAME.Maps || !GAME.Maps[mapId]) return 0;
    if (worlds[mapId]) return 0;
    var started = typeof performance !== 'undefined' ? performance.now() : Date.now();
    var map = GAME.Maps[mapId];
    var syntheticNpcs = (map.npcs || []).map(function (n) {
      return {
        id: n.id, x: n.x, y: n.y, vx: n.x, vy: n.y,
        sprite: n.sprite, name: n.name, dialogue: n.dialogue,
        dir: n.dir || 'down', cond: n.cond, wander: n.wander,
        moving: false, moveT: 0
      };
    });
    worlds[mapId] = buildWorld({
      mapId: mapId,
      map: map,
      npcs: syntheticNpcs,
      clues: clues || []
    });
    if (renderer.compile) {
      var previousTarget = renderer.getRenderTarget();
      var compileTarget = null;
      // Outdoor beauty is rendered by SSAOPass into its linear target. Compile
      // there as well, rather than producing an unused default-sRGB variant.
      if (ensureComposer(worlds[mapId].scene, map) &&
          ssaoPass && ssaoPass.beautyRenderTarget) {
        compileTarget = ssaoPass.beautyRenderTarget;
      }
      try {
        renderer.setRenderTarget(compileTarget);
        renderer.compile(worlds[mapId].scene, camera);
      } finally {
        renderer.setRenderTarget(previousTarget);
      }
    }
    var ended = typeof performance !== 'undefined' ? performance.now() : Date.now();
    prewarmDurationMs = ended - started;
    prewarmMapId = mapId;
    return prewarmDurationMs;
  };

  R.characterAudit = function () {
    function actorRow(actor) {
      if (!actor) return null;
      var data = actor.userData || {};
      var skeleton = data.skeleton;
      var poseChecksum = 0;
      if (skeleton) {
        for (var bi = 0; bi < skeleton.bones.length; bi++) {
          var bone = skeleton.bones[bi];
          var weight = bi + 1;
          // q and -q are the same rotation. Canonicalize the audit checksum so
          // a keyframe sign flip cannot masquerade as a pose discontinuity.
          var qSign = bone.quaternion.w < 0 ? -1 : 1;
          poseChecksum += weight * (
            bone.position.x * 1.1 + bone.position.y * 1.7 + bone.position.z * 2.3 +
            bone.quaternion.x * qSign * 2.9 +
            bone.quaternion.y * qSign * 3.7 +
            bone.quaternion.z * qSign * 4.1 +
            bone.quaternion.w * qSign * 0.3
          );
        }
      }
      var shadowCasters = 0, shadowReceivers = 0;
      (data.skinnedParts || []).forEach(function (part) {
        if (part.castShadow) shadowCasters++;
        if (part.receiveShadow) shadowReceivers++;
      });
      return {
        name: data.actorName || null,
        role: data.actorRole || null,
        authored: !!data.authoredRigged,
        npcId: data.npcId || null,
        activeClip: data.activeClip || null,
        activeWeight: data.activeClip && data.actions && data.actions[data.activeClip]
          ? data.actions[data.activeClip].getEffectiveWeight() : 0,
        idleWeight: data.actions && data.actions.TP_idle
          ? data.actions.TP_idle.getEffectiveWeight() : 0,
        boneCount: skeleton ? skeleton.bones.length : 0,
        skeletonId: skeleton ? (skeleton.uuid || skeleton.bones[0].uuid) : null,
        firstBoneId: skeleton && skeleton.bones.length ? skeleton.bones[0].uuid : null,
        partCount: data.skinnedParts ? data.skinnedParts.length : 0,
        poseChecksum: Math.round(poseChecksum * 100000) / 100000,
        shadowCasters: shadowCasters,
        shadowReceivers: shadowReceivers,
        scale: [actor.scale.x, actor.scale.y, actor.scale.z],
        position: [actor.position.x, actor.position.y, actor.position.z],
        ownedMaterials: data.dynamicMaterials ? data.dynamicMaterials.length : 0,
        contextProps: data.contextPropParts ? data.contextPropParts.length : 0,
        visibleContextProps: data.contextPropParts
          ? data.contextPropParts.filter(function (part) { return part.visible; }).length
          : 0,
        walkPhaseBase: typeof data.walkPhaseBase === 'number'
          ? data.walkPhaseBase : null,
        walkSampleTime: typeof data.lastWalkSampleTime === 'number'
          ? data.lastWalkSampleTime : null
      };
    }
    var rows = [];
    var player = actorRow(playerActor);
    if (player) rows.push(player);
    var npcs = cur ? cur.npcs.map(actorRow) : [];
    rows = rows.concat(npcs);
    var skeletonIds = {}, firstBoneIds = {};
    rows.forEach(function (row) {
      if (row.skeletonId) skeletonIds[row.skeletonId] = true;
      if (row.firstBoneId) firstBoneIds[row.firstBoneId] = true;
    });
    var sourceBoneIds = {};
    Object.keys(authoredCharacterAsset.roots).forEach(function (rootName) {
      var sources = skinnedCharacterSources(authoredCharacterAsset.roots[rootName]);
      if (!sources.length) return;
      sources[0].skeleton.bones.forEach(function (bone) {
        sourceBoneIds[bone.uuid] = true;
      });
    });
    return {
      asset: authoredCharacterAsset.status,
      version: authoredCharacterAsset.version,
      roots: Object.keys(authoredCharacterAsset.roots).sort(),
      clips: Object.keys(authoredCharacterAsset.clips).sort(),
      player: player,
      npcs: npcs,
      authoredActors: rows.filter(function (row) { return row.authored; }).length,
      uniqueSkeletons: Object.keys(skeletonIds).length,
      sourceBoneLeaks: Object.keys(firstBoneIds).filter(function (id) {
        return sourceBoneIds[id];
      }),
      rosterSignature: cur ? cur.npcRosterSignature : null,
      runtimeRosterSignature: cur && GAME.Engine && GAME.Engine.state
        ? npcRosterSignature(GAME.Engine.state.npcs) : null,
      counters: {
        npcInstances: authoredCharacterAsset.npcInstances,
        mixers: authoredCharacterAsset.mixerInstances,
        skeletons: authoredCharacterAsset.skeletonInstances,
        ownedMaterials: authoredCharacterAsset.ownedMaterialInstances,
        geometryViews: Object.keys(authoredCharacterAsset.geometryViews).length,
        cloneErrors: authoredCharacterAsset.cloneErrors
      }
    };
  };

  // Solo harness visivo: inquadra il rig runtime da profilo/tre-quarti senza
  // cambiare camera canonica, collisioni o stato salvato.
  R.setCharacterEvidenceView = function (view) {
    characterEvidenceView = view === 'side' || view === 'threeq' ? view : null;
  };

  // Diagnostica read-only per harness e audit visivi; nessun dettaglio mutabile
  // del renderer viene esposto.
  R.stats = function () {
    var fadeClones = 0;
    var drawingBuffer = renderer
      ? renderer.getDrawingBufferSize(new THREE.Vector2())
      : new THREE.Vector2();
    if (cur) {
      for (var i = 0; i < cur.trees.length; i++) {
        if (cur.trees[i].fadeMaterials) fadeClones += cur.trees[i].fadeMaterials.length;
      }
    }
    return {
      charTextures: Object.keys(charTexCache).length,
      worlds: Object.keys(worlds).length,
      calls: renderer ? renderer.info.render.calls : 0,
      triangles: renderer ? renderer.info.render.triangles : 0,
      aspect: currentAspect,
      fov: camera ? camera.fov : 0,
      cameraScale: cameraScaleForAspect(currentAspect),
      rainStreaks: cur && cur.rain ? cur.rain.count : 0,
      rainBufferUploadsPerFrame: 0,
      rainImpacts: cur && cur.rainImpacts ? cur.rainImpacts.count : 0,
      atmospherePoints: cur && cur.atmosphere ? cur.atmosphere.count : 0,
      atmosphereDraws: cur
        ? (cur.rain ? 1 : 0) + (cur.rainImpacts ? 1 : 0) +
          (cur.atmosphere ? (cur.atmosphere.draws || 1) : 0) +
          (cur.lodgeGlow ? 1 : 0)
        : 0,
      liquidTextureUploadsPerFrame: 0,
      liquidSurfaceMode: cur && cur.liquids.length ? 'static-pbr-uv-flow' : 'none',
      weatherWind: cur && cur.weather
        ? [cur.weather.windX, cur.weather.windZ] : null,
      wetSurfaces: cur ? cur.wetSurfaces.length : 0,
      treeFadeClones: fadeClones,
      actorGeometries: actorGeo ? Object.keys(actorGeo).length : 0,
      actorMaterials: Object.keys(actorMaterialCache).length,
      actorRigs: actorRigCount,
      actorDynamicMaterials: actorDynamicMaterialCount,
      environment: cur ? cur.environmentKind : null,
      upgradedLambertMaterials: cur ? cur.upgradedLambertMaterials : 0,
      dressingInstances: cur ? (cur.dressingCount || 0) : 0,
      // Legacy QA harnesses poll this established aggregate readiness field.
      // Keep them from freezing a procedural fallback frame while the
      // vegetation GLB is still decoding; dedicated fields below stay exact.
      authoredPropAsset: cur && AUTHORED_VEGETATION_PLACEMENTS[cur.map.id] &&
        authoredVegetationAsset.status === 'loading'
        ? 'loading' : authoredPropAsset.status,
      authoredPropInstances: cur ? (cur.authoredPropCount || 0) : 0,
      authoredPropLayer: cur ? cur.authoredPropLayerState : null,
      authoredPropError: authoredPropAsset.error,
      authoredWelcomeBiomeAsset: authoredWelcomeBiomeAsset.status,
      authoredWelcomeBiomeLayer: cur ? (cur.welcomeBiomeState || null) : null,
      authoredWelcomeBiomeInstances: cur ? (cur.welcomeBiomeInstances || 0) : 0,
      authoredWelcomeBiomeError: authoredWelcomeBiomeAsset.error,
      authoredVegetationAsset: authoredVegetationAsset.status,
      authoredVegetationEnabled: authoredVegetationEnabled(),
      authoredVegetationDebug: window.location
        ? new URLSearchParams(window.location.search).get('vegetationDebug') : null,
      authoredVegetationHash: AUTHORED_VEGETATION_HASH,
      authoredVegetationLayer: cur ? (cur.authoredVegetationState || null) : null,
      authoredVegetationInstances: cur ? (cur.authoredVegetationInstances || 0) : 0,
      authoredVegetationBatches: cur ? (cur.authoredVegetationBatches || 0) : 0,
      authoredVegetationHeroes: cur ? (cur.authoredVegetationHeroes || 0) : 0,
      authoredVegetationHeroNames: cur && cur.authoredVegetationHeroNames
        ? cur.authoredVegetationHeroNames.slice() : [],
      authoredVegetationHeroBounds: cur && cur.authoredVegetationHeroBounds
        ? cur.authoredVegetationHeroBounds.slice() : [],
      authoredVegetationReplacements: cur ? (cur.authoredVegetationReplacements || 0) : 0,
      authoredVegetationError: authoredVegetationAsset.error,
      authoredCharacterAsset: authoredCharacterAsset.status,
      authoredCharacterPlayer: authoredCharacterAsset.playerActive,
      authoredCharacterNpcInstances: authoredCharacterAsset.npcInstances,
      authoredCharacterRoots: authoredCharacterAsset.status === 'ready'
        ? Object.keys(authoredCharacterAsset.roots).length : 0,
      authoredCharacterVersion: authoredCharacterAsset.version,
      authoredCharacterClips: authoredCharacterAsset.status === 'ready'
        ? Object.keys(authoredCharacterAsset.clips).length : 0,
      authoredCharacterMixers: authoredCharacterAsset.mixerInstances,
      authoredCharacterSkeletons: authoredCharacterAsset.skeletonInstances,
      authoredCharacterOwnedMaterials: authoredCharacterAsset.ownedMaterialInstances,
      authoredCharacterGeometryViews: Object.keys(authoredCharacterAsset.geometryViews).length,
      authoredCharacterCloneErrors: authoredCharacterAsset.cloneErrors,
      authoredCharacterPlayerClip: playerActor && playerActor.userData.authoredRigged
        ? playerActor.userData.activeClip : null,
      authoredCharacterRosterSignature: cur ? cur.npcRosterSignature : null,
      authoredCharacterError: authoredCharacterAsset.error,
      authoredArchitectureAsset: authoredArchitectureAsset.status,
      authoredArchitectureEnabled: authoredArchitectureEnabled(),
      authoredArchitectureDebug: window.location
        ? new URLSearchParams(window.location.search).get('architecture') : null,
      authoredArchitectureRoots: authoredArchitectureAsset.status === 'ready'
        ? Object.keys(authoredArchitectureAsset.roots).length : 0,
      authoredArchitectureLayer: cur ? cur.architectureLayerState : null,
      authoredArchitectureInstances: cur ? (cur.architectureCount || 0) : 0,
      authoredArchitectureWet: cur ? !!cur.architectureWet : false,
      authoredArchitectureSeason: cur ? cur.architectureSeason : null,
      authoredArchitectureValidation: authoredArchitectureAsset.validation,
      authoredArchitectureError: authoredArchitectureAsset.error,
      ssao: ssaoEnabled && !!ssaoPass && !(cur && cur.map && cur.map.indoor),
      ssaoScale: ssaoEnabled && !(cur && cur.map && cur.map.indoor) ? postPixelRatio : 0,
      qualityMode: qualityMode,
      pixelRatio: renderPixelRatio,
      viewportWidth: viewportW,
      viewportHeight: viewportH,
      drawingBufferWidth: drawingBuffer.x,
      drawingBufferHeight: drawingBuffer.y,
      measuredFps: measuredFps,
      frameIntervalMs: frameIntervalMs,
      frameP95Ms: frameP95Ms,
      deviceProfile: deviceProfile,
      adaptiveDegraded: adaptiveDegraded,
      fxaa: !!fxaaPass,
      exposure: renderer ? renderer.toneMappingExposure : 0,
      shadowTexel: cur && cur.shadowState ? cur.shadowState.texel : 0,
      prewarmMapId: prewarmMapId,
      prewarmDurationMs: prewarmDurationMs,
      shadowUpdateHz: cur && cur.shadowState
        ? Math.round(1000 / cur.shadowState.refreshMs * 10) / 10
        : 0,
      shadowSnapTexels: cur && cur.shadowState ? cur.shadowState.snapTexels : 0
    };
  };

  R.render = function (S, dt, t) {
    sampleFramePerformance();
    if (curId !== S.mapId) {
      // I clone trasparenti servono solo mentre la camera e' dietro una chioma:
      // non lasciarli sospesi nei mondi cached durante un cambio mappa.
      if (cur) {
        for (var oldTree = 0; oldTree < cur.trees.length; oldTree++) {
          cur.trees[oldTree].opacity = 1;
          setTreeOpacity(cur.trees[oldTree], 1);
          if (cur.trees[oldTree].blob && cur.trees[oldTree].blob.material) {
            setBlobOpacity(cur.trees[oldTree].blob, BLOB_BASE_OPACITY);
          }
        }
      }
      // cache dei mondi: costruiti una sola volta per mappa (niente leak GPU)
      cur = worlds[S.mapId] || (worlds[S.mapId] = buildWorld(S));
      curId = S.mapId;
      camSnap = true;
      renderer.toneMappingExposure = cur.exposure || 1;
      if (cur.shadowState) cur.shadowState.dirty = true;
      renderer.shadowMap.needsUpdate = true;
      lastShadowUpdate = t;
      if (S.mapId === 'redroom') lodgeEnterT = t; // effetto "reverse" all'ingresso nella Loggia
      if (!playerActor) {
        playerActor = runtimeActor3D('cooper', 'player');
        playerBlob = blobShadow(null, 0, 0, 0.35);
      }
      cur.scene.add(playerActor); // add() lo riparenta dalla scena precedente
      cur.scene.add(playerBlob);
      // loadMap ricrea gli NPC e il layer narrativo può mutarne il roster:
      // riconcilia per id, mai per posizione nell'array.
      reconcileWorldNpcActors(cur, S.npcs, true);
    }
    reconcileWorldNpcActors(cur, S.npcs, false);

    var p = S.player;
    var px = p.x / TILE + 0.5, pz = p.y / TILE + 1.0;
    var dialogueActor = dialogueActorContext(S);
    applyRuntimeLighting(cur, px, pz, dt);
    if (cur.actorFill && cur.actorFillOffset) {
      cur.actorFill.position.set(
        px + cur.actorFillOffset[0],
        cur.actorFillOffset[1],
        pz + cur.actorFillOffset[2]
      );
    }
    var shadowState = cur.shadowState;
    var shadowTexel = shadowState ? shadowState.texel : 0.25;
    var shadowSnap = shadowTexel * (shadowState ? shadowState.snapTexels : 1);
    var desiredShadowX = Math.round(px / shadowSnap) * shadowSnap;
    var desiredShadowZ = Math.round(pz / shadowSnap) * shadowSnap;
    var shadowX = shadowState ? shadowState.x : desiredShadowX;
    var shadowZ = shadowState ? shadowState.z : desiredShadowZ;
    // Deadband leggermente più largo di mezzo texel: piccoli errori numerici
    // non fanno oscillare la shadow camera tra due celle adiacenti.
    if (!shadowState || shadowState.dirty ||
        Math.abs(px - shadowX) > shadowSnap * 0.72) shadowX = desiredShadowX;
    if (!shadowState || shadowState.dirty ||
        Math.abs(pz - shadowZ) > shadowSnap * 0.72) shadowZ = desiredShadowZ;
    var shadowCenterChanged = !shadowState ||
      Math.abs(shadowX - shadowState.x) > shadowTexel * 0.5 ||
      Math.abs(shadowZ - shadowState.z) > shadowTexel * 0.5;
    var shadowRefresh = cur.sun && (
      !shadowState || shadowState.dirty || shadowCenterChanged ||
      t - lastShadowUpdate >= (shadowState ? shadowState.refreshMs : 80)
    );
    if (shadowRefresh) {
      cur.sun.position.set(
        shadowX + cur.sunOffset.x,
        cur.sunOffset.y,
        shadowZ + cur.sunOffset.z
      );
      cur.sun.target.position.set(shadowX, 0, shadowZ);
      cur.sun.target.updateMatrixWorld();
      if (shadowState) {
        shadowState.x = shadowX;
        shadowState.z = shadowZ;
        shadowState.dirty = false;
      }
      renderer.shadowMap.needsUpdate = true;
      lastShadowUpdate = t;
    }
    var pmoving = p.moving;
    var pMoveT = p.moveT;
    var pReverse = false;
    if (S.mapId === 'redroom' && t - lodgeEnterT < 1500) {
      pmoving = true;
      pMoveT = ((t - lodgeEnterT) / 720) % 1;
      pReverse = true; // reverse anche per Cooper
    }
    var playerCoffee = !!(S.dialogue && S.mapId === 'diner' &&
      S.dialogue.id === 'norma' && dialogueActor.speaker === 'COOPER');
    // Position first so contact solving sees the current grid sample, not the
    // previous rendered frame.
    playerActor.position.set(px, 0.015, pz);
    updateActorPose(playerActor, p.dir, pmoving, pMoveT, t, {
      reverse: pReverse,
      coffee: playerCoffee,
      talk: !!(S.dialogue && dialogueActor.speaker === 'COOPER' && !playerCoffee),
      inspect: !!(S.dialogue && !dialogueActor.npcId)
    });
    playerBlob.position.set(px, 0.012, pz - 0.05);
    setBlobOpacity(playerBlob, cur.contactOpacity || BLOB_BASE_OPACITY);

    // dust: spawn all'inizio di ogni passo, solo su erba/terra
    if (p.moving && !wasMoving) {
      var underRow = S.map.rows[p.ty] || '';
      var under = underRow[p.tx];
      if (under === '.' || under === ',' || under === 'g' || under === 'p') {
        var nPuffs = 1 + (Math.random() < 0.3 ? 1 : 0);
        for (var pi = 0; pi < nPuffs; pi++) {
          var pmat = new THREE.SpriteMaterial({
            map: dustTexture(), transparent: true, opacity: 0.24,
            depthWrite: false, color: 0xb7a77f
          });
          var puff = new THREE.Sprite(pmat);
          puff.center.set(0.5, 0.02);
          puff.scale.set(0.22, 0.13, 1);
          var backX = p.dir === 'right' ? -0.18 : (p.dir === 'left' ? 0.18 : 0);
          var backZ = p.dir === 'down' ? -0.18 : (p.dir === 'up' ? 0.18 : 0);
          var pxo = px + backX + (Math.random() - 0.5) * 0.12;
          var pzo = pz + backZ + (Math.random() - 0.5) * 0.10;
          puff.position.set(pxo, 0.025, pzo);
          cur.scene.add(puff);
          cur.dust.push({ s: puff, age: -pi * 45, x: pxo, y: 0.025, z: pzo });
        }
      }
    }
    wasMoving = p.moving;

    // aggiorna dust
    for (i = cur.dust.length - 1; i >= 0; i--) {
      var d = cur.dust[i];
      d.age += dt;
      var life = 440;
      if (d.age > life) {
        cur.scene.remove(d.s); d.s.material.dispose(); cur.dust.splice(i, 1); continue;
      }
      var a = d.age / life;
      d.s.position.y = d.y + a * 0.16;
      var sc = 1 + a * 0.75;
      d.s.scale.set(0.22 * sc, 0.13 * sc, 1);
      d.s.material.opacity = 0.20 * (1 - a) * (1 - a);
    }

    var i, s;
    var lodge = S.mapId === 'redroom';
    var weatherGust = 0;
    if (cur.weather) {
      weatherGust = Math.sin(t * 0.00145) * 0.72 +
        Math.sin(t * 0.0037 + 1.3) * 0.28;
      cur.weather.gust = weatherGust;
    }
    for (i = 0; i < cur.npcs.length; i++) {
      s = cur.npcs[i];
      var npc = s.userData.npc;
      var nmoving = npc.moving;
      var nMoveT = npc.moveT;
      var nReverse = false, nDance = false;
      var jx = 0, nOpacity = null;
      if (lodge) {
        if (t - lodgeEnterT < 1500) {
          // ingresso nella Loggia: camminata al contrario (reverse, stile Twin Peaks)
          nmoving = true;
          nMoveT = ((t - lodgeEnterT) / 720) % 1;
          nReverse = true;
        } else if (npc.sprite === 'mfap') {
          // il Nano balla: passo continuo + inclinazione/braccia coreografate.
          nMoveT = (t / 880) % 1;
          nmoving = true;
          nDance = true;
        }
        if (npc.sprite === 'bob') {
          // BOB: jitter orizzontale + luminosita' pulsante
          jx = (Math.floor(t / 70) % 2) ? 0.045 : -0.045;
          setActorBrightness(s, 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(t / 260)));
        } else if (npc.sprite === 'laura') {
          // Laura: fade/slide "a scatti" (teleport ogni 90ms)
          var lph = Math.floor(t / 90);
          jx = (((lph * 7) % 3) - 1) * 0.05;
          nOpacity = 0.6 + 0.25 * (((lph * 5) % 4) / 3);
        }
      }
      if (npc.sprite === 'giant') {
        // il Gigante: slow-fade in/out
        nOpacity = 0.4 + 0.5 * (0.5 + 0.5 * Math.sin(t / 1400));
      }
      if (npc.sprite === 'bob' && !lodge) setActorBrightness(s, 1);
      setActorOpacity(s, nOpacity !== null ? nOpacity : (npc.sprite === 'laura' ? 0.85 : 1));
      setBlobOpacity(s.userData.blob, cur.contactOpacity || BLOB_BASE_OPACITY);
      s.visible = GAME.Engine.npcActive(npc);
      var npcStage = npcVisualStage(S.map, npc);
      var npcSideStage = npcStage.side;
      var npcNorthStage = npcStage.north;
      s.position.set(npc.vx + 0.5 + jx + npcSideStage, 0.015,
        npc.vy + 1.0 + npcNorthStage);
      updateActorPose(s, npc.dir, nmoving, nMoveT, t, {
        reverse: nReverse,
        dance: nDance,
        spectral: npc.sprite === 'laura',
        menace: lodge && npc.sprite === 'bob',
        talk: dialogueActor.npcId === npc.id &&
          !!dialogueActor.speaker && dialogueActor.speaker !== 'COOPER'
      });
      if (s.userData.blob) {
        s.userData.blob.visible = s.visible;
        s.userData.blob.position.set(
          npc.vx + 0.5 + npcSideStage, 0.012, npc.vy + 0.95 + npcNorthStage);
      }
    }
    for (i = 0; i < cur.sparkles.length; i++) {
      s = cur.sparkles[i];
      s.visible = !S.flags['done_' + s.userData.dialogue];
      s.scale.setScalar(0.4 + 0.12 * Math.sin(t / 180));
    }
    var open = S.clues.length >= 3;
    for (i = 0; i < cur.tape.length; i++) cur.tape[i].sprite.visible = !open;

    // Nei boschi una fila a sud del giocatore puo' annettere tutta la sua
    // silhouette. Sfumiamo soltanto 1-2 chiome realmente interposte, con lerp:
    // il bosco resta fitto, ma l'attore conserva un contorno leggibile.
    for (i = 0; i < cur.trees.length; i++) {
      var tree = cur.trees[i];
      if (tree.authoredReplaced) continue;
      var occludes = S.mapId === 'woods' &&
        tree.z > pz + 0.05 && tree.z < pz + 1.75 &&
        Math.abs(tree.x - px) < 1.05;
      var treeTargetOpacity = occludes ? 0.3 : 1;
      var treeFade = 1 - Math.exp(-dt * 0.014);
      tree.opacity += (treeTargetOpacity - tree.opacity) * treeFade;
      if (!occludes && Math.abs(1 - tree.opacity) < 0.01) tree.opacity = 1;
      setTreeOpacity(tree, tree.opacity);
      if (tree.blob && tree.blob.material) {
        setBlobOpacity(tree.blob, BLOB_BASE_OPACITY * tree.opacity);
      }
      if (cur.weather && tree.weatherPhase !== undefined) {
        var localGust = weatherGust * 0.018 +
          Math.sin(t * 0.0011 + tree.weatherPhase) * 0.006;
        tree.group.rotation.z = tree.weatherBaseZ + localGust;
        tree.group.rotation.x = tree.weatherBaseX + localGust * 0.38;
      }
    }

    for (i = 0; i < cur.smokes.length; i++) {
      var sm = cur.smokes[i];
      var age = (t * 0.00022 + sm.ph) % 1;
      var smokeWindX = cur.weather ? cur.weather.windX * 1.8 : 0.35;
      var smokeWindZ = cur.weather ? cur.weather.windZ * 1.35 : 0;
      sm.s.position.set(
        sm.x + age * smokeWindX + Math.sin(age * 6 + sm.ph * 20) * 0.11,
        sm.y + age * 1.25,
        sm.z + age * smokeWindZ
      );
      var sc = 0.34 + age * 0.8;
      sm.s.scale.set(sc, sc, 1);
      sm.s.material.opacity = 0.55 * (age < 0.15 ? age / 0.15 : 1 - (age - 0.15) / 0.85);
    }

    // Static PBR textures move through UV matrices only: no Canvas repaint,
    // texture upload or per-frame material allocation.
    for (i = 0; i < cur.liquidResources.length; i++) {
      var liquid = cur.liquidResources[i];
      var direction = liquid.kind === 'o' ? -1 : 1;
      var speed = liquid.kind === 'o' ? 0.000006 : 0.000018;
      liquid.colorMap.offset.set(
        t * speed * direction + (cur.weather ? cur.weather.windX * t * 0.000002 : 0),
        t * speed * 0.47
      );
      liquid.normalMap.offset.set(
        -t * speed * 1.7,
        t * speed * 1.13 + (cur.weather ? cur.weather.windZ * t * 0.000003 : 0)
      );
      liquid.roughnessMap.offset.set(t * speed * 0.31, -t * speed * 0.23);
      if (liquid.glintMap) {
        // Glints are world-anchored. Their broad and fine scales remain fixed
        // while colour/normal layers counter-flow beneath them; this preserves
        // wind response without the old screen-space streak conveyor.
        liquid.glintMap.offset.set(0, 0);
      }
    }

    if (cur.rain) {
      var r = cur.rain;
      r.material.uniforms.uTime.value = t * 0.001;
      r.material.uniforms.uGust.value = weatherGust;
    }
    if (cur.rainImpacts) {
      cur.rainImpacts.material.uniforms.uTime.value = t * 0.001;
    }
    if (cur.atmosphere) {
      var atmospherePulse = 0.84 + 0.16 * Math.sin(t * 0.0007);
      var redRoomAtmosphere = cur.map && cur.map.id === 'redroom';
      if (cur.atmosphere.materials) {
        for (i = 0; i < cur.atmosphere.materials.length; i++) {
          cur.atmosphere.materials[i].opacity =
            cur.atmosphere.baseOpacities[i] *
            (redRoomAtmosphere ? atmospherePulse : 1);
        }
      } else {
        if (!cur.atmosphere.staticOpacity) {
          cur.atmosphere.material.opacity =
            cur.atmosphere.baseOpacity * atmospherePulse;
        }
      }
      var atmosphereDrift = redRoomAtmosphere ? 0.28 : 0.06;
      cur.atmosphere.points.position.x = cur.atmosphere.baseX +
        (cur.weather ? cur.weather.windX : 0) *
        Math.sin(t * 0.00031) * atmosphereDrift;
      cur.atmosphere.points.position.z = cur.atmosphere.baseZ +
        (cur.weather ? cur.weather.windZ : 0) *
        Math.sin(t * 0.00031) * atmosphereDrift;
    }
    if (cur.lodgeAtmosphere) {
      for (i = 0; i < cur.lodgeAtmosphere.animated.length; i++) {
        var lodgeLayer = cur.lodgeAtmosphere.animated[i];
        lodgeLayer.material.opacity = lodgeLayer.base +
          Math.sin(t * 0.00115 + lodgeLayer.phase) * lodgeLayer.amplitude;
      }
    }
    for (i = 0; i < cur.waterfalls.length; i++) {
      var waterfall = cur.waterfalls[i];
      for (var wi = 0; wi < waterfall.ribbonMaps.length; wi++) {
        var ribbonFlow = waterfall.ribbonMaps[wi];
        ribbonFlow.texture.offset.y = ribbonFlow.phase - t * 0.001 * ribbonFlow.speed;
      }
      waterfall.spray.material.uniforms.uTime.value = t * 0.001;
      waterfall.spray.material.uniforms.uGust.value = weatherGust;
      for (var pi = 0; pi < waterfall.impactPatches.length; pi++) {
        var impactPatch = waterfall.impactPatches[pi];
        if (impactPatch.staticPatch) continue;
        var impactLife = 0.5 + 0.5 * Math.sin(
          t * 0.0019 * impactPatch.speed + impactPatch.phase);
        impactPatch.material.opacity = impactPatch.baseOpacity *
          (0.12 + 0.88 * Math.pow(impactLife, 1.8));
        var impactScale = impactPatch.baseScale * (0.86 + impactLife * 0.28);
        impactPatch.mesh.scale.set(impactScale, 1, impactScale);
        impactPatch.mesh.rotation.y = impactPatch.baseRotation +
          Math.sin(t * 0.0011 * impactPatch.speed + impactPatch.phase) * 0.045;
      }
    }

    // Authored welcome biome: batched foliage receives a restrained two-band
    // wind response, while shallow water/ripples vary microscopically under
    // rainfall. No vertex uploads, particles or per-frame material creation.
    if (cur.welcomeBiomeWind) {
      for (i = 0; i < cur.welcomeBiomeWind.length; i++) {
        var wind = cur.welcomeBiomeWind[i];
        var gust = weatherGust * 0.024 +
          Math.sin(t * 0.0011 + wind.phase) * 0.008;
        wind.mesh.rotation.z = wind.baseZ + gust;
        wind.mesh.rotation.x = wind.baseX + gust * 0.34;
      }
    }
    if (cur.welcomeBiomeWetMaterials) {
      for (i = 0; i < cur.welcomeBiomeWetMaterials.length; i++) {
        var wetBiome = cur.welcomeBiomeWetMaterials[i];
        var rainPulse = 0.5 + Math.sin(t * 0.0042 + wetBiome.phase) * 0.5;
        wetBiome.material.roughness = 0.065 + rainPulse * 0.035;
        if (wetBiome.material.clearcoatRoughness !== undefined) {
          wetBiome.material.clearcoatRoughness = 0.035 + rainPulse * 0.025;
        }
        if (wetBiome.ripple) {
          var rippleScale = 1 + rainPulse * 0.035;
          wetBiome.mesh.scale.set(
            wetBiome.baseScale.x * rippleScale,
            wetBiome.baseScale.y,
            wetBiome.baseScale.z * rippleScale
          );
        }
      }
    }
    var cameraScale = cameraScaleForAspect(currentAspect);
    var woodsCamera = S.mapId === 'woods';
    var indoorCamera = !!S.map.indoor && S.mapId !== 'redroom';
    var distanceFactor = woodsCamera ? 1 : (indoorCamera ? 0.88 : 0.86);
    var dialogueCamera = !!S.dialogue;
    var targetBack = (dialogueCamera ? 4.9 : CAM_BACK) * cameraScale *
      (dialogueCamera ? 1 : distanceFactor);
    var kb = 1 - Math.exp(-dt * 0.006);
    currentCamBack += (targetBack - currentCamBack) * kb;

    // Interiors spend more of the frame on the room ahead of the doorway:
    // this keeps the north staff row inside frame and reduces empty south void.
    var indoorLead = S.mapId === 'palmer' ? 1.3 : 1.65;
    var LEAD = (indoorCamera ? indoorLead : 1.2) * cameraScale;
    var targetLeadX = 0, targetLeadZ = 0, targetDialogueOrbitX = 0;
    if (dialogueCamera) {
      // In conversazione inquadra punto medio col vicino interagito. Stato
      // dialogo legacy non conserva actor_id, quindi prossimità resta fonte
      // deterministica e coincide col contratto d'interazione adiacente.
      var nearestNpc = null, nearestD2 = 6.26;
      for (var fi = 0; fi < S.npcs.length; fi++) {
        var focusNpc = S.npcs[fi];
        if (!GAME.Engine.npcActive(focusNpc)) continue;
        var fdx = focusNpc.vx + 0.5 - px;
        var fdz = focusNpc.vy + 1.0 - pz;
        var fd2 = fdx * fdx + fdz * fdz;
        if (fd2 < nearestD2) {
          nearestD2 = fd2;
          nearestNpc = focusNpc;
        }
      }
      if (nearestNpc) {
        var pairDx = nearestNpc.vx + 0.5 - px;
        var pairDz = nearestNpc.vy + 1.0 - pz;
        targetLeadX = pairDx * 0.62;
        targetLeadZ = pairDz * 0.62;
        // Coppie allineate nord/sud si occludono da camera frontale: offset
        // laterale crea two-shot obliquo e lascia leggibili entrambi i volti.
        if (Math.abs(pairDz) > Math.abs(pairDx) * 0.75) {
          targetDialogueOrbitX = (p.dir === 'down' ? -1 : 1) * 2.8 * cameraScale;
        } else {
          targetDialogueOrbitX = (pairDx < 0 ? 1 : -1) * 0.72 * cameraScale;
        }
      }
    } else {
      if (p.dir === 'up') targetLeadZ = -LEAD;
      else if (p.dir === 'down') targetLeadZ = LEAD;
      else if (p.dir === 'left') targetLeadX = -LEAD;
      else targetLeadX = LEAD;
    }
    var kl = 1 - Math.exp(-dt * 0.012);
    leadX += (targetLeadX - leadX) * kl;
    leadZ += (targetLeadZ - leadZ) * kl;
    dialogueOrbitX += (targetDialogueOrbitX - dialogueOrbitX) * kl;

    // Leggero aumento dell'angolo nei boschi: separa piano di cammino, attore e
    // fila di alberi senza cambiare collisioni o composizione delle altre mappe.
    var heightFactor = woodsCamera ? 1 : (indoorCamera ? 0.84 : 0.84);
    var targetCamUp = dialogueCamera
      ? 5.4 * cameraScale
      : (woodsCamera ? CAM_UP + 1.8 : CAM_UP) * cameraScale * heightFactor;
    var ku = 1 - Math.exp(-dt * 0.006);
    currentCamUp += (targetCamUp - currentCamUp) * ku;
    if (camSnap) {
      currentCamBack = targetBack;
      currentCamUp = targetCamUp;
      leadX = targetLeadX; leadZ = targetLeadZ;
      dialogueOrbitX = targetDialogueOrbitX;
      camera.position.set(px + leadX + dialogueOrbitX, currentCamUp, pz + currentCamBack + leadZ);
      camSnap = false;
    } else {
      var tx = px + leadX + dialogueOrbitX, ty = currentCamUp, tz = pz + currentCamBack + leadZ;
      var k = 1 - Math.exp(-dt * 0.008);
      camera.position.x += (tx - camera.position.x) * k;
      camera.position.y += (ty - camera.position.y) * k;
      camera.position.z += (tz - camera.position.z) * k;
    }
    camera.lookAt(
      dialogueCamera ? px + leadX : camera.position.x,
      dialogueCamera ? 0.9 : (woodsCamera ? 0 : (indoorCamera ? 0.32 : 0.22)),
      dialogueCamera ? pz + leadZ + 0.15 : camera.position.z - currentCamBack + 0.2
    );
    if (characterEvidenceView === 'side') {
      camera.position.set(px + 4.2, 1.5, pz);
      camera.lookAt(px, 0.72, pz);
    } else if (characterEvidenceView === 'threeq') {
      camera.position.set(px + 3.25, 1.72, pz + 3.25);
      camera.lookAt(px, 0.76, pz);
    }
    renderer.info.reset();
    if (ensureComposer(cur.scene, cur.map)) composer.render(dt * 0.001);
    else renderer.render(cur.scene, camera);
  };

  GAME.Render3D = R;
})();
