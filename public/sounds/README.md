# Sonidos de minərvo

Mientras esta carpeta no tenga grabaciones, la web sintetiza los sonidos. Cuando agregas archivos aquí, los usa automáticamente: no hay que tocar código. `manifest.json` se genera solo al correr `npm run dev` o `npm run build`.

Formato recomendado: **mp3 de 192 kbps o ogg**, mono, sin silencio al inicio (el golpe empieza en el milisegundo 0). Graba en WAV 48 kHz / 24 bit y exporta a mp3.

## Golpes (una carpeta por forma)

Tres intensidades: `soft`, `medium` y `hard`. Varias variaciones de cada una, numeradas.

```
public/sounds/
  circulo/    bombo      soft-1.mp3 soft-2.mp3 soft-3.mp3 medium-1.mp3 … hard-3.mp3
  cuadrado/   caja       soft-1.mp3 … hard-3.mp3
  dona/       tom        soft-1.mp3 … hard-3.mp3
  triangulo/  hi-hat     soft-1.mp3 … hard-3.mp3
  luna/       ride       soft-1.mp3 … hard-3.mp3
  pildora/    bajo       nota-1.mp3 … nota-5.mp3   (pentatónica de do menor: do, mi♭, fa, sol, si♭)
```

## Grooves (música de fondo)

Loops de **4 compases exactos a 96 bpm** (10 segundos), que empiecen en el primer golpe:

```
public/sounds/grooves/
  tranquilo.mp3   hero, servicios, contacto
  medio.mp3       trabajo, estudio, casos
  intenso.mp3     manifiesto
```

Si falta algún groove, ese nivel usa la música sintetizada.
