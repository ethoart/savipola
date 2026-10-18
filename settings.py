"""Fail closed when a deployment opts into production mode."""
import os
from urllib.parse import urlsplit

PRODUCTION = os.getenv('SAVIPOLA_ENV', 'local') == 'production'
AUTH_MODE = os.getenv('SAVIPOLA_AUTH_MODE', 'local')
EMAIL_AUTH = os.getenv('SAVIPOLA_EMAIL_AUTH', '0') == '1'
REVIEW_ACCESS = os.getenv('SAVIPOLA_REVIEW_ACCESS', '0') == '1'
REVIEW_ONLY = os.getenv('SAVIPOLA_REVIEW_ONLY', '0') == '1'
# Legacy fictional profile contacts; evaluation sign-in uses Firebase password accounts.
REVIEW_PHONES = ('+16505550101', '+16505550102')
REVIEW_IDENTITIES = {
    'savipola-review-farmer': 'farmer@savipola.example',
    'savipola-review-buyer': 'buyer@savipola.example',
    'savipola-review-driver': 'driver@savipola.example',
    'savipola-review-worker': 'worker@savipola.example',
}
DEMO = os.getenv('SAVIPOLA_DEMO_MODE', '0' if PRODUCTION else '1') == '1'
SEED = os.getenv('SAVIPOLA_SEED_DEMO', '0' if PRODUCTION else '1') == '1'
ORIGIN = os.getenv('SAVIPOLA_PUBLIC_ORIGIN', '').rstrip('/')
COOKIE = '__Host-savipola_session' if PRODUCTION else 'savipola_session'
CSRF_COOKIE = '__Host-savipola_csrf' if PRODUCTION else 'savipola_csrf'
SECURE = PRODUCTION or bool(os.getenv('K_SERVICE')) or os.getenv('SAVIPOLA_SECURE_COOKIES') == '1'
FIREBASE = {'apiKey': os.getenv('FIREBASE_API_KEY', ''),
            'authDomain': os.getenv('FIREBASE_AUTH_DOMAIN', ''),
            'projectId': os.getenv('FIREBASE_PROJECT_ID', os.getenv('GOOGLE_CLOUD_PROJECT', '')),
            'appId': os.getenv('FIREBASE_APP_ID', '')}

def allowed_origins():
    return {origin for origin in (ORIGIN,*os.getenv('SAVIPOLA_ALLOWED_ORIGINS','').split(',')) if origin}

def validate():
    if AUTH_MODE not in ('local', 'firebase'):
        raise RuntimeError('Unsupported SAVIPOLA_AUTH_MODE')
    if REVIEW_ONLY and AUTH_MODE != 'firebase':
        raise RuntimeError('Evaluation accounts require Firebase authentication')
    if EMAIL_AUTH and AUTH_MODE != 'firebase':
        raise RuntimeError('Verified email accounts require Firebase authentication')
    if AUTH_MODE == 'firebase' and not all(FIREBASE.values()):
        raise RuntimeError('Firebase web configuration is incomplete')
    if os.getenv('SAVIPOLA_FIRESTORE_ENABLED')=='1' and AUTH_MODE!='firebase':
        raise RuntimeError('Firestore saved harvests require Firebase authentication')
    if PRODUCTION:
        missing = [key for key in ('DB_HOST','DB_PASS','GOOGLE_CLOUD_PROJECT','GEMINI_MODEL',
                   'SAVIPOLA_SUPPORT_EMAIL','SAVIPOLA_WORKER_EMAIL') if not os.getenv(key)]
        if missing or AUTH_MODE != 'firebase' or DEMO or SEED:
            raise RuntimeError('Production requires Firebase, PostgreSQL, AI, support and worker settings, with demo and seed disabled; missing: '+','.join(missing))
        parsed = urlsplit(ORIGIN)
        if parsed.scheme != 'https' or not parsed.hostname or parsed.path or parsed.query or parsed.fragment or parsed.username:
            raise RuntimeError('SAVIPOLA_PUBLIC_ORIGIN must be one HTTPS origin')
        for origin in allowed_origins():
            parsed=urlsplit(origin)
            if parsed.scheme!='https' or not parsed.hostname or parsed.path or parsed.query or parsed.fragment or parsed.username:
                raise RuntimeError('Every allowed origin must be one HTTPS origin')
        if any(os.getenv(key) for key in ('FIREBASE_AUTH_EMULATOR_HOST','FIRESTORE_EMULATOR_HOST','GOOGLE_APPLICATION_CREDENTIALS')):
            raise RuntimeError('Production must use attached service-account ADC, without emulator or key files')
        if FIREBASE['projectId'] != os.getenv('GOOGLE_CLOUD_PROJECT'):
            raise RuntimeError('Use the same Firebase and Google Cloud project')

validate()
