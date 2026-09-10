const fs=require('fs'),vm=require('vm');const root='artifacts/diner-environment-02';
function make(old){const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(old?root+'/ambient-life-before.js':'js/ambient-life.js','utf8'),c);c.GAME.AmbientLife=c.GAME.AmbientLife.create(1989);vm.runInContext(fs.readFileSync(old?root+'/ambient-scenes-before.js':'js/ambient-life-scenes.js','utf8'),c);return c.GAME.AmbientLife;}
const now=make(false),before=make(true),ids=['counter-coffee','booth-coffee','pendant-west','pendant-middle','pendant-east','double-r-neon','pie-glass'];
const frames=[],events=new Map();let unchanged=true,machineActive=0;
for(let t=0;t<60000;t+=100){now.seek('diner',t);before.seek('diner',t);const s=now.snapshot('diner'),o=before.snapshot('diner');for(const id of ids)if(JSON.stringify(s.items.find(e=>e.id===id))!==JSON.stringify(o.items.find(e=>e.id===id)))unchanged=false;
const m=s.items.find(e=>e.id==='coffee-machine');if(m.active){machineActive+=100;events.set(m.start,{start:m.start,end:m.end,variant:m.variant});}frames.push(s);}
fs.writeFileSync(root+'/timeline.json',JSON.stringify({seed:1989,sampleMs:100,frames}));
fs.writeFileSync(root+'/behavior-summary.json',JSON.stringify({seed:1989,durationMs:60000,pass01SnapshotsIdentical:unchanged,machineActiveMs:machineActive,machineDuty:machineActive/60000,machineEvents:[...events.values()],clockSteps:[...new Set(frames.map(s=>s.items.find(e=>e.id==='wall-clock').second))],doorEventMs:2000},null,2));console.log('Pass01 exact',unchanged,'machine',machineActive,'ms',events.size,'events');
