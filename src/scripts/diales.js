// Laboratorio "la web es el sistema" (fase 1).
// Cuatro diales (escala, ritmo, contraste, caos) reescriben las variables CSS de toda la página
// y recomponen las formas. "Vestir" cambia la identidad completa. El estado vive en la URL (#e-r-c-k-marca)
// y su número de edición sale del propio estado: la misma combinación siempre es la misma edición.

const DIALS = [
  { id: 'e', name: 'escala' },
  { id: 'r', name: 'ritmo' },
  { id: 'c', name: 'contraste' },
  { id: 'k', name: 'caos' },
];

// Marcas. nórdika y pulpa son ficticias, de laboratorio, hasta tener casos reales con permiso.
const BRANDS = {
  // minərvo fresco: crema, bloques de color y display grueso
  minervo: {
    name: 'minərvo', g: '#f4ebe1', t: '#0b0b0d', ci: '#0b0b0d', paper: '#fffaf3',
    p: ['#5fe3a1', '#ff5b2e', '#ffb800', '#1fbf5f', '#ff9ec7', '#9b7bff'],
    font: '"Geist",system-ui,sans-serif', hfont: '"Bricolage","Geist",sans-serif', case: 'none', radius: 32,
    shapes: ['circulo', 'dona', 'luna', 'triangulo', 'pildora', 'cuadrado'],
  },
  nordika: {
    name: 'nórdika', g: '#e6e9e4', t: '#14213d', ci: '#f4f1ea', paper: '#f7f6f1',
    p: ['#2f5d8a', '#c2593f', '#4f7564', '#3d405b', '#a2821c', '#14213d'],
    font: 'Georgia,"Times New Roman",serif', hfont: 'Georgia,"Times New Roman",serif', case: 'none', radius: 0,
    shapes: ['circulo', 'cuadrado', 'triangulo'],
  },
  pulpa: {
    name: 'pulpa', g: '#ff5a36', t: '#1d0b2e', ci: '#1d0b2e', paper: '#fff3e0',
    p: ['#ffd23f', '#3bceac', '#fff3e0', '#c9b6ff', '#ffb3c7', '#ffd23f'],
    font: '"Geist",system-ui,sans-serif', hfont: 'var(--poster)', case: 'uppercase', radius: 48,
    shapes: ['circulo', 'dona', 'pildora', 'luna'],
  },
};

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

  /* ---------- titular: cada letra con su propio azar ---------- */
  const h1 = root.querySelector('#h1');
  const words = h1.textContent.split(' ');
  const R = rng(7);
  h1.innerHTML = words
    .map((w, wi) => `<span class="w${wi === 1 ? ' hlw' : ''}">` + [...w].map((ch) =>
      `<span class="ch" aria-hidden="true" style="--rx:${(R() * 2 - 1).toFixed(3)};--ry:${(R() * 2 - 1).toFixed(3)};--rr:${(R() * 2 - 1).toFixed(3)}">${ch}</span>`).join('') + '</span>')
    .join(' ');

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
    comp.innerHTML = seeds.map((sd, i) => `<g data-i="${i}">${shapeSVG(kinds[Math.floor(sd.pick * kinds.length)])}</g>`).join('');
  }

  function layoutShapes() {
    const { e, r, c, k } = state;
    const cols = Math.round(lerp(3, 9, r));
    const rows = Math.max(2, Math.round(cols * (H / W)));
    const n = Math.min(MAX, cols * rows);
    const cw = W / cols, ch = H / rows;
    const base = Math.min(cw, ch) / 40 * lerp(0.45, 1.15, e);
    const pal = BRANDS[state.b].p;
    comp.querySelectorAll('g').forEach((g, i) => {
      const sd = seeds[i];
      if (i >= n) { g.style.opacity = '0'; g.style.transform = `translate(${W / 2}px,${H / 2}px) scale(0)`; return; }
      const gx = (i % cols + 0.5) * cw, gy = (Math.floor(i / cols) + 0.5) * ch;
      const x = lerp(gx, sd.x * W, k), y = lerp(gy, sd.y * H, k);
      // rotación: a 0 el sistema es ortogonal (múltiplos de 90°), con caos se suelta
      const ortho = Math.round(sd.rot / 90) * 90;
      const rot = lerp(ortho, sd.rot, k);
      const sc = base * lerp(1, sd.s, k);
      g.style.opacity = '1';
      g.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${sc.toFixed(3)})`;
      // contraste bajo: todo en un solo tono; alto: paleta completa
      const col = c < 0.25 ? 'var(--t)' : (i % 7 === 3 ? "var(--paper)" : `var(--p${(i + Math.floor(sd.pick * 5)) % 5})`);
      const op = lerp(0.25, 1, clamp01(c * 1.4));
      g.querySelectorAll('.sh').forEach((s) => {
        if (s.classList.contains('s')) s.style.stroke = col; else s.style.fill = col;
        s.style.opacity = op.toFixed(2);
      });
    });
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
    s.setProperty('--ci', B.ci); s.setProperty('--paper', B.paper);
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
