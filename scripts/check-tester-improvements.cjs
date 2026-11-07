const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "script.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");

function evaluateBlock(start, end, exportName) {
  const sandbox = {};
  vm.createContext(sandbox);
  const block = source.slice(source.indexOf(start), source.indexOf(end));
  vm.runInContext(`${block};globalThis.result = ${exportName};`, sandbox);
  return sandbox.result;
}

const regions = evaluateBlock("const biomes = [", "const weatherTypes = [", "biomes");
assert.deepEqual(Array.from(regions, (region) => region.id), [
  "mystery-forest",
  "firefly-village",
  "mist-valley",
  "star-garden"
]);
assert.equal(new Set(Array.from(regions, (region) => region.decor)).size, 4);
assert.ok(regions.every((region) => region.name && region.subtitle && region.path && region.ground));

const challenges = evaluateBlock(
  "const friendlyChallengeDefinitions = [",
  "const hopDurationSeconds",
  "friendlyChallengeDefinitions"
);
assert.deepEqual(Array.from(challenges, (challenge) => challenge.kind), ["race", "collection", "exploration", "search"]);
assert.ok(challenges.every((challenge) => challenge.objective && challenge.duration > 0 && challenge.target > 0));

for (const persistedField of ["discoveredRegions", "arrivedVillages", "friendlyChallengeHistory", "plantedItems"]) {
  const occurrences = source.match(new RegExp(persistedField, "g")) || [];
  assert.ok(occurrences.length >= 5, `${persistedField} must be initialized, reset, saved and loaded`);
}

for (const action of ["portal", "companion", "scout", "stride", "glow", "compass", "lantern", "gift", "plant", "keep"]) {
  assert.match(source, new RegExp(`itemAction === "${action}"`), `Missing item action handler: ${action}`);
}

assert.match(source, /Math\.max\(0, \(state\.inventory\[baseId\] \|\| 0\)/, "Available quantities must never become negative");
assert.doesNotMatch(source, /proceduralWorldVersion|generatedZones/, "Walking must not regenerate the scenery");
assert.match(source, /scoutActivatedByPlayer = true/, "Object scouting must require an explicit player action");
assert.match(source, /scoutActivatedByPlayer && state\.itemEffects\.scoutTargetId === item\.id/, "The object circle must require manual scouting");
assert.match(source, /state\.itemEffects\.scoutActivatedByPlayer = false;[\s\S]{0,1800}state\.discoveries\.push/, "Collecting the target must clear the scouting circle");
assert.doesNotMatch(html, /appuie sur|au clavier/i, "The guide must not contain key-by-key instructions");
assert.match(html, /id="regionBanner"/);
assert.match(css, /\.region-banner\.is-visible/);
assert.match(css, /@media \(pointer: coarse\) and \(orientation: landscape\)/);

console.log("Tester improvements: regions, inventory actions, challenges and save compatibility are wired.");
