
import os
from pymongo import MongoClient
import certifi
from dotenv import load_dotenv
from bson.objectid import ObjectId
import sys
import pprint

# Load .env explicitly
load_dotenv()

uri = os.getenv('MONGODB_URI')
if not uri:
    print("❌ MONGODB_URI not found")
    sys.exit(1)

client = MongoClient(uri, tlsCAFile=certifi.where())
db = client[os.getenv('MONGODB_DATABASE', 'skillbuilder')]

TARGET_ID = "6971a918638a4aada91e2be6"

print(f"--- INSPECTING QUIZ: {TARGET_ID} ---")
try:
    # Try finding by String ID first (some frameworks store as string)
    quiz = db.quizzes.find_one({'_id': TARGET_ID})
    if not quiz:
        print("Not found by String ID. Trying ObjectId...")
        try:
            quiz = db.quizzes.find_one({'_id': ObjectId(TARGET_ID)})
        except:
            print("Invalid ObjectId format.")

    if quiz:
        print(f"✅ FOUND QUIZ: {quiz.get('title')}")
        print(f"Type of '_id': {type(quiz['_id'])}")
        
        if 'questions' in quiz:
            q_data = quiz['questions']
            print(f"Type of 'questions': {type(q_data)}")
            if isinstance(q_data, list):
                print(f"Length: {len(q_data)}")
                if len(q_data) > 0:
                    print(f"Sample Item Type: {type(q_data[0])}")
                    print(f"Sample Item: {q_data[0]}")
                else:
                    print("⚠️ 'questions' list is EMPTY.")
            else:
                print(f"⚠️ 'questions' is NOT a list.")
        else:
            print("❌ 'questions' field MISSING.")
    else:
        print("❌ QUIZ NOT FOUND in DB.")

except Exception as e:
    print(f"Error: {e}")
