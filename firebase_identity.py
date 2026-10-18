"""Firebase Admin uses the attached runtime service account, never browser secrets."""
import datetime
import time
from functools import lru_cache
from fastapi import HTTPException
import settings

@lru_cache(maxsize=1)
def admin():
    import firebase_admin
    return firebase_admin.initialize_app(options={'projectId': settings.FIREBASE['projectId']})

def checked(call, *args, **kwargs):
    from firebase_admin import exceptions
    from firebase_admin import auth
    from google.auth.exceptions import GoogleAuthError
    try:
        return call(*args, app=admin(), **kwargs)
    except (auth.InvalidIdTokenError, auth.InvalidSessionCookieError, auth.RevokedIdTokenError,
            auth.RevokedSessionCookieError, auth.UserDisabledError, auth.UserNotFoundError, ValueError):
        raise HTTPException(401, 'Sign in again to verify your account.') from None
    except (exceptions.FirebaseError, GoogleAuthError):
        raise HTTPException(503, 'Account verification is temporarily unavailable.') from None

def exchange(token):
    from firebase_admin import auth
    claims = checked(auth.verify_id_token, token, check_revoked=True)
    age = time.time() - claims.get('auth_time', 0)
    provider = claims.get('firebase', {}).get('sign_in_provider')
    if settings.REVIEW_ONLY:
        expected = settings.REVIEW_IDENTITIES.get(claims.get('uid'))
        allowed = provider == 'password' and expected is not None and claims.get('email') == expected
    else:
        allowed = provider == 'phone' and bool(claims.get('phone_number'))
    if not -30 <= age <= 300 or not allowed:
        raise HTTPException(401, 'Verify your account again before signing in.')
    cookie = checked(auth.create_session_cookie, token, expires_in=datetime.timedelta(days=5))
    return claims, cookie

def verify(cookie):
    from firebase_admin import auth
    return checked(auth.verify_session_cookie, cookie, check_revoked=True)
