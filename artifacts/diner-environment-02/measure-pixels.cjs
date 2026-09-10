const fs=require('fs'),crypto=require('crypto'),sharp=require('/opt/homebrew/lib/node_modules/coldstage/node_modules/sharp');
require(process.cwd()+'/js/ambient-life.js');require(process.cwd()+'/js/environment-reactions.js');GAME.AmbientLife.reset(1989);require(process.cwd()+'/js/ambient-life-scenes.js');
(async()=>{const root='artifacts/diner-environment-02',reports=[];
for(const [folder,step,eventTime] of [['minute-frames',100,2000],['door-frames',40,400]]){const files=fs.readdirSync(root+'/'+folder).filter(f=>f.endsWith('.png')).sort(),union=new Set(),allowed=new Set(),hashes=new Set();let base,w,last;
GAME.EnvironmentReactions.reset('diner');
for(let i=0;i<files.length;i++){const {data,info}=await sharp(root+'/'+folder+'/'+files[i]).removeAlpha().raw().toBuffer({resolveWithObject:true});w=info.width;if(!base)base=data;last=data;hashes.add(crypto.createHash('sha256').update(data).digest('hex'));for(let k=0;k<data.length;k+=3)if(data[k]!==base[k]||data[k+1]!==base[k+1]||data[k+2]!==base[k+2])union.add(k/3);
const ctx={globalAlpha:1,fillStyle:'',fillRect(x,y,ww,hh){for(let yy=y;yy<y+hh;yy++)for(let xx=x;xx<x+ww;xx++)allowed.add(yy*w+xx);}};
if(folder==='minute-frames'){GAME.AmbientLife.seek('diner',i*step);GAME.AmbientLife.draw(ctx,'diner',-16,-16);}
GAME.EnvironmentReactions.update(step,'diner');if(i*step===eventTime)GAME.EnvironmentReactions.handle({type:'ENTITY_ENTERED_DOORWAY',sceneId:'diner',arrivalKey:'6,8',fromMapId:'town'});GAME.EnvironmentReactions.draw(ctx,'diner',-16,-16);
}
reports.push({folder,frames:files.length,width:w,height:base.length/(w*3),distinctFrames:hashes.size,changedPixelUnion:union.size,outsideEffectRegions:[...union].filter(p=>!allowed.has(p)).length,firstLastIdentical:base.equals(last)});
}fs.writeFileSync(root+'/pixel-motion.json',JSON.stringify(reports,null,2));console.log(reports);})();
