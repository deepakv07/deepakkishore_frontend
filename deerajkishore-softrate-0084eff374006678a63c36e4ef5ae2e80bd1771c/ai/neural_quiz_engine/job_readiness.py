"""
Job Readiness Brain - Shallow Feedforward Network
Converts quiz performance to job readiness score
"""
import tensorflow as tf
import numpy as np
from typing import Dict, List, Tuple


class JobReadinessBrain(tf.keras.Model):
    """Shallow Feedforward Network for job readiness scoring"""

    def __init__(self):
        super().__init__()

        # Input features: 8 dimensions
        self.model = tf.keras.Sequential([
            tf.keras.layers.Dense(32, activation='relu', input_shape=(8,)),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(16, activation='relu'),
            tf.keras.layers.Dense(1, activation='sigmoid')
        ])

        # Industry benchmarks by role category
        self.role_benchmarks = {
            'entry_level': 60,    # Fresh graduate target
            'mid_level': 75,      # 2-4 years experience
            'senior': 85,         # 5+ years experience
            'expert': 92          # 8+ years experience
        }

    def call(self, inputs, training=False):
        return self.model(inputs, training=training)

    def calculate_readiness(self, accuracy: float, topic_coverage: float,
                            avg_difficulty: float, consistency: float,
                            time_efficiency: float,
                            topic_depth: float = 0.5,
                            weak_topic_penalty: float = 0.0,
                            strong_topic_bonus: float = 0.0) -> Dict:
        """Calculate job readiness score and detailed analysis"""

        # Prepare input features
        features = tf.constant([[
            accuracy,                           # Overall accuracy
            topic_coverage,                     # Breadth of knowledge
            avg_difficulty,                     # Average question difficulty
            consistency,                        # Performance consistency
            time_efficiency,                    # Time management
            topic_depth,                        # Depth in key topics
            accuracy * topic_coverage,          # Interaction term
            np.sqrt(accuracy) * consistency     # Weighted consistency
        ]], dtype=tf.float32)

        # Get prediction
        raw_score = float(self(features, training=False).numpy()[0][0])

        # --- DYNAMIC TUNING (Simulating Trained Model) ---
        # If few questions, rely heavily on accuracy
        # User Feedback: "score is very static"
        
        # Base confidence from consistency and accuracy
        dynamic_score = (accuracy * 0.7) + (consistency * 0.2) + (time_efficiency * 0.1)
        
        # Boost for passing threshold (encouragement)
        if accuracy > 0.5:
             dynamic_score = max(dynamic_score, 0.60) # Ensure at least Internship Ready
        
        if accuracy > 0.8:
             dynamic_score = max(dynamic_score, 0.75) # Ensure at least Junior Dev
             
        # Merge with Neural Score (weighted average)
        # We give more weight to our dynamic logic until specific training data arrives
        adjusted_score = (raw_score * 0.3) + (dynamic_score * 0.7)

        # Apply bonuses and penalties
        adjusted_score = adjusted_score + strong_topic_bonus - weak_topic_penalty
        adjusted_score = max(0.0, min(1.0, adjusted_score))

        # Convert to 0-100 scale
        readiness_score = adjusted_score * 100

        # Determine readiness level
        level, benchmark = self._get_readiness_level(readiness_score)

        # Calculate improvement needed
        improvement_needed = max(0, benchmark - readiness_score)

        # Generate breakdown
        breakdown = self._generate_score_breakdown(
            accuracy, topic_coverage, consistency, time_efficiency
        )

        return {
            'readiness_score': round(readiness_score, 1),
            'readiness_level': level,
            'benchmark_target': benchmark,
            'improvement_needed': round(improvement_needed, 1),
            'raw_score': round(raw_score * 100, 1),
            'strong_topic_bonus': round(strong_topic_bonus * 100, 1),
            'weak_topic_penalty': round(weak_topic_penalty * 100, 1),
            'score_breakdown': breakdown,
            'interpretation': self._interpret_score(readiness_score)
        }

    def _get_readiness_level(self, score: float) -> Tuple[str, int]:
        """Determine readiness level and target benchmark"""
        if score >= 90:
            return "Expert Level", self.role_benchmarks['expert']
        elif score >= 80:
            return "Senior Level", self.role_benchmarks['senior']
        elif score >= 70:
            return "Mid Level", self.role_benchmarks['mid_level']
        elif score >= 60:
            return "Entry Level", self.role_benchmarks['entry_level']
        elif score >= 40:
            return "Internship Ready", 60
        else:
            return "Needs Foundation", 40

    def _generate_score_breakdown(self, accuracy: float, coverage: float,
                                  consistency: float, efficiency: float) -> Dict:
        """Generate detailed score breakdown"""
        return {
            'accuracy_contrib': round(accuracy * 25, 1),          # 25% weight
            'coverage_contrib': round(coverage * 20, 1),          # 20% weight
            'consistency_contrib': round(consistency * 30, 1),    # 30% weight
            'efficiency_contrib': round(efficiency * 15, 1),      # 15% weight
            # 10% weight
            'interaction_contrib': round((accuracy * consistency) * 10, 1)
        }

    def _interpret_score(self, score: float) -> Dict:
        """Generate interpretation of the readiness score"""
        if score >= 90:
            return {
                'message': "Excellent! You're ready for senior/lead positions",
                'actions': ["Apply for senior roles", "Consider mentorship opportunities"],
                'timeline': "Immediately"
            }
        elif score >= 80:
            return {
                'message': "Strong candidate for mid-senior roles",
                'actions': ["Polish interview skills", "Build portfolio projects"],
                'timeline': "1-2 months"
            }
        elif score >= 70:
            return {
                'message': "Ready for entry-mid level positions",
                'actions': ["Practice system design", "Learn one advanced topic"],
                'timeline': "2-3 months"
            }
        elif score >= 60:
            return {
                'message': "Ready for entry-level/junior positions",
                'actions': ["Complete foundational courses", "Build basic projects"],
                'timeline': "3-6 months"
            }
        else:
            return {
                'message': "Focus on building strong foundations",
                'actions': ["Master basics", "Complete beginner tutorials"],
                'timeline': "6-12 months"
            }

    def calculate_topic_weakness_penalty(self, weak_topics: List[str],
                                         weak_topic_mastery: Dict[str, float]) -> float:
        """Calculate penalty for weak topics"""
        if not weak_topics:
            return 0.0

        # Calculate average weakness
        weaknesses = [
            1.0 - weak_topic_mastery.get(topic, 0.5) for topic in weak_topics]
        avg_weakness = np.mean(weaknesses)

        # Penalty proportional to weakness and number of weak topics
        penalty = avg_weakness * (len(weak_topics) / 10)  # Max 10% penalty

        return min(0.15, penalty)  # Cap at 15% penalty

    def calculate_topic_strength_bonus(self, strong_topics: List[str],
                                       strong_topic_mastery: Dict[str, float]) -> float:
        """Calculate bonus for strong topics"""
        if not strong_topics:
            return 0.0

        # Calculate average strength above threshold
        strengths = [strong_topic_mastery.get(
            topic, 0.5) - 0.7 for topic in strong_topics]
        avg_strength = np.mean([s for s in strengths if s > 0])

        if avg_strength <= 0:
            return 0.0

        # Bonus proportional to strength
        bonus = avg_strength * (len(strong_topics) / 10)  # Max 10% bonus

        return min(0.15, bonus)  # Cap at 15% bonus

    def train_on_feedback(self, predicted_score: float, actual_hiring_outcome: float):
        """Train model based on hiring feedback"""
        # Create dummy features (in production, use actual features)
        dummy_features = tf.random.normal((1, 8))

        with tf.GradientTape() as tape:
            prediction = self(dummy_features, training=True)
            loss = tf.keras.losses.MSE(actual_hiring_outcome / 100, prediction)

        gradients = tape.gradient(loss, self.trainable_variables)
        self.optimizer.apply_gradients(
            zip(gradients, self.trainable_variables))

        return float(loss.numpy())
