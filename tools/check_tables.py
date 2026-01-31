import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

conn = mysql.connector.connect(
    host=os.getenv('DB_HOST'),
    port=int(os.getenv('DB_PORT', 17529)),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'),
    database=os.getenv('DB_NAME', 'railway')
)
cursor = conn.cursor()

print("\n📋 TODAS LAS TABLAS:\n")
cursor.execute("SHOW TABLES")
for table in cursor.fetchall():
    print(f"  - {table[0]}")

cursor.close()
conn.close()
