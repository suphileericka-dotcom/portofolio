const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  startScreen: document.getElementById("startScreen"),
  startButton: document.getElementById("startButton"),
  continueButton: document.getElementById("continueButton"),
  journalButton: document.getElementById("journalButton"),
  optionsButton: document.getElementById("optionsButton"),
  muteButton: document.getElementById("muteButton"),
  journalDialog: document.getElementById("journalDialog"),
  optionsDialog: document.getElementById("optionsDialog"),
  journalList: document.getElementById("journalList"),
  resetButton: document.getElementById("resetButton"),
  message: document.getElementById("message"),
  biomeLabel: document.getElementById("biomeLabel"),
  discoveryCount: document.getElementById("discoveryCount"),
  musicVolume: document.getElementById("musicVolume"),
  natureVolume: document.getElementById("natureVolume"),
  mobilePad: document.getElementById("mobilePad"),
  padKnob: document.getElementById("padKnob")
};

const saveKey = "bosquet-lent-save";
const optionsKey = "bosquet-lent-options";
const world = { width: 7200, ground: 0 };
const keys = new Set();
const pointer = { active: false, x: 0, y: 0, worldX: 0 };
const joystick = { active: false, id: null, x: 0, y: 0 };
let audio = null;
let lastTime = 0;
let running = false;
let messageTimer = 0;

const state = {
  player: { x: 380, y: 0, vx: 0, vy: 0, face: 1, rest: 0 },
  camera: { x: 0, y: 0, zoom: 1 },
  time: 0,
  discoveries: [],
  lanterns: [],
  startedAtLeastOnce: false,
  options: { music: 0.22, nature: 0.32, muted: false, audioVersion: 2 }
};

const biomes = [
  { at: 0, name: "Bosquet vert", sky: "#8db9b2", haze: "#e5cf91", tree: "#245343", leaf: "#6f9d68", grass: "#87ac6d" },
  { at: 1800, name: "Clairiere fleurie", sky: "#b5cba8", haze: "#f2c98e", tree: "#4d6c45", leaf: "#9aaf67", grass: "#b8a75f" },
  { at: 3600, name: "Sous-bois frais", sky: "#8bb0bc", haze: "#d8e5ed", tree: "#2d4c57", leaf: "#6f8a8d", grass: "#7a9a8f" },
  { at: 5400, name: "Nuit aux champignons", sky: "#24324f", haze: "#a7d9c4", tree: "#172a38", leaf: "#3f6a75", grass: "#486d69" }
];

const discoveries = [
  { id: "leaf", x: 860, label: "Feuille nervuree", text: "Une feuille rare, brillante comme du papier dore." },
  { id: "stone", x: 1420, label: "Pierre polie", text: "Elle tient dans la paume et garde une fraicheur de ruisseau." },
  { id: "feather", x: 2140, label: "Plume claire", text: "Un oiseau l'a laissee tomber sans se presser." },
  { id: "moss", x: 3020, label: "Statue moussue", text: "Un visage ancien sourit sous les fougeres." },
  { id: "shell", x: 3910, label: "Coquille de riviere", text: "Minuscule spirale trouvee au bord de l'eau." },
  { id: "cone", x: 4740, label: "Pomme de pin bleue", text: "Sa couleur change legerement quand on la tourne." },
  { id: "mushroom", x: 5660, label: "Champignon lueur", text: "Il emet une lumiere calme, presque musicale." },
  { id: "star", x: 6520, label: "Eclat d'etoile", text: "Pose dans l'herbe comme un souvenir du ciel." }
];

const lanterns = [
  { id: "lantern-1", x: 1180 },
  { id: "lantern-2", x: 2480 },
  { id: "lantern-3", x: 5150 },
  { id: "lantern-4", x: 6280 }
];

const rests = [
  { x: 1680, label: "banc de clairiere" },
  { x: 4180, label: "rocher pres de la riviere" },
  { x: 6070, label: "souche phosphorescente" }
];

const butterflies = Array.from({ length: 18 }, (_, index) => ({
  x: 520 + index * 370 + Math.sin(index) * 90,
  y: 0,
  phase: index * 0.8,
  scare: 0
}));

const fireflies = Array.from({ length: 32 }, (_, index) => ({
  x: 1200 + index * 170,
  y: 0,
  phase: index * 1.7
}));

const trees = Array.from({ length: 95 }, (_, index) => {
  const x = index * 82 + Math.sin(index * 4.2) * 55;
  return {
    x,
    h: 180 + Math.abs(Math.sin(index * 1.3)) * 150,
    w: 58 + Math.abs(Math.cos(index * 0.7)) * 60,
    layer: index % 3
  };
});

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  world.ground = window.innerHeight * 0.72;
  state.player.y = world.ground;
}

function getBiome(x) {
  let current = biomes[0];
  for (const biome of biomes) {
    if (x >= biome.at) current = biome;
  }
  return current;
}

function blendHex(a, b, t) {
  const ah = a.replace("#", "");
  const bh = b.replace("#", "");
  const ar = parseInt(ah.slice(0, 2), 16);
  const ag = parseInt(ah.slice(2, 4), 16);
  const ab = parseInt(ah.slice(4, 6), 16);
  const br = parseInt(bh.slice(0, 2), 16);
  const bg = parseInt(bh.slice(2, 4), 16);
  const bb = parseInt(bh.slice(4, 6), 16);
  const rr = Math.round(ar + (br - ar) * t).toString(16).padStart(2, "0");
  const rg = Math.round(ag + (bg - ag) * t).toString(16).padStart(2, "0");
  const rb = Math.round(ab + (bb - ab) * t).toString(16).padStart(2, "0");
  return `#${rr}${rg}${rb}`;
}

function biomeColors() {
  const x = state.player.x;
  const currentIndex = Math.max(0, biomes.findIndex((biome, index) => {
    const next = biomes[index + 1];
    return !next || x < next.at;
  }));
  const current = biomes[currentIndex];
  const next = biomes[currentIndex + 1] || current;
  const span = Math.max(1, next.at - current.at);
  const t = Math.max(0, Math.min(1, (x - current.at) / span));
  return {
    name: current.name,
    sky: blendHex(current.sky, next.sky, t),
    haze: blendHex(current.haze, next.haze, t),
    tree: blendHex(current.tree, next.tree, t),
    leaf: blendHex(current.leaf, next.leaf, t),
    grass: blendHex(current.grass, next.grass, t)
  };
}

function drawEllipse(x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBackground(colors) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, colors.sky);
  gradient.addColorStop(0.58, colors.haze);
  gradient.addColorStop(1, "#22322c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(-state.camera.x * 0.08, 0);
  for (let i = -1; i < 9; i += 1) {
    const mx = i * 540;
    ctx.fillStyle = "rgba(64, 83, 82, 0.24)";
    ctx.beginPath();
    ctx.moveTo(mx - 80, h * 0.55);
    ctx.quadraticCurveTo(mx + 210, h * 0.23, mx + 560, h * 0.55);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.2 + Math.sin(state.time * 0.08) * 0.06;
  ctx.strokeStyle = "#fff8d8";
  ctx.lineWidth = 30;
  for (let i = 0; i < 4; i += 1) {
    const x = (i * 320 + state.time * 8) % (w + 360) - 160;
    ctx.beginPath();
    ctx.moveTo(x, -40);
    ctx.lineTo(x - 150, h * 0.82);
    ctx.stroke();
  }
  ctx.restore();
}

function drawParallaxTrees(colors) {
  const h = window.innerHeight;
  for (let layer = 0; layer < 3; layer += 1) {
    const factor = [0.22, 0.48, 0.82][layer];
    const alpha = [0.34, 0.54, 0.88][layer];
    ctx.save();
    ctx.translate(-state.camera.x * factor, 0);
    ctx.globalAlpha = alpha;
    for (const tree of trees) {
      if (tree.layer !== layer) continue;
      const x = tree.x + layer * 95;
      if (x + tree.w < state.camera.x * factor - 160 || x > state.camera.x * factor + window.innerWidth + 180) continue;
      const base = h * 0.74 + Math.sin(tree.x) * 18;
      ctx.fillStyle = colors.tree;
      roundedRect(x - 8, base - tree.h * 0.68, 16, tree.h * 0.7, 7);
      ctx.fill();
      drawEllipse(x, base - tree.h * 0.72, tree.w * 0.72, tree.h * 0.28, colors.leaf);
      drawEllipse(x - tree.w * 0.34, base - tree.h * 0.58, tree.w * 0.46, tree.h * 0.22, colors.leaf);
      drawEllipse(x + tree.w * 0.34, base - tree.h * 0.55, tree.w * 0.5, tree.h * 0.23, colors.leaf);
    }
    ctx.restore();
  }
}

function drawGround(colors) {
  const h = window.innerHeight;
  ctx.fillStyle = "#20382f";
  ctx.fillRect(0, world.ground, window.innerWidth, h - world.ground);
  ctx.save();
  ctx.translate(-state.camera.x, 0);
  ctx.fillStyle = colors.grass;
  for (let x = Math.floor(state.camera.x / 18) * 18 - 40; x < state.camera.x + window.innerWidth + 60; x += 18) {
    const sway = Math.sin(x * 0.04 + state.time * 2) * 4;
    const nearPlayer = Math.abs(x - state.player.x) < 58;
    ctx.globalAlpha = nearPlayer ? 0.72 : 0.48;
    ctx.beginPath();
    ctx.moveTo(x, world.ground + 12);
    ctx.quadraticCurveTo(x + sway + (nearPlayer ? state.player.face * 10 : 0), world.ground - 18, x + 5, world.ground + 12);
    ctx.lineTo(x - 4, world.ground + 12);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawWorldObjects() {
  ctx.save();
  ctx.translate(-state.camera.x, 0);

  rests.forEach((rest) => {
    const y = world.ground - 18;
    ctx.fillStyle = "#775747";
    roundedRect(rest.x - 54, y - 18, 108, 16, 6);
    ctx.fill();
    ctx.fillRect(rest.x - 38, y - 4, 9, 35);
    ctx.fillRect(rest.x + 29, y - 4, 9, 35);
    if (Math.abs(state.player.x - rest.x) < 90) drawPrompt(rest.x, y - 64, "E se reposer");
  });

  lanterns.forEach((lantern) => {
    const lit = state.lanterns.includes(lantern.id);
    const y = world.ground - 62;
    ctx.strokeStyle = "#3d3028";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(lantern.x, world.ground + 8);
    ctx.lineTo(lantern.x, y);
    ctx.stroke();
    if (lit) {
      const glow = ctx.createRadialGradient(lantern.x, y, 8, lantern.x, y, 135);
      glow.addColorStop(0, "rgba(255, 220, 122, 0.55)");
      glow.addColorStop(1, "rgba(255, 220, 122, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(lantern.x, y, 135, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = lit ? "#ffd773" : "#715a48";
    roundedRect(lantern.x - 14, y - 22, 28, 34, 7);
    ctx.fill();
    if (!lit && Math.abs(state.player.x - lantern.x) < 78) drawPrompt(lantern.x, y - 58, "E allumer");
  });

  discoveries.forEach((item, index) => {
    const collected = state.discoveries.includes(item.id);
    if (collected) return;
    const y = world.ground - 20 + Math.sin(state.time * 2 + index) * 5;
    const color = ["#f0bd6c", "#67b4c8", "#f7f3df", "#8ebf76", "#ce6f75"][index % 5];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(item.x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();
    if (Math.abs(state.player.x - item.x) < 70) drawPrompt(item.x, y - 42, "E ramasser");
  });

  butterflies.forEach((butterfly) => {
    const dist = Math.abs(state.player.x - butterfly.x);
    if (dist < 90) butterfly.scare = Math.min(1, butterfly.scare + 0.04);
    butterfly.scare *= 0.992;
    const y = world.ground - 70 - butterfly.scare * 110 + Math.sin(state.time * 4 + butterfly.phase) * 18;
    const x = butterfly.x + Math.sin(state.time * 2 + butterfly.phase) * 28 + butterfly.scare * 45;
    ctx.fillStyle = "rgba(245, 196, 117, 0.82)";
    drawEllipse(x - 5, y, 8, 5, ctx.fillStyle);
    drawEllipse(x + 5, y, 8, 5, ctx.fillStyle);
  });

  fireflies.forEach((fly) => {
    const follow = Math.max(0, 1 - Math.abs(state.player.x - fly.x) / 340);
    const x = fly.x + Math.sin(state.time * 1.5 + fly.phase) * 32 + follow * (state.player.x - fly.x) * 0.16;
    const y = world.ground - 130 + Math.cos(state.time * 1.8 + fly.phase) * 42;
    const glow = ctx.createRadialGradient(x, y, 1, x, y, 22);
    glow.addColorStop(0, "rgba(180, 239, 184, 0.9)");
    glow.addColorStop(1, "rgba(180, 239, 184, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
  });

  drawRiver();
  drawPlayer();
  ctx.restore();
}

function drawRiver() {
  const riverX = 3820;
  const y = world.ground + 25;
  if (riverX < state.camera.x - 600 || riverX > state.camera.x + window.innerWidth + 600) return;
  ctx.fillStyle = "rgba(103, 180, 200, 0.74)";
  ctx.beginPath();
  ctx.ellipse(riverX, y, 360, 38, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(247, 243, 223, 0.38)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(riverX - 300 + i * 120, y + Math.sin(state.time * 2 + i) * 8);
    ctx.quadraticCurveTo(riverX - 250 + i * 120, y - 10, riverX - 200 + i * 120, y + 2);
    ctx.stroke();
  }
}

function drawPrompt(x, y, text) {
  ctx.save();
  ctx.font = "800 13px Nunito";
  const width = ctx.measureText(text).width + 22;
  ctx.fillStyle = "rgba(20, 34, 33, 0.78)";
  roundedRect(x - width / 2, y - 18, width, 30, 7);
  ctx.fill();
  ctx.fillStyle = "#f7f3df";
  ctx.textAlign = "center";
  ctx.fillText(text, x, y + 2);
  ctx.restore();
}

function drawPlayer() {
  const p = state.player;
  const walk = Math.sin(state.time * 10) * Math.min(1, Math.abs(p.vx) / 190);
  const x = p.x;
  const y = p.y - 48;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p.face, 1);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 50, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2d2730";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-8, 22);
  ctx.lineTo(-16 - walk * 8, 47);
  ctx.moveTo(9, 23);
  ctx.lineTo(17 + walk * 8, 47);
  ctx.stroke();
  ctx.fillStyle = "#ce6f75";
  roundedRect(-17, -5, 34, 39, 13);
  ctx.fill();
  ctx.fillStyle = "#f0bd6c";
  ctx.beginPath();
  ctx.arc(0, -23, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#28312e";
  ctx.beginPath();
  ctx.arc(8, -26, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#22322c";
  ctx.beginPath();
  ctx.ellipse(-3, -37, 20, 10, -0.2, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawOverlay() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const night = Math.max(0, (state.player.x - 5000) / 1700);
  ctx.fillStyle = `rgba(10, 16, 30, ${0.1 + night * 0.42})`;
  ctx.fillRect(0, 0, w, h);
  if (state.player.rest > 0) {
    ctx.save();
    ctx.globalAlpha = state.player.rest * 0.24;
    ctx.fillStyle = "#f7f3df";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

function draw() {
  const colors = biomeColors();
  drawBackground(colors);
  ctx.save();
  ctx.translate(window.innerWidth / 2, window.innerHeight * 0.58);
  ctx.scale(state.camera.zoom, state.camera.zoom);
  ctx.translate(-window.innerWidth / 2, -window.innerHeight * 0.58);
  drawParallaxTrees(colors);
  drawGround(colors);
  drawWorldObjects();
  ctx.restore();
  drawOverlay();
  ui.biomeLabel.textContent = getBiome(state.player.x).name;
  ui.discoveryCount.textContent = `${state.discoveries.length} / ${discoveries.length} decouvertes`;
}

function update(dt) {
  state.time += dt;
  const p = state.player;
  let input = 0;
  if (keys.has("ArrowLeft") || keys.has("q") || keys.has("Q") || keys.has("a") || keys.has("A")) input -= 1;
  if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) input += 1;
  if (joystick.active) input += joystick.x;
  if (pointer.active && Math.abs(pointer.worldX - p.x) > 12) input += Math.sign(pointer.worldX - p.x) * 0.82;
  input = Math.max(-1, Math.min(1, input));

  const maxSpeed = p.rest > 0.15 ? 55 : 185;
  const target = input * maxSpeed;
  p.vx += (target - p.vx) * Math.min(1, dt * 5.5);
  p.x += p.vx * dt;
  p.x = Math.max(110, Math.min(world.width - 130, p.x));
  p.y = world.ground;
  if (Math.abs(p.vx) > 5) p.face = Math.sign(p.vx);
  p.rest = Math.max(0, p.rest - dt * 0.35);

  const targetZoom = p.rest > 0 ? 1.08 : 1;
  state.camera.zoom += (targetZoom - state.camera.zoom) * Math.min(1, dt * 2.5);
  const targetCamera = p.x - window.innerWidth * 0.45;
  state.camera.x += (targetCamera - state.camera.x) * Math.min(1, dt * 2.8);
  state.camera.x = Math.max(0, Math.min(world.width - window.innerWidth, state.camera.x));

  if (audio) updateAudio();
  autosave();
}

function interact() {
  const p = state.player;
  const item = discoveries.find((entry) => !state.discoveries.includes(entry.id) && Math.abs(entry.x - p.x) < 78);
  if (item) {
    state.discoveries.push(item.id);
    showMessage(`${item.label}: ${item.text}`);
    playSoftPing();
    saveGame();
    return;
  }

  const lantern = lanterns.find((entry) => !state.lanterns.includes(entry.id) && Math.abs(entry.x - p.x) < 86);
  if (lantern) {
    state.lanterns.push(lantern.id);
    showMessage("La lanterne s'allume. Le sentier respire un peu plus chaud.");
    playSoftPing();
    saveGame();
    return;
  }

  const rest = rests.find((entry) => Math.abs(entry.x - p.x) < 98);
  if (rest) {
    p.rest = 1;
    showMessage(`Tu t'assois un instant sur le ${rest.label}. Tout ralentit.`);
    saveGame();
    return;
  }

  showMessage("Marche doucement. Les petits secrets brillent quand tu t'approches.");
}

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000 || 0);
  lastTime = now;
  if (running) update(dt);
  draw();
  requestAnimationFrame(loop);
}

function showMessage(text) {
  ui.message.textContent = text;
  ui.message.classList.add("is-visible");
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => ui.message.classList.remove("is-visible"), 3400);
}

function buildJournal() {
  ui.journalList.innerHTML = "";
  discoveries.forEach((item) => {
    const found = state.discoveries.includes(item.id);
    const entry = document.createElement("article");
    entry.className = "journal-item";
    entry.innerHTML = found
      ? `<strong>${item.label}</strong><p>${item.text}</p>`
      : `<strong>????</strong><p>Une page encore vide attend une decouverte.</p>`;
    ui.journalList.appendChild(entry);
  });
}

function startGame(reset = false) {
  if (reset) resetGame();
  state.startedAtLeastOnce = true;
  ui.startScreen.classList.add("is-hidden");
  running = true;
  setupAudio();
  showMessage("Fleches, ZQSD ou clic pour marcher. Espace ou E pour interagir.");
  saveGame();
}

function resetGame() {
  state.player.x = 380;
  state.player.vx = 0;
  state.discoveries = [];
  state.lanterns = [];
  state.camera.x = 0;
  state.player.rest = 0;
  localStorage.removeItem(saveKey);
}

function saveGame() {
  const payload = {
    x: state.player.x,
    discoveries: state.discoveries,
    lanterns: state.lanterns,
    startedAtLeastOnce: state.startedAtLeastOnce
  };
  localStorage.setItem(saveKey, JSON.stringify(payload));
}

function autosave() {
  if (Math.floor(state.time * 2) % 8 === 0) saveGame();
}

function loadGame() {
  const raw = localStorage.getItem(saveKey);
  if (!raw) return false;
  try {
    const payload = JSON.parse(raw);
    state.player.x = payload.x || 380;
    state.discoveries = Array.isArray(payload.discoveries) ? payload.discoveries : [];
    state.lanterns = Array.isArray(payload.lanterns) ? payload.lanterns : [];
    state.startedAtLeastOnce = Boolean(payload.startedAtLeastOnce);
    return true;
  } catch {
    return false;
  }
}

function loadOptions() {
  const raw = localStorage.getItem(optionsKey);
  if (!raw) {
    updateMuteButton();
    return;
  }
  try {
    const payload = JSON.parse(raw);
    state.options.music = Number.isFinite(payload.music) ? payload.music : state.options.music;
    state.options.nature = Number.isFinite(payload.nature) ? payload.nature : state.options.nature;
    state.options.muted = Boolean(payload.muted);
    if (payload.audioVersion !== 2) {
      state.options.music = Math.min(state.options.music, 0.22);
      state.options.nature = Math.min(state.options.nature, 0.32);
      state.options.audioVersion = 2;
      saveOptions();
    }
    ui.musicVolume.value = state.options.music;
    ui.natureVolume.value = state.options.nature;
    updateMuteButton();
  } catch {
    localStorage.removeItem(optionsKey);
    updateMuteButton();
  }
}

function saveOptions() {
  localStorage.setItem(optionsKey, JSON.stringify(state.options));
}

function updateMuteButton() {
  ui.muteButton.classList.toggle("is-muted", state.options.muted);
  ui.muteButton.title = state.options.muted ? "Remettre le son" : "Couper le son";
  ui.muteButton.setAttribute("aria-label", ui.muteButton.title);
}

function setupAudio() {
  if (audio) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const master = context.createGain();
  const music = context.createGain();
  const nature = context.createGain();
  const lfo = context.createOscillator();
  const filter = context.createBiquadFilter();
  const toneA = context.createOscillator();
  const toneB = context.createOscillator();
  const toneC = context.createOscillator();
  const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i += 1) noiseData[i] = Math.random() * 2 - 1;
  const noise = context.createBufferSource();

  toneA.type = "sine";
  toneA.frequency.value = 130.81;
  toneB.type = "sine";
  toneB.frequency.value = 196;
  toneC.type = "sine";
  toneC.frequency.value = 261.63;
  filter.type = "lowpass";
  filter.frequency.value = 360;
  lfo.frequency.value = 0.04;
  noise.buffer = noiseBuffer;
  noise.loop = true;

  toneA.connect(music);
  toneB.connect(music);
  toneC.connect(music);
  noise.connect(filter);
  filter.connect(nature);
  music.connect(master);
  nature.connect(master);
  master.connect(context.destination);
  toneA.start();
  toneB.start();
  toneC.start();
  noise.start();
  lfo.start();

  audio = { context, master, music, nature, filter };
  updateAudio();
}

function updateAudio() {
  const streamDistance = Math.abs(state.player.x - 3820);
  const stream = Math.max(0, 1 - streamDistance / 900);
  const now = audio.context.currentTime;
  const mute = state.options.muted ? 0 : 1;
  audio.music.gain.setTargetAtTime(mute * state.options.music * (0.035 + state.player.rest * 0.03), now, 1.2);
  audio.nature.gain.setTargetAtTime(mute * state.options.nature * (0.025 + stream * 0.08), now, 1);
  audio.filter.frequency.setTargetAtTime(240 + stream * 520, now, 0.8);
}

function playSoftPing() {
  if (!audio) return;
  const oscillator = audio.context.createOscillator();
  const gain = audio.context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(523.25, audio.context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(783.99, audio.context.currentTime + 0.22);
  gain.gain.setValueAtTime(0.0001, audio.context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.035, audio.context.currentTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.context.currentTime + 0.5);
  oscillator.connect(gain);
  gain.connect(audio.master);
  oscillator.start();
  oscillator.stop(audio.context.currentTime + 0.55);
}

window.addEventListener("resize", resize);
window.addEventListener("keydown", (event) => {
  keys.add(event.key);
  if (event.key === "e" || event.key === "E" || event.key === " ") {
    event.preventDefault();
    if (running) interact();
  }
});
window.addEventListener("keyup", (event) => keys.delete(event.key));

canvas.addEventListener("pointerdown", (event) => {
  if (!running) return;
  pointer.active = true;
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.worldX = state.camera.x + event.clientX;
  if (Math.abs(pointer.worldX - state.player.x) < 95) interact();
});

canvas.addEventListener("pointermove", (event) => {
  if (!pointer.active) return;
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.worldX = state.camera.x + event.clientX;
});

canvas.addEventListener("pointerup", () => {
  pointer.active = false;
});

ui.mobilePad.addEventListener("pointerdown", (event) => {
  joystick.active = true;
  joystick.id = event.pointerId;
  ui.mobilePad.setPointerCapture(event.pointerId);
});

ui.mobilePad.addEventListener("pointermove", (event) => {
  if (!joystick.active || event.pointerId !== joystick.id) return;
  const rect = ui.mobilePad.getBoundingClientRect();
  const dx = event.clientX - rect.left - rect.width / 2;
  const dy = event.clientY - rect.top - rect.height / 2;
  const length = Math.hypot(dx, dy) || 1;
  const max = rect.width * 0.34;
  const clamped = Math.min(max, length);
  joystick.x = (dx / length) * (clamped / max);
  joystick.y = (dy / length) * (clamped / max);
  ui.padKnob.style.transform = `translate(calc(-50% + ${joystick.x * max}px), calc(-50% + ${joystick.y * max}px))`;
});

ui.mobilePad.addEventListener("pointerup", () => {
  joystick.active = false;
  joystick.x = 0;
  joystick.y = 0;
  ui.padKnob.style.transform = "translate(-50%, -50%)";
});

ui.startButton.addEventListener("click", () => startGame(true));
ui.continueButton.addEventListener("click", () => startGame(false));
ui.journalButton.addEventListener("click", () => {
  buildJournal();
  ui.journalDialog.showModal();
});
ui.optionsButton.addEventListener("click", () => ui.optionsDialog.showModal());
ui.muteButton.addEventListener("click", () => {
  state.options.muted = !state.options.muted;
  updateMuteButton();
  saveOptions();
  if (audio) updateAudio();
});
ui.resetButton.addEventListener("click", () => {
  resetGame();
  saveGame();
  ui.optionsDialog.close();
  showMessage("Nouvelle promenade prete.");
});
ui.musicVolume.addEventListener("input", () => {
  state.options.music = Number(ui.musicVolume.value);
  saveOptions();
  if (audio) updateAudio();
});
ui.natureVolume.addEventListener("input", () => {
  state.options.nature = Number(ui.natureVolume.value);
  saveOptions();
  if (audio) updateAudio();
});

loadOptions();
const hasSave = loadGame();
ui.continueButton.disabled = !hasSave;
ui.continueButton.style.opacity = hasSave ? "1" : "0.55";
resize();
draw();
requestAnimationFrame(loop);
