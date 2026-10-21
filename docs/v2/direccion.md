# minərvo.studio v2 — dirección creativa

Objetivo: Site of the Year 2027 (Awwwards). Lanzamiento: abril 2027.

## 1. Concepto

**"minərvo se toca."** La web es un instrumento. Las seis formas de la marca son objetos físicos que suenan, y el visitante recorre el sitio como una partitura: cada sección es un compás y cada interacción cae a tiempo.

En una frase para el jurado: *un estudio que diseña experiencias que se mueven, mostrado como una experiencia que se toca.*

### Reglas del concepto
1. **Todo es una forma.** No hay imágenes decorativas: el color, el movimiento y el sonido salen de las seis formas.
2. **Todo suena a tiempo.** Tempo fijo de 96 bpm. Las interacciones se cuantizan al pulso más cercano.
3. **Nada se corta.** Una sola escena 3D que nunca se reinicia, ni al cambiar de página.
4. **El caos se ordena.** La narrativa de cada sección va del caos (física libre) al orden (la marca, un servicio, un caso).
5. **El visitante deja huella.** Lo que toca cambia la escena y al final se lleva su propia ə (póster, loop de audio).

## 2. Storyboard

Tempo 96 bpm. Cada "compás" es un tramo de scroll de aproximadamente una pantalla.

| # | Momento | Pantalla | Formas | Sonido | Interacción |
| --- | --- | --- | --- | --- | --- |
| 0 | Entrada | Negro. Una sola esfera menta cae y rebota: el punto de la ə. | 1 → 6 | Un golpe de bombo por rebote. | "entrar con sonido / sin sonido". |
| 1 | La marca | Caen las 6 formas en 3D, chocan y arman una ə enorme en franjas de color, con luz rasante. | Caos → ə | Redoble que cierra en un acorde. | El cursor empuja las piezas; vuelven a su sitio. |
| 2 | Titular | "experiencias que se mueven." entra palabra por palabra y cada palabra es un golpe. | La ə respira a 96 bpm. | Pulso de bajo muy suave. | Scroll = el titular sube y la ə gira 15°. |
| 3 | Trabajo | La ə se desarma y las formas forman una cinta que recorre la lista de casos. | Cinta | Cada caso tiene su nota. | Hover en un caso: la cinta toma su color y suena su nota. |
| 4 | Entrar a un caso | Las formas vuelan al centro y se aplanan en el video del caso. | Formas → video | Barrido ascendente. | Clic = transición sin corte. |
| 5 | Servicios | Seis columnas, cada una con su forma. Cada servicio es un instrumento. | Grillas por tipo | Loop de 8 pasos por servicio. | Hover = suena; varios a la vez = una canción. |
| 6 | Manifiesto | Texto gigante; las formas empujan cada palabra desde abajo. | Filas op-art | La música sube de intensidad. | Scroll = las palabras se encienden. |
| 7 | Estudio | Retrato de Jay en video; las formas lo enmarcan como un escenario. | Marco | Tu batería grabada, un groove corto. | Clic en la batería del video = toca un sample. |
| 8 | Contacto | La ə vuelve, pero con lo que tocaste: guarda los colores y formas que usaste. | ə personal | Acorde final. | Remezclar, descargar póster y descargar loop de audio. |

### Transiciones
- **Home → caso:** las formas forman un rectángulo 16:9, se aplanan y el video aparece dentro.
- **Caso → home:** el video se rompe en formas que vuelven a la cinta de trabajo.
- **Siguiente caso:** las formas cambian de color al del próximo cliente sin desarmarse.

## 3. Materiales y luz
- **Material:** plástico mate tipo juguete de diseño, con rugosidad media y un clearcoat leve que da un brillo suave en los bordes. Nada metálico ni cromado.
- **Luz:** una luz principal rasante desde arriba a la izquierda, con sombras suaves y largas sobre una pared casi negra (`ground`), más un relleno frío muy bajo.
- **Cámara:** frontal, con perspectiva leve (25–30°). Se mueve con el scroll como si fuera un travelling, nunca con saltos.
- **Colores:** los seis de la marca, sin cambios. El negro de fondo nunca es puro: `#0b0b0d`.

## 4. Sonido

### Lista de grabaciones (Roland TD-02)
Grabar en WAV, 48 kHz / 24 bit, tres intensidades por golpe (suave, medio, fuerte) y tres variaciones de cada una.

| Forma | Instrumento | Qué grabar |
| --- | --- | --- |
| círculo | bombo | kick |
| cuadrado | caja | snare centro y rim |
| dona | tom | tom 1, tom 2, floor tom |
| triángulo | hi-hat | cerrado, abierto, pedal |
| píldora | bajo | 5 notas en pentatónica de do menor (sintetizador o bajo) |
| media luna | marimba / ride | ride, crash corto |

Además, **3 grooves de 4 compases a 96 bpm** (tranquilo, medio, intenso) para la música adaptativa.

### Mezcla
- Una capa base que siempre suena muy baja una vez activado el sonido.
- Cada sección suma o quita capas: trabajo suma el bajo y el manifiesto suma el groove intenso.
- Las interacciones siempre suenan por encima de la música, cuantizadas al pulso.

## 5. Tipografía
- **Display:** propio o adaptado. Grotesca de proporciones anchas, con la ə como glifo de marca.
- **Opción A (recomendada para SOTY):** contratar a un diseñador tipográfico para un display de 1 peso y unos 80 glifos (latín básico + ə).
- **Opción B:** partir de una fuente libre con licencia SIL OFL y modificar ə, a, e, r y el punto.
- **Texto y etiquetas:** se mantienen Geist y Geist Mono mientras tanto.

## 6. Casos (pendiente de Jay)
Elegir 6. Para cada uno se necesita: nombre, año, tipo, color principal de la marca del cliente, un video de 15–30 s de la pantalla, 3 capturas, y reto, idea y resultado en 2–3 frases cada uno.

Candidatos propuestos: webs de los odontólogos, web JAYWRKR, J-Drums, rig VJ en TouchDesigner, ANKLA, y uno más de cliente.

## 7. Técnica (resumen)
- **3D:** Three.js. Física: cannon-es en el prototipo; se evalúa Rapier para producción.
- **Escena continua:** un solo canvas persistente entre páginas (Astro con transiciones de vista + `transition:persist`).
- **Scroll:** Lenis + una línea de tiempo propia que mueve cámara, formaciones y capas de audio.
- **Audio:** Web Audio con samples, programación por pulso a 96 bpm.
- **Presupuesto de rendimiento:** 60 fps en un celular de gama media, carga inicial menor a 1.5 MB y versión 2D de respaldo.

## 8. Criterios de salida de F0
- [ ] Concepto y storyboard aprobados por Jay
- [ ] 6 casos elegidos
- [ ] Decisión tipográfica (A o B)
- [ ] Prototipo 3D aprobado (F1, rama `v2/motor-3d-prototipo`)
