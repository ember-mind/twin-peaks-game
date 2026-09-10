/* Calhoun Memorial recovery ward — 256x192 authored native pixels.
 * Flat orthographic rectangles only: no gradients, paths, smoothing or noise.
 * One authored state: cool fluorescent day. The only warm notes are Ronette's
 * face and hand; the only saturated accent is the monitor trace. */
(function () {
  'use strict';

  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  var TILE = 16;

  var palette = {
    ink: '#1e242a',
    edgeDark: '#38464e', edge: '#55676f', edgeHi: '#7e9199',
    mintDeep: '#6a8781', mint: '#94ada6', mintHi: '#a7beb7',
    railDark: '#4f636c', rail: '#6e838c', railHi: '#90a4aa',
    ivoryDark: '#9ba7a9', ivory: '#bfc9c8', ivoryHi: '#cfd8d5',
    baseBand: '#5f757f',
    floorDeep: '#43596b', floorDark: '#5c7688', floor: '#647e91',
    floorMid: '#6b8598', floorHi: '#728c9e',
    steelDeep: '#2f3b42', steelDark: '#55666f', steel: '#7a8b93',
    steelHi: '#9dadb2', steelLite: '#c6d2d4',
    sheetDark: '#aeb6b6', sheetMid: '#cdd2ce', sheet: '#e2e4de',
    sheetHi: '#f4f4ec', sheetWhite: '#fdfdf8',
    gSheetDark: '#98a2a4', gSheetMid: '#b0b9b9', gSheet: '#c3cac8',
    gSheetHi: '#d5dad6',
    curtainDark: '#6f8590', curtain: '#9db0b7', curtainHi: '#c0ced2',
    glass: '#a9bcc4', glassHi: '#cfe0e4', fluid: '#b6c6cb',
    paperDark: '#a8ada2', paper: '#d9dcd2', paperHi: '#eceee4',
    chairDeep: '#2c4152', chairBlue: '#4f7089', chairHi: '#7ea0b4',
    binderDeep: '#42607d', binder: '#5a7c9c', binderHi: '#7d9cb6',
    gownDark: '#92a2ae', gown: '#b3c1cb', gownHi: '#c9d5dc',
    hairDeep: '#3a2619', hair: '#4e3526', hairHi: '#705039',
    skinDark: '#c19277', skin: '#e2b593', skinHi: '#f2d2b4', lip: '#a76b62',
    trace: '#4ee07f', screen: '#0f1a16',
    doorLeaf: '#66788a', doorHi: '#8194a2',
    shadow: '#4f6a7c', shadowMid: '#42596a', shadowDark: '#36495a'
  };

  /* Grounded furniture only. Wall-mounted elements (clock, cabinet, curtain
   * track, chair rail, the south doorway) are architecture. */
  var definitions = [
    {id:'monitorStand', cells:[[1,3],[2,3]],
      bounds:[18,20,31,44], shadow:[19,60,30,4]},
    {id:'ronetteBed', cells:[[3,3],[4,3],[3,4],[4,4],[3,5],[4,5]],
      bounds:[48,30,32,66], shadow:[48,92,32,4]},
    {id:'gerardBed', cells:[[9,3],[10,3],[9,4],[10,4],[9,5],[10,5]],
      bounds:[144,30,32,66], shadow:[144,92,32,4]},
    {id:'curtain', cells:[[8,3],[8,4],[8,5]],
      bounds:[129,9,22,87], shadow:[131,90,18,4]},
    {id:'chair', cells:[[1,6]], bounds:[17,86,15,26], shadow:[17,108,15,4]},
    {id:'nurseCounter', cells:[[12,8],[13,8],[14,8]],
      bounds:[192,104,48,40], shadow:[192,140,48,4]}
  ];

  /* La porta doppia non ha ingombro (le celle 7-8,11 sono calpestabili): il
   * suo telaio vive nel pass foreground con questa quota di piede, cosi'
   * copre il giocatore che attraversa la soglia. */
  var DOOR_FOOT = 192;

  function southEdge(cells) {
    var row = -1, i;
    for (i=0; i<cells.length; i++) if (cells[i][1] > row) row = cells[i][1];
    return (row + 1) * TILE;
  }
  definitions.forEach(function (prop) { prop.footY = southEdge(prop.cells); });

  function rectPainter(ctx,cx,cy) {
    cx = Math.round(cx || 0); cy = Math.round(cy || 0);
    return function (x,y,w,h,color) {
      ctx.fillStyle = color;
      ctx.fillRect(x-cx,y-cy,w,h);
    };
  }

  function drawFloorField(R,p) {
    /* Linoleum blu-grigio: il piano piu' silenzioso della stanza. Quattro
     * valori vicini, uniti in corse larghe perche' il campo non legga mai
     * come griglia; nessuna pozza calda, nessun riflesso. */
    var values=[p.floorDark,p.floor,p.floorMid,p.floorHi];
    var rows=[
      '11222222222111',
      '12222333222211',
      '12233333322211',
      '11233333222111',
      '11222332221110',
      '01122222211100',
      '00112222111100',
      '00011111110000'
    ];
    var row,col,start,value;
    for (row=0;row<rows.length;row++) {
      start=0; value=rows[row].charAt(0);
      for (col=1;col<=14;col++) {
        if (col<14 && rows[row].charAt(col)===value) continue;
        R(16+start*16,48+row*16,(col-start)*16,16,values[+value]);
        start=col; value=rows[row].charAt(col);
      }
    }

    /* Una sola banda di bordo, rientrata dalle pareti, come nel concept. */
    R(24,60,208,4,p.floorDeep); R(24,164,208,4,p.floorDeep);
    R(24,60,4,108,p.floorDeep); R(228,60,4,108,p.floorDeep);
    R(24,60,208,1,p.floorDark); R(24,167,208,1,p.floorDark);
    R(24,60,1,108,p.floorDark); R(231,60,1,108,p.floorDark);

    /* Tre gruppi di usura collocati, fuori dalla colonna d'ingresso. */
    R(40,150,8,1,p.floorDeep); R(44,151,3,1,p.floorHi);
    R(196,100,7,1,p.floorDeep); R(199,101,3,1,p.floorHi);
    R(88,120,9,1,p.floorDeep); R(92,119,3,1,p.floorHi);
  }

  function drawWallFace(R,p) {
    /* 48 px di parete: menta istituzionale sopra, corrimano, avorio freddo
     * sotto, zoccolino piu' freddo. Nessuna venatura, nessun rumore. */
    R(16,0,224,48,p.mintDeep);
    R(16,0,224,2,p.ink);
    R(17,2,222,28,p.mint);
    R(17,2,222,2,p.mintHi);
    R(17,28,222,2,p.mintDeep);
    /* Corrimano: una riga chiara sopra, corpo scuro, ombra sotto. */
    R(16,30,224,3,p.railDark);
    R(17,30,222,1,p.railHi);
    R(17,32,222,1,p.ink);
    /* Parete bassa avorio freddo. */
    R(16,33,224,12,p.ivoryDark);
    R(17,34,222,10,p.ivory);
    R(17,34,222,1,p.ivoryHi);
    /* Zoccolino piu' freddo e linea di stacco col pavimento. */
    R(16,44,224,3,p.baseBand);
    R(17,44,222,1,p.rail);
    R(16,47,224,1,p.ink);
  }

  var CLOCK_RIM=[3,4,5,6,7,7,8,8,8,8,8,7,7,6,5,4,3];
  var CLOCK_RING=[3,4,5,6,6,7,7,7,7,7,6,6,5,4,3];
  var CLOCK_FACE=[2,3,4,5,5,6,6,6,5,5,4,3,2];

  function disc(R,cx,cy,widths,color) {
    var i, top = cy - ((widths.length - 1) >> 1);
    for (i=0;i<widths.length;i++) R(cx-widths[i],top+i,widths[i]*2,1,color);
  }

  function drawWallClock(R,p) {
    disc(R,26,13,CLOCK_RIM,p.ink);
    disc(R,26,13,CLOCK_RING,p.steelHi);
    disc(R,26,13,CLOCK_FACE,p.ivoryHi);
    R(26,7,1,1,p.steelDark); R(31,13,1,1,p.steelDark);
    R(26,19,1,1,p.steelDark); R(21,13,1,1,p.steelDark);
    R(26,8,1,6,p.ink); R(26,13,5,1,p.ink);
    R(25,12,2,2,p.steelDeep);
  }

  function drawWallCabinet(R,p) {
    /* Armadietto in acciaio fra i due letti: due ante, due vetri smerigliati,
     * maniglie verticali. Nessun contenuto leggibile: e' un bordo. */
    R(95,10,29,32,p.ink);
    R(96,11,27,30,p.steelDark);
    R(97,11,25,1,p.steelLite);
    R(98,13,11,26,p.steel); R(110,13,11,26,p.steel);
    R(98,13,11,1,p.steelHi); R(110,13,11,1,p.steelHi);
    R(109,13,1,26,p.steelDeep);
    R(100,15,7,9,p.glass); R(112,15,7,9,p.glass);
    R(100,15,7,1,p.glassHi); R(112,15,3,1,p.glassHi);
    R(100,20,7,1,p.steelHi); R(112,20,7,1,p.steelHi);
    R(107,26,2,7,p.steelLite); R(110,26,2,7,p.steelLite);
    R(96,39,27,2,p.steelDeep);
  }

  function drawCurtainTrack(R,p) {
    R(126,5,30,3,p.steelDark);
    R(127,5,28,1,p.steelHi);
    R(132,8,2,3,p.steelDeep); R(137,8,2,3,p.steelDeep);
    R(142,8,2,3,p.steelDeep); R(147,8,2,3,p.steelDeep);
  }

  function drawSideWalls(R,p) {
    R(0,0,16,192,p.ink);
    R(2,0,11,176,p.edgeDark); R(5,4,7,168,p.edge);
    R(6,4,2,168,p.edgeHi); R(13,0,3,176,p.ink);
    R(240,0,16,192,p.ink);
    R(243,0,11,176,p.edgeDark); R(244,4,7,168,p.edge);
    R(250,4,2,168,p.edgeHi); R(240,0,3,176,p.ink);
    R(0,0,256,4,p.edgeDark); R(6,4,244,2,p.edgeHi);
  }

  /* Il telaio della porta e' l'unica parte del muro sud che viene ridipinta
   * nel pass foreground: gli stessi pixel, cosi' il frame non cambia quando
   * nessuno e' sulla soglia e copre il giocatore quando ci passa. */
  function drawDoorFrame(R,p) {
    R(106,176,2,16,p.ink); R(148,176,2,16,p.ink);
    R(108,176,1,16,p.steelDark); R(147,176,1,16,p.steelDark);
    R(109,176,38,3,p.steelDark);
    R(109,176,38,1,p.steelHi);
    R(109,179,2,13,p.steelDeep); R(145,179,2,13,p.steelDeep);
    R(126,176,4,16,p.steelDeep);
    R(126,176,1,16,p.steelDark); R(129,176,1,16,p.steelDark);
    R(127,176,1,16,p.steelHi);
  }

  function drawSouthWall(R,p) {
    var x;
    R(0,176,256,16,p.ink);
    R(6,178,100,12,p.edgeDark); R(7,178,98,3,p.edgeHi);
    R(9,182,94,6,p.edge);
    R(150,178,100,12,p.edgeDark); R(150,178,98,3,p.edgeHi);
    R(152,182,94,6,p.edge);
    for (x=16; x<104; x+=16) { R(x,182,2,7,p.edgeDark); R(x+2,183,1,5,p.edgeHi); }
    for (x=160; x<248; x+=16) { R(x,182,2,7,p.edgeDark); R(x+2,183,1,5,p.edgeHi); }

    /* Doppia anta centrata sulle celle 7-8, vetri retinati piccoli. */
    R(106,170,44,22,p.ink);
    R(108,172,40,20,p.steelDark);
    R(109,179,38,13,p.steelDeep);
    R(111,180,15,12,p.doorLeaf); R(130,180,15,12,p.doorLeaf);
    R(111,180,15,1,p.doorHi); R(130,180,15,1,p.doorHi);
    R(114,182,9,6,p.glass); R(133,182,9,6,p.glass);
    R(114,182,9,1,p.glassHi); R(133,182,9,1,p.glassHi);
    R(117,182,1,6,p.steelHi); R(120,182,1,6,p.steelHi);
    R(136,182,1,6,p.steelHi); R(139,182,1,6,p.steelHi);
    R(114,184,9,1,p.steelHi); R(133,184,9,1,p.steelHi);
    R(122,188,2,4,p.steelLite); R(132,188,2,4,p.steelLite);
    R(111,190,15,2,p.steelDark); R(130,190,15,2,p.steelDark);
    drawDoorFrame(R,p);
  }

  function drawArchitecture(R,p) {
    R(0,0,256,192,p.ink);
    drawWallFace(R,p);
    drawFloorField(R,p);
    drawWallClock(R,p);
    drawWallCabinet(R,p);
    drawCurtainTrack(R,p);
    drawSideWalls(R,p);
    drawSouthWall(R,p);
  }

  function drawShadow(R,prop,p) {
    /* Il contatto comincia sul bordo-piede dell'attore, oltre la sagoma
     * dipinta: scuro alla base, poi due righe piu' morbide. */
    var s=prop.shadow, foot=prop.footY;
    R(s[0]+2,foot+2,Math.max(1,s[2]-4),1,p.shadow);
    R(s[0]+1,foot+1,Math.max(1,s[2]-2),1,p.shadowMid);
    R(s[0]+4,foot,Math.max(1,s[2]-8),1,p.shadowDark);
  }

  function drawPlayerContact(R,p) {
    var engine=GAME.Engine, state=engine && engine.state, player=state && state.player;
    if (!state || state.mapId!=='hospital' || !player ||
        !Number.isFinite(player.x) || !Number.isFinite(player.y)) return;
    var x=Math.round(player.x), y=Math.round(player.y);
    R(x+3,y+15,10,2,p.shadowMid);
    R(x+4,y+16,8,2,p.shadowDark);
    R(x+6,y+17,4,1,p.ink);
  }

  function drawMonitorStand(R,p) {
    /* Monitor da comodino sul carrello, piantana della flebo accanto: il
     * carrello e' acciaio in tre valori, lo schermo l'unico nero della
     * stanza, la traccia l'unico accento saturo. */
    R(18,26,25,21,p.ink);
    R(19,27,23,19,p.steelDark);
    R(20,27,21,1,p.steelHi);
    R(21,29,19,14,p.steelDeep);
    R(22,30,17,11,p.screen);
    R(23,36,5,1,p.trace);
    R(28,33,1,4,p.trace);
    R(29,31,1,6,p.trace);
    R(30,33,1,4,p.trace);
    R(31,36,4,1,p.trace);
    R(34,37,1,2,p.trace);
    R(35,38,3,1,p.trace);
    R(22,42,3,2,p.steelHi); R(27,42,3,2,p.steel);

    R(19,45,23,19,p.ink);
    R(20,46,21,17,p.steelDark);
    R(20,54,21,1,p.steelDeep); R(21,55,19,1,p.steelHi);
    R(22,56,17,5,p.steel); R(22,56,17,1,p.steelHi);
    R(35,58,3,1,p.steelLite);
    R(21,61,4,3,p.ink); R(36,61,4,3,p.ink);

    /* Piantana: palo, base a croce, sacca sospesa sulla parete. */
    R(43,22,3,42,p.steelDark); R(44,22,1,42,p.steelHi);
    R(38,60,11,3,p.steelDark); R(39,60,9,1,p.steelHi);
    R(38,62,3,2,p.ink); R(46,62,3,2,p.ink);
    R(41,20,6,2,p.steelDark);
    R(40,21,8,12,p.ink); R(42,33,4,2,p.ink);
    R(41,22,6,10,p.glass); R(41,22,6,1,p.glassHi);
    R(41,26,6,6,p.fluid); R(41,26,6,1,'#c8d6da');
    R(42,29,4,1,p.steelDeep); R(43,33,2,2,p.fluid);
    R(46,34,1,9,p.steelDark); R(46,42,3,1,p.steelDark);
  }

  function bedFrame(R,p,x0) {
    /* Testiera cromata sulla parete, telaio, sponde laterali, traversa dei
     * piedi: la stessa carpenteria per i due letti. */
    R(x0,30,32,14,p.ink);
    R(x0+1,31,30,12,p.steel);
    R(x0+1,31,30,2,p.steelDark); R(x0+2,31,28,1,p.steelHi);
    R(x0+5,33,3,9,p.steelHi); R(x0+5,33,1,9,p.steelLite);
    R(x0+11,33,3,9,p.steelHi); R(x0+11,33,1,9,p.steelLite);
    R(x0+17,33,3,9,p.steelHi); R(x0+17,33,1,9,p.steelLite);
    R(x0+23,33,3,9,p.steelHi); R(x0+23,33,1,9,p.steelLite);
    R(x0+1,41,30,2,p.steelDark);
    R(x0,42,32,54,p.ink);
    R(x0+1,43,30,52,p.steelDeep);
  }

  function bedRails(R,p,x0) {
    R(x0,50,4,34,p.steelDark); R(x0+1,51,2,32,p.steel); R(x0+1,51,1,32,p.steelHi);
    R(x0+28,50,4,34,p.steelDark); R(x0+29,51,2,32,p.steel); R(x0+29,51,1,32,p.steelHi);
    R(x0,86,32,5,p.steelDark); R(x0+1,86,30,1,p.steelHi);
    R(x0+1,90,30,1,p.steelDeep);
    R(x0+2,91,4,4,p.ink); R(x0+26,91,4,4,p.ink);
  }

  function bedChart(R,p,x0) {
    R(x0+10,87,14,9,p.steelDeep);
    R(x0+11,88,12,7,p.paper);
    R(x0+11,88,12,1,p.paperHi);
    R(x0+12,90,10,1,p.paperDark);
    R(x0+12,92,7,1,p.paperDark);
    R(x0+12,94,9,1,p.paperDark);
    R(x0+15,86,4,2,p.steelLite);
  }

  function drawRonetteBed(R,p) {
    /* Il letto di Ronette e' il piano piu' chiaro della stanza: lenzuola
     * ivory in quattro valori, un solo risvolto, tre pieghe. La figura fa
     * parte dell'arredo: testa sul cuscino verso il muro, viso verso la
     * stanza, una mano posata sul risvolto. */
    bedFrame(R,p,48);
    R(51,43,26,43,p.sheetDark);

    R(51,43,26,15,p.sheetHi);
    R(51,43,26,1,p.sheetWhite);
    R(52,50,4,1,p.sheetMid); R(73,52,3,1,p.sheetMid);
    R(51,57,26,1,p.sheetMid);

    /* Capelli scuri: massa ovale a gradini, mai un caschetto rettangolare.
     * Tre righe di cuscino restano visibili sopra la testa, cosi' la
     * testiera non le si appoggia addosso come un cappello. */
    R(59,46,12,1,p.hairDeep);
    R(58,47,14,1,p.hairDeep);
    R(57,48,16,11,p.hair);
    R(57,48,1,11,p.hairDeep); R(72,48,1,11,p.hairDeep);
    R(58,59,14,1,p.hair);
    R(58,60,4,3,p.hair); R(68,60,4,3,p.hair);
    R(58,60,1,3,p.hairDeep); R(71,60,1,3,p.hairDeep);
    R(59,50,1,8,p.hairHi); R(70,50,1,8,p.hairHi);

    /* Viso verso la stanza: incarnato pallido di corsia, l'unica nota calda
     * della scena insieme alla mano. Sopracciglia nel valore medio dei
     * capelli: nel nero leggeva come una smorfia. */
    R(60,50,10,9,p.skinHi);
    R(60,57,10,1,p.skin);
    R(61,58,8,1,p.skinDark);
    R(60,58,1,1,p.hair); R(69,58,1,1,p.hair);
    R(59,48,12,1,p.hairDeep); R(60,49,10,1,p.hairDeep);
    R(62,50,3,1,p.hairDeep); R(66,50,3,1,p.hairDeep);
    R(61,52,3,1,p.hair); R(66,52,3,1,p.hair);
    R(62,54,2,1,p.ink); R(66,54,2,1,p.ink);
    R(64,56,1,1,p.skinDark);
    R(63,57,2,1,p.lip);
    R(61,59,8,3,p.gownDark); R(62,59,6,1,p.gown);

    R(51,62,26,6,p.sheetWhite);
    R(51,67,26,1,p.sheetMid);
    R(51,68,26,18,p.sheet);
    R(55,68,18,16,p.sheetHi);
    R(57,73,11,1,p.sheetMid); R(58,74,9,1,p.sheetHi);
    R(59,79,12,1,p.sheetMid); R(60,80,10,1,p.sheetHi);
    R(55,83,12,1,p.sheetMid); R(56,84,10,1,p.sheetHi);

    /* Una mano posata sul risvolto: piccola, in ombra sul bordo. */
    R(67,62,7,4,p.gown); R(67,62,7,1,p.gownHi); R(67,65,7,1,p.gownDark);
    R(69,66,5,1,p.skin);
    R(68,67,7,3,p.skin);
    R(69,70,5,1,p.skin);
    R(68,67,7,1,p.skinHi);
    R(69,70,5,1,p.skinDark);
    R(70,68,1,2,p.skinDark); R(72,68,1,2,p.skinDark);

    bedRails(R,p,48);
    bedChart(R,p,48);
  }

  function drawGerardBed(R,p) {
    /* Identico per carpenteria, un gradino piu' spento nelle lenzuola e
     * senza figura: legge secondo, mezzo coperto dalla tenda. */
    bedFrame(R,p,144);
    R(147,44,26,42,p.gSheetDark);
    R(147,44,26,14,p.gSheetHi);
    R(147,44,26,1,'#e4e8e4');
    R(151,48,14,1,p.gSheetMid); R(152,49,12,1,p.gSheetHi);
    R(149,53,8,1,p.gSheetMid); R(165,51,5,1,p.gSheetMid);
    R(147,57,26,1,p.gSheetMid);
    R(147,62,26,6,p.gSheetHi);
    R(147,67,26,1,p.gSheetMid);
    R(147,68,26,18,p.gSheet);
    R(151,68,18,16,p.gSheetHi);
    R(153,73,11,1,p.gSheetMid); R(154,74,9,1,p.gSheetHi);
    R(155,79,12,1,p.gSheetMid); R(156,80,10,1,p.gSheetHi);
    R(151,83,12,1,p.gSheetMid); R(152,84,10,1,p.gSheetHi);
    bedRails(R,p,144);
    bedChart(R,p,144);
  }

  /* La tenda e' un trapezio: raccolta sul binario, larga sull'orlo. Le
   * pieghe restano verticali (pendono da ganci fissi) mentre i bordi si
   * allargano di un pixel per fascia: e' lo scalino dei bordi, non un
   * contorno, a farla leggere come stoffa invece che come colonna. */
  /* La tenda e' costruita per colonne, non per rettangoli: ogni colonna ha
   * il proprio valore (nastro chiaro, nastro medio, riga scura = piega) e il
   * proprio orlo. I bordi ondeggiano di un pixel per fascia, l'orlo scende a
   * quote diverse e il telo scavalca la sponda ovest del letto di Gerard:
   * e' la sovrapposizione, piu' dell'ombra, a dire che e' stoffa davanti a
   * un letto e non una colonna scanalata fra due letti. */
  var CURTAIN_COLS = 'DccHcDccHccDccHccDccHD';
  var CURTAIN_X0 = 129;
  var CURTAIN_KEY = { D:'curtainDark', c:'curtain', H:'curtainHi' };
  var CURTAIN_BANDS = [[9,12,132,147],[21,14,131,148],[35,16,132,147],
                       [51,16,130,149],[67,16,129,150]];
  var CURTAIN_HEM = [91,92,93,94,95,95,95,95,94,95,95,
                     95,94,95,95,94,93,94,93,92,91,90];

  function curtainColor(p,x) {
    var i = x - CURTAIN_X0;
    if (i < 0 || i >= CURTAIN_COLS.length) return p.curtainDark;
    return p[CURTAIN_KEY[CURTAIN_COLS.charAt(i)]];
  }

  function drawCurtain(R,p) {
    var b,band,x,start,color,cur,bottom;
    for (b=0;b<CURTAIN_BANDS.length;b++) {
      band=CURTAIN_BANDS[b];
      start=band[2]; color=curtainColor(p,start);
      for (x=band[2]+1;x<=band[3]+1;x++) {
        cur = x<=band[3] ? curtainColor(p,x) : null;
        if (cur===color) continue;
        R(start,band[0],x-start,band[1],color);
        start=x; color=cur;
      }
    }
    /* Orlo: ogni colonna finisce alla sua quota, con un pixel piu' scuro
     * come peso della stoffa. */
    for (x=CURTAIN_X0;x<CURTAIN_X0+CURTAIN_COLS.length;x++) {
      bottom=CURTAIN_HEM[x-CURTAIN_X0];
      R(x,83,1,bottom-82,curtainColor(p,x));
      R(x,bottom,1,1,'#5f747f');
    }
    /* Testa raccolta: gli anelli stringono la stoffa sotto il binario. */
    R(132,9,16,2,p.curtainDark); R(133,9,14,1,p.curtainHi);
    R(133,11,1,5,p.curtainDark); R(137,11,1,5,p.curtainDark);
    R(141,11,1,5,p.curtainDark); R(145,11,1,5,p.curtainDark);
    /* Prese di stoffa a quote diverse: rompono la verticale. */
    R(134,29,4,1,p.curtainDark); R(142,46,5,1,p.curtainDark);
    R(131,61,4,1,p.curtainDark); R(144,72,4,1,p.curtainDark);
    R(136,78,3,1,p.curtainDark);
    /* Due pieghe si spengono a mezza altezza: una scanalatura non lo fa. */
    R(134,21,1,14,p.curtain); R(140,67,1,16,p.curtain);
  }

  function drawChair(R,p) {
    /* Unica sedia d'attesa contro la parete ovest: telaio cromato a vista,
     * imbottitura blu-grigia spenta, mai un accento saturo. Montanti e gambe
     * lasciano passare il pavimento: e' cio' che la fa leggere come sedia. */
    R(18,88,2,14,p.steelDark); R(18,88,1,14,p.steelHi);
    R(28,88,2,14,p.steelDark); R(28,88,1,14,p.steelHi);
    R(19,89,10,11,p.chairDeep);
    R(20,90,8,9,p.chairBlue);
    R(20,90,8,1,p.chairHi);
    R(20,95,8,1,p.chairDeep);
    R(17,101,15,3,p.chairDeep);
    R(18,101,13,2,p.chairBlue);
    R(18,101,13,1,p.chairHi);
    R(17,104,15,2,p.ink);
    R(18,106,2,6,p.steelDark); R(18,106,1,5,p.steelHi);
    R(29,106,2,6,p.steelDark); R(29,106,1,5,p.steelHi);
    R(19,109,11,1,p.steelDeep);
  }

  function drawNurseCounter(R,p) {
    /* Piano di lavoro dell'infermiera: acciaio basso, un raccoglitore in
     * piedi, il registro aperto sulla cella 13,8 e una cartella. */
    R(195,104,14,15,p.ink);
    R(196,105,12,13,p.binder); R(196,105,12,1,p.binderHi);
    R(204,105,2,13,p.binderDeep); R(197,108,4,1,p.paperHi);

    R(210,110,16,9,p.steelDeep);
    R(211,111,14,7,p.paper); R(211,111,14,1,p.paperHi);
    R(217,111,1,7,p.paperDark);
    R(212,113,4,1,p.paperDark); R(212,115,4,1,p.paperDark);
    R(219,113,5,1,p.paperDark); R(219,115,4,1,p.paperDark);

    R(227,108,12,11,p.steelDark);
    R(228,109,10,9,p.paper); R(228,109,10,1,p.paperHi);
    R(230,107,6,2,p.steelLite);
    R(229,112,7,1,p.paperDark); R(229,114,5,1,p.paperDark);
    R(229,116,7,1,p.paperDark);

    R(192,118,48,26,p.ink);
    R(192,118,48,7,p.steelHi); R(193,118,46,1,p.steelLite);
    R(192,124,48,2,p.steelDark);
    R(193,126,46,17,p.steelDark);
    R(195,128,20,12,p.steel); R(217,128,20,12,p.steel);
    R(195,128,20,1,p.steelHi); R(217,128,20,1,p.steelHi);
    R(200,133,10,1,p.steelLite); R(222,133,10,1,p.steelLite);
    R(193,141,46,2,p.steelDeep);
    R(194,141,4,3,p.ink); R(233,141,4,3,p.ink);
  }

  function drawProp(R,prop,p) {
    if (prop.id === 'monitorStand') drawMonitorStand(R,p);
    else if (prop.id === 'ronetteBed') drawRonetteBed(R,p);
    else if (prop.id === 'gerardBed') drawGerardBed(R,p);
    else if (prop.id === 'curtain') drawCurtain(R,p);
    else if (prop.id === 'chair') drawChair(R,p);
    else if (prop.id === 'nurseCounter') drawNurseCounter(R,p);
  }

  function draw(ctx,cx,cy) {
    var R=rectPainter(ctx,cx,cy), i;
    drawArchitecture(R,palette);
    for (i=0;i<definitions.length;i++) drawShadow(R,definitions[i],palette);
    drawPlayerContact(R,palette);
    for (i=0;i<definitions.length;i++) drawProp(R,definitions[i],palette);
  }

  /* Gli intervalli del motore sono intervalli di piede-attore. Ridisegniamo
   * solo l'arredo corrispondente; le ombre di contatto restano nel ground
   * pass e non coprono mai gli attori. */
  function foreground(ctx,cx,cy,minFoot,maxFoot) {
    minFoot = minFoot == null ? -Infinity : minFoot;
    maxFoot = maxFoot == null ? Infinity : maxFoot;
    var R=rectPainter(ctx,cx,cy), i, prop;
    for (i=0;i<definitions.length;i++) {
      prop=definitions[i];
      if (prop.footY < minFoot || prop.footY >= maxFoot) continue;
      drawProp(R,prop,palette);
    }
    if (DOOR_FOOT >= minFoot && DOOR_FOOT < maxFoot) drawDoorFrame(R,palette);
  }

  GAME.HospitalArt = {
    draw: draw,
    foreground: foreground,
    definitions: definitions,
    props: definitions,
    palette: palette,
    doorFoot: DOOR_FOOT
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.HospitalArt;
})();
