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
      const context=await browser.newContext({viewport,isMobile:viewport.width<900,hasTouch:viewport.width<900,
        ...(viewport.width<900?{userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'}:{}),
        serviceWorkers:'block',reducedMotion:'reduce'});
      const page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.route('https://**/*',route=>route.abort());
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await page.locator('#startButton')[viewport.width<900?'tap':'click']();
      await page.waitForTimeout(600);
      await page.evaluate(()=>exploration?.finishScene());
      const migration=await page.evaluate(()=>{
        running=false;
        const host=getResidentForVillage(getVillageByIndex(0));
        const inventory=JSON.stringify(state.inventory);
        state.friendlyChallenge={kind:'exploration',villageId:host.villageId,villager:host,
          targetX:host.x+4200,remaining:95,readyAt:state.time+3};
        saveGame();loadGame();
        const removed=state.friendlyChallenge===null && JSON.stringify(state.inventory)===inventory;
        state.friendlyChallengeHistory=[];
        const racer=Array.from({length:12},(_,i)=>getResidentForVillage(getVillageByIndex(i)))
          .find(v=>getFriendlyChallengeDefinition(v).kind==='race');
        state.player.x=racer.homeX;state.chapter=4;state.cinematicPlayed=true;
        pendingVillagerHelp=racer;state.pendingQuestReward=null;state.activeQuest=null;
        startFriendlyChallenge();
        const race=state.friendlyChallenge;
        const original=race?.kind==='race' && race.remaining===52 && race.targetX-race.startX===6000
          && race.readyAt===state.time+3 && race.runner && race.route.length>0;
        saveGame();loadGame();
        const restored=state.friendlyChallenge?.kind==='race' && state.friendlyChallenge.remaining===52;
        state.friendlyChallenge=null;pendingVillagerHelp=null;
        return {removed,original:Boolean(original),restored};
      });
      for(const [key,value]of Object.entries(migration))assert.equal(value,true,`challenge removal: ${key}`);
      const result=await page.evaluate(()=>{
        running=false;
        const villageX=world.firstRouteEnd+520;
        state.player.x=villageX+410;state.camera.x=villageX-200;state.chapter=4;state.time=100;state.cinematicPlayed=true;
        state.activeQuest=null;state.pendingQuestReward=null;state.friendlyChallenge=null;
        const village=getProceduralVillages().find(v=>v.chapterIndex===0),host=getResidentForVillage(village);
        const realRandom=Math.random;Math.random=()=>0;
        state.nextVillageActivityAt=0;
        openVillagerHelp(host);
        Math.random=realRandom;
        const actualOffer=pendingVillagerConversation?.conversation;
        if(!actualOffer?.activityOffer)throw Error('No real offer in resident dialogue');
        handleVillagerChoice(0);
        const preparing=state.villageActivity?.stage==='preparing';
        state.time+=1.5;updateVillageActivity(1.5);
        const moving=getResidentForVillage(village);
        const walked=moving.x!==host.homeX && moving.x!==state.villageActivity.spot.x && !moving.concealed;
        state.time+=1.5;updateVillageActivity(1.5);
        const hidden=getResidentForVillage(village);
        const relocated=hidden.concealed && hidden.x!==hidden.homeX;
        state.player.x=hidden.x+100;findHiddenResident(hidden);
        const notAuto=state.villageActivity?.stage==='searching';
        state.player.x=hidden.x;
        const target=getInteractionTarget([],getVisibleVillageResidents());
        interact();
        const returning=state.villageActivity?.stage==='returning';
        for(let i=0;i<900;i++){state.time+=1/60;updateVillageActivity(1/60);}
        const home=!state.villageActivity && getResidentForVillage(village).x===host.homeX;
        const cooldown=!canOfferVillageActivity(host);
        state.nextVillageActivityAt=0;state.villageActivityCooldowns={};
        Math.random=()=>0;const first=createVillageActivityOffer(host);Math.random=realRandom;
        const anotherSpot=first.activityOffer.spot.id!==actualOffer.activityOffer.spot.id;
        handleVillageActivityChoice(host,first,first.choices[0]);
        state.time+=3;updateVillageActivity(.1);saveGame();
        loadGame();
        const reloadSafe=!state.villageActivity && getResidentForVillage(village).x===host.homeX;
        state.nextVillageActivityAt=0;state.villageActivityCooldowns={};
        Math.random=()=>0;const second=createVillageActivityOffer(host);Math.random=realRandom;
        handleVillageActivityChoice(host,second,second.choices[0]);
        pauseGame();const paused=state.villageActivity?.stage==='preparing';
        ui.startScreen.classList.add('is-hidden');
        state.player.x=villageX+1500;updateVillageActivity(.1);const departureSafe=!state.villageActivity;
        state.player.x=host.homeX;state.nextVillageActivityAt=0;state.villageActivityCooldowns={};state.activeQuest={type:'collectAny'};
        const questPriority=!canOfferVillageActivity(host);state.activeQuest=null;
        state.friendlyChallenge={villageId:host.villageId};const challengePriority=!canOfferVillageActivity(host);state.friendlyChallenge=null;
        state.nextVillageActivityAt=0;Math.random=()=>0;const refused=createVillageActivityOffer(host);Math.random=realRandom;
        handleVillageActivityChoice(host,refused,refused.choices[1]);
        const refusedSafe=!state.villageActivity && !canOfferVillageActivity(host);
        state.player.x=host.homeX;draw();
        return {preparing,walked,relocated,notAuto,returning,home,cooldown,anotherSpot,reloadSafe,paused,departureSafe,questPriority,challengePriority,refusedSafe,target:target?.kind};
      });
      assert.equal(result.target,'hidden-resident');
      for(const [key,value]of Object.entries(result))if(key!=='target')assert.equal(value,true,key);
      const hud=await page.evaluate(()=>{
        const village=getVillageByIndex(0),host=getResidentForVillage(village);
        state.player.x=host.homeX;state.camera.x=host.homeX-window.innerWidth*.5;
        state.nextVillageActivityAt=0;state.villageActivityCooldowns={};
        const random=Math.random;Math.random=()=>0;
        const offer=createVillageActivityOffer(host);Math.random=random;
        handleVillageActivityChoice(host,offer,offer.choices[0]);
        const labels=[],fill=ctx.fillText;
        ctx.fillText=function(text,...args){labels.push(text);return fill.call(this,text,...args);};
        for(let i=0;i<3;i++){drawVillageActivityHud();state.time+=1;updateVillageActivity(1);}
        drawVillageActivityHud();ctx.fillText=fill;
        const countdown=['3','2','1'].every((n,i)=>labels[i]===`Il se cache... ${n}`);
        const search=labels[3]==='Retrouve le villageois !  240 s';
        const position=getActivityHudPosition(),top=document.querySelector('.hud').getBoundingClientRect();
        const pad=document.getElementById('mobilePad').getBoundingClientRect();
        const clearTop=position.y-20>top.bottom;
        const clearPad=position.y+20<pad.top || pad.width===0;
        draw();return {countdown,search,clearTop,clearPad};
      });
      for(const [key,value]of Object.entries(hud))assert.equal(value,true,`HUD: ${key}`);
      fs.mkdirSync(path.join(root,'.tools','village'),{recursive:true});
      await page.screenshot({path:path.join(root,'.tools','village',`hide-search-${viewport.width}.png`)});
      const retry=await page.evaluate(()=>{
        const village=getVillageByIndex(0),host=getResidentForVillage(village);
        state.time=state.villageActivity.expiresAt;updateVillageActivity(.1);
        const ended=!state.villageActivity && getResidentForVillage(village).x===host.homeX;
        saveGame();loadGame();
        const random=Math.random;Math.random=()=>.99;
        const offer=createVillageActivityOffer(host);Math.random=random;
        const retryOffered=offer?.activityOffer.kind==='hide';
        handleVillageActivityChoice(host,offer,offer.choices[0]);
        const restarted=state.villageActivity?.stage==='preparing';
        finishVillageActivity();return {ended,retryOffered,restarted};
      });
      for(const [key,value]of Object.entries(retry))assert.equal(value,true,`retry: ${key}`);
      const searchHint=await page.evaluate(()=>{
        const village=getVillageByIndex(0),host=getResidentForVillage(village);
        state.friendlyChallenge={kind:'search',villageId:host.villageId,villager:host,
          startedAt:state.time,readyAt:state.time+3,remaining:125,target:1,progress:0,targetX:host.x+300};
        const item=createSearchChallengeItem(state.friendlyChallenge);
        state.friendlyChallenge.targetItemId=item.id;
        const earlyBlocked=collectDiscovery(item)===false && !item.collected;
        const labels=[],original=ctx.fillText;
        ctx.fillText=function(label,...args){labels.push(label);return original.call(this,label,...args);};
        drawFriendlyChallengeHud();
        const named=labels.includes(`Cherche : ${item.label}`),countdown=labels.includes('Depart dans 3 s');
        state.time+=3;state.player.x=item.x-100;drawFriendlyChallengeHud();
        const right=labels.includes('a droite - 125 s');
        state.player.x=item.x+100;drawFriendlyChallengeHud();
        const left=labels.includes('a gauche - 125 s');
        const landmark=state.friendlyChallenge.searchLandmark;
        const truthful=getVillageActivitySpots(village).some(spot=>spot.label===landmark && Math.abs(item.x-spot.x)<=110);
        const stable=JSON.stringify(getVillagerOutfit(host))===JSON.stringify(getVillagerOutfit({...host,x:host.x+400}));
        const outfits=new Set(Array.from({length:24},(_,i)=>getVillagerOutfit(getResidentForVillage(getVillageByIndex(i))).index)).size>=4;
        ctx.fillText=original;draw();
        saveGame();loadGame();
        const restored=state.friendlyChallenge.searchLandmark===landmark && state.worldDiscoveries[item.id].x===item.x;
        return {named,countdown,right,left,truthful,stable,outfits,earlyBlocked,restored};
      });
      for(const [key,value]of Object.entries(searchHint))assert.equal(value,true,`search hint: ${key}`);
      await page.screenshot({path:path.join(root,'.tools','village',`search-hint-${viewport.width}.png`)});
      await page.evaluate(()=>{state.friendlyChallenge=null;});
      const lost=await page.evaluate(()=>{
        state.player.x=world.firstRouteEnd+520+410;state.camera.x=world.firstRouteEnd+320;state.chapter=4;
        state.activeQuest=null;state.pendingQuestReward=null;state.friendlyChallenge=null;
        const village=getVillageByIndex(0),host=getResidentForVillage(village),spots=getVillageActivitySpots(village);
        const inventory=JSON.stringify(state.inventory),respawns=JSON.stringify(state.discoveryRespawns);
        const offer=createLostVillageActivityOffer(host,village,spots[0]);
        const truthful=offer.prompt.includes(offer.activityOffer.spot.label) && offer.activityOffer.lostItem.x===spots[0].x;
        handleVillageActivityChoice(host,offer,offer.choices[0]);
        drawLostVillageObject();
        state.player.x=offer.activityOffer.lostItem.x;
        const target=getInteractionTarget([],[]);
        interact();
        const carried=state.villageActivity?.stage==='carried';
        collectLostVillageObject();
        const separate=JSON.stringify(state.inventory)===inventory && JSON.stringify(state.discoveryRespawns)===respawns;
        const noRespawn=getInteractionTarget([],[])?.kind!=='lost-item';
        saveGame();loadGame();const restored=state.villageActivity?.stage==='carried';
        state.player.x=host.homeX;
        openVillagerHelp(getResidentForVillage(village));
        const returnChoice=pendingVillagerConversation?.conversation.activityReturn===true;
        const relation=getVillagerMemory(host).relation;
        handleVillagerChoice(0);
        const returned=!state.villageActivity && getVillagerMemory(host).relation===relation+.5;
        const afterReturn=JSON.stringify(state.inventory)===inventory;
        const validAll=spots.every(spot=>{
          const o=createLostVillageActivityOffer(host,village,spot);
          return o.activityOffer.lostItem.x===spot.x && o.prompt.includes(spot.label);
        });
        const searchingOffer=createLostVillageActivityOffer(host,village,spots[1]);
        handleVillageActivityChoice(host,searchingOffer,searchingOffer.choices[0]);
        saveGame();loadGame();const searchRestored=state.villageActivity?.stage==='searching' && state.villageActivity.lostItem.x===spots[1].x;
        finishVillageActivity();const abandoned=!state.villageActivity;
        draw();
        return {truthful,carried,separate,noRespawn,restored,returnChoice,returned,afterReturn,validAll,searchRestored,abandoned,target:target?.kind};
      });
      assert.equal(lost.target,'lost-item');
      for(const [key,value]of Object.entries(lost))if(key!=='target')assert.equal(value,true,`lost: ${key}`);
      const shelter=await page.evaluate(()=>{
        state.player.x=world.firstRouteEnd+480;state.chapter=4;state.cinematicPlayed=true;
        state.weatherCycleOffset=5;state.nextWeatherChangeAt=state.time+3;state.weather='wind';
        state.activeQuest=null;state.pendingQuestReward=null;state.friendlyChallenge=null;
        state.companion.unlocked=true;state.companion.present=true;
        const companion=state.companion.species,refuge=getVillageShelter(getVillageByIndex(0));
        const target=getInteractionTarget([],[]);
        enterWeatherShelter(refuge);
        const entering=state.shelter?.stage==='entering';
        state.time+=.35;updateWeatherShelter();
        const animated=getShelterFade()>0 && getShelterFade()<1;
        state.time+=.4;updateWeatherShelter();
        const inside=state.shelter?.stage==='inside' && getShelterFade()===0;
        ctx.clearRect(0,0,canvas.width,canvas.height);drawPlayer();drawCompanion();
        const invisible=!ctx.getImageData(0,0,canvas.width,canvas.height).data.some((value,index)=>index%4===3&&value);
        const time=state.time,x=state.player.x;keys.add('ArrowRight');joystick.active=true;joystick.x=1;
        for(let i=0;i<180;i++)update(1/60);
        clearMovementIntent();
        const worldContinues=state.time>time+2 && state.player.x===x;
        if(!worldContinues)throw Error(JSON.stringify({time,now:state.time,x,nowX:state.player.x,dialogs:[...document.querySelectorAll('dialog[open]')].map(d=>d.id),quest:state.activeQuest}));
        const calm=getWeatherForChapter().id==='clear' && state.shelter?.calmSignalled===true;
        const voluntary=state.shelter?.stage==='inside';
        triggerPlayerHop();const noHop=state.player.action!=='hop';
        saveGame();loadGame();const restored=state.shelter?.stage==='inside' && getShelterFade()===0;
        pauseGame();const pauseSafe=state.shelter?.stage==='inside';ui.startScreen.classList.add('is-hidden');
        interact();const exit=!state.shelter && state.player.x===refuge.x+36;
        const sameCompanion=state.companion.present && state.companion.species===companion;
        enterWeatherShelter(refuge);const reenter=Boolean(state.shelter);leaveWeatherShelter(true);
        restoreWeatherShelter({shelter:{id:'invalid'}});const invalidSafe=!state.shelter;
        state.friendlyChallenge={villageId:'busy'};enterWeatherShelter(refuge);const challengePriority=!state.shelter;state.friendlyChallenge=null;
        draw();
        return {target:target?.kind,entering,animated,inside,invisible,worldContinues,calm,voluntary,noHop,restored,pauseSafe,exit,sameCompanion,reenter,invalidSafe,challengePriority};
      });
      assert.equal(shelter.target,'shelter');
      for(const [key,value]of Object.entries(shelter))if(key!=='target')assert.equal(value,true,`shelter: ${key}`);
      const door=await page.evaluate(()=>{
        const refuge=getVillageShelter(getVillageByIndex(0));
        enterWeatherShelter(refuge);state.time+=1;updateWeatherShelter();
        state.camera.x=refuge.x-window.innerWidth*.45;running=true;draw();
        return {x:refuge.x-state.camera.x,y:getWalkSurfaceY(refuge.x)-40};
      });
      if(viewport.width<900)await page.touchscreen.tap(door.x,door.y);
      else await page.keyboard.press('e');
      assert.equal(await page.evaluate(()=>state.shelter),null,'real touch/keyboard exit');
      const portal=await page.evaluate(()=>{
        running=false;const village=getVillageByIndex(0),host=getResidentForVillage(village);
        const offer=createLostVillageActivityOffer(host,village,getVillageActivitySpots(village)[0]);
        handleVillageActivityChoice(host,offer,offer.choices[0]);
        enterSecretWorld({id:'test-activity-portal',name:'Passage',source:'manual'});
        const activitySafe=!state.villageActivity;leaveSecretWorld('manual');
        state.player.x=getVillageShelter(village).x;enterWeatherShelter(getVillageShelter(village));
        enterSecretWorld({id:'test-shelter-portal',name:'Passage',source:'manual'});
        const shelterSafe=!state.shelter;leaveSecretWorld('manual');
        return activitySafe && shelterSafe && getResidentForVillage(village).x===host.homeX;
      });
      assert.equal(portal,true,'portal safely clears activities and refuge');
      const basket=await page.evaluate(()=>{
        const host=getResidentForVillage(getVillageByIndex(0)),x=host.homeX;
        state.player.x=x;state.activeQuest=null;state.pendingQuestReward=null;
        state.friendlyChallenge={kind:'collection',title:'Panier du village',villageId:host.villageId,villager:host,
          startX:x,targetX:x,startedAt:state.time,readyAt:state.time+3,remaining:110,target:4,progress:0,runnerProgress:0,
          runner:createFriendlyChallengeRunner(host,x,1)};
        const challenge=state.friendlyChallenge;
        const item={...getCatalogItem('leaf'),id:'leaf-941001',x:x+80,hiddenUntil:0};
        state.worldDiscoveries[item.id]=item;
        challenge.runner.pickupTargetId=item.id;
        const inventory=JSON.stringify(state.inventory);
        updateFriendlyChallenge(.5);
        const countdown=challenge.runner.x===x && !item.collected;
        state.time+=3;updateFriendlyChallenge(.1);
        const moves=challenge.runner.x>x && challenge.runner.x<item.x;
        for(let i=0;i<60 && !item.collected;i++){state.time+=.1;updateFriendlyChallenge(.1);}
        const picked=item.collected && challenge.runnerProgress===1 && challenge.progress===0;
        const separate=inventory===JSON.stringify(state.inventory) && !state.discoveries.includes(item.id);
        const noDouble=collectDiscovery(item)===false;
        saveGame();loadGame();
        const restored=state.friendlyChallenge.runnerProgress===1 && state.worldDiscoveries[item.id].collected;
        const active=state.friendlyChallenge;active.runner.pickupUntil=0;
        for(let i=0;i<3;i++) {
          const next={...getCatalogItem('leaf'),id:`leaf-${941002+i}`,x:active.runner.x,hiddenUntil:0};
          state.worldDiscoveries[next.id]=next;active.runner.pickupTargetId=next.id;active.runner.pickupUntil=0;
          state.time+=2;updateFriendlyChallenge(.1);
        }
        const loses=!state.friendlyChallenge && state.friendlyChallengeHistory.at(-1).won===false;
        state.friendlyChallenge={...challenge,progress:0,runnerProgress:0,remaining:110,readyAt:state.time,runner:null};
        for(let i=0;i<4;i++)registerFriendlyChallengeDiscovery({id:`leaf-${942000+i}`});
        const wins=!state.friendlyChallenge && state.friendlyChallengeHistory.at(-1).won===true;
        closeDialog(ui.discoveryDialog);
        state.friendlyChallenge={...challenge,progress:1,runnerProgress:1,remaining:.01,readyAt:state.time,
          runner:{...challenge.runner,pickupUntil:state.time+100}};
        updateFriendlyChallenge(.1);
        const tie=!state.friendlyChallenge && ui.message.textContent.startsWith('Egalite');
        const removed=!friendlyChallengeDefinitions.some(def=>def.kind==='exploration');
        state.friendlyChallenge={...challenge,progress:1,runnerProgress:2,remaining:80,readyAt:state.time,
          runner:{...challenge.runner,mode:'collection',x:x+150,vx:30}};
        exploration?.finishScene();
        clearSecretWorldTransition();
        state.friendlyChallenge.readyAt=state.time-1;
        ui.regionBanner.classList.remove('is-visible');ui.message.classList.remove('is-visible');
        state.camera.x=x-window.innerWidth*.45;state.player.x=x;draw();
        return {countdown,moves,picked,separate,noDouble,restored,loses,wins,tie,removed};
      });
      for(const [key,value]of Object.entries(basket))assert.equal(value,true,`basket: ${key}`);
      await page.waitForTimeout(500);
      await page.screenshot({path:path.join(root,'.tools','village',`basket-duel-${viewport.width}.png`)});
      assert.deepEqual(errors,[]);
      console.log(`${viewport.width}x${viewport.height}: hide-and-seek proposal, real relocation, proximity, return, varied spots, cooldown, refusal, mission/challenge priority, pause, departure and reload passed`);
      console.log(`${viewport.width}x${viewport.height}: lost object truthful placement, separate pickup, no respawn, handover, relation and search/carried reload passed`);
      console.log(`${viewport.width}x${viewport.height}: shelter entry animation, hidden actors, continuing weather, calm signal, voluntary exit, companion, pause and reload passed`);
      await context.close();
    }
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
