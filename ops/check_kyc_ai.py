"""One live model check using an obviously fictional, watermarked test document."""
from pathlib import Path
import json,sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from reputation import analyze_document
result,meta=analyze_document('Sample Reviewer','Sample Trading Co','DEMO-0000','image/png',(Path(__file__).parent/'fixtures/kyc_sample.png').read_bytes())
assert result['anomalies'] or not result['relevant_document'],result
print(json.dumps({'realModel':meta['model'],'fictionalSampleWasFlagged':True,'result':result},ensure_ascii=False),flush=True)
