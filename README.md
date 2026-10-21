# minərvo.studio

Web de Minervo Studio — estudio de experiencias de marca. Diseño, código y movimiento.

## Flujo de trabajo

- Cada cambio va en una rama nueva.
- Se revisa y se integra a `main` con un pull request.

## Estructura

```
src/
  pages/index.astro      home one-page
  components/            secciones (Hero, Work, Services, Manifesto, Studio, Contact…)
  data/content.js        textos, casos, servicios y datos de contacto ([PLACEHOLDERS])
  scripts/formas.js      escena de formas: física 2D, formaciones por scroll, pads
  scripts/render3d.js    render 3D de las formas (Three.js): luz, sombras, materiales
  scripts/support3d.js   decide 3D o 2D (sin WebGL, movimiento reducido o ?escena=2d → 2D)
  pages/lab/3d.astro     laboratorio 3D (fuera del sitemap)
  scripts/audio.js       motor de sonido: muestras o síntesis, tempo 96 bpm, música adaptativa
  scripts/formations.js  puntos de la ə, grillas y franjas op-art
  scripts/kinds.js       las 6 formas, colores e iconos
  styles/global.css      tokens y estilos
public/prototipos/       prototipos sueltos
public/sounds/           grabaciones (ver su README); manifest.json se genera solo
brand/                   sistema visual 2026: guía, tokens y plantillas de Instagram
```

La navegación usa el router de Astro (`ClientRouter`): el escenario de formas, el menú y los pads persisten entre páginas (`transition:persist`), así las formas nunca se reinician. Lo que depende del contenido de cada página se conecta en `astro:page-load`.

Cada `<section data-mode="…">` define qué hacen las formas mientras está al centro de la pantalla: `glyph` (arman la ə), `slots` (cada forma va a su servicio), `stripes` (grilla op-art) o `chaos` (caen con gravedad).

## Desarrollo

```
npm install
npm run dev      # http://localhost:4321
npm run build    # sitio estático en dist/
```

Stack: Astro + Matter.js (física) + Three.js (render 3D). Fuentes propias en `public/fonts` (Geist, Geist Mono y Anton, licencia SIL OFL).
