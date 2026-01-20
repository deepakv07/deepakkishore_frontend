from pymongo import MongoClient
import os
import certifi
from dotenv import load_dotenv
from bson.objectid import ObjectId
import json
from datetime import datetime

# Custom JSON encoder
class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return json.JSONEncoder.default(self, o)

load_dotenv()
uri = os.getenv('MONGODB_URI', "mongodb+srv://deepak:deepakswamy%40123@cluster0.sexvvaf.mongodb.net/skillbuilder?appName=Cluster0")
client = MongoClient(uri, tlsCAFile=certifi.where())
db = client['skillbuilder']

# Fetch latest report
report = db['reports'].find_one(sort=[('_id', -1)])

if report:
    print("="*50)
    print(f"📄 LATEST AI REPORT FOR USER: {report.get('user_id')}")
    print("="*50)
    print(json.dumps(report, cls=JSONEncoder, indent=2))
else:
    print("❌ No reports found.")
