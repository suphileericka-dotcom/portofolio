const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('script.js', 'utf8');
const start = source.indexOf('function getFriendlyChallengeDirection(');
const end = source.indexOf('function startFriendlyChallenge', start);
const context = {
  state: { player: { lastTravelDirection: 1, face: -1 } },
  friendlyChallengeDistance: 6000,
  clampToPlayableWorldX: (x) => Math.max(110, x)
};
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);
assert.equal(context.getFriendlyChallengeDirection({ homeX: 20000 }), 1);
context.state.player.lastTravelDirection = -1;
assert.equal(context.getFriendlyChallengeDirection({ homeX: 20000 }), -1);
assert.equal(context.getFriendlyChallengeDirection({ homeX: 400 }), 1);
console.log('Race direction: right, left and world boundary passed.');
