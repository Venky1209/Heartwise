import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  HeartIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';

const RiskScoreDashboard = () => {
  const [riskData, setRiskData] = useState(null);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRiskData();
    fetchHistory();
    fetchAlerts();
  }, []);

  const fetchRiskData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/risk/latest');
      setRiskData(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No risk assessment yet');
      } else {
        setError('Failed to load risk data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get('/risk/history?days=90');
      setHistory(response.data.history || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/risk/alerts?status=unread&limit=5');
      setAlerts(response.data || []);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  const calculateRisk = async () => {
    try {
      setCalculating(true);
      setError(null);
      const response = await api.post('/risk/calculate');
      setRiskData(response.data.risk_score);
      await fetchHistory();
      await fetchAlerts();
    } catch (err) {
      setError('Failed to calculate risk score: ' + (err.response?.data?.error || err.message));
    } finally {
      setCalculating(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'low': return <ShieldCheckIcon className="h-8 w-8 text-green-600" />;
      case 'moderate': return <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />;
      case 'high': return <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />;
      case 'critical': return <HeartIcon className="h-8 w-8 text-red-600 animate-pulse" />;
      default: return <HeartIcon className="h-8 w-8 text-gray-600" />;
    }
  };

  const getRiskMeterColor = (score) => {
    if (score < 30) return '#10b981'; // green
    if (score < 50) return '#f59e0b'; // yellow
    if (score < 75) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const renderRiskMeter = () => {
    if (!riskData) return null;

    const score = riskData.overall_score;
    const percentage = score;
    const color = getRiskMeterColor(score);

    return (
      <div className="relative h-64 w-64 mx-auto">
        {/* Circular progress */}
        <svg className="transform -rotate-90 w-64 h-64">
          <circle
            cx="128"
            cy="128"
            r="110"
            stroke="currentColor"
            strokeWidth="16"
            fill="none"
            className="text-clinical-100"
          />
          <circle
            cx="128"
            cy="128"
            r="110"
            stroke={color}
            strokeWidth="16"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 110}`}
            strokeDashoffset={`${2 * Math.PI * 110 * (1 - percentage / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        {/* Score in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-6xl font-bold text-clinical-50">{score}</div>
          <div className="text-sm text-clinical-300 uppercase tracking-wide">Risk Score</div>
          <div className={`mt-2 px-4 py-1 rounded-full text-sm font-medium ${getRiskColor(riskData.risk_level)}`}>
            {riskData.risk_level.toUpperCase()}
          </div>
        </div>
      </div>
    );
  };

  const renderBreakdown = () => {
    if (!riskData) return null;

    const categories = [
      { name: 'ECG Metrics', score: riskData.ecg_risk_score, icon: HeartIcon, color: 'text-heart-500' },
      { name: 'Lifestyle', score: riskData.lifestyle_risk_score, icon: ArrowTrendingUpIcon, color: 'text-primary-500' },
      { name: 'Medical History', score: riskData.medical_history_risk_score, icon: ChartBarIcon, color: 'text-amber-500' },
      { name: 'Demographics', score: riskData.demographic_risk_score, icon: ClockIcon, color: 'text-purple-500' }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat, index) => {
          const Icon = cat.icon;
          return (
            <div key={index} className="bg-clinical-100 border border-clinical-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${cat.color}`} />
                  <span className="text-sm font-medium text-clinical-200">{cat.name}</span>
                </div>
                <span className="text-lg font-bold text-clinical-50">{cat.score}/100</span>
              </div>
              <div className="w-full bg-clinical-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-1000`}
                  style={{
                    width: `${cat.score}%`,
                    backgroundColor: getRiskMeterColor(cat.score)
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTimePredictions = () => {
    if (!riskData) return null;

    const predictions = [
      { label: '30 Days', value: riskData.risk_30_days, color: 'text-primary-400' },
      { label: '90 Days', value: riskData.risk_90_days, color: 'text-amber-400' },
      { label: '1 Year', value: riskData.risk_1_year, color: 'text-orange-400' }
    ];

    return (
      <div className="grid grid-cols-3 gap-4">
        {predictions.map((pred, index) => (
          <div key={index} className="bg-clinical-100 border border-clinical-200 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-clinical-50 mb-1">{pred.value}%</div>
            <div className={`text-sm font-medium ${pred.color}`}>{pred.label}</div>
            <div className="text-xs text-clinical-400 mt-1">Event Risk</div>
          </div>
        ))}
      </div>
    );
  };

  const renderRiskFactors = () => {
    if (!riskData) return null;

    const highRisk = JSON.parse(riskData.high_risk_factors || '[]');
    const moderateRisk = JSON.parse(riskData.moderate_risk_factors || '[]');
    const protective = JSON.parse(riskData.protective_factors || '[]');

    return (
      <div className="space-y-4">
        {highRisk.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-red-400 mb-2">🚨 High Risk Factors</h4>
            <div className="space-y-2">
              {highRisk.map((factor, index) => (
                <div key={index} className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-clinical-50">{factor.factor}</div>
                      <div className="text-sm text-clinical-300">{factor.value}</div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded">
                      {factor.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {moderateRisk.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-amber-400 mb-2">⚠️ Moderate Risk Factors</h4>
            <div className="space-y-2">
              {moderateRisk.map((factor, index) => (
                <div key={index} className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-clinical-50">{factor.factor}</div>
                      <div className="text-sm text-clinical-300">{factor.value}</div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded">
                      {factor.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {protective.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-green-400 mb-2">✅ Protective Factors</h4>
            <div className="space-y-2">
              {protective.map((factor, index) => (
                <div key={index} className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-clinical-50">{factor.factor}</div>
                      <div className="text-sm text-clinical-300">{factor.value}</div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                      {factor.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRecommendations = () => {
    if (!riskData) return null;

    const recommendations = JSON.parse(riskData.recommendations || '[]');

    return (
      <div className="space-y-3">
        {recommendations.map((rec, index) => {
          const priorityColors = {
            critical: 'bg-red-500/20 border-red-500 text-red-400',
            high: 'bg-orange-500/20 border-orange-500 text-orange-400',
            medium: 'bg-amber-500/20 border-amber-500 text-amber-400',
            low: 'bg-primary-500/20 border-primary-500 text-primary-400'
          };

          return (
            <div key={index} className="bg-clinical-100 border border-clinical-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <LightBulbIcon className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full border ${priorityColors[rec.priority]}`}>
                      {rec.priority.toUpperCase()}
                    </span>
                    <span className="text-xs text-clinical-400">{rec.timeframe}</span>
                  </div>
                  <p className="text-sm text-clinical-200 mb-2">{rec.action}</p>
                  <div className="flex items-center gap-2 text-xs text-clinical-400">
                    <ArrowTrendingDownIcon className="h-4 w-4 text-green-400" />
                    <span>Expected impact: -{rec.expected_impact} points</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTrendChart = () => {
    if (history.length < 2) return null;

    const chartData = {
      labels: history.slice().reverse().map(h => new Date(h.calculated_at).toLocaleDateString()),
      datasets: [{
        label: 'Risk Score',
        data: history.slice().reverse().map(h => h.overall_score),
        borderColor: '#14B8A6',
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: {
            color: '#374151'
          },
          ticks: {
            color: '#9CA3AF'
          }
        },
        x: {
          grid: {
            color: '#374151'
          },
          ticks: {
            color: '#9CA3AF'
          }
        }
      }
    };

    return (
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-clinical-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-clinical-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-clinical-50 mb-2">Cardiac Risk Assessment</h1>
            <p className="text-clinical-300">AI-powered predictive risk scoring</p>
          </div>
          <button
            onClick={calculateRisk}
            disabled={calculating}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {calculating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Calculating...
              </>
            ) : (
              <>
                <ChartBarIcon className="h-5 w-5" />
                {riskData ? 'Recalculate Risk' : 'Calculate Risk Score'}
              </>
            )}
          </button>
        </div>

        {error && !riskData && (
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-400">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <p>{error}</p>
            </div>
            <p className="text-clinical-300 mt-2 text-sm">
              Complete your profile and record ECG sessions to get your personalized risk assessment.
            </p>
          </div>
        )}

        {riskData && (
          <>
            {/* Main Risk Score */}
            <div className="bg-clinical-800 border border-clinical-700 rounded-xl p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  {renderRiskMeter()}
                  <div className="text-center mt-4 text-sm text-clinical-400">
                    Last calculated: {new Date(riskData.calculated_at).toLocaleString()}
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-clinical-200 mb-4">Time-based Predictions</h3>
                    {renderTimePredictions()}
                  </div>
                  <div className="text-sm text-clinical-400">
                    <p>Model confidence: {(parseFloat(riskData.confidence_score) * 100).toFixed(1)}%</p>
                    <p>Version: {riskData.model_version}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Breakdown */}
            <div className="bg-clinical-800 border border-clinical-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-clinical-200 mb-4">Risk Score Breakdown</h3>
              {renderBreakdown()}
            </div>

            {/* Trend Chart */}
            {history.length >= 2 && (
              <div className="bg-clinical-800 border border-clinical-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-clinical-200 mb-4">Risk Score Trend</h3>
                {renderTrendChart()}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risk Factors */}
              <div className="bg-clinical-800 border border-clinical-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-clinical-200 mb-4">Risk Factors</h3>
                {renderRiskFactors()}
              </div>

              {/* Recommendations */}
              <div className="bg-clinical-800 border border-clinical-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-clinical-200 mb-4">Personalized Recommendations</h3>
                {renderRecommendations()}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RiskScoreDashboard;
