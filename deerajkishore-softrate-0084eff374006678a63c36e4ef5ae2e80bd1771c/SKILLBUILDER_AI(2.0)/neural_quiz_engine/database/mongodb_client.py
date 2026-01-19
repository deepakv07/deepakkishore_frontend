import sys
import os
import certifi
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from config import DynamicConfig

from bson.objectid import ObjectId

class MongoDBClient:
    def __init__(self):
        self.uri = DynamicConfig.MONGODB_URI
        self.db_name = DynamicConfig.MONGODB_DATABASE
        self.client = None
        self.db = None
        
        # Expose collection names from config
        self.QUESTIONS_COLLECTION = DynamicConfig.QUESTIONS_COLLECTION
        self.QUIZZES_COLLECTION = getattr(DynamicConfig, 'QUIZZES_COLLECTION', 'quizzes')
        self.USERS_COLLECTION = DynamicConfig.USERS_COLLECTION
        self.QUIZ_SESSIONS_COLLECTION = DynamicConfig.QUIZ_SESSIONS_COLLECTION
        self.REPORTS_COLLECTION = DynamicConfig.REPORTS_COLLECTION
        
        self.connect()

    def connect(self):
        try:
            # Use certifi for SSL certificate verification
            self.client = MongoClient(
                self.uri, 
                serverSelectionTimeoutMS=10000,
                tlsCAFile=certifi.where()
            )
            self.db = self.client[self.db_name]
        except Exception as e:
            print(f"Error connecting to MongoDB: {e}")

    def health_check(self) -> bool:
        """Check if MongoDB connection is active"""
        try:
            if not self.client:
                self.connect()
            # The ismaster command is cheap and does not require auth.
            self.client.admin.command('ismaster')
            return True
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            print(f"Health Check Connection Failed: {e}")
            return False
        except Exception as e:
            print(f"Health Check Failed: {e}")
            return False

    def get_available_quizzes(self):
        """Fetch all available quizzes with their IDs and titles"""
        try:
            cursor = self.db[self.QUIZZES_COLLECTION].find({}, {'title': 1, '_id': 1})
            return list(cursor)
        except Exception as e:
            print(f"Error fetching quizzes: {e}")
            return []

    def get_quiz_by_id(self, quiz_id: str):
        """Fetch a specific quiz by its ID"""
        try:
            if isinstance(quiz_id, str):
                quiz_id = ObjectId(quiz_id)
            return self.db[self.QUIZZES_COLLECTION].find_one({'_id': quiz_id})
        except Exception as e:
            print(f"Error fetching quiz {quiz_id}: {e}")
            return None

    def get_questions(self, quiz_type: str = None, limit: int = 0, quiz_id: str = None):
        """
        Fetch questions from MongoDB.
        If quiz_id is provided, fetches questions from that specific quiz document.
        Otherwise fetches from the central questions collection.
        """
        try:
            # Plan A: Fetch from specific Quiz document
            if quiz_id:
                quiz = self.get_quiz_by_id(quiz_id)
                if quiz and 'questions' in quiz:
                    questions = quiz['questions']
                    # Ensure they look like questions (if they are just objects, pass them through)
                    # If they are IDs, we would need to fetch them (assuming embedded for now based on 'questions' field existing)
                    if limit > 0:
                        return questions[:limit]
                    return questions
                else:
                    print(f"Warning: Quiz {quiz_id} not found or has no questions.")
                    return []

            # Plan B: Fetch from global questions collection (legacy mode)
            query = {'is_active': True}
            if quiz_type and quiz_type.lower() != 'all':
                query['quiz_type'] = quiz_type
            
            cursor = self.db[self.QUESTIONS_COLLECTION].find(query)
            
            if limit > 0:
                cursor = cursor.limit(limit)
                
            return list(cursor)
        except Exception as e:
            print(f"Error fetching questions: {e}")
            return []

    def save_quiz_session(self, session_data: dict) -> str:
        """Save quiz session to MongoDB"""
        try:
            result = self.db[self.QUIZ_SESSIONS_COLLECTION].insert_one(session_data)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error saving session: {e}")
            raise

    def save_report(self, report_data: dict) -> str:
        """Save report to MongoDB"""
        try:
            result = self.db[self.REPORTS_COLLECTION].insert_one(report_data)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error saving report: {e}")
            raise

    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()

# Singleton instance
mongodb_client = MongoDBClient()
