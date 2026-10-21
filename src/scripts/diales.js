// Laboratorio "la web es el sistema" (fase 1).
// Cuatro diales (escala, ritmo, contraste, caos) reescriben las variables CSS de toda la página
// y recomponen las formas. "Vestir" cambia la identidad completa. El estado vive en la URL (#e-r-c-k-marca)
// y su número de edición sale del propio estado: la misma combinación siempre es la misma edición.

import { VOICES } from './voces.js';
import { initVida } from './vida.js';

const DIALS = [
  { id: 'e', name: 'escala' },
  { id: 'r', name: 'ritmo' },
  { id: 'c', name: 'contraste' },
  { id: 'k', name: 'caos' },
];

// Marcas. Además de minərvo, dos marcas reales de Jay para probar "vestir": Coresolutions (tokens de su
// sistema de diseño) y Jay Jaramillo (su web personal). Cada marca trae también sus REGLAS: el sistema
// las respeta aunque giren los diales (p. ej. sin ángulos, peso máximo, mucho espacio vacío).
// ink: [oscuro, claro] — el texto de cada bloque se elige solo según el color de fondo.
const BRANDS = {
  // minərvo fresco: crema, bloques de color y display grueso
  minervo: {
    name: 'minərvo', g: '#f4ebe1', t: '#0b0b0d', ink: ['#0b0b0d', '#fffaf3'], paper: '#fffaf3',
    p: ['#5fe3a1', '#ff5b2e', '#ffb800', '#1fbf5f', '#ff9ec7', '#9b7bff'],
    font: '"Geist",system-ui,sans-serif', hfont: '"Bricolage","Geist",sans-serif', case: 'none', radius: 32,
    shapes: ['circulo', 'dona', 'luna', 'triangulo', 'pildora', 'cuadrado'],
    rules: { wmax: 800, angles: true, density: 1, border: 0, mono: false },
  },
  // Coresolutions: navy #01095c, rampa de azules, IBM Plex Sans 600 como máximo, esquinas a 0
  coresolutions: {
    name: 'coresolutions', g: '#ffffff', t: '#12151c', ink: ['#12151c', '#ffffff'], paper: '#f2f6f9',
    p: ['#01095c', '#2d43e7', '#161f7e', '#3c4cd7', '#2433a8', '#00043e'],
    font: '"IBM Plex Sans",system-ui,sans-serif', hfont: '"IBM Plex Sans",system-ui,sans-serif', case: 'none', radius: 0,
    shapes: ['cuadrado', 'circulo'],
    rules: { wmax: 600, angles: false, density: 1, border: 30, mono: false, snap: 50, links: true },
  },
  // Jay Jaramillo: negro puro, Geist Mono, nada de pesos gruesos, sin ángulos que no sean rectos, espacio vacío
  jay: {
    name: 'jay jaramillo', g: '#000000', t: '#ffffff', ink: ['#000000', '#ffffff'], paper: '#000000',
    p: ['#000000', '#ffffff', '#000000', '#000000', '#000000', '#000000'],
    font: '"Geist Mono",ui-monospace,monospace', hfont: '"Geist Mono",ui-monospace,monospace', case: 'none', radius: 0,
    shapes: ['circulo', 'cuadrado'],
    rules: { wmax: 500, angles: false, density: 0.3, border: 45, mono: true },
  },
  // ANKLA: negro, Geist Mono fino con remate en negrita, salvia y terracota, radar de vida en vez de formas
  ankla: {
    name: 'ankla', g: '#0a0a0a', t: '#f5f5f5', ink: ['#0a0a0a', '#f5f5f5'], paper: '#0a0a0a',
    p: ['#a3ad86', '#d97757', '#171717', '#171717', '#171717', '#0f0f0f'],
    font: '"Geist Mono Var","Geist Mono",ui-monospace,monospace', hfont: '"Geist Mono Var","Geist Mono",ui-monospace,monospace', case: 'none', radius: 8,
    shapes: ['circulo'],
    rules: { wmax: 900, angles: true, density: 1, border: 15, mono: true, radar: true },
  },
  // A Todo Terreno: arena, tinta y rojo de sello; Anton en mayúsculas; mapa topográfico con ruta
  todoterreno: {
    name: 'a todo terreno', g: '#f3ead5', t: '#14110d', ink: ['#14110d', '#f3eee2'], paper: '#f3eee2',
    p: ['#c41e1e', '#d3ac66', '#b98a3a', '#241f18', '#14110d', '#e4cb98'],
    font: '"JetBrains Mono",ui-monospace,monospace', hfont: 'var(--poster)', case: 'uppercase', radius: 2,
    shapes: ['circulo'],
    rules: { wmax: 900, angles: true, density: 1, border: 55, mono: true, route: true },
  },
};

// color de texto legible sobre un fondo (mezcla aproximada del color con el papel según el contraste)
function hexRGB(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function lum([r, g, b]) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function inkFor(bgHex, paperHex, amount, ink) {
  const a = hexRGB(bgHex), b = hexRGB(paperHex);
  const m = a.map((v, i) => v * amount + b[i] * (1 - amount));
  const L = lum(m), Ld = lum(hexRGB(ink[0])), Ll = lum(hexRGB(ink[1]));
  const cd = (Math.max(L, Ld) + 0.05) / (Math.min(L, Ld) + 0.05), cl = (Math.max(L, Ll) + 0.05) / (Math.min(L, Ll) + 0.05);
  return cd >= cl ? ink[0] : ink[1];
}

const MAX = 64; // formas en la composición
const W = 1000, H = 1000;

// aleatorio con semilla (las posiciones "caóticas" son siempre las mismas para cada forma)
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

function shapeSVG(kind) {
  // todas centradas en 0,0 y de ~40 unidades
  switch (kind) {
    case 'circulo': return '<circle class="sh f" r="20"/>';
    case 'dona': return '<circle class="sh s" r="14" fill="none" stroke-width="12"/>';
    case 'luna': return '<path class="sh f" d="M-22 -8 A22 22 0 0 0 22 -8 Z"/>';
    case 'triangulo': return '<path class="sh f" d="M-17 -20 L23 0 L-17 20 Z"/>';
    case 'pildora': return '<rect class="sh f" x="-26" y="-11" width="52" height="22" rx="11"/>';
    default: return '<rect class="sh f" x="-18" y="-18" width="36" height="36"/>';
  }
}

export function initDiales(root) {
  if (!root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = { e: 0.5, r: 0.5, c: 0.85, k: 0, b: 'minervo' };
  readHash();
  const vida = initVida(root);

  /* ---------- titular: cada letra con su propio azar ---------- */
  const h1 = root.querySelector('#h1');
  function buildH1(text, hl, boldFrom = 99) {
    const Rh = rng(7);
    h1.setAttribute('aria-label', text);
    let li = 0;
    h1.innerHTML = text.split(' ')
      .map((w, wi) => (wi === hl ? `<span class="w hlw" style="--cc:var(--p1);--hl0:${li}" data-cc="p1" data-solid>` : `<span class="w${wi >= boldFrom ? ' bw' : ''}" style="--w0:${li}">`) + [...w].map((ch) =>
        `<span class="ch" aria-hidden="true" style="--li:${li++};--rx:${(Rh() * 2 - 1).toFixed(3)};--ry:${(Rh() * 2 - 1).toFixed(3)};--rr:${(Rh() * 2 - 1).toFixed(3)}">${ch}</span>`).join('') + '</span>')
      .join(' ') + '<span class="caret" aria-hidden="true"></span>';
  }
  const R = rng(11);

  /* ---------- voz: el texto de toda la página según la marca ---------- */
  const track = root.querySelector('#track');
  let copyBrand = '';
  function setCopy(brand) {
    if (brand === copyBrand) return;
    const first = !copyBrand;
    copyBrand = brand;
    const V = VOICES[brand] || VOICES.minervo;
    root.querySelectorAll('[data-t]').forEach((el) => {
      const v = el.dataset.t.split('.').reduce((o, k) => (o == null ? o : o[k]), V);
      el.textContent = v ?? '';
    });
    buildH1(V.h1, V.hl, V.boldFrom);
    const items = V.ticker.map((t) => `<span>${t}<i>${V.sep}</i></span>`).join('');
    track.innerHTML = items + items;
    vida.brand(brand, first);
  }

  // tarjetas y filas: también con su azar
  root.querySelectorAll('.dl-services .dl-card,.dl-case,.dl-art').forEach((el) => {
    el.style.setProperty('--rx', (R() * 2 - 1).toFixed(3));
    el.style.setProperty('--ry', (R() * 2 - 1).toFixed(3));
    el.style.setProperty('--rr', (R() * 2 - 1).toFixed(3));
  });

  /* ---------- composición de formas ---------- */
  const comp = root.querySelector('#comp');
  const seeds = Array.from({ length: MAX }, (_, i) => {
    const r = rng(1000 + i * 97);
    return { x: r(), y: r(), rot: r() * 360, s: 0.6 + r() * 1.2, pick: r() };
  });
  let compKinds = '';
  function buildShapes() {
    const kinds = BRANDS[state.b].shapes;
    const key = kinds.join();
    if (key === compKinds) return;
    compKinds = key;
    comp.innerHTML = seeds.map((sd, i) => `<g data-i="${i}"><g class="fl" style="--d:${(sd.pick * 6).toFixed(2)}">${shapeSVG(kinds[Math.floor(sd.pick * kinds.length)])}</g></g>`).join('') + '<g class="ov"></g>';
  }

  function layoutShapes() {
    const { e, r, c, k } = state;
    const cols = Math.round(lerp(3, 9, r));
    const rows = Math.max(2, Math.round(cols * (H / W)));
    const B = BRANDS[state.b], rules = B.rules;
    const cells = cols * rows;
    const n = Math.min(MAX, Math.max(3, Math.round(cells * rules.density)));
    const step = cells / n; // con menos densidad, las formas ocupan celdas salteadas: más espacio vacío
    const cw = W / cols, ch = H / rows;
    const base = Math.min(cw, ch) / 40 * lerp(0.45, 1.15, e);
    const pal = BRANDS[state.b].p;
    const pts = [];
    comp.querySelectorAll('g[data-i]').forEach((g, i) => {
      const sd = seeds[i];
      if (i >= n) { g.style.opacity = '0'; g.style.transform = `translate(${W / 2}px,${H / 2}px) scale(0)`; return; }
      const cell = Math.floor(i * step);
      const gx = (cell % cols + 0.5) * cw, gy = (Math.floor(cell / cols) + 0.5) * ch;
      let x = lerp(gx, sd.x * W, k), y = lerp(gy, sd.y * H, k);
      if (rules.snap) { x = Math.round(x / rules.snap) * rules.snap; y = Math.round(y / rules.snap) * rules.snap; }
      pts.push([x, y]);
      // rotación: a 0 el sistema es ortogonal (múltiplos de 90°), con caos se suelta
      const ortho = Math.round(sd.rot / 90) * 90;
      const rot = rules.angles ? lerp(ortho, sd.rot, k) : ortho;
      const sc = base * lerp(1, sd.s, k);
      g.style.opacity = '1';
      g.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${sc.toFixed(3)})`;
      // contraste bajo: todo en un solo tono; alto: paleta completa
      const col = c < 0.25 || rules.mono ? 'var(--t)' : (i % 7 === 3 ? "var(--paper)" : `var(--p${(i + Math.floor(sd.pick * 5)) % 5})`);
      const op = lerp(0.25, 1, clamp01(c * 1.4));
      g.querySelectorAll('.sh').forEach((s) => {
        if (s.classList.contains('s')) s.style.stroke = col; else s.style.fill = col;
        s.style.opacity = op.toFixed(2);
      });
    });
    const ov = comp.querySelector('.ov');
    // A Todo Terreno: mapa topográfico con la ruta secreta, pistas y un sello
    if (rules.route) {
      comp.querySelectorAll('g[data-i]').forEach((g) => { g.style.opacity = '0'; });
      const L = (VOICES[state.b] || {}).art || [];
      const rings = Math.round(lerp(4, 9, r)), cx0 = 560, cy0 = 470;
      let svg = '';
      for (let j = 0; j < rings; j++) {
        const rad = (60 + j * 52) * lerp(0.8, 1.2, e);
        let d = '';
        for (let a = 0; a <= 48; a++) {
          const t = (a / 48) * Math.PI * 2;
          const w = 1 + 0.16 * Math.sin(t * 3 + j) + 0.08 * Math.cos(t * 5 - j * 0.7) + k * 0.12 * Math.sin(t * 7 + j * 2);
          d += `${a ? 'L' : 'M'}${(cx0 + Math.cos(t) * rad * w * 1.25).toFixed(1)} ${(cy0 + Math.sin(t) * rad * w).toFixed(1)}`;
        }
        svg += `<path d="${d}Z" fill="none" stroke="currentColor" stroke-opacity="${(0.14 + j * 0.015).toFixed(3)}" stroke-width="1.5"/>`;
      }
      const wp = L.map((_, i) => {
        const f = i / (L.length - 1);
        return [lerp(110, 860, f) + (seeds[i].x - 0.5) * 120 * (0.4 + k), lerp(860, 170, f) + Math.sin(f * 5 + e * 3) * 110 + (seeds[i].y - 0.5) * 140 * k];
      });
      let rd = `M${wp[0][0].toFixed(1)} ${wp[0][1].toFixed(1)}`;
      for (let i = 1; i < wp.length; i++) {
        const [ax, ay] = wp[i - 1], [bx, by] = wp[i];
        rd += `Q${((ax + bx) / 2 + (ay - by) * 0.35).toFixed(1)} ${((ay + by) / 2 + (bx - ax) * 0.35).toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
      }
      svg += `<path class="rt" d="${rd}" fill="none" stroke="#c41e1e" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 16"/>`;
      svg += wp.map(([x, y], i) => `<g class="wp" style="--d:${i * 0.25}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i === wp.length - 1 ? 16 : 10}" fill="${i === wp.length - 1 ? '#c41e1e' : 'currentColor'}"/><text x="${(x + 22).toFixed(1)}" y="${(y - 18).toFixed(1)}" font-family="JetBrains Mono, monospace" font-size="20" font-weight="700" fill="currentColor">${L[i]}</text></g>`).join('');
      svg += `<g class="stamp" transform="translate(800 820) rotate(-14)"><circle r="104" fill="none" stroke="#c41e1e" stroke-width="6"/><circle r="86" fill="none" stroke="#c41e1e" stroke-width="2"/><text text-anchor="middle" y="-14" font-family="Anton, Impact, sans-serif" font-size="46" fill="#c41e1e">SELLADO</text><text text-anchor="middle" y="30" font-family="JetBrains Mono, monospace" font-size="20" font-weight="700" letter-spacing="3" fill="#c41e1e">AT26 · ${String(edition()).padStart(4, '0')}</text></g>`;
      ov.innerHTML = svg;
      return;
    }
    // ANKLA: un radar de vida en lugar de formas; cada dial mueve sus áreas
    if (rules.radar) {
      comp.querySelectorAll('g[data-i]').forEach((g) => { g.style.opacity = '0'; });
      const L = (VOICES[state.b] || {}).art || [];
      const N = L.length, cx = 500, cy = 520, Rr = 300 * lerp(0.8, 1.1, e);
      const vals = [e, r, c, 1 - k, (e + c) / 2, (r + k) / 2, 1 - e * 0.5, c * 0.8 + 0.2]
        .map((v, i) => clamp01(0.25 + 0.75 * v + (seeds[i].x - 0.5) * k * 0.5));
      const at = (i, f) => { const a = -Math.PI / 2 + (i / N) * Math.PI * 2; return [cx + Math.cos(a) * Rr * f, cy + Math.sin(a) * Rr * f]; };
      const poly = vals.map((v, i) => at(i, v)).map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('') + 'Z';
      let svg = [0.25, 0.5, 0.75, 1].map((f) => `<polygon points="${L.map((_, i) => at(i, f).map((n) => n.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="currentColor" stroke-opacity=".16"/>`).join('');
      svg += L.map((_, i) => { const [x, y] = at(i, 1); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="currentColor" stroke-opacity=".16"/>`; }).join('');
      svg += L.map((t, i) => { const [x, y] = at(i, 1.17); return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-family="Geist Mono, monospace" font-size="20" fill="currentColor" fill-opacity=".7">● ${t}</text>`; }).join('');
      svg += `<g class="rd"><path class="rd-poly" style="d:path('${poly}')" fill="#a3ad86" fill-opacity=".22" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>` +
        vals.map((v, i) => { const [x, y] = at(i, v); return `<circle class="rd-dot" style="--d:${i * 0.3}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="currentColor"/>`; }).join('') + '</g>';
      const day = Math.max(1, Math.round(lerp(1, 240, (e + r + c) / 3)));
      svg += `<g transform="translate(70 70) rotate(-6)"><rect width="230" height="108" rx="8" fill="#171717" stroke="#3a3a3a"/><text x="24" y="58" font-family="Geist Mono, monospace" font-size="40" font-weight="700" fill="#f5f5f5">Día ${day}</text><text x="24" y="88" font-family="Geist Mono, monospace" font-size="16" letter-spacing="3" fill="#a3a3a3">RACHA</text></g>`;
      ov.innerHTML = svg;
      return;
    }
    // capa técnica (Coresolutions): enlaces entre nodos y etiquetas de datos en mono
    const labels = (VOICES[state.b] || {}).art || [];
    if (!rules.links || !pts.length) { if (ov) ov.innerHTML = ''; return; }
    let d = '';
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      if (Math.hypot(ax - bx, ay - by) < 420) d += `M${ax.toFixed(0)} ${ay.toFixed(0)}L${bx.toFixed(0)} ${ay.toFixed(0)}L${bx.toFixed(0)} ${by.toFixed(0)}`;
    }
    const step2 = Math.max(1, Math.floor(pts.length / labels.length));
    ov.innerHTML = `<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" opacity=".45"/>` +
      labels.map((t, j) => { const q = pts[Math.min(pts.length - 1, j * step2)]; return `<text x="${(q[0] + 26).toFixed(0)}" y="${(q[1] - 26).toFixed(0)}" font-family="Geist Mono, monospace" font-size="22" fill="currentColor">${t}</text>`; }).join('');
  }

  /* ---------- diales ---------- */
  const knobsEl = root.querySelector('#knobs');
  const knobs = {};
  DIALS.forEach((d) => {
    const el = document.createElement('div');
    el.className = 'knob';
    el.tabIndex = 0;
    el.setAttribute('role', 'slider');
    el.setAttribute('aria-label', d.name);
    el.setAttribute('aria-valuemin', '0');
    el.setAttribute('aria-valuemax', '100');
    el.innerHTML = `
      <svg viewBox="0 0 60 60" aria-hidden="true">
        <circle cx="30" cy="30" r="26" fill="none" stroke="#2a2a2e" stroke-width="3"
          stroke-dasharray="122.5 200" transform="rotate(135 30 30)" stroke-linecap="round"/>
        <circle class="arc" cx="30" cy="30" r="26" fill="none" stroke="#8edcb2" stroke-width="3"
          stroke-dasharray="0 200" transform="rotate(135 30 30)" stroke-linecap="round"/>
        <g class="cap"><circle cx="30" cy="30" r="19" fill="#1c1c21" stroke="#3a3a40"/>
          <rect x="28.5" y="13" width="3" height="10" rx="1.5" fill="#f3f0e8"/></g>
      </svg>
      <span class="mono">${d.name}</span><span class="mono val">50</span>`;
    knobsEl.appendChild(el);
    knobs[d.id] = el;

    // arrastre: vertical u horizontal, como una perilla de consola
    let start = null;
    el.addEventListener('pointerdown', (ev) => {
      el.setPointerCapture(ev.pointerId);
      start = { x: ev.clientX, y: ev.clientY, v: state[d.id] };
      el.focus({ preventScroll: true });
    });
    el.addEventListener('pointermove', (ev) => {
      if (!start) return;
      const delta = ((ev.clientX - start.x) - (ev.clientY - start.y)) / 220;
      set(d.id, start.v + delta);
    });
    const end = () => { if (start) { start = null; commit(); } };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('wheel', (ev) => { ev.preventDefault(); set(d.id, state[d.id] - ev.deltaY / 800); commitSoon(); }, { passive: false });
    el.addEventListener('keydown', (ev) => {
      const step = { ArrowUp: 0.02, ArrowRight: 0.02, ArrowDown: -0.02, ArrowLeft: -0.02, PageUp: 0.1, PageDown: -0.1 }[ev.key];
      if (step != null) { ev.preventDefault(); set(d.id, state[d.id] + step); commitSoon(); }
      else if (ev.key === 'Home') { ev.preventDefault(); set(d.id, 0); commitSoon(); }
      else if (ev.key === 'End') { ev.preventDefault(); set(d.id, 1); commitSoon(); }
    });
  });

  function drawKnob(id) {
    const el = knobs[id], v = state[id], pct = Math.round(v * 100);
    el.setAttribute('aria-valuenow', String(pct));
    el.querySelector('.val').textContent = String(pct).padStart(2, '0');
    el.querySelector('.arc').setAttribute('stroke-dasharray', `${(v * 122.5).toFixed(1)} 200`);
    el.querySelector('.cap').setAttribute('transform', `rotate(${(-135 + v * 270).toFixed(1)} 30 30)`);
  }

  /* ---------- aplicar ---------- */
  let raf = 0;
  function set(id, v) {
    state[id] = clamp01(v);
    drawKnob(id);
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; apply(); });
  }

  function apply() {
    const B = BRANDS[state.b];
    const s = root.style;
    ['e', 'r', 'c', 'k'].forEach((id) => s.setProperty('--' + id, state[id].toFixed(3)));
    s.setProperty('--g', B.g); s.setProperty('--t', B.t);
    B.p.forEach((col, i) => s.setProperty('--p' + i, col));
    s.setProperty('--font', B.font); s.setProperty('--hfont', B.hfont); s.setProperty('--case', B.case);
    s.setProperty('--radius-card', String(B.radius));
    s.setProperty('--paper', B.paper); s.setProperty('--ci', B.ink[0]);
    s.setProperty('--wmax', String(B.rules.wmax));
    s.setProperty('--rot', B.rules.angles ? '1' : '0');
    s.setProperty('--bdmin', B.rules.border + '%');
    setCopy(state.b);
    // cada bloque elige su tinta según su fondo real
    root.querySelectorAll('[data-cc]').forEach((el) => {
      const key = el.dataset.cc, solid = el.hasAttribute('data-solid');
      const bg = key === 'paper' ? B.paper : B.p[Number(key.slice(1))];
      el.style.setProperty('--ci', inkFor(bg, B.paper, solid ? 1 : state.c, B.ink));
    });
    root.dataset.brand = state.b;
    root.querySelector('#wear').textContent = state.b === 'minervo' ? '' : '× ' + B.name;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', B.g);
    buildShapes();
    layoutShapes();
    const ed = 'edición nº ' + String(edition()).padStart(4, '0');
    root.querySelector('#edTop').textContent = ed;
    root.querySelectorAll('[data-brand].dl-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.brand === state.b)));
  }

  // número de edición: hash de la combinación (redondeada a lo que se puede elegir con los diales)
  function edition() {
    const str = ['e', 'r', 'c', 'k'].map((id) => Math.round(state[id] * 100)).join('.') + state.b;
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) % 9999 + 1;
  }

  /* ---------- URL ---------- */
  function readHash() {
    const m = location.hash.slice(1).split('-');
    if (m.length !== 5) return;
    ['e', 'r', 'c', 'k'].forEach((id, i) => { const v = Number(m[i]); if (v >= 0 && v <= 100) state[id] = v / 100; });
    if (BRANDS[m[4]]) state.b = m[4];
  }
  function commit() {
    const h = '#' + ['e', 'r', 'c', 'k'].map((id) => Math.round(state[id] * 100)).join('-') + '-' + state.b;
    history.replaceState(null, '', h);
    root.querySelector('#live').textContent = root.querySelector('#edTop').textContent;
  }
  let ct = 0;
  function commitSoon() { clearTimeout(ct); ct = setTimeout(commit, 250); }

  /* ---------- vestir ---------- */
  root.querySelectorAll('[data-brand].dl-btn').forEach((btn) => btn.addEventListener('click', () => {
    const b = btn.dataset.brand;
    if (b === state.b) return;
    const r = btn.getBoundingClientRect();
    document.documentElement.style.setProperty('--vx', ((r.left + r.width / 2) / innerWidth * 100).toFixed(1) + '%');
    document.documentElement.style.setProperty('--vy', ((r.top + r.height / 2) / innerHeight * 100).toFixed(1) + '%');
    const change = () => { state.b = b; apply(); commit(); };
    if (document.startViewTransition && !reduce) {
      root.classList.add('no-tr');
      document.startViewTransition(change).finished.finally(() => root.classList.remove('no-tr'));
    } else change();
  }));

  /* ---------- azar ---------- */
  root.querySelector('#dice').addEventListener('click', () => {
    ['e', 'r', 'c', 'k'].forEach((id) => set(id, Math.random()));
    commitSoon();
  });

  /* ---------- guardar edición: póster PNG + enlace ---------- */
  root.querySelector('#save').addEventListener('click', async () => {
    commit();
    const B = BRANDS[state.b], n = String(edition()).padStart(4, '0');
    try { await navigator.clipboard?.writeText(location.href); } catch (e) {}
    const cv = document.createElement('canvas');
    cv.width = 1200; cv.height = 1500;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = B.g; ctx.fillRect(0, 0, cv.width, cv.height);
    // la composición tal como está (estado final, sin transición)
    const clone = comp.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', '900'); clone.setAttribute('height', '900');
    const cs = getComputedStyle(root);
    clone.querySelectorAll('.sh').forEach((s) => {
      ['fill', 'stroke'].forEach((p) => {
        const v = s.style[p];
        if (v && v.startsWith('var(')) s.style[p] = cs.getPropertyValue(v.slice(4, -1)).trim();
      });
    });
    clone.querySelectorAll('g').forEach((g) => { g.setAttribute('transform', g.style.transform.replace(/px/g, '').replace(/deg/g, '')); g.removeAttribute('style'); if (g.getAttribute('transform').includes('scale(0)')) g.remove(); });
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
    const img = new Image();
    await new Promise((res) => { img.onload = res; img.onerror = res; img.src = url; });
    ctx.drawImage(img, 150, 400);
    URL.revokeObjectURL(url);
    await document.fonts.ready;
    ctx.fillStyle = B.t;
    ctx.font = '500 44px Geist, sans-serif';
    ctx.fillText(state.b === 'minervo' ? 'minərvo.studio' : 'minərvo × ' + B.name, 60, 110);
    ctx.font = '800 180px Bricolage, Geist, sans-serif';
    ctx.fillText('Nº ' + n, 52, 320);
    ctx.font = '500 26px "Geist Mono", monospace';
    ctx.fillText(DIALS.map((d) => d.name + ' ' + Math.round(state[d.id] * 100)).join('  ·  ').toUpperCase(), 60, 1420);
    const a = document.createElement('a');
    a.download = `minervo-edicion-${n}.png`;
    a.href = cv.toDataURL('image/png');
    a.click();
    root.querySelector('#live').textContent = `Edición nº ${n} guardada. Enlace copiado.`;
    const btn = root.querySelector('#save');
    btn.textContent = `nº ${n} · enlace copiado`;
    setTimeout(() => (btn.textContent = 'guardar edición'), 2200);
  });

  DIALS.forEach((d) => drawKnob(d.id));
  apply();
  window.addEventListener('hashchange', () => { readHash(); DIALS.forEach((d) => drawKnob(d.id)); apply(); });
}
