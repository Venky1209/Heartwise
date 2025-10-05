/**
 * AI Diet Recommendations Display Component
 * Shows personalized diet plans with ECG-based insights
 */

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  SparklesIcon,
  HeartIcon,
  FireIcon,
  ClipboardDocumentCheckIcon,
  ShoppingBagIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

const AIDietRecommendations = () => {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState('monday');
  const [useAI, setUseAI] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [useAI]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/diet/recommendations?ai=${useAI}`);
      
      if (response.data.profileIncomplete) {
        toast.warning('Please complete your profile for personalized recommendations');
      }
      
      setRecommendations(response.data.recommendations || response.data);
      setActivePlan(response.data.activePlan);
      
      if (response.data.recommendations?.ai_powered) {
        toast.success('🤖 AI-powered recommendations generated!');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load recommendations');
      toast.error('Failed to load diet recommendations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
          <p className="mt-6 text-lg text-gray-700 font-medium">
            {useAI ? '🤖 AI analyzing your health data...' : 'Generating recommendations...'}
          </p>
          <p className="mt-2 text-sm text-gray-500">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <XCircleIcon className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Error Loading Recommendations</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!recommendations) return null;

  const isAIPowered = recommendations.ai_powered;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header with AI Badge */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center">
              {isAIPowered ? (
                <CpuChipIcon className="h-10 w-10 text-purple-600 mr-3 animate-pulse" />
              ) : (
                <SparklesIcon className="h-10 w-10 text-green-600 mr-3" />
              )}
              Personalized Diet Plan
            </h1>
            <p className="mt-2 text-gray-600 flex items-center">
              {isAIPowered ? (
                <>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium mr-2">
                    🤖 AI-Powered
                  </span>
                  Generated using advanced AI analysis of your ECG timeline
                </>
              ) : (
                <>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-2">
                    📊 Evidence-Based
                  </span>
                  Based on clinical guidelines and your health profile
                </>
              )}
            </p>
          </div>
          
          {/* AI Toggle */}
          <button
            onClick={() => {
              setUseAI(!useAI);
              toast(`Switching to ${!useAI ? 'AI' : 'rule-based'} recommendations...`, {
                icon: '🔄',
              });
            }}
            className="bg-white border-2 border-gray-300 rounded-lg px-4 py-2 hover:border-purple-400 transition-colors"
          >
            <div className="flex items-center">
              <CpuChipIcon className="h-5 w-5 mr-2" />
              <span>{useAI ? 'Using AI' : 'Rule-Based'}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Summary Section */}
      {recommendations.summary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-600 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
            <HeartIcon className="h-6 w-6 text-indigo-600 mr-2" />
            Your Personalized Approach
          </h2>
          <p className="text-gray-700 leading-relaxed">{recommendations.summary}</p>
        </div>
      )}

      {/* ECG Insights (if available) */}
      {recommendations.context_summary && recommendations.context_summary.ecg_readings_analyzed > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-purple-900 mb-3 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            ECG Timeline Analysis
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-purple-600 font-medium">ECG Readings:</span>
              <p className="text-purple-900 text-lg font-bold">
                {recommendations.context_summary.ecg_readings_analyzed}
              </p>
            </div>
            <div>
              <span className="text-purple-600 font-medium">Conditions:</span>
              <p className="text-purple-900 text-lg font-bold">
                {recommendations.context_summary.conditions_count}
              </p>
            </div>
            <div>
              <span className="text-purple-600 font-medium">Medications:</span>
              <p className="text-purple-900 text-lg font-bold">
                {recommendations.context_summary.medications_count}
              </p>
            </div>
            <div>
              <span className="text-purple-600 font-medium">BMI:</span>
              <p className="text-purple-900 text-lg font-bold">
                {recommendations.context_summary.bmi || 'N/A'}
              </p>
            </div>
          </div>
          {recommendations.context_summary.primary_concerns && (
            <div className="mt-4">
              <span className="text-purple-600 font-medium text-sm">Focus Areas:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {recommendations.context_summary.primary_concerns.map((concern, idx) => (
                  <span key={idx} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">
                    {concern.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Goals */}
      {recommendations.primary_goals && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <ClipboardDocumentCheckIcon className="h-7 w-7 text-green-600 mr-2" />
            Your Health Goals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.primary_goals.map((goal, index) => (
              <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-800 font-medium">{goal}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Macronutrient Targets */}
      {recommendations.macronutrient_targets && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <FireIcon className="h-7 w-7 text-orange-600 mr-2" />
            Daily Nutrition Targets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {recommendations.daily_calorie_target && (
              <div className="text-center">
                <div className="bg-orange-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-orange-800">
                    {recommendations.daily_calorie_target}
                  </span>
                </div>
                <p className="text-gray-600 font-medium">Daily Calories</p>
              </div>
            )}
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-blue-800">
                  {recommendations.macronutrient_targets.protein}
                </span>
              </div>
              <p className="text-gray-600 font-medium">Protein</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-green-800">
                  {recommendations.macronutrient_targets.carbohydrates}
                </span>
              </div>
              <p className="text-gray-600 font-medium">Carbs</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-yellow-800">
                  {recommendations.macronutrient_targets.fats}
                </span>
              </div>
              <p className="text-gray-600 font-medium">Fats</p>
            </div>
          </div>
          {recommendations.sodium_limit && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">
                <ExclamationTriangleIcon className="h-5 w-5 inline mr-2" />
                <strong>Sodium Limit:</strong> {recommendations.sodium_limit} per day
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sample Meal Plan */}
      {recommendations.sample_meal_plan && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <ClockIcon className="h-7 w-7 text-blue-600 mr-2" />
            Today's Meal Plan
          </h2>
          <div className="space-y-6">
            {Object.entries(recommendations.sample_meal_plan).map(([mealTime, items]) => (
              <div key={mealTime} className="border-l-4 border-blue-400 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 capitalize mb-2">
                  {mealTime.replace('_', ' ')}
                </h3>
                <ul className="space-y-2">
                  {(Array.isArray(items) ? items : [items]).map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Foods to Increase/Limit/Avoid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Increase */}
        {recommendations.foods_to_increase && (
          <div className="bg-green-50 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-green-900 mb-4">✅ Increase</h3>
            <div className="space-y-4">
              {recommendations.foods_to_increase.map((food, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3">
                  <p className="font-semibold text-gray-900">{food.food}</p>
                  <p className="text-sm text-gray-600 mt-1">{food.benefit}</p>
                  {food.examples && (
                    <p className="text-xs text-gray-500 mt-1">
                      Examples: {food.examples.join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-green-700 font-medium mt-2">
                    {food.frequency}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Limit */}
        {recommendations.foods_to_limit && (
          <div className="bg-yellow-50 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-yellow-900 mb-4">⚠️ Limit</h3>
            <div className="space-y-4">
              {recommendations.foods_to_limit.map((food, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3">
                  <p className="font-semibold text-gray-900">{food.food}</p>
                  <p className="text-sm text-gray-600 mt-1">{food.reason}</p>
                  {food.max_frequency && (
                    <p className="text-xs text-yellow-700 font-medium mt-2">
                      Max: {food.max_frequency}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Avoid */}
        {recommendations.foods_to_avoid && (
          <div className="bg-red-50 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-red-900 mb-4">❌ Avoid</h3>
            <div className="space-y-4">
              {recommendations.foods_to_avoid.map((food, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3">
                  <p className="font-semibold text-gray-900">{food.food}</p>
                  <p className="text-sm text-gray-600 mt-1">{food.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grocery Shopping List */}
      {recommendations.grocery_shopping_list && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <ShoppingBagIcon className="h-7 w-7 text-indigo-600 mr-2" />
            Grocery Shopping List
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {Object.entries(recommendations.grocery_shopping_list).map(([category, items]) => (
              <div key={category}>
                <h3 className="font-semibold text-gray-900 capitalize mb-3 pb-2 border-b-2 border-indigo-200">
                  {category.replace('_', ' ')}
                </h3>
                <ul className="space-y-2">
                  {items.map((item, idx) => (
                    <li key={idx} className="text-gray-700 text-sm flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personalized Tips */}
      {recommendations.personalized_tips && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <SparklesIcon className="h-7 w-7 text-purple-600 mr-2" />
            Personalized Tips for You
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.personalized_tips.map((tip, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 flex items-start">
                <span className="bg-purple-100 text-purple-800 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mr-3 font-bold">
                  {idx + 1}
                </span>
                <p className="text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIDietRecommendations;
