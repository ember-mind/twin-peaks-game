/* chars.js — sprite personaggi disegnati con fillRect, stile Pokémon B/W (DS):
   testoni grandi, corpo compatto, contorno scuro 1px, ~16x20 (da y-4 a y+16).
   (split da sprites.js; i tile del mondo sono in tiles.js) */
(function () {
  var G = (typeof window !== 'undefined' ? window : globalThis);
  G.GAME = G.GAME || {};
  var GAME = G.GAME;
  var S = GAME.sprites = GAME.sprites || {};

  function R(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

  /* Personaggi: testoni chibi composti da rettangoli, contorno scuro.
     flag: hat / long / dress / glasses / log / tie / shadow / short / bun / onearm / grin */
  S.CHARS = {
    cooper:  { skin: '#f0c8a0', hair: '#282828', shirt: '#2a2a30', pants: '#2a2a30', tie: '#a02020' },
    truman:  { skin: '#e8b88a', hair: '#4a3018', shirt: '#b0925a', pants: '#7a6238', hat: '#5a4222' },
    lucy:    { skin: '#f0c8a0', hair: '#e8d060', shirt: '#e080a0', pants: '#8a5a7a', long: true, bun: true },
    andy:    { skin: '#e8b88a', hair: '#6a4a20', shirt: '#b0925a', pants: '#7a6238' },
    hawk:    { skin: '#a06838', hair: '#181818', shirt: '#4060a0', pants: '#2a3a5a', long: true },
    sarah:   { skin: '#f0c8a0', hair: '#402818', shirt: '#704080', pants: '#704080', long: true, dress: true },
    leland:  { skin: '#e8b88a', hair: '#c8c8c8', shirt: '#404048', pants: '#303038' },
    norma:   { skin: '#f0c8a0', hair: '#5a3820', shirt: '#3a7d6e', pants: '#3a7d6e', dress: true },
    shelly:  { skin: '#f0c8a0', hair: '#e8d060', shirt: '#e07898', pants: '#e07898', dress: true },
    loglady: { skin: '#d8b090', hair: '#7a6a5a', shirt: '#7a4030', pants: '#4a3020', long: true, log: true },
    bobby:   { skin: '#e8b88a', hair: '#181818', shirt: '#282828', pants: '#30508a' },
    donna:   { skin: '#f0c8a0', hair: '#6a4a20', shirt: '#8a3040', pants: '#4a4a5a', long: true },
    jacoby:  { skin: '#d8a880', hair: '#b0a890', shirt: '#e8e8e8', pants: '#8a8a8a', glasses: true },
    audrey:  { skin: '#f0c8a0', hair: '#181818', shirt: '#c02030', pants: '#403020' },
    mfap:    { skin: '#e8c8a8', hair: '#181818', shirt: '#c01020', pants: '#c01020', short: true },
    laura:   { skin: '#e8d8c8', hair: '#e8d878', shirt: '#9090a0', pants: '#606070', long: true, shadow: true },
    gerard:   { skin: '#c89868', hair: '#6a5a48', shirt: '#5a5040', pants: '#4a4030', onearm: 'left' },
    benhorne: { skin: '#e8b88a', hair: '#101010', shirt: '#282838', pants: '#202028', tie: '#7a1818' },
    giant:    { skin: '#f8f0e8', hair: '#e0e0e0', shirt: '#484850', pants: '#181818', tie: '#0a0a0a' },
    maddy:    { skin: '#e8d8c8', hair: '#3a1c14', shirt: '#a0506a', pants: '#504858', long: true, glasses: true, glassesColor: '#302020' },
    bob:      { skin: '#c89868', hair: '#787868', shirt: '#3a5a8a', pants: '#2a3a5a', long: true, grin: true },
    james:    { skin: '#e8b88a', hair: '#0a0a0a', shirt: '#202024', pants: '#30508a' },
    jacques:  { skin: '#e8a878', hair: '#5a4020', shirt: '#a03828', pants: '#4a3020' },
    ronette:  { skin: '#f4e0d0', hair: '#e8d060', shirt: '#d8d8d8', pants: '#d8d8d8', long: true, dress: true }
  };

  S.drawChar = function (ctx, name, x, y, dir, frame, moving) {
    var c = S.CHARS[name] || S.CHARS.cooper;
    var sh = !!c.shadow;
    function C(col) { return sh ? '#26262f' : col; }
    var skin = C(c.skin), hair = C(c.hair), shirt = C(c.shirt), pants = C(c.pants);
    var OL = C('#202028');      // contorno scuro (firma stile B/W)
    var eye = C('#12121a');
    var shoe = C('#1a1a22');
    var white = C('#f4f4f4');
    var isShort = !!c.short;    // mfap: più basso di tutti
    var bob = (moving && frame) ? -1 : 0;  // rimbalzo di 1px di testa+busto

    // rettangolo con contorno scuro 1px (contorno sotto, riempimento sopra)
    function OR(ox, oy, w, h, fill) {
      R(ctx, x + ox - 1, y + oy - 1, w + 2, h + 2, OL);
      R(ctx, x + ox, y + oy, w, h, fill);
    }

    // blocco a spigoli arrotondati (testone B/W): contorno scuro che segue la
    // sagoma, angoli superiori/inferiori intaccati di 1px così legge tondo.
    function RB(ox, oy, w, h, fill) {
      R(ctx, x + ox + 1, y + oy - 1, w - 2, 1, OL);       // contorno sopra
      R(ctx, x + ox + 1, y + oy + h, w - 2, 1, OL);       // contorno sotto
      R(ctx, x + ox - 1, y + oy + 1, 1, h - 2, OL);       // contorno sinistra
      R(ctx, x + ox + w, y + oy + 1, 1, h - 2, OL);       // contorno destra
      R(ctx, x + ox + 1, y + oy, w - 2, 1, fill);         // riga alta rientrata
      R(ctx, x + ox, y + oy + 1, w, h - 2, fill);         // corpo
      R(ctx, x + ox + 1, y + oy + h - 1, w - 2, 1, fill); // riga bassa rientrata
    }
    // calotta capelli con top arrotondato (segue la testa)
    function RBtop(ox, oy, w, hh, fill) {
      R(ctx, x + ox + 1, y + oy, w - 2, 1, fill);
      R(ctx, x + ox, y + oy + 1, w, hh - 1, fill);
    }

    // layout verticale (offset rispetto a y). Testa ~45% dell'altezza totale.
    var hsT = isShort ? 1 : -2;   // top pelle testa
    var hsH = isShort ? 6 : 9;    // altezza testa (grande, chibi)
    var eyeY = isShort ? 4 : 3;   // riga occhi (terzo basso della testa)
    var hcH = isShort ? 2 : 4;    // altezza calotta capelli
    var bT = 7;                   // top busto
    var bH = 4;                   // altezza busto
    var armY = 8;
    var legT = 11;                // gambe piantate a terra (piedi a y+16)
    var hT = hsT + bob;           // top testa col rimbalzo

    // ombra ellittica sotto i piedi
    R(ctx, x + 2, y + 14, 12, 2, 'rgba(0,0,0,0.28)');

    // capelli lunghi dietro le spalle (dietro a tutto)
    if (c.long && !isShort) {
      R(ctx, x + 1, y - 3, 14, 12, OL);
      R(ctx, x + 2, y - 3, 12, 10, hair);
    }

    /* ---- gambe / vestito (disegnate per prime, il busto le copre in alto) ---- */
    if (c.dress) {
      R(ctx, x + 4, y + 11, 8, 2, OL);          // vita gonna (stretta)
      R(ctx, x + 3, y + 13, 10, 2, OL);         // orlo gonna (svasato 1px per lato)
      R(ctx, x + 4, y + 11, 8, 2, shirt);
      R(ctx, x + 3, y + 13, 10, 1, shirt);
      R(ctx, x + 5, y + 14, 2, 1, skin);
      R(ctx, x + 9, y + 14, 2, 1, skin);
      R(ctx, x + 5, y + 15, 2, 1, shoe);
      R(ctx, x + 9, y + 15, 2, 1, shoe);
    } else if (moving) {
      R(ctx, x + 4, y + legT, 8, 5, OL);        // un unico blocco di contorno
      if (frame) {
        R(ctx, x + 5, y + legT, 2, 3, pants);      R(ctx, x + 5, y + legT + 3, 2, 1, shoe);
        R(ctx, x + 9, y + legT, 2, 2, pants);      R(ctx, x + 9, y + legT + 2, 2, 1, shoe);
      } else {
        R(ctx, x + 5, y + legT, 2, 2, pants);      R(ctx, x + 5, y + legT + 2, 2, 1, shoe);
        R(ctx, x + 9, y + legT, 2, 3, pants);      R(ctx, x + 9, y + legT + 3, 2, 1, shoe);
      }
    } else {
      R(ctx, x + 4, y + legT, 8, 5, OL);
      R(ctx, x + 5, y + legT, 2, 3, pants);        R(ctx, x + 5, y + legT + 3, 2, 1, shoe);
      R(ctx, x + 9, y + legT, 2, 3, pants);        R(ctx, x + 9, y + legT + 3, 2, 1, shoe);
    }

    /* ---- busto ---- */
    OR(4, bT + bob, 8, bH, shirt);
    if (c.tie) {                                    // Cooper: camicia bianca + cravatta
      R(ctx, x + 6, y + bT + bob, 4, 1, white);     // colletto
      R(ctx, x + 7, y + bT + bob, 2, bH, C(c.tie)); // cravatta
    }

    /* ---- braccia sottili 2px (nei profili una sola, davanti) ---- */
    var noArm = c.onearm === 'left';                // Gerard/MIKE: braccio sinistro assente
    if (dir === 'left' || dir === 'right') {
      var af = moving ? (frame ? 1 : 0) : 0;
      var ax = (dir === 'left') ? 3 : 11;
      if (!(noArm && dir === 'left')) OR(ax, armY + bob + af, 2, 3, shirt);
    } else {
      var aoL = moving ? (frame ? 1 : 0) : 0;       // fase opposta: braccio-swing
      var aoR = moving ? (frame ? 0 : 1) : 0;
      if (!noArm) OR(3, armY + bob + aoL, 2, 3, shirt);
      OR(11, armY + bob + aoR, 2, 3, shirt);
    }

    /* ---- testa (testone tondo) ---- */
    RB(3, hT, 10, hsH, (dir === 'up') ? hair : skin);

    // capelli / cappello / nuca
    if (dir === 'up') {
      /* vista da dietro: la testa è già tutta capelli */
    } else if (c.hat) {
      var ht = C(c.hat);                             // Truman: cappello da ranger
      R(ctx, x + 4, y + hT - 1, 8, 1, OL);
      R(ctx, x + 4, y + hT, 8, 2, ht);               // cupola
      R(ctx, x + 1, y + hT + 2, 14, 1, OL);          // tesa larga
      R(ctx, x + 2, y + hT + 2, 12, 1, ht);
      R(ctx, x + 11, y + eyeY + bob, 1, 3, C('#3a2a14')); // sottogola 1px
    } else {
      RBtop(3, hT, 10, hcH, hair);                   // calotta arrotondata
      R(ctx, x + 3, y + hT + hcH, 1, 2, hair);       // tempia sinistra
      R(ctx, x + 12, y + hT + hcH, 1, 2, hair);      // tempia destra
      R(ctx, x + 5, y + hT + hcH, 1, 1, hair);       // ciuffo/frangetta 1px
      R(ctx, x + 8, y + hT + hcH, 2, 1, hair);       // ciuffo/frangetta 2px
      if (c.tie) R(ctx, x + 9, y + hT, 1, 3, C('#4a4a52')); // Cooper: riga laterale
    }

    // crocchia (Lucy): blocco 2x2 in alto-dietro
    if (c.bun) {
      R(ctx, x + 5, y + hT - 1, 6, 2, OL);
      R(ctx, x + 6, y + hT - 1, 4, 2, hair);
    }

    // viso: occhi 1x2 grandi + catchlight bianco 1px accanto (niente bocca, stile B/W)
    if (dir !== 'up') {
      if (dir === 'left') {
        R(ctx, x + 4, y + eyeY + bob, 1, 2, eye);
        if (!sh) R(ctx, x + 5, y + eyeY + bob, 1, 1, white);
      } else if (dir === 'right') {
        R(ctx, x + 11, y + eyeY + bob, 1, 2, eye);
        if (!sh) R(ctx, x + 10, y + eyeY + bob, 1, 1, white);
      } else {
        R(ctx, x + 5, y + eyeY + bob, 1, 2, eye);
        R(ctx, x + 10, y + eyeY + bob, 1, 2, eye);
        if (!sh) {
          R(ctx, x + 6, y + eyeY + bob, 1, 1, white);
          R(ctx, x + 9, y + eyeY + bob, 1, 1, white);
        }
      }
      if (c.glasses) {                               // Jacoby: lenti rossa/blu, 3px alte
        var gc = c.glassesColor;                      // Maddy: stessa tinta scura su entrambe
        R(ctx, x + 4, y + eyeY - 1 + bob, 4, 3, gc ? C(gc) : C('#c03030'));
        R(ctx, x + 8, y + eyeY - 1 + bob, 4, 3, gc ? C(gc) : C('#3050c0'));
      }
      if (c.grin) {                                  // BOB: ghigno feroce, denti a vista
        if (dir === 'left') {
          R(ctx, x + 4, y + eyeY + 2 + bob, 2, 1, white);
        } else if (dir === 'right') {
          R(ctx, x + 10, y + eyeY + 2 + bob, 2, 1, white);
        } else {
          R(ctx, x + 6, y + eyeY + 2 + bob, 4, 1, white);
        }
      }
    }

    /* ---- ceppo della Log Lady, tenuto davanti con entrambe le mani ---- */
    if (c.log) {
      R(ctx, x + 1, y + 9, 14, 4, OL);
      R(ctx, x + 2, y + 9, 12, 2, C('#6a4526'));
      R(ctx, x + 2, y + 11, 12, 1, C('#8a5c36'));
      R(ctx, x + 2, y + 9, 2, 3, C('#4a2f18'));
      R(ctx, x + 12, y + 9, 2, 3, C('#4a2f18'));
      R(ctx, x + 4, y + 9, 1, 1, skin);              // mano sinistra sul ceppo
      R(ctx, x + 11, y + 9, 1, 1, skin);             // mano destra sul ceppo
    }
  };
})();
