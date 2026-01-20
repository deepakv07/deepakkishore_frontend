"""
Role Recommendation Brain - Multi-Class Classifier
Recommends career roles based on topic mastery
"""
import tensorflow as tf
import numpy as np
from typing import List, Dict, Tuple


class RoleRecommendationBrain(tf.keras.Model):
    """Multi-Class Classifier for role recommendations"""

    def __init__(self, num_roles: int = 8):
        super().__init__()

        # Role definitions with descriptions
        self.roles = {
            0: {
                'name': 'Backend Developer',
                'description': 'Builds server-side logic, databases, and APIs',
                'key_skills': ['DBMS', 'Python/Java', 'System Design', 'API Design'],
                'avg_experience': '2-5 years',
                'demand': 'High'
            },
            1: {
                'name': 'Frontend Developer',
                'description': 'Creates user interfaces and client-side logic',
                'key_skills': ['JavaScript', 'React', 'CSS', 'UI/UX'],
                'avg_experience': '1-4 years',
                'demand': 'High'
            },
            2: {
                'name': 'Full Stack Developer',
                'description': 'Handles both frontend and backend development',
                'key_skills': ['JavaScript', 'Node.js', 'DBMS', 'React'],
                'avg_experience': '3-6 years',
                'demand': 'Very High'
            },
            3: {
                'name': 'DevOps Engineer',
                'description': 'Manages deployment, infrastructure, and CI/CD',
                'key_skills': ['AWS', 'Docker', 'Git', 'Networking'],
                'avg_experience': '3-7 years',
                'demand': 'High'
            },
            4: {
                'name': 'Data Analyst',
                'description': 'Analyzes data to provide business insights',
                'key_skills': ['Python', 'SQL', 'Machine Learning', 'Statistics'],
                'avg_experience': '1-3 years',
                'demand': 'High'
            },
            5: {
                'name': 'System Administrator',
                'description': 'Maintains and configures computer systems',
                'key_skills': ['OS', 'Networking', 'Linux', 'Troubleshooting'],
                'avg_experience': '2-5 years',
                'demand': 'Medium'
            },
            6: {
                'name': 'QA Engineer',
                'description': 'Ensures software quality through testing',
                'key_skills': ['Testing', 'Automation', 'Python', 'Debugging'],
                'avg_experience': '1-4 years',
                'demand': 'Medium'
            },
            7: {
                'name': 'Machine Learning Engineer',
                'description': 'Builds and deploys ML models',
                'key_skills': ['Python', 'Machine Learning', 'Algorithms', 'Statistics'],
                'avg_experience': '2-6 years',
                'demand': 'Very High'
            }
        }

        # Role-topic importance matrix (0-1 scale)
        self.role_topic_matrix = tf.constant([
            # DBMS, Python, JS, Java, DS, Algo, Network, OS, System Design, OOPS
            [0.9, 0.8, 0.3, 0.7, 0.8, 0.7, 0.6, 0.5, 0.8, 0.9],  # Backend
            [0.3, 0.4, 0.9, 0.3, 0.5, 0.4, 0.2, 0.1, 0.4, 0.6],  # Frontend
            [0.7, 0.8, 0.8, 0.6, 0.7, 0.6, 0.5, 0.4, 0.7, 0.8],  # Full Stack
            [0.6, 0.7, 0.4, 0.5, 0.6, 0.5, 0.8, 0.9, 0.6, 0.5],  # DevOps
            [0.8, 0.9, 0.5, 0.4, 0.7, 0.8, 0.3, 0.2, 0.5, 0.4],  # Data Analyst
            [0.5, 0.3, 0.2, 0.3, 0.4, 0.3, 0.9, 0.9, 0.4, 0.3],  # System Admin
            [0.6, 0.5, 0.6, 0.5, 0.6, 0.5, 0.4, 0.3, 0.5, 0.7],  # QA Engineer
            [0.7, 0.9, 0.3, 0.6, 0.8, 0.9, 0.4, 0.3, 0.7, 0.6],  # ML Engineer
        ], dtype=tf.float32)

        # Topic names in order
        self.topic_names = [
            'DBMS', 'Python', 'JavaScript', 'Java', 'Data Structures',
            'Algorithms', 'Networking', 'OS', 'System Design', 'OOPS'
        ]

        # Neural classifier
        self.classifier = tf.keras.Sequential([
            # 10 mastery + 10 weakness
            tf.keras.layers.Dense(32, activation='relu', input_shape=(20,)),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(16, activation='relu'),
            tf.keras.layers.Dense(num_roles, activation='softmax')
        ])

    def call(self, inputs, training=False):
        return self.classifier(inputs, training=training)

    def recommend_roles(self, mastery_vector: List[float],
                        weak_topics: List[str]) -> Dict[str, List[Dict]]:
        """Recommend roles based on topic mastery and weaknesses"""

        # Create weakness vector (1 for weak topic, 0 otherwise)
        weakness_vector = [1.0 if topic in weak_topics else 0.0
                           for topic in self.topic_names]

        # Combine mastery and weakness vectors
        input_vector = mastery_vector + weakness_vector
        input_tensor = tf.constant([input_vector], dtype=tf.float32)

        # Get role probabilities
        probabilities = self(input_tensor, training=False).numpy()[0]

        # Get all roles with scores
        all_recommendations = []
        for role_id, prob in enumerate(probabilities):
            role_info = self._get_role_details(
                role_id, mastery_vector, weakness_vector, prob)
            all_recommendations.append(role_info)

        # Sort by score
        all_recommendations.sort(key=lambda x: x['score'], reverse=True)

        return {
            'top_recommendation': all_recommendations[0],
            'alternative_roles': all_recommendations[1:4],
            'all_roles': all_recommendations,
            'best_fit_score': all_recommendations[0]['fit_score']
        }

    def _get_role_details(self, role_id: int, mastery_vector: List[float],
                          weakness_vector: List[float], probability: float) -> Dict:
        """Get detailed information for a role"""
        role_info = self.roles[role_id].copy()

        # Calculate fit score
        fit_score = self._calculate_fit_score(
            role_id, mastery_vector, weakness_vector)

        # Get required skills analysis
        skill_analysis = self._analyze_required_skills(
            role_id, mastery_vector, weakness_vector)

        # Get learning path
        learning_path = self._generate_learning_path(role_id, weakness_vector)

        return {
            **role_info,
            'role_id': role_id,
            'score': round(float(probability) * 100, 1),
            'fit_score': round(fit_score * 100, 1),
            'skill_analysis': skill_analysis,
            'learning_path': learning_path,
            'readiness': self._assess_readiness(fit_score),
            'time_to_readiness': self._estimate_time_to_readiness(fit_score, len(learning_path))
        }

    def _calculate_fit_score(self, role_id: int, mastery_vector: List[float],
                             weakness_vector: List[float]) -> float:
        """Calculate how well user fits the role"""
        role_weights = self.role_topic_matrix[role_id].numpy()

        # Calculate weighted mastery
        weighted_mastery = np.dot(role_weights, mastery_vector)
        total_weight = np.sum(role_weights)

        if total_weight == 0:
            return 0.0

        base_fit = weighted_mastery / total_weight

        # Penalty for weak topics that are important for the role
        penalty = 0.0
        for i, (weight, weak) in enumerate(zip(role_weights, weakness_vector)):
            if weight > 0.7 and weak > 0.5:  # Important topic is weak
                penalty += weight * 0.3

        final_fit = base_fit - penalty
        return max(0.0, min(1.0, final_fit))

    def _analyze_required_skills(self, role_id: int, mastery_vector: List[float],
                                 weakness_vector: List[float]) -> Dict:
        """Analyze which required skills user has/needs"""
        role_weights = self.role_topic_matrix[role_id].numpy()

        strong_skills = []
        weak_skills = []
        missing_skills = []

        for i, (topic, weight, mastery, weak) in enumerate(zip(
            self.topic_names, role_weights, mastery_vector, weakness_vector
        )):
            if weight > 0.6:  # Important for this role
                if mastery >= 0.7:
                    strong_skills.append({
                        'topic': topic,
                        'importance': round(float(weight), 2),
                        'mastery': round(mastery, 2)
                    })
                elif weak > 0.5 or mastery < 0.4:
                    weak_skills.append({
                        'topic': topic,
                        'importance': round(float(weight), 2),
                        'mastery': round(mastery, 2)
                    })

        return {
            'strong_skills': strong_skills[:3],
            'weak_skills': weak_skills[:3],
            'coverage_percentage': round(len(strong_skills) / np.sum(role_weights > 0.6) * 100, 1)
        }

    def _generate_learning_path(self, role_id: int, weakness_vector: List[float]) -> List[Dict]:
        """Generate learning path for the role"""
        role_weights = self.role_topic_matrix[role_id].numpy()

        learning_path = []

        # Identify critical weak topics
        for i, (topic, weight, weak) in enumerate(zip(
            self.topic_names, role_weights, weakness_vector
        )):
            if weight > 0.7 and weak > 0.5:  # Important and weak
                learning_path.append({
                    'topic': topic,
                    'priority': 'High',
                    'resources': self._get_topic_resources(topic),
                    'estimated_time': '2-4 weeks'
                })
            elif weight > 0.5 and weak > 0.5:  # Medium important and weak
                learning_path.append({
                    'topic': topic,
                    'priority': 'Medium',
                    'resources': self._get_topic_resources(topic),
                    'estimated_time': '1 week'
                })
        
        return learning_path

    def _get_topic_resources(self, topic: str) -> List[Dict]:
        """Get learning resources for a topic"""
        # Dictionary of resources for each topic
        resources = {
            'DBMS': [
                {'name': 'W3Schools SQL Tutorial', 'type': 'Course', 'url': 'https://www.w3schools.com/sql/'},
                {'name': 'GeeksforGeeks DBMS', 'type': 'Article', 'url': 'https://www.geeksforgeeks.org/dbms/'}
            ],
            'Python': [
                {'name': 'Official Python Documentation', 'type': 'Docs', 'url': 'https://docs.python.org/3/'},
                {'name': 'Real Python', 'type': 'Tutorials', 'url': 'https://realpython.com/'}
            ],
            'JavaScript': [
                {'name': 'MDN Web Docs', 'type': 'Docs', 'url': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript'},
                {'name': 'JavaScript.info', 'type': 'Tutorial', 'url': 'https://javascript.info/'}
            ],
            'Java': [
                {'name': 'Oracle Java Documentation', 'type': 'Docs', 'url': 'https://docs.oracle.com/en/java/'},
                {'name': 'Baeldung', 'type': 'Tutorials', 'url': 'https://www.baeldung.com/'}
            ],
            'Data Structures': [
                {'name': 'GeeksforGeeks DSA', 'type': 'Course', 'url': 'https://www.geeksforgeeks.org/data-structures/'},
                {'name': 'LeetCode', 'type': 'Practice', 'url': 'https://leetcode.com/'}
            ],
            'Algorithms': [
                {'name': 'Khan Academy Algorithms', 'type': 'Course', 'url': 'https://www.khanacademy.org/computing/computer-science/algorithms'},
                {'name': 'VisuAlgo', 'type': 'Visualization', 'url': 'https://visualgo.net/'}
            ],
            'Networking': [
                {'name': 'Cisco Networking Academy', 'type': 'Course', 'url': 'https://www.netacad.com/'},
                {'name': 'GeeksforGeeks Computer Networks', 'type': 'Article', 'url': 'https://www.geeksforgeeks.org/computer-network-tutorials/'}
            ],
            'OS': [
                {'name': 'OSTEP Book', 'type': 'Book', 'url': 'https://pages.cs.wisc.edu/~remzi/OSTEP/'},
                {'name': 'Neso Academy OS', 'type': 'Video', 'url': 'https://www.youtube.com/user/nesoacademy'}
            ],
            'System Design': [
                {'name': 'System Design Primer', 'type': 'Repo', 'url': 'https://github.com/donnemartin/system-design-primer'},
                {'name': 'High Scalability', 'type': 'Blog', 'url': 'http://highscalability.com/'}
            ],
            'OOPS': [
                {'name': 'OOP in Python (Real Python)', 'type': 'Article', 'url': 'https://realpython.com/python3-object-oriented-programming/'},
                {'name': 'GeeksforGeeks OOP', 'type': 'Article', 'url': 'https://www.geeksforgeeks.org/object-oriented-programming-oops-concept-in-java/'}
            ]
        }
        
        return resources.get(topic, [
            {'name': f'General {topic} Resources', 'type': 'Search', 'url': f'https://www.google.com/search?q={topic}+tutorial'}
        ])

    def _assess_readiness(self, fit_score: float) -> str:
        """Assess job readiness based on fit score"""
        if fit_score >= 0.85:
            return "Job Ready"
        elif fit_score >= 0.7:
            return "Internship Ready"
        elif fit_score >= 0.5:
            return "Project Ready"
        else:
            return "Learning Phase"

    def _estimate_time_to_readiness(self, fit_score: float, num_learning_items: int) -> str:
        """Estimate time to become job ready"""
        if fit_score >= 0.85:
            return "Immediate"
        
        # Base time per learning item (approx 2 weeks)
        weeks = num_learning_items * 2
        
        # Adjust based on current fit
        if fit_score < 0.3:
            weeks += 12
        elif fit_score < 0.5:
            weeks += 8
        elif fit_score < 0.7:
             weeks += 4
             
        if weeks <= 0:
            return "1 week"
        elif weeks < 4:
            return f"{weeks} weeks"
        else:
            months = max(1, weeks // 4)
            return f"{months} month{'s' if months > 1 else ''}"
