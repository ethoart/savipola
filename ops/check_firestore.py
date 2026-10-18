"""Do not silently reuse an incompatible or unprotected Firestore database."""
import json,subprocess
x=json.loads(subprocess.check_output(['gcloud','firestore','databases','describe','--database=(default)','--format=json']))
assert x.get('type')=='FIRESTORE_NATIVE','Firestore Native mode is required'
assert x.get('deleteProtectionState')=='DELETE_PROTECTION_ENABLED','Enable Firestore deletion protection'
assert x.get('pointInTimeRecoveryEnablement')=='POINT_IN_TIME_RECOVERY_ENABLED','Enable Firestore PITR'
print('Firestore Native database and recovery settings verified')
