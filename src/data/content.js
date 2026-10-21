// Contenido editable de la home. Los valores entre [CORCHETES] son placeholders por reemplazar.

export const contact = {
  email: '[EMAIL]',
  whatsapp: '#contacto', // link wa.me cuando esté el número
  instagram: 'https://instagram.com/minervostudio',
  behance: '#inicio',
  projects: '[N]+',
};

// 6 casos. `shot` es solo el arte provisional hasta tener el video.
// Para cada caso real: slug (url), client, type, year, bg (color de la marca), video (/videos/x.mp4),
// poster, url (sitio en vivo) y los textos de `caseText` abajo.
export const cases = [
  { slug: 'caso-01', client: '[CLIENTE 01]', type: 'experiencia web', year: 2026, bg: 'violeta',
    shot: [{ s: 'right:-30px;top:-30px;width:46%;aspect-ratio:1;border-radius:999px;background:var(--rosa)' },
           { s: 'left:10%;top:22%;width:30%;height:16%;border-radius:999px;background:var(--mostaza)' }] },
  { slug: 'caso-02', client: '[CLIENTE 02]', type: 'identidad viva', year: 2026, bg: 'menta',
    shot: [{ s: 'left:12%;top:12%;width:24%;height:56%;background:var(--violeta)' },
           { s: 'left:44%;top:30%;width:20%;height:40%;background:var(--naranja)' }] },
  { slug: 'caso-03', client: '[CLIENTE 03]', type: 'micrositio', year: 2025, bg: 'rosa',
    shot: [{ s: 'left:-12%;bottom:-24%;width:52%;aspect-ratio:1;border-radius:999px;border:clamp(20px,4vw,34px) solid var(--naranja)' },
           { s: 'right:14%;top:14%;width:0;height:0;border-top:40px solid transparent;border-bottom:40px solid transparent;border-left:72px solid var(--verde)' }] },
  { slug: 'caso-04', client: '[EVENTO 04]', type: 'visuales en vivo', year: 2026, bg: 'verde',
    shot: [{ s: 'right:12%;top:16%;width:34%;aspect-ratio:1;border-radius:999px;background:var(--menta)' },
           { s: 'left:10%;top:14%;width:24%;aspect-ratio:1;background:var(--mostaza)' }] },
  { slug: 'caso-05', client: '[CLIENTE 05]', type: 'ux/ui de producto', year: 2025, bg: 'mostaza',
    shot: [{ s: 'left:10%;top:18%;width:56%;height:18%;border-radius:999px;background:var(--rosa)' },
           { s: 'left:26%;top:44%;width:56%;height:18%;border-radius:999px;background:var(--violeta)' }] },
  { slug: 'caso-06', client: '[CLIENTE 06]', type: 'motion', year: 2026, bg: 'naranja',
    shot: [{ s: 'left:12%;top:-20%;width:40%;aspect-ratio:1;border-radius:0 0 999px 999px;background:var(--mostaza)' },
           { s: 'right:10%;top:22%;width:22%;aspect-ratio:1;border-radius:999px;background:var(--ground)' }] },
];

// Cada servicio tiene su forma; las formas de ese tipo se acomodan en su tarjeta.
export const services = [
  { slot: 'cuadrado', tag: 'web', title: 'experiencias web', text: 'Landings, micrositios y webs interactivas que se recorren, no solo se leen.' },
  { slot: 'circulo', tag: 'marca', title: 'identidades vivas', text: 'Sistemas de marca generativos: logos, patrones y formas que cambian con el contexto.' },
  { slot: 'dona', tag: 'contenido', title: 'motion y contenido', text: 'Animación, reels y piezas para redes con el mismo lenguaje de la marca.' },
  { slot: 'triangulo', tag: 'eventos', title: 'visuales en vivo', text: 'Visuales audio-reactivos para lanzamientos, conciertos e instalaciones.' },
  { slot: 'pildora', tag: 'producto', title: 'UX/UI de producto', text: 'Apps y plataformas diseñadas desde el usuario, listas para desarrollo.' },
  { slot: 'luna', tag: 'dirección', title: 'dirección creativa', text: 'Concepto, campaña y dirección de arte para que todo hable igual.' },
];

// Textos de cada página de caso. Por defecto, placeholders; se reemplazan por slug.
const placeholderText = {
  summary: '[Una línea: qué se hizo y para quién.]',
  challenge: '[El reto del cliente en 2–3 frases. Qué problema tenía la marca.]',
  solution: '[Qué propusimos y por qué. La idea central del proyecto en 2–3 frases.]',
  result: '[Resultado concreto: visitas, conversiones, ventas, premios o reacción del público.]',
  credits: ['[Dirección creativa: Juan Carlos Jaramillo]', '[Desarrollo: …]'],
};
export const caseText = {
  // 'caso-01': { summary: '…', challenge: '…', solution: '…', result: '…', credits: ['…'] },
};
export const textFor = (slug) => ({ ...placeholderText, ...(caseText[slug] || {}) });
