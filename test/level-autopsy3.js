global.window=global; require('../js/maps.js');
const T=GAME.maps.maps.town, rows=T.rows, H=rows.length, W=rows[0].length;
const SOLID=GAME.maps.SOLID, isSolid=(x,y)=>(x<0||y<0||y>=H||x>=W)?true:!!SOLID[rows[y][x]];
const DIRS={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const doorTile={sheriff:[12,20],diner:[42,20],palmer:[42,6],hospital:[23,6],hotel:[9,6],roadhouse:[47,28],traincar:[55,14],woods:[50,0]};
const landing={sheriff:[12,21],diner:[42,21],palmer:[42,7],hospital:[23,7],hotel:[9,7],roadhouse:[47,29],traincar:[54,14],woods:[50,1]};
const spawn=[12,21];
function bfsO(sx,sy,sh){const d={[sx+','+sy+','+(sh||'up')]:0},q=[[sx,sy,sh||'up']];
  while(q.length){const [x,y,h]=q.shift(),c=d[x+','+y+','+h];
   for(const k in DIRS){const t=x+','+y+','+k;if(!(t in d)){d[t]=c+1;q.push([x,y,k]);}
    const [dx,dy]=DIRS[k],nx=x+dx,ny=y+dy;if(!isSolid(nx,ny)){const K=nx+','+ny+','+k;if(!(K in d)){d[K]=c+1;q.push([nx,ny,k]);}}}}return d;}
function frontState(d,tx,ty){let b=Infinity,st=null;for(const k in DIRS){const [dx,dy]=DIRS[k];const K=(tx-dx)+','+(ty-dy)+','+k;if(K in d&&d[K]<b){b=d[K];st=[tx-dx,ty-dy,k];}}return{c:b,st};}
// costo orientato porta->porta (arrivo facing verso la porta, ripartenza da landing)
function doorCost(fromLanding, toDoor){ const d=bfsO(fromLanding[0],fromLanding[1],'up'); return frontState(d,toDoor[0],toDoor[1]).c; }

// 2. Permutazioni A2 (hotel/hospital/diner ordine libero)
console.log('2. PERMUTAZIONI A2 (ordine libero hotel/hospital/diner, costo orientato in azioni):');
const perms=[['hotel','hospital','diner'],['hotel','diner','hospital'],['hospital','hotel','diner'],['hospital','diner','hotel'],['diner','hotel','hospital'],['diner','hospital','hotel']];
let costs=[];
for(const seq of perms){ let cur=spawn, tot=0;
  for(const b of seq){ tot+=doorCost(cur,doorTile[b]); cur=landing[b]; }
  tot+=doorCost(cur,doorTile.sheriff); // ritorno sceriffo
  costs.push({seq:seq.join('>'),tot}); }
costs.sort((a,b)=>a.tot-b.tot);
costs.forEach(c=>console.log('  ',c.seq.padEnd(24),c.tot));
const mn=costs[0].tot,mx=costs[costs.length-1].tot;
console.log('  min',mn,'max',mx,'spread',((mx-mn)/mn*100).toFixed(0)+'%', (mx-mn)/mn>0.4?'!! il layout prescrive un ordine che il testo non dichiara':'(ordine davvero libero)');

// 3. Grafo compresso: articulation nodes, bridges, dead ends
console.log('\n3. GRAFO COMPRESSO (dead-end e strozzature):');
// dead end = tile calpestabile con 1 solo vicino calpestabile
let deadEnds=[];
for(let y=0;y<H;y++)for(let x=0;x<W;x++){ if(isSolid(x,y))continue; let n=0; for(const k in DIRS){const [dx,dy]=DIRS[k];if(!isSolid(x+dx,y+dy))n++;} if(n===1)deadEnds.push([x,y]); }
console.log('  dead-end (vicoli ciechi a 1 uscita):',deadEnds.length, deadEnds.slice(0,10).map(p=>p.join(',')).join(' '));
// strozzature: tile la cui rimozione disconnette (articulation, campionato sui tile a 2 vicini opposti)
function reachCount(block){ const bl=new Set(block.map(p=>p.join(','))); let sx,sy; outer:for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!isSolid(x,y)&&!bl.has(x+','+y)){sx=x;sy=y;break outer;}}
  const seen=new Set([sx+','+sy]),q=[[sx,sy]]; while(q.length){const [x,y]=q.shift();for(const k in DIRS){const [dx,dy]=DIRS[k],nx=x+dx,ny=y+dy,K=nx+','+ny;if(!isSolid(nx,ny)&&!bl.has(K)&&!seen.has(K)){seen.add(K);q.push([nx,ny]);}}} return seen.size; }
const baseReach=reachCount([]);
let artic=[];
// campiona i tile "corridoio" (2 vicini) — candidati articulation
for(let y=0;y<H;y++)for(let x=0;x<W;x++){ if(isSolid(x,y))continue; let n=0;for(const k in DIRS){const [dx,dy]=DIRS[k];if(!isSolid(x+dx,y+dy))n++;} if(n===2){ if(reachCount([[x,y]])<baseReach-1){ artic.push([x,y]); } } }
console.log('  strozzature (articulation, la cui rimozione isola >1 tile):',artic.length, artic.slice(0,12).map(p=>p.join(',')).join(' '));

// 4. Stati d'approccio Palmer e woods
console.log('\n4. STATI D\'APPROCCIO Palmer(42,6) e woods gate(50,0):');
const npcTown=[[25,16],[44,10],[16,25]]; // bobby(wander), donna(wander), jacoby
for(const [b,[x,y]] of [['palmer',doorTile.palmer],['woods',doorTile.woods]]){
  // |A_d| = tile calpestabili adiacenti (approcci fisici) + facing
  const appr=[]; for(const k in DIRS){const [dx,dy]=DIRS[k],nx=x+dx,ny=y+dy;if(!isSolid(nx,ny))appr.push([nx,ny,k]);}
  const d=bfsO(spawn[0],spawn[1],'up'); const fs=frontState(d,x,y);
  const npcRisk=appr.some(a=>npcTown.some(n=>n[0]===a[0]&&n[1]===a[1]));
  console.log('  ',b.padEnd(8),'|A_d| approcci fisici:',appr.length, appr.map(a=>a[0]+','+a[1]).join(' '),'| costo correttivo dallo stato ottimo:',0,'| NPC può occupare:',npcRisk?'SI':'no');
}
console.log('  Nota: bobby(25,16) e donna(44,10) wander; donna e\' a 4 tile da palmer(42,6): possibile occupazione transitoria dell\'approccio in A5. jacoby(16,25) fisso, lontano.');

// 5. Cluster dei 60 tile task-dormant con near-shortest d* + max(4, 10%)
console.log('\n5. CLUSTER DEI TILE DORMIENTI (fuori da ogni percorso minimo, verifica near-shortest):');
function dijkstra(sx,sy,pref){const D={},key=(x,y)=>x+','+y;D[key(sx,sy)]=0;const pq=[[0,sx,sy]];
  while(pq.length){pq.sort((a,b)=>a[0]-b[0]);const [d,x,y]=pq.shift();if(d>D[key(x,y)])continue;
   for(const k in DIRS){const [dx,dy]=DIRS[k],nx=x+dx,ny=y+dy;if(isSolid(nx,ny))continue;const c=(pref?((rows[ny][nx]==='r'||rows[ny][nx]==='p'||rows[ny][nx]==='='||rows[ny][nx]==='-')?1:4):1);const nd=d+c;if(nd<(D[key(nx,ny)]??Infinity)){D[key(nx,ny)]=nd;pq.push([nd,nx,ny]);}}}return D;}
function nearShortestTiles(sx,sy,tx,ty,slack){const Df=dijkstra(sx,sy,false),Db=dijkstra(tx,ty,false);const tot=Df[tx+','+ty];if(tot===undefined)return new Set();const on=new Set();const budget=tot+Math.max(4,Math.ceil(0.1*tot));
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(isSolid(x,y))continue;const a=Df[x+','+y],b=Db[x+','+y];if(a!==undefined&&b!==undefined&&a+b<=budget)on.add(x+','+y);}return on;}
const acts={A1:['sheriff'],A2:['hospital','diner','hotel','sheriff'],A3:['traincar','sheriff'],A4:['roadhouse','sheriff'],A5:['palmer','sheriff','woods']};
const examin={cartello:[30,30],lago_riva:[15,28],tomba_laura:[50,22]};
const nearUsed=new Set();
for(const seq of Object.values(acts)){let prev=spawn;for(const b of seq){nearShortestTiles(prev[0],prev[1],doorTile[b][0],doorTile[b][1]).forEach(t=>nearUsed.add(t));prev=landing[b];}}
for(const [n,[x,y]] of Object.entries(examin)){nearShortestTiles(spawn[0],spawn[1],x,y).forEach(t=>nearUsed.add(t));}
const roadTiles=[];rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c==='r'||c==='p'||c==='='||c==='-')roadTiles.push([x,y]);}));
const dormant=roadTiles.filter(([x,y])=>!nearUsed.has(x+','+y));
// clusterizza per componente connessa
const dormSet=new Set(dormant.map(p=>p.join(','))); const seenC=new Set(); const clusters=[];
for(const [x,y] of dormant){ if(seenC.has(x+','+y))continue; const cl=[]; const q=[[x,y]]; seenC.add(x+','+y);
  while(q.length){const [cx,cy]=q.shift();cl.push([cx,cy]);for(const k in DIRS){const [dx,dy]=DIRS[k],nx=cx+dx,ny=cy+dy,K=nx+','+ny;if(dormSet.has(K)&&!seenC.has(K)){seenC.add(K);q.push([nx,ny]);}}} clusters.push(cl); }
clusters.sort((a,b)=>b.length-a.length);
console.log('  tile dormienti (fuori da near-shortest, slack d*+max(4,10%)):',dormant.length,'in',clusters.length,'cluster');
clusters.slice(0,8).forEach((cl,i)=>{const xs=cl.map(p=>p[0]),ys=cl.map(p=>p[1]);console.log('   cluster',i,'size',cl.length,'bbox x['+Math.min(...xs)+'-'+Math.max(...xs)+'] y['+Math.min(...ys)+'-'+Math.max(...ys)+']');});
