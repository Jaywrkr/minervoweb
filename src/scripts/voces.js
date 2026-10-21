// La voz de cada marca. "Vestir" no solo cambia colores: el sitio de minərvo se reescribe como lo
// escribiría cada marca. minərvo es el texto por defecto (lo renderiza el HTML).
export const VOICES = {
  minervo: {
    status: 'Agenda abierta · 2027',
    kicker: 'Estudio de sistemas de marca — Cuenca, Ecuador',
    h1: 'Diseñamos sistemas de marca que funcionan en cualquier medio.', hl: -1,
    lead: 'Identidad, web, motion y experiencias construidas como un solo sistema. Esta página también lo es: ajústala desde el panel o pruébala con otra marca.',
    cta: 'Iniciar un proyecto →',
    nav: ['Trabajo', 'Servicios', 'Estudio', 'Contacto'],
    nums: ['01', '02', '03', '04'],
    secServices: 'Servicios', secWork: 'Trabajo seleccionado',
    ticker: ['Estrategia de marca', 'Identidad visual', 'Diseño web', 'Desarrollo', 'Motion', 'Experiencias'], sep: '/',
    services: [
      { t: 'Identidad viva', d: 'Marcas que se comportan, no solo se ven.', l: ['Estrategia y nombre', 'Sistema visual', 'Guías de uso'] },
      { t: 'Web y producto', d: 'Diseño y código en el mismo equipo.', l: ['Sitios a medida', 'Producto digital', 'WebGL y 3D'] },
      { t: 'Motion', d: 'Sistemas que se mueven con intención.', l: ['Animación de marca', 'Video y redes', 'Interfaces'] },
      { t: 'Experiencias', d: 'Instalaciones, eventos y lanzamientos.', l: ['Activaciones', 'Instalaciones', 'Lanzamientos'] },
    ],
    work: [
      { t: 'Proyecto 01', m: '2026 — Identidad, web' },
      { t: 'Proyecto 02', m: '2025 — Motion, producto' },
      { t: 'Proyecto 03', m: '2025 — Experiencia' },
    ],
    art: [],
  },

  // Coresolutions: formal, técnico, B2B. Datos siempre en mono. Retícula de línea fina.
  coresolutions: {
    status: 'Operación 24/7', secServices: 'Soluciones', secWork: 'Portafolio',
    kicker: 'SISTEMAS DE MARCA — CUENCA, EC',
    h1: 'Infraestructura para marcas que necesitan escalar.', hl: 2,
    lead: 'Diseñamos, implementamos y mantenemos sistemas de marca con la disciplina de una arquitectura crítica: documentados, medibles y siempre disponibles.',
    cta: 'Agendar evaluación →',
    nav: ['Portafolio', 'Soluciones', 'Empresa', 'Contacto'],
    nums: ['SOL-01', 'SOL-02', 'SOL-03', 'SOL-04'],
    ticker: ['consistencia 99.9%', '4 líneas de servicio', 'respuesta < 24 h', 'documentación completa', 'soporte continuo', 'SLA de marca'], sep: '·',
    services: [
      { t: 'Identidad corporativa', d: 'Arquitectura de marca documentada y gobernable.', l: ['Diagnóstico de marca', 'Sistema visual', 'Manual de uso'] },
      { t: 'Plataformas web', d: 'Sitios y aplicaciones con estándares empresariales.', l: ['Desarrollo a medida', 'Integraciones', 'Soporte y SLA'] },
      { t: 'Motion corporativo', d: 'Comunicación en movimiento, coherente en cada canal.', l: ['Animación de marca', 'Video institucional', 'Interfaces'] },
      { t: 'Experiencias', d: 'Activaciones con planificación y ejecución controladas.', l: ['Planificación', 'Producción', 'Medición de resultados'] },
    ],
    work: [
      { t: 'Caso 01', m: 'IDENTIDAD + WEB — 2026' },
      { t: 'Caso 02', m: 'MOTION + PRODUCTO — 2025' },
      { t: 'Caso 03', m: 'EXPERIENCIA — 2025' },
    ],
    art: ['NODE-01 · 99.97%', 'sa-east-1', 'BRAND-OPS', 'v2.6.0', 'INC-0000'],
  },

  // Jay Jaramillo: directo, en minúsculas, sin relleno. Siempre termina en "simple."
  jay: {
    status: 'disponible', secServices: 'qué hacemos', secWork: 'trabajo',
    kicker: 'minərvo — diseño, código, movimiento',
    h1: 'hacemos marcas que funcionan. simple.', hl: 4,
    lead: 'sin relleno. sin promesas. diseño que se entiende a la primera.',
    cta: 'escríbeme →',
    nav: ['trabajo', 'qué hacemos', 'estudio', 'contacto'],
    nums: ['1', '2', '3', '4'],
    ticker: ['menos ruido', 'más claridad', 'menos promesas', 'más trabajo'], sep: '—',
    services: [
      { t: 'identidad', d: 'lo justo para que se entienda.', l: ['nombre', 'sistema', ''] },
      { t: 'web', d: 'rápida. clara. sin adornos.', l: ['diseño', 'código', ''] },
      { t: 'motion', d: 'se mueve solo si explica algo.', l: ['marca', 'redes', ''] },
      { t: 'experiencias', d: 'para vivirlas, no para contarlas.', l: ['eventos', 'instalaciones', ''] },
    ],
    work: [
      { t: 'caso uno', m: '2026 — identidad, web' },
      { t: 'caso dos', m: '2025 — motion' },
      { t: 'caso tres', m: '2025 — experiencia' },
    ],
    art: [],
  },

  // ANKLA: cercana, en "tú", honesta con el fallo, sin gurús. Titular fino que remata en negrita.
  ankla: {
    status: 'DÍA 1 EMPIEZA HOY', secServices: 'El sistema', secWork: 'Trabajo',
    kicker: 'SISTEMA GUIADO DE MARCA SOSTENIBLE',
    h1: 'No es diseño bonito. Es un sistema al que tu marca puede volver.', hl: -1, boldFrom: 4,
    lead: 'Basado en lo esencial: el 20% de las decisiones hace el 80% de tu marca. Menos piezas. Más continuidad. Sin gurús.',
    cta: 'EMPEZAR GRATIS',
    nav: ['trabajo', 'el sistema', 'estudio', 'contacto'],
    nums: ['01', '02', '03', '04'],
    ticker: ['día 1', 'día 7', 'día 30', 'racha', 'sin culpa', 'vuelve cuando falles'], sep: '·',
    services: [
      { t: 'Aprendizaje', d: 'Entiendes tu marca antes de diseñarla.', l: ['Diagnóstico', 'Radar de marca', 'Prioridades'] },
      { t: 'Acción', d: 'Un paso que puedes dar incluso en un día malo.', l: ['Identidad', 'Web', 'Contenido'] },
      { t: 'Control', d: 'Mides cada 30 días. Ajustas. Sigues.', l: ['Métricas', 'Revisión', 'Racha'] },
      { t: 'Ritmo', d: 'Puntos de progreso, no presión.', l: ['Motion', 'Experiencias', 'Comunidad'] },
    ],
    work: [
      { t: 'Caso uno', m: 'DÍA 1 → DÍA 240 · identidad' },
      { t: 'Caso dos', m: 'DÍA 1 → DÍA 90 · motion' },
      { t: 'Caso tres', m: 'DÍA 1 → DÍA 30 · experiencia' },
    ],
    art: ['identidad', 'web', 'motion', 'voz', 'redes', 'experiencia', 'producto', 'equipo'],
  },

  // A Todo Terreno: aventura, misterio, expedición. Titulares en mayúsculas, sellos y pasaporte.
  todoterreno: {
    status: 'CONVOY EN RUTA', secServices: 'Equipo de expedición', secWork: 'Bitácora',
    kicker: 'DOCUMENTO DE EXPEDICIÓN · N.º AT26-000000',
    h1: 'Nadie sabe a dónde va tu marca. Todavía.', hl: 7,
    lead: 'Subes sin saber a dónde te llevamos. Bajas entendiendo por qué. Diseño, código y movimiento para marcas que no fallan a las 6 AM, bajo la lluvia.',
    cta: 'SELLAR MI LUGAR →',
    nav: ['RUTA', 'EXPEDICIONES', 'CAMPAMENTO', 'CONTACTO'],
    nums: ['PASO 1', 'PASO 2', 'PASO 3', 'PASO 4'],
    ticker: ['a todo terreno', 'convoy', 'pasaporte', 'ruta secreta', 'sello', 'km 0'], sep: '✕',
    services: [
      { t: 'Identidad', d: 'Tu marca con pasaporte propio.', l: ['Nombre', 'Sistema', 'Sellos'] },
      { t: 'Web', d: 'De formulario a pasaporte.', l: ['Registro', 'Experiencia', 'Desbloqueos'] },
      { t: 'Motion', d: 'El polvo se asienta cuando tocas.', l: ['Intro', 'Conteo regresivo', 'Pistas'] },
      { t: 'Experiencias', d: 'Eventos donde nadie sabe a dónde va.', l: ['Convenciones', 'Convoy', 'Rutas'] },
    ],
    work: [
      { t: 'Expedición 01', m: 'KM 0 → KM 240 · identidad' },
      { t: 'Expedición 02', m: 'KM 0 → KM 90 · experiencia' },
      { t: 'Expedición 03', m: 'KM 0 → KM 30 · web' },
    ],
    art: ['KM 0', 'PISTA 1', 'PISTA 2', 'PISTA 3', 'DESTINO ?'],
  },
};
