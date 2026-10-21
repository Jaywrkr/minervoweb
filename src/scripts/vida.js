// Animación por marca: cada marca se mueve distinto.
// - minərvo: entra rebotando, letras que caen, formas que flotan y se apartan del cursor, cursor de color.
// - Coresolutions: entra como una carga de datos (barrido), titular que se decodifica, nodos que parpadean,
//   datos que fluyen por los enlaces, cifras vivas y cursor en cruz con coordenadas.
// - Jay Jaramillo: aparece lento, titular que se escribe con cursor de texto, formas que respiran,
//   cursor cuadrado que invierte lo que toca.
const GLYPHS = 'ABCDEF0123456789#/_<>';

export function initVida(root) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  let brand = 'minervo';

  /* ---------- entradas al hacer scroll ---------- */
  const items = [...root.querySelectorAll('[data-rv]')];
  items.forEach((el, i) => el.style.setProperty('--i', String(i % 6)));
  if (!reduce) root.classList.add('rv-on');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  function replay() {
    if (reduce) return;
    items.forEach((el) => { el.classList.remove('in'); io.unobserve(el); });
    void root.offsetWidth; // reinicia las animaciones
    items.forEach((el) => io.observe(el));
  }

  /* ---------- titular ---------- */
  const h1 = root.querySelector('#h1');
  let scr = 0;
  function introH1() {
    cancelAnimationFrame(scr);
    h1.classList.remove('h-in');
    if (reduce) return;
    void h1.offsetWidth;
    h1.classList.add('h-in');
    if (brand === 'coresolutions') {
      // se decodifica: cada letra muestra símbolos hasta que le llega su turno
      const chs = [...h1.querySelectorAll('.ch')].map((el, i) => ({ el, real: el.textContent, at: 150 + i * 22 }));
      const t0 = performance.now();
      const tick = (t) => {
        const dt = t - t0;
        let left = 0;
        chs.forEach((c) => {
          if (dt >= c.at) { if (c.el.textContent !== c.real) c.el.textContent = c.real; }
          else { left++; if (c.real.trim()) c.el.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0]; }
        });
        if (left) scr = requestAnimationFrame(tick);
      };
      scr = requestAnimationFrame(tick);
    }
  }

  /* ---------- datos vivos (Coresolutions) ---------- */
  const comp = root.querySelector('#comp');
  setInterval(() => {
    if (brand !== 'coresolutions' || reduce || document.hidden) return;
    comp.querySelectorAll('.ov text').forEach((t) => {
      if (/%/.test(t.textContent)) t.textContent = t.textContent.replace(/\d+\.\d+%/, (99.9 + Math.random() * 0.09).toFixed(2) + '%');
      else if (/^INC-/.test(t.textContent)) t.textContent = 'INC-' + String((Math.random() * 9999) | 0).padStart(4, '0');
    });
  }, 1200);

  /* ---------- formas que se apartan del cursor (minərvo) ---------- */
  const art = root.querySelector('.dl-art');
  if (fine && !reduce) {
    art.addEventListener('pointermove', (e) => {
      if (brand !== 'minervo') return;
      const r = comp.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * 1000, py = ((e.clientY - r.top) / r.height) * 1000;
      comp.querySelectorAll('g[data-i]').forEach((g) => {
        const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\).*scale\(([-\d.]+)\)/.exec(g.style.transform);
        const sh = g.querySelector('.sh');
        if (!m || !sh) return;
        const dx = +m[1] - px, dy = +m[2] - py, d = Math.hypot(dx, dy), R = 190;
        if (d < R && d > 0.1) {
          const f = ((R - d) / R) * 70 / (+m[3] || 1);
          sh.style.translate = `${(dx / d) * f}px ${(dy / d) * f}px`;
        } else sh.style.translate = '0px 0px';
      });
    });
    art.addEventListener('pointerleave', () => comp.querySelectorAll('.sh').forEach((s) => (s.style.translate = '0px 0px')));
  }

  /* ---------- cursor por marca ---------- */
  if (fine && !reduce) {
    const cur = document.createElement('div');
    cur.className = 'dl-cur';
    cur.innerHTML = '<span class="dl-cur-lbl"></span>';
    root.appendChild(cur);
    root.classList.add('cur-on');
    const lbl = cur.firstChild;
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y, raf = 0;
    const move = () => {
      // minərvo y Jay siguen con un poco de retraso; Coresolutions va exacto
      const k = brand === 'coresolutions' ? 1 : brand === 'jay' ? 0.12 : 0.22;
      cx += (x - cx) * k; cy += (y - cy) * k;
      cur.style.transform = `translate(${cx.toFixed(1)}px,${cy.toFixed(1)}px)`;
      if (brand === 'coresolutions') lbl.textContent = `X ${String(Math.round(x)).padStart(4, '0')} · Y ${String(Math.round(y)).padStart(4, '0')}`;
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.3 ? requestAnimationFrame(move) : 0;
    };
    addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY;
      const hot = e.target.closest?.('a,button,.dl-card,.knob');
      const inConsole = e.target.closest?.('.dl-console');
      cur.classList.toggle('is-hot', !!hot && !inConsole);
      cur.classList.toggle('is-off', !!inConsole);
      if (!raf) raf = requestAnimationFrame(move);
    }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.add('is-off'));
  }

  return {
    // se llama cada vez que cambia la marca (y al inicio)
    brand(b, first) {
      brand = b;
      document.documentElement.dataset.vt = b;
      introH1();
      if (!first) replay();
      else items.forEach((el) => io.observe(el));
    },
  };
}
