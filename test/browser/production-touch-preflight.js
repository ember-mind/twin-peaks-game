'use strict';
// Actual index.html and CDP touch events only. Not a full mobile campaign,
// physical-device test, rotation test or accessibility certification.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {openPlayableBrowser}=require('../lib/playable-browser');
const {PAD,pointFor,assertLayout,stepCandidate}=require('../lib/touch-preflight');
const ROOT=path.resolve(__dirname,'../..');
const pause=(ms)=>new Promise(r=>setTimeout(r,ms));
function idle(s){return s.mode==='play'&&!s.player.moving&&!s.fadePhase&&!s.dialogue&&!s.menu&&!s.narrativeActive&&!s.semanticUi.notebook;}
async function run(name,width,height,output){
  let b,error=null;const checks=[];
  try{
    b=await openPlayableBrowser({root:ROOT,outputDir:output,width,height,mobile:true,noSandbox:process.env.CHROME_NO_SANDBOX==='1'});
    async function tap(label,direction){
      const s=await b.waitFor('visible control '+label,v=>(v.touchControls||[]).some(c=>c.visible&&c.label===label));
      assertLayout(s,width,height);await b.tap(...pointFor(s,label,direction));await pause(200);
    }
    const initial=await b.waitFor('fresh mobile title',s=>s.mode==='title'&&(s.touchControls||[]).some(c=>c.visible&&c.label==='Nuova partita'));
    assert.equal(initial.testMode,false);assert.deepEqual(initial.clues,[]);assert.ok(!initial.flags.sogno_fatto);
    assertLayout(initial,width,height);await b.capture('title-touch-controls');
    await tap('Nuova partita');
    for(let i=0;i<80;i++){
      const s=await b.snapshot();if(idle(s))break;
      assert.ok(!s.semanticUi.recovery,'No save-recovery screen in a fresh profile');
      assert.ok(s.mode==='intro'||s.mode==='play','A New Game touch does not skip to a later mode');
      const before=s.dialogue?{kind:'dialogue',id:s.dialogue.id,i:s.dialogue.i}:{kind:'intro',i:s.introPage};
      await tap(s.dialogue?'Avanza dialogo':'Continua');
      const after=await b.snapshot();
      if(before.kind==='intro'&&after.mode==='intro')assert.equal(after.introPage,before.i+1,'One touch advances exactly one intro page');
      if(before.kind==='dialogue'&&after.dialogue&&after.dialogue.id===before.id)assert.equal(after.dialogue.i,before.i+1,'One touch advances exactly one dialogue page');
    }
    const playing=await b.waitFor('touch-only opening reaches idle play',idle);assertLayout(playing,width,height);
    checks.push('touch-new-game-and-single-page-advance');await b.capture('touch-opening');
    const step=stepCandidate(playing),start=[playing.player.tx,playing.player.ty];
    await tap(PAD,step.dir);
    const turned=await b.waitFor('touch turn remains in place',s=>idle(s)&&s.player.dir===step.dir);
    assert.deepEqual([turned.player.tx,turned.player.ty],start,'Short touch faces without overshooting');
    await tap(PAD,step.dir);
    const moved=await b.waitFor('second touch moves exactly one tile',s=>idle(s)&&s.player.tx===step.x&&s.player.ty===step.y);
    await pause(350);const released=await b.snapshot();
    assert.deepEqual([released.player.tx,released.player.ty],[moved.player.tx,moved.player.ty],'Touch release leaves no held direction');
    checks.push('touch-turn-step-and-release');
    await tap('Apri fascicolo indizi');
    let menu=await b.waitFor('actual touch notebook or classic casebook opens',s=>s.semanticUi.notebook||s.menu);
    if(menu.semanticUi.notebook){
      for(let i=0;i<20;i++){
        menu=await b.snapshot();if((menu.semanticUi.notebookClose||[]).some(c=>c.focused))break;
        await tap(PAD,'down');
      }
      assert.ok((await b.snapshot()).semanticUi.notebookClose.some(c=>c.focused),'Reach the real notebook Close option');
      await tap('Conferma scelta');
    }else await tap('Chiudi fascicolo indizi');
    const closed=await b.waitFor('close notebook returns control',idle);assertLayout(closed,width,height);
    assert.deepEqual(closed.clues,playing.clues,'Touch UI test does not manufacture evidence');
    assert.deepEqual([closed.player.tx,closed.player.ty],[step.x,step.y],'Navigating the notebook does not move Cooper');
    checks.push('touch-notebook-open-close');await b.capture('touch-ready');
  }catch(e){error=String(e.stack||e);process.exitCode=1;if(b)try{await b.capture('touch-failure');}catch(_){}console.error(error);}
  finally{
    if(b){
      try{await b.close();}catch(e){error=(error||'')+'\nCleanup: '+e.message;process.exitCode=1;}
      const session=await fs.readFile(path.join(output,'session.json'),'utf8').then(JSON.parse).catch(()=>null);
      const faults=session?session.faults.filter(f=>!(f.type==='http'&&f.status===404&&new URL(f.url).pathname==='/favicon.ico')):[];
      const inputs=session?session.events.filter(e=>e.type==='press'||e.type==='tap'):[];
      if(!session||faults.length||!inputs.length||inputs.some(e=>e.type!=='tap'||e.pointer!=='touch')){error=error||'Missing evidence, browser faults or non-touch input';process.exitCode=1;}
      const report={name,width,height,status:error?'FAIL':'PASS',source:session&&session.metadata.source,checks,error,faults,
        inputCount:inputs.length,fullMobileCampaign:'NOT_RUN',physicalDevice:'NOT_RUN',rotation:'NOT_RUN',humanPlaytest:'NOT_RUN'};
      await fs.writeFile(path.join(output,'touch.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
      console.log('PRODUCTION-TOUCH '+name+' '+report.status);
    }
  }
}
async function main(){
  const root=path.resolve(process.env.TOUCH_PREFLIGHT_OUT||path.join(ROOT,'artifacts','playable-touch',String(Date.now())));
  await run('portrait',390,844,path.join(root,'portrait'));
  await run('landscape',844,390,path.join(root,'landscape'));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
