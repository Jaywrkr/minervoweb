// Pulido de movimiento: cursor propio, titulares que entran con el scroll y botones magnéticos.
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
  const heads = [...document.querySelectorAll('main h1, main h2, .manif p')];
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
