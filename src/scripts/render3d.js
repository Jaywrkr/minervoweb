// Render 3D de la escena de formas (F1).
// La física sigue siendo 2D (formas.js, en píxeles); aquí cada cuerpo se dibuja como un objeto 3D
// de plástico mate con luz rasante y sombra sobre la página. El canvas 3D va encima del 2D,
// es transparente y no recibe eventos: el 2D sigue manejando puntero y franjas op-art.
import {
  WebGLRenderer, Scene, PerspectiveCamera, HemisphereLight, DirectionalLight, Mesh, PlaneGeometry,
  ShadowMaterial, MeshPhysicalMaterial, MeshStandardMaterial, SphereGeometry, TorusGeometry, ExtrudeGeometry, Shape,
  CapsuleGeometry, Color, PCFSoftShadowMap, ACESFilmicToneMapping, SRGBColorSpace, MathUtils,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const FOV = 28, CAM_Z = 40, WALL_Z = -1.6;

// Geometrías de radio base 1, alineadas con los cuerpos de Matter (eje y hacia arriba).
function unitGeometry(id, lite) {
  const q = lite ? 0.6 : 1; // menos polígonos en teléfonos
  switch (id) {
    case 'circulo': return new SphereGeometry(1, Math.round(40 * q), Math.round(28 * q));
    case 'dona': return new TorusGeometry(0.9 * 0.75, 0.9 * 0.25, Math.round(24 * q), Math.round(56 * q));
    case 'luna': {
      const r = 1.15, sh = new Shape();
      sh.absarc(0, 0, r, Math.PI, 2 * Math.PI, false);
      sh.lineTo(-r, 0);
      const g = new ExtrudeGeometry(sh, { depth: 0.8, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: lite ? 2 : 3, curveSegments: Math.round(36 * q) });
      g.translate(0, (4 * r) / (3 * Math.PI), -0.4); // centroide del semicírculo, como en Matter
      return g;
    }
    case 'triangulo': {
      // mismos vértices que Bodies.polygon(3): ángulos 60°, 180°, 300° (con y invertida)
      const r = 1.1, sh = new Shape();
      [60, 180, 300].forEach((d, i) => {
        const a = MathUtils.degToRad(d), x = Math.cos(a) * r, y = -Math.sin(a) * r;
        i ? sh.lineTo(x, y) : sh.moveTo(x, y);
      });
      sh.closePath();
      const g = new ExtrudeGeometry(sh, { depth: 0.8, bevelEnabled: true, bevelSize: 0.07, bevelThickness: 0.07, bevelSegments: 3 });
      g.translate(0, 0, -0.4);
      return g;
    }
    case 'pildora': return new CapsuleGeometry(0.475, 1.85, Math.round(10 * q), Math.round(28 * q)).rotateZ(Math.PI / 2);
    case 'cuadrado': return new RoundedBoxGeometry(1.6, 1.6, 1.1, lite ? 2 : 4, 0.12);
  }
}

export function createRender3D(colorOf) {
  const mobile = matchMedia('(pointer: coarse)').matches;
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = SRGBColorSpace;
  const el = renderer.domElement;
  el.className = 'scene3d';
  el.setAttribute('aria-hidden', 'true');

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 200);
  camera.position.set(0, 0, CAM_Z);

  // luz principal rasante arriba-izquierda; relleno frío bajo
  scene.add(new HemisphereLight(0xffffff, 0x1a1a22, 0.6));
  const key = new DirectionalLight(0xfff4e8, 2.6);
  key.position.set(-10, 16, 14);
  key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0004;
  scene.add(key);
  const fill = new DirectionalLight(0x9fb4ff, 0.35);
  fill.position.set(12, -4, 10);
  scene.add(fill);

  // pared invisible que solo recibe sombras: la página se ve detrás
  const wall = new Mesh(new PlaneGeometry(1, 1), new ShadowMaterial({ opacity: 0.55 }));
  wall.position.z = WALL_Z;
  wall.receiveShadow = true;
  scene.add(wall);

  const geos = {}, mats = {};
  // en teléfonos, material estándar (sin clearcoat): casi igual a la vista y bastante más liviano
  const matFor = (kind) => (mats[kind.id] ||= mobile
    ? new MeshStandardMaterial({ color: new Color(colorOf(kind.token)), roughness: 0.45, metalness: 0 })
    : new MeshPhysicalMaterial({ color: new Color(colorOf(kind.token)), roughness: 0.48, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.55 }));
  const meshes = new Map(); // body → mesh
  let W = 0, H = 0, k = 1; // k = unidades de mundo por píxel

  /* ---------- calidad adaptativa ----------
     Mide los cuadros por segundo reales. Si baja de ~45 fps, reduce resolución y sombras paso a paso;
     si sobra rendimiento por un rato, vuelve a subir. Nunca baja de 1x sin sombras. */
  const dev = Math.min(window.devicePixelRatio || 1, 2);
  const LEVELS = [
    { dpr: dev, shadows: true, map: 2048 },
    { dpr: Math.min(dev, 1.5), shadows: true, map: 1024 },
    { dpr: Math.min(dev, 1.25), shadows: true, map: 1024 },
    { dpr: 1, shadows: false, map: 512 },
  ];
  let level = mobile ? 1 : 0;
  const topLevel = level;
  let frames = 0, acc = 0, good = 0, lastT = 0;
  function applyLevel() {
    const L = LEVELS[level];
    renderer.setPixelRatio(L.dpr);
    if (W) renderer.setSize(W, H, false);
    if (key.shadow.map && key.shadow.mapSize.x !== L.map) { key.shadow.map.dispose(); key.shadow.map = null; }
    key.shadow.mapSize.set(L.map, L.map);
    key.castShadow = L.shadows;
    wall.visible = L.shadows;
    dirty = true;
  }
  function measure(t) {
    if (lastT) { acc += Math.min(100, t - lastT); frames++; }
    lastT = t;
    if (frames < 90) return;
    const avg = acc / frames;
    frames = 0; acc = 0;
    if (avg > 22 && level < LEVELS.length - 1) { level++; good = 0; applyLevel(); }
    else if (avg < 14 && level > topLevel && ++good >= 3) { level--; good = 0; applyLevel(); }
  }

  /* ---------- no dibujar si nada cambió ---------- */
  let dirty = true, lastSig = NaN;
  function signature(bodies) {
    let sig = bodies.length * 1000;
    for (const b of bodies) {
      sig += b.position.x * 0.37 + b.position.y * 0.71 + b.angle * 13 + b.plugin.sc * 7;
      if ((b.plugin.flash || 0) > 0.03) return NaN; // hay un destello en curso
    }
    return sig;
  }

  function resize(w, h) {
    W = w; H = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const viewH = 2 * CAM_Z * Math.tan(MathUtils.degToRad(FOV / 2));
    k = viewH / h;
    wall.scale.set(viewH * camera.aspect * 1.4, viewH * 1.4, 1);
    const s = Math.max(viewH * camera.aspect, viewH) * 0.6;
    Object.assign(key.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 80 });
    key.shadow.camera.updateProjectionMatrix();
    dirty = true;
  }

  function render(bodies) {
    measure(performance.now());
    const sig = signature(bodies);
    if (!dirty && sig === sig && Math.abs(sig - lastSig) < 0.05) return; // escena quieta: no gastar GPU
    lastSig = sig;
    dirty = false;
    const alive = new Set();
    for (const b of bodies) {
      const kind = b.plugin.kind;
      let m = meshes.get(b);
      if (!m) {
        m = new Mesh(geos[kind.id] ||= unitGeometry(kind.id, mobile), matFor(kind));
        m.castShadow = true;
        m.userData.seed = Math.random() * Math.PI * 2;
        scene.add(m);
        meshes.set(b, m);
      }
      alive.add(b);
      const size = b.plugin.s * b.plugin.sc * k;
      m.scale.setScalar(size);
      m.position.set((b.position.x - W / 2) * k, (H / 2 - b.position.y) * k, 0);
      // giro en el plano + una leve inclinación con la velocidad: se sienten objetos, no recortes
      m.rotation.set(-b.velocity.y * 0.03 + Math.sin(m.userData.seed) * 0.12, b.velocity.x * 0.03 + Math.cos(m.userData.seed) * 0.12, -b.angle);
      const f = b.plugin.flash || 0;
      if (f > 0.03) {
        if (m.material === mats[kind.id]) m.material = mats[kind.id].clone();
        m.material.emissive.setRGB(f * 0.32, f * 0.32, f * 0.32);
      } else if (m.material !== mats[kind.id]) {
        m.material.dispose();
        m.material = mats[kind.id];
      }
    }
    for (const [b, m] of meshes) {
      if (!alive.has(b)) { scene.remove(m); if (m.material !== mats[b.plugin.kind.id]) m.material.dispose(); meshes.delete(b); }
    }
    renderer.render(scene, camera);
  }

  applyLevel();
  return { el, resize, render, get level() { return level; } };
}
