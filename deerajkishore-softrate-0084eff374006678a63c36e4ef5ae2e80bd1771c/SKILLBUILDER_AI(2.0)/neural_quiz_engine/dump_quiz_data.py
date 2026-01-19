from database.mongodb_client import mongodb_client

def dump_data():
    db = mongodb_client
    # Get one quiz to be safe
    quizzes = db.get_available_quizzes()
    if not quizzes:
        print("No quizzes found")
        return

    q_id = quizzes[0]['id']
    print(f"Dumping questions for quiz: {q_id}")
    questions = db.get_questions(q_id, limit=5)
    
    for i, q in enumerate(questions):
        print(f"\n--- Question {i+1} ---")
        print(f"ID: {q.get('_id')}")
        print(f"Correct Answer (Raw): {repr(q.get('correct_answer'))}")
        # Check alternate key
        if 'correctAnswer' in q:
             print(f"correctAnswer (Raw): {repr(q.get('correctAnswer'))}")
        
        if 'options' in q:
             print(f"Options (Raw): {repr(q['options'])}")
             # Print type of first option
             if q['options']:
                 print(f"Type of Option[0]: {type(q['options'][0])}")
        else:
             print("No options found")

if __name__ == "__main__":
    dump_data()
