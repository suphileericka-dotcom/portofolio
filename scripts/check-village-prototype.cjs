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
        const villages=Array.from({length:12},(_,i)=>getVillageByIndex(i));
        const variants=villages.map(getVillagePrototypeLayout);
        const varied=variants.every(l=>new Set(l.houses.map(h=>h.type)).size===4 && l.houses.every(h=>h.setback>=30))
          && new Set(variants.map(l=>l.houses.map(h=>`${h.type}:${h.width}:${h.height}`).join('|'))).size>=4;
        const anchors=variants.every((l,i)=>{
          const v=villages[i],shelter=getVillageShelter(v);
          const workshop=l.houses.find(h=>h.type==='workshop');
          return shelter.x===l.houses[0].x && l.houses[0].type!=='raised'
            && getVillageActivitySpots(v).find(s=>s.id==='workshop')?.x===workshop.x-44
            && getVillageActivitySpots(v).some(s=>s.id===`landmark-${v.identity.id}` && s.x===l.landmarkX)
            && getResidentForVillage(v).homeX===v.x+410;
        });
        const identityCount=new Set(villages.map(v=>v.identity.id)).size;
        const nameCount=new Set(villages.map(v=>v.name)).size;
        const spacingStable=villages.slice(1).every((v,i)=>v.x-villages[i].x===villageSpacing) && villageSpacing===5000;
        const legacyStable=Array.from({length:5},(_,i)=>getVillageByIndex(i*3)).every((v,i)=>
          v.x===world.firstRouteEnd+520+i*legacyVillageSpacing
          && v.villager.role===villagers[i%villagers.length].role
          && getVillageShelter(v).id===`village-shelter-${i}`);
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
        return {varied,anchors,identityCount,nameCount,spacingStable,legacyStable,signGap,sameLayout,sameResident,clearLane,crossed,companionFollowed,day,night,identity,types:layout.houses.map(h=>h.type)};
      });
      assert(result.varied && result.anchors && result.sameLayout && result.sameResident && result.clearLane,JSON.stringify(result));
      assert.equal(result.identityCount,12,'The first twelve villages have distinct identities');
      assert.equal(result.nameCount,12,'The first twelve villages have distinct names');
      assert(result.spacingStable && result.legacyStable,'New villages are closer while legacy village coordinates and residents stay stable');
      assert(result.signGap>100,'Entrance is separated from first house');
      assert(result.crossed && result.companionFollowed,`Player and companion have a continuous path: ${JSON.stringify(result)}`);
      assert(result.night<result.day,'Existing night phase darkens the same village');
      assert.deepEqual(result.types,['forest','garden','workshop','raised']);
      const persistence=await page.evaluate(()=>{
        const village=getVillageByIndex(10), layout=JSON.stringify(getVillagePrototypeLayout(village));
        state.player.x=village.x+410;state.camera.x=village.x;updateVillageArrival();
        const id=getVillageIdFromX(village.x), banner=ui.regionBannerTitle.textContent;
        saveGame();state.arrivedVillages=[];loadGame();
        const restored=state.arrivedVillages.includes(id) && JSON.stringify(getVillagePrototypeLayout(getVillageByIndex(10)))===layout;
        const colors=biomeColors();state.time=100;state.camera.x=1700;
        const snapshot=()=>{
          ctx.clearRect(0,0,canvas.width,canvas.height);
          drawParallaxTrees(colors);drawRegionGroundDecor();
          return canvas.toDataURL();
        };
        state.player.x=1799;const before=snapshot();state.player.x=1801;
        const stableScenery=before===snapshot();
        state.player.x=860;state.camera.x=500;state.inventory.leaf=3;
        state.itemEffects.scoutActivatedByPlayer=false;state.itemEffects.scoutUntil=0;
        state.worldDiscoveries={};state.discoveryRespawns={};state.discoveryVacancies={};
        ensureVisibleDiscoveryZones();
        const first=Object.values(state.worldDiscoveries).find(i=>i.zoneKey==='start');
        if(first){state.player.x=first.x-100;state.camera.x=first.x-150;}
        const items=getVisibleWorldDiscoveries().filter(i=>!i.collected&&!i.missionItem&&!i.grounded);
        if(!items.length)throw Error('Returning to the first route must restore its objects');
        state.hiddenDiscoveryPopups=itemCatalog.map(i=>i.id);
        collectDiscovery({...getCatalogItem('cone'),id:'cone-999',x:860});
        const noAutoScout=state.itemEffects.scoutActivatedByPlayer===false;
        const quantity=state.inventory.leaf;
        useScoutItem('leaf');
        const manual=state.itemEffects.scoutActivatedByPlayer && state.inventory.leaf===quantity-1;
        const targetId=state.itemEffects.scoutTargetId;
        saveGame();loadGame();
        const scoutRestored=state.itemEffects.scoutActivatedByPlayer && state.itemEffects.scoutTargetId===targetId;
        const routeProgressPreserved=state.cinematicPlayed;
        const target=getVisibleWorldDiscoveries().find(i=>i.id===targetId);
        collectDiscovery(target);
        const cleared=!state.itemEffects.scoutActivatedByPlayer && !state.itemEffects.scoutTargetId;
        state.activeQuest=null;state.pendingQuestReward=null;state.friendlyChallenge=null;state.villageActivity=null;
        state.completedQuests=2;state.nextLetterAt=state.time+10;state.pendingLetter=null;
        const waitsForLetter=getProceduralLetters().length===0;
        state.time+=11;const letter=getProceduralLetters()[0];
        const nearbyLetter=letter && letter.x>state.player.x && letter.x-state.player.x<1800;
        saveGame();state.pendingLetter=null;loadGame();
        const letterRestored=getProceduralLetters()[0]?.x===letter.x;
        state.activeQuest=makeQuest(1240);
        const noDuplicateLetter=getProceduralLetters().length===0;
        state.activeQuest=null;
        return {restored,banner:banner===village.name,stableScenery,noAutoScout,manual,scoutRestored,routeProgressPreserved,cleared,waitsForLetter,nearbyLetter,letterRestored,noDuplicateLetter};
      });
      assert(Object.values(persistence).every(Boolean),JSON.stringify(persistence));
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
      for(const index of [1,2,3]) {
        await page.evaluate(index=>{const v=getVillageByIndex(index);state.camera.x=v.x-300;state.player.x=v.x+410;state.chapter=getChapter();state.time=100;updateVillageArrival();draw();},index);
        await page.waitForTimeout(50);
        await page.screenshot({path:path.join(out,`village-${index+1}-${viewport.width}.png`)});
      }
      console.log(`${viewport.width}x${viewport.height}: 12 village identities, closer spacing, legacy anchors, activities, open lane and day/night passed`);
      await context.close();
    }
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
