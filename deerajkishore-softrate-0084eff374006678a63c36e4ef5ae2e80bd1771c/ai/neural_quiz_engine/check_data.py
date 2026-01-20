import sys
import os
import certifi
from pymongo import MongoClient
from config import DynamicConfig

print("Listing Collections in SkillBuilder...")
uri = DynamicConfig.MONGODB_URI
db_name = DynamicConfig.MONGODB_DATABASE

try:
    client = MongoClient(uri, serverSelectionTimeoutMS=5000, tlsCAFile=certifi.where())
    db = client[db_name]
    
    colls = db.list_collection_names()
    print(f"Collections in '{db_name}': {colls}")
    
    for coll in colls:
        count = db[coll].count_documents({})
        print(f" - {coll}: {count} documents")
        
except Exception as e:
    print(f"Error: {e}")
