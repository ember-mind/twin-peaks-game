'use strict';
// Pure host-side geometry helpers. No DOM/game/storage mutation.
const assert = require('node:assert/strict');
const PAD = 'Controllo direzionale: muovi in quattro direzioni';
const DIR = Object.freeze({ up: [0,-1], right: [1,0], down: [0,1], left: [-1,0] });
function pointFor(s, label, direction) {
  const controls = (s.touchControls || []).filter((c) => c.visible && c.label === label);
  assert.equal(controls.length, 1, 'Exactly one visible touch control: ' + label);
  const r = controls[0].rect;
  assert.ok(r && [r.x,r.y,r.width,r.height].every(Number.isFinite) && r.width > 0 && r.height > 0, 'Finite control rectangle');
  let x = r.x + r.width / 2, y = r.y + r.height / 2;
  if (direction !== undefined) {
    assert.equal(label, PAD, 'Directions apply only to the actual D-pad');
    assert.ok(Object.hasOwn(DIR, direction), 'Known D-pad direction');
    const distance = Math.min(r.width,r.height) * 0.35;
    assert.ok(distance > 24, 'Tap must be outside the production D-pad dead zone');
    x += DIR[direction][0] * distance; y += DIR[direction][1] * distance;
  }
  return [Math.round(x),Math.round(y)];
}
function assertLayout(s, width, height) {
  const controls = (s.touchControls || []).filter((c) => c.visible);
  assert.ok(controls.length, 'Production touch controls must exist');
  for (const c of controls) {
    const r=c.rect;
    assert.ok(r && [r.x,r.y,r.width,r.height].every(Number.isFinite) && r.width>0 && r.height>0, 'Valid visible rectangle: '+c.label);
    assert.ok(r.x>=-0.5 && r.y>=-0.5 && r.x+r.width<=width+0.5 && r.y+r.height<=height+0.5, 'Visible control stays in viewport: '+c.label);
    const [x,y]=pointFor(s,c.label);
    assert.ok(x>=0 && y>=0 && x<width && y<height, 'Control centre can be tapped');
  }
}
function stepCandidate(s) {
  const occupied = new Set((s.liveNpcs || []).flatMap((n) => [`${n.x},${n.y}`, `${n.mx},${n.my}`]));
  for (const [dir,[dx,dy]] of Object.entries(DIR)) {
    if (dir===s.player.dir) continue;
    const x=s.player.tx+dx,y=s.player.ty+dy;
    if (s.map.solid[y] && s.map.solid[y][x]==='0' && !(s.doors[s.mapId] || {})[`${x},${y}`] && !occupied.has(`${x},${y}`)) return {dir,x,y};
  }
  throw new Error('No safe adjacent touch step from the genuinely reached opening position');
}
module.exports = { PAD, pointFor, assertLayout, stepCandidate };
