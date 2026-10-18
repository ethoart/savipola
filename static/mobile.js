(()=>{
'use strict';
const root=document.getElementById('savipola-app'),R=window.SaviPolaRuntime,C=window.SaviPolaCopy,L=window.SaviPolaLanguages;
const layout=window.SaviPolaLayout?.(root,R.isPreview);
const languages=['en','si','ta'],locales={en:'en-LK',si:'si-LK',ta:'ta-LK'};
const areas=['Dambulla','Colombo','Kandy','Nuwara Eliya','Anuradhapura','Ampara','Badulla','Batticaloa','Galle','Gampaha','Hambantota','Jaffna','Kalutara','Kegalle','Kilinochchi','Kurunegala','Mannar','Matale','Matara','Monaragala','Mullaitivu','Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya'];
const crops=['Tomatoes','Carrots','Potatoes','Cabbage','Bananas','Beans','Green Chilli','Onions'];
const cropIcons={Tomatoes:'🍅',Carrots:'🥕',Potatoes:'🥔',Cabbage:'🥬',Bananas:'🍌',Beans:'🌿','Green Chilli':'🌶️',Onions:'🧅'};
const icons={home:'house',market:'store',messages:'messages-square',services:'handshake',profile:'user-round'};
const icon=name=>`<i class="sp-icon" data-lucide="${name}" aria-hidden="true"></i>`;
const paintIcons=()=>{if(typeof lucide!=='undefined')lucide.createIcons({attrs:{width:20,height:20,'stroke-width':1.8}});};
const navKeys={home:'navHome',market:'navMarket',messages:'navMessages',services:'navServices',profile:'navProfile'};
const roleGlyph=role=>({farmer:'sprout',buyer:'shopping-basket',worker:'handshake',driver:'truck'}[role]||'sprout');
const avatarText=p=>(p?.name||'').trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const I=window.SaviPolaImages||{};
const ROLE_KEYS={farmer:['sellRole','sellHint','sprout'],buyer:['buyRole','buyHint','shopping-basket'],worker:['workerRole','workerHint','handshake'],driver:['driverRole','driverHint','truck']};
const V={lang:R.preference('language')||'si',page:'welcome',me:null,data:null,sheet:null,category:'all',search:'',service:'transport',threads:[],thread:null,messages:[],chatView:null,source:'en',openOriginal:new Set(),toast:null,district:'all',sort:'latest',registration:{name:'',role:'farmer',district:'Dambulla',phone:'',password:''}};
if(!languages.includes(V.lang))V.lang='en';
let toastTimer=null,chatTimer=null,stopLive=null,connection='syncing',demoCounter=1000,pendingSend=null,focusBack=null;
const demoThreads=[],demoLogs=new Map();
let savedIds=new Set(),savedStatus='idle',savedBusy=new Set(),savedOnly=false;
const savedEnabled=()=>Boolean(!R.isPreview&&R.config?.savedHarvests?.enabled&&V.me&&!isDemo());
const $=id=>root.querySelector('#'+id),e=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const t=(key,lang=V.lang)=>C[key]?C[key][languages.indexOf(lang)]:key;
const known=value=>e(C[value]?t(value):value);
const n=value=>new Intl.NumberFormat(locales[V.lang],{maximumFractionDigits:2}).format(Number(value||0));
const money=value=>new Intl.NumberFormat(locales[V.lang],{style:'currency',currency:'LKR',maximumFractionDigits:0}).format(Number(value||0));
const button=(action,label,kind='',extra='')=>`<button type="button" class="sp-button ${kind} cursor-interaction" data-action="${action}" ${extra}>${label}</button>`;
const languageOptions=selected=>languages.map(code=>`<option value="${code}" ${code===selected?'selected':''}>${L[code]}</option>`).join('');
const field=(key,name,type='text',value='',optional=false)=>`<div class="sp-field"><label for="sp-field-${name}">${t(key)}</label><input id="sp-field-${name}" name="${name}" type="${type}" value="${e(value)}" ${optional?'':'required'} ${name==='name'?'maxlength="90" autocomplete="name"':type==='tel'?'inputmode="tel" autocomplete="tel"':''} ${type==='number'?'min="0.01" step="0.01"':''} ${type==='password'?'minlength="10" autocomplete="current-password"':''}></div>`;
const select=(key,name,options,value)=>`<div class="sp-field"><label for="sp-field-${name}">${t(key)}</label><select id="sp-field-${name}" name="${name}">${options.map(([v,label])=>`<option value="${e(v)}" ${v===value?'selected':''}>${e(label)}</option>`).join('')}</select></div>`;
const textarea=(key,name,value='')=>`<div class="sp-field"><label for="sp-field-${name}">${t(key)}</label><textarea id="sp-field-${name}" name="${name}" maxlength="500">${e(value)}</textarea></div>`;
const areaField=value=>select('area','district',areas.map(a=>[a,t(a)]),value||'Dambulla');
const person=id=>V.data.people.find(p=>p.id===Number(id));
const product=id=>V.data.products.find(p=>p.id===Number(id));
const isDemo=()=>Boolean(R.isPreview||V.me?.is_demo);
const myActionLabel=()=>t(V.me?.role==='farmer'?'startSelling':V.me?.role==='buyer'?'postRequest':'listService');
const roleIcon=role=>({farmer:'🌱',buyer:'🧺',driver:'🚚',worker:'🧑‍🌾'}[role]||'🌱');
const avatar=p=>`<span class="sp-avatar" aria-hidden="true">${e(avatarText(p))||icon('user-round')}</span>`;
const badge=status=>`<span class="sp-pill ${e(status)}">${t(status)}</span>`;
const empty=key=>`<div class="sp-empty"><span>${icon('sprout')}</span>${t(key)}</div>`;
const subheading=key=>`<div class="sp-subpage-title"><button class="sp-icon-button cursor-interaction" data-action="back" aria-label="${t('back')}">${icon('chevron-left')}</button><h1>${t(key)}</h1></div>`;
function errorText(error){
 if(error.message==='CONSENT')return t('consentNeeded');
 if(error.code?.startsWith('auth/'))return t(['auth/invalid-verification-code','auth/code-expired'].includes(error.code)?'otpInvalid':'smsFailed');
 if(error.status===409&&R.config?.authMode==='firebase')return t('phoneJoin');
 if(error.savedHarvests)return t('savedUnavailable');
 if(error.status===422)return t('checkFields');
 if(error.status===429)return t('wait');
 if(error.status===401)return V.page==='login'?t('loginFailed'):t('signInNeeded');
 if(error.status===403)return t('wrongRole');
 if(error.status===409&&V.page==='signup')return t('phoneExists');
 if(/stock|kilograms|available/i.test(error.message))return t('stockShort');
 if(/Vertex|AI|translat/i.test(error.message))return t('aiNeedsCloud');
 return t('actionFailed');
}
function notify(text,error=false){V.toast={text,error};paintToast();clearTimeout(toastTimer);toastTimer=setTimeout(()=>{V.toast=null;paintToast();},5000);}
function paintToast(){const element=$('sp-toast');if(element){element.hidden=!V.toast;element.className='sp-toast'+(V.toast?.error?' error':'');element.textContent=V.toast?.text||'';}}
function closeLive(){if(stopLive)stopLive();stopLive=null;clearInterval(chatTimer);chatTimer=null;}
async function refresh(){V.data=await R.request('/state');if(V.data.me&&!R.isPreview)V.me=V.data.me;render();if(savedEnabled())await loadSaved();}
async function loadSaved(){
 if(!savedEnabled()){savedIds.clear();savedStatus='idle';return;}
 const owner=V.me.id;savedStatus='loading';
 try{const r=await R.request('/community/saved-harvests');if(V.me?.id!==owner)return;savedIds=new Set(r.items.map(i=>i.product_id));savedStatus=r.has_more?'recent':'ready';}
 catch{if(V.me?.id!==owner)return;savedStatus='error';}
 render();
}
async function toggleSaved(id){
 if(!savedEnabled()||savedBusy.has(id))return;
 if(!['ready','recent'].includes(savedStatus)){await loadSaved();return;}
 const owner=V.me.id;savedBusy.add(id);render();
 try{const wasSaved=savedIds.has(id);await R.request('/community/saved-harvests/'+id,wasSaved?'DELETE':'PUT');if(V.me?.id!==owner)return;if(wasSaved)savedIds.delete(id);else savedIds.add(id);notify(t(wasSaved?'harvestRemoved':'harvestSaved'));}
 catch{savedStatus='error';notify(t('savedUnavailable'),true);}
 finally{savedBusy.delete(id);render();}
}
function navigate(page){if(!['signup','login'].includes(page))window.SaviPolaPhone?.reset();closeLive();V.sheet=null;V.page=page;V.search='';render();if(page==='messages')loadThreads();}
function requireRole(role){if(V.me?.role!==role){notify(t('wrongRole'),true);return false;}return true;}
async function changeLanguage(code){
 if(!languages.includes(code))return;
 V.lang=code;R.preference('language',code);
 if(V.me){
  V.me.language=code;
  if(!isDemo())try{const r=await R.request('/community/profile','PATCH',{name:V.me.name,district:V.me.district,language:code,bio:V.me.bio||'',skills:V.me.skills||''});V.me=r.user;}catch(error){notify(errorText(error),true);}
 }
 V.source=code;render();
}
function header(){
 const authPage=['welcome','role','signup','login'].includes(V.page);
 return `<header class="sp-header"><div class="sp-brand"><span class="sp-brand-mark">${icon('sprout')}</span><span class="sp-brand-word">SaviPola<small>GROW. TRADE. TOGETHER.</small></span></div>${!authPage?`<form class="sp-global-search" data-form="search">${icon('search')}<input type="search" name="query" id="${V.page==='market'?'sp-market-search':'sp-global-search'}" placeholder="${t('search')}" aria-label="${t('search')}" value="${e(V.search)}"><button type="submit" class="sp-button cursor-interaction" aria-label="${t('search')}">${icon('arrow-right')}</button></form>`:''}<div class="sp-header-actions">${!authPage?`<button class="sp-help-link cursor-interaction" data-action="help">${icon('circle-help')}${t('help')}</button>`:''}<select class="sp-language cursor-interaction" id="sp-language" aria-label="${t('language')}">${languageOptions(V.lang)}</select>${V.me&&!authPage?`<button class="sp-avatar cursor-interaction" data-action="profile" aria-label="${t('profile')}">${e(avatarText(V.me))}</button>`:''}</div></header>${!authPage?`<nav class="sp-desktop-nav" aria-label="${t('market')}">${['home','market','messages','services','profile'].map(page=>`<button class="cursor-interaction ${V.page===page?'active':''}" data-action="nav" data-page="${page}" ${V.page===page?'aria-current="page"':''}>${icon(icons[page])}${t(page)}</button>`).join('')}<button class="sp-nav-sell cursor-interaction" data-action="start-sell">+ ${myActionLabel()}</button></nav>`:''}`;
}
function nav(){return `<nav class="sp-bottom-nav" aria-label="${t('home')}">${['home','market','messages','services','profile'].map(page=>`<button type="button" class="cursor-interaction ${V.page===page?'active':''}" data-action="nav" data-page="${page}" ${V.page===page?'aria-current="page"':''}>${icon(icons[page])}${t(navKeys[page])}</button>`).join('')}</nav>`;}
function demoBanner(){return `<div class="sp-preview-label"><span>${t(R.isPreview?'localPreview':'demoNotice')}</span>${V.me?.is_demo&&V.me.id<=10?`<select id="sp-demo-profile" aria-label="${t('changeProfile')}">${V.data.people.filter(p=>p.id<=10).map(p=>`<option value="${p.id}" ${p.id===V.me.id?'selected':''}>${e(p.name)}</option>`).join('')}</select>`:''}</div>`;}
function steps(current){return `<div class="sp-step-indicator" aria-label="${t('createProfile')}">${['languageStep','roleStep','detailsStep'].map((key,index)=>`<div class="sp-step ${index===current?'current':''}" ${index===current?'aria-current="step"':''}><span>${index<current?'✓':index+1}</span>${t(key)}</div>`).join('')}</div>`;}
function reviewAccess(){return R.config?.reviewOnly?`<aside class="sp-notice" style="margin-top:20px" aria-label="Evaluation accounts"><h2>Try SaviPola</h2><p>This evaluation prototype uses shared fictional accounts. No SMS is sent. Do not enter personal information.</p><div id="sp-sms-send"></div><div class="sp-hero-buttons"><button type="button" class="sp-button cursor-interaction" data-action="review-signin" data-role="farmer">Try as farmer</button><button type="button" class="sp-button outline cursor-interaction" data-action="review-signin" data-role="buyer">Try as buyer</button></div><p class="sp-field-hint">Example listings, orders and messages are shared with other reviewers.</p></aside>`:'';}
function welcome(){return `<section class="sp-onboarding">${steps(0)}<div class="sp-sprout">${icon('languages')}</div><h1>${t('languageFirst')}</h1><p>${t('languageIntro')}</p><div class="sp-lang-options">${['si','ta','en'].map(code=>`<button type="button" class="cursor-interaction ${V.lang===code?'active':''}" data-action="language" data-language="${code}" aria-pressed="${V.lang===code}"><span><strong lang="${code}">${L[code]}</strong><small>${t(code==='si'?'casualSinhala':code==='ta'?'tamilHint':'englishHint',code)}</small></span><span class="sp-language-check" aria-hidden="true">${V.lang===code?icon('check'):''}</span></button>`).join('')}</div>${R.config?.reviewOnly?reviewAccess():button('start-registration',t('nextStep')+' →','block')}<div class="sp-onboarding-footer"><button class="sp-help-link cursor-interaction" data-action="login">${t('alreadyMember')}</button>${R.config?.demoEnabled!==false?`<button class="sp-help-link cursor-interaction" data-action="demo">${t('exploreWithoutAccount')} →</button>`:''}</div></section>`;}
function roleScreen(){return `<section class="sp-registration">${steps(1)}<button class="sp-inline-back cursor-interaction" data-action="registration-language">${icon('chevron-left')}${t('back')}</button><h1>${t('chooseRole')}</h1><p>${t('roleHint')}</p><div class="sp-role-options">${Object.entries(ROLE_KEYS).map(([role,[title,hint,glyph]])=>`<button type="button" class="sp-role-choice cursor-interaction" data-action="choose-role" data-role="${role}"><span class="sp-category-icon" aria-hidden="true">${icon(glyph)}</span><span><strong>${t(title)}</strong><small>${t(hint)}</small></span><span>${icon('chevron-right')}</span></button>`).join('')}</div><p class="sp-field-hint">${t('savedDetails')}</p></section>`;}
function auth(type){
 if(R.config?.authMode==='firebase')return phoneAuth(type);
 const signup=type==='signup',reg=V.registration;
 return `<section class="sp-registration">${signup?steps(2):''}<button class="sp-inline-back cursor-interaction" data-action="${signup?'registration-role':'registration-language'}">${icon('chevron-left')}${t('back')}</button><div class="sp-auth-head"><h1>${t(signup?'simpleDetails':'signIn')}</h1><p>${t(signup?'fullNameHint':'signInNeeded')}</p></div>${signup?`<div class="sp-chosen-role"><span>${icon(ROLE_KEYS[reg.role][2])} ${t(ROLE_KEYS[reg.role][0])}</span><button class="sp-inline-link cursor-interaction" data-action="registration-role">${t('changeChoice')}</button></div>`:''}${R.isPreview?`<div class="sp-notice">${t('createdDemo')}</div>`:''}<form data-form="${type}" novalidate>${signup?field('fullName','name','text',reg.name)+areaField(reg.district):''}${!R.isPreview?field('phone','phone','tel',reg.phone)+`<p class="sp-field-hint" style="margin:-12px 0 20px">${t('phoneHint')}</p><div class="sp-field"><label for="sp-auth-password">${t('password')}</label><div class="sp-password-wrap"><input id="sp-auth-password" name="password" type="password" minlength="10" maxlength="128" autocomplete="${signup?'new-password':'current-password'}" value="${e(reg.password)}" required><button type="button" class="cursor-interaction" data-action="toggle-password" aria-controls="sp-auth-password" aria-pressed="false">${t('passwordShow')}</button></div><span class="sp-field-hint">${t('passwordHint')}</span></div>`:''}<div id="sp-form-error" class="sp-form-error" role="alert"></div><button type="submit" class="sp-button block cursor-interaction">${t(signup?'createProfile':'signIn')} →</button>${signup&&!R.isPreview?`<p class="sp-auth-note">${t('accountNote')}</p>`:''}</form></section>`;
}
function phoneAuth(type){
 if(R.config?.reviewOnly)return `<section class="sp-registration">${button('registration-language',t('back'),'outline small')}${reviewAccess()}</section>`;
 const signup=type==='signup',pending=Boolean(window.SaviPolaPhone.confirmation),reg=V.registration;
 return `<section class="sp-registration">${signup?steps(2):''}<button class="sp-inline-back cursor-interaction" data-action="registration-language">${icon('chevron-left')}${t('back')}</button><h1>${t(signup?'simpleDetails':'signIn')}</h1><form data-form="${type}" novalidate>${pending?`<p class="sp-field-hint">${t('smsSent')}</p><div class="sp-field"><label for="sp-otp">${t('smsCode')}</label><input id="sp-otp" name="otp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></div>`:`${signup?field('fullName','name','text',reg.name)+areaField(reg.district):''}${field('phone','phone','tel',reg.phone)}<p class="sp-field-hint">${t('phoneHint')}</p><label class="sp-sms-consent"><input name="consent" type="checkbox" value="yes" required><span>${t('smsConsent')} <a href="/privacy" target="_blank" rel="noopener">${t('privacy')}</a></span></label><div id="sp-captcha"></div>`}<div id="sp-form-error" class="sp-form-error" role="alert"></div><button id="sp-sms-send" type="submit" class="sp-button block cursor-interaction">${t(pending?'verifyCode':'sendCode')} →</button>${pending?button('firebase-reset',t('smsRestart'),'outline block','style="margin-top:12px"'):''}</form></section>`;
}
function productCard(p){return `<article class="sp-product"><div class="sp-product-art">${savedEnabled()?`<button type="button" class="sp-save-harvest cursor-interaction" data-action="save-harvest" data-id="${p.id}" aria-label="${t(savedIds.has(p.id)?'removeSavedHarvest':'saveHarvest')}" aria-pressed="${savedIds.has(p.id)}" ${savedBusy.has(p.id)?'disabled':''}>${icon(savedIds.has(p.id)?'bookmark-check':'bookmark')}</button>`:''}${I[p.crop]?`<img src="${I[p.crop]}" alt="${e(t(p.crop))} · ${t('samplePhoto')}" loading="lazy" width="480" height="400">`:`<span class="sp-produce" aria-hidden="true">${cropIcons[p.crop]||'🌾'}</span>`}</div><div class="sp-product-info"><h3>${known(p.crop)}</h3><div class="sp-product-place">${icon('map-pin')}<span>${known(p.district)}<br>${e(p.seller_name)}</span></div><div class="sp-product-price">${money(p.price)} <span>/ ${t('kg')}</span></div><div class="sp-product-stock"><span class="sp-stock-dot" aria-hidden="true"></span>${n(p.available_kg)} ${t('kg')} ${t('available')}</div>${button('batch',t('viewShort')+icon('arrow-up-right'),'soft',`data-id="${p.id}"`)}</div></article>`;}
function categories(){return `<div class="sp-category-grid">${[['market','harvestCategory','vegetables','shopping-basket'],['start-sell',V.me.role==='farmer'?'sellRole':V.me.role==='buyer'?'postRequest':'listService',V.me.role==='farmer'?'listHarvest':V.me.role==='buyer'?'buyHint':'workerHint',roleGlyph(V.me.role)],['work','localWork','workerHint','handshake'],['delivery','transport','driverHint','truck']].map(([action,title,hint,glyph])=>`<button class="sp-category-card cursor-interaction" data-action="${action}"><span class="sp-category-icon" aria-hidden="true">${icon(glyph)}</span><span><strong>${t(title)}</strong><small>${t(hint)}</small></span></button>`).join('')}</div>`;}
function helpBanner(){return `<div class="sp-help-banner"><div class="sp-help-heading">${icon('circle-help')}<div><h3>${t('help')}</h3><p>${t('helpIntro')}</p></div></div>${button('help',t('help'),'outline')}</div>`;}
function home(){const listings=V.data.products.filter(p=>p.available_kg>0);return `<div class="sp-welcome-line"><div><h1>${t('hello')}, ${e(V.me.name.split(' ')[0])}</h1><p class="sp-location">${icon('map-pin')}${known(V.me.district)} · ${t('nearby')}</p></div><button class="sp-inline-link cursor-interaction" data-action="${R.config?.demoEnabled===false?'messages':'sample-chat'}">${icon('languages')}${t('speakOwn')}</button></div><section class="sp-market-hero"><div class="sp-hero-copy"><div class="sp-overline">${icon('sprout')}${t('communityEyebrow')}</div><h2>${t('marketHero')}</h2><p>${t('marketHeroBody')}</p><div class="sp-hero-buttons">${button('market',t('browseHarvest')+icon('arrow-right'))}${button('start-sell',myActionLabel(),'outline')}</div></div><img class="sp-hero-photo" src="${I.hero}" alt="${t('samplePhoto')}" width="600" height="400"></section><h2 class="sp-intent-title">${t('todayAction')}</h2>${categories()}<div class="sp-section-head"><h2>${t('fresh')}</h2><button class="sp-inline-link cursor-interaction" data-action="market">${t('seeAll')} →</button></div><div class="sp-grid">${listings.slice(0,4).map(productCard).join('')}</div><p class="sp-listing-caption">${R.config?.demoEnabled===false?'':t('marketSample')+' · '}${t('samplePhoto')}</p>${helpBanner()}<div class="sp-simple-strip"><span>${t('clearSteps')}</span><button class="sp-inline-link cursor-interaction" data-action="demands">${t('buyersNeed')} →</button><button class="sp-inline-link cursor-interaction" data-action="signup">${t('createProfile')} →</button></div>`;}
const ALIASES={Tomatoes:'tomato tomatoes thakkali takkali thakali තක්කාලි தக்காளி',Carrots:'carrot carrots karat කැරට් கரட்',Potatoes:'potato potatoes ala අල உருளைக்கிழங்கு',Cabbage:'cabbage gova gowa ගෝවා முட்டைக்கோஸ்',Bananas:'banana bananas kesel කෙසෙල් வாழைப்பழம்',Beans:'beans bonchi බෝංචි அவரை','Green Chilli':'chilli chili miris amu miris අමු මිරිස් மிளகாய்',Onions:'onion onions lunu luunu ළූණු ලූනු வெங்காயம்'};
const normalized=value=>String(value).normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
function marketListings(){const query=normalized(V.search).split(' ').filter(Boolean);let list=V.data.products.filter(p=>(savedOnly?savedIds.has(p.id):p.available_kg>0)&&(V.category==='all'||(V.category==='fruits'?p.crop==='Bananas':p.crop!=='Bananas'))&&(V.district==='all'||p.district===V.district)&&query.every(word=>normalized([p.crop,t(p.crop),ALIASES[p.crop]||'',p.seller_name,p.district,t(p.district)].join(' ')).includes(word)));return list.sort(V.sort==='price'?(a,b)=>a.price-b.price:V.sort==='stock'?(a,b)=>b.available_kg-a.available_kg:(a,b)=>b.id-a.id);}
function market(){const listings=marketListings();return `<h1>${t(savedOnly?'savedHarvests':'market')}</h1>${savedEnabled()?`<div class="sp-saved-tools">${button('saved-filter',icon('bookmark')+t(savedOnly?'allHarvests':'savedHarvests'),'outline small',`aria-pressed="${savedOnly}"`)}${savedStatus==='loading'?`<p role="status">${t('savedLoading')}</p>`:savedStatus==='error'?`<p role="status">${t('savedUnavailable')}</p>${button('saved-retry',t('retry'),'outline small')}`:savedStatus==='recent'?`<p>${t('savedRecent')}</p>`:''}</div>`:''}<p class="sp-muted" style="margin-top:8px">${t('trySearch')}</p><div class="sp-filter-summary"><div class="sp-chips" style="margin:0">${['all','vegetables','fruits'].map(key=>`<button class="sp-chip cursor-interaction ${V.category===key?'active':''}" data-action="category" data-value="${key}" aria-pressed="${V.category===key}">${t(key)}</button>`).join('')}</div><div class="sp-filter-tools">${button('filters',icon('sliders-horizontal')+t('filters'),'outline small')}${V.district!=='all'||V.sort!=='latest'||V.category!=='all'?button('clear-filters',t('clearFilters'),'soft small'):''}</div></div><p class="sp-result-heading" id="sp-results-count" aria-live="polite">${n(listings.length)} ${t('results')}${V.district!=='all'?' · '+known(V.district):''}</p><div class="sp-grid" id="sp-product-grid" style="margin-top:15px">${listings.length?listings.map(productCard).join(''):empty('empty')}</div><p class="sp-listing-caption">${t('samplePhoto')}</p>`;}
function updateSearch(value){V.search=value;const grid=$('sp-product-grid');if(grid){const list=marketListings();grid.innerHTML=list.length?list.map(productCard).join(''):empty('empty');$('sp-results-count').textContent=n(list.length)+' '+t('results')+(V.district!=='all'?' · '+t(V.district):'');paintIcons();}}

function profile(){const p=V.me,own=V.data.products.filter(x=>x.seller_id===p.id),done=V.data.offers.filter(o=>o.status==='Completed'&&(o.buyer_id===p.id||o.seller_id===p.id)).length,w=V.data.workers.find(w=>w.person_id===p.id);return `<div class="sp-profile-hero">${avatar(p)}<h1>${e(p.name)}</h1><p class="sp-muted" style="margin-top:6px">${t(p.role)} · ${known(p.district)}</p><p class="sp-meta">${L[p.language||V.lang]}${isDemo()?' · '+t('demo'):''}</p></div><div class="sp-profile-stats"><div><strong>${own.length}</strong><span>${t('myHarvest')}</span></div><div><strong>${done}</strong><span>${t('Completed')}</span></div><div><strong>${w?.rating?'★ '+n(w.rating):'—'}</strong><span>${t('rating')}</span></div></div>${p.bio?`<div class="sp-card"><p class="sp-muted">${e(p.bio)}</p>${p.skills?`<p class="sp-meta" style="margin-top:8px">${e(p.skills)}</p>`:''}</div>`:''}${button('edit',t('editProfile'),'outline block')}<div class="sp-menu">${[...(p.role==='farmer'?[['inventory','myHarvest']]:[]),['orders','orders'],['jobs','myJobs'],...(['worker','driver'].includes(p.role)?[['service','listService']]:[]),['demands','buyersNeed']].map(([action,key])=>`<button type="button" class="cursor-interaction" data-action="${action}"><span class="sp-menu-label">${icon({inventory:'wheat',orders:'receipt-text',jobs:'briefcase-business',service:'badge-plus',demands:'clipboard-list'}[action])}${t(key)}</span>${icon('chevron-right')}</button>`).join('')}</div>${isDemo()?button('signup',t('createProfile'),'block'):`<p class="sp-meta">${t(p.phone_verified?'phoneVerified':'phoneUnverified')}</p>${button('logout',t('logout'),'danger block','style="margin-top:12px"')}`}`;}
function requestCard(d){return `<article class="sp-card"><div class="sp-row"><span class="sp-pill">${t('buyer')}</span><span class="sp-meta">${known(d.district)}</span></div><h3>${known(d.crop)} · ${n(d.qty)} ${t('kg')}</h3><p class="sp-meta">${e(d.buyer_name)} · ${t('maxPrice')} ${money(d.max_price)}</p><div class="sp-actions">${button('matches',t('findSuppliers'),'soft',`data-id="${d.id}"`)}</div></article>`;}
function demands(){return subheading('buyersNeed')+`<div class="sp-section-head"><h2>${t('buyersNeed')}</h2>${button('request','+ '+t('postRequest'),'small')}</div><div class="sp-stack">${V.data.demands.map(requestCard).join('')}</div>`;}
function inventory(){const listings=V.data.products.filter(p=>p.seller_id===V.me.id);return subheading('myHarvest')+button('listing','+ '+t('listHarvest'),'block')+`<div class="sp-stack" style="margin-top:18px">${listings.map(p=>`<article class="sp-card"><div class="sp-row"><h3>${cropIcons[p.crop]||'🌾'} ${known(p.crop)}</h3><span class="sp-meta">${money(p.price)} / ${t('kg')}</span></div><div class="sp-volume"><span class="available" style="width:${p.available_kg/p.total_kg*100}%"></span><span class="reserved" style="width:${p.reserved_kg/p.total_kg*100}%"></span><span class="sold" style="width:${p.sold_kg/p.total_kg*100}%"></span></div><div class="sp-volume-labels"><span>${n(p.available_kg)} ${t('available')}</span><span>${n(p.reserved_kg)} ${t('reserved')}</span><span>${n(p.sold_kg)} ${t('sold')}</span></div><div class="sp-actions">${button('restock',t('addStock'),'soft',`data-id="${p.id}"`)}${button('quality',t('quality'),'outline',`data-id="${p.id}"`)}</div></article>`).join('')||empty('empty')}</div>`;}
function orders(){const items=V.data.offers.filter(o=>o.buyer_id===V.me.id||o.seller_id===V.me.id);return subheading('orders')+`<div class="sp-stack">${items.map(o=>`<article class="sp-card"><div class="sp-row">${badge(o.status)}<span class="sp-meta">#${o.id}</span></div><h3>${known(o.crop)} · ${n(o.qty)} ${t('kg')}</h3><p class="sp-meta">${e(o.buyer_name)} → ${e(o.seller_name)}</p><p class="sp-price" style="margin-top:10px">${money(o.qty*o.price)}</p><div class="sp-actions">${o.status==='Pending'&&o.seller_id===V.me.id?button('trade-accept',t('accept'),'',`data-id="${o.id}"`)+button('trade-reject',t('reject'),'outline',`data-id="${o.id}"`):''}${o.status==='Accepted'?button('trade-complete',t('fulfil'),'soft',`data-id="${o.id}"`):''}${o.status==='Accepted'&&o.buyer_id===V.me.id&&!V.data.deliveries.some(d=>d.offer_id===o.id)?button('transport-order',t('bookTransport'),'outline',`data-id="${o.id}"`):''}</div></article>`).join('')||empty('empty')}</div>`;}
function services(){return `<h1>${t('services')}</h1><div class="sp-chips">${['transport','localWork'].map(key=>`<button class="sp-chip cursor-interaction ${V.service===key?'active':''}" data-action="service-tab" data-value="${key}">${t(key)}</button>`).join('')}</div><div class="sp-stack">${V.service==='transport'?V.data.drivers.map(d=>`<article class="sp-card"><div class="sp-row">${icon('truck')}<span class="sp-pill">★ ${n(d.rating)}</span></div><h3>${e(d.name)}</h3><p class="sp-meta">${known(d.vehicle)} · ${known(d.district)}</p><div class="sp-divider"></div><p class="sp-meta">${t('capacity')}: ${n(d.capacity)} ${t('kg')}</p><p class="sp-price" style="margin:8px 0 14px">${money(d.base_fee)} <small class="sp-meta">+ ${money(d.per_km)} ${t('perKm')}</small></p>${button('transport',t('bookTransport'),'soft block',`data-id="${d.id}"`)}</article>`).join(''):V.data.workers.map(w=>`<article class="sp-card"><div class="sp-row">${avatar(person(w.person_id))}<span class="sp-pill">★ ${w.rating?n(w.rating):'—'}</span></div><h3>${e(w.name)}</h3><p class="sp-meta">${known(w.skill)} · ${known(w.district)}</p><p class="sp-meta">${n(w.completed)} ${t('jobsDone')}</p><div class="sp-row wrap" style="margin-top:17px"><p class="sp-price">${money(w.rate)} <small class="sp-meta">${t('perDay')}</small></p>${button('job',t('bookWorker'),'soft',`data-id="${w.id}"`)}</div></article>`).join('')}</div>`;}
function jobs(){const items=V.data.jobs.filter(j=>j.buyer_id===V.me.id||V.data.workers.some(w=>w.id===j.worker_id&&w.person_id===V.me.id));return subheading('myJobs')+`<div class="sp-stack">${items.map(j=>`<article class="sp-card">${badge(j.status)}<h3>${e(j.worker_name)}</h3><p class="sp-meta">${e(j.description)}</p><p class="sp-price" style="margin-top:10px">${money(j.price)}</p>${j.rating?`<p class="sp-meta">★ ${j.rating} · ${e(j.review)}</p>`:''}<div class="sp-actions">${j.buyer_id===V.me.id&&j.status==='Booked'?button('job-complete',t('completeJob'),'soft',`data-id="${j.id}"`):''}${j.buyer_id===V.me.id&&j.status==='Completed'&&!j.rating?button('review',t('review'),'soft',`data-id="${j.id}"`):''}</div></article>`).join('')||empty('empty')}</div>`;}
function threadList(){return `<div class="sp-section-head" style="margin-top:5px"><div><h1>${t('messages')}</h1><p class="sp-muted" style="margin-top:7px">${t('p2p')}</p></div><button class="sp-icon-button cursor-interaction" data-action="people" aria-label="${t('newChat')}">${icon('square-pen')}</button></div>${isDemo()?`<div class="sp-notice">${t('sampleChat')}</div>`:''}<div>${V.threads.map(c=>`<button class="sp-conversation-row cursor-interaction" data-action="thread" data-id="${c.id}">${avatar(c.peer)}<span class="sp-conversation-copy"><strong>${e(c.peer.name)}</strong><p>${c.last_message?e(c.last_message.text):t('newChat')}</p></span><span class="sp-language-pair">${L[V.me.language||V.lang]}<br>↔ ${L[c.peer.language||'si']}</span></button>`).join('')||empty('chatEmpty')}</div><div class="sp-notice">${t('noAiGuess')}</div>`;}
const PHRASES={
 hello:{en:'Hello! The tomatoes are still available.',si:'ආයුබෝවන්! තක්කාලි තව තියෙනවා.',ta:'வணக்கம்! தக்காளி இன்னும் கிடைக்கிறது.'},
 negotiate:{en:'Can I buy 40 kg at LKR 240 per kg?',si:'kg එක LKR 240ට, kg 40ක් ගන්න පුළුවන්ද?',ta:'கிலோவுக்கு LKR 240 வீதம் 40 கிலோ வாங்கலாமா?'},
 reply:{en:'Yes, I can supply 40 kg. Please tell me the pickup time.',si:'ඔව්, kg 40ක් දෙන්න පුළුවන්. Pickup වෙලාව කියන්න.',ta:'ஆம், 40 கிலோ வழங்க முடியும். எடுத்துச் செல்லும் நேரத்தைச் சொல்லுங்கள்.'},
 availability:{en:'Is this harvest still available?',si:'මේ අස්වැන්න තව තියෙනවද?',ta:'இந்த அறுவடை இன்னும் கிடைக்கிறதா?'},
 pickup:{en:'When can we arrange pickup?',si:'Pickup එක කවදාටද දාගන්නේ?',ta:'எப்போது எடுத்துச் செல்ல ஏற்பாடு செய்யலாம்?'}
};
function sampleMessage(sender,key,language){return {id:++demoCounter,sender_id:sender,text:PHRASES[key][language],source_language:language,created:Date.now()/1000,examples:PHRASES[key],sample:true};}
function sampleThread(peer,pid){let c=demoThreads.find(x=>x.owner===V.me.id&&x.peer.id===peer.id&&x.product_id===pid);if(!c){c={id:-(demoThreads.length+1),owner:V.me.id,peer:structuredClone(peer),self:structuredClone(V.me),product_id:pid,sample:true};demoThreads.unshift(c);demoLogs.set(c.id,[sampleMessage(peer.id,'hello',peer.language||'si'),sampleMessage(V.me.id,'negotiate',V.me.language||V.lang),sampleMessage(peer.id,'reply',peer.language||'si')]);}return c;}
async function loadThreads(){
 const owner=V.me?.id;if(!owner)return;
 try{let liveThreads=[];if(!isDemo())liveThreads=(await R.request('/chat/conversations')).conversations;if(V.me?.id!==owner)return;V.threads=[...liveThreads,...demoThreads.filter(c=>c.owner===owner).map(c=>({...c,last_message:demoLogs.get(c.id).at(-1)}))];if(V.page==='messages')render();}catch(error){if(V.me?.id===owner)notify(errorText(error),true);}
}
async function openPeer(uid,pid=null){
 const peer=person(uid);if(!peer||peer.id===V.me.id)return;
 try{
  let c;
  if(isDemo()||peer.is_demo)c=sampleThread(peer,pid);
  else {const result=await R.request('/chat/conversations','POST',{peer_id:peer.id,product_id:pid});c={...result.conversation,peer:result.peer};}
  await openThread(c);
 }catch(error){notify(errorText(error),true);}
}
function viewer(){return V.thread?.sample&&V.chatView===V.thread.peer.id?V.thread.peer:V.me;}
function recipient(){return viewer().id===V.me.id?V.thread.peer:V.me;}
async function openThread(c){
 closeLive();V.sheet=null;V.thread=c;V.chatView=V.me.id;V.source=V.me.language||V.lang;V.page='chat';V.messages=c.sample?demoLogs.get(c.id):[];connection=c.sample?'demo':'syncing';
 if(!c.sample){await syncMessages();stopLive=R.live(c.id,syncMessages,status=>{connection=status;const element=$('sp-chat-status');if(element)element.textContent=t(status);});chatTimer=setInterval(()=>{if(document.visibilityState!=='hidden')syncMessages();},3000);}
 render();
}
async function syncMessages(){
 if(V.page!=='chat'||!V.thread||V.thread.sample)return;
 const cid=V.thread.id;
 try{const r=await R.request('/chat/conversations/'+cid+'/messages');if(V.thread?.id!==cid)return;V.messages=r.messages;V.thread.peer=r.peer;paintMessages();}catch(error){if(error.status===401){closeLive();notify(t('signInNeeded'),true);}else{connection='offline';const element=$('sp-chat-status');if(element)element.textContent=t('offline');}}
}
function translationFor(m){const target=viewer().language||V.lang;if(m.source_language===target)return null;if(m.examples)return {status:'sample',text:m.examples[target]};return m.translation;}
function messageMarkup(m){
 const mine=m.sender_id===viewer().id,tr=translationFor(m),needed=!mine&&m.source_language!==(viewer().language||V.lang),ready=needed&&tr&&['ready','sample'].includes(tr.status),text=ready?tr.text:m.text;
 const date=new Intl.DateTimeFormat(locales[V.lang],{hour:'2-digit',minute:'2-digit'}).format(new Date(m.created*1000));
 return `<article class="sp-message ${mine?'mine':''}"><div class="sp-bubble" lang="${ready?(viewer().language||V.lang):m.source_language}">${e(text)}${V.openOriginal.has(m.id)&&ready?`<div class="sp-message-original" lang="${m.source_language}">${e(m.text)}</div>`:''}</div><div class="sp-message-meta"><span>${date}</span>${ready?`<span>· ${t(tr.status==='sample'?'sampleTranslation':'translated')} · ${L[viewer().language||V.lang]}</span>`:needed?`<span>· ${t(tr?.status==='pending'?'translating':'translationUnavailable')}</span>`:''}</div>${ready?`<button type="button" class="sp-message-toggle cursor-interaction" data-action="original" data-id="${m.id}">${t(V.openOriginal.has(m.id)?'hideOriginal':'original')}</button>`:needed&&!V.thread.sample&&tr?.status!=='pending'?`<button class="sp-message-toggle cursor-interaction" data-action="retry" data-id="${m.id}">${t('retry')}</button>`:''}</article>`;
}
function paintMessages(){const element=$('sp-chat-log');if(!element)return;const atEnd=element.scrollHeight-element.scrollTop-element.clientHeight<60;element.innerHTML=V.messages.map(messageMarkup).join('');paintIcons();if(atEnd)element.scrollTop=element.scrollHeight;}
function chatScreen(){const peer=recipient(),c=V.thread,p=c.product_id?product(c.product_id):null;return `<section class="sp-chat-page"><div class="sp-chat-head"><button class="sp-icon-button cursor-interaction" data-action="messages" aria-label="${t('back')}">${icon('chevron-left')}</button>${avatar(peer)}<div style="flex:1;min-width:0"><strong>${e(peer.name)}</strong><small id="sp-chat-status">${t(c.sample?'sampleChat':connection)}</small></div></div><div class="sp-chat-top">${L[viewer().language||V.lang]} ↔ ${L[peer.language||'si']} · ${t('translationOn')}</div>${c.sample?`<div class="sp-chat-preview-select"><label for="sp-chat-view">${t('viewAs')}</label><select id="sp-chat-view"><option value="${V.me.id}" ${viewer().id===V.me.id?'selected':''}>${e(V.me.name)} · ${L[V.me.language||V.lang]}</option><option value="${c.peer.id}" ${viewer().id===c.peer.id?'selected':''}>${e(c.peer.name)} · ${L[c.peer.language||'si']}</option></select></div>`:''}${p?`<div class="sp-chat-context"><span>${cropIcons[p.crop]||'🌾'} ${known(p.crop)} · ${money(p.price)} / ${t('kg')}</span>${button('offer',t('makeOffer'),'small soft',`data-id="${p.id}"`)}</div>`:''}<div class="sp-chat-log" id="sp-chat-log" aria-live="polite">${V.messages.map(messageMarkup).join('')}</div><form id="sp-chat-form" class="sp-chat-compose" data-form="message"><div class="sp-chips">${['availability','negotiate','pickup'].map(intent=>`<button type="button" class="sp-chip cursor-interaction" data-action="phrase" data-value="${intent}">${t(intent==='availability'?'availableQuestion':intent)}</button>`).join('')}</div><div class="sp-compose-row"><textarea id="sp-message" lang="${V.source}" name="text" maxlength="2000" rows="1" placeholder="${t('speakOwn')}" aria-label="${t('speakOwn')}" required></textarea><button type="submit" class="sp-button cursor-interaction">${t('send')}</button></div><div class="sp-compose-meta"><button type="button" class="sp-inline-link cursor-interaction" data-action="assist">${icon('sparkles')} ${t(c.sample?'sampleAssist':'aiAssist')}</button><select id="sp-source-language" aria-label="${t('language')}">${languageOptions(V.source)}</select></div></form></section>`;}
function registrationLayout(content){return `<div class="sp-auth-layout"><aside class="sp-auth-story"><img src="${I.hero}" alt="${t('samplePhoto')}" width="600" height="400"><div class="sp-overline">${icon('sprout')}${t('communityEyebrow')}</div><h2>${t('registrationStory')}</h2><p>${t('marketHeroBody')}</p><ul class="sp-auth-benefits">${[['languages','benefitLanguages'],['handshake','benefitDirect'],['map-pin','benefitLocal']].map(([glyph,key])=>`<li>${icon(glyph)}${t(key)}</li>`).join('')}</ul></aside>${content}</div>`;}
function render(){
 if(!V.data)return;
 root.lang=V.lang;root.dataset.page=V.page;if(!R.isPreview)document.documentElement.lang=V.lang;root.dataset.auth=String(['welcome','role','signup','login'].includes(V.page));
 const authPage=['welcome','role','signup','login'].includes(V.page),chat=V.page==='chat'&&V.thread;
 const screens={home,market,profile,orders,inventory,services,jobs,demands,messages:threadList};
 const main=V.page==='welcome'?welcome():V.page==='role'?roleScreen():['signup','login'].includes(V.page)?auth(V.page):chat?chatScreen():`<main class="sp-content" ${V.sheet?'inert':''}>${(screens[V.page]||home)()}</main>`;
 root.innerHTML=header()+(R.config?.reviewOnly?'<aside class="sp-preview-label">Evaluation prototype · Shared fictional accounts and example data · Please do not enter personal information.</aside>':'')+((!authPage&&isDemo())?demoBanner():'')+`<div id="sp-toast" role="status" aria-live="polite" hidden></div>`+(authPage?registrationLayout(main):main)+(!authPage&&!chat?nav():'')+(V.sheet?sheetMarkup():'');
 root.querySelectorAll('.sp-header,.sp-desktop-nav,.sp-bottom-nav,.sp-preview-label').forEach(el=>el.inert=Boolean(V.sheet));
 paintToast();paintIcons();layout?.refresh();
 if(V.sheet)root.querySelector('.sp-sheet input,.sp-sheet select,.sp-sheet textarea,.sp-sheet button[data-action="close-sheet"]')?.focus({preventScroll:true});
}
function showSheet(kind,id,extra={}){const focused=document.activeElement?.closest('[data-action]');focusBack=focused?{action:focused.dataset.action,id:focused.dataset.id}:null;V.sheet={kind,id,...extra};render();}
function closeSheet(){V.sheet=null;render();if(focusBack){const controls=[...root.querySelectorAll('[data-action]')];controls.find(el=>el.dataset.action===focusBack.action&&el.dataset.id===focusBack.id)?.focus({preventScroll:true});}focusBack=null;}
function sheetMarkup(){
 const s=V.sheet,p=product(s.id),w=V.data.workers.find(w=>w.id===s.id),d=V.data.drivers.find(d=>d.id===s.id),o=V.data.offers.find(o=>o.id===s.id);
 let titleKey=s.kind,body='',submitKey='save',form=true;
 if(s.kind==='help'){
  form=false;titleKey='help';body=`<div class="sp-help-steps">${['helpBuy','helpSell','helpWork','helpChat'].map((key,i)=>`<div class="sp-help-step"><strong>${i+1}.</strong> ${t(key)}</div>`).join('')}</div>`;
 }else if(s.kind==='filters'){
  titleKey='filters';submitKey='applyFilters';body=select('districtFilter','filter_district',[['all',t('allAreas')],...areas.map(a=>[a,t(a)])],V.district)+select('sortBy','sort',[['latest',t('recommended')],['price',t('lowPrice')],['stock',t('highStock')]],V.sort);
 }else if(s.kind==='batch'){
  form=false;titleKey='viewBatch';body=`<div class="sp-sheet-produce">${I[p.crop]?`<img src="${I[p.crop]}" alt="${e(t(p.crop))}">`:cropIcons[p.crop]||'🌾'}</div><p class="sp-listing-caption">${t('samplePhoto')}</p><div class="sp-row"><div><h2>${known(p.crop)}</h2><p class="sp-meta">${e(p.seller_name)} · ${known(p.district)}</p></div><span class="sp-price">${money(p.price)}</span></div><div class="sp-divider"></div><p class="sp-meta">${n(p.available_kg)} ${t('kg')} ${t('available')}<br>${t('selfReported')}: ${e(p.grade)}</p><div class="sp-actions">${button('peer',t('chat'),'',`data-id="${p.seller_id}" data-product="${p.id}"`)}${V.me.role==='buyer'?button('offer',t('makeOffer'),'outline',`data-id="${p.id}"`):''}</div>`;
 }else if(s.kind==='offer'){
  titleKey='makeOffer';submitKey='sendOffer';body=`<div class="sp-notice">${known(p.crop)} · ${e(p.seller_name)} · ${n(p.available_kg)} ${t('kg')}</div><div class="sp-two-fields">${field('quantity','qty','number',Math.min(40,p.available_kg))}${field('price','price','number',p.price)}</div><div class="sp-offer-summary"><span>${t('offerTotal')}</span><output id="sp-offer-total">${money(Math.min(40,p.available_kg)*p.price)}</output></div><p class="sp-meta">${t('offerConsent')}</p>`;
 }else if(s.kind==='edit'){
  titleKey='editProfile';submitKey='saveProfile';body=field('fullName','name','text',V.me.name)+areaField(V.me.district)+select('language','language',languages.map(l=>[l,L[l]]),V.me.language||V.lang)+textarea('bio','bio',V.me.bio||'')+field('skills','skills','text',V.me.skills||'',true);
 }else if(s.kind==='listing'){
  titleKey='listHarvest';body=select('crop','crop',crops.map(c=>[c,t(c)]),'Tomatoes')+`<div class="sp-two-fields">${field('quantity','qty','number',150)}${field('askingPrice','price','number',250)}</div>`+areaField(V.me.district)+field('harvested','harvested','date',V.data.today);
 }else if(s.kind==='restock'){
  titleKey='addStock';body=field('quantity','qty','number',100);
 }else if(s.kind==='quality'){
  titleKey='quality';body=select('freshness','freshness',[1,2,3,4,5].map(n=>[String(n),String(n)]),'5')+select('defects','defects',[0,1,2,3,4,5].map(n=>[String(n),String(n)]),'1')+select('handling','handling',[1,2,3,4,5].map(n=>[String(n),String(n)]),'4')+textarea('note','note')+`<p class="sp-meta">${t('qualityCaution')}</p>`;
 }else if(s.kind==='request'){
  titleKey='postRequest';body=select('crop','crop',crops.map(c=>[c,t(c)]),'Tomatoes')+`<div class="sp-two-fields">${field('quantity','qty','number',250)}${field('maxPrice','max_price','number',265)}</div>`+areaField(V.me.district);
 }else if(s.kind==='matches'){
  titleKey='findSuppliers';form=false;body=`<div class="sp-notice">${t('proposed')}<br>${n(s.plan.covered_kg)} / ${n(s.plan.requested_kg)} ${t('kg')} · ${t('shortfall')}: ${n(s.plan.shortfall_kg)}<br>${t('offerTotal')}: ${money(s.plan.estimated_goods_lkr)}</div><div class="sp-stack">${s.plan.allocations.map(a=>`<div class="sp-card"><h3>${e(a.seller)}</h3><p class="sp-meta">${n(a.qty)} ${t('kg')} · ${money(a.price)} / ${t('kg')}</p>${button('offer',t('makeOffer'),'soft block',`data-id="${a.product_id}" style="margin-top:12px"`)}</div>`).join('')||empty('empty')}</div>`;
 }else if(s.kind==='transport'){
  titleKey='bookTransport';const accepted=V.data.offers.filter(o=>o.status==='Accepted'&&o.buyer_id===V.me.id&&!V.data.deliveries.some(x=>x.offer_id===o.id));body=select('chooseOrder','offer_id',accepted.map(o=>[String(o.id),t(o.crop)+' · '+n(o.qty)+' '+t('kg')]),s.offerId?String(s.offerId):String(accepted[0]?.id))+select('vehicle','driver_id',V.data.drivers.map(d=>[String(d.id),d.name+' · '+t(d.vehicle)]),String(s.id||V.data.drivers[0]?.id))+field('tripKm','distance_km','number',50)+`<p class="sp-meta">${t('freightNotice')}</p>`;if(!accepted.length)body+=`<p class="sp-form-error">${t('chooseOrder')}</p>`;
 }else if(s.kind==='job'){
  titleKey='bookWorker';body=`<div class="sp-notice">${e(w.name)} · ${money(w.rate)} ${t('perDay')}</div>`+textarea('jobDetails','description');
 }else if(s.kind==='review'){
  titleKey='review';body=select('rating','rating',[5,4,3,2,1].map(n=>[String(n),'★'.repeat(n)]),'5')+textarea('feedback','review');
 }else if(s.kind==='service'){
  titleKey='listService';body=V.me.role==='driver'?field('vehicle','vehicle')+field('capacity','capacity','number',1000)+areaField(V.me.district)+field('baseFee','base_fee','number',1500)+field('perKm','per_km','number',55):field('skill','skill')+areaField(V.me.district)+field('rate','rate','number',3500)+textarea('bio','bio');
 }else if(s.kind==='people'){
  titleKey='findPeople';form=false;body=`<div class="sp-stack">${V.data.people.filter(p=>p.id!==V.me.id).sort((a,b)=>(a.is_demo||0)-(b.is_demo||0)).map(p=>`<button type="button" class="sp-conversation-row cursor-interaction" data-action="peer" data-id="${p.id}">${avatar(p)}<span class="sp-conversation-copy"><strong>${e(p.name)}</strong><p>${t(p.role)} · ${known(p.district)}${p.is_demo?' · '+t('demo'):''}</p></span><span class="sp-language-pair">${L[p.language||'en']}</span></button>`).join('')}</div>`;
 }else if(s.kind==='assist'){
  titleKey=V.thread.sample?'sampleAssist':'aiAssist';body=select('aiAssist','intent',['availability','negotiate','pickup'].map(k=>[k,t(k==='availability'?'availableQuestion':k)]),'availability')+`<p class="sp-meta">${t('aiDraftNotice')}</p>`;
 }
 return `<div class="sp-sheet-backdrop"><section class="sp-sheet" role="dialog" aria-modal="true" aria-label="${t(titleKey)}"><div class="sp-sheet-handle"></div><div class="sp-sheet-head"><h2>${t(titleKey)}</h2><button class="sp-icon-button cursor-interaction" data-action="close-sheet" aria-label="${t('close')}">${icon('x')}</button></div>${form?`<form data-form="${s.kind}" data-id="${s.id||''}">${body}<div id="sp-form-error" class="sp-form-error" role="alert"></div><button class="sp-button block cursor-interaction" type="submit">${t(submitKey)}</button></form>`:body}</section></div>`;
}
async function submit(event){
 const form=event.target.closest('form[data-form]');if(!form)return;event.preventDefault();
 const kind=form.dataset.form,id=Number(form.dataset.id),data=Object.fromEntries(new FormData(form));
 const submitButton=form.querySelector('[type="submit"]');if(submitButton)submitButton.disabled=true;
 const numeric=key=>Number(data[key]);
 try{
  if(kind==='search'){V.search=String(data.query||'');closeLive();V.page='market';V.sheet=null;render();return;}
  if(kind==='filters'){V.district=data.filter_district;V.sort=data.sort;V.sheet=null;render();return;}
  if(kind==='message'){
   const text=String(data.text||'').trim();if(!text)return;
   if(V.thread.sample){
    const example=Object.values(PHRASES).find(p=>Object.values(p).includes(text));
    const m={id:++demoCounter,sender_id:viewer().id,text,source_language:V.source,created:Date.now()/1000,sample:true,examples:example||null};
    demoLogs.get(V.thread.id).push(m);V.messages=demoLogs.get(V.thread.id);$('sp-message').value='';paintMessages();
   }else{
    if(!pendingSend||pendingSend.cid!==V.thread.id||pendingSend.text!==text||pendingSend.source!==V.source)pendingSend={cid:V.thread.id,text,source:V.source,id:globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)};
    const clientId=pendingSend.id;
    await R.request('/chat/conversations/'+V.thread.id+'/messages','POST',{text,source_language:V.source,client_id:clientId});pendingSend=null;$('sp-message').value='';await syncMessages();
   }
   return;
  }
  if(['signup','login'].includes(kind)){
   if(R.config?.authMode==='firebase'){
    const phone=window.SaviPolaPhone;
    if(!phone.confirmation){
     if(!/^(?:0|\+94)7\d{8}$/.test(String(data.phone||'').replace(/[\s()-]/g,'')))throw new Error('LOCAL_PHONE');
     if(kind==='signup'&&(String(data.name||'').trim().length<2||!data.district))throw new Error('LOCAL_FIELDS');
     if(data.consent!=='yes')throw new Error('CONSENT');
     await phone.send(data.phone,kind==='signup'?{name:data.name.trim(),district:data.district,role:V.registration.role,language:V.lang}:null,V.lang);
     render();$('sp-otp')?.focus();return;
    }
    if(!/^\d{6}$/.test(String(data.otp||'')))throw Object.assign(new Error('Code'),{code:'auth/invalid-verification-code'});
    let result;try{result=await phone.confirm(data.otp);}catch(error){if(!phone.confirmation)render();throw error;}
    V.me=result.user;V.lang=V.me.language;V.registration={name:'',role:'farmer',district:'Dambulla',phone:'',password:''};R.preference('language',V.lang);V.page='home';await refresh();return;
   }
   if(!R.isPreview){
    if(!/^(?:0|\+94)7\d{8}$/.test(String(data.phone||'').replace(/[\s()-]/g,'')))throw new Error('LOCAL_PHONE');
    if(String(data.password||'').length<10)throw new Error('LOCAL_PASSWORD');
   }
   if(kind==='signup'&&String(data.name||'').trim().length<2)throw new Error('LOCAL_FIELDS');
   const result=await R.request('/auth/'+(kind==='signup'?'register':'login'),'POST',{...data,role:V.registration.role,language:V.lang});
   V.registration={name:'',role:'farmer',district:'Dambulla',phone:'',password:''};V.me=result.user;V.lang=V.me.language;R.preference('language',V.lang);V.page='home';V.sheet=null;await refresh();notify(t(R.isPreview?'createdDemo':'profileCreated'));return;
  }
  if(kind==='edit'){
   const body={name:data.name.trim(),district:data.district,language:data.language,bio:data.bio,skills:data.skills};
   if(body.name.length<2)throw new Error('LOCAL_FIELDS');
   if(isDemo()){Object.assign(V.me,body);Object.assign(person(V.me.id)||{},body);R.updateDemoProfile?.(V.me);}else{V.me=(await R.request('/community/profile','PATCH',body)).user;}
   V.lang=V.me.language;R.preference('language',V.lang);V.sheet=null;render();notify(t('saved'));return;
  }
  if(kind==='assist'){
   const lang=V.source;const result=V.thread.sample?{text:PHRASES[data.intent][lang]}:await R.request('/chat/conversations/'+V.thread.id+'/assist','POST',{language:lang,intent:data.intent});
   V.sheet=null;render();$('sp-message').value=result.text;$('sp-message').focus();return;
  }
  let path,body;
  if(kind==='offer'){path='/offers';body={buyer_id:V.me.id,product_id:id,qty:numeric('qty'),price:numeric('price')};}
  if(kind==='listing'){path='/products';body={seller_id:V.me.id,crop:data.crop,district:data.district,qty:numeric('qty'),price:numeric('price'),harvested:data.harvested};}
  if(kind==='restock'){path='/products/'+id+'/restock';body={actor_id:V.me.id,qty:numeric('qty')};}
  if(kind==='quality'){path='/quality/check';body={actor_id:V.me.id,product_id:id,freshness:numeric('freshness'),defects:numeric('defects'),handling:numeric('handling'),note:data.note};}
  if(kind==='request'){path='/demands';body={buyer_id:V.me.id,crop:data.crop,qty:numeric('qty'),max_price:numeric('max_price'),district:data.district};}
  if(kind==='transport'){path='/transport/book';body={actor_id:V.me.id,offer_id:numeric('offer_id'),driver_id:numeric('driver_id'),distance_km:numeric('distance_km')};}
  if(kind==='job'){if(String(data.description||'').trim().length<6)throw new Error('LOCAL_FIELDS');path='/jobs/book';body={actor_id:V.me.id,worker_id:id,description:data.description};}
  if(kind==='review'){if(String(data.review||'').trim().length<3)throw new Error('LOCAL_FIELDS');path='/jobs/'+id+'/review';body={actor_id:V.me.id,rating:numeric('rating'),review:data.review};}
  if(kind==='service'){path=V.me.role==='driver'?'/drivers':'/workers';body=V.me.role==='driver'?{actor_id:V.me.id,vehicle:data.vehicle,capacity:numeric('capacity'),district:data.district,base_fee:numeric('base_fee'),per_km:numeric('per_km')}:{actor_id:V.me.id,skill:data.skill,district:data.district,rate:numeric('rate'),bio:data.bio};}
  if(!path)return;
  await R.request(path,'POST',body);V.sheet=null;await refresh();notify(t(kind==='offer'?'offerSent':'saved'));
 }catch(error){
  const text=error.message==='LOCAL_PHONE'?t('badPhone'):error.message==='LOCAL_PASSWORD'?t('badPassword'):error.message==='LOCAL_FIELDS'?t('checkFields'):errorText(error);
  const target=$('sp-form-error');if(target)target.textContent=text;else notify(text,true);
 }finally{if(submitButton?.isConnected)submitButton.disabled=false;}
}
root.addEventListener('submit',submit);
root.addEventListener('click',async event=>{
 const target=event.target.closest('[data-action]');if(!target)return;
 const action=target.dataset.action,id=Number(target.dataset.id);
 try{
  if(action==='review-signin'){
   if(!R.config?.reviewOnly)return;
   const label=target.textContent;target.disabled=true;target.textContent='Signing in…';
   try{
    const result=await window.SaviPolaPhone.review(target.dataset.role,V.lang);
    V.me=result.user;V.lang=V.me.language;R.preference('language',V.lang);V.page='home';await refresh();
   }finally{if(target.isConnected){target.disabled=false;target.textContent=label;}}
   return;
  }
  if(action==='save-harvest'){await toggleSaved(id);return;}
  if(action==='saved-retry'){await loadSaved();return;}
  if(action==='saved-filter'){savedOnly=!savedOnly;V.page='market';render();if(savedStatus==='error'||savedStatus==='idle')await loadSaved();return;}
  if(action==='firebase-reset'){window.SaviPolaPhone.reset();render();return;}
  if(['signup','registration-language','registration-role','login'].includes(action))window.SaviPolaPhone?.reset();
  if(action==='language')return changeLanguage(target.dataset.language);
  if(action==='signup'||action==='registration-language'){closeLive();V.sheet=null;V.page='welcome';render();return;}
  if(action==='start-registration'||action==='registration-role'){V.page='role';render();return;}
  if(action==='choose-role'){V.registration.role=target.dataset.role;V.page='signup';render();return;}
  if(action==='toggle-password'){const field=$('sp-auth-password'),show=field.type==='password';field.type=show?'text':'password';target.textContent=t(show?'passwordHide':'passwordShow');target.setAttribute('aria-pressed',String(show));return;}
  if(action==='help'||action==='filters')return showSheet(action);
  if(action==='clear-filters'){V.district='all';V.sort='latest';V.category='all';V.search='';render();return;}
  if(action==='start-sell')return showSheet(V.me.role==='farmer'?'listing':V.me.role==='buyer'?'request':'service');
  if(action==='work'){if(V.me.role==='worker')return showSheet('service');V.service='localWork';return navigate('services');}
  if(action==='delivery'){if(V.me.role==='driver')return showSheet('service');V.service='transport';return navigate('services');}
  if(action==='demo'){
   if(R.config?.demoEnabled===false)return;
   V.me={...person(4),is_demo:1,language:V.lang};V.page='home';render();return;
  }
  if(action==='nav')return navigate(target.dataset.page);
  if(['home','market','messages','services','profile','inventory','orders','jobs','demands','signup','login'].includes(action))return navigate(action);
  if(action==='back')return navigate(V.me?'profile':'welcome');
  if(action==='close-sheet'){closeSheet();return;}
  if(action==='category'){V.category=target.dataset.value;render();return;}
  if(action==='service-tab'){V.service=target.dataset.value;render();return;}
  if(action==='logout'){await R.request('/auth/logout','POST');closeLive();savedIds.clear();savedBusy.clear();savedOnly=false;savedStatus='idle';V.me=null;V.data=null;V.threads=[];V.thread=null;V.messages=[];V.chatView=null;V.openOriginal.clear();V.sheet=null;V.registration={name:'',role:'farmer',district:'Dambulla',phone:'',password:''};V.page='welcome';render();return;}
  if(action==='batch')return showSheet('batch',id);
  if(action==='offer'){if(!requireRole('buyer'))return;return showSheet('offer',id);}
  if(action==='listing'){if(!requireRole('farmer'))return;return showSheet('listing');}
  if(action==='request'){if(!requireRole('buyer'))return;return showSheet('request');}
  if(action==='service'){if(!['driver','worker'].includes(V.me.role))return notify(t('wrongRole'),true);return showSheet('service');}
  if(['edit','restock','quality','job','review','people','assist'].includes(action))return showSheet(action,id);
  if(action==='transport')return showSheet('transport',id);
  if(action==='transport-order')return showSheet('transport',V.data.drivers[0]?.id,{offerId:id});
  if(action==='matches'){const plan=await R.request('/plan/'+id);return showSheet('matches',id,{plan});}
  if(action==='peer')return openPeer(id,Number(target.dataset.product)||null);
  if(action==='sample-chat'){if(R.config?.demoEnabled===false)return navigate('messages');const peer=V.me.id===1?person(4):person(1);return openThread(sampleThread(peer,1));}
  if(action==='thread'){const c=V.threads.find(c=>c.id===id);if(c)return openThread(c);}
  if(action==='phrase'){$('sp-message').value=PHRASES[target.dataset.value][V.source];$('sp-message').focus();return;}
  if(action==='original'){V.openOriginal.has(id)?V.openOriginal.delete(id):V.openOriginal.add(id);paintMessages();return;}
  if(action==='retry'){await R.request('/chat/messages/'+id+'/translate','POST');await syncMessages();return;}
  if(action.startsWith('trade-')){await R.request('/offers/'+id+'/action','POST',{actor_id:V.me.id,action:action.slice(6)});await refresh();notify(t('saved'));return;}
  if(action==='job-complete'){await R.request('/jobs/'+id+'/complete','POST',{actor_id:V.me.id});await refresh();notify(t('saved'));}
 }catch(error){notify(errorText(error),true);}
});
root.addEventListener('change',event=>{
 if(V.page==='signup'&&event.target.name==='district')V.registration.district=event.target.value;
 if(event.target.id==='sp-language')changeLanguage(event.target.value);
 if(event.target.id==='sp-demo-profile'){
  closeLive();V.me={...person(Number(event.target.value)),is_demo:1};V.page='home';V.sheet=null;render();
 }
 if(event.target.id==='sp-chat-view'){V.chatView=Number(event.target.value);V.source=viewer().language||'en';render();}
 if(event.target.id==='sp-source-language'){V.source=event.target.value;const field=$('sp-message');if(field)field.lang=V.source;}
});
root.addEventListener('input',event=>{
 if(V.sheet?.kind==='offer'&&['qty','price'].includes(event.target.name)){const form=event.target.form,qty=Number(form.elements.qty.value),price=Number(form.elements.price.value),output=$('sp-offer-total');if(output)output.textContent=Number.isFinite(qty*price)&&qty>0&&price>0?money(qty*price):'—';}
 if(['signup','login'].includes(V.page)&&event.target.name&&event.target.name in V.registration)V.registration[event.target.name]=event.target.value;
 if(event.target.id==='sp-market-search'){updateSearch(event.target.value);const global=$('sp-global-search');if(global)global.value=event.target.value;}
});

root.addEventListener('keydown',event=>{
 if(!V.sheet)return;
 if(event.key==='Escape'){event.preventDefault();closeSheet();return;}
 if(event.key==='Tab'){
  const controls=[...root.querySelectorAll('.sp-sheet button,.sp-sheet input,.sp-sheet select,.sp-sheet textarea,.sp-sheet a[href]')].filter(el=>!el.disabled&&!el.hidden);
  const first=controls[0],last=controls.at(-1);if(!first)return;
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
});
async function boot(){
 try{
  const [data,auth,config]=await Promise.all([R.request('/state'),R.request('/auth/me'),R.isPreview?Promise.resolve(null):R.request('/runtime-config')]);if(config)R.config=config;V.data=data;V.me=auth.user;
  if(V.me){V.lang=V.me.language||V.lang;V.page='home';}
  else V.page='welcome';
  render();if(savedEnabled())await loadSaved();
 }catch(error){root.innerHTML=`<div class="sp-busy"><h2>SaviPola</h2><p style="margin-top:14px">${t('actionFailed')}</p></div>`;}
}
root.__app={state:()=>V,translate:t,navigate,refresh,openPeer,changeLanguage,boot,marketListings};
boot();
})();
