"""
Topic Extractor Brain - Lightweight Text Classifier
Extracts topics from quiz titles and questions
"""
import tensorflow as tf
import numpy as np
from typing import List, Dict


class TopicExtractorBrain(tf.keras.Model):
    """Lightweight text classifier for topic extraction"""

    def __init__(self, vocab_size: int = 10000, embedding_dim: int = 64,
                 num_topics: int = 20, max_length: int = 100):
        super().__init__()

        self.max_length = max_length
        self.num_topics = num_topics

        # Topic mapping (customize with your topics)
        self.topic_names = [
            'DBMS', 'Python', 'JavaScript', 'Java', 'C++',
            'Data Structures', 'Algorithms', 'Networking', 'OS',
            'System Design', 'OOPS', 'React', 'Node.js', 'AWS',
            'DevOps', 'Machine Learning', 'SQL', 'MongoDB',
            'Git', 'Docker'
        ]

        # Text processing layers
        self.text_vectorizer = tf.keras.layers.TextVectorization(
            max_tokens=vocab_size,
            output_sequence_length=max_length,
            output_mode='int'
        )

        # Neural network layers
        self.embedding = tf.keras.layers.Embedding(
            input_dim=vocab_size + 1,
            output_dim=embedding_dim,
            mask_zero=True
        )

        self.conv1d = tf.keras.layers.Conv1D(64, 5, activation='relu')
        self.global_pool = tf.keras.layers.GlobalAveragePooling1D()
        self.dense1 = tf.keras.layers.Dense(32, activation='relu')
        self.dropout = tf.keras.layers.Dropout(0.3)
        self.output_layer = tf.keras.layers.Dense(
            num_topics, activation='softmax')
            
        # Initialize vectorizer with topic names to prevent "Table not initialized" error
        self.adapt_vectorizer(self.topic_names)

    def adapt_vectorizer(self, texts: List[str]):
        """Initialize the text vectorizer"""
        self.text_vectorizer.adapt(texts)

    def call(self, inputs, training=False):
        # Process text
        x = self.text_vectorizer(inputs)
        x = self.embedding(x)
        x = self.conv1d(x)
        x = self.global_pool(x)
        x = self.dense1(x)
        x = self.dropout(x, training=training)
        return self.output_layer(x)

    def extract_topics(self, text: str, threshold: float = 0.3, context: str = "") -> List[str]:
        """Extract topics from text using Hybrid (Keyword + Neural) approach with Context Awareness"""
        
        # --- ENHANCED KEYWORD DICTIONARY ---
        # Simulating "Massive Training" with a rich expert dictionary
        text_lower = text.lower()
        context_lower = context.lower()
        found_topics = set()
        
        keywords = {
            'Python': ['python', 'pip', 'def ', 'import ', 'list', 'dict', 'tuple', 'decorator', 'generator', 'pandas', 'numpy'],
            'Java': ['java', 'jvm', 'jdk', 'public static', 'system.out', 'arraylist', 'hashmap', 'maven', 'spring'],
            'JavaScript': ['javascript', 'js', 'node', 'npm', 'console.log', 'const', 'let', 'var', 'async', 'await', 'react', 'angular'],
            # Stricter DBMS terms to avoid 'row/column' confusion in matrices
            'DBMS': ['sql', 'database', 'dbms', 'normalization', 'acid', 'transaction', 'primary key', 'foreign key', 'mysql', 'mongodb', 'relation'],
            'OOPS': ['class', 'object', 'inheritance', 'polymorphism', 'encapsulation', 'abstraction', 'interface', 'constructor', 'method overriding'],
            'Networking': ['http', 'tcp', 'ip', 'dns', 'protocol', 'port', 'socket', 'osi model', 'ftp', 'ssh'],
            'OS': ['operating system', 'kernel', 'deadlock', 'scheduler', 'paging', 'virtual memory', 'semaphore', 'mutex', 'process', 'thread'],
            'AWS': ['aws', 'ec2', 's3', 'lambda', 'cloud', 'iam', 'vpc'],
            'Data Structures': ['array', 'linked list', 'stack', 'queue', 'tree', 'graph', 'hash table', 'heap', 'b-tree', 'trie'],
            'Algorithms': ['sorting', 'searching', 'recursion', 'dynamic programming', 'greedy', 'complexity', 'big o', 'bfs', 'dfs']
        }
        
        # 1. Check Keywords
        for topic, keys in keywords.items():
            for key in keys:
                # Word boundary check for short words to avoid substrings (e.g. 'os' in 'cost')
                if len(key) < 4:
                     import re
                     if re.search(r'\b' + re.escape(key) + r'\b', text_lower):
                         found_topics.add(topic)
                         break
                elif key in text_lower:
                    found_topics.add(topic)
                    break

        # 2. Context Bias (The "Quiz Title" Influence)
        # If context matches a topic key, prioritize it or related topics
        if context:
            # Check if context itself is a topic (or contained in it)
            for topic in keywords.keys():
                if topic.lower() in context_lower or context_lower in topic.lower():
                    # If we found other topics, but they are weak/generic, maybe the context overrides them?
                    # For now, we simply ensure the context topic is added if any part of it is plausibly relevant
                    # OR we just boost it.
                    
                    # Heuristic: If context is 'Data Structures' and we found 'Structure', mapped correctly.
                    # If context is 'Core Data Structures', ensure 'Data Structures' is present.
                    found_topics.add(topic)

        # 3. Filtering False Positives based on Context
        if "data structures" in context_lower or "algorithms" in context_lower:
             # DSA context: Remove 'DBMS' unless explicit SQL mentioned
             if 'DBMS' in found_topics and 'sql' not in text_lower and 'database' not in text_lower:
                  found_topics.discard('DBMS')
        
        if found_topics:
            return list(found_topics)
            
        # --- NEURAL FALLBACK ---
        # Only use if no keywords found
        
        # Convert text to tensor
        text_tensor = tf.convert_to_tensor([text])

        # Get predictions
        predictions = self(text_tensor, training=False).numpy()[0]

        # Get topics above threshold
        topic_indices = np.where(predictions > threshold)[0]
        topics = [self.topic_names[i] for i in topic_indices]

        # If no topics above threshold, return top 2
        if not topics:
            top_indices = np.argsort(predictions)[-2:][::-1]
            topics = [self.topic_names[i] for i in top_indices]

        return topics

    def extract_topics_batch(self, texts: List[str]) -> List[List[str]]:
        """Extract topics from multiple texts"""
        text_tensor = tf.convert_to_tensor(texts)
        predictions = self(text_tensor, training=False).numpy()

        all_topics = []
        for pred in predictions:
            topic_indices = np.where(pred > 0.3)[0]
            topics = [self.topic_names[i] for i in topic_indices]
            if not topics:
                top_indices = np.argsort(pred)[-2:][::-1]
                topics = [self.topic_names[i] for i in top_indices]
            all_topics.append(topics)

        return all_topics

    def train_on_batch(self, texts: List[str], topic_labels: List[List[int]]):
        """Train on a batch of data"""
        # Convert multi-label to one-hot
        y = np.zeros((len(texts), self.num_topics))
        for i, labels in enumerate(topic_labels):
            y[i, labels] = 1

        # Convert texts to tensor
        x = tf.convert_to_tensor(texts)

        # Train step
        with tf.GradientTape() as tape:
            predictions = self(x, training=True)
            loss = tf.keras.losses.binary_crossentropy(y, predictions)

        gradients = tape.gradient(loss, self.trainable_variables)
        self.optimizer.apply_gradients(
            zip(gradients, self.trainable_variables))

        return loss.numpy()
