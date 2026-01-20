import sys
import os
from database.mongodb_client import mongodb_client
from pymongo import MongoClient

output_file = "debug_output.txt"

with open(output_file, "w", encoding="utf-8") as f:
    f.write("Testing Database Names...\n")
    try:
        if not mongodb_client.client:
            mongodb_client.connect()
        
        # List databases
        f.write("Databases on server:\n")
        try:
            dbs = mongodb_client.client.list_database_names()
            f.write(str(dbs) + "\n")
        except Exception as e:
            f.write(f"Could not list databases: {e}\n")

        current_db = mongodb_client.db_name
        f.write(f"Current Configured DB: {current_db}\n")
        
        # Check collections in current DB
        f.write(f"Collections in {current_db}: {mongodb_client.db.list_collection_names()}\n")
        
        # Check 'questions' count
        count = mongodb_client.db[mongodb_client.QUESTIONS_COLLECTION].count_documents({})
        f.write(f"Questions in {current_db}.{mongodb_client.QUESTIONS_COLLECTION}: {count}\n")

        # Browse all databases
        if dbs:
            for db_name in dbs:
                if db_name in ['local', 'admin', 'config']:
                    continue
                f.write(f"\nScanning DB: {db_name}\n")
                db = mongodb_client.client[db_name]
                colls = db.list_collection_names()
                f.write(f"  Collections: {colls}\n")
                for coll in colls:
                    c = db[coll].count_documents({})
                    f.write(f"    {coll}: {c} docs\n")
            
    except Exception as e:
        f.write(f"EXCEPTION: {e}\n")
        import traceback
        traceback.print_exc(file=f)

print(f"Debug output written to {output_file}")
