"""
LPA Estimation Brain - Regression Neural Network
Estimates salary range based on performance and role
"""
import tensorflow as tf
import numpy as np
from typing import Dict, List, Tuple
import json


class LPAEstimationBrain(tf.keras.Model):
    """Regression Neural Network for LPA estimation"""

    def __init__(self):
        super().__init__()

        # Base LPA ranges by role and experience (in Lakhs Per Annum)
        self.role_base_lpa = {
            'Backend Developer': {
                'fresher': [4, 8],
                '1-3_years': [8, 16],
                '3-5_years': [12, 25],
                '5+_years': [18, 40]
            },
            'Frontend Developer': {
                'fresher': [3, 7],
                '1-3_years': [6, 14],
                '3-5_years': [10, 22],
                '5+_years': [15, 35]
            },
            'Full Stack Developer': {
                'fresher': [5, 10],
                '1-3_years': [10, 20],
                '3-5_years': [15, 30],
                '5+_years': [20, 45]
            },
            'DevOps Engineer': {
                'fresher': [6, 12],
                '1-3_years': [12, 24],
                '3-5_years': [18, 35],
                '5+_years': [25, 50]
            },
            'Data Analyst': {
                'fresher': [3, 6],
                '1-3_years': [6, 12],
                '3-5_years': [10, 20],
                '5+_years': [15, 35]
            },
            'System Administrator': {
                'fresher': [3, 5],
                '1-3_years': [5, 10],
                '3-5_years': [8, 16],
                '5+_years': [12, 25]
            },
            'QA Engineer': {
                'fresher': [2, 5],
                '1-3_years': [4, 9],
                '3-5_years': [7, 15],
                '5+_years': [10, 22]
            },
            'Machine Learning Engineer': {
                'fresher': [6, 15],
                '1-3_years': [12, 25],
                '3-5_years': [20, 40],
                '5+_years': [30, 70]
            }
        }

        # Company type multipliers
        self.company_multipliers = {
            'startup': 0.8,
            'mid_size': 1.0,
            'mature_startup': 1.2,
            'product_based': 1.5,
            'faang': 2.0
        }

        # City cost of living adjustments
        self.city_adjustments = {
            'tier3': 0.7,
            'tier2': 0.9,
            'tier1': 1.0,
            'metro': 1.2,
            'bangalore': 1.1,
            'hyderabad': 1.0,
            'pune': 0.95,
            'chennai': 0.9,
            'delhi': 1.05,
            'mumbai': 1.15
        }

        # Neural regression model
        self.model = tf.keras.Sequential([
            tf.keras.layers.Dense(32, activation='relu', input_shape=(8,)),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(16, activation='relu'),
            # Output: [min_lpa, max_lpa]
            tf.keras.layers.Dense(2, activation='linear')
        ])

        # Experience level classifier
        self.exp_classifier = tf.keras.Sequential([
            tf.keras.layers.Dense(16, activation='relu', input_shape=(3,)),
            # 4 experience levels
            tf.keras.layers.Dense(4, activation='softmax')
        ])
        
        # High demand roles list
        self.high_demand_roles = ['Machine Learning Engineer', 'DevOps Engineer', 'Full Stack Developer']

    def call(self, inputs, training=False):
        return self.model(inputs, training=training)

    def estimate_lpa(self, job_readiness: float, role: str,
                     topic_depth: float, consistency: float,
                     quiz_complexity: float, experience_years: float = 1.0,
                     company_type: str = 'mid_size',
                     city: str = 'tier1') -> Dict:
        """Estimate LPA range based on multiple factors"""

        # Determine experience level
        exp_level = self._determine_experience_level(experience_years)

        # Get base range for role and experience
        if role in self.role_base_lpa and exp_level in self.role_base_lpa[role]:
            base_min, base_max = self.role_base_lpa[role][exp_level]
        else:
            base_min, base_max = [6, 15]  # Default range

        # Prepare features for neural adjustment
        features = tf.constant([[
            job_readiness / 100,           # Normalized readiness
            topic_depth,                   # Depth of knowledge
            consistency,                   # Performance consistency
            quiz_complexity,               # Quiz difficulty level
            np.log(base_min + 1) / 10,     # Log transform of base min
            np.log(base_max + 1) / 10,     # Log transform of base max
            experience_years / 10,         # Years of experience
            (topic_depth * consistency)    # Combined competence
        ]], dtype=tf.float32)

        # Get adjustment factors from neural model
        adjustments = self(features, training=False).numpy()[0]

        # Apply neural adjustments to base range
        adjusted_min = base_min * (1 + adjustments[0])
        adjusted_max = base_max * (1 + adjustments[1])

        # Apply company type multiplier
        company_mult = self.company_multipliers.get(company_type, 1.0)
        adjusted_min *= company_mult
        adjusted_max *= company_mult

        # Apply city adjustment
        city_mult = self.city_adjustments.get(city, 1.0)
        adjusted_min *= city_mult
        adjusted_max *= city_mult

        # Clamp to reasonable ranges
        adjusted_min = max(2, min(100, adjusted_min))
        adjusted_max = max(adjusted_min + 2, min(150, adjusted_max))

        # Calculate expected LPA (weighted average)
        expected_lpa = (adjusted_min * 0.3 + adjusted_max * 0.7)

        # Calculate confidence based on consistency
        confidence = min(95, consistency * 100)

        # Calculate growth potential
        growth_potential = self._calculate_growth_potential(
            adjusted_max, expected_lpa, experience_years
        )

        # Generate market insights
        market_insights = self._generate_market_insights(
            role, expected_lpa, company_type, city
        )

        # Generate negotiation tips
        negotiation_tips = self._generate_negotiation_tips(
            role, expected_lpa, job_readiness, consistency
        )

        return {
            'salary_range': {
                'min': round(adjusted_min, 1),
                'max': round(adjusted_max, 1),
                'currency': 'LPA (Lakhs Per Annum)'
            },
            'expected_salary': round(expected_lpa, 1),
            'confidence_score': round(confidence, 1),
            'experience_level': exp_level,
            'growth_potential': growth_potential,
            'company_adjustment': company_mult,
            'city_adjustment': city_mult,
            'market_insights': market_insights,
            'negotiation_tips': negotiation_tips,
            'factors_considered': self._get_factors_breakdown(
                job_readiness, topic_depth, consistency,
                quiz_complexity, experience_years
            )
        }

    def _determine_experience_level(self, years: float) -> str:
        """Determine experience level category"""
        if years <= 0.5:
            return 'fresher'
        elif years <= 3:
            return '1-3_years'
        elif years <= 5:
            return '3-5_years'
        else:
            return '5+_years'

    def _calculate_growth_potential(self, max_lpa: float,
                                    expected_lpa: float,
                                    experience_years: float) -> Dict:
        """Calculate salary growth potential"""
        immediate_growth = ((max_lpa - expected_lpa) / expected_lpa) * 100

        # Estimate 2-year growth
        if experience_years < 3:
            two_year_growth = immediate_growth * 2.5
        elif experience_years < 5:
            two_year_growth = immediate_growth * 1.8
        else:
            two_year_growth = immediate_growth * 1.3

        return {
            'immediate': round(min(50, immediate_growth), 1),
            'one_year': round(min(80, immediate_growth * 1.5), 1),
            'two_years': round(min(120, two_year_growth), 1),
            'peak_potential': round(min(200, two_year_growth * 1.5), 1)
        }

    def _generate_market_insights(self, role: str, expected_lpa: float,
                                  company_type: str, city: str) -> List[str]:
        """Generate market insights for the role"""
        insights = []

        # Role-specific insights
        if role in ['Machine Learning Engineer', 'DevOps Engineer']:
            insights.append(f"{role}s are in high demand with 30% YoY growth")

        if expected_lpa > 20:
            insights.append(
                "You're in the top 20% salary bracket for this role")
        elif expected_lpa > 10:
            insights.append("You're in the median salary range for this role")
        else:
            insights.append(
                "There's significant growth potential with upskilling")

        # Company type insights
        if company_type == 'faang':
            insights.append(
                "FAANG companies offer best compensation but highest competition")
        elif company_type == 'startup':
            insights.append(
                "Startups offer higher growth potential and equity options")

        # City insights
        if city in ['bangalore', 'hyderabad']:
            insights.append(
                f"Tech hubs like {city.title()} offer 15-20% premium")

        return insights[:3]

    def _generate_negotiation_tips(self, role: str, expected_lpa: float,
                                   job_readiness: float, consistency: float) -> List[str]:
        """Generate negotiation tips based on profile"""
        tips = []

        if job_readiness > 80:
            tips.append(
                f"Confidently ask for {expected_lpa + 2}+ LPA given your strong skills")
        elif job_readiness > 60:
            tips.append(
                f"Aim for {expected_lpa} LPA with potential for 6-month review")
        else:
            tips.append(
                "Focus on learning; salary will follow with demonstrated skills")

        if consistency > 0.8:
            tips.append(
                "Highlight your consistent performance as a reliability indicator")

        if role in self.high_demand_roles:
            tips.append(
                f"Use the high demand for {role}s as negotiation leverage")

        tips.append("Research company-specific salary bands before negotiation")
        tips.append("Consider equity/ESOPs as part of total compensation")

        return tips[:4]

    def _get_factors_breakdown(self, job_readiness: float, topic_depth: float,
                               consistency: float, quiz_complexity: float,
                               experience_years: float) -> Dict:
        """Breakdown of factors affecting salary estimation"""
        return {
            'job_readiness_weight': round(job_readiness * 0.3, 1),
            'topic_depth_weight': round(topic_depth * 0.25, 1),
            'consistency_weight': round(consistency * 0.2, 1),
            'quiz_complexity_weight': round(quiz_complexity * 0.15, 1),
            'experience_weight': round(min(1.0, experience_years / 5) * 0.1, 1)
        }

    def save_salary_data(self, role: str, actual_salary: float,
                         predicted_range: Tuple[float, float]):
        """Save actual salary data for model improvement"""
        # In production, save to database
        data_point = {
            'role': role,
            'actual_salary': actual_salary,
            'predicted_min': predicted_range[0],
            'predicted_max': predicted_range[1],
            'timestamp': str(np.datetime64('now'))
        }

        # Append to training data
        try:
            with open('salary_training_data.json', 'a') as f:
                json.dump(data_point, f)
                f.write('\n')
        except:
            pass

    def train_on_salary_data(self):
        """Train model on collected salary data"""
        try:
            with open('salary_training_data.json', 'r') as f:
                lines = f.readlines()
                data_points = [json.loads(line) for line in lines]

            if len(data_points) < 10:
                return  # Need more data

            # Prepare training data
            X = []
            y_min = []
            y_max = []

            for point in data_points:
                # Create features (simplified)
                features = [
                    (point.get('job_readiness', 70) / 100),
                    (point.get('topic_depth', 0.5)),
                    (point.get('consistency', 0.7)),
                    0.5,  # Default quiz complexity
                    np.log(point['predicted_min'] + 1) / 10,
                    np.log(point['predicted_max'] + 1) / 10,
                    (point.get('experience_years', 2) / 10),
                    0.5   # Default competence
                ]
                X.append(features)

                # Calculate adjustment needed
                actual = point['actual_salary']
                pred_min, pred_max = point['predicted_min'], point['predicted_max']

                adj_min = (actual - pred_min) / pred_min
                adj_max = (actual - pred_max) / pred_max

                y_min.append([adj_min])
                y_max.append([adj_max])

            # Convert to tensors
            X = tf.constant(X, dtype=tf.float32)
            y = tf.constant(list(zip(y_min, y_max)), dtype=tf.float32)

            # Training step
            with tf.GradientTape() as tape:
                predictions = self(X, training=True)
                loss = tf.keras.losses.MSE(y, predictions)

            gradients = tape.gradient(loss, self.trainable_variables)
            self.optimizer.apply_gradients(
                zip(gradients, self.trainable_variables))

            return float(loss.numpy())

        except FileNotFoundError:
            return None
