"""
Bandit Scoring Brain - Neural Contextual Bandit
Adaptive scoring using reinforcement learning
"""
import tensorflow as tf
import numpy as np
from typing import Tuple, List, Dict


class BanditScoringBrain(tf.keras.Model):
    """Neural Contextual Bandit for adaptive scoring"""

    def __init__(self, context_size: int = 6, num_arms: int = 3):
        super().__init__()

        self.num_arms = num_arms
        self.context_size = context_size

        # Context processing
        self.context_norm = tf.keras.layers.BatchNormalization()
        self.dense1 = tf.keras.layers.Dense(32, activation='relu')
        self.dense2 = tf.keras.layers.Dense(16, activation='relu')

        # Bandit arms (scoring strategies)
        self.arms = []
        for _ in range(num_arms):
            arm = tf.keras.Sequential([
                tf.keras.layers.Dense(8, activation='relu'),
                tf.keras.layers.Dense(1, activation='sigmoid')
            ])
            self.arms.append(arm)

        # Exploration parameters
        self.epsilon = 0.2  # Exploration rate
        self.arm_counts = tf.Variable(tf.zeros(num_arms), trainable=False)
        self.arm_rewards = tf.Variable(tf.zeros(num_arms), trainable=False)

        # Arm descriptions
        self.arm_descriptions = [
            "Conservative Scoring (High threshold)",
            "Balanced Scoring (Medium threshold)",
            "Liberal Scoring (Rewards partial answers)"
        ]

    def call(self, context: tf.Tensor, training=False) -> Tuple[List[tf.Tensor], tf.Tensor]:
        """Process context through all arms"""
        x = self.context_norm(context)
        x = self.dense1(x)
        x = self.dense2(x)

        # Get predictions from all arms
        predictions = [arm(x) for arm in self.arms]

        if training:
            # Epsilon-greedy exploration
            if tf.random.uniform(()) < self.epsilon:
                arm_idx = tf.random.uniform(
                    (), 0, len(self.arms), dtype=tf.int32)
            else:
                # Choose arm with highest average prediction
                avg_predictions = [tf.reduce_mean(p) for p in predictions]
                arm_idx = tf.argmax(avg_predictions)
        else:
            # Exploitation only
            avg_predictions = [tf.reduce_mean(p) for p in predictions]
            arm_idx = tf.argmax(avg_predictions)

        return predictions, arm_idx

    def score_answer(self, similarity: float, difficulty: float,
                     time_taken: float, topic_mastery: float,
                     previous_performance: float, time_bonus: float = 0.0) -> Tuple[float, int, str]:
        """Score an answer using bandit logic"""
        # Create context vector
        context = self.create_context_vector(
            similarity, difficulty, time_taken,
            topic_mastery, previous_performance, time_bonus
        )

        # Get bandit predictions
        predictions, arm_idx = self(context, training=True)

        # Get score from selected arm
        raw_score = float(predictions[arm_idx].numpy()[0][0])
        
        # --- ZERO TOLERANCE CLAMP ---
        # If the semantic similarity is very low, the bandit should NOT 
        # inflate the score based on other context factors.
        if similarity < 0.15:
             final_score = similarity # Pass through the raw low score (likely 0.0)
             arm_desc = self.arm_descriptions[int(arm_idx.numpy())] + " [GATED]"
             return final_score, int(arm_idx.numpy()), arm_desc
        # ----------------------------

        # --- ENCOURAGING BOOST ---
        # User Feedback: "give them score like 0.8 or 0.9"
        # If similarity is high, we force the score to be high regardless of the bandit arm's opinion (time penalty etc)
        
        # --- AGGRESSIVE GENEROSITY BOOST (User Request) ---
        # The user wants "very excellent" scoring. 
        # We apply a curve that pushes reasonable answers (>0.4) to high scores (>0.75).
        
        if similarity >= 0.85:
             # Almost perfect -> Full marks
             raw_score = 1.0
        elif similarity >= 0.7:
             # Good match -> Excellent score
             raw_score = max(raw_score, 0.95)
        elif similarity >= 0.5:
             # Decent match -> Very Good score
             raw_score = max(raw_score, 0.85)
        elif similarity >= 0.35:
             # Partially relevant -> Good score (Passing)
             raw_score = max(raw_score, 0.70)
             
        # Normalize: If raw_score implies high confidence, ignore lower bandit output
        if similarity > 0.6:
            raw_score = max(raw_score, similarity * 1.3) # 30% boost

        # Apply time bonus
        final_score = min(1.0, raw_score + time_bonus)
        
        # Ensure final score doesn't drop below similarity significantly
        if final_score < similarity * 0.9:
             final_score = similarity
             
        arm_idx_int = int(arm_idx.numpy())

        return final_score, arm_idx_int, self.arm_descriptions[arm_idx_int]

    def create_context_vector(self, similarity: float, difficulty: float,
                              time_taken: float, topic_mastery: float,
                              previous_performance: float, time_bonus: float = 0.0) -> tf.Tensor:
        """Create context vector for bandit"""
        context_values = [
            similarity,                    # Semantic similarity score
            difficulty,                    # Question difficulty
            np.log1p(time_taken) / 10,    # Log normalized time
            topic_mastery,                # User's mastery of topic
            previous_performance,         # User's historical performance
            time_bonus                    # Time efficiency bonus
        ]

        # Ensure correct length
        context_values = context_values[:self.context_size]
        context_values.extend(
            [0.0] * (self.context_size - len(context_values)))

        return tf.constant([context_values], dtype=tf.float32)

    def update_reward(self, arm_idx: int, reward: float):
        """Update bandit with reward feedback"""
        # Update counts and rewards
        one_hot = tf.one_hot(arm_idx, self.num_arms)
        self.arm_counts.assign_add(one_hot)
        self.arm_rewards.assign_add(one_hot * reward)

        # Decay epsilon over time (less exploration as we learn)
        self.epsilon *= 0.995
        self.epsilon = max(0.05, self.epsilon)  # Maintain minimum exploration

    def get_arm_statistics(self) -> Dict:
        """Get statistics for each arm"""
        stats = []
        for i in range(self.num_arms):
            count = float(self.arm_counts[i].numpy())
            reward = float(self.arm_rewards[i].numpy())

            avg_reward = reward / count if count > 0 else 0

            stats.append({
                'arm_id': i,
                'name': self.arm_descriptions[i],
                'selection_count': count,
                'total_reward': reward,
                'avg_reward': avg_reward,
                # Confidence based on usage
                'confidence': min(0.95, count / 100)
            })

        return {
            'arms': stats,
            'exploration_rate': float(self.epsilon),
            'total_selections': float(tf.reduce_sum(self.arm_counts).numpy())
        }

    def save_state(self, filepath: str):
        """Save bandit state to file"""
        state = {
            'arm_counts': self.arm_counts.numpy().tolist(),
            'arm_rewards': self.arm_rewards.numpy().tolist(),
            'epsilon': float(self.epsilon)
        }
        import json
        with open(filepath, 'w') as f:
            json.dump(state, f)

    def load_state(self, filepath: str):
        """Load bandit state from file"""
        import json
        with open(filepath, 'r') as f:
            state = json.load(f)

        self.arm_counts.assign(tf.constant(
            state['arm_counts'], dtype=tf.float32))
        self.arm_rewards.assign(tf.constant(
            state['arm_rewards'], dtype=tf.float32))
        self.epsilon = state['epsilon']
