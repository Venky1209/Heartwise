import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { format } from 'date-fns';
import {
  PrinterIcon,
  DocumentArrowDownIcon,
  ArrowLeftIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

const ECGReport = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, [sessionId]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch session data
      const sessionResponse = await api.get(`/sessions/${sessionId}`);
      const session = sessionResponse.data;
      
      // Fetch analysis
      const analysisResponse = await api.post(`/analysis/hybrid/${sessionId}`);
      const analysis = analysisResponse.data.analysis;
      
      // Fetch ECG data for waveform
      const ecgResponse = await api.get(`/ecg-data/${sessionId}?limit=2500`);
      const ecgData = ecgResponse.data;
      
      setReportData({
        session,
        analysis,
        ecgData
      });
      
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF generation
    alert('PDF download will be implemented');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating ECG Report...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error || 'No data available'}</p>
          <button
            onClick={() => navigate('/analysis')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Analysis
          </button>
        </div>
      </div>
    );
  }

  const { session, analysis, ecgData } = reportData;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Print Controls - Hidden when printing */}
      <div className="no-print bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/analysis')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Analysis
        </button>
        
        <div className="flex space-x-3">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
            Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <PrinterIcon className="w-5 h-5 mr-2" />
            Print Report
          </button>
        </div>
      </div>

      {/* ECG Report - Professional Medical Format */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden ecg-report">
          
          {/* Report Header */}
          <div className="border-b-2 border-gray-800 p-6 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <HeartIcon className="w-8 h-8 text-red-600 mr-3" />
                  <h1 className="text-3xl font-bold text-gray-900">HeartWise ECG Report</h1>
                </div>
                <p className="text-sm text-gray-600">Professional ECG Monitoring System</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {format(new Date(session.start_time), 'MMM dd, yyyy')}
                </p>
                <p className="text-sm text-gray-600">
                  {format(new Date(session.start_time), 'HH:mm:ss')}
                </p>
              </div>
            </div>
          </div>

          {/* Patient & Recording Information */}
          <div className="grid grid-cols-2 gap-6 p-6 bg-gray-50 border-b">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Patient Information</h2>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="font-medium text-gray-700 w-32">Name:</span>
                  <span className="text-gray-900">{session.first_name} {session.last_name}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-gray-700 w-32">Gender:</span>
                  <span className="text-gray-900">{session.gender || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-gray-700 w-32">Date of Birth:</span>
                  <span className="text-gray-900">
                    {session.date_of_birth ? format(new Date(session.date_of_birth), 'MMM dd, yyyy') : 'N/A'}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-medium text-gray-700 w-32">Patient ID:</span>
                  <span className="text-gray-900 font-mono text-xs">{session.patient_id}</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Recording Information</h2>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="font-medium text-gray-700 w-32">Session ID:</span>
                  <span className="text-gray-900 font-mono text-xs">{session.id}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-gray-700 w-32">Device:</span>
                  <span className="text-gray-900">{session.device_name || 'HeartWise ESP32'}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-gray-700 w-32">Duration:</span>
                  <span className="text-gray-900">{session.duration_seconds || 0} seconds</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-gray-700 w-32">Sample Rate:</span>
                  <span className="text-gray-900">250 Hz</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-gray-700 w-32">Data Points:</span>
                  <span className="text-gray-900">{session.data_points_count?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Measurements - Grid Layout */}
          <div className="grid grid-cols-4 gap-4 p-6 bg-white border-b-2 border-gray-300">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-600 mb-1">Heart Rate</p>
              <p className="text-3xl font-bold text-blue-600">
                {analysis.basicMetrics?.heartRate || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">BPM</p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-gray-600 mb-1">Rhythm</p>
              <p className="text-lg font-semibold text-green-600">
                {analysis.aiDiagnosis?.rhythm || 'Unknown'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Classification</p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-gray-600 mb-1">QRS Count</p>
              <p className="text-3xl font-bold text-purple-600">
                {analysis.basicMetrics?.rPeakCount || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Beats</p>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-xs text-gray-600 mb-1">Signal Quality</p>
              <p className="text-3xl font-bold text-yellow-600">
                {analysis.basicMetrics?.signalQuality?.score || 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Quality</p>
            </div>
          </div>

          {/* AI Diagnosis Section */}
          <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-b-2 border-gray-300">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="bg-purple-600 text-white px-3 py-1 rounded-md mr-3">AI Analysis</span>
              {analysis.metadata?.analysisMethod === 'ensemble' ? '🚀 Advanced Ensemble Classifier' : 
               analysis.metadata?.analysisMethod === 'deep_learning' ? '🧠 Deep Learning Model' : 
               '📊 Rule-Based Analysis'}
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-600">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">Primary Diagnosis</h3>
                <p className="text-3xl font-bold text-purple-600 mb-2">
                  {analysis.mlClassification?.classification || analysis.aiDiagnosis?.classification || 'Unknown'}
                </p>
                <div className="flex items-center mt-3">
                  <span className="text-sm text-gray-600 mr-2">Confidence:</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full"
                      style={{ width: `${(analysis.mlClassification?.confidence || 0) * 100}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm font-semibold text-purple-600">
                    {Math.round((analysis.mlClassification?.confidence || 0) * 100)}%
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-600">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">Risk Assessment</h3>
                <p className={`text-3xl font-bold mb-2 ${
                  analysis.overallRisk === 'high' ? 'text-red-600' :
                  analysis.overallRisk === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {(analysis.overallRisk || 'low').toUpperCase()}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Based on comprehensive AI analysis of ECG patterns, heart rate variability, and rhythm characteristics.
                </p>
              </div>
            </div>
          </div>

          {/* HRV Metrics */}
          {analysis.basicMetrics?.hrv && (
            <div className="p-6 bg-gray-50 border-b">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Heart Rate Variability (HRV)</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-600 mb-1">SDNN</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {(analysis.basicMetrics.hrv.SDNN || analysis.basicMetrics.hrv.sdnn || 0)?.toFixed(1)} <span className="text-sm">ms</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Standard Deviation</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-600 mb-1">RMSSD</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(analysis.basicMetrics.hrv.RMSSD || analysis.basicMetrics.hrv.rmssd || 0)?.toFixed(1)} <span className="text-sm">ms</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Root Mean Square</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-600 mb-1">pNN50</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {(analysis.basicMetrics.hrv.pNN50 || analysis.basicMetrics.hrv.pnn50 || 0)?.toFixed(1)} <span className="text-sm">%</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">NN50 Percentage</p>
                </div>
              </div>
            </div>
          )}

          {/* Abnormalities Detected */}
          {analysis.aiDiagnosis?.abnormalities && analysis.aiDiagnosis.abnormalities.length > 0 && (
            <div className="p-6 bg-red-50 border-b border-red-200">
              <h2 className="text-xl font-bold text-red-900 mb-4 flex items-center">
                ⚠️ Detected Abnormalities
              </h2>
              <div className="space-y-3">
                {analysis.aiDiagnosis.abnormalities.map((abnormality, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{abnormality.type}</h3>
                        <p className="text-sm text-gray-700 mt-1">{abnormality.description}</p>
                        <p className="text-xs text-gray-600 mt-2 italic">{abnormality.recommendation}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        abnormality.severity === 'High' ? 'bg-red-100 text-red-800' :
                        abnormality.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {abnormality.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations && (
            <div className="p-6 bg-blue-50 border-b border-blue-200">
              <h2 className="text-xl font-bold text-blue-900 mb-4">Clinical Recommendations</h2>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-800 whitespace-pre-line">
                  {Array.isArray(analysis.recommendations) 
                    ? analysis.recommendations.join('\n') 
                    : analysis.recommendations}
                </p>
              </div>
            </div>
          )}

          {/* Report Footer */}
          <div className="p-6 bg-gray-100 border-t-2 border-gray-800">
            <div className="grid grid-cols-2 gap-6 text-xs text-gray-600">
              <div>
                <p className="font-semibold mb-2">Analysis Details:</p>
                <p>Analysis Method: {analysis.metadata?.analysisMethod || 'Unknown'}</p>
                <p>Model Version: {analysis.metadata?.modelVersion || 'v1.0'}</p>
                <p>Analysis Engine: {analysis.metadata?.analysisEngine || 'Hybrid'}</p>
              </div>
              <div>
                <p className="font-semibold mb-2">Report Information:</p>
                <p>Generated: {format(new Date(), 'MMM dd, yyyy HH:mm:ss')}</p>
                <p>Report ID: {session.id?.substring(0, 8)}</p>
                <p className="mt-2 italic">This report is generated by HeartWise AI-powered ECG analysis system.</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .ecg-report {
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ECGReport;
