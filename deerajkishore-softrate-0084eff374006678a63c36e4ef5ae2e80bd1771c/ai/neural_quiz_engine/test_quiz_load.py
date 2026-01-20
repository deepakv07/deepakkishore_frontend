import sys
import os
import traceback

output_file = "quiz_load_debug.txt"
f = open(output_file, "w", encoding="utf-8")

def log(msg):
    print(msg)
    f.write(msg + "\n")
    f.flush()

log("Starting test script...")

try:
    log("Importing mongodb_client...")
    from database.mongodb_client import mongodb_client
    
    log("Fetching quizzes...")
    quizzes = mongodb_client.get_available_quizzes()
    log(f"Quizzes found: {len(quizzes)}")
    
    if not quizzes:
        log("No quizzes found.")
        sys.exit(1)
        
    first_quiz = quizzes[0]
    quiz_id = str(first_quiz['_id'])
    log(f"Selected Quiz: {first_quiz.get('title')} ({quiz_id})")
    
    log("Fetching questions...")
    questions = mongodb_client.get_questions(quiz_id=quiz_id)
    log(f"Questions fetched: {len(questions)}")
    
    if not questions:
        log("No questions in quiz.")
        # Check details
        q_doc = mongodb_client.get_quiz_by_id(quiz_id)
        log(f"Quiz Doc keys: {list(q_doc.keys()) if q_doc else 'None'}")
        if q_doc and 'questions' in q_doc:
            log(f"Questions field type: {type(q_doc['questions'])}")
            log(f"Questions field len: {len(q_doc['questions'])}")
        sys.exit(1)
        
    log("Sample Question 1:")
    log(str(questions[0]))
    
    # Simulate main.py processing
    log("Importing TopicExtractorBrain...")
    from topic_extractor import TopicExtractorBrain
    log("Instantiating TopicExtractorBrain...")
    te = TopicExtractorBrain()
    
    for i, q in enumerate(questions[:3]):
        text = q.get('question_text', '') or q.get('text', '')
        log(f"Extracting topics for Q{i+1}: {text[:30]}...")
        topics = te.extract_topics(text)
        log(f"Topics: {topics}")
        
    log("SUCCESS: Simulation complete.")

except Exception as e:
    log(f"EXCEPTION: {e}")
    traceback.print_exc(file=f)

finally:
    f.close()
