"""Independent sessions, private chat, translation boundaries and WebSocket delivery."""
import os
import tempfile
from unittest.mock import patch
from fastapi.testclient import TestClient


def run():
    with tempfile.TemporaryDirectory() as folder:
        os.environ['SAVIPOLA_DB']=os.path.join(folder,'community.sqlite3')
        os.environ.pop('DB_HOST',None)
        os.environ.pop('K_SERVICE',None)
        os.environ.pop('GOOGLE_CLOUD_PROJECT',None)
        from app import app
        import ai_service
        from community import preserve_numbers
        a,b,stranger=TestClient(app),TestClient(app),TestClient(app)
        def signup(client,name,phone,language,role='buyer'):
            result=client.post('/api/auth/register',json={'name':name,'phone':phone,'password':'test-password-123','role':role,'district':'Dambulla','language':language})
            assert result.status_code==200,result.text
            assert 'httponly' in result.headers['set-cookie'].lower()
            return result.json()['user']
        alice=signup(a,'Alice Buyer','0771110001','en')
        bob=signup(b,'බොබ් ගොවියා','0771110002','si','farmer')
        eve=signup(stranger,'Eve','0771110003','ta')
        assert len({alice['id'],bob['id'],eve['id']})==3
        assert not a.get('/api/auth/me').json()['user']['is_demo']
        assert a.post('/api/products',json={'seller_id':bob['id'],'crop':'Tomatoes','district':'Dambulla','qty':20,'price':200}).status_code==403
        batch=b.post('/api/products',json={'seller_id':bob['id'],'crop':'Tomatoes','district':'Dambulla','qty':20,'price':200})
        assert batch.status_code==200,batch.text
        public=TestClient(app).get('/api/community/people').json()['people']
        assert all('phone' not in p and 'password_hash' not in p for p in public)
        created=a.post('/api/chat/conversations',json={'peer_id':bob['id'],'product_id':batch.json()['id']})
        assert created.status_code==200,created.text
        cid=created.json()['conversation']['id']
        assert stranger.get(f'/api/chat/conversations/{cid}/messages').status_code==404
        assert TestClient(app).get('/api/chat/conversations').status_code==401
        with b.websocket_connect(f'/api/chat/conversations/{cid}/live') as ws:
            assert ws.receive_json()['type']=='connected'
            result=a.post(f'/api/chat/conversations/{cid}/messages',json={'text':'Can I buy 20 kg for LKR 200 per kg?','source_language':'en','client_id':'original-message-001'})
            assert result.status_code==200,result.text
            assert ws.receive_json()['type']=='message'
            assert ws.receive_json()['type']=='translation'
        messages=b.get(f'/api/chat/conversations/{cid}/messages').json()['messages']
        assert messages[0]['text']=='Can I buy 20 kg for LKR 200 per kg?'
        assert messages[0]['translation']['status']=='unavailable'
        a.post(f'/api/chat/conversations/{cid}/messages',json={'text':'Can I buy 20 kg for LKR 200 per kg?','source_language':'en','client_id':'original-message-001'})
        assert len(b.get(f'/api/chat/conversations/{cid}/messages').json()['messages'])==1
        with patch.dict(os.environ,{'GOOGLE_CLOUD_PROJECT':'OFFLINE-TEST-FIXTURE'}):
            with patch.object(ai_service,'generate',return_value=({'translated_text':'කිලෝ 20 ක් කිලෝවකට LKR 200 බැගින් මිලදී ගත හැකිද?'},{'model':'TEST-FIXTURE'})):
                retry=b.post(f'/api/chat/messages/{messages[0]["id"]}/translate')
                assert retry.status_code==200,retry.text
        translated=b.get(f'/api/chat/conversations/{cid}/messages').json()['messages'][0]['translation']
        assert translated['status']=='ready' and translated['provider'].endswith('TEST-FIXTURE')
        with patch.dict(os.environ,{'GOOGLE_CLOUD_PROJECT':'OFFLINE-TEST-FIXTURE'}):
            with patch.object(ai_service,'generate',return_value=({'translated_text':'කිලෝ 200 මිල 20'},{'model':'TEST-FIXTURE'})):
                # Preserve the multiset of numeric values, even if language reorders them.
                assert preserve_numbers('20 kg for LKR 200','කිලෝ 200 මිල 20')
            with patch.object(ai_service,'generate',return_value=({'translated_text':'කිලෝ 25 සඳහා LKR 250'},{'model':'TEST-FIXTURE'})):
                r=a.post(f'/api/chat/conversations/{cid}/messages',json={'text':'20 kg for LKR 200','source_language':'en','client_id':'numeric-test-002'})
                assert r.status_code==200
        changed=b.get(f'/api/chat/conversations/{cid}/messages').json()['messages'][-1]
        assert changed['translation']['status']=='unavailable'
        assert not preserve_numbers('20 kg for 200','25 kg for 200')
        assert a.post('/api/auth/logout').status_code==200
        assert a.get('/api/chat/conversations').status_code==401
        assert a.post('/api/auth/login',json={'phone':'0771110001','password':'wrong'}).status_code==401
        assert a.post('/api/auth/login',json={'phone':'0771110001','password':'test-password-123'}).status_code==200
        assert a.post('/api/chat/conversations',json={'peer_id':bob['id']},headers={'Origin':'https://unrelated.invalid'}).status_code==403
        print('PASS: account sessions, ownership, private profiles/chat, WebSocket delivery, idempotent sending, translation failure/retry, numeric preservation and logout')


if __name__=='__main__':run()
