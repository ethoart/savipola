"""Real API/storage regression checks; Firebase and Gemini network calls mocked."""
import os,tempfile,time,base64
from unittest.mock import patch
from fastapi.testclient import TestClient

def run():
 with tempfile.TemporaryDirectory() as folder:
  os.environ.update(SAVIPOLA_DB=folder+'/identity.sqlite3',SAVIPOLA_AUTH_MODE='firebase',SAVIPOLA_EMAIL_AUTH='1',SAVIPOLA_SEED_DEMO='0',SAVIPOLA_DEMO_MODE='0',SAVIPOLA_PUBLIC_ORIGIN='https://testserver',FIREBASE_API_KEY='offline',FIREBASE_AUTH_DOMAIN='offline.firebaseapp.com',FIREBASE_PROJECT_ID='offline',FIREBASE_APP_ID='offline',SAVIPOLA_KYC_REVIEWER_EMAIL='staff@example.test')
  os.environ.pop('DB_HOST',None)
  from app import app,conn,one
  import firebase_identity,ai_service,reputation
  from firebase_admin import auth
  claims={};cookies={}
  def verify(token,**kwargs):return claims[token]
  def mint(token,**kwargs):cookies['cookie-'+token]=claims[token];return 'cookie-'+token
  def session(cookie,**kwargs):return cookies[cookie]
  with patch.object(firebase_identity,'admin',return_value=object()),patch.object(auth,'verify_id_token',side_effect=verify),patch.object(auth,'create_session_cookie',side_effect=mint),patch.object(auth,'verify_session_cookie',side_effect=session):
   def write(client,path,body):
    csrf=client.get('/api/auth/csrf').json()['token'];return client.post(path,json=body,headers={'Origin':'https://testserver','X-CSRF-Token':csrf})
   def join(name,role,email):
    client=TestClient(app);token=('id-token-for-'+name).ljust(25,'x');claims[token]={'uid':name,'email':email,'email_verified':True,'auth_time':time.time(),'firebase':{'sign_in_provider':'password'}}
    result=write(client,'/api/auth/firebase/session',{'id_token':token,'profile':{'name':name,'role':role,'district':'Dambulla','language':'en'}});assert result.status_code==200,result.text
    return client,result.json()['user']
   buyer,bu=join('Buyer Test','buyer','buyer@example.test');farmer,fu=join('Farmer Test','farmer','farmer@example.test');staff,st=join('Staff Test','buyer','staff@example.test');other,ot=join('Other Test','driver','other@example.test')
   assert bu['email_verified'] and not bu['phone_verified'] and bu['trust_score']==20
   bad='unverified-id-token-123456';claims[bad]={'uid':'Unverified','email':'new@example.test','email_verified':False,'auth_time':time.time(),'firebase':{'sign_in_provider':'password'}}
   assert write(other,'/api/auth/firebase/session',{'id_token':bad}).status_code==401
   assert other.get('/api/community/kyc/review-queue').status_code==403
   image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
   with patch.object(ai_service,'generate',return_value=({'readable':True,'relevant_document':True,'name_matches':True,'anomalies':[],'confidence':'high','summary':'Offline consistency test; authenticity not established.'},{'model':'OFFLINE'})):
    result=write(farmer,'/api/community/kyc',{'legal_name':'Farmer Test','image_data':image,'consent':True});assert result.status_code==200,result.text
   rid=result.json()['id'];assert result.json()['status']=='ai_checked' and result.json()['identity_verified'] is False
   assert farmer.get('/api/auth/me').json()['user']['trust_score']==20
   assert other.get(f'/api/community/kyc/{rid}/document').status_code==403
   queue=staff.get('/api/community/kyc/review-queue').json()['requests'];assert len(queue)==1 and 'document_data' not in queue[0]
   assert staff.get(f'/api/community/kyc/{rid}/document').status_code==200
   assert write(farmer,f'/api/community/kyc/{rid}/decision',{'status':'verified','note':'Trying to approve myself','personally_reviewed':True}).status_code==403
   assert write(staff,f'/api/community/kyc/{rid}/decision',{'status':'verified','note':'Offline human-review test decision','personally_reviewed':True}).status_code==200
   assert staff.get(f'/api/community/kyc/{rid}/document').status_code==404
   assert farmer.get('/api/auth/me').json()['user']['trust_score']==60
   with conn() as db:
    assert one(db,'SELECT document_data FROM kyc_requests WHERE id=?',(rid,))['document_data'] is None
   product=write(farmer,'/api/products',{'seller_id':fu['id'],'crop':'Tomatoes','district':'Dambulla','qty':40,'price':250}).json()['id']
   oid=write(buyer,'/api/offers',{'buyer_id':bu['id'],'product_id':product,'qty':10,'price':240}).json()['id']
   assert write(buyer,f'/api/community/trades/{oid}/review',{'rating':5,'comment':'Too early'}).status_code==409
   assert write(farmer,f'/api/offers/{oid}/action',{'actor_id':fu['id'],'action':'accept'}).status_code==200
   driver=write(other,'/api/drivers',{'actor_id':ot['id'],'vehicle':'Test truck','capacity':500,'district':'Dambulla','base_fee':500,'per_km':60}).json()['id']
   booking=write(buyer,'/api/transport/book',{'actor_id':bu['id'],'offer_id':oid,'driver_id':driver,'distance_km':10}).json()['id']
   assert len(other.get('/api/state').json()['deliveries'])==1
   assert not staff.get('/api/state').json()['deliveries']
   assert write(staff,f'/api/deliveries/{booking}/complete',{'actor_id':st['id']}).status_code==403
   assert write(other,f'/api/deliveries/{booking}/complete',{'actor_id':ot['id']}).status_code==200
   assert write(other,f'/api/deliveries/{booking}/complete',{'actor_id':ot['id']}).status_code==409
   assert write(buyer,f'/api/offers/{oid}/action',{'actor_id':bu['id'],'action':'complete'}).status_code==200
   assert write(buyer,f'/api/community/trades/{oid}/review',{'rating':5,'comment':'Careful and reliable seller'}).status_code==200
   assert write(farmer,f'/api/community/trades/{oid}/review',{'rating':4,'comment':'Reliable buyer and clear collection'}).status_code==200
   assert write(buyer,f'/api/community/trades/{oid}/review',{'rating':1,'comment':'Duplicate review'}).status_code==409
   assert write(other,f'/api/community/trades/{oid}/review',{'rating':5,'comment':'Not my transaction'}).status_code==404
   summary=other.get(f'/api/community/profiles/{fu["id"]}/reviews').json();assert summary['trade_review_count']==1 and summary['trade_rating']==5 and summary['trust_score']==66
   assert not any(k in summary for k in ('email','document_data','legal_name'))
   with conn() as db:db.execute('UPDATE account_identity SET is_review=1 WHERE person_id=?',(fu['id'],))
   real=other.get(f'/api/community/profiles/{bu["id"]}/reviews').json()
   assert real['trade_review_count']==0 and real['completed_trades']==0 and real['trust_score']==20
   # Logout must invalidate the actual session and allow a fresh sign-in.
   assert write(buyer,'/api/auth/logout',{}).status_code==200
   assert buyer.get('/api/auth/me').json()['user'] is None
   # Document retention also applies to cases without a human decision.
   with conn() as db:
    db.execute('INSERT INTO kyc_requests(person_id,legal_name,business_name,registration_number,document_data,mime_type,status,created) VALUES(?,?,?,?,?,?,?,?)',(bu['id'],'Retention fixture','','','fake','image/png','needs_human',time.time()-31*86400))
   reputation.purge_documents(conn)
   with conn() as db:assert not one(db,'SELECT id FROM kyc_requests WHERE document_data IS NOT NULL')
  print('PASS: verified-email registration/session boundaries; private KYC, no AI approval points, staff-only decisions and retention; mutual completed-trade ratings, duplicate/outsider rejection, trust arithmetic and logout (Firebase/Gemini network mocked)')
if __name__=='__main__':run()
