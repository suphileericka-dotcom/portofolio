const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

async function main() {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
    fs.readFile(file, (err, data) => {
      res.writeHead(err ? 404 : 200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
      res.end(err ? '' : data);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ['--disable-gpu', '--no-sandbox'] });
    fs.mkdirSync(path.join(root, '.tools', 'bridges'), { recursive: true });
    for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
      const context = await browser.newContext({ viewport, isMobile: viewport.width < 900, hasTouch: viewport.width < 900, serviceWorkers: 'block' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('https://**/*', route => route.abort());
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await page.waitForFunction(() => typeof getWalkSurfaceY === 'function');
      const result = await page.evaluate(() => {
        running = false;
        ui.startScreen.classList.add('is-hidden');
        state.startedAtLeastOnce = true;
        state.companion = { ...state.companion, unlocked: true, present: true, x: 3450, pace: 0 };
        state.activeSecretWorld = null;
        state.player.x = 3550;
        state.player.vx = 0;
        state.player.rest = 0;
        const samples = [];
        for (const direction of [1, -1]) {
          keys.clear();
          keys.add(direction > 0 ? 'ArrowRight' : 'ArrowLeft');
          for (let i = 0; i < 240; i += 1) {
            update(1 / 60);
            samples.push({ x: state.player.x, y: state.player.y, surface: getWalkSurfaceY(state.player.x), companionY: state.companion.y, companionSurface: getWalkSurfaceY(state.companion.x) });
          }
        }
        keys.clear();
        const crossings = getRiverCrossings(0, 90000);
        const geometry = crossings.every(b => b.left < b.waterLeft && b.right > b.waterRight
          && getWalkSurfaceY(b.x) < world.ground && getWalkSurfaceY(b.left) === world.ground
          && Math.abs(getWalkSurfaceY(b.right) - world.ground) < 0.001);
        const bankFilter = [...getProceduralRests(), ...getProceduralLanterns()].every(item => !isRiverGap(item.x));
        state.player.x = 3820;
        state.player.vx = 0;
        state.player.y = getWalkSurfaceY(3820);
        state.companion.x = 3734;
        state.companion.y = getWalkSurfaceY(3734);
        state.camera.x = 3820 - innerWidth / 2;
        state.camera.zoom = 1;
        draw();
        const pixels = ctx.getImageData(Math.round(canvas.width / 2), Math.min(canvas.height - 1, Math.round((world.ground + 85) * (canvas.width / innerWidth))), 1, 1).data;
        return { samples, geometry, bankFilter, crossings: crossings.length, pixels: [...pixels] };
      });
      assert(result.geometry && result.bankFilter);
      assert(result.crossings > 5);
      assert(result.samples.every(s => Math.abs(s.y - s.surface) < 0.001 && Math.abs(s.companionY - s.companionSurface) < 0.001));
      assert(result.samples.some(s => s.x > 4030) && result.samples.at(-1).x < 3610, 'Both banks reached without teleportation');
      assert(result.samples.some(s => s.y < result.samples[0].y - 10), 'Player climbs the deck');
      assert.equal(result.pixels[3], 255);
      assert(result.pixels[1] > result.pixels[0] && result.pixels[2] > result.pixels[0], 'River pixels are blue-green, not an unbroken ground strip');
      assert.deepEqual(errors, []);
      if (viewport.width < 900) {
        await page.waitForFunction(() => getComputedStyle(ui.startScreen).visibility === 'hidden');
        const cdp = await context.newCDPSession(page);
        const box = await page.locator('#mobilePad').boundingBox();
        assert(box, 'Existing mobile joystick is visible');
        const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        for (const direction of [1, -1]) {
          await page.evaluate(direction => {
            state.player.x = direction > 0 ? 3550 : 4090;
            state.player.vx = 0;
          }, direction);
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [center] });
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: center.x + direction * box.width * 0.34, y: center.y }] });
          await page.waitForFunction(direction => joystick.active && joystick.x * direction > 0.9, direction);
          const crossed = await page.evaluate(direction => {
            const active = joystick.active && joystick.x * direction > 0.9;
            for (let i = 0; i < 240; i += 1) update(1 / 60);
            return active && (direction > 0 ? state.player.x > 4030 : state.player.x < 3610)
              && state.player.y === getWalkSurfaceY(state.player.x);
          }, direction);
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          assert(crossed, 'Touch joystick crosses the same bridge in both directions');
        }
        await page.evaluate(() => {
          state.player.x = 3820;
          state.player.y = world.ground + 80;
          state.player.vx = 0;
          update(1 / 60);
          if (state.player.y !== getWalkSurfaceY(state.player.x)) throw new Error('Water cannot support the player');
          state.companion.x = 3734;
          state.companion.y = getWalkSurfaceY(3734);
          state.camera.x = 3820 - innerWidth / 2;
          draw();
        });
      }
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(root, '.tools', 'bridges', `${viewport.width}x${viewport.height}.png`) });
      for (const x of [3590, 4050]) {
        await page.evaluate(x => {
          state.player.x = x;
          state.player.y = getWalkSurfaceY(x);
          state.companion.x = x - 86;
          state.companion.y = getWalkSurfaceY(x - 86);
          state.camera.x = x - innerWidth / 2;
          draw();
        }, x);
        await page.screenshot({ path: path.join(root, '.tools', 'bridges', `${viewport.width}x${viewport.height}-${x}.png`) });
      }
      console.log(`${viewport.width}x${viewport.height}: both directions, deck support, companion, banks, rendering passed`);
      await context.close();
    }
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
