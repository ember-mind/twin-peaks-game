/* maps.js — mappe ASCII, collisioni, porte, transizioni.
   Legenda tile:
   . erba        g erba scura (bosco)  r strada      p sentiero terra
   w acqua(X)    T sempreverde(X)      Y sicomoro(X) S cartello(X)
   1 distretto(X) 2 DoubleR(X) 3 casaPalmer(X) 4 hotel(X)  -> muri edifici
   5 ospedale(X) 6 roadhouse(X)                            -> muri edifici
   i muro int.(X) D porta              f parquet     c tappeto
   C bancone(X)  t tavolo(X)  h sedia(X)  K letto(X)  U comò(X)
   o olio        R tenda rossa(X)      Z zig-zag     M statua(X)
   v vuoto(X)    X transenna (apre con 3 indizi -> gate)
   arredo urbano (town): = marciapiede    - strisce pedonali  , erba fiorita
   L lampione(X)  P palo telefono(X)  B panchina(X)  F staccionata(X)
   A aiuola fiorita(X)  H idrante(X)  E cassetta postale(X)  n cespuglio(X)
   (X) = solido
   Town/woods generate e validate con test/genmaps.js (BFS su porte/npc). */
(function () {
  var G = (typeof window !== 'undefined' ? window : globalThis);
  G.GAME = G.GAME || {};
  var GAME = G.GAME;
  var M = {};
  GAME.maps = M;

  M.SOLID = {
    T: 1, S: 1, w: 1,
    '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, '8': 1,
    i: 1, C: 1, t: 1, h: 1, K: 1, U: 1,
    Y: 1, R: 1, M: 1, v: 1, G: 1,
    L: 1, P: 1, B: 1, F: 1, A: 1, H: 1, E: 1, n: 1, q: 1
  };
  M.isSolid = function (ch) { return !ch || !!M.SOLID[ch]; };

  M.maps = {
    town: {
      id: 'town',
      rows: [
        //         1111111111222222222233333333334444444444555555
        //01234567890123456789012345678901234567890123456789012345
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTXTTTTT', // 0  X = sentiero bosco
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTpTTTTT', // 1
        'T.................................................p....T', // 2
        'T....TTTTTTTTTT....TTTTTTTTTT........TTTTTTTTTT...p....T', // 3  siepi dietro hotel/ospedale/palmer
        'Tn...4444444444.....55555555.........3333333333...p.,..T', // 4
        'T....4444444444.....55555555.........3333333333...p.n..T', // 5
        'T....4444D44444.....555D5555.........33333D3333...p....T', // 6  hotel / ospedale / casa Palmer
        'T.......ApA...........ApA............FFFFFpFFFF...p....T', // 7  aiuole hotel/ospedale, staccionata giardino Palmer
        'T........p.......n.....p.wFF..............p.......p....T', // 8
        'T........p..........T..p.wFF77773333......p.......p..,.T', // 9 Bookhouse + rail + edificio giallo
        'T........p...,.........p.wFF77773333......p.......p....T', // 10
        'T........p.............p.wFF77773333....,.p.......p....T', // 11
        'T........p.............p.wFF77773333......p.......p....T', // 12
        'T===L====pE=====L======p====L===========L=pE======p=L==T', // 13 marciapiede nord, lampioni, cassette postali
        'Trrrrrrrr--r--rrrrrrrrrrrwFFrrrrrrrrrrrrrr--rrrrrrrrrrrr', // 14 strada waterfront: acqua/rail a sinistra
        'Trrrrrrrr--r--rrrrrrrrrrrwFFrrrrrrrrrrrrrr--rrrrrrrrrrrr', // 15
        'T=====P===L=======P===L==wFFFFF=============P=L========T', // 16 rail orizzontale sul waterfront
        'T,....n..TTTTTTT.........wFFFFF........TTTTTTT.........T', // 17
        'T.........11111..........wwwww.........2222222.........T', // 18
        'T.........11111...........=rr=.........2222222..H......T', // 19 idrante vicino al diner
        'T.........11D11...........=rr=.........222D222.........T', // 20 distretto / Double R
        'T.......FFFpppFFF.....n.T.=rr=...........ppp....TTTTTT.T', // 21 vialetti distretto/diner, recinto
        'T.,T..gggg.ppp...q........=rr=...........ppp....G.G.G..T', // 22 cassa servizio
        'T..gggg....ppp.,B.........=rr=n..........ppp...........T', // 23
        'T..ggggT..n...n.A.........=rr=...................G.G.G.T', // 24
        'T.......B............T....=rr=........n....gggg........T', // 25
        'T...wwwwwwwwwwF...........=rr=.............,66666666...T', // 26 lago / roadhouse, staccionata riva est
        'T..,wwwwwwwwwwF...........=rr=.....T........66666666...T', // 27
        'T..nwwwwwwwwwwF...........=rr=,.............666D6666...T', // 28 porta roadhouse
        'T...wwwwwwwwwwF...........=rrB=A...............p......nT', // 29 piazza: panchina/aiuola
        'T...wwwwwwwwwwF..,T.......=rr=S=H..............p..T....T', // 30 cartello Benvenuti, piazza, idrante
        'T...wwwwwwwwwwF...........=rr==B............,..........T', // 31 piazza: panchina
        'T...,..............n......=rr=.........................T', // 32
        'T.........................=rr=.,.......................T', // 33
        'TTTTTTTTTTTTTTTTTTTTT.n..n.n...,..n.TTTTTTTTTTTTTTTTTTTT', // 34
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'  // 35
      ],
      doors: {
        '9,6':  { to: 'hotel_gn', tx: 8, ty: 10, dir: 'up', needsFlag: 'sogno_fatto', blockedMsg: 'hotel_locked' },
        '23,6': { to: 'hospital', tx: 5, ty: 8, dir: 'up', needsFlag: 'sogno_fatto', blockedMsg: 'hospital_locked' },
        '42,6': { to: 'palmer', tx: 7, ty: 10, dir: 'up' },
        '12,20': { to: 'sheriff', tx: 4, ty: 7, dir: 'up' },
        '42,20': { to: 'diner', tx: 6, ty: 8, dir: 'up' },
        '47,28': { to: 'roadhouse', tx: 7, ty: 8, dir: 'up', needsFlag: 'atto4', blockedMsg: 'roadhouse_chiuso' },
        '55,14': { to: 'traincar', tx: 2, ty: 7, dir: 'right', needsFlag: 'atto3', blockedMsg: 'est_bloccato' },
        '55,15': { to: 'traincar', tx: 2, ty: 7, dir: 'right', needsFlag: 'atto3', blockedMsg: 'est_bloccato' }
      },
      interact: { '30,30': 'cartello', '15,28': 'lago_riva', '50,22': 'tomba_laura' },
      objects: [
        { type: 'landmark', kind: 'waterfall', x: 8, y: 0, w: 6, h: 2, dialogue: 'landmark_waterfall' },
        { type: 'landmark', kind: 'cemetery', x: 48, y: 21, w: 6, h: 4, dialogue: 'landmark_cemetery' },
        { type: 'landmark', kind: 'tracks', x: 53, y: 1, w: 2, h: 33, dialogue: 'landmark_tracks' },
        { type: 'landmark', kind: 'welcomesign', x: 30, y: 30, dialogue: 'sign_town' }
      ],
      gate: { x: 50, y: 0, to: 'woods', tx: 14, ty: 20, dir: 'up' },
      onEnter: { dialogue: 'town_arrivo', once: 'intro_town' }
    },

    sheriff: {
      id: 'sheriff',
      indoor: true,
      rows: [
        'iiiiiiiiii', // 0
        'iffffffffi', // 1 scaffali
        'ifCCffCCfi', // 2 scrivanie
        'iffffffffi', // 3 Andy(2,3), Leland(5,3), Truman(7,3)
        'ifffttfffi', // 4 scrivania centrale 32x16
        'iffhffhffi', // 5 sedie, corridoio centrale libero
        'iffffffffi', // 6 Lucy(2,6), Hawk(7,6)
        'iffffffffi', // 7 pavimento fino alla porta (spawn 4,7)
        'iiiiDiiiii'  // 8 porta centrale 16px
      ],
      doors: {
        '4,8': { to: 'town', tx: 12, ty: 21, dir: 'down' }
      },
      interact: {}
    },

    palmer: {
      id: 'palmer',
      indoor: true,
      rows: [
        'iiiiiiiiiiiiiiii', // 0
        'iKKfffUffffffffi', // 1 camera di Laura: letto, comò (6,1) da ispezionare
        'iffffffffffffffi', // 2
        'iffffffffffffffi', // 3
        'iiiiffiiiiiiiiii', // 4 corridoio c4-5
        'iffffffffffffffi', // 5
        'ifftffcccccffffi', // 6
        'ifffffcccccffffi', // 7 Sarah(9,7)
        'ifffffcccccffffi', // 8 Leland(12,8)
        'iffffffffffffffi', // 9
        'iffffffffffffffi', // 10 (spawn 7,10)
        'iiiiiiiDDiiiiiii'  // 11
      ],
      doors: {
        '7,11': { to: 'town', tx: 42, ty: 7, dir: 'down' },
        '8,11': { to: 'town', tx: 42, ty: 7, dir: 'down' }
      },
      interact: { '6,1': 'cameraLaura' }
    },

    hotel_gn: {
      id: 'hotel_gn',
      indoor: true,
      rows: [
        'iiiiiiiiiiiiiiiiii', // 0
        'ifffffffffffiKKUfi', // 1  stanza 315: letto, comò (15,1) da ispezionare
        'ifffffffffffiffffi', // 2
        'ifffffffffffiffffi', // 3
        'iffffffffffffffffi', // 4  corridoio si apre sulla stanza
        'iffffffffffffffffi', // 5
        'iffffffffffffffffi', // 6
        'iffffffffffffffffi', // 7  Ben Horne(5,7)
        'ifffCCCCfffffffffi', // 8  bancone reception
        'iffffffffffffffffi', // 9  Audrey(12,9)
        'iffffffffffffffffi', // 10 (spawn 8,10)
        'iiiiiiiiDDiiiiiiii'  // 11
      ],
      doors: {
        '8,11': { to: 'town', tx: 9, ty: 7, dir: 'down' },
        '9,11': { to: 'town', tx: 9, ty: 7, dir: 'down' }
      },
      interact: { '15,1': 'specchio315' }
    },

    hospital: {
      id: 'hospital',
      indoor: true,
      rows: [
        'iiiiiiiiiiii', // 0
        'iKKffffffffi', // 1  letto di Ronette (2,1) da ispezionare
        'iffffffffffi', // 2
        'iffffKKffffi', // 3
        'iffffffffffi', // 4
        'iffffffffKKi', // 5
        'iffffffffffi', // 6  Gerard(7,6)
        'iffffffffffi', // 7
        'iffffffffffi', // 8  (spawn 5,8)
        'iiiiiDDiiiii'  // 9
      ],
      doors: {
        '5,9': { to: 'town', tx: 23, ty: 7, dir: 'down' },
        '6,9': { to: 'town', tx: 23, ty: 7, dir: 'down' }
      },
      interact: { '2,1': 'ronette_letto' }
    },

    diner: {
      id: 'diner',
      indoor: true,
      rows: [
        'iiiiiiiiiiiiii', // 0
        'iffffffffffffi', // 1 Norma(5,1)
        'iffCCCCCCffffi', // 2 bancone
        'iffffffffffffi', // 3
        'iffffffffffffi', // 4 Shelly(8,4)
        'ifttffffttfffi', // 5 Log Lady(4,5)
        'iffffffffffffi', // 6
        'ifttffffttfffi', // 7
        'iffffffffffffi', // 8 (spawn 6,8)
        'iiiiiiDDiiiiii'  // 9
      ],
      doors: {
        '6,9': { to: 'town', tx: 42, ty: 21, dir: 'down' },
        '7,9': { to: 'town', tx: 42, ty: 21, dir: 'down' }
      },
      interact: {}
    },

    woods: {
      id: 'woods',
      rows: [
        //         111111111122222222
        //0123456789012345678901234567
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTT', // 0 alberi dietro Lodge
        'TTTTTTTTTTT888888TTTTTTTTTTT', // 1 tetto Lodge, 96 px come reference Gold
        'TTTTTTTTTTT888888TTTTTTTTTTT', // 2 tetto Lodge
        'TTTTTTTTTTq888888TTTTTTTTTTT', // 3 facciata Lodge, cassa alta sinistra
        'TTTTTTTTTTT888D88TTTTTTTTTTT', // 4 porta -> Red Room (14,4)
        'TTTTTTTTTggggpppggggTTTTTTTT', // 5 cortile
        'TTTTTTTTTggggpppggqgTTTTTTTT', // 6 cortile, cassa destra
        'TTTTTTTTTggggpppggggTTTTTTTT', // 7 cortile
        'TTTTTTTTTTTgTpppggTTTTTTTTTT', // 8
        'TTTTTTTTTTgggpYpgggTTTTTTTTT', // 9 cerchio di sicomori
        'TTTTTTTTTTggYpppYggTTTTTTTTT', // 10
        'TTTTTTTTTTgggooogggTTTTTTTTT', // 11 olio 3×2
        'TTTTTTTTTTgYooopgYgTTTTTTTTT', // 12 olio 3×2 sfalsato
        'TTTTTTTTTTgggpppgggTTTTTTTTT', // 13
        'TTTTTTTTTTggYpppYggTTTTTTTTT', // 14
        'TTTTTTTTTTgggpYpgggTTTTTTTTT', // 15
        'TTTTTTTTTTTSggppTTTTTTTTTTTT', // 16 cartello Glastonbury Grove (11,16)
        'TTTTTTTTTTTTTpppTTTTTTTTTTTT', // 17
        'TTTTTTTTTTTTgpppTTTTTTTTTTTT', // 18
        'TTTTTTTTTTTTgpppTTTTTTTTTTTT', // 19
        'TTTTTTTTTTTgTpppngTTTTTTTTTT', // 20 (spawn 14,20), cespuglio al sentiero
        'TTTTTTTTTTTTTTpTTTTTTTTTTTTT'  // 21 uscita sud -> città
      ],
      doors: {
        '14,4': { to: 'redroom', tx: 8, ty: 9, dir: 'up' },
        '14,21': { to: 'town', tx: 50, ty: 1, dir: 'down' }
      },
      interact: { '14,12': 'olio', '11,16': 'cartelloBosco' }
    },

    redroom: {
      id: 'redroom',
      indoor: true,
      rows: [
        'RRRRRRRRRRRRRRRR', // 0
        'RZZZZZZZZZZZZZZR', // 1
        'RZZMZZZZZZZZZMZR', // 2 statue, Ombra di Laura (11,2)
        'RZZZZZZhZZhZZZZR', // 3
        'RZZZZZZZZZZZZZZR', // 4 Uomo in Rosso (8,4)
        'RZZZZZZZZZZZZZZR', // 5
        'RZZZZZhZZhZZZZZR', // 6
        'RZZZZZZZZZZZZZZR', // 7
        'RZZZZZZZZZZZZZZR', // 8
        'RZZZZZZZZZZZZZZR', // 9 (spawn 8,9)
        'RZZZZZZZZZZZZZZR', // 10
        'RRRRRRRRDRRRRRRR'  // 11 uscita tra le tende -> bosco
      ],
      doors: {
        '8,11': { to: 'hotel_gn', tx: 14, ty: 2, dir: 'down' } // risveglio: Cooper si sveglia nella stanza 315 del Great Northern
      },
      interact: {},
      onEnter: 'redroom'
    },

    /* ---------------- Atto 3: il confine ---------------- */

    traincar: {
      id: 'traincar',
      rows: [
        //         111111111122
        //0123456789012345678901234
        'TTTTTTTTTTTTTTTTTTTTTDTT', // 0  D = sentiero verso One Eyed Jacks
        'TggggggggggggggggggggpgT', // 1
        'TggTggggggggggggggggSpgT', // 2  cartello One Eyed Jacks
        'TgggggTgiiiiiiiiTggggpgT', // 3  parete nord del vagone
        'TgggTgggiffffffigggTgpgT', // 4  interno: mucchio (10,4) hawk (12,4)
        'TgggggggiffffffigggggpTT', // 5  interno: anello (13,5)
        'TggggSggiiiDiiiigggggpgT', // 6  cartello ponte, porta sud del vagone (11,6)
        'ppppppppppppppppppppppgT', // 7  sentiero est-ovest, uscita a ovest -> città (0,7)
        'TggggggggggggggggggggggT', // 8
        'TgTggggggggggggggTggggTT', // 9
        'TggTgggggTgggggggggggggT', // 10
        'TgggggTggggggggggggggggT', // 11
        'TggggggggggggggggggggggT', // 12
        'TTTTTTTTTTTTTTTTTTTTTTTT'  // 13
      ],
      doors: {
        '0,7': { to: 'town', tx: 54, ty: 14, dir: 'left' },
        '21,0': { to: 'oej', tx: 8, ty: 8, dir: 'up' }
      },
      interact: {
        '5,6': 'sign_ponte',
        '20,2': 'sign_oej',
        '10,4': 'mucchio_terra',
        '13,5': 'anello_interact'
      }
    },

    oej: {
      id: 'oej',
      indoor: true,
      rows: [
        'iiiiiiiiiiiiiiii', // 0
        'iffffffffffffffi', // 1
        'iffttffffffttffi', // 2  tavoli da gioco
        'iffffffffffffffi', // 3
        'iffffCCCCCCffffi', // 4  bancone del casinò
        'iffffffffffffffi', // 5  Jacques (7,5)
        'iffffffffffffffi', // 6
        'iffttffffffttffi', // 7  tavoli, Audrey (13,7)
        'iffffffffffffffi', // 8  (spawn 8,8)
        'iiiiiiiDDiiiiiii'  // 9  porta sud -> vagone del treno
      ],
      doors: {
        '7,9': { to: 'traincar', tx: 21, ty: 1, dir: 'down' },
        '8,9': { to: 'traincar', tx: 21, ty: 1, dir: 'down' }
      },
      interact: {}
    },

    /* ---------------- Atto 4: il roadhouse ---------------- */

    roadhouse: {
      id: 'roadhouse',
      indoor: true,
      rows: [
        'iiiiiiiiiiiiiiii', // 0
        'iCCCCCCCCCCCCCCi', // 1  palco, bordo solido (Gigante, seconda apparizione: 8,1)
        'iffffffffffffffi', // 2
        'ifftthhtthhttffi', // 3  tavoli e sedie
        'iffffffffffffffi', // 4
        'ifffCCCCfffffffi', // 5  bancone
        'iffffffffffffffi', // 6
        'ifftthhtthhttffi', // 7  tavoli e sedie
        'iffffffffffffffi', // 8  (spawn 7,8 / 8,8)
        'iiiiiiiDDiiiiiii'  // 9  uscita -> città
      ],
      doors: {
        '7,9': { to: 'town', tx: 47, ty: 29, dir: 'down' },
        '8,9': { to: 'town', tx: 47, ty: 29, dir: 'down' }
      },
      interact: { '8,1': 'palco_gigante' }
    }
  };

  for (var k in M.maps) {
    var m = M.maps[k];
    m.height = m.rows.length;
    m.width = m.rows[0].length;
  }
})();
