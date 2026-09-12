/* Material and light pass for the production 2D world.
 * World cells, actor positions, interaction ranges and touch coordinates stay
 * canonical. Detail is seeded in world space, never in screen coordinates.
 */
(function () {
  'use strict';
  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME;
  if (!GAME || !GAME.Sprites) return;
  var originalTile = GAME.Sprites.drawTile;
  var cache = Object.create(null), cacheCount = 0;
  var crowns = Object.create(null), crownCount = 0;
  var reduced = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  function time(t) { return reduced && reduced.matches ? 0 : (t || 0) * .001; }
  function noise(x, y, salt) {
    var h = Math.imul(x ^ salt, 374761393) ^ Math.imul(y, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  function rect(c, x, y, w, h, color) {
    c.fillStyle = color; c.fillRect(x, y, w, h);
  }
  function ellipse(c, x, y, rx, ry, color) {
    c.fillStyle = color; c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill();
  }
  function cell(rows, x, y) { return rows[y] ? rows[y].charAt(x) : ''; }
  function grass(ch) { return ch === '.' || ch === ',' || ch === 'g'; }
  function outside(map) { return map && !map.indoor && map.id !== 'redroom' && map.id !== 'arrival'; }
  // A lit needle mass, shared by background and depth-sorted foreground.
  // Cache local geometry, never camera coordinates or animation timestamps.
  function crown(c, x, y, rx, ry, tones, phase) {
    if (typeof document === 'undefined') return false;
    var key = [rx, ry, phase & 31, tones.join('')].join(':');
    var cv = crowns[key];
    if (!cv) {
      if (crownCount > 512) { crowns = Object.create(null); crownCount = 0; }
      cv = document.createElement('canvas');
      cv.width = Math.ceil(rx * 2 + 6); cv.height = Math.ceil(ry * 2 + 6);
      var g = cv.getContext('2d');
      if (!g) return false;
      var ramp = tones.map(function (color) {
        return [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)];
      });
      for (var py = 0; py < cv.height; py++) for (var px = 0; px < cv.width; px++) {
        var nx = (px - rx - 3) / rx, ny = (py - ry - 3) / ry;
        var rough = noise(px >> 1, py >> 1, phase + 781);
        var radius = nx * nx + ny * ny;
        if (radius > .88 + rough * .19) continue;
        var z = Math.sqrt(Math.max(0, 1 - radius));
        var light = Math.max(0, -.44 * nx - .57 * ny + .61 * z);
        var needle = noise(px, py, phase + 220);
        var level = Math.max(0, Math.min(3.98, light * 3.1 + rough * .65 + needle * .45 - .3));
        var low = Math.floor(level), f = level - low;
        var a = ramp[low], b = ramp[Math.min(4, low + 1)];
        g.fillStyle = 'rgb(' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * f); }).join(',') + ')';
        g.fillRect(px, py, 1, 1);
      }
      crowns[key] = cv; crownCount++;
    }
    c.drawImage(cv, Math.round(x - rx - 3), Math.round(y - ry - 3));
    return true;
  }
  function groundTexture(ch, tx, ty, rows, woods) {
    if (typeof document === 'undefined') return null;
    var kind = grass(ch) ? 'grass' : ch === '=' ? 'stone' : ch === 'r' ? 'road' : 'earth';
    var edge = [cell(rows, tx, ty - 1), cell(rows, tx + 1, ty),
      cell(rows, tx, ty + 1), cell(rows, tx - 1, ty)].join('');
    var key = ch + ':' + tx + ':' + ty + ':' + edge + ':' + woods;
    if (cache[key]) return cache[key];
    // Bound memory on long campaigns and dynamic map transitions.
    if (cacheCount > 2048) { cache = Object.create(null); cacheCount = 0; }
    var cv = document.createElement('canvas'); cv.width = cv.height = 32;
    var c = cv.getContext('2d');
    if (!c) return null;
    c.scale(2, 2);
    var n = noise(tx, ty, 78);
    var colors = woods ? ['#263f3b','#48684a','#86966a'] : ['#345e38','#71954b','#bed17c'];
    var base = kind === 'grass' ? colors[1] : kind === 'stone' ? '#8d8971' : kind === 'road' ? '#647077' : '#a68d60';
    rect(c, 0, 0, 16, 16, base);
    if (kind === 'grass') {
      // Broad sunlit patches cross cell boundaries; fern shade remains cool.
      for (var my = 0; my < 16; my += 2) for (var mx = 0; mx < 16; mx += 2) {
        var field = Math.sin((tx * 16 + mx) * .047 + Math.sin((ty * 16 + my) * .035) * 2);
        rect(c, mx, my, 2, 2, field > 0 ? 'rgba(208,194,88,' + field * .16 + ')' : 'rgba(18,57,40,' + -field * .22 + ')');
      }
    }
    // Low-frequency mottling plus subpixel grain gives coherent material at
    // native resolution instead of isolated, oversized decorative dots.
    for (var y = 0; y < 32; y++) for (var x = 0; x < 32; x++) {
      var q = noise(tx * 32 + x, ty * 32 + y, 113);
      var band = Math.sin((tx * 16 + x / 2) * .14) * Math.cos((ty * 16 + y / 2) * .11);
      rect(c, x / 2, y / 2, .5, .5, q > .5 ? 'rgba(244,224,170,' + (.025 + q * .13 + Math.max(0, band) * .05) + ')' : 'rgba(21,39,35,' + (.03 + q * .16) + ')');
    }
    if (kind === 'stone') {
      // Courses continue across tile boundaries, including stagger and seed.
      var firstRow = Math.floor(ty * 16 / 5);
      var firstCol = Math.floor(tx * 16 / 6);
      for (var row = firstRow - 1; row < firstRow + 5; row++) for (var col = firstCol - 1; col < firstCol + 4; col++) {
        var sx = col * 6 + (row & 1) * 3 - tx * 16;
        var sy = row * 5 - ty * 16;
        var v = noise(col, row, 918);
        c.beginPath(); c.moveTo(sx + 1, sy + .5); c.lineTo(sx + 5, sy);
        c.lineTo(sx + 6, sy + 2); c.lineTo(sx + 5.5, sy + 4);
        c.lineTo(sx + 1.5, sy + 4.5); c.lineTo(sx, sy + 3); c.closePath();
        c.fillStyle = ['#c3b995','#b0aa8d','#d3c7a4','#a5a18a'][Math.floor(v * 4)]; c.fill();
        c.strokeStyle = '#787d65'; c.lineWidth = .45; c.stroke();
        c.beginPath(); c.moveTo(sx + 1, sy + 1); c.lineTo(sx + 4.5, sy + .5);
        c.strokeStyle = 'rgba(255,240,195,.65)'; c.stroke();
        rect(c, sx + 2, sy + 3.6, 2, .4, 'rgba(59,62,47,.22)');
      }
    } else if (kind === 'grass') {
      for (var i = 0; i < 38; i++) {
        var gx = noise(tx, ty, i + 130) * 16, gy = noise(ty, tx, i + 510) * 16;
        c.strokeStyle = colors[i % 3]; c.lineWidth = .5;
        c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx - .65, gy - 1 - noise(tx, i, 44)); c.stroke();
        if (i % 4 === 0) { c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + 1, gy - 1.4); c.stroke(); }
      }
      if (ch === ',' || n > .90) {
        for (var f = 0; f < 3; f++) {
          var fx = 2 + noise(tx, f, ty + 91) * 12, fy = 3 + noise(ty, f, tx + 31) * 10;
          rect(c, fx, fy, .5, 2, '#345d3e');
          ellipse(c, fx, fy, 1, .7, f === 1 ? '#d8adc3' : '#f1e5bd');
          rect(c, fx, fy, .5, .5, '#d7b763');
        }
      }
    } else if (kind === 'road' && n > .70) {
      // Rain-darkened asphalt with a shallow sky reflection, not a new water tile.
      ellipse(c, 8, 10, 4 + n * 2, 1.5, 'rgba(40,67,73,.25)');
      rect(c, 4, 9.5, 7, .4, 'rgba(190,214,210,.22)');
    } else if (kind === 'earth') {
      for (var pe = 0; pe < 12; pe++) {
        var ex = noise(tx, pe, ty + 9) * 16, ey = noise(ty, pe, tx + 51) * 16;
        ellipse(c, ex, ey, .6, .4, pe & 1 ? '#cabb90' : '#786e53');
      }
    }
    if (kind !== 'grass') {
      // Moss and grass enter along genuine route edges, never across the route.
      for (var side = 0; side < 4; side++) if (grass(edge.charAt(side))) {
        for (var blade = 0; blade < 12; blade++) {
          var depth = noise(tx + side, ty + blade, 77) * 2;
          var bx = side === 1 ? 16 - depth : side === 3 ? 0 : blade * 1.4;
          var by = side === 0 ? 0 : side === 2 ? 16 - depth : blade * 1.4;
          rect(c, bx, by, side & 1 ? depth : .7, side & 1 ? .7 : depth, colors[0]);
        }
      }
    }
    if (kind === 'road') {
      // Raised stone kerbs retain the actual asphalt/pavement boundary.
      for (var curb = 0; curb < 4; curb++) if (edge.charAt(curb) === '=') {
        var vertical = curb & 1;
        var kx = curb === 1 ? 15 : 0, ky = curb === 2 ? 15 : 0;
        rect(c, kx, ky, vertical ? 1 : 16, vertical ? 16 : 1, '#b8b59b');
        rect(c, curb === 1 ? 14 : 1, curb === 2 ? 14 : 1,
          vertical ? .5 : 14, vertical ? 14 : .5, 'rgba(27,44,43,.40)');
        for (var joint = 3; joint < 16; joint += 6) rect(c,
          vertical ? kx : joint, vertical ? joint : ky, 1, 1, '#666f60');
      }
      // Fine aggregate and hairline frost cracks retain asphalt semantics.
      if (n < .18) {
        c.beginPath(); c.moveTo(2, 1); c.lineTo(4, 5); c.lineTo(3, 8); c.lineTo(6, 12);
        c.strokeStyle = 'rgba(24,39,43,.34)'; c.lineWidth = .45; c.stroke();
      }
      for (var grit = 0; grit < 10; grit++) {
        rect(c, noise(tx, grit, ty + 48) * 16, noise(ty, grit, tx + 61) * 16,
          .5, .5, grit % 3 ? 'rgba(224,218,191,.15)' : 'rgba(22,40,41,.20)');
      }
    }
    cache[key] = cv; cacheCount++; return cv;
  }
  // Authored landscaping calls this too, so prop underlays share the ground
  // material instead of repainting a flat square over detailed terrain.
  function surface(c, ch, x, y, tx, ty, rows, woods) {
    var tile = groundTexture(ch, tx, ty, rows, woods);
    if (tile) c.drawImage(tile, x, y, 16, 16);
    return !!tile;
  }
  GAME.Sprites.drawTile = function (ctx, ch, x, y, tx, ty, rows, opts) {
    opts = opts || {};
    // Authored location artwork and all solid tiles retain their own renderer.
    if (!opts.indoor && opts.mapId !== 'arrival' && '.g,=rup'.indexOf(ch) !== -1 && ch.length === 1) {
      var tile = groundTexture(ch, tx, ty, rows, opts.mapId === 'woods');
      if (tile) {
        ctx.drawImage(tile, x, y, 16, 16);
        return;
      }
    }
    originalTile.apply(this, arguments);
    if (ch === 'w') {
      var t = time(opts.t);
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, 16, 16); ctx.clip();
      var bankNorth = cell(rows, tx, ty - 1) !== 'w';
      var bankWest = cell(rows, tx - 1, ty) !== 'w';
      var bankEast = cell(rows, tx + 1, ty) !== 'w';
      var bankSouth = cell(rows, tx, ty + 1) !== 'w';
      var depth = ctx.createLinearGradient(x, y, x + 10, y + 16);
      depth.addColorStop(0, bankNorth || bankWest ? '#659588' : '#3c737c');
      depth.addColorStop(1, '#284f63');
      ctx.fillStyle = depth; ctx.fillRect(x, y, 16, 16);
      for (var ripple = 0; ripple < 4; ripple++) {
        var ry = (ty * 16 + ripple * 4 + Math.sin(t * .7 + tx * .2) * .6) % 16;
        var rx = noise(tx, ty, ripple + 941) * 9;
        rect(ctx, x + rx, y + ry, 6 + ripple, .5, 'rgba(153,201,198,.23)');
        rect(ctx, x + rx + 1, y + ry + 1, 5, .5, 'rgba(15,53,66,.22)');
      }
      // Submerged bank and broken foam follow collision shoreline exactly.
      for (var shore = 0; shore < 4; shore++) {
        if (![bankNorth, bankEast, bankSouth, bankWest][shore]) continue;
        for (var pebble = 0; pebble < 8; pebble++) {
          var inset = noise(tx + shore, ty, pebble + 718) * 1.2;
          var shoreX = shore === 1 ? 15 - inset : shore === 3 ? inset : pebble * 2;
          var shoreY = shore === 0 ? inset : shore === 2 ? 15 - inset : pebble * 2;
          ellipse(ctx, x + shoreX, y + shoreY, shore & 1 ? 1.2 : 1.8,
            shore & 1 ? 1.8 : 1.2, '#617c6d');
          rect(ctx, x + shoreX, y + shoreY + .8, 1.5, .5, 'rgba(212,230,195,.5)');
        }
      }
      for (var i = 0; i < 5; i++) {
        var yy = (noise(tx, ty, i + 100) * 16 + t * .8) % 16;
        var xx = noise(tx, ty, i + 600) * 16 + Math.sin(t + ty + i) * 1.2;
        var sparkle = .15 + .35 * Math.pow(Math.max(0, Math.sin(t * 1.3 + tx + i)), 6);
        rect(ctx, x + xx, y + yy, 2 + i % 3, .5, 'rgba(224,246,238,' + sparkle + ')');
      }
      ctx.restore();
    }
  };

  function visibleCells(map, cx, cy, w, h, fn) {
    for (var y = Math.max(0, Math.floor(cy / 16) - 3); y < Math.min(map.height, Math.ceil((cy + h) / 16) + 1); y++) {
      for (var x = Math.max(0, Math.floor(cx / 16) - 3); x < Math.min(map.width, Math.ceil((cx + w) / 16) + 1); x++) {
        fn(cell(map.rows, x, y), x * 16 - cx, y * 16 - cy, x, y);
      }
    }
  }
  function groundLight(c, map, cx, cy, w, h, t) {
    if (!outside(map) || !c.createLinearGradient) return;
    c.save();
    var woods = map.id === 'woods';
    var seconds = time(t);
    visibleCells(map, cx, cy, w, h, function (ch, x, y, tx, ty) {
      if (!grass(ch)) return;
      // A few taller blades at forest margins move as one wind field.
      // Their feet never leave the grass, and route interiors stay clear.
      var edge = cell(map.rows, tx - 1, ty) + cell(map.rows, tx, ty - 1);
      if (!/[TYnF]/.test(edge)) return;
      var sway = Math.sin(seconds * 1.2 + tx * .25 + ty * .18) * .65;
      for (var blade = 0; blade < 5; blade++) {
        var bx = x + 2 + noise(tx, ty, blade + 145) * 12;
        var by = y + 3 + noise(ty, tx, blade + 910) * 11;
        c.lineWidth = .65;
        c.strokeStyle = blade & 1 ? '#a6b968' : '#456b3d';
        c.beginPath(); c.moveTo(bx, by);
        c.quadraticCurveTo(bx + sway, by - 1.5, bx - .7 + sway, by - 3);
        c.stroke();
      }
    });
    visibleCells(map, cx, cy, w, h, function (ch, x, y, tx, ty) {
      if (!ch || '.g,=rup-'.indexOf(ch) < 0) return;
      var neighbor = cell(map.rows, tx - 1, ty - 1);
      if (!neighbor || 'TY'.indexOf(neighbor) < 0) return;
      c.save(); c.beginPath(); c.rect(x, y, 16, 16); c.clip();
      var shade = c.createLinearGradient(x, y, x + 16, y + 16);
      shade.addColorStop(0, 'rgba(19,43,42,.36)');
      shade.addColorStop(1, 'rgba(26,49,43,0)');
      c.fillStyle = shade; c.fillRect(x, y, 16, 16);
      for (var leaf = 0; leaf < 5; leaf++) {
        var lx = noise(tx, ty, leaf + 49) * 16;
        var ly = noise(ty, tx, leaf + 79) * 16;
        ellipse(c, x + lx + Math.sin(seconds * .65 + leaf) * .4, y + ly,
          1.8, .8, woods ? 'rgba(177,206,182,.10)' : 'rgba(255,225,149,.25)');
      }
      c.restore();
    });
    visibleCells(map, cx, cy, w, h, function (ch, x, y, tx, ty) {
      if ('TYFLP'.indexOf(ch) === -1 || !ch) return;
      if ((ch === 'T' || ch === 'Y') && cell(map.rows, tx, ty + 1) === ch) return;
      // Project only onto walkable ground. Facades and crowns never receive
      // black silhouettes from a post-composite tree shadow.
      for (var step = 1; step < 5; step++) {
        var wx = tx + Math.floor(step * .55), wy = ty + Math.floor(step * .4);
        var below = cell(map.rows, wx, wy);
        if ('.g,=rup-:'.indexOf(below) === -1 || !below) continue;
        c.save(); c.beginPath(); c.rect(wx * 16 - cx, wy * 16 - cy, 16, 16); c.clip();
        ellipse(c, x + 8 + step * 5, y + 13 + step * 3, 10 - step, 3.5, 'rgba(22,43,40,.13)');
        c.restore();
      }
    });
    var sun = c.createLinearGradient(0, 0, w, h);
    sun.addColorStop(0, woods ? 'rgba(118,157,175,.12)' : 'rgba(255,219,137,.09)');
    sun.addColorStop(.55, 'rgba(239,222,178,.025)');
    sun.addColorStop(1, 'rgba(23,47,51,.08)');
    c.fillStyle = sun; c.fillRect(0, 0, w, h);
    if (map.id === 'town' && GAME.Retro2D) {
      (GAME.Retro2D.townStructureDefs || []).forEach(function (building) {
        if (!building.door) return;
        var dx = building.door[0] * 16 + 8 - cx;
        var dy = (building.door[1] + 1) * 16 - cy;
        if (dx < -32 || dx > w + 32 || dy < -24 || dy > h + 24) return;
        var glow = c.createRadialGradient(dx, dy, 1, dx, dy + 6, 23);
        glow.addColorStop(0, 'rgba(255,214,132,.23)');
        glow.addColorStop(1, 'rgba(255,214,132,0)');
        c.fillStyle = glow;
        c.fillRect(dx - 24, dy, 48, 24);
        // Broken highlights on damp paving at the entrance.
        for (var glint = 0; glint < 4; glint++) {
          rect(c, dx - 4 + glint % 2, dy + 2 + glint * 2.5,
            7 - glint, .5, 'rgba(248,221,157,' + (.20 - glint * .035) + ')');
        }
      });
    }
    c.restore();
  }
  function actorGround(c, map, e, cx, cy, t) {
    if (!c.ellipse || map.id === 'arrival') return;
    var x = e.wx + 8 - cx, y = e.wy + 15 - cy;
    c.save(); c.globalAlpha = e.alpha == null ? 1 : e.alpha;
    if (outside(map)) {
      ellipse(c, x + 5, y + 2, 8, 2.4, 'rgba(22,35,33,.18)');
      ellipse(c, x + 2, y + 1, 5, 1.8, 'rgba(16,26,26,.18)');
      var tx = Math.floor((e.wx + 8) / 16), ty = Math.floor((e.wy + 15) / 16);
      if (cell(map.rows, tx, ty) === 'r' && noise(tx, ty, 78) > .70) {
        // Reflect only inside the same seeded asphalt puddle as the surface.
        // Reuse the current pose, so reflections turn and walk with actors.
        c.save(); c.beginPath();
        c.ellipse(tx * 16 + 8 - cx, ty * 16 + 10 - cy, 6, 1.5, 0, 0, Math.PI * 2);
        c.clip(); c.globalAlpha *= .14;
        c.translate(x, y); c.scale(1, -.32); c.translate(-x, -y);
        GAME.Sprites.drawChar(c, e.wx - cx, e.wy - cy,
          GAME.Sprites.CHARS[e.sprite] || GAME.Sprites.CHARS.cooper,
          e.dir, e.fr, 1, e.moving, false, t,
          { mapId: map.id, wx: e.wx, wy: e.wy, npcId: e.id });
        c.restore();
      }
    }
    c.restore();
  }
  function atmosphere(c, map, cx, cy, w, h, rawTime) {
    if (!outside(map) || !c.createRadialGradient) return;
    var t = time(rawTime), woods = map.id === 'woods';
    c.save();
    // Wide, subtle falloff reserves contrast for the actor and route.
    var vignette = c.createRadialGradient(w * .48, h * .44, w * .25, w * .5, h * .5, w * .78);
    vignette.addColorStop(0, 'rgba(12,30,32,0)');
    vignette.addColorStop(1, woods ? 'rgba(12,23,35,.26)' : 'rgba(18,37,36,.19)');
    c.fillStyle = vignette; c.fillRect(0, 0, w, h);
    // Sparse windborne motes stay anchored to world regions; no frame noise.
    if (!(reduced && reduced.matches)) for (var i = 0; i < 12; i++) {
      var wx = (noise(i, 0, 512) * map.width * 16 + t * (1 + i % 3)) % (map.width * 16);
      var wy = noise(i, 1, 923) * map.height * 16 + Math.sin(t * .4 + i) * 3;
      var sx = wx - cx, sy = wy - cy;
      if (sx < 0 || sx > w || sy < 0 || sy > h) continue;
      rect(c, sx, sy, .7, .7, woods ? 'rgba(183,208,178,.28)' : 'rgba(255,234,177,.48)');
    }
    c.globalAlpha = 1;
    c.restore();
  }
  GAME.Diorama = { surface: surface, crown: crown, groundLight: groundLight, actorGround: actorGround, atmosphere: atmosphere };
})();
