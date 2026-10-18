/* Firebase ID tokens stay in memory. The server sets the private session cookie. */
window.SaviPolaPhone={
  confirmation:null,profile:null,verifier:null,sdk:null,auth:null,
  async setup(language){
    if(!this.sdk){
      const [app,auth]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js')
      ]);
      this.sdk=auth;this.auth=auth.getAuth(app.initializeApp(window.SaviPolaRuntime.config.firebase));
      await auth.setPersistence(this.auth,auth.inMemoryPersistence);
    }
    this.auth.languageCode=language;
  },
  async send(phone,profile,language){
    await this.setup(language);
    this.verifier?.clear();
    this.verifier=new this.sdk.RecaptchaVerifier(this.auth,'sp-sms-send',{size:'invisible'});
    const normalized=phone.replace(/[\s()-]/g,'').replace(/^0/,'+94');
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
