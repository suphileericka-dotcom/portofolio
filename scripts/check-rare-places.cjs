const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

async function main(){
  const root=path.resolve(__dirname,'..');
  const server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':{'.js':'text/javascript','.css':'text/css','.html':'text/html','.mp3':'audio/mpeg'}[path.extname(file)]||'application/octet-stream'});res.end(error?'':data);});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true});
  try{
    for(const viewport of [{width:1280,height:800},{width:390,height:844},{width:844,height:390}]){
      const context=await browser.newContext({viewport,isMobile:viewport.width<900,hasTouch:viewport.width<900,serviceWorkers:'block'});
      const page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.route('https://**/*',route=>route.abort());
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await page.locator('#startButton')[viewport.width<900?'tap':'click']();
      await page.waitForTimeout(600);


      const result=await page.evaluate(()=>{
        running=false;state.cinematicPlayed=true;state.activeQuest=null;state.pendingQuestReward=null;
        state.activeSecretWorld=null;state.activeSecretPortal=null;state.visitedLandmarks=[];state.worldDiscoveries={};
        state.villageActivity=null;state.friendlyChallenge=null;
        const schedule=JSON.stringify([state.nextSecretAt,state.secretCycleIndex]);
        const results=[];
        for(let index=0;index<3;index++){
          const place=getRareLandmark(index);state.player.x=place.x;state.camera.x=place.x-window.innerWidth/2;
          const stable=JSON.stringify(place)===JSON.stringify(getRareLandmark(index));
          const drawn=getProceduralLandmarks().some(p=>p.id===place.id);draw();
          const target=getInteractionTarget([],[]),before=state.inventory[place.rewardId]||0;
          interact();const found=state.visitedLandmarks.includes(place.id) && state.inventory[place.rewardId]===before+1;
          interact();const once=state.inventory[place.rewardId]===before+1;
          results.push(stable&&drawn&&target?.kind==='landmark'&&found&&once);
        }
        buildJournal();const journal=rarePlaces.every(p=>ui.journalList.textContent.includes(p.name));
        saveGame();loadGame();const restored=state.visitedLandmarks.filter(id=>id.startsWith('rare-place-')).length===3;
        const sites=Array.from({length:12},(_,i)=>getRareLandmark(i));
        const accessible=sites.every(p=>!isRiverGap(p.x,220));
        state.activeSecretWorld={worldId:secretWorlds[0].id};
        const noPortalSites=getProceduralLandmarks().length===0;state.activeSecretWorld=null;
        const untouched=JSON.stringify([state.nextSecretAt,state.secretCycleIndex])===schedule;
        return {sites:results.every(Boolean),journal,restored,accessible,noPortalSites,untouched};
      });
      for(const [key,value]of Object.entries(result))assert.equal(value,true,key);
      assert.deepEqual(errors,[]);
      await page.evaluate(()=>{const p=getRareLandmark(0);state.player.x=p.x;state.camera.x=p.x-window.innerWidth/2;draw();});
      await page.screenshot({path:path.join(root,'.tools',`rare-tree-${viewport.width}.png`)});
      console.log(`${viewport.width}x${viewport.height}: three real sites, stable safe positions, observation, one reward, journal, save and unchanged portal passed`);
      await context.close();
    }
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
