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
  scripts/formas.js      escena de formas: física, formaciones por scroll, pads
  scripts/audio.js       sonido sintetizado de cada forma
  scripts/formations.js  puntos de la ə, grillas y franjas op-art
  scripts/kinds.js       las 6 formas, colores e iconos
  styles/global.css      tokens y estilos
public/prototipos/       prototipos sueltos
brand/                   sistema visual 2026: guía, tokens y plantillas de Instagram
```

Cada `<section data-mode="…">` define qué hacen las formas mientras está al centro de la pantalla: `glyph` (arman la ə), `slots` (cada forma va a su servicio), `stripes` (grilla op-art) o `chaos` (caen con gravedad).

## Desarrollo

```
npm install
npm run dev      # http://localhost:4321
npm run build    # sitio estático en dist/
```

Stack: Astro + Matter.js. Fuentes: Geist, Geist Mono y Anton (Google Fonts).
