/* Live backend transport. The in-chat preview substitutes an offline adapter. */
window.SaviPolaRuntime={
  isPreview:false,
  config:{authMode:'local',demoEnabled:true},
  csrf:null,
  preference(key,value){
    try{if(value!==undefined)localStorage.setItem('savipola-'+key,value);return localStorage.getItem('savipola-'+key);}catch{return null;}
  },
  async request(path,method='GET',body){
    const headers=body?{'Content-Type':'application/json'}:{};
    if(!['GET','HEAD','OPTIONS'].includes(method)){
      if(!this.csrf){const r=await fetch('/api/auth/csrf',{credentials:'same-origin',cache:'no-store'});if(!r.ok)throw new Error('CSRF unavailable');this.csrf=(await r.json()).token;}
      headers['X-CSRF-Token']=this.csrf;
    }
    const response=await fetch('/api'+path,{method,credentials:'same-origin',cache:'no-store',headers,body:body?JSON.stringify(body):undefined});
    const result=await response.json();
    if(!response.ok){const error=new Error(typeof result.detail==='string'?result.detail:'Request failed');error.status=response.status;throw error;}
    return result;
  },
  live(cid,update,status){
    if(this.config.pollOnly){status('syncing');return ()=>{};}
    let socket=null,stopped=false,reconnect=null,ping=null;
    const connect=()=>{
      if(stopped)return;
      status('syncing');
      socket=new WebSocket((location.protocol==='https:'?'wss:':'ws:')+'//'+location.host+'/api/chat/conversations/'+cid+'/live');
      socket.onopen=()=>{status('live');ping=setInterval(()=>{if(socket.readyState===1)socket.send('ping');},20000);};
      socket.onmessage=e=>{try{const event=JSON.parse(e.data);if(['message','translation'].includes(event.type))update();}catch{}};
      socket.onclose=()=>{clearInterval(ping);status('offline');if(!stopped)reconnect=setTimeout(connect,3000);};
      socket.onerror=()=>socket.close();
    };
    connect();
    return ()=>{stopped=true;clearTimeout(reconnect);clearInterval(ping);if(socket)socket.close();};
  }
};
if('serviceWorker' in navigator && location.protocol!=='file:'){
  window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{}));
}
