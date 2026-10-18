"""Offline integration tests: real API/storage; mocked Firebase and model network boundaries.
Run separately so settings are imported with a fresh Firebase/no-demo configuration.
"""
import os, tempfile, time, hashlib, asyncio
from unittest.mock import patch
from fastapi import HTTPException
from fastapi.testclient import TestClient

def run():
    with tempfile.TemporaryDirectory() as folder:
        os.environ.update(SAVIPOLA_DB=folder+'/cloud.sqlite3',SAVIPOLA_AUTH_MODE='firebase',SAVIPOLA_SEED_DEMO='0',
            SAVIPOLA_DEMO_MODE='0',SAVIPOLA_PUBLIC_ORIGIN='https://testserver',FIREBASE_API_KEY='offline-test-public',
            FIREBASE_AUTH_DOMAIN='offline-test.firebaseapp.com',FIREBASE_PROJECT_ID='offline-test',FIREBASE_APP_ID='offline-test')
        os.environ.pop('DB_HOST',None);os.environ.pop('GOOGLE_CLOUD_PROJECT',None);os.environ.pop('K_SERVICE',None)
        from app import app,conn,one
        import settings, firebase_identity, ai_service
        tokens={}
        def exchange(token):
            if token not in tokens:raise HTTPException(401,'Invalid token')
            return tokens[token],'cookie-'+token
        def verify(cookie):
            token=cookie.removeprefix('cookie-')
            if token not in tokens:raise HTTPException(401,'Revoked')
            return tokens[token]
        with patch.object(firebase_identity,'exchange',side_effect=exchange),patch.object(firebase_identity,'verify',side_effect=verify):
            a,b,eve=TestClient(app),TestClient(app),TestClient(app)
            def write(client,path,body=None,origin='https://testserver',csrf=True):
                token=client.get('/api/auth/csrf').json()['token']
                headers={'Origin':origin}
                if csrf:headers['X-CSRF-Token']=token
                return client.post(path,json=body,headers=headers)
            def join(client,name,phone,language,role):
                token=('token-for-'+name).ljust(24,'x');tokens[token]={'uid':name,'phone_number':phone}
                result=write(client,'/api/auth/firebase/session',{'id_token':token,'profile':{'name':name,'district':'Dambulla','language':language,'role':role}})
                assert result.status_code==200,result.text
                return result.json()['user'],token
            assert not a.get('/api/state').json()['people']
            assert a.get('/api/runtime-config').json()['demoEnabled'] is False
            with patch.dict(os.environ,{'SAVIPOLA_ALLOWED_ORIGINS':'https://alternate.test'}):
                alias=TestClient(app,base_url='https://alternate.test')
                assert write(alias,'/api/auth/logout',{},origin='https://alternate.test').status_code==200
                assert write(alias,'/api/auth/logout',{},origin='https://evil.invalid').status_code==403
            assert write(a,'/api/auth/login',{'phone':'0771110001','password':'anything'}).status_code==404
            alice,ta=join(a,'Alice','+94771110001','en','buyer')
            bob,tb=join(b,'Bob','+94771110002','si','farmer')
            third,te=join(eve,'Eve','+94771110003','ta','buyer')
            assert alice['id']==1 and bob['id']==2 and alice['phone_verified'] and not alice['is_demo']
            assert a.cookies.get('savipola_session')
            product=write(b,'/api/products',{'seller_id':bob['id'],'crop':'Tomatoes','district':'Dambulla','qty':40,'price':200}).json()
            assert write(a,'/api/products',{'seller_id':bob['id'],'crop':'Carrots','district':'Dambulla','qty':40,'price':200}).status_code==403
            assert write(a,'/api/products',{'actor_id':alice['id'],'buyer_id':alice['id'],'seller_id':bob['id'],'crop':'Carrots','district':'Dambulla','qty':40,'price':200}).status_code==403
            offer=write(a,'/api/offers',{'buyer_id':alice['id'],'product_id':product['id'],'qty':20,'price':200})
            assert offer.status_code==200,offer.text
            assert len(a.get('/api/state').json()['offers'])==1
            assert not eve.get('/api/state').json()['offers']
            assert not TestClient(app).get('/api/state').json()['offers'] # IDs 1 and 2 are real, never demo.
            assert write(a,'/api/chat/conversations',{'peer_id':bob['id']},csrf=False).status_code==403
            assert write(a,'/api/chat/conversations',{'peer_id':bob['id']},origin='https://evil.invalid').status_code==403
            assert a.post('/api/chat/conversations',json={'peer_id':bob['id']}).status_code==403
            cid=write(a,'/api/chat/conversations',{'peer_id':bob['id']}).json()['conversation']['id']
            assert eve.get(f'/api/chat/conversations/{cid}/messages').status_code==404
            # Simulate a worker dying while holding a persisted lease, then restart recovery.
            message=write(a,f'/api/chat/conversations/{cid}/messages',{'text':'20 kg for LKR 200','source_language':'en','client_id':'durable-outbox-001'}).json()['message']
            mid=message['id']
            with conn() as db:
                job=one(db,'SELECT * FROM translation_jobs WHERE message_id=?',(mid,));assert job['status']=='pending'
                db.execute("UPDATE translation_jobs SET status='processing',lease_until=?,next_attempt=0 WHERE id=?",(time.time()-1,job['id']))
            assert a.post('/internal/translation-sweep').status_code==401
            with patch('google.oauth2.id_token.verify_oauth2_token',return_value={'email':'other@test.invalid','email_verified':True}):
                assert a.post('/internal/translation-sweep',headers={'Authorization':'Bearer offline'}).status_code==403
            with patch.dict(os.environ,{'SAVIPOLA_WORKER_EMAIL':'worker@test.invalid','GOOGLE_CLOUD_PROJECT':'offline-test'}),patch('google.oauth2.id_token.verify_oauth2_token',return_value={'email':'worker@test.invalid','email_verified':True}),patch.object(ai_service,'generate',return_value=({'translated_text':'කිලෝ 20 සඳහා LKR 200'},{'model':'OFFLINE-TEST'})):
                sweep=a.post('/internal/translation-sweep',headers={'Authorization':'Bearer offline'})
                assert sweep.status_code==200 and sweep.json()['processed']==1,sweep.text
                assert a.post('/internal/translation-sweep',headers={'Authorization':'Bearer offline'}).json()['processed']==0
            assert b.get(f'/api/chat/conversations/{cid}/messages').json()['messages'][0]['translation']['status']=='ready'
            # A request-based Cloud Run instance must finish model work before
            # its response ends; it cannot depend on post-response CPU time.
            with patch.dict(os.environ,{'SAVIPOLA_POLL_ONLY':'1','GOOGLE_CLOUD_PROJECT':'offline-test'}),patch('fastapi.BackgroundTasks.add_task',side_effect=AssertionError('Post-response task in polling deployment')):
                with patch.object(ai_service,'generate',return_value=({'translated_text':'30 kg LKR 210'},{'model':'OFFLINE-TEST'})):
                    inline=write(a,f'/api/chat/conversations/{cid}/messages',{'text':'30 kg LKR 210','source_language':'en','client_id':'inline-cloud-run-001'})
                    assert inline.status_code==200,inline.text
                    assert b.get(f'/api/chat/conversations/{cid}/messages').json()['messages'][-1]['translation']['status']=='ready'
                with patch.object(ai_service,'generate',side_effect=RuntimeError('Model unavailable')):
                    failed=write(a,f'/api/chat/conversations/{cid}/messages',{'text':'40 kg LKR 220','source_language':'en','client_id':'inline-cloud-run-002'}).json()['message']
                with patch.object(ai_service,'generate',return_value=({'translated_text':'40 kg LKR 220'},{'model':'OFFLINE-TEST'})):
                    assert write(b,f'/api/chat/messages/{failed["id"]}/translate').status_code==200
                    assert b.get(f'/api/chat/conversations/{cid}/messages').json()['messages'][-1]['translation']['status']=='ready'
            from starlette.websockets import WebSocketDisconnect
            with a.websocket_connect(f'/api/chat/conversations/{cid}/live',headers={'Origin':'https://testserver'}) as socket:
                assert socket.receive_json()['type']=='connected'
                del tokens[ta]
                socket.send_text('ping')
                try:socket.receive_json()
                except WebSocketDisconnect as exc:assert exc.code==1008
                else:raise AssertionError('Revoked WebSocket stayed authorized')
            tokens[ta]={'uid':'Alice','phone_number':'+94771110001'}
            del tokens[ta]
            assert a.get('/api/auth/me').status_code==401
            assert a.get('/api/state').status_code==401
            # A new request rechecks Firebase revocation; no process-global auth cache.
            tokens[ta]={'uid':'Alice','phone_number':'+94771110001'}
            assert write(a,'/api/auth/logout').status_code==200
            assert a.get('/api/auth/me').json()['user'] is None
            assert len(b.get('/api/state').json()['people'])==3
            assert all('phone' not in p for p in TestClient(app).get('/api/community/people').json()['people'])
            # Shared rate limits survive a second client/process because counters are in SQL.
            with conn() as db:
                digest=hashlib.sha256(repr((('firebase-session', 'testclient'),300)).encode()).hexdigest()
                db.execute('UPDATE rate_limits SET hits=20 WHERE key_hash=?',(digest,))
            assert write(eve,'/api/auth/firebase/session',{'id_token':te}).status_code==429
            assert a.post('/api/auth/firebase/session',content=b'x'*(4*1024*1024+1)).status_code==413
            with patch.object(settings,'PRODUCTION',True):
                assert b.get('/classic').status_code==404
                assert b.get('/responsive-check').status_code==404
                headers=b.get('/').headers
                assert 'frame-ancestors' in headers['content-security-policy']
                assert 'no-store' in b.get('/api/state').headers['cache-control']
            assert b.get('/healthz').json()=={'ok':True}
        print('PASS: Firebase exchange/revocation boundary, CSRF/Origin, disabled password/demo access, first-real-user privacy, durable translation recovery, worker identity, shared quotas, body limit and security headers (network mocked)')

if __name__=='__main__':run()
