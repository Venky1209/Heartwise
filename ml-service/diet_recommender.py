"""
AI-Powered Diet Recommendation System
Uses Google Gemini AI to generate personalized diet plans based on:
- Medical history
- ECG analysis results timeline
- Current medications
- Health goals
"""

import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import google.generativeai as genai

class DietRecommender:
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Diet Recommender
        
        Args:
            api_key: Google Gemini API key (if not provided, will use GEMINI_API_KEY env var)
        """
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash')
            self.ai_enabled = True
        else:
            self.ai_enabled = False
            print("⚠️  Gemini API key not found. Using rule-based recommendations only.")
    
    def generate_recommendations(
        self,
        profile: Dict,
        medical_history: Dict,
        medications: List[Dict],
        ecg_timeline: List[Dict],
        health_summary: Optional[Dict] = None
    ) -> Dict:
        """
        Generate personalized diet recommendations
        
        Args:
            profile: User profile (age, gender, height, weight, etc.)
            medical_history: Medical conditions and history
            medications: Current medications
            ecg_timeline: Timeline of ECG analysis results (last 7-30 days)
            health_summary: Weekly health summary (optional)
        
        Returns:
            Dictionary with diet recommendations, meal plans, and insights
        """
        # Prepare context for AI
        context = self._prepare_context(
            profile, medical_history, medications, ecg_timeline, health_summary
        )
        
        if self.ai_enabled:
            return self._generate_ai_recommendations(context)
        else:
            return self._generate_rule_based_recommendations(context)
    
    def _prepare_context(
        self,
        profile: Dict,
        medical_history: Dict,
        medications: List[Dict],
        ecg_timeline: List[Dict],
        health_summary: Optional[Dict]
    ) -> Dict:
        """Prepare structured context for AI model"""
        
        # Calculate BMI - convert to float in case values come as strings from DB
        bmi = None
        if profile.get('height_cm') and profile.get('weight_kg'):
            try:
                height_cm = float(profile['height_cm'])
                weight_kg = float(profile['weight_kg'])
                height_m = height_cm / 100
                bmi = round(weight_kg / (height_m ** 2), 1)
            except (ValueError, TypeError) as e:
                print(f"⚠️  Could not calculate BMI: {e}")
                bmi = None
        
        # Analyze ECG trends
        ecg_insights = self._analyze_ecg_timeline(ecg_timeline)
        
        # Identify primary health concerns
        health_concerns = self._identify_health_concerns(medical_history, ecg_insights)
        
        return {
            'profile': {
                'age': int(float(profile.get('age'))) if profile.get('age') else None,
                'gender': profile.get('gender'),
                'bmi': bmi,
                'bmi_category': self._get_bmi_category(bmi) if bmi else None
            },
            'health_concerns': health_concerns,
            'medical_conditions': {
                'hypertension': medical_history.get('has_hypertension', False),
                'diabetes': medical_history.get('has_diabetes', False),
                'diabetes_type': medical_history.get('diabetes_type'),
                'high_cholesterol': medical_history.get('has_high_cholesterol', False),
                'cholesterol_level': medical_history.get('cholesterol_level'),
                'heart_disease': any([
                    medical_history.get('previous_heart_attack'),
                    medical_history.get('previous_heart_failure'),
                    medical_history.get('previous_angina'),
                    medical_history.get('previous_arrhythmia')
                ]),
                'kidney_disease': medical_history.get('has_kidney_disease', False),
                'smoker': medical_history.get('smoker', 'never')
            },
            'medications': [
                {
                    'name': med.get('medication_name'),
                    'class': med.get('medication_class'),
                    'dosage': med.get('dosage')
                }
                for med in medications
            ],
            'ecg_insights': ecg_insights,
            'lifestyle': {
                'exercise_frequency': medical_history.get('exercise_frequency'),
                'alcohol_consumption': medical_history.get('alcohol_consumption'),
                'diet_type': medical_history.get('diet_type', 'standard')
            }
        }
    
    def _analyze_ecg_timeline(self, ecg_timeline: List[Dict]) -> Dict:
        """Analyze ECG data over time to identify trends"""
        if not ecg_timeline:
            return {
                'available': False,
                'message': 'No recent ECG data available'
            }
        
        heart_rates = []
        abnormalities = []
        classifications = []
        
        for reading in ecg_timeline:
            predictions = reading.get('predictions', {})
            
            # Extract heart rate
            if predictions.get('heart_rate'):
                heart_rates.append(predictions['heart_rate'])
            
            # Extract abnormalities
            if predictions.get('is_abnormal'):
                abnormalities.append({
                    'date': reading.get('processed_at'),
                    'classification': predictions.get('classification'),
                    'confidence': predictions.get('confidence')
                })
            
            # Track classifications
            if predictions.get('classification'):
                classifications.append(predictions['classification'])
        
        # Calculate trends
        avg_hr = round(sum(heart_rates) / len(heart_rates)) if heart_rates else None
        max_hr = max(heart_rates) if heart_rates else None
        min_hr = min(heart_rates) if heart_rates else None
        
        # Identify heart rate trend (increasing/decreasing/stable)
        hr_trend = 'stable'
        if len(heart_rates) >= 3:
            recent_avg = sum(heart_rates[-3:]) / 3
            older_avg = sum(heart_rates[:3]) / 3
            if recent_avg > older_avg + 5:
                hr_trend = 'increasing'
            elif recent_avg < older_avg - 5:
                hr_trend = 'decreasing'
        
        # Count abnormalities
        abnormal_count = len(abnormalities)
        total_readings = len(ecg_timeline)
        abnormal_percentage = round((abnormal_count / total_readings) * 100) if total_readings > 0 else 0
        
        return {
            'available': True,
            'total_readings': total_readings,
            'date_range': {
                'start': ecg_timeline[0].get('processed_at') if ecg_timeline else None,
                'end': ecg_timeline[-1].get('processed_at') if ecg_timeline else None
            },
            'heart_rate': {
                'average': avg_hr,
                'max': max_hr,
                'min': min_hr,
                'trend': hr_trend
            },
            'abnormalities': {
                'count': abnormal_count,
                'percentage': abnormal_percentage,
                'details': abnormalities[:5]  # Last 5 abnormalities
            },
            'most_common_classification': max(set(classifications), key=classifications.count) if classifications else None
        }
    
    def _identify_health_concerns(self, medical_history: Dict, ecg_insights: Dict) -> List[str]:
        """Identify primary health concerns for diet planning"""
        concerns = []
        
        # Cardiovascular concerns
        if medical_history.get('has_hypertension'):
            concerns.append('hypertension')
        if medical_history.get('has_high_cholesterol'):
            concerns.append('high_cholesterol')
        if any([
            medical_history.get('previous_heart_attack'),
            medical_history.get('previous_heart_failure'),
            medical_history.get('previous_angina'),
            medical_history.get('previous_arrhythmia')
        ]):
            concerns.append('heart_disease')
        
        # Metabolic concerns
        if medical_history.get('has_diabetes'):
            concerns.append('diabetes')
        
        # ECG-based concerns
        if ecg_insights.get('available'):
            hr_avg = ecg_insights.get('heart_rate', {}).get('average')
            if hr_avg:
                if hr_avg > 100:
                    concerns.append('tachycardia')
                elif hr_avg < 60:
                    concerns.append('bradycardia')
            
            if ecg_insights.get('abnormalities', {}).get('percentage', 0) > 50:
                concerns.append('frequent_arrhythmia')
        
        return concerns
    
    def _get_bmi_category(self, bmi: float) -> str:
        """Categorize BMI"""
        if bmi < 18.5:
            return 'underweight'
        elif bmi < 25:
            return 'normal'
        elif bmi < 30:
            return 'overweight'
        else:
            return 'obese'
    
    def _generate_ai_recommendations(self, context: Dict) -> Dict:
        """Generate recommendations using Google Gemini"""
        
        # Create prompt for AI
        prompt = self._create_ai_prompt(context)
        
        try:
            # Add system instruction in the prompt
            full_prompt = """You are a professional cardiac dietitian and nutritionist specializing in heart-healthy diets. 
Provide evidence-based, personalized diet recommendations based on the patient's medical history, ECG data, and health conditions. 
Be specific, practical, and compassionate.

IMPORTANT: Respond ONLY with valid JSON in the following format (no markdown, no extra text):
{
  "summary": "Brief overview",
  "primary_goals": ["goal1", "goal2"],
  "meal_plans": {
    "breakfast": [{"name": "meal", "portions": "amount", "calories": 0, "benefits": "why"}],
    "lunch": [...],
    "dinner": [...],
    "snacks": [...]
  },
  "foods_to_include": ["food1", "food2"],
  "foods_to_avoid": ["food1", "food2"],
  "grocery_list": {
    "proteins": ["item1", "item2"],
    "vegetables": [...],
    "fruits": [...],
    "grains": [...],
    "healthy_fats": [...],
    "other": [...]
  },
  "personalized_tips": ["tip1", "tip2"],
  "supplement_recommendations": ["supplement1", "supplement2"],
  "meal_timing_advice": "advice text"
}

""" + prompt
            
            response = self.model.generate_content(full_prompt)
            
            # Parse AI response - remove markdown code blocks if present
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]  # Remove ```json
            if response_text.startswith('```'):
                response_text = response_text[3:]  # Remove ```
            if response_text.endswith('```'):
                response_text = response_text[:-3]  # Remove trailing ```
            response_text = response_text.strip()
            
            ai_response = json.loads(response_text)
            
            # Add metadata
            ai_response['generated_at'] = datetime.now().isoformat()
            ai_response['ai_powered'] = True
            ai_response['model'] = 'gemini-2.0-flash'
            ai_response['context_summary'] = self._create_context_summary(context)
            
            return ai_response
            
        except Exception as e:
            print(f"❌ AI generation error: {e}")
            # Fallback to rule-based
            return self._generate_rule_based_recommendations(context)
    
    def _create_ai_prompt(self, context: Dict) -> str:
        """Create detailed prompt for AI model"""
        
        prompt = f"""Generate a personalized cardiac diet plan for a patient with the following profile:

**Patient Profile:**
- Age: {context['profile']['age']} years
- Gender: {context['profile']['gender']}
- BMI: {context['profile']['bmi']} ({context['profile']['bmi_category']})

**Medical Conditions:**
"""
        
        conditions = context['medical_conditions']
        if conditions['hypertension']:
            prompt += "- Hypertension (High Blood Pressure)\n"
        if conditions['diabetes']:
            prompt += f"- Diabetes Type {conditions['diabetes_type']}\n"
        if conditions['high_cholesterol']:
            prompt += f"- High Cholesterol (Level: {conditions['cholesterol_level']} mg/dL)\n"
        if conditions['heart_disease']:
            prompt += "- History of Cardiac Events\n"
        if conditions['kidney_disease']:
            prompt += "- Chronic Kidney Disease\n"
        if conditions['smoker'] != 'never':
            prompt += f"- Smoking Status: {conditions['smoker']}\n"
        
        prompt += "\n**Current Medications:**\n"
        if context['medications']:
            for med in context['medications']:
                prompt += f"- {med['name']} ({med['class']}) - {med['dosage']}\n"
        else:
            prompt += "- No current medications\n"
        
        # Add ECG insights
        ecg = context.get('ecg_insights', {})
        if ecg.get('available'):
            prompt += f"\n**ECG Timeline Analysis (Last 7-30 Days):**\n"
            prompt += f"- Total ECG Readings: {ecg['total_readings']}\n"
            hr = ecg.get('heart_rate', {})
            if hr:
                prompt += f"- Average Heart Rate: {hr.get('average')} bpm (Trend: {hr.get('trend')})\n"
                prompt += f"- Heart Rate Range: {hr.get('min')} - {hr.get('max')} bpm\n"
            
            abn = ecg.get('abnormalities', {})
            if abn.get('count', 0) > 0:
                prompt += f"- Abnormal Readings: {abn['count']} ({abn['percentage']}%)\n"
                if abn.get('details'):
                    prompt += f"- Most Recent Abnormality: {abn['details'][0]['classification']}\n"
        
        # Add lifestyle
        lifestyle = context.get('lifestyle', {})
        prompt += f"\n**Current Lifestyle:**\n"
        prompt += f"- Exercise: {lifestyle.get('exercise_frequency', 'not specified')}\n"
        prompt += f"- Alcohol: {lifestyle.get('alcohol_consumption', 'not specified')}\n"
        prompt += f"- Current Diet: {lifestyle.get('diet_type', 'standard')}\n"
        
        # Add health concerns summary
        prompt += f"\n**Primary Health Concerns:** {', '.join(context['health_concerns'])}\n"
        
        prompt += """

Please provide a comprehensive diet plan in the following JSON format:
{
  "summary": "Brief overview of the diet approach and rationale",
  "primary_goals": ["goal1", "goal2", "goal3"],
  "daily_calorie_target": 2000,
  "macronutrient_targets": {
    "protein": "20-25%",
    "carbohydrates": "45-50%",
    "fats": "25-30%"
  },
  "sodium_limit": "1500mg",
  "key_nutrients": {
    "prioritize": ["Potassium", "Magnesium", "Omega-3"],
    "limit": ["Sodium", "Saturated Fat"],
    "avoid": ["Trans Fats"]
  },
  "foods_to_increase": [
    {"food": "Leafy Greens", "examples": ["Spinach", "Kale"], "benefit": "Rich in potassium", "frequency": "Daily"},
    {"food": "Fatty Fish", "examples": ["Salmon", "Mackerel"], "benefit": "Omega-3 fatty acids", "frequency": "2-3 times per week"}
  ],
  "foods_to_limit": [
    {"food": "Processed Foods", "reason": "High in sodium", "max_frequency": "Rarely"}
  ],
  "foods_to_avoid": [
    {"food": "Trans Fats", "reason": "Increases heart disease risk"}
  ],
  "sample_meal_plan": {
    "breakfast": ["Oatmeal with berries and walnuts", "Green tea"],
    "morning_snack": ["Apple with almond butter"],
    "lunch": ["Grilled salmon with quinoa and steamed broccoli", "Side salad with olive oil dressing"],
    "afternoon_snack": ["Hummus with carrot sticks"],
    "dinner": ["Baked chicken breast with sweet potato and green beans", "Small mixed greens salad"],
    "evening_snack": ["Greek yogurt with a handful of blueberries"]
  },
  "weekly_meal_ideas": {
    "breakfast_options": ["option1", "option2", "option3"],
    "lunch_options": ["option1", "option2", "option3"],
    "dinner_options": ["option1", "option2", "option3"]
  },
  "hydration_goal": "8-10 glasses of water daily",
  "supplements": ["Optional supplements if needed"],
  "meal_timing_tips": ["Tip1", "Tip2"],
  "eating_out_tips": ["Tip1", "Tip2"],
  "grocery_shopping_list": {
    "proteins": ["item1", "item2"],
    "vegetables": ["item1", "item2"],
    "fruits": ["item1", "item2"],
    "grains": ["item1", "item2"],
    "healthy_fats": ["item1", "item2"],
    "herbs_spices": ["item1", "item2"]
  },
  "recipe_suggestions": [
    {"name": "Recipe Name", "ingredients": ["ing1", "ing2"], "benefits": "Why it's good for heart health"}
  ],
  "warnings": ["Any specific warnings based on medications or conditions"],
  "progress_monitoring": ["How to track diet effectiveness"],
  "personalized_tips": ["Tip1 specific to this patient", "Tip2", "Tip3"]
}

Make sure recommendations are practical, culturally sensitive, and evidence-based. Consider medication interactions and ECG trends when making recommendations."""
        
        return prompt
    
    def _create_context_summary(self, context: Dict) -> Dict:
        """Create a summary of the context used for recommendations"""
        return {
            'age': context['profile']['age'],
            'bmi': context['profile']['bmi'],
            'conditions_count': len([v for v in context['medical_conditions'].values() if v]),
            'medications_count': len(context['medications']),
            'ecg_readings_analyzed': context['ecg_insights'].get('total_readings', 0),
            'primary_concerns': context['health_concerns']
        }
    
    def _generate_rule_based_recommendations(self, context: Dict) -> Dict:
        """Fallback rule-based recommendations"""
        # This is a simplified version - you can expand this
        return {
            "summary": "Basic heart-healthy diet recommendations based on your profile",
            "primary_goals": [
                "Reduce cardiovascular risk",
                "Maintain healthy weight",
                "Support overall heart health"
            ],
            "ai_powered": False,
            "message": "For personalized AI-powered recommendations, please configure OpenAI API key",
            "general_tips": [
                "Follow Mediterranean diet principles",
                "Limit sodium to under 2000mg daily",
                "Include omega-3 rich foods 2-3 times per week",
                "Eat 5-7 servings of fruits and vegetables daily",
                "Choose whole grains over refined grains",
                "Limit saturated fats to less than 7% of total calories"
            ],
            "context_summary": self._create_context_summary(context)
        }


# Example usage
if __name__ == "__main__":
    # Test with sample data
    recommender = DietRecommender()
    
    sample_profile = {
        'age': 55,
        'gender': 'male',
        'height_cm': 175,
        'weight_kg': 85
    }
    
    sample_medical = {
        'has_hypertension': True,
        'has_diabetes': False,
        'has_high_cholesterol': True,
        'cholesterol_level': 240,
        'previous_heart_attack': False,
        'smoker': 'never'
    }
    
    sample_meds = [
        {'medication_name': 'Lisinopril', 'medication_class': 'ACE Inhibitor', 'dosage': '10mg'}
    ]
    
    sample_ecg = [
        {
            'processed_at': '2025-10-01',
            'predictions': {
                'heart_rate': 75,
                'is_abnormal': False,
                'classification': 'Normal'
            }
        },
        {
            'processed_at': '2025-10-02',
            'predictions': {
                'heart_rate': 82,
                'is_abnormal': False,
                'classification': 'Normal'
            }
        }
    ]
    
    recommendations = recommender.generate_recommendations(
        sample_profile,
        sample_medical,
        sample_meds,
        sample_ecg
    )
    
    print(json.dumps(recommendations, indent=2))
