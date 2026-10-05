/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS browser regression runner. */
// Browser regression check: auth and storage requests are stubbed; no real user photos are uploaded.
const { chromium } = require(process.env.AURAI_PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const root = path.resolve(__dirname, '..');
const artifactDir = process.env.AURAI_TEST_ARTIFACTS || os.tmpdir();
const mobileAccess = process.env.AURAI_MOBILE_TUNNEL_TEST === 'true' ? JSON.parse(fs.readFileSync(path.join(root,'.data/mobile-dev.json'),'utf8')) : null;
const baseUrl = process.env.AURAI_TEST_URL || mobileAccess?.url || 'https://localhost:3443';
if (mobileAccess && baseUrl !== mobileAccess.url) throw new Error('Tunnel credentials must only be sent to their own test origin');
const assert = require('node:assert/strict');
const env = fs.readFileSync(path.join(root,'.env.local'),'utf8');
const project = new URL(env.match(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*["']?([^\s"']+)/m)[1]).hostname.split('.')[0];
const id = '11111111-1111-4111-8111-111111111111';
const jwt = [Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:id,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url'),'test'].join('.');
const results = [];
async function setup(browser, options={}) {
 const context = await browser.newContext({viewport:{width:options.width||393,height:1000},isMobile:true,hasTouch:true,ignoreHTTPSErrors:!mobileAccess,reducedMotion:'reduce',...(mobileAccess?{httpCredentials:{username:mobileAccess.username,password:mobileAccess.password,origin:mobileAccess.url}}:{})});
 const user = {id,aud:'authenticated',role:'authenticated',email:'never-display@example.com',user_metadata:options.noName?{}:{givenName:options.name||'민서',familyName:'김'},created_at:new Date().toISOString()};
 const uploads=[], errors=[], chat=[], analyses=[];
 let allowProfile; const gate = options.delayProfile ? new Promise(r=>allowProfile=r):Promise.resolve();
 await context.addInitScript(({project,jwt,user,mode})=>{
  localStorage.setItem(`sb-${project}-auth-token`,JSON.stringify({access_token:jwt,refresh_token:'test',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user}));
  const timeout=window.setTimeout.bind(window); window.setTimeout=(fn,ms,...args)=>timeout(fn,Math.min(Number(ms)||0,30),...args);
  window.__camera={requests:[],streams:[],fail:mode==='denied',hold:false,order:[]};
  const media=window.__camera;
  new MutationObserver(()=>{ for(const key of ['concern-explanation','concern-features','concern-ingredients','concern-recommendation','concern-photo-request','skin-camera-card']) {if(document.querySelector(`[data-testid="${key}"]`)&&!media.order.includes(key))media.order.push(key);} }).observe(document,{childList:true,subtree:true});
  if (!navigator.mediaDevices?.getUserMedia) return;
  const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia=async constraints=>{
   media.requests.push({constraints,liveBefore:media.streams.some(s=>s.getTracks().some(t=>t.readyState==='live'))});
   if(media.fail) throw new DOMException('denied','NotAllowedError');
   if(media.failBack && constraints.video.deviceId?.exact==='back') throw new DOMException('busy','NotReadableError');
   const stream=await original({video:true,audio:false});
   const track=stream.getVideoTracks()[0];
   const deviceId=constraints.video.deviceId?.exact||(constraints.video.facingMode?.ideal==='environment'?'back':'front');
   if(mode!=='native') track.getSettings=()=>({deviceId,facingMode:deviceId==='front'?'user':'environment'});
   media.streams.push(stream);
   if(media.hold) await new Promise(r=>media.resume=r);
   return stream;
  };
  if(mode!=='native') navigator.mediaDevices.enumerateDevices=async()=>[
   {kind:'videoinput',deviceId:'front',label:mode==='unlabelled'?'':'Front camera'},
   {kind:'videoinput',deviceId:'back',label:mode==='unlabelled'?'':'Back camera'},
  ];
 },{project,jwt,user,mode:options.mode||'native'});
 await context.route('**/auth/v1/user',async route=>{await gate;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(user)});});
 await context.route('**/api/chat',async route=>{chat.push(route.request().postDataJSON());await route.fulfill({status:200,contentType:'application/json',body:'{}'});});
 await context.route('**/api/skin-analysis**',async route=>{analyses.push(route.request().method());await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(route.request().method()==='POST'?{status:'running',apiVersion:'2.1'}:{status:'success',apiVersion:'2.1',metrics:[{type:'pore',ui_score:72}]})});});
 await context.route('**/storage/v1/object/skin-photos/**',async route=>{
  const body=route.request().postDataBuffer().toString('utf8');
  const value=body.match(/name="metadata"\r\n\r\n([^\r]+)/)?.[1];
  uploads.push({metadata:value?JSON.parse(value):null,path:new URL(route.request().url()).pathname,bytes:route.request().postDataBuffer().length});
  await route.fulfill({status:options.failUpload&&uploads.length===1?503:200,contentType:'application/json',body:JSON.stringify({Key:'confirmed.jpg'})});
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${options.url||baseUrl}/chat?name=잘못된이름`);
 return {context,page,uploads,errors,chat,analyses,release:()=>allowProfile?.()};
}
async function openSkinTypes(page) {
 const prompt=page.getByRole('button',{name:'피부 타입',exact:true});
 await prompt.waitFor();
 assert.equal(await prompt.count(),1,'only the skin type quick prompt is present');
 assert.equal(await page.getByRole('button',{name:'피부 고민',exact:true}).count(),0);
 assert.equal(await page.getByTestId('skin-type-button').count(),0,'type cards wait for the quick prompt click');
 assert.equal(await page.getByTestId('concern-button').count(),0);
 assert.deepEqual(await page.locator('.bubble-text').first().locator('p').allTextContents(),
  ['안녕하세요','피부 고민을 함께 풀어갈 AI 파트너, AURAI입니다.','피부에 맞는 제품과 일상 속 케어를 함께 찾아드릴게요.']);
 await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(button=>button.textContent.trim()==='피부 타입'&&!button.disabled));
 await prompt.evaluate(el=>{el.click();el.click();});
 await page.locator('[data-testid="skin-type-button"][data-type="dry"]').waitFor();
 assert.equal(await prompt.isDisabled(),true,'starting the survey disables duplicate starts');
 assert.equal(await page.getByTestId('concern-button').count(),0,'skin type always comes before concerns');
 const lines=await page.locator('.bubble-text p').allTextContents();
 const intro=['피부타입을 선택해 주셨어요.','먼저 평소 피부가 어떤 타입에 가장 가까운지 알려주세요.','정확히 모르셔도 괜찮아요.','지금 느끼는 피부 상태와 가장 비슷한 것을 선택해 주세요.'];
 const shown=lines.join('').replace(/\s+/g,'');
 for(const text of intro) assert.ok(shown.includes(text.replace(/\s+/g,'')),'original guidance is present across displayed lines');
}
async function complete(test, {skinType='dry',concern='dryness-flaking',area='cheek'}={}) {
 const {page}=test;
 await openSkinTypes(page);
 await page.locator(`[data-testid="skin-type-button"][data-type="${skinType}"]`).evaluate(el=>{el.click();el.click();});
 await page.locator(`[data-testid="concern-button"][data-type="${concern}"]`).click();
 await page.locator(`[data-testid="concern-area-button"][data-area="${area}"]`).click();
 assert.equal(await page.getByTestId('concern-area-confirm').count(),0,'selection advances without a completion button');
 await page.getByTestId('concern-photo-request').waitFor();
 await page.locator(`[data-testid="concern-area-button"][data-area="${area}"]`).evaluate(el=>{el.click();el.click();});
 assert.equal(await page.getByTestId('skin-photo-flow').count(),1);
 assert.equal(await page.getByTestId('concern-profile').count(),1);
 assert.equal(await page.getByTestId('skin-survey-profile').count(),0);
 assert.equal(await page.getByTestId('skin-photo-guide').count(),0);
 assert.equal(await page.getByTestId('skin-photo-acknowledgment').count(),0);
 assert.equal(await page.getByTestId('skin-photo-request').count(),0);
 assert.equal(await page.getByTestId('concern-photo-request').locator('button').count(),0,'photo request contains only ring and copy');
 await page.getByTestId('skin-camera-card').waitFor();
 assert.equal(await page.getByTestId('skin-camera-card').count(),1);
 assert.deepEqual(await page.evaluate(()=>window.__camera.order),['concern-explanation','concern-features','concern-ingredients','concern-recommendation','concern-photo-request','skin-camera-card']);
}
async function live(page){await page.waitForFunction(()=>{const v=document.querySelector('[data-testid="camera-video"]');return v?.videoWidth>0&&!document.querySelector('[data-testid="camera-shutter"]').disabled;});}
async function stopped(page){await page.waitForFunction(()=>window.__camera.streams.every(s=>s.getTracks().every(t=>t.readyState==='ended')));}
async function photoPixels(page) { return page.getByTestId('skin-profile-photo').evaluate(image=>{const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;canvas.getContext('2d').drawImage(image,0,0);return canvas.toDataURL();}); }
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
 try{
  for(const example of [
   {skinType:'dry',concern:'pigmentation-tone',area:'cheek',title:'볼의 기미·잡티',definition:'볼의 기미·잡티란?',features:['색 얼룩','칙칙함','고르지 않은 톤'],icons:['spots','tone','patches'],file:'cheek-pigmentation'},
   {skinType:'oily',concern:'sebum-pores',area:'nose',title:'코 모공',definition:'코 모공이란?',features:['눈에 띄는 모공','번들거림','표면 광택'],icons:['pores','oil','shine'],file:'nose-pores'},
  ]) {
   const t=await setup(browser);const p=t.page;
   await complete(t,{...example,openCamera:false});
   assert.equal(await p.getByTestId('concern-explanation').locator('h2').innerText(),example.definition);
   assert.deepEqual(await p.getByTestId('concern-features').locator('li > span:last-child').allTextContents(),example.features);
   assert.deepEqual(await p.getByTestId('concern-features').locator('svg').evaluateAll(icons=>icons.map(i=>i.dataset.icon)),example.icons);
   assert.ok((await p.getByTestId('concern-explanation').locator('img').getAttribute('src')).includes(`${example.concern}-${example.area}.webp`));
   assert.ok((await p.getByTestId('concern-ingredients').innerText()).includes(`${example.title}에 도움되는 성분`));
   assert.equal(await p.getByTestId('concern-ingredients').locator('[data-ingredient]').count(),0,'unreviewed ingredient claims are not invented');
   assert.ok((await p.getByTestId('concern-recommendation').innerText()).includes(example.title));
   assert.ok((await p.getByTestId('concern-photo-request').locator('h2').innerText()).startsWith(`${example.title}${example.area==='nose'?'이':'가'}`));
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert.equal(t.uploads.length,0);assert.equal(t.analyses.length,0);
   // Keep the actual phone width, extend only screenshot height to include all five blocks.
   await p.setViewportSize({width:393,height:2100});
   await p.getByTestId('concern-profile').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
   await p.waitForFunction(()=>[...document.querySelectorAll('[data-testid="concern-profile"] img')].every(img=>img.complete&&img.naturalWidth>0));
   await p.getByTestId('concern-profile').screenshot({path:path.join(artifactDir,`aurai-${example.file}-393.png`)});
   await p.setViewportSize({width:393,height:1000});
   await p.getByTestId('concern-profile').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
   await p.screenshot({path:path.join(artifactDir,`aurai-${example.file}-393-viewport.png`)});
   if(example.area==='nose') {
    await live(p);
    const requestCount=await p.evaluate(()=>window.__camera.requests.length);
    await p.locator('[data-testid="concern-area-button"][data-area="cheek"]').click();
    await p.getByTestId('concern-explanation').getByRole('heading',{name:'볼 모공이란?',exact:true}).waitFor();
    assert.equal(await p.getByTestId('concern-profile').count(),1);
    assert.equal(await p.locator('.justify-end .bubble-text p').last().textContent(),'볼이 고민이야');
    await p.locator('[data-testid="concern-area-button"][data-area="nose"]').click();
    await p.getByTestId('concern-explanation').getByRole('heading',{name:example.definition,exact:true}).waitFor();
    assert.equal(await p.evaluate(()=>window.__camera.requests.length),requestCount,'reselecting a region updates the existing guide without reopening camera');
    await p.getByRole('button',{name:'정보 수정',exact:true}).click();
    await p.getByTestId('skin-profile-editor').getByLabel('볼',{exact:true}).check();
    await p.getByRole('button',{name:'수정 완료',exact:true}).click();
    assert.equal(await p.getByTestId('concern-explanation').locator('h2').innerText(),'볼 모공이란?','last selected region drives explanation');
    assert.equal(await p.getByTestId('concern-profile').count(),1,'editing replaces guide in place');
    await p.getByRole('button',{name:'정보 수정',exact:true}).click();
    await p.getByTestId('skin-profile-editor').getByLabel('볼',{exact:true}).uncheck();
    await p.getByRole('button',{name:'수정 완료',exact:true}).click();
    assert.equal(await p.getByTestId('concern-explanation').locator('h2').innerText(),example.definition);
   }
   const chooser=p.waitForEvent('filechooser');await p.getByTestId('camera-gallery').click();
   await (await chooser).setFiles(path.join(root,'public/images/skin-types/dry.webp'));
   await p.getByTestId('camera-preview').waitFor();
   await stopped(p);
   const cameraRequests=await p.evaluate(()=>window.__camera.requests.length);
   assert.equal(t.uploads.length,0);assert.equal(t.analyses.length,0);
   const reselect=p.waitForEvent('filechooser');await p.getByTestId('camera-retake').click();
   await (await reselect).setFiles(path.join(root,'public/images/skin-types/oily.webp'));
   await p.getByTestId('camera-preview').waitFor();
   assert.equal(await p.evaluate(()=>window.__camera.requests.length),cameraRequests,'album reselection keeps camera stopped');
   await p.getByTestId('camera-use').evaluate(el=>{el.click();el.click();});
   await p.getByTestId('skin-profile-card').waitFor();
   await p.getByTestId('skin-analysis-result').getByText('피부 분석 결과',{exact:true}).waitFor();
   assert.equal(t.uploads.length,1);assert.equal(t.analyses.filter(m=>m==='POST').length,1);
   assert.equal(await p.getByTestId('concern-profile').count(),1);
   assert.deepEqual(t.errors,[]);await t.context.close();
  }
  results.push('393px concern guides: request card has no buttons, camera follows automatically once, album preview/reselect stops camera, confirmation submits once');
  if(process.env.AURAI_GUIDE_ONLY==='true') { console.log(JSON.stringify({status:'PASS',results},null,2)); return; }
  const test=await setup(browser,{delayProfile:true});const {page}=test;
  assert.ok(!(await page.locator('body').innerText()).includes('잘못된이름'));
  test.release();await complete(test);await live(page);
  assert.equal(test.chat.filter(request=>request.selectedSkinType==='dry').length,1,'type confirmation cannot be duplicated');
  assert.equal(await page.locator('.justify-end .bubble-text p').last().textContent(),'볼이 고민이야');
  assert.equal(await page.getByTestId('concern-profile').evaluate(el=>getComputedStyle(el).color),'rgb(242, 229, 212)');
  const props=await page.getByTestId('camera-video').evaluate(v=>({autoplay:v.autoplay,playsInline:v.playsInline,muted:v.muted,filter:getComputedStyle(v).filter}));
  assert.deepEqual(props,{autoplay:true,playsInline:true,muted:true,filter:'none'});
  assert.equal(await page.getByTestId('camera-video').evaluate(v=>v.defaultMuted),true);
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
  await page.getByTestId('skin-profile-card').waitFor();await stopped(page);
  assert.equal(await page.getByTestId('skin-camera-card').count(),0);
  assert.equal(await page.getByTestId('skin-profile-card').count(),1);
  await page.getByTestId('skin-analysis-result').getByText('피부 분석 결과',{exact:true}).waitFor();
  assert.equal(test.uploads.length,1);assert.equal(test.analyses.filter(method=>method==='POST').length,1);
  const photoUrl=await page.getByTestId('skin-profile-photo').getAttribute('src');
  assert.ok(photoUrl.startsWith('blob:'));
  assert.ok((await page.getByTestId('skin-profile-card').innerText()).includes('피부 타입 · 건성'));
  await page.getByRole('button',{name:'정보 수정',exact:true}).click();
  await page.getByLabel('피부 타입 수정').selectOption('oily');
  await page.getByLabel('피부 고민 수정').selectOption('pigmentation-tone');
  await page.getByTestId('skin-profile-editor').getByLabel('눈밑',{exact:true}).check();
  await page.getByRole('button',{name:'수정 완료',exact:true}).click();
  assert.equal(await page.getByTestId('skin-profile-card').count(),1);
  assert.equal(await page.getByTestId('skin-profile-photo').getAttribute('src'),photoUrl);
  const updated=await page.getByTestId('skin-profile-card').innerText();
  assert.ok(updated.includes('Oily skin'));assert.ok(updated.includes('고민 부위 · 눈밑'));assert.ok(updated.includes('피부 고민 · 잡티·피부 톤'));
  assert.equal(await page.getByTestId('concern-profile').count(),1);
  assert.equal(await page.getByTestId('concern-selections').count(),0);
  assert.ok(!(await page.getByTestId('concern-profile').innerText()).includes('설명용 예시'));
  assert.equal(await page.locator('.justify-end .bubble-text p').last().textContent(),'눈밑이 고민이야');
  assert.ok(!updated.includes('분석 완료'));assert.ok(!updated.includes('점수'));
  const originalPixels=await photoPixels(page);
  await page.getByTestId('skin-profile-card').screenshot({path:path.join(artifactDir,'aurai-skin-profile-393.png')});
  await page.getByRole('button',{name:'사진 다시 선택',exact:true}).click();
  await live(page);
  await page.getByRole('button',{name:'사진 변경 취소',exact:true}).click();await stopped(page);
  assert.equal(await photoPixels(page),originalPixels,'cancel preserves the confirmed photo despite a new object URL');
  assert.equal(test.uploads.length,1);assert.equal(test.analyses.filter(method=>method==='POST').length,1);
  assert.deepEqual(test.errors,[]);results.push('selected area message, profile, one upload and analysis, edit keeps photo without reanalysis');await test.context.close();

  if (process.env.AURAI_TEST_HTTP_URL) {
   const insecure=await setup(browser,{url:process.env.AURAI_TEST_HTTP_URL,width:320});await complete(insecure);
   await insecure.page.getByTestId('camera-open-https').waitFor();
   assert.equal(await insecure.page.evaluate(()=>isSecureContext),false);
   assert.equal(await insecure.page.getByTestId('camera-gallery').isEnabled(),true);
   const layout=await insecure.page.getByTestId('camera-overlay').evaluate(el=>({visible:el.scrollHeight<=el.clientHeight,overflow:document.documentElement.scrollWidth>innerWidth}));
   assert.deepEqual(layout,{visible:true,overflow:false});
   await insecure.page.getByTestId('camera-open-https').click();await insecure.page.waitForURL('https://**:3443/chat?name=*');
   assert.equal(await insecure.page.evaluate(()=>isSecureContext),true);
   await complete(insecure);await live(insecure.page);await insecure.context.close();
   results.push('320px HTTP LAN blocks camera, keeps album and complete error controls, HTTPS button opens secure camera flow');
  }

  const unlabelled=await setup(browser,{mode:'unlabelled'});await complete(unlabelled);await live(unlabelled.page);
  await unlabelled.page.getByTestId('camera-flip').click();await live(unlabelled.page);
  assert.deepEqual(await unlabelled.page.evaluate(()=>window.__camera.requests.map(r=>r.constraints.video.facingMode?.ideal)),['user','environment']);
  assert.ok(await unlabelled.page.evaluate(()=>window.__camera.requests.every(r=>r.constraints.audio===false&&!r.liveBefore)));
  assert.deepEqual(unlabelled.errors,[]);await unlabelled.context.close();results.push('unlabelled mobile devices switch with facingMode and stop old tracks without microphone requests');

  const denied=await setup(browser,{mode:'denied',noName:true,width:320});await complete(denied);
  await denied.page.getByTestId('camera-retry').waitFor();assert.ok((await denied.page.getByTestId('camera-overlay').innerText()).includes('카메라 권한이 필요해요'));
  assert.equal(await denied.page.getByTestId('camera-shutter').isDisabled(),true);
  assert.equal(await denied.page.getByTestId('camera-gallery').isEnabled(),true);
  assert.equal(await denied.page.getByTestId('camera-gallery-thumbnail').count(),0,'album contents cannot be read before selection');
  await denied.page.getByTestId('camera-retry').click();await denied.page.getByTestId('camera-retry').waitFor();
  assert.ok(await denied.page.evaluate(()=>window.__camera.requests.length>=2));
  assert.equal(await denied.page.getByTestId('camera-file').getAttribute('accept'),'image/*');assert.equal(await denied.page.getByTestId('camera-file').getAttribute('capture'),null);
  const chooserPromise=denied.page.waitForEvent('filechooser');await denied.page.getByTestId('camera-gallery').click();const chooser=await chooserPromise;
  await chooser.setFiles(path.join(root,'public/images/skin-types/dry.webp'));
  await denied.page.getByTestId('camera-preview').waitFor();assert.equal(denied.uploads.length,0);
  await denied.page.waitForFunction(()=>document.querySelector('[data-testid="camera-gallery-thumbnail"]')?.naturalWidth>0);
  const firstThumbnail=await denied.page.getByTestId('camera-gallery-thumbnail').getAttribute('src');
  assert.ok(firstThumbnail.startsWith('blob:'));
  assert.equal(await denied.page.getByTestId('camera-gallery').getAttribute('aria-label'),'앨범에서 선택');
  const reselectPromise=denied.page.waitForEvent('filechooser');
  await denied.page.getByTestId('camera-retake').click();await reselectPromise;
  assert.equal(await denied.page.getByTestId('camera-gallery-thumbnail').getAttribute('src'),firstThumbnail,'retake keeps the last album image');
  assert.equal(await denied.page.evaluate(url=>fetch(url).then(r=>r.ok),firstThumbnail),true,'thumbnail URL outlives the large preview');
  await denied.page.getByTestId('skin-camera-card').screenshot({path:path.join(artifactDir,'aurai-album-thumbnail-320.png')});
  const nextChooserPromise=denied.page.waitForEvent('filechooser');await denied.page.getByTestId('camera-gallery').click();
  await (await nextChooserPromise).setFiles(path.join(root,'public/images/skin-types/oily.webp'));
  await denied.page.waitForFunction(old=>{const image=document.querySelector('[data-testid="camera-gallery-thumbnail"]');return image?.naturalWidth>0&&image.src!==old;},firstThumbnail);
  const secondThumbnail=await denied.page.getByTestId('camera-gallery-thumbnail').getAttribute('src');
  assert.equal(await denied.page.evaluate(url=>fetch(url).then(()=>false,()=>true),firstThumbnail),true,'replaced thumbnail URL is released');
  assert.equal(denied.uploads.length,0,'selecting and replacing thumbnails does not upload photos');
  await denied.page.getByTestId('camera-use').click();await denied.page.getByTestId('skin-profile-card').waitFor();
  assert.equal(await denied.page.evaluate(url=>fetch(url).then(()=>false,()=>true),secondThumbnail),true,'card removal releases the thumbnail URL');
  assert.equal(await denied.page.getByTestId('skin-profile-card').locator('h2').textContent(),'피부 프로필');
  await denied.page.getByTestId('skin-analysis-result').getByText('피부 분석 결과',{exact:true}).waitFor();
  assert.equal(denied.uploads.length,1);assert.equal(denied.analyses.filter(method=>method==='POST').length,1);
  assert.equal(await denied.page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
  await denied.page.getByTestId('skin-profile-card').screenshot({path:path.join(artifactDir,'aurai-skin-profile-320.png')});assert.deepEqual(denied.errors,[]);results.push('unnamed fallback, denied permission/retry, local album thumbnail retained on retake, replaced/unmounted URLs released, 320px layout, no real external calls');await denied.context.close();

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
   await openSkinTypes(t.page);
   await t.page.locator('[data-testid="skin-type-button"][data-type="dry"]').evaluate(el=>el.click());
   await t.page.locator(`[data-testid="concern-button"][data-type="${concern}"]`).evaluate(el=>el.click());
   await t.page.getByTestId('concern-area-button').first().evaluate(el=>el.click());
   assert.equal(await t.page.getByTestId('concern-area-confirm').count(),0);
   await t.page.getByTestId('skin-camera-card').waitFor();await live(t.page);
   assert.equal(await t.page.getByTestId('skin-photo-flow').count(),1);
   assert.deepEqual(t.errors,[]);await t.context.close();
  }
  results.push('all seven concern surveys auto-confirm card selection and lead to exactly one skin camera');
  const addressed=await setup(browser,{name:'민서님',mode:'mock-devices'});await complete(addressed);await live(addressed.page);
  await addressed.page.getByRole('button',{name:'카메라 닫기',exact:true}).click();await stopped(addressed.page);
  assert.equal(await addressed.page.getByTestId('skin-camera-card').count(),0);
  await addressed.page.getByRole('button',{name:'카메라 열기',exact:true}).click();await live(addressed.page);
  await addressed.page.getByTestId('camera-shutter').evaluate(el=>el.click());await addressed.page.getByTestId('camera-preview').waitFor();
  await addressed.page.getByTestId('camera-use').evaluate(el=>el.click());await addressed.page.getByTestId('skin-profile-card').waitFor();
  assert.equal(await addressed.page.getByTestId('skin-profile-card').locator('h2').textContent(),'민서님의 피부 프로필');
  const style=await addressed.page.getByTestId('skin-profile-photo').evaluate(image=>({filter:getComputedStyle(image).filter,mask:getComputedStyle(image).maskImage}));
  assert.equal(style.filter,'none');assert.ok(style.mask.includes('linear-gradient'));
  await addressed.page.getByTestId('skin-analysis-result').getByText('피부 분석 결과',{exact:true}).waitFor();
  assert.equal(addressed.analyses.filter(method=>method==='POST').length,1);assert.equal(addressed.uploads.length,1);await addressed.context.close();
  results.push('single honorific, close/reopen releases stream, native profile image has edge masks and no color filter');
  results.push('exact three-line greeting, single skin type prompt, original guidance after clicking, type cards wait for the prompt, no duplicate starts, concerns only after type selection');
  fs.writeFileSync(path.join(artifactDir,'aurai-skin-camera-results.json'),JSON.stringify({status:'PASS',url:`${baseUrl}/chat`,results},null,2));console.log(JSON.stringify({status:'PASS',results},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
