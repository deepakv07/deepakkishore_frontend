"""
Main Quiz Engine - MongoDB ONLY
No sample questions, only real database connection
"""
from lpa_estimation import LPAEstimationBrain
from role_recommendation import RoleRecommendationBrain
from job_readiness import JobReadinessBrain
from knowledge_state import KnowledgeStateBrain
from bandit_scoring import BanditScoringBrain
from answer_brain import AnswerUnderstandingBrain
from topic_extractor import TopicExtractorBrain
from difficulty_adapter import DifficultyAdapterBrain
from orchestrator import QuizOrchestrator
from database.mongodb_client import mongodb_client
import os
import sys
import json
import certifi
import io

# Force UTF-8 encoding for console output (Windows support)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import numpy as np
import traceback

# Import database module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import all neural brains


class NeuralQuizEngine:
    """Main engine - MongoDB ONLY. No sample questions."""

    def __init__(self):
        print("=" * 70)
        print("🧠 NEURAL QUIZ ENGINE - MONGODB ONLY")
        print("=" * 70)

        # Initialize MongoDB connection
        print("\n🔗 Connecting to MongoDB...")
        self.db = mongodb_client

        # Check MongoDB connection
        # Check MongoDB connection
        if not self.db.health_check():
            print("\n⚠️  WARNING: MongoDB health check failed, but attempting to proceed...")
            # We don't raise here, we try to proceed.
            # print("   Please ensure:")
            # print("   1. MongoDB is running on localhost:27017")
            # print("   2. Database 'neural_quiz_db' exists")
            # print("   3. Network connectivity is available")
            
        print("✅ MongoDB connection checked")

        # Initialize all neural brains
        self._initialize_brains()

        # Database stats
        self._show_database_stats()

    def _show_database_stats(self):
        """Show real database statistics"""
        try:
            # Count total questions
            total_questions = self.db.db[self.db.QUESTIONS_COLLECTION].count_documents({
                                                                                       'is_active': True})

            # Count by quiz type
            pipeline = [
                {'$match': {'is_active': True}},
                {'$group': {
                    '_id': '$quiz_type',
                    'count': {'$sum': 1}
                }}
            ]

            cursor = self.db.db[self.db.QUESTIONS_COLLECTION].aggregate(
                pipeline)
            type_counts = list(cursor)

            print("\n📊 DATABASE STATUS:")
            print("-" * 40)
            print(f"   Total Active Questions: {total_questions}")

            if type_counts:
                print(f"\n   📈 QUESTIONS BY QUIZ TYPE:")
                for item in type_counts:
                    quiz_type = item['_id'] or 'general'
                    count = item['count']
                    print(
                        f"     • {quiz_type.upper():<15}: {count:>4} questions")
            else:
                print("   ⚠️  No questions found in database")

        except Exception as e:
            print(f"   ⚠️  Could not load database stats: {e}")

    def _initialize_brains(self):
        """Initialize all 8 neural brains"""
        print("\n🧠 Loading Neural Brains...")

        # Brain 1: Quiz Orchestrator
        self.orchestrator = QuizOrchestrator()

        # Brain 2: Topic Extractor
        self.topic_extractor = TopicExtractorBrain()

        # Brain 3: Answer Understanding
        self.answer_brain = AnswerUnderstandingBrain()

        # Brain 4: Bandit Scoring
        self.bandit_brain = BanditScoringBrain()

        # Brain 5: Knowledge State
        self.knowledge_brain = KnowledgeStateBrain()

        # Brain 6: Job Readiness
        self.job_readiness_brain = JobReadinessBrain()

        # Brain 7: Role Recommendation
        self.role_brain = RoleRecommendationBrain()

        # Brain 8: LPA Estimation
        self.lpa_brain = LPAEstimationBrain()

        print("✅ All 8 Neural Brains Initialized")

    def get_available_quizzes(self) -> List[Dict]:
        """Get all available quizzes from MongoDB"""
        return self.db.get_available_quizzes()

    def load_all_questions_for_quiz(self, quiz_id: str, quiz_title: str = "Unknown Quiz") -> List[Dict]:
        """
        Load ALL available questions for a specific quiz ID
        Returns: List of ALL questions for that quiz
        Throws: Exception if no questions found
        """
        print(f"\n📥 LOADING QUESTIONS FROM MONGODB")
        print(f"   Quiz ID: {quiz_id}")
        print(f"   Title: {quiz_title}")
        print("   Status: Fetching questions...")

        try:
            # Fetch ALL questions for this quiz ID
            questions = self.db.get_questions(
                quiz_id=quiz_id,
                limit=0  # 0 = no limit, get ALL
            )

            if not questions:
                raise ValueError(
                    f"No active questions found for quiz: {quiz_title} ({quiz_id})")

            total_questions = len(questions)
            print(f"✅ SUCCESS: Retrieved {total_questions} questions")

            # Extract topics for each question
            print("   Processing: Extracting topics from questions...")
            for i, question in enumerate(questions, 1):
                if 'question_text' not in question and 'text' in question:
                    question['question_text'] = question['text']
                
                # Normalize correct_answer
                if 'correct_answer' not in question and 'correctAnswer' in question:
                    question['correct_answer'] = question['correctAnswer']
                
                if 'topics' not in question or not question['topics']:
                    text_to_analyze = question.get('question_text', '')
                    topics = self.topic_extractor.extract_topics(text_to_analyze)
                    question['topics'] = topics

            # Show question analysis
            # self._analyze_loaded_questions(questions)

            return questions

        except Exception as e:
            print(f"\n❌ DATABASE ERROR: {e}")
            raise

    def run_comprehensive_quiz(self, user_id: str, quiz_id: str, quiz_title: str) -> Dict:
        """
        Run a complete quiz using ALL questions from MongoDB
        """
        print("\n" + "=" * 70)
        print(f"🎯 STARTING COMPREHENSIVE QUIZ")
        print(f"   User: {user_id}")
        print(f"   Quiz: {quiz_title}")
        print(f"   ID: {quiz_id}")
        print(f"   Source: MongoDB (All Available Questions)")
        print("=" * 70)

        try:
            # Step 1: Load ALL questions for this quiz type
            all_questions = self.load_all_questions_for_quiz(quiz_id, quiz_title)

            # Step 2: Shuffle questions to prevent malpractice
            print(f"\n🔄 Shuffling {len(all_questions)} questions...")
            shuffled_questions = self.orchestrator.shuffle_questions(
                all_questions, user_id)

            # Step 3: Create session data
            session_data = {
                'user_id': user_id,
                'quiz_id': quiz_id,
                'quiz_title': quiz_title,
                'session_id': f"{user_id}_{int(time.time())}",
                'total_questions': len(shuffled_questions),
                'start_time': datetime.now().isoformat(),
                'questions_attempted': [],
                'performance': {
                    'scores': [],
                    'time_taken': [],
                    'topics_covered': set()
                }
            }

            # Step 4: Ask each question
            total_score = 0
            for question_num, question in enumerate(shuffled_questions, 1):
                print(f"\n{'='*50}")
                print(f"📝 QUESTION {question_num}/{len(shuffled_questions)}")
                print(f"{'='*50}")

                # Display question
                print(f"\nTopic: {question.get('topic', 'General')}")
                print(
                    f"Difficulty: {'★' * int(question.get('difficulty', 0.5) * 5)}")
                print(f"\n{question['question_text']}")

                if 'options' in question and question['options']:
                    print("\nOptions:")
                    for idx, option in enumerate(question['options'], 1):
                        print(f"  {idx}. {option}")

                # Get user answer
                start_time = time.time()
                user_answer = input("\n✍️  Your Answer: ").strip()
                time_taken = time.time() - start_time

                # Calculate time bonus
                time_bonus = self.orchestrator.calculate_time_bonus(
                    time_taken, max_time=120)

                # Score the answer
                correct_ans = question.get('correct_answer', question.get('correctAnswer', 'N/A'))
                is_mcq = False
                
                # Check if it's an MCQ
                if 'options' in question and question['options']:
                    is_mcq = True
                    # Debugging MCQ matching
                    print(f"DEBUG: User='{user_answer}', Correct='{correct_ans}', Options={question['options']}")
                    
                    # Direct comparison for MCQ
                    if str(user_answer).strip().lower() == str(correct_ans).strip().lower():
                        similarity = 1.0
                    else:
                        # Try checking if user typed the option text corresponding to index
                        try:
                            # If answer is an index (1, 2, 3...)
                            idx = int(user_answer) - 1
                            if 0 <= idx < len(question['options']):
                                selected_option = question['options'][idx]
                                # Debug match
                                print(f"DEBUG: Selected Option: '{selected_option}' vs Correct: '{correct_ans}'")
                                if str(selected_option).strip().lower() == str(correct_ans).strip().lower():
                                    similarity = 1.0
                                else:
                                    similarity = 0.0
                            else:
                                similarity = 0.0
                        except ValueError:
                            similarity = 0.0
                else:
                    # Descriptive: Use AI Brain
                    similarity = self.answer_brain.score_answer(
                        user_answer, 
                        correct_ans,
                        question_text=question.get('question_text', '')
                    )

                # Get topic mastery for context
                topic_mastery = 0.5
                for topic in question.get('topics', [question.get('topic', 'General')]):
                    mastery, _ = self.knowledge_brain.get_mastery(
                        user_id, topic)
                    topic_mastery += mastery
                topic_mastery /= len(question.get('topics', ['General']))

                # Get previous performance
                prev_performance = np.mean(session_data['performance']['scores']) \
                    if session_data['performance']['scores'] else 0.5

                # Bandit scoring - ONLY if not MCQ override
                # If MCQ, we want strict 1.0 or 0.0
                if is_mcq:
                    final_score = similarity
                    arm_desc = "Deterministic (MCQ)"
                    # We can still run bandit to "train" it or just skip
                    # To keep code simple, we'll skip bandit call for final_score assignment
                else:
                    final_score, arm_used, arm_desc = self.bandit_brain.score_answer(
                        similarity=similarity,
                        difficulty=question.get('difficulty', 0.5),
                        time_taken=time_taken,
                        topic_mastery=topic_mastery,
                        previous_performance=prev_performance,
                        time_bonus=time_bonus
                    )

                # Update knowledge state
                for topic in question.get('topics', [question.get('topic', 'General')]):
                    self.knowledge_brain.update_knowledge(
                        user_id=user_id,
                        topic=topic,
                        performance=final_score,
                        question_difficulty=question.get('difficulty', 0.5),
                        time_taken=time_taken,
                        time_efficiency=1.0 - (time_taken / 120)
                    )

                # Store result
                question_result = {
                    'question_id': question.get('id', question_num),
                    'question_text': question['question_text'],
                    'user_answer': user_answer,
                    'correct_answer': question['correct_answer'],
                    'similarity_score': round(similarity, 3),
                    'final_score': round(final_score, 3),
                    'time_taken': round(time_taken, 2),
                    'time_bonus': round(time_bonus, 3),
                    'difficulty': question.get('difficulty', 0.5),
                    'topics': question.get('topics', [question.get('topic', 'General')]),
                    'scoring_arm': arm_desc
                }

                session_data['questions_attempted'].append(question_result)
                session_data['performance']['scores'].append(final_score)
                session_data['performance']['time_taken'].append(time_taken)
                session_data['performance']['topics_covered'].update(
                    question.get('topics', [question.get('topic', 'General')])
                )

                total_score += final_score

                # Display immediate feedback
                print(f"\n✅ Score for this question: {final_score:.2f}/1.0")
                print(
                    f"   Time: {time_taken:.1f}s | Similarity: {similarity:.2f}")
                print(f"   Scoring Strategy: {arm_desc}")

            # Step 5: Finalize session
            session_data['end_time'] = datetime.now().isoformat()
            
            # Calculate total duration by summing time taken for each question
            total_duration = sum(q.get('time_taken', 0.0) for q in session_data['questions_attempted'])
            session_data['total_duration'] = total_duration

            session_data['performance']['average_score'] = total_score / \
                len(shuffled_questions) if shuffled_questions else 0
            session_data['performance']['total_score'] = total_score
            
            # Convert sets to lists for MongoDB serialization
            session_data['performance']['topics_covered'] = list(session_data['performance']['topics_covered'])

            print(f"\n{'='*70}")
            print(f"📊 QUIZ COMPLETED!")
            print(f"{'='*70}")
            print(f"Total Questions: {len(shuffled_questions)}")
            print(f"Total Score: {session_data['performance']['total_score']:.2f}/{len(shuffled_questions)}.0")
            print(
                f"Average Score: {session_data['performance']['average_score']:.2f}/1.0")
            print(f"Total Time: {session_data['total_duration']:.1f} seconds")
            print(
                f"Topics Covered: {len(session_data['performance']['topics_covered'])}")

            # Save session to MongoDB
            try:
                session_id = self.db.save_quiz_session(session_data)
                print(f"📝 Session saved to MongoDB: {session_id}")
            except Exception as e:
                print(f"⚠️  Could not save session to MongoDB: {e}")

            return session_data

        except KeyboardInterrupt:
            print("\n\n⚠️  Quiz interrupted by user.")
            return {'error': 'Quiz interrupted', 'questions_attempted': session_data.get('questions_attempted', [])}

        except Exception as e:
            print(f"\n❌ ERROR during quiz: {e}")
            traceback.print_exc()
            return {'error': str(e)}

    def generate_report(self, session_data: Dict) -> Optional[Dict]:
        """Generate comprehensive report from quiz session"""
        if 'error' in session_data:
            print(
                f"\n❌ Cannot generate report due to error: {session_data['error']}")
            return None

        print("\n📈 GENERATING COMPREHENSIVE REPORT...")

        try:
            user_id = session_data['user_id']
            avg_score = session_data['performance']['average_score']

            # Get topic mastery
            topic_mastery = {}
            # Ensure topics_covered is a list (handled in run_comprehensive_quiz but good to be safe)
            all_topics = list(session_data['performance']['topics_covered'])

            for topic in all_topics:
                mastery, confidence = self.knowledge_brain.get_mastery(
                    user_id, topic)
                topic_mastery[topic] = {
                    'mastery': mastery,
                    'confidence': confidence,
                    'level': 'Expert' if mastery >= 0.8 else
                    'Advanced' if mastery >= 0.6 else
                    'Intermediate' if mastery >= 0.4 else
                    'Beginner'
                }

            # Get strengths and weaknesses based on THIS SESSION's performance
            session_strengths = set()
            session_weaknesses = set()
            
            for q_data in session_data['questions_attempted']:
                score = q_data['final_score']
                
                # Active Topic Extraction from Question Text with Context
                # We do this NOW to ensure we have granular topics even if DB was generic
                text_to_analyze = q_data.get('question_text', '') 
                quiz_context = session_data.get('quiz_title', '')
                q_topics = self.topic_extractor.extract_topics(text_to_analyze, context=quiz_context)
                
                if score >= 0.6:
                    for t in q_topics:
                         session_strengths.add(t)
                elif score < 0.6:
                    for t in q_topics:
                         session_weaknesses.add(t)
            
            # Clean up overlap: If a topic is in both, consider it a weakness (needs improvement)
            strengths = list(session_strengths - session_weaknesses)
            weaknesses = list(session_weaknesses)

            # Calculate job readiness
            # Assuming 20 possible topics
            topic_coverage = len(all_topics) / 20
            consistency = 1 - np.std(session_data['performance']['scores']) \
                if len(session_data['performance']['scores']) > 1 else 0.5

            readiness_result = self.job_readiness_brain.calculate_readiness(
                accuracy=avg_score,
                topic_coverage=topic_coverage,
                avg_difficulty=np.mean(
                    [q['difficulty'] for q in session_data['questions_attempted']]),
                consistency=consistency,
                time_efficiency=0.7  # Could calculate from time_taken
            )

            # --- LPA & Role Integration ---
            # 1. Get mastery vector for Role Brain (10 specific topics)
            role_brain_topics = self.role_brain.topic_names
            mastery_vector = []
            for t in role_brain_topics:
                 m, _ = self.knowledge_brain.get_mastery(user_id, t)
                 mastery_vector.append(m)
            
            # 2. Get Role Recommendation
            role_recs = self.role_brain.recommend_roles(mastery_vector, weaknesses)
            best_role = role_recs['top_recommendation']['name']

            # 3. Estimate LPA
            lpa_result = self.lpa_brain.estimate_lpa(
                job_readiness=readiness_result['readiness_score'],
                role=best_role,
                topic_depth=np.mean(mastery_vector) if mastery_vector else 0.5,
                consistency=consistency,
                quiz_complexity=np.mean([q['difficulty'] for q in session_data['questions_attempted']]),
                experience_years=0.0  # Assuming fresher for valid comparison
            )
            # -------------------------------

            # -------------------------------

            # Generate report
            report = {
                'report_id': f"report_{user_id}_{int(time.time())}",
                'generated_at': datetime.now().isoformat(),
                'user_id': user_id,
                'session_id': session_data['session_id'],
                'quiz_summary': {
                    'total_questions': session_data['total_questions'],
                    'questions_attempted': len(session_data['questions_attempted']),
                    'average_score': round(avg_score, 3),
                    'total_duration': round(session_data['total_duration'], 1)
                },
                # --- NEW: Consolidated Quick View (User Request) ---
                'quick_summary_view': {
                    'performance': {
                        'questions': f"{len(session_data['questions_attempted'])}/{session_data['total_questions']}",
                        'average_score': f"{avg_score:.2f}/1.0",
                        'duration': f"{session_data['total_duration']:.1f}s"
                    },
                    'job_readiness': {
                        'score': f"{readiness_result['readiness_score']:.1f}/100",
                        'level': readiness_result['readiness_level']
                    },
                    'market_value': {
                        'estimated_role': best_role,
                        'expected_lpa': f"₹{lpa_result['expected_salary']} Lakhs/Year",
                        'salary_range': f"{lpa_result['salary_range']['min']} - {lpa_result['salary_range']['max']} LPA"
                    },
                    'knowledge_analysis': {
                        'strengths': strengths if strengths else ["None"],
                        'weaknesses': weaknesses if weaknesses else ["None"],
                        'topics_covered': len(all_topics)
                    }
                },
                # ---------------------------------------------------
                'job_readiness': readiness_result,
                'lpa_estimation': {
                     'estimated_lpa': lpa_result['expected_salary'],
                     'role': best_role,
                     'range': f"{lpa_result['salary_range']['min']} - {lpa_result['salary_range']['max']} LPA"
                },
                'topic_analysis': {
                    'strengths': strengths,
                    'weaknesses': weaknesses,
                    'total_topics_covered': len(all_topics)
                }
            }

            # Convert to native types for MongoDB
            report = self._convert_to_native_types(report)

            # Save report to MongoDB
            try:
                report_id = self.db.save_report(report)
                print(f"📄 Report saved to MongoDB: {report_id}")
            except Exception as e:
                print(f"⚠️  Could not save report to MongoDB: {e}")

            return report

        except Exception as e:
            print(f"❌ Error generating report: {e}")
            traceback.print_exc()
            return None

    def _convert_to_native_types(self, data):
        """Recursively convert numpy types to native Python types"""
        if isinstance(data, dict):
            return {k: self._convert_to_native_types(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._convert_to_native_types(i) for i in data]
        elif isinstance(data, (np.integer, np.int64, np.int32)):
            return int(data)
        elif isinstance(data, (np.floating, np.float64, np.float32)):
            return float(data)
        elif isinstance(data, np.ndarray):
            return self._convert_to_native_types(data.tolist())
        else:
            return data

    def interactive_mode(self):
        """Interactive quiz mode - Streamlined"""
        print("\n" + "=" * 70)
        print("🎮 NEURAL QUIZ ENGINE")
        print("=" * 70)

        try:
            # Get available quizzes
            quizzes = self.get_available_quizzes()
            
            if not quizzes:
                print("\n❌ No quizzes found in database!")
                return

            print(f"\n📚 FOUND {len(quizzes)} QUIZZES:")
            for i, q in enumerate(quizzes, 1):
                title = q.get('title', 'Untitled Quiz')
                qid = q.get('_id', 'Unknown ID')
                print(f"  {i}. {title} (ID: {qid})")

            selected_quiz = None
            while not selected_quiz:
                quiz_choice = input("\nSelect quiz (number or ID): ").strip()
                
                # Check for exit
                if quiz_choice.lower() in ['exit', 'quit', 'q']:
                    print("👋 Exiting.")
                    self.db.close()
                    return

                if quiz_choice.isdigit():
                    idx = int(quiz_choice) - 1
                    if 0 <= idx < len(quizzes):
                        selected_quiz = quizzes[idx]
                else:
                    # Try to find by ID string
                    for q in quizzes:
                        if str(q.get('_id')) == quiz_choice:
                            selected_quiz = q
                            break
                
                if not selected_quiz:
                    print("❌ Invalid selection. Please try again or type 'exit'.")

            quiz_id = str(selected_quiz['_id'])
            quiz_title = selected_quiz.get('title', 'Unknown Quiz')

            # Auto-generate guest user ID
            user_id = f"guest_{int(time.time())}"
            print(f"\n👤 Starting session as: {user_id}")

            # Run quiz
            session_data = self.run_comprehensive_quiz(
                user_id, quiz_id, quiz_title)

            # Generate report
            if 'error' not in session_data:
                report = self.generate_report(session_data)
                if report:
                    self.display_report_summary(report)
            
            # Cleanup
            self.db.close()
            print("\n👋 Quiz completed.")

        except KeyboardInterrupt:
            print("\n\n⚠️  Interrupted by user.")
            self.db.close()
        except Exception as e:
            print(f"\n❌ Error: {e}")
            self.db.close()

    def display_report_summary(self, report: Dict):
        """Display report summary"""
        print("\n" + "=" * 70)
        print("📋 QUIZ REPORT - SUMMARY")
        print("=" * 70)

        quiz = report['quiz_summary']
        print(f"\n📊 PERFORMANCE:")
        print(
            f"   Questions: {quiz['questions_attempted']}/{quiz['total_questions']}")
        print(f"   Average Score: {quiz['average_score']:.2f}/1.0")
        print(f"   Duration: {quiz['total_duration']:.1f}s")

        readiness = report['job_readiness']
        print(f"\n🎯 JOB READINESS:")
        print(f"   Score: {readiness['readiness_score']}/100")
        print(f"   Level: {readiness['readiness_level']}")
        
        # Display LPA Estimation
        if 'lpa_estimation' in report:
            lpa = report['lpa_estimation']
            print("\n💰 MARKET VALUE ANALYSIS:")
            print(f"   Estimated Role: {lpa['role']}")
            print(f"   Expected LPA: ₹{lpa['estimated_lpa']} Lakhs/Year")
            print(f"   Salary Range: {lpa['range']}")

        analysis = report['topic_analysis']
        print(f"\n🧠 KNOWLEDGE ANALYSIS:")
        print(
            f"   Strengths: {', '.join(analysis['strengths'][:3]) if analysis['strengths'] else 'None'}")
        print(
            f"   Weaknesses: {', '.join(analysis['weaknesses'][:3]) if analysis['weaknesses'] else 'None'}")
        print(f"   Topics Covered: {analysis['total_topics_covered']}")

        print("\n" + "=" * 70)


def main():
    """Main entry point"""
    try:
        # Initialize the engine
        engine = NeuralQuizEngine()

        # Start interactive mode
        engine.interactive_mode()

    except ConnectionError as e:
        print(f"\n❌ CRITICAL: {e}")
        print("\n🔧 TROUBLESHOOTING:")
        print("   1. Start MongoDB: `mongod` or `sudo systemctl start mongod`")
        print(
            "   2. Check if MongoDB is running: `mongo --eval 'db.runCommand({ping:1})'`")
        print("   3. Create database: `use neural_quiz_db` in mongo shell")
        print("   4. Add questions to the database")
        print("\n📚 For MongoDB installation:")
        print("   Ubuntu: `sudo apt install mongodb`")
        print("   Mac: `brew install mongodb-community`")
        print("   Windows: Download from mongodb.com")

    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    main()
