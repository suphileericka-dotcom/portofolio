const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');

(async () => {
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + (req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
      res.writeHead(error ? 404 : 200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.mp3': 'audio/mpeg' }[path.extname(file)] || 'application/octet-stream' });
      res.end(error ? '' : data);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [{ width: 844, height: 390 }, { width: 667, height: 375 }, { width: 390, height: 844 }, { width: 1280, height: 800 }]) {
      const context = await browser.newContext({ viewport, hasTouch: true, isMobile: viewport.width < 1000, serviceWorkers: 'block' });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('https://**/*', route => route.abort());
      await page.addInitScript(() => {
        if (!localStorage.getItem('bosquet-lent-save')) localStorage.setItem('bosquet-lent-save', JSON.stringify({ x: 380, inventory: { leaf: 2 }, time: 0 }));
      });
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      const original = await page.evaluate(() => localStorage.getItem('bosquet-lent-save'));
      await page.locator('#startButton').click();
      await page.locator('#trialSkip').waitFor({ state: 'visible' });
      await page.locator('#trialSkip').click();
      await page.waitForTimeout(500);
      await page.evaluate(() => { running = false; });
      const result = await page.evaluate(() => {
        const p = state.player;
        const reset = () => { p.x = 380; p.depth = 0; p.vx = 0; p.depthVelocity = 0; keys.clear(); };
        reset(); keys.add('ArrowUp');
        for (let i = 0; i < 20; i++) update(1 / 60);
        const up = p.depth === 0 && Math.abs(p.x - 380) < 0.01;
        reset(); keys.add('ArrowDown');
        for (let i = 0; i < 20; i++) update(1 / 60);
        const down = p.depth === 0 && Math.abs(p.x - 380) < 0.01;
        reset(); keys.add('ArrowRight'); keys.add('ArrowUp');
        const v = exploration.getInput();
        const diagonal = v.y === 0 && v.x > 0;
        for (let i = 0; i < 12; i++) update(1 / 60);
        const bothAxes = p.x > 390 && p.depth === 0;
        keys.clear(); for (let i = 0; i < 160; i++) update(1 / 60);
        const stopped = Math.hypot(p.vx, p.depthVelocity) < 0.1;
        reset(); p.x = 960; p.depth = -18; keys.add('ArrowRight');
        for (let i = 0; i < 50; i++) { const i2 = exploration.getInput(); const old = p.x; p.x += 3; exploration.moveDepth(1 / 60, i2, old, 180); }
        const collision = p.depth === 0;
        keys.clear(); p.depth = 28; keys.add('ArrowRight');
        for (let i = 0; i < 50; i++) { const i2 = exploration.getInput(); const old = p.x; p.x += 3; exploration.moveDepth(1 / 60, i2, old, 180); }
        const around = p.x >= 960;
        reset(); p.x = 3820; p.depth = 40;
        exploration.moveDepth(1 / 60, { x: 0, y: 1 }, p.x, 180);
        const bridge = p.depth === 0 && getWalkSurfaceY(p.x) < world.ground;
        reset(); p.depth = 46; saveGame(); p.depth = 0; loadGame();
        const savedDepth = p.depth === 46;
        reset(); state.camera.x = Math.max(0, p.x - innerWidth * .45); state.time = 100;
        running = true; draw();
        return { up, down, diagonal, bothAxes, stopped, collision, around, bridge, savedDepth };
      });
      for (const [name, value] of Object.entries(result)) assert.equal(value, true, `${viewport.width}: ${name}`);
      // Actual browser pointer capture: small tilt, full tilt and release.
      const origin = { x: 100, y: viewport.height - 90 };
      await page.mouse.move(origin.x, origin.y); await page.mouse.down();
      await page.mouse.move(origin.x + 18, origin.y - 4);
      const slow = await page.evaluate(() => exploration.getInput());
      await page.mouse.move(origin.x + 46, origin.y - 4);
      const fast = await page.evaluate(() => exploration.getInput());
      await page.screenshot({ path: path.join(root, '.tools', `exploration-${viewport.width}.png`) });
      assert(fast.magnitude > slow.magnitude && fast.run > slow.run, `analog walk/run: ${JSON.stringify({slow,fast})}`);
      await page.screenshot({ path: path.join(root, '.tools', `exploration-${viewport.width}.png`) });
      await page.mouse.up();
      assert.equal(await page.evaluate(() => exploration.getInput().magnitude), 0, 'release');
      await page.mouse.move(origin.x, origin.y); await page.mouse.down();
      await page.mouse.move(origin.x + 30, origin.y);
      await page.evaluate(() => window.dispatchEvent(new Event('blur')));
      assert.equal(await page.evaluate(() => exploration.getInput().magnitude), 0, 'blur clears movement');
      await page.mouse.up();
      assert.notEqual(await page.evaluate(() => localStorage.getItem('bosquet-lent-save')), null, 'main save is used directly');
      await page.evaluate(() => { state.player.depth = 0; state.player.x = 380; saveGame(); });
      await page.reload();
      await page.locator('#continueButton').click();
      await page.waitForTimeout(150);
      assert.equal(await page.locator('#trialSkip').isVisible(), false, 'continue skips introduction');
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('bosquet-lent-learning-v1')).move), true, 'gesture remembered');
      assert.deepEqual(errors, []);
      console.log(`${viewport.width}x${viewport.height}: movement, collisions, bridge, analog pointer, save isolation and onboarding passed`);
      await context.close();
    }
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
