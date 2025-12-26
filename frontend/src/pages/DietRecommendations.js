/**
 * Diet Recommendations Page
 * Personalized nutrition guidance based on heart health
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  SparklesIcon,
  HeartIcon,
  ClipboardDocumentCheckIcon,
  BeakerIcon,
  FireIcon
} from '@heroicons/react/24/outline';

const DietRecommendations = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [error, setError] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState('breakfast');

  const [profileIncomplete, setProfileIncomplete] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/diet/recommendations');
      setRecommendations(response.data.recommendations);
      setActivePlan(response.data.activePlan);
      setProfileIncomplete(response.data.profileIncomplete || false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load diet recommendations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating your personalized plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!recommendations) return null;

  // Ensure all required fields have defaults to prevent rendering errors
  const safeRecommendations = {
    goals: recommendations.goals || ['Maintain heart health', 'Balanced nutrition'],
    restrictions: recommendations.restrictions || ['Limit processed foods', 'Reduce sodium intake'],
    nutrients: {
      prioritize: recommendations.nutrients?.prioritize || ['Omega-3 fatty acids', 'Fiber', 'Potassium'],
      limit: recommendations.nutrients?.limit || ['Sodium', 'Saturated fats'],
      avoid: recommendations.nutrients?.avoid || ['Trans fats', 'Excessive sugar']
    },
    foodGroups: {
      increase: recommendations.foodGroups?.increase || [],
      reduce: recommendations.foodGroups?.reduce || []
    },
    mealPlan: {
      breakfast: recommendations.mealPlan?.breakfast || [],
      lunch: recommendations.mealPlan?.lunch || [],
      dinner: recommendations.mealPlan?.dinner || [],
      snacks: recommendations.mealPlan?.snacks || []
    },
    tips: recommendations.tips || ['Stay hydrated with 8 glasses of water daily'],
    waterIntake: recommendations.waterIntake || '8-10 glasses per day'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Profile Incomplete Warning */}
      {profileIncomplete && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">👤</span>
            <div>
              <p className="font-semibold text-amber-800">Complete Your Profile for Personalized Recommendations</p>
              <p className="text-amber-700 text-sm">
                Add your age, weight, and health conditions to get AI-powered diet recommendations tailored just for you.
              </p>
              <a href="/profile" className="inline-block mt-2 text-amber-600 hover:text-amber-800 font-medium underline">
                Go to Profile →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <SparklesIcon className="h-8 w-8 text-green-600 mr-3" />
          {profileIncomplete ? 'General Diet Recommendations' : 'Personalized Diet Recommendations'}
        </h1>
        <p className="mt-2 text-gray-600">
          {profileIncomplete 
            ? 'Heart-healthy nutrition guidance for everyone' 
            : 'AI-powered nutrition guidance tailored to your heart health'
          }
        </p>
      </div>

      {/* Goals & Restrictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Goals */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <ClipboardDocumentCheckIcon className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Your Health Goals</h2>
          </div>
          <ul className="space-y-2">
            {safeRecommendations.goals.map((goal, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">{goal}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Restrictions */}
        <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <BeakerIcon className="h-6 w-6 text-yellow-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Dietary Guidelines</h2>
          </div>
          <ul className="space-y-2">
            {safeRecommendations.restrictions.map((restriction, index) => (
              <li key={index} className="flex items-start">
                <span className="text-yellow-600 mr-2">⚠</span>
                <span className="text-gray-700">{restriction}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-yellow-200">
            <div className="flex items-center text-sm text-gray-600">
              <FireIcon className="h-5 w-5 text-blue-500 mr-2" />
              <span><strong>Hydration:</strong> {safeRecommendations.waterIntake}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nutrients */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Nutrient Focus</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Prioritize */}
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-green-700 mb-2">✅ Prioritize</h3>
            <ul className="space-y-1">
              {safeRecommendations.nutrients.prioritize.map((nutrient, index) => (
                <li key={index} className="text-sm text-gray-700">{nutrient}</li>
              ))}
            </ul>
          </div>

          {/* Limit */}
          <div className="border-l-4 border-yellow-500 pl-4">
            <h3 className="font-semibold text-yellow-700 mb-2">⚠️ Limit</h3>
            <ul className="space-y-1">
              {safeRecommendations.nutrients.limit.map((nutrient, index) => (
                <li key={index} className="text-sm text-gray-700">{nutrient}</li>
              ))}
            </ul>
          </div>

          {/* Avoid */}
          <div className="border-l-4 border-red-500 pl-4">
            <h3 className="font-semibold text-red-700 mb-2">❌ Avoid</h3>
            <ul className="space-y-1">
              {safeRecommendations.nutrients.avoid.map((nutrient, index) => (
                <li key={index} className="text-sm text-gray-700">{nutrient}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Food Groups */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Food Group Guidance</h2>
        
        {/* Increase */}
        {safeRecommendations.foodGroups.increase.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-green-700 mb-3 flex items-center">
              <span className="text-2xl mr-2">📈</span>
              Increase These Foods
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {safeRecommendations.foodGroups.increase.map((group, index) => (
                <div key={index} className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-gray-900 mb-2">{group.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{group.benefit}</p>
                  <div className="flex flex-wrap gap-1">
                    {group.examples.map((food, idx) => (
                      <span key={idx} className="bg-white px-2 py-1 rounded text-xs text-gray-700">
                        {food}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reduce */}
        {safeRecommendations.foodGroups.reduce.length > 0 && (
          <div>
            <h3 className="font-semibold text-red-700 mb-3 flex items-center">
              <span className="text-2xl mr-2">📉</span>
              Reduce These Foods
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {safeRecommendations.foodGroups.reduce.map((group, index) => (
                <div key={index} className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h4 className="font-semibold text-gray-900 mb-2">{group.name}</h4>
                  <p className="text-sm text-gray-600 mb-2"><strong>Why:</strong> {group.reason}</p>
                  <div className="flex flex-wrap gap-1">
                    {group.examples.map((food, idx) => (
                      <span key={idx} className="bg-white px-2 py-1 rounded text-xs text-gray-700">
                        {food}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sample Meal Plan */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Sample Meal Plan</h2>
        
        {/* Meal Type Tabs */}
        <div className="flex space-x-2 mb-6 border-b">
          {['breakfast', 'lunch', 'dinner', 'snacks'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedMealType(type)}
              className={`px-4 py-2 font-medium capitalize transition ${
                selectedMealType === type
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Meal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {safeRecommendations.mealPlan[selectedMealType].map((meal, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{meal.name}</h3>
                {meal.hearthealthy && (
                  <HeartIcon className="h-5 w-5 text-red-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">{meal.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {meal.calories} cal
                </span>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  Heart-Healthy
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Expert Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {safeRecommendations.tips.map((tip, index) => (
            <div key={index} className="flex items-start bg-white rounded-lg p-3">
              <span className="text-blue-600 font-bold mr-2">{index + 1}.</span>
              <span className="text-gray-700 text-sm">{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DietRecommendations;
