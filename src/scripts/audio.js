// Motor de sonido de minərvo (F3).
// - Cada forma es un instrumento. Si hay grabaciones en /sounds (ver public/sounds/README.md) usa
//   esas muestras, con 3 intensidades y variaciones; si no, sintetiza el sonido.
// - Todo va a tempo: 96 bpm. Los golpes se cuantizan a la semicorchea más cercana (máx. ~156 ms).
// - Música adaptativa: cada sección pide un nivel (0–3) y el secuenciador suma o quita capas.
//   Si hay grooves grabados, se usan en lugar de las capas sintetizadas.
export const PENTA = [0, 3, 5, 7, 10, 12, 15, 17];
export const BPM = 96;
const BEAT = 60 / BPM;          // negra
const STEP = BEAT / 4;          // semicorchea (0.156 s)
const hz = (base, semi) => base * Math.pow(2, semi / 12);

export function createAudio({ onChange } = {}) {
  let ctx = null, master = null, fxBus = null, musicBus = null, noiseBuf = null;
  let on = false, unlocked = false, voices = 0;
  let manifest = null, loading = null;
  const buffers = new Map(); // ruta → AudioBuffer
  const rr = new Map();      // round-robin por grupo de muestras

  /* ---------- arranque ---------- */
  function init() {
    if (ctx) return true;
    const A = window.AudioContext || window.webkitAudioContext;
    if (!A) return false;
    ctx = new A();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0.75;
    master.connect(comp); comp.connect(ctx.destination);
    fxBus = ctx.createGain(); fxBus.gain.value = 1; fxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    clock0 = ctx.currentTime;
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) ctx.suspend(); else if (on) ctx.resume();
    });
    return true;
  }

  // Carga el índice de grabaciones y las muestras, solo cuando el sonido se activa por primera vez.
  function loadSamples() {
    if (loading) return loading;
    loading = fetch('/sounds/manifest.json')
      .then((r) => (r.ok ? r.json() : null))
      .then(async (m) => {
        manifest = m;
        if (!m) return;
        const paths = [];
        Object.values(m.kits || {}).forEach((kit) => Object.values(kit).forEach((list) => paths.push(...list)));
        Object.values(m.grooves || {}).forEach((p) => paths.push(p));
        await Promise.all(paths.map((p) => fetch('/sounds/' + p)
          .then((r) => r.arrayBuffer())
          .then((ab) => ctx.decodeAudioData(ab))
          .then((buf) => buffers.set(p, buf))
          .catch(() => {})));
      })
      .catch(() => { manifest = null; });
    return loading;
  }

  function set(value) {
    if (value && !init()) return;
    on = value;
    if (ctx) {
      if (on) { ctx.resume(); loadSamples(); startSequencer(); }
      master.gain.setTargetAtTime(on ? 0.75 : 0, ctx.currentTime, 0.02);
    }
    onChange && onChange(on);
  }
  // El navegador solo permite sonido después de una interacción.
  function unlock() { if (unlocked) return; unlocked = true; set(true); }
  function toggle() { unlocked = true; set(!on); }
  // elección explícita del visitante (botones del loader)
  function choose(value) { unlocked = true; set(value); }

  /* ---------- reloj a 96 bpm ---------- */
  let clock0 = 0;
  // Próxima semicorchea a partir de `t` (tiempo de AudioContext).
  function nextStep(t) {
    const n = Math.ceil((t - clock0) / STEP - 0.001);
    return clock0 + n * STEP;
  }

  /* ---------- síntesis (respaldo sin grabaciones) ---------- */
  function env(g, t, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
  }
  function voice(dur) { voices++; setTimeout(() => voices--, dur * 1000 + 50); }
  function noise(out, t, dur, type, f, q, peak) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = ctx.createGain(); env(g, t, peak, dur);
    s.connect(fl); fl.connect(g); g.connect(out); s.start(t); s.stop(t + dur + 0.05);
  }
  function tone(out, t, type, f0, f1, dur, peak, lowpass) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.8);
    const g = ctx.createGain(); env(g, t, peak, dur);
    if (lowpass) {
      const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lowpass;
      o.connect(fl); fl.connect(g);
    } else o.connect(g);
    g.connect(out); o.start(t); o.stop(t + dur + 0.05);
  }
  function synth(out, kind, note, v, t) {
    switch (kind) {
      case 'circulo': tone(out, t, 'sine', 150, 42, 0.38, 0.9 * v); voice(0.4); break;                    // bombo
      case 'dona':                                                                                           // tom
        tone(out, t, 'sine', hz(196, PENTA[note % 5]), null, 0.32, 0.55 * v);
        tone(out, t, 'sine', hz(98, PENTA[note % 5]), null, 0.32, 0.3 * v); voice(0.35); break;
      case 'luna': tone(out, t, 'triangle', hz(392, PENTA[note % PENTA.length]), null, 0.5, 0.4 * v, 2400); voice(0.5); break; // marimba
      case 'triangulo': noise(out, t, 0.06, 'highpass', 7500, 0.7, 0.35 * v); voice(0.08); break;          // hi-hat
      case 'pildora': tone(out, t, 'sawtooth', hz(65.4, PENTA[note % PENTA.length]), null, 0.34, 0.42 * v, 520); voice(0.35); break; // bajo
      case 'cuadrado':                                                                                       // caja
        noise(out, t, 0.16, 'bandpass', 1900, 0.9, 0.6 * v);
        tone(out, t, 'triangle', 190, 120, 0.09, 0.35 * v); voice(0.18); break;
    }
  }

  /* ---------- muestras grabadas ---------- */
  function pick(group, list) {
    const i = (rr.get(group) || 0) % list.length;
    rr.set(group, i + 1);
    return list[i];
  }
  function sample(out, kind, note, v, t) {
    const kit = manifest?.kits?.[kind];
    if (!kit) return false;
    let list = null;
    if (kit.notes?.length) list = [kit.notes[note % kit.notes.length]]; // instrumentos con notas (bajo)
    else list = (v < 0.35 ? kit.soft : v < 0.7 ? kit.medium : kit.hard) || kit.medium || kit.hard || kit.soft;
    if (!list?.length) return false;
    const path = list.length === 1 ? list[0] : pick(kind + (v < 0.35 ? 's' : v < 0.7 ? 'm' : 'h'), list);
    const buf = buffers.get(path);
    if (!buf) return false;
    const s = ctx.createBufferSource(); s.buffer = buf;
    s.playbackRate.value = 1 + (Math.random() - 0.5) * 0.03; // variación mínima para que no suene robótico
    const g = ctx.createGain(); g.gain.value = 0.25 + v * 0.75;
    s.connect(g); g.connect(out); s.start(t);
    voice(Math.min(buf.duration, 1.5));
    return true;
  }

  function hit(out, kind, note, v, t) {
    if (!sample(out, kind, note, v, t)) synth(out, kind, note, v, t);
  }

  // kind: id de la forma · note: índice de nota · vel: 0–1 · delay: segundos extra
  // Cuantizado a la semicorchea: cada golpe cae a tiempo con la música.
  function play(kind, note, vel, delay = 0) {
    if (!on || !ctx || voices > 32) return;
    const v = Math.max(0.08, Math.min(1, vel));
    const t = nextStep(ctx.currentTime + delay + 0.005);
    hit(fxBus, kind, note, v, t);
  }

  /* ---------- música adaptativa ---------- */
  // Capas sintetizadas por nivel. Patrones de 16 semicorcheas (un compás de 4/4).
  // 1 = tranquilo (pulso), 2 = medio (+ bajo), 3 = intenso (+ caja, toms y marimba).
  const LAYERS = [
    { min: 1, kind: 'circulo', vel: 0.35, steps: [0, 8] },
    { min: 1, kind: 'triangulo', vel: 0.18, steps: [2, 6, 10, 14] },
    { min: 2, kind: 'pildora', vel: 0.32, steps: [0, 3, 6, 10, 12], notes: [0, 0, 2, 3, 1] },
    { min: 3, kind: 'cuadrado', vel: 0.35, steps: [4, 12] },
    { min: 3, kind: 'triangulo', vel: 0.14, steps: [0, 4, 8, 12] },
    { min: 3, kind: 'luna', vel: 0.22, steps: [0, 3, 7, 10, 14], notes: [4, 3, 5, 2, 4] },
    { min: 3, kind: 'dona', vel: 0.25, steps: [13, 15], notes: [2, 0] },
  ];
  const GROOVE_FOR = { 1: 'tranquilo', 2: 'medio', 3: 'intenso' };
  let level = 0, target = 0, seqTimer = null, nextT = 0, stepN = 0, loopSrc = null, loopLevel = 0;

  function setMusic(n) {
    target = Math.max(0, Math.min(3, Number(n) || 0));
    if (!ctx) return;
    // volumen de la música: entra y sale suave
    musicBus.gain.setTargetAtTime(target ? 0.42 : 0, ctx.currentTime, 0.6);
  }

  function startSequencer() {
    if (seqTimer) return;
    nextT = nextStep(ctx.currentTime + 0.05);
    stepN = Math.round((nextT - clock0) / STEP);
    seqTimer = setInterval(schedule, 25);
  }

  // Programa las notas de los próximos 120 ms (patrón clásico de lookahead de Web Audio).
  function schedule() {
    if (!on || !ctx || ctx.state !== 'running') return;
    while (nextT < ctx.currentTime + 0.12) {
      const s = stepN % 16;
      if (s === 0) level = target; // los cambios de nivel entran al inicio del compás
      const grooveName = GROOVE_FOR[level], groove = manifest?.grooves?.[grooveName];
      if (groove && buffers.get(groove)) {
        // con grooves grabados: un loop por nivel, sincronizado al compás
        if (s === 0 && loopLevel !== level) startLoop(buffers.get(groove), nextT);
      } else {
        stopLoop(nextT);
        for (const L of LAYERS) {
          if (level < L.min) continue;
          const i = L.steps.indexOf(s);
          if (i >= 0) hit(musicBus, L.kind, L.notes ? L.notes[i] : 0, L.vel, nextT);
        }
      }
      if (level === 0) stopLoop(nextT);
      nextT += STEP;
      stepN++;
    }
  }
  function startLoop(buf, t) {
    stopLoop(t);
    loopSrc = ctx.createBufferSource();
    loopSrc.buffer = buf; loopSrc.loop = true;
    loopSrc.connect(musicBus); loopSrc.start(t);
    loopLevel = level;
  }
  function stopLoop(t) {
    if (!loopSrc) return;
    try { loopSrc.stop(t); } catch (e) {}
    loopSrc = null; loopLevel = 0;
  }

  return { play, unlock, toggle, choose, setMusic, get on() { return on; } };
}
