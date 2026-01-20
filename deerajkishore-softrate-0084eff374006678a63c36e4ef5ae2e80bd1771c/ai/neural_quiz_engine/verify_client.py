import sys
import os
from database.mongodb_client import mongodb_client

print("Verifying MongoDB Client Module...")
try:
    print("Running health_check()...")
    is_healthy = mongodb_client.health_check()
    print(f"Health Check Result: {is_healthy}")
    
    if is_healthy:
        print("Fetching quizzes...")
        quizzes = mongodb_client.get_available_quizzes()
        print(f"Quizzes found: {len(quizzes)}")
        for q in quizzes:
            print(f" - {q.get('title')} ({q.get('_id')})")
    else:
        print("Health check failed. Check internal client state.")
        print(f"Client: {mongodb_client.client}")
        # Try ismaster manually to see error
        try:
             mongodb_client.client.admin.command('ismaster')
        except Exception as e:
            print(f"Manual connection test error: {e}")

except Exception as e:
    print(f"EXCEPTION: {e}")
    import traceback
    traceback.print_exc()
