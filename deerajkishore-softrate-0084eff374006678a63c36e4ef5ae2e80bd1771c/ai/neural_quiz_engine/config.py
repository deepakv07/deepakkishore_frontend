"""
Dynamic Configuration Manager for Neural Quiz Engine
No fixed MAX_QUESTIONS - uses ALL available questions
"""
import os
from typing import Dict, Any, Optional
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()


class DynamicConfig:
    """Dynamic configuration without MAX_QUESTIONS limit"""

    # MongoDB Configuration
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    MONGODB_DATABASE = os.getenv('MONGODB_DATABASE', 'skillbuilder')

    # Collections
    QUESTIONS_COLLECTION = os.getenv('QUESTIONS_COLLECTION', 'questions')
    QUIZZES_COLLECTION = os.getenv('QUIZZES_COLLECTION', 'quizzes')
    USERS_COLLECTION = os.getenv('USERS_COLLECTION', 'users')
    QUIZ_SESSIONS_COLLECTION = os.getenv(
        'QUIZ_SESSIONS_COLLECTION', 'quiz_sessions')
    REPORTS_COLLECTION = os.getenv('REPORTS_COLLECTION', 'reports')

    # Quiz Engine Configuration - NO MAX_QUESTIONS
    QUIZ_TIMEOUT_PER_QUESTION = int(
        os.getenv('QUIZ_TIMEOUT_PER_QUESTION', '120'))
    TIME_BONUS_ENABLED = os.getenv(
        'TIME_BONUS_ENABLED', 'true').lower() == 'true'
    MAX_TIME_FOR_BONUS = int(os.getenv('MAX_TIME_FOR_BONUS', '120'))

    # Neural Brains Configuration
    VOCAB_SIZE = int(os.getenv('VOCAB_SIZE', '10000'))
    NUM_TOPICS = int(os.getenv('NUM_TOPICS', '20'))
    ANSWER_VOCAB_SIZE = int(os.getenv('ANSWER_VOCAB_SIZE', '5000'))
    EMBEDDING_DIM = int(os.getenv('EMBEDDING_DIM', '128'))
    CONTEXT_SIZE = int(os.getenv('CONTEXT_SIZE', '6'))
    NUM_ARMS = int(os.getenv('NUM_ARMS', '3'))
    NUM_ROLES = int(os.getenv('NUM_ROLES', '8'))

    # Performance
    ENABLE_CACHING = os.getenv('ENABLE_CACHING', 'true').lower() == 'true'
    CACHE_TTL = int(os.getenv('CACHE_TTL', '300'))

    # Question Loading Strategy
    QUESTION_LOAD_STRATEGY = os.getenv(
        'QUESTION_LOAD_STRATEGY', 'ALL')  # ALL, SAMPLED, TOPIC_BASED

    # For SAMPLED strategy (if not using ALL)
    SAMPLE_SIZE_PERCENTAGE = float(
        os.getenv('SAMPLE_SIZE_PERCENTAGE', '100.0'))  # 100% = ALL

    @classmethod
    def get_question_limit(cls, total_available: int) -> int:
        """
        Dynamically determine how many questions to use
        Returns: Number of questions to use (0 = ALL)
        """
        strategy = cls.QUESTION_LOAD_STRATEGY.upper()

        if strategy == 'ALL':
            return 0  # 0 means ALL in MongoDB query

        elif strategy == 'SAMPLED':
            # Use percentage of available questions
            sample_count = int(total_available *
                               (cls.SAMPLE_SIZE_PERCENTAGE / 100.0))
            return max(10, sample_count)  # At least 10 questions

        elif strategy == 'TOPIC_BASED':
            # Use topic coverage strategy
            return 0  # For now, use ALL

        else:
            # Default: Use ALL questions
            return 0

    @classmethod
    def get_config_summary(cls) -> Dict[str, Any]:
        """Get configuration summary for display"""
        return {
            'mongodb': {
                'uri': cls.MONGODB_URI,
                'database': cls.MONGODB_DATABASE,
                'questions_collection': cls.QUESTIONS_COLLECTION
            },
            'quiz_engine': {
                'question_load_strategy': cls.QUESTION_LOAD_STRATEGY,
                'timeout_per_question': cls.QUIZ_TIMEOUT_PER_QUESTION,
                'time_bonus_enabled': cls.TIME_BONUS_ENABLED,
                'max_questions': 'DYNAMIC (ALL available)',
                'sample_percentage': f"{cls.SAMPLE_SIZE_PERCENTAGE}%" if cls.QUESTION_LOAD_STRATEGY == 'SAMPLED' else 'N/A'
            },
            'neural_brains': {
                'vocab_size': cls.VOCAB_SIZE,
                'num_topics': cls.NUM_TOPICS,
                'num_arms': cls.NUM_ARMS,
                'num_roles': cls.NUM_ROLES
            },
            'performance': {
                'caching_enabled': cls.ENABLE_CACHING,
                'cache_ttl_seconds': cls.CACHE_TTL
            }
        }

    @classmethod
    def save_config(cls, filepath: str = 'config/saved_config.json'):
        """Save current configuration to file"""
        config_data = {
            'generated_at': str(datetime.now()),
            'config': cls.get_config_summary()
        }

        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w') as f:
            json.dump(config_data, f, indent=2)

    @classmethod
    def display_config(cls):
        """Display configuration in terminal"""
        summary = cls.get_config_summary()

        print("\n" + "=" * 60)
        print("⚙️  NEURAL QUIZ ENGINE - DYNAMIC CONFIGURATION")
        print("=" * 60)

        print(f"\n🔗 MONGODB:")
        print(f"   URI: {summary['mongodb']['uri']}")
        print(f"   Database: {summary['mongodb']['database']}")

        print(f"\n🎯 QUIZ ENGINE:")
        print(
            f"   Question Strategy: {summary['quiz_engine']['question_load_strategy']}")
        print(f"   Max Questions: {summary['quiz_engine']['max_questions']}")
        if summary['quiz_engine']['sample_percentage'] != 'N/A':
            print(
                f"   Sample Percentage: {summary['quiz_engine']['sample_percentage']}")
        print(
            f"   Timeout per Question: {summary['quiz_engine']['timeout_per_question']}s")

        print(f"\n🧠 NEURAL BRAINS:")
        print(f"   Topics: {summary['neural_brains']['num_topics']}")
        print(f"   Bandit Arms: {summary['neural_brains']['num_arms']}")
        print(f"   Roles: {summary['neural_brains']['num_roles']}")

        print(f"\n⚡ PERFORMANCE:")
        print(
            f"   Caching: {'Enabled' if summary['performance']['caching_enabled'] else 'Disabled'}")
        if summary['performance']['caching_enabled']:
            print(
                f"   Cache TTL: {summary['performance']['cache_ttl_seconds']}s")

        print("\n" + "=" * 60)
