/* chars.js — sprite personaggi stile chibi moderno, 24x30 logical (canvas 48x60).
 * 4 frame di camminata, idle con respiro + blink, accessori iconici.
 * (zero asset, procedurale con fillRect)
 */
(function () {
  var G = (typeof window !== 'undefined' ? window : globalThis);
  G.GAME = G.GAME || {};
  var GAME = G.GAME;
  var S = GAME.sprites = GAME.sprites || {};

  function R(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

  S.CHARS = {
    cooper:   { skin: '#f0c8a0', hair: '#282828', shirt: '#2a2a30', pants: '#2a2a30', tie: '#a02020' },
    truman:   { skin: '#e8b88a', hair: '#4a3018', shirt: '#b0925a', pants: '#7a6238', hat: '#5a4222', badge: '#e8c840' },
    lucy:     { skin: '#f0c8a0', hair: '#e8d060', shirt: '#e080a0', pants: '#8a5a7a', long: true, bun: true },
    andy:     { skin: '#e8b88a', hair: '#6a4a20', shirt: '#b0925a', pants: '#7a6238' },
    hawk:     { skin: '#a06838', hair: '#181818', shirt: '#4060a0', pants: '#2a3a5a', long: true },
    sarah:    { skin: '#f0c8a0', hair: '#402818', shirt: '#704080', pants: '#704080', long: true, dress: true },
    leland:   { skin: '#e8b88a', hair: '#c8c8c8', shirt: '#404048', pants: '#303038' },
    norma:    { skin: '#f0c8a0', hair: '#5a3820', shirt: '#3a7d6e', pants: '#3a7d6e', dress: true },
    shelly:   { skin: '#f0c8a0', hair: '#e8d060', shirt: '#e07898', pants: '#e07898', dress: true },
    loglady:  { skin: '#d8b090', hair: '#7a6a5a', shirt: '#7a4030', pants: '#4a3020', long: true, log: true },
    bobby:    { skin: '#e8b88a', hair: '#181818', shirt: '#282828', pants: '#30508a' },
    donna:    { skin: '#f0c8a0', hair: '#6a4a20', shirt: '#8a3040', pants: '#4a4a5a', long: true },
    jacoby:   { skin: '#d8a880', hair: '#b0a890', shirt: '#e8e8e8', pants: '#8a8a8a', glasses: true },
    audrey:   { skin: '#f0c8a0', hair: '#181818', shirt: '#c02030', pants: '#403020' },
    mfap:     { skin: '#e8c8a8', hair: '#181818', shirt: '#c01020', pants: '#c01020', short: true },
    laura:    { skin: '#e8d8c8', hair: '#e8d878', shirt: '#9090a0', pants: '#606070', long: true, shadow: true },
    gerard:   { skin: '#c89868', hair: '#6a5a48', shirt: '#5a5040', pants: '#4a4030', onearm: 'left' },
    benhorne: { skin: '#e8b88a', hair: '#101010', shirt: '#282838', pants: '#202028', tie: '#7a1818' },
    giant:    { skin: '#f8f0e8', hair: '#e0e0e0', shirt: '#484850', pants: '#181818', tie: '#0a0a0a' },
    maddy:    { skin: '#e8d8c8', hair: '#3a1c14', shirt: '#a0506a', pants: '#504858', long: true, glasses: true, glassesColor: '#302020' },
    bob:      { skin: '#c89868', hair: '#787868', shirt: '#3a5a8a', pants: '#2a3a5a', long: true, grin: true },
    james:    { skin: '#e8b88a', hair: '#0a0a0a', shirt: '#202024', pants: '#30508a' },
    jacques:  { skin: '#e8a878', hair: '#5a4020', shirt: '#a03828', pants: '#4a3020' },
    ronette:  { skin: '#f4e0d0', hair: '#e8d060', shirt: '#d8d8d8', pants: '#d8d8d8', long: true, dress: true }
  };

  S.drawChar = function (ctx, name, x, y, dir, frame, moving, t) {
    var c = S.CHARS[name] || S.CHARS.cooper;
    var sh = !!c.shadow;
    function C(col) { return sh ? '#26262f' : col; }
    var skin = C(c.skin), hair = C(c.hair), shirt = C(c.shirt), pants = C(c.pants);
    var OL = C('#202028');
    var eye = C('#12121a');
    var shoe = C('#1a1a22');
    var white = C('#f4f4f4');
    var isShort = !!c.short;
    t = t || 0;

    var breathPx = moving ? 0 : Math.round(Math.sin(t / 350) * 1.2);
    var blink = !moving && ((t % 4200) > 3900);
    var bob = moving ? ((frame === 1 || frame === 3) ? -1 : 0) : breathPx;

    var cx = x + 12; // centro personaggio (canvas logico 48x60, char 24 wide)
    var footY = y + 52;

    // ombra morbida a terra
    R(ctx, x + 10, footY + 1, 24, 4, 'rgba(0,0,0,0.18)');
    R(ctx, x + 14, footY, 16, 4, 'rgba(0,0,0,0.18)');

    // capelli lunghi dietro
    if (c.long && !isShort) {
      R(ctx, x + 4, y + 6, 4, 32, OL);
      R(ctx, x + 40, y + 6, 4, 32, OL);
      R(ctx, x + 6, y + 8, 2, 28, hair);
      R(ctx, x + 40, y + 8, 2, 28, hair);
    }

    /* ---- gambe ---- */
    var legTop = y + 32 + bob;
    var legLen = 14;
    var pantsCol = c.dress ? shirt : pants;
    var shoeCol = shoe;
    var leftLeg, rightLeg;

    if (c.dress) {
      R(ctx, x + 12, legTop, 24, 4, OL);   // vita
      R(ctx, x + 10, legTop + 4, 28, 4, OL); // gonna svasata
      R(ctx, x + 13, legTop, 22, 3, shirt);
      R(ctx, x + 11, legTop + 4, 26, 3, shirt);
      R(ctx, x + 18, legTop + 8, 4, 8, skin);  // gambe nude
      R(ctx, x + 26, legTop + 8, 4, 8, skin);
      R(ctx, x + 18, footY - 3, 4, 3, shoeCol);
      R(ctx, x + 26, footY - 3, 4, 3, shoeCol);
    } else if (isShort) {
      // MFAP: gambe corte
      R(ctx, x + 18, legTop + 4, 4, 6, OL); R(ctx, x + 19, legTop + 5, 2, 4, pants);
      R(ctx, x + 26, legTop + 4, 4, 6, OL); R(ctx, x + 27, legTop + 5, 2, 4, pants);
      R(ctx, x + 18, footY - 3, 4, 3, shoeCol); R(ctx, x + 26, footY - 3, 4, 3, shoeCol);
    } else if (moving) {
      // 4 frame: alterna gambe in avanti/indietro
      var off = [0, 3, 0, -3]; // offset Y piedi per sinistra
      var leftF  = off[frame];
      var rightF = off[(frame + 2) % 4];
      // sinistra
      R(ctx, x + 17, legTop, 5, legLen + leftF, OL);
      R(ctx, x + 18, legTop + 1, 3, legLen + leftF - 2, pantsCol);
      R(ctx, x + 17, legTop + legLen + leftF, 5, 3, shoeCol);
      // destra
      R(ctx, x + 26, legTop, 5, legLen + rightF, OL);
      R(ctx, x + 27, legTop + 1, 3, legLen + rightF - 2, pantsCol);
      R(ctx, x + 26, legTop + legLen + rightF, 5, 3, shoeCol);
    } else {
      R(ctx, x + 17, legTop, 5, legLen, OL); R(ctx, x + 18, legTop + 1, 3, legLen - 2, pantsCol); R(ctx, x + 17, legTop + legLen, 5, 3, shoeCol);
      R(ctx, x + 26, legTop, 5, legLen, OL); R(ctx, x + 27, legTop + 1, 3, legLen - 2, pantsCol); R(ctx, x + 26, legTop + legLen, 5, 3, shoeCol);
    }

    /* ---- busto ---- */
    var bodyTop = y + 18 + bob;
    R(ctx, x + 14, bodyTop, 20, 16, OL);   // contorno
    R(ctx, x + 15, bodyTop + 1, 18, 14, shirt);
    if (c.tie) {
      R(ctx, x + 22, bodyTop + 2, 4, 12, C(c.tie)); // cravatta
      R(ctx, x + 21, bodyTop + 1, 6, 2, white);       // colletto
    }
    if (c.badge && dir !== 'up') { // stellina da sceriffo sul petto
      var bx = x + ((dir === 'right') ? 28 : 17), by2 = bodyTop + 3;
      R(ctx, bx + 1, by2, 2, 1, C(c.badge));
      R(ctx, bx, by2 + 1, 4, 2, C(c.badge));
      R(ctx, bx + 1, by2 + 3, 2, 1, C(c.badge));
      R(ctx, bx + 1, by2 + 1, 2, 1, C('#f8ecb0')); // riflesso
    }

    /* ---- braccia ---- */
    var armY = y + 22 + bob;
    var noArm = c.onearm === 'left';
    if (dir === 'left' || dir === 'right') {
      var ax = (dir === 'left') ? 10 : 34;
      if (!(noArm && dir === 'left')) {
        R(ctx, x + ax, armY, 4, 12, OL); R(ctx, x + ax + 1, armY + 1, 2, 10, shirt);
      }
    } else {
      var swingL = moving ? (frame % 2 === 1 ? 2 : -1) : 0;
      var swingR = moving ? (frame % 2 === 0 ? 2 : -1) : 0;
      if (!noArm) { R(ctx, x + 10, armY + swingL, 4, 12, OL); R(ctx, x + 11, armY + 1 + swingL, 2, 10, shirt); }
      R(ctx, x + 34, armY + swingR, 4, 12, OL); R(ctx, x + 35, armY + 1 + swingR, 2, 10, shirt);
    }

    // tronco della Log Lady
    if (c.log) {
      R(ctx, x + 8, armY + 2, 32, 10, OL);
      R(ctx, x + 9, armY + 3, 30, 6, C('#6a4526'));
      R(ctx, x + 9, armY + 9, 30, 2, C('#8a5c36'));
      R(ctx, x + 14, armY + 4, 2, 3, skin);
      R(ctx, x + 32, armY + 4, 2, 3, skin);
    }

    /* ---- testa ---- */
    var headTop = y + 2 + bob;
    var headW = 22, headH = 18;
    var hx = x + 13;
    // testa con contorno arrotondato
    R(ctx, hx, headTop, headW, headH, OL);
    R(ctx, hx + 1, headTop + 1, headW - 2, headH - 2, skin);
    R(ctx, hx + 2, headTop, headW - 4, 1, skin);
    R(ctx, hx + 2, headTop + headH - 1, headW - 4, 1, skin);
    R(ctx, hx, headTop + 2, 1, headH - 4, skin);
    R(ctx, hx + headW - 1, headTop + 2, 1, headH - 4, skin);

    // capelli / cappello
    if (dir === 'up') {
      R(ctx, hx + 1, headTop + 1, headW - 2, headH - 2, hair);
      R(ctx, hx + 2, headTop + headH - 2, headW - 4, 2, hair);
    } else if (c.hat) {
      var ht = C(c.hat);
      R(ctx, hx + 2, headTop - 2, headW - 4, 4, OL);
      R(ctx, hx + 3, headTop - 1, headW - 6, 3, ht);
      R(ctx, hx - 2, headTop + 2, headW + 4, 2, OL);
      R(ctx, hx - 1, headTop + 3, headW + 2, 1, ht);
      R(ctx, hx + headW - 2, headTop + 4, 2, 4, C('#3a2a14'));
    } else {
      R(ctx, hx + 2, headTop - 2, headW - 4, 5, hair);   // calotta
      R(ctx, hx + 1, headTop + 2, 2, 6, hair);          // tempia sx
      R(ctx, hx + headW - 3, headTop + 2, 2, 6, hair);   // tempia dx
      R(ctx, hx + 4, headTop + 2, 4, 2, hair);          // ciuffo
      R(ctx, hx + 12, headTop + 2, 5, 2, hair);
    }

    // crocchia (Lucy)
    if (c.bun) {
      R(ctx, hx + 6, headTop - 4, 10, 4, OL);
      R(ctx, hx + 7, headTop - 3, 8, 2, hair);
    }

    // viso
    if (dir !== 'up') {
      var eyeY = headTop + 7;
      var drawEyes = function (ex, ey, blinkState) {
        if (blinkState) {
          R(ctx, ex, ey + 1, 3, 1, eye);
        } else {
          R(ctx, ex, ey, 2, 3, eye);
          R(ctx, ex + 1, ey + 1, 1, 1, white);
        }
      };
      if (dir === 'left') {
        drawEyes(hx + 3, eyeY, blink);
      } else if (dir === 'right') {
        drawEyes(hx + headW - 6, eyeY, blink);
      } else {
        drawEyes(hx + 4, eyeY, blink);
        drawEyes(hx + headW - 7, eyeY, blink);
        // bocca/naso
        R(ctx, hx + 9, headTop + 12, 4, 1, C('#c8a890'));
      }

      if (c.glasses) {
        var gc = c.glassesColor ? C(c.glassesColor) : C('#c03030');
        R(ctx, hx + 2, eyeY - 1, 7, 5, gc);
        R(ctx, hx + headW - 10, eyeY - 1, 7, 5, gc);
        R(ctx, hx + 9, eyeY + 1, 4, 1, gc);
      }
      if (c.grin) {
        R(ctx, hx + 7, headTop + 13, 8, 2, OL);
        R(ctx, hx + 8, headTop + 14, 6, 1, white);
      }
    }

    // rim-light lato sole (nord-ovest): 1px chiaro su bordo sinistro/alto,
    // niente per le silhouette (shadow) — costo zero GPU, cotto nello sprite
    if (!sh) {
      var rim = 'rgba(255,242,208,0.45)';
      R(ctx, hx, headTop + 2, 1, headH - 4, rim);            // bordo sx testa
      R(ctx, hx + 2, headTop + (dir === 'up' ? 0 : -2), headW - 4, 1, rim); // bordo alto (calotta/cappello)
      R(ctx, x + 14, bodyTop, 1, 15, rim);                    // bordo sx busto
    }
  };
})();
