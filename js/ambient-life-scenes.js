/* Ambient registrations use world pixels and existing furniture depth anchors. */
(function(root){
  'use strict';
  var life=root.GAME.AmbientLife;
  // Same pixel mask as the existing large R tube; reusable renderer receives geometry only.
  var tubes=[];
  ['...RRRRRR..','..RR....RR.','..RR....RR.','..RR...RR..','..RRRRRR...','..RR.RR....','.RR...RR...','.RR....RR..','RR......RR.'].forEach(function(row,y){
    for(var x=0;x<row.length;x++)if(row[x]==='R')tubes.push({x:43+x,y:5+y*2,w:2,h:2});
  });
  life.register('diner',[
    {id:'counter-coffee',type:'STEAM_SMALL',x:69,y:45,depth:64,variants:3,duration:[1200,1360]},
    {id:'counter-cup-steam',type:'STEAM_SMALL',x:113,y:47,depth:64,variants:3,duration:[1800,1800]},
    {id:'booth-coffee',type:'STEAM_SMALL',x:40,y:99,depth:112,variants:3,duration:[1320,1480],intensity:.85},
    {id:'pendant-west',type:'LIGHT_WARM_VARIATION',duration:[1200,1600],x:37,y:5,depth:0,regions:[{x:31,y:19,w:8,h:1,depth:0},{x:42,y:47,w:12,h:1,depth:64}]},
    {id:'pendant-middle',type:'LIGHT_WARM_VARIATION',duration:[1200,1600],x:67,y:5,depth:0,regions:[{x:61,y:19,w:8,h:1,depth:0},{x:85,y:48,w:10,h:1,depth:64}]},
    {id:'pendant-east',type:'LIGHT_WARM_VARIATION',duration:[1200,1600],x:187,y:5,depth:0,regions:[{x:180,y:19,w:8,h:1,depth:0},{x:159,y:47,w:10,h:1,depth:64}]},
    {id:'double-r-neon',type:'LIGHT_NEON',duration:[700,850],x:72,y:-13,depth:0,variants:3,tubes:tubes,segments:[{x:46,y:7,w:7,h:2},{x:6,y:7,w:4,h:6},{x:46,y:13,w:6,h:2}],regions:[{x:79,y:13,w:52,h:2,depth:0}]},
    {id:'coffee-machine',type:'MACHINE_IDLE_ACTIVITY',x:35,y:31,depth:64,variants:2,
      delay:[6500,12500],duration:[1100,1500],intensity:1.45,marks:[
      [{x:11,y:4,w:3,h:3,color:'#e9bd5d'},{x:5,y:7,w:2,h:3,color:'#906744'}],
      [{x:11,y:4,w:3,h:3,color:'#d9dfc9'},{x:5,y:6,w:3,h:4,color:'#906744'},{x:6,y:6,w:1,h:3,color:'#e9bd5d'}]]},
    {id:'wall-clock',type:'CLOCK_TICK',x:195,y:-4,depth:0,startSeconds:10800,
      initialHands:[0,0,3],face:[[0,-3,1,4],[0,0,3,1]],palette:{face:'#f4e6c8',hand:'#292b26',second:'#b88759'}},
    {id:'pie-glass',type:'GLASS_SUBTLE_REFLECTION',x:133,y:35,depth:64,variants:2,travel:32}
  ]);
  /* Sheriff's station. One continuous behavior so the room is never fully
   * still, plus four intermittent ones. Every mark covers a whole authored
   * shape and paints AGAINST its substrate — dark on lit glass, bright on dark
   * steel. Light-on-light and single-pixel marks read as nothing in play. */
  life.register('sheriff',[
    /* Desk mug (106,49 in sheriffs-station-art.js drawSheriffDesk): the only
     * continuous element in the station. Rises into clear wall above the desk. */
    {id:'mug-steam',type:'STEAM_SMALL',x:109,y:48,depth:80,variants:3,
      duration:[1250,1500],intensity:1.6},
    /* wallRadio: the whole 2x2 lamp blinks, plus a bar on the dark grille where
     * amber has real contrast. intensity lifts the 0.38 archetype ceiling. */
    {id:'dispatch-radio',type:'MACHINE_IDLE_ACTIVITY',x:195,y:36,depth:0,variants:2,
      intensity:2.4,delay:[2500,5000],duration:[900,1400],marks:[
      [{x:0,y:0,w:2,h:2,color:'#ffe18a'},{x:-7,y:2,w:3,h:1,color:'#ffe18a'}],
      [{x:0,y:0,w:2,h:2,color:'#ffe18a'},{x:0,y:4,w:2,h:1,color:'#e9f2ec'}]]},
    /* rearFrostedDoor: a DARK shape crossing the lit frosted panel reads as
     * someone working in the back room. The warm-variation archetype already
     * paints a dark block plus dimmed regions, which is exactly that. */
    {id:'rear-door-presence',type:'LIGHT_WARM_VARIATION',x:222,y:14,depth:0,
      delay:[3000,7000],duration:[900,1600],intensity:.95,
      regions:[{x:215,y:12,w:14,h:18,depth:0}]},
    /* fluorescentFixture west tube only; the east tube never dips. */
    {id:'fluorescent-west',type:'MACHINE_IDLE_ACTIVITY',x:32,y:9,depth:0,variants:2,
      intensity:1.4,delay:[4000,9000],duration:[900,1400],marks:[
      [{x:0,y:0,w:34,h:2,color:'#536164'}],
      [{x:0,y:0,w:18,h:2,color:'#536164'},{x:2,y:0,w:30,h:1,color:'#394548'}]]},
    /* sheriffDesk task lamp: authored diffuser block on the shade, regions over
     * the stepped pool already painted on the desktop. */
    {id:'sheriff-desk-lamp',type:'LIGHT_WARM_VARIATION',x:152,y:42,depth:80,
      delay:[3500,8000],duration:[900,1500],intensity:.9,regions:[
      {x:136,y:55,w:22,h:4,depth:80},{x:141,y:56,w:17,h:4,depth:80},
      {x:148,y:57,w:10,h:3,depth:80}]}
  ]);
  /* Roadhouse: same deterministic clocks and existing archetypes as diner.
   * Anchors are authored world pixels; marks sit on visible fixtures rather
   * than inventing free-floating light. */
  life.register('roadhouse',[
    {id:'roadhouse-neon',type:'LIGHT_NEON',duration:[620,840],x:18,y:15,depth:0,variants:3,
      tubes:[
        {x:0,y:14,w:64,h:2},{x:4,y:17,w:52,h:4},{x:0,y:26,w:66,h:2},
        {x:10,y:9,w:4,h:3},{x:18,y:5,w:4,h:4},{x:26,y:9,w:4,h:3},
        {x:34,y:5,w:4,h:4},{x:42,y:9,w:4,h:3}
      ],regions:[{x:13,y:10,w:76,h:35,depth:0}]},
    {id:'table-candle-west',type:'LIGHT_WARM_VARIATION',x:95,y:67,depth:80,
      delay:[2600,6200],duration:[700,1100],intensity:.75,
      regions:[{x:82,y:66,w:30,h:10,depth:80}]},
    {id:'table-candle-middle',type:'LIGHT_WARM_VARIATION',x:155,y:89,depth:112,
      delay:[2800,6800],duration:[680,1080],intensity:.72,
      regions:[{x:142,y:88,w:30,h:10,depth:112}]},
    {id:'table-candle-south',type:'LIGHT_WARM_VARIATION',x:107,y:116,depth:144,
      delay:[2500,6500],duration:[720,1140],intensity:.72,
      regions:[{x:94,y:115,w:30,h:10,depth:144}]},
    {id:'jukebox-cycle',type:'MACHINE_IDLE_ACTIVITY',x:218,y:115,depth:160,variants:2,
      delay:[1800,4200],duration:[900,1300],intensity:1.2,marks:[
        [{x:4,y:3,w:3,h:27,color:'#d64948'},{x:9,y:3,w:12,h:2,color:'#f4c568'}],
        [{x:20,y:3,w:3,h:27,color:'#d64948'},{x:7,y:7,w:14,h:2,color:'#ff7352'}]
      ]},
    {id:'cigarette-west',type:'STEAM_SMALL',x:55,y:93,depth:112,variants:3,
      duration:[1280,1460],intensity:.72},
    {id:'cigarette-east',type:'STEAM_SMALL',x:193,y:133,depth:144,variants:3,
      duration:[1360,1540],intensity:.62}
  ]);
  /* Great Northern: three authored flame silhouettes, a warm chandelier,
   * one restrained transaction lamp, and a small glint moving only over the
   * brass service bell. Anchors follow the 20x12 native lobby plan: hearth
   * west, open runner centre, staffed counter east, stairs at far right.
   *
   * The four practicals share a deliberate three-state cadence: a long quiet
   * hold, a 2.4--3.0s warm rise/hold, then a clean settle before the next
   * source changes. Fixed 7.2s fire, 9.8s desk, 13.2s chandelier and 19.6s
   * bell rests make the first 25s read as a calm handoff between sources,
   * without turning the lobby into a flashing effect. */
  /* Great Northern lobby. Four practicals, four independent clocks.
   *
   * The E8 temporal unit failed its critic twice ("stone, chairs, floor,
   * chandelier and desk receivers do not breathe enough"; "desk/counter and
   * bell remain too static"). The cause was the duty cycle, not the regions:
   * every item was active for ~2.5s out of every 12-20s, so at any sampled
   * moment the room was almost always at rest. Here each source is active
   * roughly 70% of the time at a much lower intensity, and the five-frame
   * ramp ends at zero, so a cycle closing is a fade, never a cut. The cycle
   * lengths (5000, 7400, 7600, 6200 ms) share no small common multiple and
   * firstDelay offsets them, so nothing lands in lockstep.
   *
   * Every region also has to land on a pixel the archetype can actually
   * change. LIGHT_WARM_VARIATION dims with #69462d, and the lobby's oak
   * floor and counter carcass are #70482f — seven RGB apart, so a region on
   * bare oak paints nothing visible however long it runs. That, not the
   * region list, is why the E8 desk round showed no PNG-proven change. Every
   * region below sits on stone, stoneHi, gold, cream, wallLight or the red
   * runner and rug.
   *
   * Region depth is the depth of the SURFACE the light falls on, so light
   * sorts exactly like the material it sits on: stone and mantel at the
   * fireplace foot (80), the chair at the lounge foot (112), floor, rug,
   * runner, beam and cubbies at 0 (behind every body), counter and lamp at
   * the reception foot (148). No region overlaps Ben's cell (12,7 =
   * x192..208) or Audrey's (15,9 = x240..256); the runner and floor regions
   * lie under Cooper's route at depth 0, which is where a floor reflection
   * belongs. */
  life.register('hotel_gn',[
    {id:'lobby-fire',type:'MACHINE_IDLE_ACTIVITY',x:52,y:50,depth:80,variants:3,
      firstDelay:[600,600],delay:[2600,2600],duration:[2400,2400],intensity:1.45,marks:[
        [{x:-2,y:7,w:6,h:10,color:'#d77b37'},{x:5,y:1,w:6,h:16,color:'#e9c582'},{x:12,y:6,w:6,h:11,color:'#ffe7a6'},{x:20,y:10,w:5,h:7,color:'#d77b37'},
          {x:-20,y:-7,w:48,h:2,color:'#b5864c'},{x:-16,y:27,w:36,h:2,color:'#d77b37'},
          {x:14,y:39,w:9,h:3,color:'#d77b37'},{x:46,y:39,w:9,h:3,color:'#d77b37'},{x:4,y:67,w:48,h:2,color:'#b5864c'}],
        [{x:0,y:4,w:5,h:14,color:'#d77b37'},{x:7,y:0,w:6,h:17,color:'#e9c582'},{x:15,y:7,w:5,h:10,color:'#ffe7a6'},{x:22,y:3,w:4,h:14,color:'#d77b37'},
          {x:-19,y:-6,w:44,h:2,color:'#b5864c'},{x:-14,y:27,w:32,h:2,color:'#d77b37'},
          {x:15,y:38,w:8,h:3,color:'#d77b37'},{x:47,y:38,w:8,h:3,color:'#d77b37'},{x:3,y:66,w:50,h:2,color:'#b5864c'}],
        [{x:-1,y:2,w:5,h:16,color:'#e9c582'},{x:6,y:7,w:6,h:11,color:'#d77b37'},{x:14,y:1,w:6,h:17,color:'#ffe7a6'},{x:23,y:8,w:5,h:9,color:'#e9c582'},
          {x:-21,y:-8,w:50,h:2,color:'#b5864c'},{x:-17,y:26,w:38,h:2,color:'#d77b37'},
          {x:13,y:40,w:10,h:3,color:'#d77b37'},{x:45,y:40,w:10,h:3,color:'#d77b37'},{x:5,y:68,w:46,h:2,color:'#b5864c'}]
      ]},
    /* Fire light on the material around it: four stone courses, the mantel
     * and the sill, the near chair, the bare plank under the hearth and the
     * lounge rug. Anchor sits in the firebox, so its own dimmer reads as the
     * fire settling. */
    {id:'lobby-hearth-glow',type:'LIGHT_WARM_VARIATION',x:64,y:60,depth:80,
      firstDelay:[900,900],delay:[2600,2600],duration:[4800,4800],intensity:.55,
      regions:[{x:30,y:29,w:6,h:2,depth:80},{x:56,y:39,w:7,h:2,depth:80},
        {x:82,y:29,w:6,h:2,depth:80},{x:34,y:49,w:6,h:2,depth:80},
        {x:40,y:44,w:12,h:1,depth:80},{x:76,y:44,w:12,h:1,depth:80},
        {x:44,y:78,w:12,h:2,depth:80},{x:72,y:78,w:12,h:2,depth:80},
        {x:68,y:93,w:8,h:2,depth:112},{x:69,y:103,w:6,h:2,depth:112},
        {x:50,y:87,w:12,h:2,depth:0},{x:90,y:87,w:12,h:2,depth:0},
        {x:52,y:95,w:10,h:2,depth:0},{x:96,y:99,w:10,h:2,depth:0},
        {x:60,y:131,w:12,h:2,depth:0}]},
    /* Chandelier: its own four lamps, the ceiling beam directly under it, and
     * three steps down the runner. The two wide runner bands of the E8 build
     * (36x2 and 48x2) are trimmed: a receiver is a few pixels, not a stripe.
     * The two vertical edge regions moved from x138/x179 to x144/x172 when
     * the runner was tapered: at the north end the strip is now 36px wide,
     * not 48, and the old coordinates had fallen onto bare oak floor, where
     * this archetype's dim is invisible. */
    {id:'lobby-chandelier',type:'LIGHT_WARM_VARIATION',x:160,y:24,depth:28,
      firstDelay:[2100,2100],delay:[2200,2200],duration:[5400,5400],intensity:.5,
      regions:[{x:141,y:13,w:5,h:6,depth:28},{x:149,y:19,w:5,h:6,depth:28},
        {x:165,y:19,w:5,h:6,depth:28},{x:173,y:13,w:5,h:6,depth:28},
        {x:144,y:59,w:14,h:2,depth:0},{x:164,y:59,w:14,h:2,depth:0},
        {x:158,y:34,w:6,h:1,depth:0},{x:146,y:47,w:16,h:2,depth:0},
        {x:144,y:64,w:3,h:12,depth:0},{x:172,y:64,w:3,h:12,depth:0},
        {x:150,y:95,w:20,h:2,depth:0},{x:150,y:123,w:20,h:2,depth:0}]},
    /* Desk lamp: its own shade, two runs of the counter top and two of the
     * counter front, and four key cubbies behind it. Regions stop at x=192
     * and resume at x=208 so none of them lands on Ben's cell at 12,7. The
     * bell is deliberately absent: it is painted at x197..208, inside that
     * same cell, so no region can reach it without being repainted over
     * Ben's body. */
    {id:'lobby-desk-lamp',type:'LIGHT_WARM_VARIATION',x:229,y:119,depth:148,
      firstDelay:[1100,1100],delay:[2200,2200],duration:[4000,4000],intensity:.58,
      regions:[{x:226,y:113,w:7,h:3,depth:148},{x:225,y:122,w:9,h:2,depth:148},
        {x:178,y:124,w:14,h:3,depth:148},
        {x:208,y:124,w:11,h:3,depth:148},{x:219,y:124,w:11,h:3,depth:148},
        {x:230,y:124,w:10,h:3,depth:148},
        {x:181,y:132,w:11,h:1,depth:148},{x:219,y:132,w:15,h:1,depth:148},
        {x:225,y:112,w:9,h:1,depth:148},{x:212,y:144,w:14,h:1,depth:148},
        {x:228,y:144,w:10,h:1,depth:148},
        {x:218,y:90,w:6,h:4,depth:0},{x:231,y:90,w:6,h:4,depth:0},
        {x:218,y:100,w:6,h:4,depth:0},{x:231,y:110,w:6,h:2,depth:0}]}
  ]);
  /* Red Room uses the existing intermittent device archetype with three
   * authored column positions. Long holds make the curtains breathe slowly.
   * RedRoomScene converts archetype alpha to opaque palette coverage. */
  var curtainFrames=[-2,0,2].map(function(shift){
    var marks=[];
    for(var x=32;x<224;x+=48){
      marks.push({x:x,y:6,w:8,h:26,color:'#a62932'});
      marks.push({x:x+2+shift,y:6,w:2,h:26,color:'#541824'});
    }
    return marks;
  });
  life.register('redroom',[
    {id:'curtain-sway',type:'MACHINE_IDLE_ACTIVITY',x:0,y:0,depth:0,variants:3,
      delay:[2800,4200],duration:[9000,12000],intensity:3,marks:curtainFrames},
    {id:'redroom-table-lamp',type:'LIGHT_WARM_VARIATION',x:55,y:19,depth:48,
      delay:[7000,12000],duration:[1600,2400],intensity:.7,
      regions:[{x:51,y:38,w:10,h:1,depth:48}]},
    {id:'redroom-torchiere-west',type:'LIGHT_WARM_VARIATION',x:12,y:42,depth:80,
      delay:[10000,16000],duration:[2000,3000],intensity:.5,
      regions:[{x:8,y:43,w:9,h:1,depth:80}]},
    {id:'redroom-torchiere-east',type:'LIGHT_WARM_VARIATION',x:244,y:42,depth:80,
      delay:[12000,19000],duration:[1800,2800],intensity:.5,
      regions:[{x:240,y:43,w:9,h:1,depth:80}]}
  ]);
  var reactions=root.GAME.EnvironmentReactions;
  if(reactions)reactions.register('diner',[{id:'front-door',trigger:'ENTITY_ENTERED_DOORWAY',
    arrivalKey:'6,8',fromMapId:'town',x:96,y:144,depth:160,frames:reactions.doorEntryFrames,
    palette:{frame:'#35271f',void:'#17251e',threshold:'#81918b',red:'#8c2f3e',edge:'#501f29',gold:'#e9bd5d',glass:'#f4e6c8'}}]);

})(typeof window!=='undefined'?window:globalThis);
