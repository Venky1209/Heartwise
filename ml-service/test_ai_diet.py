#!/usr/bin/env python3
"""
Test Script for AI Diet Recommendation System
Tests the complete flow from medical data to AI recommendations
"""

import json
import sys
from diet_recommender import DietRecommender

def test_basic_functionality():
    """Test basic diet recommender functionality"""
    print("=" * 60)
    print("🧪 Testing AI Diet Recommendation System")
    print("=" * 60)
    print()
    
    # Initialize recommender
    print("📋 Step 1: Initializing Diet Recommender...")
    recommender = DietRecommender()
    
    if recommender.ai_enabled:
        print("✅ AI enabled (OpenAI API key detected)")
    else:
        print("⚠️  AI disabled (using rule-based recommendations)")
    print()
    
    # Sample patient data
    print("📋 Step 2: Creating sample patient data...")
    
    profile = {
        'age': 58,
        'gender': 'male',
        'height_cm': 175,
        'weight_kg': 88
    }
    
    medical_history = {
        'has_hypertension': True,
        'has_diabetes': False,
        'has_high_cholesterol': True,
        'cholesterol_level': 245,
        'previous_heart_attack': False,
        'previous_heart_failure': False,
        'previous_angina': True,
        'previous_arrhythmia': False,
        'has_kidney_disease': False,
        'smoker': 'never',
        'exercise_frequency': 'light',
        'alcohol_consumption': 'moderate',
        'diet_type': 'standard'
    }
    
    medications = [
        {
            'medication_name': 'Lisinopril',
            'medication_class': 'ACE Inhibitor',
            'dosage': '10mg'
        },
        {
            'medication_name': 'Atorvastatin',
            'medication_class': 'Statin',
            'dosage': '20mg'
        }
    ]
    
    ecg_timeline = [
        {
            'session_id': 'test-001',
            'processed_at': '2025-10-01T10:00:00Z',
            'predictions': {
                'heart_rate': 78,
                'is_abnormal': False,
                'classification': 'Normal',
                'confidence': 0.95
            }
        },
        {
            'session_id': 'test-002',
            'processed_at': '2025-10-02T10:00:00Z',
            'predictions': {
                'heart_rate': 82,
                'is_abnormal': False,
                'classification': 'Normal',
                'confidence': 0.93
            }
        },
        {
            'session_id': 'test-003',
            'processed_at': '2025-10-03T10:00:00Z',
            'predictions': {
                'heart_rate': 85,
                'is_abnormal': True,
                'classification': 'Premature Atrial Contraction',
                'confidence': 0.88
            }
        }
    ]
    
    print("✅ Sample data created")
    print(f"   - Age: {profile['age']}, Gender: {profile['gender']}")
    print(f"   - BMI: {round(profile['weight_kg'] / ((profile['height_cm']/100)**2), 1)}")
    print(f"   - Conditions: Hypertension ✓, High Cholesterol ✓, Previous Angina ✓")
    print(f"   - Medications: {len(medications)}")
    print(f"   - ECG Readings: {len(ecg_timeline)} (last 3 days)")
    print()
    
    # Generate recommendations
    print("📋 Step 3: Generating recommendations...")
    print("   This may take 5-10 seconds if using AI...")
    print()
    
    try:
        recommendations = recommender.generate_recommendations(
            profile=profile,
            medical_history=medical_history,
            medications=medications,
            ecg_timeline=ecg_timeline
        )
        
        print("✅ Recommendations generated successfully!")
        print()
        
        # Display results
        print("=" * 60)
        print("📊 RECOMMENDATION SUMMARY")
        print("=" * 60)
        print()
        
        if recommendations.get('ai_powered'):
            print("🤖 AI-POWERED RECOMMENDATIONS")
            print(f"   Model: {recommendations.get('model', 'N/A')}")
            print(f"   Generated at: {recommendations.get('generated_at', 'N/A')}")
        else:
            print("📊 RULE-BASED RECOMMENDATIONS")
        
        print()
        
        # Summary
        if 'summary' in recommendations:
            print("📝 Summary:")
            print(f"   {recommendations['summary'][:200]}...")
            print()
        
        # Goals
        if 'primary_goals' in recommendations:
            print("🎯 Primary Goals:")
            for goal in recommendations['primary_goals']:
                print(f"   ✓ {goal}")
            print()
        
        # Calorie target
        if 'daily_calorie_target' in recommendations:
            print(f"🔥 Daily Calorie Target: {recommendations['daily_calorie_target']} calories")
            print()
        
        # Macros
        if 'macronutrient_targets' in recommendations:
            print("📊 Macronutrient Targets:")
            macros = recommendations['macronutrient_targets']
            print(f"   Protein: {macros.get('protein', 'N/A')}")
            print(f"   Carbs: {macros.get('carbohydrates', 'N/A')}")
            print(f"   Fats: {macros.get('fats', 'N/A')}")
            print()
        
        # Sodium
        if 'sodium_limit' in recommendations:
            print(f"🧂 Sodium Limit: {recommendations['sodium_limit']}/day")
            print()
        
        # Foods to increase
        if 'foods_to_increase' in recommendations:
            print("✅ Foods to Increase:")
            for food in recommendations['foods_to_increase'][:3]:
                print(f"   • {food.get('food')}: {food.get('benefit')}")
            print()
        
        # Sample meal
        if 'sample_meal_plan' in recommendations:
            print("🍽️  Sample Breakfast:")
            breakfast = recommendations['sample_meal_plan'].get('breakfast', [])
            for item in (breakfast if isinstance(breakfast, list) else [breakfast]):
                print(f"   • {item}")
            print()
        
        # Tips count
        if 'personalized_tips' in recommendations:
            tips = recommendations['personalized_tips']
            print(f"💡 Personalized Tips: {len(tips)} tips provided")
            print()
        
        # Context summary
        if 'context_summary' in recommendations:
            ctx = recommendations['context_summary']
            print("📈 Analysis Context:")
            print(f"   • ECG Readings: {ctx.get('ecg_readings_analyzed', 0)}")
            print(f"   • Medical Conditions: {ctx.get('conditions_count', 0)}")
            print(f"   • Medications: {ctx.get('medications_count', 0)}")
            print(f"   • Primary Concerns: {', '.join(ctx.get('primary_concerns', []))}")
            print()
        
        print("=" * 60)
        print("✅ Test completed successfully!")
        print("=" * 60)
        print()
        
        # Save full output
        output_file = 'test_diet_recommendation_output.json'
        with open(output_file, 'w') as f:
            json.dump(recommendations, f, indent=2)
        
        print(f"💾 Full recommendation saved to: {output_file}")
        print()
        
        return True
        
    except Exception as e:
        print(f"❌ Error generating recommendations: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_ai_availability():
    """Test if AI is available and working"""
    print("=" * 60)
    print("🔍 Testing AI Availability")
    print("=" * 60)
    print()
    
    try:
        from openai import OpenAI
        import os
        
        api_key = os.getenv('OPENAI_API_KEY')
        
        if not api_key or api_key == 'your_openai_api_key_here':
            print("⚠️  OpenAI API key not set")
            print("   Set OPENAI_API_KEY environment variable")
            return False
        
        print("✅ OpenAI package imported")
        print("✅ API key detected")
        print()
        
        # Try a simple request
        client = OpenAI(api_key=api_key)
        print("📡 Testing API connection...")
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Say 'API Working' if you receive this."}],
            max_tokens=10
        )
        
        print(f"✅ API Response: {response.choices[0].message.content}")
        print()
        
        return True
        
    except ImportError:
        print("❌ OpenAI package not installed")
        print("   Run: pip install openai")
        return False
    except Exception as e:
        print(f"❌ API Error: {e}")
        return False

if __name__ == "__main__":
    print()
    print("🚀 HeartWise AI Diet Recommendation System - Test Suite")
    print()
    
    # Test 1: AI Availability
    ai_available = test_ai_availability()
    print()
    
    # Test 2: Basic Functionality
    test_passed = test_basic_functionality()
    
    # Summary
    print()
    print("=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print()
    print(f"AI Available: {'✅ Yes' if ai_available else '⚠️  No (will use rule-based)'}")
    print(f"Functionality Test: {'✅ Passed' if test_passed else '❌ Failed'}")
    print()
    
    if test_passed:
        print("🎉 All tests passed! Your AI diet system is ready.")
        print()
        print("Next steps:")
        print("1. Start ML service: python app.py")
        print("2. Test via API: curl http://localhost:5002/diet/recommend")
        print("3. Use in frontend: http://localhost:3000/ai-diet")
        sys.exit(0)
    else:
        print("❌ Some tests failed. Please check the errors above.")
        sys.exit(1)
