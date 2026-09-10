(function () {
  'use strict';
  if (typeof document === 'undefined' || typeof THREE === 'undefined') return;

  // Two lighting variants of one throwaway HD-2D cabin study, selected via ?variant=.
  var params = new URLSearchParams(location.search), capture = params.get('capture') === '1';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var variant = params.get('variant') === 'flat' ? 'flat' : 'hd2d';
  var frame = document.getElementById('frame'), title = document.getElementById('title'), state = document.getElementById('state');
  var scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-12.8, 12.8, 8, -8, .1, 80);
  camera.position.set(14, 12, 17); camera.lookAt(0, 2, 0);
  var renderer = new THREE.WebGLRenderer({antialias:true, alpha:false, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.03;
  frame.insertBefore(renderer.domElement, frame.firstChild);

  function canvasTexture(size, draw, rx, ry) {
    var c=document.createElement('canvas'), x=c.getContext('2d'); c.width=c.height=size; draw(x,size);
    var t=new THREE.CanvasTexture(c); t.magFilter=THREE.NearestFilter; t.minFilter=THREE.NearestMipmapNearestFilter;
    t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rx||1,ry||1); t.encoding=THREE.sRGBEncoding; return t;
  }
  function flecks(x,n,colors,size,max) { for(var i=0;i<n;i++){x.fillStyle=colors[i%colors.length];x.fillRect((i*47+i*i*3)%size,(i*29+i*i*7)%size,1+(i%max),1+(i*3%max));} }
  var groundTex=canvasTexture(128,function(x,s){x.fillStyle='#263326';x.fillRect(0,0,s,s);flecks(x,420,['#18291f','#3b4229','#565039','#222b1c'],s,3);},7,6);
  var dirtTex=canvasTexture(64,function(x,s){x.fillStyle='#6a5437';x.fillRect(0,0,s,s);flecks(x,100,['#493b2b','#8c7149','#312d22'],s,3);},2,8);
  var plankTex=canvasTexture(128,function(x,s){x.fillStyle='#70452c';x.fillRect(0,0,s,s);for(var y=0;y<s;y+=16){x.fillStyle=y%32?'#55331f':'#815337';x.fillRect(0,y,s,14);x.fillStyle='#2c2119';x.fillRect(0,y+14,s,2);}flecks(x,80,['#9b6843','#392619'],s,2);},3,2);
  var shingleTex=canvasTexture(64,function(x,s){x.fillStyle='#342d27';x.fillRect(0,0,s,s);for(var y=0;y<s;y+=12){for(var q=(y/12)%2?-5:0;q<s;q+=10){x.fillStyle='#4a3b30';x.fillRect(q,y,9,10);x.fillStyle='#211e1b';x.fillRect(q+8,y,1,10);x.fillRect(q,y+9,9,1);}}},2,2);
  function mat(color,opts){var m=new THREE.MeshStandardMaterial(Object.assign({color:color,roughness:.9},opts||{}));m.color.convertSRGBToLinear();return m;}
  function mesh(geo,material,x,y,z,parent){var m=new THREE.Mesh(geo,material);m.position.set(x||0,y||0,z||0);m.castShadow=m.receiveShadow=true;(parent||scene).add(m);return m;}

  scene.background=new THREE.Color(0x0a1514); scene.fog=new THREE.FogExp2(0x102523,.025);
  var ground=mesh(new THREE.BoxGeometry(28,.7,21),mat(0xffffff,{map:groundTex}),0,-.45,0); ground.receiveShadow=true;
  // Uneven moss islands and stones break up the forest floor.
  var mossMat=mat(0x34472d,{roughness:1}), stoneMat=mat(0x50564c);
  for(var mi=0;mi<18;mi++){var moss=mesh(new THREE.SphereGeometry(.45+(mi%4)*.18,12,6),mossMat,-11+(mi*7%22),-.02,-8+(mi*11%16));moss.scale.y=.08;}
  for(var si=0;si<15;si++){var stone=mesh(new THREE.DodecahedronGeometry(.12+(si%3)*.07,0),stoneMat,-10+(si*13%21),.05,-7+(si*17%15));stone.scale.y=.55;}

  // Curved dirt approach: overlapping authored slabs read as a continuous painterly path.
  var curve=new THREE.CatmullRomCurve3([new THREE.Vector3(8,0,8),new THREE.Vector3(5,0,5.2),new THREE.Vector3(1.7,0,4),new THREE.Vector3(.4,0,2.2)]);
  for(var pi=0;pi<24;pi++){var p=curve.getPoint(pi/23), p2=curve.getPoint(Math.min(1,(pi+1)/23));var slab=mesh(new THREE.CylinderGeometry(.75,.82,.035,16),mat(0xffffff,{map:dirtTex}),p.x,.015,p.z);slab.scale.x=1.35;slab.rotation.y=Math.atan2(p2.x-p.x,p2.z-p.z);}

  // Cabin shell, deep foundation and cedar plank breakup.
  var cabin=new THREE.Group(); cabin.position.set(-1.2,0,-1.4); scene.add(cabin);
  mesh(new THREE.BoxGeometry(8.5,.65,6),mat(0x2d3028),0,.28,0,cabin);
  mesh(new THREE.BoxGeometry(8,3.7,5.45),mat(0xffffff,{map:plankTex}),0,2.35,0,cabin);
  for(var bx=-3.7;bx<=3.7;bx+=1.22) mesh(new THREE.BoxGeometry(.09,3.55,.08),mat(0x3a2519),bx,2.35,2.77,cabin);
  // Individual shingle rows make the roof silhouette dimensional rather than a single prism.
  var angle=Math.atan2(2.15,3.18), roofMat=mat(0xffffff,{map:shingleTex,roughness:1});
  [-1,1].forEach(function(side){for(var row=0;row<7;row++){for(var col=0;col<11;col++){
    var z=side*(.27+row*.46), y=4.24+(3.28-Math.abs(z))*Math.tan(angle);
    var sh=mesh(new THREE.BoxGeometry(.84,.11,.58),roofMat,-4.18+col*.83,y,z,cabin);sh.rotation.x=side*angle;
  }}});
  // Gables close the east/west ends of the roof; its ridge runs east-west.
  var gshape=new THREE.Shape();gshape.moveTo(-3.28,0);gshape.lineTo(3.28,0);gshape.lineTo(0,2.22);gshape.closePath();
  [-4,4].forEach(function(x){var gable=mesh(new THREE.ShapeGeometry(gshape),mat(0x694029,{map:plankTex,side:THREE.DoubleSide}),x,4.18,0,cabin);gable.rotation.y=Math.PI/2;});
  [-3.3,3.3].forEach(function(z){mesh(new THREE.BoxGeometry(9.1,.16,.18),mat(0x927257),0,4.18,z,cabin);});
  mesh(new THREE.BoxGeometry(9.1,.18,.25),mat(0x493a2c),0,6.47,0,cabin);
  mesh(new THREE.BoxGeometry(1.05,2.25,.18),mat(0x332319),0,1.56,2.82,cabin);
  var brass=mat(0xb98846,{metalness:.55,roughness:.35});mesh(new THREE.SphereGeometry(.08,10,8),brass,.34,1.65,2.94,cabin);
  var warm=mat(0xffbb55,{emissive:0xff861a,emissiveIntensity:2.3});
  [-2.45,2.45].forEach(function(x){mesh(new THREE.BoxGeometry(1.42,1.35,.16),warm,x,2.35,2.84,cabin);mesh(new THREE.BoxGeometry(.09,1.45,.23),mat(0x241c16),x,2.35,2.96,cabin);mesh(new THREE.BoxGeometry(1.52,.09,.23),mat(0x241c16),x,2.35,2.96,cabin);});
  var porch=mesh(new THREE.BoxGeometry(6.6,.28,1.65),mat(0x60432e),0,.75,3.34,cabin);
  for(var st=0;st<3;st++)mesh(new THREE.BoxGeometry(2.5,.22,.48),mat(0x614631),0,.55-st*.2,4.15+st*.4,cabin);
  [-2.9,2.9].forEach(function(x){mesh(new THREE.CylinderGeometry(.1,.12,2.4,10),mat(0x4a321f),x,1.95,3.65,cabin);});
  mesh(new THREE.BoxGeometry(1.15,3.3,1.25),mat(0x51483e),2.7,5.65,-.6,cabin);
  for(var cy=4.35;cy<7;cy+=.36)mesh(new THREE.BoxGeometry(1.24,.06,1.34),mat(0x2b2925),2.7,cy,-.6,cabin);

  // Stream ribbon and timber footbridge at the edge of the composition.
  var stream=mesh(new THREE.PlaneGeometry(5.8,21,1,1),mat(0x315759,{metalness:.05,roughness:.3,transparent:true,opacity:.8}),-11,.04,0);stream.rotation.x=-Math.PI/2;stream.rotation.z=-.13;
  for(var br=-1.45;br<=1.45;br+=.42)mesh(new THREE.BoxGeometry(3.2,.16,.33),mat(0x62452d),-10.9,.28+Math.cos(br*1.5)*.08,br).rotation.y=.08;
  [-12.3,-9.5].forEach(function(x){mesh(new THREE.CylinderGeometry(.1,.1,3.3,10),mat(0x3d2b20),x,.82,0).rotation.x=Math.PI/2;});

  var needleTex=canvasTexture(64,function(x,s){x.fillStyle='#72816b';x.fillRect(0,0,s,s);for(var i=0;i<380;i++){x.strokeStyle=['#adb294','#4d6350','#233d31'][i%3];var px=(i*17)%s,py=(i*29)%s;x.beginPath();x.moveTo(px,py);x.lineTo(px+3,py-2);x.stroke();}},3,2);
  function pine(x,z,s,back){var g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
    mesh(new THREE.CylinderGeometry(.1*s,.23*s,5.3*s,8),mat(0x463d2d),0,2.55*s,0,g);
    for(var tier=0;tier<9;tier++){
      var radius=(1.78-tier*.155)*s, h=.95*s;
      var geo=new THREE.ConeGeometry(radius,h,28,3), pos=geo.attributes.position;
      for(var v=0;v<pos.count;v++){var vx=pos.getX(v),vz=pos.getZ(v),vy=pos.getY(v),ang=Math.atan2(vz,vx);var rough=1+.17*Math.sin(ang*11+tier*2)+.09*Math.cos(ang*17+tier);pos.setXYZ(v,vx*rough,vy+Math.sin(ang*13+tier)*.1*s,vz*rough);}
      geo.computeVertexNormals();
      var crown=mesh(geo,mat(back?0x536b60:[0x526448,0x647653,0x455d42][tier%3],{map:needleTex,roughness:1}),0,(1.8+tier*.54)*s,0,g);crown.rotation.y=tier*.61;
    }
    g.traverse(function(o){if(o.isMesh)o.castShadow=!back;});return g;
  }
  var treeSites=[[-12,-7,1.3,1],[-8,-7,1.2,1],[-4,-8,1.1,1],[1,-8,1.25,1],[6,-7,1.35,1],[11,-5,1.25,1],[12,1,1.15,0],[12,7,1.2,0],[9,9,1,0],[-8,9,1.1,0],[-10,5,.9,0],[-13,3,1.15,0]];
  treeSites.forEach(function(a){pine(a[0],a[1],a[2],a[3]);});
  // Irregular undergrowth clumps and fallen needles give the clearing a natural edge.
  var fernMat=mat(0x70804c,{side:THREE.DoubleSide});
  for(var f=0;f<100;f++){var fx=-12+(f*7.31%25),fz=-8+(f*3.79%17);if((fx>-6&&fx<4&&fz>-5&&fz<5)||(fx>1&&fz>2&&fx<9&&fz<7))continue;
    var tuft=new THREE.Group();tuft.position.set(fx,.03,fz);scene.add(tuft);
    for(var leaf=0;leaf<5;leaf++){var blade=mesh(new THREE.PlaneGeometry(.1,.3+(leaf%3)*.1),fernMat,0,.17,0,tuft);blade.rotation.set(.25+leaf*.12,leaf*1.26,.45*Math.sin(leaf*2));}
  }

  function cooperTexture(){var c=document.createElement('canvas'),x=c.getContext('2d');c.width=32;c.height=48;x.imageSmoothingEnabled=false;
    x.clearRect(0,0,32,48);x.fillStyle='#151919';x.fillRect(8,21,16,21);x.fillStyle='#ded1b4';x.fillRect(9,8,14,14);x.fillStyle='#31251f';x.fillRect(8,6,16,6);x.fillRect(7,9,3,7);x.fillStyle='#101615';x.fillRect(11,13,3,2);x.fillRect(19,13,3,2);x.fillStyle='#b97a60';x.fillRect(15,18,4,1);x.fillStyle='#e5dfcf';x.fillRect(11,23,10,13);x.fillStyle='#9a2d24';x.fillRect(15,25,3,12);x.fillStyle='#131718';x.fillRect(5,39,9,8);x.fillRect(18,39,9,8);
    var t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;t.encoding=THREE.sRGBEncoding;return t;}
  var player=new THREE.Sprite(new THREE.SpriteMaterial({map:cooperTexture(),transparent:true,alphaTest:.1}));player.scale.set(.86,1.28,1);player.center.set(.5,0);player.position.set(3,.04,4.8);scene.add(player);
  var playerShadow=mesh(new THREE.CircleGeometry(.36,24),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.42,depthWrite:false}),3,.04,4.8);playerShadow.rotation.x=-Math.PI/2;

  var hemi=new THREE.HemisphereLight(0x91b8c0,0x182018,.62);scene.add(hemi);
  var moon=new THREE.DirectionalLight(0xc8e6dd,1.35);moon.position.set(-7,15,9);moon.castShadow=true;moon.shadow.mapSize.set(1536,1536);moon.shadow.camera.left=-15;moon.shadow.camera.right=15;moon.shadow.camera.top=13;moon.shadow.camera.bottom=-12;moon.shadow.bias=-.0008;scene.add(moon);
  var ambient=new THREE.AmbientLight(0xffffff,.08);scene.add(ambient);
  var windowLights=[];[-3.65,1.25].forEach(function(x){var l=new THREE.PointLight(0xff8b31,2.8,7,2);l.position.set(x,2.1,2.9);l.castShadow=true;l.shadow.mapSize.set(512,512);scene.add(l);windowLights.push(l);});

  var spawn=new THREE.Vector3(3,.04,4.8), keys={}, lastCollision=false, ready=false, frames=0;
  var treeCircles=treeSites.map(function(t){return [t[0],t[1],t[2]*.65];});
  function blocked(x,z){if(x<-12.8||x>12.8||z<-8.8||z>8.8)return true;if(x>-5.7&&x<3.3&&z>-4.7&&z<1.8)return true;for(var i=0;i<treeCircles.length;i++){var t=treeCircles[i],dx=x-t[0],dz=z-t[1];if(dx*dx+dz*dz<t[2]*t[2])return true;}return false;}
  function move(dx,dz){var nx=player.position.x+dx,nz=player.position.z+dz;lastCollision=blocked(nx,nz);if(!lastCollision){player.position.x=nx;player.position.z=nz;playerShadow.position.x=nx;playerShadow.position.z=nz;}render();return !lastCollision;}
  function reset(){player.position.copy(spawn);playerShadow.position.set(spawn.x,.04,spawn.z);lastCollision=false;render();}
  function setVariant(name){variant=name==='flat'?'flat':'hd2d';params.set('variant',variant);history.replaceState(null,'','?'+params.toString());scene.fog.density=variant==='flat'?0:.025;hemi.intensity=variant==='flat'?1.25:.62;ambient.intensity=variant==='flat'?.62:.08;moon.intensity=variant==='flat'?.25:1.35;moon.castShadow=variant!=='flat';windowLights.forEach(function(l){l.intensity=variant==='flat'?0:2.8;});renderer.toneMappingExposure=variant==='flat'?1.18:1.03;document.querySelectorAll('[data-variant]').forEach(function(b){b.classList.toggle('active',b.dataset.variant===variant);});state.textContent=(variant==='flat'?'Flat baseline':'HD-2D depth')+(lastCollision?' · blocked':' · ready');render();}
  function resize(){var w=frame.clientWidth,h=frame.clientHeight;renderer.setSize(w,h,false);var aspect=w/h,span=8;camera.left=-span*aspect;camera.right=span*aspect;camera.top=span;camera.bottom=-span;camera.updateProjectionMatrix();render();}
  function render(){frames++;renderer.render(scene,camera);if(!ready){ready=true;document.title='TP-SHOT-READY · HD-2D Cabin Prototype';}state.textContent=(variant==='flat'?'Flat baseline':'HD-2D depth')+(lastCollision?' · blocked':' · ready');}
  function snapshot(){return{ready:ready,player:{x:+player.position.x.toFixed(2),z:+player.position.z.toFixed(2)},variant:variant,frame:frames,collision:lastCollision?'blocked':'clear'};}
  window.GAME=window.GAME||{};window.GAME.HD2DPrototype={snapshot:snapshot,move:move,reset:reset,setVariant:setVariant,render:render};
  addEventListener('keydown',function(e){if(['INPUT','TEXTAREA'].indexOf(e.target.tagName)>=0)return;keys[e.code]=true;if(e.code==='KeyR')reset();if(e.code==='Space'){e.preventDefault();setVariant(variant==='hd2d'?'flat':'hd2d');}});
  addEventListener('keyup',function(e){keys[e.code]=false;});addEventListener('blur',function(){keys={};});addEventListener('resize',resize);
  document.querySelectorAll('[data-variant]').forEach(function(b){b.onclick=function(){setVariant(b.dataset.variant);};});
  var last=performance.now();function loop(now){var dt=Math.min(.04,(now-last)/1000);last=now;var dx=((keys.KeyD?1:0)-(keys.KeyA?1:0))*3*dt,dz=((keys.KeyS?1:0)-(keys.KeyW?1:0))*3*dt;if(dx&&dz){dx*=Math.SQRT1_2;dz*=Math.SQRT1_2;}if(dx||dz)move(dx,dz);if(!capture&&!reduced){windowLights.forEach(function(l,i){l.intensity=(variant==='flat'?0:2.65+Math.sin(now*.002+i)*.2);});render();}requestAnimationFrame(loop);}
  setVariant(variant);resize();requestAnimationFrame(loop);
})();
