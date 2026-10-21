// Generadores de puntos para cada formación. Devuelven coordenadas locales al ancla.
const FONT = '"Geist","Helvetica Neue",Arial,sans-serif';

// Muestrea una figura dibujada en un canvas oculto con una retícula hexagonal de paso p.
function sample(draw, rw, rh, p) {
  const oc = document.createElement('canvas');
  oc.width = rw; oc.height = rh;
  const o = oc.getContext('2d');
  draw(o);
  const d = o.getImageData(0, 0, rw, rh).data;
  const pts = [];
  let row = 0;
  for (let y = p / 2; y < rh; y += p * 0.87, row++) {
    for (let x = p / 2 + (row % 2 ? p / 2 : 0); x < rw; x += p) {
      if (d[(Math.floor(y) * rw + Math.floor(x)) * 4 + 3] > 128) pts.push({ x, y });
    }
  }
  return pts;
}

// La ə del wordmark más su punto, ajustada al rectángulo y con al menos `want` puntos.
export function glyphPoints(width, height, want) {
  const rw = Math.max(80, Math.floor(width));
  const rh = Math.max(80, Math.floor(height));
  const m = document.createElement('canvas').getContext('2d');
  m.font = '600 100px ' + FONT;
  const mm = m.measureText('ə');
  const A = (mm.actualBoundingBoxAscent || 55) / 100;
  const D = (mm.actualBoundingBoxDescent || 2) / 100;
  const gw = mm.width / 100, gh = A + D;
  const fs = Math.min((rh / gh) * 0.92, (rw / (gw + 0.32)) * 0.92);
  const dotR = fs * 0.075;
  const x0 = (rw - (gw * fs + fs * 0.05 + dotR * 2)) / 2;
  const base = (rh - gh * fs) / 2 + A * fs;
  const dx = x0 + gw * fs + fs * 0.05 + dotR, dy = base - dotR;

  const glyph = (o) => { o.fillStyle = '#000'; o.font = `600 ${fs}px ${FONT}`; o.fillText('ə', x0, base); };
  const dot = (o) => { o.fillStyle = '#000'; o.beginPath(); o.arc(dx, dy, dotR, 0, Math.PI * 2); o.fill(); };

  let p = 160, g = [], dt = [];
  for (; p >= 12; p -= 2) {
    g = sample(glyph, rw, rh, p);
    dt = sample(dot, rw, rh, p);
    if (g.length + dt.length >= want) break;
  }
  if (!dt.length) dt = [{ x: dx, y: dy }];
  return { glyph: g, dot: dt, p };
}

// n puntos en una grilla centrada dentro del rectángulo.
export function gridPoints(rw, rh, n) {
  const cols = Math.max(1, Math.ceil(Math.sqrt((n * rw) / Math.max(1, rh))));
  const rows = Math.ceil(n / cols);
  const p = Math.min(rw / cols, rh / rows);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    pts.push({ x: (rw - cols * p) / 2 + p / 2 + c * p, y: (rh - rows * p) / 2 + p / 2 + r * p });
  }
  return { pts, p };
}

// n puntos en filas desfasadas, como la grilla op-art.
export function stripePoints(rw, rh, n, rows = 3) {
  const cols = Math.ceil(n / rows);
  const px = rw / cols, py = rh / rows;
  const p = Math.min(px * 1.6, py * 0.9);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const row = i % rows, c = Math.floor(i / rows);
    pts.push({ x: px * (c + 0.5) + (row % 2 ? px * 0.35 : 0), y: py * (row + 0.5) });
  }
  return { pts, p };
}

// Puntos alrededor del borde de un rectángulo, por fuera, para enmarcar un video o imagen.
// Devuelve coordenadas locales al rectángulo (pueden ser negativas).
export function framePoints(rw, rh, n) {
  const L = 2 * (rw + rh);
  const step = L / n;
  const p = Math.min(step, 64);
  const pad = p * 0.55 + 6;
  const W = rw + pad * 2, H = rh + pad * 2, P = 2 * (W + H);
  const pts = [];
  for (let i = 0; i < n; i++) {
    let d = ((i + 0.5) / n) * P;
    let x, y;
    if (d < W) { x = d; y = 0; }
    else if ((d -= W) < H) { x = W; y = d; }
    else if ((d -= H) < W) { x = W - d; y = H; }
    else { d -= W; x = 0; y = H - d; }
    pts.push({ x: x - pad, y: y - pad });
  }
  return { pts, p };
}
