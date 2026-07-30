const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  startScreen: document.getElementById("startScreen"),
  startButton: document.getElementById("startButton"),
  continueButton: document.getElementById("continueButton"),
  journalButton: document.getElementById("journalButton"),
  optionsButton: document.getElementById("optionsButton"),
  infoButton: document.getElementById("infoButton"),
  muteButton: document.getElementById("muteButton"),
  journalDialog: document.getElementById("journalDialog"),
  discoveryDialog: document.getElementById("discoveryDialog"),
  discoveryTitle: document.getElementById("discoveryTitle"),
  discoveryBody: document.getElementById("discoveryBody"),
  hideDiscoveryPopup: document.getElementById("hideDiscoveryPopup"),
  continueDiscoveryButton: document.getElementById("continueDiscoveryButton"),
  infoDialog: document.getElementById("infoDialog"),
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
  soundEnabledToggle: document.getElementById("soundEnabledToggle"),
  musicVolume: document.getElementById("musicVolume"),
  natureVolume: document.getElementById("natureVolume"),
  effectsVolume: document.getElementById("effectsVolume"),
  resetDiscoveryTipsButton: document.getElementById("resetDiscoveryTipsButton"),
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
let pendingDiscoveryPopup = null;
let audioSceneKey = "";
const net = { socket: null, connected: false, lastMoveSent: 0, lastMemberCount: 0, statusMessage: "" };

const state = {
  player: { x: 380, y: 0, vx: 0, vy: 0, face: 1, rest: 0 },
  camera: { x: 0, y: 0, zoom: 1 },
  time: 0,
  chapter: 1,
  weather: "clear",
  cinematicPlayed: false,
  discoveries: [],
  inventory: {},
  discoveryDates: {},
  hiddenDiscoveryPopups: [],
  lanterns: [],
  helpedVillagers: [],
  activeQuest: null,
  completedQuests: 0,
  rewards: [],
  achievements: [],
  groupRest: 0,
  lastSeatActor: "",
  reactions: [],
  startedAtLeastOnce: false,
  playerProfile: { id: "", nickname: "Voyageur" },
  party: { code: "", members: [], minPlayers: 2, maxPlayers: 4 },
  options: { music: 0.1, nature: 0.16, effects: 0.25, muted: false, audioVersion: 5 }
};

const biomes = [
  { at: 0, name: "Bosquet vert", sky: "#f0d99c", haze: "#c6cf8d", tree: "#3d512a", leaf: "#6d7f3f", grass: "#8d9b45" },
  { at: 1800, name: "Clairiere fleurie", sky: "#efd39a", haze: "#b9c78f", tree: "#4b5e2d", leaf: "#7f8c4a", grass: "#a2a55a" },
  { at: 3600, name: "Sous-bois frais", sky: "#d9cf96", haze: "#a8bf94", tree: "#2d5545", leaf: "#5f876c", grass: "#7f9b61" },
  { at: 5400, name: "Nuit aux champignons", sky: "#4f6b70", haze: "#91b69c", tree: "#173629", leaf: "#315d4a", grass: "#536f3e" }
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
  { role: "Pecheur", line: "Tu cherches quelque chose ? J'ai entendu dire que des champignons lumineux poussent pres de la riviere lorsqu'il pleut." },
  { role: "Vieille dame", line: "Les vieilles pierres n'oublient jamais les pas gentils. Reviens quand le vent tournera vers l'ouest." },
  { role: "Garde forestier", line: "Si tu suis le vent vers l'ouest, tu trouveras peut-etre un ancien sentier oublie." },
  { role: "Enfant", line: "La nuit, les lucioles dessinent parfois des fleches au-dessus des fougeres." },
  { role: "Musicien", line: "Quand la pluie tombe doucement, les cloches du village sonnent plus loin que d'habitude." },
  { role: "Marchand", line: "Je ne vends rien aujourd'hui. Je collectionne seulement les histoires que les voyageurs me confient." },
  { role: "Facteur", line: "Une lettre ancienne apparait parfois la ou personne ne l'attend. Elle choisit son porteur." },
  { role: "Apiculteur", line: "Les fleurs les plus calmes poussent au printemps, quand les abeilles dansent bas." },
  { role: "Jardinier", line: "La mousse revient toujours pres des raccourcis que les cartes ont oublies." },
  { role: "Voyageur", line: "J'ai traverse trois villages sous la brume. Le dernier avait une porte sans mur." },
  { role: "Randonneur", line: "Les montagnes gardent des cristaux apres la neige, surtout au matin." },
  { role: "Artiste", line: "Je peins les meteo rares. Elles ne restent jamais assez longtemps." },
  { role: "Botaniste", line: "Une feuille nervuree peut proteger une carte fragile de la pluie. C'est un tres bon debut." },
  { role: "Vieux sage", line: "Aide les gens sans attendre de cadeau. Le monde, lui, se souviendra." }
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
  { id: "leaf", x: 860, label: "Feuille nervuree", rarity: "Rare", place: "Foret", text: "Une feuille rare, brillante comme du papier dore.", use: "Repare les cartes fragiles, ouvre certains raccourcis et protege de la pluie." },
  { id: "stone", x: 1420, label: "Pierre polie", rarity: "Commun", place: "Riviere", text: "Elle tient dans la paume et garde une fraicheur de ruisseau.", use: "Stabilise des mecanismes, des portes et des ponts anciens." },
  { id: "feather", x: 2140, label: "Plume claire", rarity: "Rare", place: "Foret", text: "Un oiseau l'a laissee tomber sans se presser.", use: "Ecrit des messages et apaise certains habitants." },
  { id: "moss", x: 3020, label: "Statue moussue", rarity: "Rare", place: "Village", text: "Un visage ancien sourit sous les fougeres.", use: "Reveille la memoire de lieux oublies." },
  { id: "shell", x: 3910, label: "Coquille de riviere", rarity: "Rare", place: "Riviere", text: "Minuscule spirale trouvee au bord de l'eau.", use: "Comprend les rivieres, les puits, les passages humides et la pluie." },
  { id: "cone", x: 4740, label: "Pomme de pin bleue", rarity: "Commun", place: "Foret", text: "Sa couleur change legerement quand on la tourne.", use: "Garde une chaleur douce contre la neige et le froid." },
  { id: "mushroom", x: 5660, label: "Champignon lumineux", rarity: "Rare", place: "Riviere", text: "Il emet une lumiere calme, presque musicale.", use: "Sert de lampe calme contre la brume, la nuit et la neige." },
  { id: "star", x: 6520, label: "Etoile tombee", rarity: "Legendaire", place: "Montagne", text: "Posee dans l'herbe comme un souvenir du ciel.", use: "Active les grands passages et garde une lumiere dans la brume." }
];

const extraItemNames = [
  "Feuille d'argent", "Fleur de trefle", "Branche souple", "Pierre de lune", "Galet rieur", "Roseau siffleur", "Fleur d'averse", "Baie douce", "Noisette claire", "Ecorce fine",
  "Plume blanche", "Coquillage dore", "Champignon bleu", "Grain de pollen", "Fougère pliee", "Morceau d'ambre", "Ruban de lierre", "Bouton de rose", "Clochette seche", "Perle de rosée",
  "Carte fragile", "Fragment de tuile", "Clef de mousse", "Fiole de brume", "Boussole fatiguee", "Lanterne miniature", "Bout de ficelle", "Pomme rouge", "Sachet de graines", "Petit miroir",
  "Cristal de pluie", "Graine ancienne", "Fleur eternelle", "Boussole enchantee", "Papillon de verre", "Eclat de soleil", "Couronne de fougere", "Silex chanteur", "Charme de vent", "Plume d'aurore",
  "Bouton de manteau", "Tasse fendue", "Jeton de village", "Clou dore", "Pinceau sec", "Note pliee", "Sifflet de bois", "Cordelette bleue", "Herbier vierge", "Pendentif simple",
  "Fleur de neige", "Galet noir", "Bois flotte", "Champignon doux", "Feuille rouge", "Pierre plate", "Mousse de pont", "Aiguille de pin", "Coque vide", "Grain de sable",
  "Etoffe verte", "Bague de cuivre", "Medaille sans nom", "Petale nacre", "Baton de marche", "Epi sauvage", "Larme d'orage", "Fragment d'etoile", "Fleur de minuit", "Sceau ancien",
  "Cloche miniature", "Poussiere de carte", "Craie blanche", "Tambourin muet", "Bouton de nacre", "Gemme de source", "Rune lisse", "Bocal de lucioles", "Aile transparente", "Goutte suspendue",
  "Fleur de colline", "Sapin miniature", "Feuille de saule", "Coquille bleue", "Pierre chaude", "Branche etoilee", "Plume sombre", "Baie d'hiver", "Herbe de pluie", "Morceau de nuage",
  "Cristal d'aube", "Fleur solaire", "Graine de chemin", "Boussole des mousses", "Etoile de poche", "Clef de racine", "Fiole de vent", "Carte des lucioles", "Couronne ancienne", "Soleil tombe"
];

const itemCatalog = discoveries.concat(extraItemNames.map((label, index) => {
  const rarity = index >= 90 ? "Legendaire" : index % 5 === 1 ? "Rare" : "Commun";
  const places = ["Foret", "Village", "Riviere", "Montagne", "Clairiere"];
  return {
    id: `item-${index + 1}`,
    label,
    rarity,
    place: places[index % places.length],
    text: rarity === "Legendaire"
      ? "Une trouvaille presque impossible, chaude comme un secret longtemps garde."
      : rarity === "Rare"
        ? "Un objet discret, mais assez singulier pour meriter une page du carnet."
        : "Une petite chose du chemin, simple et rassurante.",
    use: rarity === "Legendaire"
      ? "Ouvre des lieux secrets, reveille des meteo rares et nourrit les grandes missions."
      : rarity === "Rare"
        ? "Aide a reparer, proteger ou comprendre certains passages."
        : "Complete l'album, sert aux missions simples et garde la memoire du voyage."
  };
}));

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
    const local = itemCatalog[chapterIndex % itemCatalog.length];
    const jitter = 160 + hashNumber(chapter * 3.1) * 520;
    items.push({
      id: makeId(local.id, chapter),
      x: world.firstRouteEnd + chapterIndex * world.chapterSize + jitter,
      label: local.label,
      rarity: local.rarity,
      place: local.place,
      use: local.use,
      text: local.text
    });
  }
  return items;
}

function getProceduralLetters() {
  if (!isExpandedWorld()) return [];
  const relativeCamera = state.camera.x - world.firstRouteEnd;
  const start = Math.max(0, Math.floor((relativeCamera - 500) / world.chapterSize));
  const end = Math.floor((relativeCamera + window.innerWidth + 900) / world.chapterSize);
  const letters = [];
  for (let chapterIndex = start; chapterIndex <= end; chapterIndex += 1) {
    if (chapterIndex % 3 === 1) {
      letters.push({
        id: makeId("ancient-letter", chapterIndex + 4),
        x: world.firstRouteEnd + chapterIndex * world.chapterSize + 1010 + hashNumber(chapterIndex + 22) * 210
      });
    }
  }
  return letters;
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
  gradient.addColorStop(1, "#9a8f61");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.7;
  drawCloud(w * 0.68, h * 0.17, w * 0.18);
  drawCloud(w * 0.92, h * 0.25, w * 0.11);
  ctx.restore();

  ctx.save();
  ctx.translate(-state.camera.x * 0.05, 0);
  drawRoundedHill(-120, h * 0.57, 560, h * 0.24, "rgba(112, 136, 77, 0.42)");
  drawRoundedHill(230, h * 0.51, 600, h * 0.3, "rgba(139, 158, 101, 0.38)");
  drawRoundedHill(690, h * 0.58, 680, h * 0.22, "rgba(98, 127, 74, 0.4)");
  drawRoundedHill(1050, h * 0.54, 520, h * 0.18, "rgba(130, 148, 85, 0.32)");
  drawCoverRiver(w * 0.48 + state.camera.x * 0.05, h * 0.69);
  drawDistantVillage(w * 0.9 + state.camera.x * 0.05, h * 0.58);
  ctx.restore();

  ctx.save();
  ctx.translate(-state.camera.x * 0.12, 0);
  for (let i = -1; i < 8; i += 1) {
    drawShrubBand(i * 210, h * 0.67, i);
  }
  ctx.restore();
}

function drawCloud(x, y, size) {
  ctx.fillStyle = "rgba(255, 247, 212, 0.6)";
  drawEllipse(x, y, size * 0.35, size * 0.12, ctx.fillStyle);
  drawEllipse(x - size * 0.2, y + size * 0.01, size * 0.22, size * 0.09, ctx.fillStyle);
  drawEllipse(x + size * 0.22, y + size * 0.02, size * 0.24, size * 0.09, ctx.fillStyle);
}

function drawRoundedHill(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + height);
  ctx.quadraticCurveTo(x + width * 0.5, y - height, x + width, y + height);
  ctx.closePath();
  ctx.fill();
}

function drawDistantVillage(x, y) {
  ctx.save();
  ctx.globalAlpha = 0.9;
  for (let i = 0; i < 5; i += 1) {
    const hx = x + i * 54;
    const houseH = 34 + (i % 2) * 18;
    ctx.fillStyle = "#d7c27d";
    roundedRect(hx - 18, y - houseH, 36, houseH, 3);
    ctx.fill();
    ctx.fillStyle = "#9c5638";
    ctx.beginPath();
    ctx.moveTo(hx - 24, y - houseH);
    ctx.lineTo(hx, y - houseH - 26);
    ctx.lineTo(hx + 24, y - houseH);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255, 226, 112, 0.82)";
    ctx.fillRect(hx - 5, y - houseH + 13, 10, 10);
  }
  ctx.restore();
}

function drawCoverRiver(x, y) {
  ctx.save();
  ctx.fillStyle = "rgba(103, 180, 200, 0.58)";
  ctx.beginPath();
  ctx.moveTo(x - 120, y + 38);
  ctx.bezierCurveTo(x - 34, y - 20, x + 120, y - 4, x + 230, y - 70);
  ctx.lineTo(x + 270, y - 42);
  ctx.bezierCurveTo(x + 150, y + 18, x + 12, y + 22, x - 92, y + 68);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawShrubBand(x, y, seed) {
  const colors = ["#3d613d", "#4f713a", "#274f3f", "#657936"];
  for (let i = 0; i < 4; i += 1) {
    drawEllipse(x + i * 58, y + Math.sin(seed + i) * 12, 62, 36, colors[(seed + i + colors.length) % colors.length]);
  }
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
        ctx.fillStyle = layer === 2 ? "#4a2c1b" : colors.tree;
        roundedRect(x - 10, base - tree.h * 0.62, 20, tree.h * 0.64, 9);
        ctx.fill();
        const leaf = layer === 2 ? colors.leaf : blendHex(colors.leaf, "#c2c98d", 0.18);
        drawEllipse(x, base - tree.h * 0.72, tree.w * 0.78, tree.h * 0.3, leaf);
        drawEllipse(x - tree.w * 0.36, base - tree.h * 0.56, tree.w * 0.5, tree.h * 0.24, leaf);
        drawEllipse(x + tree.w * 0.36, base - tree.h * 0.55, tree.w * 0.54, tree.h * 0.24, leaf);
        ctx.fillStyle = "rgba(31, 55, 31, 0.28)";
        drawEllipse(x - tree.w * 0.12, base - tree.h * 0.78, tree.w * 0.12, tree.h * 0.04, ctx.fillStyle);
        drawEllipse(x + tree.w * 0.28, base - tree.h * 0.68, tree.w * 0.1, tree.h * 0.04, ctx.fillStyle);
      }
    }
    ctx.restore();
  }
}

function drawGround(colors) {
  const h = window.innerHeight;
  const w = window.innerWidth;
  ctx.fillStyle = "#241f18";
  ctx.fillRect(0, world.ground + 34, w, h - world.ground - 34);
  ctx.fillStyle = "#5f6f31";
  ctx.fillRect(0, world.ground + 10, w, 42);
  ctx.fillStyle = "#c6a15f";
  ctx.fillRect(0, world.ground - 18, w, 42);
  ctx.fillStyle = "#d1b06b";
  ctx.fillRect(0, world.ground - 13, w, 13);
  ctx.fillStyle = "#53672d";
  for (let x = -24; x < w + 34; x += 30) {
    drawEllipse(x, world.ground + 20, 21, 14, ctx.fillStyle);
  }
  ctx.fillStyle = "#6e7f34";
  for (let x = -12; x < w + 24; x += 24) {
    drawEllipse(x, world.ground + 3, 16, 10, ctx.fillStyle);
  }
  ctx.save();
  ctx.translate(-state.camera.x, 0);
  for (let x = Math.floor(state.camera.x / 74) * 74 - 90; x < state.camera.x + window.innerWidth + 120; x += 74) {
    const y = world.ground - 4 + Math.sin(x * 0.03) * 4;
    drawEllipse(x + 14, y, 10, 4, "rgba(103, 82, 49, 0.22)");
    drawEllipse(x + 42, y + 9, 7, 3, "rgba(103, 82, 49, 0.16)");
  }
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

  drawCoverForeground();

  getProceduralVillages().forEach((village) => {
    const y = world.ground - 18;
    for (let i = 0; i < 4; i += 1) {
      const houseX = village.x + i * 86;
      const houseH = 48 + (i % 2) * 18;
      ctx.fillStyle = i % 2 ? "#d6bf78" : "#e2cd88";
      roundedRect(houseX - 32, y - houseH, 64, houseH, 5);
      ctx.fill();
      ctx.fillStyle = "#9c5638";
      ctx.beginPath();
      ctx.moveTo(houseX - 40, y - houseH);
      ctx.lineTo(houseX, y - houseH - 34);
      ctx.lineTo(houseX + 40, y - houseH);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255, 226, 112, 0.82)";
      roundedRect(houseX - 10, y - houseH + 18, 20, 18, 4);
      ctx.fill();
      ctx.fillStyle = "#7d5a35";
      roundedRect(houseX - 5, y - 20, 10, 20, 3);
      ctx.fill();
    }
    drawVillager(village.x + 410, village.villager);
    if (Math.abs(state.player.x - (village.x + 410)) < 90) drawPrompt(village.x + 410, y - 102, "E parler");
  });

  getProceduralRests().forEach((rest) => {
    const y = world.ground - 18;
    ctx.fillStyle = "#6f4729";
    roundedRect(rest.x - 58, y - 20, 116, 14, 5);
    ctx.fill();
    ctx.fillStyle = "#4a2c1b";
    ctx.fillRect(rest.x - 42, y - 7, 10, 34);
    ctx.fillRect(rest.x + 32, y - 7, 10, 34);
    ctx.fillStyle = "#8c6135";
    roundedRect(rest.x - 50, y - 38, 100, 12, 4);
    ctx.fill();
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
    ctx.fillStyle = "#6b4527";
    roundedRect(lantern.x - 16, y - 22, 32, 36, 8);
    ctx.fill();
    ctx.fillStyle = lit ? "#ffe07a" : "#7a654b";
    roundedRect(lantern.x - 9, y - 14, 18, 22, 5);
    ctx.fill();
    if (!lit && Math.abs(state.player.x - lantern.x) < 78) drawPrompt(lantern.x, y - 58, "E allumer");
  });

  getProceduralDiscoveries().forEach((item, index) => {
    const collected = hasCollectedDiscovery(item);
    if (collected) return;
    const y = world.ground - 20 + Math.sin(state.time * 2 + index) * 5;
    drawCollectibleIcon(item, index, item.x, y);
    if (Math.abs(state.player.x - item.x) < 70) drawPrompt(item.x, y - 42, "E ramasser");
  });

  getProceduralLetters().forEach((letter, index) => {
    const y = world.ground - 26 + Math.sin(state.time * 1.8 + index) * 4;
    drawLetterIcon(letter.x, y);
    if (Math.abs(state.player.x - letter.x) < 76) drawPrompt(letter.x, y - 44, "E lire");
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

function drawLetterIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 42);
  glow.addColorStop(0, "rgba(240, 189, 108, 0.42)");
  glow.addColorStop(1, "rgba(240, 189, 108, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e8d49a";
  roundedRect(-18, -18, 36, 28, 4);
  ctx.fill();
  ctx.strokeStyle = "#8b6840";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-15, -14);
  ctx.lineTo(0, -1);
  ctx.lineTo(15, -14);
  ctx.moveTo(-15, 7);
  ctx.lineTo(-3, -4);
  ctx.moveTo(15, 7);
  ctx.lineTo(3, -4);
  ctx.stroke();
  ctx.restore();
}

function drawCollectibleIcon(item, index, x, y) {
  const baseId = baseDiscoveryId(item.id);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.08, 1.08);
  const isMagic = baseId === "mushroom" || baseId === "star";
  const glow = ctx.createRadialGradient(0, 0, 5, 0, 0, isMagic ? 48 : 34);
  glow.addColorStop(0, isMagic ? "rgba(255, 229, 118, 0.48)" : "rgba(255, 240, 190, 0.18)");
  glow.addColorStop(1, "rgba(255, 229, 118, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, isMagic ? 48 : 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 22, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(46, 38, 25, 0.18)";
  if (baseId === "leaf") {
    ctx.save();
    ctx.rotate(-0.52);
    ctx.fillStyle = "#9cab3c";
    ctx.beginPath();
    ctx.moveTo(-22, 10);
    ctx.bezierCurveTo(-14, -12, 10, -20, 24, -8);
    ctx.bezierCurveTo(15, 10, -4, 20, -22, 10);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#62742c";
    ctx.lineWidth = 2.3;
    ctx.beginPath();
    ctx.moveTo(-22, 10);
    ctx.lineTo(21, -7);
    ctx.moveTo(-2, 2);
    ctx.lineTo(0, 11);
    ctx.moveTo(8, -2);
    ctx.lineTo(13, 5);
    ctx.stroke();
    ctx.restore();
  } else if (baseId === "stone") {
    ctx.save();
    ctx.rotate(-0.1);
    drawEllipse(0, 1, 25, 15, "#a59c83");
    ctx.stroke();
    drawEllipse(-8, -4, 10, 4, "rgba(255,255,255,0.24)");
    drawEllipse(8, 5, 7, 3, "rgba(72,58,41,0.13)");
    ctx.restore();
  } else if (baseId === "feather") {
    ctx.save();
    ctx.rotate(0.52);
    ctx.fillStyle = "#f4e7bf";
    ctx.beginPath();
    ctx.moveTo(0, -29);
    ctx.bezierCurveTo(18, -19, 14, 12, 0, 27);
    ctx.bezierCurveTo(-14, 10, -17, -18, 0, -29);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#d8bd7c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -27);
    ctx.lineTo(0, 30);
    for (let i = -18; i <= 15; i += 8) {
      ctx.moveTo(0, i);
      ctx.lineTo(i < 0 ? -9 : 9, i + 7);
    }
    ctx.stroke();
    ctx.restore();
  } else if (baseId === "shell") {
    ctx.fillStyle = "#e9ad79";
    ctx.beginPath();
    ctx.moveTo(-27, 12);
    ctx.quadraticCurveTo(-23, -11, 0, -21);
    ctx.quadraticCurveTo(23, -11, 27, 12);
    ctx.quadraticCurveTo(5, 20, -27, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#c88362";
    ctx.lineWidth = 2;
    for (let i = -3; i <= 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(0, 13);
      ctx.quadraticCurveTo(i * 4, -4, i * 8, -15 + Math.abs(i) * 2);
      ctx.stroke();
    }
    drawEllipse(0, 8, 24, 5, "rgba(255, 227, 174, 0.22)");
  } else if (baseId === "cone") {
    ctx.save();
    ctx.fillStyle = "#4c8398";
    ctx.beginPath();
    ctx.moveTo(0, -27);
    ctx.bezierCurveTo(23, -13, 25, 15, 0, 28);
    ctx.bezierCurveTo(-25, 15, -23, -13, 0, -27);
    ctx.fill();
    ctx.stroke();
    const rows = [
      [-8, -14, 8],
      [-14, -6, 10],
      [0, -5, 10],
      [14, -6, 10],
      [-10, 4, 11],
      [8, 5, 11],
      [-4, 15, 12],
      [9, 17, 9]
    ];
    for (const [px, py, r] of rows) {
      drawEllipse(px, py, r, 6, "#396b83");
      drawEllipse(px - 2, py - 2, r * 0.55, 2.4, "rgba(128, 174, 190, 0.32)");
    }
    ctx.restore();
  } else if (baseId === "mushroom") {
    ctx.fillStyle = "#fff1b6";
    roundedRect(-9, -2, 18, 27, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f1c754";
    ctx.beginPath();
    ctx.moveTo(-27, -4);
    ctx.quadraticCurveTo(-16, -27, 1, -29);
    ctx.quadraticCurveTo(21, -27, 29, -4);
    ctx.quadraticCurveTo(10, 6, -27, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawEllipse(-11, -12, 4, 4, "#fff5c8");
    drawEllipse(3, -18, 3.5, 3.5, "#fff5c8");
    drawEllipse(15, -8, 3, 3, "#fff5c8");
  } else if (baseId === "star") {
    ctx.fillStyle = "#f6cf36";
    ctx.beginPath();
    for (let point = 0; point < 10; point += 1) {
      const radius = point % 2 === 0 ? 28 : 12;
      const angle = -Math.PI / 2 + point * Math.PI / 5;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (point === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 245, 154, 0.38)";
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(5, -4);
    ctx.lineTo(17, -3);
    ctx.lineTo(7, 5);
    ctx.lineTo(11, 18);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fill();
  } else {
    drawEllipse(0, 0, 10, 10, ["#f0bd6c", "#67b4c8", "#f7f3df", "#8ebf76", "#ce6f75"][index % 5]);
  }
  ctx.restore();
}

function drawCoverForeground() {
  const start = Math.floor((state.camera.x - 260) / 900) * 900;
  for (let baseX = start; baseX < state.camera.x + window.innerWidth + 420; baseX += 900) {
    const x = baseX + 70;
    const y = world.ground - 18;
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = "#4a2c1b";
    roundedRect(x - 62, y - 286, 32, 286, 13);
    ctx.fill();
    roundedRect(x + 24, y - 220, 26, 220, 12);
    ctx.fill();
    drawEllipse(x - 20, y - 300, 160, 104, "#33451f");
    drawEllipse(x - 108, y - 226, 96, 72, "#263d29");
    drawEllipse(x + 84, y - 222, 124, 82, "#405126");
    ctx.fillStyle = "rgba(17, 39, 20, 0.36)";
    drawEllipse(x - 60, y - 322, 16, 28, ctx.fillStyle);
    drawEllipse(x + 38, y - 308, 14, 24, ctx.fillStyle);
    drawEllipse(x + 112, y - 244, 12, 22, ctx.fillStyle);
    drawCoverFlowers(x - 170, y - 18);
    drawCoverMushrooms(x + 160, y - 12);
    drawCoverLantern(x - 142, y - 98);
    ctx.restore();
  }
}

function drawCoverFlowers(x, y) {
  ctx.save();
  ctx.strokeStyle = "#6a7b39";
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i += 1) {
    const fx = x + i * 18;
    ctx.beginPath();
    ctx.moveTo(fx, y);
    ctx.lineTo(fx + Math.sin(i) * 8, y - 34 - i * 3);
    ctx.stroke();
    drawEllipse(fx - 4, y - 38 - i * 3, 7, 7, "#ead68d");
    drawEllipse(fx + 4, y - 38 - i * 3, 7, 7, "#ead68d");
  }
  ctx.restore();
}

function drawCoverMushrooms(x, y) {
  ctx.save();
  drawEllipse(x, y - 13, 14, 8, "#b76b45");
  roundedRect(x - 4, y - 9, 8, 18, 4);
  ctx.fillStyle = "#f1d59a";
  ctx.fill();
  drawEllipse(x + 28, y - 9, 12, 7, "#9f5941");
  roundedRect(x + 25, y - 6, 7, 15, 4);
  ctx.fillStyle = "#f1d59a";
  ctx.fill();
  ctx.restore();
}

function drawCoverLantern(x, y) {
  ctx.save();
  ctx.strokeStyle = "#5b371f";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y - 62);
  ctx.lineTo(x, y);
  ctx.moveTo(x, y - 60);
  ctx.lineTo(x + 52, y - 60);
  ctx.lineTo(x + 52, y - 28);
  ctx.stroke();
  const glow = ctx.createRadialGradient(x + 52, y - 10, 6, x + 52, y - 10, 74);
  glow.addColorStop(0, "rgba(255, 220, 108, 0.48)");
  glow.addColorStop(1, "rgba(255, 220, 108, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x + 52, y - 10, 74, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6b4527";
  roundedRect(x + 30, y - 30, 44, 44, 8);
  ctx.fill();
  ctx.fillStyle = "#ffe07a";
  roundedRect(x + 40, y - 20, 24, 26, 5);
  ctx.fill();
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
  ctx.fillStyle = "rgba(103, 180, 200, 0.58)";
  ctx.beginPath();
  ctx.ellipse(riverX, y, 380, 34, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(247, 243, 223, 0.24)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(riverX - 300 + i * 120, y + Math.sin(state.time * 2 + i) * 8);
    ctx.quadraticCurveTo(riverX - 250 + i * 120, y - 10, riverX - 200 + i * 120, y + 2);
    ctx.stroke();
  }
}

function drawVillager(x, villager) {
  const y = world.ground;
  const bob = Math.sin(state.time * 2 + x) * 3;
  drawCharacter({
    x,
    y: y + bob,
    face: -1,
    velocity: 0,
    body: "#6a8a80",
    skin: "#e5b878",
    hair: "#4a3632",
    label: "",
    seated: false
  });

  if (Math.abs(state.player.x - x) < 210) {
    ctx.save();
    ctx.font = "800 12px Nunito";
    ctx.fillStyle = "rgba(20, 34, 33, 0.72)";
    roundedRect(x - 74, y - 126, 148, 26, 7);
    ctx.fill();
    ctx.fillStyle = "#f7f3df";
    ctx.textAlign = "center";
    ctx.fillText(villager.role, x, y - 108);
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
  const baseY = y - 52 + (seated ? 10 : 0);
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(face, 1);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 57, 27, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2d2730";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-7, 30);
  ctx.lineTo(seated ? -21 : -14 - walk * 7, seated ? 45 : 55);
  ctx.moveTo(8, 30);
  ctx.lineTo(seated ? 21 : 15 + walk * 7, seated ? 45 : 55);
  ctx.stroke();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 22, 22, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.beginPath();
  ctx.ellipse(-7, 10, 8, 16, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, -25, 23, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 239, 177, 0.22)";
  ctx.beginPath();
  ctx.ellipse(-8, -31, 8, 6, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#28312e";
  ctx.beginPath();
  ctx.arc(11, -27, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.ellipse(-9, -38, 25, 14, -0.28, Math.PI * 0.92, Math.PI * 2.06);
  ctx.lineTo(-22, -25);
  ctx.quadraticCurveTo(-5, -31, 16, -42);
  ctx.fill();
  ctx.restore();

  if (label && Math.abs(x - state.player.x) < 260) {
    ctx.save();
    ctx.font = "800 11px Nunito";
    ctx.fillStyle = "rgba(20, 34, 33, 0.52)";
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
  if (previousWeather !== state.weather) {
    announceWeather();
    advanceQuest("weather", 1);
  }
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
    advanceQuest("talkVillager", 1);
    saveGame();
    return;
  }

  const letter = getProceduralLetters().find((entry) => Math.abs(entry.x - p.x) < 78);
  if (letter) {
    readAncientLetter(letter);
    saveGame();
    return;
  }

  const item = getProceduralDiscoveries().find((entry) => !hasCollectedDiscovery(entry) && Math.abs(entry.x - p.x) < 78);
  if (item) {
    const showedPopup = collectDiscovery(item);
    syncAction("collect", { itemId: item.id });
    if (!showedPopup) playSoftPing();
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
  if (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) return parts.slice(0, -1).join("-");
  return id;
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

function getCatalogItem(itemId) {
  return itemCatalog.find((entry) => entry.id === baseDiscoveryId(itemId))
    || discoveries.find((entry) => entry.id === baseDiscoveryId(itemId))
    || null;
}

function getItemUse(itemId) {
  const item = getCatalogItem(itemId);
  if (item && item.use) return item.use;
  const need = villagerNeeds.find((entry) => entry.itemId === baseDiscoveryId(itemId));
  return need ? need.use : "Servira peut-etre plus loin sur la route.";
}

function getItemSymbol(item) {
  const rarity = item.rarity || (getCatalogItem(item.id) || {}).rarity || "Commun";
  const baseId = baseDiscoveryId(item.id);
  if (baseId.includes("leaf")) return "L";
  if (baseId.includes("mushroom")) return "M";
  if (baseId.includes("star")) return "*";
  if (baseId.includes("shell")) return "C";
  if (rarity === "Legendaire") return "*";
  if (rarity === "Rare") return "+";
  return "o";
}

function formatDiscoveryDate(itemId) {
  const raw = state.discoveryDates[baseDiscoveryId(itemId)];
  if (!raw) return "Inconnue";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Inconnue";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function getSeason() {
  const seasons = ["Printemps", "Ete", "Automne", "Hiver"];
  return seasons[Math.floor((state.chapter - 1) / 3) % seasons.length];
}

function isNightPlace() {
  return getBiome(state.player.x).name.toLowerCase().includes("nuit");
}

function getPlaceType(x = state.player.x) {
  const nearVillage = getProceduralVillages().some((village) => Math.abs(x - (village.x + 170)) < 620);
  if (nearVillage) return "Village";
  const riverX = isExpandedWorld()
    ? Math.floor((x - world.firstRouteEnd) / 4200) * 4200 + world.firstRouteEnd + 3820
    : 3820;
  if (Math.abs(x - riverX) < 520) return "Riviere";
  if (getBiome(x).name.toLowerCase().includes("nuit") || state.chapter % 8 === 0) return "Montagne";
  return "Foret";
}

function updateAchievements() {
  const achievements = [
    { id: "leaves-100", ok: (state.inventory.leaf || 0) >= 100, label: "100 feuilles ramassees" },
    { id: "helpers-50", ok: state.helpedVillagers.length >= 50, label: "50 habitants aides" },
    { id: "discoveries-25", ok: Object.keys(state.inventory).length >= 25, label: "25 objets differents decouverts" },
    { id: "quests-10", ok: state.completedQuests >= 10, label: "10 missions terminees" }
  ];
  achievements.forEach((achievement) => {
    if (achievement.ok && !state.achievements.includes(achievement.id)) {
      state.achievements.push(achievement.id);
      showMessage(`Succes debloque: ${achievement.label}.`);
    }
  });
}

function makeQuest(seed = Math.floor(state.player.x + state.time * 1000)) {
  const templates = [
    { label: "Aider trois habitants", type: "helpVillager", target: 3 },
    { label: "Trouver deux champignons", type: "collect:mushroom", target: 2 },
    { label: "Ramasser cinq feuilles", type: "collect:leaf", target: 5 },
    { label: "Traverser trois villages", type: "talkVillager", target: 3 },
    { label: "Decouvrir une nouvelle meteo", type: "weather", target: 1 },
    { label: "Trouver un coquillage", type: "collect:shell", target: 1 },
    { label: "Ramasser cinq objets", type: "collectAny", target: 5 }
  ];
  const template = templates[Math.floor(hashNumber(seed) * templates.length) % templates.length];
  return {
    id: `quest-${Date.now()}-${Math.floor(hashNumber(seed + 2) * 10000)}`,
    label: template.label,
    type: template.type,
    target: template.target,
    progress: 0
  };
}

function readAncientLetter(letter) {
  if (state.activeQuest) {
    showMessage("Tu as deja une mission en cours. Termine-la avant d'en recevoir une nouvelle.");
    return;
  }
  state.activeQuest = makeQuest(letter.x);
  showMessage(`Lettre ancienne: nouvelle mission - ${state.activeQuest.label}.`);
  playSoftPing();
}

function advanceQuest(type, amount = 1) {
  if (!state.activeQuest || state.activeQuest.type !== type) return;
  state.activeQuest.progress = Math.min(state.activeQuest.target, state.activeQuest.progress + amount);
  if (state.activeQuest.progress >= state.activeQuest.target) completeQuest();
}

function completeQuest() {
  const label = state.activeQuest.label;
  state.activeQuest = null;
  const reward = grantQuestReward();
  state.completedQuests += 1;
  showMessage(`Mission terminee: ${label}. Recompense mystere: ${reward}.`);
  playSoftPing();
  updateAchievements();
  saveGame();
}

function grantQuestReward() {
  const choices = ["2 objets rares", "3 objets communs", "une etoile", "un habitant special", "une meteo rare", "une decoration"];
  const reward = choices[Math.floor(hashNumber(Date.now() + state.player.x) * choices.length) % choices.length];
  state.rewards.push({ label: reward, at: new Date().toISOString() });
  if (reward === "2 objets rares" || reward === "3 objets communs") {
    const wanted = reward === "2 objets rares" ? "Rare" : "Commun";
    const count = reward === "2 objets rares" ? 2 : 3;
    itemCatalog.filter((item) => item.rarity === wanted).slice(0, count).forEach((item, index) => {
      collectDiscovery({ ...item, id: makeId(item.id, state.chapter + index + state.completedQuests + 20) }, true);
    });
  }
  return reward;
}

function collectDiscovery(item, quiet = false) {
  const baseId = baseDiscoveryId(item.id);
  const firstTime = !hasCollectedBaseItem(baseId);
  state.discoveries.push(item.id);
  state.inventory[baseId] = (state.inventory[baseId] || 0) + 1;
  if (firstTime) state.discoveryDates[baseId] = new Date().toISOString();
  advanceQuest("collectAny", 1);
  advanceQuest(`collect:${baseId}`, 1);
  if (item.place === "Riviere") advanceQuest("collectRiver", 1);
  if (!quiet && !state.hiddenDiscoveryPopups.includes(baseId)) {
    openDiscoveryPopup(item);
    updateAchievements();
    return true;
  } else if (!quiet) {
    showMessage(`${item.label}: ${item.text}`);
  }
  updateAchievements();
  return false;
}

function openDiscoveryPopup(item) {
  const baseId = baseDiscoveryId(item.id);
  pendingDiscoveryPopup = baseId;
  ui.discoveryTitle.textContent = item.label;
  ui.hideDiscoveryPopup.checked = false;
  ui.discoveryBody.innerHTML = `
    <div class="discovery-icon">${getItemSymbol(item)}</div>
    <p>${item.text}</p>
    <p><strong>Rareté</strong> ${item.rarity || "Commun"}</p>
    <p><strong>Utilité</strong> ${getItemUse(item.id)}</p>
  `;
  ui.discoveryDialog.showModal();
}

function closeDiscoveryPopup() {
  if (pendingDiscoveryPopup && ui.hideDiscoveryPopup.checked && !state.hiddenDiscoveryPopups.includes(pendingDiscoveryPopup)) {
    state.hiddenDiscoveryPopups.push(pendingDiscoveryPopup);
    saveGame();
  }
  pendingDiscoveryPopup = null;
}

function openVillagerHelp(villager) {
  const alreadyHelped = state.helpedVillagers.includes(villager.villageId);
  ui.villagerTitle.textContent = villager.role;
  ui.giveItemButton.disabled = alreadyHelped;
  ui.giveItemButton.style.opacity = alreadyHelped ? "0.55" : "1";
  if (alreadyHelped) {
    ui.villagerText.textContent = `${villager.line} Il te remercie encore. Le village se souvient de ton aide.`;
  } else {
    const requests = [
      "Il demande de l'aide pour retrouver un sentier disparu.",
      "Elle aimerait que quelqu'un ecoute une vieille legende jusqu'au bout.",
      "Il signale une zone ou la meteo change sans prevenir.",
      "Elle cherche un voyageur pour verifier que les lanternes brillent encore."
    ];
    ui.villagerText.textContent = `${villager.line} ${requests[Math.round(villager.x / 97) % requests.length]}`;
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
  state.helpedVillagers.push(pendingVillagerHelp.villageId);
  advanceQuest("helpVillager", 1);
  syncAction("help-villager", {
    villageId: pendingVillagerHelp.villageId
  });
  ui.villagerDialog.close();
  showMessage(`${pendingVillagerHelp.role} te remercie. Le monde devient un peu plus vivant.`);
  pendingVillagerHelp = null;
  playSoftPing();
  updateAchievements();
  saveGame();
}

function refusePendingHelp() {
  if (!pendingVillagerHelp) return;
  const name = pendingVillagerHelp.role;
  ui.villagerDialog.close();
  pendingVillagerHelp = null;
  showMessage(`${name} hoche la tete et reprend son histoire plus doucement.`);
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
  const uniqueFound = Object.keys(state.inventory).length;
  const playHours = Math.floor(state.time / 3600);
  const playMinutes = Math.floor((state.time % 3600) / 60).toString().padStart(2, "0");
  const summary = document.createElement("article");
  summary.className = "journal-item journal-summary";
  summary.innerHTML = `
    <strong>Mon voyage</strong>
    <p>Jour ${state.chapter}</p>
    <p>Saison : ${getSeason()}</p>
    <p>Meteo : ${getWeatherForChapter().label}</p>
    <p>Lieu : ${getPlaceType()}</p>
    <p>Decouvertes : ${uniqueFound} / ${itemCatalog.length}</p>
    <p>Habitants rencontres : ${state.helpedVillagers.length}</p>
    <p>Missions terminees : ${state.completedQuests}</p>
    <p>Temps joue : ${playHours} h ${playMinutes}</p>
    <p>${state.activeQuest ? `Mission active : ${state.activeQuest.label} (${state.activeQuest.progress} / ${state.activeQuest.target})` : "Aucune mission active"}</p>
  `;
  ui.journalList.appendChild(summary);
  if (foundItems.length === 0) {
    const entry = document.createElement("article");
    entry.className = "journal-item";
    entry.innerHTML = "<strong>????</strong><p>Une page encore vide attend une decouverte.</p>";
    ui.journalList.appendChild(entry);
  }
  foundItems.forEach((id) => {
    const baseItem = getCatalogItem(id);
    const item = visibleItems.find((entry) => entry.id === id) || baseItem || { label: id.replace(/-/g, " "), text: "Une trace retrouvee dans une ancienne partie du chemin." };
    const entry = document.createElement("article");
    entry.className = "journal-item journal-card";
    entry.innerHTML = `
      <div class="journal-object-image">${getItemSymbol(item)}</div>
      <div>
        <strong>${item.label}</strong>
        <p>Rarete : ${item.rarity || "Commun"}</p>
        <p>${item.text}</p>
        <p>Utilite : ${getItemUse(id)}</p>
        <p>Lieu : ${item.place || "Chemin"}</p>
        <p>Nombre possede : ${state.inventory[baseDiscoveryId(id)] || 1}</p>
        <p>Date de decouverte : ${formatDiscoveryDate(id)}</p>
      </div>
    `;
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
  state.inventory = {};
  state.discoveryDates = {};
  state.hiddenDiscoveryPopups = [];
  state.lanterns = [];
  state.helpedVillagers = [];
  state.activeQuest = null;
  state.completedQuests = 0;
  state.rewards = [];
  state.achievements = [];
  state.groupRest = 0;
  state.reactions = [];
  state.time = 0;
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
    time: state.time,
    discoveries: state.discoveries,
    inventory: state.inventory,
    discoveryDates: state.discoveryDates,
    hiddenDiscoveryPopups: state.hiddenDiscoveryPopups,
    lanterns: state.lanterns,
    helpedVillagers: state.helpedVillagers,
    activeQuest: state.activeQuest,
    completedQuests: state.completedQuests,
    rewards: state.rewards,
    achievements: state.achievements,
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
    state.time = Number.isFinite(payload.time) ? payload.time : 0;
    state.discoveries = Array.isArray(payload.discoveries) ? payload.discoveries.map(normalizeDiscoveryId) : [];
    state.inventory = payload.inventory && typeof payload.inventory === "object" ? payload.inventory : rebuildInventory(state.discoveries);
    state.discoveryDates = payload.discoveryDates && typeof payload.discoveryDates === "object" ? payload.discoveryDates : {};
    state.hiddenDiscoveryPopups = Array.isArray(payload.hiddenDiscoveryPopups) ? payload.hiddenDiscoveryPopups : [];
    state.lanterns = Array.isArray(payload.lanterns) ? payload.lanterns : [];
    state.helpedVillagers = Array.isArray(payload.helpedVillagers) ? payload.helpedVillagers : [];
    state.activeQuest = payload.activeQuest && typeof payload.activeQuest === "object" ? payload.activeQuest : null;
    state.completedQuests = Number.isFinite(payload.completedQuests) ? payload.completedQuests : 0;
    state.rewards = Array.isArray(payload.rewards) ? payload.rewards : [];
    state.achievements = Array.isArray(payload.achievements) ? payload.achievements : [];
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

function rebuildInventory(ids) {
  return ids.reduce((inventory, id) => {
    const baseId = baseDiscoveryId(id);
    inventory[baseId] = (inventory[baseId] || 0) + 1;
    return inventory;
  }, {});
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
  showMessage(`Partie entre amis creee: ${state.party.code}. Partage ce code avec tes amis.`);
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
    showMessage("Partie entre amis indisponible pour le moment. Tu peux continuer en solo.");
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
    : net.statusMessage || "Partie entre amis - cree une partie ou rejoins une partie.";
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
    net.statusMessage = "Partie entre amis";
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
    net.statusMessage = "Partie entre amis indisponible";
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
    syncOptionControls();
    updateMuteButton();
    return;
  }
  try {
    const payload = JSON.parse(raw);
    state.options.music = Number.isFinite(payload.music) ? payload.music : state.options.music;
    state.options.nature = Number.isFinite(payload.nature) ? payload.nature : state.options.nature;
    state.options.effects = Number.isFinite(payload.effects) ? payload.effects : state.options.effects;
    state.options.muted = Boolean(payload.muted);
    if (payload.audioVersion !== 5) {
      state.options.music = Math.min(state.options.music, 0.1);
      state.options.nature = Math.min(state.options.nature, 0.16);
      state.options.effects = Math.min(state.options.effects, 0.25);
      state.options.audioVersion = 5;
      saveOptions();
    }
    syncOptionControls();
    updateMuteButton();
  } catch {
    localStorage.removeItem(optionsKey);
    syncOptionControls();
    updateMuteButton();
  }
}

function saveOptions() {
  localStorage.setItem(optionsKey, JSON.stringify(state.options));
}

function syncOptionControls() {
  ui.musicVolume.value = state.options.music;
  ui.natureVolume.value = state.options.nature;
  ui.effectsVolume.value = state.options.effects;
  ui.soundEnabledToggle.checked = !state.options.muted;
}

function isAudioMuted() {
  return state.options.muted
    || (state.options.music <= 0 && state.options.nature <= 0 && state.options.effects <= 0);
}

function updateMuteButton() {
  ui.muteButton.classList.toggle("is-muted", state.options.muted);
  ui.muteButton.title = state.options.muted ? "Remettre le son" : "Couper le son";
  ui.muteButton.setAttribute("aria-label", ui.muteButton.title);
  if (ui.soundEnabledToggle) ui.soundEnabledToggle.checked = !state.options.muted;
}

function setupAudio() {
  if (audio) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const master = context.createGain();
  const music = context.createGain();
  const nature = context.createGain();
  const effects = context.createGain();
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
  master.gain.value = 0;
  music.gain.value = 0;
  nature.gain.value = 0;
  effects.gain.value = 0;
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
  effects.connect(master);
  master.connect(context.destination);
  toneA.start();
  toneB.start();
  toneC.start();
  noise.start();
  lfo.start();

  audio = { context, master, music, nature, effects, filter };
  audio.tones = [toneA, toneB, toneC];
  audio.nextAmbient = 0;
  updateAudio();
}

function updateAudio() {
  const streamDistance = Math.abs(state.player.x - 3820);
  const stream = Math.max(0, 1 - streamDistance / 900);
  const now = audio.context.currentTime;
  const mute = isAudioMuted() ? 0 : 1;
  const scene = getAudioScene();
  if (scene.key !== audioSceneKey) {
    audioSceneKey = scene.key;
    audio.tones.forEach((tone, index) => tone.frequency.setTargetAtTime(scene.notes[index], now, 1.8));
  }
  const musicVolume = state.options.music <= 0 ? 0 : state.options.music * scene.musicLevel * (0.08 + state.player.rest * 0.02);
  const natureVolume = state.options.nature <= 0 ? 0 : state.options.nature * scene.natureLevel * (0.05 + stream * 0.06);
  const effectsVolume = state.options.effects <= 0 ? 0 : state.options.effects;
  audio.master.gain.setTargetAtTime(mute, now, mute <= 0 ? 0.01 : 0.15);
  audio.music.gain.setTargetAtTime(musicVolume, now, state.options.music <= 0 ? 0.02 : 1.4);
  audio.nature.gain.setTargetAtTime(natureVolume, now, state.options.nature <= 0 ? 0.02 : 1.2);
  audio.effects.gain.setTargetAtTime(effectsVolume, now, state.options.effects <= 0 ? 0.01 : 0.08);
  audio.filter.frequency.setTargetAtTime(scene.filter + stream * 360, now, 0.9);
  if (mute > 0 && state.options.nature > 0 && now >= audio.nextAmbient) {
    playAmbientCue(scene);
    audio.nextAmbient = now + scene.interval;
  }
}

function getAudioScene() {
  const season = getSeason();
  const weather = getWeatherForChapter().id;
  const place = getPlaceType();
  const night = isNightPlace();
  const scene = {
    key: `${season}-${weather}-${place}-${night ? "night" : "day"}`,
    notes: [130.81, 196, 261.63],
    filter: 220,
    musicLevel: 1,
    natureLevel: 1,
    ambient: "birds",
    interval: 5.5
  };
  if (season === "Printemps") {
    scene.notes = [146.83, 220, 329.63];
    scene.filter = 420;
    scene.natureLevel = 1.2;
  } else if (season === "Ete") {
    scene.notes = [164.81, 246.94, 329.63];
    scene.filter = 360;
  } else if (season === "Automne") {
    scene.notes = [123.47, 185, 277.18];
    scene.filter = 260;
  } else {
    scene.notes = [110, 164.81, 220];
    scene.filter = 180;
    scene.musicLevel = 0.82;
  }
  if (weather === "rain") {
    scene.notes = scene.notes.map((note) => note * 0.94);
    scene.filter = 720;
    scene.natureLevel = 1.65;
    scene.ambient = "rain-wind";
    scene.interval = 2.4;
  } else if (weather === "wind") {
    scene.notes = scene.notes.map((note) => note * 1.08);
    scene.filter = 540;
    scene.natureLevel = 1.35;
    scene.ambient = "wind";
    scene.interval = 3.2;
  } else if (weather === "snow") {
    scene.notes = scene.notes.map((note) => note * 0.88);
    scene.filter = 150;
    scene.natureLevel = 0.72;
    scene.ambient = "snow";
    scene.interval = 7;
  } else if (weather === "mist") {
    scene.filter = 130;
    scene.musicLevel = 0.75;
    scene.ambient = "mist";
    scene.interval = 6.4;
  }
  if (night) {
    scene.notes = [98, 146.83, 196];
    scene.filter = Math.min(scene.filter, 210);
    scene.natureLevel += 0.38;
    scene.ambient = "crickets";
    scene.interval = 1.8;
  }
  if (place === "Village") {
    scene.notes = [174.61, 220, 349.23];
    scene.musicLevel += 0.18;
    scene.ambient = "village";
    scene.interval = 4.6;
  } else if (place === "Riviere") {
    scene.filter += 260;
    scene.natureLevel += 0.42;
    scene.ambient = weather === "rain" ? "rain-wind" : "river";
    scene.interval = 2.8;
  } else if (place === "Montagne") {
    scene.notes = scene.notes.map((note) => note * 0.82);
    scene.musicLevel = Math.max(0.55, scene.musicLevel - 0.16);
    scene.ambient = weather === "snow" ? "snow" : "wind";
    scene.interval = 4;
  }
  return scene;
}

function playAmbientCue(scene) {
  if (!audio || isAudioMuted() || state.options.nature <= 0) return;
  const now = audio.context.currentTime;
  const gain = audio.context.createGain();
  const oscillator = audio.context.createOscillator();
  oscillator.type = scene.ambient === "rain-wind" || scene.ambient === "wind" ? "sawtooth" : "sine";
  const frequencies = {
    birds: [880, 1174.66],
    "rain-wind": [180, 95],
    wind: [146.83, 110],
    crickets: [1760, 1567.98],
    village: [523.25, 392],
    river: [329.63, 246.94],
    snow: [220, 164.81],
    mist: [261.63, 196]
  };
  const pair = frequencies[scene.ambient] || frequencies.birds;
  oscillator.frequency.setValueAtTime(pair[0], now);
  oscillator.frequency.exponentialRampToValueAtTime(pair[1], now + 0.28);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.018, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (scene.ambient === "village" ? 1.1 : 0.42));
  oscillator.connect(gain);
  gain.connect(audio.nature);
  oscillator.start(now);
  oscillator.stop(now + (scene.ambient === "village" ? 1.2 : 0.5));
}

function playSoftPing() {
  if (!audio || isAudioMuted() || state.options.effects <= 0) return;
  const oscillator = audio.context.createOscillator();
  const gain = audio.context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(523.25, audio.context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(783.99, audio.context.currentTime + 0.22);
  gain.gain.setValueAtTime(0.0001, audio.context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.035, audio.context.currentTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.context.currentTime + 0.5);
  oscillator.connect(gain);
  gain.connect(audio.effects);
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
ui.infoButton.addEventListener("click", () => ui.infoDialog.showModal());
ui.discoveryDialog.addEventListener("close", closeDiscoveryPopup);
ui.optionsButton.addEventListener("click", () => ui.optionsDialog.showModal());
ui.muteButton.addEventListener("click", () => {
  state.options.muted = !state.options.muted;
  updateMuteButton();
  saveOptions();
  if (audio) updateAudio();
});
ui.soundEnabledToggle.addEventListener("change", () => {
  state.options.muted = !ui.soundEnabledToggle.checked;
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
ui.effectsVolume.addEventListener("input", () => {
  state.options.effects = Number(ui.effectsVolume.value);
  saveOptions();
  if (audio) updateAudio();
});
ui.resetDiscoveryTipsButton.addEventListener("click", () => {
  state.hiddenDiscoveryPopups = [];
  saveGame();
  showMessage("Les explications des objets sont reactivees.");
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
