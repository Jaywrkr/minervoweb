// ¿Puede este equipo mostrar la escena 3D? Archivo aparte para no cargar three.js solo para preguntarlo.
export function supports3D() {
  try {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (new URLSearchParams(location.search).get('escena') === '2d') return false;
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) {
    return false;
  }
}
