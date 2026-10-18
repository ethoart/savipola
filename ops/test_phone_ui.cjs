/* DOM-only flow verification; no browser layout, live reCAPTCHA or SMS claims. Requires jsdom. */
const {JSDOM}=require('jsdom'),fs=require('fs'),path=require('path'),assert=require('assert');
const base=path.resolve(__dirname,'..');
const tick=()=>new Promise(r=>setTimeout(r,15));
(async()=>{
 for(const lang of ['en','si','ta']){
  const dom=new JSDOM('<div id="savipola-app"></div>',{runScripts:'outside-only',url:'https://test.invalid'});
  const w=dom.window,d=w.document,root=d.querySelector('div');w.structuredClone=structuredClone;
  let user=null,sends=0,verified=0,saveFailure=false;const remoteSaved=new Set();
  const data={people:[],products:[{id:42,seller_id:2,crop:'Tomatoes',district:'Dambulla',seller_name:'Farmer',price:200,available_kg:40,grade:'Unverified'}],offers:[],demands:[],drivers:[],deliveries:[],workers:[],jobs:[],stock_events:[],quality_events:[],ai_events:[],ai:{configured:false},price_reference:{}};
  w.SaviPolaRuntime={isPreview:false,preference(){return lang},async request(route,method='GET'){
   if(route==='/runtime-config')return {authMode:'firebase',demoEnabled:false,production:true,savedHarvests:{enabled:true}};
   if(route==='/state')return {...data,me:user};
   if(route==='/auth/me')return {user};
   if(route==='/community/saved-harvests'){if(saveFailure)throw new Error('Unavailable');return {items:[...remoteSaved].map(product_id=>({product_id})),has_more:false};}
   if(route.startsWith('/community/saved-harvests/')){if(saveFailure)throw new Error('Unavailable');const id=Number(route.split('/').at(-1));if(method==='PUT')remoteSaved.add(id);else if(method==='DELETE')remoteSaved.delete(id);return {saved:method==='PUT'};}
   throw new Error('Unexpected API '+route);
  }};
  w.SaviPolaPhone={confirmation:null,reset(){this.confirmation=null},async send(phone,profile,language){assert.equal(language,lang);assert.equal(phone,'0771234567');assert.equal(profile.role,'farmer');assert.equal(profile.name,'Farmer <safe>');this.profile=profile;this.confirmation={};sends++},async confirm(code){assert.equal(code,'123456');verified++;user={id:1,...this.profile,is_demo:0,phone_verified:true};data.people=[user];this.reset();return {user}}};
  for(const file of ['i18n.js','everyday.js','cloud-copy.js','mobile.js'])w.eval(fs.readFileSync(path.join(base,'static',file),'utf8'));
  await tick();const app=root.__app;
  assert(!root.querySelector('[data-action="demo"]'));
  root.querySelector('[data-action="start-registration"]').click();root.querySelector('[data-role="farmer"]').click();
  assert(!root.querySelector('input[type=password]'));
  const set=(name,value)=>{root.querySelector('[name='+name+']').value=value;};
  const submit=()=>root.querySelector('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  set('name','Farmer <safe>');set('phone','0771234567');submit();await tick();assert.equal(sends,0);assert(root.textContent.includes(app.translate('consentNeeded')));
  root.querySelector('[name=consent]').checked=true;submit();await tick();assert.equal(sends,1);assert(root.querySelector('[autocomplete=one-time-code]'));assert(!root.querySelector('[name=phone]'));
  set('otp','123');submit();await tick();assert.equal(verified,0);
  set('otp','123456');submit();await tick();assert.equal(verified,1);assert.equal(app.state().page,'home');assert.equal(root.lang,lang);assert(!root.querySelector('[data-action="sample-chat"]'));
  app.navigate('profile');assert(root.textContent.includes(app.translate('phoneVerified')));assert(root.textContent.includes('Farmer <safe>'));assert(!root.querySelector('safe'));
  app.navigate('market');root.querySelector('[data-action="save-harvest"]').click();await tick();assert(remoteSaved.has(42));assert.equal(root.querySelector('[data-action="save-harvest"]').getAttribute('aria-pressed'),'true');
  root.querySelector('[data-action="saved-filter"]').click();assert(root.textContent.includes(app.translate('savedHarvests')));
  saveFailure=true;root.querySelector('[data-action="save-harvest"]').click();await tick();assert(remoteSaved.has(42));assert.equal(root.querySelector('[data-action="save-harvest"]').getAttribute('aria-pressed'),'true');assert(root.textContent.includes(app.translate('savedUnavailable')));
  saveFailure=false;root.querySelector('[data-action="saved-retry"]').click();await tick();
  await app.boot();app.navigate('market');assert.equal(root.querySelector('[data-action="save-harvest"]').getAttribute('aria-pressed'),'true');
  root.querySelector('[data-action="save-harvest"]').click();await tick();assert(!remoteSaved.has(42));assert(!root.querySelector('[data-action="save-harvest"]'));
  for(const file of ['mobile.js'])for(const m of fs.readFileSync(path.join(base,'static',file),'utf8').matchAll(/\bt\('([^']+)'/g))assert(w.SaviPolaCopy[m[1]],'Missing copy '+m[1]);
  for(const copy of Object.values(w.SaviPolaCopy))assert(copy.length===3&&copy.every(x=>typeof x==='string'&&x.trim()));
  dom.window.close();
 }
 console.log('PASS: Firebase onboarding, consent, OTP validation, verified profile, demo removal saved harvest reload/failure handling and copy coverage in English, Sinhala and Tamil (DOM-only; SMS mocked)');
})().catch(error=>{console.error(error);process.exitCode=1});
