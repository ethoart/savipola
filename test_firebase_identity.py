"""Check recent phone-token enforcement and SDK exception handling without a network."""
import time
from unittest.mock import patch
from fastapi import HTTPException
from firebase_admin import auth, exceptions
import firebase_identity as identity

def denied(fn,status):
    try:fn()
    except HTTPException as exc:assert exc.status_code==status,(exc.status_code,status)
    else:raise AssertionError('Request was accepted')

def run():
    good={'uid':'verified-user','phone_number':'+94771110001','auth_time':time.time(),'firebase':{'sign_in_provider':'phone'}}
    with patch.object(identity,'admin',return_value=object()),patch.object(auth,'verify_id_token',return_value=good) as verify,patch.object(auth,'create_session_cookie',return_value='signed-session') as mint:
        claims,cookie=identity.exchange('ID-TOKEN')
        assert claims['uid']=='verified-user' and cookie=='signed-session'
        assert verify.call_args.kwargs['check_revoked'] is True
        assert mint.call_args.kwargs['expires_in'].days==5
        for bad in ({**good,'auth_time':time.time()-301},{**good,'auth_time':time.time()+60},{**good,'firebase':{'sign_in_provider':'password'}},{**good,'phone_number':None}):
            verify.return_value=bad;denied(lambda:identity.exchange('ID-TOKEN'),401)
        verify.side_effect=auth.RevokedIdTokenError('revoked');denied(lambda:identity.exchange('ID-TOKEN'),401)
        verify.side_effect=exceptions.UnavailableError('outage');denied(lambda:identity.exchange('ID-TOKEN'),503)
        with patch.object(auth,'verify_session_cookie',side_effect=auth.RevokedSessionCookieError('revoked')) as session:
            denied(lambda:identity.verify('COOKIE'),401)
            assert session.call_args.kwargs['check_revoked'] is True
    print('PASS: recent phone-only ID tokens, session lifetime, revocation and upstream-outage mapping (Firebase SDK calls mocked)')

if __name__=='__main__':run()
