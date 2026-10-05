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
        running=false;state.player.x=10000;state.camera.x=9500;state.player.face=-1;
        state.cinematicPlayed=true;state.chapter=getChapter();state.time=899;state.nextSecretAt=900;
        state.activeSecretPortal=null;state.activeSecretWorld=null;running=true;
        updateSecretPortal();const before=!state.activeSecretPortal;
        state.time=900;updateSecretPortal();const portal={...state.activeSecretPortal};
        const spawned=portal.source==='natural' && portal.x===10460;
        state.player.x=portal.x;state.camera.x=portal.x-window.innerWidth/2;draw();
        const visible=getProceduralSecretLocations().some(p=>p.id===portal.id);
        saveGame();state.activeSecretPortal=null;loadGame();
        const restored=state.activeSecretPortal?.id===portal.id;
        const target=getInteractionTarget([],[]);
        interact();const entered=Boolean(state.activeSecretWorld) && !state.activeSecretPortal;
        const sixty=state.activeSecretWorld.returnAt-state.time===60;
        state.time+=61;updateSecretWorld(1,0,state.player.x);
        const returned=!state.activeSecretWorld && state.player.x===portal.x;
        const scheduled=state.nextSecretAt>state.time;
        return {before,spawned,visible,restored,target:target?.kind,entered,sixty,returned,scheduled};
      });
      assert.equal(result.target,'secret');
      for(const [key,value]of Object.entries(result))if(key!=='target')assert.equal(value,true,key);
      const timing=await page.evaluate(()=>{
        state.activeSecretPortal=null;state.activeSecretWorld=null;state.time=0;state.nextSecretAt=900;
        state.player.x=10000;state.player.vx=0;state.chapter=getChapter();
        state.activeQuest=null;state.pendingQuestReward=null;state.friendlyChallenge=null;
        keys.clear();clearMovementIntent();
        for(let i=0;i<1799;i++)update(.033,.5);
        const notEarly=!state.activeSecretPortal;
        update(.033,.5);update(.033,.5);
        const onTime=Boolean(state.activeSecretPortal) && state.time<61;
        const portalId=state.activeSecretPortal.id;saveGame();loadGame();
        const saved=state.activeSecretPortal?.id===portalId;
        const texts=[],original=ctx.fillText,originalTarget=getInteractionTarget;
        ctx.fillText=(text)=>texts.push(text);getInteractionTarget=()=>null;
        state.camera.x=state.activeSecretPortal.x+100;drawContextualInteraction();
        state.camera.x=state.activeSecretPortal.x-window.innerWidth-100;drawContextualInteraction();
        ctx.fillText=original;getInteractionTarget=originalTarget;
        const hints=texts.length===2 && texts.every(t=>t.includes('Portail')&&!t.includes(' E')) && texts[0]!==texts[1];
        state.activeSecretPortal=null;state.nextSecretAt=state.time+900;
        const before=state.nextSecretAt;openDialog(ui.optionsDialog);update(.033,20);
        const pauseSafe=state.nextSecretAt===before;closeDialog(ui.optionsDialog);
        state.player.face=-1;state.inventory.star=1;invokePortalFromItem();
        const manual=state.activeSecretPortal?.source==='manual' && state.inventory.star===0
          && state.activeSecretPortal.x===state.player.x+460;
        const id=state.activeSecretPortal.id;
        state.player.x=state.activeSecretPortal.x+interactionRanges.secret+1;updateSecretPortal();
        const staysAhead=state.activeSecretPortal.id===id && state.activeSecretPortal.x===state.player.x+460;
        state.player.x=state.activeSecretPortal.x;updateSecretPortal();
        const reachable=state.activeSecretPortal.x===state.player.x;
        return {notEarly,onTime,saved,hints,pauseSafe,manual,staysAhead,reachable};
      });
      for(const [key,value]of Object.entries(timing))assert.equal(value,true,key);
      assert.deepEqual(errors,[]);
      console.log(`${viewport.width}x${viewport.height}: 15-minute spawn, rendered portal, save reload, entry, 60-second world, return, slow-frame timing, directional hints, pause and star invocation passed`);
      await context.close();
    }
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
