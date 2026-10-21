// Escena de formas: física (Matter.js), sonido y formaciones guiadas por el scroll.
// Cada <section data-mode="…"> define qué hacen las formas mientras está al centro de la pantalla:
//   glyph   → arman la ə dentro de [data-anchor]
//   slots   → cada [data-slot="<forma>"] recibe las formas de su tipo
//   stripes → filas op-art dentro de [data-anchor]
//   frame   → enmarcan [data-anchor] por fuera (video de un caso)
//   chaos   → caen con gravedad
import Matter from 'matter-js';
import { createAudio, PENTA } from './audio.js';
import { KINDS, kindOf, EXTENT } from './kinds.js';
import { glyphPoints, gridPoints, stripePoints, framePoints } from './formations.js';

const { Engine, Bodies, Body, Composite, Events, Mouse, MouseConstraint, Query } = Matter;
const ALL = 0xffffffff;
const MAX_SHAPES = 110;

export function initFormas({ canvas, soundButton, soundLabel, pads, loader: loaderEl, render3d: r3d = null }) {
  let render3d = r3d;
  const css = getComputedStyle(document.documentElement);
  const color = (token) => css.getPropertyValue('--' + token).trim();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;

  const audio = createAudio({
    onChange(on) {
      soundButton?.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (soundLabel) soundLabel.textContent = on ? 'sonido on' : 'sonido';
    },
  });

  if (render3d) canvas.after(render3d.el);

  /* ---------- física ---------- */
  const ctx = canvas.getContext('2d');
  const engine = Engine.create();
  engine.gravity.y = reduce ? 0 : 1;
  const world = engine.world;
  let W = 0, H = 0, DPR = 1, S = 36, walls = [];
  const shapes = [];
  const assign = new Map(); // body → { el, x, y }
  let modeSec = null, modeType = 'chaos', building = false, shuffleNext = false;

  function makeWalls() {
    walls.forEach((w) => Composite.remove(world, w));
    const t = 300;
    walls = [
      Bodies.rectangle(W / 2, H + t / 2, W * 3, t, { isStatic: true }),
      Bodies.rectangle(-t / 2, H / 2, t, H * 6, { isStatic: true }),
      Bodies.rectangle(W + t / 2, H / 2, t, H * 6, { isStatic: true }),
    ];
    walls.forEach((w) => (w.plugin.wall = true));
    Composite.add(world, walls);
  }

  function makeBody(kind, x, y) {
    const o = { restitution: 0.45, friction: 0.08, frictionAir: 0.006, density: 0.002 };
    const s = S * (0.85 + Math.random() * 0.45);
    let b;
    switch (kind.id) {
      case 'circulo': b = Bodies.circle(x, y, s, o); break;
      case 'dona': b = Bodies.circle(x, y, s * 0.9, o); break;
      case 'luna': {
        const pts = [];
        for (let i = 0; i <= 18; i++) {
          const a = (Math.PI * i) / 18;
          pts.push({ x: Math.cos(a) * s * 1.15, y: Math.sin(a) * s * 1.15 });
        }
        b = Bodies.fromVertices(x, y, [pts], o); break;
      }
      case 'triangulo': b = Bodies.polygon(x, y, 3, s * 1.1, o); break;
      case 'pildora': b = Bodies.rectangle(x, y, s * 2.8, s * 0.95, { ...o, chamfer: { radius: s * 0.47, quality: 12 } }); break;
      case 'cuadrado': b = Bodies.rectangle(x, y, s * 1.6, s * 1.6, o); break;
    }
    Object.assign(b.plugin, {
      kind, color: color(kind.token), note: Math.floor(Math.random() * PENTA.length),
      s, last: 0, sc: 1, goal: 1, flash: 0, arrived: false,
    });
    Body.setAngle(b, (Math.random() - 0.5) * 1.2);
    return b;
  }

  function spawn(kind, x, y, vy = 4) {
    const b = makeBody(kind, x ?? S * 2 + Math.random() * Math.max(1, W - S * 4), y ?? -S * 2);
    Body.setVelocity(b, { x: (Math.random() - 0.5) * 4, y: vy });
    Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.2);
    shapes.push(b);
    Composite.add(world, b);
    while (shapes.length > MAX_SHAPES) {
      const old = shapes.shift();
      assign.delete(old);
      Composite.remove(world, old);
    }
    if (modeSec && !building) setMode(modeSec, true);
    return b;
  }

  // Los choques suenan según la fuerza del golpe.
  Events.on(engine, 'collisionStart', (e) => {
    const now = performance.now();
    for (const p of e.pairs) {
      const a = p.bodyA.parent, b = p.bodyB.parent;
      const sp = Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y);
      if (sp < 2.4) continue;
      const src = a.plugin.wall ? b : b.plugin.wall ? a : a.speed > b.speed ? a : b;
      if (!src.plugin.kind || now - src.plugin.last < 90) continue;
      src.plugin.last = now;
      src.plugin.flash = 1;
      audio.play(src.plugin.kind.id, src.plugin.note, sp / 14);
    }
  });

  /* ---------- formaciones ---------- */
  const byX = (a, b) => a.position.x - b.position.x;

  function setTarget(b, el, x, y, p) {
    assign.set(b, { el, x, y });
    b.plugin.goal = Math.min(1.5, Math.max(0.2, (p * 0.5) / (EXTENT[b.plugin.kind.id] * b.plugin.s)));
    b.collisionFilter.mask = 0; // en formación no chocan entre ellas
  }

  // Asigna formas para dibujar la ə dentro de `el`. El punto siempre son círculos menta.
  function formGlyph(el, shuffle = false) {
    const r = el.getBoundingClientRect();
    const base = Number(el.dataset.want) || 46;
    const want = W < 700 ? Math.round(base * 0.65) : base;
    const { glyph, dot, p } = glyphPoints(r.width, r.height, Math.min(want, Math.max(shapes.length, want - 18)));
    const circles = shapes.filter((b) => b.plugin.kind.id === 'circulo');
    while (circles.length < dot.length) circles.push(spawn(KINDS[0]));
    while (shapes.length < glyph.length + dot.length) spawn(KINDS[1 + Math.floor(Math.random() * 5)]);
    circles.slice().sort(byX).reverse().slice(0, dot.length)
      .forEach((b, i) => setTarget(b, el, dot[i].x, dot[i].y, p));
    // franjas de color: las formas van agrupadas por tipo y los puntos por filas,
    // así la ə se lee como una letra con bandas y no como un racimo de piezas sueltas
    const order = (b) => KINDS.indexOf(b.plugin.kind);
    const rest = shapes.filter((b) => !assign.has(b)).sort((a, b) => order(a) - order(b) || byX(a, b));
    const pts = glyph.slice().sort((a, b) => a.y - b.y || a.x - b.x);
    if (shuffle) rest.sort(() => Math.random() - 0.5); // remezcla: cada pieza va a otro lugar
    rest.forEach((b, i) => { if (i < pts.length) setTarget(b, el, pts[i].x, pts[i].y, p); });
  }

  // Suelta las piezas de la formación actual en orden (de arriba hacia abajo), cada una con su golpe.
  function releaseInOrder(duration = 700) {
    const list = [...assign.keys()].sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
    modeType = 'chaos';
    modeSec = null;
    const step = duration / Math.max(1, list.length);
    list.forEach((b, i) => setTimeout(() => {
      assign.delete(b);
      b.plugin.goal = 1;
      b.collisionFilter.mask = ALL;
      b.plugin.flash = 1;
      Body.setVelocity(b, { x: (Math.random() - 0.5) * 6, y: -3 - Math.random() * 5 });
      Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.3);
      if (i % 3 === 0) audio.play(b.plugin.kind.id, b.plugin.note, 0.45);
    }, i * step));
  }

  function setMode(sec, quiet = false) {
    building = true;
    const type = sec ? sec.dataset.mode : 'chaos';
    const prevType = modeType;
    assign.clear();

    if (type === 'glyph') {
      formGlyph(sec.querySelector('[data-anchor]'), shuffleNext);
      shuffleNext = false;
    } else if (type === 'slots') {
      sec.querySelectorAll('[data-slot]').forEach((el) => {
        const k = kindOf(el.dataset.slot);
        let bs = shapes.filter((b) => b.plugin.kind === k && !assign.has(b));
        while (bs.length < 4) bs.push(spawn(k));
        bs = bs.slice(0, 9);
        const r = el.getBoundingClientRect();
        const { pts, p } = gridPoints(r.width * 0.7, r.height, bs.length);
        bs.sort(byX).forEach((b, i) => setTarget(b, el, pts[i].x, pts[i].y, p));
      });
    } else if (type === 'frame') {
      const el = sec.querySelector('[data-anchor]');
      const r = el.getBoundingClientRect();
      const want = W >= 700
        ? Math.max(24, Math.min(64, Math.round((2 * (r.width + r.height)) / (S * 1.9))))
        : Math.max(12, Math.min(24, Math.round((2 * r.width) / (S * 1.7))));
      while (shapes.length < want) spawn(KINDS[Math.floor(Math.random() * 6)]);
      const { pts, p } = framePoints(r.width, r.height, Math.min(want, shapes.length), W >= 700);
      // cada forma va al punto del borde más cercano en orden angular, para que no se crucen
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const ang = (x, y) => Math.atan2(y, x);
      const list = shapes.slice().sort((a, b) => ang(a.position.x - cx, a.position.y - cy) - ang(b.position.x - cx, b.position.y - cy));
      const targets = pts.map((q) => ({ ...q, a: ang(q.x - r.width / 2, q.y - r.height / 2) })).sort((a, b) => a.a - b.a);
      list.forEach((b, i) => { if (i < targets.length) setTarget(b, el, targets[i].x, targets[i].y, p); });
    } else if (type === 'fill') {
      // todas las formas llenan un rectángulo: es la "pantalla" que se vuelve el video del caso
      const el = sec.querySelector('[data-anchor]');
      const r = el.getBoundingClientRect();
      const list = shapes.slice().sort(byX);
      const { pts, p } = gridPoints(r.width, r.height, list.length);
      list.forEach((b, i) => setTarget(b, el, pts[i].x, pts[i].y, p * 1.15));
    } else if (type === 'stripes') {
      const el = sec.querySelector('[data-anchor]');
      const r = el.getBoundingClientRect();
      const list = shapes.slice().sort(byX);
      const { pts, p } = stripePoints(r.width, r.height, list.length);
      list.forEach((b, i) => setTarget(b, el, pts[i].x, pts[i].y, p));
    }

    shapes.forEach((b) => {
      b.plugin.arrived = quiet && b.plugin.arrived;
      if (!assign.has(b)) b.plugin.goal = type === 'chaos' ? 1 : 0.5;
    });

    if (type === 'chaos' && prevType !== 'chaos') {
      // se sueltan con un pequeño estallido y vuelven a chocar
      shapes.forEach((b) => {
        Body.setVelocity(b, { x: (Math.random() - 0.5) * 8, y: -2 - Math.random() * 8 });
        Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.3);
      });
      setTimeout(() => { if (modeType === 'chaos') shapes.forEach((b) => (b.collisionFilter.mask = ALL)); }, 450);
    }

    modeType = type;
    modeSec = sec;
    building = false;
  }

  Events.on(engine, 'beforeUpdate', () => {
    const rects = new Map();
    const g = engine.gravity;
    for (const b of shapes) {
      const goal = b.plugin.goal || 1;
      if (Math.abs(b.plugin.sc - goal) > 0.004) {
        const n = b.plugin.sc + (goal - b.plugin.sc) * 0.12;
        Body.scale(b, n / b.plugin.sc, n / b.plugin.sc);
        b.plugin.sc = n;
      }
      const a = assign.get(b);
      if (!a) continue;
      if (mc && mc.body && mc.body.parent === b) continue;
      let r = rects.get(a.el);
      if (!r) { r = a.el.getBoundingClientRect(); rects.set(a.el, r); }
      let tx = r.left + a.x, ty = r.top + a.y;
      // las piezas en formación se apartan del mouse y vuelven: la marca se siente viva
      const mx = tx - pointer.x, my = ty - pointer.y, md = Math.hypot(mx, my), R = S * 3.2;
      if (md < R && md > 0.01) { const push = (R - md) * 0.55; tx += (mx / md) * push; ty += (my / md) * push; }
      const dx = tx - b.position.x, dy = ty - b.position.y;
      b.force.y -= b.mass * g.y * g.scale; // anula la gravedad mientras están en formación
      Body.setVelocity(b, { x: b.velocity.x * 0.84 + dx * 0.02, y: b.velocity.y * 0.84 + dy * 0.02 });
      let ang = b.angle % (Math.PI * 2);
      if (ang > Math.PI) ang -= Math.PI * 2;
      if (ang < -Math.PI) ang += Math.PI * 2;
      Body.setAngularVelocity(b, b.angularVelocity * 0.8 - ang * 0.03);
      if (!b.plugin.arrived && dx * dx + dy * dy < 36) {
        b.plugin.arrived = true;
        b.plugin.flash = 1;
        audio.play(b.plugin.kind.id, b.plugin.note, 0.32);
      }
    }
  });

  /* ---------- puntero ---------- */
  const pointer = { x: -9999, y: -9999 };
  if (fine && !reduce) {
    window.addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });
    document.addEventListener('pointerleave', () => { pointer.x = pointer.y = -9999; });
  }
  let mc = null;
  if (fine) {
    const mouse = Mouse.create(canvas);
    ['mousewheel', 'DOMMouseScroll', 'wheel'].forEach((ev) => mouse.element.removeEventListener(ev, mouse.mousewheel));
    mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
    Composite.add(world, mc);
  }
  canvas.addEventListener('pointerdown', (e) => {
    audio.unlock();
    const pt = { x: e.clientX, y: e.clientY };
    const hit = Query.point(shapes, pt)[0];
    if (hit) {
      const b = hit.parent;
      b.plugin.flash = 1;
      audio.play(b.plugin.kind.id, b.plugin.note, 0.85);
      if (!assign.has(b) || !fine) Body.setVelocity(b, { x: (Math.random() - 0.5) * 10, y: -10 - Math.random() * 6 });
    } else if (modeType === 'chaos') {
      const k = KINDS[Math.floor(Math.random() * 6)];
      const b = spawn(k, pt.x, Math.min(pt.y, H - S * 2), 2);
      b.plugin.flash = 1;
      audio.play(k.id, b.plugin.note, 0.7);
    }
  }, { passive: true });

  /* ---------- dibujo ---------- */
  let stripeEls = [...document.querySelectorAll('[data-stripes]')];
  const ink = color('ink'), line = color('line');
  function path(b) {
    const v = b.vertices;
    ctx.beginPath(); ctx.moveTo(v[0].x, v[0].y);
    for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y);
    ctx.closePath();
  }
  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = line;
    for (const el of stripeEls) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > H) continue;
      for (let y = r.top; y < r.bottom; y += 16) ctx.fillRect(r.left, y, r.width, 8);
    }
    if (render3d) {
      // modo 3D: el canvas 2D solo dibuja las franjas; las formas las dibuja el render 3D
      for (const b of shapes) if (b.plugin.flash > 0.03) b.plugin.flash *= 0.88;
      render3d.render(shapes);
      return;
    }
    for (const b of shapes) {
      const { kind, color: c } = b.plugin;
      ctx.fillStyle = c; ctx.strokeStyle = c;
      if (kind.id === 'circulo') { ctx.beginPath(); ctx.arc(b.position.x, b.position.y, b.circleRadius, 0, Math.PI * 2); ctx.fill(); }
      else if (kind.id === 'dona') { ctx.beginPath(); ctx.lineWidth = b.circleRadius * 0.5; ctx.arc(b.position.x, b.position.y, b.circleRadius * 0.75, 0, Math.PI * 2); ctx.stroke(); }
      else { path(b); ctx.fill(); }
      if (b.plugin.flash > 0.03) {
        ctx.globalAlpha = b.plugin.flash * 0.6; ctx.strokeStyle = ink; ctx.lineWidth = 2;
        if (b.circleRadius) { ctx.beginPath(); ctx.arc(b.position.x, b.position.y, b.circleRadius * (1 + (1 - b.plugin.flash) * 0.45), 0, Math.PI * 2); ctx.stroke(); }
        else { path(b); ctx.stroke(); }
        ctx.globalAlpha = 1;
        b.plugin.flash *= 0.88;
      }
    }
  }

  /* ---------- scroll → formación ---------- */
  let sections = [...document.querySelectorAll('[data-mode]')];
  let introDone = false;
  function pickSection() {
    const mid = H * 0.5;
    return sections.find((s) => { const r = s.getBoundingClientRect(); return r.top <= mid && r.bottom >= mid; }) || null;
  }
  function onScroll() {
    if (!introDone) return;
    const s = pickSection();
    if (s !== modeSec) setMode(s);
  }
  window.addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true });

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    DPR = Math.min(2, Math.max(1, Math.round(window.devicePixelRatio || 1)));
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    canvas.setAttribute('data-pixel-ratio', DPR);
    S = Math.max(22, Math.min(52, Math.min(W, H) / 15));
    render3d?.resize(W, H);
    makeWalls();
    if (modeSec) setMode(modeSec, true);
  }
  window.addEventListener('resize', resize);

  /* ---------- pads y teclado ---------- */
  function trigger(k) {
    audio.unlock();
    const b = spawn(k, null, -S * 2, 14);
    b.plugin.flash = 1;
    audio.play(k.id, b.plugin.note, 0.9);
    const el = pads?.querySelector(`[data-key="${k.key}"]`);
    if (el) { el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 120); }
  }
  pads?.querySelectorAll('[data-key]').forEach((el) => {
    el.addEventListener('click', () => trigger(KINDS.find((k) => k.key === el.dataset.key)));
  });
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    const k = KINDS.find((k) => k.key === e.key.toLowerCase());
    if (k) trigger(k);
  });
  soundButton?.addEventListener('click', () => audio.toggle());
  window.addEventListener('pointerdown', () => audio.unlock(), { once: true, passive: true });

  /* ---------- arranque ---------- */
  resize();
  const n = W < 700 ? 20 : 30;
  const fontsReady = document.fonts?.load
    ? Promise.race([document.fonts.load('600 100px Geist').catch(() => {}), new Promise((r) => setTimeout(r, 2500))])
    : Promise.resolve();
  const formHero = (delay) => setTimeout(() => { introDone = true; onScroll(); }, delay);

  let seen = false;
  try { seen = sessionStorage.getItem('mnv-intro') === '1'; } catch (e) {}
  const loader = loaderEl && !reduce && !seen ? loaderEl : null;

  if (loader) {
    // Loader: las formas aparecen ya armando la ə, sostienen un momento y se rompen en caos.
    document.documentElement.classList.add('is-loading');
    building = true;
    for (let i = 0; i < n; i++) {
      const b = spawn(KINDS[i % 6], W / 2, -S * 10, 0);
      b.collisionFilter.mask = 0;
      Body.setStatic(b, true); // esperan fuera de pantalla hasta que la fuente esté lista
    }
    building = false;
    fontsReady.then(() => {
      shapes.forEach((b) => Body.setStatic(b, false));
      formGlyph(loader.querySelector('[data-anchor]'));
      const rects = new Map();
      for (const [b, a] of assign) {
        let r = rects.get(a.el);
        if (!r) { r = a.el.getBoundingClientRect(); rects.set(a.el, r); }
        Body.setPosition(b, { x: r.left + a.x, y: r.top + a.y });
        Body.setVelocity(b, { x: 0, y: 0 });
        Body.setAngle(b, 0);
        Body.scale(b, 0.05 / b.plugin.sc, 0.05 / b.plugin.sc); // crecen desde cero en su sitio
        b.plugin.sc = 0.05;
        b.plugin.arrived = true;
      }
      shapes.filter((b) => !assign.has(b)).forEach((b) => Body.setPosition(b, { x: b.position.x, y: -S * 4 }));
      modeType = 'glyph';
      // la ə armada espera a que el visitante elija entrar con o sin sonido (el clic habilita el audio);
      // si no elige en 8 s, entra sin sonido
      const choose = new Promise((resolve) => {
        loader.classList.add('is-ready');
        const buttons = [...loader.querySelectorAll('[data-enter]')];
        buttons.forEach((btn) => btn.addEventListener('click', () => resolve(btn.dataset.enter === 'sound'), { once: true }));
        buttons[0]?.focus({ preventScroll: true });
        setTimeout(() => resolve(null), 8000);
      });
      choose.then((withSound) => {
        if (withSound !== null) audio.choose(withSound);
        loader.classList.add('is-done');
        releaseInOrder(); // se desarma pieza por pieza, de arriba hacia abajo, como un redoble
        window.dispatchEvent(new CustomEvent('mnv:intro'));
        try { sessionStorage.setItem('mnv-intro', '1'); } catch (e) {}
        setTimeout(() => {
          document.documentElement.classList.remove('is-loading');
          loader.remove();
        }, 700);
        formHero(1800);
      });
    });
  } else {
    loaderEl?.remove();
    window.dispatchEvent(new CustomEvent('mnv:intro'));
    for (let i = 0; i < n; i++) {
      spawn(KINDS[i % 6], S * 2 + Math.random() * Math.max(1, W - S * 4),
        reduce ? H * 0.6 - Math.random() * H * 0.4 : -S * 2 - i * S * 1.4, reduce ? 0 : 4);
    }
    // primero caos; al segundo y medio las formas arman la marca
    fontsReady.then(() => formHero(reduce ? 0 : 1600));
  }

  let lastT = performance.now();
  (function loop(t = performance.now()) {
    const dt = Math.min(32, t - lastT);
    lastT = t;
    Engine.update(engine, dt);
    draw();
    requestAnimationFrame(loop);
  })();

  // API para otros módulos (cursor): qué forma hay bajo un punto y si se está arrastrando una.
  return {
    shapeAt(x, y) {
      const hit = Query.point(shapes, { x, y })[0];
      return hit ? hit.parent.plugin.color : null;
    },
    get dragging() { return !!(mc && mc.body); },
    // Conecta el render 3D cuando termina de cargar: la escena arranca en 2D y pasa a 3D sin reiniciarse.
    attach3D(r) {
      if (render3d || !r) return;
      canvas.after(r.el);
      r.resize(W, H);
      render3d = r;
      document.documentElement.classList.add('is-3d');
      document.addEventListener('astro:after-swap', () => document.documentElement.classList.add('is-3d'));
    },
    // Escena continua entre páginas: después de cambiar de página, vuelve a leer las secciones
    // y las franjas del documento nuevo; las formas siguen donde estaban y van a su nueva formación.
    rescan() {
      sections = [...document.querySelectorAll('[data-mode]')];
      stripeEls = [...document.querySelectorAll('[data-stripes]')];
      document.getElementById('loader')?.remove(); // el loader solo existe en la primera carga
      document.documentElement.classList.remove('is-loading');
      modeSec = null;
      introDone = true;
      onScroll();
    },
    // Antes de entrar a un caso: las formas llenan un rectángulo 16:9 al centro de la pantalla.
    toScreen() {
      const w = Math.min(W * 0.78, 1100), h = w * 9 / 16;
      const rect = { left: (W - w) / 2, top: (H - h) / 2 + 20, width: w, height: h };
      const el = { getBoundingClientRect: () => rect, dataset: {} };
      const sec = { dataset: { mode: 'fill' }, querySelector: () => el };
      setMode(sec);
      introDone = false; // mientras navega, el scroll no cambia la formación
    },
    // Remezcla la formación actual (solo la ə): las piezas cambian de lugar sonando al llegar.
    remix() {
      if (modeType !== 'glyph' || !modeSec) return false;
      shuffleNext = true;
      setMode(modeSec);
      return true;
    },
    // Dibuja la formación dentro de `el` como póster 1080×1350 y devuelve el canvas.
    poster(el, { title = 'experiencias que se mueven.', serial = '' } = {}) {
      const Wp = 1080, Hp = 1350, pad = 96;
      const c = document.createElement('canvas'); c.width = Wp; c.height = Hp;
      const g = c.getContext('2d');
      g.fillStyle = color('ground'); g.fillRect(0, 0, Wp, Hp);
      const r = el.getBoundingClientRect();
      const mine = shapes.filter((b) => assign.get(b)?.el === el);
      if (mine.length) {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        mine.forEach((b) => { x0 = Math.min(x0, b.bounds.min.x); y0 = Math.min(y0, b.bounds.min.y); x1 = Math.max(x1, b.bounds.max.x); y1 = Math.max(y1, b.bounds.max.y); });
        const boxW = Wp - pad * 2, boxH = Hp - pad * 2 - 260;
        const k = Math.min(boxW / (x1 - x0), boxH / (y1 - y0));
        const ox = pad + (boxW - (x1 - x0) * k) / 2, oy = pad + 40 + (boxH - (y1 - y0) * k) / 2;
        g.save(); g.translate(ox, oy); g.scale(k, k); g.translate(-x0, -y0);
        mine.forEach((b) => {
          const { kind, color: col } = b.plugin;
          g.fillStyle = col; g.strokeStyle = col;
          if (kind.id === 'circulo') { g.beginPath(); g.arc(b.position.x, b.position.y, b.circleRadius, 0, Math.PI * 2); g.fill(); }
          else if (kind.id === 'dona') { g.beginPath(); g.lineWidth = b.circleRadius * 0.5; g.arc(b.position.x, b.position.y, b.circleRadius * 0.75, 0, Math.PI * 2); g.stroke(); }
          else { const v = b.vertices; g.beginPath(); g.moveTo(v[0].x, v[0].y); for (let i = 1; i < v.length; i++) g.lineTo(v[i].x, v[i].y); g.closePath(); g.fill(); }
        });
        g.restore();
      }
      const ink = color('ink'), muted = color('muted');
      g.fillStyle = ink; g.font = '600 64px Geist, Helvetica Neue, Arial, sans-serif'; g.textBaseline = 'alphabetic';
      g.fillText(title, pad, Hp - pad - 70);
      g.font = '500 30px Geist, Helvetica Neue, Arial, sans-serif';
      const wm = 'minərvo', wmW = g.measureText(wm).width;
      g.fillText(wm, pad, Hp - pad); g.fillStyle = color('menta'); g.fillText('.', pad + wmW, Hp - pad);
      g.fillStyle = ink; g.fillText('studio', pad + wmW + g.measureText('.').width, Hp - pad);
      g.fillStyle = muted; g.font = '500 22px "Geist Mono", ui-monospace, monospace'; g.textAlign = 'right';
      g.fillText(serial, Wp - pad, Hp - pad);
      return c;
    },
    // Un golpe del instrumento `kindId`: una de sus formas salta y suena.
    pulse(kindId, i, note) {
      const list = shapes.filter((b) => b.plugin.kind.id === kindId && assign.has(b));
      if (list.length) {
        const b = list[i % list.length];
        b.plugin.flash = 1;
        Body.setVelocity(b, { x: b.velocity.x, y: -7 });
        Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.4);
      }
      audio.play(kindId, note ?? 0, 0.75);
    },
  };
}
