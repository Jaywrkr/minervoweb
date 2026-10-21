// Prototipo F1: las seis formas como objetos 3D (Three.js) con física (cannon-es) y sonido.
// Escena 2.5D: las formas viven entre una pared trasera y una frontal invisible, frente a la cámara.
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createAudio, PENTA } from './audio.js';
import { KINDS } from './kinds.js';
import { glyphPoints } from './formations.js';

const DEPTH = 1.6; // mitad del grosor del "escenario" en z

export function initLab({ mount, ui }) {
  const css = getComputedStyle(document.documentElement);
  const color = (t) => css.getPropertyValue('--' + t).trim();
  const mobile = matchMedia('(pointer: coarse)').matches;

  /* ---------- render ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(color('ground'));
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 200);
  camera.position.set(0, 0.6, 40);
  camera.lookAt(0, 0, 0);

  // luz: principal rasante desde arriba a la izquierda, relleno frío muy bajo
  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1a22, 0.55));
  const key = new THREE.DirectionalLight(0xfff4e8, 2.6);
  key.position.set(-10, 16, 14);
  key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0004;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x9fb4ff, 0.35);
  fill.position.set(12, -4, 10);
  scene.add(fill);

  // pared trasera y piso que reciben sombra
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x111115, roughness: 1, metalness: 0 });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(400, 200), wallMat);
  wall.position.z = -DEPTH - 0.02;
  wall.receiveShadow = true;
  scene.add(wall);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 40), wallMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  /* ---------- física ---------- */
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -22, 0) });
  world.broadphase = new CANNON.SAPBroadphase(world);
  world.allowSleep = true;
  const mat = new CANNON.Material('forma');
  world.addContactMaterial(new CANNON.ContactMaterial(mat, mat, { friction: 0.25, restitution: 0.38 }));
  const walls = [];
  function plane(pos, euler) {
    const b = new CANNON.Body({ mass: 0, material: mat, shape: new CANNON.Plane() });
    b.position.set(...pos);
    b.quaternion.setFromEuler(...euler);
    b.isWall = true;
    world.addBody(b);
    walls.push(b);
    return b;
  }

  let viewW = 30, viewH = 20;
  function layout() {
    const w = mount.clientWidth, h = mount.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    viewH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    viewW = viewH * camera.aspect;
    walls.forEach((b) => world.removeBody(b));
    walls.length = 0;
    const floorY = -viewH / 2 + 0.4;
    plane([0, floorY, 0], [-Math.PI / 2, 0, 0]);               // piso
    plane([-viewW / 2, 0, 0], [0, Math.PI / 2, 0]);            // izquierda
    plane([viewW / 2, 0, 0], [0, -Math.PI / 2, 0]);            // derecha
    plane([0, 0, -DEPTH], [0, 0, 0]);                          // pared trasera
    plane([0, 0, DEPTH], [0, Math.PI, 0]);                     // frontal invisible
    floor.position.y = floorY;
    const s = Math.max(viewW, viewH) * 0.6;
    Object.assign(key.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 80 });
    key.shadow.camera.updateProjectionMatrix();
  }

  /* ---------- formas ---------- */
  const R = mobile ? 0.62 : 0.55; // radio base de cada forma (unidades de mundo)
  const mats = {};
  KINDS.forEach((k) => {
    mats[k.id] = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color(k.token)), roughness: 0.48, metalness: 0,
      clearcoat: 0.35, clearcoatRoughness: 0.55, sheen: 0.2,
    });
  });
  const zAxis = new CANNON.Quaternion().setFromEuler(Math.PI / 2, 0, 0); // eje Y → Z

  function geometryFor(id) {
    switch (id) {
      case 'circulo': return new THREE.SphereGeometry(R, 40, 28);
      case 'dona': return new THREE.TorusGeometry(R * 0.68, R * 0.32, 24, 48);
      case 'luna': {
        const sh = new THREE.Shape();
        sh.absarc(0, 0, R * 1.05, Math.PI, 2 * Math.PI, false);
        sh.lineTo(-R * 1.05, 0);
        const g = new THREE.ExtrudeGeometry(sh, { depth: R * 0.8, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 3, curveSegments: 32 });
        g.center();
        return g;
      }
      case 'triangulo': return new THREE.CylinderGeometry(R * 1.05, R * 1.05, R * 0.8, 3).rotateX(Math.PI / 2);
      case 'pildora': return new THREE.CapsuleGeometry(R * 0.42, R * 1.5, 8, 24).rotateZ(Math.PI / 2);
      case 'cuadrado': return new THREE.BoxGeometry(R * 1.5, R * 1.5, R * 1.1);
    }
  }
  function bodyFor(id) {
    const b = new CANNON.Body({ mass: 1, material: mat, linearDamping: 0.05, angularDamping: 0.08, sleepSpeedLimit: 0.15 });
    switch (id) {
      case 'circulo': b.addShape(new CANNON.Sphere(R)); break;
      case 'dona': b.addShape(new CANNON.Cylinder(R, R, R * 0.64, 16), new CANNON.Vec3(), zAxis); break;
      case 'luna': b.addShape(new CANNON.Box(new CANNON.Vec3(R * 1.05, R * 0.53, R * 0.45))); break;
      case 'triangulo': b.addShape(new CANNON.Cylinder(R * 1.05, R * 1.05, R * 0.8, 3), new CANNON.Vec3(), zAxis); break;
      case 'pildora': b.addShape(new CANNON.Box(new CANNON.Vec3(R * 1.17, R * 0.42, R * 0.42))); break;
      case 'cuadrado': b.addShape(new CANNON.Box(new CANNON.Vec3(R * 0.75, R * 0.75, R * 0.55))); break;
    }
    return b;
  }

  const audio = createAudio({ onChange: ui?.onSound });
  const items = []; // { kind, mesh, body, note, last, flash }
  function spawn(kind, x, y) {
    const mesh = new THREE.Mesh(geometryFor(kind.id), mats[kind.id]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    const body = bodyFor(kind.id);
    body.position.set(x ?? (Math.random() - 0.5) * viewW * 0.7, y ?? viewH / 2 + 2 + Math.random() * 6, (Math.random() - 0.5) * DEPTH);
    body.quaternion.setFromEuler(Math.random() * 0.6, Math.random() * 0.6, Math.random() * Math.PI);
    world.addBody(body);
    const it = { kind, mesh, body, note: Math.floor(Math.random() * PENTA.length), last: 0 };
    body.addEventListener('collide', (e) => {
      const v = Math.abs(e.contact.getImpactVelocityAlongNormal());
      const now = performance.now();
      if (v < 2.5 || now - it.last < 90 || formed.has(it)) return;
      it.last = now;
      audio.play(kind.id, it.note, v / 16);
    });
    items.push(it);
    return it;
  }

  /* ---------- formación de la ə ---------- */
  const formed = new Map(); // item → THREE.Vector3 objetivo
  const identity = new CANNON.Quaternion();
  function formGlyph() {
    const box = 600;
    const { glyph, dot, p } = glyphPoints(box, box, items.length);
    const pitch = R * 2.15; // separación entre piezas en el mundo
    const scale = Math.min(pitch / p, (viewH * 0.82) / box, (viewW * 0.9) / box);
    const toWorld = (q) => new THREE.Vector3((q.x - box / 2) * scale, (box / 2 - q.y) * scale + 0.4, 0);
    formed.clear();
    const circles = items.filter((i) => i.kind.id === 'circulo');
    while (circles.length < dot.length) circles.push(spawn(KINDS[0]));
    while (items.length < glyph.length + dot.length) spawn(KINDS[1 + Math.floor(Math.random() * 5)]);
    circles.slice(0, dot.length).forEach((it, i) => formed.set(it, toWorld(dot[i])));
    const order = (it) => KINDS.indexOf(it.kind);
    const rest = items.filter((i) => !formed.has(i)).sort((a, b) => order(a) - order(b));
    const pts = glyph.slice().sort((a, b) => a.y - b.y || a.x - b.x);
    rest.forEach((it, i) => { if (i < pts.length) formed.set(it, toWorld(pts[i])); });
    formed.forEach((_, it) => { it.body.collisionResponse = false; it.body.wakeUp(); it.arrived = false; });
  }
  function release() {
    formed.forEach((_, it) => {
      it.body.collisionResponse = true;
      it.body.velocity.set((Math.random() - 0.5) * 10, 4 + Math.random() * 8, (Math.random() - 0.5) * 2);
      it.body.angularVelocity.set(Math.random() * 6 - 3, Math.random() * 6 - 3, Math.random() * 6 - 3);
    });
    formed.clear();
  }
  const tmp = new CANNON.Vec3();
  world.addEventListener('preStep', () => {
    formed.forEach((t, it) => {
      const b = it.body;
      // anula la gravedad y lleva la pieza a su lugar como un resorte amortiguado
      b.force.y += -world.gravity.y * b.mass;
      tmp.set(t.x - b.position.x, t.y - b.position.y, t.z - b.position.z);
      b.velocity.set(b.velocity.x * 0.86 + tmp.x * 0.9, b.velocity.y * 0.86 + tmp.y * 0.9, b.velocity.z * 0.86 + tmp.z * 0.9);
      b.quaternion.slerp(identity, 0.08, b.quaternion);
      b.angularVelocity.scale(0.8, b.angularVelocity);
      if (!it.arrived && tmp.lengthSquared() < 0.02) { it.arrived = true; it.flash = 1; audio.play(it.kind.id, it.note, 0.3); }
    });
  });

  /* ---------- puntero: una "mano" invisible empuja las formas ---------- */
  const hand = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, shape: new CANNON.Sphere(1.1) });
  hand.position.set(999, 999, 0);
  world.addBody(hand);
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const zPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3();
  let handTarget = null;
  const toWorldPoint = (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.ray.intersectPlane(zPlane, hit) ? hit.clone() : null;
  };
  renderer.domElement.addEventListener('pointermove', (e) => { handTarget = toWorldPoint(e); }, { passive: true });
  renderer.domElement.addEventListener('pointerleave', () => { handTarget = null; });
  renderer.domElement.addEventListener('pointerdown', (e) => {
    audio.unlock();
    const p = toWorldPoint(e);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(items.map((i) => i.mesh), false);
    if (hits.length) {
      const it = items.find((i) => i.mesh === hits[0].object);
      it.flash = 1;
      audio.play(it.kind.id, it.note, 0.9);
      if (!formed.has(it)) it.body.velocity.set((Math.random() - 0.5) * 6, 12, 0);
      it.body.wakeUp();
    } else if (p && !formed.size) {
      spawn(KINDS[Math.floor(Math.random() * 6)], p.x, p.y + 1);
    }
  });

  /* ---------- bucle ---------- */
  let last = performance.now();
  const flashColor = new THREE.Color(0xffffff);
  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    if (handTarget) {
      // la mano se mueve con velocidad (no teletransporte) para que empuje con fuerza real
      hand.velocity.set((handTarget.x - hand.position.x) / Math.max(dt, 1 / 120), (handTarget.y - hand.position.y) / Math.max(dt, 1 / 120), 0);
    } else { hand.velocity.set(0, 0, 0); hand.position.set(999, 999, 0); }
    world.fixedStep(1 / 60, dt);
    for (const it of items) {
      it.mesh.position.copy(it.body.position);
      it.mesh.quaternion.copy(it.body.quaternion);
      if (it.flash > 0.02) {
        // destello al sonar: material propio solo mientras dura
        if (it.mesh.material === mats[it.kind.id]) it.mesh.material = mats[it.kind.id].clone();
        it.mesh.material.emissive.copy(flashColor).multiplyScalar(it.flash * 0.35);
        it.flash *= 0.85;
        if (it.flash <= 0.02) { it.mesh.material.dispose(); it.mesh.material = mats[it.kind.id]; }
      }
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', layout);
  layout();
  const n = mobile ? 34 : 48;
  for (let i = 0; i < n; i++) spawn(KINDS[i % 6], null, viewH / 2 + 2 + i * 0.9);
  requestAnimationFrame(frame);

  return {
    toggleForm() { if (formed.size) { release(); return false; } formGlyph(); return true; },
    toggleSound() { audio.toggle(); },
    drop(kind) { audio.unlock(); const it = spawn(kind); audio.play(kind.id, it.note, 0.8); },
  };
}
