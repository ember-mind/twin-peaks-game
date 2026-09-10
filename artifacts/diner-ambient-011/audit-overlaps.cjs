const fs=require('fs');const {create}=require(process.cwd()+'/js/ambient-life.js');
function make(seed){global.GAME={AmbientLife:create(seed)};delete require.cache[require.resolve(process.cwd()+'/js/ambient-life-scenes.js')];require(process.cwd()+'/js/ambient-life-scenes.js');return GAME.AmbientLife;}
const reports=[];
for(let seed of [1989,1,2,3,4,5,6,7,8,9,10,42,99,256,512,1024,4096,65535,123456,987654]){
 const a=make(seed);a.update(0,'diner');const events=[];let time=0;
 while(time<600000){const next=Math.min(...a.snapshot('diner').items.filter(e=>e.type!=='STEAM_SMALL').map(e=>e.next));if(next>600000)break;a.update(next-time,'diner');time=next;for(const e of a.snapshot('diner').items)if(e.type!=='STEAM_SMALL'&&e.start===time)events.push({id:e.id,start:e.start,end:e.end});}
 let pairs=0,triples=0;for(let i=0;i<events.length;i++){const near=events.slice(i+1).filter(e=>e.start-events[i].start<=150);pairs+=near.length;if(near.length>=2)triples++;}
 reports.push({seed,events:events.length,startsWithin150ms:pairs,tripleStartsWithin150ms:triples,neonLampOverlaps:events.filter(e=>e.id==='double-r-neon').filter(e=>events.some(l=>l.id.startsWith('pendant-')&&l.start<e.end&&l.end>e.start)).length});
}
fs.writeFileSync('artifacts/diner-ambient-011/overlap-audit.json',JSON.stringify({seedCount:reports.length,minutesPerSeed:10,windowMs:150,reports},null,2));console.log(reports);console.log('Totals',reports.reduce((r,e)=>({events:r.events+e.events,pairs:r.pairs+e.startsWithin150ms,triples:r.triples+e.tripleStartsWithin150ms}),{events:0,pairs:0,triples:0}));
