"""Production configuration must fail closed before database/network startup."""
import os, subprocess, sys

def run():
    baseline={key:value for key,value in os.environ.items() if not key.startswith(('SAVIPOLA_','FIREBASE_','DB_','GOOGLE_','GEMINI_'))}
    valid={**baseline,'SAVIPOLA_ENV':'production','SAVIPOLA_AUTH_MODE':'firebase',
        'SAVIPOLA_DEMO_MODE':'0','SAVIPOLA_SEED_DEMO':'0','SAVIPOLA_PUBLIC_ORIGIN':'https://example.invalid',
        'FIREBASE_PROJECT_ID':'offline-project','GOOGLE_CLOUD_PROJECT':'offline-project','FIREBASE_API_KEY':'public-config',
        'FIREBASE_AUTH_DOMAIN':'offline-project.firebaseapp.com','FIREBASE_APP_ID':'offline-app',
        'GEMINI_MODEL':'offline-test-model','DB_HOST':'/cloudsql/offline','DB_PASS':'offline-placeholder',
        'SAVIPOLA_SUPPORT_EMAIL':'support@example.invalid','SAVIPOLA_WORKER_EMAIL':'worker@example.invalid'}
    def check(env):return subprocess.run([sys.executable,'-c','import settings'],env=env,capture_output=True).returncode
    assert check(valid)==0
    for key,value in (('SAVIPOLA_DEMO_MODE','1'),('SAVIPOLA_SEED_DEMO','1'),('SAVIPOLA_AUTH_MODE','local'),
        ('DB_HOST',''),('GEMINI_MODEL',''),('FIREBASE_API_KEY',''),('SAVIPOLA_WORKER_EMAIL',''),
        ('SAVIPOLA_PUBLIC_ORIGIN','http://example.invalid'),('SAVIPOLA_PUBLIC_ORIGIN','https://example.invalid/path'),
        ('FIRESTORE_EMULATOR_HOST','localhost:8081'),('FIREBASE_AUTH_EMULATOR_HOST','localhost:9099'),('GOOGLE_APPLICATION_CREDENTIALS','key.json'),('FIREBASE_PROJECT_ID','another-project')):
        assert check({**valid,key:value})!=0,key
    print('PASS: production refuses demo/local identity, incomplete cloud config, insecure origin, emulator, key files and cross-project identity')

if __name__=='__main__':run()
