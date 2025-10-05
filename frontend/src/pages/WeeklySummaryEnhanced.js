/**
 * Enhanced Weekly ECG Health Summary
 * Shows daily ECG sessions, analysis results, trends, and comprehensive health report
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  HeartIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

const WeeklySummary = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDayStatusColor = (status) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800 border-green-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
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

  // Prepare data for charts
  const heartRateData = summary.dailyBreakdown
    .filter(day => day.avgHeartRate)
    .map(day => ({
      day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
      avgHR: day.avgHeartRate,
      minHR: day.minHeartRate,
      maxHR: day.maxHeartRate
    }));

  const hrvData = summary.dailyBreakdown
    .filter(day => day.avgHRV)
    .map(day => ({
      day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
      HRV: day.avgHRV
    }));

  const sessionData = summary.dailyBreakdown.map(day => ({
    day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    sessions: day.sessionCount,
    duration: Math.round(day.totalDuration / 60) // Convert to minutes
  }));

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
            className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Previous Week
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center text-gray-900 font-semibold">
              <CalendarIcon className="h-5 w-5 mr-2" />
              {formatDate(summary.period.start)} - {formatDate(summary.period.end)}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {weeksAgo === 0 ? 'Current Week' : `${weeksAgo} week${weeksAgo > 1 ? 's' : ''} ago`}
            </p>
          </div>

          <button
            onClick={() => setWeeksAgo(Math.max(0, weeksAgo - 1))}
            disabled={weeksAgo === 0}
            className={`flex items-center px-4 py-2 rounded-lg transition ${
              weeksAgo === 0
                ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Next Week
            <ArrowRightIcon className="h-5 w-5 ml-2" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {summary.summary.totalSessions}
              </p>
            </div>
            <ChartBarIcon className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg Heart Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {summary.summary.avgHeartRate ? `${Math.round(summary.summary.avgHeartRate)}` : 'N/A'}
              </p>
              {summary.summary.avgHeartRate && (
                <p className="text-xs text-gray-500 mt-1">
                  {summary.summary.minHeartRate}-{summary.summary.maxHeartRate} BPM
                </p>
              )}
            </div>
            <HeartIcon className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">HR Range</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {summary.summary.minHeartRate && summary.summary.maxHeartRate
                  ? `${summary.summary.minHeartRate} - ${summary.summary.maxHeartRate}`
                  : 'N/A'}
              </p>
              {summary.summary.avgHeartRate && (
                <p className="text-xs text-gray-500 mt-1">Min - Max</p>
              )}
            </div>
            <ChartBarIcon className="h-12 w-12 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg HRV</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {summary.summary.avgHRV ? Math.round(summary.summary.avgHRV) : 'N/A'}
              </p>
              {summary.summary.avgHRV && (
                <p className="text-xs text-gray-500 mt-1">SDNN (ms)</p>
              )}
            </div>
            <ArrowTrendingUpIcon className="h-12 w-12 text-green-500" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {heartRateData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Heart Rate Trend */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Heart Rate Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={heartRateData}>
                <defs>
                  <linearGradient id="colorHR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="avgHR" stroke="#ef4444" fillOpacity={1} fill="url(#colorHR)" name="Avg HR (BPM)" />
                <Line type="monotone" dataKey="maxHR" stroke="#dc2626" strokeDasharray="5 5" name="Max HR" />
                <Line type="monotone" dataKey="minHR" stroke="#fca5a5" strokeDasharray="5 5" name="Min HR" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* HRV Trend */}
          {hrvData.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Heart Rate Variability (HRV)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={hrvData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="HRV" stroke="#10b981" strokeWidth={2} name="HRV (SDNN ms)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Session Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sessionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="sessions" fill="#3b82f6" name="Sessions" />
                <Bar yAxisId="right" dataKey="duration" fill="#8b5cf6" name="Duration (min)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Daily Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <DocumentTextIcon className="h-6 w-6 mr-2" />
          Daily ECG Health Report
        </h3>

        <div className="space-y-6">
          {summary.dailyBreakdown.map((day, index) => (
            <div key={index} className="border-l-4 border-gray-200 pl-6 relative">
              {/* Day Header */}
              <div className={`absolute left-0 top-0 w-4 h-4 rounded-full -ml-2 ${
                day.dayStatus === 'good' ? 'bg-green-500' :
                day.dayStatus === 'warning' ? 'bg-yellow-500' :
                day.dayStatus === 'critical' ? 'bg-red-500' : 'bg-gray-300'
              }`}></div>

              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {day.dayOfWeek}
                    </h4>
                    <p className="text-sm text-gray-600">{formatDate(day.date)}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getDayStatusColor(day.dayStatus)}`}>
                    {day.dayMessage}
                  </div>
                </div>
              </div>

              {/* Day Summary */}
              {day.sessionCount > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500">Sessions</p>
                      <p className="font-semibold text-gray-900">{day.sessionCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Avg HR</p>
                      <p className="font-semibold text-gray-900">
                        {day.avgHeartRate ? `${day.avgHeartRate} BPM` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">HR Range</p>
                      <p className="font-semibold text-gray-900">
                        {day.minHeartRate && day.maxHeartRate ? `${day.minHeartRate}-${day.maxHeartRate}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">HRV</p>
                      <p className="font-semibold text-gray-900">
                        {day.avgHRV ? `${day.avgHRV} ms` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Duration</p>
                      <p className="font-semibold text-gray-900">
                        {Math.round(day.totalDuration / 60)} min
                      </p>
                    </div>
                  </div>

                  {/* Session Details */}
                  <div className="space-y-2">
                    {day.sessions.map((session, sessionIndex) => (
                      <div key={sessionIndex} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="font-medium text-gray-900">
                                {formatTime(session.time)}
                              </span>
                              <span className="mx-2 text-gray-400">•</span>
                              <span className="text-gray-600 text-sm">
                                {session.name || `Session ${sessionIndex + 1}`}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center flex-wrap gap-4 text-sm">
                              {session.heartRate && (
                                <span className="text-gray-700">
                                  <strong>HR:</strong> {Math.round(session.heartRate)} BPM
                                </span>
                              )}
                              {session.classification && (
                                <span className="text-gray-700">
                                  <strong>Classification:</strong> {session.classification}
                                </span>
                              )}
                              {session.confidence && (
                                <span className="text-gray-700">
                                  <strong>Confidence:</strong> {Math.round(session.confidence * 100)}%
                                </span>
                              )}
                              {session.riskLevel && (
                                <span className={`font-semibold ${getRiskLevelColor(session.riskLevel)}`}>
                                  Risk: {session.riskLevel}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => navigate(`/report/${session.id}`)}
                            className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                          >
                            View Report
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 italic">No ECG sessions recorded on this day</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Health Insights */}
      {summary.insights && summary.insights.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Health Insights</h3>
          <div className="space-y-4">
            {summary.insights.map((insight, index) => {
              const isSuccess = insight.level === 'success';
              const isWarning = insight.level === 'warning';
              const isInfo = insight.level === 'info';

              return (
                <div
                  key={index}
                  className={`border-l-4 p-4 rounded-r-lg ${
                    isSuccess ? 'bg-green-50 border-green-500' :
                    isWarning ? 'bg-yellow-50 border-yellow-500' :
                    isInfo ? 'bg-blue-50 border-blue-500' :
                    'bg-gray-50 border-gray-500'
                  }`}
                >
                  <div className="flex items-start">
                    {isSuccess ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3 flex-shrink-0" />
                    ) : isWarning ? (
                      <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0" />
                    ) : (
                      <ChartBarIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" />
                    )}
                    <div>
                      <h4 className={`font-semibold ${
                        isSuccess ? 'text-green-900' :
                        isWarning ? 'text-yellow-900' :
                        isInfo ? 'text-blue-900' :
                        'text-gray-900'
                      }`}>
                        {insight.title}
                      </h4>
                      <p className={`mt-1 text-sm ${
                        isSuccess ? 'text-green-800' :
                        isWarning ? 'text-yellow-800' :
                        isInfo ? 'text-blue-800' :
                        'text-gray-800'
                      }`}>
                        {insight.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklySummary;
