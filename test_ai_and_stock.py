"""Offline boundary and transactional tests; no live model results are claimed."""
import base64
import importlib
import os
import tempfile
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch

from fastapi.testclient import TestClient
from pydantic import ValidationError


def run():
    with tempfile.TemporaryDirectory() as directory:
        os.environ['SAVIPOLA_DB'] = os.path.join(directory, 'boundaries.sqlite3')
        os.environ.pop('DB_HOST', None)
        os.environ.pop('GOOGLE_CLOUD_PROJECT', None)
        import app as module
        module = importlib.reload(module)
        client = TestClient(module.app)
        r = client.post('/api/ai/listing-draft', json={'actor_id':1,'message':'Tomatoes in Dambulla'})
        assert r.status_code == 503
        assert client.get('/api/state').json()['ai_events'] == []

        # Explicit fixtures test the application's trust boundary, not model quality.
        fixture = {'crop':'Tomatoes','qty':150,'price':None,'district':'Dambulla',
                   'summary':'Asking price is missing.','questions':['What is your asking price per kg?']}
        meta = {'model':'TEST-FIXTURE','latency_ms':1,'provider':'TEST','configured':True}
        with patch.dict(os.environ, {'GOOGLE_CLOUD_PROJECT':'offline-test-project'}):
            with patch.object(module.ai_service, 'generate', return_value=(fixture,meta)):
                before = len(client.get('/api/state').json()['products'])
                r = client.post('/api/ai/listing-draft',json={'actor_id':1,'message':'150 kg tomatoes in Dambulla'})
                assert r.status_code == 200 and r.json()['result']['price'] is None
                assert len(client.get('/api/state').json()['products']) == before
            photo = {'valid_produce_photo':True,'image_observation':'Visible bruising',
                     'visible_defects':['Bruising'],'cosmetic_quality_score':62,
                     'confidence':'low','limitations':'One photo cannot establish food safety.'}
            with patch.object(module.ai_service,'generate',return_value=(photo,meta)):
                before = next(p for p in client.get('/api/state').json()['products'] if p['id']==1)
                image = 'data:image/png;base64,'+base64.b64encode(b'test-image-fixture'*10).decode()
                r = client.post('/api/quality/vision',json={'actor_id':1,'product_id':1,'image_data':image})
                assert r.status_code == 200
                after = next(p for p in client.get('/api/state').json()['products'] if p['id']==1)
                assert (after['grade'],after['quality_score']) == (before['grade'],before['quality_score'])
            with patch.object(module.ai_service,'generate',side_effect=ValueError('Invalid model response')):
                r = client.post('/api/ai/listing-draft',json={'actor_id':1,'message':'150 kg tomatoes'})
                assert r.status_code == 502

        for invalid in [-1, float('nan'), 100001]:
            try:
                module.ai_service.ListingDraft.model_validate({**fixture,'qty':invalid})
                raise AssertionError('Invalid model quantity passed validation')
            except ValidationError:
                pass

        demand = client.post('/api/demands',json={'buyer_id':4,'crop':'Tomatoes','qty':600,'max_price':250,'district':'Colombo'}).json()
        plan = client.get('/api/plan/'+str(demand['id'])).json()
        assert plan['covered_kg']==300 and plan['shortfall_kg']==300
        assert all(a['price']<=250 for a in plan['allocations'])

        # Two pending offers may coexist, but acceptance cannot oversell stock.
        ids = [client.post('/api/offers',json={'buyer_id':4,'product_id':8,'qty':200,'price':245}).json()['id'] for _ in range(2)]
        def accept(oid):
            return client.post(f'/api/offers/{oid}/action',json={'actor_id':3,'action':'accept'}).status_code
        with ThreadPoolExecutor(max_workers=2) as pool:
            statuses=list(pool.map(accept,ids))
        assert sorted(statuses)==[200,409], statuses
        stock = next(p for p in client.get('/api/state').json()['products'] if p['id']==8)
        assert stock['available_kg']==100 and stock['reserved_kg']==200
        accepted=ids[statuses.index(200)]
        assert accept(accepted)==409
        path=f'/api/offers/{accepted}/action'
        assert client.post(path,json={'actor_id':4,'action':'complete'}).status_code==200
        assert client.post(path,json={'actor_id':4,'action':'complete'}).status_code==409
        stock=next(p for p in client.get('/api/state').json()['products'] if p['id']==8)
        assert stock['sold_kg']==200 and stock['reserved_kg']==0
        print('PASS: AI unavailability, missing fields, schema validation, no automatic listing/grade changes, price cap, competing reservations and duplicate fulfilment')


if __name__ == '__main__':
    run()
