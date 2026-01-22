from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import os
import sys
import logging
from datetime import datetime
import time
import numpy as np
from bson import ObjectId

# Ensure we can import the engine
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from main import NeuralQuizEngine

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NeuralQuizAPI")

app = FastAPI(title="Neural Quiz Engine API", version="3.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Engine
try:
    engine = NeuralQuizEngine()
except Exception as e:
    logger.error(f"Failed to initialize engine: {e}")
    engine = None

class QuizStartRequest(BaseModel):
    user_id: str
    quiz_id: str
    quiz_title: str = "Unknown Quiz"

class QuizAnswerRequest(BaseModel):
    session_id: str
    question_id: str
    user_answer: str
    time_taken: float
    # Optional context if needed for stateless sanity check
    
def serialize_for_api(data):
    """Recursively convert MongoDB and Numpy types to JSON serializable types"""
    # Handle ObjectId
    if isinstance(data, ObjectId):
        return str(data)
    
    # Handle Numpy types
    if hasattr(data, 'tolist'): # Numpy arrays/scalars
        return data.tolist()
    if hasattr(data, 'item'): # Numpy scalars
        return data.item()
        
    # Handle datetime
    if isinstance(data, datetime):
        return data.isoformat()
        
    if isinstance(data, dict):
        return {k: serialize_for_api(v) for k, v in data.items()}
    if isinstance(data, list):
        return [serialize_for_api(i) for i in data]
        
    return data

@app.post("/start_quiz")
def start_quiz(request: QuizStartRequest):
    if not engine:
        raise HTTPException(status_code=500, detail="Engine not initialized")
    
    try:
        logger.info(f"Starting interactive quiz for user {request.user_id}, quiz {request.quiz_id}")
        
        # 1. Load Questions
        all_questions = engine.load_all_questions_for_quiz(request.quiz_id, request.quiz_title)
        
        # 2. Shuffle
        shuffled_questions = engine.orchestrator.shuffle_questions(all_questions, request.user_id)
        
        # 3. Create Session Data Structure
        session_id = f"{request.user_id}_{int(time.time())}"
        
        session_data = {
            'user_id': request.user_id,
            'quiz_id': request.quiz_id,
            'quiz_title': request.quiz_title,
            'session_id': session_id,
            'total_questions': len(shuffled_questions),
            'start_time': datetime.now().isoformat(),
            'questions': shuffled_questions, # All questions stored here
            'questions_attempted': [],
            'current_index': 0, # Track progress
            'performance': {
                'scores': [],
                'time_taken': [],
                'topics_covered': []
            },
            'status': 'in_progress'
        }
        
        # Save session to MongoDB "quiz_sessions" collection for persistence
        engine.db.db['quiz_sessions'].insert_one(session_data)
        
        # Return ONLY session metadata and the FIRST question
        first_question = shuffled_questions[0] if shuffled_questions else None
        
        response = {
            'session_id': session_id,
            'total_questions': len(shuffled_questions),
            'current_index': 0,
            'next_question': first_question
        }
        
        return serialize_for_api(response)

    except Exception as e:
        logger.error(f"Error starting quiz: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/submit_answer")
def submit_answer(request: QuizAnswerRequest):
    if not engine:
        raise HTTPException(status_code=500, detail="Engine not initialized")
        
    try:
        # 1. Retrieve Session
        session = engine.db.db['quiz_sessions'].find_one({'session_id': request.session_id})
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
            
        current_index = session.get('current_index', 0)
        questions = session.get('questions', [])
        
        if current_index >= len(questions):
            return serialize_for_api({'completed': True, 'message': 'Quiz already finished'})
            
        # 2. Get Current Question Data
        current_q = questions[current_index]
        
        # Verify question ID matches (sanity check)
        if str(current_q.get('id', current_q.get('_id'))) != request.question_id and str(current_q.get('question_id')) != request.question_id:
             logger.warning(f"Question ID mismatch: Expected {current_q.get('id')} / {current_q.get('_id')}, Got {request.question_id}")
             # Proceed anyway for robustness in MVP
             
        # 3. Score Answer
        u_ans = request.user_answer
        c_ans = current_q.get('correct_answer', '')
        q_text = current_q.get('question_text', '')
        options = current_q.get('options', [])
        
        is_mcq = bool(options)
        
        if is_mcq:
             if str(u_ans).strip().lower() == str(c_ans).strip().lower():
                 similarity = 1.0
             else:
                 similarity = 0.0
        else:
             similarity = engine.answer_brain.score_answer(u_ans, c_ans, question_text=q_text)
             
        # --- BANDIT SCORING INTEGRATION ---
        # Calculate Context Factors
        difficulty = current_q.get('difficulty', 0.5)
        topics = current_q.get('topics', ['General'])
        primary_topic = topics[0] if topics else 'General'
        
        # Get Mastery Context
        mastery, _ = engine.knowledge_brain.get_mastery(session['user_id'], primary_topic)
        
        # Calculate Time Bonus (if answered faster than 60s)
        time_bonus = 0.0
        expected_time = 60.0
        if request.time_taken < expected_time and similarity > 0.4:
            time_bonus = 0.05 * (1 - (request.time_taken / expected_time))
            
        # Get Previous Performance (Current Session Avg)
        prev_scores = session['performance']['scores']
        prev_perf = (sum(prev_scores) / (len(prev_scores) * 10)) if prev_scores else 0.5
        
        # Call Bandit Brain
        # If MCQ, we force similarity 1.0 or 0.0, but Bandit can still adjust based on time/difficulty if needed?
        # Actually for MCQ, usually it's correct or not. But let's pass it through for consistency if 1.0, 
        # though usually we trust 1.0 as 1.0.
        # For Descriptive (is_mcq=False), this is CRITICAL.
        
        if is_mcq:
            final_score = similarity
            arm_idx = -1
            arm_desc = "MCQ_Exact"
            explanation = f"The correct answer is {c_ans}."
        else:
            final_score, arm_idx, arm_desc = engine.bandit_brain.score_answer(
                similarity=similarity,
                difficulty=difficulty,
                time_taken=request.time_taken,
                topic_mastery=mastery,
                previous_performance=prev_perf,
                time_bonus=time_bonus
            )
            # GENERATE EXPLANATION IMMEDIATELY
            explanation = engine.answer_brain.generate_explanation(
                user_answer=u_ans,
                correct_answer=c_ans,
                question_text=q_text
            )
        
        marks_obtained = final_score * 10
        
        # 4. Update Session Data
        # Append to questions_attempted
        attempt_record = {
             'question_id': request.question_id,
             'question_text': q_text,
             'user_answer': u_ans,
             'correct_answer': c_ans,
             'similarity_score': similarity,
             'marks_obtained': marks_obtained,
             'final_score': final_score,
             'explanation': explanation, # SAVED IMMEDIATELY
             'time_taken': request.time_taken,
             'difficulty': current_q.get('difficulty', 0.5),
             'topics': current_q.get('topics', ['General'])
        }
        
        # Update Knowledge Brain (Partial Update)
        for topic in attempt_record['topics']:
             engine.knowledge_brain.update_knowledge(
                 user_id=session['user_id'],
                 topic=topic,
                 performance=similarity,
                 question_difficulty=attempt_record['difficulty'],
                 time_taken=request.time_taken,
                 time_efficiency=1.0 - (request.time_taken / 120)
             )

        # Update MongoDB Session
        engine.db.db['quiz_sessions'].update_one(
            {'session_id': request.session_id},
            {
                '$push': {
                    'questions_attempted': attempt_record,
                    'performance.scores': marks_obtained,
                    'performance.time_taken': request.time_taken,
                    'performance.topics_covered': {'$each': attempt_record['topics']}
                },
                '$inc': {'current_index': 1}
            }
        )
        
        # 5. Determine Next Step
        next_index = current_index + 1
        
        if next_index < len(questions):
            # Return Next Question
            next_q = questions[next_index]
            response = {
                'completed': False,
                'current_index': next_index,
                'total_questions': len(questions),
                'next_question': next_q,
                'feedback': {
                    'score': marks_obtained,
                    'correct': similarity >= 0.6 if not is_mcq else similarity == 1.0
                }
            }
            return serialize_for_api(response)
            
        else:
            # Quiz Finished - Generate Report
            # Need to re-fetch updated session to get full lists
            final_session = engine.db.db['quiz_sessions'].find_one({'session_id': request.session_id})
            
            # Add Computed Stats for Report Gen
            questions_attempted = final_session['questions_attempted']
            scores = [q['marks_obtained'] for q in questions_attempted]
            total_score = sum(scores)
            times = [q['time_taken'] for q in questions_attempted]
            
            final_session['total_duration'] = sum(times)
            final_session['performance']['average_score'] = (total_score / (len(questions) * 10)) if questions else 0
            final_session['performance']['total_score'] = total_score
            
            # Generate Report
            report = engine.generate_report(final_session)
            
            # Save Report to AI DB (reports collection)
            if report:
                 try:
                     engine.db.save_report(report)
                     logger.info(f"📄 AI Report saved to {engine.db.REPORTS_COLLECTION}")
                 except Exception as e:
                     logger.error(f"Failed to save AI report: {e}")

            # Add Total Score Analysis
            max_possible_score = len(questions) * 10
            percentage = (total_score / max_possible_score * 100) if max_possible_score > 0 else 0
            
            if report:
                report['total_score_analysis'] = {
                    'total_marks_obtained': round(total_score, 2),
                    'max_possible_marks': max_possible_score,
                    'percentage': round(percentage, 2),
                     'summary': f"User scored {round(total_score, 1)}/{max_possible_score} ({round(percentage, 1)}%)"
                }
                
                # --- SYNC WITH MAIN APP ---
                try:
                    logger.info("Syncing completion with main app...")
                    submission_doc = {
                        'quizId': ObjectId(final_session['quiz_id']),
                        'studentId': ObjectId(final_session['user_id']),
                        'answers': [
                            {
                                'questionId': str(qa.get('question_id')),
                                'answer': str(qa.get('user_answer'))
                            } for qa in questions_attempted
                        ],
                        'score': percentage,
                        'totalPoints': max_possible_score,
                        'percentage': percentage,
                        'passed': percentage >= 60,
                        'correctAnswers': len([s for s in scores if s >= 6.0]),
                        'incorrectAnswers': len([s for s in scores if s < 6.0]),
                        'submittedAt': datetime.now(),
                        'createdAt': datetime.now(),
                        'updatedAt': datetime.now()
                    }
                    
                    engine.db.db['quizsubmissions'].insert_one(submission_doc)
                    
                    # Also mark quiz as completed in main quiz collection if needed? 
                    # Usually StudentQuizzes checks quizsubmissions, so just inserting here should be enough.
                    logger.info("✅ Main app sync successful")
                    
                except Exception as sync_e:
                     logger.error(f"❌ Main app sync failed: {sync_e}")
            
            try:
                print("DEBUG: Constructing final response...")
                response = {
                    'completed': True,
                    'report': report,
                     'feedback': {
                        'score': float(marks_obtained), # Ensure native float
                        'correct': bool(similarity >= 0.6 if not is_mcq else similarity == 1.0)
                    }
                }
                print("DEBUG: Serializing response...")
                serialized_response = serialize_for_api(response)
                print("DEBUG: Sending response.")
                return serialized_response
            except Exception as e:
                logger.error(f"❌ Error constructing/serializing response: {e}")
                import traceback
    except Exception as e:
        logger.error(f"Error submitting answer: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class BulkQuizSubmission(BaseModel):
    user_id: str
    quiz_id: str
    quiz_title: str
    answers: List[Dict[str, Any]]  # List of {question_id, answer, time_taken}

@app.post("/submit_quiz_bulk")
def submit_quiz_bulk(request: BulkQuizSubmission):
    if not engine:
        raise HTTPException(status_code=500, detail="Engine not initialized")
    
    try:
        logger.info(f"Processing BULK submission for user {request.user_id}, quiz {request.quiz_id}")
        
        # 1. Load Questions
        all_questions = engine.load_all_questions_for_quiz(request.quiz_id, request.quiz_title)
        
        # 2. Create Pseudo-Session
        session_id = f"{request.user_id}_{int(time.time())}_bulk"
        session_data = {
            'user_id': request.user_id,
            'quiz_id': request.quiz_id,
            'quiz_title': request.quiz_title,
            'session_id': session_id,
            'total_questions': len(all_questions),
            'start_time': datetime.now().isoformat(),
            'questions': all_questions, 
            'questions_attempted': [],
            'performance': {
                'scores': [],
                'time_taken': [],
                'topics_covered': []
            },
            'status': 'completed' # Mark as completed immediately
        }
        
        # 3. Process Answers
        total_score = 0
        
        for ans in request.answers:
            q_id = ans.get('questionId') or ans.get('question_id')
            user_response = ans.get('answer', '')
            time_spent = ans.get('timeSpent', 0) or ans.get('time_taken', 0)
            
            # Find Question
            question = next((q for q in all_questions if str(q.get('id', q.get('_id'))) == str(q_id) or str(q.get('question_id')) == str(q_id)), None)
            
            # Fallback check for index-based IDs (q0, q1...)
            if not question and str(q_id).startswith('q'):
                try:
                    idx = int(str(q_id)[1:])
                    if 0 <= idx < len(all_questions):
                         question = all_questions[idx]
                except:
                    pass
            
            if not question:
                logger.warning(f"Question not found for ID: {q_id}")
                continue
                
            # Score Answer
            c_ans = question.get('correct_answer', '')
            q_text = question.get('question_text', '')
            options = question.get('options', [])
            is_mcq = bool(options)
            
            similarity = 0.0
            
            if is_mcq:
                # Direct Match or Option Index Match
                # Direct Match or Option Index Match
                user_clean = str(user_response).strip().lower()
                correct_clean = str(c_ans).strip().lower()
                
                if user_clean == correct_clean:
                    similarity = 1.0
                else: 
                     # Handle "A", "B", "C", "D" mapping to index
                     similarity = 0.0
                     try:
                         idx = -1
                         if user_clean in ['a', 'b', 'c', 'd']:
                             idx = ord(user_clean) - ord('a')
                         elif user_response.isdigit():
                             idx = int(user_response) - 1
                             
                         if 0 <= idx < len(options):
                             selected_option_text = str(options[idx]).strip().lower()
                             if selected_option_text == correct_clean:
                                 similarity = 1.0
                     except Exception as e:
                         pass
            else:
                # AI Scoring
                similarity = engine.answer_brain.score_answer(user_response, c_ans, question_text=q_text)
                
            # --- BANDIT SCORING INTEGRATION ---
            difficulty = question.get('difficulty', 0.5)
            topics = question.get('topics', ['General'])
            primary_topic = topics[0] if topics else 'General'
            
            # Get Mastery Context (Approximate for bulk, as we update sequentially)
            mastery, _ = engine.knowledge_brain.get_mastery(request.user_id, primary_topic)
            
            # Time Bonus
            time_bonus = 0.0
            expected_time = 60.0
            if time_spent < expected_time and similarity > 0.4:
                time_bonus = 0.05 * (1 - (time_spent / expected_time))
            
            # Previous Performance (Running Avg in this loop)
            current_scores = session_data['performance']['scores']
            prev_perf = (sum(current_scores) / (len(current_scores) * 10)) if current_scores else 0.5
            
            if is_mcq:
                final_score = similarity
                explanation = f"The correct answer is {c_ans}."
            else:
                 final_score, arm_idx, arm_desc = engine.bandit_brain.score_answer(
                    similarity=similarity,
                    difficulty=difficulty,
                    time_taken=time_spent,
                    topic_mastery=mastery,
                    previous_performance=prev_perf,
                    time_bonus=time_bonus
                )
                 explanation = engine.answer_brain.generate_explanation(
                    user_answer=user_response,
                    correct_answer=c_ans,
                    question_text=q_text
                 )

            marks_obtained = final_score * 10
            
            # Update Session Data
            attempt_record = {
                 'question_id': q_id,
                 'question_text': q_text,
                 'user_answer': user_response,
                 'correct_answer': c_ans,
                 'similarity_score': similarity,
                 'marks_obtained': marks_obtained,
                 'final_score': final_score,
                 'explanation': explanation,
                 'time_taken': time_spent,
                 'difficulty': question.get('difficulty', 0.5),
                 'topics': question.get('topics', ['General'])
            }
            
            session_data['questions_attempted'].append(attempt_record)
            session_data['performance']['scores'].append(marks_obtained)
            session_data['performance']['time_taken'].append(time_spent)
            session_data['performance']['topics_covered'].extend(attempt_record['topics']) # Extend list
            
            total_score += marks_obtained
            
            # Update Knowledge Brain
            for topic in attempt_record['topics']:
                 engine.knowledge_brain.update_knowledge(
                     user_id=request.user_id,
                     topic=topic,
                     performance=final_score,
                     question_difficulty=attempt_record['difficulty'],
                     time_taken=time_spent,
                     time_efficiency=1.0 - (time_spent / 120)
                 )

        # 4. Finalize Session Stats
        session_data['total_duration'] = sum(session_data['performance']['time_taken'])
        session_data['performance']['average_score'] = (total_score / (len(all_questions) * 10)) if all_questions else 0
        session_data['performance']['total_score'] = total_score
        
        # 5. Generate Report
        report = engine.generate_report(session_data)
        
        # 6. Save to DB (Reports) - ALREADY HANDLED BY generate_report
        # Removing redundant save to prevent E11000 duplicate key error
                 
        # 7. Return Result
        return serialize_for_api({
            'success': True,
            'report': report,
            'score': total_score,
            'percentage': (total_score / (len(all_questions) * 10) * 100) if all_questions else 0
        })

    except Exception as e:
        logger.error(f"Error in bulk submission: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
