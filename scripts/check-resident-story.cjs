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
        running=false;state.cinematicPlayed=true;state.player.x=world.firstRouteEnd+930;
        state.camera.x=world.firstRouteEnd+250;state.time=100;state.activeQuest=null;state.pendingQuestReward=null;
        state.villageActivity=null;state.friendlyChallenge=null;state.worldDiscoveries={};state.discoveries=[];
        state.helpedVillagers=[];state.villagerMemory={};state.inventory={};
        const village=getVillageByIndex(0),host=getResidentForVillage(village);
        const schedule=JSON.stringify([state.nextSecretAt,state.secretCycleIndex,state.activeSecretPortal]);
        const random=Math.random;Math.random=()=>1;openVillagerHelp(host);Math.random=random;
        const introduction=getVillagerMemory(host).storyStage===1 && ui.villagerText.textContent.includes('petit jardin');
        const item=Object.values(state.worldDiscoveries).find(i=>i.zoneKey==='resident-story-'+host.villageId);
        const generated=Boolean(item) && item.x>state.player.x && ui.villagerText.textContent.includes('droite');
        const amount=Object.values(state.worldDiscoveries).length;
        ensureResidentStoryDiscovery(host);const unique=Object.values(state.worldDiscoveries).length===amount;
        closeDialog(ui.villagerDialog);state.player.x=item.x;state.camera.x=item.x-window.innerWidth/2;
        state.hiddenDiscoveryPopups.push(baseDiscoveryId(item.id));interact();
        const collected=state.inventory[host.need.itemId]===1;
        state.player.x=host.homeX;Math.random=()=>1;openVillagerHelp(host);Math.random=random;givePendingItem();
        const helped=state.helpedVillagers.includes(host.villageId) && getVillagerMemory(host).storyStage===2 && state.inventory[host.need.itemId]===0;
        saveGame();loadGame();const savedHelp=getVillagerMemory(host).storyStage===2;
        Math.random=()=>1;openVillagerHelp(host);Math.random=random;
        const ending=getVillagerMemory(host).storyStage===3 && ui.villagerText.textContent.includes('Jardin des Retours');
        closeDialog(ui.villagerDialog);buildJournal();const souvenir=ui.journalList.textContent.includes('Souvenir retrouv');
        saveGame();loadGame();const restored=getVillagerMemory(host).storyStage===3;
        const optional=canOfferVillageActivity(host)===false || !state.villageActivity;
        const independent=JSON.stringify([state.nextSecretAt,state.secretCycleIndex,state.activeSecretPortal])===schedule;
        const before=state.inventory[host.need.itemId];pendingVillagerHelp=host;givePendingItem();
        const noRepeat=state.inventory[host.need.itemId]===before && getVillagerMemory(host).storyStage===3;
        const other=getResidentForVillage(getVillageByIndex(1));
        const untouched=!isFirstResidentStory(other) && getResidentStoryText(other,false)==='';
        return {introduction,generated,unique,collected,helped,savedHelp,ending,souvenir,restored,optional,independent,noRepeat,untouched};
      });
      for(const [key,value]of Object.entries(result))assert.equal(value,true,key);
      assert.deepEqual(errors,[]);
      console.log(`${viewport.width}x${viewport.height}: story dialogue, actual statue, pickup and donation, return conclusion, souvenir, saves, no duplicate and unchanged portal passed`);
      await context.close();
    }
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
