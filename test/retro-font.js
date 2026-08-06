#!/usr/bin/env node
'use strict';
const assert=require('node:assert');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');global.GAME={};require(path.join(root,'js','data.js'));const RF=require(path.join(root,'js','retro-font.js'));
const engine=fs.readFileSync(path.join(root,'js','engine.js'),'utf8');const ui=fs.readFileSync(path.join(root,'js','retro-ui.js'),'utf8');const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
let passed=0;function ok(value,name){assert(value,name);passed++;console.log('ok - '+name);}
ok(!/fillText|measureText|strokeText/.test(engine),'engine senza CanvasText antialias');
ok(!/fillText|measureText|strokeText/.test(ui),'UI narrativa senza CanvasText antialias');
ok(index.indexOf('js/retro-font.js')>=0&&index.indexOf('js/retro-font.js')<index.indexOf('js/engine.js'),'font condiviso caricato prima del motore');
ok(/RF\.draw\(ctx/.test(engine)&&/RF\.draw\(ctx2/.test(ui),'motore e UI usano stesso helper');
ok(RF.clean('Harry')==='Harry'&&RF.FONT.a&&RF.FONT.z,'minuscole Gen II preservate e disegnabili');
ok(RF.measure('iiii',1)<RF.measure('WWWW',1),'metriche bitmap proporzionali');
ok(RF.measure('TWIN PEAKS',2)<=128,'titolo bitmap entra nella targa GBC');
const wrapped=GAME.Data.endText.flatMap(line=>RF.wrapChars(line,23));
ok(wrapped.every(line=>line.length<=23),'epilogo massimo 23 caratteri per riga GBC');
ok(Math.ceil(wrapped.length/5)>=2,'epilogo paginato massimo 5 righe');
const ops=[],ctx={fillStyle:'',fillRect(x,y,w,h){ops.push({x,y,w,h});}};const drawn=RF.draw(ctx,'TWIN PEAKS',80,20,'#183225',{scale:2,align:'center'});
ok(drawn.x>=4&&drawn.x+drawn.width<=155&&ops.every(o=>Number.isInteger(o.x)&&Number.isInteger(o.y)&&Number.isInteger(o.w)&&Number.isInteger(o.h)),'glyph interi nei limiti GBC x=4..155');
ok(/text\('IL CERCHIO'.*15/.test(engine)&&/text\('SI CHIUDE'.*31/.test(engine)&&
  /'PAG\. '.*106/.test(engine)&&/'INDIZI '.*106/.test(engine),'ancore pixel finale GBC separate e stabili');
console.log('\nRETRO-FONT-PASS '+passed+'/'+passed);
