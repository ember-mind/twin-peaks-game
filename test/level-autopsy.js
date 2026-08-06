// Autopsia 2A — città reale 56x36 di Twin Peaks. Nessuna modifica alla mappa.
// Uso: node test/level-autopsy.js  (dalla root del progetto)
// Suite di validatori read-only (fase 2A del percorso Level Design). NON modifica la mappa.
// Emette: raggiungibilità/sacche, costi orientati d'approccio, carico strade, backtrack tax
// per atto, periodicità props (CV), densità, interferenze nei gusci d'interazione.
global.window = global; require('../js/maps.js');
const T = GAME.maps.maps.town;
const rows = T.rows, H = rows.length, W = rows[0].length;
console.log('DIMENSIONI:', W+'x'+H, rows.every(r=>r.length===W)?'(uniforme)':'!! RIGHE DISALLINEATE');

const SOLID = GAME.maps.SOLID;
const isSolid = (x,y)=> (x<0||y<0||y>=H||x>=W) ? true : !!SOLID[rows[y][x]];
const DIRS = {up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};

// ---- layer census
const counts = {};
rows.forEach(r=>[...r].forEach(c=>counts[c]=(counts[c]||0)+1));
// props semantici urbani (legenda): L lampione P palo B panchina A aiuola H idrante E cassetta n cespuglio F staccionata
const PROP_CHARS = {L:'lampione',P:'palo',B:'panchina',A:'aiuola',H:'idrante',E:'cassetta',n:'cespuglio',F:'staccionata'};
const props = [];
rows.forEach((r,y)=>[...r].forEach((c,x)=>{ if(PROP_CHARS[c]) props.push({c,x,y,type:PROP_CHARS[c]}); }));
console.log('\nPROPS SEMANTICI:', props.length);
const byType={}; props.forEach(p=>byType[p.type]=(byType[p.type]||0)+1);
console.log('  per tipo:', Object.entries(byType).map(([k,v])=>k+':'+v).join(' '));

// ---- interattivi
const interact = T.interact||{}; const doors = T.doors||{}; const gate = T.gate;
console.log('\nESAMINABILI (interact):', Object.entries(interact).map(([k,v])=>k+'='+v).join(' '));
console.log('PORTE:', Object.keys(doors).length, '+ gate woods a', gate.x+','+gate.y);
Object.entries(doors).forEach(([k,d])=>console.log('  ',k,'->',d.to, d.needsFlag?('[needs '+d.needsFlag+']'):''));

// ---- BFS classico
function bfs(sx,sy,blocked){ const bl=new Set((blocked||[]).map(p=>p.join(',')));
  const d={[sx+','+sy]:0}, q=[[sx,sy]];
  while(q.length){ const [x,y]=q.shift(); for(const k in DIRS){ const [dx,dy]=DIRS[k]; const nx=x+dx,ny=y+dy,K=nx+','+ny;
    if(!isSolid(nx,ny)&&!bl.has(K)&&!(K in d)){ d[K]=d[x+','+y]+1; q.push([nx,ny]); } } } return d; }
// BFS orientato (per costi reali)
function bfsO(sx,sy,sh){ const d={[sx+','+sy+','+(sh||'up')]:0}, q=[[sx,sy,sh||'up']];
  while(q.length){ const [x,y,h]=q.shift(), c=d[x+','+y+','+h];
    for(const k in DIRS){ const t=x+','+y+','+k; if(!(t in d)){ d[t]=c+1; q.push([x,y,k]); }
      const [dx,dy]=DIRS[k], nx=x+dx,ny=y+dy; if(!isSolid(nx,ny)){ const K=nx+','+ny+','+k; if(!(K in d)){ d[K]=c+1; q.push([nx,ny,k]); } } } }
  return d; }
const front=(d,tx,ty)=>{ let b=Infinity; for(const k in DIRS){ const [dx,dy]=DIRS[k]; const K=(tx-dx)+','+(ty-dy)+','+k; if(K in d && d[K]<b) b=d[K]; } return b; };

// C2 raggiungibilità globale
const spawnTown = {x:12,y:21}; // arrivo da woods gate landing / start near sheriff — usiamo il landing town più usato
// in realtà lo spawn di partita è town via woods (gate landing 14,20 in woods); l'ingresso town è dal woods gate.
// Usiamo come origine il tile davanti alla porta sceriffo dove il gioco riporta più volte (12,21).
const reach = bfs(spawnTown.x, spawnTown.y);
let walk=0, seen=0; rows.forEach((r,y)=>[...r].forEach((c,x)=>{ if(!isSolid(x,y)){ walk++; if((x+','+y) in reach) seen++; } }));
console.log('\nC2 RAGGIUNGIBILITÀ da',spawnTown.x+','+spawnTown.y,': calpestabili',walk,'raggiunti',seen, walk===seen?'(nessuna sacca)':('!! '+(walk-seen)+' TILE ISOLATI'));

// porte + esaminabili raggiungibili?
console.log('\nC3/C4 approcci:');
const targets = { ...Object.fromEntries(Object.entries(doors).map(([k,d])=>['porta '+k+'->'+d.to, k.split(',').map(Number)])),
                  ...Object.fromEntries(Object.entries(interact).map(([k,v])=>['esam '+v, k.split(',').map(Number)])) };
const o0 = bfsO(spawnTown.x, spawnTown.y, 'up');
for(const [lab,[x,y]] of Object.entries(targets)){
  const fc = front(o0, x, y);
  console.log('  ', lab.padEnd(26), fc===Infinity?'!! nessun approccio raggiungibile':('costo orientato '+fc));
}

// C6 carico strade: percorsi obbligatori dei 5 atti (sequenze di porte del town)
// Landing tiles nel town per ciascun edificio (dove il giocatore RIENTRA nel town), da doors[].tx/ty dei ritorni:
const townLanding = { sheriff:[12,21], diner:[42,21], palmer:[42,7], hospital:[23,7], hotel:[9,7], roadhouse:[47,29], traincar:[54,14], woods:[50,1] };
const townDoorTile = { sheriff:[12,20], diner:[42,20], palmer:[42,6], hospital:[23,6], hotel:[9,6], roadhouse:[47,28], traincar:[55,14], woods:[50,0] };
// beat obbligatori per atto (approssimati dalla cascata objectives, solo tappe DENTRO il town):
const acts = {
  'A1 (start)':      ['sheriff'],
  'A2 (sogno)':      ['hospital','diner','hotel','sheriff'],
  'A3 (vagone)':     ['traincar','sheriff'],
  'A4 (roadhouse)':  ['roadhouse','sheriff'],
  'A5 (palmer+lago)':['palmer','sheriff','woods']
};
// carico per arco (coppia di tile adiacenti) sommando i percorsi orientati fra landing consecutivi
const load = {};
function pathTiles(ax,ay,bx,by){ // ricostruzione shortest path classico
  const d=bfs(ax,ay); if(!((bx+','+by) in d)) return null;
  // backtrack
  let cur=[bx,by], path=[cur];
  while(!(cur[0]===ax&&cur[1]===ay)){ const cd=d[cur[0]+','+cur[1]]; let nx=null;
    for(const k in DIRS){ const [dx,dy]=DIRS[k]; const px=cur[0]+dx, py=cur[1]+dy; if((px+','+py) in d && d[px+','+py]===cd-1){ nx=[px,py]; break; } }
    if(!nx) break; path.push(nx); cur=nx; }
  return path;
}
const actCost = {};
for(const [an,seq] of Object.entries(acts)){
  let cur = townLanding.sheriff; if(an==='A1 (start)') cur = spawnTown && [spawnTown.x,spawnTown.y];
  let tot=0, prev=[spawnTown.x,spawnTown.y];
  for(const b of seq){ const doorT = townDoorTile[b]; const p = pathTiles(prev[0],prev[1], doorT[0],doorT[1]);
    if(!p){ tot=Infinity; break; }
    tot += p.length-1;
    for(let i=0;i<p.length-1;i++){ const a=p[i].join(','), c=p[i+1].join(','); const key=[a,c].sort().join('|'); load[key]=(load[key]||0)+1; }
    prev = townLanding[b]; }
  actCost[an]=tot;
}
console.log('\nC5 costo obbligatorio di traversata per atto (tile, percorso più breve fra le porte):');
for(const [a,c] of Object.entries(actCost)) console.log('  ', a.padEnd(18), c);

// C6 archi più caricati
const loadArr = Object.entries(load).sort((a,b)=>b[1]-a[1]);
console.log('\nC6 archi stradali più caricati (compaiono in N percorsi d\'atto):');
loadArr.slice(0,6).forEach(([e,n])=>console.log('  ', e, '=', n));
const usedTiles = new Set(); Object.keys(load).forEach(e=>e.split('|').forEach(t=>usedTiles.add(t)));
// tile strada mai usati
let roadTiles=0, roadUsed=0; rows.forEach((r,y)=>[...r].forEach((c,x)=>{ if(c==='r'||c==='p'){ roadTiles++; if(usedTiles.has(x+','+y)) roadUsed++; } }));
console.log('  tile strada/sentiero:', roadTiles, '| toccati dai percorsi obbligatori:', roadUsed, '| mai usati:', roadTiles-roadUsed);

// C8 periodicità props: run collineari equispaziati + CV per tipo
console.log('\nC8 periodicità props:');
for(const [type,] of Object.entries(byType)){
  const pts = props.filter(p=>p.type===type);
  // per riga: sequenze equispaziate
  const byRow={}; pts.forEach(p=>{ (byRow[p.y]=byRow[p.y]||[]).push(p.x); });
  let periodicRuns=[];
  for(const [y,xs] of Object.entries(byRow)){ xs.sort((a,b)=>a-b);
    for(let i=0;i<xs.length-2;i++){ const d1=xs[i+1]-xs[i], d2=xs[i+2]-xs[i+1]; if(d1===d2 && d1<=14){ periodicRuns.push({y:+y,x0:xs[i],step:d1}); } } }
  // CV globale nearest-neighbor
  const nn = pts.map(p=>{ let m=Infinity; pts.forEach(q=>{ if(q!==p){ const d=Math.abs(q.x-p.x)+Math.abs(q.y-p.y); if(d<m)m=d; } }); return m; }).filter(v=>isFinite(v));
  const mean = nn.reduce((a,b)=>a+b,0)/(nn.length||1);
  const sd = Math.sqrt(nn.reduce((a,b)=>a+(b-mean)**2,0)/(nn.length||1));
  const cv = mean? (sd/mean):0;
  console.log('  ', type.padEnd(11), 'n='+pts.length, 'CV='+cv.toFixed(2), cv<0.25&&pts.length>=4?'⚠ meccanico':'', periodicRuns.length?('| run equispaziati: '+periodicRuns.map(r=>'y'+r.y+' step'+r.step).join(', ')):'');
}

// C11 interferenze: props solidi che occupano l'approccio (Manhattan 1) di una porta/esaminabile
console.log('\nC11 interferenze (prop solido nel guscio d\'approccio):');
const critical = [...Object.keys(doors).map(k=>k.split(',').map(Number)), ...Object.keys(interact).map(k=>k.split(',').map(Number))];
let hits=0;
for(const [x,y] of critical){ for(const k in DIRS){ const [dx,dy]=DIRS[k], nx=x+dx, ny=y+dy;
  if(nx>=0&&ny>=0&&ny<H&&nx<W && PROP_CHARS[rows[ny][nx]] && SOLID[rows[ny][nx]]){ console.log('  prop',rows[ny][nx],'a',nx+','+ny,'adiacente a',x+','+y); hits++; } } }
if(!hits) console.log('  nessuna (le porte hanno approccio libero)');

// tile isolato
console.log('\n--- TILE ISOLATO ---');
rows.forEach((r,y)=>[...r].forEach((c,x)=>{ if(!isSolid(x,y) && !((x+','+y) in reach)) console.log('  ', x+','+y, 'char='+JSON.stringify(c)); }));

// interferenza lago: 15,28 esaminabile, approcci
console.log('\n--- APPROCCI ESAMINABILE lago_riva 15,28 ---');
for(const k in DIRS){ const [dx,dy]=DIRS[k]; const nx=15+dx, ny=28+dy; console.log('  ',k,'->',nx+','+ny, 'char='+JSON.stringify(rows[ny][nx]), isSolid(nx,ny)?'SOLIDO':'libero'); }

// C7 backtrack tax: per atto, frazione di archi già percorsi ripetuti
console.log('\nC7 backtrack tax per atto (archi ripercorsi / archi totali del percorso obbligato):');
for(const [an,seq] of Object.entries(acts)){
  let prev=[spawnTown.x,spawnTown.y]; const seenArcs=new Set(); let total=0, repeat=0;
  for(const b of seq){ const p=pathTiles(prev[0],prev[1],townDoorTile[b][0],townDoorTile[b][1]); if(!p)break;
    for(let i=0;i<p.length-1;i++){ const key=[p[i].join(','),p[i+1].join(',')].sort().join('|'); total++; if(seenArcs.has(key))repeat++; else seenArcs.add(key); }
    prev=townLanding[b]; }
  console.log('  ', an.padEnd(18), total?('tax '+(100*repeat/total).toFixed(0)+'%  ('+repeat+'/'+total+' archi)'):'-');
}

// densità props in finestre 8x8
console.log('\nC9 densità props (finestre 8x8, non-vuote):');
let dmin=99,dmax=0,cellCount=0,dsum=0;
for(let y=0;y<H-8;y+=8){ for(let x=0;x<W-8;x+=8){ let n=0; for(const p of props){ if(p.x>=x&&p.x<x+8&&p.y>=y&&p.y<y+8) n++; } if(n>0){ dmin=Math.min(dmin,n); dmax=Math.max(dmax,n); dsum+=n; cellCount++; } } }
console.log('  celle non-vuote:', cellCount, '| min', dmin, 'max', dmax, 'media', (dsum/cellCount).toFixed(1));

// densità esaminabili vs props: rapporto segnale/rumore
console.log('\nSEGNALE/RUMORE: esaminabili', Object.keys(interact).length, 'vs props solidi che sembrano oggetti', props.filter(p=>SOLID[p.c]).length);
