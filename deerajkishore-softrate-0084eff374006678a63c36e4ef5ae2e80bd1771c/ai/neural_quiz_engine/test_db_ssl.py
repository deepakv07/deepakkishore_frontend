import sys
import os
import certifi
from pymongo import MongoClient
from config import DynamicConfig

output_file = "debug_output_ssl_v2.txt"

with open(output_file, "w", encoding="utf-8") as f:
    f.write("Testing MongoDB Connection with SSL/Certifi (Extened)...\n")
    uri = DynamicConfig.MONGODB_URI
    
    try:
        # Try connecting with tlsCAFile
        client = MongoClient(uri, serverSelectionTimeoutMS=10000, tlsCAFile=certifi.where())
        
        # Trigger connection
        f.write("Running ismaster...\n")
        client.admin.command('ismaster')
        f.write("SUCCESS: Connected with certifi!\n")
        
        # Check SkillBuilder Collections
        db_name = 'skillbuilder'
        f.write(f"\nChecking DB: {db_name}\n")
        if db_name in client.list_database_names():
            db = client[db_name]
            colls = db.list_collection_names()
            f.write(f"Collections: {colls}\n")
            
            for coll in colls:
                count = db[coll].count_documents({})
                f.write(f"  - {coll}: {count}\n")
                
                # If this is the quiz collection (e.g., 'quizzes' or 'questions'), peek at one
                if 'quiz' in coll.lower() or 'question' in coll.lower():
                    doc = db[coll].find_one()
                    f.write(f"    Sample doc keys: {list(doc.keys()) if doc else 'None'}\n")
                    if doc and 'quiz_type' in doc:
                        f.write(f"    Sample quiz_type: {doc['quiz_type']}\n")
        else:
            f.write(f"DB '{db_name}' not found in {client.list_database_names()}\n")

    except Exception as e:
        f.write(f"EXCEPTION: {e}\n")
        import traceback
        traceback.print_exc(file=f)

print(f"Debug output written to {output_file}")
