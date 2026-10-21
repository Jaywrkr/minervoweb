# Minervo Studio

Estudio de experiencias de marca. Diseño, código y movimiento.

Minervo nació como revista digital para el talento latino en diseño y en 2020 se convirtió en estudio creativo. En 2026 vuelve con la misma raíz visual (color plano, formas primarias, arte generativo) pero con un cambio central: **las formas ya no están quietas. Se mueven, reaccionan y se generan con código.**

## Concepto

- **Qué hacemos:** experiencias web (landings, micrositios interactivos), identidades vivas (sistemas visuales generativos), motion y contenido, visuales en vivo para eventos, y UX/UI de producto.
- **Idea de marca:** las mismas formas de 2020, ahora vivas.
- **Taglines:** "Experiencias que se mueven." (principal) · "Marcas que se sienten." · "Diseño, código y movimiento."

## Voz

Directa, corta, en minúsculas cuando es marca y en mayúsculas cuando es manifiesto.

- Sí: "hacemos webs que se sienten." · "la creatividad no espera el momento perfecto."
- No: "Aceleramos el valor de tu marca con innovación digital ⚡⚡⚡".
- Sin citas de otros autores, sin rayos ⚡, sin paredes de hashtags (máximo 3–5, al final).
- Frases propias, firmadas por el estudio.

## Color

Dark es el modo principal (`ground` #0b0b0d). La paleta de 2020 se mantiene, más saturada y con más contraste:

| token | rol |
| --- | --- |
| `violeta` | Insignia #1. Slabs y fondos grandes. Texto en `white`. |
| `rosa` | Insignia #2. Fondos de frase y manifiesto. Texto en `on-color`. |
| `naranja` | Energía. Acentos chicos, donas, CTAs. |
| `mostaza` | Calidez. Barras y píldoras. |
| `menta` | Frescura. Fondo de manifiesto y color del `punto`. |
| `verde` | Contraste profundo. Triángulos y bloques. Texto en `white`. |

Reglas:
- Máximo 3 colores de la paleta por pieza, más `ground` e `ink`.
- Color plano, sin degradados salvo en piezas generativas en movimiento.
- Texto sobre rosa, naranja, mostaza y menta: siempre `on-color`. Sobre violeta y verde: `white`.
- `violeta` y `verde` no van como texto pequeño sobre `ground` dark (no llegan a 4.5:1).

## Tipografía

- **Geist** (`display`, `sans`): grotesca limpia. El display va grande, ajustado (`display-xl` 120px, interlineado .92) y en minúsculas.
- **Anton** (`poster`): solo para manifiestos en bloque, en MAYÚSCULAS. Hereda el post "la creatividad no espera ese momento perfecto".
- **Geist Mono** (`mono`, estilo `label`): etiquetas, números de serie, metadatos del caso ("caso 03 · web · 2026"). Es el guiño técnico: diseño + código.

## Wordmark

`minərvo.studio` — la "e" invertida (ə) y el punto en `punto` (menta) son intocables. Se escribe en Geist medium, minúsculas. Avatar: "ə." solo.

Pendiente: subir el archivo original del logo a la galería de Logos para reemplazar la versión tipográfica.

## Formas

Seis formas primarias, todas a partir de `radius-0` y `radius-pill`: círculo, dona, media luna, triángulo, píldora, cuadrado. Más dos patrones:
- **Grilla op-art:** franjas horizontales de `space-2` a paso `space-3`, interrumpidas por bloques de color rectos.
- **Cinta:** la "Z" de tres trazos con degradado de la paleta, solo animada.

## Movimiento (lo nuevo de 2026)

- Las formas entran, flotan, chocan y se reordenan. Nada aparece de golpe.
- Ritmo: entradas de 400–600 ms con easing suave; loops de 6–10 s.
- Piezas generativas en código (p5.js, TouchDesigner) y audio-reactivas para eventos.
- Grano sutil en fondos de video; nunca en texto.

## Instagram

Mezcla del feed: **70% casos reales** (screen recordings de webs y experiencias), **20% experimentos generativos**, **10% frases propias**.

Plantillas (ver componentes):
- `PostCaso` — el caso. Dark, grabación de pantalla al centro, label mono arriba.
- `PostGenerativo` — grilla op-art o formas en movimiento, sin texto o con el wordmark.
- `PostManifiesto` — Anton en bloque sobre menta o rosa.
- `PostFrase` — frase propia en Geist sobre rosa.

Formato 4:5 (1080 × 1350). Margen interior `space-4` escalado (~64px a tamaño real).

## Qué no hacer

- Memphis pastel estático copiado de 2020.
- Más de 3 colores de la paleta juntos.
- Emojis o ⚡ como recurso visual.
- Texto largo en el post: el texto va en el caption.
