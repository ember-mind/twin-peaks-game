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
      up: 13.5, back: 9.2, fov: 38, refAspect: 1.5, maxFov: 80
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
      redroom: { hemiSky: 0xff6858, hemiGround: 0x401014, hemiIntensity: 0.8, sunColor: 0xffd0c0, sunIntensity: 0.4 },
      indoor: { hemiSky: 0xfff2dc, hemiGround: 0x6a5a48, hemiIntensity: 0.72, sunColor: 0xffeecc, sunIntensity: 0.42 },
      outdoor: { hemiSky: 0xd0e4ff, hemiGround: 0x8a7c60, hemiIntensity: 0.6, sunColor: 0xfff0d0, sunIntensity: 0.68 },
      fill: { color: 0xffe0b0, intensity: 0.22, distanceMult: 1.4, decay: 2 },
      shadow: { mapSize: 2048, near: 1, farMult: 3, bias: -0.0004, normalBias: 0.03 }
    },
    fog: {
      town: { near: 22, far: 55 },
      woods: { near: 14, far: 42 },
      redroom: { near: 10, far: 32 }
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

  var worlds = {};
  var cur = null, curId = null;
  var playerSprite = null, playerBlob = null;
  var charTexCache = {};
  var texCache = {};
var camSnap = true;
var lastWater = -9999;
var currentCamBack = CAM_BACK;
var wasMoving = false;
var dustParts = [];
var leadX = 0, leadZ = 0;

  /* palette edifici */
  var BPAL = CONFIG.palettes;

  function makeTex(cv) {
    var t = new THREE.CanvasTexture(cv);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  /* ---------------- texture billboard ---------------- */

  function tree3D(kind, x, z, scene) {
    // albero a 2 piani incrociati (90°): mantiene il pixel art del billboard
    // ma ha vero volume, si vede diverso da ogni angolo.
    var tex = treeTexture(kind, 0);
    var mat = new THREE.MeshLambertMaterial({
      map: tex, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide
    });
    var grp = new THREE.Group();
    var w = 1.5, h = 2.0;
    var p1 = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    p1.position.set(x, h * 0.5, z);
    p1.castShadow = true; // le Plane non proiettano ombre in GL di default; tronco sì
    grp.add(p1);
    var p2 = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    p2.rotation.y = Math.PI / 2;
    p2.position.set(x, h * 0.5, z);
    grp.add(p2);
    // tronco sottile per ombre di contatto
    var trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.12, 0.45, 6),
      new THREE.MeshLambertMaterial({ color: kind === 'Y' ? '#d8d0c0' : '#5a3a22', flatShading: true })
    );
    trunk.position.set(x, 0.22, z);
    trunk.castShadow = true; trunk.receiveShadow = true;
    grp.add(trunk);
    scene.add(grp);
    blobShadow(scene, x, z, 0.45);
    return grp;
  }

  // Testo dei cartelli, per mappa e posizione. Un tabellone vuoto letto
  // dall'alto sembra un tavolo: il testo e' cio' che lo rende un cartello.
  var SIGN_LABELS = {
    'woods:11,14': ['GLASTONBURY', 'GROVE'],
    'traincar:5,6': ['PONTE'],
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
    return simpleTex('dust', 12, 12, function (F) {
      F(4, 5, 4, 3, 'rgba(200,200,190,0.55)');
      F(3, 6, 6, 2, 'rgba(220,220,210,0.45)');
      F(5, 4, 2, 5, 'rgba(180,180,170,0.35)');
    });
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
    var x1 = rc.bx + rc.bw + EAVE;
    var z0 = rc.by - EAVE, z1 = rc.by + rc.bh + EAVE;
    var inset = Math.min((z1 - z0) / 2, (x1 - (rc.bx - EAVE)) * 0.25);
    var cx = x1 - inset - 0.7, cz = (z0 + z1) / 2;
    var yTop = WALL_H + ROOF_H;
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.65, 0.3),
      new THREE.MeshLambertMaterial({ color: '#8a4a38' })
    );
    body.position.set(cx, yTop + 0.18, cz);
    body.castShadow = true;
    var cap = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.08, 0.38),
      new THREE.MeshLambertMaterial({ color: '#5a2e22' })
    );
    cap.position.set(cx, yTop + 0.52, cz);
    var hole = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.03, 0.18),
      new THREE.MeshLambertMaterial({ color: '#180c08' })
    );
    hole.position.set(cx, yTop + 0.56, cz);
    scene.add(body); scene.add(cap); scene.add(hole);
    return { x: cx, y: yTop + 0.62, z: cz };
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
    var t = makeTex(cv);
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
    var t = makeTex(cv);
    t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
    texCache[key] = t;
    return t;
  }

  function charTex(name, dir, frame, moving, t) {
    var key = name + '_' + dir + '_' + frame + '_' + (!!moving ? 1 : 0) + '_' + Math.floor((t || 0) / 80);
    if (charTexCache[key]) return charTexCache[key];
    var cv = document.createElement('canvas');
    cv.width = 48; cv.height = 60;
    var c = cv.getContext('2d');
    Sp.drawChar(c, name, 0, 2, dir, frame, !!moving, t || 0);
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
    if (pal.sign) {
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
        F(px + 5, 4, 22, 3, pal.sign ? '#e8e8e8' : '#7aa0c8');
        F(px + 7, 4, 3, 3, pal.sign ? '#a81828' : '#5a80a8');
        F(px + 13, 4, 3, 3, pal.sign ? '#a81828' : '#5a80a8');
        F(px + 19, 4, 3, 3, pal.sign ? '#a81828' : '#5a80a8');
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
    return makeTex(cv);
  }

  /* ---------------- geometrie ---------------- */

  function hipRoof(rc, pal) {
    var x0 = rc.bx - EAVE, x1 = rc.bx + rc.bw + EAVE;
    var z0 = rc.by - EAVE, z1 = rc.by + rc.bh + EAVE;
    var yE = WALL_H, yR = WALL_H + ROOF_H;
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
    var slope = Math.sqrt(inset * inset + ROOF_H * ROOF_H);
    quad([x0, yE, z1], [x1, yE, z1], [rx1, yR, rz], [rx0, yR, rz], (x1 - x0) / 2, slope / 1.2);
    quad([x1, yE, z0], [x0, yE, z0], [rx0, yR, rz], [rx1, yR, rz], (x1 - x0) / 2, slope / 1.2);
    tri([x0, yE, z0], [x0, yE, z1], [rx0, yR, rz], (z1 - z0) / 2, slope / 1.2);
    tri([x1, yE, z1], [x1, yE, z0], [rx1, yR, rz], (z1 - z0) / 2, slope / 1.2);
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    var mesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: shingleTexture(pal) }));
    mesh.castShadow = true;
    // colmo
    var ridge = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(0.2, rx1 - rx0 + 0.15), 0.07, 0.16),
      new THREE.MeshLambertMaterial({ color: pal.rr })
    );
    ridge.position.set((rx0 + rx1) / 2, yR + 0.02, rz);
    // bordo gronda
    var edge = new THREE.Mesh(
      new THREE.BoxGeometry(x1 - x0, 0.07, z1 - z0),
      new THREE.MeshLambertMaterial({ color: pal.rb })
    );
    edge.position.set((x0 + x1) / 2, yE, (z0 + z1) / 2);
    edge.castShadow = true;
    var grp = new THREE.Group();
    grp.add(mesh); grp.add(ridge); grp.add(edge);
    return grp;
  }

  // tetto piatto dell'ospedale: parapetto + croce rossa piatta vista dall'alto
  function flatRoof(rc, pal) {
    var x0 = rc.bx - EAVE, x1 = rc.bx + rc.bw + EAVE;
    var z0 = rc.by - EAVE, z1 = rc.by + rc.bh + EAVE;
    var yE = WALL_H;
    var grp = new THREE.Group();
    var par = new THREE.Mesh(
      new THREE.BoxGeometry(x1 - x0, 0.18, z1 - z0),
      new THREE.MeshLambertMaterial({ color: pal.wall })
    );
    par.position.set((x0 + x1) / 2, yE + 0.09, (z0 + z1) / 2);
    par.castShadow = true;
    par.receiveShadow = true;
    var edge = new THREE.Mesh( // bordo scuro sul filo superiore del parapetto
      new THREE.BoxGeometry(x1 - x0, 0.03, z1 - z0),
      new THREE.MeshLambertMaterial({ color: pal.rb })
    );
    edge.position.set((x0 + x1) / 2, yE + 0.185, (z0 + z1) / 2);
    var side = Math.min(x1 - x0, z1 - z0) * 0.6;
    var cross = new THREE.Mesh(
      new THREE.PlaneGeometry(side, side),
      new THREE.MeshBasicMaterial({ map: hospitalCrossTexture(), transparent: true })
    );
    cross.rotation.x = -Math.PI / 2;
    cross.position.set((x0 + x1) / 2, yE + 0.2, (z0 + z1) / 2);
    grp.add(par); grp.add(edge); grp.add(cross);
    return grp;
  }

  // insegna montata sulla facciata sud, sopra la porta; ritorna posizione/dimensioni
  // per chi deve agganciarsi (es. le luci al neon del roadhouse)
  // Insegna dell'edificio. Sul TETTO, non sulla facciata: la facciata e' alta un
  // solo tile e la gronda la mette in ombra, li' il testo non si legge. Sopra il
  // colmo invece l'insegna e' in pieno campo visivo (la lezione del Double R).
  function addBuildingSign(rc, grp) {
    var doorX = rc.doors.length ? rc.doors[0].x + 0.5 : rc.bx + rc.bw / 2;
    var southZ = rc.by + rc.bh; // bordo sud: la faccia rivolta verso la camera

    if (rc.ch === '3') {
      // casa privata: niente insegna sul tetto, un cartello da giardino sul palo
      var pw = 1.6, ph = pw * 96 / 256;
      var plate = new THREE.Mesh(
        new THREE.PlaneGeometry(pw, ph),
        new THREE.MeshBasicMaterial({ map: palmerPlateTexture(), transparent: true })
      );
      var yardX = doorX + 1.6, yardZ = southZ + 0.9;
      plate.position.set(yardX, 0.92, yardZ);
      grp.add(plate);
      var stake = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.85, 0.08),
        new THREE.MeshLambertMaterial({ color: '#6a4a2e' })
      );
      stake.position.set(yardX, 0.42, yardZ);
      stake.castShadow = true;
      grp.add(stake);
      return null;
    }

    // Montata sul bordo FRONTALE del tetto, sopra la porta e davanti alla gronda:
    // abbastanza in alto da non essere in ombra, abbastanza bassa da restare in
    // quadro quando il giocatore arriva da sud.
    var w = Math.min(rc.bw * 0.72, 6.4), h = w * 96 / 512; // rapporto della texture
    var y = WALL_H + 0.34 + h / 2;
    var z = southZ + 0.34;                                 // proud della gronda (EAVE 0.25)
    var backing = new THREE.Mesh(                           // spessore scuro dietro la targa
      new THREE.BoxGeometry(w + 0.1, h + 0.1, 0.08),
      new THREE.MeshLambertMaterial({ color: '#241a12' })
    );
    backing.position.set(doorX, y, z - 0.05);
    backing.castShadow = true;
    grp.add(backing);
    var mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: signboardTexture(rc.ch), transparent: true })
    );
    mesh.position.set(doorX, y, z);
    grp.add(mesh);
    // due bracci di sostegno che tornano verso la facciata
    var armMat = new THREE.MeshLambertMaterial({ color: '#241a12' });
    var pi, px;
    for (pi = -1; pi <= 1; pi += 2) {
      px = doorX + pi * w * 0.36;
      var arm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.42), armMat);
      arm.position.set(px, y - h / 2 + 0.05, z - 0.25);
      grp.add(arm);
    }
    return { x: doorX, y: y, w: w, z: z };
  }

  // insegna sul colmo del tetto del Double R: il classico rooftop sign da diner americano
  function addDinerRoofSign(rc, grp) {
    var x0 = rc.bx - EAVE, x1 = rc.bx + rc.bw + EAVE;
    var z0 = rc.by - EAVE, z1 = rc.by + rc.bh + EAVE;
    var inset = Math.min((z1 - z0) / 2, (x1 - x0) * 0.25);
    var rx0 = x0 + inset, rx1 = x1 - inset, rz = (z0 + z1) / 2;
    var w = rx1 - rx0, h = w / 4; // stesso rapporto della texture 512x128
    var plane = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: dinerRoofTexture(), transparent: true })
    );
    plane.position.set((rx0 + rx1) / 2, WALL_H + ROOF_H + 0.45, rz);
    grp.add(plane);
    var post = new THREE.Mesh( // palo di sostegno fra il colmo e l'insegna
      new THREE.BoxGeometry(0.1, ROOF_H * 0.4, 0.1),
      new THREE.MeshLambertMaterial({ color: '#3a2a1a' })
    );
    post.position.set((rx0 + rx1) / 2, WALL_H + ROOF_H + 0.15, rz);
    grp.add(post);
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
    var z = rc.by + rc.bh + 0.06;
    var tex = neonTexture();
    var left = new THREE.Mesh(
      new THREE.PlaneGeometry(0.14, 0.55),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    );
    left.position.set(sign.x - sign.w / 2 - 0.22, sign.y, z);
    grp.add(left);
    var right = new THREE.Mesh(
      new THREE.PlaneGeometry(0.14, 0.55),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    );
    right.position.set(sign.x + sign.w / 2 + 0.22, sign.y, z);
    grp.add(right);
  }

  // tettoia coperta sopra la porta del Great Northern
  function addAwning(rc, pal, grp) {
    var doorX = rc.doors.length ? rc.doors[0].x + 0.5 : rc.bx + rc.bw / 2;
    var southZ = rc.by + rc.bh;
    var awning = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.08, 0.35),
      new THREE.MeshLambertMaterial({ color: pal.rb })
    );
    awning.position.set(doorX, WALL_H - 0.05, southZ + 0.15);
    awning.castShadow = true;
    grp.add(awning);
    var postH = WALL_H - 0.1;
    var postMat = new THREE.MeshLambertMaterial({ color: pal.trim });
    var post1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, postH, 0.06), postMat);
    post1.position.set(doorX - 0.45, postH / 2, southZ + 0.28);
    grp.add(post1);
    var post2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, postH, 0.06), postMat);
    post2.position.set(doorX + 0.45, postH / 2, southZ + 0.28);
    grp.add(post2);
  }

  function buildingGroup(rc) {
    var pal = BPAL[rc.ch];
    var grp = new THREE.Group();
    var facTex = facadeTexture(rc, pal);
    var sideT = plankTexture(pal);
    var sideMat = new THREE.MeshLambertMaterial({ map: sideT });
    var darkMat = new THREE.MeshLambertMaterial({ color: pal.wd });
    var mats = [sideMat, sideMat, darkMat, darkMat, new THREE.MeshLambertMaterial({ map: facTex }), darkMat];
    var box = new THREE.Mesh(new THREE.BoxGeometry(rc.bw, WALL_H, rc.bh), mats);
    box.position.set(rc.bx + rc.bw / 2, WALL_H / 2, rc.by + rc.bh / 2);
    box.castShadow = true;
    box.receiveShadow = true;
    grp.add(box);
    grp.add(rc.ch === '5' ? flatRoof(rc, pal) : hipRoof(rc, pal));

    // insegna + dettagli che rendono l'edificio riconoscibile a colpo d'occhio
    // il Double R ha la sua insegna da diner sul colmo: niente targa generica
    var sign = (rc.ch === '2') ? null : addBuildingSign(rc, grp);
    if (rc.ch === '2') addDinerRoofSign(rc, grp);
    if (rc.ch === '1') addFlagpole(rc, grp);
    if (rc.ch === '6' && sign) addNeonBars(rc, grp, sign);
    if (rc.ch === '4') addAwning(rc, pal, grp);
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

  function blobShadow(scene, x, z, r) {
    var m = new THREE.Mesh(
      new THREE.CircleGeometry(r, 12),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.012, z);
    scene.add(m);
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
  var fenceMats = null;
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

  function flowerbedTopTexture() {
    return simpleTex('flowerbed_top', 16, 16, function (F) {
      F(1, 1, 14, 14, '#3a2818');
      var fc = ['#d83030', '#f0d048', '#ffffff'];
      var spots = [[2, 2], [7, 1], [12, 3], [3, 7], [9, 8], [13, 9], [1, 12], [6, 13], [11, 13]];
      for (var i = 0; i < spots.length; i++) F(spots[i][0], spots[i][1], 1, 1, fc[i % 3]);
    });
  }

  function flowerbedMesh(x, z) {
    var side = new THREE.MeshLambertMaterial({ color: '#d8d0c0' }); // cordolo chiaro
    var top = new THREE.MeshLambertMaterial({ map: flowerbedTopTexture() });
    var mats = [side, side, top, side, side, side];
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.18, 0.94), mats);
    mesh.position.set(x, 0.09, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
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

  function waterMesh(rc, kind, world) {
    var pw = rc.w * TILE, ph = rc.h * TILE;
    var cv = document.createElement('canvas');
    cv.width = pw; cv.height = ph;
    var c = cv.getContext('2d');
    var tex = makeTex(cv);
    var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: kind === 'o' ? 0.96 : 0.92 });
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(rc.w, rc.h), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(rc.x + rc.w / 2, 0.03, rc.y + rc.h / 2);
    world.scene.add(mesh);
    world.liquids.push({ ctx: c, tex: tex, w: pw, h: ph, kind: kind, seed: rc.x * 31 + rc.y * 17 });
    paintLiquid(world.liquids[world.liquids.length - 1], 0);
  }

  function paintLiquid(L, t) {
    var c = L.ctx, w = L.w, h = L.h;
    var ph = Math.floor(t / 250);
    if (L.kind === 'o') {
      c.fillStyle = '#101018'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#2a2a40';
      for (var i = 0; i < Math.floor(w * h / 96); i++) {
        var sx = (L.seed * 13 + i * 37) % (w - 6), sy = (L.seed * 7 + i * 53) % (h - 3);
        c.fillRect(sx + ((ph + i) % 2), sy, 4 + (i % 3), 1);
      }
      c.fillStyle = 'rgba(120,60,90,0.20)';
      c.fillRect(0, 0, w, 2);
      return;
    }
    // acqua: base, riflesso cielo, onde, brillii, riva chiara sul perimetro
    c.fillStyle = '#3a76c0'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#4a86cc'; c.fillRect(0, 0, w, Math.floor(h * 0.45));
    c.fillStyle = '#78b4e8';
    var n = Math.max(3, Math.floor(w * h / 64));
    for (var j = 0; j < n; j++) {
      var ox = (L.seed * 11 + j * 29) % (w - 8), oy = (L.seed * 5 + j * 41) % (h - 4);
      c.fillRect(ox + ((ph + j) % 2) * 2, oy, 5, 1);
    }
    c.fillStyle = '#e8f4fc';
    for (j = 0; j < Math.max(1, n >> 2); j++) {
      var bx = (L.seed * 17 + j * 61 + ph * 7) % (w - 3), by = (L.seed * 3 + j * 47) % (h - 2);
      if ((ph + j) % 2) c.fillRect(bx, by, 2, 1);
    }
    c.fillStyle = 'rgba(220,240,250,0.85)';
    c.fillRect(0, 0, w, 2); c.fillRect(0, h - 1, w, 1);
    c.fillRect(0, 0, 1, h); c.fillRect(w - 1, 0, 1, h);
    c.fillStyle = 'rgba(150,190,220,0.6)';
    c.fillRect(0, 2, w, 1);
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

    var t = makeTex(cv);
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
    var post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.8, 0.16), postMat);
    post.position.set(x - 0.62, 0.9, z);
    post.castShadow = true; post.receiveShadow = true;
    grp.add(post);
    post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.8, 0.16), postMat);
    post.position.set(x + 0.62, 0.9, z);
    post.castShadow = true; post.receiveShadow = true;
    grp.add(post);
    // faccia +z (verso la camera) col testo; le altre restano legno
    var face = new THREE.MeshLambertMaterial({ map: welcomeSignTexture() });
    var board = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.6, 0.12),
      [frameMat, frameMat, frameMat, frameMat, face, frameMat]
    );
    board.position.set(x, 1.45, z + 0.03);
    board.castShadow = true; board.receiveShadow = true;
    grp.add(board);
    var cap = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.09, 0.2), postMat);
    cap.position.set(x, 1.8, z);
    cap.castShadow = true;
    grp.add(cap);
    scene.add(grp);
    blobShadow(scene, x, z, 0.7);
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

  function landmarkWaterfall(x, z, w, h, scene) {
    var group = new THREE.Group();
    var rock = new THREE.MeshLambertMaterial({ color: '#4a5a60', flatShading: true });
    var water = new THREE.MeshLambertMaterial({ color: '#7ab4e8', transparent: true, opacity: 0.85 });
    // parete rocciosa alta
    var wall = new THREE.Mesh(new THREE.BoxGeometry(w, 3.0, 0.8), rock);
    wall.position.set(x + w / 2, 1.5, z + 0.4);
    wall.castShadow = true; wall.receiveShadow = true;
    group.add(wall);
    // cascata (3 strisce)
    for (var i = 0; i < 3; i++) {
      var fall = new THREE.Mesh(new THREE.BoxGeometry(w / 4, 2.8, 0.12), water);
      fall.position.set(x + w / 2 + (i - 1) * (w / 5), 1.4, z + 0.85);
      group.add(fall);
    }
    // vasca sottostante
    var pool = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, 1.2), water);
    pool.position.set(x + w / 2, 0.06, z + 1.0);
    group.add(pool);
    // schiuma bianca in cima
    var foam = new THREE.Mesh(new THREE.BoxGeometry(w, 0.15, 0.25), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
    foam.position.set(x + w / 2, 2.95, z + 0.85);
    group.add(foam);
    scene.add(group);
    return group;
  }

  function createRain(scene) {
    var count = 1400;
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = Math.random() * 16;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 24;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({
      color: 0xb8d4f0, size: 0.13, transparent: true, opacity: 0.75,
      sizeAttenuation: true, depthWrite: false
    });
    var mesh = new THREE.Points(geo, mat);
    mesh.position.set(0, 0, 0);
    scene.add(mesh);
    return { mesh: mesh, count: count, speed: 0.012 };
  }

  /* ---------------- terreno + luci ---------------- */

  /* decorazioni del terreno: chiazze grandi + fiori/ciottoli/ciocche,
   * deterministiche (seed dall'id mappa) per rompere la monotonia dei prati */
  function decorateGround(c, map) {
    var seed = 7;
    for (var i = 0; i < map.id.length; i++) seed = (seed * 31 + map.id.charCodeAt(i)) & 0x7fffffff;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    var w = (map.width + BORDER * 2) * TILE, h = (map.height + BORDER * 2) * TILE;
    // chiazze morbide grandi (luce/ombra) su tutta l'area
    for (i = 0; i < 26; i++) {
      var bx = rnd() * w, by = rnd() * h, br = 24 + rnd() * 56;
      c.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.045)';
      c.beginPath(); c.arc(bx, by, br, 0, 6.2832); c.fill();
    }
    // dettagli puntuali solo sui tile d'erba
    function grassAt(px, py) {
      var tx = Math.floor(px / TILE) - BORDER, ty = Math.floor(py / TILE) - BORDER;
      var ch = chAt(map, tx, ty);
      return ch === '.' || ch === 'g';
    }
    var dark = map.id === 'woods';
    var n = Math.floor(map.width * map.height * 0.09);
    for (i = 0; i < n; i++) {
      var px = Math.floor(rnd() * w), py = Math.floor(rnd() * h);
      if (!grassAt(px, py)) continue;
      var kind = rnd();
      if (kind < 0.42) { // ciocca d'erba: due fili verticali
        c.fillStyle = dark ? '#1e3323' : '#7a9450';
        c.fillRect(px, py - 2, 1, 3); c.fillRect(px + 2, py - 1, 1, 2);
        c.fillStyle = dark ? '#557555' : '#c4cc94';
        c.fillRect(px + 1, py - 3, 1, 2);
      } else if (kind < 0.62) { // ciottolo
        c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(px, py + 1, 3, 1);
        c.fillStyle = dark ? '#6a6a62' : '#9a9a8e'; c.fillRect(px, py, 2, 2);
        c.fillStyle = dark ? '#8a8a80' : '#babaaa'; c.fillRect(px, py, 1, 1);
      } else if (kind < 0.82) { // fiorellino
        var fc = ['#e8e8f0', '#f0d048', '#e890b8', '#c8d8f0'][Math.floor(rnd() * 4)];
        c.fillStyle = dark ? '#1e3323' : '#7a9450'; c.fillRect(px + 1, py + 1, 1, 2);
        c.fillStyle = fc;
        c.fillRect(px, py, 2, 1); c.fillRect(px + 1, py - 1, 1, 1); c.fillRect(px + 1, py + 1, 1, 1);
      } else { // foglia/muschio scuro
        c.fillStyle = dark ? 'rgba(0,0,0,0.22)' : 'rgba(90,110,60,0.35)';
        c.fillRect(px, py, 3, 2);
      }
    }
  }

  // celle interne (pavimento/tappeto/arredo/porta/statua) da dipingere sulle mappe indoor;
  // le altre celle (muri i/R e tutto ciò che sta oltre il perimetro) restano nel vuoto scenico
  var INDOOR_FLOOR = { f: 1, c: 1, C: 1, t: 1, h: 1, K: 1, U: 1, D: 1, Z: 1, M: 1 };
  var VOID_COLOR = '#101820';

  function bakeGround(map, world, opts) {
    var w = (map.width + BORDER * 2) * TILE, h = (map.height + BORDER * 2) * TILE;
    var cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var c = cv.getContext('2d');
    var base = world.base;
    var x, y, ch;
    if (map.indoor) {
      c.fillStyle = VOID_COLOR;
      c.fillRect(0, 0, w, h);
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
                    Math.abs(x), Math.abs(y), 0, { map: map, woodsOpen: opts.woodsOpen });
      }
    }
    world.groundCtx = c;
    if (!map.indoor) decorateGround(c, map); // interni: nessuna decorazione stile prato nel vuoto
    world.groundTex = makeTex(cv);
    var geo = new THREE.PlaneGeometry(map.width + BORDER * 2, map.height + BORDER * 2);
    var mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: world.groundTex }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(map.width / 2, 0, map.height / 2);
    mesh.receiveShadow = true;
    world.scene.add(mesh);
  }

  function addLights(map, world) {
    var indoor = !!map.indoor;
    var red = map.id === 'redroom';
    var LC = CONFIG.lighting;
    var lp = red ? LC.redroom : (indoor ? LC.indoor : LC.outdoor);
    var hemi = new THREE.HemisphereLight(lp.hemiSky, lp.hemiGround, lp.hemiIntensity);
    var sun = new THREE.DirectionalLight(lp.sunColor, lp.sunIntensity);
    world.scene.add(hemi);
    var cx = map.width / 2, cz = map.height / 2;
    sun.position.set(cx - map.width * 0.6, Math.max(map.width, map.height) * 0.9, cz - map.height * 0.35);
    sun.target.position.set(cx, 0, cz);
    world.scene.add(sun.target);
    sun.castShadow = true;
    var d = Math.max(map.width, map.height) / 2 + 6;
    sun.shadow.mapSize.width = LC.shadow.mapSize;
    sun.shadow.mapSize.height = LC.shadow.mapSize;
    sun.shadow.camera.near = LC.shadow.near;
    sun.shadow.camera.far = Math.max(map.width, map.height) * LC.shadow.farMult;
    sun.shadow.camera.left = -d; sun.shadow.camera.right = d;
    sun.shadow.camera.top = d; sun.shadow.camera.bottom = -d;
    sun.shadow.bias = LC.shadow.bias;
    sun.shadow.normalBias = LC.shadow.normalBias;
    world.scene.add(sun);

    // riempimento caldo al centro della stanza: solleva la parete "anchor" (a
    // sud, verso la camera) senza toccare il budget hemi+sun (~1.14 qui sotto
    // ~1.3, il tetto oltre cui Lambert clippa). Fioco e locale: non conta nel
    // budget perché la sua intensità decade rapidamente con la distanza.
    if (indoor && !red) {
      var fill = new THREE.PointLight(LC.fill.color, LC.fill.intensity, Math.max(map.width, map.height) * LC.fill.distanceMult, LC.fill.decay);
      fill.position.set(cx, IWALL_H - 0.05, cz);
      world.scene.add(fill);
    }
  }

  function buildWorld(S) {
    var map = S.map;
    var world = { scene: new THREE.Scene(), liquids: [], sparkles: [], npcs: [], tape: [], smokes: [], dust: [] };
    var bg;
    if (map.id === 'redroom') bg = 0x2a0a0e;
    else if (map.id === 'town' || map.id === 'woods') bg = 0x2a3a40;
    else bg = 0x1a1816;
    world.scene.background = new THREE.Color(bg);
    // nebbia atmosferica: PNW umido, più densa nel bosco
    var fogCfg = CONFIG.fog[map.id];
    if (fogCfg) world.scene.fog = new THREE.Fog(bg, fogCfg.near, fogCfg.far);
    world.base = baseCharOf(map);
    bakeGround(map, world, { woodsOpen: S.clues.length >= 3 });
    addLights(map, world);
    if (map.id === 'town' || map.id === 'woods') world.rain = createRain(world.scene);

    // posizioni dei landmark speciali da non renderizzare come tile normali
    var welcomeSigns = {};
    (map.objects || []).forEach(function (o) {
      if (o.type === 'landmark' && o.kind === 'welcomesign') welcomeSigns[o.x + ',' + o.y] = true;
    });

    var x, y, ch;
    for (y = 0; y < map.height; y++) {
      for (x = 0; x < map.width; x++) {
        ch = map.rows[y].charAt(x);
        if (ch === 'T' || ch === 'Y') {
          tree3D(ch, x + 0.5, y + 0.6, world.scene);
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
          world.scene.add(benchMesh(x + 0.5, y + 0.6));
          blobShadow(world.scene, x + 0.5, y + 0.75, 0.32);
        } else if (ch === 'F') {
          world.scene.add(fenceMesh(x + 0.5, y + 0.5));
          blobShadow(world.scene, x + 0.5, y + 0.58, 0.4);
        } else if (ch === 'A') {
          world.scene.add(flowerbedMesh(x + 0.5, y + 0.5));
          blobShadow(world.scene, x + 0.5, y + 0.62, 0.42);
        } else if (ch === 'H') {
          world.scene.add(billboard(hydrantTexture(), 0.42, 0.55, x + 0.5, y + 0.55));
          blobShadow(world.scene, x + 0.5, y + 0.6, 0.2);
        } else if (ch === 'E') {
          world.scene.add(billboard(mailboxTexture(), 0.4, 0.75, x + 0.5, y + 0.55));
          blobShadow(world.scene, x + 0.5, y + 0.6, 0.2);
        } else if (ch === 'n') {
          world.scene.add(billboard(bushTexture(), 0.8, 0.7, x + 0.5, y + 0.5));
          blobShadow(world.scene, x + 0.5, y + 0.58, 0.32);
        }
      }
    }

    // acqua e olio come mesh dedicate
    tileRects(map, 'w').forEach(function (rc) { waterMesh(rc, 'w', world); });
    tileRects(map, 'o').forEach(function (rc) { waterMesh(rc, 'o', world); });

    scanBuildings(map).forEach(function (rc) {
      world.scene.add(buildingGroup(rc));
      if (map.id === 'town') { // comignoli fumanti solo negli esterni
        var chm = addChimney(rc, world.scene);
        for (var pi = 0; pi < 3; pi++) {
          var pmat = new THREE.SpriteMaterial({ map: smokeTexture(), transparent: true, opacity: 0, depthWrite: false });
          var puff = new THREE.Sprite(pmat);
          puff.position.set(chm.x, chm.y, chm.z);
          world.scene.add(puff);
          world.smokes.push({ s: puff, x: chm.x, y: chm.y, z: chm.z, ph: pi / 3 + (rc.bx % 7) * 0.11 });
        }
      }
    });
    extrudeWalls(map, world.scene);
    addDoorFrames(map, world.scene);
    furniture(map, world.scene);
    addProps(map, world.scene);

    (map.objects || []).forEach(function (o) {
      if (o.type === 'sparkle' && typeof o.dialogue === 'string') {
        var sp = billboard(sparkleTexture(), 0.5, 0.5, o.x + 0.5, o.y + 0.6, 0.25);
        sp.userData.dialogue = o.dialogue;
        world.scene.add(sp);
        world.sparkles.push(sp);
      } else if (o.type === 'landmark') {
        if (o.kind === 'welcomesign') landmarkWelcomesign(o.x + 0.5, o.y + 0.5, world.scene);
        else if (o.kind === 'tracks') landmarkTracks(o.x, o.y, o.w, o.h, world.scene);
        else if (o.kind === 'cemetery') landmarkCemetery(o.x, o.y, o.w, o.h, world.scene);
        else if (o.kind === 'waterfall') landmarkWaterfall(o.x, o.y, o.w, o.h, world.scene);
      }
    });

    S.npcs.forEach(function (n) {
      var m = new THREE.SpriteMaterial({ map: charTex(n.sprite, n.dir, 0, false, 0), transparent: true, alphaTest: 0.05 });
      if (n.sprite === 'laura') m.opacity = 0.85;
      var s = new THREE.Sprite(m);
      s.center.set(0.5, 0.08);
      s.scale.set(1.0, 1.5, 1);
      s.position.set(n.x + 0.5, 0.01, n.y + 1.0);
      s.userData.npc = n;
      world.scene.add(s);
      world.npcs.push(s);
      blobShadow(world.scene, n.x + 0.5, n.y + 0.95, 0.3);
    });

    return world;
  }

  /* ---------------- API ---------------- */

  R.init = function (glCanvas) {
    if (!Sp) return false;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true });
    } catch (e) { return false; }
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(glCanvas.width, glCanvas.height, false);
    var aspect0 = glCanvas.width / glCanvas.height;
    camera = new THREE.PerspectiveCamera(fovForAspect(aspect0), aspect0, 0.1, 300);
    return true;
  };

  R.resize = function (w, h) {
    if (!renderer) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = fovForAspect(w / h);
    camera.updateProjectionMatrix();
  };

  R.render = function (S, dt, t) {
    if (curId !== S.mapId) {
      // cache dei mondi: costruiti una sola volta per mappa (niente leak GPU)
      cur = worlds[S.mapId] || (worlds[S.mapId] = buildWorld(S));
      curId = S.mapId;
      camSnap = true;
      if (!playerSprite) {
        var m = new THREE.SpriteMaterial({ map: charTex('cooper', 'down', 0, false, 0), transparent: true, alphaTest: 0.05 });
        playerSprite = new THREE.Sprite(m);
        playerSprite.center.set(0.5, 0.08);
        playerSprite.scale.set(1.0, 1.5, 1);
        playerBlob = new THREE.Mesh(
          new THREE.CircleGeometry(0.3, 12),
          new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false })
        );
        playerBlob.rotation.x = -Math.PI / 2;
      }
      cur.scene.add(playerSprite); // add() li riparenta dalla scena precedente
      cur.scene.add(playerBlob);
      // rebind: l'engine ricrea gli oggetti npc a ogni loadMap (stesso ordine)
      for (var ri = 0; ri < cur.npcs.length && ri < S.npcs.length; ri++) {
        cur.npcs[ri].userData.npc = S.npcs[ri];
      }
    }

    var p = S.player;
    var px = p.x / TILE + 0.5, pz = p.y / TILE + 1.0;
    var pframe = p.moving ? (Math.floor(t / 90) % 4) : 0;
    playerSprite.material.map = charTex('cooper', p.dir, pframe, p.moving, t);
    playerSprite.position.set(px, 0.01, pz);
    playerBlob.position.set(px, 0.012, pz - 0.05);

    // dust: spawn all'inizio di ogni passo
    if (p.moving && !wasMoving) {
      var pmat = new THREE.SpriteMaterial({ map: dustTexture(), transparent: true, opacity: 0.5, depthWrite: false });
      var puff = new THREE.Sprite(pmat);
      puff.center.set(0.5, 0.02);
      puff.scale.set(0.4, 0.4, 1);
      puff.position.set(px - 0.1, 0.05, pz - 0.05);
      cur.scene.add(puff);
      cur.dust.push({ s: puff, age: 0, x: px - 0.1, y: 0.05, z: pz - 0.05 });
    }
    wasMoving = p.moving;

    // aggiorna dust
    for (i = cur.dust.length - 1; i >= 0; i--) {
      var d = cur.dust[i];
      d.age += dt;
      var life = 360;
      if (d.age > life) {
        cur.scene.remove(d.s); d.s.material.dispose(); cur.dust.splice(i, 1); continue;
      }
      var a = d.age / life;
      d.s.position.y = d.y + a * 0.35;
      var sc = 0.35 + a * 0.55;
      d.s.scale.set(sc, sc, 1);
      d.s.material.opacity = 0.45 * (1 - a * a);
    }

    var i, s;
    for (i = 0; i < cur.npcs.length; i++) {
      s = cur.npcs[i];
      var npc = s.userData.npc;
      var nframe = npc.moving ? (Math.floor(t / 90) % 4) : 0;
      s.material.map = charTex(npc.sprite, npc.dir, nframe, npc.moving, t);
      s.visible = GAME.Engine.npcActive(npc);
    }
    for (i = 0; i < cur.sparkles.length; i++) {
      s = cur.sparkles[i];
      s.visible = !S.flags['done_' + s.userData.dialogue];
      s.scale.setScalar(0.4 + 0.12 * Math.sin(t / 180));
    }
    var open = S.clues.length >= 3;
    for (i = 0; i < cur.tape.length; i++) cur.tape[i].sprite.visible = !open;

    for (i = 0; i < cur.smokes.length; i++) {
      var sm = cur.smokes[i];
      var age = (t * 0.00022 + sm.ph) % 1;
      sm.s.position.set(sm.x + age * 0.35 + Math.sin(age * 6 + sm.ph * 20) * 0.14, sm.y + age * 1.25, sm.z);
      var sc = 0.34 + age * 0.8;
      sm.s.scale.set(sc, sc, 1);
      sm.s.material.opacity = 0.55 * (age < 0.15 ? age / 0.15 : 1 - (age - 0.15) / 0.85);
    }

    if (t - lastWater > 200) {
      lastWater = t;
      for (i = 0; i < cur.liquids.length; i++) {
        paintLiquid(cur.liquids[i], t);
        cur.liquids[i].tex.needsUpdate = true;
      }
    }

    if (cur.rain) {
      var r = cur.rain;
      r.mesh.position.set(camera.position.x, 0, camera.position.z);
      var pos = r.mesh.geometry.attributes.position.array;
      for (i = 0; i < r.count; i++) {
        pos[i * 3 + 1] -= r.speed * dt;
        if (pos[i * 3 + 1] < 0) {
          pos[i * 3 + 1] = 12 + Math.random() * 4;
          pos[i * 3] = (Math.random() - 0.5) * 24;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 24;
        }
      }
      r.mesh.geometry.attributes.position.needsUpdate = true;
    }

    var targetBack = S.dialogue ? 7.0 : CAM_BACK;
    var kb = 1 - Math.exp(-dt * 0.006);
    currentCamBack += (targetBack - currentCamBack) * kb;

    var tx = px, ty = CAM_UP, tz = pz + currentCamBack;
    if (camSnap) {
      camera.position.set(tx, ty, tz);
      currentCamBack = targetBack;
      camSnap = false;
    } else {
      var k = 1 - Math.exp(-dt * 0.008);
      camera.position.x += (tx - camera.position.x) * k;
      camera.position.y += (ty - camera.position.y) * k;
      camera.position.z += (tz - camera.position.z) * k;
    }
    camera.lookAt(camera.position.x, 0, camera.position.z - CAM_BACK + 0.2);
    renderer.render(cur.scene, camera);
  };

  GAME.Render3D = R;
})();
