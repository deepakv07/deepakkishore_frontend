import requests
import json
import time

url = "http://localhost:8000/submit_quiz_bulk"

payload = {
    "user_id": "test_user_debug_1",
    "quiz_id": "678e0ac82098616110f0dfcf", 
    "quiz_title": "Debug Quiz",
    "answers": [
        {
            "questionId": "q1",
            "answer": "A",
            "timeSpent": 10
        }
    ]
}

print(f"🚀 Sending request to {url}...")
try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"❌ Error: {e}")
