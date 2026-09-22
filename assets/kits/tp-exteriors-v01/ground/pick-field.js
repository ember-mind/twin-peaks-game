// pick-field.js — the engine's picker over a test field, for evidence.
// usage: node pick-field.js <field.txt> <seed>  -> JSON { w, h, cells }
var fs = require('fs'), path = require('path');
var G = require(path.join(__dirname, '../../../../engine/ember-ground.js'));
var ts = JSON.parse(fs.readFileSync(path.join(__dirname, 'ground.json'), 'utf8'));
var legend = { a: 'asphalt', c: 'concrete', g: 'grass', f: 'forest' };
var rows = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n');
var grid = rows.map(function (r) { return r.split('').map(function (ch) { return legend[ch]; }); });
var pick = G.picker(ts), cells = [];
for (var y = 0; y < grid.length; y++) for (var x = 0; x < grid[0].length; x++) cells.push(pick(grid, x, y, +(process.argv[3] || 7)).cell);
console.log(JSON.stringify({ w: grid[0].length, h: grid.length, cells: cells }));
