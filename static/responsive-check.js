/* Runs only when the user opens this developer page and presses Run. */
(()=>{
 const frame=document.getElementById('app-frame'),results=document.getElementById('results'),status=document.getElementById('status'),run=document.getElementById('run'),stop=document.getElementById('stop');
 let cancelled=false;
 const tick=win=>new Promise(resolve=>win.requestAnimationFrame(()=>win.requestAnimationFrame(resolve)));
 const text=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 const name=el=>el.id?'#'+el.id:el.tagName.toLowerCase()+'.'+String(el.className?.baseVal||el.className||'').trim().split(/\s+/).slice(0,2).join('.');
 const visible=el=>{const r=el.getBoundingClientRect(),css=el.ownerDocument.defaultView.getComputedStyle(el);return r.width>0&&r.height>0&&css.visibility!=='hidden'&&css.display!=='none';};
 function issues(doc){
  const findings=[],width=doc.documentElement.clientWidth,root=doc.getElementById('savipola-app');
  if(doc.documentElement.scrollWidth>width+2)findings.push('Page width '+doc.documentElement.scrollWidth+' exceeds viewport '+width);
  for(const el of root.querySelectorAll('button,input,select,textarea,h1,h2,h3,p,label,.sp-bubble,.sp-product-place,.sp-step,.sp-meta,.sp-language-pair')){
   if(!visible(el))continue;const r=el.getBoundingClientRect(),css=doc.defaultView.getComputedStyle(el);
   if(r.left< -2||r.right>width+2)findings.push(name(el)+' extends outside the viewport');
   for(let parent=el.parentElement;parent&&parent!==root;parent=parent.parentElement){
    const parentCss=doc.defaultView.getComputedStyle(parent),bounds=parent.getBoundingClientRect();
    if(['auto','scroll'].includes(parentCss.overflowY)&&parent.scrollHeight>parent.clientHeight+2)break;
    if(['hidden','clip'].includes(parentCss.overflowY)&&(r.top<bounds.top-2||r.bottom>bounds.bottom+2)){findings.push(name(el)+' is clipped by '+name(parent));break;}
   }
   if(el.tagName!=='INPUT'&&el.tagName!=='SELECT'&&el.tagName!=='TEXTAREA'&&(['hidden','clip'].includes(css.overflowY)&&el.scrollHeight>el.clientHeight+2||['hidden','clip'].includes(css.overflowX)&&el.scrollWidth>el.clientWidth+2))findings.push(name(el)+' clips its contents');
   if(/^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)&&r.height<43.5)findings.push(name(el)+' height '+Math.round(r.height)+'px is below 44px');
  }
  return [...new Set(findings)].slice(0,12);
 }
 async function screen(app,win,page,lang,stress){
  const state=app.state();state.sheet=null;state.me={...state.data.people.find(p=>p.id===(page==='inventory'?1:4)),is_demo:1,language:lang};
  if(stress)state.me.name={en:'A very long community member display name',si:'දිගු නමක් ඇති අපේ ප්‍රදේශයේ ගොවි මහත්මයා',ta:'நீண்ட பெயரைக் கொண்ட உள்ளூர் சமூக உறுப்பினர்'}[lang];
  win.SaviPolaRuntime.isPreview=true;await app.changeLanguage(lang);
  if(['welcome','role','signup','login'].includes(page)){win.SaviPolaRuntime.isPreview=false;app.navigate(page);}
  else if(page==='chat'){app.navigate('home');await app.openPeer(1,1);}
  else if(page==='offer'){app.navigate('market');win.document.querySelector('[data-action="batch"][data-id="1"]').click();win.document.querySelector('.sp-sheet [data-action="offer"]').click();}
  else if(page==='help'){app.navigate('home');win.document.querySelector('[data-action="help"]').click();}
  else if(page==='workers'){state.service='localWork';app.navigate('services');}
  else app.navigate(page);
  void win.document.body.offsetWidth;
  const family={en:'Noto Sans',si:'Noto Sans Sinhala',ta:'Noto Sans Tamil'}[lang],sample={en:'English',si:'සිංහල',ta:'தமிழ்'}[lang];
  await win.document.fonts.load(`400 16px "${family}"`,sample);
  await win.document.fonts.ready;await tick(win);win.scrollTo(0,0);
 }
 stop.onclick=()=>{cancelled=true;stop.disabled=true;};
 run.onclick=async()=>{
  run.disabled=true;stop.disabled=false;cancelled=false;results.innerHTML='';frame.style.pointerEvents='none';
  try{
   const full=document.getElementById('matrix').value==='full',widths=full?[240,280,320,360,375,390,414,600,720,768,820,920,1024,1280,1440,1920]:[320,375,768,1024,1440];
   const sizes=widths.map(w=>[w,800]);if(full)sizes.push([568,320],[844,390],[1024,480]);
   const pages=['welcome','role','signup','login','home','market','profile','orders','inventory','services','workers','jobs','demands','messages','chat','offer','help'];
   const stress=document.getElementById('stress').checked,large=document.getElementById('large').checked,total=sizes.length*3*pages.length;let checked=0,failed=0;
   frame.src='/?layoutAudit=1';await new Promise((resolve,reject)=>{frame.onload=resolve;frame.onerror=()=>reject(Error('Could not open the local app.'));});
   const win=frame.contentWindow,doc=win.document;let attempts=0;
   while(!doc.getElementById('savipola-app')?.__app?.state()?.data){if(++attempts>100)throw Error('App did not become ready.');await new Promise(r=>setTimeout(r,100));}
   const app=doc.getElementById('savipola-app').__app,memory={},originalRequest=win.SaviPolaRuntime.request;
   win.SaviPolaRuntime.request=(path,method='GET',body)=>method==='GET'?originalRequest(path,method,body):Promise.reject(Error('Layout audit is read-only.'));
   win.SaviPolaRuntime.preference=(key,value)=>value!==undefined?(memory[key]=value):memory[key];
   if(large)doc.documentElement.style.fontSize='200%';
   for(const [width,height] of sizes){
    frame.width=width;frame.height=height;await tick(win);
    for(const lang of ['en','si','ta'])for(const page of pages){
     if(cancelled)break;
     await screen(app,win,page,lang,stress);const found=issues(doc);checked++;if(found.length)failed++;
     const row=document.createElement('tr');row.innerHTML=`<td>${width} × ${height}</td><td>${lang} / ${text(page)}</td><td class="${found.length?'fail':'pass'}">${found.length?'Needs review':'Geometry passed'}</td><td>${found.map(text).join('<br>')||'No geometry issue detected'}</td>`;results.append(row);
     status.textContent=`${checked}/${total} checked · ${failed} need review${large?' · 200% text':''}`;
    }
    if(cancelled)break;
   }
   status.textContent+=cancelled?' · stopped':' · finished';
  }catch(error){status.textContent='Check stopped: '+error.message;}
  finally{run.disabled=false;stop.disabled=true;frame.style.pointerEvents='auto';}
 };
})();
