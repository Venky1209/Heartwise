/**
 * Weekly Health Summary Page
 * Displays comprehensive weekly heart health analysis
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  HeartIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const WeeklySummary = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weeksAgo, setWeeksAgo] = useState(0);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeeklySummary();
  }, [weeksAgo]);

  const fetchWeeklySummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/health-summary/weekly-summary?weeksAgo=${weeksAgo}`);
      setSummary(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load weekly summary');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInsightColor = (level) => {
    switch (level) {
      case 'success': return 'bg-green-100 border-green-500 text-green-800';
      case 'warning': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'info': return 'bg-blue-100 border-blue-500 text-blue-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your weekly summary...</p>
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

  if (!summary) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <HeartIcon className="h-8 w-8 text-red-600 mr-3" />
          Weekly Heart Health Summary
        </h1>
        <p className="mt-2 text-gray-600">
          Comprehensive analysis of your cardiovascular health
        </p>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setWeeksAgo(weeksAgo + 1)}
            className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Previous Week
          </button>
          
          <div className="text-center">
            <div className="flex items-center justify-center text-lg font-semibold text-gray-900">
              <CalendarIcon className="h-5 w-5 mr-2" />
              {formatDate(summary.period.start)} - {formatDate(summary.period.end)}
            </div>
            <p className="text-sm text-gray-500">
              {weeksAgo === 0 ? 'Current Week' : `${weeksAgo} week${weeksAgo > 1 ? 's' : ''} ago`}
            </p>
          </div>

          <button
            onClick={() => setWeeksAgo(Math.max(0, weeksAgo - 1))}
            disabled={weeksAgo === 0}
            className={`flex items-center px-4 py-2 rounded-lg transition ${
              weeksAgo === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Next Week
            <ArrowRightIcon className="h-5 w-5 ml-2" />
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Sessions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {summary.summary.totalSessions}
              </p>
              {summary.comparison.sessions.change !== 0 && (
                <div className={`flex items-center mt-2 text-sm ${
                  summary.comparison.sessions.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {summary.comparison.sessions.change > 0 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(summary.comparison.sessions.change)} from last week
                </div>
              )}
            </div>
            <ChartBarIcon className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        {/* Average Heart Rate */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Heart Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {summary.summary.avgHeartRate || 'N/A'}
                {summary.summary.avgHeartRate && <span className="text-lg text-gray-500 ml-1">bpm</span>}
              </p>
              {summary.comparison.heartRate.change !== null && summary.comparison.heartRate.change !== 0 && (
                <div className={`flex items-center mt-2 text-sm ${
                  summary.comparison.heartRate.change > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {summary.comparison.heartRate.change > 0 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(summary.comparison.heartRate.change)} bpm
                </div>
              )}
            </div>
            <HeartIcon className="h-12 w-12 text-red-500" />
          </div>
        </div>

        {/* Heart Rate Range */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm font-medium text-gray-600">HR Range</p>
          <div className="mt-2">
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-900">
                {summary.summary.minHeartRate || 'N/A'}
              </span>
              <span className="text-gray-500 mx-2">-</span>
              <span className="text-2xl font-bold text-gray-900">
                {summary.summary.maxHeartRate || 'N/A'}
              </span>
              {summary.summary.minHeartRate && (
                <span className="text-sm text-gray-500 ml-2">bpm</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Min - Max</p>
          </div>
        </div>

        {/* HRV */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg HRV</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {summary.summary.avgHRV || 'N/A'}
                {summary.summary.avgHRV && <span className="text-lg text-gray-500 ml-1">ms</span>}
              </p>
              {summary.comparison.hrv.change !== null && summary.comparison.hrv.change !== 0 && (
                <div className={`flex items-center mt-2 text-sm ${
                  summary.comparison.hrv.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {summary.comparison.hrv.change > 0 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(summary.comparison.hrv.change)} ms
                </div>
              )}
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Health Insights */}
      {summary.insights && summary.insights.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Health Insights</h2>
          <div className="space-y-4">
            {summary.insights.map((insight, index) => (
              <div
                key={index}
                className={`border-l-4 p-4 rounded ${getInsightColor(insight.level)}`}
              >
                <div className="flex items-start">
                  <span className="text-2xl mr-3">{insight.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold">{insight.title}</h3>
                    <p className="mt-1 text-sm">{insight.message}</p>
                    {insight.details && (
                      <div className="mt-2 text-xs">
                        <strong>Details:</strong> {JSON.stringify(insight.details)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Breakdown Chart */}
      {summary.dailyBreakdown && summary.dailyBreakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Daily Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg HR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg HRV
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summary.dailyBreakdown.map((day, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatDate(day.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {day.sessionCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Math.floor(day.totalDuration / 60)} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {day.avgHeartRate || 'N/A'} {day.avgHeartRate && 'bpm'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {day.avgHRV || 'N/A'} {day.avgHRV && 'ms'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklySummary;
