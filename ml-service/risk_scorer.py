"""
HeartWise Risk Scoring System
Predicts cardiac event risk based on multiple health factors
"""

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
from datetime import datetime, timedelta
import json

class CardiacRiskScorer:
    """
    Calculates cardiac risk scores using ensemble methods and clinical guidelines
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
        # Weights for different risk categories
        self.weights = {
            'ecg': 0.30,
            'lifestyle': 0.25,
            'medical_history': 0.25,
            'demographics': 0.20
        }
        
    def calculate_risk_score(self, user_data):
        """
        Main function to calculate comprehensive risk score
        
        Args:
            user_data (dict): User health data including:
                - age, gender
                - ecg_metrics (hr, hrv, arrhythmia_count)
                - lifestyle (smoking, exercise, diet)
                - medical_history (diabetes, hypertension, family_history)
                - vital_signs (bp, cholesterol, bmi)
        
        Returns:
            dict: Complete risk assessment
        """
        
        # Calculate sub-scores
        ecg_score = self._calculate_ecg_risk(user_data.get('ecg_metrics', {}))
        lifestyle_score = self._calculate_lifestyle_risk(user_data.get('lifestyle', {}))
        medical_history_score = self._calculate_medical_history_risk(user_data.get('medical_history', {}))
        demographic_score = self._calculate_demographic_risk(user_data.get('demographics', {}))
        
        # Calculate overall weighted score (0-100)
        overall_score = (
            ecg_score * self.weights['ecg'] +
            lifestyle_score * self.weights['lifestyle'] +
            medical_history_score * self.weights['medical_history'] +
            demographic_score * self.weights['demographics']
        )
        
        # Round to integer
        overall_score = int(round(overall_score))
        
        # Determine risk level
        risk_level = self._determine_risk_level(overall_score)
        
        # Calculate time-based risk predictions
        risk_predictions = self._calculate_time_based_risk(overall_score, user_data)
        
        # Identify risk factors
        risk_factors = self._identify_risk_factors(user_data, {
            'ecg': ecg_score,
            'lifestyle': lifestyle_score,
            'medical_history': medical_history_score,
            'demographics': demographic_score
        })
        
        # Generate recommendations
        recommendations = self._generate_recommendations(risk_factors)
        
        return {
            'overall_score': overall_score,
            'risk_level': risk_level,
            'ecg_risk_score': int(ecg_score),
            'lifestyle_risk_score': int(lifestyle_score),
            'medical_history_risk_score': int(medical_history_score),
            'demographic_risk_score': int(demographic_score),
            'risk_30_days': risk_predictions['30_days'],
            'risk_90_days': risk_predictions['90_days'],
            'risk_1_year': risk_predictions['1_year'],
            'high_risk_factors': risk_factors['high'],
            'moderate_risk_factors': risk_factors['moderate'],
            'protective_factors': risk_factors['protective'],
            'recommendations': recommendations,
            'model_version': '1.0.0',
            'confidence_score': self._calculate_confidence(user_data)
        }
    
    def _calculate_ecg_risk(self, ecg_metrics):
        """Calculate risk score from ECG data (0-100)"""
        score = 0
        
        # Resting Heart Rate (weight: 30%)
        resting_hr = ecg_metrics.get('resting_hr', 70)
        if resting_hr < 50:
            score += 25  # Bradycardia
        elif resting_hr > 100:
            score += 30  # Tachycardia
        elif resting_hr > 90:
            score += 15
        elif 60 <= resting_hr <= 80:
            score += 0  # Optimal
        
        # Heart Rate Variability (weight: 25%)
        hrv_sdnn = ecg_metrics.get('hrv_sdnn', 50)
        if hrv_sdnn < 20:
            score += 25  # Very low HRV
        elif hrv_sdnn < 30:
            score += 15
        elif hrv_sdnn < 40:
            score += 5
        elif hrv_sdnn > 80:
            score -= 5  # Excellent HRV (protective)
        
        # Arrhythmia Episodes (weight: 25%)
        arrhythmia_count = ecg_metrics.get('arrhythmia_episodes_30days', 0)
        if arrhythmia_count > 50:
            score += 25
        elif arrhythmia_count > 20:
            score += 15
        elif arrhythmia_count > 10:
            score += 8
        elif arrhythmia_count > 5:
            score += 3
        
        # PVC Count (weight: 10%)
        pvc_count = ecg_metrics.get('pvc_count_24h', 0)
        if pvc_count > 1000:
            score += 10
        elif pvc_count > 500:
            score += 5
        
        # AFib Detection (weight: 10%)
        has_afib = ecg_metrics.get('afib_detected', False)
        if has_afib:
            score += 10
        
        return min(score, 100)
    
    def _calculate_lifestyle_risk(self, lifestyle):
        """Calculate risk score from lifestyle factors (0-100)"""
        score = 0
        
        # Smoking (weight: 30%)
        if lifestyle.get('smoking_status') == 'current':
            score += 30
        elif lifestyle.get('smoking_status') == 'former':
            years_quit = lifestyle.get('years_since_quit', 0)
            if years_quit < 5:
                score += 15
            elif years_quit < 10:
                score += 8
        
        # Physical Activity (weight: 25%)
        exercise_min_week = lifestyle.get('exercise_minutes_per_week', 0)
        if exercise_min_week < 30:
            score += 25
        elif exercise_min_week < 60:
            score += 15
        elif exercise_min_week < 150:
            score += 5
        elif exercise_min_week > 300:
            score -= 5  # Protective
        
        # BMI (weight: 20%)
        bmi = lifestyle.get('bmi', 25)
        if bmi >= 40:
            score += 20  # Class 3 obesity
        elif bmi >= 35:
            score += 15  # Class 2 obesity
        elif bmi >= 30:
            score += 10  # Class 1 obesity
        elif bmi >= 25:
            score += 5   # Overweight
        elif bmi < 18.5:
            score += 8   # Underweight
        elif 18.5 <= bmi <= 24.9:
            score -= 5   # Healthy weight (protective)
        
        # Alcohol Consumption (weight: 15%)
        drinks_per_week = lifestyle.get('alcohol_drinks_per_week', 0)
        if drinks_per_week > 14:
            score += 15  # Heavy drinking
        elif drinks_per_week > 7:
            score += 8
        elif 1 <= drinks_per_week <= 7:
            score -= 3   # Moderate (may be protective)
        
        # Diet Quality (weight: 10%)
        diet_score = lifestyle.get('diet_quality_score', 50)  # 0-100
        if diet_score < 30:
            score += 10
        elif diet_score < 50:
            score += 5
        elif diet_score > 80:
            score -= 5  # Excellent diet (protective)
        
        return min(score, 100)
    
    def _calculate_medical_history_risk(self, medical_history):
        """Calculate risk score from medical history (0-100)"""
        score = 0
        
        # Hypertension (weight: 20%)
        if medical_history.get('hypertension'):
            bp_controlled = medical_history.get('bp_controlled', False)
            if not bp_controlled:
                score += 20
            else:
                score += 10
        
        # Diabetes (weight: 20%)
        if medical_history.get('diabetes'):
            hba1c = medical_history.get('hba1c', 7.0)
            if hba1c >= 9.0:
                score += 20
            elif hba1c >= 8.0:
                score += 15
            elif hba1c >= 7.0:
                score += 10
            else:
                score += 5  # Well controlled
        
        # High Cholesterol (weight: 15%)
        ldl = medical_history.get('ldl_cholesterol', 100)
        if ldl >= 190:
            score += 15
        elif ldl >= 160:
            score += 10
        elif ldl >= 130:
            score += 5
        
        # Previous Cardiac Events (weight: 25%)
        if medical_history.get('previous_heart_attack'):
            score += 25
        if medical_history.get('previous_stroke'):
            score += 20
        if medical_history.get('previous_cardiac_surgery'):
            score += 15
        
        # Family History (weight: 15%)
        if medical_history.get('family_history_heart_disease'):
            age_at_onset = medical_history.get('family_history_age', 65)
            if age_at_onset < 45:
                score += 15
            elif age_at_onset < 55:
                score += 10
            else:
                score += 5
        
        # Other Conditions (weight: 5%)
        if medical_history.get('chronic_kidney_disease'):
            score += 5
        if medical_history.get('sleep_apnea'):
            score += 3
        
        return min(score, 100)
    
    def _calculate_demographic_risk(self, demographics):
        """Calculate risk score from demographic factors (0-100)"""
        score = 0
        
        # Age (weight: 60%)
        age = demographics.get('age', 40)
        if age >= 75:
            score += 60
        elif age >= 65:
            score += 45
        elif age >= 55:
            score += 30
        elif age >= 45:
            score += 15
        elif age < 30:
            score -= 10  # Young age protective
        
        # Gender (weight: 30%)
        gender = demographics.get('gender', 'male')
        age = demographics.get('age', 40)
        if gender == 'male' and age >= 45:
            score += 15
        elif gender == 'female' and age >= 55:
            score += 15  # Post-menopausal
        
        # Ethnicity (weight: 10%)
        # Some ethnicities have higher cardiac risk
        ethnicity = demographics.get('ethnicity', '')
        if ethnicity in ['african_american', 'south_asian']:
            score += 10
        
        return min(score, 100)
    
    def _determine_risk_level(self, overall_score):
        """Determine risk level category"""
        if overall_score >= 75:
            return 'critical'
        elif overall_score >= 50:
            return 'high'
        elif overall_score >= 30:
            return 'moderate'
        else:
            return 'low'
    
    def _calculate_time_based_risk(self, overall_score, user_data):
        """Calculate probability of cardiac event over time periods"""
        # Base probability increases with overall score
        base_prob = overall_score / 100.0
        
        # Adjust for specific high-risk factors
        multiplier = 1.0
        medical_history = user_data.get('medical_history', {})
        
        if medical_history.get('previous_heart_attack'):
            multiplier *= 2.0
        if medical_history.get('diabetes'):
            multiplier *= 1.5
        if medical_history.get('afib_detected'):
            multiplier *= 1.8
        
        # Calculate time-based probabilities
        # Using exponential model: P(t) = 1 - e^(-λt)
        lambda_param = base_prob * multiplier * 0.1
        
        prob_30_days = int((1 - np.exp(-lambda_param * (30/365))) * 100)
        prob_90_days = int((1 - np.exp(-lambda_param * (90/365))) * 100)
        prob_1_year = int((1 - np.exp(-lambda_param * 1)) * 100)
        
        return {
            '30_days': min(prob_30_days, 100),
            '90_days': min(prob_90_days, 100),
            '1_year': min(prob_1_year, 100)
        }
    
    def _identify_risk_factors(self, user_data, sub_scores):
        """Identify and categorize specific risk factors"""
        high_risk = []
        moderate_risk = []
        protective = []
        
        # ECG Factors
        ecg = user_data.get('ecg_metrics', {})
        if ecg.get('resting_hr', 70) > 100:
            high_risk.append({'factor': 'High Resting Heart Rate', 'value': f"{ecg.get('resting_hr')} BPM", 'category': 'ecg'})
        if ecg.get('hrv_sdnn', 50) < 30:
            high_risk.append({'factor': 'Low Heart Rate Variability', 'value': f"SDNN {ecg.get('hrv_sdnn')}ms", 'category': 'ecg'})
        if ecg.get('arrhythmia_episodes_30days', 0) > 20:
            high_risk.append({'factor': 'Frequent Arrhythmias', 'value': f"{ecg.get('arrhythmia_episodes_30days')} episodes/month", 'category': 'ecg'})
        elif ecg.get('arrhythmia_episodes_30days', 0) > 10:
            moderate_risk.append({'factor': 'Occasional Arrhythmias', 'value': f"{ecg.get('arrhythmia_episodes_30days')} episodes/month", 'category': 'ecg'})
        
        # Lifestyle Factors
        lifestyle = user_data.get('lifestyle', {})
        if lifestyle.get('smoking_status') == 'current':
            high_risk.append({'factor': 'Current Smoker', 'value': 'Active tobacco use', 'category': 'lifestyle'})
        if lifestyle.get('bmi', 25) >= 30:
            high_risk.append({'factor': 'Obesity', 'value': f"BMI {lifestyle.get('bmi')}", 'category': 'lifestyle'})
        elif lifestyle.get('bmi', 25) >= 25:
            moderate_risk.append({'factor': 'Overweight', 'value': f"BMI {lifestyle.get('bmi')}", 'category': 'lifestyle'})
        if lifestyle.get('exercise_minutes_per_week', 0) < 60:
            moderate_risk.append({'factor': 'Sedentary Lifestyle', 'value': f"{lifestyle.get('exercise_minutes_per_week')} min/week", 'category': 'lifestyle'})
        elif lifestyle.get('exercise_minutes_per_week', 0) > 200:
            protective.append({'factor': 'Regular Exercise', 'value': f"{lifestyle.get('exercise_minutes_per_week')} min/week", 'category': 'lifestyle'})
        
        # Medical History Factors
        med_hist = user_data.get('medical_history', {})
        if med_hist.get('previous_heart_attack'):
            high_risk.append({'factor': 'Previous Heart Attack', 'value': 'History present', 'category': 'medical_history'})
        if med_hist.get('diabetes'):
            high_risk.append({'factor': 'Diabetes', 'value': f"HbA1c {med_hist.get('hba1c', 'Unknown')}", 'category': 'medical_history'})
        if med_hist.get('hypertension') and not med_hist.get('bp_controlled'):
            high_risk.append({'factor': 'Uncontrolled Hypertension', 'value': 'BP not at target', 'category': 'medical_history'})
        elif med_hist.get('hypertension') and med_hist.get('bp_controlled'):
            moderate_risk.append({'factor': 'Controlled Hypertension', 'value': 'On medication', 'category': 'medical_history'})
        
        # Demographics
        demographics = user_data.get('demographics', {})
        age = demographics.get('age', 40)
        if age >= 65:
            moderate_risk.append({'factor': 'Advanced Age', 'value': f"{age} years old", 'category': 'demographics'})
        
        return {
            'high': high_risk,
            'moderate': moderate_risk,
            'protective': protective
        }
    
    def _generate_recommendations(self, risk_factors):
        """Generate personalized recommendations based on risk factors"""
        recommendations = []
        
        # Recommendation templates
        rec_templates = {
            'High Resting Heart Rate': {
                'priority': 'high',
                'action': 'Reduce caffeine intake and practice stress management techniques',
                'expected_impact': 15,
                'timeframe': '2-4 weeks'
            },
            'Low Heart Rate Variability': {
                'priority': 'high',
                'action': 'Improve sleep quality (7-9 hours) and try meditation or deep breathing exercises',
                'expected_impact': 12,
                'timeframe': '4-8 weeks'
            },
            'Frequent Arrhythmias': {
                'priority': 'high',
                'action': 'Schedule appointment with cardiologist for comprehensive evaluation',
                'expected_impact': 20,
                'timeframe': 'Immediate'
            },
            'Current Smoker': {
                'priority': 'critical',
                'action': 'Enroll in smoking cessation program - single most important change you can make',
                'expected_impact': 35,
                'timeframe': '3-6 months'
            },
            'Obesity': {
                'priority': 'high',
                'action': 'Create 500 calorie daily deficit through diet and exercise',
                'expected_impact': 18,
                'timeframe': '3-6 months'
            },
            'Sedentary Lifestyle': {
                'priority': 'medium',
                'action': 'Start with 10-minute walks daily, gradually increase to 30 minutes',
                'expected_impact': 10,
                'timeframe': '4-8 weeks'
            },
            'Diabetes': {
                'priority': 'high',
                'action': 'Maintain HbA1c below 7% through medication adherence and diet',
                'expected_impact': 15,
                'timeframe': 'Ongoing'
            },
            'Uncontrolled Hypertension': {
                'priority': 'high',
                'action': 'Follow DASH diet, reduce sodium to <1500mg/day, take medications as prescribed',
                'expected_impact': 18,
                'timeframe': '4-12 weeks'
            }
        }
        
        # Generate recommendations for high-risk factors
        for factor in risk_factors['high']:
            factor_name = factor['factor']
            if factor_name in rec_templates:
                recommendations.append(rec_templates[factor_name])
        
        # Add general recommendations
        if len(risk_factors['high']) == 0 and len(risk_factors['moderate']) > 0:
            recommendations.append({
                'priority': 'medium',
                'action': 'Continue current healthy habits and schedule annual cardiac checkup',
                'expected_impact': 5,
                'timeframe': 'Ongoing'
            })
        
        # Sort by priority
        priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        recommendations.sort(key=lambda x: priority_order.get(x['priority'], 4))
        
        return recommendations[:5]  # Return top 5 recommendations
    
    def _calculate_confidence(self, user_data):
        """Calculate confidence score based on data completeness"""
        total_fields = 0
        completed_fields = 0
        
        # Check data completeness
        categories = ['ecg_metrics', 'lifestyle', 'medical_history', 'demographics']
        for category in categories:
            if category in user_data:
                data = user_data[category]
                total_fields += len(data)
                completed_fields += sum(1 for v in data.values() if v is not None and v != '')
        
        if total_fields == 0:
            return 0.5
        
        confidence = completed_fields / total_fields
        return round(confidence, 4)


# Singleton instance
risk_scorer = CardiacRiskScorer()


def calculate_user_risk(user_data):
    """
    Public API function to calculate risk score
    
    Args:
        user_data (dict): Complete user health profile
    
    Returns:
        dict: Risk assessment results
    """
    return risk_scorer.calculate_risk_score(user_data)


# Example usage
if __name__ == '__main__':
    # Example user data
    sample_user = {
        'demographics': {
            'age': 58,
            'gender': 'male',
            'ethnicity': 'caucasian'
        },
        'ecg_metrics': {
            'resting_hr': 85,
            'hrv_sdnn': 35,
            'arrhythmia_episodes_30days': 8,
            'pvc_count_24h': 450,
            'afib_detected': False
        },
        'lifestyle': {
            'smoking_status': 'former',
            'years_since_quit': 3,
            'exercise_minutes_per_week': 90,
            'bmi': 28.5,
            'alcohol_drinks_per_week': 5,
            'diet_quality_score': 55
        },
        'medical_history': {
            'hypertension': True,
            'bp_controlled': False,
            'diabetes': False,
            'ldl_cholesterol': 145,
            'previous_heart_attack': False,
            'previous_stroke': False,
            'previous_cardiac_surgery': False,
            'family_history_heart_disease': True,
            'family_history_age': 52,
            'chronic_kidney_disease': False,
            'sleep_apnea': True
        }
    }
    
    result = calculate_user_risk(sample_user)
    print(json.dumps(result, indent=2))
