const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

async function main(){
  const root=path.resolve(__dirname,'..');
  const server=http.createServer((req,res)=>{
    const pathname=req.url.split('?')[0];
    const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    fs.readFile(file,(error,data)=>{
      res.writeHead(error?404:200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.css':'text/css'}[path.extname(file)]||'application/octet-stream'});
      res.end(error?'':data);
    });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true});
  try{
    for(const viewport of [{width:1280,height:800},{width:390,height:844},{width:844,height:390}]){
      const context=await browser.newContext({viewport,hasTouch:viewport.width<900,reducedMotion:'reduce',serviceWorkers:'block'});
      const page=await context.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.route('https://**/*',route=>route.abort());
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await page.locator('#startButton').click();
      await page.waitForTimeout(600);
      await page.evaluate(()=>{running=false;exploration?.finishScene();clearSecretWorldTransition();});
      const previews=new Set();
      for(const [outfit,accessory] of [['sailor','beanie'],['gardener','glasses']]){
        await page.locator('#customizeButton').click();
        await page.locator(`[data-category="outfit"][data-value="${outfit}"]`).click();
        await page.locator(`[data-category="accessory"][data-value="${accessory}"]`).click();
        previews.add(await page.locator('#appearancePreview').evaluate(canvas=>canvas.toDataURL()));
        fs.mkdirSync(path.join(root,'.tools','appearance'),{recursive:true});
        await page.locator('#appearancePreview').screenshot({path:path.join(root,'.tools','appearance',`${outfit}-${accessory}-${viewport.width}.png`)});
        await page.locator('#applyAppearanceButton').click();
        const result=await page.evaluate(({outfit,accessory})=>{
          const selected=state.playerProfile.appearance;
          const saved=JSON.parse(localStorage.getItem(playerKey)).appearance;
          const valid=selected.outfit===outfit && selected.accessory===accessory && saved.outfit===outfit && saved.accessory===accessory;
          const appearance=getPlayerAppearance();
          const frames=[];
          for(const pose of [{face:1,velocity:0},{face:-1,velocity:100},{face:1,seated:true}]){
            ctx.clearRect(0,0,canvas.width,canvas.height);
            drawCharacter({x:100,y:160,...appearance,...pose});
            frames.push(ctx.getImageData(0,0,canvas.width,canvas.height).data.some((v,i)=>i%4===3&&v>0));
          }
          loadPlayerProfile();
          return valid && frames.every(Boolean) && state.playerProfile.appearance.outfit===outfit && state.playerProfile.appearance.accessory===accessory;
        },{outfit,accessory});
        assert(result,'Choices persist and render in standing, walking and sitting poses');
      }
      assert.equal(previews.size,2,'Distinct appearance previews');
      await page.locator('#customizeButton').click();
      await page.locator('[data-category="accessory"][data-value="beanie"]').click();
      await page.locator('#cancelAppearanceButton').click();
      assert.equal(await page.evaluate(()=>state.playerProfile.appearance.accessory),'glasses','Cancel preserves saved appearance');
      assert.deepEqual(errors,[]);
      console.log(`${viewport.width}x${viewport.height}: new outfits/accessories, preview, apply, cancel, persistence and poses passed`);
      await context.close();
    }
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
