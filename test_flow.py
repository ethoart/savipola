"""Run with: python test_flow.py — uses a temporary database."""
import os, tempfile
from fastapi.testclient import TestClient

def run():
 with tempfile.TemporaryDirectory() as tmp:
  os.environ.pop('DB_HOST',None)
  os.environ['SAVIPOLA_DB']=os.path.join(tmp,'test.sqlite3')
  from app import app
  client=TestClient(app)
  def post(path,body):
   r=client.post(path,json=body)
   assert r.status_code==200, (path,r.status_code,r.text)
   return r.json()
  first=client.get('/api/state').json()
  assert len(first['products'])>=7
  original=next(x for x in first['products'] if x['id']==1)
  offer=post('/api/offers',{'buyer_id':4,'product_id':1,'qty':40,'price':240})
  oid=offer['id']
  post(f'/api/offers/{oid}/action',{'actor_id':1,'action':'accept'})
  after=next(x for x in client.get('/api/state').json()['products'] if x['id']==1)
  assert after['available_kg']==original['available_kg']-40
  assert after['reserved_kg']==original['reserved_kg']+40
  booking=post('/api/transport/book',{'actor_id':4,'offer_id':oid,'driver_id':1,'distance_km':50})
  assert booking['quote_lkr']==1800+65*50
  job=post('/api/jobs/book',{'actor_id':4,'worker_id':1,'description':'Carefully load 40 kilograms of tomatoes'})
  post(f'/api/jobs/{job["id"]}/complete',{'actor_id':4})
  post(f'/api/jobs/{job["id"]}/review',{'actor_id':4,'rating':5,'review':'Reliable and careful'})
  post(f'/api/offers/{oid}/action',{'actor_id':1,'action':'complete'})
  completed=next(x for x in client.get('/api/state').json()['products'] if x['id']==1)
  assert completed['sold_kg']==original['sold_kg']+40
  assert completed['reserved_kg']==original['reserved_kg']
  worker=post('/api/workers',{'actor_id':8,'skill':'Irrigation repair','district':'Dambulla','rate':3200,'bio':'Available for local farm irrigation repairs'})
  assert worker['id']>0
  driver=post('/api/drivers',{'actor_id':6,'vehicle':'Light truck','district':'Dambulla','capacity':1500,'base_fee':2000,'per_km':60})
  assert driver['id']>0
  quality=post('/api/quality/check',{'actor_id':1,'product_id':1,'freshness':5,'defects':1,'handling':4,'note':'Visually inspected'})
  assert quality['grade'] in ('A','B','C')
  demand=client.get('/api/plan/1').json()
  assert demand['covered_kg']+demand['shortfall_kg']==demand['requested_kg']
  assert client.post('/api/offers',json={'buyer_id':1,'product_id':1,'qty':20,'price':200}).status_code==403
  print('PASS: negotiation, transactional stock, fair sourcing plan, delivery, job and review history, seller/driver listings, quality and role validation')
if __name__=='__main__':run()
