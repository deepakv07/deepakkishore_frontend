"""
Knowledge State Brain - Online Regression Network
Tracks user knowledge state across topics
"""
import tensorflow as tf
import numpy as np
from typing import Dict, Tuple, List, Optional
import pickle
import os


class KnowledgeStateBrain(tf.keras.Model):
    """Online Regression Network for user knowledge tracking"""

    def __init__(self, num_topics: int = 20):
        super().__init__()

        self.num_topics = num_topics

        # Topic mapping
        self.topic_names = [
            'DBMS', 'Python', 'JavaScript', 'Java', 'C++',
            'Data Structures', 'Algorithms', 'Networking', 'OS',
            'System Design', 'OOPS', 'React', 'Node.js', 'AWS',
            'DevOps', 'Machine Learning', 'SQL', 'MongoDB',
            'Git', 'Docker'
        ]

        # Topic mastery networks (one per topic)
        self.topic_networks = []
        for _ in range(num_topics):
            network = tf.keras.Sequential([
                tf.keras.layers.Dense(16, activation='relu', input_shape=(4,)),
                tf.keras.layers.BatchNormalization(),
                tf.keras.layers.Dense(8, activation='relu'),
                tf.keras.layers.Dense(1, activation='sigmoid')
            ])
            self.topic_networks.append(network)

        # Optimizers (one per topic network)
        self.optimizers = [tf.keras.optimizers.Adam(learning_rate=0.001) 
                          for _ in range(num_topics)]

        # Confidence estimator
        self.confidence_net = tf.keras.Sequential([
            tf.keras.layers.Dense(16, activation='relu', input_shape=(3,)),
            tf.keras.layers.Dense(8, activation='relu'),
            tf.keras.layers.Dense(1, activation='sigmoid')
        ])

        # User knowledge memory (topic -> [scores])
        self.user_knowledge_db = {}



    def _get_topic_index(self, topic: str) -> int:
        """Map topic name to index"""
        topic_mapping = {name: idx for idx,
                         name in enumerate(self.topic_names)}
        return topic_mapping.get(topic, 0)

    def update_knowledge(self, user_id: str, topic: str, performance: float,
                         question_difficulty: float, time_taken: float,
                         time_efficiency: float = 0.5) -> Tuple[float, float]:
        """Update user's knowledge state for a topic"""

        # Initialize user data if not exists
        if user_id not in self.user_knowledge_db:
            self.user_knowledge_db[user_id] = {}

        if topic not in self.user_knowledge_db[user_id]:
            self.user_knowledge_db[user_id][topic] = []

        # Get topic index
        topic_idx = self._get_topic_index(topic)

        # Create features: [performance, difficulty, time_taken, time_efficiency]
        features = tf.constant([[performance, question_difficulty,
                               np.log1p(time_taken) / 10, time_efficiency]],
                               dtype=tf.float32)

        # Get current mastery prediction
        current_mastery = float(self.topic_networks[topic_idx](
            features, training=False).numpy()[0][0])

        # Online training step
        with tf.GradientTape() as tape:
            prediction = self.topic_networks[topic_idx](
                features, training=True)
            loss = tf.keras.losses.MSE(performance, prediction)

        # Apply gradients
        grads = tape.gradient(
            loss, self.topic_networks[topic_idx].trainable_variables)
        self.optimizers[topic_idx].apply_gradients(
            zip(grads, self.topic_networks[topic_idx].trainable_variables)
        )

        # Store the performance
        self.user_knowledge_db[user_id][topic].append(performance)

        # Keep only last 20 performances
        if len(self.user_knowledge_db[user_id][topic]) > 20:
            self.user_knowledge_db[user_id][topic].pop(0)

        # Calculate confidence based on consistency
        confidence_features = tf.constant([[
            performance,
            len(self.user_knowledge_db[user_id][topic]),
            np.std(self.user_knowledge_db[user_id][topic]) if len(
                self.user_knowledge_db[user_id][topic]) > 1 else 0.5
        ]], dtype=tf.float32)

        confidence = float(self.confidence_net(
            confidence_features, training=False).numpy()[0][0])

        return float(prediction.numpy()[0][0]), confidence

    def get_mastery(self, user_id: str, topic: str) -> Tuple[float, float]:
        """Get mastery and confidence for a topic"""
        if user_id in self.user_knowledge_db and topic in self.user_knowledge_db[user_id]:
            performances = self.user_knowledge_db[user_id][topic]
            if performances:
                # Calculate mastery as weighted average (recent performances weighted more)
                weights = np.arange(1, len(performances) + 1)  # Linear weights
                weights = weights / weights.sum()
                mastery = np.average(performances, weights=weights)

                # Calculate confidence (inverse of standard deviation)
                std_dev = np.std(performances) if len(
                    performances) > 1 else 0.5
                confidence = 1.0 / (1.0 + std_dev)  # Convert to 0-1 scale

                return float(mastery), float(confidence)

        return 0.1, 0.1  # Default values (low mastery for unknown topics)

    def get_all_mastery(self, user_id: str) -> Dict[str, Dict]:
        """Get mastery for all topics for a user"""
        results = {}
        for topic in self.topic_names:
            mastery, confidence = self.get_mastery(user_id, topic)
            results[topic] = {
                'mastery': mastery,
                'confidence': confidence,
                'level': self._get_mastery_level(mastery),
                'attempts': len(self.user_knowledge_db.get(user_id, {}).get(topic, []))
            }

        return results

    def _get_mastery_level(self, mastery: float) -> str:
        """Convert mastery score to human-readable level"""
        if mastery >= 0.8:
            return "Expert"
        elif mastery >= 0.6:
            return "Advanced"
        elif mastery >= 0.4:
            return "Intermediate"
        elif mastery >= 0.2:
            return "Beginner"
        else:
            return "Novice"

    def get_weak_topics(self, user_id: str, threshold: float = 0.4) -> List[str]:
        """Get topics where user is weak"""
        weak_topics = []
        for topic in self.topic_names:
            mastery, _ = self.get_mastery(user_id, topic)
            if mastery < threshold:
                weak_topics.append(topic)
        return weak_topics[:5]  # Return top 5 weak topics

    def get_strong_topics(self, user_id: str, threshold: float = 0.7) -> List[str]:
        """Get topics where user is strong"""
        strong_topics = []
        for topic in self.topic_names:
            mastery, _ = self.get_mastery(user_id, topic)
            if mastery >= threshold:
                strong_topics.append(topic)
        return strong_topics[:5]  # Return top 5 strong topics

    def get_consistency_score(self, user_id: str) -> float:
        """Calculate user's consistency across topics"""
        variances = []
        for topic in self.topic_names:
            if user_id in self.user_knowledge_db and topic in self.user_knowledge_db[user_id]:
                performances = self.user_knowledge_db[user_id][topic]
                if len(performances) >= 3:
                    variance = np.var(performances)
                    variances.append(variance)

        if variances:
            avg_variance = np.mean(variances)
            consistency = 1.0 / (1.0 + avg_variance)
            return float(consistency)

        return 0.5

    def save_user_data(self, user_id: str, filepath: str):
        """Save user's knowledge data to file"""
        if user_id in self.user_knowledge_db:
            data = {
                'knowledge_data': self.user_knowledge_db[user_id],
                'saved_at': str(np.datetime64('now'))
            }
            with open(filepath, 'wb') as f:
                pickle.dump(data, f)

    def load_user_data(self, user_id: str, filepath: str):
        """Load user's knowledge data from file"""
        if os.path.exists(filepath):
            with open(filepath, 'rb') as f:
                data = pickle.load(f)
                if user_id not in self.user_knowledge_db:
                    self.user_knowledge_db[user_id] = {}
                self.user_knowledge_db[user_id].update(data['knowledge_data'])
