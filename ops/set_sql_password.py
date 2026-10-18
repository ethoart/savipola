"""Cloud Shell deployer credentials are used only during provisioning."""
import json, os, subprocess, urllib.request, urllib.parse, time
project=os.environ['SAVIPOLA_PROJECT']; instance=os.environ['SAVIPOLA_SQL']
token=subprocess.check_output(['gcloud','auth','print-access-token'],text=True).strip()
base=f'https://sqladmin.googleapis.com/sql/v1beta4/projects/{project}'
password=open(os.environ['SAVIPOLA_PASSWORD_PATH']).read().strip()
def call(url,method='GET',body=None):
    req=urllib.request.Request(url,method=method,data=json.dumps(body).encode() if body is not None else None,
        headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
    with urllib.request.urlopen(req,timeout=30) as response:return json.load(response)
users=call(base+f'/instances/{instance}/users').get('items',[])
exists=any(u['name']=='savipola' for u in users)
url=base+f'/instances/{instance}/users'+('?'+urllib.parse.urlencode({'name':'savipola','host':''}) if exists else '')
job=call(url,'PUT' if exists else 'POST',{'name':'savipola','password':password})
for _ in range(180):
    result=call(base+'/operations/'+job['name'])
    if result.get('status')=='DONE':
        if result.get('error'):raise RuntimeError('SQL user provisioning failed; inspect SQL operations in the console')
        break
    time.sleep(2)
else:raise TimeoutError('SQL user provisioning is still running; inspect console before rerunning')
print('SQL application user configured')
