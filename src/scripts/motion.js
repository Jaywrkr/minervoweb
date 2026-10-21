// Pulido de movimiento: scroll suave, cursor propio, titulares que entran con el scroll,
// manifiesto que se ilumina con el scroll y botones magnéticos.
import Lenis from 'lenis';
// Todo se desactiva con movimiento reducido; el cursor y lo magnético solo con mouse.

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = () => matchMedia('(pointer: fine)').matches;
const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, label';

/* ---------- cursor ---------- */
// Un punto que sigue al mouse con un poco de inercia.
// Sobre links y botones se abre en anillo; sobre una forma toma su color y crece (se puede tocar).
export function initCursor(scene) {
  if (reduce() || !fine()) return;
  const el = document.createElement('div');
  el.className = 'cursor';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);
  document.documentElement.classList.add('has-cursor');
  // al cambiar de página, el router reemplaza el body y los atributos de <html>: se vuelve a poner
  document.addEventListener('astro:after-swap', () => {
    document.body.appendChild(el);
    document.documentElement.classList.add('has-cursor');
  });

  let x = -100, y = -100, cx = x, cy = y, visible = false, state = '';
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (!visible) { visible = true; cx = x; cy = y; el.classList.add('is-visible'); }
  }, { passive: true });
  document.addEventListener('pointerleave', () => { visible = false; el.classList.remove('is-visible'); });
  window.addEventListener('pointerdown', () => el.classList.add('is-down'), { passive: true });
  window.addEventListener('pointerup', () => el.classList.remove('is-down'), { passive: true });

  (function tick() {
    cx += (x - cx) * 0.28;
    cy += (y - cy) * 0.28;
    el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;

    let next = '', color = '';
    const target = document.elementFromPoint(x, y);
    if (scene?.dragging) next = 'drag';
    else if (target && target.closest(INTERACTIVE)) next = 'link';
    else if (target && target.id === 'c') {
      color = scene?.shapeAt(x, y) || '';
      if (color) next = 'shape';
    }
    if (next !== state) { el.dataset.state = next; state = next; }
    if (color) el.style.setProperty('--cursor-color', color);
    requestAnimationFrame(tick);
  })();
}

/* ---------- titulares ---------- */
// Cada palabra sube desde una máscara cuando el titular entra en pantalla.
// Sin JS o con movimiento reducido, los titulares se ven normales.
export function initReveal() {
  if (reduce() || !('IntersectionObserver' in window)) return;
  const heads = [...document.querySelectorAll('main h1, main h2')].filter((h) => !h.classList.contains('rv'));
  heads.forEach((h) => {
    const text = h.textContent.replace(/\s+/g, ' ').trim();
    split(h);
    // las palabras animadas se ocultan a lectores de pantalla; este texto las reemplaza
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    h.appendChild(sr);
    h.classList.add('rv');
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('rv-in');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });

  const start = () => heads.forEach((h) => io.observe(h));
  // si el loader está activo, el hero entra cuando la ə se rompe
  if (document.documentElement.classList.contains('is-loading')) {
    window.addEventListener('mnv:intro', () => setTimeout(start, 250), { once: true });
  } else start();
}

// Envuelve cada palabra en <span class="w"><span>palabra</span></span>, conservando <span> de color y <br>.
function split(node) {
  let i = 0;
  const walk = (n) => {
    [...n.childNodes].forEach((c) => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const w = document.createElement('span');
          w.className = 'w';
          w.setAttribute('aria-hidden', 'true');
          const inner = document.createElement('span');
          inner.textContent = part;
          inner.style.transitionDelay = `${Math.min(i++ * 45, 600)}ms`;
          w.appendChild(inner);
          frag.appendChild(w);
        });
        n.replaceChild(frag, c);
      } else if (c.nodeType === 1 && c.tagName !== 'BR') {
        walk(c);
      }
    });
  };
  walk(node);
}

/* ---------- botones magnéticos ---------- */
// Los botones principales se inclinan unos píxeles hacia el cursor.
export function initMagnetic() {
  if (reduce() || !fine()) return;
  document.querySelectorAll('.pill, .btn, .key').forEach((el) => {
    if (el.classList.contains('mag')) return; // ya conectado (elementos que persisten entre páginas)
    const strength = el.classList.contains('key') ? 0.18 : 0.28;
    el.classList.add('mag');
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ---------- scroll suave ---------- */
// Lenis suaviza la rueda del mouse; los links internos (#seccion) también se desplazan suave.
export function initSmoothScroll() {
  if (reduce()) return null;
  const lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
  (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());

  // mientras corre el loader no se puede hacer scroll
  if (document.documentElement.classList.contains('is-loading')) {
    lenis.stop();
    window.addEventListener('mnv:intro', () => lenis.start(), { once: true });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const target = document.querySelector(decodeURIComponent(url.hash));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { duration: 1.2 });
    history.replaceState(null, '', url.hash);
  });
  return lenis;
}

/* ---------- manifiesto atado al scroll ---------- */
// Las palabras se encienden una a una según avanza el scroll por la sección.
export function initScrub() {
  if (reduce()) return;
  document.querySelectorAll('[data-scrub]').forEach((el) => {
    if (el.classList.contains('scrub')) return;
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    split(el);
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    el.appendChild(sr);
    el.classList.add('scrub');
    const words = [...el.querySelectorAll('.w > span')];
    words.forEach((w) => (w.style.transitionDelay = '0ms'));
    let last = -1;
    const update = () => {
      const r = el.getBoundingClientRect(), vh = innerHeight;
      const prog = Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      const lit = Math.round(prog * words.length);
      if (lit !== last) {
        words.forEach((w, i) => w.classList.toggle('lit', i < lit));
        last = lit;
      }
    };
    window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    update();
  });
}

/* ---------- servicios como instrumentos ---------- */
// Cada servicio toca un patrón de 8 pasos con su forma. Con mouse suena mientras está en hover;
// en táctil, un toque toca un compás.
const PATTERNS = {
  cuadrado:  [1, 0, 0, 0, 1, 0, 0, 1],            // caja
  circulo:   [1, 0, 0, 1, 0, 0, 1, 0],            // bombo
  dona:      [0, 2, 0, 3, 0, 4, 0, 5],            // tom, notas que suben
  triangulo: [1, 1, 1, 1, 1, 1, 1, 1],            // hi-hat
  pildora:   [1, 0, 3, 0, 0, 5, 0, 0],            // bajo
  luna:      [1, 0, 3, 5, 0, 7, 5, 0],            // marimba
};
export function initInstruments(scene) {
  if (!scene) return;
  const STEP = 140; // ms por paso (~107 bpm en corcheas)
  document.querySelectorAll('[data-instrument]').forEach((card) => {
    const kind = card.dataset.instrument, pat = PATTERNS[kind];
    if (!pat) return;
    let timer = null, step = 0;
    const hit = () => {
      const v = pat[step % pat.length];
      if (v) scene.pulse(kind, step, v - 1);
      step++;
    };
    const start = () => { if (timer) return; step = 0; hit(); timer = setInterval(hit, STEP); card.classList.add('is-playing'); };
    const stop = () => { clearInterval(timer); timer = null; card.classList.remove('is-playing'); };
    if (fine()) {
      card.addEventListener('pointerenter', start);
      card.addEventListener('pointerleave', stop);
    } else {
      card.addEventListener('click', () => { start(); setTimeout(stop, STEP * pat.length); });
    }
    card.addEventListener('focusin', start);
    card.addEventListener('focusout', stop);
  });
}

/* ---------- póster descargable ---------- */
// En contacto, el visitante remezcla la ə y la descarga como póster 1080×1350.
export function initPoster(scene) {
  const box = document.querySelector('[data-poster]');
  if (!box || !scene?.poster) return;
  const section = box.closest('section');
  const anchor = section?.querySelector('[data-anchor]');
  if (!anchor) return;
  box.hidden = false;
  box.querySelector('[data-remix]')?.addEventListener('click', () => scene.remix());
  box.querySelector('[data-download]')?.addEventListener('click', () => {
    const d = new Date();
    const serial = `nº ${String(d.getTime()).slice(-5)} · ${d.toLocaleDateString('es-EC')}`;
    const c = scene.poster(anchor, { serial });
    c.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'minervo-poster.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, 'image/png');
  });
}
