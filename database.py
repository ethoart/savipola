"""SQLite locally; PostgreSQL/Cloud SQL when DB_HOST is configured."""
import os
import re
import sqlite3
from contextlib import contextmanager

TABLES = ('people', 'products', 'offers', 'demands', 'drivers', 'deliveries',
          'workers', 'jobs', 'stock_events', 'quality_events', 'ai_events')


class PgResult:
    def __init__(self, cursor, lastrowid=None):
        self.cursor = cursor
        self.rowcount = cursor.rowcount
        self.lastrowid = lastrowid

    def fetchone(self):
        return self.cursor.fetchone()

    def fetchall(self):
        return self.cursor.fetchall()


class Postgres:
    def __init__(self):
        import psycopg
        from psycopg.rows import dict_row
        self.raw = psycopg.connect(
            host=os.environ['DB_HOST'], dbname=os.environ.get('DB_NAME', 'savipola'),
            user=os.environ.get('DB_USER', 'savipola'), password=os.environ['DB_PASS'],
            port=int(os.environ.get('DB_PORT', '5432')), connect_timeout=10,
            row_factory=dict_row)

    def execute(self, query, params=()):
        query = query.replace('?', '%s')
        insert = query.lstrip().upper().startswith('INSERT INTO')
        cursor = self.raw.execute(query + (' RETURNING id' if insert else ''), params)
        row = cursor.fetchone() if insert else None
        return PgResult(cursor, row['id'] if row else None)

    def executemany(self, query, params):
        with self.raw.cursor() as cursor:
            cursor.executemany(query.replace('?', '%s'), params)

    def executescript(self, script):
        # Startup schema/seed operations are serialized across Cloud Run instances.
        self.raw.execute('SELECT pg_advisory_xact_lock(7642048)')
        script = re.sub(r'\bid INTEGER PRIMARY KEY\b', 'id SERIAL PRIMARY KEY', script)
        script = re.sub(r'\bREAL\b', 'DOUBLE PRECISION', script)
        for statement in script.split(';'):
            if statement.strip():
                self.raw.execute(statement)

    def sync_sequences(self):
        for table in TABLES:  # Only fixed, trusted table identifiers.
            self.raw.execute(
                f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), "
                f"COALESCE((SELECT MAX(id) FROM {table}), 1), "
                f"EXISTS(SELECT 1 FROM {table}))")


@contextmanager
def connect(local_path):
    pg = bool(os.environ.get('DB_HOST'))
    wrapper = Postgres() if pg else sqlite3.connect(local_path, timeout=20)
    raw = wrapper.raw if pg else wrapper
    if not pg:
        raw.row_factory = sqlite3.Row
        raw.execute('PRAGMA foreign_keys=ON')
        raw.execute('BEGIN IMMEDIATE')
    try:
        yield wrapper
        raw.commit()
    except BaseException:
        raw.rollback()
        raise
    finally:
        raw.close()
