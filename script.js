const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  startScreen: document.getElementById("startScreen"),
  startButton: document.getElementById("startButton"),
  continueButton: document.getElementById("continueButton"),
  pauseButton: document.getElementById("pauseButton"),
  journalButton: document.getElementById("journalButton"),
  customizeButton: document.getElementById("customizeButton"),
  optionsButton: document.getElementById("optionsButton"),
  infoButton: document.getElementById("infoButton"),
  muteButton: document.getElementById("muteButton"),
  journalDialog: document.getElementById("journalDialog"),
  discoveryDialog: document.getElementById("discoveryDialog"),
  discoveryTitle: document.getElementById("discoveryTitle"),
  discoveryBody: document.getElementById("discoveryBody"),
  hideDiscoveryPopup: document.getElementById("hideDiscoveryPopup"),
  continueDiscoveryButton: document.getElementById("continueDiscoveryButton"),
  encyclopediaDetailDialog: document.getElementById("encyclopediaDetailDialog"),
  encyclopediaDetailTitle: document.getElementById("encyclopediaDetailTitle"),
  encyclopediaDetailBody: document.getElementById("encyclopediaDetailBody"),
  companionSelectDialog: document.getElementById("companionSelectDialog"),
  companionSelectGrid: document.getElementById("companionSelectGrid"),
  companionConfirmActions: document.getElementById("companionConfirmActions"),
  confirmCompanionChangeButton: document.getElementById("confirmCompanionChangeButton"),
  cancelCompanionChangeButton: document.getElementById("cancelCompanionChangeButton"),
  infoDialog: document.getElementById("infoDialog"),
  optionsDialog: document.getElementById("optionsDialog"),
  journalList: document.getElementById("journalList"),
  missionReminderButton: document.getElementById("missionReminderButton"),
  message: document.getElementById("message"),
  cinematic: document.getElementById("cinematic"),
  cinematicText: document.getElementById("cinematicText"),
  customizeDialog: document.getElementById("customizeDialog"),
  appearancePreview: document.getElementById("appearancePreview"),
  appearanceChoices: document.getElementById("appearanceChoices"),
  cancelAppearanceButton: document.getElementById("cancelAppearanceButton"),
  applyAppearanceButton: document.getElementById("applyAppearanceButton"),
  nicknameInput: document.getElementById("nicknameInput"),
  villagerDialog: document.getElementById("villagerDialog"),
  villagerTitle: document.getElementById("villagerTitle"),
  villagerText: document.getElementById("villagerText"),
  villagerChoices: document.getElementById("villagerChoices"),
  villagerActions: document.getElementById("villagerActions"),
  giveItemButton: document.getElementById("giveItemButton"),
  challengeButton: document.getElementById("challengeButton"),
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
  mobilePad: document.getElementById("mobilePad"),
  padKnob: document.getElementById("padKnob"),
  padJumpButton: document.getElementById("padJumpButton"),
  padModeButton: document.getElementById("padModeButton"),
  padCompanionButton: document.getElementById("padCompanionButton")
};

const saveKey = "bosquet-lent-save";
const optionsKey = "bosquet-lent-options";
const playerKey = "bosquet-lent-player";
const mainMusicFile = "jean-paul-v-aventures-chinoises-289659.mp3";
const musicLoopCrossfadeSeconds = 0.12;
const musicScheduleLookaheadSeconds = 4;
const world = { ground: 0, chapterSize: 2400, firstRouteEnd: 7200 };
const villageSpacing = 15000;
const trailMarkerSpacing = 3000;
const keys = new Set();
const pointer = { active: false, x: 0, y: 0, worldX: 0 };
let pointerGestureId = 0;
let lastPointerGestureId = 0;
const joystick = { active: false, id: null, x: 0, y: 0, mode: "walk", jumpArmed: true, lastZone: "walk" };
const weatherVisual = { rain: 0, targetRain: 0, rainMood: 0 };
const letterRespawnDelaySeconds = 35;
const playerWalkSpeed = 185;
const playerRunMultiplier = 1.42;
const discoveryRespawnMinSeconds = 160;
const discoveryRespawnMaxSeconds = 320;
const discoveryAverageWalkSeconds = { min: 20, max: 40 };
const maxVisibleDiscoveries = 2;
const minDiscoverySpacing = Math.round(playerWalkSpeed * 22);
const minDiscoveryVillagerDistance = 230;
const minDiscoveryDoorDistance = 240;
const minDiscoveryPlayerSpawnDistance = Math.round(playerWalkSpeed * 12);
const groundedDiscoveryLifetimeSeconds = 240;
const interactionRanges = { item: 78, letter: 78, secret: 105, villager: 98, companion: 98, lantern: 86, rest: 98 };

function openDialog(dialog) {
  if (!dialog) return;
  if (lastPointerGestureId > 0) dialog.dataset.interactionGesture = String(lastPointerGestureId);
  if (typeof dialog.showModal === "function") {
    if (!dialog.open) dialog.showModal();
    return;
  }
  dialog.setAttribute("open", "");
  dialog.classList.add("is-fallback-open");
}

function closeDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.close === "function") {
    dialog.close();
    return;
  }
  dialog.removeAttribute("open");
  dialog.classList.remove("is-fallback-open");
  dialog.dispatchEvent(new Event("close"));
}

function guardDynamicControls(element) {
  if (!element || lastPointerGestureId <= 0) return;
  element.dataset.interactionGesture = String(lastPointerGestureId);
}

const secretWorldOffset = 100000;
const secretWorldWidth = 10000;
const secretWorldEdgePadding = 120;
const secretWorldItemSpacing = 760;
const secretWorldDurationSeconds = 60;
const secretPortalIntervals = [15 * 60, 7 * 60, 20 * 60];
const secretPortalScheduleVersion = 1;
const friendlyChallengeDurationSeconds = 52;
const friendlyChallengeDistance = 6000;
const friendlyChallengeDistanceLabel = "6 km";
const friendlyChallengeCooldownSeconds = 120;
const friendlyChallengeRunnerStartDelay = 0.75;
const friendlyChallengeRunnerSpeed = playerWalkSpeed * 1.18;
const friendlyChallengeRunnerReturnSpeed = playerWalkSpeed * 0.82;
const hopDurationSeconds = 0.62;
const hopHeight = 42;
const portalInvokerItemId = "star";
const companionChangerItemId = "feather";
const secretWorlds = [
  {
    id: "firefly-garden",
    name: "Jardin des lucioles",
    entry: "Vous entrez dans le Jardin des lucioles.",
    sky: "#162a3a",
    haze: "#28545a",
    tree: "#1d3440",
    leaf: "#3f7f75",
    grass: "#4f8d72",
    ground: "#243b39",
    path: "#395a52",
    accent: "#d7f77c",
    wind: 0.38,
    night: 0.82,
    ambient: "mist",
    notes: [82.41, 123.47, 196],
    items: ["mushroom", "star", "feather", "mushroom"]
  },
  {
    id: "cloud-valley",
    name: "Vallee des nuages",
    entry: "Vous entrez dans la Vallee des nuages.",
    sky: "#e7f2ee",
    haze: "#b9d6d7",
    tree: "#9db8aa",
    leaf: "#e9efe2",
    grass: "#d9e5d8",
    ground: "#cad6c7",
    path: "#f0ead5",
    accent: "#ffffff",
    wind: 1.45,
    night: 0,
    ambient: "wind",
    notes: [146.83, 220, 329.63],
    items: ["feather", "leaf", "star", "feather"]
  },
  {
    id: "golden-forest",
    name: "Foret doree",
    entry: "Vous entrez dans la Foret doree.",
    sky: "#f4d28a",
    haze: "#d9a75d",
    tree: "#5a3f28",
    leaf: "#d99b35",
    grass: "#a67534",
    ground: "#6b4c27",
    path: "#d2a459",
    accent: "#f6cf36",
    wind: 0.72,
    night: 0,
    ambient: "birds",
    notes: [123.47, 185, 277.18],
    items: ["cone", "leaf", "stone", "mushroom"]
  },
  {
    id: "star-river",
    name: "Riviere des etoiles",
    entry: "Vous entrez dans la Riviere des etoiles.",
    sky: "#14213d",
    haze: "#23365a",
    tree: "#182c4a",
    leaf: "#315d88",
    grass: "#2f6b89",
    ground: "#102237",
    path: "#274762",
    accent: "#67b4c8",
    wind: 0.55,
    night: 0.68,
    ambient: "river",
    notes: [98, 146.83, 220],
    items: ["stone", "star", "shell", "stone"]
  }
];
const missionItemSpacing = 1050;
const missionItemFirstDistance = 1100;
const missionItemRevealDelayMin = 15;
const missionItemRevealDelayMax = 45;
const missionTrackerDisplaySeconds = 5.5;
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

const appearanceChoiceGroups = [
  {
    key: "skin",
    title: "Peau",
    choices: [
      { value: "warm", label: "Doree", color: "#f0bd6c" },
      { value: "light", label: "Claire", color: "#f1cf9b" },
      { value: "brown", label: "Ambree", color: "#b77746" },
      { value: "dark", label: "Foncee", color: "#7a4d2b" }
    ]
  },
  {
    key: "hair",
    title: "Cheveux",
    choices: [
      { value: "dark", label: "Bruns courts", icon: "BC" },
      { value: "curly", label: "Boucles rousses", icon: "BR" },
      { value: "blond", label: "Blonds", icon: "BL" },
      { value: "black", label: "Noirs", icon: "NO" }
    ]
  },
  {
    key: "outfit",
    title: "Tenue",
    choices: [
      { value: "berry", label: "Manteau baie", color: "#ce6f75" },
      { value: "forest", label: "Cape foret", color: "#4f8763" },
      { value: "river", label: "Veste riviere", color: "#4f7f99" },
      { value: "sun", label: "Pull soleil", color: "#d09a3d" }
    ]
  },
  {
    key: "accessory",
    title: "Accessoire",
    choices: [
      { value: "bag", label: "Sac", icon: "S" },
      { value: "scarf", label: "Echarpe", icon: "E" },
      { value: "hat", label: "Chapeau", icon: "C" },
      { value: "lantern", label: "Lanterne", icon: "L", locked: () => state.lanterns.length < 3, hint: "Debloquee apres 3 lanternes" }
    ]
  }
];

let audio = null;
let mainMusicArrayBufferPromise = null;
let lastTime = 0;
let lastAutosaveAt = -Infinity;
let running = false;
let startingGame = false;
let messageTimer = 0;
let pendingVillagerHelp = null;
let pendingDiscoveryPopup = null;
let missionTrackerNotice = null;
let completedMissionNotice = null;
let audioSceneKey = "";
let appearanceDraft = null;
let secretTransitionToken = 0;
let pendingVillagerConversation = null;
let pendingCompanionSpecies = "";
let itemUseInProgress = false;
const villagerBubbles = {};
const villagerProximity = {};
const villagerChallengeReturns = {};
const fallingTreeItems = [];
const shootingStars = [];
const discoveryBursts = [];
const collectingDiscoveryIds = new Set();

const state = {
  player: { x: 380, y: 0, vx: 0, vy: 0, face: 1, rest: 0, action: "", actionUntil: 0, runBlend: 0 },
  moveMode: "walk",
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
  villagerMemory: {},
  discoveredPlaces: [],
  visitedLandmarks: [],
  visitedVillages: [],
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
  discoveryVacancies: {},
  achievements: [],
  nextSecretAt: secretPortalIntervals[0],
  secretCycleIndex: 1,
  activeSecretPortal: null,
  friendlyChallenge: null,
  friendlyChallengeCooldowns: {},
  itemEffects: { scoutUntil: 0, scoutTargetId: "", strideUntil: 0, glowUntil: 0, compassUntil: 0, compassTargetX: 0, compassLabel: "" },
  equipment: { lanternOn: false },
  activeSecretWorld: null,
  lastSecretWorldId: "",
  lastSecretEdgeMessageAt: 0,
  recentDiscoveryNotice: null,
  companion: { unlocked: false, offered: false, species: "", name: "", description: "", personality: "", giver: "", metAt: "", walks: 0, finds: 0, nextHelpAt: 0, present: true, x: 300, y: 0, pace: 0, transitionUntil: 0 },
  companionGiverX: 0,
  microEvents: { nextTreeDropAt: 18, nextRollingAt: 42, nextShootingStarAt: 70 },
  startedAtLeastOnce: false,
  playerProfile: { id: "", nickname: "Voyageur", appearance: { skin: "warm", hair: "dark", outfit: "berry", accessory: "bag" } },
  options: { music: 0.38, nature: 0.46, effects: 0.5, muted: false, audioVersion: 7 }
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
  { role: "Pecheur", line: "La riviere est calme aujourd'hui. C'est une bonne heure pour marcher." },
  { role: "Vieille dame", line: "Le village est plus vivant quand on voit passer des visages connus." },
  { role: "Garde forestier", line: "Je garde un oeil sur les chemins. Ils sont tranquilles pour le moment." },
  { role: "Enfant", line: "J'ai fait trois fois le tour de la fontaine. Toi, tu vas plus loin que moi." },
  { role: "Musicien", line: "J'essaie de retenir l'air du village avant qu'il ne change." },
  { role: "Marchand", line: "Je ne tiens pas de boutique, mais je sais reconnaitre les gens presses." },
  { role: "Facteur", line: "Je fais une pause entre deux livraisons. Les chemins aussi ont besoin de souffler." },
  { role: "Apiculteur", line: "Les abeilles travaillent sans faire de bruit. J'aime bien les regarder faire." },
  { role: "Jardinier", line: "J'ai passe la matinee a remettre deux plantes a leur place. Elles n'etaient pas d'accord." },
  { role: "Voyageur", line: "Je reste ici quelques jours. C'est rare que je m'arrete assez longtemps pour connaitre un village." },
  { role: "Randonneur", line: "J'aime les chemins qui prennent leur temps avant de monter." },
  { role: "Artiste", line: "La lumiere est belle aujourd'hui. J'essaie de ne pas la laisser filer." },
  { role: "Botaniste", line: "Il y a toujours quelque chose a observer dans les herbes, meme pres des maisons." },
  { role: "Vieux sage", line: "Prends le temps de regarder autour de toi. Le village n'est jamais tout a fait le meme." }
];

const villageThemes = [
  { roof: "#547f91", wall: "#d2dcb9", trim: "#f2db8c", accent: "#78bdd0", motif: "river" },
  { roof: "#aa6d55", wall: "#ead4ac", trim: "#f0b96e", accent: "#d97d62", motif: "flower" },
  { roof: "#526d4a", wall: "#c9d1a2", trim: "#dfc86d", accent: "#8dad65", motif: "leaf" },
  { roof: "#756287", wall: "#d6c3dc", trim: "#f1d68a", accent: "#ad94cf", motif: "star" }
];

function getVillageTheme(village) {
  const index = Math.abs(Number(village.chapterIndex) || 0) / 2;
  return villageThemes[Math.floor(index) % villageThemes.length];
}

const villagerPersonalities = {
  Pecheur: {
    mood: "reserve",
    greetings: ["Bonjour. Je ne t'avais pas encore vu par ici.", "Ah... te revoila.", "Tu connais deja un peu mieux le coin."],
    spontaneous: ["La riviere est calme aujourd'hui.", "Ne cours pas trop pres du quai.", "Il commence a faire froid..."],
    running: ["Tu vas continuer a courir comme ca longtemps ?", "Doucement. Les poissons entendent les pas."],
    waiting: ["Tu veux me parler ou juste regarder l'horizon ?", "Je peux attendre. La riviere m'a appris."],
    weather: { rain: "Cette pluie n'en finit plus...", mist: "Avec cette brume, on voit moins loin sur l'eau.", wind: "Le vent ride toute la riviere.", snow: "Meme l'eau semble ralentir." }
  },
  "Vieille dame": {
    mood: "chaleureuse",
    greetings: ["Bonjour... je ne crois pas t'avoir deja vu ici.", "Ah, c'est toi !", "Je me demandais quand tu reviendrais."],
    spontaneous: ["Prends ton temps, le village respire mieux ainsi.", "Tu as l'air de bien connaitre les environs, maintenant.", "Tu es encore la ? C'est bien."],
    running: ["Tu vas user le chemin avec ces pas-la.", "Le village n'est pas en retard, tu sais."],
    waiting: ["Tu peux rester silencieux. Ce n'est pas vide.", "On dirait que tu as quelque chose sur le coeur."],
    weather: { rain: "La pluie lave les vieilles inquietudes.", mist: "Par brume, le village parait tout proche.", wind: "Ce vent annonce souvent une visite.", snow: "La neige rend tout le monde plus doux." }
  },
  "Garde forestier": {
    mood: "attentif",
    greetings: ["Halte douce. Je t'ai vu arriver.", "Tu connais mieux la route maintenant.", "Tu reviens avec de la poussiere de chemin."],
    spontaneous: ["Je surveille les passages pres du village.", "Les lanternes sont toutes en place.", "La foret est tranquille aujourd'hui."],
    running: ["Pas si vite pres des maisons.", "Garde ton souffle pour la foret."],
    waiting: ["Tu attends quelqu'un ?", "Si tu veux parler, je suis la."],
    weather: { rain: "Sous la pluie, les traces disparaissent vite.", mist: "Brume basse. Reste pres des lumieres.", wind: "Le vent casse les vieilles branches.", snow: "La neige garde les empreintes." }
  },
  Enfant: {
    mood: "energique",
    greetings: ["Oh ! Tu es revenu !", "Je t'avais presque vu arriver !", "Tu connais deja le village, maintenant ?"],
    spontaneous: ["Tu as trouve quelque chose ?", "Moi aussi je peux courir vite.", "Tu es encore la ? Haha."],
    running: ["Attends-moi !", "Tu fais la course avec le vent ?"],
    waiting: ["Pourquoi tu restes immobile ?", "Tu joues a devenir une statue ?"],
    weather: { rain: "La pluie fait des tambours sur les toits !", mist: "On dirait que le village a disparu.", wind: "Le vent pousse mes mots partout.", snow: "La neige donne envie de sauter." }
  },
  Musicien: {
    mood: "reveur",
    greetings: ["Tiens... te revoila.", "Je reconnais ton rythme.", "La route t'a ramene jusqu'ici."],
    spontaneous: ["Le village est calme aujourd'hui.", "Marche doucement, ca sonne mieux.", "J'essaie un nouvel air."],
    running: ["Trop vite, tu perds le tempo.", "La route n'est pas une batterie."],
    waiting: ["Tu ecoutes aussi ?", "Je peux jouer plus doucement si tu preferes."],
    weather: { rain: "La pluie joue en trio avec les toits.", mist: "La brume etouffe les notes graves.", wind: "Le vent improvise encore.", snow: "La neige coupe le son du monde." }
  },
  Marchand: {
    mood: "drole",
    greetings: ["Client sans boutique, te revoila.", "Je ne vends toujours rien, mais j'observe.", "Ah, mon meilleur fournisseur d'histoires."],
    spontaneous: ["Une histoire contre un sourire ?", "Tout a un prix, sauf les bons silences.", "Je collectionne les retours."],
    running: ["Tu fuis une facture imaginaire ?", "A cette vitesse, meme mes histoires perdent leur etiquette."],
    waiting: ["Tu negocies avec ton ombre ?", "Si tu restes la, je vais devoir t'inventorier."],
    weather: { rain: "La pluie ruine les etalages inexistants.", mist: "La brume cache mes meilleures grimaces.", wind: "Le vent emporte mes meilleures excuses.", snow: "La neige vend du calme sans demander." }
  },
  Facteur: {
    mood: "curieux",
    greetings: ["Te revoila entre deux adresses.", "Bonjour. Tu arrives au bon moment.", "La route t'a ramene jusqu'ici."],
    spontaneous: ["Je trie le courrier avant que le vent s'en mele.", "Les messages marchent plus loin que nous.", "J'espere que tu as passe une bonne journee."],
    running: ["Si tu vas si vite, les nouvelles arrivent en retard.", "Attends, meme les lettres respirent."],
    waiting: ["Tu attends du courrier ?", "Je termine cette pile et je suis a toi."],
    weather: { rain: "Les lettres n'aiment pas cette pluie.", mist: "Par brume, je relis les adresses deux fois.", wind: "Le vent distribue tout sans permission.", snow: "La neige retarde les nouvelles." }
  }
};

const defaultVillagerPersonality = {
  mood: "calme",
  greetings: ["Bonjour, voyageur.", "Ah, c'est toi.", "Je me demandais quand tu reviendrais."],
  spontaneous: ["Le village est calme aujourd'hui.", "On finit par reconnaitre les pas.", "Tu vas rester un moment ?"],
  running: ["Doucement pres du village.", "Le chemin ne partira pas."],
  waiting: ["Tu peux parler quand tu veux.", "Je vois que tu hesites."],
  weather: { rain: "Cette pluie n'en finit plus...", mist: "La brume rend tout plus proche.", wind: "Le vent a change.", snow: "Il commence a faire froid..." }
};

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
  { itemId: "leaf", itemLabel: "Feuille nervuree", amount: 3, need: "recoudre une carte dechiree par le vent" },
  { itemId: "stone", itemLabel: "Pierre polie", amount: 3, need: "caler la porte d'une maison qui tremble" },
  { itemId: "feather", itemLabel: "Plume claire", amount: 2, need: "terminer une lettre qui ne voulait pas partir" },
  { itemId: "moss", itemLabel: "Statue moussue", amount: 1, need: "se souvenir du nom d'une vieille place" },
  { itemId: "shell", itemLabel: "Coquille de riviere", amount: 2, need: "reparer le seau du vieux puits" },
  { itemId: "cone", itemLabel: "Pomme de pin bleue", amount: 3, need: "rallumer un four trop froid" },
  { itemId: "mushroom", itemLabel: "Champignon lueur", amount: 2, need: "guider un enfant dans la nuit" },
  { itemId: "star", itemLabel: "Etoile tombee", amount: 1, need: "retrouver le chemin du matin" }
];

const discoveries = [
  { id: "leaf", x: 860, label: "Feuille nervuree", rarity: "Rare", place: "Foret", text: "Une feuille rare, brillante comme du papier dore.", use: "Peut etre utilisee pour reperer une trouvaille proche." },
  { id: "stone", x: 1420, label: "Pierre polie", rarity: "Commun", place: "Riviere", text: "Elle tient dans la paume et garde une fraicheur de ruisseau.", use: "Materiau de collection que certains habitants peuvent demander." },
  { id: "feather", x: 2140, label: "Plume claire", rarity: "Rare", place: "Foret", text: "Un oiseau l'a laissee tomber sans se presser.", use: "Permet de choisir ou de changer de compagnon." },
  { id: "moss", x: 3020, label: "Statue moussue", rarity: "Rare", place: "Village", text: "Un visage ancien sourit sous les fougeres.", use: "Objet rare de collection et de mission." },
  { id: "shell", x: 3910, label: "Coquille de riviere", rarity: "Rare", place: "Riviere", text: "Minuscule spirale trouvee au bord de l'eau.", use: "Objet de collection que les habitants peuvent demander." },
  { id: "cone", x: 4740, label: "Pomme de pin bleue", rarity: "Commun", place: "Foret", text: "Sa couleur change legerement quand on la tourne.", use: "Peut etre consommee pour donner un leger elan temporaire." },
  { id: "mushroom", x: 5660, label: "Champignon lumineux", rarity: "Rare", place: "Riviere", text: "Il emet une lumiere calme, presque musicale.", use: "Peut etre consomme pour creer une lueur temporaire." },
  { id: "star", x: 6520, label: "Etoile tombee", rarity: "Legendaire", place: "Montagne", text: "Posee dans l'herbe comme un souvenir du ciel.", use: "Peut ouvrir un portail vers un monde temporaire." }
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

const microEventCatalogItems = [
  { id: "tree-micro-1", label: "Feuille particuliere", rarity: "Commun", place: "Foret", text: "Une feuille tombee au bon moment, plus brillante que les autres.", use: "Garde la trace des arbres qui repondent au passage du joueur.", visualType: "leaf" },
  { id: "tree-micro-2", label: "Graine ronde", rarity: "Commun", place: "Foret", text: "Une graine lisse qui rebondit doucement avant de s'immobiliser.", use: "Complete les petites trouvailles venues des arbres.", visualType: "cone" },
  { id: "tree-micro-3", label: "Petit fruit doux", rarity: "Commun", place: "Village", text: "Un fruit discret tombe d'une branche basse et parfume le chemin.", use: "Rappelle les micro-evenements des villages calmes.", visualType: "flower" },
  { id: "tree-micro-4", label: "Brindille claire", rarity: "Rare", place: "Foret", text: "Une brindille pale, presque polie par le vent.", use: "Sert aux souvenirs d'exploration lente.", visualType: "leaf" },
  { id: "rolling-micro-1", label: "Gland poli", rarity: "Commun", place: "Foret", text: "Il a roule assez loin pour meriter d'etre rattrape.", use: "Marque les petites poursuites calmes du chemin.", visualType: "cone" },
  { id: "rolling-micro-2", label: "Noisette roulante", rarity: "Commun", place: "Village", text: "Une noisette vive qui finit toujours par ralentir.", use: "Complete les objets mobiles de l'encyclopedie.", visualType: "cone" },
  { id: "rolling-micro-3", label: "Galet leger", rarity: "Commun", place: "Riviere", text: "Un galet qui roule moins vite que les pas presses.", use: "Lie la course douce aux trouvailles du sol.", visualType: "stone" },
  { id: "rolling-micro-4", label: "Graine de chemin", rarity: "Rare", place: "Clairiere", text: "Elle roule comme si elle connaissait deja la pente.", use: "Une trouvaille rare des micro-evenements.", visualType: "cone" }
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
      ? "Objet legendaire de collection ou de mission."
      : rarity === "Rare"
        ? "Objet rare de collection ou de mission."
        : "Objet de collection qui peut etre demande dans une mission."
  };
});

const itemCatalog = discoveries.concat(generatedCatalogItems, seasonalEventItems, microEventCatalogItems);

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

function pickLine(lines, seed = state.time) {
  if (!Array.isArray(lines) || !lines.length) return "";
  return lines[Math.floor(hashNumber(seed) * lines.length) % lines.length];
}

function getVillagerPersonality(villager) {
  return villagerPersonalities[villager.role] || defaultVillagerPersonality;
}

function getVillageIdFromX(x) {
  return makeId("village", Math.round(x / world.chapterSize));
}

function getVillagerKey(villager) {
  return villager.villageId || `${villager.role}-${Math.round((villager.x || 0) / world.chapterSize)}`;
}

function normalizeVillagerMemory(raw = {}) {
  return {
    visits: Number.isFinite(raw.visits) ? raw.visits : 0,
    relation: Number.isFinite(raw.relation) ? raw.relation : 0,
    helpCount: Number.isFinite(raw.helpCount) ? raw.helpCount : 0,
    quickTalks: Number.isFinite(raw.quickTalks) ? raw.quickTalks : 0,
    choices: raw.choices && typeof raw.choices === "object" ? raw.choices : {},
    gifts: Array.isArray(raw.gifts) ? raw.gifts : [],
    dialogueHistory: Array.isArray(raw.dialogueHistory) ? raw.dialogueHistory.filter((id) => typeof id === "string").slice(-6) : [],
    lastConversationAt: Number.isFinite(raw.lastConversationAt) ? raw.lastConversationAt : -Infinity,
    lastSeenAt: Number.isFinite(raw.lastSeenAt) ? raw.lastSeenAt : -Infinity,
    lastTalkAt: Number.isFinite(raw.lastTalkAt) ? raw.lastTalkAt : -Infinity,
    lastBubbleAt: Number.isFinite(raw.lastBubbleAt) ? raw.lastBubbleAt : -Infinity,
    nextBubbleAt: Number.isFinite(raw.nextBubbleAt) ? raw.nextBubbleAt : 0,
    lastWeather: typeof raw.lastWeather === "string" ? raw.lastWeather : "",
    noticedDiscoveryId: typeof raw.noticedDiscoveryId === "string" ? raw.noticedDiscoveryId : "",
    completedQuestNoticed: Number.isFinite(raw.completedQuestNoticed) ? raw.completedQuestNoticed : 0
  };
}

function getVillagerMemory(villager) {
  const key = getVillagerKey(villager);
  state.villagerMemory[key] = normalizeVillagerMemory(state.villagerMemory[key]);
  return state.villagerMemory[key];
}

function rememberVillagerChoice(villager, choiceId) {
  const memory = getVillagerMemory(villager);
  memory.choices[choiceId] = (memory.choices[choiceId] || 0) + 1;
}

function rememberVillagerConversation(villager, conversationId) {
  if (!conversationId) return;
  const memory = getVillagerMemory(villager);
  memory.dialogueHistory = [...memory.dialogueHistory.filter((id) => id !== conversationId), conversationId].slice(-6);
  memory.lastConversationAt = state.time;
}

function getResidentForVillage(village) {
  const chapterIndex = Number.isFinite(village.chapterIndex)
    ? village.chapterIndex
    : Math.round((village.x - world.firstRouteEnd - 520) / world.chapterSize);
  const villageId = getVillageIdFromX(village.x);
  const villager = village.villager || villagers[chapterIndex % villagers.length];
  const homeX = village.x + 410;
  const challengeRunner = getChallengeRunnerForVillage(villageId);
  return {
    ...villager,
    x: Number.isFinite(challengeRunner?.x) ? challengeRunner.x : homeX,
    homeX,
    raceActor: challengeRunner || null,
    villageId,
    villageName: village.name,
    need: villagerNeeds[Math.round(village.x / world.chapterSize) % villagerNeeds.length],
    personality: getVillagerPersonality(villager)
  };
}

function getChallengeRunnerForVillage(villageId) {
  const activeRunner = state.friendlyChallenge?.villageId === villageId ? state.friendlyChallenge.runner : null;
  return activeRunner || villagerChallengeReturns[villageId] || null;
}

function getVisibleVillageResidents() {
  return getProceduralVillages().map(getResidentForVillage);
}

function showVillagerBubble(villager, text, options = {}) {
  if (!text || isModalOpen()) return false;
  const key = getVillagerKey(villager);
  const memory = getVillagerMemory(villager);
  if (!options.force && state.time < (memory.nextBubbleAt || 0)) return false;
  const duration = options.duration || 3.8;
  villagerBubbles[key] = {
    text,
    startedAt: state.time,
    endsAt: state.time + duration,
    duration
  };
  memory.lastBubbleAt = state.time;
  memory.nextBubbleAt = state.time + (options.cooldown || 16 + hashNumber(state.time + villager.x) * 18);
  return true;
}

function getContextualBubbleLine(villager, reason = "idle") {
  const personality = getVillagerPersonality(villager);
  const memory = getVillagerMemory(villager);
  const seed = state.time + villager.x + memory.visits * 13;
  if (reason === "arrival") {
    if (memory.visits <= 0) return pickLine(personality.greetings, seed);
    if (state.time - memory.lastSeenAt > 90) return "Je me demandais quand tu reviendrais.";
    return memory.visits >= 3 ? "Ah, c'est toi !" : pickLine(personality.greetings, seed);
  }
  if (reason === "running") return pickLine(personality.running, seed);
  if (reason === "waiting") return pickLine(personality.waiting, seed);
  if (reason === "quest") return "Tu as tenu parole. Merci pour ton aide.";
  if (reason === "discovery" && state.recentDiscoveryNotice?.label) return `Tu as trouve ${state.recentDiscoveryNotice.label.toLowerCase()} ?`;
  if (reason === "night") return "Il se fait tard. Le village est plus calme a cette heure-ci.";
  if (reason === "day") return "Le jour revient doucement sur le village.";
  if (personality.weather && personality.weather[state.weather] && reason === "weather") return personality.weather[state.weather];
  if (!state.activeQuest && !state.pendingQuestReward && state.time >= state.nextLetterAt && hashNumber(seed) > 0.72) return "J'aurais peut-etre quelque chose a te demander...";
  return pickLine(personality.spontaneous, seed);
}

function wrapCanvasText(text, maxWidth) {
  const words = String(text).split(" ");
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function drawVillagerBubble(villager) {
  const bubble = villagerBubbles[getVillagerKey(villager)];
  if (!bubble) return;
  if (state.time >= bubble.endsAt) {
    delete villagerBubbles[getVillagerKey(villager)];
    return;
  }
  const progress = (state.time - bubble.startedAt) / bubble.duration;
  const fadeIn = Math.min(1, progress / 0.18);
  const fadeOut = Math.min(1, (bubble.endsAt - state.time) / 0.45);
  const alpha = Math.max(0, Math.min(fadeIn, fadeOut));
  const y = world.ground - 158 - Math.sin(Math.min(1, progress) * Math.PI) * 5;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = "800 12px Nunito";
  ctx.textAlign = "center";
  const maxWidth = Math.min(176, Math.max(118, window.innerWidth * 0.42));
  const lines = wrapCanvasText(bubble.text, maxWidth - 22);
  const width = Math.min(maxWidth, Math.max(72, ...lines.map((line) => ctx.measureText(line).width + 24)));
  const height = 22 + lines.length * 15;
  roundedRect(villager.x - width / 2, y - height, width, height, 8);
  ctx.fillStyle = "rgba(247, 243, 223, 0.94)";
  ctx.fill();
  ctx.strokeStyle = "rgba(20, 34, 33, 0.18)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(villager.x - 8, y);
  ctx.lineTo(villager.x + 7, y);
  ctx.lineTo(villager.x - 2, y + 9);
  ctx.closePath();
  ctx.fillStyle = "rgba(247, 243, 223, 0.94)";
  ctx.fill();
  ctx.fillStyle = "#20312f";
  lines.forEach((line, index) => ctx.fillText(line, villager.x, y - height + 18 + index * 15));
  ctx.restore();
}

function updateVillagerAwareness(dt, input = 0) {
  if (!running || isModalOpen()) return;
  const seenKeys = new Set();
  getVisibleVillageResidents().forEach((villager) => {
    const key = getVillagerKey(villager);
    seenKeys.add(key);
    const memory = getVillagerMemory(villager);
    const proximity = villagerProximity[key] || {
      near: false,
      nearSince: 0,
      idleSince: state.time,
      lastRunReactionAt: -Infinity,
      lastWaitReactionAt: -Infinity,
      lastDayNight: isNightTime() ? "night" : "day",
      hopCount: 0,
      hopWindowStartedAt: 0
    };
    const dist = Math.abs(state.player.x - villager.x);
    const near = dist < 330;
    const close = dist < 145;
    const veryClose = dist < 105;
    if (near && !proximity.near) {
      proximity.near = true;
      proximity.nearSince = state.time;
      proximity.idleSince = state.time;
      if (Math.random() < 0.58) showVillagerBubble(villager, getContextualBubbleLine(villager, "arrival"), { cooldown: 18 });
    }
    if (!near && proximity.near) {
      proximity.near = false;
      memory.lastSeenAt = state.time;
    }
    if (near) {
      memory.lastSeenAt = state.time;
      if (Math.abs(state.player.vx) > 145 && close && state.time - proximity.lastRunReactionAt > 18 && Math.random() < dt * 0.55) {
        proximity.lastRunReactionAt = state.time;
        showVillagerBubble(villager, getContextualBubbleLine(villager, "running"), { cooldown: 14 });
      }
      if (Math.abs(state.player.vx) < 4 && Math.abs(input) < 0.15 && veryClose) {
        if (state.time - proximity.idleSince > 8.5 && state.time - proximity.lastWaitReactionAt > 28 && Math.random() < dt * 0.35) {
          proximity.lastWaitReactionAt = state.time;
          showVillagerBubble(villager, getContextualBubbleLine(villager, "waiting"), { cooldown: 18 });
        }
      } else {
        proximity.idleSince = state.time;
      }
      if (state.recentDiscoveryNotice && memory.noticedDiscoveryId !== state.recentDiscoveryNotice.id && state.time - state.recentDiscoveryNotice.at < 45 && close && Math.random() < dt * 0.24) {
        memory.noticedDiscoveryId = state.recentDiscoveryNotice.id;
        memory.relation += 0.2;
        showVillagerBubble(villager, getContextualBubbleLine(villager, "discovery"), { cooldown: 20 });
      }
      if (memory.completedQuestNoticed < state.completedQuests && state.pendingQuestReward && close && Math.random() < dt * 0.3) {
        memory.completedQuestNoticed = state.completedQuests;
        memory.relation += 0.35;
        showVillagerBubble(villager, getContextualBubbleLine(villager, "quest"), { cooldown: 24, force: true });
      }
      if (memory.lastWeather && memory.lastWeather !== state.weather && close && Math.random() < 0.45) {
        showVillagerBubble(villager, getContextualBubbleLine(villager, "weather"), { cooldown: 20 });
      }
      memory.lastWeather = state.weather;
      const dayNight = isNightTime() ? "night" : "day";
      if (proximity.lastDayNight !== dayNight && close && Math.random() < 0.35) {
        proximity.lastDayNight = dayNight;
        showVillagerBubble(villager, getContextualBubbleLine(villager, dayNight), { cooldown: 22 });
      }
      if (state.time >= (memory.nextBubbleAt || 0) && Math.random() < dt * 0.055) {
        showVillagerBubble(villager, getContextualBubbleLine(villager), { cooldown: 20 + hashNumber(state.time + villager.x) * 28 });
      }
    }
    villagerProximity[key] = proximity;
  });
  Object.keys(villagerProximity).forEach((key) => {
    if (!seenKeys.has(key)) delete villagerProximity[key];
  });
}

function triggerPlayerHop() {
  if (!running || isModalOpen()) return;
  state.player.action = "hop";
  state.player.actionUntil = state.time + hopDurationSeconds;
  getVisibleVillageResidents().forEach((villager) => {
    const dist = Math.abs(state.player.x - villager.x);
    if (dist > 170) return;
    const key = getVillagerKey(villager);
    const proximity = villagerProximity[key] || { near: true, nearSince: state.time, idleSince: state.time, lastRunReactionAt: -Infinity, lastWaitReactionAt: -Infinity, hopCount: 0, hopWindowStartedAt: state.time };
    if (state.time - (proximity.hopWindowStartedAt || 0) > 4) {
      proximity.hopWindowStartedAt = state.time;
      proximity.hopCount = 0;
    }
    proximity.hopCount += 1;
    if (proximity.hopCount >= 3) {
      proximity.hopCount = 0;
      showVillagerBubble(villager, "Tu essaies de reveiller les cailloux ?", { cooldown: 18, force: true });
      getVillagerMemory(villager).relation += 0.1;
    }
    villagerProximity[key] = proximity;
  });
}

function isExpandedWorld(x = state.player.x) {
  return state.cinematicPlayed;
}

function getChapter(x = state.player.x) {
  if (isInSecretWorld() || x >= secretWorldOffset) return Number.isFinite(state.activeSecretWorld?.returnChapter) ? state.activeSecretWorld.returnChapter : state.chapter;
  if (x < world.firstRouteEnd) return Math.max(1, Math.floor(x / world.chapterSize) + 1);
  return Math.max(4, Math.floor((x - world.firstRouteEnd) / world.chapterSize) + 4);
}

function getWeatherForChapter(chapter = state.chapter) {
  if (isInSecretWorld()) return weatherTypes.find((weather) => weather.id === "mist") || weatherTypes[0];
  if (!isExpandedWorld()) return weatherTypes[0];
  const index = ((chapter - 4) % weatherSchedule.length + weatherSchedule.length) % weatherSchedule.length;
  return weatherTypes.find((weather) => weather.id === weatherSchedule[index]) || weatherTypes[0];
}

function isInSecretWorld() {
  return Boolean(state.activeSecretWorld);
}

function getSecretWorldConfig(id = state.activeSecretWorld?.worldId) {
  return secretWorlds.find((worldConfig) => worldConfig.id === id) || secretWorlds[0];
}

function getSecretPortalDelay(index = state.secretCycleIndex) {
  return secretPortalIntervals[index % secretPortalIntervals.length];
}

function scheduleNextSecretPortal() {
  state.nextSecretAt = state.time + getSecretPortalDelay();
  state.secretCycleIndex = (state.secretCycleIndex + 1) % secretPortalIntervals.length;
}

function createSecretPortal(source = "natural") {
  if (state.activeSecretPortal || isInSecretWorld()) return;
  const direction = state.player.face || 1;
  const x = clampToPlayableWorldX(state.player.x + direction * 460);
  state.activeSecretPortal = {
    id: makeId("portal", Math.floor(state.time * 10)),
    x,
    name: "Portail",
    createdAt: state.time,
    source
  };
  playSoftPing();
}

function updateSecretPortal() {
  if (!running || isInSecretWorld() || state.activeSecretPortal) return;
  if (state.time >= state.nextSecretAt) createSecretPortal("natural");
}

function pickSecretWorldConfig() {
  const choices = secretWorlds.filter((worldConfig) => worldConfig.id !== state.lastSecretWorldId);
  const pool = choices.length ? choices : secretWorlds;
  const index = Math.floor(hashNumber(state.time + state.player.x + state.openedSecrets.length * 31 + Date.now() * 0.001) * pool.length) % pool.length;
  return pool[index];
}

function getSecretWorldBounds() {
  return { start: secretWorldOffset, end: secretWorldOffset + secretWorldWidth };
}

function clampToPlayableWorldX(x) {
  if (isInSecretWorld()) {
    const bounds = getSecretWorldBounds();
    return Math.max(bounds.start + secretWorldEdgePadding, Math.min(bounds.end - secretWorldEdgePadding, x));
  }
  return Math.max(110, x);
}

function isPushingSecretWorldEdge(input = 0) {
  if (!isInSecretWorld() || Math.abs(input) <= 0.2) return false;
  const bounds = getSecretWorldBounds();
  const leftEdge = bounds.start + secretWorldEdgePadding + 1;
  const rightEdge = bounds.end - secretWorldEdgePadding - 1;
  return (input < -0.2 && state.player.x <= leftEdge) || (input > 0.2 && state.player.x >= rightEdge);
}

function getDiscoveryRespawnDelay() {
  return discoveryRespawnMinSeconds + Math.random() * (discoveryRespawnMaxSeconds - discoveryRespawnMinSeconds);
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
  if (isInSecretWorld()) {
    ensureSecretWorldDiscoveries();
    return limitVisibleDiscoveries(Object.values(state.worldDiscoveries).filter((item) => item.zoneKey === state.activeSecretWorld.zoneKey));
  }
  ensureVisibleDiscoveryZones();
  return limitVisibleDiscoveries(Object.values(state.worldDiscoveries));
}

function getVisibleWorldDiscoveries() {
  return getProceduralDiscoveries();
}

function ensureVisibleDiscoveryZones() {
  if (!isExpandedWorld()) {
    ensureDiscoveryZone("start", buildStartDiscoveries);
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
  builder().forEach((item, index) => {
    const placed = placeDiscoverySafely(item, index);
    storeWorldDiscovery(placed);
  });
}

function storeWorldDiscovery(item) {
  if (!item || typeof item.id !== "string") return null;
  const existing = state.worldDiscoveries[item.id];
  if (existing && !existing.collected) return existing;
  if (!item.missionItem && !item.grounded && !item.rolling) {
    const crowded = Object.values(state.worldDiscoveries).some((other) => (
      !other.collected && Math.abs(other.x - item.x) < minDiscoverySpacing
    ));
    if (crowded) {
      item = placeDiscoverySafely(item);
      if (Object.values(state.worldDiscoveries).some((other) => !other.collected && Math.abs(other.x - item.x) < minDiscoverySpacing)) return null;
    }
  }
  const baseId = baseDiscoveryId(item.id);
  const duplicate = Object.values(state.worldDiscoveries).find((candidate) => (
    candidate && !candidate.collected
    && baseDiscoveryId(candidate.id) === baseId
    && Math.abs((candidate.x || 0) - (item.x || 0)) < 56
  ));
  if (duplicate) return duplicate;
  state.worldDiscoveries[item.id] = item;
  return item;
}

function normalizeWorldDiscoveries(rawDiscoveries) {
  const cleaned = {};
  const visible = [];
  Object.values(rawDiscoveries || {}).forEach((item) => {
    if (!item || typeof item !== "object" || typeof item.id !== "string" || !Number.isFinite(item.x)) return;
    const duplicate = !item.collected && visible.find((candidate) => (
      baseDiscoveryId(candidate.id) === baseDiscoveryId(item.id)
      && Math.abs(candidate.x - item.x) < 56
    ));
    if (duplicate) return;
    cleaned[item.id] = item;
    if (!item.collected) visible.push(item);
  });
  return cleaned;
}

function placeDiscoverySafely(item, index = 0) {
  const placed = { ...item };
  placed.visualType = getItemVisualType(placed);
  placed.x = placeXClearOfInteractions(placed.x, {
    salt: hashNumber((placed.id || "item").length + index * 19),
    sourceItem: placed
  });
  placed.place = placed.place || getPlaceType(placed.x);
  decorateDiscoveryPlacement(placed, index);
  return placed;
}

function decorateDiscoveryPlacement(item, index = 0) {
  const seed = hashNumber((item.id || item.label || "discovery").length * 17 + Math.floor(item.x) + index * 29);
  if (item.missionItem || item.grounded || item.rolling) {
    item.groundOffset = 0;
    item.discoverySpot = "path";
    return item;
  }
  if (seed > 0.78) {
    item.groundOffset = -18 - hashNumber(item.x + 9) * 10;
    item.discoverySpot = "behind-grass";
  } else if (seed > 0.54) {
    item.groundOffset = 8 + hashNumber(item.x + 13) * 14;
    item.discoverySpot = "path-edge";
  } else if (seed < 0.16) {
    item.groundOffset = -30 - hashNumber(item.x + 21) * 14;
    item.discoverySpot = "small-jump";
  } else {
    item.groundOffset = 0;
    item.discoverySpot = "visible";
  }
  return item;
}

function buildStartDiscoveries() {
  const targets = [
    { base: discoveries.find((item) => item.id === "leaf"), x: 1560 },
    { base: discoveries.find((item) => item.id === "cone"), x: 6120 }
  ];
  return targets.filter((entry) => entry.base).map((entry, index) => ({
    ...entry.base,
    id: normalizeDiscoveryId(entry.base.id),
    x: entry.x,
    visualType: getItemVisualType(entry.base),
    zoneKey: "start",
    createdAt: state.time + index * 0.001
  }));
}

function placeXClearOfInteractions(x, options = {}) {
  const original = Number.isFinite(x) ? x : state.player.x + minDiscoveryPlayerSpawnDistance;
  let candidate = original;
  const salt = Number.isFinite(options.salt) ? options.salt : 0;
  const sourceItem = options.sourceItem || null;
  const blockers = getInteractionObstacleXs(sourceItem).concat({ x: state.player.x, distance: minDiscoveryPlayerSpawnDistance });
  const blocking = (value) => getRiverCrossings(value, value)
    .map((bridge) => ({ x: bridge.x, distance: 265 }))
    .concat(blockers)
    .filter((blocker) => Math.abs(value - blocker.x) < blocker.distance)
    .sort((a, b) => Math.abs(value - a.x) - Math.abs(value - b.x))[0] || null;

  for (let attempt = 0; attempt < 18; attempt += 1) {
    const blocker = blocking(candidate);
    if (!blocker) return clampToPlayableWorldX(candidate);
    const side = candidate === blocker.x ? state.player.face || 1 : Math.sign(candidate - blocker.x);
    candidate = blocker.x + side * (blocker.distance + 42 + attempt * 18 + hashNumber(candidate + salt + attempt) * 28);
    candidate = clampToPlayableWorldX(candidate);
  }

  for (let step = 1; step <= 22; step += 1) {
    for (const direction of [state.player.face || 1, -(state.player.face || 1)]) {
      const scanned = clampToPlayableWorldX(original + direction * (minDiscoveryPlayerSpawnDistance + step * 140));
      if (!blocking(scanned)) return scanned;
    }
  }
  return clampToPlayableWorldX(original + minDiscoveryPlayerSpawnDistance + 1200);
}

function getInteractionObstacleXs(sourceItem = null) {
  if (isInSecretWorld()) {
    return Object.values(state.worldDiscoveries)
      .filter((item) => item !== sourceItem && item.zoneKey === state.activeSecretWorld?.zoneKey && !item.collected)
      .map((item) => ({ x: item.x, distance: minDiscoverySpacing }));
  }
  const obstacles = [];
  getRiverCrossings((sourceItem?.x ?? state.player.x) - 5000, (sourceItem?.x ?? state.player.x) + 5000)
    .forEach((bridge) => obstacles.push({ x: bridge.x, distance: 265 }));
  getProceduralVillages().forEach((village) => obstacles.push({ x: village.x + 410, distance: minDiscoveryVillagerDistance }));
  const companionGiver = getCompanionGiver();
  if (companionGiver) obstacles.push({ x: companionGiver.x, distance: minDiscoveryVillagerDistance });
  getProceduralSecretLocations().forEach((secret) => obstacles.push({ x: secret.x, distance: minDiscoveryDoorDistance }));
  getProceduralLetters().forEach((letter) => obstacles.push({ x: letter.x, distance: 180 }));
  Object.values(state.worldDiscoveries).forEach((item) => {
    if (item === sourceItem || item.collected) return;
    obstacles.push({ x: item.x, distance: minDiscoverySpacing });
  });
  Object.entries(state.discoveryVacancies || {}).forEach(([id, vacancy]) => {
    if (id === sourceItem?.id || !vacancy || vacancy.until <= state.time) return;
    obstacles.push({ x: vacancy.x, distance: minDiscoverySpacing });
  });
  return obstacles;
}

function ensureSecretWorldDiscoveries() {
  if (!state.activeSecretWorld) return;
  const zoneKey = state.activeSecretWorld.zoneKey;
  const hasZone = Object.values(state.worldDiscoveries).some((item) => item.zoneKey === zoneKey);
  if (hasZone) return;
  const bounds = getSecretWorldBounds();
  const secretWorld = getSecretWorldConfig();
  const pool = secretWorld.items.map(getMissionCatalogItem).filter(Boolean);
  const usableWidth = Math.max(0, bounds.end - bounds.start - 1400);
  const itemCount = Math.max(pool.length, Math.floor(usableWidth / secretWorldItemSpacing));
  Array.from({ length: itemCount }).forEach((_, index) => {
    const item = pool[index % pool.length];
    if (!item) return;
    const progress = itemCount <= 1 ? 0.5 : index / (itemCount - 1);
    const jitter = (hashNumber(state.activeSecretWorld.startedAt + index * 23) - 0.5) * 260;
    const x = bounds.start + 700 + progress * usableWidth + jitter;
    const placed = placeDiscoverySafely({
      ...item,
      id: makeId(item.id, Math.floor(state.activeSecretWorld.startedAt * 10) + index + 500),
      x,
      place: secretWorld.name,
      visualType: getItemVisualType(item),
      zoneKey,
      hiddenUntil: state.time + 2 + index * 1.2,
      createdAt: state.time
    }, index);
    storeWorldDiscovery(placed);
  });
}

function buildChapterDiscoveries(chapterIndex) {
  const chapter = chapterIndex + 4;
  const items = [];
  const local = pickChapterDiscoveryItem(chapterIndex);
  if (local && shouldSpawnOrdinaryChapterDiscovery(chapterIndex)) {
    const targetSeconds = discoveryAverageWalkSeconds.min + hashNumber(chapter * 3.1) * (discoveryAverageWalkSeconds.max - discoveryAverageWalkSeconds.min);
    const jitter = 260 + hashNumber(chapter * 7.4) * Math.max(260, playerWalkSpeed * targetSeconds * 0.28);
    items.push({
      id: makeId(local.id, chapter),
      x: world.firstRouteEnd + chapterIndex * world.chapterSize + Math.min(world.chapterSize - 340, jitter),
      label: local.label,
      rarity: local.rarity,
      place: local.place,
      use: local.use,
      text: local.text,
      visualType: getItemVisualType(local),
      zoneKey: `chapter-${chapterIndex}`,
      createdAt: state.time
    });
  }
  const seasonItem = seasonalEventItems.find((entry) => entry.season === getSeason(chapter));
  if (seasonItem && chapterIndex % 7 === 3 && hashNumber(chapter * 9.3) > 0.44) {
    items.push({
      ...seasonItem,
      id: makeId(seasonItem.id, chapter),
      x: world.firstRouteEnd + chapterIndex * world.chapterSize + 1480 + hashNumber(chapter * 7.7) * 460,
      visualType: getItemVisualType(seasonItem),
      zoneKey: `chapter-${chapterIndex}`,
      createdAt: state.time + 0.01
    });
  }
  return items.concat(buildWeatherBonusDiscoveries(chapterIndex));
}

function shouldSpawnOrdinaryChapterDiscovery(chapterIndex) {
  if (chapterIndex < 0) return false;
  const knownCount = state.discoveryDates && typeof state.discoveryDates === "object" ? Object.keys(state.discoveryDates).length : 0;
  const seed = hashNumber(chapterIndex * 11.7 + knownCount * 0.37);
  if (chapterIndex % 3 === 0) return true;
  if (chapterIndex % 3 === 2 && seed > 0.76) return true;
  return false;
}

function pickChapterDiscoveryItem(chapterIndex) {
  const chapter = chapterIndex + 4;
  const season = getSeason(chapter);
  const weather = getWeatherForChapter(chapter).id;
  const night = isNightTime();
  const recentBases = state.discoveries.slice(-10).map(baseDiscoveryId);
  const candidates = generatedCatalogItems.concat(discoveries).filter((item) => {
    const baseId = baseDiscoveryId(item.id);
    if (recentBases.includes(baseId)) return false;
    if (item.rarity === "Legendaire" && hashNumber(chapterIndex * 31 + baseId.length) < 0.92) return false;
    if (item.rarity === "Rare" && hashNumber(chapterIndex * 17 + baseId.length) < 0.58) return false;
    return true;
  });
  const pool = candidates.length ? candidates : generatedCatalogItems;
  const scored = pool.map((item, index) => {
    let score = 1 + hashNumber(chapterIndex * 101 + index * 13);
    if (item.place === getPlaceType(world.firstRouteEnd + chapterIndex * world.chapterSize)) score += 0.9;
    if (season === "Printemps" && /fleur|feuille|pollen|rose/i.test(item.label)) score += 0.42;
    if (season === "Hiver" && /cristal|neige|hiver|chaude/i.test(item.label)) score += 0.38;
    if (weather === "rain" && /pluie|averse|goutte|mousse|champignon/i.test(item.label)) score += 0.55;
    if (night && /etoile|minuit|lune|luciole/i.test(item.label)) score += 0.62;
    if (item.rarity === "Rare") score *= 0.44;
    if (item.rarity === "Legendaire") score *= 0.12;
    return { item, score };
  }).sort((a, b) => b.score - a.score);
  const pickWindow = Math.min(5, scored.length);
  return scored[Math.floor(hashNumber(chapterIndex * 43 + state.player.x) * pickWindow) % pickWindow]?.item || generatedCatalogItems[chapterIndex % generatedCatalogItems.length];
}

function ensureMissionDiscoveryItems() {
  if (!state.activeQuest || !state.activeQuest.itemId) return;
  const templateItem = getMissionCatalogItem(state.activeQuest.itemId);
  if (!templateItem) return;
  const slots = ensureActiveQuestMissionSlots();
  const questZone = `mission-${state.activeQuest.id}`;
  const activeSlot = Math.min(state.activeQuest.progress, state.activeQuest.target - 1);
  const activeId = makeId(templateItem.id, 9000 + state.completedQuests * 100 + activeSlot);
  Object.values(state.worldDiscoveries).forEach((item) => {
    if (!item.missionItem || item.zoneKey !== questZone || item.id === activeId) return;
    if (!item.collected) delete state.worldDiscoveries[item.id];
  });
  if (state.activeQuest.progress >= state.activeQuest.target) return;
  if (state.time < (state.activeQuest.nextMissionRevealAt || 0)) return;
  if (!state.worldDiscoveries[activeId]) {
    const slotX = slots[activeSlot] || getNextMissionSlotX(activeSlot);
    const placedX = placeDiscoverySafely({ id: activeId, x: slotX, missionItem: true, visualType: state.activeQuest.itemId }, activeSlot).x;
    state.worldDiscoveries[activeId] = {
      ...templateItem,
      id: activeId,
      x: placedX,
      place: getPlaceType(placedX),
      visualType: state.activeQuest.itemId,
      missionItem: true,
      zoneKey: questZone,
      hiddenUntil: 0,
      createdAt: state.time
    };
    saveGame();
  } else if (!state.worldDiscoveries[activeId].collected) {
    state.worldDiscoveries[activeId].hiddenUntil = 0;
  }
}

function ensureActiveQuestMissionSlots() {
  if (!state.activeQuest) return [];
  if (!Array.isArray(state.activeQuest.missionSlots) || state.activeQuest.missionSlots.length < state.activeQuest.target) {
    const baseX = Number.isFinite(state.activeQuest.spawnX) ? state.activeQuest.spawnX : state.player.x + missionItemFirstDistance;
    state.activeQuest.missionSlots = Array.from({ length: state.activeQuest.target }, (_, index) => {
      return getMissionSlotX(baseX, index);
    }).sort((a, b) => a - b);
    saveGame();
  }
  return state.activeQuest.missionSlots;
}

function getMissionSlotX(baseX, index) {
  const spread = missionItemSpacing + hashNumber(baseX + index * 17) * 520;
  return placeXClearOfInteractions(Math.max(160, baseX + index * spread), { missionItem: true, salt: index });
}

function getNextMissionSlotX(index) {
  const baseX = Number.isFinite(state.activeQuest?.spawnX) ? state.activeQuest.spawnX : state.player.x + missionItemFirstDistance;
  return getMissionSlotX(baseX, index);
}

function getMissionRevealDelay() {
  return missionItemRevealDelayMin + Math.random() * (missionItemRevealDelayMax - missionItemRevealDelayMin);
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
  const chapter = chapterIndex + 4;
  const weather = getWeatherForChapter(chapter);
  if (chapterIndex % 6 !== 4 || hashNumber(chapterIndex * 23 + chapter) < 0.58) return [];
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
  const pickedId = ids[Math.floor(hashNumber(chapterIndex * 17 + weather.wind) * ids.length) % ids.length];
  return [pickedId].filter(Boolean).map((id, index) => {
    const item = getMissionCatalogItem(id);
    const x = chapterStart + 1180 + hashNumber(chapter * 13 + index) * 580;
    return {
      ...item,
      id: makeId(item.id, 7600 + chapter * 10 + index),
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
    .sort((a, b) => Number(Boolean(b.missionItem)) - Number(Boolean(a.missionItem))
      || Number(Boolean(b.grounded || b.rolling)) - Number(Boolean(a.grounded || a.rolling))
      || Math.abs(a.x - state.player.x) - Math.abs(b.x - state.player.x));
  const picked = [];
  visible.forEach((item) => {
    picked.push(item);
  });
  return picked.sort((a, b) => a.x - b.x);
}

function getProceduralSecretLocations() {
  if (isInSecretWorld() || !state.activeSecretPortal) return [];
  return [state.activeSecretPortal];
}

function getProceduralLetters() {
  if (isInSecretWorld()) return [];
  if (state.activeQuest || state.pendingQuestReward || state.friendlyChallenge || state.time < state.nextLetterAt) return [];
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
  if (isInSecretWorld() || state.friendlyChallenge) return null;
  if (state.companion.offered || state.companion.unlocked) return null;
  const eligible = state.player.x > 2600 || state.completedQuests >= 2 || Object.keys(state.villagerRelations).length >= 3;
  if (!eligible) return null;
  if (!Number.isFinite(state.companionGiverX) || state.companionGiverX <= 0) {
    state.companionGiverX = Math.max(2860, state.player.x + 520);
  }
  return {
    role: "Gardien des compagnons",
    line: "Tu as beaucoup voyage seul. Je crois que ce petit compagnon serait heureux de continuer le chemin a tes cotes.",
    x: state.companionGiverX,
    specialCompanionGiver: true
  };
}

function getProceduralLanterns() {
  if (isInSecretWorld()) return [];
  if (!isExpandedWorld()) return lanterns.filter((entry) => !isRiverGap(entry.x, 60));
  const relativeCamera = state.camera.x - world.firstRouteEnd;
  const start = Math.max(0, Math.floor((relativeCamera - 500) / world.chapterSize));
  const end = Math.floor((relativeCamera + window.innerWidth + 900) / world.chapterSize);
  const items = [];
  for (let chapterIndex = start; chapterIndex <= end; chapterIndex += 1) {
    if (chapterIndex % 2 === 0) {
      items.push({ id: makeId("lantern", chapterIndex + 4), x: world.firstRouteEnd + chapterIndex * world.chapterSize + 650 + hashNumber(chapterIndex) * 120 });
    }
  }
  return items.filter((entry) => !isRiverGap(entry.x, 60));
}

function getProceduralRests() {
  if (isInSecretWorld()) return [];
  if (!isExpandedWorld()) return rests.filter((entry) => !isRiverGap(entry.x, 80));
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
  return items.filter((entry) => !isRiverGap(entry.x, 80));
}

const landmarkTypes = [
  { type: "cabin", name: "Cabane du sentier", action: "Se refugier", rewardId: "leaf", description: "Une petite cabane ouverte aux voyageurs. Sa lanterne chasse la fatigue." },
  { type: "clearing", name: "Clairiere des fougeres", action: "Observer", rewardId: "flower", description: "Un espace calme ou les fleurs sauvages restent visibles entre les arbres." },
  { type: "bridge", name: "Pont de mousse", action: "Traverser", rewardId: "shell", description: "Un vieux pont solide qui relie les deux rives du ruisseau." },
  { type: "marker", name: "Pierre des sentiers", action: "Lire le repere", rewardId: "stone", description: "Une pierre gravee qui indique les lieux connus de la region." }
];

function getProceduralLandmarks() {
  // These locations remain disabled until each one has a physical, coherent route.
  return [];
}

function getProceduralTrailMarkers() {
  if (isInSecretWorld() || !isExpandedWorld()) return [];
  const firstMarkerX = world.firstRouteEnd + 3520;
  const start = Math.max(0, Math.floor((state.camera.x - firstMarkerX - 500) / trailMarkerSpacing));
  const end = Math.max(start, Math.floor((state.camera.x + window.innerWidth + 700 - firstMarkerX) / trailMarkerSpacing));
  return Array.from({ length: end - start + 1 }, (_, offset) => {
    const index = start + offset;
    const x = firstMarkerX + index * trailMarkerSpacing;
    const nextVillageIndex = Math.max(0, Math.ceil((x - (world.firstRouteEnd + 520)) / villageSpacing));
    return { id: `trail-marker-${index}`, x, nextVillageIndex };
  });
}

function getProceduralVillages() {
  if (isInSecretWorld()) return [];
  if (!isExpandedWorld()) return [];
  const firstVillageX = world.firstRouteEnd + 520;
  const start = Math.max(0, Math.floor((state.camera.x - firstVillageX - 1200) / villageSpacing));
  const end = Math.max(start, Math.floor((state.camera.x + window.innerWidth + 1200 - firstVillageX) / villageSpacing));
  const items = [];
  for (let villageIndex = start; villageIndex <= end; villageIndex += 1) {
    items.push({
      x: firstVillageX + villageIndex * villageSpacing,
      name: `Village ${villageIndex + 1}`,
      chapterIndex: villageIndex,
      villager: villagers[villageIndex % villagers.length]
    });
  }
  return items;
}

function getViewportSize() {
  const viewport = window.visualViewport;
  return {
    width: Math.max(1, Math.floor(viewport?.width || window.innerWidth || document.documentElement.clientWidth || 1)),
    height: Math.max(1, Math.floor(viewport?.height || window.innerHeight || document.documentElement.clientHeight || 1))
  };
}

function resize() {
  const size = getViewportSize();
  const dpr = Math.min(window.devicePixelRatio || 1, window.matchMedia("(pointer: coarse)").matches ? 1.5 : 2);
  document.documentElement.style.setProperty("--app-height", `${size.height}px`);
  canvas.width = Math.floor(size.width * dpr);
  canvas.height = Math.floor(size.height * dpr);
  canvas.style.width = `${size.width}px`;
  canvas.style.height = `${size.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  world.ground = size.height * 0.72;
  state.player.y = getWalkSurfaceY(state.player.x);
  if (running) state.camera.x = Math.max(0, state.player.x - size.width * 0.45);
  updateMobileLayoutClasses();
}

function updateMobileLayoutClasses() {
  const isLandscape = window.matchMedia("(orientation: landscape)").matches;
  document.body.classList.toggle("landscape", isLandscape);
  document.body.classList.toggle("portrait", !isLandscape);
}

function resizeGame() {
  resize();
  resetTouchControls();
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
  if (isInSecretWorld()) {
    const secretWorld = getSecretWorldConfig();
    return {
      name: secretWorld.name,
      sky: secretWorld.sky,
      haze: secretWorld.haze,
      tree: secretWorld.tree,
      leaf: secretWorld.leaf,
      grass: secretWorld.grass,
      ground: secretWorld.ground,
      path: secretWorld.path,
      accent: secretWorld.accent,
      wind: secretWorld.wind,
      secretNight: secretWorld.night
    };
  }
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
  if (isInSecretWorld()) {
    drawSecretWorldBackground(colors);
    return;
  }
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

function drawSecretWorldBackground(colors) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const secretWorld = getSecretWorldConfig();
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, colors.sky);
  gradient.addColorStop(0.56, colors.haze);
  gradient.addColorStop(1, colors.ground || colors.grass);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  if (secretWorld.id === "cloud-valley") {
    ctx.globalAlpha = 0.78;
    for (let i = -1; i < 8; i += 1) {
      drawCloud(i * 240 - (state.camera.x * 0.05) % 240, h * (0.5 + hashNumber(i + 3) * 0.22), 190 + hashNumber(i) * 90);
    }
  } else if (secretWorld.id === "star-river") {
    ctx.globalAlpha = 0.78;
    ctx.fillStyle = "rgba(247, 243, 223, 0.8)";
    for (let i = 0; i < 48; i += 1) {
      const x = (i * 97 + Math.floor(state.camera.x * 0.04)) % w;
      const y = 24 + (i * 43) % Math.floor(h * 0.5);
      ctx.globalAlpha = 0.26 + hashNumber(i + 7) * 0.48;
      ctx.beginPath();
      ctx.arc(x, y, 1 + hashNumber(i) * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    drawCoverRiver(w * 0.52 + state.camera.x * 0.03, h * 0.66);
  } else if (secretWorld.id === "firefly-garden") {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = colors.accent;
    for (let i = 0; i < 70; i += 1) {
      const x = (i * 83 + Math.floor(state.camera.x * 0.08)) % w;
      const y = h * 0.18 + (i * 37) % Math.floor(h * 0.54);
      ctx.globalAlpha = 0.16 + Math.abs(Math.sin(state.time * 1.7 + i)) * 0.52;
      ctx.beginPath();
      ctx.arc(x, y, 1.2 + hashNumber(i) * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.globalAlpha = 0.48;
    for (let i = -1; i < 7; i += 1) {
      drawRoundedHill(i * 270 - (state.camera.x * 0.04) % 270, h * 0.56, 360, h * 0.16, "rgba(246, 207, 54, 0.22)");
      ctx.fillStyle = "rgba(255, 226, 112, 0.2)";
      ctx.fillRect(i * 260 + 120 - (state.camera.x * 0.02) % 260, h * 0.05, 18, h * 0.62);
    }
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
  drawRiver();
  ctx.save();
  clipRiverBanks();
  ctx.fillStyle = colors.ground || "#241f18";
  ctx.fillRect(0, world.ground + 34, w, h - world.ground - 34);
  ctx.fillStyle = blendHex(colors.grass, colors.ground || "#241f18", 0.32);
  ctx.fillRect(0, world.ground + 10, w, 42);
  ctx.fillStyle = colors.path || "#c6a15f";
  ctx.fillRect(0, world.ground - 18, w, 42);
  ctx.fillStyle = blendHex(colors.path || "#d1b06b", "#f7f3df", 0.12);
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
  ctx.restore();
}

function drawWorldObjects() {
  ctx.save();
  ctx.translate(-state.camera.x, 0);
  // Reuse the same visible entries for drawing and interaction: a long session
  // can otherwise rebuild the full discovery list twice every frame.
  const visibleDiscoveries = getVisibleWorldDiscoveries();
  const visibleResidents = getVisibleVillageResidents();
  const interactionTarget = getInteractionTarget(visibleDiscoveries, visibleResidents);

  drawCoverForeground();

  getProceduralVillages().forEach((village) => {
    const y = world.ground - 18;
    const theme = getVillageTheme(village);
    drawVillageSignpost(village, theme);
    for (let i = 0; i < 4; i += 1) {
      const houseX = village.x + i * 86;
      const houseH = 48 + (i % 2) * 18;
      ctx.fillStyle = i % 2 ? blendHex(theme.wall, "#f7f3df", 0.12) : theme.wall;
      roundedRect(houseX - 32, y - houseH, 64, houseH, 5);
      ctx.fill();
      ctx.fillStyle = theme.roof;
      ctx.beginPath();
      ctx.moveTo(houseX - 40, y - houseH);
      ctx.lineTo(houseX, y - houseH - 34);
      ctx.lineTo(houseX + 40, y - houseH);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = theme.trim;
      roundedRect(houseX - 10, y - houseH + 18, 20, 18, 4);
      ctx.fill();
      ctx.fillStyle = "#7d5a35";
      roundedRect(houseX - 5, y - 20, 10, 20, 3);
      ctx.fill();
    }
    const resident = getResidentForVillage(village);
    drawVillageMotif(village, theme, resident);
    drawVillager(resident.x, resident);
    drawVillagerBubble(resident);
  });

  getProceduralTrailMarkers().forEach(drawTrailMarker);

  const companionGiver = getCompanionGiver();
  if (companionGiver) {
    drawVillager(companionGiver.x, companionGiver);
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
  });

  visibleDiscoveries.forEach((item, index) => {
    const collected = hasCollectedDiscovery(item);
    if (collected) return;
    const bob = item.grounded ? 0 : Math.sin(state.time * 2 + index) * 5;
    const y = (Number.isFinite(item.y) ? item.y : world.ground - 20) + (getWalkSurfaceY(item.x) - world.ground) + (item.groundOffset || 0) + bob;
    if (item.missionItem) drawMissionDiscoveryMarker(item.x, y);
    drawCollectibleIcon(item, index, item.x, y);
    if (state.itemEffects?.scoutTargetId === item.id && state.time < state.itemEffects.scoutUntil) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 224, 122, 0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(item.x, y - 16, 24 + Math.sin(state.time * 5) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  });

  fallingTreeItems.filter((drop) => !state.worldDiscoveries[drop.item.id]).forEach((drop, index) => {
    drawCollectibleIcon(drop.item, index + 20, drop.x, drop.y);
  });

  drawDiscoveryBursts();

  getProceduralLetters().forEach((letter, index) => {
    const y = world.ground - 26 + Math.sin(state.time * 1.8 + index) * 4;
    drawLetterIcon(letter.x, y);
  });

  getProceduralSecretLocations().forEach((secret) => {
    drawSecretLocation(secret);
  });

  drawFriendlyChallengeGoal();
  drawBridges();
  drawCompanion();
  drawPlayer();
  drawBridges(true);
  ctx.restore();
}

function drawLandmark(landmark) {
  const x = landmark.x;
  const y = world.ground;
  const visited = state.visitedLandmarks.includes(landmark.id);
  ctx.save();
  if (landmark.type === "cabin") {
    ctx.fillStyle = "#6f4729";
    roundedRect(x - 68, y - 94, 112, 94, 5);
    ctx.fill();
    ctx.fillStyle = "#3d3028";
    ctx.beginPath();
    ctx.moveTo(x - 82, y - 94);
    ctx.lineTo(x - 12, y - 142);
    ctx.lineTo(x + 58, y - 94);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = visited ? "#ffe07a" : "#7a654b";
    roundedRect(x - 4, y - 67, 24, 28, 4);
    ctx.fill();
  } else if (landmark.type === "clearing") {
    ctx.fillStyle = "rgba(247, 243, 223, 0.18)";
    ctx.beginPath();
    ctx.ellipse(x, y - 12, 105, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8ebf76";
    for (let index = 0; index < 7; index += 1) drawEllipse(x - 70 + index * 24, y - 18 - (index % 2) * 10, 8, 8, ctx.fillStyle);
  } else if (landmark.type === "bridge") {
    ctx.strokeStyle = "#704b2e";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - 92, y - 10);
    ctx.quadraticCurveTo(x, y - 58, x + 92, y - 10);
    ctx.stroke();
    ctx.strokeStyle = "rgba(103, 180, 200, 0.68)";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(x - 118, y + 10);
    ctx.lineTo(x + 118, y + 10);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#71827a";
    ctx.beginPath();
    ctx.moveTo(x - 34, y);
    ctx.lineTo(x - 20, y - 86);
    ctx.lineTo(x + 24, y - 98);
    ctx.lineTo(x + 43, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = visited ? "#f0bd6c" : "#d6d1bc";
    ctx.font = "900 22px Nunito";
    ctx.textAlign = "center";
    ctx.fillText("+", x + 4, y - 42);
  }
  ctx.fillStyle = "rgba(20, 34, 33, 0.78)";
  roundedRect(x - 72, y - 170, 144, 24, 7);
  ctx.fill();
  ctx.fillStyle = "#f7f3df";
  ctx.font = "800 10px Nunito";
  ctx.textAlign = "center";
  ctx.fillText(landmark.name, x, y - 154);
  ctx.restore();
}

function drawTrailMarker(marker) {
  const x = marker.x;
  const y = world.ground;
  const visited = state.visitedLandmarks.includes(marker.id);
  ctx.save();
  ctx.strokeStyle = "#60442e";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y + 6);
  ctx.lineTo(x, y - 52);
  ctx.stroke();
  ctx.fillStyle = visited ? "#c79d60" : "#8f6d45";
  roundedRect(x - 24, y - 58, 48, 22, 4);
  ctx.fill();
  ctx.strokeStyle = "rgba(45, 35, 28, 0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#f7f3df";
  ctx.font = "900 12px Nunito";
  ctx.textAlign = "center";
  ctx.fillText("->", x + 1, y - 43);
  ctx.restore();
}

function drawVillageSignpost(village, theme) {
  const x = village.x - 170;
  const y = world.ground - 18;
  const visited = state.visitedVillages.includes(getVillageIdFromX(village.x));
  ctx.save();
  ctx.strokeStyle = "#62442d";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y + 14);
  ctx.lineTo(x, y - 56);
  ctx.stroke();
  ctx.fillStyle = visited ? blendHex(theme.wall, "#ffffff", 0.2) : theme.wall;
  roundedRect(x - 8, y - 66, 74, 25, 5);
  ctx.fill();
  ctx.strokeStyle = theme.roof;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#26352e";
  ctx.font = "800 10px Nunito";
  ctx.textAlign = "left";
  ctx.fillText(village.name, x + 2, y - 50);
  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.moveTo(x, y - 78);
  ctx.lineTo(x + 18, y - 71);
  ctx.lineTo(x, y - 64);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawVillageMotif(village, theme, resident = getResidentForVillage(village)) {
  const x = village.x + 308;
  const y = world.ground - 8;
  ctx.save();
  ctx.fillStyle = theme.accent;
  if (theme.motif === "river") {
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    for (let index = 0; index < 3; index += 1) {
      ctx.globalAlpha = 0.42 + index * 0.12;
      ctx.beginPath();
      ctx.arc(x + index * 16, y - 14 - Math.sin(state.time * 2 + index) * 2, 7 + index * 2, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
    }
  } else if (theme.motif === "flower") {
    for (let index = 0; index < 4; index += 1) {
      ctx.beginPath();
      ctx.arc(x + index * 12, y - 12 - (index % 2) * 7, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (theme.motif === "leaf") {
    for (let index = 0; index < 3; index += 1) {
      ctx.save();
      ctx.translate(x + index * 15, y - 15 - index * 4);
      ctx.rotate(-0.5 + index * 0.3);
      drawEllipse(0, 0, 9, 4, theme.accent);
      ctx.restore();
    }
  } else {
    for (let index = 0; index < 3; index += 1) {
      const sx = x + index * 15;
      const sy = y - 15 - (index % 2) * 8;
      ctx.beginPath();
      ctx.arc(sx, sy, 3 + Math.sin(state.time * 2 + index) * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const relation = getVillagerMemory(resident).relation || 0;
  if (relation >= 3) {
    ctx.strokeStyle = "rgba(240, 189, 108, 0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(village.x + 88, y - 96);
    ctx.quadraticCurveTo(village.x + 204, y - 64, village.x + 324, y - 96);
    ctx.stroke();
    for (let index = 0; index < 4; index += 1) {
      ctx.fillStyle = index % 2 ? theme.accent : "#f0bd6c";
      ctx.beginPath();
      ctx.arc(village.x + 112 + index * 62, y - 77 + Math.sin(index) * 5, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (relation >= 6) {
    ctx.fillStyle = "#8c6135";
    roundedRect(village.x + 245, y - 22, 58, 9, 4);
    ctx.fill();
    ctx.fillStyle = "#4a2c1b";
    ctx.fillRect(village.x + 252, y - 13, 7, 18);
    ctx.fillRect(village.x + 289, y - 13, 7, 18);
  }
  ctx.restore();
}

function drawMissionDiscoveryMarker(x, y) {
  const pulse = 0.5 + Math.sin(state.time * 4) * 0.12;
  ctx.save();
  ctx.strokeStyle = `rgba(255, 230, 132, ${pulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 8, 30 + Math.sin(state.time * 3) * 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 230, 132, 0.78)";
  ctx.beginPath();
  ctx.moveTo(x, y - 54);
  ctx.lineTo(x - 5, y - 44);
  ctx.lineTo(x + 5, y - 44);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawDiscoveryBursts() {
  discoveryBursts.forEach((particle) => {
    const progress = Math.max(0, Math.min(1, (state.time - particle.startedAt) / particle.duration));
    const alpha = (1 - progress) * particle.alpha;
    const x = particle.x + particle.vx * progress;
    const y = particle.y + particle.vy * progress + progress * progress * 16;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(x, y, particle.size * (1 - progress * 0.38), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawFriendlyChallengeGoal() {
  const challenge = state.friendlyChallenge;
  if (!challenge || isInSecretWorld()) return;
  const x = challenge.targetX;
  const y = world.ground - 18;
  const startX = Number.isFinite(challenge.startX) ? challenge.startX : challenge.villager.x;
  const direction = Math.sign(x - startX) || 1;
  ctx.save();
  ctx.strokeStyle = "rgba(20, 34, 33, 0.32)";
  ctx.lineWidth = 9;
  ctx.setLineDash([8, 14]);
  ctx.lineDashOffset = -state.time * 24;
  ctx.beginPath();
  ctx.moveTo(startX, world.ground - 5);
  ctx.lineTo(x, world.ground - 5);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 229, 137, 0.96)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(startX, world.ground - 5);
  ctx.lineTo(x, world.ground - 5);
  ctx.stroke();
  ctx.setLineDash([]);
  const visibleStart = Math.max(Math.min(startX, x), state.camera.x - 60);
  const visibleEnd = Math.min(Math.max(startX, x), state.camera.x + window.innerWidth + 60);
  ctx.strokeStyle = "#fff1bc";
  ctx.lineWidth = 3;
  for (let arrowX = Math.ceil(visibleStart / 220) * 220; arrowX <= visibleEnd; arrowX += 220) {
    ctx.beginPath();
    ctx.moveTo(arrowX - direction * 9, world.ground - 13);
    ctx.lineTo(arrowX + direction * 5, world.ground - 5);
    ctx.lineTo(arrowX - direction * 9, world.ground + 3);
    ctx.stroke();
  }
  ctx.fillStyle = "#e8dcb8";
  ctx.fillRect(startX - 4, world.ground - 16, 8, 30);
  ctx.restore();
  (challenge.route || []).forEach((obstacle) => drawFriendlyChallengeObstacle(obstacle, direction));
  [0.34, 0.68].forEach((progress) => {
    const markerX = startX + (x - startX) * progress;
    ctx.save();
    ctx.fillStyle = "rgba(240, 189, 108, 0.86)";
    ctx.beginPath();
    ctx.arc(markerX, y - 18, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(96, 68, 44, 0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(markerX - direction * 5, y - 18);
    ctx.lineTo(markerX + direction * 6, y - 18);
    ctx.stroke();
    ctx.restore();
  });
  const pulse = 0.55 + Math.sin(state.time * 4) * 0.14;
  ctx.save();
  const glow = ctx.createRadialGradient(x, y - 56, 10, x, y - 56, 128);
  glow.addColorStop(0, `rgba(255, 224, 122, ${pulse * 0.42})`);
  glow.addColorStop(1, "rgba(255, 224, 122, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y - 56, 128, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#60442c";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x, y + 14);
  ctx.lineTo(x, y - 76);
  ctx.stroke();
  ctx.fillStyle = "#f0bd6c";
  ctx.beginPath();
  ctx.moveTo(x, y - 78);
  ctx.lineTo(x + 34, y - 66);
  ctx.lineTo(x, y - 54);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(20, 34, 33, 0.78)";
  roundedRect(x - 45, y - 118, 90, 25, 7);
  ctx.fill();
  ctx.fillStyle = "#f7f3df";
  ctx.font = "800 11px Nunito";
  ctx.textAlign = "center";
  ctx.fillText("Arrivee", x, y - 101);
  ctx.restore();
}

function drawFriendlyChallengeObstacle(obstacle, direction) {
  const y = world.ground;
  ctx.save();
  if (obstacle.type === "rock") {
    ctx.fillStyle = "#71827a";
    ctx.beginPath();
    ctx.moveTo(obstacle.x - 22, y);
    ctx.quadraticCurveTo(obstacle.x - 14, y - 25, obstacle.x + 2, y - 27);
    ctx.quadraticCurveTo(obstacle.x + 21, y - 23, obstacle.x + 23, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(247, 243, 223, 0.32)";
    ctx.beginPath();
    ctx.ellipse(obstacle.x - 7, y - 19, 7, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }
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
  if (!state.companion.unlocked || !state.companion.present) return;
  const p = state.player;
  const moving = Math.abs(state.companion.pace || 0) > 18;
  const sleeping = p.rest > 0.2;
  const x = Number.isFinite(state.companion.x) ? state.companion.x : p.x - p.face * 82;
  const y = getWalkSurfaceY(x) - 7;
  const face = Math.sign(p.x - x) || p.face;
  const fade = state.companion.transitionUntil > state.time ? Math.min(1, Math.max(0.25, 1 - (state.companion.transitionUntil - state.time) / 1.2)) : 1;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.translate(x, y);
  ctx.scale(face, 1);
  drawCompanionAnimal(state.companion, moving, sleeping);
  ctx.restore();
}

function drawCompanionAnimal(companion, moving = false, sleeping = false) {
  const color = companion.color || "#c86f3f";
  const accent = companion.accent || "#f0bd6c";
  const species = companion.species || "Renard";
  const sit = !moving || sleeping;
  const bird = species === "Petit oiseau";
  const rabbit = species === "Lapin";
  const hedgehog = species === "Herisson";
  const squirrel = species === "Ecureuil";
  const cat = species === "Chat";
  const dog = species === "Chien";
  const fox = species === "Renard";
  const bodyWidth = bird ? 17 : hedgehog ? 22 : rabbit ? 20 : dog ? 27 : 24;
  const bodyHeight = bird ? 11 : hedgehog ? 11 : sit ? 13 : 14;
  const headSize = bird ? 9 : hedgehog ? 10 : dog ? 13 : 12;
  const headX = bird ? 16 : hedgehog ? 18 : 20;
  const headY = sit ? -15 : -17;
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.beginPath();
  ctx.ellipse(0, 10, bodyWidth + 1, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, sit ? -8 : -10, bodyWidth, bodyHeight, hedgehog ? -0.08 : 0, 0, Math.PI * 2);
  ctx.fill();
  if (bird) {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.ellipse(-3, -11, 13, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e7a04d";
    ctx.beginPath();
    ctx.moveTo(23, -16);
    ctx.lineTo(34, -13);
    ctx.lineTo(23, -10);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(headX, headY, headSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.beginPath();
  if (rabbit) {
    ctx.moveTo(13, -25);
    ctx.lineTo(15, -51);
    ctx.lineTo(22, -25);
    ctx.moveTo(23, -25);
    ctx.lineTo(30, -50);
    ctx.lineTo(32, -24);
  } else if (dog) {
    ctx.moveTo(11, -25);
    ctx.quadraticCurveTo(7, -36, 14, -39);
    ctx.quadraticCurveTo(21, -34, 16, -23);
    ctx.moveTo(25, -24);
    ctx.quadraticCurveTo(37, -34, 35, -19);
    ctx.quadraticCurveTo(28, -17, 25, -24);
  } else if (bird) {
    ctx.moveTo(12, -25);
    ctx.lineTo(17, -36);
    ctx.lineTo(22, -25);
  } else if (cat) {
    ctx.moveTo(12, -25);
    ctx.lineTo(18, -43);
    ctx.lineTo(24, -25);
    ctx.moveTo(24, -25);
    ctx.lineTo(33, -42);
    ctx.lineTo(34, -22);
  } else {
    ctx.moveTo(12, -26);
    ctx.lineTo(fox ? 15 : 17, fox ? -45 : -43);
    ctx.lineTo(24, -25);
    ctx.moveTo(24, -25);
    ctx.lineTo(fox ? 37 : 34, fox ? -39 : -40);
    ctx.lineTo(34, -21);
  }
  ctx.fill();
  ctx.strokeStyle = color;
  if (!hedgehog && !bird) {
    ctx.lineWidth = squirrel ? 8 : dog ? 6 : 5;
    ctx.beginPath();
    ctx.moveTo(-20, -10);
    if (squirrel) {
      ctx.quadraticCurveTo(-54, -52, -28, -58);
      ctx.quadraticCurveTo(-5, -58, -16, -31);
    } else if (rabbit) {
      ctx.quadraticCurveTo(-34, -20, -42, -7);
    } else if (dog) {
      ctx.quadraticCurveTo(-42, -24 + Math.sin(state.time * 8) * 4, -55, -18);
    } else {
      ctx.quadraticCurveTo(-44, fox ? -32 : -28, -56, fox ? -7 : -5);
    }
    ctx.stroke();
    if (fox) {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.ellipse(-56, -7, 7, 4, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (hedgehog) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    for (let i = -16; i <= 12; i += 7) {
      ctx.beginPath();
      ctx.moveTo(i, -19);
      ctx.lineTo(i + 4, -31);
      ctx.stroke();
    }
  }
  if (cat) {
    ctx.strokeStyle = "rgba(247,243,223,0.72)";
    ctx.lineWidth = 1;
    [-2, 2].forEach((side) => {
      ctx.beginPath();
      ctx.moveTo(27, headY - 2);
      ctx.lineTo(39, headY + side * 2);
      ctx.stroke();
    });
  }
  ctx.fillStyle = "#24312e";
  ctx.beginPath();
  ctx.arc(headX + 5, headY - 2, sleeping ? 1.6 : 2.4, 0, Math.PI * 2);
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
  } else if (baseId === "rare") {
    ctx.fillStyle = "#67b4c8";
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(24, -7);
    ctx.lineTo(14, 24);
    ctx.lineTo(-14, 24);
    ctx.lineTo(-24, -7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(247, 243, 223, 0.36)";
    ctx.beginPath();
    ctx.moveTo(0, -21);
    ctx.lineTo(10, -6);
    ctx.lineTo(4, 15);
    ctx.lineTo(-8, 7);
    ctx.closePath();
    ctx.fill();
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
    if (isRiverGap(x, 230)) continue;
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

// One deterministic geometry for terrain, rendering and every walking actor.
// The lateral game has no depth lane: the deck is the only surface over water.
function getRiverCrossings(startX, endX) {
  if (isInSecretWorld()) return [];
  const centers = [3820];
  const first = world.firstRouteEnd + 3820;
  for (let i = Math.max(0, Math.ceil((startX - 240 - first) / 4200));
    first + i * 4200 <= endX + 240; i += 1) {
    const x = first + i * 4200;
    const villageIndex = Math.max(0, Math.round((x - world.firstRouteEnd - 520) / villageSpacing));
    const villageX = world.firstRouteEnd + 520 + villageIndex * villageSpacing;
    if (x > villageX - 650 && x < villageX + 1000) continue;
    centers.push(x);
  }
  return centers.filter((x) => x + 240 >= startX && x - 240 <= endX)
    .map((x) => ({ x, left: x - 210, right: x + 210, waterLeft: x - 170, waterRight: x + 170 }));
}

function getWalkSurfaceY(x) {
  const bridge = getRiverCrossings(x, x).find((entry) => x >= entry.left && x <= entry.right);
  if (!bridge) return world.ground;
  const t = (x - bridge.left) / (bridge.right - bridge.left);
  return world.ground - 12 * Math.sin(Math.PI * t) ** 2;
}

function isRiverGap(x, margin = 0) {
  return getRiverCrossings(x - margin, x + margin)
    .some((bridge) => x >= bridge.waterLeft - margin && x <= bridge.waterRight + margin);
}

function clipRiverBanks() {
  const offset = state.camera.x;
  ctx.beginPath();
  ctx.rect(state.camera.x - offset - 1000, -1000, window.innerWidth + 2000, window.innerHeight + 2000);
  for (const bridge of getRiverCrossings(state.camera.x - 240, state.camera.x + window.innerWidth + 240)) {
    ctx.rect(bridge.waterLeft - offset, -1000, bridge.waterRight - bridge.waterLeft, window.innerHeight + 2000);
  }
  ctx.clip("evenodd");
}

function drawRiver() {
  ctx.save();
  ctx.translate(-state.camera.x, 0);
  const g = world.ground;
  for (const bridge of getRiverCrossings(state.camera.x, state.camera.x + window.innerWidth)) {
    const width = bridge.waterRight - bridge.waterLeft;
    ctx.fillStyle = "#659da2";
    ctx.fillRect(bridge.waterLeft, g + 39, width, window.innerHeight - g);
    ctx.fillStyle = "rgba(53, 109, 123, 0.25)";
    ctx.fillRect(bridge.waterLeft, g + 85, width, window.innerHeight - g);
    for (let i = 0; i < 9; i += 1) {
      const x = bridge.waterLeft + 30 + (i * 47) % (width - 60);
      const y = g + 53 + i * 15;
      drawEllipse(x + Math.sin(state.time * 0.6 + i) * 6, y, 19 + i % 3 * 6, 2.5, "rgba(224, 242, 223, 0.24)");
    }
    for (const side of [-1, 1]) {
      const bank = bridge.x + side * 170;
      drawEllipse(bank - side * 13, g + 75, 19, 13, "#8b9890");
      drawEllipse(bank - side * 25, g + 107, 12, 8, "#768b83");
      ctx.strokeStyle = "#6b8b59";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(bank + side * (10 + i * 7), g + 55);
        ctx.quadraticCurveTo(bank + side * (20 + i * 6), g + 30, bank + side * (15 + i * 9), g + 15);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function drawBridges(front = false) {
  ctx.save();
  ctx.lineCap = "round";
  for (const bridge of getRiverCrossings(state.camera.x - 240, state.camera.x + window.innerWidth + 240)) {
    if (!front) {
      ctx.strokeStyle = "#72583f";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(bridge.left + 28, world.ground + 44);
      ctx.lineTo(bridge.left + 90, world.ground + 10);
      ctx.moveTo(bridge.right - 28, world.ground + 44);
      ctx.lineTo(bridge.right - 90, world.ground + 10);
      ctx.stroke();
      for (let x = bridge.left; x < bridge.right; x += 20) {
        const y = getWalkSurfaceY(x + 10) + 3;
        ctx.fillStyle = "#72573e";
        roundedRect(x, y + 5, 21, 13, 3);
        ctx.fill();
        ctx.fillStyle = ["#be9963", "#c6a572", "#b89261"][Math.floor((x - bridge.left) / 20) % 3];
        roundedRect(x, y, 20.5, 8, 3);
        ctx.fill();
        ctx.strokeStyle = "rgba(96, 73, 47, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 6, y + 2);
        ctx.lineTo(x + 6, y + 6);
        ctx.stroke();
      }
    }
    // Four posts total: two rear posts, two foreground posts.
    const inset = front ? 25 : 48;
    const postY = world.ground - (front ? 32 : 45);
    ctx.fillStyle = front ? "#846547" : "#967956";
    for (const x of [bridge.left + inset, bridge.right - inset]) {
      roundedRect(x - 7, postY, 14, front ? 66 : 65, 5);
      ctx.fill();
      drawEllipse(x + 3, world.ground + 12, 10, 5, "#6e8a50");
      drawEllipse(x - 5, world.ground + 18, 6, 4, "#789754");
    }
    ctx.strokeStyle = front ? "rgba(230, 216, 169, 0.82)" : "#d5c79e";
    ctx.lineWidth = front ? 3 : 3.5;
    ctx.beginPath();
    ctx.moveTo(bridge.left + inset, postY + 13);
    ctx.quadraticCurveTo(bridge.x, postY + 39, bridge.right - inset, postY + 13);
    ctx.stroke();
  }
  ctx.restore();
}

function getVisibleRiverX() {
  const bridges = getRiverCrossings(state.camera.x, state.camera.x + window.innerWidth);
  const bridge = bridges.sort((a, b) => Math.abs(a.x - state.player.x) - Math.abs(b.x - state.player.x))[0];
  return bridge ? bridge.x - state.camera.x : null;
}

function drawVillager(x, villager) {
  const y = getWalkSurfaceY(x);
  if (villager.raceActor) {
    const seed = Math.abs(hashNumber(villager.role.length + villager.homeX));
    const bodyColors = ["#6a8a80", "#8b6840", "#6f7f4f", "#4f7f99", "#7f6a8a"];
    const hopTimeLeft = Math.max(0, (villager.raceActor.hopUntil || 0) - state.time);
    const hopOffset = hopTimeLeft > 0 ? Math.sin((1 - hopTimeLeft / hopDurationSeconds) * Math.PI) * hopHeight : 0;
    drawCharacter({
      x,
      y: y - hopOffset,
      face: villager.raceActor.vx < 0 ? -1 : villager.raceActor.vx > 0 ? 1 : villager.raceActor.direction || 1,
      velocity: villager.raceActor.vx || 0,
      body: villager.specialCompanionGiver ? "#6f7f4f" : bodyColors[Math.floor(seed * bodyColors.length) % bodyColors.length],
      skin: "#e5b878",
      hair: villager.specialCompanionGiver ? "#6d7f3f" : "#4a3632",
      label: ""
    });
    return;
  }
  const bob = Math.sin(state.time * 2 + x) * 3;
  drawVillagerCharacter(x, y + bob, villager);

}

function drawVillagerCharacter(x, y, villager) {
  const seed = Math.abs(hashNumber(villager.role.length + x));
  const bodyColors = ["#6a8a80", "#8b6840", "#6f7f4f", "#4f7f99", "#7f6a8a"];
  const body = villager.specialCompanionGiver ? "#6f7f4f" : bodyColors[Math.floor(seed * bodyColors.length) % bodyColors.length];
  const skin = "#e5b878";
  const hair = villager.specialCompanionGiver ? "#6d7f3f" : "#4a3632";
  ctx.save();
  ctx.translate(x, y - 52);
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.beginPath();
  ctx.ellipse(0, 57, 25, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2d2730";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-7, 31);
  ctx.lineTo(-15, 55);
  ctx.moveTo(8, 31);
  ctx.lineTo(14, 55);
  ctx.stroke();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 22, 22, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  if (villager.specialCompanionGiver) {
    ctx.fillStyle = "rgba(240, 189, 108, 0.5)";
    roundedRect(-16, 3, 32, 7, 4);
    ctx.fill();
  }
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, -25, 23, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#28312e";
  ctx.beginPath();
  ctx.arc(9, -27, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.ellipse(-7, -39, 23, 13, -0.22, Math.PI * 0.9, Math.PI * 2.08);
  ctx.lineTo(-20, -26);
  ctx.quadraticCurveTo(-4, -32, 17, -42);
  ctx.fill();
  ctx.strokeStyle = "#2d2730";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-16, 14);
  ctx.lineTo(-23, 25);
  ctx.moveTo(16, 14);
  ctx.lineTo(24, 24);
  ctx.stroke();
  ctx.restore();
}

function drawWeather() {
  const weather = getWeatherForChapter();
  const w = window.innerWidth;
  const h = window.innerHeight;
  const protectedFromWeather = getWeatherProtection(weather.id);
  ctx.save();
  if (weatherVisual.rain > 0.01) drawRainWeather(weatherVisual.rain, protectedFromWeather);
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

function getRainTargetIntensity(weather = getWeatherForChapter()) {
  if (weather.id !== "rain") return 0;
  if (getWeatherProtection("rain")) return 0.36;
  const seed = hashNumber(state.chapter * 19 + Math.floor(state.player.x / 900));
  if (seed > 0.72) return 0.95;
  if (seed > 0.34) return 0.68;
  return 0.44;
}

function updateWeatherVisual(dt) {
  weatherVisual.targetRain = getRainTargetIntensity();
  weatherVisual.rain += (weatherVisual.targetRain - weatherVisual.rain) * Math.min(1, dt * 0.75);
  if (weatherVisual.targetRain <= 0.01 && weatherVisual.rain < 0.012) weatherVisual.rain = 0;
  weatherVisual.rainMood += (weatherVisual.rain - weatherVisual.rainMood) * Math.min(1, dt * 0.45);
}

function drawRainWeather(intensity, protectedFromWeather = false) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const mobileFactor = Math.min(w, h) < 680 ? 0.68 : 1;
  const rain = Math.max(0, Math.min(1, intensity));
  const groundY = world.ground + 16;
  const riverX = getVisibleRiverX();
  ctx.save();
  ctx.fillStyle = `rgba(18, 28, 29, ${0.06 + rain * 0.08})`;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = `rgba(35, 55, 50, ${0.06 + rain * 0.07})`;
  ctx.fillRect(0, world.ground - 18, w, h - world.ground + 18);

  const layers = [
    { count: 18, speed: 260, length: 18, alpha: 0.12, width: 0.8, drift: 6 },
    { count: 42, speed: 430, length: 28, alpha: 0.2, width: 1, drift: 12 },
    { count: 18, speed: 620, length: 42, alpha: 0.32, width: 1.35, drift: 20 }
  ];
  layers.forEach((layer, layerIndex) => {
    const count = Math.max(5, Math.round(layer.count * rain * mobileFactor));
    ctx.strokeStyle = `rgba(216, 235, 241, ${layer.alpha * (protectedFromWeather ? 0.62 : 1)})`;
    ctx.lineWidth = layer.width;
    ctx.lineCap = "round";
    for (let i = 0; i < count; i += 1) {
      const seed = hashNumber(i * 31 + layerIndex * 97);
      const seedB = hashNumber(i * 47 + layerIndex * 131);
      const travel = (state.time * layer.speed + seed * h * 1.8) % (h + 120);
      const x = (i * (w / Math.max(1, count)) + seedB * 140 + state.time * layer.drift) % (w + 100) - 50;
      const y = travel - 80;
      const len = layer.length * (0.72 + seed * 0.72) * (0.85 + rain * 0.28);
      const slant = (10 + layerIndex * 5 + rain * 12) * (0.8 + seedB * 0.45);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - slant, y + len);
      ctx.stroke();
    }
  });

  const impactCount = Math.round((8 + rain * 18) * mobileFactor);
  for (let i = 0; i < impactCount; i += 1) {
    const seed = hashNumber(i * 73 + Math.floor(state.time * 2.6));
    if (seed > 0.42 + rain * 0.28) continue;
    const life = (state.time * (0.75 + rain * 0.5) + seed * 8 + i * 0.23) % 1;
    const x = (i * 157 + seed * 340 + Math.floor(state.camera.x * 0.08)) % (w + 120) - 60;
    const nearWater = riverX !== null && Math.abs(x - riverX) < 350 && seed > 0.52;
    const y = nearWater ? world.ground + 25 + Math.sin(i + state.time * 2) * 10 : groundY + seed * 18;
    const radius = (nearWater ? 9 : 4) + life * (nearWater ? 18 : 9);
    ctx.strokeStyle = `rgba(216, 235, 241, ${(1 - life) * (nearWater ? 0.22 : 0.14) * rain})`;
    ctx.lineWidth = nearWater ? 1.1 : 0.8;
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * (nearWater ? 0.34 : 0.18), 0, 0, Math.PI * 2);
    ctx.stroke();
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
  const hopTimeLeft = p.action === "hop" ? Math.max(0, p.actionUntil - state.time) : 0;
  const hopOffset = hopTimeLeft > 0 ? Math.sin((1 - hopTimeLeft / hopDurationSeconds) * Math.PI) * hopHeight : 0;
  drawCharacter({
    x: p.x,
    y: getWalkSurfaceY(p.x) - hopOffset,
    face: p.face,
    velocity: p.vx,
    body: appearance.body,
    skin: appearance.skin,
    hair: appearance.hair,
    accessory: appearance.accessory,
    label: "",
    seated: p.rest > 0.2,
    action: p.actionUntil > state.time && p.action !== "hop" ? p.action : ""
  });
}

function drawCharacter({ x, y, face = 1, velocity = 0, body = "#ce6f75", skin = "#f0bd6c", hair = "#22322c", accessory = "", label = "", seated = false, action = "" }) {
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
  const night = isInSecretWorld()
    ? getSecretWorldConfig().night
    : Math.max(0, Math.min(1, (state.player.x - 5200) / 2800));
  const activeGlow = state.itemEffects?.glowUntil > state.time;
  // Light comes from an active effect or equipped lantern, never from merely discovering an item.
  const hasLight = activeGlow || state.equipment?.lanternOn;
  const darkness = 0.08 + night * (hasLight ? 0.13 : 0.2);
  ctx.fillStyle = `rgba(10, 16, 30, ${darkness})`;
  ctx.fillRect(0, 0, w, h);
  if (night > 0.05) {
    const px = state.player.x - state.camera.x;
    const py = state.player.y - 54;
    ctx.save();
    const glowRadius = activeGlow ? 245 : state.equipment?.lanternOn ? 210 : hasLight ? 190 : 135;
    const glow = ctx.createRadialGradient(px, py, 18, px, py, glowRadius);
    glow.addColorStop(0, activeGlow ? "rgba(255, 229, 151, 0.42)" : hasLight ? "rgba(255, 229, 151, 0.26)" : "rgba(247, 243, 223, 0.16)");
    glow.addColorStop(1, "rgba(247, 243, 223, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(px, py, glowRadius, 0, Math.PI * 2);
    ctx.fill();
      ctx.restore();
  }
  if (state.itemEffects?.compassUntil > state.time) drawCompassHint();
  if (state.itemEffects?.scoutUntil > state.time) drawScoutHint();
  drawSecretWorldHud();
  drawFriendlyChallengeHud();
  drawContextualInteraction();
  if (state.player.rest > 0) {
    ctx.save();
    ctx.globalAlpha = state.player.rest * 0.24;
    ctx.fillStyle = "#f7f3df";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

function drawScoutHint() {
  const target = getVisibleWorldDiscoveries().find((item) => item.id === state.itemEffects.scoutTargetId && !item.collected)
    || Object.values(state.worldDiscoveries).find((item) => item.id === state.itemEffects.scoutTargetId && !item.collected);
  if (!target) return;
  const screenX = target.x - state.camera.x;
  const visible = screenX > 28 && screenX < window.innerWidth - 28;
  const x = visible ? screenX : (screenX < 0 ? 32 : window.innerWidth - 32);
  const y = window.innerHeight * 0.2;
  ctx.save();
  ctx.fillStyle = "rgba(20, 34, 33, 0.84)";
  roundedRect(x - 42, y - 18, 84, 34, 8);
  ctx.fill();
  ctx.fillStyle = "#f0bd6c";
  ctx.font = "900 13px Nunito";
  ctx.textAlign = "center";
  ctx.fillText(visible ? "TROUVAILLE" : screenX < 0 ? "← OBJET" : "OBJET →", x, y + 4);
  ctx.restore();
}

function getInteractionLabel(target) {
  if (!target) return "";
  if (target.kind === "item") return `${target.entry.label || "Objet"} • Ramasser`;
  if (target.kind === "letter") return "Enveloppe • Lire";
  if (target.kind === "villager" || target.kind === "companion") return `${target.entry.role} • Parler`;
  if (target.kind === "lantern") return "Lanterne • Allumer";
  if (target.kind === "rest") return `${target.entry.label || "Halte"} • Se reposer`;
  if (target.kind === "secret") return `${target.entry.name || "Portail"} • Entrer`;
  if (target.kind === "trail-marker") return "Repere de chemin - Consulter";
  return "";
}

function drawContextualInteraction() {
  if (!running || isModalOpen()) return;
  const label = getInteractionLabel(getInteractionTarget());
  if (!label) return;
  const mobile = window.matchMedia("(pointer: coarse)").matches;
  const text = mobile ? label : `${label}  •  E`;
  ctx.save();
  ctx.font = "800 12px Nunito";
  const width = Math.min(window.innerWidth - 32, ctx.measureText(text).width + 34);
  const x = window.innerWidth * 0.5;
  const y = mobile ? window.innerHeight - 150 : window.innerHeight - 36;
  ctx.fillStyle = "rgba(20, 34, 33, 0.86)";
  roundedRect(x - width / 2, y - 18, width, 34, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(240, 189, 108, 0.45)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#f7f3df";
  ctx.textAlign = "center";
  ctx.fillText(text, x, y + 4);
  ctx.restore();
}

function drawFriendlyChallengeHud() {
  const challenge = state.friendlyChallenge;
  if (!challenge || isInSecretWorld()) return;
  if (challenge.readyAt > state.time || state.time < challenge.readyAt + 0.7) {
    ctx.save();
    ctx.font = "900 24px Nunito";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff1bc";
    ctx.strokeStyle = "#142221";
    ctx.lineWidth = 4;
    const count = challenge.readyAt > state.time ? String(Math.ceil(challenge.readyAt - state.time)) : "GO";
    ctx.strokeText(count, window.innerWidth / 2, window.innerHeight * 0.3);
    ctx.fillText(count, window.innerWidth / 2, window.innerHeight * 0.3);
    ctx.restore();
    return;
  }
  const startX = Number.isFinite(challenge.startX) ? challenge.startX : challenge.villager.x;
  const direction = Math.sign(challenge.targetX - startX) || 1;
  const courseLength = Math.max(1, Math.abs(challenge.targetX - startX));
  const progressAt = (x) => Math.max(0, Math.min(1, ((x - startX) * direction) / courseLength));
  const playerProgress = Math.round(progressAt(state.player.x) * 100);
  const runnerProgress = Math.round(progressAt(challenge.runner?.x ?? startX) * 100);
  const x = window.innerWidth * 0.5;
  const y = 34;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(20, 34, 33, 0.8)";
  roundedRect(-126, -17, 252, 34, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(240, 189, 108, 0.4)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#f0bd6c";
  ctx.font = "900 12px Nunito";
  ctx.textAlign = "center";
  ctx.fillText(`Course ${friendlyChallengeDistanceLabel}  Toi ${playerProgress}%  Habit. ${runnerProgress}%`, 0, 4);
  ctx.restore();
  const next = (challenge.route || []).find((obstacle) => !obstacle.playerPassed && (obstacle.x - state.player.x) * direction > 0);
  const nextX = (next?.x ?? challenge.targetX) - state.camera.x;
  if (nextX < 20 || nextX > window.innerWidth - 20) {
    const edgeX = nextX < 20 ? 18 : window.innerWidth - 18;
    ctx.save();
    ctx.strokeStyle = "#142221";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(edgeX - direction * 7, world.ground - 60);
    ctx.lineTo(edgeX + direction * 4, world.ground - 51);
    ctx.lineTo(edgeX - direction * 7, world.ground - 42);
    ctx.stroke();
    ctx.strokeStyle = "#fff1bc";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
}

function drawCompassHint() {
  const direction = Math.sign(state.itemEffects.compassTargetX - state.player.x) || state.player.face || 1;
  const x = window.innerWidth * 0.5;
  const y = 92;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(20, 34, 33, 0.76)";
  roundedRect(-98, -23, 196, 46, 8);
  ctx.fill();
  ctx.fillStyle = "#f0bd6c";
  ctx.font = "900 14px Nunito";
  ctx.textAlign = "center";
  ctx.fillText(direction > 0 ? "→" : "←", 0, -2);
  ctx.fillStyle = "#f7f3df";
  ctx.font = "800 11px Nunito";
  ctx.fillText(state.itemEffects.compassLabel || "repere connu", 0, 14);
  ctx.restore();
}

function drawSecretWorldHud() {
  if (!state.activeSecretWorld) return;
  const remaining = Math.max(0, Math.ceil(state.activeSecretWorld.returnAt - state.time));
  const minutes = Math.floor(remaining / 60).toString().padStart(2, "0");
  const seconds = (remaining % 60).toString().padStart(2, "0");
  const secretWorld = getSecretWorldConfig();
  const x = window.innerWidth - 18;
  const y = 78;
  ctx.save();
  ctx.textAlign = "right";
  ctx.font = "900 13px Nunito";
  const title = secretWorld.name;
  const timer = `Retour dans ${minutes}:${seconds}`;
  const width = Math.max(ctx.measureText(title).width, ctx.measureText(timer).width) + 34;
  roundedRect(x - width, y - 44, width, 60, 7);
  ctx.fillStyle = "rgba(20, 34, 33, 0.72)";
  ctx.fill();
  ctx.strokeStyle = `${secretWorld.accent}88`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = secretWorld.accent;
  ctx.fillText(title, x - 16, y - 20);
  ctx.fillStyle = "#f7f3df";
  ctx.font = "800 12px Nunito";
  ctx.fillText(timer, x - 16, y + 2);
  ctx.restore();
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
  drawShootingStars();
  drawOverlay();
  drawWeather();
}

function drawShootingStars() {
  if (!shootingStars.length) return;
  ctx.save();
  shootingStars.forEach((star) => {
    const t = Math.max(0, Math.min(1, (state.time - star.startedAt) / star.duration));
    const alpha = Math.sin(t * Math.PI);
    const x = star.x + t * star.length;
    const y = star.y + t * star.length * 0.28;
    const tail = star.length * 0.38;
    const gradient = ctx.createLinearGradient(x - tail, y - tail * 0.28, x, y);
    gradient.addColorStop(0, "rgba(247, 243, 223, 0)");
    gradient.addColorStop(1, `rgba(247, 243, 223, ${0.72 * alpha})`);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - tail, y - tail * 0.28);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.fillStyle = `rgba(255, 224, 122, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function isModalOpen() {
  return Boolean(
    ui.discoveryDialog.open
    || ui.encyclopediaDetailDialog.open
    || ui.questDialog.open
    || ui.questCompleteDialog.open
    || ui.villagerDialog.open
    || ui.journalDialog.open
    || ui.customizeDialog.open
    || ui.optionsDialog.open
    || ui.infoDialog.open
    || (ui.cinematic.classList.contains("is-visible") && !ui.cinematic.classList.contains("is-nonblocking"))
  );
}

function clearMovementIntent() {
  pointer.active = false;
  pointer.worldX = state.player.x;
  joystick.active = false;
  joystick.x = 0;
  joystick.y = 0;
  joystick.jumpArmed = true;
  joystick.lastZone = "idle";
  ui.padKnob.style.transform = "translate(-50%, -50%)";
  updateMobilePadActionState("idle");
  state.player.vx = 0;
}

function resetTouchControls() {
  pointer.active = false;
  pointer.worldX = state.player.x;
  joystick.active = false;
  joystick.id = null;
  joystick.x = 0;
  joystick.y = 0;
  joystick.jumpArmed = true;
  joystick.lastZone = "idle";
  ui.padKnob.style.transform = "translate(-50%, -50%)";
  updateMobilePadActionState("idle");
}

function stopJoystick() {
  joystick.active = false;
  joystick.id = null;
  joystick.x = 0;
  joystick.y = 0;
  joystick.jumpArmed = true;
  joystick.lastZone = "idle";
  ui.padKnob.style.transform = "translate(-50%, -50%)";
  updateMobilePadActionState("idle");
}

function updateMobilePadModeState() {
  const runningMode = state.moveMode === "run";
  document.querySelectorAll(".move-mode-icon use").forEach((icon) => {
    icon.setAttribute("href", runningMode ? "#runIcon" : "#walkIcon");
  });
  ui.padModeButton.classList.toggle("is-active", runningMode);
  ui.padModeButton.setAttribute("aria-label", runningMode ? "Course : passer en marche" : "Marche : passer en course");
  document.querySelector(".guide-pad-mode").classList.toggle("is-active", runningMode);
}

function updateMobilePadCompanionState() {
  const unlocked = state.companion.unlocked;
  ui.padCompanionButton.classList.toggle("is-locked", !unlocked);
  ui.padCompanionButton.classList.toggle("is-hidden", unlocked && state.companion.present === false);
  ui.padCompanionButton.classList.toggle("is-active", unlocked && state.companion.present !== false);
  const guideCompanion = document.querySelector(".guide-pad-companion");
  guideCompanion.classList.toggle("is-hidden", unlocked && state.companion.present === false);
  guideCompanion.classList.toggle("is-active", unlocked && state.companion.present !== false);
  ui.padCompanionButton.setAttribute("aria-label", state.companion.present === false ? "Faire venir le compagnon" : "Cacher le compagnon");
}

function updateMobilePadActionState(zone = "idle") {
  ui.mobilePad.classList.toggle("is-jump", zone === "jump");
  document.querySelector(".guide-pad").classList.toggle("is-jump", zone === "jump");
  updateMobilePadModeState();
  updateMobilePadCompanionState();
}

function setJoystickZone(zone) {
  if (joystick.lastZone === zone) return;
  joystick.lastZone = zone;
  updateMobilePadActionState(zone);
  if (navigator.vibrate && zone === "jump") navigator.vibrate(18);
}

function updateJoystickFromPointer(event) {
  const rect = ui.mobilePad.getBoundingClientRect();
  const dx = event.clientX - rect.left - rect.width / 2;
  const dy = event.clientY - rect.top - rect.height / 2;
  const length = Math.hypot(dx, dy) || 1;
  const max = rect.width * 0.34;
  const clamped = Math.min(max, length);
  const radial = clamped / max;
  joystick.x = (dx / length) * radial;
  joystick.y = (dy / length) * radial;
  setJoystickZone("move");
  ui.padKnob.style.transform = `translate(calc(-50% + ${joystick.x * max}px), calc(-50% + ${joystick.y * max}px))`;
}

function setMoveMode(mode, announce = false) {
  const nextMode = mode === "run" ? "run" : "walk";
  if (state.moveMode === nextMode) return;
  state.moveMode = nextMode;
  joystick.mode = nextMode;
  updateMobilePadModeState();
  saveGame();
  if (announce) showMessage(nextMode === "run" ? "Course" : "Marche");
}

function toggleMoveMode() {
  setMoveMode(state.moveMode === "run" ? "walk" : "run", true);
}

function getInteractionTarget(visibleDiscoveries = getVisibleWorldDiscoveries(), visibleResidents = getVisibleVillageResidents()) {
  const p = state.player;
  const inRange = (entry, range) => Math.abs(entry.x - p.x) < range;
  const byAim = (a, b) => {
    const da = a.x - p.x;
    const db = b.x - p.x;
    const aFront = Math.sign(da || p.face) === p.face;
    const bFront = Math.sign(db || p.face) === p.face;
    return Number(bFront) - Number(aFront) || Math.abs(da) - Math.abs(db);
  };

  const item = visibleDiscoveries
    .filter((entry) => !hasCollectedDiscovery(entry) && inRange(entry, interactionRanges.item))
    .sort(byAim)[0];
  if (item) return { kind: "item", entry: item };

  const secret = getProceduralSecretLocations().filter((entry) => inRange(entry, interactionRanges.secret)).sort(byAim)[0];
  if (secret) return { kind: "secret", entry: secret };

  const letter = getProceduralLetters().filter((entry) => inRange(entry, interactionRanges.letter)).sort(byAim)[0];
  if (letter) return { kind: "letter", entry: letter };

  const companionGiver = getCompanionGiver();
  if (companionGiver && inRange(companionGiver, interactionRanges.companion)) return { kind: "companion", entry: companionGiver };

  const village = visibleResidents
    .filter((entry) => inRange(entry, interactionRanges.villager))
    .sort(byAim)[0];
  if (village) return { kind: "villager", entry: village };

  const landmark = getProceduralLandmarks().filter((entry) => inRange(entry, 112)).sort(byAim)[0];
  if (landmark) return { kind: "landmark", entry: landmark };

  const trailMarker = getProceduralTrailMarkers().filter((entry) => inRange(entry, 92)).sort(byAim)[0];
  if (trailMarker) return { kind: "trail-marker", entry: trailMarker };

  const lantern = getProceduralLanterns()
    .filter((entry) => !state.lanterns.includes(entry.id) && inRange(entry, interactionRanges.lantern))
    .sort(byAim)[0];
  if (lantern) return { kind: "lantern", entry: lantern };

  const rest = getProceduralRests().filter((entry) => inRange(entry, interactionRanges.rest)).sort(byAim)[0];
  if (rest) return { kind: "rest", entry: rest };

  return null;
}

function update(dt) {
  const p = state.player;
  if (isModalOpen()) {
    clearMovementIntent();
    p.y = getWalkSurfaceY(p.x);
    if (audio) updateAudio();
    updateMissionTracker();
    autosave();
    return;
  }
  state.time += dt;
  let input = 0;
  if (keys.has("ArrowLeft") || keys.has("q") || keys.has("Q") || keys.has("a") || keys.has("A")) input -= 1;
  if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) input += 1;
  if (joystick.active) input += joystick.x;
  input = Math.max(-1, Math.min(1, input));
  if (Math.abs(input) > 0.2) p.lastTravelDirection = Math.sign(input);
  if (state.friendlyChallenge?.readyAt > state.time) {
    input = 0;
    p.vx = 0;
  }

  const weather = getWeatherForChapter();
  const runTarget = isRunInput(input) && Math.abs(input) > 0.12 && p.rest <= 0.15 ? 1 : 0;
  p.runBlend += (runTarget - p.runBlend) * Math.min(1, dt * 3.8);
  const maxSpeed = getPlayerTargetSpeed(weather);
  const target = input * maxSpeed;
  p.vx += (target - p.vx) * Math.min(1, dt * 5.5);
  const beforeMoveX = p.x;
  p.previousX = beforeMoveX;
  p.x += p.vx * dt;
  const unclampedX = p.x;
  p.x = clampToPlayableWorldX(p.x);
  if (isInSecretWorld() && Math.abs(unclampedX - p.x) > 0.5 && Math.abs(input) > 0.2 && state.time - state.lastSecretEdgeMessageAt > 3) {
    state.lastSecretEdgeMessageAt = state.time;
    showMessageFor("Le bord de ce monde se replie. Reviens vers le chemin lumineux.", 2600);
  }
  p.y = getWalkSurfaceY(p.x);
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
  updateWeatherVisual(dt);
  updateReturningChallengeRunners(dt);
  updateFriendlyChallenge(dt);
  updateVillagerAwareness(dt, input);
  updateCompanion(dt);
  updateMobilePadCompanionState();
  updateQuestHint(dt);
  updateWorldDiscoveries(dt);
  updateDiscoveryBursts();
  updateMicroEvents(dt);
  updateSecretWorld(dt, input, beforeMoveX);
  updateSecretPortal();
  p.y = getWalkSurfaceY(p.x);
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
  const target = getInteractionTarget();
  if (target?.kind === "item") {
    collectDiscovery(target.entry);
    saveGame();
    return;
  }
  if (target?.kind === "letter") {
    readAncientLetter(target.entry);
    saveGame();
    return;
  }
  if (target?.kind === "secret") {
    enterSecretWorld(target.entry);
    saveGame();
    return;
  }
  if (target?.kind === "companion") {
    offerCompanion(target.entry);
    saveGame();
    return;
  }
  if (target?.kind === "villager") {
    advanceQuest("talkVillager", 1);
    if (!state.pendingQuestReward) openVillagerHelp(target.entry);
    saveGame();
    return;
  }
  if (target?.kind === "landmark") {
    visitLandmark(target.entry);
    saveGame();
    return;
  }
  if (target?.kind === "trail-marker") {
    consultTrailMarker(target.entry);
    saveGame();
    return;
  }
  if (target?.kind === "lantern") {
    state.lanterns.push(target.entry.id);
    showMessage("Lanterne allumee.");
    playSoftPing();
    saveGame();
    return;
  }
  if (target?.kind === "rest") {
    p.rest = 1;
    showMessage("Repos. La marche ralentit.");
    saveGame();
    return;
  }

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
  rememberJournalEvent(`${weather.label}: le paysage a change de rythme pendant la promenade.`);
}

function baseDiscoveryId(id) {
  if (typeof id !== "string") return "";
  if (itemCatalog.some((entry) => entry.id === id) || discoveries.some((entry) => entry.id === id)) return id;
  const parts = id.split("-");
  if (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) return parts.slice(0, -1).join("-");
  return id;
}

function hasCollectedBaseItem(itemId) {
  return state.discoveries.some((id) => baseDiscoveryId(id) === itemId);
}

function hasInventoryItem(itemId) {
  return (state.inventory[baseDiscoveryId(itemId)] || 0) > 0;
}

function getWeatherProtection(weatherId = state.weather) {
  if (weatherId === "rain") {
    return hasInventoryItem("leaf") || hasInventoryItem("shell");
  }
  if (weatherId === "mist") {
    return state.itemEffects?.glowUntil > state.time || state.equipment?.lanternOn;
  }
  if (weatherId === "snow") {
    return state.itemEffects?.glowUntil > state.time || state.equipment?.lanternOn;
  }
  return false;
}

function getWeatherSpeedFactor(weather = getWeatherForChapter()) {
  const protectedFromWeather = getWeatherProtection(weather.id);
  return !protectedFromWeather && (weather.id === "rain" || weather.id === "snow") ? 0.82 : 1;
}

function getPlayerTargetSpeed(weather = getWeatherForChapter()) {
  const calmSpeed = state.player.rest > 0.15 ? 55 : playerWalkSpeed;
  const strideBoost = state.itemEffects?.strideUntil > state.time ? 1.08 : 1;
  return calmSpeed * getWeatherSpeedFactor(weather) * (1 + state.player.runBlend * (playerRunMultiplier - 1)) * strideBoost;
}

function isRunInput(input = 0) {
  return Boolean(
    state.moveMode === "run"
    || keys.has("R")
    || keys.has("r")
  );
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
  const baseId = baseDiscoveryId(itemId);
  if (baseId === portalInvokerItemId) return "Consommable rare : invoque un portail vers un monde temporaire, sans modifier le cycle naturel.";
  if (baseId === companionChangerItemId) {
    return state.companion.unlocked
      ? "Consommable rare : permet de choisir un autre animal pour t'accompagner."
      : "Consommable rare : permet de choisir ton premier compagnon.";
  }
  const item = getCatalogItem(itemId);
  const label = (item?.label || "").toLowerCase();
  if (label.includes("boussole")) return "Consommable : indique pendant un moment la direction d'un lieu deja connu ou de l'objectif actif.";
  if (label.includes("lanterne")) return "Equipement permanent : allume ou eteint une petite lueur autour de toi.";
  const typeUses = {
    leaf: "Exploration : consomme une feuille et entoure pendant 75 secondes une trouvaille proche.",
    stone: "Materiau de mission : les habitants peuvent en demander pour reparer le village.",
    shell: "Objet de mission et de collection lie aux zones humides.",
    cone: "Mouvement : consomme une graine ou une pomme de pin pour un leger elan temporaire.",
    mushroom: "Exploration : consomme un champignon pour produire une douce lueur temporaire.",
    flower: "Cadeau : offre-la a l'habitant pres de toi pour renforcer doucement votre relation.",
    paper: "Objet de collection. Certaines missions peuvent demander des objets de cette famille.",
    tool: "Objet de collection, sauf boussole ou lanterne qui possedent une action propre.",
    rare: "Objet de collection rare. Son interet depend de sa fiche individuelle.",
    charm: "Objet de collection du Carnet."
  };
  const typeUse = typeUses[getItemVisualType(item || { id: baseId })];
  if (typeUse) return typeUse;
  if (item && item.use) return item.use;
  const need = villagerNeeds.find((entry) => entry.itemId === baseDiscoveryId(itemId));
  return need ? need.use : "Servira peut-etre plus loin sur la route.";
}

function getReservedMissionQuantity(itemId) {
  if (!state.activeQuest || state.activeQuest.itemId !== baseDiscoveryId(itemId)) return 0;
  return Math.max(0, (state.activeQuest.target || 0) - (state.activeQuest.progress || 0));
}

function getAvailableItemQuantity(itemId) {
  const baseId = baseDiscoveryId(itemId);
  return Math.max(0, (state.inventory[baseId] || 0) - getReservedMissionQuantity(baseId));
}

function getItemAction(itemId) {
  const baseId = baseDiscoveryId(itemId);
  const item = getCatalogItem(baseId);
  const label = (item?.label || "").toLowerCase();
  if (baseId === portalInvokerItemId) return { label: "Utiliser", kind: "portal" };
  if (baseId === companionChangerItemId) return { label: state.companion.unlocked ? "Changer" : "Choisir", kind: "companion" };
  if (label.includes("boussole")) return { label: "Utiliser", kind: "compass" };
  if (label.includes("lanterne")) return { label: state.equipment.lanternOn ? "Eteindre" : "Allumer", kind: "lantern" };
  const type = getItemVisualType(item || baseId);
  if (type === "leaf") return { label: "Reperer", kind: "scout" };
  if (type === "cone") return { label: "Prendre elan", kind: "stride" };
  if (type === "mushroom") return { label: "Allumer une lueur", kind: "glow" };
  if (type === "flower" || /fruit|baie|pomme/.test(label)) return { label: "Offrir", kind: "gift" };
  return null;
}

function getItemUsageStatus(itemId) {
  const action = getItemAction(itemId);
  if (!action) return "Collection ou mission";
  if (action.kind === "lantern") return "Equipement permanent";
  if (action.kind === "gift") return "Consommable a offrir";
  return "Consommable";
}

function consumeItem(itemId) {
  const baseId = baseDiscoveryId(itemId);
  if (getAvailableItemQuantity(baseId) < 1) return false;
  state.inventory[baseId] -= 1;
  saveGame();
  return true;
}

function invokePortalFromItem() {
  if (itemUseInProgress || getAvailableItemQuantity(portalInvokerItemId) < 1) return;
  if (isInSecretWorld() || state.activeSecretPortal) {
    showMessage("Un portail est deja present ou en cours d'exploration.");
    return;
  }
  itemUseInProgress = true;
  createSecretPortal("manual");
  if (!state.activeSecretPortal || !consumeItem(portalInvokerItemId)) {
    state.activeSecretPortal = null;
    itemUseInProgress = false;
    showMessage("Le portail n'a pas pu apparaitre. L'objet a ete conserve.");
    return;
  }
  closeDialog(ui.encyclopediaDetailDialog);
  closeDialog(ui.journalDialog);
  showSecretTransition("Une etoile ouvre un passage pres de toi.");
  itemUseInProgress = false;
}

function useScoutItem(itemId) {
  if (itemUseInProgress || getAvailableItemQuantity(itemId) < 1) return;
  ensureVisibleDiscoveryZones();
  const target = getVisibleWorldDiscoveries().find((item) => !item.collected && !item.missionItem && !item.grounded);
  if (!target) {
    showMessage("Aucune trouvaille proche a reperer pour le moment.");
    return;
  }
  itemUseInProgress = true;
  state.itemEffects.scoutTargetId = target.id;
  state.itemEffects.scoutUntil = state.time + 75;
  if (!consumeItem(itemId)) {
    state.itemEffects.scoutTargetId = "";
    state.itemEffects.scoutUntil = 0;
    itemUseInProgress = false;
    return;
  }
  closeDialog(ui.encyclopediaDetailDialog);
  closeDialog(ui.journalDialog);
  showMessage("Une feuille indique une trouvaille proche.");
  itemUseInProgress = false;
}

function useStrideItem(itemId) {
  if (itemUseInProgress || getAvailableItemQuantity(itemId) < 1) return;
  itemUseInProgress = true;
  state.itemEffects.strideUntil = state.time + 45;
  if (!consumeItem(itemId)) {
    state.itemEffects.strideUntil = 0;
    itemUseInProgress = false;
    return;
  }
  closeDialog(ui.encyclopediaDetailDialog);
  closeDialog(ui.journalDialog);
  showMessage("Tes pas sont un peu plus legers pendant un moment.");
  itemUseInProgress = false;
}

function useGlowItem(itemId) {
  if (itemUseInProgress || getAvailableItemQuantity(itemId) < 1) return;
  itemUseInProgress = true;
  state.itemEffects.glowUntil = state.time + 100;
  if (!consumeItem(itemId)) {
    state.itemEffects.glowUntil = 0;
    itemUseInProgress = false;
    return;
  }
  closeDialog(ui.encyclopediaDetailDialog);
  closeDialog(ui.journalDialog);
  showMessage("Une lueur douce t'accompagne pendant un moment.");
  itemUseInProgress = false;
}

function getCompassTarget() {
  if (state.activeQuest?.itemId) {
    const targetX = state.activeQuest.missionSlots?.[state.activeQuest.progress] || state.activeQuest.spawnX;
    if (Number.isFinite(targetX)) return { x: targetX, label: "objectif de mission" };
  }
  const residents = getVisibleVillageResidents();
  const known = residents.find((resident) => state.villagerRelations[getVillagerKey(resident)] || state.villagerRelations[resident.role]);
  if (known) return { x: known.x, label: known.villageName || "village connu" };
  const knownVillageKey = Object.keys(state.villagerRelations).find((key) => /^village-\d+$/.test(key));
  if (knownVillageKey) {
    const chapter = Number(knownVillageKey.split("-")[1]);
    return { x: chapter * world.chapterSize, label: "village connu" };
  }
  const village = getProceduralVillages()[0];
  return village ? { x: village.x, label: village.name } : null;
}

function useCompassItem(itemId) {
  if (itemUseInProgress || getAvailableItemQuantity(itemId) < 1) return;
  const target = getCompassTarget();
  if (!target) {
    showMessage("La boussole ne trouve encore aucun repere connu.");
    return;
  }
  itemUseInProgress = true;
  state.itemEffects.compassUntil = state.time + 80;
  state.itemEffects.compassTargetX = target.x;
  state.itemEffects.compassLabel = target.label;
  if (!consumeItem(itemId)) {
    state.itemEffects.compassUntil = 0;
    itemUseInProgress = false;
    return;
  }
  closeDialog(ui.encyclopediaDetailDialog);
  closeDialog(ui.journalDialog);
  showMessage(`La boussole indique ${target.label}.`);
  itemUseInProgress = false;
}

function toggleLanternEquipment() {
  state.equipment.lanternOn = !state.equipment.lanternOn;
  saveGame();
  showMessage(state.equipment.lanternOn ? "Lanterne allumee." : "Lanterne eteinte.");
  openEncyclopediaDetail(ui.encyclopediaDetailTitle.dataset.itemId);
}

function getGiftTarget() {
  return getVisibleVillageResidents()
    .filter((villager) => Math.abs(villager.x - state.player.x) < interactionRanges.villager)
    .sort((a, b) => Math.abs(a.x - state.player.x) - Math.abs(b.x - state.player.x))[0] || null;
}

function offerGiftItem(itemId) {
  if (itemUseInProgress || getAvailableItemQuantity(itemId) < 1) return;
  const villager = getGiftTarget();
  if (!villager) {
    showMessage("Approche-toi d'un habitant pour offrir ce cadeau.");
    return;
  }
  itemUseInProgress = true;
  if (!consumeItem(itemId)) {
    itemUseInProgress = false;
    return;
  }
  const memory = getVillagerMemory(villager);
  memory.relation += 0.45;
  memory.gifts.push({ itemId: baseDiscoveryId(itemId), amount: 1, at: new Date().toISOString() });
  const replies = {
    reserve: ["Merci. Je vais la garder pres de l'eau.", "C'est gentil. Je ne m'y attendais pas."],
    chaleureuse: ["Oh, merci. Cette attention me touche.", "Tu es adorable de penser a moi."],
    attentif: ["Merci. Je saurai en faire bon usage.", "C'est un beau geste."],
    energique: ["Pour moi ? Trop bien, merci !", "Je vais la montrer a tout le village !"],
    reveur: ["Merci. Elle trouvera sa place dans ma chanson.", "Quelle jolie attention."],
    drole: ["Je confirme : c'est un excellent cadeau.", "Tu viens de gagner un point dans mon inventaire imaginaire."],
    curieux: ["Merci. Je me demande d'ou elle vient.", "Je vais la noter dans mes petites observations."]
  };
  closeDialog(ui.encyclopediaDetailDialog);
  closeDialog(ui.journalDialog);
  showVillagerBubble(villager, pickLine(replies[getVillagerPersonality(villager).mood] || replies.reserve, state.time + villager.x), { cooldown: 18, force: true });
  showMessage(`Cadeau offert a ${villager.role}. Votre relation grandit.`);
  saveGame();
  itemUseInProgress = false;
}

function openCompanionSelector() {
  if (itemUseInProgress || getAvailableItemQuantity(companionChangerItemId) < 1) return;
  pendingCompanionSpecies = "";
  ui.companionConfirmActions.hidden = true;
  ui.companionSelectGrid.innerHTML = companionSpecies.map((companion) => `
    <button class="companion-select-option" type="button" data-companion-species="${companion.species}">
      <span class="companion-portrait">${getCompanionPickerIcon(companion.species)}</span>
      <strong>${companion.name}</strong>
      <small>${companion.species}</small>
    </button>
  `).join("");
  openDialog(ui.companionSelectDialog);
}

function getCompanionPickerIcon(species) {
  return { Renard: "🦊", Chat: "🐈", Lapin: "🐇", Herisson: "🦔", Chien: "🐕", Ecureuil: "🐿", "Petit oiseau": "🐦" }[species] || "🐾";
}

function selectCompanionSpecies(species) {
  if (!companionSpecies.some((entry) => entry.species === species)) return;
  pendingCompanionSpecies = species;
  ui.companionSelectGrid.querySelectorAll(".companion-select-option").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.companionSpecies === species);
  });
  ui.companionConfirmActions.hidden = false;
  guardDynamicControls(ui.companionConfirmActions);
}

function confirmCompanionChange() {
  if (itemUseInProgress || !pendingCompanionSpecies) return;
  const picked = companionSpecies.find((entry) => entry.species === pendingCompanionSpecies);
  if (!picked || !consumeItem(companionChangerItemId)) return;
  itemUseInProgress = true;
  const choosingFirstCompanion = !state.companion.unlocked;
  const wasPresent = choosingFirstCompanion || state.companion.present !== false;
  state.companion = {
    ...state.companion,
    ...picked,
    unlocked: true,
    offered: true,
    giver: choosingFirstCompanion ? "Une plume trouvee" : state.companion.giver,
    metAt: choosingFirstCompanion ? new Date().toISOString() : state.companion.metAt,
    walks: choosingFirstCompanion ? 0 : state.companion.walks,
    finds: choosingFirstCompanion ? 0 : state.companion.finds,
    nextHelpAt: state.time + 55,
    present: wasPresent,
    x: state.player.x - state.player.face * 90,
    y: world.ground,
    pace: 0,
    transitionUntil: state.time + 1.2
  };
  if (choosingFirstCompanion) rememberJournalEvent(`Une plume m'a permis de choisir ${picked.name}, un ${picked.species.toLowerCase()}.`);
  pendingCompanionSpecies = "";
  closeDialog(ui.companionSelectDialog);
  closeDialog(ui.encyclopediaDetailDialog);
  closeDialog(ui.journalDialog);
  saveGame();
  updateMobilePadCompanionState();
  showMessage(`${picked.name} t'accompagne maintenant.`);
  itemUseInProgress = false;
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
  if (baseId === "leaf" || label.includes("feuille") || label.includes("foug") || label.includes("branche") || label.includes("ecorce") || label.includes("roseau") || label.includes("herbe")) return "leaf";
  if (baseId === "stone" || label.includes("pierre") || label.includes("galet") || label.includes("silex") || label.includes("rune") || label.includes("cristal") || label.includes("gemme") || label.includes("ambre")) return "stone";
  if (baseId === "feather" || label.includes("plume") || label.includes("aile")) return "feather";
  if (baseId === "shell" || label.includes("coquillage") || label.includes("coquille") || label.includes("coque")) return "shell";
  if (baseId === "cone" || label.includes("pomme de pin") || label.includes("noisette") || label.includes("graine") || label.includes("pin")) return "cone";
  if (baseId === "mushroom" || label.includes("champignon")) return "mushroom";
  if (baseId === "star" || label.includes("etoile") || label.includes("soleil") || label.includes("lucioles") || label.includes("lumiere")) return "star";
  if (baseId.includes("flower") || baseId.includes("bloom") || label.includes("fleur") || label.includes("petale") || label.includes("rose")) return "flower";
  if (label.includes("carte") || label.includes("note") || label.includes("sceau") || label.includes("lettre") || label.includes("enveloppe")) return "paper";
  if (label.includes("clef") || label.includes("boussole") || label.includes("medaille") || label.includes("bague") || label.includes("miroir") || label.includes("fiole") || label.includes("lanterne")) return "tool";
  if (item.rarity === "Rare" || item.rarity === "Legendaire") return "rare";
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
    rare: "Lieu : monde rare ou passage special. Condition : demande de l'exploration patiente.",
    charm: "Lieu : chemin d'exploration. Condition : peut apparaitre dans plusieurs zones."
  };
  return hints[type] || hints.charm;
}

function getItemIcon(item, extraClass = "") {
  const type = getItemVisualType(item);
  return `<span class="item-icon item-icon-${type} ${extraClass}" aria-hidden="true">
    <span class="item-shape item-shape-main"></span>
    <span class="item-shape item-shape-detail"></span>
    <span class="item-shape item-shape-accent"></span>
  </span>`;
}

function getUnknownItemIcon() {
  return `<span class="item-icon item-icon-unknown" aria-hidden="true"><span>?</span></span>`;
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
  if (isInSecretWorld() || x >= secretWorldOffset) return getSecretWorldConfig().name;
  const secret = getProceduralSecretLocations().find((entry) => state.openedSecrets.includes(entry.id) && Math.abs(x - entry.x) < 420);
  if (secret) return "Lieu secret";
  const landmark = getProceduralLandmarks().find((entry) => Math.abs(x - entry.x) < 150);
  if (landmark) return landmark.name;
  const nearVillage = getProceduralVillages().some((village) => Math.abs(x - (village.x + 170)) < 620);
  if (nearVillage) return "Village";
  if (getRiverCrossings(x - 520, x + 520).some((bridge) => Math.abs(x - bridge.x) < 520)) return "Riviere";
  if (getBiome(x).name.toLowerCase().includes("nuit") || state.chapter % 8 === 0) return "Montagne";
  return "Foret";
}

function rememberPlace(place) {
  if (!state.discoveredPlaces.includes(place)) {
    state.discoveredPlaces.push(place);
    rememberJournalEvent(`J'ai decouvert ${place.toLowerCase()} et ajoute ce lieu a ma carte.`);
  }
}

function visitLandmark(landmark) {
  const firstVisit = !state.visitedLandmarks.includes(landmark.id);
  if (!firstVisit) {
    showMessage(`Tu retrouves ${landmark.name.toLowerCase()}.`);
    return;
  }
  state.visitedLandmarks.push(landmark.id);
  rememberPlace(landmark.name);
  advanceQuest("landmark", 1);
  const reward = getCatalogItem(landmark.rewardId);
  if (landmark.type === "cabin") {
    state.player.rest = 1;
    state.itemEffects.glowUntil = Math.max(state.itemEffects.glowUntil || 0, state.time + 65);
  } else if (landmark.type === "clearing") {
    state.itemEffects.strideUntil = Math.max(state.itemEffects.strideUntil || 0, state.time + 40);
  } else if (landmark.type === "marker") {
    const target = getCompassTarget();
    if (target) {
      state.itemEffects.compassUntil = state.time + 60;
      state.itemEffects.compassTargetX = target.x;
      state.itemEffects.compassLabel = target.label;
    }
  }
  if (reward) collectDiscovery({ ...reward, id: makeId(`landmark-${reward.id}`, Math.floor(state.time * 10)), place: landmark.name }, true);
  showMessage(`${landmark.name} ajoute a ta carte.${reward ? ` ${reward.label} rejoint ton sac.` : ""}`);
  rememberJournalEvent(`J'ai pris le temps de visiter ${landmark.name.toLowerCase()}.`);
  updateAchievements();
}

function consultTrailMarker(marker) {
  const villageX = world.firstRouteEnd + 520 + marker.nextVillageIndex * villageSpacing;
  const distance = Math.max(0, Math.round((villageX - marker.x) / 1000));
  if (!state.visitedLandmarks.includes(marker.id)) state.visitedLandmarks.push(marker.id);
  showMessage(distance > 0
    ? `Le repere indique : Village ${marker.nextVillageIndex + 1} a environ ${distance} km.`
    : `Le repere indique : Village ${marker.nextVillageIndex + 1} tout pres.`);
  rememberJournalEvent(`J'ai consulte un repere sur la route du village ${marker.nextVillageIndex + 1}.`);
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
      showMessage(`Succes : ${achievement.label}`);
    }
  });
}

function updateCompanion(dt) {
  if (!state.companion.unlocked) return;
  updateCompanionMovement(dt);
  if (state.time < state.companion.nextHelpAt) return;
  state.companion.nextHelpAt = state.time + 55 + hashNumber(state.time + state.player.x) * 45;
  if (state.activeQuest || state.pendingQuestReward) return;
  const common = itemCatalog.filter((item) => item.rarity === "Commun");
  const item = common[Math.floor(hashNumber(state.player.x + state.time) * common.length) % common.length];
  if (item) {
    collectDiscovery({ ...item, id: makeId(item.id, state.chapter + state.companion.finds + 80) }, true);
    state.companion.finds += 1;
    showMessage(`Compagnon : ${item.label}`);
    saveGame();
  }
}

function updateCompanionMovement(dt) {
  const companion = state.companion;
  if (!companion.present) return;
  if (!Number.isFinite(companion.x)) companion.x = state.player.x - state.player.face * 86;
  const preferredSide = state.player.face || 1;
  const targetX = state.player.x - preferredSide * 86;
  const dx = targetX - companion.x;
  const distance = Math.abs(dx);
  if (distance > 920 || isInSecretWorld()) {
    companion.x = state.player.x - preferredSide * 78;
    companion.y = getWalkSurfaceY(companion.x);
    companion.pace = 0;
    companion.transitionUntil = state.time + 0.8;
    return;
  }
  const wantsRun = state.player.runBlend > 0.28 || distance > 155;
  const targetPace = wantsRun ? 1 : 0;
  companion.pace += (targetPace - (companion.pace || 0)) * Math.min(1, dt * 2.8);
  const walkCatch = playerWalkSpeed * 0.72;
  const runCatch = playerWalkSpeed * playerRunMultiplier * 1.12;
  const catchSpeed = walkCatch + companion.pace * (runCatch - walkCatch);
  const step = Math.sign(dx) * Math.min(distance, catchSpeed * dt);
  companion.x += step;
  companion.y = getWalkSurfaceY(companion.x);
}

function toggleCompanionPresence() {
  if (!state.companion.unlocked) return;
  state.companion.present = !state.companion.present;
  state.companion.transitionUntil = state.time + 1.2;
  if (state.companion.present) {
    state.companion.x = state.player.x - state.player.face * 90;
    state.companion.y = getWalkSurfaceY(state.companion.x);
  }
  saveGame();
  buildJournal();
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
    nextHelpAt: state.time + 55,
    present: true,
    x: state.player.x - state.player.face * 88,
    y: world.ground,
    pace: 0,
    transitionUntil: state.time + 1.2
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
  openDialog(ui.companionDialog);
}

function enterSecretWorld(secret) {
  if (isInSecretWorld()) return;
  const secretWorld = pickSecretWorldConfig();
  const firstOpen = !state.openedSecrets.includes(secret.id);
  if (firstOpen) {
    state.openedSecrets.push(secret.id);
    rememberPlace(secret.name);
    advanceQuest("secret", 1);
  }
  state.activeSecretWorld = {
    id: secret.id,
    name: secret.name,
    source: secret.source || "natural",
    worldId: secretWorld.id,
    worldName: secretWorld.name,
    zoneKey: makeId("secret-world", state.openedSecrets.length || 1),
    startedAt: state.time,
    returnAt: state.time + secretWorldDurationSeconds,
    returnX: state.player.x,
    returnCameraX: state.camera.x,
    returnChapter: state.chapter,
    returnWeather: state.weather,
    lastX: secretWorldOffset + 260,
    stuckSince: 0,
    forceReturnAt: state.time + secretWorldDurationSeconds + 5
  };
  state.activeSecretPortal = null;
  state.player.x = secretWorldOffset + 260;
  state.player.vx = 0;
  state.player.rest = 0;
  state.camera.x = secretWorldOffset;
  ensureSecretWorldDiscoveries();
  showSecretTransition(`${secretWorld.entry}\nRetour dans 01:00.`);
  updateAchievements();
  playSoftPing();
}

function updateSecretWorld(dt = 0, input = 0, beforeMoveX = state.player.x) {
  const secretWorld = state.activeSecretWorld;
  if (!secretWorld) return;
  const moved = Math.abs(state.player.x - beforeMoveX);
  const waitingForReturn = state.time < secretWorld.returnAt;
  const tryingToMove = Math.abs(input) > 0.2;
  const barelyMoved = moved < 0.1;
  const atWorldEdge = isPushingSecretWorldEdge(input);
  if (tryingToMove && barelyMoved && !atWorldEdge && waitingForReturn) {
    if (!secretWorld.stuckSince) secretWorld.stuckSince = state.time;
  } else {
    secretWorld.stuckSince = 0;
  }
  if (secretWorld.stuckSince && state.time - secretWorld.stuckSince > 5) {
    leaveSecretWorld("force");
    return;
  }
  if (state.time >= secretWorld.returnAt) {
    leaveSecretWorld(state.time > (secretWorld.forceReturnAt || secretWorld.returnAt + 5) ? "force" : "auto");
  }
}

function leaveSecretWorld(reason = "auto") {
  const secretWorld = state.activeSecretWorld;
  if (!secretWorld) return;
  clearSecretWorldTransition();
  pointer.active = false;
  joystick.active = false;
  joystick.x = 0;
  joystick.y = 0;
  ui.padKnob.style.transform = "translate(-50%, -50%)";
  state.player.x = Number.isFinite(secretWorld.returnX) ? secretWorld.returnX : world.firstRouteEnd;
  state.player.vx = 0;
  state.player.rest = 0;
  state.player.action = "";
  state.player.actionUntil = 0;
  state.camera.x = Number.isFinite(secretWorld.returnCameraX) ? secretWorld.returnCameraX : Math.max(0, state.player.x - window.innerWidth * 0.45);
  state.chapter = Number.isFinite(secretWorld.returnChapter) ? secretWorld.returnChapter : getChapter(state.player.x);
  state.weather = secretWorld.returnWeather || getWeatherForChapter(state.chapter).id;
  Object.values(state.worldDiscoveries).forEach((item) => {
    if (item.zoneKey === secretWorld.zoneKey) delete state.worldDiscoveries[item.id];
  });
  state.lastSecretWorldId = secretWorld.worldId || state.lastSecretWorldId;
  state.activeSecretWorld = null;
  if (secretWorld.source !== "manual") scheduleNextSecretPortal();
  showSecretTransition(reason === "force"
    ? "Le passage te ramene avant que le chemin ne se bloque."
    : "Tu reviens exactement la ou la porte t'avait trouve.");
  saveGame();
}

function showTransition(text) {
  secretTransitionToken += 1;
  ui.cinematic.classList.remove("is-nonblocking");
  ui.cinematicText.textContent = text;
  ui.cinematic.classList.add("is-visible");
  setTimeout(() => ui.cinematic.classList.remove("is-visible"), 1400);
}

function showSecretTransition(text) {
  secretTransitionToken += 1;
  const token = secretTransitionToken;
  ui.cinematicText.textContent = text;
  ui.cinematic.classList.add("is-nonblocking");
  ui.cinematic.classList.add("is-visible");
  setTimeout(() => {
    if (token === secretTransitionToken) clearSecretWorldTransition();
  }, 1200);
}

function clearSecretWorldTransition() {
  secretTransitionToken += 1;
  ui.cinematic.classList.remove("is-visible");
  ui.cinematic.classList.remove("is-nonblocking");
}

const questTemplates = [
  { title: "Collection de coquillages", description: "Ramasse 6 coquillages pendentifs d'exploration.", objective: "Ramasser 6 coquillages.", type: "collect:shell", itemId: "shell", target: 6, hint: "Indice : les coquillages apparaissent pres de la riviere. Ils sont repartis dans le monde et demandent un peu d'exploration." },
  { title: "Herbier nervure", description: "Ramasse 5 feuilles nervurees pour completer une page du carnet.", objective: "Ramasser 5 feuilles nervurees.", type: "collect:leaf", itemId: "leaf", target: 5, hint: "Indice : les feuilles nervurees apparaissent en foret et dans les clairieres. Cherche-les dans plusieurs zones." },
  { title: "Lueurs du sous-bois", description: "Trouve 3 champignons lumineux pres des passages humides.", objective: "Trouver 3 champignons lumineux.", type: "collect:mushroom", itemId: "mushroom", target: 3, hint: "Indice : les champignons lumineux poussent dans les zones sombres ou humides. Ils ne se trouvent pas tous au meme endroit." },
  { title: "Pierres anciennes", description: "Ramasse 8 pierres anciennes ou polies sur le chemin.", objective: "Ramasser 8 pierres anciennes.", type: "collect:stone", itemId: "stone", target: 8, hint: "Indice : les pierres anciennes se trouvent pres des rivieres, des montagnes et des vieux sentiers. Continue d'explorer pour les retrouver." },
  { title: "Fleurs sauvages", description: "Decouvre 4 fleurs sauvages pendant l'exploration.", objective: "Decouvrir 4 fleurs sauvages.", type: "collectFlower", itemId: "flower", target: 4, hint: "Indice : les fleurs sauvages aiment les clairieres et le printemps. Elles apparaissent naturellement sur la route." },
  { title: "Voix du village", description: "Rencontre 5 habitants et ecoute leurs histoires.", objective: "Rencontrer 5 habitants.", type: "talkVillager", target: 5, hint: "Indice : avance jusqu'aux villages et parle aux habitants quand l'invite apparait." },
  { title: "Chemins nouveaux", description: "Atteins le prochain village sur la route.", objective: "Explorer un nouveau village.", type: "village", target: 1, hint: "Indice : les reperes de bois indiquent la distance jusqu'au prochain village." }
];

function makeQuest(seed = Math.floor(state.player.x + state.time * 1000)) {
  const template = questTemplates[Math.floor(hashNumber(seed) * questTemplates.length) % questTemplates.length];
  const spawnX = state.player.x + missionItemFirstDistance;
  const missionSlots = template.itemId
    ? Array.from({ length: template.target }, (_, index) => {
      return getMissionSlotX(spawnX, index);
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
  if (state.activeQuest.itemId) state.activeQuest.nextMissionRevealAt = state.time + getMissionRevealDelay();
  if (state.activeQuest.progress >= state.activeQuest.target) {
    completedMissionNotice = { ...state.activeQuest };
    showMissionTracker("complete", completedMissionNotice);
    completeQuest();
    return;
  }
  showMissionTracker("progress", state.activeQuest);
}

function updateQuestHint() {
  if (!state.activeQuest || state.pendingQuestReward) return;
  if (state.time - state.questLastProgressAt < 60) return;
  if (state.time - state.lastQuestHintAt < 90) return;
  state.lastQuestHintAt = state.time;
  const hint = getQuestSearchHint(state.activeQuest);
  if (hint) showMessageFor(hint, 3600);
}

function updateWorldDiscoveries(dt = 1 / 60) {
  Object.entries(state.discoveryVacancies || {}).forEach(([id, vacancy]) => {
    if (!vacancy || vacancy.until <= state.time) delete state.discoveryVacancies[id];
  });
  Object.values(state.worldDiscoveries).forEach((item) => {
    if (item.rolling && !item.collected) {
      updateRollingDiscovery(item, dt);
    }
    if (item.grounded && !item.collected && Number.isFinite(item.expiresAt) && state.time >= item.expiresAt && Math.abs(item.x - state.player.x) > window.innerWidth * 2.2) {
      delete state.worldDiscoveries[item.id];
      return;
    }
    if (item.missionItem && (!state.activeQuest || item.zoneKey !== `mission-${state.activeQuest.id}`)) {
      delete state.worldDiscoveries[item.id];
      return;
    }
    if (item.collected && Number.isFinite(item.respawnAt) && state.time >= item.respawnAt) {
      item.x = placeXClearOfInteractions(item.x + 360 + hashNumber(state.time + item.x) * 900, { sourceItem: item });
      item.place = getPlaceType(item.x);
      item.collected = false;
      item.respawnAt = 0;
      delete state.discoveryRespawns[item.id];
    }
  });
}

function updateDiscoveryBursts() {
  for (let index = discoveryBursts.length - 1; index >= 0; index -= 1) {
    const particle = discoveryBursts[index];
    if (state.time - particle.startedAt >= particle.duration) discoveryBursts.splice(index, 1);
  }
}

function getFriendlyChallengeReward(challenge) {
  const rareItems = itemCatalog.filter((item) => item.rarity === "Rare" || item.rarity === "Legendaire");
  const fallback = itemCatalog.filter((item) => item.rarity !== "Legendaire");
  const pool = rareItems.length ? rareItems : fallback;
  return pool[Math.floor(hashNumber(challenge.targetX + challenge.startedAt * 13) * pool.length) % pool.length];
}

function createFriendlyChallengeRoute(startX, targetX) {
  const direction = Math.sign(targetX - startX) || 1;
  return [
    { id: "rock-1", type: "rock", x: startX + direction * 720, radius: 24, playerPassed: false, runnerPassed: false, lastBlockedAt: -Infinity },
    { id: "rock-2", type: "rock", x: startX + direction * 2420, radius: 26, playerPassed: false, runnerPassed: false, lastBlockedAt: -Infinity },
    { id: "rock-3", type: "rock", x: startX + direction * 5320, radius: 24, playerPassed: false, runnerPassed: false, lastBlockedAt: -Infinity }
  ].map((rock) => {
    const bridge = getRiverCrossings(rock.x, rock.x)
      .find((entry) => rock.x >= entry.waterLeft - 60 && rock.x <= entry.waterRight + 60);
    if (bridge) rock.x = direction > 0 ? bridge.right + 100 : bridge.left - 100;
    return rock;
  });
}

function isPastChallengePoint(x, pointX, direction) {
  return (x - pointX) * direction >= 0;
}

function updateChallengePlayerRoute(challenge) {
  const direction = Math.sign(challenge.targetX - challenge.startX) || 1;
  const player = state.player;
  (challenge.route || []).forEach((obstacle) => {
    if (obstacle.playerPassed) return;
    const distance = (player.x - obstacle.x) * direction;
    const previousDistance = ((player.previousX ?? player.x) - obstacle.x) * direction;
    const crossed = previousDistance < -obstacle.radius && distance >= -obstacle.radius;
    if (!crossed && (distance < -obstacle.radius || distance > obstacle.radius)) return;
    const isHopping = player.action === "hop" && player.actionUntil > state.time;
    if (isHopping) {
      obstacle.playerPassed = true;
      playSoftPing();
      return;
    }
    player.x = obstacle.x - direction * (obstacle.radius + 30);
    player.vx = 0;
    player.runBlend *= 0.45;
    if (state.time - obstacle.lastBlockedAt > 1.2) {
      obstacle.lastBlockedAt = state.time;
      showMessage("Un obstacle bloque le chemin. Saute pour le franchir.");
    }
  });
}

function updateChallengeRunnerRoute(challenge, runner) {
  const direction = Math.sign(challenge.targetX - challenge.startX) || runner.direction || 1;
  (challenge.route || []).forEach((obstacle) => {
    if (obstacle.runnerPassed) return;
    const distanceAhead = (obstacle.x - runner.x) * direction;
    if (distanceAhead <= 120 && distanceAhead >= -obstacle.radius) runner.hopUntil = Math.max(runner.hopUntil || 0, state.time + hopDurationSeconds);
    if (isPastChallengePoint(runner.x, obstacle.x + direction * obstacle.radius, direction)) obstacle.runnerPassed = true;
  });
}

function createFriendlyChallengeRunner(villager, targetX, direction) {
  const homeX = Number.isFinite(villager.homeX) ? villager.homeX : villager.x;
  return {
    x: homeX,
    homeX,
    targetX,
    direction,
    departAt: state.time + friendlyChallengeRunnerStartDelay,
    paceSeed: hashNumber(homeX + targetX + state.time * 7),
    vx: 0
  };
}

function updateChallengeRunner(challenge, dt) {
  const runner = challenge.runner || (challenge.runner = createFriendlyChallengeRunner(challenge.villager, challenge.targetX, Math.sign(challenge.targetX - challenge.startX) || 1));
  if (state.time < runner.departAt) return false;
  const remaining = Math.abs(runner.targetX - runner.x);
  if (remaining < 1) {
    runner.x = runner.targetX;
    runner.vx = 0;
    return true;
  }
  // The inhabitant follows its own pace; it never uses the player's position or inputs.
  const breathing = 0.96 + Math.sin((state.time - runner.departAt) * 2.4 + runner.paceSeed * 8) * 0.035;
  const speed = friendlyChallengeRunnerSpeed * getWeatherSpeedFactor() * breathing;
  const direction = Math.sign(runner.targetX - runner.x) || runner.direction;
  runner.vx += (direction * speed - runner.vx) * Math.min(1, dt * 5.2);
  runner.x = clampToPlayableWorldX(runner.x + runner.vx * dt);
  updateChallengeRunnerRoute(challenge, runner);
  if (Math.abs(runner.targetX - runner.x) <= 18) {
    runner.x = runner.targetX;
    runner.vx = 0;
    return true;
  }
  return false;
}

function updateReturningChallengeRunners(dt) {
  if (isInSecretWorld()) return;
  Object.entries(villagerChallengeReturns).forEach(([villageId, runner]) => {
    if (state.time < runner.returnAt) return;
    const distance = runner.homeX - runner.x;
    if (Math.abs(distance) <= 8) {
      delete villagerChallengeReturns[villageId];
      return;
    }
    const direction = Math.sign(distance);
    const speed = friendlyChallengeRunnerReturnSpeed * getWeatherSpeedFactor();
    runner.x += direction * Math.min(Math.abs(distance), speed * dt);
    runner.vx = direction * speed;
  });
}

function sendChallengeRunnerHome(challenge, won) {
  const runner = challenge.runner;
  if (!runner) return;
  runner.vx = 0;
  runner.returnAt = state.time + (won ? 1.4 : 0.8);
  villagerChallengeReturns[challenge.villageId] = runner;
}

function updateFriendlyChallenge(dt) {
  const challenge = state.friendlyChallenge;
  if (!challenge || isInSecretWorld()) return;
  if (challenge.readyAt > state.time) return;
  challenge.remaining = Math.max(0, challenge.remaining - dt);
  const runnerFinished = updateChallengeRunner(challenge, dt);
  updateChallengePlayerRoute(challenge);
  if (Math.abs(state.player.x - challenge.targetX) <= 58) {
    finishFriendlyChallenge(true);
    return;
  }
  if (runnerFinished) {
    finishFriendlyChallenge(false, "runner");
  } else if (challenge.remaining <= 0) {
    finishFriendlyChallenge(false, "timeout");
  }
}

function finishFriendlyChallenge(won, reason = "") {
  const challenge = state.friendlyChallenge;
  if (!challenge) return;
  state.friendlyChallenge = null;
  state.friendlyChallengeCooldowns[challenge.villageId] = state.time + (won ? friendlyChallengeCooldownSeconds : 12);
  sendChallengeRunnerHome(challenge, won);
  const villager = challenge.villager;
  if (won) {
    const reward = getFriendlyChallengeReward(challenge);
    const memory = getVillagerMemory(villager);
    memory.relation += 0.85;
    if (reward) {
      collectDiscovery({ ...reward, id: makeId(reward.id, Math.floor(state.time * 10) + challenge.targetX), place: getPlaceType(challenge.targetX) }, true);
      showMessage(`Course reussie. Tu gagnes : ${reward.label}.`);
      rememberJournalEvent(`J'ai releve le defi amical de ${villager.role.toLowerCase()} et gagne ${reward.label.toLowerCase()}.`);
      openDiscoveryPopup(reward);
    } else {
      showMessage("Defi reussi. L'habitant est impressionne.");
    }
    showVillagerBubble(villager, "Bien joue. Tu connais vraiment le chemin.", { cooldown: 24, force: true });
    playSoftPing();
  } else {
    const runnerWon = reason === "runner";
    showMessage(runnerWon ? `${villager.role} atteint l'arrivee avant toi.` : "Le temps de la course est termine.");
    showVillagerBubble(villager, runnerWon ? "J'y suis arrive avant toi. On recommence quand tu veux." : "Ce n'est pas une course contre le temps. On recommencera.", { cooldown: 18, force: true });
  }
  saveGame();
}

function spawnDiscoveryBurst(item) {
  const rarity = item.rarity || "Commun";
  const color = rarity === "Legendaire" ? "#f6cf36" : rarity === "Rare" ? "#b9a1e3" : "#f7e5a5";
  const count = rarity === "Commun" ? 7 : 12;
  for (let index = 0; index < count; index += 1) {
    const angle = (Math.PI * 2 * index) / count + hashNumber(item.x + index * 13) * 0.36;
    const distance = 24 + hashNumber(item.x + index * 41) * 34;
    discoveryBursts.push({
      x: item.x,
      y: Number.isFinite(item.y) ? item.y : world.ground - 24,
      vx: Math.cos(angle) * distance,
      vy: Math.sin(angle) * distance - 24,
      size: 2 + hashNumber(item.x + index * 71) * 2.3,
      alpha: rarity === "Commun" ? 0.65 : 0.9,
      color,
      startedAt: state.time,
      duration: 0.48 + hashNumber(item.x + index * 23) * 0.28
    });
  }
  if (discoveryBursts.length > 80) discoveryBursts.splice(0, discoveryBursts.length - 80);
}

function getMicroEventsState() {
  state.microEvents = state.microEvents && typeof state.microEvents === "object"
    ? state.microEvents
    : { nextTreeDropAt: state.time + 20, nextRollingAt: state.time + 48, nextShootingStarAt: state.time + 80 };
  if (!Number.isFinite(state.microEvents.nextTreeDropAt)) state.microEvents.nextTreeDropAt = state.time + 20;
  if (!Number.isFinite(state.microEvents.nextRollingAt)) state.microEvents.nextRollingAt = state.time + 48;
  if (!Number.isFinite(state.microEvents.nextShootingStarAt)) state.microEvents.nextShootingStarAt = state.time + 80;
  return state.microEvents;
}

function getMicroEventItemPool(kind = "tree") {
  const season = getSeason();
  const weather = getWeatherForChapter().id;
  const seasonal = seasonalEventItems.find((item) => item.season === season && (weather === "rain" || isNightTime()));
  const prefix = kind === "tree" ? "tree-micro" : "rolling-micro";
  const pool = microEventCatalogItems.filter((item) => item.id.startsWith(prefix));
  if (seasonal) pool.push(seasonal);
  return pool;
}

function createMicroDiscovery(base, x, extra = {}) {
  const unique = Math.floor(state.time * 10 + hashNumber(x + state.time) * 10000);
  return {
    ...base,
    id: makeId(base.id, unique),
    x: clampToPlayableWorldX(x),
    place: getPlaceType(x),
    visualType: getItemVisualType(base),
    zoneKey: `micro-${getChapter(x)}`,
    createdAt: state.time,
    ...extra
  };
}

function updateRollingDiscovery(item, dt = 1 / 60) {
  const blocked = getInteractionObstacleXs(item).some((blocker) => Math.abs(item.x - blocker.x) < blocker.distance * 0.72);
  if (blocked || state.time > (item.rollUntil || 0)) {
    item.rolling = false;
    item.grounded = true;
    item.expiresAt = state.time + groundedDiscoveryLifetimeSeconds + hashNumber(item.x + state.time) * 120;
    item.vx = 0;
    return;
  }
  item.x = clampToPlayableWorldX(item.x + (item.vx || 0) * dt);
  item.vx *= 0.992;
  if (Math.abs(item.vx) < 18) {
    item.rolling = false;
    item.grounded = true;
    item.expiresAt = state.time + groundedDiscoveryLifetimeSeconds + hashNumber(item.x + state.time) * 120;
  }
}

function updateMicroEvents(dt) {
  if (!running || isModalOpen() || isInSecretWorld()) return;
  const micro = getMicroEventsState();
  updateFallingTreeItems(dt);
  updateShootingStars(dt);
  if (state.time >= micro.nextTreeDropAt) maybeStartTreeDrop(micro);
  if (state.time >= micro.nextRollingAt) maybeStartRollingItem(micro);
  if (state.time >= micro.nextShootingStarAt) maybeStartShootingStar(micro);
}

function maybeStartTreeDrop(micro) {
  micro.nextTreeDropAt = state.time + 36 + hashNumber(state.time + state.player.x) * 58;
  if (Math.random() > 0.34) return;
  const side = hashNumber(state.time) > 0.5 ? 1 : -1;
  const x = placeXClearOfInteractions(state.player.x + side * (95 + hashNumber(state.player.x) * 120), { salt: state.time + 31 });
  const pool = getMicroEventItemPool("tree");
  const base = pool[Math.floor(hashNumber(x + state.time) * pool.length) % pool.length];
  fallingTreeItems.push({
    item: createMicroDiscovery(base, x, { fromTree: true }),
    x,
    y: world.ground - 210,
    vy: 0,
    bounce: 0
  });
}

function maybeStartRollingItem(micro) {
  micro.nextRollingAt = state.time + 55 + hashNumber(state.time + 13) * 70;
  if (Math.random() > 0.28) return;
  const direction = state.player.face || 1;
  const runSpeed = playerWalkSpeed * playerRunMultiplier * getWeatherSpeedFactor();
  const pool = getMicroEventItemPool("rolling");
  const base = pool[Math.floor(hashNumber(state.player.x + state.time * 3) * pool.length) % pool.length];
  const startX = placeXClearOfInteractions(state.player.x + direction * 105, { salt: state.time + 47 });
  const item = createMicroDiscovery(base, startX, {
    rolling: true,
    vx: direction * runSpeed * (0.75 + hashNumber(state.time) * 0.1),
    rollUntil: state.time + 4.8,
    hiddenUntil: state.time + 0.2
  });
  storeWorldDiscovery(item);
}

function maybeStartShootingStar(micro) {
  micro.nextShootingStarAt = state.time + 80 + hashNumber(state.time + 41) * 130;
  const weather = getWeatherForChapter().id;
  if (!isNightTime() || (weather !== "clear" && weather !== "wind") || Math.random() > 0.42) return;
  shootingStars.push({
    startedAt: state.time,
    duration: 1.3 + hashNumber(state.time) * 0.5,
    x: window.innerWidth * (0.2 + hashNumber(state.player.x) * 0.55),
    y: window.innerHeight * (0.12 + hashNumber(state.time + 4) * 0.22),
    length: 95 + hashNumber(state.time + 8) * 70
  });
  playSoftPing();
}

function updateFallingTreeItems(dt) {
  for (let index = fallingTreeItems.length - 1; index >= 0; index -= 1) {
    const drop = fallingTreeItems[index];
    drop.vy += 420 * dt;
    drop.y += drop.vy * dt;
    const groundY = world.ground - 24;
    if (drop.y >= groundY) {
      if (drop.bounce < 1) {
        drop.y = groundY;
        drop.vy = -110;
        drop.bounce += 1;
      } else {
        drop.item.x = drop.x;
        drop.item.createdAt = state.time;
        drop.item.y = groundY;
        drop.item.grounded = true;
        drop.item.rolling = false;
        drop.item.groundOffset = 0;
        drop.item.place = getPlaceType(drop.x);
        drop.item.expiresAt = state.time + groundedDiscoveryLifetimeSeconds + hashNumber(drop.x + state.time) * 120;
        storeWorldDiscovery(drop.item);
        fallingTreeItems.splice(index, 1);
      }
    }
  }
}

function updateShootingStars() {
  for (let index = shootingStars.length - 1; index >= 0; index -= 1) {
    if (state.time - shootingStars[index].startedAt > shootingStars[index].duration) shootingStars.splice(index, 1);
  }
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
    objective: quest.objective,
    progress: quest.progress,
    target: quest.target,
    itemId: quest.itemId || "",
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
  openDialog(ui.questDialog);
}

function openQuestCompletePopup(reward) {
  const rewardItems = reward.rewardItems || [];
  setPlayerAction("reward", 1.8);
  ui.questCompleteBody.innerHTML = `
    <div class="mission-complete-mark">&#10003;</div>
    <p class="mission-complete-thanks"><strong>Merci pour ton aide !</strong></p>
    <p>${reward.questTitle}</p>
    <p><strong>Recompense</strong></p>
    <ul class="mission-reward-list mission-reward-list-celebration">
      ${rewardItems.map((item) => `<li>${getItemIcon(item, "small")}<span>${item.label} &times;1</span></li>`).join("")}
    </ul>
  `;
  ui.questCompleteDialog.classList.add("is-reward-pending");
  openDialog(ui.questCompleteDialog);
}

function claimQuestReward() {
  if (!state.pendingQuestReward) return;
  state.pendingQuestReward = null;
  ui.questCompleteDialog.classList.remove("is-reward-pending");
  state.nextLetterAt = state.time + letterRespawnDelaySeconds;
  updateMissionTracker();
  saveGame();
  showMessage("Recompense recue.");
}

function updateMissionTracker() {
  if (!missionTrackerNotice || state.time >= missionTrackerNotice.expiresAt) {
    ui.missionTracker.classList.remove("is-visible");
    missionTrackerNotice = null;
  }
}

function showMissionTracker(kind, quest) {
  if (!quest) return;
  const progress = `${quest.progress || 0} / ${quest.target || 1}`;
  let title = "Mission";
  let detail = quest.objective || quest.title || "Objectif de mission";
  let hint = "";

  if (kind === "new") {
    title = "Nouvelle mission";
  } else if (kind === "progress") {
    title = quest.title || "Mission en cours";
    detail = `${quest.objective} - ${progress}`;
  } else if (kind === "complete") {
    title = "Objectif atteint";
    detail = `${quest.title || quest.objective} - ${progress}`;
  } else if (kind === "reminder") {
    title = quest.title || "Mission en cours";
    detail = `${quest.objective} - ${progress}`;
    hint = getQuestSearchHint(quest) || getQuestHint(quest);
  }

  ui.missionTracker.innerHTML = `<strong>${title}</strong><span>${detail}</span>${kind === "new" ? `<span>${progress}</span>` : ""}${hint ? `<span>${hint}</span>` : ""}`;
  missionTrackerNotice = { expiresAt: state.time + missionTrackerDisplaySeconds };
  ui.missionTracker.classList.remove("is-visible");
  void ui.missionTracker.offsetWidth;
  ui.missionTracker.classList.add("is-visible");
}

function updateMissionReminderButton() {
  if (state.pendingQuestReward) {
    ui.missionReminderButton.textContent = "Voir la recompense de mission";
  } else if (state.activeQuest) {
    ui.missionReminderButton.textContent = "Rappeler la mission";
  } else {
    ui.missionReminderButton.textContent = "Que faire maintenant ?";
  }
}

function showMissionReminder() {
  closeDialog(ui.optionsDialog);
  if (state.pendingQuestReward) {
    openQuestCompletePopup(state.pendingQuestReward);
    return;
  }
  if (state.activeQuest) {
    showMissionTracker("reminder", state.activeQuest);
    return;
  }
  showMessage("Aucune mission active. Une enveloppe peut apparaitre sur le chemin.");
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
  if (!quest || !quest.itemId) return "";
  ensureMissionDiscoveryItems();
  const target = Object.values(state.worldDiscoveries)
    .filter((item) => item.missionItem && item.zoneKey === `mission-${quest.id}` && !item.collected)
    .sort((a, b) => Math.abs(a.x - state.player.x) - Math.abs(b.x - state.player.x))[0];
  if (!target) return "";
  const direction = target.x >= state.player.x ? "vers l'est" : "vers l'ouest";
  return `Mission : ${target.label || "objet demande"} ${direction}.`;
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
  if (!item || item.collected || hasCollectedDiscovery(item) || collectingDiscoveryIds.has(item.id)) return false;
  collectingDiscoveryIds.add(item.id);
  try {
  const baseId = baseDiscoveryId(item.id);
  const firstTime = !hasCollectedBaseItem(baseId);
  if (!quiet) setPlayerAction((item.rarity === "Legendaire" || item.rarity === "Rare") ? "rare" : "pickup", 1.2);
  if (!quiet) {
    spawnDiscoveryBurst(item);
    playDiscoveryChime(item.rarity);
  }
  if (!quiet) {
    const respawnAt = state.time + getDiscoveryRespawnDelay();
    if (!item.missionItem) {
      state.discoveryRespawns[item.id] = respawnAt;
      state.discoveryVacancies[item.id] = { x: item.x, until: respawnAt };
    }
    if (state.worldDiscoveries[item.id]) {
      state.worldDiscoveries[item.id].collected = true;
      state.worldDiscoveries[item.id].respawnAt = item.missionItem ? Number.POSITIVE_INFINITY : respawnAt;
    }
  }
  state.discoveries.push(item.id);
  state.inventory[baseId] = (state.inventory[baseId] || 0) + 1;
  if (!quiet) {
    state.recentDiscoveryNotice = {
      id: item.id,
      label: item.label,
      at: state.time
    };
  }
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
  }
  updateAchievements();
  return true;
  } finally {
    collectingDiscoveryIds.delete(item.id);
  }
}

function openDiscoveryPopup(item) {
  const baseId = baseDiscoveryId(item.id);
  pendingDiscoveryPopup = baseId;
  ui.discoveryTitle.textContent = item.label;
  ui.hideDiscoveryPopup.checked = false;
  ui.discoveryBody.innerHTML = `
    <div class="discovery-icon">${getItemIcon(item, "large")}</div>
    <p>${item.text}</p>
    <p><strong>Rareté</strong> ${item.rarity || "Commun"}</p>
    <p><strong>Utilité</strong> ${getItemUse(item.id)}</p>
  `;
  openDialog(ui.discoveryDialog);
}

function closeDiscoveryPopup() {
  if (pendingDiscoveryPopup && ui.hideDiscoveryPopup.checked && !state.hiddenDiscoveryPopups.includes(pendingDiscoveryPopup)) {
    state.hiddenDiscoveryPopups.push(pendingDiscoveryPopup);
    saveGame();
  }
  pendingDiscoveryPopup = null;
}

function setVillagerDialogMode(mode = "help") {
  const awaitingChoice = mode === "choices";
  ui.villagerChoices.hidden = !awaitingChoice;
  ui.villagerActions.hidden = awaitingChoice;
  ui.villagerDialog.classList.toggle("is-choice-pending", awaitingChoice);
  const closeButton = ui.villagerDialog.querySelector(".close-button");
  if (closeButton) {
    closeButton.hidden = awaitingChoice;
    closeButton.disabled = awaitingChoice;
  }
}

function isFriendlyChallengeHost(villager) {
  const mood = getVillagerPersonality(villager).mood;
  return mood === "energique" || mood === "drole";
}

function canStartFriendlyChallenge(villager) {
  if (!villager || !isFriendlyChallengeHost(villager) || isInSecretWorld() || state.pendingQuestReward || state.friendlyChallenge) return false;
  return state.time >= (state.friendlyChallengeCooldowns[villager.villageId] || 0);
}

function updateVillagerChallengeButton(villager) {
  const available = canStartFriendlyChallenge(villager);
  ui.challengeButton.hidden = !available;
  ui.challengeButton.disabled = !available;
}

function getFriendlyChallengeDirection(villager) {
  const homeX = Number.isFinite(villager.homeX) ? villager.homeX : villager.x;
  const preferred = state.player.lastTravelDirection || state.player.face || 1;
  const available = Math.abs(clampToPlayableWorldX(homeX + preferred * friendlyChallengeDistance) - homeX);
  return available >= friendlyChallengeDistance * 0.8 ? preferred : -preferred;
}

function startFriendlyChallenge() {
  const villager = pendingVillagerHelp;
  if (!canStartFriendlyChallenge(villager)) {
    showMessage(state.friendlyChallenge ? "Un defi est deja en cours." : "Ce defi sera disponible un peu plus tard.");
    return;
  }
  const startX = Number.isFinite(villager.homeX) ? villager.homeX : villager.x;
  const direction = getFriendlyChallengeDirection(villager);
  const targetX = clampToPlayableWorldX(startX + direction * friendlyChallengeDistance);
  if (Math.abs(targetX - startX) < friendlyChallengeDistance * 0.8) {
    showMessage("Le chemin est trop court ici. Essaie depuis un autre village.");
    return;
  }
  state.friendlyChallenge = {
    villageId: villager.villageId,
    villager,
    startX,
    targetX,
    remaining: friendlyChallengeDurationSeconds,
    startedAt: state.time,
    readyAt: state.time + 3,
    route: createFriendlyChallengeRoute(startX, targetX),
    runner: createFriendlyChallengeRunner(villager, targetX, direction)
  };
  state.player.x = startX;
  state.player.face = direction;
  state.player.vx = 0;
  state.friendlyChallenge.runner.departAt = state.friendlyChallenge.readyAt;
  closeDialog(ui.villagerDialog);
  pendingVillagerConversation = null;
  pendingVillagerHelp = null;
  setPlayerAction("run", 0.5);
  showMessage(`Course de ${friendlyChallengeDistanceLabel} : suis les pointilles, saute les petits obstacles et arrive avant l'habitant.`);
  showVillagerBubble(villager, "Je pars a mon rythme. Rendez-vous a l'arrivee !", { cooldown: 20, force: true });
  playSoftPing();
  saveGame();
}

function getVillagerMemoryLine(villager, memory) {
  if (memory.visits <= 1) return "Bonjour... je ne crois pas t'avoir deja vu ici.";
  if (memory.relation >= 4 || memory.visits >= 6) return "Je me demandais quand tu reviendrais.";
  if (memory.visits >= 3) return "Ah, c'est toi !";
  return "On s'est deja croises, non ?";
}

function getVillagerRequestLine(villager, alreadyHelped) {
  if (alreadyHelped) return "Le village se souvient encore de ton aide.";
  const amount = villager.need.amount || 1;
  const label = villager.need.itemLabel || "objet";
  const requests = [
    `J'aurais besoin de ${amount} ${label.toLowerCase()} pour ${villager.need.need}.`,
    `Tu tombes bien. Il me faudrait ${amount} ${label.toLowerCase()} pour ${villager.need.need}.`,
    `J'ai une demande simple : ${amount} ${label.toLowerCase()} pour ${villager.need.need}.`,
    `Pour ${villager.need.need}, il me faut ${amount} ${label.toLowerCase()}.`
  ];
  return requests[Math.round(villager.x / 97) % requests.length];
}

function pickFreshConversation(villager, memory, options, seed) {
  const unseen = options.filter((conversation) => !memory.dialogueHistory.includes(conversation.id));
  const pool = unseen.length ? unseen : options.filter((conversation) => conversation.id !== memory.dialogueHistory.at(-1));
  if (!pool.length) return null;
  return pool[Math.floor(hashNumber(seed) * pool.length) % pool.length];
}

function getVillagerConversation(villager, memory, alreadyHelped, previousLastSeen = memory.lastSeenAt) {
  if (alreadyHelped && memory.visits < 3) return null;
  const personality = getVillagerPersonality(villager);
  const seed = state.time + villager.x + memory.visits * 29 + memory.relation * 7;
  const conversations = [];
  if (memory.quickTalks >= 2) {
    conversations.push({
      id: "quick-return",
      prompt: "Deja de retour ?",
      choices: [
        { id: "quick-hello", text: "Je passais dire bonjour.", reply: "Alors bonjour a toi aussi. C'est une bonne raison.", relation: 0.3 },
        { id: "quick-chat", text: "J'avais envie de parler.", reply: "Ca me fait plaisir. Les journées sont longues quand personne ne s'arrete.", relation: 0.4 }
      ]
    });
  }
  if (state.time - previousLastSeen > 70 || memory.visits >= 3) {
    conversations.push({
      id: "returning",
      prompt: "Ca faisait un moment. Tu etais ou ?",
      choices: [
        { id: "explored", text: "J'explorais.", reply: "Je m'en doutais. Tu as l'air d'aimer voir ou les routes menent.", relation: 0.45 },
        { id: "missed", text: "Tu m'as manque aussi.", reply: "Oh. Je vais faire semblant de ne pas etre touche.", relation: 0.65 },
        { id: "everywhere", text: "Un peu partout.", reply: "Alors tu as surement de quoi raconter.", relation: 0.4 }
      ]
    });
  }
  if (state.weather === "rain") {
    conversations.push({
      id: "rainy-day",
      prompt: "Tu aimes marcher sous cette pluie ?",
      choices: [
        { id: "rain-yes", text: "Oui, ca change le paysage.", reply: "C'est vrai. Les chemins ont un autre visage quand ils brillent.", relation: 0.3 },
        { id: "rain-no", text: "Pas vraiment.", reply: "Je te comprends. Rien ne presse, tu peux attendre que ca se calme.", relation: 0.25 }
      ]
    });
  }
  const everydayByMood = {
    reserve: {
      id: "quiet-river",
      prompt: "Tu explores encore aujourd'hui ?",
      choices: [
        { id: "explore-yes", text: "Oui, un peu.", reply: "Alors profite du calme. La riviere est belle plus loin.", relation: 0.3 },
        { id: "explore-walk", text: "Je fais juste un tour.", reply: "C'est deja une bonne facon de passer la journee.", relation: 0.25 }
      ]
    },
    chaleureuse: {
      id: "warm-village",
      prompt: "Tu as eu le temps de te reposer un peu ?",
      choices: [
        { id: "rest-yes", text: "Un peu, oui.", reply: "Tant mieux. Les promenades sont plus belles quand on ne se presse pas.", relation: 0.35 },
        { id: "rest-later", text: "Pas encore.", reply: "Alors garde une pause pour toi quelque part aujourd'hui.", relation: 0.35 }
      ]
    },
    attentif: {
      id: "forest-watch",
      prompt: "La route t'a semble tranquille ?",
      choices: [
        { id: "road-quiet", text: "Oui, plutot.", reply: "Parfait. J'aime savoir que les gens peuvent marcher sereinement.", relation: 0.3 },
        { id: "road-busy", text: "Il y avait du monde.", reply: "Ca arrive. Le village respire mieux quand chacun trouve son rythme.", relation: 0.3 }
      ]
    },
    energique: {
      id: "child-play",
      prompt: "Tu crois que tu pourrais faire le tour du village sans t'arreter ?",
      choices: [
        { id: "race-yes", text: "Facile.", reply: "Je te crois... mais je ne vais pas essayer de te suivre.", relation: 0.35 },
        { id: "race-no", text: "Je prefere prendre mon temps.", reply: "D'accord. Moi, j'essaierai quand meme plus tard.", relation: 0.25 }
      ]
    },
    reveur: {
      id: "music-pause",
      prompt: "Tu entends les oiseaux, ce matin ?",
      choices: [
        { id: "birds-yes", text: "Oui.", reply: "Ils font toujours mieux que moi avant le petit dejeuner.", relation: 0.35 },
        { id: "birds-no", text: "Pas encore.", reply: "Alors reste un moment. Ils finiront bien par se faire entendre.", relation: 0.3 }
      ]
    },
    drole: {
      id: "merchant-joke",
      prompt: "Tu collectionnes les silences ou les histoires ?",
      choices: [
        { id: "stories", text: "Des histoires.", reply: "Excellent choix. Les silences prennent trop de place dans les poches.", relation: 0.4 },
        { id: "calm", text: "Un peu des deux.", reply: "Reponse raisonnable. Je vais la noter dans mon inventaire imaginaire.", relation: 0.35 }
      ]
    },
    curieux: {
      id: "postman-day",
      prompt: "Tu viens de loin aujourd'hui ?",
      choices: [
        { id: "far-walk", text: "J'ai beaucoup marche.", reply: "Alors tu merites une vraie pause avant de repartir.", relation: 0.35 },
        { id: "near-walk", text: "Pas tres loin.", reply: "Les petites promenades comptent aussi. Elles font parfois le plus de bien.", relation: 0.3 }
      ]
    },
    calme: {
      id: "calm-day",
      prompt: "Tu trouves le village accueillant ?",
      choices: [
        { id: "village-yes", text: "Oui, beaucoup.", reply: "Ca me fait plaisir de l'entendre.", relation: 0.35 },
        { id: "village-learning", text: "Je commence a le connaitre.", reply: "C'est comme ca qu'on s'y attache, doucement.", relation: 0.3 }
      ]
    }
  };
  // Ordinary visits stay simple. Choices are reserved for a few natural contexts.
  if (conversations.length === 0 || Math.random() > 0.18) return null;
  return pickFreshConversation(villager, memory, conversations, seed);
}

function renderVillagerChoices(conversation) {
  ui.villagerChoices.innerHTML = conversation.choices.map((choice, index) => `
    <button class="dialog-choice-button" type="button" data-choice-index="${index}">
      ${choice.text}
    </button>
  `).join("");
  setVillagerDialogMode("choices");
}

function handleVillagerChoice(index) {
  if (!pendingVillagerConversation) return;
  const { villager, conversation, alreadyHelped, baseLine } = pendingVillagerConversation;
  const choice = conversation.choices[index];
  if (!choice) return;
  const memory = getVillagerMemory(villager);
  rememberVillagerChoice(villager, choice.id);
  memory.relation += Number.isFinite(choice.relation) ? choice.relation : 0.25;
  ui.villagerText.textContent = `${choice.reply} ${alreadyHelped ? "On peut rester la-dessus pour aujourd'hui." : baseLine}`.trim();
  const required = villager.need?.amount || 1;
  const available = getAvailableItemQuantity(villager.need?.itemId);
  ui.giveItemButton.disabled = alreadyHelped || available < required;
  ui.giveItemButton.style.opacity = ui.giveItemButton.disabled ? "0.55" : "1";
  ui.giveItemButton.textContent = alreadyHelped ? "Aide apportee" : `Donner (${available}/${required})`;
  updateVillagerChallengeButton(villager);
  pendingVillagerConversation = null;
  setVillagerDialogMode("help");
  saveGame();
}

function openVillagerHelp(villager) {
  if (ui.villagerDialog.open && pendingVillagerConversation) return;
  setPlayerAction("talk", 1.4);
  const alreadyHelped = state.helpedVillagers.includes(villager.villageId);
  const relationKey = getVillagerKey(villager);
  const memory = getVillagerMemory(villager);
  const previousLastSeen = memory.lastSeenAt;
  memory.quickTalks = state.time - memory.lastTalkAt < 14 ? memory.quickTalks + 1 : 0;
  memory.visits += 1;
  memory.relation += 0.25;
  memory.lastTalkAt = state.time;
  memory.lastSeenAt = state.time;
  state.villagerRelations[relationKey] = memory.visits;
  state.villagerRelations[villager.role] = Math.max(state.villagerRelations[villager.role] || 0, memory.visits);
  state.villagerLastMet[relationKey] = new Date().toISOString();
  state.villagerLastMet[villager.role] = new Date().toISOString();
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
  const meetings = memory.visits;
  const relationLine = getVillagerRelationLine(villager, meetings, memory);
  const requestLine = getVillagerRequestLine(villager, alreadyHelped);
  const conversation = getVillagerConversation(villager, memory, alreadyHelped, previousLastSeen);
  ui.villagerTitle.textContent = villager.role;
  const available = getAvailableItemQuantity(villager.need.itemId);
  const required = villager.need.amount || 1;
  ui.giveItemButton.disabled = alreadyHelped || available < required;
  ui.giveItemButton.style.opacity = ui.giveItemButton.disabled ? "0.55" : "1";
  ui.giveItemButton.textContent = alreadyHelped ? "Aide apportee" : `Donner (${available}/${required})`;
  pendingVillagerConversation = null;
  if (conversation) {
    rememberVillagerConversation(villager, conversation.id);
    ui.villagerText.textContent = `${getVillagerMemoryLine(villager, memory)} ${conversation.prompt}`;
    pendingVillagerConversation = { villager, conversation, alreadyHelped, baseLine: requestLine };
    renderVillagerChoices(conversation);
  } else {
    ui.villagerText.textContent = `${relationLine} ${requestLine}`.trim();
    setVillagerDialogMode("help");
  }
  pendingVillagerHelp = villager;
  updateVillagerChallengeButton(villager);
  updateAchievements();
  saveGame();
  openDialog(ui.villagerDialog);
}

function getVillagerRelationLine(villager, meetings, memory = getVillagerMemory(villager)) {
  if (memory.relation >= 5) return `${villager.line} Il est toujours content de te voir arriver.`;
  if (meetings >= 5) return `${villager.line} Vous avez maintenant l'habitude de discuter quand tu passes.`;
  if (meetings >= 3) return `${villager.line} Il te reconnait aussitot et parle avec plus de confiance.`;
  if (meetings >= 2) return `${villager.line} Il sourit : vous vous etes deja croises sur le chemin.`;
  return villager.line;
}

function givePendingItem() {
  if (!pendingVillagerHelp) return;
  if (state.helpedVillagers.includes(pendingVillagerHelp.villageId)) {
    closeDialog(ui.villagerDialog);
    pendingVillagerHelp = null;
    return;
  }
  const itemId = pendingVillagerHelp.need?.itemId;
  const required = pendingVillagerHelp.need?.amount || 1;
  const available = getAvailableItemQuantity(itemId);
  if (!itemId || available < required) {
    showMessage(`Il t'en manque ${Math.max(1, required - available)}.`);
    return;
  }
  state.inventory[itemId] -= required;
  state.helpedVillagers.push(pendingVillagerHelp.villageId);
  const memory = getVillagerMemory(pendingVillagerHelp);
  memory.helpCount += 1;
  memory.relation += 1.1;
  memory.gifts.push({ need: itemId, amount: required, at: new Date().toISOString() });
  advanceQuest("helpVillager", 1);
  const thankedVillager = pendingVillagerHelp;
  closeDialog(ui.villagerDialog);
  showVillagerBubble(thankedVillager, "Merci. Vraiment.", { cooldown: 24, force: true });
  pendingVillagerConversation = null;
  pendingVillagerHelp = null;
  playSoftPing();
  updateAchievements();
  saveGame();
}

function refusePendingHelp() {
  if (!pendingVillagerHelp) return;
  closeDialog(ui.villagerDialog);
  pendingVillagerConversation = null;
  pendingVillagerHelp = null;
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
  ui.cinematic.classList.remove("is-nonblocking");
  ui.cinematic.classList.add("is-visible");
  ui.cinematicText.textContent = frames[index];
  const timer = setInterval(() => {
    index += 1;
    if (index >= frames.length) {
      clearInterval(timer);
      ui.cinematic.classList.remove("is-visible");
      running = true;
      return;
    }
    ui.cinematicText.textContent = frames[index];
  }, 2300);
}

function buildJournal() {
  ui.journalList.innerHTML = "";
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
        <div class="journal-object-image large">${currentItem ? getItemIcon(currentItem, "large") : getUnknownItemIcon()}</div>
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

  appendJournalBlock("Encyclopedie", renderEncyclopedia(), "gallery-block");
  appendJournalBlock("Habitants", renderVillagers(), "gallery-block");
  appendJournalBlock("Missions", renderQuestCard(true), "mission-block");
  appendJournalBlock("Carte", renderMap(), "map-block");
  if (state.companion.unlocked) appendJournalBlock("Mon compagnon", renderCompanionJournal(), "companion-block");
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

function renderEncyclopedia() {
  const known = new Set(Object.keys(state.inventory));
  return `<div class="encyclopedia-grid">${itemCatalog.map((item) => {
    const discovered = known.has(item.id);
    return `
      <article class="encyclopedia-card ${discovered ? "is-known" : "is-unknown"}" ${discovered ? `data-item-id="${item.id}" tabindex="0" role="button"` : ""}>
        <div class="journal-object-image">${discovered ? getItemIcon(item) : getUnknownItemIcon()}</div>
        <strong>${discovered ? item.label : "Objet inconnu"}</strong>
        <span>${discovered ? `${item.place} - ${getRarityStars(item.rarity)}` : "Silhouette dans le brouillard"}</span>
        ${discovered ? `<small>Possede : ${state.inventory[item.id] || 0}</small>` : ""}
        <small>${discovered ? getShortItemConditionHint(item) : "Conditions inconnues"}</small>
      </article>
    `;
  }).join("")}</div>`;
}

function getShortItemConditionHint(itemOrId) {
  const hint = getItemConditionHint(itemOrId);
  return hint.replace("Lieu : ", "").replace(". Condition :", " -").replace("Condition : ", "");
}

function openEncyclopediaDetail(itemId) {
  const item = getCatalogItem(itemId);
  if (!item || !state.inventory[item.id]) return;
  const action = getItemAction(item.id);
  const available = getAvailableItemQuantity(item.id);
  const reserved = getReservedMissionQuantity(item.id);
  ui.encyclopediaDetailTitle.textContent = item.label;
  ui.encyclopediaDetailTitle.dataset.itemId = item.id;
  ui.encyclopediaDetailBody.innerHTML = `
    <div class="discovery-icon">${getItemIcon(item, "large")}</div>
    <p>${item.text}</p>
    <p><strong>Utilite</strong> ${getItemUse(item.id)}</p>
    <p><strong>Possede</strong> ${state.inventory[item.id] || 0}${reserved ? ` (${reserved} reserve pour la mission)` : ""}</p>
    <p><strong>Type</strong> ${getItemUsageStatus(item.id)}</p>
    <p><strong>Lieu</strong> ${item.place || "Chemin"}</p>
    <p><strong>Conditions d'apparition</strong> ${getItemConditionHint(item)}</p>
    <p><strong>Rarete</strong> ${getRarityStars(item.rarity)} - ${item.rarity || "Commun"}</p>
    <p><strong>Date de decouverte</strong> ${formatDiscoveryDate(item.id)}</p>
    ${action ? `<div class="choice-actions item-use-actions"><button class="primary-button" type="button" data-item-action="${action.kind}" ${available < 1 ? "disabled" : ""}>${action.label}</button></div>` : ""}
  `;
  openDialog(ui.encyclopediaDetailDialog);
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
        <p>Presence : ${companion.present === false ? "rappele pres de toi" : "sur le chemin"}</p>
        <button class="secondary-button companion-toggle-button" type="button" data-companion-toggle="1">${companion.present === false ? "Faire venir" : "Rappeler"}</button>
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
  const remaining = Math.max(0, quest.target - quest.progress);
  return `<article class="quest-card ${compact ? "is-wide" : ""}">
    <strong>${quest.title || quest.label}</strong>
    <p>${quest.description}</p>
    <p>${quest.objective}</p>
    <p>${getQuestHint(quest)}</p>
    <div class="progress-bar"><span style="width: ${percent}%"></span></div>
    <p>${quest.progress} / ${quest.target}</p>
    <p>Reste a faire : ${remaining}</p>
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
  return { unlocked: false, offered: false, species: "", name: "", color: "", accent: "", description: "", personality: "", giver: "", metAt: "", walks: 0, finds: 0, nextHelpAt: 0, present: true, x: 300, y: 0, pace: 0, transitionUntil: 0 };
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
    nextHelpAt: Number.isFinite(raw.nextHelpAt) ? raw.nextHelpAt : 0,
    present: raw.present !== false,
    x: Number.isFinite(raw.x) ? raw.x : state.player.x - 82,
    y: Number.isFinite(raw.y) ? raw.y : world.ground,
    pace: Number.isFinite(raw.pace) ? raw.pace : 0,
    transitionUntil: Number.isFinite(raw.transitionUntil) ? raw.transitionUntil : 0
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
  if (place.includes("Cabane")) return "H";
  if (place.includes("Pont")) return "=";
  if (place.includes("Pierre")) return "+";
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

async function startGame(reset = false) {
  if (startingGame || running) return;
  startingGame = true;
  const firstStart = !state.startedAtLeastOnce;
  savePlayerProfile();
  if (reset) resetGame();
  state.startedAtLeastOnce = true;
  ui.startScreen.classList.add("is-hidden");
  setupAudio();
  running = true;
  startingGame = false;
  await unlockAudioFromUserGesture();
  updateMobileLayoutClasses();
  resizeGame();
  if (audio) updateAudio();
  initWalkMemory();
  updateMissionTracker();
  if (state.pendingQuestReward) {
    openQuestCompletePopup(state.pendingQuestReward);
  } else if (firstStart) {
    showMessage("Fleches, ZQSD ou joystick pour marcher. Espace pour sauter, E pour interagir.");
  }
  saveGame();
}

function pauseGame() {
  if (!running) return;
  running = false;
  keys.clear();
  resetTouchControls();
  state.player.vx = 0;
  saveGame();
  ui.continueButton.disabled = false;
  ui.continueButton.style.opacity = "1";
  ui.startScreen.classList.remove("is-hidden");
  if (audio) updateAudio();
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
  state.villagerMemory = {};
  state.discoveredPlaces = [];
  state.visitedLandmarks = [];
  state.visitedVillages = [];
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
  state.discoveryVacancies = {};
  state.achievements = [];
  state.nextSecretAt = secretPortalIntervals[0];
  state.secretCycleIndex = 1;
  state.activeSecretPortal = null;
  state.friendlyChallenge = null;
  state.friendlyChallengeCooldowns = {};
  state.itemEffects = { scoutUntil: 0, scoutTargetId: "", strideUntil: 0, glowUntil: 0, compassUntil: 0, compassTargetX: 0, compassLabel: "" };
  state.equipment = { lanternOn: false };
  state.activeSecretWorld = null;
  state.lastSecretWorldId = "";
  state.lastSecretEdgeMessageAt = 0;
  state.recentDiscoveryNotice = null;
  state.companion = getEmptyCompanionState();
  state.companionGiverX = 0;
  state.microEvents = { nextTreeDropAt: 18, nextRollingAt: 42, nextShootingStarAt: 70 };
  state.time = 0;
  state.camera.x = 0;
  state.chapter = 1;
  state.weather = "clear";
  state.cinematicPlayed = false;
  state.player.rest = 0;
  state.moveMode = "walk";
  joystick.mode = "walk";
  Object.keys(villagerBubbles).forEach((key) => delete villagerBubbles[key]);
  Object.keys(villagerProximity).forEach((key) => delete villagerProximity[key]);
  Object.keys(villagerChallengeReturns).forEach((key) => delete villagerChallengeReturns[key]);
  fallingTreeItems.length = 0;
  shootingStars.length = 0;
  pendingVillagerConversation = null;
  lastAutosaveAt = -Infinity;
  localStorage.removeItem(saveKey);
}

function saveGame() {
  const payload = {
    x: state.player.x,
    moveMode: state.moveMode,
    time: state.time,
    discoveries: state.discoveries,
    inventory: state.inventory,
    discoveryDates: state.discoveryDates,
    hiddenDiscoveryPopups: state.hiddenDiscoveryPopups,
    lanterns: state.lanterns,
    helpedVillagers: state.helpedVillagers,
    villagerRelations: state.villagerRelations,
    villagerLastMet: state.villagerLastMet,
    villagerMemory: state.villagerMemory,
    discoveredPlaces: state.discoveredPlaces,
    visitedLandmarks: state.visitedLandmarks,
    visitedVillages: state.visitedVillages,
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
    discoveryVacancies: state.discoveryVacancies,
    achievements: state.achievements,
    nextSecretAt: state.nextSecretAt,
    secretCycleIndex: state.secretCycleIndex,
    secretPortalScheduleVersion,
    activeSecretPortal: state.activeSecretPortal,
    friendlyChallenge: state.friendlyChallenge,
    friendlyChallengeCooldowns: state.friendlyChallengeCooldowns,
    itemEffects: state.itemEffects,
    equipment: state.equipment,
    activeSecretWorld: state.activeSecretWorld,
    lastSecretWorldId: state.lastSecretWorldId,
    recentDiscoveryNotice: state.recentDiscoveryNotice,
    companion: state.companion,
    companionGiverX: state.companionGiverX,
    microEvents: state.microEvents,
    startedAtLeastOnce: state.startedAtLeastOnce,
    cinematicPlayed: state.cinematicPlayed,
    playerId: state.playerProfile.id,
    nickname: state.playerProfile.nickname
  };
  localStorage.setItem(saveKey, JSON.stringify(payload));
}

function autosave() {
  if (state.time - lastAutosaveAt < 4) return;
  lastAutosaveAt = state.time;
  saveGame();
}

function loadGame() {
  const raw = localStorage.getItem(saveKey);
  if (!raw) return false;
  try {
    const payload = JSON.parse(raw);
    state.player.x = Number.isFinite(payload.x) ? Math.max(0, payload.x) : 380;
    state.moveMode = payload.moveMode === "run" ? "run" : "walk";
    joystick.mode = state.moveMode;
    state.time = Number.isFinite(payload.time) ? Math.max(0, payload.time) : 0;
    state.discoveries = Array.isArray(payload.discoveries) ? payload.discoveries.map(normalizeDiscoveryId) : [];
    state.inventory = payload.inventory && typeof payload.inventory === "object"
      ? normalizeInventory(payload.inventory)
      : rebuildInventory(state.discoveries);
    state.discoveryDates = payload.discoveryDates && typeof payload.discoveryDates === "object" ? payload.discoveryDates : {};
    state.hiddenDiscoveryPopups = Array.isArray(payload.hiddenDiscoveryPopups) ? payload.hiddenDiscoveryPopups : [];
    state.lanterns = Array.isArray(payload.lanterns) ? payload.lanterns : [];
    state.helpedVillagers = Array.isArray(payload.helpedVillagers) ? payload.helpedVillagers : [];
    state.villagerRelations = payload.villagerRelations && typeof payload.villagerRelations === "object" ? payload.villagerRelations : {};
    state.villagerLastMet = payload.villagerLastMet && typeof payload.villagerLastMet === "object" ? payload.villagerLastMet : {};
    state.villagerMemory = payload.villagerMemory && typeof payload.villagerMemory === "object"
      ? Object.fromEntries(Object.entries(payload.villagerMemory).map(([key, value]) => [key, normalizeVillagerMemory(value)]))
      : {};
    state.discoveredPlaces = Array.isArray(payload.discoveredPlaces) ? payload.discoveredPlaces : [];
    state.visitedLandmarks = Array.isArray(payload.visitedLandmarks) ? payload.visitedLandmarks.filter((id) => typeof id === "string") : [];
    state.visitedVillages = Array.isArray(payload.visitedVillages) ? payload.visitedVillages : [];
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
    state.worldDiscoveries = normalizeWorldDiscoveries(payload.worldDiscoveries);
    state.discoveryRespawns = payload.discoveryRespawns && typeof payload.discoveryRespawns === "object" ? payload.discoveryRespawns : {};
    state.discoveryVacancies = payload.discoveryVacancies && typeof payload.discoveryVacancies === "object"
      ? Object.fromEntries(Object.entries(payload.discoveryVacancies).filter(([, vacancy]) => (
        vacancy && Number.isFinite(vacancy.x) && Number.isFinite(vacancy.until) && vacancy.until > state.time
      )))
      : {};
    state.achievements = Array.isArray(payload.achievements) ? payload.achievements : [];
    const hasPortalSchedule = payload.secretPortalScheduleVersion === secretPortalScheduleVersion
      && Number.isFinite(payload.nextSecretAt) && payload.nextSecretAt > 0;
    state.nextSecretAt = hasPortalSchedule ? payload.nextSecretAt : state.time + secretPortalIntervals[0];
    state.secretCycleIndex = hasPortalSchedule && Number.isFinite(payload.secretCycleIndex)
      ? payload.secretCycleIndex % secretPortalIntervals.length
      : 1;
    state.activeSecretPortal = payload.activeSecretPortal && typeof payload.activeSecretPortal === "object"
      && Number.isFinite(payload.activeSecretPortal.x)
      ? payload.activeSecretPortal
      : null;
    state.friendlyChallengeCooldowns = payload.friendlyChallengeCooldowns && typeof payload.friendlyChallengeCooldowns === "object"
      ? Object.fromEntries(Object.entries(payload.friendlyChallengeCooldowns).filter(([, value]) => Number.isFinite(value) && value >= state.time))
      : {};
    state.friendlyChallenge = payload.friendlyChallenge && typeof payload.friendlyChallenge === "object"
      && typeof payload.friendlyChallenge.villageId === "string"
      && Number.isFinite(payload.friendlyChallenge.targetX)
      && Number.isFinite(payload.friendlyChallenge.remaining)
      && payload.friendlyChallenge.remaining > 0
      && payload.friendlyChallenge.villager && typeof payload.friendlyChallenge.villager === "object"
      ? payload.friendlyChallenge
      : null;
    state.itemEffects = payload.itemEffects && typeof payload.itemEffects === "object"
      ? {
        scoutUntil: Number(payload.itemEffects.scoutUntil) || 0,
        scoutTargetId: typeof payload.itemEffects.scoutTargetId === "string" ? payload.itemEffects.scoutTargetId : "",
        strideUntil: Number(payload.itemEffects.strideUntil) || 0,
        glowUntil: Number(payload.itemEffects.glowUntil) || 0,
        compassUntil: Number(payload.itemEffects.compassUntil) || 0,
        compassTargetX: Number(payload.itemEffects.compassTargetX) || 0,
        compassLabel: typeof payload.itemEffects.compassLabel === "string" ? payload.itemEffects.compassLabel : ""
      }
      : { scoutUntil: 0, scoutTargetId: "", strideUntil: 0, glowUntil: 0, compassUntil: 0, compassTargetX: 0, compassLabel: "" };
    state.equipment = payload.equipment && typeof payload.equipment === "object" ? { lanternOn: Boolean(payload.equipment.lanternOn) } : { lanternOn: false };
    state.activeSecretWorld = payload.activeSecretWorld && typeof payload.activeSecretWorld === "object" ? payload.activeSecretWorld : null;
    state.lastSecretWorldId = typeof payload.lastSecretWorldId === "string" ? payload.lastSecretWorldId : "";
    state.lastSecretEdgeMessageAt = 0;
    state.recentDiscoveryNotice = payload.recentDiscoveryNotice && typeof payload.recentDiscoveryNotice === "object" ? payload.recentDiscoveryNotice : null;
    if (state.activeSecretWorld) {
      const secretWorld = getSecretWorldConfig(state.activeSecretWorld.worldId);
      state.activeSecretWorld.worldId = secretWorld.id;
      state.activeSecretWorld.worldName = secretWorld.name;
      if (!Number.isFinite(state.activeSecretWorld.returnAt)) state.activeSecretWorld.returnAt = state.time + 5;
      if (!Number.isFinite(state.activeSecretWorld.forceReturnAt)) state.activeSecretWorld.forceReturnAt = state.activeSecretWorld.returnAt + 5;
      if (!Number.isFinite(state.activeSecretWorld.returnX)) state.activeSecretWorld.returnX = world.firstRouteEnd;
      if (state.player.x < secretWorldOffset) state.player.x = secretWorldOffset + 260;
    }
    state.companion = normalizeCompanionState(payload.companion);
    state.companionGiverX = Number.isFinite(payload.companionGiverX) ? payload.companionGiverX : 0;
    state.microEvents = payload.microEvents && typeof payload.microEvents === "object" ? payload.microEvents : { nextTreeDropAt: state.time + 18, nextRollingAt: state.time + 42, nextShootingStarAt: state.time + 70 };
    state.startedAtLeastOnce = Boolean(payload.startedAtLeastOnce);
    state.cinematicPlayed = Boolean(payload.cinematicPlayed) && state.player.x >= world.firstRouteEnd;
    state.chapter = getChapter(state.player.x);
    const ordinary = Object.values(state.worldDiscoveries)
      .filter((item) => !item.collected && !item.missionItem && !item.grounded && !item.rolling)
      .sort((a, b) => a.x - b.x);
    for (let index = 1; index < ordinary.length; index += 1) {
      const previous = ordinary[index - 1];
      const item = ordinary[index];
      if (item.zoneKey === previous.zoneKey || (!item.zoneKey?.startsWith("secret") && !previous.zoneKey?.startsWith("secret"))) {
        if (item.x - previous.x < minDiscoverySpacing) item.x = previous.x + minDiscoverySpacing;
      }
    }
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

function normalizeInventory(rawInventory) {
  if (!rawInventory || typeof rawInventory !== "object" || Array.isArray(rawInventory)) return {};
  return Object.entries(rawInventory).reduce((inventory, [itemId, count]) => {
    const baseId = baseDiscoveryId(itemId);
    const quantity = Math.floor(Number(count));
    if (!baseId || !Number.isFinite(quantity) || quantity <= 0) return inventory;
    inventory[baseId] = (inventory[baseId] || 0) + quantity;
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
  savePlayerProfile();
}

function savePlayerProfile() {
  const nickname = ui.nicknameInput.value.trim().slice(0, 18) || state.playerProfile.nickname || "Voyageur";
  state.playerProfile.nickname = nickname;
  state.playerProfile.appearance = normalizeAppearance(state.playerProfile.appearance);
  localStorage.setItem(playerKey, JSON.stringify(state.playerProfile));
}

function getChoiceLocked(choice) {
  return typeof choice.locked === "function" ? choice.locked() : Boolean(choice.locked);
}

function openCustomizeDialog() {
  appearanceDraft = normalizeAppearance(state.playerProfile.appearance);
  ui.nicknameInput.value = state.playerProfile.nickname;
  renderAppearanceChoices();
  drawAppearancePreview();
  openDialog(ui.customizeDialog);
}

function renderAppearanceChoices() {
  ui.appearanceChoices.innerHTML = appearanceChoiceGroups.map((group) => {
    const choices = group.choices.map((choice) => {
      const locked = getChoiceLocked(choice);
      const selected = appearanceDraft[group.key] === choice.value;
      const swatch = choice.color
        ? `<span class="appearance-swatch" style="background:${choice.color}"></span>`
        : `<span class="appearance-icon">${choice.icon || choice.label.slice(0, 1)}</span>`;
      const hint = locked ? `<small>${choice.hint || "A debloquer"}</small>` : "";
      return `
        <button class="appearance-choice ${selected ? "is-selected" : ""}" type="button" data-category="${group.key}" data-value="${choice.value}" ${locked ? "disabled" : ""} title="${choice.label}">
          ${swatch}
          <span>${choice.label}</span>
          ${hint}
        </button>
      `;
    }).join("");
    return `
      <section class="appearance-choice-group">
        <h3>${group.title}</h3>
        <div class="appearance-choice-row">${choices}</div>
      </section>
    `;
  }).join("");
}

function chooseAppearanceOption(category, value) {
  const group = appearanceChoiceGroups.find((entry) => entry.key === category);
  const choice = group?.choices.find((entry) => entry.value === value);
  if (!group || !choice || getChoiceLocked(choice)) return;
  appearanceDraft = normalizeAppearance({ ...appearanceDraft, [category]: value });
  renderAppearanceChoices();
  drawAppearancePreview();
}

function applyAppearanceChanges() {
  state.playerProfile.nickname = ui.nicknameInput.value.trim().slice(0, 18) || "Voyageur";
  state.playerProfile.appearance = normalizeAppearance(appearanceDraft || state.playerProfile.appearance);
  ui.nicknameInput.value = state.playerProfile.nickname;
  savePlayerProfile();
  saveGame();
  setPlayerAction("reward", 0.8);
  showMessage("Apparence enregistree.");
}

function cancelAppearanceChanges() {
  appearanceDraft = normalizeAppearance(state.playerProfile.appearance);
  ui.nicknameInput.value = state.playerProfile.nickname;
  drawAppearancePreview();
}

function drawPreviewRoundedRect(previewCtx, x, y, w, h, r) {
  previewCtx.beginPath();
  previewCtx.moveTo(x + r, y);
  previewCtx.arcTo(x + w, y, x + w, y + h, r);
  previewCtx.arcTo(x + w, y + h, x, y + h, r);
  previewCtx.arcTo(x, y + h, x, y, r);
  previewCtx.arcTo(x, y, x + w, y, r);
  previewCtx.closePath();
}

function drawAppearancePreview() {
  if (!ui.appearancePreview) return;
  const previewCtx = ui.appearancePreview.getContext("2d");
  const appearance = normalizeAppearance(appearanceDraft || state.playerProfile.appearance);
  const skin = playerAppearanceOptions.skin[appearance.skin];
  const hair = playerAppearanceOptions.hair[appearance.hair];
  const body = playerAppearanceOptions.outfit[appearance.outfit];
  previewCtx.clearRect(0, 0, ui.appearancePreview.width, ui.appearancePreview.height);
  previewCtx.save();
  previewCtx.translate(110, 146);
  previewCtx.fillStyle = "rgba(0, 0, 0, 0.18)";
  previewCtx.beginPath();
  previewCtx.ellipse(0, 88, 48, 12, 0, 0, Math.PI * 2);
  previewCtx.fill();
  previewCtx.strokeStyle = "#2d2730";
  previewCtx.lineWidth = 10;
  previewCtx.lineCap = "round";
  previewCtx.beginPath();
  previewCtx.moveTo(-14, 42);
  previewCtx.lineTo(-31, 87);
  previewCtx.moveTo(14, 42);
  previewCtx.lineTo(31, 87);
  previewCtx.stroke();
  if (appearance.accessory === "bag") {
    previewCtx.fillStyle = "#8b6840";
    drawPreviewRoundedRect(previewCtx, -48, 0, 30, 46, 9);
    previewCtx.fill();
  }
  previewCtx.fillStyle = body;
  previewCtx.beginPath();
  previewCtx.ellipse(0, 28, 38, 50, 0, 0, Math.PI * 2);
  previewCtx.fill();
  previewCtx.fillStyle = "rgba(255, 255, 255, 0.1)";
  previewCtx.beginPath();
  previewCtx.ellipse(-12, 8, 12, 26, -0.2, 0, Math.PI * 2);
  previewCtx.fill();
  if (appearance.accessory === "scarf") {
    previewCtx.fillStyle = "#d8bd7c";
    drawPreviewRoundedRect(previewCtx, -32, -13, 64, 13, 7);
    previewCtx.fill();
    drawPreviewRoundedRect(previewCtx, 19, -5, 13, 38, 7);
    previewCtx.fill();
  }
  previewCtx.fillStyle = skin;
  previewCtx.beginPath();
  previewCtx.arc(0, -45, 38, 0, Math.PI * 2);
  previewCtx.fill();
  previewCtx.fillStyle = "#28312e";
  previewCtx.beginPath();
  previewCtx.arc(15, -48, 4.8, 0, Math.PI * 2);
  previewCtx.fill();
  previewCtx.fillStyle = hair;
  previewCtx.beginPath();
  previewCtx.ellipse(-12, -66, 43, 22, -0.26, Math.PI * 0.9, Math.PI * 2.08);
  previewCtx.lineTo(-36, -45);
  previewCtx.quadraticCurveTo(-9, -56, 28, -72);
  previewCtx.fill();
  if (appearance.accessory === "hat") {
    previewCtx.fillStyle = "#6f4729";
    drawPreviewRoundedRect(previewCtx, -36, -84, 68, 15, 8);
    previewCtx.fill();
    drawPreviewRoundedRect(previewCtx, -22, -104, 40, 28, 9);
    previewCtx.fill();
  }
  previewCtx.strokeStyle = "#2d2730";
  previewCtx.lineWidth = 9;
  previewCtx.lineCap = "round";
  previewCtx.beginPath();
  previewCtx.moveTo(-28, 18);
  previewCtx.lineTo(-44, 43);
  previewCtx.moveTo(28, 18);
  previewCtx.lineTo(48, -8);
  previewCtx.stroke();
  if (appearance.accessory === "lantern") {
    previewCtx.strokeStyle = "#8b6840";
    previewCtx.lineWidth = 3;
    previewCtx.beginPath();
    previewCtx.moveTo(-34, 35);
    previewCtx.lineTo(-55, 62);
    previewCtx.stroke();
    previewCtx.fillStyle = "rgba(255, 220, 122, 0.8)";
    previewCtx.beginPath();
    previewCtx.ellipse(-60, 69, 11, 15, 0, 0, Math.PI * 2);
    previewCtx.fill();
  }
  previewCtx.restore();
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
    if (payload.audioVersion !== 7) {
      state.options.music = Math.max(state.options.music, 0.38);
      state.options.nature = Math.max(state.options.nature, 0.46);
      state.options.effects = Math.max(state.options.effects, 0.5);
      state.options.audioVersion = 7;
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

function reportAudioError(message, error) {
  console.warn(`[audio] ${message}`, error);
}

function updateMuteButton() {
  ui.muteButton.classList.toggle("is-muted", state.options.muted);
  ui.muteButton.title = state.options.muted ? "Remettre le son" : "Couper le son";
  ui.muteButton.setAttribute("aria-label", ui.muteButton.title);
  if (ui.soundEnabledToggle) ui.soundEnabledToggle.checked = !state.options.muted;
}

function preloadMainMusic() {
  if (mainMusicArrayBufferPromise || typeof fetch !== "function") return mainMusicArrayBufferPromise;
  mainMusicArrayBufferPromise = fetch(mainMusicFile)
    .then((response) => {
      if (!response.ok) throw new Error(`Music preload failed: ${response.status}`);
      return response.arrayBuffer();
    })
    .catch((error) => {
      mainMusicArrayBufferPromise = null;
      reportAudioError(`Impossible de charger ${mainMusicFile}`, error);
      throw error;
    });
  return mainMusicArrayBufferPromise;
}

function decodeMainMusic(context) {
  const preload = preloadMainMusic();
  if (!preload) return Promise.reject(new Error("Music preload unavailable"));
  return preload.then((arrayBuffer) => context.decodeAudioData(arrayBuffer.slice(0)));
}

function setupAudio() {
  if (audio) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  let context;
  try {
    context = new AudioContext();
  } catch (error) {
    reportAudioError("Creation AudioContext impossible.", error);
    return;
  }
  const master = context.createGain();
  const music = context.createGain();
  const nature = context.createGain();
  const effects = context.createGain();
  const musicFilter = context.createBiquadFilter();
  const natureFilter = context.createBiquadFilter();
  const toneA = context.createOscillator();
  const toneB = context.createOscillator();
  const toneC = context.createOscillator();
  const toneGains = [context.createGain(), context.createGain(), context.createGain()];
  const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i += 1) noiseData[i] = Math.random() * 2 - 1;
  const noise = context.createBufferSource();

  toneA.type = "triangle";
  toneA.frequency.value = 98;
  toneB.type = "sine";
  toneB.frequency.value = 146.83;
  toneC.type = "triangle";
  toneC.frequency.value = 196;
  toneA.detune.value = -3;
  toneC.detune.value = 4;
  toneGains[0].gain.value = 0.32;
  toneGains[1].gain.value = 0.18;
  toneGains[2].gain.value = 0.12;
  master.gain.value = 0;
  music.gain.value = 0;
  nature.gain.value = 0;
  effects.gain.value = 0;
  musicFilter.type = "lowpass";
  musicFilter.frequency.value = 720;
  musicFilter.Q.value = 0.45;
  natureFilter.type = "lowpass";
  natureFilter.frequency.value = 320;
  natureFilter.Q.value = 0.28;
  noise.buffer = noiseBuffer;
  noise.loop = true;

  [toneA, toneB, toneC].forEach((tone, index) => {
    tone.connect(toneGains[index]);
    toneGains[index].connect(musicFilter);
  });
  musicFilter.connect(music);
  noise.connect(natureFilter);
  natureFilter.connect(nature);
  music.connect(master);
  nature.connect(master);
  effects.connect(master);
  master.connect(context.destination);
  toneA.start();
  toneB.start();
  toneC.start();
  noise.start();

  audio = { context, master, music, nature, effects, musicFilter, natureFilter, musicBuffer: null };
  audio.tones = [toneA, toneB, toneC];
  audio.toneGains = toneGains;
  audio.musicSources = [];
  audio.musicPlaying = false;
  audio.musicOffset = 0;
  audio.musicPlaybackStartedAt = 0;
  audio.musicNextStartAt = 0;
  audio.nextAmbient = 0;
  audio.nextMusicCue = 0;
  audio.musicReady = false;
  setupFallbackMusicElement();
  audio.musicDecodePromise = preloadMainMusic()
    .then(() => null)
    .catch((error) => {
      reportAudioError(`Verification du fichier ${mainMusicFile} impossible.`, error);
      return null;
    });
  updateAudio();
}

function setupFallbackMusicElement() {
  if (!audio || audio.musicFallbackElement) return;
  const musicElement = new Audio(mainMusicFile);
  musicElement.loop = true;
  musicElement.preload = "auto";
  musicElement.volume = 1;
  musicElement.setAttribute("playsinline", "");
  musicElement.setAttribute("webkit-playsinline", "");
  musicElement.addEventListener("error", () => reportAudioError(`Erreur de lecture du fichier ${mainMusicFile}.`, musicElement.error));
  musicElement.addEventListener("stalled", () => reportAudioError(`Chargement audio interrompu pour ${mainMusicFile}.`, musicElement.networkState));
  musicElement.addEventListener("abort", () => reportAudioError(`Chargement audio annule pour ${mainMusicFile}.`, musicElement.networkState));
  try {
    const musicSource = audio.context.createMediaElementSource(musicElement);
    musicSource.connect(audio.music);
    audio.musicFallbackElement = musicElement;
    audio.musicFallbackSource = musicSource;
    audio.musicReady = true;
    updateAudio();
  } catch (error) {
    reportAudioError("Creation du lecteur audio de secours impossible.", error);
    audio.musicReady = false;
  }
}

async function unlockAudioFromUserGesture() {
  if (!audio) return;
  if (audio.context.state === "suspended") {
    await audio.context.resume().catch((error) => reportAudioError("AudioContext bloque apres l'interaction utilisateur.", error));
  }
  if (audio.musicDecodePromise && !isAudioMuted() && state.options.music > 0) {
    await audio.musicDecodePromise.catch((error) => reportAudioError("Musique principale indisponible apres le demarrage.", error));
  }
  updateAudio();
}

function updateAudio() {
  if (!audio) return;
  const streamDistance = Math.abs(state.player.x - 3820);
  const stream = Math.max(0, 1 - streamDistance / 900);
  const now = audio.context.currentTime;
  const mute = isAudioMuted() ? 0 : 1;
  const scene = getAudioScene();
  if (scene.key !== audioSceneKey) {
    audioSceneKey = scene.key;
    audio.tones.forEach((tone, index) => tone.frequency.setTargetAtTime(scene.notes[index], now, 4.5));
    audio.nextMusicCue = now + 1.8 + hashNumber(state.time + state.player.x) * 4.5;
    audio.nextAmbient = now + 2.5 + hashNumber(state.player.x + scene.notes[0]) * 6;
  }
  const musicVolume = state.options.music <= 0 ? 0 : state.options.music * scene.musicLevel * 0.34;
  const rainBed = scene.ambient === "rain-wind" ? weatherVisual.rain * 0.09 : 0;
  const natureVolume = state.options.nature <= 0 ? 0 : state.options.nature * scene.natureLevel * (0.18 + stream * 0.08 + rainBed);
  const effectsVolume = state.options.effects <= 0 ? 0 : state.options.effects;
  audio.master.gain.setTargetAtTime(mute, now, mute <= 0 ? 0.01 : 0.12);
  audio.music.gain.setTargetAtTime(musicVolume, now, state.options.music <= 0 ? 0.02 : 1.8);
  audio.nature.gain.setTargetAtTime(natureVolume, now, state.options.nature <= 0 ? 0.02 : 1.8);
  audio.effects.gain.setTargetAtTime(effectsVolume, now, state.options.effects <= 0 ? 0.01 : 0.08);
  audio.musicFilter.frequency.setTargetAtTime(scene.filter, now, 1.4);
  audio.natureFilter.frequency.setTargetAtTime(scene.natureFilter + stream * 240, now, 1.4);
  syncMusicFilePlayback(mute, musicVolume);
  if (mute <= 0) return;
  if (!audio.musicReady && state.options.music > 0 && now >= audio.nextMusicCue) {
    playMusicCue(scene);
    audio.nextMusicCue = now + scene.cueInterval + hashNumber(now + state.player.x) * scene.cueJitter;
  }
  if (state.options.nature > 0 && now >= audio.nextAmbient) {
    playAmbientCue(scene);
    audio.nextAmbient = now + scene.interval + hashNumber(now + scene.filter) * scene.ambientJitter;
  }
}

function syncMusicFilePlayback(mute, musicVolume) {
  if (!audio?.musicReady || (!audio.musicBuffer && !audio.musicFallbackElement)) return;
  const shouldPlay = mute > 0 && musicVolume > 0 && running;
  if (!shouldPlay) {
    stopMainMusicPlayback();
    return;
  }
  if (audio.context.state === "suspended") {
    audio.context.resume().catch((error) => reportAudioError("Reprise AudioContext refusee.", error));
  }
  if (audio.musicBuffer) {
    scheduleMainMusicLoop();
  } else {
    syncFallbackMusicPlayback(true);
  }
}

function syncFallbackMusicPlayback(shouldPlay) {
  const musicElement = audio?.musicFallbackElement;
  if (!musicElement) return;
  musicElement.muted = !shouldPlay;
  if (!shouldPlay) {
    if (!musicElement.paused) musicElement.pause();
    return;
  }
  if (!musicElement.paused) return;
  const playPromise = musicElement.play();
  if (playPromise?.catch) playPromise.catch((error) => reportAudioError("Lecture de la musique de secours refusee.", error));
}

function getMainMusicCycleSeconds() {
  if (!audio?.musicBuffer) return 0;
  return Math.max(0.1, audio.musicBuffer.duration - musicLoopCrossfadeSeconds);
}

function getMainMusicOffset() {
  if (!audio?.musicBuffer || !audio.musicPlaying) return audio?.musicOffset || 0;
  const cycle = getMainMusicCycleSeconds();
  return ((audio.context.currentTime - audio.musicPlaybackStartedAt) % cycle + cycle) % cycle;
}

function disconnectAudioNode(node) {
  try { node.disconnect(); } catch {}
}

function scheduleMainMusicLoop() {
  if (!audio?.musicBuffer) return;
  const now = audio.context.currentTime;
  const buffer = audio.musicBuffer;
  const cycle = getMainMusicCycleSeconds();
  if (!audio.musicPlaying) {
    const offset = Math.min(audio.musicOffset || 0, cycle - 0.01);
    const startAt = now + 0.03;
    audio.musicPlaybackStartedAt = startAt - offset;
    audio.musicNextStartAt = startAt;
    audio.musicPlaying = true;
  }

  while (audio.musicNextStartAt < now + musicScheduleLookaheadSeconds) {
    const isFirstSource = audio.musicSources.length === 0;
    const offset = isFirstSource ? Math.min(audio.musicOffset || 0, cycle - 0.01) : 0;
    const startAt = audio.musicNextStartAt;
    const playableSeconds = Math.max(0.05, buffer.duration - offset);
    const endAt = startAt + playableSeconds;
    const source = audio.context.createBufferSource();
    const sourceGain = audio.context.createGain();

    source.buffer = buffer;
    sourceGain.gain.setValueAtTime(isFirstSource ? 1 : 0.0001, startAt);
    if (!isFirstSource) sourceGain.gain.linearRampToValueAtTime(1, startAt + musicLoopCrossfadeSeconds);
    sourceGain.gain.setValueAtTime(1, Math.max(startAt, endAt - musicLoopCrossfadeSeconds));
    sourceGain.gain.linearRampToValueAtTime(0.0001, endAt);
    source.connect(sourceGain);
    sourceGain.connect(audio.music);
    source.onended = () => {
      if (!audio) {
        disconnectAudioNode(source);
        disconnectAudioNode(sourceGain);
        return;
      }
      audio.musicSources = audio.musicSources.filter((entry) => entry.source !== source);
      disconnectAudioNode(source);
      disconnectAudioNode(sourceGain);
    };
    source.start(startAt, offset);
    source.stop(endAt + 0.02);
    audio.musicSources.push({ source, gain: sourceGain });
    audio.musicNextStartAt = startAt + Math.max(0.05, playableSeconds - musicLoopCrossfadeSeconds);
  }
  audio.musicOffset = getMainMusicOffset();
}

function stopMainMusicPlayback() {
  if (!audio) return;
  syncFallbackMusicPlayback(false);
  if (!audio.musicPlaying && audio.musicSources.length === 0) return;
  audio.musicOffset = getMainMusicOffset();
  audio.musicPlaying = false;
  audio.musicNextStartAt = 0;
  audio.musicSources.forEach(({ source, gain }) => {
    try { source.stop(); } catch {}
    disconnectAudioNode(source);
    disconnectAudioNode(gain);
  });
  audio.musicSources = [];
}

function destroyAudio() {
  if (!audio) return;
  stopMainMusicPlayback();
  audio.tones.forEach((tone) => {
    try { tone.stop(); } catch {}
    disconnectAudioNode(tone);
  });
  if (audio.musicFallbackElement) {
    audio.musicFallbackElement.pause();
    audio.musicFallbackElement.removeAttribute("src");
    audio.musicFallbackElement.load();
  }
  if (audio.musicFallbackSource) disconnectAudioNode(audio.musicFallbackSource);
  audio.context.close().catch((error) => reportAudioError("Fermeture AudioContext impossible.", error));
  audio = null;
  audioSceneKey = "";
}

function pauseAudioForPageHide() {
  if (!audio) return;
  stopMainMusicPlayback();
  if (audio.context.state === "running") {
    audio.context.suspend().catch((error) => reportAudioError("Suspension audio impossible.", error));
  }
}

function resumeAudioAfterMobileInterruption() {
  if (!running || isAudioMuted()) return;
  setupAudio();
  if (audio?.context?.state === "suspended") {
    audio.context.resume().catch((error) => reportAudioError("Reprise audio apres interruption refusee.", error));
  }
  if (audio) updateAudio();
}

function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function isStandaloneDisplay() {
  return window.matchMedia?.("(display-mode: fullscreen)")?.matches
    || window.matchMedia?.("(display-mode: standalone)")?.matches
    || navigator.standalone === true;
}

function updateFullscreenButton() {
  // Display mode changes remain handled for browser and PWA resizing.
}

function handleFullscreenChange() {
  updateFullscreenButton();
  setTimeout(resizeGame, 80);
}

async function lockLandscapeIfPossible() {
  if (!screen.orientation?.lock) return;
  if (!window.matchMedia?.("(pointer: coarse)")?.matches) return;
  await screen.orientation.lock("landscape").catch((error) => console.info("[fullscreen] Verrouillage orientation indisponible.", error));
}

function getFullscreenTargets() {
  return [
    document.documentElement,
    document.querySelector(".game-shell"),
    canvas
  ].filter(Boolean);
}

async function toggleFullscreen() {
  const active = getFullscreenElement();
  if (active) {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) {
      const promise = exit.call(document);
      if (promise?.catch) promise.catch((error) => console.warn("[fullscreen] Sortie plein ecran refusee.", error));
    }
    return;
  }
  const targets = getFullscreenTargets().filter((candidate) => candidate.requestFullscreen || candidate.webkitRequestFullscreen);
  for (const target of targets) {
    const request = target.requestFullscreen || target.webkitRequestFullscreen;
    try {
      const promise = request.call(target, { navigationUI: "hide" });
      if (promise?.then) await promise;
      resizeGame();
      lockLandscapeIfPossible();
      return;
    } catch (error) {
      console.warn("[fullscreen] Plein ecran refuse pour une cible.", error);
    }
  }
  console.info("[fullscreen] API Fullscreen indisponible ou refusee. Sur iPhone Safari, installe la PWA via Ajouter a l'ecran d'accueil pour supprimer la barre du navigateur.");
  showMessageFor("Installe la PWA pour le plein ecran.", 3200);
  updateFullscreenButton();
}

function getAudioScene() {
  if (isInSecretWorld()) {
    const secretWorld = getSecretWorldConfig();
    return {
      key: `secret-${secretWorld.id}`,
      notes: secretWorld.notes,
      filter: secretWorld.id === "cloud-valley" ? 760 : secretWorld.id === "star-river" ? 520 : 420,
      natureFilter: secretWorld.id === "cloud-valley" ? 620 : secretWorld.id === "star-river" ? 460 : 340,
      musicLevel: secretWorld.id === "firefly-garden" ? 0.72 : 0.86,
      natureLevel: secretWorld.id === "star-river" ? 1.45 : 1.15,
      ambient: secretWorld.ambient,
      interval: secretWorld.id === "firefly-garden" ? 6.5 : secretWorld.id === "cloud-valley" ? 8.2 : 9.6,
      ambientJitter: 7,
      cueInterval: secretWorld.id === "cloud-valley" ? 13 : 15,
      cueJitter: 9
    };
  }
  const season = getSeason();
  const weather = getWeatherForChapter().id;
  const place = getPlaceType();
  const night = isNightPlace();
  const scene = {
    key: `${season}-${weather}-${place}-${night ? "night" : "day"}`,
    notes: [98, 146.83, 196],
    filter: 560,
    natureFilter: 320,
    musicLevel: 1,
    natureLevel: 1,
    ambient: "birds",
    interval: 12,
    ambientJitter: 9,
    cueInterval: 14,
    cueJitter: 10
  };
  if (season === "Printemps") {
    scene.notes = [110, 164.81, 220];
    scene.filter = 620;
    scene.natureLevel = 1.2;
  } else if (season === "Ete") {
    scene.notes = [123.47, 185, 246.94];
    scene.filter = 680;
  } else if (season === "Automne") {
    scene.notes = [98, 146.83, 220];
    scene.filter = 500;
  } else {
    scene.notes = [82.41, 123.47, 185];
    scene.filter = 420;
    scene.musicLevel = 0.82;
  }
  if (weather === "rain") {
    scene.notes = scene.notes.map((note) => note * 0.94);
    scene.filter = 520;
    scene.natureFilter = 520;
    scene.natureLevel = 1.65;
    scene.ambient = "rain-wind";
    scene.interval = 7;
  } else if (weather === "wind") {
    scene.notes = scene.notes.map((note) => note * 1.04);
    scene.filter = 640;
    scene.natureFilter = 620;
    scene.natureLevel = 1.35;
    scene.ambient = "wind";
    scene.interval = 8;
  } else if (weather === "snow") {
    scene.notes = scene.notes.map((note) => note * 0.88);
    scene.filter = 380;
    scene.natureFilter = 240;
    scene.natureLevel = 0.72;
    scene.ambient = "snow";
    scene.interval = 13;
  } else if (weather === "mist") {
    scene.filter = 360;
    scene.natureFilter = 260;
    scene.musicLevel = 0.75;
    scene.ambient = "mist";
    scene.interval = 11;
  }
  if (night) {
    scene.notes = [82.41, 123.47, 196];
    scene.filter = Math.min(scene.filter, 430);
    scene.natureLevel += 0.38;
    scene.ambient = "crickets";
    scene.interval = 9.5;
    scene.cueInterval = 18;
  }
  if (place === "Village") {
    scene.notes = [110, 164.81, 246.94];
    scene.musicLevel += 0.18;
    scene.ambient = "village";
    scene.interval = 13;
  } else if (place === "Riviere") {
    scene.filter += 80;
    scene.natureFilter += 260;
    scene.natureLevel += 0.42;
    scene.ambient = weather === "rain" ? "rain-wind" : "river";
    scene.interval = 8.5;
  } else if (place === "Montagne") {
    scene.notes = scene.notes.map((note) => note * 0.82);
    scene.musicLevel = Math.max(0.55, scene.musicLevel - 0.16);
    scene.ambient = weather === "snow" ? "snow" : "wind";
    scene.interval = 12;
  }
  return scene;
}

function playAmbientCue(scene) {
  if (!audio || isAudioMuted() || state.options.nature <= 0) return;
  const now = audio.context.currentTime;
  const gain = audio.context.createGain();
  const oscillator = audio.context.createOscillator();
  oscillator.type = scene.ambient === "wind" || scene.ambient === "rain-wind" ? "triangle" : "sine";
  const frequencies = {
    birds: [440, 493.88],
    "rain-wind": [130.81, 98],
    wind: [164.81, 123.47],
    crickets: [659.25, 587.33],
    village: [329.63, 261.63],
    river: [246.94, 196],
    snow: [196, 146.83],
    mist: [220, 164.81]
  };
  const pair = frequencies[scene.ambient] || frequencies.birds;
  oscillator.frequency.setValueAtTime(pair[0], now);
  oscillator.frequency.exponentialRampToValueAtTime(pair[1], now + 0.85);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.024, now + 0.18);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (scene.ambient === "river" || scene.ambient === "wind" ? 1.9 : 1.25));
  oscillator.connect(gain);
  gain.connect(audio.nature);
  oscillator.start(now);
  oscillator.stop(now + (scene.ambient === "river" || scene.ambient === "wind" ? 2 : 1.35));
}

function playMusicCue(scene) {
  if (!audio || isAudioMuted() || state.options.music <= 0) return;
  const now = audio.context.currentTime;
  const base = scene.notes[Math.floor(hashNumber(now + state.player.x) * scene.notes.length) % scene.notes.length];
  const harmony = base * (hashNumber(now + scene.filter) > 0.55 ? 1.5 : 1.25);
  [base, harmony].forEach((frequency, index) => {
    const oscillator = audio.context.createOscillator();
    const gain = audio.context.createGain();
    oscillator.type = index === 0 ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.12);
    oscillator.detune.value = index === 0 ? -2 : 3;
    gain.gain.setValueAtTime(0.0001, now + index * 0.12);
    gain.gain.exponentialRampToValueAtTime(index === 0 ? 0.026 : 0.014, now + 0.28 + index * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4 + index * 0.2);
    oscillator.connect(gain);
    gain.connect(audio.music);
    oscillator.start(now + index * 0.12);
    oscillator.stop(now + 2.55 + index * 0.2);
  });
}

function playSoftPing() {
  if (!audio || isAudioMuted() || state.options.effects <= 0) return;
  const oscillator = audio.context.createOscillator();
  const gain = audio.context.createGain();
  const now = audio.context.currentTime;
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(329.63, now);
  oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.12);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.055, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
  oscillator.connect(gain);
  gain.connect(audio.effects);
  oscillator.start(now);
  oscillator.stop(now + 0.38);
}

function playDiscoveryChime(rarity = "Commun") {
  if (!audio || isAudioMuted() || state.options.effects <= 0) return;
  const now = audio.context.currentTime;
  const notes = rarity === "Legendaire"
    ? [523.25, 659.25, 783.99]
    : rarity === "Rare"
      ? [440, 554.37]
      : [392];
  notes.forEach((frequency, index) => {
    const oscillator = audio.context.createOscillator();
    const gain = audio.context.createGain();
    const start = now + index * 0.055;
    oscillator.type = rarity === "Commun" ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime((rarity === "Commun" ? 0.026 : 0.038) * state.options.effects, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28 + index * 0.04);
    oscillator.connect(gain);
    gain.connect(audio.effects);
    oscillator.start(start);
    oscillator.stop(start + 0.34 + index * 0.04);
  });
}

window.addEventListener("resize", resizeGame);
window.addEventListener("orientationchange", () => {
  setTimeout(resizeGame, 200);
  setTimeout(resumeAudioAfterMobileInterruption, 250);
});
window.visualViewport?.addEventListener("resize", resizeGame);
window.addEventListener("pagehide", pauseAudioForPageHide);
window.addEventListener("pageshow", () => {
  resizeGame();
  resumeAudioAfterMobileInterruption();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pauseAudioForPageHide();
  } else {
    resizeGame();
    resumeAudioAfterMobileInterruption();
  }
});
window.addEventListener("focus", resumeAudioAfterMobileInterruption);
window.addEventListener("blur", () => {
  keys.clear();
  resetTouchControls();
});
document.addEventListener("fullscreenchange", handleFullscreenChange);
document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

function isKeyboardShortcutBlocked(target) {
  return Boolean(target?.matches?.("input, textarea, select, [contenteditable='true']"));
}

window.addEventListener("keydown", (event) => {
  if (isKeyboardShortcutBlocked(event.target)) return;
  if (event.key === "Escape" && running && !isModalOpen()) {
    event.preventDefault();
    pauseGame();
    return;
  }
  if (isModalOpen()) return;
  if (event.key === "Shift") {
    event.preventDefault();
    if (!event.repeat && running) toggleMoveMode();
    return;
  }
  if (event.key === "c" || event.key === "C") {
    event.preventDefault();
    if (!event.repeat && running && state.companion.unlocked) {
      toggleCompanionPresence();
      showMessage(state.companion.present === false ? "Compagnon rappele" : "Compagnon a vos cotes");
    }
    return;
  }
  keys.add(event.key);
  if (event.key === "e" || event.key === "E") {
    event.preventDefault();
    if (running) interact();
  } else if (event.key === " " || event.key === "ArrowUp" || event.key === "w" || event.key === "W" || event.key === "z" || event.key === "Z") {
    event.preventDefault();
    triggerPlayerHop();
  }
});
window.addEventListener("keyup", (event) => keys.delete(event.key));

document.addEventListener("pointerdown", () => {
  pointerGestureId += 1;
  lastPointerGestureId = pointerGestureId;
}, true);
document.addEventListener("click", (event) => {
  if (event.detail === 0) return;
  const guarded = event.target.closest?.("[data-interaction-gesture]");
  if (!guarded || guarded.dataset.interactionGesture !== String(lastPointerGestureId)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}, true);

canvas.addEventListener("pointerdown", (event) => {
  if (!running) return;
  pointer.active = false;
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.worldX = state.camera.x + event.clientX;
  if (Math.abs(pointer.worldX - state.player.x) < 95) interact();
});

canvas.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.worldX = state.camera.x + event.clientX;
});

canvas.addEventListener("pointerup", () => {
  pointer.active = false;
});
canvas.addEventListener("pointercancel", () => {
  pointer.active = false;
});
canvas.addEventListener("pointerleave", () => {
  pointer.active = false;
});

ui.mobilePad.addEventListener("pointerdown", (event) => {
  if (event.target.closest(".pad-action, .pad-mode-menu")) return;
  joystick.active = true;
  joystick.id = event.pointerId;
  joystick.jumpArmed = true;
  ui.mobilePad.setPointerCapture(event.pointerId);
  updateJoystickFromPointer(event);
});

ui.mobilePad.addEventListener("pointermove", (event) => {
  if (!joystick.active || event.pointerId !== joystick.id) return;
  updateJoystickFromPointer(event);
});

ui.mobilePad.addEventListener("pointerup", stopJoystick);
ui.mobilePad.addEventListener("pointercancel", stopJoystick);
ui.mobilePad.addEventListener("lostpointercapture", stopJoystick);
ui.padJumpButton.addEventListener("click", () => {
  triggerPlayerHop();
  setJoystickZone("jump");
  window.setTimeout(() => updateMobilePadActionState(joystick.active ? joystick.lastZone : "idle"), 180);
});
ui.padModeButton.addEventListener("click", toggleMoveMode);
ui.padCompanionButton.addEventListener("click", () => {
  if (!state.companion.unlocked) {
    showMessage("Tu n'as pas encore de compagnon sur ce chemin.");
    return;
  }
  toggleCompanionPresence();
  updateMobilePadCompanionState();
  showMessage(state.companion.present === false ? "Compagnon cache" : "Compagnon a vos cotes");
  if (navigator.vibrate) navigator.vibrate(12);
});

ui.startButton.addEventListener("click", () => startGame(true));
ui.continueButton.addEventListener("click", () => startGame(false));
ui.pauseButton.addEventListener("click", pauseGame);
ui.customizeButton.addEventListener("click", openCustomizeDialog);
document.querySelectorAll(".panel-dialog form").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const dialog = form.closest(".panel-dialog");
    if (dialog === ui.villagerDialog && pendingVillagerConversation) return;
    closeDialog(dialog);
  });
});
ui.appearanceChoices.addEventListener("click", (event) => {
  const button = event.target.closest(".appearance-choice");
  if (!button) return;
  chooseAppearanceOption(button.dataset.category, button.dataset.value);
});
ui.nicknameInput.addEventListener("input", drawAppearancePreview);
ui.applyAppearanceButton.addEventListener("click", applyAppearanceChanges);
ui.cancelAppearanceButton.addEventListener("click", cancelAppearanceChanges);
ui.customizeDialog.addEventListener("close", cancelAppearanceChanges);
ui.giveItemButton.addEventListener("click", givePendingItem);
ui.challengeButton.addEventListener("click", startFriendlyChallenge);
ui.refuseHelpButton.addEventListener("click", refusePendingHelp);
ui.villagerChoices.addEventListener("click", (event) => {
  const button = event.target.closest(".dialog-choice-button");
  if (!button) return;
  handleVillagerChoice(Number(button.dataset.choiceIndex));
});
ui.claimQuestRewardButton.addEventListener("click", claimQuestReward);
ui.questCompleteDialog.addEventListener("cancel", (event) => {
  if (state.pendingQuestReward) event.preventDefault();
});
ui.questDialog.addEventListener("close", () => {
  if (state.activeQuest) showMissionTracker("new", state.activeQuest);
});
ui.questCompleteDialog.addEventListener("close", () => {
  if (!completedMissionNotice) return;
  showMissionTracker("complete", completedMissionNotice);
  completedMissionNotice = null;
});
ui.missionTracker.addEventListener("click", () => {
  if (state.pendingQuestReward && !ui.questCompleteDialog.open) openQuestCompletePopup(state.pendingQuestReward);
});
ui.journalButton.addEventListener("click", () => {
  buildJournal();
  openDialog(ui.journalDialog);
});
ui.journalList.addEventListener("click", (event) => {
  const toggle = event.target.closest("[data-companion-toggle]");
  if (toggle) {
    toggleCompanionPresence();
    return;
  }
  const card = event.target.closest(".encyclopedia-card[data-item-id]");
  if (card) openEncyclopediaDetail(card.dataset.itemId);
});
ui.journalList.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest(".encyclopedia-card[data-item-id]");
  if (!card) return;
  event.preventDefault();
  openEncyclopediaDetail(card.dataset.itemId);
});
ui.encyclopediaDetailBody.addEventListener("click", (event) => {
  const action = event.target.closest("[data-item-action]");
  if (!action) return;
  if (action.dataset.itemAction === "portal") invokePortalFromItem();
  if (action.dataset.itemAction === "companion") openCompanionSelector();
  if (action.dataset.itemAction === "scout") useScoutItem(ui.encyclopediaDetailTitle.dataset.itemId);
  if (action.dataset.itemAction === "stride") useStrideItem(ui.encyclopediaDetailTitle.dataset.itemId);
  if (action.dataset.itemAction === "glow") useGlowItem(ui.encyclopediaDetailTitle.dataset.itemId);
  if (action.dataset.itemAction === "compass") useCompassItem(ui.encyclopediaDetailTitle.dataset.itemId);
  if (action.dataset.itemAction === "lantern") toggleLanternEquipment();
  if (action.dataset.itemAction === "gift") offerGiftItem(ui.encyclopediaDetailTitle.dataset.itemId);
});
ui.companionSelectGrid.addEventListener("click", (event) => {
  const option = event.target.closest("[data-companion-species]");
  if (option) selectCompanionSpecies(option.dataset.companionSpecies);
});
ui.confirmCompanionChangeButton.addEventListener("click", confirmCompanionChange);
ui.cancelCompanionChangeButton.addEventListener("click", () => {
  pendingCompanionSpecies = "";
  closeDialog(ui.companionSelectDialog);
});
ui.companionSelectDialog.addEventListener("close", () => {
  pendingCompanionSpecies = "";
  ui.companionConfirmActions.hidden = true;
});
ui.infoButton.addEventListener("click", () => openDialog(ui.infoDialog));
ui.discoveryDialog.addEventListener("close", closeDiscoveryPopup);
ui.villagerDialog.addEventListener("close", () => {
  if (pendingVillagerConversation) {
    // A choice is a real turn in the conversation: keep it available until clicked.
    requestAnimationFrame(() => {
      openDialog(ui.villagerDialog);
      setVillagerDialogMode("choices");
    });
    return;
  }
  pendingVillagerConversation = null;
  setVillagerDialogMode("help");
});
ui.villagerDialog.addEventListener("cancel", (event) => {
  if (!pendingVillagerConversation) return;
  event.preventDefault();
  showMessage("Choisis une reponse pour continuer la conversation.");
});
ui.optionsButton.addEventListener("click", () => {
  updateMissionReminderButton();
  openDialog(ui.optionsDialog);
});
ui.muteButton.addEventListener("click", () => {
  state.options.muted = !state.options.muted;
  updateMuteButton();
  saveOptions();
  resumeAudioAfterMobileInterruption();
  if (audio) updateAudio();
});
ui.soundEnabledToggle.addEventListener("change", () => {
  state.options.muted = !ui.soundEnabledToggle.checked;
  updateMuteButton();
  saveOptions();
  resumeAudioAfterMobileInterruption();
  if (audio) updateAudio();
});
ui.missionReminderButton.addEventListener("click", showMissionReminder);
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
preloadMainMusic()?.catch((error) => reportAudioError("Prechargement initial de la musique impossible.", error));
const hasSave = loadGame();
ui.nicknameInput.value = state.playerProfile.nickname;
ui.continueButton.disabled = !hasSave;
ui.continueButton.style.opacity = hasSave ? "1" : "0.55";
updateMissionTracker();
resizeGame();
updateFullscreenButton();
draw();
requestAnimationFrame(loop);
