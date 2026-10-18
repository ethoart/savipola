"""Private, persistent harvest shortlists in Firestore, accessed only by the server.

Stock, prices and orders remain authoritative in SQL. Firestore stores references,
never a second inventory ledger. There is deliberately no in-memory fallback.
"""
from functools import lru_cache
import hashlib
import logging
import os
from fastapi import HTTPException, Request
from google.api_core.exceptions import AlreadyExists, GoogleAPICallError, RetryError
from google.auth.exceptions import GoogleAuthError
import settings

ENABLED = os.getenv('SAVIPOLA_FIRESTORE_ENABLED', '0') == '1'
DATABASE = os.getenv('FIRESTORE_DATABASE', '(default)')
logger = logging.getLogger('savipola.saved_harvests')

@lru_cache(maxsize=1)
def client():
    from google.cloud import firestore
    return firestore.Client(project=settings.FIREBASE['projectId'],database=DATABASE)

def feature_config():
    return {'enabled':ENABLED,'provider':'Cloud Firestore'}

def partition(uid):
    # UIDs can contain arbitrary characters. Never interpolate one into a path.
    return hashlib.sha256(uid.encode()).hexdigest()

def unavailable(operation):
    logger.warning('saved_harvests_unavailable operation=%s',operation)
    raise HTTPException(503,'Saved harvest storage is unavailable. The change was not confirmed. Retry safely.') from None

def install(app, conn, one, rows, session, rate_limit):
    def identity(request):
        user=session(request,True)
        if not ENABLED:raise HTTPException(503,'Firestore saved harvests are not configured.')
        if settings.AUTH_MODE!='firebase' or user['is_demo']:
            raise HTTPException(403,'Use a verified Firebase account to save harvests.')
        with conn() as db:
            linked=one(db,'SELECT uid FROM firebase_identities WHERE person_id=?',(user['id'],))
        if not linked:raise HTTPException(403,'Verified identity is required.')
        rate_limit(('saved-harvests',user['id']),60,60)
        return user,linked['uid']

    def collection(uid):
        return client().collection('savipola_saved_harvests').document(partition(uid)).collection('items')

    @app.get('/api/community/saved-harvests')
    def listing(request:Request):
        _,uid=identity(request)
        try:
            from google.cloud.firestore_v1 import Query
            docs=list(collection(uid).order_by('saved_at',direction=Query.DESCENDING).limit(101).stream(timeout=5,retry=None))
            saved=[]
            for doc in docs[:100]:
                item=doc.to_dict() or {};pid=item.get('product_id');when=item.get('saved_at')
                if type(pid) is not int or pid<=0 or doc.id!=str(pid) or not hasattr(when,'isoformat'):
                    raise ValueError('Malformed saved-harvest document')
                saved.append({'product_id':pid,'saved_at':when.isoformat()})
        except (GoogleAPICallError,RetryError,GoogleAuthError,ValueError):unavailable('list')
        with conn() as db:
            for item in saved:
                product=one(db,'SELECT p.id,p.crop,p.district,p.price,p.available_kg,u.name AS seller_name FROM products p JOIN people u ON u.id=p.seller_id WHERE p.id=?',(item['product_id'],))
                item['product']=product
                item['unavailable']=not product or product['available_kg']<=0
        return {'items':saved,'has_more':len(docs)>100,'storage':'Cloud Firestore'}

    @app.put('/api/community/saved-harvests/{pid}')
    def save(pid:int,request:Request):
        user,uid=identity(request)
        with conn() as db:
            p=one(db,'SELECT p.id,pr.is_demo FROM products p JOIN profiles pr ON pr.person_id=p.seller_id WHERE p.id=?',(pid,))
            if not p:raise HTTPException(404,'Harvest not found.')
            if p['is_demo']:raise HTTPException(400,'Sample harvests cannot be saved to a real account.')
        try:
            from google.cloud import firestore
            collection(uid).document(str(pid)).create({'product_id':pid,'saved_at':firestore.SERVER_TIMESTAMP},timeout=5,retry=None)
        except AlreadyExists:pass  # Idempotent retry preserves the original saved time.
        except (GoogleAPICallError,RetryError,GoogleAuthError,ValueError):unavailable('save')
        return {'saved':True,'product_id':pid,'storage':'Cloud Firestore'}

    @app.delete('/api/community/saved-harvests/{pid}')
    def remove(pid:int,request:Request):
        _,uid=identity(request)
        if pid<=0:raise HTTPException(422,'Invalid harvest ID.')
        try:collection(uid).document(str(pid)).delete(timeout=5,retry=None)
        except (GoogleAPICallError,RetryError,GoogleAuthError,ValueError):unavailable('remove')
        return {'saved':False,'product_id':pid,'storage':'Cloud Firestore'}
