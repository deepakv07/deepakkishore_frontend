
from database.mongodb_client import mongodb_client

quiz_id = "695fb44ab4cc52c1cb08c0b0"
print(f"Inspecting quiz: {quiz_id}")

try:
    quiz = mongodb_client.get_quiz_by_id(quiz_id)
    if not quiz:
        print("Quiz not found!")
    else:
        questions = quiz.get('questions', [])
        print(f"Total questions: {len(questions)}")
        for i, q in enumerate(questions):
            has_snake = 'correct_answer' in q
            has_camel = 'correctAnswer' in q
            print(f"Q{i+1}: correct_answer={has_snake}, correctAnswer={has_camel}")
            if not has_snake and not has_camel:
                print(f"  KEYS: {list(q.keys())}")

except Exception as e:
    print(f"Error: {e}")
