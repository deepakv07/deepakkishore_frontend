"""
Quiz Orchestrator Brain - Control Plane
Deterministic logic for quiz flow control
"""
import random
import hashlib
import numpy as np
from datetime import datetime
from typing import List, Dict
import json


class QuizOrchestrator:
    """Deterministic logic for quiz flow control"""

    def __init__(self, seed=42):
        self.seed = seed
        random.seed(seed)
        np.random.seed(seed)

    def shuffle_questions(self, questions: List[Dict], user_id: str) -> List[Dict]:
        """Deterministic shuffle based on user ID"""
        # Create unique seed per user session
        session_hash = hashlib.md5(
            f"{user_id}_{datetime.now().date()}".encode()).hexdigest()
        session_seed = int(session_hash[:8], 16)

        # Create a copy and shuffle
        shuffled = questions.copy()
        random.seed(session_seed)
        random.shuffle(shuffled)

        # Return exactly 10 questions
        return shuffled[:10]

    def select_questions(self, all_questions: List[Dict], quiz_type: str, user_id: str) -> List[Dict]:
        """Select and shuffle questions for a specific quiz type"""
        filtered = [q for q in all_questions if q.get(
            'quiz_type') == quiz_type]
        return self.shuffle_questions(filtered, user_id)

    def format_question_for_display(self, question: Dict, question_num: int) -> str:
        """Format question for terminal display"""
        display = f"\n{'='*50}"
        display += f"\n📝 Question {question_num}/10"
        display += f"\n{'='*50}"
        display += f"\nTopic: {question.get('topic', 'General')}"
        display += f"\nDifficulty: {'★' * int(question.get('difficulty', 0.5) * 5)}"
        display += f"\n\n{question['question_text']}"

        if 'options' in question and question['options']:
            display += "\n\nOptions:"
            for idx, option in enumerate(question['options'], 1):
                display += f"\n{idx}. {option}"

        return display

    def calculate_time_bonus(self, time_taken: float, max_time: float = 120) -> float:
        """Calculate time bonus for answering quickly"""
        if time_taken <= 0:
            return 0.0

        # Bonus decays linearly with time
        bonus = max(0, 1.0 - (time_taken / max_time))
        return bonus * 0.1  # Max 10% bonus
