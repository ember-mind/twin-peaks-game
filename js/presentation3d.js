/* presentation3d.js — scena Three.js premium per titolo, intro e finale.
 * Renderer separato dal gameplay: nessun costo o stato condiviso durante play. */
(function () {
  var G = (typeof window !== 'undefined' ? window : globalThis);
  G.GAME = G.GAME || {};
  var P = {};
  var renderer = null, scene = null, camera = null, canvas = null;
  var dust = null, key = null, warm = null, titlePlane = null;
  var width = 960, height = 640, visible = false;

  function colorTexture(draw, w, h) {
    var cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var c = cv.getContext('2d');
    draw(c, w, h);
    var texture = new THREE.CanvasTexture(cv);
    texture.encoding = THREE.sRGBEncoding;
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 4;
    return texture;
  }

  function chevronTexture() {
    return colorTexture(function (c, w, h) {
      c.fillStyle = '#d8d0bd';
      c.fillRect(0, 0, w, h);
      var cell = 64;
      for (var y = -cell; y < h + cell; y += cell) {
        for (var x = -cell; x < w + cell; x += cell) {
          var odd = ((x / cell + y / cell) & 1) !== 0;
          c.fillStyle = odd ? '#16171b' : '#25262a';
          c.beginPath();
          c.moveTo(x, y + cell / 2);
          c.lineTo(x + cell / 2, y);
          c.lineTo(x + cell, y + cell / 2);
          c.lineTo(x + cell / 2, y + cell);
          c.closePath();
          c.fill();
          c.strokeStyle = 'rgba(218,207,184,0.26)';
          c.lineWidth = 2;
          c.stroke();
        }
      }
      var gradient = c.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, 'rgba(255,255,255,0.08)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.18)');
      c.fillStyle = gradient;
      c.fillRect(0, 0, w, h);
    }, 512, 512);
  }

  function titleTexture() {
    return colorTexture(function (c, w, h) {
      c.clearRect(0, 0, w, h);
      var glow = c.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w * 0.46);
      glow.addColorStop(0, 'rgba(255,222,171,0.16)');
      glow.addColorStop(1, 'rgba(255,222,171,0)');
      c.fillStyle = glow;
      c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(210,167,92,0.92)';
      c.lineWidth = 6;
      c.strokeRect(18, 18, w - 36, h - 36);
      c.strokeStyle = 'rgba(73,29,24,0.96)';
      c.lineWidth = 2;
      c.strokeRect(28, 28, w - 56, h - 56);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = '700 76px Georgia, serif';
      c.fillStyle = '#efe5cb';
      c.shadowColor = '#130203';
      c.shadowBlur = 14;
      c.fillText('TWIN PEAKS', w / 2, h * 0.43);
      c.shadowBlur = 0;
      c.font = 'italic 24px Georgia, serif';
      c.fillStyle = '#d0b77f';
      c.fillText('IL MISTERO DI LAURA PALMER', w / 2, h * 0.67);
    }, 1024, 320);
  }

  function velvetTexture() {
    return colorTexture(function (c, w, h) {
      var base = c.createLinearGradient(0, 0, 0, h);
      base.addColorStop(0, '#260a10');
      base.addColorStop(0.48, '#4a111d');
      base.addColorStop(1, '#19070c');
      c.fillStyle = base;
      c.fillRect(0, 0, w, h);
      for (var x = 0; x < w; x += 12) {
        var fold = c.createLinearGradient(x, 0, x + 12, 0);
        fold.addColorStop(0, 'rgba(0,0,0,.24)');
        fold.addColorStop(0.45, 'rgba(255,132,132,.08)');
        fold.addColorStop(1, 'rgba(0,0,0,.20)');
        c.fillStyle = fold;
        c.fillRect(x, 0, 12, h);
      }
      var vignette = c.createRadialGradient(w / 2, h * 0.48, 20, w / 2, h * 0.48, w * 0.62);
      vignette.addColorStop(0, 'rgba(255,188,156,.10)');
      vignette.addColorStop(1, 'rgba(0,0,0,.32)');
      c.fillStyle = vignette;
      c.fillRect(0, 0, w, h);
    }, 512, 512);
  }

  function curtainMaterial(index) {
    var palette = [0x56101c, 0x6d1624, 0x7a1a2a, 0x4a0c17];
    return new THREE.MeshStandardMaterial({
      color: palette[index % palette.length],
      roughness: 0.72,
      metalness: 0,
      envMapIntensity: 0.22
    });
  }

  function addCurtainSide(side) {
    var group = new THREE.Group();
    var baseX = side * 5.45;
    for (var i = 0; i < 12; i++) {
      var radius = 0.34 + (i % 3) * 0.025;
      var fold = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius * 1.03, 6.8, 18, 1, false),
        curtainMaterial(i + (side > 0 ? 1 : 0))
      );
      fold.position.set(baseX + side * i * 0.28, 3.15, -0.35 + (i % 2) * 0.06);
      fold.scale.z = 0.58;
      fold.rotation.z = side * (0.018 + i * 0.002);
      fold.castShadow = true;
      fold.receiveShadow = true;
      group.add(fold);
    }
    scene.add(group);
  }

  function addValance() {
    var group = new THREE.Group();
    for (var i = -9; i <= 9; i++) {
      var swag = new THREE.Mesh(
        new THREE.SphereGeometry(0.76, 18, 12),
        curtainMaterial(Math.abs(i))
      );
      swag.position.set(i * 0.72, 6.17 - Math.abs(i) * 0.018, -0.25);
      swag.scale.set(1.18, 0.48, 0.46);
      swag.castShadow = true;
      group.add(swag);
    }
    scene.add(group);
  }

  function addDust() {
    var count = 180;
    var positions = new Float32Array(count * 3);
    var phases = new Float32Array(count);
    var seed = 0x7a17b013;
    function rnd() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    for (var i = 0; i < count; i++) {
      positions[i * 3] = (rnd() - 0.5) * 12;
      positions[i * 3 + 1] = rnd() * 6;
      positions[i * 3 + 2] = (rnd() - 0.5) * 5;
      phases[i] = rnd();
    }
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    var material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: [
        'attribute float aPhase;',
        'uniform float uTime;',
        'void main(){',
        ' vec3 p=position;',
        ' p.y=mod(p.y+uTime*(0.07+aPhase*0.08),6.0);',
        ' p.x+=sin(uTime*0.31+aPhase*18.0)*0.12;',
        ' vec4 mv=modelViewMatrix*vec4(p,1.0);',
        ' gl_PointSize=2.2*(4.0/max(1.0,-mv.z));',
        ' gl_Position=projectionMatrix*mv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'void main(){',
        ' vec2 d=gl_PointCoord-0.5;',
        ' float a=smoothstep(0.5,0.08,length(d));',
        ' gl_FragColor=vec4(0.94,0.78,0.48,a*0.34);',
        '}'
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    dust = new THREE.Points(geometry, material);
    dust.frustumCulled = false;
    scene.add(dust);
  }

  function buildScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x08070b);
    scene.fog = new THREE.FogExp2(0x0b070b, 0.032);

    camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 60);
    camera.position.set(0, 3.35, 9.6);
    camera.lookAt(0, 2.35, 0);

    var floorTex = chevronTexture();
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(3.2, 2.2);
    var floor = new THREE.Mesh(
      new THREE.PlaneGeometry(15, 11),
      new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: 0.5,
        metalness: 0.02,
        envMapIntensity: 0.35
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.02, 0.8);
    floor.receiveShadow = true;
    scene.add(floor);

    var backTex = velvetTexture();
    backTex.wrapS = backTex.wrapT = THREE.RepeatWrapping;
    backTex.repeat.set(2.4, 1);
    var back = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 7),
      new THREE.MeshStandardMaterial({
        color: 0x8b3544,
        map: backTex,
        bumpMap: backTex,
        bumpScale: 0.08,
        roughness: 0.91,
        metalness: 0
      })
    );
    back.position.set(0, 3.2, -1.6);
    back.receiveShadow = true;
    scene.add(back);

    addCurtainSide(-1);
    addCurtainSide(1);
    addValance();

    titlePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(7.4, 2.3),
      new THREE.MeshBasicMaterial({
        map: titleTexture(),
        transparent: true,
        depthWrite: false,
        toneMapped: false
      })
    );
    titlePlane.position.set(0, 3.45, 0.2);
    scene.add(titlePlane);

    var frameMaterial = new THREE.MeshStandardMaterial({
      color: 0xb48a42, roughness: 0.28, metalness: 0.62
    });
    [
      [7.58, 0.075, 0.075, 0, 4.62],
      [7.58, 0.075, 0.075, 0, 2.28],
      [0.075, 2.42, 0.075, -3.79, 3.45],
      [0.075, 2.42, 0.075, 3.79, 3.45]
    ].forEach(function (spec) {
      var rail = new THREE.Mesh(
        new THREE.BoxGeometry(spec[0], spec[1], spec[2]),
        frameMaterial
      );
      rail.position.set(spec[3], spec[4], 0.24);
      rail.castShadow = true;
      scene.add(rail);
    });

    var footlightMaterial = new THREE.MeshStandardMaterial({
      color: 0x3b271c, roughness: 0.4, metalness: 0.34,
      emissive: 0x9a5528, emissiveIntensity: 0.28
    });
    for (var fl = -4; fl <= 4; fl++) {
      var footlight = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 10, 8),
        footlightMaterial
      );
      footlight.position.set(fl * 0.72, 0.075, 1.15);
      scene.add(footlight);
    }

    var hemi = new THREE.HemisphereLight(0x7a8099, 0x260b10, 0.26);
    scene.add(hemi);
    key = new THREE.SpotLight(0xffe2b0, 2.4, 22, Math.PI / 5, 0.42, 1.6);
    key.position.set(-3.6, 7.2, 6.8);
    key.target.position.set(0, 2.4, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0004;
    scene.add(key.target);
    scene.add(key);
    warm = new THREE.PointLight(0xb51f33, 1.6, 13, 2);
    warm.position.set(3.8, 3.2, 3.5);
    scene.add(warm);
    var rim = new THREE.PointLight(0x527a88, 0.7, 11, 2);
    rim.position.set(-4.2, 2.2, -0.5);
    scene.add(rim);
    addDust();
  }

  P.init = function (targetCanvas) {
    if (!targetCanvas || typeof THREE === 'undefined') {
      if (targetCanvas) targetCanvas.setAttribute('data-renderer-state', 'unavailable');
      return false;
    }
    canvas = targetCanvas;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        powerPreference: 'high-performance'
      });
    } catch (error) {
      canvas.setAttribute('data-renderer-state', 'failed');
      return false;
    }
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.96;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    buildScene();
    P.resize(canvas.clientWidth || width, canvas.clientHeight || height);
    canvas.setAttribute('data-renderer-state', 'ready');
    return true;
  };

  P.resize = function (w, h) {
    width = Math.max(1, w);
    height = Math.max(1, h);
    if (!renderer || !camera) return;
    var ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = width / height < 0.9 ? 52 : 38;
    camera.updateProjectionMatrix();
  };

  P.render = function (mode, time, page) {
    if (!renderer || !scene) return;
    visible = mode === 'title' || mode === 'intro' || mode === 'end';
    canvas.style.visibility = visible ? 'visible' : 'hidden';
    if (!visible) return;
    var seconds = time * 0.001;
    var intro = mode === 'intro';
    titlePlane.visible = mode === 'title';
    titlePlane.position.y = 3.45 + Math.sin(seconds * 0.42) * 0.035;
    titlePlane.material.opacity = 0.92 + Math.sin(seconds * 0.7) * 0.04;
    camera.position.x = Math.sin(seconds * 0.13) * 0.16;
    camera.position.y = 3.35 + Math.sin(seconds * 0.18) * 0.06;
    camera.lookAt(0, intro ? 2.15 : 2.35, 0);
    key.intensity = intro ? 1.35 : 2.4;
    warm.intensity = intro ? 0.85 : 1.6 + Math.sin(seconds * 0.9) * 0.08;
    if (dust) dust.material.uniforms.uTime.value = seconds;
    renderer.render(scene, camera);
  };

  P.isVisible = function () { return visible; };
  G.GAME.Presentation3D = P;
})();
