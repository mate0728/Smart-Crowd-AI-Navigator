from utils.db import get_db

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS queues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            wait_time INTEGER
        )
    """)
    conn.commit()
    conn.close()

def get_all_queues():
    conn = get_db()
    rows = conn.execute("SELECT * FROM queues").fetchall()
    conn.close()
    return [dict(row) for row in rows]

def seed_data():
    conn = get_db()
    conn.execute("DELETE FROM queues")
    conn.execute("INSERT INTO queues (name, wait_time) VALUES ('Food Stall 1', 5)")
    conn.execute("INSERT INTO queues (name, wait_time) VALUES ('Food Stall 2', 10)")
    conn.commit()
    conn.close()
