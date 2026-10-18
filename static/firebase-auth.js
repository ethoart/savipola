/* Firebase ID tokens stay in memory. The server sets the private session cookie. */
window.SaviPolaPhone={
  confirmation:null,profile:null,verifier:null,sdk:null,auth:null,
  async setup(language){
    if(!this.ready){this.ready=(async()=>{
      const [app,auth]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js')
      ]);
      this.sdk=auth;this.auth=auth.getAuth(app.getApps()[0]||app.initializeApp(window.SaviPolaRuntime.config.firebase));
      await auth.setPersistence(this.auth,auth.inMemoryPersistence);
    })().catch(error=>{this.ready=null;throw error;});}
    await this.ready;
    this.auth.languageCode=language;
  },
  async review(role,language){
    if(!(window.SaviPolaRuntime.config.reviewOnly||window.SaviPolaRuntime.config.reviewAccess)||!['farmer','buyer','driver','worker'].includes(role))throw new Error('Evaluation sign-in is unavailable.');
    const password='Savipola'+role[0].toUpperCase()+role.slice(1)+'Review2026!';
    // Published fictional accounts use the official REST exchange, avoiding
    // browser persistence requirements in embedded evaluation browsers.
    const response=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key='+encodeURIComponent(window.SaviPolaRuntime.config.firebase.apiKey),{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:role+'@savipola.example',password,returnSecureToken:true})
    });
    const identity=await response.json();
    if(!response.ok)throw new Error('Evaluation sign-in unavailable: '+(identity.error?.message||response.status));
    return await window.SaviPolaRuntime.request('/auth/firebase/session','POST',{id_token:identity.idToken});
  },
  async emailRegister(email,password,profile,language){
    await this.setup(language);
    const credential=await this.sdk.createUserWithEmailAndPassword(this.auth,email.trim(),password);
    try{
      await this.sdk.updateProfile(credential.user,{displayName:profile.name});
      try{sessionStorage.setItem('savipola-pending-profile',JSON.stringify({email:email.trim().toLowerCase(),profile}));}catch{}
      await this.sdk.sendEmailVerification(credential.user,{url:location.origin});
      return {verificationRequired:true,email};
    }finally{await this.sdk.signOut(this.auth);}
  },
  async emailSignIn(email,password,language,profile=null,resend=false){
    await this.setup(language);
    const credential=await this.sdk.signInWithEmailAndPassword(this.auth,email.trim(),password);
    try{
      const review=credential.user.email?.endsWith('@savipola.example');
      if(!credential.user.emailVerified&&!review){
        if(resend)await this.sdk.sendEmailVerification(credential.user,{url:location.origin});
        return {verificationRequired:true,email};
      }
      if(!profile){try{const pending=JSON.parse(sessionStorage.getItem('savipola-pending-profile')||'null');if(pending?.email===email.trim().toLowerCase())profile=pending.profile;}catch{}}
      const id_token=await credential.user.getIdToken(true);
      try{
        const result=await window.SaviPolaRuntime.request('/auth/firebase/session','POST',{id_token,profile});
        try{sessionStorage.removeItem('savipola-pending-profile');}catch{}
        return result;
      }catch(error){if(error.status===409)return {needsProfile:true,email};throw error;}
    }finally{await this.sdk.signOut(this.auth);}
  },
  async resetPassword(email,language){await this.setup(language);await this.sdk.sendPasswordResetEmail(this.auth,email.trim(),{url:location.origin});},
  async send(phone,profile,language){
    const normalized=phone.replace(/[\s()-]/g,'').replace(/^0/,'+94');
    if(window.SaviPolaRuntime.config.reviewOnly||window.SaviPolaRuntime.config.emailAuth)throw new Error('Phone sign-in is disabled. Use email sign-in.');
    await this.setup(language);
    this.verifier?.clear();
    this.verifier=new this.sdk.RecaptchaVerifier(this.auth,'sp-sms-send',{size:'invisible'});
    try{
      this.confirmation=await this.sdk.signInWithPhoneNumber(this.auth,normalized,this.verifier);
      this.profile=profile;this.verifier.clear();this.verifier=null;
    }catch(error){this.verifier?.clear();this.verifier=null;throw error;}
  },
  async confirm(code){
    if(!this.confirmation)throw new Error('OTP session expired');
    const credential=await this.confirmation.confirm(code);
    try{
      const id_token=await credential.user.getIdToken();
      return await window.SaviPolaRuntime.request('/auth/firebase/session','POST',{id_token,profile:this.profile});
    }finally{await this.sdk.signOut(this.auth);this.reset();}
  },
  reset(){this.verifier?.clear();this.verifier=null;this.confirmation=null;this.profile=null;}
};
