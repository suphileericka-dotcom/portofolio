const fs = require("fs");
const http = require("http");
const path = require("path");
const express = require("express");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3000;
const SAVE_FILE = path.join(__dirname, "server-save.json");
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_PLAYERS = 4;

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(__dirname));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "bosquet-lent-realtime", parties: Object.keys(parties).length });
});

const parties = loadParties();

function loadParties() {
  try {
    const raw = fs.readFileSync(SAVE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveParties() {
  fs.writeFile(SAVE_FILE, JSON.stringify(parties, null, 2), () => {});
}

function createCode() {
  let code = "";
  do {
    code = Array.from({ length: 6 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");
  } while (parties[code]);
  return code;
}

function sanitizePlayer(player = {}) {
  return {
    id: String(player.id || "").slice(0, 80),
    nickname: String(player.nickname || "Voyageur").slice(0, 18),
    x: Number.isFinite(player.x) ? player.x : 380,
    face: player.face === -1 ? -1 : 1,
    resting: Boolean(player.resting),
    connected: true,
    lastSeen: Date.now()
  };
}

function makeParty(code) {
  return {
    code,
    minPlayers: 2,
    maxPlayers: MAX_PLAYERS,
    members: [],
    discoveries: [],
    lanterns: [],
    helpedVillagers: [],
    groupRest: 0,
    reactions: [],
    progress: { cinematicPlayed: false, chapter: 1 }
  };
}

function getSnapshot(party) {
  return {
    party: {
      code: party.code,
      minPlayers: party.minPlayers,
      maxPlayers: party.maxPlayers,
      members: party.members
    },
    discoveries: party.discoveries,
    lanterns: party.lanterns,
    helpedVillagers: party.helpedVillagers,
    groupRest: party.groupRest,
    reactions: party.reactions.filter((reaction) => reaction.until > Date.now()),
    progress: party.progress
  };
}

function addPlayer(party, player) {
  const resolved = sanitizePlayer(player);
  if (!resolved.id) return { error: "Joueur invalide." };
  const existingIndex = party.members.findIndex((member) => member.id === resolved.id);
  if (existingIndex === -1 && party.members.length >= MAX_PLAYERS) return { error: "Cette partie est pleine. Maximum 4 joueurs." };
  if (existingIndex >= 0) party.members[existingIndex] = { ...party.members[existingIndex], ...resolved };
  else party.members.push(resolved);
  return { player: resolved };
}

function applyAction(party, player, action = {}) {
  const member = party.members.find((entry) => entry.id === player.id);
  if (member) Object.assign(member, sanitizePlayer(player));

  if (action.type === "move" && member) {
    member.x = Number.isFinite(action.payload.x) ? action.payload.x : member.x;
    member.face = action.payload.face === -1 ? -1 : 1;
    member.resting = Boolean(action.payload.resting);
  }

  if (action.type === "collect" && action.payload.itemId && !party.discoveries.includes(action.payload.itemId)) {
    party.discoveries.push(action.payload.itemId);
  }

  if (action.type === "lantern" && action.payload.lanternId && !party.lanterns.includes(action.payload.lanternId)) {
    party.lanterns.push(action.payload.lanternId);
  }

  if (action.type === "help-villager") {
    if (party.helpedVillagers.includes(action.payload.villageId)) return;
    party.helpedVillagers.push(action.payload.villageId);
  }

  if (action.type === "rest") {
    party.groupRest = 1;
    if (member) member.resting = true;
  }

  if (action.type === "reaction" && action.payload.symbol) {
    party.reactions.push({
      actorId: player.id,
      symbol: String(action.payload.symbol).slice(0, 4),
      until: Number.isFinite(action.payload.until) ? action.payload.until : Date.now() + 4000
    });
    party.reactions = party.reactions.filter((reaction) => reaction.until > Date.now()).slice(-20);
  }
}

io.on("connection", (socket) => {
  socket.on("party:create", ({ player }) => {
    const code = createCode();
    const party = makeParty(code);
    const result = addPlayer(party, player);
    if (result.error) {
      socket.emit("party:error", { message: result.error });
      return;
    }
    parties[code] = party;
    socket.join(code);
    saveParties();
    socket.emit("party:created", { snapshot: getSnapshot(party) });
  });

  socket.on("party:join", ({ code, player }) => {
    const normalizedCode = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    const party = parties[normalizedCode];
    if (!party) {
      socket.emit("party:error", { message: "Code introuvable. Cree une partie ou verifie le code." });
      return;
    }
    const result = addPlayer(party, player);
    if (result.error) {
      socket.emit("party:error", { message: result.error });
      return;
    }
    socket.join(normalizedCode);
    saveParties();
    io.to(normalizedCode).emit("party:joined", { snapshot: getSnapshot(party) });
  });

  socket.on("party:leave", ({ code, playerId }) => {
    const party = parties[String(code || "").toUpperCase()];
    if (!party) return;
    party.members = party.members.filter((member) => member.id !== playerId);
    socket.leave(party.code);
    saveParties();
    io.to(party.code).emit("party:snapshot", { snapshot: getSnapshot(party) });
  });

  socket.on("party:action", ({ code, player, action }) => {
    const party = parties[String(code || "").toUpperCase()];
    if (!party) {
      socket.emit("party:error", { message: "Partie introuvable." });
      return;
    }
    applyAction(party, sanitizePlayer(player), action);
    saveParties();
    io.to(party.code).emit("party:snapshot", { snapshot: getSnapshot(party) });
  });
});

setInterval(() => {
  Object.values(parties).forEach((party) => {
    party.groupRest = Math.max(0, party.groupRest - 0.08);
    party.reactions = party.reactions.filter((reaction) => reaction.until > Date.now());
  });
}, 1000);

server.listen(PORT, () => {
  console.log(`Bosquet Lent server running on http://localhost:${PORT}`);
});
