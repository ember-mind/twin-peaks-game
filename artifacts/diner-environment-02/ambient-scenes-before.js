/* Ambient registrations use world pixels and existing furniture depth anchors. */
(function(root){
  'use strict';
  var life=root.GAME.AmbientLife;
  life.register('diner',[
    {id:'counter-coffee',type:'STEAM_SMALL',x:69,y:45,depth:64,variants:3,duration:[1200,1360]},
    {id:'booth-coffee',type:'STEAM_SMALL',x:40,y:99,depth:112,variants:3,duration:[1320,1480],intensity:.85},
    {id:'pendant-west',type:'LIGHT_WARM_VARIATION',x:37,y:5,depth:0,regions:[{x:31,y:19,w:8,h:1,depth:0},{x:42,y:47,w:12,h:1,depth:64}]},
    {id:'pendant-middle',type:'LIGHT_WARM_VARIATION',x:67,y:5,depth:0,regions:[{x:61,y:19,w:8,h:1,depth:0},{x:85,y:48,w:10,h:1,depth:64}]},
    {id:'pendant-east',type:'LIGHT_WARM_VARIATION',x:187,y:5,depth:0,regions:[{x:180,y:19,w:8,h:1,depth:0},{x:159,y:47,w:10,h:1,depth:64}]},
    {id:'double-r-neon',type:'LIGHT_NEON',x:72,y:-13,depth:0,variants:3,segments:[{x:45,y:7,w:2,h:2},{x:7,y:10,w:1,h:2},{x:39,y:8,w:2,h:1}],regions:[{x:86,y:14,w:12,h:1,depth:0}]},
    {id:'pie-glass',type:'GLASS_SUBTLE_REFLECTION',x:139,y:36,depth:64,variants:2}
  ]);
})(typeof window!=='undefined'?window:globalThis);
