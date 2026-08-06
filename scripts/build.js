const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "dist");
const files = [
  "index.html",
  "styles.css",
  "script.js",
  "manifest.webmanifest",
  "sw.js",
  "icon.svg",
  "cover-bosquet-lent-game-style.png",
  "jean-paul-v-aventures-chinoises-289659.mp3",
];

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const file of files) {
  fs.copyFileSync(path.join(root, file), path.join(outDir, file));
}
