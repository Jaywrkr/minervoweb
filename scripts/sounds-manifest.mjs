// Genera public/sounds/manifest.json a partir de los archivos de audio en public/sounds/.
// Corre solo antes de `npm run dev` y `npm run build`. Convenciones de nombres: public/sounds/README.md
import { readdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../public/sounds/', import.meta.url).pathname;
const KINDS = ['circulo', 'dona', 'luna', 'triangulo', 'pildora', 'cuadrado'];
const AUDIO = /\.(mp3|ogg|m4a|wav)$/i;
const list = (dir) => (existsSync(dir) && statSync(dir).isDirectory() ? readdirSync(dir).filter((f) => AUDIO.test(f)).sort() : []);

const manifest = { kits: {}, grooves: {} };
for (const kind of KINDS) {
  const files = list(join(ROOT, kind));
  if (!files.length) continue;
  const kit = {};
  for (const level of ['soft', 'medium', 'hard']) {
    const f = files.filter((n) => n.startsWith(level + '-')).map((n) => `${kind}/${n}`);
    if (f.length) kit[level] = f;
  }
  const notes = files.filter((n) => n.startsWith('nota-')).map((n) => `${kind}/${n}`);
  if (notes.length) kit.notes = notes;
  if (Object.keys(kit).length) manifest.kits[kind] = kit;
}
for (const f of list(join(ROOT, 'grooves'))) {
  const name = f.replace(AUDIO, '');
  if (['tranquilo', 'medio', 'intenso'].includes(name)) manifest.grooves[name] = `grooves/${f}`;
}

writeFileSync(join(ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const n = Object.values(manifest.kits).reduce((a, k) => a + Object.values(k).flat().length, 0);
console.log(`[sonidos] ${n} muestras en ${Object.keys(manifest.kits).length} instrumentos, ${Object.keys(manifest.grooves).length} grooves`);
