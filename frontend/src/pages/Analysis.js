import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import {
  HeartIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

const Analysis = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSessions();
    if (sessionId) {
      fetchAnalysis(sessionId);
    }
  }, [sessionId]);

  const fetchSessions = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/sessions');
      setSessions(response.data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

  const fetchAnalysis = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`http://localhost:5001/api/analysis/hybrid/${id}`);
      setAnalysisResults(response.data.analysis);
      
      // Also fetch session details
      const sessionResponse = await axios.get(`http://localhost:5001/api/sessions/${id}`);
      setSelectedSession(sessionResponse.data);
      
    } catch (err) {
      console.error('Error fetching analysis:', err);
      setError(err.response?.data?.message || 'Failed to analyze session');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeSession = async (id) => {
    navigate(`/analysis/${id}`);
    fetchAnalysis(id);
  };

  const getRiskColor = (risk) => {
    switch(risk?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity) => {
    switch(severity?.toLowerCase()) {
      case 'high':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      case 'medium':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      default:
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
    }
  };

  // No session selected - show session list
  if (!sessionId || !analysisResults) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ECG Analysis</h1>
          <p className="mt-2 text-gray-600">
            AI-powered ECG analysis with arrhythmia detection
          </p>
        </div>

        <div className="medical-card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Select a Session to Analyze
          </h2>
          
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No sessions available for analysis</p>
              <button
                onClick={() => navigate('/monitor')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Record New Session
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Session
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Data Points
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {session.session_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {session.first_name} {session.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(session.start_time), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {session.data_points_count?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleAnalyzeSession(session.id)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Analyze
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {loading && (
          <div className="mt-4 medical-card text-center py-12">
            <ArrowPathIcon className="w-12 h-12 text-blue-600 mx-auto animate-spin mb-4" />
            <p className="text-gray-600">Analyzing ECG data...</p>
            <p className="text-sm text-gray-500 mt-2">
              This may take a few moments
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Analysis results view
  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/analysis')}
          className="mb-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Sessions
        </button>
        <h1 className="text-3xl font-bold text-gray-900">ECG Analysis Results</h1>
        {selectedSession && (
          <p className="mt-2 text-gray-600">
            {selectedSession.first_name} {selectedSession.last_name} •{' '}
            {format(new Date(selectedSession.start_time), 'MMMM dd, yyyy - hh:mm a')}
          </p>
        )}
      </div>

      {/* Overall Risk Assessment */}
      <div className="medical-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Overall Assessment</h2>
          <span className={`px-4 py-2 rounded-full font-semibold ${getRiskColor(analysisResults.overallRisk)}`}>
            {analysisResults.overallRisk?.toUpperCase()} RISK
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <HeartIcon className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Heart Rate</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {analysisResults.basicMetrics.heartRate} BPM
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ChartBarIcon className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">R-Peaks Detected</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {analysisResults.basicMetrics.rPeakCount}
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Signal Quality</span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {analysisResults.basicMetrics.signalQuality.score}%
            </p>
            <p className="text-sm text-green-700">
              {analysisResults.basicMetrics.signalQuality.status}
            </p>
          </div>
        </div>
      </div>

      {/* ML Classification */}
      <div className="medical-card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          AI Classification
        </h2>
        
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Diagnosis</p>
              <p className="text-2xl font-bold text-gray-900">
                {analysisResults.mlClassification?.diagnosis || 
                 analysisResults.mlClassification?.classification || 
                 'Unknown'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Confidence</p>
              <p className="text-2xl font-bold text-blue-600">
                {analysisResults.mlClassification?.confidence 
                  ? Math.round(analysisResults.mlClassification.confidence * 100) 
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detected Arrhythmias */}
      {analysisResults.arrhythmias && analysisResults.arrhythmias.length > 0 && (
        <div className="medical-card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Detected Abnormalities
          </h2>
          
          <div className="space-y-3">
            {analysisResults.arrhythmias.map((arr, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  arr.severity === 'high' 
                    ? 'bg-red-50 border-red-500' 
                    : arr.severity === 'medium'
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(arr.severity)}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{arr.type}</p>
                    <p className="text-sm text-gray-600 mt-1">{arr.description}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    arr.severity === 'high' 
                      ? 'bg-red-100 text-red-800' 
                      : arr.severity === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {arr.severity?.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heart Rate Variability */}
      <div className="medical-card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Heart Rate Variability (HRV)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">SDNN</p>
            <p className="text-xl font-bold text-gray-900">
              {Math.round(analysisResults.basicMetrics.hrv.sdnn || 0)} ms
            </p>
            <p className="text-xs text-gray-500 mt-1">Standard Deviation</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">RMSSD</p>
            <p className="text-xl font-bold text-gray-900">
              {Math.round(analysisResults.basicMetrics.hrv.rmssd || 0)} ms
            </p>
            <p className="text-xs text-gray-500 mt-1">Root Mean Square</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">pNN50</p>
            <p className="text-xl font-bold text-gray-900">
              {Math.round(analysisResults.basicMetrics.hrv.pnn50 || 0)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Successive Differences</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="medical-card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recommendations
        </h2>
        
        <div className="space-y-2">
          {analysisResults.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">{recommendation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Data Statistics */}
      <div className="medical-card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Session Statistics
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Data Points</p>
            <p className="text-lg font-semibold text-gray-900">
              {analysisResults.dataStats.totalPoints.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Duration</p>
            <p className="text-lg font-semibold text-gray-900">
              {Math.round(analysisResults.dataStats.duration)} seconds
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Sampling Rate</p>
            <p className="text-lg font-semibold text-gray-900">
              {analysisResults.dataStats.samplingRate} Hz
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Avg RR Interval</p>
            <p className="text-lg font-semibold text-gray-900">
              {Math.round(analysisResults.basicMetrics.avgRRInterval)} ms
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button 
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
          onClick={() => alert('PDF export coming soon!')}
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          Export Report
        </button>
        <button 
          className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
          onClick={() => navigate(`/sessions/${sessionId}`)}
        >
          View Full Session
        </button>
      </div>
    </div>
  );
};

export default Analysis;