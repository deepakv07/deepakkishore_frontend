"""
Difficulty Adapter Brain
Adjusts quiz difficulty based on user performance
"""
import tensorflow as tf
import numpy as np

class DifficultyAdapterBrain(tf.keras.Model):
    """Adapts difficulty level based on user performance using TensorFlow"""
    
    def __init__(self):
        super().__init__()
        # Initialize difficulty as a simplified scalar variable
        self.current_difficulty = tf.Variable(0.5, dtype=tf.float32, trainable=False)
        self.history = []
        
        # Define constants
        self.min_diff = tf.constant(0.1, dtype=tf.float32)
        self.max_diff = tf.constant(1.0, dtype=tf.float32)
        self.fast_bonus = tf.constant(0.02, dtype=tf.float32)
        self.base_change = tf.constant(0.05, dtype=tf.float32)

    def call(self, inputs):
        # Placeholder call method if needed for Model serialization
        return self.current_difficulty

    def update_difficulty(self, was_correct: bool, time_taken: float):
        """Update difficulty based on latest answer"""
        
        # Calculate change using TF logic
        if was_correct:
            change = self.base_change
            if time_taken < 10:
                change += self.fast_bonus
        else:
            change = -self.base_change
            
        # Update variable
        new_val = self.current_difficulty + change
        self.current_difficulty.assign(tf.clip_by_value(new_val, self.min_diff, self.max_diff))
        
        # Track history (converting to float for storage/serialization)
        current_val = float(self.current_difficulty.numpy())
        self.history.append(current_val)
        
        return current_val
        
    def get_difficulty(self):
        return float(self.current_difficulty.numpy())
