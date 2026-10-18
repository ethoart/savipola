"""Reject an existing instance with weaker resilience settings; never silently downgrade."""
import json, os, subprocess
x=json.loads(subprocess.check_output(['gcloud','sql','instances','describe',os.environ['SAVIPOLA_SQL'],'--format=json']))
s=x['settings'];b=s.get('backupConfiguration',{})
assert s.get('availabilityType')=='REGIONAL', 'Existing SQL instance is not HA'
assert b.get('enabled') and b.get('pointInTimeRecoveryEnabled'), 'Enable backups and PITR first'
assert s.get('deletionProtectionEnabled'), 'Enable SQL deletion protection first'
assert x['region']==os.environ['SAVIPOLA_REGION'], 'Existing SQL region does not match'
print('Existing SQL resilience settings verified')
