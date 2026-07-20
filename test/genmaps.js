/* Genera le nuove mappe town (56x36) e woods (28x22), valida e stampa i blocchi. */
'use strict';

function grid(w, h, fill) {
  const g = [];
  for (let y = 0; y < h; y++) g.push(new Array(w).fill(fill));
  return g;
}
function rect(g, x0, y0, x1, y1, ch) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch;
}
function border(g, ch) {
  const h = g.length, w = g[0].length;
  rect(g, 0, 0, w - 1, 0, ch); rect(g, 0, h - 1, w - 1, h - 1, ch);
  rect(g, 0, 0, 0, h - 1, ch); rect(g, w - 1, 0, w - 1, h - 1, ch);
}

/* ---------------- TOWN 56x36 ---------------- */
const W = 56, H = 36;
const t = grid(W, H, '.');
border(t, 'T');
// doppio bordo alberato nord/sud per profondità
rect(t, 1, 1, W - 2, 1, 'T');
rect(t, 1, H - 2, W - 2, H - 2, 'T');
// varco d'ingresso sud: la fila interna (riga 34) si dirada attorno alla
// piazza del cartello, così la camera allo spawn (28,31) vede il giocatore
// oltre la sola fila di confine (riga 35), che resta sotto la linea di vista.
rect(t, 21, H - 2, 35, H - 2, '.');
t[H - 2][22] = 'n'; t[H - 2][25] = 'n'; t[H - 2][31] = ','; t[H - 2][34] = 'n';

// sentiero del bosco (transennato) in alto a destra
t[0][50] = 'X'; t[1][50] = 'p';
rect(t, 50, 1, 50, 13, 'p');

// siepi dietro gli edifici nord
rect(t, 5, 3, 14, 3, 'T');
rect(t, 37, 3, 46, 3, 'T');
// hotel (4) e casa Palmer (3), porte a sud
rect(t, 5, 4, 14, 6, '4'); t[6][9] = 'D';
rect(t, 37, 4, 46, 6, '3'); t[6][42] = 'D';
// vialetti dalle porte alla strada
rect(t, 9, 7, 9, 13, 'p');
rect(t, 42, 7, 42, 13, 'p');

// strada orizzontale
rect(t, 1, 14, W - 2, 15, 'r');
// uscita est verso il vagone del treno (Atto 3): apre il bordo sulla strada
t[14][W - 1] = 'r'; t[15][W - 1] = 'r';

// siepi dietro gli edifici sud
rect(t, 7, 17, 17, 17, 'T');
rect(t, 37, 17, 47, 17, 'T');
// distretto (1) e Double R (2), porte a sud
rect(t, 7, 18, 17, 20, '1'); t[20][12] = 'D';
rect(t, 37, 18, 47, 20, '2'); t[20][42] = 'D';
// vialetti verso sud
rect(t, 12, 21, 12, 23, 'p');
rect(t, 42, 21, 42, 23, 'p');

// strada verticale dal centro verso sud (spawn)
rect(t, 27, 16, 28, H - 3, 'r');

// lago a sud-ovest
rect(t, 4, 26, 13, 31, 'w');

// cartello di benvenuto accanto alla strada verticale
t[30][30] = 'S';

// ospedale (5): ala nord-est, porta a sud, siepe dietro, vialetto fino alla strada
rect(t, 19, 3, 28, 3, 'T');
rect(t, 20, 4, 27, 6, '5'); t[6][23] = 'D';
rect(t, 23, 7, 23, 13, 'p');

// roadhouse (6): sud-est, porta a sud (chiuso in Atto 2), corto vialetto
rect(t, 44, 26, 51, 28, '6'); t[28][47] = 'D';
rect(t, 47, 29, 47, 30, 'p');

// cimitero: angolo est, siepe alle spalle (nord), due file sfalsate di
// lapidi solide 'G', cancello del recinto (landmark) a sud in colonna 50-51
rect(t, 48, 21, 53, 21, 'T');
[[48, 22], [50, 22], [52, 22], [49, 24], [51, 24], [53, 24]]
  .forEach(([x, y]) => { t[y][x] = 'G'; });

// alberi sparsi
[[20, 9], [33, 9], [21, 25], [35, 27], [48, 26], [50, 30], [18, 30], [3, 22], [24, 21]]
  .forEach(([x, y]) => { if (t[y][x] === '.') t[y][x] = 'T'; });

/* ---------------- arredo urbano ---------------- */
// coordinate congelate: l'arredo non deve mai coprirle (porte, transenna,
// cartello, spawn, uscite est, riva del lago, npc)
const FROZEN = new Set([
  '9,6', '23,6', '42,6', '12,20', '42,20', '47,28', // porte
  '50,0', // transenna bosco
  '30,30', // cartello benvenuti
  '28,31', // spawn
  (W - 1) + ',14', (W - 1) + ',15', // uscite est
  '15,28', // riva del lago
  '25,16', '44,10', '12,9', '16,25' // npc: bobby, donna, audrey, jacoby
]);
function open(x, y) { return t[y] && (t[y][x] === '.' || t[y][x] === '=' || t[y][x] === ','); }
function place(x, y, ch) {
  if (!open(x, y) || FROZEN.has(x + ',' + y)) return;
  t[y][x] = ch;
}

// 1. marciapiedi che incorniciano la strada orizzontale e quella verticale
for (let x = 1; x < W - 1; x++) {
  if (t[13][x] === '.') t[13][x] = '=';
  if (t[16][x] === '.') t[16][x] = '=';
}
for (let y = 16; y <= H - 3; y++) {
  if (t[y][26] === '.') t[y][26] = '=';
  if (t[y][29] === '.') t[y][29] = '=';
}

// 2. strisce pedonali dove i vialetti incontrano la strada, e all'incrocio
[[9, 10], [12, 13], [42, 43], [27, 28]].forEach(([x1, x2]) => {
  t[14][x1] = '-'; t[14][x2] = '-';
  t[15][x1] = '-'; t[15][x2] = '-';
});

// 3. lampioni lungo i marciapiedi, lati alternati, ogni 6 tile (~9 totali)
[[4, 13], [16, 13], [28, 13], [40, 13], [52, 13],
  [10, 16], [22, 16], [34, 16], [46, 16]]
  .forEach(([x, y]) => place(x, y, 'L'));

// 4. pali del telefono, un solo lato del marciapiede, ogni ~12 tile
[[6, 16], [18, 16], [32, 16], [44, 16]].forEach(([x, y]) => place(x, y, 'P'));

// 5. staccionata bianca: giardino di casa Palmer (varco sul vialetto) + riva est del lago
for (let x = 37; x <= 46; x++) if (x !== 42) place(x, 7, 'F');
for (let y = 26; y <= 31; y++) place(14, y, 'F');

// 6. aiuole fiorite ai lati delle porte (hotel, ospedale, distretto, diner)
[[8, 7], [10, 7], [22, 7], [24, 7], [11, 21], [13, 21], [41, 21], [43, 21]]
  .forEach(([x, y]) => place(x, y, 'A'));

// 7. idranti vicino alla piazza e al diner
place(32, 30, 'H');
place(48, 19, 'H');

// 8. cassette postali davanti ai vialetti di casa Palmer e dell'hotel
place(10, 13, 'E');
place(43, 13, 'E');

// 9/10. cespugli ed erba fiorita sparsi sull'erba aperta, deterministico (hash x,y)
const DOORS = [[9, 6], [23, 6], [42, 6], [12, 20], [42, 20], [47, 28]];
function nearDoor(x, y) { return DOORS.some(([dx, dy]) => Math.abs(dx - x) <= 1 && Math.abs(dy - y) <= 1); }
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    if (t[y][x] !== '.' || nearDoor(x, y) || FROZEN.has(x + ',' + y)) continue;
    if (x >= 48 && x <= 53 && y >= 21 && y <= 25) continue; // camposanto
    const hb = (x * 31 + y * 17) % 94;
    const hf = (x * 19 + y * 23) % 67;
    if (hb === 5) t[y][x] = 'n';
    else if (hf === 8) t[y][x] = ',';
  }
}

// 11. piccola piazza attorno al cartello di benvenuto: anello di marciapiede,
// due panchine ai lati e un'aiuola, senza toccare le 4 celle cardinali del cartello
[[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]
  .forEach(([dx, dy]) => { if (t[30 + dy][30 + dx] === '.') t[30 + dy][30 + dx] = '='; });
t[29][29] = 'B'; t[31][31] = 'B'; t[29][31] = 'A';

/* ---------------- WOODS 28x22 ---------------- */
const WW = 28, WH = 22;
const wd = grid(WW, WH, 'g');
border(wd, 'T');
// alberi interni sparsi (fitti, deterministico)
for (let y = 1; y < WH - 1; y++) {
  for (let x = 1; x < WW - 1; x++) {
    if ((x * 31 + y * 17) % 7 === 0) wd[y][x] = 'T';
  }
}
// passaggio con le tende in alto al centro -> Red Room
rect(wd, 12, 0, 15, 0, 'R'); wd[0][14] = 'D';
// sentiero verticale
for (let y = 1; y <= WH - 1; y++) { wd[y][14] = 'p'; }
// cerchio di sicomori attorno all'olio (Glastonbury Grove)
const cx = 14, cy = 10;
[[-3, 0], [3, 0], [-2, -2], [2, -2], [-2, 2], [2, 2], [0, -3], [0, 3]]
  .forEach(([dx, dy]) => { wd[cy + dy][cx + dx] = 'Y'; });
rect(wd, 13, 9, 14, 10, 'o');
wd[11][14] = 'p'; // il sentiero riprende sotto l'olio
// radura attorno al cerchio
for (let y = cy - 3; y <= cy + 3; y++) for (let x = cx - 4; x <= cx + 4; x++) {
  if (wd[y][x] === 'T') wd[y][x] = 'g';
}
// cartello Glastonbury Grove
wd[14][11] = 'S';
if (wd[14][12] === 'T') wd[14][12] = 'g';
// un po' di arredo al sentiero verso l'uscita sud, senza toccare il sentiero (x14)
if (wd[20][12] === 'g') wd[20][12] = 'n';
if (wd[20][16] === 'g') wd[20][16] = 'n';
if (wd[19][17] === 'g') wd[19][17] = 'B';

/* ---------------- validazione ---------------- */
const SOLID = {
  T: 1, S: 1, w: 1, '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, i: 1, C: 1, t: 1, h: 1, K: 1, U: 1, Y: 1, R: 1, M: 1, v: 1, o: 1,
  L: 1, P: 1, B: 1, F: 1, A: 1, H: 1, E: 1, n: 1, // arredo urbano
  G: 1 // lapide del cimitero
};
function bfs(g, sx, sy) {
  const h = g.length, w = g[0].length;
  const seen = new Set([sx + ',' + sy]);
  const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen.has(k)) continue;
      const ch = g[ny][nx];
      if (SOLID[ch]) continue; // X e D sono attraversabili
      seen.add(k); q.push([nx, ny]);
    }
  }
  return seen;
}
function reach(seen, x, y, label) {
  const ok = seen.has(x + ',' + y) ||
    [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has((x + dx) + ',' + (y + dy)));
  if (!ok) throw new Error('NON raggiungibile: ' + label + ' @' + x + ',' + y);
  console.log('  ok ' + label);
}
// emendamento del Senato: le coordinate preesistenti NON devono spostarsi quando
// la griglia viene rigenerata con nuovi edifici (ospedale/roadhouse).
function assertChar(x, y, ch, label) {
  if (t[y][x] !== ch) throw new Error('coordinata alterata: ' + label + ' atteso "' + ch + '" trovato "' + t[y][x] + '" @' + x + ',' + y);
  console.log('  ok invariato ' + label);
}
function assertWalkable(x, y, label) {
  if (SOLID[t[y][x]]) throw new Error('coordinata alterata: ' + label + ' non piu\' calpestabile @' + x + ',' + y);
  console.log('  ok invariato (calpestabile) ' + label);
}

const seenT = bfs(t, 28, 31);
console.log('# town — invarianti (coordinate preesistenti)');
assertChar(9, 6, 'D', 'porta hotel');
assertChar(42, 6, 'D', 'porta palmer');
assertChar(12, 20, 'D', 'porta sceriffo');
assertChar(42, 20, 'D', 'porta diner');
assertChar(50, 0, 'X', 'transenna bosco');
assertChar(30, 30, 'S', 'cartello');
assertWalkable(28, 31, 'spawn');
reach(seenT, 50, 23, 'corridoio cimitero');
reach(seenT, 50, 22, 'tomba di Laura');
assertWalkable(W - 1, 14, 'uscita est (vagone)');
assertWalkable(W - 1, 15, 'uscita est (vagone)');
for (let ly = 26; ly <= 31; ly++) for (let lx = 4; lx <= 13; lx++) {
  if (t[ly][lx] !== 'w') throw new Error('lago alterato @' + lx + ',' + ly);
}
console.log('  ok invariato lago');
assertWalkable(15, 28, 'riva del lago (lago_riva)');

console.log('# town — raggiungibilita\'');
reach(seenT, 9, 6, 'porta hotel');
reach(seenT, 42, 6, 'porta palmer');
reach(seenT, 12, 20, 'porta sceriffo');
reach(seenT, 42, 20, 'porta diner');
reach(seenT, 50, 0, 'transenna bosco');
reach(seenT, 30, 30, 'cartello');
reach(seenT, 23, 6, 'porta ospedale');
reach(seenT, 47, 28, 'porta roadhouse');
reach(seenT, 15, 28, 'riva del lago (lago_riva)');
reach(seenT, W - 1, 14, 'uscita est (vagone)');
[[25, 16, 'bobby'], [44, 10, 'donna'], [12, 9, 'audrey'], [16, 25, 'jacoby']]
  .forEach(([x, y, n]) => {
    assertWalkable(x, y, 'npc ' + n);
    reach(seenT, x, y, 'npc ' + n);
  });

const seenW = bfs(wd, 14, 20);
console.log('# woods');
reach(seenW, 14, 0, 'porta redroom');
reach(seenW, 14, 21, 'uscita sud');
reach(seenW, 14, 10, 'olio');
reach(seenW, 11, 14, 'cartello grove');

/* ---------------- stampa ---------------- */
function dump(g, name) {
  console.log('--- ' + name + ' ---');
  g.forEach((row, i) => console.log("        '" + row.join('') + "'" + (i < g.length - 1 ? ',' : '') + ' // ' + i));
}
dump(t, 'town');
dump(wd, 'woods');
