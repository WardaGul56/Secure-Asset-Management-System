import psycopg2     ##type of translator between python and postgres
import os
from dotenv import load_dotenv

load_dotenv()
#fill values in this
def get_main_db():
    try:   ##try to prevent crashing,if something goes wrong will jump to except
        conn = psycopg2.connect(
            host=os.getenv("MAIN_DB_HOST"),
            port=os.getenv("MAIN_DB_PORT"),
            dbname=os.getenv("MAIN_DB_NAME"),
            user=os.getenv("MAIN_DB_USER"),
            password=os.getenv("MAIN_DB_PASSWORD")
        )
        return conn
    except Exception as e:       ##error will be saved in variable e
        print(f"main db connection failed: {e}")
        raise
#fill values in this
def get_vault_db():
    try:
        conn = psycopg2.connect(
            host=os.getenv("VAULT_DB_HOST"),
            port=os.getenv("VAULT_DB_PORT"),
            dbname=os.getenv("VAULT_DB_NAME"),
            user=os.getenv("VAULT_DB_USER"),
            password=os.getenv("VAULT_DB_PASSWORD")
        )
        return conn
    except Exception as e:
        print(f"vault db connection failed: {e}")
        raise
##this closes connection after use
def close_db(conn, cur=None): ##connection,cursor
    if cur:
        cur.close()
    if conn:
        conn.close()

##this file is used only for connecting and disconnecting backend with database