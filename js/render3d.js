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
  if (typeof window === 'undefined' || typeof THREE === 'undefined') return;
  var GAME = window.GAME = window.GAME || {};
  var Sp = GAME.sprites;

  var R = {};
  var renderer = null, camera = null;
  var TILE = 16;
  var WALL_H = 0.95, ROOF_H = 0.85, EAVE = 0.25, IWALL_H = 1.25;
  var CAM_UP = 13.5, CAM_BACK = 9.2, CAM_FOV = 38;
  var BORDER = 8;
  var REF_ASPECT = 1.5; // aspect di riferimento (landscape) per cui CAM_FOV e' tarato

  // su schermi stretti (mobile ritratto) un FOV verticale fisso restringe troppo
  // il FOV orizzontale (world piu' "zoomato"): lo alziamo per tenere costante
  // il campo visivo orizzontale rispetto al riferimento landscape.
  function fovForAspect(aspect) {
    var baseH = 2 * Math.atan(Math.tan(CAM_FOV * Math.PI / 360) * REF_ASPECT);
    var v = 2 * Math.atan(Math.tan(baseH / 2) / aspect) * 180 / Math.PI;
    return Math.max(CAM_FOV, Math.min(v, 80));
  }

  var worlds = {};
  var cur = null, curId = null;
  var playerSprite = null, playerBlob = null;
  var charTexCache = {};
  var texCache = {};
  var camSnap = true;
  var lastWater = -9999;

  /* palette edifici */
  var BPAL = {
    '1': { rf: '#7c94b0', rb: '#43566e', rr: '#a8bccc', wall: '#c8a878', wd: '#a88858', wl: '#dcc094', trim: '#8a6a48', kind: 'sheriff' },
    '2': { rf: '#5a88c4', rb: '#2e5688', rr: '#9cc0e8', wall: '#b08858', wd: '#8a6238', wl: '#c8a070', trim: '#6a4a28', sign: '#a81828', kind: 'diner' },
    '3': { rf: '#a87c5c', rb: '#5e4230', rr: '#d0a888', wall: '#d0b888', wd: '#a88a58', wl: '#e4d0a4', trim: '#8a6a48', kind: 'palmer' },
    '4': { rf: '#52704e', rb: '#284030', rr: '#7c9878', wall: '#9c7a4e', wd: '#6e5230', wl: '#b08e5e', trim: '#4e3a20', kind: 'hotel' },
    '5': { rf: '#93a5b5', rb: '#5a6a78', rr: '#c5d1db', wall: '#e6e6e0', wd: '#b8b8b0', wl: '#f4f4ee', trim: '#8a98a8', kind: 'hospital' },
    '6': { rf: '#4a3a2e', rb: '#241a12', rr: '#6a5646', wall: '#5a4636', wd: '#3a2e26', wl: '#7a6248', trim: '#241a12', sign: '#a81828', kind: 'roadhouse' }
  };

  function makeTex(cv) {
    var t = new THREE.CanvasTexture(cv);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    return t;
  }

  /* ---------------- texture billboard ---------------- */

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

  function charTex(name, dir, frame) {
    var key = name + '_' + dir + '_' + frame;
    if (charTexCache[key]) return charTexCache[key];
    var cv = document.createElement('canvas');
    cv.width = 32; cv.height = 48;
    var c = cv.getContext('2d');
    c.setTransform(2, 0, 0, 2, 0, 0);
    Sp.drawChar(c, name, 0, 4, dir, frame, frame === 1);
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
    grp.add(hipRoof(rc, pal));
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

  var BUILD_CH = { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1 };
  var SKIP_BAKE = { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, D: 1, i: 1, R: 1, T: 1, Y: 1, S: 1, X: 1, M: 1, w: 1, o: 1 };

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

  /* ---------------- muri estrusi / mobili ---------------- */

  function extrudeWalls(map, scene) {
    var y, x, ch, run, runCh;
    var wallSide = new THREE.MeshLambertMaterial({ color: '#4a3636' });
    var wallTop = new THREE.MeshLambertMaterial({ color: '#5a4242' });
    var wallDark = new THREE.MeshLambertMaterial({ color: '#3a2828' });
    var matI = [wallSide, wallSide, wallTop, wallDark, wallDark, wallDark];
    var curtainTexBase = null;
    function curtain(repeatX) {
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
      t.repeat.set(repeatX, 1);
      return t;
    }
    function flush(x0, x1, y2, c2) {
      var w = x1 - x0, mesh;
      if (c2 === 'R') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(w, IWALL_H, 1),
          new THREE.MeshLambertMaterial({ map: curtain(w) }));
      } else {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(w, IWALL_H, 1), matI);
      }
      mesh.position.set(x0 + w / 2, IWALL_H / 2, y2 + 0.5);
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

  var FURN = { C: 0.55, t: 0.45, h: 0.4, K: 0.42, U: 0.6 };
  function furniture(map, scene) {
    var y, x, ch;
    var side = new THREE.MeshLambertMaterial({ color: '#6a4a2e' });
    for (y = 0; y < map.height; y++) {
      for (x = 0; x < map.width; x++) {
        ch = map.rows[y].charAt(x);
        if (!FURN[ch]) continue;
        var cv = document.createElement('canvas');
        cv.width = 32; cv.height = 32;
        var c = cv.getContext('2d');
        c.setTransform(2, 0, 0, 2, 0, 0);
        Sp.drawTile(c, ch, 0, 0, x, y, 0, { map: map });
        var mats = [side, side, new THREE.MeshLambertMaterial({ map: makeTex(cv) }), side, side, side];
        var hgt = FURN[ch];
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(0.96, hgt, 0.96), mats);
        mesh.position.set(x + 0.5, hgt / 2, y + 0.5);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
      }
    }
  }

  /* ---------------- terreno + luci ---------------- */

  function bakeGround(map, world, opts) {
    var w = (map.width + BORDER * 2) * TILE, h = (map.height + BORDER * 2) * TILE;
    var cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var c = cv.getContext('2d');
    var base = world.base;
    var x, y, ch;
    for (y = -BORDER; y < map.height + BORDER; y++) {
      for (x = -BORDER; x < map.width + BORDER; x++) {
        ch = chAt(map, x, y);
        if (SKIP_BAKE[ch]) ch = base;
        Sp.drawTile(c, ch, (x + BORDER) * TILE, (y + BORDER) * TILE,
                    Math.abs(x), Math.abs(y), 0, { map: map, woodsOpen: opts.woodsOpen });
      }
    }
    world.groundCtx = c;
    world.groundTex = makeTex(cv);
    var geo = new THREE.PlaneGeometry(map.width + BORDER * 2, map.height + BORDER * 2);
    var mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: world.groundTex }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(map.width / 2, 0, map.height / 2);
    mesh.receiveShadow = true;
    world.scene.add(mesh);
  }

  function addLights(map, world) {
    var indoor = map.id === 'sheriff' || map.id === 'palmer' || map.id === 'diner';
    var red = map.id === 'redroom';
    var hemi, sun;
    if (red) {
      hemi = new THREE.HemisphereLight(0xff6858, 0x401014, 0.8);
      sun = new THREE.DirectionalLight(0xffd0c0, 0.4);
    } else if (indoor) {
      hemi = new THREE.HemisphereLight(0xfff2dc, 0x6a5a48, 0.72);
      sun = new THREE.DirectionalLight(0xffeecc, 0.42);
    } else {
      hemi = new THREE.HemisphereLight(0xd0e4ff, 0x8a7c60, 0.6);
      sun = new THREE.DirectionalLight(0xfff0d0, 0.68);
    }
    world.scene.add(hemi);
    var cx = map.width / 2, cz = map.height / 2;
    sun.position.set(cx - map.width * 0.6, Math.max(map.width, map.height) * 0.9, cz - map.height * 0.35);
    sun.target.position.set(cx, 0, cz);
    world.scene.add(sun.target);
    sun.castShadow = true;
    var d = Math.max(map.width, map.height) / 2 + 6;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = Math.max(map.width, map.height) * 3;
    sun.shadow.camera.left = -d; sun.shadow.camera.right = d;
    sun.shadow.camera.top = d; sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
    world.scene.add(sun);
  }

  function buildWorld(S) {
    var map = S.map;
    var world = { scene: new THREE.Scene(), liquids: [], sparkles: [], npcs: [], tape: [] };
    var bg = map.id === 'redroom' ? 0x2a0a0e : 0x101820;
    world.scene.background = new THREE.Color(bg);
    // nebbia leggera per profondità negli esterni
    if (map.id === 'town' || map.id === 'woods') {
      world.scene.fog = new THREE.Fog(bg, 38, 80);
    }
    world.base = baseCharOf(map);
    bakeGround(map, world, { woodsOpen: S.clues.length >= 3 });
    addLights(map, world);

    var x, y, ch;
    for (y = 0; y < map.height; y++) {
      for (x = 0; x < map.width; x++) {
        ch = map.rows[y].charAt(x);
        if (ch === 'T' || ch === 'Y') {
          var vr = ((x * 31 + y * 17) % 97) % 2;
          world.scene.add(billboard(treeTexture(ch, vr), 1.6, 2.1, x + 0.5, y + 0.62));
          blobShadow(world.scene, x + 0.5, y + 0.68, 0.5);
        } else if (ch === 'S') {
          world.scene.add(billboard(signTexture(), 1, 1, x + 0.5, y + 0.55));
          blobShadow(world.scene, x + 0.5, y + 0.6, 0.34);
        } else if (ch === 'M') {
          world.scene.add(billboard(statueTexture(), 1, 1, x + 0.5, y + 0.55));
          blobShadow(world.scene, x + 0.5, y + 0.6, 0.3);
        } else if (ch === 'X') {
          var tp = billboard(tapeTexture(), 1, 1, x + 0.5, y + 0.55);
          world.scene.add(tp);
          world.tape.push({ sprite: tp, x: x, y: y });
        }
      }
    }

    // acqua e olio come mesh dedicate
    tileRects(map, 'w').forEach(function (rc) { waterMesh(rc, 'w', world); });
    tileRects(map, 'o').forEach(function (rc) { waterMesh(rc, 'o', world); });

    scanBuildings(map).forEach(function (rc) { world.scene.add(buildingGroup(rc)); });
    extrudeWalls(map, world.scene);
    furniture(map, world.scene);

    (map.objects || []).forEach(function (o) {
      if (o.type === 'sparkle' && typeof o.dialogue === 'string') {
        var sp = billboard(sparkleTexture(), 0.5, 0.5, o.x + 0.5, o.y + 0.6, 0.25);
        sp.userData.dialogue = o.dialogue;
        world.scene.add(sp);
        world.sparkles.push(sp);
      }
    });

    S.npcs.forEach(function (n) {
      var m = new THREE.SpriteMaterial({ map: charTex(n.sprite, n.dir, 0), transparent: true, alphaTest: 0.05 });
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
      renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: false });
    } catch (e) { return false; }
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
        var m = new THREE.SpriteMaterial({ map: charTex('cooper', 'down', 0), transparent: true, alphaTest: 0.05 });
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
    var fr = p.moving ? (Math.floor(t / 120) % 2) : 0;
    playerSprite.material.map = charTex('cooper', p.dir, fr);
    playerSprite.position.set(px, 0.01, pz);
    playerBlob.position.set(px, 0.012, pz - 0.05);

    var i, s;
    for (i = 0; i < cur.npcs.length; i++) {
      s = cur.npcs[i];
      s.material.map = charTex(s.userData.npc.sprite, s.userData.npc.dir, 0);
      s.visible = GAME.Engine.npcActive(s.userData.npc);
    }
    for (i = 0; i < cur.sparkles.length; i++) {
      s = cur.sparkles[i];
      s.visible = !S.flags['done_' + s.userData.dialogue];
      s.scale.setScalar(0.4 + 0.12 * Math.sin(t / 180));
    }
    var open = S.clues.length >= 3;
    for (i = 0; i < cur.tape.length; i++) cur.tape[i].sprite.visible = !open;

    if (t - lastWater > 200) {
      lastWater = t;
      for (i = 0; i < cur.liquids.length; i++) {
        paintLiquid(cur.liquids[i], t);
        cur.liquids[i].tex.needsUpdate = true;
      }
    }

    var tx = px, ty = CAM_UP, tz = pz + CAM_BACK;
    if (camSnap) {
      camera.position.set(tx, ty, tz);
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
