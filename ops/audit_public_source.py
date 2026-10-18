"""Reject known credential patterns and runtime data before packaging/publication.
A conservative pattern check, not a guarantee that every possible secret is detected.
"""
from pathlib import Path
import re,sys
root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
skip={'.git','.venv','node_modules','__pycache__','.pytest_cache','.firebase'}
patterns=[re.compile(x) for x in (
 r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
 r'\bgh[pousr]_[A-Za-z0-9]{30,}\b',r'\bgithub_pat_[A-Za-z0-9_]{30,}\b',
 r'\bAIza[A-Za-z0-9_-]{30,}\b',r'\bsk-(?:proj-)?[A-Za-z0-9_-]{30,}\b',
 r'"private_key"\s*:\s*"-----',r'"refresh_token"\s*:\s*"[A-Za-z0-9._/-]{20,}"')]
bad=[];count=0
for p in root.rglob('*'):
 if not p.is_file() or any(part in skip for part in p.relative_to(root).parts):continue
 if p.suffix in ('.bundle','.zip','.pyc','.log') or '.sqlite3' in p.name:continue
 if p.name.startswith('.env') or p.suffix in ('.pem','.key'):
  bad.append(str(p.relative_to(root)));continue
 try:text=p.read_text()
 except (UnicodeError,OSError):continue
 count+=1
 if any(pattern.search(text) for pattern in patterns):bad.append(str(p.relative_to(root)))
if bad:
 print('BLOCKED: review possible credentials in these paths:',*bad,sep='\n');sys.exit(1)
print(f'PASS: {count} text files checked; no configured credential pattern detected. Runtime caches/data must still be excluded when packaging.')
