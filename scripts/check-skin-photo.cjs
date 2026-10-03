/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS browser regression runner. */
// Browser regression check: auth and storage requests are stubbed; no real user photos are uploaded.
const { chromium } = require(process.env.AURAI_PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const root = path.resolve(__dirname, '..');
const artifactDir = process.env.AURAI_TEST_ARTIFACTS || os.tmpdir();
const baseUrl = process.env.AURAI_TEST_URL || 'https://localhost:3443';
const assert = require('node:assert/strict');
const env = fs.readFileSync(path.join(root,'.env.local'),'utf8');
const project = new URL(env.match(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*["']?([^\s"']+)/m)[1]).hostname.split('.')[0];
const id = '11111111-1111-4111-8111-111111111111';
const jwt = [Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:id,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url'),'test'].join('.');
const results = [];
async function setup(browser, options={}) {
 const context = await browser.newContext({viewport:{width:options.width||393,height:1000},isMobile:true,hasTouch:true,ignoreHTTPSErrors:true,reducedMotion:'reduce'});
 const user = {id,aud:'authenticated',role:'authenticated',email:'never-display@example.com',user_metadata:options.noName?{}:{givenName:'민서',familyName:'김'},created_at:new Date().toISOString()};
 const uploads=[], errors=[], chat=[];
 let allowProfile; const gate = options.delayProfile ? new Promise(r=>allowProfile=r):Promise.resolve();
 await context.addInitScript(({project,jwt,user,mode})=>{
  localStorage.setItem(`sb-${project}-auth-token`,JSON.stringify({access_token:jwt,refresh_token:'test',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user}));
  const timeout=window.setTimeout.bind(window); window.setTimeout=(fn,ms,...args)=>timeout(fn,Math.min(Number(ms)||0,30),...args);
  window.__camera={requests:[],streams:[],fail:mode==='denied',hold:false,order:[]};
  const media=window.__camera;
  new MutationObserver(()=>{ for(const key of ['skin-photo-guide','skin-photo-request','skin-camera-card']) {if(document.querySelector(`[data-testid="${key}"]`)&&!media.order.includes(key))media.order.push(key);} }).observe(document,{childList:true,subtree:true});
  const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia=async constraints=>{
   media.requests.push({constraints,liveBefore:media.streams.some(s=>s.getTracks().some(t=>t.readyState==='live'))});
   if(media.fail) throw new DOMException('denied','NotAllowedError');
   if(media.failBack && constraints.video.deviceId?.exact==='back') throw new DOMException('busy','NotReadableError');
   const stream=await original({video:true,audio:false});
   const track=stream.getVideoTracks()[0];
   const deviceId=constraints.video.deviceId?.exact||'front';
   if(mode!=='native') track.getSettings=()=>({deviceId,facingMode:deviceId==='front'?'user':'environment'});
   media.streams.push(stream);
   if(media.hold) await new Promise(r=>media.resume=r);
   return stream;
  };
  if(mode!=='native') navigator.mediaDevices.enumerateDevices=async()=>[
   {kind:'videoinput',deviceId:'front',label:'Front camera'},
   {kind:'videoinput',deviceId:'back',label:'Back camera'},
  ];
 },{project,jwt,user,mode:options.mode||'native'});
 await context.route('**/auth/v1/user',async route=>{await gate;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(user)});});
 await context.route('**/api/chat',async route=>{chat.push(route.request().postDataJSON());await route.fulfill({status:200,contentType:'application/json',body:'{}'});});
 await context.route('**/storage/v1/object/skin-photos/**',async route=>{
  const body=route.request().postDataBuffer().toString('utf8');
  const value=body.match(/name="metadata"\r\n\r\n([^\r]+)/)?.[1];
  uploads.push({metadata:value?JSON.parse(value):null,path:new URL(route.request().url()).pathname,bytes:route.request().postDataBuffer().length});
  await route.fulfill({status:options.failUpload&&uploads.length===1?503:200,contentType:'application/json',body:JSON.stringify({Key:'confirmed.jpg'})});
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${baseUrl}/chat?name=잘못된이름`);
 return {context,page,uploads,errors,chat,release:()=>allowProfile?.()};
}
async function complete(test, concernFirst=false) {
 const {page}=test;
 await page.getByRole('button',{name:concernFirst?'피부 고민':'피부 타입',exact:true}).click();
 if(concernFirst){
  await page.locator('[data-testid="concern-button"][data-type="dryness-flaking"]').click();
  await page.locator('[data-testid="concern-area-button"][data-area="cheek"]').click();
  assert.equal(await page.getByTestId('concern-area-confirm').isDisabled(),true,'requires skin type');
 }
 await page.locator('[data-testid="skin-type-button"][data-type="dry"]').click();
 if(!concernFirst) await page.locator('[data-testid="concern-button"][data-type="dryness-flaking"]').click();
 await page.locator('[data-testid="concern-area-button"][data-area="cheek"]').click();
 await page.getByTestId('concern-area-other').click();
 await page.getByTestId('concern-area-custom-input').fill('왼쪽 턱 아래');
 assert.equal(await page.getByTestId('skin-photo-flow').count(),0,'no camera before final confirmation');
 await page.getByTestId('concern-area-confirm').evaluate(el=>{el.click();el.click();el.click();});
 await page.getByTestId('skin-camera-card').waitFor();
 assert.equal(await page.getByTestId('skin-photo-flow').count(),1);
 assert.equal(await page.getByTestId('skin-photo-guide').count(),1);
 assert.equal(await page.getByTestId('skin-photo-request').locator('p').innerText(),'고민되는 피부 부위를 사진으로 보여주세요.');
 assert.deepEqual(await page.evaluate(()=>window.__camera.order),['skin-photo-guide','skin-photo-request','skin-camera-card']);
}
async function live(page){await page.waitForFunction(()=>{const v=document.querySelector('[data-testid="camera-video"]');return v?.videoWidth>0&&!document.querySelector('[data-testid="camera-shutter"]').disabled;});}
async function stopped(page){await page.waitForFunction(()=>window.__camera.streams.every(s=>s.getTracks().every(t=>t.readyState==='ended')));}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
 try{
  const test=await setup(browser,{delayProfile:true});const {page}=test;
  assert.equal(await page.getByRole('button',{name:'피부 타입',exact:true}).count(),0);
  assert.ok(!(await page.locator('body').innerText()).includes('잘못된이름'));
  test.release();await complete(test);await live(page);
  assert.ok((await page.getByTestId('skin-photo-guide').innerText()).includes('민서님의 피부 상태를 함께 살펴볼까요?'));
  const props=await page.getByTestId('camera-video').evaluate(v=>({autoplay:v.autoplay,playsInline:v.playsInline,muted:v.muted,filter:getComputedStyle(v).filter}));
  assert.deepEqual(props,{autoplay:true,playsInline:true,muted:true,filter:'none'});
  assert.equal(await page.getByTestId('camera-flip').isDisabled(),true);
  assert.deepEqual(await page.evaluate(()=>window.__camera.requests[0].constraints),{audio:false,video:{facingMode:{ideal:'user'}}});
  await page.getByTestId('skin-camera-card').evaluate(el=>el.scrollIntoView({block:'end'}));
  await page.waitForFunction(()=>document.querySelector('[data-testid="camera-video"]')?.getVideoPlaybackQuality().totalVideoFrames>1);
  await page.waitForFunction(()=>document.querySelector('[data-testid="camera-shutter"]').getBoundingClientRect().bottom < innerHeight-55);
  await page.screenshot({path:path.join(artifactDir,'aurai-skin-camera-393.png')});
  await page.getByTestId('camera-shutter').click();await page.getByTestId('camera-preview').waitFor();await stopped(page);
  const dimensions=await page.getByTestId('camera-preview').evaluate(i=>({width:i.naturalWidth,height:i.naturalHeight}));assert.ok(dimensions.width>0&&dimensions.height>0);
  assert.equal(test.uploads.length,0,'preview never uploads');
  await page.getByTestId('camera-retake').click();await live(page);
  await page.getByTestId('camera-shutter').click();await page.getByTestId('camera-preview').waitFor();
  await page.getByTestId('camera-use').evaluate(el=>{el.click();el.click();});
  await page.getByText('피부 사진을 올렸어요.',{exact:true}).waitFor();assert.equal(test.uploads.length,1);
  assert.deepEqual(test.uploads[0].metadata,{skinType:'dry',concern:'dryness-flaking',areaIds:['cheek'],areaLabels:['볼'],customArea:'왼쪽 턱 아래'});
  assert.ok(test.uploads[0].path.includes(id));assert.deepEqual(test.errors,[]);results.push('profile loading, real saved name, sequence, explicit confirmation, deduplication, native video capture, retake, single camera disabled, one upload with survey metadata');await test.context.close();

  const denied=await setup(browser,{mode:'denied',noName:true,width:320,failUpload:true});await complete(denied,true);
  assert.equal(await denied.page.getByTestId('skin-photo-guide').locator('h2').innerText(),'피부 상태를 함께 살펴볼까요?');
  await denied.page.getByTestId('camera-retry').waitFor();assert.ok((await denied.page.getByTestId('camera-overlay').innerText()).includes('카메라 권한이 필요해요'));
  assert.equal(await denied.page.getByTestId('camera-shutter').isDisabled(),true);
  assert.equal(await denied.page.getByTestId('camera-gallery').isEnabled(),true);
  await denied.page.getByTestId('camera-retry').click();await denied.page.getByTestId('camera-retry').waitFor();
  assert.ok(await denied.page.evaluate(()=>window.__camera.requests.length>=2));
  assert.equal(await denied.page.getByTestId('camera-file').getAttribute('accept'),'image/*');assert.equal(await denied.page.getByTestId('camera-file').getAttribute('capture'),null);
  const chooserPromise=denied.page.waitForEvent('filechooser');await denied.page.getByTestId('camera-gallery').click();const chooser=await chooserPromise;
  await chooser.setFiles(path.join(root,'public/images/skin-types/dry.webp'));
  await denied.page.getByTestId('camera-preview').waitFor();assert.equal(denied.uploads.length,0);
  await denied.page.getByTestId('camera-use').click();await denied.page.getByText('피부 사진을 올리지 못했어요. 다시 시도해 주세요.',{exact:true}).waitFor();
  await denied.page.getByRole('button',{name:'다시 시도',exact:true}).click();await denied.page.getByText('피부 사진을 올렸어요.',{exact:true}).waitFor();assert.equal(denied.uploads.length,2);
  assert.equal(await denied.page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
  await denied.page.getByTestId('skin-photo-flow').scrollIntoViewIfNeeded();await denied.page.screenshot({path:path.join(artifactDir,'aurai-skin-camera-320.png')});assert.deepEqual(denied.errors,[]);results.push('concern-first survey, unnamed fallback, denied permission, retry, gallery remains usable, preview before upload, failed upload retry, 320px layout');await denied.context.close();

  const switching=await setup(browser,{mode:'mock-devices'});await complete(switching);await live(switching.page);
  await switching.page.getByTestId('camera-flip').click();await live(switching.page);
  await switching.page.getByTestId('camera-flip').click();await live(switching.page);
  const history=await switching.page.evaluate(()=>window.__camera.requests);assert.deepEqual(history.map(r=>r.constraints.video.deviceId?.exact||'front'),['front','back','front']);assert.ok(history.every(r=>!r.liveBefore));
  await switching.page.evaluate(()=>window.__camera.failBack=true);
  await switching.page.getByTestId('camera-flip').click();await live(switching.page);
  await switching.page.getByText('카메라를 바꾸지 못해 이전 카메라로 돌아왔어요.',{exact:true}).waitFor();
  await switching.page.evaluate(()=>window.__camera.failBack=false);
  await switching.page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await stopped(switching.page);
  await switching.page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));await live(switching.page);
  await switching.page.locator('[data-testid="concern-button"][data-type="scars"]').click();await stopped(switching.page);assert.equal(await switching.page.getByTestId('skin-photo-flow').count(),0);assert.deepEqual(switching.errors,[]);results.push('front/back/front switch stops previous tracks, switch failure restores previous camera, pagehide cleanup, pageshow resume, concern reselection closes camera');await switching.context.close();

  const late=await setup(browser,{mode:'mock-devices'});await complete(late);await live(late.page);
  await late.page.evaluate(()=>window.__camera.hold=true);await late.page.getByTestId('camera-flip').click();
  await late.page.waitForFunction(()=>!!window.__camera.resume);
  await late.page.locator('[data-testid="concern-button"][data-type="scars"]').click();
  await late.page.evaluate(()=>window.__camera.resume());await stopped(late.page);assert.deepEqual(late.errors,[]);results.push('late getUserMedia result after card unmount is stopped');await late.context.close();
  for (const concern of ['dryness-flaking','sebum-pores','acne-trouble','redness-sensitivity','pigmentation-tone','wrinkles-elasticity','scars']) {
   console.log('Checking concern:',concern);
   const t=await setup(browser,{mode:'mock-devices'});
   await t.page.getByRole('button',{name:'피부 타입',exact:true}).evaluate(el=>el.click());
   await t.page.locator('[data-testid="skin-type-button"][data-type="dry"]').evaluate(el=>el.click());
   await t.page.locator(`[data-testid="concern-button"][data-type="${concern}"]`).evaluate(el=>el.click());
   await t.page.getByTestId('concern-area-button').first().evaluate(el=>el.click());
   assert.equal(await t.page.getByTestId('skin-photo-flow').count(),0);
   await t.page.getByTestId('concern-area-confirm').evaluate(el=>el.click());
   await t.page.getByTestId('skin-camera-card').waitFor();await live(t.page);
   assert.equal(await t.page.getByTestId('skin-photo-flow').count(),1);
   assert.deepEqual(t.errors,[]);await t.context.close();
  }
  results.push('all seven concern surveys require final confirmation and lead to exactly one skin camera');
  fs.writeFileSync(path.join(artifactDir,'aurai-skin-camera-results.json'),JSON.stringify({status:'PASS',url:`${baseUrl}/chat`,results},null,2));console.log(JSON.stringify({status:'PASS',results},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
