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
  villagerDialog: document.getElementById("villagerDialog"),
  villagerTitle: document.getElementById("villagerTitle"),
  villagerText: document.getElementById("villagerText"),
  giveItemButton: document.getElementById("giveItemButton"),
  refuseHelpButton: document.getElementById("refuseHelpButton"),
  questDialog: document.getElementById("questDialog"),
  questDialogBody: document.getElementById("questDialogBody"),
  startQuestButton: document.getElementById("startQuestButton"),
  questCompleteDialog: document.getElementById("questCompleteDialog"),
  questCompleteBody: document.getElementById("questCompleteBody"),
  claimQuestRewardButton: document.getElementById("claimQuestRewardButton"),
  companionDialog: document.getElementById("companionDialog"),
  companionBody: document.getElementById("companionBody"),
  welcomeCompanionButton: document.getElementById("welcomeCompanionButton"),
  missionTracker: document.getElementById("missionTracker"),
  soundEnabledToggle: document.getElementById("soundEnabledToggle"),
  musicVolume: document.getElementById("musicVolume"),
  natureVolume: document.getElementById("natureVolume"),
  effectsVolume: document.getElementById("effectsVolume"),
  resetDiscoveryTipsButton: document.getElementById("resetDiscoveryTipsButton"),
  skinSelect: document.getElementById("skinSelect"),
  hairSelect: document.getElementById("hairSelect"),
  outfitSelect: document.getElementById("outfitSelect"),
  accessorySelect: document.getElementById("accessorySelect"),
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
const discoveryRespawnSeconds = 45;
const letterRespawnDelaySeconds = 35;
const maxVisibleDiscoveries = 8;
const minDiscoverySpacing = 145;
const missionItemSpacing = 1050;
const missionItemFirstDistance = 760;
const missionItemRevealDelay = 22;
const farFutureTime = 1000000000;
const playerAppearanceOptions = {
  skin: {
    warm: "#f0bd6c",
    light: "#f1cf9b",
    brown: "#b77746",
    dark: "#7a4d2b"
  },
  hair: {
    dark: "#22322c",
    curly: "#9c5638",
    blond: "#d8b66c",
    black: "#1d1c1a"
  },
  outfit: {
    berry: "#ce6f75",
    forest: "#4f8763",
    river: "#4f7f99",
    sun: "#d09a3d"
  }
};
let audio = null;
let lastTime = 0;
let running = false;
let messageTimer = 0;
let pendingVillagerHelp = null;
let pendingDiscoveryPopup = null;
let audioSceneKey = "";

const state = {
  player: { x: 380, y: 0, vx: 0, vy: 0, face: 1, rest: 0, action: "", actionUntil: 0 },
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
  villagerRelations: {},
  villagerLastMet: {},
  discoveredPlaces: [],
  visitedVillages: [],
  favoritePlaces: [],
  journalEvents: [],
  walkMemories: [],
  currentWalk: null,
  questLastProgressAt: 0,
  lastQuestHintAt: 0,
  openedSecrets: [],
  activeQuest: null,
  pendingQuestReward: null,
  nextLetterAt: 0,
  completedQuests: 0,
  rewards: [],
  worldDiscoveries: {},
  discoveryRespawns: {},
  achievements: [],
  companion: { unlocked: false, offered: false, species: "", name: "", description: "", personality: "", giver: "", metAt: "", walks: 0, finds: 0, nextHelpAt: 0 },
  startedAtLeastOnce: false,
  playerProfile: { id: "", nickname: "Voyageur", appearance: { skin: "warm", hair: "dark", outfit: "berry", accessory: "bag" } },
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

const companionSpecies = [
  { species: "Renard", name: "Roux", color: "#c86f3f", accent: "#f0bd6c", personality: "curieux et discret", description: "Il marche sans bruit et observe les sentiers avant de s'approcher." },
  { species: "Chat", name: "Miette", color: "#6a5b52", accent: "#f7f3df", personality: "calme et attentif", description: "Il aime les pauses longues et les coins de soleil." },
  { species: "Lapin", name: "Brin", color: "#d6bf78", accent: "#f7f3df", personality: "vif et doux", description: "Il trottine derriere toi et s'assoit des que le monde ralentit." },
  { species: "Herisson", name: "Bog", color: "#8b6840", accent: "#ead68d", personality: "prudent et loyal", description: "Il avance lentement, mais ne quitte jamais vraiment ta piste." },
  { species: "Chien", name: "Nino", color: "#9c6c42", accent: "#f0bd6c", personality: "joyeux et protecteur", description: "Il remue la queue quand une nouvelle route apparait." },
  { species: "Ecureuil", name: "Noisette", color: "#b76b45", accent: "#ead68d", personality: "malicieux et rapide", description: "Il bondit autour des pierres et repere les petits details." },
  { species: "Petit oiseau", name: "Plume", color: "#67b4c8", accent: "#f7f3df", personality: "leger et chanteur", description: "Il vole bas pres de toi et se pose quand tu t'arretes." }
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

const seasonalEventItems = [
  { id: "spring-bloom", label: "Fleur de printemps", rarity: "Rare", place: "Clairiere", season: "Printemps", text: "Elle n'apparait que quand les pluies douces reveillent les talus.", use: "Complete les evenements de printemps et attire les indices des habitants." },
  { id: "summer-shell", label: "Coquillage d'ete", rarity: "Rare", place: "Riviere", season: "Ete", text: "Sa surface garde une chaleur de soleil, meme au bord de l'eau.", use: "Ouvre des souvenirs d'ete et aide les missions de riviere." },
  { id: "autumn-maple", label: "Feuille d'automne", rarity: "Rare", place: "Foret", season: "Automne", text: "Une feuille rouge qui craque comme une petite lettre secrete.", use: "Revele les raccourcis caches sous les feuilles mortes." },
  { id: "winter-crystal", label: "Cristal d'hiver", rarity: "Legendaire", place: "Montagne", season: "Hiver", text: "Un cristal froid qui garde la lumiere sans jamais fondre.", use: "Debloque les passages de neige et compte pour les grandes collections." }
];

const generatedCatalogItems = extraItemNames.map((label, index) => {
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
});

const itemCatalog = discoveries.concat(generatedCatalogItems, seasonalEventItems);

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

function getDayPhase() {
  const cycle = 260;
  const progress = ((state.time % cycle) + cycle) % cycle / cycle;
  if (progress < 0.24) return { id: "morning", label: "Matin", night: 0, progress };
  if (progress < 0.58) return { id: "day", label: "Jour", night: 0, progress };
  if (progress < 0.72) return { id: "evening", label: "Soir", night: 0.28, progress };
  return { id: "night", label: "Nuit", night: 0.78, progress };
}

function isNightTime() {
  return getDayPhase().night > 0.5;
}

function getProceduralDiscoveries() {
  ensureVisibleDiscoveryZones();
  return limitVisibleDiscoveries(Object.values(state.worldDiscoveries));
}

function getVisibleWorldDiscoveries() {
  return getProceduralDiscoveries();
}

function ensureVisibleDiscoveryZones() {
  if (!isExpandedWorld()) {
    ensureDiscoveryZone("start", () => discoveries.map((item, index) => ({
      ...item,
      id: normalizeDiscoveryId(item.id),
      x: item.x,
      visualType: getItemVisualType(item),
      zoneKey: "start",
      createdAt: state.time + index * 0.001
    })));
    ensureMissionDiscoveryItems();
    return;
  }
  const relativeCamera = state.camera.x - world.firstRouteEnd;
  const start = Math.max(0, Math.floor((relativeCamera - 700) / world.chapterSize));
  const end = Math.floor((relativeCamera + window.innerWidth + 1100) / world.chapterSize);
  for (let chapterIndex = start; chapterIndex <= end; chapterIndex += 1) {
    ensureDiscoveryZone(`chapter-${chapterIndex}`, () => buildChapterDiscoveries(chapterIndex));
  }
  ensureMissionDiscoveryItems();
}

function ensureDiscoveryZone(zoneKey, builder) {
  const hasZone = Object.values(state.worldDiscoveries).some((item) => item.zoneKey === zoneKey);
  if (hasZone) return;
  builder().forEach((item) => {
    state.worldDiscoveries[item.id] = item;
  });
}

function buildChapterDiscoveries(chapterIndex) {
  const chapter = chapterIndex + 4;
  const items = [];
  const local = generatedCatalogItems[chapterIndex % generatedCatalogItems.length] || discoveries[chapterIndex % discoveries.length];
  const jitter = 160 + hashNumber(chapter * 3.1) * 520;
  items.push({
    id: makeId(local.id, chapter),
    x: world.firstRouteEnd + chapterIndex * world.chapterSize + jitter,
    label: local.label,
    rarity: local.rarity,
    place: local.place,
    use: local.use,
    text: local.text,
    visualType: getItemVisualType(local),
    zoneKey: `chapter-${chapterIndex}`,
    createdAt: state.time
  });
  const seasonItem = seasonalEventItems.find((entry) => entry.season === getSeason(chapter));
  if (seasonItem && chapterIndex % 4 === 2) {
    items.push({
      ...seasonItem,
      id: makeId(seasonItem.id, chapter),
      x: world.firstRouteEnd + chapterIndex * world.chapterSize + 1320 + hashNumber(chapter * 7.7) * 420,
      visualType: getItemVisualType(seasonItem),
      zoneKey: `chapter-${chapterIndex}`,
      createdAt: state.time + 0.01
    });
  }
  return items.concat(buildWeatherBonusDiscoveries(chapterIndex));
}

function ensureMissionDiscoveryItems() {
  if (!state.activeQuest || !state.activeQuest.itemId) return;
  const templateItem = getMissionCatalogItem(state.activeQuest.itemId);
  if (!templateItem) return;
  const slots = ensureActiveQuestMissionSlots();
  slots.forEach((slotX, slot) => {
    const id = makeId(templateItem.id, 9000 + state.completedQuests * 100 + slot);
    if (!state.worldDiscoveries[id]) {
      state.worldDiscoveries[id] = {
        ...templateItem,
        id,
        x: slotX,
        place: getPlaceType(slotX),
        visualType: state.activeQuest.itemId,
        missionItem: true,
        zoneKey: `mission-${state.activeQuest.id}`,
        hiddenUntil: slot === 0 ? 0 : farFutureTime,
        createdAt: state.time + slot * 0.001
      };
      saveGame();
    } else if (!state.worldDiscoveries[id].collected) {
      const canReveal = slot <= state.activeQuest.progress && state.time >= (state.activeQuest.nextMissionRevealAt || 0);
      if (slot === 0 || canReveal) state.worldDiscoveries[id].hiddenUntil = 0;
    }
  });
}

function ensureActiveQuestMissionSlots() {
  if (!state.activeQuest) return [];
  if (!Array.isArray(state.activeQuest.missionSlots) || state.activeQuest.missionSlots.length < state.activeQuest.target) {
    const baseX = Number.isFinite(state.activeQuest.spawnX) ? state.activeQuest.spawnX : state.player.x + missionItemFirstDistance;
    state.activeQuest.missionSlots = Array.from({ length: state.activeQuest.target }, (_, index) => {
      return Math.max(160, baseX + index * missionItemSpacing + hashNumber(baseX + index * 17) * 260);
    }).sort((a, b) => a - b);
    saveGame();
  }
  return state.activeQuest.missionSlots;
}

function ensureActiveQuestSpawnX() {
  if (!state.activeQuest) return state.player.x + 360;
  if (!Number.isFinite(state.activeQuest.spawnX)) {
    state.activeQuest.spawnX = state.player.x + 360;
    state.activeQuest.spawnPlace = getPlaceType(state.activeQuest.spawnX);
    saveGame();
  }
  if (!state.activeQuest.spawnPlace) state.activeQuest.spawnPlace = getPlaceType(state.activeQuest.spawnX);
  return state.activeQuest.spawnX;
}

function buildWeatherBonusDiscoveries(chapterIndex) {
  const weather = getWeatherForChapter();
  const bonusByWeather = {
    rain: ["mushroom", "stone"],
    wind: ["feather", "leaf"],
    clear: ["flower", "shell"],
    snow: ["cone", "star"],
    mist: ["mushroom", "paper"]
  };
  const ids = bonusByWeather[weather.id] || [];
  const chapterStart = isExpandedWorld()
    ? world.firstRouteEnd + Math.max(0, chapterIndex) * world.chapterSize
    : 0;
  return ids.map((id, index) => {
    const item = getMissionCatalogItem(id);
    const x = chapterStart + 880 + index * 520 + hashNumber(state.chapter * 13 + index) * 160;
    return {
      ...item,
      id: makeId(item.id, 7600 + state.chapter * 10 + index),
      x,
      place: getPlaceType(x),
      visualType: getItemVisualType(item),
      zoneKey: `chapter-${chapterIndex}`,
      createdAt: state.time + 0.02 + index * 0.001
    };
  });
}

function limitVisibleDiscoveries(items) {
  const cameraStart = state.camera.x - 140;
  const cameraEnd = state.camera.x + window.innerWidth + 180;
  const visible = items
    .filter((item) => !item.collected && (item.hiddenUntil === undefined || item.hiddenUntil <= state.time) && item.x >= cameraStart && item.x <= cameraEnd)
    .sort((a, b) => Number(Boolean(b.missionItem)) - Number(Boolean(a.missionItem)) || Math.abs(a.x - state.player.x) - Math.abs(b.x - state.player.x));
  const picked = [];
  visible.forEach((item) => {
    if (picked.length >= maxVisibleDiscoveries) return;
    if (picked.some((other) => Math.abs(other.x - item.x) < minDiscoverySpacing)) return;
    picked.push(item);
  });
  return picked.sort((a, b) => a.x - b.x);
}

function getProceduralSecretLocations() {
  if (!isExpandedWorld() || state.completedQuests < 2) return [];
  const relativeCamera = state.camera.x - world.firstRouteEnd;
  const start = Math.max(0, Math.floor((relativeCamera - 800) / world.chapterSize));
  const end = Math.floor((relativeCamera + window.innerWidth + 1200) / world.chapterSize);
  const names = ["Sentier oublie", "Jardin sous la pluie", "Porte des lucioles", "Belvedere de neige"];
  const items = [];
  for (let chapterIndex = start; chapterIndex <= end; chapterIndex += 1) {
    if (chapterIndex % 5 === 3) {
      items.push({
        id: makeId("secret", chapterIndex + 4),
        x: world.firstRouteEnd + chapterIndex * world.chapterSize + 1720,
        name: names[chapterIndex % names.length]
      });
    }
  }
  return items;
}

function getProceduralLetters() {
  if (state.activeQuest || state.pendingQuestReward || state.time < state.nextLetterAt) return [];
  if (!isExpandedWorld()) {
    return [{ id: "ancient-letter-start", x: 1240 }];
  }
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

function getCompanionGiver() {
  if (state.companion.offered || state.companion.unlocked) return null;
  const eligible = state.player.x > 2600 || state.completedQuests >= 2 || Object.keys(state.villagerRelations).length >= 3;
  if (!eligible) return null;
  const x = Math.max(2860, state.player.x + 520);
  return {
    role: "Gardien des compagnons",
    line: "Tu as beaucoup voyage seul. Je crois que ce petit compagnon serait heureux de continuer le chemin a tes cotes.",
    x,
    specialCompanionGiver: true
  };
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
  const phase = getDayPhase();
  const sky = blendHex(colors.sky, "#24324d", phase.night);
  const haze = blendHex(colors.haze, "#33405a", phase.night * 0.82);
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, sky);
  gradient.addColorStop(0.58, haze);
  gradient.addColorStop(1, blendHex("#9a8f61", "#3c453d", phase.night));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  if (phase.night > 0.35) {
    ctx.save();
    ctx.fillStyle = "rgba(247, 243, 223, 0.72)";
    for (let i = 0; i < 34; i += 1) {
      const x = (i * 137 + Math.floor(state.camera.x * 0.03)) % w;
      const y = 30 + (i * 53) % Math.floor(h * 0.38);
      ctx.globalAlpha = 0.35 + hashNumber(i) * 0.5;
      ctx.beginPath();
      ctx.arc(x, y, 1 + hashNumber(i + 9) * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = 0.7 * (1 - phase.night * 0.65);
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

  const companionGiver = getCompanionGiver();
  if (companionGiver) {
    drawVillager(companionGiver.x, companionGiver);
    if (Math.abs(state.player.x - companionGiver.x) < 90) drawPrompt(companionGiver.x, world.ground - 120, "E parler");
  }

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
    const lit = state.lanterns.includes(lantern.id) || isNightTime();
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

  getVisibleWorldDiscoveries().forEach((item, index) => {
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

  getProceduralSecretLocations().forEach((secret) => {
    drawSecretLocation(secret);
    if (Math.abs(state.player.x - secret.x) < 100) drawPrompt(secret.x, world.ground - 138, "E explorer");
  });

  drawRiver();
  drawCompanion();
  drawPlayer();
  ctx.restore();
}

function drawSecretLocation(secret) {
  const y = world.ground - 18;
  const opened = state.openedSecrets.includes(secret.id);
  ctx.save();
  ctx.translate(secret.x, y);
  const glow = ctx.createRadialGradient(0, -74, 8, 0, -74, opened ? 160 : 100);
  glow.addColorStop(0, opened ? "rgba(180, 239, 184, 0.36)" : "rgba(240, 189, 108, 0.28)");
  glow.addColorStop(1, "rgba(240, 189, 108, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, -74, opened ? 160 : 100, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = opened ? "#8ebf76" : "#8b6840";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(0, -46, 44, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = opened ? "rgba(142, 191, 118, 0.22)" : "rgba(20, 34, 33, 0.58)";
  roundedRect(-52, -52, 104, 72, 8);
  ctx.fill();
  ctx.fillStyle = "#f7f3df";
  ctx.font = "800 12px Nunito";
  ctx.textAlign = "center";
  ctx.fillText(secret.name, 0, -76);
  ctx.restore();
}

function drawCompanion() {
  if (!state.companion.unlocked) return;
  const p = state.player;
  const moving = Math.abs(p.vx) > 12;
  const sleeping = p.rest > 0.2;
  const x = p.x - p.face * 82 + Math.sin(state.time * 2.4) * (moving ? 7 : 2);
  const y = world.ground - 18 + (moving ? Math.sin(state.time * 8) * 3 : 0);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p.face, 1);
  drawCompanionAnimal(state.companion, moving, sleeping);
  ctx.restore();
}

function drawCompanionAnimal(companion, moving = false, sleeping = false) {
  const color = companion.color || "#c86f3f";
  const accent = companion.accent || "#f0bd6c";
  const species = companion.species || "Renard";
  const sit = !moving || sleeping;
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.beginPath();
  ctx.ellipse(0, 10, 25, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, sit ? -8 : -10, 24, sit ? 13 : 14, 0, 0, Math.PI * 2);
  ctx.fill();
  if (species === "Petit oiseau") {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(17, -17);
    ctx.lineTo(32, -13);
    ctx.lineTo(18, -9);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(20, sit ? -15 : -17, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.beginPath();
  if (species === "Lapin") {
    ctx.moveTo(13, -25);
    ctx.lineTo(15, -51);
    ctx.lineTo(22, -25);
    ctx.moveTo(23, -25);
    ctx.lineTo(30, -50);
    ctx.lineTo(32, -24);
  } else {
    ctx.moveTo(12, -26);
    ctx.lineTo(17, -43);
    ctx.lineTo(24, -25);
    ctx.moveTo(24, -25);
    ctx.lineTo(34, -40);
    ctx.lineTo(34, -21);
  }
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = species === "Herisson" ? 0 : 5;
  ctx.beginPath();
  ctx.moveTo(-20, -10);
  ctx.quadraticCurveTo(-44, species === "Ecureuil" ? -44 : -28, -56, -5);
  ctx.stroke();
  if (species === "Herisson") {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    for (let i = -16; i <= 12; i += 7) {
      ctx.beginPath();
      ctx.moveTo(i, -19);
      ctx.lineTo(i + 4, -31);
      ctx.stroke();
    }
  }
  ctx.fillStyle = "#24312e";
  ctx.beginPath();
  ctx.arc(25, sit ? -17 : -19, sleeping ? 1.6 : 2.4, 0, Math.PI * 2);
  ctx.fill();
  if (sleeping) {
    ctx.font = "800 10px Nunito";
    ctx.fillStyle = "rgba(247,243,223,0.72)";
    ctx.fillText("z", 36, -34);
  }
}

function getCompanionSymbol(companion = state.companion) {
  return (companion.species || "?").slice(0, 1).toUpperCase();
}

function getPlayerAppearance() {
  const appearance = normalizeAppearance(state.playerProfile.appearance);
  return {
    skin: playerAppearanceOptions.skin[appearance.skin] || playerAppearanceOptions.skin.warm,
    hair: playerAppearanceOptions.hair[appearance.hair] || playerAppearanceOptions.hair.dark,
    body: playerAppearanceOptions.outfit[appearance.outfit] || playerAppearanceOptions.outfit.berry,
    accessory: appearance.accessory
  };
}

function normalizeAppearance(appearance = {}) {
  return {
    skin: playerAppearanceOptions.skin[appearance.skin] ? appearance.skin : "warm",
    hair: playerAppearanceOptions.hair[appearance.hair] ? appearance.hair : "dark",
    outfit: playerAppearanceOptions.outfit[appearance.outfit] ? appearance.outfit : "berry",
    accessory: ["bag", "scarf", "hat", "lantern"].includes(appearance.accessory) ? appearance.accessory : "bag"
  };
}

function setPlayerAction(action, duration = 1.1) {
  state.player.action = action;
  state.player.actionUntil = state.time + duration;
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
  const baseId = getItemVisualType(item);
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
  } else if (baseId === "flower") {
    ctx.strokeStyle = "#6a7b39";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 24);
    ctx.quadraticCurveTo(-4, 2, 0, -11);
    ctx.stroke();
    ["#e8d49a", "#f0bd6c", "#ce6f75", "#f7f3df"].forEach((color, petal) => {
      const angle = petal * Math.PI / 2;
      drawEllipse(Math.cos(angle) * 10, -18 + Math.sin(angle) * 8, 8, 12, color);
    });
    drawEllipse(0, -18, 6, 6, "#8b6840");
  } else if (baseId === "paper") {
    ctx.save();
    ctx.rotate(-0.16);
    ctx.fillStyle = "#ead68d";
    roundedRect(-18, -24, 36, 45, 4);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#8b6840";
    ctx.lineWidth = 2;
    for (let line = -12; line <= 8; line += 10) {
      ctx.beginPath();
      ctx.moveTo(-10, line);
      ctx.lineTo(10, line - 2);
      ctx.stroke();
    }
    ctx.restore();
  } else if (baseId === "tool") {
    ctx.strokeStyle = "#d8bd7c";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-18, 18);
    ctx.lineTo(18, -18);
    ctx.stroke();
    drawEllipse(18, -18, 10, 10, "#f0bd6c");
    drawEllipse(-18, 18, 8, 8, "#67b4c8");
  } else {
    ctx.save();
    ctx.rotate(0.7);
    ctx.fillStyle = ["#f0bd6c", "#67b4c8", "#f7f3df", "#8ebf76", "#ce6f75"][index % 5];
    roundedRect(-12, -18, 24, 36, 7);
    ctx.fill();
    ctx.stroke();
    drawEllipse(0, -4, 5, 5, "rgba(20,34,33,0.22)");
    ctx.restore();
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
  const appearance = getPlayerAppearance();
  drawCharacter({
    x: p.x,
    y: p.y,
    face: p.face,
    velocity: p.vx,
    body: appearance.body,
    skin: appearance.skin,
    hair: appearance.hair,
    accessory: appearance.accessory,
    label: state.playerProfile.nickname,
    seated: p.rest > 0.2,
    action: p.actionUntil > state.time ? p.action : ""
  });
}

function drawCharacter({ x, y, face = 1, velocity = 0, body = "#ce6f75", skin = "#f0bd6c", hair = "#22322c", accessory = "bag", label = "", seated = false, action = "" }) {
  const speed = Math.min(1, Math.abs(velocity) / 190);
  const walk = seated ? 0 : Math.sin(state.time * (speed > 0.72 ? 13 : 9)) * speed;
  const idleBreath = seated ? 0 : Math.sin(state.time * 2.2) * (speed < 0.08 ? 1.6 : 0.3);
  const blink = Math.sin(state.time * 3.7) > 0.97;
  const baseY = y - 52 + (seated ? 10 : 0) + idleBreath;
  const reaching = action === "pickup" || action === "reward" || action === "rare";
  const waving = action === "talk" || action === "companion";
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
  if (accessory === "bag") {
    ctx.fillStyle = "#8b6840";
    roundedRect(-27, 3, 17, 26, 5);
    ctx.fill();
  }
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 22, 22, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.beginPath();
  ctx.ellipse(-7, 10, 8, 16, -0.2, 0, Math.PI * 2);
  ctx.fill();
  if (accessory === "scarf") {
    ctx.fillStyle = "#d8bd7c";
    roundedRect(-18, -1, 36, 8, 4);
    ctx.fill();
    roundedRect(12, 2, 8, 23, 4);
    ctx.fill();
  }
  if (accessory === "lantern") {
    ctx.strokeStyle = "#8b6840";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, 20);
    ctx.lineTo(-31, 34);
    ctx.stroke();
    drawEllipse(-34, 38, 7, 9, "rgba(255, 220, 122, 0.78)");
  }
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, -25, 23, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 239, 177, 0.22)";
  ctx.beginPath();
  ctx.ellipse(-8, -31, 8, 6, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#28312e";
  if (blink) {
    ctx.strokeStyle = "#28312e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, -27);
    ctx.lineTo(15, -27);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(11, -27, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.ellipse(-9, -38, 25, 14, -0.28, Math.PI * 0.92, Math.PI * 2.06);
  ctx.lineTo(-22, -25);
  ctx.quadraticCurveTo(-5, -31, 16, -42);
  ctx.fill();
  if (accessory === "hat") {
    ctx.fillStyle = "#6f4729";
    roundedRect(-22, -49, 39, 10, 5);
    ctx.fill();
    roundedRect(-14, -62, 24, 18, 6);
    ctx.fill();
  }
  ctx.strokeStyle = "#2d2730";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-16, 14);
  ctx.lineTo(reaching ? -25 : -22, reaching ? 33 : 24 + walk * 4);
  ctx.moveTo(16, 14);
  ctx.lineTo(waving ? 28 : reaching ? 8 : 22, waving ? -2 : reaching ? 34 : 24 - walk * 4);
  ctx.stroke();
  if (action === "rare") {
    ctx.fillStyle = "#f6cf36";
    ctx.font = "900 18px Nunito";
    ctx.fillText("!", 31, -40);
  }
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
  drawWeather();
}

function isModalOpen() {
  return Boolean(
    ui.discoveryDialog.open
    || ui.questDialog.open
    || ui.questCompleteDialog.open
    || ui.villagerDialog.open
    || ui.journalDialog.open
    || ui.optionsDialog.open
    || ui.infoDialog.open
    || ui.cinematic.classList.contains("is-visible")
  );
}

function clearMovementIntent() {
  pointer.active = false;
  pointer.worldX = state.player.x;
  joystick.active = false;
  joystick.x = 0;
  joystick.y = 0;
  ui.padKnob.style.transform = "translate(-50%, -50%)";
  state.player.vx = 0;
}

function update(dt) {
  state.time += dt;
  const p = state.player;
  if (isModalOpen()) {
    clearMovementIntent();
    p.y = world.ground;
    if (audio) updateAudio();
    updateMissionTracker();
    autosave();
    return;
  }
  let input = 0;
  if (keys.has("ArrowLeft") || keys.has("q") || keys.has("Q") || keys.has("a") || keys.has("A")) input -= 1;
  if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) input += 1;
  if (joystick.active) input += joystick.x;
  if (pointer.active && Math.abs(pointer.worldX - p.x) > 12) input += Math.sign(pointer.worldX - p.x) * 0.82;
  input = Math.max(-1, Math.min(1, input));

  const weather = getWeatherForChapter();
  const protectedFromWeather = getWeatherProtection(weather.id);
  const weatherSlowdown = !protectedFromWeather && (weather.id === "rain" || weather.id === "snow") ? 0.82 : 1;
  const maxSpeed = (p.rest > 0.15 ? 55 : 185) * weatherSlowdown;
  const target = input * maxSpeed;
  p.vx += (target - p.vx) * Math.min(1, dt * 5.5);
  p.x += p.vx * dt;
  p.x = Math.max(110, p.x);
  p.y = world.ground;
  if (Math.abs(p.vx) > 5) p.face = Math.sign(p.vx);
  p.rest = Math.max(0, p.rest - dt * 0.35);
  const previousWeather = state.weather;
  state.chapter = getChapter();
  state.weather = getWeatherForChapter().id;
  rememberPlace(getPlaceType());
  if (previousWeather !== state.weather) {
    announceWeather();
    advanceQuest("weather", 1);
  }
  updateCompanion(dt);
  updateQuestHint(dt);
  updateWorldDiscoveries();
  if (p.x >= world.firstRouteEnd && !state.cinematicPlayed) playRouteEndCinematic();

  const targetZoom = p.rest > 0 ? 1.08 : 1;
  state.camera.zoom += (targetZoom - state.camera.zoom) * Math.min(1, dt * 2.5);
  const targetCamera = p.x - window.innerWidth * 0.45;
  state.camera.x += (targetCamera - state.camera.x) * Math.min(1, dt * 2.8);
  state.camera.x = Math.max(0, state.camera.x);

  if (audio) updateAudio();
  updateMissionTracker();
  autosave();
}

function interact() {
  clearMovementIntent();
  const p = state.player;
  const companionGiver = getCompanionGiver();
  if (companionGiver && Math.abs(companionGiver.x - p.x) < 98) {
    offerCompanion(companionGiver);
    saveGame();
    return;
  }

  const villageNeed = getProceduralVillages()
    .map((village) => ({
      ...village.villager,
      x: village.x + 410,
      villageId: makeId("village", Math.round(village.x / world.chapterSize)),
      need: villagerNeeds[Math.round(village.x / world.chapterSize) % villagerNeeds.length]
    }))
    .find((entry) => Math.abs(entry.x - p.x) < 98);
  if (villageNeed) {
    advanceQuest("talkVillager", 1);
    if (state.pendingQuestReward) {
      saveGame();
      return;
    }
    openVillagerHelp(villageNeed);
    saveGame();
    return;
  }

  const letter = getProceduralLetters().find((entry) => Math.abs(entry.x - p.x) < 78);
  if (letter) {
    readAncientLetter(letter);
    saveGame();
    return;
  }

  const secret = getProceduralSecretLocations().find((entry) => Math.abs(entry.x - p.x) < 105);
  if (secret) {
    exploreSecretLocation(secret);
    saveGame();
    return;
  }

  const item = getVisibleWorldDiscoveries().find((entry) => !hasCollectedDiscovery(entry) && Math.abs(entry.x - p.x) < 78);
  if (item) {
    const showedPopup = collectDiscovery(item);
    if (!showedPopup) playSoftPing();
    saveGame();
    return;
  }

  const lantern = getProceduralLanterns().find((entry) => !state.lanterns.includes(entry.id) && Math.abs(entry.x - p.x) < 86);
  if (lantern) {
    state.lanterns.push(lantern.id);
    showMessage("La lanterne s'allume. Le sentier respire un peu plus chaud.");
    playSoftPing();
    saveGame();
    return;
  }

  const rest = getProceduralRests().find((entry) => Math.abs(entry.x - p.x) < 98);
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
  rememberJournalEvent(`${weather.label}: le paysage a change de rythme pendant la promenade.`);
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
  if (item.collected) return true;
  const respawnAt = state.discoveryRespawns[item.id] || state.discoveryRespawns[normalizeDiscoveryId(item.id)] || 0;
  return respawnAt > state.time;
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

function getMissionCatalogItem(itemId) {
  if (itemId === "flower") {
    return { id: "wild-flower", label: "Fleur sauvage", rarity: "Commun", place: "Clairiere", text: "Une fleur claire, facile a reconnaitre dans l'herbe.", use: "Compte pour les missions de fleurs et l'album des saisons." };
  }
  const found = itemCatalog.find((item) => item.id === itemId)
    || discoveries.find((item) => item.id === itemId);
  if (found) return found;
  return discoveries[0];
}

function getItemVisualType(itemOrId) {
  const item = typeof itemOrId === "string" ? getCatalogItem(itemOrId) || { id: itemOrId, label: itemOrId } : itemOrId || {};
  const explicit = item.visualType;
  if (explicit) return explicit;
  const baseId = baseDiscoveryId(item.id);
  const label = (item.label || "").toLowerCase();
  if (baseId === "leaf" || label.includes("feuille") || label.includes("foug")) return "leaf";
  if (baseId === "stone" || label.includes("pierre") || label.includes("galet") || label.includes("silex") || label.includes("rune")) return "stone";
  if (baseId === "feather" || label.includes("plume") || label.includes("aile")) return "feather";
  if (baseId === "shell" || label.includes("coquillage") || label.includes("coquille") || label.includes("coque")) return "shell";
  if (baseId === "cone" || label.includes("pomme de pin") || label.includes("noisette") || label.includes("graine")) return "cone";
  if (baseId === "mushroom" || label.includes("champignon")) return "mushroom";
  if (baseId === "star" || label.includes("etoile") || label.includes("soleil")) return "star";
  if (baseId.includes("flower") || baseId.includes("bloom") || label.includes("fleur") || label.includes("petale") || label.includes("rose")) return "flower";
  if (label.includes("carte") || label.includes("note") || label.includes("sceau")) return "paper";
  if (label.includes("clef") || label.includes("boussole") || label.includes("medaille") || label.includes("bague")) return "tool";
  return "charm";
}

function getItemConditionHint(itemOrId) {
  const type = getItemVisualType(itemOrId);
  const hints = {
    leaf: "Lieu : foret ou clairiere. Condition : visible par temps calme ou venteux.",
    stone: "Lieu : riviere, montagne ou vieux sentier. Condition : souvent apres la pluie.",
    feather: "Lieu : village ou foret. Condition : apparait plus souvent quand il y a du vent.",
    shell: "Lieu : riviere ou bord de l'eau. Condition : cherche pres des zones humides.",
    cone: "Lieu : foret. Condition : tres courant en automne et dans les zones boisees.",
    mushroom: "Lieu : sous-bois sombre ou humide. Condition : pluie, brume ou zones nocturnes.",
    star: "Lieu : montagne ou nuit. Condition : rare, apres un evenement lumineux.",
    flower: "Lieu : clairiere. Condition : printemps ou beau temps.",
    paper: "Lieu : village ou ancien chemin. Condition : pres des enveloppes et des habitants.",
    tool: "Lieu : village, ponts et lieux secrets. Condition : objet rare de progression.",
    charm: "Lieu : chemin d'exploration. Condition : peut apparaitre dans plusieurs zones."
  };
  return hints[type] || hints.charm;
}

function getItemSymbol(item) {
  const rarity = item.rarity || (getCatalogItem(item.id) || {}).rarity || "Commun";
  const baseId = getItemVisualType(item);
  if (baseId === "leaf") return "L";
  if (baseId === "mushroom") return "M";
  if (baseId === "star") return "*";
  if (baseId === "shell") return "C";
  if (baseId === "stone") return "P";
  if (baseId === "flower") return "F";
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

function getSeason(chapter = state.chapter) {
  const seasons = ["Printemps", "Ete", "Automne", "Hiver"];
  return seasons[Math.floor((chapter - 1) / 3) % seasons.length];
}

function isNightPlace() {
  return getBiome(state.player.x).name.toLowerCase().includes("nuit");
}

function getPlaceType(x = state.player.x) {
  const secret = getProceduralSecretLocations().find((entry) => state.openedSecrets.includes(entry.id) && Math.abs(x - entry.x) < 420);
  if (secret) return "Lieu secret";
  const nearVillage = getProceduralVillages().some((village) => Math.abs(x - (village.x + 170)) < 620);
  if (nearVillage) return "Village";
  const riverX = isExpandedWorld()
    ? Math.floor((x - world.firstRouteEnd) / 4200) * 4200 + world.firstRouteEnd + 3820
    : 3820;
  if (Math.abs(x - riverX) < 520) return "Riviere";
  if (getBiome(x).name.toLowerCase().includes("nuit") || state.chapter % 8 === 0) return "Montagne";
  return "Foret";
}

function rememberPlace(place) {
  if (!state.discoveredPlaces.includes(place)) {
    state.discoveredPlaces.push(place);
    rememberJournalEvent(`J'ai decouvert ${place.toLowerCase()} et ajoute ce lieu a ma carte.`);
  }
}

function rememberJournalEvent(text) {
  if (!text) return;
  const day = state.chapter || 1;
  const last = state.journalEvents[state.journalEvents.length - 1];
  if (last && last.day === day && last.text === text) return;
  state.journalEvents.push({ day, text, at: new Date().toISOString() });
  if (state.journalEvents.length > 80) state.journalEvents = state.journalEvents.slice(-80);
}

function updateAchievements() {
  const achievements = [
    { id: "leaves-100", ok: (state.inventory.leaf || 0) >= 100, label: "100 feuilles ramassees" },
    { id: "helpers-50", ok: state.helpedVillagers.length >= 50, label: "50 habitants aides" },
    { id: "discoveries-25", ok: Object.keys(state.inventory).length >= 25, label: "25 objets differents decouverts" },
    { id: "quests-10", ok: state.completedQuests >= 10, label: "10 missions terminees" },
    { id: "secrets-3", ok: state.openedSecrets.length >= 3, label: "3 lieux secrets explores" },
    { id: "seasonal-4", ok: seasonalEventItems.every((item) => state.inventory[item.id] > 0), label: "Toutes les saisons collectionnees" },
    { id: "friends-5", ok: Object.values(state.villagerRelations).some((count) => count >= 5), label: "Une grande amitie au village" }
  ];
  achievements.forEach((achievement) => {
    if (achievement.ok && !state.achievements.includes(achievement.id)) {
      state.achievements.push(achievement.id);
      showMessage(`Succes debloque: ${achievement.label}.`);
    }
  });
}

function updateCompanion(dt) {
  if (!state.companion.unlocked || state.time < state.companion.nextHelpAt) return;
  state.companion.nextHelpAt = state.time + 55 + hashNumber(state.time + state.player.x) * 45;
  if (state.activeQuest || state.pendingQuestReward) return;
  const common = itemCatalog.filter((item) => item.rarity === "Commun");
  const item = common[Math.floor(hashNumber(state.player.x + state.time) * common.length) % common.length];
  if (item) {
    collectDiscovery({ ...item, id: makeId(item.id, state.chapter + state.companion.finds + 80) }, true);
    state.companion.finds += 1;
    showMessage(`Ton compagnon a trouve ${item.label.toLowerCase()} pres du chemin.`);
    saveGame();
  }
}

function offerCompanion(giver) {
  if (state.companion.offered || state.companion.unlocked) return;
  const seed = Date.now() + state.player.x + state.completedQuests * 31 + Object.keys(state.villagerRelations).length * 17;
  const picked = companionSpecies[Math.floor(hashNumber(seed) * companionSpecies.length) % companionSpecies.length];
  state.companion = {
    unlocked: true,
    offered: true,
    species: picked.species,
    name: picked.name,
    color: picked.color,
    accent: picked.accent,
    description: picked.description,
    personality: picked.personality,
    giver: giver.role,
    metAt: new Date().toISOString(),
    walks: 0,
    finds: 0,
    nextHelpAt: state.time + 55
  };
  rememberJournalEvent(`${giver.role.toLowerCase()} m'a confie ${picked.name}, un ${picked.species.toLowerCase()}.`);
  openCompanionPopup();
  playSoftPing();
  saveGame();
}

function openCompanionPopup() {
  const companion = state.companion;
  setPlayerAction("companion", 2);
  ui.companionBody.innerHTML = `
    <div class="companion-portrait">${getCompanionSymbol(companion)}</div>
    <p><strong>Un animal a decide de rejoindre ton voyage.</strong></p>
    <p><strong>Espece :</strong> ${companion.species}</p>
    <p><strong>Nom :</strong> ${companion.name}</p>
    <p>${companion.description}</p>
    <p><strong>Personnalite :</strong> ${companion.personality}</p>
  `;
  ui.companionDialog.showModal();
}

function exploreSecretLocation(secret) {
  const firstOpen = !state.openedSecrets.includes(secret.id);
  if (firstOpen) {
    state.openedSecrets.push(secret.id);
    rememberPlace(secret.name);
    advanceQuest("secret", 1);
    const legendary = itemCatalog.find((item) => item.rarity === "Legendaire") || discoveries[discoveries.length - 1];
    collectDiscovery({ ...legendary, id: makeId(legendary.id, state.chapter + state.openedSecrets.length + 120), place: "Lieu secret" }, true);
    showMessage(`${secret.name} s'ouvre. Un objet legendaire rejoint ton album.`);
  } else {
    showMessage(`${secret.name} est deja ouvert. Le passage reste dans ton album.`);
  }
  updateAchievements();
  playSoftPing();
}

const questTemplates = [
  { title: "Collection de coquillages", description: "Ramasse 6 coquillages pendentifs d'exploration.", objective: "Ramasser 6 coquillages.", type: "collect:shell", itemId: "shell", target: 6, hint: "Indice : les coquillages apparaissent pres de la riviere. Ils sont repartis dans le monde et demandent un peu d'exploration." },
  { title: "Herbier nervure", description: "Ramasse 5 feuilles nervurees pour completer une page du carnet.", objective: "Ramasser 5 feuilles nervurees.", type: "collect:leaf", itemId: "leaf", target: 5, hint: "Indice : les feuilles nervurees apparaissent en foret et dans les clairieres. Cherche-les dans plusieurs zones." },
  { title: "Lueurs du sous-bois", description: "Trouve 3 champignons lumineux pres des passages humides.", objective: "Trouver 3 champignons lumineux.", type: "collect:mushroom", itemId: "mushroom", target: 3, hint: "Indice : les champignons lumineux poussent dans les zones sombres ou humides. Ils ne se trouvent pas tous au meme endroit." },
  { title: "Pierres anciennes", description: "Ramasse 8 pierres anciennes ou polies sur le chemin.", objective: "Ramasser 8 pierres anciennes.", type: "collect:stone", itemId: "stone", target: 8, hint: "Indice : les pierres anciennes se trouvent pres des rivieres, des montagnes et des vieux sentiers. Continue d'explorer pour les retrouver." },
  { title: "Fleurs sauvages", description: "Decouvre 4 fleurs sauvages pendant l'exploration.", objective: "Decouvrir 4 fleurs sauvages.", type: "collectFlower", itemId: "flower", target: 4, hint: "Indice : les fleurs sauvages aiment les clairieres et le printemps. Elles apparaissent naturellement sur la route." },
  { title: "Voix du village", description: "Rencontre 5 habitants et ecoute leurs histoires.", objective: "Rencontrer 5 habitants.", type: "talkVillager", target: 5, hint: "Indice : avance jusqu'aux villages et parle aux habitants quand l'invite apparait." },
  { title: "Chemins nouveaux", description: "Explore 2 nouveaux villages sur la route.", objective: "Explorer 2 nouveaux villages.", type: "village", target: 2, hint: "Indice : continue vers la droite. Chaque nouveau village visite fait avancer la mission." }
];

function makeQuest(seed = Math.floor(state.player.x + state.time * 1000)) {
  const template = questTemplates[Math.floor(hashNumber(seed) * questTemplates.length) % questTemplates.length];
  const spawnX = state.player.x + missionItemFirstDistance;
  const missionSlots = template.itemId
    ? Array.from({ length: template.target }, (_, index) => {
      const distance = missionItemFirstDistance + index * missionItemSpacing + hashNumber(seed + index * 7) * 260;
      return Math.max(160, state.player.x + distance);
    }).sort((a, b) => a - b)
    : [];
  return {
    id: `quest-${Date.now()}-${Math.floor(hashNumber(seed + 2) * 10000)}`,
    title: template.title,
    label: template.objective,
    description: template.description,
    objective: template.objective,
    hint: template.hint,
    itemId: template.itemId || "",
    spawnX,
    spawnPlace: getPlaceType(spawnX),
    missionSlots,
    nextMissionRevealAt: state.time,
    type: template.type,
    target: template.target,
    progress: 0,
    rewardCount: 2
  };
}

function readAncientLetter(letter) {
  if (state.activeQuest || state.pendingQuestReward) {
    showMessage("Tu as deja une mission en cours. Termine-la avant d'en commencer une nouvelle.");
    return;
  }
  state.activeQuest = makeQuest(letter.x);
  state.questLastProgressAt = state.time;
  state.lastQuestHintAt = state.time;
  state.nextLetterAt = Number.POSITIVE_INFINITY;
  openQuestPopup(state.activeQuest);
  playSoftPing();
  updateMissionTracker();
}

function advanceQuest(type, amount = 1) {
  if (!state.activeQuest || state.activeQuest.type !== type) return;
  state.activeQuest.progress = Math.min(state.activeQuest.target, state.activeQuest.progress + amount);
  state.questLastProgressAt = state.time;
  if (state.activeQuest.itemId) state.activeQuest.nextMissionRevealAt = state.time + missionItemRevealDelay;
  showMessage(`Mission: ${state.activeQuest.objective} ${state.activeQuest.progress} / ${state.activeQuest.target}`);
  updateMissionTracker();
  if (state.activeQuest.progress >= state.activeQuest.target) completeQuest();
}

function updateQuestHint() {
  if (!state.activeQuest || state.pendingQuestReward) return;
  if (state.time - state.questLastProgressAt < 32) return;
  if (state.time - state.lastQuestHintAt < 28) return;
  state.lastQuestHintAt = state.time;
  showMessageFor(getQuestSearchHint(state.activeQuest), 7200);
}

function updateWorldDiscoveries() {
  Object.values(state.worldDiscoveries).forEach((item) => {
    if (item.missionItem && (!state.activeQuest || item.zoneKey !== `mission-${state.activeQuest.id}`)) {
      delete state.worldDiscoveries[item.id];
      return;
    }
    if (item.collected && Number.isFinite(item.respawnAt) && state.time >= item.respawnAt) {
      item.collected = false;
      item.respawnAt = 0;
      delete state.discoveryRespawns[item.id];
    }
  });
}

function completeQuest() {
  const quest = state.activeQuest;
  state.activeQuest = null;
  const rewardItems = grantQuestReward();
  state.completedQuests += 1;
  noteWalkProgress("quest", quest.title || quest.label);
  rememberJournalEvent(`J'ai termine la mission "${quest.title || quest.label}" et recu deux objets.`);
  state.pendingQuestReward = {
    questTitle: quest.title || quest.label,
    rewardItems,
    completedAt: state.time
  };
  openQuestCompletePopup(state.pendingQuestReward);
  playSoftPing();
  updateMissionTracker();
  updateAchievements();
  saveGame();
}

function grantQuestReward() {
  const seed = Date.now() + state.player.x + state.completedQuests * 19;
  const pool = itemCatalog.filter((item) => item.id !== "star");
  const rewardItems = [];
  for (let index = 0; index < 2; index += 1) {
    const item = pool[Math.floor(hashNumber(seed + index * 11) * pool.length) % pool.length];
    const rewardItem = { ...item, id: makeId(item.id, state.chapter + state.completedQuests + index + 60) };
    rewardItems.push(rewardItem);
    collectDiscovery(rewardItem, true);
  }
  const label = rewardItems.map((item) => item.label).join(", ");
  state.rewards.push({ label: `2 objets aleatoires: ${label}`, items: rewardItems.map((item) => item.id), at: new Date().toISOString() });
  return rewardItems;
}

function openQuestPopup(quest) {
  ui.questDialogBody.innerHTML = `
    <p><strong>Mission :</strong> ${quest.title}</p>
    <p>${quest.description}</p>
    <p><strong>Objectif precis :</strong> ${quest.objective}</p>
    <p><strong>Progression :</strong> ${quest.progress} / ${quest.target}</p>
    <p><strong>Indice :</strong> ${getQuestHint(quest)}</p>
    <p><strong>Recompense :</strong> 2 objets aleatoires</p>
  `;
  ui.questDialog.showModal();
}

function openQuestCompletePopup(reward) {
  const rewardItems = reward.rewardItems || [];
  setPlayerAction("reward", 1.8);
  ui.questCompleteBody.innerHTML = `
    <p><strong>${reward.questTitle}</strong></p>
    <p>Recompense :</p>
    <ul class="mission-reward-list">
      ${rewardItems.map((item) => `<li>${item.label}</li>`).join("")}
    </ul>
  `;
  ui.questCompleteDialog.showModal();
}

function claimQuestReward() {
  if (!state.pendingQuestReward) return;
  state.pendingQuestReward = null;
  state.nextLetterAt = state.time + letterRespawnDelaySeconds;
  updateMissionTracker();
  saveGame();
  showMessage("Recompense validee. Une nouvelle enveloppe pourra apparaitre plus tard.");
}

function updateMissionTracker() {
  if (state.activeQuest) {
    ui.missionTracker.innerHTML = `
      <strong>Mission</strong>
      <span>${state.activeQuest.objective}</span>
      <span>${state.activeQuest.progress} / ${state.activeQuest.target}</span>
      <span>${getQuestHint(state.activeQuest)}</span>
    `;
    ui.missionTracker.classList.add("is-visible");
    return;
  }
  if (state.pendingQuestReward) {
    ui.missionTracker.innerHTML = `
      <strong>Mission terminee</strong>
      <span>Recompense a valider</span>
    `;
    ui.missionTracker.classList.add("is-visible");
    return;
  }
  ui.missionTracker.classList.remove("is-visible");
}

function normalizeQuest(quest) {
  if (!quest || typeof quest !== "object") return null;
  const matchingTemplate = questTemplates.find((template) => template.type === quest.type && template.target === quest.target);
  const title = quest.title || (matchingTemplate && matchingTemplate.title) || "Mission";
  const objective = quest.objective || quest.label || (matchingTemplate && matchingTemplate.objective) || "Objectif de mission";
  return {
    ...quest,
    title,
    label: objective,
    description: quest.description || (matchingTemplate && matchingTemplate.description) || objective,
    objective,
    hint: quest.hint || (matchingTemplate && matchingTemplate.hint) || "",
    itemId: quest.itemId || (matchingTemplate && matchingTemplate.itemId) || "",
    spawnX: Number.isFinite(quest.spawnX) ? quest.spawnX : state.player.x + 360,
    spawnPlace: quest.spawnPlace || getPlaceType(Number.isFinite(quest.spawnX) ? quest.spawnX : state.player.x + 360),
    missionSlots: Array.isArray(quest.missionSlots) ? quest.missionSlots : [],
    nextMissionRevealAt: Number.isFinite(quest.nextMissionRevealAt) ? quest.nextMissionRevealAt : state.time,
    progress: Number.isFinite(quest.progress) ? quest.progress : 0,
    target: Number.isFinite(quest.target) ? quest.target : 1,
    rewardCount: Number.isFinite(quest.rewardCount) ? quest.rewardCount : 2
  };
}

function getQuestHint(quest) {
  if (!quest) return "Aucune mission active pour le moment.";
  if (quest.hint) return quest.hint;
  if (quest.itemId) return getItemConditionHint(quest.itemId);
  if (quest.type === "talkVillager") return "Indice : cherche les villages et parle aux habitants.";
  if (quest.type === "village") return "Indice : continue la route jusqu'au prochain village.";
  return "Indice : avance doucement, le monde fera apparaitre ce dont tu as besoin.";
}

function getQuestSearchHint(quest) {
  if (!quest || !quest.itemId) return getQuestHint(quest);
  ensureMissionDiscoveryItems();
  const target = Object.values(state.worldDiscoveries)
    .filter((item) => item.missionItem && item.zoneKey === `mission-${quest.id}` && !item.collected)
    .sort((a, b) => Math.abs(a.x - state.player.x) - Math.abs(b.x - state.player.x))[0];
  if (!target) return getQuestHint(quest);
  const direction = target.x >= state.player.x ? "vers l'est" : "vers l'ouest";
  const distance = Math.abs(target.x - state.player.x);
  const type = getItemVisualType(target);
  const objectLines = {
    mushroom: "Tu as l'impression qu'un champignon pousse quelque part",
    shell: "Le bruit de l'eau semble cacher un coquillage",
    leaf: "Une feuille nervuree doit attendre sur le chemin",
    stone: "Une pierre ancienne semble reposer plus loin",
    flower: "Une fleur sauvage attire doucement ton regard"
  };
  const intro = objectLines[type] || "Quelque chose utile pour ta mission t'attend";
  const range = distance > 1200 ? "loin" : "pas tres loin";
  return `${intro} ${range}, ${direction}.`;
}

function isFlowerDiscovery(item) {
  const label = (item.label || "").toLowerCase();
  const id = baseDiscoveryId(item.id);
  return getItemVisualType(item) === "flower" || id.includes("flower") || id.includes("bloom") || label.includes("fleur");
}

function getQuestCollectTypes(item) {
  const baseId = baseDiscoveryId(item.id);
  const label = (item.label || "").toLowerCase();
  const visualType = getItemVisualType(item);
  const types = new Set([`collect:${baseId}`, `collect:${visualType}`]);
  if (label.includes("coquillage") || label.includes("coquille")) types.add("collect:shell");
  if (label.includes("feuille")) types.add("collect:leaf");
  if (label.includes("champignon")) types.add("collect:mushroom");
  if (label.includes("pierre") || label.includes("galet")) types.add("collect:stone");
  return Array.from(types);
}

function collectDiscovery(item, quiet = false) {
  const baseId = baseDiscoveryId(item.id);
  const firstTime = !hasCollectedBaseItem(baseId);
  if (!quiet) setPlayerAction((item.rarity === "Legendaire" || item.rarity === "Rare") ? "rare" : "pickup", 1.2);
  if (!quiet) {
    if (!item.missionItem) state.discoveryRespawns[item.id] = state.time + discoveryRespawnSeconds;
    if (state.worldDiscoveries[item.id]) {
      state.worldDiscoveries[item.id].collected = true;
      state.worldDiscoveries[item.id].respawnAt = item.missionItem ? Number.POSITIVE_INFINITY : state.time + discoveryRespawnSeconds;
    }
  }
  state.discoveries.push(item.id);
  state.inventory[baseId] = (state.inventory[baseId] || 0) + 1;
  if (firstTime) {
    state.discoveryDates[baseId] = new Date().toISOString();
    rememberJournalEvent(`J'ai trouve ${item.label.toLowerCase()} pour la premiere fois.`);
  }
  if (!quiet) noteWalkProgress("discovery", item.label.toLowerCase());
  advanceQuest("collectAny", 1);
  getQuestCollectTypes(item).forEach((type) => advanceQuest(type, 1));
  if (isFlowerDiscovery(item)) advanceQuest("collectFlower", 1);
  if (item.place === "Riviere") advanceQuest("collectRiver", 1);
  if (!quiet && state.pendingQuestReward) {
    updateAchievements();
    return true;
  }
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
  setPlayerAction("talk", 1.4);
  const alreadyHelped = state.helpedVillagers.includes(villager.villageId);
  const relationKey = villager.role;
  state.villagerRelations[relationKey] = (state.villagerRelations[relationKey] || 0) + 1;
  state.villagerLastMet[relationKey] = new Date().toISOString();
  noteWalkProgress("villager", villager.role.toLowerCase());
  rememberJournalEvent(`J'ai rencontre ${villager.role.toLowerCase()} pres du village.`);
  if (!state.visitedVillages.includes(villager.villageId)) {
    state.visitedVillages.push(villager.villageId);
    advanceQuest("village", 1);
    if (state.pendingQuestReward) {
      saveGame();
      return;
    }
  }
  const meetings = state.villagerRelations[relationKey];
  const relationLine = getVillagerRelationLine(villager, meetings);
  ui.villagerTitle.textContent = villager.role;
  ui.giveItemButton.disabled = alreadyHelped;
  ui.giveItemButton.style.opacity = alreadyHelped ? "0.55" : "1";
  if (alreadyHelped) {
    ui.villagerText.textContent = `${relationLine} Il te remercie encore. Le village se souvient de ton aide.`;
  } else {
    const requests = [
      "Il demande de l'aide pour retrouver un sentier disparu.",
      "Elle aimerait que quelqu'un ecoute une vieille legende jusqu'au bout.",
      "Il signale une zone ou la meteo change sans prevenir.",
      "Elle cherche un voyageur pour verifier que les lanternes brillent encore."
    ];
    ui.villagerText.textContent = `${relationLine} ${requests[Math.round(villager.x / 97) % requests.length]}`.trim();
  }
  pendingVillagerHelp = villager;
  updateAchievements();
  saveGame();
  ui.villagerDialog.showModal();
}

function getVillagerRelationLine(villager, meetings) {
  if (meetings >= 5) return `${villager.line} Il t'appelle par ton nom et partage un secret qu'il gardait pour les voyageurs patients.`;
  if (meetings >= 3) return `${villager.line} Il te reconnait aussitot et parle avec plus de confiance.`;
  if (meetings >= 2) return `${villager.line} Il sourit: vous vous etes deja croises sur le chemin.`;
  return villager.line;
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
  showMessage(`${pendingVillagerHelp.role} te remercie. Le monde devient un peu plus vivant.`);
  ui.villagerDialog.close();
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
  const uniqueFound = Object.keys(state.inventory).length;
  const knownVillagers = Object.keys(state.villagerRelations).length;
  const seasonalFound = seasonalEventItems.filter((item) => state.inventory[item.id] > 0).length;
  const currentItem = getLastFoundItem();
  const weather = getWeatherForChapter();
  const place = getPlaceType();
  const book = document.createElement("section");
  book.className = "journal-book";
  book.innerHTML = `
    <article class="journal-page journal-page-left">
      <p class="journal-kicker">Page 1</p>
      <h3>Mon voyage</h3>
      <div class="journey-stamps">
        <span>${getWeatherIcon(weather.id)} Jour ${state.chapter}</span>
        <span>${getSeasonIcon(getSeason())} ${getSeason()}</span>
        <span>${getWeatherIcon(weather.id)} ${weather.label}</span>
        <span>${getDayPhase().label}</span>
        <span>${getPlaceIcon(place)} ${place}</span>
        <span>Temps ${formatPlayTime()}</span>
      </div>
      <p class="journey-note">${getJourneySummary()}</p>
      <div class="journal-landscape ${getSeasonClass(getSeason())}">
        <span>${getPlaceIcon(place)}</span>
      </div>
    </article>
    <article class="journal-page journal-page-right">
      <p class="journal-kicker">Page 2</p>
      <h3>Souvenir du jour</h3>
      <div class="daily-sketch">
        <div class="journal-object-image large">${currentItem ? getItemSymbol(currentItem) : "?"}</div>
        <div>
          <strong>${currentItem ? currentItem.label : "Aucun objet trouve"}</strong>
          <p>${currentItem ? currentItem.text : "Le prochain tresor ramasse dessinera cette page."}</p>
        </div>
      </div>
      ${renderQuestCard()}
      <p class="last-meeting">${getLastVillagerLine()}</p>
    </article>
  `;
  ui.journalList.appendChild(book);

  appendJournalBlock("Inventaire", renderInventoryGallery(), "gallery-block");
  appendJournalBlock("Encyclopedie", renderEncyclopedia(), "gallery-block");
  appendJournalBlock("Habitants", renderVillagers(), "gallery-block");
  appendJournalBlock("Mon compagnon", renderCompanionJournal(), "companion-block");
  appendJournalBlock("Carte", renderMap(), "map-block");
  appendJournalBlock("Missions", renderQuestCard(true), "mission-block");
  appendJournalBlock("Succes", renderAchievements(), "gallery-block");
  appendJournalBlock("Album des saisons", renderSeasonAlbum(seasonalFound), "gallery-block");
  appendJournalBlock("Revue", renderJournalReview(), "review-block");
  appendJournalBlock("Souvenirs de promenade", renderWalkMemories(), "review-block");
  appendJournalBlock("Endroits preferes", renderFavoritePlaces(), "favorites-block");
  appendJournalBlock("Statistiques", `
    <div class="stat-grid">
      <span><strong>${Math.round(state.player.x / 100) / 10} km</strong>Parcours</span>
      <span><strong>${state.discoveries.length}</strong>Objets ramasses</span>
      <span><strong>${formatPlayTime()}</strong>Temps joue</span>
      <span><strong>${state.completedQuests}</strong>Missions terminees</span>
      <span><strong>${knownVillagers} / ${villagers.length}</strong>Habitants</span>
      <span><strong>${uniqueFound} / ${itemCatalog.length}</strong>Encyclopedie</span>
    </div>
  `, "stats-block");
}

function appendJournalBlock(title, html, className = "") {
  const section = document.createElement("article");
  section.className = `journal-item journal-section ${className}`.trim();
  section.innerHTML = `<h3>${title}</h3>${html}`;
  ui.journalList.appendChild(section);
}

function getLastFoundItem() {
  const lastId = state.discoveries[state.discoveries.length - 1];
  if (!lastId) return null;
  return getCatalogItem(lastId) || { id: lastId, label: lastId.replace(/-/g, " "), text: "Une trace retrouvee dans le carnet." };
}

function getInventoryItems() {
  return Object.entries(state.inventory)
    .map(([id, count]) => ({ item: getCatalogItem(id) || { id, label: id.replace(/-/g, " "), rarity: "Commun", place: "Chemin", text: "Objet note dans l'inventaire." }, count }))
    .sort((a, b) => b.count - a.count || a.item.label.localeCompare(b.item.label));
}

function renderInventoryGallery() {
  const items = getInventoryItems();
  if (!items.length) return `<p class="empty-note">Le sac attend sa premiere trouvaille.</p>`;
  return `<div class="inventory-gallery">${items.map(({ item, count }) => `
    <details class="inventory-card">
      <summary>
        <span class="journal-object-image">${getItemSymbol(item)}</span>
        <strong>${item.label}</strong>
        <span>x${count}</span>
        <small>${getRarityStars(item.rarity)}</small>
      </summary>
      <p>${item.text}</p>
      <p><strong>Utilite</strong> ${getItemUse(item.id)}</p>
      <p><strong>Ou la trouver</strong> ${item.place || "Chemin"}</p>
      <p><strong>Conditions d'apparition</strong> ${getItemConditionHint(item)}</p>
      <p><strong>Premiere decouverte</strong> ${formatDiscoveryDate(item.id)}</p>
      <p><strong>Nombre recolte</strong> ${count}</p>
    </details>
  `).join("")}</div>`;
}

function renderEncyclopedia() {
  const known = new Set(Object.keys(state.inventory));
  return `<div class="encyclopedia-grid">${itemCatalog.map((item) => {
    const discovered = known.has(item.id);
    return `
      <article class="encyclopedia-card ${discovered ? "is-known" : "is-unknown"}">
        <div class="journal-object-image">${discovered ? getItemSymbol(item) : "?"}</div>
        <strong>${discovered ? item.label : "Objet inconnu"}</strong>
    <span>${discovered ? `${item.place} - ${getRarityStars(item.rarity)}` : "Silhouette dans le brouillard"}</span>
        <small>${discovered ? getItemConditionHint(item) : "Conditions inconnues"}</small>
      </article>
    `;
  }).join("")}</div>`;
}

function renderVillagers() {
  return `<div class="villager-grid">${villagers.map((villager, index) => {
    const meetings = state.villagerRelations[villager.role] || 0;
    return `
      <article class="villager-card ${meetings ? "is-known" : "is-unknown"}">
        <div class="villager-portrait">${meetings ? getVillagerPortrait(index) : "?"}</div>
        <strong>${meetings ? villager.role : "Habitant inconnu"}</strong>
        <p>${meetings ? villager.line : "Sa fiche se remplira apres une rencontre."}</p>
        <span>Rencontres : ${meetings}</span>
        <span>Derniere rencontre : ${meetings ? formatShortDate(state.villagerLastMet[villager.role]) : "Jamais"}</span>
      </article>
    `;
  }).join("")}</div>`;
}

function renderCompanionJournal() {
  if (!state.companion.unlocked) {
    return `<article class="quest-card"><strong>Aucun compagnon</strong><p>Un habitant special pourra t'en confier un plus loin dans l'aventure.</p></article>`;
  }
  const companion = state.companion;
  return `
    <article class="companion-card">
      <div class="companion-portrait">${getCompanionSymbol(companion)}</div>
      <div>
        <strong>${companion.name}</strong>
        <p>Espece : ${companion.species}</p>
        <p>Rencontre : ${formatShortDate(companion.metAt)}</p>
        <p>Offert par : ${companion.giver || "Habitant special"}</p>
        <p>Personnalite : ${companion.personality}</p>
        <p>${companion.description}</p>
        <p>Promenades ensemble : ${companion.walks || (state.currentWalk ? 1 : 0)}</p>
      </div>
    </article>
  `;
}

function renderMap() {
  const places = ["Foret", "Riviere", "Village", "Montagne", "Clairiere", "Lieu secret"];
  return `<div class="travel-map">${places.map((place) => {
    const discovered = state.discoveredPlaces.some((known) => known === place || known.includes(place));
    return `<div class="map-zone ${discovered ? "is-known" : "is-fog"}"><span>${getPlaceIcon(place)}</span><strong>${place}</strong></div>`;
  }).join("")}</div>`;
}

function renderQuestCard(compact = false) {
  const quest = state.activeQuest;
  if (!quest && state.pendingQuestReward) {
    return `<article class="quest-card"><strong>Mission terminee</strong><p>Recompense en attente de validation.</p><p>2 / 2 objets prets</p></article>`;
  }
  if (!quest) return `<article class="quest-card"><strong>Aucune mission active</strong><p>Une enveloppe pourra apparaitre sur le chemin.</p></article>`;
  const percent = Math.round((quest.progress / quest.target) * 100);
  return `<article class="quest-card ${compact ? "is-wide" : ""}">
    <strong>${quest.title || quest.label}</strong>
    <p>${quest.objective}</p>
    <p>${getQuestHint(quest)}</p>
    <div class="progress-bar"><span style="width: ${percent}%"></span></div>
    <p>${quest.progress} / ${quest.target}</p>
    <p>Recompense : 2 objets aleatoires</p>
  </article>`;
}

function renderAchievements() {
  return `<div class="achievement-grid">${getAchievementList().map((achievement) => {
    const unlocked = state.achievements.includes(achievement.id);
    return `<article class="achievement-card ${unlocked ? "is-known" : "is-unknown"}">
      <strong>${unlocked ? achievement.label : "Succes cache"}</strong>
      <span>${unlocked ? "*****" : "-----"}</span>
      <p>${achievement.goal}</p>
    </article>`;
  }).join("")}</div>`;
}

function renderSeasonAlbum(seasonalFound) {
  return `<div class="season-grid">${["Printemps", "Ete", "Automne", "Hiver"].map((season) => {
    const item = seasonalEventItems.find((entry) => entry.season === season);
    const discovered = item && state.inventory[item.id] > 0;
    return `<article class="season-card ${getSeasonClass(season)} ${discovered ? "is-known" : "is-unknown"}">
      <div class="season-illustration">${getSeasonIcon(season)}</div>
      <strong>${season}</strong>
      <p>Decouvert : ${discovered ? "Oui" : "Non"}</p>
      <p>Objet exclusif : ${discovered ? item.label : "????"}</p>
      <p>Musique : ${discovered ? "Souvenir debloque" : "A decouvrir"}</p>
    </article>`;
  }).join("")}<p class="album-count">${seasonalFound} / ${seasonalEventItems.length} souvenirs saisonniers</p></div>`;
}

function renderJournalReview() {
  const events = state.journalEvents.length
    ? state.journalEvents.slice(-10).reverse()
    : [{ day: 1, text: "Aujourd'hui, j'ai commence mon voyage." }];
  return `<div class="review-list">${events.map((event) => `
    <article>
      <strong>Jour ${event.day}</strong>
      <p>${event.text}</p>
    </article>
  `).join("")}</div>`;
}

function renderWalkMemories() {
  const current = getCurrentWalkMemory();
  const memories = [current].concat(state.walkMemories.slice(-5).reverse()).filter(Boolean);
  return `<div class="review-list">${memories.map((memory, index) => `
    <article>
      <strong>${index === 0 ? "Promenade en cours" : `Promenade n°${memory.number}`}</strong>
      <p>Saison : ${memory.season} - Meteo : ${memory.weather} - Lieu : ${memory.place}</p>
      <p>Objets decouverts : ${memory.discoveries} - Habitants rencontres : ${memory.villagers} - Mission terminee : ${memory.questDone ? "Oui" : "Non"}</p>
      <p>${memory.summary}</p>
    </article>
  `).join("")}</div>`;
}

function initWalkMemory() {
  if (state.currentWalk) return;
  if (state.companion.unlocked) state.companion.walks = (state.companion.walks || 0) + 1;
  state.currentWalk = {
    number: state.walkMemories.length + 1,
    startedAt: state.time,
    season: getSeason(),
    weather: getWeatherForChapter().label,
    place: getPlaceType(),
    discoveries: 0,
    villagers: 0,
    questDone: false,
    bestMoment: "La route s'est ouverte doucement."
  };
}

function getEmptyCompanionState() {
  return { unlocked: false, offered: false, species: "", name: "", color: "", accent: "", description: "", personality: "", giver: "", metAt: "", walks: 0, finds: 0, nextHelpAt: 0 };
}

function normalizeCompanionState(raw) {
  if (!raw || typeof raw !== "object") return getEmptyCompanionState();
  if (raw.unlocked && !raw.species) return getEmptyCompanionState();
  return {
    ...getEmptyCompanionState(),
    ...raw,
    unlocked: Boolean(raw.unlocked),
    offered: Boolean(raw.offered || raw.unlocked),
    walks: Number.isFinite(raw.walks) ? raw.walks : 0,
    finds: Number.isFinite(raw.finds) ? raw.finds : 0,
    nextHelpAt: Number.isFinite(raw.nextHelpAt) ? raw.nextHelpAt : 0
  };
}

function noteWalkProgress(kind, detail = "") {
  initWalkMemory();
  if (kind === "discovery") {
    state.currentWalk.discoveries += 1;
    state.currentWalk.bestMoment = `J'ai trouve ${detail}.`;
  }
  if (kind === "villager") {
    state.currentWalk.villagers += 1;
    state.currentWalk.bestMoment = `Une rencontre avec ${detail} a marque la promenade.`;
  }
  if (kind === "quest") {
    state.currentWalk.questDone = true;
    state.currentWalk.bestMoment = `La mission "${detail}" s'est terminee.`;
  }
  state.currentWalk.weather = getWeatherForChapter().label;
  state.currentWalk.place = getPlaceType();
}

function getCurrentWalkMemory() {
  initWalkMemory();
  return {
    ...state.currentWalk,
    summary: `Aujourd'hui, j'ai explore ${state.currentWalk.place.toLowerCase()} sous ${state.currentWalk.weather.toLowerCase()}. ${state.currentWalk.bestMoment}`
  };
}

function renderFavoritePlaces() {
  const places = state.discoveredPlaces.length ? state.discoveredPlaces : ["Foret", "Riviere", "Village", "Clairiere"];
  return `<div class="favorite-grid">${places.map((place) => {
    const favorite = state.favoritePlaces.includes(place);
    return `<button class="favorite-place ${favorite ? "is-favorite" : ""}" type="button" data-place="${place}">
      <span>${favorite ? "*" : "+"}</span>${place}
    </button>`;
  }).join("")}</div>`;
}

function getAchievementList() {
  return [
    { id: "leaves-100", label: "Objet de premier ordre", goal: "Ramasser 100 feuilles" },
    { id: "helpers-50", label: "Main tendue", goal: "Aider 50 habitants" },
    { id: "discoveries-25", label: "Collection vivante", goal: "Decouvrir 25 objets differents" },
    { id: "quests-10", label: "Messager patient", goal: "Terminer 10 missions" },
    { id: "secrets-3", label: "Chemins caches", goal: "Explorer 3 lieux secrets" },
    { id: "seasonal-4", label: "Quatre saisons", goal: "Trouver tous les objets saisonniers" },
    { id: "friends-5", label: "Grande amitie", goal: "Rencontrer souvent le meme habitant" }
  ];
}

function getJourneySummary() {
  const discoveriesToday = state.discoveries.slice(-3).length;
  const knownVillagers = Object.keys(state.villagerRelations).length;
  const place = getPlaceType().toLowerCase();
  const weather = getWeatherForChapter().label.toLowerCase();
  return `Aujourd'hui, j'ai explore ${place} sous ${weather}. J'ai garde ${discoveriesToday} souvenir(s) recent(s), rencontre ${knownVillagers} habitant(s), et ${state.activeQuest ? "une mission guide encore mes pas" : "le chemin reste ouvert pour une nouvelle enveloppe"}.`;
}

function getLastVillagerLine() {
  const lastEntry = Object.entries(state.villagerLastMet)
    .filter(([, rawDate]) => rawDate && !Number.isNaN(new Date(rawDate).getTime()))
    .sort((a, b) => new Date(b[1]).getTime() - new Date(a[1]).getTime())[0];
  if (!lastEntry) return "Aucune rencontre recente.";
  const villager = villagers.find((entry) => entry.role === lastEntry[0]);
  if (!villager) return "Une rencontre a marque cette promenade.";
  const meetings = state.villagerRelations[villager.role] || 1;
  return `Derniere rencontre : ${villager.role}, croise ${meetings} fois. "${villager.line}"`;
}

function formatPlayTime() {
  const minutes = Math.max(1, Math.floor(state.time / 60));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}

function formatShortDate(raw) {
  if (!raw) return "Jamais";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Inconnue";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function getRarityStars(rarity = "Commun") {
  if (rarity === "Legendaire") return "***";
  if (rarity === "Rare") return "**";
  return "*";
}

function getSeasonIcon(season) {
  return { Printemps: "F", Ete: "S", Automne: "A", Hiver: "H" }[season] || "S";
}

function getWeatherIcon(weatherId) {
  return { clear: "C", rain: "R", mist: "B", wind: "V", snow: "N" }[weatherId] || "C";
}

function getPlaceIcon(place) {
  if (place.includes("Riviere")) return "~";
  if (place.includes("Village")) return "M";
  if (place.includes("Montagne")) return "^";
  if (place.includes("Clairiere")) return "O";
  if (place.includes("secret")) return "?";
  return "T";
}

function getSeasonClass(season) {
  return `season-${season.toLowerCase().replace(/[^\w]+/g, "-")}`;
}

function getVillagerPortrait(index) {
  return ["P", "D", "G", "E", "M", "R", "F", "A", "J", "V", "H", "B", "T", "S"][index % 14];
}

function toggleFavoritePlace(place) {
  if (!place) return;
  if (state.favoritePlaces.includes(place)) {
    state.favoritePlaces = state.favoritePlaces.filter((entry) => entry !== place);
  } else {
    state.favoritePlaces.push(place);
  }
  saveGame();
  buildJournal();
}

function startGame(reset = false) {
  savePlayerProfile();
  if (reset) resetGame();
  state.startedAtLeastOnce = true;
  ui.startScreen.classList.add("is-hidden");
  running = true;
  setupAudio();
  initWalkMemory();
  updateMissionTracker();
  if (state.pendingQuestReward) {
    openQuestCompletePopup(state.pendingQuestReward);
  } else {
    showMessage("Fleches, ZQSD ou clic pour marcher. Espace ou E pour interagir.");
  }
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
  state.villagerRelations = {};
  state.villagerLastMet = {};
  state.discoveredPlaces = [];
  state.visitedVillages = [];
  state.favoritePlaces = [];
  state.journalEvents = [];
  state.walkMemories = [];
  state.currentWalk = null;
  state.questLastProgressAt = 0;
  state.lastQuestHintAt = 0;
  state.openedSecrets = [];
  state.activeQuest = null;
  state.pendingQuestReward = null;
  state.nextLetterAt = 0;
  state.completedQuests = 0;
  state.rewards = [];
  state.worldDiscoveries = {};
  state.discoveryRespawns = {};
  state.achievements = [];
  state.companion = getEmptyCompanionState();
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
    villagerRelations: state.villagerRelations,
    villagerLastMet: state.villagerLastMet,
    discoveredPlaces: state.discoveredPlaces,
    visitedVillages: state.visitedVillages,
    favoritePlaces: state.favoritePlaces,
    journalEvents: state.journalEvents,
    walkMemories: state.walkMemories,
    currentWalk: state.currentWalk,
    questLastProgressAt: state.questLastProgressAt,
    lastQuestHintAt: state.lastQuestHintAt,
    openedSecrets: state.openedSecrets,
    activeQuest: state.activeQuest,
    pendingQuestReward: state.pendingQuestReward,
    nextLetterAt: state.nextLetterAt,
    completedQuests: state.completedQuests,
    rewards: state.rewards,
    worldDiscoveries: state.worldDiscoveries,
    discoveryRespawns: state.discoveryRespawns,
    achievements: state.achievements,
    companion: state.companion,
    startedAtLeastOnce: state.startedAtLeastOnce,
    cinematicPlayed: state.cinematicPlayed,
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
    state.villagerRelations = payload.villagerRelations && typeof payload.villagerRelations === "object" ? payload.villagerRelations : {};
    state.villagerLastMet = payload.villagerLastMet && typeof payload.villagerLastMet === "object" ? payload.villagerLastMet : {};
    state.discoveredPlaces = Array.isArray(payload.discoveredPlaces) ? payload.discoveredPlaces : [];
    state.visitedVillages = Array.isArray(payload.visitedVillages) ? payload.visitedVillages : [];
    state.favoritePlaces = Array.isArray(payload.favoritePlaces) ? payload.favoritePlaces : [];
    state.journalEvents = Array.isArray(payload.journalEvents) ? payload.journalEvents : [];
    state.walkMemories = Array.isArray(payload.walkMemories) ? payload.walkMemories : [];
    state.currentWalk = payload.currentWalk && typeof payload.currentWalk === "object" ? payload.currentWalk : null;
    state.questLastProgressAt = Number.isFinite(payload.questLastProgressAt) ? payload.questLastProgressAt : state.time;
    state.lastQuestHintAt = Number.isFinite(payload.lastQuestHintAt) ? payload.lastQuestHintAt : state.time;
    state.openedSecrets = Array.isArray(payload.openedSecrets) ? payload.openedSecrets : [];
    state.activeQuest = normalizeQuest(payload.activeQuest);
    state.pendingQuestReward = payload.pendingQuestReward && typeof payload.pendingQuestReward === "object" ? payload.pendingQuestReward : null;
    state.nextLetterAt = Number.isFinite(payload.nextLetterAt) ? payload.nextLetterAt : 0;
    state.completedQuests = Number.isFinite(payload.completedQuests) ? payload.completedQuests : 0;
    state.rewards = Array.isArray(payload.rewards) ? payload.rewards : [];
    state.worldDiscoveries = payload.worldDiscoveries && typeof payload.worldDiscoveries === "object" ? payload.worldDiscoveries : {};
    state.discoveryRespawns = payload.discoveryRespawns && typeof payload.discoveryRespawns === "object" ? payload.discoveryRespawns : {};
    state.achievements = Array.isArray(payload.achievements) ? payload.achievements : [];
    state.companion = normalizeCompanionState(payload.companion);
    state.startedAtLeastOnce = Boolean(payload.startedAtLeastOnce);
    state.cinematicPlayed = Boolean(payload.cinematicPlayed) && state.player.x >= world.firstRouteEnd;
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
      state.playerProfile.appearance = normalizeAppearance(payload.appearance);
    } catch {
      state.playerProfile.id = createUuid();
      state.playerProfile.appearance = normalizeAppearance();
    }
  } else {
    state.playerProfile.id = createUuid();
    state.playerProfile.appearance = normalizeAppearance();
  }
  ui.nicknameInput.value = state.playerProfile.nickname;
  syncAppearanceControls();
  ui.anonymousId.textContent = `Identifiant anonyme: ${state.playerProfile.id.slice(0, 8)}...`;
  savePlayerProfile();
}

function savePlayerProfile() {
  const nickname = ui.nicknameInput.value.trim().slice(0, 18) || "Voyageur";
  state.playerProfile.nickname = nickname;
  state.playerProfile.appearance = normalizeAppearance({
    skin: ui.skinSelect.value,
    hair: ui.hairSelect.value,
    outfit: ui.outfitSelect.value,
    accessory: ui.accessorySelect.value
  });
  localStorage.setItem(playerKey, JSON.stringify(state.playerProfile));
}

function syncAppearanceControls() {
  const appearance = normalizeAppearance(state.playerProfile.appearance);
  ui.skinSelect.value = appearance.skin;
  ui.hairSelect.value = appearance.hair;
  ui.outfitSelect.value = appearance.outfit;
  ui.accessorySelect.value = appearance.accessory;
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
[ui.skinSelect, ui.hairSelect, ui.outfitSelect, ui.accessorySelect].forEach((control) => {
  control.addEventListener("change", () => {
    savePlayerProfile();
    saveGame();
    setPlayerAction("reward", 0.8);
  });
});
ui.giveItemButton.addEventListener("click", givePendingItem);
ui.refuseHelpButton.addEventListener("click", refusePendingHelp);
ui.claimQuestRewardButton.addEventListener("click", claimQuestReward);
ui.welcomeCompanionButton.addEventListener("click", () => showMessage(`${state.companion.name} marche maintenant avec toi.`));
ui.missionTracker.addEventListener("click", () => {
  if (state.pendingQuestReward && !ui.questCompleteDialog.open) openQuestCompletePopup(state.pendingQuestReward);
});
ui.journalButton.addEventListener("click", () => {
  buildJournal();
  ui.journalDialog.showModal();
});
ui.journalList.addEventListener("click", (event) => {
  const favoriteButton = event.target.closest(".favorite-place");
  if (favoriteButton) toggleFavoritePlace(favoriteButton.dataset.place);
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
ui.continueButton.disabled = !hasSave;
ui.continueButton.style.opacity = hasSave ? "1" : "0.55";
updateMissionTracker();
resize();
draw();
requestAnimationFrame(loop);
