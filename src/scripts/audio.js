// Motor de sonido de las formas: cada forma es un instrumento sintetizado, afinado en pentatónica.
export const PENTA = [0, 3, 5, 7, 10, 12, 15, 17];
const hz = (base, semi) => base * Math.pow(2, semi / 12);

export function createAudio({ onChange } = {}) {
  let ctx = null, master = null, noiseBuf = null, on = false, unlocked = false, voices = 0;

  function init() {
    if (ctx) return true;
    const A = window.AudioContext || window.webkitAudioContext;
    if (!A) return false;
    ctx = new A();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0.75;
    master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  function set(value) {
    if (value && !init()) return;
    on = value;
    if (ctx) {
      if (on) ctx.resume();
      master.gain.setTargetAtTime(on ? 0.75 : 0, ctx.currentTime, 0.02);
    }
    onChange && onChange(on);
  }

  // El navegador solo permite sonido después de una interacción.
  function unlock() { if (unlocked) return; unlocked = true; set(true); }
  function toggle() { unlocked = true; set(!on); }
  // elección explícita del visitante (botones del loader)
  function choose(value) { unlocked = true; set(value); }

  function env(g, t, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
  }
  function voice(dur) { voices++; setTimeout(() => voices--, dur * 1000 + 50); }
  function noise(t, dur, type, f, q, peak) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = ctx.createGain(); env(g, t, peak, dur);
    s.connect(fl); fl.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
  }
  function tone(t, type, f0, f1, dur, peak, lowpass) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.8);
    const g = ctx.createGain(); env(g, t, peak, dur);
    if (lowpass) {
      const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lowpass;
      o.connect(fl); fl.connect(g);
    } else o.connect(g);
    g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }

  // kind: id de la forma · note: índice en PENTA · vel: 0–1
  function play(kind, note, vel, delay = 0) {
    if (!on || !ctx || voices > 28) return;
    const v = Math.max(0.08, Math.min(1, vel));
    const t = ctx.currentTime + delay + 0.005;
    switch (kind) {
      case 'circulo': tone(t, 'sine', 150, 42, 0.38, 0.9 * v); voice(0.4); break; // bombo
      case 'dona': // tom
        tone(t, 'sine', hz(196, PENTA[note % 5]), null, 0.32, 0.55 * v);
        tone(t, 'sine', hz(98, PENTA[note % 5]), null, 0.32, 0.3 * v); voice(0.35); break;
      case 'luna': tone(t, 'triangle', hz(392, PENTA[note]), null, 0.5, 0.4 * v, 2400); voice(0.5); break; // marimba
      case 'triangulo': noise(t, 0.06, 'highpass', 7500, 0.7, 0.35 * v); voice(0.08); break; // hi-hat
      case 'pildora': tone(t, 'sawtooth', hz(65.4, PENTA[note]), null, 0.34, 0.42 * v, 520); voice(0.35); break; // bajo
      case 'cuadrado': // caja
        noise(t, 0.16, 'bandpass', 1900, 0.9, 0.6 * v);
        tone(t, 'triangle', 190, 120, 0.09, 0.35 * v); voice(0.18); break;
    }
  }

  return { play, unlock, toggle, choose, get on() { return on; } };
}
