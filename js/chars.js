/* chars.js — sprite personaggi stile chibi moderno, canvas logico 48x60.
 * Otto micro-pose nello stesso ciclo di camminata a 4 tick del motore,
 * idle con respiro/blink e silhouette/accessori autoriali per il cast.
 * (zero asset, pixel art procedurale)
 */
(function () {
  var G = (typeof window !== 'undefined' ? window : globalThis);
  G.GAME = G.GAME || {};
  var GAME = G.GAME;
  var S = GAME.sprites = GAME.sprites || {};

  function R(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function mix(hex, amount) {
    if (!hex || hex.charAt(0) !== '#') return hex;
    var raw = hex.slice(1);
    if (raw.length === 3) raw = raw.replace(/(.)/g, '$1$1');
    var n = parseInt(raw, 16);
    if (!isFinite(n)) return hex;
    var target = amount < 0 ? 0 : 255;
    var p = Math.abs(amount);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(r + (target - r) * p);
    g = Math.round(g + (target - g) * p);
    b = Math.round(b + (target - b) * p);
    return '#' + [r, g, b].map(function (v) {
      return ('0' + v.toString(16)).slice(-2);
    }).join('');
  }

  // Un ciclo completo resta 360 ms come prima (4 frame x 90 ms), ma ogni
  // tick ha una posa intermedia: contatto, discesa, passaggio e salita.
  var WALK_POSES = [
    { l: 0,  r: -1, lx: -1, rx: 1,  la: -2, ra: 2,  hip: 0,  bob: 0, lean: 0 },
    { l: 0,  r: -2, lx: 0,  rx: 1,  la: -1, ra: 2,  hip: 1,  bob: 1, lean: 1 },
    { l: 0,  r: -3, lx: 1,  rx: 0,  la: 1,  ra: 1,  hip: 1,  bob: 0, lean: 1 },
    { l: -1, r: 0,  lx: 1,  rx: -1, la: 2,  ra: -1, hip: 0,  bob: 0, lean: 0 },
    { l: -1, r: 0,  lx: 1,  rx: -1, la: 2,  ra: -2, hip: 0,  bob: 0, lean: 0 },
    { l: -2, r: 0,  lx: 1,  rx: 0,  la: 2,  ra: -1, hip: -1, bob: 1, lean: -1 },
    { l: -3, r: 0,  lx: 0,  rx: 1,  la: 1,  ra: 1,  hip: -1, bob: 0, lean: -1 },
    { l: 0,  r: -1, lx: -1, rx: 1,  la: -1, ra: 2,  hip: 0,  bob: 0, lean: 0 }
  ];

  S.CHARS = {
    cooper:   { skin: '#f0c8a0', hair: '#202126', shirt: '#252833', pants: '#20232c', tie: '#9f2632', eyes: '#546349', hairStyle: 'slick', build: 1.00, height: 1.02, jacket: true, lapel: '#ece8dc', brows: '#29251f', cuff: true },
    truman:   { skin: '#e8b88a', hair: '#49301c', shirt: '#a78450', pants: '#665334', hat: '#594225', badge: '#e8c840', eyes: '#526c73', hairStyle: 'sidepart', build: 1.08, height: 1.03, jacket: true, collar: '#d2bd8c', brows: '#3b281a' },
    lucy:     { skin: '#f0c8a0', hair: '#ddc151', shirt: '#d36f96', pants: '#79506c', long: true, bun: true, eyes: '#5b7183', hairStyle: 'bouffant', build: 0.88, height: 0.98, collar: '#f6dfe7', earring: '#f3cf65', lip: '#a94862' },
    andy:     { skin: '#e8b88a', hair: '#694921', shirt: '#aa8954', pants: '#6a5738', badge: '#e0bd3b', eyes: '#5f7d72', hairStyle: 'sidepart', build: 0.96, height: 1.04, collar: '#d7c294', brows: '#49331f' },
    hawk:     { skin: '#a06838', hair: '#3c2f24', shirt: '#36588f', pants: '#253855', long: true, eyes: '#34291f', hairStyle: 'long', build: 1.00, height: 1.08, jacket: true, collar: '#8ea5bf', brows: '#171717' },
    sarah:    { skin: '#f0c8a0', hair: '#3c261b', shirt: '#70407e', pants: '#70407e', long: true, dress: true, eyes: '#66564b', hairStyle: 'waves', build: 0.94, height: 1.00, shawl: '#4f2e61', lip: '#9c5567' },
    leland:   { skin: '#e8b88a', hair: '#bcbec1', shirt: '#393c46', pants: '#292c34', tie: '#594055', eyes: '#617079', hairStyle: 'sidepart', build: 1.00, height: 1.06, jacket: true, lapel: '#e8e3d8', brows: '#8b8580' },
    norma:    { skin: '#f0c8a0', hair: '#54351f', shirt: '#347768', pants: '#347768', dress: true, eyes: '#586b5a', hairStyle: 'waves', build: 0.98, height: 1.00, apron: '#efe4cd', collar: '#f6ead7', lip: '#a9515f' },
    shelly:   { skin: '#f0c8a0', hair: '#e3c957', shirt: '#d46b8c', pants: '#d46b8c', dress: true, eyes: '#6c7f92', hairStyle: 'waves', build: 0.90, height: 0.98, apron: '#f3e9d7', collar: '#fff5e7', lip: '#ac4e64' },
    loglady:  { skin: '#d8b090', hair: '#75675b', shirt: '#733b2d', pants: '#453020', long: true, log: true, eyes: '#4f5f52', hairStyle: 'long', build: 1.07, height: 0.99, cardigan: '#9a6451', brows: '#5a4d43' },
    bobby:    { skin: '#e8b88a', hair: '#15171a', shirt: '#252a31', pants: '#2e4e84', eyes: '#4b6572', hairStyle: 'pompadour', build: 1.06, height: 1.05, jacket: true, collar: '#bbc4ca', brows: '#16191c' },
    donna:    { skin: '#f0c8a0', hair: '#63451f', shirt: '#82323f', pants: '#414652', long: true, eyes: '#556b66', hairStyle: 'waves', build: 0.91, height: 1.02, necklace: '#d9bd69', lip: '#9e4d5e' },
    jacoby:   { skin: '#d8a880', hair: '#a8a398', shirt: '#deddd7', pants: '#7c7d80', glasses: true, glassesColor: '#b33a3b', eyes: '#596d62', hairStyle: 'receding', build: 1.00, height: 0.99, shirtPrint: '#3e7a69', brows: '#857d72' },
    audrey:   { skin: '#f0c8a0', hair: '#15171a', shirt: '#b92032', pants: '#382c28', eyes: '#4f7165', hairStyle: 'bob', build: 0.88, height: 0.96, collar: '#f3e6d3', earring: '#d8bb5e', lip: '#a52d47' },
    mfap:     { skin: '#e8c8a8', hair: '#17191c', shirt: '#b80f20', pants: '#b80f20', short: true, eyes: '#53616b', hairStyle: 'slick', build: 0.98, height: 0.94, bowtie: '#14151a', lapel: '#eee8da', brows: '#242226' },
    laura:    { skin: '#e8d8c8', hair: '#e3d171', shirt: '#8b8e9b', pants: '#5d606b', long: true, shadow: true, eyes: '#62788a', hairStyle: 'waves', build: 0.90, height: 1.02, necklace: '#d7c783' },
    gerard:   { skin: '#c89868', hair: '#66594b', shirt: '#554d42', pants: '#443c32', onearm: 'left', eyes: '#55645e', hairStyle: 'receding', build: 0.92, height: 1.04, waistcoat: '#39362f', stubble: '#6f5d4d', brows: '#5d5044' },
    benhorne: { skin: '#e8b88a', hair: '#101217', shirt: '#252734', pants: '#1d2028', tie: '#751b24', eyes: '#4e626b', hairStyle: 'slick', build: 1.08, height: 1.03, jacket: true, lapel: '#d9d5ce', brows: '#15161a' },
    giant:    { skin: '#f8f0e8', hair: '#dadbda', shirt: '#41444c', pants: '#17191e', tie: '#090a0c', eyes: '#46545d', hairStyle: 'receding', build: 0.92, height: 1.18, jacket: true, lapel: '#f3f0e9', brows: '#c5c5c3' },
    maddy:    { skin: '#e8d8c8', hair: '#351b16', shirt: '#994c66', pants: '#49444f', long: true, glasses: true, glassesColor: '#302020', eyes: '#4e675a', hairStyle: 'waves', build: 0.90, height: 1.00, necklace: '#d5b960', lip: '#9d4b61' },
    bob:      { skin: '#c89868', hair: '#74746b', shirt: '#345682', pants: '#263854', long: true, grin: true, eyes: '#424d48', hairStyle: 'wild', build: 1.10, height: 1.10, jacket: true, stubble: '#715e4d', brows: '#4c4a43' },
    james:    { skin: '#e8b88a', hair: '#0c0e12', shirt: '#20242a', pants: '#2c4d84', eyes: '#49616e', hairStyle: 'pompadour', build: 1.02, height: 1.05, jacket: true, collar: '#aeb6bb', brows: '#14161a' },
    jacques:  { skin: '#e8a878', hair: '#543c21', shirt: '#973729', pants: '#463023', eyes: '#5d5f4d', hairStyle: 'sidepart', build: 1.15, height: 1.01, waistcoat: '#4d3028', stubble: '#76543e', brows: '#4e3422' },
    ronette:  { skin: '#f4e0d0', hair: '#dfc756', shirt: '#d2d4d7', pants: '#d2d4d7', long: true, dress: true, eyes: '#667a8f', hairStyle: 'waves', build: 0.88, height: 0.99, collar: '#f5f3ed', necklace: '#b8ab88' }
  };

  // Grammatica di silhouette riusabile. Le palette descrivono identità;
  // questi archetipi descrivono forma, appoggio e cadenza. Ogni membro del
  // cast sceglie intenzionalmente una combinazione, senza if sul nome nel draw.
  var ARCHETYPES = {
    tailored: { head: 'oval', shoulder: 1.04, stance: 0, garment: 'suit', lift: 0.78, arm: 0.74, idle: 'alert' },
    lawman:   { head: 'square', shoulder: 1.14, stance: 2, garment: 'uniform', lift: 0.72, arm: 0.66, idle: 'grounded' },
    poised:   { head: 'heart', shoulder: 0.91, stance: -1, garment: 'fitted', lift: 0.68, arm: 0.58, idle: 'poised' },
    rangy:    { head: 'long', shoulder: 1.02, stance: 1, garment: 'field', lift: 1.0, arm: 1.15, idle: 'watchful' },
    weary:    { head: 'long', shoulder: 0.94, stance: 0, garment: 'soft', lift: 0.62, arm: 0.55, idle: 'weary' },
    diner:    { head: 'round', shoulder: 1.0, stance: 0, garment: 'apron', lift: 0.8, arm: 0.78, idle: 'warm' },
    mystic:   { head: 'round', shoulder: 1.08, stance: 2, garment: 'layered', lift: 0.57, arm: 0.44, idle: 'still' },
    rebel:    { head: 'square', shoulder: 1.08, stance: 2, garment: 'jacket', lift: 1.0, arm: 1.12, idle: 'restless' },
    ingénue:  { head: 'heart', shoulder: 0.9, stance: -1, garment: 'fitted', lift: 0.86, arm: 0.82, idle: 'curious' },
    uncanny:  { head: 'wide', shoulder: 0.96, stance: 1, garment: 'otherworld', lift: 0.5, arm: 0.38, idle: 'still' },
    drifter:  { head: 'long', shoulder: 0.93, stance: 0, garment: 'vest', lift: 0.66, arm: 0.52, idle: 'guarded' },
    spectral: { head: 'heart', shoulder: 0.88, stance: -1, garment: 'spectral', lift: 0.38, arm: 0.3, idle: 'float' },
    menace:   { head: 'wide', shoulder: 1.18, stance: 3, garment: 'jacket', lift: 0.88, arm: 1.04, idle: 'loom' },
    heavy:    { head: 'wide', shoulder: 1.2, stance: 3, garment: 'vest', lift: 0.52, arm: 0.72, idle: 'grounded' }
  };
  var CHARACTER_STYLE = {
    cooper:   ['tailored', 0], truman: ['lawman', 80],  lucy: ['poised', 210],
    andy:     ['lawman', 310], hawk: ['rangy', 120],    sarah: ['weary', 440],
    leland:   ['tailored', 260], norma: ['diner', 90],  shelly: ['diner', 350],
    loglady:  ['mystic', 510], bobby: ['rebel', 180],   donna: ['ingénue', 390],
    jacoby:   ['mystic', 40], audrey: ['poised', 280],  mfap: ['uncanny', 470],
    laura:    ['spectral', 160], gerard: ['drifter', 330], benhorne: ['tailored', 520],
    giant:    ['uncanny', 60], maddy: ['ingénue', 240], bob: ['menace', 410],
    james:    ['rebel', 20], jacques: ['heavy', 300],   ronette: ['spectral', 490]
  };
  Object.keys(CHARACTER_STYLE).forEach(function (name) {
    var entry = CHARACTER_STYLE[name];
    S.CHARS[name].motion = {
      archetype: entry[0],
      phase: entry[1]
    };
  });

  S.drawChar = function (ctx, name, x, y, dir, frame, moving, t) {
    var c = S.CHARS[name] || S.CHARS.cooper;
    var motion = c.motion || { archetype: 'tailored', phase: 0 };
    var arch = ARCHETYPES[motion.archetype] || ARCHETYPES.tailored;
    var sh = !!c.shadow;
    function C(col) { return sh ? '#26262f' : col; }
    var skin = C(c.skin), hair = C(c.hair), shirt = C(c.shirt), pants = C(c.pants);
    var skinShade = C(mix(c.skin, -0.16));
    var skinLight = C(mix(c.skin, 0.16));
    var hairShade = C(mix(c.hair, -0.2));
    var hairLight = C(mix(c.hair, 0.14));
    var shirtShade = C(mix(c.shirt, -0.18));
    var shirtLight = C(mix(c.shirt, 0.13));
    var OL = C('#202028');
    var eye = C('#12121a');
    var shoe = C('#1a1a22');
    var white = C('#f4f4f4');
    var isShort = !!c.short;
    t = t || 0;

    var poseIndex = moving
      ? (t ? Math.floor(t / 45) % WALK_POSES.length : ((frame || 0) * 2) % WALK_POSES.length)
      : 0;
    var pose = WALK_POSES[poseIndex];
    var idleWave = Math.sin((t + motion.phase) / 700);
    var breathPx = moving ? 0 :
      (arch.idle === 'still' ? 0 : Math.round(idleWave));
    var blink = !moving && ((t % 4200) > 3900);
    var gaitBob = arch.idle === 'float' ? 0 : arch.lift;
    var bob = moving ? Math.round(pose.bob * gaitBob) : breathPx;
    var side = dir === 'left' ? -1 : (dir === 'right' ? 1 : 0);
    var idleLean = !moving && (arch.idle === 'weary' || arch.idle === 'guarded') ? 1 :
      (!moving && arch.idle === 'loom' ? -1 : 0);
    var bodyW = Math.max(17, Math.min(27,
      Math.round(20 * (c.build || 1) * arch.shoulder)));
    var bodyX = x + 24 - Math.round(bodyW / 2) + (side ? side : 0);
    var heightLift = Math.max(-2, Math.min(3, Math.round(((c.height || 1) - 1) * 16)));

    var footY = y + 52;

    // Ombra di contatto a tre densità: piedi ancorati, bordo non rettangolare.
    R(ctx, x + 9, footY + 2, 30, 2, 'rgba(0,0,0,0.08)');
    R(ctx, x + 12, footY + 1, 24, 3, 'rgba(0,0,0,0.13)');
    R(ctx, x + 16, footY, 16, 3, 'rgba(0,0,0,0.19)');

    // capelli lunghi dietro
    if (c.long && !isShort) {
      var hairSwing = moving ? pose.hip : Math.round(Math.sin(t / 950));
      var backX = x + 11 + side + hairSwing;
      var backW = side ? 23 : 26;
      R(ctx, backX, y + 5 - heightLift + bob, backW, 31, OL);
      R(ctx, backX + 1, y + 6 - heightLift + bob, backW - 2, 28, hairShade);
      R(ctx, backX + 3, y + 7 - heightLift + bob, backW - 6, 27, hair);
      R(ctx, backX + 4, y + 8 - heightLift + bob, 3, 22, hairLight);
      // Le punte sfalsate evitano la "tenda" rettangolare.
      R(ctx, backX + 2, y + 31 + bob, 5, 5 + hairSwing, hair);
      R(ctx, backX + backW - 7, y + 30 + bob, 5, 6 - hairSwing, hairShade);
    }

    /* ---- gambe ---- */
    var legTop = y + 32 + bob;
    var pantsCol = c.dress ? shirt : pants;
    var shoeCol = shoe;
    var leftLift = moving ? Math.round(pose.l * arch.lift) : 0;
    var rightLift = moving ? Math.round(pose.r * arch.lift) : 0;
    var strideL = moving ? Math.round(pose.lx * arch.lift) : 0;
    var strideR = moving ? Math.round(pose.rx * arch.lift) : 0;
    var stance = arch.stance || 0;
    var leftX = side ? x + 21 - side + strideL * side : x + 17 - stance + strideL;
    var rightX = side ? x + 25 + side + strideR * side : x + 26 + stance + strideR;

    if (c.dress) {
      var hemSwing = moving ? pose.hip : 0;
      R(ctx, bodyX - 2 + hemSwing, legTop - 1, bodyW + 4, 4, OL);
      R(ctx, bodyX - 4 + hemSwing, legTop + 3, bodyW + 8, 6, OL);
      R(ctx, bodyX - 1 + hemSwing, legTop, bodyW + 2, 3, shirt);
      R(ctx, bodyX - 3 + hemSwing, legTop + 3, bodyW + 6, 5, shirt);
      R(ctx, bodyX - 2 + hemSwing, legTop + 3, bodyW + 3, 1, shirtLight);
      R(ctx, leftX + 1, legTop + 8, 3, 9 + leftLift, skin);
      R(ctx, rightX + 1, legTop + 8, 3, 9 + rightLift, skinShade);
      R(ctx, leftX, footY - 3 + leftLift, 5, 3, shoeCol);
      R(ctx, rightX, footY - 3 + rightLift, 5, 3, shoeCol);
    } else if (isShort) {
      // MFAP: gambe corte
      R(ctx, leftX, legTop + 5, 5, 6 + leftLift, OL);
      R(ctx, leftX + 1, legTop + 6, 3, 4 + leftLift, pants);
      R(ctx, rightX, legTop + 5, 5, 6 + rightLift, OL);
      R(ctx, rightX + 1, legTop + 6, 3, 4 + rightLift, pants);
      R(ctx, leftX, footY - 3 + leftLift, 5, 3, shoeCol);
      R(ctx, rightX, footY - 3 + rightLift, 5, 3, shoeCol);
    } else {
      var leftShoeY = footY - 3 + leftLift;
      var rightShoeY = footY - 3 + rightLift;
      R(ctx, leftX, legTop, 5, leftShoeY - legTop, OL);
      R(ctx, leftX + 1, legTop + 1, 3, leftShoeY - legTop - 1, pantsCol);
      R(ctx, rightX, legTop, 5, rightShoeY - legTop, OL);
      R(ctx, rightX + 1, legTop + 1, 3, rightShoeY - legTop - 1, C(mix(c.dress ? c.shirt : c.pants, -0.08)));
      R(ctx, leftX, leftShoeY, side < 0 ? 7 : 5, 3, shoeCol);
      R(ctx, rightX - (side > 0 ? 2 : 0), rightShoeY, side > 0 ? 7 : 5, 3, shoeCol);
      R(ctx, leftX + 1, leftShoeY, 3, 1, C('#343842'));
      R(ctx, rightX + 1, rightShoeY, 3, 1, C('#343842'));
    }
    // Il piede in appoggio ha sempre una suola e un'ombra immediatamente
    // sotto: nessun frame sembra galleggiare anche con stance larghe.
    if (leftLift === 0) {
      R(ctx, leftX, footY, side < 0 ? 7 : 5, 1, C('#080a0d'));
      R(ctx, leftX + 1, footY + 1, 5, 1, 'rgba(0,0,0,0.22)');
    }
    if (rightLift === 0) {
      R(ctx, rightX - (side > 0 ? 2 : 0), footY, side > 0 ? 7 : 5, 1, C('#080a0d'));
      R(ctx, rightX, footY + 1, 5, 1, 'rgba(0,0,0,0.22)');
    }

    /* ---- busto ---- */
    var bodyTop = y + 18 - heightLift + bob + idleLean;
    var profileW = side ? Math.max(16, bodyW - 4) : bodyW;
    var bx0 = x + 24 - Math.round(profileW / 2) + side;
    // Spalle e vita non sono più una scatola: 3 gradini formano il busto.
    R(ctx, bx0 - 2, bodyTop + 1, profileW + 4, 5, OL);
    R(ctx, bx0 - 1, bodyTop + 5, profileW + 2, 8, OL);
    R(ctx, bx0 + 1, bodyTop + 13, profileW - 2, 4, OL);
    R(ctx, bx0 - 1, bodyTop + 2, profileW + 2, 4, shirt);
    R(ctx, bx0, bodyTop + 6, profileW, 7, shirt);
    R(ctx, bx0 + 2, bodyTop + 13, profileW - 4, 2, shirtShade);
    R(ctx, bx0, bodyTop + 3, 2, 10, shirtLight);

    if (arch.garment === 'suit') {
      R(ctx, bx0, bodyTop + 11, 4, 8, OL);
      R(ctx, bx0 + 1, bodyTop + 11, 3, 7, shirtShade);
      R(ctx, bx0 + profileW - 4, bodyTop + 11, 4, 8, OL);
      R(ctx, bx0 + profileW - 3, bodyTop + 11, 2, 7, shirt);
    } else if (arch.garment === 'uniform') {
      R(ctx, bx0 - 2, bodyTop + 2, 7, 2, shirtLight);
      R(ctx, bx0 + profileW - 5, bodyTop + 2, 7, 2, shirtShade);
      R(ctx, bx0, bodyTop + 12, profileW, 3, C(mix(c.pants, -0.18)));
      R(ctx, x + 23 + side, bodyTop + 12, 3, 2, C('#b69a58'));
    } else if (arch.garment === 'field') {
      R(ctx, bx0, bodyTop + 4, profileW, 2, shirtLight);
      R(ctx, bx0 + 3, bodyTop + 12, profileW - 6, 3, shirtShade);
    } else if (arch.garment === 'soft') {
      R(ctx, bx0 + 2, bodyTop + 12, profileW - 2, 4, shirtShade);
      R(ctx, bx0 + profileW - 4, bodyTop + 9, 3, 7, C(c.shawl || c.shirt));
    } else if (arch.garment === 'layered') {
      R(ctx, bx0 - 1, bodyTop + 8, 4, 10, C(c.cardigan || mix(c.shirt, 0.14)));
      R(ctx, bx0 + profileW - 3, bodyTop + 8, 4, 10, shirtShade);
    } else if (arch.garment === 'jacket') {
      R(ctx, bx0, bodyTop + 4, profileW, 2, shirtLight);
      R(ctx, bx0, bodyTop + 12, profileW, 3, shirtShade);
      R(ctx, bx0 + 2, bodyTop + 13, 3, 2, C(mix(c.pants, 0.08)));
      R(ctx, bx0 + profileW - 5, bodyTop + 13, 3, 2, C(mix(c.pants, 0.08)));
    } else if (arch.garment === 'fitted') {
      R(ctx, bx0 + 2, bodyTop + 11, profileW - 4, 4, shirtShade);
      R(ctx, bx0 + 4, bodyTop + 14, profileW - 8, 2, C(mix(c.pants, -0.08)));
    } else if (arch.garment === 'otherworld') {
      R(ctx, x + 20 + side, bodyTop, 9, 4, white);
      R(ctx, bx0 + 2, bodyTop + 12, profileW - 4, 4, shirtShade);
    } else if (arch.garment === 'vest') {
      R(ctx, bx0 + 2, bodyTop + 5, 4, 9, C(c.waistcoat || shirtShade));
      R(ctx, bx0 + profileW - 6, bodyTop + 5, 4, 9, C(c.waistcoat || shirtShade));
    } else if (arch.garment === 'spectral') {
      var drift = moving ? pose.hip : Math.round(idleWave);
      R(ctx, bx0 - 2 + drift, bodyTop + 13, profileW + 4, 6, OL);
      R(ctx, bx0 - 1 + drift, bodyTop + 13, profileW + 2, 5, shirtShade);
    }

    if (dir !== 'up' && (c.jacket || c.lapel)) {
      var lapel = C(c.lapel || c.collar || mix(c.shirt, 0.35));
      var faceCenter = x + 24 + side;
      R(ctx, faceCenter - 5, bodyTop + 2, 4, 2, lapel);
      R(ctx, faceCenter + 1, bodyTop + 2, 4, 2, lapel);
      R(ctx, faceCenter - 3, bodyTop + 4, 2, 6, lapel);
      R(ctx, faceCenter + 1, bodyTop + 4, 2, 6, lapel);
      R(ctx, bx0 + 2, bodyTop + 10, profileW - 4, 1, shirtShade);
    } else if (dir !== 'up' && c.collar) {
      var collar = C(c.collar);
      R(ctx, x + 19 + side, bodyTop + 2, 5, 3, collar);
      R(ctx, x + 25 + side, bodyTop + 2, 5, 3, collar);
      R(ctx, x + 23 + side, bodyTop + 3, 3, 2, shirtShade);
    }
    if (dir !== 'up' && c.apron) {
      var apron = C(c.apron);
      R(ctx, x + 19 + side, bodyTop + 7, 10, 9, apron);
      R(ctx, x + 18 + side, bodyTop + 8, 1, 7, C(mix(c.apron, -0.16)));
      R(ctx, x + 21 + side, bodyTop + 12, 6, 1, C(mix(c.apron, 0.13)));
    }
    if (c.shawl) {
      var shawl = C(c.shawl);
      R(ctx, bx0, bodyTop + 2, profileW, 3, shawl);
      R(ctx, bx0 + 2, bodyTop + 5, profileW - 4, 2, shawl);
    }
    if (c.cardigan && dir !== 'up') {
      R(ctx, bx0 + 2, bodyTop + 5, 2, 9, C(c.cardigan));
      R(ctx, bx0 + profileW - 4, bodyTop + 5, 2, 9, C(c.cardigan));
    }
    if (c.waistcoat && dir !== 'up') {
      R(ctx, x + 18 + side, bodyTop + 6, 12, 8, C(c.waistcoat));
      R(ctx, x + 23 + side, bodyTop + 7, 2, 7, shirtShade);
    }
    if (c.shirtPrint && dir === 'down') {
      var print = C(c.shirtPrint);
      R(ctx, x + 19, bodyTop + 7, 2, 2, print);
      R(ctx, x + 28, bodyTop + 10, 2, 2, print);
      R(ctx, x + 21, bodyTop + 13, 2, 1, print);
    }
    if (c.tie && dir !== 'up') { // cravatta e colletto solo di fronte/profilo, mai sulla schiena
      var tieLean = moving ? pose.lean : 0;
      R(ctx, x + 23 + side, bodyTop + 4, 3, 3, C(c.tie));
      R(ctx, x + 23 + side + tieLean, bodyTop + 7, 3, 7, C(c.tie));
      R(ctx, x + 21 + side, bodyTop + 2, 7, 2, white);
    }
    if (c.bowtie && dir !== 'up') {
      R(ctx, x + 20 + side, bodyTop + 3, 4, 3, C(c.bowtie));
      R(ctx, x + 25 + side, bodyTop + 3, 4, 3, C(c.bowtie));
      R(ctx, x + 24 + side, bodyTop + 4, 2, 2, shirtLight);
    }
    if (c.necklace && dir === 'down') {
      R(ctx, x + 21, bodyTop + 3, 1, 2, C(c.necklace));
      R(ctx, x + 27, bodyTop + 3, 1, 2, C(c.necklace));
      R(ctx, x + 23, bodyTop + 5, 4, 1, C(c.necklace));
    }
    if (c.badge && dir !== 'up') { // stellina da sceriffo sul petto
      var badgeX = x + (dir === 'right' ? 26 : (dir === 'left' ? 18 : 17));
      var by2 = bodyTop + 6;
      R(ctx, badgeX + 1, by2, 2, 1, C(c.badge));
      R(ctx, badgeX, by2 + 1, 4, 2, C(c.badge));
      R(ctx, badgeX + 1, by2 + 3, 2, 1, C(c.badge));
      R(ctx, badgeX + 1, by2 + 1, 2, 1, C('#f8ecb0'));
    }

    /* ---- braccia ---- */
    var armY = bodyTop + 4;
    var noArm = c.onearm === 'left';
    if (dir === 'left' || dir === 'right') {
      var farAx = x + 21 - side * 2;
      var nearAx = x + 24 + side * 6;
      if (!noArm) {
        var farSwing = moving ? Math.round(pose.la * arch.arm) : (arch.idle === 'guarded' ? 1 : 0);
        R(ctx, farAx, armY + 2 - farSwing, 4, 10, OL);
        R(ctx, farAx + 1, armY + 3 - farSwing, 2, 7, shirtShade);
      }
      if (!(noArm && dir === 'left')) {
        var sideSwing = moving ? Math.round(pose.ra * arch.arm) :
          (arch.idle === 'restless' ? Math.round(idleWave) : 0);
        R(ctx, nearAx, armY + sideSwing, 5, 11, OL);
        R(ctx, nearAx + 1, armY + 1 + sideSwing, 3, 7, shirt);
        if (c.cuff) R(ctx, nearAx + 1, armY + 7 + sideSwing, 3, 2, white);
        R(ctx, nearAx + 1, armY + 9 + sideSwing, 3, 3, skin);
        R(ctx, nearAx + (side > 0 ? 3 : 0), armY + 9 + sideSwing, 1, 3, skinLight);
      }
    } else {
      var swingL = moving ? Math.round(pose.la * arch.arm) :
        (arch.idle === 'watchful' ? -1 : (arch.idle === 'weary' ? 1 : 0));
      var swingR = moving ? Math.round(pose.ra * arch.arm) :
        (arch.idle === 'restless' ? Math.round(idleWave) : 0);
      var armLX = bx0 - 5, armRX = bx0 + profileW + 1;
      if (!noArm) {
        R(ctx, armLX, armY + swingL, 5, 12, OL);
        R(ctx, armLX + 1, armY + 1 + swingL, 3, 8, shirtShade);
        if (c.cuff) R(ctx, armLX + 1, armY + 8 + swingL, 3, 2, white);
        R(ctx, armLX + 1, armY + 10 + swingL, 3, 3, skinShade);
      }
      R(ctx, armRX, armY + swingR, 5, 12, OL);
      R(ctx, armRX + 1, armY + 1 + swingR, 3, 8, shirt);
      if (c.cuff) R(ctx, armRX + 1, armY + 8 + swingR, 3, 2, white);
      R(ctx, armRX + 1, armY + 10 + swingR, 3, 3, skin);
      R(ctx, armRX + 1, armY + 10 + swingR, 1, 3, skinLight);
    }

    // tronco della Log Lady
    if (c.log) {
      var logTilt = moving ? pose.hip : 0;
      R(ctx, x + 7, armY + 2 + logTilt, 34, 10, OL);
      R(ctx, x + 8, armY + 3 + logTilt, 32, 7, C('#654222'));
      R(ctx, x + 9, armY + 3 + logTilt, 30, 2, C('#946239'));
      R(ctx, x + 9, armY + 8 + logTilt, 30, 2, C('#472d19'));
      R(ctx, x + 8, armY + 4 + logTilt, 4, 5, C('#a9794e'));
      R(ctx, x + 9, armY + 5 + logTilt, 2, 3, C('#51331d'));
      R(ctx, x + 14, armY + 3 + logTilt, 3, 4, skin);
      R(ctx, x + 32, armY + 3 + logTilt, 3, 4, skin);
    }

    /* ---- testa ---- */
    var headTop = y + 2 - heightLift + bob + idleLean;
    var headW = arch.head === 'wide' ? 24 :
      (arch.head === 'long' ? 20 : (arch.head === 'heart' ? 21 : 22));
    if (side) headW = Math.max(19, headW - 1);
    var headH = arch.head === 'long' ? 20 : (arch.head === 'round' ? 19 : 18);
    var headDrift = !moving &&
      (arch.idle === 'alert' || arch.idle === 'watchful' || arch.idle === 'curious')
      ? Math.round(Math.sin((t + motion.phase) / 1300)) : 0;
    var hx = x + 24 - Math.round(headW / 2) + side + headDrift;
    var crownInset = arch.head === 'square' || arch.head === 'wide' ? 1 :
      (arch.head === 'round' ? 3 : 2);
    var jawInset = arch.head === 'heart' ? 4 :
      (arch.head === 'square' || arch.head === 'wide' ? 1 : 3);
    // Testa, tempie e mandibola hanno proporzioni proprie dell'archetipo.
    R(ctx, hx + crownInset, headTop - 1, headW - crownInset * 2, 2, OL);
    R(ctx, hx, headTop + 1, headW, headH - 5, OL);
    R(ctx, hx + jawInset, headTop + headH - 4, headW - jawInset * 2, 4, OL);
    R(ctx, hx + 1, headTop + 1, headW - 2, headH - 5, skin);
    R(ctx, hx + crownInset, headTop, headW - crownInset * 2, 2, skin);
    R(ctx, hx + jawInset + 1, headTop + headH - 4, headW - (jawInset + 1) * 2, 3, skinShade);
    R(ctx, hx + 2, headTop + 3, 2, headH - 8, skinLight);
    if (arch.head === 'round') {
      R(ctx, hx + 1, headTop + 3, 1, headH - 8, skinLight);
      R(ctx, hx + headW - 2, headTop + 4, 1, headH - 9, skinShade);
    } else if (arch.head === 'square') {
      R(ctx, hx + 1, headTop + headH - 6, 2, 3, skinShade);
      R(ctx, hx + headW - 3, headTop + headH - 6, 2, 3, skinShade);
    }
    if (!sh) {
      var earX = side < 0 ? hx + headW - 1 : hx - 2;
      R(ctx, earX, headTop + 7, 3, 5, OL);
      R(ctx, earX + 1, headTop + 8, 2, 3, skinShade);
    }

    // capelli / cappello
    var style = c.hairStyle || (c.long ? 'long' : 'sidepart');
    if (dir === 'up') {
      R(ctx, hx + 1, headTop, headW - 2, headH - 3, hairShade);
      R(ctx, hx + 3, headTop, headW - 6, headH - 4, hair);
      R(ctx, hx + 4, headTop + 1, 3, 12, hairLight);
      R(ctx, hx + 2, headTop + headH - 4, headW - 4, 2, hairShade);
      if (style === 'receding') {
        R(ctx, hx + 5, headTop + 4, headW - 10, 9, skin);
      } else if (style === 'wild') {
        R(ctx, hx - 2, headTop + 3, 4, 8, hair);
        R(ctx, hx + headW - 2, headTop + 1, 4, 10, hairShade);
      }
    } else if (c.hat) {
      var ht = C(c.hat);
      R(ctx, hx + 3, headTop - 5, headW - 6, 6, OL);
      R(ctx, hx + 4, headTop - 4, headW - 8, 5, ht);
      R(ctx, hx + 5, headTop - 4, 2, 4, C(mix(c.hat, 0.18)));
      R(ctx, hx - 3, headTop, headW + 6, 3, OL);
      R(ctx, hx - 2, headTop, headW + 4, 2, ht);
      R(ctx, hx + 2, headTop + 2, 4, 5, hair);
      R(ctx, hx + headW - 5, headTop + 2, 4, 5, hairShade);
    } else {
      var crownY = style === 'pompadour' || style === 'bouffant' ? headTop - 5 : headTop - 3;
      var crownH = style === 'pompadour' || style === 'bouffant' ? 7 : 5;
      R(ctx, hx + 2, crownY, headW - 4, crownH, OL);
      R(ctx, hx + 3, crownY + 1, headW - 6, crownH - 1, hair);
      R(ctx, hx + 4, crownY + 1, 5, 1, hairLight);

      if (style === 'receding') {
        R(ctx, hx + 2, headTop, 5, 7, hair);
        R(ctx, hx + headW - 7, headTop, 5, 7, hairShade);
        R(ctx, hx + 7, headTop - 1, headW - 14, 2, hairLight);
      } else if (style === 'slick') {
        R(ctx, hx + 2, headTop + 1, 3, 7, hairShade);
        R(ctx, hx + headW - 5, headTop + 1, 3, 6, hair);
        R(ctx, hx + 5, headTop, headW - 8, 2, hair);
        R(ctx, hx + 6, headTop - 2, 7, 2, hairLight);
      } else if (style === 'sidepart') {
        var partSide = side > 0 ? -1 : 1;
        R(ctx, hx + 1, headTop + 1, 4, 8, hair);
        R(ctx, hx + headW - 5, headTop + 1, 4, 6, hairShade);
        R(ctx, hx + 4, headTop, 9, 3, hair);
        R(ctx, hx + (partSide > 0 ? 13 : 6), headTop - 2, 6, 2, hairLight);
      } else if (style === 'pompadour') {
        R(ctx, hx + 1, headTop - 2, 7, 5, hairShade);
        R(ctx, hx + 5, headTop - 5, 13, 6, hair);
        R(ctx, hx + 7, headTop - 4, 7, 2, hairLight);
        R(ctx, hx + 2, headTop + 1, 3, 8, hair);
        R(ctx, hx + headW - 5, headTop + 1, 3, 7, hairShade);
      } else if (style === 'bob') {
        R(ctx, hx - 1, headTop + 1, 5, 14, hair);
        R(ctx, hx + headW - 4, headTop + 1, 5, 14, hairShade);
        R(ctx, hx + 1, headTop + 12, 5, 4, hair);
        R(ctx, hx + headW - 6, headTop + 12, 5, 4, hairShade);
      } else if (style === 'waves' || style === 'long') {
        R(ctx, hx - 1, headTop + 1, 5, 11, hair);
        R(ctx, hx + headW - 4, headTop + 1, 5, 11, hairShade);
        R(ctx, hx, headTop + 7, 3, 6, hairLight);
        R(ctx, hx + headW - 3, headTop + 8, 3, 5, hair);
      } else if (style === 'wild') {
        R(ctx, hx - 3, headTop - 1, 6, 12, hair);
        R(ctx, hx + headW - 3, headTop - 3, 6, 14, hairShade);
        R(ctx, hx + 1, headTop - 5, 5, 6, hair);
        R(ctx, hx + 15, headTop - 7, 5, 8, hair);
        R(ctx, hx + 7, headTop - 4, 4, 3, hairLight);
      } else if (style === 'bouffant') {
        R(ctx, hx, headTop - 4, headW, 7, hair);
        R(ctx, hx + 3, headTop - 6, headW - 6, 4, hair);
        R(ctx, hx + 1, headTop + 1, 4, 8, hairLight);
        R(ctx, hx + headW - 5, headTop + 1, 4, 9, hairShade);
      }
    }

    // crocchia (Lucy)
    if (c.bun) {
      var bunX = hx + (side > 0 ? 2 : (side < 0 ? 10 : 6));
      R(ctx, bunX, headTop - 9, 10, 6, OL);
      R(ctx, bunX + 1, headTop - 8, 8, 4, hair);
      R(ctx, bunX + 2, headTop - 8, 3, 1, hairLight);
    }

    // viso
    if (dir !== 'up') {
      var eyeY = headTop + 7;
      var iris = C(c.eyes || '#58675d');
      var drawEyes = function (ex, ey, blinkState, look) {
        if (blinkState) {
          R(ctx, ex, ey + 2, 4, 1, eye);
        } else {
          R(ctx, ex, ey, 4, 4, OL);
          R(ctx, ex + 1, ey, 3, 3, white);
          R(ctx, ex + (look > 0 ? 2 : 1), ey + 1, 2, 2, iris);
          R(ctx, ex + (look > 0 ? 3 : 1), ey + 1, 1, 1, eye);
          R(ctx, ex + (look > 0 ? 2 : 1), ey, 1, 1, white);
        }
      };
      if (dir === 'left') {
        drawEyes(hx + 2, eyeY, blink, -1);
        R(ctx, hx - 1, headTop + 10, 3, 2, skinShade);
      } else if (dir === 'right') {
        drawEyes(hx + headW - 6, eyeY, blink, 1);
        R(ctx, hx + headW - 1, headTop + 10, 3, 2, skinShade);
      } else {
        drawEyes(hx + 3, eyeY, blink, -1);
        drawEyes(hx + headW - 7, eyeY, blink, 1);
        R(ctx, hx + 10, headTop + 10, 2, 3, skinShade);
        R(ctx, hx + 11, headTop + 10, 1, 1, skinLight);
      }
      if (c.brows && !blink) {
        var brow = C(c.brows);
        if (dir === 'down') {
          R(ctx, hx + 3, eyeY - 2, 5, 1, brow);
          R(ctx, hx + headW - 8, eyeY - 2, 5, 1, brow);
        } else {
          R(ctx, dir === 'left' ? hx + 2 : hx + headW - 7, eyeY - 2, 5, 1, brow);
        }
      }

      if (c.glasses) {
        var gc = c.glassesColor ? C(c.glassesColor) : C('#c03030');
        if (dir === 'down') {
          R(ctx, hx + 2, eyeY - 1, 7, 5, gc);
          R(ctx, hx + headW - 9, eyeY - 1, 7, 5, gc);
          R(ctx, hx + 9, eyeY + 1, 4, 1, gc);
          R(ctx, hx + 3, eyeY, 1, 1, C(mix(c.glassesColor || '#c03030', 0.45)));
        } else {
          var glassX = dir === 'left' ? hx + 1 : hx + headW - 8;
          R(ctx, glassX, eyeY - 1, 8, 5, gc);
          R(ctx, dir === 'left' ? hx + 8 : hx + headW - 1, eyeY, 3, 1, gc);
        }
      }
      if (c.stubble) {
        var stubble = C(c.stubble);
        R(ctx, hx + 5, headTop + 13, headW - 10, 2, stubble);
        R(ctx, hx + 7, headTop + 15, headW - 14, 1, stubble);
      }
      if (c.grin) {
        R(ctx, hx + 7, headTop + 13, 8, 2, OL);
        R(ctx, hx + 8, headTop + 14, 6, 1, white);
      } else {
        var lip = C(c.lip || '#9d625e');
        var mouthX = dir === 'left' ? hx + 2 : (dir === 'right' ? hx + headW - 6 : hx + 9);
        R(ctx, mouthX, headTop + 14, dir === 'down' ? 4 : 3, 1, lip);
      }
      if (c.earring) {
        var earringX = dir === 'left' ? hx + headW : hx - 1;
        R(ctx, earringX, headTop + 12, 2, 3, C(c.earring));
      }
    }

    // rim-light lato sole (nord-ovest): 1px chiaro su bordo sinistro/alto,
    // niente per le silhouette (shadow) — costo zero GPU, cotto nello sprite
    if (!sh) {
      var rim = 'rgba(255,242,208,0.52)';
      R(ctx, hx, headTop + 3, 1, headH - 8, rim);
      R(ctx, hx + 3, headTop - (c.hat ? 5 : 3), Math.max(5, headW - 8), 1, rim);
      R(ctx, bx0 - 1, bodyTop + 3, 1, 10, rim);
      R(ctx, leftX, footY - 3 + leftLift, 2, 1, 'rgba(255,242,208,0.28)');
    }
  };
})();
