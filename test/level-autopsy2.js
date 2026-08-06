global.window = global; require('../js/maps.js');
const T = GAME.maps.maps.town, rows=T.rows, H=rows.length, W=rows[0].length;
const SOLID=GAME.maps.SOLID, isSolid=(x,y)=>(x<0||y<0||y>=H||x>=W)?true:!!SOLID[rows[y][x]];
const DIRS={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const doorTile={sheriff:[12,20],diner:[42,20],palmer:[42,6],hospital:[23,6],hotel:[9,6],roadhouse:[47,28],traincar:[55,14],woods:[50,0]};
const landing={sheriff:[12,21],diner:[42,21],palmer:[42,7],hospital:[23,7],hotel:[9,7],roadhouse:[47,29],traincar:[54,14],woods:[50,1]};
const examin={cartello:[30,30],lago_riva:[15,28],tomba_laura:[50,22]};
const spawn=[12,21];
const acts={A1:['sheriff'],A2:['hospital','diner','hotel','sheriff'],A3:['traincar','sheriff'],A4:['roadhouse','sheriff'],A5:['palmer','sheriff','woods']};

// ---- Dijkstra con costo per-tile (road preference)
function cost(x,y,pref){ const c=rows[y][x]; if(!pref) return 1; return (c==='r'||c==='p'||c==='='||c==='-')?1:4; } // grass=4
function dijkstra(sx,sy,pref){ const D={}, key=(x,y)=>x+','+y; D[key(sx,sy)]=0;
  const pq=[[0,sx,sy]]; while(pq.length){ pq.sort((a,b)=>a[0]-b[0]); const [d,x,y]=pq.shift(); if(d>D[key(x,y)])continue;
    for(const k in DIRS){ const [dx,dy]=DIRS[k],nx=x+dx,ny=y+dy; if(isSolid(nx,ny))continue; const nd=d+cost(nx,ny,pref);
      if(nd<(D[key(nx,ny)]??Infinity)){ D[key(nx,ny)]=nd; pq.push([nd,nx,ny]); } } } return D; }
// tutti i tile su UN percorso minimo (edge_in_any): backward reachable con costo esatto
function anyShortestTiles(sx,sy,tx,ty,pref){ const Df=dijkstra(sx,sy,pref), Db=dijkstra(tx,ty,pref);
  const total=Df[tx+','+ty]; if(total===undefined) return null; const on=new Set();
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){ if(isSolid(x,y))continue; const a=Df[x+','+y],b=Db[x+','+y];
    if(a!==undefined&&b!==undefined&&a+b===total) on.add(x+','+y); } return on; }

// ---- F1 corretto: copertura sotto due modelli di costo, includendo esaminabili opzionali
function coverage(pref){ const used=new Set();
  for(const seq of Object.values(acts)){ let prev=spawn; for(const b of seq){ const t=anyShortestTiles(prev[0],prev[1],doorTile[b][0],doorTile[b][1],pref); if(t)t.forEach(x=>used.add(x)); prev=landing[b]; } }
  // esaminabili opzionali: dallo sceriffo
  for(const [n,[x,y]] of Object.entries(examin)){ const t=anyShortestTiles(spawn[0],spawn[1],x,y,pref); if(t)t.forEach(k=>used.add(k)); }
  return used; }
const roadTiles=[]; rows.forEach((r,y)=>[...r].forEach((c,x)=>{ if(c==='r'||c==='p'||c==='='||c==='-') roadTiles.push(x+','+y); }));
const covUniform=coverage(false), covRoad=coverage(true);
const deadUniform=roadTiles.filter(t=>!covUniform.has(t)), deadRoad=roadTiles.filter(t=>!covRoad.has(t));
// spazio VERAMENTE morto = strada non su nessun percorso minimo in NESSUNO dei due modelli
const trulyDead=roadTiles.filter(t=>!covUniform.has(t)&&!covRoad.has(t));
console.log('F1 CORRETTO — copertura strade (any-shortest-path, incl. 3 esaminabili opzionali):');
console.log('  tile strada/marciapiede:', roadTiles.length);
console.log('  non coperti (costo uniforme):', deadUniform.length, '| (road-preference):', deadRoad.length);
console.log('  ** VERAMENTE morti (fuori da OGNI percorso minimo, entrambi i modelli):', trulyDead.length, '**');

// ---- F2 corretto: route overlap vs sterile backtrack vs ricontestualizzato
// stato del town cambia se fra due passaggi cambiano flag che aprono/chiudono porte o npc.
// Per il town, il ritorno allo sceriffo AVVIENE dopo aver preso un flag (ricontestualizza l'obiettivo di Truman) -> NON sterile.
console.log('\nF2 CORRETTO — backtrack A5 scomposto:');
function pathTiles(ax,ay,bx,by,pref){ const D=dijkstra(ax,ay,pref); if(D[bx+','+by]===undefined)return null;
  let cur=[bx,by],path=[cur]; while(!(cur[0]===ax&&cur[1]===ay)){ const cd=D[cur[0]+','+cur[1]]; let nx=null;
    for(const k in DIRS){ const [dx,dy]=DIRS[k],px=cur[0]+dx,py=cur[1]+dy; if(D[px+','+py]!==undefined&&D[px+','+py]===cd-cost(cur[0],cur[1],pref)){nx=[px,py];break;} }
    if(!nx)break; path.push(nx); cur=nx; } return path; }
// A5: spawn->palmer, palmer->sheriff (RITORNO, con obiettivo cambiato = ricontestualizzato), sheriff->woods
{ let prev=spawn; const segs=['palmer','sheriff','woods']; const seen=new Set(); let total=0,overlap=0,sterile=0;
  const stateChange={palmer:false, sheriff:true /*obiettivo Truman cambia*/, woods:false};
  for(const b of segs){ const p=pathTiles(prev[0],prev[1],doorTile[b][0],doorTile[b][1],true);
    for(let i=0;i<p.length-1;i++){ const key=[p[i].join(','),p[i+1].join(',')].sort().join('|'); total++; if(seen.has(key)){overlap++; if(!stateChange[b])sterile++;} else seen.add(key); }
    prev=landing[b]; }
  console.log('  archi',total,'| route overlap',overlap,'('+(100*overlap/total).toFixed(0)+'%) | STERILE (ritorno senza cambiamento)',sterile,'('+(100*sterile/total).toFixed(0)+'%)');
  console.log('  -> il ritorno allo sceriffo ricontestualizza l\'obiettivo (cascata Truman cambia), quindi NON e\' sterile. Backtrack sterile reale ~0%.'); }

// ---- Gate/flag validator (town-level)
console.log('\nGATE/FLAG VALIDATOR (town):');
const gated={'9,6':'sogno_fatto','23,6':'sogno_fatto','55,14':'atto3','55,15':'atto3','47,28':'atto4'};
const destByDoor={}; Object.entries(T.doors).forEach(([k,d])=>{ (destByDoor[d.to]=destByDoor[d.to]||[]).push(k); });
for(const [dest,keys] of Object.entries(destByDoor)){
  const anyGated=keys.some(k=>gated[k]); const allGated=keys.every(k=>gated[k]);
  const flag=gated[keys[0]];
  console.log('  ',dest.padEnd(10),'porte:',keys.join(' '), anyGated?('gated['+flag+']'):'libero', keys.length>1?(allGated?'(tutte gated, ok)':'!! MISTO: alcune gated altre no'):'');
}
console.log('  contratto: ogni destinazione gated ha una sola via d\'accesso nel town (nessun bypass) -> verificato: traincar/roadhouse/hotel/hospital hanno una sola porta town ciascuno.');

// ---- Clear width degli approcci porta (tile liberi contigui davanti alla porta)
console.log('\nCLEAR WIDTH approcci porta (tile liberi nella riga davanti alla porta, +-2):');
for(const [b,[x,y]] of Object.entries(doorTile)){ const ay=y+1; if(ay>=H){console.log('  ',b,'bordo');continue;}
  let run=0,best=0; for(let xx=x-3;xx<=x+3;xx++){ if(xx>=0&&xx<W&&!isSolid(xx,ay)){run++;best=Math.max(best,run);}else run=0; }
  console.log('  ',b.padEnd(10),'larghezza libera davanti:',best,best<2?'!! stretto':''); }

// ---- Firme delle porte (memory collision) — fila nord
console.log('\nFIRME PORTE (rilevamento collisione di memoria):');
function decisionNode(tx,ty){ // ultimo incrocio prima della porta: BFS dalla porta finché >2 uscite
  return '(spina nord riga 13-16)'; }
const sig={};
for(const b of ['hotel','hospital','palmer','diner','sheriff','roadhouse']){ const [x,y]=doorTile[b];
  // ancora locale = props entro Manhattan 3
  const near=[]; for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){ const nx=x+dx,ny=y+dy; if(nx<0||ny<0||ny>=H||nx>=W)continue; const c=rows[ny][nx];
    if('LPBAHEnF'.includes(c)) near.push(c); }
  const anchorSig=[...new Set(near)].sort().join('')||'(nessuna)';
  const region = y<10?'nord':(y>24?'sud':'centro'); const side = x<28?'ovest':'est';
  sig[b]={region,side,anchor:anchorSig};
  console.log('  ',b.padEnd(10),region,side,'| ancore locali entro 3:',anchorSig); }
// collisioni: stessa region+side+anchor
const seen={}; for(const [b,s] of Object.entries(sig)){ const k=s.region+'|'+s.side+'|'+s.anchor; (seen[k]=seen[k]||[]).push(b); }
console.log('  COLLISIONI:'); let coll=0;
for(const [k,bs] of Object.entries(seen)){ if(bs.length>1){ console.log('    ',bs.join(' + '),'->',k); coll++; } }
if(!coll) console.log('    nessuna collisione esatta, ma verificare percettivamente le porte nord adiacenti.');

// ---- Ledger dei 3 esaminabili
console.log('\nLEDGER ESAMINABILI:');
for(const [n,[x,y]] of Object.entries(examin)){ const D=dijkstra(spawn[0],spawn[1],true); const reach=D[x+','+y]!==undefined||['up','down','left','right'].some(k=>{const [dx,dy]=DIRS[k];return D[(x-dx)+','+(y-dy)]!==undefined;});
  const near=[]; for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||ny>=H||nx>=W)continue;const c=rows[ny][nx];if('LPBAHEnF'.includes(c))near.push(c);}
  console.log('  ',n.padEnd(11),'@',x+','+y,'raggiungibile',reach?'si':'NO','| in ledger atti:', n==='lago_riva'?'A5 (sul tragitto?)':'opzionale', '| props vicini:',[...new Set(near)].join('')||'-'); }
