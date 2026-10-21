import * as THREE from "./vendor/three.module.js?v=1.0.36";

const canvas = document.getElementById("threeCanvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#9fc8c4");
scene.fog = new THREE.Fog("#9fc8c4", 18, 92);
const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 170);
const sun = new THREE.DirectionalLight("#ffe4a5", 2.6);
sun.position.set(-15, 20, 8);
scene.add(sun, new THREE.HemisphereLight("#eaf7dd", "#34534b", 2.1));

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(95, 260),
  new THREE.MeshStandardMaterial({ color: "#799d58", roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.z = 35;
scene.add(ground);

const path = new THREE.Mesh(
  new THREE.PlaneGeometry(5.2, 260),
  new THREE.MeshStandardMaterial({ color: "#cda66c", roughness: 1 })
);
path.rotation.x = -Math.PI / 2;
path.position.y = 0.015;
path.position.z = 35;
scene.add(path);

const water = new THREE.Mesh(
  new THREE.PlaneGeometry(11, 260),
  new THREE.MeshStandardMaterial({ color: "#78bdc7", roughness: 0.35, metalness: 0.05, transparent: true, opacity: 0.72 })
);
water.rotation.x = -Math.PI / 2;
water.position.set(8.6, 0.01, 35);
scene.add(water);

const player = new THREE.Group();
const bodyMat = new THREE.MeshStandardMaterial({ color: "#d99a49", roughness: 0.8 });
const skinMat = new THREE.MeshStandardMaterial({ color: "#ad673e", roughness: 0.85 });
const darkMat = new THREE.MeshStandardMaterial({ color: "#273039", roughness: 0.9 });
const creamMat = new THREE.MeshStandardMaterial({ color: "#f1d69a", roughness: 0.8 });
const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.44, 0.7, 5, 10), bodyMat);
body.position.y = 0.82;
const head = new THREE.Mesh(new THREE.SphereGeometry(0.52, 16, 12), skinMat);
head.position.set(0, 1.55, 0.02);
const beret = new THREE.Mesh(new THREE.SphereGeometry(0.57, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), creamMat);
beret.scale.set(1, 0.38, 0.9);
beret.position.set(-0.08, 1.94, 0.02);
const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), darkMat);
eye.position.set(0.43, 1.57, -0.28);
player.add(body, head, beret, eye);
scene.add(player);

const companion = new THREE.Group();
companion.add(
  new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 10), new THREE.MeshStandardMaterial({ color: "#c86f3f", roughness: 0.9 })),
  new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 10), new THREE.MeshStandardMaterial({ color: "#f0bd6c", roughness: 0.8 }))
);
companion.children[1].position.y = 0.28;
scene.add(companion);

const forest = new THREE.Group();
scene.add(forest);
const trunkGeometry = new THREE.CylinderGeometry(0.22, 0.32, 2.4, 8);
const crownGeometry = new THREE.SphereGeometry(1.35, 12, 10);
const trunkMat = new THREE.MeshStandardMaterial({ color: "#704c34", roughness: 1 });
const leafMaterials = ["#496f3c", "#628b49", "#789b4d"].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 1 }));
const treeChunks = new Map();

function seeded(value) {
  const raw = Math.sin(value * 78.233) * 43758.5453;
  return raw - Math.floor(raw);
}

function makeTree(z, side, seed) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(trunkGeometry, trunkMat);
  trunk.position.y = 1.18;
  const crown = new THREE.Mesh(crownGeometry, leafMaterials[Math.floor(seeded(seed + 4) * leafMaterials.length)]);
  crown.position.y = 2.75 + seeded(seed + 2) * 0.45;
  crown.scale.set(0.8 + seeded(seed) * 0.45, 0.78 + seeded(seed + 8) * 0.38, 0.8 + seeded(seed + 5) * 0.38);
  tree.add(trunk, crown);
  tree.position.set(side * (4.7 + seeded(seed + 3) * 7), 0, z);
  tree.rotation.y = seeded(seed + 7) * Math.PI;
  return tree;
}

function updateForest(center) {
  const current = Math.floor(center / 18);
  for (let chunk = current - 4; chunk <= current + 5; chunk += 1) {
    if (treeChunks.has(chunk)) continue;
    const group = new THREE.Group();
    for (let i = 0; i < 7; i += 1) {
      const seed = chunk * 31 + i * 17;
      group.add(makeTree(chunk * 18 + seeded(seed) * 18, i % 2 ? 1 : -1, seed));
    }
    forest.add(group);
    treeChunks.set(chunk, group);
  }
  for (const [chunk, group] of treeChunks) {
    if (Math.abs(chunk - current) > 6) {
      forest.remove(group);
      treeChunks.delete(chunk);
    }
  }
}

const lantern = new THREE.Group();
const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.3, 0.12), trunkMat);
post.position.y = 1.15;
const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), new THREE.MeshStandardMaterial({ color: "#ffd66c", emissive: "#ffb64b", emissiveIntensity: 2.5 }));
lamp.position.set(0.18, 2.1, 0);
lantern.add(post, lamp);
scene.add(lantern);
const lanternLight = new THREE.PointLight("#ffc95b", 4.5, 8);
lantern.add(lanternLight);
lanternLight.position.copy(lamp.position);

const portal = new THREE.Group();
const portalRing = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.12, 10, 28), new THREE.MeshStandardMaterial({ color: "#d7ca86", emissive: "#b7a55d", emissiveIntensity: 1.3 }));
portalRing.rotation.y = Math.PI / 2;
portalRing.position.y = 1.05;
portal.add(portalRing);
portal.visible = false;
scene.add(portal);

function gameZ(x) { return Number.isFinite(x) ? x * 0.038 : 0; }
function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(height, 1);
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize, { passive: true });
resize();

function frame(time) {
  const game = window.bosquetGame;
  const state = game?.state;
  if (state) {
    const z = gameZ(state.player.x);
    const moving = Math.abs(state.player.vx || 0) > 3;
    player.position.set((state.player.depth || 0) * 0.05, moving ? Math.abs(Math.sin(time * 0.012)) * 0.06 : 0, z);
    player.rotation.y = state.player.face < 0 ? Math.PI : 0;
    updateForest(z);
    lantern.position.set(-3.3, 0, Math.floor(z / 14) * 14 + 7);
    const isVisibleCompanion = state.companion?.unlocked && state.companion?.present !== false;
    companion.visible = Boolean(isVisibleCompanion);
    companion.position.set((state.player.depth || 0) * 0.05 - 0.85, 0.27 + Math.sin(time * 0.006) * 0.025, z - 0.45);
    portal.visible = Boolean(state.activeSecretPortal);
    if (portal.visible) {
      portal.position.set(0, 0, gameZ(state.activeSecretPortal.x));
      portal.rotation.y = time * 0.001;
    }
    const lateral = (state.player.depth || 0) * 0.05;
    const target = new THREE.Vector3(lateral, 0.95, z + 0.7);
    const desired = new THREE.Vector3(lateral + 7.6, 5.4, z - 10.5);
    camera.position.lerp(desired, 0.055);
    camera.lookAt(target);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

document.body.classList.add("is-3d");
window.bosquet3D = { active: true };
requestAnimationFrame(frame);
