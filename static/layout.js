/* React to actual navigation/keyboard dimensions; never assume translated labels have a fixed height. */
window.SaviPolaLayout=function(root,preview=false){
 if(preview)return {refresh(){}};
 let frame=null,stopped=false;
 const measure=()=>{
  frame=null;
  if(stopped)return;
  const viewport=window.visualViewport,height=viewport&&(viewport.scale||1)<1.1?viewport.height:window.innerHeight;
  const keyboard=root.dataset.page==='chat'&&/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName||'')&&window.innerHeight-height>120&&(viewport?.scale||1)<1.1;
  root.dataset.keyboard=String(keyboard);
  root.dataset.shortViewport=String(height<320);
  const rem=parseFloat(getComputedStyle(document.documentElement).fontSize)||16,width=root.getBoundingClientRect().width||window.innerWidth;
  root.dataset.compact=String(width<=60*rem);
  root.dataset.narrow=String(width<=20*rem);
  root.dataset.headerStacked=String(width<19*rem);
  root.style.setProperty('--sp-viewport-height',Math.max(160,Math.round(height))+'px');
  const nav=root.querySelector('.sp-bottom-nav');
  const navHeight=nav&&getComputedStyle(nav).display!=='none'?Math.ceil(nav.getBoundingClientRect().height):0;
  root.style.setProperty('--sp-navigation-space',navHeight?navHeight+12+'px':'0px');
  const chat=root.querySelector('.sp-chat-page');
  const size=el=>{const css=getComputedStyle(el);return css.display==='none'||css.position==='fixed'?0:el.getBoundingClientRect().height+(parseFloat(css.marginTop)||0)+(parseFloat(css.marginBottom)||0);};
  const outside=chat?[...root.children].filter(el=>el!==chat).reduce((sum,el)=>sum+size(el),0):0;
  const inside=chat?[...chat.children].filter(el=>!el.classList.contains('sp-chat-log')).reduce((sum,el)=>sum+size(el),0):0;
  root.dataset.chatScroll=String(Boolean(chat&&outside+inside+4*rem>height));
 };
 const queue=()=>{if(!stopped&&frame===null)frame=requestAnimationFrame(measure);};
 const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(queue):null;
 window.addEventListener('resize',queue,{passive:true});
 window.visualViewport?.addEventListener('resize',queue,{passive:true});
 root.addEventListener('focusin',queue);root.addEventListener('focusout',queue);
 document.fonts?.ready.then(queue);
 return {refresh(){observer?.disconnect();observer?.observe(root);root.querySelectorAll('.sp-bottom-nav,.sp-header,.sp-preview-label,.sp-chat-head,.sp-chat-top,.sp-chat-preview-select,.sp-chat-context,.sp-chat-compose').forEach(el=>observer?.observe(el));queue();},destroy(){stopped=true;observer?.disconnect();window.removeEventListener('resize',queue);window.visualViewport?.removeEventListener('resize',queue);root.removeEventListener('focusin',queue);root.removeEventListener('focusout',queue);if(frame!==null)cancelAnimationFrame(frame);}};
};
