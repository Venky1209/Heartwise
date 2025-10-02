import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SessionDetail = () => {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [ecgData, setEcgData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      // Fetch session metadata
      const sessionResponse = await axios.get(`http://localhost:5001/api/sessions/${sessionId}`);
      setSession(sessionResponse.data);

      // Fetch ECG data
      const ecgResponse = await axios.get(`http://localhost:5001/api/ecg-data/${sessionId}`);
      setEcgData(ecgResponse.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching session data:', err);
      setError('Failed to load session data');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const seconds = Math.floor((end - start) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const prepareChartData = () => {
    if (!ecgData || ecgData.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'ECG Signal',
          data: [],
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 1,
          pointRadius: 0,
          tension: 0,
        }]
      };
    }

    // Convert timestamps to relative time in seconds
    const startTime = ecgData[0].timestamp_ms || new Date(ecgData[0].created_at).getTime();
    const labels = ecgData.map(point => {
      const pointTime = point.timestamp_ms || new Date(point.created_at).getTime();
      return ((pointTime - startTime) / 1000).toFixed(2);
    });
    const voltages = ecgData.map(point => (point.voltage_mv || point.voltage) / 1000); // Convert to mV

    return {
      labels,
      datasets: [{
        label: 'ECG Signal (mV)',
        data: voltages,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        pointRadius: 0,
        tension: 0,
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: 'ECG Waveform',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time (seconds)',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        ticks: {
          maxTicksLimit: 20,
          callback: function(value, index) {
            return parseFloat(this.getLabelForValue(value)).toFixed(1);
          }
        },
        grid: {
          color: 'rgba(220, 38, 38, 0.1)',
        }
      },
      y: {
        title: {
          display: true,
          text: 'Voltage (mV)',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(220, 38, 38, 0.1)',
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <button
            onClick={() => navigate('/sessions')}
            className="mb-4 text-blue-600 hover:text-blue-800"
          >
            ← Back to Sessions
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Session Details</h1>
        </div>
        <div className="medical-card text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session data...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <button
            onClick={() => navigate('/sessions')}
            className="mb-4 text-blue-600 hover:text-blue-800"
          >
            ← Back to Sessions
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Session Details</h1>
        </div>
        <div className="medical-card text-center py-12">
          <p className="text-red-600">{error || 'Session not found'}</p>
          <button 
            onClick={() => navigate('/sessions')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="mb-8">
        <button
          onClick={() => navigate('/sessions')}
          className="mb-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Sessions
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Session Details</h1>
        <p className="mt-2 text-gray-600">
          {format(new Date(session.start_time), 'MMMM dd, yyyy - hh:mm a')}
        </p>
      </div>

      {/* Session Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="medical-card">
          <h3 className="text-sm font-medium text-gray-500">Patient</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {session.first_name && session.last_name 
              ? `${session.first_name} ${session.last_name}` 
              : 'Unknown'}
          </p>
        </div>
        <div className="medical-card">
          <h3 className="text-sm font-medium text-gray-500">Duration</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {formatDuration(session.start_time, session.end_time)}
          </p>
        </div>
        <div className="medical-card">
          <h3 className="text-sm font-medium text-gray-500">Data Points</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {ecgData.length.toLocaleString()}
          </p>
        </div>
        <div className="medical-card">
          <h3 className="text-sm font-medium text-gray-500">Device</h3>
          <p className="mt-2 text-lg font-semibold text-gray-900 truncate">
            {session.device_id || 'N/A'}
          </p>
        </div>
      </div>

      {/* ECG Chart */}
      <div className="medical-card">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">ECG Waveform</h2>
          <button
            onClick={() => navigate(`/analysis/${sessionId}`)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Run Analysis
          </button>
        </div>
        <div style={{ height: '500px' }}>
          {ecgData.length > 0 ? (
            <Line data={prepareChartData()} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No ECG data available for this session</p>
            </div>
          )}
        </div>
      </div>

      {/* Session Status */}
      <div className="medical-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-500">Status:</span>
            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${
              session.is_completed 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {session.is_completed ? 'Completed' : 'In Progress'}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-500">Session ID:</span>
            <span className="ml-2 text-sm font-mono text-gray-700">{session.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDetail;