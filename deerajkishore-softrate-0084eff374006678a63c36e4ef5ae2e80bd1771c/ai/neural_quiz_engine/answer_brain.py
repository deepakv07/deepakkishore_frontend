"""
Answer Understanding Brain - Mini Siamese Neural Network
Compares user answer vs expected answer using semantic similarity
"""
import tensorflow as tf
import numpy as np
from typing import Tuple, List


class AnswerUnderstandingBrain(tf.keras.Model):
    """Mini Siamese Neural Network for semantic scoring"""

    def __init__(self, vocab_size: int = 5000, embedding_dim: int = 128):
        super().__init__()

        # Shared layers for both answers
        self.text_vectorizer = tf.keras.layers.TextVectorization(
            max_tokens=vocab_size,
            output_sequence_length=50,
            output_mode='int'
        )

        self.embedding = tf.keras.layers.Embedding(
            vocab_size + 1,
            embedding_dim,
            mask_zero=True
        )

        self.lstm = tf.keras.layers.Bidirectional(
            tf.keras.layers.LSTM(32, return_sequences=True)
        )

        self.global_pool = tf.keras.layers.GlobalAveragePooling1D()
        self.dense1 = tf.keras.layers.Dense(16, activation='relu')
        self.normalize = tf.keras.layers.LayerNormalization()

        # Final similarity layer
        self.similarity = tf.keras.layers.Dot(axes=1, normalize=True)
        
        # Initialize with dummy data to prevent "Table not initialized"
        self.adapt_vectorizer(["dummy answer", "correct answer"])

    def adapt_vectorizer(self, texts: List[str]):
        """Initialize the text vectorizer"""
        self.text_vectorizer.adapt(texts)

    def encode_text(self, text: tf.Tensor) -> tf.Tensor:
        """Encode text to vector representation"""
        x = self.text_vectorizer(text)
        x = self.embedding(x)
        x = self.lstm(x)
        x = self.global_pool(x)
        x = self.dense1(x)
        return self.normalize(x)

    def call(self, inputs: Tuple[tf.Tensor, tf.Tensor], training=False) -> tf.Tensor:
        """Compare two answers"""
        answer1, answer2 = inputs

        # Encode both answers
        encoded1 = self.encode_text(answer1)
        encoded2 = self.encode_text(answer2)

        # Calculate cosine similarity
        similarity = self.similarity([encoded1, encoded2])

        # Scale to 0-1 range
        similarity = (similarity + 1) / 2

        return similarity

    def score_answer(self, user_answer: str, correct_answer: str, question_text: str = "") -> float:
        """
        Hybrid Scoring: Neural Vector + Conceptual Keyphrase Matching
        Ensures valid answers get points even if untrained neural vectors miss them.
        """
        import difflib
        import re
        
        # 1. Preprocessing & Spelling Correction
        def normalize_text(text: str) -> str:
            # Basic cleanup
            text = text.lower().strip()
            # Fix common typos manually or with heuristics if needed
            replacements = {
                'asnwer': 'answer', 'fike': 'file', 'delte': 'delete', 
                'usedd': 'used', 'mdoal': 'model', 'dtaabase': 'database'
            }
            for wrong, right in replacements.items():
                text = text.replace(wrong, right)
            return text

        clean_user = normalize_text(str(user_answer))
        clean_correct = normalize_text(str(correct_answer))
        clean_question = normalize_text(str(question_text))
        
        # Basic Validation
        if len(clean_user) < 2: return 0.0

        # --- KEYWORD EXTRACTION & SPELLING CORRECTION ---
        stop_words = {'the', 'is', 'a', 'an', 'and', 'to', 'of', 'it', 'that', 'this', 'in', 'on', 'for', 'with', 'by', 'at'}
        
        def get_meaningful_tokens(text):
            # Split and remove stop words
            tokens = set(re.findall(r'\b\w+\b', text))
            return tokens - stop_words

        user_tokens = get_meaningful_tokens(clean_user)
        correct_tokens = get_meaningful_tokens(clean_correct)
        
        # Spelling Correction using correct answer as dictionary
        corrected_user_tokens = set()
        for token in user_tokens:
            # If token is in correct answer or question, keep it
            if token in correct_tokens:
                corrected_user_tokens.add(token)
            else:
                # Try to find a close match in correct_tokens
                matches = difflib.get_close_matches(token, correct_tokens, n=1, cutoff=0.8)
                if matches:
                    corrected_user_tokens.add(matches[0])
                else:
                    corrected_user_tokens.add(token)
        
        user_tokens = corrected_user_tokens
        
        # --- HALLUCINATION / IRRELEVANCE CHECK ---
        # If user answer has significant words that are NOT in correct answer OR question, penalize.
        # "database" vs "memory/reference"
        
        irrelevant_score = 0.0
        # If correct answer is provided, we can be strict
        if correct_tokens:
            # Calculate how many user tokens are NOT in correct answer
            unexpected_tokens = user_tokens - correct_tokens
            
            # Allow some unexpected tokens (maybe synonyms not in our simple list)
            # But if ratio is high, likely irrelevant
            if len(user_tokens) > 0:
                irrelevance_ratio = len(unexpected_tokens) / len(user_tokens)
                
                # If > 70% of words are unexpected, it's likely wrong context
                if irrelevance_ratio > 0.7:
                     return 0.1 # High Irrelevance Penalty
                elif irrelevance_ratio > 0.5:
                     irrelevant_score = 0.3 # Moderate penalty

        # --- SCORING COMPONENTS ---

        # 2. Neural Score (The "Brain")
        # Lower weight if untrained
        user_vec = self.encode_text(tf.convert_to_tensor([clean_user]))
        correct_vec = self.encode_text(tf.convert_to_tensor([clean_correct]))
        primary_score = tf.matmul(user_vec, correct_vec, transpose_b=True).numpy()[0][0]
        neural_score = (primary_score + 1) / 2

        # 3. Conceptual Score (Jaccard with Correction)
        if not correct_tokens:
            concept_score = 0.0
        else:
            intersection = user_tokens.intersection(correct_tokens)
            concept_score = len(intersection) / len(correct_tokens)

        # 4. Sequence Match (Difflib)
        seq_match = difflib.SequenceMatcher(None, clean_user, clean_correct).ratio()
        
        # 5. Question Awareness (Parrot Check)
        parrot_penalty = 1.0
        if question_text:
            q_tokens = get_meaningful_tokens(clean_question)
            if q_tokens and user_tokens:
                 # Check overlap with question
                 q_overlap = len(user_tokens.intersection(q_tokens))
                 # If user answer is MOSTLY question words (and short), it's a parrot
                 if len(user_tokens) < 10 and (q_overlap / len(user_tokens) > 0.7):
                      parrot_penalty = 0.2

        # --- SYNTHESIS ---
        # Weighted average favors Concept Score (Reliable) over Neural (Experimental)
        # concept_score is now boosted by spelling correction
        
        # adaptive weights
        w_concept = 0.6
        w_seq = 0.2
        w_neural = 0.2
        
        base_score = (concept_score * w_concept) + (seq_match * w_seq) + (neural_score * w_neural)
        
        # Apply penalties
        final_score = base_score * parrot_penalty
        final_score -= irrelevant_score
        
        # Boost for perfect keyword match
        if concept_score > 0.9:
             final_score = max(final_score, 0.95)

        return float(max(0.0, min(1.0, final_score)))

    def generate_explanation(self, user_answer: str, correct_answer: str, question_text: str = "") -> str:
        """
        Generate a detailed explanation for the student's answer using rule-based logic.
        """
        import re
        
        # 1. Normalize
        u_clean = user_answer.strip()
        c_clean = correct_answer.strip()
        
        # Handle empty/short answers
        if not u_clean:
            return "You didn't provide an answer. The correct answer is essential to understand this concept."
        
        # 2. Check for Exact Match
        if u_clean.lower() == c_clean.lower():
            return "Perfect! Your answer exactly matches what we were looking for."
            
        # 3. Keyword Analysis
        stop_words = {'the', 'is', 'a', 'an', 'and', 'to', 'of', 'it', 'that', 'this', 'in', 'on', 'for', 'with', 'by', 'at'}
        
        def get_tokens(text):
            return set(re.findall(r'\b\w+\b', text.lower())) - stop_words

        user_tokens = get_tokens(u_clean)
        correct_tokens = get_tokens(c_clean)
        
        missing_tokens = correct_tokens - user_tokens
        extra_tokens = user_tokens - correct_tokens
        
        # 4. Construct Feedback
        explanation = []
        
        # A. Completeness
        if missing_tokens:
            most_impt_missing = list(missing_tokens)[:3] # Top 3
            explanation.append(f"You missed key concepts like '{', '.join(most_impt_missing)}'.")
            
        # B. Irrelevance
        if extra_tokens and len(correct_tokens) > 0:
            ratio = len(extra_tokens) / len(user_tokens)
            if ratio > 0.5:
                explanation.append("Your answer included information that wasn't quite relevant to the specific question.")
                
        # C. Length/Depth
        if len(user_tokens) < len(correct_tokens) * 0.5:
            explanation.append("Your response was a bit too brief. Try to elaborate more to fully cover the topic.")
            
        # D. Parrot Check (if question text available)
        if question_text:
            q_tokens = get_tokens(question_text)
            if len(user_tokens) > 0 and len(user_tokens.intersection(q_tokens)) / len(user_tokens) > 0.8:
                explanation.append("It looks like you mostly repeated words from the question. Try to explain in your own words.")

        if not explanation:
            # Fallback for when tokens match well but maybe grammar/order is diff (or synonyms used that we didn't catch)
            return f"Your answer is close! Compare it with the suggested answer to see the precise phrasing: '{c_clean}'."
            
        # Final Assemblage
        full_explanation = " ".join(explanation)
        return f"{full_explanation} The correct answer is: '{c_clean}'."

    def score_answers_batch(self, user_answers: List[str],
                            correct_answers: List[str]) -> List[float]:
        """Score multiple answers"""
        scores = []
        for user_ans, correct_ans in zip(user_answers, correct_answers):
            score = self.score_answer(user_ans, correct_ans)
            scores.append(score)

        return scores

    def train_on_pair(self, user_answer: str, correct_answer: str,
                      expected_score: float) -> float:
        """Train on a single answer pair"""
        answers_tensor = (
            tf.convert_to_tensor([user_answer]),
            tf.convert_to_tensor([correct_answer])
        )

        with tf.GradientTape() as tape:
            predicted_score = self(answers_tensor, training=True)
            loss = tf.keras.losses.MSE(expected_score, predicted_score)

        gradients = tape.gradient(loss, self.trainable_variables)
        self.optimizer.apply_gradients(
            zip(gradients, self.trainable_variables))

        return loss.numpy()[0][0]
