const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(source.slice(source.indexOf('const discoveries = ['), source.indexOf('const lanterns = ['))
  + source.slice(source.indexOf('const objectVisuals ='), source.indexOf('const objectVisualPathCache'))
  + ';globalThis.catalog = itemCatalog; globalThis.visuals = objectVisuals;', sandbox);
const catalog = [...sandbox.catalog, {id:'wild-flower',label:'Fleur sauvage'}];
assert.equal(catalog.length, 121);
assert.equal(Object.keys(sandbox.visuals).length, catalog.length);
const geometry = new Set();
for (const item of catalog) {
  const visual = sandbox.visuals[item.id];
  assert(visual, `Missing identity for ${item.id}`);
  const signature = visual.shapes.map(shape => shape.d).join('|');
  assert(!geometry.has(signature), `Geometry reused for ${item.id}`);
  geometry.add(signature);
}

async function main() {
  const server = http.createServer((req,res) => {
    const file = path.resolve(root, '.' + (req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) {res.writeHead(403).end();return;}
    fs.readFile(file, (error,data) => {
      const mime = {'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.mp3':'audio/mpeg'};
      res.writeHead(error ? 404 : 200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream'});
      res.end(error ? '' : data);
    });
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const browser = await chromium.launch({headless:true});
  fs.mkdirSync(path.join(root,'.tools','objects'),{recursive:true});
  try {
    for (const viewport of [{width:1280,height:800},{width:390,height:844},{width:844,height:390}]) {
      const context = await browser.newContext({viewport,isMobile:viewport.width<900,hasTouch:viewport.width<900,serviceWorkers:'block'});
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror',error => errors.push(error.message));
      await page.route('https://**/*',route => route.abort());
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await page.locator('#startButton').click();
      await page.waitForTimeout(600);
      const result = await page.evaluate(async () => {
        const items = [...itemCatalog, getMissionCatalogItem('flower')];
        const comparisons = [];
        for (const item of items) {
          const canvasA = document.createElement('canvas');
          canvasA.width = canvasA.height = 128;
          const a = canvasA.getContext('2d');
          a.translate(64,64);a.scale(2,2);
          renderObjectVisual(item,a);
          const svg = renderObjectVisual(item).replace('<svg ', '<svg width="128" height="128" ');
          const image = new Image();
          const url = URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
          image.src = url;
          await image.decode();
          const canvasB = document.createElement('canvas');
          canvasB.width = canvasB.height = 128;
          const b = canvasB.getContext('2d');b.drawImage(image,0,0);
          URL.revokeObjectURL(url);
          const pixelsA = a.getImageData(0,0,128,128).data;
          const pixelsB = b.getImageData(0,0,128,128).data;
          let painted = 0, difference = 0;
          for(let i=0;i<pixelsA.length;i+=4) {
            if(pixelsA[i+3]>0)painted++;
            for(let j=0;j<4;j++)difference+=Math.abs(pixelsA[i+j]-pixelsB[i+j]);
          }
          comparisons.push({id:item.id,painted,difference:difference/pixelsA.length});
          if(!getItemIcon(item).includes(`data-object-visual="${item.id}"`)) throw Error('UI identity mismatch: '+item.id);
          if(getObjectVisual({...item,id:makeId(item.id,701)}) !== getObjectVisual(item)) throw Error('Spawn identity mismatch: '+item.id);
          drawCollectibleIcon(item,0,state.player.x,world.ground-20);
        }
        const originalInventory = {...state.inventory};
        state.inventory = Object.fromEntries(itemCatalog.map(item=>[item.id,1]));
        state.discoveries = itemCatalog.map(item=>item.id);
        buildJournal();
        const journalCount = ui.journalList.querySelectorAll('[data-object-visual]').length;
        const collected = {...itemCatalog.find(item=>item.id==='item-9'),id:makeId('item-9',990),x:state.player.x};
        if(!collectDiscovery(collected)) throw Error('Collection failed');
        const collectedId = ui.discoveryBody.querySelector('[data-object-visual]')?.dataset.objectVisual;
        const animatedId = discoveryBursts.find(particle=>particle.objectId==='item-9')?.objectId;
        if(animatedId!=='item-9')throw Error('Collection animation loses identity');
        drawDiscoveryBursts();
        closeDialog(ui.discoveryDialog);
        openQuestCompletePopup({questTitle:'Visual check',rewardItems:[getCatalogItem('item-9'),getCatalogItem('item-63')]});
        const rewardIds = [...ui.questCompleteBody.querySelectorAll('[data-object-visual]')].map(el=>el.dataset.objectVisual);
        closeDialog(ui.questCompleteDialog);
        if(rewardIds.join(',')!=='item-9,item-63')throw Error('Reward identity mismatch');
        state.activeQuest={type:'collectAny',itemId:'item-9',progress:0,target:1,title:'Visual check',objective:'Collect'};
        if(!renderQuestCard().includes('data-object-visual="item-9"'))throw Error('Mission identity mismatch');
        state.activeQuest=null;
        state.inventory = originalInventory;
        const x=state.player.x;
        keys.add('ArrowRight');for(let i=0;i<60;i++)update(1/60);keys.clear();
        const moved = state.player.x>x;
        saveGame();
        draw();
        return {comparisons,journalCount,collectedId,animatedId,rewardIds,moved,save:!!localStorage.getItem(saveKey)};
      });
      for (const sample of result.comparisons) {
        assert(sample.painted>80, `Blank object: ${sample.id}`);
        assert(sample.difference<2, `SVG/Canvas divergence: ${sample.id} (${sample.difference})`);
      }
      assert(result.journalCount>=120,'Discovered catalogue appears in journal');
      assert.equal(result.collectedId,'item-9');
      assert.equal(result.animatedId,'item-9');
      assert.deepEqual(result.rewardIds,['item-9','item-63']);
      assert(result.moved && result.save);
      assert.deepEqual(errors,[]);
      await page.screenshot({path:path.join(root,'.tools','objects',`world-${viewport.width}.png`)});
      console.log(`${viewport.width}x${viewport.height}: 121 valid drawings, SVG/Canvas pixels match, world, collection animation, journal, mission, rewards, movement and saving passed`);
      if(viewport.width===1280) {
        await page.evaluate(() => {
          running=false;
          document.body.innerHTML=`<main class="visual-review"><h1>Catalogue des objets — silhouettes par ID</h1><p>Chaque dessin existe dans le monde et dans le Carnet. Les versions grises permettent de comparer les formes sans la couleur.</p><div class="visual-grid">${[...itemCatalog,getMissionCatalogItem('flower')].map(item=>`<article><div class="pair">${renderObjectVisual(item)}<span class="grayscale">${renderObjectVisual(item)}</span></div><strong>${item.label}</strong><small>${item.id}</small></article>`).join('')}</div></main>`;
          const style=document.createElement('style');
          style.textContent='html,body{height:auto;overflow:auto;background:#203831;color:#eee2bd}.visual-review{padding:24px;font-family:Arial,sans-serif}.visual-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}article{background:#30463c;padding:12px;border:1px solid #66775d;border-radius:8px;text-align:center;min-height:130px}.pair{display:flex;justify-content:center;gap:12px}.pair>.object-visual,.pair>span{width:64px;height:64px}.grayscale{filter:grayscale(1)}strong,small{display:block;margin-top:8px}small{opacity:.6;font-size:12px}h1{font-size:25px}';
          document.head.append(style);
        });
        await page.screenshot({path:path.join(root,'.tools','objects','catalogue.png'),fullPage:true});
      }
      await context.close();
    }
  } finally {
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
