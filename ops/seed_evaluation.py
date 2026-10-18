"""Idempotent fictional fixtures for the explicitly enabled evaluation deployment.

Run as a one-off Cloud Run job after configuring the two Firebase test users.
This never runs during application startup and never resets trades or stock.
"""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import settings
if not (settings.REVIEW_ONLY or settings.REVIEW_ACCESS) or settings.AUTH_MODE!='firebase':
    raise RuntimeError('This command is restricted to the evaluation build')
from app import conn,one,NOW
import reputation

with conn() as db:
    ids={}
    for uid,name,role,phone,language in (
        ('savipola-review-farmer','Nimal (evaluation)','farmer','+16505550101','si'),
        ('savipola-review-buyer','Green Basket (evaluation)','buyer','+16505550102','en'),
        ('savipola-review-driver','Example transport provider','driver','+16505550103','en'),
        ('savipola-review-worker','Example harvest helper','worker','+16505550104','en')):
        identity=one(db,'SELECT person_id FROM firebase_identities WHERE uid=?',(uid,))
        if identity:
            ids[role]=identity['person_id'];reputation.record_identity(db,identity['person_id'],{'uid':uid,'email':settings.REVIEW_IDENTITIES[uid],'email_verified':False});continue
        existing=one(db,'SELECT id FROM people WHERE name=? AND role=?',(name,role))
        if existing:
            pid=existing['id'];db.execute('INSERT INTO firebase_identities(uid,person_id) VALUES(?,?)',(uid,pid))
            reputation.record_identity(db,pid,{'uid':uid,'email':settings.REVIEW_IDENTITIES[uid],'email_verified':False});ids[role]=pid;continue
        if one(db,'SELECT id FROM people WHERE phone=?',(phone,)):
            raise RuntimeError('Existing evaluation phone needs identity review; no data changed')
        pid=db.execute('INSERT INTO people(name,role,district,phone,avatar) VALUES(?,?,?,?,?)',(name,role,'Dambulla',phone,name[0])).lastrowid
        db.execute('INSERT INTO profiles(person_id,language,bio,is_demo) VALUES(?,?,?,0)',(pid,language,'Shared fictional evaluation account.'))
        db.execute('INSERT INTO firebase_identities(uid,person_id) VALUES(?,?)',(uid,pid))
        reputation.record_identity(db,pid,{'uid':uid,'email':settings.REVIEW_IDENTITIES[uid],'email_verified':False})
        ids[role]=pid
    if not one(db,'SELECT id FROM products WHERE seller_id=?',(ids['farmer'],)):
        for crop,qty,price in (('Tomatoes',300,245),('Green Chilli',120,520),('Beans',160,380),('Bananas',180,210)):
            pid=db.execute('INSERT INTO products(seller_id,crop,district,total_kg,available_kg,price,grade,harvested,created) VALUES(?,?,?,?,?,?,?,?,?)',(ids['farmer'],crop,'Dambulla',qty,qty,price,'Unverified',NOW[:10],NOW)).lastrowid
            db.execute('INSERT INTO stock_events(product_id,event,qty,note,created) VALUES(?,?,?,?,?)',(pid,'Listed',qty,'Fictional evaluation listing',NOW))
    for name,role in (('Example transport provider','driver'),('Example harvest helper','worker')):
        person=one(db,'SELECT id FROM people WHERE name=? AND role=?',(name,role))
        if person:continue
        pid=db.execute('INSERT INTO people(name,role,district,phone,avatar) VALUES(?,?,?,?,?)',(name,role,'Dambulla','','EX')).lastrowid
        db.execute('INSERT INTO profiles(person_id,language,bio,is_demo) VALUES(?,?,?,0)',(pid,'en','Fictional provider for demonstrating a booking request; no real delivery or job is arranged.'))
        if role=='driver':
            db.execute('INSERT INTO drivers(person_id,vehicle,capacity,district,base_fee,per_km,rating) VALUES(?,?,?,?,?,?,?)',(pid,'Example small truck',1000,'Dambulla',500,70,0))
        else:
            db.execute('INSERT INTO workers(person_id,skill,district,rate,unit,bio,rating) VALUES(?,?,?,?,?,?,?)',(pid,'Harvest help','Dambulla',3200,'day','Fictional service listing for evaluation.',0))
print('Evaluation fixtures are ready; existing trades and inventory preserved.')
