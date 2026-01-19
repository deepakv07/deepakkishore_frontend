from pymongo import MongoClient
import os
import certifi
from dotenv import load_dotenv
from bson.objectid import ObjectId
import json
from datetime import datetime

# Custom JSON encoder for datetime and ObjectId
class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return json.JSONEncoder.default(self, o)

load_dotenv()

# Use the same URI as the app
uri = os.getenv('MONGODB_URI', "mongodb+srv://deepak:deepakswamy%40123@cluster0.sexvvaf.mongodb.net/skillbuilder?appName=Cluster0")
client = MongoClient(uri, tlsCAFile=certifi.where())
db = client['skillbuilder'] # Explicitly use skillbuilder based on previous logs

print("="*50)
print("📊 DATABASE INSPECTION (Latest Entries)")
print("="*50)

# Write to file
with open('db_dump.txt', 'w', encoding='utf-8') as f:
    f.write("=== REPORTS ===\n")
    reports = list(db['reports'].find().sort('_id', -1).limit(3))
    if reports:
        for r in reports:
            f.write(f"ID: {r.get('_id')} | User: {r.get('user_id')} | Date: {r.get('generated_at')}\n")
    else:
        f.write("No reports found.\n")

    f.write("\n=== SUBMISSIONS ===\n")
    subs = list(db['quizsubmissions'].find().sort('_id', -1).limit(3))
    if subs:
        for s in subs:
            f.write(f"ID: {s.get('_id')} | Quiz: {s.get('quizId')} | AI: {s.get('aiProcessed')} | Report: {s.get('aiReportId')} | Score: {s.get('score')}\n")
    else:
        f.write("No quiz submissions found.\n")

print("Dumped to db_dump.txt")

print("\n"+"="*50)
