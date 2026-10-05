const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

async function main() {
  const root=path.resolve(__dirname,'..');
  const out=path.join(root,'.tools','village');
  fs.mkdirSync(out,{recursive:true});
  const server=http.createServer((req,res)=>{
    const name=req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0];
    const file=path.resolve(root,'.'+name);
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    fs.readFile(file,(error,data)=>{
      res.writeHead(error?404:200,{'Content-Type':{'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.mp3':'audio/mpeg'}[path.extname(file)]||'application/octet-stream'});
      res.end(error?'':data);
    });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true});
  try {
    for(const viewport of [{width:1280,height:600},{width:390,height:844},{width:844,height:390}]) {
      const context=await browser.newContext({viewport,isMobile:viewport.width<900,hasTouch:viewport.width<900,serviceWorkers:'block'});
      const page=await context.newPage();const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.route('https://**/*',route=>route.abort());
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      const result=await page.evaluate(()=>{
        running=false;ui.startScreen.classList.add('is-hidden');state.startedAtLeastOnce=true;
        const x=world.firstRouteEnd+520;
        state.player.x=x+45;state.chapter=getChapter(state.player.x);state.camera.x=x-350;state.camera.zoom=1;
        state.player.y=getWalkSurfaceY(state.player.x);state.cinematicPlayed=true;
        const village=getProceduralVillages().find(v=>v.chapterIndex===0);
        const layout=getVillagePrototypeLayout(village);
        const resident=getResidentForVillage(village);
        const identity={name:village.name,role:resident.role,homeX:resident.homeX,villageId:resident.villageId};
        const signGap=layout.houses[0].x-layout.houses[0].width/2-(layout.signX+60);
        const onlyFirst=getProceduralVillages().filter(v=>getVillagePrototypeLayout(v)).length===1
          && getVillagePrototypeLayout({...village,chapterIndex:1})===null;
        const layoutBefore=JSON.stringify(layout);
        state.time=100;draw();
        const day=[...ctx.getImageData(0,0,canvas.width,canvas.height).data].filter((_,i)=>i%4!==3).reduce((a,b)=>a+b,0);
        state.time=220;draw();
        const night=[...ctx.getImageData(0,0,canvas.width,canvas.height).data].filter((_,i)=>i%4!==3).reduce((a,b)=>a+b,0);
        const sameLayout=JSON.stringify(getVillagePrototypeLayout(village))===layoutBefore;
        const updatedResident=getResidentForVillage(village);
        const sameResident=JSON.stringify({name:village.name,role:updatedResident.role,homeX:updatedResident.homeX,villageId:updatedResident.villageId})===JSON.stringify(identity);
        // Architecture ends at least 20px behind the walking surface; nothing blocks the lane.
        const clearLane=layout.houses.every(h=>h.setback>=30);
        state.time=100;state.player.x=x-350;state.player.vx=0;
        state.companion={...state.companion,unlocked:true,present:true,species:companionSpecies[0].species,x:state.player.x-80};
        const walked=[];
        keys.clear();keys.add('ArrowRight');
        for(let i=0;i<640;i++){update(1/60);walked.push(state.player.x);}
        keys.clear();
        const crossed=state.player.x>x+800;
        for(let i=0;i<300;i++)update(1/60);
        const companionFollowed=Math.abs(state.companion.x-state.player.x)<200;
        state.player.x=x+45;state.player.vx=0;state.player.y=getWalkSurfaceY(state.player.x);
        state.companion.x=x-32;state.companion.y=getWalkSurfaceY(state.companion.x);
        state.camera.x=x-350;state.time=100;draw();
        ui.message.classList.remove('is-visible');
        return {onlyFirst,signGap,sameLayout,sameResident,clearLane,crossed,companionFollowed,day,night,identity,types:layout.houses.map(h=>h.type)};
      });
      assert(result.onlyFirst && result.sameLayout && result.sameResident && result.clearLane);
      assert(result.signGap>100,'Entrance is separated from first house');
      assert(result.crossed && result.companionFollowed,`Player and companion have a continuous path: ${JSON.stringify(result)}`);
      assert(result.night<result.day,'Existing night phase darkens the same village');
      assert.deepEqual(result.types,['forest','garden','workshop','raised']);
      await page.waitForTimeout(600);
      for(const [phase,time] of [['day',100],['night',220]]) {
        await page.evaluate(time=>{state.time=time;state.camera.x=world.firstRouteEnd+520-350;draw();},time);
        await page.screenshot({path:path.join(out,`${phase}-${viewport.width}.png`)});
      }
      // On phones inspect both the entrance and meeting place without changing zoom.
      if(viewport.width<900) {
        await page.evaluate(()=>{state.time=100;state.camera.x=world.firstRouteEnd+520+180;draw();});
        await page.screenshot({path:path.join(out,`center-${viewport.width}.png`)});
        await page.evaluate(()=>{state.camera.x=world.firstRouteEnd+520+470;draw();});
        await page.screenshot({path:path.join(out,`workshop-${viewport.width}.png`)});
      }
      assert.deepEqual(errors,[]);
      console.log(`${viewport.width}x${viewport.height}: only Village 1, four silhouettes, spaced entrance, same resident/day-night layout, open player/companion path, rendering passed`);
      await context.close();
    }
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
