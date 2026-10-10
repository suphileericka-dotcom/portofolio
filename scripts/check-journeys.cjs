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
        running=false;state.activeQuest=null;state.pendingQuestReward=null;state.activeSecretWorld=null;
        state.player.x=120;state.journey=null;state.time=100;state.nextSecretAt=1000;state.secretCycleIndex=1;
        createSecretPortal('natural');const portal=JSON.stringify(state.activeSecretPortal);
        const fingerprint=()=>JSON.stringify([state.nextSecretAt,state.secretCycleIndex,state.activeSecretPortal]);
        const schedule=fingerprint();const first=ensureJourneyProgress();
        const initial=first.voyage===1 && first.chapter===0;
        state.player.x=first.targetX;updateJourneyProgress();const arrived=state.journey.chapter===1;
        state.cinematicPlayed=true;state.camera.x=state.player.x-400;
        const host=getResidentForVillage(getVillageByIndex(0));
        openVillagerHelp(host);const talked=state.journey.chapter===2;
        pendingVillagerConversation=null;pendingVillagerHelp=null;closeDialog(ui.villagerDialog);
        state.activeQuest=null;state.pendingQuestReward=null;
        state.hiddenDiscoveryPopups.push('leaf');const before=state.inventory.leaf||0;
        for(let i=0;i<3;i++)collectDiscovery({...getMissionCatalogItem('leaf'),id:makeId('leaf',900+i),x:state.player.x});
        const collected=state.journey.chapter===3 && state.inventory.leaf===before+3;
        state.player.previousX=state.player.x;state.player.x+=state.journey.target;updateJourneyProgress();
        const walked=state.journey.chapter===4;
        state.player.x=state.journey.targetX;updateJourneyProgress();
        const endless=state.journey.voyage===2 && state.journey.chapter===0 && state.journey.targetX>state.player.x;
        const portalPreserved=schedule===fingerprint() && portal===JSON.stringify(state.activeSecretPortal);
        saveGame();const saved=JSON.stringify(state.journey);loadGame();
        const restored=JSON.stringify(state.journey)===saved && fingerprint()===schedule;
        updateJourneyResume();buildJournal();
        const menu=!document.getElementById('journeyResume') && ui.continueButton.textContent.includes('Voyage 2') && ui.continueButton.textContent.includes('chapitre 1');
        const journal=ui.journalList.textContent.includes('Voyage 2');
        initializeJourneyChapter(2,3);const progress=state.journey.progress;
        state.activeSecretWorld={returnX:state.player.x};state.player.x=secretWorldOffset+9000;updateJourneyProgress();
        const noTeleport=state.journey.progress===progress;state.activeSecretWorld=null;state.player.x=120;
        const invalid=normalizeJourneyProgress({voyage:0})===null;
        state.journey=null;const legacy=ensureJourneyProgress().voyage===1;
        return {initial,arrived,talked,collected,walked,endless,portalPreserved,restored,menu,journal,noTeleport,invalid,legacy};
      });
      for(const [key,value]of Object.entries(result))assert.equal(value,true,key);
      const cycle=await page.evaluate(()=>{
        state.activeSecretWorld=null;state.activeSecretPortal=null;state.secretCycleIndex=1;
        state.nextSecretAt=state.time+900;running=true;
        const delays=[];
        for(let i=0;i<6;i++){
          state.time=state.nextSecretAt;updateSecretPortal();
          enterSecretWorld(state.activeSecretPortal);
          state.time=state.activeSecretWorld.returnAt+1;updateSecretWorld();
          delays.push(state.nextSecretAt-state.time);
        }
        running=false;return delays;
      });
      assert.deepEqual(cycle,[420,1200,900,420,1200,900],'15/7/20 cycle continues across journeys');
      await page.evaluate(()=>{
        state.player.x=900;state.camera.x=0;state.journey=null;running=true;
        clearSecretWorldTransition();ui.startScreen.classList.add('is-hidden');
        updateMissionTracker();draw();
      });
      await page.waitForTimeout(600);
      const layout=await page.evaluate(()=>{
        const tracker=ui.missionTracker.getBoundingClientRect(),hud=document.querySelector('.hud').getBoundingClientRect();
        return tracker.top>=hud.bottom && tracker.left>=0 && tracker.right<=window.innerWidth;
      });
      assert(layout,'chapter objective fits beneath HUD');
      await page.screenshot({path:path.join(root,'.tools',`journey-${viewport.width}.png`)});
      await page.evaluate(()=>pauseGame());
      assert.equal(await page.locator('#journeyResume').count(),0);
      assert.deepEqual(errors,[]);
      console.log(`${viewport.width}x${viewport.height}: five chapters, endless next voyage, actual talk/pickups, save, menu, journal, no portal reset and no teleport progression passed`);
      await context.close();
    }
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
