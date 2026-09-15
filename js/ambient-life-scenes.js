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
    {id:'booth-coffee',type:'STEAM_SMALL',x:40,y:99,depth:112,variants:3,duration:[1320,1480],intensity:.85},
    {id:'pendant-west',type:'LIGHT_WARM_VARIATION',duration:[1200,1600],x:37,y:5,depth:0,regions:[{x:31,y:19,w:8,h:1,depth:0},{x:42,y:47,w:12,h:1,depth:64}]},
    {id:'pendant-middle',type:'LIGHT_WARM_VARIATION',duration:[1200,1600],x:67,y:5,depth:0,regions:[{x:61,y:19,w:8,h:1,depth:0},{x:85,y:48,w:10,h:1,depth:64}]},
    {id:'pendant-east',type:'LIGHT_WARM_VARIATION',duration:[1200,1600],x:187,y:5,depth:0,regions:[{x:180,y:19,w:8,h:1,depth:0},{x:159,y:47,w:10,h:1,depth:64}]},
    {id:'double-r-neon',type:'LIGHT_NEON',duration:[700,850],x:72,y:-13,depth:0,variants:3,tubes:tubes,segments:[{x:46,y:7,w:7,h:2},{x:7,y:10,w:4,h:2},{x:46,y:13,w:6,h:2}],regions:[{x:79,y:13,w:52,h:2,depth:0}]},
    {id:'coffee-machine',type:'MACHINE_IDLE_ACTIVITY',x:35,y:31,depth:64,variants:2,marks:[
      [{x:12,y:5,color:'#e9bd5d'}],[{x:12,y:5,color:'#d9dfc9'},{x:12,y:6,color:'#e9bd5d'}]]},
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
   * and a small glint moving only over the brass service bell. */
  life.register('hotel_gn',[
    {id:'lobby-fire',type:'MACHINE_IDLE_ACTIVITY',x:134,y:57,depth:80,variants:3,
      delay:[160,300],duration:[600,850],intensity:2.4,marks:[
        [{x:2,y:4,w:3,h:7,color:'#d77b37'},{x:8,y:1,w:3,h:12,color:'#e9c582'},{x:9,y:5,w:2,h:8,color:'#ffe7a6'}],
        [{x:5,y:2,w:3,h:10,color:'#d77b37'},{x:13,y:3,w:3,h:10,color:'#e9c582'},{x:3,y:8,w:2,h:5,color:'#ffe7a6'}],
        [{x:3,y:1,w:3,h:12,color:'#e9c582'},{x:8,y:5,w:3,h:8,color:'#d77b37'},{x:14,y:6,w:2,h:7,color:'#ffe7a6'}]
      ]},
    {id:'lobby-chandelier',type:'LIGHT_WARM_VARIATION',x:144,y:33,depth:192,
      delay:[5000,10000],duration:[1400,2000],intensity:.55,
      regions:[{x:126,y:21,w:5,h:6,depth:192},{x:134,y:28,w:5,h:6,depth:192},
        {x:150,y:28,w:5,h:6,depth:192},{x:158,y:21,w:5,h:6,depth:192}]},
    {id:'lobby-bell',type:'GLASS_SUBTLE_REFLECTION',x:99,y:119,depth:144,variants:2,travel:1,
      delay:[9000,17000],duration:[1400,1900],intensity:.7}
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
