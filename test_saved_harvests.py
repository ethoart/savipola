"""Application integration tests. Firebase verification and Firestore network are test doubles.
The production adapter calls the real Firestore SDK; these tests are NOT live integration evidence.
"""
import datetime,os,tempfile
from unittest.mock import patch
from fastapi.testclient import TestClient
from google.api_core.exceptions import AlreadyExists,PermissionDenied,ServiceUnavailable

class Snapshot:
    def __init__(self,path,value):self.id=path[-1];self.value=value
    def to_dict(self):return dict(self.value)
class FakeStore:
    def __init__(self):self.records={};self.failure=None;self.calls=[]
    def collection(self,name):return Ref(self,(name,))
class Ref:
    def __init__(self,store,path):self.store=store;self.path=path;self.max_items=100
    def document(self,name):return Ref(self.store,self.path+(name,))
    def collection(self,name):return Ref(self.store,self.path+(name,))
    def _check(self,op):
        self.store.calls.append((op,self.path))
        if self.store.failure:raise self.store.failure
    def create(self,value,**kwargs):
        self._check('create');assert kwargs=={'timeout':5,'retry':None}
        if self.path in self.store.records:raise AlreadyExists('already exists')
        self.store.records[self.path]={**value,'saved_at':datetime.datetime.now(datetime.timezone.utc)}
    def delete(self,**kwargs):self._check('delete');self.store.records.pop(self.path,None)
    def order_by(self,*args,**kwargs):return self
    def limit(self,count):self.max_items=count;return self
    def stream(self,**kwargs):
        self._check('list')
        data=[Snapshot(p,v) for p,v in self.store.records.items() if p[:-1]==self.path]
        return sorted(data,key=lambda d:d.value['saved_at'],reverse=True)[:self.max_items]

def run():
    with tempfile.TemporaryDirectory() as tmp:
        os.environ.update(SAVIPOLA_DB=tmp+'/saved.sqlite3',SAVIPOLA_AUTH_MODE='firebase',SAVIPOLA_SEED_DEMO='0',SAVIPOLA_DEMO_MODE='0',
            SAVIPOLA_PUBLIC_ORIGIN='https://testserver',FIREBASE_API_KEY='offline-public',FIREBASE_AUTH_DOMAIN='offline.firebaseapp.com',
            FIREBASE_PROJECT_ID='offline-test',FIREBASE_APP_ID='offline-app',SAVIPOLA_FIRESTORE_ENABLED='1')
        for key in ('DB_HOST','GOOGLE_CLOUD_PROJECT','K_SERVICE'):os.environ.pop(key,None)
        from app import app,conn
        import firebase_identity,saved_harvests
        store=FakeStore();tokens={}
        def exchange(token):return tokens[token],'cookie-'+token
        def verify(cookie):return tokens[cookie.removeprefix('cookie-')]
        with patch.object(firebase_identity,'exchange',side_effect=exchange),patch.object(firebase_identity,'verify',side_effect=verify),patch.object(saved_harvests,'client',return_value=store):
            def write(c,path,method='POST',body=None,csrf=True):
                token=c.get('/api/auth/csrf').json()['token']
                return c.request(method,path,json=body,headers={'Origin':'https://testserver',**({'X-CSRF-Token':token} if csrf else {})})
            def join(c,name,uid,role,number):
                token=('offline-token-'+name).ljust(25,'x');tokens[token]={'uid':uid,'phone_number':number}
                r=write(c,'/api/auth/firebase/session',body={'id_token':token,'profile':{'name':name,'role':role,'district':'Dambulla','language':'en'}})
                assert r.status_code==200,r.text
                return r.json()['user']
            a,b,c=TestClient(app),TestClient(app),TestClient(app)
            alice=join(a,'Alice','UID/with/slashes','buyer','+94771110001')
            bob=join(b,'Farmer','farmer-uid','farmer','+94771110002')
            eve=join(c,'Eve','third-user','buyer','+94771110003')
            p=write(b,'/api/products',body={'seller_id':bob['id'],'crop':'Tomatoes','district':'Dambulla','qty':20,'price':200}).json()['id']
            route=f'/api/community/saved-harvests/{p}'
            assert TestClient(app).get('/api/community/saved-harvests').status_code==401
            assert write(a,route,'PUT',csrf=False).status_code==403
            assert write(a,'/api/community/saved-harvests/9999','PUT').status_code==404
            assert write(a,route,'PUT',{'uid':'third-user','person_id':eve['id']}).json()['saved'] is True
            assert len(store.records)==1
            key=next(iter(store.records));assert key[1]==saved_harvests.partition('UID/with/slashes') and '/' not in key[1]
            before=store.records[key]['saved_at']
            assert write(a,route,'PUT').status_code==200 and store.records[key]['saved_at']==before
            assert not c.get('/api/community/saved-harvests').json()['items']
            assert write(c,route,'DELETE').status_code==200 and len(store.records)==1
            # A second HTTP client with the same verified account reads the same stored shortlist.
            second=TestClient(app);second.cookies.update(a.cookies)
            assert second.get('/api/community/saved-harvests').json()['items'][0]['product']['price']==200
            with conn() as db:db.execute('UPDATE products SET price=230,available_kg=0 WHERE id=?',(p,))
            item=second.get('/api/community/saved-harvests').json()['items'][0]
            assert item['product']['price']==230 and item['unavailable'] is True # SQL is authoritative.
            store.failure=PermissionDenied('test failure, never expose details')
            assert a.get('/api/community/saved-harvests').status_code==503
            assert write(a,route,'DELETE').status_code==503 and len(store.records)==1
            store.failure=ServiceUnavailable('test failure')
            assert write(a,route,'PUT').status_code==503
            store.failure=None
            assert write(a,route,'DELETE').json()['saved'] is False and not store.records
            assert write(a,route,'DELETE').status_code==200
            with patch.object(saved_harvests,'ENABLED',False):assert a.get('/api/community/saved-harvests').status_code==503
            assert a.get('/api/runtime-config').json()['savedHarvests']['provider']=='Cloud Firestore'
        print('PASS: saved harvest ownership, hashed UID paths, CSRF, idempotent persistence, cross-session reads, authoritative SQL availability, explicit disabled/IAM/outage failures (Firestore network mocked)')

if __name__=='__main__':run()
