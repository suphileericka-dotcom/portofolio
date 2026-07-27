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
  cinematic: document.getElementById("cinematic"),
  cinematicText: document.getElementById("cinematicText"),
  nicknameInput: document.getElementById("nicknameInput"),
  anonymousId: document.getElementById("anonymousId"),
  createPartyButton: document.getElementById("createPartyButton"),
  partyCodeInput: document.getElementById("partyCodeInput"),
  joinPartyButton: document.getElementById("joinPartyButton"),
  leavePartyButton: document.getElementById("leavePartyButton"),
  leavePartyOptionsButton: document.getElementById("leavePartyOptionsButton"),
  partyStatus: document.getElementById("partyStatus"),
  partyLabel: document.getElementById("partyLabel"),
  reactionButton: document.getElementById("reactionButton"),
  reactionMenu: document.getElementById("reactionMenu"),
  villagerDialog: document.getElementById("villagerDialog"),
  villagerTitle: document.getElementById("villagerTitle"),
  villagerText: document.getElementById("villagerText"),
  giveItemButton: document.getElementById("giveItemButton"),
  refuseHelpButton: document.getElementById("refuseHelpButton"),
  musicVolume: document.getElementById("musicVolume"),
  natureVolume: document.getElementById("natureVolume"),
  mobilePad: document.getElementById("mobilePad"),
  padKnob: document.getElementById("padKnob")
};

const saveKey = "bosquet-lent-save";
const optionsKey = "bosquet-lent-options";
const playerKey = "bosquet-lent-player";
const world = { ground: 0, chapterSize: 2400, firstRouteEnd: 7200 };
const keys = new Set();
const pointer = { active: false, x: 0, y: 0, worldX: 0 };
const joystick = { active: false, id: null, x: 0, y: 0 };
let audio = null;
let lastTime = 0;
let running = false;
let messageTimer = 0;
let pendingVillagerHelp = null;
const net = { socket: null, connected: false, lastMoveSent: 0, lastMemberCount: 0, statusMessage: "" };

const state = {
  player: { x: 380, y: 0, vx: 0, vy: 0, face: 1, rest: 0 },
  camera: { x: 0, y: 0, zoom: 1 },
  time: 0,
  chapter: 1,
  weather: "clear",
  cinematicPlayed: false,
  discoveries: [],
  lanterns: [],
  helpedVillagers: [],
  groupRest: 0,
  lastSeatActor: "",
  reactions: [],
  startedAtLeastOnce: false,
  playerProfile: { id: "", nickname: "Voyageur" },
  party: { code: "", members: [], minPlayers: 2, maxPlayers: 4 },
  options: { music: 0.22, nature: 0.32, muted: false, audioVersion: 2 }
};

const biomes = [
  { at: 0, name: "Bosquet vert", sky: "#8db9b2", haze: "#e5cf91", tree: "#245343", leaf: "#6f9d68", grass: "#87ac6d" },
  { at: 1800, name: "Clairiere fleurie", sky: "#b5cba8", haze: "#f2c98e", tree: "#4d6c45", leaf: "#9aaf67", grass: "#b8a75f" },
  { at: 3600, name: "Sous-bois frais", sky: "#8bb0bc", haze: "#d8e5ed", tree: "#2d4c57", leaf: "#6f8a8d", grass: "#7a9a8f" },
  { at: 5400, name: "Nuit aux champignons", sky: "#24324f", haze: "#a7d9c4", tree: "#172a38", leaf: "#3f6a75", grass: "#486d69" }
];

const weatherTypes = [
  { id: "clear", label: "Temps clair", sky: "#ffffff", alpha: 0, wind: 0.85 },
  { id: "rain", label: "Pluie fine", sky: "#9eb1bd", alpha: 0.14, wind: 1.15 },
  { id: "mist", label: "Brume", sky: "#dbe7df", alpha: 0.16, wind: 0.55 },
  { id: "wind", label: "Grand vent", sky: "#d9c57c", alpha: 0.14, wind: 1.75 },
  { id: "snow", label: "Neige lente", sky: "#eef4f7", alpha: 0.12, wind: 0.68 }
];

const weatherSchedule = ["clear", "rain", "clear", "mist", "clear", "wind", "clear", "snow", "clear", "clear"];

const villagers = [
  { role: "Tisserande d'ombres", line: "Elle dit que les chemins longs finissent par raconter ton nom." },
  { role: "Facteur des collines", line: "Il porte des lettres sans adresse, seulement des intuitions." },
  { role: "Gardienne du puits", line: "Elle garde les questions jusqu'a ce que quelqu'un ose les poser." },
  { role: "Enfant aux lucioles", line: "Il connait une chanson qui ouvre les barrieres fatiguees." },
  { role: "Cartographe sans carte", line: "Il dessine le monde apres l'avoir oublie." },
  { role: "Boulangere de pluie", line: "Son pain rechauffe les poches quand la meteo tourne." }
];

const villagerNeeds = [
  { itemId: "leaf", itemLabel: "Feuille nervuree", need: "recoudre une carte dechiree par le vent", use: "sert a reparer les cartes fragiles, ouvrir des raccourcis et se proteger de la pluie" },
  { itemId: "stone", itemLabel: "Pierre polie", need: "caler la porte d'une maison qui tremble", use: "sert a stabiliser des mecanismes, des portes et des ponts anciens" },
  { itemId: "feather", itemLabel: "Plume claire", need: "terminer une lettre qui ne voulait pas partir", use: "sert a ecrire des messages et apaiser certains habitants" },
  { itemId: "moss", itemLabel: "Statue moussue", need: "se souvenir du nom d'une vieille place", use: "sert de memoire vivante pour reveiller des lieux oublies" },
  { itemId: "shell", itemLabel: "Coquille de riviere", need: "appeler l'eau jusqu'au puits", use: "sert a comprendre les rivieres, les puits, les passages humides et la pluie" },
  { itemId: "cone", itemLabel: "Pomme de pin bleue", need: "rallumer un four trop froid", use: "sert a produire une chaleur douce contre la neige et le froid" },
  { itemId: "mushroom", itemLabel: "Champignon lueur", need: "guider un enfant dans la nuit", use: "sert de lampe calme contre la brume, la nuit et la neige" },
  { itemId: "star", itemLabel: "Eclat d'etoile", need: "retrouver le chemin du matin", use: "sert a activer les grands passages et garder une lumiere dans la brume" }
];

const riddles = [
  "Enigme: je disparais quand tu cours, je grandis quand tu t'assois. Qui suis-je ?",
  "Enigme: trois lanternes savent la route, mais une seule attend ton silence.",
  "Enigme: le village change de place quand personne ne le regarde.",
  "Enigme: ce que tu ramasses n'est pas un objet, mais une preuve que tu etais la."
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

function hashNumber(value) {
  const x = Math.sin(value * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function makeId(prefix, index) {
  return `${prefix}-${index}`;
}

function isExpandedWorld(x = state.player.x) {
  return state.cinematicPlayed;
}

function getChapter(x = state.player.x) {
  if (x < world.firstRouteEnd) return Math.max(1, Math.floor(x / world.chapterSize) + 1);
  return Math.max(4, Math.floor((x - world.firstRouteEnd) / world.chapterSize) + 4);
}

function getWeatherForChapter(chapter = state.chapter) {
  if (!isExpandedWorld()) return weatherTypes[0];
  const index = ((chapter - 4) % weatherSchedule.length + weatherSchedule.length) % weatherSchedule.length;
  return weatherTypes.find((weather) => weather.id === weatherSchedule[index]) || weatherTypes[0];
}

function getProceduralDiscoveries() {
  if (!isExpandedWorld()) return discoveries;
  const relativeCamera = state.camera.x - world.firstRouteEnd;
  const start = Math.max(0, Math.floor((relativeCamera - 500) / world.chapterSize));
  const end = Math.floor((relativeCamera + window.innerWidth + 900) / world.chapterSize);
  const items = [];
  for (let chapterIndex = start; chapterIndex <= end; chapterIndex += 1) {
    const chapter = chapterIndex + 4;
    const local = discoveries[chapterIndex % discoveries.length];
    const jitter = 160 + hashNumber(chapter * 3.1) * 520;
    items.push({
      id: makeId(local.id, chapter),
      x: world.firstRouteEnd + chapterIndex * world.chapterSize + jitter,
      label: chapter <= discoveries.length ? local.label : `${local.label} ${chapter}`,
      text: chapter <= discoveries.length
        ? local.text
        : `${local.text} Ce fragment semble venir d'une partie qui n'avait pas encore de nom.`
    });
  }
  return items;
}

function getProceduralLanterns() {
  if (!isExpandedWorld()) return lanterns;
  const relativeCamera = state.camera.x - world.firstRouteEnd;
  const start = Math.max(0, Math.floor((relativeCamera - 500) / world.chapterSize));
  const end = Math.floor((relativeCamera + window.innerWidth + 900) / world.chapterSize);
  const items = [];
  for (let chapterIndex = start; chapterIndex <= end; chapterIndex += 1) {
    if (chapterIndex % 2 === 0) {
      items.push({ id: makeId("lantern", chapterIndex + 4), x: world.firstRouteEnd + chapterIndex * world.chapterSize + 650 + hashNumber(chapterIndex) * 120 });
    }
  }
  return items;
}

function getProceduralRests() {
  if (!isExpandedWorld()) return rests;
  const relativeCamera = state.camera.x - world.firstRouteEnd;
  const start = Math.max(0, Math.floor((relativeCamera - 500) / world.chapterSize));
  const end = Math.floor((relativeCamera + window.innerWidth + 900) / world.chapterSize);
  const labels = ["banc de clairiere", "rocher pres de la riviere", "souche phosphorescente", "marche d'un vieux puits"];
  const items = [];
  for (let chapterIndex = start; chapterIndex <= end; chapterIndex += 1) {
    if (chapterIndex % 3 !== 1) {
      items.push({
        x: world.firstRouteEnd + chapterIndex * world.chapterSize + 310 + hashNumber(chapterIndex + 9) * 180,
        label: labels[chapterIndex % labels.length]
      });
    }
  }
  return items;
}

function getProceduralVillages() {
  if (!isExpandedWorld()) return [];
  const relativeCamera = state.camera.x - world.firstRouteEnd;
  const start = Math.max(0, Math.floor((relativeCamera - 800) / world.chapterSize));
  const end = Math.floor((relativeCamera + window.innerWidth + 1200) / world.chapterSize);
  const items = [];
  for (let chapterIndex = start; chapterIndex <= end; chapterIndex += 1) {
    if (chapterIndex >= 0 && chapterIndex % 2 === 0) {
      items.push({
        x: world.firstRouteEnd + chapterIndex * world.chapterSize + 520,
        name: `Village ${Math.floor(chapterIndex / 2) + 1}`,
        villager: villagers[chapterIndex % villagers.length]
      });
    }
  }
  return items;
}

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
  const cycleLength = biomes[biomes.length - 1].at + world.chapterSize;
  x = ((x % cycleLength) + cycleLength) % cycleLength;
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
  const cycleLength = biomes[biomes.length - 1].at + world.chapterSize;
  const x = ((state.player.x % cycleLength) + cycleLength) % cycleLength;
  const currentIndex = Math.max(0, biomes.findIndex((biome, index) => {
    const next = biomes[index + 1];
    return !next || x < next.at;
  }));
  const current = biomes[currentIndex];
  const next = biomes[currentIndex + 1] || current;
  const span = Math.max(1, next.at - current.at);
  const t = Math.max(0, Math.min(1, (x - current.at) / span));
  const weather = getWeatherForChapter();
  return {
    name: current.name,
    sky: blendHex(blendHex(current.sky, next.sky, t), weather.sky, weather.alpha),
    haze: blendHex(blendHex(current.haze, next.haze, t), weather.sky, weather.alpha * 0.7),
    tree: blendHex(current.tree, next.tree, t),
    leaf: blendHex(current.leaf, next.leaf, t),
    grass: blendHex(current.grass, next.grass, t),
    wind: weather.wind
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
    const repeatWidth = 7800;
    const visibleStart = state.camera.x * factor - 180;
    const visibleEnd = state.camera.x * factor + window.innerWidth + 200;
    const firstRepeat = Math.floor(visibleStart / repeatWidth) - 1;
    const lastRepeat = Math.ceil(visibleEnd / repeatWidth) + 1;
    for (let repeat = firstRepeat; repeat <= lastRepeat; repeat += 1) {
      for (const tree of trees) {
        if (tree.layer !== layer) continue;
        const x = tree.x + layer * 95 + repeat * repeatWidth;
        if (x + tree.w < visibleStart || x > visibleEnd) continue;
        const base = h * 0.74 + Math.sin(tree.x + repeat) * 18;
        ctx.fillStyle = colors.tree;
        roundedRect(x - 8, base - tree.h * 0.68, 16, tree.h * 0.7, 7);
        ctx.fill();
        drawEllipse(x, base - tree.h * 0.72, tree.w * 0.72, tree.h * 0.28, colors.leaf);
        drawEllipse(x - tree.w * 0.34, base - tree.h * 0.58, tree.w * 0.46, tree.h * 0.22, colors.leaf);
        drawEllipse(x + tree.w * 0.34, base - tree.h * 0.55, tree.w * 0.5, tree.h * 0.23, colors.leaf);
      }
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
    const sway = Math.sin(x * 0.04 + state.time * 2 * colors.wind) * 4 * colors.wind;
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

  getProceduralVillages().forEach((village) => {
    const y = world.ground - 18;
    for (let i = 0; i < 4; i += 1) {
      const houseX = village.x + i * 86;
      ctx.fillStyle = i % 2 ? "#9d7658" : "#b08a61";
      roundedRect(houseX - 34, y - 54, 68, 54, 6);
      ctx.fill();
      ctx.fillStyle = "#6c4a3d";
      ctx.beginPath();
      ctx.moveTo(houseX - 42, y - 52);
      ctx.lineTo(houseX, y - 92);
      ctx.lineTo(houseX + 42, y - 52);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255, 215, 115, 0.55)";
      roundedRect(houseX - 10, y - 32, 20, 18, 4);
      ctx.fill();
    }
    drawVillager(village.x + 410, village.villager);
    if (Math.abs(state.player.x - (village.x + 410)) < 90) drawPrompt(village.x + 410, y - 102, "E parler");
  });

  getProceduralRests().forEach((rest) => {
    const y = world.ground - 18;
    ctx.fillStyle = "#775747";
    roundedRect(rest.x - 54, y - 18, 108, 16, 6);
    ctx.fill();
    ctx.fillRect(rest.x - 38, y - 4, 9, 35);
    ctx.fillRect(rest.x + 29, y - 4, 9, 35);
    if (Math.abs(state.player.x - rest.x) < 90) drawPrompt(rest.x, y - 64, "E se reposer");
  });

  getProceduralLanterns().forEach((lantern) => {
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

  getProceduralDiscoveries().forEach((item, index) => {
    const collected = hasCollectedDiscovery(item);
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
  drawPartyCompanions();
  drawPlayer();
  ctx.restore();
}

function getPartyCompanions() {
  if (!state.party.code) return [];
  const colors = ["#67b4c8", "#8ebf76", "#b98ad6"];
  const members = Array.isArray(state.party.members) ? state.party.members : [];
  const remoteMembers = members
    .map((member) => (typeof member === "string" ? { id: member, nickname: "Ami" } : member))
    .filter((member) => member.id && member.id !== state.playerProfile.id)
    .slice(0, 3);
  return remoteMembers.map((member, index) => ({
    id: member.id,
    label: member.nickname || ["Ami 1", "Ami 2", "Ami 3"][index],
    x: Number.isFinite(member.x) ? member.x : state.player.x - 70 - index * 54 + Math.sin(state.time * 1.5 + index) * 8,
    y: world.ground,
    face: member.face || state.player.face,
    body: colors[index],
    seated: Boolean(member.resting) || state.groupRest > 0.18
  }));
}

function drawPartyCompanions() {
  const companions = getPartyCompanions();
  companions.forEach((companion, index) => {
    const reaction = getActiveReactionFor(companion.id);
    drawCharacter({
      x: companion.x,
      y: companion.y,
      face: companion.face,
      velocity: state.player.vx * 0.65,
      body: companion.body,
      skin: "#e7b879",
      hair: "#2d4c57",
      label: companion.label,
      reaction,
      seated: companion.seated
    });
    if (state.groupRest > 0.4 && index === 0) {
      drawPrompt(companion.x, companion.y - 108, "se repose");
    }
  });
  const ownReaction = getActiveReactionFor(state.playerProfile.id);
  if (ownReaction) drawReactionBubble(state.player.x, state.player.y - 132, ownReaction);
}

function getActiveReactionFor(actorId) {
  for (let index = state.reactions.length - 1; index >= 0; index -= 1) {
    const reaction = state.reactions[index];
    if (reaction.actorId === actorId && reaction.until > state.time) return reaction.symbol;
  }
  return "";
}

function sendReaction(symbol) {
  if (!state.party.code) {
    showMessage("Rejoins ou cree une partie pour envoyer des reactions au groupe.");
    return;
  }
  state.reactions.push({ actorId: state.playerProfile.id, symbol, until: state.time + 4 });
  syncAction("reaction", { symbol, until: Date.now() + 4000 });
  ui.reactionMenu.classList.remove("is-visible");
  showMessage(`Reaction envoyee au groupe: ${symbol}`);
}

function drawRiver() {
  const riverX = isExpandedWorld()
    ? Math.floor((state.camera.x + window.innerWidth / 2 - world.firstRouteEnd) / 4200) * 4200 + world.firstRouteEnd + 3820
    : 3820;
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

function drawVillager(x, villager) {
  const y = world.ground - 48;
  const bob = Math.sin(state.time * 2 + x) * 3;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 48, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6a8a80";
  roundedRect(-14, -3, 28, 38, 10);
  ctx.fill();
  ctx.fillStyle = "#e5b878";
  ctx.beginPath();
  ctx.arc(0, -22, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4a3632";
  ctx.beginPath();
  ctx.ellipse(0, -31, 16, 7, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (Math.abs(state.player.x - x) < 210) {
    ctx.save();
    ctx.font = "800 12px Nunito";
    ctx.fillStyle = "rgba(20, 34, 33, 0.72)";
    roundedRect(x - 74, y - 82, 148, 26, 7);
    ctx.fill();
    ctx.fillStyle = "#f7f3df";
    ctx.textAlign = "center";
    ctx.fillText(villager.role, x, y - 64);
    ctx.restore();
  }
}

function drawWeather() {
  const weather = getWeatherForChapter();
  const w = window.innerWidth;
  const h = window.innerHeight;
  const protectedFromWeather = getWeatherProtection(weather.id);
  ctx.save();
  if (weather.id === "rain") {
    ctx.strokeStyle = protectedFromWeather ? "rgba(216, 235, 241, 0.18)" : "rgba(216, 235, 241, 0.34)";
    ctx.lineWidth = 1.4;
    for (let i = 0; i < (protectedFromWeather ? 36 : 64); i += 1) {
      const x = (i * 47 + state.time * 360) % (w + 80) - 40;
      const y = (i * 91 + state.time * 520) % (h + 90) - 60;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 18, y + 42);
      ctx.stroke();
    }
  }
  if (weather.id === "mist") {
    ctx.fillStyle = protectedFromWeather ? "rgba(236, 242, 226, 0.07)" : "rgba(236, 242, 226, 0.13)";
    for (let i = 0; i < (protectedFromWeather ? 3 : 5); i += 1) {
      const x = (i * 260 + state.time * 24) % (w + 360) - 180;
      drawEllipse(x, h * (0.35 + i * 0.06), 210, 24, ctx.fillStyle);
    }
  }
  if (weather.id === "wind") {
    ctx.strokeStyle = "rgba(247, 243, 223, 0.24)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i += 1) {
      const x = (i * 180 + state.time * 240) % (w + 220) - 110;
      const y = h * 0.22 + i * 38;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 68, y - 18, x + 142, y + 4);
      ctx.stroke();
    }
  }
  if (weather.id === "snow") {
    ctx.fillStyle = protectedFromWeather ? "rgba(247, 250, 252, 0.4)" : "rgba(247, 250, 252, 0.62)";
    for (let i = 0; i < (protectedFromWeather ? 34 : 58); i += 1) {
      const x = (i * 59 + Math.sin(state.time + i) * 30) % (w + 80) - 40;
      const y = (i * 83 + state.time * 58) % (h + 70) - 40;
      ctx.beginPath();
      ctx.arc(x, y, 1.4 + (i % 3) * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
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
  drawCharacter({
    x: p.x,
    y: p.y,
    face: p.face,
    velocity: p.vx,
    body: "#ce6f75",
    skin: "#f0bd6c",
    hair: "#22322c",
    label: state.playerProfile.nickname,
    seated: p.rest > 0.2
  });
}

function drawCharacter({ x, y, face = 1, velocity = 0, body = "#ce6f75", skin = "#f0bd6c", hair = "#22322c", label = "", reaction = "", seated = false }) {
  const walk = seated ? 0 : Math.sin(state.time * 10) * Math.min(1, Math.abs(velocity) / 190);
  const baseY = y - 48 + (seated ? 10 : 0);
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(face, 1);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 50, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2d2730";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-8, 22);
  ctx.lineTo(seated ? -22 : -16 - walk * 8, seated ? 38 : 47);
  ctx.moveTo(9, 23);
  ctx.lineTo(seated ? 22 : 17 + walk * 8, seated ? 38 : 47);
  ctx.stroke();
  ctx.fillStyle = body;
  roundedRect(-17, -5, 34, 39, 13);
  ctx.fill();
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, -23, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#28312e";
  ctx.beginPath();
  ctx.arc(8, -26, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.ellipse(-3, -37, 20, 10, -0.2, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (label && Math.abs(x - state.player.x) < 260) {
    ctx.save();
    ctx.font = "800 11px Nunito";
    ctx.fillStyle = "rgba(20, 34, 33, 0.7)";
    roundedRect(x - 44, baseY - 66, 88, 22, 7);
    ctx.fill();
    ctx.fillStyle = "#f7f3df";
    ctx.textAlign = "center";
    ctx.fillText(label.slice(0, 12), x, baseY - 51);
    ctx.restore();
  }

  if (reaction) drawReactionBubble(x, baseY - 86, reaction);
}

function drawReactionBubble(x, y, reaction) {
  ctx.save();
  ctx.font = "800 22px Nunito";
  ctx.fillStyle = "rgba(20, 34, 33, 0.78)";
  roundedRect(x - 22, y - 26, 44, 38, 10);
  ctx.fill();
  ctx.fillStyle = "#f7f3df";
  ctx.textAlign = "center";
  ctx.fillText(reaction, x, y);
  ctx.restore();
}

function drawOverlay() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const night = Math.max(0, Math.min(1, (state.player.x - 5200) / 2800));
  const hasLight = hasCollectedBaseItem("mushroom") || hasCollectedBaseItem("star");
  const darkness = 0.08 + night * (hasLight ? 0.13 : 0.2);
  ctx.fillStyle = `rgba(10, 16, 30, ${darkness})`;
  ctx.fillRect(0, 0, w, h);
  if (night > 0.05) {
    const px = state.player.x - state.camera.x;
    const py = state.player.y - 54;
    ctx.save();
    const glow = ctx.createRadialGradient(px, py, 18, px, py, hasLight ? 190 : 135);
    glow.addColorStop(0, hasLight ? "rgba(255, 229, 151, 0.26)" : "rgba(247, 243, 223, 0.16)");
    glow.addColorStop(1, "rgba(247, 243, 223, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(px, py, hasLight ? 190 : 135, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  const restingTogether = Math.max(state.player.rest, state.groupRest);
  if (restingTogether > 0) {
    ctx.save();
    ctx.globalAlpha = restingTogether * 0.24;
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
  drawWeather();
  ui.partyLabel.textContent = state.party.code ? `Code ${state.party.code}` : "Solo";
  updatePartyUi();
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

  const weather = getWeatherForChapter();
  const protectedFromWeather = getWeatherProtection(weather.id);
  const weatherSlowdown = !protectedFromWeather && (weather.id === "rain" || weather.id === "snow") ? 0.82 : 1;
  const restingTogether = Math.max(p.rest, state.groupRest);
  const maxSpeed = (restingTogether > 0.15 ? 55 : 185) * weatherSlowdown;
  const target = input * maxSpeed;
  p.vx += (target - p.vx) * Math.min(1, dt * 5.5);
  p.x += p.vx * dt;
  p.x = Math.max(110, p.x);
  p.y = world.ground;
  if (Math.abs(p.vx) > 5) p.face = Math.sign(p.vx);
  p.rest = Math.max(0, p.rest - dt * 0.35);
  state.groupRest = Math.max(0, state.groupRest - dt * 0.28);
  state.reactions = state.reactions.filter((reaction) => reaction.until > state.time);
  const previousWeather = state.weather;
  state.chapter = getChapter();
  state.weather = getWeatherForChapter().id;
  if (previousWeather !== state.weather) announceWeather();
  if (p.x >= world.firstRouteEnd && !state.cinematicPlayed) playRouteEndCinematic();

  const targetZoom = restingTogether > 0 ? 1.08 : 1;
  state.camera.zoom += (targetZoom - state.camera.zoom) * Math.min(1, dt * 2.5);
  const targetCamera = p.x - window.innerWidth * 0.45;
  state.camera.x += (targetCamera - state.camera.x) * Math.min(1, dt * 2.8);
  state.camera.x = Math.max(0, state.camera.x);

  if (state.party.code && net.connected && state.time - net.lastMoveSent > 0.18) {
    net.lastMoveSent = state.time;
    syncAction("move", { x: p.x, face: p.face, resting: p.rest > 0.15 });
  }

  if (audio) updateAudio();
  autosave();
}

function interact() {
  const p = state.player;
  const villageNeed = getProceduralVillages()
    .map((village) => ({
      ...village.villager,
      x: village.x + 410,
      villageId: makeId("village", Math.round(village.x / world.chapterSize)),
      need: villagerNeeds[Math.round(village.x / world.chapterSize) % villagerNeeds.length]
    }))
    .find((entry) => Math.abs(entry.x - p.x) < 98);
  if (villageNeed) {
    openVillagerHelp(villageNeed);
    saveGame();
    return;
  }

  const item = getProceduralDiscoveries().find((entry) => !hasCollectedDiscovery(entry) && Math.abs(entry.x - p.x) < 78);
  if (item) {
    state.discoveries.push(item.id);
    syncAction("collect", { itemId: item.id });
    showMessage(`${item.label}: ${item.text}`);
    playSoftPing();
    saveGame();
    return;
  }

  const lantern = getProceduralLanterns().find((entry) => !state.lanterns.includes(entry.id) && Math.abs(entry.x - p.x) < 86);
  if (lantern) {
    state.lanterns.push(lantern.id);
    syncAction("lantern", { lanternId: lantern.id });
    showMessage("La lanterne s'allume. Le sentier respire un peu plus chaud.");
    playSoftPing();
    saveGame();
    return;
  }

  const rest = getProceduralRests().find((entry) => Math.abs(entry.x - p.x) < 98);
  if (rest) {
    p.rest = 1;
    if (state.party.code) {
      state.groupRest = 1;
      state.lastSeatActor = state.playerProfile.nickname;
      syncAction("rest", { actorName: state.playerProfile.nickname, restLabel: rest.label });
      showMessage(`${state.playerProfile.nickname} s'assoit sur le ${rest.label}. Le groupe ralentit avec lui.`);
    } else {
      showMessage(`Tu t'assois un instant sur le ${rest.label}. Tout ralentit.`);
    }
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
  showMessageFor(text, 3400);
}

function showMessageFor(text, duration = 3400) {
  ui.message.textContent = text;
  ui.message.classList.add("is-visible");
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => ui.message.classList.remove("is-visible"), duration);
}

function announceWeather() {
  const weather = getWeatherForChapter();
  if (weather.id === "clear") return;
  const protectedFromWeather = getWeatherProtection(weather.id);
  const lines = protectedFromWeather ? {
    rain: "Pluie fine: tes trouvailles te protegent, la route reste lisible.",
    mist: "Brume: ta lumiere perce le voile, tu peux continuer sans te perdre.",
    wind: "Grand vent: les herbes se couchent et les lanternes hesitent.",
    snow: "Neige lente: tu gardes assez de chaleur pour avancer."
  } : {
    rain: "Pluie fine: sans protection, le pas devient plus lourd.",
    mist: "Brume: pendant quelques instants, le village devient plus difficile a lire.",
    wind: "Grand vent: les herbes se couchent et les lanternes hesitent.",
    snow: "Neige lente: le froid ralentit la marche."
  };
  showMessageFor(lines[weather.id] || weather.label, 25000);
}

function baseDiscoveryId(id) {
  if (typeof id !== "string") return "";
  const parts = id.split("-");
  return parts.length > 1 ? parts.slice(0, -1).join("-") : id;
}

function hasCollectedBaseItem(itemId) {
  return state.discoveries.some((id) => baseDiscoveryId(id) === itemId);
}

function getWeatherProtection(weatherId = state.weather) {
  if (weatherId === "rain") {
    return hasCollectedBaseItem("leaf") || hasCollectedBaseItem("shell");
  }
  if (weatherId === "mist") {
    return hasCollectedBaseItem("mushroom") || hasCollectedBaseItem("star");
  }
  if (weatherId === "snow") {
    return hasCollectedBaseItem("cone") || hasCollectedBaseItem("mushroom");
  }
  return false;
}

function hasCollectedDiscovery(item) {
  return state.discoveries.includes(item.id) || state.discoveries.includes(normalizeDiscoveryId(item.id));
}

function getItemUse(itemId) {
  const need = villagerNeeds.find((entry) => entry.itemId === baseDiscoveryId(itemId));
  return need ? need.use : "servira peut-etre plus loin sur la route";
}

function openVillagerHelp(villager) {
  const alreadyHelped = state.helpedVillagers.includes(villager.villageId);
  const hasItem = hasCollectedBaseItem(villager.need.itemId);
  ui.villagerTitle.textContent = villager.role;
  ui.giveItemButton.disabled = alreadyHelped || !hasItem;
  ui.giveItemButton.style.opacity = alreadyHelped || !hasItem ? "0.55" : "1";
  if (alreadyHelped) {
    ui.villagerText.textContent = `${villager.line} Tu l'as deja aide. Le village se souvient de ton geste.`;
  } else if (hasItem) {
    ui.villagerText.textContent = `${villager.line} Il te demande: "Vous avez ${villager.need.itemLabel} ? J'en aurais besoin pour ${villager.need.need}." Tu peux lui donner, ou garder l'objet.`;
  } else {
    ui.villagerText.textContent = `${villager.line} Il te demande: "Vous avez ${villager.need.itemLabel} ? J'en aurais besoin pour ${villager.need.need}." Tu ne l'as pas encore dans ton carnet.`;
  }
  pendingVillagerHelp = villager;
  ui.villagerDialog.showModal();
}

function givePendingItem() {
  if (!pendingVillagerHelp) return;
  if (state.helpedVillagers.includes(pendingVillagerHelp.villageId)) {
    showMessage("Cet habitant a deja recu de l'aide dans cette partie.");
    ui.villagerDialog.close();
    pendingVillagerHelp = null;
    return;
  }
  if (!hasCollectedBaseItem(pendingVillagerHelp.need.itemId)) {
    showMessage("Tu n'as pas encore cet objet dans ton carnet.");
    return;
  }
  state.helpedVillagers.push(pendingVillagerHelp.villageId);
  syncAction("help-villager", {
    villageId: pendingVillagerHelp.villageId,
    itemId: pendingVillagerHelp.need.itemId,
    itemLabel: pendingVillagerHelp.need.itemLabel
  });
  ui.villagerDialog.close();
  showMessage(`${pendingVillagerHelp.role} accepte ${pendingVillagerHelp.need.itemLabel}. Le village se souviendra de ce geste.`);
  pendingVillagerHelp = null;
  playSoftPing();
  saveGame();
}

function refusePendingHelp() {
  if (!pendingVillagerHelp) return;
  const name = pendingVillagerHelp.role;
  ui.villagerDialog.close();
  pendingVillagerHelp = null;
  showMessage(`${name} hoche la tete. Tu gardes ton objet et tu peux continuer.`);
}

function playRouteEndCinematic() {
  state.cinematicPlayed = true;
  running = false;
  saveGame();
  const name = state.playerProfile.nickname || "Voyageur";
  const frames = [
    `${name} arrive au bout de la longue route.`,
    "Derriere lui: les lanternes, les petites trouvailles, les bancs ou le temps ralentissait.",
    "Il croyait atteindre la fin. Le sentier, lui, ouvre un autre monde.",
    "A partir d'ici, les villages apparaissent, les habitants demandent de l'aide, et la route ne s'arrete plus."
  ];
  let index = 0;
  ui.cinematic.classList.add("is-visible");
  ui.cinematicText.textContent = frames[index];
  const timer = setInterval(() => {
    index += 1;
    if (index >= frames.length) {
      clearInterval(timer);
      ui.cinematic.classList.remove("is-visible");
      running = true;
      showMessage("Le monde s'ouvre. Les villages arrivent plus loin sur la route.");
      return;
    }
    ui.cinematicText.textContent = frames[index];
  }, 2300);
}

function buildJournal() {
  ui.journalList.innerHTML = "";
  const foundItems = state.discoveries.slice(-18).reverse();
  const visibleItems = getProceduralDiscoveries();
  const summary = document.createElement("article");
  summary.className = "journal-item journal-summary";
  summary.innerHTML = `<strong>Progression</strong><p>Partie ${state.chapter} - ${getBiome(state.player.x).name} - ${getWeatherForChapter().label}. ${state.discoveries.length} decouvertes dans le carnet. ${state.helpedVillagers.length} habitants aides.</p>`;
  ui.journalList.appendChild(summary);
  if (foundItems.length === 0) {
    const entry = document.createElement("article");
    entry.className = "journal-item";
    entry.innerHTML = "<strong>????</strong><p>Une page encore vide attend une decouverte.</p>";
    ui.journalList.appendChild(entry);
  }
  foundItems.forEach((id) => {
    const baseItem = discoveries.find((entry) => entry.id === baseDiscoveryId(id));
    const item = visibleItems.find((entry) => entry.id === id) || baseItem || { label: id.replace(/-/g, " "), text: "Une trace retrouvee dans une ancienne partie du chemin." };
    const entry = document.createElement("article");
    entry.className = "journal-item";
    entry.innerHTML = `<strong>${item.label}</strong><p>${item.text}</p><p>Utilite: ${getItemUse(id)}.</p>`;
    ui.journalList.appendChild(entry);
  });
}

function startGame(reset = false) {
  savePlayerProfile();
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
  state.helpedVillagers = [];
  state.groupRest = 0;
  state.reactions = [];
  state.camera.x = 0;
  state.chapter = 1;
  state.weather = "clear";
  state.cinematicPlayed = false;
  state.player.rest = 0;
  localStorage.removeItem(saveKey);
}

function saveGame() {
  const payload = {
    x: state.player.x,
    discoveries: state.discoveries,
    lanterns: state.lanterns,
    helpedVillagers: state.helpedVillagers,
    groupRest: state.groupRest,
    reactions: state.reactions,
    startedAtLeastOnce: state.startedAtLeastOnce,
    cinematicPlayed: state.cinematicPlayed,
    party: state.party,
    playerId: state.playerProfile.id,
    nickname: state.playerProfile.nickname
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
    state.discoveries = Array.isArray(payload.discoveries) ? payload.discoveries.map(normalizeDiscoveryId) : [];
    state.lanterns = Array.isArray(payload.lanterns) ? payload.lanterns : [];
    state.helpedVillagers = Array.isArray(payload.helpedVillagers) ? payload.helpedVillagers : [];
    state.groupRest = Number.isFinite(payload.groupRest) ? payload.groupRest : 0;
    state.reactions = Array.isArray(payload.reactions) ? payload.reactions : [];
    state.startedAtLeastOnce = Boolean(payload.startedAtLeastOnce);
    state.cinematicPlayed = Boolean(payload.cinematicPlayed) && state.player.x >= world.firstRouteEnd;
    state.party = normalizeParty(payload.party);
    state.chapter = getChapter(state.player.x);
    if (payload.nickname) state.playerProfile.nickname = payload.nickname;
    return true;
  } catch {
    return false;
  }
}

function normalizeParty(party) {
  if (!party || typeof party !== "object") return { code: "", members: [], minPlayers: 2, maxPlayers: 4 };
  const members = Array.isArray(party.members)
    ? party.members
      .filter(Boolean)
      .map((member) => (typeof member === "string" ? { id: member, nickname: "Ami" } : member))
      .filter((member) => member.id)
      .slice(0, 4)
    : [];
  return {
    code: typeof party.code === "string" ? party.code.slice(0, 6).toUpperCase() : "",
    members,
    minPlayers: 2,
    maxPlayers: 4
  };
}

function normalizeDiscoveryId(id) {
  if (typeof id !== "string" || id.includes("-")) return id;
  const index = discoveries.findIndex((item) => item.id === id);
  return index >= 0 ? makeId(id, index + 1) : id;
}

function createUuid() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const value = Math.random() * 16 | 0;
    const resolved = char === "x" ? value : (value & 0x3) | 0x8;
    return resolved.toString(16);
  });
}

function loadPlayerProfile() {
  const raw = localStorage.getItem(playerKey);
  if (raw) {
    try {
      const payload = JSON.parse(raw);
      state.playerProfile.id = payload.id || createUuid();
      state.playerProfile.nickname = payload.nickname || "Voyageur";
    } catch {
      state.playerProfile.id = createUuid();
    }
  } else {
    state.playerProfile.id = createUuid();
  }
  ui.nicknameInput.value = state.playerProfile.nickname;
  ui.anonymousId.textContent = `Identifiant anonyme: ${state.playerProfile.id.slice(0, 8)}...`;
  savePlayerProfile();
}

function savePlayerProfile() {
  const nickname = ui.nicknameInput.value.trim().slice(0, 18) || "Voyageur";
  state.playerProfile.nickname = nickname;
  localStorage.setItem(playerKey, JSON.stringify(state.playerProfile));
}

function makePartyCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  } while (code === state.party.code);
  return code;
}

function createParty() {
  savePlayerProfile();
  if (net.connected) {
    net.socket.emit("party:create", { player: getNetworkPlayer() });
    return;
  }
  state.party = { code: makePartyCode(), members: [getNetworkPlayer()], minPlayers: 2, maxPlayers: 4 };
  ui.partyCodeInput.value = state.party.code;
  updatePartyUi();
  showMessage(`Partie locale creee: ${state.party.code}. Pour inviter un telephone, lance npm start et ouvre l'adresse du PC.`);
  saveGame();
}

function joinParty() {
  const code = ui.partyCodeInput.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (code.length !== 6) {
    showMessage("Entre un code de partie a 6 caracteres pour rejoindre un ami.");
    return;
  }
  savePlayerProfile();
  if (!net.connected) {
    showMessage("Serveur non connecte: ouvre le jeu depuis l'adresse du PC, par exemple http://IP_DU_PC:3000.");
    return;
  }
  if (net.connected) {
    net.socket.emit("party:join", { code, player: getNetworkPlayer() });
    return;
  }
  const sameParty = state.party.code === code;
  const members = sameParty ? [...(state.party.members || [])] : [];
  const alreadyInside = members.some((member) => (typeof member === "string" ? member : member.id) === state.playerProfile.id);
  if (!alreadyInside && members.length >= 4) {
    showMessage("Cette partie est pleine. Maximum 4 joueurs.");
    return;
  }
  state.party = {
    code,
    members: mergeMembers([...members, getNetworkPlayer()]).slice(0, 4),
    minPlayers: 2,
    maxPlayers: 4
  };
  ui.partyCodeInput.value = code;
  updatePartyUi();
  showMessage(`Tu as rejoint la partie ${code}. Elle accepte 2 a 4 joueurs.`);
  saveGame();
}

function leaveParty() {
  if (!state.party.code) {
    showMessage("Tu joues deja en solo.");
    return;
  }
  if (net.connected) net.socket.emit("party:leave", { code: state.party.code, playerId: state.playerProfile.id });
  state.party = { code: "", members: [], minPlayers: 2, maxPlayers: 4 };
  ui.partyCodeInput.value = "";
  updatePartyUi();
  saveGame();
  showMessage("Tu as quitte la partie. Tu continues seul(e).");
}

function updatePartyUi() {
  const inParty = Boolean(state.party.code);
  const count = state.party.members.length || (inParty ? 1 : 0);
  ui.partyLabel.textContent = inParty ? `Code ${state.party.code}` : "Solo";
  ui.partyStatus.textContent = inParty
    ? `Code ${state.party.code} - ${count} / 4 joueurs. La partie commence vraiment a partir de 2 joueurs.`
    : net.statusMessage || "Solo - cree une partie ou entre le code d'un ami.";
  ui.partyCodeInput.value = inParty ? state.party.code : ui.partyCodeInput.value;
  ui.leavePartyButton.classList.toggle("is-visible", inParty);
  ui.leavePartyOptionsButton.classList.toggle("is-visible", inParty);
}

function getNetworkPlayer() {
  return {
    id: state.playerProfile.id,
    nickname: state.playerProfile.nickname,
    x: state.player.x,
    face: state.player.face,
    resting: state.player.rest > 0.15
  };
}

function mergeMembers(members) {
  const byId = new Map();
  members.forEach((member) => {
    const resolved = typeof member === "string" ? { id: member, nickname: "Ami" } : member;
    if (resolved && resolved.id) byId.set(resolved.id, { ...(byId.get(resolved.id) || {}), ...resolved });
  });
  return Array.from(byId.values()).slice(0, 4);
}

function applyServerSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;
  const previousCount = state.party.members.length || 0;
  state.party = normalizeParty(snapshot.party || state.party);
  state.discoveries = Array.isArray(snapshot.discoveries) ? snapshot.discoveries : state.discoveries;
  state.lanterns = Array.isArray(snapshot.lanterns) ? snapshot.lanterns : state.lanterns;
  state.helpedVillagers = Array.isArray(snapshot.helpedVillagers) ? snapshot.helpedVillagers : state.helpedVillagers;
  state.groupRest = Number.isFinite(snapshot.groupRest) ? Math.max(state.groupRest, snapshot.groupRest) : state.groupRest;
  if (Array.isArray(snapshot.reactions)) {
    state.reactions = snapshot.reactions.map((reaction) => ({
      actorId: reaction.actorId,
      symbol: reaction.symbol,
      until: reaction.until > 100000 ? state.time + Math.max(0.5, (reaction.until - Date.now()) / 1000) : reaction.until
    }));
  }
  updatePartyUi();
  const nextCount = state.party.members.length || 0;
  if (running && nextCount > previousCount && nextCount >= 2) {
    playGroupMeetTransition(nextCount);
  }
  net.lastMemberCount = nextCount;
  saveGame();
}

function playGroupMeetTransition(count) {
  running = false;
  ui.cinematic.classList.add("is-visible");
  ui.cinematicText.textContent = count === 2
    ? "Vous vous retrouvez sur le sentier."
    : `Vous etes maintenant ${count} sur la route.`;
  setTimeout(() => {
    ui.cinematic.classList.remove("is-visible");
    running = true;
    showMessage(`${count} joueur${count > 1 ? "s" : ""} dans la partie. Vous avancez ensemble.`);
  }, 2200);
}

function setupRealtime() {
  if (!window.io) {
    net.statusMessage = "Serveur temps reel absent. Pour le multi, lance npm start et ouvre http://IP_DU_PC:3000.";
    updatePartyUi();
    return;
  }
  net.socket = window.io();
  net.socket.on("connect", () => {
    net.connected = true;
    net.statusMessage = "";
    if (state.party.code) {
      net.socket.emit("party:join", { code: state.party.code, player: getNetworkPlayer() });
    }
  });
  net.socket.on("disconnect", () => {
    net.connected = false;
    showMessage("Connexion serveur perdue. La partie continue en local en attendant.");
  });
  net.socket.on("connect_error", () => {
    net.connected = false;
    net.statusMessage = "Serveur inaccessible. Le telephone doit ouvrir l'adresse reseau du PC, pas localhost.";
    updatePartyUi();
  });
  net.socket.on("party:created", ({ snapshot }) => {
    applyServerSnapshot(snapshot);
    ui.partyCodeInput.value = state.party.code;
    showMessage(`Partie creee: ${state.party.code}. Partage ce code avec tes amis.`);
  });
  net.socket.on("party:joined", ({ snapshot }) => {
    applyServerSnapshot(snapshot);
    ui.partyCodeInput.value = state.party.code;
    showMessage(`Tu as rejoint la partie ${state.party.code}.`);
  });
  net.socket.on("party:snapshot", ({ snapshot }) => applyServerSnapshot(snapshot));
  net.socket.on("party:error", ({ message }) => showMessage(message || "Impossible de rejoindre cette partie."));
}

function syncAction(type, payload = {}) {
  if (!net.connected || !state.party.code) return false;
  net.socket.emit("party:action", {
    code: state.party.code,
    player: getNetworkPlayer(),
    action: { type, payload }
  });
  return true;
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
ui.nicknameInput.addEventListener("change", () => {
  savePlayerProfile();
  saveGame();
});
ui.createPartyButton.addEventListener("click", createParty);
ui.joinPartyButton.addEventListener("click", joinParty);
ui.leavePartyButton.addEventListener("click", leaveParty);
ui.leavePartyOptionsButton.addEventListener("click", leaveParty);
ui.reactionButton.addEventListener("click", () => {
  ui.reactionMenu.classList.toggle("is-visible");
});
ui.reactionMenu.querySelectorAll("button").forEach((button) => {
  button.addEventListener("click", () => sendReaction(button.dataset.reaction));
});
ui.giveItemButton.addEventListener("click", givePendingItem);
ui.refuseHelpButton.addEventListener("click", refusePendingHelp);
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

loadPlayerProfile();
loadOptions();
const hasSave = loadGame();
ui.nicknameInput.value = state.playerProfile.nickname;
ui.partyCodeInput.value = state.party.code || "";
updatePartyUi();
setupRealtime();
ui.continueButton.disabled = !hasSave;
ui.continueButton.style.opacity = hasSave ? "1" : "0.55";
resize();
draw();
requestAnimationFrame(loop);
